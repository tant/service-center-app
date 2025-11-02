-- Add 'draft' status to service request enum
-- Draft allows staff to save incomplete requests without submitting

-- Add draft to request_status enum
ALTER TYPE public.request_status ADD VALUE 'draft' BEFORE 'submitted';

COMMENT ON TYPE public.request_status IS 'Status flow: draft (saved, not submitted) → submitted → pickingup (waiting pickup) → received (auto-creates tickets) → processing → completed';
