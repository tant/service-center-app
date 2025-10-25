-- =====================================================
-- 10_audit_logs.sql
-- =====================================================
-- Audit logging system for tracking sensitive operations
-- and permission-related actions throughout the application.
--
-- Key features:
-- - Immutable audit trail (no updates/deletes allowed)
-- - Captures WHO (user, role, email) performed WHAT (action, resource)
-- - Records changes (old/new values) and WHY (reason for sensitive ops)
-- - WHERE information (IP address, user agent)
-- =====================================================

-- =====================================================
-- AUDIT_LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- WHO performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT NOT NULL,
  user_email TEXT,

  -- WHAT action was performed
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,

  -- WHAT changed (structured data)
  old_values JSONB,
  new_values JSONB,
  changes JSONB, -- Computed diff for easier analysis

  -- WHY (required for sensitive operations like template switches)
  reason TEXT,

  -- WHERE (client information)
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  metadata JSONB, -- Additional context-specific data

  -- Constraints
  CONSTRAINT audit_logs_action_check CHECK (action IN (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'failed_login',
    'template_switch',
    'role_change',
    'stock_movement',
    'rma_create',
    'rma_send',
    'approve',
    'reject',
    'assign',
    'reassign',
    'status_change',
    'export_data'
  )),
  CONSTRAINT audit_logs_resource_type_check CHECK (resource_type IN (
    'ticket',
    'task',
    'user',
    'profile',
    'customer',
    'product',
    'part',
    'stock',
    'template',
    'warehouse',
    'rma_batch',
    'system'
  ))
);

COMMENT ON TABLE public.audit_logs IS
  'Immutable audit trail of all sensitive operations and permission-related actions in the system.';

COMMENT ON COLUMN public.audit_logs.user_id IS
  'Reference to the user who performed the action. NULL if user was deleted or action was system-initiated.';

COMMENT ON COLUMN public.audit_logs.user_role IS
  'Snapshot of user role at the time of action (preserved even if user role changes later).';

COMMENT ON COLUMN public.audit_logs.action IS
  'Type of action performed (create, update, delete, etc.)';

COMMENT ON COLUMN public.audit_logs.resource_type IS
  'Type of resource affected (ticket, user, stock, etc.)';

COMMENT ON COLUMN public.audit_logs.resource_id IS
  'ID of the specific resource affected (stored as text to support different ID types).';

COMMENT ON COLUMN public.audit_logs.old_values IS
  'JSONB snapshot of values before the change.';

COMMENT ON COLUMN public.audit_logs.new_values IS
  'JSONB snapshot of values after the change.';

COMMENT ON COLUMN public.audit_logs.changes IS
  'JSONB containing computed diff between old and new values for easier querying.';

COMMENT ON COLUMN public.audit_logs.reason IS
  'Required explanation for sensitive operations (e.g., why a template was switched). Minimum 10 characters enforced at application level.';

COMMENT ON COLUMN public.audit_logs.metadata IS
  'Additional context-specific data that doesn''t fit in standard columns.';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_user_role ON public.audit_logs(user_role);

-- GIN index for JSON queries
CREATE INDEX idx_audit_logs_old_values ON public.audit_logs USING GIN(old_values);
CREATE INDEX idx_audit_logs_new_values ON public.audit_logs USING GIN(new_values);
CREATE INDEX idx_audit_logs_changes ON public.audit_logs USING GIN(changes);
CREATE INDEX idx_audit_logs_metadata ON public.audit_logs USING GIN(metadata);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Audit logs are ADMIN-ONLY for viewing
-- All authenticated users can INSERT (via log_audit function)
-- NO ONE can UPDATE or DELETE (immutable audit trail)

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY audit_logs_admin_select
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- All authenticated users can insert (via function)
-- The function enforces proper data collection
CREATE POLICY audit_logs_authenticated_insert
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- NO UPDATE POLICY = No one can update (immutable)
-- NO DELETE POLICY = No one can delete (immutable)

-- =====================================================
-- AUDIT LOGGING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_role TEXT;
  v_user_email TEXT;
  v_changes JSONB;
BEGIN
  -- Get user info from profiles
  SELECT p.role::TEXT, u.email
  INTO v_user_role, v_user_email
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = auth.uid();

  -- If user not found (shouldn't happen), use defaults
  IF v_user_role IS NULL THEN
    v_user_role := 'unknown';
    v_user_email := 'unknown@system';
  END IF;

  -- Compute changes (simple diff - can be enhanced)
  -- This creates a JSONB object with only changed fields
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    v_changes := jsonb_object_agg(
      key,
      jsonb_build_object('old', p_old_values->key, 'new', p_new_values->key)
    )
    FROM jsonb_each(p_new_values)
    WHERE p_old_values->key IS DISTINCT FROM p_new_values->key;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    user_role,
    user_email,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    changes,
    reason,
    metadata
  ) VALUES (
    auth.uid(),
    v_user_role,
    v_user_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    v_changes,
    p_reason,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.log_audit IS
  'Creates an immutable audit log entry. Called by application code for sensitive operations. Returns the audit log ID.';

-- =====================================================
-- HELPER FUNCTION: LOG TEMPLATE SWITCH (with validation)
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_template_switch(
  p_ticket_id UUID,
  p_old_template_id UUID,
  p_new_template_id UUID,
  p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_old_template_name TEXT;
  v_new_template_name TEXT;
BEGIN
  -- Validate reason (must be at least 10 characters)
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Template switch requires a detailed reason (minimum 10 characters)'
      USING HINT = 'Please provide a clear explanation for why the template is being changed.';
  END IF;

  -- Get template names for better audit trail
  SELECT name INTO v_old_template_name
  FROM public.task_templates
  WHERE id = p_old_template_id;

  SELECT name INTO v_new_template_name
  FROM public.task_templates
  WHERE id = p_new_template_id;

  -- Log the action
  v_audit_id := public.log_audit(
    p_action := 'template_switch',
    p_resource_type := 'ticket',
    p_resource_id := p_ticket_id::TEXT,
    p_old_values := jsonb_build_object(
      'template_id', p_old_template_id,
      'template_name', v_old_template_name
    ),
    p_new_values := jsonb_build_object(
      'template_id', p_new_template_id,
      'template_name', v_new_template_name
    ),
    p_reason := p_reason
  );

  -- Also insert into ticket_template_changes for backward compatibility
  INSERT INTO public.ticket_template_changes (
    ticket_id,
    old_template_id,
    new_template_id,
    reason,
    changed_by_id
  ) VALUES (
    p_ticket_id,
    p_old_template_id,
    p_new_template_id,
    p_reason,
    auth.uid()
  );

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.log_template_switch IS
  'Logs a template switch with mandatory reason validation. Requires minimum 10 character reason. Also updates ticket_template_changes table.';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.log_audit(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_template_switch(UUID, UUID, UUID, TEXT) TO authenticated;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================
--
-- Basic audit log:
-- SELECT public.log_audit(
--   'create',
--   'ticket',
--   'abc-123',
--   NULL,
--   '{"customer_id": "xyz", "status": "pending"}'::jsonb
-- );
--
-- Template switch (with validation):
-- SELECT public.log_template_switch(
--   'ticket-id'::uuid,
--   'old-template-id'::uuid,
--   'new-template-id'::uuid,
--   'Customer requested warranty service instead of repair'
-- );
--
-- Query audit logs (admin only):
-- SELECT * FROM public.audit_logs
-- WHERE resource_type = 'ticket'
--   AND action = 'template_switch'
--   AND created_at > NOW() - INTERVAL '7 days'
-- ORDER BY created_at DESC;
--
-- Find all actions by a specific user:
-- SELECT * FROM public.audit_logs
-- WHERE user_id = 'user-uuid'
-- ORDER BY created_at DESC;
--
-- Track changes to specific resource:
-- SELECT * FROM public.audit_logs
-- WHERE resource_type = 'ticket'
--   AND resource_id = 'ticket-uuid'
-- ORDER BY created_at ASC;
--
-- =====================================================
