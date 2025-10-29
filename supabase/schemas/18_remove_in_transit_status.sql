-- =====================================================
-- 18_remove_in_transit_status.sql
-- =====================================================
-- REMOVE IN_TRANSIT STATUS FROM TRANSFERS
-- Simplifies transfer workflow to match receipts/issues
-- New flow: draft → pending_approval → approved → completed
-- =====================================================

-- First update any existing in_transit transfers to approved
UPDATE public.stock_transfers
SET status = 'approved'
WHERE status = 'in_transit';

-- Drop and recreate the enum without in_transit
ALTER TABLE public.stock_transfers
  ALTER COLUMN status TYPE TEXT;

DROP TYPE IF EXISTS public.transfer_status;

CREATE TYPE public.transfer_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'completed',
  'cancelled'
);

ALTER TABLE public.stock_transfers
  ALTER COLUMN status TYPE public.transfer_status
  USING status::public.transfer_status;

COMMENT ON TYPE public.transfer_status IS 'Simplified workflow status for stock transfers (removed in_transit)';

GRANT USAGE ON TYPE public.transfer_status TO authenticated;
