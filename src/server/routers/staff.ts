import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { requireManagerOrAbove } from "../middleware/requireRole";
import { publicProcedure, router } from "../trpc";

// =====================================================
// INPUT SCHEMAS
// =====================================================

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

const resetPasswordSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  new_password: z.string().min(6, "Password must be at least 6 characters"),
});

// =====================================================
// ROUTER
// =====================================================

export const staffRouter = router({
  /**
   * List all staff members (profiles)
   */
  list: publicProcedure
    .use(requireManagerOrAbove)
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch team data: ${error.message}`,
        });
      }

      return data || [];
    }),

  /**
   * Create a new staff member (auth user + profile)
   */
  create: publicProcedure
    .use(requireManagerOrAbove)
    .input(createStaffSchema)
    .mutation(async ({ input, ctx }) => {
      const userRole = ctx.userRole;

      // Manager can only create Technician and Reception roles
      if (
        userRole === "manager" &&
        !["technician", "reception"].includes(input.role)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Quản lý chỉ có thể tạo tài khoản Kỹ thuật viên và Lễ tân.",
        });
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } =
        await ctx.supabaseAdmin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
        });

      if (authError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to create user account: ${authError.message}`,
        });
      }

      if (!authData.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create user account",
        });
      }

      // Create profile in profiles table
      const { data: profileData, error: profileError } =
        await ctx.supabaseAdmin
          .from("profiles")
          .insert({
            user_id: authData.user.id,
            full_name: input.full_name,
            email: input.email,
            role: input.role,
            is_active: true,
          })
          .select()
          .single();

      if (profileError) {
        // Clean up: delete the auth user if profile creation failed
        await ctx.supabaseAdmin.auth.admin.deleteUser(authData.user.id);

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to create user profile: ${profileError.message}`,
        });
      }

      return {
        message: "Staff member created successfully",
        user: {
          id: profileData.id,
          user_id: profileData.user_id,
          full_name: profileData.full_name,
          email: profileData.email,
          role: profileData.role,
          is_active: profileData.is_active,
        },
      };
    }),

  /**
   * Update a staff member (profile + optionally auth email)
   */
  update: publicProcedure
    .use(requireManagerOrAbove)
    .input(updateStaffSchema)
    .mutation(async ({ input, ctx }) => {
      const userRole = ctx.userRole;
      const { user_id, ...updateFields } = input;

      // Check if user exists
      const { data: existingProfile, error: fetchError } =
        await ctx.supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("user_id", user_id)
          .single();

      if (fetchError || !existingProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Role change validation for Managers
      if (updateFields.role && userRole === "manager") {
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
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Quản lý chỉ có thể thay đổi vai trò giữa Kỹ thuật viên và Lễ tân.",
          });
        }
      }

      // Prevent deactivating or changing role of last active admin
      if (existingProfile.role === "admin" && existingProfile.is_active) {
        const { data: activeAdmins } = await ctx.supabaseAdmin
          .from("profiles")
          .select("user_id")
          .eq("role", "admin")
          .eq("is_active", true);

        const isLastActiveAdmin = activeAdmins?.length === 1;

        if (isLastActiveAdmin) {
          if (updateFields.is_active === false) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Cannot deactivate the last active admin. Please promote another user to admin first.",
            });
          }

          if (updateFields.role && updateFields.role !== "admin") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Cannot change role of the last active admin. Please promote another user to admin first.",
            });
          }
        }
      }

      // Update profile in database
      const { data: updatedProfile, error: updateError } =
        await ctx.supabaseAdmin
          .from("profiles")
          .update({
            ...updateFields,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user_id)
          .select()
          .single();

      if (updateError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to update profile: ${updateError.message}`,
        });
      }

      // If email is being updated, update it in auth as well
      if (updateFields.email) {
        const { error: authUpdateError } =
          await ctx.supabaseAdmin.auth.admin.updateUserById(user_id, {
            email: updateFields.email,
          });

        if (authUpdateError) {
          // Revert profile update if auth update fails
          await ctx.supabaseAdmin
            .from("profiles")
            .update({ email: existingProfile.email })
            .eq("user_id", user_id);

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Failed to update email: ${authUpdateError.message}`,
          });
        }
      }

      return {
        message: "Staff member updated successfully",
        user: updatedProfile,
      };
    }),

  /**
   * Reset a staff member's password
   */
  resetPassword: publicProcedure
    .use(requireManagerOrAbove)
    .input(resetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const userRole = ctx.userRole;

      // Get target user's profile
      const { data: targetProfile, error: fetchError } =
        await ctx.supabaseAdmin
          .from("profiles")
          .select("role, full_name")
          .eq("user_id", input.user_id)
          .single();

      if (fetchError || !targetProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy người dùng.",
        });
      }

      // Permission validation based on roles
      const canReset = (actorRole: string, targetRole: string): boolean => {
        if (actorRole === "admin") {
          return ["manager", "technician", "reception"].includes(targetRole);
        }
        if (actorRole === "manager") {
          return ["technician", "reception"].includes(targetRole);
        }
        return false;
      };

      if (!canReset(userRole, targetProfile.role)) {
        const errorMessage =
          userRole === "manager"
            ? "Quản lý chỉ có thể đặt lại mật khẩu cho Kỹ thuật viên và Lễ tân."
            : "Không có quyền đặt lại mật khẩu cho người dùng này.";

        throw new TRPCError({
          code: "FORBIDDEN",
          message: errorMessage,
        });
      }

      // Reset password using Supabase Admin
      const { error: resetError } =
        await ctx.supabaseAdmin.auth.admin.updateUserById(input.user_id, {
          password: input.new_password,
        });

      if (resetError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Không thể đặt lại mật khẩu: ${resetError.message}`,
        });
      }

      return {
        message: "Đặt lại mật khẩu thành công",
        user: {
          user_id: input.user_id,
          full_name: targetProfile.full_name,
        },
      };
    }),
});
