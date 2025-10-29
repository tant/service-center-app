-- =====================================================
-- Migration: Seed Sample Data (Optional - for testing)
-- Description: Add sample products and stock for testing
-- Date: 2025-01-27
-- =====================================================

-- WARNING: This is sample data for development/testing only
-- DO NOT run this in production unless you want test data

-- Update existing products with warranty defaults
UPDATE public.products
SET
  default_warranty_months = 36,
  end_user_warranty_months = 12
WHERE default_warranty_months IS NULL;

-- Insert sample product warehouse stock entries
-- (Initialize stock tracking for existing products)
INSERT INTO public.product_warehouse_stock (
  product_id,
  virtual_warehouse_type,
  declared_quantity,
  initial_stock_entry
)
SELECT
  p.id,
  'warranty_stock',
  0,
  0
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_warehouse_stock pws
  WHERE pws.product_id = p.id
    AND pws.virtual_warehouse_type = 'warranty_stock'
)
LIMIT 100; -- Limit to first 100 products

-- Insert sample stock for parts warehouse
INSERT INTO public.product_warehouse_stock (
  product_id,
  virtual_warehouse_type,
  declared_quantity,
  initial_stock_entry
)
SELECT
  p.id,
  'parts',
  0,
  0
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_warehouse_stock pws
  WHERE pws.product_id = p.id
    AND pws.virtual_warehouse_type = 'parts'
)
LIMIT 100;

-- Optional: Add some test physical products with serials
-- Uncomment below if you want sample serial data

/*
INSERT INTO public.physical_products (
  product_id,
  serial_number,
  condition,
  virtual_warehouse_type,
  warranty_start_date,
  warranty_months
)
SELECT
  p.id,
  'TEST-' || p.sku || '-' || LPAD(gs::TEXT, 5, '0'),
  'new',
  'warranty_stock',
  CURRENT_DATE,
  36
FROM public.products p
CROSS JOIN generate_series(1, 5) gs
WHERE p.sku IS NOT NULL
LIMIT 50
ON CONFLICT (serial_number) DO NOTHING;

-- Update declared quantities to match physical products
UPDATE public.product_warehouse_stock pws
SET declared_quantity = (
  SELECT COUNT(*)
  FROM public.physical_products pp
  WHERE pp.product_id = pws.product_id
    AND pp.virtual_warehouse_type = pws.virtual_warehouse_type
)
WHERE pws.virtual_warehouse_type = 'warranty_stock';
*/
