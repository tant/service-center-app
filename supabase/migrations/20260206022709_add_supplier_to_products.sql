-- =====================================================
-- Migration: Add supplier field to products table
-- Issue #8: Add supplier field to product creation form
-- =====================================================

-- Add supplier_name column to products table (free-text field for MVP)
ALTER TABLE public.products
  ADD COLUMN supplier_name TEXT;

-- Add index for better query performance
CREATE INDEX products_supplier_name_idx ON public.products USING btree (supplier_name);

-- Add comment
COMMENT ON COLUMN public.products.supplier_name IS 'Supplier/vendor name for the product (optional, free-text for MVP)';
