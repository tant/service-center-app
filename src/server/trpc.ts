import { createClient } from "@supabase/supabase-js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

/**
 * Create Supabase clients for tRPC context
 */
function createSupabaseClients() {
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

  console.log("🔧 DATABASE: Creating anon client...");
  // Client with anon key (for regular operations)
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

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
export function createTRPCContext() {
  console.log("🏗️ CONTEXT: Creating tRPC context...");

  try {
    const { supabaseClient, supabaseAdmin } = createSupabaseClients();

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
