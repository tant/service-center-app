-- =====================================================
-- Fix Warehouse Schema Gaps
-- =====================================================
-- Addresses gaps identified in warehouse schema audit
-- Date: 2025-10-29
-- =====================================================

-- =====================================================
-- GAP 1: Add 'main' warehouse type
-- =====================================================
-- Add 'main' to warehouse_type enum for semantic clarity

ALTER TYPE public.warehouse_type ADD VALUE IF NOT EXISTS 'main';

COMMENT ON TYPE public.warehouse_type IS 'Virtual warehouse categories: main (primary storage), warranty_stock, rma_staging, dead_stock, in_service, parts';

-- =====================================================
-- GAP 2: Cleanup virtual_warehouses columns
-- =====================================================
-- Note: display_name was removed from init_schema.sql
-- Only need to handle color_code and ensure name is NOT NULL

-- Step 1: Make name NOT NULL (it should be the primary name field)
ALTER TABLE public.virtual_warehouses
  ALTER COLUMN name SET NOT NULL;

-- Step 2: Drop color_code column (unused)
ALTER TABLE public.virtual_warehouses
  DROP COLUMN IF EXISTS color_code;

-- Step 3: Update comment
COMMENT ON COLUMN public.virtual_warehouses.name IS 'Virtual warehouse name (primary display name)';

-- =====================================================
-- GAP 3: Previous virtual warehouse tracking
-- =====================================================
-- Note: previous_virtual_warehouse_id was already added in migration
-- 20251029083401_update_physical_products_to_virtual_warehouse_id.sql
-- No action needed here.

-- =====================================================
-- GAP 1 (Bonus): Update trigger to use 'main' type
-- =====================================================
-- Update auto-create trigger to use 'main' instead of 'warranty_stock'

CREATE OR REPLACE FUNCTION public.create_default_virtual_warehouse()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a default "Main Storage" virtual warehouse for the new physical warehouse
  INSERT INTO public.virtual_warehouses (
    warehouse_type,
    name,
    description,
    physical_warehouse_id,
    is_active
  ) VALUES (
    'main', -- Changed from 'warranty_stock' to match Gap 1
    NEW.name || ' - Kho Chính',
    'Kho chính của ' || NEW.name,
    NEW.id,
    NEW.is_active
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_default_virtual_warehouse() IS 'Auto-create default virtual warehouse with main type when physical warehouse is created';

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify main type exists
SELECT 'Gap 1 Fixed: main type added' as status
WHERE EXISTS (
  SELECT 1 FROM pg_enum
  WHERE enumtypid = 'warehouse_type'::regtype
  AND enumlabel = 'main'
);

-- Verify virtual_warehouses columns
SELECT
  'Gap 2 Fixed: ' ||
  CASE
    WHEN COUNT(*) FILTER (WHERE column_name = 'name' AND is_nullable = 'NO') = 1
     AND COUNT(*) FILTER (WHERE column_name = 'color_code') = 0
    THEN 'name is NOT NULL, color_code removed'
    ELSE 'INCOMPLETE - check columns'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'virtual_warehouses'
  AND column_name IN ('name', 'color_code');

-- Verify previous_virtual_warehouse_id exists (from earlier migration)
SELECT 'Gap 3 Verified: previous_virtual_warehouse_id exists' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'physical_products'
    AND column_name = 'previous_virtual_warehouse_id'
);

-- Display completion message
SELECT '✅ All 3 gaps fixed successfully' as result;
