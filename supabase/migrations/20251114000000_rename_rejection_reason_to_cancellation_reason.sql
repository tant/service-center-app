-- Migration: Rename rejection_reason to cancellation_reason
-- Date: 2025-11-14
-- Purpose: Align terminology with status enum (cancelled not rejected)
-- Impact: service_requests table only

-- Step 1: Rename column
ALTER TABLE public.service_requests
  RENAME COLUMN rejection_reason TO cancellation_reason;

-- Step 2: Drop old constraint
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_rejected_requires_reason;

-- Step 3: Add new constraint with updated name
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_cancelled_requires_reason
  CHECK (status != 'cancelled' OR cancellation_reason IS NOT NULL);

-- Step 4: Add column comment
COMMENT ON COLUMN public.service_requests.cancellation_reason IS
  'Reason for cancellation (required when status = cancelled). Can be staff rejection, customer withdrawal, duplicate request, etc.';
