BEGIN;

ALTER TABLE public.service_requests
  RENAME COLUMN preferred_delivery_method TO delivery_method;

ALTER TABLE public.service_requests
  ALTER COLUMN delivery_method SET DEFAULT 'pickup'::public.delivery_method,
  ALTER COLUMN delivery_method SET NOT NULL;

COMMENT ON COLUMN public.service_requests.delivery_method IS 'Customer preferred method for handling product intake (pickup or delivery)';

COMMIT;
