import { z } from "zod";
import { router, publicProcedure } from "../trpc";

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * AC 3: tRPC router with 5 procedures for warehouse management
 */

// Physical warehouse schemas for validation
const createPhysicalWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

const updatePhysicalWarehouseSchema = z.object({
  id: z.string().uuid("Warehouse ID must be a valid UUID"),
  name: z.string().min(1, "Warehouse name is required").optional(),
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

export const warehouseRouter = router({
  /**
   * AC 3.1: List all physical warehouses with optional filters
   */
  listPhysicalWarehouses: publicProcedure
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
    .input(createPhysicalWarehouseSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: warehouse, error } = await ctx.supabaseAdmin
        .from("physical_warehouses")
        .insert({
          name: input.name,
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
   */
  deletePhysicalWarehouse: publicProcedure
    .input(deletePhysicalWarehouseSchema)
    .mutation(async ({ ctx, input }) => {
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
   * AC 3.5: List all virtual warehouses (these are fixed/seeded)
   */
  listVirtualWarehouses: publicProcedure.query(async ({ ctx }) => {
    const { data: warehouses, error } = await ctx.supabaseAdmin
      .from("virtual_warehouses")
      .select("*")
      .eq("is_active", true)
      .order("warehouse_type", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch virtual warehouses: ${error.message}`);
    }

    return warehouses || [];
  }),
});
