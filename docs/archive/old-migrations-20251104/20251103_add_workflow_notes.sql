-- =====================================================
-- Add Notes Column to Workflows
-- Migration: 20251103_add_workflow_notes.sql
-- Created: November 3, 2025
-- =====================================================

-- This migration adds a notes/documentation field to workflows table
-- to allow managers to add detailed documentation and guidelines.

BEGIN;

-- Add notes column
ALTER TABLE public.workflows
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.workflows.notes IS
'Documentation and notes for this workflow. Supports markdown formatting. Used to provide detailed instructions and guidelines for users.';

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflows'
  AND column_name = 'notes';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
