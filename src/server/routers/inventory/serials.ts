/**
 * Serials Router - Serial number utilities and bulk operations
 */

import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import { requireAnyAuthenticated, requireManagerOrAbove } from "../../middleware/requireRole";

export const serialsRouter = router({
  /**
   * Validate serial numbers for duplicates
   * Checks both physical_products and stock_receipt_serials tables
   */
  validateSerials: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        serialNumbers: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results: {
        serialNumber: string;
        isValid: boolean;
        existsIn?: "physical_products" | "stock_receipt_serials";
        message?: string;
      }[] = [];

      // Check physical_products
      const { data: existingPhysical } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("serial_number")
        .in("serial_number", input.serialNumbers);

      const existingPhysicalSet = new Set(
        existingPhysical?.map((p) => p.serial_number) || []
      );

      // Check stock_receipt_serials
      const { data: existingReceipts } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .select("serial_number")
        .in("serial_number", input.serialNumbers);

      const existingReceiptsSet = new Set(
        existingReceipts?.map((r) => r.serial_number) || []
      );

      // Check for duplicates within input array
      const inputCounts = new Map<string, number>();
      for (const serial of input.serialNumbers) {
        inputCounts.set(serial, (inputCounts.get(serial) || 0) + 1);
      }

      for (const serial of input.serialNumbers) {
        if (existingPhysicalSet.has(serial)) {
          results.push({
            serialNumber: serial,
            isValid: false,
            existsIn: "physical_products",
            message: "Serial already exists in inventory",
          });
        } else if (existingReceiptsSet.has(serial)) {
          results.push({
            serialNumber: serial,
            isValid: false,
            existsIn: "stock_receipt_serials",
            message: "Serial already in pending receipt",
          });
        } else if (inputCounts.get(serial)! > 1) {
          results.push({
            serialNumber: serial,
            isValid: false,
            message: "Duplicate serial in input",
          });
        } else {
          results.push({
            serialNumber: serial,
            isValid: true,
          });
        }
      }

      const validCount = results.filter((r) => r.isValid).length;
      const invalidCount = results.length - validCount;

      return {
        results,
        summary: {
          total: results.length,
          valid: validCount,
          invalid: invalidCount,
          allValid: invalidCount === 0,
        },
      };
    }),

  /**
   * Bulk add serials to receipt item
   * Similar to addSerials but optimized for large batches
   */
  bulkAddSerials: publicProcedure.use(requireManagerOrAbove)
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
      if (input.serials.length === 0) {
        throw new Error("No serials provided");
      }

      // Get receipt item to validate quantity
      const { data: receiptItem } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .select("declared_quantity, serial_count")
        .eq("id", input.receiptItemId)
        .single();

      if (!receiptItem) {
        throw new Error("Receipt item not found");
      }

      // Check if adding these serials would exceed declared quantity
      if (receiptItem.serial_count + input.serials.length > receiptItem.declared_quantity) {
        throw new Error(
          `Cannot add ${input.serials.length} serials. Would exceed declared quantity of ${receiptItem.declared_quantity}`
        );
      }

      // Validate serials for duplicates
      const serialNumbers = input.serials.map((s) => s.serialNumber);

      const { data: existingPhysical } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("serial_number")
        .in("serial_number", serialNumbers);

      if (existingPhysical && existingPhysical.length > 0) {
        const duplicates = existingPhysical.map((e) => e.serial_number).join(", ");
        throw new Error(`Duplicate serials found in physical_products: ${duplicates}`);
      }

      const { data: existingInReceipts } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .select("serial_number")
        .in("serial_number", serialNumbers);

      if (existingInReceipts && existingInReceipts.length > 0) {
        const duplicates = existingInReceipts.map((e) => e.serial_number).join(", ");
        throw new Error(`Serials already in receipts: ${duplicates}`);
      }

      // Check for duplicates within input
      const uniqueSerials = new Set(serialNumbers);
      if (uniqueSerials.size !== serialNumbers.length) {
        throw new Error("Duplicate serials found in input");
      }

      // Insert serials in batch
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

      return {
        added: data?.length || 0,
        serials: data || [],
      };
    }),

  /**
   * Import serials from CSV data
   * Expected format: serial_number (one per line or comma-separated)
   * Note: Warranty information should be managed separately in Products page
   */
  bulkImportCSV: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        receiptItemId: z.string(),
        csvData: z.string(), // CSV content as string
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Parse CSV - each line is a serial number
      const lines = input.csvData.trim().split("\n");

      if (lines.length === 0) {
        throw new Error("CSV data is empty");
      }

      // Check if first line is header (contains "serial")
      const hasHeader = lines[0].toLowerCase().includes("serial");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const serials = [];
      const errors: string[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        // Support both newline-separated and comma-separated formats
        const parts = line.includes(",") ? line.split(",").map((p) => p.trim()) : [line];

        if (parts.length === 0 || !parts[0]) {
          errors.push(`Line ${i + 1}: Empty serial number`);
          continue;
        }

        // Only take first column as serial number, ignore any other columns
        const serial = {
          serialNumber: parts[0],
          manufacturerWarrantyEndDate: undefined, // Warranty managed separately
          userWarrantyEndDate: undefined,
        };

        serials.push(serial);
      }

      if (errors.length > 0) {
        throw new Error(`CSV parsing errors:\n${errors.join("\n")}`);
      }

      if (serials.length === 0) {
        throw new Error("No valid serials found in CSV");
      }

      // Inline bulkAddSerials logic
      // Get receipt item to validate quantity
      const { data: receiptItem } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .select("declared_quantity, serial_count")
        .eq("id", input.receiptItemId)
        .single();

      if (!receiptItem) {
        throw new Error("Receipt item not found");
      }

      // Check if adding these serials would exceed declared quantity
      if (receiptItem.serial_count + serials.length > receiptItem.declared_quantity) {
        throw new Error(
          `Cannot add ${serials.length} serials. Would exceed declared quantity of ${receiptItem.declared_quantity}`
        );
      }

      // Validate serials for duplicates
      const serialNumbers = serials.map((s) => s.serialNumber);

      const { data: existingPhysical } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("serial_number")
        .in("serial_number", serialNumbers);

      if (existingPhysical && existingPhysical.length > 0) {
        const duplicates = existingPhysical.map((e) => e.serial_number).join(", ");
        throw new Error(`Duplicate serials found in physical_products: ${duplicates}`);
      }

      const { data: existingInReceipts } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .select("serial_number")
        .in("serial_number", serialNumbers);

      if (existingInReceipts && existingInReceipts.length > 0) {
        const duplicates = existingInReceipts.map((e) => e.serial_number).join(", ");
        throw new Error(`Serials already in receipts: ${duplicates}`);
      }

      // Check for duplicates within input
      const uniqueSerials = new Set(serialNumbers);
      if (uniqueSerials.size !== serialNumbers.length) {
        throw new Error("Duplicate serials found in CSV");
      }

      // Insert serials in batch
      const serialsToInsert = serials.map((s) => ({
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

      return {
        added: data?.length || 0,
        serials: data || [],
      };
    }),

  /**
   * Get serial number history
   * Tracks all movements: receipt → issue → transfer
   */
  getSerialHistory: publicProcedure.use(requireManagerOrAbove)
    .input(z.object({ serialNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if serial exists in physical_products
      const { data: physicalProduct } = await ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          *,
          product:products(id, name, sku),
          virtual_warehouse:virtual_warehouses(id, name, warehouse_type, physical_warehouse:physical_warehouses(id, name))
        `
        )
        .eq("serial_number", input.serialNumber)
        .single();

      if (!physicalProduct) {
        // Check if in pending receipts
        const { data: receiptSerial } = await ctx.supabaseAdmin
          .from("stock_receipt_serials")
          .select(
            `
            *,
            receipt_item:stock_receipt_items(
              receipt_id,
              product:products(id, name, sku),
              receipt:stock_receipts(receipt_number, status, receipt_date)
            )
          `
          )
          .eq("serial_number", input.serialNumber)
          .single();

        if (receiptSerial) {
          return {
            status: "pending_receipt",
            serialNumber: input.serialNumber,
            currentLocation: null,
            product: receiptSerial.receipt_item.product,
            history: [
              {
                event: "receipt_created",
                date: receiptSerial.created_at,
                receiptNumber: receiptSerial.receipt_item.receipt.receipt_number,
                status: receiptSerial.receipt_item.receipt.status,
              },
            ],
          };
        }

        return null;
      }

      // Build history from various sources
      const history: any[] = [];

      // 1. Receipt event (when it was created)
      history.push({
        event: "received",
        date: physicalProduct.created_at,
        warehouse: {
          virtual: physicalProduct.virtual_warehouse?.warehouse_type,
          physical: (physicalProduct.virtual_warehouse as any)?.physical_warehouse?.id,
        },
      });

      // 2. Issue events
      const { data: issueSerials } = await ctx.supabaseAdmin
        .from("stock_issue_serials")
        .select(
          `
          created_at,
          issue_item:stock_issue_items(
            issue:stock_issues(
              issue_number,
              issue_type,
              issue_date,
              status,
              ticket:service_tickets(ticket_number)
            )
          )
        `
        )
        .eq("physical_product_id", physicalProduct.id)
        .order("created_at", { ascending: true });

      if (issueSerials) {
        for (const issueSerial of issueSerials) {
          const item = issueSerial as any;
          history.push({
            event: "issued",
            date: item.issue_item.issue.issue_date,
            issueNumber: item.issue_item.issue.issue_number,
            issueType: item.issue_item.issue.issue_type,
            ticketNumber: item.issue_item.issue.ticket?.ticket_number,
          });
        }
      }

      // 3. Transfer events
      const { data: transferSerials } = await ctx.supabaseAdmin
        .from("stock_transfer_serials")
        .select(
          `
          created_at,
          transfer_item:stock_transfer_items(
            transfer:stock_transfers(
              transfer_number,
              transfer_date,
              status,
              from_virtual_warehouse_id,
              from_physical_warehouse_id,
              to_virtual_warehouse_id,
              to_physical_warehouse_id,
              completed_at,
              from_virtual_warehouse:virtual_warehouses!from_virtual_warehouse_id(id, name, warehouse_type),
              to_virtual_warehouse:virtual_warehouses!to_virtual_warehouse_id(id, name, warehouse_type)
            )
          )
        `
        )
        .eq("physical_product_id", physicalProduct.id)
        .order("created_at", { ascending: true });

      if (transferSerials) {
        for (const transferSerial of transferSerials) {
          const item = transferSerial as any;
          const transfer = item.transfer_item.transfer;
          history.push({
            event: "transferred",
            date: transfer.transfer_date,
            transferNumber: transfer.transfer_number,
            status: transfer.status,
            from: {
              virtual: transfer.from_virtual_warehouse?.warehouse_type,
              physical: transfer.from_physical_warehouse_id,
            },
            to: {
              virtual: transfer.to_virtual_warehouse?.warehouse_type,
              physical: transfer.to_physical_warehouse_id,
            },
            completedAt: transfer.completed_at,
          });
        }
      }

      return {
        status: "in_stock", // If product exists in DB, it's in stock (issued products are deleted)
        serialNumber: input.serialNumber,
        currentLocation: {
          virtual: physicalProduct.virtual_warehouse?.warehouse_type,
          physical: (physicalProduct.virtual_warehouse as any)?.physical_warehouse?.id,
        },
        product: physicalProduct.product,
        warranty: {
          manufacturerEndDate: physicalProduct.manufacturer_warranty_end_date,
          userEndDate: physicalProduct.user_warranty_end_date,
        },
        history: history.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      };
    }),

  /**
   * Search serials across all warehouses
   * Returns physical products matching search term
   */
  searchSerials: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        search: z.string().min(1),
        virtualWarehouseId: z.string().optional(),
        onlyAvailable: z.boolean().default(false), // Only show not-issued serials
        limit: z.number().int().min(1).max(100).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          id,
          serial_number,
          virtual_warehouse_id,
          manufacturer_warranty_end_date,
          user_warranty_end_date,
          created_at,
          product:products(id, name, sku),
          virtual_warehouse:virtual_warehouses(id, name, warehouse_type, physical_warehouse:physical_warehouses(id, name))
        `
        )
        .ilike("serial_number", `%${input.search}%`);

      if (input.virtualWarehouseId) {
        query = query.eq("virtual_warehouse_id", input.virtualWarehouseId);
      }

      // Note: onlyAvailable filter is now redundant - if product exists in DB, it's available
      // (issued products are deleted by trigger)

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new Error(`Failed to search serials: ${error.message}`);
      }

      return data || [];
    }),

  /**
   * Get serials by product
   * Lists all serials for a specific product
   */
  getSerialsByProduct: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        productId: z.string(),
        virtualWarehouseId: z.string().optional(),
        onlyAvailable: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          id,
          serial_number,
          virtual_warehouse_id,
          manufacturer_warranty_end_date,
          user_warranty_end_date,
          created_at,
          virtual_warehouse:virtual_warehouses(id, name, warehouse_type, physical_warehouse:physical_warehouses(id, name))
        `
        )
        .eq("product_id", input.productId);

      if (input.virtualWarehouseId) {
        query = query.eq("virtual_warehouse_id", input.virtualWarehouseId);
      }

      // Note: onlyAvailable filter is now redundant - if product exists in DB, it's available
      // (issued products are deleted by trigger)

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to get serials by product: ${error.message}`);
      }

      return data || [];
    }),

  /**
   * Get compliance metrics for manager dashboard
   * Shows overview of serial entry completion across all receipts
   */
  getComplianceMetrics: publicProcedure.use(requireManagerOrAbove)
    .query(async ({ ctx }) => {
      // Get all approved/completed receipts with items
      const { data: receipts, error } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .select(
          `
          id,
          status,
          created_at,
          items:stock_receipt_items(
            id,
            declared_quantity,
            serial_count
          )
        `
        )
        .in("status", ["approved", "completed"])
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch receipts: ${error.message}`);
      }

      if (!receipts || receipts.length === 0) {
        return {
          totalReceipts: 0,
          completedSerials: 0,
          inProgressSerials: 0,
          pendingSerials: 0,
          overdueCount: 0,
          complianceRate: 0,
        };
      }

      let completedCount = 0;
      let inProgressCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;

      const now = new Date();

      for (const receipt of receipts) {
        const items = receipt.items || [];
        const totalDeclared = items.reduce((sum, item) => sum + item.declared_quantity, 0);
        const totalSerials = items.reduce((sum, item) => sum + (item.serial_count || 0), 0);

        const isComplete = totalDeclared > 0 && totalSerials === totalDeclared;
        const isPending = totalSerials === 0;

        // Calculate age in days
        const createdAt = new Date(receipt.created_at);
        const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        if (isComplete) {
          completedCount++;
        } else if (isPending) {
          pendingCount++;
          if (ageInDays > 3) overdueCount++;
        } else {
          inProgressCount++;
          if (ageInDays > 3) overdueCount++;
        }
      }

      const totalReceipts = receipts.length;
      const complianceRate = totalReceipts > 0 ? (completedCount / totalReceipts) * 100 : 0;

      return {
        totalReceipts,
        completedSerials: completedCount,
        inProgressSerials: inProgressCount,
        pendingSerials: pendingCount,
        overdueCount,
        complianceRate,
      };
    }),

  /**
   * Get serial entry tasks list
   * Returns all receipts that need serial entry work
   */
  getSerialEntryTasks: publicProcedure.use(requireAnyAuthenticated)
    .input(
      z.object({
        filter: z.enum(["all", "mine", "available", "overdue"]).default("mine"),
        limit: z.number().int().min(1).max(100).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }
      const userId = ctx.user.id;

      // Get receipts with incomplete serials
      const { data: receipts, error } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .select(
          `
          id,
          receipt_number,
          status,
          created_at,
          updated_at,
          created_by,
          items:stock_receipt_items(
            id,
            declared_quantity,
            serial_count
          )
        `
        )
        .in("status", ["approved", "completed"])
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new Error(`Failed to fetch serial entry tasks: ${error.message}`);
      }

      if (!receipts || receipts.length === 0) {
        return [];
      }

      const now = new Date();
      const tasks = [];

      for (const receipt of receipts) {
        const items = receipt.items || [];
        const totalDeclared = items.reduce((sum, item) => sum + item.declared_quantity, 0);
        const totalSerials = items.reduce((sum, item) => sum + (item.serial_count || 0), 0);

        // Skip if all serials complete
        if (totalDeclared > 0 && totalSerials === totalDeclared) {
          continue;
        }

        const createdAt = new Date(receipt.created_at);
        const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // Get creator info
        const creatorId = typeof receipt.created_by === 'string' ? receipt.created_by : receipt.created_by || "";

        // Fetch user details
        const { data: creator } = await ctx.supabaseAdmin
          .from("profiles")
          .select("id, full_name")
          .eq("id", creatorId)
          .single();

        const task = {
          id: receipt.id,
          receiptNumber: receipt.receipt_number,
          receiptId: receipt.id,
          progress: {
            current: totalSerials,
            total: totalDeclared,
          },
          assignedTo: {
            id: creatorId,
            full_name: creator?.full_name || "Unknown User",
          },
          receiptStatus: receipt.status,
          createdAt: createdAt,
          ageInDays,
        };

        // Apply filters
        const isMine = task.assignedTo.id === userId;
        const isOverdue = ageInDays > 3;

        if (input.filter === "mine" && !isMine) continue;
        if (input.filter === "available" && isMine) continue;
        if (input.filter === "overdue" && !isOverdue) continue;

        tasks.push(task);
      }

      return tasks;
    }),

  /**
   * Add a single serial to receipt item
   * Simplified version for individual serial entry
   */
  addSerial: publicProcedure.use(requireAnyAuthenticated)
    .input(
      z.object({
        receiptItemId: z.string(),
        serialNumber: z.string().min(1),
        manufacturerWarrantyEndDate: z.string().optional(),
        userWarrantyEndDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get receipt item to validate quantity
      const { data: receiptItem } = await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .select("declared_quantity, serial_count")
        .eq("id", input.receiptItemId)
        .single();

      if (!receiptItem) {
        throw new Error("Receipt item not found");
      }

      // Check if adding this serial would exceed declared quantity
      if (receiptItem.serial_count + 1 > receiptItem.declared_quantity) {
        throw new Error(
          `Cannot add serial. Would exceed declared quantity of ${receiptItem.declared_quantity}`
        );
      }

      // Validate serial for duplicates
      const { data: existingPhysical } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("serial_number")
        .eq("serial_number", input.serialNumber)
        .single();

      if (existingPhysical) {
        throw new Error(`Serial ${input.serialNumber} already exists in physical_products`);
      }

      const { data: existingInReceipts } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .select("serial_number")
        .eq("serial_number", input.serialNumber)
        .single();

      if (existingInReceipts) {
        throw new Error(`Serial ${input.serialNumber} already exists in receipts`);
      }

      // Insert serial
      const { data, error } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .insert({
          receipt_item_id: input.receiptItemId,
          serial_number: input.serialNumber,
          manufacturer_warranty_end_date: input.manufacturerWarrantyEndDate,
          user_warranty_end_date: input.userWarrantyEndDate,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add serial: ${error.message}`);
      }

      return data;
    }),

  /**
   * Remove a serial from receipt item
   * Allows correction of mistakes
   */
  removeSerial: publicProcedure.use(requireAnyAuthenticated)
    .input(
      z.object({
        serialId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Delete the serial
      const { error } = await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .delete()
        .eq("id", input.serialId);

      if (error) {
        throw new Error(`Failed to remove serial: ${error.message}`);
      }

      return { success: true };
    }),
});
