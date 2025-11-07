-- Hướng dẫn:
--   psql <URL> -f supabase/scripts/check_service_data.sql
--   hoặc copy từng truy vấn để chạy thủ công trên môi trường thật trước khi gộp migration.

-- 1. physical_products: kiểm tra backfill kho ảo
SELECT COUNT(*) AS physical_products_missing_virtual_warehouse
FROM public.physical_products
WHERE virtual_warehouse_id IS NULL;

SELECT pp.id,
       pp.virtual_warehouse_type,
       vw.warehouse_type AS matched_type
FROM public.physical_products AS pp
LEFT JOIN public.virtual_warehouses AS vw
       ON vw.id = pp.virtual_warehouse_id
WHERE pp.virtual_warehouse_id IS NOT NULL
  AND vw.warehouse_type IS DISTINCT FROM pp.virtual_warehouse_type
LIMIT 50;

-- 2. service_requests: đảm bảo dữ liệu phù hợp constraint mới
SELECT delivery_method,
       COUNT(*) AS total_requests
FROM public.service_requests
GROUP BY delivery_method
ORDER BY delivery_method;

SELECT COUNT(*) AS delivery_without_address
FROM public.service_requests
WHERE delivery_method = 'delivery'::public.delivery_method
  AND delivery_address IS NULL;

SELECT receipt_status,
       COUNT(*) AS total_requests
FROM public.service_requests
GROUP BY receipt_status
ORDER BY receipt_status;

SELECT COUNT(*) AS requests_missing_issue_description
FROM public.service_requests
WHERE issue_description IS NULL;

SELECT COUNT(*) AS requests_missing_email
FROM public.service_requests
WHERE customer_email IS NULL;

-- 3. service_request_items: xác minh dữ liệu trước khi ép NOT NULL
SELECT COUNT(*) AS items_missing_issue_description
FROM public.service_request_items
WHERE issue_description IS NULL
   OR btrim(issue_description) = '';

SELECT COUNT(*) AS items_without_service_option
FROM public.service_request_items
WHERE service_option IS NULL;

SELECT jsonb_typeof(issue_photos) AS payload_type,
       COUNT(*) AS total_rows
FROM public.service_request_items
GROUP BY jsonb_typeof(issue_photos);

-- 4. Trigger auto_create_tickets_on_received: kiểm tra ticket/comment
SELECT sri.id AS item_id,
       sri.linked_ticket_id,
       st.status AS ticket_status,
       stc.created_by AS last_comment_actor
FROM public.service_request_items AS sri
LEFT JOIN public.service_tickets AS st
       ON st.id = sri.linked_ticket_id
LEFT JOIN LATERAL (
  SELECT created_by
  FROM public.service_ticket_comments
  WHERE ticket_id = sri.linked_ticket_id
  ORDER BY created_at DESC
  LIMIT 1
) AS stc ON TRUE
WHERE sri.linked_ticket_id IS NOT NULL
ORDER BY sri.updated_at DESC
LIMIT 50;

