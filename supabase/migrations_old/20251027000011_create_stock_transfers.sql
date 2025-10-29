-- =====================================================
-- Migration: Create Stock Transfers Tables
-- Description: Stock transfers between warehouses
-- Date: 2025-01-27
-- =====================================================

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
