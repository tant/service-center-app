-- Story 1.7: Physical Product Master Data with Serial Tracking
-- Add constraints and columns for physical product management

-- Add supplier_name column to complement supplier_id
ALTER TABLE public.physical_products
ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- Add photo_urls column for product condition documentation
ALTER TABLE public.physical_products
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

-- Add created_by_id column for tracking who registered the product
ALTER TABLE public.physical_products
ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add check constraint for warranty dates (end_date > start_date when both exist)
ALTER TABLE public.physical_products
DROP CONSTRAINT IF EXISTS check_warranty_dates;

ALTER TABLE public.physical_products
ADD CONSTRAINT check_warranty_dates
  CHECK (
    warranty_end_date IS NULL OR
    warranty_start_date IS NULL OR
    warranty_end_date > warranty_start_date
  );

-- Add check constraint for serial number format (alphanumeric, min 5 characters)
-- Allow uppercase letters, numbers, and common separators like dash and underscore
ALTER TABLE public.physical_products
DROP CONSTRAINT IF EXISTS check_serial_number_format;

ALTER TABLE public.physical_products
ADD CONSTRAINT check_serial_number_format
  CHECK (
    serial_number IS NOT NULL AND
    LENGTH(serial_number) >= 5 AND
    serial_number ~ '^[A-Z0-9_-]+$'
  );

-- Create index on created_by_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_physical_products_created_by
  ON public.physical_products(created_by_id)
  WHERE created_by_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.physical_products.supplier_name IS 'Supplier company name for this specific product instance';
COMMENT ON COLUMN public.physical_products.photo_urls IS 'Array of Supabase Storage URLs for product condition photos';
COMMENT ON COLUMN public.physical_products.created_by_id IS 'User who registered this physical product in the system';
COMMENT ON CONSTRAINT check_warranty_dates ON public.physical_products IS 'Ensures warranty end date is after start date when both are present';
COMMENT ON CONSTRAINT check_serial_number_format ON public.physical_products IS 'Ensures serial number is alphanumeric with min 5 characters (allows A-Z, 0-9, dash, underscore)';
