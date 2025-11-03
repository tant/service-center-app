import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { initTRPC } from "@trpc/server";
import { initializeEntityAdapters } from "./services/entity-adapters/init";

// Initialize entity adapters on module load
initializeEntityAdapters();

// Global counters for tracking duplicate calls
let clientCreationCount = 0;
let contextCreationCount = 0;
const requestTracker = new Map<string, number>();

/**
 * Create Supabase clients for tRPC context
 */
function createSupabaseClients(req: Request) {
  const requestId =
    req.headers.get("x-request-id") ||
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  clientCreationCount++;

  console.log(
    `🔧 [TRPC-${requestId}] Creating Supabase clients (call #${clientCreationCount})`,
  );
  console.log(`🔧 [TRPC-${requestId}] Request URL: ${req.url}`);
  console.log(`🔧 [TRPC-${requestId}] Request method: ${req.method}`);

  // Track request frequency
  const urlPath = new URL(req.url).pathname;
  const currentCount = requestTracker.get(urlPath) || 0;
  requestTracker.set(urlPath, currentCount + 1);
  console.log(
    `🔧 [TRPC-${requestId}] Path "${urlPath}" call count: ${currentCount + 1}`,
  );

  const startTime = performance.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.error(`❌ [TRPC-${requestId}] Missing environment variables:`, {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceRole: !!supabaseServiceRoleKey,
    });
    throw new Error("Missing required Supabase environment variables");
  }

  // Parse cookies from the request
  const cookies = req.headers.get("cookie") || "";
  const cookieMap = new Map<string, string>();
  let cookieParseCount = 0;

  cookies.split(";").forEach((cookie) => {
    const trimmed = cookie.trim();
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex > 0) {
      const name = trimmed.slice(0, equalIndex);
      const value = trimmed.slice(equalIndex + 1);
      if (name && value) {
        cookieParseCount++;
        try {
          cookieMap.set(name, decodeURIComponent(value));
        } catch {
          cookieMap.set(name, value);
        }
      }
    }
  });

  console.log(
    `🍪 [TRPC-${requestId}] Parsed ${cookieParseCount} cookies:`,
    Array.from(cookieMap.keys()),
  );

  // Track cookie access patterns
  let cookieAccessCount = 0;

  // Client with anon key and request cookies (for authenticated operations)
  const supabaseClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        cookieAccessCount++;
        console.log(
          `🍪 [TRPC-${requestId}] Cookie access #${cookieAccessCount} - returning ${cookieMap.size} cookies`,
        );
        return Array.from(cookieMap.entries()).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        console.log(
          `🍪 [TRPC-${requestId}] Attempt to set ${cookiesToSet.length} cookies (ignored in tRPC context)`,
        );
        // In tRPC context, we can't set cookies on the response
      },
    },
  });

  // Admin client with service role JWT (bypasses RLS)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const endTime = performance.now();
  console.log(
    `⏱️ [TRPC-${requestId}] Client creation took ${(endTime - startTime).toFixed(2)}ms`,
  );
  console.log(
    `✅ [TRPC-${requestId}] Clients created - Cookie access count: ${cookieAccessCount}`,
  );

  return { supabaseClient, supabaseAdmin };
}

/**
 * Create context for tRPC
 */
export async function createTRPCContext(opts: { req: Request }) {
  contextCreationCount++;
  const requestId =
    opts.req.headers.get("x-request-id") ||
    `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(
    `🏗️ [TRPC-CTX-${requestId}] Creating tRPC context (call #${contextCreationCount})`,
  );
  console.log(
    `🏗️ [TRPC-CTX-${requestId}] Stack trace:`,
    new Error().stack?.split("\n").slice(1, 4).join("\n"),
  );

  const contextStartTime = performance.now();
  const { supabaseClient, supabaseAdmin } = createSupabaseClients(opts.req);

  // Get user session for auth context
  const { data: { user } } = await supabaseClient.auth.getUser();

  const contextEndTime = performance.now();

  console.log(
    `⏱️ [TRPC-CTX-${requestId}] Context creation took ${(contextEndTime - contextStartTime).toFixed(2)}ms`,
  );
  console.log(
    `📊 [TRPC-CTX-${requestId}] Global stats - Contexts: ${contextCreationCount}, Clients: ${clientCreationCount}`,
  );
  console.log(
    `👤 [TRPC-CTX-${requestId}] User: ${user?.email || "anonymous"}`,
  );

  return {
    supabaseClient,
    supabaseAdmin,
    user: user || null,
    requestId,
    req: opts.req,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

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
