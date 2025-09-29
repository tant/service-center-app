import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  console.log("🏗️ [SUPABASE CLIENT] Creating browser client...");

  try {
    console.log("🏗️ [SUPABASE CLIENT] Environment variables:", {
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

    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );

    console.log("🏗️ [SUPABASE CLIENT] Browser client created successfully");
    console.log("🏗️ [SUPABASE CLIENT] Client properties:", {
      hasAuth: !!client.auth,
      hasFrom: !!client.from,
      hasRealtime: !!client.realtime,
    });

    return client;
  } catch (error) {
    console.error("🏗️ [SUPABASE CLIENT] Error creating browser client:", error);
    console.error(
      "🏗️ [SUPABASE CLIENT] Error stack:",
      error instanceof Error ? error.stack : "No stack trace available",
    );
    throw error;
  }
}
