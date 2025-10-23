# Requirements: Task Workflow System

## Document Information

**Document ID**: REQ-TWS-001
**Version**: 1.0
**Date**: 2025-10-22
**Status**: Draft
**Related Documents**:
- REQ_WAREHOUSE_PHYSICAL_PRODUCTS.md
- REQ_SERVICE_REQUEST_LAYER.md
- TASK_WORKFLOW_ARCHITECTURE.md

---

## Business Context

### Purpose

The Task Workflow System transforms the service ticket process from a simple status-based progression to a structured, step-by-step workflow that ensures consistency, accountability, and quality control. It addresses the need for:

1. **Standardized Service Procedures**: Ensure every product type receives consistent service quality
2. **Team Coordination**: Clear task assignments prevent confusion about who does what
3. **Progress Tracking**: Granular visibility into ticket progress beyond simple status
4. **Dynamic Adaptation**: Template switching when service type changes (warranty → paid repair)
5. **Quality Assurance**: Checklists and verification steps reduce errors

### Key Stakeholders

- **Technicians**: Execute tasks, update progress, document findings
- **Managers**: Monitor workflow compliance, identify bottlenecks
- **Reception Staff**: Understand service progress when customers inquire
- **Customers**: Benefit from consistent, high-quality service delivery

### Business Value

- **Reduced Errors**: Checklists ensure no steps are skipped
- **Faster Onboarding**: New technicians follow clear workflows
- **Better Estimates**: Historical task data improves time predictions
- **Audit Compliance**: Complete task history for warranty claims
- **Process Optimization**: Identify which steps take longest

---

## Functional Requirements

### FR-TWS-001: Task Template Management

**Description**: System provides pre-defined task templates for different service scenarios that can be customized by administrators.

**Template Types**:
1. **By Warranty Type**: Warranty Service, Paid Repair, Replacement
2. **By Product Type**: iPhone, MacBook, iPad, etc.
3. **By Service Complexity**: Standard, Complex, Express

**Business Rules**:
- Each product type can have multiple templates (one per warranty type)
- Templates contain ordered list of tasks
- Tasks have: name, description, estimated duration, default assignee role
- Templates can be active/inactive (versioning)
- Only Admin role can create/edit templates

**User Story**:
```
AS AN administrator
I WANT to define standard task workflows for different service types
SO THAT all technicians follow consistent procedures
```

**Acceptance Criteria**:
- [ ] Template editor with drag-and-drop task ordering
- [ ] Task library: reusable task definitions
- [ ] Template assignment to product types
- [ ] Version history for template changes
- [ ] Preview template before activation
- [ ] Clone existing template to create variations

**Template Structure**:
```typescript
interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  product_type_id: string;
  service_type: 'warranty' | 'paid' | 'replacement';
  status: 'active' | 'inactive';
  version: number;

  tasks: TemplateTask[];

  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface TemplateTask {
  sequence_order: number; // 1, 2, 3, etc.
  task_type_id: string; // References task_types table
  is_required: boolean;
  estimated_duration_minutes: number;
  default_assignee_role: 'technician' | 'manager' | 'reception';
  dependencies?: string[]; // Task IDs that must complete first
}
```

---

### FR-TWS-002: Default Task Types Library

**Description**: System provides a pre-configured library of common task types that serve as building blocks for templates.

**Default Task Types** (Examples):

| Category | Task Type | Description | Typical Duration |
|----------|-----------|-------------|------------------|
| **Intake** | Initial Inspection | Visual inspection, document damage | 10 min |
| **Intake** | Serial Verification | Verify serial matches records | 5 min |
| **Diagnosis** | Run Diagnostic Tests | Execute standard diagnostic suite | 30 min |
| **Diagnosis** | Identify Root Cause | Determine failure reason | 20 min |
| **Diagnosis** | Prepare Cost Estimate | Calculate repair costs | 15 min |
| **Approval** | Await Customer Approval | Waiting state for customer decision | N/A |
| **Repair** | Replace Component | Physical component replacement | 45 min |
| **Repair** | Software Restore | OS reinstall, updates | 60 min |
| **Repair** | Calibration & Testing | Post-repair calibration | 20 min |
| **QA** | Quality Check | Verify repair meets standards | 15 min |
| **QA** | Final Testing | Comprehensive functionality test | 30 min |
| **Closing** | Clean Device | Physical cleaning before return | 10 min |
| **Closing** | Package for Delivery | Prepare for customer pickup | 5 min |
| **Closing** | Update Inventory | Record parts used | 10 min |

**Business Rules**:
- Admin can add custom task types
- Task types can be categorized (tags)
- Deletion only if not used in any active template
- Each task type has default duration estimate

**User Story**:
```
AS AN administrator
I WANT a library of standard task types
SO THAT I can quickly build templates without recreating common tasks
```

**Acceptance Criteria**:
- [ ] Task type CRUD interface (Admin only)
- [ ] Categorization/tagging system
- [ ] Search and filter task types
- [ ] Usage tracking (how many templates use each type)
- [ ] Cannot delete task types in use

---

### FR-TWS-003: Automatic Task Generation on Ticket Creation

**Description**: When a service ticket is created, the system automatically generates tasks based on the appropriate template.

**Template Selection Logic**:
```
1. Identify product type from ticket
2. Determine service type:
   - IF warranty valid → "warranty" template
   - IF replacement approved → "replacement" template
   - ELSE → "paid" template
3. Load template for (product_type + service_type)
4. Generate task instances from template
5. Assign default technicians based on roles
```

**Business Rules**:
- Task generation happens atomically with ticket creation
- Each task gets unique ID, linked to ticket_id
- Initial status: `pending` (except first task which may be `in_progress`)
- Sequence order preserved from template
- Default assignees can be overridden by reception staff

**User Story**:
```
AS A reception staff member
I WANT tasks to be automatically created when I create a ticket
SO THAT I don't have to manually set up the workflow
```

**Acceptance Criteria**:
- [ ] Tasks created in single database transaction with ticket
- [ ] Correct template selected based on product + service type
- [ ] Tasks ordered by sequence_order
- [ ] Default assignments populated
- [ ] Task count displayed on ticket summary

**SQL Implementation**:
```sql
-- Trigger function to auto-generate tasks
CREATE OR REPLACE FUNCTION generate_ticket_tasks()
RETURNS TRIGGER AS $$
DECLARE
  template_id UUID;
  task_template RECORD;
BEGIN
  -- Find appropriate template
  SELECT id INTO template_id
  FROM task_templates
  WHERE product_type_id = NEW.product_id
    AND service_type = NEW.service_type
    AND status = 'active'
  ORDER BY version DESC
  LIMIT 1;

  -- If no template found, skip task generation
  IF template_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Generate tasks from template
  INSERT INTO service_ticket_tasks (
    ticket_id,
    task_type_id,
    sequence_order,
    status,
    assigned_to,
    estimated_duration_minutes
  )
  SELECT
    NEW.id,
    tt.task_type_id,
    tt.sequence_order,
    'pending',
    get_default_assignee(tt.default_assignee_role, NEW.id),
    tt.estimated_duration_minutes
  FROM task_templates_tasks tt
  WHERE tt.template_id = template_id
  ORDER BY tt.sequence_order;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_tasks
  AFTER INSERT ON service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_tasks();
```

---

### FR-TWS-004: Task Assignment and Ownership

**Description**: Each task is assigned to a specific team member who is responsible for its completion.

**Assignment Rules**:
- **Default Assignment**: Based on template's default_assignee_role
- **Manual Override**: Manager/reception can reassign tasks
- **Self-Assignment**: Technicians can claim unassigned tasks
- **Reassignment**: Tasks can be reassigned if assignee unavailable

**Assignment States**:
- **Unassigned**: No specific person (shows as "Technician Team")
- **Assigned**: Specific person assigned
- **Claimed**: Technician claimed from unassigned pool

**Business Rules**:
- Cannot assign to user with incompatible role
- Assignment change logged in task history
- Notification sent to newly assigned technician
- Workload balancing: show task count per technician

**User Story**:
```
AS A manager
I WANT to assign tasks to specific technicians
SO THAT I can balance workload and leverage specialized skills
```

**Acceptance Criteria**:
- [ ] Assign/reassign task to team member
- [ ] Filter tasks by assignee
- [ ] View technician workload (open task count)
- [ ] Assignment history in audit log
- [ ] Email/notification on assignment

---

### FR-TWS-005: Task Status Lifecycle

**Description**: Tasks progress through defined statuses from creation to completion.

**Status Definitions**:

| Status | Description | Can Edit? | Next States |
|--------|-------------|-----------|-------------|
| `pending` | Not yet started | No | `in_progress`, `blocked`, `cancelled` |
| `in_progress` | Actively being worked on | Yes | `completed`, `blocked`, `pending` |
| `blocked` | Cannot proceed due to dependency/issue | Yes | `in_progress`, `cancelled` |
| `completed` | Successfully finished | No | N/A (terminal) |
| `cancelled` | Skipped or no longer needed | No | N/A (terminal) |

**Business Rules**:
- Only assigned technician can change task status
- Managers can override (audit logged)
- `completed` status requires completion notes
- `blocked` status requires blocker description
- Cannot mark task as completed if required predecessor tasks not completed

**User Story**:
```
AS A technician
I WANT to update task status as I work
SO THAT everyone knows the current progress
```

**Acceptance Criteria**:
- [ ] Status update with one click (quick actions)
- [ ] Required fields based on status (e.g., notes for completion)
- [ ] Visual status indicators (colors, icons)
- [ ] Timestamp tracking for each status change
- [ ] Validation prevents invalid status transitions

**Status Transition Validation**:
```typescript
// Allowed transitions
const VALID_TRANSITIONS = {
  pending: ['in_progress', 'blocked', 'cancelled'],
  in_progress: ['completed', 'blocked', 'pending'],
  blocked: ['in_progress', 'cancelled'],
  completed: [], // Terminal state
  cancelled: []  // Terminal state
};

function validateStatusTransition(oldStatus: string, newStatus: string): boolean {
  return VALID_TRANSITIONS[oldStatus]?.includes(newStatus) ?? false;
}
```

---

### FR-TWS-006: Simple Task Dependencies (Sequence Order)

**Description**: Tasks are ordered sequentially, with optional strict enforcement of order completion.

**Dependency Model**: **Sequence Order (Simple)**
- Tasks numbered 1, 2, 3, etc.
- Visual representation shows tasks in order
- Optional validation: Cannot start task N before task N-1 completed

**Business Rules**:
- **Strict Mode** (configurable per template):
  - Must complete tasks in order
  - Task status gated by previous task completion
  - Used for critical workflows (e.g., warranty service)

- **Flexible Mode** (default):
  - Tasks can be completed in any order
  - Sequence is guideline, not enforcement
  - Used for routine repairs

**User Story**:
```
AS A technician
I WANT to see tasks in recommended order
SO THAT I follow best practices but can adapt if needed
```

**Acceptance Criteria**:
- [ ] Tasks displayed in sequence_order
- [ ] Visual indicator of current position in workflow
- [ ] Warning (not block) if skipping tasks in flexible mode
- [ ] Hard block in strict mode
- [ ] Template setting controls strict vs flexible

**Implementation**:
```sql
-- Check if previous task is completed (strict mode)
CREATE OR REPLACE FUNCTION check_task_sequence_gate()
RETURNS TRIGGER AS $$
DECLARE
  template_strict_mode BOOLEAN;
  previous_task_completed BOOLEAN;
BEGIN
  -- Only check if marking task as in_progress or completed
  IF NEW.status NOT IN ('in_progress', 'completed') THEN
    RETURN NEW;
  END IF;

  -- Check if template has strict mode enabled
  SELECT tt.enforce_strict_order INTO template_strict_mode
  FROM service_tickets st
  JOIN task_templates tt ON tt.id = st.template_id
  WHERE st.id = NEW.ticket_id;

  -- Skip if not strict mode
  IF NOT template_strict_mode THEN
    RETURN NEW;
  END IF;

  -- Check if previous task is completed
  SELECT EXISTS (
    SELECT 1
    FROM service_ticket_tasks
    WHERE ticket_id = NEW.ticket_id
      AND sequence_order = NEW.sequence_order - 1
      AND status = 'completed'
  ) INTO previous_task_completed;

  -- If previous task not completed, block
  IF NEW.sequence_order > 1 AND NOT previous_task_completed THEN
    RAISE EXCEPTION 'Cannot start task % before completing task %',
      NEW.sequence_order, NEW.sequence_order - 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_task_sequence
  BEFORE UPDATE OF status ON service_ticket_tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_task_sequence_gate();
```

---

### FR-TWS-007: Dynamic Template Switching (Preserve + Append)

**Description**: When service type changes during ticket lifecycle (e.g., warranty → paid repair), the system intelligently updates the task list.

**Trigger Scenarios**:
1. Warranty validation fails during diagnosis
2. Customer declines warranty service, opts for paid repair
3. Replacement approved changes to replacement workflow

**Switching Behavior**: **Preserve + Append**

```
BEFORE (Warranty Template):
1. ✅ Initial Inspection (completed)
2. ✅ Run Diagnostic Tests (completed)
3. ⏳ Identify Root Cause (in progress)
4. ⏸️ Prepare Cost Estimate (pending)
5. ⏸️ Replace Component (pending)
6. ⏸️ Quality Check (pending)

AFTER SWITCH (to Paid Repair Template):
1. ✅ Initial Inspection (preserved - completed)
2. ✅ Run Diagnostic Tests (preserved - completed)
3. ⏳ Identify Root Cause (preserved - in progress)
4. ⏸️ Prepare Cost Estimate (preserved - pending)
5. ⏸️ Await Customer Approval (NEW - appended)
6. ⏸️ Replace Component (preserved - pending)
7. ⏸️ Process Payment (NEW - appended)
8. ⏸️ Quality Check (preserved - pending)
```

**Logic**:
1. Keep all completed tasks (historical record)
2. Keep all in-progress tasks (don't disrupt current work)
3. Remove pending tasks not in new template
4. Add new tasks from new template that don't exist
5. Re-sequence all tasks to maintain order

**Business Rules**:
- Template switch logged in ticket history
- Completed tasks never deleted (audit trail)
- Assignees preserved where possible
- Manager approval required for template switch
- Customer notified if approval requirements change

**User Story**:
```
AS A technician
I WANT the task list to update when service type changes
SO THAT I don't follow outdated workflow steps
```

**Acceptance Criteria**:
- [ ] Manager can trigger template switch
- [ ] Confirmation dialog shows what will change
- [ ] Completed/in-progress tasks preserved
- [ ] New required tasks added
- [ ] Notification sent to assigned technicians
- [ ] Audit log records switch reason

**Implementation**:
```typescript
async function switchTemplate(
  ticketId: string,
  newTemplateId: string,
  reason: string,
  switchedBy: string
) {
  // 1. Get current tasks
  const currentTasks = await db.query(`
    SELECT * FROM service_ticket_tasks
    WHERE ticket_id = $1
    ORDER BY sequence_order
  `, [ticketId]);

  // 2. Get new template tasks
  const newTemplateTasks = await db.query(`
    SELECT * FROM task_templates_tasks
    WHERE template_id = $1
    ORDER BY sequence_order
  `, [newTemplateId]);

  // 3. Preserve completed and in-progress tasks
  const preservedTasks = currentTasks.filter(t =>
    ['completed', 'in_progress'].includes(t.status)
  );

  // 4. Identify new tasks to add
  const preservedTaskTypeIds = preservedTasks.map(t => t.task_type_id);
  const newTasks = newTemplateTasks.filter(tt =>
    !preservedTaskTypeIds.includes(tt.task_type_id)
  );

  // 5. Delete pending tasks not in new template
  await db.query(`
    DELETE FROM service_ticket_tasks
    WHERE ticket_id = $1 AND status = 'pending'
  `, [ticketId]);

  // 6. Insert new tasks
  for (const newTask of newTasks) {
    await db.query(`
      INSERT INTO service_ticket_tasks (
        ticket_id, task_type_id, sequence_order,
        status, estimated_duration_minutes
      ) VALUES ($1, $2, $3, 'pending', $4)
    `, [ticketId, newTask.task_type_id, newTask.sequence_order, newTask.estimated_duration_minutes]);
  }

  // 7. Re-sequence all tasks
  await resequenceTasks(ticketId);

  // 8. Log template switch
  await db.query(`
    INSERT INTO ticket_template_changes (
      ticket_id, old_template_id, new_template_id,
      reason, changed_by, changed_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
  `, [ticketId, oldTemplateId, newTemplateId, reason, switchedBy]);
}
```

---

### FR-TWS-008: Task Completion Actions (Update Ticket)

**Description**: Completing certain tasks triggers automatic updates to the parent service ticket.

**Task Completion Behaviors**:

| Task Type | Ticket Update Action |
|-----------|----------------------|
| **Run Diagnostic Tests** | Set ticket.diagnosis_notes |
| **Prepare Cost Estimate** | Set ticket.diagnosis_fee, ticket.service_fee |
| **Await Customer Approval** | Change ticket status to `awaiting_approval` |
| **Replace Component** | Add entry to service_ticket_parts |
| **Final Testing** | Set ticket.completion_notes |
| **Quality Check** | Change ticket status to `completed` (if last task) |
| **Package for Delivery** | Change ticket status to `awaiting_customer_confirmation` |

**Business Rules**:
- Task completion can trigger ticket status change
- Task completion can populate ticket fields
- Task completion can create related records (parts usage)
- If last required task completed → ticket auto-advances to next stage

**User Story**:
```
AS A technician
I WANT my task completion to update the ticket automatically
SO THAT I don't have to manually sync information
```

**Acceptance Criteria**:
- [ ] Task completion form includes relevant ticket fields
- [ ] Ticket updates happen atomically with task completion
- [ ] Validation ensures required data provided
- [ ] Audit log tracks what changed and why
- [ ] Automatic status progression when workflow complete

**Example Flow**:
```
Technician completes "Prepare Cost Estimate" task:
1. Task status → completed
2. Technician enters:
   - Diagnosis notes: "Water damage, motherboard corrosion"
   - Diagnosis fee: 100,000 VND
   - Service fee: 500,000 VND
   - Parts needed: [{"name": "Battery", "cost": 200000}]
3. System updates ticket:
   - ticket.diagnosis_notes = "Water damage..."
   - ticket.diagnosis_fee = 100000
   - ticket.service_fee = 500000
4. System advances to next task: "Await Customer Approval"
5. System changes ticket.status = 'awaiting_approval'
6. System sends email to customer with approval request
```

---

### FR-TWS-009: Task Progress Visibility

**Description**: Technicians, managers, and customers can view task progress at different granularity levels.

**Visibility Levels**:

**Technician View**:
- All tasks for assigned tickets
- Detailed task descriptions and checklists
- Edit task status and notes
- See task history (who did what, when)

**Manager View**:
- All tasks across all tickets
- Filter by: status, assignee, overdue, blocked
- Workload dashboard (tasks per technician)
- Override task assignments

**Customer View** (via public portal):
- High-level progress (e.g., "Step 3 of 8: Diagnosis in progress")
- Task names simplified (technical jargon removed)
- No assignee names (privacy)
- Estimated completion based on task progress

**User Story**:
```
AS A customer
I WANT to see detailed progress on my service ticket
SO THAT I know what stage my device is in
```

**Acceptance Criteria**:
- [ ] Technician dashboard shows "My Tasks" list
- [ ] Manager dashboard shows team-wide task overview
- [ ] Customer tracking page shows simplified task progress
- [ ] Progress bar visualization (X of Y tasks completed)
- [ ] Real-time updates (no page refresh needed)

**Customer-Facing Task Labels**:
```typescript
// Internal task name → Customer-friendly label
const CUSTOMER_LABELS = {
  'Run Diagnostic Tests': 'Diagnosing your device',
  'Identify Root Cause': 'Diagnosing your device',
  'Prepare Cost Estimate': 'Preparing repair estimate',
  'Await Customer Approval': 'Waiting for your approval',
  'Replace Component': 'Repairing your device',
  'Software Restore': 'Repairing your device',
  'Quality Check': 'Final quality inspection',
  'Final Testing': 'Final quality inspection',
  'Package for Delivery': 'Preparing for return'
};
```

---

### FR-TWS-010: Task Time Tracking

**Description**: System tracks actual time spent on tasks vs. estimated time for process improvement.

**Tracked Metrics**:
- **Estimated Duration**: From template (baseline)
- **Actual Duration**: Start time → completion time
- **Active Work Time**: Optional manual tracking (timer)
- **Wait Time**: Time task spent in `blocked` status

**Business Rules**:
- Start time recorded when status → `in_progress`
- End time recorded when status → `completed`
- Actual duration = end_time - start_time (elapsed, not active work)
- Historical data used to improve template estimates

**User Story**:
```
AS A manager
I WANT to see actual time spent on tasks vs estimates
SO THAT I can improve future time estimates and identify bottlenecks
```

**Acceptance Criteria**:
- [ ] Automatic start/end time tracking
- [ ] Optional manual timer for active work tracking
- [ ] Task analytics dashboard showing avg time per task type
- [ ] Identify tasks that consistently exceed estimates
- [ ] Export task time data for analysis

**Analytics Queries**:
```sql
-- Average actual duration vs estimated duration by task type
SELECT
  tt.name AS task_type,
  AVG(EXTRACT(EPOCH FROM (stt.completed_at - stt.started_at)) / 60) AS avg_actual_minutes,
  AVG(stt.estimated_duration_minutes) AS avg_estimated_minutes,
  COUNT(*) AS sample_size
FROM service_ticket_tasks stt
JOIN task_types tt ON stt.task_type_id = tt.id
WHERE stt.status = 'completed'
  AND stt.started_at IS NOT NULL
GROUP BY tt.id, tt.name
ORDER BY avg_actual_minutes DESC;
```

---

## Data Model

### Task Templates Table

```sql
CREATE TABLE task_templates (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Template applicability
  product_type_id UUID REFERENCES products(id),
  service_type VARCHAR(20) NOT NULL
    CHECK (service_type IN ('warranty', 'paid', 'replacement')),

  -- Configuration
  enforce_strict_order BOOLEAN DEFAULT false,
  version INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'draft')),

  -- Audit
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Unique constraint: one active template per product + service type
  CONSTRAINT unique_active_template
    UNIQUE (product_type_id, service_type, status)
    WHERE status = 'active'
);

-- Indexes
CREATE INDEX idx_task_templates_product ON task_templates(product_type_id);
CREATE INDEX idx_task_templates_status ON task_templates(status);
```

---

### Task Types Table (Library)

```sql
CREATE TABLE task_types (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task type definition
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50), -- 'intake', 'diagnosis', 'repair', 'qa', 'closing'

  -- Default settings
  default_duration_minutes INT DEFAULT 30,
  is_system_defined BOOLEAN DEFAULT false, -- Cannot delete if true

  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_task_types_category ON task_types(category);
CREATE INDEX idx_task_types_name ON task_types(name);
```

---

### Template Tasks Junction Table

```sql
CREATE TABLE task_templates_tasks (
  -- Composite primary key
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES task_types(id),

  -- Ordering
  sequence_order INT NOT NULL,

  -- Task configuration in template
  is_required BOOLEAN DEFAULT true,
  estimated_duration_minutes INT,
  default_assignee_role VARCHAR(20)
    CHECK (default_assignee_role IN ('technician', 'manager', 'reception', 'any')),

  -- Optional dependencies (for future complex workflows)
  depends_on_task_type_ids UUID[], -- Array of task_type_ids

  -- Audit
  created_at TIMESTAMP DEFAULT now(),

  PRIMARY KEY (template_id, task_type_id),
  CONSTRAINT unique_sequence_per_template
    UNIQUE (template_id, sequence_order)
);

-- Indexes
CREATE INDEX idx_template_tasks_template ON task_templates_tasks(template_id);
CREATE INDEX idx_template_tasks_order ON task_templates_tasks(template_id, sequence_order);
```

---

### Service Ticket Tasks Table

```sql
CREATE TABLE service_ticket_tasks (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES task_types(id),

  -- Ordering and status
  sequence_order INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'blocked', 'completed', 'cancelled')),

  -- Assignment
  assigned_to UUID REFERENCES profiles(id),

  -- Time tracking
  estimated_duration_minutes INT,
  started_at TIMESTAMP, -- When status → in_progress
  completed_at TIMESTAMP, -- When status → completed
  blocked_at TIMESTAMP, -- When status → blocked

  -- Task data
  notes TEXT, -- Technician notes during work
  completion_notes TEXT, -- Required notes when completing
  blocker_description TEXT, -- Required if status = blocked

  -- Result data (varies by task type)
  result_data JSONB, -- Flexible storage for task-specific outputs

  -- Audit
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT unique_sequence_per_ticket
    UNIQUE (ticket_id, sequence_order)
);

-- Indexes
CREATE INDEX idx_ticket_tasks_ticket ON service_ticket_tasks(ticket_id, sequence_order);
CREATE INDEX idx_ticket_tasks_assignee ON service_ticket_tasks(assigned_to, status);
CREATE INDEX idx_ticket_tasks_status ON service_ticket_tasks(status);
CREATE INDEX idx_ticket_tasks_type ON service_ticket_tasks(task_type_id);

-- Auto-update timestamps
CREATE TRIGGER update_ticket_tasks_timestamps
  BEFORE UPDATE ON service_ticket_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-set started_at when status → in_progress
CREATE TRIGGER set_task_started_at
  BEFORE UPDATE OF status ON service_ticket_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'in_progress' AND OLD.status != 'in_progress')
  EXECUTE FUNCTION set_started_timestamp();

-- Auto-set completed_at when status → completed
CREATE TRIGGER set_task_completed_at
  BEFORE UPDATE OF status ON service_ticket_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION set_completed_timestamp();
```

---

### Task History Table (Audit Log)

```sql
CREATE TABLE task_history (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  task_id UUID NOT NULL REFERENCES service_ticket_tasks(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES service_tickets(id),

  -- Change tracking
  action VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'assigned', 'reassigned', 'updated'
  old_value JSONB,
  new_value JSONB,

  -- Actor
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_at TIMESTAMP DEFAULT now(),

  -- Notes
  notes TEXT
);

-- Indexes
CREATE INDEX idx_task_history_task ON task_history(task_id);
CREATE INDEX idx_task_history_ticket ON task_history(ticket_id);
CREATE INDEX idx_task_history_changed_at ON task_history(changed_at DESC);
```

---

### Template Change History Table

```sql
CREATE TABLE ticket_template_changes (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,

  -- Template change
  old_template_id UUID REFERENCES task_templates(id),
  new_template_id UUID REFERENCES task_templates(id),

  -- Reason and actor
  reason TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_at TIMESTAMP DEFAULT now(),

  -- Impact summary
  tasks_preserved INT, -- Count of kept tasks
  tasks_added INT, -- Count of new tasks
  tasks_removed INT -- Count of deleted tasks
);

-- Indexes
CREATE INDEX idx_template_changes_ticket ON ticket_template_changes(ticket_id);
CREATE INDEX idx_template_changes_date ON ticket_template_changes(changed_at DESC);
```

---

### Service Tickets Extension

```sql
-- Add columns to existing service_tickets table
ALTER TABLE service_tickets
  ADD COLUMN template_id UUID REFERENCES task_templates(id),
  ADD COLUMN total_estimated_duration_minutes INT, -- Sum of all task estimates
  ADD COLUMN total_actual_duration_minutes INT; -- Sum of all actual durations

-- Index for template lookups
CREATE INDEX idx_service_tickets_template ON service_tickets(template_id);

-- Trigger to update total_actual_duration when tasks complete
CREATE OR REPLACE FUNCTION update_ticket_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_tickets
  SET total_actual_duration_minutes = (
    SELECT SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)
    FROM service_ticket_tasks
    WHERE ticket_id = NEW.ticket_id
      AND status = 'completed'
      AND started_at IS NOT NULL
      AND completed_at IS NOT NULL
  )
  WHERE id = NEW.ticket_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_ticket_duration
  AFTER UPDATE OF status ON service_ticket_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_ticket_duration();
```

---

## Business Rules

### BR-TWS-001: Template Assignment Validation

**Rule**: Task template must match ticket's product type and service type.

**Enforcement**:
```sql
-- Validation function
CREATE OR REPLACE FUNCTION validate_template_assignment()
RETURNS TRIGGER AS $$
DECLARE
  template_product_id UUID;
  template_service_type VARCHAR(20);
BEGIN
  -- Get template details
  SELECT product_type_id, service_type
  INTO template_product_id, template_service_type
  FROM task_templates
  WHERE id = NEW.template_id;

  -- Validate product type match
  IF template_product_id != NEW.product_id THEN
    RAISE EXCEPTION 'Template product type does not match ticket product type';
  END IF;

  -- Validate service type match
  IF template_service_type != NEW.service_type THEN
    RAISE EXCEPTION 'Template service type does not match ticket service type';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_template_assignment
  BEFORE INSERT OR UPDATE OF template_id ON service_tickets
  FOR EACH ROW
  WHEN (NEW.template_id IS NOT NULL)
  EXECUTE FUNCTION validate_template_assignment();
```

---

### BR-TWS-002: Task Completion Requirements

**Rule**: Tasks cannot be marked `completed` without required completion data.

**Required Data**:
- `completion_notes`: Text description of what was done
- `result_data`: Task-specific outputs (varies by task type)

**Enforcement**:
```sql
CREATE OR REPLACE FUNCTION validate_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If marking as completed, ensure completion_notes provided
  IF NEW.status = 'completed' AND (NEW.completion_notes IS NULL OR NEW.completion_notes = '') THEN
    RAISE EXCEPTION 'Completion notes required when marking task as completed';
  END IF;

  -- If marking as blocked, ensure blocker description provided
  IF NEW.status = 'blocked' AND (NEW.blocker_description IS NULL OR NEW.blocker_description = '') THEN
    RAISE EXCEPTION 'Blocker description required when marking task as blocked';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_completion_requirements
  BEFORE UPDATE OF status ON service_ticket_tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_completion();
```

---

### BR-TWS-003: Cannot Delete Active Template

**Rule**: Task templates that are currently in use by active tickets cannot be deleted.

**Enforcement**:
```sql
CREATE OR REPLACE FUNCTION prevent_active_template_deletion()
RETURNS TRIGGER AS $$
DECLARE
  active_ticket_count INT;
BEGIN
  -- Count tickets using this template
  SELECT COUNT(*)
  INTO active_ticket_count
  FROM service_tickets
  WHERE template_id = OLD.id
    AND status NOT IN ('completed', 'cancelled', 'closed');

  -- Prevent deletion if in use
  IF active_ticket_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete template: % active tickets are using it', active_ticket_count;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_active_templates
  BEFORE DELETE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION prevent_active_template_deletion();
```

---

### BR-TWS-004: Auto-Advance Ticket Status

**Rule**: When critical tasks are completed, ticket status should automatically advance.

**Trigger Tasks**:
- When "Await Customer Approval" task starts → ticket status = `awaiting_approval`
- When last required task completes → ticket status = `completed`
- When "Package for Delivery" completes → ticket status = `awaiting_customer_confirmation`

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION auto_advance_ticket_status()
RETURNS TRIGGER AS $$
DECLARE
  task_name VARCHAR(255);
  pending_required_tasks INT;
BEGIN
  -- Get task type name
  SELECT name INTO task_name
  FROM task_types
  WHERE id = NEW.task_type_id;

  -- Handle specific task completions
  IF NEW.status = 'completed' THEN

    -- Package for Delivery → awaiting_customer_confirmation
    IF task_name = 'Package for Delivery' THEN
      UPDATE service_tickets
      SET status = 'awaiting_customer_confirmation'
      WHERE id = NEW.ticket_id;
    END IF;

    -- Check if all required tasks completed
    SELECT COUNT(*)
    INTO pending_required_tasks
    FROM service_ticket_tasks stt
    JOIN task_templates_tasks ttt ON stt.task_type_id = ttt.task_type_id
    WHERE stt.ticket_id = NEW.ticket_id
      AND ttt.is_required = true
      AND stt.status NOT IN ('completed', 'cancelled');

    -- If no pending required tasks, mark ticket complete
    IF pending_required_tasks = 0 THEN
      UPDATE service_tickets
      SET status = 'completed', completed_at = now()
      WHERE id = NEW.ticket_id;
    END IF;

  END IF;

  -- Handle Await Customer Approval
  IF NEW.status = 'in_progress' AND task_name = 'Await Customer Approval' THEN
    UPDATE service_tickets
    SET status = 'awaiting_approval'
    WHERE id = NEW.ticket_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_status_auto_advance
  AFTER UPDATE OF status ON service_ticket_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_advance_ticket_status();
```

---

### BR-TWS-005: Task Assignment Role Validation

**Rule**: Users can only be assigned tasks compatible with their role.

**Role-Task Compatibility**:
- Admin: All tasks
- Manager: All tasks
- Technician: Technical tasks (diagnosis, repair, QA)
- Reception: Intake and closing tasks only

**Enforcement** (application-level in tRPC):
```typescript
async function assignTask(taskId: string, userId: string, currentUser: User) {
  // Get task details
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { taskType: true }
  });

  // Get user role
  const assignee = await db.profile.findUnique({
    where: { id: userId }
  });

  // Validate role compatibility
  const roleTaskMatrix = {
    reception: ['Initial Inspection', 'Package for Delivery', 'Update Inventory'],
    technician: ['Run Diagnostic Tests', 'Identify Root Cause', 'Replace Component', 'Software Restore', 'Quality Check', 'Final Testing'],
    manager: '*', // All tasks
    admin: '*'
  };

  const allowedTasks = roleTaskMatrix[assignee.role];

  if (allowedTasks !== '*' && !allowedTasks.includes(task.taskType.name)) {
    throw new Error(`${assignee.role} cannot be assigned task: ${task.taskType.name}`);
  }

  // Perform assignment
  await db.task.update({
    where: { id: taskId },
    data: { assigned_to: userId }
  });
}
```

---

### BR-TWS-006: Template Versioning on Edit

**Rule**: Editing an active template creates a new version, preserving old version for historical tickets.

**Behavior**:
- Editing active template creates new version (version + 1)
- Old version status → `inactive`
- New version status → `active`
- Existing tickets continue using old version
- New tickets use new version

**Implementation**:
```typescript
async function updateTemplate(templateId: string, updates: TemplateUpdate) {
  // Get current template
  const currentTemplate = await db.taskTemplate.findUnique({
    where: { id: templateId },
    include: { tasks: true }
  });

  // Mark current as inactive
  await db.taskTemplate.update({
    where: { id: templateId },
    data: { status: 'inactive' }
  });

  // Create new version
  const newTemplate = await db.taskTemplate.create({
    data: {
      ...currentTemplate,
      ...updates,
      id: undefined, // Generate new ID
      version: currentTemplate.version + 1,
      status: 'active',
      created_at: new Date()
    }
  });

  // Copy tasks to new version
  for (const task of currentTemplate.tasks) {
    await db.taskTemplateTask.create({
      data: {
        template_id: newTemplate.id,
        task_type_id: task.task_type_id,
        sequence_order: task.sequence_order,
        // ... other fields
      }
    });
  }

  return newTemplate;
}
```

---

## Workflows

### Workflow 1: Task Template Creation

```
┌─────────────────────────────────────────────────────────────┐
│                 TASK TEMPLATE CREATION FLOW                 │
└─────────────────────────────────────────────────────────────┘

ADMIN                          SYSTEM

1. Navigate to "Task Templates"
   └─> Click "+ New Template"

2. Enter template details ───────────> Validate inputs
   ├─> Name: "iPhone Warranty Service"
   ├─> Product Type: iPhone
   ├─> Service Type: Warranty
   └─> Strict Order: Yes

3. Add tasks from library ──────────> Display task types library
   │                                   (searchable, filterable)
   └─> Search "diagnostic"

4. Drag tasks to template ──────────> Update sequence order
   ├─> Initial Inspection (order: 1)
   ├─> Serial Verification (order: 2)
   ├─> Run Diagnostic Tests (order: 3)
   ├─> Identify Root Cause (order: 4)
   ├─> Prepare Cost Estimate (order: 5)
   ├─> Replace Component (order: 6)
   ├─> Quality Check (order: 7)
   └─> Package for Delivery (order: 8)

5. Configure each task:
   ├─> Set estimated duration
   ├─> Set default assignee role
   ├─> Mark as required/optional
   └─> Add task-specific notes

6. Preview template ────────────────> Show sample task list
   └─> Review workflow flow

7. Save template ───────────────────> Transaction BEGIN
                                       │
                                       ├─> Insert task_templates record
                                       │   status: 'active'
                                       │
                                       ├─> Insert task_templates_tasks
                                       │   for each task
                                       │
                                       └─> Transaction COMMIT

8. Confirmation ◄──────────────────── "Template created successfully"
   └─> Template now available
       for ticket creation
```

---

### Workflow 2: Ticket with Task Execution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SERVICE TICKET WITH TASKS FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

RECEPTION          SYSTEM                    TECHNICIAN              MANAGER

1. Create ticket
   └─> Product: iPhone 14
       Service: Warranty ─────> Find template
                                 (iPhone + Warranty)
                                  │
                                  ├─> Generate tasks:
                                  │   1. Initial Inspection
                                  │   2. Serial Verification
                                  │   3. Run Diagnostic Tests
                                  │   4. Identify Root Cause
                                  │   5. Prepare Cost Estimate
                                  │   6. Replace Component
                                  │   7. Quality Check
                                  │   8. Package for Delivery
                                  │
                                  └─> Auto-assign by role
                                      (Technician: tasks 3-7)

2. Ticket created ◄───────────── Ticket: SV-2025-001
   └─> 8 tasks pending            Status: pending

                                                      3. View "My Tasks" ◄── Filter:
                                                         dashboard             assigned_to = self

                                                      4. Start task #1 ──────> Update task:
                                                         "Initial Inspection"   status: in_progress
                                                                                started_at: now()

                                                      5. Inspect device
                                                         └─> Note damage

                                                      6. Complete task #1 ───> Require completion_notes
                                                         ├─> Notes: "Screen            │
                                                         │   cracked, no water"        │
                                                         └─> Click "Complete"          └─> Update:
                                                                                           status: completed
                                                                                           completed_at: now()

                                                      7. Auto-advance to ◄─── Next task auto-selected
                                                         task #2 (Serial Ver)  (sequence_order + 1)

                                                      8. Complete tasks 2-4
                                                         (same flow)

                                                      9. Task #5: Prepare ────> Task completion triggers:
                                                         Cost Estimate           ├─> Populate ticket fields:
                                                         ├─> Diagnosis fee: 100k │   diagnosis_fee,
                                                         ├─> Service fee: 500k   │   service_fee
                                                         └─> Parts: Battery 200k └─> Change ticket status:
                                                                                     awaiting_approval

                                                     10. Task #6 starts ◄────── Ticket status prevents
                                                         but blocked               (awaiting approval)
                                                                                    └─> Task status: blocked
                                                                                        blocker: "Awaiting
                                                                                        customer approval"

                                                                                          11. Customer approves ◄── (external)

                                                     12. Resume task #6 ◄────── Manager updates ticket:
                                                         └─> status: approved     └─> Unblocks task #6

                                                     13. Replace battery
                                                         └─> Complete task #6 ──> Add part usage:
                                                             ├─> Part: Battery     service_ticket_parts
                                                             └─> Qty: 1            (part_id, quantity)

                                                     14. Complete QA tasks
                                                         (tasks 7-8)

                                                     15. Task #8 complete ◄───── Auto-advance ticket:
                                                                                  └─> All required tasks done
                                                                                      status: awaiting_customer
                                                                                              _confirmation

16. Customer confirms ◄───────────────────────────────────────────────────────── Email sent
    delivery method                                                                (see REQ_SERVICE_REQUEST)

17. Mark as delivered ───────────────────────────────────────────────────────────> Final status:
                                                                                     completed
```

---

### Workflow 3: Template Switching During Service

```
┌─────────────────────────────────────────────────────────────┐
│              DYNAMIC TEMPLATE SWITCHING FLOW                │
└─────────────────────────────────────────────────────────────┘

TECHNICIAN                SYSTEM                    MANAGER

Initial State: Warranty Template
Tasks:
1. ✅ Initial Inspection
2. ✅ Serial Verification
3. ✅ Run Diagnostic Tests
4. ⏳ Identify Root Cause (in progress)
5. ⏸️ Prepare Cost Estimate
6. ⏸️ Replace Component (warranty)
7. ⏸️ Quality Check

1. Diagnose issue
   └─> Discover: Warranty void
       (water damage)

2. Report finding ─────────> Update ticket:
   └─> "Warranty void"        warranty_status: invalid

3. Manager reviews ◄──────── Notification:
                               "Warranty issue detected"

                                                   4. Decide to switch ────> Select new template:
                                                      to Paid Repair          "iPhone Paid Repair"

                                                   5. Confirm switch ──────> Show impact preview:
                                                      └─> Enter reason:       ├─> Keep: 4 tasks
                                                          "Water damage           (completed + in-progress)
                                                          voids warranty"       ├─> Add: 2 tasks
                                                                                  (Await Approval, Payment)
                                                                                └─> Remove: 0 tasks

                                                   6. Approve switch ──────> Execute switch:
                                                                              ├─> Preserve tasks 1-4
                                                                              ├─> Delete pending task 6-7
                                                                              ├─> Insert new tasks
                                                                              └─> Re-sequence all

New State: Paid Repair Template
Tasks:
1. ✅ Initial Inspection (preserved)
2. ✅ Serial Verification (preserved)
3. ✅ Run Diagnostic Tests (preserved)
4. ⏳ Identify Root Cause (preserved, in progress)
5. ⏸️ Prepare Cost Estimate (preserved)
6. ⏸️ Await Customer Approval (NEW)
7. ⏸️ Replace Component (paid)
8. ⏸️ Process Payment (NEW)
9. ⏸️ Quality Check (preserved)
10. ⏸️ Package for Delivery (preserved)

7. Resume work ◄──────────── Notification:
   └─> See updated task list   "Template switched to
                                Paid Repair"

8. Continue with task #4
   └─> Complete normally

9. Follow new workflow
   (includes approval + payment)
```

---

## UI/UX Requirements

### Task Template Editor (Admin)

```
┌───────────────────────────────────────────────────────────────────────┐
│  Task Template Editor                                        [Save]    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Template Details                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Name: ┌─────────────────────────────────────────────┐         │  │
│  │       │ iPhone Warranty Service                      │         │  │
│  │       └─────────────────────────────────────────────┘         │  │
│  │                                                                 │  │
│  │ Product Type: [iPhone 14 ▼]    Service Type: [Warranty ▼]    │  │
│  │                                                                 │  │
│  │ ☑ Enforce strict task order                                   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ───────────────────────────────────────────────────────────────────  │
│                                                                        │
│  Task Library                          Template Tasks (8)             │
│  ┌───────────────────────┐  ┌───────────────────────────────────┐   │
│  │ 🔍 Search tasks...    │  │ Drag to reorder:                   │   │
│  ├───────────────────────┤  │                                     │   │
│  │                        │  │ 1. ⋮ Initial Inspection      [⚙] │   │
│  │ 📋 Intake              │  │    Duration: 10 min               │   │
│  │  • Initial Inspection │  │    Assign to: Reception           │   │
│  │  • Serial Verification│  │                                     │   │
│  │                        │  │ 2. ⋮ Serial Verification     [⚙] │   │
│  │ 🔬 Diagnosis           │  │    Duration: 5 min                │   │
│  │  • Run Diagnostic     │  │    Assign to: Technician          │   │
│  │  • Identify Root      │  │                                     │   │
│  │  • Cost Estimate      │  │ 3. ⋮ Run Diagnostic Tests    [⚙] │   │
│  │                        │  │    Duration: 30 min               │   │
│  │ 🔧 Repair              │  │    Assign to: Technician          │   │
│  │  • Replace Component  │  │    ☑ Required                     │   │
│  │  • Software Restore   │  │                                     │   │
│  │                        │  │ 4. ⋮ Identify Root Cause     [⚙] │   │
│  │ ✓ Quality Assurance   │  │    Duration: 20 min               │   │
│  │  • Quality Check      │  │    Assign to: Technician          │   │
│  │  • Final Testing      │  │                                     │   │
│  │                        │  │ 5. ⋮ Prepare Cost Estimate  [⚙] │   │
│  │ 📦 Closing             │  │    Duration: 15 min               │   │
│  │  • Clean Device       │  │    Assign to: Technician          │   │
│  │  • Package Delivery   │  │                                     │   │
│  │  • Update Inventory   │  │ ... (3 more tasks)                 │   │
│  │                        │  │                                     │   │
│  │ [+ New Task Type]     │  │ [ + Add Task from Library ]        │   │
│  └───────────────────────┘  └───────────────────────────────────┘   │
│                                                                        │
│  [ Preview Template ]  [ Cancel ]                [ Save Template ]    │
└───────────────────────────────────────────────────────────────────────┘
```

---

### Technician Task Dashboard

```
┌───────────────────────────────────────────────────────────────────────┐
│  My Tasks                                                  🔄 Refresh  │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Filters: [In Progress] [Pending] [Blocked]    Sort: [Due Date ▼]   │
│                                                                        │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  🔴 IN PROGRESS (1)                                                   │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Task: Identify Root Cause                            ⏱ 15m ago │  │
│  │ Ticket: SV-2025-001 - iPhone 14 Pro (Nguyễn Văn A)            │  │
│  │ Step 4 of 8 tasks                                               │  │
│  │                                                                  │  │
│  │ Progress: ━━━━━●━━━━━━━━━━ 50%                                 │  │
│  │                                                                  │  │
│  │ [ Add Notes ]  [ Block Task ]             [ Mark Complete → ]  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ⏸️ PENDING (3)                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Task: Run Diagnostic Tests                          Est: 30min │  │
│  │ Ticket: SV-2025-002 - MacBook Pro (Trần Thị B)                │  │
│  │ Step 3 of 7 tasks                                               │  │
│  │                                                                  │  │
│  │ [ Start Task → ]                                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Task: Replace Component (Battery)                   Est: 45min │  │
│  │ Ticket: SV-2025-003 - iPad Air (Lê Văn C)                     │  │
│  │ Step 6 of 9 tasks                                               │  │
│  │                                                                  │  │
│  │ ⚠️ Blocked by: Waiting for parts delivery                      │  │
│  │                                                                  │  │
│  │ [ View Ticket ]                                                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Task: Quality Check                                  Est: 15min │  │
│  │ Ticket: SV-2025-004 - iPhone 12 (Phạm Thị D)                  │  │
│  │ Step 7 of 8 tasks                                               │  │
│  │                                                                  │  │
│  │ [ Start Task → ]                                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

---

### Task Completion Modal

```
┌─────────────────────────────────────────────────┐
│  Complete Task: Run Diagnostic Tests      [×]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Ticket: SV-2025-001                            │
│  Task: Run Diagnostic Tests (Step 3 of 8)      │
│  Started: 30 minutes ago                         │
│                                                  │
│  ───────────────────────────────────────────────│
│                                                  │
│  Completion Notes * (required)                   │
│  ┌─────────────────────────────────────────┐   │
│  │ Ran full diagnostic suite. Found:       │   │
│  │ - Battery health: 65% (degraded)        │   │
│  │ - Screen digitizer: Faulty (no touch)   │   │
│  │ - Logic board: No issues detected       │   │
│  │                                           │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Update Ticket Information                       │
│  ┌─────────────────────────────────────────┐   │
│  │ Diagnosis Notes:                         │   │
│  │ ┌───────────────────────────────────┐   │   │
│  │ │ Screen digitizer failure. Needs    │   │   │
│  │ │ replacement. Battery also degraded.│   │   │
│  │ └───────────────────────────────────┘   │   │
│  │                                           │   │
│  │ Diagnosis Fee: ┌─────────┐ VND          │   │
│  │                 │ 100000  │              │   │
│  │                 └─────────┘              │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Attach Files (optional)                         │
│  [ Choose Files ] diagnostic-report.pdf          │
│                                                  │
│  [ Cancel ]                    [ Complete Task ] │
└─────────────────────────────────────────────────┘
```

---

## Edge Cases & Error Handling

### EC-TWS-001: Template Not Found for Product

**Scenario**: Ticket created for product type with no active template.

**Behavior**:
- Ticket created without tasks (manual workflow)
- Warning displayed: "No template available for this product type"
- Staff can manually add tasks or request admin create template

---

### EC-TWS-002: Task Blocked for Extended Period

**Scenario**: Task marked as `blocked` for >3 days with no resolution.

**Behavior**:
- Daily notification to assigned technician and manager
- After 7 days, auto-escalation to admin
- Suggested actions: Reassign, cancel ticket, or resolve blocker

---

### EC-TWS-003: Technician Deletes Task by Accident

**Scenario**: User attempts to delete task (not allowed).

**Behavior**:
- Deletion not permitted (only cancel status)
- Alternative: Mark task as `cancelled` with reason
- Task remains in database (audit trail)

---

### EC-TWS-004: Multiple Templates Active for Same Product+Service

**Scenario**: Database constraint fails, two active templates exist.

**Behavior**:
- Unique constraint prevents this at DB level
- If occurs (bug), use most recently created template
- Alert admin to resolve conflict

---

### EC-TWS-005: Task Completion Triggers Fail

**Scenario**: Task completion should update ticket, but database error occurs.

**Behavior**:
- Transaction rollback (task remains in_progress)
- Error logged with details
- User sees error: "Unable to complete task. Please try again."
- Retry button available

---

### EC-TWS-006: Circular Task Dependencies (Future)

**Scenario**: If complex dependencies added, Task A depends on Task B which depends on Task A.

**Behavior**:
- Template validation detects circular dependency
- Prevent template save with error message
- Suggest dependency graph visualization

---

## Success Metrics

### Operational Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Template Usage Rate | >80% of tickets use templates | `COUNT(tickets with template_id) / COUNT(all tickets)` |
| Task Completion Rate | >95% of tasks completed (not cancelled) | `COUNT(status='completed') / COUNT(all tasks)` |
| Average Task Completion Time vs Estimate | Within 20% variance | `AVG(actual_duration / estimated_duration)` |
| Template Switch Frequency | <10% of tickets | `COUNT(template switches) / COUNT(tickets)` |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Task Skipped Rate | <5% | `COUNT(cancelled tasks) / COUNT(all tasks)` |
| Blocked Task Resolution Time | <2 days average | `AVG(unblocked_at - blocked_at)` |
| Tasks with Completion Notes | 100% | `COUNT(completed with notes) / COUNT(completed)` |

### Process Improvement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Template Accuracy (Est vs Actual) | Improve 10% per quarter | Track variance reduction over time |
| Bottleneck Identification | Identify top 3 slowest tasks | Rank tasks by avg actual duration |
| Technician Productivity | Track tasks per day | `COUNT(completed tasks) / technician / day` |

---

## Open Questions & Future Considerations

### Q1: Parallel Tasks Support?

**Question**: Allow tasks to be worked on in parallel (multiple tasks in_progress simultaneously)?

**Current**: Sequential workflow, one task at a time
**Future**: Tag tasks as "can run in parallel" for efficiency

---

### Q2: Task Dependencies Beyond Sequence?

**Question**: Support complex dependencies (Task C requires Task A AND Task B)?

**Current**: Simple sequence order (1, 2, 3, ...)
**Recommendation**: Start simple, add complexity if needed

---

### Q3: Task Templates for Recurring Maintenance?

**Question**: Extend task system to preventive maintenance (not just repairs)?

**Example**: "Quarterly device check-up" template
**Recommendation**: Phase 2 feature

---

### Q4: Customer Visibility of Task Progress?

**Question**: Show customers detailed task list or high-level progress only?

**Current**: High-level (Step X of Y) recommended
**Alternative**: Full task list with customer-friendly labels

---

### Q5: Task Time Estimation Improvement via ML?

**Question**: Use historical data to auto-improve task duration estimates?

**Recommendation**: Phase 2, after collecting 3-6 months of data

---

## Appendix: Default Task Types Seed Data

```sql
-- Initial task types to populate system
INSERT INTO task_types (name, description, category, default_duration_minutes, is_system_defined) VALUES
  -- Intake tasks
  ('Initial Inspection', 'Visual inspection and documentation of device condition', 'intake', 10, true),
  ('Serial Verification', 'Verify serial number matches system records', 'intake', 5, true),
  ('Functional Testing (Intake)', 'Basic functionality check upon receipt', 'intake', 15, true),

  -- Diagnosis tasks
  ('Run Diagnostic Tests', 'Execute standard diagnostic software suite', 'diagnosis', 30, true),
  ('Identify Root Cause', 'Determine underlying cause of reported issue', 'diagnosis', 20, true),
  ('Prepare Cost Estimate', 'Calculate repair costs and prepare customer quote', 'diagnosis', 15, true),
  ('Document Findings', 'Detailed documentation of diagnostic results', 'diagnosis', 10, true),

  -- Approval tasks
  ('Await Customer Approval', 'Waiting state for customer repair approval', 'approval', NULL, true),
  ('Internal Manager Approval', 'Requires manager sign-off before proceeding', 'approval', NULL, true),

  -- Repair tasks
  ('Replace Component', 'Physical component replacement (specify component)', 'repair', 45, true),
  ('Software Restore', 'Operating system reinstall and updates', 'repair', 60, true),
  ('Data Recovery', 'Attempt to recover customer data from device', 'repair', 120, true),
  ('Calibration & Testing', 'Post-repair calibration and testing', 'repair', 20, true),
  ('Clean Internal Components', 'Cleaning internal parts (dust, corrosion)', 'repair', 30, true),

  -- Quality Assurance tasks
  ('Quality Check', 'Verify repair meets quality standards', 'qa', 15, true),
  ('Final Testing', 'Comprehensive functionality test before return', 'qa', 30, true),
  ('Burn-In Test', 'Extended stress testing for reliability', 'qa', 240, true),

  -- Closing tasks
  ('Clean Device (External)', 'Physical cleaning of device exterior', 'closing', 10, true),
  ('Package for Delivery', 'Prepare device for customer pickup/delivery', 'closing', 5, true),
  ('Update Inventory', 'Record parts used and inventory changes', 'closing', 10, true),
  ('Process Payment', 'Collect payment from customer', 'closing', 10, true),
  ('Generate Service Report', 'Create detailed service report for customer', 'closing', 15, true);
```

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-22 | Mary (BA Agent) | Initial requirements document based on elicitation sessions Q20-Q25 |

---

**End of Document**
