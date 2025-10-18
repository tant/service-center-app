-- Function to decrease part stock quantity safely
-- Security: SET search_path = '' and explicit schema qualification prevent schema hijacking
CREATE OR REPLACE FUNCTION public.decrease_part_stock(
  part_id UUID,
  quantity_to_decrease INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update stock quantity with atomic check
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity - quantity_to_decrease,
    updated_at = pg_catalog.now()
  WHERE
    id = part_id
    AND stock_quantity >= quantity_to_decrease;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for part ID: %. Available: %, Requested: %',
      part_id,
      pg_catalog.coalesce((SELECT stock_quantity FROM public.parts WHERE id = part_id), 0),
      quantity_to_decrease;
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to increase part stock quantity (for returns/restocks)
-- Security: SET search_path = '' and explicit schema qualification prevent schema hijacking
CREATE OR REPLACE FUNCTION public.increase_part_stock(
  part_id UUID,
  quantity_to_increase INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update stock quantity
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity + quantity_to_increase,
    updated_at = pg_catalog.now()
  WHERE id = part_id;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Part not found with ID: %', part_id;
  END IF;

  RETURN TRUE;
END;
$$;