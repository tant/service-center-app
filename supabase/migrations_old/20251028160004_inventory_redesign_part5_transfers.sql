-- =====================================================
-- Migration: Inventory Redesign Part 5 - Stock Transfers
-- Description: Recreate stock transfers with virtual_warehouse_id and auto-generation
-- Date: 2025-10-28
-- =====================================================

-- Stock Transfers (NEW: uses virtual_warehouse_id + auto-generation columns)
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(50) NOT NULL UNIQUE,
  status public.transfer_status NOT NULL DEFAULT 'draft',

  -- NEW: Direct references to virtual warehouse instances
  from_virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,
  to_virtual_warehouse_id UUID NOT NULL REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT,

  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  completed_at TIMESTAMPTZ,

  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  received_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- NEW: Auto-generated document references (Option 1A)
  generated_issue_id UUID REFERENCES public.stock_issues(id) ON DELETE SET NULL,
  generated_receipt_id UUID REFERENCES public.stock_receipts(id) ON DELETE SET NULL,

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

COMMENT ON TABLE public.stock_transfers IS 'Stock transfer documents (Phiếu Chuyển Kho) - auto-generates issue and receipt';
COMMENT ON COLUMN public.stock_transfers.from_virtual_warehouse_id IS 'Source virtual warehouse (kho nguồn)';
COMMENT ON COLUMN public.stock_transfers.to_virtual_warehouse_id IS 'Destination virtual warehouse (kho đích)';
COMMENT ON COLUMN public.stock_transfers.generated_issue_id IS 'Auto-generated issue document (phiếu xuất tự động)';
COMMENT ON COLUMN public.stock_transfers.generated_receipt_id IS 'Auto-generated receipt document (phiếu nhập tự động)';

-- Auto-generate transfer number
CREATE OR REPLACE FUNCTION public.generate_transfer_number()
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
  EXECUTE FUNCTION public.generate_transfer_number();

CREATE TRIGGER trigger_stock_transfers_updated_at
  BEFORE UPDATE ON public.stock_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Stock Transfer Items (unchanged except warehouse references removed)
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

-- Stock Transfer Serials (unchanged)
CREATE TABLE IF NOT EXISTS public.stock_transfer_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_item_id UUID NOT NULL REFERENCES public.stock_transfer_items(id) ON DELETE CASCADE,
  physical_product_id UUID NOT NULL REFERENCES public.physical_products(id) ON DELETE RESTRICT,
  serial_number VARCHAR(255) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transfer_serials_unique UNIQUE(transfer_item_id, physical_product_id)
);

CREATE INDEX idx_stock_transfer_serials_item ON public.stock_transfer_serials(transfer_item_id);

COMMENT ON TABLE public.stock_transfer_serials IS 'Serial numbers in stock transfers';

SELECT 'Part 5 Complete: Stock transfers recreated with auto-generation support' as status;
