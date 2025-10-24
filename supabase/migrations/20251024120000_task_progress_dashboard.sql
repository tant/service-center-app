-- Migration: Task Progress Dashboard (Story 1.16)
-- Description: Create views and functions for manager task progress dashboard
-- Created: 2025-10-24

-- =====================================================
-- TASK PROGRESS SUMMARY VIEW
-- =====================================================
-- Aggregates task metrics across all active tickets for dashboard

DROP VIEW IF EXISTS v_task_progress_summary CASCADE;
CREATE VIEW v_task_progress_summary AS
SELECT
  -- Overall Metrics
  COUNT(DISTINCT stt.ticket_id) FILTER (WHERE st.status NOT IN ('completed', 'cancelled')) AS active_tickets,
  COUNT(*) FILTER (WHERE stt.status = 'pending') AS tasks_pending,
  COUNT(*) FILTER (WHERE stt.status = 'in_progress') AS tasks_in_progress,
  COUNT(*) FILTER (WHERE stt.status = 'completed') AS tasks_completed,
  COUNT(*) FILTER (WHERE stt.status = 'blocked') AS tasks_blocked,
  COUNT(*) FILTER (WHERE stt.status = 'skipped') AS tasks_skipped,
  COUNT(*) AS total_tasks,

  -- Completion Metrics
  AVG(
    EXTRACT(EPOCH FROM (stt.completed_at - stt.started_at)) / 3600
  ) FILTER (WHERE stt.completed_at IS NOT NULL) AS avg_completion_hours,

  -- Active Task Metrics (non-completed tickets)
  COUNT(*) FILTER (
    WHERE st.status NOT IN ('completed', 'cancelled')
    AND stt.status IN ('pending', 'in_progress', 'blocked')
  ) AS active_tasks,

  -- Blocked Task Details
  COUNT(DISTINCT stt.ticket_id) FILTER (WHERE stt.status = 'blocked') AS tickets_with_blocked_tasks,

  -- Time-based Metrics (last 7 days)
  COUNT(*) FILTER (
    WHERE stt.completed_at >= NOW() - INTERVAL '7 days'
  ) AS tasks_completed_last_7_days,

  COUNT(*) FILTER (
    WHERE stt.completed_at >= NOW() - INTERVAL '30 days'
  ) AS tasks_completed_last_30_days

FROM service_ticket_tasks stt
JOIN service_tickets st ON st.id = stt.ticket_id;

COMMENT ON VIEW v_task_progress_summary IS 'Story 1.16: Aggregated task metrics for manager dashboard';

-- =====================================================
-- TECHNICIAN WORKLOAD VIEW
-- =====================================================
-- Shows task distribution and completion rate per technician

DROP VIEW IF EXISTS v_technician_workload CASCADE;
CREATE VIEW v_technician_workload AS
SELECT
  p.id AS technician_id,
  p.full_name AS technician_name,
  p.email AS technician_email,
  p.role,

  -- Task counts
  COUNT(*) AS total_assigned_tasks,
  COUNT(*) FILTER (WHERE stt.status = 'pending') AS tasks_pending,
  COUNT(*) FILTER (WHERE stt.status = 'in_progress') AS tasks_in_progress,
  COUNT(*) FILTER (WHERE stt.status = 'completed') AS tasks_completed,
  COUNT(*) FILTER (WHERE stt.status = 'blocked') AS tasks_blocked,

  -- Active tickets assigned
  COUNT(DISTINCT stt.ticket_id) FILTER (
    WHERE st.status NOT IN ('completed', 'cancelled')
  ) AS active_tickets_assigned,

  -- Completion rate (percentage)
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE stt.status = 'completed')::NUMERIC / COUNT(*)) * 100, 2)
    ELSE 0
  END AS completion_rate_percent,

  -- Average completion time in hours
  AVG(
    EXTRACT(EPOCH FROM (stt.completed_at - stt.started_at)) / 3600
  ) FILTER (WHERE stt.completed_at IS NOT NULL) AS avg_completion_hours,

  -- Recent activity
  COUNT(*) FILTER (
    WHERE stt.completed_at >= NOW() - INTERVAL '7 days'
  ) AS tasks_completed_last_7_days,

  MAX(stt.updated_at) AS last_activity_at

FROM profiles p
LEFT JOIN service_ticket_tasks stt ON stt.assigned_to_id = p.id
LEFT JOIN service_tickets st ON st.id = stt.ticket_id
WHERE p.role IN ('technician', 'admin', 'manager')
GROUP BY p.id, p.full_name, p.email, p.role
ORDER BY tasks_in_progress DESC, tasks_pending DESC;

COMMENT ON VIEW v_technician_workload IS 'Story 1.16: Technician task workload and performance metrics';

-- =====================================================
-- TICKETS WITH BLOCKED TASKS VIEW
-- =====================================================
-- Lists tickets that have blocked tasks for manager attention

DROP VIEW IF EXISTS v_tickets_with_blocked_tasks CASCADE;
CREATE VIEW v_tickets_with_blocked_tasks AS
SELECT
  st.id AS ticket_id,
  st.ticket_number,
  st.status AS ticket_status,
  c.name AS customer_name,
  c.phone AS customer_phone,
  COUNT(stt.id) FILTER (WHERE stt.status = 'blocked') AS blocked_tasks_count,
  ARRAY_AGG(
    jsonb_build_object(
      'task_id', stt.id,
      'task_name', stt.name,
      'blocked_reason', stt.blocked_reason,
      'assigned_to_name', p.full_name,
      'assigned_to_id', p.id,
      'updated_at', stt.updated_at
    ) ORDER BY stt.sequence_order
  ) FILTER (WHERE stt.status = 'blocked') AS blocked_tasks,
  MIN(stt.updated_at) FILTER (WHERE stt.status = 'blocked') AS first_blocked_at,
  MAX(stt.updated_at) FILTER (WHERE stt.status = 'blocked') AS last_blocked_at

FROM service_tickets st
JOIN service_ticket_tasks stt ON stt.ticket_id = st.id
LEFT JOIN customers c ON c.id = st.customer_id
LEFT JOIN profiles p ON p.id = stt.assigned_to_id
WHERE st.status NOT IN ('completed', 'cancelled')
  AND EXISTS (
    SELECT 1 FROM service_ticket_tasks
    WHERE ticket_id = st.id AND status = 'blocked'
  )
GROUP BY st.id, st.ticket_number, st.status, c.name, c.phone
ORDER BY blocked_tasks_count DESC, first_blocked_at ASC;

COMMENT ON VIEW v_tickets_with_blocked_tasks IS 'Story 1.16: Tickets with blocked tasks requiring manager attention';

-- =====================================================
-- TASK COMPLETION TIMELINE FUNCTION
-- =====================================================
-- Returns task completion data for timeline charts

CREATE OR REPLACE FUNCTION get_task_completion_timeline(
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  date DATE,
  tasks_completed BIGINT,
  tasks_started BIGINT,
  avg_completion_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.date::DATE,
    COUNT(stt.id) FILTER (WHERE stt.completed_at::DATE = d.date) AS tasks_completed,
    COUNT(stt.id) FILTER (WHERE stt.started_at::DATE = d.date) AS tasks_started,
    AVG(
      EXTRACT(EPOCH FROM (stt.completed_at - stt.started_at)) / 3600
    ) FILTER (WHERE stt.completed_at::DATE = d.date) AS avg_completion_hours
  FROM generate_series(
    CURRENT_DATE - days_back + 1,
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) AS d(date)
  LEFT JOIN service_ticket_tasks stt ON (
    stt.completed_at::DATE = d.date OR stt.started_at::DATE = d.date
  )
  GROUP BY d.date
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_task_completion_timeline IS 'Story 1.16: Task completion timeline for dashboard charts';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
-- Optimize dashboard queries

-- Index for task completion time calculations
CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_completion_time
ON service_ticket_tasks(completed_at, started_at)
WHERE completed_at IS NOT NULL;

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_completed_date
ON service_ticket_tasks(completed_at)
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_ticket_tasks_started_date
ON service_ticket_tasks(started_at)
WHERE started_at IS NOT NULL;
