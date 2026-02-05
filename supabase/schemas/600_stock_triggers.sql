-- =====================================================
-- 600_stock_triggers.sql
-- =====================================================
-- SIMPLIFIED Stock Update Triggers
--
-- All operations are immediate (no draft/approval workflow):
-- - Receipt serial insert → create physical product + update stock
-- - Issue serial insert → move product + update stock
-- - Transfer serial insert → move product + update stock
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
-- RECEIPT SERIAL: Create physical product immediately
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_physical_product_on_receipt_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_virtual_warehouse_id UUID;
  v_physical_product_id UUID;
  v_old_warehouse_id UUID;
  v_old_warehouse_type TEXT;
BEGIN
  -- Get info from receipt
  SELECT sri.product_id, sr.virtual_warehouse_id
  INTO v_product_id, v_virtual_warehouse_id
  FROM public.stock_receipt_items sri
  JOIN public.stock_receipts sr ON sri.receipt_id = sr.id
  WHERE sri.id = NEW.receipt_item_id;

  -- Check if physical product already exists for this serial
  SELECT id, virtual_warehouse_id
  INTO v_physical_product_id, v_old_warehouse_id
  FROM public.physical_products
  WHERE serial_number = NEW.serial_number;

  IF v_physical_product_id IS NOT NULL THEN
    -- Product exists (customer_return, rma_return, or adjustment)
    -- Update warehouse, status to active, and warranty dates
    UPDATE public.physical_products
    SET virtual_warehouse_id = v_virtual_warehouse_id,
        status = 'active',
        manufacturer_warranty_end_date = COALESCE(NEW.manufacturer_warranty_end_date, manufacturer_warranty_end_date),
        user_warranty_end_date = COALESCE(NEW.user_warranty_end_date, user_warranty_end_date),
        updated_at = NOW()
    WHERE id = v_physical_product_id;

    -- Link serial to existing physical_product
    NEW.physical_product_id := v_physical_product_id;

    -- Update stock: -1 from old warehouse, +1 to new warehouse
    -- IMPORTANT: Only deduct from warehouses that track physical stock
    -- Skip customer_installed, dead_stock, rma_staging (these track location only, not physical inventory)
    IF v_old_warehouse_id IS DISTINCT FROM v_virtual_warehouse_id THEN
      -- Get old warehouse type
      SELECT warehouse_type INTO v_old_warehouse_type
      FROM public.virtual_warehouses
      WHERE id = v_old_warehouse_id;

      -- Only deduct from warehouses that track physical stock
      IF v_old_warehouse_type IN ('main', 'warranty_stock', 'in_service') THEN
        PERFORM public.upsert_product_stock(v_product_id, v_old_warehouse_id, -1);
      END IF;

      -- Always add to new warehouse (all receipts increase stock)
      PERFORM public.upsert_product_stock(v_product_id, v_virtual_warehouse_id, 1);
    END IF;
  ELSE
    -- New product (purchase) - create it
    INSERT INTO public.physical_products (
      product_id, serial_number, virtual_warehouse_id,
      condition, status,
      manufacturer_warranty_end_date, user_warranty_end_date
    ) VALUES (
      v_product_id, NEW.serial_number, v_virtual_warehouse_id,
      'new', 'active',
      NEW.manufacturer_warranty_end_date, NEW.user_warranty_end_date
    )
    RETURNING id INTO v_physical_product_id;

    -- Link serial to new physical_product
    NEW.physical_product_id := v_physical_product_id;

    -- Update stock IMMEDIATELY
    PERFORM public.upsert_product_stock(v_product_id, v_virtual_warehouse_id, 1);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_physical_product_on_receipt_serial
  BEFORE INSERT ON public.stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.create_physical_product_on_receipt_serial();

COMMENT ON FUNCTION public.create_physical_product_on_receipt_serial IS 'Create active physical product and update stock immediately when serial is added to receipt';

-- =====================================================
-- RECEIPT SERIAL DELETE: Cleanup physical product
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_physical_product_on_receipt_serial_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_virtual_warehouse_id UUID;
BEGIN
  -- Get info for stock update
  SELECT sri.product_id, sr.virtual_warehouse_id
  INTO v_product_id, v_virtual_warehouse_id
  FROM public.stock_receipt_items sri
  JOIN public.stock_receipts sr ON sri.receipt_id = sr.id
  WHERE sri.id = OLD.receipt_item_id;

  -- Delete physical product if it exists
  IF OLD.physical_product_id IS NOT NULL THEN
    DELETE FROM public.physical_products
    WHERE id = OLD.physical_product_id;
  END IF;

  -- Decrement stock
  PERFORM public.upsert_product_stock(v_product_id, v_virtual_warehouse_id, -1);

  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_cleanup_physical_product_on_receipt_serial_delete
  BEFORE DELETE ON public.stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_physical_product_on_receipt_serial_delete();

COMMENT ON FUNCTION public.cleanup_physical_product_on_receipt_serial_delete IS 'Delete physical product and decrement stock when receipt serial is deleted';

-- =====================================================
-- ISSUE SERIAL: Process issue immediately
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_issue_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_from_warehouse_id UUID;
  v_customer_id UUID;
  v_issue_reason TEXT;
  v_destination_warehouse_id UUID;
BEGIN
  -- Get info from issue (including customer_id and issue_reason)
  SELECT sii.product_id, si.virtual_warehouse_id, si.customer_id, si.issue_reason
  INTO v_product_id, v_from_warehouse_id, v_customer_id, v_issue_reason
  FROM public.stock_issue_items sii
  JOIN public.stock_issues si ON sii.issue_id = si.id
  WHERE sii.id = NEW.issue_item_id;

  -- For sale/warranty_replacement/repair: move product to customer_installed warehouse
  -- These are all "xuất kho" scenarios where product goes to customer
  -- NOTE: Only deduct from source, do NOT add to destination
  -- because goods leaving the system are tracked via physical_product.virtual_warehouse_id
  IF v_issue_reason IN ('sale', 'warranty_replacement', 'repair') THEN
    SELECT id INTO v_destination_warehouse_id
    FROM public.virtual_warehouses
    WHERE warehouse_type = 'customer_installed'
    LIMIT 1;

    -- Update physical product location (for warranty tracking)
    UPDATE public.physical_products
    SET status = 'issued',
        previous_virtual_warehouse_id = virtual_warehouse_id,
        virtual_warehouse_id = COALESCE(v_destination_warehouse_id, virtual_warehouse_id),
        last_known_customer_id = COALESCE(v_customer_id, last_known_customer_id),
        updated_at = NOW()
    WHERE id = NEW.physical_product_id;

    -- Only deduct from source warehouse (goods left the system)
    PERFORM public.upsert_product_stock(v_product_id, v_from_warehouse_id, -1);

  -- For return_to_supplier (RMA): move product to rma_staging warehouse
  -- NOTE: Only deduct from source, do NOT add to destination
  -- because goods have been shipped to manufacturer (left the system)
  ELSIF v_issue_reason = 'return_to_supplier' THEN
    SELECT id INTO v_destination_warehouse_id
    FROM public.virtual_warehouses
    WHERE warehouse_type = 'rma_staging'
    LIMIT 1;

    -- Update physical product location (for tracking)
    UPDATE public.physical_products
    SET status = 'issued',
        previous_virtual_warehouse_id = virtual_warehouse_id,
        virtual_warehouse_id = COALESCE(v_destination_warehouse_id, virtual_warehouse_id),
        updated_at = NOW()
    WHERE id = NEW.physical_product_id;

    -- Only deduct from source warehouse (goods left the system)
    PERFORM public.upsert_product_stock(v_product_id, v_from_warehouse_id, -1);

  ELSE
    -- For other issue reasons: just mark as issued
    UPDATE public.physical_products
    SET status = 'issued',
        last_known_customer_id = COALESCE(v_customer_id, last_known_customer_id),
        updated_at = NOW()
    WHERE id = NEW.physical_product_id;

    PERFORM public.upsert_product_stock(v_product_id, v_from_warehouse_id, -1);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_process_issue_serial
  AFTER INSERT ON public.stock_issue_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.process_issue_serial();

COMMENT ON FUNCTION public.process_issue_serial IS 'Process issue immediately: move product and update stock';

-- =====================================================
-- TRANSFER SERIAL: Process transfer immediately
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_transfer_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_from_warehouse_id UUID;
  v_to_warehouse_id UUID;
  v_customer_id UUID;
BEGIN
  -- Get info from transfer
  SELECT sti.product_id, st.from_virtual_warehouse_id,
         st.to_virtual_warehouse_id, st.customer_id
  INTO v_product_id, v_from_warehouse_id, v_to_warehouse_id, v_customer_id
  FROM public.stock_transfer_items sti
  JOIN public.stock_transfers st ON sti.transfer_id = st.id
  WHERE sti.id = NEW.transfer_item_id;

  -- Move physical product to destination warehouse
  UPDATE public.physical_products
  SET previous_virtual_warehouse_id = virtual_warehouse_id,
      virtual_warehouse_id = v_to_warehouse_id,
      last_known_customer_id = COALESCE(v_customer_id, last_known_customer_id),
      updated_at = NOW()
  WHERE id = NEW.physical_product_id;

  -- Decrease stock from source warehouse
  PERFORM public.upsert_product_stock(v_product_id, v_from_warehouse_id, -1);

  -- Increase stock at destination warehouse
  PERFORM public.upsert_product_stock(v_product_id, v_to_warehouse_id, 1);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_process_transfer_serial
  AFTER INSERT ON public.stock_transfer_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.process_transfer_serial();

COMMENT ON FUNCTION public.process_transfer_serial IS 'Process transfer immediately: move product between warehouses and update stock';

-- =====================================================
-- NOTES
-- =====================================================
-- Simplified inventory workflow (no draft/approval):
-- 1. Receipt: Adding serial → creates active physical product + updates stock
-- 2. Issue: Adding serial → moves product to destination (if any) + decrements source stock
-- 3. Transfer: Adding serial → moves product between warehouses + updates both stocks
--
-- All operations are immediate and irreversible (no cancel/rollback in schema).
-- Business logic for undo should create compensating documents.
