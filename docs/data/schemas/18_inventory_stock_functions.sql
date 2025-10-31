-- =====================================================
-- 18_inventory_stock_functions.sql
-- =====================================================
-- Functions for inventory overview statistics
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
    COALESCE(
      SUM(
        (SELECT COUNT(*)::INTEGER
         FROM public.physical_products pp
         WHERE pp.product_id = pws.product_id
           AND pp.virtual_warehouse_id = pws.virtual_warehouse_id
           AND pp.physical_warehouse_id = pws.physical_warehouse_id
           AND pp.deleted_at IS NULL)
      ), 0
    )::BIGINT AS total_actual,
    COUNT(DISTINCT CASE
      WHEN (
        SELECT COUNT(*)::INTEGER
        FROM public.physical_products pp
        WHERE pp.product_id = pws.product_id
          AND pp.virtual_warehouse_id = pws.virtual_warehouse_id
          AND pp.physical_warehouse_id = pws.physical_warehouse_id
          AND pp.deleted_at IS NULL
      ) < (pws.declared_quantity * 0.1) THEN pws.id
    END)::BIGINT AS critical_count,
    COUNT(DISTINCT CASE
      WHEN (
        SELECT COUNT(*)::INTEGER
        FROM public.physical_products pp
        WHERE pp.product_id = pws.product_id
          AND pp.virtual_warehouse_id = pws.virtual_warehouse_id
          AND pp.physical_warehouse_id = pws.physical_warehouse_id
          AND pp.deleted_at IS NULL
      ) >= (pws.declared_quantity * 0.1)
      AND (
        SELECT COUNT(*)::INTEGER
        FROM public.physical_products pp
        WHERE pp.product_id = pws.product_id
          AND pp.virtual_warehouse_id = pws.virtual_warehouse_id
          AND pp.physical_warehouse_id = pws.physical_warehouse_id
          AND pp.deleted_at IS NULL
      ) < (pws.declared_quantity * 0.5) THEN pws.id
    END)::BIGINT AS warning_count
  FROM public.product_warehouse_stock pws
  WHERE pws.deleted_at IS NULL;
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
      SUM(
        (SELECT COUNT(*)::INTEGER
         FROM public.physical_products pp
         WHERE pp.product_id = p.id
           AND pp.deleted_at IS NULL)
      ), 0
    )::BIGINT AS total_actual,
    (
      COALESCE(
        SUM(
          (SELECT COUNT(*)::INTEGER
           FROM public.physical_products pp
           WHERE pp.product_id = p.id
             AND pp.deleted_at IS NULL)
        ), 0
      ) - COALESCE(SUM(pws.declared_quantity), 0)
    )::BIGINT AS serial_gap,
    CASE
      WHEN COALESCE(
        SUM(
          (SELECT COUNT(*)::INTEGER
           FROM public.physical_products pp
           WHERE pp.product_id = p.id
             AND pp.deleted_at IS NULL)
        ), 0
      ) < (COALESCE(SUM(pws.declared_quantity), 0) * 0.1) THEN 'critical'
      WHEN COALESCE(
        SUM(
          (SELECT COUNT(*)::INTEGER
           FROM public.physical_products pp
           WHERE pp.product_id = p.id
             AND pp.deleted_at IS NULL)
        ), 0
      ) < (COALESCE(SUM(pws.declared_quantity), 0) * 0.5) THEN 'warning'
      ELSE 'ok'
    END AS stock_status
  FROM public.products p
  LEFT JOIN public.product_warehouse_stock pws ON pws.product_id = p.id AND pws.deleted_at IS NULL
  WHERE p.deleted_at IS NULL
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
