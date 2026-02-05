import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const createStaffSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "manager", "technician", "reception"]),
});

const updateStaffSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  full_name: z.string().min(1, "Full name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["admin", "manager", "technician", "reception"]).optional(),
  is_active: z.boolean().optional(),
  avatar_url: z.string().nullable().optional(),
});

// Helper function to get current user's role
async function getCurrentUserRole(): Promise<{
  role: string;
  userId: string;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return { role: profile.role, userId: user.id };
  } catch (error) {
    console.error("Error getting current user role:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createStaffSchema.parse(body);

    // Role-based permission check
    const currentUser = await getCurrentUserRole();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    // Only Admin and Manager can create users
    if (!["admin", "manager"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Không có quyền tạo tài khoản người dùng." },
        { status: 403 },
      );
    }

    // Manager can only create Technician and Reception roles
    if (
      currentUser.role === "manager" &&
      !["technician", "reception"].includes(validatedData.role)
    ) {
      return NextResponse.json(
        { error: "Quản lý chỉ có thể tạo tài khoản Kỹ thuật viên và Lễ tân." },
        { status: 403 },
      );
    }

    // Create user in Supabase Auth using admin privileges (consistent with setup pattern)
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
        role: validatedData.role,
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
          role: profileData.role,
          is_active: profileData.is_active,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating staff:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", errors: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateStaffSchema.parse(body);

    const { user_id, ...updateFields } = validatedData;

    // Role-based permission check
    const currentUser = await getCurrentUserRole();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    // Only Admin and Manager can update users
    if (!["admin", "manager"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Không có quyền cập nhật tài khoản người dùng." },
        { status: 403 },
      );
    }

    // Check if user exists
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (fetchError || !existingProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role change validation for Managers
    if (updateFields.role && currentUser.role === "manager") {
      const oldRole = existingProfile.role;
      const newRole = updateFields.role;

      // Manager can only change between technician ↔ reception
      const allowedChanges = [
        { from: "technician", to: "reception" },
        { from: "reception", to: "technician" },
      ];

      const isAllowedChange = allowedChanges.some(
        (rule) => rule.from === oldRole && rule.to === newRole,
      );

      if (!isAllowedChange) {
        return NextResponse.json(
          {
            error:
              "Quản lý chỉ có thể thay đổi vai trò giữa Kỹ thuật viên và Lễ tân.",
          },
          { status: 403 },
        );
      }
    }

    // Prevent deactivating or changing role of last active admin
    if (existingProfile.role === "admin" && existingProfile.is_active) {
      const { data: activeAdmins } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("role", "admin")
        .eq("is_active", true);

      const isLastActiveAdmin = activeAdmins?.length === 1;

      if (isLastActiveAdmin) {
        if (updateFields.is_active === false) {
          return NextResponse.json(
            {
              error:
                "Cannot deactivate the last active admin. Please promote another user to admin first.",
            },
            { status: 400 },
          );
        }

        if (updateFields.role && updateFields.role !== "admin") {
          return NextResponse.json(
            {
              error:
                "Cannot change role of the last active admin. Please promote another user to admin first.",
            },
            { status: 400 },
          );
        }
      }
    }

    // Update profile in database
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        ...updateFields,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id)
      .select()
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: `Failed to update profile: ${updateError.message}` },
        { status: 400 },
      );
    }

    // If email is being updated, update it in auth as well
    if (updateFields.email) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
          email: updateFields.email,
        });

      if (authUpdateError) {
        console.error("Auth email update error:", authUpdateError);
        // Revert profile update if auth update fails
        await supabaseAdmin
          .from("profiles")
          .update({ email: existingProfile.email })
          .eq("user_id", user_id);

        return NextResponse.json(
          { error: `Failed to update email: ${authUpdateError.message}` },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        message: "Staff member updated successfully",
        user: updatedProfile,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating staff:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", errors: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
