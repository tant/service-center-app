-- =====================================================
-- Migration: Fix workflow completion trigger to check receipt_status
-- =====================================================
-- Date: 2025-11-14
-- Issue: Service requests auto-create tickets when workflow completes
--        EVEN IF receipt_status = 'pending_receipt' (products not yet received)
-- Root Cause: auto_update_service_request_on_workflow_complete() missing receipt_status check
-- Fix: Add receipt_status = 'received' check before creating tickets
-- =====================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_auto_update_request_on_workflow_complete ON public.entity_tasks;

-- Recreate function with receipt_status check
CREATE OR REPLACE FUNCTION public.auto_update_service_request_on_workflow_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_request_id UUID;
  v_task_count INT;
  v_completed_count INT;
  v_request_status public.request_status;
  v_receipt_status public.receipt_status;
  v_request RECORD;
  v_tickets_created INT;
BEGIN
  -- Only process service_request tasks
  IF NEW.entity_type != 'service_request' THEN
    RETURN NEW;
  END IF;

  -- Only process when task is marked as completed
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  v_request_id := NEW.entity_id;

  -- Get current request data
  SELECT * INTO v_request
  FROM public.service_requests
  WHERE id = v_request_id;

  v_request_status := v_request.status;
  v_receipt_status := v_request.receipt_status;

  -- =====================================================
  -- FIX: Check if products have been received
  -- =====================================================
  -- If workflow completes but products not yet received,
  -- DO NOT create tickets - wait for receipt confirmation
  IF v_receipt_status != 'received' THEN
    RAISE NOTICE 'Service Request % (%) workflow completed but receipt_status = % - waiting for product receipt before creating tickets',
      v_request_id, v_request.tracking_token, v_receipt_status;
    RETURN NEW;
  END IF;

  -- Only process if request is waiting for workflow completion
  -- Skip if already processing, completed, or cancelled
  IF v_request_status NOT IN ('submitted', 'pickingup', 'received') THEN
    RETURN NEW;
  END IF;

  -- Count total and completed tasks
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_task_count, v_completed_count
  FROM public.entity_tasks
  WHERE entity_type = 'service_request' AND entity_id = v_request_id;

  -- If all tasks completed AND products received, create tickets
  IF v_task_count > 0 AND v_task_count = v_completed_count THEN
    RAISE NOTICE 'Service Request % (%) workflow completed AND products received - creating tickets',
      v_request_id, v_request.tracking_token;

    -- Call shared function to create tickets
    v_tickets_created := public.create_tickets_for_service_request(
      v_request.id,
      v_request.customer_name,
      v_request.customer_email,
      v_request.customer_phone,
      v_request.issue_description,
      v_request.tracking_token,
      v_request.reviewed_by_id
    );

    RAISE NOTICE 'Service Request % (%) created % tickets',
      v_request_id, v_request.tracking_token, v_tickets_created;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_update_service_request_on_workflow_complete() IS
  'Automatically creates tickets when all workflow tasks for a service request are completed AND products have been received (receipt_status = received). Calls create_tickets_for_service_request() directly instead of relying on trigger chain. Supports requests in submitted, pickingup, or received status.';

-- Recreate trigger
CREATE TRIGGER trigger_auto_update_request_on_workflow_complete
  AFTER UPDATE OF status ON public.entity_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.entity_type = 'service_request')
  EXECUTE FUNCTION public.auto_update_service_request_on_workflow_complete();

-- =====================================================
-- Migration Notes:
-- =====================================================
-- BEFORE: Workflow complete → Create tickets (ignores receipt_status)
-- AFTER:  Workflow complete + receipt_status = 'received' → Create tickets
--
-- Example Scenario (Walk-in with inspection workflow):
-- 1. Create SR with receipt_status = 'received' + workflow_id
-- 2. Complete Task 1, 2, 3
-- 3. Task 3 complete → Trigger fires
-- 4. Check receipt_status = 'received' ✅
-- 5. Create tickets → status = 'processing'
--
-- Example Scenario (Pickup service with inspection workflow):
-- 1. Create SR with receipt_status = 'pending_receipt' + workflow_id
-- 2. Complete Task 1, 2, 3
-- 3. Task 3 complete → Trigger fires
-- 4. Check receipt_status = 'pending_receipt' ❌
-- 5. SKIP ticket creation → Log notice
-- 6. Later: Staff updates receipt_status → 'received'
-- 7. auto_create_tickets_on_received() trigger fires
-- 8. Check workflow complete ✅
-- 9. Create tickets → status = 'processing'
-- =====================================================
