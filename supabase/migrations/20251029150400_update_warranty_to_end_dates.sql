-- =====================================================
-- Migration: Update warranty fields to use end dates
-- Description: Change from start_date+months to manufacturer/user end dates
-- Date: 2025-10-29
-- =====================================================

-- =====================================================
-- PART 1: Update physical_products table
-- =====================================================

-- Step 1: Add new warranty end date columns to physical_products
ALTER TABLE public.physical_products
  ADD COLUMN IF NOT EXISTS manufacturer_warranty_end_date DATE,
  ADD COLUMN IF NOT EXISTS user_warranty_end_date DATE;

COMMENT ON COLUMN public.physical_products.manufacturer_warranty_end_date IS 'Manufacturer warranty end date (nullable - managed separately at /inventory/products)';
COMMENT ON COLUMN public.physical_products.user_warranty_end_date IS 'Extended warranty for end user (nullable - managed separately at /inventory/products)';

-- Step 2: Migrate existing data (warranty_end_date -> manufacturer_warranty_end_date)
UPDATE public.physical_products
SET manufacturer_warranty_end_date = warranty_end_date
WHERE warranty_end_date IS NOT NULL;

-- Step 3: Drop views that depend on old warranty columns
DROP VIEW IF EXISTS public.v_warranty_expiring_soon CASCADE;
DROP VIEW IF EXISTS public.v_warehouse_stock_levels CASCADE;

-- Step 4: Drop old trigger and function
DROP TRIGGER IF EXISTS trigger_physical_products_warranty_calculation ON public.physical_products;
DROP FUNCTION IF EXISTS public.calculate_physical_product_warranty_end_date();

-- Step 5: Drop old warranty columns from physical_products
ALTER TABLE public.physical_products
  DROP COLUMN IF EXISTS warranty_start_date,
  DROP COLUMN IF EXISTS warranty_months,
  DROP COLUMN IF EXISTS warranty_end_date;

-- =====================================================
-- PART 2: Update stock_receipt_items table
-- =====================================================

-- Remove warranty fields from receipt items (will use end dates in serials)
ALTER TABLE public.stock_receipt_items
  DROP COLUMN IF EXISTS warranty_start_date,
  DROP COLUMN IF EXISTS warranty_months;

-- =====================================================
-- PART 3: Update stock_receipt_serials table
-- =====================================================

-- Step 1: Add warranty end date fields to receipt serials for data entry
ALTER TABLE public.stock_receipt_serials
  ADD COLUMN IF NOT EXISTS manufacturer_warranty_end_date DATE,
  ADD COLUMN IF NOT EXISTS user_warranty_end_date DATE;

COMMENT ON COLUMN public.stock_receipt_serials.manufacturer_warranty_end_date IS 'Manufacturer warranty end date (nullable - optional during serial entry)';
COMMENT ON COLUMN public.stock_receipt_serials.user_warranty_end_date IS 'Extended warranty end date (nullable - optional during serial entry)';

-- Step 2: Drop old warranty columns from stock_receipt_serials
ALTER TABLE public.stock_receipt_serials
  DROP COLUMN IF EXISTS warranty_start_date,
  DROP COLUMN IF EXISTS warranty_months;

-- =====================================================
-- Verification
-- =====================================================

-- Verify physical_products has new fields
SELECT '✅ physical_products updated' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'physical_products'
    AND column_name IN ('manufacturer_warranty_end_date', 'user_warranty_end_date')
)
AND NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'physical_products'
    AND column_name IN ('warranty_start_date', 'warranty_months', 'warranty_end_date')
);

-- Verify stock_receipt_serials has new fields
SELECT '✅ stock_receipt_serials updated' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'stock_receipt_serials'
    AND column_name IN ('manufacturer_warranty_end_date', 'user_warranty_end_date')
)
AND NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'stock_receipt_serials'
    AND column_name IN ('warranty_start_date', 'warranty_months')
);

-- Display completion message
SELECT '✅ Warranty fields migration complete' as result;

-- =====================================================
-- PART 4: Recreate views with new warranty fields
-- =====================================================

-- Recreate v_warranty_expiring_soon view with new fields
CREATE OR REPLACE VIEW public.v_warranty_expiring_soon AS
SELECT
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  vw.warehouse_type AS virtual_warehouse_type,
  vw.name AS virtual_warehouse_name,
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  pp.manufacturer_warranty_end_date,
  pp.user_warranty_end_date,
  CASE
    WHEN pp.user_warranty_end_date IS NOT NULL THEN 'user'
    WHEN pp.manufacturer_warranty_end_date IS NOT NULL THEN 'manufacturer'
    ELSE 'none'
  END AS warranty_type,
  CASE
    WHEN pp.user_warranty_end_date IS NOT NULL THEN pp.user_warranty_end_date - CURRENT_DATE
    WHEN pp.manufacturer_warranty_end_date IS NOT NULL THEN pp.manufacturer_warranty_end_date - CURRENT_DATE
    ELSE NULL
  END AS days_remaining,
  CASE
    WHEN pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date <= CURRENT_DATE THEN 'expired'
    WHEN pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date <= CURRENT_DATE THEN 'expired'
    WHEN pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date <= (CURRENT_DATE + '30 days'::interval) THEN 'expiring_soon'
    WHEN pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date <= (CURRENT_DATE + '30 days'::interval) THEN 'expiring_soon'
    ELSE 'active'
  END AS warranty_status,
  pw.name AS physical_warehouse_name,
  pw.code AS physical_warehouse_code,
  st.id AS current_ticket_id,
  st.ticket_number AS current_ticket_number,
  st.status AS current_ticket_status,
  pp.created_at,
  pp.updated_at
FROM public.physical_products pp
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
JOIN public.virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
LEFT JOIN public.physical_warehouses pw ON pp.physical_warehouse_id = pw.id
LEFT JOIN public.service_tickets st ON pp.current_ticket_id = st.id
WHERE (pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
   OR (pp.user_warranty_end_date IS NULL AND pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
ORDER BY
  CASE
    WHEN pp.user_warranty_end_date IS NOT NULL THEN pp.user_warranty_end_date
    ELSE pp.manufacturer_warranty_end_date
  END;

COMMENT ON VIEW public.v_warranty_expiring_soon IS 'Physical products with warranty expiring within 30 days (prioritizes user warranty over manufacturer warranty)';

-- Display view recreation status
SELECT '✅ Views recreated with new warranty fields' as result;
