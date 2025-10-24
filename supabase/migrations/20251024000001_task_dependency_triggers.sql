-- Migration: Task Dependencies and Status Automation Triggers
-- Story: 1.5 - Task Dependencies and Status Automation
-- Description: Creates triggers for task sequence validation and automatic ticket status updates

-- =================================================================
-- TRIGGER 1: check_task_sequence_gate()
-- Validates task sequence before completing tasks (strict mode only)
-- =================================================================

CREATE OR REPLACE FUNCTION check_task_sequence_gate()
RETURNS TRIGGER AS $$
DECLARE
  v_enforce_sequence BOOLEAN;
  v_incomplete_count INTEGER;
  v_template_id UUID;
  v_incomplete_tasks TEXT;
BEGIN
  -- Only check when changing status to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Get template_id from ticket
    SELECT template_id INTO v_template_id
    FROM service_tickets
    WHERE id = NEW.ticket_id;

    -- If no template, allow completion
    IF v_template_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Check if template enforces sequence
    SELECT enforce_sequence INTO v_enforce_sequence
    FROM task_templates
    WHERE id = v_template_id;

    -- If flexible mode, allow completion
    IF NOT v_enforce_sequence THEN
      RETURN NEW;
    END IF;

    -- Check if all previous tasks are completed
    SELECT COUNT(*) INTO v_incomplete_count
    FROM service_ticket_tasks
    WHERE ticket_id = NEW.ticket_id
      AND sequence_order < NEW.sequence_order
      AND status != 'completed'
      AND status != 'skipped';

    -- If any previous tasks incomplete, reject
    IF v_incomplete_count > 0 THEN
      -- Get names of incomplete tasks for error message
      SELECT STRING_AGG(
        CONCAT('#', sequence_order, ' ', tt.name),
        ', '
        ORDER BY sequence_order
      ) INTO v_incomplete_tasks
      FROM service_ticket_tasks stt
      JOIN task_types tt ON tt.id = stt.task_type_id
      WHERE stt.ticket_id = NEW.ticket_id
        AND stt.sequence_order < NEW.sequence_order
        AND stt.status != 'completed'
        AND stt.status != 'skipped';

      RAISE EXCEPTION 'Cannot complete task: % incomplete prerequisite task(s) must be completed first. Incomplete: %',
        v_incomplete_count,
        v_incomplete_tasks
        USING HINT = 'Complete previous tasks in sequence or switch template to flexible mode';
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_check_task_sequence_gate ON service_ticket_tasks;

CREATE TRIGGER trigger_check_task_sequence_gate
  BEFORE UPDATE ON service_ticket_tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_task_sequence_gate();

COMMENT ON FUNCTION check_task_sequence_gate() IS
  'Validates task completion sequence for templates with enforce_sequence = true';

-- =================================================================
-- TRIGGER 2: auto_advance_ticket_status()
-- Automatically updates ticket status based on task progress
-- =================================================================

CREATE OR REPLACE FUNCTION auto_advance_ticket_status()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket_status ticket_status;
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_current_user_id UUID;
BEGIN
  -- Get current ticket status
  SELECT status INTO v_ticket_status
  FROM service_tickets
  WHERE id = NEW.ticket_id;

  -- Skip if ticket already in terminal state
  IF v_ticket_status IN ('completed', 'cancelled') THEN
    RETURN NEW;
  END IF;

  -- Get current user (from assigned_to_id or use system)
  v_current_user_id := COALESCE(NEW.assigned_to_id, NEW.updated_by_id);

  -- Count total and completed tasks
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_tasks, v_completed_tasks
  FROM service_ticket_tasks
  WHERE ticket_id = NEW.ticket_id;

  -- Auto-advance to in_progress when first task starts
  IF NEW.status = 'in_progress' AND OLD.status = 'pending' AND v_ticket_status = 'pending' THEN
    UPDATE service_tickets
    SET status = 'in_progress',
        updated_at = NOW()
    WHERE id = NEW.ticket_id
      AND status = 'pending'; -- Only if still pending

    -- Log to comments if update happened
    IF FOUND THEN
      INSERT INTO service_ticket_comments (ticket_id, comment, created_by_id, created_at)
      VALUES (
        NEW.ticket_id,
        'Trạng thái phiếu tự động chuyển sang Đang xử lý (công việc đầu tiên bắt đầu)',
        v_current_user_id,
        NOW()
      );
    END IF;
  END IF;

  -- Auto-complete ticket when all tasks completed
  IF NEW.status = 'completed' AND v_completed_tasks >= v_total_tasks AND v_total_tasks > 0 THEN
    UPDATE service_tickets
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.ticket_id
      AND status != 'completed'
      AND status != 'cancelled'; -- Don't override cancelled tickets

    -- Log to comments if update happened
    IF FOUND THEN
      INSERT INTO service_ticket_comments (ticket_id, comment, created_by_id, created_at)
      VALUES (
        NEW.ticket_id,
        'Phiếu tự động hoàn thành (tất cả công việc đã xong)',
        v_current_user_id,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_advance_ticket_status ON service_ticket_tasks;

CREATE TRIGGER trigger_auto_advance_ticket_status
  AFTER UPDATE ON service_ticket_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_advance_ticket_status();

COMMENT ON FUNCTION auto_advance_ticket_status() IS
  'Automatically updates ticket status when tasks start or complete';
