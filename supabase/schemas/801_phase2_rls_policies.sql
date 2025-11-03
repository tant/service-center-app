-- =====================================================
-- 801_phase2_rls_policies.sql
-- =====================================================
-- Row Level Security Policies - Phase 2 Tables
--
-- RLS policies for:
-- - Task templates and types
-- - Service ticket tasks
-- - Task history
-- - Warehouses (physical/virtual)
-- - Physical products
-- - Stock movements
-- - Service requests
-- - Email notifications
-- - Inventory documents
--
-- ORDER: 800-899 (RLS Policies)
-- DEPENDENCIES: 202, 203, 204, 205
-- =====================================================
-- Enable RLS on all Phase 2 tables
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_workflow_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rma_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Workflows Policies
CREATE POLICY workflows_select_policy ON public.workflows FOR SELECT TO authenticated USING (true);
CREATE POLICY workflows_insert_policy ON public.workflows FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY workflows_update_policy ON public.workflows FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager'])) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY workflows_delete_policy ON public.workflows FOR DELETE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']));

-- Tasks Policies
CREATE POLICY tasks_select_policy ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY tasks_insert_policy ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY tasks_update_policy ON public.tasks FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager'])) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY tasks_delete_policy ON public.tasks FOR DELETE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']));

-- Workflow Tasks Policies
CREATE POLICY workflow_tasks_select_policy ON public.workflow_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY workflow_tasks_insert_policy ON public.workflow_tasks FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY workflow_tasks_update_policy ON public.workflow_tasks FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager'])) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY workflow_tasks_delete_policy ON public.workflow_tasks FOR DELETE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']));

-- Service Ticket Tasks Policies
CREATE POLICY service_ticket_tasks_select_policy ON public.service_ticket_tasks FOR SELECT TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']) OR public.is_technician() OR public.is_reception());
CREATE POLICY service_ticket_tasks_insert_policy ON public.service_ticket_tasks FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY service_ticket_tasks_update_policy ON public.service_ticket_tasks FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']) OR (assigned_to_id = (SELECT auth.uid()) AND public.is_technician())) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']) OR (assigned_to_id = (SELECT auth.uid()) AND public.is_technician()));
CREATE POLICY service_ticket_tasks_delete_policy ON public.service_ticket_tasks FOR DELETE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']));

-- Task History Policies
CREATE POLICY task_history_authenticated_read ON public.task_history FOR SELECT TO authenticated USING (true);
CREATE POLICY task_history_system_insert ON public.task_history FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager', 'technician']));

-- Ticket Workflow Changes Policies
CREATE POLICY ticket_workflow_changes_authenticated_read ON public.ticket_workflow_changes FOR SELECT TO authenticated USING (true);
CREATE POLICY ticket_workflow_changes_admin_insert ON public.ticket_workflow_changes FOR INSERT TO authenticated WITH CHECK (changed_by_id = (SELECT auth.uid()) AND public.has_any_role(ARRAY['admin', 'manager']));

-- RMA Batches Policies
CREATE POLICY rma_batches_select_policy ON public.rma_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY rma_batches_insert_policy ON public.rma_batches FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY rma_batches_update_policy ON public.rma_batches FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager'])) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY rma_batches_delete_policy ON public.rma_batches FOR DELETE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']));

-- Physical Warehouses Policies
CREATE POLICY physical_warehouses_select_policy ON public.physical_warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY physical_warehouses_insert_policy ON public.physical_warehouses FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY physical_warehouses_update_policy ON public.physical_warehouses FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager'])) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY physical_warehouses_delete_policy ON public.physical_warehouses FOR DELETE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']));

-- Virtual Warehouses Policies
CREATE POLICY virtual_warehouses_select_policy ON public.virtual_warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY virtual_warehouses_insert_policy ON public.virtual_warehouses FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY virtual_warehouses_update_policy ON public.virtual_warehouses FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager'])) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY virtual_warehouses_delete_policy ON public.virtual_warehouses FOR DELETE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']));

-- Physical Products Policies
CREATE POLICY physical_products_select_policy ON public.physical_products FOR SELECT TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']) OR public.is_technician() OR public.is_reception());
CREATE POLICY physical_products_insert_policy ON public.physical_products FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY physical_products_update_policy ON public.physical_products FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']) OR (EXISTS (SELECT 1 FROM public.service_ticket_tasks WHERE service_ticket_tasks.assigned_to_id = (SELECT auth.uid()) AND service_ticket_tasks.ticket_id = physical_products.current_ticket_id) AND public.is_technician())) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']) OR (EXISTS (SELECT 1 FROM public.service_ticket_tasks WHERE service_ticket_tasks.assigned_to_id = (SELECT auth.uid()) AND service_ticket_tasks.ticket_id = physical_products.current_ticket_id) AND public.is_technician()));
CREATE POLICY physical_products_delete_policy ON public.physical_products FOR DELETE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']));

-- Stock Movements Policies
CREATE POLICY stock_movements_authenticated_read ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY stock_movements_staff_insert ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (moved_by_id = (SELECT auth.uid()) AND public.has_any_role(ARRAY['admin', 'manager', 'technician']));

-- Product Stock Thresholds Policies
CREATE POLICY product_stock_thresholds_select_policy ON public.product_stock_thresholds FOR SELECT TO authenticated USING (true);
CREATE POLICY product_stock_thresholds_insert_policy ON public.product_stock_thresholds FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY product_stock_thresholds_update_policy ON public.product_stock_thresholds FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager'])) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY product_stock_thresholds_delete_policy ON public.product_stock_thresholds FOR DELETE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']));

-- Service Requests Policies
CREATE POLICY service_requests_public_insert ON public.service_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY service_requests_authenticated_read ON public.service_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY service_requests_staff_update ON public.service_requests FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager', 'reception'])) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager', 'reception']));

-- Email Notifications Policies
CREATE POLICY email_notifications_admin_read ON public.email_notifications FOR SELECT TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY email_notifications_system_insert ON public.email_notifications FOR INSERT TO authenticated WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));
CREATE POLICY email_notifications_system_update ON public.email_notifications FOR UPDATE TO authenticated USING (public.has_any_role(ARRAY['admin', 'manager'])) WITH CHECK (public.has_any_role(ARRAY['admin', 'manager']));

