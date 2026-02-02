import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  requireAnyAuthenticated,
  requireManagerOrAbove,
} from "../middleware/requireRole";

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * AC 3: tRPC router with procedures for warehouse management
 */

// Physical warehouse schemas for validation
const createPhysicalWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  code: z.string().min(1, "Warehouse code is required").max(20, "Warehouse code must be 20 characters or less"),
  location: z.string().min(1, "Location is required"),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

const updatePhysicalWarehouseSchema = z.object({
  id: z.string().uuid("Warehouse ID must be a valid UUID"),
  name: z.string().min(1, "Warehouse name is required").optional(),
  code: z.string().min(1, "Warehouse code is required").max(20, "Warehouse code must be 20 characters or less").optional(),
  location: z.string().min(1, "Location is required").optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const deletePhysicalWarehouseSchema = z.object({
  id: z.string().uuid("Warehouse ID must be a valid UUID"),
});

const listPhysicalWarehousesSchema = z
  .object({
    is_active: z.boolean().optional(),
  })
  .optional();

// Virtual warehouse schemas
const createVirtualWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  physical_warehouse_id: z.string().uuid("Physical warehouse ID must be a valid UUID"),
  warehouse_type: z.enum(["main", "warranty_stock", "rma_staging", "dead_stock", "in_service", "parts", "customer_installed"]).default("main"),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

const updateVirtualWarehouseSchema = z.object({
  id: z.string().uuid("Virtual warehouse ID must be a valid UUID"),
  name: z.string().min(1, "Warehouse name is required").optional(),
  warehouse_type: z.enum(["main", "warranty_stock", "rma_staging", "dead_stock", "in_service", "parts", "customer_installed"]).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const deleteVirtualWarehouseSchema = z.object({
  id: z.string().uuid("Virtual warehouse ID must be a valid UUID"),
});

export const warehouseRouter = router({
  /**
   * AC 3.1: List all physical warehouses with optional filters
   */
  listPhysicalWarehouses: publicProcedure
    .use(requireAnyAuthenticated)
    .input(listPhysicalWarehousesSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .from("physical_warehouses")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply is_active filter if provided
      if (input?.is_active !== undefined) {
        query = query.eq("is_active", input.is_active);
      }

      const { data: warehouses, error } = await query;

      if (error) {
        throw new Error(
          `Failed to fetch physical warehouses: ${error.message}`,
        );
      }

      return warehouses || [];
    }),

  /**
   * AC 3.2: Create a new physical warehouse location
   */
  createPhysicalWarehouse: publicProcedure
    .use(requireManagerOrAbove)
    .input(createPhysicalWarehouseSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: warehouse, error } = await ctx.supabaseAdmin
        .from("physical_warehouses")
        .insert({
          name: input.name,
          code: input.code,
          location: input.location,
          description: input.description,
          is_active: input.is_active,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create physical warehouse: ${error.message}`);
      }

      return warehouse;
    }),

  /**
   * AC 3.3: Update physical warehouse details
   */
  updatePhysicalWarehouse: publicProcedure
    .use(requireManagerOrAbove)
    .input(updatePhysicalWarehouseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const { data: warehouse, error } = await ctx.supabaseAdmin
        .from("physical_warehouses")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update physical warehouse: ${error.message}`);
      }

      return warehouse;
    }),

  /**
   * AC 3.4: Delete a physical warehouse (soft delete via is_active)
   * NEW: Blocks deletion of system default warehouse
   */
  deletePhysicalWarehouse: publicProcedure
    .use(requireManagerOrAbove)
    .input(deletePhysicalWarehouseSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if this is the system default warehouse
      const { data: existingWarehouse, error: fetchError } = await ctx.supabaseAdmin
        .from("physical_warehouses")
        .select("is_system_default, name")
        .eq("id", input.id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch warehouse: ${fetchError.message}`);
      }

      if (existingWarehouse?.is_system_default) {
        throw new Error(
          `Không thể xóa kho mặc định "${existingWarehouse.name}". Kho này được yêu cầu cho hoạt động hệ thống.`
        );
      }

      // Soft delete by setting is_active to false
      const { data: warehouse, error } = await ctx.supabaseAdmin
        .from("physical_warehouses")
        .update({ is_active: false })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to delete physical warehouse: ${error.message}`);
      }

      return warehouse;
    }),

  /**
   * AC 3.5: List all virtual warehouses
   */
  listVirtualWarehouses: publicProcedure
    .use(requireAnyAuthenticated)
    .input(z.object({ isArchive: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
    let query = ctx.supabaseAdmin
      .from("virtual_warehouses")
      .select(`
        *,
        physical_warehouse:physical_warehouses(id, name, code, location)
      `)
      .eq("is_active", true);

    if (input?.isArchive !== undefined) {
      query = query.eq("is_archive", input.isArchive);
    }

    const { data: warehouses, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch virtual warehouses: ${error.message}`);
    }

    return warehouses || [];
  }),

  /**
   * AC 3.6: Create a new virtual warehouse (admin/manager only)
   */
  createVirtualWarehouse: publicProcedure
    .use(requireManagerOrAbove)
    .input(createVirtualWarehouseSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: warehouse, error } = await ctx.supabaseAdmin
        .from("virtual_warehouses")
        .insert({
          name: input.name,
          physical_warehouse_id: input.physical_warehouse_id,
          warehouse_type: input.warehouse_type,
          description: input.description,
          is_active: input.is_active,
        })
        .select(`
          *,
          physical_warehouse:physical_warehouses(id, name, code)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create virtual warehouse: ${error.message}`);
      }

      return warehouse;
    }),

  /**
   * AC 3.7: Update virtual warehouse details (admin/manager only)
   */
  updateVirtualWarehouse: publicProcedure
    .use(requireManagerOrAbove)
    .input(updateVirtualWarehouseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const { data: warehouse, error } = await ctx.supabaseAdmin
        .from("virtual_warehouses")
        .update(updateData)
        .eq("id", id)
        .select(`
          *,
          physical_warehouse:physical_warehouses(id, name, code)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update virtual warehouse: ${error.message}`);
      }

      return warehouse;
    }),

  /**
   * AC 3.8: Delete a virtual warehouse (soft delete via is_active)
   */
  deleteVirtualWarehouse: publicProcedure
    .use(requireManagerOrAbove)
    .input(deleteVirtualWarehouseSchema)
    .mutation(async ({ ctx, input }) => {
      // Soft delete by setting is_active to false
      const { data: warehouse, error } = await ctx.supabaseAdmin
        .from("virtual_warehouses")
        .update({ is_active: false })
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to delete virtual warehouse: ${error.message}`);
      }

      return warehouse;
    }),
});
