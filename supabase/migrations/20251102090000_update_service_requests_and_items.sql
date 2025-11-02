BEGIN;

ALTER TABLE public.service_requests
  ADD COLUMN delivery_address text,
  ADD COLUMN preferred_schedule date,
  ADD COLUMN pickup_notes text,
  ADD COLUMN contact_notes text,
  ADD COLUMN preferred_delivery_method public.delivery_method DEFAULT 'pickup'::public.delivery_method;

UPDATE public.service_requests
SET preferred_delivery_method = COALESCE(preferred_delivery_method, 'pickup'::public.delivery_method);

ALTER TABLE public.service_requests
  ALTER COLUMN preferred_delivery_method SET NOT NULL,
  ALTER COLUMN issue_description DROP NOT NULL;

ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_delivery_requires_address
  CHECK ((preferred_delivery_method <> 'delivery'::public.delivery_method) OR (delivery_address IS NOT NULL));

COMMENT ON COLUMN public.service_requests.delivery_address IS 'Customer delivery address when delivery_method = delivery';
COMMENT ON COLUMN public.service_requests.preferred_schedule IS 'Requested date for pickup/delivery if applicable';
COMMENT ON COLUMN public.service_requests.pickup_notes IS 'Additional notes when customer drops off the product';
COMMENT ON COLUMN public.service_requests.contact_notes IS 'Preferred channel or extra contact information';

ALTER TABLE public.service_request_items
  ADD COLUMN product_brand text NOT NULL DEFAULT 'Unknown',
  ADD COLUMN product_model text NOT NULL DEFAULT 'Unknown',
  ADD COLUMN service_option public.service_type NOT NULL DEFAULT 'warranty'::public.service_type;

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
  ALTER COLUMN issue_photos SET DEFAULT '[]'::jsonb,
  ALTER COLUMN product_brand DROP DEFAULT,
  ALTER COLUMN product_brand DROP NOT NULL,
  ALTER COLUMN product_model DROP DEFAULT,
  ALTER COLUMN product_model DROP NOT NULL,
  ALTER COLUMN issue_description DROP NOT NULL;

COMMENT ON COLUMN public.service_request_items.product_brand IS 'Captured brand label for the requested product';
COMMENT ON COLUMN public.service_request_items.product_model IS 'Captured model name for the requested product';
COMMENT ON COLUMN public.service_request_items.issue_photos IS 'Array of attachment metadata for the product issue (path, file info)';
COMMENT ON COLUMN public.service_request_items.service_option IS 'Selected service handling option for the specific product';

COMMIT;
