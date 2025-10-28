-- =====================================================
-- Migration: Inventory Redesign Part 4 - Stock Issues
-- Description: Recreate stock issues with virtual_warehouse_id
-- Date: 2025-10-28
-- =====================================================

-- Stock Issues (NEW: uses virtual_warehouse_id)
CREATE TABLE IF NOT EXISTS public.stock_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number VARCHAR(50) NOT NULL UNIQUE,
  issue_type public.stock_issue_type NOT NULL DEFAULT 'normal',
  status public.stock_document_status NOT NULL DEFAULT 'draft',

  -- NEW: Direct reference to virtual warehouse instance
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

COMMENT ON TABLE public.stock_issues IS 'Stock issue documents (Phiếu Xuất Kho) - now references virtual warehouse directly';
COMMENT ON COLUMN public.stock_issues.virtual_warehouse_id IS 'Virtual warehouse instance (kho ảo cụ thể) to deduct stock from';
COMMENT ON COLUMN public.stock_issues.issue_type IS 'normal (default) or adjustment (kiểm kê)';

-- Auto-generate issue number
CREATE OR REPLACE FUNCTION public.generate_issue_number()
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
  EXECUTE FUNCTION public.generate_issue_number();

CREATE TRIGGER trigger_stock_issues_updated_at
  BEFORE UPDATE ON public.stock_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Stock Issue Items (NEW: Allow negative quantities for adjustments)
CREATE TABLE IF NOT EXISTS public.stock_issue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.stock_issues(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  -- NEW: Can be negative for adjustment issues
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_price, 0)) STORED,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT issue_items_quantity_not_zero CHECK (quantity != 0)
);

CREATE INDEX idx_stock_issue_items_issue ON public.stock_issue_items(issue_id);
CREATE INDEX idx_stock_issue_items_product ON public.stock_issue_items(product_id);

COMMENT ON TABLE public.stock_issue_items IS 'Line items in stock issues (can have negative quantities for adjustments)';
COMMENT ON COLUMN public.stock_issue_items.quantity IS 'Quantity (positive=decrease, negative=increase for adjustments)';

-- Stock Issue Serials (unchanged)
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

COMMENT ON TABLE public.stock_issue_serials IS 'Serial numbers in stock issues';

SELECT 'Part 4 Complete: Stock issues recreated with virtual_warehouse_id' as status;
