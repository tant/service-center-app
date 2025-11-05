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
  ADD COLUMN IF NOT EXISTS receipt_status public.receipt_status;

UPDATE public.service_requests
SET receipt_status = 'received'::public.receipt_status
WHERE receipt_status IS NULL;

ALTER TABLE public.service_requests
  ALTER COLUMN receipt_status SET DEFAULT 'received'::public.receipt_status,
  ALTER COLUMN receipt_status SET NOT NULL,
  ALTER COLUMN customer_email DROP NOT NULL;

COMMENT ON COLUMN public.service_requests.receipt_status IS 'Whether products have been received from customer (triggers ticket creation)';

COMMIT;
