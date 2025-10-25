# Performance Testing Checklist - EPIC-01 Phase 2

**Priority:** P1 - HIGH
**Pass Criteria:** 80%+ pass rate (7+ of 9 tests must pass)
**Estimated Time:** 2-3 hours
**Total Tests:** 9
**Scope:** Verify NFR-1 (API response <500ms P95) and page load performance

**⚠️ IMPORTANT:** Establish performance baseline for production monitoring.

---

## Pre-Test Setup

**Test Environment:**
- [ ] Application running: http://localhost:3025
- [ ] Supabase Studio accessible: http://localhost:54323
- [ ] Browser DevTools open (Performance, Network tabs)
- [ ] Performance recording enabled
- [ ] Network throttling OFF (test on good connection first)

**Test Data:**
- [ ] Database seeded with realistic data volume:
  - 100+ tickets
  - 50+ customers
  - 100+ parts
  - 20+ templates
  - 10+ warehouses
- [ ] Multiple users with active sessions

**Performance Tools:**
- [ ] Browser DevTools (Performance tab)
- [ ] Browser DevTools (Network tab with timing)
- [ ] Lighthouse (optional)
- [ ] Supabase Studio (for query timing)

---

## Test Category 1: Page Load Times

**Tests:** 5
**Priority:** HIGH
**Target:** All pages load <3 seconds
**Pass Criteria:** 4/5 tests pass

### PERF-1.1: Ticket List Page Load
**Objective:** Verify ticket list page loads within acceptable time

**Test Steps:**
1. Clear browser cache
2. Login as Admin
3. Open Browser DevTools → Performance tab
4. Start recording
5. Navigate to `/tickets`
6. Wait for page to fully load (no loading spinners)
7. Stop recording
8. Analyze performance metrics:
   - DOM Content Loaded (DCL)
   - Load Event
   - Largest Contentful Paint (LCP)
9. Repeat test 3 times, record average
10. Check Network tab:
    - Total requests
    - Total size transferred
    - API call timings

**Expected Result:**
- ✅ Page loads in <2 seconds (target)
- ✅ DOM Content Loaded: <1.5 seconds
- ✅ Load Event: <2 seconds
- ✅ LCP: <2.5 seconds
- ✅ No blocking resources
- ✅ API calls complete quickly

**Actual Result:**
- [ ] PASS [ ] FAIL

**Performance Metrics:**
| Metric | Target | Run 1 | Run 2 | Run 3 | Average | Pass? |
|--------|--------|-------|-------|-------|---------|-------|
| DCL | <1.5s | ___ | ___ | ___ | ___ | [ ] |
| Load | <2s | ___ | ___ | ___ | ___ | [ ] |
| LCP | <2.5s | ___ | ___ | ___ | ___ | [ ] |

**Network Stats:**
- Total requests: ___
- Total size: ___ MB
- Slowest API call: ___ ms

**Evidence:**
- Screenshot of Performance tab: _____________
- Screenshot of Network tab: _____________

**Notes:**

---

### PERF-1.2: Ticket Detail Page Load
**Objective:** Verify individual ticket page loads quickly

**Test Steps:**
1. Clear browser cache
2. Login as Admin
3. Navigate to ticket list
4. Open Browser DevTools → Performance tab
5. Start recording
6. Click on a ticket to open detail page
7. Wait for full load (all tabs: details, tasks, parts, comments)
8. Stop recording
9. Analyze metrics
10. Repeat 3 times

**Expected Result:**
- ✅ Page loads in <1.5 seconds (target)
- ✅ All tabs load data without excessive delay
- ✅ No unnecessary API calls
- ✅ Images/attachments lazy loaded

**Actual Result:**
- [ ] PASS [ ] FAIL

**Performance Metrics:**
| Metric | Target | Run 1 | Run 2 | Run 3 | Average | Pass? |
|--------|--------|-------|-------|-------|---------|-------|
| Page Load | <1.5s | ___ | ___ | ___ | ___ | [ ] |
| LCP | <2s | ___ | ___ | ___ | ___ | [ ] |

**API Calls:**
- Ticket detail API: ___ ms
- Tasks API: ___ ms
- Parts API: ___ ms
- Comments API: ___ ms

**Evidence:**
- Performance recording: _____________

**Notes:**

---

### PERF-1.3: Dashboard Page Load
**Objective:** Verify dashboard loads within acceptable time despite multiple metrics

**Test Steps:**
1. Clear browser cache
2. Login as Admin
3. Open DevTools → Performance tab
4. Start recording
5. Navigate to `/dashboard`
6. Wait for all metrics cards to load
7. Wait for all charts/graphs to render
8. Stop recording
9. Analyze metrics
10. Repeat 3 times

**Expected Result:**
- ✅ Dashboard loads in <3 seconds (target)
- ✅ Metrics cards appear quickly (<1s)
- ✅ Charts render progressively (not blocking)
- ✅ Multiple API calls execute in parallel

**Actual Result:**
- [ ] PASS [ ] FAIL

**Performance Metrics:**
| Metric | Target | Run 1 | Run 2 | Run 3 | Average | Pass? |
|--------|--------|-------|-------|-------|---------|-------|
| First Paint | <1s | ___ | ___ | ___ | ___ | [ ] |
| Metrics Loaded | <2s | ___ | ___ | ___ | ___ | [ ] |
| Full Load | <3s | ___ | ___ | ___ | ___ | [ ] |

**API Calls (should be parallel):**
- Ticket stats: ___ ms
- Revenue stats: ___ ms
- Task stats: ___ ms
- Charts data: ___ ms

**Evidence:**
- Performance waterfall: _____________

**Notes:**

---

### PERF-1.4: Template List Page Load
**Objective:** Verify workflows/templates page loads quickly

**Test Steps:**
1. Clear browser cache
2. Login as Admin
3. Open DevTools → Performance tab
4. Start recording
5. Navigate to `/workflows/templates`
6. Wait for template list to load
7. Stop recording
8. Repeat 3 times

**Expected Result:**
- ✅ Page loads in <2 seconds (target)
- ✅ Template list renders quickly
- ✅ No unnecessary re-renders

**Actual Result:**
- [ ] PASS [ ] FAIL

**Performance Metrics:**
| Metric | Target | Run 1 | Run 2 | Run 3 | Average | Pass? |
|--------|--------|-------|-------|-------|---------|-------|
| Page Load | <2s | ___ | ___ | ___ | ___ | [ ] |

**Evidence:**
- Performance recording: _____________

**Notes:**

---

### PERF-1.5: Public Service Request Submission
**Objective:** Verify public portal form submission is fast

**Test Steps:**
1. Logout from application
2. Clear browser cache
3. Open DevTools → Network tab
4. Navigate to `/service-request`
5. Fill form with test data
6. Note start time
7. Submit form
8. Measure time until success message appears
9. Check Network tab for API call timing
10. Repeat 3 times

**Expected Result:**
- ✅ Form submission completes in <1 second (target)
- ✅ API response time <500ms
- ✅ Success page renders immediately after API response

**Actual Result:**
- [ ] PASS [ ] FAIL

**Performance Metrics:**
| Metric | Target | Run 1 | Run 2 | Run 3 | Average | Pass? |
|--------|--------|-------|-------|-------|---------|-------|
| API Response | <500ms | ___ | ___ | ___ | ___ | [ ] |
| Total Time | <1s | ___ | ___ | ___ | ___ | [ ] |

**Evidence:**
- Network timing: _____________

**Notes:**

---

## Test Category 2: API Response Times (NFR-1 Validation)

**Tests:** 2
**Priority:** CRITICAL
**Target:** P95 response time <500ms
**Pass Criteria:** Both tests must pass

### PERF-2.1: tRPC Endpoint Response Times
**Objective:** Verify key tRPC endpoints meet NFR-1 (<500ms P95)

**Test Steps:**
1. Use Browser DevTools Network tab
2. Execute 20 API calls for each endpoint (to get P95 data):

   **Test these endpoints:**
   - `tickets.getAll` (ticket list)
   - `tickets.getById` (ticket detail)
   - `workflow.template.getAll` (template list)
   - `warehouse.product.getAll` (inventory)
   - `dashboard.getMetrics` (dashboard stats)

3. For each endpoint:
   - Execute 20 times
   - Record response times
   - Calculate P95 (95th percentile)
   - Sort times ascending: P95 = 19th value (95% of 20)

4. Verify in Supabase Studio:
   - Check query execution times
   - Identify slow queries

**Expected Result:**
- ✅ All endpoints P95 <500ms
- ✅ P50 (median) <200ms
- ✅ No timeouts or errors

**Actual Result:**
- [ ] PASS [ ] FAIL

**API Performance:**

| Endpoint | P50 | P95 | P99 | Max | Pass (<500ms P95)? |
|----------|-----|-----|-----|-----|--------------------|
| tickets.getAll | ___ | ___ | ___ | ___ | [ ] |
| tickets.getById | ___ | ___ | ___ | ___ | [ ] |
| template.getAll | ___ | ___ | ___ | ___ | [ ] |
| product.getAll | ___ | ___ | ___ | ___ | [ ] |
| dashboard.getMetrics | ___ | ___ | ___ | ___ | [ ] |

**NFR-1 Compliance:** [ ] YES [ ] NO

**Evidence:**
- Network timing screenshots: _____________
- Raw timing data: _____________

**Notes:**

---

### PERF-2.2: Manager Dashboard Metrics Query
**Objective:** Verify manager task progress dashboard queries are optimized

**Test Steps:**
1. Seed database with realistic data:
   - 50+ tickets with tasks
   - 10+ technicians
   - 100+ tasks across various states
2. Login as Manager
3. Open DevTools → Network tab
4. Navigate to `/dashboard/task-progress`
5. Record API call timings
6. Verify query performance in Supabase Studio:

```sql
-- Test workload query performance
EXPLAIN ANALYZE
SELECT
  p.full_name,
  COUNT(CASE WHEN stt.status = 'in_progress' THEN 1 END) as active_tasks,
  COUNT(CASE WHEN stt.status = 'pending' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN stt.status = 'completed' THEN 1 END) as completed_tasks
FROM profiles p
LEFT JOIN service_ticket_tasks stt ON stt.assigned_to = p.id
WHERE p.role = 'technician'
GROUP BY p.id, p.full_name;
-- Should execute in <300ms
```

7. Execute dashboard API call 10 times
8. Calculate average response time

**Expected Result:**
- ✅ Dashboard API response <300ms average
- ✅ Workload query executes <200ms
- ✅ No full table scans (check EXPLAIN output)
- ✅ Indexes utilized effectively

**Actual Result:**
- [ ] PASS [ ] FAIL

**Performance Metrics:**
- API response time (avg of 10): ___ ms
- SQL query execution time: ___ ms
- Indexes used: [ ] YES [ ] NO

**Evidence:**
- EXPLAIN ANALYZE output: _____________
- API timing: _____________

**Notes:**

---

## Test Category 3: Database Query Performance

**Tests:** 2
**Priority:** HIGH
**Target:** Complex queries <200ms
**Pass Criteria:** Both tests must pass

### PERF-3.1: Task List Query Performance
**Objective:** Verify task queries execute quickly

**Test Steps:**
1. Open Supabase Studio → SQL Editor
2. Test task list query with various filters:

```sql
-- Test 1: Get all tasks for a technician
EXPLAIN ANALYZE
SELECT stt.*, st.ticket_number, st.customer_id
FROM service_ticket_tasks stt
JOIN service_tickets st ON st.id = stt.service_ticket_id
WHERE stt.assigned_to = '[TECH_USER_ID]'
ORDER BY stt.created_at DESC;
-- Target: <100ms

-- Test 2: Get blocked tasks
EXPLAIN ANALYZE
SELECT stt.*, st.ticket_number, p.full_name as tech_name
FROM service_ticket_tasks stt
JOIN service_tickets st ON st.id = stt.service_ticket_id
JOIN profiles p ON p.id = stt.assigned_to
WHERE stt.status = 'blocked'
ORDER BY stt.blocked_at DESC;
-- Target: <100ms

-- Test 3: Get task completion metrics
EXPLAIN ANALYZE
SELECT
  assigned_to,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_completion_seconds
FROM service_ticket_tasks
WHERE assigned_to IS NOT NULL
GROUP BY assigned_to;
-- Target: <200ms
```

3. Execute each query 5 times
4. Record execution times
5. Check EXPLAIN output for indexes

**Expected Result:**
- ✅ Query 1 (task list): <100ms
- ✅ Query 2 (blocked tasks): <100ms
- ✅ Query 3 (metrics): <200ms
- ✅ All queries use indexes (no Seq Scan on large tables)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Query Performance:**
| Query | Target | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Avg | Pass? |
|-------|--------|-------|-------|-------|-------|-------|-----|-------|
| Task List | <100ms | ___ | ___ | ___ | ___ | ___ | ___ | [ ] |
| Blocked Tasks | <100ms | ___ | ___ | ___ | ___ | ___ | ___ | [ ] |
| Task Metrics | <200ms | ___ | ___ | ___ | ___ | ___ | ___ | [ ] |

**Index Usage:**
- Indexes found: _____________
- Seq Scans detected: [ ] YES [ ] NO

**Evidence:**
- EXPLAIN ANALYZE outputs: _____________

**Notes:**

---

### PERF-3.2: Stock Levels Materialized View Performance
**Objective:** Verify stock levels view query is fast

**Test Steps:**
1. Open Supabase Studio → SQL Editor
2. Test stock levels query:

```sql
-- Test materialized view (if exists)
EXPLAIN ANALYZE
SELECT * FROM vw_stock_levels
WHERE status = 'low_stock'
ORDER BY quantity_in_stock ASC;
-- Target: <100ms

-- Test direct query (if no materialized view)
EXPLAIN ANALYZE
SELECT
  pp.id,
  pp.name,
  pp.serial_number,
  pp.quantity_in_stock,
  pp.low_stock_threshold,
  w.name as warehouse_name,
  CASE
    WHEN pp.quantity_in_stock = 0 THEN 'out_of_stock'
    WHEN pp.quantity_in_stock < pp.low_stock_threshold THEN 'low_stock'
    ELSE 'ok'
  END as status
FROM physical_products pp
LEFT JOIN warehouses w ON w.id = pp.warehouse_id
WHERE pp.quantity_in_stock < pp.low_stock_threshold
ORDER BY pp.quantity_in_stock ASC;
-- Target: <200ms
```

3. Execute query 5 times
4. Record execution times
5. Check index usage

**Expected Result:**
- ✅ Materialized view query: <100ms
- ✅ Direct query: <200ms
- ✅ Indexes on quantity_in_stock, low_stock_threshold
- ✅ Fast even with 1000+ products

**Actual Result:**
- [ ] PASS [ ] FAIL

**Query Performance:**
- Avg execution time: ___ ms
- Target: <100ms (materialized) or <200ms (direct)
- Pass: [ ] YES [ ] NO

**Evidence:**
- EXPLAIN ANALYZE output: _____________

**Notes:**

---

## Performance Test Summary

| Category | Test IDs | Total | Executed | Passed | Failed | Pass Rate |
|----------|----------|-------|----------|--------|--------|-----------|
| Page Load Times | PERF-1.1 to PERF-1.5 | 5 | ___ | ___ | ___ | ___% |
| API Response Times | PERF-2.1 to PERF-2.2 | 2 | ___ | ___ | ___ | ___% |
| Database Queries | PERF-3.1 to PERF-3.2 | 2 | ___ | ___ | ___ | ___% |
| **TOTAL** | **PERF-1.1 to PERF-3.2** | **9** | **___** | **___** | **___** | **___%** |

**Pass Criteria:** 80%+ pass rate = 7+ tests must pass
**NFR-1 Compliance:** [ ] YES [ ] NO

---

## Performance Baseline Established

**Page Load Times:**
- Dashboard: ___ seconds
- Ticket List: ___ seconds
- Ticket Detail: ___ seconds
- Template List: ___ seconds

**API Response Times (P95):**
- tickets.getAll: ___ ms
- tickets.getById: ___ ms
- dashboard.getMetrics: ___ ms

**Database Query Times:**
- Task list query: ___ ms
- Stock levels query: ___ ms

**Recommendation for Production Monitoring:**
- Set alerts if page load > 5s
- Set alerts if API P95 > 1000ms
- Set alerts if DB queries > 500ms

---

## Final Assessment

**Overall Pass Rate:** ___% (Target: 80%+)

**Result:** [ ] APPROVED [ ] REJECTED

**Performance Issues Found:** ___

**Optimization Recommendations:**

---

## Sign-Off

**Tester:** _______________ Date: _______________
**Performance Analyst:** _______________ Date: _______________
**Approval:** [ ] PASS - Performance acceptable [ ] FAIL - Optimization required

---

**Next Steps:**
- If PASS: Proceed to Data Integrity Testing
- If FAIL: Optimize slow queries/endpoints, retest

**References:**
- NFR-1: API response time <500ms P95
- Test Plan: docs/TEST_PLAN.md
- Master Tracker: docs/qa/test-execution/MASTER-TEST-EXECUTION-TRACKER.md
