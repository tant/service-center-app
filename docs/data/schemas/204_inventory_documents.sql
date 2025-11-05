-- =====================================================
-- 204_inventory_documents.sql
-- =====================================================
-- Inventory Document Management System
--
-- Comprehensive inventory management tables:
-- - Stock receipts (Phiếu Nhập Kho)
-- - Stock issues (Phiếu Xuất Kho)
-- - Stock transfers (Phiếu Chuyển Kho)
-- - Serial number tracking
-- - Product warehouse stock levels
-- - Document attachments
--
-- ORDER: 200-299 (Tables)
-- DEPENDENCIES: 100, 150, 200, 202
-- =====================================================

-- NOTE: All ENUM types (stock_document_status, stock_receipt_type, stock_issue_type, transfer_status)
-- are defined in 100_enums_and_sequences.sql and do not need to be redefined here.

-- =====================================================
-- SEQUENCES
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS public.receipt_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.issue_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.transfer_number_seq START 1;

-- =====================================================
-- STOCK RECEIPTS (Phiếu Nhập Kho)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  receipt_type public.stock_receipt_type NOT NULL DEFAULT 'normal',
  status public.stock_document_status NOT NULL DEFAULT 'draft',

  virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,

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

CREATE INDEX idx_stock_receipts_status ON public.stock_receipts(status);
CREATE INDEX idx_stock_receipts_type ON public.stock_receipts(receipt_type);
CREATE INDEX idx_stock_receipts_date ON public.stock_receipts(receipt_date);
CREATE INDEX idx_stock_receipts_warehouse ON public.stock_receipts(virtual_warehouse_id);
CREATE INDEX idx_stock_receipts_created_by ON public.stock_receipts(created_by_id);

COMMENT ON TABLE public.stock_receipts IS 'Stock receipt documents (Phiếu Nhập Kho)';
COMMENT ON COLUMN public.stock_receipts.virtual_warehouse_id IS 'Virtual warehouse to receive stock';
COMMENT ON COLUMN public.stock_receipts.receipt_type IS 'normal (default) or adjustment (kiểm kê)';

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'PN-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('public.receipt_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_receipt_number
  BEFORE INSERT ON public.stock_receipts
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL)
  EXECUTE FUNCTION public.generate_receipt_number();

CREATE TRIGGER trigger_stock_receipts_updated_at
  BEFORE UPDATE ON public.stock_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STOCK RECEIPT ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.stock_receipts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  declared_quantity INT NOT NULL,
  serial_count INT NOT NULL DEFAULT 0,

  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (declared_quantity * COALESCE(unit_price, 0)) STORED,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT receipt_items_quantity_not_zero CHECK (declared_quantity != 0),
  CONSTRAINT receipt_items_serial_count_valid
    CHECK (serial_count >= 0 AND serial_count <= ABS(declared_quantity))
);

CREATE INDEX idx_stock_receipt_items_receipt ON public.stock_receipt_items(receipt_id);
CREATE INDEX idx_stock_receipt_items_product ON public.stock_receipt_items(product_id);

COMMENT ON TABLE public.stock_receipt_items IS 'Line items in stock receipts';
COMMENT ON COLUMN public.stock_receipt_items.declared_quantity IS 'Quantity (can be negative for adjustments)';

CREATE TRIGGER trigger_stock_receipt_items_updated_at
  BEFORE UPDATE ON public.stock_receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STOCK RECEIPT SERIALS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_receipt_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_item_id UUID NOT NULL REFERENCES public.stock_receipt_items(id) ON DELETE CASCADE,
  serial_number VARCHAR(255) NOT NULL,
  physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE SET NULL,

  manufacturer_warranty_end_date DATE,
  user_warranty_end_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT receipt_serials_unique UNIQUE(receipt_item_id, serial_number)
);

CREATE INDEX idx_stock_receipt_serials_item ON public.stock_receipt_serials(receipt_item_id);
CREATE INDEX idx_stock_receipt_serials_serial ON public.stock_receipt_serials(serial_number);

COMMENT ON TABLE public.stock_receipt_serials IS 'Serial numbers for stock receipt items';
COMMENT ON COLUMN public.stock_receipt_serials.manufacturer_warranty_end_date IS 'Manufacturer warranty end date (nullable - optional during serial entry)';
COMMENT ON COLUMN public.stock_receipt_serials.user_warranty_end_date IS 'Extended warranty end date (nullable - optional during serial entry)';

-- =====================================================
-- STOCK ISSUES (Phiếu Xuất Kho)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number VARCHAR(50) NOT NULL UNIQUE,
  issue_type public.stock_issue_type NOT NULL DEFAULT 'normal',
  status public.stock_document_status NOT NULL DEFAULT 'draft',

  virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,

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
CREATE INDEX idx_stock_issues_warehouse ON public.stock_issues(virtual_warehouse_id);

COMMENT ON TABLE public.stock_issues IS 'Stock issue documents (Phiếu Xuất Kho)';
COMMENT ON COLUMN public.stock_issues.virtual_warehouse_id IS 'Virtual warehouse to deduct stock from';
COMMENT ON COLUMN public.stock_issues.issue_type IS 'normal (default) or adjustment (kiểm kê)';

CREATE OR REPLACE FUNCTION public.generate_issue_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.issue_number IS NULL THEN
    NEW.issue_number := 'PX-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('public.issue_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_issue_number
  BEFORE INSERT ON public.stock_issues
  FOR EACH ROW
  WHEN (NEW.issue_number IS NULL)
  EXECUTE FUNCTION public.generate_issue_number();

CREATE TRIGGER trigger_stock_issues_updated_at
  BEFORE UPDATE ON public.stock_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STOCK ISSUE ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_issue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.stock_issues(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  quantity INT NOT NULL,
  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_price, 0)) STORED,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT issue_items_quantity_not_zero CHECK (quantity != 0)
);

CREATE INDEX idx_stock_issue_items_issue ON public.stock_issue_items(issue_id);
CREATE INDEX idx_stock_issue_items_product ON public.stock_issue_items(product_id);

COMMENT ON TABLE public.stock_issue_items IS 'Line items in stock issues';
COMMENT ON COLUMN public.stock_issue_items.quantity IS 'Quantity (can be negative for adjustments)';

-- =====================================================
-- STOCK ISSUE SERIALS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_issue_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_item_id UUID NOT NULL REFERENCES public.stock_issue_items(id) ON DELETE CASCADE,
  physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE SET NULL,
  serial_number VARCHAR(255) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT issue_serials_unique UNIQUE(issue_item_id, physical_product_id)
);

CREATE INDEX idx_stock_issue_serials_item ON public.stock_issue_serials(issue_item_id);
CREATE INDEX idx_stock_issue_serials_product ON public.stock_issue_serials(physical_product_id);

COMMENT ON TABLE public.stock_issue_serials IS 'Serial numbers in stock issues';

-- =====================================================
-- STOCK TRANSFERS (Phiếu Chuyển Kho)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(50) NOT NULL UNIQUE,
  status public.transfer_status NOT NULL DEFAULT 'draft',

  from_virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,
  to_virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,

  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  completed_at TIMESTAMPTZ,

  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  received_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  generated_issue_id UUID REFERENCES public.stock_issues(id) ON DELETE SET NULL,
  generated_receipt_id UUID REFERENCES public.stock_receipts(id) ON DELETE SET NULL,

  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,

  notes TEXT,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transfer_warehouses_different
    CHECK (from_virtual_warehouse_id != to_virtual_warehouse_id),
  CONSTRAINT transfer_approved_requires_approver
    CHECK (status != 'approved' OR approved_by_id IS NOT NULL)
);

CREATE INDEX idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX idx_stock_transfers_from ON public.stock_transfers(from_virtual_warehouse_id);
CREATE INDEX idx_stock_transfers_to ON public.stock_transfers(to_virtual_warehouse_id);
CREATE INDEX idx_stock_transfers_generated_issue ON public.stock_transfers(generated_issue_id);
CREATE INDEX idx_stock_transfers_generated_receipt ON public.stock_transfers(generated_receipt_id);
CREATE INDEX idx_stock_transfers_customer ON public.stock_transfers(customer_id) WHERE customer_id IS NOT NULL;

COMMENT ON TABLE public.stock_transfers IS 'Stock transfer documents (Phiếu Chuyển Kho)';
COMMENT ON COLUMN public.stock_transfers.from_virtual_warehouse_id IS 'Source virtual warehouse';
COMMENT ON COLUMN public.stock_transfers.to_virtual_warehouse_id IS 'Destination virtual warehouse';
COMMENT ON COLUMN public.stock_transfers.generated_issue_id IS 'Auto-generated issue document';
COMMENT ON COLUMN public.stock_transfers.generated_receipt_id IS 'Auto-generated receipt document';
COMMENT ON COLUMN public.stock_transfers.customer_id IS 'Customer receiving the products when transferring to customer_installed warehouse. Required for customer_installed transfers.';

CREATE OR REPLACE FUNCTION public.generate_transfer_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.transfer_number IS NULL THEN
    NEW.transfer_number := 'PC-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('public.transfer_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_transfer_number
  BEFORE INSERT ON public.stock_transfers
  FOR EACH ROW
  WHEN (NEW.transfer_number IS NULL)
  EXECUTE FUNCTION public.generate_transfer_number();

CREATE TRIGGER trigger_stock_transfers_updated_at
  BEFORE UPDATE ON public.stock_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STOCK TRANSFER ITEMS
-- =====================================================

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

COMMENT ON TABLE public.stock_transfer_items IS 'Line items in stock transfers';

-- =====================================================
-- STOCK TRANSFER SERIALS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_transfer_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_item_id UUID NOT NULL REFERENCES public.stock_transfer_items(id) ON DELETE CASCADE,
  physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE SET NULL,
  serial_number VARCHAR(255) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transfer_serials_unique UNIQUE(transfer_item_id, physical_product_id)
);

CREATE INDEX idx_stock_transfer_serials_item ON public.stock_transfer_serials(transfer_item_id);

COMMENT ON TABLE public.stock_transfer_serials IS 'Serial numbers in stock transfers';

-- =====================================================
-- PRODUCT WAREHOUSE STOCK (Simplified)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,

  declared_quantity INT NOT NULL DEFAULT 0,
  initial_stock_entry INT NOT NULL DEFAULT 0,

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
CREATE INDEX idx_product_warehouse_stock_virtual_warehouse
  ON public.product_warehouse_stock(virtual_warehouse_id);

COMMENT ON TABLE public.product_warehouse_stock IS 'Stock quantities per product-virtual warehouse';
COMMENT ON COLUMN public.product_warehouse_stock.virtual_warehouse_id IS 'Virtual warehouse instance';
COMMENT ON COLUMN public.product_warehouse_stock.declared_quantity IS 'Total quantity from receipts';
COMMENT ON COLUMN public.product_warehouse_stock.initial_stock_entry IS 'Initial stock (admin-only)';

CREATE TRIGGER trigger_product_warehouse_stock_updated_at
  BEFORE UPDATE ON public.product_warehouse_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUTO-GENERATION TRIGGERS FOR TRANSFERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_generate_transfer_documents()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_issue_id UUID;
  v_receipt_id UUID;
  v_transfer_item RECORD;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.generated_issue_id IS NULL THEN

    -- Create Issue Document
    INSERT INTO public.stock_issues (
      issue_type, status, virtual_warehouse_id, issue_date,
      reference_document_number, created_by_id, approved_by_id,
      approved_at, auto_generated, notes
    ) VALUES (
      'normal', 'approved', NEW.from_virtual_warehouse_id, NEW.transfer_date,
      'PC-' || NEW.transfer_number, NEW.created_by_id, NEW.approved_by_id,
      NEW.approved_at, true, 'Phiếu xuất tự động từ ' || NEW.transfer_number
    ) RETURNING id INTO v_issue_id;

    -- Create Receipt Document
    INSERT INTO public.stock_receipts (
      receipt_type, status, virtual_warehouse_id, receipt_date,
      reference_document_number, created_by_id, approved_by_id,
      approved_at, notes
    ) VALUES (
      'normal', 'approved', NEW.to_virtual_warehouse_id, NEW.transfer_date,
      'PC-' || NEW.transfer_number, NEW.created_by_id, NEW.approved_by_id,
      NEW.approved_at, 'Phiếu nhập tự động từ ' || NEW.transfer_number
    ) RETURNING id INTO v_receipt_id;

    -- Copy items
    FOR v_transfer_item IN
      SELECT product_id, quantity, notes
      FROM public.stock_transfer_items
      WHERE transfer_id = NEW.id
    LOOP
      INSERT INTO public.stock_issue_items (issue_id, product_id, quantity, notes)
      VALUES (v_issue_id, v_transfer_item.product_id, v_transfer_item.quantity, v_transfer_item.notes);

      INSERT INTO public.stock_receipt_items (receipt_id, product_id, declared_quantity, notes)
      VALUES (v_receipt_id, v_transfer_item.product_id, v_transfer_item.quantity, v_transfer_item.notes);
    END LOOP;

    -- Copy serials
    INSERT INTO public.stock_issue_serials (issue_item_id, physical_product_id, serial_number)
    SELECT sii.id, sts.physical_product_id, sts.serial_number
    FROM public.stock_transfer_serials sts
    JOIN public.stock_transfer_items sti ON sts.transfer_item_id = sti.id
    JOIN public.stock_issue_items sii ON sii.issue_id = v_issue_id AND sii.product_id = sti.product_id
    WHERE sti.transfer_id = NEW.id;

    INSERT INTO public.stock_receipt_serials (receipt_item_id, serial_number, physical_product_id)
    SELECT sri.id, sts.serial_number, sts.physical_product_id
    FROM public.stock_transfer_serials sts
    JOIN public.stock_transfer_items sti ON sts.transfer_item_id = sti.id
    JOIN public.stock_receipt_items sri ON sri.receipt_id = v_receipt_id AND sri.product_id = sti.product_id
    WHERE sti.transfer_id = NEW.id;

    NEW.generated_issue_id := v_issue_id;
    NEW.generated_receipt_id := v_receipt_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_transfer_documents
  BEFORE UPDATE ON public.stock_transfers
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION public.auto_generate_transfer_documents();

CREATE OR REPLACE FUNCTION public.auto_complete_transfer_documents()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF NEW.generated_issue_id IS NOT NULL THEN
      UPDATE public.stock_issues
      SET status = 'completed', completed_by_id = NEW.received_by_id, completed_at = NEW.completed_at
      WHERE id = NEW.generated_issue_id;
    END IF;

    IF NEW.generated_receipt_id IS NOT NULL THEN
      UPDATE public.stock_receipts
      SET status = 'completed', completed_by_id = NEW.received_by_id, completed_at = NEW.completed_at
      WHERE id = NEW.generated_receipt_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_complete_transfer_documents
  AFTER UPDATE ON public.stock_transfers
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.auto_complete_transfer_documents();

-- =====================================================
-- STOCK DOCUMENT ATTACHMENTS
-- =====================================================
-- File attachments for stock documents (receipts, issues, transfers)

CREATE TABLE IF NOT EXISTS public.stock_document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL,
  document_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT stock_document_attachments_type_check CHECK (document_type IN ('receipt', 'issue', 'transfer'))
);

CREATE INDEX idx_stock_document_attachments_document
  ON public.stock_document_attachments(document_type, document_id);
CREATE INDEX idx_stock_document_attachments_uploader
  ON public.stock_document_attachments(uploaded_by_id);

COMMENT ON TABLE public.stock_document_attachments IS 'File attachments for stock documents (receipts, issues, transfers)';
COMMENT ON COLUMN public.stock_document_attachments.document_type IS 'Type of document: receipt, issue, or transfer';
COMMENT ON COLUMN public.stock_document_attachments.document_id IS 'UUID of the stock document (receipt_id, issue_id, or transfer_id)';
COMMENT ON COLUMN public.stock_document_attachments.file_path IS 'Path to the uploaded file in storage bucket';

-- RLS Policies for stock_document_attachments
ALTER TABLE public.stock_document_attachments ENABLE ROW LEVEL SECURITY;

-- Consolidated SELECT policy (Admin/Manager/Technician can view)
CREATE POLICY stock_document_attachments_select_policy ON public.stock_document_attachments
  FOR SELECT TO authenticated
  USING (public.has_any_role(ARRAY['admin', 'manager']) OR public.is_technician());

-- Consolidated INSERT policy (Admin/Manager can insert, Technicians can insert their own)
CREATE POLICY stock_document_attachments_insert_policy ON public.stock_document_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'manager'])
    OR
    (uploaded_by_id = (SELECT id FROM public.profiles WHERE user_id = (SELECT auth.uid())) AND public.is_technician())
  );

-- UPDATE and DELETE (Admin/Manager only)
CREATE POLICY stock_document_attachments_update_policy ON public.stock_document_attachments
  FOR UPDATE TO authenticated
  USING (public.has_any_role(ARRAY['admin', 'manager']))
  WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));

CREATE POLICY stock_document_attachments_delete_policy ON public.stock_document_attachments
  FOR DELETE TO authenticated
  USING (public.has_any_role(ARRAY['admin', 'manager']));
