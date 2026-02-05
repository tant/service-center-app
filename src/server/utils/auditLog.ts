/**
 * Audit Logging Utility
 *
 * Provides functions to log sensitive operations and permission-related actions
 * to the audit_logs table for compliance and security monitoring.
 *
 * All audit logs are immutable (no updates/deletes allowed) and only admins
 * can view them.
 *
 * Usage:
 * ```typescript
 * await logAudit(ctx.supabaseAdmin, ctx.user!.id, {
 *   action: 'create',
 *   resourceType: 'ticket',
 *   resourceId: ticket.id,
 *   newValues: ticket,
 * });
 * ```
 *
 * Reference: docs/IMPLEMENTATION-GUIDE-ROLES.md Section 2.3
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { MIN_AUDIT_REASON_LENGTH } from "@/types/roles";

// =====================================================
// TYPES
// =====================================================

/**
 * Parameters for creating an audit log entry
 */
export interface AuditLogParams {
  /** Action performed (create, update, delete, etc.) */
  action: string;
  /** Type of resource affected (ticket, user, stock, etc.) */
  resourceType: string;
  /** ID of the affected resource */
  resourceId: string;
  /** Values before the change (for updates) */
  oldValues?: Record<string, unknown>;
  /** Values after the change */
  newValues?: Record<string, unknown>;
  /** Reason for the action (required for sensitive operations) */
  reason?: string;
  /** Additional context-specific data */
  metadata?: Record<string, unknown>;
}

// =====================================================
// MAIN LOGGING FUNCTION
// =====================================================

/**
 * Create an audit log entry
 *
 * @param supabase - Supabase admin client (to bypass RLS)
 * @param userId - ID of the user performing the action
 * @param params - Audit log parameters
 * @returns The ID of the created audit log entry
 * @throws Error if audit log creation fails
 *
 * @example
 * ```typescript
 * await logAudit(ctx.supabaseAdmin, ctx.user!.id, {
 *   action: 'create',
 *   resourceType: 'ticket',
 *   resourceId: newTicket.id,
 *   newValues: newTicket,
 * });
 * ```
 */
export async function logAudit(
  supabase: SupabaseClient,
  userId: string,
  params: AuditLogParams,
): Promise<string> {
  try {
    // Call the database function that handles audit logging
    const { data, error } = await supabase.rpc("log_audit", {
      p_action: params.action,
      p_resource_type: params.resourceType,
      p_resource_id: params.resourceId,
      p_old_values: params.oldValues || null,
      p_new_values: params.newValues || null,
      p_reason: params.reason || null,
      p_metadata: params.metadata || null,
    });

    if (error) {
      console.error("[AUDIT] Failed to log action:", error);
      throw new Error(`Audit logging failed: ${error.message}`);
    }

    console.log(
      `📝 [AUDIT] Logged action: ${params.action} on ${params.resourceType}/${params.resourceId} by user ${userId}`,
    );

    return data as string;
  } catch (error) {
    // Log to console for debugging but don't fail the operation
    console.error("[AUDIT] Audit logging error:", error);
    // Re-throw to let caller decide how to handle
    throw error;
  }
}

// =====================================================
// SPECIALIZED LOGGING FUNCTIONS
// =====================================================

/**
 * Log a template switch operation (requires reason validation)
 *
 * Template switches are sensitive operations that require a detailed reason.
 * This function validates the reason and logs to both audit_logs and
 * ticket_workflow_changes tables.
 *
 * @param supabase - Supabase admin client
 * @param userId - ID of the user performing the switch
 * @param ticketId - ID of the ticket being modified
 * @param oldTemplateId - ID of the previous template
 * @param newTemplateId - ID of the new template
 * @param reason - Detailed reason for the switch (min 10 characters)
 * @returns The audit log ID
 * @throws Error if reason is too short or logging fails
 *
 * @example
 * ```typescript
 * await logTemplateSwitchWithCheck(
 *   ctx.supabaseAdmin,
 *   ctx.user!.id,
 *   ticketId,
 *   oldTemplateId,
 *   newTemplateId,
 *   'Customer requested warranty service instead of paid repair'
 * );
 * ```
 */
export async function logTemplateSwitchWithCheck(
  supabase: SupabaseClient,
  userId: string,
  ticketId: string,
  oldTemplateId: string,
  newTemplateId: string,
  reason: string,
): Promise<string> {
  // Validate reason
  if (!reason || reason.trim().length < MIN_AUDIT_REASON_LENGTH) {
    throw new Error(
      `Template switch requires a detailed reason (minimum ${MIN_AUDIT_REASON_LENGTH} characters)`,
    );
  }

  try {
    // Call the database function that handles template switch logging
    const { data, error } = await supabase.rpc("log_template_switch", {
      p_ticket_id: ticketId,
      p_old_template_id: oldTemplateId,
      p_new_template_id: newTemplateId,
      p_reason: reason,
    });

    if (error) {
      console.error("[AUDIT] Template switch logging failed:", error);
      throw new Error(`Template switch audit failed: ${error.message}`);
    }

    console.log(
      `📝 [AUDIT] Template switch logged for ticket ${ticketId}: ${oldTemplateId} → ${newTemplateId}`,
    );

    return data as string;
  } catch (error) {
    console.error("[AUDIT] Template switch error:", error);
    throw error;
  }
}

/**
 * Log a high-value transaction that requires approval
 *
 * @param supabase - Supabase admin client
 * @param userId - ID of the user performing the action
 * @param ticketId - ID of the ticket
 * @param totalCost - Total cost of the transaction
 * @param reason - Reason for the high cost
 */
export async function logHighValueTransaction(
  supabase: SupabaseClient,
  userId: string,
  ticketId: string,
  totalCost: number,
  reason?: string,
): Promise<string> {
  return await logAudit(supabase, userId, {
    action: "approve",
    resourceType: "ticket",
    resourceId: ticketId,
    newValues: { total_cost: totalCost },
    reason,
    metadata: { transaction_type: "high_value", threshold: 5000000 },
  });
}

/**
 * Log an RMA batch creation
 *
 * @param supabase - Supabase admin client
 * @param userId - ID of the user creating the RMA
 * @param batchId - ID of the RMA batch
 * @param productIds - IDs of products in the batch
 * @param reason - Reason for RMA
 */
export async function logRMACreation(
  supabase: SupabaseClient,
  userId: string,
  batchId: string,
  productIds: string[],
  reason: string,
): Promise<string> {
  return await logAudit(supabase, userId, {
    action: "rma_create",
    resourceType: "rma_batch",
    resourceId: batchId,
    newValues: { product_ids: productIds, product_count: productIds.length },
    reason,
    metadata: { products: productIds },
  });
}

/**
 * Log a user role change
 *
 * @param supabase - Supabase admin client
 * @param adminUserId - ID of the admin performing the change
 * @param targetUserId - ID of the user whose role is being changed
 * @param oldRole - Previous role
 * @param newRole - New role
 * @param reason - Reason for the change
 */
export async function logRoleChange(
  supabase: SupabaseClient,
  adminUserId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  reason: string,
): Promise<string> {
  return await logAudit(supabase, adminUserId, {
    action: "role_change",
    resourceType: "profile",
    resourceId: targetUserId,
    oldValues: { role: oldRole },
    newValues: { role: newRole },
    reason,
  });
}

/**
 * Log a stock movement
 *
 * @param supabase - Supabase admin client
 * @param userId - ID of the user performing the movement
 * @param movementId - ID of the stock movement record
 * @param productId - ID of the product being moved
 * @param quantity - Quantity moved
 * @param fromLocation - Source location
 * @param toLocation - Destination location
 * @param reason - Reason for the movement
 */
export async function logStockMovement(
  supabase: SupabaseClient,
  userId: string,
  movementId: string,
  productId: string,
  quantity: number,
  fromLocation: string,
  toLocation: string,
  reason?: string,
): Promise<string> {
  return await logAudit(supabase, userId, {
    action: "stock_movement",
    resourceType: "stock",
    resourceId: movementId,
    newValues: {
      product_id: productId,
      quantity,
      from: fromLocation,
      to: toLocation,
    },
    reason,
  });
}

// =====================================================
// QUERY HELPERS
// =====================================================

/**
 * Get audit logs for a specific resource
 *
 * @param supabase - Supabase admin client
 * @param resourceType - Type of resource
 * @param resourceId - ID of the resource
 * @param limit - Maximum number of logs to return
 * @returns Array of audit log entries
 */
export async function getAuditLogsForResource(
  supabase: SupabaseClient,
  resourceType: string,
  resourceId: string,
  limit = 50,
) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[AUDIT] Failed to fetch audit logs:", error);
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return data;
}

/**
 * Get recent audit logs for a user
 *
 * @param supabase - Supabase admin client
 * @param userId - ID of the user
 * @param limit - Maximum number of logs to return
 * @returns Array of audit log entries
 */
export async function getAuditLogsForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 50,
) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[AUDIT] Failed to fetch user audit logs:", error);
    throw new Error(`Failed to fetch user audit logs: ${error.message}`);
  }

  return data;
}
