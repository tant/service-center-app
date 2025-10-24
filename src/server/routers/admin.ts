import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

// Input validation schema
const setupInputSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const adminRouter = router({
  simple: publicProcedure.mutation(async () => {
    console.log("✨ Simple mutation called (no input)");
    return { success: true, message: "Hello from tRPC!" };
  }),

  minimal: publicProcedure.input(z.string()).mutation(async ({ input }) => {
    console.log("🔍 Minimal mutation called with string:", input);
    return { success: true, received: input };
  }),

  manual: publicProcedure.mutation(async ({ input }) => {
    console.log("🔧 Manual mutation called with input:", input);
    console.log("🔧 Input type:", typeof input);
    return { success: true, received: input };
  }),

  test: publicProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      console.log("🧪 Test mutation called with:", input);
      return { success: true, echo: input.message };
    }),

  setup: publicProcedure
    .input(setupInputSchema)
    .mutation(async ({ input, ctx }) => {
      const mutationStartTime = Date.now();
      console.log("🔧 MUTATION: Admin setup mutation called");
      console.log(
        "📥 MUTATION: Input received:",
        JSON.stringify(input, null, 2),
      );
      console.log("🏗️ MUTATION: Context available:", !!ctx);
      console.log("🔍 MUTATION: Input type:", typeof input);
      console.log(
        "🔍 MUTATION: Input keys:",
        input ? Object.keys(input) : "No input",
      );

      const { password } = input;
      const { supabaseAdmin } = ctx;

      console.log(
        "🔐 MUTATION: Password received length:",
        password?.length || 0,
      );
      console.log(
        "🗄️ MUTATION: Supabase admin client available:",
        !!supabaseAdmin,
      );

      try {
        console.log("🔍 MUTATION: Validating environment variables...");

        // Validate required environment variables
        const setupPassword = process.env.SETUP_PASSWORD;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminName = process.env.ADMIN_NAME;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        console.log("🔧 MUTATION: Environment variables check:");
        console.log("   - SETUP_PASSWORD:", !!setupPassword);
        console.log(
          "   - ADMIN_EMAIL:",
          !!adminEmail,
          adminEmail ? `(${adminEmail})` : "(missing)",
        );
        console.log(
          "   - ADMIN_PASSWORD:",
          !!adminPassword,
          adminPassword ? `(${adminPassword.length} chars)` : "(missing)",
        );
        console.log("   - ADMIN_PASSWORD raw value:", `"${adminPassword}"`);
        console.log(
          "   - ADMIN_NAME:",
          !!adminName,
          adminName ? `(${adminName})` : "(missing)",
        );
        console.log("   - SUPABASE_URL:", !!supabaseUrl);
        console.log("   - SUPABASE_ANON_KEY:", !!supabaseAnonKey);

        if (
          !setupPassword ||
          !adminEmail ||
          !adminPassword ||
          !adminName ||
          !supabaseUrl ||
          !supabaseAnonKey
        ) {
          console.error("❌ MUTATION: Missing required environment variables");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Missing required environment variables for setup. Please check SETUP_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME.",
          });
        }

        console.log("🔐 MUTATION: Checking password match...");
        console.log("🔐 MUTATION: Provided password length:", password.length);
        console.log(
          "🔐 MUTATION: Expected password length:",
          setupPassword.length,
        );

        // Check if the provided password matches the setup password
        if (password !== setupPassword) {
          console.log("❌ MUTATION: Password mismatch - setup rejected");
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid setup password",
          });
        }

        console.log("✅ MUTATION: Password validated successfully");

        // Check if admin user already exists in auth.users table
        console.log("🔍 AUTH: Checking for existing auth user...");
        const { data: existingAuthUser, error: authUserError } =
          await supabaseAdmin.auth.admin.listUsers();

        console.log("📊 AUTH: User list result:", {
          userCount: existingAuthUser?.users?.length || 0,
          error: authUserError,
        });

        if (authUserError) {
          console.error("❌ AUTH: Failed to list users:", authUserError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to check existing users: ${authUserError.message}`,
          });
        }

        const existingAuthUserRecord = existingAuthUser.users.find(
          (user) => user.email === adminEmail,
        );

        // Check if admin user already exists in profiles table
        console.log("🔍 DATABASE: Checking for existing admin profile...");
        let existingProfile = null;
        let profilesTableExists = true;

        try {
          const { data: profileData, error: profileFetchError } =
            await supabaseAdmin
              .from("profiles")
              .select("user_id, email, role, full_name")
              .eq("email", adminEmail)
              .single();

          console.log("📊 DATABASE: Profile check result:", {
            data: profileData,
            error: profileFetchError,
          });

          existingProfile = profileData;
        } catch (profileCheckError: any) {
          console.log(
            "🔍 DATABASE: Profile check threw error:",
            profileCheckError,
          );
          console.log("🔍 DATABASE: Error code:", profileCheckError.code);

          // Check if profiles table doesn't exist
          if (profileCheckError.code === "42P01") {
            // 42P01 is "UndefinedTable"
            console.log(
              "⚠️ DATABASE: Profiles table does not exist (42P01), will create admin from scratch",
            );
            profilesTableExists = false;
          } else if (profileCheckError.code === "PGRST116") {
            // PGRST116 is "No rows returned" - this is fine, means no profile exists
            console.log("✅ DATABASE: No existing admin profile found");
          } else {
            console.error(
              "❌ DATABASE: Profile check failed with unexpected error:",
              profileCheckError,
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Error checking existing profile: ${profileCheckError.message}`,
            });
          }
        }

        // Determine the setup scenario
        console.log("🔍 SETUP: Analyzing current state...");
        console.log("   - Auth user exists:", !!existingAuthUserRecord);
        console.log("   - Profile exists:", !!existingProfile);
        console.log("   - Profiles table exists:", profilesTableExists);

        // Scenario 1: Both auth user and profile exist - Reset password
        if (existingAuthUserRecord && existingProfile) {
          console.log(
            "🔄 SETUP: Admin fully configured. Resetting password...",
          );
          console.log("   - User ID:", existingAuthUserRecord.id);
          console.log("   - Email:", adminEmail);
          console.log("🔐 RESET: Password length:", adminPassword.length);
          console.log("🔐 RESET: Password (first 3 chars):", adminPassword.substring(0, 3));
          console.log("🔐 RESET: Password (last 3 chars):", adminPassword.substring(adminPassword.length - 3));
          console.log("🔐 RESET: Full password for debug:", adminPassword);

          const { error: updateError } =
            await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUserRecord.id,
              { password: adminPassword },
            );

          if (updateError) {
            console.error("❌ AUTH: Password reset failed:", updateError);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to reset admin password: ${updateError.message}`,
            });
          }

          console.log("✅ SETUP: Admin password reset successfully");
          return {
            message:
              "Setup already completed. Admin password has been reset to the configured value.",
            action: "password_reset",
          };
        }

        // Scenario 2: Auth user exists but no profile - Create profile
        if (existingAuthUserRecord && !existingProfile && profilesTableExists) {
          console.log(
            "🔧 SETUP: Auth user exists but profile missing. Creating profile...",
          );
          console.log("   - User ID:", existingAuthUserRecord.id);

          const profileData = {
            user_id: existingAuthUserRecord.id,
            full_name: adminName,
            email: adminEmail,
            role: "admin",
            is_active: true,
          };

          console.log("📊 DATABASE: Profile data to insert:", profileData);

          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .insert([profileData]);

          if (profileError) {
            console.error(
              "❌ DATABASE: Profile creation failed:",
              profileError,
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to create admin profile: ${profileError.message}`,
            });
          }

          console.log("✅ SETUP: Missing profile created successfully");

          // Also reset password to ensure it matches
          const { error: updateError } =
            await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUserRecord.id,
              { password: adminPassword },
            );

          if (updateError) {
            console.warn("⚠️ AUTH: Password reset failed:", updateError);
          } else {
            console.log("✅ AUTH: Password synchronized");
          }

          return {
            message:
              "Setup repaired. Missing admin profile has been created and password synchronized.",
            action: "profile_created",
          };
        }

        // Scenario 3: Profile exists but no auth user - Delete profile and recreate everything
        if (!existingAuthUserRecord && existingProfile) {
          console.log(
            "🔧 SETUP: Profile exists but auth user missing. Cleaning up orphaned profile...",
          );
          console.log(
            "   - Orphaned profile user_id:",
            existingProfile.user_id,
          );

          const { error: deleteError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("email", adminEmail);

          if (deleteError) {
            console.error(
              "❌ DATABASE: Failed to delete orphaned profile:",
              deleteError,
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to clean up orphaned profile: ${deleteError.message}`,
            });
          }

          console.log(
            "✅ DATABASE: Orphaned profile deleted, will create fresh admin account",
          );
        }

        // Scenario 4: Neither exists OR profile was orphaned - Create everything from scratch
        console.log(
          "🆕 SETUP: Creating admin account from scratch (first-time setup or after cleanup)...",
        );

        // Sign up the admin user
        console.log("👤 AUTH: Creating admin user account...");
        console.log("📧 AUTH: Email:", adminEmail);
        console.log("🔐 AUTH: Password length:", adminPassword.length);
        console.log("🔐 AUTH: Password (first 3 chars):", adminPassword.substring(0, 3));
        console.log("🔐 AUTH: Password (last 3 chars):", adminPassword.substring(adminPassword.length - 3));
        console.log("🔐 AUTH: Full password for debug:", adminPassword);
        console.log("🔐 AUTH: Password type:", typeof adminPassword);
        console.log("🔐 AUTH: Password includes special chars:", /[!@#$%^&*]/.test(adminPassword));

        const { data: signUpData, error: signUpError } =
          await supabaseAdmin.auth.signUp({
            email: adminEmail,
            password: adminPassword,
          });

        console.log("📊 AUTH: Sign up result:", {
          user: signUpData?.user
            ? {
                id: signUpData.user.id,
                email: signUpData.user.email,
                created_at: signUpData.user.created_at,
              }
            : null,
          session: !!signUpData?.session,
          error: signUpError,
        });

        if (signUpError) {
          console.error("❌ AUTH: Sign up failed:", signUpError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to sign up admin user: ${signUpError.message}`,
          });
        }

        const userId = signUpData.user?.id;

        if (!userId) {
          console.error("❌ AUTH: No user ID returned from sign up");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get user ID after sign up",
          });
        }

        console.log("✅ AUTH: User created successfully with ID:", userId);

        // Add the user to the profiles table with admin role
        console.log("👤 DATABASE: Creating admin profile...");
        const profileData = {
          user_id: userId,
          full_name: adminName,
          email: adminEmail,
          role: "admin", // Admin role
          is_active: true,
        };

        console.log("📊 DATABASE: Profile data to insert:", profileData);

        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert([profileData]);

        console.log("📊 DATABASE: Profile insert result:", {
          error: profileError,
        });

        if (profileError) {
          console.error("❌ DATABASE: Profile creation failed:", profileError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create admin profile: ${profileError.message}`,
          });
        }

        console.log("✅ DATABASE: Admin profile created successfully");

        const mutationDuration = Date.now() - mutationStartTime;
        console.log("🏁 MUTATION: Setup completed successfully");
        console.log("⏱️ MUTATION: Total duration:", `${mutationDuration}ms`);

        return {
          message: "Setup completed successfully. Admin account created.",
          action: "created",
        };
      } catch (error: any) {
        const mutationDuration = Date.now() - mutationStartTime;
        console.error(
          "❌ MUTATION: Setup failed after",
          `${mutationDuration}ms`,
        );
        console.error("🔴 MUTATION: Error details:", {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack?.split("\n").slice(0, 3).join("\n"),
        });

        // Re-throw TRPCError instances
        if (error instanceof TRPCError) {
          console.log(
            "🔄 MUTATION: Re-throwing TRPCError with code:",
            error.code,
          );
          throw error;
        }

        console.error("💥 MUTATION: Unexpected error during setup:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `An error occurred during setup: ${error.message}`,
        });
      }
    }),
});
