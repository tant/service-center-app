-- =====================================================
-- Migration: Update physical_products to use virtual_warehouse_id
-- Description: Change from virtual_warehouse_type to virtual_warehouse_id for consistency
-- Date: 2025-10-29
-- =====================================================

-- Step 1: Add new column (nullable initially for data migration)
ALTER TABLE public.physical_products
ADD COLUMN virtual_warehouse_id UUID REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT;

-- Step 2: Create a temporary function to migrate data
-- This function finds the correct virtual_warehouse_id based on:
-- 1. warehouse_type matching virtual_warehouse_type
-- 2. physical_warehouse_id matching (if specified)
CREATE OR REPLACE FUNCTION migrate_physical_products_warehouse()
RETURNS void AS $$
DECLARE
  product_record RECORD;
  target_vw_id UUID;
BEGIN
  FOR product_record IN
    SELECT id, virtual_warehouse_type, physical_warehouse_id
    FROM public.physical_products
    WHERE virtual_warehouse_id IS NULL
  LOOP
    -- Find matching virtual warehouse
    IF product_record.physical_warehouse_id IS NOT NULL THEN
      -- Match both warehouse_type and physical_warehouse_id
      SELECT id INTO target_vw_id
      FROM public.virtual_warehouses
      WHERE warehouse_type = product_record.virtual_warehouse_type
        AND physical_warehouse_id = product_record.physical_warehouse_id
      LIMIT 1;
    ELSE
      -- Match only warehouse_type (take first match)
      SELECT id INTO target_vw_id
      FROM public.virtual_warehouses
      WHERE warehouse_type = product_record.virtual_warehouse_type
      LIMIT 1;
    END IF;

    -- Update the record
    IF target_vw_id IS NOT NULL THEN
      UPDATE public.physical_products
      SET virtual_warehouse_id = target_vw_id
      WHERE id = product_record.id;
    ELSE
      RAISE WARNING 'No matching virtual warehouse found for physical_product id: %, type: %',
        product_record.id, product_record.virtual_warehouse_type;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Run the migration function
SELECT migrate_physical_products_warehouse();

-- Step 4: Drop the temporary function
DROP FUNCTION IF EXISTS migrate_physical_products_warehouse();

-- Step 5: Make virtual_warehouse_id NOT NULL (after data migration)
ALTER TABLE public.physical_products
ALTER COLUMN virtual_warehouse_id SET NOT NULL;

-- Step 6: Handle previous_virtual_warehouse_type (used for RMA tracking)
-- Add new column
ALTER TABLE public.physical_products
ADD COLUMN previous_virtual_warehouse_id UUID REFERENCES public.virtual_warehouses(id) ON DELETE SET NULL;

-- Migrate previous_virtual_warehouse_type data
UPDATE public.physical_products pp
SET previous_virtual_warehouse_id = (
  SELECT vw.id
  FROM public.virtual_warehouses vw
  WHERE vw.warehouse_type = pp.previous_virtual_warehouse_type
    AND (pp.physical_warehouse_id IS NULL OR vw.physical_warehouse_id = pp.physical_warehouse_id)
  LIMIT 1
)
WHERE pp.previous_virtual_warehouse_type IS NOT NULL;

-- Drop old previous_virtual_warehouse_type column
ALTER TABLE public.physical_products
DROP COLUMN IF EXISTS previous_virtual_warehouse_type;

COMMENT ON COLUMN public.physical_products.previous_virtual_warehouse_id IS
  'Stores the virtual warehouse before product was moved to RMA, used to restore product location when removed from RMA batch';

-- Step 6.5: Drop views that depend on virtual_warehouse_type
DROP VIEW IF EXISTS v_warehouse_stock_levels CASCADE;
DROP VIEW IF EXISTS v_warranty_expiring_soon CASCADE;
DROP VIEW IF EXISTS v_low_stock_alerts CASCADE;
DROP VIEW IF EXISTS v_stock_summary CASCADE;

-- Step 7: Drop old virtual_warehouse_type column
ALTER TABLE public.physical_products
DROP COLUMN IF EXISTS virtual_warehouse_type;

-- Note: We keep physical_warehouse_id for now as it might be used for denormalized queries
-- but it's no longer the primary warehouse reference

-- Step 8: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_physical_products_virtual_warehouse
ON public.physical_products(virtual_warehouse_id);

-- Step 9: Add comment
COMMENT ON COLUMN public.physical_products.virtual_warehouse_id IS
  'Virtual warehouse instance where this product is currently located';

-- Step 10: Update stock_movements table to use virtual_warehouse_id
-- First add new columns
ALTER TABLE public.stock_movements
ADD COLUMN from_virtual_warehouse_id UUID REFERENCES public.virtual_warehouses(id) ON DELETE SET NULL,
ADD COLUMN to_virtual_warehouse_id UUID REFERENCES public.virtual_warehouses(id) ON DELETE SET NULL;

-- Migrate stock_movements data (match warehouse_type to get virtual_warehouse_id)
UPDATE public.stock_movements sm
SET from_virtual_warehouse_id = (
  SELECT vw.id
  FROM public.virtual_warehouses vw
  WHERE vw.warehouse_type = sm.from_virtual_warehouse
    AND (sm.from_physical_warehouse_id IS NULL OR vw.physical_warehouse_id = sm.from_physical_warehouse_id)
  LIMIT 1
)
WHERE sm.from_virtual_warehouse IS NOT NULL;

UPDATE public.stock_movements sm
SET to_virtual_warehouse_id = (
  SELECT vw.id
  FROM public.virtual_warehouses vw
  WHERE vw.warehouse_type = sm.to_virtual_warehouse
    AND (sm.to_physical_warehouse_id IS NULL OR vw.physical_warehouse_id = sm.to_physical_warehouse_id)
  LIMIT 1
)
WHERE sm.to_virtual_warehouse IS NOT NULL;

-- Drop view that depends on stock_movements old columns
DROP VIEW IF EXISTS v_stock_movement_history CASCADE;

-- Drop old warehouse type columns from stock_movements
ALTER TABLE public.stock_movements
DROP COLUMN IF EXISTS from_virtual_warehouse,
DROP COLUMN IF EXISTS to_virtual_warehouse;

-- Add indexes for stock_movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_from_virtual_warehouse
ON public.stock_movements(from_virtual_warehouse_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_to_virtual_warehouse
ON public.stock_movements(to_virtual_warehouse_id);

COMMENT ON COLUMN public.stock_movements.from_virtual_warehouse_id IS
  'Source virtual warehouse instance';
COMMENT ON COLUMN public.stock_movements.to_virtual_warehouse_id IS
  'Destination virtual warehouse instance';

-- Step 11: Recreate views with updated schema
CREATE OR REPLACE VIEW public.v_warehouse_stock_levels AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  vw.warehouse_type,
  pp.condition,
  COUNT(*) AS quantity,
  COUNT(*) FILTER (WHERE pp.warranty_end_date IS NOT NULL AND pp.warranty_end_date > CURRENT_DATE + INTERVAL '30 days') AS active_warranty_count,
  COUNT(*) FILTER (WHERE pp.warranty_end_date IS NOT NULL AND pp.warranty_end_date > CURRENT_DATE AND pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days') AS expiring_soon_count,
  COUNT(*) FILTER (WHERE pp.warranty_end_date IS NOT NULL AND pp.warranty_end_date <= CURRENT_DATE) AS expired_count,
  SUM(pp.purchase_price) AS total_purchase_value,
  AVG(pp.purchase_price) AS avg_purchase_price,
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,
  pst.alert_enabled,
  CASE WHEN pst.minimum_quantity IS NOT NULL AND COUNT(*) < pst.minimum_quantity THEN true ELSE false END AS is_below_minimum,
  MIN(pp.created_at) AS oldest_stock_date,
  MAX(pp.created_at) AS newest_stock_date
FROM public.physical_products pp
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
JOIN public.virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
LEFT JOIN public.product_stock_thresholds pst ON pst.product_id = p.id AND pst.warehouse_type = vw.warehouse_type
GROUP BY p.id, p.name, p.sku, b.name, vw.warehouse_type, pp.condition, pst.minimum_quantity, pst.reorder_quantity, pst.maximum_quantity, pst.alert_enabled
ORDER BY b.name, p.name, vw.warehouse_type;
COMMENT ON VIEW public.v_warehouse_stock_levels IS 'Real-time stock levels by product, warehouse type, and condition with threshold alerts';

CREATE OR REPLACE VIEW public.v_warranty_expiring_soon AS
SELECT
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  vw.warehouse_type AS virtual_warehouse_type,
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  pp.warranty_start_date,
  pp.warranty_months,
  pp.warranty_end_date,
  CASE
    WHEN pp.warranty_end_date IS NULL THEN 'unknown'::TEXT
    WHEN pp.warranty_end_date <= CURRENT_DATE THEN 'expired'::TEXT
    WHEN pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'::TEXT
    ELSE 'active'::TEXT
  END AS warranty_status,
  pp.warranty_end_date - CURRENT_DATE AS days_remaining,
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
WHERE pp.warranty_end_date IS NOT NULL
  AND pp.warranty_end_date > CURRENT_DATE
  AND pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY pp.warranty_end_date ASC;
COMMENT ON VIEW public.v_warranty_expiring_soon IS 'Products with warranty expiring within 30 days';

CREATE OR REPLACE VIEW public.v_low_stock_alerts AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  pst.warehouse_type,
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,
  COALESCE(stock.quantity, 0) AS current_quantity,
  pst.minimum_quantity - COALESCE(stock.quantity, 0) AS quantity_below_minimum,
  pst.alert_enabled,
  pst.last_alert_sent_at,
  pst.created_at AS threshold_created_at,
  pst.updated_at AS threshold_updated_at
FROM public.product_stock_thresholds pst
JOIN public.products p ON pst.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN (
  SELECT pp.product_id, vw.warehouse_type, COUNT(*) AS quantity
  FROM public.physical_products pp
  JOIN public.virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
  GROUP BY pp.product_id, vw.warehouse_type
) stock ON stock.product_id = p.id AND stock.warehouse_type = pst.warehouse_type
WHERE pst.alert_enabled = true AND COALESCE(stock.quantity, 0) < pst.minimum_quantity
ORDER BY (pst.minimum_quantity - COALESCE(stock.quantity, 0)) DESC, b.name, p.name;
COMMENT ON VIEW public.v_low_stock_alerts IS 'Products below minimum stock thresholds requiring reorder';

CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.sku,
  pws.virtual_warehouse_id,
  vw.name as virtual_warehouse_name,
  vw.warehouse_type,
  vw.physical_warehouse_id,
  pw.name as physical_warehouse_name,
  pws.declared_quantity,
  COALESCE(
    (SELECT COUNT(*)
     FROM physical_products pp
     WHERE pp.product_id = p.id
       AND pp.virtual_warehouse_id = vw.id
    ), 0
  ) as actual_serial_count,
  pws.declared_quantity - COALESCE(
    (SELECT COUNT(*)
     FROM physical_products pp
     WHERE pp.product_id = p.id
       AND pp.virtual_warehouse_id = vw.id
    ), 0
  ) as serial_gap,
  pws.initial_stock_entry,
  pst.minimum_quantity,
  pst.reorder_quantity,
  CASE
    WHEN pws.declared_quantity = 0 THEN 'critical'
    WHEN pst.minimum_quantity IS NOT NULL
         AND pws.declared_quantity <= pst.minimum_quantity THEN 'warning'
    ELSE 'ok'
  END as stock_status,
  pws.created_at,
  pws.updated_at
FROM product_warehouse_stock pws
JOIN products p ON p.id = pws.product_id
JOIN virtual_warehouses vw ON vw.id = pws.virtual_warehouse_id
LEFT JOIN physical_warehouses pw ON pw.id = vw.physical_warehouse_id
LEFT JOIN product_stock_thresholds pst
  ON pst.product_id = pws.product_id
  AND pst.warehouse_type = vw.warehouse_type;

COMMENT ON VIEW v_stock_summary IS 'Complete stock overview with declared vs actual tracking (REDESIGNED)';

CREATE OR REPLACE VIEW public.v_stock_movement_history AS
SELECT
  sm.id AS movement_id,
  sm.movement_type,
  sm.created_at AS moved_at,
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  fvw.warehouse_type AS from_virtual_warehouse,
  fw.name AS from_physical_warehouse_name,
  fw.code AS from_physical_warehouse_code,
  tvw.warehouse_type AS to_virtual_warehouse,
  tw.name AS to_physical_warehouse_name,
  tw.code AS to_physical_warehouse_code,
  sm.ticket_id,
  st.ticket_number,
  st.status AS ticket_status,
  sm.reason,
  sm.notes,
  sm.moved_by_id,
  prof.full_name AS moved_by_name,
  prof.role AS moved_by_role
FROM public.stock_movements sm
JOIN public.physical_products pp ON sm.physical_product_id = pp.id
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.virtual_warehouses fvw ON sm.from_virtual_warehouse_id = fvw.id
LEFT JOIN public.virtual_warehouses tvw ON sm.to_virtual_warehouse_id = tvw.id
LEFT JOIN public.physical_warehouses fw ON sm.from_physical_warehouse_id = fw.id
LEFT JOIN public.physical_warehouses tw ON sm.to_physical_warehouse_id = tw.id
LEFT JOIN public.service_tickets st ON sm.ticket_id = st.id
LEFT JOIN public.profiles prof ON sm.moved_by_id = prof.id
ORDER BY sm.created_at DESC;
COMMENT ON VIEW public.v_stock_movement_history IS 'Detailed stock movement history with product, location, and user context';

SELECT 'Physical products updated to use virtual_warehouse_id successfully' as status;
