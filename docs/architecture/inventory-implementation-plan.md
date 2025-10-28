# Inventory Management System - Implementation Plan

**Version:** 1.0
**Date:** 2025-01-27
**Architect:** Winston
**Status:** Ready for Development

---

## 1. Executive Summary

This document provides a complete implementation roadmap for the inventory management system, including:
- Database migrations (SQL scripts)
- API structure (tRPC routers)
- Frontend components (React/Next.js)
- Sprint timeline (6 weeks)
- Testing strategy (E2E + Unit tests)

**Estimated Effort:** 6 weeks (1 developer) or 3 weeks (2 developers)

---

## 2. Database Migrations

### 2.1 Migration File Structure

Create migrations in order:

```
supabase/migrations/
├── 20250127000001_add_inventory_enums.sql
├── 20250127000002_alter_existing_tables.sql
├── 20250127000003_create_product_warehouse_stock.sql
├── 20250127000004_create_stock_receipts.sql
├── 20250127000005_create_stock_issues.sql
├── 20250127000006_create_stock_transfers.sql
├── 20250127000007_create_document_attachments.sql
├── 20250127000008_create_triggers_functions.sql
├── 20250127000009_create_views.sql
└── 20250127000010_apply_rls_policies.sql
```

### 2.2 Migration 1: Add ENUMs

**File:** `20250127000001_add_inventory_enums.sql`

```sql
-- Stock Document Status
CREATE TYPE public.stock_document_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.stock_document_status IS 'Workflow status for stock documents';

-- Stock Receipt Type
CREATE TYPE public.stock_receipt_type AS ENUM (
  'supplier_receipt',
  'rma_return',
  'transfer_in',
  'breakdown',
  'adjustment_in'
);
COMMENT ON TYPE public.stock_receipt_type IS 'Classification of stock receipt transactions';

-- Stock Issue Type
CREATE TYPE public.stock_issue_type AS ENUM (
  'warranty_return',
  'parts_usage',
  'rma_out',
  'transfer_out',
  'disposal',
  'adjustment_out'
);
COMMENT ON TYPE public.stock_issue_type IS 'Classification of stock issue transactions';

-- Transfer Status (Extended)
CREATE TYPE public.transfer_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'in_transit',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.transfer_status IS 'Workflow status for stock transfers with in-transit state';

-- Grant usage to authenticated users
GRANT USAGE ON TYPE public.stock_document_status TO authenticated;
GRANT USAGE ON TYPE public.stock_receipt_type TO authenticated;
GRANT USAGE ON TYPE public.stock_issue_type TO authenticated;
GRANT USAGE ON TYPE public.transfer_status TO authenticated;
```

### 2.3 Migration 2: Alter Existing Tables

**File:** `20250127000002_alter_existing_tables.sql`

```sql
-- Add warranty columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS default_warranty_months INT,
ADD COLUMN IF NOT EXISTS end_user_warranty_months INT DEFAULT 12;

COMMENT ON COLUMN public.products.default_warranty_months IS
  'Default manufacturer warranty period for new products';
COMMENT ON COLUMN public.products.end_user_warranty_months IS
  'Standard warranty period offered to end customers';

-- Add end-user warranty to physical_products
ALTER TABLE public.physical_products
ADD COLUMN IF NOT EXISTS end_user_warranty_start DATE,
ADD COLUMN IF NOT EXISTS end_user_warranty_months INT,
ADD COLUMN IF NOT EXISTS end_user_warranty_end DATE;

COMMENT ON COLUMN public.physical_products.end_user_warranty_start IS
  'Start date of warranty offered to end customer (from ticket completion)';
COMMENT ON COLUMN public.physical_products.end_user_warranty_months IS
  'Duration of end-user warranty in months';
COMMENT ON COLUMN public.physical_products.end_user_warranty_end IS
  'Calculated end date of end-user warranty';

-- Create trigger to calculate end-user warranty end date
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

### 2.4 Migration 3: Product Warehouse Stock

**File:** `20250127000003_create_product_warehouse_stock.sql`

```sql
CREATE TABLE IF NOT EXISTS public.product_warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  virtual_warehouse_type public.warehouse_type NOT NULL,
  physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  -- Dual tracking
  declared_quantity INT NOT NULL DEFAULT 0,
  initial_stock_entry INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_warehouse_stock_unique
    UNIQUE(product_id, virtual_warehouse_type, physical_warehouse_id),
  CONSTRAINT declared_quantity_non_negative
    CHECK (declared_quantity >= 0),
  CONSTRAINT initial_stock_non_negative
    CHECK (initial_stock_entry >= 0)
);

-- Indexes
CREATE INDEX idx_product_warehouse_stock_product
  ON public.product_warehouse_stock(product_id);
CREATE INDEX idx_product_warehouse_stock_virtual_warehouse
  ON public.product_warehouse_stock(virtual_warehouse_type);
CREATE INDEX idx_product_warehouse_stock_physical_warehouse
  ON public.product_warehouse_stock(physical_warehouse_id);

COMMENT ON TABLE public.product_warehouse_stock IS
  'Tracks declared stock quantities per product-warehouse combination';
COMMENT ON COLUMN public.product_warehouse_stock.declared_quantity IS
  'Total quantity claimed in stock receipts';
COMMENT ON COLUMN public.product_warehouse_stock.initial_stock_entry IS
  'Initial stock when setting up system (admin-only field)';

-- Trigger for updated_at
CREATE TRIGGER trigger_product_warehouse_stock_updated_at
  BEFORE UPDATE ON public.product_warehouse_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 2.5 Migration 4: Stock Receipts

**File:** `20250127000004_create_stock_receipts.sql`

```sql
-- Create sequences for document numbering
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS issue_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS transfer_number_seq START 1;

-- Stock Receipts
CREATE TABLE IF NOT EXISTS public.stock_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  receipt_type public.stock_receipt_type NOT NULL,
  status public.stock_document_status NOT NULL DEFAULT 'draft',

  virtual_warehouse_type public.warehouse_type NOT NULL,
  physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  completed_at TIMESTAMPTZ,

  supplier_id UUID,
  rma_batch_id UUID REFERENCES public.rma_batches(id) ON DELETE SET NULL,
  reference_document_number VARCHAR(100),

  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  notes TEXT,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT receipt_approved_requires_approver
    CHECK (status != 'approved' OR approved_by_id IS NOT NULL),
  CONSTRAINT receipt_completed_requires_completer
    CHECK (status != 'completed' OR completed_by_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_stock_receipts_status ON public.stock_receipts(status);
CREATE INDEX idx_stock_receipts_type ON public.stock_receipts(receipt_type);
CREATE INDEX idx_stock_receipts_date ON public.stock_receipts(receipt_date);
CREATE INDEX idx_stock_receipts_warehouse ON public.stock_receipts(virtual_warehouse_type);
CREATE INDEX idx_stock_receipts_created_by ON public.stock_receipts(created_by_id);

COMMENT ON TABLE public.stock_receipts IS 'Stock receipt documents (Phiếu Nhập Kho)';

-- Auto-generate receipt number
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

CREATE TRIGGER trigger_generate_receipt_number
  BEFORE INSERT ON public.stock_receipts
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL)
  EXECUTE FUNCTION generate_receipt_number();

CREATE TRIGGER trigger_stock_receipts_updated_at
  BEFORE UPDATE ON public.stock_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Stock Receipt Items
CREATE TABLE IF NOT EXISTS public.stock_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.stock_receipts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  declared_quantity INT NOT NULL,
  serial_count INT NOT NULL DEFAULT 0,

  warranty_start_date DATE,
  warranty_months INT,

  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (declared_quantity * COALESCE(unit_price, 0)) STORED,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT receipt_items_quantity_positive CHECK (declared_quantity > 0),
  CONSTRAINT receipt_items_serial_count_valid
    CHECK (serial_count >= 0 AND serial_count <= declared_quantity)
);

CREATE INDEX idx_stock_receipt_items_receipt ON public.stock_receipt_items(receipt_id);
CREATE INDEX idx_stock_receipt_items_product ON public.stock_receipt_items(product_id);

COMMENT ON TABLE public.stock_receipt_items IS 'Line items in stock receipts';

CREATE TRIGGER trigger_stock_receipt_items_updated_at
  BEFORE UPDATE ON public.stock_receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Stock Receipt Serials
CREATE TABLE IF NOT EXISTS public.stock_receipt_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_item_id UUID NOT NULL REFERENCES public.stock_receipt_items(id) ON DELETE CASCADE,
  serial_number VARCHAR(255) NOT NULL,
  physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE SET NULL,

  warranty_start_date DATE,
  warranty_months INT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT receipt_serials_unique UNIQUE(receipt_item_id, serial_number)
);

CREATE INDEX idx_stock_receipt_serials_item ON public.stock_receipt_serials(receipt_item_id);
CREATE INDEX idx_stock_receipt_serials_serial ON public.stock_receipt_serials(serial_number);

COMMENT ON TABLE public.stock_receipt_serials IS 'Serial numbers entered for stock receipt items';
```

### 2.6 Migration 5: Stock Issues

**File:** `20250127000005_create_stock_issues.sql`

```sql
CREATE TABLE IF NOT EXISTS public.stock_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number VARCHAR(50) NOT NULL UNIQUE,
  issue_type public.stock_issue_type NOT NULL,
  status public.stock_document_status NOT NULL DEFAULT 'draft',

  virtual_warehouse_type public.warehouse_type NOT NULL,
  physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,

  ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,
  rma_batch_id UUID REFERENCES public.rma_batches(id) ON DELETE SET NULL,
  reference_document_number VARCHAR(100),

  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  auto_generated BOOLEAN NOT NULL DEFAULT false,
  auto_approve_threshold DECIMAL(12,2),

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

COMMENT ON TABLE public.stock_issues IS 'Stock issue documents (Phiếu Xuất Kho)';

-- Auto-generate issue number
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

CREATE TRIGGER trigger_generate_issue_number
  BEFORE INSERT ON public.stock_issues
  FOR EACH ROW
  WHEN (NEW.issue_number IS NULL)
  EXECUTE FUNCTION generate_issue_number();

CREATE TRIGGER trigger_stock_issues_updated_at
  BEFORE UPDATE ON public.stock_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Stock Issue Items
CREATE TABLE IF NOT EXISTS public.stock_issue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.stock_issues(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  quantity INT NOT NULL,
  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_price, 0)) STORED,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT issue_items_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_stock_issue_items_issue ON public.stock_issue_items(issue_id);
CREATE INDEX idx_stock_issue_items_product ON public.stock_issue_items(product_id);

-- Stock Issue Serials
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
```

### 2.7 Migration 6: Stock Transfers

**File:** `20250127000006_create_stock_transfers.sql`

```sql
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(50) NOT NULL UNIQUE,
  status public.transfer_status NOT NULL DEFAULT 'draft',

  from_virtual_warehouse_type public.warehouse_type NOT NULL,
  from_physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  to_virtual_warehouse_type public.warehouse_type NOT NULL,
  to_physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE SET NULL,

  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  completed_at TIMESTAMPTZ,

  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  received_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  notes TEXT,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transfer_warehouses_different
    CHECK (
      from_virtual_warehouse_type != to_virtual_warehouse_type
      OR from_physical_warehouse_id IS DISTINCT FROM to_physical_warehouse_id
    ),
  CONSTRAINT transfer_approved_requires_approver
    CHECK (status != 'approved' OR approved_by_id IS NOT NULL)
);

CREATE INDEX idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX idx_stock_transfers_from ON public.stock_transfers(from_virtual_warehouse_type);
CREATE INDEX idx_stock_transfers_to ON public.stock_transfers(to_virtual_warehouse_type);

-- Auto-generate transfer number
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

CREATE TRIGGER trigger_generate_transfer_number
  BEFORE INSERT ON public.stock_transfers
  FOR EACH ROW
  WHEN (NEW.transfer_number IS NULL)
  EXECUTE FUNCTION generate_transfer_number();

CREATE TRIGGER trigger_stock_transfers_updated_at
  BEFORE UPDATE ON public.stock_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Stock Transfer Items
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

-- Stock Transfer Serials
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

### 2.8 Migration 7: Document Attachments

**File:** `20250127000007_create_document_attachments.sql`

```sql
CREATE TABLE IF NOT EXISTS public.stock_document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL,
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
CREATE INDEX idx_stock_document_attachments_uploader
  ON public.stock_document_attachments(uploaded_by_id);

COMMENT ON TABLE public.stock_document_attachments IS
  'File attachments for stock documents (receipts, issues, transfers)';
```

### 2.9 Migration 8: Triggers & Functions

**File:** `20250127000008_create_triggers_functions.sql`

```sql
-- =====================================================
-- TRIGGER: Update serial count on receipt
-- =====================================================
CREATE OR REPLACE FUNCTION update_receipt_item_serial_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stock_receipt_items
  SET
    serial_count = (
      SELECT COUNT(*)
      FROM stock_receipt_serials
      WHERE receipt_item_id = COALESCE(NEW.receipt_item_id, OLD.receipt_item_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.receipt_item_id, OLD.receipt_item_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receipt_item_serial_count_insert
  AFTER INSERT ON stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION update_receipt_item_serial_count();

CREATE TRIGGER trigger_update_receipt_item_serial_count_delete
  AFTER DELETE ON stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION update_receipt_item_serial_count();

-- =====================================================
-- TRIGGER: Process stock receipt completion
-- =====================================================
CREATE OR REPLACE FUNCTION process_stock_receipt_completion()
RETURNS TRIGGER AS $$
BEGIN
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

    -- Link serials to physical_products
    UPDATE stock_receipt_serials srs
    SET physical_product_id = pp.id
    FROM stock_receipt_items sri
    JOIN physical_products pp ON pp.serial_number = srs.serial_number
    WHERE srs.receipt_item_id = sri.id
      AND sri.receipt_id = NEW.id;

    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_stock_receipt_completion
  BEFORE UPDATE ON stock_receipts
  FOR EACH ROW
  EXECUTE FUNCTION process_stock_receipt_completion();

-- =====================================================
-- TRIGGER: Process stock issue completion
-- =====================================================
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

    -- Update physical_products location based on issue type
    UPDATE physical_products pp
    SET
      virtual_warehouse_type = CASE
        WHEN NEW.issue_type = 'disposal' THEN 'dead_stock'
        WHEN NEW.issue_type = 'warranty_return' THEN 'in_service'
        ELSE pp.virtual_warehouse_type
      END,
      current_ticket_id = CASE
        WHEN NEW.issue_type = 'warranty_return' THEN NEW.ticket_id
        ELSE pp.current_ticket_id
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

-- =====================================================
-- TRIGGER: Auto-generate stock issue from ticket
-- =====================================================
CREATE OR REPLACE FUNCTION auto_generate_stock_issue_from_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_issue_id UUID;
  v_total_value DECIMAL(12,2);
  v_threshold DECIMAL(12,2) := 1000000;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
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
        NEW.assigned_to_id,
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

### 2.10 Migration 9: Views

**File:** `20250127000009_create_views.sql`

```sql
-- =====================================================
-- VIEW: Stock Summary with Gap Tracking
-- =====================================================
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.sku,
  pws.virtual_warehouse_type,
  pws.physical_warehouse_id,
  pw.name as physical_warehouse_name,
  pws.declared_quantity,
  COALESCE(
    (SELECT COUNT(*)
     FROM physical_products pp
     WHERE pp.product_id = p.id
       AND pp.virtual_warehouse_type = pws.virtual_warehouse_type
       AND (pp.physical_warehouse_id = pws.physical_warehouse_id
            OR (pp.physical_warehouse_id IS NULL AND pws.physical_warehouse_id IS NULL))
    ), 0
  ) as actual_serial_count,
  pws.declared_quantity - COALESCE(
    (SELECT COUNT(*)
     FROM physical_products pp
     WHERE pp.product_id = p.id
       AND pp.virtual_warehouse_type = pws.virtual_warehouse_type
       AND (pp.physical_warehouse_id = pws.physical_warehouse_id
            OR (pp.physical_warehouse_id IS NULL AND pws.physical_warehouse_id IS NULL))
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
LEFT JOIN physical_warehouses pw ON pw.id = pws.physical_warehouse_id
LEFT JOIN product_stock_thresholds pst
  ON pst.product_id = pws.product_id
  AND pst.warehouse_type = pws.virtual_warehouse_type;

COMMENT ON VIEW v_stock_summary IS
  'Complete stock overview with declared vs actual tracking';

-- =====================================================
-- VIEW: Pending Approvals Dashboard
-- =====================================================
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
  'receipt' as document_type,
  sr.id,
  sr.receipt_number as document_number,
  sr.receipt_type::text as sub_type,
  sr.status::text as status,
  sr.receipt_date as document_date,
  sr.created_by_id,
  p.full_name as created_by_name,
  sr.created_at,
  COALESCE((
    SELECT SUM(declared_quantity)
    FROM stock_receipt_items
    WHERE receipt_id = sr.id
  ), 0) as total_quantity,
  COALESCE((
    SELECT SUM(total_price)
    FROM stock_receipt_items
    WHERE receipt_id = sr.id
  ), 0) as total_value
FROM stock_receipts sr
JOIN profiles p ON p.id = sr.created_by_id
WHERE sr.status = 'pending_approval'

UNION ALL

SELECT
  'issue' as document_type,
  si.id,
  si.issue_number as document_number,
  si.issue_type::text as sub_type,
  si.status::text as status,
  si.issue_date as document_date,
  si.created_by_id,
  p.full_name as created_by_name,
  si.created_at,
  COALESCE((
    SELECT SUM(quantity)
    FROM stock_issue_items
    WHERE issue_id = si.id
  ), 0) as total_quantity,
  COALESCE((
    SELECT SUM(total_price)
    FROM stock_issue_items
    WHERE issue_id = si.id
  ), 0) as total_value
FROM stock_issues si
JOIN profiles p ON p.id = si.created_by_id
WHERE si.status = 'pending_approval'

UNION ALL

SELECT
  'transfer' as document_type,
  st.id,
  st.transfer_number as document_number,
  'transfer' as sub_type,
  st.status::text as status,
  st.transfer_date as document_date,
  st.created_by_id,
  p.full_name as created_by_name,
  st.created_at,
  COALESCE((
    SELECT SUM(quantity)
    FROM stock_transfer_items
    WHERE transfer_id = st.id
  ), 0) as total_quantity,
  0 as total_value
FROM stock_transfers st
JOIN profiles p ON p.id = st.created_by_id
WHERE st.status = 'pending_approval';

COMMENT ON VIEW v_pending_approvals IS
  'Unified view of all pending approvals across document types';
```

### 2.11 Migration 10: RLS Policies

**File:** `20250127000010_apply_rls_policies.sql`

```sql
-- =====================================================
-- RLS: Stock Receipts
-- =====================================================
ALTER TABLE stock_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_receipts_admin_manager_all
  ON stock_receipts FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_receipts_others_read
  ON stock_receipts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('technician', 'reception')
    )
  );

-- =====================================================
-- RLS: Stock Issues
-- =====================================================
ALTER TABLE stock_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_issues_admin_manager_all
  ON stock_issues FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_issues_others_read
  ON stock_issues FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- RLS: Stock Transfers
-- =====================================================
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_transfers_admin_manager_all
  ON stock_transfers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_transfers_others_read
  ON stock_transfers FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- RLS: Product Warehouse Stock
-- =====================================================
ALTER TABLE product_warehouse_stock ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY product_warehouse_stock_admin_all
  ON product_warehouse_stock FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Manager: Can view and update declared_quantity (not initial_stock_entry)
CREATE POLICY product_warehouse_stock_manager_read
  ON product_warehouse_stock FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'manager'
    )
  );

CREATE POLICY product_warehouse_stock_manager_update
  ON product_warehouse_stock FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'manager'
    )
  )
  WITH CHECK (
    -- Prevent updating initial_stock_entry
    initial_stock_entry = (
      SELECT initial_stock_entry
      FROM product_warehouse_stock
      WHERE id = product_warehouse_stock.id
    )
  );

-- Others: Read-only
CREATE POLICY product_warehouse_stock_others_read
  ON product_warehouse_stock FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- RLS: Child Tables (items, serials, attachments)
-- =====================================================
-- These inherit permissions from parent documents
-- Admin/Manager can modify, others read-only

ALTER TABLE stock_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_receipt_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_issue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_issue_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_document_attachments ENABLE ROW LEVEL SECURITY;

-- Simple policy: If you can access parent, you can access children
CREATE POLICY stock_receipt_items_policy
  ON stock_receipt_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stock_receipts sr
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE sr.id = stock_receipt_items.receipt_id
        AND p.role IN ('admin', 'manager')
    )
  );

CREATE POLICY stock_receipt_serials_policy
  ON stock_receipt_serials FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stock_receipt_items sri
      JOIN stock_receipts sr ON sr.id = sri.receipt_id
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE sri.id = stock_receipt_serials.receipt_item_id
        AND p.role IN ('admin', 'manager')
    )
  );

-- Similar policies for issues and transfers...
-- (Abbreviated for brevity - full implementation would include all)
```

---

## 3. tRPC API Structure

### 3.1 Router Organization

Create new routers in `src/server/routers/`:

```
src/server/routers/
├── inventory/
│   ├── _app.ts                  # Sub-router aggregator
│   ├── stock.ts                 # Stock summary queries
│   ├── receipts.ts              # Receipt CRUD
│   ├── issues.ts                # Issue CRUD
│   ├── transfers.ts             # Transfer CRUD
│   ├── serials.ts               # Serial management
│   ├── approvals.ts             # Approval workflows
│   └── attachments.ts           # File uploads
└── _app.ts                      # Main router (import inventory)
```

### 3.2 Stock Router (`stock.ts`)

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const stockRouter = createTRPCRouter({
  // Get stock summary with filters
  getSummary: protectedProcedure
    .input(
      z.object({
        virtualWarehouseType: z.string().optional(),
        physicalWarehouseId: z.string().optional(),
        productId: z.string().optional(),
        status: z.enum(["ok", "warning", "critical"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Query v_stock_summary view
      const { data, error } = await ctx.supabaseAdmin
        .from("v_stock_summary")
        .select("*")
        .order("product_name");

      // Apply filters...
      return data;
    }),

  // Get aggregated stock (for "All Warehouses" tab)
  getAggregated: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Aggregate declared_quantity and actual_serial_count by product
      const { data } = await ctx.supabaseAdmin
        .rpc("get_aggregated_stock", { search_term: input.search });

      return data;
    }),

  // Get stats for dashboard cards
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { data } = await ctx.supabaseAdmin
        .rpc("get_inventory_stats");

      return {
        totalSKUs: data.total_skus,
        totalDeclared: data.total_declared,
        totalActual: data.total_actual,
        criticalCount: data.critical_count,
        warningCount: data.warning_count,
      };
    }),

  // Get stock by physical warehouse
  getByPhysicalWarehouse: protectedProcedure
    .input(z.object({ warehouseId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Query with filter
    }),

  // Get stock by virtual warehouse
  getByVirtualWarehouse: protectedProcedure
    .input(z.object({ warehouseType: z.string() }))
    .query(async ({ ctx, input }) => {
      // Query with filter
    }),
});
```

### 3.3 Receipts Router (`receipts.ts`)

```typescript
export const receiptsRouter = createTRPCRouter({
  // List receipts with pagination
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["draft", "pending_approval", "approved", "completed", "cancelled"]).optional(),
        page: z.number().default(0),
        pageSize: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error, count } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .select("*, created_by:profiles!created_by_id(full_name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(input.page * input.pageSize, (input.page + 1) * input.pageSize - 1);

      return { receipts: data, total: count };
    }),

  // Get single receipt with items and serials
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .select(`
          *,
          items:stock_receipt_items(
            *,
            product:products(*),
            serials:stock_receipt_serials(*)
          ),
          created_by:profiles!created_by_id(*),
          approved_by:profiles!approved_by_id(*),
          attachments:stock_document_attachments(*)
        `)
        .eq("id", input.id)
        .single();

      return data;
    }),

  // Create receipt (draft)
  create: protectedProcedure
    .input(
      z.object({
        receiptType: z.enum(["supplier_receipt", "rma_return", "transfer_in", "breakdown", "adjustment_in"]),
        virtualWarehouseType: z.string(),
        physicalWarehouseId: z.string().optional(),
        receiptDate: z.string(),
        supplierId: z.string().optional(),
        referenceDocumentNumber: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.string(),
            declaredQuantity: z.number().min(1),
            unitPrice: z.number().optional(),
            warrantyStartDate: z.string().optional(),
            warrantyMonths: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Insert receipt
      const { data: receipt } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .insert({
          receipt_type: input.receiptType,
          virtual_warehouse_type: input.virtualWarehouseType,
          physical_warehouse_id: input.physicalWarehouseId,
          receipt_date: input.receiptDate,
          supplier_id: input.supplierId,
          reference_document_number: input.referenceDocumentNumber,
          notes: input.notes,
          status: "draft",
          created_by_id: ctx.user.id,
        })
        .select()
        .single();

      // Insert items
      const items = input.items.map((item) => ({
        receipt_id: receipt.id,
        product_id: item.productId,
        declared_quantity: item.declaredQuantity,
        unit_price: item.unitPrice,
        warranty_start_date: item.warrantyStartDate,
        warranty_months: item.warrantyMonths,
      }));

      await ctx.supabaseAdmin
        .from("stock_receipt_items")
        .insert(items);

      return receipt;
    }),

  // Update receipt (only if draft)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
        // ... other updatable fields
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check status first
      const { data: receipt } = await ctx.supabaseAdmin
        .from("stock_receipts")
        .select("status")
        .eq("id", input.id)
        .single();

      if (receipt.status !== "draft") {
        throw new Error("Cannot edit receipt after draft status");
      }

      // Update...
    }),

  // Submit for approval
  submitForApproval: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({ status: "pending_approval" })
        .eq("id", input.id);
    }),

  // Add serials to item
  addSerials: protectedProcedure
    .input(
      z.object({
        receiptItemId: z.string(),
        serials: z.array(
          z.object({
            serialNumber: z.string(),
            warrantyStartDate: z.string().optional(),
            warrantyMonths: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate: Check for duplicates in physical_products
      const { data: existing } = await ctx.supabaseAdmin
        .from("physical_products")
        .select("serial_number")
        .in("serial_number", input.serials.map((s) => s.serialNumber));

      if (existing && existing.length > 0) {
        throw new Error(
          `Duplicate serials: ${existing.map((e) => e.serial_number).join(", ")}`
        );
      }

      // Insert serials
      const serialsToInsert = input.serials.map((s) => ({
        receipt_item_id: input.receiptItemId,
        serial_number: s.serialNumber,
        warranty_start_date: s.warrantyStartDate,
        warranty_months: s.warrantyMonths,
      }));

      await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .insert(serialsToInsert);

      // Trigger will update serial_count automatically
    }),

  // Remove serial
  removeSerial: protectedProcedure
    .input(z.object({ serialId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.supabaseAdmin
        .from("stock_receipt_serials")
        .delete()
        .eq("id", input.serialId);
    }),
});
```

### 3.4 Approvals Router (`approvals.ts`)

```typescript
export const approvalsRouter = createTRPCRouter({
  // Get pending approvals
  getPending: protectedProcedure
    .query(async ({ ctx }) => {
      // Check role
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("user_id", ctx.user.id)
        .single();

      if (!["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized");
      }

      // Query v_pending_approvals view
      const { data } = await ctx.supabaseAdmin
        .from("v_pending_approvals")
        .select("*")
        .order("created_at", { ascending: false });

      return data;
    }),

  // Approve receipt
  approveReceipt: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check role
      await requireRole(ctx, ["admin", "manager"]);

      await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({
          status: "approved",
          approved_by_id: ctx.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", input.id);
    }),

  // Reject receipt
  rejectReceipt: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireRole(ctx, ["admin", "manager"]);

      await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({
          status: "cancelled",
          rejection_reason: input.reason,
        })
        .eq("id", input.id);
    }),

  // Complete receipt (mark as completed after approval)
  completeReceipt: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireRole(ctx, ["admin", "manager"]);

      // Update status - trigger will handle stock updates
      await ctx.supabaseAdmin
        .from("stock_receipts")
        .update({
          status: "completed",
          completed_by_id: ctx.user.id,
        })
        .eq("id", input.id);
    }),

  // Similar for issues and transfers...
});
```

---

## 4. React Component Architecture

### 4.1 Component Tree

```
src/app/(auth)/inventory/
├── overview/
│   └── page.tsx                        # Main inventory page
│
src/components/inventory/
├── overview/
│   ├── inventory-stat-cards.tsx        # 3 stat cards
│   ├── inventory-alert-banner.tsx      # Low stock alert
│   ├── inventory-action-bar.tsx        # Search, filters, actions
│   ├── inventory-tabs.tsx              # Tab navigation
│   ├── inventory-table-all.tsx         # Tab 1: All warehouses
│   ├── inventory-table-physical.tsx    # Tab 2: Physical warehouse
│   ├── inventory-table-virtual.tsx     # Tab 3: Virtual warehouse
│   └── inventory-table-columns.tsx     # Shared column definitions
│
├── receipts/
│   ├── receipt-list-table.tsx          # List of receipts
│   ├── receipt-detail-view.tsx         # Detail page
│   ├── receipt-create-drawer.tsx       # 3-step wizard
│   ├── receipt-form-step1.tsx          # General info
│   ├── receipt-form-step2.tsx          # Add products
│   ├── receipt-form-step3.tsx          # Review
│   └── receipt-status-badge.tsx        # Status indicator
│
├── issues/
│   ├── issue-list-table.tsx
│   ├── issue-detail-view.tsx
│   ├── issue-create-drawer.tsx
│   ├── issue-serial-selector.tsx       # Serial picker
│   └── issue-status-badge.tsx
│
├── transfers/
│   ├── transfer-list-table.tsx
│   ├── transfer-detail-view.tsx
│   ├── transfer-create-drawer.tsx
│   ├── transfer-warehouse-selector.tsx # Dual warehouse UI
│   └── transfer-status-tracker.tsx     # In-transit visualization
│
├── serials/
│   ├── serial-entry-drawer.tsx         # Main serial entry UI
│   ├── serial-input-textarea.tsx       # Flexible input parser
│   ├── serial-validation-display.tsx   # Show validation results
│   ├── serial-progress-bar.tsx         # Completion progress
│   ├── serial-list-view.tsx            # Show existing serials
│   └── serial-csv-import.tsx           # CSV upload
│
├── approvals/
│   ├── approval-dashboard.tsx          # Manager dashboard
│   ├── approval-list-card.tsx          # Pending items
│   ├── approval-quick-modal.tsx        # Quick approve/reject
│   └── approval-detail-drawer.tsx      # Full details
│
└── shared/
    ├── stock-status-badge.tsx          # OK/Warning/Critical
    ├── document-status-badge.tsx       # Draft/Pending/etc
    ├── warehouse-selector.tsx          # Reusable selector
    ├── product-search.tsx              # Product autocomplete
    ├── file-uploader.tsx               # Attachment upload
    └── timeline-view.tsx               # Document timeline
```

### 4.2 Key Component Specs

#### **InventoryStatCards Component**

```typescript
interface InventoryStatCardsProps {}

export function InventoryStatCards() {
  const { data: stats } = trpc.inventory.stock.getStats.useQuery();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card onClick={() => onFilterClick("sku")}>
        <CardHeader>
          <CardDescription>Tổng Số SKU</CardDescription>
          <CardTitle className="text-3xl">{stats?.totalSKUs}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            📦 +8 từ tháng trước
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Tổng Số Sản Phẩm</CardDescription>
          <CardTitle className="text-3xl">
            {stats?.totalDeclared} / {stats?.totalActual}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            ⚠️ {stats?.totalDeclared - stats?.totalActual} thiếu serial
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Cảnh Báo Tồn Kho</CardDescription>
          <CardTitle className="text-3xl">
            {stats?.criticalCount} | {stats?.warningCount}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-destructive">🔴 Cần xử lý gấp</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### **SerialEntryDrawer Component**

```typescript
interface SerialEntryDrawerProps {
  open: boolean;
  onClose: () => void;
  receiptItemId: string;
  productName: string;
  declaredQuantity: number;
  currentSerialCount: number;
}

export function SerialEntryDrawer(props: SerialEntryDrawerProps) {
  const [serials, setSerials] = useState<string>("");
  const [validationResults, setValidationResults] = useState<{
    valid: string[];
    duplicates: string[];
  }>({ valid: [], duplicates: [] });

  const addSerialsMutation = trpc.inventory.receipts.addSerials.useMutation();

  const handleParse = () => {
    // Parse textarea - handle multiple delimiters
    const parsed = serials
      .split(/[\n,\s\t]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Validate against DB
    validateSerials(parsed);
  };

  const handleSubmit = async () => {
    await addSerialsMutation.mutateAsync({
      receiptItemId: props.receiptItemId,
      serials: validationResults.valid.map((sn) => ({ serialNumber: sn })),
    });
    props.onClose();
  };

  const progress =
    (props.currentSerialCount / props.declaredQuantity) * 100;

  return (
    <Drawer open={props.open} onOpenChange={props.onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Nhập Số Serial</DrawerTitle>
        </DrawerHeader>

        <div className="p-6 space-y-4">
          <div>
            <p>Sản Phẩm: {props.productName}</p>
            <p>Khai Báo: {props.declaredQuantity}</p>
            <p>Đã Nhập: {props.currentSerialCount}</p>
            <p>Còn Thiếu: {props.declaredQuantity - props.currentSerialCount}</p>
          </div>

          <Progress value={progress} />

          <Textarea
            value={serials}
            onChange={(e) => setSerials(e.target.value)}
            placeholder="Mỗi dòng 1 serial..."
            rows={10}
          />

          <Button onClick={handleParse}>Kiểm Tra</Button>

          {validationResults.valid.length > 0 && (
            <div className="text-green-600">
              ✅ {validationResults.valid.length} serial hợp lệ
            </div>
          )}
          {validationResults.duplicates.length > 0 && (
            <div className="text-destructive">
              ❌ {validationResults.duplicates.length} serial trùng
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={validationResults.valid.length === 0}>
            Xác Nhận Nhập
          </Button>
          <Button variant="outline" onClick={props.onClose}>
            Hủy
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

---

## 5. Sprint Timeline

### Sprint 1 (Week 1): Database & Core API
- **Day 1-2**: Run migrations, seed test data
- **Day 3-5**: Build stock, receipts, issues routers
- **Day 5**: Testing with Postman/Bruno

**Deliverables:**
- ✅ All 10 migrations applied
- ✅ tRPC routers functional
- ✅ Unit tests for triggers

---

### Sprint 2 (Week 2): Core UI - Inventory Overview
- **Day 1-2**: Stat cards, alert banner, action bar
- **Day 3-4**: Tab structure, table for "All Warehouses"
- **Day 5**: Physical & Virtual warehouse tabs

**Deliverables:**
- ✅ `/inventory/overview` page complete
- ✅ 3-tab navigation working
- ✅ Responsive design

---

### Sprint 3 (Week 3): Serial Management
- **Day 1-2**: Serial entry drawer with validation
- **Day 3**: CSV import functionality
- **Day 4**: Serial selection for issues
- **Day 5**: Barcode scanner integration (optional)

**Deliverables:**
- ✅ Serial entry fully functional
- ✅ Real-time duplicate detection
- ✅ Progress tracking

---

### Sprint 4 (Week 4): Stock Documents
- **Day 1-2**: Receipt creation wizard (3 steps)
- **Day 3**: Issue creation form
- **Day 4**: Transfer creation form
- **Day 5**: Document detail views

**Deliverables:**
- ✅ Full CRUD for receipts, issues, transfers
- ✅ File attachment upload
- ✅ Timeline visualization

---

### Sprint 5 (Week 5): Approval Workflow
- **Day 1-2**: Approval dashboard for managers
- **Day 3**: Quick approval modal
- **Day 4**: Rejection flow with reasons
- **Day 5**: Email notifications (optional)

**Deliverables:**
- ✅ Manager approval page
- ✅ Status transitions working
- ✅ Audit trail complete

---

### Sprint 6 (Week 6): Polish & Advanced Features
- **Day 1**: Bulk operations (multi-select)
- **Day 2**: Stock movement history
- **Day 3**: Low stock notifications
- **Day 4**: Mobile optimization
- **Day 5**: E2E testing, bug fixes

**Deliverables:**
- ✅ Production-ready system
- ✅ E2E test coverage >80%
- ✅ Mobile-friendly

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Database Triggers:**
```typescript
// tests/unit/triggers.test.ts
describe("Stock Receipt Completion Trigger", () => {
  it("should update declared_quantity when receipt completed", async () => {
    // Create receipt with items
    // Mark as completed
    // Assert stock increased
  });

  it("should create physical_products from serials", async () => {
    // Create receipt with serials
    // Mark as completed
    // Assert physical_products created
  });
});
```

**tRPC Procedures:**
```typescript
// tests/unit/receipts.test.ts
describe("Receipts Router", () => {
  it("should create receipt in draft status", async () => {
    const caller = createCaller(mockContext);
    const result = await caller.receipts.create({ ... });
    expect(result.status).toBe("draft");
  });

  it("should reject duplicate serials", async () => {
    await expect(
      caller.receipts.addSerials({ serials: ["DUP123"] })
    ).rejects.toThrow("Duplicate");
  });
});
```

### 6.2 Integration Tests

**Full Receipt Workflow:**
```typescript
describe("Receipt Workflow Integration", () => {
  it("should complete full receipt lifecycle", async () => {
    // 1. Create receipt (draft)
    // 2. Add items
    // 3. Add serials
    // 4. Submit for approval (pending_approval)
    // 5. Manager approves (approved)
    // 6. Complete receipt (completed)
    // 7. Verify stock updated
  });
});
```

### 6.3 E2E Tests (Playwright)

```typescript
// tests/e2e/inventory-overview.spec.ts
test.describe("Inventory Overview Page", () => {
  test("should display stat cards with correct data", async ({ page }) => {
    await page.goto("/inventory/overview");
    await expect(page.locator("text=Tổng Số SKU")).toBeVisible();
    // Assert stat values
  });

  test("should switch between tabs", async ({ page }) => {
    await page.goto("/inventory/overview");
    await page.click("text=Kho Vật Lý");
    await expect(page.locator("select >> text=Chọn Kho")).toBeVisible();
  });

  test("should create stock receipt", async ({ page }) => {
    await page.goto("/inventory/overview");
    await page.click("text=Phiếu Nhập");
    // Fill form
    await page.fill("input[name=referenceNumber]", "PO-001");
    await page.click("text=Tiếp Theo");
    // Add products
    await page.click("text=Tạo Phiếu Nhập");
    await expect(page.locator("text=PN-2025-")).toBeVisible();
  });

  test("should enter serials with validation", async ({ page }) => {
    // Navigate to receipt detail
    await page.click("text=Bổ Sung Serial");
    await page.fill("textarea", "SN123\nSN124\nSN125");
    await page.click("text=Kiểm Tra");
    await expect(page.locator("text=3 serial hợp lệ")).toBeVisible();
    await page.click("text=Xác Nhận Nhập");
    await expect(page.locator("text=3/20 (15%)")).toBeVisible();
  });
});

// tests/e2e/approval-workflow.spec.ts
test.describe("Approval Workflow", () => {
  test("manager can approve receipt", async ({ page }) => {
    // Login as manager
    await loginAsManager(page);
    await page.goto("/inventory/approvals");
    await page.click("button:has-text('Duyệt'):first");
    await page.fill("textarea[name=notes]", "Approved");
    await page.click("text=Xác Nhận Duyệt");
    await expect(page.locator("text=Đã Duyệt")).toBeVisible();
  });

  test("technician cannot approve receipt", async ({ page }) => {
    // Login as technician
    await loginAsTechnician(page);
    await page.goto("/inventory/approvals");
    await expect(page).toHaveURL("/unauthorized");
  });
});
```

### 6.4 Performance Tests

```typescript
// tests/performance/stock-queries.test.ts
describe("Stock Query Performance", () => {
  it("should load 10,000 products under 2 seconds", async () => {
    const start = Date.now();
    const result = await trpc.inventory.stock.getSummary.query({});
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
    expect(result.length).toBe(10000);
  });
});
```

---

## 7. Implementation Checklist

### Phase 1: Database (Week 1)
- [ ] Run migration 1: ENUMs
- [ ] Run migration 2: Alter existing tables
- [ ] Run migration 3: Product warehouse stock
- [ ] Run migration 4: Stock receipts
- [ ] Run migration 5: Stock issues
- [ ] Run migration 6: Stock transfers
- [ ] Run migration 7: Document attachments
- [ ] Run migration 8: Triggers & functions
- [ ] Run migration 9: Views
- [ ] Run migration 10: RLS policies
- [ ] Seed test data (products, warehouses)
- [ ] Test triggers manually

### Phase 2: API (Week 1-2)
- [ ] Create stock router
- [ ] Create receipts router
- [ ] Create issues router
- [ ] Create transfers router
- [ ] Create serials router
- [ ] Create approvals router
- [ ] Create attachments router
- [ ] Write unit tests for routers
- [ ] Test with Postman/Bruno

### Phase 3: UI - Core (Week 2)
- [ ] Create inventory overview page
- [ ] Build stat cards component
- [ ] Build alert banner component
- [ ] Build action bar component
- [ ] Build tab navigation
- [ ] Build "All Warehouses" table
- [ ] Build "Physical Warehouse" table
- [ ] Build "Virtual Warehouse" table
- [ ] Implement responsive design

### Phase 4: UI - Serial Management (Week 3)
- [ ] Build serial entry drawer
- [ ] Implement flexible input parsing
- [ ] Add real-time validation
- [ ] Build progress bar
- [ ] Implement CSV import
- [ ] Build serial selection for issues
- [ ] Add barcode scanner support (optional)

### Phase 5: UI - Documents (Week 4)
- [ ] Build receipt creation wizard
- [ ] Build issue creation form
- [ ] Build transfer creation form
- [ ] Build document detail views
- [ ] Implement file upload
- [ ] Build timeline visualization

### Phase 6: UI - Approvals (Week 5)
- [ ] Build approval dashboard
- [ ] Build approval list cards
- [ ] Build quick approval modal
- [ ] Build rejection flow
- [ ] Implement email notifications (optional)

### Phase 7: Advanced Features (Week 6)
- [ ] Implement bulk operations
- [ ] Build stock movement history
- [ ] Add low stock notifications
- [ ] Optimize for mobile
- [ ] Write E2E tests
- [ ] Performance testing
- [ ] Bug fixes & polish

### Phase 8: Deployment
- [ ] Code review
- [ ] QA testing
- [ ] User acceptance testing (UAT)
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor for issues

---

## 8. Development Guidelines

### 8.1 Code Standards

**TypeScript:**
- Use strict mode
- Prefer interfaces over types for props
- Use Zod for validation

**React:**
- Use functional components
- Use hooks (useState, useEffect, custom hooks)
- Prefer composition over inheritance

**Naming:**
- Components: PascalCase (e.g., `SerialEntryDrawer`)
- Files: kebab-case (e.g., `serial-entry-drawer.tsx`)
- Functions: camelCase (e.g., `handleSubmit`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_SERIALS`)

### 8.2 Error Handling

**tRPC Errors:**
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Duplicate serials found: SN123, SN124",
});
```

**React Error Boundaries:**
```typescript
// Wrap critical sections
<ErrorBoundary fallback={<ErrorFallback />}>
  <SerialEntryDrawer />
</ErrorBoundary>
```

### 8.3 Performance Optimization

**Database:**
- Use indexes on foreign keys
- Use views for complex queries
- Paginate large result sets

**React:**
- Use React.memo for expensive components
- Use useMemo for expensive calculations
- Lazy load drawers/modals

**API:**
- Implement caching with TanStack Query
- Use optimistic updates for better UX

---

## 9. Deployment Strategy

### 9.1 Migration Deployment

**Step-by-step:**
1. Backup production database
2. Run migrations in order (1-10)
3. Verify with SELECT queries
4. Test triggers manually
5. Rollback if issues

**Rollback Plan:**
```sql
-- Drop tables in reverse order
DROP TABLE stock_document_attachments;
DROP TABLE stock_transfer_serials;
-- ... etc
```

### 9.2 Feature Flags

Use feature flags for gradual rollout:

```typescript
// In environment config
FEATURE_FLAG_INVENTORY_MANAGEMENT = true;

// In code
if (process.env.FEATURE_FLAG_INVENTORY_MANAGEMENT) {
  return <InventoryOverviewPage />;
} else {
  return <LegacyInventoryPage />;
}
```

### 9.3 Monitoring

**Key Metrics:**
- Receipt creation rate (per day)
- Approval turnaround time (median)
- Serial entry completion rate
- API response times (p95)
- Error rates by endpoint

**Alerts:**
- Database connection failures
- Migration failures
- High error rates (>5%)
- Slow queries (>2s)

---

## 10. Appendix

### 10.1 SQL Helper Functions

**Get Aggregated Stock:**
```sql
CREATE OR REPLACE FUNCTION get_aggregated_stock(search_term TEXT DEFAULT NULL)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  total_declared BIGINT,
  total_actual BIGINT,
  serial_gap BIGINT,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.sku,
    SUM(pws.declared_quantity)::BIGINT,
    (SELECT COUNT(*) FROM physical_products pp WHERE pp.product_id = p.id)::BIGINT,
    (SUM(pws.declared_quantity) - (SELECT COUNT(*) FROM physical_products pp WHERE pp.product_id = p.id))::BIGINT,
    CASE
      WHEN SUM(pws.declared_quantity) = 0 THEN 'critical'
      WHEN SUM(pws.declared_quantity) <= 10 THEN 'warning'
      ELSE 'ok'
    END
  FROM products p
  LEFT JOIN product_warehouse_stock pws ON pws.product_id = p.id
  WHERE search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.sku ILIKE '%' || search_term || '%'
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;
```

**Get Inventory Stats:**
```sql
CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS TABLE (
  total_skus BIGINT,
  total_declared BIGINT,
  total_actual BIGINT,
  critical_count BIGINT,
  warning_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id),
    COALESCE(SUM(pws.declared_quantity), 0)::BIGINT,
    (SELECT COUNT(*) FROM physical_products)::BIGINT,
    COUNT(*) FILTER (WHERE pws.declared_quantity = 0)::BIGINT,
    COUNT(*) FILTER (WHERE pws.declared_quantity > 0 AND pws.declared_quantity <= pst.minimum_quantity)::BIGINT
  FROM products p
  LEFT JOIN product_warehouse_stock pws ON pws.product_id = p.id
  LEFT JOIN product_stock_thresholds pst ON pst.product_id = p.id;
END;
$$ LANGUAGE plpgsql;
```

### 10.2 Sample Test Data

**Seed Script:**
```sql
-- Insert sample products
INSERT INTO products (id, name, sku, default_warranty_months, end_user_warranty_months)
VALUES
  (gen_random_uuid(), 'RTX 5090 Founders Edition', 'GPU-5090', 36, 12),
  (gen_random_uuid(), 'RTX 4090', 'GPU-4090', 36, 12),
  (gen_random_uuid(), 'RTX 4080', 'GPU-4080', 36, 12);

-- Insert sample warehouse stock
INSERT INTO product_warehouse_stock (product_id, virtual_warehouse_type, declared_quantity)
SELECT id, 'warranty_stock', 0 FROM products;

-- Insert sample physical products with serials
INSERT INTO physical_products (product_id, serial_number, virtual_warehouse_type)
SELECT
  (SELECT id FROM products WHERE sku = 'GPU-5090'),
  'SN-5090-' || LPAD(generate_series::TEXT, 5, '0'),
  'warranty_stock'
FROM generate_series(1, 50);
```

---

**END OF IMPLEMENTATION PLAN**
