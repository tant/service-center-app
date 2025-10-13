import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// Brand schemas for validation
const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().nullable().optional(),
});

const updateBrandSchema = z.object({
  id: z.string().uuid("Brand ID must be a valid UUID"),
  name: z.string().min(1, "Brand name is required").optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const brandsRouter = router({
  // Get all brands
  getBrands: publicProcedure.query(async ({ ctx }) => {
    const { data: brands, error } = await ctx.supabaseAdmin
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch brands: ${error.message}`);
    }

    return brands || [];
  }),

  // Create a new brand
  createBrand: publicProcedure
    .input(createBrandSchema)
    .mutation(async ({ input, ctx }) => {
      const { data: brandData, error: brandError } = await ctx.supabaseAdmin
        .from("brands")
        .insert({
          name: input.name,
          description: input.description || null,
        })
        .select()
        .single();

      if (brandError) {
        throw new Error(`Failed to create brand: ${brandError.message}`);
      }

      return {
        success: true,
        brand: brandData,
      };
    }),

  // Update an existing brand
  updateBrand: publicProcedure
    .input(updateBrandSchema)
    .mutation(async ({ input, ctx }) => {
      // Prepare update data (only include defined fields)
      const updateData: Record<string, any> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.is_active !== undefined) updateData.is_active = input.is_active;

      const { data: brandData, error: brandError } = await ctx.supabaseAdmin
        .from("brands")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (brandError) {
        throw new Error(`Failed to update brand: ${brandError.message}`);
      }

      if (!brandData) {
        throw new Error("Brand not found");
      }

      return {
        success: true,
        brand: brandData,
      };
    }),

  // Delete a brand
  deleteBrand: publicProcedure
    .input(z.object({ id: z.string().uuid("Brand ID must be a valid UUID") }))
    .mutation(async ({ input, ctx }) => {
      // Check if brand is used by any products
      const { data: products, error: checkError } = await ctx.supabaseAdmin
        .from("products")
        .select("id")
        .eq("brand_id", input.id)
        .limit(1);

      if (checkError) {
        throw new Error(`Failed to check brand usage: ${checkError.message}`);
      }

      if (products && products.length > 0) {
        throw new Error(
          "Cannot delete brand that is being used by products. Please update or delete those products first.",
        );
      }

      // Delete the brand
      const { data: brandData, error: brandError } = await ctx.supabaseAdmin
        .from("brands")
        .delete()
        .eq("id", input.id)
        .select()
        .single();

      if (brandError) {
        throw new Error(`Failed to delete brand: ${brandError.message}`);
      }

      if (!brandData) {
        throw new Error("Brand not found");
      }

      return {
        success: true,
        brand: brandData,
      };
    }),
});

export type BrandsRouter = typeof brandsRouter;
