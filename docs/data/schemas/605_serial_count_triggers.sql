-- =====================================================
-- SERIAL COUNT MAINTENANCE TRIGGERS
-- =====================================================
-- Automatically updates the serial_count field in stock_receipt_items
-- when serials are added or removed
--
-- NOTE: Only receipt items have serial_count field.
-- Issues and transfers use existing physical products (already have serials).
--
-- Created: 2025-11-05
-- =====================================================

-- =====================================================
-- RECEIPT ITEMS SERIAL COUNT
-- =====================================================

-- Function to update serial_count on receipt items
CREATE OR REPLACE FUNCTION public.update_receipt_item_serial_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_receipt_item_id UUID;
  v_new_count INTEGER;
BEGIN
  -- Determine which receipt_item_id to update
  IF TG_OP = 'DELETE' THEN
    v_receipt_item_id := OLD.receipt_item_id;
  ELSE
    v_receipt_item_id := NEW.receipt_item_id;
  END IF;

  -- Count current serials for this item
  SELECT COUNT(*)::INTEGER INTO v_new_count
  FROM public.stock_receipt_serials
  WHERE receipt_item_id = v_receipt_item_id;

  -- Update the serial_count field
  UPDATE public.stock_receipt_items
  SET serial_count = v_new_count,
      updated_at = NOW()
  WHERE id = v_receipt_item_id;

  -- Return appropriate value based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for INSERT and DELETE on stock_receipt_serials
CREATE TRIGGER trigger_update_receipt_serial_count_on_insert
  AFTER INSERT ON public.stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receipt_item_serial_count();

CREATE TRIGGER trigger_update_receipt_serial_count_on_delete
  AFTER DELETE ON public.stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receipt_item_serial_count();

COMMENT ON FUNCTION public.update_receipt_item_serial_count IS 'Automatically updates serial_count in stock_receipt_items when serials are added or removed';
