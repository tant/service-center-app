import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// Part schemas for validation
const createPartSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  name: z.string().min(1, "Part name is required"),
  part_number: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  image_url: z.string().nullable().optional(),
});

const updatePartSchema = z.object({
  id: z.string().uuid("Part ID must be a valid UUID"),
  product_id: z.string().uuid("Product ID must be a valid UUID").optional(),
  name: z.string().min(1, "Part name is required").optional(),
  part_number: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0, "Price must be non-negative").optional(),
  image_url: z.string().nullable().optional(),
});

export const partsRouter = router({
  createPart: publicProcedure
    .input(createPartSchema)
    .mutation(async ({ input, ctx }) => {
      const { data: partData, error: partError } = await ctx.supabaseAdmin
        .from("parts")
        .insert({
          product_id: input.product_id,
          name: input.name,
          part_number: input.part_number || null,
          sku: input.sku || null,
          description: input.description || null,
          price: input.price,
          image_url: input.image_url || null,
        })
        .select()
        .single();

      if (partError) {
        throw new Error(`Failed to create part: ${partError.message}`);
      }

      return {
        success: true,
        part: partData,
      };
    }),

  updatePart: publicProcedure
    .input(updatePartSchema)
    .mutation(async ({ input, ctx }) => {
      // Prepare update data (only include defined fields)
      const updateData: Record<string, any> = {};
      if (input.product_id !== undefined) updateData.product_id = input.product_id;
      if (input.name !== undefined) updateData.name = input.name;
      if (input.part_number !== undefined) updateData.part_number = input.part_number;
      if (input.sku !== undefined) updateData.sku = input.sku;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.price !== undefined) updateData.price = input.price;
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

      return {
        success: true,
        part: partData,
      };
    }),

  getProducts: publicProcedure
    .query(async ({ ctx }) => {
      const { data: products, error } = await ctx.supabaseAdmin
        .from("products")
        .select("id, name, type, brand, short_description")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      return products || [];
    }),
});

export type PartsRouter = typeof partsRouter;