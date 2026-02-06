import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Lookup profile ID from auth user ID
 *
 * This helper resolves the mapping between auth.users.id and profiles.id
 * which is necessary because:
 * - ctx.user.id is auth.users.id (from JWT token)
 * - Database FKs reference profiles.id (not auth.users.id)
 *
 * @param supabaseAdmin - Supabase admin client
 * @param userId - Auth user ID (auth.users.id)
 * @returns Profile ID (profiles.id)
 * @throws Error if profile not found
 *
 * @example
 * ```typescript
 * const profileId = await getProfileIdFromUserId(ctx.supabaseAdmin, ctx.user.id);
 * ```
 */
export async function getProfileIdFromUserId(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !profile) {
    throw new Error(`Profile not found for user: ${userId}`);
  }

  return profile.id;
}
