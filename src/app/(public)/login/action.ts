"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
  success?: boolean;
};

/**
 * Get user-friendly error message based on Supabase error
 */
function getUserFriendlyError(error: any): string {
  const errorMessage = error.message?.toLowerCase() || "";

  // Invalid credentials
  if (errorMessage.includes("invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }

  // Email not confirmed
  if (errorMessage.includes("email not confirmed")) {
    return "Please verify your email address before logging in. Check your inbox for the verification link.";
  }

  // Too many requests
  if (errorMessage.includes("too many") || error.status === 429) {
    return "Too many login attempts. Please wait a few minutes before trying again.";
  }

  // Network/server errors
  if (error.status >= 500 || errorMessage.includes("fetch")) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  // User not found
  if (errorMessage.includes("user not found")) {
    return "No account found with this email address.";
  }

  // Default fallback
  return "Unable to sign in. Please try again or contact support if the problem persists.";
}

export async function login(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  console.log("🔐 [LOGIN ACTION] Starting login process");

  // Extract and validate inputs
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Server-side validation
  const fieldErrors: LoginState["fieldErrors"] = {};

  if (!email || !email.trim()) {
    fieldErrors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please enter a valid email address";
  }

  if (!password || !password.trim()) {
    fieldErrors.password = "Password is required";
  } else if (password.length < 6) {
    fieldErrors.password = "Password must be at least 6 characters";
  }

  if (Object.keys(fieldErrors).length > 0) {
    console.log("🔐 [LOGIN ACTION] Validation failed:", fieldErrors);
    return {
      fieldErrors,
      success: false,
    };
  }

  // Get cookie store and clear any existing auth cookies to prevent stale sessions
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Clear all Supabase auth cookies (handles both localhost and IP-based cookies)
  const authCookies = allCookies.filter(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
  );

  if (authCookies.length > 0) {
    console.log(
      `🔐 [LOGIN ACTION] Clearing ${authCookies.length} existing auth cookie(s):`,
      authCookies.map((c) => c.name),
    );
    authCookies.forEach((cookie) => {
      cookieStore.delete(cookie.name);
    });
  }

  console.log("🔐 [LOGIN ACTION] Cookies initialized and cleared");

  const supabase = await createClient();
  console.log("🔐 [LOGIN ACTION] Supabase client created");

  console.log("🔐 [LOGIN ACTION] Form data extracted:", {
    email,
    password: password ? "[REDACTED]" : "missing",
    hasEmail: !!email,
    hasPassword: !!password,
  });

  console.log("🔐 [LOGIN ACTION] Password details for debug:");
  console.log("   - Length:", password.length);
  console.log("   - First 3 chars:", password.substring(0, 3));
  console.log("   - Last 3 chars:", password.substring(password.length - 3));
  console.log("   - Full password:", password);
  console.log("   - Type:", typeof password);
  console.log("   - Includes special chars:", /[!@#$%^&*]/.test(password));

  console.log("🔐 [LOGIN ACTION] Attempting sign in with Supabase...");
  const { error, data: authData } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  console.log("🔐 [LOGIN ACTION] Supabase signInWithPassword response:", {
    success: !error,
    error: error
      ? {
          message: error.message,
          status: error.status,
          name: error.name,
        }
      : null,
    user: authData?.user
      ? {
          id: authData.user.id,
          email: authData.user.email,
        }
      : null,
    session: authData?.session ? "session_exists" : "no_session",
  });

  if (error) {
    console.error("🔐 [LOGIN ACTION] Authentication failed:", {
      message: error.message,
      status: error.status,
      name: error.name,
    });

    const userFriendlyError = getUserFriendlyError(error);

    return {
      error: userFriendlyError,
      success: false,
    };
  }

  // Verify we have a valid session
  if (!authData?.session) {
    console.error("🔐 [LOGIN ACTION] No session created after successful auth");
    return {
      error: "Login succeeded but session creation failed. Please try again.",
      success: false,
    };
  }

  console.log(
    "🔐 [LOGIN ACTION] Authentication successful, revalidating and redirecting to /dashboard",
  );
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
