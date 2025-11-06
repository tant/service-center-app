alter table "public"."stock_document_attachments" drop constraint "stock_document_attachments_type_check";

alter table "public"."stock_document_attachments" add constraint "stock_document_attachments_type_check" CHECK (((document_type)::text = ANY ((ARRAY['receipt'::character varying, 'issue'::character varying, 'transfer'::character varying])::text[]))) not valid;

alter table "public"."stock_document_attachments" validate constraint "stock_document_attachments_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_create_tickets_on_received()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_customer_id UUID;
  v_product_id UUID;
  v_ticket_id UUID;
  v_item RECORD;
  v_has_workflow BOOLEAN;
  v_workflow_completed BOOLEAN;
  v_task_count INT;
  v_completed_count INT;
BEGIN
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

      -- Copy task attachments from service request to ticket
      -- This inherits photos and documents from inspection workflow
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
        AND et.entity_id = NEW.id
        AND ta.file_path IS NOT NULL;

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
$function$
;


