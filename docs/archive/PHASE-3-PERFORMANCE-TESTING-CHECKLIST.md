# Phase 3 Performance Testing Checklist

**Date:** November 3, 2025 (Week 9)
**Testing Week:** Week 10 (Nov 11-15, 2025)
**Testing Day:** Thursday, Nov 14 (Day 4 of Week 10)
**Duration:** 6 hours (QA Lead + Developer 1)
**Status:** 📋 **CHECKLIST READY**

---

## 🎯 Purpose & Context

### Why Performance Testing in Week 10? (Phase 2 Lesson)

**Phase 2 Gap:** Performance tested only at end of Week 7
- **Risk:** Could discover issues too late to fix before UAT
- **Reality:** Got lucky - performance was good

**Phase 3 Improvement:** Performance testing mid-Week 10
- **Benefit:** Find issues 1 week earlier = time to optimize
- **Benefit:** Confident going into Week 11 (frontend)
- **Benefit:** No surprises in Week 12 (UAT)

---

## 📊 Performance Targets

### Phase 2 Baselines (To Maintain)

| Metric | Phase 2 Actual | Phase 3 Target | Threshold |
|--------|----------------|----------------|-----------|
| **Dashboard Load** | <400ms | <500ms | MUST be <500ms |
| **API Response** | <200ms | <300ms | MUST be <300ms |
| **Task List Query** | <150ms | <200ms | MUST be <200ms |
| **Serial Entry Save** | <200ms | <250ms | MUST be <250ms |

### Phase 3 New Metrics

| Metric | Target | Threshold | Priority |
|--------|--------|-----------|----------|
| **Service Ticket Tasks Query** | <200ms | <300ms | P0 |
| **Workflow List Load** | <300ms | <500ms | P1 |
| **Task Dependency Check** | <50ms | <100ms | P0 |
| **Bulk Complete (10 tasks)** | <1000ms | <2000ms | P1 |
| **Comment Thread Load** | <200ms | <400ms | P2 |
| **Attachment Upload (1MB)** | <3s | <5s | P2 |

---

## ✅ Pre-Test Setup (30 minutes)

### Environment Preparation

**1. Seed Test Data**

```bash
# Run seed script
pnpm seed:perf-test

# Verify data counts
psql $DATABASE_URL -c "SELECT
  (SELECT COUNT(*) FROM service_tickets) as tickets,
  (SELECT COUNT(*) FROM entity_tasks WHERE entity_type = 'service_ticket') as tasks,
  (SELECT COUNT(*) FROM stock_receipts) as receipts,
  (SELECT COUNT(*) FROM workflows) as workflows
"
```

**Expected Counts:**
- 100 service tickets (various statuses)
- 300 service ticket tasks (3 per ticket)
- 50 stock receipts (Phase 2 verification)
- 20 workflows

**2. Start Performance Monitoring**

```bash
# Enable PostgreSQL slow query logging
psql $DATABASE_URL -c "ALTER SYSTEM SET log_min_duration_statement = 100" # Log queries >100ms
psql $DATABASE_URL -c "SELECT pg_reload_conf()"

# Start monitoring tools
pnpm monitor:start # Starts Prometheus + Grafana locally
```

**3. Verify Baseline**

```bash
# Run quick smoke test
pnpm test:perf:smoke

# Should complete in <30s with all metrics green
```

---

## 🧪 Test Suite 1: Database Query Performance (2 hours)

### Test 1.1: Task List Queries (Multi-Entity)

**Scenario:** User views /my-tasks dashboard with 100+ tasks (receipts + tickets)

**Query Under Test:**
```sql
SELECT
  et.*,
  CASE
    WHEN et.entity_type = 'service_ticket' THEN st.ticket_number
    WHEN et.entity_type = 'inventory_receipt' THEN sr.receipt_number
  END as entity_number
FROM entity_tasks et
LEFT JOIN service_tickets st ON st.id = et.entity_id AND et.entity_type = 'service_ticket'
LEFT JOIN stock_receipts sr ON sr.id = et.entity_id AND et.entity_type = 'inventory_receipt'
WHERE et.assigned_to_id = $1
ORDER BY et.due_date ASC
LIMIT 50;
```

**Test Steps:**
1. Run EXPLAIN ANALYZE on query
2. Check execution time
3. Verify index usage

**Success Criteria:**
- ✅ Query completes in <200ms
- ✅ Uses indexes (no sequential scans on large tables)
- ✅ Returns max 50 rows (pagination)

**Optimization Actions (if fails):**
```sql
-- Create compound index for multi-entity query
CREATE INDEX idx_entity_tasks_assigned_type_status
ON entity_tasks(assigned_to_id, entity_type, status)
INCLUDE (due_date, sequence_order);

-- Verify index usage
EXPLAIN ANALYZE <query>;
```

---

### Test 1.2: Task Dependency Checks

**Scenario:** User clicks "Start Task" → System checks if previous task complete

**Query Under Test:**
```sql
-- Get previous task in sequence
SELECT id, name, status, sequence_order
FROM entity_tasks
WHERE entity_type = 'service_ticket'
  AND entity_id = $1
  AND sequence_order = $2 - 1
LIMIT 1;
```

**Test Steps:**
1. Run query 100 times (simulating 100 task starts)
2. Measure average, P50, P95, P99 response times

**Success Criteria:**
- ✅ Average <50ms
- ✅ P95 <100ms
- ✅ P99 <150ms

**Performance Test Script:**
```javascript
// tests/performance/dependency-check.perf.js

async function testDependencyCheck() {
  const times = []

  for (let i = 0; i < 100; i++) {
    const start = Date.now()
    await adapter.canStartTask(ctx, taskIds[i])
    const duration = Date.now() - start
    times.push(duration)
  }

  const avg = times.reduce((a, b) => a + b) / times.length
  const p95 = times.sort()[Math.floor(times.length * 0.95)]
  const p99 = times.sort()[Math.floor(times.length * 0.99)]

  console.log({
    average: avg,
    p50: times.sort()[Math.floor(times.length * 0.5)],
    p95: p95,
    p99: p99
  })

  expect(avg).toBeLessThan(50)
  expect(p95).toBeLessThan(100)
}
```

---

### Test 1.3: Workflow Assignment Queries

**Scenario:** Manager assigns workflow to 10 tickets simultaneously

**Query Under Test:**
```sql
UPDATE service_tickets
SET workflow_id = $1, updated_at = NOW()
WHERE id = ANY($2); -- Array of 10 ticket IDs
```

**Test Steps:**
1. Run bulk update with 10 ticket IDs
2. Measure query time
3. Check trigger execution time (auto_create_service_ticket_tasks)

**Success Criteria:**
- ✅ UPDATE completes in <300ms
- ✅ Triggers create 30 tasks (3 per ticket) in <500ms total
- ✅ No deadlocks or lock timeouts

**Load Test:**
```bash
# Simulate 5 concurrent managers assigning workflows
pnpm test:perf:workflow-assignment --concurrent=5
```

---

### Test 1.4: Comment Thread Pagination

**Scenario:** User views task detail page with 50 comments

**Query Under Test:**
```sql
SELECT
  tc.*,
  p.name as user_name,
  p.role as user_role
FROM task_comments tc
JOIN profiles p ON p.id = tc.user_id
WHERE tc.task_id = $1
ORDER BY tc.created_at DESC
LIMIT 20 OFFSET $2;
```

**Test Steps:**
1. Seed task with 50 comments
2. Query first page (OFFSET 0, LIMIT 20)
3. Query second page (OFFSET 20, LIMIT 20)
4. Measure each query time

**Success Criteria:**
- ✅ Page 1 query <200ms
- ✅ Page 2 query <200ms
- ✅ Uses index on (task_id, created_at)

---

## 🧪 Test Suite 2: API Response Times (1.5 hours)

### Test 2.1: tRPC Endpoint: tasks.myTasks

**Endpoint:** `trpc.tasks.myTasks.query({ entityType: 'service_ticket' })`

**Test Setup:**
```typescript
// tests/performance/api/tasks-my-tasks.perf.ts

async function testMyTasksEndpoint() {
  const times = []

  for (let i = 0; i < 100; i++) {
    const start = Date.now()
    const result = await trpcClient.tasks.myTasks.query({
      entityType: 'service_ticket'
    })
    const duration = Date.now() - start
    times.push(duration)

    expect(result.length).toBeGreaterThan(0)
  }

  const avg = times.reduce((a, b) => a + b) / times.length
  const p95 = times.sort()[Math.floor(times.length * 0.95)]

  console.log({
    average: avg,
    p95: p95,
    p99: times.sort()[Math.floor(times.length * 0.99)]
  })

  expect(avg).toBeLessThan(300)
  expect(p95).toBeLessThan(500)
}
```

**Success Criteria:**
- ✅ Average response time <300ms
- ✅ P95 <500ms
- ✅ Returns enriched entity context (progress, priority)

---

### Test 2.2: tRPC Endpoint: tasks.reassign

**Endpoint:** `trpc.tasks.reassign.mutate({ taskId, newAssigneeId, reason })`

**Test Steps:**
1. Call endpoint 50 times
2. Measure response time
3. Verify audit log creation doesn't slow down response

**Success Criteria:**
- ✅ Average response time <200ms
- ✅ Audit log created successfully (verify after test)

---

### Test 2.3: tRPC Endpoint: tasks.bulkComplete

**Endpoint:** `trpc.tasks.bulkComplete.mutate({ taskIds: [10 tasks] })`

**Test Steps:**
1. Prepare 10 tasks ready to complete
2. Call bulkComplete
3. Measure total time

**Load Test Scenarios:**
| Scenario | Task Count | Expected Time | Threshold |
|----------|------------|---------------|-----------|
| Small batch | 5 tasks | <500ms | <800ms |
| Medium batch | 10 tasks | <1000ms | <2000ms |
| Large batch | 50 tasks | <5000ms | <10000ms |

**Success Criteria:**
- ✅ 10 tasks complete in <1000ms (sequential processing)
- ✅ All tasks marked completed in database
- ✅ Ticket auto-completion triggered if applicable

---

### Test 2.4: tRPC Endpoint: workflows.create

**Endpoint:** `trpc.workflows.create.mutate({ name, entity_type, task_ids: [5 tasks] })`

**Test Steps:**
1. Create workflow with 5 tasks
2. Measure total time (includes workflow_tasks inserts)

**Success Criteria:**
- ✅ Workflow creation <300ms
- ✅ Transaction successful (workflow + 5 workflow_tasks)

---

## 🧪 Test Suite 3: Frontend Load Times (1.5 hours)

### Test 3.1: Dashboard Page Load

**Page:** `/my-tasks`

**Test Tool:** Playwright with performance tracing

```typescript
// tests/performance/frontend/dashboard-load.perf.ts

test('Dashboard loads within 500ms', async ({ page }) => {
  await page.goto('/login')
  await login(page, technicianUser)

  // Start performance trace
  await page.startTracing({ screenshots: true, snapshots: true })

  const startTime = Date.now()
  await page.goto('/my-tasks')
  await page.waitForSelector('[data-testid="task-list"]')
  const loadTime = Date.now() - startTime

  await page.stopTracing({ path: 'traces/dashboard-load.json' })

  console.log(`Dashboard load time: ${loadTime}ms`)
  expect(loadTime).toBeLessThan(500)
})
```

**Success Criteria:**
- ✅ First Contentful Paint (FCP) <300ms
- ✅ Time to Interactive (TTI) <500ms
- ✅ No layout shifts (CLS = 0)

**Metrics to Capture:**
- Total load time
- API call duration (trpc.tasks.myTasks)
- Render time
- Number of DOM nodes

---

### Test 3.2: Service Ticket Detail Page Load

**Page:** `/tickets/[id]` (with 3 tasks)

**Test Steps:**
1. Navigate to ticket detail page
2. Measure load time
3. Check if tasks rendered
4. Check if comment section lazy-loaded

**Success Criteria:**
- ✅ Page load <500ms
- ✅ Tasks visible immediately
- ✅ Comments not fetched until section expanded (lazy loading)

---

### Test 3.3: Workflow Builder Page Load

**Page:** `/admin/workflows/[id]` (with 10 tasks)

**Test Steps:**
1. Navigate to workflow builder
2. Measure time to render drag-drop task list
3. Test drag performance (drag 1 task, measure FPS)

**Success Criteria:**
- ✅ Page load <600ms (more complex UI acceptable)
- ✅ Drag-drop FPS >=30 (smooth interaction)
- ✅ Save workflow <500ms

---

## 🧪 Test Suite 4: Stress Testing (1 hour)

### Test 4.1: Concurrent Task Operations

**Scenario:** 10 users start tasks simultaneously

**Test Script:**
```bash
# Artillery.io load test
artillery run tests/performance/stress/concurrent-task-start.yml
```

**artillery.yml:**
```yaml
config:
  target: 'http://localhost:3025'
  phases:
    - duration: 60
      arrivalRate: 10 # 10 requests/sec

scenarios:
  - name: 'Start task'
    flow:
      - post:
          url: '/api/trpc/tasks.startTask'
          json:
            taskId: '{{ taskId }}'
          headers:
            Authorization: 'Bearer {{ token }}'
          capture:
            - json: '$.result'
              as: 'result'
```

**Success Criteria:**
- ✅ 0% error rate
- ✅ P95 response time <1000ms
- ✅ No database deadlocks

---

### Test 4.2: Database Connection Pool

**Scenario:** 50 concurrent API requests

**Test Steps:**
1. Configure Supabase connection pool (max 20 connections)
2. Send 50 simultaneous requests
3. Monitor connection pool usage

**Success Criteria:**
- ✅ No "connection pool exhausted" errors
- ✅ Requests queued gracefully
- ✅ Average wait time <100ms

**Monitoring Query:**
```sql
-- Check active connections
SELECT
  count(*),
  state,
  wait_event_type
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY state, wait_event_type;
```

---

### Test 4.3: Large Dataset Performance

**Scenario:** User with 500 assigned tasks

**Test Steps:**
1. Seed database with 500 tasks for single user
2. Query /my-tasks dashboard
3. Measure load time

**Success Criteria:**
- ✅ Load time <1000ms (acceptable degradation for 500 tasks)
- ✅ Pagination works (show 50 tasks per page)
- ✅ No memory leaks in frontend

**Optimization Note:** If >1000ms, implement virtualized list (react-virtual)

---

## 🧪 Test Suite 5: Attachment Upload Performance (30 minutes)

### Test 5.1: Single File Upload (1MB Image)

**Test Steps:**
1. Upload 1MB image to task attachment
2. Measure total upload time (frontend → Supabase Storage)

**Success Criteria:**
- ✅ Upload completes in <3s
- ✅ File accessible via download URL
- ✅ Database record created in task_attachments

---

### Test 5.2: Multiple File Uploads (5 files, 5MB total)

**Test Steps:**
1. Upload 5 files simultaneously
2. Measure total time

**Success Criteria:**
- ✅ All uploads complete in <10s (parallel)
- ✅ No upload failures
- ✅ 5 rows in task_attachments table

---

## 📊 Performance Report Template

After completing all tests, generate report:

```markdown
# Phase 3 Performance Testing Report

**Date:** November 14, 2025
**Tester:** QA Lead + Developer 1
**Environment:** Local Supabase + Next.js Dev Server

## Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Dashboard Load | <500ms | XXXms | ✅/❌ |
| API Response (avg) | <300ms | XXXms | ✅/❌ |
| Task Dependency Check | <50ms | XXXms | ✅/❌ |
| Bulk Complete (10) | <1000ms | XXXms | ✅/❌ |

## Detailed Results

### Database Queries
- Task list query: XXXms (✅ Target <200ms)
- Dependency check: XXXms (✅ Target <50ms)
- Workflow assignment: XXXms (✅ Target <300ms)

### API Endpoints
- tasks.myTasks: XXXms avg, XXXms P95
- tasks.reassign: XXXms avg
- tasks.bulkComplete: XXXms for 10 tasks

### Frontend Pages
- /my-tasks load: XXXms
- /tickets/[id] load: XXXms
- /admin/workflows/[id] load: XXXms

### Stress Tests
- Concurrent task starts (10 users): XX% error rate
- Connection pool usage: XX% max capacity
- 500 tasks dataset: XXXms load time

## Issues Found

### Issue 1: [Title]
- **Severity:** P0/P1/P2
- **Symptom:** XXX
- **Metric:** XXX (target: YYY)
- **Root Cause:** XXX
- **Fix:** XXX
- **Re-test Result:** XXX

## Optimizations Implemented

1. **[Optimization Name]**
   - Before: XXXms
   - After: XXXms
   - Improvement: XX%

## Recommendations

1. [Action item for Week 11]
2. [Action item for Week 11]

## Sign-Off

- QA Lead: ✅ Approved / ⚠️ Conditional / ❌ Needs Work
- Developer 1: ✅ Approved / ⚠️ Conditional / ❌ Needs Work

**Next Steps:**
- [ ] Address P0 issues before Week 11
- [ ] Monitor production metrics after Week 12 deployment
```

---

## 🚨 Escalation Criteria

**If ANY metric fails threshold:**

### P0 Failures (Block Progress)
- Dashboard load >1000ms
- API response >1000ms
- Database query >500ms
- Concurrent requests error rate >5%

**Action:** Immediate team meeting, allocate 4h to optimize

### P1 Failures (Fix Before Week 11)
- Dashboard load 500-1000ms
- API response 300-1000ms
- Upload time >5s

**Action:** Create optimization tasks, fix during Week 11 buffer time

### P2 Failures (Monitor)
- Non-critical features slightly slow
- Edge cases (500 tasks) slower than desired

**Action:** Add to Phase 4 backlog

---

## ✅ Checklist

**Before Testing:**
- [ ] Seed test data (100 tickets, 300 tasks, 50 receipts)
- [ ] Start performance monitoring tools
- [ ] Verify baseline smoke test passes
- [ ] Clear browser cache and localStorage

**During Testing:**
- [ ] Test Suite 1: Database Queries (2h)
- [ ] Test Suite 2: API Response Times (1.5h)
- [ ] Test Suite 3: Frontend Load Times (1.5h)
- [ ] Test Suite 4: Stress Testing (1h)
- [ ] Test Suite 5: Attachment Upload (30min)

**After Testing:**
- [ ] Generate performance report
- [ ] Document all issues found
- [ ] Create optimization tasks (if needed)
- [ ] Present findings to team
- [ ] Get sign-off from QA + Tech Lead

---

## 📚 Tools & Resources

**Performance Testing Tools:**
- **Artillery.io** - Load testing & stress testing
- **Playwright** - Frontend performance tracing
- **pgBench** - PostgreSQL benchmarking
- **Clinic.js** - Node.js performance profiling

**Monitoring Tools:**
- **pg_stat_statements** - PostgreSQL query stats
- **Grafana + Prometheus** - Real-time metrics
- **Chrome DevTools** - Frontend profiling

**Documentation:**
- [Artillery.io Docs](https://artillery.io/docs)
- [Playwright Performance](https://playwright.dev/docs/test-performance)
- [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html)

---

## Document Sign-Off

**Created By:**
QA Lead: _________________________ Date: Nov 3, 2025

**Reviewed By:**
- Tech Lead: _________________________ Date: _________
- Developer 1: _________________________ Date: _________

---

**END OF PERFORMANCE TESTING CHECKLIST**

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** ✅ **READY FOR WEEK 10 DAY 4**
**Testing Date:** Thursday, Nov 14, 2025 (6 hours)
