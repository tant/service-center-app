import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const resetPasswordSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  new_password: z.string().min(6, "Password must be at least 6 characters"),
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
    const validatedData = resetPasswordSchema.parse(body);

    // Role-based permission check
    const currentUser = await getCurrentUserRole();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    // Only Admin and Manager can reset passwords
    if (!["admin", "manager"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Không có quyền đặt lại mật khẩu." },
        { status: 403 },
      );
    }

    // Get target user's profile
    const { data: targetProfile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("role, full_name")
      .eq("user_id", validatedData.user_id)
      .single();

    if (fetchError || !targetProfile) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng." },
        { status: 404 },
      );
    }

    // Permission validation based on roles
    const canResetPassword = (
      actorRole: string,
      targetRole: string,
    ): boolean => {
      if (actorRole === "admin") {
        // Admin can reset passwords for Manager, Technician, and Reception
        return ["manager", "technician", "reception"].includes(targetRole);
      }

      if (actorRole === "manager") {
        // Manager can only reset passwords for Technician and Reception
        return ["technician", "reception"].includes(targetRole);
      }

      return false;
    };

    if (!canResetPassword(currentUser.role, targetProfile.role)) {
      const errorMessage =
        currentUser.role === "manager"
          ? "Quản lý chỉ có thể đặt lại mật khẩu cho Kỹ thuật viên và Lễ tân."
          : "Không có quyền đặt lại mật khẩu cho người dùng này.";

      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }

    // Reset password using Supabase Admin
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      validatedData.user_id,
      { password: validatedData.new_password },
    );

    if (resetError) {
      console.error("Password reset error:", resetError);
      return NextResponse.json(
        { error: `Không thể đặt lại mật khẩu: ${resetError.message}` },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Đặt lại mật khẩu thành công",
        user: {
          user_id: validatedData.user_id,
          full_name: targetProfile.full_name,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error resetting password:", error);

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
