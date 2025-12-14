-- =====================================================
-- 701_task_statistics_view.sql
-- =====================================================
-- Reporting view for task statistics and performance analytics.
--
-- ORDER: 700-799 (Views)
-- DEPENDENCIES: entity_tasks table
-- =====================================================

CREATE OR REPLACE VIEW public.v_task_statistics AS
SELECT
  t.id AS task_id,
  t.name AS task_name,
  t.entity_type,
  t.entity_id,
  t.status,
  t.assigned_to_id,
  p.full_name AS assigned_to_name,
  t.created_at,
  t.started_at,
  t.completed_at,
  t.due_date,
  -- Actual duration in minutes
  CASE
    WHEN t.completed_at IS NOT NULL AND t.started_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (t.completed_at - t.started_at)) / 60
    ELSE NULL
  END AS actual_duration_minutes,
  -- Estimated duration
  t.estimated_duration_minutes,
  -- Check if task was overdue
  CASE
    WHEN t.completed_at IS NOT NULL AND t.due_date IS NOT NULL
    THEN t.completed_at > t.due_date
    ELSE NULL
  END AS is_overdue,
  -- Time overdue in minutes
  CASE
    WHEN t.completed_at > t.due_date
    THEN EXTRACT(EPOCH FROM (t.completed_at - t.due_date)) / 60
    ELSE 0
  END AS overdue_minutes
FROM
  public.entity_tasks t
LEFT JOIN
  public.profiles p ON t.assigned_to_id = p.id;

COMMENT ON VIEW public.v_task_statistics IS 'Provides detailed statistics for each task, including actual vs. estimated duration and overdue status, for performance analytics. Security is inherited from underlying entity_tasks table RLS policies.';

-- Grant access to authenticated users (security inherited from entity_tasks RLS)
GRANT SELECT ON public.v_task_statistics TO authenticated;
