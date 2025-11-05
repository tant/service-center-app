BEGIN;

-- Drop deprecated review/audit columns
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_reviewed_by_id_fkey,
  DROP COLUMN IF EXISTS reviewed_by_id,
  DROP COLUMN IF EXISTS reviewed_at,
  DROP COLUMN IF EXISTS submitted_ip,
  DROP COLUMN IF EXISTS user_agent,
  DROP COLUMN IF EXISTS contact_notes;

-- Refresh auto ticket creation function without reviewer metadata
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
  IF (NEW.receipt_status = 'received' AND (OLD.receipt_status IS NULL OR OLD.receipt_status = 'pending_receipt'))
     OR (NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status IN ('submitted', 'pickingup'))) THEN

    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE phone = NEW.customer_phone
    LIMIT 1;

    IF v_customer_id IS NOT NULL THEN
      UPDATE public.customers
      SET
        name = NEW.customer_name,
        email = COALESCE(NEW.customer_email, email),
        updated_at = NOW()
      WHERE id = v_customer_id
        AND (name != NEW.customer_name OR email IS DISTINCT FROM NEW.customer_email);
    ELSE
      INSERT INTO public.customers (
        name,
        email,
        phone
      ) VALUES (
        NEW.customer_name,
        NEW.customer_email,
        NEW.customer_phone
      )
      RETURNING id INTO v_customer_id;
    END IF;

    FOR v_item IN
      SELECT * FROM public.service_request_items
      WHERE request_id = NEW.id AND linked_ticket_id IS NULL
    LOOP
      v_product_id := NULL;

      SELECT product_id INTO v_product_id
      FROM public.physical_products
      WHERE serial_number = v_item.serial_number
      LIMIT 1;

      IF v_product_id IS NULL THEN
        RAISE NOTICE 'Product not found for serial number: %', v_item.serial_number;
        CONTINUE;
      END IF;

      INSERT INTO public.service_tickets (
        customer_id,
        product_id,
        issue_description,
        status,
        request_id
      ) VALUES (
        v_customer_id,
        v_product_id,
        COALESCE(v_item.issue_description, NEW.issue_description),
        'pending',
        NEW.id
      )
      RETURNING id INTO v_ticket_id;

      UPDATE public.service_request_items
      SET linked_ticket_id = v_ticket_id
      WHERE id = v_item.id;

      INSERT INTO public.service_ticket_comments (
        ticket_id,
        comment,
        created_by
      ) VALUES (
        v_ticket_id,
        format('Auto-created from service request %s - Serial: %s',
          NEW.tracking_token,
          v_item.serial_number
        ),
        NULL
      );

    END LOOP;

    NEW.status := 'processing';
    NEW.converted_at := NOW();

  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
