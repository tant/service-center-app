// Service Request Hooks
// Custom hooks for public service request portal
// TODO: Implement in Story 1.4 (Service Request Portal)

'use client';

import { useState, useCallback } from 'react';
import type {
  ServiceRequest,
  ServiceRequestSummary,
  TrackingTokenLookup,
  ServiceRequestFormData,
} from '@/types/service-request';

/**
 * Hook for submitting a public service request
 * TODO: Implement public submission with photo upload
 */
export function useSubmitServiceRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

  const submitRequest = useCallback(async (data: ServiceRequestFormData) => {
    // TODO: Implement tRPC mutation
    setIsSubmitting(true);
    try {
      console.log('Submitting service request:', data);
      // Placeholder
      setTrackingToken('SR-ABC123XYZ789');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resetSubmission = useCallback(() => {
    setTrackingToken(null);
  }, []);

  return {
    submitRequest,
    resetSubmission,
    trackingToken,
    isSubmitting,
  };
}

/**
 * Hook for tracking token lookup (public)
 * TODO: Implement public tracking lookup without authentication
 */
export function useTrackingLookup() {
  const [isLooking, setIsLooking] = useState(false);
  const [lookup, setLookup] = useState<TrackingTokenLookup | null>(null);

  const lookupToken = useCallback(async (trackingToken: string) => {
    // TODO: Implement tRPC query
    setIsLooking(true);
    try {
      console.log('Looking up tracking token:', trackingToken);
      // Placeholder
      setLookup({
        tracking_token: trackingToken,
        found: false,
      });
    } finally {
      setIsLooking(false);
    }
  }, []);

  const resetLookup = useCallback(() => {
    setLookup(null);
  }, []);

  return {
    lookupToken,
    resetLookup,
    lookup,
    isLooking,
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
