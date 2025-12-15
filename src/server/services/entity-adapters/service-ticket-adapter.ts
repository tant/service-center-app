/**
 * Service Ticket Entity Adapter
 *
 * Handles task lifecycle events for service tickets.
 * Implements auto-progression logic when all tasks are complete.
 *
 * @module entity-adapters/service-ticket
 */

import type { TRPCContext } from "../../trpc";
import {
  BaseEntityAdapter,
  type TaskContext,
  type CanStartResult,
  type CanAssignWorkflowResult,
} from "./base-adapter";

/**
 * Service Ticket Adapter Implementation
 *
 * Auto-progression rules:
 * - When first task starts: ticket status → 'in_progress'
 * - When all required tasks complete: ticket status → 'completed'
 * - Respects workflow strict_sequence setting
 *
 * @example
 * ```typescript
 * const adapter = new ServiceTicketAdapter();
 * await adapter.onTaskComplete(ctx, taskId);
 * // → Auto-updates ticket status if all tasks done
 * ```
 */
export class ServiceTicketAdapter extends BaseEntityAdapter {
  readonly entityType = "service_ticket" as const;

  /**
   * Check if task can be started based on workflow sequence rules
   *
   * If workflow has strict_sequence=true, validates that all previous
   * required tasks are complete before allowing this task to start.
   */
  async canStartTask(
    ctx: TRPCContext,
    taskId: string,
  ): Promise<CanStartResult> {
    const task = await this.getTask(ctx, taskId);

    // Check if ticket is in a terminal state
    const { data: ticket } = await ctx.supabaseAdmin
      .from("service_tickets")
      .select("id, status, workflow_id, workflows(strict_sequence)")
      .eq("id", task.entity_id)
      .single();

    if (!ticket) {
      return {
        canStart: false,
        reason: "Không tìm thấy phiếu sửa chữa",
      };
    }

    // Cannot start tasks on completed/cancelled tickets
    if (ticket.status === "completed" || ticket.status === "cancelled") {
      return {
        canStart: false,
        reason: `Không thể thực hiện task cho phiếu đã ${
          ticket.status === "completed" ? "hoàn thành" : "hủy"
        }`,
      };
    }

    // If task already in progress or completed, allow (idempotent)
    if (task.status === "in_progress" || task.status === "completed") {
      return { canStart: true };
    }

    // Check workflow sequence enforcement
    const workflow = Array.isArray(ticket.workflows)
      ? ticket.workflows[0]
      : ticket.workflows;

    const enforceSequence = workflow?.strict_sequence ?? false;

    if (!enforceSequence) {
      return { canStart: true };
    }

    // Check if all previous required tasks are complete
    const { data: previousTasks } = await ctx.supabaseAdmin
      .from("entity_tasks")
      .select("id, name, status, is_required")
      .eq("entity_id", task.entity_id)
      .eq("entity_type", "service_ticket")
      .lt("sequence_order", task.sequence_order)
      .neq("status", "skipped");

    const incompleteTasks =
      previousTasks?.filter((t) => t.status !== "completed" && t.is_required) ||
      [];

    if (incompleteTasks.length > 0) {
      return {
        canStart: false,
        reason: `Phải hoàn thành ${incompleteTasks.length} công việc trước đó: ${incompleteTasks
          .map((t) => t.name)
          .join(", ")}`,
      };
    }

    return { canStart: true };
  }

  /**
   * Called when a task is started
   *
   * Auto-updates ticket status to 'in_progress' if it's still 'pending'
   */
  async onTaskStart(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Update ticket status to in_progress if currently pending
    const { data: ticket } = await ctx.supabaseAdmin
      .from("service_tickets")
      .select("id, status")
      .eq("id", task.entity_id)
      .single();

    if (ticket?.status === "pending") {
      await ctx.supabaseAdmin
        .from("service_tickets")
        .update({
          status: "in_progress",
          updated_by: task.assigned_to_id, // Set updated_by for trigger
        })
        .eq("id", task.entity_id);

      // Log status change in comments
      await ctx.supabaseAdmin.from("service_ticket_comments").insert({
        ticket_id: task.entity_id,
        comment: `Bắt đầu thực hiện: ${task.name}`,
        comment_type: "status_change",
        is_internal: true,
        created_by: task.assigned_to_id,
      });
    }
  }

  /**
   * Called when a task is completed
   *
   * Sets tasks_completed_at when all required tasks done.
   * Does NOT auto-transition status - user must select outcome first.
   */
  async onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Check if all required tasks are complete
    const allComplete = await this.areAllRequiredTasksComplete(
      ctx,
      task.entity_id,
    );

    if (allComplete) {
      // Get ticket to check current status and tasks_completed_at
      const { data: ticket } = await ctx.supabaseAdmin
        .from("service_tickets")
        .select("id, status, tasks_completed_at")
        .eq("id", task.entity_id)
        .single();

      // Only mark tasks complete if ticket is in_progress and not already marked
      if (ticket?.status === "in_progress" && !ticket.tasks_completed_at) {
        await ctx.supabaseAdmin
          .from("service_tickets")
          .update({
            tasks_completed_at: new Date().toISOString(),
            updated_by: task.assigned_to_id,
          })
          .eq("id", task.entity_id);

        // Log completion notice in comments
        await ctx.supabaseAdmin.from("service_ticket_comments").insert({
          ticket_id: task.entity_id,
          comment:
            "Tất cả công việc đã hoàn thành. Vui lòng chọn kết quả xử lý để tiếp tục.",
          comment_type: "system",
          is_internal: true,
          created_by: task.assigned_to_id,
        });
      }
    }
  }

  /**
   * Called when a task is blocked
   *
   * Logs the blocking event in ticket comments for visibility.
   */
  async onTaskBlock(
    ctx: TRPCContext,
    taskId: string,
    reason: string,
  ): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Log blocking in ticket comments
    await ctx.supabaseAdmin.from("service_ticket_comments").insert({
      ticket_id: task.entity_id,
      comment: `Công việc bị chặn: ${task.name}\nLý do: ${reason}`,
      comment_type: "system",
      is_internal: true,
      created_by: task.assigned_to_id,
    });
  }

  /**
   * Get entity context for task display
   *
   * Fetches ticket details and formats for UI rendering.
   */
  async getEntityContext(
    ctx: TRPCContext,
    entityId: string,
  ): Promise<TaskContext> {
    const { data: ticket, error } = await ctx.supabaseAdmin
      .from("service_tickets")
      .select(
        `
        id,
        ticket_number,
        status,
        priority,
        created_at,
        customer:customers(
          id,
          full_name,
          phone
        ),
        product:products(
          id,
          name
        )
      `,
      )
      .eq("id", entityId)
      .single();

    if (error || !ticket) {
      throw new Error(`Service ticket not found: ${entityId}`);
    }

    const customer = Array.isArray(ticket.customer)
      ? ticket.customer[0]
      : ticket.customer;
    const product = Array.isArray(ticket.product)
      ? ticket.product[0]
      : ticket.product;

    return {
      entityId: ticket.id,
      entityType: "service_ticket",
      title: `Phiếu sửa chữa ${ticket.ticket_number}`,
      subtitle: customer
        ? `${customer.full_name} - ${product?.name || "N/A"}`
        : undefined,
      status: ticket.status,
      priority: ticket.priority,
      url: `/operations/tickets/${ticket.id}`,
      metadata: {
        ticketNumber: ticket.ticket_number,
        customerPhone: customer?.phone,
        productName: product?.name,
      },
    };
  }

  /**
   * Validate if workflow can be assigned to ticket
   *
   * Ensures workflow's service_type matches ticket's warranty_type.
   */
  async canAssignWorkflow(
    ctx: TRPCContext,
    entityId: string,
    workflowId: string,
  ): Promise<CanAssignWorkflowResult> {
    const { data: ticket } = await ctx.supabaseAdmin
      .from("service_tickets")
      .select("id, warranty_type, status")
      .eq("id", entityId)
      .single();

    if (!ticket) {
      return {
        canAssign: false,
        reason: "Không tìm thấy phiếu sửa chữa",
      };
    }

    // Cannot assign workflow to completed/cancelled tickets
    if (ticket.status === "completed" || ticket.status === "cancelled") {
      return {
        canAssign: false,
        reason: `Không thể thay đổi quy trình cho phiếu đã ${
          ticket.status === "completed" ? "hoàn thành" : "hủy"
        }`,
      };
    }

    const { data: workflow } = await ctx.supabaseAdmin
      .from("workflows")
      .select("id, name, service_type, entity_type")
      .eq("id", workflowId)
      .single();

    if (!workflow) {
      return {
        canAssign: false,
        reason: "Không tìm thấy quy trình",
      };
    }

    // Check entity_type matches (must be service_ticket or null for legacy)
    if (workflow.entity_type && workflow.entity_type !== "service_ticket") {
      return {
        canAssign: false,
        reason: `Quy trình này dành cho ${workflow.entity_type}, không phù hợp với phiếu sửa chữa`,
      };
    }

    // Check service_type compatibility (if workflow specifies)
    if (
      workflow.service_type &&
      workflow.service_type !== ticket.warranty_type
    ) {
      return {
        canAssign: false,
        reason: `Quy trình "${workflow.name}" chỉ áp dụng cho loại dịch vụ ${workflow.service_type}`,
      };
    }

    return { canAssign: true };
  }
}
