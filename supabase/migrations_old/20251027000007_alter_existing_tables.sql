-- =====================================================
-- Migration: Alter Existing Tables for Inventory
-- Description: Add warranty tracking columns to products and physical_products
-- Date: 2025-01-27
-- =====================================================

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
CREATE OR REPLACE FUNCTION public.calculate_end_user_warranty_end_date()
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
  EXECUTE FUNCTION public.calculate_end_user_warranty_end_date();
