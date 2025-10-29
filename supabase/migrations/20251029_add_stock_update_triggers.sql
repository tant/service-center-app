-- =====================================================
-- Add Stock Update Triggers on Approval
-- =====================================================
-- Updates declared_quantity immediately when documents are approved
-- - Receipts: Increment stock when approved
-- - Issues: Decrement stock when approved
-- - Transfers: Auto-handled via generated issue/receipt documents
-- =====================================================

-- Helper function: Update or create stock record
CREATE OR REPLACE FUNCTION public.upsert_product_stock(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity_delta INT
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update stock record
  INSERT INTO public.product_warehouse_stock (
    product_id,
    virtual_warehouse_id,
    declared_quantity,
    initial_stock_entry
  ) VALUES (
    p_product_id,
    p_warehouse_id,
    p_quantity_delta,
    0
  )
  ON CONFLICT (product_id, virtual_warehouse_id)
  DO UPDATE SET
    declared_quantity = public.product_warehouse_stock.declared_quantity + p_quantity_delta,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.upsert_product_stock IS 'Update or create stock record with quantity delta';

-- Receipt approval: Increment stock
CREATE OR REPLACE FUNCTION public.update_stock_on_receipt_approval()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_receipt_approval ON public.stock_receipts;

CREATE TRIGGER trigger_update_stock_on_receipt_approval
  AFTER UPDATE ON public.stock_receipts
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION public.update_stock_on_receipt_approval();

COMMENT ON FUNCTION public.update_stock_on_receipt_approval IS 'Increment stock when receipt is approved';

-- Issue approval: Decrement stock
CREATE OR REPLACE FUNCTION public.update_stock_on_issue_approval()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_issue_approval ON public.stock_issues;

CREATE TRIGGER trigger_update_stock_on_issue_approval
  AFTER UPDATE ON public.stock_issues
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION public.update_stock_on_issue_approval();

COMMENT ON FUNCTION public.update_stock_on_issue_approval IS 'Decrement stock when issue is approved';

-- =====================================================
-- NOTES
-- =====================================================
-- Transfers are automatically handled because:
-- 1. When transfer is approved, auto_generate_transfer_documents() creates:
--    - An issue document (status='approved') for source warehouse
--    - A receipt document (status='approved') for destination warehouse
-- 2. The above issue/receipt documents trigger their respective stock updates
-- 3. Result: Stock is decremented from source and incremented to destination
