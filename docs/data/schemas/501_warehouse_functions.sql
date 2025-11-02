-- =====================================================
-- 501_warehouse_functions.sql
-- =====================================================
-- Warehouse Statistics and Aggregation Functions
--
-- Functions for:
-- - Inventory statistics (dashboard)
-- - Aggregated stock across warehouses
-- - Stock status calculations
--
-- ORDER: 500-599 (Functions)
-- DEPENDENCIES: 202, 204
-- =====================================================

-- Function to get inventory stats for dashboard
CREATE OR REPLACE FUNCTION public.get_inventory_stats()
RETURNS TABLE (
  total_skus BIGINT,
  total_declared BIGINT,
  total_actual BIGINT,
  critical_count BIGINT,
  warning_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT pws.product_id)::BIGINT AS total_skus,
    COALESCE(SUM(pws.declared_quantity), 0)::BIGINT AS total_declared,
    (SELECT COUNT(*)::BIGINT FROM public.physical_products) AS total_actual,
    COUNT(DISTINCT CASE
      WHEN (
        SELECT COUNT(*)::INTEGER
        FROM public.physical_products pp
        WHERE pp.product_id = pws.product_id
          AND pp.virtual_warehouse_id = pws.virtual_warehouse_id
      ) < (pws.declared_quantity * 0.1) THEN pws.id
    END)::BIGINT AS critical_count,
    COUNT(DISTINCT CASE
      WHEN (
        SELECT COUNT(*)::INTEGER
        FROM public.physical_products pp
        WHERE pp.product_id = pws.product_id
          AND pp.virtual_warehouse_id = pws.virtual_warehouse_id
      ) >= (pws.declared_quantity * 0.1)
      AND (
        SELECT COUNT(*)::INTEGER
        FROM public.physical_products pp
        WHERE pp.product_id = pws.product_id
          AND pp.virtual_warehouse_id = pws.virtual_warehouse_id
      ) < (pws.declared_quantity * 0.5) THEN pws.id
    END)::BIGINT AS warning_count
  FROM public.product_warehouse_stock pws;
END;
$$;

COMMENT ON FUNCTION public.get_inventory_stats() IS 'Get aggregated inventory statistics for dashboard';

-- Function to get aggregated stock across all warehouses
CREATE OR REPLACE FUNCTION public.get_aggregated_stock(search_term TEXT DEFAULT NULL)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  total_declared BIGINT,
  total_actual BIGINT,
  serial_gap BIGINT,
  stock_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku AS sku,
    COALESCE(SUM(pws.declared_quantity), 0)::BIGINT AS total_declared,
    COALESCE(
      (SELECT COUNT(*)::INTEGER
       FROM public.physical_products pp
       WHERE pp.product_id = p.id), 0
    )::BIGINT AS total_actual,
    (
      COALESCE(SUM(pws.declared_quantity), 0) -
      COALESCE(
        (SELECT COUNT(*)::INTEGER
         FROM public.physical_products pp
         WHERE pp.product_id = p.id), 0
      )
    )::BIGINT AS serial_gap,
    CASE
      WHEN COALESCE(
        (SELECT COUNT(*)::INTEGER
         FROM public.physical_products pp
         WHERE pp.product_id = p.id), 0
      ) = 0 THEN 'critical'
      WHEN COALESCE(
        (SELECT COUNT(*)::INTEGER
         FROM public.physical_products pp
         WHERE pp.product_id = p.id), 0
      ) < (COALESCE(SUM(pws.declared_quantity), 0) * 0.5) THEN 'warning'
      ELSE 'ok'
    END AS stock_status
  FROM public.products p
  LEFT JOIN public.product_warehouse_stock pws ON pws.product_id = p.id
  WHERE p.is_active = TRUE
    AND (
      search_term IS NULL
      OR p.name ILIKE '%' || search_term || '%'
      OR p.sku ILIKE '%' || search_term || '%'
    )
  GROUP BY p.id, p.name, p.sku
  ORDER BY p.name ASC;
END;
$$;

COMMENT ON FUNCTION public.get_aggregated_stock(TEXT) IS 'Get aggregated stock summary across all warehouses with optional search';

-- Grants
GRANT EXECUTE ON FUNCTION public.get_inventory_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_aggregated_stock(TEXT) TO authenticated;
