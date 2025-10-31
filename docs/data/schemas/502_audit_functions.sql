-- =====================================================
-- 502_audit_functions.sql
-- =====================================================
-- Audit Logging Functions
--
-- Functions for:
-- - General audit logging
-- - Template switch logging with validation
-- - Audit trail management
--
-- ORDER: 500-599 (Functions)
-- DEPENDENCIES: 205
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
