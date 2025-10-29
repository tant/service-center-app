-- =====================================================
-- Migration: Require physical_warehouse_id for all virtual warehouses
-- Description: Add NOT NULL constraint to enforce that every virtual warehouse must belong to a physical warehouse
-- Date: 2025-10-29
-- =====================================================

-- Verify all existing virtual warehouses have physical_warehouse_id
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.virtual_warehouses
  WHERE physical_warehouse_id IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: % virtual warehouses have NULL physical_warehouse_id', null_count;
  END IF;
END $$;

-- Add NOT NULL constraint
ALTER TABLE public.virtual_warehouses
ALTER COLUMN physical_warehouse_id SET NOT NULL;

-- Update comment
COMMENT ON COLUMN public.virtual_warehouses.physical_warehouse_id IS
  'Physical warehouse that this virtual warehouse belongs to (required)';

SELECT 'Successfully added NOT NULL constraint to virtual_warehouses.physical_warehouse_id' as status;
