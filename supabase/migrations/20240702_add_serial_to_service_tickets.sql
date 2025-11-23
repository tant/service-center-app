-- Add physical_product_id & serial_number to service_tickets
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS physical_product_id UUID REFERENCES public.physical_products(id),
  ADD COLUMN IF NOT EXISTS serial_number TEXT;

COMMENT ON COLUMN public.service_tickets.physical_product_id IS 'Link to concrete physical product (serial) used for this ticket';
COMMENT ON COLUMN public.service_tickets.serial_number IS 'Captured serial number for the product at ticket creation time';

CREATE INDEX IF NOT EXISTS idx_service_tickets_physical_product ON public.service_tickets(physical_product_id) WHERE physical_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_tickets_serial_number ON public.service_tickets(serial_number) WHERE serial_number IS NOT NULL;

-- Update create_tickets_for_service_request to persist serial + physical_product_id
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

  RAISE NOTICE 'Service Request % (%) created % tickets',
    p_request_id, p_tracking_token, v_tickets_created;

  RETURN v_tickets_created;
END;
$$;
