import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  console.log("🏗️ [SUPABASE CLIENT] Creating browser client...");

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  console.log("🏗️ [SUPABASE CLIENT] Browser client created successfully");
  return client;
}
