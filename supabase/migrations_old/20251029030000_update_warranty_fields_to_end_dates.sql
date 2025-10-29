-- =====================================================
-- Migration: Update warranty fields to use end dates
-- Description: Change from start_date+months to manufacturer/user end dates
-- Date: 2025-10-29
-- =====================================================

-- Step 1: Add new warranty end date columns
ALTER TABLE public.physical_products
  ADD COLUMN IF NOT EXISTS manufacturer_warranty_end_date DATE,
  ADD COLUMN IF NOT EXISTS user_warranty_end_date DATE;

COMMENT ON COLUMN public.physical_products.manufacturer_warranty_end_date IS 'Ngày hết hạn bảo hành nhà máy';
COMMENT ON COLUMN public.physical_products.user_warranty_end_date IS 'Ngày hết hạn bảo hành cho người dùng cuối';

-- Step 2: Migrate existing data (warranty_end_date -> manufacturer_warranty_end_date)
UPDATE public.physical_products
SET manufacturer_warranty_end_date = warranty_end_date
WHERE warranty_end_date IS NOT NULL;

-- Step 3: Drop views that depend on warranty columns
DROP VIEW IF EXISTS v_warranty_expiring_soon CASCADE;
DROP VIEW IF EXISTS v_warehouse_stock_levels CASCADE;

-- Step 4: Drop old trigger (if exists)
DROP TRIGGER IF EXISTS trigger_calculate_warranty_end_date ON public.physical_products;
DROP FUNCTION IF EXISTS public.calculate_warranty_end_date();

-- Step 5: Drop old columns
ALTER TABLE public.physical_products
  DROP COLUMN IF EXISTS warranty_start_date,
  DROP COLUMN IF EXISTS warranty_months,
  DROP COLUMN IF EXISTS warranty_end_date;

-- Step 6: Recreate warranty expiring view with new fields
CREATE OR REPLACE VIEW public.v_warranty_expiring_soon AS
SELECT
  pp.id,
  pp.serial_number,
  pp.product_id,
  p.name AS product_name,
  vw.warehouse_type,
  pp.manufacturer_warranty_end_date,
  pp.user_warranty_end_date,
  CASE
    WHEN pp.user_warranty_end_date IS NOT NULL THEN pp.user_warranty_end_date - CURRENT_DATE
    WHEN pp.manufacturer_warranty_end_date IS NOT NULL THEN pp.manufacturer_warranty_end_date - CURRENT_DATE
    ELSE NULL
  END AS days_remaining
FROM public.physical_products pp
JOIN public.products p ON pp.product_id = p.id
JOIN public.virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
WHERE (pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
   OR (pp.user_warranty_end_date IS NULL AND pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days');

COMMENT ON VIEW public.v_warranty_expiring_soon IS 'Physical products with warranty expiring within 30 days';

-- Recreate warehouse stock levels view
CREATE OR REPLACE VIEW public.v_warehouse_stock_levels AS
SELECT
  vw.id AS virtual_warehouse_id,
  vw.name AS virtual_warehouse_name,
  vw.warehouse_type,
  pw.id AS physical_warehouse_id,
  pw.name AS physical_warehouse_name,
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  COUNT(pp.id) AS actual_quantity,
  COALESCE(pws.declared_quantity, 0) AS declared_quantity,
  COUNT(pp.id) - COALESCE(pws.declared_quantity, 0) AS variance
FROM public.virtual_warehouses vw
JOIN public.physical_warehouses pw ON vw.physical_warehouse_id = pw.id
CROSS JOIN public.products p
LEFT JOIN public.physical_products pp ON pp.virtual_warehouse_id = vw.id AND pp.product_id = p.id
LEFT JOIN public.product_warehouse_stock pws ON pws.virtual_warehouse_id = vw.id AND pws.product_id = p.id
GROUP BY vw.id, vw.name, vw.warehouse_type, pw.id, pw.name, p.id, p.name, p.sku, pws.declared_quantity;

COMMENT ON VIEW public.v_warehouse_stock_levels IS 'Stock levels by warehouse and product with variance';

-- Step 7: Update stock_receipt_items and stock_receipt_serials tables
-- Remove warranty fields from receipt items (will use end dates in physical_products)
ALTER TABLE public.stock_receipt_items
  DROP COLUMN IF EXISTS warranty_start_date,
  DROP COLUMN IF EXISTS warranty_months;

ALTER TABLE public.stock_receipt_serials
  DROP COLUMN IF EXISTS warranty_start_date,
  DROP COLUMN IF EXISTS warranty_months;

-- Step 8: Add warranty end date fields to receipt serials for data entry
ALTER TABLE public.stock_receipt_serials
  ADD COLUMN IF NOT EXISTS manufacturer_warranty_end_date DATE,
  ADD COLUMN IF NOT EXISTS user_warranty_end_date DATE;

COMMENT ON COLUMN public.stock_receipt_serials.manufacturer_warranty_end_date IS 'Ngày hết hạn bảo hành nhà máy';
COMMENT ON COLUMN public.stock_receipt_serials.user_warranty_end_date IS 'Ngày hết hạn bảo hành user';

-- Step 9: Update receipt completion trigger to use new fields
CREATE OR REPLACE FUNCTION public.process_stock_receipt_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update product_warehouse_stock using virtual_warehouse_id
    INSERT INTO product_warehouse_stock (
      product_id,
      virtual_warehouse_id,
      declared_quantity
    )
    SELECT
      sri.product_id,
      NEW.virtual_warehouse_id,
      SUM(sri.declared_quantity)
    FROM stock_receipt_items sri
    WHERE sri.receipt_id = NEW.id
    GROUP BY sri.product_id
    ON CONFLICT (product_id, virtual_warehouse_id)
    DO UPDATE SET
      declared_quantity = product_warehouse_stock.declared_quantity + EXCLUDED.declared_quantity,
      updated_at = NOW();

    -- Create physical_products records for serials with new warranty fields
    INSERT INTO physical_products (
      product_id,
      serial_number,
      condition,
      virtual_warehouse_id,
      manufacturer_warranty_end_date,
      user_warranty_end_date
    )
    SELECT
      sri.product_id,
      srs.serial_number,
      'new',
      NEW.virtual_warehouse_id,
      srs.manufacturer_warranty_end_date,
      srs.user_warranty_end_date
    FROM stock_receipt_items sri
    JOIN stock_receipt_serials srs ON srs.receipt_item_id = sri.id
    WHERE sri.receipt_id = NEW.id
    ON CONFLICT (serial_number) DO NOTHING;

    -- Link serials to physical_products
    UPDATE stock_receipt_serials
    SET physical_product_id = pp.id
    FROM stock_receipt_items sri,
         physical_products pp
    WHERE stock_receipt_serials.receipt_item_id = sri.id
      AND sri.receipt_id = NEW.id
      AND pp.serial_number = stock_receipt_serials.serial_number
      AND stock_receipt_serials.physical_product_id IS NULL;

    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.process_stock_receipt_completion() IS
  'Trigger function to process stock receipt completion with new warranty end date fields';

-- Step 10: Display result
SELECT 'Warranty fields migration complete' as status;
