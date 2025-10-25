# Data Integrity Testing Checklist - EPIC-01 Phase 2

**Priority:** P0 - CRITICAL
**Pass Criteria:** 100% pass rate (ALL 9 tests must pass)
**Estimated Time:** 1-2 hours
**Total Tests:** 9
**Scope:** Verify database constraints, triggers, and data consistency

**⚠️ CRITICAL:** Data integrity failures can lead to data corruption. ALL tests must pass.

---

## Pre-Test Setup

**Test Environment:**
- [ ] Application running: http://localhost:3025
- [ ] Supabase Studio accessible: http://localhost:54323
- [ ] SQL client connected to database
- [ ] Database backup created (in case of corruption during testing)

**Test Data:**
- [ ] Fresh database seed applied
- [ ] Test data ready for constraint validation

---

## Test Category 1: Database Constraints

**Tests:** 4
**Priority:** CRITICAL
**Pass Criteria:** All 4 tests must pass

### INT-1.1: Foreign Key Constraints
**Objective:** Verify foreign key relationships prevent orphaned records

**Test Steps:**
1. Open Supabase Studio → SQL Editor
2. Test foreign key constraints with invalid data:

```sql
-- Test 1: Try to create ticket with non-existent customer
BEGIN;
INSERT INTO service_tickets (customer_id, issue_description, service_type)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 'warranty');
-- Expected: Foreign key violation error
ROLLBACK;

-- Test 2: Try to create task with non-existent ticket
BEGIN;
INSERT INTO service_ticket_tasks (service_ticket_id, title, task_order)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test Task', 1);
-- Expected: Foreign key violation error
ROLLBACK;

-- Test 3: Try to delete customer with existing tickets
BEGIN;
-- First, create test customer with ticket
INSERT INTO customers (full_name, phone, email)
VALUES ('Test Delete Customer', '0000000001', 'delete.test@example.com')
RETURNING id;
-- Note the customer ID

INSERT INTO service_tickets (customer_id, issue_description, service_type)
VALUES ('[CUSTOMER_ID]', 'Test ticket', 'warranty');

-- Now try to delete customer (should fail due to FK constraint)
DELETE FROM customers WHERE id = '[CUSTOMER_ID]';
-- Expected: Foreign key violation error
ROLLBACK;

-- Test 4: Verify ON DELETE CASCADE works where intended
BEGIN;
-- Create ticket with tasks
INSERT INTO service_tickets (customer_id, issue_description, service_type)
VALUES ((SELECT id FROM customers LIMIT 1), 'Test cascade', 'warranty')
RETURNING id;
-- Note ticket ID

INSERT INTO service_ticket_tasks (service_ticket_id, title, task_order)
VALUES ('[TICKET_ID]', 'Task 1', 1),
       ('[TICKET_ID]', 'Task 2', 2);

-- Delete ticket (tasks should cascade delete)
DELETE FROM service_tickets WHERE id = '[TICKET_ID]';

-- Verify tasks deleted
SELECT COUNT(*) FROM service_ticket_tasks WHERE service_ticket_id = '[TICKET_ID]';
-- Expected: 0
ROLLBACK;
```

**Expected Result:**
- ✅ Test 1: FK violation error prevents orphaned ticket
- ✅ Test 2: FK violation error prevents orphaned task
- ✅ Test 3: FK violation prevents deleting customer with tickets
- ✅ Test 4: Cascade delete works correctly for ticket→tasks
- ✅ All FK constraints enforced at database level

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- SQL error messages: _____________
- Cascade delete verification: _____________

**Notes:**

---

### INT-1.2: Unique Constraints
**Objective:** Verify unique constraints prevent duplicate data

**Test Steps:**
1. Open Supabase Studio → SQL Editor
2. Test unique constraints:

```sql
-- Test 1: Try to create duplicate SKU for parts
BEGIN;
-- Get existing SKU
SELECT sku FROM parts LIMIT 1;
-- Note the SKU

-- Try to create part with same SKU
INSERT INTO parts (name, sku, category, unit_price, stock_quantity)
VALUES ('Duplicate Part', '[EXISTING_SKU]', 'Test', 10000, 10);
-- Expected: Unique constraint violation error
ROLLBACK;

-- Test 2: Try to create customer with duplicate email
BEGIN;
-- Get existing customer email
SELECT email FROM customers WHERE email IS NOT NULL LIMIT 1;
-- Note the email

-- Try to create customer with same email
INSERT INTO customers (full_name, phone, email)
VALUES ('Duplicate Customer', '0000000002', '[EXISTING_EMAIL]');
-- Expected: Unique constraint violation error
ROLLBACK;

-- Test 3: Try to create duplicate template name (if unique)
-- Check if template name has unique constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'task_templates'
  AND constraint_type = 'UNIQUE';

-- If unique constraint exists on name:
BEGIN;
SELECT name FROM task_templates LIMIT 1;
-- Try to create template with same name
INSERT INTO task_templates (name, service_type, enforce_sequence)
VALUES ('[EXISTING_NAME]', 'warranty', true);
-- Expected: Unique violation if constraint exists
ROLLBACK;
```

**Expected Result:**
- ✅ Duplicate SKU rejected with unique constraint error
- ✅ Duplicate email rejected (if unique constraint exists)
- ✅ All unique constraints enforced correctly
- ✅ Error messages are clear and descriptive

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- SQL error messages: _____________

**Notes:**

---

### INT-1.3: Check Constraints (Status Transitions)
**Objective:** Verify check constraints prevent invalid data

**Test Steps:**
1. Open Supabase Studio → SQL Editor
2. Test check constraints:

```sql
-- Test 1: Try to create ticket with invalid status
BEGIN;
INSERT INTO service_tickets (customer_id, issue_description, service_type, status)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  'Test invalid status',
  'warranty',
  'invalid_status'
);
-- Expected: Check constraint violation or ENUM error
ROLLBACK;

-- Test 2: Try to create task with invalid status
BEGIN;
INSERT INTO service_ticket_tasks (
  service_ticket_id,
  title,
  task_order,
  status
)
VALUES (
  (SELECT id FROM service_tickets LIMIT 1),
  'Test task',
  1,
  'invalid_task_status'
);
-- Expected: Check constraint violation or ENUM error
ROLLBACK;

-- Test 3: Try to set negative stock quantity (if check constraint exists)
BEGIN;
UPDATE physical_products
SET quantity_in_stock = -10
WHERE id = (SELECT id FROM physical_products LIMIT 1);
-- Expected: Check constraint violation if constraint exists
ROLLBACK;

-- Test 4: Try to set negative price
BEGIN;
UPDATE parts
SET unit_price = -1000
WHERE id = (SELECT id FROM parts LIMIT 1);
-- Expected: Check constraint violation if constraint exists
ROLLBACK;
```

**Expected Result:**
- ✅ Invalid status values rejected
- ✅ Negative quantities rejected (if constraint exists)
- ✅ Negative prices rejected (if constraint exists)
- ✅ Check constraints enforce business rules

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- SQL error messages: _____________

**Notes:**

---

### INT-1.4: NOT NULL Constraints
**Objective:** Verify required fields enforced at database level

**Test Steps:**
1. Open Supabase Studio → SQL Editor
2. Test NOT NULL constraints on critical fields:

```sql
-- Test 1: Try to create customer without required fields
BEGIN;
-- Try without name
INSERT INTO customers (phone, email)
VALUES ('0000000003', 'test@example.com');
-- Expected: NOT NULL violation on full_name

-- Try without phone
INSERT INTO customers (full_name, email)
VALUES ('Test Customer', 'test2@example.com');
-- Expected: NOT NULL violation on phone
ROLLBACK;

-- Test 2: Try to create ticket without required fields
BEGIN;
-- Try without customer_id
INSERT INTO service_tickets (issue_description, service_type)
VALUES ('Test issue', 'warranty');
-- Expected: NOT NULL violation on customer_id

-- Try without service_type
INSERT INTO service_tickets (customer_id, issue_description)
VALUES ((SELECT id FROM customers LIMIT 1), 'Test issue');
-- Expected: NOT NULL violation on service_type
ROLLBACK;

-- Test 3: Try to create task without required fields
BEGIN;
-- Try without title
INSERT INTO service_ticket_tasks (service_ticket_id, task_order)
VALUES ((SELECT id FROM service_tickets LIMIT 1), 1);
-- Expected: NOT NULL violation on title
ROLLBACK;

-- Test 4: Try to create part without required fields
BEGIN;
-- Try without SKU
INSERT INTO parts (name, category, unit_price, stock_quantity)
VALUES ('Test Part', 'Test', 10000, 10);
-- Expected: NOT NULL violation on sku
ROLLBACK;
```

**Expected Result:**
- ✅ All NOT NULL constraints enforced
- ✅ Cannot create records with missing required fields
- ✅ Clear error messages indicating missing field

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- SQL error messages: _____________

**Notes:**

---

## Test Category 2: Triggers and Automatic Updates

**Tests:** 5
**Priority:** CRITICAL
**Pass Criteria:** All 5 tests must pass

### INT-2.1: Ticket Numbering Trigger
**Objective:** Verify tickets get auto-generated sequential numbers

**Test Steps:**
1. Open Supabase Studio → SQL Editor
2. Get current max ticket number:

```sql
SELECT MAX(ticket_number) FROM service_tickets;
-- Note the number, e.g., SV-2025-050
```

3. Create new ticket via SQL:

```sql
INSERT INTO service_tickets (customer_id, issue_description, service_type)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  'Test auto-numbering',
  'warranty'
)
RETURNING id, ticket_number;
-- Expected: ticket_number = SV-2025-051 (next in sequence)
```

4. Create another ticket:

```sql
INSERT INTO service_tickets (customer_id, issue_description, service_type)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  'Test auto-numbering 2',
  'paid'
)
RETURNING id, ticket_number;
-- Expected: SV-2025-052
```

5. Verify sequence:

```sql
SELECT ticket_number
FROM service_tickets
ORDER BY created_at DESC
LIMIT 3;
-- Should show sequential numbers
```

**Expected Result:**
- ✅ Each ticket gets auto-generated number
- ✅ Format: SV-YYYY-NNN (e.g., SV-2025-001)
- ✅ Numbers are sequential (051, 052, 053...)
- ✅ Trigger works even when inserting multiple tickets
- ✅ No duplicate ticket numbers

**Actual Result:**
- [ ] PASS [ ] FAIL

**Ticket Numbers Generated:**
- Ticket 1: _____________
- Ticket 2: _____________
- Sequential: [ ] YES [ ] NO

**Evidence:**
- SQL output: _____________

**Notes:**

---

### INT-2.2: Auto Task Generation from Template
**Objective:** Verify tasks auto-created when ticket assigned template

**Test Steps:**
1. Get a template with known number of tasks:

```sql
SELECT id, name, (
  SELECT COUNT(*) FROM task_template_items WHERE template_id = tt.id
) as task_count
FROM task_templates tt
LIMIT 1;
-- Note template ID and task count
```

2. Create ticket with this template:

```sql
-- Check if auto-generation happens on ticket creation or separate API call
-- This may vary based on implementation

-- If auto-generated on ticket creation with template_id:
INSERT INTO service_tickets (
  customer_id,
  issue_description,
  service_type,
  template_id
)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  'Test auto task generation',
  'warranty',
  '[TEMPLATE_ID]'
)
RETURNING id;

-- Check tasks created
SELECT COUNT(*) as tasks_created
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]';
-- Expected: COUNT matches template task_count
```

3. Verify task details:

```sql
SELECT title, task_order, status
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]'
ORDER BY task_order;
-- All tasks should be 'pending' status
```

**Expected Result:**
- ✅ Tasks auto-created when template assigned
- ✅ Task count matches template task count
- ✅ All tasks created with 'pending' status
- ✅ Task order preserved from template
- ✅ Task titles match template

**Actual Result:**
- [ ] PASS [ ] FAIL

**Verification:**
- Template task count: ___
- Auto-generated tasks: ___
- Match: [ ] YES [ ] NO

**Evidence:**
- SQL output: _____________

**Notes:**

---

### INT-2.3: Parts Total Auto-Calculation
**Objective:** Verify total_parts updates automatically when parts added/removed

**Test Steps:**
1. Create or use existing ticket
2. Check initial total_parts:

```sql
SELECT ticket_number, total_parts
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- Note initial total_parts (likely 0 or NULL)
```

3. Add a part:

```sql
INSERT INTO service_ticket_parts (service_ticket_id, part_id, quantity, unit_price)
VALUES (
  '[TICKET_ID]',
  (SELECT id FROM parts LIMIT 1),
  2,
  100000
);
-- subtotal = 2 * 100000 = 200000
```

4. Check total_parts updated:

```sql
SELECT ticket_number, total_parts
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- Expected: total_parts = 200000
```

5. Add another part:

```sql
INSERT INTO service_ticket_parts (service_ticket_id, part_id, quantity, unit_price)
VALUES (
  '[TICKET_ID]',
  (SELECT id FROM parts LIMIT 1 OFFSET 1),
  1,
  50000
);
-- subtotal = 1 * 50000 = 50000
```

6. Check total_parts updated:

```sql
SELECT ticket_number, total_parts
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- Expected: total_parts = 200000 + 50000 = 250000
```

7. Remove a part:

```sql
DELETE FROM service_ticket_parts
WHERE service_ticket_id = '[TICKET_ID]'
  AND quantity = 1;
```

8. Verify total_parts decreased:

```sql
SELECT ticket_number, total_parts
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- Expected: total_parts = 200000
```

**Expected Result:**
- ✅ total_parts calculates correctly when parts added
- ✅ total_parts updates when parts removed
- ✅ Calculation: SUM(quantity * unit_price) for all parts
- ✅ Trigger executes automatically (no manual update needed)
- ✅ total_cost also updates: service_fee + total_parts - discount

**Actual Result:**
- [ ] PASS [ ] FAIL

**Calculations:**
- After first part: ___ (expected: 200000)
- After second part: ___ (expected: 250000)
- After delete: ___ (expected: 200000)

**Evidence:**
- SQL outputs: _____________

**Notes:**

---

### INT-2.4: Auto-Advance Ticket Status When All Tasks Complete
**Objective:** Verify ticket auto-completes when all tasks done

**Test Steps:**
1. Create ticket with template (2-3 tasks)
2. Verify ticket status is 'in_progress' or 'pending'
3. Complete all tasks except one:

```sql
-- Complete first task
UPDATE service_ticket_tasks
SET status = 'completed', completed_at = NOW()
WHERE service_ticket_id = '[TICKET_ID]'
  AND task_order = 1;

-- Check ticket status (should still be in_progress)
SELECT status FROM service_tickets WHERE id = '[TICKET_ID]';
-- Expected: 'in_progress' or 'pending'
```

4. Complete the last task:

```sql
-- Complete second task
UPDATE service_ticket_tasks
SET status = 'completed', completed_at = NOW()
WHERE service_ticket_id = '[TICKET_ID]'
  AND task_order = 2;

-- If more tasks, complete them all...
```

5. Check ticket status:

```sql
SELECT status FROM service_tickets WHERE id = '[TICKET_ID]';
-- Expected: 'completed' (auto-advanced)
```

6. Verify all tasks completed:

```sql
SELECT COUNT(*) as total_tasks,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]';
-- total_tasks should equal completed_tasks
```

**Expected Result:**
- ✅ Ticket does NOT auto-complete until ALL tasks done
- ✅ When last task completes, ticket status changes to 'completed'
- ✅ Trigger executes automatically
- ✅ Status transition follows allowed flow
- ✅ No manual intervention needed

**Actual Result:**
- [ ] PASS [ ] FAIL

**Status Tracking:**
- Before completing all tasks: _____________
- After completing all tasks: _____________
- Auto-advanced: [ ] YES [ ] NO

**Evidence:**
- SQL outputs: _____________

**Notes:**

---

### INT-2.5: Product Auto-Move Trigger on Ticket Status Change
**Objective:** Verify physical products auto-move location when ticket status changes

**Test Steps:**
1. Create or find physical product with location "Kho chính"
2. Create ticket for this product:

```sql
-- Get product ID
SELECT id, serial_number, current_location
FROM physical_products
WHERE current_location = 'Kho chính'
LIMIT 1;

-- Create ticket for this product
INSERT INTO service_tickets (
  customer_id,
  issue_description,
  service_type,
  physical_product_id
)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  'Test auto-move',
  'warranty',
  '[PRODUCT_ID]'
)
RETURNING id;
```

3. Update ticket status to 'in_progress':

```sql
UPDATE service_tickets
SET status = 'in_progress'
WHERE id = '[TICKET_ID]';
```

4. Check product location:

```sql
SELECT serial_number, current_location
FROM physical_products
WHERE id = '[PRODUCT_ID]';
-- Expected: current_location = 'Đang sửa chữa' (or configured location)
```

5. Complete the ticket:

```sql
UPDATE service_tickets
SET status = 'completed'
WHERE id = '[TICKET_ID]';
```

6. Check product location again:

```sql
SELECT serial_number, current_location
FROM physical_products
WHERE id = '[PRODUCT_ID]';
-- Expected: current_location might change to 'Đã sửa xong' or remain
-- (depends on business logic implementation)
```

**Expected Result:**
- ✅ Product location changes when ticket status changes
- ✅ Status 'in_progress' → Location 'Đang sửa chữa'
- ✅ Trigger executes automatically
- ✅ Location updates reflect business workflow
- ✅ No manual location update needed

**Actual Result:**
- [ ] PASS [ ] FAIL

**Location Tracking:**
- Initial location: _____________
- After 'in_progress': _____________
- After 'completed': _____________
- Auto-updated: [ ] YES [ ] NO

**Evidence:**
- SQL outputs: _____________

**Notes:**

---

## Data Integrity Test Summary

| Category | Test IDs | Total | Executed | Passed | Failed | Pass Rate |
|----------|----------|-------|----------|--------|--------|-----------|
| Database Constraints | INT-1.1 to INT-1.4 | 4 | ___ | ___ | ___ | ___% |
| Triggers & Auto-Updates | INT-2.1 to INT-2.5 | 5 | ___ | ___ | ___ | ___% |
| **TOTAL** | **INT-1.1 to INT-2.5** | **9** | **___** | **___** | **___** | **___%** |

**Pass Criteria:** 100% pass rate = ALL 9 tests must pass
**Critical Failures:** ___ (MUST BE ZERO)

---

## Final Assessment

**Overall Pass Rate:** ___% (Target: 100%)

**Result:** [ ] APPROVED [ ] REJECTED

**Data Integrity Issues:** ___

**Database Health:** [ ] GOOD [ ] ISSUES FOUND

**Recommendations:**

---

## Sign-Off

**Tester:** _______________ Date: _______________
**Database Administrator:** _______________ Date: _______________
**Approval:** [ ] PASS - Data integrity verified [ ] FAIL - Integrity issues must be fixed

**⚠️ DEPLOYMENT BLOCKER:** Any data integrity failure blocks deployment until fixed.

---

**Next Steps:**
- If ALL PASS: Proceed to E2E Workflows Testing
- If ANY FAIL: Fix database issues immediately, verify backups, retest ALL tests

**References:**
- Test Plan: docs/TEST_PLAN.md
- Master Tracker: docs/qa/test-execution/MASTER-TEST-EXECUTION-TRACKER.md
- Database Schema: docs/data/schemas/
