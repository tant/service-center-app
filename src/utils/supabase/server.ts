import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  console.log("🏗️ [SUPABASE SERVER] Creating server client...");

  const cookieStore = await cookies();
  console.log("🏗️ [SUPABASE SERVER] Cookie store obtained");

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = cookieStore.getAll();
          console.log(
            "🏗️ [SUPABASE SERVER] Getting all cookies:",
            cookies.length,
            "cookies found",
          );
          return cookies;
        },
        setAll(cookiesToSet) {
          console.log(
            "🏗️ [SUPABASE SERVER] Setting cookies:",
            cookiesToSet.length,
            "cookies to set",
          );
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
            console.log("🏗️ [SUPABASE SERVER] Cookies set successfully");
          } catch (error) {
            console.log(
              "🏗️ [SUPABASE SERVER] Cookie setting skipped (Server Component context)",
            );
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  console.log("🏗️ [SUPABASE SERVER] Server client created successfully");
  return client;
}
