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
  reviewed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_at TIMESTAMPTZ,
  submitted_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_requests_rejected_requires_reason CHECK (status != 'cancelled' OR rejection_reason IS NOT NULL)
);

COMMENT ON TABLE public.service_requests IS 'Public service request submissions from customer portal (1:N with service_request_items)';
COMMENT ON COLUMN public.service_requests.issue_description IS 'General issue description for the entire request (specific issues per product in service_request_items)';
COMMENT ON COLUMN public.service_requests.receipt_status IS 'Whether products have been received from customer (triggers ticket creation)';
COMMENT ON COLUMN public.service_requests.delivery_method IS 'Customer preference for product delivery (pickup or delivery)';
COMMENT ON COLUMN public.service_requests.delivery_address IS 'Delivery address if delivery_method is delivery';

-- =====================================================
-- AUTO-CREATE TICKETS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_create_tickets_on_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_customer_id UUID;
  v_product_id UUID;
  v_ticket_id UUID;
  v_item RECORD;
BEGIN
  -- Trigger when receipt_status changes to 'received' OR status changes to 'received'
  IF (NEW.receipt_status = 'received' AND (OLD.receipt_status IS NULL OR OLD.receipt_status = 'pending_receipt'))
     OR (NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status IN ('submitted', 'pickingup'))) THEN

    -- Find or create customer (lookup by phone first, as it's unique)
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE phone = NEW.customer_phone
    LIMIT 1;

    -- If customer exists, update name/email if changed
    IF v_customer_id IS NOT NULL THEN
      UPDATE public.customers
      SET
        name = NEW.customer_name,
        email = COALESCE(NEW.customer_email, email),
        updated_at = NOW()
      WHERE id = v_customer_id
        AND (name != NEW.customer_name OR email IS DISTINCT FROM NEW.customer_email);
    ELSE
      -- Customer doesn't exist, create new one
      INSERT INTO public.customers (
        name,
        email,
        phone,
        created_by
      ) VALUES (
        NEW.customer_name,
        NEW.customer_email,
        NEW.customer_phone,
        NEW.reviewed_by_id
      )
      RETURNING id INTO v_customer_id;
    END IF;

    -- Create a ticket for each item in the request
    FOR v_item IN
      SELECT * FROM public.service_request_items
      WHERE request_id = NEW.id AND ticket_id IS NULL
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
        COALESCE(v_item.issue_description, NEW.issue_description),
        'pending',
        NEW.id,
        NEW.reviewed_by_id
      )
      RETURNING id INTO v_ticket_id;

      -- Link ticket back to item
      UPDATE public.service_request_items
      SET ticket_id = v_ticket_id
      WHERE id = v_item.id;

      -- Add initial comment
      -- If reviewed_by_id is NULL, it's from customer (public submission)
      INSERT INTO public.service_ticket_comments (
        ticket_id,
        comment,
        created_by
      ) VALUES (
        v_ticket_id,
        CASE
          WHEN NEW.reviewed_by_id IS NULL THEN
            format('Yêu cầu từ khách hàng %s - Mã theo dõi: %s - Serial: %s',
              NEW.customer_name,
              NEW.tracking_token,
              v_item.serial_number
            )
          ELSE
            format('Auto-created from service request %s - Serial: %s',
              NEW.tracking_token,
              v_item.serial_number
            )
        END,
        NEW.reviewed_by_id
      );

    END LOOP;

    -- Update request status to processing
    NEW.status := 'processing';
    NEW.converted_at := NOW();

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_create_tickets_on_received() IS 'Auto-creates service tickets for each item when receipt_status or status changes to received. Lookups customer by phone (unique) and updates info if needed. Uses customer name in comment when created_by is NULL (public submission).';

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
