-- =====================================================
-- Add Task Time Tracking
-- Migration: 20251103_add_task_time_tracking.sql
-- Created: November 3, 2025
-- =====================================================

-- This migration adds timestamp fields to track when tasks are started
-- and completed, enabling duration calculation and analytics.

BEGIN;

-- Add started_at and completed_at timestamps
ALTER TABLE public.entity_tasks
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.entity_tasks.started_at IS
'Timestamp when task was started by assignee. Used for duration tracking and analytics.';

COMMENT ON COLUMN public.entity_tasks.completed_at IS
'Timestamp when task was marked as completed. Used for duration calculation.';

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_entity_tasks_completed_at
ON public.entity_tasks(completed_at)
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_tasks_started_at
ON public.entity_tasks(started_at)
WHERE started_at IS NOT NULL;

-- Add index for duration queries (both timestamps needed)
CREATE INDEX IF NOT EXISTS idx_entity_tasks_duration
ON public.entity_tasks(started_at, completed_at)
WHERE started_at IS NOT NULL AND completed_at IS NOT NULL;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'entity_tasks'
  AND column_name IN ('started_at', 'completed_at');

-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'entity_tasks'
  AND indexname LIKE 'idx_entity_tasks_%at'
ORDER BY indexname;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
