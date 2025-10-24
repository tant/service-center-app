-- Phase 2 RLS Policies
-- Service Center - Row Level Security for Phase 2 Tables
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- ENABLE RLS ON ALL PHASE 2 TABLES
-- =====================================================

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

-- =====================================================
-- TASK TEMPLATES POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY task_templates_admin_all
  ON public.task_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician/Reception: Read only
CREATE POLICY task_templates_staff_read
  ON public.task_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('technician', 'reception')
    )
  );

-- =====================================================
-- TASK TYPES POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY task_types_admin_all
  ON public.task_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician/Reception: Read only
CREATE POLICY task_types_staff_read
  ON public.task_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('technician', 'reception')
    )
  );

-- =====================================================
-- TASK TEMPLATES TASKS POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY task_templates_tasks_admin_all
  ON public.task_templates_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician/Reception: Read only
CREATE POLICY task_templates_tasks_staff_read
  ON public.task_templates_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('technician', 'reception')
    )
  );

-- =====================================================
-- SERVICE TICKET TASKS POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY service_ticket_tasks_admin_all
  ON public.service_ticket_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician: Read all, update assigned tasks
CREATE POLICY service_ticket_tasks_technician_read
  ON public.service_ticket_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  );

CREATE POLICY service_ticket_tasks_technician_update
  ON public.service_ticket_tasks
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  )
  WITH CHECK (
    assigned_to_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  );

-- Reception: Read only
CREATE POLICY service_ticket_tasks_reception_read
  ON public.service_ticket_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'reception'
    )
  );

-- =====================================================
-- TASK HISTORY POLICIES (Audit Trail - Read Only)
-- =====================================================

-- All authenticated users: Read only
CREATE POLICY task_history_authenticated_read
  ON public.task_history
  FOR SELECT
  TO authenticated
  USING (true);

-- System only: Insert (via triggers/procedures)
CREATE POLICY task_history_system_insert
  ON public.task_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'technician')
    )
  );

-- =====================================================
-- TICKET TEMPLATE CHANGES POLICIES (Audit Trail)
-- =====================================================

-- All authenticated users: Read only
CREATE POLICY ticket_template_changes_authenticated_read
  ON public.ticket_template_changes
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin/Manager: Insert only
CREATE POLICY ticket_template_changes_admin_insert
  ON public.ticket_template_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- RMA BATCHES POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY rma_batches_admin_all
  ON public.rma_batches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician/Reception: Read only
CREATE POLICY rma_batches_staff_read
  ON public.rma_batches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('technician', 'reception')
    )
  );

-- =====================================================
-- PHYSICAL WAREHOUSES POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY physical_warehouses_admin_all
  ON public.physical_warehouses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- All authenticated: Read only
CREATE POLICY physical_warehouses_authenticated_read
  ON public.physical_warehouses
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- VIRTUAL WAREHOUSES POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY virtual_warehouses_admin_all
  ON public.virtual_warehouses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- All authenticated: Read only
CREATE POLICY virtual_warehouses_authenticated_read
  ON public.virtual_warehouses
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- PHYSICAL PRODUCTS POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY physical_products_admin_all
  ON public.physical_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Technician: Read all, update assigned products
CREATE POLICY physical_products_technician_read
  ON public.physical_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  );

CREATE POLICY physical_products_technician_update
  ON public.physical_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_ticket_tasks
      WHERE service_ticket_tasks.assigned_to_id = auth.uid()
      AND service_ticket_tasks.ticket_id = physical_products.current_ticket_id
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_ticket_tasks
      WHERE service_ticket_tasks.assigned_to_id = auth.uid()
      AND service_ticket_tasks.ticket_id = physical_products.current_ticket_id
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'technician'
    )
  );

-- Reception: Read only
CREATE POLICY physical_products_reception_read
  ON public.physical_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'reception'
    )
  );

-- =====================================================
-- STOCK MOVEMENTS POLICIES (Audit Trail)
-- =====================================================

-- All authenticated users: Read all
CREATE POLICY stock_movements_authenticated_read
  ON public.stock_movements
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin/Manager/Technician: Create movements
CREATE POLICY stock_movements_staff_insert
  ON public.stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    moved_by_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'technician')
    )
  );

-- =====================================================
-- PRODUCT STOCK THRESHOLDS POLICIES
-- =====================================================

-- Admin/Manager: Full access
CREATE POLICY product_stock_thresholds_admin_all
  ON public.product_stock_thresholds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- All authenticated: Read only
CREATE POLICY product_stock_thresholds_authenticated_read
  ON public.product_stock_thresholds
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- SERVICE REQUESTS POLICIES (PUBLIC PORTAL)
-- =====================================================

-- Public: Insert only (anonymous submissions)
CREATE POLICY service_requests_public_insert
  ON public.service_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public: Read own request by tracking token (no auth required)
-- Note: This is handled via tRPC procedure with tracking token validation

-- Authenticated staff: Read all
CREATE POLICY service_requests_authenticated_read
  ON public.service_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin/Manager/Reception: Update requests
CREATE POLICY service_requests_staff_update
  ON public.service_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'reception')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'reception')
    )
  );

-- =====================================================
-- EMAIL NOTIFICATIONS POLICIES (System Only)
-- =====================================================

-- System/Admin only: Read all
CREATE POLICY email_notifications_admin_read
  ON public.email_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- System only: Insert (via procedures/triggers)
CREATE POLICY email_notifications_system_insert
  ON public.email_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- System only: Update (delivery tracking)
CREATE POLICY email_notifications_system_update
  ON public.email_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY task_templates_admin_all ON public.task_templates IS 'Admin/Manager: Full access to task templates';
COMMENT ON POLICY task_templates_staff_read ON public.task_templates IS 'Technician/Reception: Read-only access to task templates';
COMMENT ON POLICY service_requests_public_insert ON public.service_requests IS 'PUBLIC: Anonymous users can submit service requests';
COMMENT ON POLICY service_requests_authenticated_read ON public.service_requests IS 'Authenticated staff: Read all service requests';
