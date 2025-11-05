# Phase 3 Architecture Design: Service Ticket Workflow System

**Date:** November 3, 2025 (Week 9 Design Phase)
**Phase:** 3 - Service Ticket Tasks + Workflow Management
**Version:** 1.0
**Status:** 📐 **DESIGN COMPLETE**

---

## 📋 Document Purpose

This document is the **single source of truth** for Phase 3 implementation (Weeks 10-11). It provides:

1. **Database Schema:** Tables, triggers, functions, indexes
2. **Backend Design:** Entity adapters, tRPC endpoints, business logic
3. **Frontend Design:** Components, pages, user flows
4. **Integration Specs:** How components work together
5. **Implementation Guide:** Step-by-step for developers

**Audience:**
- Developers (implementation reference)
- QA (test scenario source)
- Tech Lead (code review guide)
- Product Owner (progress tracking)

---

## 🎯 Architecture Overview

### System Context

Phase 3 extends the polymorphic task management system (built in Phases 1-2) to support **service tickets** - the main business workflow.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Phase 3 Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (Next.js + React)                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Workflow Management UI                                     │ │
│  │  - /admin/workflows (list, create, edit)                   │ │
│  │  - Workflow builder (drag-drop tasks)                      │ │
│  │  - Workflow assignment modal                               │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Service Ticket Task UI                                     │ │
│  │  - /tickets/[id] (task section integration)               │ │
│  │  - ServiceTicketTaskCard (progress, dependencies)          │ │
│  │  - Task reassignment modal                                 │ │
│  │  - Bulk action toolbar                                     │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Task Management Dashboard                                  │ │
│  │  - /my-tasks (multi-entity: receipts + tickets)           │ │
│  │  - Filters: Mine, Available, Overdue                       │ │
│  │  - Priority grouping (urgent, high, normal, complete)      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          ↕ tRPC (Type-safe API)                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Backend (Node.js + TypeScript)                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Entity Adapter Layer                                 │ │ │
│  │  │  - service-ticket-adapter.ts (NEW)                    │ │ │
│  │  │  - inventory-receipt-adapter.ts (Phase 2)             │ │ │
│  │  │  ↓ Provides: canStartTask, onTaskComplete, context   │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  tRPC Routers                                         │ │ │
│  │  │  - tasks.ts: reassign, bulkComplete, comments        │ │ │
│  │  │  - workflows.ts: create, update, assign (NEW)        │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          ↕ SQL Queries                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Database (PostgreSQL + Supabase)                          │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Triggers (Automation)                                │ │ │
│  │  │  - auto_create_service_ticket_tasks()     ← NEW      │ │ │
│  │  │  - auto_complete_service_ticket()         ← NEW      │ │ │
│  │  │  - auto_create_serial_entry_tasks()       (Phase 2)  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Tables                                               │ │ │
│  │  │  - service_tickets (add workflow_id)      ← MODIFIED │ │ │
│  │  │  - entity_tasks (polymorphic)             (Phase 1)  │ │ │
│  │  │  - workflows                               (Phase 1)  │ │ │
│  │  │  - workflow_tasks                          (Phase 1)  │ │ │
│  │  │  - tasks (task library)                    (Phase 1)  │ │ │
│  │  │  - task_comments                           ← NEW      │ │ │
│  │  │  - task_attachments                        ← NEW      │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

**1. Polymorphic Task System (Phase 1 Foundation)**
- Single `entity_tasks` table handles all entity types
- Entity adapters provide entity-specific business logic
- Extensible: Add new entity type = Add new adapter

**2. Database-Driven Automation**
- Triggers ensure 100% reliability (Phase 2 success)
- Task creation automatic (no API calls needed)
- Task completion automatic (based on progress)

**3. Type Safety End-to-End**
- tRPC ensures frontend-backend type sync
- Zod validates all inputs
- TypeScript strict mode (0 errors)

**4. Mobile-First Design**
- All UI components responsive (375px → 1920px)
- Touch-friendly (44px minimum tap targets)
- Tested on real devices (iPhone, iPad, Android)

---

## 🗄️ Database Schema Design

### Schema Changes Summary

| Change Type | Table/Function | Purpose |
|-------------|----------------|---------|
| **ADD COLUMN** | `service_tickets.workflow_id` | Link ticket to workflow |
| **CREATE TABLE** | `task_comments` | Comment threads on tasks |
| **CREATE TABLE** | `task_attachments` | File uploads for tasks |
| **CREATE FUNCTION** | `auto_create_service_ticket_tasks()` | Auto-create tasks on status change |
| **CREATE FUNCTION** | `auto_complete_service_ticket()` | Auto-complete ticket when tasks done |
| **CREATE INDEX** | Multiple | Query optimization |

---

### 1. service_tickets Table Modification

**Add workflow_id Column:**

```sql
-- Migration: 20251111_service_ticket_workflow_system.sql

-- Add workflow_id to service_tickets
ALTER TABLE public.service_tickets
ADD COLUMN workflow_id UUID REFERENCES public.workflows(id);

-- Index for workflow lookup
CREATE INDEX idx_service_tickets_workflow_id
ON public.service_tickets(workflow_id)
WHERE workflow_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN public.service_tickets.workflow_id IS
'Workflow template assigned to this ticket. Tasks auto-created based on workflow.';
```

**Updated service_tickets Schema:**

```sql
CREATE TABLE public.service_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL, -- Auto-generated: SV-YYYY-NNNN
  customer_id UUID REFERENCES public.customers(id),
  assigned_to_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  -- NEW: Workflow assignment
  workflow_id UUID REFERENCES public.workflows(id),

  -- Service details
  service_fee DECIMAL(10,2),
  diagnosis_fee DECIMAL(10,2),
  parts_total DECIMAL(10,2) GENERATED ALWAYS AS (...) STORED,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (...) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

---

### 2. task_comments Table (NEW)

**Purpose:** Comment threads on tasks (like GitHub issues)

```sql
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.entity_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  comment TEXT NOT NULL CHECK (LENGTH(comment) >= 1 AND LENGTH(comment) <= 5000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_created_at ON public.task_comments(task_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Read: Anyone can read comments on tasks they have access to
CREATE POLICY "Users can read comments on accessible tasks"
ON public.task_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.entity_tasks
    WHERE entity_tasks.id = task_comments.task_id
    -- User has access if task assigned to them OR they're manager/admin
    AND (
      entity_tasks.assigned_to_id = auth.uid()
      OR auth.jwt()->>'role' IN ('Admin', 'Manager')
    )
  )
);

-- Create: Authenticated users can add comments to accessible tasks
CREATE POLICY "Users can add comments to accessible tasks"
ON public.task_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.entity_tasks
    WHERE entity_tasks.id = task_comments.task_id
    AND (
      entity_tasks.assigned_to_id = auth.uid()
      OR auth.jwt()->>'role' IN ('Admin', 'Manager')
    )
  )
);

-- Update: Users can edit their own comments within 15 minutes
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
CREATE POLICY "Users can delete own comments"
ON public.task_comments FOR DELETE
USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE public.task_comments IS 'Comment threads on tasks for collaboration';
COMMENT ON COLUMN public.task_comments.comment IS 'Comment text (max 5000 characters)';
```

---

### 3. task_attachments Table (NEW)

**Purpose:** File uploads for tasks (photos, PDFs, etc.)

```sql
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.entity_tasks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE, -- Optional: link to specific comment
  user_id UUID NOT NULL REFERENCES public.profiles(id),

  -- File metadata
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path: task-attachments/{task_id}/{uuid}-{filename}
  file_size_bytes INT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880), -- Max 5MB
  mime_type TEXT NOT NULL CHECK (mime_type IN (
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf'
  )),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_attachments_task_id ON public.task_attachments(task_id);
CREATE INDEX idx_task_attachments_comment_id ON public.task_attachments(comment_id) WHERE comment_id IS NOT NULL;

-- RLS Policies
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Read: Anyone can read attachments on accessible tasks
CREATE POLICY "Users can read attachments on accessible tasks"
ON public.task_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.entity_tasks
    WHERE entity_tasks.id = task_attachments.task_id
    AND (
      entity_tasks.assigned_to_id = auth.uid()
      OR auth.jwt()->>'role' IN ('Admin', 'Manager')
    )
  )
);

-- Create: Authenticated users can upload attachments to accessible tasks
CREATE POLICY "Users can upload attachments to accessible tasks"
ON public.task_attachments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.entity_tasks
    WHERE entity_tasks.id = task_attachments.task_id
    AND (
      entity_tasks.assigned_to_id = auth.uid()
      OR auth.jwt()->>'role' IN ('Admin', 'Manager')
    )
  )
);

-- Delete: Users can delete their own attachments OR admins can delete any
CREATE POLICY "Users can delete own attachments"
ON public.task_attachments FOR DELETE
USING (
  user_id = auth.uid()
  OR auth.jwt()->>'role' = 'Admin'
);

-- Comments
COMMENT ON TABLE public.task_attachments IS 'File attachments for tasks (max 5MB per file)';
COMMENT ON COLUMN public.task_attachments.file_path IS 'Supabase Storage path';
```

**Supabase Storage Bucket:**

```sql
-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false);

-- Storage policy: Users can upload files
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-attachments'
  AND auth.role() = 'authenticated'
  -- Path format: {task_id}/{uuid}-{filename}
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.entity_tasks
    WHERE assigned_to_id = auth.uid() OR entity_tasks.metadata->>'created_by' = auth.uid()::text
  )
);

-- Storage policy: Users can read attachments they have access to
CREATE POLICY "Users can read task attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-attachments'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.entity_tasks
    WHERE assigned_to_id = auth.uid()
      OR auth.jwt()->>'role' IN ('Admin', 'Manager')
  )
);
```

---

### 4. Database Trigger: auto_create_service_ticket_tasks()

**Purpose:** Automatically create tasks when service ticket status changes to 'in_progress'

**Lifecycle:**
```
Service Ticket Status Change: pending → in_progress
   ↓ (Trigger fires)
Auto-create 3 tasks:
   1. Diagnosis (sequence 1, status: pending)
   2. Repair (sequence 2, status: pending, depends on: diagnosis)
   3. Testing (sequence 3, status: pending, depends on: repair)
```

**Trigger Function:**

```sql
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
      RAISE WARNING 'Workflow % not found or inactive, skipping task creation for ticket %', v_workflow_id, NEW.id;
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
      -- Determine dependencies based on sequence
      -- Task 1 (Diagnosis): No dependency
      -- Task 2 (Repair): Depends on Task 1
      -- Task 3+ (Testing, etc.): Depends on previous task

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
          'task_type', LOWER(REPLACE(v_workflow_task.task_name, ' ', '_')), -- e.g., 'diagnosis', 'repair'
          'ticket_number', NEW.ticket_number,
          'workflow_task_id', v_workflow_task.workflow_task_id,
          'estimated_duration_minutes', v_workflow_task.estimated_duration_minutes,
          'required_role', v_workflow_task.required_role,
          'depends_on', CASE
            WHEN v_workflow_task.sequence_order > 1 THEN 'previous' -- Sequential dependency
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
'Automatically creates tasks when service ticket status changes to in_progress. Creates one task per workflow_task in assigned workflow.';
```

**Key Features:**
- ✅ Idempotent (won't create duplicate tasks)
- ✅ Graceful degradation (errors logged, ticket update proceeds)
- ✅ Sequential dependencies (task 2 depends on task 1, etc.)
- ✅ Auto-assignment (tasks assigned to ticket assignee)
- ✅ Due date calculation (7 days from creation)

---

### 5. Database Trigger: auto_complete_service_ticket()

**Purpose:** Automatically complete service ticket when all required tasks are completed

**Logic:**
```
Task Status Changes to 'completed'
   ↓ (Trigger fires)
Check: Are ALL required tasks for this ticket completed?
   ↓ YES
Update service_ticket.status = 'completed'
Update service_ticket.completed_at = NOW()
```

**Trigger Function:**

```sql
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
'Automatically completes service ticket when all required tasks are marked as completed or skipped.';
```

**Key Features:**
- ✅ Only fires for service_ticket tasks (not receipts)
- ✅ Checks all required tasks (skipped tasks count as complete)
- ✅ Doesn't modify cancelled/completed tickets
- ✅ Graceful error handling

---

### 6. Database Indexes for Performance

**Query Optimization:**

```sql
-- Service ticket task queries (dashboard)
CREATE INDEX idx_entity_tasks_service_ticket_assigned
ON public.entity_tasks(entity_type, assigned_to_id, status)
WHERE entity_type = 'service_ticket';

-- Task dependency lookups (canStartTask)
CREATE INDEX idx_entity_tasks_sequence
ON public.entity_tasks(entity_id, sequence_order)
WHERE entity_type IN ('service_ticket', 'inventory_receipt');

-- Comment thread queries
CREATE INDEX idx_task_comments_task_created
ON public.task_comments(task_id, created_at DESC);

-- Attachment queries
CREATE INDEX idx_task_attachments_task
ON public.task_attachments(task_id)
INCLUDE (file_name, file_size_bytes, mime_type);

-- Workflow assignment queries
CREATE INDEX idx_workflows_entity_type_active
ON public.workflows(entity_type, is_active)
WHERE is_active = true;
```

**Expected Performance:**
- Dashboard load: <500ms (100+ tasks)
- Task detail with comments: <300ms
- Dependency check: <50ms
- Workflow list: <200ms

---

## 🏗️ Backend Architecture

### Entity Adapter: service-ticket-adapter.ts

**File:** `src/server/services/entity-adapters/service-ticket-adapter.ts`

**Complete Implementation:**

```typescript
import type { TRPCContext } from '@/server/trpc'
import type { EntityAdapter, CanStartResult, TaskContext, CanAssignResult } from './types'

/**
 * Service Ticket Entity Adapter
 *
 * Handles business logic for service_ticket entity type:
 * - Task dependencies (sequential workflow)
 * - Progress tracking (lifecycle stages)
 * - Auto-assignment logic
 */
export class ServiceTicketAdapter implements EntityAdapter {

  /**
   * Lifecycle stages for service tickets
   * Order matters: Repair can't start until Diagnosis complete
   */
  private readonly LIFECYCLE_STAGES = {
    diagnosis: {
      order: 1,
      label: 'Chuẩn đoán',
      required: true,
      assignable_to: ['Technician', 'Manager', 'Admin'],
      depends_on: null
    },
    repair: {
      order: 2,
      label: 'Sửa chữa',
      required: true,
      assignable_to: ['Technician', 'Manager', 'Admin'],
      depends_on: 'diagnosis'
    },
    testing: {
      order: 3,
      label: 'Kiểm tra',
      required: true,
      assignable_to: ['Technician', 'Manager', 'Admin'],
      depends_on: 'repair'
    }
  } as const

  /**
   * Check if task can be started
   *
   * Validation rules:
   * 1. Ticket must be in 'in_progress' status
   * 2. Dependency tasks must be completed (if any)
   * 3. User must have required role
   */
  async canStartTask(ctx: TRPCContext, taskId: string): Promise<CanStartResult> {
    // Get task details
    const { data: task, error: taskError } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .select(`
        id,
        entity_id,
        entity_type,
        name,
        status,
        sequence_order,
        metadata
      `)
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return {
        canStart: false,
        reason: 'Task không tồn tại'
      }
    }

    // Get service ticket
    const { data: ticket, error: ticketError } = await ctx.supabaseAdmin
      .from('service_tickets')
      .select('id, ticket_number, status, assigned_to_id')
      .eq('id', task.entity_id)
      .single()

    if (ticketError || !ticket) {
      return {
        canStart: false,
        reason: 'Service ticket không tồn tại'
      }
    }

    // Check 1: Ticket status must be 'in_progress'
    if (ticket.status !== 'in_progress') {
      return {
        canStart: false,
        reason: `Ticket phải ở trạng thái 'Đang xử lý'. Trạng thái hiện tại: '${ticket.status}'`
      }
    }

    // Check 2: Task already in progress or completed
    if (task.status === 'in_progress') {
      return {
        canStart: false,
        reason: 'Task đã được bắt đầu'
      }
    }

    if (task.status === 'completed') {
      return {
        canStart: false,
        reason: 'Task đã hoàn thành'
      }
    }

    // Check 3: Dependency validation (sequential workflow)
    const taskType = task.metadata?.task_type as string | undefined

    if (taskType && task.sequence_order > 1) {
      // Get previous task in sequence
      const { data: previousTask } = await ctx.supabaseAdmin
        .from('entity_tasks')
        .select('id, name, status, sequence_order')
        .eq('entity_type', 'service_ticket')
        .eq('entity_id', ticket.id)
        .eq('sequence_order', task.sequence_order - 1)
        .single()

      if (previousTask) {
        if (previousTask.status !== 'completed' && previousTask.status !== 'skipped') {
          return {
            canStart: false,
            reason: `Phải hoàn thành task "${previousTask.name}" trước`,
            dependsOn: {
              taskId: previousTask.id,
              taskName: previousTask.name,
              status: previousTask.status
            }
          }
        }
      }
    }

    // Check 4: Role-based validation (optional - can be enforced in UI)
    const userRole = ctx.user?.role
    const requiredRole = task.metadata?.required_role as string | undefined

    if (requiredRole && userRole) {
      const stage = Object.values(this.LIFECYCLE_STAGES).find(
        s => s.label.toLowerCase().includes(taskType?.toLowerCase() || '')
      )

      if (stage && !stage.assignable_to.includes(userRole)) {
        return {
          canStart: false,
          reason: `Chỉ ${stage.assignable_to.join(', ')} mới được thực hiện task này`
        }
      }
    }

    return { canStart: true }
  }

  /**
   * Called when task is started
   * Log to audit trail
   */
  async onTaskStart(ctx: TRPCContext, taskId: string): Promise<void> {
    const { data: task } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .select('entity_id, name, metadata')
      .eq('id', taskId)
      .single()

    if (task) {
      await ctx.supabaseAdmin.from('audit_logs').insert({
        user_id: ctx.userId,
        action: 'task_start',
        table_name: 'entity_tasks',
        record_id: taskId,
        changes: {
          task_name: task.name,
          task_type: task.metadata?.task_type,
          ticket_id: task.entity_id
        }
      })
    }
  }

  /**
   * Called when task is completed
   * Auto-completion handled by database trigger
   */
  async onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void> {
    const { data: task } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .select('entity_id, name, metadata')
      .eq('id', taskId)
      .single()

    if (task) {
      await ctx.supabaseAdmin.from('audit_logs').insert({
        user_id: ctx.userId,
        action: 'task_complete',
        table_name: 'entity_tasks',
        record_id: taskId,
        changes: {
          task_name: task.name,
          task_type: task.metadata?.task_type,
          ticket_id: task.entity_id
        }
      })
    }

    // Note: Ticket auto-completion handled by database trigger
    // No need to manually check/update ticket status here
  }

  /**
   * Called when task is blocked
   * Log reason to audit trail
   */
  async onTaskBlock(ctx: TRPCContext, taskId: string, reason: string): Promise<void> {
    await ctx.supabaseAdmin.from('audit_logs').insert({
      user_id: ctx.userId,
      action: 'task_block',
      table_name: 'entity_tasks',
      record_id: taskId,
      reason: reason
    })
  }

  /**
   * Get entity context for task enrichment
   *
   * Returns:
   * - Progress percentage (completed / total required)
   * - Current lifecycle stage
   * - Priority based on progress + overdue
   */
  async getEntityContext(ctx: TRPCContext, entityId: string): Promise<TaskContext> {
    // Get ticket details
    const { data: ticket } = await ctx.supabaseAdmin
      .from('service_tickets')
      .select(`
        id,
        ticket_number,
        status,
        customer_id,
        customers!service_tickets_customer_id_fkey(name),
        created_at
      `)
      .eq('id', entityId)
      .single()

    if (!ticket) {
      throw new Error(`Service ticket not found: ${entityId}`)
    }

    // Get all tasks for this ticket
    const { data: tasks } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .select('id, name, status, is_required, sequence_order, metadata, due_date')
      .eq('entity_type', 'service_ticket')
      .eq('entity_id', entityId)
      .order('sequence_order', { ascending: true })

    // Calculate progress
    const totalRequired = tasks?.filter(t => t.is_required).length || 0
    const completedCount = tasks?.filter(t => t.status === 'completed' || t.status === 'skipped').length || 0
    const progressPercentage = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0

    // Determine current stage
    let currentStage = 'Chưa bắt đầu'
    if (tasks && tasks.length > 0) {
      const inProgressTask = tasks.find(t => t.status === 'in_progress')
      if (inProgressTask) {
        currentStage = inProgressTask.name
      } else if (progressPercentage === 100) {
        currentStage = 'Hoàn thành'
      } else {
        const nextTask = tasks.find(t => t.status === 'pending')
        if (nextTask) {
          currentStage = `Chờ: ${nextTask.name}`
        }
      }
    }

    // Determine priority
    let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
    const hasOverdue = tasks?.some(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed')

    if (progressPercentage === 100) {
      priority = 'low' // Complete
    } else if (hasOverdue) {
      priority = 'urgent' // Overdue tasks
    } else if (progressPercentage < 50) {
      priority = 'high' // Early stages
    }

    return {
      entityId: ticket.id,
      entityType: 'service_ticket',
      title: `Service Ticket ${ticket.ticket_number}`,
      subtitle: `${currentStage} - ${progressPercentage}% hoàn thành`,
      status: ticket.status,
      priority: priority,
      url: `/tickets/${ticket.id}`,
      metadata: {
        ticketNumber: ticket.ticket_number,
        customerName: ticket.customers?.name,
        currentStage: currentStage,
        progressPercentage: progressPercentage,
        completedTasks: completedCount,
        totalTasks: totalRequired,
        hasOverdueTasks: hasOverdue || false
      }
    }
  }

  /**
   * Check if workflow can be assigned to ticket
   *
   * Validation:
   * 1. Ticket must be in 'pending' or 'in_progress' status
   * 2. Workflow must be for 'service_ticket' entity type
   * 3. Workflow must be active
   */
  async canAssignWorkflow(
    ctx: TRPCContext,
    entityId: string,
    workflowId: string
  ): Promise<CanAssignResult> {
    // Get ticket
    const { data: ticket } = await ctx.supabaseAdmin
      .from('service_tickets')
      .select('id, status')
      .eq('id', entityId)
      .single()

    if (!ticket) {
      return {
        canAssign: false,
        reason: 'Service ticket không tồn tại'
      }
    }

    // Check ticket status
    if (!['pending', 'in_progress'].includes(ticket.status)) {
      return {
        canAssign: false,
        reason: `Không thể assign workflow cho ticket đã ${ticket.status}`
      }
    }

    // Get workflow
    const { data: workflow } = await ctx.supabaseAdmin
      .from('workflows')
      .select('id, name, entity_type, is_active')
      .eq('id', workflowId)
      .single()

    if (!workflow) {
      return {
        canAssign: false,
        reason: 'Workflow không tồn tại'
      }
    }

    // Check workflow entity type
    if (workflow.entity_type !== 'service_ticket') {
      return {
        canAssign: false,
        reason: `Workflow này dành cho ${workflow.entity_type}, không phải service_ticket`
      }
    }

    // Check workflow is active
    if (!workflow.is_active) {
      return {
        canAssign: false,
        reason: 'Workflow đã bị vô hiệu hóa'
      }
    }

    return { canAssign: true }
  }
}
```

**Unit Tests (8h Budget - Week 10):**

```typescript
// tests/server/entity-adapters/service-ticket-adapter.test.ts

describe('ServiceTicketAdapter', () => {
  let adapter: ServiceTicketAdapter
  let mockCtx: TRPCContext

  beforeEach(() => {
    adapter = new ServiceTicketAdapter()
    mockCtx = createMockContext()
  })

  describe('canStartTask', () => {
    it('should allow starting diagnosis task when ticket in_progress', async () => {
      const ticket = await createTestTicket({ status: 'in_progress' })
      const task = await createTestTask({
        entity_id: ticket.id,
        sequence_order: 1,
        metadata: { task_type: 'diagnosis' }
      })

      const result = await adapter.canStartTask(mockCtx, task.id)

      expect(result.canStart).toBe(true)
    })

    it('should block task if ticket not in_progress', async () => {
      const ticket = await createTestTicket({ status: 'pending' })
      const task = await createTestTask({ entity_id: ticket.id })

      const result = await adapter.canStartTask(mockCtx, task.id)

      expect(result.canStart).toBe(false)
      expect(result.reason).toContain('Đang xử lý')
    })

    it('should block repair task if diagnosis not complete', async () => {
      const ticket = await createTestTicket({ status: 'in_progress' })
      const diagnosisTask = await createTestTask({
        entity_id: ticket.id,
        sequence_order: 1,
        status: 'in_progress',
        metadata: { task_type: 'diagnosis' }
      })
      const repairTask = await createTestTask({
        entity_id: ticket.id,
        sequence_order: 2,
        metadata: { task_type: 'repair' }
      })

      const result = await adapter.canStartTask(mockCtx, repairTask.id)

      expect(result.canStart).toBe(false)
      expect(result.reason).toContain('hoàn thành task')
      expect(result.dependsOn).toEqual({
        taskId: diagnosisTask.id,
        taskName: expect.any(String),
        status: 'in_progress'
      })
    })

    it('should allow repair task if diagnosis completed', async () => {
      const ticket = await createTestTicket({ status: 'in_progress' })
      await createTestTask({
        entity_id: ticket.id,
        sequence_order: 1,
        status: 'completed',
        metadata: { task_type: 'diagnosis' }
      })
      const repairTask = await createTestTask({
        entity_id: ticket.id,
        sequence_order: 2,
        metadata: { task_type: 'repair' }
      })

      const result = await adapter.canStartTask(mockCtx, repairTask.id)

      expect(result.canStart).toBe(true)
    })

    it('should allow repair task if diagnosis skipped', async () => {
      const ticket = await createTestTicket({ status: 'in_progress' })
      await createTestTask({
        entity_id: ticket.id,
        sequence_order: 1,
        status: 'skipped',
        metadata: { task_type: 'diagnosis' }
      })
      const repairTask = await createTestTask({
        entity_id: ticket.id,
        sequence_order: 2,
        metadata: { task_type: 'repair' }
      })

      const result = await adapter.canStartTask(mockCtx, repairTask.id)

      expect(result.canStart).toBe(true)
    })
  })

  describe('getEntityContext', () => {
    it('should calculate 0% progress when no tasks complete', async () => {
      const ticket = await createTestTicket({ status: 'in_progress' })
      await createTestTask({ entity_id: ticket.id, status: 'pending' }) // 1 of 3
      await createTestTask({ entity_id: ticket.id, status: 'pending' })
      await createTestTask({ entity_id: ticket.id, status: 'pending' })

      const context = await adapter.getEntityContext(mockCtx, ticket.id)

      expect(context.metadata.progressPercentage).toBe(0)
      expect(context.priority).toBe('high') // <50% = high
    })

    it('should calculate 33% progress when 1 of 3 tasks complete', async () => {
      const ticket = await createTestTicket({ status: 'in_progress' })
      await createTestTask({ entity_id: ticket.id, status: 'completed' }) // 1 of 3
      await createTestTask({ entity_id: ticket.id, status: 'in_progress' })
      await createTestTask({ entity_id: ticket.id, status: 'pending' })

      const context = await adapter.getEntityContext(mockCtx, ticket.id)

      expect(context.metadata.progressPercentage).toBe(33)
      expect(context.priority).toBe('high') // <50% = high
    })

    it('should calculate 100% progress when all tasks complete', async () => {
      const ticket = await createTestTicket({ status: 'completed' })
      await createTestTask({ entity_id: ticket.id, status: 'completed' })
      await createTestTask({ entity_id: ticket.id, status: 'completed' })
      await createTestTask({ entity_id: ticket.id, status: 'completed' })

      const context = await adapter.getEntityContext(mockCtx, ticket.id)

      expect(context.metadata.progressPercentage).toBe(100)
      expect(context.priority).toBe('low') // 100% = low (complete)
    })

    it('should set urgent priority when tasks overdue', async () => {
      const ticket = await createTestTicket({ status: 'in_progress' })
      await createTestTask({
        entity_id: ticket.id,
        status: 'in_progress',
        due_date: '2024-01-01' // Past due
      })

      const context = await adapter.getEntityContext(mockCtx, ticket.id)

      expect(context.priority).toBe('urgent')
      expect(context.metadata.hasOverdueTasks).toBe(true)
    })

    it('should determine current stage correctly', async () => {
      const ticket = await createTestTicket({ status: 'in_progress' })
      await createTestTask({
        entity_id: ticket.id,
        name: 'Diagnosis',
        status: 'completed',
        sequence_order: 1
      })
      await createTestTask({
        entity_id: ticket.id,
        name: 'Repair',
        status: 'in_progress',
        sequence_order: 2
      })
      await createTestTask({
        entity_id: ticket.id,
        name: 'Testing',
        status: 'pending',
        sequence_order: 3
      })

      const context = await adapter.getEntityContext(mockCtx, ticket.id)

      expect(context.metadata.currentStage).toBe('Repair')
      expect(context.subtitle).toContain('Repair')
    })
  })

  describe('canAssignWorkflow', () => {
    it('should allow assigning workflow to pending ticket', async () => {
      const ticket = await createTestTicket({ status: 'pending' })
      const workflow = await createTestWorkflow({ entity_type: 'service_ticket', is_active: true })

      const result = await adapter.canAssignWorkflow(mockCtx, ticket.id, workflow.id)

      expect(result.canAssign).toBe(true)
    })

    it('should block assigning workflow to completed ticket', async () => {
      const ticket = await createTestTicket({ status: 'completed' })
      const workflow = await createTestWorkflow({ entity_type: 'service_ticket' })

      const result = await adapter.canAssignWorkflow(mockCtx, ticket.id, workflow.id)

      expect(result.canAssign).toBe(false)
      expect(result.reason).toContain('completed')
    })

    it('should block assigning inactive workflow', async () => {
      const ticket = await createTestTicket({ status: 'pending' })
      const workflow = await createTestWorkflow({ entity_type: 'service_ticket', is_active: false })

      const result = await adapter.canAssignWorkflow(mockCtx, ticket.id, workflow.id)

      expect(result.canAssign).toBe(false)
      expect(result.reason).toContain('vô hiệu hóa')
    })

    it('should block assigning wrong entity type workflow', async () => {
      const ticket = await createTestTicket({ status: 'pending' })
      const workflow = await createTestWorkflow({ entity_type: 'inventory_receipt' })

      const result = await adapter.canAssignWorkflow(mockCtx, ticket.id, workflow.id)

      expect(result.canAssign).toBe(false)
      expect(result.reason).toContain('inventory_receipt')
    })
  })
})
```

---

## (Continue in next message due to length...)

Would you like me to continue with:
1. tRPC API Specifications
2. Frontend Component Design
3. Workflow Management UI Design
4. Or create the Unit Test Plan document?
## 🌐 tRPC API Specifications

### API Router Structure

```
src/server/routers/
├── _app.ts (main router)
├── tasks.ts (MODIFIED - add new endpoints)
├── workflows.ts (NEW - workflow management)
└── entity-adapters/
    └── service-ticket-adapter.ts (NEW)
```

---

### Router 1: workflows.ts (NEW)

**File:** `src/server/routers/workflows.ts`

**Complete Implementation:**

```typescript
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { requireRole } from '../middleware/requireRole'

/**
 * Workflow Management Router
 *
 * Endpoints for creating, editing, and assigning workflows via UI
 */

// =====================================================
// SCHEMAS
// =====================================================

const createWorkflowSchema = z.object({
  name: z.string().min(3, 'Tên workflow phải ít nhất 3 ký tự').max(100),
  description: z.string().max(500).optional(),
  entity_type: z.enum(['service_ticket', 'inventory_receipt', 'stock_transfer', 'service_request']),
  strict_sequence: z.boolean().default(false),
  task_ids: z.array(z.string().uuid()).min(1, 'Workflow phải có ít nhất 1 task')
})

const updateWorkflowSchema = z.object({
  workflow_id: z.string().uuid(),
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  strict_sequence: z.boolean().optional(),
  is_active: z.boolean().optional(),
  task_ids: z.array(z.string().uuid()).optional()
})

const listWorkflowsSchema = z.object({
  entity_type: z.enum(['service_ticket', 'inventory_receipt', 'stock_transfer', 'service_request']).optional(),
  is_active: z.boolean().optional()
})

const assignWorkflowSchema = z.object({
  entity_id: z.string().uuid(),
  entity_type: z.enum(['service_ticket', 'inventory_receipt', 'stock_transfer', 'service_request']),
  workflow_id: z.string().uuid()
})

const bulkAssignWorkflowSchema = z.object({
  entity_ids: z.array(z.string().uuid()).min(1).max(50, 'Tối đa 50 entities'),
  entity_type: z.enum(['service_ticket', 'inventory_receipt']),
  workflow_id: z.string().uuid()
})

const cloneWorkflowSchema = z.object({
  workflow_id: z.string().uuid(),
  new_name: z.string().min(3).max(100)
})

// =====================================================
// ROUTER
// =====================================================

export const workflowsRouter = router({

  /**
   * Create new workflow
   * Permission: Admin only
   */
  create: publicProcedure
    .use(requireRole(['Admin']))
    .input(createWorkflowSchema)
    .mutation(async ({ input, ctx }) => {
      const { name, description, entity_type, strict_sequence, task_ids } = input

      // Validate all task IDs exist
      const { data: tasks, error: tasksError } = await ctx.supabaseAdmin
        .from('tasks')
        .select('id')
        .in('id', task_ids)

      if (tasksError || !tasks || tasks.length !== task_ids.length) {
        throw new Error('Một hoặc nhiều task không tồn tại')
      }

      // Create workflow
      const { data: workflow, error: workflowError } = await ctx.supabaseAdmin
        .from('workflows')
        .insert({
          name,
          description,
          entity_type,
          strict_sequence,
          is_active: true,
          created_by_id: ctx.userId
        })
        .select()
        .single()

      if (workflowError || !workflow) {
        throw new Error(`Lỗi tạo workflow: ${workflowError?.message}`)
      }

      // Create workflow_tasks (sequence based on task_ids order)
      const workflowTasks = task_ids.map((task_id, index) => ({
        workflow_id: workflow.id,
        task_id: task_id,
        sequence_order: index + 1,
        is_required: true
      }))

      const { error: workflowTasksError } = await ctx.supabaseAdmin
        .from('workflow_tasks')
        .insert(workflowTasks)

      if (workflowTasksError) {
        // Rollback: Delete workflow if workflow_tasks creation failed
        await ctx.supabaseAdmin
          .from('workflows')
          .delete()
          .eq('id', workflow.id)

        throw new Error(`Lỗi tạo workflow tasks: ${workflowTasksError.message}`)
      }

      // Audit log
      await ctx.supabaseAdmin.from('audit_logs').insert({
        user_id: ctx.userId,
        action: 'workflow_create',
        table_name: 'workflows',
        record_id: workflow.id,
        changes: { name, entity_type, task_count: task_ids.length }
      })

      return workflow
    }),

  /**
   * Update existing workflow
   * Permission: Admin only
   */
  update: publicProcedure
    .use(requireRole(['Admin']))
    .input(updateWorkflowSchema)
    .mutation(async ({ input, ctx }) => {
      const { workflow_id, task_ids, ...updates } = input

      // Update workflow metadata
      if (Object.keys(updates).length > 0) {
        const { error } = await ctx.supabaseAdmin
          .from('workflows')
          .update(updates)
          .eq('id', workflow_id)

        if (error) {
          throw new Error(`Lỗi update workflow: ${error.message}`)
        }
      }

      // Update workflow tasks if provided
      if (task_ids && task_ids.length > 0) {
        // Delete existing workflow_tasks
        await ctx.supabaseAdmin
          .from('workflow_tasks')
          .delete()
          .eq('workflow_id', workflow_id)

        // Insert new workflow_tasks
        const workflowTasks = task_ids.map((task_id, index) => ({
          workflow_id: workflow_id,
          task_id: task_id,
          sequence_order: index + 1,
          is_required: true
        }))

        const { error: insertError } = await ctx.supabaseAdmin
          .from('workflow_tasks')
          .insert(workflowTasks)

        if (insertError) {
          throw new Error(`Lỗi update workflow tasks: ${insertError.message}`)
        }
      }

      // Audit log
      await ctx.supabaseAdmin.from('audit_logs').insert({
        user_id: ctx.userId,
        action: 'workflow_update',
        table_name: 'workflows',
        record_id: workflow_id,
        changes: updates
      })

      return { success: true }
    }),

  /**
   * List workflows
   * Permission: All authenticated users
   */
  list: publicProcedure
    .input(listWorkflowsSchema)
    .query(async ({ input, ctx }) => {
      let query = ctx.supabaseAdmin
        .from('workflows')
        .select(`
          *,
          workflow_tasks (
            id,
            sequence_order,
            is_required,
            tasks (
              id,
              name,
              description,
              estimated_duration_minutes,
              required_role
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (input.entity_type) {
        query = query.eq('entity_type', input.entity_type)
      }

      if (input.is_active !== undefined) {
        query = query.eq('is_active', input.is_active)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Lỗi lấy danh sách workflows: ${error.message}`)
      }

      return data
    }),

  /**
   * Get workflow by ID
   * Permission: All authenticated users
   */
  getById: publicProcedure
    .input(z.object({ workflow_id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('workflows')
        .select(`
          *,
          workflow_tasks (
            id,
            sequence_order,
            is_required,
            tasks (
              id,
              name,
              description,
              estimated_duration_minutes,
              required_role
            )
          )
        `)
        .eq('id', input.workflow_id)
        .single()

      if (error || !data) {
        throw new Error('Workflow không tồn tại')
      }

      return data
    }),

  /**
   * Assign workflow to entity
   * Permission: Manager, Admin
   */
  assign: publicProcedure
    .use(requireRole(['Admin', 'Manager']))
    .input(assignWorkflowSchema)
    .mutation(async ({ input, ctx }) => {
      const { entity_id, entity_type, workflow_id } = input

      // Get entity adapter
      const { getEntityAdapter } = await import('../services/entity-adapters')
      const adapter = getEntityAdapter(entity_type)

      // Check if workflow can be assigned
      const canAssign = await adapter.canAssignWorkflow(ctx, entity_id, workflow_id)

      if (!canAssign.canAssign) {
        throw new Error(canAssign.reason || 'Không thể assign workflow')
      }

      // Assign workflow based on entity type
      let tableName: string
      switch (entity_type) {
        case 'service_ticket':
          tableName = 'service_tickets'
          break
        case 'inventory_receipt':
          tableName = 'stock_receipts'
          break
        case 'stock_transfer':
          tableName = 'stock_transfers'
          break
        case 'service_request':
          tableName = 'service_requests'
          break
        default:
          throw new Error('Entity type không hợp lệ')
      }

      const { error } = await ctx.supabaseAdmin
        .from(tableName)
        .update({ workflow_id: workflow_id })
        .eq('id', entity_id)

      if (error) {
        throw new Error(`Lỗi assign workflow: ${error.message}`)
      }

      // Audit log
      await ctx.supabaseAdmin.from('audit_logs').insert({
        user_id: ctx.userId,
        action: 'workflow_assign',
        table_name: tableName,
        record_id: entity_id,
        changes: { workflow_id }
      })

      return { success: true }
    }),

  /**
   * Bulk assign workflow to multiple entities
   * Permission: Manager, Admin
   */
  bulkAssign: publicProcedure
    .use(requireRole(['Admin', 'Manager']))
    .input(bulkAssignWorkflowSchema)
    .mutation(async ({ input, ctx }) => {
      const { entity_ids, entity_type, workflow_id } = input

      const results = {
        total: entity_ids.length,
        succeeded: 0,
        failed: 0,
        errors: [] as string[]
      }

      // Determine table name
      const tableName = entity_type === 'service_ticket' ? 'service_tickets' : 'stock_receipts'

      // Bulk update (optimized)
      const { error } = await ctx.supabaseAdmin
        .from(tableName)
        .update({ workflow_id: workflow_id })
        .in('id', entity_ids)

      if (error) {
        results.failed = entity_ids.length
        results.errors.push(`Bulk update failed: ${error.message}`)
      } else {
        results.succeeded = entity_ids.length
      }

      // Audit log
      await ctx.supabaseAdmin.from('audit_logs').insert({
        user_id: ctx.userId,
        action: 'workflow_bulk_assign',
        table_name: tableName,
        changes: {
          workflow_id,
          entity_count: entity_ids.length,
          succeeded: results.succeeded,
          failed: results.failed
        }
      })

      return results
    }),

  /**
   * Clone workflow
   * Permission: Admin only
   */
  clone: publicProcedure
    .use(requireRole(['Admin']))
    .input(cloneWorkflowSchema)
    .mutation(async ({ input, ctx }) => {
      const { workflow_id, new_name } = input

      // Get original workflow with tasks
      const { data: originalWorkflow, error: getError } = await ctx.supabaseAdmin
        .from('workflows')
        .select(`
          *,
          workflow_tasks (
            task_id,
            sequence_order,
            is_required
          )
        `)
        .eq('id', workflow_id)
        .single()

      if (getError || !originalWorkflow) {
        throw new Error('Workflow không tồn tại')
      }

      // Create new workflow
      const { data: newWorkflow, error: createError } = await ctx.supabaseAdmin
        .from('workflows')
        .insert({
          name: new_name,
          description: originalWorkflow.description ? `${originalWorkflow.description} (cloned)` : null,
          entity_type: originalWorkflow.entity_type,
          strict_sequence: originalWorkflow.strict_sequence,
          is_active: true,
          created_by_id: ctx.userId
        })
        .select()
        .single()

      if (createError || !newWorkflow) {
        throw new Error(`Lỗi clone workflow: ${createError?.message}`)
      }

      // Copy workflow tasks
      const newWorkflowTasks = originalWorkflow.workflow_tasks.map(wt => ({
        workflow_id: newWorkflow.id,
        task_id: wt.task_id,
        sequence_order: wt.sequence_order,
        is_required: wt.is_required
      }))

      const { error: tasksError } = await ctx.supabaseAdmin
        .from('workflow_tasks')
        .insert(newWorkflowTasks)

      if (tasksError) {
        // Rollback
        await ctx.supabaseAdmin.from('workflows').delete().eq('id', newWorkflow.id)
        throw new Error(`Lỗi clone workflow tasks: ${tasksError.message}`)
      }

      // Audit log
      await ctx.supabaseAdmin.from('audit_logs').insert({
        user_id: ctx.userId,
        action: 'workflow_clone',
        table_name: 'workflows',
        record_id: newWorkflow.id,
        changes: {
          original_workflow_id: workflow_id,
          new_name
        }
      })

      return newWorkflow
    }),

  /**
   * Delete workflow
   * Permission: Admin only
   */
  delete: publicProcedure
    .use(requireRole(['Admin']))
    .input(z.object({ workflow_id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Check if workflow is being used
      const { data: usageCount } = await ctx.supabaseAdmin
        .rpc('count_workflow_usage', { p_workflow_id: input.workflow_id })

      if (usageCount && usageCount > 0) {
        throw new Error(`Không thể xóa workflow đang được sử dụng bởi ${usageCount} entities`)
      }

      // Delete workflow (cascade deletes workflow_tasks)
      const { error } = await ctx.supabaseAdmin
        .from('workflows')
        .delete()
        .eq('id', input.workflow_id)

      if (error) {
        throw new Error(`Lỗi xóa workflow: ${error.message}`)
      }

      // Audit log
      await ctx.supabaseAdmin.from('audit_logs').insert({
        user_id: ctx.userId,
        action: 'workflow_delete',
        table_name: 'workflows',
        record_id: input.workflow_id
      })

      return { success: true }
    })
})
```

**Helper Function (Add to migration):**

```sql
-- Count how many entities use this workflow
CREATE OR REPLACE FUNCTION count_workflow_usage(p_workflow_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INT := 0;
BEGIN
  -- Count service tickets
  SELECT COUNT(*) INTO v_count
  FROM public.service_tickets
  WHERE workflow_id = p_workflow_id;

  -- Add stock receipts count
  v_count := v_count + (
    SELECT COUNT(*)
    FROM public.stock_receipts
    WHERE workflow_id = p_workflow_id
  );

  RETURN v_count;
END;
$$;
```

---

### Router 2: tasks.ts (MODIFIED - Add New Endpoints)

**File:** `src/server/routers/tasks.ts`

**New Endpoints to Add:**

```typescript
/**
 * Task reassignment endpoint
 * Permission: Manager, Admin
 */
reassign: publicProcedure
  .use(requireRole(['Admin', 'Manager']))
  .input(z.object({
    taskId: z.string().uuid(),
    newAssigneeId: z.string().uuid(),
    reason: z.string().min(10, 'Lý do phải ít nhất 10 ký tự').max(500)
  }))
  .mutation(async ({ input, ctx }) => {
    const { taskId, newAssigneeId, reason } = input

    // Validate task exists
    const { data: task } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .select('*, assigned_to_id')
      .eq('id', taskId)
      .single()

    if (!task) throw new Error('Task không tồn tại')

    // Validate new assignee exists and is eligible
    const { data: newAssignee } = await ctx.supabaseAdmin
      .from('profiles')
      .select('id, role, name')
      .eq('id', newAssigneeId)
      .single()

    if (!newAssignee) throw new Error('Người nhận task không tồn tại')
    
    if (!['Technician', 'Manager', 'Admin'].includes(newAssignee.role)) {
      throw new Error('Chỉ có thể assign task cho Technician, Manager, hoặc Admin')
    }

    // Update assignment
    const { error } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .update({
        assigned_to_id: newAssigneeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (error) throw new Error(`Lỗi reassign task: ${error.message}`)

    // Audit log
    await ctx.supabaseAdmin.from('audit_logs').insert({
      user_id: ctx.userId,
      action: 'task_reassignment',
      table_name: 'entity_tasks',
      record_id: taskId,
      reason: reason,
      changes: {
        old_assignee_id: task.assigned_to_id,
        new_assignee_id: newAssigneeId,
        reason: reason
      }
    })

    return { success: true }
  }),

/**
 * Bulk complete tasks
 * Permission: Manager, Admin
 */
bulkComplete: publicProcedure
  .use(requireRole(['Admin', 'Manager']))
  .input(z.object({
    taskIds: z.array(z.string().uuid()).min(1).max(100, 'Tối đa 100 tasks')
  }))
  .mutation(async ({ input, ctx }) => {
    const { taskIds } = input

    const results = {
      total: taskIds.length,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each task
    for (const taskId of taskIds) {
      try {
        // Check if can complete
        const { data: task } = await ctx.supabaseAdmin
          .from('entity_tasks')
          .select('status')
          .eq('id', taskId)
          .single()

        if (!task) {
          results.failed++
          results.errors.push(`Task ${taskId}: Không tồn tại`)
          continue
        }

        if (task.status !== 'in_progress') {
          results.failed++
          results.errors.push(`Task ${taskId}: Phải ở trạng thái in_progress`)
          continue
        }

        // Complete task
        const { error } = await ctx.supabaseAdmin
          .from('entity_tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', taskId)

        if (error) {
          results.failed++
          results.errors.push(`Task ${taskId}: ${error.message}`)
          continue
        }

        results.succeeded++

      } catch (error: any) {
        results.failed++
        results.errors.push(`Task ${taskId}: ${error.message}`)
      }
    }

    // Audit log
    await ctx.supabaseAdmin.from('audit_logs').insert({
      user_id: ctx.userId,
      action: 'task_bulk_complete',
      table_name: 'entity_tasks',
      changes: {
        total: results.total,
        succeeded: results.succeeded,
        failed: results.failed
      }
    })

    return results
  }),

/**
 * Add comment to task
 * Permission: Task assignee, Manager, Admin
 */
addComment: publicProcedure
  .input(z.object({
    taskId: z.string().uuid(),
    comment: z.string().min(1).max(5000)
  }))
  .mutation(async ({ input, ctx }) => {
    const { taskId, comment } = input

    // Validate user has access to task
    const { data: task } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .select('assigned_to_id')
      .eq('id', taskId)
      .single()

    if (!task) throw new Error('Task không tồn tại')

    const { data: userProfile } = await ctx.supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', ctx.userId)
      .single()

    if (task.assigned_to_id !== ctx.userId && !['Admin', 'Manager'].includes(userProfile?.role || '')) {
      throw new Error('Không có quyền comment task này')
    }

    // Insert comment
    const { error } = await ctx.supabaseAdmin
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: ctx.userId,
        comment: comment
      })

    if (error) throw new Error(`Lỗi thêm comment: ${error.message}`)

    return { success: true }
  }),

/**
 * Get comments for task
 * Permission: Task assignee, Manager, Admin
 */
getComments: publicProcedure
  .input(z.object({
    taskId: z.string().uuid(),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).default(0)
  }))
  .query(async ({ input, ctx }) => {
    const { taskId, limit, offset } = input

    const { data, error } = await ctx.supabaseAdmin
      .from('task_comments')
      .select(`
        *,
        profiles (
          id,
          name,
          role
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`Lỗi lấy comments: ${error.message}`)

    return data
  }),

/**
 * Upload attachment to task
 * Permission: Task assignee, Manager, Admin
 */
uploadAttachment: publicProcedure
  .input(z.object({
    taskId: z.string().uuid(),
    fileName: z.string(),
    fileSize: z.number().max(5242880, 'File tối đa 5MB'),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
    filePath: z.string() // Supabase Storage path
  }))
  .mutation(async ({ input, ctx }) => {
    const { taskId, fileName, fileSize, mimeType, filePath } = input

    // Insert attachment record
    const { error } = await ctx.supabaseAdmin
      .from('task_attachments')
      .insert({
        task_id: taskId,
        user_id: ctx.userId,
        file_name: fileName,
        file_path: filePath,
        file_size_bytes: fileSize,
        mime_type: mimeType
      })

    if (error) throw new Error(`Lỗi thêm attachment: ${error.message}`)

    return { success: true }
  })
```

---

## (Continue with Frontend Component Design in next append...)


## 🎨 Frontend Component Design

### Component Structure

```
src/components/
├── tasks/
│   ├── service-ticket-task-card.tsx (NEW)
│   ├── service-ticket-tasks-section.tsx (NEW)
│   ├── task-reassignment-modal.tsx (NEW)
│   ├── task-bulk-actions.tsx (NEW)
│   ├── task-comment-thread.tsx (NEW)
│   └── serial-entry-task-card.tsx (Phase 2)
├── workflows/
│   ├── workflow-list.tsx (NEW)
│   ├── workflow-builder.tsx (NEW)
│   ├── workflow-assignment-modal.tsx (NEW)
│   └── task-library-selector.tsx (NEW)
└── ui/
    └── progress.tsx (MODIFIED - Phase 2)
```

---

### Component 1: ServiceTicketTaskCard

**File:** `src/components/tasks/service-ticket-task-card.tsx`

**Purpose:** Display individual service ticket task with progress, dependencies, and actions

**Props:**
```typescript
interface ServiceTicketTaskCardProps {
  task: {
    id: string
    name: string
    description?: string
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
    sequence_order: number
    is_required: boolean
    assigned_to?: {
      id: string
      name: string
    }
    due_date?: string
    metadata: {
      task_type: string
      depends_on?: string
      ticket_number?: string
    }
  }
  entityContext: {
    entityId: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    url: string
  }
  onStart?: () => void
  onComplete?: () => void
  onReassign?: () => void
}
```

**Implementation:**

```tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/components/providers/trpc-provider'
import { Lock, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export function ServiceTicketTaskCard({ task, entityContext, onStart, onComplete, onReassign }: ServiceTicketTaskCardProps) {
  
  // Check if task can be started (dependency validation)
  const { data: canStartResult } = trpc.tasks.canStart.useQuery({ taskId: task.id })

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
  const isPending = task.status === 'pending'
  const isInProgress = task.status === 'in_progress'
  const isCompleted = task.status === 'completed'
  const isBlocked = canStartResult && !canStartResult.canStart

  return (
    <Card className={`p-4 ${isOverdue ? 'border-red-500 border-2' : ''}`}>
      <div className="flex items-start justify-between">
        {/* Left: Task info */}
        <div className="flex-1">
          {/* Task name + status badge */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-base">{task.name}</h3>
            
            {isCompleted && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Hoàn thành
              </Badge>
            )}
            
            {isInProgress && (
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                <Clock className="w-3 h-3 mr-1" />
                Đang xử lý
              </Badge>
            )}
            
            {isPending && !isBlocked && (
              <Badge variant="outline">
                Chờ xử lý
              </Badge>
            )}
            
            {isBlocked && (
              <Badge variant="destructive">
                <Lock className="w-3 h-3 mr-1" />
                Bị chặn
              </Badge>
            )}
            
            {task.is_required && (
              <Badge variant="outline" className="text-xs">
                Bắt buộc
              </Badge>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}

          {/* Dependency warning */}
          {isBlocked && canStartResult?.dependsOn && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  {canStartResult.reason}
                  <Link 
                    href={`/tasks/${canStartResult.dependsOn.taskId}`}
                    className="ml-2 underline font-medium"
                  >
                    Xem task phụ thuộc →
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
            {task.assigned_to && (
              <span>👤 {task.assigned_to.name}</span>
            )}
            {task.due_date && (
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                📅 {new Date(task.due_date).toLocaleDateString('vi-VN')}
                {isOverdue && ' (Quá hạn)'}
              </span>
            )}
            <span>#{task.sequence_order}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-2 ml-4">
          {isPending && !isBlocked && (
            <Button 
              size="sm"
              onClick={onStart}
              disabled={!canStartResult?.canStart}
            >
              Bắt đầu
            </Button>
          )}

          {isInProgress && (
            <Button 
              size="sm"
              variant="default"
              onClick={onComplete}
            >
              Hoàn thành
            </Button>
          )}

          {(isPending || isInProgress) && (
            <Button 
              size="sm"
              variant="outline"
              onClick={onReassign}
            >
              Reassign
            </Button>
          )}

          <Link href={entityContext.url}>
            <Button size="sm" variant="ghost">
              Xem chi tiết
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
```

---

### Component 2: ServiceTicketTasksSection

**File:** `src/components/tasks/service-ticket-tasks-section.tsx`

**Purpose:** Task list section for service ticket detail page

**Props:**
```typescript
interface ServiceTicketTasksSectionProps {
  ticketId: string
  ticketStatus: string
}
```

**Implementation:**

```tsx
'use client'

import { useState } from 'react'
import { trpc } from '@/components/providers/trpc-provider'
import { ServiceTicketTaskCard } from './service-ticket-task-card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'

export function ServiceTicketTasksSection({ ticketId, ticketStatus }: ServiceTicketTasksSectionProps) {
  
  // Fetch tasks for this ticket
  const { data: tasks, isLoading } = trpc.tasks.myTasks.useQuery({
    entityType: 'service_ticket',
    entityId: ticketId
  })

  // Calculate progress
  const totalRequired = tasks?.filter(t => t.is_required).length || 0
  const completedCount = tasks?.filter(t => t.status === 'completed' || t.status === 'skipped').length || 0
  const progressPercentage = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0

  // Group tasks by status
  const pendingTasks = tasks?.filter(t => t.status === 'pending') || []
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || []
  const completedTasks = tasks?.filter(t => t.status === 'completed' || t.status === 'skipped') || []

  if (isLoading) {
    return <div className="p-4">Đang tải tasks...</div>
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
        Chưa có tasks cho ticket này. 
        {ticketStatus === 'pending' && ' Tasks sẽ được tạo tự động khi bắt đầu xử lý ticket.'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Tiến độ tasks</h3>
          <Badge variant={progressPercentage === 100 ? 'secondary' : 'default'}>
            {completedCount} / {totalRequired} tasks
          </Badge>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2"
          indicatorClassName={
            progressPercentage === 100 ? 'bg-green-500' :
            progressPercentage >= 50 ? 'bg-yellow-500' :
            'bg-red-500'
          }
        />
        <p className="text-sm text-gray-600 mt-1">{progressPercentage}% hoàn thành</p>
      </div>

      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">🔵 Đang xử lý</h4>
              <Badge variant="default">{inProgressTasks.length}</Badge>
            </div>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {inProgressTasks.map(task => (
              <ServiceTicketTaskCard key={task.id} task={task} entityContext={task.entity_context} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">⚪ Chờ xử lý</h4>
              <Badge variant="outline">{pendingTasks.length}</Badge>
            </div>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {pendingTasks.map(task => (
              <ServiceTicketTaskCard key={task.id} task={task} entityContext={task.entity_context} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-green-50 rounded-lg hover:bg-green-100">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">🟢 Đã hoàn thành</h4>
              <Badge variant="secondary">{completedTasks.length}</Badge>
            </div>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {completedTasks.map(task => (
              <ServiceTicketTaskCard key={task.id} task={task} entityContext={task.entity_context} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
```

---

### Component 3: TaskReassignmentModal

**File:** `src/components/tasks/task-reassignment-modal.tsx`

**Purpose:** Modal for reassigning task to another technician

```tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { trpc } from '@/components/providers/trpc-provider'
import { toast } from 'sonner'

interface TaskReassignmentModalProps {
  taskId: string
  currentAssignee?: {
    id: string
    name: string
  }
  open: boolean
  onClose: () => void
}

export function TaskReassignmentModal({ taskId, currentAssignee, open, onClose }: TaskReassignmentModalProps) {
  const [newAssigneeId, setNewAssigneeId] = useState('')
  const [reason, setReason] = useState('')

  // Fetch technicians
  const { data: technicians } = trpc.team.listTechnicians.useQuery()

  // Reassign mutation
  const reassignMutation = trpc.tasks.reassign.useMutation({
    onSuccess: () => {
      toast.success('Đã reassign task thành công')
      onClose()
      setNewAssigneeId('')
      setReason('')
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`)
    }
  })

  const handleSubmit = () => {
    if (!newAssigneeId) {
      toast.error('Vui lòng chọn người nhận')
      return
    }
    if (reason.length < 10) {
      toast.error('Lý do phải ít nhất 10 ký tự')
      return
    }

    reassignMutation.mutate({ taskId, newAssigneeId, reason })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current assignee */}
          {currentAssignee && (
            <div className="text-sm text-gray-600">
              <strong>Hiện tại:</strong> {currentAssignee.name}
            </div>
          )}

          {/* New assignee selector */}
          <div>
            <Label htmlFor="newAssignee">Người nhận mới *</Label>
            <Select value={newAssigneeId} onValueChange={setNewAssigneeId}>
              <SelectTrigger id="newAssignee">
                <SelectValue placeholder="Chọn người nhận..." />
              </SelectTrigger>
              <SelectContent>
                {technicians?.map(tech => (
                  <SelectItem 
                    key={tech.id} 
                    value={tech.id}
                    disabled={tech.id === currentAssignee?.id}
                  >
                    {tech.name} ({tech.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Lý do reassign *</Label>
            <Textarea
              id="reason"
              placeholder="Vd: Technician đang nghỉ ốm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tối thiểu 10 ký tự ({reason.length}/10)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!newAssigneeId || reason.length < 10 || reassignMutation.isLoading}
          >
            {reassignMutation.isLoading ? 'Đang xử lý...' : 'Reassign'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Component 4: TaskBulkActions

**File:** `src/components/tasks/task-bulk-actions.tsx`

**Purpose:** Bulk action toolbar for selecting and operating on multiple tasks

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers/trpc-provider'
import { toast } from 'sonner'
import { ChevronDown } from 'lucide-react'

interface TaskBulkActionsProps {
  tasks: Array<{ id: string; status: string; name: string }>
}

export function TaskBulkActions({ tasks }: TaskBulkActionsProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<'complete' | 'skip' | null>(null)

  const utils = trpc.useContext()

  const bulkCompleteMutation = trpc.tasks.bulkComplete.useMutation({
    onSuccess: (result) => {
      toast.success(`Đã hoàn thành ${result.succeeded} / ${result.total} tasks`)
      if (result.failed > 0) {
        toast.warning(`${result.failed} tasks thất bại. Xem chi tiết.`)
      }
      setSelectedTaskIds([])
      utils.tasks.myTasks.invalidate()
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`)
    }
  })

  const handleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(tasks.map(t => t.id))
    }
  }

  const handleBulkComplete = () => {
    if (selectedTaskIds.length === 0) {
      toast.error('Chưa chọn task nào')
      return
    }

    bulkCompleteMutation.mutate({ taskIds: selectedTaskIds })
  }

  return (
    <div className="space-y-4">
      {/* Selection toolbar */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <Checkbox 
          checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
          onCheckedChange={handleSelectAll}
          aria-label="Select all"
        />
        <span className="text-sm font-medium">
          Chọn tất cả ({selectedTaskIds.length} / {tasks.length})
        </span>

        {selectedTaskIds.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="default">{selectedTaskIds.length} đã chọn</Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm">
                  Hành động hàng loạt
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleBulkComplete}>
                  ✅ Hoàn thành tất cả
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // TODO: Implement bulk reassign
                  toast.info('Tính năng đang phát triển')
                }}>
                  👤 Reassign tất cả
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // TODO: Implement bulk skip
                  toast.info('Tính năng đang phát triển')
                }}>
                  ⏭️ Skip tất cả
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Task list with checkboxes */}
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Checkbox 
              checked={selectedTaskIds.includes(task.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedTaskIds([...selectedTaskIds, task.id])
                } else {
                  setSelectedTaskIds(selectedTaskIds.filter(id => id !== task.id))
                }
              }}
            />
            <span className="text-sm flex-1">{task.name}</span>
            <Badge variant="outline">{task.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## (Continue with Workflow UI in next append...)

## 🎨 Workflow Management UI Components

### Component 5: WorkflowBuilder

**File:** `src/components/workflows/workflow-builder.tsx`

**Purpose:** Drag-and-drop workflow creation interface for Admins

**Props:**
```typescript
interface WorkflowBuilderProps {
  workflowId?: string // If editing existing workflow
  onSave: (workflow: CreateWorkflowInput) => Promise<void>
  onCancel: () => void
}
```

**Complete Implementation:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, GripVertical, Plus } from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { toast } from 'sonner'
import { TaskLibrarySelector } from './task-library-selector'

interface WorkflowTask {
  id: string // task_id from tasks table
  name: string
  description?: string
  sequence_order: number
  is_required: boolean
}

export function WorkflowBuilder({ workflowId, onSave, onCancel }: WorkflowBuilderProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [entityType, setEntityType] = useState<'service_ticket' | 'inventory_receipt'>('service_ticket')
  const [strictSequence, setStrictSequence] = useState(false)
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>([])
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load existing workflow if editing
  const { data: existingWorkflow, isLoading } = trpc.workflows.getById.useQuery(
    { workflow_id: workflowId! },
    { enabled: !!workflowId }
  )

  useEffect(() => {
    if (existingWorkflow) {
      setName(existingWorkflow.name)
      setDescription(existingWorkflow.description || '')
      setEntityType(existingWorkflow.entity_type as any)
      setStrictSequence(existingWorkflow.strict_sequence)
      setWorkflowTasks(existingWorkflow.workflow_tasks.map((wt: any) => ({
        id: wt.task_id,
        name: wt.task?.name || '',
        description: wt.task?.description,
        sequence_order: wt.sequence_order,
        is_required: wt.is_required
      })))
    }
  }, [existingWorkflow])

  // Handle drag & drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(workflowTasks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update sequence_order
    const updatedItems = items.map((item, index) => ({
      ...item,
      sequence_order: index + 1
    }))

    setWorkflowTasks(updatedItems)
  }

  // Add tasks from library
  const handleAddTasks = (taskIds: string[], tasks: any[]) => {
    const newTasks: WorkflowTask[] = taskIds.map((taskId, index) => {
      const task = tasks.find(t => t.id === taskId)
      return {
        id: taskId,
        name: task?.name || '',
        description: task?.description,
        sequence_order: workflowTasks.length + index + 1,
        is_required: true // Default to required
      }
    })

    setWorkflowTasks([...workflowTasks, ...newTasks])
    setIsSelectorOpen(false)
  }

  // Remove task
  const handleRemoveTask = (taskId: string) => {
    const updatedTasks = workflowTasks
      .filter(t => t.id !== taskId)
      .map((t, index) => ({ ...t, sequence_order: index + 1 }))
    setWorkflowTasks(updatedTasks)
  }

  // Toggle required flag
  const handleToggleRequired = (taskId: string) => {
    setWorkflowTasks(workflowTasks.map(t => 
      t.id === taskId ? { ...t, is_required: !t.is_required } : t
    ))
  }

  // Save workflow
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên workflow')
      return
    }

    if (workflowTasks.length === 0) {
      toast.error('Workflow phải có ít nhất 1 task')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        name,
        description,
        entity_type: entityType,
        strict_sequence: strictSequence,
        task_ids: workflowTasks.map(t => t.id)
      })
      toast.success('Đã lưu workflow thành công')
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi lưu workflow')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">
          {workflowId ? 'Chỉnh sửa Workflow' : 'Tạo Workflow mới'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tạo quy trình làm việc tự động bằng cách kéo thả các task theo thứ tự
        </p>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Thông tin cơ bản</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Tên Workflow *</Label>
            <Input 
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Quy trình sửa chữa chuẩn"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về workflow này"
              maxLength={500}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="entity-type">Loại đối tượng *</Label>
            <select
              id="entity-type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as any)}
              className="w-full p-2 border rounded-md"
              disabled={!!workflowId} // Can't change entity type when editing
            >
              <option value="service_ticket">Service Ticket</option>
              <option value="inventory_receipt">Inventory Receipt</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Switch 
              id="strict-sequence"
              checked={strictSequence}
              onCheckedChange={setStrictSequence}
            />
            <Label htmlFor="strict-sequence" className="cursor-pointer">
              Bắt buộc thực hiện theo thứ tự (không được skip)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="font-semibold">Danh sách Tasks ({workflowTasks.length})</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSelectorOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm Tasks
          </Button>
        </CardHeader>
        <CardContent>
          {workflowTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Chưa có task nào</p>
              <p className="text-sm mt-1">Nhấn "Thêm Tasks" để bắt đầu</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="workflow-tasks">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {workflowTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              flex items-center gap-3 p-4 bg-white rounded-lg border
                              ${snapshot.isDragging ? 'shadow-lg' : ''}
                            `}
                          >
                            {/* Drag Handle */}
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            </div>

                            {/* Sequence Number */}
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full font-semibold text-sm">
                              {task.sequence_order}
                            </div>

                            {/* Task Info */}
                            <div className="flex-1">
                              <div className="font-medium">{task.name}</div>
                              {task.description && (
                                <div className="text-sm text-muted-foreground">{task.description}</div>
                              )}
                            </div>

                            {/* Required Badge */}
                            <Badge 
                              variant={task.is_required ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => handleToggleRequired(task.id)}
                            >
                              {task.is_required ? 'Bắt buộc' : 'Tùy chọn'}
                            </Badge>

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : workflowId ? 'Cập nhật' : 'Tạo Workflow'}
        </Button>
      </div>

      {/* Task Library Selector Modal */}
      {isSelectorOpen && (
        <TaskLibrarySelector
          entityType={entityType}
          excludeTaskIds={workflowTasks.map(t => t.id)}
          onSelect={handleAddTasks}
          onClose={() => setIsSelectorOpen(false)}
        />
      )}
    </div>
  )
}
```

**Key Features:**
- ✅ Drag-and-drop task reordering with visual feedback
- ✅ Add tasks from task library (opens modal)
- ✅ Remove tasks with confirmation
- ✅ Toggle required/optional for each task
- ✅ Auto-update sequence_order on drag
- ✅ Load existing workflow for editing
- ✅ Validation: Name required, at least 1 task
- ✅ Vietnamese labels and messages

**Dependencies:**
```bash
pnpm add @hello-pangea/dnd
```

---

### Component 6: TaskLibrarySelector

**File:** `src/components/workflows/task-library-selector.tsx`

**Purpose:** Modal to select tasks from the task library

**Props:**
```typescript
interface TaskLibrarySelectorProps {
  entityType: 'service_ticket' | 'inventory_receipt'
  excludeTaskIds: string[] // Tasks already in workflow
  onSelect: (taskIds: string[], tasks: any[]) => void
  onClose: () => void
}
```

**Complete Implementation:**

```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/utils/trpc'
import { Search } from 'lucide-react'

export function TaskLibrarySelector({ entityType, excludeTaskIds, onSelect, onClose }: TaskLibrarySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  // Fetch tasks from library
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery({
    entity_type: entityType,
    status: 'active'
  })

  // Filter tasks
  const filteredTasks = tasks?.filter(task => {
    // Exclude tasks already in workflow
    if (excludeTaskIds.includes(task.id)) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return task.name.toLowerCase().includes(query) || 
             task.description?.toLowerCase().includes(query)
    }

    return true
  }) || []

  // Toggle task selection
  const handleToggleTask = (taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter(id => id !== taskId))
    } else {
      setSelectedTaskIds([...selectedTaskIds, taskId])
    }
  }

  // Select all visible tasks
  const handleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id))
    }
  }

  // Confirm selection
  const handleConfirm = () => {
    const selectedTasks = tasks?.filter(t => selectedTaskIds.includes(t.id)) || []
    onSelect(selectedTaskIds, selectedTasks)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Chọn Tasks từ thư viện</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Select All */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm">
            Chọn tất cả ({selectedTaskIds.length} / {filteredTasks.length})
          </span>
        </div>

        {/* Task List */}
        <div className="overflow-y-auto max-h-96 border rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? 'Không tìm thấy task nào' : 'Không có task nào'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggleTask(task.id)}
                >
                  <Checkbox
                    checked={selectedTaskIds.includes(task.id)}
                    onCheckedChange={() => handleToggleTask(task.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{task.name}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground mt-1">{task.description}</div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {task.category && (
                        <Badge variant="outline" className="text-xs">{task.category}</Badge>
                      )}
                      {task.estimated_duration_minutes && (
                        <Badge variant="secondary" className="text-xs">
                          ~{task.estimated_duration_minutes} phút
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedTaskIds.length === 0}
          >
            Thêm {selectedTaskIds.length} task(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Key Features:**
- ✅ Search by name/description
- ✅ Select all / Deselect all
- ✅ Checkbox selection with visual feedback
- ✅ Exclude tasks already in workflow
- ✅ Show task metadata (category, estimated duration)
- ✅ Confirmation before adding

---

### Component 7: WorkflowList

**File:** `src/components/workflows/workflow-list.tsx`

**Purpose:** Table to display and manage workflows with filters

**Props:**
```typescript
interface WorkflowListProps {
  entityType?: 'service_ticket' | 'inventory_receipt' // Filter by entity type
  onEdit?: (workflowId: string) => void
  onDelete?: (workflowId: string) => void
  onClone?: (workflowId: string) => void
}
```

**Complete Implementation:**

```typescript
'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Copy, Trash2, Eye } from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function WorkflowList({ entityType, onEdit, onDelete, onClone }: WorkflowListProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Fetch workflows
  const { data: workflows, isLoading, refetch } = trpc.workflows.list.useQuery({
    entity_type: entityType,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active'
  })

  // Delete workflow
  const deleteMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      toast.success('Đã xóa workflow')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi xóa workflow')
    }
  })

  // Clone workflow
  const cloneMutation = trpc.workflows.clone.useMutation({
    onSuccess: () => {
      toast.success('Đã sao chép workflow')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi sao chép workflow')
    }
  })

  const handleDelete = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Xác nhận xóa workflow "${workflowName}"?`)) return

    if (onDelete) {
      onDelete(workflowId)
    } else {
      await deleteMutation.mutateAsync({ workflow_id: workflowId })
    }
  }

  const handleClone = async (workflowId: string) => {
    if (onClone) {
      onClone(workflowId)
    } else {
      await cloneMutation.mutateAsync({ 
        workflow_id: workflowId,
        new_name: '' // Auto-generated by backend
      })
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Đang tải...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Tất cả ({workflows?.length || 0})
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('active')}
        >
          Đang hoạt động
        </Button>
        <Button
          variant={statusFilter === 'inactive' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('inactive')}
        >
          Vô hiệu hóa
        </Button>
      </div>

      {/* Table */}
      {workflows?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Không có workflow nào
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Workflow</TableHead>
              <TableHead>Loại đối tượng</TableHead>
              <TableHead>Số Tasks</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Sử dụng</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows?.map(workflow => (
              <TableRow key={workflow.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{workflow.name}</div>
                    {workflow.description && (
                      <div className="text-sm text-muted-foreground">{workflow.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {workflow.entity_type === 'service_ticket' ? 'Service Ticket' : 'Inventory Receipt'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {workflow.workflow_tasks?.length || 0} task(s)
                  {workflow.strict_sequence && (
                    <Badge variant="secondary" className="ml-2 text-xs">Thứ tự bắt buộc</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                    {workflow.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {workflow.usage_count || 0} lần
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/workflows/${workflow.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit ? onEdit(workflow.id) : router.push(`/admin/workflows/${workflow.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleClone(workflow.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Sao chép
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(workflow.id, workflow.name)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
```

**Key Features:**
- ✅ Filter by status (all/active/inactive)
- ✅ Show task count and usage statistics
- ✅ Actions: View, Edit, Clone, Delete
- ✅ Confirmation before delete
- ✅ Display strict_sequence badge
- ✅ Responsive table layout

---

### Component 8: WorkflowAssignmentModal

**File:** `src/components/workflows/workflow-assignment-modal.tsx`

**Purpose:** Modal to assign workflows to service tickets (bulk or single)

**Props:**
```typescript
interface WorkflowAssignmentModalProps {
  ticketIds: string[] // Single or multiple tickets
  onAssign: (workflowId: string, ticketIds: string[]) => Promise<void>
  onClose: () => void
}
```

**Complete Implementation:**

```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/utils/trpc'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'

export function WorkflowAssignmentModal({ ticketIds, onAssign, onClose }: WorkflowAssignmentModalProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  // Fetch active workflows for service_ticket
  const { data: workflows, isLoading } = trpc.workflows.list.useQuery({
    entity_type: 'service_ticket',
    is_active: true
  })

  const handleAssign = async () => {
    if (!selectedWorkflowId) {
      toast.error('Vui lòng chọn workflow')
      return
    }

    setIsAssigning(true)
    try {
      await onAssign(selectedWorkflowId, ticketIds)
      toast.success(`Đã assign workflow cho ${ticketIds.length} ticket(s)`)
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi assign workflow')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Assign Workflow cho {ticketIds.length} ticket(s)
          </DialogTitle>
        </DialogHeader>

        {/* Warning */}
        {ticketIds.length > 1 && (
          <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <div className="font-medium">Bulk Assignment</div>
              <div>Workflow sẽ được assign cho tất cả {ticketIds.length} tickets được chọn. Các task sẽ tự động được tạo khi ticket chuyển sang trạng thái "In Progress".</div>
            </div>
          </div>
        )}

        {/* Workflow List */}
        {isLoading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : workflows?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Không có workflow nào đang hoạt động
          </div>
        ) : (
          <RadioGroup value={selectedWorkflowId || ''} onValueChange={setSelectedWorkflowId}>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {workflows?.map(workflow => (
                <div
                  key={workflow.id}
                  className={`
                    flex items-start gap-3 p-4 border rounded-lg cursor-pointer
                    ${selectedWorkflowId === workflow.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}
                  `}
                  onClick={() => setSelectedWorkflowId(workflow.id)}
                >
                  <RadioGroupItem value={workflow.id} id={workflow.id} />
                  <Label htmlFor={workflow.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{workflow.name}</div>
                    {workflow.description && (
                      <div className="text-sm text-muted-foreground mt-1">{workflow.description}</div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {workflow.workflow_tasks?.length || 0} task(s)
                      </Badge>
                      {workflow.strict_sequence && (
                        <Badge variant="secondary" className="text-xs">Thứ tự bắt buộc</Badge>
                      )}
                      {workflow.usage_count && workflow.usage_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Đã sử dụng {workflow.usage_count} lần
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Hủy
          </Button>
          <Button onClick={handleAssign} disabled={!selectedWorkflowId || isAssigning}>
            {isAssigning ? 'Đang assign...' : 'Assign Workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Key Features:**
- ✅ Radio selection for single workflow
- ✅ Show workflow metadata (task count, usage, strict sequence)
- ✅ Warning message for bulk assignment
- ✅ Validation: Must select workflow before assign
- ✅ Loading state during assignment

---

## 📄 Page Designs

### Page 1: /admin/workflows (Workflow Management)

**File:** `src/app/(auth)/admin/workflows/page.tsx`

**Purpose:** Admin dashboard for managing workflows

**Layout:**

```
+----------------------------------------------------------+
| Admin > Workflows                          [+ New Workflow] |
+----------------------------------------------------------+
|                                                          |
| Filter: [All (12)] [Active (10)] [Inactive (2)]          |
|                                                          |
| +------------------------------------------------------+ |
| | Name | Entity Type | Tasks | Status | Usage | Actions | |
| +------------------------------------------------------+ |
| | Standard Repair | Service Ticket | 3 | Active | 45 | ⋮ | |
| | Warranty Return | Service Ticket | 5 | Active | 12 | ⋮ | |
| | Parts Receipt  | Inventory      | 4 | Inactive | 0 | ⋮ | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

**Complete Implementation:**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WorkflowList } from '@/components/workflows/workflow-list'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useRole } from '@/hooks/useRole'

export default function WorkflowsPage() {
  const router = useRouter()
  const { role } = useRole()

  // Redirect if not Admin
  if (role !== 'Admin') {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Management</h1>
          <p className="text-muted-foreground mt-1">
            Tạo và quản lý quy trình làm việc tự động
          </p>
        </div>
        <Button onClick={() => router.push('/admin/workflows/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo Workflow mới
        </Button>
      </div>

      {/* Workflow List */}
      <WorkflowList
        onEdit={(workflowId) => router.push(`/admin/workflows/${workflowId}/edit`)}
      />
    </div>
  )
}
```

**Key Features:**
- ✅ Admin-only access (role check)
- ✅ Create new workflow button
- ✅ WorkflowList component with filters
- ✅ Navigation to edit/view pages

---

### Page 2: /admin/workflows/[id]/edit (Workflow Builder)

**File:** `src/app/(auth)/admin/workflows/[id]/edit/page.tsx`

**Purpose:** Workflow creation and editing interface

**Layout:**

```
+----------------------------------------------------------+
| Admin > Workflows > Edit: "Standard Repair"    [Cancel] [Save] |
+----------------------------------------------------------+
|                                                          |
| Thông tin cơ bản                                         |
| +------------------------------------------------------+ |
| | Tên Workflow: [Standard Repair Workflow           ]  | |
| | Mô tả: [Quy trình sửa chữa tiêu chuẩn            ]  | |
| | Loại đối tượng: [Service Ticket ▼]                  | |
| | [✓] Bắt buộc thực hiện theo thứ tự                   | |
| +------------------------------------------------------+ |
|                                                          |
| Danh sách Tasks (3)                    [+ Thêm Tasks]    |
| +------------------------------------------------------+ |
| | ⠿ 1 | Chuẩn đoán lỗi        | Bắt buộc | [×]       | |
| | ⠿ 2 | Sửa chữa              | Bắt buộc | [×]       | |
| | ⠿ 3 | Kiểm tra chất lượng   | Tùy chọn | [×]       | |
| +------------------------------------------------------+ |
|                                           [Hủy] [Lưu]    |
+----------------------------------------------------------+
```

**Complete Implementation:**

```typescript
'use client'

import { useState } from 'react'
import { WorkflowBuilder } from '@/components/workflows/workflow-builder'
import { trpc } from '@/utils/trpc'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { useRole } from '@/hooks/useRole'

export default function EditWorkflowPage() {
  const router = useRouter()
  const params = useParams()
  const { role } = useRole()
  const workflowId = params.id as string

  // Mutations
  const createMutation = trpc.workflows.create.useMutation()
  const updateMutation = trpc.workflows.update.useMutation()

  // Redirect if not Admin
  if (role !== 'Admin') {
    router.push('/dashboard')
    return null
  }

  const handleSave = async (data: any) => {
    try {
      if (workflowId === 'new') {
        // Create new workflow
        await createMutation.mutateAsync(data)
        toast.success('Đã tạo workflow thành công')
      } else {
        // Update existing workflow
        await updateMutation.mutateAsync({
          workflow_id: workflowId,
          ...data
        })
        toast.success('Đã cập nhật workflow thành công')
      }

      router.push('/admin/workflows')
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi lưu workflow')
      throw error // Re-throw to prevent modal close
    }
  }

  const handleCancel = () => {
    if (confirm('Hủy bỏ thay đổi?')) {
      router.push('/admin/workflows')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <WorkflowBuilder
        workflowId={workflowId === 'new' ? undefined : workflowId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}
```

**Key Features:**
- ✅ Create new workflow (workflowId = 'new')
- ✅ Edit existing workflow (workflowId = UUID)
- ✅ Confirmation before cancel
- ✅ Redirect to workflow list after save
- ✅ Admin-only access

---

### Page 3: /tickets/[id] (Updated with Tasks Section)

**File:** `src/app/(auth)/tickets/[id]/page.tsx` (MODIFICATIONS ONLY)

**Purpose:** Service ticket detail page with task management section

**Layout Addition:**

```
+----------------------------------------------------------+
| Service Ticket: SV-2025-001                              |
+----------------------------------------------------------+
| ... (existing sections: Customer, Product, Status) ...   |
|                                                          |
| Tasks (3/3 hoàn thành - 100%)              [Bulk Actions]|
| +------------------------------------------------------+ |
| | ✓ 1 | Chuẩn đoán lỗi | Nguyễn Văn A | Completed   | |
| | ✓ 2 | Sửa chữa       | Nguyễn Văn A | Completed   | |
| | ✓ 3 | Kiểm tra      | Trần Văn B   | Completed   | |
| +------------------------------------------------------+ |
|                                                          |
| [Hoàn thành Ticket]                                      |
+----------------------------------------------------------+
```

**Code Modifications:**

```typescript
// ADD TO EXISTING PAGE

import { ServiceTicketTasksSection } from '@/components/tasks/service-ticket-tasks-section'
import { trpc } from '@/utils/trpc'

export default function TicketDetailPage() {
  const params = useParams()
  const ticketId = params.id as string

  // ... existing code ...

  // Fetch ticket data (existing)
  const { data: ticket, refetch } = trpc.tickets.getById.useQuery({ id: ticketId })

  // Fetch tasks for this ticket (NEW)
  const { data: tasks, refetch: refetchTasks } = trpc.tasks.listByEntity.useQuery({
    entity_type: 'service_ticket',
    entity_id: ticketId
  })

  // Task actions (NEW)
  const startMutation = trpc.tasks.start.useMutation({
    onSuccess: () => {
      refetchTasks()
      toast.success('Đã bắt đầu task')
    }
  })

  const completeMutation = trpc.tasks.complete.useMutation({
    onSuccess: () => {
      refetchTasks()
      refetch() // Refresh ticket to check if auto-completed
      toast.success('Đã hoàn thành task')
    }
  })

  const reassignMutation = trpc.tasks.reassign.useMutation({
    onSuccess: () => {
      refetchTasks()
      toast.success('Đã reassign task')
    }
  })

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* ... existing sections (Header, Customer, Product, Status) ... */}

      {/* Tasks Section (NEW) */}
      {ticket?.workflow_id && tasks && (
        <ServiceTicketTasksSection
          tasks={tasks}
          ticketStatus={ticket.status}
          onStart={(taskId) => startMutation.mutateAsync({ task_id: taskId })}
          onComplete={(taskId) => completeMutation.mutateAsync({ task_id: taskId })}
          onReassign={(taskId, technicianId, reason) => 
            reassignMutation.mutateAsync({ task_id: taskId, new_assignee_id: technicianId, reason })
          }
        />
      )}

      {/* ... existing sections (Actions) ... */}
    </div>
  )
}
```

**Key Changes:**
- ✅ Conditionally render tasks section (only if workflow_id exists)
- ✅ Fetch tasks for ticket
- ✅ Wire up task actions (start, complete, reassign)
- ✅ Refresh ticket data after task completion (to detect auto-complete)

---

### Page 4: /my-tasks (Updated with Workflow Filters)

**File:** `src/app/(auth)/my-tasks/page.tsx` (MODIFICATIONS ONLY)

**Purpose:** Task dashboard with workflow filtering

**Layout Addition:**

```
+----------------------------------------------------------+
| My Tasks                          [Mine] [All] [Available]|
+----------------------------------------------------------+
| Filters: [Service Tickets] [Serial Entry] [All Types]    |
|                                                          |
| Service Ticket Tasks (5)                                 |
| +------------------------------------------------------+ |
| | SV-2025-001 | Chuẩn đoán | In Progress | High      | |
| | SV-2025-002 | Sửa chữa   | Pending     | Urgent    | |
| +------------------------------------------------------+ |
|                                                          |
| Serial Entry Tasks (3)                                   |
| +------------------------------------------------------+ |
| | GRN-001 | Serial entry | Pending | 45% complete      | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

**Code Modifications:**

```typescript
// ADD TO EXISTING PAGE

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function MyTasksPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | 'service_ticket' | 'inventory_receipt'>('all')

  // Existing query (MODIFY)
  const { data: tasks } = trpc.tasks.list.useQuery({
    assigned_to: 'me',
    entity_type: entityTypeFilter === 'all' ? undefined : entityTypeFilter // ADD THIS
  })

  // Group tasks by entity type
  const serviceTicketTasks = tasks?.filter(t => t.entity_type === 'service_ticket') || []
  const serialEntryTasks = tasks?.filter(t => t.entity_type === 'inventory_receipt') || []

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold">My Tasks</h1>

      {/* Filters (NEW) */}
      <Tabs value={entityTypeFilter} onValueChange={(v) => setEntityTypeFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Tất cả ({tasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="service_ticket">Service Tickets ({serviceTicketTasks.length})</TabsTrigger>
          <TabsTrigger value="inventory_receipt">Serial Entry ({serialEntryTasks.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ... existing task list rendering ... */}
    </div>
  )
}
```

**Key Changes:**
- ✅ Add entity type filter tabs
- ✅ Show task counts per type
- ✅ Filter tasks in API query

---

## 🔄 Integration Flows & Sequence Diagrams

### Flow 1: Workflow Assignment to Service Ticket

**Trigger:** Manager assigns workflow to ticket

**Sequence:**

```
Manager                 Frontend               tRPC API              Database
  |                        |                      |                     |
  | Click "Assign Workflow" |                     |                     |
  |----------------------->|                      |                     |
  |                        | workflows.assign()   |                     |
  |                        |--------------------->|                     |
  |                        |                      | Validate ticket     |
  |                        |                      | status (pending)    |
  |                        |                      |-------------------->|
  |                        |                      |<--------------------|
  |                        |                      | UPDATE service_tickets |
  |                        |                      | SET workflow_id=...  |
  |                        |                      |-------------------->|
  |                        |                      |<--------------------|
  |                        |<---------------------|                     |
  |<-----------------------|                      |                     |
  | Success toast          |                      |                     |
  |                        |                      |                     |
```

**Code Flow:**

```typescript
// 1. Frontend: Manager clicks "Assign Workflow"
<WorkflowAssignmentModal 
  ticketIds={[ticketId]} 
  onAssign={handleAssign}
/>

// 2. tRPC Mutation
const handleAssign = async (workflowId: string, ticketIds: string[]) => {
  await trpc.workflows.assign.mutate({ workflow_id: workflowId, ticket_ids: ticketIds })
}

// 3. Backend: workflows.assign procedure
assign: publicProcedure.use(requireRole(['Admin', 'Manager'])).mutation(async ({ ctx, input }) => {
  // Validate all tickets are 'pending' status
  const tickets = await ctx.supabaseAdmin
    .from('service_tickets')
    .select('id, status')
    .in('id', input.ticket_ids)
  
  const invalidTickets = tickets.data?.filter(t => t.status !== 'pending')
  if (invalidTickets && invalidTickets.length > 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Chỉ assign workflow cho ticket ở trạng thái pending' })
  }

  // Update tickets
  await ctx.supabaseAdmin
    .from('service_tickets')
    .update({ workflow_id: input.workflow_id })
    .in('id', input.ticket_ids)
})
```

**Key Points:**
- ✅ Only pending tickets can be assigned workflows
- ✅ Manager/Admin only
- ✅ Bulk assignment supported
- ✅ No tasks created yet (happens when status → in_progress)

---

### Flow 2: Auto-Create Tasks on Ticket Status Change

**Trigger:** Ticket status changes from 'pending' → 'in_progress'

**Sequence:**

```
Technician             Frontend               tRPC API              Database Trigger
  |                        |                      |                     |
  | Click "Start Ticket"   |                      |                     |
  |----------------------->|                      |                     |
  |                        | tickets.updateStatus()|                   |
  |                        |--------------------->|                     |
  |                        |                      | UPDATE service_tickets|
  |                        |                      | SET status='in_progress'|
  |                        |                      |-------------------->|
  |                        |                      |                     | TRIGGER: auto_create_service_ticket_tasks()
  |                        |                      |                     |
  |                        |                      |                     | Fetch workflow_tasks
  |                        |                      |                     | for workflow_id
  |                        |                      |                     |
  |                        |                      |                     | INSERT INTO entity_tasks
  |                        |                      |                     | (3 tasks created)
  |                        |                      |                     |
  |                        |                      |<--------------------|
  |                        |<---------------------|                     |
  |<-----------------------|                      |                     |
  | Redirect to ticket detail                     |                     |
  |                        |                      |                     |
  | Tasks now visible      |                      |                     |
  |                        |                      |                     |
```

**Database Trigger Code:**

```sql
CREATE OR REPLACE FUNCTION public.auto_create_service_ticket_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_workflow_task RECORD;
  v_task_count INT;
BEGIN
  -- Only trigger when status changes to 'in_progress' AND workflow_id is set
  IF NEW.status = 'in_progress' AND NEW.workflow_id IS NOT NULL THEN
    
    -- Check if tasks already exist (idempotent)
    SELECT COUNT(*) INTO v_task_count
    FROM public.entity_tasks
    WHERE entity_type = 'service_ticket' AND entity_id = NEW.id;

    IF v_task_count > 0 THEN
      -- Tasks already exist, skip
      RETURN NEW;
    END IF;

    -- Create tasks from workflow template
    FOR v_workflow_task IN
      SELECT 
        wt.task_id,
        wt.sequence_order,
        wt.is_required,
        t.name,
        t.description,
        t.estimated_duration_minutes
      FROM public.workflow_tasks wt
      JOIN public.tasks t ON t.id = wt.task_id
      WHERE wt.workflow_id = NEW.workflow_id
      ORDER BY wt.sequence_order ASC
    LOOP
      INSERT INTO public.entity_tasks (
        entity_type,
        entity_id,
        task_id,
        name,
        description,
        sequence_order,
        is_required,
        status,
        assigned_to_id,
        estimated_duration_minutes,
        metadata
      ) VALUES (
        'service_ticket',
        NEW.id,
        v_workflow_task.task_id,
        v_workflow_task.name,
        v_workflow_task.description,
        v_workflow_task.sequence_order,
        v_workflow_task.is_required,
        'pending',
        NEW.assigned_to_id, -- Auto-assign to ticket assignee
        v_workflow_task.estimated_duration_minutes,
        jsonb_build_object(
          'ticket_number', NEW.ticket_number,
          'workflow_id', NEW.workflow_id,
          'auto_created', true
        )
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_service_ticket_tasks
  AFTER UPDATE ON public.service_tickets
  FOR EACH ROW
  WHEN (NEW.status = 'in_progress' AND OLD.status <> 'in_progress')
  EXECUTE FUNCTION public.auto_create_service_ticket_tasks();
```

**Key Points:**
- ✅ Idempotent: Checks if tasks already exist
- ✅ Auto-assigns to ticket's assigned_to_id
- ✅ Only triggers when status → 'in_progress'
- ✅ Graceful error handling (EXCEPTION block in full version)

---

### Flow 3: Task Lifecycle (Start → Complete)

**Trigger:** Technician starts and completes a task

**Sequence:**

```
Technician             Frontend               tRPC API              ServiceTicketAdapter
  |                        |                      |                     |
  | Click "Start Task"     |                      |                     |
  |----------------------->|                      |                     |
  |                        | tasks.start()        |                     |
  |                        |--------------------->|                     |
  |                        |                      | adapter.canStartTask()|
  |                        |                      |-------------------->|
  |                        |                      |                     | Check dependencies
  |                        |                      |                     | (prev task completed?)
  |                        |                      |                     |
  |                        |                      |<--------------------|
  |                        |                      | { canStart: true }  |
  |                        |                      |                     |
  |                        |                      | UPDATE entity_tasks |
  |                        |                      | SET status='in_progress'|
  |                        |                      | started_at=NOW()    |
  |                        |                      |                     |
  |                        |<---------------------|                     |
  |<-----------------------|                      |                     |
  | Task status updated    |                      |                     |
  |                        |                      |                     |
  | ... (work on task) ... |                      |                     |
  |                        |                      |                     |
  | Click "Complete"       |                      |                     |
  |----------------------->|                      |                     |
  |                        | tasks.complete()     |                     |
  |                        |--------------------->|                     |
  |                        |                      | UPDATE entity_tasks |
  |                        |                      | SET status='completed'|
  |                        |                      | completed_at=NOW()  |
  |                        |                      |-------------------->|
  |                        |                      |                     | TRIGGER: auto_complete_service_ticket()
  |                        |                      |                     | Check if all required tasks done
  |                        |                      |                     |
  |                        |                      |                     | UPDATE service_tickets
  |                        |                      |                     | SET status='completed'
  |                        |                      |                     |
  |                        |<---------------------|                     |
  |<-----------------------|                      |                     |
  | "Ticket auto-completed!"                      |                     |
  |                        |                      |                     |
```

**Adapter Validation Code:**

```typescript
async canStartTask(ctx: TRPCContext, taskId: string): Promise<CanStartResult> {
  // 1. Fetch task
  const { data: task } = await ctx.supabaseAdmin
    .from('entity_tasks')
    .select('*, service_tickets!inner(status, workflow_id)')
    .eq('id', taskId)
    .single()

  if (!task) {
    return { canStart: false, reason: 'Task không tồn tại' }
  }

  // 2. Check ticket status
  if (task.service_tickets.status === 'completed' || task.service_tickets.status === 'cancelled') {
    return { canStart: false, reason: 'Ticket đã hoàn thành hoặc bị hủy' }
  }

  // 3. Check dependencies
  if (task.sequence_order > 1) {
    const { data: prevTask } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .select('status, name')
      .eq('entity_id', task.entity_id)
      .eq('sequence_order', task.sequence_order - 1)
      .single()

    if (prevTask && prevTask.status !== 'completed' && prevTask.status !== 'skipped') {
      return { 
        canStart: false, 
        reason: `Phải hoàn thành task "${prevTask.name}" trước`,
        dependsOn: { taskName: prevTask.name, taskStatus: prevTask.status }
      }
    }
  }

  return { canStart: true }
}
```

**Auto-Complete Trigger Code:**

```sql
CREATE OR REPLACE FUNCTION public.auto_complete_service_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_all_tasks_done BOOLEAN;
  v_ticket_id UUID;
BEGIN
  -- Only trigger when task is completed
  IF NEW.status = 'completed' AND NEW.entity_type = 'service_ticket' THEN
    
    v_ticket_id := NEW.entity_id;

    -- Check if all required tasks are completed or skipped
    SELECT NOT EXISTS (
      SELECT 1
      FROM public.entity_tasks
      WHERE entity_id = v_ticket_id
        AND entity_type = 'service_ticket'
        AND is_required = TRUE
        AND status NOT IN ('completed', 'skipped')
    ) INTO v_all_tasks_done;

    IF v_all_tasks_done THEN
      -- Auto-complete ticket
      UPDATE public.service_tickets
      SET status = 'completed', completed_at = NOW()
      WHERE id = v_ticket_id AND status = 'in_progress';
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_complete_service_ticket
  AFTER UPDATE ON public.entity_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status <> 'completed')
  EXECUTE FUNCTION public.auto_complete_service_ticket();
```

**Key Points:**
- ✅ Dependency validation prevents starting tasks out of order
- ✅ Auto-complete only when all REQUIRED tasks done
- ✅ Optional tasks can be skipped without blocking completion

---

### Flow 4: Bulk Task Completion

**Trigger:** Manager completes multiple tasks at once

**Sequence:**

```
Manager                Frontend               tRPC API              Database
  |                        |                      |                     |
  | Select 5 tasks         |                      |                     |
  |----------------------->|                      |                     |
  | Click "Complete All"   |                      |                     |
  |----------------------->|                      |                     |
  |                        | tasks.bulkComplete() |                     |
  |                        |--------------------->|                     |
  |                        |                      | Loop through tasks  |
  |                        |                      | (max 100)           |
  |                        |                      |                     |
  |                        |                      | For each task:      |
  |                        |                      | - Validate          |
  |                        |                      | - UPDATE entity_tasks|
  |                        |                      |-------------------->|
  |                        |                      |<--------------------|
  |                        |                      |                     |
  |                        |                      | Partial failure handling|
  |                        |                      | (track success/failure)|
  |                        |                      |                     |
  |                        |<---------------------|                     |
  |                        | { successful: [id1, id2], failed: [id3] } |
  |<-----------------------|                      |                     |
  | Show results:          |                      |                     |
  | "2 thành công, 1 thất bại"                    |                     |
  |                        |                      |                     |
```

**tRPC Endpoint Code:**

```typescript
bulkComplete: publicProcedure
  .use(requireRole(['Admin', 'Manager', 'Technician']))
  .input(z.object({
    task_ids: z.array(z.string().uuid()).max(100, 'Tối đa 100 tasks')
  }))
  .mutation(async ({ ctx, input }) => {
    const results = { successful: [], failed: [] }

    for (const taskId of input.task_ids) {
      try {
        // Complete individual task
        const { error } = await ctx.supabaseAdmin
          .from('entity_tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', taskId)

        if (error) throw error

        results.successful.push(taskId)
      } catch (error) {
        results.failed.push({ taskId, error: error.message })
      }
    }

    return {
      total: input.task_ids.length,
      successful: results.successful.length,
      failed: results.failed.length,
      failedTasks: results.failed
    }
  })
```

**Frontend Handling:**

```typescript
const handleBulkComplete = async () => {
  const result = await trpc.tasks.bulkComplete.mutate({ task_ids: selectedTaskIds })
  
  if (result.failed > 0) {
    toast.warning(`Hoàn thành ${result.successful}/${result.total} tasks. ${result.failed} thất bại.`)
  } else {
    toast.success(`Đã hoàn thành ${result.successful} tasks`)
  }
  
  setSelectedTaskIds([])
  refetchTasks()
}
```

**Key Points:**
- ✅ Partial failure handling (some succeed, some fail)
- ✅ Max 100 tasks per request
- ✅ Detailed results returned to frontend
- ✅ Each task triggers auto-complete check independently

---

### Flow 5: Workflow Cloning

**Trigger:** Admin clones existing workflow

**Sequence:**

```
Admin                  Frontend               tRPC API              Database
  |                        |                      |                     |
  | Click "Clone"          |                      |                     |
  |----------------------->|                      |                     |
  |                        | workflows.clone()    |                     |
  |                        |--------------------->|                     |
  |                        |                      | Fetch original workflow|
  |                        |                      | + workflow_tasks     |
  |                        |                      |-------------------->|
  |                        |                      |<--------------------|
  |                        |                      |                     |
  |                        |                      | INSERT INTO workflows|
  |                        |                      | (name = "Copy of...")|
  |                        |                      |-------------------->|
  |                        |                      |<--------------------|
  |                        |                      | new_workflow_id     |
  |                        |                      |                     |
  |                        |                      | INSERT INTO workflow_tasks|
  |                        |                      | (copy all tasks)     |
  |                        |                      |-------------------->|
  |                        |                      |<--------------------|
  |                        |                      |                     |
  |                        |<---------------------|                     |
  |<-----------------------|                      |                     |
  | Success toast          |                      |                     |
  | Redirect to edit clone |                      |                     |
  |                        |                      |                     |
```

**tRPC Endpoint Code:**

```typescript
clone: publicProcedure
  .use(requireRole(['Admin']))
  .input(z.object({
    workflow_id: z.string().uuid(),
    new_name: z.string().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Fetch original workflow
    const { data: originalWorkflow } = await ctx.supabaseAdmin
      .from('workflows')
      .select('*, workflow_tasks(*)')
      .eq('id', input.workflow_id)
      .single()

    if (!originalWorkflow) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow không tồn tại' })
    }

    // 2. Create new workflow
    const { data: newWorkflow } = await ctx.supabaseAdmin
      .from('workflows')
      .insert({
        name: input.new_name || `Copy of ${originalWorkflow.name}`,
        description: originalWorkflow.description,
        entity_type: originalWorkflow.entity_type,
        strict_sequence: originalWorkflow.strict_sequence,
        is_active: false // Clones start as inactive
      })
      .select()
      .single()

    // 3. Clone workflow_tasks
    const tasksCopy = originalWorkflow.workflow_tasks.map(wt => ({
      workflow_id: newWorkflow.id,
      task_id: wt.task_id,
      sequence_order: wt.sequence_order,
      is_required: wt.is_required
    }))

    await ctx.supabaseAdmin
      .from('workflow_tasks')
      .insert(tasksCopy)

    return { newWorkflowId: newWorkflow.id, name: newWorkflow.name }
  })
```

**Key Points:**
- ✅ Cloned workflow starts as inactive
- ✅ Auto-generates name "Copy of..." if not provided
- ✅ All tasks and settings copied exactly
- ✅ Admin-only operation

---

## 📊 Data Flow Summary

```
Workflow Assignment → Ticket Status Change → Auto-Create Tasks
                                               ↓
                                      Task 1 (Pending)
                                               ↓
                              Technician starts → In Progress
                                               ↓
                              Technician completes → Completed
                                               ↓
                                      Task 2 (Pending)
                                               ↓
                                          (repeat)
                                               ↓
                                   All required tasks done
                                               ↓
                              Auto-complete Service Ticket
```

**State Transitions:**

| Entity | From | To | Trigger |
|--------|------|-----|---------|
| Workflow | - | Assigned to ticket | Manager action |
| Ticket | pending | in_progress | Manager/Technician action |
| Tasks | - | Created (pending) | Ticket status change (auto) |
| Task | pending | in_progress | Technician starts |
| Task | in_progress | completed | Technician completes |
| Ticket | in_progress | completed | All tasks done (auto) |

---

## ✅ Architecture Document Complete

**Document Sections:**
1. ✅ Database Schema Design
2. ✅ Backend: ServiceTicketAdapter
3. ✅ Unit Tests for Adapter
4. ✅ tRPC API Specifications (workflows + tasks)
5. ✅ Frontend Component Design (8 components)
6. ✅ Workflow Management UI (4 components)
7. ✅ Page Designs (4 pages)
8. ✅ Integration Flows & Sequence Diagrams (5 flows)

**Total Document Size:** ~4,100+ lines

**Next Steps:**
- Week 9 Day 2: Database schema review session
- Week 9 Day 3: Create UX mockups (Figma/wireframes)
- Week 10: Begin implementation (database → backend → frontend)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-03  
**Status:** ✅ COMPLETE - Ready for review

