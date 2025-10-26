# Feature Acceptance Testing Checklist - EPIC-01 Phase 2

**Priority:** P0 - CRITICAL
**Pass Criteria:** 95%+ pass rate (84+ of 88 tests must pass)
**Estimated Time:** 10-12 hours
**Total Tests:** 88
**Stories Covered:** 1.2, 1.4, 1.5, 1.6-1.10, 1.11-1.14, 1.15, 1.16, 1.17

**⚠️ CRITICAL:** This test category validates all new Phase 2 features. Minimum 95% pass rate required for deployment.

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
- [ ] Test customers created (at least 5)
- [ ] Test templates created (warranty, paid, replacement)
- [ ] Test products created (at least 10)
- [ ] Test warehouses created (at least 2)
- [ ] Test tickets in various statuses

---

## Test Category 1: Task Template Management (Story 1.2)

**Tests:** 4
**Priority:** CRITICAL
**Pass Criteria:** All 4 tests must pass

### FT-1.1: Create Task Template
**Objective:** Verify admin can create new task templates

**Test Steps:**
1. Login as Admin (admin@example.com)
2. Navigate to `/workflows/templates`
3. Click "New Template" button
4. Fill in template details:
   - Name: "Test Template - Warranty Service"
   - Service Type: Select "warranty"
   - Enforce Sequence: Check the checkbox
5. Add 3 tasks:
   - Task 1: "Initial Diagnosis" (order: 1)
   - Task 2: "Repair Work" (order: 2)
   - Task 3: "Quality Check" (order: 3)
6. Click "Save Template"
7. Verify success message appears
8. Check template appears in list

**Expected Result:**
- ✅ Template creation form displays all required fields
- ✅ Template saves successfully without errors
- ✅ Success message displayed
- ✅ Template appears in template list
- ✅ Template shows correct name, service type, and task count

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of template form: _____________
- Screenshot of template list: _____________

**Notes:**

---

### FT-1.2: Edit Existing Template
**Objective:** Verify admin can modify existing templates

**Test Steps:**
1. Login as Admin
2. Navigate to `/workflows/templates`
3. Find the template created in FT-1.1
4. Click "Edit" button on the template
5. Modify the template:
   - Change name to "Test Template - Warranty Service (Updated)"
   - Add a 4th task: "Final Testing" (order: 4)
6. Click "Save Changes"
7. Verify success message appears
8. Check changes are reflected in template list
9. Open Supabase Studio SQL Editor
10. Execute:

```sql
-- Verify template history preserved
SELECT * FROM task_templates
WHERE name LIKE '%Test Template - Warranty%'
ORDER BY updated_at DESC;

-- Verify tasks count
SELECT COUNT(*) FROM task_template_items
WHERE template_id = (SELECT id FROM task_templates WHERE name = 'Test Template - Warranty Service (Updated)');
-- Expected: 4
```

**Expected Result:**
- ✅ Edit form opens with current template data
- ✅ Changes save successfully
- ✅ Template list shows updated name
- ✅ 4 tasks exist in database
- ✅ updated_at timestamp changed

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot edit form: _____________
- SQL output: _____________

**Notes:**

---

### FT-1.3: Template with Sequence Enforcement
**Objective:** Verify strict sequence mode works correctly

**Test Steps:**
1. Login as Admin
2. Create new template with:
   - Name: "Strict Sequence Template"
   - Service Type: "paid"
   - Enforce Sequence: TRUE (checked)
   - Tasks:
     - "Step 1 - Must Complete First" (order: 1)
     - "Step 2 - Must Complete Second" (order: 2)
     - "Step 3 - Must Complete Last" (order: 3)
3. Save template
4. Create a new ticket using this template
5. Login as Technician
6. Navigate to the ticket
7. Try to start "Step 3" before completing "Step 1"

**Expected Result:**
- ✅ Template created with enforce_sequence = true
- ✅ Ticket created successfully with 3 pending tasks
- ✅ System prevents starting Step 3 out of order
- ✅ Error message displayed: "Must complete previous tasks first"
- ✅ Only Step 1 is startable (others disabled or show warning)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of sequence enforcement error: _____________
- Screenshot showing disabled tasks: _____________

**Notes:**

---

### FT-1.4: Template with Flexible Mode
**Objective:** Verify flexible mode allows out-of-order execution

**Test Steps:**
1. Login as Admin
2. Create new template with:
   - Name: "Flexible Template"
   - Service Type: "warranty"
   - Enforce Sequence: FALSE (unchecked)
   - Tasks:
     - "Task A" (order: 1)
     - "Task B" (order: 2)
     - "Task C" (order: 3)
3. Save template
4. Create a new ticket using this template
5. Login as Technician
6. Navigate to the ticket
7. Start and complete "Task C" first (skip A and B)
8. Check for warnings (should show warning but allow completion)

**Expected Result:**
- ✅ Template created with enforce_sequence = false
- ✅ Ticket created with 3 pending tasks
- ✅ System allows starting Task C without completing A and B
- ✅ Warning message displayed (optional): "Recommended order not followed"
- ✅ All tasks are startable regardless of order
- ✅ Task C completes successfully

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of out-of-order completion: _____________
- Task status verification: _____________

**Notes:**

---

## Test Category 2: Task Execution UI (Story 1.4)

**Tests:** 4
**Priority:** CRITICAL
**Pass Criteria:** All 4 tests must pass

### FT-2.1: Start Task
**Objective:** Verify technician can start a pending task

**Test Steps:**
1. Create a test ticket with template (use template from FT-1.3)
2. Assign ticket to technician@example.com
3. Login as Technician
4. Navigate to `/operations/my-tasks`
5. Find the test ticket in task list
6. Click "Start" button on first task
7. Confirm action
8. Observe task status change
9. Verify in database:

```sql
SELECT id, title, status, started_at, assigned_to
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]'
ORDER BY task_order;
```

**Expected Result:**
- ✅ My Tasks page shows assigned tasks
- ✅ "Start" button is visible and enabled
- ✅ Task status changes from "pending" to "in_progress"
- ✅ started_at timestamp recorded
- ✅ Task shows "in progress" visual indicator
- ✅ "Complete" and "Block" buttons now available

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot before start: _____________
- Screenshot after start: _____________
- SQL output: _____________

**Notes:**

---

### FT-2.2: Complete Task with Notes
**Objective:** Verify technician can complete task with completion notes

**Test Steps:**
1. Continue from FT-2.1 (task in "in_progress" state)
2. Click "Complete" button
3. Modal opens for completion notes
4. Try to submit with empty notes (should fail validation)
5. Enter notes: "Test completion note - verified all steps completed successfully"
6. Submit
7. Observe task status change
8. Verify in database:

```sql
SELECT id, title, status, completed_at, completion_notes
FROM service_ticket_tasks
WHERE id = '[TASK_ID]';
```

**Expected Result:**
- ✅ Completion modal opens
- ✅ Validation enforces minimum 5 characters for notes
- ✅ Empty notes rejected with error message
- ✅ With valid notes, task status changes to "completed"
- ✅ completed_at timestamp recorded
- ✅ completion_notes saved in database
- ✅ Task shows "completed" visual indicator (checkmark/green)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of completion modal: _____________
- Screenshot of completed task: _____________
- SQL output showing notes: _____________

**Notes:**

---

### FT-2.3: Block Task with Reason
**Objective:** Verify technician can block a task when encountering issues

**Test Steps:**
1. Start a new task on the test ticket
2. Click "Block" button
3. Modal opens for block reason
4. Try to submit without reason (should fail validation)
5. Enter reason: "Missing parts - waiting for part delivery"
6. Submit
7. Observe task status change
8. Login as Manager
9. Navigate to `/dashboard/task-progress`
10. Verify blocked task appears in "Blocked Tasks Alert" section
11. Verify in database:

```sql
SELECT id, title, status, blocked_at, blocked_reason
FROM service_ticket_tasks
WHERE id = '[TASK_ID]';
```

**Expected Result:**
- ✅ Block modal opens
- ✅ Validation requires block reason (min 10 characters)
- ✅ Empty reason rejected with error message
- ✅ Task status changes to "blocked"
- ✅ blocked_at timestamp recorded
- ✅ blocked_reason saved in database
- ✅ Task shows "blocked" visual indicator (warning/red)
- ✅ Manager dashboard shows blocked task alert

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of block modal: _____________
- Screenshot of blocked task: _____________
- Screenshot of manager dashboard alert: _____________
- SQL output: _____________

**Notes:**

---

### FT-2.4: Task Sequence Enforcement
**Objective:** Verify strict sequence prevents out-of-order execution

**Test Steps:**
1. Create ticket using "Strict Sequence Template" (from FT-1.3)
2. Assign to technician@example.com
3. Login as Technician
4. Navigate to ticket detail page
5. Observe all 3 tasks (Step 1, Step 2, Step 3)
6. Attempt to click "Start" button on Step 3 (should be disabled)
7. Attempt to click "Start" button on Step 2 (should be disabled)
8. Start Step 1
9. Complete Step 1 with notes
10. Now attempt to start Step 3 (should still be disabled)
11. Start Step 2 (should now be enabled)
12. Complete Step 2
13. Start and complete Step 3 (should now be enabled)

**Expected Result:**
- ✅ Initially, only Step 1 "Start" button is enabled
- ✅ Step 2 and Step 3 show disabled state or lock icon
- ✅ After Step 1 completes, Step 2 becomes enabled
- ✅ Step 3 remains disabled until Step 2 completes
- ✅ Hover tooltip shows: "Complete previous tasks first"
- ✅ Strict sequence enforced throughout entire workflow

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot showing disabled tasks: _____________
- Screenshot of progression: _____________

**Notes:**

---

## Test Category 3: Task Dependencies (Story 1.5)

**Tests:** 3
**Priority:** CRITICAL
**Pass Criteria:** All 3 tests must pass

### FT-3.1: Sequential Gate Enforcement
**Objective:** Verify system blocks out-of-order completion in strict mode

**Test Steps:**
1. Use ticket with "Strict Sequence Template" from FT-2.4
2. Reset all tasks to pending state (via SQL if needed):

```sql
UPDATE service_ticket_tasks
SET status = 'pending', started_at = NULL, completed_at = NULL
WHERE service_ticket_id = '[TICKET_ID]';
```

3. Login as Technician
4. Try to complete Task 3 without completing Task 2
5. Observe system response
6. Try to start Task 2 without completing Task 1
7. Observe system response

**Expected Result:**
- ✅ System prevents starting Task 2 before Task 1 completes
- ✅ System prevents starting Task 3 before Task 2 completes
- ✅ Clear error message: "Cannot start this task. Previous tasks must be completed first."
- ✅ Task buttons remain disabled until dependencies met
- ✅ No database updates occur for blocked actions

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of error message: _____________
- Task states verification: _____________

**Notes:**

---

### FT-3.2: Flexible Mode Warning
**Objective:** Verify flexible mode shows warnings but allows out-of-order completion

**Test Steps:**
1. Create ticket with "Flexible Template" (from FT-1.4)
2. Login as Technician
3. Navigate to ticket
4. Skip Task A and Task B
5. Start and complete Task C first
6. Observe if warning is displayed
7. Verify Task C completes successfully
8. Check database:

```sql
SELECT title, task_order, status, completed_at
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]'
ORDER BY task_order;
-- Task C (order 3) should show completed while A and B are pending
```

**Expected Result:**
- ✅ All tasks are startable regardless of order
- ✅ System may show informational warning (not blocking)
- ✅ Task C completes successfully
- ✅ Database shows Task C completed while A and B pending
- ✅ No errors or system failures

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot showing out-of-order completion: _____________
- SQL output: _____________

**Notes:**

---

### FT-3.3: Auto-Advance Ticket Status
**Objective:** Verify ticket status auto-advances when all tasks complete

**Test Steps:**
1. Create new ticket with template (any template with 3+ tasks)
2. Verify initial ticket status is "pending" or "in_progress"
3. Login as Technician
4. Complete all tasks one by one
5. After completing the last task, observe ticket status
6. Verify in database:

```sql
-- Check ticket status
SELECT ticket_number, status, updated_at
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- Expected status: 'completed'

-- Check all tasks completed
SELECT COUNT(*) as total_tasks,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]';
-- Total and completed should match
```

**Expected Result:**
- ✅ Ticket starts in "pending" or "in_progress" status
- ✅ After all tasks completed, ticket auto-advances to "completed"
- ✅ Ticket status change is immediate (no manual update needed)
- ✅ Database reflects status change with updated timestamp
- ✅ Ticket appears in "Completed" section of ticket list

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of ticket before final task: _____________
- Screenshot of ticket after final task: _____________
- SQL output: _____________

**Notes:**

---

## Test Category 4: Warehouse Operations (Stories 1.6-1.10)

**Tests:** 4
**Priority:** CRITICAL
**Pass Criteria:** All 4 tests must pass

### FT-4.1: Record Stock Movement
**Objective:** Verify stock movements can be recorded and update quantities

**Test Steps:**
1. Login as Admin
2. Navigate to `/inventory/products`
3. Note current stock level of a test product
4. Click "Record Movement" on the product
5. Fill movement form:
   - Movement Type: "IN" (stock in)
   - Quantity: 10
   - Warehouse: Select test warehouse
   - Reason: "Test stock replenishment"
6. Submit
7. Verify stock quantity updated
8. Record another movement:
   - Movement Type: "OUT"
   - Quantity: 5
   - Warehouse: Same warehouse
   - Reason: "Test stock consumption"
9. Verify stock quantity updated again
10. Check database:

```sql
-- Check movement history
SELECT movement_type, quantity, reason, created_at
FROM stock_movements
WHERE physical_product_id = '[PRODUCT_ID]'
ORDER BY created_at DESC
LIMIT 2;

-- Check current stock level
SELECT quantity_in_stock
FROM physical_products
WHERE id = '[PRODUCT_ID]';
-- Should be: original + 10 - 5
```

**Expected Result:**
- ✅ Movement form opens with all required fields
- ✅ Stock IN increases quantity by specified amount
- ✅ Stock OUT decreases quantity by specified amount
- ✅ Both movements recorded in stock_movements table
- ✅ Final stock quantity = original + 10 - 5
- ✅ Movement history visible in product detail

**Actual Result:**
- [ ] PASS [ ] FAIL

**Metrics:**
- Original stock: ___
- After IN (+10): ___
- After OUT (-5): ___
- Expected final: ___
- Actual final: ___

**Evidence:**
- Screenshot of movement form: _____________
- Screenshot of updated stock: _____________
- SQL output: _____________

**Notes:**

---

### FT-4.2: Low Stock Alert
**Objective:** Verify low stock threshold triggers alerts

**Test Steps:**
1. Login as Admin
2. Navigate to `/inventory/products`
3. Select a test product
4. Set low_stock_threshold = 10
5. Record stock movements to reduce quantity to 9 (below threshold)
6. Navigate to `/inventory/stock-levels`
7. Observe low stock alerts section
8. Verify product appears in alert list
9. Check database:

```sql
-- Verify low stock products
SELECT name, quantity_in_stock, low_stock_threshold
FROM physical_products
WHERE quantity_in_stock < low_stock_threshold;
-- Should include test product

-- Check materialized view (if exists)
SELECT * FROM vw_stock_levels
WHERE status = 'low_stock';
```

**Expected Result:**
- ✅ Product low_stock_threshold can be set
- ✅ When stock drops below threshold, alert is triggered
- ✅ Product appears in "Low Stock Alerts" section
- ✅ Alert shows product name, current stock, and threshold
- ✅ Visual indicator (yellow/orange warning icon)
- ✅ Database query returns product in low stock list

**Actual Result:**
- [ ] PASS [ ] FAIL

**Metrics:**
- Threshold set: ___
- Stock reduced to: ___
- Alert displayed: [ ] Yes [ ] No

**Evidence:**
- Screenshot of low stock alert: _____________
- SQL output: _____________

**Notes:**

---

### FT-4.3: RMA Batch Creation
**Objective:** Verify RMA batches can be created with products and serial numbers

**Test Steps:**
1. Login as Admin
2. Navigate to `/inventory/rma`
3. Click "Create RMA Batch"
4. Fill batch form:
   - Supplier: Select test supplier
   - Reason: "Defective units - screen flickering"
   - Expected Return Date: (select future date)
5. Add products to batch:
   - Product 1: Select product, enter serial number "SN-TEST-001", quantity: 1
   - Product 2: Select product, enter serial number "SN-TEST-002", quantity: 1
6. Save batch
7. Verify success message
8. Check batch list shows new batch
9. Verify auto-generated batch number (RMA-YYYY-NNN format)
10. Check database:

```sql
-- Check RMA batch created
SELECT batch_number, supplier_id, reason, status, expected_return_date
FROM rma_batches
WHERE batch_number LIKE 'RMA-%'
ORDER BY created_at DESC
LIMIT 1;

-- Check RMA items
SELECT COUNT(*) as item_count
FROM rma_batch_items
WHERE rma_batch_id = '[BATCH_ID]';
-- Expected: 2
```

**Expected Result:**
- ✅ RMA batch form displays all required fields
- ✅ Batch saves successfully
- ✅ Auto-generated batch number in format RMA-YYYY-NNN
- ✅ Batch appears in RMA list with status "pending"
- ✅ 2 items associated with batch
- ✅ Serial numbers saved correctly

**Actual Result:**
- [ ] PASS [ ] FAIL

**Batch Details:**
- Generated batch number: _____________
- Items count: ___
- Status: _____________

**Evidence:**
- Screenshot of RMA batch form: _____________
- Screenshot of RMA batch list: _____________
- SQL output: _____________

**Notes:**

---

### FT-4.4: Auto-Move Product on Ticket Status Change
**Objective:** Verify products automatically move location based on ticket status

**Test Steps:**
1. Create a test product with current location "Kho chính"
2. Create a new ticket for this product
3. Set ticket status to "in_progress"
4. Check product location - should auto-move to "Đang sửa chữa"
5. Complete the ticket
6. Check product location - should auto-move to appropriate location
7. Verify in database:

```sql
-- Check product location changes
SELECT pp.serial_number, pp.current_location, st.status, st.updated_at
FROM physical_products pp
JOIN service_tickets st ON pp.id = st.physical_product_id
WHERE pp.id = '[PRODUCT_ID]'
ORDER BY st.updated_at DESC;

-- Check location history (if tracked)
SELECT location, changed_at, reason
FROM product_location_history
WHERE physical_product_id = '[PRODUCT_ID]'
ORDER BY changed_at DESC;
```

**Expected Result:**
- ✅ Initial product location: "Kho chính"
- ✅ When ticket status = "in_progress", location changes to "Đang sửa chữa"
- ✅ Location change is automatic (no manual intervention)
- ✅ Location change triggered by ticket status update
- ✅ Database reflects current location accurately

**Actual Result:**
- [ ] PASS [ ] FAIL

**Location Tracking:**
- Initial location: _____________
- Location after "in_progress": _____________
- Location after "completed": _____________

**Evidence:**
- Screenshot of product location changes: _____________
- SQL output: _____________

**Notes:**

---

## Test Category 5: Public Service Request Portal (Stories 1.11-1.14)

**Tests:** 5
**Priority:** CRITICAL
**Pass Criteria:** All 5 tests must pass

### FT-5.1: Submit Service Request (No Login Required)
**Objective:** Verify public users can submit service requests without authentication

**Test Steps:**
1. Logout from application (ensure not authenticated)
2. Open `/service-request` in browser
3. Verify page loads without login requirement
4. Fill service request form:
   - Name: "John Doe"
   - Phone: "0123456789"
   - Email: "john.doe@example.com"
   - Device Type: "Laptop"
   - Issue Description: "Laptop won't turn on, tried charging but no response"
5. Submit form
6. Observe response
7. Note tracking token displayed
8. Verify in database:

```sql
SELECT tracking_token, customer_name, customer_phone, device_type, issue_description, status
FROM service_requests
WHERE customer_phone = '0123456789'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- ✅ Page accessible without login
- ✅ Form displays all required fields
- ✅ Form validation works (required fields enforced)
- ✅ Submission succeeds
- ✅ Success message displayed with tracking token
- ✅ Tracking token is unique (UUID format)
- ✅ Request saved in database with status "pending"
- ✅ Email notification queued (check email_notifications table)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Request Details:**
- Tracking token: _____________
- Request ID: _____________
- Status: _____________

**Evidence:**
- Screenshot of public form: _____________
- Screenshot of success message with token: _____________
- SQL output: _____________

**Notes:**

---

### FT-5.2: Track Service Request with Token
**Objective:** Verify customers can track request status using token

**Test Steps:**
1. Use tracking token from FT-5.1
2. Open `/service-request/track` (no login)
3. Enter tracking token
4. Submit
5. Observe request status displayed
6. Verify displayed information:
   - Request status
   - Submission date
   - Device type
   - Issue description (masked for security)
   - Current status (Pending/Converted/Completed)
7. Try invalid token "INVALID-TOKEN-12345"
8. Verify error message

**Expected Result:**
- ✅ Tracking page accessible without login
- ✅ With valid token, request details displayed
- ✅ Status shows "Pending" (not yet converted)
- ✅ Submission date displayed
- ✅ Sensitive info protected (email may be masked)
- ✅ With invalid token, error message: "Request not found"
- ✅ No access to other customers' requests

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of tracking page: _____________
- Screenshot of invalid token error: _____________

**Notes:**

---

### FT-5.3: Staff Converts Request to Ticket
**Objective:** Verify reception staff can convert requests to tickets

**Test Steps:**
1. Login as Reception (reception@example.com)
2. Navigate to `/operations/service-requests`
3. Find the request submitted in FT-5.1
4. Click "Convert to Ticket" button
5. Conversion form opens
6. Fill ticket details:
   - Customer: Select existing customer or create new
   - Product: Select product
   - Service Type: "warranty"
   - Template: Select appropriate template
   - Assign To: Select technician
7. Submit conversion
8. Observe success message
9. Verify ticket created
10. Check database:

```sql
-- Check request status updated
SELECT tracking_token, status, converted_to_ticket_id, converted_at, converted_by
FROM service_requests
WHERE tracking_token = '[TOKEN]';
-- Status should be 'converted'

-- Check ticket created
SELECT ticket_number, customer_id, status
FROM service_tickets
WHERE id = (SELECT converted_to_ticket_id FROM service_requests WHERE tracking_token = '[TOKEN]');
```

**Expected Result:**
- ✅ Requests dashboard shows all pending requests
- ✅ "Convert to Ticket" button available
- ✅ Conversion form prefills request data
- ✅ Ticket created successfully
- ✅ Request status changes to "converted"
- ✅ converted_to_ticket_id links to new ticket
- ✅ converted_at timestamp recorded
- ✅ converted_by records staff user
- ✅ Request no longer appears in "Pending" list

**Actual Result:**
- [ ] PASS [ ] FAIL

**Conversion Details:**
- Ticket number created: _____________
- Converted by: _____________
- Converted at: _____________

**Evidence:**
- Screenshot of request dashboard: _____________
- Screenshot of conversion form: _____________
- Screenshot of created ticket: _____________
- SQL output: _____________

**Notes:**

---

### FT-5.4: Delivery Confirmation
**Objective:** Verify delivery confirmation workflow

**Test Steps:**
1. Complete the ticket created in FT-5.3
2. Login as Manager or Admin
3. Navigate to completed ticket
4. Click "Confirm Delivery" button
5. Delivery confirmation modal opens
6. Fill delivery details:
   - Delivery Date: (select date)
   - Delivered To: "John Doe"
   - Delivery Method: "Customer Pickup"
   - Notes: "Customer picked up device, verified all repairs complete"
7. Submit
8. Verify success message
9. Check email notification sent
10. Verify in database:

```sql
-- Check delivery confirmation
SELECT ticket_number, status, delivery_confirmed_at, delivery_confirmed_by, delivery_notes
FROM service_tickets
WHERE id = '[TICKET_ID]';

-- Check email notification
SELECT recipient, template_type, status
FROM email_notifications
WHERE reference_id = '[TICKET_ID]'
  AND template_type = 'delivery_confirmation'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- ✅ "Confirm Delivery" button appears on completed tickets
- ✅ Modal displays all delivery fields
- ✅ Validation enforces required fields
- ✅ Delivery confirmation saves successfully
- ✅ delivery_confirmed_at timestamp recorded
- ✅ delivery_confirmed_by records staff user
- ✅ Email notification queued with delivery details
- ✅ Ticket shows "Delivered" badge or status

**Actual Result:**
- [ ] PASS [ ] FAIL

**Delivery Details:**
- Confirmed at: _____________
- Confirmed by: _____________
- Email sent: [ ] Yes [ ] No

**Evidence:**
- Screenshot of delivery confirmation modal: _____________
- Screenshot of ticket after delivery: _____________
- SQL output: _____________

**Notes:**

---

### FT-5.5: Rate Limiting (Security)
**Objective:** Verify public portal enforces rate limiting

**Test Steps:**
1. Logout from application
2. Open `/service-request`
3. Submit 10 service requests in rapid succession:
   - Use different phone numbers for each (0100000001, 0100000002, etc.)
   - Fill required fields
4. After 10th submission, submit 11th request
5. Observe response
6. Check for rate limit error (429 Too Many Requests)
7. Wait for cooldown period (if configurable)
8. Try submitting again after cooldown

**Expected Result:**
- ✅ First 10 requests succeed
- ✅ 11th request blocked with rate limit error
- ✅ Error message: "Rate limit exceeded. Maximum 10 requests per hour per IP."
- ✅ HTTP status code: 429 Too Many Requests
- ✅ After cooldown period, requests allowed again

**Actual Result:**
- [ ] PASS [ ] FAIL

**Rate Limit Metrics:**
- Requests succeeded: ___ / 10
- 11th request blocked: [ ] Yes [ ] No
- Error code received: ___
- Cooldown period: ___ minutes

**Evidence:**
- Screenshot of rate limit error: _____________
- Network response showing 429: _____________

**Notes:**

---

## Test Category 6: Email Notification System (Story 1.15)

**Tests:** 4
**Priority:** HIGH
**Pass Criteria:** All 4 tests must pass

### FT-6.1: Ticket Status Change Email
**Objective:** Verify email notifications queued on ticket status changes

**Test Steps:**
1. Login as Admin
2. Create new ticket for a customer with email
3. Update ticket status to "in_progress"
4. Check email_notifications table
5. Update ticket status to "completed"
6. Check email_notifications table again
7. Verify in database:

```sql
-- Check email notifications for ticket
SELECT template_type, recipient, status, created_at
FROM email_notifications
WHERE reference_id = '[TICKET_ID]'
ORDER BY created_at DESC;
-- Should see 2 emails: status_update (in_progress), status_update (completed)
```

**Expected Result:**
- ✅ Email queued when status changes to "in_progress"
- ✅ Email queued when status changes to "completed"
- ✅ Each email has correct template_type
- ✅ Recipient is customer email
- ✅ Status is "pending" or "sent"
- ✅ Email content includes ticket number and new status

**Actual Result:**
- [ ] PASS [ ] FAIL

**Email Details:**
- Emails queued: ___ / 2
- Template types: _____________
- Recipient: _____________

**Evidence:**
- SQL output: _____________

**Notes:**

---

### FT-6.2: Unsubscribe Functionality
**Objective:** Verify customers can unsubscribe from email notifications

**Test Steps:**
1. Get unsubscribe token for a customer
2. Open unsubscribe URL: `/unsubscribe/[TOKEN]`
3. Unsubscribe page displays
4. Click "Confirm Unsubscribe"
5. Verify success message
6. Create new ticket for unsubscribed customer
7. Update ticket status
8. Check email_notifications table
9. Verify in database:

```sql
-- Check customer unsubscribed
SELECT email, email_notifications_enabled
FROM customers
WHERE id = '[CUSTOMER_ID]';
-- email_notifications_enabled should be false

-- Check no email queued
SELECT COUNT(*) as email_count
FROM email_notifications
WHERE recipient = '[CUSTOMER_EMAIL]'
  AND created_at > '[UNSUBSCRIBE_TIME]';
-- Should be 0
```

**Expected Result:**
- ✅ Unsubscribe page accessible with valid token
- ✅ Confirmation button displayed
- ✅ After confirmation, success message shown
- ✅ Customer email_notifications_enabled set to false
- ✅ No further emails queued for unsubscribed customer
- ✅ Invalid token shows error message

**Actual Result:**
- [ ] PASS [ ] FAIL

**Unsubscribe Details:**
- Customer unsubscribed: [ ] Yes [ ] No
- Emails blocked after unsubscribe: [ ] Yes [ ] No

**Evidence:**
- Screenshot of unsubscribe page: _____________
- SQL output: _____________

**Notes:**

---

### FT-6.3: Admin Email Log
**Objective:** Verify admin can view all email notifications

**Test Steps:**
1. Login as Admin
2. Navigate to `/dashboard/notifications` or email log page
3. Observe email list
4. Verify columns displayed:
   - Recipient
   - Template Type
   - Status (Pending/Sent/Failed)
   - Created Date
   - Sent Date (if sent)
5. Search/filter by recipient email
6. Search/filter by template type
7. Test pagination (if many emails)

**Expected Result:**
- ✅ Email log page accessible to Admin
- ✅ All emails displayed in table
- ✅ Each email shows: recipient, template type, status, dates
- ✅ Search/filter works correctly
- ✅ Pagination works (if applicable)
- ✅ Status clearly indicates: pending (gray), sent (green), failed (red)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Email Log Metrics:**
- Total emails displayed: ___
- Filter functionality: [ ] Working [ ] Not Working
- Pagination: [ ] Working [ ] N/A

**Evidence:**
- Screenshot of email log page: _____________

**Notes:**

---

### FT-6.4: Email Preview
**Objective:** Verify admin can preview email content

**Test Steps:**
1. Login as Admin
2. Navigate to email log page
3. Find an email in the list
4. Click "View" or "Preview" button
5. Email preview modal opens
6. Verify displayed content:
   - Subject line
   - Email body (formatted HTML or text)
   - Recipient
   - Template type
   - Sent date/time
7. Close modal
8. Preview another email of different template type

**Expected Result:**
- ✅ "View" button available for each email
- ✅ Modal opens showing email content
- ✅ Subject line displayed
- ✅ Email body formatted correctly
- ✅ All email variables replaced (e.g., {{ticket_number}}, {{customer_name}})
- ✅ Unsubscribe link present in email footer
- ✅ Modal closeable

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of email preview modal: _____________

**Notes:**

---

## Test Category 7: Manager Task Progress Dashboard (Story 1.16)

**Tests:** 4
**Priority:** HIGH
**Pass Criteria:** All 4 tests must pass

### FT-7.1: View Dashboard Metrics
**Objective:** Verify manager dashboard displays key metrics

**Test Steps:**
1. Prepare test data:
   - Create 5 tickets with tasks in various states
   - 2 tickets with "in_progress" tasks
   - 1 ticket with blocked task
   - 2 tickets with completed tasks
2. Login as Manager (manager@example.com)
3. Navigate to `/dashboard/task-progress`
4. Observe metrics cards
5. Verify displayed metrics:
   - Active Tickets (tickets with in_progress tasks)
   - Tasks In Progress (count)
   - Blocked Tasks (count)
   - Average Completion Time (if calculable)
6. Verify counts match test data

**Expected Result:**
- ✅ Dashboard page loads successfully
- ✅ 4 metric cards displayed prominently
- ✅ Active Tickets count: 2 (or matches test data)
- ✅ Tasks In Progress count: matches actual count
- ✅ Blocked Tasks count: 1 (or matches test data)
- ✅ Average Completion Time displayed or "N/A"
- ✅ Metrics calculated in real-time from database

**Actual Result:**
- [ ] PASS [ ] FAIL

**Metrics Observed:**
- Active Tickets: ___
- Tasks In Progress: ___
- Blocked Tasks: ___
- Avg Completion Time: ___

**Evidence:**
- Screenshot of dashboard metrics: _____________

**Notes:**

---

### FT-7.2: Blocked Tasks Alert Section
**Objective:** Verify blocked tasks are highlighted in alert section

**Test Steps:**
1. Ensure at least 1 task is blocked (from FT-2.3)
2. Login as Manager
3. Navigate to `/dashboard/task-progress`
4. Scroll to "Blocked Tasks Alert" section
5. Verify section displays:
   - Ticket number
   - Task title
   - Blocked reason
   - Blocked date
   - Assigned technician
6. Click on ticket to navigate to ticket detail
7. Unblock the task (or complete it)
8. Return to dashboard
9. Verify alert section updates (blocked task removed)

**Expected Result:**
- ✅ "Blocked Tasks Alert" section visible
- ✅ Shows all currently blocked tasks
- ✅ Each entry shows: ticket #, task title, reason, date, technician
- ✅ Visual indicator (warning icon, red/orange color)
- ✅ Clickable to navigate to ticket
- ✅ Updates in real-time when task unblocked

**Actual Result:**
- [ ] PASS [ ] FAIL

**Blocked Tasks Details:**
- Count displayed: ___
- Details shown: [ ] Complete [ ] Incomplete

**Evidence:**
- Screenshot of blocked tasks alert: _____________
- Screenshot after unblocking: _____________

**Notes:**

---

### FT-7.3: Technician Workload Table
**Objective:** Verify technician workload statistics displayed

**Test Steps:**
1. Ensure multiple technicians have assigned tasks
2. Login as Manager
3. Navigate to `/dashboard/task-progress`
4. Scroll to "Technician Workload" table
5. Verify table columns:
   - Technician Name
   - Active Tasks (in_progress count)
   - Pending Tasks (assigned but not started)
   - Completed Tasks (count)
   - Completion Rate (completed / total)
6. Verify all technicians listed
7. Check calculations are accurate
8. Verify in database:

```sql
-- Calculate workload per technician
SELECT
  p.full_name,
  COUNT(CASE WHEN stt.status = 'in_progress' THEN 1 END) as active_tasks,
  COUNT(CASE WHEN stt.status = 'pending' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN stt.status = 'completed' THEN 1 END) as completed_tasks,
  ROUND(
    COUNT(CASE WHEN stt.status = 'completed' THEN 1 END)::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100,
    2
  ) as completion_rate
FROM profiles p
LEFT JOIN service_ticket_tasks stt ON stt.assigned_to = p.id
WHERE p.role = 'technician'
GROUP BY p.id, p.full_name
ORDER BY active_tasks DESC;
```

**Expected Result:**
- ✅ Workload table displays all technicians
- ✅ Each row shows: name, active, pending, completed counts
- ✅ Completion rate calculated correctly (percentage)
- ✅ Table sortable by columns
- ✅ Counts match database query results
- ✅ Technicians with no tasks show 0 counts

**Actual Result:**
- [ ] PASS [ ] FAIL

**Workload Table Verification:**
- Technicians listed: ___
- Calculations accurate: [ ] Yes [ ] No

**Evidence:**
- Screenshot of workload table: _____________
- SQL output: _____________

**Notes:**

---

### FT-7.4: Auto-Refresh Dashboard
**Objective:** Verify dashboard data refreshes automatically

**Test Steps:**
1. Login as Manager
2. Open `/dashboard/task-progress`
3. Note current metrics (Active Tickets, Tasks In Progress, etc.)
4. In another browser tab, login as Technician
5. Start a new task
6. Return to Manager dashboard tab
7. Wait for auto-refresh interval (e.g., 30 seconds)
8. Observe metrics update without manual page refresh
9. Check browser console for refresh logs (if implemented)

**Expected Result:**
- ✅ Dashboard refreshes automatically every 30-60 seconds
- ✅ Metrics update to reflect new task status
- ✅ No full page reload (smooth update)
- ✅ User not disrupted during refresh
- ✅ Visual indicator of last refresh time (optional)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Auto-Refresh Details:**
- Refresh interval: ___ seconds
- Metrics updated: [ ] Yes [ ] No
- Smooth update: [ ] Yes [ ] No

**Evidence:**
- Screenshot before refresh: _____________
- Screenshot after refresh: _____________

**Notes:**

---

## Test Category 8: Dynamic Template Switching (Story 1.17)

**Tests:** 5
**Priority:** CRITICAL
**Pass Criteria:** All 5 tests must pass

### FT-8.1: Switch Template Mid-Service
**Objective:** Verify technician can switch template during service

**Test Steps:**
1. Create ticket with "Warranty Service" template (3 tasks)
2. Assign to technician@example.com
3. Login as Technician
4. Complete first task: "Initial Diagnosis"
5. Add completion notes: "Discovered issue requires paid repair instead of warranty"
6. Click "Switch Template" button
7. Template switch modal opens
8. Select "Paid Repair" template
9. Preview shows all tasks from new template
10. Enter reason: "Customer issue not covered under warranty - requires motherboard replacement"
11. Confirm switch
12. Verify success message
13. Observe task list updated
14. Check database:

```sql
-- Check template change recorded
SELECT ticket_id, old_template_id, new_template_id, reason,
       tasks_before, tasks_after, completed_tasks_preserved, changed_by
FROM ticket_template_changes
WHERE ticket_id = '[TICKET_ID]'
ORDER BY changed_at DESC
LIMIT 1;

-- Check tasks updated
SELECT title, task_order, status
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]'
ORDER BY task_order;
-- Should show: completed task preserved + new tasks from new template
```

**Expected Result:**
- ✅ "Switch Template" button visible on in-progress tickets
- ✅ Modal displays all available templates
- ✅ Preview shows tasks from selected template
- ✅ Reason field validates (min 10 characters)
- ✅ Template switches successfully
- ✅ Completed tasks preserved (still show as completed)
- ✅ New tasks added from new template
- ✅ Audit record created in ticket_template_changes
- ✅ Success message displayed

**Actual Result:**
- [ ] PASS [ ] FAIL

**Template Switch Details:**
- Old template: _____________
- New template: _____________
- Tasks before: ___
- Tasks after: ___
- Completed preserved: ___

**Evidence:**
- Screenshot of switch modal: _____________
- Screenshot of template preview: _____________
- Screenshot of updated task list: _____________
- SQL output: _____________

**Notes:**

---

### FT-8.2: Template Preview in Switch Modal
**Objective:** Verify template preview shows all tasks before switching

**Test Steps:**
1. Continue from FT-8.1 or create new in-progress ticket
2. Click "Switch Template"
3. Select different template from dropdown
4. Observe preview section
5. Verify preview displays:
   - Template name
   - Service type
   - All tasks with order numbers
   - Task titles
   - Expected sequence
6. Select another template
7. Verify preview updates immediately

**Expected Result:**
- ✅ Preview section visible in modal
- ✅ Preview updates when template selection changes
- ✅ All tasks from selected template displayed
- ✅ Task order shown correctly
- ✅ Template name and service type displayed
- ✅ No lag or delay in preview update

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of template preview: _____________

**Notes:**

---

### FT-8.3: Audit Trail for Template Changes
**Objective:** Verify template changes are logged for audit purposes

**Test Steps:**
1. Use ticket from FT-8.1 where template was switched
2. Login as Admin or Manager
3. Navigate to ticket detail page
4. Look for "Template Change History" section or audit log
5. Verify displayed information:
   - Change date/time
   - Changed by (technician name)
   - Old template name
   - New template name
   - Reason for change
   - Task counts (before/after)
6. Verify in database:

```sql
-- Check audit trail
SELECT
  ttc.changed_at,
  p.full_name as changed_by,
  old_tt.name as old_template,
  new_tt.name as new_template,
  ttc.reason,
  ttc.tasks_before,
  ttc.tasks_after,
  ttc.completed_tasks_preserved
FROM ticket_template_changes ttc
JOIN profiles p ON p.id = ttc.changed_by
JOIN task_templates old_tt ON old_tt.id = ttc.old_template_id
JOIN task_templates new_tt ON new_tt.id = ttc.new_template_id
WHERE ttc.ticket_id = '[TICKET_ID]'
ORDER BY ttc.changed_at DESC;
```

**Expected Result:**
- ✅ Audit trail visible in UI
- ✅ All template changes logged
- ✅ Change details include: who, when, what, why
- ✅ Reason displayed in audit log
- ✅ Task counts shown (before/after)
- ✅ Database records complete audit trail
- ✅ Changes immutable (cannot be deleted)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of audit trail in UI: _____________
- SQL output: _____________

**Notes:**

---

### FT-8.4: Validation - Cannot Switch on Completed Ticket
**Objective:** Verify system prevents template switching on completed tickets

**Test Steps:**
1. Create new ticket with any template
2. Complete all tasks on the ticket
3. Verify ticket status is "completed"
4. Try to click "Switch Template" button
5. Observe button state (should be disabled or not visible)
6. Alternatively, try to access template switch via API/URL manipulation
7. Verify error response

**Expected Result:**
- ✅ "Switch Template" button disabled on completed tickets
- ✅ Or button not visible at all
- ✅ Tooltip explains: "Cannot switch template on completed ticket"
- ✅ Direct API call returns error: "Template switching not allowed on completed tickets"
- ✅ HTTP status: 400 Bad Request or 422 Unprocessable Entity

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot showing disabled button: _____________
- Error message: _____________

**Notes:**

---

### FT-8.5: Validation - Cannot Switch When All Tasks Complete
**Objective:** Verify system prevents switching when all current tasks are done

**Test Steps:**
1. Create ticket with template (3 tasks)
2. Complete all 3 tasks
3. Before ticket auto-advances to "completed"
4. Try to click "Switch Template" button
5. Observe button state or error message
6. Verify validation logic

**Expected Result:**
- ✅ System prevents template switch when all tasks completed
- ✅ Error message: "Cannot switch template when all tasks are complete"
- ✅ Suggestion: "Complete the ticket or unblock a task to continue"
- ✅ Validation prevents pointless template switches

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of validation error: _____________

**Notes:**

---

## Feature Acceptance Test Summary

| Story | Test IDs | Total | Executed | Passed | Failed | Blocked | Pass Rate |
|-------|----------|-------|----------|--------|--------|---------|-----------|
| 1.2 - Task Templates | FT-1.1 to FT-1.4 | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.4 - Task Execution | FT-2.1 to FT-2.4 | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.5 - Dependencies | FT-3.1 to FT-3.3 | 3 | ___ | ___ | ___ | ___ | ___% |
| 1.6-1.10 - Warehouse | FT-4.1 to FT-4.4 | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.11-1.14 - Public Portal | FT-5.1 to FT-5.5 | 5 | ___ | ___ | ___ | ___ | ___% |
| 1.15 - Email System | FT-6.1 to FT-6.4 | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.16 - Manager Dashboard | FT-7.1 to FT-7.4 | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.17 - Template Switching | FT-8.1 to FT-8.5 | 5 | ___ | ___ | ___ | ___ | ___% |
| **TOTAL** | **FT-1.1 to FT-8.5** | **88** | **___** | **___** | **___** | **___** | **___%** |

**Pass Criteria:** 95%+ pass rate = 84+ tests must pass
**Critical Failures:** ___ (must be zero for P0 tests)

---

## Final Assessment

**Overall Pass Rate:** ___% (Target: 95%+)

**Result:** [ ] APPROVED [ ] REJECTED

**Critical Issues Found:** ___

**Recommendations:**

---

## Sign-Off

**Tester:** _______________ Date: _______________
**QA Lead:** _______________ Date: _______________
**Approval:** [ ] PASS - Proceed to next test category [ ] FAIL - Fix issues and retest

---

**Next Steps:**
- If ALL PASS: Proceed to Regression Testing Checklist
- If ANY FAIL: Log bugs, fix, retest failed cases

**References:**
- Test Plan: docs/TEST_PLAN.md
- Master Tracker: docs/qa/test-execution/MASTER-TEST-EXECUTION-TRACKER.md
- Quality Gate: docs/qa/gates/epic-01-phase2-quality-gate.yaml
