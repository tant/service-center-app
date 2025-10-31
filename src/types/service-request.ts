// Service Request Types
// Types for public service request portal

import type { Database } from './database.types';
import type { RequestStatus, ServiceType, DeliveryMethod } from './enums';

// Database table types
export type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];
export type ServiceRequestInsert = Database['public']['Tables']['service_requests']['Insert'];
export type ServiceRequestUpdate = Database['public']['Tables']['service_requests']['Update'];

export type EmailNotification = Database['public']['Tables']['email_notifications']['Row'];
export type EmailNotificationInsert = Database['public']['Tables']['email_notifications']['Insert'];
export type EmailNotificationUpdate = Database['public']['Tables']['email_notifications']['Update'];

// View types
// TODO: Re-enable when v_service_request_summary view is recreated in migrations
// export type ServiceRequestSummary = Database['public']['Views']['v_service_request_summary']['Row'];

// Extended types
export interface ServiceRequestWithDetails extends ServiceRequest {
  reviewed_by?: {
    id: string;
    full_name: string;
  };
  ticket?: {
    id: string;
    ticket_number: string;
    status: string;
  };
}

// Form types - Public submission
export interface PublicServiceRequestItem {
  serial_number: string;
  product_brand?: string;
  product_model?: string;
  purchase_date?: string;
  issue_description?: string;
  service_option: ServiceType;
  warranty_requested?: boolean;
  service_option_notes?: string;
  attachments?: Array<{
    path: string;
    file_name: string;
    file_size: number;
    file_type: string;
  }>;
}

export interface PublicServiceRequestPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  issue_overview?: string;
  items: PublicServiceRequestItem[];
  preferred_delivery_method: DeliveryMethod;
  delivery_address?: string;
  preferred_schedule?: string;
  pickup_notes?: string;
  contact_notes?: string;
  honeypot?: string;
}

export interface WarrantyProductInfo {
  id?: string | null;
  name?: string | null;
  brand?: string | null;
  sku?: string | null;
  serial: string;
}

export interface WarrantyStatusInfo {
  status: 'active' | 'expiring_soon' | 'expired' | 'no_warranty';
  daysRemaining: number | null;
  manufacturerEndDate?: string | null;
  userEndDate?: string | null;
  endDate?: string | null;
}

export interface VerifiedWarrantyItem {
  serial: string;
  status: 'pending' | 'success' | 'error';
  eligible: boolean;
  message?: string;
  product?: WarrantyProductInfo;
  warranty?: WarrantyStatusInfo;
  error?: string;
}

export interface ServiceRequestWizardState {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  issue: {
    description: string;
    serviceType: ServiceType;
  };
  items: PublicServiceRequestItem[];
  delivery: {
    method: DeliveryMethod;
    address: string;
    pickupNotes: string;
    preferredSchedule: string;
  };
  consentConfirmed: boolean;
  honeypot: string;
}

// Form types - Internal review
export interface ServiceRequestReviewData {
  status: RequestStatus;
  rejection_reason?: string;
}

// Service request to ticket conversion
export interface ServiceRequestConversion {
  request_id: string;
  ticket_data: {
    customer_id: string; // Existing or newly created
    product_id: string; // Matched from catalog
    brand_id: string;
    template_id?: string; // Task template to apply
    warranty_type: string;
    issue_description: string;
    delivery_method: DeliveryMethod;
    delivery_address?: string;
  };
}

// Email notification types
export type NotificationType =
  | 'service_request_received'
  | 'service_request_reviewed'
  | 'service_request_approved'
  | 'service_request_rejected'
  | 'ticket_created_from_request'
  | 'ticket_status_updated'
  | 'task_completed'
  | 'warranty_expiring_soon'
  | 'low_stock_alert';

export interface EmailNotificationData {
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  template_name?: string;
  notification_type: NotificationType;
  related_entity_type?: 'service_request' | 'service_ticket' | 'physical_product';
  related_entity_id?: string;
}

// Tracking token lookup
export interface TrackingTokenLookup {
  tracking_token: string;
  request?: ServiceRequestWithDetails;
  found: boolean;
}

// Service request analytics
export interface ServiceRequestAnalytics {
  total_requests: number;
  by_status: Record<RequestStatus, number>;
  by_service_type: Record<ServiceType, number>;
  average_review_time_hours: number;
  average_conversion_time_hours: number;
  conversion_rate: number; // Percentage of requests converted to tickets
  rejection_rate: number;
  pending_review_count: number;
}

// Public portal configuration
export interface PublicPortalConfig {
  enabled: boolean;
  allowed_brands: string[];
  require_serial_number: boolean;
  max_photo_uploads: number;
  max_photo_size_mb: number;
  allowed_service_types: ServiceType[];
  show_delivery_options: boolean;
  maintenance_mode: boolean;
  maintenance_message?: string;
}

// Constants
export const MAX_ISSUE_PHOTOS = 5;
export const MAX_PHOTO_SIZE_MB = 5;
export const TRACKING_TOKEN_PREFIX = 'SR-';
export const TRACKING_TOKEN_LENGTH = 12; // Plus prefix = 15 total
