/**
 * Receipts Router - Stock receipt (Phiếu Nhập Kho) management
 */

import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import { requireAnyAuthenticated, requireManagerOrAbove } from "../../middleware/requireRole";
import type { StockReceipt, StockReceiptWithRelations } from "@/types/inventory";

export const receiptsRouter = router({
  /**
   * List receipts with pagination and filters
   */
  list: publicProcedure.use(requireAnyAuthenticated)
    .input(
      z.object({
        status: z
          .enum(["draft", "pending_approval", "approved", "completed", "cancelled"])
          .optional(),
        receiptType: z
          .enum(["normal", "adjustment"]) // REDESIGNED: Simplified to 2 types
          .optional(),
        page: z.number().int().min(0).default(0),
        pageSize: z.number().int().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("stock_receipts")
        .select(
          `
          *,
          created_by:profiles!created_by_id(id, full_name),
          approved_by:profiles!approved_by_id(id, full_name)
        `,
          { count: "exact" }
        );

      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.receiptType) {
        query = query.eq("receipt_type", input.receiptType);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(input.page * input.pageSize, (input.page + 1) * input.pageSize - 1);

      if (error) {
        throw new Error(`Failed to list receipts: ${error.message}`);
      }

      return {
        receipts: data || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil((count || 0) / input.pageSize),
      };
    }),

  /**
   * Get single receipt with full details
   */
  getById: publicProcedure.use(requireAnyAuthenticated)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<StockReceiptWithRelations | null> => {
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .select(
          `
          *,
          items:stock_receipt_items(
            *,
            product:products(id, name, sku),
            serials:stock_receipt_serials(*)
          ),
          virtual_warehouse:virtual_warehouses!virtual_warehouse_id(id, name),
          created_by:profiles!created_by_id(id, full_name),
          approved_by:profiles!approved_by_id(id, full_name),
          completed_by:profiles!completed_by_id(id, full_name)
        `
        )
        .eq("id", input.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw new Error(`Failed to get receipt: ${error.message}`);
      }

      // Query attachments separately (polymorphic relationship)
      const { data: attachments } = await ctx.supabaseAdmin
        .from("stock_document_attachments")
        .select("*")
        .eq("document_type", "receipt")
        .eq("document_id", input.id);

      return {
        ...data,
        attachments: attachments || []
      } as StockReceiptWithRelations;
    }),

  /**
   * Create new receipt (draft)
   */
  create: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        receiptType: z.enum(["normal", "adjustment"]), // REDESIGNED: Simplified to 2 types
        virtualWarehouseId: z.string(), // REDESIGNED: Direct warehouse reference
        receiptDate: z.string(),
        expectedDate: z.string().optional(),
        supplierId: z.string().optional(),
        rmaBatchId: z.string().optional(),
        referenceDocumentNumber: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.string(),
            declaredQuantity: z.number().int(), // REDESIGNED: Can be negative for adjustments
            unitPrice: z.number().optional(),
            notes: z.string().optional(),
          })
        ).min(1),
      }).refine(
        (data) => {
          // Validate: normal receipts must have positive quantities
          if (data.receiptType === "normal") {
            return data.items.every((item) => item.declaredQuantity > 0);
          }
          // Adjustment receipts: allow negative but not zero
          return data.items.every((item) => item.declaredQuantity !== 0);
        },
        {
          message: "Normal receipts require positive quantities. Adjustments cannot have zero quantity.",
        }
      )
    )
    .mutation(async ({ ctx, input }) => {
      // Get user profile ID
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can create receipts");
      }

      // Insert receipt
      const { data: receipt, error: receiptError } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .insert({
          receipt_type: input.receiptType,
          virtual_warehouse_id: input.virtualWarehouseId, // REDESIGNED: Direct warehouse reference
          receipt_date: input.receiptDate,
          expected_date: input.expectedDate,
          supplier_id: input.supplierId,
          rma_batch_id: input.rmaBatchId,
          reference_document_number: input.referenceDocumentNumber,
          notes: input.notes,
          status: "draft",
          created_by_id: profile.id,
        })
        .select()
        .single();

      if (receiptError) {
        throw new Error(`Failed to create receipt: ${receiptError.message}`);
      }

      // Insert items
      if (input.items.length > 0) {
        const items = input.items.map((item) => ({
          receipt_id: receipt.id,
          product_id: item.productId,
          declared_quantity: item.declaredQuantity,
          unit_price: item.unitPrice,
          notes: item.notes,
        }));

        const { error: itemsError } = await ctx.supabaseAdmin
          .from("stock_receipt_items")
          .insert(items);

        if (itemsError) {
          throw new Error(`Failed to create receipt items: ${itemsError.message}`);
        }
      }

      return receipt;
    }),

  /**
   * Update receipt (only if draft)
   */
  update: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
        referenceDocumentNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check status first
      const { data: receipt } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .select("status, created_by_id")
        .eq("id", input.id)
        .single();

      if (!receipt) {
        throw new Error("Receipt not found");
      }

      if (receipt.status !== "draft") {
        throw new Error("Cannot edit receipt after draft status");
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
        receipt.created_by_id !== profile.id &&
        !["admin", "manager"].includes(profile.role)
      ) {
        throw new Error("Unauthorized to edit this receipt");
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({
          notes: input.notes,
          reference_document_number: input.referenceDocumentNumber,
        })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update receipt: ${error.message}`);
      }

      return data;
    }),

  /**
   * Update full receipt (only if draft) - for editing all fields
   */
  updateFull: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        receiptType: z.enum(["normal", "adjustment"]),
        virtualWarehouseId: z.string(),
        receiptDate: z.string(),
        notes: z.string().optional(),
        referenceDocumentNumber: z.string().optional(),
        items: z.array(
          z.object({
            id: z.string().optional(),
            productId: z.string(),
            declaredQuantity: z.number().int(),
          })
        ).min(1),
      }).refine(
        (data) => {
          // Validate: normal receipts must have positive quantities
          if (data.receiptType === "normal") {
            return data.items.every((item) => item.declaredQuantity > 0);
          }
          // Adjustment receipts: allow negative but not zero
          return data.items.every((item) => item.declaredQuantity !== 0);
        },
        {
          message: "Normal receipts require positive quantities. Adjustments cannot have zero quantity.",
        }
      )
    )
    .mutation(async ({ ctx, input }) => {
      // Check status first
      const { data: receipt } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .select("status, created_by_id")
        .eq("id", input.id)
        .single();

      if (!receipt) {
        throw new Error("Receipt not found");
      }

      if (receipt.status !== "draft") {
        throw new Error("Cannot edit receipt after draft status");
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
        receipt.created_by_id !== profile.id &&
        !["admin", "manager"].includes(profile.role)
      ) {
        throw new Error("Unauthorized to edit this receipt");
      }

      // Get existing item IDs first
      const { data: existingItems } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .select("id")
        .eq("receipt_id", input.id);

      const itemIds = existingItems?.map(item => item.id) || [];

      // Delete existing serials first (if there are items)
      if (itemIds.length > 0) {
        await ctx.supabaseAdmin
          .from("stock_receipt_serials")
          .delete()
          .in("receipt_item_id", itemIds);
      }

      // Delete existing items
      const { error: deleteItems } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .delete()
        .eq("receipt_id", input.id);

      if (deleteItems) {
        throw new Error(`Failed to delete existing items: ${deleteItems.message}`);
      }

      // Update receipt header
      const { data: updatedReceipt, error: updateError } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({
          receipt_type: input.receiptType,
          virtual_warehouse_id: input.virtualWarehouseId,
          receipt_date: input.receiptDate,
          notes: input.notes,
          reference_document_number: input.referenceDocumentNumber,
        })
        .eq("id", input.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update receipt: ${updateError.message}`);
      }

      // Insert new items
      if (input.items.length > 0) {
        const items = input.items.map((item) => ({
          receipt_id: input.id,
          product_id: item.productId,
          declared_quantity: item.declaredQuantity,
        }));

        const { error: itemsError } = await ctx.supabaseAdmin
          .from("stock_receipt_items")
          .insert(items);

        if (itemsError) {
          throw new Error(`Failed to create receipt items: ${itemsError.message}`);
        }
      }

      return updatedReceipt;
    }),

  /**
   * Submit for approval
   */
  submitForApproval: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // VALIDATION CHECKPOINT #2: Verify all serials don't exist in system before submit

      // Get all item IDs for this receipt
      const { data: receiptItems } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .select("id")
        .eq("receipt_id", input.id);

      if (receiptItems && receiptItems.length > 0) {
        // Get all serials in this receipt
        const receiptItemIds = receiptItems.map(item => item.id);
        const { data: receiptSerials } = await ctx.supabaseAdmin
          .from("stock_receipt_serials")
          .select("serial_number")
          .in("receipt_item_id", receiptItemIds);

        if (receiptSerials && receiptSerials.length > 0) {
          const serialNumbers = receiptSerials.map(s => s.serial_number);

          // Check if any serial already exists in physical_products
          const { data: existing } = await ctx.supabaseAdmin
            .from("physical_products")
            .select("serial_number")
            .in("serial_number", serialNumbers);

          if (existing && existing.length > 0) {
            const duplicates = existing.map(e => e.serial_number).join(", ");
            throw new Error(`Không thể gửi duyệt: Các serial sau đã tồn tại trong hệ thống: ${duplicates}`);
          }
        }
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipts")
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
   * Approve receipt - Manager/Admin only
   */
  approve: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get user profile ID
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can approve receipts");
      }

      // VALIDATION CHECKPOINT #3: Verify all serials don't exist in system before approval

      // Get all item IDs for this receipt
      const { data: receiptItems } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .select("id")
        .eq("receipt_id", input.id);

      if (receiptItems && receiptItems.length > 0) {
        // Get all serials in this receipt
        const receiptItemIds = receiptItems.map(item => item.id);
        const { data: receiptSerials } = await ctx.supabaseAdmin
          .from("stock_receipt_serials")
          .select("serial_number")
          .in("receipt_item_id", receiptItemIds);

        if (receiptSerials && receiptSerials.length > 0) {
          const serialNumbers = receiptSerials.map(s => s.serial_number);

          // Check if any serial already exists in physical_products
          const { data: existing } = await ctx.supabaseAdmin
            .from("physical_products")
            .select("serial_number")
            .in("serial_number", serialNumbers);

          if (existing && existing.length > 0) {
            const duplicates = existing.map(e => e.serial_number).join(", ");
            throw new Error(`Không thể duyệt phiếu: Các serial sau đã tồn tại trong hệ thống: ${duplicates}`);
          }
        }
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({
          status: "approved",
          approved_by_id: profile.id,
          approved_at: new Date().toISOString()
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
   * Reject receipt - Manager/Admin only
   */
  reject: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({
      id: z.string(),
      reason: z.string().min(1, "Rejection reason is required")
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({
          status: "cancelled",
          rejection_reason: input.reason
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
   * Add serials to receipt item
   */
  addSerials: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        receiptItemId: z.string(),
        serials: z.array(
          z.object({
            serialNumber: z.string(),
            manufacturerWarrantyEndDate: z.string().optional(),
            userWarrantyEndDate: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // VALIDATION CHECKPOINT #1: Ensure serials don't exist in system yet
      const serialNumbers = input.serials.map((s) => s.serialNumber);

      // Check in physical_products (already created products)
      const { data: existing, error: checkError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("serial_number")
        .in("serial_number", serialNumbers);

      if (checkError) {
        throw new Error(`Không thể kiểm tra serial: ${checkError.message}`);
      }

      if (existing && existing.length > 0) {
        const duplicates = existing.map((e) => e.serial_number).join(", ");
        throw new Error(`Serial đã tồn tại trong hệ thống: ${duplicates}`);
      }

      // Also check in stock_receipt_serials (serials in other receipts)
      const { data: existingInReceipts } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .select("serial_number")
        .in("serial_number", serialNumbers);

      if (existingInReceipts && existingInReceipts.length > 0) {
        const duplicates = existingInReceipts.map((e) => e.serial_number).join(", ");
        throw new Error(`Serial đã có trong phiếu nhập khác: ${duplicates}`);
      }

      // Insert serials
      const serialsToInsert = input.serials.map((s) => ({
        receipt_item_id: input.receiptItemId,
        serial_number: s.serialNumber,
        manufacturer_warranty_end_date: s.manufacturerWarrantyEndDate,
        user_warranty_end_date: s.userWarrantyEndDate,
      }));

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .insert(serialsToInsert)
        .select();

      if (error) {
        throw new Error(`Failed to add serials: ${error.message}`);
      }

      // Auto-complete: Check if all serials are complete
      // Get receipt item to know declared_quantity
      const { data: receiptItem } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .select("declared_quantity, receipt_id")
        .eq("id", input.receiptItemId)
        .single();

      if (receiptItem) {
        // Get receipt status
        const { data: receipt } = await ctx.supabaseAdmin
          .from("stock_receipts")
          .select("status")
          .eq("id", receiptItem.receipt_id)
          .single();

        if (receipt && receipt.status === "approved") {
          // Get current serial count for this receipt
          const { data: allItems } = await ctx.supabaseAdmin
            .from("stock_receipt_items")
            .select(`
              id,
              declared_quantity,
              stock_receipt_serials(id)
            `)
            .eq("receipt_id", receiptItem.receipt_id);

          if (allItems) {
            const totalDeclared = allItems.reduce((sum, item) => sum + item.declared_quantity, 0);
            const totalSerials = allItems.reduce((sum, item) => sum + (item.stock_receipt_serials?.length || 0), 0);

            // Auto-complete if all serials are entered
            if (totalSerials >= totalDeclared) {
              await ctx.supabaseAdmin
                .from("stock_receipts")
                .update({
                  status: "completed",
                  completed_at: new Date().toISOString(),
                  completed_by_id: ctx.user?.id
                })
                .eq("id", receiptItem.receipt_id)
                .eq("status", "approved");
            }
          }
        }
      }

      return data;
    }),

  /**
   * Remove serial
   */
  removeSerial: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ serialId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .delete()
        .eq("id", input.serialId);

      if (error) {
        throw new Error(`Failed to remove serial: ${error.message}`);
      }

      return { success: true };
    }),

  /**
   * Delete receipt (only if draft)
   */
  delete: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .delete()
        .eq("id", input.id)
        .eq("status", "draft");

      if (error) {
        throw new Error(`Failed to delete receipt: ${error.message}`);
      }

      return { success: true };
    }),
});
