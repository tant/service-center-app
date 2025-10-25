# Concurrency Testing Checklist - EPIC-01 Phase 2

**Priority:** P2 - MEDIUM
**Pass Criteria:** 70%+ pass rate (3+ of 4 tests must pass)
**Estimated Time:** 1-2 hours
**Total Tests:** 4
**Scope:** Verify system handles multiple concurrent users correctly

**⚠️ IMPORTANT:** Concurrency issues can cause data corruption or conflicts in production.

---

## Pre-Test Setup

**Test Environment:**
- [ ] Application running: http://localhost:3025
- [ ] Supabase Studio accessible: http://localhost:54323
- [ ] Multiple browser profiles or incognito windows ready
- [ ] Test accounts for multiple users

**Test Accounts:**
- [ ] Admin: admin@example.com
- [ ] Manager: manager@example.com
- [ ] Technician 1: technician@example.com
- [ ] Technician 2: Create or use second technician account
- [ ] Reception: reception@example.com

**Test Data:**
- [ ] Shared test tickets
- [ ] Shared test customers
- [ ] Sufficient test data for concurrent access

**Browser Setup:**
- [ ] Browser 1: Normal window (User A)
- [ ] Browser 2: Incognito window (User B)
- [ ] Or use different browser profiles

---

## Test Category: Multi-User Concurrency Scenarios

**Tests:** 4
**Priority:** MEDIUM
**Pass Criteria:** 3/4 tests pass

### CONC-1.1: Two Technicians Update Different Tickets
**Objective:** Verify concurrent updates to different records don't conflict

**Test Steps:**
1. Prepare 2 test tickets:
   - Ticket A: Assigned to technician1@example.com
   - Ticket B: Assigned to technician2@example.com (or use different tech account)

2. **Browser 1:**
   - Login as Technician 1
   - Navigate to Ticket A
   - Start a task on Ticket A
   - Leave task in "in_progress" (don't complete yet)

3. **Browser 2 (Incognito):**
   - Login as Technician 2
   - Navigate to Ticket B
   - Start a task on Ticket B
   - Leave task in "in_progress"

4. **Browser 1:**
   - Complete the task on Ticket A
   - Enter completion notes
   - Submit

5. **Browser 2:**
   - Simultaneously (or shortly after), complete task on Ticket B
   - Enter completion notes
   - Submit

6. Verify both updates succeeded
7. Check database:

```sql
-- Verify both tasks updated
SELECT st.ticket_number, stt.title, stt.status, stt.completed_at
FROM service_ticket_tasks stt
JOIN service_tickets st ON st.id = stt.service_ticket_id
WHERE st.ticket_number IN ('[TICKET_A]', '[TICKET_B]')
ORDER BY stt.completed_at DESC
LIMIT 2;
```

**Expected Result:**
- ✅ Both tasks complete successfully
- ✅ No errors or conflicts
- ✅ Both completion notes saved
- ✅ Both tasks show completed status
- ✅ No data loss or corruption
- ✅ Database transactions isolated correctly

**Actual Result:**
- [ ] PASS [ ] FAIL

**Verification:**
- Ticket A task completed: [ ] YES [ ] NO
- Ticket B task completed: [ ] YES [ ] NO
- Any errors: [ ] YES [ ] NO
- Data integrity maintained: [ ] YES [ ] NO

**Evidence:**
- Screenshots from both browsers: _____________
- SQL verification: _____________

**Notes:**

---

### CONC-1.2: Two Users Edit Same Customer
**Objective:** Verify concurrent edits to same record handle conflicts appropriately

**Test Steps:**
1. Create or select test customer:
   - Name: "Test Concurrent Customer"
   - Phone: "0999999999"
   - Email: "concurrent.test@example.com"
   - Address: "Original Address"

2. **Browser 1:**
   - Login as Admin
   - Navigate to customer detail
   - Click "Edit"
   - Change address to "Address Updated by User 1"
   - DO NOT SUBMIT YET

3. **Browser 2 (Incognito):**
   - Login as Reception
   - Navigate to same customer detail
   - Click "Edit"
   - Change address to "Address Updated by User 2"
   - DO NOT SUBMIT YET

4. **Browser 1:**
   - Submit the edit
   - Observe success

5. **Browser 2:**
   - Immediately after, submit the edit
   - Observe result

6. Check final state:

```sql
SELECT full_name, phone, address, updated_at
FROM customers
WHERE phone = '0999999999';
```

7. Determine conflict resolution:
   - Last Write Wins: Address = "Address Updated by User 2"
   - Optimistic Locking: User 2 gets error about stale data
   - Other conflict resolution

**Expected Result:**
- ✅ System handles concurrent edits gracefully
- ✅ One of the following occurs:
  - Last write wins (User 2 update succeeds, overwrites User 1)
  - Optimistic locking (User 2 gets conflict error)
  - Merge conflict notification
- ✅ No data corruption
- ✅ No application crash or freeze
- ✅ Clear feedback to users

**Actual Result:**
- [ ] PASS [ ] FAIL

**Conflict Resolution Observed:**
- [ ] Last Write Wins
- [ ] Optimistic Locking Error
- [ ] Other: _____________

**Final Address Value:** _______________________

**Evidence:**
- Screenshots from both browsers: _____________
- SQL result: _____________

**Notes:**

---

### CONC-1.3: Multiple Public Requests Submitted Simultaneously
**Objective:** Verify public portal handles concurrent submissions

**Test Steps:**
1. Open 5 browser windows (incognito/different browsers)
2. In each window, navigate to `/service-request`
3. Fill form with different data:
   - Window 1: Customer "Concurrent Test 1", Phone "0988888881"
   - Window 2: Customer "Concurrent Test 2", Phone "0988888882"
   - Window 3: Customer "Concurrent Test 3", Phone "0988888883"
   - Window 4: Customer "Concurrent Test 4", Phone "0988888884"
   - Window 5: Customer "Concurrent Test 5", Phone "0988888885"
4. Submit all forms at approximately the same time (within 1-2 seconds)
5. Capture tracking tokens from each
6. Verify all submissions:

```sql
-- Check all 5 requests created
SELECT tracking_token, customer_name, customer_phone, created_at
FROM service_requests
WHERE customer_phone IN ('0988888881', '0988888882', '0988888883', '0988888884', '0988888885')
ORDER BY created_at;
```

7. Verify:
   - All 5 requests created
   - All have unique tracking tokens
   - All timestamps close together
   - No duplicate tracking tokens

**Expected Result:**
- ✅ All 5 requests submitted successfully
- ✅ Each request gets unique tracking token
- ✅ No database deadlocks or transaction failures
- ✅ No duplicate tokens
- ✅ All data saved correctly
- ✅ System handles concurrent writes gracefully

**Actual Result:**
- [ ] PASS [ ] FAIL

**Submissions:**
- Total submitted: ___ (expected: 5)
- Successful: ___ (expected: 5)
- Failed: ___
- Unique tokens: [ ] YES [ ] NO

**Evidence:**
- SQL query showing all 5 requests: _____________
- Tracking tokens: _____________

**Notes:**

---

### CONC-1.4: Dashboard Real-Time Updates During Concurrent Work
**Objective:** Verify manager dashboard reflects changes made by technicians in real-time

**Test Steps:**
1. **Browser 1:**
   - Login as Manager
   - Navigate to `/dashboard/task-progress`
   - Note current metrics:
     - Active Tickets: ___
     - Tasks In Progress: ___
     - Blocked Tasks: ___
   - Leave dashboard open (with auto-refresh)

2. **Browser 2:**
   - Login as Technician 1
   - Navigate to `/my-tasks`
   - Start a task
   - Complete a task

3. **Browser 3:**
   - Login as Technician 2 (or use same tech account)
   - Navigate to different ticket
   - Block a task (enter block reason)

4. **Browser 1 (Manager Dashboard):**
   - Wait for auto-refresh (30-60 seconds) or manually refresh
   - Verify metrics updated:
     - Tasks In Progress: decreased by 1 (one completed)
     - Blocked Tasks: increased by 1
     - Active Tickets: may change
   - Check "Blocked Tasks Alert" section shows newly blocked task

5. Verify dashboard accuracy:

```sql
-- Calculate actual metrics
SELECT
  COUNT(DISTINCT stt.service_ticket_id) as active_tickets,
  COUNT(CASE WHEN stt.status = 'in_progress' THEN 1 END) as tasks_in_progress,
  COUNT(CASE WHEN stt.status = 'blocked' THEN 1 END) as blocked_tasks
FROM service_ticket_tasks stt
JOIN service_tickets st ON st.id = stt.service_ticket_id
WHERE st.status IN ('pending', 'in_progress');
```

6. Compare dashboard display with SQL results

**Expected Result:**
- ✅ Dashboard updates automatically (or on manual refresh)
- ✅ Metrics reflect changes made by technicians
- ✅ Tasks In Progress count accurate
- ✅ Blocked Tasks count accurate
- ✅ Blocked Tasks Alert section shows new blocked task
- ✅ No stale data displayed
- ✅ Real-time (or near-real-time) updates

**Actual Result:**
- [ ] PASS [ ] FAIL

**Metrics Comparison:**
| Metric | Before | After | SQL Actual | Match? |
|--------|--------|-------|------------|--------|
| Active Tickets | ___ | ___ | ___ | [ ] |
| Tasks In Progress | ___ | ___ | ___ | [ ] |
| Blocked Tasks | ___ | ___ | ___ | [ ] |

**Auto-Refresh:**
- Dashboard auto-refreshes: [ ] YES [ ] NO
- Refresh interval: ___ seconds
- Manual refresh works: [ ] YES [ ] NO

**Evidence:**
- Screenshot before changes: _____________
- Screenshot after changes: _____________
- SQL verification: _____________

**Notes:**

---

## Concurrency Test Summary

| Test ID | Test Name | Status | Issues Found |
|---------|-----------|--------|--------------|
| CONC-1.1 | Two Technicians Different Tickets | [ ] PASS [ ] FAIL | |
| CONC-1.2 | Two Users Same Customer | [ ] PASS [ ] FAIL | |
| CONC-1.3 | Multiple Public Requests | [ ] PASS [ ] FAIL | |
| CONC-1.4 | Dashboard Real-Time Updates | [ ] PASS [ ] FAIL | |

**Total Tests:** 4
**Tests Passed:** ___ / 4
**Pass Rate:** ___%
**Pass Criteria:** 70%+ (3+ tests must pass)

---

## Concurrency Issues Identified

**Race Conditions:**

**Data Conflicts:**

**Transaction Failures:**

**Stale Data:**

**Recommendations:**

---

## Final Assessment

**Overall Pass Rate:** ___% (Target: 70%+)

**Result:** [ ] APPROVED [ ] REJECTED

**Concurrency Handling:** [ ] GOOD [ ] NEEDS IMPROVEMENT

**Production Readiness:** [ ] READY [ ] NOT READY

**Recommendations:**

---

## Sign-Off

**Tester:** _______________ Date: _______________
**Technical Lead:** _______________ Date: _______________
**Approval:** [ ] PASS - Concurrency acceptable [ ] FAIL - Issues must be addressed

---

**Next Steps:**
- If PASS: Complete all test execution, prepare final report
- If FAIL: Investigate concurrency issues, implement fixes, retest

**References:**
- Test Plan: docs/TEST_PLAN.md
- Master Tracker: docs/qa/test-execution/MASTER-TEST-EXECUTION-TRACKER.md

---

**Notes on Concurrency:**
- Local development may not fully replicate production concurrency
- Consider load testing with tools like k6 or Artillery for production validation
- Monitor production for race conditions and deadlocks
- Implement optimistic locking where appropriate
- Use database transactions correctly
