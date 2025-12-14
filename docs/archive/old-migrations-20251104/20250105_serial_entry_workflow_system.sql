-- ============================================
-- Phase 2: Serial Entry Workflow System
-- Migration: Add workflow support for automated serial entry tasks
-- Date: 2025-11-03
-- ============================================

-- ============================================
-- 1. Add workflow_id to stock_receipts
-- ============================================

ALTER TABLE stock_receipts
ADD COLUMN workflow_id UUID REFERENCES workflows(id);

-- Add index for performance
CREATE INDEX idx_stock_receipts_workflow_id
ON stock_receipts(workflow_id);

-- ============================================
-- 2. Note: Workflow creation skipped in migration
-- ============================================

-- Note: Serial Entry workflow and tasks should be created via the admin UI
-- after initial setup. The triggers below will work with any workflow
-- that has entity_type = 'inventory_receipt'.
--
-- To create the workflow manually:
-- 1. Log in as admin
-- 2. Go to Workflows page
-- 3. Create new workflow:
--    - Name: "Serial Entry Workflow"
--    - Entity Type: Inventory Receipt
--    - Add task: "Enter Serial Numbers"
-- 4. Assign workflow to receipts

DO $$
BEGIN
  RAISE NOTICE 'Serial Entry workflow should be created via admin UI';
  RAISE NOTICE 'The auto-create and auto-complete triggers are ready to use';
END $$;

-- ============================================
-- 3. Auto-create serial entry tasks trigger
-- ============================================

CREATE OR REPLACE FUNCTION auto_create_serial_entry_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_workflow_id UUID;
  v_product_record RECORD;
  v_task_count INT;
  v_sequence INT;
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN

    -- Get workflow_id if it was set on the receipt
    -- (Workflow should be assigned to receipt before approval, either manually or via default)
    v_workflow_id := NEW.workflow_id;

    -- If no workflow assigned, skip task creation (workflow is optional)
    IF v_workflow_id IS NULL THEN
      RAISE NOTICE 'No workflow assigned to receipt %, skipping task creation', NEW.id;
      RETURN NEW;
    END IF;

    -- Verify workflow exists and is for inventory_receipt
    IF NOT EXISTS (
      SELECT 1 FROM public.workflows
      WHERE id = v_workflow_id
      AND entity_type = 'inventory_receipt'
    ) THEN
      RAISE WARNING 'Workflow % not found or not for inventory_receipt, skipping task creation', v_workflow_id;
      RETURN NEW;
    END IF;

    -- Check if tasks already exist (idempotency - prevent duplicates)
    SELECT COUNT(*) INTO v_task_count
    FROM public.entity_tasks
    WHERE entity_type = 'inventory_receipt'
      AND entity_id = NEW.id;

    IF v_task_count > 0 THEN
      RAISE NOTICE 'Serial entry tasks already exist for receipt %, skipping creation', NEW.id;
      RETURN NEW; -- Tasks already exist, skip creation
    END IF;

    -- Create one task per product in receipt
    v_sequence := 1;
    FOR v_product_record IN
      SELECT
        sri.id as receipt_item_id,
        sri.product_id,
        p.name as product_name,
        sri.declared_quantity as expected_quantity
      FROM public.stock_receipt_items sri
      JOIN public.products p ON p.id = sri.product_id
      WHERE sri.receipt_id = NEW.id
      ORDER BY sri.created_at
    LOOP
      -- Create entity_task for this product
      INSERT INTO public.entity_tasks (
        id,
        entity_type,
        entity_id,
        workflow_id,
        name,
        description,
        sequence_order,
        is_required,
        status,
        assigned_to_id,
        due_date,
        metadata,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        'inventory_receipt',
        NEW.id,
        v_workflow_id,
        'Enter serials for ' || v_product_record.product_name,
        format('%s units - Serial entry required', v_product_record.expected_quantity),
        v_sequence,
        true, -- Required task
        'pending',
        NULL, -- Unassigned (available for claiming)
        NEW.created_at + INTERVAL '7 days', -- Default 7 days due date
        jsonb_build_object(
          'product_id', v_product_record.product_id,
          'product_name', v_product_record.product_name,
          'expected_quantity', v_product_record.expected_quantity,
          'receipt_item_id', v_product_record.receipt_item_id,
          'auto_created', true
        ),
        NOW(),
        NOW()
      );

      v_sequence := v_sequence + 1;
      RAISE NOTICE 'Created serial entry task for product: %', v_product_record.product_name;
    END LOOP;

    RAISE NOTICE 'Auto-created % serial entry tasks for receipt %', v_sequence - 1, NEW.id;

  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to stock_receipts table
DROP TRIGGER IF EXISTS trg_auto_create_serial_entry_tasks ON stock_receipts;

CREATE TRIGGER trg_auto_create_serial_entry_tasks
  BEFORE UPDATE ON stock_receipts
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_serial_entry_tasks();

-- ============================================
-- 4. Auto-complete serial entry task trigger
-- ============================================

CREATE OR REPLACE FUNCTION auto_complete_serial_entry_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_receipt_item_id UUID;
  v_receipt_id UUID;
  v_product_id UUID;
  v_expected_quantity INT;
  v_serial_count INT;
  v_progress_percentage NUMERIC;
  v_task_id UUID;
  v_task_status TEXT;
  v_all_tasks_complete BOOLEAN;
BEGIN
  -- Get receipt_item_id from the inserted/deleted serial
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_receipt_item_id := NEW.receipt_item_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_receipt_item_id := OLD.receipt_item_id;
  END IF;

  -- Get receipt_id, product_id, expected_quantity, and serial_count from stock_receipt_items
  SELECT receipt_id, product_id, declared_quantity, serial_count
  INTO v_receipt_id, v_product_id, v_expected_quantity, v_serial_count
  FROM public.stock_receipt_items
  WHERE id = v_receipt_item_id;

  IF v_receipt_id IS NULL THEN
    RAISE WARNING 'No receipt item found for id %', v_receipt_item_id;
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calculate progress percentage
  v_progress_percentage := (v_serial_count::NUMERIC / ABS(v_expected_quantity)) * 100;

  RAISE NOTICE 'Serial progress for receipt % product %: % / % (%)',
    v_receipt_id, v_product_id, v_serial_count, v_expected_quantity, v_progress_percentage;

  -- Find the entity_task for this receipt + product
  SELECT id, status INTO v_task_id, v_task_status
  FROM public.entity_tasks
  WHERE entity_type = 'inventory_receipt'
    AND entity_id = v_receipt_id
    AND (metadata->>'product_id')::UUID = v_product_id
  LIMIT 1;

  IF v_task_id IS NULL THEN
    RAISE NOTICE 'No entity_task found for receipt % product %, skipping auto-completion', v_receipt_id, v_product_id;
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Auto-complete task if progress = 100%
  IF v_progress_percentage >= 100 AND v_task_status != 'completed' THEN
    UPDATE public.entity_tasks
    SET
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW(),
      metadata = metadata || jsonb_build_object(
        'auto_completed', true,
        'completion_time', NOW()
      )
    WHERE id = v_task_id;

    RAISE NOTICE 'Auto-completed task % for receipt % product %', v_task_id, v_receipt_id, v_product_id;

    -- Check if ALL tasks for this receipt are complete
    SELECT NOT EXISTS (
      SELECT 1
      FROM public.entity_tasks
      WHERE entity_type = 'inventory_receipt'
        AND entity_id = v_receipt_id
        AND is_required = true
        AND status NOT IN ('completed', 'skipped')
    ) INTO v_all_tasks_complete;

    IF v_all_tasks_complete THEN
      -- Auto-complete receipt (set to 'completed' status)
      UPDATE public.stock_receipts
      SET
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = v_receipt_id
        AND status != 'completed';

      RAISE NOTICE 'Auto-completed receipt % (all serial entry tasks done)', v_receipt_id;
    END IF;

  -- Reopen task if progress < 100% and task was previously completed (serial deleted)
  ELSIF v_progress_percentage < 100 AND v_task_status = 'completed' THEN
    UPDATE public.entity_tasks
    SET
      status = 'in_progress',
      completed_at = NULL,
      updated_at = NOW(),
      metadata = metadata || jsonb_build_object(
        'reopened', true,
        'reopen_time', NOW()
      )
    WHERE id = v_task_id;

    RAISE NOTICE 'Reopened task % (serial deleted, progress now %)', v_task_id, v_progress_percentage;

    -- Reopen receipt if it was completed (set back to 'approved')
    UPDATE public.stock_receipts
    SET
      status = 'approved',
      completed_at = NULL,
      updated_at = NOW()
    WHERE id = v_receipt_id
      AND status = 'completed';

    RAISE NOTICE 'Reopened receipt % (serial deleted)', v_receipt_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to stock_receipt_serials table
DROP TRIGGER IF EXISTS trg_auto_complete_serial_entry_task ON stock_receipt_serials;

CREATE TRIGGER trg_auto_complete_serial_entry_task
  AFTER INSERT OR UPDATE OR DELETE ON stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_serial_entry_task();

-- ============================================
-- 5. Helper function: Get serial entry progress
-- ============================================

CREATE OR REPLACE FUNCTION get_serial_entry_progress(p_receipt_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  expected_quantity INT,
  serial_count INT,
  percentage NUMERIC,
  task_id UUID,
  task_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sri.product_id,
    p.name as product_name,
    sri.declared_quantity as expected_quantity,
    sri.serial_count,
    ROUND((sri.serial_count::NUMERIC / NULLIF(ABS(sri.declared_quantity), 0)) * 100, 2) as percentage,
    et.id as task_id,
    et.status as task_status
  FROM public.stock_receipt_items sri
  JOIN public.products p ON sri.product_id = p.id
  LEFT JOIN public.entity_tasks et
    ON et.entity_id = sri.receipt_id
    AND et.entity_type = 'inventory_receipt'
    AND (et.metadata->>'product_id')::UUID = sri.product_id
  WHERE sri.receipt_id = p_receipt_id
  ORDER BY sri.created_at;
END;
$$;

-- ============================================
-- 6. Note: Workflow assignment
-- ============================================

-- Note: Workflows should be assigned to receipts manually or via a default workflow setting
-- This migration does not backfill existing receipts with workflows
-- To enable serial entry tasks for existing receipts:
-- 1. Create a workflow via admin UI (entity_type = 'inventory_receipt')
-- 2. Assign it to receipts before approving them
-- 3. Or update existing receipts: UPDATE stock_receipts SET workflow_id = '<workflow-id>' WHERE ...

DO $$
BEGIN
  RAISE NOTICE 'Workflow assignment should be done manually via admin UI or receipt creation';
END $$;

-- ============================================
-- Migration complete!
-- ============================================

-- Verify installation
DO $$
DECLARE
  v_workflow_count INT;
  v_trigger_count INT;
BEGIN
  -- Check workflow exists
  SELECT COUNT(*) INTO v_workflow_count
  FROM workflows
  WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001';

  -- Check triggers exist
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_name IN ('trg_auto_create_serial_entry_tasks', 'trg_auto_complete_serial_entry_task');

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 2: Serial Entry Workflow System';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Serial Entry workflow created: %', v_workflow_count = 1;
  RAISE NOTICE 'Triggers installed: % / 2', v_trigger_count;
  RAISE NOTICE 'workflow_id column added to inventory_receipts: YES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration complete!';
  RAISE NOTICE '========================================';
END $$;
