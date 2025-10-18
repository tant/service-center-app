import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  console.log("🏗️ [SUPABASE CLIENT] Creating browser client...");

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("🏗️ [SUPABASE CLIENT] Environment variables:", {
      hasUrl: !!supabaseUrl,
      urlLength: supabaseUrl?.length || 0,
      urlPrefix: supabaseUrl?.substring(0, 20) || "none",
      hasAnonKey: !!supabaseAnonKey,
      keyLength: supabaseAnonKey?.length || 0,
      keyPrefix: supabaseAnonKey?.substring(0, 20) || "none",
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "@supabase/ssr: Your project's URL and API key are required to create a Supabase client!\n\n" +
        "Missing variables:\n" +
        (!supabaseUrl ? "- NEXT_PUBLIC_SUPABASE_URL\n" : "") +
        (!supabaseAnonKey ? "- NEXT_PUBLIC_SUPABASE_ANON_KEY\n" : "") +
        "\nCheck your Supabase project's API settings to find these values\n" +
        "https://supabase.com/dashboard/project/_/settings/api"
      );
    }

    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

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
