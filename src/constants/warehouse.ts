// Warehouse Management Constants
// Constants for warehouse operations, stock management, and product tracking

import type { WarehouseType, ProductCondition, MovementType } from '@/types/enums';

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * Vietnamese display names for virtual warehouse types
 */
export const WAREHOUSE_TYPE_LABELS: Record<WarehouseType, string> = {
  warranty_stock: 'Kho Bảo Hành',
  rma_staging: 'Khu Vực RMA',
  dead_stock: 'Kho Hàng Hỏng',
  in_service: 'Đang Sử Dụng',
  parts: 'Kho Linh Kiện',
};

// Warehouse type colors for UI
export const WAREHOUSE_TYPE_COLORS: Record<WarehouseType, string> = {
  warranty_stock: '#10B981', // Green
  rma_staging: '#F59E0B', // Orange
  dead_stock: '#EF4444', // Red
  in_service: '#3B82F6', // Blue
  parts: '#8B5CF6', // Purple
};

// Product condition colors for UI
export const PRODUCT_CONDITION_COLORS: Record<ProductCondition, string> = {
  new: '#10B981', // Green
  refurbished: '#3B82F6', // Blue
  used: '#6B7280', // Gray
  faulty: '#EF4444', // Red
  for_parts: '#F59E0B', // Orange
};

// Movement type icons (lucide-react icon names)
export const MOVEMENT_TYPE_ICONS: Record<MovementType, string> = {
  receipt: 'package-plus',
  transfer: 'arrow-right-left',
  assignment: 'clipboard-check',
  return: 'undo-2',
  disposal: 'trash-2',
};

// Warehouse type descriptions
export const WAREHOUSE_TYPE_DESCRIPTIONS: Record<WarehouseType, string> = {
  warranty_stock: 'Products available for warranty replacements',
  rma_staging: 'Products staged for return to supplier',
  dead_stock: 'Non-functional products for disposal',
  in_service: 'Products currently in service tickets',
  parts: 'Individual parts and components',
};

// Product condition descriptions
export const PRODUCT_CONDITION_DESCRIPTIONS: Record<ProductCondition, string> = {
  new: 'Brand new, unused product',
  refurbished: 'Professionally refurbished and tested',
  used: 'Previously used, good working condition',
  faulty: 'Not working properly, needs repair',
  for_parts: 'Not functional, can be used for parts',
};

// Stock movement types
export const MOVEMENT_TYPE_OPTIONS: { value: MovementType; label: string; description: string }[] = [
  { value: 'receipt', label: 'Receipt', description: 'Product received from supplier' },
  { value: 'transfer', label: 'Transfer', description: 'Move between warehouse locations' },
  { value: 'assignment', label: 'Assignment', description: 'Assign to service ticket' },
  { value: 'return', label: 'Return', description: 'Return from service ticket' },
  { value: 'disposal', label: 'Disposal', description: 'Product disposed or scrapped' },
];

// Stock threshold defaults
export const STOCK_THRESHOLD_DEFAULTS = {
  minimum_quantity: 5,
  reorder_quantity: 10,
  maximum_quantity: 100,
  alert_enabled: true,
} as const;

// Stock alert levels
export const STOCK_ALERT_LEVELS = {
  critical: 0.2, // 20% of minimum
  warning: 0.5, // 50% of minimum
  low: 1.0, // At minimum
} as const;

// Serial number validation
export const SERIAL_NUMBER_VALIDATION = {
  min_length: 5,
  max_length: 255,
  pattern: /^[A-Z0-9-]+$/i,
} as const;

// Bulk import validation
export const BULK_IMPORT_VALIDATION = {
  max_rows: 1000,
  max_file_size_mb: 10,
  allowed_extensions: ['.csv', '.xlsx'],
  required_columns: ['serial_number', 'product_sku', 'condition', 'warehouse_type'],
} as const;

// Warehouse permissions
export const WAREHOUSE_PERMISSIONS = {
  can_create_warehouse: ['admin', 'manager'],
  can_edit_warehouse: ['admin', 'manager'],
  can_delete_warehouse: ['admin'],
  can_receive_products: ['admin', 'manager', 'reception'],
  can_move_products: ['admin', 'manager', 'technician'],
  can_dispose_products: ['admin', 'manager'],
  can_view_all_movements: ['admin', 'manager'],
  can_export_stock: ['admin', 'manager'],
  can_import_stock: ['admin', 'manager'],
} as const;

// Photo upload settings
export const WAREHOUSE_PHOTO_SETTINGS = {
  max_photos_per_product: 5,
  max_file_size_mb: 5,
  allowed_formats: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  compression_quality: 0.8,
  thumbnail_size: 200,
} as const;

// RMA batch settings
export const RMA_BATCH_SETTINGS = {
  batch_number_prefix: 'RMA-',
  batch_number_format: 'RMA-YYYY-MM-NNN',
  max_products_per_batch: 50,
  statuses: ['draft', 'submitted', 'shipped', 'received', 'completed'],
} as const;

// Stock verification settings
export const STOCK_VERIFICATION = {
  enable_duplicate_check: true,
  enable_serial_photo: true,
  enable_condition_verification: true,
  verification_timeout_seconds: 120,
} as const;

// Warehouse analytics periods
export const ANALYTICS_PERIODS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
] as const;

// Export formats
export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', extension: '.csv' },
  { value: 'xlsx', label: 'Excel', extension: '.xlsx' },
  { value: 'pdf', label: 'PDF Report', extension: '.pdf' },
] as const;

// Default filters
export const DEFAULT_WAREHOUSE_FILTERS = {
  warehouse_type: 'all',
  condition: 'all',
  warranty_status: 'all',
  search: '',
  page: 1,
  limit: 50,
} as const;
