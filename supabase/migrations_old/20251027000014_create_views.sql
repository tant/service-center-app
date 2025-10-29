-- =====================================================
-- Migration: Create Views for Reporting
-- Description: Views for stock summary and approvals
-- Date: 2025-01-27
-- =====================================================

-- =====================================================
-- VIEW: Stock Summary with Gap Tracking
-- =====================================================
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.sku,
  pws.virtual_warehouse_type,
  pws.physical_warehouse_id,
  pw.name as physical_warehouse_name,
  pws.declared_quantity,
  COALESCE(
    (SELECT COUNT(*)
     FROM physical_products pp
     WHERE pp.product_id = p.id
       AND pp.virtual_warehouse_type = pws.virtual_warehouse_type
       AND (pp.physical_warehouse_id = pws.physical_warehouse_id
            OR (pp.physical_warehouse_id IS NULL AND pws.physical_warehouse_id IS NULL))
    ), 0
  ) as actual_serial_count,
  pws.declared_quantity - COALESCE(
    (SELECT COUNT(*)
     FROM physical_products pp
     WHERE pp.product_id = p.id
       AND pp.virtual_warehouse_type = pws.virtual_warehouse_type
       AND (pp.physical_warehouse_id = pws.physical_warehouse_id
            OR (pp.physical_warehouse_id IS NULL AND pws.physical_warehouse_id IS NULL))
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
LEFT JOIN physical_warehouses pw ON pw.id = pws.physical_warehouse_id
LEFT JOIN product_stock_thresholds pst
  ON pst.product_id = pws.product_id
  AND pst.warehouse_type = pws.virtual_warehouse_type;

COMMENT ON VIEW v_stock_summary IS
  'Complete stock overview with declared vs actual tracking';

-- =====================================================
-- VIEW: Pending Approvals Dashboard
-- =====================================================
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
  'receipt' as document_type,
  sr.id,
  sr.receipt_number as document_number,
  sr.receipt_type::text as sub_type,
  sr.status::text as status,
  sr.receipt_date as document_date,
  sr.created_by_id,
  p.full_name as created_by_name,
  sr.created_at,
  COALESCE((
    SELECT SUM(declared_quantity)
    FROM stock_receipt_items
    WHERE receipt_id = sr.id
  ), 0) as total_quantity,
  COALESCE((
    SELECT SUM(total_price)
    FROM stock_receipt_items
    WHERE receipt_id = sr.id
  ), 0) as total_value
FROM stock_receipts sr
JOIN profiles p ON p.id = sr.created_by_id
WHERE sr.status = 'pending_approval'

UNION ALL

SELECT
  'issue' as document_type,
  si.id,
  si.issue_number as document_number,
  si.issue_type::text as sub_type,
  si.status::text as status,
  si.issue_date as document_date,
  si.created_by_id,
  p.full_name as created_by_name,
  si.created_at,
  COALESCE((
    SELECT SUM(quantity)
    FROM stock_issue_items
    WHERE issue_id = si.id
  ), 0) as total_quantity,
  COALESCE((
    SELECT SUM(total_price)
    FROM stock_issue_items
    WHERE issue_id = si.id
  ), 0) as total_value
FROM stock_issues si
JOIN profiles p ON p.id = si.created_by_id
WHERE si.status = 'pending_approval'

UNION ALL

SELECT
  'transfer' as document_type,
  st.id,
  st.transfer_number as document_number,
  'transfer' as sub_type,
  st.status::text as status,
  st.transfer_date as document_date,
  st.created_by_id,
  p.full_name as created_by_name,
  st.created_at,
  COALESCE((
    SELECT SUM(quantity)
    FROM stock_transfer_items
    WHERE transfer_id = st.id
  ), 0) as total_quantity,
  0 as total_value
FROM stock_transfers st
JOIN profiles p ON p.id = st.created_by_id
WHERE st.status = 'pending_approval';

COMMENT ON VIEW v_pending_approvals IS
  'Unified view of all pending approvals across document types';

-- =====================================================
-- HELPER FUNCTIONS for tRPC
-- =====================================================

-- Get aggregated stock (for "All Warehouses" tab)
CREATE OR REPLACE FUNCTION get_aggregated_stock(search_term TEXT DEFAULT NULL)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  total_declared BIGINT,
  total_actual BIGINT,
  serial_gap BIGINT,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.sku,
    COALESCE(SUM(pws.declared_quantity), 0)::BIGINT,
    (SELECT COUNT(*) FROM physical_products pp WHERE pp.product_id = p.id)::BIGINT,
    (COALESCE(SUM(pws.declared_quantity), 0) - (SELECT COUNT(*) FROM physical_products pp WHERE pp.product_id = p.id))::BIGINT,
    CASE
      WHEN COALESCE(SUM(pws.declared_quantity), 0) = 0 THEN 'critical'
      WHEN COALESCE(SUM(pws.declared_quantity), 0) <= 10 THEN 'warning'
      ELSE 'ok'
    END
  FROM products p
  LEFT JOIN product_warehouse_stock pws ON pws.product_id = p.id
  WHERE search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.sku ILIKE '%' || search_term || '%'
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;

-- Get inventory stats (for dashboard cards)
CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS TABLE (
  total_skus BIGINT,
  total_declared BIGINT,
  total_actual BIGINT,
  critical_count BIGINT,
  warning_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id),
    COALESCE(SUM(pws.declared_quantity), 0)::BIGINT,
    (SELECT COUNT(*) FROM physical_products)::BIGINT,
    COUNT(*) FILTER (WHERE pws.declared_quantity = 0)::BIGINT,
    COUNT(*) FILTER (WHERE pws.declared_quantity > 0 AND pws.declared_quantity <= COALESCE(pst.minimum_quantity, 0))::BIGINT
  FROM products p
  LEFT JOIN product_warehouse_stock pws ON pws.product_id = p.id
  LEFT JOIN product_stock_thresholds pst ON pst.product_id = p.id AND pst.warehouse_type = pws.virtual_warehouse_type;
END;
$$ LANGUAGE plpgsql;
