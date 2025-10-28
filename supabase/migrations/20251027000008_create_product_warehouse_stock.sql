-- =====================================================
-- Migration: Create Product Warehouse Stock Table
-- Description: Track declared quantities vs actual serial counts
-- Date: 2025-01-27
-- =====================================================

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
