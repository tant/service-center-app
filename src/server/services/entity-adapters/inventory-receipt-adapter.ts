/**
 * Inventory Receipt Entity Adapter
 *
 * Handles task lifecycle events for inventory receipts (GRN).
 * Implements auto-progression logic for serial entry tasks.
 *
 * @module entity-adapters/inventory-receipt
 */

import type { TRPCContext } from "../../trpc";
import {
  BaseEntityAdapter,
  type CanAssignWorkflowResult,
  type CanStartResult,
  type TaskContext,
} from "./base-adapter";

/**
 * Inventory Receipt Adapter Implementation
 *
 * Auto-progression rules:
 * - Tasks can only be started after receipt is approved
 * - Serial entry tasks track progress in metadata
 * - Auto-completes to 'completed' when all serials entered (100%)
 *
 * @example
 * ```typescript
 * const adapter = new InventoryReceiptAdapter();
 * await adapter.onTaskComplete(ctx, taskId);
 * // → Auto-updates receipt status if all serial entry done
 * ```
 */
export class InventoryReceiptAdapter extends BaseEntityAdapter {
  readonly entityType = "inventory_receipt" as const;

  /**
   * Check if task can be started
   *
   * Rules:
   * - Receipt must be approved (stock already updated)
   * - Cannot start tasks on cancelled receipts
   * - Serial entry tasks require receipt approval first
   */
  async canStartTask(
    ctx: TRPCContext,
    taskId: string,
  ): Promise<CanStartResult> {
    const task = await this.getTask(ctx, taskId);

    // Get receipt details from stock_receipts table
    const { data: receipt } = await ctx.supabaseAdmin
      .from("stock_receipts")
      .select("id, receipt_number, status")
      .eq("id", task.entity_id)
      .single();

    if (!receipt) {
      return {
        canStart: false,
        reason: "Không tìm thấy phiếu nhập kho",
      };
    }

    // Cannot start tasks on cancelled receipts
    if (receipt.status === "cancelled") {
      return {
        canStart: false,
        reason: "Không thể thực hiện task cho phiếu đã hủy",
      };
    }

    // For serial entry tasks, require approval first (stock must be updated)
    if (task.name.includes("serial") || task.name.includes("Serial")) {
      if (receipt.status !== "approved" && receipt.status !== "completed") {
        return {
          canStart: false,
          reason:
            "Phải duyệt phiếu nhập kho trước khi nhập serial. Stock sẽ được cập nhật sau khi duyệt.",
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
   * No specific action needed for inventory receipts.
   * Stock is already updated on approval, serial entry is non-blocking.
   */
  async onTaskStart(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Log task start (optional - could add to audit logs)
    console.log(
      `[InventoryReceipt] Task started: ${task.name} for receipt ${task.entity_id}`,
    );
  }

  /**
   * Called when a task is completed
   *
   * Auto-progression logic:
   * - Check if all required tasks are complete
   * - Receipt auto-completion is handled by database trigger
   *   (auto_complete_serial_entry_task) when serial count reaches 100%
   *
   * Note: This method primarily logs completion, actual status updates
   * are handled by database triggers for reliability.
   */
  async onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Check if all required tasks are complete
    const allComplete = await this.areAllRequiredTasksComplete(
      ctx,
      task.entity_id,
    );

    if (allComplete) {
      // Get receipt to check current status
      const { data: receipt } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .select("id, receipt_number, status")
        .eq("id", task.entity_id)
        .single();

      // Note: Receipt auto-completion is handled by database trigger
      // when serial entry reaches 100%. No manual status update needed here.
      if (receipt?.status === "approved") {
        console.log(
          `[InventoryReceipt] All tasks complete for receipt ${receipt.receipt_number}. Auto-completion handled by trigger.`,
        );
      } else if (receipt?.status === "completed") {
        console.log(
          `[InventoryReceipt] Receipt ${receipt.receipt_number} already completed.`,
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
      `[InventoryReceipt] Task blocked: ${task.name} - Reason: ${reason}`,
    );
  }

  /**
   * Get entity context for task display
   *
   * Fetches receipt details and formats for UI rendering.
   * Calculates serial completion percentage from stock_receipt_items.
   */
  async getEntityContext(
    ctx: TRPCContext,
    entityId: string,
  ): Promise<TaskContext> {
    const { data: receipt, error } = await ctx.supabaseAdmin
      .from("stock_receipts")
      .select(
        `
        id,
        receipt_number,
        status,
        warehouse_id,
        created_at,
        physical_warehouses!stock_receipts_warehouse_id_fkey(
          name,
          code
        )
      `,
      )
      .eq("id", entityId)
      .single();

    if (error || !receipt) {
      throw new Error(`Stock receipt not found: ${entityId}`);
    }

    const warehouse = Array.isArray(receipt.physical_warehouses)
      ? receipt.physical_warehouses[0]
      : receipt.physical_warehouses;

    // Calculate serial completion percentage from stock_receipt_items
    const { data: items } = await ctx.supabaseAdmin
      .from("stock_receipt_items")
      .select("declared_quantity, serial_count")
      .eq("receipt_id", entityId);

    let serialCompletionPercentage = 0;
    if (items && items.length > 0) {
      const totalExpected = items.reduce(
        (sum, item) => sum + Math.abs(item.declared_quantity),
        0,
      );
      const totalEntered = items.reduce(
        (sum, item) => sum + (item.serial_count || 0),
        0,
      );
      serialCompletionPercentage =
        totalExpected > 0
          ? Math.round((totalEntered / totalExpected) * 100)
          : 0;
    }

    // Determine priority based on serial completion
    let priority: "low" | "normal" | "high" | "urgent" = "normal";
    if (serialCompletionPercentage < 50) {
      priority = "urgent"; // Red: needs immediate attention
    } else if (serialCompletionPercentage < 100) {
      priority = "high"; // Yellow: in progress
    } else {
      priority = "low"; // Green: complete
    }

    return {
      entityId: receipt.id,
      entityType: "inventory_receipt",
      title: `Phiếu nhập kho ${receipt.receipt_number}`,
      subtitle: warehouse
        ? `Kho: ${warehouse.name} - Serial: ${serialCompletionPercentage}%`
        : undefined,
      status: receipt.status,
      priority: priority,
      url: `/inventory/documents/receipts/${receipt.id}`,
      metadata: {
        documentNumber: receipt.receipt_number,
        warehouseName: warehouse?.name,
        warehouseCode: warehouse?.code,
        serialCompletionPercentage: serialCompletionPercentage,
      },
    };
  }

  /**
   * Validate if workflow can be assigned to receipt
   *
   * Ensures workflow is for inventory_receipt entity type.
   */
  async canAssignWorkflow(
    ctx: TRPCContext,
    entityId: string,
    workflowId: string,
  ): Promise<CanAssignWorkflowResult> {
    const { data: receipt } = await ctx.supabaseAdmin
      .from("stock_receipts")
      .select("id, status")
      .eq("id", entityId)
      .single();

    if (!receipt) {
      return {
        canAssign: false,
        reason: "Không tìm thấy phiếu nhập kho",
      };
    }

    // Cannot assign workflow to cancelled receipts
    if (receipt.status === "cancelled") {
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
    if (workflow.entity_type && workflow.entity_type !== "inventory_receipt") {
      return {
        canAssign: false,
        reason: `Quy trình này dành cho ${workflow.entity_type}, không phù hợp với phiếu nhập kho`,
      };
    }

    return { canAssign: true };
  }
}
