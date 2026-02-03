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
        receiptType: z
          .enum(["normal", "adjustment"])
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
          created_by:profiles!created_by_id(id, full_name)
        `,
          { count: "exact" }
        );

      if (input.receiptType) {
        query = query.eq("receipt_type", input.receiptType);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(input.page * input.pageSize, (input.page + 1) * input.pageSize - 1);

      if (error) {
        throw new Error(`Failed to list receipts: ${error.message}`);
      }

      // Fetch serial counts for all receipts in this page
      const receiptIds = data?.map(r => r.id) || [];
      let serialCounts: Record<string, { declared: number; entered: number }> = {};

      if (receiptIds.length > 0) {
        const { data: itemsData } = await ctx.supabaseAdmin
          .from("stock_receipt_items")
          .select("receipt_id, declared_quantity, serial_count")
          .in("receipt_id", receiptIds);

        // Aggregate counts by receipt_id
        serialCounts = (itemsData || []).reduce((acc, item) => {
          if (!acc[item.receipt_id]) {
            acc[item.receipt_id] = { declared: 0, entered: 0 };
          }
          acc[item.receipt_id].declared += item.declared_quantity;
          acc[item.receipt_id].entered += item.serial_count;
          return acc;
        }, {} as Record<string, { declared: number; entered: number }>);
      }

      // Merge serial counts with receipts
      const receiptsWithSerials = (data || []).map(receipt => ({
        ...receipt,
        totalDeclaredQuantity: serialCounts[receipt.id]?.declared || 0,
        totalSerialsEntered: serialCounts[receipt.id]?.entered || 0,
        missingSerialsCount: (serialCounts[receipt.id]?.declared || 0) - (serialCounts[receipt.id]?.entered || 0),
      }));

      return {
        receipts: receiptsWithSerials,
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
          created_by:profiles!created_by_id(id, full_name)
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
          status: "completed",
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
   * Update receipt notes/reference (simplified - no draft check)
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
   * Update full receipt - DISABLED in simplified workflow
   * In the simplified workflow, receipts are completed immediately and cannot be fully edited.
   * Use the `update` method to edit notes/reference only.
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
      })
    )
    .mutation(async () => {
      // In simplified workflow, receipts are completed immediately.
      // Editing items would affect stock and physical products.
      // Create a new receipt instead, or use adjustment receipt to correct.
      throw new Error("Không thể sửa phiếu nhập đã hoàn thành. Vui lòng tạo phiếu điều chỉnh nếu cần sửa đổi.");
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

      // Get receipt_id to exclude current receipt from duplicate check
      const { data: receiptItem } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .select("receipt_id")
        .eq("id", input.receiptItemId)
        .single();

      if (!receiptItem) {
        throw new Error("Receipt item not found");
      }

      // Check in physical_products (all products - simplified workflow has no draft)
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

      // Also check in stock_receipt_serials (serials in OTHER receipts, not current receipt)
      // First get all receipt_item_ids of current receipt
      const { data: currentReceiptItems } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .select("id")
        .eq("receipt_id", receiptItem.receipt_id);

      const currentReceiptItemIds = currentReceiptItems?.map(item => item.id) || [];

      // Check for duplicates in other receipts
      const { data: existingInReceipts } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .select("serial_number, receipt_item_id")
        .in("serial_number", serialNumbers);

      // Filter out serials from current receipt
      const duplicatesInOtherReceipts = existingInReceipts?.filter(
        serial => !currentReceiptItemIds.includes(serial.receipt_item_id)
      ) || [];

      if (duplicatesInOtherReceipts.length > 0) {
        const duplicates = duplicatesInOtherReceipts.map((e) => e.serial_number).join(", ");
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

      // Note: In simplified workflow, stock is updated immediately via trigger
      // when serial is inserted. No auto-complete needed.

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
   * Delete receipt - DISABLED in simplified workflow
   * Deleting a completed receipt would affect stock and physical products.
   * Use adjustment receipt to correct inventory instead.
   */
  delete: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async () => {
      // In simplified workflow, receipts are completed immediately with stock effects.
      // Deleting would cause data inconsistency.
      throw new Error("Không thể xóa phiếu nhập đã hoàn thành. Vui lòng tạo phiếu điều chỉnh nếu cần sửa đổi tồn kho.");
    }),
});
