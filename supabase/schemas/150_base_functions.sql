-- =====================================================
-- 150_base_functions.sql
-- =====================================================
-- Core Helper Functions
--
-- This file defines reusable helper functions used
-- across the entire schema including:
-- - Timestamp update triggers
-- - Role checking functions
-- - Auto-numbering functions
-- - Warranty calculation functions
--
-- ORDER: 100-199 (Base Schema)
-- DEPENDENCIES: 100_enums_and_sequences.sql
-- =====================================================

-- =====================================================
-- CORE HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp';

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user has admin role';

-- Check if current user is an admin or manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
COMMENT ON FUNCTION public.is_admin_or_manager() IS 'Returns true if current user has admin or manager role';

-- =====================================================
-- ROLE HELPER FUNCTIONS
-- =====================================================

-- Get current authenticated user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role::TEXT
    FROM public.profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';
COMMENT ON FUNCTION public.get_my_role() IS 'Returns the role of the currently authenticated user as text. Returns NULL if not authenticated or profile not found.';

-- Check if current user has a specific role
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
COMMENT ON FUNCTION public.has_role(TEXT) IS 'Checks if the current user has a specific role. Returns FALSE if not authenticated.';

-- Check if current user has any of the specified roles
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
COMMENT ON FUNCTION public.has_any_role(TEXT[]) IS 'Checks if the current user has any of the specified roles. Returns FALSE if not authenticated.';

-- Convenience function: Check if user is manager or above (admin/manager)
CREATE OR REPLACE FUNCTION public.is_manager_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_any_role(ARRAY['admin', 'manager']);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';
COMMENT ON FUNCTION public.is_manager_or_above() IS 'Convenience function that returns TRUE if user is admin or manager. Equivalent to has_any_role(ARRAY[''admin'', ''manager''])';

-- Convenience function: Check if user is technician
CREATE OR REPLACE FUNCTION public.is_technician()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role('technician');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';
COMMENT ON FUNCTION public.is_technician() IS 'Convenience function that returns TRUE if user is a technician.';

-- Convenience function: Check if user is reception
CREATE OR REPLACE FUNCTION public.is_reception()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role('reception');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';
COMMENT ON FUNCTION public.is_reception() IS 'Convenience function that returns TRUE if user is reception staff.';

-- =====================================================
-- AUTO-NUMBERING FUNCTIONS
-- =====================================================

-- Generates unique tracking tokens for service requests
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_token VARCHAR(15);
  v_characters VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_token_exists BOOLEAN;
  v_max_attempts INT := 100;
  v_attempt INT := 0;
BEGIN
  IF NEW.tracking_token IS NOT NULL THEN
    RETURN NEW;
  END IF;
  LOOP
    v_token := 'SR-';
    FOR i IN 1..12 LOOP
      v_token := v_token || SUBSTRING(v_characters FROM (FLOOR(RANDOM() * 36) + 1)::INT FOR 1);
    END LOOP;
    SELECT EXISTS(
      SELECT 1 FROM public.service_requests WHERE tracking_token = v_token
    ) INTO v_token_exists;
    EXIT WHEN NOT v_token_exists;
    v_attempt := v_attempt + 1;
    IF v_attempt >= v_max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique tracking token after % attempts', v_max_attempts;
    END IF;
  END LOOP;
  NEW.tracking_token := v_token;
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.generate_tracking_token() IS 'Auto-generates unique tracking tokens (SR-XXXXXXXXXXXX) for service requests';

-- Generates sequential RMA batch numbers
CREATE OR REPLACE FUNCTION public.generate_rma_batch_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_year VARCHAR(4);
  v_month VARCHAR(2);
  v_sequence INT;
BEGIN
  IF NEW.batch_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(batch_number FROM 13 FOR 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.rma_batches
  WHERE batch_number LIKE 'RMA-' || v_year || '-' || v_month || '-%';
  NEW.batch_number := 'RMA-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 3, '0');
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.generate_rma_batch_number() IS 'Auto-generates sequential RMA batch numbers (RMA-YYYY-MM-NNN)';

-- =====================================================
-- WARRANTY HELPER FUNCTIONS
-- =====================================================

-- Helper function to calculate warranty end date
CREATE OR REPLACE FUNCTION public.calculate_warranty_end_date(
  p_start_date DATE,
  p_warranty_months INT
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  IF p_start_date IS NULL OR p_warranty_months IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN p_start_date + (p_warranty_months || ' months')::INTERVAL;
END;
$$;
COMMENT ON FUNCTION public.calculate_warranty_end_date(DATE, INT) IS 'Calculates warranty end date from start date and warranty duration in months';

-- Returns warranty status: active, expiring_soon, expired
CREATE OR REPLACE FUNCTION public.get_warranty_status(p_warranty_end_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_days_remaining INT;
BEGIN
  IF p_warranty_end_date IS NULL THEN
    RETURN 'unknown';
  END IF;
  v_days_remaining := p_warranty_end_date - CURRENT_DATE;
  IF v_days_remaining < 0 THEN
    RETURN 'expired';
  ELSIF v_days_remaining <= 30 THEN
    RETURN 'expiring_soon';
  ELSE
    RETURN 'active';
  END IF;
END;
$$;
COMMENT ON FUNCTION public.get_warranty_status(DATE) IS 'Returns warranty status: active (>30 days), expiring_soon (≤30 days), expired (<0 days), or unknown';

-- =====================================================
-- GRANTS FOR ALL FUNCTIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_technician() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_reception() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_tracking_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_warranty_end_date(DATE, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_warranty_status(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_rma_batch_number() TO authenticated;
