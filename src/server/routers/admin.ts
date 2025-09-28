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
        const supabaseAnonKey =
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

        // Check if admin user already exists in profiles table
        console.log("🔍 DATABASE: Checking for existing admin profile...");
        try {
          const { data: existingProfile, error: profileFetchError } =
            await supabaseAdmin
              .from("profiles")
              .select("user_id")
              .eq("email", adminEmail)
              .single();

          console.log("📊 DATABASE: Profile check result:", {
            data: existingProfile,
            error: profileFetchError,
          });

          if (existingProfile) {
            console.log(
              "❌ DATABASE: Admin user already exists with user_id:",
              existingProfile.user_id,
            );
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Admin user already exists",
            });
          }

          console.log(
            "✅ DATABASE: No existing admin profile found, proceeding with setup",
          );
        } catch (profileCheckError: any) {
          console.log(
            "🔍 DATABASE: Profile check threw error:",
            profileCheckError,
          );
          console.log("🔍 DATABASE: Error code:", profileCheckError.code);
          console.log("🔍 DATABASE: Error message:", profileCheckError.message);

          // If the profiles table doesn't exist yet, we can continue with setup
          if (profileCheckError.code !== "42P01") {
            // 42P01 is "UndefinedTable"
            console.error(
              "❌ DATABASE: Profile check failed with unexpected error:",
              profileCheckError,
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Error checking existing profile: ${profileCheckError.message}`,
            });
          }

          console.log(
            "⚠️ DATABASE: Profiles table may not exist (42P01), continuing with setup",
          );
        }

        // Sign up the admin user
        console.log("👤 AUTH: Creating admin user account...");
        console.log("📧 AUTH: Email:", adminEmail);
        console.log("🔐 AUTH: Password length:", adminPassword.length);

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
          roles: ["admin"], // Admin role
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
        console.log("⏱️ MUTATION: Total duration:", mutationDuration + "ms");

        return {
          message: "Setup completed successfully",
        };
      } catch (error: any) {
        const mutationDuration = Date.now() - mutationStartTime;
        console.error(
          "❌ MUTATION: Setup failed after",
          mutationDuration + "ms",
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
