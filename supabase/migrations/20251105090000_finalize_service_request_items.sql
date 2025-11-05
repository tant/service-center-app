BEGIN;

-- Ensure issue descriptions are populated before enforcing NOT NULL
UPDATE public.service_request_items
SET issue_description = ''
WHERE issue_description IS NULL;

ALTER TABLE public.service_request_items
  ALTER COLUMN issue_description SET NOT NULL;

-- Rename ticket link column to the new convention
ALTER TABLE public.service_request_items
  RENAME COLUMN ticket_id TO linked_ticket_id;

ALTER TABLE public.service_request_items
  RENAME CONSTRAINT service_request_items_ticket_id_fkey
  TO service_request_items_linked_ticket_id_fkey;

-- Remove deprecated columns
ALTER TABLE public.service_request_items
  DROP COLUMN IF EXISTS purchase_date,
  DROP COLUMN IF EXISTS product_brand,
  DROP COLUMN IF EXISTS product_model;

-- Recreate index for the renamed column
DROP INDEX IF EXISTS idx_service_request_items_ticket_id;
CREATE INDEX IF NOT EXISTS idx_service_request_items_linked_ticket_id
  ON public.service_request_items(linked_ticket_id);

COMMENT ON COLUMN public.service_request_items.linked_ticket_id IS 'Links to the service ticket created for this specific product';

COMMIT;
