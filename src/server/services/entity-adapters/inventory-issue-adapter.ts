/**
 * Inventory Issue Entity Adapter
 *
 * Handles task lifecycle events for inventory issues (GIN - Goods Issue Notes).
 * Implements auto-progression logic for product selection and quality checks.
 *
 * @module entity-adapters/inventory-issue
 */

import type { TRPCContext } from "../../trpc";
import {
  BaseEntityAdapter,
  type CanAssignWorkflowResult,
  type CanStartResult,
  type TaskContext,
} from "./base-adapter";

/**
 * Inventory Issue Adapter Implementation
 *
 * Auto-progression rules:
 * - Tasks can only be started after issue is approved
 * - Product selection tasks verify serial availability
 * - Auto-completes to 'completed' when all required tasks done
 *
 * @example
 * ```typescript
 * const adapter = new InventoryIssueAdapter();
 * await adapter.onTaskComplete(ctx, taskId);
 * // → Auto-updates issue status if all tasks complete
 * ```
 */
export class InventoryIssueAdapter extends BaseEntityAdapter {
  readonly entityType = "inventory_issue" as const;

  /**
   * Check if task can be started
   *
   * Rules:
   * - Issue must be approved (stock already decremented)
   * - Cannot start tasks on cancelled issues
   * - Product selection requires approval first
   */
  async canStartTask(
    ctx: TRPCContext,
    taskId: string,
  ): Promise<CanStartResult> {
    const task = await this.getTask(ctx, taskId);

    // Get issue details
    const { data: issue } = await ctx.supabaseAdmin
      .from("inventory_documents")
      .select(
        "id, document_number, status, document_type, target_entity_type, target_entity_id",
      )
      .eq("id", task.entity_id)
      .eq("document_type", "issue")
      .single();

    if (!issue) {
      return {
        canStart: false,
        reason: "Không tìm thấy phiếu xuất kho",
      };
    }

    // Cannot start tasks on cancelled issues
    if (issue.status === "cancelled") {
      return {
        canStart: false,
        reason: "Không thể thực hiện task cho phiếu đã hủy",
      };
    }

    // For product selection/serial verification tasks, require approval first
    if (
      task.name.includes("chọn serial") ||
      task.name.includes("kiểm tra") ||
      task.name.includes("verify")
    ) {
      if (issue.status !== "approved" && issue.status !== "completed") {
        return {
          canStart: false,
          reason:
            "Phải duyệt phiếu xuất kho trước khi chọn sản phẩm. Stock sẽ được cập nhật sau khi duyệt.",
        };
      }
    }

    // If task already in progress or completed, allow (idempotent)
    if (task.status === "in_progress" || task.status === "completed") {
      return { canStart: true };
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
      `[InventoryIssue] Task started: ${task.name} for issue ${task.entity_id}`,
    );
  }

  /**
   * Called when a task is completed
   *
   * Auto-progression logic:
   * - Check if all required tasks are complete
   * - If yes and issue is 'approved', transition to 'completed'
   */
  async onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Check if all required tasks are complete
    const allComplete = await this.areAllRequiredTasksComplete(
      ctx,
      task.entity_id,
    );

    if (allComplete) {
      // Get issue to check current status
      const { data: issue } = await ctx.supabaseAdmin
        .from("inventory_documents")
        .select("id, document_number, status, target_entity_type")
        .eq("id", task.entity_id)
        .single();

      // Only auto-complete if issue is approved
      if (issue?.status === "approved") {
        await ctx.supabaseAdmin
          .from("inventory_documents")
          .update({ status: "completed" })
          .eq("id", task.entity_id);

        // Log auto-completion to audit logs
        await ctx.supabaseAdmin.from("audit_logs").insert({
          action: "status_change",
          entity_type: "inventory_document",
          entity_id: task.entity_id,
          details: {
            old_status: "approved",
            new_status: "completed",
            reason: "Tất cả công việc đã hoàn thành",
            trigger: "auto_task_completion",
          },
          performed_by: task.assigned_to_id,
        });

        console.log(
          `[InventoryIssue] Auto-completed issue ${issue.document_number}`,
        );
      }
    }
  }

  /**
   * Called when a task is blocked
   *
   * Logs the blocking event for inventory audit trail.
   */
  async onTaskBlock(
    ctx: TRPCContext,
    taskId: string,
    reason: string,
  ): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Log to audit logs
    await ctx.supabaseAdmin.from("audit_logs").insert({
      action: "task_blocked",
      entity_type: "inventory_document",
      entity_id: task.entity_id,
      details: {
        task_id: taskId,
        task_name: task.name,
        reason: reason,
      },
      performed_by: task.assigned_to_id,
    });

    console.log(
      `[InventoryIssue] Task blocked: ${task.name} - Reason: ${reason}`,
    );
  }

  /**
   * Get entity context for task display
   *
   * Fetches issue details and formats for UI rendering.
   */
  async getEntityContext(
    ctx: TRPCContext,
    entityId: string,
  ): Promise<TaskContext> {
    const { data: issue, error } = await ctx.supabaseAdmin
      .from("inventory_documents")
      .select(
        `
        id,
        document_number,
        status,
        document_type,
        warehouse_id,
        target_entity_type,
        target_entity_id,
        created_at,
        physical_warehouses!inventory_documents_warehouse_id_fkey(
          name,
          code
        )
      `,
      )
      .eq("id", entityId)
      .eq("document_type", "issue")
      .single();

    if (error || !issue) {
      throw new Error(`Inventory issue not found: ${entityId}`);
    }

    const warehouse = Array.isArray(issue.physical_warehouses)
      ? issue.physical_warehouses[0]
      : issue.physical_warehouses;

    // Determine priority based on target entity type
    let priority: "low" | "normal" | "high" | "urgent" = "normal";
    if (issue.target_entity_type === "service_ticket") {
      priority = "high"; // Customer waiting for parts
    } else if (issue.target_entity_type === "sales_order") {
      priority = "urgent"; // Sales order needs immediate fulfillment
    }

    return {
      entityId: issue.id,
      entityType: "inventory_issue",
      title: `Phiếu xuất kho ${issue.document_number}`,
      subtitle: warehouse
        ? `Xuất từ: ${warehouse.name}${issue.target_entity_type ? ` - ${issue.target_entity_type}` : ""}`
        : undefined,
      status: issue.status,
      priority: priority,
      url: `/inventory/documents/issues/${issue.id}`,
      metadata: {
        documentNumber: issue.document_number,
        warehouseName: warehouse?.name,
        warehouseCode: warehouse?.code,
        targetEntityType: issue.target_entity_type,
        targetEntityId: issue.target_entity_id,
      },
    };
  }

  /**
   * Validate if workflow can be assigned to issue
   *
   * Ensures workflow is for inventory_issue entity type.
   */
  async canAssignWorkflow(
    ctx: TRPCContext,
    entityId: string,
    workflowId: string,
  ): Promise<CanAssignWorkflowResult> {
    const { data: issue } = await ctx.supabaseAdmin
      .from("inventory_documents")
      .select("id, status, document_type")
      .eq("id", entityId)
      .eq("document_type", "issue")
      .single();

    if (!issue) {
      return {
        canAssign: false,
        reason: "Không tìm thấy phiếu xuất kho",
      };
    }

    // Cannot assign workflow to cancelled issues
    if (issue.status === "cancelled") {
      return {
        canAssign: false,
        reason: "Không thể thay đổi quy trình cho phiếu đã hủy",
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
    if (workflow.entity_type && workflow.entity_type !== "inventory_issue") {
      return {
        canAssign: false,
        reason: `Quy trình này dành cho ${workflow.entity_type}, không phù hợp với phiếu xuất kho`,
      };
    }

    return { canAssign: true };
  }
}
