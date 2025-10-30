// Warehouse Management Types
// Types for physical/virtual warehouses, products, and stock management

import type { Database } from './database.types';
import type { WarehouseType, ProductCondition, MovementType } from './enums';

// Database table types
export type PhysicalWarehouse = Database['public']['Tables']['physical_warehouses']['Row'];
export type PhysicalWarehouseInsert = Database['public']['Tables']['physical_warehouses']['Insert'];
export type PhysicalWarehouseUpdate = Database['public']['Tables']['physical_warehouses']['Update'];

export type VirtualWarehouse = Database['public']['Tables']['virtual_warehouses']['Row'];
export type VirtualWarehouseInsert = Database['public']['Tables']['virtual_warehouses']['Insert'];
export type VirtualWarehouseUpdate = Database['public']['Tables']['virtual_warehouses']['Update'];

export type PhysicalProduct = Database['public']['Tables']['physical_products']['Row'];
export type PhysicalProductInsert = Database['public']['Tables']['physical_products']['Insert'];
export type PhysicalProductUpdate = Database['public']['Tables']['physical_products']['Update'];

export type StockMovement = Database['public']['Tables']['stock_movements']['Row'];
export type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert'];

export type ProductStockThreshold = Database['public']['Tables']['product_stock_thresholds']['Row'];
export type ProductStockThresholdInsert = Database['public']['Tables']['product_stock_thresholds']['Insert'];
export type ProductStockThresholdUpdate = Database['public']['Tables']['product_stock_thresholds']['Update'];

export type RMABatch = Database['public']['Tables']['rma_batches']['Row'];
export type RMABatchInsert = Database['public']['Tables']['rma_batches']['Insert'];
export type RMABatchUpdate = Database['public']['Tables']['rma_batches']['Update'];

// View types
// TODO: Re-enable when views are recreated in migrations
// export type WarehouseStockLevel = Database['public']['Views']['v_warehouse_stock_levels']['Row'];
// export type StockMovementHistory = Database['public']['Views']['v_stock_movement_history']['Row'];
// export type LowStockAlert = Database['public']['Views']['v_low_stock_alerts']['Row'];

// Extended types with relations
export interface PhysicalProductWithDetails extends PhysicalProduct {
  product: {
    id: string;
    name: string;
    sku: string;
    brand: {
      name: string;
    };
  };
  physical_warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  current_ticket?: {
    id: string;
    ticket_number: string;
    status: string;
  };
}

export interface StockMovementWithDetails extends StockMovement {
  physical_product: {
    id: string;
    serial_number: string;
    product: {
      name: string;
      sku: string;
    };
  };
  moved_by: {
    id: string;
    full_name: string;
  };
  from_physical_warehouse?: {
    name: string;
    code: string;
  };
  to_physical_warehouse?: {
    name: string;
    code: string;
  };
}

// Form types
export interface PhysicalProductFormData {
  product_id: string;
  serial_number: string;
  condition: ProductCondition;
  virtual_warehouse_id: string; // Changed to virtual warehouse ID
  physical_warehouse_id?: string;
  manufacturer_warranty_end_date?: string;
  user_warranty_end_date?: string;
  supplier_id?: string;
  supplier_name?: string;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
  photo_urls?: string[];
}

export interface StockMovementFormData {
  physical_product_id: string;
  movement_type: MovementType;
  from_virtual_warehouse_id?: string; // Changed to virtual warehouse ID
  to_virtual_warehouse_id?: string; // Changed to virtual warehouse ID
  from_physical_warehouse_id?: string;
  to_physical_warehouse_id?: string;
  ticket_id?: string;
  reason?: string;
  notes?: string;
}

export interface ProductStockThresholdFormData {
  product_id: string;
  warehouse_type: WarehouseType;
  minimum_quantity: number;
  reorder_quantity?: number;
  maximum_quantity?: number;
  alert_enabled: boolean;
}

export interface RMABatchFormData {
  supplier_id?: string;
  status: string;
  shipping_date?: string;
  tracking_number?: string;
  notes?: string;
}

// Bulk import types
export interface BulkProductImportRow {
  serial_number: string;
  product_sku: string;
  condition: ProductCondition;
  virtual_warehouse_name: string; // Changed to virtual warehouse name (will be resolved to ID)
  physical_warehouse_code?: string;
  manufacturer_warranty_end_date?: string;
  user_warranty_end_date?: string;
  supplier_name?: string;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
}

export interface BulkProductImportResult {
  total: number;
  success: number;
  failed: number;
  errors: {
    row: number;
    serial_number: string;
    error: string;
  }[];
}

// Stock verification types
export interface SerialVerification {
  serial_number: string;
  exists: boolean;
  product?: {
    id: string;
    name: string;
    sku: string;
    brand_name: string;
  };
  current_location?: {
    virtual_warehouse_id: string; // Changed to virtual warehouse ID
    virtual_warehouse_name?: string; // Optional name for display
    physical_warehouse?: string;
  };
  warranty_status?: string;
  current_ticket_id?: string;
}

// Stock analytics types
export interface WarehouseAnalytics {
  total_products: number;
  by_warehouse: Record<WarehouseType, number>;
  by_condition: Record<ProductCondition, number>;
  low_stock_count: number;
  warranty_expiring_soon_count: number;
  total_value: number;
}
