import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/utils/supabase/admin";

const createStaffSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "manager", "technician", "reception"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createStaffSchema.parse(body);

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true, // Skip email confirmation for admin-created users
      });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: `Failed to create user account: ${authError.message}` },
        { status: 400 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 400 },
      );
    }

    // Create profile in profiles table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        full_name: validatedData.full_name,
        email: validatedData.email,
        roles: [validatedData.role],
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);

      // Clean up: delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: `Failed to create user profile: ${profileError.message}` },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Staff member created successfully",
        user: {
          id: profileData.id,
          user_id: profileData.user_id,
          full_name: profileData.full_name,
          email: profileData.email,
          roles: profileData.roles,
          is_active: profileData.is_active,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating staff:", error);

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
