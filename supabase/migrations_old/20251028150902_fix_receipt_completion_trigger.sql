set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.process_stock_receipt_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update product_warehouse_stock
    INSERT INTO product_warehouse_stock (
      product_id,
      virtual_warehouse_type,
      physical_warehouse_id,
      declared_quantity
    )
    SELECT
      sri.product_id,
      NEW.virtual_warehouse_type,
      NEW.physical_warehouse_id,
      sri.declared_quantity
    FROM stock_receipt_items sri
    WHERE sri.receipt_id = NEW.id
    ON CONFLICT (product_id, virtual_warehouse_type, physical_warehouse_id)
    DO UPDATE SET
      declared_quantity = product_warehouse_stock.declared_quantity + EXCLUDED.declared_quantity,
      updated_at = NOW();

    -- Create physical_products records for serials
    INSERT INTO physical_products (
      product_id,
      serial_number,
      condition,
      virtual_warehouse_type,
      physical_warehouse_id,
      warranty_start_date,
      warranty_months
    )
    SELECT
      sri.product_id,
      srs.serial_number,
      'new',
      NEW.virtual_warehouse_type,
      NEW.physical_warehouse_id,
      COALESCE(srs.warranty_start_date, sri.warranty_start_date),
      COALESCE(srs.warranty_months, sri.warranty_months)
    FROM stock_receipt_items sri
    JOIN stock_receipt_serials srs ON srs.receipt_item_id = sri.id
    WHERE sri.receipt_id = NEW.id
    ON CONFLICT (serial_number) DO NOTHING;

    -- Link serials to physical_products (FIXED)
    UPDATE stock_receipt_serials
    SET physical_product_id = pp.id
    FROM stock_receipt_items sri,
         physical_products pp
    WHERE stock_receipt_serials.receipt_item_id = sri.id
      AND sri.receipt_id = NEW.id
      AND pp.serial_number = stock_receipt_serials.serial_number
      AND stock_receipt_serials.physical_product_id IS NULL;

    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$function$
;


