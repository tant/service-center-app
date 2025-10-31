-- =====================================================
-- 300_virtual_warehouse_physical_link.sql
-- =====================================================
-- Schema Alterations: Virtual Warehouse ↔ Physical Link
--
-- ALTER TABLE operations to:
-- - Add physical_warehouse_id to virtual_warehouses
-- - Drop UNIQUE constraint on warehouse_type
-- - Migrate existing data
--
-- ORDER: 300-399 (Constraints & Alterations)
-- DEPENDENCIES: 202
-- NOTE: Triggers moved to 601_default_warehouse_triggers.sql
-- =====================================================

-- Step 1: Add new columns to virtual_warehouses
ALTER TABLE public.virtual_warehouses
  ADD COLUMN IF NOT EXISTS physical_warehouse_id UUID REFERENCES public.physical_warehouses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Step 2: Drop UNIQUE constraint on warehouse_type (allow multiple warehouses per type)
ALTER TABLE public.virtual_warehouses 
  DROP CONSTRAINT IF EXISTS virtual_warehouses_warehouse_type_key;

-- Step 3: Update existing virtual warehouses to be system defaults (no physical warehouse link)
-- These are the global virtual warehouse types
-- Note: display_name column has been removed in migration 14, only name is used now
UPDATE public.virtual_warehouses 
SET physical_warehouse_id = NULL
WHERE physical_warehouse_id IS NULL;

-- Step 4: Create function to auto-create default virtual warehouse for physical warehouse
CREATE OR REPLACE FUNCTION public.create_default_virtual_warehouse()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Create a default "Main Storage" virtual warehouse for the new physical warehouse
  INSERT INTO public.virtual_warehouses (
    warehouse_type,
    name,
    description,
    physical_warehouse_id,
    is_active
  ) VALUES (
    'main', -- Default type for main storage (updated 2025-10-29 - Gap 1 fix)
    NEW.name || ' - Kho Chính',
    'Kho chính của ' || NEW.name,
    NEW.id,
    NEW.is_active
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_default_virtual_warehouse() IS 'Auto-create default virtual warehouse with main type when physical warehouse is created';

-- Step 5: Create trigger for auto-creating virtual warehouse
DROP TRIGGER IF EXISTS trigger_create_default_virtual_warehouse ON public.physical_warehouses;
CREATE TRIGGER trigger_create_default_virtual_warehouse
  AFTER INSERT ON public.physical_warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_virtual_warehouse();

-- Step 6: Create function to auto-update virtual warehouse name
CREATE OR REPLACE FUNCTION public.update_default_virtual_warehouse_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Update the default virtual warehouse name when physical warehouse name changes
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE public.virtual_warehouses
    SET
      name = NEW.name || ' - Kho Chính',
      description = 'Kho chính của ' || NEW.name
    WHERE physical_warehouse_id = NEW.id
      AND name = OLD.name || ' - Kho Chính'; -- Only update the default one
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_default_virtual_warehouse_name() IS 'Auto-update default virtual warehouse name when physical warehouse name changes';

-- Step 7: Create trigger for auto-updating virtual warehouse name
DROP TRIGGER IF EXISTS trigger_update_default_virtual_warehouse_name ON public.physical_warehouses;
CREATE TRIGGER trigger_update_default_virtual_warehouse_name
  AFTER UPDATE ON public.physical_warehouses
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION public.update_default_virtual_warehouse_name();

-- Step 8: Create default virtual warehouses for existing physical warehouses
