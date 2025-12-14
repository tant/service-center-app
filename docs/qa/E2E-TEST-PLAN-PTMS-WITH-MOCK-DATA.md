# E2E Test Plan: PTMS with Mock Data (Practical Edition)

**Project:** PTMS-2025 - Polymorphic Task Management System
**Version:** 2.0 (Data-Driven)
**Date:** November 3, 2025
**Mock Data:** `docs/data/mock-data-ptms-v4.json`
**Status:** Ready for Execution

---

## 📋 Overview

This test plan uses **pre-configured mock data** from `mock-data-ptms-v4.json` to provide realistic, executable E2E tests. Each scenario references specific test data entities, making testing straightforward and reproducible.

### Prerequisites

**1. Load Mock Data:**
```bash
# Run mock data import script (to be created)
pnpm run seed:ptms-test-data
```

**2. Test Accounts (from mock data):**
- **Manager:** manager@sstc.vn / tantran
- **Tech 1:** tech1@sstc.vn / tantran (Trần Văn Tech - 5 active tasks)
- **Tech 2:** tech2@sstc.vn / tantran (Lê Thị Kỹ Thuật - 2 active tasks)
- **Tech 3:** tech3@sstc.vn / tantran (Phạm Văn Sửa Chữa - 3 active tasks)
- **Reception:** reception@sstc.vn / tantran

**3. Expected Data After Import:**
- 10 customers
- 12 task types in library
- 5 workflow templates (one per entity type)
- 3 serial entry test receipts (Scenario 1)
- 5 service tickets (Scenario 2)
- 4 service requests (Scenario 3)
- 3 transfers (Scenario 4)
- Mixed workload setup (Scenario 5)

---

## 🧪 Test Execution Guide

### Estimated Time: 6-8 hours
### Pass Criteria: ≥95% scenarios pass

---

## PHASE 1: FOUNDATION (2-3 hours)

---

### Test 1.1: Unified Dashboard - View All Entity Types

**Objective:** Verify dashboard shows tasks from all 5 entity types

**Login:** tech1@sstc.vn (Trần Văn Tech)

**Test Steps:**

1. Navigate to `/my-tasks`
2. Observe dashboard load time (DevTools → Network)

**Expected Results:**

✅ Dashboard displays **5 active tasks** for tech1:
- 1x Service ticket task (diagnosis) - in_progress
- 1x Service ticket task (part replacement) - in_progress
- 1x Service ticket task (inspection) - pending
- 1x Transfer task (check) - pending
- 1x Service request task (receiving) - pending

✅ Each task shows:
- Correct entity type icon/badge
- Entity context (ticket number, receipt number, etc.)
- Status indicator (green for in_progress, gray for pending)
- Priority badge

✅ Load time <500ms

**Pass Criteria:** All 5 tasks visible with correct entity context

---

### Test 1.2: Task Filtering by Status

**Objective:** Filter tasks by status

**Login:** tech1@sstc.vn

**Test Steps:**

1. On `/my-tasks`, click "Status" filter
2. Select "In Progress"
3. Verify only 2 tasks shown (diagnosis + part replacement)
4. Select "Pending"
5. Verify only 3 tasks shown (inspection + transfer + service request)
6. Select "All"
7. Verify all 5 tasks shown again

**Expected Results:**

✅ Filter works correctly
✅ Task counts accurate
✅ No page reload needed

**Pass Criteria:** Filtering accurate for all status values

---

### Test 1.3: Task Lifecycle - Start a Pending Task

**Objective:** Start a pending task and verify timestamps

**Login:** tech3@sstc.vn (Phạm Văn Sửa Chữa)

**Test Steps:**

1. Navigate to `/my-tasks`
2. Find task: "Kiểm tra sản phẩm" (Service ticket inspection - pending)
3. Note current time
4. Click "Start Task" button
5. Observe toast notification
6. Check DevTools → Network → Response for `startTask` API call
7. Verify response includes `started_at` timestamp

**Expected Results:**

✅ Task status changes to "In Progress"
✅ Button changes from "Start" to "Complete"
✅ Toast: "Task started successfully"
✅ `started_at` timestamp accurate (within 1 second)
✅ Task moved to "In Progress" section

**Pass Criteria:** Timestamps accurate, UI updates immediately

---

### Test 1.4: Task Lifecycle - Complete an In-Progress Task

**Objective:** Complete task and verify completion timestamp

**Login:** tech1@sstc.vn

**Test Steps:**

1. Navigate to `/my-tasks`
2. Find task: "Chẩn đoán lỗi" (Service ticket diagnosis - in_progress)
3. Click "Complete Task" button
4. Enter notes: "Lỗi do capacitor nguồn hỏng, cần thay thế"
5. Click "Submit"
6. Note current time

**Expected Results:**

✅ Task status changes to "Completed"
✅ `completed_at` timestamp set
✅ Duration calculated (should be ~1h based on `started_at` in mock data)
✅ Task moved to "Completed" section
✅ Notes saved and visible in task detail

**Pass Criteria:** Task completes successfully with accurate duration

---

### Test 1.5: Entity Context Display - Service Ticket

**Objective:** Verify task shows correct service ticket context

**Login:** tech2@sstc.vn

**Test Steps:**

1. Navigate to `/my-tasks`
2. Find task: "Kiểm tra chất lượng" (for completed RAM repair ticket)
3. Click task to open detail panel

**Expected Results:**

✅ Task detail shows:
- Customer name: "Phạm Thị D"
- Product: "SSTC DDR4 16GB 3200MHz"
- Serial: "RAM16G-W01-001"
- Ticket number (e.g., "SV-2025-XXX")
- Link to ticket detail page
- Current ticket status: "in_progress"

**Pass Criteria:** Service ticket context complete and accurate

---

### Test 1.6: Entity Context Display - Serial Entry Task

**Objective:** Verify task shows receipt context with progress

**Login:** tech1@sstc.vn

**Test Steps:**

1. Navigate to `/my-tasks/serial-entry`
2. Find task: "Nhập serial vào hệ thống" for "Test Scenario 1A"
3. Click task card

**Expected Results:**

✅ Task detail shows:
- Receipt number (e.g., "GRN-2025-XXX")
- Product: "ZOTAC RTX 4070 Gaming"
- Progress: "0/10 serials"
- Progress bar: RED (0%)
- Link to receipt detail page
- Due date

**Pass Criteria:** Receipt context with progress tracking visible

---

### Test 1.7: Sequence Enforcement

**Objective:** Verify strict sequence prevents out-of-order execution

**Login:** tech3@sstc.vn

**Test Steps:**

1. Navigate to `/my-tasks`
2. Find pending service ticket with workflow "Quy trình sửa chữa chuẩn"
3. Find task #3: "Thay linh kiện" (status: pending)
4. Verify task #1 and #2 are not yet completed
5. Try to click "Start Task" on task #3

**Expected Results:**

✅ Button disabled OR error message displayed
✅ Error: "Không thể bắt đầu task này vì task trước chưa hoàn thành"
✅ Task remains pending
✅ No status change

**Pass Criteria:** Sequence enforcement prevents out-of-order start

---

### Test 1.8: Auto-Progression - Service Ticket

**Objective:** Complete all required tasks and verify ticket auto-completes

**Login:** tech2@sstc.vn + reception@sstc.vn

**Test Data:** Use the completed Mini PC ticket (ZBOX-W03-001) from Scenario 2

**Test Steps:**

1. Login as tech2, navigate to completed ticket detail
2. Verify all 6 tasks marked "completed"
3. Check ticket status

**Expected Results:**

✅ All required tasks completed:
- Kiểm tra sản phẩm ✓
- Chẩn đoán lỗi ✓
- Thay linh kiện ✓
- Kiểm tra chất lượng ✓
- Liên hệ khách hàng ✓
- Đóng gói sản phẩm ✓

✅ Ticket status automatically: "completed"
✅ No manual status update needed
✅ Completion timestamp recorded

**Pass Criteria:** Auto-progression works when all required tasks complete

---

### Test 1.9: Task Visibility by User

**Objective:** Verify users only see their assigned tasks

**Test Steps:**

1. Login as tech1@sstc.vn
2. Navigate to `/my-tasks`
3. Count tasks (should be 5)
4. Logout

5. Login as tech2@sstc.vn
6. Navigate to `/my-tasks`
7. Count tasks (should be 2)
8. Logout

9. Login as tech3@sstc.vn
10. Navigate to `/my-tasks`
11. Count tasks (should be 3)

**Expected Results:**

✅ Tech 1 sees 5 tasks (only their assignments)
✅ Tech 2 sees 2 tasks (only their assignments)
✅ Tech 3 sees 3 tasks (only their assignments)
✅ No overlap - each sees different tasks
✅ Manager can see all team tasks

**Pass Criteria:** Task visibility correctly filtered by assignment

---

### Test 1.10: Performance - Dashboard Load Time

**Objective:** Verify performance benchmarks met

**Login:** tech1@sstc.vn (highest task count)

**Test Steps:**

1. Open browser DevTools → Network tab
2. Clear cache
3. Navigate to `/my-tasks`
4. Record:
   - Page load time (DOMContentLoaded)
   - API response time for `tasks.myTasks`
   - Time to interactive

**Expected Results:**

✅ Page load time: <500ms (target: ~350ms)
✅ API response time: <200ms (target: ~150ms)
✅ No UI lag or freezing
✅ Smooth scrolling

**Pass Criteria:** All performance benchmarks met

---

## PHASE 2: SERIAL ENTRY (1.5-2 hours)

---

### Test 2.1: Auto-Create Serial Entry Tasks

**Objective:** Verify tasks auto-created when receipt approved

**Login:** manager@sstc.vn

**Test Data:** Scenario 1A (No serials yet)

**Test Steps:**

1. Create NEW inventory receipt:
   - Warehouse: "Công ty"
   - Product: "ZOTAC RTX 4070 Gaming"
   - Quantity: 8
   - Virtual warehouse: "Kho Chính"
2. Save receipt (status = 'pending')
3. Navigate to receipt detail page
4. Click "Approve" button
5. Confirm approval

**Expected Results:**

✅ Receipt status changes to "approved"
✅ Stock increased by 8 immediately
✅ Navigate to `/my-tasks/serial-entry`
✅ New serial entry task created:
- Task name: "Nhập serial cho ZOTAC RTX 4070 Gaming"
- Progress: "0/8 serials"
- Status: "pending"
- Priority: "high"
✅ Task assigned to a technician

**Pass Criteria:** Task auto-created, stock updated immediately

---

### Test 2.2: Serial Entry Progress - 0% to 50%

**Objective:** Test progress tracking from 0% to 50%

**Login:** tech1@sstc.vn

**Test Data:** Scenario 1A receipt

**Test Steps:**

1. Navigate to `/my-tasks/serial-entry`
2. Find the task created in Test 2.1
3. Click task → Navigate to receipt detail
4. Start entering serials:
   - Serial 1: "TEST-E2E-001"
   - Serial 2: "TEST-E2E-002"
   - Serial 3: "TEST-E2E-003"
   - Serial 4: "TEST-E2E-004"
5. Observe progress bar after each serial

**Expected Results:**

✅ After serial 1: "1/8 (12.5%)" - RED bar
✅ After serial 2: "2/8 (25%)" - RED bar
✅ After serial 3: "3/8 (37.5%)" - RED bar
✅ After serial 4: "4/8 (50%)" - YELLOW bar (color changes at 50%)
✅ Task status still "in_progress" (not completed yet)
✅ Each serial auto-saves after 500ms

**Pass Criteria:** Progress tracking accurate, color coding works

---

### Test 2.3: Serial Entry Progress - 50% to 100%

**Objective:** Test progress from 50% to 100% and auto-completion

**Login:** tech1@sstc.vn (continue from Test 2.2)

**Test Steps:**

1. Continue entering serials:
   - Serial 5: "TEST-E2E-005"
   - Serial 6: "TEST-E2E-006"
   - Serial 7: "TEST-E2E-007"
2. Before entering serial 8, note progress: "7/8 (87.5%)" - YELLOW
3. Enter serial 8: "TEST-E2E-008"
4. Observe what happens

**Expected Results:**

✅ After serial 8: "8/8 (100%)" - GREEN bar
✅ Task automatically marked "completed"
✅ `completed_at` timestamp set
✅ Receipt status changes to "completed"
✅ Task removed from `/my-tasks/serial-entry` dashboard
✅ Task visible in `/my-tasks` under "Completed" section

**Pass Criteria:** Auto-completion at 100%, status progression works

---

### Test 2.4: Serial Entry - Resume Partial Entry

**Objective:** Verify partial progress persists across sessions

**Login:** tech2@sstc.vn

**Test Data:** Scenario 1B (Partial serials - 10/20 complete)

**Test Steps:**

1. Navigate to `/my-tasks/serial-entry`
2. Find task for Scenario 1B (RTX 4060 Ti, 20 units)
3. Click task → Navigate to receipt detail
4. Verify existing serials displayed
5. Count serials already entered (should be 10)
6. Add 5 more serials:
   - "TEST-4060-011" through "TEST-4060-015"
7. Log out
8. Log back in as tech2
9. Navigate back to same receipt

**Expected Results:**

✅ Previous 10 serials still present
✅ New 5 serials saved
✅ Progress shows "15/20 (75%)" - YELLOW
✅ Can continue entry from where left off
✅ No data loss across sessions

**Pass Criteria:** Partial entry persists reliably

---

### Test 2.5: Serial Entry - Duplicate Detection

**Objective:** Test system-wide duplicate validation

**Login:** tech3@sstc.vn

**Test Data:** Scenario 1C (Almost complete - 9/10 serials)

**Test Steps:**

1. Navigate to receipt for Scenario 1C
2. Try to enter duplicate serial: "TEST-SSD-001" (already entered)
3. Observe error

4. Try to enter a serial from different receipt: "TEST-E2E-001" (from Test 2.2)
5. Observe error

6. Enter valid unique serial: "TEST-SSD-010"
7. Observe completion

**Expected Results:**

✅ Step 2: Error displayed - "Serial number đã tồn tại trong hệ thống"
✅ Step 2: Serial not saved, input highlighted red
✅ Step 4: Error displayed - "Serial number đã tồn tại trong hệ thống"
✅ Step 4: System-wide check prevents duplicate across receipts
✅ Step 6: Valid serial accepted
✅ Step 6: Progress reaches 100%, task auto-completes

**Pass Criteria:** Duplicate detection works system-wide

---

### Test 2.6: Serial Entry Dashboard - Priority Filters

**Objective:** Test serial entry dashboard filters

**Login:** tech1@sstc.vn

**Test Steps:**

1. Navigate to `/my-tasks/serial-entry`
2. Observe all serial tasks
3. Click "Mine" filter
4. Verify shows only tasks assigned to tech1
5. Click "Available" filter
6. Verify shows unassigned serial tasks
7. Click "All" filter
8. Verify shows all serial tasks in system

**Expected Results:**

✅ "Mine" shows only tech1's assigned serial tasks
✅ "Available" shows unassigned tasks (can self-assign)
✅ "All" shows system-wide serial tasks
✅ Each task card shows:
- Product name and image
- Receipt number
- Progress bar with %
- Color coding (red/yellow/green)
- Priority badge

**Pass Criteria:** Filters work correctly, UI clear and informative

---

### Test 2.7: Serial Entry - CSV Bulk Import

**Objective:** Test bulk serial import via CSV

**Login:** tech1@sstc.vn

**Preparation:**
1. Create CSV file `serials-bulk.csv`:
```csv
serial_number
BULK-001
BULK-002
BULK-003
BULK-004
BULK-005
```

**Test Steps:**

1. Create new receipt with 5 units
2. Approve receipt
3. Navigate to receipt detail
4. Find "Import CSV" button
5. Select `serials-bulk.csv`
6. Click "Upload"

**Expected Results:**

✅ CSV parsed successfully
✅ All 5 serials imported
✅ Progress jumps to "5/5 (100%)"
✅ Task auto-completes
✅ No duplicates allowed (if CSV contains duplicates, error shown)

**Pass Criteria:** Bulk import works, validation applied

---

### Test 2.8: 100% Serial Compliance Achievement

**Objective:** End-to-end verification of serial compliance

**Login:** manager@sstc.vn

**Test Steps:**

1. Navigate to `/dashboard`
2. Find "Serial Entry Compliance" widget
3. Check current compliance %
4. Create 3 new receipts (various products)
5. Approve all 3 receipts
6. Verify 3 serial entry tasks auto-created
7. Assign to technicians
8. Complete all 3 serial entries (100% each)
9. Return to dashboard
10. Check compliance widget again

**Expected Results:**

✅ Initial compliance: some % (based on existing data)
✅ 3 tasks auto-created on approval
✅ After completion: compliance increases
✅ Widget shows:
- Total receipts pending serial entry
- Compliance percentage
- Overdue count
- Color indicator (green if >95%)
✅ Click widget → Drill down shows details

**Pass Criteria:** Compliance tracking accurate, 100% achievable

---

## PHASE 3: ADVANCED FEATURES (2-3 hours)

---

### Test 3.1: Transfer Approval Workflow

**Objective:** Test high-value transfer approval

**Login:** manager@sstc.vn

**Test Data:** Scenario 4 - High value transfer (24M VND)

**Test Steps:**

1. Navigate to `/inventory/documents/transfers`
2. Find transfer: "Kho Chính → Kho Bảo Hành" (15x RTX 4070, 24M VND)
3. Verify status: "pending_approval"
4. Navigate to `/my-tasks`
5. Find approval task: "Phê duyệt phiếu" for this transfer
6. Click task to view details
7. Review transfer info
8. Click "Approve" button
9. Enter approval note: "Approved - high value transfer verified"
10. Submit

**Expected Results:**

✅ Transfer shows status "pending_approval" initially
✅ Approval task visible in manager's dashboard
✅ Task shows transfer details (value, quantity, from/to)
✅ After approval:
- Transfer status → "approved"
- Approval task → "completed"
- Next task ("Kiểm tra sản phẩm") becomes startable
- Audit log entry created with manager ID and timestamp

**Pass Criteria:** Approval workflow blocks execution, audit trail complete

---

### Test 3.2: Transfer Approval - Low Value (No Approval Needed)

**Objective:** Verify low-value transfers don't require approval

**Login:** tech1@sstc.vn

**Test Data:** Scenario 4 - Low value transfer (8M VND)

**Test Steps:**

1. Navigate to transfers list
2. Find transfer: "Kho Chính → Kho Bảo Hành" (5x RTX 4070, 8M VND)
3. Check status
4. Check manager's task dashboard

**Expected Results:**

✅ Transfer status: "pending" (NOT "pending_approval")
✅ No approval task created for manager
✅ Transfer can proceed directly to execution
✅ Tasks start with "Kiểm tra sản phẩm" (no approval task)

**Pass Criteria:** Low-value transfers skip approval step

---

### Test 3.3: Service Request - Draft Mode

**Objective:** Test draft saving and resumption

**Login:** reception@sstc.vn

**Test Data:** Scenario 3 - Draft request

**Test Steps:**

1. Navigate to `/operations/service-requests/new`
2. Fill partial form:
   - Customer phone: "0938765432" (Vũ Thị F)
   - Wait for auto-fill (name + email should populate)
   - Product serial: "ZT4070-W05-001"
   - Issue: "VGA không lên hình, cần kiểm tra"
   - Leave other fields blank
3. Click "Save Draft" button
4. Verify toast: "Draft saved successfully"
5. Navigate away to dashboard
6. Return to `/operations/service-requests`
7. Find draft in list (status: "draft")
8. Click "Edit Draft"
9. Verify data loaded
10. Complete remaining fields
11. Click "Submit Request"

**Expected Results:**

✅ Step 2: Customer name and email auto-fill after phone entry
✅ Step 3: Draft saved with status "draft"
✅ Step 4: Can navigate away without losing data
✅ Step 7: Draft visible in requests list
✅ Step 9: All previously entered data present
✅ Step 11: Request status changes to "received" or "pickingup"
✅ No tickets created for draft (only after submission)

**Pass Criteria:** Draft mode allows incomplete saves, data persists

---

### Test 3.4: Service Request - Phone Lookup

**Objective:** Test customer auto-fill via phone lookup

**Login:** reception@sstc.vn

**Test Steps:**

1. Navigate to `/operations/service-requests/new`
2. Test existing customer:
   - Enter phone: "0912345678"
   - Wait 500ms (debounce)
   - Observe auto-fill

3. Test new customer:
   - Clear form
   - Enter phone: "0999888777" (not in database)
   - Wait 500ms
   - Observe behavior

**Expected Results:**

✅ Step 2 (existing customer):
- Loading spinner appears
- Name auto-fills: "Nguyễn Văn A"
- Email auto-fills: "nguyenvana@gmail.com"
- Toast: "Tìm thấy thông tin khách hàng"
- Green checkmark next to phone field

✅ Step 3 (new customer):
- No error displayed (silent fail is correct)
- Name and email fields remain empty
- User can manually enter new customer info
- On submit, new customer created with unique phone

**Pass Criteria:** Phone lookup works, allows new customer creation

---

### Test 3.5: Service Request - Status Flow (Walk-In)

**Objective:** Test status flow for walk-in customer

**Login:** reception@sstc.vn

**Test Steps:**

1. Navigate to `/operations/service-requests/new`
2. Fill complete form:
   - Customer phone: "0928765432" (Đặng Văn G)
   - Product serial: "SSD512-W09-001"
   - Issue: "SSD chạy chậm, cần kiểm tra"
   - **CHECK** "Đã nhận sản phẩm từ khách hàng" (default checked)
3. Submit request

**Expected Results:**

✅ Request created with tracking number
✅ Initial status: "received"
✅ Immediately auto-transitions to: "processing"
✅ Service ticket auto-created for the product
✅ Workflow tasks assigned:
- "Xác nhận nhận hàng" → completed (auto)
- "Kiểm tra sản phẩm" → pending
- "Tạo phiếu sửa chữa" → pending
✅ No manual ticket creation needed

**Pass Criteria:** Walk-in flow creates tickets immediately

---

### Test 3.6: Service Request - Status Flow (Pickup)

**Objective:** Test status flow for pickup service

**Login:** reception@sstc.vn

**Test Steps:**

1. Create new service request
2. Fill form
3. **UNCHECK** "Đã nhận sản phẩm từ khách hàng"
4. Submit request
5. Note status

6. Later (simulate pickup):
7. Navigate to request detail
8. Click "Confirm Receipt" button
9. Observe status changes

**Expected Results:**

✅ Step 4: Request status = "pickingup"
✅ Step 4: No tickets created yet
✅ Step 4: No workflow tasks yet
✅ Step 8: Status changes to "received"
✅ Step 8: Tickets auto-created
✅ Step 8: Status auto-progresses to "processing"
✅ Step 8: Workflow tasks assigned

**Pass Criteria:** Pickup flow waits for confirmation before creating tickets

---

### Test 3.7: Analytics API - Task Type Stats

**Objective:** Test analytics endpoint for task performance

**Login:** manager@sstc.vn

**Test Steps:**

1. Open browser DevTools → Console
2. Execute:
```javascript
const stats = await trpc.analytics.getTaskTypeStats.query();
console.table(stats);
```
3. Review output

**Expected Results:**

✅ Returns array of task statistics
✅ Each entry includes:
- `task_name` (e.g., "Kiểm tra sản phẩm")
- `category` (e.g., "inspection")
- `total_executions` (count)
- `completed_count` (count)
- `avg_hours` (decimal)
- `min_hours` (decimal)
- `max_hours` (decimal)
- `median_hours` (decimal)

✅ Calculations appear accurate based on mock data timestamps
✅ API response time <200ms

**Pass Criteria:** API returns accurate aggregated statistics

---

### Test 3.8: Analytics API - User Performance

**Objective:** Test user performance metrics endpoint

**Login:** manager@sstc.vn

**Test Steps:**

1. Open DevTools → Console
2. Execute:
```javascript
const userPerf = await trpc.analytics.getUserPerformance.query({
  dateFrom: '2025-10-01',
  dateTo: '2025-11-30',
});
console.table(userPerf);
```
3. Review output

**Expected Results:**

✅ Returns array of user statistics
✅ Each entry includes:
- `userId`
- `userName` (e.g., "Trần Văn Tech")
- `email`
- `tasksCompleted` (count)
- `totalHours` (sum)
- `avgHours` (calculated average)

✅ Date filtering works correctly
✅ Only includes completed tasks in date range
✅ Calculations accurate

**Pass Criteria:** User metrics accurate with date filtering

---

### Test 3.9: Notification System

**Objective:** Test notifications for key events

**Test Steps:**

1. **Task Assignment Notification:**
   - Login as manager@sstc.vn
   - Assign a new task to tech1@sstc.vn
   - Logout
   - Login as tech1@sstc.vn
   - Check notification bell (should show badge count)
   - Click bell
   - Verify notification shows task assignment
   - Click notification
   - Verify navigates to task

2. **Task Completion Notification:**
   - Login as tech2@sstc.vn
   - Complete an approval task (assigned by manager)
   - Logout
   - Login as manager@sstc.vn
   - Check notifications
   - Verify shows task completion by tech2

**Expected Results:**

✅ Assignment notification delivered to assignee
✅ Notification shows task name and "assigned to you" message
✅ Clicking notification navigates to task detail
✅ Completion notification delivered to manager
✅ Badge count accurate
✅ Mark as read functionality works

**Pass Criteria:** Notifications delivered for all key events

---

### Test 3.10: Audit Trail

**Objective:** Verify audit logging for critical operations

**Login:** manager@sstc.vn

**Test Steps:**

1. **Workflow Activation:**
   - Navigate to `/workflows`
   - Deactivate a workflow
   - Check database `audit_logs` table (via Supabase Studio or API)
   - Find log entry

2. **Transfer Approval:**
   - Approve a high-value transfer
   - Check audit logs
   - Find approval entry

**Expected Results:**

✅ Workflow deactivation logged:
- Action: "workflow_deactivated"
- User ID: manager ID
- Timestamp accurate
- Workflow ID and name recorded

✅ Approval logged:
- Action: "transfer_approved"
- User ID: manager ID
- Transfer ID
- Approval notes
- Timestamp

✅ All critical operations have audit trail

**Pass Criteria:** Complete audit trail for sensitive operations

---

## PHASE 4: WORKFLOW ENHANCEMENTS (1.5-2 hours)

---

### Test 4.1: Workflow Validation - Real-Time

**Objective:** Test real-time validation in workflow builder

**Login:** manager@sstc.vn

**Test Steps:**

1. Navigate to `/workflows/new`
2. Leave name field empty
3. Try to add tasks (should be blocked)
4. Observe validation summary

5. Enter name: "Test Workflow E2E"
6. Observe validation clears
7. Submit with no tasks
8. Observe error

9. Add 2 tasks with same name
10. Observe warning (not error)

**Expected Results:**

✅ Step 3: Validation summary shows RED error
✅ Step 3: Error: "Tên quy trình không được để trống"
✅ Step 3: Submit button disabled
✅ Step 6: Error clears immediately, summary turns green
✅ Step 8: Error: "Quy trình phải có ít nhất 1 task"
✅ Step 10: Warning: "Task trùng tên" (YELLOW, not blocking)
✅ Step 10: Can still submit despite warning

**Pass Criteria:** Real-time validation with clear error/warning distinction

---

### Test 4.2: Workflow Preview Mode

**Objective:** Test visual workflow preview

**Login:** manager@sstc.vn

**Test Steps:**

1. Navigate to existing workflow: "Quy trình sửa chữa chuẩn"
2. Click "Xem trước quy trình" button
3. Wait for preview dialog
4. Review preview content

**Expected Results:**

✅ Preview dialog opens
✅ Shows workflow header:
- Name: "Quy trình sửa chữa chuẩn"
- Description
- Service type
✅ Task sequence visualized:
- 6 tasks in order
- Arrows between tasks
- Sequence numbers (1-6)
- Required/optional badges
- Custom instructions for each
✅ Summary statistics:
- Total: 6 tasks
- Required: 5
- Optional: 1
✅ Notes section at bottom
✅ Mobile-responsive (test by resizing)

**Pass Criteria:** Preview provides clear workflow visualization

---

### Test 4.3: Workflow Notes Field

**Objective:** Test workflow documentation field

**Login:** manager@sstc.vn

**Test Steps:**

1. Create new workflow
2. Fill in notes field with 500 characters
3. Observe character counter: "500/2000"
4. Continue typing to 2000 characters
5. Observe counter: "2000/2000"
6. Try to type more (should be blocked)
7. Save workflow
8. Open workflow detail
9. Verify notes displayed

**Expected Results:**

✅ Character counter updates in real-time
✅ Limit enforced at 2000 characters
✅ Cannot exceed limit
✅ Notes saved successfully
✅ Notes displayed in workflow detail view
✅ Notes displayed in preview mode
✅ Optional field - can save without notes

**Pass Criteria:** Notes field works with character limit

---

### Test 4.4: Task Time Tracking - Automatic Timestamps

**Objective:** Verify automatic timestamp recording

**Login:** tech1@sstc.vn

**Test Steps:**

1. Find a pending task
2. Note current time (e.g., 14:00:00)
3. Start task
4. Check DevTools → Network → Response
5. Find `started_at` timestamp
6. Compare to current time

7. Wait 30 minutes (or simulate in database)
8. Complete task (time now: 14:30:00)
9. Check `completed_at` timestamp
10. Check duration display

**Expected Results:**

✅ `started_at` set automatically on start
✅ Timestamp accurate within 1 second
✅ Format: ISO 8601 (e.g., "2025-11-03T14:00:00Z")
✅ `completed_at` set automatically on completion
✅ Duration calculated: "30m" (or "0h 30m")
✅ Duration color coding based on expected time

**Pass Criteria:** Timestamps automatic and accurate

---

### Test 4.5: Duration Formatting

**Objective:** Test duration display formatting

**Login:** manager@sstc.vn

**Test Steps:**

1. Review completed tasks with various durations:
   - Task A: 30 minutes
   - Task B: 1.5 hours
   - Task C: 3 hours 15 minutes
   - Task D: 5 hours

2. Check duration display for each

**Expected Results:**

✅ Task A: "30m"
✅ Task B: "1h 30m"
✅ Task C: "3h 15m"
✅ Task D: "5h"
✅ Format concise and readable
✅ Color coding:
- Completed <avg time: GREEN
- Completed ~avg time: YELLOW
- Completed >avg time: RED

**Pass Criteria:** Duration formatting consistent and clear

---

### Test 4.6: Task Statistics View

**Objective:** Test task_statistics database view

**Login:** manager@sstc.vn

**Test Steps:**

1. Open Supabase Studio or run SQL:
```sql
SELECT * FROM task_statistics
WHERE task_name = 'Kiểm tra sản phẩm'
LIMIT 1;
```

2. Review statistics for "Kiểm tra sản phẩm" task

**Expected Results:**

✅ View returns aggregated data:
- `task_name`: "Kiểm tra sản phẩm"
- `category`: "inspection"
- `total_executions`: count of all executions
- `completed_count`: count of completed only
- `avg_hours`: average duration (e.g., 0.5)
- `min_hours`: minimum duration
- `max_hours`: maximum duration
- `median_hours`: median duration

✅ Calculations accurate based on historical data
✅ View updates in real-time when tasks complete

**Pass Criteria:** Statistics view accurate and performant

---

### Test 4.7: Smart Assignment Suggestions

**Objective:** Test workload-based assignment algorithm

**Login:** manager@sstc.vn

**Test Steps:**

1. Review current workloads:
   - Tech 1: 5 active tasks
   - Tech 2: 2 active tasks (LOWEST)
   - Tech 3: 3 active tasks

2. Create a new serial entry task (unassigned)
3. Call assignment API:
```javascript
const suggestion = await trpc.assignments.getSuggestion.query({
  taskId: 'new-serial-task-id',
});
console.log(suggestion);
```

**Expected Results:**

✅ Suggests Tech 2 (Lê Thị Kỹ Thuật - lowest workload)
✅ Response includes:
- `userId`: Tech 2 ID
- `userName`: "Lê Thị Kỹ Thuật"
- `email`: "tech2@sstc.vn"
- `workload`: 2
- `avgCompletionTime`: ~1.5 (based on history)
- `reason`: "Lê Thị Kỹ Thuật có 2 công việc đang thực hiện và thường hoàn thành trong 1.5h"

✅ Reason in Vietnamese
✅ Suggestion accurate

**Pass Criteria:** Algorithm suggests user with lowest workload

---

### Test 4.8: Drag-and-Drop Task Reordering

**Objective:** Test workflow task reordering

**Login:** manager@sstc.vn

**Test Steps:**

1. Navigate to workflow edit page
2. Workflow has 5 tasks in order 1-5
3. Drag task 3 to position 1
4. Observe reorder
5. Drag task 5 to position 2
6. Observe reorder
7. Save workflow
8. Reload page
9. Verify order maintained

**Expected Results:**

✅ Tasks reorder immediately on drag
✅ Sequence numbers auto-update
✅ Visual feedback during drag (highlight, placeholder)
✅ No page refresh needed
✅ Order persisted to database
✅ After reload, order maintained

**Pass Criteria:** Drag-and-drop smooth and persistent

---

## CROSS-CUTTING TESTS (1 hour)

---

### Test CC.1: Role-Based Access Control

**Objective:** Verify RBAC enforced

**Test Steps:**

1. **Technician Restrictions:**
   - Login as tech1@sstc.vn
   - Try to access `/workflows/new` (should be denied)
   - Try to access manager analytics APIs (should fail)
   - Try to approve a transfer (should fail)

2. **Manager Access:**
   - Login as manager@sstc.vn
   - Can create workflows ✓
   - Can approve transfers ✓
   - Can access analytics ✓

**Expected Results:**

✅ Technicians blocked from manager-only features
✅ API calls return 403 Forbidden
✅ UI shows error or redirects
✅ Manager has full access
✅ Permissions enforced at database (RLS) and API (middleware)

**Pass Criteria:** RBAC strictly enforced at all levels

---

### Test CC.2: Vietnamese Localization

**Objective:** Verify complete Vietnamese localization

**Test Steps:**

1. Navigate through all pages
2. Check all:
   - Button labels
   - Field labels
   - Error messages
   - Toast notifications
   - Workflow names
   - Task names

**Expected Results:**

✅ All user-facing text in Vietnamese
✅ No English fallbacks visible
✅ Error messages in Vietnamese
✅ Validation messages in Vietnamese
✅ Date/time formatted for Vietnamese locale

**Pass Criteria:** 100% Vietnamese localization

---

### Test CC.3: Build Verification

**Objective:** Verify production build succeeds

**Test Steps:**

1. Run build command:
```bash
pnpm build
```

2. Observe build output

**Expected Results:**

✅ Build completes successfully
✅ Zero TypeScript errors
✅ Zero build warnings
✅ Build time <3 minutes
✅ All 56 routes compiled
✅ Bundle size optimized

**Pass Criteria:** Clean production build

---

### Test CC.4: Mobile Responsiveness

**Objective:** Test mobile UI

**Test Steps:**

1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone 12 Pro"
4. Navigate to `/my-tasks`
5. Test all features on mobile

**Expected Results:**

✅ Layout adapts to mobile
✅ Task cards stack vertically
✅ Buttons touch-sized (min 44x44px)
✅ Text readable without zoom
✅ No horizontal scroll
✅ All actions functional on mobile

**Pass Criteria:** Full functionality on mobile viewport

---

### Test CC.5: Performance Under Load

**Objective:** Test with multiple concurrent users

**Test Steps:**

1. Open 5 browser tabs
2. Login with different accounts in each
3. Navigate to `/my-tasks` simultaneously in all tabs
4. Perform actions in all tabs at once

**Expected Results:**

✅ All dashboards load <500ms
✅ No API timeouts
✅ No UI freezing
✅ No race conditions
✅ No data corruption

**Pass Criteria:** System handles concurrent users smoothly

---

## 📊 Test Execution Summary

### Test Metrics

| Phase | Scenarios | Critical | Est. Time |
|-------|-----------|----------|-----------|
| Phase 1 | 10 | Yes | 2-3 hours |
| Phase 2 | 8 | Yes | 1.5-2 hours |
| Phase 3 | 10 | No | 2-3 hours |
| Phase 4 | 8 | No | 1.5-2 hours |
| Cross-Cutting | 5 | Yes | 1 hour |
| **Total** | **41** | - | **8-11 hours** |

### Pass Criteria

**PASS if:**
- ✅ All Critical tests (Phase 1, 2, CC) pass 100%
- ✅ Non-critical tests pass ≥90%
- ✅ Zero critical bugs
- ✅ Zero data integrity issues
- ✅ Performance benchmarks met

**FAIL if:**
- ❌ Any Critical test fails
- ❌ Data corruption possible
- ❌ Security vulnerabilities found
- ❌ Performance <50% of target

---

## 🐛 Bug Reporting

Use this template when logging bugs:

```markdown
**Bug ID:** PTMS-BUG-001
**Severity:** Critical/High/Medium/Low
**Test:** Phase X, Test X.X
**Title:** Short description

**Steps to Reproduce:**
1. Login as [user]
2. Navigate to [page]
3. [Action]

**Expected:** [What should happen]
**Actual:** [What happened]
**Test Data:** [Specific entity from mock data]

**Environment:**
- Browser: Chrome 120
- User: tech1@sstc.vn
- Date: 2025-11-03
```

---

## ✅ Test Sign-Off

**Tester:** ___________________________
**Date:** ___________________________
**Result:** PASS / CONCERNS / FAIL
**Pass Rate:** _____% (scenarios passed / total)

**Notes:**
___________________________
___________________________

---

**Document Version:** 2.0 (Data-Driven)
**Mock Data Version:** 4.0.0
**Last Updated:** November 3, 2025
**Test Architect:** Quinn 🧪
