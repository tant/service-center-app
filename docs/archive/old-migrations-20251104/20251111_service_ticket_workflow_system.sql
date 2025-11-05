-- =====================================================
-- Phase 3: Service Ticket Workflow System
-- Migration: 20251111_service_ticket_workflow_system.sql
-- Created: November 4, 2025 (Week 9 Day 1)
-- =====================================================

-- This migration adds:
-- 1. workflow_id column to service_tickets
-- 2. task_comments table (NEW)
-- 3. task_attachments table (NEW)
-- 4. Database triggers for auto task creation/completion
-- 5. Indexes for performance
-- 6. RLS policies for security

BEGIN;

-- =====================================================
-- 1. ADD WORKFLOW SUPPORT TO SERVICE TICKETS
-- =====================================================

-- Add workflow_id column to service_tickets
ALTER TABLE public.service_tickets
ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES public.workflows(id);

-- Index for workflow lookup
CREATE INDEX IF NOT EXISTS idx_service_tickets_workflow_id
ON public.service_tickets(workflow_id)
WHERE workflow_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN public.service_tickets.workflow_id IS
'Workflow template assigned to this ticket. Tasks auto-created based on workflow when ticket status changes to in_progress.';

-- =====================================================
-- 2. CREATE TASK COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.entity_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  comment TEXT NOT NULL CHECK (LENGTH(comment) >= 1 AND LENGTH(comment) <= 5000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id
ON public.task_comments(task_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_created_at
ON public.task_comments(task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_comments_user_id
ON public.task_comments(user_id);

-- RLS Policies
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Read: Anyone can read comments on tasks they have access to
DROP POLICY IF EXISTS "Users can read comments on accessible tasks" ON public.task_comments;
CREATE POLICY "Users can read comments on accessible tasks"
ON public.task_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.entity_tasks
    WHERE entity_tasks.id = task_comments.task_id
    AND (
      entity_tasks.assigned_to_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
      )
    )
  )
);

-- Create: Authenticated users can add comments to accessible tasks
DROP POLICY IF EXISTS "Users can add comments to accessible tasks" ON public.task_comments;
CREATE POLICY "Users can add comments to accessible tasks"
ON public.task_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.entity_tasks
    WHERE entity_tasks.id = task_comments.task_id
    AND (
      entity_tasks.assigned_to_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
      )
    )
  )
);

-- Update: Users can edit their own comments within 15 minutes
DROP POLICY IF EXISTS "Users can edit own comments within 15 min" ON public.task_comments;
CREATE POLICY "Users can edit own comments within 15 min"
ON public.task_comments FOR UPDATE
USING (
  user_id = auth.uid()
  AND created_at > NOW() - INTERVAL '15 minutes'
)
WITH CHECK (
  user_id = auth.uid()
);

-- Delete: Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete own comments" ON public.task_comments;
CREATE POLICY "Users can delete own comments"
ON public.task_comments FOR DELETE
USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE public.task_comments IS 'Comment threads on tasks for async collaboration';
COMMENT ON COLUMN public.task_comments.comment IS 'Comment text (max 5000 characters)';

-- =====================================================
-- 3. CREATE TASK ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.entity_tasks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),

  -- File metadata
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size_bytes INT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880), -- Max 5MB
  mime_type TEXT NOT NULL CHECK (mime_type IN (
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf'
  )),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id
ON public.task_attachments(task_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_comment_id
ON public.task_attachments(comment_id)
WHERE comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_attachments_user_id
ON public.task_attachments(user_id);

-- RLS Policies
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Read: Anyone can read attachments on accessible tasks
DROP POLICY IF EXISTS "Users can read attachments on accessible tasks" ON public.task_attachments;
CREATE POLICY "Users can read attachments on accessible tasks"
ON public.task_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.entity_tasks
    WHERE entity_tasks.id = task_attachments.task_id
    AND (
      entity_tasks.assigned_to_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
      )
    )
  )
);

-- Create: Authenticated users can upload attachments to accessible tasks
DROP POLICY IF EXISTS "Users can upload attachments to accessible tasks" ON public.task_attachments;
CREATE POLICY "Users can upload attachments to accessible tasks"
ON public.task_attachments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.entity_tasks
    WHERE entity_tasks.id = task_attachments.task_id
    AND (
      entity_tasks.assigned_to_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
      )
    )
  )
);

-- Delete: Users can delete their own attachments OR admins can delete any
DROP POLICY IF EXISTS "Users can delete attachments" ON public.task_attachments;
CREATE POLICY "Users can delete attachments"
ON public.task_attachments FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Comments
COMMENT ON TABLE public.task_attachments IS 'File attachments for tasks (max 5MB per file)';
COMMENT ON COLUMN public.task_attachments.file_path IS 'Supabase Storage path: task-attachments/{task_id}/{uuid}-{filename}';
COMMENT ON COLUMN public.task_attachments.file_size_bytes IS 'File size in bytes (max 5MB = 5242880 bytes)';

-- =====================================================
-- 4. DATABASE TRIGGER: AUTO-CREATE SERVICE TICKET TASKS
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_create_service_ticket_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_workflow_id UUID;
  v_workflow_name TEXT;
  v_workflow_task RECORD;
  v_task_sequence INT := 1;
  v_due_date TIMESTAMPTZ;
BEGIN
  -- Only proceed if status changed TO 'in_progress'
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN

    v_workflow_id := NEW.workflow_id;

    -- Check 1: Workflow assigned?
    IF v_workflow_id IS NULL THEN
      RAISE NOTICE 'Service ticket % has no workflow assigned, skipping task creation', NEW.id;
      RETURN NEW;
    END IF;

    -- Check 2: Workflow exists and is active?
    SELECT name INTO v_workflow_name
    FROM public.workflows
    WHERE id = v_workflow_id AND is_active = true AND entity_type = 'service_ticket';

    IF NOT FOUND THEN
      RAISE WARNING 'Workflow % not found or inactive for ticket %', v_workflow_id, NEW.id;
      RETURN NEW;
    END IF;

    -- Check 3: Idempotency - tasks already created?
    PERFORM 1
    FROM public.entity_tasks
    WHERE entity_type = 'service_ticket' AND entity_id = NEW.id
    LIMIT 1;

    IF FOUND THEN
      RAISE NOTICE 'Tasks already exist for ticket %, skipping creation', NEW.id;
      RETURN NEW;
    END IF;

    -- Calculate due date: 7 days from now
    v_due_date := NOW() + INTERVAL '7 days';

    -- Create tasks from workflow template
    FOR v_workflow_task IN
      SELECT
        wt.id as workflow_task_id,
        wt.sequence_order,
        wt.is_required,
        t.id as task_id,
        t.name as task_name,
        t.description as task_description,
        t.estimated_duration_minutes,
        t.required_role
      FROM public.workflow_tasks wt
      JOIN public.tasks t ON t.id = wt.task_id
      WHERE wt.workflow_id = v_workflow_id
      ORDER BY wt.sequence_order ASC
    LOOP
      -- Determine task type from name (diagnosis, repair, testing)
      INSERT INTO public.entity_tasks (
        id,
        entity_type,
        entity_id,
        workflow_id,
        name,
        description,
        sequence_order,
        is_required,
        status,
        assigned_to_id,
        due_date,
        metadata
      ) VALUES (
        gen_random_uuid(),
        'service_ticket',
        NEW.id,
        v_workflow_id,
        v_workflow_task.task_name,
        v_workflow_task.task_description,
        v_workflow_task.sequence_order,
        v_workflow_task.is_required,
        'pending',
        NEW.assigned_to_id, -- Auto-assign to ticket assignee
        v_due_date,
        jsonb_build_object(
          'task_type', LOWER(REPLACE(v_workflow_task.task_name, ' ', '_')),
          'ticket_number', NEW.ticket_number,
          'workflow_task_id', v_workflow_task.workflow_task_id,
          'estimated_duration_minutes', v_workflow_task.estimated_duration_minutes,
          'required_role', v_workflow_task.required_role,
          'depends_on', CASE
            WHEN v_workflow_task.sequence_order > 1 THEN 'previous'
            ELSE NULL
          END,
          'auto_created', true,
          'created_at', NOW()
        )
      );

      v_task_sequence := v_task_sequence + 1;
    END LOOP;

    RAISE NOTICE 'Created % tasks for service ticket % using workflow %',
      v_task_sequence - 1, NEW.ticket_number, v_workflow_name;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail ticket update
    RAISE WARNING 'Error in auto_create_service_ticket_tasks for ticket %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_auto_create_service_ticket_tasks ON public.service_tickets;

CREATE TRIGGER trg_auto_create_service_ticket_tasks
AFTER UPDATE OF status ON public.service_tickets
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_service_ticket_tasks();

-- Comment
COMMENT ON FUNCTION public.auto_create_service_ticket_tasks() IS
'Automatically creates tasks when service ticket status changes to in_progress. Creates one task per workflow_task in assigned workflow. Idempotent and gracefully handles errors.';

-- =====================================================
-- 5. DATABASE TRIGGER: AUTO-COMPLETE SERVICE TICKET
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_complete_service_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ticket_id UUID;
  v_ticket_status TEXT;
  v_incomplete_tasks_count INT;
BEGIN
  -- Only proceed for service_ticket entity type
  IF NEW.entity_type != 'service_ticket' THEN
    RETURN NEW;
  END IF;

  v_ticket_id := NEW.entity_id;

  -- Get current ticket status
  SELECT status INTO v_ticket_status
  FROM public.service_tickets
  WHERE id = v_ticket_id;

  IF NOT FOUND THEN
    RAISE WARNING 'Service ticket % not found', v_ticket_id;
    RETURN NEW;
  END IF;

  -- Don't auto-complete if ticket already completed or cancelled
  IF v_ticket_status IN ('completed', 'cancelled') THEN
    RETURN NEW;
  END IF;

  -- Check if this task is now completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    -- Count remaining incomplete required tasks
    SELECT COUNT(*)
    INTO v_incomplete_tasks_count
    FROM public.entity_tasks
    WHERE entity_type = 'service_ticket'
      AND entity_id = v_ticket_id
      AND is_required = true
      AND status NOT IN ('completed', 'skipped');

    -- If all required tasks complete, auto-complete ticket
    IF v_incomplete_tasks_count = 0 THEN
      UPDATE public.service_tickets
      SET
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = v_ticket_id AND status = 'in_progress';

      IF FOUND THEN
        RAISE NOTICE 'Auto-completed service ticket % (all required tasks complete)', v_ticket_id;
      END IF;
    END IF;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in auto_complete_service_ticket for task %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_auto_complete_service_ticket ON public.entity_tasks;

CREATE TRIGGER trg_auto_complete_service_ticket
AFTER UPDATE OF status ON public.entity_tasks
FOR EACH ROW
WHEN (NEW.entity_type = 'service_ticket')
EXECUTE FUNCTION public.auto_complete_service_ticket();

-- Comment
COMMENT ON FUNCTION public.auto_complete_service_ticket() IS
'Automatically completes service ticket when all required tasks are marked as completed or skipped. Only triggers for service_ticket entity type.';

-- =====================================================
-- 6. PERFORMANCE INDEXES
-- =====================================================

-- Service ticket task queries (dashboard)
CREATE INDEX IF NOT EXISTS idx_entity_tasks_service_ticket_assigned
ON public.entity_tasks(entity_type, assigned_to_id, status)
WHERE entity_type = 'service_ticket';

-- Task dependency lookups (canStartTask)
CREATE INDEX IF NOT EXISTS idx_entity_tasks_sequence
ON public.entity_tasks(entity_id, sequence_order)
WHERE entity_type IN ('service_ticket', 'inventory_receipt');

-- Multi-entity task queries (all entity types)
CREATE INDEX IF NOT EXISTS idx_entity_tasks_multi_entity
ON public.entity_tasks(assigned_to_id, entity_type, status, due_date DESC);

-- Workflow assignment queries
CREATE INDEX IF NOT EXISTS idx_workflows_entity_type_active
ON public.workflows(entity_type, is_active)
WHERE is_active = true;

-- =====================================================
-- 7. SUPABASE STORAGE BUCKET (task-attachments)
-- =====================================================

-- Note: Storage buckets must be created via Supabase Dashboard or CLI
-- This is documented here for reference

-- Create storage bucket (run via Supabase CLI or Dashboard):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('task-attachments', 'task-attachments', false);

-- Storage policy: Users can upload files
-- CREATE POLICY "Users can upload task attachments"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'task-attachments'
--   AND auth.role() = 'authenticated'
-- );

-- Storage policy: Users can read attachments they have access to
-- CREATE POLICY "Users can read task attachments"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'task-attachments'
--   AND auth.role() = 'authenticated'
-- );

-- =====================================================
-- 8. SEED DATA: DEFAULT TASK LIBRARY (OPTIONAL)
-- =====================================================

-- NOTE: Seed data is intentionally commented out because it requires an admin user to exist first.
-- After system setup, create tasks and workflows via the Admin UI at /admin/workflows

-- Example tasks to create manually via UI:
-- 1. Diagnosis - Diagnose the issue and identify root cause (30 min)
-- 2. Repair - Repair or replace faulty components (60 min)
-- 3. Testing - Test functionality and ensure issue resolved (15 min)

-- Example workflow to create manually via UI:
-- Name: Standard Service Ticket Workflow
-- Description: Default workflow: Diagnosis → Repair → Testing
-- Entity Type: service_ticket
-- Strict Sequence: Yes
-- Tasks: Diagnosis (required) → Repair (required) → Testing (required)

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify workflow_id column added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'service_tickets'
  AND column_name = 'workflow_id';

-- Verify task_comments table created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'task_comments';

-- Verify task_attachments table created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'task_attachments';

-- Verify triggers created
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('trg_auto_create_service_ticket_tasks', 'trg_auto_complete_service_ticket');

-- Verify indexes created
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%service_ticket%' OR indexname LIKE '%task_comments%' OR indexname LIKE '%task_attachments%';

-- NOTE: Seed data verification skipped - create workflows via UI after admin setup

-- =====================================================
-- END OF MIGRATION
-- =====================================================
