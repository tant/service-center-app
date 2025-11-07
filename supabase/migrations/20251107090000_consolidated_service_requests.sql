-- Ensure service requests support draft submissions
ALTER TYPE public.request_status
ADD VALUE IF NOT EXISTS 'draft' BEFORE 'submitted';

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'receipt_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.receipt_status AS ENUM (
      'received',
      'pending_receipt'
    );
    COMMENT ON TYPE public.receipt_status IS 'Product receipt status: received (create tickets) or pending_receipt (wait for product)';
    GRANT USAGE ON TYPE public.receipt_status TO authenticated;
  END IF;
END;
$$;

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS preferred_schedule date,
  ADD COLUMN IF NOT EXISTS pickup_notes text,
  ADD COLUMN IF NOT EXISTS delivery_method public.delivery_method,
  ADD COLUMN IF NOT EXISTS receipt_status public.receipt_status;

UPDATE public.service_requests
SET delivery_method = 'pickup'::public.delivery_method
WHERE delivery_method IS NULL;

ALTER TABLE public.service_requests
  ALTER COLUMN delivery_method SET DEFAULT 'pickup'::public.delivery_method,
  ALTER COLUMN delivery_method SET NOT NULL;

UPDATE public.service_requests
SET receipt_status = 'received'::public.receipt_status
WHERE receipt_status IS NULL;

ALTER TABLE public.service_requests
  ALTER COLUMN receipt_status SET DEFAULT 'received'::public.receipt_status,
  ALTER COLUMN receipt_status SET NOT NULL,
  ALTER COLUMN issue_description DROP NOT NULL,
  ALTER COLUMN customer_email DROP NOT NULL;

ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_reviewed_by_id_fkey,
  DROP COLUMN IF EXISTS reviewed_by_id,
  DROP COLUMN IF EXISTS reviewed_at,
  DROP COLUMN IF EXISTS submitted_ip,
  DROP COLUMN IF EXISTS user_agent,
  DROP COLUMN IF EXISTS contact_notes;

ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_delivery_requires_address;

ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_delivery_requires_address
  CHECK (
    (delivery_method <> 'delivery'::public.delivery_method)
    OR (delivery_address IS NOT NULL)
  );

COMMENT ON COLUMN public.service_requests.delivery_address IS 'Customer delivery address when delivery_method = delivery';
COMMENT ON COLUMN public.service_requests.preferred_schedule IS 'Requested date for pickup/delivery if applicable';
COMMENT ON COLUMN public.service_requests.pickup_notes IS 'Additional notes when customer drops off the product';
COMMENT ON COLUMN public.service_requests.delivery_method IS 'Customer preferred method for handling product intake (pickup or delivery)';
COMMENT ON COLUMN public.service_requests.receipt_status IS 'Whether products have been received from customer (triggers ticket creation)';

ALTER TABLE public.service_request_items
  ADD COLUMN IF NOT EXISTS service_option public.service_type;

UPDATE public.service_request_items
SET service_option = 'warranty'::public.service_type
WHERE service_option IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_request_items'
      AND column_name = 'linked_ticket_id'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_request_items'
      AND column_name = 'ticket_id'
  ) THEN
    ALTER TABLE public.service_request_items
      RENAME COLUMN ticket_id TO linked_ticket_id;
  ELSE
    ALTER TABLE public.service_request_items
      ADD COLUMN linked_ticket_id uuid;
  END IF;
END;
$$;

ALTER TABLE public.service_request_items
  ALTER COLUMN service_option SET DEFAULT 'warranty'::public.service_type,
  ALTER COLUMN service_option SET NOT NULL;

UPDATE public.service_request_items AS sri
SET issue_photos = COALESCE(subquery.new_issue_photos, '[]'::jsonb)
FROM (
  SELECT
    id,
    (
      SELECT jsonb_agg(
        CASE
          WHEN jsonb_typeof(value) = 'object' THEN value
          WHEN jsonb_typeof(value) = 'string' THEN jsonb_build_object('path', value)
          ELSE jsonb_build_object('path', NULL)
        END
      )
      FROM jsonb_array_elements(COALESCE(issue_photos, '[]'::jsonb)) AS value
    ) AS new_issue_photos
  FROM public.service_request_items
) AS subquery
WHERE sri.id = subquery.id;

ALTER TABLE public.service_request_items
  ALTER COLUMN issue_photos SET DEFAULT '[]'::jsonb;

UPDATE public.service_request_items
SET issue_description = ''
WHERE issue_description IS NULL;

ALTER TABLE public.service_request_items
  ALTER COLUMN issue_description SET NOT NULL;

ALTER TABLE public.service_request_items
  DROP COLUMN IF EXISTS purchase_date,
  DROP COLUMN IF EXISTS product_brand,
  DROP COLUMN IF EXISTS product_model;

ALTER TABLE public.service_request_items
  DROP CONSTRAINT IF EXISTS service_request_items_ticket_id_fkey;

ALTER TABLE public.service_request_items
  ADD CONSTRAINT service_request_items_linked_ticket_id_fkey
  FOREIGN KEY (linked_ticket_id) REFERENCES public.service_tickets (id) ON DELETE SET NULL;

DROP INDEX IF EXISTS idx_service_request_items_ticket_id;
CREATE INDEX IF NOT EXISTS idx_service_request_items_linked_ticket_id
  ON public.service_request_items (linked_ticket_id);

COMMENT ON COLUMN public.service_request_items.linked_ticket_id IS 'Links to the service ticket created for this specific product';
COMMENT ON COLUMN public.service_request_items.issue_photos IS 'Array of attachment metadata for the product issue (path, file info)';
COMMENT ON COLUMN public.service_request_items.service_option IS 'Selected service handling option for the specific product';

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
        '00000000-0000-4000-8000-000000000000'
      );
    END LOOP;

    NEW.status := 'processing';
    NEW.converted_at := NOW();

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_create_tickets_on_received() IS 'Auto-creates service tickets for each item when receipt_status or status changes to received. Uses the system service account for auto-generated ticket comments.';

COMMIT;
