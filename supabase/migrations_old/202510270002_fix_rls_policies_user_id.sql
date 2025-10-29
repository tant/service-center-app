-- Fix RLS policies: Change profiles.id to profiles.user_id
-- Root cause: profiles.id is a random UUID (primary key), 
-- but auth.uid() returns the auth.users.id which maps to profiles.user_id

-- Drop and recreate all affected policies with correct user_id reference

-- Task Templates Policies
DROP POLICY IF EXISTS task_templates_admin_all ON public.task_templates;
DROP POLICY IF EXISTS task_templates_staff_read ON public.task_templates;

CREATE POLICY task_templates_admin_all ON public.task_templates 
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

CREATE POLICY task_templates_staff_read ON public.task_templates 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('technician', 'reception')
));

-- Task Types Policies
DROP POLICY IF EXISTS task_types_admin_all ON public.task_types;
DROP POLICY IF EXISTS task_types_staff_read ON public.task_types;

CREATE POLICY task_types_admin_all ON public.task_types 
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

CREATE POLICY task_types_staff_read ON public.task_types 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('technician', 'reception')
));

-- Task Templates Tasks Policies
DROP POLICY IF EXISTS task_templates_tasks_admin_all ON public.task_templates_tasks;
DROP POLICY IF EXISTS task_templates_tasks_staff_read ON public.task_templates_tasks;

CREATE POLICY task_templates_tasks_admin_all ON public.task_templates_tasks 
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

CREATE POLICY task_templates_tasks_staff_read ON public.task_templates_tasks 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('technician', 'reception')
));

-- Service Ticket Tasks Policies
DROP POLICY IF EXISTS service_ticket_tasks_admin_all ON public.service_ticket_tasks;
DROP POLICY IF EXISTS service_ticket_tasks_technician_read ON public.service_ticket_tasks;
DROP POLICY IF EXISTS service_ticket_tasks_technician_update ON public.service_ticket_tasks;
DROP POLICY IF EXISTS service_ticket_tasks_reception_read ON public.service_ticket_tasks;

CREATE POLICY service_ticket_tasks_admin_all ON public.service_ticket_tasks 
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

CREATE POLICY service_ticket_tasks_technician_read ON public.service_ticket_tasks 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'technician'
));

CREATE POLICY service_ticket_tasks_technician_update ON public.service_ticket_tasks 
FOR UPDATE TO authenticated 
USING (
  assigned_to_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'technician'
  )
) 
WITH CHECK (
  assigned_to_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'technician'
  )
);

CREATE POLICY service_ticket_tasks_reception_read ON public.service_ticket_tasks 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'reception'
));

-- Task History Policies
DROP POLICY IF EXISTS task_history_system_insert ON public.task_history;

CREATE POLICY task_history_system_insert ON public.task_history 
FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager', 'technician')
));

-- Ticket Template Changes Policies
DROP POLICY IF EXISTS ticket_template_changes_admin_insert ON public.ticket_template_changes;

CREATE POLICY ticket_template_changes_admin_insert ON public.ticket_template_changes 
FOR INSERT TO authenticated 
WITH CHECK (
  changed_by_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- RMA Batches Policies (THE MAIN ISSUE!)
DROP POLICY IF EXISTS rma_batches_admin_all ON public.rma_batches;
DROP POLICY IF EXISTS rma_batches_staff_read ON public.rma_batches;

CREATE POLICY rma_batches_admin_all ON public.rma_batches 
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

CREATE POLICY rma_batches_staff_read ON public.rma_batches 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('technician', 'reception')
));

-- Physical Warehouses Policies
DROP POLICY IF EXISTS physical_warehouses_admin_all ON public.physical_warehouses;

CREATE POLICY physical_warehouses_admin_all ON public.physical_warehouses 
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

-- Virtual Warehouses Policies
DROP POLICY IF EXISTS virtual_warehouses_admin_all ON public.virtual_warehouses;

CREATE POLICY virtual_warehouses_admin_all ON public.virtual_warehouses 
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

-- Physical Products Policies
DROP POLICY IF EXISTS physical_products_admin_all ON public.physical_products;
DROP POLICY IF EXISTS physical_products_technician_read ON public.physical_products;
DROP POLICY IF EXISTS physical_products_technician_update ON public.physical_products;
DROP POLICY IF EXISTS physical_products_reception_read ON public.physical_products;

CREATE POLICY physical_products_admin_all ON public.physical_products 
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

CREATE POLICY physical_products_technician_read ON public.physical_products 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'technician'
));

CREATE POLICY physical_products_technician_update ON public.physical_products 
FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.service_ticket_tasks 
    WHERE service_ticket_tasks.assigned_to_id = auth.uid() 
    AND service_ticket_tasks.ticket_id = physical_products.current_ticket_id
  ) 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'technician'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_ticket_tasks 
    WHERE service_ticket_tasks.assigned_to_id = auth.uid() 
    AND service_ticket_tasks.ticket_id = physical_products.current_ticket_id
  ) 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'technician'
  )
);

CREATE POLICY physical_products_reception_read ON public.physical_products 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'reception'
));

-- Stock Movements Policies
DROP POLICY IF EXISTS stock_movements_staff_insert ON public.stock_movements;

CREATE POLICY stock_movements_staff_insert ON public.stock_movements 
FOR INSERT TO authenticated 
WITH CHECK (
  moved_by_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'manager', 'technician')
  )
);

-- Product Stock Thresholds Policies
DROP POLICY IF EXISTS product_stock_thresholds_admin_all ON public.product_stock_thresholds;

CREATE POLICY product_stock_thresholds_admin_all ON public.product_stock_thresholds 
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

-- Service Requests Policies
DROP POLICY IF EXISTS service_requests_staff_update ON public.service_requests;

CREATE POLICY service_requests_staff_update ON public.service_requests 
FOR UPDATE TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager', 'reception')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager', 'reception')
));

-- Email Notifications Policies
DROP POLICY IF EXISTS email_notifications_admin_read ON public.email_notifications;
DROP POLICY IF EXISTS email_notifications_system_insert ON public.email_notifications;
DROP POLICY IF EXISTS email_notifications_system_update ON public.email_notifications;

CREATE POLICY email_notifications_admin_read ON public.email_notifications 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

CREATE POLICY email_notifications_system_insert ON public.email_notifications 
FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

CREATE POLICY email_notifications_system_update ON public.email_notifications 
FOR UPDATE TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

-- Storage Policies (in storage.objects)
DROP POLICY IF EXISTS warehouse_photos_admin_read_all ON storage.objects;
DROP POLICY IF EXISTS serial_photos_admin_read_all ON storage.objects;
DROP POLICY IF EXISTS csv_imports_admin_upload ON storage.objects;
DROP POLICY IF EXISTS csv_imports_admin_read ON storage.objects;
DROP POLICY IF EXISTS csv_imports_admin_delete ON storage.objects;

CREATE POLICY warehouse_photos_admin_read_all ON storage.objects 
FOR SELECT TO authenticated 
USING (
  bucket_id = 'warehouse-photos' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY serial_photos_admin_read_all ON storage.objects 
FOR SELECT TO authenticated 
USING (
  bucket_id = 'serial-photos' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY csv_imports_admin_upload ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'csv-imports' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY csv_imports_admin_read ON storage.objects 
FOR SELECT TO authenticated 
USING (
  bucket_id = 'csv-imports' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY csv_imports_admin_delete ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'csv-imports' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Add comment explaining the fix
COMMENT ON POLICY rma_batches_admin_all ON public.rma_batches IS 
'Fixed: Changed profiles.id to profiles.user_id to correctly match auth.uid(). 
profiles.id is a random UUID primary key, while profiles.user_id references auth.users(id).
This fix applies to ALL RLS policies that check user role.';
