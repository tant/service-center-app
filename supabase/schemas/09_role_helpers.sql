-- =====================================================
-- 09_role_helpers.sql
-- =====================================================
-- Additional role helper functions for more flexible
-- permission checking in RLS policies and application code.
--
-- These complement the existing is_admin() and is_admin_or_manager()
-- functions with more granular role checking capabilities.
-- =====================================================

-- Get current authenticated user's role
-- Returns: Text representation of the user's role (admin, manager, technician, reception)
-- Returns NULL if user is not authenticated or profile not found
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role::TEXT
  FROM public.profiles
  WHERE user_id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.get_my_role() IS
  'Returns the role of the currently authenticated user as text. Returns NULL if not authenticated or profile not found.';

-- Check if current user has a specific role
-- Parameters:
--   required_role: The role to check against (e.g., 'admin', 'manager')
-- Returns: TRUE if user has the specified role, FALSE otherwise
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role::TEXT = required_role
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.has_role(TEXT) IS
  'Checks if the current user has a specific role. Returns FALSE if not authenticated.';

-- Check if current user has any of the specified roles
-- Parameters:
--   required_roles: Array of roles to check against (e.g., ARRAY['admin', 'manager'])
-- Returns: TRUE if user has any of the specified roles, FALSE otherwise
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role::TEXT = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.has_any_role(TEXT[]) IS
  'Checks if the current user has any of the specified roles. Returns FALSE if not authenticated.';

-- Convenience function: Check if user is manager or above (admin/manager)
-- Returns: TRUE if user is admin or manager, FALSE otherwise
-- Note: This is an alias for the existing is_admin_or_manager() but uses the new has_any_role() function
CREATE OR REPLACE FUNCTION public.is_manager_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_any_role(ARRAY['admin', 'manager']);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.is_manager_or_above() IS
  'Convenience function that returns TRUE if user is admin or manager. Equivalent to has_any_role(ARRAY[''admin'', ''manager''])';

-- Convenience function: Check if user is technician
-- Returns: TRUE if user is technician, FALSE otherwise
CREATE OR REPLACE FUNCTION public.is_technician()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role('technician');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.is_technician() IS
  'Convenience function that returns TRUE if user is a technician.';

-- Convenience function: Check if user is reception
-- Returns: TRUE if user is reception, FALSE otherwise
CREATE OR REPLACE FUNCTION public.is_reception()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role('reception');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.is_reception() IS
  'Convenience function that returns TRUE if user is reception staff.';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_technician() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_reception() TO authenticated;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================
--
-- In RLS policies:
--
-- -- Allow admin/manager to see all tickets, technician only assigned:
-- CREATE POLICY "tickets_select_policy"
-- ON service_tickets FOR SELECT
-- USING (
--   public.has_any_role(ARRAY['admin', 'manager', 'reception'])
--   OR
--   (public.is_technician() AND id IN (
--     SELECT ticket_id FROM service_ticket_tasks
--     WHERE assigned_to_id = auth.uid()
--   ))
-- );
--
-- -- Template management restricted to admin/manager:
-- CREATE POLICY "templates_update_policy"
-- ON task_templates FOR UPDATE
-- USING (public.is_manager_or_above());
--
-- In application queries (via Supabase RPC):
--
-- SELECT public.get_my_role();  -- Returns 'admin', 'manager', 'technician', or 'reception'
-- SELECT public.has_role('admin');  -- Returns true/false
-- SELECT public.has_any_role(ARRAY['admin', 'manager']);  -- Returns true/false
--
-- =====================================================
