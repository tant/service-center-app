-- =====================================================
-- Story 1.10: RMA Batch Operations
-- Auto-numbering for RMA batches: RMA-YYYY-MM-NNN
-- =====================================================

-- Function to generate RMA batch number
CREATE OR REPLACE FUNCTION generate_rma_batch_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_sequence INT;
  v_batch_number TEXT;
BEGIN
  -- Get current year and month
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');

  -- Get next sequence number for this month
  SELECT COALESCE(MAX(
    CASE
      WHEN batch_number ~ '^RMA-[0-9]{4}-[0-9]{2}-[0-9]{3}$'
        AND SUBSTRING(batch_number FROM 5 FOR 4) = v_year
        AND SUBSTRING(batch_number FROM 10 FOR 2) = v_month
      THEN CAST(SUBSTRING(batch_number FROM 13 FOR 3) AS INT)
      ELSE 0
    END
  ), 0) + 1
  INTO v_sequence
  FROM rma_batches;

  -- Generate batch number: RMA-YYYY-MM-NNN
  v_batch_number := 'RMA-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 3, '0');

  -- Set the batch number
  NEW.batch_number := v_batch_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-numbering
DROP TRIGGER IF EXISTS trigger_generate_rma_batch_number ON rma_batches;

CREATE TRIGGER trigger_generate_rma_batch_number
  BEFORE INSERT ON rma_batches
  FOR EACH ROW
  WHEN (NEW.batch_number IS NULL)
  EXECUTE FUNCTION generate_rma_batch_number();

COMMENT ON FUNCTION generate_rma_batch_number() IS 'Auto-generates RMA batch numbers in format RMA-YYYY-MM-NNN';
