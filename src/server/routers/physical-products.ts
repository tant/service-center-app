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
  virtual_warehouse_id: z.string().uuid("Virtual Warehouse ID must be a valid UUID"),
  condition: z.enum(["new", "refurbished", "used", "faulty", "for_parts"]),
  manufacturer_warranty_end_date: z.string().optional(),
  user_warranty_end_date: z.string().optional(),
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
  virtual_warehouse_id: z.string().uuid("Virtual Warehouse ID must be a valid UUID").optional(),
  condition: z.enum(["new", "refurbished", "used", "faulty", "for_parts"]).optional(),
  manufacturer_warranty_end_date: z.string().nullable().optional(),
  user_warranty_end_date: z.string().nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  supplier_id: z.string().uuid().nullable().optional(),
  supplier_name: z.string().nullable().optional(),
  purchase_price: z.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  photo_urls: z.array(z.string().url()).optional(),
});

const listProductsSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID").optional(),
  virtual_warehouse_id: z.string().uuid("Virtual Warehouse ID must be a valid UUID").optional(),
  condition: z.enum(["new", "refurbished", "used", "faulty", "for_parts"]).optional(),
  status: z.enum(["draft", "active", "transferring", "issued", "disposed"]).optional(),
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

      const { data: product, error } = await ctx.supabaseAdmin
        .from("physical_products")
        .insert({
          serial_number: input.serial_number,
          product_id: input.product_id,
          virtual_warehouse_id: input.virtual_warehouse_id,
          condition: input.condition,
          manufacturer_warranty_end_date: input.manufacturer_warranty_end_date,
          user_warranty_end_date: input.user_warranty_end_date,
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
   * Bulk update warranty dates from CSV upload
   */
  bulkUpdateWarranty: publicProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            serial_number: z.string().min(1, "Serial number is required"),
            manufacturer_warranty_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Manufacturer warranty date must be in YYYY-MM-DD format"),
            user_warranty_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "User warranty date must be in YYYY-MM-DD format"),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = {
        success: [] as { serial_number: string; message: string }[],
        errors: [] as { serial_number: string; error: string }[],
      };

      for (const update of input.updates) {
        try {
          const serialUpper = update.serial_number.toUpperCase().trim();

          // Find product by serial
          const { data: product, error: findError } = await ctx.supabaseAdmin
            .from("physical_products")
            .select("id, serial_number")
            .eq("serial_number", serialUpper)
            .single();

          if (findError || !product) {
            results.errors.push({
              serial_number: update.serial_number,
              error: "Không tìm thấy sản phẩm với số serial này",
            });
            continue;
          }

          // Update warranty dates
          const { error: updateError } = await ctx.supabaseAdmin
            .from("physical_products")
            .update({
              manufacturer_warranty_end_date: update.manufacturer_warranty_end_date,
              user_warranty_end_date: update.user_warranty_end_date,
            })
            .eq("id", product.id);

          if (updateError) {
            results.errors.push({
              serial_number: update.serial_number,
              error: `Lỗi khi cập nhật: ${updateError.message}`,
            });
            continue;
          }

          results.success.push({
            serial_number: update.serial_number,
            message: "Cập nhật thành công",
          });
        } catch (error) {
          results.errors.push({
            serial_number: update.serial_number,
            error: error instanceof Error ? error.message : "Lỗi không xác định",
          });
        }
      }

      return {
        total: input.updates.length,
        success_count: results.success.length,
        error_count: results.errors.length,
        success: results.success,
        errors: results.errors,
      };
    }),

  /**
   * AC 2.3: List products with filters and pagination
   */
  listProducts: publicProcedure
    .input(listProductsSchema)
    .query(async ({ ctx, input }) => {
      // If search is provided, first find matching product IDs
      let matchingProductIds: string[] | null = null;
      if (input.search) {
        const { data: matchingProducts } = await ctx.supabaseAdmin
          .from("products")
          .select("id")
          .or(`name.ilike.%${input.search}%,sku.ilike.%${input.search}%`);

        matchingProductIds = matchingProducts?.map(p => p.id) || [];
      }

      let query = ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          *,
          product:products!inner(id, name, sku, brand:brands(name)),
          virtual_warehouse:virtual_warehouses!virtual_warehouse_id(id, name, warehouse_type, physical_warehouse:physical_warehouses(id, name))
        `
        );

      // Apply filters
      if (input.product_id) {
        query = query.eq("product_id", input.product_id);
      }

      if (input.virtual_warehouse_id) {
        query = query.eq("virtual_warehouse_id", input.virtual_warehouse_id);
      }

      if (input.condition) {
        query = query.eq("condition", input.condition);
      }

      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.search) {
        // Search by serial number OR product_id in matching products
        if (matchingProductIds && matchingProductIds.length > 0) {
          query = query.or(`serial_number.ilike.%${input.search}%,product_id.in.(${matchingProductIds.join(',')})`);
        } else {
          // Only search by serial if no products matched
          query = query.ilike("serial_number", `%${input.search}%`);
        }
      }

      // Get data
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch physical products: ${error.message}`,
        });
      }

      // Get count separately (simpler and faster)
      let countQuery = ctx.supabaseAdmin
        .from("physical_products")
        .select("id", { count: "exact", head: true });

      if (input.product_id) {
        countQuery = countQuery.eq("product_id", input.product_id);
      }
      if (input.virtual_warehouse_id) {
        countQuery = countQuery.eq("virtual_warehouse_id", input.virtual_warehouse_id);
      }
      if (input.condition) {
        countQuery = countQuery.eq("condition", input.condition);
      }
      if (input.search) {
        // Same search logic for count
        if (matchingProductIds && matchingProductIds.length > 0) {
          countQuery = countQuery.or(`serial_number.ilike.%${input.search}%,product_id.in.(${matchingProductIds.join(',')})`);
        } else {
          countQuery = countQuery.ilike("serial_number", `%${input.search}%`);
        }
      }

      const { count } = await countQuery;

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
          warranty_period_months,
          brand:brands(name)
        ),
        virtual_warehouse:virtual_warehouses!virtual_warehouse_id(
          id,
          name,
          warehouse_type,
          physical_warehouse:physical_warehouses(
            id,
            name,
            code,
            location
          )
        ),
        current_ticket:service_tickets!current_ticket_id(
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
              virtual_warehouse_id: productData.virtual_warehouse_id,
              condition: productData.condition,
              manufacturer_warranty_end_date: productData.manufacturer_warranty_end_date,
              user_warranty_end_date: productData.user_warranty_end_date,
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
      const { data: product, error} = await ctx.supabaseAdmin
        .from("physical_products")
        .select(
          `
          *,
          product:products(*),
          virtual_warehouse:virtual_warehouses!virtual_warehouse_id(*, physical_warehouse:physical_warehouses(*)),
          current_ticket:service_tickets!current_ticket_id(id, ticket_number, status)
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

      // Calculate warranty status - prioritize user warranty, fallback to manufacturer
      const warrantyEndDate = product.user_warranty_end_date || product.manufacturer_warranty_end_date || null;
      const warrantyStatus = getWarrantyStatus(warrantyEndDate);
      const daysRemaining = warrantyEndDate
        ? getRemainingDays(warrantyEndDate)
        : null;

      return {
        found: true,
        product,
        warranty: {
          status: warrantyStatus,
          daysRemaining,
          manufacturerEndDate: product.manufacturer_warranty_end_date,
          userEndDate: product.user_warranty_end_date,
          // Deprecated fields for backward compatibility
          endDate: warrantyEndDate,
        },
        location: {
          physical: (product.virtual_warehouse as any)?.physical_warehouse || null,
          virtual: product.virtual_warehouse,
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
        from_virtual_warehouse_id: z.string().uuid().optional(),
        to_virtual_warehouse_id: z.string().uuid().optional(),
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
          current_ticket:service_tickets!current_ticket_id(id, ticket_number, status)
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
          from_virtual_warehouse_id: input.from_virtual_warehouse_id,
          to_virtual_warehouse_id: input.to_virtual_warehouse_id,
          ticket_id: input.reference_ticket_id,
          notes: input.notes,
        });

      if (movementError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: movementError.message,
        });
      }

      // Update product location (only virtual warehouse - physical is derived from virtual)
      const updateData: any = {};
      if (input.to_virtual_warehouse_id) {
        updateData.virtual_warehouse_id = input.to_virtual_warehouse_id;
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

      // Find in_service warehouse
      const { data: inServiceWarehouse } = await ctx.supabaseAdmin
        .from("virtual_warehouses")
        .select("id")
        .eq("warehouse_type", "in_service")
        .limit(1)
        .single();

      if (!inServiceWarehouse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "In-service warehouse not found in system",
        });
      }

      // Record movement
      await ctx.supabaseAdmin.from("stock_movements").insert({
        physical_product_id: product.id,
        movement_type: "assignment",
        from_virtual_warehouse_id: product.virtual_warehouse_id,
        to_virtual_warehouse_id: inServiceWarehouse.id,
        ticket_id: input.ticket_id,
        notes: "Product assigned to service ticket",
      });

      // Update product
      await ctx.supabaseAdmin
        .from("physical_products")
        .update({
          virtual_warehouse_id: inServiceWarehouse.id,
          current_ticket_id: input.ticket_id,
        })
        .eq("id", product.id);

      return { success: true };
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
          virtual_warehouse_id,
          virtual_warehouse:virtual_warehouses!virtual_warehouse_id(id, name, warehouse_type),
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

        // Only accept products from dead_stock warehouse (faulty products eligible for RMA)
        const warehouse = product.virtual_warehouse as any;
        if (!warehouse || warehouse.warehouse_type !== "dead_stock") {
          return {
            serial_number: serial,
            status: "invalid" as const,
            message: `Sản phẩm phải ở Kho Hàng Hỏng (dead_stock) mới có thể RMA. Hiện tại: "${warehouse?.name || "unknown"}"`,
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

      const errors: string[] = [];

      // Find dead_stock warehouse for validation
      const { data: deadStockWarehouse } = await ctx.supabaseAdmin
        .from("virtual_warehouses")
        .select("id")
        .eq("warehouse_type", "dead_stock")
        .limit(1)
        .single();

      if (!deadStockWarehouse) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "dead_stock warehouse not found in system",
        });
      }

      // Fetch all products at once
      const { data: products, error: productsError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, product_id, rma_batch_id, virtual_warehouse_id")
        .in("id", input.product_ids);

      if (productsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch products: ${productsError.message}`,
        });
      }

      // Validate and collect valid products
      const validProducts: Array<{ id: string; serial_number: string; product_id: string }> = [];
      const productIdSet = new Set(products?.map(p => p.id) || []);

      for (const productId of input.product_ids) {
        if (!productIdSet.has(productId)) {
          errors.push(`Product ${productId} not found`);
          continue;
        }

        const product = products?.find(p => p.id === productId);
        if (!product) continue;

        if (product.rma_batch_id) {
          errors.push(`Product ${product.serial_number} already in another RMA batch`);
          continue;
        }

        if (product.virtual_warehouse_id !== deadStockWarehouse.id) {
          errors.push(`Product ${product.serial_number} must be in dead_stock warehouse`);
          continue;
        }

        validProducts.push({
          id: product.id,
          serial_number: product.serial_number,
          product_id: product.product_id,
        });
      }

      if (validProducts.length === 0) {
        return {
          success: false,
          added: 0,
          errors: errors.length > 0 ? errors : ["No valid products to add"],
        };
      }

      // Update rma_batch_id, rma_date for valid products (no transfer yet - transfer happens at complete)
      const validProductIds = validProducts.map(p => p.id);
      const { error: updateError } = await ctx.supabaseAdmin
        .from("physical_products")
        .update({
          rma_batch_id: input.batch_id,
          rma_date: new Date().toISOString(),
        })
        .in("id", validProductIds);

      if (updateError) {
        errors.push(`Failed to update RMA info: ${updateError.message}`);
      }

      return {
        success: true,
        added: validProducts.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    }),

  // Finalize RMA batch (draft → submitted) - only locks the product list, no stock movement yet
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

      // Update batch status to submitted (no stock movement - that happens at complete)
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

  // Complete RMA batch (submitted → completed) - performs transfer and stock issue
  completeRMABatch: publicProcedure
    .input(
      z.object({
        batch_id: z.string().uuid(),
        shipping_date: z.string().optional(),
        tracking_number: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      if (!["admin", "manager"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and managers can complete RMA batches",
        });
      }

      // Get batch and verify status
      const { data: batch, error: batchError } = await ctx.supabaseAdmin
        .from("rma_batches")
        .select("id, status, shipping_date, tracking_number")
        .eq("id", input.batch_id)
        .single();

      if (batchError || !batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "RMA batch not found",
        });
      }

      if (batch.status !== "submitted") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Batch must be in submitted status to complete",
        });
      }

      // Get all products in batch
      const { data: batchProducts, error: productsError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, product_id, virtual_warehouse_id")
        .eq("rma_batch_id", input.batch_id);

      if (productsError || !batchProducts || batchProducts.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch batch products: ${productsError?.message || "No products found"}`,
        });
      }

      // Get warehouses
      const { data: deadStockWarehouse } = await ctx.supabaseAdmin
        .from("virtual_warehouses")
        .select("id")
        .eq("warehouse_type", "dead_stock")
        .limit(1)
        .single();

      const { data: rmaWarehouse } = await ctx.supabaseAdmin
        .from("virtual_warehouses")
        .select("id")
        .eq("warehouse_type", "rma_staging")
        .limit(1)
        .single();

      if (!deadStockWarehouse || !rmaWarehouse) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "dead_stock or rma_staging warehouse not found in system",
        });
      }

      const shippingDate = input.shipping_date || batch.shipping_date || new Date().toISOString().split("T")[0];

      // Step 1: Create stock_transfer (dead_stock → rma_staging)
      const { data: transfer, error: transferError } = await ctx.supabaseAdmin
        .from("stock_transfers")
        .insert({
          from_virtual_warehouse_id: deadStockWarehouse.id,
          to_virtual_warehouse_id: rmaWarehouse.id,
          transfer_date: shippingDate,
          rma_batch_id: input.batch_id,
          notes: `Chuyển kho cho lô RMA: ${input.batch_id}`,
          status: "completed",
          created_by_id: profile.id,
        })
        .select()
        .single();

      if (transferError || !transfer) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create transfer: ${transferError?.message}`,
        });
      }

      // Group products by product_id
      const productGroups = new Map<string, typeof batchProducts>();
      for (const p of batchProducts) {
        const group = productGroups.get(p.product_id) || [];
        group.push(p);
        productGroups.set(p.product_id, group);
      }

      // Create transfer items and serials
      for (const [productId, groupProducts] of productGroups) {
        const { data: transferItem, error: itemError } = await ctx.supabaseAdmin
          .from("stock_transfer_items")
          .insert({
            transfer_id: transfer.id,
            product_id: productId,
            quantity: groupProducts.length,
          })
          .select()
          .single();

        if (itemError || !transferItem) {
          console.error(`Failed to create transfer item for product ${productId}:`, itemError);
          continue;
        }

        // Insert transfer serials (trigger will move products to rma_staging)
        const serialsToInsert = groupProducts.map(p => ({
          transfer_item_id: transferItem.id,
          physical_product_id: p.id,
          serial_number: p.serial_number,
        }));

        const { error: serialsError } = await ctx.supabaseAdmin
          .from("stock_transfer_serials")
          .insert(serialsToInsert);

        if (serialsError) {
          console.error(`Failed to create transfer serials:`, serialsError);
        }
      }

      // Step 2: Create stock_issue (xuất kho từ rma_staging)
      const { data: issue, error: issueError } = await ctx.supabaseAdmin
        .from("stock_issues")
        .insert({
          issue_type: "normal",
          virtual_warehouse_id: rmaWarehouse.id,
          issue_date: shippingDate,
          rma_batch_id: input.batch_id,
          notes: `Phiếu xuất kho cho lô RMA: ${input.batch_id}`,
          status: "completed",
          created_by_id: profile.id,
        })
        .select()
        .single();

      if (issueError || !issue) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create stock issue: ${issueError?.message}`,
        });
      }

      // Create issue items and serials
      for (const [productId, groupProducts] of productGroups) {
        const { data: issueItem, error: itemError } = await ctx.supabaseAdmin
          .from("stock_issue_items")
          .insert({
            issue_id: issue.id,
            product_id: productId,
            quantity: groupProducts.length,
          })
          .select()
          .single();

        if (itemError || !issueItem) {
          console.error(`Failed to create issue item for product ${productId}:`, itemError);
          continue;
        }

        // Insert issue serials (trigger will update stock - mark as issued)
        const serialsToInsert = groupProducts.map(p => ({
          issue_item_id: issueItem.id,
          physical_product_id: p.id,
          serial_number: p.serial_number,
        }));

        const { error: serialsError } = await ctx.supabaseAdmin
          .from("stock_issue_serials")
          .insert(serialsToInsert);

        if (serialsError) {
          console.error(`Failed to create issue serials:`, serialsError);
        }
      }

      // Step 3: Update batch status to completed
      const updateData: Record<string, unknown> = {
        status: "completed",
      };
      if (input.shipping_date) updateData.shipping_date = input.shipping_date;
      if (input.tracking_number) updateData.tracking_number = input.tracking_number;
      if (input.notes) updateData.notes = input.notes;

      const { data, error } = await ctx.supabaseAdmin
        .from("rma_batches")
        .update(updateData)
        .eq("id", input.batch_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to complete RMA batch: ${error.message}`,
        });
      }

      return { ...data, transfer_id: transfer.id, issue_id: issue.id };
    }),

  // Remove product from RMA batch (draft only - no transfer needed since product stays in dead_stock)
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

      // Get product to check
      const { data: product, error: productError } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("id, serial_number, product_id, rma_batch_id")
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

      // Clear RMA info (product stays in dead_stock - no transfer needed)
      const { error: updateError } = await ctx.supabaseAdmin
        .from("physical_products")
        .update({
          rma_batch_id: null,
          rma_date: null,
        })
        .eq("id", input.product_id);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to clear RMA info: ${updateError.message}`,
        });
      }

      return { success: true };
    }),

  // Cancel RMA batch (draft or submitted → cancelled)
  cancelRMABatch: publicProcedure
    .input(
      z.object({
        batch_id: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      if (!["admin", "manager"].includes(profile.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and managers can cancel RMA batches",
        });
      }

      // Get batch and verify status
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

      if (!["draft", "submitted"].includes(batch.status)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Can only cancel draft or submitted batches",
        });
      }

      // Clear rma_batch_id from all products in this batch
      const { error: clearError } = await ctx.supabaseAdmin
        .from("physical_products")
        .update({
          rma_batch_id: null,
          rma_date: null,
        })
        .eq("rma_batch_id", input.batch_id);

      if (clearError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to clear products from batch: ${clearError.message}`,
        });
      }

      // Update batch status to cancelled
      const updateData: Record<string, unknown> = {
        status: "cancelled",
      };
      if (input.reason) {
        updateData.notes = input.reason;
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("rma_batches")
        .update(updateData)
        .eq("id", input.batch_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to cancel RMA batch: ${error.message}`,
        });
      }

      return data;
    }),

  // Get RMA batches with pagination
  getRMABatches: publicProcedure
    .input(
      z.object({
        status: z.enum(["draft", "submitted", "completed", "cancelled"]).optional(),
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
