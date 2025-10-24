-- =====================================================
-- Story 1.9: Warehouse Stock Levels and Low Stock Alerts
-- Create view for aggregated stock levels with thresholds
-- =====================================================

-- Create materialized view for warehouse stock levels
-- Aggregates physical products by product and virtual warehouse
-- Drop existing view/materialized view if exists (try view first, then materialized view)
DROP VIEW IF EXISTS public.v_warehouse_stock_levels CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.v_warehouse_stock_levels CASCADE;

CREATE MATERIALIZED VIEW public.v_warehouse_stock_levels AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  p.type AS product_type,
  pp.virtual_warehouse_type,
  COUNT(pp.id) AS current_stock,
  COALESCE(pst.minimum_quantity, 0) AS threshold,
  CASE
    WHEN COUNT(pp.id) > COALESCE(pst.minimum_quantity, 0) THEN 'ok'
    WHEN COUNT(pp.id) <= COALESCE(pst.minimum_quantity, 0)
      AND COUNT(pp.id) >= COALESCE(pst.minimum_quantity, 0) * 0.5 THEN 'warning'
    ELSE 'critical'
  END AS status,
  pst.alert_enabled,
  pst.reorder_quantity
FROM public.products p
LEFT JOIN public.physical_products pp ON pp.product_id = p.id
LEFT JOIN public.product_stock_thresholds pst
  ON pst.product_id = p.id
  AND pst.warehouse_type = pp.virtual_warehouse_type
WHERE p.is_active = true
GROUP BY
  p.id,
  p.name,
  p.sku,
  p.type,
  pp.virtual_warehouse_type,
  pst.minimum_quantity,
  pst.alert_enabled,
  pst.reorder_quantity;

-- Create unique index first (required for CONCURRENT refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_v_warehouse_stock_levels_unique
  ON public.v_warehouse_stock_levels(product_id, virtual_warehouse_type);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_v_warehouse_stock_levels_product
  ON public.v_warehouse_stock_levels(product_id);

CREATE INDEX IF NOT EXISTS idx_v_warehouse_stock_levels_warehouse
  ON public.v_warehouse_stock_levels(virtual_warehouse_type);

CREATE INDEX IF NOT EXISTS idx_v_warehouse_stock_levels_status
  ON public.v_warehouse_stock_levels(status);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_warehouse_stock_levels()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY v_warehouse_stock_levels;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh view when stock movements occur
-- Note: We'll refresh manually or via scheduled job for better performance
COMMENT ON MATERIALIZED VIEW public.v_warehouse_stock_levels IS
  'Aggregated warehouse stock levels with thresholds and status';
COMMENT ON FUNCTION refresh_warehouse_stock_levels() IS
  'Refreshes the warehouse stock levels materialized view';

-- Seed default stock thresholds for warranty_stock warehouse
INSERT INTO public.product_stock_thresholds (product_id, warehouse_type, minimum_quantity, reorder_quantity, alert_enabled)
SELECT
  id,
  'warranty_stock'::public.warehouse_type,
  5,
  10,
  true
FROM public.products
WHERE is_active = true
ON CONFLICT (product_id, warehouse_type) DO NOTHING;

-- Initial refresh of the view
SELECT refresh_warehouse_stock_levels();
