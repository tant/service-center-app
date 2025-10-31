// Service Request Hooks
// Custom hooks for public service request portal

'use client';

import { useState, useCallback } from 'react';
import { trpc } from '@/components/providers/trpc-provider';
import type {
  ServiceRequest,
  // ServiceRequestSummary, // TODO: Re-enable when view is recreated
  TrackingTokenLookup,
} from '@/types/service-request';

/**
 * Story 1.11: Hook for verifying warranty status by serial number (public)
 * AC 2, 8: Verify warranty and show status before submission
 */
export function useVerifyWarranty() {
  const mutation = trpc.serviceRequest.verifyWarranty.useMutation();

  return {
    verifyWarranty: mutation.mutate,
    verifyWarrantyAsync: mutation.mutateAsync,
    isVerifying: mutation.isPending,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Story 1.11: Hook for submitting a public service request
 * AC 2, 3: Submit service request with customer details
 */
export function useSubmitServiceRequest() {
  const mutation = trpc.serviceRequest.submit.useMutation();

  return {
    submitRequest: mutation.mutate,
    submitRequestAsync: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Story 1.12: Hook for tracking token lookup (public)
 * AC 1, 9: Track service request with auto-refresh
 */
export function useTrackServiceRequest(
  params: { tracking_token: string },
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    refetchIntervalInBackground?: boolean;
  }
) {
  const query = trpc.serviceRequest.track.useQuery(
    { tracking_token: params.tracking_token },
    {
      enabled: options?.enabled,
      refetchInterval: options?.refetchInterval,
      refetchIntervalInBackground: options?.refetchIntervalInBackground,
    }
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ========================================
// STAFF HOOKS (Story 1.13) - Authenticated
// ========================================

/**
 * Story 1.13: List pending service requests
 * Staff query with pagination, filters, and search
 */
export function usePendingRequests(params?: {
  status?: "submitted" | "received" | "processing";
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const query = trpc.serviceRequest.listPending.useQuery({
    status: params?.status,
    search: params?.search,
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
 * Story 1.13: Get full request details
 * Staff query for viewing complete request information
 */
export function useRequestDetails(requestId: string | null) {
  const query = trpc.serviceRequest.getDetails.useQuery(
    { request_id: requestId! },
    {
      enabled: !!requestId,
    }
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Story 1.13: Update request status
 * Staff mutation to update status (received/processing)
 */
export function useUpdateRequestStatus() {
  const utils = trpc.useUtils();
  const mutation = trpc.serviceRequest.updateStatus.useMutation({
    onSuccess: () => {
      // Invalidate pending requests query
      utils.serviceRequest.listPending.invalidate();
      utils.serviceRequest.getPendingCount.invalidate();
    },
  });

  return {
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * DEPRECATED 2025-10-29: convertToTicket procedure is deprecated
 * Tickets are now auto-created when request status changes to 'received'
 * This hook is kept for backward compatibility but should not be used.
 */
// export function useConvertToTicket() {
//   const utils = trpc.useUtils();
//   const mutation = trpc.serviceRequest.convertToTicket.useMutation({
//     onSuccess: () => {
//       // Invalidate pending requests queries
//       utils.serviceRequest.listPending.invalidate();
//       utils.serviceRequest.getPendingCount.invalidate();
//       // Note: Ticket list will be refreshed when user navigates to tickets page
//     },
//   });

//   return {
//     convertToTicket: mutation.mutate,
//     convertToTicketAsync: mutation.mutateAsync,
//     isConverting: mutation.isPending,
//     data: mutation.data,
//     error: mutation.error,
//     reset: mutation.reset,
//   };
// }

/**
 * Story 1.13: Reject service request
 * Staff mutation to reject request with reason
 */
export function useRejectRequest() {
  const utils = trpc.useUtils();
  const mutation = trpc.serviceRequest.reject.useMutation({
    onSuccess: () => {
      // Invalidate pending requests query
      utils.serviceRequest.listPending.invalidate();
      utils.serviceRequest.getPendingCount.invalidate();
    },
  });

  return {
    rejectRequest: mutation.mutate,
    rejectRequestAsync: mutation.mutateAsync,
    isRejecting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Story 1.13: Get count of pending requests
 * Staff query for badge counter
 */
export function usePendingCount() {
  const query = trpc.serviceRequest.getPendingCount.useQuery(undefined, {
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

/**
 * Hook for pending incoming requests (status = submitted)
 * For requests where customer is shipping items to service center
 */
export function usePendingIncomingRequests(params?: {
  limit?: number;
  offset?: number;
}) {
  const query = trpc.serviceRequest.listPending.useQuery({
    status: "submitted",
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
 * Hook for service request analytics
 * TODO: Implement analytics queries
 */
export function useServiceRequestAnalytics(period: string = '30d') {
  // TODO: Implement with tRPC
  const analytics = null;
  const isLoading = false;
  const error = null;

  return {
    analytics,
    isLoading,
    error,
  };
}

/**
 * Hook for photo uploads (public portal)
 * TODO: Implement Supabase Storage integration
 */
export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadPhoto = useCallback(async (file: File): Promise<string> => {
    // TODO: Implement Supabase Storage upload
    setIsUploading(true);
    setUploadProgress(0);
    try {
      console.log('Uploading photo:', file.name);
      // Placeholder progress simulation
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(i);
      }
      return 'https://placeholder-url.com/photo.jpg';
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  return {
    uploadPhoto,
    isUploading,
    uploadProgress,
  };
}
