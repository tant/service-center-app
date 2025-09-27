import { createClient } from '@supabase/supabase-js';

/**
 * For administrative operations
 * In production, this would use the service role key (JWT token)
 * For local development with Supabase CLI, the anon key might have elevated permissions
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in environment variables');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// For auth admin operations
export const supabaseAuthAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});