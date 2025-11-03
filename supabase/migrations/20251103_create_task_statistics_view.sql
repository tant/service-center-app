-- =====================================================
-- Create Task Statistics View
-- Migration: 20251103_create_task_statistics_view.sql
-- Created: November 3, 2025
-- =====================================================

BEGIN;

-- Create or replace view for task statistics
CREATE OR REPLACE VIEW public.task_statistics AS
SELECT
  t.id as task_id,
  t.name as task_name,
  t.category,
  COUNT(et.id) as total_executions,
  COUNT(et.id) FILTER (WHERE et.status = 'completed') as completed_count,
  AVG(
    EXTRACT(EPOCH FROM (et.completed_at - et.started_at)) / 3600
  )::numeric(10,2) as avg_hours,
  MIN(
    EXTRACT(EPOCH FROM (et.completed_at - et.started_at)) / 3600
  )::numeric(10,2) as min_hours,
  MAX(
    EXTRACT(EPOCH FROM (et.completed_at - et.started_at)) / 3600
  )::numeric(10,2) as max_hours,
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (et.completed_at - et.started_at)) / 3600
  )::numeric(10,2) as median_hours
FROM public.tasks t
LEFT JOIN public.entity_tasks et ON et.task_id = t.id
WHERE et.started_at IS NOT NULL
  AND et.completed_at IS NOT NULL
  AND et.status = 'completed'
GROUP BY t.id, t.name, t.category;

COMMENT ON VIEW public.task_statistics IS
'Aggregated statistics for task completion times. Includes average, min, max, and median durations.';

-- Grant access to authenticated users
GRANT SELECT ON public.task_statistics TO authenticated;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test the view
SELECT
  task_name,
  total_executions,
  completed_count,
  avg_hours,
  median_hours
FROM public.task_statistics
ORDER BY total_executions DESC
LIMIT 5;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
