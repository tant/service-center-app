/**
 * Transfers Router - Stock transfer (Phiếu Chuyển Kho) management
 */

import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import { requireAnyAuthenticated, requireManagerOrAbove } from "../../middleware/requireRole";
import type { StockTransfer } from "@/types/inventory";

export const transfersRouter = router({
  /**
   * List transfers with pagination and filters
   */
  list: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        status: z
          .enum(["draft", "pending_approval", "approved", "in_transit", "completed", "cancelled"])
          .optional(),
        page: z.number().int().min(0).default(0),
        pageSize: z.number().int().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("stock_transfers")
        .select(
          `
          *,
          created_by:profiles!created_by_id(id, full_name),
          approved_by:profiles!approved_by_id(id, full_name),
          received_by:profiles!received_by_id(id, full_name)
        `,
          { count: "exact" }
        );

      if (input.status) {
        query = query.eq("status", input.status);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(input.page * input.pageSize, (input.page + 1) * input.pageSize - 1);

      if (error) {
        throw new Error(`Failed to list transfers: ${error.message}`);
      }

      return {
        transfers: data || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil((count || 0) / input.pageSize),
      };
    }),

  /**
   * Get single transfer with full details
   */
  getById: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .select(
          `
          *,
          items:stock_transfer_items(
            *,
            product:products(id, name, sku),
            serials:stock_transfer_serials(
              *,
              physical_product:physical_products(serial_number, warranty_end_date)
            )
          ),
          from_virtual_warehouse:virtual_warehouses!from_virtual_warehouse_id(id, name),
          to_virtual_warehouse:virtual_warehouses!to_virtual_warehouse_id(id, name),
          generated_issue:stock_issues!generated_issue_id(id, issue_number),
          generated_receipt:stock_receipts!generated_receipt_id(id, receipt_number),
          created_by:profiles!created_by_id(id, full_name),
          approved_by:profiles!approved_by_id(id, full_name),
          received_by:profiles!received_by_id(id, full_name)
        `
        )
        .eq("id", input.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw new Error(`Failed to get transfer: ${error.message}`);
      }

      // Query attachments separately (polymorphic relationship)
      const { data: attachments } = await ctx.supabaseAdmin
        .from("stock_document_attachments")
        .select("*")
        .eq("document_type", "transfer")
        .eq("document_id", input.id);

      return {
        ...data,
        attachments: attachments || []
      };
    }),

  /**
   * Create new transfer (draft)
   */
  create: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        fromVirtualWarehouseId: z.string(), // REDESIGNED: Direct warehouse reference
        toVirtualWarehouseId: z.string(),   // REDESIGNED: Direct warehouse reference
        transferDate: z.string(),
        expectedDeliveryDate: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().int().min(1),
            notes: z.string().optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user profile ID
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can create transfers");
      }

      // Validate: Cannot transfer to same warehouse
      if (input.fromVirtualWarehouseId === input.toVirtualWarehouseId) {
        throw new Error("Cannot transfer to the same warehouse");
      }

      // Insert transfer
      const { data: transfer, error: transferError } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .insert({
          from_virtual_warehouse_id: input.fromVirtualWarehouseId, // REDESIGNED: Direct warehouse reference
          to_virtual_warehouse_id: input.toVirtualWarehouseId,     // REDESIGNED: Direct warehouse reference
          transfer_date: input.transferDate,
          expected_delivery_date: input.expectedDeliveryDate,
          notes: input.notes,
          status: "draft",
          created_by_id: profile.id,
        })
        .select()
        .single();

      if (transferError) {
        throw new Error(`Failed to create transfer: ${transferError.message}`);
      }

      // Insert items
      if (input.items.length > 0) {
        const items = input.items.map((item) => ({
          transfer_id: transfer.id,
          product_id: item.productId,
          quantity: item.quantity,
          notes: item.notes,
        }));

        const { error: itemsError } = await ctx.supabaseAdmin
          .from("stock_transfer_items")
          .insert(items);

        if (itemsError) {
          throw new Error(`Failed to create transfer items: ${itemsError.message}`);
        }
      }

      return transfer;
    }),

  /**
   * Update transfer (only if draft)
   */
  update: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
        expectedDeliveryDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check status first
      const { data: transfer } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .select("status, created_by_id")
        .eq("id", input.id)
        .single();

      if (!transfer) {
        throw new Error("Transfer not found");
      }

      if (transfer.status !== "draft") {
        throw new Error("Cannot edit transfer after draft status");
      }

      // Check permission
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile) {
        throw new Error("Profile not found");
      }

      // Only creator or admin/manager can edit
      if (
        transfer.created_by_id !== profile.id &&
        !["admin", "manager"].includes(profile.role)
      ) {
        throw new Error("Unauthorized to edit this transfer");
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .update({
          notes: input.notes,
          expected_delivery_date: input.expectedDeliveryDate,
        })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update transfer: ${error.message}`);
      }

      return data;
    }),

  /**
   * Submit for approval
   */
  submitForApproval: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .update({ status: "pending_approval" })
        .eq("id", input.id)
        .eq("status", "draft")
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit for approval: ${error.message}`);
      }

      return data;
    }),

  /**
   * Approve transfer (changes status to in_transit)
   * Note: This is different from typical approval - approved transfers automatically become in_transit
   */
  approve: publicProcedure.use(requireManagerOrAbove)
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
   * Reject transfer
   */
  reject: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        rejectionReason: z.string(),
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
   * Select serials for transfer item
   * Selects existing physical products from source warehouse
   */
  selectSerials: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        transferItemId: z.string(),
        physicalProductIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get transfer item details
      const { data: transferItem } = await ctx.supabaseAdmin
        .from("stock_transfer_items")
        .select("transfer_id, product_id, quantity")
        .eq("id", input.transferItemId)
        .single();

      if (!transferItem) {
        throw new Error("Transfer item not found");
      }

      // Get transfer to check source warehouse
      const { data: transfer } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .select("from_virtual_warehouse_id, from_physical_warehouse_id")
        .eq("id", transferItem.transfer_id)
        .single();

      if (!transfer) {
        throw new Error("Transfer not found");
      }

      // Validate physical products exist and belong to source warehouse
      const { data: physicalProducts, error: validateError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, product_id, virtual_warehouse_id, physical_warehouse_id")
        .in("id", input.physicalProductIds);

      if (validateError) {
        throw new Error(`Failed to validate physical products: ${validateError.message}`);
      }

      if (!physicalProducts || physicalProducts.length !== input.physicalProductIds.length) {
        throw new Error("Some physical products not found");
      }

      // Check all belong to correct product and source warehouse
      const invalid = physicalProducts.filter(
        (p) =>
          p.product_id !== transferItem.product_id ||
          p.virtual_warehouse_id !== transfer.from_virtual_warehouse_id ||
          (transfer.from_physical_warehouse_id &&
            p.physical_warehouse_id !== transfer.from_physical_warehouse_id)
      );

      if (invalid.length > 0) {
        const serials = invalid.map((p) => p.serial_number).join(", ");
        throw new Error(
          `Physical products do not match source warehouse/product: ${serials}`
        );
      }

      // Check not already in another transfer
      const { data: existingTransfers } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .select("physical_product_id, serial_number")
        .in("physical_product_id", input.physicalProductIds);

      if (existingTransfers && existingTransfers.length > 0) {
        const duplicates = existingTransfers.map((e) => e.serial_number).join(", ");
        throw new Error(`Physical products already in transfer: ${duplicates}`);
      }

      // Check quantity doesn't exceed declared quantity
      const { data: currentSerials } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .select("id")
        .eq("transfer_item_id", input.transferItemId);

      const currentCount = currentSerials?.length || 0;
      if (currentCount + input.physicalProductIds.length > transferItem.quantity) {
        throw new Error(
          `Cannot add ${input.physicalProductIds.length} serials. Would exceed declared quantity of ${transferItem.quantity}`
        );
      }

      // Insert transfer serials
      const serialsToInsert = input.physicalProductIds.map((ppId) => {
        const pp = physicalProducts.find((p) => p.id === ppId);
        return {
          transfer_item_id: input.transferItemId,
          physical_product_id: ppId,
          serial_number: pp!.serial_number,
        };
      });

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .insert(serialsToInsert)
        .select();

      if (error) {
        throw new Error(`Failed to add serials: ${error.message}`);
      }

      return data;
    }),

  /**
   * Remove serial from transfer
   */
  removeSerial: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ serialId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .delete()
        .eq("id", input.serialId);

      if (error) {
        throw new Error(`Failed to remove serial: ${error.message}`);
      }

      return { success: true };
    }),

  /**
   * Confirm received (completes the transfer)
   * This moves the physical products to destination warehouse
   */
  confirmReceived: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get user profile
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can confirm receipt");
      }

      // Get transfer details
      const { data: transfer } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .select(
          `
          *,
          items:stock_transfer_items(
            id,
            product_id,
            quantity,
            serials:stock_transfer_serials(physical_product_id)
          )
        `
        )
        .eq("id", input.id)
        .eq("status", "in_transit")
        .single();

      if (!transfer) {
        throw new Error("Transfer not found or not in transit");
      }

      // Validate all items have serials equal to quantity
      for (const item of transfer.items) {
        if (item.serials.length !== item.quantity) {
          throw new Error(
            `Item for product ${item.product_id} has ${item.serials.length} serials but declared quantity is ${item.quantity}`
          );
        }
      }

      // Update physical products to new warehouse location
      const allPhysicalProductIds = transfer.items.flatMap((item: any) =>
        item.serials.map((s: { physical_product_id: string }) => s.physical_product_id)
      );

      const { error: updateError } = await ctx.supabaseAdmin
        .from("physical_products")
        .update({
          virtual_warehouse_id: transfer.to_virtual_warehouse_id,
          physical_warehouse_id: transfer.to_physical_warehouse_id,
        })
        .in("id", allPhysicalProductIds);

      if (updateError) {
        throw new Error(`Failed to update physical product locations: ${updateError.message}`);
      }

      // Update transfer status
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .update({
          status: "completed",
          received_by_id: profile.id,
          completed_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to confirm receipt: ${error.message}`);
      }

      return data;
    }),

  /**
   * Get available serials for transfer from source warehouse
   */
  getAvailableSerials: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        productId: z.string(),
        virtualWarehouseId: z.string(),
        physicalWarehouseId: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, warranty_end_date, created_at")
        .eq("product_id", input.productId)
        .eq("virtual_warehouse_id", input.virtualWarehouseId)
        .is("issued_at", null); // Not issued

      if (input.physicalWarehouseId) {
        query = query.eq("physical_warehouse_id", input.physicalWarehouseId);
      }

      if (input.search) {
        query = query.ilike("serial_number", `%${input.search}%`);
      }

      const { data, error } = await query
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        throw new Error(`Failed to get available serials: ${error.message}`);
      }

      return data || [];
    }),

  /**
   * Delete transfer (only if draft)
   */
  delete: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .delete()
        .eq("id", input.id)
        .eq("status", "draft");

      if (error) {
        throw new Error(`Failed to delete transfer: ${error.message}`);
      }

      return { success: true };
    }),
});
