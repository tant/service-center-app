-- =====================================================
-- Fix service_tickets FK constraints to reference profiles(id)
-- =====================================================
-- ISSUE: service_tickets.created_by and updated_by reference profiles(user_id)
--        but service_requests.reviewed_by_id references profiles(id)
--        This causes FK violation when creating tickets from service requests
--
-- SOLUTION: Change FK to reference profiles(id) to match newer tables
-- =====================================================

-- Step 1: Drop old FK constraints first (to allow data migration)
-- Drop old FK constraints
ALTER TABLE public.service_tickets
  DROP CONSTRAINT IF EXISTS service_tickets_created_by_fkey;

ALTER TABLE public.service_tickets
  DROP CONSTRAINT IF EXISTS service_tickets_updated_by_fkey;

-- Also drop assigned_to FK
ALTER TABLE public.service_tickets
  DROP CONSTRAINT IF EXISTS service_tickets_assigned_to_fkey;

-- Step 2: Migrate data from user_id to id
-- Update created_by: user_id → id
UPDATE public.service_tickets
SET created_by = p.id
FROM public.profiles p
WHERE service_tickets.created_by = p.user_id;

-- Update updated_by: user_id → id
UPDATE public.service_tickets
SET updated_by = p.id
FROM public.profiles p
WHERE service_tickets.updated_by = p.user_id;

-- Update assigned_to: user_id → id
UPDATE public.service_tickets
SET assigned_to = p.id
FROM public.profiles p
WHERE service_tickets.assigned_to = p.user_id;

-- Step 3: Add new FK constraints to profiles(id)
ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES public.profiles(id);

ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);

COMMENT ON CONSTRAINT service_tickets_created_by_fkey ON public.service_tickets IS
  'References profiles(id) to match service_requests.reviewed_by_id pattern';

COMMENT ON CONSTRAINT service_tickets_updated_by_fkey ON public.service_tickets IS
  'References profiles(id) for consistency with created_by';

COMMENT ON CONSTRAINT service_tickets_assigned_to_fkey ON public.service_tickets IS
  'References profiles(id) for consistency with other FK constraints';
