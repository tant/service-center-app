-- =====================================================
-- Migration: Fix receipt completion trigger to use virtual_warehouse_id
-- Description: Update process_stock_receipt_completion function and recreate trigger
-- Date: 2025-10-29
-- =====================================================

-- Step 1: Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_process_stock_receipt_completion ON public.stock_receipts;

-- Step 2: Drop and recreate function with correct columns
DROP FUNCTION IF EXISTS public.process_stock_receipt_completion();

CREATE OR REPLACE FUNCTION public.process_stock_receipt_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update product_warehouse_stock using virtual_warehouse_id
    INSERT INTO product_warehouse_stock (
      product_id,
      virtual_warehouse_id,
      declared_quantity
    )
    SELECT
      sri.product_id,
      NEW.virtual_warehouse_id,  -- Changed from virtual_warehouse_type
      SUM(sri.declared_quantity)
    FROM stock_receipt_items sri
    WHERE sri.receipt_id = NEW.id
    GROUP BY sri.product_id
    ON CONFLICT (product_id, virtual_warehouse_id)
    DO UPDATE SET
      declared_quantity = product_warehouse_stock.declared_quantity + EXCLUDED.declared_quantity,
      updated_at = NOW();

    -- Create physical_products records for serials using virtual_warehouse_id
    INSERT INTO physical_products (
      product_id,
      serial_number,
      condition,
      virtual_warehouse_id,  -- Changed from virtual_warehouse_type
      warranty_start_date,
      warranty_months
    )
    SELECT
      sri.product_id,
      srs.serial_number,
      'new',
      NEW.virtual_warehouse_id,  -- Changed from virtual_warehouse_type
      COALESCE(srs.warranty_start_date, sri.warranty_start_date),
      COALESCE(srs.warranty_months, sri.warranty_months)
    FROM stock_receipt_items sri
    JOIN stock_receipt_serials srs ON srs.receipt_item_id = sri.id
    WHERE sri.receipt_id = NEW.id
    ON CONFLICT (serial_number) DO NOTHING;

    -- Link serials to physical_products
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.process_stock_receipt_completion() IS
  'Trigger function to process stock receipt completion: update stock levels and create physical products';

-- Step 3: Create trigger
CREATE TRIGGER trigger_process_stock_receipt_completion
  BEFORE UPDATE ON public.stock_receipts
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION public.process_stock_receipt_completion();

COMMENT ON TRIGGER trigger_process_stock_receipt_completion ON public.stock_receipts IS
  'Automatically process receipt completion when status changes to completed';

-- Step 4: Display result
SELECT 'Receipt completion trigger fixed and recreated successfully' as status;
