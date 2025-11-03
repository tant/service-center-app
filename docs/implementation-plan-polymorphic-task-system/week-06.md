# Week 6: Backend Implementation

**Phase:** 2 - Serial Entry Tasks
**Weeks:** 5-8
**Focus:** Backend Implementation (Database Triggers, API, Business Logic)
**Status:** 🟡 **NOT STARTED**
**Estimated Hours:** 96h (was 64h)

---

## 📋 Quick Status Summary

| Area | Deliverables Status | Work Completion |
|------|---------------------|-----------------|
| **Developer 1 (Database & Triggers)** | ⏳ Not Started | **0%** |
| **Developer 2 (API & Business Logic)** | ⏳ Not Started | **0%** |
| **QA Engineer (Concurrent Testing)** | ⏳ Not Started | **0%** |
| **Overall Week 6** | ⏳ Not Started | **0%** |

---

## 🎯 Week 6 Focus: Concurrent Development & Testing

**Phase 1 Lessons Applied:**
- ✅ QA writes tests WHILE developers code (not after!)
- ✅ Unit tests for triggers and business logic
- ✅ Integration tests for API endpoints
- ✅ Performance benchmarking starts early

**Why Concurrent Testing Matters:**
- Bugs caught earlier = cheaper to fix
- Developers get immediate feedback
- No "testing bottleneck" at end of week
- Quality built in, not tested in

---

## Tasks Breakdown

### Developer 1: Database & Triggers (32h)

**Assigned to:** Migration Lead (same person from Phase 1)

**Prerequisites:** Week 5 architecture docs complete ✅

- [ ] Add workflow_id to inventory_receipts (4h)
  - Create migration script
  - Add foreign key to workflows table
  - Update existing receipts (backfill if needed)
  - Test migration rollback

- [ ] Create system workflows in database (4h)
  - Insert "Serial Entry" workflow template
  - Define workflow tasks (serial entry task template)
  - Set sequence, dependencies, descriptions
  - Verify workflow appears in admin UI

- [ ] Implement auto-create tasks trigger (12h)
  - **Trigger:** `auto_create_serial_entry_tasks()`
  - **Fires on:** Receipt status changes to 'approved'
  - **Logic:**
    - For each product line in receipt
    - Create entity_task with workflow template data
    - Set entity_type = 'inventory_receipt'
    - Set assigned_to = NULL (available for claiming)
    - Set due_date based on receipt priority
  - Write comprehensive comments in SQL
  - Handle edge cases (already has tasks, workflow not found)

- [ ] Implement auto-complete trigger (12h)
  - **Trigger:** `auto_complete_serial_entry_task()`
  - **Fires on:** Serial count reaches expected quantity
  - **Logic:**
    - Check serial count vs expected_quantity
    - If 100% complete → Update task status to 'completed'
    - If all tasks complete → Update receipt status to 'completed'
    - Set completed_at timestamp
  - Handle partial serial entry (< 100%)
  - Handle rollback scenarios (serial deleted)

- [ ] Write unit tests for triggers (8h) - **NEW**
  - Test auto-create trigger with various receipt states
  - Test auto-complete trigger with edge cases
  - Test idempotency (trigger fired multiple times)
  - Test error handling (workflow not found, invalid data)
  - Use PostgreSQL pgTAP or custom test framework

**Deliverables:**
- ✅ Migration: `supabase/migrations/[timestamp]_add_workflow_to_receipts.sql`
- ✅ Trigger: `auto_create_serial_entry_tasks()` function
- ✅ Trigger: `auto_complete_serial_entry_task()` function
- ✅ Unit tests passing for all triggers
- ✅ Zero TypeScript build errors

---

### Developer 2: API & Business Logic (32h)

**Assigned to:** Integration & Performance Lead (same person from Phase 1)

**Prerequisites:** Week 5 API contract spec complete ✅

- [ ] Extend task API for serial context (8h)
  - Update `enrichTaskWithContext()` in TaskService
  - Add serial entry specific context:
    - Receipt number, warehouse, products
    - Serial progress (15/100 entered)
    - Expected quantity vs actual
    - Priority level
  - Update tRPC task router with new context fields
  - Add Zod schemas for serial context

- [ ] Add progress tracking endpoint (8h)
  - **Endpoint:** `tasks.getSerialEntryProgress`
  - **Input:** receiptId (UUID)
  - **Output:**
    - Total serials expected
    - Total serials entered
    - Progress percentage
    - Per-product breakdown
    - Overdue status
  - Real-time calculation (not cached)
  - Optimized query (single database call)

- [ ] Create serial entry helper functions (8h)
  - `calculateSerialProgress(receiptId)` - Progress calculation
  - `isSerialEntryComplete(receiptId)` - 100% check
  - `getSerialEntryTasks(receiptId)` - Get related tasks
  - `canCompleteSerialTask(taskId)` - Validation before completion
  - Full JSDoc documentation
  - Unit tests for each helper

- [ ] Write API integration tests (8h) - **NEW**
  - Test `getSerialEntryProgress` endpoint
  - Test task enrichment with serial context
  - Test helper functions with edge cases
  - Test Zod schema validation
  - Test error handling (receipt not found, invalid UUID)
  - Use Vitest or similar test framework

**Deliverables:**
- ✅ TaskService updated with serial context
- ✅ New tRPC endpoint: `tasks.getSerialEntryProgress`
- ✅ Helper functions tested and documented
- ✅ API integration tests passing
- ✅ Zero TypeScript errors

---

### QA Engineer: Concurrent Testing (32h)

**Assigned to:** QA Lead (same person from Phase 1)

**🔴 CRITICAL:** Testing happens PARALLEL to development, not after!

**Testing Schedule:**
- **Days 1-2:** Write test cases while devs code
- **Days 3-4:** Execute tests as features complete
- **Day 5:** Bug triage, regression checks, performance benchmarking

- [ ] Test auto-creation scenarios (8h)
  - **Test cases:**
    - ✅ Receipt approved → Tasks created for each product
    - ✅ Receipt with 5 products → 5 tasks created
    - ✅ Receipt already has tasks → No duplicates
    - ✅ Workflow not found → Error handled gracefully
    - ✅ Receipt cancelled → No tasks created
  - Test with Phase 2 test data (from Week 5)
  - Document bugs in issue tracker
  - Verify fixes immediately

- [ ] Test auto-completion edge cases (8h)
  - **Test cases:**
    - ✅ All serials entered → Task completes
    - ✅ All tasks complete → Receipt completes
    - ✅ Partial serials (50%) → Task stays in_progress
    - ✅ Serial deleted → Progress recalculates, task reopens
    - ✅ Multiple tasks → Only complete when ALL done
  - Test rollback scenarios
  - Test concurrent serial entry (2 users)

- [ ] Integration testing (8h)
  - Test full workflow end-to-end:
    - Create receipt → Approve → Tasks auto-created
    - Assign task → Enter serials → Task auto-completes
    - Verify receipt status updates
  - Test API endpoints with Postman/Insomnia
  - Test error responses (400, 404, 500)
  - Verify audit logs created

- [ ] Performance benchmarking (initial) (4h) - **NEW**
  - Measure trigger execution time (< 50ms target)
  - Measure API response time (< 300ms target)
  - Test with 50+ receipts (load test)
  - Identify slow queries
  - Document baseline metrics

- [ ] Bug triage and regression checks (4h)
  - Daily standup with developers on bugs found
  - Verify bug fixes don't break existing features
  - Re-test Phase 1 functionality (smoke test)
  - Update test plan with new scenarios

**Deliverables:**
- ✅ Test execution report (pass/fail for each scenario)
- ✅ Bug report (P0/P1/P2 classification)
- ✅ Performance baseline metrics documented
- ✅ Regression test results (Phase 1 smoke test)

---

## 🎯 Week 6 Deliverables

**Code:**
- ✅ Database migration (workflow_id added to receipts)
- ✅ System workflows created in database
- ✅ Auto-create tasks trigger implemented and tested
- ✅ Auto-complete trigger implemented and tested
- ✅ Task API extended with serial context
- ✅ Progress tracking endpoint functional
- ✅ Serial entry helper functions

**Tests:**
- ✅ Unit tests for database triggers
- ✅ API integration tests
- ✅ Auto-creation test scenarios passing
- ✅ Auto-completion test scenarios passing
- ✅ Performance baseline established

**Documentation:**
- ✅ Trigger functions fully documented (JSDoc)
- ✅ API endpoints documented
- ✅ Test execution report
- ✅ Bug report (if any)

---

## 📊 Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| **Development Work** | 100% | ⏳ 0% |
| Database Triggers | 2 triggers | ⏳ 0/2 |
| API Endpoints | 1 new endpoint | ⏳ 0/1 |
| Helper Functions | 4 functions | ⏳ 0/4 |
| Unit Tests | >80% coverage | ⏳ 0% |
| Integration Tests | All scenarios pass | ⏳ Not Started |
| Trigger Execution Time | < 50ms | ⏳ Not Measured |
| API Response Time | < 300ms | ⏳ Not Measured |
| TypeScript Errors | 0 | ⏳ Not Checked |

---

## 🚦 Week 6 Go/No-Go Decision Gate

**At end of Week 6, we review:**

✅ **GO Criteria:**
- Both triggers implemented and tested
- Unit tests passing (>80% coverage)
- Integration tests passing (all scenarios)
- API endpoints functional
- Performance targets met (trigger < 50ms, API < 300ms)
- Zero P0 bugs
- < 3 P1 bugs

⚠️ **NO-GO Criteria:**
- Triggers not working reliably
- Unit tests failing or coverage < 50%
- P0 bugs exist
- Performance targets missed by >50%
- TypeScript build errors

**If NO-GO:** Extend Week 6 by 1-2 days to fix critical bugs. Do NOT proceed to Week 7 with unstable backend!

---

## Team Assignments

| Role | Team Member | Hours | Focus |
|------|-------------|-------|-------|
| **Developer 1** | Migration Lead | 32h | Database & Triggers + Unit Tests |
| **Developer 2** | Integration Lead | 32h | API & Business Logic + Integration Tests |
| **QA Engineer** | QA Lead | 32h | Concurrent Testing + Performance Benchmarking |
| **Tech Lead** | (Review) | 4h | Code reviews & technical guidance |

**Total:** 96h (was 64h in original plan)

**Added Hours Breakdown:**
- +8h: Developer 1 unit tests for triggers
- +8h: Developer 2 API integration tests
- +16h: QA concurrent testing + performance benchmarking

---

## Daily Standup Schedule

**Purpose:** Coordinate concurrent development & testing

**Time:** 9:00 AM daily

**Agenda (15 minutes):**
1. Developer 1: What I completed yesterday, working on today, blockers
2. Developer 2: What I completed yesterday, working on today, blockers
3. QA: Bugs found, tests executed, blockers
4. Tech Lead: Code review feedback, technical decisions

**Deliverable:** Daily standup notes in Slack/Discord

---

## Notes

**Why 96h instead of 64h?**

Original plan had no unit tests, and QA tested AFTER development complete. Phase 1 taught us:
- Sequential testing creates bottleneck
- Missing unit tests → harder debugging
- Performance issues found late → expensive to fix

**Investment in concurrent testing saves time:**
- Bugs found early → 10x cheaper to fix
- Unit tests → faster debugging
- Performance benchmarking → no surprises in Week 8

**Risk Mitigation:**
- Daily standups ensure coordination
- QA can flag issues immediately
- Developers get fast feedback loop

---

**Previous Week:** [Week 5: Workflow Design & Schema](./week-05.md)
**Next Week:** [Week 7: Frontend Integration](./week-07.md)
**Back to Index:** [Implementation Plan Index](./index.md)
