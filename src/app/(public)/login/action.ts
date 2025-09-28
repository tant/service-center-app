"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  console.log("🔐 [LOGIN ACTION] Starting login process");

  // call cookies() before any Supabase calls to opt-out of Next.js fetch caching
  // for authenticated requests (per Supabase Next.js server-side auth guide)
  cookies();
  console.log("🔐 [LOGIN ACTION] Cookies initialized");

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

