-- =====================================================
-- Migration: Inventory Redesign Part 3 - Stock Receipts
-- Description: Recreate stock receipts with virtual_warehouse_id
-- Date: 2025-10-28
-- =====================================================

-- Stock Receipts (NEW: uses virtual_warehouse_id)
CREATE TABLE IF NOT EXISTS public.stock_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  receipt_type public.stock_receipt_type NOT NULL DEFAULT 'normal',
  status public.stock_document_status NOT NULL DEFAULT 'draft',

  -- NEW: Direct reference to virtual warehouse instance
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

-- Indexes
CREATE INDEX idx_stock_receipts_status ON public.stock_receipts(status);
CREATE INDEX idx_stock_receipts_type ON public.stock_receipts(receipt_type);
CREATE INDEX idx_stock_receipts_date ON public.stock_receipts(receipt_date);
CREATE INDEX idx_stock_receipts_warehouse ON public.stock_receipts(virtual_warehouse_id);
CREATE INDEX idx_stock_receipts_created_by ON public.stock_receipts(created_by_id);

COMMENT ON TABLE public.stock_receipts IS 'Stock receipt documents (Phiếu Nhập Kho) - now references virtual warehouse directly';
COMMENT ON COLUMN public.stock_receipts.virtual_warehouse_id IS 'Virtual warehouse instance (kho ảo cụ thể) to receive stock';
COMMENT ON COLUMN public.stock_receipts.receipt_type IS 'normal (default) or adjustment (kiểm kê)';

-- Auto-generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
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
  EXECUTE FUNCTION public.generate_receipt_number();

CREATE TRIGGER trigger_stock_receipts_updated_at
  BEFORE UPDATE ON public.stock_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Stock Receipt Items (NEW: Allow negative quantities for adjustments)
CREATE TABLE IF NOT EXISTS public.stock_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.stock_receipts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  -- NEW: Can be negative for adjustment receipts
  declared_quantity INT NOT NULL,
  serial_count INT NOT NULL DEFAULT 0,

  warranty_start_date DATE,
  warranty_months INT,

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

COMMENT ON TABLE public.stock_receipt_items IS 'Line items in stock receipts (can have negative quantities for adjustments)';
COMMENT ON COLUMN public.stock_receipt_items.declared_quantity IS 'Quantity (positive=increase, negative=decrease for adjustments)';

CREATE TRIGGER trigger_stock_receipt_items_updated_at
  BEFORE UPDATE ON public.stock_receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Stock Receipt Serials (unchanged)
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

SELECT 'Part 3 Complete: Stock receipts recreated with virtual_warehouse_id' as status;
