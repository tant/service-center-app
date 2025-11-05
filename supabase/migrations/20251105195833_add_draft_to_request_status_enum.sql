-- Add draft status to request_status enum for service request drafts
ALTER TYPE public.request_status
ADD VALUE IF NOT EXISTS 'draft' BEFORE 'submitted';
