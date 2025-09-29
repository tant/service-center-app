import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { initTRPC } from "@trpc/server";

/**
 * Create Supabase clients for tRPC context
 */
function createSupabaseClients(req: Request) {
  console.log("🗄️ DATABASE: Creating Supabase clients...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("🔍 DATABASE: Environment variables check:");
  console.log(
    "   - SUPABASE_URL:",
    !!supabaseUrl,
    supabaseUrl ? `(${supabaseUrl.substring(0, 30)}...)` : "(missing)",
  );
  console.log(
    "   - ANON_KEY:",
    !!supabaseAnonKey,
    supabaseAnonKey ? `(${supabaseAnonKey.substring(0, 20)}...)` : "(missing)",
  );
  console.log(
    "   - SERVICE_ROLE_KEY:",
    !!supabaseServiceRoleKey,
    supabaseServiceRoleKey
      ? `(${supabaseServiceRoleKey.substring(0, 20)}...)`
      : "(missing)",
  );

  if (!supabaseUrl) {
    console.error(
      "❌ DATABASE: Missing NEXT_PUBLIC_SUPABASE_URL in environment variables",
    );
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL in environment variables",
    );
  }

  if (!supabaseAnonKey) {
    console.error(
      "❌ DATABASE: Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in environment variables",
    );
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in environment variables",
    );
  }

  if (!supabaseServiceRoleKey) {
    console.error(
      "❌ DATABASE: Missing SUPABASE_SERVICE_ROLE_KEY in environment variables",
    );
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in environment variables",
    );
  }

  console.log("🔧 DATABASE: Creating server client with request cookies...");

  // Parse cookies from the request
  const cookies = req.headers.get("cookie") || "";
  const cookieMap = new Map<string, string>();

  // Parse cookie string into map
  cookies.split(";").forEach((cookie) => {
    const trimmed = cookie.trim();
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex > 0) {
      const name = trimmed.slice(0, equalIndex);
      const value = trimmed.slice(equalIndex + 1);
      if (name && value) {
        try {
          // Some cookies like auth tokens might be URL encoded
          cookieMap.set(name, decodeURIComponent(value));
        } catch {
          // If decode fails, use raw value
          cookieMap.set(name, value);
        }
      }
    }
  });

  console.log("🍪 DATABASE: Parsed cookies:", Array.from(cookieMap.keys()));

  // Client with anon key and request cookies (for authenticated operations)
  const supabaseClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookieArray = Array.from(cookieMap.entries()).map(
          ([name, value]) => ({
            name,
            value,
          }),
        );
        console.log(
          "🔧 DATABASE: Getting all cookies for supabase client:",
          cookieArray.length,
        );
        return cookieArray;
      },
      setAll(cookiesToSet) {
        console.log(
          "🔧 DATABASE: Setting cookies (tRPC context - ignored):",
          cookiesToSet.length,
        );
        // In tRPC context, we can't set cookies on the response
        // This is expected behavior for server-side contexts
      },
    },
  });

  console.log("🔒 DATABASE: Creating admin client...");
  // Admin client with service role key (bypasses RLS)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("✅ DATABASE: Supabase clients created successfully");
  return { supabaseClient, supabaseAdmin };
}

/**
 * Create context for tRPC
 */
export function createTRPCContext(opts: { req: Request }) {
  console.log("🏗️ CONTEXT: Creating tRPC context...");

  try {
    const { supabaseClient, supabaseAdmin } = createSupabaseClients(opts.req);

    console.log("✅ CONTEXT: tRPC context created successfully");
    console.log("📋 CONTEXT: Supabase client created:", !!supabaseClient);
    console.log("🔒 CONTEXT: Supabase admin created:", !!supabaseAdmin);

    return {
      supabaseClient,
      supabaseAdmin,
    };
  } catch (error) {
    console.error("❌ CONTEXT: Failed to create tRPC context:", error);
    throw error;
  }
}

export type TRPCContext = ReturnType<typeof createTRPCContext>;

/**
 * Initialize tRPC with context and superjson transformer
 */
const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * Export tRPC utilities
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
