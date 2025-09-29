import { createClient } from "@supabase/supabase-js";

/**
 * For administrative operations
 * Uses the service role JWT for elevated permissions
 */

// Global counter for admin client usage tracking
let adminClientUsageCount = 0;
const adminOperationTracker = new Map<string, number>();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleJWT = process.env.SUPABASE_SERVICE_ROLE_JWT;

console.log("🔧 [ADMIN] Initializing admin client module");

if (!supabaseUrl) {
  console.error(
    "❌ [ADMIN] Missing NEXT_PUBLIC_SUPABASE_URL in environment variables",
  );
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables");
}

if (!supabaseServiceRoleJWT) {
  console.error(
    "❌ [ADMIN] Missing SUPABASE_SERVICE_ROLE_JWT in environment variables",
  );
  throw new Error("Missing SUPABASE_SERVICE_ROLE_JWT in environment variables");
}

console.log("🔧 [ADMIN] Creating admin client with service role JWT");
const startTime = performance.now();

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleJWT, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const endTime = performance.now();
console.log(
  `⏱️ [ADMIN] Admin client creation took ${(endTime - startTime).toFixed(2)}ms`,
);

// For auth admin operations - same client with service role
export const supabaseAuthAdmin = supabaseAdmin;

// Track admin client usage
const originalFrom = supabaseAdmin.from;
supabaseAdmin.from = function (table: string) {
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
