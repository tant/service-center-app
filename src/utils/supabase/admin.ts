import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * For administrative operations
 * Uses the service role JWT for elevated permissions
 *
 * NOTE: This module uses lazy initialization to avoid build-time errors
 * when environment variables are not available during Docker builds.
 */

// Global counter for admin client usage tracking
let adminClientUsageCount = 0;
const adminOperationTracker = new Map<string, number>();

// Cached client instance
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Lazy initialization of admin client
 * Only creates the client when first accessed
 */
function getAdminClient(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

  console.log("🔧 [ADMIN] Initializing admin client module");

  // Use internal SUPABASE_URL for server-side (Docker network) or fall back to public URL
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleJWT = process.env.SUPABASE_SERVICE_ROLE_JWT;

  console.log(
    `🔧 [ADMIN] Using Supabase URL: ${supabaseUrl} (internal: ${!!process.env.SUPABASE_URL})`,
  );

  if (!supabaseUrl) {
    console.error(
      "❌ [ADMIN] Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in environment variables",
    );
    throw new Error(
      "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in environment variables",
    );
  }

  if (!supabaseServiceRoleJWT) {
    console.error(
      "❌ [ADMIN] Missing SUPABASE_SERVICE_ROLE_JWT in environment variables",
    );
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_JWT in environment variables",
    );
  }

  console.log("🔧 [ADMIN] Creating admin client with service role JWT");
  const startTime = performance.now();

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleJWT, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const endTime = performance.now();
  console.log(
    `⏱️ [ADMIN] Admin client creation took ${(endTime - startTime).toFixed(2)}ms`,
  );

  // Track admin client usage
  const originalFrom = _supabaseAdmin.from;
  _supabaseAdmin.from = function (table: string) {
    adminClientUsageCount++;
    const caller = new Error().stack?.split("\n")[2]?.trim() || "unknown";
    const operationKey = `${table}:${caller}`;
    const operationCount = adminOperationTracker.get(operationKey) || 0;
    adminOperationTracker.set(operationKey, operationCount + 1);

    console.log(
      `🔑 [ADMIN] Using admin client for table "${table}" (usage #${adminClientUsageCount})`,
    );
    console.log(
      `📍 [ADMIN] Called from: ${caller} (${operationCount + 1} times for this table)`,
    );

    if (adminClientUsageCount > 10) {
      console.warn(
        `⚠️ [ADMIN] HIGH USAGE: Admin client used ${adminClientUsageCount} times!`,
      );
      console.warn(
        `⚠️ [ADMIN] Top operations:`,
        Array.from(adminOperationTracker.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3),
      );
    }

    return originalFrom.call(this, table);
  };

  console.log("✅ [ADMIN] Admin client initialized with usage tracking");

  return _supabaseAdmin;
}

// Export using Proxy for lazy initialization
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAdminClient();
    return client[prop as keyof SupabaseClient];
  },
});

// For auth admin operations - same client with service role
export const supabaseAuthAdmin = supabaseAdmin;
