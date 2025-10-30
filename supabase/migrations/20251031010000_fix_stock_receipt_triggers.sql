BEGIN;

CREATE OR REPLACE FUNCTION public.generate_issue_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.issue_number IS NULL THEN
    NEW.issue_number := 'PX-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('public.issue_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'PN-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('public.receipt_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_transfer_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.transfer_number IS NULL THEN
    NEW.transfer_number := 'PC-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('public.transfer_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_physical_product_from_receipt_serial()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_product_id UUID;
  v_virtual_warehouse_id UUID;
  v_physical_product_id UUID;
BEGIN
  SELECT
    sri.product_id,
    sr.virtual_warehouse_id
  INTO
    v_product_id,
    v_virtual_warehouse_id
  FROM public.stock_receipt_items sri
  JOIN public.stock_receipts sr ON sri.receipt_id = sr.id
  WHERE sri.id = NEW.receipt_item_id;

  INSERT INTO public.physical_products (
    product_id,
    serial_number,
    virtual_warehouse_id,
    condition,
    manufacturer_warranty_end_date,
    user_warranty_end_date
  ) VALUES (
    v_product_id,
    NEW.serial_number,
    v_virtual_warehouse_id,
    'new',
    NEW.manufacturer_warranty_end_date,
    NEW.user_warranty_end_date
  )
  RETURNING id INTO v_physical_product_id;

  NEW.physical_product_id := v_physical_product_id;

  RETURN NEW;
END;
$function$;

COMMIT;
