/**
 * Issues Router - Stock issue (Phiếu Xuất Kho) management
 */

import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import { requireAnyAuthenticated, requireManagerOrAbove } from "../../middleware/requireRole";
import type { StockIssue, StockIssueWithRelations } from "@/types/inventory";

export const issuesRouter = router({
  /**
   * List issues with pagination and filters
   */
  list: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        status: z
          .enum(["draft", "pending_approval", "approved", "completed", "cancelled"])
          .optional(),
        issueType: z
          .enum(["normal", "adjustment"]) // REDESIGNED: Simplified to 2 types
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
          created_by:profiles!created_by_id(id, full_name),
          approved_by:profiles!approved_by_id(id, full_name)
        `,
          { count: "exact" }
        );

      if (input.status) {
        query = query.eq("status", input.status);
      }

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
        // For issues, count serials directly from stock_issue_serials table
        // (issue items don't have serial_count column, they use existing physical products)
        const { data: itemsData } = await ctx.supabaseAdmin
          .from("stock_issue_items")
          .select(`
            issue_id,
            quantity,
            id
          `)
          .in("issue_id", issueIds);

        if (itemsData) {
          // Get serial counts for all items
          const itemIds = itemsData.map(item => item.id);
          const { data: serialData } = await ctx.supabaseAdmin
            .from("stock_issue_serials")
            .select("issue_item_id")
            .in("issue_item_id", itemIds);

          // Count serials per item
          const serialCountsByItem: Record<string, number> = {};
          (serialData || []).forEach(serial => {
            serialCountsByItem[serial.issue_item_id] = (serialCountsByItem[serial.issue_item_id] || 0) + 1;
          });

          // Aggregate by issue_id
          itemsData.forEach(item => {
            if (!serialCounts[item.issue_id]) {
              serialCounts[item.issue_id] = { declared: 0, entered: 0 };
            }
            serialCounts[item.issue_id].declared += item.quantity;
            serialCounts[item.issue_id].entered += (serialCountsByItem[item.id] || 0);
          });
        }
      }

      // Merge serial counts with issues
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
          approved_by:profiles!approved_by_id(id, full_name),
          completed_by:profiles!completed_by_id(id, full_name),
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

      // Query attachments separately (polymorphic relationship)
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
   * Create new issue (draft)
   */
  create: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        issueType: z.enum(["normal", "adjustment"]), // REDESIGNED: Simplified to 2 types
        virtualWarehouseId: z.string(), // REDESIGNED: Direct warehouse reference
        toVirtualWarehouseId: z.string().optional(), // Kho đích (archive) sau khi xuất
        issueDate: z.string(),
        ticketId: z.string().optional(),
        rmaBatchId: z.string().optional(),
        referenceDocumentNumber: z.string().optional(),
        notes: z.string().optional(),
        autoGenerated: z.boolean().default(false),
        autoApproveThreshold: z.number().optional(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().int(), // REDESIGNED: Can be negative for adjustments
            unitPrice: z.number().optional(),
            notes: z.string().optional(),
          })
        ).min(1),
      }).refine(
        (data) => {
          // Validate: normal issues must have positive quantities
          if (data.issueType === "normal") {
            return data.items.every((item) => item.quantity > 0);
          }
          // Adjustment issues: allow negative but not zero
          return data.items.every((item) => item.quantity !== 0);
        },
        {
          message: "Normal issues require positive quantities. Adjustments cannot have zero quantity.",
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
        throw new Error("Unauthorized: Only admin and manager can create issues");
      }

      // Insert issue
      const { data: issue, error: issueError } = await ctx.supabaseAdmin
        .from("stock_issues")
        .insert({
          issue_type: input.issueType,
          virtual_warehouse_id: input.virtualWarehouseId, // REDESIGNED: Direct warehouse reference
          to_virtual_warehouse_id: input.toVirtualWarehouseId || null,
          issue_date: input.issueDate,
          ticket_id: input.ticketId,
          rma_batch_id: input.rmaBatchId,
          reference_document_number: input.referenceDocumentNumber,
          notes: input.notes,
          auto_generated: input.autoGenerated,
          auto_approve_threshold: input.autoApproveThreshold,
          status: "draft",
          created_by_id: profile.id,
        })
        .select()
        .single();

      if (issueError) {
        throw new Error(`Failed to create issue: ${issueError.message}`);
      }

      // Insert items
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
   * Update issue (only if draft)
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
      const { data: issue } = await ctx.supabaseAdmin
        .from("stock_issues")
        .select("status, created_by_id")
        .eq("id", input.id)
        .single();

      if (!issue) {
        throw new Error("Issue not found");
      }

      if (issue.status !== "draft") {
        throw new Error("Cannot edit issue after draft status");
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
        issue.created_by_id !== profile.id &&
        !["admin", "manager"].includes(profile.role)
      ) {
        throw new Error("Unauthorized to edit this issue");
      }

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
   * Update full issue (only if draft) - for editing all fields
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
      }).refine(
        (data) => {
          // Validate: normal issues must have positive quantities
          if (data.issueType === "normal") {
            return data.items.every((item) => item.quantity > 0);
          }
          // Adjustment issues: allow negative but not zero
          return data.items.every((item) => item.quantity !== 0);
        },
        {
          message: "Normal issues require positive quantities. Adjustments cannot have zero quantity.",
        }
      )
    )
    .mutation(async ({ ctx, input }) => {
      // Check status first
      const { data: issue } = await ctx.supabaseAdmin
        .from("stock_issues")
        .select("status, created_by_id")
        .eq("id", input.id)
        .single();

      if (!issue) {
        throw new Error("Issue not found");
      }

      if (issue.status !== "draft") {
        throw new Error("Cannot edit issue after draft status");
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
        issue.created_by_id !== profile.id &&
        !["admin", "manager"].includes(profile.role)
      ) {
        throw new Error("Unauthorized to edit this issue");
      }

      // Get existing item IDs first
      const { data: existingItems } = await ctx.supabaseAdmin
        .from("stock_issue_items")
        .select("id")
        .eq("issue_id", input.id);

      const itemIds = existingItems?.map(item => item.id) || [];

      // Delete existing serials first (if there are items)
      if (itemIds.length > 0) {
        await ctx.supabaseAdmin
          .from("stock_issue_serials")
          .delete()
          .in("issue_item_id", itemIds);
      }

      // Delete existing items
      const { error: deleteItems } = await ctx.supabaseAdmin
        .from("stock_issue_items")
        .delete()
        .eq("issue_id", input.id);

      if (deleteItems) {
        throw new Error(`Failed to delete existing items: ${deleteItems.message}`);
      }

      // Update issue header
      const { data: updatedIssue, error: updateError } = await ctx.supabaseAdmin
        .from("stock_issues")
        .update({
          issue_type: input.issueType,
          virtual_warehouse_id: input.virtualWarehouseId,
          to_virtual_warehouse_id: input.toVirtualWarehouseId || null,
          issue_date: input.issueDate,
          notes: input.notes,
        })
        .eq("id", input.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update issue: ${updateError.message}`);
      }

      // Insert new items
      if (input.items.length > 0) {
        const items = input.items.map((item) => ({
          issue_id: input.id,
          product_id: item.productId,
          quantity: item.quantity,
        }));

        const { error: itemsError } = await ctx.supabaseAdmin
          .from("stock_issue_items")
          .insert(items);

        if (itemsError) {
          throw new Error(`Failed to create issue items: ${itemsError.message}`);
        }
      }

      return updatedIssue;
    }),

  /**
   * Submit for approval
   */
  submitForApproval: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // VALIDATION CHECKPOINT #2: Verify all serials are in source warehouse before submit
      const { data: issue } = await ctx.supabaseAdmin
        .from("stock_issues")
        .select("virtual_warehouse_id")
        .eq("id", input.id)
        .single();

      if (!issue) {
        throw new Error("Issue not found");
      }

      // Get all item IDs for this issue
      const { data: issueItems } = await ctx.supabaseAdmin
        .from("stock_issue_items")
        .select("id")
        .eq("issue_id", input.id);

      if (issueItems && issueItems.length > 0) {
        // Get all serials in this issue
        const issueItemIds = issueItems.map(item => item.id);
        const { data: issueSerials } = await ctx.supabaseAdmin
          .from("stock_issue_serials")
          .select(`
            serial_number,
            physical_product_id,
            issue_item_id
          `)
          .in("issue_item_id", issueItemIds);

      if (issueSerials && issueSerials.length > 0) {
        // Check each serial's current warehouse location
        const physicalProductIds = issueSerials.map(s => s.physical_product_id).filter(Boolean);

        if (physicalProductIds.length > 0) {
          const { data: physicalProducts } = await ctx.supabaseAdmin
            .from("physical_products")
            .select("id, serial_number, virtual_warehouse_id")
            .in("id", physicalProductIds);

          // Find serials that are not in source warehouse
          const wrongWarehouse = physicalProducts?.filter(
            p => p.virtual_warehouse_id !== issue.virtual_warehouse_id
          ) || [];

          if (wrongWarehouse.length > 0) {
            const wrongSerials = wrongWarehouse.map(p => p.serial_number).join(", ");
            throw new Error(`Không thể gửi duyệt: Các serial sau không còn trong kho xuất: ${wrongSerials}`);
          }
        }
      }
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_issues")
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
   * Approve issue - Manager/Admin only
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
        throw new Error("Unauthorized: Only admin and manager can approve issues");
      }

      // VALIDATION CHECKPOINT #3: Verify all serials are in source warehouse before approve
      const { data: issue } = await ctx.supabaseAdmin
        .from("stock_issues")
        .select("virtual_warehouse_id")
        .eq("id", input.id)
        .single();

      if (!issue) {
        throw new Error("Issue not found");
      }

      // Get all item IDs for this issue
      const { data: issueItems } = await ctx.supabaseAdmin
        .from("stock_issue_items")
        .select("id")
        .eq("issue_id", input.id);

      if (issueItems && issueItems.length > 0) {
        // Get all serials in this issue
        const issueItemIds = issueItems.map(item => item.id);
        const { data: issueSerials } = await ctx.supabaseAdmin
          .from("stock_issue_serials")
          .select(`
            serial_number,
            physical_product_id,
            issue_item_id
          `)
          .in("issue_item_id", issueItemIds);

      if (issueSerials && issueSerials.length > 0) {
        // Check each serial's current warehouse location
        const physicalProductIds = issueSerials.map(s => s.physical_product_id).filter(Boolean);

        if (physicalProductIds.length > 0) {
          const { data: physicalProducts } = await ctx.supabaseAdmin
            .from("physical_products")
            .select("id, serial_number, virtual_warehouse_id")
            .in("id", physicalProductIds);

          // Find serials that are not in source warehouse
          const wrongWarehouse = physicalProducts?.filter(
            p => p.virtual_warehouse_id !== issue.virtual_warehouse_id
          ) || [];

          if (wrongWarehouse.length > 0) {
            const wrongSerials = wrongWarehouse.map(p => p.serial_number).join(", ");
            throw new Error(`Không thể duyệt: Các serial sau không còn trong kho xuất: ${wrongSerials}`);
          }
        }
      }
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("stock_issues")
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
        throw new Error(`Failed to approve issue: ${error.message}`);
      }

      return data;
    }),

  /**
   * Reject issue - Manager/Admin only
   */
  reject: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({
      id: z.string(),
      reason: z.string().min(1, "Rejection reason is required")
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_issues")
        .update({
          status: "cancelled",
          rejection_reason: input.reason
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
   * Select serials for issue item
   * This selects existing physical products rather than creating new ones
   */
  selectSerials: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        issueItemId: z.string(),
        physicalProductIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get issue item details
      const { data: issueItem } = await ctx.supabaseAdmin
        .from("stock_issue_items")
        .select("issue_id, product_id, quantity")
        .eq("id", input.issueItemId)
        .single();

      if (!issueItem) {
        throw new Error("Issue item not found");
      }

      // Get issue to check warehouse
      const { data: issue } = await ctx.supabaseAdmin
        .from("stock_issues")
        .select("virtual_warehouse_id, physical_warehouse_id")
        .eq("id", issueItem.issue_id)
        .single();

      if (!issue) {
        throw new Error("Issue not found");
      }

      // Validate physical products exist, are ACTIVE, and belong to correct warehouse/product
      const { data: physicalProducts, error: validateError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, product_id, virtual_warehouse_id, virtual_warehouse:virtual_warehouses!virtual_warehouse_id(physical_warehouse_id)")
        .in("id", input.physicalProductIds)
        .eq("status", "active");

      if (validateError) {
        throw new Error(`Failed to validate physical products: ${validateError.message}`);
      }

      if (!physicalProducts || physicalProducts.length !== input.physicalProductIds.length) {
        throw new Error("Some physical products not found");
      }

      // Check all belong to correct product and warehouse
      const invalid = physicalProducts.filter((p: any) => {
        const productPhysicalWarehouseId = p.virtual_warehouse?.physical_warehouse_id;
        return (
          p.product_id !== issueItem.product_id ||
          p.virtual_warehouse_id !== issue.virtual_warehouse_id ||
          (issue.physical_warehouse_id && productPhysicalWarehouseId !== issue.physical_warehouse_id)
        );
      });

      if (invalid.length > 0) {
        const serials = invalid.map((p) => p.serial_number).join(", ");
        throw new Error(
          `Physical products do not match issue warehouse/product: ${serials}`
        );
      }

      // Check not already issued
      const { data: existingIssues } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .select("physical_product_id, serial_number")
        .in("physical_product_id", input.physicalProductIds);

      if (existingIssues && existingIssues.length > 0) {
        const duplicates = existingIssues.map((e) => e.serial_number).join(", ");
        throw new Error(`Physical products already issued: ${duplicates}`);
      }

      // Check quantity doesn't exceed declared quantity
      const { data: currentSerials } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .select("id")
        .eq("issue_item_id", input.issueItemId);

      const currentCount = currentSerials?.length || 0;
      if (currentCount + input.physicalProductIds.length > issueItem.quantity) {
        throw new Error(
          `Cannot add ${input.physicalProductIds.length} serials. Would exceed declared quantity of ${issueItem.quantity}`
        );
      }

      // Insert issue serials
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

      // Auto-complete: Check if all serials are complete
      // Get issue item to know issue_id
      const { data: issueItemForComplete } = await ctx.supabaseAdmin
        .from("stock_issue_items")
        .select("quantity, issue_id")
        .eq("id", input.issueItemId)
        .single();

      if (issueItemForComplete) {
        // Get issue status
        const { data: issueForComplete } = await ctx.supabaseAdmin
          .from("stock_issues")
          .select("status")
          .eq("id", issueItemForComplete.issue_id)
          .single();

        if (issueForComplete && issueForComplete.status === "approved") {
          // Get current serial count for this issue
          const { data: allItemsForComplete } = await ctx.supabaseAdmin
            .from("stock_issue_items")
            .select(`
              id,
              quantity,
              stock_issue_serials(id)
            `)
            .eq("issue_id", issueItemForComplete.issue_id);

          if (allItemsForComplete) {
            const totalQuantity = allItemsForComplete.reduce((sum, item) => sum + item.quantity, 0);
            const totalSerials = allItemsForComplete.reduce((sum, item) => sum + (item.stock_issue_serials?.length || 0), 0);

            // Auto-complete if all serials are selected
            if (totalSerials >= totalQuantity) {
              await ctx.supabaseAdmin
                .from("stock_issues")
                .update({
                  status: "completed",
                  completed_at: new Date().toISOString(),
                  completed_by_id: ctx.user?.id
                })
                .eq("id", issueItemForComplete.issue_id)
                .eq("status", "approved");
            }
          }
        }
      }

      return data;
    }),

  /**
   * Select serials by serial numbers (for manual input)
   * Accepts serial numbers as strings and finds matching physical products
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

      // Get issue item details
      const { data: issueItem } = await ctx.supabaseAdmin
        .from("stock_issue_items")
        .select("issue_id, product_id, quantity")
        .eq("id", input.issueItemId)
        .single();

      if (!issueItem) {
        throw new Error("Issue item not found");
      }

      // Get issue to verify source warehouse
      const { data: issue } = await ctx.supabaseAdmin
        .from("stock_issues")
        .select("virtual_warehouse_id")
        .eq("id", issueItem.issue_id)
        .single();

      if (!issue) {
        throw new Error("Issue not found");
      }

      // CRITICAL: Validate warehouse ID matches issue's source warehouse
      if (input.virtualWarehouseId !== issue.virtual_warehouse_id) {
        throw new Error("Kho nguồn không khớp với phiếu xuất. Chỉ có thể chọn serial từ kho xuất.");
      }

      // Find ACTIVE physical products by serial numbers
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

      // Check all serials were found
      const foundSerials = new Set(physicalProducts?.map(p => p.serial_number) || []);
      const notFound = input.serialNumbers.filter(sn => !foundSerials.has(sn));

      if (notFound.length > 0) {
        throw new Error(`Serial không tồn tại trong kho: ${notFound.join(", ")}`);
      }

      // CRITICAL: Ensure we found all physical products and they have valid IDs
      if (!physicalProducts || physicalProducts.length !== input.serialNumbers.length) {
        throw new Error(`Không tìm thấy đủ serial trong kho. Cần ${input.serialNumbers.length}, tìm thấy ${physicalProducts?.length || 0}`);
      }

      // Validate all physical products have valid IDs (not NULL)
      const invalidProducts = physicalProducts.filter(p => !p.id);
      if (invalidProducts.length > 0) {
        throw new Error(`Có ${invalidProducts.length} serial không có physical product ID hợp lệ`);
      }

      // CRITICAL: Double-check all products are actually in the source warehouse (defense in depth)
      const wrongWarehouse = physicalProducts.filter(p => p.virtual_warehouse_id !== issue.virtual_warehouse_id);
      if (wrongWarehouse.length > 0) {
        const wrongSerials = wrongWarehouse.map(p => p.serial_number).join(", ");
        throw new Error(`Serial không thuộc kho xuất: ${wrongSerials}`);
      }

      // Note: No need to check if already issued - if physical_product exists in DB, it hasn't been issued yet
      // (issued products are deleted by trigger)

      // Check not already in this or another issue
      const productIds = physicalProducts.map(p => p.id);
      const { data: existingIssues } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .select("physical_product_id, serial_number")
        .in("physical_product_id", productIds);

      if (existingIssues && existingIssues.length > 0) {
        const duplicates = existingIssues.map(e => e.serial_number).join(", ");
        throw new Error(`Serial đã có trong phiếu xuất khác: ${duplicates}`);
      }

      // Check quantity doesn't exceed declared quantity
      const { data: currentSerials } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .select("id")
        .eq("issue_item_id", input.issueItemId);

      const currentCount = currentSerials?.length || 0;
      if (currentCount + input.serialNumbers.length > issueItem.quantity) {
        throw new Error(
          `Không thể thêm ${input.serialNumbers.length} serial. Sẽ vượt quá số lượng khai báo ${issueItem.quantity}`
        );
      }

      // Insert issue serials
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

      // Auto-complete: Check if all serials are complete
      // Get issue item to know issue_id
      const { data: issueItemData } = await ctx.supabaseAdmin
        .from("stock_issue_items")
        .select("quantity, issue_id")
        .eq("id", input.issueItemId)
        .single();

      if (issueItemData) {
        // Get issue status
        const { data: issueData } = await ctx.supabaseAdmin
          .from("stock_issues")
          .select("status")
          .eq("id", issueItemData.issue_id)
          .single();

        if (issueData && issueData.status === "approved") {
          // Get current serial count for this issue
          const { data: allItems } = await ctx.supabaseAdmin
            .from("stock_issue_items")
            .select(`
              id,
              quantity,
              stock_issue_serials(id)
            `)
            .eq("issue_id", issueItemData.issue_id);

          if (allItems) {
            const totalQuantity = allItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalSerials = allItems.reduce((sum, item) => sum + (item.stock_issue_serials?.length || 0), 0);

            // Auto-complete if all serials are selected
            if (totalSerials >= totalQuantity) {
              await ctx.supabaseAdmin
                .from("stock_issues")
                .update({
                  status: "completed",
                  completed_at: new Date().toISOString(),
                  completed_by_id: ctx.user?.id
                })
                .eq("id", issueItemData.issue_id)
                .eq("status", "approved");
            }
          }
        }
      }

      return data;
    }),

  /**
   * Remove serial from issue
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
   * Returns serials in specified warehouse that are not already issued
   */
  getAvailableSerials: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        productId: z.string(),
        virtualWarehouseId: z.string(), // REDESIGNED: Direct warehouse reference
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Query physical_products directly by virtual_warehouse_id
      let query = ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, manufacturer_warranty_end_date, user_warranty_end_date, created_at")
        .eq("product_id", input.productId)
        .eq("virtual_warehouse_id", input.virtualWarehouseId);
        // Note: No need to filter by issued_at - if product exists in DB, it's available (not issued yet)

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
   * Delete issue (only if draft)
   */
  delete: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from("stock_issues")
        .delete()
        .eq("id", input.id)
        .eq("status", "draft");

      if (error) {
        throw new Error(`Failed to delete issue: ${error.message}`);
      }

      return { success: true };
    }),
});
