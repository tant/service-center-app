// Service Request Constants
// Constants for public service request portal

import type { DeliveryMethod, RequestStatus, ServiceType } from "@/types/enums";

// Request status colors for UI
export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  draft: "#9CA3AF", // Light Gray
  submitted: "#6B7280", // Gray
  pickingup: "#8B5CF6", // Purple
  received: "#3B82F6", // Blue
  processing: "#F59E0B", // Orange
  completed: "#10B981", // Green
  cancelled: "#EF4444", // Red
};

// Request status icons (lucide-react icon names)
export const REQUEST_STATUS_ICONS: Record<RequestStatus, string> = {
  draft: "file-edit",
  submitted: "send",
  pickingup: "package",
  received: "inbox",
  processing: "loader-2",
  completed: "check-circle",
  cancelled: "x-circle",
};

// Request status descriptions
export const REQUEST_STATUS_DESCRIPTIONS: Record<RequestStatus, string> = {
  draft: "Draft request, not yet submitted",
  submitted: "Request submitted, awaiting review",
  pickingup: "Awaiting product pickup from customer",
  received: "Request received and under review",
  processing: "Service ticket created, work in progress",
  completed: "Service completed successfully",
  cancelled: "Request cancelled or rejected",
};

// Service type options for public portal
export const PUBLIC_SERVICE_TYPE_OPTIONS: {
  value: ServiceType;
  label: string;
  description: string;
}[] = [
  {
    value: "warranty",
    label: "Warranty Service",
    description: "Free service for products under warranty",
  },
  {
    value: "paid",
    label: "Paid Repair",
    description: "Paid repair service for out-of-warranty products",
  },
  {
    value: "replacement",
    label: "Warranty Replacement",
    description: "Request replacement under warranty",
  },
];

// Delivery method options
export const DELIVERY_METHOD_OPTIONS: {
  value: DeliveryMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "pickup",
    label: "Pickup",
    description: "Pick up from service center",
  },
  {
    value: "delivery",
    label: "Delivery",
    description: "Deliver to customer address",
  },
];

// Form validation rules
export const SERVICE_REQUEST_VALIDATION = {
  customer_name: {
    min_length: 2,
    max_length: 255,
    pattern: /^[a-zA-Z\s]+$/,
  },
  customer_email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  customer_phone: {
    min_length: 8,
    max_length: 20,
    pattern: /^[0-9+\-\s()]+$/,
  },
  product_brand: {
    min_length: 2,
    max_length: 255,
  },
  product_model: {
    min_length: 2,
    max_length: 255,
  },
  serial_number: {
    min_length: 5,
    max_length: 255,
    pattern: /^[A-Z0-9-]+$/i,
  },
  issue_description: {
    min_length: 20,
    max_length: 5000,
  },
  delivery_address: {
    min_length: 10,
    max_length: 500,
  },
} as const;

// Photo upload settings for public portal
export const PUBLIC_PHOTO_UPLOAD = {
  max_photos: 5,
  max_file_size_mb: 5,
  allowed_formats: ["image/jpeg", "image/png", "image/webp"],
  compression_quality: 0.8,
  thumbnail_size: 200,
} as const;

// Tracking token settings
export const TRACKING_TOKEN_SETTINGS = {
  prefix: "SR-",
  length: 12,
  characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  format_display: "SR-XXXXXXXXXXXX",
} as const;

// Email notification types
export const EMAIL_NOTIFICATION_TYPES = {
  request_received: {
    template: "service_request_received",
    subject: "Service Request Received - {{tracking_token}}",
  },
  request_reviewed: {
    template: "service_request_reviewed",
    subject: "Service Request Update - {{tracking_token}}",
  },
  request_approved: {
    template: "service_request_approved",
    subject: "Service Request Approved - {{tracking_token}}",
  },
  request_rejected: {
    template: "service_request_rejected",
    subject: "Service Request Update - {{tracking_token}}",
  },
  ticket_created: {
    template: "ticket_created_from_request",
    subject: "Service Ticket Created - {{ticket_number}}",
  },
  ticket_completed: {
    template: "ticket_completed",
    subject: "Service Completed - {{ticket_number}}",
  },
} as const;

// Request review settings
export const REQUEST_REVIEW_SETTINGS = {
  auto_approve_warranty: false,
  require_serial_verification: true,
  require_purchase_date: false,
  max_pending_days: 7,
  priority_review_hours: 24,
} as const;

// Request conversion settings
export const REQUEST_CONVERSION_SETTINGS = {
  auto_create_customer: true,
  auto_match_product: true,
  auto_select_template: true,
  create_initial_comment: true,
  send_confirmation_email: true,
} as const;

// Public portal configuration
export const PUBLIC_PORTAL_CONFIG = {
  enabled: true,
  maintenance_mode: false,
  show_tracking_lookup: true,
  show_faq: true,
  show_contact_info: true,
  require_recaptcha: false,
  rate_limit_per_ip: 5, // Requests per hour
} as const;

// Request analytics periods
export const REQUEST_ANALYTICS_PERIODS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "ytd", label: "Year to Date" },
  { value: "all", label: "All Time" },
] as const;

// SLA targets
export const SERVICE_REQUEST_SLA = {
  review_target_hours: 24,
  conversion_target_hours: 48,
  completion_target_days: 7,
} as const;

// Permission settings
export const REQUEST_PERMISSIONS = {
  can_view_all_requests: ["admin", "manager", "reception"],
  can_review_requests: ["admin", "manager", "reception"],
  can_approve_requests: ["admin", "manager"],
  can_reject_requests: ["admin", "manager"],
  can_convert_to_ticket: ["admin", "manager", "reception"],
  can_export_requests: ["admin", "manager"],
} as const;

// Default filters
export const DEFAULT_REQUEST_FILTERS = {
  status: "all",
  service_type: "all",
  date_range: "30d",
  search: "",
  page: 1,
  limit: 50,
} as const;
