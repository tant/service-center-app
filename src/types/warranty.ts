// Warranty Tracking Types
// Types for warranty management and expiration tracking

import type { Database } from './database.types';

// View types
export type WarrantyExpiringSoon = Database['public']['Views']['v_warranty_expiring_soon']['Row'];

// Warranty status types
export type WarrantyStatus = 'active' | 'expiring_soon' | 'expired' | 'unknown';

// Extended types
export interface WarrantyInfo {
  warranty_start_date: string | null;
  warranty_months: number | null;
  warranty_end_date: string | null;
  warranty_status: WarrantyStatus | null;
  days_remaining: number | null;
}

export interface ProductWithWarranty {
  id: string;
  serial_number: string;
  product: {
    id: string;
    name: string;
    sku: string;
    brand_name: string;
  };
  warranty_info: WarrantyInfo;
  virtual_warehouse_type: string;
  physical_warehouse?: {
    name: string;
    code: string;
  };
}

// Warranty calculation helpers
export interface WarrantyCalculation {
  start_date: string;
  months: number;
  end_date: string;
  days_remaining: number;
  is_active: boolean;
  is_expiring_soon: boolean;
  is_expired: boolean;
}

// Warranty notification types
export interface WarrantyExpirationAlert {
  product_id: string;
  serial_number: string;
  product_name: string;
  brand_name: string;
  warranty_end_date: string;
  days_remaining: number;
  alert_level: 'info' | 'warning' | 'critical';
}

// Warranty analytics
export interface WarrantyAnalytics {
  total_products_with_warranty: number;
  active_warranties: number;
  expiring_soon: number; // Within 30 days
  expired: number;
  unknown_status: number;
  average_warranty_months: number;
  expiration_by_month: Record<string, number>; // YYYY-MM format
}

// Warranty extension types
export interface WarrantyExtension {
  physical_product_id: string;
  original_end_date: string;
  new_end_date: string;
  extension_months: number;
  reason: string;
  extended_by_id: string;
}

// Constants
export const WARRANTY_ALERT_THRESHOLDS = {
  INFO: 90, // Days remaining
  WARNING: 30,
  CRITICAL: 7,
} as const;

export const WARRANTY_DEFAULT_MONTHS = 12;
export const WARRANTY_MIN_MONTHS = 1;
export const WARRANTY_MAX_MONTHS = 60;
