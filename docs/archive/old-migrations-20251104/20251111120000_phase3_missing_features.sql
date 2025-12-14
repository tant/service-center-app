-- =====================================================
-- Phase 3: Missing Features Fix
-- Migration: 20251111120000_phase3_missing_features.sql
-- Created: November 3, 2025
-- =====================================================

-- This migration adds missing features identified during Phase 3 review:
-- 1. task_attachments.uploaded_by column
-- 2. count_workflow_usage() function for safe workflow deletion
-- 3. Supabase storage bucket for task attachments

BEGIN;

-- =====================================================
-- 1. ADD UPLOADED_BY COLUMN TO TASK_ATTACHMENTS
-- =====================================================

ALTER TABLE public.task_attachments
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id);

COMMENT ON COLUMN public.task_attachments.uploaded_by IS
'User who uploaded this attachment. Required for audit trail and permission checks.';

-- Backfill uploaded_by for existing attachments (if any)
-- Set to the task assignee as a reasonable default
UPDATE public.task_attachments att
SET uploaded_by = et.assigned_to_id
FROM public.entity_tasks et
WHERE att.task_id = et.id
  AND att.uploaded_by IS NULL;

-- Make uploaded_by NOT NULL after backfill
ALTER TABLE public.task_attachments
ALTER COLUMN uploaded_by SET NOT NULL;

-- =====================================================
-- 2. COUNT WORKFLOW USAGE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.count_workflow_usage(p_workflow_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Count service tickets using this workflow
  SELECT COUNT(*) INTO v_count
  FROM public.service_tickets
  WHERE workflow_id = p_workflow_id;

  -- Add inventory receipts using this workflow
  v_count := v_count + (
    SELECT COUNT(*)
    FROM public.stock_receipts
    WHERE workflow_id = p_workflow_id
  );

  -- Note: stock_issues, stock_transfers, and service_requests
  -- don't have workflow_id columns in current schema
  -- Add them here when those tables get workflow support

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.count_workflow_usage(UUID) IS
'Counts how many entities (tickets, receipts, etc.) are using a specific workflow. Use before deleting to prevent data loss.';

-- =====================================================
-- 3. CREATE STORAGE BUCKET FOR TASK ATTACHMENTS
-- =====================================================

-- Insert storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Authenticated users can upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can upload task attachments'
  ) THEN
    CREATE POLICY "Users can upload task attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'task-attachments'
      AND auth.role() = 'authenticated'
    );
  END IF;
END $$;

-- Storage policy: Users can read attachments they have access to
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can read task attachments'
  ) THEN
    CREATE POLICY "Users can read task attachments"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'task-attachments'
      AND auth.role() = 'authenticated'
    );
  END IF;
END $$;

-- Storage policy: Users can delete their own attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete own task attachments'
  ) THEN
    CREATE POLICY "Users can delete own task attachments"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'task-attachments'
      AND auth.uid()::text = owner::text
    );
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify uploaded_by column added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'task_attachments'
  AND column_name = 'uploaded_by';

-- Verify count_workflow_usage function created
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'count_workflow_usage';

-- Verify storage bucket created
SELECT id, name, public
FROM storage.buckets
WHERE id = 'task-attachments';

-- Test count_workflow_usage function (should return 0 for non-existent workflow)
SELECT public.count_workflow_usage('00000000-0000-0000-0000-000000000000') as usage_count;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
