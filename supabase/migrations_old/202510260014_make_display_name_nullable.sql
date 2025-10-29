-- =====================================================
-- Remove display_name column from virtual_warehouses
-- =====================================================
-- We only need 'name' column. Remove display_name to simplify schema.

-- Step 1: Copy display_name to name for any records that don't have name yet
UPDATE public.virtual_warehouses
SET name = display_name
WHERE name IS NULL AND display_name IS NOT NULL;

-- Step 2: Make name NOT NULL (it should be the primary name field)
ALTER TABLE public.virtual_warehouses
  ALTER COLUMN name SET NOT NULL;

-- Step 3: Drop display_name column
ALTER TABLE public.virtual_warehouses
  DROP COLUMN display_name;

-- Step 4: Update comment
COMMENT ON COLUMN public.virtual_warehouses.name IS 'Virtual warehouse name (primary display name)';
