-- =====================================================
-- 05_service_requests.sql
-- =====================================================
-- Phase 2 tables for the public service request portal
-- and email notifications.
-- =====================================================

-- =====================================================
-- SERVICE REQUESTS TABLE (from 15_service_request_tables.sql)
-- Updated: 2025-10-29 - Support multiple products via service_request_items
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token VARCHAR(15) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  issue_description TEXT NOT NULL,
  service_type public.service_type NOT NULL DEFAULT 'warranty',
  delivery_method public.delivery_method NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  status public.request_status NOT NULL DEFAULT 'submitted',
  reviewed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_at TIMESTAMPTZ,
  submitted_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_requests_rejected_requires_reason CHECK (status != 'cancelled' OR rejection_reason IS NOT NULL),
  CONSTRAINT service_requests_delivery_requires_address CHECK (delivery_method != 'delivery' OR delivery_address IS NOT NULL)
);

COMMENT ON TABLE public.service_requests IS 'Public service request submissions from customer portal (1:N with service_request_items)';
COMMENT ON COLUMN public.service_requests.issue_description IS 'General issue description for the entire request (specific issues per product in service_request_items)';

-- =====================================================
-- AUTO-CREATE TICKETS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_create_tickets_on_received()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_product_id UUID;
  v_ticket_id UUID;
  v_item RECORD;
BEGIN
  -- Only trigger when status changes to 'received'
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status = 'submitted') THEN

    -- Find or create customer
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE email = NEW.customer_email
    LIMIT 1;

    -- If customer doesn't exist, create one
    IF v_customer_id IS NULL THEN
      INSERT INTO public.customers (
        name,
        email,
        phone,
        created_by_id
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

      IF v_item.serial_number IS NOT NULL THEN
        SELECT product_id INTO v_product_id
        FROM public.physical_products
        WHERE serial_number = v_item.serial_number
        LIMIT 1;
      END IF;

      -- If no physical product found, try to find by brand/model
      IF v_product_id IS NULL THEN
        SELECT p.id INTO v_product_id
        FROM public.products p
        JOIN public.brands b ON p.brand_id = b.id
        WHERE b.name ILIKE v_item.product_brand
          AND p.name ILIKE v_item.product_model
        LIMIT 1;
      END IF;

      -- Skip if product not found
      IF v_product_id IS NULL THEN
        RAISE NOTICE 'Product not found for item %: brand=%, model=%',
          v_item.id, v_item.product_brand, v_item.product_model;
        CONTINUE;
      END IF;

      -- Create service ticket
      INSERT INTO public.service_tickets (
        customer_id,
        product_id,
        issue_description,
        status,
        service_type,
        delivery_method,
        delivery_address,
        request_id,
        created_by_id
      ) VALUES (
        v_customer_id,
        v_product_id,
        COALESCE(v_item.issue_description, NEW.issue_description),
        'pending',
        NEW.service_type,
        NEW.delivery_method,
        NEW.delivery_address,
        NEW.id,
        NEW.reviewed_by_id
      )
      RETURNING id INTO v_ticket_id;

      -- Link ticket back to item
      UPDATE public.service_request_items
      SET ticket_id = v_ticket_id
      WHERE id = v_item.id;

      -- Add initial comment
      INSERT INTO public.service_ticket_comments (
        ticket_id,
        comment,
        created_by_id
      ) VALUES (
        v_ticket_id,
        format('Auto-created from service request %s - Product: %s %s (SN: %s)',
          NEW.tracking_token,
          v_item.product_brand,
          v_item.product_model,
          COALESCE(v_item.serial_number, 'N/A')
        ),
        NEW.reviewed_by_id
      );

    END LOOP;

    -- Update request status to processing
    NEW.status := 'processing';
    NEW.converted_at := NOW();

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_create_tickets_on_received() IS 'Auto-creates service tickets for each item when request status changes to received';

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER trigger_generate_service_request_tracking_token BEFORE INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_token();
CREATE TRIGGER trigger_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_auto_create_tickets BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.auto_create_tickets_on_received();

-- =====================================================
-- SERVICE REQUEST ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  product_brand VARCHAR(255) NOT NULL,
  product_model VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255),
  purchase_date DATE,
  issue_description TEXT,
  issue_photos JSONB DEFAULT '[]'::jsonb,
  ticket_id UUID REFERENCES public.service_tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_request_items_serial_format CHECK (serial_number IS NULL OR length(serial_number) >= 5)
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
-- ADD FOREIGN KEY CONSTRAINTS FROM 03_service_tickets.sql
-- =====================================================
-- These FK constraints reference tables created in 04 and 05,
-- so they must be added after those tables exist.

-- Add FK constraint for template_id (references task_templates from 04_task_and_warehouse.sql)
ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES public.task_templates(id)
  ON DELETE SET NULL;

-- Add FK constraint for request_id (references service_requests from this file)
ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_request_id_fkey
  FOREIGN KEY (request_id)
  REFERENCES public.service_requests(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT service_tickets_template_id_fkey ON public.service_tickets IS 'Links ticket to task template used for workflow';
COMMENT ON CONSTRAINT service_tickets_request_id_fkey ON public.service_tickets IS 'Links ticket to originating service request from public portal';
