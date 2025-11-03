# Phase 3 Unit Test Plan

**Date:** November 3, 2025 (Week 9)
**Phase:** 3 - Service Ticket Workflow + System Enhancements
**Test Budget:** 24 hours (Week 10)
**Coverage Target:** 80% for new code
**Status:** 📋 **PLANNING COMPLETE**

---

## 🎯 Testing Strategy

### Why Unit Tests? (Lesson from Phase 2)

**Phase 2 Gap:** No unit tests, only E2E tests planned
- **Problem:** Harder to debug, can't test edge cases quickly
- **Impact:** Longer bug-fixing time, less confidence in refactoring

**Phase 3 Fix:** 24h unit test budget, 80% coverage target
- **Benefit:** Faster debugging (run specific test in 0.5s vs E2E in 30s)
- **Benefit:** Edge case coverage (test error paths, validation logic)
- **Benefit:** Living documentation (tests show how code works)

---

## 📊 Test Coverage Breakdown

### Total Budget: 24 hours

| Category | Hours | Developer | Test Count | Priority |
|----------|-------|-----------|------------|----------|
| **Database Triggers** | 8h | Developer 1 | ~20 tests | P0 (Critical) |
| **Entity Adapters** | 8h | Developer 2 | ~25 tests | P0 (Critical) |
| **tRPC Endpoints** | 8h | Developer 3 | ~30 tests | P1 (High) |
| **TOTAL** | 24h | All | ~75 tests | - |

### Coverage Target

**80% Line Coverage** for new Phase 3 code:
- ✅ `src/server/services/entity-adapters/service-ticket-adapter.ts`
- ✅ `src/server/routers/workflows.ts` (new endpoints)
- ✅ `src/server/routers/tasks.ts` (new endpoints: reassign, bulk, comments)
- ✅ Database trigger functions (via integration tests)

**Excluded from Coverage:**
- Phase 1/2 code (existing, already deployed)
- UI components (tested via E2E in Week 12)
- Type definitions, interfaces

---

## 🧪 Test Suite 1: Database Triggers (8h)

**Developer:** Developer 1 (Backend Lead)
**Framework:** Jest + pg (PostgreSQL test database)
**Test Count:** ~20 tests

### Setup

```typescript
// tests/database/setup.ts

import { createClient } from '@supabase/supabase-js'

// Test database connection (local Supabase instance)
const supabaseTest = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!
)

// Helper: Reset database before each test
export async function resetDatabase() {
  await supabaseTest.rpc('reset_test_data') // Custom function
}

// Helper: Create test ticket
export async function createTestTicket(overrides = {}) {
  const { data, error } = await supabaseTest
    .from('service_tickets')
    .insert({
      ticket_number: `TEST-${Date.now()}`,
      customer_id: 'test-customer-id',
      status: 'pending',
      ...overrides
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Helper: Create test workflow
export async function createTestWorkflow(overrides = {}) {
  const { data: workflow } = await supabaseTest
    .from('workflows')
    .insert({
      name: 'Test Workflow',
      entity_type: 'service_ticket',
      is_active: true,
      ...overrides
    })
    .select()
    .single()

  // Create 3 workflow tasks (diagnosis, repair, testing)
  const { data: taskLibrary } = await supabaseTest
    .from('tasks')
    .insert([
      { name: 'Diagnosis', description: 'Diagnose issue' },
      { name: 'Repair', description: 'Repair item' },
      { name: 'Testing', description: 'Test functionality' }
    ])
    .select()

  await supabaseTest
    .from('workflow_tasks')
    .insert(
      taskLibrary!.map((task, index) => ({
        workflow_id: workflow!.id,
        task_id: task.id,
        sequence_order: index + 1,
        is_required: true
      }))
    )

  return workflow
}
```

---

### Test Suite 1.1: auto_create_service_ticket_tasks()

**Test File:** `tests/database/triggers/auto_create_service_ticket_tasks.test.ts`

```typescript
describe('auto_create_service_ticket_tasks trigger', () => {

  beforeEach(async () => {
    await resetDatabase()
  })

  // TEST 1: Happy path
  it('should create tasks when ticket status changes to in_progress', async () => {
    // Arrange
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({
      workflow_id: workflow.id,
      status: 'pending'
    })

    // Act
    await supabaseTest
      .from('service_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)

    // Assert
    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .select('*')
      .eq('entity_type', 'service_ticket')
      .eq('entity_id', ticket.id)
      .order('sequence_order', { ascending: true })

    expect(tasks).toHaveLength(3)
    expect(tasks![0].name).toBe('Diagnosis')
    expect(tasks![0].status).toBe('pending')
    expect(tasks![0].metadata.task_type).toBe('diagnosis')
    expect(tasks![1].name).toBe('Repair')
    expect(tasks![1].metadata.depends_on).toBe('previous')
    expect(tasks![2].name).toBe('Testing')
  })

  // TEST 2: Idempotency
  it('should NOT create duplicate tasks on re-trigger', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({ workflow_id: workflow.id })

    // Trigger 1: pending → in_progress
    await supabaseTest
      .from('service_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)

    // Trigger 2: in_progress → pending → in_progress (re-trigger)
    await supabaseTest
      .from('service_tickets')
      .update({ status: 'pending' })
      .eq('id', ticket.id)
    await supabaseTest
      .from('service_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .select('*')
      .eq('entity_id', ticket.id)

    expect(tasks).toHaveLength(3) // NOT 6!
  })

  // TEST 3: No workflow assigned
  it('should skip task creation if no workflow assigned', async () => {
    const ticket = await createTestTicket({ workflow_id: null })

    await supabaseTest
      .from('service_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .select('*')
      .eq('entity_id', ticket.id)

    expect(tasks).toHaveLength(0)
  })

  // TEST 4: Inactive workflow
  it('should skip task creation if workflow inactive', async () => {
    const workflow = await createTestWorkflow({ is_active: false })
    const ticket = await createTestTicket({ workflow_id: workflow.id })

    await supabaseTest
      .from('service_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .select('*')
      .eq('entity_id', ticket.id)

    expect(tasks).toHaveLength(0)
  })

  // TEST 5: Wrong entity type workflow
  it('should skip if workflow entity_type != service_ticket', async () => {
    const workflow = await createTestWorkflow({ entity_type: 'inventory_receipt' })
    const ticket = await createTestTicket({ workflow_id: workflow.id })

    await supabaseTest
      .from('service_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .select('*')
      .eq('entity_id', ticket.id)

    expect(tasks).toHaveLength(0)
  })

  // TEST 6: Auto-assignment
  it('should auto-assign tasks to ticket assignee', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({
      workflow_id: workflow.id,
      assigned_to_id: 'technician-user-id'
    })

    await supabaseTest
      .from('service_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .select('assigned_to_id')
      .eq('entity_id', ticket.id)

    expect(tasks![0].assigned_to_id).toBe('technician-user-id')
    expect(tasks![1].assigned_to_id).toBe('technician-user-id')
    expect(tasks![2].assigned_to_id).toBe('technician-user-id')
  })

  // TEST 7: Due date calculation
  it('should set due_date to 7 days from now', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({ workflow_id: workflow.id })

    const before = new Date()
    await supabaseTest
      .from('service_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)
    const after = new Date()

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .select('due_date')
      .eq('entity_id', ticket.id)
      .single()

    const dueDate = new Date(tasks!.due_date)
    const expectedMin = new Date(before.getTime() + 7 * 24 * 60 * 60 * 1000)
    const expectedMax = new Date(after.getTime() + 7 * 24 * 60 * 60 * 1000)

    expect(dueDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime())
    expect(dueDate.getTime()).toBeLessThanOrEqual(expectedMax.getTime())
  })

  // TEST 8: Task metadata populated correctly
  it('should populate task metadata with ticket info', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({
      workflow_id: workflow.id,
      ticket_number: 'SV-2025-001'
    })

    await supabaseTest
      .from('service_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)

    const { data: task } = await supabaseTest
      .from('entity_tasks')
      .select('metadata')
      .eq('entity_id', ticket.id)
      .eq('sequence_order', 1)
      .single()

    expect(task!.metadata).toMatchObject({
      task_type: 'diagnosis',
      ticket_number: 'SV-2025-001',
      auto_created: true
    })
    expect(task!.metadata.workflow_task_id).toBeDefined()
    expect(task!.metadata.created_at).toBeDefined()
  })

  // TEST 9: Sequence ordering
  it('should create tasks in correct sequence order', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({ workflow_id: workflow.id })

    await supabaseTest
      .from('service_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .select('sequence_order, name')
      .eq('entity_id', ticket.id)
      .order('sequence_order', { ascending: true })

    expect(tasks![0].sequence_order).toBe(1)
    expect(tasks![1].sequence_order).toBe(2)
    expect(tasks![2].sequence_order).toBe(3)
    expect(tasks![0].name).toBe('Diagnosis')
    expect(tasks![1].name).toBe('Repair')
    expect(tasks![2].name).toBe('Testing')
  })

  // TEST 10: Error handling (graceful degradation)
  it('should not fail ticket update if trigger errors', async () => {
    // Create workflow with invalid task references (force error)
    const { data: workflow } = await supabaseTest
      .from('workflows')
      .insert({ name: 'Bad Workflow', entity_type: 'service_ticket', is_active: true })
      .select()
      .single()

    // No workflow_tasks created → trigger will fail

    const ticket = await createTestTicket({ workflow_id: workflow!.id })

    // Trigger should log warning but not fail update
    await expect(
      supabaseTest
        .from('service_tickets')
        .update({ status: 'in_progress' })
        .eq('id', ticket.id)
    ).resolves.not.toThrow()

    // Ticket status should be updated despite trigger error
    const { data: updatedTicket } = await supabaseTest
      .from('service_tickets')
      .select('status')
      .eq('id', ticket.id)
      .single()

    expect(updatedTicket!.status).toBe('in_progress')
  })
})
```

---

### Test Suite 1.2: auto_complete_service_ticket()

**Test File:** `tests/database/triggers/auto_complete_service_ticket.test.ts`

```typescript
describe('auto_complete_service_ticket trigger', () => {

  beforeEach(async () => {
    await resetDatabase()
  })

  // TEST 1: Happy path
  it('should auto-complete ticket when all required tasks complete', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({
      workflow_id: workflow.id,
      status: 'in_progress'
    })

    // Create tasks manually (simulate trigger 1 ran)
    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .insert([
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 1', status: 'pending', is_required: true, sequence_order: 1 },
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 2', status: 'pending', is_required: true, sequence_order: 2 },
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 3', status: 'pending', is_required: true, sequence_order: 3 }
      ])
      .select()

    // Complete task 1 and 2 (not final)
    await supabaseTest
      .from('entity_tasks')
      .update({ status: 'completed' })
      .in('id', [tasks![0].id, tasks![1].id])

    // Ticket should still be in_progress
    let { data: ticketCheck1 } = await supabaseTest
      .from('service_tickets')
      .select('status')
      .eq('id', ticket.id)
      .single()
    expect(ticketCheck1!.status).toBe('in_progress')

    // Complete final task (task 3)
    await supabaseTest
      .from('entity_tasks')
      .update({ status: 'completed' })
      .eq('id', tasks![2].id)

    // Ticket should auto-complete
    let { data: ticketCheck2 } = await supabaseTest
      .from('service_tickets')
      .select('status, completed_at')
      .eq('id', ticket.id)
      .single()

    expect(ticketCheck2!.status).toBe('completed')
    expect(ticketCheck2!.completed_at).toBeTruthy()
  })

  // TEST 2: Skipped tasks count as complete
  it('should auto-complete if all tasks completed or skipped', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({ workflow_id: workflow.id, status: 'in_progress' })

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .insert([
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 1', status: 'pending', is_required: true, sequence_order: 1 },
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 2', status: 'pending', is_required: true, sequence_order: 2 },
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 3', status: 'pending', is_required: true, sequence_order: 3 }
      ])
      .select()

    // Complete task 1, skip task 2, complete task 3
    await supabaseTest.from('entity_tasks').update({ status: 'completed' }).eq('id', tasks![0].id)
    await supabaseTest.from('entity_tasks').update({ status: 'skipped' }).eq('id', tasks![1].id)
    await supabaseTest.from('entity_tasks').update({ status: 'completed' }).eq('id', tasks![2].id)

    // Ticket should auto-complete
    const { data: ticketCheck } = await supabaseTest
      .from('service_tickets')
      .select('status')
      .eq('id', ticket.id)
      .single()

    expect(ticketCheck!.status).toBe('completed')
  })

  // TEST 3: Optional tasks don't block completion
  it('should auto-complete even if optional tasks incomplete', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({ workflow_id: workflow.id, status: 'in_progress' })

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .insert([
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Required 1', status: 'pending', is_required: true, sequence_order: 1 },
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Optional 1', status: 'pending', is_required: false, sequence_order: 2 },
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Required 2', status: 'pending', is_required: true, sequence_order: 3 }
      ])
      .select()

    // Complete only required tasks
    await supabaseTest.from('entity_tasks').update({ status: 'completed' }).eq('id', tasks![0].id)
    await supabaseTest.from('entity_tasks').update({ status: 'completed' }).eq('id', tasks![2].id)
    // Leave optional task incomplete

    // Ticket should auto-complete
    const { data: ticketCheck } = await supabaseTest
      .from('service_tickets')
      .select('status')
      .eq('id', ticket.id)
      .single()

    expect(ticketCheck!.status).toBe('completed')
  })

  // TEST 4: Don't complete cancelled tickets
  it('should NOT auto-complete if ticket cancelled', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({ workflow_id: workflow.id, status: 'cancelled' })

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .insert([
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 1', status: 'pending', is_required: true, sequence_order: 1 }
      ])
      .select()

    // Complete task
    await supabaseTest.from('entity_tasks').update({ status: 'completed' }).eq('id', tasks![0].id)

    // Ticket should stay cancelled
    const { data: ticketCheck } = await supabaseTest
      .from('service_tickets')
      .select('status')
      .eq('id', ticket.id)
      .single()

    expect(ticketCheck!.status).toBe('cancelled')
  })

  // TEST 5: Don't re-complete already completed tickets
  it('should NOT update ticket if already completed', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({
      workflow_id: workflow.id,
      status: 'completed',
      completed_at: '2025-01-01 10:00:00'
    })

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .insert([
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 1', status: 'completed', is_required: true, sequence_order: 1 }
      ])
      .select()

    // Manually update task again (shouldn't affect ticket)
    await supabaseTest.from('entity_tasks').update({ updated_at: new Date().toISOString() }).eq('id', tasks![0].id)

    // Ticket completed_at should NOT change
    const { data: ticketCheck } = await supabaseTest
      .from('service_tickets')
      .select('completed_at')
      .eq('id', ticket.id)
      .single()

    expect(ticketCheck!.completed_at).toBe('2025-01-01 10:00:00')
  })

  // TEST 6: Only trigger for service_ticket entity type
  it('should NOT trigger for inventory_receipt tasks', async () => {
    const receipt = await createTestReceipt({ status: 'approved' })

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .insert([
        { entity_type: 'inventory_receipt', entity_id: receipt.id, name: 'Task 1', status: 'pending', is_required: true, sequence_order: 1 }
      ])
      .select()

    // Complete receipt task
    await supabaseTest.from('entity_tasks').update({ status: 'completed' }).eq('id', tasks![0].id)

    // Receipt should NOT auto-complete (Phase 2 has its own logic)
    const { data: receiptCheck } = await supabaseTest
      .from('stock_receipts')
      .select('status')
      .eq('id', receipt.id)
      .single()

    expect(receiptCheck!.status).toBe('approved') // NOT completed
  })

  // TEST 7: Completed_at timestamp set correctly
  it('should set completed_at to current timestamp', async () => {
    const workflow = await createTestWorkflow()
    const ticket = await createTestTicket({ workflow_id: workflow.id, status: 'in_progress', completed_at: null })

    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .insert([
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 1', status: 'pending', is_required: true, sequence_order: 1 }
      ])
      .select()

    const before = new Date()
    await supabaseTest.from('entity_tasks').update({ status: 'completed' }).eq('id', tasks![0].id)
    const after = new Date()

    const { data: ticketCheck } = await supabaseTest
      .from('service_tickets')
      .select('completed_at')
      .eq('id', ticket.id)
      .single()

    const completedAt = new Date(ticketCheck!.completed_at)
    expect(completedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(completedAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  // TEST 8: Error handling (graceful)
  it('should not crash if ticket not found', async () => {
    // Create orphaned task (no ticket)
    const { data: task } = await supabaseTest
      .from('entity_tasks')
      .insert({
        entity_type: 'service_ticket',
        entity_id: '00000000-0000-0000-0000-000000000000', // Non-existent ticket
        name: 'Orphan Task',
        status: 'pending',
        is_required: true,
        sequence_order: 1
      })
      .select()
      .single()

    // Complete task (trigger should handle gracefully)
    await expect(
      supabaseTest.from('entity_tasks').update({ status: 'completed' }).eq('id', task!.id)
    ).resolves.not.toThrow()
  })
})
```

**Estimated Time:** 8 hours
- **Setup & Helpers:** 1h
- **auto_create_service_ticket_tasks tests:** 4h (10 tests)
- **auto_complete_service_ticket tests:** 3h (8 tests)

---

## 🧪 Test Suite 2: Entity Adapters (8h)

**Developer:** Developer 2 (Backend Lead)
**Framework:** Jest
**Test Count:** ~25 tests

### Test Suite 2.1: ServiceTicketAdapter

**Test File:** `tests/server/entity-adapters/service-ticket-adapter.test.ts`

*(Tests already shown in Architecture document - ADR-001)*

**Test Coverage:**
- ✅ `canStartTask()` - 8 tests
- ✅ `getEntityContext()` - 7 tests
- ✅ `canAssignWorkflow()` - 4 tests
- ✅ `onTaskStart()` - 2 tests
- ✅ `onTaskComplete()` - 2 tests
- ✅ `onTaskBlock()` - 2 tests

**Total:** 25 tests

**Estimated Time:** 8 hours
- **Setup & Mocks:** 1h
- **canStartTask tests:** 3h
- **getEntityContext tests:** 2h
- **canAssignWorkflow tests:** 1h
- **Other methods:** 1h

---

## 🧪 Test Suite 3: tRPC Endpoints (8h)

**Developer:** Developer 3 (Frontend Lead)
**Framework:** Jest + tRPC test helpers
**Test Count:** ~30 tests

### Setup

```typescript
// tests/server/routers/setup.ts

import { appRouter } from '@/server/routers/_app'
import { createInnerTRPCContext } from '@/server/trpc'

// Helper: Create tRPC caller with mocked context
export function createCaller(user: { id: string; role: string; email: string }) {
  const ctx = createInnerTRPCContext({
    user,
    userId: user.id,
    supabaseAdmin: supabaseTest, // Test Supabase client
    supabaseClient: supabaseTest
  })

  return appRouter.createCaller(ctx)
}

// Test users
export const adminUser = {
  id: 'admin-user-id',
  email: 'admin@test.com',
  role: 'Admin'
}

export const managerUser = {
  id: 'manager-user-id',
  email: 'manager@test.com',
  role: 'Manager'
}

export const technicianUser = {
  id: 'technician-user-id',
  email: 'technician@test.com',
  role: 'Technician'
}
```

---

### Test Suite 3.1: workflows.create()

**Test File:** `tests/server/routers/workflows.test.ts`

```typescript
describe('workflows.create', () => {

  it('should create workflow with valid input (Admin)', async () => {
    const caller = createCaller(adminUser)

    const result = await caller.workflows.create({
      name: 'Test Service Workflow',
      description: 'Test workflow for service tickets',
      entity_type: 'service_ticket',
      strict_sequence: true,
      task_ids: [] // Empty initially, add tasks later
    })

    expect(result).toMatchObject({
      id: expect.any(String),
      name: 'Test Service Workflow',
      entity_type: 'service_ticket',
      is_active: true
    })
  })

  it('should reject workflow creation if not Admin', async () => {
    const caller = createCaller(managerUser)

    await expect(
      caller.workflows.create({
        name: 'Test',
        entity_type: 'service_ticket',
        task_ids: []
      })
    ).rejects.toThrow('Chỉ Admin mới được tạo workflow')
  })

  it('should validate required fields', async () => {
    const caller = createCaller(adminUser)

    await expect(
      caller.workflows.create({
        name: '', // Empty name
        entity_type: 'service_ticket',
        task_ids: []
      })
    ).rejects.toThrow('name')
  })

  it('should validate entity_type enum', async () => {
    const caller = createCaller(adminUser)

    await expect(
      caller.workflows.create({
        name: 'Test',
        entity_type: 'invalid_type', // Invalid
        task_ids: []
      })
    ).rejects.toThrow('entity_type')
  })

  it('should create workflow_tasks when task_ids provided', async () => {
    const caller = createCaller(adminUser)

    const { data: tasks } = await supabaseTest
      .from('tasks')
      .insert([
        { name: 'Task 1' },
        { name: 'Task 2' }
      ])
      .select()

    const result = await caller.workflows.create({
      name: 'Test Workflow',
      entity_type: 'service_ticket',
      task_ids: tasks!.map(t => t.id)
    })

    const { data: workflowTasks } = await supabaseTest
      .from('workflow_tasks')
      .select('*')
      .eq('workflow_id', result.id)

    expect(workflowTasks).toHaveLength(2)
    expect(workflowTasks![0].sequence_order).toBe(1)
    expect(workflowTasks![1].sequence_order).toBe(2)
  })
})
```

---

### Test Suite 3.2: tasks.reassign()

**Test File:** `tests/server/routers/tasks.test.ts`

```typescript
describe('tasks.reassign', () => {

  it('should reassign task to new technician (Manager)', async () => {
    const caller = createCaller(managerUser)

    const ticket = await createTestTicket({ assigned_to_id: technicianUser.id })
    const { data: task } = await supabaseTest
      .from('entity_tasks')
      .insert({
        entity_type: 'service_ticket',
        entity_id: ticket.id,
        name: 'Test Task',
        assigned_to_id: technicianUser.id,
        status: 'pending'
      })
      .select()
      .single()

    const newTechnicianId = 'new-technician-id'

    await caller.tasks.reassign({
      taskId: task!.id,
      newAssigneeId: newTechnicianId,
      reason: 'Technician on sick leave'
    })

    const { data: updatedTask } = await supabaseTest
      .from('entity_tasks')
      .select('assigned_to_id')
      .eq('id', task!.id)
      .single()

    expect(updatedTask!.assigned_to_id).toBe(newTechnicianId)
  })

  it('should create audit log on reassignment', async () => {
    const caller = createCaller(managerUser)

    const ticket = await createTestTicket()
    const { data: task } = await supabaseTest
      .from('entity_tasks')
      .insert({
        entity_type: 'service_ticket',
        entity_id: ticket.id,
        name: 'Test Task',
        assigned_to_id: technicianUser.id,
        status: 'pending'
      })
      .select()
      .single()

    await caller.tasks.reassign({
      taskId: task!.id,
      newAssigneeId: 'new-tech-id',
      reason: 'Workload rebalance'
    })

    const { data: auditLog } = await supabaseTest
      .from('audit_logs')
      .select('*')
      .eq('action', 'task_reassignment')
      .eq('record_id', task!.id)
      .single()

    expect(auditLog).toBeTruthy()
    expect(auditLog!.reason).toBe('Workload rebalance')
    expect(auditLog!.changes.old_assignee_id).toBe(technicianUser.id)
    expect(auditLog!.changes.new_assignee_id).toBe('new-tech-id')
  })

  it('should reject reassignment if not Manager/Admin', async () => {
    const caller = createCaller(technicianUser)

    const ticket = await createTestTicket()
    const { data: task } = await supabaseTest
      .from('entity_tasks')
      .insert({
        entity_type: 'service_ticket',
        entity_id: ticket.id,
        name: 'Test Task',
        assigned_to_id: technicianUser.id,
        status: 'pending'
      })
      .select()
      .single()

    await expect(
      caller.tasks.reassign({
        taskId: task!.id,
        newAssigneeId: 'new-tech-id',
        reason: 'Test'
      })
    ).rejects.toThrow('Admin, Manager')
  })

  it('should validate reason length (min 10 chars)', async () => {
    const caller = createCaller(managerUser)

    const ticket = await createTestTicket()
    const { data: task } = await supabaseTest
      .from('entity_tasks')
      .insert({
        entity_type: 'service_ticket',
        entity_id: ticket.id,
        name: 'Test Task',
        assigned_to_id: technicianUser.id,
        status: 'pending'
      })
      .select()
      .single()

    await expect(
      caller.tasks.reassign({
        taskId: task!.id,
        newAssigneeId: 'new-tech-id',
        reason: 'Short' // < 10 chars
      })
    ).rejects.toThrow('10 ký tự')
  })
})
```

---

### Test Suite 3.3: tasks.bulkComplete()

**Test File:** `tests/server/routers/tasks-bulk.test.ts`

```typescript
describe('tasks.bulkComplete', () => {

  it('should complete multiple tasks (Manager)', async () => {
    const caller = createCaller(managerUser)

    const ticket = await createTestTicket({ status: 'in_progress' })
    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .insert([
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 1', status: 'in_progress', is_required: true, sequence_order: 1 },
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 2', status: 'in_progress', is_required: true, sequence_order: 2 }
      ])
      .select()

    const result = await caller.tasks.bulkComplete({
      taskIds: tasks!.map(t => t.id)
    })

    expect(result.total).toBe(2)
    expect(result.succeeded).toBe(2)
    expect(result.failed).toBe(0)

    const { data: updatedTasks } = await supabaseTest
      .from('entity_tasks')
      .select('status')
      .in('id', tasks!.map(t => t.id))

    expect(updatedTasks!.every(t => t.status === 'completed')).toBe(true)
  })

  it('should handle partial failures gracefully', async () => {
    const caller = createCaller(managerUser)

    const ticket = await createTestTicket({ status: 'in_progress' })
    const { data: tasks } = await supabaseTest
      .from('entity_tasks')
      .insert([
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 1', status: 'in_progress', is_required: true, sequence_order: 1 },
        { entity_type: 'service_ticket', entity_id: ticket.id, name: 'Task 2', status: 'pending', is_required: true, sequence_order: 2 } // Can't complete pending task
      ])
      .select()

    const result = await caller.tasks.bulkComplete({
      taskIds: tasks!.map(t => t.id)
    })

    expect(result.total).toBe(2)
    expect(result.succeeded).toBe(1) // Task 1 only
    expect(result.failed).toBe(1) // Task 2 failed
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('Task 2')
  })

  it('should reject bulk complete if not Manager/Admin', async () => {
    const caller = createCaller(technicianUser)

    await expect(
      caller.tasks.bulkComplete({ taskIds: ['task-id'] })
    ).rejects.toThrow('Admin, Manager')
  })

  it('should validate max 100 tasks per request', async () => {
    const caller = createCaller(managerUser)

    const taskIds = Array(101).fill('task-id')

    await expect(
      caller.tasks.bulkComplete({ taskIds })
    ).rejects.toThrow('100')
  })
})
```

---

### Test Suite 3.4: tasks.addComment()

**Test File:** `tests/server/routers/tasks-comments.test.ts`

```typescript
describe('tasks.addComment', () => {

  it('should add comment to task', async () => {
    const caller = createCaller(technicianUser)

    const ticket = await createTestTicket({ assigned_to_id: technicianUser.id })
    const { data: task } = await supabaseTest
      .from('entity_tasks')
      .insert({
        entity_type: 'service_ticket',
        entity_id: ticket.id,
        name: 'Test Task',
        assigned_to_id: technicianUser.id,
        status: 'in_progress'
      })
      .select()
      .single()

    await caller.tasks.addComment({
      taskId: task!.id,
      comment: 'Customer provided additional information about the issue.'
    })

    const { data: comment } = await supabaseTest
      .from('task_comments')
      .select('*')
      .eq('task_id', task!.id)
      .single()

    expect(comment).toMatchObject({
      task_id: task!.id,
      user_id: technicianUser.id,
      comment: 'Customer provided additional information about the issue.'
    })
  })

  it('should reject empty comments', async () => {
    const caller = createCaller(technicianUser)

    const ticket = await createTestTicket({ assigned_to_id: technicianUser.id })
    const { data: task } = await supabaseTest
      .from('entity_tasks')
      .insert({
        entity_type: 'service_ticket',
        entity_id: ticket.id,
        name: 'Test Task',
        assigned_to_id: technicianUser.id,
        status: 'in_progress'
      })
      .select()
      .single()

    await expect(
      caller.tasks.addComment({
        taskId: task!.id,
        comment: '' // Empty
      })
    ).rejects.toThrow('comment')
  })

  it('should reject comments >5000 characters', async () => {
    const caller = createCaller(technicianUser)

    const ticket = await createTestTicket({ assigned_to_id: technicianUser.id })
    const { data: task } = await supabaseTest
      .from('entity_tasks')
      .insert({
        entity_type: 'service_ticket',
        entity_id: ticket.id,
        name: 'Test Task',
        assigned_to_id: technicianUser.id,
        status: 'in_progress'
      })
      .select()
      .single()

    const longComment = 'a'.repeat(5001)

    await expect(
      caller.tasks.addComment({
        taskId: task!.id,
        comment: longComment
      })
    ).rejects.toThrow('5000')
  })
})
```

**Estimated Time:** 8 hours
- **Setup & Test Helpers:** 1h
- **workflows.create tests:** 2h (5 tests)
- **tasks.reassign tests:** 2h (4 tests)
- **tasks.bulkComplete tests:** 2h (4 tests)
- **tasks.addComment tests:** 1h (3 tests)

---

## 📊 Test Execution Plan

### Week 10 Schedule

**Monday-Tuesday (Days 1-2): Database Trigger Tests (8h)**
- Developer 1 implements trigger tests
- Run tests locally
- Commit to feature branch: `test/database-triggers`

**Wednesday-Thursday (Days 3-4): Entity Adapter + tRPC Tests (16h)**
- Developer 2 implements adapter tests (8h)
- Developer 3 implements tRPC tests (8h)
- Run tests locally
- Commit to respective branches

**Friday (Day 5): Integration & CI/CD (4h)**
- Merge all test branches to `main`
- Set up GitHub Actions workflow
- Run full test suite in CI
- Generate coverage report

### CI/CD Integration

**GitHub Actions Workflow:**

```yaml
# .github/workflows/test.yml

name: Unit Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Start Supabase local
        run: pnpx supabase start

      - name: Run unit tests
        run: pnpm test:unit

      - name: Generate coverage report
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi
```

---

## ✅ Success Criteria

### Phase 3 Unit Testing Success = ALL of:

1. **Coverage:** 80%+ line coverage for new Phase 3 code
2. **Pass Rate:** 100% tests passing in CI/CD
3. **Performance:** Full test suite completes in <2 minutes
4. **Maintenance:** All tests have clear names, well-documented
5. **Integration:** Tests run automatically on every PR

### Exit Criteria

Before moving to Week 11 (Frontend Implementation):

- [ ] All 75 tests written and passing
- [ ] Coverage report shows 80%+ (new code only)
- [ ] CI/CD pipeline green
- [ ] Code review completed (Tech Lead approval)
- [ ] Test documentation updated in README.md

---

## 📚 Test Documentation

**README Addition:**

```markdown
## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run specific test suite
pnpm test:unit triggers
pnpm test:unit adapters
pnpm test:unit routers

# Watch mode (re-run on file changes)
pnpm test:unit --watch

# Generate coverage report
pnpm test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Test Structure

```
tests/
├── database/
│   ├── setup.ts
│   └── triggers/
│       ├── auto_create_service_ticket_tasks.test.ts
│       └── auto_complete_service_ticket.test.ts
├── server/
│   ├── entity-adapters/
│   │   └── service-ticket-adapter.test.ts
│   └── routers/
│       ├── workflows.test.ts
│       ├── tasks.test.ts
│       ├── tasks-bulk.test.ts
│       └── tasks-comments.test.ts
└── helpers/
    ├── create-test-ticket.ts
    ├── create-test-workflow.ts
    └── reset-database.ts
```

---

## Document Sign-Off

**Created By:**
QA Lead + Tech Lead: _________________________ Date: Nov 3, 2025

**Reviewed By:**
- Developer 1 (DB Tests): _________________________ Date: _________
- Developer 2 (Adapter Tests): _________________________ Date: _________
- Developer 3 (tRPC Tests): _________________________ Date: _________

---

**END OF UNIT TEST PLAN**

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** ✅ **READY FOR WEEK 10 IMPLEMENTATION**
**Test Execution:** Week 10 (Nov 11-15, 2025)
