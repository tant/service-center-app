"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  console.log("🔐 [LOGIN ACTION] Starting login process");

  // Get cookie store and clear any existing auth cookies to prevent stale sessions
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Clear all Supabase auth cookies (handles both localhost and IP-based cookies)
  const authCookies = allCookies.filter(cookie =>
    cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  );

  if (authCookies.length > 0) {
    console.log(`🔐 [LOGIN ACTION] Clearing ${authCookies.length} existing auth cookie(s):`,
      authCookies.map(c => c.name)
    );
    authCookies.forEach(cookie => {
      cookieStore.delete(cookie.name);
    });
  }

  console.log("🔐 [LOGIN ACTION] Cookies initialized and cleared");

  const supabase = await createClient();
  console.log("🔐 [LOGIN ACTION] Supabase client created");

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  console.log("🔐 [LOGIN ACTION] Form data extracted:", {
    email: data.email,
    password: data.password ? "[REDACTED]" : "missing",
    hasEmail: !!data.email,
    hasPassword: !!data.password,
  });

  console.log("🔐 [LOGIN ACTION] Attempting sign in with Supabase...");
  const { error, data: authData } =
    await supabase.auth.signInWithPassword(data);

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
    console.error(
      "🔐 [LOGIN ACTION] Authentication failed, redirecting to /error",
    );
    redirect("/error?from=login");
  }

  console.log(
    "🔐 [LOGIN ACTION] Authentication successful, revalidating and redirecting to /dashboard",
  );
  revalidatePath("/");
  redirect("/dashboard");
}
