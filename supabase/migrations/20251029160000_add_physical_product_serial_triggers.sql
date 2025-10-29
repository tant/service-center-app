-- =====================================================
-- Add triggers to manage physical products from serials
-- Date: 2025-10-29
-- =====================================================

-- =====================================================
-- SERIAL MANAGEMENT: Auto-create/update physical products
-- =====================================================

-- 1. RECEIPT SERIALS: Create physical product when serial is added
CREATE OR REPLACE FUNCTION public.create_physical_product_from_receipt_serial()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
  v_virtual_warehouse_id UUID;
  v_physical_product_id UUID;
BEGIN
  -- Get product_id and virtual_warehouse_id from receipt
  SELECT
    sri.product_id,
    sr.virtual_warehouse_id
  INTO
    v_product_id,
    v_virtual_warehouse_id
  FROM stock_receipt_items sri
  JOIN stock_receipts sr ON sri.receipt_id = sr.id
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_physical_product_from_receipt_serial
  BEFORE INSERT ON public.stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.create_physical_product_from_receipt_serial();

COMMENT ON FUNCTION public.create_physical_product_from_receipt_serial IS 'Create physical product immediately when serial is added to receipt';

-- 2. ISSUE SERIALS: Delete physical product when issued
CREATE OR REPLACE FUNCTION public.delete_physical_product_on_issue()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the physical product (it's being issued out)
  DELETE FROM public.physical_products
  WHERE id = NEW.physical_product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_physical_product_on_issue
  AFTER INSERT ON public.stock_issue_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_physical_product_on_issue();

COMMENT ON FUNCTION public.delete_physical_product_on_issue IS 'Delete physical product when issued out of warehouse';

-- 3. TRANSFER SERIALS: Update warehouse location when transferred
CREATE OR REPLACE FUNCTION public.update_physical_product_warehouse_on_transfer()
RETURNS TRIGGER AS $$
DECLARE
  v_from_warehouse_id UUID;
  v_to_warehouse_id UUID;
BEGIN
  -- Get source and destination warehouse IDs
  SELECT
    st.from_virtual_warehouse_id,
    st.to_virtual_warehouse_id
  INTO
    v_from_warehouse_id,
    v_to_warehouse_id
  FROM stock_transfer_items sti
  JOIN stock_transfers st ON sti.transfer_id = st.id
  WHERE sti.id = NEW.transfer_item_id;

  -- Update physical product location
  UPDATE public.physical_products
  SET
    previous_virtual_warehouse_id = v_from_warehouse_id,
    virtual_warehouse_id = v_to_warehouse_id,
    updated_at = NOW()
  WHERE id = NEW.physical_product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_physical_product_warehouse_on_transfer
  AFTER INSERT ON public.stock_transfer_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_physical_product_warehouse_on_transfer();

COMMENT ON FUNCTION public.update_physical_product_warehouse_on_transfer IS 'Update physical product warehouse location when transferred';

-- =====================================================
-- Verification
-- =====================================================

SELECT '✅ Physical product serial triggers created successfully' as result;
