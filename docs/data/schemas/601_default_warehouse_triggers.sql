-- =====================================================
-- 601_default_warehouse_triggers.sql
-- =====================================================
-- Default Warehouse Auto-Creation Triggers
--
-- Triggers for:
-- - Auto-create default virtual warehouse when physical warehouse created
-- - Auto-update virtual warehouse name when physical warehouse renamed
--
-- ORDER: 600-699 (Triggers)
-- DEPENDENCIES: 202, 300
-- =====================================================
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

