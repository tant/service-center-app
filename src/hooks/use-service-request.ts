// Service Request Hooks
// Custom hooks for public service request portal

'use client';

import { useState, useCallback } from 'react';
import { trpc } from '@/components/providers/trpc-provider';
import type {
  ServiceRequest,
  ServiceRequestSummary,
  TrackingTokenLookup,
  ServiceRequestFormData,
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

/**
 * Hook for managing service requests (internal)
 * TODO: Implement for staff review and management
 */
export function useServiceRequests(filters?: {
  status?: string;
  service_type?: string;
  search?: string;
}) {
  // TODO: Implement with tRPC
  const requests: ServiceRequestSummary[] = [];
  const isLoading = false;
  const error = null;

  return {
    requests,
    isLoading,
    error,
    // TODO: Add mutations (review, approve, reject)
  };
}

/**
 * Hook for reviewing a service request
 * TODO: Implement review workflow
 */
export function useReviewServiceRequest() {
  const [isReviewing, setIsReviewing] = useState(false);

  const reviewRequest = useCallback(async (
    requestId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) => {
    // TODO: Implement tRPC mutation
    setIsReviewing(true);
    try {
      console.log('Reviewing request:', requestId, status, reason);
    } finally {
      setIsReviewing(false);
    }
  }, []);

  return {
    reviewRequest,
    isReviewing,
  };
}

/**
 * Hook for converting service request to ticket
 * TODO: Implement conversion logic
 */
export function useConvertToTicket() {
  const [isConverting, setIsConverting] = useState(false);

  const convertToTicket = useCallback(async (requestId: string) => {
    // TODO: Implement tRPC mutation
    setIsConverting(true);
    try {
      console.log('Converting request to ticket:', requestId);
      // Returns created ticket ID
      return 'ticket-id-placeholder';
    } finally {
      setIsConverting(false);
    }
  }, []);

  return {
    convertToTicket,
    isConverting,
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
