-- =====================================================
-- Data Migration: service_ticket_tasks → entity_tasks
-- =====================================================
-- Version: 1.0
-- Date: 2025-01-04
-- Phase: 1 - Week 4 (Testing & Migration)
--
-- This migration copies all existing service_ticket_tasks data
-- to the new polymorphic entity_tasks table. This is a safe,
-- non-destructive migration that preserves all existing data.
--
-- IMPORTANT: This migration is IDEMPOTENT and can be run multiple
-- times safely. It uses INSERT ... ON CONFLICT DO NOTHING to avoid
-- duplicates if the migration is run more than once.
--
-- Migration Strategy:
-- 1. Copy all service_ticket_tasks to entity_tasks
-- 2. Preserve all task IDs (use same UUIDs)
-- 3. Set entity_type = 'service_ticket'
-- 4. Set entity_id = ticket_id
-- 5. Populate workflow_id from workflow_task_id lookup
-- 6. Keep service_ticket_tasks table for backward compatibility
-- =====================================================

-- =====================================================
-- STEP 1: VERIFY PREREQUISITES
-- =====================================================

DO $$
BEGIN
  -- Check if entity_tasks table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'entity_tasks'
  ) THEN
    RAISE EXCEPTION 'entity_tasks table does not exist. Run 20250103_polymorphic_task_system.sql first.';
  END IF;

  -- Check if service_ticket_tasks table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'service_ticket_tasks'
  ) THEN
    RAISE NOTICE 'service_ticket_tasks table does not exist. Skipping migration (no data to migrate).';
    RETURN;
  END IF;

  RAISE NOTICE 'Prerequisites verified. Starting migration...';
END $$;

-- =====================================================
-- STEP 2: MIGRATE DATA FROM service_ticket_tasks
-- =====================================================

-- Insert all service_ticket_tasks into entity_tasks
-- Using ON CONFLICT DO NOTHING for idempotency
INSERT INTO public.entity_tasks (
  -- Use same ID to maintain referential integrity with task_history
  id,

  -- Polymorphic entity reference
  entity_type,
  entity_id,

  -- Task reference
  task_id,
  workflow_task_id,
  workflow_id,

  -- Task details (denormalized)
  name,
  description,
  sequence_order,

  -- Status & assignment
  status,
  is_required,
  assigned_to_id,

  -- Timing & duration
  estimated_duration_minutes,
  started_at,
  completed_at,
  due_date,

  -- Completion & blocking
  completion_notes,
  blocked_reason,

  -- Metadata
  metadata,

  -- Audit fields
  created_at,
  updated_at,
  created_by_id
)
SELECT
  -- Preserve original task ID
  stt.id,

  -- Set entity type to 'service_ticket'
  'service_ticket'::public.entity_type AS entity_type,

  -- Map ticket_id to entity_id
  stt.ticket_id AS entity_id,

  -- Copy task references
  stt.task_id,
  stt.workflow_task_id,

  -- Lookup workflow_id from workflow_task_id (if exists)
  wt.workflow_id,

  -- Copy task details
  stt.name,
  stt.description,
  stt.sequence_order,

  -- Copy status & assignment
  stt.status,
  stt.is_required,
  stt.assigned_to_id,

  -- Timing & duration (estimated_duration_minutes can be pulled from tasks table)
  t.estimated_duration_minutes,
  stt.started_at,
  stt.completed_at,
  NULL AS due_date, -- Not tracked in old system

  -- Copy completion & blocking info
  stt.completion_notes,
  stt.blocked_reason,

  -- Initialize empty metadata
  '{}'::jsonb AS metadata,

  -- Copy audit fields
  stt.created_at,
  stt.updated_at,

  -- Try to infer created_by from ticket (if available)
  st.created_by AS created_by_id

FROM public.service_ticket_tasks stt
LEFT JOIN public.workflow_tasks wt ON stt.workflow_task_id = wt.id
LEFT JOIN public.tasks t ON stt.task_id = t.id
LEFT JOIN public.service_tickets st ON stt.ticket_id = st.id

-- Make idempotent: skip if already migrated
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 3: MIGRATE TASK HISTORY
-- =====================================================

-- The task_history table references service_ticket_tasks(id)
-- Since we're preserving IDs, the existing task_history records
-- will continue to work. However, we should create corresponding
-- entity_task_history records for consistency.

INSERT INTO public.entity_task_history (
  id,
  task_id,
  entity_type,
  entity_id,
  old_status,
  new_status,
  changed_by_id,
  notes,
  created_at
)
SELECT
  th.id,
  th.task_id,
  'service_ticket'::public.entity_type AS entity_type,
  th.ticket_id AS entity_id,
  th.old_status,
  th.new_status,
  th.changed_by_id,
  th.notes,
  th.created_at
FROM public.task_history th
WHERE EXISTS (
  SELECT 1 FROM public.service_ticket_tasks stt
  WHERE stt.id = th.task_id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

DO $$
DECLARE
  service_ticket_tasks_count INT;
  entity_tasks_count INT;
  migrated_count INT;
  task_history_count INT;
  entity_task_history_count INT;
BEGIN
  -- Count records in source table
  SELECT COUNT(*) INTO service_ticket_tasks_count
  FROM public.service_ticket_tasks;

  -- Count records in destination table with entity_type = 'service_ticket'
  SELECT COUNT(*) INTO entity_tasks_count
  FROM public.entity_tasks
  WHERE entity_type = 'service_ticket';

  -- Count newly migrated records (from this run)
  GET DIAGNOSTICS migrated_count = ROW_COUNT;

  -- Count task history records
  SELECT COUNT(*) INTO task_history_count
  FROM public.task_history;

  SELECT COUNT(*) INTO entity_task_history_count
  FROM public.entity_task_history
  WHERE entity_type = 'service_ticket';

  -- Log migration results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Source: service_ticket_tasks = % records', service_ticket_tasks_count;
  RAISE NOTICE 'Target: entity_tasks (service_ticket) = % records', entity_tasks_count;
  RAISE NOTICE 'Newly migrated in this run = % records', migrated_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'History Migration:';
  RAISE NOTICE 'Source: task_history = % records', task_history_count;
  RAISE NOTICE 'Target: entity_task_history = % records', entity_task_history_count;
  RAISE NOTICE '========================================';

  -- Verify migration success
  IF entity_tasks_count < service_ticket_tasks_count THEN
    RAISE WARNING 'Migration incomplete: entity_tasks has fewer records than service_ticket_tasks';
  ELSIF entity_tasks_count = service_ticket_tasks_count THEN
    RAISE NOTICE 'Migration SUCCESSFUL: All % service ticket tasks migrated', service_ticket_tasks_count;
  ELSE
    RAISE NOTICE 'Migration complete with % service ticket tasks', entity_tasks_count;
  END IF;
END $$;

-- =====================================================
-- STEP 5: CREATE BACKWARD COMPATIBILITY VIEW
-- =====================================================

-- Create a view that maps entity_tasks back to the old service_ticket_tasks structure
-- This allows existing queries to continue working without modification
CREATE OR REPLACE VIEW public.service_ticket_tasks_view AS
SELECT
  et.id,
  et.entity_id AS ticket_id,
  et.task_id,
  et.workflow_task_id,
  et.name,
  et.description,
  et.sequence_order,
  et.status,
  et.is_required,
  et.assigned_to_id,
  et.started_at,
  et.completed_at,
  et.completion_notes,
  et.blocked_reason,
  et.created_at,
  et.updated_at
FROM public.entity_tasks et
WHERE et.entity_type = 'service_ticket';

COMMENT ON VIEW public.service_ticket_tasks_view IS 'Backward compatibility view for service_ticket_tasks queries. Maps entity_tasks where entity_type = service_ticket.';

-- =====================================================
-- STEP 6: GRANT PERMISSIONS ON VIEW
-- =====================================================

GRANT SELECT ON public.service_ticket_tasks_view TO authenticated;

-- =====================================================
-- MIGRATION VERIFICATION QUERIES
-- =====================================================

-- Sample verification queries (commented out - run manually if needed)

/*
-- 1. Compare record counts
SELECT 'service_ticket_tasks' AS table_name, COUNT(*) AS count FROM public.service_ticket_tasks
UNION ALL
SELECT 'entity_tasks (service_ticket)', COUNT(*) FROM public.entity_tasks WHERE entity_type = 'service_ticket';

-- 2. Verify all statuses migrated
SELECT status, COUNT(*)
FROM public.entity_tasks
WHERE entity_type = 'service_ticket'
GROUP BY status
ORDER BY status;

-- 3. Check for tasks with missing workflow_id (expected for ad-hoc tasks)
SELECT COUNT(*) AS tasks_without_workflow
FROM public.entity_tasks
WHERE entity_type = 'service_ticket' AND workflow_id IS NULL;

-- 4. Verify assigned tasks
SELECT
  p.full_name,
  COUNT(*) AS assigned_task_count
FROM public.entity_tasks et
JOIN public.profiles p ON et.assigned_to_id = p.id
WHERE et.entity_type = 'service_ticket'
GROUP BY p.full_name
ORDER BY assigned_task_count DESC;

-- 5. Check completion rate
SELECT
  status,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM public.entity_tasks
WHERE entity_type = 'service_ticket'
GROUP BY status
ORDER BY count DESC;
*/

-- =====================================================
-- ROLLBACK SCRIPT (For Emergency Use)
-- =====================================================

/*
-- ROLLBACK INSTRUCTIONS:
-- To undo this migration (if needed), run:

-- 1. Drop the view
DROP VIEW IF EXISTS public.service_ticket_tasks_view;

-- 2. Delete migrated records from entity_tasks
DELETE FROM public.entity_tasks WHERE entity_type = 'service_ticket';

-- 3. Delete migrated records from entity_task_history
DELETE FROM public.entity_task_history WHERE entity_type = 'service_ticket';

-- 4. Verify deletion
SELECT COUNT(*) FROM public.entity_tasks WHERE entity_type = 'service_ticket';
-- Should return 0

-- Original service_ticket_tasks and task_history tables remain intact
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 20250104_migrate_service_ticket_tasks_data COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify data integrity with verification queries';
  RAISE NOTICE '2. Test frontend with migrated data';
  RAISE NOTICE '3. Update application code to use entity_tasks';
  RAISE NOTICE '4. service_ticket_tasks table remains for backward compatibility';
  RAISE NOTICE '5. Consider deprecating service_ticket_tasks in Phase 2';
  RAISE NOTICE '========================================';
END $$;
