"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function logout() {
  console.log("🔐 [LOGOUT ACTION] Starting logout process");

  // Get cookie store
  const cookieStore = await cookies();

  // Create Supabase client
  const supabase = await createClient();

  // Sign out from Supabase
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("🔐 [LOGOUT ACTION] Supabase signOut error:", error);
  } else {
    console.log("🔐 [LOGOUT ACTION] Supabase signOut successful");
  }

  // Explicitly clear all Supabase auth cookies to ensure complete cleanup
  const allCookies = cookieStore.getAll();
  const authCookies = allCookies.filter(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
  );

  if (authCookies.length > 0) {
    console.log(
      `🔐 [LOGOUT ACTION] Clearing ${authCookies.length} auth cookie(s):`,
      authCookies.map((c) => c.name),
    );
    authCookies.forEach((cookie) => {
      cookieStore.delete(cookie.name);
    });
  }

  console.log(
    "🔐 [LOGOUT ACTION] All cookies cleared, revalidating and redirecting to /login",
  );

  // Revalidate all paths to clear any cached data
  revalidatePath("/", "layout");

  // Redirect to login page
  redirect("/login");
}
