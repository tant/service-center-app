-- =====================================================
-- 600_stock_triggers.sql
-- =====================================================
-- Stock Update Triggers
--
-- Triggers for automatic stock updates:
-- - Receipt approval → increment stock
-- - Issue approval → decrement stock
-- - Serial management (create/delete/update physical products)
--
-- ORDER: 600-699 (Triggers)
-- DEPENDENCIES: 204, 500
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: Update or create stock record
-- =====================================================

CREATE OR REPLACE FUNCTION public.upsert_product_stock(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity_delta INT
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Try to update existing row first
  UPDATE public.product_warehouse_stock
  SET
    declared_quantity = declared_quantity + p_quantity_delta,
    updated_at = NOW()
  WHERE product_id = p_product_id
    AND virtual_warehouse_id = p_warehouse_id;

  -- If no row was updated, insert a new one
  -- IMPORTANT: Use GREATEST to ensure initial insert is never negative
  -- (prevents check constraint violation on INSERT before ON CONFLICT is evaluated)
  IF NOT FOUND THEN
    INSERT INTO public.product_warehouse_stock (
      product_id,
      virtual_warehouse_id,
      declared_quantity,
      initial_stock_entry
    ) VALUES (
      p_product_id,
      p_warehouse_id,
      GREATEST(p_quantity_delta, 0),
      0
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.upsert_product_stock IS 'Update or create stock record with quantity delta';

-- =====================================================
-- RECEIPT APPROVAL: Increment stock
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_stock_on_receipt_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Only trigger when transitioning to approved status
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN

    -- Update stock for each item in the receipt
    FOR v_item IN
      SELECT product_id, declared_quantity
      FROM public.stock_receipt_items
      WHERE receipt_id = NEW.id
    LOOP
      -- Increment stock (declared_quantity can be negative for adjustments)
      PERFORM public.upsert_product_stock(
        v_item.product_id,
        NEW.virtual_warehouse_id,
        v_item.declared_quantity
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_stock_on_receipt_approval
  AFTER UPDATE ON public.stock_receipts
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION public.update_stock_on_receipt_approval();

COMMENT ON FUNCTION public.update_stock_on_receipt_approval IS 'Increment stock when receipt is approved';

-- =====================================================
-- SERIAL MANAGEMENT: Auto-create/update physical products
-- =====================================================

-- 1. RECEIPT SERIALS: Create physical product when serial is added
CREATE OR REPLACE FUNCTION public.create_physical_product_from_receipt_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
$$;

CREATE TRIGGER trigger_create_physical_product_from_receipt_serial
  BEFORE INSERT ON public.stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.create_physical_product_from_receipt_serial();

COMMENT ON FUNCTION public.create_physical_product_from_receipt_serial IS 'Create physical product when serial is added to receipt. If receipt already approved, also updates product_warehouse_stock.';

-- 2. ISSUE SERIALS: Delete physical product when issued
CREATE OR REPLACE FUNCTION public.delete_physical_product_on_issue()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
$$;

CREATE TRIGGER trigger_delete_physical_product_on_issue
  AFTER INSERT ON public.stock_issue_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_physical_product_on_issue();

COMMENT ON FUNCTION public.delete_physical_product_on_issue IS 'Delete physical product when issued out of warehouse. If issue already approved, also updates product_warehouse_stock.';

-- 3. TRANSFER SERIALS: Update warehouse location when transferred
CREATE OR REPLACE FUNCTION public.update_physical_product_warehouse_on_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
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

  -- ONLY update physical product location if transfer is already approved
  -- For draft/pending transfers, serials stay in source warehouse until approved
  IF v_transfer_status = 'approved' OR v_transfer_status = 'completed' THEN
    -- Update physical product location
    UPDATE public.physical_products
    SET
      previous_virtual_warehouse_id = v_from_warehouse_id,
      virtual_warehouse_id = v_to_warehouse_id,
      updated_at = NOW()
    WHERE id = NEW.physical_product_id;

    -- Update product_warehouse_stock for both warehouses
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
$$;

CREATE TRIGGER trigger_update_physical_product_warehouse_on_transfer
  AFTER INSERT ON public.stock_transfer_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_physical_product_warehouse_on_transfer();

COMMENT ON FUNCTION public.update_physical_product_warehouse_on_transfer IS 'Update physical product warehouse location when transferred. If transfer already approved, also updates product_warehouse_stock for both warehouses.';

-- =====================================================
-- ISSUE APPROVAL: Decrement stock
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_stock_on_issue_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Only trigger when transitioning to approved status
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN

    -- Update stock for each item in the issue
    FOR v_item IN
      SELECT product_id, quantity
      FROM public.stock_issue_items
      WHERE issue_id = NEW.id
    LOOP
      -- Decrement stock (multiply by -1, quantity can be negative for adjustments)
      PERFORM public.upsert_product_stock(
        v_item.product_id,
        NEW.virtual_warehouse_id,
        -1 * v_item.quantity
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_stock_on_issue_approval
  AFTER UPDATE ON public.stock_issues
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION public.update_stock_on_issue_approval();

COMMENT ON FUNCTION public.update_stock_on_issue_approval IS 'Decrement stock when issue is approved';

-- =====================================================
-- TRANSFER APPROVAL: Update stock and move serials
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_stock_on_transfer_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_serial RECORD;
BEGIN
  -- Only trigger when transitioning to approved status
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN

    -- Move serials and update stock for each serial in the transfer
    FOR v_serial IN
      SELECT
        sti.product_id,
        sts.physical_product_id
      FROM public.stock_transfer_items sti
      JOIN public.stock_transfer_serials sts ON sts.transfer_item_id = sti.id
      WHERE sti.transfer_id = NEW.id
    LOOP
      -- Move the physical product to destination warehouse
      UPDATE public.physical_products
      SET
        previous_virtual_warehouse_id = OLD.from_virtual_warehouse_id,
        virtual_warehouse_id = NEW.to_virtual_warehouse_id,
        updated_at = NOW()
      WHERE id = v_serial.physical_product_id;

      -- Decrement from source warehouse
      PERFORM public.upsert_product_stock(
        v_serial.product_id,
        OLD.from_virtual_warehouse_id,
        -1
      );

      -- Increment to destination warehouse
      PERFORM public.upsert_product_stock(
        v_serial.product_id,
        NEW.to_virtual_warehouse_id,
        1
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_stock_on_transfer_approval
  AFTER UPDATE ON public.stock_transfers
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION public.update_stock_on_transfer_approval();

COMMENT ON FUNCTION public.update_stock_on_transfer_approval IS 'Update stock counts when transfer is approved - decrements source warehouse and increments destination warehouse for all serials in the transfer';

-- =====================================================
-- NOTES
-- =====================================================

-- Transfers stock updates (FIXED 2025-11-05):
-- 1. When serials are selected for DRAFT/PENDING transfer: serials stay in source warehouse (virtual_warehouse_id NOT changed)
-- 2. When transfer is APPROVED: trigger_update_stock_on_transfer_approval:
--    a. Moves serials from source to destination (updates virtual_warehouse_id)
--    b. Decrements stock from source warehouse
--    c. Increments stock to destination warehouse
-- 3. If serials are added AFTER approval: they are immediately moved and stock is updated (trigger_update_physical_product_warehouse_on_transfer)
