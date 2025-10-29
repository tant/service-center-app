-- =====================================================
-- 08_inventory_functions.sql
-- =====================================================
-- Functions for managing inventory stock levels.
-- =====================================================

-- Function to decrease part stock quantity safely
CREATE OR REPLACE FUNCTION public.decrease_part_stock(
  p_part_id UUID,
  p_quantity_to_decrease INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity - p_quantity_to_decrease,
    updated_at = now()
  WHERE
    id = p_part_id
    AND stock_quantity >= p_quantity_to_decrease;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for part ID: %. Available: %, Requested: %',
      p_part_id,
      coalesce((SELECT stock_quantity FROM public.parts WHERE id = p_part_id), 0),
      p_quantity_to_decrease;
  END IF;

  RETURN TRUE;
END;
$$;
COMMENT ON FUNCTION public.decrease_part_stock(UUID, INTEGER) IS 'Safely decreases stock for a given part, raising an error if insufficient.';

-- Function to increase part stock quantity
CREATE OR REPLACE FUNCTION public.increase_part_stock(
  p_part_id UUID,
  p_quantity_to_increase INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.parts
  SET
    stock_quantity = stock_quantity + p_quantity_to_increase,
    updated_at = now()
  WHERE id = p_part_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Part not found with ID: %', p_part_id;
  END IF;

  RETURN TRUE;
END;
$$;
COMMENT ON FUNCTION public.increase_part_stock(UUID, INTEGER) IS 'Increases stock for a given part (e.g., for returns or restocks).';

-- Grants
GRANT EXECUTE ON FUNCTION public.decrease_part_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increase_part_stock(UUID, INTEGER) TO authenticated;
