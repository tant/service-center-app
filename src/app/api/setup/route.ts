import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

interface SetupRequestBody {
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    // Validate required environment variables
    const setupPassword = process.env.SETUP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !setupPassword ||
      !adminEmail ||
      !adminPassword ||
      !adminName ||
      !supabaseUrl ||
      !supabaseAnonKey
    ) {
      return Response.json(
        {
          error:
            "Missing required environment variables for setup. Please check SETUP_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME.",
        },
        { status: 500 },
      );
    }

    // Parse the request body
    const body: SetupRequestBody = await req.json();
    const { password } = body;

    // Check if the provided password matches the setup password
    if (password !== setupPassword) {
      return Response.json(
        { error: "Invalid setup password" },
        { status: 401 },
      );
    }

    // For this approach, we'll first check if the user exists in the profiles table
    // Since we might not be able to use the admin API with just the anon key
    try {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("email", adminEmail)
        .single();

      if (existingProfile) {
        return Response.json(
          { error: "Admin user already exists" },
          { status: 400 },
        );
      }
    } catch (profileCheckError: unknown) {
      // If the profiles table doesn't exist yet, we can continue with setup
      if (
        profileCheckError &&
        typeof profileCheckError === "object" &&
        "code" in profileCheckError &&
        profileCheckError.code !== "42P01"
      ) {
        // 42P01 is "UndefinedTable"
        console.error("Profile check error:", profileCheckError);
        return Response.json(
          {
            error: `Error checking existing profile: ${profileCheckError && typeof profileCheckError === "object" && "message" in profileCheckError ? profileCheckError.message : "Unknown error"}`,
          },
          { status: 500 },
        );
      }
    }

    // For the initial setup, let's first sign up the user normally, then update their profile
    const { data: signUpData, error: signUpError } =
      await supabaseAdmin.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });

    if (signUpError) {
      console.error("Sign up error:", signUpError);
      return Response.json(
        { error: `Failed to sign up admin user: ${signUpError.message}` },
        { status: 500 },
      );
    }

    const userId = signUpData.user?.id;

    if (!userId) {
      return Response.json(
        { error: "Failed to get user ID after sign up" },
        { status: 500 },
      );
    }

    // Now add the user to the profiles table with admin role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          user_id: userId,
          full_name: adminName,
          email: adminEmail,
          role: "admin", // Admin role
          is_active: true,
        },
      ]);

    if (profileError) {
      console.error("Error creating admin profile:", profileError);

      // If profile creation fails, the user remains in auth but without profile
      // This is less than ideal but we'll return an error
      return Response.json(
        { error: `Failed to create admin profile: ${profileError.message}` },
        { status: 500 },
      );
    }

    return Response.json(
      { message: "Setup completed successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Setup error:", error);
    return Response.json(
      {
        error: `An error occurred during setup: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
