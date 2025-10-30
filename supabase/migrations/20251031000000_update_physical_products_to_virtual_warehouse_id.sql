BEGIN;

ALTER TABLE public.physical_products
  ADD COLUMN virtual_warehouse_id uuid;

ALTER TABLE public.physical_products
  ADD COLUMN previous_virtual_warehouse_id uuid;

UPDATE public.physical_products AS pp
SET virtual_warehouse_id = vw.id
FROM public.virtual_warehouses AS vw
WHERE vw.warehouse_type = pp.virtual_warehouse_type
  AND pp.virtual_warehouse_id IS NULL;

UPDATE public.physical_products AS pp
SET previous_virtual_warehouse_id = vw.id
FROM public.virtual_warehouses AS vw
WHERE pp.previous_virtual_warehouse_type IS NOT NULL
  AND vw.warehouse_type = pp.previous_virtual_warehouse_type
  AND pp.previous_virtual_warehouse_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.physical_products
    WHERE virtual_warehouse_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Failed to backfill virtual_warehouse_id for all physical_products rows';
  END IF;
END;
$$;

ALTER TABLE public.physical_products
  ALTER COLUMN virtual_warehouse_id SET NOT NULL;

ALTER TABLE public.physical_products
  ADD CONSTRAINT physical_products_virtual_warehouse_id_fkey
  FOREIGN KEY (virtual_warehouse_id) REFERENCES public.virtual_warehouses (id) ON DELETE RESTRICT;

ALTER TABLE public.physical_products
  ADD CONSTRAINT physical_products_previous_virtual_warehouse_id_fkey
  FOREIGN KEY (previous_virtual_warehouse_id) REFERENCES public.virtual_warehouses (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_physical_products_virtual_warehouse_id
  ON public.physical_products (virtual_warehouse_id);

CREATE INDEX IF NOT EXISTS idx_physical_products_previous_virtual_warehouse_id
  ON public.physical_products (previous_virtual_warehouse_id)
  WHERE previous_virtual_warehouse_id IS NOT NULL;

COMMIT;
