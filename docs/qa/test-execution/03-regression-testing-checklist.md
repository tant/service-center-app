# Regression Testing Checklist - EPIC-01 Phase 2

**Priority:** P1 - HIGH
**Pass Criteria:** 95%+ pass rate (13+ of 13 tests must pass)
**Estimated Time:** 2-3 hours
**Total Tests:** 13
**Scope:** Verify Phase 1 features still work after Phase 2 implementation

**⚠️ IMPORTANT:** This test category ensures Phase 2 changes didn't break existing functionality.

---

## Pre-Test Setup

**Test Environment:**
- [ ] Application running: http://localhost:3025
- [ ] Supabase Studio accessible: http://localhost:54323
- [ ] Test accounts ready (Admin, Manager, Technician, Reception)
- [ ] Phase 1 test data available

**Test Data:**
- [ ] Existing customers in database
- [ ] Existing products in database
- [ ] Existing parts in database
- [ ] Test tickets from Phase 1

---

## Test Category 1: Ticket Management (Phase 1 Core Feature)

**Tests:** 5
**Priority:** CRITICAL
**Pass Criteria:** All 5 tests must pass

### RT-1.1: Create New Ticket
**Objective:** Verify ticket creation still works with auto-generated numbering

**Test Steps:**
1. Login as Admin or Reception
2. Navigate to `/tickets`
3. Click "New Ticket" button
4. Fill ticket form:
   - Customer: Select existing customer
   - Product: Select product
   - Issue Description: "Test regression - screen not working"
   - Service Type: "warranty"
   - Priority: "high"
5. Save ticket
6. Verify success message
7. Check ticket list for new ticket
8. Verify ticket number format: SV-YYYY-NNN
9. Query database:

```sql
SELECT ticket_number, customer_id, status, created_at
FROM service_tickets
ORDER BY created_at DESC
LIMIT 1;
-- Verify ticket_number matches format SV-2025-XXX
```

**Expected Result:**
- ✅ Ticket creation form displays
- ✅ All fields validate correctly
- ✅ Ticket saves successfully
- ✅ Auto-generated ticket number in format SV-YYYY-NNN
- ✅ Ticket appears in ticket list
- ✅ Initial status is "pending"

**Actual Result:**
- [ ] PASS [ ] FAIL

**Ticket Details:**
- Ticket number: _____________
- Status: _____________

**Evidence:**
- Screenshot of ticket form: _____________
- Screenshot of ticket list: _____________
- SQL output: _____________

**Notes:**

---

### RT-1.2: Edit Existing Ticket
**Objective:** Verify ticket editing functionality still works

**Test Steps:**
1. Login as Admin
2. Navigate to ticket list
3. Open ticket created in RT-1.1
4. Click "Edit" button
5. Modify ticket details:
   - Change issue description
   - Change priority to "medium"
   - Add estimated cost
6. Save changes
7. Verify success message
8. Reload ticket detail page
9. Verify changes persisted
10. Check database:

```sql
SELECT ticket_number, issue_description, priority, estimated_cost, updated_at
FROM service_tickets
WHERE ticket_number = '[TICKET_NUMBER]';
```

**Expected Result:**
- ✅ Edit form opens with current data
- ✅ Changes save successfully
- ✅ updated_at timestamp changes
- ✅ All modifications reflected in database
- ✅ No data loss or corruption

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot before edit: _____________
- Screenshot after edit: _____________
- SQL output: _____________

**Notes:**

---

### RT-1.3: Update Ticket Status
**Objective:** Verify ticket status transitions work correctly

**Test Steps:**
1. Create or use existing ticket in "pending" status
2. Login as Admin or Manager
3. Open ticket detail
4. Change status to "in_progress"
5. Save
6. Verify status updated
7. Change status to "completed"
8. Save
9. Verify status updated
10. Try to change completed ticket back to "pending" (should be blocked by RLS)
11. Check database:

```sql
SELECT ticket_number, status, updated_at
FROM service_tickets
WHERE ticket_number = '[TICKET_NUMBER]';
```

**Expected Result:**
- ✅ Status changes from "pending" to "in_progress" successfully
- ✅ Status changes from "in_progress" to "completed" successfully
- ✅ Cannot modify completed ticket (RLS protection)
- ✅ Database reflects status changes
- ✅ Status transitions follow allowed flow

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshots of status changes: _____________
- SQL output: _____________

**Notes:**

---

### RT-1.4: Add Parts to Ticket
**Objective:** Verify parts can still be added to tickets and totals calculate correctly

**Test Steps:**
1. Create or use existing ticket
2. Navigate to ticket detail page
3. Go to "Parts" tab
4. Click "Add Part"
5. Select part from inventory
6. Enter quantity: 2
7. Enter unit price: 100000
8. Save
9. Verify part appears in ticket parts list
10. Add another part:
    - Quantity: 1
    - Unit price: 50000
11. Verify total_parts calculated: 2*100000 + 1*50000 = 250000
12. Check database:

```sql
-- Check parts added
SELECT p.name, stp.quantity, stp.unit_price, stp.subtotal
FROM service_ticket_parts stp
JOIN parts p ON p.id = stp.part_id
WHERE stp.service_ticket_id = '[TICKET_ID]';

-- Check total calculated
SELECT ticket_number, total_parts, service_fee, total_cost
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- total_parts should be 250000
```

**Expected Result:**
- ✅ Parts can be added to ticket
- ✅ Quantity and unit price validated
- ✅ Subtotal calculated automatically: quantity * unit_price
- ✅ total_parts updated automatically via trigger
- ✅ total_cost recalculated: service_fee + total_parts - discount
- ✅ Database reflects accurate totals

**Actual Result:**
- [ ] PASS [ ] FAIL

**Calculations:**
- Part 1 subtotal: ___
- Part 2 subtotal: ___
- Total parts: ___
- Total cost: ___

**Evidence:**
- Screenshot of parts list: _____________
- SQL output: _____________

**Notes:**

---

### RT-1.5: Add Comments to Ticket
**Objective:** Verify comments functionality still works

**Test Steps:**
1. Open existing ticket
2. Navigate to "Comments" tab
3. Enter comment: "Test regression comment - verifying comment system works"
4. Submit
5. Verify comment appears in list
6. Verify comment shows:
   - Comment text
   - User who posted (your username)
   - Timestamp
7. Add another comment
8. Verify both comments visible
9. Check database:

```sql
SELECT comment, created_by, created_at
FROM service_ticket_comments
WHERE service_ticket_id = '[TICKET_ID]'
ORDER BY created_at DESC;
```

**Expected Result:**
- ✅ Comment form displays
- ✅ Comment saves successfully
- ✅ Comment appears in list immediately
- ✅ User and timestamp recorded correctly
- ✅ Multiple comments can be added
- ✅ Comments ordered by timestamp (newest first)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of comments: _____________
- SQL output: _____________

**Notes:**

---

## Test Category 2: Customer Management

**Tests:** 3
**Priority:** HIGH
**Pass Criteria:** All 3 tests must pass

### RT-2.1: Create Customer
**Objective:** Verify customer creation functionality works

**Test Steps:**
1. Login as Admin or Reception
2. Navigate to `/customers`
3. Click "New Customer"
4. Fill customer form:
   - Full Name: "Test Customer Regression"
   - Phone: "0987654321"
   - Email: "test.regression@example.com"
   - Address: "123 Test St, Test City"
5. Save customer
6. Verify success message
7. Find customer in customer list
8. Check database:

```sql
SELECT full_name, phone, email, address, created_at
FROM customers
WHERE phone = '0987654321';
```

**Expected Result:**
- ✅ Customer form displays
- ✅ Validation enforces required fields
- ✅ Customer saves successfully
- ✅ Customer appears in customer list
- ✅ All data saved correctly in database

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of customer form: _____________
- Screenshot of customer list: _____________
- SQL output: _____________

**Notes:**

---

### RT-2.2: Edit Customer
**Objective:** Verify customer data can be updated

**Test Steps:**
1. Open customer created in RT-2.1
2. Click "Edit"
3. Modify details:
   - Change address to "456 Updated St, New City"
   - Change email to "test.updated@example.com"
4. Save changes
5. Verify success message
6. Reload customer detail
7. Verify changes persisted
8. Check database:

```sql
SELECT full_name, email, address, updated_at
FROM customers
WHERE phone = '0987654321';
```

**Expected Result:**
- ✅ Edit form opens with current data
- ✅ Changes save successfully
- ✅ updated_at timestamp updated
- ✅ All modifications reflected in database

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot after edit: _____________
- SQL output: _____________

**Notes:**

---

### RT-2.3: View Customer Tickets
**Objective:** Verify customer ticket history displays correctly

**Test Steps:**
1. Create 2-3 tickets for customer from RT-2.1
2. Navigate to customer detail page
3. Go to "Tickets" tab
4. Verify all customer tickets displayed
5. Verify ticket information shown:
   - Ticket number
   - Issue description
   - Status
   - Created date
6. Click on a ticket to view details
7. Check database:

```sql
SELECT COUNT(*) as ticket_count
FROM service_tickets
WHERE customer_id = '[CUSTOMER_ID]';
-- Should match count displayed in UI
```

**Expected Result:**
- ✅ Customer tickets tab displays all tickets
- ✅ Ticket count matches database
- ✅ Ticket information accurate
- ✅ Tickets clickable to view details
- ✅ Tickets ordered by date (newest first)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Ticket Count:**
- Displayed in UI: ___
- Count in database: ___

**Evidence:**
- Screenshot of customer tickets: _____________
- SQL output: _____________

**Notes:**

---

## Test Category 3: Parts Inventory

**Tests:** 3
**Priority:** HIGH
**Pass Criteria:** All 3 tests must pass

### RT-3.1: Add New Part
**Objective:** Verify parts can be created with SKU

**Test Steps:**
1. Login as Admin
2. Navigate to `/parts`
3. Click "New Part"
4. Fill part form:
   - Name: "Test Part Regression"
   - SKU: "TEST-REG-001"
   - Category: "Electronics"
   - Unit Price: 75000
   - Stock Quantity: 50
5. Save part
6. Verify success message
7. Find part in parts list
8. Check database:

```sql
SELECT name, sku, category, unit_price, stock_quantity
FROM parts
WHERE sku = 'TEST-REG-001';
```

**Expected Result:**
- ✅ Part form displays
- ✅ SKU uniqueness enforced
- ✅ Part saves successfully
- ✅ Part appears in parts list
- ✅ All data saved correctly

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of part form: _____________
- Screenshot of parts list: _____________
- SQL output: _____________

**Notes:**

---

### RT-3.2: Update Part Stock
**Objective:** Verify part stock quantity can be updated

**Test Steps:**
1. Open part created in RT-3.1
2. Click "Update Stock" or "Edit"
3. Change stock quantity from 50 to 75
4. Save
5. Verify success message
6. Reload part detail
7. Verify stock quantity is 75
8. Check database:

```sql
SELECT name, sku, stock_quantity, updated_at
FROM parts
WHERE sku = 'TEST-REG-001';
```

**Expected Result:**
- ✅ Stock quantity can be updated
- ✅ Changes save successfully
- ✅ Database reflects new quantity
- ✅ updated_at timestamp changed

**Actual Result:**
- [ ] PASS [ ] FAIL

**Stock Tracking:**
- Original stock: 50
- Updated stock: ___
- Expected: 75

**Evidence:**
- Screenshot after update: _____________
- SQL output: _____________

**Notes:**

---

### RT-3.3: Search Parts
**Objective:** Verify parts search functionality works

**Test Steps:**
1. Navigate to `/parts`
2. Use search box
3. Search for "Test Part Regression"
4. Verify part appears in results
5. Search for SKU "TEST-REG-001"
6. Verify part appears in results
7. Search for non-existent part "ZZZZZ"
8. Verify "No results" message

**Expected Result:**
- ✅ Search by name returns correct results
- ✅ Search by SKU returns correct results
- ✅ Search is case-insensitive
- ✅ No results shows appropriate message
- ✅ Search is performant (<1 second)

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of search results: _____________

**Notes:**

---

## Test Category 4: Authentication & Navigation

**Tests:** 2
**Priority:** CRITICAL
**Pass Criteria:** Both tests must pass

### RT-4.1: User Login and Role-Based Access
**Objective:** Verify authentication and role permissions still work

**Test Steps:**
1. Logout from application
2. Navigate to `/login`
3. Login as Admin (admin@example.com)
4. Verify redirect to `/dashboard`
5. Verify admin menu items visible:
   - Templates
   - Warehouses
   - Inventory
   - Team
6. Logout
7. Login as Technician (technician@example.com)
8. Verify technician-specific menu visible:
   - My Tasks
   - Tickets
9. Verify admin-only features not visible
10. Check database session:

```sql
-- This checks Supabase auth, may require admin access
-- Verify user authenticated correctly
```

**Expected Result:**
- ✅ Login page accessible
- ✅ Valid credentials allow login
- ✅ Invalid credentials rejected
- ✅ Admin sees all menu items
- ✅ Technician sees limited menu items
- ✅ Role-based access enforced

**Actual Result:**
- [ ] PASS [ ] FAIL

**Evidence:**
- Screenshot of admin dashboard: _____________
- Screenshot of technician dashboard: _____________

**Notes:**

---

### RT-4.2: Navigation Between Pages
**Objective:** Verify all navigation links work

**Test Steps:**
1. Login as Admin
2. Navigate through main menu items:
   - Dashboard
   - Tickets
   - Customers
   - Products
   - Parts
   - Workflows → Templates
   - Inventory → Warehouses
   - Inventory → Stock Levels
   - Inventory → RMA
   - Team
3. Verify each page loads successfully
4. Check browser console for errors
5. Verify no broken links

**Expected Result:**
- ✅ All menu items clickable
- ✅ All pages load without errors
- ✅ No 404 errors
- ✅ Navigation is smooth
- ✅ No console errors

**Actual Result:**
- [ ] PASS [ ] FAIL

**Pages Tested:**
- Dashboard: [ ] OK [ ] Error
- Tickets: [ ] OK [ ] Error
- Customers: [ ] OK [ ] Error
- Products: [ ] OK [ ] Error
- Parts: [ ] OK [ ] Error
- Templates: [ ] OK [ ] Error
- Warehouses: [ ] OK [ ] Error
- Stock Levels: [ ] OK [ ] Error
- RMA: [ ] OK [ ] Error
- Team: [ ] OK [ ] Error

**Evidence:**
- Console errors (if any): _____________

**Notes:**

---

## Regression Test Summary

| Category | Test IDs | Total | Executed | Passed | Failed | Pass Rate |
|----------|----------|-------|----------|--------|--------|-----------|
| Ticket Management | RT-1.1 to RT-1.5 | 5 | ___ | ___ | ___ | ___% |
| Customer Management | RT-2.1 to RT-2.3 | 3 | ___ | ___ | ___ | ___% |
| Parts Inventory | RT-3.1 to RT-3.3 | 3 | ___ | ___ | ___ | ___% |
| Auth & Navigation | RT-4.1 to RT-4.2 | 2 | ___ | ___ | ___ | ___% |
| **TOTAL** | **RT-1.1 to RT-4.2** | **13** | **___** | **___** | **___** | **___%** |

**Pass Criteria:** 95%+ pass rate = 13+ tests must pass
**Critical Failures:** ___ (must be zero)

---

## Final Assessment

**Overall Pass Rate:** ___% (Target: 95%+)

**Result:** [ ] APPROVED [ ] REJECTED

**Regression Issues Found:** ___

**Phase 1 Features Still Working:** [ ] YES [ ] NO

**Recommendations:**

---

## Sign-Off

**Tester:** _______________ Date: _______________
**QA Lead:** _______________ Date: _______________
**Approval:** [ ] PASS - No regression detected [ ] FAIL - Regression issues must be fixed

---

**Next Steps:**
- If ALL PASS: Proceed to Performance Testing Checklist
- If ANY FAIL: Log regression bugs (HIGH PRIORITY), fix immediately, retest

**References:**
- Test Plan: docs/TEST_PLAN.md
- Master Tracker: docs/qa/test-execution/MASTER-TEST-EXECUTION-TRACKER.md
