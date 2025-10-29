-- =====================================================
-- Migration: Service Request Multiple Products Support
-- Date: 2025-10-29
-- Description:
--   - Add service_request_items table for 1:N relationship
--   - Auto-create tickets when status changes to 'received'
--   - Support multiple products per service request
-- =====================================================

-- =====================================================
-- 1. CREATE service_request_items TABLE
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

CREATE TRIGGER trigger_service_request_items_updated_at
  BEFORE UPDATE ON public.service_request_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2. DROP DEPENDENT VIEWS
-- =====================================================
DROP VIEW IF EXISTS public.v_service_request_summary CASCADE;

-- =====================================================
-- 3. MIGRATE EXISTING DATA
-- =====================================================
-- Move existing single-product data to service_request_items
INSERT INTO public.service_request_items (
  request_id,
  product_brand,
  product_model,
  serial_number,
  purchase_date,
  issue_description,
  issue_photos,
  ticket_id,
  created_at
)
SELECT
  id as request_id,
  product_brand,
  product_model,
  serial_number,
  purchase_date,
  issue_description,
  issue_photos,
  ticket_id,
  created_at
FROM public.service_requests
WHERE product_brand IS NOT NULL; -- Only migrate if product data exists

-- =====================================================
-- 4. DROP OLD COLUMNS FROM service_requests
-- =====================================================
-- Remove constraint that references ticket_id
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_converted_requires_ticket;

-- Drop old single-product columns
ALTER TABLE public.service_requests
  DROP COLUMN IF EXISTS product_brand,
  DROP COLUMN IF EXISTS product_model,
  DROP COLUMN IF EXISTS serial_number,
  DROP COLUMN IF EXISTS purchase_date,
  DROP COLUMN IF EXISTS ticket_id,
  DROP COLUMN IF EXISTS issue_photos; -- Will be in items now

-- Update issue_description comment
COMMENT ON COLUMN public.service_requests.issue_description IS 'General issue description for the entire request (specific issues per product in service_request_items)';

-- =====================================================
-- 4. CREATE FUNCTION: Auto-create tickets on 'received'
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

COMMENT ON FUNCTION public.auto_create_tickets_on_received() IS
  'Auto-creates service tickets for each item when request status changes to received';

-- =====================================================
-- 5. CREATE TRIGGER
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_create_tickets ON public.service_requests;

CREATE TRIGGER trigger_auto_create_tickets
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_tickets_on_received();

-- =====================================================
-- 6. CREATE FUNCTION: Auto-update request to completed
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_complete_service_request()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_complete_service_request() IS
  'Auto-completes service request when all its tickets are completed or cancelled';

-- =====================================================
-- 7. CREATE TRIGGER for auto-completion
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_complete_request ON public.service_tickets;

CREATE TRIGGER trigger_auto_complete_request
  AFTER UPDATE OF status ON public.service_tickets
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'cancelled'))
  EXECUTE FUNCTION public.auto_complete_service_request();

-- =====================================================
-- 8. RECREATE VIEW WITH NEW SCHEMA
-- =====================================================
CREATE OR REPLACE VIEW public.v_service_request_summary AS
SELECT
  sr.id,
  sr.tracking_token,
  sr.status,
  sr.customer_name,
  sr.customer_email,
  sr.customer_phone,
  sr.issue_description,
  sr.service_type,
  sr.delivery_method,
  sr.delivery_address,
  sr.reviewed_by_id,
  prof.full_name AS reviewed_by_name,
  sr.reviewed_at,
  sr.rejection_reason,
  sr.converted_at,
  sr.created_at AS submitted_at,
  sr.updated_at,
  -- Count items
  COUNT(sri.id) AS item_count,
  -- Count completed tickets
  COUNT(CASE WHEN st.status = 'completed' THEN 1 END) AS completed_tickets,
  -- Count total tickets
  COUNT(st.id) AS total_tickets,
  -- Time metrics
  CASE
    WHEN sr.reviewed_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (sr.reviewed_at - sr.created_at)) / 3600
    ELSE NULL
  END AS hours_to_review,
  CASE
    WHEN sr.converted_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (sr.converted_at - sr.created_at)) / 3600
    ELSE NULL
  END AS hours_to_conversion,
  sr.submitted_ip,
  sr.user_agent
FROM public.service_requests sr
LEFT JOIN public.profiles prof ON sr.reviewed_by_id = prof.id
LEFT JOIN public.service_request_items sri ON sr.id = sri.request_id
LEFT JOIN public.service_tickets st ON sri.ticket_id = st.id
GROUP BY sr.id, prof.full_name
ORDER BY sr.created_at DESC;

COMMENT ON VIEW public.v_service_request_summary IS 'Service requests with customer info, item count, ticket status, and time metrics (updated for 1:N relationship)';

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_request_items TO authenticated;
GRANT SELECT ON public.v_service_request_summary TO authenticated;
