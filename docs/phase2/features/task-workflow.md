# Task Workflow System

**Service Center Phase 2 - Feature Documentation**

Version: 1.0
Last Updated: 2025-10-24
Status: Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Concepts](#core-concepts)
4. [Features](#features)
5. [User Workflows](#user-workflows)
6. [Technical Details](#technical-details)
7. [Best Practices](#best-practices)

---

## Overview

The Task Workflow System is a comprehensive feature that enables structured, trackable service execution through predefined task templates. It transforms service tickets from simple status tracking into detailed, step-by-step workflows that guide technicians through the entire service process.

### Key Benefits

- **Standardization**: Ensures consistent service quality through predefined workflows
- **Traceability**: Complete audit trail of every task execution
- **Flexibility**: Supports both strict sequence enforcement and flexible execution
- **Visibility**: Real-time progress tracking for managers and technicians
- **Adaptability**: Dynamic template switching during service execution

### System Scope

The task workflow system integrates with:
- **Service Tickets**: Each ticket can have an associated task template
- **Team Management**: Tasks are assigned to specific technicians
- **Analytics**: Progress metrics and completion tracking
- **Notifications**: Real-time updates on task status changes

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Task Workflow System                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐        ┌──────────────┐               │
│  │ Task Types   │───────▶│  Templates   │               │
│  │  (Library)   │        │  (Workflows) │               │
│  └──────────────┘        └───────┬──────┘               │
│                                   │                       │
│                                   ▼                       │
│                          ┌────────────────┐              │
│                          │ Service Ticket │              │
│                          │     Tasks      │              │
│                          │  (Instances)   │              │
│                          └────────────────┘              │
│                                   │                       │
│                                   ▼                       │
│                          ┌────────────────┐              │
│                          │ Task History   │              │
│                          │  (Audit Trail) │              │
│                          └────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

The task workflow system consists of five primary tables:

1. **task_types**: Reusable library of task definitions
2. **task_templates**: Workflow definitions for different service types
3. **task_templates_tasks**: Junction table linking task types to templates
4. **service_ticket_tasks**: Task instances for specific tickets
5. **ticket_template_changes**: Audit trail for template switches
6. **task_history**: Immutable log of task status changes

---

## Core Concepts

### 1. Task Types

Task Types represent individual units of work that can be reused across multiple templates.

**Properties:**
- **Name**: Descriptive task name (e.g., "Initial Diagnosis", "Replace Battery")
- **Description**: Detailed instructions for the task
- **Category**: Grouping (Intake, Diagnosis, Repair, QA, Closing)
- **Estimated Duration**: Expected completion time in minutes
- **Requirements**: Whether notes or photos are mandatory
- **Status**: Active/inactive flag

**Example Task Types:**
```
1. Receive Device (Intake)
2. Initial Inspection (Diagnosis)
3. Run Diagnostic Tests (Diagnosis)
4. Replace Faulty Component (Repair)
5. Quality Assurance Check (QA)
6. Package for Return (Closing)
```

### 2. Task Templates

Task Templates are predefined workflows that combine multiple task types in a specific sequence.

**Properties:**
- **Name**: Template identifier (e.g., "iPhone Screen Replacement - Warranty")
- **Description**: Template purpose and use case
- **Product Type**: Optional link to specific product category
- **Service Type**: warranty, paid, or replacement
- **Enforce Sequence**: Strict vs. flexible execution mode
- **Active Status**: Whether template is currently in use

**Sequence Enforcement Modes:**

**Strict Mode** (`enforce_sequence = true`):
- Tasks must be completed in order
- Task N+1 is locked until Task N is completed or skipped
- Prevents out-of-sequence completion
- Recommended for quality-critical workflows

**Flexible Mode** (`enforce_sequence = false`):
- Tasks can be completed in any order
- Warnings displayed when completing out of sequence
- Allows parallel execution by multiple technicians
- Suitable for experienced teams or less critical workflows

### 3. Template Tasks (Junction)

Links task types to templates with additional metadata:

- **Sequence Order**: Execution order (1-based index)
- **Required Flag**: Whether task can be skipped
- **Custom Instructions**: Template-specific guidance overriding default

### 4. Service Ticket Tasks

Task instances created when a template is applied to a service ticket.

**Status Lifecycle:**
```
pending → in_progress → completed
   ↓            ↓
blocked      skipped
```

**Task States:**
- **pending**: Awaiting execution
- **in_progress**: Currently being worked on
- **completed**: Successfully finished with completion notes
- **blocked**: Cannot proceed (requires reason)
- **skipped**: Intentionally bypassed (for optional tasks)

**Key Fields:**
- **Assigned To**: Technician responsible for the task
- **Started At**: Timestamp when task began
- **Completed At**: Timestamp when task finished
- **Completion Notes**: Required documentation (minimum 5 characters)
- **Blocked Reason**: Explanation if task is blocked

---

## Features

### Feature 1: Template Management

**Access**: Admin, Manager

**Capabilities:**
- Create new templates from task type library
- Edit existing templates (creates new version)
- Deactivate/delete templates
- Filter templates by product type, service type, or status

**Template Versioning:**
When a template is updated:
1. Current template is marked as inactive
2. New template version is created with updated configuration
3. Old template remains in database for historical reference
4. Active tickets continue using their original template

**Validation Rules:**
- Template must have at least one task
- Sequence orders must be unique within template
- Cannot delete template in use by active tickets
- Template name must be unique

### Feature 2: Task Execution

**Access**: Technician, Admin, Manager

**My Tasks Page** (`/operations/my-tasks`):
- Shows all tasks assigned to current user
- Groups tasks by service ticket
- Displays progress metrics per ticket
- Real-time updates every 30 seconds
- Filterable by status

**Task Actions:**
```
pending state:
  → Start Task (changes to in_progress)

in_progress state:
  → Complete Task (requires completion notes)
  → Block Task (requires reason)

blocked state:
  → Resume Task (returns to in_progress)

All tasks:
  → Add Notes (appends to custom_instructions)
```

**Task Card Features:**
- Sequence number and task name
- Status badge with color coding
- Estimated vs. actual duration
- Custom instructions display
- Assigned technician information
- Quick action buttons

### Feature 3: Task Dependencies (Story 1.5)

**Prerequisite Validation:**
For each task, the system tracks all tasks with lower sequence orders.

**Strict Mode Behavior:**
- Task completion button is disabled if prerequisites incomplete
- Lock icon displayed on task card
- Tooltip explains which tasks must be completed first
- System prevents out-of-sequence completion

**Flexible Mode Behavior:**
- Task completion allowed regardless of prerequisites
- Warning dialog displayed before completion
- Lists incomplete prerequisite tasks
- User can proceed after acknowledging warning

**Dependency Indicator:**
Shows task relationships visually:
- Lock icon (strict mode, blocked)
- Warning triangle (flexible mode, out of sequence)
- Checkmark (all prerequisites complete)
- Popover lists specific prerequisite tasks

### Feature 4: Automatic Ticket Status Updates

**Status Sync Rules:**

When tasks change:
1. **First task starts** → Ticket status changes to `in_progress`
2. **All required tasks complete** → Ticket status changes to `completed`
3. **Any task blocked** → Ticket status remains unchanged (requires manual resolution)

This ensures ticket status accurately reflects workflow progress.

### Feature 5: Task Progress Dashboard (Story 1.16)

**Access**: Admin, Manager

**Dashboard Location**: `/dashboard/task-progress`

**Metrics Cards:**
- Active Tickets: Count of tickets with in-progress tasks
- Tasks In Progress: Currently active tasks across all tickets
- Blocked Tasks: Tasks requiring attention
- Average Completion Time: Historical performance metric

**Blocked Tasks Alert:**
- Lists tickets with blocked tasks
- Shows customer name and ticket number
- Count of blocked tasks per ticket
- Quick navigation to ticket details

**Technician Workload Table:**
- Tasks per technician (pending, in progress, completed, blocked)
- Completion rate percentage
- Workload distribution analysis
- Role-based filtering

**Database Views:**
The dashboard uses three materialized views:
- `v_task_progress_summary`: Overall system metrics
- `v_tickets_with_blocked_tasks`: Tickets needing attention
- `v_technician_workload`: Per-technician statistics

### Feature 6: Dynamic Template Switching (Story 1.17)

**Access**: Technician, Admin, Manager

**Use Cases:**
- Initial diagnosis reveals different issue than expected
- Customer upgrades service type mid-service
- Product type identified incorrectly at intake

**Switching Logic:**

1. **Validation Checks:**
   - Ticket must not be completed or cancelled
   - New template must be different from current
   - Cannot switch if all tasks already completed

2. **Task Preservation:**
   - Tasks with status `completed` are retained
   - Tasks with status `in_progress` are retained
   - Tasks with status `pending` or `blocked` are removed

3. **Task Addition:**
   - New template tasks not in old template are added
   - Added tasks start with status `pending`
   - Sequence order recalculated for all tasks

4. **Audit Trail:**
   - Template change logged to `ticket_template_changes`
   - Records old template, new template, reason
   - Tracks task counts (preserved, removed, added)
   - Stores who made the change and when

**Example Scenario:**
```
Old Template: "Basic Diagnosis" (3 tasks)
  Task 1: Receive Device [completed]
  Task 2: Visual Inspection [completed]
  Task 3: Customer Callback [pending]

New Template: "Full Repair" (5 tasks)
  Task 1: Receive Device
  Task 2: Visual Inspection
  Task 3: Component Testing [NEW]
  Task 4: Repair/Replace [NEW]
  Task 5: Quality Check [NEW]

Result:
  Task 1: Receive Device [completed] ← preserved
  Task 2: Visual Inspection [completed] ← preserved
  Task 3: Component Testing [pending] ← added
  Task 4: Repair/Replace [pending] ← added
  Task 5: Quality Check [pending] ← added
```

### Feature 7: Task Completion Modal

**Requirements:**
- Completion notes mandatory (minimum 5 characters)
- Notes stored in `completion_notes` field
- Timestamp automatically recorded
- Cannot complete if locked in strict mode

**Out-of-Sequence Warning (Flexible Mode):**
- Warning alert displayed prominently
- Lists incomplete prerequisite tasks with sequence numbers
- User must acknowledge before completing
- Recommended to complete tasks in order

**Validation:**
- Form validates note length client-side
- Server validates minimum 5 characters
- Database constraint ensures completed tasks have notes

---

## User Workflows

### Workflow 1: Creating a Task Template

**Actor**: Manager/Admin

**Steps:**
1. Navigate to `/workflows/templates`
2. Click "Create New Template" button
3. Fill in template details:
   - Name (required)
   - Description (optional)
   - Product Type (optional filter)
   - Service Type (warranty/paid/replacement)
   - Enforcement Mode (strict/flexible)
4. Add tasks from library:
   - Select task type from dropdown
   - Set sequence order
   - Mark as required/optional
   - Add custom instructions (optional)
5. Review task list preview
6. Click "Create Template"
7. System validates and creates template
8. Template appears in active templates list

**Validation Errors:**
- Duplicate template name
- Empty task list
- Duplicate sequence orders
- Missing required fields

### Workflow 2: Applying Template to Ticket

**Actor**: Reception/Technician

**Steps:**
1. Create or edit service ticket
2. Select template from dropdown (filtered by service type)
3. System instantiates tasks from template:
   - Creates `service_ticket_tasks` records
   - Sets all tasks to `pending` status
   - Preserves sequence order and requirements
4. Tasks appear in ticket detail view
5. Technician assigned to ticket sees tasks in "My Tasks"

**Alternative Flow**: Template can also be applied post-creation if ticket initially had no template.

### Workflow 3: Executing Tasks

**Actor**: Technician

**Steps:**
1. Navigate to `/operations/my-tasks` page
2. View tasks grouped by ticket
3. Select task to work on
4. Click "Start Task" button
   - Task status changes to `in_progress`
   - `started_at` timestamp recorded
   - Ticket status updates to `in_progress` if first task
5. Perform actual work
6. (Optional) Add progress notes via "Add Notes" button
7. Click "Complete Task"
   - System checks dependencies:
     - **Strict Mode**: Button disabled if prerequisites incomplete
     - **Flexible Mode**: Warning shown if prerequisites incomplete
8. Enter completion notes (minimum 5 characters)
9. Submit completion
   - Task status changes to `completed`
   - `completed_at` timestamp recorded
   - Progress percentage updates
   - If all required tasks complete, ticket status updates

**Error Scenarios:**
- **Blocked Task**: Click "Block Task", provide reason, task marked as `blocked`
- **Cannot Complete**: Prerequisites not met (strict mode)
- **Incomplete Notes**: Validation error, must provide sufficient detail

### Workflow 4: Switching Template Mid-Service

**Actor**: Technician/Manager

**Steps:**
1. Open ticket detail page
2. Click "Switch Template" button in task section
3. Select new template from dropdown
4. Enter reason for switch (minimum 10 characters)
5. Review preview:
   - Tasks to be preserved (completed/in-progress)
   - Tasks to be removed (pending/blocked)
   - Tasks to be added (from new template)
6. Confirm switch
7. System executes:
   - Removes pending/blocked tasks
   - Preserves completed/in-progress tasks
   - Adds new template tasks
   - Re-sequences all tasks
   - Updates ticket.template_id
   - Creates audit log entry
8. Success message shows task count summary
9. Refreshed task list displayed

**Use Case Example:**
Customer brings in "iPhone 12" for screen replacement (warranty). During diagnosis, technician discovers water damage (paid repair required). Switch from "Warranty Screen Repair" template to "Water Damage Repair" template.

### Workflow 5: Monitoring Task Progress

**Actor**: Manager/Admin

**Steps:**
1. Navigate to `/dashboard/task-progress`
2. View high-level metrics:
   - Active tickets count
   - Tasks in progress
   - Blocked tasks requiring attention
   - Average completion time
3. Review blocked tasks alert (if any):
   - See which tickets are blocked
   - Click ticket number to navigate to detail
4. Analyze technician workload table:
   - Identify overloaded technicians
   - Balance task assignments
   - Track completion rates
5. Take action:
   - Reassign tasks if needed
   - Resolve blockers
   - Adjust workflows based on metrics

---

## Technical Details

### Database Tables

#### task_types

```sql
CREATE TABLE task_types (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100),
  estimated_duration_minutes INT,
  requires_notes BOOLEAN DEFAULT false,
  requires_photo BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_task_types_category` on `category`
- `idx_task_types_active` on `is_active` (partial index)

#### task_templates

```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  product_type UUID REFERENCES products(id),
  service_type service_type NOT NULL DEFAULT 'warranty',
  enforce_sequence BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_task_templates_product_type` on `product_type`
- `idx_task_templates_service_type` on `service_type`
- `idx_task_templates_active` on `is_active` (partial index)

**Note**: `strict_sequence` was renamed to `enforce_sequence` in Story 1.5.

#### task_templates_tasks

```sql
CREATE TABLE task_templates_tasks (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES task_types(id) ON DELETE RESTRICT,
  sequence_order INT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  custom_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, sequence_order)
);
```

**Indexes:**
- `idx_task_templates_tasks_template` on `template_id`
- `idx_task_templates_tasks_type` on `task_type_id`
- `idx_task_templates_tasks_sequence` on `(template_id, sequence_order)`

#### service_ticket_tasks

```sql
CREATE TABLE service_ticket_tasks (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES task_types(id) ON DELETE RESTRICT,
  template_task_id UUID REFERENCES task_templates_tasks(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sequence_order INT NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  is_required BOOLEAN NOT NULL DEFAULT true,
  assigned_to_id UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, sequence_order),
  CHECK(status != 'completed' OR completion_notes IS NOT NULL),
  CHECK(status != 'blocked' OR blocked_reason IS NOT NULL)
);
```

**Indexes:**
- `idx_service_ticket_tasks_ticket` on `ticket_id`
- `idx_service_ticket_tasks_type` on `task_type_id`
- `idx_service_ticket_tasks_status` on `status`
- `idx_service_ticket_tasks_assigned` on `assigned_to_id` (partial, NOT NULL only)
- `idx_service_ticket_tasks_pending` on `(ticket_id, status)` (partial, pending/in_progress only)

**Constraints:**
- Completed tasks must have completion notes
- Blocked tasks must have blocked reason

#### ticket_template_changes

```sql
CREATE TABLE ticket_template_changes (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  old_template_id UUID REFERENCES task_templates(id),
  new_template_id UUID REFERENCES task_templates(id),
  reason TEXT NOT NULL,
  changed_by_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_ticket_template_changes_ticket` on `ticket_id`
- `idx_ticket_template_changes_created` on `created_at DESC`

#### task_history

```sql
CREATE TABLE task_history (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES service_ticket_tasks(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  old_status task_status,
  new_status task_status NOT NULL,
  changed_by_id UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Immutable audit trail of all task status changes.

### ENUMs

#### task_status

```sql
CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'skipped'
);
```

#### service_type

```sql
CREATE TYPE service_type AS ENUM (
  'warranty',
  'paid',
  'replacement'
);
```

### tRPC Procedures

Located in: `/src/server/routers/workflow.ts`

#### Task Type Procedures

**`workflow.taskType.list`**
- **Method**: Query
- **Auth**: Any authenticated user
- **Returns**: List of active task types
- **Use**: Populate template editor task library

**`workflow.taskType.create`**
- **Method**: Mutation
- **Auth**: Admin, Manager
- **Input**: `{ name, description, category, estimated_duration_minutes, requires_notes, requires_photo }`
- **Returns**: Created task type
- **Validation**: Name must be unique

#### Template Procedures

**`workflow.template.list`**
- **Method**: Query
- **Auth**: Any authenticated user
- **Input**: `{ product_type?, service_type?, is_active? }` (optional filters)
- **Returns**: List of templates with nested tasks
- **Use**: Template selection dropdowns, template management page

**`workflow.template.getById`**
- **Method**: Query
- **Auth**: Any authenticated user
- **Input**: `{ template_id: UUID }`
- **Returns**: Single template with all tasks, sorted by sequence
- **Use**: Template editor, preview modal

**`workflow.template.create`**
- **Method**: Mutation
- **Auth**: Admin, Manager
- **Input**: `{ name, description, product_type?, service_type, enforce_sequence, tasks[] }`
- **Returns**: Created template with tasks
- **Transaction**: Creates template and tasks atomically
- **Rollback**: Deletes template if task creation fails

**`workflow.template.update`**
- **Method**: Mutation
- **Auth**: Admin, Manager
- **Input**: `{ template_id, name, description, product_type?, service_type, enforce_sequence, tasks[] }`
- **Returns**: New template version
- **Versioning**: Deactivates old template, creates new version
- **Rollback**: Reactivates old template if new version fails

**`workflow.template.delete`**
- **Method**: Mutation
- **Auth**: Admin, Manager
- **Input**: `{ template_id, soft_delete: boolean }`
- **Validation**: Cannot delete if in use by active tickets
- **Behavior**: Soft delete marks as inactive, hard delete removes from database

#### Task Execution Procedures

**`workflow.myTasks`**
- **Method**: Query
- **Auth**: Any authenticated user
- **Returns**: Tasks assigned to current user with ticket details
- **Polling**: Client polls every 30 seconds for real-time updates
- **Filters**: Excludes skipped tasks

**`workflow.updateTaskStatus`**
- **Method**: Mutation
- **Auth**: Any authenticated user
- **Input**: `{ task_id, status: task_status }`
- **Updates**: Sets status, records `started_at` if transitioning to `in_progress`
- **Side Effects**: May trigger ticket status updates

**`workflow.completeTask`**
- **Method**: Mutation
- **Auth**: Any authenticated user
- **Input**: `{ task_id, completion_notes: string (min 5) }`
- **Updates**: Sets status to completed, records `completed_at`, appends notes
- **Validation**: Completion notes required, minimum 5 characters

**`workflow.addTaskNotes`**
- **Method**: Mutation
- **Auth**: Any authenticated user
- **Input**: `{ task_id, notes: string (min 1) }`
- **Behavior**: Appends timestamped notes to `custom_instructions`

**`workflow.getTaskDependencies`**
- **Method**: Query
- **Auth**: Any authenticated user
- **Input**: `{ task_id: UUID }`
- **Returns**: `{ prerequisites[], enforce_sequence, incomplete_count }`
- **Logic**: Fetches tasks with sequence_order < current task

#### Progress Dashboard Procedures

**`workflow.getTaskProgressSummary`**
- **Method**: Query
- **Auth**: Admin, Manager
- **Returns**: Aggregate metrics from `v_task_progress_summary` view
- **Metrics**: active_tickets, tasks_in_progress, tasks_blocked, avg_completion_hours

**`workflow.getTicketsWithBlockedTasks`**
- **Method**: Query
- **Auth**: Admin, Manager
- **Returns**: List from `v_tickets_with_blocked_tasks` view
- **Order**: By blocked_tasks_count DESC

**`workflow.getTechnicianWorkload`**
- **Method**: Query
- **Auth**: Admin, Manager
- **Input**: `{ technicianId?: UUID }` (optional filter)
- **Returns**: Per-technician task counts from `v_technician_workload` view
- **Order**: By tasks_in_progress DESC

**`workflow.getTaskCompletionTimeline`**
- **Method**: Query
- **Auth**: Admin, Manager
- **Input**: `{ daysBack: number (1-90, default 7) }`
- **Returns**: Daily completion counts via `get_task_completion_timeline` RPC

#### Template Switching Procedure

**`workflow.switchTemplate`**
- **Method**: Mutation
- **Auth**: Technician, Admin, Manager
- **Input**: `{ ticket_id, new_template_id, reason: string (min 10) }`
- **Returns**: `{ success: boolean, summary: { tasks_preserved, tasks_removed, tasks_added, total_tasks } }`
- **Logic**:
  1. Validate ticket status (not completed/cancelled)
  2. Validate template different from current
  3. Fetch existing tasks
  4. Fetch new template tasks
  5. Identify tasks to preserve (completed/in_progress)
  6. Delete pending/blocked tasks not in new template
  7. Add new template tasks not in old template
  8. Re-sequence all remaining tasks
  9. Update ticket.template_id
  10. Create audit log entry

### React Hooks

Located in: `/src/hooks/use-workflow.ts`

**Template Management:**
- `useTaskTypes()`: Fetch task library
- `useTaskTemplates(filters)`: List templates with filtering
- `useTaskTemplate(templateId)`: Get single template
- `useCreateTemplate()`: Create new template mutation
- `useUpdateTemplate()`: Update template (versioning) mutation
- `useDeleteTemplate()`: Delete/deactivate template mutation

**Task Execution:**
- `useMyTasks()`: Fetch tasks for current user (30s polling)
- `useUpdateTaskStatus()`: Change task status mutation
- `useCompleteTask()`: Complete task with notes mutation
- `useAddTaskNotes()`: Append notes to task mutation
- `useTaskDependencies(taskId)`: Get prerequisite tasks for dependency checking

**Progress & Analytics:**
- `useTaskProgressSummary()`: Overall system metrics
- `useTicketsWithBlockedTasks()`: Blocked task alert data
- `useTechnicianWorkload()`: Workload distribution data

**Template Switching:**
- `useSwitchTemplate()`: Dynamic template change mutation

### UI Components

**Shared Components:**
- `TaskExecutionCard`: Interactive task card with action buttons
- `TaskStatusBadge`: Color-coded status indicator
- `TaskDependencyIndicator`: Lock/warning icons with prerequisite popover
- `TaskListAccordion`: Collapsible task list for ticket detail

**Modals:**
- `TaskCompletionModal`: Completion notes form with out-of-sequence warning
- `TemplateEditorModal`: Full-featured template creation/editing dialog
- `TemplatePreviewModal`: Read-only template visualization

**Tables:**
- `TemplateListTable`: Template management with actions

**Pages:**
- `/workflows/templates`: Template management page (Admin/Manager)
- `/operations/my-tasks`: Technician task execution page
- `/dashboard/task-progress`: Manager progress dashboard

---

## Best Practices

### Template Design

**1. Keep Templates Focused**
- One template per service scenario
- Avoid overly generic templates
- Typical range: 5-15 tasks per template

**2. Use Clear Task Names**
- Action-oriented (e.g., "Test battery voltage", not "Battery")
- Specific enough to be unambiguous
- Consistent naming conventions across templates

**3. Sequence Tasks Logically**
- Group by category (Intake → Diagnosis → Repair → QA → Closing)
- Dependencies should be obvious
- Critical tasks early in sequence

**4. Choose Enforcement Mode Carefully**
- **Strict**: Quality-critical workflows, inexperienced staff, warranty services
- **Flexible**: Experienced teams, parallel work possible, time-sensitive repairs

**5. Provide Context in Descriptions**
- Explain **why** the task is needed, not just **what** to do
- Include safety warnings if applicable
- Reference tools or parts required

### Task Execution

**1. Start Tasks Promptly**
- Mark tasks as `in_progress` when you begin work
- Keeps managers informed of real-time status
- Accurate time tracking

**2. Document Thoroughly**
- Add notes during execution, not just at completion
- Capture unexpected findings
- Photos for visual evidence (future enhancement)

**3. Complete in Sequence (When Possible)**
- Even in flexible mode, prefer sequential execution
- Prevents rework and quality issues
- Easier for next technician to follow

**4. Block Tasks Immediately**
- Don't leave tasks in `in_progress` if blocked
- Provide clear, actionable reason
- Notify manager or reception for resolution

**5. Use Completion Notes Effectively**
- Minimum 5 characters, but aim for 50+
- Document outcomes, not just actions
- Future reference for similar issues

### Template Management

**1. Version Control**
- Document changes in template description
- Keep inactive versions for historical reference
- Review template effectiveness quarterly

**2. Standardization vs. Flexibility**
- Balance between consistency and adaptability
- Regular team feedback on template usability
- Adjust based on completion time metrics

**3. Testing New Templates**
- Pilot with experienced technicians first
- Gather feedback after 5-10 uses
- Iterate based on real-world performance

### Monitoring & Optimization

**1. Review Progress Dashboard Weekly**
- Identify consistently blocked tasks (process issues)
- Balance technician workload
- Track average completion times

**2. Analyze Template Effectiveness**
- Compare estimated vs. actual durations
- Identify skipped tasks (may not be needed)
- Look for tasks frequently blocked (dependencies incorrect)

**3. Continuous Improvement**
- Update templates based on lessons learned
- Remove obsolete tasks
- Add tasks for recurring issues

### System Performance

**1. Database Optimization**
- Indexes are already optimized for common queries
- Archive completed tasks older than 1 year (future)
- Monitor `service_ticket_tasks` table growth

**2. Real-Time Updates**
- 30-second polling is sufficient for most use cases
- Consider WebSocket for high-volume scenarios (future)
- Browser notifications for task assignments (future)

---

## Appendix: Related Documentation

- **User Guide**: [Task Workflow User Guide](../user-guides/task-workflow-guide.md)
- **API Reference**: [Workflow Router API](../api/workflow-router.md)
- **Database Schema**: [Task Tables Schema](../../data/schemas/13_task_tables.sql)
- **Architecture**: [Task Workflow Architecture](../TASK_WORKFLOW_ARCHITECTURE.md)

---

**End of Documentation**
