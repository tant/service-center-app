-- =====================================================
-- Add 'main' warehouse type and remove color_code
-- =====================================================
-- 1. Add 'main' to warehouse_type enum
-- 2. Remove color_code column from virtual_warehouses
-- NOTE: Step 3 (updating warehouse_type to 'main') will be in next migration
--       due to PostgreSQL enum constraint

-- Step 1: Add 'main' to warehouse_type enum
ALTER TYPE warehouse_type ADD VALUE IF NOT EXISTS 'main';

-- Step 2: Drop color_code column
ALTER TABLE public.virtual_warehouses
  DROP COLUMN IF EXISTS color_code;
