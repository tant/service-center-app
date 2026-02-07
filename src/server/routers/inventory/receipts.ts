/**
 * Receipts Router - Stock receipt (Phiếu Nhập Kho) management
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type {
  StockReceipt,
  StockReceiptReason,
  StockReceiptWithRelations,
} from "@/types/inventory";
import {
  requireAnyAuthenticated,
  requireManagerOrAbove,
} from "../../middleware/requireRole";
import { publicProcedure, router } from "../../trpc";

export const receiptsRouter = router({
  /**
   * List receipts with pagination and filters
   */
  list: publicProcedure
    .use(requireAnyAuthenticated)
    .input(
      z.object({
        receiptType: z.enum(["normal", "adjustment"]).optional(),
        reason: z
          .enum(["purchase", "customer_return", "rma_return"])
          .optional(),
        page: z.number().int().min(0).default(0),
        pageSize: z.number().int().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin.from("stock_receipts").select(
        `
          *,
          created_by:profiles!created_by_id(id, full_name),
          customer:customers!customer_id(id, name, phone)
        `,
        { count: "exact" },
      );

      if (input.receiptType) {
        query = query.eq("receipt_type", input.receiptType);
      }

      if (input.reason) {
        query = query.eq("reason", input.reason);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(
          input.page * input.pageSize,
          (input.page + 1) * input.pageSize - 1,
        );

      if (error) {
        throw new Error(`Failed to list receipts: ${error.message}`);
      }

      // Fetch serial counts for all receipts in this page
      const receiptIds = data?.map((r) => r.id) || [];
      let serialCounts: Record<string, { declared: number; entered: number }> =
        {};

      if (receiptIds.length > 0) {
        const { data: itemsData } = await ctx.supabaseAdmin
          .from("stock_receipt_items")
          .select("receipt_id, declared_quantity, serial_count")
          .in("receipt_id", receiptIds);

        // Aggregate counts by receipt_id
        serialCounts = (itemsData || []).reduce(
          (acc, item) => {
            if (!acc[item.receipt_id]) {
              acc[item.receipt_id] = { declared: 0, entered: 0 };
            }
            acc[item.receipt_id].declared += item.declared_quantity;
            acc[item.receipt_id].entered += item.serial_count;
            return acc;
          },
          {} as Record<string, { declared: number; entered: number }>,
        );
      }

      // Merge serial counts with receipts
      const receiptsWithSerials = (data || []).map((receipt) => ({
        ...receipt,
        totalDeclaredQuantity: serialCounts[receipt.id]?.declared || 0,
        totalSerialsEntered: serialCounts[receipt.id]?.entered || 0,
        missingSerialsCount:
          (serialCounts[receipt.id]?.declared || 0) -
          (serialCounts[receipt.id]?.entered || 0),
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
  getById: publicProcedure
    .use(requireAnyAuthenticated)
    .input(z.object({ id: z.string() }))
    .query(
      async ({ ctx, input }): Promise<StockReceiptWithRelations | null> => {
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
          customer:customers!customer_id(id, name, phone)
        `,
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
          attachments: attachments || [],
        } as StockReceiptWithRelations;
      },
    ),

  /**
   * Create new receipt (draft)
   */
  create: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z
        .object({
          receiptType: z.enum(["normal", "adjustment"]), // REDESIGNED: Simplified to 2 types
          reason: z
            .enum(["purchase", "customer_return", "rma_return"])
            .optional()
            .default("purchase"),
          customerId: z.string().optional(), // Required for customer_return
          rmaReference: z.string().optional(), // Optional for rma_return
          virtualWarehouseId: z.string(), // REDESIGNED: Direct warehouse reference
          receiptDate: z.string(),
          expectedDate: z.string().optional(),
          supplierId: z.string().optional(),
          rmaBatchId: z.string().optional(),
          referenceDocumentNumber: z.string().optional(),
          notes: z.string().optional(),
          items: z
            .array(
              z.object({
                productId: z.string(),
                declaredQuantity: z.number().int(), // REDESIGNED: Can be negative for adjustments
                unitPrice: z.number().optional(),
                notes: z.string().optional(),
              }),
            )
            .min(1),
        })
        .refine(
          (data) => {
            // Validate: normal receipts must have positive quantities
            if (data.receiptType === "normal") {
              return data.items.every((item) => item.declaredQuantity > 0);
            }
            // Adjustment receipts: allow negative but not zero
            return data.items.every((item) => item.declaredQuantity !== 0);
          },
          {
            message:
              "Normal receipts require positive quantities. Adjustments cannot have zero quantity.",
          },
        )
        .refine(
          (data) => {
            // Validate: customer_return requires customerId
            if (data.reason === "customer_return" && !data.customerId) {
              return false;
            }
            return true;
          },
          {
            message: "Vui lòng chọn khách hàng khi nhập hàng trả lại",
          },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      // Get user profile ID
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Chỉ admin và manager mới có quyền tạo phiếu nhập",
        });
      }

      // Insert receipt
      const { data: receipt, error: receiptError } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .insert({
          receipt_type: input.receiptType,
          reason: input.reason,
          customer_id: input.customerId || null,
          rma_reference: input.rmaReference || null,
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
          throw new Error(
            `Failed to create receipt items: ${itemsError.message}`,
          );
        }
      }

      return receipt;
    }),

  /**
   * Update receipt notes/reference (simplified - no draft check)
   */
  update: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
        referenceDocumentNumber: z.string().optional(),
      }),
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
  updateFull: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        receiptType: z.enum(["normal", "adjustment"]),
        virtualWarehouseId: z.string(),
        receiptDate: z.string(),
        notes: z.string().optional(),
        referenceDocumentNumber: z.string().optional(),
        items: z
          .array(
            z.object({
              id: z.string().optional(),
              productId: z.string(),
              declaredQuantity: z.number().int(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async () => {
      // In simplified workflow, receipts are completed immediately.
      // Editing items would affect stock and physical products.
      // Create a new receipt instead, or use adjustment receipt to correct.
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Không thể sửa phiếu nhập đã hoàn thành. Vui lòng tạo phiếu điều chỉnh nếu cần sửa đổi.",
      });
    }),

  /**
   * Add serials to receipt item
   * Validates serials based on receipt reason:
   * - purchase: Serial must NOT exist (new goods)
   * - customer_return: Serial must be in customer_installed warehouse
   * - rma_return: Serial must be in rma_staging OR not exist (replacement from supplier)
   */
  addSerials: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        receiptItemId: z.string(),
        serials: z.array(
          z.object({
            serialNumber: z.string(),
            manufacturerWarrantyEndDate: z.string().optional(),
            userWarrantyEndDate: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Issue #21: Validate array size to prevent "URI too long" error
      // Frontend should chunk requests, but validate here as safeguard
      if (input.serials.length > 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vui lòng nhập tối đa 100 serials/lần. Hệ thống đã tự động chia nhỏ request.",
        });
      }

      const serialNumbers = input.serials.map((s) => s.serialNumber);

      // Get receipt item with receipt details including reason and target warehouse
      const { data: receiptItem } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .select(`
          receipt_id,
          product_id,
          receipt:stock_receipts(
            id,
            reason,
            receipt_type,
            virtual_warehouse_id
          )
        `)
        .eq("id", input.receiptItemId)
        .single();

      if (!receiptItem?.receipt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy item trong phiếu nhập",
        });
      }

      const receipt = Array.isArray(receiptItem.receipt)
        ? receiptItem.receipt[0]
        : receiptItem.receipt;
      const reason = receipt.reason || "purchase";
      const targetWarehouseId = receipt.virtual_warehouse_id;

      // Check for duplicates in other receipts (only for purchase - new goods)
      // For customer_return and rma_return, serials already exist in previous receipts (e.g., original purchase)
      if (reason === "purchase") {
        const { data: currentReceiptItems } = await ctx.supabaseAdmin
          .from("stock_receipt_items")
          .select("id")
          .eq("receipt_id", receiptItem.receipt_id);

        const currentReceiptItemIds =
          currentReceiptItems?.map((item) => item.id) || [];

        const { data: existingInReceipts } = await ctx.supabaseAdmin
          .from("stock_receipt_serials")
          .select("serial_number, receipt_item_id")
          .in("serial_number", serialNumbers);

        const duplicatesInOtherReceipts =
          existingInReceipts?.filter(
            (serial) => !currentReceiptItemIds.includes(serial.receipt_item_id),
          ) || [];

        if (duplicatesInOtherReceipts.length > 0) {
          const duplicates = duplicatesInOtherReceipts
            .map((e) => e.serial_number)
            .join(", ");
          throw new TRPCError({
            code: "CONFLICT",
            message: `Serial đã có trong phiếu nhập khác: ${duplicates}`,
          });
        }
      }

      // Check existing physical products with warehouse info
      // Note: Must specify FK with !virtual_warehouse_id because physical_products has 2 FKs to virtual_warehouses
      const { data: existingProducts, error: checkError } =
        await ctx.supabaseAdmin
          .from("physical_products")
          .select(`
          id,
          serial_number,
          virtual_warehouse_id,
          virtual_warehouse:virtual_warehouses!virtual_warehouse_id(id, name, warehouse_type)
        `)
          .in("serial_number", serialNumbers);

      if (checkError) {
        throw new Error(`Không thể kiểm tra serial: ${checkError.message}`);
      }

      // Validate serials based on reason
      const validationErrors: string[] = [];
      const serialsToCreate: string[] = [];
      const serialsToTransfer: { id: string; serialNumber: string }[] = [];

      for (const serialNumber of serialNumbers) {
        const existing = existingProducts?.find(
          (p) => p.serial_number === serialNumber,
        );
        // Handle Supabase join result type
        const warehouse = existing?.virtual_warehouse as
          | { id: string; name: string; warehouse_type: string }
          | { id: string; name: string; warehouse_type: string }[]
          | null;
        const warehouseType = Array.isArray(warehouse)
          ? warehouse[0]?.warehouse_type
          : warehouse?.warehouse_type;
        const warehouseName = Array.isArray(warehouse)
          ? warehouse[0]?.name
          : warehouse?.name;

        switch (reason) {
          case "purchase":
            // Purchase: Serial must NOT exist
            if (existing) {
              validationErrors.push(
                `Serial "${serialNumber}" đã tồn tại trong "${warehouseName}". Không thể nhập mua hàng với serial đã có.`,
              );
            } else {
              serialsToCreate.push(serialNumber);
            }
            break;

          case "customer_return":
            // Customer return: Serial must be in customer_installed warehouse
            if (!existing) {
              validationErrors.push(
                `Serial "${serialNumber}" không tồn tại trong hệ thống. Không thể nhập hàng trả lại.`,
              );
            } else if (warehouseType === "customer_installed") {
              serialsToTransfer.push({ id: existing.id, serialNumber });
            } else {
              validationErrors.push(
                `Serial "${serialNumber}" đang ở "${warehouseName}", không phải hàng đã bán. Vui lòng kiểm tra lại hoặc chọn loại phiếu phù hợp.`,
              );
            }
            break;

          case "rma_return":
            // RMA return: Serial must be in rma_staging OR not exist (replacement from supplier)
            if (!existing) {
              // New serial from supplier replacement
              serialsToCreate.push(serialNumber);
            } else if (warehouseType === "rma_staging") {
              serialsToTransfer.push({ id: existing.id, serialNumber });
            } else {
              validationErrors.push(
                `Serial "${serialNumber}" đang ở "${warehouseName}", không phải hàng chờ RMA. Vui lòng kiểm tra lại hoặc chọn loại phiếu phù hợp.`,
              );
            }
            break;

          default:
            // For adjustment receipts, allow both new and existing serials
            if (existing) {
              serialsToTransfer.push({ id: existing.id, serialNumber });
            } else {
              serialsToCreate.push(serialNumber);
            }
        }
      }

      if (validationErrors.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validationErrors.join("\n"),
        });
      }

      // Transfer existing physical products to target warehouse
      if (serialsToTransfer.length > 0) {
        const { error: transferError } = await ctx.supabaseAdmin
          .from("physical_products")
          .update({ virtual_warehouse_id: targetWarehouseId })
          .in(
            "id",
            serialsToTransfer.map((s) => s.id),
          );

        if (transferError) {
          throw new Error(
            `Không thể chuyển kho cho serial: ${transferError.message}`,
          );
        }
      }

      // Insert receipt serials
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
        // Handle unique constraint violation (duplicate serial in same receipt)
        if (error.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Serial number bị trùng. Vui lòng kiểm tra lại danh sách serial.",
          });
        }
        // Other database errors
        throw new Error(`Failed to add serials: ${error.message}`);
      }

      // Note: In simplified workflow, stock is updated immediately via trigger
      // when serial is inserted for new products. For transferred products,
      // warehouse is already updated above.

      return data;
    }),

  /**
   * Remove serial
   */
  removeSerial: publicProcedure
    .use(requireManagerOrAbove)
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
  delete: publicProcedure
    .use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async () => {
      // In simplified workflow, receipts are completed immediately with stock effects.
      // Deleting would cause data inconsistency.
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Không thể xóa phiếu nhập đã hoàn thành. Vui lòng tạo phiếu điều chỉnh nếu cần sửa đổi tồn kho.",
      });
    }),
});
