import { z } from "zod";
import {
  requireAdmin,
  requireAnyAuthenticated,
  requireManagerOrAbove,
} from "../middleware/requireRole";
import { publicProcedure, router } from "../trpc";

// Part schemas for validation
const createPartSchema = z.object({
  name: z.string().min(1, "Part name is required"),
  part_number: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  cost_price: z.number().min(0, "Cost price must be non-negative"),
  stock_quantity: z
    .number()
    .int()
    .min(0, "Stock quantity must be non-negative"),
  image_url: z.string().nullable().optional(),
  product_ids: z.array(z.string().uuid()).optional().default([]),
});

const updatePartSchema = z.object({
  id: z.string().uuid("Part ID must be a valid UUID"),
  name: z.string().min(1, "Part name is required").optional(),
  part_number: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0, "Price must be non-negative").optional(),
  cost_price: z.number().min(0, "Cost price must be non-negative").optional(),
  stock_quantity: z
    .number()
    .int()
    .min(0, "Stock quantity must be non-negative")
    .optional(),
  image_url: z.string().nullable().optional(),
  product_ids: z.array(z.string().uuid()).optional(),
});

export const partsRouter = router({
  // Get new parts count and growth rate for the current month
  getNewParts: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPrevMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      // Get current month's new parts
      const { data: currentMonthData, error: currentError } =
        await ctx.supabaseAdmin
          .from("parts")
          .select("count", { count: "exact" })
          .gte("created_at", startOfMonth.toISOString())
          .lt("created_at", now.toISOString());

      // Get previous month's new parts
      const { data: prevMonthData, error: prevError } = await ctx.supabaseAdmin
        .from("parts")
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
  createPart: publicProcedure
    .use(requireManagerOrAbove)
    .input(createPartSchema)
    .mutation(async ({ input, ctx }) => {
      // First, create the part
      const { data: partData, error: partError } = await ctx.supabaseAdmin
        .from("parts")
        .insert({
          name: input.name,
          part_number: input.part_number || null,
          sku: input.sku || null,
          description: input.description || null,
          price: input.price,
          cost_price: input.cost_price,
          stock_quantity: input.stock_quantity,
          image_url: input.image_url || null,
        })
        .select()
        .single();

      if (partError) {
        throw new Error(`Failed to create part: ${partError.message}`);
      }

      // Then, create the product-part relationships if any products are selected
      if (input.product_ids && input.product_ids.length > 0) {
        const productPartInserts = input.product_ids.map((productId) => ({
          product_id: productId,
          part_id: partData.id,
        }));

        const { error: relationError } = await ctx.supabaseAdmin
          .from("product_parts")
          .insert(productPartInserts);

        if (relationError) {
          // If relationship creation fails, we should cleanup the part
          await ctx.supabaseAdmin.from("parts").delete().eq("id", partData.id);
          throw new Error(
            `Failed to create product-part relationships: ${relationError.message}`,
          );
        }
      }

      return {
        success: true,
        part: partData,
      };
    }),

  updatePart: publicProcedure
    .use(requireManagerOrAbove)
    .input(updatePartSchema)
    .mutation(async ({ input, ctx }) => {
      // Prepare update data (only include defined fields)
      const updateData: Record<string, any> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.part_number !== undefined)
        updateData.part_number = input.part_number;
      if (input.sku !== undefined) updateData.sku = input.sku;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.price !== undefined) updateData.price = input.price;
      if (input.cost_price !== undefined)
        updateData.cost_price = input.cost_price;
      if (input.stock_quantity !== undefined)
        updateData.stock_quantity = input.stock_quantity;
      if (input.image_url !== undefined) updateData.image_url = input.image_url;

      const { data: partData, error: partError } = await ctx.supabaseAdmin
        .from("parts")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (partError) {
        throw new Error(`Failed to update part: ${partError.message}`);
      }

      if (!partData) {
        throw new Error("Part not found");
      }

      // Update product-part relationships if product_ids is provided
      if (input.product_ids !== undefined) {
        // First, delete existing relationships
        const { error: deleteError } = await ctx.supabaseAdmin
          .from("product_parts")
          .delete()
          .eq("part_id", input.id);

        if (deleteError) {
          throw new Error(
            `Failed to update product relationships: ${deleteError.message}`,
          );
        }

        // Then, create new relationships if any products are selected
        if (input.product_ids.length > 0) {
          const productPartInserts = input.product_ids.map((productId) => ({
            product_id: productId,
            part_id: input.id,
          }));

          const { error: insertError } = await ctx.supabaseAdmin
            .from("product_parts")
            .insert(productPartInserts);

          if (insertError) {
            throw new Error(
              `Failed to create new product relationships: ${insertError.message}`,
            );
          }
        }
      }

      return {
        success: true,
        part: partData,
      };
    }),

  getParts: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
      const { data: parts, error } = await ctx.supabaseAdmin
        .from("parts")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch parts: ${error.message}`);
      }

      return parts || [];
    }),

  deletePart: publicProcedure
    .use(requireAdmin)
    .input(z.object({ id: z.string().uuid("Part ID must be a valid UUID") }))
    .mutation(async ({ input, ctx }) => {
      // First, delete any product-part relationships
      const { error: relationError } = await ctx.supabaseAdmin
        .from("product_parts")
        .delete()
        .eq("part_id", input.id);

      if (relationError) {
        throw new Error(
          `Failed to delete part relationships: ${relationError.message}`,
        );
      }

      // Then, delete the part itself
      const { data: partData, error: partError } = await ctx.supabaseAdmin
        .from("parts")
        .delete()
        .eq("id", input.id)
        .select()
        .single();

      if (partError) {
        throw new Error(`Failed to delete part: ${partError.message}`);
      }

      if (!partData) {
        throw new Error("Part not found");
      }

      return {
        success: true,
        part: partData,
      };
    }),

  getProducts: publicProcedure
    .use(requireAnyAuthenticated)
    .query(async ({ ctx }) => {
      const { data: products, error } = await ctx.supabaseAdmin
        .from("products")
        .select(`
        id,
        name,
        type,
        short_description,
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

export type PartsRouter = typeof partsRouter;
