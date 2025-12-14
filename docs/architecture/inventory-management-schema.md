# Inventory Management System - Database Schema Design

**Version:** 2.1 (UPDATED)
**Date:** 2025-10-31
**Architect:** Winston
**Status:** Implemented & Tested
**Last Update:** Physical Products schema migration complete

---

## 1. Overview

This document defines the database schema for a comprehensive inventory management system that supports:
- **Instance-based warehouses**: Virtual warehouses as UUID instances, NOT enums
- **Dual stock tracking**: Declared quantities vs actual serial numbers
- **Stock documents**: Receipts, Issues, Transfers with simplified workflows
- **Warranty tracking**: Dual end-date model (manufacturer + user), managed separately from stock receipt
- **Auto-generation**: Creating stock issues from completed service tickets
- **RBAC**: Role-based access control for all operations

**⚡ KEY ARCHITECTURAL CHANGE:**
- **OLD**: `virtual_warehouse_type` (enum) - Limited to fixed types
- **NEW**: `virtual_warehouse_id` (UUID) - Unlimited warehouse instances per physical location

---

## 2. Design Principles

### 2.1 Warehouse Architecture (REDESIGNED)

```
Physical Warehouse (location only)
    └── Virtual Warehouse Instance 1 (warranty_stock) [UUID]
    └── Virtual Warehouse Instance 2 (rma_staging) [UUID]
    └── Virtual Warehouse Instance 3 (parts) [UUID]
    └── ... (unlimited instances)
```

**Core Rules:**
1. ✅ **Every virtual warehouse MUST belong to a physical warehouse** (NOT NULL constraint)
2. ✅ **Physical products always stored in virtual warehouses** (virtual_warehouse_id NOT NULL)
3. ✅ **warehouse_type is only for classification/reporting** (not used in foreign keys)
4. ❌ **Physical products NEVER directly in physical warehouses**

### 2.2 Data Integrity
- **Immutable audit trails** for all stock movements
- **Referential integrity** with proper foreign keys using UUIDs
- **Constraint validation** at database level
- **Transaction atomicity** for multi-step operations

### 2.3 Dual Stock Tracking
```
Declared Quantity (claimed) ≥ Actual Serial Count (verified)
```
- **Declared**: Number entered in stock receipt (e.g., 20 units)
- **Actual**: Count of physical_products records with serials (e.g., 18 units)
- **Gap**: Declared - Actual = serials yet to be scanned (e.g., 2 units)

### 2.4 Workflow States (SIMPLIFIED)
```
draft → approved → completed
  ↓        ↓          ↓
cancelled cancelled cancelled
```
- **Stock changes only apply when status = 'completed'**
- **Removed 'pending_approval' state** for simpler workflow

---

## 3. ENUM Types

### 3.1 Warehouse Type (Classification Only)
```sql
CREATE TYPE public.warehouse_type AS ENUM (
  'main',              -- Kho chính
  'warranty_stock',    -- Kho bảo hành
  'rma_staging',       -- Khu vực RMA
  'dead_stock',        -- Kho hàng hỏng
  'in_service',        -- Đang sử dụng/sửa chữa
  'parts'              -- Kho linh kiện
);
```
**⚠️ IMPORTANT**: This is for UI display and reporting ONLY. Foreign keys use `virtual_warehouse_id` UUID.

### 3.1b Physical Product Status (Added 2025-11-05)
```sql
CREATE TYPE public.physical_product_status AS ENUM (
  'draft',        -- From unapproved receipt (temporary, can be deleted)
  'active',       -- In stock, available (receipt approved)
  'transferring', -- In draft issue/transfer document (locked, cannot be selected by other documents)
  'issued',       -- Issued out (via approved stock issue document)
  'disposed'      -- Disposed/scrapped (no longer usable)
);
```

**Lifecycle Flow:**
```
draft → active → transferring → issued (OR disposed)
                      ↓
                   active (on cancel/remove)
```

**Key Features:**
- ✅ Prevents double-selection: Only 'active' products can be selected for new documents
- ✅ Auto cleanup: 'draft' products deleted when receipt cancelled
- ✅ Accurate stock: Only 'active' products count toward available stock
- ✅ Full audit: Complete lifecycle tracking

### 3.2 Stock Document Status (SIMPLIFIED)
```sql
CREATE TYPE public.stock_document_status AS ENUM (
  'draft',              -- Being created/edited
  'approved',           -- Manager approved, ready to execute
  'completed',          -- Executed, stock updated
  'cancelled'           -- Cancelled (terminal state)
);
```

### 3.3 Stock Receipt Type (SIMPLIFIED)
```sql
CREATE TYPE public.stock_receipt_type AS ENUM (
  'normal',            -- Standard receipt (supplier, transfer-in, etc.)
  'adjustment'         -- Inventory adjustment
);
```

### 3.4 Stock Issue Type (SIMPLIFIED)
```sql
CREATE TYPE public.stock_issue_type AS ENUM (
  'normal',            -- Standard issue (parts, transfers, etc.)
  'adjustment'         -- Inventory adjustment (can be negative)
);
```

### 3.5 Transfer Status
```sql
CREATE TYPE public.transfer_status AS ENUM (
  'draft',
  'approved',
  'in_transit',         -- Goods are being moved
  'completed',
  'cancelled'
);
```

---

## 4. Core Tables (REDESIGNED SCHEMA)

### 4.1 Virtual Warehouses (Instance-Based)
```sql
CREATE TABLE IF NOT EXISTS public.virtual_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  warehouse_type public.warehouse_type NOT NULL,
  physical_warehouse_id UUID NOT NULL REFERENCES public.physical_warehouses(id) ON DELETE CASCADE,

  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_virtual_warehouses_physical
  ON public.virtual_warehouses(physical_warehouse_id);
CREATE INDEX idx_virtual_warehouses_type
  ON public.virtual_warehouses(warehouse_type);

COMMENT ON TABLE public.virtual_warehouses IS
  'Virtual warehouse instances - each belongs to a physical warehouse';
COMMENT ON COLUMN public.virtual_warehouses.physical_warehouse_id IS
  'Physical warehouse that this virtual warehouse belongs to (required - every virtual warehouse must belong to a physical warehouse)';
COMMENT ON COLUMN public.virtual_warehouses.warehouse_type IS
  'Classification for UI/reporting only - NOT used in foreign keys';
```

### 4.2 Physical Products (Using virtual_warehouse_id)
```sql
CREATE TABLE IF NOT EXISTS public.physical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  serial_number VARCHAR(255) NOT NULL,
  condition public.product_condition NOT NULL DEFAULT 'new',

  -- ✅ REDESIGNED: Direct reference to virtual warehouse instance
  virtual_warehouse_id UUID NOT NULL
    REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,

  -- ✅ NEW: Track previous warehouse for RMA batch management
  previous_virtual_warehouse_id UUID
    REFERENCES public.virtual_warehouses(id) ON DELETE SET NULL,

  -- ✅ NEW (2025-11-05): Lifecycle status tracking
  status public.physical_product_status NOT NULL DEFAULT 'draft',

  -- Warranty (managed separately at /inventory/products)
  manufacturer_warranty_end_date DATE,
  user_warranty_end_date DATE,

  -- Relationships
  current_ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,
  rma_batch_id UUID REFERENCES public.rma_batches(id) ON DELETE SET NULL,
  rma_reason TEXT,
  rma_date DATE,
  supplier_id UUID,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),

  -- Customer tracking (Added Oct 30, 2025)
  last_known_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT physical_products_serial_unique UNIQUE(serial_number)
);

CREATE INDEX idx_physical_products_virtual_warehouse
  ON public.physical_products(virtual_warehouse_id);
CREATE INDEX idx_physical_products_previous_virtual_warehouse
  ON public.physical_products(previous_virtual_warehouse_id)
  WHERE previous_virtual_warehouse_id IS NOT NULL;
CREATE INDEX idx_physical_products_last_customer
  ON public.physical_products(last_known_customer_id)
  WHERE last_known_customer_id IS NOT NULL;
CREATE INDEX idx_physical_products_status
  ON public.physical_products(status);

COMMENT ON TABLE public.physical_products IS
  'Serialized product instances with warranty and location tracking (REDESIGNED 2025-10-31, STATUS added 2025-11-05)';
COMMENT ON COLUMN public.physical_products.virtual_warehouse_id IS
  'Virtual warehouse instance where this product is currently located (required - UUID not ENUM)';
COMMENT ON COLUMN public.physical_products.previous_virtual_warehouse_id IS
  'Previous virtual warehouse before RMA - used to restore product location when removed from RMA batch';
COMMENT ON COLUMN public.physical_products.status IS
  'Lifecycle status: draft → active → transferring → issued/disposed. Prevents double-selection and enables cleanup.';
COMMENT ON COLUMN public.physical_products.last_known_customer_id IS
  'Last known customer who owns/received this product. Updated when product moves to customer_installed warehouse.';
```

### 4.3 Product Warehouse Stock (Instance-Based)
```sql
CREATE TABLE IF NOT EXISTS public.product_warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,

  -- Dual tracking
  declared_quantity INT NOT NULL DEFAULT 0,
  initial_stock_entry INT NOT NULL DEFAULT 0,  -- Only admin can modify

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_warehouse_stock_unique
    UNIQUE(product_id, virtual_warehouse_id),
  CONSTRAINT declared_quantity_non_negative
    CHECK (declared_quantity >= 0),
  CONSTRAINT initial_stock_non_negative
    CHECK (initial_stock_entry >= 0)
);

CREATE INDEX idx_product_warehouse_stock_product
  ON public.product_warehouse_stock(product_id);
CREATE INDEX idx_product_warehouse_stock_warehouse
  ON public.product_warehouse_stock(virtual_warehouse_id);

COMMENT ON TABLE public.product_warehouse_stock IS
  'Tracks declared stock quantities per product-warehouse instance combination (REDESIGNED)';
COMMENT ON COLUMN public.product_warehouse_stock.virtual_warehouse_id IS
  'Virtual warehouse instance UUID (NOT warehouse_type enum)';
```

### 4.4 Stock Receipts (REDESIGNED)
```sql
CREATE TABLE IF NOT EXISTS public.stock_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  receipt_type public.stock_receipt_type NOT NULL,
  status public.stock_document_status NOT NULL DEFAULT 'draft',

  -- Warehouse (UUID instance)
  virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,

  -- Dates
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,

  -- Related documents
  supplier_name VARCHAR(255),
  rma_batch_id UUID REFERENCES public.rma_batches(id) ON DELETE SET NULL,
  reference_document_number VARCHAR(100),

  -- People
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_receipts_status ON public.stock_receipts(status);
CREATE INDEX idx_stock_receipts_warehouse ON public.stock_receipts(virtual_warehouse_id);

COMMENT ON TABLE public.stock_receipts IS
  'Stock receipt documents (Phiếu Nhập Kho) - REDESIGNED with virtual_warehouse_id';
COMMENT ON COLUMN public.stock_receipts.virtual_warehouse_id IS
  'Virtual warehouse instance receiving the goods (UUID, not enum)';
```

### 4.5 Stock Issues (REDESIGNED)
```sql
CREATE TABLE IF NOT EXISTS public.stock_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number VARCHAR(50) NOT NULL UNIQUE,
  issue_type public.stock_issue_type NOT NULL,
  status public.stock_document_status NOT NULL DEFAULT 'draft',

  -- Warehouse (UUID instance)
  virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,

  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,

  -- Related documents
  ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,
  rma_batch_id UUID REFERENCES public.rma_batches(id) ON DELETE SET NULL,
  reference_document_number VARCHAR(100),

  -- People
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Auto-generation
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  auto_approve_threshold DECIMAL(12,2),

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_issues_status ON public.stock_issues(status);
CREATE INDEX idx_stock_issues_warehouse ON public.stock_issues(virtual_warehouse_id);
CREATE INDEX idx_stock_issues_ticket ON public.stock_issues(ticket_id);

COMMENT ON TABLE public.stock_issues IS
  'Stock issue documents (Phiếu Xuất Kho) - REDESIGNED with virtual_warehouse_id';
COMMENT ON COLUMN public.stock_issues.virtual_warehouse_id IS
  'Virtual warehouse instance issuing the goods (UUID, not enum)';
```

### 4.6 Stock Transfers (REDESIGNED)
```sql
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(50) NOT NULL UNIQUE,
  status public.transfer_status NOT NULL DEFAULT 'draft',

  -- Source and destination (UUID instances)
  from_virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,
  to_virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,

  -- Dates
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  completed_at TIMESTAMPTZ,

  -- People
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  received_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transfer_warehouses_different
    CHECK (from_virtual_warehouse_id != to_virtual_warehouse_id)
);

CREATE INDEX idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX idx_stock_transfers_from ON public.stock_transfers(from_virtual_warehouse_id);
CREATE INDEX idx_stock_transfers_to ON public.stock_transfers(to_virtual_warehouse_id);

COMMENT ON TABLE public.stock_transfers IS
  'Stock transfer documents (Phiếu Chuyển Kho) - REDESIGNED with virtual_warehouse_id';
COMMENT ON COLUMN public.stock_transfers.from_virtual_warehouse_id IS
  'Source virtual warehouse instance (UUID, not enum)';
COMMENT ON COLUMN public.stock_transfers.to_virtual_warehouse_id IS
  'Destination virtual warehouse instance (UUID, not enum)';
```

### 4.7 Stock Movements (Audit Trail - REDESIGNED)
```sql
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS from_virtual_warehouse_id UUID
    REFERENCES public.virtual_warehouses(id) ON DELETE SET NULL;

ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS to_virtual_warehouse_id UUID
    REFERENCES public.virtual_warehouses(id) ON DELETE SET NULL;

CREATE INDEX idx_stock_movements_from_warehouse
  ON public.stock_movements(from_virtual_warehouse_id);
CREATE INDEX idx_stock_movements_to_warehouse
  ON public.stock_movements(to_virtual_warehouse_id);

COMMENT ON COLUMN public.stock_movements.from_virtual_warehouse_id IS
  'Source virtual warehouse instance (UUID)';
COMMENT ON COLUMN public.stock_movements.to_virtual_warehouse_id IS
  'Destination virtual warehouse instance (UUID)';
```

---

## 5. Views for Reporting (REDESIGNED)

### 5.1 Stock Summary (with JOINs)
```sql
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.sku,
  pws.virtual_warehouse_id,
  vw.name as virtual_warehouse_name,
  vw.warehouse_type,
  vw.physical_warehouse_id,
  pw.name as physical_warehouse_name,
  pws.declared_quantity,
  COALESCE(
    (SELECT COUNT(*)
     FROM physical_products pp
     WHERE pp.product_id = p.id
       AND pp.virtual_warehouse_id = vw.id
    ), 0
  ) as actual_serial_count,
  pws.declared_quantity - COALESCE(
    (SELECT COUNT(*)
     FROM physical_products pp
     WHERE pp.product_id = p.id
       AND pp.virtual_warehouse_id = vw.id
    ), 0
  ) as serial_gap,
  pws.initial_stock_entry,
  pst.minimum_quantity,
  pst.reorder_quantity,
  CASE
    WHEN pws.declared_quantity = 0 THEN 'critical'
    WHEN pst.minimum_quantity IS NOT NULL
         AND pws.declared_quantity <= pst.minimum_quantity THEN 'warning'
    ELSE 'ok'
  END as stock_status,
  pws.created_at,
  pws.updated_at
FROM product_warehouse_stock pws
JOIN products p ON p.id = pws.product_id
JOIN virtual_warehouses vw ON vw.id = pws.virtual_warehouse_id
LEFT JOIN physical_warehouses pw ON pw.id = vw.physical_warehouse_id
LEFT JOIN product_stock_thresholds pst
  ON pst.product_id = pws.product_id
  AND pst.warehouse_type = vw.warehouse_type;

COMMENT ON VIEW v_stock_summary IS 'Complete stock overview with declared vs actual tracking (REDESIGNED)';
```

### 5.2 Warehouse Stock Levels (with JOINs)
```sql
CREATE OR REPLACE VIEW public.v_warehouse_stock_levels AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  vw.warehouse_type,
  pp.condition,
  COUNT(*) AS quantity,
  COUNT(*) FILTER (WHERE (pp.user_warranty_end_date IS NOT NULL OR pp.manufacturer_warranty_end_date IS NOT NULL)
    AND COALESCE(pp.user_warranty_end_date, pp.manufacturer_warranty_end_date) > CURRENT_DATE + INTERVAL '30 days') AS active_warranty_count,
  COUNT(*) FILTER (WHERE (pp.user_warranty_end_date IS NOT NULL OR pp.manufacturer_warranty_end_date IS NOT NULL)
    AND COALESCE(pp.user_warranty_end_date, pp.manufacturer_warranty_end_date) > CURRENT_DATE
    AND COALESCE(pp.user_warranty_end_date, pp.manufacturer_warranty_end_date) <= CURRENT_DATE + INTERVAL '30 days') AS expiring_soon_count,
  COUNT(*) FILTER (WHERE (pp.user_warranty_end_date IS NOT NULL OR pp.manufacturer_warranty_end_date IS NOT NULL)
    AND COALESCE(pp.user_warranty_end_date, pp.manufacturer_warranty_end_date) <= CURRENT_DATE) AS expired_count,
  SUM(pp.purchase_price) AS total_purchase_value,
  AVG(pp.purchase_price) AS avg_purchase_price,
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,
  pst.alert_enabled,
  CASE WHEN pst.minimum_quantity IS NOT NULL
    AND COUNT(*) < pst.minimum_quantity THEN true ELSE false END AS is_below_minimum,
  MIN(pp.created_at) AS oldest_stock_date,
  MAX(pp.created_at) AS newest_stock_date
FROM public.physical_products pp
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
JOIN public.virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
LEFT JOIN public.product_stock_thresholds pst
  ON pst.product_id = p.id AND pst.warehouse_type = vw.warehouse_type
GROUP BY p.id, p.name, p.sku, b.name, vw.warehouse_type, pp.condition,
  pst.minimum_quantity, pst.reorder_quantity, pst.maximum_quantity, pst.alert_enabled
ORDER BY b.name, p.name, vw.warehouse_type;

COMMENT ON VIEW public.v_warehouse_stock_levels IS
  'Real-time stock levels by product, warehouse type, and condition with threshold alerts (REDESIGNED)';
```

---

## 6. Key Triggers (REDESIGNED)

### 6.1 Receipt Completion
```sql
CREATE OR REPLACE FUNCTION process_stock_receipt_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update product_warehouse_stock declared quantities using virtual_warehouse_id
    INSERT INTO product_warehouse_stock (
      product_id,
      virtual_warehouse_id,
      declared_quantity
    )
    SELECT
      sri.product_id,
      NEW.virtual_warehouse_id,  -- UUID instance, not enum
      SUM(sri.declared_quantity)
    FROM stock_receipt_items sri
    WHERE sri.receipt_id = NEW.id
    GROUP BY sri.product_id
    ON CONFLICT (product_id, virtual_warehouse_id)
    DO UPDATE SET
      declared_quantity = product_warehouse_stock.declared_quantity + EXCLUDED.declared_quantity,
      updated_at = NOW();

    -- Create physical_products records with virtual_warehouse_id
    INSERT INTO physical_products (
      product_id,
      serial_number,
      condition,
      virtual_warehouse_id,  -- UUID instance
      manufacturer_warranty_end_date,
      user_warranty_end_date
    )
    SELECT
      sri.product_id,
      srs.serial_number,
      'new',
      NEW.virtual_warehouse_id,
      srs.manufacturer_warranty_end_date,
      srs.user_warranty_end_date
    FROM stock_receipt_items sri
    JOIN stock_receipt_serials srs ON srs.receipt_item_id = sri.id
    WHERE sri.receipt_id = NEW.id
    ON CONFLICT (serial_number) DO NOTHING;

    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 6.2 Warranty Management

**Warranty Data Model:**
- **manufacturer_warranty_end_date** (DATE, nullable) - Warranty from manufacturer
- **user_warranty_end_date** (DATE, nullable) - Extended warranty for end user

**Workflow:**
```
1. Stock Receipt → Add serials WITHOUT warranty info (NULL values)
   └── CSV Format: serial_number (one per line)

2. Products Page → Manage warranty separately
   ├── Individual Edit: Update via Edit Product Drawer
   └── Bulk Update: Upload CSV with warranty dates
       Format: serial_number,manufacturer_warranty_end_date,user_warranty_end_date
```

**Key Points:**
- ✅ Warranty fields are NULLABLE - not required during stock receipt
- ✅ Warranty managed separately in `/inventory/products` page
- ✅ Supports dual warranty: manufacturer + user (extended)
- ✅ Date-based (end dates) instead of start_date + months calculation
- ✅ Priority: user_warranty_end_date > manufacturer_warranty_end_date for status checks

---

## 7. Migration from Old Schema

### 7.1 Key Changes
```sql
-- OLD: enum-based references
virtual_warehouse_type public.warehouse_type NOT NULL

-- NEW: UUID-based references
virtual_warehouse_id UUID NOT NULL REFERENCES virtual_warehouses(id)
```

### 7.2 Migration Steps
1. Add `virtual_warehouse_id` column to all tables (nullable first)
2. Create migration function to map `virtual_warehouse_type` → `virtual_warehouse_id`
3. Populate `virtual_warehouse_id` based on lookup
4. Make `virtual_warehouse_id` NOT NULL
5. Drop old `virtual_warehouse_type` columns
6. Recreate all views with JOINs

---

## 8. Benefits of Redesign

### 8.1 Flexibility
✅ Unlimited warehouse instances per physical location
✅ Can have multiple "warranty_stock" warehouses if needed
✅ Easy to add new virtual warehouses without schema changes

### 8.2 Referential Integrity
✅ Foreign key constraints work properly (UUIDs)
✅ CASCADE deletes work correctly
✅ No orphaned references

### 8.3 Reporting
✅ JOIN with virtual_warehouses table for details
✅ warehouse_type still available for classification
✅ Physical warehouse info easily accessible

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-31 | Initial redesign - Virtual warehouse UUID migration |
| 1.1 | 2025-11-05 | Added `physical_product_status` ENUM and lifecycle tracking system |

---

**End of Schema Design Document**
**Version:** 1.1
**Last Updated:** 2025-11-05
