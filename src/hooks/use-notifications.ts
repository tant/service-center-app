/**
 * Story 1.15: Email Notification System
 * React hooks for email notification management
 */

import { trpc } from "@/utils/trpc";

/**
 * Hook to fetch email log with filters
 * AC 9: Admin can view email notification log
 */
export function useEmailLog(params: {
  limit?: number;
  offset?: number;
  emailType?: 'request_submitted' | 'request_received' | 'request_rejected' | 'ticket_created' | 'service_completed' | 'delivery_confirmed';
  status?: 'pending' | 'sent' | 'failed' | 'bounced';
  recipientEmail?: string;
}) {
  return trpc.notifications.getLog.useQuery(params, {
    keepPreviousData: true,
  });
}

/**
 * Hook to fetch email statistics
 * For admin dashboard
 */
export function useEmailStats() {
  return trpc.notifications.getStats.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to retry a failed email
 * AC 8: Retry failed emails with exponential backoff
 */
export function useRetryEmail() {
  const utils = trpc.useUtils();

  return trpc.notifications.retry.useMutation({
    onSuccess: () => {
      // Invalidate email log to refresh the list
      utils.notifications.getLog.invalidate();
      utils.notifications.getStats.invalidate();
    },
  });
}

/**
 * Hook to send a test email (for development/testing)
 */
export function useSendEmail() {
  const utils = trpc.useUtils();

  return trpc.notifications.send.useMutation({
    onSuccess: () => {
      utils.notifications.getLog.invalidate();
      utils.notifications.getStats.invalidate();
    },
  });
}
