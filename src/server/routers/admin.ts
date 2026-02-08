import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

// Input validation schema
const setupInputSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const adminRouter = router({
  setup: publicProcedure
    .input(setupInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { password } = input;
      const { supabaseAdmin } = ctx;

      try {
        // Validate required environment variables
        const setupPassword = process.env.SETUP_PASSWORD;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminName = process.env.ADMIN_NAME;

        if (!setupPassword || !adminEmail || !adminPassword || !adminName) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Missing required environment variables for setup. Please check SETUP_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME.",
          });
        }

        // Check if the provided password matches the setup password
        if (password !== setupPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid setup password",
          });
        }

        // Check if admin user already exists in auth.users table
        const { data: existingAuthUser, error: authUserError } =
          await supabaseAdmin.auth.admin.listUsers();

        if (authUserError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to check existing users: ${authUserError.message}`,
          });
        }

        const existingAuthUserRecord = existingAuthUser.users.find(
          (user) => user.email === adminEmail,
        );

        // Check if admin user already exists in profiles table
        let existingProfile = null;
        let profilesTableExists = true;

        try {
          const { data: profileData } = await supabaseAdmin
            .from("profiles")
            .select("user_id, email, role, full_name")
            .eq("email", adminEmail)
            .single();

          existingProfile = profileData;
        } catch (profileCheckError: any) {
          if (profileCheckError.code === "42P01") {
            profilesTableExists = false;
          } else if (profileCheckError.code !== "PGRST116") {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Error checking existing profile: ${profileCheckError.message}`,
            });
          }
        }

        // Scenario 1: Both auth user and profile exist - Reset password
        if (existingAuthUserRecord && existingProfile) {
          const { error: updateError } =
            await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUserRecord.id,
              { password: adminPassword },
            );

          if (updateError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to reset admin password: ${updateError.message}`,
            });
          }

          return {
            message:
              "Setup already completed. Admin password has been reset to the configured value.",
            action: "password_reset",
          };
        }

        // Scenario 2: Auth user exists but no profile - Create profile
        if (existingAuthUserRecord && !existingProfile && profilesTableExists) {
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .insert([
              {
                user_id: existingAuthUserRecord.id,
                full_name: adminName,
                email: adminEmail,
                role: "admin",
                is_active: true,
              },
            ]);

          if (profileError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to create admin profile: ${profileError.message}`,
            });
          }

          // Also reset password to ensure it matches
          await supabaseAdmin.auth.admin.updateUserById(
            existingAuthUserRecord.id,
            { password: adminPassword },
          );

          return {
            message:
              "Setup repaired. Missing admin profile has been created and password synchronized.",
            action: "profile_created",
          };
        }

        // Scenario 3: Profile exists but no auth user - Delete orphaned profile
        if (!existingAuthUserRecord && existingProfile) {
          const { error: deleteError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("email", adminEmail);

          if (deleteError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to clean up orphaned profile: ${deleteError.message}`,
            });
          }
        }

        // Scenario 4: Neither exists OR profile was orphaned - Create from scratch
        const { data: signUpData, error: signUpError } =
          await supabaseAdmin.auth.signUp({
            email: adminEmail,
            password: adminPassword,
          });

        if (signUpError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to sign up admin user: ${signUpError.message}`,
          });
        }

        const userId = signUpData.user?.id;

        if (!userId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get user ID after sign up",
          });
        }

        // Add the user to the profiles table with admin role
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert([
            {
              user_id: userId,
              full_name: adminName,
              email: adminEmail,
              role: "admin",
              is_active: true,
            },
          ]);

        if (profileError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create admin profile: ${profileError.message}`,
          });
        }

        return {
          message: "Setup completed successfully. Admin account created.",
          action: "created",
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `An error occurred during setup: ${error.message}`,
        });
      }
    }),

});
