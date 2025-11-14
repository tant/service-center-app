-- =====================================================
-- Migration: Fix nested UPDATE conflict in create_tickets_for_service_request
-- =====================================================
-- Date: 2025-11-14
-- Issue: "tuple to be updated was already modified by an operation triggered by the current command"
-- Root Cause: create_tickets_for_service_request() performs nested UPDATE
--            when called from BEFORE trigger, causing conflict with outer UPDATE
-- Fix: Remove nested UPDATE from function, let triggers handle status updates
-- =====================================================

-- =====================================================
-- STEP 1: Update create_tickets_for_service_request
-- Remove nested UPDATE, only create tickets
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_tickets_for_service_request(
  p_request_id UUID,
  p_customer_name VARCHAR,
  p_customer_email VARCHAR,
  p_customer_phone VARCHAR,
  p_issue_description TEXT,
  p_tracking_token VARCHAR,
  p_reviewed_by_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_customer_id UUID;
  v_product_id UUID;
  v_ticket_id UUID;
  v_item RECORD;
  v_tickets_created INT := 0;
BEGIN
  -- Find or create customer (lookup by phone first, as it's unique)
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE phone = p_customer_phone
  LIMIT 1;

  -- If customer exists, update name/email if changed
  IF v_customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET
      name = p_customer_name,
      email = COALESCE(p_customer_email, email),
      updated_at = NOW()
    WHERE id = v_customer_id
      AND (name != p_customer_name OR email IS DISTINCT FROM p_customer_email);
  ELSE
    -- Customer doesn't exist, create new one
    INSERT INTO public.customers (
      name,
      email,
      phone,
      created_by
    ) VALUES (
      p_customer_name,
      p_customer_email,
      p_customer_phone,
      p_reviewed_by_id
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- Create a ticket for each item in the request
  FOR v_item IN
    SELECT * FROM public.service_request_items
    WHERE request_id = p_request_id AND ticket_id IS NULL
  LOOP
    -- Find product_id from serial_number
    v_product_id := NULL;

    SELECT product_id INTO v_product_id
    FROM public.physical_products
    WHERE serial_number = v_item.serial_number
    LIMIT 1;

    -- Skip if product not found
    IF v_product_id IS NULL THEN
      RAISE NOTICE 'Product not found for serial number: %', v_item.serial_number;
      CONTINUE;
    END IF;

    -- Create service ticket
    INSERT INTO public.service_tickets (
      customer_id,
      product_id,
      issue_description,
      status,
      request_id,
      created_by
    ) VALUES (
      v_customer_id,
      v_product_id,
      COALESCE(v_item.issue_description, p_issue_description),
      'pending',
      p_request_id,
      p_reviewed_by_id
    )
    RETURNING id INTO v_ticket_id;

    -- Link ticket back to item
    UPDATE public.service_request_items
    SET ticket_id = v_ticket_id
    WHERE id = v_item.id;

    -- Copy task attachments from service request to ticket
    INSERT INTO public.service_ticket_attachments (
      ticket_id,
      file_name,
      file_path,
      file_type,
      file_size,
      description,
      created_by
    )
    SELECT
      v_ticket_id,
      ta.file_name,
      ta.file_path,
      ta.mime_type,
      ta.file_size_bytes,
      'Inherited from service request task: ' || et.name,
      ta.uploaded_by
    FROM public.task_attachments ta
    INNER JOIN public.entity_tasks et ON ta.task_id = et.id
    WHERE et.entity_type = 'service_request'
      AND et.entity_id = p_request_id
      AND ta.file_path IS NOT NULL;

    -- Add initial comment
    INSERT INTO public.service_ticket_comments (
      ticket_id,
      comment,
      created_by
    ) VALUES (
      v_ticket_id,
      CASE
        WHEN p_reviewed_by_id IS NULL THEN
          format('Yêu cầu từ khách hàng %s - Mã theo dõi: %s - Serial: %s',
            p_customer_name,
            p_tracking_token,
            v_item.serial_number
          )
        ELSE
          format('Auto-created from service request %s - Serial: %s',
            p_tracking_token,
            v_item.serial_number
          )
      END,
      p_reviewed_by_id
    );

    v_tickets_created := v_tickets_created + 1;

  END LOOP;

  -- =====================================================
  -- FIX: Removed nested UPDATE to avoid conflict
  -- =====================================================
  -- OLD CODE (caused conflict):
  -- UPDATE public.service_requests
  -- SET
  --   status = 'processing',
  --   converted_at = NOW()
  -- WHERE id = p_request_id;
  --
  -- NEW: Triggers will handle status updates:
  -- - BEFORE triggers modify NEW.status directly
  -- - AFTER triggers update separately (no conflict)
  -- =====================================================

  RAISE NOTICE 'Service Request % (%) created % tickets',
    p_request_id, p_tracking_token, v_tickets_created;

  RETURN v_tickets_created;
END;
$$;

COMMENT ON FUNCTION public.create_tickets_for_service_request(UUID, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, UUID) IS
  'Shared function to create service tickets from a service request. Creates customer (or updates if exists), creates tickets for each item, and copies attachments. Does NOT update request status - triggers handle that to avoid nested UPDATE conflicts. Returns number of tickets created.';

-- =====================================================
-- STEP 2: Update AFTER trigger to handle status update
-- =====================================================
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

  -- Check if products have been received
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

    -- =====================================================
    -- FIX: AFTER trigger must update status separately
    -- =====================================================
    -- Since this is an AFTER trigger, we cannot modify NEW
    -- We must perform a separate UPDATE here
    UPDATE public.service_requests
    SET
      status = 'processing',
      converted_at = NOW()
    WHERE id = v_request_id;

    RAISE NOTICE 'Service Request % (%) created % tickets and updated status to processing',
      v_request_id, v_request.tracking_token, v_tickets_created;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_update_service_request_on_workflow_complete() IS
  'Automatically creates tickets when all workflow tasks for a service request are completed AND products have been received (receipt_status = received). Since this is an AFTER trigger, it updates status via separate UPDATE statement. Supports requests in submitted, pickingup, or received status.';

-- =====================================================
-- Migration Notes:
-- =====================================================
-- BEFORE FIX:
-- - create_tickets_for_service_request() had nested UPDATE
-- - When called from BEFORE trigger → conflict with outer UPDATE
-- - Error: "tuple to be updated was already modified"
--
-- AFTER FIX:
-- - create_tickets_for_service_request() NO LONGER updates status
-- - BEFORE trigger: Sets NEW.status directly (no conflict)
-- - AFTER trigger: Performs separate UPDATE (no conflict)
--
-- Flow Example (Pickup Service + Workflow):
-- 1. Complete all workflow tasks
-- 2. Staff confirms receipt → API: UPDATE receipt_status = 'received'
-- 3. BEFORE trigger fires: auto_create_tickets_on_received()
--    - Calls create_tickets_for_service_request()
--    - Sets NEW.status = 'processing' ✅
--    - No conflict ✅
-- 4. Status updated successfully ✅
-- =====================================================
