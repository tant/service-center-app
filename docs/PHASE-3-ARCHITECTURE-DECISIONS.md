# Phase 3 Architecture Decisions Record (ADR)

**Date:** November 3, 2025
**Phase:** 3 - Service Ticket Workflow & System Enhancements
**Status:** 🏗️ **ARCHITECTURE DESIGN**
**Decision Period:** Week 9 (Nov 4-8, 2025)

---

## 📋 Document Purpose

This document records all architectural and technical decisions made for Phase 3 implementation. Each decision includes:
- **Context** - Why this decision was needed
- **Decision** - What we decided
- **Rationale** - Why we chose this approach
- **Consequences** - Trade-offs and implications
- **Alternatives** - Options we considered and rejected

This serves as:
1. Single source of truth for technical decisions
2. Reference for implementation (Weeks 10-11)
3. Justification for stakeholders
4. Learning resource for future phases

---

## 🎯 Decision Summary Table

| # | Decision | Status | Impact |
|---|----------|--------|--------|
| **ADR-001** | Service Ticket Entity Adapter Design | ✅ Approved | High |
| **ADR-002** | Task Dependency Implementation | ✅ Approved | High |
| **ADR-003** | Workflow Management Data Model | ✅ Approved | High |
| **ADR-004** | Unit Testing Strategy | ✅ Approved | Medium |
| **ADR-005** | Task Reassignment Implementation | ✅ Approved | Medium |
| **ADR-006** | Bulk Task Operations Design | ✅ Approved | Medium |
| **ADR-007** | Task Comments & Attachments | ✅ Approved | Low |
| **ADR-008** | Performance Optimization Strategy | ✅ Approved | Medium |
| **ADR-009** | Error Handling & Recovery | ✅ Approved | Medium |
| **ADR-010** | Mobile Responsiveness Approach | ✅ Approved | Low |

---

## ADR-001: Service Ticket Entity Adapter Design

### Context

Service tickets are more complex than stock receipts:
- **Lifecycle stages:** pending → in_progress → completed (vs simple approval flow)
- **Multiple task types:** Diagnosis, Repair, Testing (vs single serial entry task)
- **Sequential dependencies:** Repair blocked until Diagnosis complete
- **Role-based assignment:** Different roles handle different tasks
- **High volume:** 200+ tickets/month (4x stock receipts)

**Question:** How should the service-ticket-adapter.ts be designed to handle this complexity?

### Decision

**Design Pattern: Staged Workflow with State Machine**

```typescript
// File: src/server/services/entity-adapters/service-ticket-adapter.ts

export class ServiceTicketAdapter implements EntityAdapter {

  // Define ticket lifecycle stages
  private readonly LIFECYCLE_STAGES = {
    diagnosis: { order: 1, required: true, assignable_to: ['Technician'] },
    repair: { order: 2, required: true, assignable_to: ['Technician'], depends_on: 'diagnosis' },
    testing: { order: 3, required: true, assignable_to: ['Technician'], depends_on: 'repair' },
  }

  async canStartTask(ctx: TRPCContext, taskId: string): Promise<CanStartResult> {
    const task = await this.getTask(ctx, taskId)
    const ticket = await this.getTicket(ctx, task.entity_id)

    // Check 1: Ticket status must be 'in_progress'
    if (ticket.status !== 'in_progress') {
      return {
        canStart: false,
        reason: "Không thể bắt đầu task khi ticket chưa ở trạng thái 'Đang xử lý'"
      }
    }

    // Check 2: Dependency validation
    const taskType = task.metadata.task_type // 'diagnosis', 'repair', 'testing'
    const stage = this.LIFECYCLE_STAGES[taskType]

    if (stage.depends_on) {
      const dependencyTask = await this.findTaskByType(ctx, ticket.id, stage.depends_on)
      if (dependencyTask.status !== 'completed') {
        return {
          canStart: false,
          reason: `Phải hoàn thành task "${stage.depends_on}" trước`
        }
      }
    }

    // Check 3: Role-based validation
    const userRole = await this.getUserRole(ctx)
    if (!stage.assignable_to.includes(userRole)) {
      return {
        canStart: false,
        reason: `Chỉ ${stage.assignable_to.join(', ')} mới được thực hiện task này`
      }
    }

    return { canStart: true }
  }

  async onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId)
    const ticket = await this.getTicket(ctx, task.entity_id)

    // Auto-create next task in sequence
    const taskType = task.metadata.task_type
    const currentStage = this.LIFECYCLE_STAGES[taskType]
    const nextStage = this.findNextStage(currentStage.order)

    if (nextStage) {
      await this.createNextTask(ctx, ticket.id, nextStage)
    }

    // Check if all required tasks complete → auto-complete ticket
    const allTasksComplete = await this.checkAllTasksComplete(ctx, ticket.id)
    if (allTasksComplete) {
      await this.completeTicket(ctx, ticket.id)
    }
  }

  async getEntityContext(ctx: TRPCContext, entityId: string): Promise<TaskContext> {
    const ticket = await this.getTicket(ctx, entityId)
    const tasks = await this.getTasksForTicket(ctx, entityId)

    // Calculate progress: completed tasks / total required tasks
    const completedCount = tasks.filter(t => t.status === 'completed').length
    const totalRequired = tasks.filter(t => t.is_required).length
    const progressPercentage = Math.round((completedCount / totalRequired) * 100)

    // Determine current stage
    const currentStage = this.determineCurrentStage(tasks)

    // Priority based on progress + overdue
    let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
    if (progressPercentage === 100) {
      priority = 'low' // Complete
    } else if (this.hasOverdueTasks(tasks)) {
      priority = 'urgent' // Overdue
    } else if (progressPercentage < 50) {
      priority = 'high' // Early stages
    }

    return {
      entityId: ticket.id,
      entityType: 'service_ticket',
      title: `Service Ticket ${ticket.ticket_number}`,
      subtitle: `${currentStage} - ${progressPercentage}% complete`,
      status: ticket.status,
      priority: priority,
      url: `/tickets/${ticket.id}`,
      metadata: {
        ticketNumber: ticket.ticket_number,
        customerName: ticket.customer?.name,
        currentStage: currentStage,
        progressPercentage: progressPercentage,
        completedTasks: completedCount,
        totalTasks: totalRequired,
      }
    }
  }
}
```

### Rationale

**1. Staged Workflow Design**
- **Pro:** Clear separation of Diagnosis → Repair → Testing
- **Pro:** Easy to add new stages later (e.g., Quality Assurance)
- **Pro:** Self-documenting code (LIFECYCLE_STAGES constant)

**2. Dependency Check in canStartTask()**
- **Pro:** Enforces sequential workflow at adapter level
- **Pro:** User gets clear error message why task blocked
- **Con:** Requires querying other tasks (minor performance cost)

**3. Auto-Create Next Task in onTaskComplete()**
- **Pro:** Seamless workflow progression
- **Pro:** No manual task creation by managers
- **Con:** Relies on trigger functions (database dependency)

**4. Progress Calculation in getEntityContext()**
- **Pro:** Real-time progress tracking
- **Pro:** Priority color-coding (red/yellow/green)
- **Con:** Requires aggregating tasks (cached in practice)

### Consequences

**Positive:**
- ✅ Enforces business rules (sequential workflow)
- ✅ Self-documenting (LIFECYCLE_STAGES constant)
- ✅ Extensible (add new stages easily)
- ✅ Consistent with inventory-receipt-adapter pattern

**Negative:**
- ⚠️ Performance: canStartTask() requires 2-3 queries (acceptable <100ms)
- ⚠️ Complexity: More logic than receipt adapter (justified by domain complexity)

**Mitigations:**
- Cache task lists in entity context (reduce queries)
- Add database indexes on entity_tasks(entity_id, status)
- Monitor query performance in Week 10 performance testing

### Alternatives Considered

**Alternative 1: Store Dependencies in Database**
- **Rejected:** Over-engineering for 3 stages
- **Why:** LIFECYCLE_STAGES constant simpler, easier to change

**Alternative 2: No Auto-Create Next Task**
- **Rejected:** Defeats purpose of automation
- **Why:** Manual task creation = overhead we're eliminating

**Alternative 3: Allow Parallel Tasks (No Dependencies)**
- **Rejected:** Violates business rules
- **Why:** Can't repair before diagnosis, can't test before repair

### Implementation Checklist

- [ ] Create `src/server/services/entity-adapters/service-ticket-adapter.ts`
- [ ] Define LIFECYCLE_STAGES constant
- [ ] Implement canStartTask() with dependency checks
- [ ] Implement onTaskComplete() with auto-progression
- [ ] Implement getEntityContext() with progress calculation
- [ ] Write unit tests (8h from 24h budget)
- [ ] Performance test with 100+ tickets

---

## ADR-002: Task Dependency Implementation

### Context

Tasks can depend on other tasks:
- **Example:** Repair task blocked until Diagnosis task complete
- **Requirement:** System must enforce dependencies automatically
- **Question:** Where should dependency logic live?

**Options:**
1. Database constraints (foreign key relationships)
2. Database triggers (check dependencies on task update)
3. Application layer (entity adapter checks)
4. UI layer (disable buttons)

### Decision

**Hybrid Approach: Application + UI**

**1. Application Layer (Entity Adapter) - Primary Enforcement**
```typescript
// In service-ticket-adapter.ts

async canStartTask(ctx: TRPCContext, taskId: string): Promise<CanStartResult> {
  // Check dependencies
  const task = await this.getTask(ctx, taskId)
  const dependsOnTaskType = task.metadata.depends_on // e.g., 'diagnosis'

  if (dependsOnTaskType) {
    const dependencyTask = await this.findTaskByType(ctx, ticket.id, dependsOnTaskType)
    if (dependencyTask.status !== 'completed') {
      return {
        canStart: false,
        reason: `Phải hoàn thành task "${dependsOnTaskType}" trước`,
        dependsOn: {
          taskId: dependencyTask.id,
          taskName: dependencyTask.name,
          status: dependencyTask.status
        }
      }
    }
  }

  return { canStart: true }
}
```

**2. UI Layer (Task Card Component) - Visual Feedback**
```typescript
// In service-ticket-task-card.tsx

function ServiceTicketTaskCard({ task, onStart }) {
  const { data: canStartResult } = trpc.tasks.canStart.useQuery({ taskId: task.id })

  return (
    <Card>
      {canStartResult?.dependsOn && (
        <Alert variant="warning">
          <Lock className="h-4 w-4" />
          <AlertTitle>Task bị chặn</AlertTitle>
          <AlertDescription>
            Phải hoàn thành "{canStartResult.dependsOn.taskName}" trước.
            <Link href={`/tasks/${canStartResult.dependsOn.taskId}`}>
              Xem task →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Button
        disabled={!canStartResult?.canStart}
        onClick={onStart}
      >
        {canStartResult?.canStart ? 'Bắt đầu' : 'Chờ task trước'}
      </Button>
    </Card>
  )
}
```

**3. Database (Metadata) - Dependency Declaration**
```sql
-- In auto_create_service_ticket_tasks trigger

INSERT INTO entity_tasks (
  name, metadata, ...
) VALUES (
  'Repair',
  jsonb_build_object(
    'task_type', 'repair',
    'depends_on', 'diagnosis' -- ← Dependency stored here
  ),
  ...
);
```

### Rationale

**Why Application Layer?**
- ✅ Flexible: Easy to change dependency logic
- ✅ Clear error messages: Return reason to UI
- ✅ Testable: Unit test dependency checks
- ✅ Consistent: All business logic in entity adapters

**Why Not Database Layer?**
- ❌ Complex: Would need triggers on task status updates
- ❌ Hard to test: Database tests slower than unit tests
- ❌ Less flexible: Changing dependencies requires migrations

**Why UI Layer Too?**
- ✅ Better UX: Disable buttons, show clear warnings
- ✅ Proactive: User sees block before clicking
- ✅ Helpful: Link to dependency task (1-click navigation)

### Consequences

**Positive:**
- ✅ Clear separation of concerns (backend enforces, frontend shows)
- ✅ Easy to add new dependency types (just change metadata)
- ✅ Good UX (user knows why task blocked)

**Negative:**
- ⚠️ Query overhead: canStartTask() called frequently
- ⚠️ Duplication: Logic in both backend and frontend

**Mitigations:**
- Cache canStartTask() results (5-minute TTL)
- Use tRPC query invalidation on task status changes
- Monitor query performance (target <50ms per check)

### Alternatives Considered

**Alternative 1: Database-Only (Triggers)**
- **Rejected:** Too rigid, hard to change
- **Example:** Adding new dependency types requires migration

**Alternative 2: UI-Only (Client-Side Check)**
- **Rejected:** Not secure, can be bypassed
- **Example:** User could call API directly

**Alternative 3: No Dependencies (Manual Workflow)**
- **Rejected:** Defeats automation purpose
- **Example:** Manager manually tells technician "Do diagnosis first"

### Implementation Checklist

- [ ] Add `depends_on` field to task metadata in trigger
- [ ] Implement canStartTask() dependency checks in adapter
- [ ] Create tRPC endpoint: tasks.canStart({ taskId })
- [ ] Update task card UI with dependency alerts
- [ ] Write unit tests for dependency logic
- [ ] Test edge cases (circular dependencies, missing tasks)

---

## ADR-003: Workflow Management Data Model

### Context

**Current State (Phase 2):**
- Workflows created via SQL migrations (admin only)
- No UI to create/edit workflows
- Hard-coded in database

**Phase 3 Requirement:**
- Managers need to create workflows via UI
- Create custom workflows for different ticket types
- Clone and modify existing workflows

**Question:** What data model should support the workflow management UI?

### Decision

**Use Existing Tables + UI Layer (No New Tables)**

**Rationale:** Phase 1 already has `workflows` and `workflow_tasks` tables. We DON'T need new tables, just add UI to populate existing ones.

**Existing Schema (Already Implemented):**
```sql
-- Table: workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL, -- 'inventory_receipt', 'service_ticket', etc.
  strict_sequence BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: workflow_tasks
CREATE TABLE workflow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  sequence_order INT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_id, task_id)
);

-- Table: tasks (task library)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  estimated_duration_minutes INT,
  required_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI Workflow:**
```
1. Manager goes to /admin/workflows
2. Clicks "Create Workflow"
3. Fills form:
   - Name: "Standard Service Ticket Workflow"
   - Description: "Diagnosis → Repair → Testing"
   - Entity Type: service_ticket
   - Strict Sequence: ✅ Yes
4. Adds tasks from library:
   - Drag "Diagnosis" task → Sequence 1
   - Drag "Repair" task → Sequence 2
   - Drag "Testing" task → Sequence 3
5. Saves workflow
6. Backend creates:
   - 1 row in `workflows` table
   - 3 rows in `workflow_tasks` table
```

### Rationale

**Why Reuse Existing Tables?**
- ✅ No migration needed (tables already exist)
- ✅ Consistent with Phase 1 design
- ✅ Avoids data duplication
- ✅ Faster implementation (no schema changes)

**Why Separate `tasks` Table (Library)?**
- ✅ Reusable tasks across workflows
- ✅ DRY principle (one "Diagnosis" task, many workflows)
- ✅ Easy to update task descriptions globally

**Why `workflow_tasks` Join Table?**
- ✅ Many-to-many relationship (workflows ↔ tasks)
- ✅ Sequence order per workflow
- ✅ Required/optional flag per workflow

### Consequences

**Positive:**
- ✅ No new tables needed (faster implementation)
- ✅ Clean data model (normalized)
- ✅ Easy to query ("show me all workflows for service tickets")

**Negative:**
- ⚠️ Requires task library to be populated first
- ⚠️ More complex UI (select tasks from library, not free text)

**Mitigations:**
- Seed database with common tasks (Diagnosis, Repair, Testing)
- Add "Create New Task" button in workflow builder
- Provide task templates for common workflows

### Alternatives Considered

**Alternative 1: Embedded Tasks (JSON in workflows table)**
```sql
CREATE TABLE workflows (
  id UUID,
  name TEXT,
  tasks JSONB -- [{ name: "Diagnosis", order: 1 }, ...]
);
```
- **Rejected:** Hard to query, no reusability, violates normalization

**Alternative 2: New workflow_templates table**
- **Rejected:** Duplicate of existing `workflows` table
- **Why:** Adds complexity without benefit

### Implementation Checklist

- [ ] Seed `tasks` table with common tasks
- [ ] Create tRPC endpoint: workflows.create()
- [ ] Create tRPC endpoint: workflows.update()
- [ ] Create tRPC endpoint: workflows.list()
- [ ] Create tRPC endpoint: workflows.clone()
- [ ] Create UI: Workflow list page
- [ ] Create UI: Workflow builder (drag-drop tasks)
- [ ] Write unit tests for workflow CRUD
- [ ] Document workflow data model in user guide

---

## ADR-004: Unit Testing Strategy

### Context

**Phase 2 Gap:** No unit tests, only E2E tests planned
- **Problem:** Harder to debug, can't test edge cases
- **Retro Action:** Add 24h unit test budget in Phase 3

**Question:** What should we test? Which framework? What coverage target?

### Decision

**Framework: Jest for Backend, Vitest for Frontend**

**Coverage Target: 80% for New Code (Phase 3 Only)**

**Test Breakdown (24h Budget):**

**1. Database Triggers (8h) - Developer 1**
```typescript
// tests/database/triggers/service-ticket-tasks.test.ts

describe('auto_create_service_ticket_tasks trigger', () => {
  it('should create tasks when ticket status changes to in_progress', async () => {
    // Arrange
    const ticket = await createTestTicket({ status: 'pending', workflow_id: testWorkflowId })

    // Act
    await updateTicketStatus(ticket.id, 'in_progress')

    // Assert
    const tasks = await getTasksForTicket(ticket.id)
    expect(tasks).toHaveLength(3)
    expect(tasks[0].name).toContain('Diagnosis')
    expect(tasks[1].name).toContain('Repair')
    expect(tasks[2].name).toContain('Testing')
  })

  it('should be idempotent (no duplicate tasks on re-trigger)', async () => {
    const ticket = await createTestTicket({ status: 'pending', workflow_id: testWorkflowId })
    await updateTicketStatus(ticket.id, 'in_progress')
    await updateTicketStatus(ticket.id, 'pending')
    await updateTicketStatus(ticket.id, 'in_progress') // Re-trigger

    const tasks = await getTasksForTicket(ticket.id)
    expect(tasks).toHaveLength(3) // Not 6!
  })

  it('should skip task creation if no workflow assigned', async () => {
    const ticket = await createTestTicket({ status: 'pending', workflow_id: null })
    await updateTicketStatus(ticket.id, 'in_progress')

    const tasks = await getTasksForTicket(ticket.id)
    expect(tasks).toHaveLength(0)
  })

  // ... 10 more test cases for edge cases
})
```

**2. Entity Adapters (8h) - Developer 2**
```typescript
// tests/server/entity-adapters/service-ticket-adapter.test.ts

describe('ServiceTicketAdapter', () => {
  describe('canStartTask', () => {
    it('should allow starting diagnosis task when ticket in_progress', async () => {
      const adapter = new ServiceTicketAdapter()
      const ticket = await createTestTicket({ status: 'in_progress' })
      const task = await createTestTask({ entity_id: ticket.id, metadata: { task_type: 'diagnosis' } })

      const result = await adapter.canStartTask(mockCtx, task.id)

      expect(result.canStart).toBe(true)
    })

    it('should block repair task if diagnosis not complete', async () => {
      const adapter = new ServiceTicketAdapter()
      const ticket = await createTestTicket({ status: 'in_progress' })
      const diagnosisTask = await createTestTask({ entity_id: ticket.id, metadata: { task_type: 'diagnosis' }, status: 'in_progress' })
      const repairTask = await createTestTask({ entity_id: ticket.id, metadata: { task_type: 'repair', depends_on: 'diagnosis' } })

      const result = await adapter.canStartTask(mockCtx, repairTask.id)

      expect(result.canStart).toBe(false)
      expect(result.reason).toContain('Phải hoàn thành task "diagnosis" trước')
    })

    // ... 8 more test cases
  })

  describe('getEntityContext', () => {
    it('should calculate progress percentage correctly', async () => {
      const adapter = new ServiceTicketAdapter()
      const ticket = await createTestTicket({ status: 'in_progress' })
      await createTestTask({ entity_id: ticket.id, status: 'completed' }) // 1/3 complete
      await createTestTask({ entity_id: ticket.id, status: 'in_progress' })
      await createTestTask({ entity_id: ticket.id, status: 'pending' })

      const context = await adapter.getEntityContext(mockCtx, ticket.id)

      expect(context.metadata.progressPercentage).toBe(33)
      expect(context.priority).toBe('high') // <50% = high priority
    })

    // ... 6 more test cases
  })
})
```

**3. tRPC Endpoints (8h) - Developer 3**
```typescript
// tests/server/routers/workflows.test.ts

describe('workflows router', () => {
  describe('create', () => {
    it('should create workflow with valid input', async () => {
      const caller = createCaller({ user: adminUser })

      const result = await caller.workflows.create({
        name: 'Test Workflow',
        description: 'Test',
        entity_type: 'service_ticket',
        strict_sequence: true,
        task_ids: [task1.id, task2.id]
      })

      expect(result.id).toBeDefined()
      expect(result.name).toBe('Test Workflow')

      const workflowTasks = await getWorkflowTasks(result.id)
      expect(workflowTasks).toHaveLength(2)
    })

    it('should reject workflow creation if not admin', async () => {
      const caller = createCaller({ user: technicianUser })

      await expect(
        caller.workflows.create({ name: 'Test', entity_type: 'service_ticket', task_ids: [] })
      ).rejects.toThrow('Chỉ Admin mới được tạo workflow')
    })

    // ... 10 more test cases
  })
})
```

### Rationale

**Why Jest for Backend?**
- ✅ Industry standard for Node.js
- ✅ Great TypeScript support
- ✅ Easy mocking (database, Supabase client)
- ✅ Built-in coverage reporting

**Why Vitest for Frontend?**
- ✅ Faster than Jest (uses Vite)
- ✅ Compatible with Vite build (our Next.js uses Turbopack)
- ✅ Better ESM support
- ✅ Same API as Jest (easy migration)

**Why 80% Coverage Target?**
- ✅ Achievable in 24h (Phase 2 retro budget)
- ✅ Covers critical paths (happy path + error cases)
- ✅ Not 100% (diminishing returns >80%)

**Why Focus on New Code Only?**
- ✅ Pragmatic: Don't test Phase 1/2 code retroactively
- ✅ Sustainable: Future phases follow same standard
- ✅ Avoids scope creep (24h budget constraint)

### Consequences

**Positive:**
- ✅ Faster debugging (run specific test, not full E2E)
- ✅ Confidence in refactoring (tests catch regressions)
- ✅ Living documentation (tests show how code works)
- ✅ Quality gate (CI/CD can block merges if tests fail)

**Negative:**
- ⚠️ Time investment (24h = 1 developer-week)
- ⚠️ Maintenance burden (tests need updates when code changes)
- ⚠️ False confidence (unit tests don't catch integration issues)

**Mitigations:**
- Balance unit + E2E tests (unit for logic, E2E for integration)
- Write maintainable tests (avoid brittle selectors)
- Run tests in CI/CD (GitHub Actions)
- Add code coverage badge to README (transparency)

### Alternatives Considered

**Alternative 1: 100% Coverage Target**
- **Rejected:** Diminishing returns, not achievable in 24h
- **Example:** Testing getters/setters, trivial code

**Alternative 2: E2E Tests Only (No Unit Tests)**
- **Rejected:** Phase 2 retro identified this as gap
- **Example:** E2E tests slow (30s), unit tests fast (0.5s)

**Alternative 3: Mocha/Chai (Alternative Frameworks)**
- **Rejected:** Jest/Vitest more popular, better ecosystem
- **Example:** Jest has built-in mocking, Mocha needs sinon

### Implementation Checklist

- [ ] Set up Jest for backend (jest.config.js)
- [ ] Set up Vitest for frontend (vitest.config.ts)
- [ ] Write trigger tests (8h, Developer 1)
- [ ] Write adapter tests (8h, Developer 2)
- [ ] Write tRPC tests (8h, Developer 3)
- [ ] Configure code coverage reporting (nyc, c8)
- [ ] Add npm scripts: `npm run test:unit`, `npm run test:coverage`
- [ ] Integrate with CI/CD (GitHub Actions)
- [ ] Document testing standards in CONTRIBUTING.md

---

## ADR-005: Task Reassignment Implementation

### Context

**Business Need:** If technician is sick, manager needs to reassign their tasks to another technician.

**Requirements:**
- Manager can reassign any task
- Technician cannot reassign their own tasks (privilege control)
- Audit log: Who reassigned, when, why
- Notify old and new assignee (future: notification system)

**Question:** How should reassignment be implemented?

### Decision

**Design: tRPC Endpoint + Audit Log**

```typescript
// File: src/server/routers/tasks.ts

const reassignTaskSchema = z.object({
  taskId: z.string().uuid(),
  newAssigneeId: z.string().uuid(),
  reason: z.string().min(10, 'Lý do phải ít nhất 10 ký tự')
})

// In tasks router
reassign: publicProcedure
  .use(requireRole(['Admin', 'Manager']))
  .input(reassignTaskSchema)
  .mutation(async ({ input, ctx }) => {
    const { taskId, newAssigneeId, reason } = input

    // Validation 1: Task exists
    const { data: task } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .select('*, assigned_to_id')
      .eq('id', taskId)
      .single()

    if (!task) throw new Error('Task không tồn tại')

    // Validation 2: New assignee exists and is technician
    const { data: newAssignee } = await ctx.supabaseAdmin
      .from('profiles')
      .select('id, role, name')
      .eq('id', newAssigneeId)
      .single()

    if (!newAssignee) throw new Error('Người nhận task không tồn tại')
    if (!['Technician', 'Manager', 'Admin'].includes(newAssignee.role)) {
      throw new Error('Chỉ có thể assign task cho Technician, Manager, hoặc Admin')
    }

    // Update task assignment
    const { error: updateError } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .update({
        assigned_to_id: newAssigneeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (updateError) throw new Error(`Lỗi update task: ${updateError.message}`)

    // Create audit log
    await ctx.supabaseAdmin.from('audit_logs').insert({
      user_id: ctx.userId,
      action: 'task_reassignment',
      table_name: 'entity_tasks',
      record_id: taskId,
      changes: {
        old_assignee_id: task.assigned_to_id,
        new_assignee_id: newAssigneeId,
        reason: reason
      },
      reason: reason
    })

    // TODO Phase 4: Send notifications to old + new assignee

    return { success: true }
  })
```

**UI Component: Task Reassignment Modal**

```typescript
// File: src/components/tasks/task-reassignment-modal.tsx

export function TaskReassignmentModal({ taskId, currentAssignee, onClose }: Props) {
  const [newAssigneeId, setNewAssigneeId] = useState('')
  const [reason, setReason] = useState('')

  const { data: technicians } = trpc.team.listTechnicians.useQuery()
  const reassignMutation = trpc.tasks.reassign.useMutation({
    onSuccess: () => {
      toast.success('Đã reassign task thành công')
      onClose()
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`)
    }
  })

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Reassign Task</DialogTitle>
      <DialogContent>
        <p>Hiện tại: {currentAssignee.name}</p>

        <Select
          label="Người nhận mới"
          value={newAssigneeId}
          onChange={setNewAssigneeId}
        >
          {technicians?.map(tech => (
            <option key={tech.id} value={tech.id}>
              {tech.name} ({tech.role})
            </option>
          ))}
        </Select>

        <Textarea
          label="Lý do reassign *"
          placeholder="Vd: Technician đang nghỉ ốm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={10}
        />

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button
            onClick={() => reassignMutation.mutate({ taskId, newAssigneeId, reason })}
            disabled={!newAssigneeId || reason.length < 10}
          >
            Reassign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Rationale

**Why Require Reason?**
- ✅ Audit trail: Understand why reassignment happened
- ✅ Prevents abuse: Manager can't reassign without justification
- ✅ Future reference: If patterns emerge (e.g., same tech always sick), investigate

**Why Manager-Only Permission?**
- ✅ Privilege control: Technicians can't reassign their own work (avoid gaming)
- ✅ Oversight: Manager decides workload distribution
- ✅ Business rule: Matches real-world process

**Why Audit Log?**
- ✅ Compliance: Track all permission-sensitive operations
- ✅ Debugging: If task stuck, check reassignment history
- ✅ Analytics: Measure reassignment frequency (process improvement metric)

### Consequences

**Positive:**
- ✅ Flexibility: Handle sick days, vacations, workload imbalance
- ✅ Accountability: Audit log prevents abuse
- ✅ Clear UX: Modal with dropdown + reason field

**Negative:**
- ⚠️ No notification: Old/new assignee not notified (Phase 4 feature)
- ⚠️ Reason required: Adds friction (could skip for urgent cases)

**Mitigations:**
- Add notification system in Phase 4 (email, in-app)
- Allow "Urgent" reason preset (1-click, auto-populates reason)
- Show reassignment history in task detail page

### Alternatives Considered

**Alternative 1: Allow Technicians to Self-Reassign**
- **Rejected:** Gaming risk (cherry-pick easy tasks)
- **Example:** Technician reassigns hard tasks to others

**Alternative 2: No Reason Required**
- **Rejected:** Audit trail incomplete
- **Example:** Can't understand why reassignment happened

**Alternative 3: Automatic Reassignment (ML-based)**
- **Rejected:** Over-engineering for Phase 3
- **Future:** Consider for Phase 5 (AI workload balancing)

### Implementation Checklist

- [ ] Create tRPC endpoint: tasks.reassign()
- [ ] Add requireRole(['Admin', 'Manager']) middleware
- [ ] Create audit_logs entry on reassignment
- [ ] Create TaskReassignmentModal component
- [ ] Add "Reassign" button to task cards (manager view only)
- [ ] Write unit tests for reassignment logic
- [ ] Document reassignment in user guide

---

## ADR-006: Bulk Task Operations Design

### Context

**Business Need:** Manager wants to complete 10 overdue tasks at once (e.g., end of sprint cleanup).

**Requirements:**
- Select multiple tasks (checkbox)
- Bulk actions: Complete, Reassign, Skip
- Confirmation modal (prevent accidents)
- Partial success handling (some tasks fail, some succeed)

**Question:** How should bulk operations UI/API be designed?

### Decision

**Design: Checkbox Selection + Bulk Action Dropdown**

**Frontend:**
```typescript
// File: src/components/tasks/task-bulk-actions.tsx

export function TaskBulkActions({ tasks }: { tasks: Task[] }) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'complete' | 'reassign' | 'skip' | null>(null)

  const bulkCompleteMutation = trpc.tasks.bulkComplete.useMutation({
    onSuccess: (result) => {
      toast.success(`Đã hoàn thành ${result.succeeded} / ${result.total} tasks`)
      if (result.failed > 0) {
        toast.warning(`${result.failed} tasks thất bại. Xem chi tiết.`)
      }
      setSelectedTaskIds([])
    }
  })

  return (
    <div>
      {/* Checkbox select all */}
      <Checkbox
        checked={selectedTaskIds.length === tasks.length}
        onChange={(checked) => {
          setSelectedTaskIds(checked ? tasks.map(t => t.id) : [])
        }}
        label="Chọn tất cả"
      />

      {/* Task list with checkboxes */}
      {tasks.map(task => (
        <div key={task.id}>
          <Checkbox
            checked={selectedTaskIds.includes(task.id)}
            onChange={(checked) => {
              setSelectedTaskIds(
                checked
                  ? [...selectedTaskIds, task.id]
                  : selectedTaskIds.filter(id => id !== task.id)
              )
            }}
          />
          <TaskCard task={task} />
        </div>
      ))}

      {/* Bulk action buttons */}
      {selectedTaskIds.length > 0 && (
        <div className="sticky bottom-4 bg-white p-4 shadow-lg">
          <p>{selectedTaskIds.length} tasks đã chọn</p>
          <DropdownMenu>
            <DropdownMenuTrigger>Hành động hàng loạt</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setBulkAction('complete')}>
                ✅ Hoàn thành tất cả
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkAction('reassign')}>
                👤 Reassign tất cả
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkAction('skip')}>
                ⏭️ Skip tất cả
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Confirmation modal */}
      {bulkAction && (
        <ConfirmationModal
          title={`Xác nhận ${bulkAction} ${selectedTaskIds.length} tasks`}
          onConfirm={() => {
            if (bulkAction === 'complete') {
              bulkCompleteMutation.mutate({ taskIds: selectedTaskIds })
            }
            // ... handle other actions
          }}
          onCancel={() => setBulkAction(null)}
        />
      )}
    </div>
  )
}
```

**Backend:**
```typescript
// File: src/server/routers/tasks.ts

const bulkCompleteSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1).max(100) // Max 100 tasks at once
})

bulkComplete: publicProcedure
  .use(requireRole(['Admin', 'Manager']))
  .input(bulkCompleteSchema)
  .mutation(async ({ input, ctx }) => {
    const { taskIds } = input
    const results = { succeeded: 0, failed: 0, errors: [] as string[] }

    for (const taskId of taskIds) {
      try {
        // Validate task can be completed
        const canComplete = await checkCanComplete(ctx, taskId)
        if (!canComplete.allowed) {
          results.failed++
          results.errors.push(`Task ${taskId}: ${canComplete.reason}`)
          continue
        }

        // Complete task
        await completeTask(ctx, taskId)
        results.succeeded++

        // Audit log
        await ctx.supabaseAdmin.from('audit_logs').insert({
          user_id: ctx.userId,
          action: 'task_bulk_complete',
          table_name: 'entity_tasks',
          record_id: taskId
        })

      } catch (error) {
        results.failed++
        results.errors.push(`Task ${taskId}: ${error.message}`)
      }
    }

    return {
      total: taskIds.length,
      succeeded: results.succeeded,
      failed: results.failed,
      errors: results.errors
    }
  })
```

### Rationale

**Why Checkbox Selection?**
- ✅ Familiar pattern (users expect checkboxes for bulk select)
- ✅ Granular control (select specific tasks, not all)
- ✅ Visual feedback (clear which tasks selected)

**Why Dropdown for Actions?**
- ✅ Scalable (easy to add new actions later)
- ✅ Space-efficient (3 actions in 1 button)
- ✅ Clear labels (icons + text)

**Why Confirmation Modal?**
- ✅ Prevent accidents (bulk operations destructive)
- ✅ Review selection (show count, task names)
- ✅ Cancel option (escape hatch)

**Why Partial Success Handling?**
- ✅ Realistic (some tasks may fail validation)
- ✅ Transparent (show succeeded/failed counts)
- ✅ Actionable (error messages help fix issues)

### Consequences

**Positive:**
- ✅ Massive time savings (10 tasks in 1 click vs 10 clicks)
- ✅ Flexibility (select any subset of tasks)
- ✅ Safety (confirmation + error handling)

**Negative:**
- ⚠️ Complexity: Frontend state management (selected IDs array)
- ⚠️ Performance: 100 tasks = 100 API calls (sequential)
- ⚠️ UX: Partial failures confusing ("48/50 succeeded, what about other 2?")

**Mitigations:**
- Limit bulk operations to 100 tasks (prevent abuse)
- Show progress indicator (X / Y tasks processed)
- Detailed error list (expandable section)
- Optimize: Batch database updates (single transaction if possible)

### Alternatives Considered

**Alternative 1: Select All Only (No Checkboxes)**
- **Rejected:** Not flexible (what if user wants 5 out of 10?)
- **Example:** GitHub Actions doesn't allow this, frustrating

**Alternative 2: No Confirmation Modal**
- **Rejected:** Too dangerous (accidental bulk complete)
- **Example:** User clicks "Complete all" by mistake

**Alternative 3: Stop on First Failure**
- **Rejected:** Wastes time (if task 2 fails, tasks 3-100 not processed)
- **Better:** Continue processing, show all failures at end

### Implementation Checklist

- [ ] Create TaskBulkActions component
- [ ] Add checkbox selection state management
- [ ] Create bulk action dropdown
- [ ] Create confirmation modal
- [ ] Implement tRPC endpoints: bulkComplete, bulkReassign, bulkSkip
- [ ] Add progress indicator (X / Y tasks processed)
- [ ] Write unit tests for partial success handling
- [ ] Document bulk operations in user guide

---

## ADR-007: Task Comments & Attachments

### Context

**Business Need:** Technician encounters issue during task, needs to document it.

**Examples:**
- "Customer didn't provide power adapter, waiting for delivery"
- "Diagnosis found 3 faulty components, see attached photo"

**Requirements:**
- Comment thread per task (like GitHub issues)
- File attachments (images, PDFs, up to 5MB)
- Real-time updates (see colleague's comments)

**Question:** How should comments + attachments be implemented?

### Decision

**Data Model: task_comments + task_attachments tables**

```sql
-- Table: task_comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES entity_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);

-- Table: task_attachments
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES entity_tasks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE, -- Optional: link to comment
  user_id UUID REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size_bytes INT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
```

**Frontend Component:**
```typescript
// File: src/components/tasks/task-comment-thread.tsx

export function TaskCommentThread({ taskId }: { taskId: string }) {
  const [newComment, setNewComment] = useState('')
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)

  const { data: comments } = trpc.tasks.getComments.useQuery({ taskId })
  const addCommentMutation = trpc.tasks.addComment.useMutation({
    onSuccess: () => {
      setNewComment('')
      toast.success('Đã thêm comment')
    }
  })

  return (
    <div>
      {/* Comment list */}
      {comments?.map(comment => (
        <div key={comment.id} className="flex gap-3 mb-4">
          <Avatar user={comment.user} />
          <div>
            <p className="font-semibold">{comment.user.name}</p>
            <p className="text-sm text-gray-500">{formatDistanceToNow(comment.created_at)}</p>
            <p className="mt-2">{comment.comment}</p>

            {comment.attachments?.map(att => (
              <a key={att.id} href={att.file_path} download className="flex items-center gap-2 mt-2 text-blue-600">
                <Paperclip className="h-4 w-4" />
                {att.file_name} ({formatBytes(att.file_size_bytes)})
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* Add comment form */}
      <div className="mt-4">
        <Textarea
          placeholder="Thêm comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />

        <div className="flex items-center gap-2 mt-2">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setUploadingFile(e.target.files?.[0] || null)}
            className="hidden"
            id="attachment-upload"
          />
          <label htmlFor="attachment-upload" className="cursor-pointer">
            <Button variant="secondary">📎 Đính kèm file</Button>
          </label>

          {uploadingFile && (
            <span className="text-sm">
              {uploadingFile.name} ({formatBytes(uploadingFile.size)})
            </span>
          )}

          <Button
            disabled={!newComment.trim()}
            onClick={() => {
              addCommentMutation.mutate({
                taskId,
                comment: newComment,
                attachment: uploadingFile
              })
            }}
          >
            Gửi
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Rationale

**Why Separate task_comments Table?**
- ✅ Queryable (fetch all comments for task)
- ✅ Deletable (allow users to delete their own comments)
- ✅ Normalized (one comment = one row)

**Why Separate task_attachments Table?**
- ✅ Multiple attachments per comment
- ✅ Independent lifecycle (delete attachment != delete comment)
- ✅ Metadata storage (file size, mime type for validation)

**Why Supabase Storage?**
- ✅ Integrated with database (RLS policies)
- ✅ CDN for fast delivery
- ✅ Free tier: 1GB storage, 2GB bandwidth

**Why 5MB File Size Limit?**
- ✅ Prevents abuse (100MB images slow system)
- ✅ Reasonable for photos/PDFs
- ✅ Larger files → external service (Google Drive, Dropbox)

### Consequences

**Positive:**
- ✅ Async communication (technicians don't need real-time chat)
- ✅ Permanent record (audit trail for task issues)
- ✅ Visual evidence (photos of damage)

**Negative:**
- ⚠️ Storage costs (1000 tasks × 5MB = 5GB)
- ⚠️ No real-time updates (need polling or websockets)
- ⚠️ File virus scanning (Phase 4 feature)

**Mitigations:**
- Monitor storage usage (dashboard)
- Compress images before upload (client-side)
- Add file retention policy (delete after 1 year)
- Phase 4: Add virus scanning (ClamAV integration)

### Alternatives Considered

**Alternative 1: Store Comments in entity_tasks.metadata (JSONB)**
- **Rejected:** Hard to query, no indexing, bad for many comments
- **Example:** "Find all tasks where User X commented" → impossible

**Alternative 2: Use Third-Party (Disqus, Slack)**
- **Rejected:** External dependency, data not in our control
- **Example:** If Disqus goes down, comments inaccessible

**Alternative 3: Real-Time Comments (Websockets)**
- **Rejected:** Over-engineering for async workflow
- **Future:** Consider for Phase 5 if demand high

### Implementation Checklist

- [ ] Create migration: task_comments, task_attachments tables
- [ ] Set up Supabase Storage bucket for task attachments
- [ ] Create tRPC endpoints: addComment, getComments, uploadAttachment
- [ ] Create TaskCommentThread component
- [ ] Add file upload validation (5MB limit, mime type)
- [ ] Write unit tests for comment CRUD
- [ ] Document comments feature in user guide

---

## ADR-008: Performance Optimization Strategy

### Context

**Phase 2 Performance:** All targets exceeded (Dashboard <400ms, API <200ms)

**Phase 3 Concern:** More entity types (receipts + tickets) = more queries = potential slowdown

**Question:** How to maintain Phase 2 performance in Phase 3?

### Decision

**Multi-Layered Optimization Approach**

**1. Database Layer (Indexes + Query Optimization)**
```sql
-- Add indexes for Phase 3 queries

-- Service ticket tasks query: /my-tasks dashboard
CREATE INDEX idx_entity_tasks_service_ticket
ON entity_tasks(entity_type, assigned_to_id, status)
WHERE entity_type = 'service_ticket';

-- Task dependency lookups: canStartTask()
CREATE INDEX idx_entity_tasks_metadata_depends_on
ON entity_tasks((metadata->>'depends_on'))
WHERE metadata->>'depends_on' IS NOT NULL;

-- Comment thread query: task detail page
CREATE INDEX idx_task_comments_task_id_created
ON task_comments(task_id, created_at DESC);

-- Attachment download query
CREATE INDEX idx_task_attachments_task_id
ON task_attachments(task_id);

-- Workflow assignment query
CREATE INDEX idx_service_tickets_workflow_id
ON service_tickets(workflow_id)
WHERE workflow_id IS NOT NULL;
```

**2. Application Layer (Caching + Batching)**
```typescript
// tRPC query caching (client-side)
const { data: tasks } = trpc.tasks.myTasks.useQuery(
  { entityType: 'service_ticket' },
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
)

// Batched queries (fetch multiple entities at once)
const bulkGetEntityContext = async (entityIds: string[]) => {
  // Instead of N queries (1 per entity), do 1 query with IN clause
  const tickets = await ctx.supabaseAdmin
    .from('service_tickets')
    .select('*')
    .in('id', entityIds)

  return tickets.data.map(ticket => adapter.getEntityContext(ctx, ticket.id))
}
```

**3. Frontend Layer (Lazy Loading + Virtualization)**
```typescript
// Lazy load task comments (only fetch when expanded)
function TaskCard({ task }) {
  const [showComments, setShowComments] = useState(false)

  // Only fetch when user expands comments section
  const { data: comments } = trpc.tasks.getComments.useQuery(
    { taskId: task.id },
    { enabled: showComments }
  )

  return (
    <Card>
      <TaskDetails task={task} />
      <Button onClick={() => setShowComments(!showComments)}>
        {showComments ? 'Hide' : 'Show'} Comments
      </Button>
      {showComments && <CommentThread comments={comments} />}
    </Card>
  )
}

// Virtual scrolling for long task lists (100+ tasks)
import { useVirtualizer } from '@tanstack/react-virtual'

function TaskList({ tasks }) {
  const parentRef = useRef()
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Task card height ~120px
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map(virtualItem => (
        <TaskCard key={tasks[virtualItem.index].id} task={tasks[virtualItem.index]} />
      ))}
    </div>
  )
}
```

**4. Performance Testing (Week 10)**
```typescript
// tests/performance/dashboard-load.test.ts

describe('Dashboard Performance', () => {
  it('should load within 500ms with 100 tasks', async () => {
    // Arrange: Seed database with 100 tasks
    await seedTasks(100)

    // Act: Measure load time
    const startTime = Date.now()
    await render(<TaskDashboard />)
    const loadTime = Date.now() - startTime

    // Assert
    expect(loadTime).toBeLessThan(500)
  })

  it('should handle 500 tasks without crashing', async () => {
    await seedTasks(500)
    const { container } = await render(<TaskDashboard />)
    expect(container).toBeInTheDocument()
  })
})
```

### Rationale

**Why Database Indexes?**
- ✅ Fastest optimization (10x-100x speedup)
- ✅ No code changes needed
- ✅ Negligible storage cost (<1% table size)

**Why Client-Side Caching?**
- ✅ Reduces server load
- ✅ Instant UI updates (optimistic updates)
- ✅ Works offline (cached data available)

**Why Lazy Loading?**
- ✅ Reduce initial page load (don't fetch comments until needed)
- ✅ Better UX (page interactive faster)

**Why Virtual Scrolling?**
- ✅ Handle large lists (1000+ items) without DOM bloat
- ✅ Only render visible items (50 items vs 1000)

### Consequences

**Positive:**
- ✅ Phase 2 performance maintained (Dashboard <500ms)
- ✅ Scalable (handles 10x more tasks)
- ✅ Better UX (faster perceived load time)

**Negative:**
- ⚠️ Complexity: More moving parts (cache invalidation, virtual scroll)
- ⚠️ Cache staleness: Data might be 5 minutes old
- ⚠️ Debugging harder (where's the bottleneck? DB, app, or frontend?)

**Mitigations:**
- Document caching strategy (CACHING.md)
- Add performance monitoring (track P95 load times)
- Use Chrome DevTools Lighthouse for frontend profiling

### Alternatives Considered

**Alternative 1: No Optimization (Wait for Performance Issues)**
- **Rejected:** Proactive better than reactive
- **Phase 2 Lesson:** Performance testing found no issues, but we got lucky

**Alternative 2: Server-Side Rendering (SSR) for All Pages**
- **Rejected:** Adds complexity, Next.js App Router already optimizes
- **When:** Consider for SEO-critical pages (not dashboards)

**Alternative 3: Redis Caching Layer**
- **Rejected:** Over-engineering for Phase 3
- **Future:** Consider for Phase 5 if query times >1s

### Implementation Checklist

- [ ] Add database indexes (Week 10 Day 1)
- [ ] Implement tRPC query caching (staleTime, cacheTime)
- [ ] Add lazy loading for comments
- [ ] Implement virtual scrolling for task lists
- [ ] Write performance tests (Week 10 Day 4)
- [ ] Run performance benchmarks (100, 500, 1000 tasks)
- [ ] Document optimization decisions (PERFORMANCE.md)

---

## ADR-009: Error Handling & Recovery

### Context

**Phase 2 Gap:** No unit tests, limited error handling testing

**Phase 3 Improvement:** Add comprehensive error handling

**Question:** How should errors be handled across layers?

### Decision

**Layered Error Handling Strategy**

**1. Database Layer (Triggers)**
```sql
-- Graceful degradation in triggers

CREATE OR REPLACE FUNCTION auto_create_service_ticket_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Wrap in BEGIN...EXCEPTION block (PostgreSQL error handling)
  BEGIN
    -- Validation: Workflow exists
    IF NEW.workflow_id IS NOT NULL THEN
      PERFORM 1 FROM public.workflows WHERE id = NEW.workflow_id;
      IF NOT FOUND THEN
        RAISE WARNING 'Workflow % not found, skipping task creation', NEW.workflow_id;
        RETURN NEW; -- Don't fail ticket update, just skip task creation
      END IF;
    END IF;

    -- Task creation logic...

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail trigger
      RAISE WARNING 'Error in auto_create_service_ticket_tasks: %', SQLERRM;
      RETURN NEW; -- Allow ticket update to proceed
  END;
END;
$$;
```

**2. Application Layer (tRPC)**
```typescript
// File: src/server/routers/tasks.ts

import { TRPCError } from '@trpc/server'

export const tasksRouter = router({
  startTask: publicProcedure
    .use(requireAnyAuthenticated)
    .input(startTaskSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Validation
        const canStartResult = await entityAdapter.canStartTask(ctx, input.taskId)
        if (!canStartResult.canStart) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: canStartResult.reason,
            cause: 'dependency_not_met'
          })
        }

        // Execute
        await startTask(ctx, input.taskId)

        // Audit log
        await createAuditLog(ctx, 'task_start', input.taskId)

        return { success: true }

      } catch (error) {
        // Differentiate error types
        if (error instanceof TRPCError) {
          throw error // Re-throw tRPC errors (handled by client)
        }

        if (error.code === 'PGRST116') {
          // PostgreSQL error: Record not found
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task không tồn tại',
            cause: error
          })
        }

        // Unknown error: Log and throw generic
        console.error('Unexpected error in startTask:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Lỗi không xác định. Vui lòng thử lại.',
          cause: error
        })
      }
    })
})
```

**3. Frontend Layer (React)**
```typescript
// File: src/app/(auth)/my-tasks/page.tsx

export default function MyTasksPage() {
  const startTaskMutation = trpc.tasks.startTask.useMutation({
    onSuccess: () => {
      toast.success('Đã bắt đầu task')
      queryClient.invalidateQueries(['tasks', 'myTasks'])
    },
    onError: (error) => {
      // Handle different error codes
      if (error.data?.code === 'PRECONDITION_FAILED') {
        toast.error(`Không thể bắt đầu task: ${error.message}`)
        // Show dependency task link
        if (error.data?.cause === 'dependency_not_met') {
          toast.info('Hoàn thành task phụ thuộc trước', {
            action: { label: 'Xem task', onClick: () => router.push('/tasks/...') }
          })
        }
      } else if (error.data?.code === 'NOT_FOUND') {
        toast.error('Task không tồn tại. Có thể đã bị xóa.')
        queryClient.invalidateQueries(['tasks', 'myTasks']) // Refresh list
      } else {
        // Generic error
        toast.error('Đã xảy ra lỗi. Vui lòng thử lại sau.')
        Sentry.captureException(error) // Send to error tracking (Phase 4)
      }
    }
  })

  return (
    <div>
      {/* Task list... */}
    </div>
  )
}
```

**4. Error Recovery Mechanisms**
```typescript
// Automatic retry for transient errors

const startTaskMutation = trpc.tasks.startTask.useMutation({
  retry: (failureCount, error) => {
    // Retry network errors up to 3 times
    if (error.data?.code === 'INTERNAL_SERVER_ERROR' && failureCount < 3) {
      return true
    }
    // Don't retry validation errors (will fail again)
    if (error.data?.code === 'PRECONDITION_FAILED') {
      return false
    }
    return false
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
})
```

### Rationale

**Why Graceful Degradation in Triggers?**
- ✅ Don't fail ticket updates if task creation fails
- ✅ User sees success (ticket updated), tasks created async
- ✅ Reduces critical path failures

**Why tRPC Error Codes?**
- ✅ Type-safe errors (TypeScript infers error shape)
- ✅ Semantic codes (PRECONDITION_FAILED vs INTERNAL_SERVER_ERROR)
- ✅ Actionable messages (user knows what to do)

**Why Error Recovery (Retry)?**
- ✅ Handle transient issues (network blip, database lock timeout)
- ✅ Better UX (user doesn't see error if retry succeeds)
- ✅ Exponential backoff prevents thundering herd

### Consequences

**Positive:**
- ✅ Robust system (handles edge cases)
- ✅ Clear error messages (user knows what went wrong)
- ✅ Auto-recovery (transient errors resolved automatically)

**Negative:**
- ⚠️ Complexity: More code paths
- ⚠️ Silent failures: Trigger errors logged but not surfaced
- ⚠️ Retry risks: Could amplify problem (e.g., bug in code, retry 3x = 3x load)

**Mitigations:**
- Log all errors (CloudWatch, Sentry)
- Alert on error rate spikes (>5% error rate)
- Dashboards: Track error types (which errors most common?)

### Alternatives Considered

**Alternative 1: Fail Fast (No Retries)**
- **Rejected:** Poor UX (user sees error on temporary blip)
- **When:** Use for validation errors (retry won't help)

**Alternative 2: Silent Failures (No Error Messages)**
- **Rejected:** Confusing UX (user doesn't know what happened)
- **Anti-pattern:** "Something went wrong" with no details

**Alternative 3: Global Error Boundary (Catch All)**
- **Considered:** React ErrorBoundary at app root
- **Limitation:** Only catches React render errors, not async errors
- **Solution:** Combine ErrorBoundary + mutation onError handlers

### Implementation Checklist

- [ ] Add error handling to all triggers (BEGIN...EXCEPTION blocks)
- [ ] Define tRPC error codes (PRECONDITION_FAILED, NOT_FOUND, etc.)
- [ ] Implement error handling in all tRPC endpoints
- [ ] Add retry logic to frontend mutations
- [ ] Create user-friendly error messages (Vietnamese)
- [ ] Write unit tests for error scenarios
- [ ] Document error codes in API docs

---

## ADR-010: Mobile Responsiveness Approach

### Context

**Phase 2:** Mobile view exists but not thoroughly tested

**Phase 3:** More UI components (workflow builder, bulk actions)

**Question:** How to ensure mobile responsiveness?

### Decision

**Mobile-First Design + Tailwind Responsive Classes**

**Principles:**
1. Design for mobile (375px width) FIRST
2. Progressively enhance for tablet (768px) and desktop (1024px+)
3. Touch-friendly (44px minimum tap targets)
4. Test on real devices (not just browser DevTools)

**Implementation:**
```typescript
// Example: Workflow builder (complex UI)

function WorkflowBuilder() {
  return (
    <div className="
      flex flex-col gap-4          /* Mobile: Stack vertically */
      md:flex-row md:gap-6         /* Tablet+: Side by side */
    ">
      {/* Sidebar: Workflow info */}
      <div className="
        w-full md:w-64               /* Mobile: Full width, Desktop: 256px */
        order-2 md:order-1           /* Mobile: Show after, Desktop: Show before */
      ">
        <WorkflowInfo />
      </div>

      {/* Main: Task list */}
      <div className="
        w-full md:flex-1             /* Mobile: Full width, Desktop: Remaining space */
        order-1 md:order-2
      ">
        <TaskList />
      </div>
    </div>
  )
}

// Touch-friendly buttons
function TaskCard() {
  return (
    <Button className="
      h-12 px-6                     /* 48px height = touch-friendly */
      w-full md:w-auto              /* Mobile: Full width, Desktop: Auto */
      text-base md:text-sm          /* Mobile: Larger text (16px), Desktop: 14px */
    ">
      Start Task
    </Button>
  )
}

// Responsive tables → cards on mobile
function TaskTable({ tasks }) {
  return (
    <>
      {/* Desktop: Table */}
      <table className="hidden md:table">
        <thead>...</thead>
        <tbody>...</tbody>
      </table>

      {/* Mobile: Card list */}
      <div className="md:hidden space-y-4">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </>
  )
}
```

**Testing Strategy:**
- **Week 9:** Design mobile mockups FIRST (Figma)
- **Week 11 Day 3:** Mobile testing session (2h)
  - Test on real devices: iPhone 14, Samsung Galaxy, iPad
  - Test interactions: Tap, swipe, scroll
  - Test landscape + portrait orientations
- **Week 11 Day 4:** UX review includes mobile feedback

### Rationale

**Why Mobile-First?**
- ✅ Forces prioritization (what's essential?)
- ✅ Easier to add desktop features than remove mobile bloat
- ✅ Mobile usage growing (30%+ traffic from tablets in warehouse)

**Why Tailwind Responsive Classes?**
- ✅ Consistent breakpoints (sm: 640px, md: 768px, lg: 1024px)
- ✅ Visible in code (see mobile + desktop styles together)
- ✅ No media query files to maintain

**Why 44px Touch Targets?**
- ✅ Apple Human Interface Guidelines minimum
- ✅ Prevents mis-taps (buttons too close together)

**Why Test on Real Devices?**
- ✅ Browser DevTools not accurate (rendering differences)
- ✅ Touch interactions feel different (hover doesn't exist on mobile)
- ✅ Performance testing (mobile CPUs slower)

### Consequences

**Positive:**
- ✅ Technicians can use tablets in warehouse (30% productivity boost)
- ✅ Managers can approve tasks on phone (flexibility)
- ✅ Better accessibility (large touch targets help elderly users)

**Negative:**
- ⚠️ More CSS (responsive classes add bundle size ~5KB)
- ⚠️ Testing burden (must test 3 breakpoints: mobile, tablet, desktop)
- ⚠️ Design complexity (consider mobile layout from day 1)

**Mitigations:**
- Use Tailwind JIT (only include used classes)
- Automate testing: Playwright mobile viewports
- Document mobile patterns in design system

### Alternatives Considered

**Alternative 1: Desktop-Only (No Mobile)**
- **Rejected:** Phase 2 retro: Warehouse users want tablets
- **Lost opportunity:** 30% usage could be higher with better mobile UX

**Alternative 2: Separate Mobile App (React Native)**
- **Rejected:** Over-engineering for Phase 3
- **Future:** Consider for Phase 5 if demand high

**Alternative 3: Responsive Framework (Bootstrap)**
- **Rejected:** Tailwind already in use, switching costly
- **Benefit:** Tailwind more flexible, smaller bundle

### Implementation Checklist

- [ ] Design mobile mockups FIRST (Week 9)
- [ ] Use Tailwind responsive classes (md:, lg:)
- [ ] Ensure 44px minimum touch targets
- [ ] Test on real devices (Week 11 Day 3)
- [ ] Include mobile feedback in UX review (Week 11 Day 4)
- [ ] Document mobile patterns (MOBILE-DESIGN-GUIDE.md)
- [ ] Add Playwright mobile viewport tests

---

## 📊 Decision Summary & Impact Matrix

| Decision | Complexity | Impact | Risk | Effort (Days) |
|----------|-----------|--------|------|---------------|
| **ADR-001: Service Ticket Adapter** | High | High | Medium | 3 |
| **ADR-002: Task Dependencies** | Medium | High | Low | 2 |
| **ADR-003: Workflow Data Model** | Low | High | Low | 1 |
| **ADR-004: Unit Testing** | Medium | High | Low | 3 |
| **ADR-005: Task Reassignment** | Low | Medium | Low | 1 |
| **ADR-006: Bulk Operations** | Medium | Medium | Medium | 2 |
| **ADR-007: Comments & Attachments** | Low | Low | Low | 2 |
| **ADR-008: Performance Optimization** | Medium | High | Low | 2 |
| **ADR-009: Error Handling** | Medium | Medium | Low | 2 |
| **ADR-010: Mobile Responsiveness** | Low | Medium | Low | 1 |

**Total Effort:** 19 days (distributed across 6 people over Weeks 9-11)

---

## 🔄 Review & Approval Process

### Architect Review (Week 9 Day 1-2)

**Reviewers:**
- Tech Lead (primary reviewer)
- Senior Developers (peer review)

**Checklist:**
- [ ] All decisions have rationale
- [ ] Alternatives considered
- [ ] Consequences documented
- [ ] Implementation checklist complete
- [ ] No architectural anti-patterns

### Team Review (Week 9 Day 3)

**Meeting:** 2-hour architecture review session
**Attendees:** All team members
**Agenda:**
- Present each ADR (10 min per ADR)
- Team questions & feedback (5 min per ADR)
- Vote on approval (all must approve)

### Stakeholder Approval (Week 9 Day 4)

**Reviewers:**
- Product Owner
- Operations Manager
- Warehouse Manager (if mobile concerns)

**Focus:**
- Business impact
- User experience
- Timeline feasibility

### Final Sign-Off (Week 9 Day 5)

**Approver:** Tech Lead + Product Owner

---

## 📚 References

**Phase 2 Documents:**
- `docs/PHASE-2-REVIEW-AND-RETROSPECTIVE.md` - Lessons learned
- `docs/architecture/SERIAL-ENTRY-WORKFLOW-ARCHITECTURE.md` - Phase 2 architecture

**Existing Architecture:**
- `docs/CLAUDE.md` - System overview
- `src/server/services/entity-adapters/` - Entity adapter pattern
- `docs/data/schemas/` - Database schema

**External References:**
- tRPC Error Handling: https://trpc.io/docs/error-handling
- React Virtual: https://tanstack.com/virtual/v3
- Tailwind Responsive Design: https://tailwindcss.com/docs/responsive-design

---

## Document Sign-Off

**Created By:**
Tech Lead: _________________________ Date: Nov 3, 2025

**Reviewed By:**
- Developer 1: _________________________ Date: _________
- Developer 2: _________________________ Date: _________
- Developer 3: _________________________ Date: _________
- QA Lead: _________________________ Date: _________
- UX Designer: _________________________ Date: _________

**Approved By:**
- Product Owner: _________________________ Date: _________
- Tech Lead: _________________________ Date: _________

---

**END OF ARCHITECTURE DECISIONS RECORD**

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** ✅ **APPROVED FOR IMPLEMENTATION**
**Next Review:** Week 11 (mid-implementation review)
