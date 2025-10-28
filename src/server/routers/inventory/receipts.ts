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
            warrantyStartDate: z.string().optional(),
            warrantyMonths: z.number().int().optional(),
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
          warranty_start_date: item.warrantyStartDate,
          warranty_months: item.warrantyMonths,
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
   * Submit for approval
   */
  submitForApproval: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
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
   * Add serials to receipt item
   */
  addSerials: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        receiptItemId: z.string(),
        serials: z.array(
          z.object({
            serialNumber: z.string(),
            warrantyStartDate: z.string().optional(),
            warrantyMonths: z.number().int().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate: Check for duplicates in physical_products
      const serialNumbers = input.serials.map((s) => s.serialNumber);

      const { data: existing, error: checkError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("serial_number")
        .in("serial_number", serialNumbers);

      if (checkError) {
        throw new Error(`Failed to validate serials: ${checkError.message}`);
      }

      if (existing && existing.length > 0) {
        const duplicates = existing.map((e) => e.serial_number).join(", ");
        throw new Error(`Duplicate serials found: ${duplicates}`);
      }

      // Also check in stock_receipt_serials
      const { data: existingInReceipts } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .select("serial_number")
        .in("serial_number", serialNumbers);

      if (existingInReceipts && existingInReceipts.length > 0) {
        const duplicates = existingInReceipts.map((e) => e.serial_number).join(", ");
        throw new Error(`Serials already in receipts: ${duplicates}`);
      }

      // Insert serials
      const serialsToInsert = input.serials.map((s) => ({
        receipt_item_id: input.receiptItemId,
        serial_number: s.serialNumber,
        warranty_start_date: s.warrantyStartDate,
        warranty_months: s.warrantyMonths,
      }));

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .insert(serialsToInsert)
        .select();

      if (error) {
        throw new Error(`Failed to add serials: ${error.message}`);
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
