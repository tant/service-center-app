-- =====================================================
-- 06_policies_and_views.sql
-- =====================================================
-- RLS policies and database views for Phase 2 tables.
-- =====================================================

-- =====================================================
-- RLS POLICIES (from 17_phase2_rls_policies.sql)
-- =====================================================

-- Enable RLS on all Phase 2 tables
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_template_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rma_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Task Templates Policies
CREATE POLICY task_templates_admin_all ON public.task_templates FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY task_templates_staff_read ON public.task_templates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('technician', 'reception')));

-- Task Types Policies
CREATE POLICY task_types_admin_all ON public.task_types FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY task_types_staff_read ON public.task_types FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('technician', 'reception')));

-- Task Templates Tasks Policies
CREATE POLICY task_templates_tasks_admin_all ON public.task_templates_tasks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY task_templates_tasks_staff_read ON public.task_templates_tasks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('technician', 'reception')));

-- Service Ticket Tasks Policies
CREATE POLICY service_ticket_tasks_admin_all ON public.service_ticket_tasks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY service_ticket_tasks_technician_read ON public.service_ticket_tasks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'technician'));
CREATE POLICY service_ticket_tasks_technician_update ON public.service_ticket_tasks FOR UPDATE TO authenticated USING (assigned_to_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'technician')) WITH CHECK (assigned_to_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'technician'));
CREATE POLICY service_ticket_tasks_reception_read ON public.service_ticket_tasks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'reception'));

-- Task History Policies
CREATE POLICY task_history_authenticated_read ON public.task_history FOR SELECT TO authenticated USING (true);
CREATE POLICY task_history_system_insert ON public.task_history FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'technician')));

-- Ticket Template Changes Policies
CREATE POLICY ticket_template_changes_authenticated_read ON public.ticket_template_changes FOR SELECT TO authenticated USING (true);
CREATE POLICY ticket_template_changes_admin_insert ON public.ticket_template_changes FOR INSERT TO authenticated WITH CHECK (changed_by_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));

-- RMA Batches Policies
CREATE POLICY rma_batches_admin_all ON public.rma_batches FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY rma_batches_staff_read ON public.rma_batches FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('technician', 'reception')));

-- Physical Warehouses Policies
CREATE POLICY physical_warehouses_admin_all ON public.physical_warehouses FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY physical_warehouses_authenticated_read ON public.physical_warehouses FOR SELECT TO authenticated USING (true);

-- Virtual Warehouses Policies
CREATE POLICY virtual_warehouses_admin_all ON public.virtual_warehouses FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY virtual_warehouses_authenticated_read ON public.virtual_warehouses FOR SELECT TO authenticated USING (true);

-- Physical Products Policies
CREATE POLICY physical_products_admin_all ON public.physical_products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY physical_products_technician_read ON public.physical_products FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'technician'));
CREATE POLICY physical_products_technician_update ON public.physical_products FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.service_ticket_tasks WHERE service_ticket_tasks.assigned_to_id = auth.uid() AND service_ticket_tasks.ticket_id = physical_products.current_ticket_id) AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'technician')) WITH CHECK (EXISTS (SELECT 1 FROM public.service_ticket_tasks WHERE service_ticket_tasks.assigned_to_id = auth.uid() AND service_ticket_tasks.ticket_id = physical_products.current_ticket_id) AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'technician'));
CREATE POLICY physical_products_reception_read ON public.physical_products FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'reception'));

-- Stock Movements Policies
CREATE POLICY stock_movements_authenticated_read ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY stock_movements_staff_insert ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (moved_by_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'technician')));

-- Product Stock Thresholds Policies
CREATE POLICY product_stock_thresholds_admin_all ON public.product_stock_thresholds FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY product_stock_thresholds_authenticated_read ON public.product_stock_thresholds FOR SELECT TO authenticated USING (true);

-- Service Requests Policies
CREATE POLICY service_requests_public_insert ON public.service_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY service_requests_authenticated_read ON public.service_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY service_requests_staff_update ON public.service_requests FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'reception'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'reception')));

-- Email Notifications Policies
CREATE POLICY email_notifications_admin_read ON public.email_notifications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY email_notifications_system_insert ON public.email_notifications FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
CREATE POLICY email_notifications_system_update ON public.email_notifications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));

-- =====================================================
-- DATABASE VIEWS (from 18_phase2_views.sql)
-- =====================================================

-- Warehouse Stock Levels View
CREATE OR REPLACE VIEW public.v_warehouse_stock_levels AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  pp.virtual_warehouse_type AS warehouse_type,
  pp.condition,
  COUNT(*) AS quantity,
  COUNT(*) FILTER (WHERE
    (pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date > CURRENT_DATE + INTERVAL '30 days') OR
    (pp.user_warranty_end_date IS NULL AND pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date > CURRENT_DATE + INTERVAL '30 days')
  ) AS active_warranty_count,
  COUNT(*) FILTER (WHERE
    (pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date > CURRENT_DATE AND pp.user_warranty_end_date <= CURRENT_DATE + INTERVAL '30 days') OR
    (pp.user_warranty_end_date IS NULL AND pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date > CURRENT_DATE AND pp.manufacturer_warranty_end_date <= CURRENT_DATE + INTERVAL '30 days')
  ) AS expiring_soon_count,
  COUNT(*) FILTER (WHERE
    (pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date <= CURRENT_DATE) OR
    (pp.user_warranty_end_date IS NULL AND pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date <= CURRENT_DATE)
  ) AS expired_count,
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
LEFT JOIN public.product_stock_thresholds pst ON pst.product_id = p.id AND pst.warehouse_type = pp.virtual_warehouse_type
GROUP BY p.id, p.name, p.sku, b.name, pp.virtual_warehouse_type, pp.condition, pst.minimum_quantity, pst.reorder_quantity, pst.maximum_quantity, pst.alert_enabled
ORDER BY b.name, p.name, pp.virtual_warehouse_type;
COMMENT ON VIEW public.v_warehouse_stock_levels IS 'Real-time stock levels by product, warehouse type, and condition with threshold alerts (prioritizes user warranty over manufacturer warranty)';

-- Task Progress Summary View
CREATE OR REPLACE VIEW public.v_task_progress_summary AS
SELECT st.id AS ticket_id, st.ticket_number, st.status AS ticket_status, tt.id AS template_id, tt.name AS template_name, tt.strict_sequence, COUNT(*) AS total_tasks, COUNT(*) FILTER (WHERE stt.status = 'pending') AS pending_tasks, COUNT(*) FILTER (WHERE stt.status = 'in_progress') AS in_progress_tasks, COUNT(*) FILTER (WHERE stt.status = 'completed') AS completed_tasks, COUNT(*) FILTER (WHERE stt.status = 'blocked') AS blocked_tasks, COUNT(*) FILTER (WHERE stt.status = 'skipped') AS skipped_tasks, COUNT(*) FILTER (WHERE stt.is_required = true) AS required_tasks, COUNT(*) FILTER (WHERE stt.is_required = true AND stt.status = 'completed') AS required_completed, ROUND((COUNT(*) FILTER (WHERE stt.status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) AS completion_percentage, ROUND((COUNT(*) FILTER (WHERE stt.is_required = true AND stt.status = 'completed')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE stt.is_required = true), 0)) * 100, 2) AS required_completion_percentage, MIN(stt.started_at) AS first_task_started_at, MAX(stt.completed_at) AS last_task_completed_at, SUM(CASE WHEN stt.completed_at IS NOT NULL AND stt.started_at IS NOT NULL THEN EXTRACT(EPOCH FROM (stt.completed_at - stt.started_at)) / 60 ELSE 0 END) AS total_minutes_spent, (SELECT jsonb_build_object('id', stt2.id, 'name', stt2.name, 'sequence_order', stt2.sequence_order, 'assigned_to_id', stt2.assigned_to_id) FROM public.service_ticket_tasks stt2 WHERE stt2.ticket_id = st.id AND stt2.status = 'pending' ORDER BY stt2.sequence_order LIMIT 1) AS next_pending_task, (SELECT jsonb_agg(jsonb_build_object('id', stt3.id, 'name', stt3.name, 'sequence_order', stt3.sequence_order, 'blocked_reason', stt3.blocked_reason) ORDER BY stt3.sequence_order) FROM public.service_ticket_tasks stt3 WHERE stt3.ticket_id = st.id AND stt3.status = 'blocked') AS blocked_tasks_detail, st.created_at AS ticket_created_at, st.updated_at AS ticket_updated_at
FROM public.service_tickets st LEFT JOIN public.task_templates tt ON st.template_id = tt.id LEFT JOIN public.service_ticket_tasks stt ON stt.ticket_id = st.id
GROUP BY st.id, st.ticket_number, st.status, tt.id, tt.name, tt.strict_sequence, st.created_at, st.updated_at
ORDER BY st.created_at DESC;
COMMENT ON VIEW public.v_task_progress_summary IS 'Task completion progress summary per service ticket with next/blocked task details';

-- Warranty Expiring Soon View
CREATE OR REPLACE VIEW public.v_warranty_expiring_soon AS
SELECT
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  pp.virtual_warehouse_type,
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  pp.manufacturer_warranty_end_date,
  pp.user_warranty_end_date,
  CASE
    WHEN pp.user_warranty_end_date IS NOT NULL THEN 'user'
    WHEN pp.manufacturer_warranty_end_date IS NOT NULL THEN 'manufacturer'
    ELSE 'none'
  END AS warranty_type,
  CASE
    WHEN pp.user_warranty_end_date IS NOT NULL THEN pp.user_warranty_end_date - CURRENT_DATE
    WHEN pp.manufacturer_warranty_end_date IS NOT NULL THEN pp.manufacturer_warranty_end_date - CURRENT_DATE
    ELSE NULL
  END AS days_remaining,
  CASE
    WHEN pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date <= CURRENT_DATE THEN 'expired'
    WHEN pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date <= CURRENT_DATE THEN 'expired'
    WHEN pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date <= (CURRENT_DATE + '30 days'::interval) THEN 'expiring_soon'
    WHEN pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date <= (CURRENT_DATE + '30 days'::interval) THEN 'expiring_soon'
    ELSE 'active'
  END AS warranty_status,
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
LEFT JOIN public.physical_warehouses pw ON pp.physical_warehouse_id = pw.id
LEFT JOIN public.service_tickets st ON pp.current_ticket_id = st.id
WHERE (pp.user_warranty_end_date IS NOT NULL AND pp.user_warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
   OR (pp.user_warranty_end_date IS NULL AND pp.manufacturer_warranty_end_date IS NOT NULL AND pp.manufacturer_warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
ORDER BY
  CASE
    WHEN pp.user_warranty_end_date IS NOT NULL THEN pp.user_warranty_end_date
    ELSE pp.manufacturer_warranty_end_date
  END;
COMMENT ON VIEW public.v_warranty_expiring_soon IS 'Physical products with warranty expiring within 30 days (prioritizes user warranty over manufacturer warranty)';

-- Service Request Summary View
-- TODO: This view needs redesign for 1:N relationship (service_requests -> service_request_items)
-- Commented out until redesigned
-- CREATE OR REPLACE VIEW public.v_service_request_summary AS
-- SELECT sr.id, sr.tracking_token, sr.status, sr.customer_name, sr.customer_email, sr.customer_phone,
--   sr.issue_description, sr.service_type, sr.delivery_method, sr.delivery_address,
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
-- COMMENT ON VIEW public.v_service_request_summary IS 'Service requests with customer info, conversion status, and time metrics';

-- Stock Movement History View
CREATE OR REPLACE VIEW public.v_stock_movement_history AS
SELECT sm.id AS movement_id, sm.movement_type, sm.created_at AS moved_at, pp.id AS physical_product_id, pp.serial_number, pp.condition, p.name AS product_name, p.sku AS product_sku, b.name AS brand_name, sm.from_virtual_warehouse, fw.name AS from_physical_warehouse_name, fw.code AS from_physical_warehouse_code, sm.to_virtual_warehouse, tw.name AS to_physical_warehouse_name, tw.code AS to_physical_warehouse_code, sm.ticket_id, st.ticket_number, st.status AS ticket_status, sm.reason, sm.notes, sm.moved_by_id, prof.full_name AS moved_by_name, prof.role AS moved_by_role
FROM public.stock_movements sm JOIN public.physical_products pp ON sm.physical_product_id = pp.id JOIN public.products p ON pp.product_id = p.id JOIN public.brands b ON p.brand_id = b.id LEFT JOIN public.physical_warehouses fw ON sm.from_physical_warehouse_id = fw.id LEFT JOIN public.physical_warehouses tw ON sm.to_physical_warehouse_id = tw.id LEFT JOIN public.service_tickets st ON sm.ticket_id = st.id LEFT JOIN public.profiles prof ON sm.moved_by_id = prof.id
ORDER BY sm.created_at DESC;
COMMENT ON VIEW public.v_stock_movement_history IS 'Detailed stock movement history with product, location, and user context';

-- Low Stock Alert View
CREATE OR REPLACE VIEW public.v_low_stock_alerts AS
SELECT p.id AS product_id, p.name AS product_name, p.sku AS product_sku, b.name AS brand_name, pst.warehouse_type, pst.minimum_quantity, pst.reorder_quantity, pst.maximum_quantity, COALESCE(stock.quantity, 0) AS current_quantity, pst.minimum_quantity - COALESCE(stock.quantity, 0) AS quantity_below_minimum, pst.alert_enabled, pst.last_alert_sent_at, pst.created_at AS threshold_created_at, pst.updated_at AS threshold_updated_at
FROM public.product_stock_thresholds pst JOIN public.products p ON pst.product_id = p.id JOIN public.brands b ON p.brand_id = b.id LEFT JOIN (SELECT product_id, virtual_warehouse_type, COUNT(*) AS quantity FROM public.physical_products GROUP BY product_id, virtual_warehouse_type) stock ON stock.product_id = p.id AND stock.virtual_warehouse_type = pst.warehouse_type
WHERE pst.alert_enabled = true AND COALESCE(stock.quantity, 0) < pst.minimum_quantity
ORDER BY (pst.minimum_quantity - COALESCE(stock.quantity, 0)) DESC, b.name, p.name;
COMMENT ON VIEW public.v_low_stock_alerts IS 'Products below minimum stock thresholds requiring reorder';
