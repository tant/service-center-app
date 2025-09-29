import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/utils/supabase/admin";

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  type: z.enum(["hardware", "software", "accessory"]),
  primary_image: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Create product in products table
    const { data: productData, error: productError } = await supabaseAdmin
      .from("products")
      .insert({
        name: validatedData.name,
        sku: validatedData.sku || null,
        short_description: validatedData.short_description || null,
        brand: validatedData.brand || null,
        model: validatedData.model || null,
        type: validatedData.type,
        primary_image: validatedData.primary_image || null,
        // created_by and updated_by will be handled by RLS policies or triggers
      })
      .select()
      .single();

    if (productError) {
      console.error("Product error:", productError);
      return NextResponse.json(
        { error: `Failed to create product: ${productError.message}` },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: {
          id: productData.id,
          name: productData.name,
          sku: productData.sku,
          short_description: productData.short_description,
          brand: productData.brand,
          model: productData.model,
          type: productData.type,
          primary_image: productData.primary_image,
          created_at: productData.created_at,
          updated_at: productData.updated_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating product:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}