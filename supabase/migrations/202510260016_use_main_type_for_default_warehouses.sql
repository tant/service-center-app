-- =====================================================
-- Update warehouse_type to 'main' for default warehouses
-- =====================================================
-- This migration must be separate from enum creation due to PostgreSQL constraints

-- Step 1: Update trigger function to use 'main' type
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
    'main', -- Changed from 'warranty_stock' to 'main'
    NEW.name || ' - Kho Chính',
    'Kho chính của ' || NEW.name,
    NEW.id,
    NEW.is_active
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_default_virtual_warehouse() IS 'Auto-create default main virtual warehouse when physical warehouse is created';

-- Step 2: Update existing default virtual warehouses to use 'main' type
-- Only update the auto-generated default warehouses (those with ' - Kho Chính' suffix)
UPDATE public.virtual_warehouses
SET warehouse_type = 'main'
WHERE physical_warehouse_id IS NOT NULL
  AND name LIKE '% - Kho Chính';

-- Display result
SELECT 
  'Migration complete: ' || COUNT(*) || ' virtual warehouses updated to main type'
FROM public.virtual_warehouses
WHERE warehouse_type = 'main';
