# Security Testing Checklist - EPIC-01 Phase 2

**Priority:** P0 - CRITICAL
**Pass Criteria:** 100% pass rate (NO FAILURES ALLOWED)
**Estimated Time:** 3-4 hours
**Total Tests:** 12

**⚠️ CRITICAL:** All security tests must pass. Any failure is a DEPLOYMENT BLOCKER.

---

## Pre-Test Setup

**Test Environment:**
- [ ] Application running: http://localhost:3025
- [ ] Supabase Studio accessible: http://localhost:54323
- [ ] Browser DevTools open (Network, Console tabs)
- [ ] Test accounts ready (Admin, Manager, Technician, Reception)
- [ ] SQL client connected to database

**Test Data:**
- [ ] Fresh database seed applied
- [ ] Test tickets created
- [ ] Test customers created
- [ ] Test templates created

---

## Test Category 1: Row Level Security (RLS) Policies

**Tests:** 5
**Priority:** CRITICAL
**Pass Criteria:** 100% (5/5 must pass)

### SEC-1.1: Admin Role - Full Access to All Tables
**Objective:** Verify admin can access all records in all Phase 2 tables

**Test Steps:**
1. Login as Admin (admin@example.com)
2. Open Supabase Studio → SQL Editor
3. Execute the following queries:

```sql
-- Test 1: task_templates table
SELECT COUNT(*) FROM task_templates;
-- Expected: Returns count (no error)

-- Test 2: service_ticket_tasks table
SELECT COUNT(*) FROM service_ticket_tasks;
-- Expected: Returns count (no error)

-- Test 3: warehouses table
SELECT COUNT(*) FROM warehouses;
-- Expected: Returns count (no error)

-- Test 4: physical_products table
SELECT COUNT(*) FROM physical_products;
-- Expected: Returns count (no error)

-- Test 5: rma_batches table
SELECT COUNT(*) FROM rma_batches;
-- Expected: Returns count (no error)
```

4. Navigate to `/workflows/templates` in app
5. Verify templates visible and editable
6. Navigate to `/warehouses`
7. Verify warehouses visible and editable

**Expected Result:**
- ✅ All SQL queries return results (no RLS errors)
- ✅ All UI pages accessible
- ✅ Can create/edit/delete records

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot: _____________
- SQL output: _____________

**Notes:**

---

### SEC-1.2: Manager Role - Read-Only Access to Templates
**Objective:** Verify manager cannot modify task templates

**Test Steps:**
1. Login as Manager (manager@example.com)
2. Navigate to `/workflows/templates`
3. Try to click "New Template" button
4. Try to edit existing template
5. Open Supabase Studio SQL Editor (as manager role)
6. Execute:

```sql
-- Attempt to create template (should fail)
INSERT INTO task_templates (name, service_type, enforce_sequence)
VALUES ('Test Template', 'warranty', true);
-- Expected: RLS policy error

-- Attempt to update template (should fail)
UPDATE task_templates SET name = 'Modified' WHERE id = (SELECT id FROM task_templates LIMIT 1);
-- Expected: RLS policy error
```

**Expected Result:**
- ✅ UI prevents template creation (button disabled or not visible)
- ✅ UI prevents template editing (read-only mode)
- ✅ SQL INSERT fails with RLS policy error
- ✅ SQL UPDATE fails with RLS policy error

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot UI: _____________
- SQL error message: _____________

**Notes:**

---

### SEC-1.3: Technician Role - Can Only See Own Tasks
**Objective:** Verify technicians can only access tasks assigned to them

**Test Steps:**
1. Create 2 test tickets with tasks
2. Assign tasks on Ticket #1 to technician@example.com
3. Assign tasks on Ticket #2 to different user
4. Login as Technician (technician@example.com)
5. Navigate to `/my-tasks`
6. Verify only tasks from Ticket #1 are visible
7. Open Supabase Studio SQL Editor
8. Execute:

```sql
-- Should only see own tasks
SELECT COUNT(*) FROM service_ticket_tasks WHERE assigned_to = auth.uid();
-- Expected: Returns count of own tasks only

-- Try to access all tasks (should be filtered by RLS)
SELECT COUNT(*) FROM service_ticket_tasks;
-- Expected: Same count as above (RLS filters automatically)
```

**Expected Result:**
- ✅ My Tasks page shows only assigned tasks
- ✅ Cannot see tasks assigned to others
- ✅ SQL queries automatically filtered by RLS
- ✅ Cannot manually query other users' tasks

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot My Tasks page: _____________
- SQL output: _____________
- Task count verification: Own: ___ Total visible: ___

**Notes:**

---

### SEC-1.4: Reception Role - Cannot Access Workflow Features
**Objective:** Verify reception cannot access task workflow pages

**Test Steps:**
1. Login as Reception (reception@example.com)
2. Try to navigate to `/workflows/templates`
3. Try to navigate to `/my-tasks`
4. Check sidebar navigation
5. Open Supabase Studio SQL Editor
6. Execute:

```sql
-- Try to access task templates (should fail or return empty)
SELECT COUNT(*) FROM task_templates;
-- Expected: RLS prevents access or returns 0

-- Try to access service_ticket_tasks
SELECT COUNT(*) FROM service_ticket_tasks;
-- Expected: RLS prevents access or returns 0
```

**Expected Result:**
- ✅ `/workflows/templates` returns 403 Forbidden or redirects
- ✅ `/my-tasks` returns 403 Forbidden or redirects
- ✅ Sidebar does not show "Workflows" menu
- ✅ SQL queries blocked by RLS or return 0 results

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot navigation attempt: _____________
- SQL error: _____________

**Notes:**

---

### SEC-1.5: Unauthenticated Access - RLS Blocks All Internal Tables
**Objective:** Verify anonymous users cannot access internal data

**Test Steps:**
1. Logout from application
2. Open Supabase Studio (or use anonymous API call)
3. Execute:

```sql
-- Try to access task templates (should fail)
SELECT * FROM task_templates;
-- Expected: RLS error or authentication required

-- Try to access service tickets (should fail)
SELECT * FROM service_tickets;
-- Expected: RLS error or authentication required

-- Try to access warehouses (should fail)
SELECT * FROM warehouses;
-- Expected: RLS error or authentication required
```

4. Try to access `/dashboard` without login
5. Try to access `/workflows/templates` without login

**Expected Result:**
- ✅ All SQL queries return RLS policy error
- ✅ Dashboard redirects to login
- ✅ Workflows page redirects to login
- ✅ No internal data exposed to anonymous users

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- SQL errors: _____________
- Redirect behavior: _____________

**Notes:**

---

## Test Category 2: Input Validation & XSS Prevention

**Tests:** 2
**Priority:** CRITICAL
**Pass Criteria:** 100% (2/2 must pass)

### SEC-2.1: XSS Prevention - Template Name Field
**Objective:** Verify template name field sanitizes malicious scripts

**Test Steps:**
1. Login as Admin
2. Navigate to `/workflows/templates`
3. Click "New Template"
4. Enter the following in "Template Name" field:

```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
```

5. Fill other required fields normally
6. Click "Create Template"
7. Navigate back to template list
8. Check if template name displays correctly
9. Open browser DevTools Console
10. Check for XSS alert execution

**Expected Result:**
- ✅ No JavaScript alert executes
- ✅ Script tags are escaped/sanitized in display
- ✅ Template saves with escaped content
- ✅ No errors in console related to XSS

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot template list: _____________
- Console log: _____________
- HTML source inspection: _____________

**Notes:**

---

### SEC-2.2: XSS Prevention - Service Request Description
**Objective:** Verify public portal sanitizes user input

**Test Steps:**
1. Open public portal: `/service-request`
2. Fill form with XSS payloads in description:

```html
<script>alert('XSS')</script>
<iframe src="javascript:alert('XSS')"></iframe>
<body onload=alert('XSS')>
javascript:alert('XSS')
<img src=x onerror=alert(document.cookie)>
```

3. Submit form
4. Get tracking token
5. Navigate to `/service-request/track`
6. Enter tracking token
7. Check if malicious scripts execute
8. Login as Reception
9. Navigate to `/dashboard/service-requests`
10. View the submitted request
11. Check if scripts execute in admin view

**Expected Result:**
- ✅ No JavaScript alert executes on tracking page
- ✅ No JavaScript alert executes in admin view
- ✅ Malicious code is escaped/sanitized
- ✅ No cookies or sensitive data exposed
- ✅ Content displays as plain text

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot tracking page: _____________
- Screenshot admin view: _____________
- HTML source: _____________

**Notes:**

---

## Test Category 3: SQL Injection Prevention

**Tests:** 1
**Priority:** CRITICAL
**Pass Criteria:** 100% (1/1 must pass)

### SEC-3.1: SQL Injection - Search and Filter Inputs
**Objective:** Verify application prevents SQL injection attacks

**Test Steps:**
1. Login as Admin
2. Test SQL injection in various search/filter fields:

**Template Search:**
- Navigate to `/workflows/templates`
- Enter in search field: `'; DROP TABLE task_templates; --`
- Submit search
- Verify table still exists

**Ticket Search:**
- Navigate to `/tickets`
- Enter in search field: `' OR '1'='1`
- Submit search
- Verify only authorized results returned

**Customer Search:**
- Navigate to `/customers`
- Enter in search field: `admin' --`
- Submit search
- Check results

**RMA Batch Filter:**
- Navigate to `/dashboard/inventory/rma`
- Try filter with: `' UNION SELECT * FROM profiles --`
- Submit filter

3. Check database integrity:

```sql
-- Verify critical tables still exist
SELECT COUNT(*) FROM task_templates;
SELECT COUNT(*) FROM service_tickets;
SELECT COUNT(*) FROM profiles;
-- Expected: All return counts (not dropped)
```

4. Check application logs for SQL errors

**Expected Result:**
- ✅ No tables dropped or modified
- ✅ Search returns safe, expected results
- ✅ Malicious SQL not executed
- ✅ No SQL syntax errors in application logs
- ✅ tRPC/Prisma parameterization prevents injection

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshots of search attempts: _____________
- Database integrity check: _____________
- Application logs: _____________

**Notes:**

---

## Test Category 4: CSRF Protection

**Tests:** 1
**Priority:** CRITICAL
**Pass Criteria:** 100% (1/1 must pass)

### SEC-4.1: CSRF Token Validation on State-Changing Operations
**Objective:** Verify CSRF protection on mutations

**Test Steps:**
1. Login as Admin
2. Open Browser DevTools → Network tab
3. Navigate to `/workflows/templates`
4. Create a new template
5. Capture the request in Network tab
6. Copy the request as cURL
7. Logout from application
8. Open a new incognito window
9. Try to replay the captured request using cURL or Postman
10. Check if operation succeeds without valid session

**Alternative test (if tRPC protects automatically):**
1. Create an external HTML file with form:

```html
<html>
  <body>
    <form action="http://localhost:3025/api/trpc/workflow.template.create" method="POST">
      <input name="name" value="Malicious Template">
      <input type="submit" value="Submit">
    </form>
  </body>
</html>
```

2. Open file in browser (different origin)
3. Submit form
4. Check if template created

**Expected Result:**
- ✅ Replayed request fails (401 Unauthorized or 403 Forbidden)
- ✅ Cross-origin form submission blocked
- ✅ No malicious template created
- ✅ Supabase session validation prevents CSRF

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Network request replay result: _____________
- CORS error (if applicable): _____________

**Notes:**

---

## Test Category 5: Rate Limiting

**Tests:** 2
**Priority:** HIGH
**Pass Criteria:** 100% (2/2 must pass)

### SEC-5.1: Public Portal Rate Limiting (10 requests/hour/IP)
**Objective:** Verify public service request portal enforces rate limiting

**Test Steps:**
1. Clear any existing rate limit state (restart if needed)
2. Open `/service-request` in browser
3. Submit 11 service requests in rapid succession (same IP, different data)
4. Observe response on 11th request
5. Check for rate limit error
6. Wait 1 hour
7. Try submitting again
8. Verify request succeeds after cooldown

**Expected Result:**
- ✅ First 10 requests succeed
- ✅ 11th request fails with rate limit error (429 Too Many Requests)
- ✅ Error message: "Rate limit exceeded. Maximum 10 requests per hour per IP."
- ✅ After 1 hour cooldown, requests succeed again
- ✅ Rate limit tracking in database (if applicable)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Metrics:**
- Requests succeeded before limit: ___
- Request that triggered limit: ___
- Error code received: ___
- Cooldown verified: [ ] Yes [ ] No

**Evidence:**
- Screenshot rate limit error: _____________
- Network response: _____________

**Notes:**

---

### SEC-5.2: Email Rate Limiting (100 emails/24h/customer)
**Objective:** Verify email system enforces rate limiting per customer

**Test Steps:**
1. Login as Admin
2. Create test customer: test-rate-limit@example.com
3. Create 101 test tickets for this customer in rapid succession
4. Check email_notifications table:

```sql
SELECT
  recipient,
  COUNT(*) as email_count,
  MAX(created_at) as last_email
FROM email_notifications
WHERE recipient = 'test-rate-limit@example.com'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY recipient;
-- Expected: Count should be ≤ 100
```

5. Check if rate limit prevents 101st email
6. Check logs for rate limit warning

**Expected Result:**
- ✅ Maximum 100 emails sent to customer in 24h period
- ✅ 101st email blocked with rate limit
- ✅ Rate limit logged in email_notifications table (status='rate_limited')
- ✅ No email sent beyond limit

**Actual Result:**
- [ ] PASS [ ] FAIL

**Metrics:**
- Total emails sent: ___
- Emails blocked by rate limit: ___
- Rate limit status in DB: [ ] Verified [ ] Not Found

**Evidence:**
- SQL query result: _____________
- Email log screenshot: _____________

**Notes:**

---

## Test Category 6: Session Management

**Tests:** 1
**Priority:** HIGH
**Pass Criteria:** 100% (1/1 must pass)

### SEC-6.1: Session Expiration and Cleanup
**Objective:** Verify sessions expire correctly and cannot be reused

**Test Steps:**
1. Login as Admin
2. Open Browser DevTools → Application → Cookies
3. Note the session cookie value
4. Logout
5. Try to manually set the old cookie value
6. Navigate to `/dashboard`
7. Check if access is denied

**Alternative test:**
1. Login as Admin
2. Copy authentication token (if visible in local storage/cookies)
3. Wait for session timeout (or manually invalidate in Supabase)
4. Try to use expired token to access protected route
5. Verify access denied

**Expected Result:**
- ✅ After logout, session cookie invalidated
- ✅ Old session cannot be reused
- ✅ Expired sessions redirect to login
- ✅ No sensitive data in cookies/local storage after logout
- ✅ Supabase session properly cleared

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Cookie inspection: _____________
- Access denied screenshot: _____________

**Notes:**

---

## Security Test Summary

| Test ID | Test Name | Priority | Result | Issues Found |
|---------|-----------|----------|--------|--------------|
| SEC-1.1 | Admin Full Access | CRITICAL | [ ] PASS [ ] FAIL | |
| SEC-1.2 | Manager Read-Only | CRITICAL | [ ] PASS [ ] FAIL | |
| SEC-1.3 | Technician Own Tasks | CRITICAL | [ ] PASS [ ] FAIL | |
| SEC-1.4 | Reception No Workflow | CRITICAL | [ ] PASS [ ] FAIL | |
| SEC-1.5 | Unauthenticated Block | CRITICAL | [ ] PASS [ ] FAIL | |
| SEC-2.1 | XSS - Template Name | CRITICAL | [ ] PASS [ ] FAIL | |
| SEC-2.2 | XSS - Service Request | CRITICAL | [ ] PASS [ ] FAIL | |
| SEC-3.1 | SQL Injection | CRITICAL | [ ] PASS [ ] FAIL | |
| SEC-4.1 | CSRF Protection | CRITICAL | [ ] PASS [ ] FAIL | |
| SEC-5.1 | Public Portal Rate Limit | HIGH | [ ] PASS [ ] FAIL | |
| SEC-5.2 | Email Rate Limit | HIGH | [ ] PASS [ ] FAIL | |
| SEC-6.1 | Session Management | HIGH | [ ] PASS [ ] FAIL | |

**Total Tests:** 12
**Passed:** ___ / 12
**Failed:** ___ / 12
**Pass Rate:** ___%

---

## Final Security Assessment

**Pass Criteria:** 100% pass rate (12/12 tests must pass)

**Result:** [ ] APPROVED [ ] REJECTED

**Critical Failures:** ___ (MUST BE ZERO)

**Security Concerns:**

**Recommendations:**

---

## Sign-Off

**Tester:** _______________ Date: _______________
**Security Reviewer:** _______________ Date: _______________
**Approval:** [ ] PASS - Ready for deployment [ ] FAIL - Security issues must be fixed

**⚠️ DEPLOYMENT BLOCKER:** Any security test failure blocks deployment until fixed and retested.

---

**Next Steps:**
- If ALL PASS: Proceed to Feature Acceptance Testing
- If ANY FAIL: Log critical bugs, fix immediately, retest all security tests

**References:**
- Quality Gate: docs/qa/gates/epic-01-phase2-quality-gate.yaml
- Test Plan: docs/TEST_PLAN.md (Security Testing section)
- Master Tracker: docs/qa/test-execution/MASTER-TEST-EXECUTION-TRACKER.md
