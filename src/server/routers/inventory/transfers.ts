/**
 * Transfers Router - Stock transfer (Phiếu Chuyển Kho) management
 * SIMPLIFIED: No draft/approval workflow - all transfers are completed immediately
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { requireManagerOrAbove } from "../../middleware/requireRole";
import { publicProcedure, router } from "../../trpc";

export const transfersRouter = router({
  /**
   * List transfers with pagination and filters
   */
  list: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        page: z.number().int().min(0).default(0),
        pageSize: z.number().int().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const query = ctx.supabaseAdmin.from("stock_transfers").select(
        `
          *,
          created_by:profiles!created_by_id(id, full_name)
        `,
        { count: "exact" },
      );

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(
          input.page * input.pageSize,
          (input.page + 1) * input.pageSize - 1,
        );

      if (error) {
        throw new Error(`Failed to list transfers: ${error.message}`);
      }

      // Fetch serial counts for all transfers in this page
      const transferIds = data?.map((t) => t.id) || [];
      const serialCounts: Record<
        string,
        { declared: number; entered: number }
      > = {};

      if (transferIds.length > 0) {
        const { data: itemsData } = await ctx.supabaseAdmin
          .from("stock_transfer_items")
          .select(`
            transfer_id,
            quantity,
            id
          `)
          .in("transfer_id", transferIds);

        if (itemsData) {
          const itemIds = itemsData.map((item) => item.id);
          const { data: serialData } = await ctx.supabaseAdmin
            .from("stock_transfer_serials")
            .select("transfer_item_id")
            .in("transfer_item_id", itemIds);

          const serialCountsByItem: Record<string, number> = {};
          (serialData || []).forEach((serial) => {
            serialCountsByItem[serial.transfer_item_id] =
              (serialCountsByItem[serial.transfer_item_id] || 0) + 1;
          });

          itemsData.forEach((item) => {
            if (!serialCounts[item.transfer_id]) {
              serialCounts[item.transfer_id] = { declared: 0, entered: 0 };
            }
            serialCounts[item.transfer_id].declared += item.quantity;
            serialCounts[item.transfer_id].entered +=
              serialCountsByItem[item.id] || 0;
          });
        }
      }

      const transfersWithSerials = (data || []).map((transfer) => ({
        ...transfer,
        totalDeclaredQuantity: serialCounts[transfer.id]?.declared || 0,
        totalSerialsEntered: serialCounts[transfer.id]?.entered || 0,
        missingSerialsCount:
          (serialCounts[transfer.id]?.declared || 0) -
          (serialCounts[transfer.id]?.entered || 0),
      }));

      return {
        transfers: transfersWithSerials,
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil((count || 0) / input.pageSize),
      };
    }),

  /**
   * Get single transfer with full details
   */
  getById: publicProcedure
    .use(requireManagerOrAbove)
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
              physical_product:physical_products(serial_number, manufacturer_warranty_end_date, user_warranty_end_date)
            )
          ),
          from_virtual_warehouse:virtual_warehouses!from_virtual_warehouse_id(id, name),
          to_virtual_warehouse:virtual_warehouses!to_virtual_warehouse_id(id, name),
          created_by:profiles!created_by_id(id, full_name),
          customer:customers(id, name, phone)
        `,
        )
        .eq("id", input.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw new Error(`Failed to get transfer: ${error.message}`);
      }

      const { data: attachments } = await ctx.supabaseAdmin
        .from("stock_document_attachments")
        .select("*")
        .eq("document_type", "transfer")
        .eq("document_id", input.id);

      return {
        ...data,
        attachments: attachments || [],
      };
    }),

  /**
   * Create new transfer (completed immediately)
   */
  create: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        fromVirtualWarehouseId: z.string(),
        toVirtualWarehouseId: z.string(),
        transferDate: z.string(),
        expectedDeliveryDate: z.string().optional(),
        notes: z.string().optional(),
        customerId: z.string().uuid().optional(), // Required when transferring to customer_installed
        items: z
          .array(
            z.object({
              productId: z.string(),
              quantity: z.number().int().min(1),
              notes: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user?.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error(
          "Unauthorized: Only admin and manager can create transfers",
        );
      }

      if (input.fromVirtualWarehouseId === input.toVirtualWarehouseId) {
        throw new Error("Cannot transfer to the same warehouse");
      }

      // Validate warehouse types - customer_installed cannot be used in transfers
      const { data: fromWarehouse } = await ctx.supabaseAdmin
        .from("virtual_warehouses")
        .select("warehouse_type")
        .eq("id", input.fromVirtualWarehouseId)
        .single();

      if (fromWarehouse?.warehouse_type === "customer_installed") {
        throw new Error(
          "Không thể chuyển kho từ 'Hàng Đã Bán'. Nếu khách trả lại hàng, vui lòng sử dụng Phiếu nhập kho.",
        );
      }

      const { data: toWarehouse } = await ctx.supabaseAdmin
        .from("virtual_warehouses")
        .select("warehouse_type")
        .eq("id", input.toVirtualWarehouseId)
        .single();

      if (toWarehouse?.warehouse_type === "customer_installed") {
        throw new Error(
          "Không thể chuyển kho vào 'Hàng Đã Bán'. Để xuất hàng cho khách, vui lòng sử dụng Phiếu xuất kho.",
        );
      }

      // TC-NEG-008: Validate stock availability before creating transfer
      const productIds = input.items.map((item) => item.productId);
      const { data: stockData, error: stockError } = await ctx.supabaseAdmin
        .from("product_warehouse_stock")
        .select("product_id, declared_quantity, products(name, sku)")
        .eq("virtual_warehouse_id", input.fromVirtualWarehouseId)
        .in("product_id", productIds);

      if (stockError) {
        throw new Error(
          `Failed to check stock availability: ${stockError.message}`,
        );
      }

      // Create a map of product_id -> available quantity
      const stockMap = new Map<string, { quantity: number; name: string }>();
      (stockData || []).forEach((stock: any) => {
        stockMap.set(stock.product_id, {
          quantity: stock.declared_quantity || 0,
          name: stock.products?.name || "Unknown",
        });
      });

      // Validate each item has sufficient stock
      const insufficientStock: string[] = [];
      for (const item of input.items) {
        const available = stockMap.get(item.productId);
        if (!available) {
          // Product not in source warehouse at all
          const { data: product } = await ctx.supabaseAdmin
            .from("products")
            .select("name")
            .eq("id", item.productId)
            .single();
          insufficientStock.push(
            `Sản phẩm "${product?.name || item.productId}" không có trong kho nguồn`,
          );
        } else if (available.quantity < item.quantity) {
          // Insufficient quantity
          insufficientStock.push(
            `Sản phẩm "${available.name}": Yêu cầu ${item.quantity}, khả dụng ${available.quantity}`,
          );
        }
      }

      if (insufficientStock.length > 0) {
        throw new Error(
          `Số lượng yêu cầu vượt quá tồn kho khả dụng:\n${insufficientStock.join("\n")}`,
        );
      }

      const { data: transfer, error: transferError } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .insert({
          from_virtual_warehouse_id: input.fromVirtualWarehouseId,
          to_virtual_warehouse_id: input.toVirtualWarehouseId,
          transfer_date: input.transferDate,
          expected_delivery_date: input.expectedDeliveryDate,
          notes: input.notes,
          customer_id: input.customerId,
          status: "completed",
          created_by_id: profile.id,
        })
        .select()
        .single();

      if (transferError) {
        throw new Error(`Failed to create transfer: ${transferError.message}`);
      }

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
          throw new Error(
            `Failed to create transfer items: ${itemsError.message}`,
          );
        }
      }

      return transfer;
    }),

  /**
   * Update transfer notes/reference (simplified - no draft check)
   */
  update: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
        expectedDeliveryDate: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
   * Update full transfer - DISABLED in simplified workflow
   */
  updateFull: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        fromVirtualWarehouseId: z.string(),
        toVirtualWarehouseId: z.string(),
        transferDate: z.string(),
        notes: z.string().optional(),
        customerId: z.string().uuid().optional(),
        items: z
          .array(
            z.object({
              id: z.string().optional(),
              productId: z.string(),
              quantity: z.number().int().min(1),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async () => {
      throw new Error(
        "Không thể sửa phiếu chuyển đã hoàn thành. Vui lòng tạo phiếu chuyển mới nếu cần.",
      );
    }),

  /**
   * Select serials for transfer item
   * Stock is updated immediately via trigger
   */
  selectSerials: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        transferItemId: z.string(),
        physicalProductIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

      // Validate physical products exist, are ACTIVE, and belong to source warehouse
      const { data: physicalProducts, error: validateError } =
        await ctx.supabaseAdmin
          .from("physical_products")
          .select(
            "id, serial_number, product_id, virtual_warehouse_id, physical_warehouse_id",
          )
          .in("id", input.physicalProductIds)
          .eq("status", "active");

      if (validateError) {
        throw new Error(
          `Failed to validate physical products: ${validateError.message}`,
        );
      }

      if (
        !physicalProducts ||
        physicalProducts.length !== input.physicalProductIds.length
      ) {
        throw new Error("Some physical products not found");
      }

      // Check all belong to correct product and source warehouse
      const invalid = physicalProducts.filter(
        (p) =>
          p.product_id !== transferItem.product_id ||
          p.virtual_warehouse_id !== transfer.from_virtual_warehouse_id ||
          (transfer.from_physical_warehouse_id &&
            p.physical_warehouse_id !== transfer.from_physical_warehouse_id),
      );

      if (invalid.length > 0) {
        const serials = invalid.map((p) => p.serial_number).join(", ");
        throw new Error(
          `Physical products do not match source warehouse/product: ${serials}`,
        );
      }

      // Check not already in another transfer
      const { data: existingTransfers } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .select("physical_product_id, serial_number")
        .in("physical_product_id", input.physicalProductIds);

      if (existingTransfers && existingTransfers.length > 0) {
        const duplicates = existingTransfers
          .map((e) => e.serial_number)
          .join(", ");
        throw new Error(`Physical products already in transfer: ${duplicates}`);
      }

      // Check quantity doesn't exceed declared quantity
      const { data: currentSerials } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .select("id")
        .eq("transfer_item_id", input.transferItemId);

      const currentCount = currentSerials?.length || 0;
      if (
        currentCount + input.physicalProductIds.length >
        transferItem.quantity
      ) {
        throw new Error(
          `Cannot add ${input.physicalProductIds.length} serials. Would exceed declared quantity of ${transferItem.quantity}`,
        );
      }

      // Insert transfer serials (trigger will update stock)
      const serialsToInsert = input.physicalProductIds.map((ppId) => {
        const pp = physicalProducts.find((p) => p.id === ppId);
        return {
          transfer_item_id: input.transferItemId,
          physical_product_id: ppId,
          serial_number: pp?.serial_number ?? "",
        };
      });

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .insert(serialsToInsert)
        .select();

      if (error) {
        throw new Error(`Failed to add serials: ${error.message}`);
      }

      // Update last_known_customer_id if transferring to customer_installed
      const { data: transferForCustomer } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .select("to_virtual_warehouse_id, customer_id")
        .eq("id", transferItem.transfer_id)
        .single();

      if (
        transferForCustomer?.to_virtual_warehouse_id &&
        transferForCustomer.customer_id
      ) {
        const { data: toWarehouse } = await ctx.supabaseAdmin
          .from("virtual_warehouses")
          .select("warehouse_type")
          .eq("id", transferForCustomer.to_virtual_warehouse_id)
          .single();

        if (toWarehouse?.warehouse_type === "customer_installed") {
          await ctx.supabaseAdmin
            .from("physical_products")
            .update({ last_known_customer_id: transferForCustomer.customer_id })
            .in("id", input.physicalProductIds);
        }
      }

      return data;
    }),

  /**
   * Select serials by serial numbers (for manual input)
   */
  selectSerialsByNumbers: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        transferItemId: z.string(),
        serialNumbers: z.array(z.string()),
        virtualWarehouseId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.serialNumbers.length === 0) {
        throw new Error("No serial numbers provided");
      }

      // Issue #21: Validate array size to prevent "URI too long" error
      if (input.serialNumbers.length > 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vui lòng chọn tối đa 100 serials/lần. Hệ thống đã tự động chia nhỏ request.",
        });
      }

      const { data: transferItem } = await ctx.supabaseAdmin
        .from("stock_transfer_items")
        .select("transfer_id, product_id, quantity")
        .eq("id", input.transferItemId)
        .single();

      if (!transferItem) {
        throw new Error("Transfer item not found");
      }

      const { data: transfer } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .select("from_virtual_warehouse_id, to_virtual_warehouse_id")
        .eq("id", transferItem.transfer_id)
        .single();

      if (!transfer) {
        throw new Error("Transfer not found");
      }

      if (input.virtualWarehouseId !== transfer.from_virtual_warehouse_id) {
        throw new Error("Kho nguồn không khớp với phiếu chuyển.");
      }

      const { data: physicalProducts, error: findError } =
        await ctx.supabaseAdmin
          .from("physical_products")
          .select("id, serial_number, product_id, virtual_warehouse_id")
          .eq("product_id", transferItem.product_id)
          .eq("virtual_warehouse_id", input.virtualWarehouseId)
          .eq("status", "active")
          .in("serial_number", input.serialNumbers);

      if (findError) {
        throw new Error(`Failed to find serial numbers: ${findError.message}`);
      }

      // Check all serials were found
      const foundSerials = new Set(
        physicalProducts?.map((p) => p.serial_number) || [],
      );
      const notFound = input.serialNumbers.filter(
        (sn) => !foundSerials.has(sn),
      );

      if (notFound.length > 0) {
        throw new Error(
          `Serial không tồn tại trong kho nguồn: ${notFound.join(", ")}`,
        );
      }

      // CRITICAL: Ensure we found all physical products and they have valid IDs
      if (
        !physicalProducts ||
        physicalProducts.length !== input.serialNumbers.length
      ) {
        throw new Error(
          `Không tìm thấy đủ serial trong kho nguồn. Cần ${input.serialNumbers.length}, tìm thấy ${physicalProducts?.length || 0}`,
        );
      }

      // Validate all physical products have valid IDs (not NULL)
      const invalidProducts = physicalProducts.filter((p) => !p.id);
      if (invalidProducts.length > 0) {
        throw new Error(
          `Có ${invalidProducts.length} serial không có physical product ID hợp lệ`,
        );
      }

      // CRITICAL: Double-check all products are actually in the source warehouse (defense in depth)
      const wrongWarehouse = physicalProducts.filter(
        (p) => p.virtual_warehouse_id !== transfer.from_virtual_warehouse_id,
      );
      if (wrongWarehouse.length > 0) {
        const wrongSerials = wrongWarehouse
          .map((p) => p.serial_number)
          .join(", ");
        throw new Error(`Serial không thuộc kho nguồn: ${wrongSerials}`);
      }

      // Note: No need to check if already issued - if physical_product exists in DB, it's available
      // (issued products are deleted by trigger)

      // Check not already in another transfer
      const productIds = physicalProducts.map((p) => p.id);
      const { data: existingTransfers } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .select("physical_product_id, serial_number")
        .in("physical_product_id", productIds);

      if (existingTransfers && existingTransfers.length > 0) {
        const duplicates = existingTransfers
          .map((e) => e.serial_number)
          .join(", ");
        throw new Error(`Serial đã có trong phiếu chuyển khác: ${duplicates}`);
      }

      // Check quantity doesn't exceed declared quantity
      const { data: currentSerials } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .select("id")
        .eq("transfer_item_id", input.transferItemId);

      const currentCount = currentSerials?.length || 0;
      if (currentCount + input.serialNumbers.length > transferItem.quantity) {
        throw new Error(
          `Không thể thêm ${input.serialNumbers.length} serial. Sẽ vượt quá số lượng khai báo ${transferItem.quantity}`,
        );
      }

      // Insert transfer serials
      const serialsToInsert = physicalProducts.map((pp) => ({
        transfer_item_id: input.transferItemId,
        physical_product_id: pp.id,
        serial_number: pp.serial_number,
      }));

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .insert(serialsToInsert)
        .select();

      if (error) {
        throw new Error(`Failed to add serials: ${error.message}`);
      }

      // Update last_known_customer_id if transferring to customer_installed
      const { data: transferForCustomer } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .select("to_virtual_warehouse_id, customer_id")
        .eq("id", transferItem.transfer_id)
        .single();

      if (
        transferForCustomer?.to_virtual_warehouse_id &&
        transferForCustomer.customer_id
      ) {
        const { data: toWarehouse } = await ctx.supabaseAdmin
          .from("virtual_warehouses")
          .select("warehouse_type")
          .eq("id", transferForCustomer.to_virtual_warehouse_id)
          .single();

        if (toWarehouse?.warehouse_type === "customer_installed") {
          await ctx.supabaseAdmin
            .from("physical_products")
            .update({ last_known_customer_id: transferForCustomer.customer_id })
            .in("id", productIds);
        }
      }

      return data;
    }),

  /**
   * Remove serial from transfer
   */
  removeSerial: publicProcedure
    .use(requireManagerOrAbove)
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
   * Get available serials for transfer from source warehouse
   */
  getAvailableSerials: publicProcedure
    .use(requireManagerOrAbove)
    .input(
      z.object({
        productId: z.string(),
        virtualWarehouseId: z.string(),
        physicalWarehouseId: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("physical_products")
        .select(
          "id, serial_number, manufacturer_warranty_end_date, user_warranty_end_date, created_at",
        )
        .eq("product_id", input.productId)
        .eq("virtual_warehouse_id", input.virtualWarehouseId)
        .eq("status", "active");

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
   * Delete transfer - DISABLED in simplified workflow
   */
  delete: publicProcedure
    .use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async () => {
      throw new Error(
        "Không thể xóa phiếu chuyển đã hoàn thành. Vui lòng tạo phiếu chuyển mới nếu cần.",
      );
    }),
});
