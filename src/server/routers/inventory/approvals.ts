/**
 * Approvals Router - Unified approval workflows for receipts, issues, and transfers
 */

import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import { requireAnyAuthenticated, requireManagerOrAbove } from "../../middleware/requireRole";
import type { PendingApproval } from "@/types/inventory";

export const approvalsRouter = router({
  /**
   * Get all pending approvals
   * Returns unified view from v_pending_approvals view
   */
  getPending: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        documentType: z.enum(["receipt", "issue", "transfer"]).optional(),
      })
    )
    .query(async ({ ctx, input }): Promise<PendingApproval[]> => {
      let query = ctx.supabaseAdmin
        .from("v_pending_approvals")
        .select("*")
        .order("created_at", { ascending: false });

      if (input.documentType) {
        query = query.eq("document_type", input.documentType);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get pending approvals: ${error.message}`);
      }

      return (data || []) as PendingApproval[];
    }),

  /**
   * Get approval statistics
   */
  getStats: publicProcedure.use(requireManagerOrAbove).query(async ({ ctx }) => {
    // Count pending receipts
    const { count: receiptsCount } = await ctx.supabaseAdmin
      .from("stock_receipts")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_approval");

    // Count pending issues
    const { count: issuesCount } = await ctx.supabaseAdmin
      .from("stock_issues")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_approval");

    // Count pending transfers
    const { count: transfersCount } = await ctx.supabaseAdmin
      .from("stock_transfers")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_approval");

    return {
      receipts: receiptsCount || 0,
      issues: issuesCount || 0,
      transfers: transfersCount || 0,
      total: (receiptsCount || 0) + (issuesCount || 0) + (transfersCount || 0),
    };
  }),

  /**
   * Approve stock receipt
   */
  approveReceipt: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can approve receipts");
      }

      // Update receipt status
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({
          status: "approved",
          approved_by_id: profile.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("status", "pending_approval")
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to approve receipt: ${error.message}`);
      }

      return data;
    }),

  /**
   * Reject stock receipt
   */
  rejectReceipt: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        rejectionReason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can reject receipts");
      }

      // Update receipt status
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({
          status: "cancelled",
          rejection_reason: input.rejectionReason,
        })
        .eq("id", input.id)
        .eq("status", "pending_approval")
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to reject receipt: ${error.message}`);
      }

      return data;
    }),

  /**
   * Approve stock issue
   */
  approveIssue: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can approve issues");
      }

      // Update issue status
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_issues")
        .update({
          status: "approved",
          approved_by_id: profile.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("status", "pending_approval")
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to approve issue: ${error.message}`);
      }

      return data;
    }),

  /**
   * Reject stock issue
   */
  rejectIssue: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        rejectionReason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can reject issues");
      }

      // Update issue status
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_issues")
        .update({
          status: "cancelled",
          rejection_reason: input.rejectionReason,
        })
        .eq("id", input.id)
        .eq("status", "pending_approval")
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to reject issue: ${error.message}`);
      }

      return data;
    }),

  /**
   * Approve stock transfer
   * Note: This sets status to "in_transit" not "approved"
   */
  approveTransfer: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can approve transfers");
      }

      // Update transfer status to in_transit
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .update({
          status: "in_transit",
          approved_by_id: profile.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("status", "pending_approval")
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to approve transfer: ${error.message}`);
      }

      return data;
    }),

  /**
   * Reject stock transfer
   */
  rejectTransfer: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        rejectionReason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can reject transfers");
      }

      // Update transfer status
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .update({
          status: "cancelled",
          rejection_reason: input.rejectionReason,
        })
        .eq("id", input.id)
        .eq("status", "pending_approval")
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to reject transfer: ${error.message}`);
      }

      return data;
    }),

  /**
   * Complete stock receipt (transitions to completed)
   * This triggers the database trigger to update stock levels
   */
  completeReceipt: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can complete receipts");
      }

      // Get receipt with items and serials to validate
      const { data: receipt } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .select(
          `
          *,
          items:stock_receipt_items(
            id,
            declared_quantity,
            serial_count
          )
        `
        )
        .eq("id", input.id)
        .eq("status", "approved")
        .single();

      if (!receipt) {
        throw new Error("Receipt not found or not approved");
      }

      // Validate all items have matching serial counts
      for (const item of receipt.items) {
        if (item.serial_count !== item.declared_quantity) {
          throw new Error(
            `Item ${item.id} has ${item.serial_count} serials but declared quantity is ${item.declared_quantity}`
          );
        }
      }

      // Update receipt to completed
      // Note: Stock was already updated by update_stock_on_receipt_approval() trigger on approval
      // This completion marks the document as finalized after serial entry
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({
          status: "completed",
          completed_by_id: profile.id,
          completed_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to complete receipt: ${error.message}`);
      }

      return data;
    }),

  /**
   * Complete stock issue (transitions to completed)
   * This triggers the database trigger to decrease stock levels
   */
  completeIssue: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can complete issues");
      }

      // Get issue with items and serials to validate
      const { data: issue } = await ctx.supabaseAdmin
        .from("stock_issues")
        .select(
          `
          *,
          items:stock_issue_items(
            id,
            quantity,
            serials:stock_issue_serials(id)
          )
        `
        )
        .eq("id", input.id)
        .eq("status", "approved")
        .single();

      if (!issue) {
        throw new Error("Issue not found or not approved");
      }

      // Validate all items have matching serial counts
      for (const item of issue.items) {
        if (item.serials.length !== item.quantity) {
          throw new Error(
            `Item ${item.id} has ${item.serials.length} serials but quantity is ${item.quantity}`
          );
        }
      }

      // Update issue to completed
      // Note: Stock was already decreased by update_stock_on_issue_approval() trigger on approval
      // This completion marks the document as finalized after serial entry
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_issues")
        .update({
          status: "completed",
          completed_by_id: profile.id,
          completed_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to complete issue: ${error.message}`);
      }

      return data;
    }),
});
