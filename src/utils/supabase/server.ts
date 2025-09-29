import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  console.log("🏗️ [SUPABASE SERVER] Creating server client...");

  try {
    console.log("🏗️ [SUPABASE SERVER] Environment variables:", {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      urlPrefix:
        process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) || "none",
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length || 0,
      keyPrefix:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) ||
        "none",
    });

    console.log("🏗️ [SUPABASE SERVER] Getting cookie store...");
    const cookieStore = await cookies();
    console.log("🏗️ [SUPABASE SERVER] Cookie store obtained");
    console.log("🏗️ [SUPABASE SERVER] Cookie store type:", typeof cookieStore);

    console.log("🏗️ [SUPABASE SERVER] Creating server client instance...");
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            try {
              const cookies = cookieStore.getAll();
              console.log(
                "🏗️ [SUPABASE SERVER] Getting all cookies:",
                cookies.length,
                "cookies found",
              );
              console.log(
                "🏗️ [SUPABASE SERVER] Cookie names:",
                cookies.map((c) => c.name),
              );
              return cookies;
            } catch (error) {
              console.error(
                "🏗️ [SUPABASE SERVER] Error getting cookies:",
                error,
              );
              return [];
            }
          },
          setAll(cookiesToSet) {
            console.log(
              "🏗️ [SUPABASE SERVER] Setting cookies:",
              cookiesToSet.length,
              "cookies to set",
            );
            console.log(
              "🏗️ [SUPABASE SERVER] Cookie names to set:",
              cookiesToSet.map((c) => c.name),
            );
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                console.log(
                  "🏗️ [SUPABASE SERVER] Setting cookie:",
                  name,
                  "with options:",
                  options,
                );
                cookieStore.set(name, value, options);
              });
              console.log("🏗️ [SUPABASE SERVER] Cookies set successfully");
            } catch (error) {
              console.log(
                "🏗️ [SUPABASE SERVER] Cookie setting skipped (Server Component context):",
                error instanceof Error ? error.message : String(error),
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
    console.log("🏗️ [SUPABASE SERVER] Client properties:", {
      hasAuth: !!client.auth,
      hasFrom: !!client.from,
      hasRealtime: !!client.realtime,
    });

    return client;
  } catch (error) {
    console.error("🏗️ [SUPABASE SERVER] Error creating server client:", error);
    console.error(
      "🏗️ [SUPABASE SERVER] Error stack:",
      error instanceof Error ? error.stack : "No stack trace available",
    );
    throw error;
  }
}
