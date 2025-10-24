-- Phase 2 Database Views
-- Service Center - Analytics and Reporting Views
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- WAREHOUSE STOCK LEVELS VIEW
-- =====================================================
-- Current stock levels by product and warehouse type

CREATE OR REPLACE VIEW public.v_warehouse_stock_levels AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  pp.virtual_warehouse_type AS warehouse_type,
  pp.condition,

  -- Stock counts
  COUNT(*) AS quantity,
  COUNT(*) FILTER (WHERE pp.warranty_end_date IS NOT NULL AND pp.warranty_end_date > CURRENT_DATE + INTERVAL '30 days') AS active_warranty_count,
  COUNT(*) FILTER (WHERE pp.warranty_end_date IS NOT NULL AND pp.warranty_end_date > CURRENT_DATE AND pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days') AS expiring_soon_count,
  COUNT(*) FILTER (WHERE pp.warranty_end_date IS NOT NULL AND pp.warranty_end_date <= CURRENT_DATE) AS expired_count,

  -- Value calculations
  SUM(pp.purchase_price) AS total_purchase_value,
  AVG(pp.purchase_price) AS avg_purchase_price,

  -- Threshold info
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,
  pst.alert_enabled,

  -- Alert status
  CASE
    WHEN pst.minimum_quantity IS NOT NULL AND COUNT(*) < pst.minimum_quantity THEN true
    ELSE false
  END AS is_below_minimum,

  -- Metadata
  MIN(pp.created_at) AS oldest_stock_date,
  MAX(pp.created_at) AS newest_stock_date

FROM public.physical_products pp
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.product_stock_thresholds pst
  ON pst.product_id = p.id
  AND pst.warehouse_type = pp.virtual_warehouse_type

GROUP BY
  p.id,
  p.name,
  p.sku,
  b.name,
  pp.virtual_warehouse_type,
  pp.condition,
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,
  pst.alert_enabled

ORDER BY
  b.name,
  p.name,
  pp.virtual_warehouse_type;

COMMENT ON VIEW public.v_warehouse_stock_levels IS 'Real-time stock levels by product, warehouse type, and condition with threshold alerts';

-- =====================================================
-- TASK PROGRESS SUMMARY VIEW
-- =====================================================
-- Task completion progress per service ticket

CREATE OR REPLACE VIEW public.v_task_progress_summary AS
SELECT
  st.id AS ticket_id,
  st.ticket_number,
  st.status AS ticket_status,

  -- Template info
  tt.id AS template_id,
  tt.name AS template_name,
  tt.strict_sequence,

  -- Task counts
  COUNT(*) AS total_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'pending') AS pending_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'in_progress') AS in_progress_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'completed') AS completed_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'blocked') AS blocked_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'skipped') AS skipped_tasks,
  COUNT(*) FILTER (WHERE stt.is_required = true) AS required_tasks,
  COUNT(*) FILTER (WHERE stt.is_required = true AND stt.status = 'completed') AS required_completed,

  -- Progress calculations
  ROUND(
    (COUNT(*) FILTER (WHERE stt.status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS completion_percentage,

  ROUND(
    (COUNT(*) FILTER (WHERE stt.is_required = true AND stt.status = 'completed')::NUMERIC /
     NULLIF(COUNT(*) FILTER (WHERE stt.is_required = true), 0)) * 100,
    2
  ) AS required_completion_percentage,

  -- Time tracking
  MIN(stt.started_at) AS first_task_started_at,
  MAX(stt.completed_at) AS last_task_completed_at,
  SUM(
    CASE
      WHEN stt.completed_at IS NOT NULL AND stt.started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (stt.completed_at - stt.started_at)) / 60
      ELSE 0
    END
  ) AS total_minutes_spent,

  -- Next task info
  (
    SELECT jsonb_build_object(
      'id', stt2.id,
      'name', stt2.name,
      'sequence_order', stt2.sequence_order,
      'assigned_to_id', stt2.assigned_to_id
    )
    FROM public.service_ticket_tasks stt2
    WHERE stt2.ticket_id = st.id
    AND stt2.status = 'pending'
    ORDER BY stt2.sequence_order
    LIMIT 1
  ) AS next_pending_task,

  -- Blocked tasks info
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', stt3.id,
        'name', stt3.name,
        'sequence_order', stt3.sequence_order,
        'blocked_reason', stt3.blocked_reason
      )
      ORDER BY stt3.sequence_order
    )
    FROM public.service_ticket_tasks stt3
    WHERE stt3.ticket_id = st.id
    AND stt3.status = 'blocked'
  ) AS blocked_tasks_detail,

  -- Metadata
  st.created_at AS ticket_created_at,
  st.updated_at AS ticket_updated_at

FROM public.service_tickets st
LEFT JOIN public.task_templates tt ON st.template_id = tt.id
LEFT JOIN public.service_ticket_tasks stt ON stt.ticket_id = st.id

GROUP BY
  st.id,
  st.ticket_number,
  st.status,
  tt.id,
  tt.name,
  tt.strict_sequence,
  st.created_at,
  st.updated_at

ORDER BY st.created_at DESC;

COMMENT ON VIEW public.v_task_progress_summary IS 'Task completion progress summary per service ticket with next/blocked task details';

-- =====================================================
-- WARRANTY EXPIRING SOON VIEW
-- =====================================================
-- Products with warranty expiring within configurable days

CREATE OR REPLACE VIEW public.v_warranty_expiring_soon AS
SELECT
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  pp.virtual_warehouse_type,

  -- Product info
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,

  -- Warranty info
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

  -- Physical location
  pw.name AS physical_warehouse_name,
  pw.code AS physical_warehouse_code,

  -- Service status
  st.id AS current_ticket_id,
  st.ticket_number AS current_ticket_number,
  st.status AS current_ticket_status,

  -- Metadata
  pp.created_at,
  pp.updated_at

FROM public.physical_products pp
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.physical_warehouses pw ON pp.physical_warehouse_id = pw.id
LEFT JOIN public.service_tickets st ON pp.current_ticket_id = st.id

WHERE
  pp.warranty_end_date IS NOT NULL
  AND pp.warranty_end_date > CURRENT_DATE
  AND pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days'

ORDER BY pp.warranty_end_date ASC;

COMMENT ON VIEW public.v_warranty_expiring_soon IS 'Products with warranty expiring within 30 days';

-- =====================================================
-- SERVICE REQUEST SUMMARY VIEW
-- =====================================================
-- Service requests with customer and conversion info

CREATE OR REPLACE VIEW public.v_service_request_summary AS
SELECT
  sr.id,
  sr.tracking_token,
  sr.status,

  -- Customer info
  sr.customer_name,
  sr.customer_email,
  sr.customer_phone,

  -- Product info
  sr.product_brand,
  sr.product_model,
  sr.serial_number,
  sr.purchase_date,

  -- Issue info
  sr.issue_description,
  jsonb_array_length(COALESCE(sr.issue_photos, '[]'::jsonb)) AS photo_count,

  -- Service preferences
  sr.service_type,
  sr.delivery_method,
  sr.delivery_address,

  -- Status info
  sr.reviewed_by_id,
  prof.full_name AS reviewed_by_name,
  sr.reviewed_at,
  sr.rejection_reason,

  -- Conversion info
  sr.ticket_id,
  st.ticket_number,
  st.status AS ticket_status,
  sr.converted_at,

  -- Time metrics
  sr.created_at AS submitted_at,
  sr.updated_at,
  CASE
    WHEN sr.reviewed_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (sr.reviewed_at - sr.created_at)) / 3600
    ELSE NULL
  END AS hours_to_review,
  CASE
    WHEN sr.converted_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (sr.converted_at - sr.created_at)) / 3600
    ELSE NULL
  END AS hours_to_conversion,

  -- Request metadata
  sr.submitted_ip,
  sr.user_agent

FROM public.service_requests sr
LEFT JOIN public.profiles prof ON sr.reviewed_by_id = prof.id
LEFT JOIN public.service_tickets st ON sr.ticket_id = st.id

ORDER BY sr.created_at DESC;

COMMENT ON VIEW public.v_service_request_summary IS 'Service requests with customer info, conversion status, and time metrics';

-- =====================================================
-- STOCK MOVEMENT HISTORY VIEW
-- =====================================================
-- Detailed stock movement history with context

CREATE OR REPLACE VIEW public.v_stock_movement_history AS
SELECT
  sm.id AS movement_id,
  sm.movement_type,
  sm.created_at AS moved_at,

  -- Product info
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,

  -- From location
  sm.from_virtual_warehouse,
  fw.name AS from_physical_warehouse_name,
  fw.code AS from_physical_warehouse_code,

  -- To location
  sm.to_virtual_warehouse,
  tw.name AS to_physical_warehouse_name,
  tw.code AS to_physical_warehouse_code,

  -- Ticket association
  sm.ticket_id,
  st.ticket_number,
  st.status AS ticket_status,

  -- Movement details
  sm.reason,
  sm.notes,

  -- User info
  sm.moved_by_id,
  prof.full_name AS moved_by_name,
  prof.role AS moved_by_role

FROM public.stock_movements sm
JOIN public.physical_products pp ON sm.physical_product_id = pp.id
JOIN public.products p ON pp.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.physical_warehouses fw ON sm.from_physical_warehouse_id = fw.id
LEFT JOIN public.physical_warehouses tw ON sm.to_physical_warehouse_id = tw.id
LEFT JOIN public.service_tickets st ON sm.ticket_id = st.id
LEFT JOIN public.profiles prof ON sm.moved_by_id = prof.id

ORDER BY sm.created_at DESC;

COMMENT ON VIEW public.v_stock_movement_history IS 'Detailed stock movement history with product, location, and user context';

-- =====================================================
-- LOW STOCK ALERT VIEW
-- =====================================================
-- Products below minimum stock thresholds

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

  -- Current stock
  COALESCE(stock.quantity, 0) AS current_quantity,
  pst.minimum_quantity - COALESCE(stock.quantity, 0) AS quantity_below_minimum,

  -- Alert settings
  pst.alert_enabled,
  pst.last_alert_sent_at,

  -- Metadata
  pst.created_at AS threshold_created_at,
  pst.updated_at AS threshold_updated_at

FROM public.product_stock_thresholds pst
JOIN public.products p ON pst.product_id = p.id
JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN (
  SELECT
    product_id,
    virtual_warehouse_type,
    COUNT(*) AS quantity
  FROM public.physical_products
  GROUP BY product_id, virtual_warehouse_type
) stock ON stock.product_id = p.id AND stock.virtual_warehouse_type = pst.warehouse_type

WHERE
  pst.alert_enabled = true
  AND COALESCE(stock.quantity, 0) < pst.minimum_quantity

ORDER BY
  (pst.minimum_quantity - COALESCE(stock.quantity, 0)) DESC,
  b.name,
  p.name;

COMMENT ON VIEW public.v_low_stock_alerts IS 'Products below minimum stock thresholds requiring reorder';
