/**
 * Inventory Transfer Entity Adapter
 *
 * Handles task lifecycle events for inventory transfers between warehouses.
 * Implements auto-progression logic for picking, packing, and receiving.
 *
 * @module entity-adapters/inventory-transfer
 */

import type { TRPCContext } from "../../trpc";
import {
  BaseEntityAdapter,
  type TaskContext,
  type CanStartResult,
  type CanAssignWorkflowResult,
} from "./base-adapter";

/**
 * Inventory Transfer Adapter Implementation
 *
 * Auto-progression rules:
 * - Tasks follow sequence: pick → pack → ship → receive
 * - Transfer must be approved before tasks can start
 * - Auto-completes to 'completed' when all required tasks done
 * - Stock updates happen automatically on approval (via issue/receipt triggers)
 *
 * @example
 * ```typescript
 * const adapter = new InventoryTransferAdapter();
 * await adapter.onTaskComplete(ctx, taskId);
 * // → Auto-updates transfer status if all tasks complete
 * ```
 */
export class InventoryTransferAdapter extends BaseEntityAdapter {
  readonly entityType = "inventory_transfer" as const;

  /**
   * Check if task can be started
   *
   * Rules:
   * - Transfer must be approved (stock transfers auto-created)
   * - Cannot start tasks on cancelled transfers
   * - Respects workflow strict_sequence if defined
   */
  async canStartTask(
    ctx: TRPCContext,
    taskId: string
  ): Promise<CanStartResult> {
    const task = await this.getTask(ctx, taskId);

    // Get transfer details
    const { data: transfer } = await ctx.supabaseAdmin
      .from("inventory_documents")
      .select(
        `
        id,
        document_number,
        status,
        document_type,
        from_warehouse_id,
        warehouse_id,
        workflow_id,
        workflows(strict_sequence)
      `
      )
      .eq("id", task.entity_id)
      .eq("document_type", "transfer")
      .single();

    if (!transfer) {
      return {
        canStart: false,
        reason: "Không tìm thấy phiếu chuyển kho",
      };
    }

    // Cannot start tasks on cancelled transfers
    if (transfer.status === "cancelled") {
      return {
        canStart: false,
        reason: "Không thể thực hiện task cho phiếu đã hủy",
      };
    }

    // Require approval before starting tasks (stock transfers already created)
    if (transfer.status !== "approved" && transfer.status !== "completed") {
      return {
        canStart: false,
        reason: "Phải duyệt phiếu chuyển kho trước khi thực hiện task. Stock sẽ được cập nhật sau khi duyệt.",
      };
    }

    // If task already in progress or completed, allow (idempotent)
    if (task.status === "in_progress" || task.status === "completed") {
      return { canStart: true };
    }

    // Check workflow sequence enforcement
    const workflow = Array.isArray(transfer.workflows)
      ? transfer.workflows[0]
      : transfer.workflows;

    const enforceSequence = workflow?.strict_sequence ?? false;

    if (!enforceSequence) {
      return { canStart: true };
    }

    // Check if all previous required tasks are complete
    const { data: previousTasks } = await ctx.supabaseAdmin
      .from("entity_tasks")
      .select("id, name, status, is_required")
      .eq("entity_id", task.entity_id)
      .eq("entity_type", "inventory_transfer")
      .lt("sequence_order", task.sequence_order)
      .neq("status", "skipped");

    const incompleteTasks =
      previousTasks?.filter(
        (t) => t.status !== "completed" && t.is_required
      ) || [];

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
   * Log task start for audit purposes.
   */
  async onTaskStart(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    console.log(
      `[InventoryTransfer] Task started: ${task.name} for transfer ${task.entity_id}`
    );
  }

  /**
   * Called when a task is completed
   *
   * Auto-progression logic:
   * - Check if all required tasks are complete
   * - If yes and transfer is 'approved', transition to 'completed'
   * - Stock was already transferred on approval (via auto-created issue/receipt)
   */
  async onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Check if all required tasks are complete
    const allComplete = await this.areAllRequiredTasksComplete(
      ctx,
      task.entity_id
    );

    if (allComplete) {
      // Get transfer to check current status
      const { data: transfer } = await ctx.supabaseAdmin
        .from("inventory_documents")
        .select("id, document_number, status, from_warehouse_id, warehouse_id")
        .eq("id", task.entity_id)
        .single();

      // Only auto-complete if transfer is approved
      if (transfer?.status === "approved") {
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
            reason: "Tất cả công việc chuyển kho đã hoàn thành",
            trigger: "auto_task_completion",
            from_warehouse_id: transfer.from_warehouse_id,
            to_warehouse_id: transfer.warehouse_id,
          },
          performed_by: task.assigned_to_id,
        });

        console.log(
          `[InventoryTransfer] Auto-completed transfer ${transfer.document_number}`
        );
      }
    }
  }

  /**
   * Called when a task is blocked
   *
   * Logs the blocking event for inventory audit trail.
   * Important for transfers as they often involve physical movement.
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
      `[InventoryTransfer] Task blocked: ${task.name} - Reason: ${reason}`
    );
  }

  /**
   * Get entity context for task display
   *
   * Fetches transfer details and formats for UI rendering.
   */
  async getEntityContext(
    ctx: TRPCContext,
    entityId: string
  ): Promise<TaskContext> {
    const { data: transfer, error } = await ctx.supabaseAdmin
      .from("inventory_documents")
      .select(
        `
        id,
        document_number,
        status,
        document_type,
        from_warehouse_id,
        warehouse_id,
        created_at,
        from_warehouse:physical_warehouses!inventory_documents_from_warehouse_id_fkey(
          name,
          code
        ),
        to_warehouse:physical_warehouses!inventory_documents_warehouse_id_fkey(
          name,
          code
        )
      `
      )
      .eq("id", entityId)
      .eq("document_type", "transfer")
      .single();

    if (error || !transfer) {
      throw new Error(`Inventory transfer not found: ${entityId}`);
    }

    const fromWarehouse = Array.isArray(transfer.from_warehouse)
      ? transfer.from_warehouse[0]
      : transfer.from_warehouse;
    const toWarehouse = Array.isArray(transfer.to_warehouse)
      ? transfer.to_warehouse[0]
      : transfer.to_warehouse;

    // Transfers are generally normal priority unless urgent flag set
    const priority: "low" | "normal" | "high" | "urgent" = "normal";

    return {
      entityId: transfer.id,
      entityType: "inventory_transfer",
      title: `Phiếu chuyển kho ${transfer.document_number}`,
      subtitle:
        fromWarehouse && toWarehouse
          ? `Từ ${fromWarehouse.name} → ${toWarehouse.name}`
          : undefined,
      status: transfer.status,
      priority: priority,
      url: `/inventory/documents/transfers/${transfer.id}`,
      metadata: {
        documentNumber: transfer.document_number,
        fromWarehouseName: fromWarehouse?.name,
        fromWarehouseCode: fromWarehouse?.code,
        toWarehouseName: toWarehouse?.name,
        toWarehouseCode: toWarehouse?.code,
      },
    };
  }

  /**
   * Validate if workflow can be assigned to transfer
   *
   * Ensures workflow is for inventory_transfer entity type.
   */
  async canAssignWorkflow(
    ctx: TRPCContext,
    entityId: string,
    workflowId: string
  ): Promise<CanAssignWorkflowResult> {
    const { data: transfer } = await ctx.supabaseAdmin
      .from("inventory_documents")
      .select("id, status, document_type")
      .eq("id", entityId)
      .eq("document_type", "transfer")
      .single();

    if (!transfer) {
      return {
        canAssign: false,
        reason: "Không tìm thấy phiếu chuyển kho",
      };
    }

    // Cannot assign workflow to cancelled transfers
    if (transfer.status === "cancelled") {
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
    if (
      workflow.entity_type &&
      workflow.entity_type !== "inventory_transfer"
    ) {
      return {
        canAssign: false,
        reason: `Quy trình này dành cho ${workflow.entity_type}, không phù hợp với phiếu chuyển kho`,
      };
    }

    return { canAssign: true };
  }
}
