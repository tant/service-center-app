import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  requireAnyAuthenticated,
  requireManagerOrAbove,
} from "../middleware/requireRole";

// Product schemas for validation
const productTypeEnum = z.enum([
  "VGA",
  "MiniPC",
  "SSD",
  "RAM",
  "Mainboard",
  "Other",
]);

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  brand_id: z
    .string()
    .uuid("Brand ID must be a valid UUID")
    .nullable()
    .optional(),
  model: z.string().nullable().optional(),
  type: productTypeEnum,
  primary_image: z.string().nullable().optional(),
  part_ids: z.array(z.string().uuid()).optional().default([]),
});

const updateProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Product name is required").optional(),
  sku: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  brand_id: z
    .string()
    .uuid("Brand ID must be a valid UUID")
    .nullable()
    .optional(),
  model: z.string().nullable().optional(),
  type: productTypeEnum.optional(),
  primary_image: z.string().nullable().optional(),
  part_ids: z.array(z.string().uuid()).optional(),
});

export const productsRouter = router({
  // Get new products count and growth rate for the current month
  getNewProducts: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get current month's new products
    const { data: currentMonthData, error: currentError } =
      await ctx.supabaseAdmin
        .from("products")
        .select("count", { count: "exact" })
        .gte("created_at", startOfMonth.toISOString())
        .lt("created_at", now.toISOString());

    // Get previous month's new products
    const { data: prevMonthData, error: prevError } = await ctx.supabaseAdmin
      .from("products")
      .select("count", { count: "exact" })
      .gte("created_at", startOfPrevMonth.toISOString())
      .lt("created_at", startOfMonth.toISOString());

    if (currentError || prevError) {
      throw new Error(currentError?.message || prevError?.message);
    }

    const currentCount = currentMonthData?.[0]?.count || 0;
    const prevCount = prevMonthData?.[0]?.count || 0;
    const growthRate =
      prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : 0;

    return {
      currentMonthCount: currentCount,
      previousMonthCount: prevCount,
      growthRate,
      hasPreviousData: prevCount > 0,
      latestUpdate: now.toISOString(),
    };
  }),
  createProduct: publicProcedure
    .use(requireManagerOrAbove)
    .input(createProductSchema)
    .mutation(async ({ input, ctx }) => {
      // First, create the product
      const { data: productData, error: productError } = await ctx.supabaseAdmin
        .from("products")
        .insert({
          name: input.name,
          sku: input.sku || null,
          short_description: input.short_description || null,
          brand_id: input.brand_id || null,
          model: input.model || null,
          type: input.type,
          primary_image: input.primary_image || null,
        })
        .select()
        .single();

      if (productError) {
        throw new Error(`Failed to create product: ${productError.message}`);
      }

      // Then, create the product-part relationships if any parts are selected
      if (input.part_ids && input.part_ids.length > 0) {
        const productPartInserts = input.part_ids.map((partId) => ({
          product_id: productData.id,
          part_id: partId,
        }));

        const { error: relationError } = await ctx.supabaseAdmin
          .from("product_parts")
          .insert(productPartInserts);

        if (relationError) {
          // If relationship creation fails, we should cleanup the product
          await ctx.supabaseAdmin
            .from("products")
            .delete()
            .eq("id", productData.id);
          throw new Error(
            `Failed to create product-part relationships: ${relationError.message}`,
          );
        }
      }

      return {
        success: true,
        product: productData,
      };
    }),

  updateProduct: publicProcedure
    .use(requireManagerOrAbove)
    .input(updateProductSchema)
    .mutation(async ({ input, ctx }) => {
      // Prepare update data (only include defined fields)
      const updateData: Record<string, any> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.sku !== undefined) updateData.sku = input.sku;
      if (input.short_description !== undefined)
        updateData.short_description = input.short_description;
      if (input.brand_id !== undefined) updateData.brand_id = input.brand_id;
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

      // Update product-part relationships if part_ids is provided
      if (input.part_ids !== undefined) {
        // First, delete existing relationships
        const { error: deleteError } = await ctx.supabaseAdmin
          .from("product_parts")
          .delete()
          .eq("product_id", input.id);

        if (deleteError) {
          throw new Error(
            `Failed to update part relationships: ${deleteError.message}`,
          );
        }

        // Then, create new relationships if any parts are selected
        if (input.part_ids.length > 0) {
          const productPartInserts = input.part_ids.map((partId) => ({
            product_id: input.id,
            part_id: partId,
          }));

          const { error: insertError } = await ctx.supabaseAdmin
            .from("product_parts")
            .insert(productPartInserts);

          if (insertError) {
            throw new Error(
              `Failed to create new part relationships: ${insertError.message}`,
            );
          }
        }
      }

      return {
        success: true,
        product: productData,
      };
    }),

  getProduct: publicProcedure
    .use(requireAnyAuthenticated)
    .input(z.object({ id: z.string().uuid("Product ID must be a valid UUID") }))
    .query(async ({ input, ctx }) => {
      // Get product details
      const { data: product, error: productError } = await ctx.supabaseAdmin
        .from("products")
        .select(`
          *,
          brands:brand_id (
            id,
            name
          )
        `)
        .eq("id", input.id)
        .single();

      if (productError) {
        throw new Error(`Failed to fetch product: ${productError.message}`);
      }

      if (!product) {
        throw new Error("Product not found");
      }

      // Get related parts
      const { data: productParts, error: partsError } = await ctx.supabaseAdmin
        .from("product_parts")
        .select(`
          part_id,
          parts (
            id,
            name,
            part_number,
            sku,
            price,
            cost_price,
            stock_quantity,
            description
          )
        `)
        .eq("product_id", input.id);

      if (partsError) {
        throw new Error(`Failed to fetch product parts: ${partsError.message}`);
      }

      const parts = productParts?.map((pp) => pp.parts).filter(Boolean) || [];

      return {
        ...product,
        parts,
      };
    }),

  getProducts: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
    const { data: products, error } = await ctx.supabaseAdmin
      .from("products")
      .select(`
        *,
        brands:brand_id (
          id,
          name
        )
      `)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return products || [];
  }),
});

export type ProductsRouter = typeof productsRouter;
