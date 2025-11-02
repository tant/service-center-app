alter table "public"."stock_document_attachments" drop constraint "stock_document_attachments_type_check";

alter table "public"."stock_document_attachments" add constraint "stock_document_attachments_type_check" CHECK (((document_type)::text = ANY ((ARRAY['receipt'::character varying, 'issue'::character varying, 'transfer'::character varying])::text[]))) not valid;

alter table "public"."stock_document_attachments" validate constraint "stock_document_attachments_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_inventory_stats()
 RETURNS TABLE(total_skus bigint, total_declared bigint, total_actual bigint, critical_count bigint, warning_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT pws.product_id)::BIGINT AS total_skus,
    COALESCE(SUM(pws.declared_quantity), 0)::BIGINT AS total_declared,
    (SELECT COUNT(*)::BIGINT FROM public.physical_products) AS total_actual,
    COUNT(DISTINCT CASE
      WHEN (
        SELECT COUNT(*)::INTEGER
        FROM public.physical_products pp
        WHERE pp.product_id = pws.product_id
          AND pp.virtual_warehouse_id = pws.virtual_warehouse_id
      ) < (pws.declared_quantity * 0.1) THEN pws.id
    END)::BIGINT AS critical_count,
    COUNT(DISTINCT CASE
      WHEN (
        SELECT COUNT(*)::INTEGER
        FROM public.physical_products pp
        WHERE pp.product_id = pws.product_id
          AND pp.virtual_warehouse_id = pws.virtual_warehouse_id
      ) >= (pws.declared_quantity * 0.1)
      AND (
        SELECT COUNT(*)::INTEGER
        FROM public.physical_products pp
        WHERE pp.product_id = pws.product_id
          AND pp.virtual_warehouse_id = pws.virtual_warehouse_id
      ) < (pws.declared_quantity * 0.5) THEN pws.id
    END)::BIGINT AS warning_count
  FROM public.product_warehouse_stock pws;
END;
$function$
;


