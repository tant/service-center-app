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
      console.log("🔧 [PARTS] Creating new part:", {
        name: input.name,
        product_id: input.product_id,
        price: input.price,
      });

      try {
        // Create part in parts table using admin client (bypasses RLS)
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
            // created_by and updated_by will be handled by database triggers/policies
          })
          .select()
          .single();

        if (partError) {
          console.error("❌ [PARTS] Part creation error:", partError);
          throw new Error(`Failed to create part: ${partError.message}`);
        }

        console.log("✅ [PARTS] Part created successfully:", partData.id);

        return {
          success: true,
          part: partData,
        };
      } catch (error) {
        console.error("❌ [PARTS] Part creation failed:", error);
        throw error;
      }
    }),

  updatePart: publicProcedure
    .input(updatePartSchema)
    .mutation(async ({ input, ctx }) => {
      console.log("📝 [PARTS] Updating part:", {
        id: input.id,
        updates: Object.keys(input).filter(key => key !== 'id' && input[key as keyof typeof input] !== undefined),
      });

      try {
        // Prepare update data (only include defined fields)
        const updateData: Record<string, any> = {};
        if (input.product_id !== undefined) updateData.product_id = input.product_id;
        if (input.name !== undefined) updateData.name = input.name;
        if (input.part_number !== undefined) updateData.part_number = input.part_number;
        if (input.sku !== undefined) updateData.sku = input.sku;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.price !== undefined) updateData.price = input.price;
        if (input.image_url !== undefined) updateData.image_url = input.image_url;

        // Update part in parts table using admin client
        const { data: partData, error: partError } = await ctx.supabaseAdmin
          .from("parts")
          .update(updateData)
          .eq("id", input.id)
          .select()
          .single();

        if (partError) {
          console.error("❌ [PARTS] Part update error:", partError);
          throw new Error(`Failed to update part: ${partError.message}`);
        }

        if (!partData) {
          console.error("❌ [PARTS] Part not found for update:", input.id);
          throw new Error("Part not found");
        }

        console.log("✅ [PARTS] Part updated successfully:", partData.id);

        return {
          success: true,
          part: partData,
        };
      } catch (error) {
        console.error("❌ [PARTS] Part update failed:", error);
        throw error;
      }
    }),

  getProducts: publicProcedure
    .query(async ({ ctx }) => {
      console.log("📋 [PARTS] Fetching products for part creation");

      try {
        const { data: products, error } = await ctx.supabaseAdmin
          .from("products")
          .select("id, name, type, brand")
          .order("name", { ascending: true });

        if (error) {
          console.error("❌ [PARTS] Error fetching products:", error);
          throw new Error(`Failed to fetch products: ${error.message}`);
        }

        console.log("✅ [PARTS] Products fetched successfully:", products?.length || 0);
        return products || [];
      } catch (error) {
        console.error("❌ [PARTS] Products fetch failed:", error);
        throw error;
      }
    }),
});

export type PartsRouter = typeof partsRouter;