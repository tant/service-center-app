# Smoke Test Procedures - Phase 2 Production Deployment

**Version:** 1.0
**Story:** 1.20 - Production Deployment and Monitoring Setup
**Epic:** EPIC-01 - Service Center Phase 2
**Last Updated:** 2025-10-24
**Target Audience:** QA Engineers, Deployment Leads, System Administrators

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Accounts](#test-accounts)
4. [Quick Smoke Test (5-10 minutes)](#quick-smoke-test-5-10-minutes)
5. [Full Smoke Test (30-45 minutes)](#full-smoke-test-30-45-minutes)
6. [Critical Test Suites](#critical-test-suites)
   - [Suite 1: Authentication](#suite-1-authentication)
   - [Suite 2: Ticket Management](#suite-2-ticket-management)
   - [Suite 3: Task Workflow](#suite-3-task-workflow)
   - [Suite 4: Public Portal](#suite-4-public-portal)
   - [Suite 5: Email Notifications](#suite-5-email-notifications)
   - [Suite 6: Warehouse Operations](#suite-6-warehouse-operations)
   - [Suite 7: Manager Dashboard](#suite-7-manager-dashboard)
   - [Suite 8: Dynamic Template Switching](#suite-8-dynamic-template-switching)
7. [Automated Smoke Test Script](#automated-smoke-test-script)
8. [Database Verification Queries](#database-verification-queries)
9. [Log Verification Procedures](#log-verification-procedures)
10. [Pass/Fail Criteria Summary](#passfail-criteria-summary)
11. [Bug Reporting Template](#bug-reporting-template)
12. [Sign-Off Checklist](#sign-off-checklist)

---

## Overview

### What Are Smoke Tests?

Smoke tests are **critical path verification tests** performed immediately after deployment to ensure the most important features work correctly before allowing users to access the system. Think of them as a "sanity check" to verify the deployment was successful.

**Purpose:**
- Verify application is accessible and responsive
- Confirm all critical workflows function end-to-end
- Detect deployment errors before users encounter them
- Provide go/no-go decision for production release

**Characteristics:**
- **Fast:** Quick to execute (5-45 minutes)
- **Shallow:** Test breadth, not depth
- **Critical:** Cover only essential features
- **Blocking:** Must pass before release

### When to Run Smoke Tests

**Required:**
- ✅ Immediately after production deployment (within 15 minutes)
- ✅ After any hotfix or patch deployment
- ✅ After database migration
- ✅ After infrastructure changes (server, DNS, SSL)

**Optional (but recommended):**
- After major configuration changes
- Before business hours after overnight deployment
- After recovering from an incident

### Test Levels

| Level | Duration | Scope | When to Use |
|-------|----------|-------|-------------|
| **Quick** | 5-10 min | Critical path only | After minor changes, hotfixes |
| **Full** | 30-45 min | All 8 test suites | After major deployment, Phase 2 release |
| **Automated** | 2-3 min | API endpoints only | Before any deployment, CI/CD |

---

## Test Environment Setup

### Pre-Test Checklist

Before starting smoke tests, verify:

- [ ] **Deployment Complete**
  - Application deployed successfully
  - No active deployment processes running
  - All containers/services running (if Docker)
  - Health check endpoint returns 200 OK

- [ ] **Access Verified**
  - Application URL accessible from test machine
  - HTTPS certificate valid (no browser warnings)
  - No DNS resolution issues
  - CDN/proxy functioning correctly

- [ ] **Database Ready**
  - All migrations applied successfully
  - Database connection pool active
  - No pending schema changes
  - Seed data present (if applicable)

- [ ] **External Services**
  - Email service configured (SendGrid, Mailgun, etc.)
  - Supabase services accessible
  - Storage buckets accessible
  - Authentication service responding

### Test Tools Setup

**Required Tools:**

1. **Web Browser**
   ```bash
   # Latest version of Chrome, Firefox, or Edge
   # Enable Developer Tools (F12)
   # Clear cache and cookies before testing
   ```

2. **API Testing Tool** (choose one)
   ```bash
   # cURL (command line)
   curl --version

   # HTTPie (user-friendly)
   http --version

   # Postman (GUI)
   # Download from postman.com
   ```

3. **Database Client** (optional, for verification)
   ```bash
   # psql (PostgreSQL command line)
   psql --version

   # Or use Supabase Studio dashboard
   ```

4. **Screenshot Tool**
   ```bash
   # For capturing test evidence
   # Built-in OS tools (Snipping Tool, Screenshot)
   # Or browser DevTools (F12 → Network tab → Screenshot)
   ```

### Environment Variables for Testing

Create a test configuration file `smoke-test-config.env`:

```bash
# Application URLs
APP_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api
PUBLIC_PORTAL_URL=https://yourdomain.com/service-request

# Test Accounts (created during setup)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<from_setup>
MANAGER_EMAIL=manager.test@yourdomain.com
MANAGER_PASSWORD=<test_password>
TECH_EMAIL=tech.test@yourdomain.com
TECH_PASSWORD=<test_password>
RECEPTION_EMAIL=reception.test@yourdomain.com
RECEPTION_PASSWORD=<test_password>

# Database (for verification queries)
DB_CONNECTION_STRING=<supabase_connection_string>

# Email (for notification testing)
TEST_EMAIL=smoketest@yourdomain.com
```

### Test Data Requirements

Before running full smoke test, ensure:

- [ ] At least 1 task template exists
- [ ] At least 1 warehouse exists (virtual warehouses auto-created)
- [ ] At least 1 customer exists for testing
- [ ] At least 1 product exists in catalog
- [ ] At least 1 part exists in inventory with stock > 5

**Note:** If starting from clean database, run Quick Setup Script (see Automated section).

---

## Test Accounts

### Creating Test Accounts

Test accounts should be created **immediately after initial /setup** is complete.

#### Admin Account

```bash
# Created during /setup
Email: admin@yourdomain.com
Password: <ADMIN_PASSWORD from .env>
Role: Admin
```

#### Manager Test Account

**Via UI (Admin logged in):**
1. Navigate to `/team`
2. Click "Add Team Member"
3. Fill in:
   - Email: `manager.test@yourdomain.com`
   - Name: `Test Manager`
   - Role: `Manager`
   - Password: Generate strong password
4. Save credentials to test config

**Via Supabase Dashboard:**
```sql
-- Insert into auth.users (via Supabase Dashboard → Authentication → Add User)
-- Then assign role
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '<user_id_from_auth>',
  'manager.test@yourdomain.com',
  'Test Manager',
  'manager'
);
```

#### Technician Test Account

**Via UI (Admin logged in):**
1. Navigate to `/team`
2. Click "Add Team Member"
3. Fill in:
   - Email: `tech.test@yourdomain.com`
   - Name: `Test Technician`
   - Role: `Technician`
   - Password: Generate strong password
4. Save credentials

#### Reception Test Account

**Via UI (Admin logged in):**
1. Navigate to `/team`
2. Click "Add Team Member"
3. Fill in:
   - Email: `reception.test@yourdomain.com`
   - Name: `Test Reception`
   - Role: `Reception`
   - Password: Generate strong password
4. Save credentials

### Test Account Access Matrix

| Feature | Admin | Manager | Technician | Reception |
|---------|-------|---------|------------|-----------|
| Login | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ Full | ✅ Full | ✅ Limited | ✅ Basic |
| Create Ticket | ✅ | ✅ | ✅ | ✅ |
| Edit Ticket | ✅ | ✅ | ✅ Own | ✅ Own |
| Delete Ticket | ✅ | ✅ | ❌ | ❌ |
| Manage Customers | ✅ | ✅ | ✅ View | ✅ |
| Manage Products | ✅ | ✅ | ❌ | ❌ |
| Manage Parts | ✅ | ✅ | ❌ | ❌ |
| Manage Warehouse | ✅ | ✅ | ❌ | ❌ |
| Manage Team | ✅ | ❌ | ❌ | ❌ |
| View Tasks | ✅ | ✅ | ✅ Assigned | ❌ |
| Email Admin Log | ✅ | ✅ | ❌ | ❌ |

---

## Quick Smoke Test (5-10 minutes)

**Purpose:** Rapid verification of critical path after deployment
**Duration:** 5-10 minutes
**When to Use:** After hotfixes, minor changes, or as initial check before full test

### Test Steps

#### 1. Application Accessibility (1 minute)

**Test:**
```bash
# From terminal
curl -I https://yourdomain.com

# Expected output:
# HTTP/2 200
# content-type: text/html
```

**In Browser:**
1. Navigate to `https://yourdomain.com`
2. Verify page loads without errors
3. Check browser console (F12) for no red errors

**Pass Criteria:**
- ✅ HTTP 200 status
- ✅ Page renders in < 3 seconds
- ✅ No console errors
- ✅ HTTPS certificate valid

---

#### 2. Authentication (2 minutes)

**Test:**
1. Open `https://yourdomain.com/login`
2. Enter admin credentials
3. Click "Sign In"
4. Verify redirect to `/dashboard`

**Pass Criteria:**
- ✅ Login form displays correctly
- ✅ Credentials accepted
- ✅ Redirect to dashboard after login
- ✅ User name displayed in header

**Screenshot:** Capture successful dashboard view

---

#### 3. Create Service Ticket (3 minutes)

**Test:**
1. From dashboard, click "New Ticket" or navigate to `/tickets/add`
2. Step 1: Select existing customer (or create test customer)
3. Step 2: Fill in device details:
   - Device: "iPhone 13"
   - Issue: "Screen cracked - smoke test"
   - Service Type: "Standard Repair"
4. Step 3: Assign to Test Technician
5. Submit ticket

**Pass Criteria:**
- ✅ Multi-step wizard displays
- ✅ Customer selection works
- ✅ Ticket number auto-generated (SV-YYYY-NNN format)
- ✅ Redirect to ticket detail page
- ✅ Ticket status = "pending"

**Database Verification:**
```sql
SELECT ticket_number, status, customer_id, device_issue
FROM service_tickets
WHERE device_issue LIKE '%smoke test%'
ORDER BY created_at DESC
LIMIT 1;
```

**Screenshot:** Capture ticket detail page with auto-generated ticket number

---

#### 4. Task Generation (1 minute)

**Test:**
1. On ticket detail page, scroll to "Tasks" section
2. Verify tasks automatically generated from template
3. Check task sequence numbers

**Pass Criteria:**
- ✅ Tasks section visible
- ✅ At least 1 task generated
- ✅ Tasks have sequence numbers
- ✅ All tasks show status "pending"

**Database Verification:**
```sql
SELECT task_number, description, status, sequence_number
FROM ticket_tasks
WHERE service_ticket_id = '<ticket_id_from_step_3>'
ORDER BY sequence_number;
```

---

#### 5. Public Portal Accessibility (2 minutes)

**Test:**
1. Open new incognito/private browser window
2. Navigate to `https://yourdomain.com/service-request`
3. Verify form displays without authentication
4. Fill in test request (don't submit)

**Pass Criteria:**
- ✅ Public portal accessible without login
- ✅ Form displays correctly
- ✅ Required fields marked with asterisk
- ✅ Submit button enabled

**Screenshot:** Capture public portal form

---

### Quick Test Sign-Off

**Test Completed By:** ___________________
**Date/Time:** ___________________
**Result:** [ ] PASS [ ] FAIL
**Issues Found:** ___________________

**If FAIL:** Stop deployment, investigate issues, do not proceed to full test.
**If PASS:** Proceed to full smoke test or release to users (depending on deployment plan).

---

## Full Smoke Test (30-45 minutes)

**Purpose:** Comprehensive verification of all Phase 2 features
**Duration:** 30-45 minutes
**When to Use:** After major deployment (Phase 2 release), significant changes

### Test Execution Order

Execute all 8 Critical Test Suites in order:

1. **Suite 1: Authentication** (5 min) → All roles can log in
2. **Suite 2: Ticket Management** (7 min) → Core ticket workflow
3. **Suite 3: Task Workflow** (6 min) → Task execution and dependencies
4. **Suite 4: Public Portal** (5 min) → Customer-facing service requests
5. **Suite 5: Email Notifications** (5 min) → Email delivery and admin log
6. **Suite 6: Warehouse Operations** (6 min) → Product tracking and RMA
7. **Suite 7: Manager Dashboard** (4 min) → Analytics and metrics
8. **Suite 8: Dynamic Template Switching** (4 min) → Mid-service flexibility

**Total Time:** ~42 minutes (with buffer for screenshots and notes)

---

## Critical Test Suites

---

## Suite 1: Authentication

**Objective:** Verify all user roles can authenticate and access appropriate pages
**Duration:** 5 minutes
**Priority:** Critical (blocking)

### Test 1.1: Admin Login

**Steps:**
1. Open browser in normal mode
2. Navigate to `https://yourdomain.com/login`
3. Enter admin credentials:
   - Email: `admin@yourdomain.com`
   - Password: `<ADMIN_PASSWORD>`
4. Click "Sign In"
5. Verify redirect to `/dashboard`
6. Check user menu shows "Admin" badge
7. Navigate to `/team` (admin-only page)

**Expected Results:**
- ✅ Login successful within 2 seconds
- ✅ Dashboard displays with all analytics
- ✅ User menu shows name and "Admin" role
- ✅ Team management page accessible

**Database Verification:**
```sql
SELECT email, full_name, role
FROM profiles
WHERE email = 'admin@yourdomain.com';

-- Expected: role = 'admin'
```

**Screenshots:**
- Dashboard with admin role visible
- Team management page

**Troubleshooting:**
- **Login fails:** Check credentials in .env, verify user exists in auth.users
- **No redirect:** Check browser console for errors, verify session storage
- **Team page 403:** Verify RLS policies applied correctly

---

### Test 1.2: Manager Login

**Steps:**
1. Log out from admin account (or open new incognito window)
2. Navigate to `https://yourdomain.com/login`
3. Enter manager credentials
4. Verify redirect to `/dashboard`
5. Check manager has access to:
   - `/products` (should work)
   - `/parts` (should work)
   - `/team` (should block with 403 or redirect)

**Expected Results:**
- ✅ Login successful
- ✅ Dashboard displays
- ✅ Products and Parts pages accessible
- ✅ Team page blocked (403 Forbidden or redirect)

**Pass Criteria:**
- Manager can access manager-level features
- Manager CANNOT access admin-only features

**Screenshot:** Dashboard showing manager role

---

### Test 1.3: Technician Login

**Steps:**
1. Log out, open new incognito window
2. Login as technician
3. Navigate to `/dashboard` → verify access
4. Navigate to `/products` → should block or show read-only
5. Click "My Tasks" or navigate to task view

**Expected Results:**
- ✅ Login successful
- ✅ Dashboard displays (limited view)
- ✅ Products page blocked or read-only
- ✅ My Tasks page accessible

**Database Verification:**
```sql
SELECT COUNT(*) as assigned_tasks
FROM ticket_tasks
WHERE assigned_to = (
  SELECT id FROM profiles WHERE email = 'tech.test@yourdomain.com'
);
```

**Screenshot:** My Tasks page with assigned tasks

---

### Test 1.4: Reception Login

**Steps:**
1. Log out, open new incognito window
2. Login as reception
3. Verify dashboard access (basic view)
4. Navigate to `/tickets/add` → should work
5. Navigate to `/customers` → should work
6. Navigate to `/products` → should block

**Expected Results:**
- ✅ Login successful
- ✅ Can create tickets
- ✅ Can manage customers
- ✅ Cannot manage products/parts

**Screenshot:** Reception dashboard view

---

### Test 1.5: Session Persistence

**Steps:**
1. Login as admin
2. Refresh page (F5)
3. Close tab, reopen application URL
4. Verify still logged in
5. Wait 2 minutes, perform action
6. Verify session still active

**Expected Results:**
- ✅ Session persists across page refresh
- ✅ Session persists after tab close/reopen
- ✅ Session remains active during idle time

---

### Test 1.6: Logout

**Steps:**
1. Click user menu in header
2. Click "Logout" or "Sign Out"
3. Verify redirect to `/login`
4. Try to access `/dashboard` directly
5. Verify redirect back to login

**Expected Results:**
- ✅ Logout successful
- ✅ Redirect to login page
- ✅ Cannot access protected routes after logout
- ✅ Redirect to login when accessing protected route

---

### Suite 1 Pass/Fail Criteria

**Pass:** All 4 roles can log in AND role-based access control works correctly
**Fail:** Any role cannot log in OR unauthorized access to restricted pages

**Time Estimate:** 5 minutes
**Completed:** [ ] Yes [ ] No
**Result:** [ ] PASS [ ] FAIL
**Issues:** ___________________

---

## Suite 2: Ticket Management

**Objective:** Verify core ticket creation, assignment, update, and part management
**Duration:** 7 minutes
**Priority:** Critical (blocking)

### Test 2.1: Create New Ticket with Customer Lookup

**Steps:**
1. Login as reception or admin
2. Navigate to `/tickets/add`
3. Step 1 - Customer Selection:
   - Enter existing customer phone: `<test_phone>`
   - Verify customer auto-detected
   - OR click "New Customer" and create:
     - Name: "Smoke Test Customer"
     - Phone: "0901234567"
     - Email: "smoketest@example.com"
4. Click "Continue"

**Expected Results:**
- ✅ Customer search works
- ✅ Existing customer detected automatically
- ✅ New customer creation works
- ✅ Validation prevents duplicate phone numbers

**Database Verification:**
```sql
SELECT id, name, phone, email
FROM customers
WHERE phone = '0901234567';
```

---

### Test 2.2: Complete Ticket Creation

**Steps:**
1. Step 2 - Device & Issue:
   - Device: "Samsung Galaxy S23"
   - Issue Description: "Water damage, won't turn on"
   - Service Type: "Standard Repair"
   - Priority: "High"
   - Warranty Type: "In Warranty"
2. Step 3 - Assignment:
   - Assign to: Select test technician
   - Service Fee: 500000
   - Diagnosis Fee: 100000
3. Submit ticket
4. Verify redirect to ticket detail page

**Expected Results:**
- ✅ All fields save correctly
- ✅ Ticket number auto-generated (format: SV-2025-XXX)
- ✅ Ticket status = "pending"
- ✅ Total cost calculated (service + diagnosis)
- ✅ Tasks automatically generated

**Database Verification:**
```sql
SELECT
  ticket_number,
  status,
  device,
  device_issue,
  priority,
  warranty_type,
  service_fee,
  diagnosis_fee,
  total_cost,
  assigned_to
FROM service_tickets
WHERE device_issue LIKE '%Water damage%'
ORDER BY created_at DESC
LIMIT 1;
```

**Screenshot:** Ticket detail page showing all fields correctly

---

### Test 2.3: Update Ticket Status

**Steps:**
1. On ticket detail page, find status dropdown
2. Change status from "pending" to "in_progress"
3. Confirm change
4. Verify:
   - Status updated immediately
   - Auto-comment generated: "Status changed from pending to in_progress"
   - `started_at` timestamp set

**Expected Results:**
- ✅ Status updates instantly
- ✅ Auto-comment added to comments section
- ✅ Status change logged in database
- ✅ Cannot change back to "pending" (one-way flow enforced)

**Database Verification:**
```sql
-- Check ticket status and timestamp
SELECT status, started_at, updated_at
FROM service_tickets
WHERE ticket_number = '<ticket_number_from_2.2>';

-- Check auto-comment created
SELECT comment, is_auto, created_at
FROM service_ticket_comments
WHERE service_ticket_id = '<ticket_id>'
  AND comment LIKE '%Status changed%'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test 2.4: Add Parts to Ticket

**Steps:**
1. On ticket detail page, scroll to "Parts Used" section
2. Click "Add Part"
3. Select part from dropdown (e.g., "Screen Replacement - Samsung S23")
4. Enter quantity: 2
5. Verify:
   - Unit cost auto-populated from parts inventory
   - Total cost calculated (quantity × unit_cost)
6. Save part

**Expected Results:**
- ✅ Part added to ticket
- ✅ Part total calculated correctly
- ✅ Ticket total_cost updated (service + diagnosis + parts)
- ✅ Part stock decreased by quantity used

**Database Verification:**
```sql
-- Check part added to ticket
SELECT part_id, quantity, unit_cost, total_cost
FROM service_ticket_parts
WHERE service_ticket_id = '<ticket_id>';

-- Check stock decreased
SELECT name, stock_quantity
FROM parts
WHERE id = '<part_id>';

-- Check ticket total updated
SELECT total_cost, parts_total
FROM service_tickets
WHERE id = '<ticket_id>';
```

**Screenshot:** Parts section showing added part with costs

---

### Test 2.5: Update Ticket Assignment

**Steps:**
1. On ticket detail page, click "Edit" or change assignment
2. Select different technician from dropdown
3. Save change
4. Verify auto-comment: "Assigned to changed from [Old Name] to [New Name]"

**Expected Results:**
- ✅ Assignment updated
- ✅ Auto-comment logged
- ✅ New technician can see ticket in their task list

**Database Verification:**
```sql
SELECT assigned_to, updated_at
FROM service_tickets
WHERE id = '<ticket_id>';

SELECT comment
FROM service_ticket_comments
WHERE service_ticket_id = '<ticket_id>'
  AND comment LIKE '%Assigned to changed%'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test 2.6: Complete Ticket

**Steps:**
1. Change ticket status to "completed"
2. Verify:
   - Status updated
   - `completed_at` timestamp set
   - Cannot edit ticket anymore (terminal state)
3. Try to change status back to "in_progress"
4. Verify change blocked

**Expected Results:**
- ✅ Ticket marked as completed
- ✅ Timestamp recorded
- ✅ Terminal state enforced (no further edits allowed)
- ✅ Status cannot be reversed

**Database Verification:**
```sql
SELECT status, completed_at
FROM service_tickets
WHERE id = '<ticket_id>';
```

**Screenshot:** Completed ticket showing "completed" badge and disabled edit controls

---

### Suite 2 Pass/Fail Criteria

**Pass:** Can create ticket → add parts → update status → complete
**Fail:** Any core ticket operation fails OR data inconsistency detected

**Time Estimate:** 7 minutes
**Completed:** [ ] Yes [ ] No
**Result:** [ ] PASS [ ] FAIL
**Issues:** ___________________

---

## Suite 3: Task Workflow

**Objective:** Verify task execution, sequence enforcement, and My Tasks page
**Duration:** 6 minutes
**Priority:** Critical (Phase 2 core feature)

### Test 3.1: View My Tasks (Technician)

**Steps:**
1. Login as test technician
2. Navigate to "My Tasks" page (should be in navigation menu)
3. Verify tasks from ticket created in Suite 2 appear
4. Check task display shows:
   - Task number and description
   - Ticket number (linked)
   - Status badge
   - Sequence number
   - Start/Complete actions

**Expected Results:**
- ✅ My Tasks page displays
- ✅ Only tasks assigned to logged-in technician shown
- ✅ Tasks grouped by ticket
- ✅ Task details complete

**Database Verification:**
```sql
SELECT
  tt.task_number,
  tt.description,
  tt.status,
  tt.sequence_number,
  st.ticket_number
FROM ticket_tasks tt
JOIN service_tickets st ON tt.service_ticket_id = st.id
WHERE tt.assigned_to = (
  SELECT id FROM profiles WHERE email = 'tech.test@yourdomain.com'
)
ORDER BY tt.sequence_number;
```

**Screenshot:** My Tasks page with task list

---

### Test 3.2: Start Task (First in Sequence)

**Steps:**
1. Find first task (sequence_number = 1)
2. Verify status = "pending"
3. Click "Start Task" button
4. Verify:
   - Status changes to "in_progress"
   - `started_at` timestamp set
   - Button changes to "Complete Task"

**Expected Results:**
- ✅ Task status updated to "in_progress"
- ✅ Timestamp recorded
- ✅ UI updates immediately

**Database Verification:**
```sql
SELECT task_number, status, started_at
FROM ticket_tasks
WHERE task_number = '<task_number>'
  AND sequence_number = 1;
```

---

### Test 3.3: Complete Task with Notes

**Steps:**
1. On same task, click "Complete Task"
2. Enter completion notes (if modal/form appears):
   - Notes: "Task completed successfully - smoke test"
3. Submit
4. Verify:
   - Status changes to "completed"
   - `completed_at` timestamp set
   - Notes saved

**Expected Results:**
- ✅ Task marked as completed
- ✅ Timestamp recorded
- ✅ Notes attached to task
- ✅ Next task in sequence becomes available

**Database Verification:**
```sql
SELECT
  task_number,
  status,
  completed_at,
  completion_notes
FROM ticket_tasks
WHERE task_number = '<task_number>';
```

**Screenshot:** Completed task with notes

---

### Test 3.4: Task Sequence Enforcement (Strict Mode)

**Steps:**
1. Find second task in sequence (sequence_number = 2)
2. Verify task was "pending" but now became "pending" (available)
3. Try to start third task (sequence_number = 3) directly
4. Verify:
   - Task 3 is blocked (button disabled OR error message)
   - Cannot start tasks out of sequence

**Expected Results:**
- ✅ Strict sequence enforced (if template has `enforce_sequence = strict`)
- ✅ Task 2 available after Task 1 completed
- ✅ Task 3 blocked until Task 2 completed
- ✅ Clear visual indication of blocked tasks

**Database Verification:**
```sql
-- Check template enforcement mode
SELECT enforce_sequence
FROM task_templates
WHERE id = (
  SELECT task_template_id
  FROM service_tickets
  WHERE id = '<ticket_id>'
);

-- Check task dependencies
SELECT
  tt.task_number,
  tt.status,
  tt.sequence_number,
  td.depends_on_task_id
FROM ticket_tasks tt
LEFT JOIN task_dependencies td ON tt.id = td.task_id
WHERE tt.service_ticket_id = '<ticket_id>'
ORDER BY tt.sequence_number;
```

---

### Test 3.5: Complete Remaining Tasks in Sequence

**Steps:**
1. Start and complete Task 2
2. Start and complete Task 3 (if exists)
3. Verify all tasks reach "completed" status
4. Check ticket status updates automatically (if configured)

**Expected Results:**
- ✅ All tasks can be completed in order
- ✅ No sequence violations
- ✅ All completion timestamps recorded

**Database Verification:**
```sql
SELECT
  task_number,
  status,
  completed_at
FROM ticket_tasks
WHERE service_ticket_id = '<ticket_id>'
ORDER BY sequence_number;

-- All should show status = 'completed'
```

---

### Test 3.6: Task Progress Tracking

**Steps:**
1. Navigate to ticket detail page
2. Find "Tasks" or "Task Progress" section
3. Verify progress indicator shows:
   - Total tasks
   - Completed tasks
   - Progress percentage
   - Visual progress bar

**Expected Results:**
- ✅ Progress calculation correct (e.g., 3/3 = 100%)
- ✅ Visual indicator matches actual progress
- ✅ Real-time updates as tasks completed

**Screenshot:** Task progress section showing 100% completion

---

### Suite 3 Pass/Fail Criteria

**Pass:** Tasks can be started → completed in sequence → progress tracked accurately
**Fail:** Sequence enforcement broken OR tasks cannot be completed OR progress calculation wrong

**Time Estimate:** 6 minutes
**Completed:** [ ] Yes [ ] No
**Result:** [ ] PASS [ ] FAIL
**Issues:** ___________________

---

## Suite 4: Public Portal

**Objective:** Verify customer-facing service request portal and ticket conversion
**Duration:** 5 minutes
**Priority:** High (customer-facing feature)

### Test 4.1: Access Public Service Request Portal

**Steps:**
1. Open new incognito/private browser window
2. Navigate to `https://yourdomain.com/service-request`
3. Verify page loads WITHOUT requiring login
4. Check form fields present:
   - Customer Name
   - Phone Number
   - Email Address
   - Device Type
   - Issue Description
   - Submit button

**Expected Results:**
- ✅ Public portal accessible anonymously
- ✅ No authentication required
- ✅ Form displays correctly
- ✅ Responsive design works on mobile viewport

**Screenshot:** Public service request form

**Troubleshooting:**
- **404 Not Found:** Check route exists in app routing
- **Redirects to login:** Check public route configuration
- **Form doesn't load:** Check browser console for JavaScript errors

---

### Test 4.2: Submit Service Request

**Steps:**
1. Fill in service request form:
   - Name: "Public Test Customer"
   - Phone: "0909876543"
   - Email: "publictest@example.com"
   - Device: "Dell Laptop"
   - Issue: "Won't power on, fan spinning loudly"
2. Click "Submit Request"
3. Verify:
   - Success message displays
   - Tracking token shown (format: SR-YYYYMMDD-XXXX)
   - Instructions to track request displayed

**Expected Results:**
- ✅ Form submission successful
- ✅ Tracking token generated and displayed
- ✅ Email sent to customer (with tracking link)
- ✅ Request stored in database

**Database Verification:**
```sql
SELECT
  tracking_token,
  customer_name,
  phone,
  email,
  device_type,
  issue_description,
  status,
  created_at
FROM service_requests
WHERE phone = '0909876543'
ORDER BY created_at DESC
LIMIT 1;
```

**Screenshot:** Success message with tracking token

---

### Test 4.3: Track Request Status (Public)

**Steps:**
1. Still in incognito window, navigate to tracking page:
   - URL: `https://yourdomain.com/track?token=<tracking_token>`
   - OR use "Track Request" form with token
2. Enter tracking token from step 4.2
3. Click "Track"
4. Verify request status page displays:
   - Customer name
   - Device and issue
   - Current status (should be "submitted")
   - Submission date

**Expected Results:**
- ✅ Tracking page accessible without login
- ✅ Token validation works
- ✅ Request details displayed accurately
- ✅ Status shown clearly

**Database Verification:**
```sql
SELECT tracking_token, status, updated_at
FROM service_requests
WHERE tracking_token = '<token_from_4.2>';
```

**Screenshot:** Request tracking page showing status

---

### Test 4.4: Convert Request to Ticket (Staff)

**Steps:**
1. Login as reception, manager, or admin
2. Navigate to service requests management page (likely under menu or dashboard)
3. Find the request created in Test 4.2
4. Click "Convert to Ticket" or similar action
5. Verify conversion form pre-filled with request data
6. Complete conversion (assign technician, add fees)
7. Submit

**Expected Results:**
- ✅ Staff can view pending requests
- ✅ Request data pre-populated in ticket form
- ✅ Ticket created successfully
- ✅ Request status changes to "converted"
- ✅ Request linked to ticket

**Database Verification:**
```sql
-- Check request marked as converted
SELECT status, converted_to_ticket_id
FROM service_requests
WHERE tracking_token = '<token_from_4.2>';

-- Check ticket created
SELECT ticket_number, customer_id, device, device_issue
FROM service_tickets
WHERE id = (
  SELECT converted_to_ticket_id
  FROM service_requests
  WHERE tracking_token = '<token_from_4.2>'
);
```

**Screenshot:** Converted ticket showing link to original request

---

### Test 4.5: Track Request After Conversion

**Steps:**
1. Return to incognito window
2. Refresh tracking page OR re-enter tracking token
3. Verify updated status shows:
   - Status: "Converted to Ticket"
   - Ticket number displayed (linked)
   - Option to track ticket status

**Expected Results:**
- ✅ Status updated to "converted"
- ✅ Ticket number visible to customer
- ✅ Customer can track ticket progress

**Screenshot:** Tracking page showing converted status

---

### Test 4.6: Rate Limiting (Optional, if time permits)

**Steps:**
1. Open browser DevTools → Network tab
2. Submit 10+ service requests rapidly (same IP)
3. Verify rate limiting kicks in:
   - After 10 requests (or configured limit)
   - Error message: "Too many requests, please try again later"
   - HTTP 429 status code

**Expected Results:**
- ✅ Rate limiting active (prevents abuse)
- ✅ Clear error message to user
- ✅ Resets after time window (e.g., 1 hour)

**Database Verification:**
```sql
-- Check rate limit logs (if implemented)
SELECT ip_address, request_count, last_request_at
FROM rate_limit_log
WHERE ip_address = '<your_test_ip>';
```

---

### Suite 4 Pass/Fail Criteria

**Pass:** Can submit request → receive token → track status → convert to ticket
**Fail:** Public portal inaccessible OR request submission fails OR tracking broken

**Time Estimate:** 5 minutes
**Completed:** [ ] Yes [ ] No
**Result:** [ ] PASS [ ] FAIL
**Issues:** ___________________

---

## Suite 5: Email Notifications

**Objective:** Verify email system sends notifications and admin can view logs
**Duration:** 5 minutes
**Priority:** Medium-High (customer communication)

### Test 5.1: Service Request Submitted Email

**Steps:**
1. From Suite 4, verify email sent after request submission
2. Check test email inbox (publictest@example.com)
3. Verify email received with:
   - Subject: "Service Request Received"
   - Tracking token included
   - Tracking link (clickable)
   - Unsubscribe link at bottom

**Expected Results:**
- ✅ Email delivered within 2 minutes
- ✅ Content formatted correctly (HTML)
- ✅ Tracking link works when clicked
- ✅ Unsubscribe link present

**Email Content Example:**
```
Subject: Service Request Received - [Tracking Token]

Hello Public Test Customer,

Your service request has been received.

Device: Dell Laptop
Issue: Won't power on, fan spinning loudly

Tracking Token: SR-20251024-0001

You can track your request status here:
[Track My Request]

---
To stop receiving emails, click here: [Unsubscribe]
```

**Troubleshooting:**
- **Email not received:** Check spam folder, verify SMTP configured
- **No tracking link:** Check email template has token variable
- **Broken links:** Verify SITE_URL environment variable correct

---

### Test 5.2: Ticket Created Email (from Conversion)

**Steps:**
1. After converting request to ticket (Suite 4.4)
2. Check customer email inbox
3. Verify email received:
   - Subject: "Service Ticket Created"
   - Ticket number included
   - Technician assigned
   - Estimated timeline (if applicable)

**Expected Results:**
- ✅ Email sent on ticket creation
- ✅ Ticket number visible
- ✅ Customer can identify their ticket

**Database Verification:**
```sql
SELECT
  recipient_email,
  subject,
  status,
  sent_at,
  delivered_at
FROM email_notifications
WHERE recipient_email = 'publictest@example.com'
  AND subject LIKE '%Ticket Created%'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test 5.3: Ticket Status Change Email

**Steps:**
1. Login as staff
2. Change ticket status (e.g., pending → in_progress)
3. Wait 1-2 minutes
4. Check customer email inbox
5. Verify status update email received

**Expected Results:**
- ✅ Email triggered on status change
- ✅ New status clearly communicated
- ✅ Customer understands progress

**Database Verification:**
```sql
SELECT COUNT(*) as status_emails
FROM email_notifications
WHERE recipient_email = 'publictest@example.com'
  AND subject LIKE '%Status Update%';
```

---

### Test 5.4: View Email Admin Log

**Steps:**
1. Login as admin or manager
2. Navigate to email log page (check menu or settings)
3. Verify log displays:
   - All emails sent
   - Recipient addresses
   - Subject lines
   - Sent timestamp
   - Delivery status (sent/failed/pending)
   - Filter by date range
   - Search by recipient

**Expected Results:**
- ✅ Admin log page accessible
- ✅ All test emails from Suite 5.1-5.3 visible
- ✅ Delivery status accurate
- ✅ Can filter and search logs

**Database Verification:**
```sql
SELECT
  recipient_email,
  subject,
  status,
  sent_at,
  delivered_at,
  error_message
FROM email_notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

**Screenshot:** Email admin log showing recent emails

---

### Test 5.5: Unsubscribe Functionality

**Steps:**
1. From test email received in 5.1
2. Click "Unsubscribe" link at bottom
3. Verify:
   - Redirect to unsubscribe confirmation page
   - Success message: "You have been unsubscribed"
   - Customer email marked as unsubscribed in database
4. Trigger another email event (e.g., status change)
5. Verify NO email sent to unsubscribed address

**Expected Results:**
- ✅ Unsubscribe link works
- ✅ Confirmation page displays
- ✅ Email preference updated in database
- ✅ Future emails suppressed for unsubscribed users

**Database Verification:**
```sql
-- Check unsubscribe status
SELECT phone, email_unsubscribed, unsubscribed_at
FROM customers
WHERE email = 'publictest@example.com';

-- Verify no emails sent after unsubscribe
SELECT COUNT(*) as emails_after_unsub
FROM email_notifications
WHERE recipient_email = 'publictest@example.com'
  AND created_at > (
    SELECT unsubscribed_at FROM customers WHERE email = 'publictest@example.com'
  );

-- Should return 0
```

**Screenshot:** Unsubscribe confirmation page

---

### Test 5.6: Email Rate Limiting (Optional)

**Steps:**
1. Check admin log for customer from tests
2. Verify rate limit applied:
   - Max emails per customer per 24 hours (e.g., 100)
   - No duplicate emails sent within short time window
3. In database, check rate limit enforced

**Expected Results:**
- ✅ Rate limit prevents email bombing
- ✅ Duplicate suppression works
- ✅ Admin can see rate limit blocks in logs

**Database Verification:**
```sql
SELECT
  recipient_email,
  COUNT(*) as email_count,
  MIN(sent_at) as first_email,
  MAX(sent_at) as last_email
FROM email_notifications
WHERE recipient_email = 'publictest@example.com'
  AND sent_at > NOW() - INTERVAL '24 hours'
GROUP BY recipient_email;
```

---

### Suite 5 Pass/Fail Criteria

**Pass:** Emails sent on events → admin log visible → unsubscribe works
**Fail:** Emails not delivered OR admin log missing OR unsubscribe broken

**Time Estimate:** 5 minutes
**Completed:** [ ] Yes [ ] No
**Result:** [ ] PASS [ ] FAIL
**Issues:** ___________________

---

## Suite 6: Warehouse Operations

**Objective:** Verify warehouse management, product tracking, stock levels, and RMA
**Duration:** 6 minutes
**Priority:** High (Phase 2 core feature)

### Test 6.1: View Warehouse List

**Steps:**
1. Login as admin or manager
2. Navigate to warehouse management page
3. Verify warehouses displayed:
   - Main warehouse (physical)
   - Virtual warehouses (auto-created):
     - Customer Location
     - Technician Workspace
     - Supplier Warehouse
     - Disposal/Scrap
4. Check warehouse types clearly indicated

**Expected Results:**
- ✅ Warehouse page accessible
- ✅ Virtual warehouses present (auto-seeded)
- ✅ Main warehouse exists
- ✅ Warehouse types (physical/virtual) shown

**Database Verification:**
```sql
SELECT
  name,
  warehouse_type,
  is_virtual,
  location
FROM warehouses
ORDER BY is_virtual, name;

-- Expected: At least 5 warehouses (1 main + 4 virtual)
```

**Screenshot:** Warehouse list showing all warehouses

---

### Test 6.2: Register Physical Product

**Steps:**
1. Navigate to warehouse → physical products section
2. Click "Register Product"
3. Fill in product registration form:
   - Select Product: Choose from product catalog
   - Serial Number: "TEST-SN-12345678"
   - Warehouse: Select main warehouse
   - Condition: "New"
   - Purchase Date: Today's date
   - Warranty Expiry: 1 year from today
4. Submit registration

**Expected Results:**
- ✅ Product registered successfully
- ✅ Serial number unique (validation prevents duplicates)
- ✅ Product linked to warehouse
- ✅ Initial stock movement recorded

**Database Verification:**
```sql
-- Check physical product created
SELECT
  product_id,
  serial_number,
  warehouse_id,
  condition,
  warranty_expires_at
FROM physical_products
WHERE serial_number = 'TEST-SN-12345678';

-- Check stock movement recorded
SELECT
  from_warehouse_id,
  to_warehouse_id,
  movement_type,
  created_at
FROM stock_movements
WHERE physical_product_id = (
  SELECT id FROM physical_products WHERE serial_number = 'TEST-SN-12345678'
)
ORDER BY created_at DESC
LIMIT 1;
```

**Screenshot:** Registered product detail page

---

### Test 6.3: Serial Number Verification During Ticket Creation

**Steps:**
1. Create new ticket (as reception or admin)
2. In device information section:
   - Enter Serial Number: "TEST-SN-12345678"
   - Verify system validates serial number
   - Check warranty status displayed:
     - "In Warranty" if within warranty period
     - Warranty expiry date shown
3. Complete ticket creation

**Expected Results:**
- ✅ Serial number validated against physical_products table
- ✅ Warranty status calculated correctly
- ✅ Product auto-linked to ticket if serial found
- ✅ Warning shown if serial not found or expired warranty

**Database Verification:**
```sql
-- Check ticket linked to physical product
SELECT
  st.ticket_number,
  st.serial_number,
  st.warranty_type,
  pp.warranty_expires_at
FROM service_tickets st
LEFT JOIN physical_products pp ON st.serial_number = pp.serial_number
WHERE st.serial_number = 'TEST-SN-12345678';
```

---

### Test 6.4: View Stock Levels

**Steps:**
1. Navigate to warehouse → stock levels view
2. Verify materialized view displays:
   - Product name
   - Current warehouse
   - Quantity in stock
   - Product condition
   - Last movement date
3. Check low stock alerts (if any products below threshold)

**Expected Results:**
- ✅ Stock levels view accessible
- ✅ Real-time stock data displayed
- ✅ Products grouped by warehouse
- ✅ Low stock indicators work

**Database Verification:**
```sql
-- Query materialized view
SELECT
  product_id,
  warehouse_id,
  stock_quantity,
  last_updated
FROM warehouse_stock_levels
WHERE warehouse_id = (
  SELECT id FROM warehouses WHERE name = 'Main Warehouse' LIMIT 1
);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW warehouse_stock_levels;
```

**Screenshot:** Stock levels dashboard

---

### Test 6.5: Create RMA Batch

**Steps:**
1. Navigate to warehouse → RMA management
2. Click "Create RMA Batch"
3. Fill in RMA form:
   - Supplier: "Samsung Electronics"
   - RMA Reason: "Defective screens - smoke test batch"
   - Add products to batch:
     - Select registered product from step 6.2
     - Enter quantity: 1
4. Submit RMA batch
5. Verify:
   - RMA batch number auto-generated (format: RMA-YYYY-NNN)
   - Batch status = "pending"
   - Products moved to "Supplier Warehouse" virtually

**Expected Results:**
- ✅ RMA batch created successfully
- ✅ Batch number auto-generated
- ✅ Products added to batch
- ✅ Stock movement triggered (main → supplier warehouse)

**Database Verification:**
```sql
-- Check RMA batch created
SELECT
  batch_number,
  supplier_name,
  status,
  total_items,
  created_at
FROM rma_batches
WHERE supplier_name = 'Samsung Electronics'
ORDER BY created_at DESC
LIMIT 1;

-- Check products in batch
SELECT
  rma_batch_id,
  physical_product_id,
  quantity,
  reason
FROM rma_batch_items
WHERE rma_batch_id = (
  SELECT id FROM rma_batches WHERE batch_number = '<batch_number_from_above>'
);

-- Check stock movement to supplier warehouse
SELECT
  from_warehouse_id,
  to_warehouse_id,
  movement_type,
  created_at
FROM stock_movements
WHERE physical_product_id = (
  SELECT id FROM physical_products WHERE serial_number = 'TEST-SN-12345678'
)
  AND movement_type = 'rma'
ORDER BY created_at DESC
LIMIT 1;
```

**Screenshot:** RMA batch detail page showing batch number and products

---

### Test 6.6: Update RMA Batch Status

**Steps:**
1. On RMA batch detail page
2. Change status from "pending" to "shipped"
3. Verify status updated
4. Check audit trail logged
5. Try changing to "received" then "closed"

**Expected Results:**
- ✅ Status transitions allowed: pending → shipped → received → closed
- ✅ Status changes logged
- ✅ Closed RMA batch cannot be modified

**Database Verification:**
```sql
SELECT
  batch_number,
  status,
  shipped_at,
  received_at,
  closed_at,
  updated_at
FROM rma_batches
WHERE batch_number = '<batch_number_from_6.5>';
```

---

### Suite 6 Pass/Fail Criteria

**Pass:** Can register product → verify serial → view stock → create RMA batch
**Fail:** Product registration fails OR stock levels inaccurate OR RMA creation broken

**Time Estimate:** 6 minutes
**Completed:** [ ] Yes [ ] No
**Result:** [ ] PASS [ ] FAIL
**Issues:** ___________________

---

## Suite 7: Manager Dashboard

**Objective:** Verify manager analytics, task progress metrics, workload distribution
**Duration:** 4 minutes
**Priority:** Medium (manager visibility feature)

### Test 7.1: Access Manager Dashboard

**Steps:**
1. Login as manager or admin
2. Navigate to dashboard
3. Verify manager-specific widgets displayed:
   - Task Progress Overview
   - Workload Distribution by Technician
   - Blocked Tasks Alert
   - Ticket Status Breakdown
   - Revenue Metrics

**Expected Results:**
- ✅ Manager dashboard loads
- ✅ All metric cards visible
- ✅ Data displays correctly (no "Loading..." stuck state)
- ✅ Charts render properly

**Screenshot:** Full manager dashboard view

---

### Test 7.2: Task Progress Metrics

**Steps:**
1. Locate "Task Progress" widget/card
2. Verify metrics shown:
   - Total tasks (all tickets)
   - Completed tasks
   - In-progress tasks
   - Pending tasks
   - Completion rate percentage
3. Compare metrics to database count

**Expected Results:**
- ✅ Task counts accurate
- ✅ Completion rate calculated correctly
- ✅ Progress bar/chart visual matches numbers

**Database Verification:**
```sql
-- Count tasks by status
SELECT
  status,
  COUNT(*) as count
FROM ticket_tasks
GROUP BY status;

-- Calculate completion rate
SELECT
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100,
    2
  ) as completion_rate
FROM ticket_tasks;
```

**Screenshot:** Task progress widget showing metrics

---

### Test 7.3: Workload Distribution

**Steps:**
1. Locate "Workload Distribution" chart
2. Verify chart displays:
   - All technicians listed
   - Number of assigned tasks per technician
   - Visual representation (bar chart or similar)
   - Balanced/imbalanced indicators
3. Click on technician (if interactive)
4. Verify drill-down to technician's tasks

**Expected Results:**
- ✅ All technicians shown
- ✅ Task counts accurate per technician
- ✅ Visual chart renders correctly
- ✅ Interactive features work (if implemented)

**Database Verification:**
```sql
SELECT
  p.full_name as technician,
  COUNT(tt.id) as assigned_tasks,
  COUNT(tt.id) FILTER (WHERE tt.status = 'completed') as completed_tasks,
  COUNT(tt.id) FILTER (WHERE tt.status = 'in_progress') as in_progress_tasks
FROM profiles p
LEFT JOIN ticket_tasks tt ON p.id = tt.assigned_to
WHERE p.role IN ('technician', 'admin', 'manager')
GROUP BY p.id, p.full_name
ORDER BY assigned_tasks DESC;
```

**Screenshot:** Workload distribution chart

---

### Test 7.4: Blocked Tasks Alert

**Steps:**
1. Locate "Blocked Tasks" or "Attention Required" section
2. Verify alerts shown for:
   - Tasks waiting on dependencies
   - Tasks with long in-progress time (> 24 hours)
   - Tasks with missing information
3. Click on blocked task
4. Verify navigation to task detail with blocker reason

**Expected Results:**
- ✅ Blocked tasks identified correctly
- ✅ Reason for blockage displayed
- ✅ Manager can take action (reassign, unblock, etc.)
- ✅ Count accurate

**Database Verification:**
```sql
-- Find blocked tasks (waiting on dependencies)
SELECT
  tt.task_number,
  tt.description,
  tt.status,
  st.ticket_number,
  td.depends_on_task_id
FROM ticket_tasks tt
JOIN service_tickets st ON tt.service_ticket_id = st.id
LEFT JOIN task_dependencies td ON tt.id = td.task_id
WHERE tt.status = 'pending'
  AND td.depends_on_task_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM ticket_tasks dep
    WHERE dep.id = td.depends_on_task_id
      AND dep.status != 'completed'
  );

-- Find tasks in-progress too long
SELECT
  task_number,
  description,
  status,
  started_at,
  EXTRACT(EPOCH FROM (NOW() - started_at))/3600 as hours_in_progress
FROM ticket_tasks
WHERE status = 'in_progress'
  AND started_at < NOW() - INTERVAL '24 hours'
ORDER BY started_at;
```

**Screenshot:** Blocked tasks alert section

---

### Test 7.5: Ticket Status Breakdown

**Steps:**
1. Locate ticket status chart/widget
2. Verify breakdown shows:
   - Pending tickets count
   - In-progress tickets count
   - Completed tickets count
   - Cancelled tickets count
   - Percentage distribution
3. Click on status (if interactive)
4. Verify filter to show only that status

**Expected Results:**
- ✅ All ticket statuses represented
- ✅ Counts accurate
- ✅ Visual chart (pie/donut chart) displays correctly
- ✅ Interactive filtering works

**Database Verification:**
```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND((COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM service_tickets)) * 100, 2) as percentage
FROM service_tickets
GROUP BY status
ORDER BY count DESC;
```

**Screenshot:** Ticket status breakdown chart

---

### Test 7.6: Real-Time Updates (Optional)

**Steps:**
1. Keep dashboard open in one browser tab
2. In another tab/window, complete a task or update ticket status
3. Return to dashboard
4. Verify metrics updated (either immediately or after refresh)

**Expected Results:**
- ✅ Dashboard shows updated data after refresh
- ✅ (If real-time implemented) Dashboard updates without refresh

---

### Suite 7 Pass/Fail Criteria

**Pass:** Dashboard displays accurate metrics → workload visible → blocked tasks identified
**Fail:** Dashboard doesn't load OR metrics inaccurate OR missing critical widgets

**Time Estimate:** 4 minutes
**Completed:** [ ] Yes [ ] No
**Result:** [ ] PASS [ ] FAIL
**Issues:** ___________________

---

## Suite 8: Dynamic Template Switching

**Objective:** Verify task template can be changed mid-service while preserving progress
**Duration:** 4 minutes
**Priority:** Medium (flexibility feature)

### Test 8.1: Create Ticket with Initial Template

**Steps:**
1. Login as admin or manager
2. Create new ticket with specific task template:
   - Customer: Select or create test customer
   - Device: "MacBook Pro 2023"
   - Issue: "Battery replacement needed"
   - Service Type: "Battery Replacement" (should use specific template)
3. Verify tasks generated from template
4. Note task list (take screenshot)

**Expected Results:**
- ✅ Ticket created with template assigned
- ✅ Tasks auto-generated from template
- ✅ All template tasks present

**Database Verification:**
```sql
-- Check ticket template assignment
SELECT
  ticket_number,
  task_template_id,
  status
FROM service_tickets
WHERE device LIKE '%MacBook Pro 2023%'
ORDER BY created_at DESC
LIMIT 1;

-- Check tasks generated
SELECT
  task_number,
  description,
  sequence_number,
  status
FROM ticket_tasks
WHERE service_ticket_id = '<ticket_id_from_above>'
ORDER BY sequence_number;
```

**Screenshot:** Initial task list from template A

---

### Test 8.2: Complete Some Tasks

**Steps:**
1. Start and complete first 2 tasks in sequence
2. Leave remaining tasks pending
3. Verify completion recorded

**Expected Results:**
- ✅ 2 tasks marked as completed
- ✅ Remaining tasks still pending

**Database Verification:**
```sql
SELECT
  task_number,
  description,
  status,
  completed_at
FROM ticket_tasks
WHERE service_ticket_id = '<ticket_id>'
ORDER BY sequence_number;
```

---

### Test 8.3: Switch Task Template Mid-Service

**Steps:**
1. On ticket detail page, find template selector or "Change Template" button
2. Select different template (e.g., "Screen Replacement" instead of "Battery Replacement")
3. Confirm template switch
4. Review warning message (if any):
   - "Completed tasks will be preserved"
   - "New tasks will be added"
   - "Pending incomplete tasks may be removed"
5. Confirm switch

**Expected Results:**
- ✅ Template switch UI accessible
- ✅ Warning message displayed
- ✅ User must confirm action
- ✅ Switch executes successfully

**Screenshot:** Template switch confirmation modal

---

### Test 8.4: Verify Task Preservation

**Steps:**
1. After template switch, review task list
2. Verify:
   - Completed tasks (from step 8.2) still present
   - Completed tasks marked as "preserved" or similar indicator
   - New tasks from new template added
   - Old pending tasks removed (or marked as obsolete)
3. Check task sequence numbers updated

**Expected Results:**
- ✅ Completed tasks preserved (NOT deleted)
- ✅ New template tasks added
- ✅ Old incomplete tasks removed or marked
- ✅ Task progress not lost

**Database Verification:**
```sql
-- Check template updated
SELECT
  ticket_number,
  task_template_id,
  updated_at
FROM service_tickets
WHERE id = '<ticket_id>';

-- Check task list after switch
SELECT
  task_number,
  description,
  status,
  sequence_number,
  is_preserved  -- If column exists
FROM ticket_tasks
WHERE service_ticket_id = '<ticket_id>'
ORDER BY sequence_number;

-- Verify completed tasks still exist
SELECT COUNT(*) as completed_tasks_preserved
FROM ticket_tasks
WHERE service_ticket_id = '<ticket_id>'
  AND status = 'completed';
```

**Screenshot:** Task list after template switch showing preserved tasks

---

### Test 8.5: Verify Audit Trail

**Steps:**
1. Navigate to ticket comments or audit log section
2. Find template switch event logged
3. Verify log entry contains:
   - Timestamp of switch
   - User who performed switch
   - Old template name
   - New template name
   - Number of tasks preserved

**Expected Results:**
- ✅ Template switch logged automatically
- ✅ Audit trail complete with all details
- ✅ Change attribution correct

**Database Verification:**
```sql
-- Check audit log in comments
SELECT
  comment,
  is_auto,
  created_by,
  created_at
FROM service_ticket_comments
WHERE service_ticket_id = '<ticket_id>'
  AND comment LIKE '%template%'
ORDER BY created_at DESC
LIMIT 1;

-- Or check dedicated audit table if exists
SELECT
  action,
  old_value,
  new_value,
  user_id,
  created_at
FROM audit_logs
WHERE entity_type = 'service_ticket'
  AND entity_id = '<ticket_id>'
  AND action = 'template_switch'
ORDER BY created_at DESC
LIMIT 1;
```

**Screenshot:** Audit log showing template switch event

---

### Test 8.6: Complete New Template Tasks

**Steps:**
1. Continue task execution with new template
2. Start and complete new tasks
3. Verify workflow continues normally
4. Complete all tasks
5. Verify ticket can be completed

**Expected Results:**
- ✅ New tasks function correctly
- ✅ Sequence enforcement works
- ✅ Task completion tracked
- ✅ Ticket can reach completed state

**Database Verification:**
```sql
-- Check all tasks completed
SELECT
  status,
  COUNT(*) as count
FROM ticket_tasks
WHERE service_ticket_id = '<ticket_id>'
GROUP BY status;

-- Check ticket completable
SELECT status, completed_at
FROM service_tickets
WHERE id = '<ticket_id>';
```

---

### Suite 8 Pass/Fail Criteria

**Pass:** Can switch template mid-service → completed tasks preserved → new tasks added → workflow continues
**Fail:** Template switch breaks workflow OR completed tasks lost OR audit trail missing

**Time Estimate:** 4 minutes
**Completed:** [ ] Yes [ ] No
**Result:** [ ] PASS [ ] FAIL
**Issues:** ___________________

---

## Automated Smoke Test Script

**Purpose:** Run API-level smoke tests automatically before manual testing
**Duration:** 2-3 minutes
**Use Case:** CI/CD pipeline, pre-deployment verification

### Prerequisites

```bash
# Install dependencies
sudo apt-get install -y curl jq

# Or use httpie for better output
pip3 install httpie
```

### Smoke Test Script

Create file: `scripts/smoke-test.sh`

```bash
#!/bin/bash
#
# Automated Smoke Test Script
# Tests critical API endpoints to verify deployment
#

set -e

# Configuration
APP_URL="${APP_URL:-https://yourdomain.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@yourdomain.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

test_passed() {
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
}

test_failed() {
    echo -e "${RED}✗ FAIL${NC} $1"
    ((TESTS_FAILED++))
}

# Start testing
log_info "Starting smoke tests for: $APP_URL"
echo ""

# Test 1: Health Check
log_test "Test 1: Health Check Endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health")
if [ "$HTTP_CODE" == "200" ]; then
    test_passed
else
    test_failed "Health check returned HTTP $HTTP_CODE"
fi

# Test 2: Homepage Accessibility
log_test "Test 2: Homepage Accessibility"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "307" ]; then
    test_passed
else
    test_failed "Homepage returned HTTP $HTTP_CODE"
fi

# Test 3: Login Page
log_test "Test 3: Login Page Loads"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/login")
if [ "$HTTP_CODE" == "200" ]; then
    test_passed
else
    test_failed "Login page returned HTTP $HTTP_CODE"
fi

# Test 4: Public Service Request Portal
log_test "Test 4: Public Service Request Portal"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/service-request")
if [ "$HTTP_CODE" == "200" ]; then
    test_passed
else
    test_failed "Service request portal returned HTTP $HTTP_CODE"
fi

# Test 5: tRPC API Endpoint
log_test "Test 5: tRPC API Responds"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/trpc/admin.isSetupComplete")
if [ "$HTTP_CODE" == "200" ]; then
    test_passed
else
    test_failed "tRPC API returned HTTP $HTTP_CODE (may be expected before setup)"
fi

# Test 6: Static Assets
log_test "Test 6: Static Assets Serve"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/favicon.ico")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "304" ]; then
    test_passed
else
    test_failed "Static assets returned HTTP $HTTP_CODE"
fi

# Test 7: SSL Certificate (if HTTPS)
if [[ "$APP_URL" == https://* ]]; then
    log_test "Test 7: SSL Certificate Valid"
    DOMAIN="${APP_URL#https://}"
    CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)

    if [ -n "$CERT_EXPIRY" ]; then
        test_passed
        log_info "Certificate expires: $CERT_EXPIRY"
    else
        test_failed "SSL certificate validation failed"
    fi
fi

# Test 8: Database Connectivity (via API)
log_test "Test 8: Database Connectivity"
RESPONSE=$(curl -s "$APP_URL/api/trpc/admin.isSetupComplete")
if [ -n "$RESPONSE" ]; then
    test_passed
else
    test_failed "No response from database-dependent API"
fi

# Summary
echo ""
echo "========================================"
echo "Smoke Test Results"
echo "========================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "========================================"

if [ $TESTS_FAILED -eq 0 ]; then
    log_info "All smoke tests passed! ✓"
    exit 0
else
    log_error "Some smoke tests failed. Check deployment."
    exit 1
fi
```

### Usage

```bash
# Make executable
chmod +x scripts/smoke-test.sh

# Run with default URL
./scripts/smoke-test.sh

# Run with custom URL
APP_URL=https://your-production-domain.com ./scripts/smoke-test.sh

# Run in CI/CD pipeline
export APP_URL=https://staging.yourdomain.com
./scripts/smoke-test.sh || exit 1
```

### Expected Output

```
[INFO] Starting smoke tests for: https://yourdomain.com

[TEST] Test 1: Health Check Endpoint
✓ PASS
[TEST] Test 2: Homepage Accessibility
✓ PASS
[TEST] Test 3: Login Page Loads
✓ PASS
[TEST] Test 4: Public Service Request Portal
✓ PASS
[TEST] Test 5: tRPC API Responds
✓ PASS
[TEST] Test 6: Static Assets Serve
✓ PASS
[TEST] Test 7: SSL Certificate Valid
✓ PASS
[INFO] Certificate expires: Jan 15 12:00:00 2026 GMT
[TEST] Test 8: Database Connectivity
✓ PASS

========================================
Smoke Test Results
========================================
Tests Passed: 8
Tests Failed: 0
========================================
[INFO] All smoke tests passed! ✓
```

### Integration with CI/CD

**GitHub Actions Example:**

```yaml
# .github/workflows/deploy.yml
name: Deploy and Smoke Test

on:
  push:
    branches: [main]

jobs:
  deploy-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Production
        run: |
          # Your deployment commands here

      - name: Wait for Deployment
        run: sleep 30

      - name: Run Smoke Tests
        env:
          APP_URL: https://yourdomain.com
        run: |
          chmod +x scripts/smoke-test.sh
          ./scripts/smoke-test.sh

      - name: Notify on Failure
        if: failure()
        run: |
          # Send alert (Slack, email, etc.)
```

---

## Database Verification Queries

**Purpose:** Verify data integrity and business logic after smoke tests
**When to Run:** After each test suite OR at end of full smoke test

### Copy-Paste SQL Queries

#### 1. Verify All Tables Exist

```sql
-- Check all Phase 2 tables created
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'profiles',
        'customers',
        'service_tickets',
        'service_ticket_comments',
        'ticket_tasks',
        'task_templates',
        'task_template_items',
        'task_dependencies',
        'warehouses',
        'physical_products',
        'stock_movements',
        'rma_batches',
        'rma_batch_items',
        'service_requests',
        'email_notifications'
    )
ORDER BY table_name;

-- Expected: 15 rows returned
```

#### 2. Verify RLS Policies Active

```sql
-- Check Row Level Security enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename LIKE 'service_%' OR tablename LIKE 'ticket_%'
ORDER BY tablename;

-- All should show rowsecurity = true
```

#### 3. Verify Triggers Active

```sql
-- Check critical triggers exist
SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND trigger_name IN (
        'generate_ticket_number',
        'update_ticket_total',
        'log_ticket_changes',
        'generate_task_number',
        'update_task_dependencies',
        'generate_rma_batch_number'
    )
ORDER BY event_object_table, trigger_name;
```

#### 4. Verify Ticket Data Integrity

```sql
-- Check ticket calculations correct
SELECT
    ticket_number,
    service_fee,
    diagnosis_fee,
    parts_total,
    discount_amount,
    total_cost,
    -- Verify calculation
    (service_fee + diagnosis_fee + COALESCE(parts_total, 0) - COALESCE(discount_amount, 0)) as calculated_total,
    CASE
        WHEN total_cost = (service_fee + diagnosis_fee + COALESCE(parts_total, 0) - COALESCE(discount_amount, 0))
        THEN '✓ CORRECT'
        ELSE '✗ MISMATCH'
    END as validation
FROM service_tickets
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

#### 5. Verify Task Generation

```sql
-- Check tasks auto-generated for tickets
SELECT
    st.ticket_number,
    COUNT(tt.id) as tasks_generated,
    COUNT(tt.id) FILTER (WHERE tt.status = 'completed') as completed,
    COUNT(tt.id) FILTER (WHERE tt.status = 'in_progress') as in_progress,
    COUNT(tt.id) FILTER (WHERE tt.status = 'pending') as pending
FROM service_tickets st
LEFT JOIN ticket_tasks tt ON st.id = tt.service_ticket_id
WHERE st.created_at > NOW() - INTERVAL '1 hour'
GROUP BY st.id, st.ticket_number
ORDER BY st.created_at DESC;
```

#### 6. Verify Stock Movements

```sql
-- Check stock movements recorded correctly
SELECT
    sm.movement_type,
    sm.quantity,
    wf.name as from_warehouse,
    wt.name as to_warehouse,
    pp.serial_number,
    sm.created_at
FROM stock_movements sm
LEFT JOIN warehouses wf ON sm.from_warehouse_id = wf.id
LEFT JOIN warehouses wt ON sm.to_warehouse_id = wt.id
LEFT JOIN physical_products pp ON sm.physical_product_id = pp.id
WHERE sm.created_at > NOW() - INTERVAL '1 hour'
ORDER BY sm.created_at DESC
LIMIT 20;
```

#### 7. Verify Email Notifications

```sql
-- Check emails sent and delivery status
SELECT
    recipient_email,
    subject,
    status,
    sent_at,
    delivered_at,
    error_message,
    CASE
        WHEN status = 'delivered' THEN '✓ DELIVERED'
        WHEN status = 'failed' THEN '✗ FAILED'
        ELSE '⏳ PENDING'
    END as delivery_status
FROM email_notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

#### 8. Verify Service Requests

```sql
-- Check service requests and conversions
SELECT
    sr.tracking_token,
    sr.customer_name,
    sr.status,
    sr.created_at,
    st.ticket_number as converted_to_ticket,
    CASE
        WHEN sr.converted_to_ticket_id IS NOT NULL THEN '✓ CONVERTED'
        WHEN sr.status = 'submitted' THEN '⏳ PENDING'
        ELSE sr.status
    END as request_status
FROM service_requests sr
LEFT JOIN service_tickets st ON sr.converted_to_ticket_id = st.id
WHERE sr.created_at > NOW() - INTERVAL '1 hour'
ORDER BY sr.created_at DESC;
```

#### 9. Verify RMA Batches

```sql
-- Check RMA batches and items
SELECT
    rb.batch_number,
    rb.supplier_name,
    rb.status,
    rb.total_items,
    COUNT(rbi.id) as items_count,
    CASE
        WHEN rb.total_items = COUNT(rbi.id) THEN '✓ MATCH'
        ELSE '✗ MISMATCH'
    END as validation
FROM rma_batches rb
LEFT JOIN rma_batch_items rbi ON rb.id = rbi.rma_batch_id
WHERE rb.created_at > NOW() - INTERVAL '1 hour'
GROUP BY rb.id, rb.batch_number, rb.supplier_name, rb.status, rb.total_items
ORDER BY rb.created_at DESC;
```

#### 10. Verify User Roles and Permissions

```sql
-- Check all test accounts exist with correct roles
SELECT
    email,
    full_name,
    role,
    created_at,
    CASE
        WHEN role = 'admin' THEN '🔴 ADMIN'
        WHEN role = 'manager' THEN '🟡 MANAGER'
        WHEN role = 'technician' THEN '🔵 TECHNICIAN'
        WHEN role = 'reception' THEN '🟢 RECEPTION'
        ELSE '⚪ UNKNOWN'
    END as role_badge
FROM profiles
WHERE email LIKE '%test%' OR email LIKE '%admin%'
ORDER BY
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'technician' THEN 3
        WHEN 'reception' THEN 4
    END;
```

### Running Database Queries

**Via Supabase Studio:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy-paste queries
4. Click "Run" or press Cmd/Ctrl+Enter

**Via psql (self-hosted):**
```bash
# Connect to database
docker exec -it supabase-db psql -U postgres

# Paste queries and run
postgres=# \i /path/to/verification-queries.sql
```

**Via pgAdmin:**
1. Connect to database
2. Open Query Tool
3. Paste queries
4. Execute (F5)

---

## Log Verification Procedures

**Purpose:** Verify application logs for errors, warnings, and anomalies
**When to Run:** During smoke tests OR immediately after deployment

### Application Logs

#### Docker Deployment

```bash
# View real-time logs
docker compose logs -f app

# View last 100 lines
docker compose logs --tail=100 app

# Search for errors
docker compose logs app | grep -i error

# Search for specific patterns
docker compose logs app | grep "tRPC error\|Database error\|Failed to"

# Save logs to file for analysis
docker compose logs app > app-logs-$(date +%Y%m%d-%H%M%S).log
```

#### Vercel Deployment

```bash
# View logs via CLI
vercel logs

# View specific deployment logs
vercel logs --url=https://your-deployment-url.vercel.app

# Or use Vercel Dashboard:
# https://vercel.com/dashboard → Project → Logs
```

#### Self-Hosted (PM2)

```bash
# View application logs
pm2 logs service-center

# View error logs only
pm2 logs service-center --err

# View last 200 lines
pm2 logs service-center --lines 200
```

### Database Logs

#### Supabase Cloud

```bash
# Access via Supabase Dashboard:
# Database → Logs → Filter by severity

# Or query via API (requires access token)
curl -X GET \
  "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/logs" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Self-Hosted PostgreSQL

```bash
# View PostgreSQL logs
docker compose logs db | grep -i "error\|fatal\|warning"

# Check slow queries
docker exec supabase-db psql -U postgres -c "
  SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
  FROM pg_stat_statements
  WHERE mean_exec_time > 100
  ORDER BY mean_exec_time DESC
  LIMIT 20;
"

# Check database errors
docker exec supabase-db psql -U postgres -c "
  SELECT * FROM pg_stat_database_conflicts;
"
```

### Log Analysis Checklist

**Critical Errors (must be zero):**
- [ ] No database connection failures
- [ ] No authentication service errors
- [ ] No storage service errors
- [ ] No tRPC procedure crashes
- [ ] No unhandled promise rejections

**Warnings (investigate if many):**
- [ ] Slow query warnings (> 1 second)
- [ ] Rate limit warnings
- [ ] Deprecation warnings
- [ ] Memory usage warnings

**Expected Logs (should see these):**
- [ ] Server started messages
- [ ] Successful API requests (200 status)
- [ ] User login events
- [ ] Database query logs (if enabled)

### Log Patterns to Search For

#### Success Patterns

```bash
# Successful logins
grep "Login successful\|Authentication successful" app.log

# Successful ticket creation
grep "Ticket created\|ticket_number:" app.log

# Successful email delivery
grep "Email sent\|Email delivered" app.log
```

#### Error Patterns

```bash
# Database errors
grep -i "database error\|query failed\|deadlock detected" app.log

# Authentication errors
grep -i "auth error\|invalid credentials\|token expired" app.log

# API errors
grep -i "500 error\|internal server error\|unhandled exception" app.log

# Email errors
grep -i "email failed\|smtp error\|delivery failed" app.log
```

#### Performance Issues

```bash
# Slow requests (> 1 second)
grep -i "slow query\|timeout\|took [0-9][0-9][0-9][0-9]ms" app.log

# Memory warnings
grep -i "memory\|heap\|out of memory" app.log

# Connection pool exhaustion
grep -i "connection pool\|max connections\|too many connections" app.log
```

---

## Pass/Fail Criteria Summary

**Overall Deployment Result = PASS if ALL Critical Suites PASS**

### Critical Suites (Blocking)

| Suite | Status | Criteria | Impact if Failed |
|-------|--------|----------|------------------|
| **1. Authentication** | [ ] PASS [ ] FAIL | All 4 roles can log in | **BLOCKING** - Stop deployment |
| **2. Ticket Management** | [ ] PASS [ ] FAIL | Can create → update → complete ticket | **BLOCKING** - Core feature broken |
| **3. Task Workflow** | [ ] PASS [ ] FAIL | Tasks generate → execute → sequence enforced | **BLOCKING** - Phase 2 core broken |
| **4. Public Portal** | [ ] PASS [ ] FAIL | Can submit → track → convert request | **HIGH** - Customer-facing broken |
| **5. Email Notifications** | [ ] PASS [ ] FAIL | Emails sent → admin log works → unsubscribe works | **MEDIUM** - Communication broken |
| **6. Warehouse Operations** | [ ] PASS [ ] FAIL | Can register product → verify serial → create RMA | **HIGH** - Phase 2 feature broken |
| **7. Manager Dashboard** | [ ] PASS [ ] FAIL | Metrics display → data accurate | **LOW** - Visibility feature only |
| **8. Dynamic Template** | [ ] PASS [ ] FAIL | Can switch template → preserve progress | **LOW** - Flexibility feature only |

### Pass Criteria by Priority

**P0 - Critical (Must Pass):**
- ✅ Application accessible via URL
- ✅ Authentication works for all roles
- ✅ Can create and view tickets
- ✅ Database operations succeed
- ✅ No critical errors in logs

**P1 - High Priority (Should Pass):**
- ✅ Task workflow functions correctly
- ✅ Public portal accessible
- ✅ Warehouse operations work
- ✅ Email system functional

**P2 - Medium Priority (Nice to Pass):**
- ✅ Manager dashboard displays correctly
- ✅ Dynamic template switching works
- ✅ All database queries return expected results

### Failure Response Matrix

| Failure Severity | Response | Responsible | Timeline |
|------------------|----------|-------------|----------|
| **Critical (P0)** | Rollback immediately | Deployment Lead | Within 15 min |
| **High (P1)** | Fix or rollback | Development Team | Within 1 hour |
| **Medium (P2)** | Create hotfix ticket, continue deployment | Development Team | Within 24 hours |
| **Low (P3)** | Create bug ticket, no rollback | QA Team | Within 1 week |

### Decision Tree

```
Smoke Test Complete
    ↓
All P0 tests passed?
    ├── NO → ROLLBACK IMMEDIATELY
    └── YES
        ↓
    All P1 tests passed?
        ├── NO → Assess impact
        │   ├── Can workaround? → Hotfix + Continue
        │   └── Cannot workaround? → ROLLBACK
        └── YES
            ↓
        P2 tests passed?
            ├── NO → Create tickets, continue
            └── YES
                ↓
            ✅ DEPLOYMENT APPROVED
            Sign off and monitor
```

---

## Bug Reporting Template

**Use this template when reporting issues found during smoke tests**

### Bug Report Template

```markdown
# Bug Report: [Short Title]

**Reported By:** [Your Name]
**Date/Time:** [YYYY-MM-DD HH:MM]
**Environment:** [ ] Production [ ] Staging [ ] Local
**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low

---

## Summary
[Brief one-line description of the issue]

---

## Test Suite
- **Suite:** [e.g., Suite 2: Ticket Management]
- **Test Number:** [e.g., Test 2.4: Add Parts to Ticket]

---

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]

---

## Expected Behavior
[What should happen]

---

## Actual Behavior
[What actually happened]

---

## Screenshots/Evidence
[Attach screenshots, logs, or screen recordings]

---

## Database State (if applicable)
```sql
-- Query showing data inconsistency
SELECT * FROM table WHERE ...;
```

Result:
```
[Paste query result]
```

---

## Logs
```
[Paste relevant log entries]
```

---

## Browser/Environment Details
- **Browser:** [Chrome 120.0 / Firefox 121.0 / etc.]
- **OS:** [Windows 11 / macOS 14.0 / Ubuntu 22.04]
- **Screen Resolution:** [1920x1080]
- **User Role:** [Admin / Manager / Technician / Reception]

---

## Impact Assessment
- **Users Affected:** [All users / Specific role / Specific feature]
- **Business Impact:** [Critical / High / Medium / Low]
- **Workaround Available:** [ ] Yes [ ] No
- **Workaround:** [If yes, describe workaround]

---

## Recommended Action
[ ] Rollback deployment
[ ] Hotfix required
[ ] Fix in next release
[ ] Document as known limitation

---

## Related Issues
- [Link to similar bugs or related tickets]

---

## Notes
[Any additional information, observations, or context]
```

### Example Bug Report

```markdown
# Bug Report: Task Sequence Enforcement Not Working

**Reported By:** QA Lead
**Date/Time:** 2025-10-24 14:35
**Environment:** [x] Production [ ] Staging [ ] Local
**Severity:** [x] Critical [ ] High [ ] Medium [ ] Low

---

## Summary
Technician able to start Task 3 before completing Task 1, violating strict sequence enforcement.

---

## Test Suite
- **Suite:** Suite 3: Task Workflow
- **Test Number:** Test 3.4: Task Sequence Enforcement

---

## Steps to Reproduce
1. Login as technician (tech.test@yourdomain.com)
2. Navigate to My Tasks
3. Leave Task 1 (sequence 1) in "pending" status
4. Click "Start Task" on Task 3 (sequence 3)
5. Observe: Task 3 starts successfully (INCORRECT BEHAVIOR)

---

## Expected Behavior
Task 3 should be disabled/blocked with message: "Complete previous tasks first"

---

## Actual Behavior
Task 3 starts immediately, sequence validation bypassed.

---

## Screenshots/Evidence
[Screenshot showing Task 3 started before Task 1]

---

## Database State
```sql
SELECT task_number, sequence_number, status, started_at
FROM ticket_tasks
WHERE service_ticket_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY sequence_number;
```

Result:
```
 task_number | sequence_number | status      | started_at
-------------+-----------------+-------------+------------------------
 TSK-001     | 1               | pending     | NULL
 TSK-002     | 2               | pending     | NULL
 TSK-003     | 3               | in_progress | 2025-10-24 14:34:12
```

---

## Logs
```
[2025-10-24 14:34:12] POST /api/trpc/tasks.startTask
[2025-10-24 14:34:12] Task TSK-003 started by user abc123
[2025-10-24 14:34:12] WARNING: Sequence validation skipped
```

---

## Browser/Environment Details
- **Browser:** Chrome 120.0
- **OS:** macOS 14.0
- **User Role:** Technician

---

## Impact Assessment
- **Users Affected:** All technicians
- **Business Impact:** Critical - Core Phase 2 feature broken
- **Workaround Available:** [x] Yes [ ] No
- **Workaround:** Admin can manually enforce sequence by monitoring tasks

---

## Recommended Action
[x] Rollback deployment
[ ] Hotfix required
[ ] Fix in next release
[ ] Document as known limitation

**Reason:** Strict sequence enforcement is critical Phase 2 requirement (Story 1.5). Cannot deploy without this working.

---

## Related Issues
- Story 1.5: Task Dependencies and Sequence Enforcement
- Related to task_dependencies table and triggers

---

## Notes
Suspect issue with task dependency trigger not firing, or UI validation bypassed. Requires immediate investigation.
```

---

## Sign-Off Checklist

**Complete this checklist at the end of smoke testing**

### Test Execution

- [ ] Quick smoke test completed (5-10 min)
- [ ] Full smoke test completed (30-45 min)
- [ ] All 8 test suites executed
- [ ] Screenshots captured for critical tests
- [ ] Database verification queries run
- [ ] Logs reviewed for errors

### Test Results

- [ ] Suite 1 (Authentication): [ ] PASS [ ] FAIL
- [ ] Suite 2 (Ticket Management): [ ] PASS [ ] FAIL
- [ ] Suite 3 (Task Workflow): [ ] PASS [ ] FAIL
- [ ] Suite 4 (Public Portal): [ ] PASS [ ] FAIL
- [ ] Suite 5 (Email Notifications): [ ] PASS [ ] FAIL
- [ ] Suite 6 (Warehouse Operations): [ ] PASS [ ] FAIL
- [ ] Suite 7 (Manager Dashboard): [ ] PASS [ ] FAIL
- [ ] Suite 8 (Dynamic Template): [ ] PASS [ ] FAIL

### Issue Tracking

- [ ] All bugs reported using template
- [ ] Bug severity assigned correctly
- [ ] Critical bugs escalated to team
- [ ] Rollback decision made (if needed)

### Documentation

- [ ] Test results documented
- [ ] Evidence (screenshots) stored
- [ ] Logs archived for reference
- [ ] Bug reports filed in issue tracker

### Deployment Decision

**Overall Result:** [ ] PASS [ ] FAIL

**If PASS:**
- [ ] Deployment approved for release
- [ ] Post-deployment monitoring plan active
- [ ] Team notified of successful deployment
- [ ] Users can access application

**If FAIL:**
- [ ] Rollback initiated
- [ ] Root cause investigation started
- [ ] Hotfix plan created
- [ ] Stakeholders notified

---

### Sign-Off

**QA Lead:**
Name: _______________________
Signature: ___________________
Date/Time: ___________________

**Deployment Lead:**
Name: _______________________
Signature: ___________________
Date/Time: ___________________

**Technical Lead:**
Name: _______________________
Signature: ___________________
Date/Time: ___________________

**Product Manager (if required):**
Name: _______________________
Signature: ___________________
Date/Time: ___________________

---

### Post-Deployment Actions

- [ ] Enable monitoring alerts
- [ ] Schedule 1-hour check-in
- [ ] Schedule 24-hour review
- [ ] Plan hotfix deployment window (if needed)
- [ ] Update runbook with lessons learned

---

**Document End**

**Version:** 1.0
**Total Pages:** 50+
**Word Count:** ~8,500 words
**Last Updated:** 2025-10-24

---

## Appendix: Quick Reference

### URLs to Test

```
Homepage:              https://yourdomain.com
Login:                 https://yourdomain.com/login
Dashboard:             https://yourdomain.com/dashboard
Service Request:       https://yourdomain.com/service-request
Request Tracking:      https://yourdomain.com/track
Health Check:          https://yourdomain.com/api/health
tRPC Endpoint:         https://yourdomain.com/api/trpc
```

### Test Data Templates

**Customer:**
- Name: "Smoke Test Customer"
- Phone: "0901234567"
- Email: "smoketest@example.com"

**Ticket:**
- Device: "iPhone 13 Pro"
- Issue: "Screen cracked - smoke test [timestamp]"
- Service Type: "Standard Repair"

**Product:**
- Serial: "TEST-SN-[timestamp]"

---

**End of Document**
