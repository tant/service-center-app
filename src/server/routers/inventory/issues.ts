/**
 * Issues Router - Stock issue (Phiếu Xuất Kho) management
 * SIMPLIFIED: No draft/approval workflow - all issues are completed immediately
 */

import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import { requireManagerOrAbove } from "../../middleware/requireRole";
import type { StockIssueWithRelations } from "@/types/inventory";

export const issuesRouter = router({
  /**
   * List issues with pagination and filters
   */
  list: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        issueType: z
          .enum(["normal", "adjustment"])
          .optional(),
        page: z.number().int().min(0).default(0),
        pageSize: z.number().int().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("stock_issues")
        .select(
          `
          *,
          created_by:profiles!created_by_id(id, full_name)
        `,
          { count: "exact" }
        );

      if (input.issueType) {
        query = query.eq("issue_type", input.issueType);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(input.page * input.pageSize, (input.page + 1) * input.pageSize - 1);

      if (error) {
        throw new Error(`Failed to list issues: ${error.message}`);
      }

      // Fetch serial counts for all issues in this page
      const issueIds = data?.map(i => i.id) || [];
      let serialCounts: Record<string, { declared: number; entered: number }> = {};

      if (issueIds.length > 0) {
        const { data: itemsData } = await ctx.supabaseAdmin
          .from("stock_issue_items")
          .select(`
            issue_id,
            quantity,
            id
          `)
          .in("issue_id", issueIds);

        if (itemsData) {
          const itemIds = itemsData.map(item => item.id);
          const { data: serialData } = await ctx.supabaseAdmin
            .from("stock_issue_serials")
            .select("issue_item_id")
            .in("issue_item_id", itemIds);

          const serialCountsByItem: Record<string, number> = {};
          (serialData || []).forEach(serial => {
            serialCountsByItem[serial.issue_item_id] = (serialCountsByItem[serial.issue_item_id] || 0) + 1;
          });

          itemsData.forEach(item => {
            if (!serialCounts[item.issue_id]) {
              serialCounts[item.issue_id] = { declared: 0, entered: 0 };
            }
            serialCounts[item.issue_id].declared += item.quantity;
            serialCounts[item.issue_id].entered += (serialCountsByItem[item.id] || 0);
          });
        }
      }

      const issuesWithSerials = (data || []).map(issue => ({
        ...issue,
        totalDeclaredQuantity: serialCounts[issue.id]?.declared || 0,
        totalSerialsEntered: serialCounts[issue.id]?.entered || 0,
        missingSerialsCount: (serialCounts[issue.id]?.declared || 0) - (serialCounts[issue.id]?.entered || 0),
      }));

      return {
        issues: issuesWithSerials,
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil((count || 0) / input.pageSize),
      };
    }),

  /**
   * Get single issue with full details
   */
  getById: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<StockIssueWithRelations | null> => {
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_issues")
        .select(
          `
          *,
          items:stock_issue_items(
            *,
            product:products(id, name, sku),
            serials:stock_issue_serials(
              *,
              physical_product:physical_products(serial_number, manufacturer_warranty_end_date, user_warranty_end_date)
            )
          ),
          virtual_warehouse:virtual_warehouses!virtual_warehouse_id(id, name, is_archive),
          to_virtual_warehouse:virtual_warehouses!to_virtual_warehouse_id(id, name),
          created_by:profiles!created_by_id(id, full_name),
          ticket:service_tickets(id, ticket_number)
        `
        )
        .eq("id", input.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw new Error(`Failed to get issue: ${error.message}`);
      }

      const { data: attachments } = await ctx.supabaseAdmin
        .from("stock_document_attachments")
        .select("*")
        .eq("document_type", "issue")
        .eq("document_id", input.id);

      return {
        ...data,
        attachments: attachments || []
      } as StockIssueWithRelations;
    }),

  /**
   * Create new issue (completed immediately)
   */
  create: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        issueType: z.enum(["normal", "adjustment"]),
        virtualWarehouseId: z.string(),
        toVirtualWarehouseId: z.string().optional(),
        issueDate: z.string(),
        ticketId: z.string().optional(),
        rmaBatchId: z.string().optional(),
        referenceDocumentNumber: z.string().optional(),
        notes: z.string().optional(),
        autoGenerated: z.boolean().default(false),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().int(),
            unitPrice: z.number().optional(),
            notes: z.string().optional(),
          })
        ).min(1),
      }).refine(
        (data) => {
          if (data.issueType === "normal") {
            return data.items.every((item) => item.quantity > 0);
          }
          return data.items.every((item) => item.quantity !== 0);
        },
        {
          message: "Normal issues require positive quantities. Adjustments cannot have zero quantity.",
        }
      )
    )
    .mutation(async ({ ctx, input }) => {
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can create issues");
      }

      const { data: issue, error: issueError } = await ctx.supabaseAdmin
        .from("stock_issues")
        .insert({
          issue_type: input.issueType,
          virtual_warehouse_id: input.virtualWarehouseId,
          to_virtual_warehouse_id: input.toVirtualWarehouseId || null,
          issue_date: input.issueDate,
          ticket_id: input.ticketId,
          rma_batch_id: input.rmaBatchId,
          reference_document_number: input.referenceDocumentNumber,
          notes: input.notes,
          auto_generated: input.autoGenerated,
          status: "completed",
          created_by_id: profile.id,
        })
        .select()
        .single();

      if (issueError) {
        throw new Error(`Failed to create issue: ${issueError.message}`);
      }

      if (input.items.length > 0) {
        const items = input.items.map((item) => ({
          issue_id: issue.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          notes: item.notes,
        }));

        const { error: itemsError } = await ctx.supabaseAdmin
          .from("stock_issue_items")
          .insert(items);

        if (itemsError) {
          throw new Error(`Failed to create issue items: ${itemsError.message}`);
        }
      }

      return issue;
    }),

  /**
   * Update issue notes/reference (simplified)
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
        .from("stock_issues")
        .update({
          notes: input.notes,
          reference_document_number: input.referenceDocumentNumber,
        })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update issue: ${error.message}`);
      }

      return data;
    }),

  /**
   * Update full issue - DISABLED in simplified workflow
   */
  updateFull: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        issueType: z.enum(["normal", "adjustment"]),
        virtualWarehouseId: z.string(),
        toVirtualWarehouseId: z.string().optional(),
        issueDate: z.string(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            id: z.string().optional(),
            productId: z.string(),
            quantity: z.number().int(),
          })
        ).min(1),
      })
    )
    .mutation(async () => {
      throw new Error("Không thể sửa phiếu xuất đã hoàn thành. Vui lòng tạo phiếu điều chỉnh nếu cần sửa đổi.");
    }),

  /**
   * Select serials for issue item
   * Stock is updated immediately via trigger
   */
  selectSerials: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        issueItemId: z.string(),
        physicalProductIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: issueItem } = await ctx.supabaseAdmin
        .from("stock_issue_items")
        .select("issue_id, product_id, quantity")
        .eq("id", input.issueItemId)
        .single();

      if (!issueItem) {
        throw new Error("Issue item not found");
      }

      const { data: issue } = await ctx.supabaseAdmin
        .from("stock_issues")
        .select("virtual_warehouse_id")
        .eq("id", issueItem.issue_id)
        .single();

      if (!issue) {
        throw new Error("Issue not found");
      }

      // Validate physical products exist and are ACTIVE
      const { data: physicalProducts, error: validateError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, product_id, virtual_warehouse_id")
        .in("id", input.physicalProductIds)
        .eq("status", "active");

      if (validateError) {
        throw new Error(`Failed to validate physical products: ${validateError.message}`);
      }

      if (!physicalProducts || physicalProducts.length !== input.physicalProductIds.length) {
        throw new Error("Some physical products not found or not active");
      }

      // Check all belong to correct product and warehouse
      const invalid = physicalProducts.filter((p) =>
        p.product_id !== issueItem.product_id ||
        p.virtual_warehouse_id !== issue.virtual_warehouse_id
      );

      if (invalid.length > 0) {
        const serials = invalid.map((p) => p.serial_number).join(", ");
        throw new Error(`Serial không thuộc kho/sản phẩm phiếu xuất: ${serials}`);
      }

      // Check not already in another issue
      const { data: existingIssues } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .select("physical_product_id, serial_number")
        .in("physical_product_id", input.physicalProductIds);

      if (existingIssues && existingIssues.length > 0) {
        const duplicates = existingIssues.map((e) => e.serial_number).join(", ");
        throw new Error(`Serial đã có trong phiếu xuất: ${duplicates}`);
      }

      // Check quantity limit
      const { data: currentSerials } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .select("id")
        .eq("issue_item_id", input.issueItemId);

      const currentCount = currentSerials?.length || 0;
      if (currentCount + input.physicalProductIds.length > issueItem.quantity) {
        throw new Error(
          `Không thể thêm ${input.physicalProductIds.length} serial. Sẽ vượt quá số lượng ${issueItem.quantity}`
        );
      }

      // Insert issue serials (trigger will update stock)
      const serialsToInsert = input.physicalProductIds.map((ppId) => {
        const pp = physicalProducts.find((p) => p.id === ppId);
        return {
          issue_item_id: input.issueItemId,
          physical_product_id: ppId,
          serial_number: pp!.serial_number,
        };
      });

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .insert(serialsToInsert)
        .select();

      if (error) {
        throw new Error(`Failed to add serials: ${error.message}`);
      }

      return data;
    }),

  /**
   * Select serials by serial numbers (for manual input)
   */
  selectSerialsByNumbers: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        issueItemId: z.string(),
        serialNumbers: z.array(z.string()),
        virtualWarehouseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.serialNumbers.length === 0) {
        throw new Error("No serial numbers provided");
      }

      const { data: issueItem } = await ctx.supabaseAdmin
        .from("stock_issue_items")
        .select("issue_id, product_id, quantity")
        .eq("id", input.issueItemId)
        .single();

      if (!issueItem) {
        throw new Error("Issue item not found");
      }

      const { data: issue } = await ctx.supabaseAdmin
        .from("stock_issues")
        .select("virtual_warehouse_id")
        .eq("id", issueItem.issue_id)
        .single();

      if (!issue) {
        throw new Error("Issue not found");
      }

      if (input.virtualWarehouseId !== issue.virtual_warehouse_id) {
        throw new Error("Kho nguồn không khớp với phiếu xuất.");
      }

      // Find ACTIVE physical products
      const { data: physicalProducts, error: findError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, product_id, virtual_warehouse_id")
        .eq("product_id", issueItem.product_id)
        .eq("virtual_warehouse_id", input.virtualWarehouseId)
        .eq("status", "active")
        .in("serial_number", input.serialNumbers);

      if (findError) {
        throw new Error(`Failed to find serial numbers: ${findError.message}`);
      }

      const foundSerials = new Set(physicalProducts?.map(p => p.serial_number) || []);
      const notFound = input.serialNumbers.filter(sn => !foundSerials.has(sn));

      if (notFound.length > 0) {
        throw new Error(`Serial không tồn tại hoặc không khả dụng: ${notFound.join(", ")}`);
      }

      if (!physicalProducts || physicalProducts.length !== input.serialNumbers.length) {
        throw new Error(`Không tìm thấy đủ serial trong kho`);
      }

      // Check not already in another issue
      const productIds = physicalProducts.map(p => p.id);
      const { data: existingIssues } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .select("physical_product_id, serial_number")
        .in("physical_product_id", productIds);

      if (existingIssues && existingIssues.length > 0) {
        const duplicates = existingIssues.map(e => e.serial_number).join(", ");
        throw new Error(`Serial đã có trong phiếu xuất khác: ${duplicates}`);
      }

      // Check quantity limit
      const { data: currentSerials } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .select("id")
        .eq("issue_item_id", input.issueItemId);

      const currentCount = currentSerials?.length || 0;
      if (currentCount + input.serialNumbers.length > issueItem.quantity) {
        throw new Error(
          `Không thể thêm ${input.serialNumbers.length} serial. Sẽ vượt quá số lượng ${issueItem.quantity}`
        );
      }

      // Insert issue serials (trigger will update stock)
      const serialsToInsert = physicalProducts.map((pp) => ({
        issue_item_id: input.issueItemId,
        physical_product_id: pp.id,
        serial_number: pp.serial_number,
      }));

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .insert(serialsToInsert)
        .select();

      if (error) {
        throw new Error(`Failed to add serials: ${error.message}`);
      }

      return data;
    }),

  /**
   * Remove serial from issue - Note: In simplified workflow, this may cause data inconsistency
   */
  removeSerial: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ serialId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .delete()
        .eq("id", input.serialId);

      if (error) {
        throw new Error(`Failed to remove serial: ${error.message}`);
      }

      return { success: true };
    }),

  /**
   * Get available serials for selection
   */
  getAvailableSerials: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        productId: z.string(),
        virtualWarehouseId: z.string(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, manufacturer_warranty_end_date, user_warranty_end_date, created_at")
        .eq("product_id", input.productId)
        .eq("virtual_warehouse_id", input.virtualWarehouseId)
        .eq("status", "active");

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
   * Delete issue - DISABLED in simplified workflow
   */
  delete: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async () => {
      throw new Error("Không thể xóa phiếu xuất đã hoàn thành. Vui lòng tạo phiếu điều chỉnh nếu cần sửa đổi tồn kho.");
    }),
});
