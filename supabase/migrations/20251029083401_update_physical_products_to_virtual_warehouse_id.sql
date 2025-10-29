-- =====================================================
-- Migration: Update physical_products to use virtual_warehouse_id
-- Description: Change from virtual_warehouse_type to virtual_warehouse_id
-- Date: 2025-10-29
-- =====================================================

-- Step 1: Add new column (nullable initially for data migration)
ALTER TABLE public.physical_products
ADD COLUMN IF NOT EXISTS virtual_warehouse_id UUID REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT;

-- Step 2: Migrate data from virtual_warehouse_type to virtual_warehouse_id
UPDATE public.physical_products pp
SET virtual_warehouse_id = (
  SELECT vw.id
  FROM public.virtual_warehouses vw
  WHERE vw.warehouse_type = pp.virtual_warehouse_type
    AND (pp.physical_warehouse_id IS NULL OR vw.physical_warehouse_id = pp.physical_warehouse_id)
  LIMIT 1
)
WHERE pp.virtual_warehouse_id IS NULL;

-- Step 3: Make virtual_warehouse_id NOT NULL (after data migration)
ALTER TABLE public.physical_products
ALTER COLUMN virtual_warehouse_id SET NOT NULL;

-- Step 4: Handle previous_virtual_warehouse_type (used for RMA tracking)
-- Add new column
ALTER TABLE public.physical_products
ADD COLUMN IF NOT EXISTS previous_virtual_warehouse_id UUID REFERENCES public.virtual_warehouses(id) ON DELETE SET NULL;

-- Migrate previous_virtual_warehouse_type data (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'physical_products'
    AND column_name = 'previous_virtual_warehouse_type'
  ) THEN
    UPDATE public.physical_products pp
    SET previous_virtual_warehouse_id = (
      SELECT vw.id
      FROM public.virtual_warehouses vw
      WHERE vw.warehouse_type = pp.previous_virtual_warehouse_type
        AND (pp.physical_warehouse_id IS NULL OR vw.physical_warehouse_id = pp.physical_warehouse_id)
      LIMIT 1
    )
    WHERE pp.previous_virtual_warehouse_type IS NOT NULL;
  END IF;
END $$;

-- Step 5: Drop views that depend on virtual_warehouse_type
DROP VIEW IF EXISTS v_warehouse_stock_levels CASCADE;
DROP VIEW IF EXISTS v_warranty_expiring_soon CASCADE;
DROP VIEW IF EXISTS v_low_stock_alerts CASCADE;

-- Step 6: Drop old columns
ALTER TABLE public.physical_products
DROP COLUMN IF EXISTS virtual_warehouse_type,
DROP COLUMN IF EXISTS previous_virtual_warehouse_type;

-- Step 7: Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_physical_products_virtual_warehouse
ON public.physical_products(virtual_warehouse_id);

CREATE INDEX IF NOT EXISTS idx_physical_products_previous_virtual_warehouse
ON public.physical_products(previous_virtual_warehouse_id);

-- Step 8: Add comments
COMMENT ON COLUMN public.physical_products.virtual_warehouse_id IS
  'Virtual warehouse where this product is currently located';

COMMENT ON COLUMN public.physical_products.previous_virtual_warehouse_id IS
  'Stores the virtual warehouse before product was moved (used for RMA tracking)';

SELECT 'Physical products updated to use virtual_warehouse_id successfully' as status;
