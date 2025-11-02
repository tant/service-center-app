alter table "public"."stock_document_attachments" drop constraint "stock_document_attachments_type_check";

alter table "public"."stock_document_attachments" add constraint "stock_document_attachments_type_check" CHECK (((document_type)::text = ANY ((ARRAY['receipt'::character varying, 'issue'::character varying, 'transfer'::character varying])::text[]))) not valid;

alter table "public"."stock_document_attachments" validate constraint "stock_document_attachments_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_physical_product_from_receipt_serial()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_product_id UUID;
  v_virtual_warehouse_id UUID;
  v_physical_product_id UUID;
  v_receipt_status TEXT;
BEGIN
  -- Get product_id, virtual_warehouse_id, and receipt status
  SELECT
    sri.product_id,
    sr.virtual_warehouse_id,
    sr.status
  INTO
    v_product_id,
    v_virtual_warehouse_id,
    v_receipt_status
  FROM public.stock_receipt_items sri
  JOIN public.stock_receipts sr ON sri.receipt_id = sr.id
  WHERE sri.id = NEW.receipt_item_id;

  -- Create physical product
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

  -- Update serial record with physical_product_id
  NEW.physical_product_id := v_physical_product_id;

  -- If receipt is already approved, update product_warehouse_stock
  -- This handles serials added AFTER approval (non-blocking workflow)
  IF v_receipt_status = 'approved' OR v_receipt_status = 'completed' THEN
    PERFORM public.upsert_product_stock(
      v_product_id,
      v_virtual_warehouse_id,
      1  -- Increment by 1 for each serial added
    );
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_physical_product_on_issue()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_product_id UUID;
  v_virtual_warehouse_id UUID;
  v_issue_status TEXT;
BEGIN
  -- Get product info before deletion
  SELECT
    pp.product_id,
    pp.virtual_warehouse_id
  INTO
    v_product_id,
    v_virtual_warehouse_id
  FROM public.physical_products pp
  WHERE pp.id = NEW.physical_product_id;

  -- Get issue status
  SELECT si.status INTO v_issue_status
  FROM public.stock_issue_items sii
  JOIN public.stock_issues si ON sii.issue_id = si.id
  WHERE sii.id = NEW.issue_item_id;

  -- Delete the physical product (it's being issued out)
  DELETE FROM public.physical_products
  WHERE id = NEW.physical_product_id;

  -- If issue is already approved, update product_warehouse_stock
  -- This handles serials added AFTER approval (non-blocking workflow)
  IF v_issue_status = 'approved' OR v_issue_status = 'completed' THEN
    PERFORM public.upsert_product_stock(
      v_product_id,
      v_virtual_warehouse_id,
      -1  -- Decrement by 1 for each serial issued
    );
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_physical_product_warehouse_on_transfer()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_from_warehouse_id UUID;
  v_to_warehouse_id UUID;
  v_product_id UUID;
  v_transfer_status TEXT;
BEGIN
  -- Get source and destination warehouse IDs and transfer status
  SELECT
    st.from_virtual_warehouse_id,
    st.to_virtual_warehouse_id,
    st.status,
    sti.product_id
  INTO
    v_from_warehouse_id,
    v_to_warehouse_id,
    v_transfer_status,
    v_product_id
  FROM public.stock_transfer_items sti
  JOIN public.stock_transfers st ON sti.transfer_id = st.id
  WHERE sti.id = NEW.transfer_item_id;

  -- Update physical product location
  UPDATE public.physical_products
  SET
    previous_virtual_warehouse_id = v_from_warehouse_id,
    virtual_warehouse_id = v_to_warehouse_id,
    updated_at = NOW()
  WHERE id = NEW.physical_product_id;

  -- If transfer is already approved, update product_warehouse_stock for both warehouses
  -- This handles serials added AFTER approval (non-blocking workflow)
  IF v_transfer_status = 'approved' OR v_transfer_status = 'completed' THEN
    -- Decrement from source warehouse
    PERFORM public.upsert_product_stock(
      v_product_id,
      v_from_warehouse_id,
      -1
    );

    -- Increment to destination warehouse
    PERFORM public.upsert_product_stock(
      v_product_id,
      v_to_warehouse_id,
      1
    );
  END IF;

  RETURN NEW;
END;
$function$
;


