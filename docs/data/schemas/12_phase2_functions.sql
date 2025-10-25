-- Phase 2 Helper Functions
-- Service Center - Auto-generation and Utility Functions
-- Created: 2025-10-23
-- Story: 01.01 Foundation Setup

-- =====================================================
-- TRACKING TOKEN GENERATOR
-- =====================================================
-- Generates unique tracking tokens for service requests
-- Format: SR-XXXXXXXXXXXX (12 random alphanumeric characters)

CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token VARCHAR(15);
  v_characters VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_token_exists BOOLEAN;
  v_max_attempts INT := 100;
  v_attempt INT := 0;
BEGIN
  -- Skip if tracking_token already set
  IF NEW.tracking_token IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Generate unique token with retry logic
  LOOP
    -- Generate 12 random characters
    v_token := 'SR-';
    FOR i IN 1..12 LOOP
      v_token := v_token || SUBSTRING(v_characters FROM (FLOOR(RANDOM() * 36) + 1)::INT FOR 1);
    END LOOP;

    -- Check uniqueness
    SELECT EXISTS(
      SELECT 1 FROM public.service_requests WHERE tracking_token = v_token
    ) INTO v_token_exists;

    EXIT WHEN NOT v_token_exists;

    -- Prevent infinite loop
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

-- =====================================================
-- CALCULATE WARRANTY END DATE
-- =====================================================
-- Helper function to calculate warranty end date

CREATE OR REPLACE FUNCTION public.calculate_warranty_end_date(
  p_start_date DATE,
  p_warranty_months INT
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_start_date IS NULL OR p_warranty_months IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN p_start_date + (p_warranty_months || ' months')::INTERVAL;
END;
$$;

COMMENT ON FUNCTION public.calculate_warranty_end_date(DATE, INT) IS 'Calculates warranty end date from start date and warranty duration in months';

-- =====================================================
-- GET WARRANTY STATUS
-- =====================================================
-- Returns warranty status: active, expiring_soon, expired

CREATE OR REPLACE FUNCTION public.get_warranty_status(p_warranty_end_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
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
-- AUTO-UPDATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================
-- Updates updated_at timestamp on row modification

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';

-- =====================================================
-- RMA BATCH NUMBER GENERATOR
-- =====================================================
-- Generates sequential RMA batch numbers
-- Format: RMA-YYYY-MM-NNN

CREATE OR REPLACE FUNCTION public.generate_rma_batch_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year VARCHAR(4);
  v_month VARCHAR(2);
  v_sequence INT;
BEGIN
  -- Skip if batch_number already set
  IF NEW.batch_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get current year and month
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');

  -- Get next sequence number for this month
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(batch_number FROM 13 FOR 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.rma_batches
  WHERE batch_number LIKE 'RMA-' || v_year || '-' || v_month || '-%';

  -- Generate batch number
  NEW.batch_number := 'RMA-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 3, '0');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_rma_batch_number() IS 'Auto-generates sequential RMA batch numbers (RMA-YYYY-MM-NNN)';

-- =====================================================
-- DISABLED TRIGGERS - DOCUMENTED FOR REFERENCE
-- =====================================================
-- The following triggers were created during Phase 2 development
-- but have been DISABLED due to critical bugs found during QA testing
-- Date: 2025-10-25
-- See: docs/qa/BUG-FIX-TRIGGER-AUTO-MOVE-PRODUCT.md

-- ⚠️ DISABLED: auto_move_product_on_ticket_event()
-- Created by: supabase/migrations/20251024000004_auto_move_product_on_ticket_event.sql
-- Bug: DI-CRITICAL-001 - References non-existent service_tickets.serial_number field
-- Impact: Blocked ALL service ticket creation
-- Status: DISABLED via migration 20251025000000_disable_broken_triggers.sql
-- Workaround: Product warehouse movement handled by application layer
-- Fix Options:
--   A) Rewrite to use service_requests.serial_number via request_id FK
--   B) Add physical_product_id column to service_tickets
--   C) Remove permanently (feature not critical for MVP)
--
-- Original intended functionality:
--   - Auto-move products to 'in_service' warehouse when ticket created
--   - Auto-return products to original warehouse when ticket completed
--   - Track movements in stock_movements table

-- ⚠️ DISABLED: trigger_generate_ticket_tasks
-- Created by: supabase/migrations/20251023070000_automatic_task_generation_trigger.sql
-- Bug: DI-CRITICAL-002 - Compares incompatible ENUM types
--       (task_templates.service_type vs service_tickets.warranty_type)
-- Impact: Blocked service ticket creation
-- Status: DISABLED via migration 20251025000000_disable_broken_triggers.sql
-- Workaround: Task generation already handled by application layer (tRPC)
-- Fix: Not needed - this trigger is redundant with existing app logic
--
-- Original intended functionality:
--   - Auto-generate tasks from template when ticket created
--   - Match template based on service_type
--   - Already implemented in application layer, making trigger redundant

-- Note: Both triggers remain in the database but are disabled
-- To check status:
-- SELECT tgname, tgenabled, obj_description(oid, 'pg_trigger') as comment
-- FROM pg_trigger
-- WHERE tgrelid = 'service_tickets'::regclass
--   AND tgname LIKE 'trigger_%'
-- ORDER BY tgname;
