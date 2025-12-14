-- =====================================================
-- 800_core_rls_policies.sql
-- =====================================================
-- Row Level Security Policies - Core Tables
--
-- Updated RLS policies for role-based access control:
-- - service_tickets (technician restrictions)
-- - customers (technician restrictions)
-- - service_ticket_parts
-- - service_ticket_comments
-- - service_ticket_attachments
--
-- ORDER: 800-899 (RLS Policies)
-- DEPENDENCIES: All table files, 150 (role functions)
-- =====================================================

-- =====================================================
-- SERVICE_TICKETS - Updated RLS Policies
-- =====================================================

-- Drop existing overly permissive policies (IF EXISTS for migration compatibility)
DROP POLICY IF EXISTS "service_tickets_select_policy" ON public.service_tickets;
DROP POLICY IF EXISTS "service_tickets_insert_policy" ON public.service_tickets;
DROP POLICY IF EXISTS "service_tickets_update_policy" ON public.service_tickets;
-- Keep delete policy (already correct: is_admin_or_manager)

-- SELECT: Admin/Manager/Reception see ALL, Technician sees ASSIGNED ONLY
CREATE POLICY "service_tickets_select_policy"
  ON public.service_tickets FOR SELECT
  TO authenticated
  USING (
    -- Admin, Manager, Reception can see all tickets
    public.has_any_role(ARRAY['admin', 'manager', 'reception'])
    OR
    -- Technician can see tickets with tasks assigned to them
    (
      public.is_technician()
      AND id IN (
        SELECT entity_id
        FROM public.entity_tasks
        WHERE entity_type = 'service_ticket' AND assigned_to_id = (SELECT auth.uid())
      )
    )
  );

COMMENT ON POLICY "service_tickets_select_policy" ON public.service_tickets IS
  'Admin/Manager/Reception see all tickets. Technicians only see tickets with tasks assigned to them.';

-- INSERT: Admin, Manager, Reception can create tickets
CREATE POLICY "service_tickets_insert_policy"
  ON public.service_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'manager', 'reception'])
  );

COMMENT ON POLICY "service_tickets_insert_policy" ON public.service_tickets IS
  'Only Admin, Manager, and Reception can create new tickets. Technicians cannot create tickets.';

-- UPDATE: Admin can update all, Manager can update non-cancelled, Reception limited to pending
CREATE POLICY "service_tickets_update_policy"
  ON public.service_tickets FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR
    -- Manager can update all except cancelled tickets
    (public.has_role('manager') AND status != 'cancelled')
    OR
    -- Reception can update only pending tickets (basic info only)
    (public.is_reception() AND status = 'pending')
  );

COMMENT ON POLICY "service_tickets_update_policy" ON public.service_tickets IS
  'Admin can update all tickets. Manager can update non-cancelled tickets. Reception can update pending tickets only. Technicians cannot update tickets directly (use tasks instead).';

-- =====================================================
-- CUSTOMERS - Updated RLS Policies
-- =====================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
-- Keep delete policy (already correct: is_admin_or_manager)

-- SELECT: Admin/Manager/Reception see ALL, Technician sees customers of ASSIGNED TICKETS
CREATE POLICY "customers_select_policy"
  ON public.customers FOR SELECT
  TO authenticated
  USING (
    -- Admin, Manager, Reception can see all customers
    public.has_any_role(ARRAY['admin', 'manager', 'reception'])
    OR
    -- Technician can see customers from their assigned tickets
    (
      public.is_technician()
      AND id IN (
        SELECT st.customer_id
        FROM public.service_tickets st
        INNER JOIN public.entity_tasks et ON et.entity_type = 'service_ticket' AND et.entity_id = st.id
        WHERE et.assigned_to_id = (SELECT auth.uid())
      )
    )
  );

COMMENT ON POLICY "customers_select_policy" ON public.customers IS
  'Admin/Manager/Reception see all customers. Technicians only see customers from tickets with tasks assigned to them.';

-- INSERT: Admin, Manager, Reception can create customers
CREATE POLICY "customers_insert_policy"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'manager', 'reception'])
  );

COMMENT ON POLICY "customers_insert_policy" ON public.customers IS
  'Only Admin, Manager, and Reception can create new customers. Technicians cannot create customers.';

-- UPDATE: Admin, Manager, Reception can update customers
CREATE POLICY "customers_update_policy"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'manager', 'reception'])
  );

COMMENT ON POLICY "customers_update_policy" ON public.customers IS
  'Only Admin, Manager, and Reception can update customer information. Technicians have read-only access.';

-- =====================================================
-- SERVICE_TICKET_PARTS - New RLS Policies
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE public.service_ticket_parts ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "service_ticket_parts_select_policy" ON public.service_ticket_parts;
DROP POLICY IF EXISTS "service_ticket_parts_insert_policy" ON public.service_ticket_parts;
DROP POLICY IF EXISTS "service_ticket_parts_update_policy" ON public.service_ticket_parts;
DROP POLICY IF EXISTS "service_ticket_parts_delete_policy" ON public.service_ticket_parts;

-- SELECT: Same visibility as parent ticket
CREATE POLICY "service_ticket_parts_select_policy"
  ON public.service_ticket_parts FOR SELECT
  TO authenticated
  USING (
    -- Admin, Manager, Reception see all
    public.has_any_role(ARRAY['admin', 'manager', 'reception'])
    OR
    -- Technician sees parts for assigned tickets
    (
      public.is_technician()
      AND ticket_id IN (
        SELECT entity_id
        FROM public.entity_tasks
        WHERE entity_type = 'service_ticket' AND assigned_to_id = (SELECT auth.uid())
      )
    )
  );

-- INSERT: Admin, Manager, Technician (for assigned tickets)
CREATE POLICY "service_ticket_parts_insert_policy"
  ON public.service_ticket_parts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'manager'])
    OR
    -- Technician can add parts to assigned tickets
    (
      public.is_technician()
      AND ticket_id IN (
        SELECT entity_id
        FROM public.entity_tasks
        WHERE entity_type = 'service_ticket' AND assigned_to_id = (SELECT auth.uid())
      )
    )
  );

-- UPDATE: Admin, Manager, Technician (for assigned tickets)
CREATE POLICY "service_ticket_parts_update_policy"
  ON public.service_ticket_parts FOR UPDATE
  TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'manager'])
    OR
    -- Technician can update parts for assigned tickets
    (
      public.is_technician()
      AND ticket_id IN (
        SELECT entity_id
        FROM public.entity_tasks
        WHERE entity_type = 'service_ticket' AND assigned_to_id = (SELECT auth.uid())
      )
    )
  );

-- DELETE: Admin and Manager only
CREATE POLICY "service_ticket_parts_delete_policy"
  ON public.service_ticket_parts FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());

-- =====================================================
-- SERVICE_TICKET_COMMENTS - Updated RLS Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "service_ticket_comments_select_policy" ON public.service_ticket_comments;
DROP POLICY IF EXISTS "service_ticket_comments_insert_policy" ON public.service_ticket_comments;
-- Keep existing update/delete policies (they check ownership)

-- SELECT: Same visibility as parent ticket
CREATE POLICY "service_ticket_comments_select_policy"
  ON public.service_ticket_comments FOR SELECT
  TO authenticated
  USING (
    -- Admin, Manager, Reception see all
    public.has_any_role(ARRAY['admin', 'manager', 'reception'])
    OR
    -- Technician sees comments for assigned tickets
    (
      public.is_technician()
      AND ticket_id IN (
        SELECT entity_id
        FROM public.entity_tasks
        WHERE entity_type = 'service_ticket' AND assigned_to_id = (SELECT auth.uid())
      )
    )
  );

-- INSERT: All authenticated users can comment (but technician only on assigned tickets)
CREATE POLICY "service_ticket_comments_insert_policy"
  ON public.service_ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'manager', 'reception'])
    OR
    -- Technician can comment on assigned tickets
    (
      public.is_technician()
      AND ticket_id IN (
        SELECT entity_id
        FROM public.entity_tasks
        WHERE entity_type = 'service_ticket' AND assigned_to_id = (SELECT auth.uid())
      )
    )
  );

-- =====================================================
-- SERVICE_TICKET_ATTACHMENTS - Updated RLS Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "service_ticket_attachments_select_policy" ON public.service_ticket_attachments;
DROP POLICY IF EXISTS "service_ticket_attachments_insert_policy" ON public.service_ticket_attachments;
-- Keep delete policy (already correct: is_admin_or_manager)

-- SELECT: Same visibility as parent ticket
CREATE POLICY "service_ticket_attachments_select_policy"
  ON public.service_ticket_attachments FOR SELECT
  TO authenticated
  USING (
    -- Admin, Manager, Reception see all
    public.has_any_role(ARRAY['admin', 'manager', 'reception'])
    OR
    -- Technician sees attachments for assigned tickets
    (
      public.is_technician()
      AND ticket_id IN (
        SELECT entity_id
        FROM public.entity_tasks
        WHERE entity_type = 'service_ticket' AND assigned_to_id = (SELECT auth.uid())
      )
    )
  );

-- INSERT: All authenticated users can attach (but technician only on assigned tickets)
CREATE POLICY "service_ticket_attachments_insert_policy"
  ON public.service_ticket_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'manager', 'reception'])
    OR
    -- Technician can upload attachments for assigned tickets
    (
      public.is_technician()
      AND ticket_id IN (
        SELECT entity_id
        FROM public.entity_tasks
        WHERE entity_type = 'service_ticket' AND assigned_to_id = (SELECT auth.uid())
      )
    )
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- After applying this migration, verify policies are correct:
--
-- 1. Check service_tickets policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'service_tickets'
-- ORDER BY policyname;
--
-- 2. Check customers policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'customers'
-- ORDER BY policyname;
--
-- 3. Test as technician (should only see assigned tickets):
-- SET ROLE authenticated;
-- SET request.jwt.claim.sub = '<technician-user-id>';
-- SELECT COUNT(*) FROM service_tickets;  -- Should be limited
--
-- 4. Test as manager (should see all):
-- SET request.jwt.claim.sub = '<manager-user-id>';
-- SELECT COUNT(*) FROM service_tickets;  -- Should see all
--
-- =====================================================

-- =====================================================
-- SUMMARY OF CHANGES
-- =====================================================
--
-- ✅ service_tickets:
--    - SELECT: Technicians now restricted to assigned tickets only
--    - INSERT: Technicians cannot create tickets
--    - UPDATE: Role-based restrictions applied
--
-- ✅ customers:
--    - SELECT: Technicians now see only customers from assigned tickets
--    - INSERT: Technicians cannot create customers
--    - UPDATE: Technicians cannot update customers
--
-- ✅ service_ticket_parts:
--    - New policies restricting technician access to assigned tickets
--
-- ✅ service_ticket_comments:
--    - Updated to restrict technician access to assigned tickets
--
-- ✅ service_ticket_attachments:
--    - Updated to restrict technician access to assigned tickets
--
-- =====================================================
