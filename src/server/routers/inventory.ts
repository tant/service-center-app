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
    .enum(["warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"])
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
    .enum(["warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"])
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
          .enum(["warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"])
          .optional(),
        to_virtual_warehouse_type: z
          .enum(["warranty_stock", "rma_staging", "dead_stock", "in_service", "parts"])
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
});
