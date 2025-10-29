-- Fix RMA batches schema: add supplier_name column and make supplier_id nullable
-- This allows users to enter supplier name directly without requiring a supplier record

-- Add supplier_name column
ALTER TABLE public.rma_batches 
ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);

-- Make supplier_id nullable since we're using supplier_name instead
ALTER TABLE public.rma_batches 
ALTER COLUMN supplier_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN public.rma_batches.supplier_name IS 'Name of the supplier for RMA return (direct text input)';
COMMENT ON COLUMN public.rma_batches.supplier_id IS 'Optional reference to suppliers table if exists';
