import { createClient } from "@supabase/supabase-js";

/**
 * For administrative operations
 * Uses the service role JWT for elevated permissions
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleJWT = process.env.SUPABASE_SERVICE_ROLE_JWT;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables");
}

if (!supabaseServiceRoleJWT) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_JWT in environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleJWT, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// For auth admin operations - same client with service role
export const supabaseAuthAdmin = supabaseAdmin;
