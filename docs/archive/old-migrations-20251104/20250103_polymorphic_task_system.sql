-- =====================================================
-- Polymorphic Task System Migration
-- =====================================================
-- Version: 1.0
-- Date: 2025-01-03
-- Phase: 1 - Foundation
--
-- This migration introduces the polymorphic task management system
-- that allows tasks to be associated with any entity type, not just
-- service tickets. This enables unified task management across:
-- - Service Tickets
-- - Inventory Receipts
-- - Inventory Issues
-- - Inventory Transfers
-- - Service Requests
--
-- IMPORTANT: This is a NON-BREAKING migration. service_ticket_tasks
-- table remains intact. The migration strategy is:
-- 1. Create new entity_type ENUM and entity_tasks table
-- 2. Keep existing service_ticket_tasks for backward compatibility
-- 3. Phase 2 will migrate data and deprecate old table
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ENTITY TYPE ENUM
-- =====================================================

DROP TYPE IF EXISTS public.entity_type CASCADE;
CREATE TYPE public.entity_type AS ENUM (
  'service_ticket',      -- Service repair/warranty tickets
  'inventory_receipt',   -- Goods receipt notes (GRN)
  'inventory_issue',     -- Goods issue notes (GIN)
  'inventory_transfer',  -- Stock transfers between warehouses
  'service_request'      -- Customer service requests
);

COMMENT ON TYPE public.entity_type IS 'Entity types that can have associated tasks in the polymorphic task system';

-- Grant usage to authenticated users
GRANT USAGE ON TYPE public.entity_type TO authenticated;

-- =====================================================
-- STEP 2: CREATE ENTITY_TASKS TABLE (POLYMORPHIC)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.entity_tasks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic Entity Reference
  entity_type public.entity_type NOT NULL,
  entity_id UUID NOT NULL,

  -- Task Reference (from task library)
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE RESTRICT,

  -- Workflow Reference (which workflow this task belongs to)
  workflow_task_id UUID REFERENCES public.workflow_tasks(id) ON DELETE SET NULL,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,

  -- Task Details (denormalized for performance and immutability)
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sequence_order INT NOT NULL,

  -- Task Status & Assignment
  status public.task_status NOT NULL DEFAULT 'pending',
  is_required BOOLEAN NOT NULL DEFAULT true,
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Timing & Duration
  estimated_duration_minutes INT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,

  -- Completion & Blocking
  completion_notes TEXT,
  blocked_reason TEXT,

  -- Metadata (extensible JSON for entity-specific data)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT entity_tasks_sequence_positive CHECK (sequence_order > 0),
  CONSTRAINT entity_tasks_completed_requires_notes CHECK (
    status != 'completed' OR completion_notes IS NOT NULL
  ),
  CONSTRAINT entity_tasks_blocked_requires_reason CHECK (
    status != 'blocked' OR blocked_reason IS NOT NULL
  ),
  CONSTRAINT entity_tasks_started_at_before_completed CHECK (
    started_at IS NULL OR completed_at IS NULL OR started_at <= completed_at
  ),
  CONSTRAINT entity_tasks_entity_sequence_unique UNIQUE(entity_type, entity_id, sequence_order)
);

COMMENT ON TABLE public.entity_tasks IS 'Polymorphic task instances that can be associated with any entity type (tickets, receipts, transfers, etc.)';
COMMENT ON COLUMN public.entity_tasks.entity_type IS 'Type of entity this task belongs to (service_ticket, inventory_receipt, etc.)';
COMMENT ON COLUMN public.entity_tasks.entity_id IS 'UUID of the entity this task belongs to (polymorphic reference)';
COMMENT ON COLUMN public.entity_tasks.metadata IS 'Extensible JSON field for entity-specific task data (e.g., serial entry progress: {"serials_entered": 5, "serials_total": 10})';
COMMENT ON COLUMN public.entity_tasks.workflow_id IS 'Reference to the workflow this task was created from (for tracking and analytics)';
COMMENT ON COLUMN public.entity_tasks.due_date IS 'Optional deadline for task completion (for SLA tracking)';
COMMENT ON COLUMN public.entity_tasks.estimated_duration_minutes IS 'Estimated time to complete this task (from workflow template or AI prediction)';

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Core indexes for common queries
CREATE INDEX IF NOT EXISTS idx_entity_tasks_entity
  ON public.entity_tasks(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_entity_tasks_status
  ON public.entity_tasks(status)
  WHERE status IN ('pending', 'in_progress', 'blocked');

CREATE INDEX IF NOT EXISTS idx_entity_tasks_assigned_to
  ON public.entity_tasks(assigned_to_id)
  WHERE assigned_to_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_tasks_workflow
  ON public.entity_tasks(workflow_id)
  WHERE workflow_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_tasks_due_date
  ON public.entity_tasks(due_date)
  WHERE due_date IS NOT NULL AND status NOT IN ('completed', 'skipped');

-- Composite index for "My Tasks" dashboard
CREATE INDEX IF NOT EXISTS idx_entity_tasks_user_pending
  ON public.entity_tasks(assigned_to_id, status, due_date)
  WHERE assigned_to_id IS NOT NULL AND status IN ('pending', 'in_progress', 'blocked');

-- Index for task completion analytics
CREATE INDEX IF NOT EXISTS idx_entity_tasks_completed
  ON public.entity_tasks(completed_at, entity_type)
  WHERE status = 'completed';

-- GIN index for metadata JSON queries
CREATE INDEX IF NOT EXISTS idx_entity_tasks_metadata
  ON public.entity_tasks USING GIN(metadata);

-- =====================================================
-- STEP 4: UPDATE WORKFLOWS TABLE
-- =====================================================

-- Add entity_type column to workflows table
-- This allows workflows to be entity-specific
ALTER TABLE public.workflows
  ADD COLUMN IF NOT EXISTS entity_type public.entity_type;

COMMENT ON COLUMN public.workflows.entity_type IS 'Entity type this workflow applies to (NULL = legacy service_ticket workflows)';

-- Create index for workflow filtering by entity type
CREATE INDEX IF NOT EXISTS idx_workflows_entity_type
  ON public.workflows(entity_type)
  WHERE entity_type IS NOT NULL;

-- =====================================================
-- STEP 5: CREATE TASK HISTORY TABLE (POLYMORPHIC)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.entity_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.entity_tasks(id) ON DELETE CASCADE,
  entity_type public.entity_type NOT NULL,
  entity_id UUID NOT NULL,
  old_status public.task_status,
  new_status public.task_status NOT NULL,
  changed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.entity_task_history IS 'Immutable audit trail of task status changes across all entity types';

CREATE INDEX IF NOT EXISTS idx_entity_task_history_task
  ON public.entity_task_history(task_id);

CREATE INDEX IF NOT EXISTS idx_entity_task_history_entity
  ON public.entity_task_history(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_entity_task_history_created
  ON public.entity_task_history(created_at DESC);

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE TRIGGER trigger_entity_tasks_updated_at
  BEFORE UPDATE ON public.entity_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create history entry on status change
CREATE OR REPLACE FUNCTION public.entity_task_status_change_logger()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Only log if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.entity_task_history (
      task_id,
      entity_type,
      entity_id,
      old_status,
      new_status,
      changed_by_id,
      notes
    ) VALUES (
      NEW.id,
      NEW.entity_type,
      NEW.entity_id,
      OLD.status,
      NEW.status,
      NEW.assigned_to_id, -- Use assigned user as changed_by for now
      CASE
        WHEN NEW.status = 'completed' THEN NEW.completion_notes
        WHEN NEW.status = 'blocked' THEN NEW.blocked_reason
        ELSE NULL
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_entity_task_status_change
  AFTER UPDATE ON public.entity_tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.entity_task_status_change_logger();

COMMENT ON FUNCTION public.entity_task_status_change_logger() IS 'Automatically logs task status changes to entity_task_history table';

-- =====================================================
-- STEP 7: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on entity_tasks table
ALTER TABLE public.entity_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view tasks
CREATE POLICY entity_tasks_select_policy
  ON public.entity_tasks
  FOR SELECT
  USING (true);

-- Policy: Admin and Manager can insert tasks
CREATE POLICY entity_tasks_insert_policy
  ON public.entity_tasks
  FOR INSERT
  WITH CHECK (public.is_admin_or_manager());

-- Policy: Assigned user can update their tasks, Admin/Manager can update all
CREATE POLICY entity_tasks_update_policy
  ON public.entity_tasks
  FOR UPDATE
  USING (
    assigned_to_id = auth.uid() OR public.is_admin_or_manager()
  );

-- Policy: Only Admin can delete tasks
CREATE POLICY entity_tasks_delete_policy
  ON public.entity_tasks
  FOR DELETE
  USING (public.is_admin());

-- Enable RLS on entity_task_history
ALTER TABLE public.entity_task_history ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view history
CREATE POLICY entity_task_history_select_policy
  ON public.entity_task_history
  FOR SELECT
  USING (true);

-- Policy: No manual inserts/updates/deletes (managed by trigger)
CREATE POLICY entity_task_history_no_manual_changes
  ON public.entity_task_history
  FOR ALL
  USING (false);

-- =====================================================
-- STEP 8: GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.entity_tasks TO authenticated;
GRANT DELETE ON public.entity_tasks TO authenticated; -- RLS will restrict to admin only
GRANT SELECT ON public.entity_task_history TO authenticated;

-- Grant sequence usage for auto-incrementing IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES (For Testing)
-- =====================================================

-- Verify entity_type ENUM values
-- SELECT unnest(enum_range(NULL::public.entity_type)) AS entity_type;

-- Verify entity_tasks table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'entity_tasks'
-- ORDER BY ordinal_position;

-- Verify indexes created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'entity_tasks';

-- =====================================================
-- ROLLBACK SCRIPT (For Emergency Use)
-- =====================================================

/*
-- ROLLBACK INSTRUCTIONS:
-- Run the following commands to undo this migration:

-- 1. Drop triggers
DROP TRIGGER IF EXISTS trigger_entity_task_status_change ON public.entity_tasks;
DROP FUNCTION IF EXISTS public.entity_task_status_change_logger();
DROP TRIGGER IF EXISTS trigger_entity_tasks_updated_at ON public.entity_tasks;

-- 2. Drop tables
DROP TABLE IF EXISTS public.entity_task_history CASCADE;
DROP TABLE IF EXISTS public.entity_tasks CASCADE;

-- 3. Remove entity_type column from workflows
ALTER TABLE public.workflows DROP COLUMN IF EXISTS entity_type;

-- 4. Drop enum
DROP TYPE IF EXISTS public.entity_type CASCADE;

-- 5. Revoke grants (already cascaded with table drops)
-- REVOKE ALL ON public.entity_tasks FROM authenticated;
-- REVOKE ALL ON public.entity_task_history FROM authenticated;

*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250103_polymorphic_task_system completed successfully';
  RAISE NOTICE 'Created: entity_type ENUM, entity_tasks table, entity_task_history table';
  RAISE NOTICE 'Created: 8 indexes for performance optimization';
  RAISE NOTICE 'Added: entity_type column to workflows table';
  RAISE NOTICE 'Next steps: Create entity adapters and migrate service_ticket_tasks data';
END $$;
