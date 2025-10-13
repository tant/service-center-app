import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Parameters for creating an auto-generated comment
 */
export interface AutoCommentParams {
  ticketId: string;
  userId: string;
  comment: string;
  isInternal?: boolean;
  commentType?: 'note' | 'status_change' | 'assignment' | 'system';
  supabaseAdmin: SupabaseClient;
}

/**
 * Create an auto-generated comment for a ticket
 *
 * This function creates system-generated comments to track changes
 * made to tickets. It's designed to be non-blocking - if comment
 * creation fails, it logs the error but doesn't throw.
 *
 * @param params - Comment creation parameters
 * @returns Promise that resolves when comment is created (or fails silently)
 */
export async function createAutoComment({
  ticketId,
  userId,
  comment,
  isInternal = true,
  commentType = 'system',
  supabaseAdmin,
}: AutoCommentParams): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from("service_ticket_comments")
      .insert({
        ticket_id: ticketId,
        comment: comment,
        comment_type: commentType,
        is_internal: isInternal,
        created_by: userId,
      });

    if (error) {
      console.error("[AUTO-COMMENT] Failed to create auto-comment:", {
        ticketId,
        userId,
        error: error.message,
        comment: comment.substring(0, 100), // Log first 100 chars
      });
      // Don't throw - auto-comments shouldn't break main operations
    }
  } catch (error) {
    console.error("[AUTO-COMMENT] Unexpected error creating auto-comment:", {
      ticketId,
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Don't throw - auto-comments shouldn't break main operations
  }
}
