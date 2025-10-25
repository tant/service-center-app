-- Disable broken triggers from Phase 2
-- Date: 2025-10-25
-- Reason: Critical bugs found during QA testing
-- See: docs/qa/BUG-FIX-TRIGGER-AUTO-MOVE-PRODUCT.md

-- Bug #1: trigger_auto_move_product_on_ticket_event
-- Problem: References non-existent service_tickets.serial_number field
-- Impact: Blocked ALL service ticket creation
-- Fix: Disabled until proper implementation (use service_requests.serial_number via FK)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_auto_move_product_on_ticket_event'
    AND tgrelid = 'service_tickets'::regclass
  ) THEN
    ALTER TABLE service_tickets DISABLE TRIGGER trigger_auto_move_product_on_ticket_event;

    COMMENT ON TRIGGER trigger_auto_move_product_on_ticket_event ON service_tickets IS
    'DISABLED - Bug DI-CRITICAL-001: References non-existent serial_number field in service_tickets table. Product movement to be handled by application layer. See docs/qa/BUG-FIX-TRIGGER-AUTO-MOVE-PRODUCT.md for proper fix options.';
  END IF;
END
$$;

-- Bug #2: trigger_generate_ticket_tasks
-- Problem: Compares incompatible ENUM types (service_type vs warranty_type)
-- Impact: Blocked service ticket creation with ENUM comparison error
-- Fix: Disabled - task generation already handled by application layer (redundant)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_generate_ticket_tasks'
    AND tgrelid = 'service_tickets'::regclass
  ) THEN
    ALTER TABLE service_tickets DISABLE TRIGGER trigger_generate_ticket_tasks;

    COMMENT ON TRIGGER trigger_generate_ticket_tasks ON service_tickets IS
    'DISABLED - Bug DI-CRITICAL-002: Incompatible ENUM comparison (task_templates.service_type vs service_tickets.warranty_type). Task generation is handled by application layer via tRPC, making this trigger redundant.';
  END IF;
END
$$;

-- Verification query
-- To check trigger status, run:
-- SELECT tgname, tgenabled, obj_description(oid, 'pg_trigger') as comment
-- FROM pg_trigger
-- WHERE tgrelid = 'service_tickets'::regclass
--   AND tgname LIKE 'trigger_%'
-- ORDER BY tgname;
--
-- tgenabled values:
-- 'O' = enabled (origin)
-- 'D' = disabled
-- 'A' = enabled (always)
-- 'R' = enabled (replica)
