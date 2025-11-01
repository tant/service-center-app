-- =====================================================
-- Migration: Add receipt_status and delivery info to service_requests
-- Date: 2025-11-01
-- Description:
--   - Add receipt_status enum and column (received/pending_receipt)
--   - Add delivery_method column (uses existing enum)
--   - Add delivery_address column
--   - Remove service_type if exists (moved to ticket level)
-- =====================================================

-- =====================================================
-- 1. CREATE RECEIPT_STATUS ENUM
-- =====================================================
DO $$ BEGIN
  CREATE TYPE public.receipt_status AS ENUM (
    'received',
    'pending_receipt'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE public.receipt_status IS 'Product receipt status: received (create tickets) or pending_receipt (wait for product)';

-- =====================================================
-- 2. ADD COLUMNS TO service_requests
-- =====================================================

-- Add receipt_status column (defaults to 'received' for backward compatibility)
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS receipt_status public.receipt_status NOT NULL DEFAULT 'received';

COMMENT ON COLUMN public.service_requests.receipt_status IS 'Whether products have been received from customer';

-- Add delivery_method column (nullable - can be set later)
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS delivery_method public.delivery_method;

COMMENT ON COLUMN public.service_requests.delivery_method IS 'Customer preference for product delivery (pickup or delivery)';

-- Add delivery_address column
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

COMMENT ON COLUMN public.service_requests.delivery_address IS 'Delivery address if delivery_method is delivery';

-- =====================================================
-- 3. REMOVE service_type IF EXISTS
-- =====================================================
-- Service type should be determined at ticket level after diagnosis
ALTER TABLE public.service_requests
DROP COLUMN IF EXISTS service_type;

-- =====================================================
-- 4. UPDATE AUTO-CREATE TICKETS TRIGGER
-- =====================================================
-- Modify trigger to check receipt_status instead of just status
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
        created_by_id
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
      INSERT INTO public.service_ticket_comments (
        ticket_id,
        comment,
        created_by_id
      ) VALUES (
        v_ticket_id,
        format('Auto-created from service request %s - Serial: %s',
          NEW.tracking_token,
          v_item.serial_number
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
$$;

COMMENT ON FUNCTION public.auto_create_tickets_on_received() IS 'Auto-creates service tickets for each item when receipt_status or status changes to received';

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON TYPE public.receipt_status TO authenticated;
GRANT USAGE ON TYPE public.receipt_status TO anon;

-- =====================================================
-- 6. DATA MIGRATION
-- =====================================================
-- Set receipt_status to 'received' for all existing records
-- (They already have status, so assume products were received)
UPDATE public.service_requests
SET receipt_status = 'received'
WHERE receipt_status IS NULL;
