import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// Product schemas for validation
const productTypeEnum = z.enum([
  "VGA",
  "MiniPC",
  "SSD",
  "RAM",
  "Mainboard",
  "Other",
]);
const productBrandEnum = z.enum(["ZOTAC", "SSTC", "Other"]);

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  brand: productBrandEnum.nullable().optional(),
  model: z.string().nullable().optional(),
  type: productTypeEnum,
  primary_image: z.string().nullable().optional(),
});

const updateProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Product name is required").optional(),
  sku: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  brand: productBrandEnum.nullable().optional(),
  model: z.string().nullable().optional(),
  type: productTypeEnum.optional(),
  primary_image: z.string().nullable().optional(),
});

export const productsRouter = router({
  createProduct: publicProcedure
    .input(createProductSchema)
    .mutation(async ({ input, ctx }) => {
      const { data: productData, error: productError } = await ctx.supabaseAdmin
        .from("products")
        .insert({
          name: input.name,
          sku: input.sku || null,
          short_description: input.short_description || null,
          brand: input.brand || null,
          model: input.model || null,
          type: input.type,
          primary_image: input.primary_image || null,
        })
        .select()
        .single();

      if (productError) {
        throw new Error(`Failed to create product: ${productError.message}`);
      }

      return {
        success: true,
        product: productData,
      };
    }),

  updateProduct: publicProcedure
    .input(updateProductSchema)
    .mutation(async ({ input, ctx }) => {
      // Prepare update data (only include defined fields)
      const updateData: Record<string, any> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.sku !== undefined) updateData.sku = input.sku;
      if (input.short_description !== undefined)
        updateData.short_description = input.short_description;
      if (input.brand !== undefined) updateData.brand = input.brand;
      if (input.model !== undefined) updateData.model = input.model;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.primary_image !== undefined)
        updateData.primary_image = input.primary_image;

      const { data: productData, error: productError } = await ctx.supabaseAdmin
        .from("products")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (productError) {
        throw new Error(`Failed to update product: ${productError.message}`);
      }

      if (!productData) {
        throw new Error("Product not found");
      }

      return {
        success: true,
        product: productData,
      };
    }),
});

export type ProductsRouter = typeof productsRouter;
