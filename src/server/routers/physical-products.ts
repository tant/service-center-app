import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getWarrantyStatus, getRemainingDays } from "@/utils/warranty";

/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * AC 2: tRPC router with 5 procedures for inventory management
 */

// Validation schemas
const createProductSchema = z.object({
  serial_number: z
    .string()
    .min(5, "Serial number must be at least 5 characters")
    .regex(/^[A-Z0-9_-]+$/, "Serial number must be alphanumeric (A-Z, 0-9, dash, underscore)")
    .transform((val) => val.toUpperCase()),
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  physical_warehouse_id: z.string().uuid("Warehouse ID must be a valid UUID").optional(),
  virtual_warehouse_type: z.enum([
    "main",
    "warranty_stock",
    "rma_staging",
    "dead_stock",
    "in_service",
    "parts",
  ]),
  condition: z.enum(["new", "refurbished", "used", "faulty", "for_parts"]),
  warranty_start_date: z.string().optional(),
  warranty_months: z.number().int().min(0).optional(),
  purchase_date: z.string().optional(),
  supplier_id: z.string().uuid().optional(),
  supplier_name: z.string().optional(),
  purchase_price: z.number().min(0).optional(),
  notes: z.string().optional(),
  photo_urls: z.array(z.string().url()).optional(),
});

const updateProductSchema = z.object({
  id: z.string().uuid("Product ID must be a valid UUID"),
  serial_number: z
    .string()
    .min(5)
    .regex(/^[A-Z0-9_-]+$/)
    .transform((val) => val.toUpperCase())
    .optional(),
  product_id: z.string().uuid().optional(),
  physical_warehouse_id: z.string().uuid().nullable().optional(),
  virtual_warehouse_type: z
    .enum(["main", "warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"])
    .optional(),
  condition: z.enum(["new", "refurbished", "used", "faulty", "for_parts"]).optional(),
  warranty_start_date: z.string().nullable().optional(),
  warranty_months: z.number().int().min(0).nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  supplier_id: z.string().uuid().nullable().optional(),
  supplier_name: z.string().nullable().optional(),
  purchase_price: z.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  photo_urls: z.array(z.string().url()).optional(),
});

const listProductsSchema = z.object({
  physical_warehouse_id: z.string().uuid().optional(),
  virtual_warehouse_type: z
    .enum(["main", "warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"])
    .optional(),
  condition: z.enum(["new", "refurbished", "used", "faulty", "for_parts"]).optional(),
  warranty_status: z.enum(["active", "expired", "expiring_soon", "no_warranty"]).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const getProductSchema = z.object({
  id: z.string().uuid().optional(),
  serial_number: z.string().optional(),
});

export const inventoryRouter = router({
  /**
   * AC 2.1: Create a new physical product
   */
  createProduct: publicProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      // Check serial uniqueness
      const { count } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("id", { count: "exact", head: true })
        .eq("serial_number", input.serial_number);

      if (count && count > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Serial number ${input.serial_number} already exists`,
        });
      }

      // Warranty end date is auto-calculated by database trigger
      // based on warranty_start_date + warranty_months
      const { data: product, error } = await ctx.supabaseAdmin
        .from("physical_products")
        .insert({
          serial_number: input.serial_number,
          product_id: input.product_id,
          physical_warehouse_id: input.physical_warehouse_id,
          virtual_warehouse_type: input.virtual_warehouse_type,
          condition: input.condition,
          warranty_start_date: input.warranty_start_date,
          warranty_months: input.warranty_months,
          purchase_date: input.purchase_date,
          supplier_id: input.supplier_id,
          supplier_name: input.supplier_name,
          purchase_price: input.purchase_price,
          notes: input.notes,
          photo_urls: input.photo_urls,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create physical product: ${error.message}`,
        });
      }

      return product;
    }),

  /**
   * AC 2.2: Update physical product details
   */
  updateProduct: publicProcedure
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // If updating serial number, check uniqueness
      if (updateData.serial_number) {
        const { count } = await ctx.supabaseAdmin
          .from("physical_products")
          .select("id", { count: "exact", head: true })
          .eq("serial_number", updateData.serial_number)
          .neq("id", id);

        if (count && count > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Serial number ${updateData.serial_number} already exists`,
          });
        }
      }

      const { data: product, error } = await ctx.supabaseAdmin
        .from("physical_products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update physical product: ${error.message}`,
        });
      }

      return product;
    }),

  /**
   * AC 2.3: List products with filters and pagination
   */
  listProducts: publicProcedure
    .input(listProductsSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          *,
          product:products(
            id,
            name,
            sku,
            brand:brands(name)
          ),
          physical_warehouse:physical_warehouses(
            id,
            name,
            code,
            location
          )
        `,
          { count: "exact" }
        );

      // Apply filters
      if (input.physical_warehouse_id) {
        query = query.eq("physical_warehouse_id", input.physical_warehouse_id);
      }

      if (input.virtual_warehouse_type) {
        query = query.eq("virtual_warehouse_type", input.virtual_warehouse_type);
      }

      if (input.condition) {
        query = query.eq("condition", input.condition);
      }

      if (input.search) {
        query = query.ilike("serial_number", `%${input.search}%`);
      }

      // Warranty status filter - handled via date comparison
      if (input.warranty_status) {
        const today = new Date().toISOString().split("T")[0];

        switch (input.warranty_status) {
          case "active": {
            // warranty_end_date is in the future
            query = query.gt("warranty_end_date", today);
            // Exclude products expiring in next 30 days
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            query = query.gt("warranty_end_date", thirtyDaysFromNow.toISOString().split("T")[0]);
            break;
          }
          case "expired":
            // warranty_end_date is in the past
            query = query.lt("warranty_end_date", today);
            break;
          case "expiring_soon": {
            // warranty_end_date is between today and 30 days from now
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            query = query
              .gte("warranty_end_date", today)
              .lte("warranty_end_date", thirtyDaysFromNow.toISOString().split("T")[0]);
            break;
          }
          case "no_warranty":
            query = query.is("warranty_end_date", null);
            break;
        }
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch physical products: ${error.message}`,
        });
      }

      return {
        products: data || [],
        total: count || 0,
      };
    }),

  /**
   * AC 2.4: Get single product by ID or serial number
   */
  getProduct: publicProcedure.input(getProductSchema).query(async ({ ctx, input }) => {
    if (!input.id && !input.serial_number) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Must provide either id or serial_number",
      });
    }

    let query = ctx.supabaseAdmin
      .from("physical_products")
      .select(
        `
        *,
        product:products(
          id,
          name,
          sku,
          warranty_months,
          brand:brands(name)
        ),
        physical_warehouse:physical_warehouses(
          id,
          name,
          code,
          location
        ),
        current_ticket:service_tickets(
          id,
          ticket_number,
          status
        )
      `
      );

    if (input.id) {
      query = query.eq("id", input.id);
    } else if (input.serial_number) {
      query = query.eq("serial_number", input.serial_number);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return data;
  }),

  /**
   * AC 2.5: Bulk import products from CSV
   */
  bulkImport: publicProcedure
    .input(
      z.object({
        products: z.array(createProductSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = {
        success: [] as unknown[],
        errors: [] as { row: number; serial: string; error: string }[],
      };

      // Validate all serial numbers for uniqueness (both against DB and within the batch)
      const serialNumbers = input.products.map((p) => p.serial_number);
      const serialSet = new Set<string>();
      const duplicatesInBatch = new Set<string>();

      for (const serial of serialNumbers) {
        if (serialSet.has(serial)) {
          duplicatesInBatch.add(serial);
        }
        serialSet.add(serial);
      }

      // Check existing serials in database
      const { data: existingProducts } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("serial_number")
        .in("serial_number", serialNumbers);

      const existingSerials = new Set(existingProducts?.map((p) => p.serial_number) || []);

      // Process each product
      for (let i = 0; i < input.products.length; i++) {
        const productData = input.products[i];

        try {
          // Check for duplicate serial in database
          if (existingSerials.has(productData.serial_number)) {
            throw new Error(`Serial number already exists in database: ${productData.serial_number}`);
          }

          // Check for duplicate serial in current batch
          if (duplicatesInBatch.has(productData.serial_number)) {
            // Only report error on second occurrence
            const firstOccurrence = serialNumbers.indexOf(productData.serial_number);
            if (firstOccurrence !== i) {
              throw new Error(`Duplicate serial number in batch: ${productData.serial_number}`);
            }
          }

          const { data, error } = await ctx.supabaseAdmin
            .from("physical_products")
            .insert({
              serial_number: productData.serial_number,
              product_id: productData.product_id,
              physical_warehouse_id: productData.physical_warehouse_id,
              virtual_warehouse_type: productData.virtual_warehouse_type,
              condition: productData.condition,
              warranty_start_date: productData.warranty_start_date,
              warranty_months: productData.warranty_months,
              purchase_date: productData.purchase_date,
              supplier_id: productData.supplier_id,
              supplier_name: productData.supplier_name,
              purchase_price: productData.purchase_price,
              notes: productData.notes,
              photo_urls: productData.photo_urls,
            })
            .select()
            .single();

          if (error) throw new Error(error.message);

          results.success.push(data);
          // Add to existing serials to prevent duplicates in subsequent iterations
          existingSerials.add(productData.serial_number);
        } catch (error) {
          results.errors.push({
            row: i + 1,
            serial: productData.serial_number,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return {
        total: input.products.length,
        success_count: results.success.length,
        error_count: results.errors.length,
        success: results.success,
        errors: results.errors,
      };
    }),

  /**
   * Story 1.8: Serial Number Verification and Stock Movements
   * AC 1.1: Verify warranty status by serial number
   */
  verifySerial: publicProcedure
    .input(z.object({ serial_number: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data: product, error } = await ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          *,
          product:products(*),
          physical_warehouse:physical_warehouses(*),
          current_ticket:service_tickets(id, ticket_number, status)
        `
        )
        .eq("serial_number", input.serial_number.toUpperCase())
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return {
            found: false,
            message: "Serial number not found in inventory",
          };
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Calculate warranty status
      const warrantyStatus = getWarrantyStatus(product.warranty_end_date);
      const daysRemaining = product.warranty_end_date
        ? getRemainingDays(product.warranty_end_date)
        : null;

      // Get virtual warehouse info by type
      const { data: virtualWarehouse } = await ctx.supabaseAdmin
        .from("virtual_warehouses")
        .select("*")
        .eq("warehouse_type", product.virtual_warehouse_type)
        .single();

      return {
        found: true,
        product,
        warranty: {
          status: warrantyStatus,
          daysRemaining,
          startDate: product.warranty_start_date,
          endDate: product.warranty_end_date,
        },
        location: {
          physical: product.physical_warehouse,
          virtual: virtualWarehouse,
        },
        inService: product.current_ticket
          ? ["pending", "in_progress"].includes(product.current_ticket.status)
          : false,
      };
    }),

  /**
   * AC 1.2: Record product movement between warehouses
   */
  recordMovement: publicProcedure
    .input(
      z.object({
        product_id: z.string().uuid(),
        movement_type: z.enum(["receipt", "transfer", "assignment", "return", "disposal"]),
        from_physical_warehouse_id: z.string().uuid().optional(),
        to_physical_warehouse_id: z.string().uuid().optional(),
        from_virtual_warehouse_type: z
          .enum(["main", "warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"])
          .optional(),
        to_virtual_warehouse_type: z
          .enum(["main", "warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"])
          .optional(),
        reference_ticket_id: z.string().uuid().optional(),
        notes: z.string().optional(),
        force: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if product is in service
      const { data: product } = await ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          *,
          current_ticket:service_tickets(id, ticket_number, status)
        `
        )
        .eq("id", input.product_id)
        .single();

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Validation: prevent movement if in service (unless force flag)
      const inService = product.current_ticket
        ? ["pending", "in_progress"].includes(product.current_ticket.status)
        : false;

      if (inService && !input.force) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Product is currently assigned to ticket ${product.current_ticket.ticket_number}. Cannot move while in service.`,
        });
      }

      // Record movement
      const { error: movementError } = await ctx.supabaseAdmin
        .from("stock_movements")
        .insert({
          physical_product_id: input.product_id,
          movement_type: input.movement_type,
          from_physical_warehouse_id: input.from_physical_warehouse_id,
          to_physical_warehouse_id: input.to_physical_warehouse_id,
          from_virtual_warehouse: input.from_virtual_warehouse_type,
          to_virtual_warehouse: input.to_virtual_warehouse_type,
          ticket_id: input.reference_ticket_id,
          notes: input.notes,
        });

      if (movementError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: movementError.message,
        });
      }

      // Update product location
      const updateData: any = {};
      if (input.to_physical_warehouse_id !== undefined) {
        updateData.physical_warehouse_id = input.to_physical_warehouse_id;
      }
      if (input.to_virtual_warehouse_type) {
        updateData.virtual_warehouse_type = input.to_virtual_warehouse_type;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await ctx.supabaseAdmin
          .from("physical_products")
          .update(updateData)
          .eq("id", input.product_id);

        if (updateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: updateError.message,
          });
        }
      }

      return { success: true };
    }),

  /**
   * AC 1.3: Get movement history for product
   */
  getMovementHistory: publicProcedure
    .input(
      z.object({
        product_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error, count } = await ctx.supabaseAdmin
        .from("stock_movements")
        .select(
          `
          *,
          from_physical:physical_warehouses!from_physical_warehouse_id(*),
          to_physical:physical_warehouses!to_physical_warehouse_id(*),
          ticket:service_tickets(ticket_number),
          moved_by:profiles(id, full_name)
        `,
          { count: "exact" }
        )
        .eq("physical_product_id", input.product_id)
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });

      return {
        movements: data || [],
        total: count || 0,
      };
    }),

  /**
   * AC 1.4: Assign product to ticket (move to In Service)
   */
  assignToTicket: publicProcedure
    .input(
      z.object({
        serial_number: z.string(),
        ticket_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find product
      const { data: product } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("*")
        .eq("serial_number", input.serial_number.toUpperCase())
        .single();

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Serial number not found",
        });
      }

      // Record movement
      await ctx.supabaseAdmin.from("stock_movements").insert({
        physical_product_id: product.id,
        movement_type: "assignment",
        from_virtual_warehouse: product.virtual_warehouse_type,
        to_virtual_warehouse: "in_service",
        ticket_id: input.ticket_id,
        notes: "Product assigned to service ticket",
      });

      // Update product
      await ctx.supabaseAdmin
        .from("physical_products")
        .update({
          virtual_warehouse_type: "in_service",
          current_ticket_id: input.ticket_id,
        })
        .eq("id", product.id);

      return { success: true };
    }),

  /**
   * Story 1.9: Warehouse Stock Levels and Low Stock Alerts
   * AC 3.1: Get aggregated stock levels
   */
  getStockLevels: publicProcedure
    .input(
      z.object({
        warehouse_type: z
          .enum(["main", "warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"])
          .optional(),
        status: z.enum(["ok", "warning", "critical"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Refresh materialized view for latest data
      await ctx.supabaseAdmin.rpc("refresh_warehouse_stock_levels");

      let query = ctx.supabaseAdmin
        .from("v_warehouse_stock_levels")
        .select("*", { count: "exact" });

      if (input.warehouse_type) {
        query = query.eq("virtual_warehouse_type", input.warehouse_type);
      }

      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.search) {
        query = query.or(`product_name.ilike.%${input.search}%,sku.ilike.%${input.search}%`);
      }

      const { data, error, count } = await query
        .order("status", { ascending: false }) // critical first
        .order("current_stock", { ascending: true }) // lowest stock first
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch stock levels: ${error.message}`,
        });
      }

      return {
        stockLevels: data || [],
        total: count || 0,
      };
    }),

  /**
   * AC 3.2: Set stock threshold for product
   */
  setThreshold: publicProcedure
    .input(
      z.object({
        product_id: z.string().uuid(),
        warehouse_type: z.enum(["main", "warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"]),
        minimum_quantity: z.number().int().min(0),
        reorder_quantity: z.number().int().min(0).optional(),
        alert_enabled: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from("product_stock_thresholds")
        .upsert({
          product_id: input.product_id,
          warehouse_type: input.warehouse_type,
          minimum_quantity: input.minimum_quantity,
          reorder_quantity: input.reorder_quantity || input.minimum_quantity * 2,
          alert_enabled: input.alert_enabled,
        });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to set threshold: ${error.message}`,
        });
      }

      // Refresh view to update status
      await ctx.supabaseAdmin.rpc("refresh_warehouse_stock_levels");

      return { success: true };
    }),

  /**
   * AC 3.3: Get low stock alerts
   */
  getLowStockAlerts: publicProcedure.query(async ({ ctx }) => {
    // Refresh materialized view
    await ctx.supabaseAdmin.rpc("refresh_warehouse_stock_levels");

    const { data, error } = await ctx.supabaseAdmin
      .from("v_warehouse_stock_levels")
      .select("*")
      .in("status", ["warning", "critical"])
      .eq("alert_enabled", true)
      .order("status", { ascending: false }) // critical first
      .order("current_stock", { ascending: true });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch low stock alerts: ${error.message}`,
      });
    }

    return {
      alerts: data || [],
      criticalCount: data?.filter((item) => item.status === "critical").length || 0,
      warningCount: data?.filter((item) => item.status === "warning").length || 0,
    };
  }),

  /**
   * AC 3.4: Export stock report to CSV
   */
  exportStockReport: publicProcedure
    .input(
      z.object({
        warehouse_type: z
          .enum(["main", "warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"])
          .optional(),
        status: z.enum(["ok", "warning", "critical"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Refresh view
      await ctx.supabaseAdmin.rpc("refresh_warehouse_stock_levels");

      let query = ctx.supabaseAdmin.from("v_warehouse_stock_levels").select("*");

      if (input.warehouse_type) {
        query = query.eq("virtual_warehouse_type", input.warehouse_type);
      }

      if (input.status) {
        query = query.eq("status", input.status);
      }

      const { data, error } = await query.order("product_name");

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to export stock report: ${error.message}`,
        });
      }

      // Generate CSV content
      const headers = ["Product Name", "SKU", "Type", "Warehouse", "Current Stock", "Threshold", "Reorder Qty", "Status"];
      const rows = (data || []).map((item) => [
        item.product_name,
        item.sku || "",
        item.product_type,
        item.virtual_warehouse_type,
        item.current_stock.toString(),
        item.threshold.toString(),
        (item.reorder_quantity || "").toString(),
        item.status.toUpperCase(),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      return {
        csv,
        filename: `stock-report-${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),

  /**
   * Story 1.10: RMA Batch Operations
   * AC 1: tRPC procedures for RMA batch management
   */

  // Create new RMA batch
  createRMABatch: publicProcedure
    .input(
      z.object({
        supplier_name: z.string().min(2, "Supplier name is required"),
        shipping_date: z.string().optional(),
        tracking_number: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create RMA batches",
        });
      }

      // Get profile for role checking
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user profile",
        });
      }

      // Check authorization
      if (!["admin", "manager"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and managers can create RMA batches",
        });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("rma_batches")
        .insert({
          supplier_name: input.supplier_name,
          shipping_date: input.shipping_date || null,
          tracking_number: input.tracking_number || null,
          notes: input.notes || null,
          status: "draft",
          created_by_id: profile.id,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create RMA batch: ${error.message}`,
        });
      }

      return data;
    }),

  // System settings (admin/manager)
  getSystemSetting: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', input.key)
        .single();

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to fetch setting: ${error.message}` });
      }

      return data?.value || null;
    }),

  updateSystemSetting: publicProcedure
    .input(z.object({ key: z.string(), value: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
      }

      // Check profile and role
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch user profile' });
      }

      if (!["admin", "manager"].includes(profile.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins and managers can update settings' });
      }

      const { error } = await ctx.supabaseAdmin
        .from('system_settings')
        .upsert({ key: input.key, value: input.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to update setting: ${error.message}` });
      }

      return { success: true };
    }),

  // Validate serial numbers for RMA batch
  validateRMASerials: publicProcedure
    .input(
      z.object({
        serial_numbers: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Get user profile with role
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User profile not found",
        });
      }

      if (!["admin", "manager"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and managers can add products to RMA batches",
        });
      }

      // Remove duplicates from input
      const uniqueSerials = Array.from(new Set(input.serial_numbers));
      
      // Query all serials at once
      const { data: products, error: queryError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select(`
          id,
          serial_number,
          rma_batch_id,
          virtual_warehouse_type,
          product:products(
            id,
            name,
            sku
          )
        `)
        .in("serial_number", uniqueSerials);

      if (queryError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to query products: ${queryError.message}`,
        });
      }

      // Create a map of serial -> product
      const productMap = new Map(
        products?.map((p) => [p.serial_number, p]) || []
      );

      // Check for duplicates in input
      const serialCounts = new Map<string, number>();
      input.serial_numbers.forEach((serial) => {
        serialCounts.set(serial, (serialCounts.get(serial) || 0) + 1);
      });

      // Validate each serial
      const results = uniqueSerials.map((serial) => {
        const product = productMap.get(serial);
        const isDuplicate = (serialCounts.get(serial) || 0) > 1;

        // Check if duplicate in input
        if (isDuplicate) {
          return {
            serial_number: serial,
            status: "duplicate" as const,
            message: "Serial bị trùng lặp trong danh sách",
          };
        }

        // Check if not found
        if (!product) {
          return {
            serial_number: serial,
            status: "not_found" as const,
            message: "Không tìm thấy sản phẩm với serial này",
          };
        }

        // Check if already in another RMA batch
        if (product.rma_batch_id) {
          return {
            serial_number: serial,
            status: "invalid" as const,
            message: "Sản phẩm đã có trong lô RMA khác",
          };
        }

        // Only accept products from warranty_stock warehouse (RMA eligible inventory)
        if (product.virtual_warehouse_type !== "warranty_stock") {
          return {
            serial_number: serial,
            status: "invalid" as const,
            message: `Sản phẩm phải ở kho warranty_stock mới có thể RMA. Hiện tại: "${product.virtual_warehouse_type}"`,
          };
        }

        // Valid product
        const productInfo = product.product as any;
        return {
          serial_number: serial,
          status: "valid" as const,
          product_id: product.id,
          product_name: productInfo?.name || "Unknown",
        };
      });

      return results;
    }),

  // Add products to RMA batch
  addProductsToRMA: publicProcedure
    .input(
      z.object({
        batch_id: z.string().uuid(),
        product_ids: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Get profile for role checking
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user profile",
        });
      }

      // Check authorization
      if (!["admin", "manager"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and managers can add products to RMA batches",
        });
      }

      // Check batch exists and is in draft status
      const { data: batch, error: batchError } = await ctx.supabaseAdmin
        .from("rma_batches")
        .select("id, status")
        .eq("id", input.batch_id)
        .single();

      if (batchError || !batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "RMA batch not found",
        });
      }

      if (batch.status !== "draft") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot add products to finalized batch",
        });
      }

      let addedCount = 0;
      const errors: string[] = [];

      // Process each product
      for (const productId of input.product_ids) {
        try {
          // Get product details
          const { data: product, error: productError } = await ctx.supabaseAdmin
            .from("physical_products")
            .select("id, serial_number, rma_batch_id, virtual_warehouse_type")
            .eq("id", productId)
            .single();

          if (productError || !product) {
            errors.push(`Product ${productId} not found`);
            continue;
          }

          // Check if product already in a batch
          if (product.rma_batch_id) {
            errors.push(`Product ${product.serial_number} already in another RMA batch`);
            continue;
          }

          // Only accept products from warranty_stock
          if (product.virtual_warehouse_type !== "warranty_stock") {
            errors.push(`Product ${product.serial_number} must be in warranty_stock warehouse. Current: ${product.virtual_warehouse_type}`);
            continue;
          }

          // Update product: save current warehouse, assign to batch, move to rma_staging, set RMA info
          const { error: updateError } = await ctx.supabaseAdmin
            .from("physical_products")
            .update({
              previous_virtual_warehouse_type: product.virtual_warehouse_type, // Save source warehouse
              rma_batch_id: input.batch_id,
              virtual_warehouse_type: "rma_staging",
              rma_date: new Date().toISOString(),
              rma_reason: "Pending RMA", // Default reason, can be updated later
            })
            .eq("id", product.id);

          if (updateError) {
            errors.push(`Failed to update product ${product.serial_number}: ${updateError.message}`);
            continue;
          }

          // Record movement from warranty_stock to rma_staging
          await ctx.supabaseAdmin.from("stock_movements").insert({
            physical_product_id: product.id,
            movement_type: "rma_out",
            from_virtual_warehouse: product.virtual_warehouse_type,
            to_virtual_warehouse: "rma_staging",
            notes: `Moved to RMA batch for supplier return`,
            moved_by_id: user.id,
          });

          addedCount++;
        } catch (err) {
          errors.push(`Failed to add product ${productId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      return {
        success: true,
        added: addedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    }),

  // Finalize RMA batch
  finalizeRMABatch: publicProcedure
    .input(
      z.object({
        batch_id: z.string().uuid(),
        shipping_date: z.string().optional(),
        tracking_number: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Get profile for role checking
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user profile",
        });
      }

      // Check authorization
      if (!["admin", "manager"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and managers can finalize RMA batches",
        });
      }

      // Check batch has products
      const { count, error: countError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("id", { count: "exact", head: true })
        .eq("rma_batch_id", input.batch_id);

      if (countError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to count batch products: ${countError.message}`,
        });
      }

      if (!count || count === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot finalize empty batch",
        });
      }

      // Update batch status to submitted
      const { data, error } = await ctx.supabaseAdmin
        .from("rma_batches")
        .update({
          status: "submitted",
          shipping_date: input.shipping_date || null,
          tracking_number: input.tracking_number || null,
        })
        .eq("id", input.batch_id)
        .eq("status", "draft") // Only finalize if still in draft
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to finalize RMA batch: ${error.message}`,
        });
      }

      if (!data) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Batch is not in draft status",
        });
      }

      return data;
    }),

  // Remove product from RMA batch
  removeProductFromRMA: publicProcedure
    .input(
      z.object({
        batch_id: z.string().uuid(),
        product_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Get profile for role checking
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user profile",
        });
      }

      // Check authorization
      if (!["admin", "manager"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and managers can remove products from RMA batches",
        });
      }

      // Check batch exists and is in draft status
      const { data: batch, error: batchError } = await ctx.supabaseAdmin
        .from("rma_batches")
        .select("id, status")
        .eq("id", input.batch_id)
        .single();

      if (batchError || !batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "RMA batch not found",
        });
      }

      if (batch.status !== "draft") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot remove products from finalized batch",
        });
      }

      // Get product to check and get previous warehouse
      const { data: product, error: productError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, rma_batch_id, virtual_warehouse_type, previous_virtual_warehouse_type")
        .eq("id", input.product_id)
        .single();

      if (productError || !product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      if (product.rma_batch_id !== input.batch_id) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Product is not in this RMA batch",
        });
      }

      // Use previous warehouse if available, fallback to warranty_stock
      const destinationWarehouseType = product.previous_virtual_warehouse_type || "warranty_stock";

      // Remove from batch and return to previous warehouse
      const { error: updateError } = await ctx.supabaseAdmin
        .from("physical_products")
        .update({
          rma_batch_id: null,
          virtual_warehouse_type: destinationWarehouseType,
          previous_virtual_warehouse_type: null, // Clear saved warehouse
          rma_date: null,
          rma_reason: null,
        })
        .eq("id", input.product_id);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to remove product: ${updateError.message}`,
        });
      }

      // Record movement
      await ctx.supabaseAdmin.from("stock_movements").insert({
        physical_product_id: product.id,
        movement_type: "rma_return",
        from_virtual_warehouse: "rma_staging",
        to_virtual_warehouse: destinationWarehouseType,
        notes: `Removed from RMA batch, returned to original warehouse: ${destinationWarehouseType}`,
        moved_by_id: user.id,
      });

      return { success: true };
    }),

  // Get RMA batches with pagination
  getRMABatches: publicProcedure
    .input(
      z.object({
        status: z.enum(["draft", "submitted", "shipped", "completed"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Get profile for role checking
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user profile",
        });
      }

      // Check authorization
      if (!["admin", "manager"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and managers can view RMA batches",
        });
      }

      let query = ctx.supabaseAdmin
        .from("rma_batches")
        .select(
          `
          *,
          created_by:profiles!rma_batches_created_by_id_fkey(full_name)
        `,
          { count: "exact" }
        );

      if (input.status) {
        query = query.eq("status", input.status);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch RMA batches: ${error.message}`,
        });
      }

      // Get product count for each batch
      const batchesWithCount = await Promise.all(
        (data || []).map(async (batch) => {
          const { count: productCount } = await ctx.supabaseAdmin
            .from("physical_products")
            .select("id", { count: "exact", head: true })
            .eq("rma_batch_id", batch.id);

          return {
            ...batch,
            product_count: productCount || 0,
          };
        })
      );

      return {
        batches: batchesWithCount,
        total: count || 0,
      };
    }),

  // Get RMA batch details with products
  getRMABatchDetails: publicProcedure
    .input(z.object({ batch_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view batch details",
        });
      }

      // Get batch details
      const { data: batch, error: batchError } = await ctx.supabaseAdmin
        .from("rma_batches")
        .select(
          `
          *,
          created_by:profiles!rma_batches_created_by_id_fkey(full_name)
        `
        )
        .eq("id", input.batch_id)
        .single();

      if (batchError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch batch: ${batchError.message}`,
        });
      }

      if (!batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      // Get products in batch - query directly from physical_products
      const { data: batchProducts, error: productsError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          id,
          serial_number,
          condition,
          rma_reason,
          rma_date,
          created_at,
          product:products(
            id,
            name,
            sku,
            type
          )
        `
        )
        .eq("rma_batch_id", input.batch_id);

      if (productsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch batch products: ${productsError.message}`,
        });
      }

      return {
        batch,
        products: batchProducts || [],
      };
    }),
});
