// Delivery Tracking Hooks
// Story 1.14: Customer Delivery Confirmation Workflow

'use client';

import { trpc } from '@/components/providers/trpc-provider';

/**
 * Story 1.14: Hook for confirming delivery
 * AC 1, 2, 3: Staff confirms delivery with signature and notes
 */
export function useConfirmDelivery() {
  const utils = trpc.useUtils();
  const mutation = trpc.tickets.confirmDelivery.useMutation({
    onSuccess: () => {
      // Invalidate pending deliveries list
      utils.tickets.getPendingDeliveries.invalidate();
      utils.tickets.getPendingDeliveriesCount.invalidate();
      // Note: Ticket details will refresh on page navigation
    },
  });

  return {
    confirmDelivery: mutation.mutate,
    confirmDeliveryAsync: mutation.mutateAsync,
    isConfirming: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Story 1.14: Hook for fetching pending deliveries
 * AC 4, 5: List completed tickets awaiting delivery confirmation
 */
export function usePendingDeliveries(params?: {
  limit?: number;
  offset?: number;
}) {
  const query = trpc.tickets.getPendingDeliveries.useQuery({
    limit: params?.limit || 50,
    offset: params?.offset || 0,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Story 1.14: Hook for pending deliveries count
 * For badge indicator
 */
export function usePendingDeliveriesCount() {
  const query = trpc.tickets.getPendingDeliveriesCount.useQuery(undefined, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false,
  });

  return {
    count: query.data || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
