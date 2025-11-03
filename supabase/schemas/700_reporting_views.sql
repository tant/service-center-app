-- =====================================================
-- 700_reporting_views.sql
-- =====================================================
-- Database Views for Reporting and Analytics
--
-- Views for:
-- - Task progress summary
-- - Stock movement history
-- - Low stock alerts
-- - Warehouse stock levels
-- - Warranty expiring soon
--
-- ORDER: 700-799 (Views)
-- DEPENDENCIES: All previous files (requires complete schema)
-- =====================================================
-- DATABASE VIEWS (from 18_phase2_views.sql)
-- =====================================================

-- =====================================================
-- Stock Summary View
-- =====================================================
-- Complete stock overview with declared vs actual tracking
-- Used by inventory overview page tabs and filters
CREATE OR REPLACE VIEW public.v_stock_summary AS
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
    (SELECT COUNT(*)::INTEGER
     FROM public.physical_products pp
     WHERE pp.product_id = p.id
       AND pp.virtual_warehouse_id = vw.id
    ), 0
  ) as actual_serial_count,
  pws.declared_quantity - COALESCE(
    (SELECT COUNT(*)::INTEGER
     FROM public.physical_products pp
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
FROM public.product_warehouse_stock pws
JOIN public.products p ON p.id = pws.product_id
JOIN public.virtual_warehouses vw ON vw.id = pws.virtual_warehouse_id
LEFT JOIN public.physical_warehouses pw ON pw.id = vw.physical_warehouse_id
LEFT JOIN public.product_stock_thresholds pst
  ON pst.product_id = pws.product_id
  AND pst.warehouse_type = vw.warehouse_type;

COMMENT ON VIEW public.v_stock_summary IS 'Complete stock overview with declared vs actual tracking (REDESIGNED)';

-- Warehouse Stock Levels View
-- MOVED TO: 19_fix_views_after_physical_warehouse_link.sql
-- (Requires physical_warehouse_id column from file 15)

-- Task Progress Summary View
CREATE OR REPLACE VIEW public.v_task_progress_summary AS
SELECT st.id AS ticket_id, st.ticket_number, st.status AS ticket_status, wf.id AS workflow_id, wf.name AS workflow_name, wf.strict_sequence, COUNT(*) AS total_tasks, COUNT(*) FILTER (WHERE stt.status = 'pending') AS pending_tasks, COUNT(*) FILTER (WHERE stt.status = 'in_progress') AS in_progress_tasks, COUNT(*) FILTER (WHERE stt.status = 'completed') AS completed_tasks, COUNT(*) FILTER (WHERE stt.status = 'blocked') AS blocked_tasks, COUNT(*) FILTER (WHERE stt.status = 'skipped') AS skipped_tasks, COUNT(*) FILTER (WHERE stt.is_required = true) AS required_tasks, COUNT(*) FILTER (WHERE stt.is_required = true AND stt.status = 'completed') AS required_completed, ROUND((COUNT(*) FILTER (WHERE stt.status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) AS completion_percentage, ROUND((COUNT(*) FILTER (WHERE stt.is_required = true AND stt.status = 'completed')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE stt.is_required = true), 0)) * 100, 2) AS required_completion_percentage, MIN(stt.started_at) AS first_task_started_at, MAX(stt.completed_at) AS last_task_completed_at, SUM(CASE WHEN stt.completed_at IS NOT NULL AND stt.started_at IS NOT NULL THEN EXTRACT(EPOCH FROM (stt.completed_at - stt.started_at)) / 60 ELSE 0 END) AS total_minutes_spent, (SELECT jsonb_build_object('id', stt2.id, 'name', stt2.name, 'sequence_order', stt2.sequence_order, 'assigned_to_id', stt2.assigned_to_id) FROM public.service_ticket_tasks stt2 WHERE stt2.ticket_id = st.id AND stt2.status = 'pending' ORDER BY stt2.sequence_order LIMIT 1) AS next_pending_task, (SELECT jsonb_agg(jsonb_build_object('id', stt3.id, 'name', stt3.name, 'sequence_order', stt3.sequence_order, 'blocked_reason', stt3.blocked_reason) ORDER BY stt3.sequence_order) FROM public.service_ticket_tasks stt3 WHERE stt3.ticket_id = st.id AND stt3.status = 'blocked') AS blocked_tasks_detail, st.created_at AS ticket_created_at, st.updated_at AS ticket_updated_at
FROM public.service_tickets st LEFT JOIN public.workflows wf ON st.workflow_id = wf.id LEFT JOIN public.service_ticket_tasks stt ON stt.ticket_id = st.id
GROUP BY st.id, st.ticket_number, st.status, wf.id, wf.name, wf.strict_sequence, st.created_at, st.updated_at
ORDER BY st.created_at DESC;
COMMENT ON VIEW public.v_task_progress_summary IS 'Task completion progress summary per service ticket with next/blocked task details';

-- Warranty Expiring Soon View
-- MOVED TO: 19_fix_views_after_physical_warehouse_link.sql
-- (Requires physical_warehouse_id column from file 15)

-- Service Request Summary View
-- TODO: This view needs redesign for 1:N relationship (service_requests -> service_request_items)
-- Commented out until redesigned
-- CREATE OR REPLACE VIEW public.v_service_request_summary AS
-- SELECT sr.id, sr.tracking_token, sr.status, sr.receipt_status, sr.customer_name, sr.customer_email, sr.customer_phone,
--   sr.issue_description, sr.delivery_method, sr.delivery_address,
--   sr.reviewed_by_id, prof.full_name AS reviewed_by_name, sr.reviewed_at, sr.rejection_reason,
--   sr.converted_at, sr.created_at AS submitted_at, sr.updated_at,
--   CASE WHEN sr.reviewed_at IS NOT NULL THEN EXTRACT(EPOCH FROM (sr.reviewed_at - sr.created_at)) / 3600 ELSE NULL END AS hours_to_review,
--   CASE WHEN sr.converted_at IS NOT NULL THEN EXTRACT(EPOCH FROM (sr.converted_at - sr.created_at)) / 3600 ELSE NULL END AS hours_to_conversion,
--   sr.submitted_ip, sr.user_agent,
--   COUNT(sri.id) AS item_count
-- FROM public.service_requests sr
-- LEFT JOIN public.profiles prof ON sr.reviewed_by_id = prof.id
-- LEFT JOIN public.service_request_items sri ON sr.id = sri.request_id
-- GROUP BY sr.id, prof.full_name
-- ORDER BY sr.created_at DESC;
-- COMMENT ON VIEW public.v_service_request_summary IS 'Service requests with customer info, receipt status, conversion status, and time metrics';

-- Stock Movement History View
CREATE OR REPLACE VIEW public.v_stock_movement_history AS
SELECT sm.id AS movement_id, sm.movement_type, sm.created_at AS moved_at, pp.id AS physical_product_id, pp.serial_number, pp.condition, p.name AS product_name, p.sku AS product_sku, b.name AS brand_name, sm.from_virtual_warehouse, fw.name AS from_physical_warehouse_name, fw.code AS from_physical_warehouse_code, sm.to_virtual_warehouse, tw.name AS to_physical_warehouse_name, tw.code AS to_physical_warehouse_code, sm.ticket_id, st.ticket_number, st.status AS ticket_status, sm.reason, sm.notes, sm.moved_by_id, prof.full_name AS moved_by_name, prof.role AS moved_by_role
FROM public.stock_movements sm JOIN public.physical_products pp ON sm.physical_product_id = pp.id JOIN public.products p ON pp.product_id = p.id JOIN public.brands b ON p.brand_id = b.id LEFT JOIN public.physical_warehouses fw ON sm.from_physical_warehouse_id = fw.id LEFT JOIN public.physical_warehouses tw ON sm.to_physical_warehouse_id = tw.id LEFT JOIN public.service_tickets st ON sm.ticket_id = st.id LEFT JOIN public.profiles prof ON sm.moved_by_id = prof.id
ORDER BY sm.created_at DESC;
COMMENT ON VIEW public.v_stock_movement_history IS 'Detailed stock movement history with product, location, and user context';

-- Low Stock Alert View
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
  SELECT
    pp.product_id,
    vw.warehouse_type,
    COUNT(*) AS quantity
  FROM public.physical_products pp
  JOIN public.virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
  GROUP BY pp.product_id, vw.warehouse_type
) stock ON stock.product_id = p.id AND stock.warehouse_type = pst.warehouse_type
WHERE pst.alert_enabled = true
  AND COALESCE(stock.quantity, 0) < pst.minimum_quantity
ORDER BY quantity_below_minimum DESC, b.name, p.name;
COMMENT ON VIEW public.v_low_stock_alerts IS 'Products below minimum stock threshold requiring restocking';

-- Warehouse Stock Levels View
CREATE OR REPLACE VIEW public.v_warehouse_stock_levels AS
SELECT
  vw.id AS virtual_warehouse_id,
  vw.name AS virtual_warehouse_name,
  vw.warehouse_type,
  pw.id AS physical_warehouse_id,
  pw.name AS physical_warehouse_name,
  pw.code AS physical_warehouse_code,
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  pp.condition,
  COUNT(pp.id) AS quantity,
  COUNT(pp.id) FILTER (WHERE
    (pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date > CURRENT_DATE + INTERVAL '30 days') OR
    (pp.user_warranty_end_date IS NULL AND pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date > CURRENT_DATE + INTERVAL '30 days')
  ) AS active_warranty_count,
  COUNT(pp.id) FILTER (WHERE
    (pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date > CURRENT_DATE AND pp.user_warranty_end_date <= CURRENT_DATE + INTERVAL '30 days') OR
    (pp.user_warranty_end_date IS NULL AND pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date > CURRENT_DATE AND pp.manufacturer_warranty_end_date <= CURRENT_DATE + INTERVAL '30 days')
  ) AS expiring_soon_count,
  COUNT(pp.id) FILTER (WHERE
    (pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date <= CURRENT_DATE) OR
    (pp.user_warranty_end_date IS NULL AND pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date <= CURRENT_DATE)
  ) AS expired_count,
  SUM(pp.purchase_price) AS total_purchase_value,
  AVG(pp.purchase_price) AS avg_purchase_price,
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,
  pst.alert_enabled,
  CASE WHEN pst.minimum_quantity IS NOT NULL AND COUNT(pp.id) < pst.minimum_quantity THEN true ELSE false END AS is_below_minimum,
  MIN(pp.created_at) AS oldest_stock_date,
  MAX(pp.created_at) AS newest_stock_date
FROM public.virtual_warehouses vw
JOIN public.physical_warehouses pw ON vw.physical_warehouse_id = pw.id
LEFT JOIN public.physical_products pp ON pp.virtual_warehouse_id = vw.id
LEFT JOIN public.products p ON pp.product_id = p.id
LEFT JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.product_stock_thresholds pst ON pst.product_id = p.id AND pst.warehouse_type = vw.warehouse_type
GROUP BY vw.id, vw.name, vw.warehouse_type, pw.id, pw.name, pw.code, p.id, p.name, p.sku, b.name, pp.condition, pst.minimum_quantity, pst.reorder_quantity, pst.maximum_quantity, pst.alert_enabled
ORDER BY pw.name, vw.warehouse_type, b.name, p.name;
COMMENT ON VIEW public.v_warehouse_stock_levels IS 'Current stock levels across all warehouses';

-- Warranty Expiring Soon View
CREATE OR REPLACE VIEW public.v_warranty_expiring_soon AS
SELECT
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  vw.id AS virtual_warehouse_id,
  vw.name AS virtual_warehouse_name,
  vw.warehouse_type,
  pw.name AS physical_warehouse_name,
  pw.code AS physical_warehouse_code,
  pp.manufacturer_warranty_end_date,
  pp.user_warranty_end_date,
  GREATEST(pp.manufacturer_warranty_end_date, pp.user_warranty_end_date) AS effective_warranty_end_date,
  CASE
    WHEN GREATEST(pp.manufacturer_warranty_end_date, pp.user_warranty_end_date) < CURRENT_DATE THEN 'expired'
    WHEN GREATEST(pp.manufacturer_warranty_end_date, pp.user_warranty_end_date) <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'active'
  END AS warranty_status,
  pp.last_known_customer_id,
  c.name AS customer_name,
  st.id AS current_ticket_id,
  st.ticket_number AS current_ticket_number,
  st.status AS current_ticket_status,
  pp.created_at,
  pp.updated_at
FROM public.physical_products pp
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
JOIN public.virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
JOIN public.physical_warehouses pw ON vw.physical_warehouse_id = pw.id
LEFT JOIN public.customers c ON pp.last_known_customer_id = c.id
LEFT JOIN public.service_tickets st ON pp.current_ticket_id = st.id
WHERE (pp.manufacturer_warranty_end_date IS NOT NULL OR pp.user_warranty_end_date IS NOT NULL)
  AND GREATEST(pp.manufacturer_warranty_end_date, pp.user_warranty_end_date) <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY effective_warranty_end_date ASC, b.name, p.name;
COMMENT ON VIEW public.v_warranty_expiring_soon IS 'Products with warranties expiring within 90 days';
