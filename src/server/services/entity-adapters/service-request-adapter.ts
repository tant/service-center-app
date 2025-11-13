/**
 * Service Request Entity Adapter
 *
 * Handles task lifecycle events for service requests (public-facing intake).
 * Implements auto-progression logic for request processing and ticket creation.
 *
 * @module entity-adapters/service-request
 */

import type { TRPCContext } from "../../trpc";
import {
  BaseEntityAdapter,
  type TaskContext,
  type CanStartResult,
  type CanAssignWorkflowResult,
} from "./base-adapter";

/**
 * Service Request Adapter Implementation
 *
 * Auto-progression rules:
 * - Tasks for request validation, customer contact, product receipt
 * - Once request is 'received', service tickets are auto-created (via trigger)
 * - Status changes: received → pickingup → received → processing → completed
 * - Auto-completes when all service tickets resolved
 *
 * @example
 * ```typescript
 * const adapter = new ServiceRequestAdapter();
 * await adapter.onTaskComplete(ctx, taskId);
 * // → Auto-updates request status if all tasks complete
 * ```
 */
export class ServiceRequestAdapter extends BaseEntityAdapter {
  readonly entityType = "service_request" as const;

  /**
   * Check if task can be started
   *
   * Rules:
   * - Request must be in 'received' or 'processing' status
   * - Cannot start tasks on completed/cancelled requests
   * - Draft requests cannot have tasks yet
   */
  async canStartTask(
    ctx: TRPCContext,
    taskId: string
  ): Promise<CanStartResult> {
    const task = await this.getTask(ctx, taskId);

    // Get request details
    const { data: request } = await ctx.supabaseAdmin
      .from("service_requests")
      .select("id, tracking_token, status, receipt_status")
      .eq("id", task.entity_id)
      .single();

    if (!request) {
      return {
        canStart: false,
        reason: "Không tìm thấy yêu cầu dịch vụ",
      };
    }

    // Cannot start tasks on draft requests (not submitted yet)
    if (request.status === "draft") {
      return {
        canStart: false,
        reason: "Không thể thực hiện task cho yêu cầu chưa gửi",
      };
    }

    // Cannot start tasks on completed/cancelled requests
    if (request.status === "completed" || request.status === "cancelled") {
      return {
        canStart: false,
        reason: `Không thể thực hiện task cho yêu cầu đã ${
          request.status === "completed" ? "hoàn thành" : "hủy"
        }`,
      };
    }

    // If task already in progress or completed, allow (idempotent)
    if (task.status === "in_progress" || task.status === "completed") {
      return { canStart: true };
    }

    // Check sequence dependencies (if workflow has strict_sequence = true)
    const dependenciesMet = await this.areDependenciesMet(ctx, taskId);
    if (!dependenciesMet) {
      return {
        canStart: false,
        reason: "Phải hoàn thành các công việc trước đó theo thứ tự",
      };
    }

    return { canStart: true };
  }

  /**
   * Called when a task is started
   *
   * Log task start for audit purposes.
   */
  async onTaskStart(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    console.log(
      `[ServiceRequest] Task started: ${task.name} for request ${task.entity_id}`
    );
  }

  /**
   * Called when a task is completed
   *
   * Auto-progression logic:
   * - Check if all required tasks are complete
   * - Check if all linked service tickets are resolved
   * - If yes, transition request to 'completed'
   */
  async onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Check if all required tasks are complete
    const allTasksComplete = await this.areAllRequiredTasksComplete(
      ctx,
      task.entity_id
    );

    if (allTasksComplete) {
      // Get request to check current status
      const { data: request } = await ctx.supabaseAdmin
        .from("service_requests")
        .select(
          `
          id,
          tracking_token,
          status,
          workflow_id,
          receipt_status,
          service_request_items(
            id,
            ticket_id,
            service_tickets(id, status)
          )
        `
        )
        .eq("id", task.entity_id)
        .single();

      if (!request) {
        return;
      }

      // ====== TRIGGER TICKET CREATION AFTER WORKFLOW COMPLETE ======
      // If workflow exists and status is 'received', trigger auto-create tickets
      if (request.workflow_id && request.status === 'received') {
        // Update receipt_status to 'received' to trigger auto_create_tickets_on_received()
        const { error: updateError } = await ctx.supabaseAdmin
          .from("service_requests")
          .update({
            receipt_status: 'received',
            // Status will be updated to 'processing' by the trigger
          })
          .eq("id", task.entity_id);

        if (updateError) {
          console.error(
            `[ServiceRequest] Failed to trigger ticket creation for ${request.tracking_token}:`,
            updateError
          );
        } else {
          console.log(
            `[ServiceRequest] Workflow complete for ${request.tracking_token}, triggered ticket creation`
          );
        }

        // Don't continue to ticket check logic below (tickets don't exist yet)
        return;
      }
      // ====== END TICKET CREATION TRIGGER ======

      // Check if all linked service tickets are completed
      const items = request.service_request_items || [];
      const allTicketsResolved = items.every((item: any) => {
        if (!item.ticket_id) return false; // Ticket not created yet
        const ticket = Array.isArray(item.service_tickets)
          ? item.service_tickets[0]
          : item.service_tickets;
        return (
          ticket &&
          (ticket.status === "completed" || ticket.status === "cancelled")
        );
      });

      // Only auto-complete if request is processing AND all tickets resolved AND all tasks done
      if (
        request.status === "processing" &&
        allTicketsResolved &&
        items.length > 0
      ) {
        await ctx.supabaseAdmin
          .from("service_requests")
          .update({ status: "completed" })
          .eq("id", task.entity_id);

        console.log(
          `[ServiceRequest] Auto-completed request ${request.tracking_token}`
        );
      } else if (request.status === "processing" && !allTicketsResolved) {
        console.log(
          `[ServiceRequest] Tasks complete but waiting for ${items.length} service tickets to resolve`
        );
      }
    }
  }

  /**
   * Called when a task is blocked
   *
   * Important for service requests as they often require customer contact.
   */
  async onTaskBlock(
    ctx: TRPCContext,
    taskId: string,
    reason: string
  ): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Log to audit logs
    await ctx.supabaseAdmin.from("audit_logs").insert({
      action: "task_blocked",
      entity_type: "service_request",
      entity_id: task.entity_id,
      details: {
        task_id: taskId,
        task_name: task.name,
        reason: reason,
      },
      performed_by: task.assigned_to_id,
    });

    console.log(
      `[ServiceRequest] Task blocked: ${task.name} - Reason: ${reason}`
    );
  }

  /**
   * Get entity context for task display
   *
   * Fetches request details and formats for UI rendering.
   */
  async getEntityContext(
    ctx: TRPCContext,
    entityId: string
  ): Promise<TaskContext> {
    const { data: request, error } = await ctx.supabaseAdmin
      .from("service_requests")
      .select(
        `
        id,
        tracking_token,
        status,
        receipt_status,
        customer_name,
        customer_phone,
        created_at,
        service_request_items(
          id,
          serial_number
        )
      `
      )
      .eq("id", entityId)
      .single();

    if (error || !request) {
      throw new Error(`Service request not found: ${entityId}`);
    }

    const itemCount = request.service_request_items?.length || 0;

    // Determine priority based on status and age
    let priority: "low" | "normal" | "high" | "urgent" = "normal";
    const createdAt = new Date(request.created_at);
    const ageInDays = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (request.status === "pickingup" && ageInDays > 3) {
      priority = "high"; // Waiting for customer pickup > 3 days
    } else if (request.status === "received" && request.receipt_status !== "received") {
      priority = "urgent"; // Products received but not confirmed
    } else if (request.status === "processing") {
      priority = "high"; // Active processing
    }

    return {
      entityId: request.id,
      entityType: "service_request",
      title: `Yêu cầu dịch vụ ${request.tracking_token}`,
      subtitle: `${request.customer_name} - ${itemCount} sản phẩm`,
      status: request.status,
      priority: priority,
      url: `/operations/service-requests/${request.id}`,
      metadata: {
        trackingToken: request.tracking_token,
        customerName: request.customer_name,
        customerPhone: request.customer_phone,
        itemCount: itemCount,
        receiptStatus: request.receipt_status,
      },
    };
  }

  /**
   * Validate if workflow can be assigned to service request
   *
   * Ensures workflow is for service_request entity type.
   */
  async canAssignWorkflow(
    ctx: TRPCContext,
    entityId: string,
    workflowId: string
  ): Promise<CanAssignWorkflowResult> {
    const { data: request } = await ctx.supabaseAdmin
      .from("service_requests")
      .select("id, status")
      .eq("id", entityId)
      .single();

    if (!request) {
      return {
        canAssign: false,
        reason: "Không tìm thấy yêu cầu dịch vụ",
      };
    }

    // Cannot assign workflow to completed/cancelled requests
    if (request.status === "completed" || request.status === "cancelled") {
      return {
        canAssign: false,
        reason: `Không thể thay đổi quy trình cho yêu cầu đã ${
          request.status === "completed" ? "hoàn thành" : "hủy"
        }`,
      };
    }

    const { data: workflow } = await ctx.supabaseAdmin
      .from("workflows")
      .select("id, name, entity_type")
      .eq("id", workflowId)
      .single();

    if (!workflow) {
      return {
        canAssign: false,
        reason: "Không tìm thấy quy trình",
      };
    }

    // Check entity_type matches
    if (
      workflow.entity_type &&
      workflow.entity_type !== "service_request"
    ) {
      return {
        canAssign: false,
        reason: `Quy trình này dành cho ${workflow.entity_type}, không phù hợp với yêu cầu dịch vụ`,
      };
    }

    return { canAssign: true };
  }
}
