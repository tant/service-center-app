/**
 * Type definitions for inventory management system
 */

// ==================== Enums ====================

export type StockDocumentStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'completed'
  | 'cancelled';

export type StockReceiptType =
  | 'normal'      // Phiếu nhập bình thường (mặc định)
  | 'adjustment'; // Phiếu điều chỉnh (kiểm kê/sửa sai sót)

export type StockIssueType =
  | 'normal'      // Phiếu xuất bình thường (mặc định)
  | 'adjustment'; // Phiếu điều chỉnh (kiểm kê/sửa sai sót)

export type TransferStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export type StockStatus = 'ok' | 'warning' | 'critical';

// ==================== Base Interfaces ====================

export interface ProductWarehouseStock {
  id: string;
  product_id: string;
  virtual_warehouse_id: string; // REDESIGNED: Direct reference to virtual warehouse
  declared_quantity: number;
  initial_stock_entry: number;
  created_at: string;
  updated_at: string;
}

// ==================== Stock Receipts ====================

export interface StockReceipt {
  id: string;
  receipt_number: string;
  receipt_type: StockReceiptType;
  status: StockDocumentStatus;
  virtual_warehouse_id: string; // REDESIGNED: Direct reference to virtual warehouse
  receipt_date: string;
  expected_date: string | null;
  completed_at: string | null;
  supplier_id: string | null;
  rma_batch_id: string | null;
  reference_document_number: string | null;
  created_by_id: string;
  approved_by_id: string | null;
  approved_at: string | null;
  completed_by_id: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockReceiptItem {
  id: string;
  receipt_id: string;
  product_id: string;
  declared_quantity: number;
  serial_count: number;
  warranty_start_date: string | null;
  warranty_months: number | null;
  unit_price: number | null;
  total_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockReceiptSerial {
  id: string;
  receipt_item_id: string;
  serial_number: string;
  physical_product_id: string | null;
  warranty_start_date: string | null;
  warranty_months: number | null;
  created_at: string;
}

export interface StockReceiptWithRelations extends StockReceipt {
  items: (StockReceiptItem & {
    product: {
      id: string;
      name: string;
      sku: string | null;
    };
    serials: StockReceiptSerial[];
  })[];
  created_by: {
    id: string;
    full_name: string;
  };
  approved_by?: {
    id: string;
    full_name: string;
  };
  completed_by?: {
    id: string;
    full_name: string;
  };
  attachments: StockDocumentAttachment[];
}

// ==================== Stock Issues ====================

export interface StockIssue {
  id: string;
  issue_number: string;
  issue_type: StockIssueType;
  status: StockDocumentStatus;
  virtual_warehouse_id: string; // REDESIGNED: Direct reference to virtual warehouse
  issue_date: string;
  completed_at: string | null;
  ticket_id: string | null;
  rma_batch_id: string | null;
  reference_document_number: string | null;
  created_by_id: string;
  approved_by_id: string | null;
  approved_at: string | null;
  completed_by_id: string | null;
  auto_generated: boolean;
  auto_approve_threshold: number | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockIssueItem {
  id: string;
  issue_id: string;
  product_id: string;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  notes: string | null;
  created_at: string;
}

export interface StockIssueSerial {
  id: string;
  issue_item_id: string;
  physical_product_id: string;
  serial_number: string;
  created_at: string;
}

export interface StockIssueWithRelations extends StockIssue {
  items: (StockIssueItem & {
    product: {
      id: string;
      name: string;
      sku: string | null;
    };
    serials: (StockIssueSerial & {
      physical_product: {
        serial_number: string;
        warranty_end_date: string | null;
      };
    })[];
  })[];
  created_by: {
    id: string;
    full_name: string;
  };
  approved_by?: {
    id: string;
    full_name: string;
  };
  ticket?: {
    id: string;
    ticket_number: string;
  };
}

// ==================== Stock Transfers ====================

export interface StockTransfer {
  id: string;
  transfer_number: string;
  status: TransferStatus;
  from_virtual_warehouse_id: string; // REDESIGNED: Direct reference to source warehouse
  to_virtual_warehouse_id: string;   // REDESIGNED: Direct reference to destination warehouse
  transfer_date: string;
  expected_delivery_date: string | null;
  completed_at: string | null;
  created_by_id: string;
  approved_by_id: string | null;
  approved_at: string | null;
  received_by_id: string | null;
  generated_issue_id: string | null;   // NEW: Auto-generated issue document
  generated_receipt_id: string | null; // NEW: Auto-generated receipt document
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export interface StockTransferSerial {
  id: string;
  transfer_item_id: string;
  physical_product_id: string;
  serial_number: string;
  created_at: string;
}

// ==================== Attachments ====================

export interface StockDocumentAttachment {
  id: string;
  document_type: 'receipt' | 'issue' | 'transfer';
  document_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by_id: string;
  created_at: string;
}

// ==================== View Types ====================

export interface StockSummary {
  product_id: string;
  product_name: string;
  sku: string | null;
  virtual_warehouse_id: string;        // REDESIGNED: Virtual warehouse reference
  virtual_warehouse_name: string;      // REDESIGNED: Virtual warehouse name
  warehouse_type: string;              // Warehouse type (from virtual warehouse)
  physical_warehouse_id: string | null;
  physical_warehouse_name: string | null;
  declared_quantity: number;
  actual_serial_count: number;
  serial_gap: number;
  initial_stock_entry: number;
  minimum_quantity: number | null;
  reorder_quantity: number | null;
  stock_status: StockStatus;
  created_at: string;
  updated_at: string;
}

export interface AggregatedStock {
  product_id: string;
  product_name: string;
  sku: string | null;
  total_declared: number;
  total_actual: number;
  serial_gap: number;
  stock_status: StockStatus;
}

export interface InventoryStats {
  total_skus: number;
  total_declared: number;
  total_actual: number;
  critical_count: number;
  warning_count: number;
}

export interface PendingApproval {
  document_type: 'receipt' | 'issue' | 'transfer';
  id: string;
  document_number: string;
  sub_type: string;
  status: string;
  document_date: string;
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  total_quantity: number;
  total_value: number;
}
