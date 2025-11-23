-- =====================================================
-- 203_service_requests.sql
-- =====================================================
-- Service Request Portal and Email Notifications
--
-- Tables for:
-- - Public service request submissions
-- - Service request items (1:N with requests)
-- - Email notification tracking
-- - Auto-ticket creation workflows
--
-- ORDER: 200-299 (Tables)
-- DEPENDENCIES: 100, 150, 200, 201, 202
-- NOTE: FK constraints for service_tickets will be added in 301
-- =====================================================
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token VARCHAR(15) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  issue_description TEXT NOT NULL,
  status public.request_status NOT NULL DEFAULT 'submitted',
  receipt_status public.receipt_status NOT NULL DEFAULT 'received',
  delivery_method public.delivery_method,
  delivery_address TEXT,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  reviewed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  converted_at TIMESTAMPTZ,
  submitted_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_requests_cancelled_requires_reason CHECK (status != 'cancelled' OR cancellation_reason IS NOT NULL)
);

COMMENT ON TABLE public.service_requests IS 'Public service request submissions from customer portal (1:N with service_request_items)';
COMMENT ON COLUMN public.service_requests.issue_description IS 'General issue description for the entire request (specific issues per product in service_request_items)';
COMMENT ON COLUMN public.service_requests.receipt_status IS 'Whether products have been received from customer (triggers ticket creation)';
COMMENT ON COLUMN public.service_requests.delivery_method IS 'Customer preference for product delivery (pickup or delivery)';
COMMENT ON COLUMN public.service_requests.delivery_address IS 'Delivery address if delivery_method is delivery';
COMMENT ON COLUMN public.service_requests.workflow_id IS 'Optional workflow for inspection tasks before ticket creation. When set, tasks are created from workflow and tickets are only created after all workflow tasks are completed. NULL means immediate ticket creation (default behavior).';
COMMENT ON COLUMN public.service_requests.cancellation_reason IS 'Reason for cancellation (required when status = cancelled). Can be staff rejection, customer withdrawal, duplicate request, etc.';

-- =====================================================
-- SHARED FUNCTION: CREATE TICKETS FOR SERVICE REQUEST
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
  v_physical_product_id UUID;
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
    -- Find product_id and physical_product_id from serial_number
    v_product_id := NULL;
    v_physical_product_id := NULL;

    SELECT id, product_id
    INTO v_physical_product_id, v_product_id
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
      physical_product_id,
      serial_number,
      issue_description,
      status,
      request_id,
      created_by
    ) VALUES (
      v_customer_id,
      v_product_id,
      v_physical_product_id,
      v_item.serial_number,
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
-- AUTO-CREATE TICKETS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_create_tickets_on_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_has_workflow BOOLEAN;
  v_workflow_completed BOOLEAN;
  v_task_count INT;
  v_completed_count INT;
  v_tickets_created INT;
BEGIN
  -- Skip trigger if status is 'draft' (draft requests should not auto-create tickets)
  IF NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;

  -- Trigger when receipt_status changes to 'received' OR status changes to 'received'
  IF (NEW.receipt_status = 'received' AND (OLD.receipt_status IS NULL OR OLD.receipt_status = 'pending_receipt'))
     OR (NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status IN ('submitted', 'pickingup'))) THEN

    -- ====== WORKFLOW COMPLETION CHECK ======
    -- Check if service request has a workflow assigned
    v_has_workflow := (NEW.workflow_id IS NOT NULL);

    IF v_has_workflow THEN
      -- Count total tasks for this service request
      SELECT COUNT(*) INTO v_task_count
      FROM public.entity_tasks
      WHERE entity_type = 'service_request'
        AND entity_id = NEW.id;

      -- Count completed tasks
      SELECT COUNT(*) INTO v_completed_count
      FROM public.entity_tasks
      WHERE entity_type = 'service_request'
        AND entity_id = NEW.id
        AND status = 'completed';

      -- Check if all tasks are completed
      v_workflow_completed := (v_task_count > 0 AND v_task_count = v_completed_count);

      -- If workflow exists but not all tasks complete, skip ticket creation
      IF NOT v_workflow_completed THEN
        RAISE NOTICE 'Service Request % (%) has workflow - waiting for % tasks to complete (% done)',
          NEW.id, NEW.tracking_token, v_task_count, v_completed_count;
        RETURN NEW;
      END IF;

      RAISE NOTICE 'Service Request % (%) workflow complete, creating tickets',
        NEW.id, NEW.tracking_token;
    END IF;
    -- ====== END WORKFLOW CHECK ======

    -- Call shared function to create tickets
    v_tickets_created := public.create_tickets_for_service_request(
      NEW.id,
      NEW.customer_name,
      NEW.customer_email,
      NEW.customer_phone,
      NEW.issue_description,
      NEW.tracking_token,
      NEW.reviewed_by_id
    );

    -- Function already updates status, but we need to update NEW for BEFORE trigger
    NEW.status := 'processing';
    NEW.converted_at := NOW();

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_create_tickets_on_received() IS 'Auto-creates service tickets for each item when receipt_status or status changes to received. If workflow_id exists, delays ticket creation until all workflow tasks are completed. Lookups customer by phone (unique) and updates info if needed. Uses customer name in comment when created_by is NULL (public submission).';

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER trigger_generate_service_request_tracking_token BEFORE INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_token();
CREATE TRIGGER trigger_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_auto_create_tickets BEFORE INSERT OR UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.auto_create_tickets_on_received();

-- =====================================================
-- SERVICE REQUEST ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  serial_number VARCHAR(255) NOT NULL,
  issue_description TEXT,
  issue_photos JSONB DEFAULT '[]'::jsonb,
  ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_request_items_serial_format CHECK (length(serial_number) >= 5)
);

CREATE INDEX idx_service_request_items_request_id ON public.service_request_items(request_id);
CREATE INDEX idx_service_request_items_serial_number ON public.service_request_items(serial_number);
CREATE INDEX idx_service_request_items_ticket_id ON public.service_request_items(ticket_id);

COMMENT ON TABLE public.service_request_items IS 'Individual products within a service request (1:N relationship)';
COMMENT ON COLUMN public.service_request_items.ticket_id IS 'Links to the service ticket created for this specific product';

CREATE TRIGGER trigger_service_request_items_updated_at BEFORE UPDATE ON public.service_request_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- EMAIL NOTIFICATIONS TABLE (from 15_service_request_tables.sql)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  body_text TEXT,
  body_html TEXT,
  template_name VARCHAR(100),
  notification_type VARCHAR(100) NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.email_notifications IS 'Audit trail and delivery tracking for all email notifications';
CREATE TRIGGER trigger_email_notifications_updated_at BEFORE UPDATE ON public.email_notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- NOTE: Foreign key constraints moved to 301_foreign_key_constraints.sql
-- =====================================================
-- FK constraints for service_tickets.workflow_id and service_tickets.request_id
-- are added in 301_foreign_key_constraints.sql to maintain proper dependency order.

-- =====================================================
-- FUNCTION: Auto-complete service request when all tickets are done
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_complete_service_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_request_id UUID;
  v_all_completed BOOLEAN;
BEGIN
  -- Get the request_id from the ticket
  v_request_id := NEW.request_id;

  -- If ticket is not linked to a request, skip
  IF v_request_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if all tickets for this request are completed or cancelled
  SELECT bool_and(st.status IN ('completed', 'cancelled'))
  INTO v_all_completed
  FROM public.service_request_items sri
  LEFT JOIN public.service_tickets st ON st.id = sri.ticket_id
  WHERE sri.request_id = v_request_id;

  -- If all tickets are done, mark request as completed
  IF v_all_completed THEN
    UPDATE public.service_requests
    SET status = 'completed'
    WHERE id = v_request_id AND status != 'completed';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_complete_service_request() IS
  'Auto-completes service request when all its tickets are completed or cancelled';

-- =====================================================
-- TRIGGER: Auto-complete service request
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_complete_request ON public.service_tickets;

CREATE TRIGGER trigger_auto_complete_request
  AFTER UPDATE OF status ON public.service_tickets
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'cancelled'))
  EXECUTE FUNCTION public.auto_complete_service_request();

-- =====================================================
-- FUNCTION: Auto-trigger ticket creation when workflow completes
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
-- TRIGGER: Auto-trigger ticket creation on workflow completion
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_update_request_on_workflow_complete ON public.entity_tasks;

CREATE TRIGGER trigger_auto_update_request_on_workflow_complete
  AFTER UPDATE OF status ON public.entity_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.entity_type = 'service_request')
  EXECUTE FUNCTION public.auto_update_service_request_on_workflow_complete();
