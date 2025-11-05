BEGIN;

ALTER TABLE public.service_requests
  DROP COLUMN IF EXISTS delivery_method;

COMMIT;
