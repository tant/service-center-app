-- =====================================================
-- Migration: Drop old warranty triggers and functions
-- Description: Remove triggers that calculate warranty using old fields (warranty_start_date, warranty_months)
--              These conflict with new warranty end date fields (manufacturer_warranty_end_date, user_warranty_end_date)
-- Date: 2025-10-29
-- =====================================================

-- Drop old warranty calculation triggers
DROP TRIGGER IF EXISTS trigger_physical_products_warranty_calculation ON public.physical_products;
DROP TRIGGER IF EXISTS trigger_physical_products_end_user_warranty_calculation ON public.physical_products;

-- Drop old warranty calculation functions
DROP FUNCTION IF EXISTS public.calculate_physical_product_warranty_end_date();
DROP FUNCTION IF EXISTS public.calculate_end_user_warranty_end_date();

-- Drop old warranty columns that conflict with new schema
ALTER TABLE public.physical_products
  DROP COLUMN IF EXISTS end_user_warranty_start,
  DROP COLUMN IF EXISTS end_user_warranty_months,
  DROP COLUMN IF EXISTS end_user_warranty_end;

COMMENT ON TABLE public.physical_products IS
  'Physical products with serial numbers. Warranty end dates (manufacturer_warranty_end_date, user_warranty_end_date) are now stored directly without automatic calculation.';

SELECT 'Old warranty triggers, functions, and columns removed successfully' as status;
