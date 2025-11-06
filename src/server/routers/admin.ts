import { TRPCError } from "@trpc/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SYSTEM_USER_EMAIL, SYSTEM_USER_ID, SYSTEM_USER_FULL_NAME } from "@/lib/system-user";
import { publicProcedure, router } from "../trpc";

// Input validation schema
const setupInputSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type EnsureSystemUserParams = {
  supabaseAdmin: SupabaseClient;
  existingUsers?: User[];
};

async function ensureSystemUser({
  supabaseAdmin,
  existingUsers = [],
}: EnsureSystemUserParams) {
  console.log("🛡️ SYSTEM: Ensuring system user exists...");

  const matchSystemUser = (user?: User | null) => {
    if (!user) return false;
    const email = user.email?.toLowerCase();
    return (
      user.id === SYSTEM_USER_ID ||
      email === SYSTEM_USER_EMAIL
    );
  };

  const fetchUserById = async () => {
    const { data, error } =
      await supabaseAdmin.auth.admin.getUserById(SYSTEM_USER_ID);

    if (error && error.status !== 404) {
      console.error("❌ SYSTEM: getUserById failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch system user: ${error.message}`,
      });
    }

    return data?.user ?? null;
  };

  let systemUser: User | null = existingUsers.find(matchSystemUser) ?? null;

  if (!systemUser) {
    systemUser = await fetchUserById();
  }

  if (!systemUser) {
    console.log("🆕 SYSTEM: Creating system user...");
    const generatedPassword = randomBytes(24).toString("base64url");
    const createPayload = {
      id: SYSTEM_USER_ID,
      email: SYSTEM_USER_EMAIL,
      email_confirm: true,
      password: generatedPassword,
      user_metadata: { full_name: SYSTEM_USER_FULL_NAME },
      app_metadata: { provider: "system", providers: ["system"] },
    } as any;

    const { data, error } = await supabaseAdmin.auth.admin.createUser(
      createPayload,
    );

    if (error) {
      if (error.message?.toLowerCase().includes("already")) {
        systemUser = await fetchUserById();
      } else {
        console.error("❌ SYSTEM: Failed to create system user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create system user: ${error.message}`,
        });
      }
    } else {
      systemUser = data?.user ?? null;
    }
  }

  if (!systemUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to ensure system user exists.",
    });
  }

  if (systemUser.id !== SYSTEM_USER_ID) {
    console.error("❌ SYSTEM: Unexpected system user ID:", systemUser.id);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "System user exists but has unexpected identifier.",
    });
  }

  const desiredAuth = {
    email: SYSTEM_USER_EMAIL,
    email_confirm: true,
    app_metadata: { provider: "system", providers: ["system"] },
    user_metadata: { full_name: SYSTEM_USER_FULL_NAME },
  };

  const providerList = Array.isArray(systemUser.app_metadata?.providers)
    ? systemUser.app_metadata.providers
    : [];

  const needsAuthUpdate =
    systemUser.email?.toLowerCase() !== SYSTEM_USER_EMAIL ||
    systemUser.app_metadata?.provider !== "system" ||
    !providerList.includes("system") ||
    systemUser.user_metadata?.full_name !== SYSTEM_USER_FULL_NAME;

  if (needsAuthUpdate) {
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(
        SYSTEM_USER_ID,
        desiredAuth,
      );

    if (updateError) {
      console.error(
        "❌ SYSTEM: Failed to update system auth metadata:",
        updateError,
      );
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to update system user metadata: ${updateError.message}`,
      });
    }
  }

  const desiredProfile = {
    user_id: SYSTEM_USER_ID,
    full_name: SYSTEM_USER_FULL_NAME,
    email: SYSTEM_USER_EMAIL,
    role: "manager",
    is_active: true,
  };

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(desiredProfile, { onConflict: "user_id" });

  if (profileError) {
    console.error("❌ SYSTEM: Failed to upsert system profile:", profileError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to upsert system profile: ${profileError.message}`,
    });
  }

  console.log("✅ SYSTEM: System user ensured.");
}

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
          await ensureSystemUser({
            supabaseAdmin,
            existingUsers: existingAuthUser?.users,
          });
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

          await ensureSystemUser({
            supabaseAdmin,
            existingUsers: existingAuthUser?.users,
          });
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

        await ensureSystemUser({
          supabaseAdmin,
          existingUsers: existingAuthUser?.users,
        });

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

  seedMockData: publicProcedure.mutation(async ({ ctx }) => {
    console.log("🌱 SEED: Starting mock data seeding process...");
    const { supabaseAdmin } = ctx;
    const results: string[] = [];

    try {
      // Read mock data file
      const mockDataPath = join(process.cwd(), "docs", "data", "mock-data.json");
      console.log("📂 SEED: Reading mock data from:", mockDataPath);
      const mockDataContent = readFileSync(mockDataPath, "utf-8");
      const mockData = JSON.parse(mockDataContent);
      console.log("✅ SEED: Mock data loaded successfully");
      results.push("✅ Đọc file mock-data.json thành công");

      // Get admin user ID from database for created_by fields
      const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from("profiles")
        .select("id, user_id")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (adminError || !adminProfile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No admin user found in database. Please run /setup first.",
        });
      }

      const adminUserId = adminProfile.id;
      console.log(`✅ SEED: Using admin user ID: ${adminUserId}`);

      // Step 1: Create Staff Users
      console.log("\n👥 SEED STEP 1: Creating staff users...");
      results.push("👥 Bước 1: Tạo Staff Users...");

      for (const staffUser of mockData.staffUsers) {
        try {
          // Check if user already exists in profiles
          const { data: existingProfile } = await supabaseAdmin
            .from("profiles")
            .select("email")
            .eq("email", staffUser.email)
            .single();

          if (existingProfile) {
            console.log(`⚠️ SEED: User ${staffUser.email} already exists, skipping...`);
            results.push(`⚠️ ${staffUser.email} đã tồn tại, bỏ qua`);
            continue;
          }

          // Create auth user
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: staffUser.email,
            password: staffUser.password,
            email_confirm: true,
          });

          if (authError) {
            if (authError.message.includes("already registered")) {
              console.log(`⚠️ SEED: User ${staffUser.email} already registered in auth, skipping...`);
              results.push(`⚠️ ${staffUser.email} đã tồn tại, bỏ qua`);
              continue;
            }
            throw authError;
          }

          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .insert({
              user_id: authData.user.id,
              email: staffUser.email,
              full_name: staffUser.fullName,
              role: staffUser.role,
              is_active: true,
            });

          if (profileError) {
            console.error(`❌ SEED: Failed to create profile for ${staffUser.email}:`, profileError);
            results.push(`❌ Lỗi tạo profile cho ${staffUser.email}`);
          } else {
            console.log(`✅ SEED: Created user ${staffUser.email} with role ${staffUser.role}`);
            results.push(`✅ Tạo ${staffUser.email} (${staffUser.role})`);
          }
        } catch (error: any) {
          console.error(`❌ SEED: Error creating user ${staffUser.email}:`, error);
          results.push(`❌ Lỗi tạo ${staffUser.email}: ${error.message}`);
        }
      }

      // Step 2: Query default virtual warehouses (created by seed.sql)
      console.log("\n🗂️ SEED STEP 2: Querying default virtual warehouses...");
      results.push("🗂️ Bước 2: Lấy danh sách kho ảo mặc định...");

      const virtualWarehouseMap = new Map<string, string>(); // name/type/alias -> id mapping
      const virtualWarehouseAliases: Record<string, string[]> = {
        main: ["Main", "Kho Chính"],
        warranty_stock: ["Warranty Stock", "Kho Bảo Hành"],
        rma_staging: ["RMA Staging", "RMA Staging Area", "Khu Vực RMA"],
        dead_stock: ["Dead Stock", "Kho Hàng Hỏng"],
        in_service: ["In Service", "Đang Sử Dụng"],
        parts: ["Parts", "Kho Linh Kiện"],
        customer_installed: ["Customer Installed", "Hàng Đã Bán"],
      };

      // Query all virtual warehouses created by default system
      const { data: defaultVWs, error: vwQueryError } = await supabaseAdmin
        .from("virtual_warehouses")
        .select("id, name, warehouse_type");

      if (vwQueryError) {
        console.error("❌ SEED: Failed to query virtual warehouses:", vwQueryError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to query virtual warehouses: ${vwQueryError.message}`,
        });
      }

      if (defaultVWs && defaultVWs.length > 0) {
        console.log(`✅ SEED: Found ${defaultVWs.length} default virtual warehouses`);
        for (const vw of defaultVWs) {
          virtualWarehouseMap.set(vw.name, vw.id);
          virtualWarehouseMap.set(vw.warehouse_type, vw.id);

          for (const alias of virtualWarehouseAliases[vw.warehouse_type] ?? []) {
            virtualWarehouseMap.set(alias, vw.id);
          }
          console.log(`  → ${vw.name} (${vw.warehouse_type})`);
        }
        results.push(`✅ Tìm thấy ${defaultVWs.length} kho ảo mặc định`);
      } else {
        console.error("❌ SEED: No virtual warehouses found. Please ensure database has been seeded properly.");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No virtual warehouses found. Please run 'pnpx supabase db reset' first.",
        });
      }

      // Step 3: Create Brands
      console.log("\n🏷️ SEED STEP 3: Creating brands...");
      results.push("🏷️ Bước 3: Tạo Brands...");

      const brandMap = new Map<string, string>(); // name -> id mapping

      for (const brand of mockData.brands) {
        try {
          // Check if brand already exists
          const { data: existingBrand } = await supabaseAdmin
            .from("brands")
            .select("id, name")
            .eq("name", brand.name)
            .single();

          if (existingBrand) {
            console.log(`⚠️ SEED: Brand ${brand.name} already exists, skipping...`);
            results.push(`⚠️ Nhãn hàng ${brand.name} đã tồn tại, bỏ qua`);
            brandMap.set(brand.name, existingBrand.id);
            continue;
          }

          const { data: brandData, error: brandError } = await supabaseAdmin
            .from("brands")
            .insert({
              name: brand.name,
              description: brand.description,
            })
            .select("id")
            .single();

          if (brandError) {
            console.error(`❌ SEED: Failed to create brand ${brand.name}:`, brandError);
            results.push(`❌ Lỗi tạo nhãn hàng ${brand.name}: ${brandError.message}`);
            continue;
          }

          brandMap.set(brand.name, brandData.id);
          console.log(`✅ SEED: Created brand ${brand.name}`);
          results.push(`✅ Tạo nhãn hàng ${brand.name}`);
        } catch (error: any) {
          console.error(`❌ SEED: Error creating brand ${brand.name}:`, error);
          results.push(`❌ Lỗi tạo nhãn hàng ${brand.name}: ${error.message}`);
        }
      }

      // Step 4: Create Parts
      console.log("\n🔧 SEED STEP 4: Creating parts...");
      results.push("🔧 Bước 4: Tạo Parts...");

      const partMap = new Map<string, string>(); // partNumber -> id mapping

      for (const part of mockData.parts) {
        try {
          // Check if part already exists
          const { data: existingPart } = await supabaseAdmin
            .from("parts")
            .select("id, part_number")
            .eq("part_number", part.partNumber)
            .single();

          if (existingPart) {
            console.log(`⚠️ SEED: Part ${part.partNumber} already exists, skipping...`);
            results.push(`⚠️ Linh kiện ${part.name} đã tồn tại, bỏ qua`);
            partMap.set(part.partNumber, existingPart.id);
            continue;
          }

          const { data: partData, error: partError } = await supabaseAdmin
            .from("parts")
            .insert({
              name: part.name,
              part_number: part.partNumber,
              category: part.category,
              price: part.price,
              cost_price: part.costPrice,
              stock_quantity: part.stockQuantity,
              min_stock_level: part.minStockLevel,
              description: part.description || null,
            })
            .select("id")
            .single();

          if (partError) {
            console.error(`❌ SEED: Failed to create part ${part.name}:`, partError);
            results.push(`❌ Lỗi tạo linh kiện ${part.name}: ${partError.message}`);
            continue;
          }

          partMap.set(part.partNumber, partData.id);
          console.log(`✅ SEED: Created part ${part.name}`);
          results.push(`✅ Tạo linh kiện ${part.name}`);
        } catch (error: any) {
          console.error(`❌ SEED: Error creating part ${part.name}:`, error);
          results.push(`❌ Lỗi tạo linh kiện ${part.name}: ${error.message}`);
        }
      }

      // Step 5: Create Products with compatible parts binding
      console.log("\n📦 SEED STEP 5: Creating products...");
      console.log(`📦 SEED: Total products to create: ${mockData.products?.length || 0}`);
      results.push("📦 Bước 5: Tạo Products...");
      results.push(`📦 Tổng số sản phẩm cần tạo: ${mockData.products?.length || 0}`);

      const productMap = new Map<string, string>(); // sku -> id mapping

      for (const product of mockData.products) {
        console.log(`\n🔍 SEED: Processing product: ${product.name}`);
        try {
          // Check if product already exists
          const { data: existingProduct } = await supabaseAdmin
            .from("products")
            .select("id, sku")
            .eq("sku", product.sku)
            .single();

          if (existingProduct) {
            console.log(`⚠️ SEED: Product ${product.sku} already exists, skipping...`);
            results.push(`⚠️ Sản phẩm ${product.name} đã tồn tại, bỏ qua`);
            productMap.set(product.sku, existingProduct.id);
            continue;
          }

          const brandId = brandMap.get(product.brand);

          if (!brandId) {
            console.error(`❌ SEED: Brand ${product.brand} not found for product ${product.name}`);
            results.push(`❌ Không tìm thấy brand ${product.brand} cho ${product.name}`);
            continue;
          }

          console.log(`🔄 SEED: Inserting product: ${product.name}, SKU: ${product.sku}, Brand ID: ${brandId}`);

          const { data: productData, error: productError } = await supabaseAdmin
            .from("products")
            .insert({
              name: product.name,
              type: product.type,
              brand_id: brandId,
              model: product.model,
              sku: product.sku,
              warranty_period_months: product.warrantyMonths,
            })
            .select("id")
            .single();

          console.log(`📊 SEED: Insert result - Data:`, productData, `Error:`, productError);

          if (productError) {
            console.error(`❌ SEED: Failed to create product ${product.name}:`, productError);
            results.push(`❌ Lỗi tạo sản phẩm ${product.name}: ${productError.message}`);
            continue;
          }

          productMap.set(product.sku, productData.id);
          console.log(`✅ SEED: Created product ${product.name}`);
          results.push(`✅ Tạo sản phẩm ${product.name}`);

          // Bind compatible parts to product
          if (product.compatibleParts && product.compatibleParts.length > 0) {
            for (const partNumber of product.compatibleParts) {
              const partId = partMap.get(partNumber);

              if (!partId) {
                console.warn(`⚠️ SEED: Part ${partNumber} not found for product ${product.name}`);
                continue;
              }

              // Check if binding already exists
              const { data: existingBinding } = await supabaseAdmin
                .from("product_parts")
                .select("product_id")
                .eq("product_id", productData.id)
                .eq("part_id", partId)
                .single();

              if (existingBinding) {
                console.log(`⚠️ SEED: Part ${partNumber} already bound to ${product.name}, skipping...`);
                continue;
              }

              const { error: bindError } = await supabaseAdmin
                .from("product_parts")
                .insert({
                  product_id: productData.id,
                  part_id: partId,
                });

              if (bindError) {
                console.error(`❌ SEED: Failed to bind part ${partNumber} to product ${product.name}:`, bindError);
              } else {
                console.log(`✅ SEED: Bound part ${partNumber} to product ${product.name}`);
              }
            }

            results.push(`  ↳ Bind ${product.compatibleParts.length} parts vào ${product.name}`);
          }
        } catch (error: any) {
          console.error(`❌ SEED: Error creating product ${product.name}:`, error);
          results.push(`❌ Lỗi tạo sản phẩm ${product.name}: ${error.message}`);
        }
      }

      // Step 6: Create Physical Products (200 products across 5 default virtual warehouses)
      console.log("\n📋 SEED STEP 6: Creating physical products (200 products via GRN receipts)...");
      results.push("📋 Bước 6: Tạo 200 Physical Products phân bổ vào 5 kho ảo...");

      // Check if any physical products already exist
      const { count: existingPhysicalProductsCount } = await supabaseAdmin
        .from("physical_products")
        .select("*", { count: "exact", head: true });

      if (existingPhysicalProductsCount && existingPhysicalProductsCount > 0) {
        console.log(`⚠️ SEED: Physical products already exist (${existingPhysicalProductsCount} items), skipping GRN creation...`);
        results.push(`⚠️ Đã có ${existingPhysicalProductsCount} sản phẩm vật lý, bỏ qua tạo GRN`);
      } else {
        for (const receipt of mockData.physicalProducts.receipts) {
        try {
          // Get virtual warehouse ID by name
          const virtualWarehouseId =
            virtualWarehouseMap.get(receipt.toVirtualWarehouseName) ??
            (receipt.toVirtualWarehouseType
              ? virtualWarehouseMap.get(receipt.toVirtualWarehouseType)
              : undefined);

          if (!virtualWarehouseId) {
            console.error(
              `❌ SEED: Virtual warehouse ${receipt.toVirtualWarehouseName} (${receipt.toVirtualWarehouseType ?? "unknown type"}) not found`,
            );
            results.push(
              `❌ Không tìm thấy kho ảo ${receipt.toVirtualWarehouseName}`,
            );
            continue;
          }

          // Step 6.1: Create receipt (draft) with historical timestamp
          const { data: receiptData, error: receiptError } = await supabaseAdmin
            .from("stock_receipts")
            .insert({
              receipt_type: receipt.receiptType,
              virtual_warehouse_id: virtualWarehouseId,
              receipt_date: receipt.receiptDate,
              notes: receipt.notes,
              status: "draft",
              created_by_id: adminUserId,
              created_at: receipt.receiptDate, // Use historical date
            })
            .select()
            .single();

          if (receiptError) {
            console.error(`❌ SEED: Failed to create receipt:`, receiptError);
            results.push(`❌ Lỗi tạo phiếu nhập: ${receiptError.message}`);
            continue;
          }

          console.log(`✅ SEED: Created receipt ${receiptData.receipt_number}`);
          results.push(`✅ Tạo phiếu nhập ${receiptData.receipt_number}`);

          // Step 6.2: Create receipt items and add serials
          for (const item of receipt.items) {
            const productId = productMap.get(item.productSku);

            if (!productId) {
              console.warn(`⚠️ SEED: Product ${item.productSku} not found`);
              continue;
            }

            // Create receipt item
            const { data: itemData, error: itemError } = await supabaseAdmin
              .from("stock_receipt_items")
              .insert({
                receipt_id: receiptData.id,
                product_id: productId,
                declared_quantity: item.quantity,
              })
              .select()
              .single();

            if (itemError) {
              console.error(`❌ SEED: Failed to create receipt item:`, itemError);
              continue;
            }

            // Add serials
            const serialsToInsert = item.serials.map((serial: string) => ({
              receipt_item_id: itemData.id,
              serial_number: serial,
              manufacturer_warranty_end_date: item.manufacturerWarrantyEndDate || null,
              user_warranty_end_date: item.userWarrantyEndDate || null,
            }));

            const { error: serialsError } = await supabaseAdmin
              .from("stock_receipt_serials")
              .insert(serialsToInsert);

            if (serialsError) {
              console.error(`❌ SEED: Failed to add serials:`, serialsError);
              results.push(`❌ Lỗi thêm serials cho ${item.productSku}`);
            } else {
              console.log(`✅ SEED: Added ${item.serials.length} serials for ${item.productSku}`);
              results.push(`  ↳ Thêm ${item.serials.length} serials cho ${item.productSku}`);
            }
          }

          // Step 6.3: Submit for approval
          const { error: submitError } = await supabaseAdmin
            .from("stock_receipts")
            .update({ status: "pending_approval" })
            .eq("id", receiptData.id);

          if (submitError) {
            console.error(`❌ SEED: Failed to submit for approval:`, submitError);
            results.push(`❌ Lỗi submit phiếu nhập`);
            continue;
          }

          // Step 6.4: Approve receipt (use receipt_date for historical data)
          const { error: approveError } = await supabaseAdmin
            .from("stock_receipts")
            .update({
              status: "approved",
              approved_by_id: adminUserId,
              approved_at: receipt.receiptDate, // Use historical date for trend chart
            })
            .eq("id", receiptData.id);

          if (approveError) {
            console.error(`❌ SEED: Failed to approve receipt:`, approveError);
            results.push(`❌ Lỗi approve phiếu nhập`);
            continue;
          }

          // Step 6.5: Complete receipt (creates physical_products)
          // Use receipt_date + 1 hour for historical data consistency
          const completedDate = new Date(receipt.receiptDate);
          completedDate.setHours(completedDate.getHours() + 1);

          const { error: completeError } = await supabaseAdmin
            .from("stock_receipts")
            .update({
              status: "completed",
              completed_by_id: adminUserId,
              completed_at: completedDate.toISOString(),
            })
            .eq("id", receiptData.id);

          if (completeError) {
            console.error(`❌ SEED: Failed to complete receipt:`, completeError);
            results.push(`❌ Lỗi complete phiếu nhập: ${completeError.message}`);
            continue;
          }

          console.log(`✅ SEED: Completed receipt ${receiptData.receipt_number} - Physical products created`);
          results.push(`✅ Hoàn tất phiếu nhập ${receiptData.receipt_number} - Tạo sản phẩm vật lý`);
        } catch (error: any) {
          console.error(`❌ SEED: Error creating receipt:`, error);
          results.push(`❌ Lỗi tạo GRN: ${error.message}`);
        }
        }
      }

      // Step 7: Query existing Task Types (no longer created here - already in database)
      console.log("\n📝 SEED STEP 7: Querying existing task types...");
      results.push("📝 Bước 7: Lấy Task Types từ database...");

      const taskTypeMap = new Map<string, string>(); // name -> id mapping

      // Query all existing task types instead of creating them
      const { data: existingTaskTypes, error: taskTypesError } = await supabaseAdmin
        .from("task_types")
        .select("id, name");

      if (taskTypesError) {
        console.error("❌ SEED: Failed to query task types:", taskTypesError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to query task types: ${taskTypesError.message}`,
        });
      }

      for (const taskType of existingTaskTypes || []) {
        taskTypeMap.set(taskType.name, taskType.id);
      }

      console.log(`✅ SEED: Found ${taskTypeMap.size} existing task types`);
      results.push(`✅ Tìm thấy ${taskTypeMap.size} task types`);

      // Step 8: Skip workflows (already seeded in database via migrations)
      console.log("\n📋 SEED STEP 8: Skipping workflows (already exist in database)...");
      results.push("📋 Bước 8: Bỏ qua Workflows (đã tồn tại trong database)...");

      console.log("\n✅ SEED: Mock data seeding completed successfully");
      results.push("✅ Hoàn tất tạo dữ liệu test!");

      return {
        success: true,
        message: "Mock data seeded successfully",
        results,
      };
    } catch (error: any) {
      console.error("❌ SEED: Fatal error during seeding:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to seed mock data: ${error.message}`,
      });
    }
  }),
});
