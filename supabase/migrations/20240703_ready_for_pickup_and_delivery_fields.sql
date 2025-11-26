-- Add ready_for_pickup status and delivery confirmation fields

-- 1) Extend ticket_status enum
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'ready_for_pickup';

-- 2) Add delivery confirmation fields to service_tickets
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_confirmed_by_id UUID REFERENCES public.profiles(id);

COMMENT ON COLUMN public.service_tickets.delivery_confirmed_at IS 'Timestamp when delivery to customer was confirmed';
COMMENT ON COLUMN public.service_tickets.delivery_confirmed_by_id IS 'profiles.id of staff who confirmed delivery';
