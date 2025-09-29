import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

const updateProfileInputSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  avatar_url: z.string().url("Invalid URL").optional().nullable(),
});

export const profileRouter = router({
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    console.log("🔍 [PROFILE] Getting current user profile...");

    const { supabaseClient } = ctx;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();

      if (authError) {
        console.error("❌ [PROFILE] Auth error:", authError);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Failed to get authenticated user",
        });
      }

      if (!user) {
        console.error("❌ [PROFILE] No authenticated user found");
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No authenticated user",
        });
      }

      console.log("✅ [PROFILE] Authenticated user found:", user.id);

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("❌ [PROFILE] Profile fetch error:", profileError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch user profile: ${profileError.message}`,
        });
      }

      if (!profile) {
        console.error("❌ [PROFILE] No profile found for user:", user.id);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User profile not found",
        });
      }

      console.log(
        "✅ [PROFILE] Profile fetched successfully for user:",
        user.id,
      );

      return {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        roles: profile.roles,
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
    } catch (error: any) {
      console.error("❌ [PROFILE] Unexpected error in getCurrentUser:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `An error occurred while fetching user profile: ${error.message}`,
      });
    }
  }),

  updateProfile: publicProcedure
    .input(updateProfileInputSchema)
    .mutation(async ({ input, ctx }) => {
      console.log("🔧 [PROFILE] Updating user profile...");
      console.log(
        "📥 [PROFILE] Input received:",
        JSON.stringify(input, null, 2),
      );

      const { supabaseClient } = ctx;

      try {
        const {
          data: { user },
          error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError) {
          console.error("❌ [PROFILE] Auth error:", authError);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Failed to get authenticated user",
          });
        }

        if (!user) {
          console.error("❌ [PROFILE] No authenticated user found");
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "No authenticated user",
          });
        }

        console.log("✅ [PROFILE] Authenticated user found:", user.id);

        const updateData = {
          full_name: input.full_name,
          email: input.email,
          avatar_url: input.avatar_url,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        };

        console.log("📊 [PROFILE] Update data:", updateData);

        const { data: updatedProfile, error: updateError } =
          await supabaseClient
            .from("profiles")
            .update(updateData)
            .eq("user_id", user.id)
            .select()
            .single();

        if (updateError) {
          console.error("❌ [PROFILE] Profile update error:", updateError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update user profile: ${updateError.message}`,
          });
        }

        if (!updatedProfile) {
          console.error("❌ [PROFILE] No profile returned after update");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Profile update completed but no data returned",
          });
        }

        console.log(
          "✅ [PROFILE] Profile updated successfully for user:",
          user.id,
        );

        return {
          id: updatedProfile.id,
          user_id: updatedProfile.user_id,
          full_name: updatedProfile.full_name,
          email: updatedProfile.email,
          avatar_url: updatedProfile.avatar_url,
          roles: updatedProfile.roles,
          is_active: updatedProfile.is_active,
          created_at: updatedProfile.created_at,
          updated_at: updatedProfile.updated_at,
        };
      } catch (error: any) {
        console.error("❌ [PROFILE] Unexpected error in updateProfile:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `An error occurred while updating user profile: ${error.message}`,
        });
      }
    }),
});
