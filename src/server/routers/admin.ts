import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { readFileSync } from "fs";
import { join } from "path";

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

      // Step 2: Create Customers
      console.log("\n👤 SEED STEP 2: Creating customers...");
      results.push("👤 Bước 2: Tạo Customers...");

      const customerMap = new Map<string, string>(); // phone -> id mapping

      for (const customer of mockData.customers) {
        try {
          // Check if customer already exists by phone (unique)
          const { data: existingCustomer } = await supabaseAdmin
            .from("customers")
            .select("id, phone")
            .eq("phone", customer.phone)
            .single();

          if (existingCustomer) {
            console.log(`⚠️ SEED: Customer ${customer.phone} already exists, skipping...`);
            results.push(`⚠️ Khách hàng ${customer.fullName} đã tồn tại, bỏ qua`);
            customerMap.set(customer.phone, existingCustomer.id);
            continue;
          }

          const { data: customerData, error: customerError } = await supabaseAdmin
            .from("customers")
            .insert({
              name: customer.fullName,
              phone: customer.phone,
              email: customer.email || null,
              address: customer.address || null,
              notes: customer.notes || null,
            })
            .select("id")
            .single();

          if (customerError) {
            console.error(`❌ SEED: Failed to create customer ${customer.fullName}:`, customerError);
            results.push(`❌ Lỗi tạo khách hàng ${customer.fullName}: ${customerError.message}`);
            continue;
          }

          customerMap.set(customer.phone, customerData.id);
          console.log(`✅ SEED: Created customer ${customer.fullName} (${customer.phone})`);
          results.push(`✅ Tạo khách hàng ${customer.fullName}`);
        } catch (error: any) {
          console.error(`❌ SEED: Error creating customer ${customer.fullName}:`, error);
          results.push(`❌ Lỗi tạo khách hàng ${customer.fullName}: ${error.message}`);
        }
      }

      // Step 3: Query default virtual warehouses (created by seed.sql)
      console.log("\n🗂️ SEED STEP 3: Querying default virtual warehouses...");
      results.push("🗂️ Bước 3: Lấy danh sách kho ảo mặc định...");

      const virtualWarehouseMap = new Map<string, string>(); // name -> id mapping

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

      // Step 4: Create Brands
      console.log("\n🏷️ SEED STEP 4: Creating brands...");
      results.push("🏷️ Bước 4: Tạo Brands...");

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

      // Step 5: Create Products
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
        } catch (error: any) {
          console.error(`❌ SEED: Error creating product ${product.name}:`, error);
          results.push(`❌ Lỗi tạo sản phẩm ${product.name}: ${error.message}`);
        }
      }

      // Step 6: Create Task Library
      console.log("\n📝 SEED STEP 6: Creating task library...");
      results.push("📝 Bước 6: Tạo Task Library...");

      const taskLibraryMap = new Map<string, string>(); // taskName -> id mapping

      for (const task of mockData.taskLibrary.tasks) {
        try {
          // Check if task already exists
          const { data: existingTask } = await supabaseAdmin
            .from("tasks")
            .select("id, name")
            .eq("name", task.name)
            .single();

          if (existingTask) {
            console.log(`⚠️ SEED: Task ${task.name} already exists, skipping...`);
            results.push(`⚠️ Task ${task.name} đã tồn tại, bỏ qua`);
            taskLibraryMap.set(task.name, existingTask.id);
            continue;
          }

          const { data: taskData, error: taskError } = await supabaseAdmin
            .from("tasks")
            .insert({
              name: task.name,
              category: task.category,
              estimated_duration_minutes: task.estimatedMinutes || null,
              description: task.description || null,
            })
            .select("id")
            .single();

          if (taskError) {
            console.error(`❌ SEED: Failed to create task ${task.name}:`, taskError);
            results.push(`❌ Lỗi tạo task ${task.name}: ${taskError.message}`);
            continue;
          }

          taskLibraryMap.set(task.name, taskData.id);
          console.log(`✅ SEED: Created task ${task.name}`);
          results.push(`✅ Tạo task ${task.name}`);
        } catch (error: any) {
          console.error(`❌ SEED: Error creating task ${task.name}:`, error);
          results.push(`❌ Lỗi tạo task ${task.name}: ${error.message}`);
        }
      }

      // Step 7: Create Workflow Templates
      console.log("\n📋 SEED STEP 7: Creating workflow templates...");
      results.push("📋 Bước 7: Tạo Workflow Templates...");

      const workflowMap = new Map<string, string>(); // workflowName -> id mapping

      for (const workflow of mockData.workflows.templates) {
        try {
          // Check if workflow already exists
          const { data: existingWorkflow } = await supabaseAdmin
            .from("workflows")
            .select("id, name")
            .eq("name", workflow.name)
            .single();

          if (existingWorkflow) {
            console.log(`⚠️ SEED: Workflow ${workflow.name} already exists, skipping...`);
            results.push(`⚠️ Workflow ${workflow.name} đã tồn tại, bỏ qua`);
            workflowMap.set(workflow.name, existingWorkflow.id);
            continue;
          }

          const { data: workflowData, error: workflowError } = await supabaseAdmin
            .from("workflows")
            .insert({
              name: workflow.name,
              description: workflow.description || null,
              entity_type: workflow.entityType,
              strict_sequence: workflow.enforceSequence,
              is_active: workflow.isActive,
              created_by_id: adminUserId,
            })
            .select("id")
            .single();

          if (workflowError) {
            console.error(`❌ SEED: Failed to create workflow ${workflow.name}:`, workflowError);
            results.push(`❌ Lỗi tạo workflow ${workflow.name}: ${workflowError.message}`);
            continue;
          }

          workflowMap.set(workflow.name, workflowData.id);
          console.log(`✅ SEED: Created workflow ${workflow.name}`);
          results.push(`✅ Tạo workflow ${workflow.name}`);

          // Create workflow tasks
          for (const task of workflow.tasks) {
            const taskId = taskLibraryMap.get(task.taskName);

            if (!taskId) {
              console.warn(`⚠️ SEED: Task ${task.taskName} not found for workflow ${workflow.name}`);
              continue;
            }

            const { error: workflowTaskError } = await supabaseAdmin
              .from("workflow_tasks")
              .insert({
                workflow_id: workflowData.id,
                task_id: taskId,
                sequence_order: task.sequenceOrder,
                is_required: task.isRequired,
                custom_instructions: task.customInstructions || null,
              });

            if (workflowTaskError) {
              console.error(`❌ SEED: Failed to add task ${task.taskName} to workflow ${workflow.name}:`, workflowTaskError);
            } else {
              console.log(`✅ SEED: Added task ${task.taskName} to workflow ${workflow.name}`);
            }
          }

          results.push(`  ↳ Thêm ${workflow.tasks.length} tasks vào workflow`);
        } catch (error: any) {
          console.error(`❌ SEED: Error creating workflow ${workflow.name}:`, error);
          results.push(`❌ Lỗi tạo workflow ${workflow.name}: ${error.message}`);
        }
      }

      // Step 8: Create Inventory Operations (Aug-Oct 2025)
      console.log("\n📦 SEED STEP 8: Creating inventory operations (receipts, issues, transfers)...");
      results.push("📦 Bước 8: Tạo Inventory Operations...");

      // Get manager profile for approvals
      const { data: managerProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, user_id")
        .eq("email", "manager@sstc.vn")
        .single();

      const managerId = managerProfile?.id || adminUserId;

      if (mockData.inventoryOperations) {
        // Create Stock Receipts
        console.log("\n📥 SEED: Creating stock receipts...");
        for (const receipt of mockData.inventoryOperations.receipts) {
          try {
            // Check if receipt already exists
            const { data: existingReceipt } = await supabaseAdmin
              .from("stock_receipts")
              .select("id, receipt_number")
              .eq("receipt_number", receipt.documentNumber)
              .single();

            if (existingReceipt) {
              console.log(`⚠️ SEED: Receipt ${receipt.documentNumber} already exists, skipping...`);
              results.push(`⚠️ Phiếu nhập ${receipt.documentNumber} đã tồn tại, bỏ qua`);
              continue;
            }

            const vwId = virtualWarehouseMap.get(receipt.toVirtualWarehouseName);
            if (!vwId) {
              console.error(`❌ SEED: Virtual warehouse ${receipt.toVirtualWarehouseName} not found`);
              continue;
            }

            // Create receipt document
            const { data: receiptData, error: receiptError } = await supabaseAdmin
              .from("stock_receipts")
              .insert({
                receipt_number: receipt.documentNumber,
                virtual_warehouse_id: vwId,
                receipt_date: receipt.receiptDate,
                status: receipt.status,
                created_by_id: adminUserId,
                approved_by_id: managerId,
                approved_at: receipt.approvedAt,
                completed_by_id: managerId,
                completed_at: receipt.status === "completed" ? receipt.approvedAt : null,
                notes: receipt.notes,
              })
              .select("id")
              .single();

            if (receiptError) {
              console.error(`❌ SEED: Failed to create receipt ${receipt.documentNumber}:`, receiptError);
              continue;
            }

            console.log(`✅ SEED: Created receipt ${receipt.documentNumber}`);

            // Create receipt items with serials
            for (const item of receipt.items) {
              const productId = productMap.get(item.productSku);
              if (!productId) {
                console.error(`❌ SEED: Product ${item.productSku} not found`);
                continue;
              }

              const { data: itemData, error: itemError } = await supabaseAdmin
                .from("stock_receipt_items")
                .insert({
                  receipt_id: receiptData.id,
                  product_id: productId,
                  declared_quantity: item.quantity,
                  serial_count: 0, // Will be updated after adding serials
                })
                .select("id")
                .single();

              if (itemError) {
                console.error(`❌ SEED: Failed to create receipt item:`, itemError);
                continue;
              }

              // Generate and insert serial numbers for approved or completed receipts
              if (["approved", "completed"].includes(receipt.status)) {
                const serialsToInsert = [];
                const receiptCode = receipt.documentNumber.replace("GRN-", "GRN");

                for (let i = 1; i <= item.quantity; i++) {
                  const serialNumber = `${item.productSku}-${receiptCode}-${String(i).padStart(3, '0')}`;
                  serialsToInsert.push({
                    receipt_item_id: itemData.id,
                    serial_number: serialNumber,
                  });
                }

                // Insert all serials at once
                const { error: serialsError } = await supabaseAdmin
                  .from("stock_receipt_serials")
                  .insert(serialsToInsert);

                if (serialsError) {
                  console.error(`❌ SEED: Failed to create serials for ${item.productSku}:`, serialsError);
                } else {
                  // Update serial_count
                  await supabaseAdmin
                    .from("stock_receipt_items")
                    .update({ serial_count: serialsToInsert.length })
                    .eq("id", itemData.id);

                  console.log(`  → Receipt item created for ${item.productSku} x ${item.quantity} (${serialsToInsert.length} serials added)`);
                }
              } else {
                console.log(`  → Receipt item created for ${item.productSku} x ${item.quantity}`);
              }
            }

            results.push(`✅ Tạo phiếu nhập ${receipt.documentNumber} (${receipt.items.length} items)`);
          } catch (error: any) {
            console.error(`❌ SEED: Error creating receipt:`, error);
            results.push(`❌ Lỗi tạo phiếu nhập: ${error.message}`);
          }
        }

        // Step 8b: Create Physical Products from Receipt Serials (before issues/transfers need them)
        console.log("\n🏷️ SEED: Creating physical products from receipt serials...");
        const { data: receiptSerials, error: serialsError } = await supabaseAdmin
          .from("stock_receipt_serials")
          .select(`
            id,
            serial_number,
            physical_product_id,
            receipt_item_id,
            stock_receipt_items!inner(
              receipt_id,
              product_id,
              stock_receipts!inner(
                virtual_warehouse_id
              )
            )
          `)
          .is("physical_product_id", null);

        if (serialsError) {
          console.error("❌ SEED: Failed to fetch receipt serials:", serialsError);
        } else if (receiptSerials && receiptSerials.length > 0) {
          console.log(`  → Found ${receiptSerials.length} serials to create physical products for...`);

          let createdCount = 0;
          for (const serial of receiptSerials) {
            const receiptItem = serial.stock_receipt_items as any;
            const receipt = receiptItem?.stock_receipts as any;

            if (!receiptItem || !receipt) {
              console.error(`❌ SEED: Missing receipt data for serial ${serial.serial_number}`);
              continue;
            }

            // Create physical product
            const { data: newPhysicalProduct, error: physicalError } = await supabaseAdmin
              .from("physical_products")
              .insert({
                product_id: receiptItem.product_id,
                serial_number: serial.serial_number,
                condition: "new",
                virtual_warehouse_id: receipt.virtual_warehouse_id,
              })
              .select("id")
              .single();

            if (physicalError) {
              console.error(`❌ SEED: Failed to create physical product for ${serial.serial_number}:`, physicalError);
            } else if (newPhysicalProduct) {
              // Link back to receipt serial
              await supabaseAdmin
                .from("stock_receipt_serials")
                .update({ physical_product_id: newPhysicalProduct.id })
                .eq("id", serial.id);

              createdCount++;
            }
          }

          console.log(`  → Created ${createdCount} physical products`);
          results.push(`✅ Tạo ${createdCount} sản phẩm vật lý từ phiếu nhập kho`);
        } else {
          console.log("  → No receipt serials found to create physical products");
        }

        // Create Stock Issues
        console.log("\n📤 SEED: Creating stock issues...");
        for (const issue of mockData.inventoryOperations.issues) {
          try {
            // Check if issue already exists
            const { data: existingIssue } = await supabaseAdmin
              .from("stock_issues")
              .select("id, issue_number")
              .eq("issue_number", issue.documentNumber)
              .single();

            if (existingIssue) {
              console.log(`⚠️ SEED: Issue ${issue.documentNumber} already exists, skipping...`);
              results.push(`⚠️ Phiếu xuất ${issue.documentNumber} đã tồn tại, bỏ qua`);
              continue;
            }

            const vwId = virtualWarehouseMap.get(issue.fromVirtualWarehouseName);
            if (!vwId) {
              console.error(`❌ SEED: Virtual warehouse ${issue.fromVirtualWarehouseName} not found`);
              continue;
            }

            // Create issue document
            const { data: issueData, error: issueError } = await supabaseAdmin
              .from("stock_issues")
              .insert({
                issue_number: issue.documentNumber,
                issue_type: issue.issueType || "normal",
                virtual_warehouse_id: vwId,
                issue_date: issue.issueDate,
                status: issue.status,
                created_by_id: adminUserId,
                approved_by_id: managerId,
                approved_at: issue.approvedAt,
                completed_by_id: managerId,
                completed_at: issue.status === "completed" ? issue.approvedAt : null,
                notes: issue.notes,
              })
              .select("id")
              .single();

            if (issueError) {
              console.error(`❌ SEED: Failed to create issue ${issue.documentNumber}:`, issueError);
              continue;
            }

            console.log(`✅ SEED: Created issue ${issue.documentNumber}`);

            // Create issue items with serials
            for (const item of issue.items) {
              const productId = productMap.get(item.productSku);
              if (!productId) {
                console.error(`❌ SEED: Product ${item.productSku} not found`);
                continue;
              }

              const { data: itemData, error: itemError } = await supabaseAdmin
                .from("stock_issue_items")
                .insert({
                  issue_id: issueData.id,
                  product_id: productId,
                  quantity: item.quantity,
                })
                .select("id")
                .single();

              if (itemError) {
                console.error(`❌ SEED: Failed to create issue item:`, itemError);
                continue;
              }

              // For approved or completed issues, link random physical products from warehouse
              if (["approved", "completed"].includes(issue.status) && itemData) {
                // Get available physical products that are NOT already linked to any serials
                const { data: availableProducts } = await supabaseAdmin
                  .from("physical_products")
                  .select("id, serial_number")
                  .eq("product_id", productId)
                  .eq("virtual_warehouse_id", vwId)
                  .is("current_ticket_id", null) // Not linked to any ticket
                  .not("id", "in", `(SELECT physical_product_id FROM stock_issue_serials WHERE physical_product_id IS NOT NULL)`)
                  .not("id", "in", `(SELECT physical_product_id FROM stock_transfer_serials WHERE physical_product_id IS NOT NULL)`)
                  .limit(item.quantity);

                if (availableProducts && availableProducts.length > 0) {
                  const serialsToInsert = availableProducts.map(pp => ({
                    issue_item_id: itemData.id,
                    physical_product_id: pp.id,
                    serial_number: pp.serial_number,
                  }));

                  const { error: serialsError } = await supabaseAdmin
                    .from("stock_issue_serials")
                    .insert(serialsToInsert);

                  if (!serialsError) {
                    console.log(`  → Issue item created for ${item.productSku} x ${item.quantity} (${serialsToInsert.length} serials linked)`);
                  } else {
                    console.error(`❌ SEED: Failed to link serials for issue item:`, serialsError);
                  }
                } else {
                  console.log(`  → Issue item created for ${item.productSku} x ${item.quantity} (no available serials in warehouse)`);
                }
              }
            }

            results.push(`✅ Tạo phiếu xuất ${issue.documentNumber} (${issue.items.length} items)`);
          } catch (error: any) {
            console.error(`❌ SEED: Error creating issue:`, error);
            results.push(`❌ Lỗi tạo phiếu xuất: ${error.message}`);
          }
        }

        // Create Stock Transfers
        console.log("\n🔄 SEED: Creating stock transfers...");
        for (const transfer of mockData.inventoryOperations.transfers) {
          try {
            // Check if transfer already exists
            const { data: existingTransfer } = await supabaseAdmin
              .from("stock_transfers")
              .select("id, transfer_number")
              .eq("transfer_number", transfer.documentNumber)
              .single();

            if (existingTransfer) {
              console.log(`⚠️ SEED: Transfer ${transfer.documentNumber} already exists, skipping...`);
              results.push(`⚠️ Phiếu chuyển kho ${transfer.documentNumber} đã tồn tại, bỏ qua`);
              continue;
            }

            const fromVwId = virtualWarehouseMap.get(transfer.fromVirtualWarehouseName);
            const toVwId = virtualWarehouseMap.get(transfer.toVirtualWarehouseName);

            if (!fromVwId || !toVwId) {
              console.error(`❌ SEED: Virtual warehouse not found for transfer`);
              continue;
            }

            // Create transfer document
            const { data: transferData, error: transferError } = await supabaseAdmin
              .from("stock_transfers")
              .insert({
                transfer_number: transfer.documentNumber,
                from_virtual_warehouse_id: fromVwId,
                to_virtual_warehouse_id: toVwId,
                transfer_date: transfer.transferDate,
                status: transfer.status,
                created_by_id: adminUserId,
                approved_by_id: managerId,
                approved_at: transfer.approvedAt,
                received_by_id: managerId,
                completed_at: transfer.status === "completed" ? transfer.approvedAt : null,
                notes: transfer.notes,
              })
              .select("id")
              .single();

            if (transferError) {
              console.error(`❌ SEED: Failed to create transfer ${transfer.documentNumber}:`, transferError);
              continue;
            }

            console.log(`✅ SEED: Created transfer ${transfer.documentNumber}`);

            // Create transfer items with serials
            for (const item of transfer.items) {
              const productId = productMap.get(item.productSku);
              if (!productId) {
                console.error(`❌ SEED: Product ${item.productSku} not found`);
                continue;
              }

              const { data: itemData, error: itemError } = await supabaseAdmin
                .from("stock_transfer_items")
                .insert({
                  transfer_id: transferData.id,
                  product_id: productId,
                  quantity: item.quantity,
                })
                .select("id")
                .single();

              if (itemError) {
                console.error(`❌ SEED: Failed to create transfer item:`, itemError);
                continue;
              }

              // For approved or completed transfers, link random physical products from source warehouse
              if (["approved", "completed"].includes(transfer.status) && itemData) {
                // Get available physical products that are NOT already linked to any serials
                const { data: availableProducts } = await supabaseAdmin
                  .from("physical_products")
                  .select("id, serial_number")
                  .eq("product_id", productId)
                  .eq("virtual_warehouse_id", fromVwId)
                  .is("current_ticket_id", null) // Not linked to any ticket
                  .not("id", "in", `(SELECT physical_product_id FROM stock_issue_serials WHERE physical_product_id IS NOT NULL)`)
                  .not("id", "in", `(SELECT physical_product_id FROM stock_transfer_serials WHERE physical_product_id IS NOT NULL)`)
                  .limit(item.quantity);

                if (availableProducts && availableProducts.length > 0) {
                  const serialsToInsert = availableProducts.map(pp => ({
                    transfer_item_id: itemData.id,
                    physical_product_id: pp.id,
                    serial_number: pp.serial_number,
                  }));

                  const { error: serialsError } = await supabaseAdmin
                    .from("stock_transfer_serials")
                    .insert(serialsToInsert);

                  if (!serialsError) {
                    console.log(`  → Transfer item created for ${item.productSku} x ${item.quantity} (${serialsToInsert.length} serials linked)`);
                  } else {
                    console.error(`❌ SEED: Failed to link serials for transfer item:`, serialsError);
                  }
                } else {
                  console.log(`  → Transfer item created for ${item.productSku} x ${item.quantity} (no available serials in source warehouse)`);
                }
              }
            }

            results.push(`✅ Tạo phiếu chuyển kho ${transfer.documentNumber} (${transfer.items.length} items)`);
          } catch (error: any) {
            console.error(`❌ SEED: Error creating transfer:`, error);
            results.push(`❌ Lỗi tạo phiếu chuyển kho: ${error.message}`);
          }
        }
      }

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
