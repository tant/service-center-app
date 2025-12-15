-- =====================================================
-- Migration: Add Ticket Outcome and Replacement Product
-- =====================================================
-- Story 01.22: Ticket Completion with Outcome & Replacement Product
-- FR32, FR33
--
-- This migration adds:
-- 1. ENUM ticket_outcome (repaired, warranty_replacement, unrepairable)
-- 2. Column outcome on service_tickets
-- 3. Column replacement_product_id on service_tickets (FK to physical_products)
-- 4. Constraint to ensure replacement_product_id only set when outcome = warranty_replacement
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Add ENUM type
-- =====================================================
DO $$ BEGIN
  CREATE TYPE public.ticket_outcome AS ENUM (
    'repaired',              -- Successfully repaired, return original product
    'warranty_replacement',  -- Replace with new product from warranty_stock
    'unrepairable'           -- Cannot be repaired or replaced
  );
  COMMENT ON TYPE public.ticket_outcome IS 'Final outcome of service ticket completion';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'type ticket_outcome already exists, skipping';
END $$;

-- Grant usage to authenticated users
GRANT USAGE ON TYPE public.ticket_outcome TO authenticated;

-- =====================================================
-- Step 2: Add columns to service_tickets
-- =====================================================
ALTER TABLE public.service_tickets
ADD COLUMN IF NOT EXISTS outcome public.ticket_outcome,
ADD COLUMN IF NOT EXISTS replacement_product_id UUID REFERENCES public.physical_products(id);

-- Add comments
COMMENT ON COLUMN public.service_tickets.outcome IS
'Final result of ticket processing: repaired (fixed original), warranty_replacement (issued new product), unrepairable (could not fix)';

COMMENT ON COLUMN public.service_tickets.replacement_product_id IS
'ID of replacement product from physical_products table. Only populated when outcome = warranty_replacement';

-- =====================================================
-- Step 3: Add index for replacement_product_id
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_service_tickets_replacement_product
ON public.service_tickets(replacement_product_id)
WHERE replacement_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_tickets_outcome
ON public.service_tickets(outcome)
WHERE outcome IS NOT NULL;

-- =====================================================
-- Step 4: Add constraint (skip if already exists)
-- =====================================================
-- Ensure replacement_product_id is only set when outcome = warranty_replacement
DO $$ BEGIN
  ALTER TABLE public.service_tickets
  ADD CONSTRAINT chk_replacement_requires_outcome CHECK (
    (outcome = 'warranty_replacement' AND replacement_product_id IS NOT NULL) OR
    (outcome != 'warranty_replacement' AND replacement_product_id IS NULL) OR
    (outcome IS NULL)
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'constraint chk_replacement_requires_outcome already exists, skipping';
END $$;

COMMIT;
