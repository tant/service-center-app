-- Function to decrease part stock quantity safely
CREATE OR REPLACE FUNCTION decrease_part_stock(
  part_id UUID,
  quantity_to_decrease INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update stock quantity with atomic check
  UPDATE parts
  SET
    stock_quantity = stock_quantity - quantity_to_decrease,
    updated_at = NOW()
  WHERE
    id = part_id
    AND stock_quantity >= quantity_to_decrease;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for part ID: %. Available: %, Requested: %',
      part_id,
      COALESCE((SELECT stock_quantity FROM parts WHERE id = part_id), 0),
      quantity_to_decrease;
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to increase part stock quantity (for returns/restocks)
CREATE OR REPLACE FUNCTION increase_part_stock(
  part_id UUID,
  quantity_to_increase INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update stock quantity
  UPDATE parts
  SET
    stock_quantity = stock_quantity + quantity_to_increase,
    updated_at = NOW()
  WHERE id = part_id;

  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Part not found with ID: %', part_id;
  END IF;

  RETURN TRUE;
END;
$$;