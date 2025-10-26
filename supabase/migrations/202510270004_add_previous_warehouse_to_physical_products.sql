-- Add column to track previous virtual warehouse when product moves to RMA
-- This allows us to return the product to its original location when removed from RMA batch

ALTER TABLE public.physical_products 
ADD COLUMN IF NOT EXISTS previous_virtual_warehouse_type public.warehouse_type;

COMMENT ON COLUMN public.physical_products.previous_virtual_warehouse_type IS 'Stores the warehouse type before product was moved to RMA, used to restore product location when removed from RMA batch';
