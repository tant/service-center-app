# Inventory Management System - Database Schema Design

**Version:** 1.0
**Date:** 2025-01-27
**Architect:** Winston
**Status:** Design Phase

---

## 1. Overview

This document defines the database schema for a comprehensive inventory management system that supports:
- **Dual stock tracking**: Declared quantities vs actual serial numbers
- **Stock documents**: Receipts, Issues, Transfers with approval workflows
- **Warranty tracking**: Manufacturer + End-user warranties
- **Break down flows**: Disassembling products for parts recovery
- **Auto-generation**: Creating stock issues from completed service tickets
- **RBAC**: Role-based access control for all operations

---

## 2. Design Principles

### 2.1 Data Integrity
- **Immutable audit trails** for all stock movements
- **Referential integrity** with proper foreign keys
- **Constraint validation** at database level
- **Transaction atomicity** for multi-step operations

### 2.2 Dual Stock Tracking
```
Declared Quantity (claimed) ≥ Actual Serial Count (verified)
```
- **Declared**: Number entered in stock receipt (e.g., 20 units)
- **Actual**: Count of physical_products records with serials (e.g., 18 units)
- **Gap**: Declared - Actual = serials yet to be scanned (e.g., 2 units)

### 2.3 Workflow States
All stock documents follow approval flow:
```
draft → pending_approval → approved → completed
  ↓           ↓              ↓
cancelled  cancelled     cancelled
```
- **Stock changes only apply when status = 'completed'**
- **No edits after 'approved'** (must cancel & recreate)

---

## 3. New ENUM Types

### 3.1 Stock Document Status
```sql
CREATE TYPE public.stock_document_status AS ENUM (
  'draft',              -- Being created/edited
  'pending_approval',   -- Submitted for manager review
  'approved',           -- Manager approved, ready to execute
  'completed',          -- Executed, stock updated
  'cancelled'           -- Cancelled (terminal state)
);
```

### 3.2 Stock Receipt Type
```sql
CREATE TYPE public.stock_receipt_type AS ENUM (
  'supplier_receipt',   -- New inventory from supplier
  'rma_return',         -- Products returned from supplier RMA
  'transfer_in',        -- Received from another warehouse
  'breakdown',          -- Parts recovered from product breakdown
  'adjustment_in'       -- Inventory adjustment (increase)
);
```

### 3.3 Stock Issue Type
```sql
CREATE TYPE public.stock_issue_type AS ENUM (
  'warranty_return',    -- Sending replacement to customer
  'parts_usage',        -- Parts consumed in repair (from ticket)
  'rma_out',            -- Sending defective products to supplier
  'transfer_out',       -- Sending to another warehouse
  'disposal',           -- Scrapping/destroying items
  'adjustment_out'      -- Inventory adjustment (decrease)
);
```

### 3.4 Transfer Status (Extended)
```sql
CREATE TYPE public.transfer_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'in_transit',         -- Goods are being moved
  'completed',
  'cancelled'
);
```

---

## 4. Schema Modifications to Existing Tables

### 4.1 Products Table (Add Columns)
```sql
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS
  default_warranty_months INT;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS
  end_user_warranty_months INT DEFAULT 12;

COMMENT ON COLUMN public.products.default_warranty_months IS
  'Default manufacturer warranty period for new products';

COMMENT ON COLUMN public.products.end_user_warranty_months IS
  'Warranty period offered to end customers';
```

### 4.2 Physical Products Table (Add End-User Warranty)
```sql
ALTER TABLE public.physical_products ADD COLUMN IF NOT EXISTS
  end_user_warranty_start DATE;

ALTER TABLE public.physical_products ADD COLUMN IF NOT EXISTS
  end_user_warranty_months INT;

ALTER TABLE public.physical_products ADD COLUMN IF NOT EXISTS
  end_user_warranty_end DATE;

COMMENT ON COLUMN public.physical_products.end_user_warranty_start IS
  'Start date of warranty offered to end customer (from ticket completion)';

-- Trigger to calculate end-user warranty end date
CREATE OR REPLACE FUNCTION calculate_end_user_warranty_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_user_warranty_start IS NOT NULL
     AND NEW.end_user_warranty_months IS NOT NULL THEN
    NEW.end_user_warranty_end := NEW.end_user_warranty_start
      + (NEW.end_user_warranty_months || ' months')::INTERVAL;
  ELSE
    NEW.end_user_warranty_end := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_physical_products_end_user_warranty_calculation
  BEFORE INSERT OR UPDATE ON public.physical_products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_end_user_warranty_end_date();
```

### 4.3 Movement Type ENUM (Extend)
```sql
-- Add new movement types
ALTER TYPE public.movement_type ADD VALUE IF NOT EXISTS 'receipt';
ALTER TYPE public.movement_type ADD VALUE IF NOT EXISTS 'issue';
ALTER TYPE public.movement_type ADD VALUE IF NOT EXISTS 'breakdown';
```

---

## 5. New Core Tables

### 5.1 Product Warehouse Stock (Declared Quantities)
```sql
CREATE TABLE IF NOT EXISTS public.product_warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  virtual_warehouse_type public.warehouse_type NOT NULL,
  physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  -- Dual tracking
  declared_quantity INT NOT NULL DEFAULT 0,
  actual_serial_count INT NOT NULL DEFAULT 0 GENERATED ALWAYS AS (
    (SELECT COUNT(*) FROM public.physical_products pp
     WHERE pp.product_id = product_warehouse_stock.product_id
       AND pp.virtual_warehouse_type = product_warehouse_stock.virtual_warehouse_type
       AND (pp.physical_warehouse_id = product_warehouse_stock.physical_warehouse_id
            OR (pp.physical_warehouse_id IS NULL AND product_warehouse_stock.physical_warehouse_id IS NULL))
    )
  ) STORED,

  initial_stock_entry INT NOT NULL DEFAULT 0,  -- Only admin can modify

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_warehouse_stock_unique
    UNIQUE(product_id, virtual_warehouse_type, physical_warehouse_id),
  CONSTRAINT declared_quantity_non_negative
    CHECK (declared_quantity >= 0),
  CONSTRAINT initial_stock_non_negative
    CHECK (initial_stock_entry >= 0)
);

CREATE INDEX idx_product_warehouse_stock_product
  ON public.product_warehouse_stock(product_id);
CREATE INDEX idx_product_warehouse_stock_virtual_warehouse
  ON public.product_warehouse_stock(virtual_warehouse_type);
CREATE INDEX idx_product_warehouse_stock_physical_warehouse
  ON public.product_warehouse_stock(physical_warehouse_id);

COMMENT ON TABLE public.product_warehouse_stock IS
  'Tracks declared stock quantities vs actual serial counts per product-warehouse combination';
COMMENT ON COLUMN public.product_warehouse_stock.declared_quantity IS
  'Total quantity claimed in stock receipts (may exceed actual_serial_count)';
COMMENT ON COLUMN public.product_warehouse_stock.actual_serial_count IS
  'Computed count of physical_products with serial numbers';
COMMENT ON COLUMN public.product_warehouse_stock.initial_stock_entry IS
  'Initial stock when setting up system (admin-only field)';
```

### 5.2 Stock Receipts (Phiếu Nhập Kho)
```sql
CREATE TABLE IF NOT EXISTS public.stock_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  receipt_type public.stock_receipt_type NOT NULL,
  status public.stock_document_status NOT NULL DEFAULT 'draft',

  -- Warehouses
  virtual_warehouse_type public.warehouse_type NOT NULL,
  physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  -- Dates
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  completed_at TIMESTAMPTZ,

  -- Related documents
  supplier_id UUID,  -- References suppliers table (if exists)
  rma_batch_id UUID REFERENCES public.rma_batches(id) ON DELETE SET NULL,
  reference_document_number VARCHAR(100),  -- PO number, invoice, etc.

  -- People
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT receipt_approved_requires_approver
    CHECK (status != 'approved' OR approved_by_id IS NOT NULL),
  CONSTRAINT receipt_completed_requires_completer
    CHECK (status != 'completed' OR completed_by_id IS NOT NULL)
);

CREATE INDEX idx_stock_receipts_status ON public.stock_receipts(status);
CREATE INDEX idx_stock_receipts_type ON public.stock_receipts(receipt_type);
CREATE INDEX idx_stock_receipts_date ON public.stock_receipts(receipt_date);
CREATE INDEX idx_stock_receipts_warehouse ON public.stock_receipts(virtual_warehouse_type);

COMMENT ON TABLE public.stock_receipts IS
  'Stock receipt documents (Phiếu Nhập Kho) with approval workflow';

-- Trigger for auto-generating receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'PN-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('receipt_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;
CREATE TRIGGER trigger_generate_receipt_number
  BEFORE INSERT ON public.stock_receipts
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL)
  EXECUTE FUNCTION generate_receipt_number();
```

### 5.3 Stock Receipt Items (Chi Tiết Phiếu Nhập)
```sql
CREATE TABLE IF NOT EXISTS public.stock_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.stock_receipts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  -- Quantities
  declared_quantity INT NOT NULL,
  serial_count INT NOT NULL DEFAULT 0,  -- Count of serials actually entered

  -- Warranty info (can be overridden per item)
  warranty_start_date DATE,
  warranty_months INT,

  -- Pricing
  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (declared_quantity * unit_price) STORED,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT receipt_items_quantity_positive CHECK (declared_quantity > 0),
  CONSTRAINT receipt_items_serial_count_valid
    CHECK (serial_count >= 0 AND serial_count <= declared_quantity)
);

CREATE INDEX idx_stock_receipt_items_receipt
  ON public.stock_receipt_items(receipt_id);
CREATE INDEX idx_stock_receipt_items_product
  ON public.stock_receipt_items(product_id);

COMMENT ON TABLE public.stock_receipt_items IS
  'Line items in stock receipts with declared quantities and serial tracking';
COMMENT ON COLUMN public.stock_receipt_items.serial_count IS
  'Count of serials entered (via stock_receipt_serials), can be < declared_quantity';
```

### 5.4 Stock Receipt Serials (Số Serial Nhập Kho)
```sql
CREATE TABLE IF NOT EXISTS public.stock_receipt_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_item_id UUID NOT NULL REFERENCES public.stock_receipt_items(id) ON DELETE CASCADE,
  serial_number VARCHAR(255) NOT NULL,
  physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE SET NULL,

  -- Optional per-serial warranty override
  warranty_start_date DATE,
  warranty_months INT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT receipt_serials_unique UNIQUE(receipt_item_id, serial_number)
);

CREATE INDEX idx_stock_receipt_serials_item
  ON public.stock_receipt_serials(receipt_item_id);
CREATE INDEX idx_stock_receipt_serials_serial
  ON public.stock_receipt_serials(serial_number);

COMMENT ON TABLE public.stock_receipt_serials IS
  'Serial numbers entered for stock receipt items (can be partial list)';
```

### 5.5 Stock Issues (Phiếu Xuất Kho)
```sql
CREATE TABLE IF NOT EXISTS public.stock_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number VARCHAR(50) NOT NULL UNIQUE,
  issue_type public.stock_issue_type NOT NULL,
  status public.stock_document_status NOT NULL DEFAULT 'draft',

  -- Warehouses
  virtual_warehouse_type public.warehouse_type NOT NULL,
  physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

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

  -- Auto-generation flag
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  auto_approve_threshold DECIMAL(12,2),  -- Auto-approve if total < threshold

  notes TEXT,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT issue_approved_requires_approver
    CHECK (status != 'approved' OR approved_by_id IS NOT NULL),
  CONSTRAINT issue_completed_requires_completer
    CHECK (status != 'completed' OR completed_by_id IS NOT NULL)
);

CREATE INDEX idx_stock_issues_status ON public.stock_issues(status);
CREATE INDEX idx_stock_issues_type ON public.stock_issues(issue_type);
CREATE INDEX idx_stock_issues_ticket ON public.stock_issues(ticket_id);
CREATE INDEX idx_stock_issues_date ON public.stock_issues(issue_date);

COMMENT ON TABLE public.stock_issues IS
  'Stock issue documents (Phiếu Xuất Kho) with approval workflow';
COMMENT ON COLUMN public.stock_issues.auto_generated IS
  'True if created automatically from ticket completion';

-- Trigger for auto-generating issue number
CREATE OR REPLACE FUNCTION generate_issue_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.issue_number IS NULL THEN
    NEW.issue_number := 'PX-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('issue_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS issue_number_seq START 1;
CREATE TRIGGER trigger_generate_issue_number
  BEFORE INSERT ON public.stock_issues
  FOR EACH ROW
  WHEN (NEW.issue_number IS NULL)
  EXECUTE FUNCTION generate_issue_number();
```

### 5.6 Stock Issue Items
```sql
CREATE TABLE IF NOT EXISTS public.stock_issue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.stock_issues(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  quantity INT NOT NULL,
  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT issue_items_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_stock_issue_items_issue ON public.stock_issue_items(issue_id);
CREATE INDEX idx_stock_issue_items_product ON public.stock_issue_items(product_id);

COMMENT ON TABLE public.stock_issue_items IS
  'Line items in stock issue documents';
```

### 5.7 Stock Issue Serials (Số Serial Xuất Kho)
```sql
CREATE TABLE IF NOT EXISTS public.stock_issue_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_item_id UUID NOT NULL REFERENCES public.stock_issue_items(id) ON DELETE CASCADE,
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE RESTRICT,
  serial_number VARCHAR(255) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT issue_serials_unique UNIQUE(issue_item_id, physical_product_id)
);

CREATE INDEX idx_stock_issue_serials_item ON public.stock_issue_serials(issue_item_id);
CREATE INDEX idx_stock_issue_serials_product ON public.stock_issue_serials(physical_product_id);

COMMENT ON TABLE public.stock_issue_serials IS
  'Serial numbers of specific products being issued';
```

### 5.8 Stock Transfers (Phiếu Chuyển Kho)
```sql
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(50) NOT NULL UNIQUE,
  status public.transfer_status NOT NULL DEFAULT 'draft',

  -- Source warehouse
  from_virtual_warehouse_type public.warehouse_type NOT NULL,
  from_physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  -- Destination warehouse
  to_virtual_warehouse_type public.warehouse_type NOT NULL,
  to_physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

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
  rejection_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transfer_warehouses_different
    CHECK (from_virtual_warehouse_type != to_virtual_warehouse_type
           OR from_physical_warehouse_id != to_physical_warehouse_id),
  CONSTRAINT transfer_approved_requires_approver
    CHECK (status != 'approved' OR approved_by_id IS NOT NULL)
);

CREATE INDEX idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX idx_stock_transfers_from_warehouse ON public.stock_transfers(from_virtual_warehouse_type);
CREATE INDEX idx_stock_transfers_to_warehouse ON public.stock_transfers(to_virtual_warehouse_type);

COMMENT ON TABLE public.stock_transfers IS
  'Stock transfer documents (Phiếu Chuyển Kho) between warehouses';

-- Trigger for auto-generating transfer number
CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transfer_number IS NULL THEN
    NEW.transfer_number := 'PC-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('transfer_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS transfer_number_seq START 1;
CREATE TRIGGER trigger_generate_transfer_number
  BEFORE INSERT ON public.stock_transfers
  FOR EACH ROW
  WHEN (NEW.transfer_number IS NULL)
  EXECUTE FUNCTION generate_transfer_number();
```

### 5.9 Stock Transfer Items
```sql
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  quantity INT NOT NULL,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transfer_items_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_stock_transfer_items_transfer ON public.stock_transfer_items(transfer_id);
CREATE INDEX idx_stock_transfer_items_product ON public.stock_transfer_items(product_id);
```

### 5.10 Stock Transfer Serials
```sql
CREATE TABLE IF NOT EXISTS public.stock_transfer_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_item_id UUID NOT NULL REFERENCES public.stock_transfer_items(id) ON DELETE CASCADE,
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE RESTRICT,
  serial_number VARCHAR(255) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transfer_serials_unique UNIQUE(transfer_item_id, physical_product_id)
);

CREATE INDEX idx_stock_transfer_serials_item ON public.stock_transfer_serials(transfer_item_id);
```

### 5.11 Stock Document Attachments
```sql
CREATE TABLE IF NOT EXISTS public.stock_document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL,  -- 'receipt', 'issue', 'transfer'
  document_id UUID NOT NULL,

  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),

  uploaded_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_document_attachments_document
  ON public.stock_document_attachments(document_type, document_id);

COMMENT ON TABLE public.stock_document_attachments IS
  'File attachments (invoices, photos) for stock documents';
```

---

## 6. Triggers and Functions

### 6.1 Update Stock Quantities on Receipt Completion
```sql
CREATE OR REPLACE FUNCTION process_stock_receipt_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update product_warehouse_stock declared quantities
    INSERT INTO product_warehouse_stock (
      product_id,
      virtual_warehouse_type,
      physical_warehouse_id,
      declared_quantity
    )
    SELECT
      sri.product_id,
      NEW.virtual_warehouse_type,
      NEW.physical_warehouse_id,
      SUM(sri.declared_quantity)
    FROM stock_receipt_items sri
    WHERE sri.receipt_id = NEW.id
    GROUP BY sri.product_id
    ON CONFLICT (product_id, virtual_warehouse_type, physical_warehouse_id)
    DO UPDATE SET
      declared_quantity = product_warehouse_stock.declared_quantity + EXCLUDED.declared_quantity,
      updated_at = NOW();

    -- Create physical_products records for serials
    INSERT INTO physical_products (
      product_id,
      serial_number,
      condition,
      virtual_warehouse_type,
      physical_warehouse_id,
      warranty_start_date,
      warranty_months
    )
    SELECT
      sri.product_id,
      srs.serial_number,
      'new',
      NEW.virtual_warehouse_type,
      NEW.physical_warehouse_id,
      COALESCE(srs.warranty_start_date, sri.warranty_start_date),
      COALESCE(srs.warranty_months, sri.warranty_months)
    FROM stock_receipt_items sri
    JOIN stock_receipt_serials srs ON srs.receipt_item_id = sri.id
    WHERE sri.receipt_id = NEW.id
    ON CONFLICT (serial_number) DO NOTHING;

    -- Update completion timestamp
    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_stock_receipt_completion
  BEFORE UPDATE ON stock_receipts
  FOR EACH ROW
  EXECUTE FUNCTION process_stock_receipt_completion();
```

### 6.2 Update Stock Quantities on Issue Completion
```sql
CREATE OR REPLACE FUNCTION process_stock_issue_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Decrease declared quantities
    UPDATE product_warehouse_stock pws
    SET
      declared_quantity = GREATEST(0, pws.declared_quantity - issued.qty),
      updated_at = NOW()
    FROM (
      SELECT product_id, SUM(quantity) as qty
      FROM stock_issue_items
      WHERE issue_id = NEW.id
      GROUP BY product_id
    ) issued
    WHERE pws.product_id = issued.product_id
      AND pws.virtual_warehouse_type = NEW.virtual_warehouse_type
      AND (pws.physical_warehouse_id = NEW.physical_warehouse_id
           OR (pws.physical_warehouse_id IS NULL AND NEW.physical_warehouse_id IS NULL));

    -- Update physical_products to reflect new location (if moving out of system)
    UPDATE physical_products pp
    SET
      virtual_warehouse_type = CASE
        WHEN NEW.issue_type = 'disposal' THEN 'dead_stock'
        WHEN NEW.issue_type = 'warranty_return' THEN 'in_service'
        ELSE pp.virtual_warehouse_type
      END,
      updated_at = NOW()
    WHERE pp.id IN (
      SELECT sis.physical_product_id
      FROM stock_issue_serials sis
      JOIN stock_issue_items sii ON sii.id = sis.issue_item_id
      WHERE sii.issue_id = NEW.id
    );

    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_stock_issue_completion
  BEFORE UPDATE ON stock_issues
  FOR EACH ROW
  EXECUTE FUNCTION process_stock_issue_completion();
```

### 6.3 Auto-Generate Stock Issue on Ticket Completion
```sql
CREATE OR REPLACE FUNCTION auto_generate_stock_issue_from_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_issue_id UUID;
  v_total_value DECIMAL(12,2);
  v_threshold DECIMAL(12,2) := 1000000; -- 1M VND threshold
BEGIN
  -- Only process when ticket transitions to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Check if ticket has parts
    IF EXISTS (
      SELECT 1 FROM service_ticket_parts
      WHERE ticket_id = NEW.id AND quantity > 0
    ) THEN
      -- Calculate total value
      SELECT COALESCE(SUM(stp.quantity * p.cost_price), 0)
      INTO v_total_value
      FROM service_ticket_parts stp
      JOIN parts p ON p.id = stp.part_id
      WHERE stp.ticket_id = NEW.id;

      -- Create stock issue
      INSERT INTO stock_issues (
        issue_type,
        status,
        virtual_warehouse_type,
        issue_date,
        ticket_id,
        created_by_id,
        auto_generated,
        auto_approve_threshold,
        notes
      ) VALUES (
        'parts_usage',
        CASE WHEN v_total_value < v_threshold THEN 'completed' ELSE 'pending_approval' END,
        'parts',
        CURRENT_DATE,
        NEW.id,
        NEW.assigned_to_id,  -- Technician who completed the ticket
        true,
        v_threshold,
        'Auto-generated from ticket ' || NEW.ticket_number
      )
      RETURNING id INTO v_issue_id;

      -- Create issue items
      INSERT INTO stock_issue_items (
        issue_id,
        product_id,
        quantity,
        unit_price
      )
      SELECT
        v_issue_id,
        stp.part_id,
        stp.quantity,
        p.cost_price
      FROM service_ticket_parts stp
      JOIN parts p ON p.id = stp.part_id
      WHERE stp.ticket_id = NEW.id;

      -- If auto-completed, process immediately
      IF v_total_value < v_threshold THEN
        -- Trigger will handle stock updates
        NULL;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_stock_issue
  AFTER UPDATE ON service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_stock_issue_from_ticket();
```

### 6.4 Update Serial Count on Receipt
```sql
CREATE OR REPLACE FUNCTION update_receipt_item_serial_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stock_receipt_items
  SET serial_count = (
    SELECT COUNT(*)
    FROM stock_receipt_serials
    WHERE receipt_item_id = NEW.receipt_item_id
  )
  WHERE id = NEW.receipt_item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receipt_item_serial_count
  AFTER INSERT OR DELETE ON stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION update_receipt_item_serial_count();
```

---

## 7. Views for Reporting

### 7.1 Stock Summary by Warehouse
```sql
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.sku,
  pws.virtual_warehouse_type,
  pws.physical_warehouse_id,
  pw.name as physical_warehouse_name,
  pws.declared_quantity,
  pws.actual_serial_count,
  pws.declared_quantity - pws.actual_serial_count as serial_gap,
  pws.initial_stock_entry,
  pst.minimum_quantity,
  pst.reorder_quantity,
  CASE
    WHEN pws.declared_quantity = 0 THEN 'critical'
    WHEN pws.declared_quantity <= pst.minimum_quantity THEN 'warning'
    ELSE 'ok'
  END as stock_status
FROM product_warehouse_stock pws
JOIN products p ON p.id = pws.product_id
LEFT JOIN physical_warehouses pw ON pw.id = pws.physical_warehouse_id
LEFT JOIN product_stock_thresholds pst
  ON pst.product_id = pws.product_id
  AND pst.warehouse_type = pws.virtual_warehouse_type;
```

### 7.2 Pending Approvals Dashboard
```sql
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
  'receipt' as document_type,
  sr.id,
  sr.receipt_number as document_number,
  sr.receipt_type as sub_type,
  sr.status,
  sr.receipt_date as document_date,
  sr.created_by_id,
  p.full_name as created_by_name,
  sr.created_at,
  (SELECT SUM(declared_quantity) FROM stock_receipt_items WHERE receipt_id = sr.id) as total_items
FROM stock_receipts sr
JOIN profiles p ON p.id = sr.created_by_id
WHERE sr.status = 'pending_approval'

UNION ALL

SELECT
  'issue' as document_type,
  si.id,
  si.issue_number as document_number,
  si.issue_type as sub_type,
  si.status,
  si.issue_date as document_date,
  si.created_by_id,
  p.full_name as created_by_name,
  si.created_at,
  (SELECT SUM(quantity) FROM stock_issue_items WHERE issue_id = si.id) as total_items
FROM stock_issues si
JOIN profiles p ON p.id = si.created_by_id
WHERE si.status = 'pending_approval'

UNION ALL

SELECT
  'transfer' as document_type,
  st.id,
  st.transfer_number as document_number,
  'transfer' as sub_type,
  st.status::text,
  st.transfer_date as document_date,
  st.created_by_id,
  p.full_name as created_by_name,
  st.created_at,
  (SELECT SUM(quantity) FROM stock_transfer_items WHERE transfer_id = st.id) as total_items
FROM stock_transfers st
JOIN profiles p ON p.id = st.created_by_id
WHERE st.status = 'pending_approval';
```

---

## 8. RBAC Policies

### 8.1 RLS Policies for Stock Receipts
```sql
-- Enable RLS
ALTER TABLE stock_receipts ENABLE ROW LEVEL SECURITY;

-- Admin and Manager: Full access
CREATE POLICY stock_receipts_admin_manager_all
  ON stock_receipts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician and Reception: Read-only
CREATE POLICY stock_receipts_tech_reception_read
  ON stock_receipts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('technician', 'reception')
    )
  );
```

### 8.2 Admin-Only Update for initial_stock_entry
```sql
ALTER TABLE product_warehouse_stock ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY product_warehouse_stock_admin_all
  ON product_warehouse_stock
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Manager: Read and update declared_quantity only (not initial_stock_entry)
CREATE POLICY product_warehouse_stock_manager_limited
  ON product_warehouse_stock
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'manager'
    )
  )
  WITH CHECK (
    -- Prevent updating initial_stock_entry
    initial_stock_entry = (SELECT initial_stock_entry FROM product_warehouse_stock WHERE id = product_warehouse_stock.id)
  );
```

---

## 9. Migration Strategy

### 9.1 Migration Order
1. **Step 1:** Create new ENUMs
2. **Step 2:** Alter existing tables (add warranty columns)
3. **Step 3:** Create `product_warehouse_stock` table
4. **Step 4:** Create stock document tables (receipts, issues, transfers)
5. **Step 5:** Create item and serial tables
6. **Step 6:** Create sequences for document numbering
7. **Step 7:** Create triggers and functions
8. **Step 8:** Create views
9. **Step 9:** Apply RLS policies
10. **Step 10:** Seed initial data (if needed)

### 9.2 Data Migration
- **Existing `physical_products`:** Can remain as-is
- **Initial stock:** Admin must populate `product_warehouse_stock.initial_stock_entry` for each product-warehouse combo
- **Warranty defaults:** Populate `products.default_warranty_months` from business rules

---

## 10. Performance Considerations

### 10.1 Indexes
- All foreign keys indexed
- Status fields indexed for filtering
- Date fields indexed for range queries
- Composite indexes on (product_id, warehouse_type) for stock queries

### 10.2 Query Optimization
- Use materialized views for complex dashboards
- Partition large tables by date (receipts, issues) if volume high
- Use `actual_serial_count` as generated column (avoids repeated COUNT queries)

### 10.3 Concurrency
- Use `SELECT ... FOR UPDATE` when updating stock quantities
- Transaction isolation for multi-step operations
- Optimistic locking with `updated_at` checks

---

## 11. Testing Strategy

### 11.1 Unit Tests
- [ ] Trigger: Receipt completion updates stock correctly
- [ ] Trigger: Issue completion decreases stock correctly
- [ ] Trigger: Auto-generate issue from ticket works
- [ ] Constraint: Cannot exceed declared quantity with serials
- [ ] Constraint: Cannot edit after approved status

### 11.2 Integration Tests
- [ ] Full receipt workflow: draft → pending → approved → completed
- [ ] Full issue workflow with approval
- [ ] Transfer between warehouses
- [ ] Break down product into parts
- [ ] Auto-issue from ticket with threshold logic

### 11.3 Performance Tests
- [ ] 10,000 products across 5 warehouses
- [ ] 1,000 receipts/month load test
- [ ] Concurrent stock updates (race conditions)

---

## 12. Future Enhancements

### 12.1 Phase 2 Features
- **Barcode generation** for receipts/issues
- **Mobile app** for warehouse staff (scan serials)
- **Stock take/cycle count** functionality
- **Predictive reordering** based on consumption patterns
- **Multi-currency** support for pricing
- **Batch/lot tracking** for non-serialized items

### 12.2 Reporting
- **Stock aging report** (how long in warehouse)
- **Stock movement history** per product
- **Shrinkage analysis** (declared vs actual gaps)
- **Warranty expiration forecast**

---

## 13. Appendix

### 13.1 Document Numbering Format
- Receipts: `PN-YYYY-NNNN` (PN = Phiếu Nhập)
- Issues: `PX-YYYY-NNNN` (PX = Phiếu Xuất)
- Transfers: `PC-YYYY-NNNN` (PC = Phiếu Chuyển)

### 13.2 Glossary
- **Declared Quantity:** Total units claimed in stock receipt
- **Actual Serial Count:** Verified count of units with serial numbers
- **Serial Gap:** Difference between declared and actual (serials to be added)
- **Initial Stock Entry:** Opening balance when setting up system (admin-only)
- **Auto-approval Threshold:** Value limit for automatic approval (e.g., 1M VND)

---

**End of Schema Design Document**
