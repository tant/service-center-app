# E2E Test Plan: Polymorphic Task Management System (Complete)

**Project:** PTMS-2025 - Polymorphic Task Management System
**Version:** 1.0
**Date:** November 3, 2025
**Test Type:** Manual End-to-End Testing
**Status:** Ready for Execution
**Scope:** Phases 1-4 Complete Implementation

---

## 📋 Executive Summary

This E2E test plan validates the complete polymorphic task management system across all 5 entity types and all implemented phases. It covers the entire user journey from workflow creation through task execution, with special focus on serial entry automation, workflow progression, and performance tracking.

### Test Objectives

1. ✅ Validate unified task dashboard across all entity types
2. ✅ Verify serial entry automation achieves 100% compliance
3. ✅ Confirm automatic workflow progression works correctly
4. ✅ Test smart assignment suggestions based on workload
5. ✅ Validate time tracking and analytics data accuracy
6. ✅ Verify workflow validation and preview features
7. ✅ Test performance meets benchmarks (<500ms load times)
8. ✅ Ensure zero regressions in existing functionality

### Test Coverage

| Phase | Features | Test Scenarios | Priority |
|-------|----------|----------------|----------|
| Phase 1 | Task Foundation | 12 scenarios | Critical |
| Phase 2 | Serial Entry | 8 scenarios | Critical |
| Phase 3 | Advanced Features | 10 scenarios | High |
| Phase 4 | Workflow Enhancements | 8 scenarios | High |
| **Total** | **38 scenarios** | **~6-8 hours** | - |

---

## 🎯 Test Environment Setup

### Prerequisites

**Required Test Accounts:**
1. **Admin** - Full system access
2. **Manager** - Workflow management, analytics, approvals
3. **Technician** - Task execution, serial entry
4. **Reception** - Service request creation

**Test Data Requirements:**
- 5 customers with complete profiles
- 10 products (ZOTAC graphics cards, SSTC SSDs)
- 3 warehouse locations
- 5 workflows (one per entity type)
- 20 tasks in task library

**Browser Requirements:**
- Chrome (primary testing)
- Firefox (secondary)
- Mobile viewport (responsive testing)

### Success Criteria

**Performance Benchmarks:**
- Dashboard load time: <500ms
- Task API response: <200ms
- Serial entry auto-save: <100ms
- Workflow preview render: <300ms

**Functional Requirements:**
- Zero tasks lost or duplicated
- 100% serial entry compliance
- Auto-progression works reliably
- All 5 entity adapters functional
- Time tracking accurate to the minute

---

## 🧪 Test Scenarios

---

## PHASE 1: FOUNDATION - Task System Core

### Scenario 1.1: Unified Task Dashboard - View All Tasks

**Objective:** Verify unified dashboard displays tasks from all 5 entity types

**Test Steps:**

1. **Setup:**
   - Login as Technician with assigned tasks from all entity types
   - Ensure test data includes:
     - 2 service ticket tasks
     - 2 inventory receipt tasks (serial entry)
     - 1 inventory issue task
     - 1 inventory transfer task (approval)
     - 1 service request task

2. **Execute:**
   - Navigate to `/my-tasks`
   - Observe dashboard load time (should be <500ms)

3. **Verify:**
   - ✅ All 7 tasks displayed correctly
   - ✅ Each task shows correct entity type icon/badge
   - ✅ Task titles match entity context (e.g., "Phiếu nhập kho GRN-2025-001")
   - ✅ Status indicators accurate (pending, in_progress, completed)
   - ✅ Priority badges displayed correctly
   - ✅ Load time <500ms (check browser DevTools)
   - ✅ Mobile-responsive layout works

**Expected Result:** Dashboard consolidates all tasks in one view with accurate entity context

---

### Scenario 1.2: Task Filtering and Sorting

**Objective:** Validate filtering and sorting across entity types

**Test Steps:**

1. **Filter by Status:**
   - Click "Status" filter dropdown
   - Select "Pending"
   - Verify only pending tasks displayed
   - Select "In Progress"
   - Verify only in-progress tasks displayed

2. **Filter by Category:**
   - Click "Category" filter
   - Select "Serial Entry"
   - Verify only serial entry tasks displayed
   - Select "Approval"
   - Verify only approval tasks displayed

3. **Filter by Priority:**
   - Click "Priority" filter
   - Select "High"
   - Verify only high-priority tasks displayed

4. **Sort by Due Date:**
   - Click "Sort" dropdown
   - Select "Due Date"
   - Verify tasks ordered by due date (earliest first)

5. **Sort by Priority:**
   - Select "Priority"
   - Verify tasks ordered by priority (high → medium → low)

**Expected Result:** Filters and sorting work correctly across all entity types

---

### Scenario 1.3: Task Lifecycle - Start and Complete

**Objective:** Test full task lifecycle from pending → in_progress → completed

**Test Steps:**

1. **Start Task:**
   - Find a pending service ticket task
   - Note the current time
   - Click "Start Task" button
   - Observe toast notification

2. **Verify Start:**
   - ✅ Task status changes to "In Progress"
   - ✅ Start button changes to "Complete" button
   - ✅ `started_at` timestamp recorded (check via browser DevTools network tab or database)
   - ✅ Task moved to "In Progress" section

3. **Complete Task:**
   - Click "Complete Task" button
   - Enter completion notes: "Task completed successfully during E2E testing"
   - Click "Submit"
   - Note the current time

4. **Verify Completion:**
   - ✅ Task status changes to "Completed"
   - ✅ `completed_at` timestamp recorded
   - ✅ Task moved to "Completed" section
   - ✅ Completion notes saved
   - ✅ Duration calculated and displayed

**Expected Result:** Task progresses through lifecycle with accurate timestamps

---

### Scenario 1.4: Task Detail View - Entity Context

**Objective:** Verify task detail shows correct entity context for each type

**Test Steps:**

1. **Service Ticket Task:**
   - Click on a service ticket task
   - Verify detail panel shows:
     - ✅ Ticket number (e.g., "SV-2025-001")
     - ✅ Customer name
     - ✅ Product/service type
     - ✅ Link to ticket detail page
     - ✅ Current ticket status

2. **Inventory Receipt Task (Serial Entry):**
   - Click on a serial entry task
   - Verify detail panel shows:
     - ✅ Receipt number (e.g., "GRN-2025-001")
     - ✅ Product name
     - ✅ Serial progress (e.g., "5/10 serials entered")
     - ✅ Link to receipt detail page
     - ✅ Progress bar with color coding

3. **Service Request Task:**
   - Click on a service request task
   - Verify detail panel shows:
     - ✅ Request tracking number
     - ✅ Customer name
     - ✅ Request status
     - ✅ Link to request detail page

**Expected Result:** Each entity adapter provides correct context display

---

### Scenario 1.5: Task Actions - Real-Time Updates

**Objective:** Test real-time task action feedback

**Test Steps:**

1. **Start Task Action:**
   - Select a pending task
   - Click "Start Task"
   - Observe UI updates

2. **Verify Real-Time Feedback:**
   - ✅ Button disabled during API call
   - ✅ Loading spinner appears
   - ✅ Toast notification on success
   - ✅ Task card updates immediately
   - ✅ Status badge changes
   - ✅ No page refresh required

3. **Error Handling:**
   - Simulate network error (disconnect network)
   - Try to start a task
   - Verify error toast displayed
   - Verify task state unchanged
   - Reconnect network

**Expected Result:** Real-time updates work smoothly with proper error handling

---

### Scenario 1.6: Sequence Enforcement - Strict Workflows

**Objective:** Verify tasks with strict sequence cannot be started out of order

**Test Steps:**

1. **Setup:**
   - Create a workflow with strict sequence enabled
   - Assign 3 sequential tasks:
     - Task 1: "Kiểm tra sản phẩm" (pending)
     - Task 2: "Phê duyệt" (pending)
     - Task 3: "Hoàn tất" (pending)

2. **Test Sequence Enforcement:**
   - Try to start Task 2 (should be blocked)
   - Verify error message: "Không thể bắt đầu task này vì task trước chưa hoàn thành"
   - Try to start Task 3 (should be blocked)
   - Verify same error message

3. **Complete in Sequence:**
   - Start and complete Task 1
   - Verify Task 2 now startable
   - Start and complete Task 2
   - Verify Task 3 now startable
   - Complete Task 3

**Expected Result:** Strict sequence prevents out-of-order execution

---

### Scenario 1.7: Entity Auto-Progression

**Objective:** Verify entity status auto-updates when all required tasks complete

**Test Steps:**

1. **Setup Service Ticket:**
   - Create service ticket with workflow (3 required tasks)
   - Initial ticket status: "in_progress"

2. **Complete Tasks:**
   - Complete required task 1
   - Check ticket status (should still be "in_progress")
   - Complete required task 2
   - Check ticket status (should still be "in_progress")
   - Complete required task 3 (final task)

3. **Verify Auto-Progression:**
   - ✅ Ticket status automatically changes to "completed"
   - ✅ No manual status update needed
   - ✅ Audit log entry created
   - ✅ Completion timestamp recorded

**Expected Result:** Entity status auto-progresses when workflow completes

---

### Scenario 1.8: Task Progress Tracking

**Objective:** Test progress tracking for tasks that report partial completion

**Test Steps:**

1. **Find Progress Task:**
   - Identify a serial entry task with progress tracking
   - Note current progress (e.g., "0/50 serials")

2. **Update Progress:**
   - Start the task
   - Use the API or UI to update progress to 25%
   - Verify progress bar updates
   - Update to 50%
   - Verify progress bar color changes (red → yellow)
   - Update to 100%

3. **Verify Auto-Completion:**
   - ✅ Task automatically marked complete at 100%
   - ✅ `completed_at` timestamp set
   - ✅ Progress bar turns green
   - ✅ Task removed from pending list

**Expected Result:** Progress tracking works with auto-completion at 100%

---

### Scenario 1.9: Multi-User Task Assignment

**Objective:** Test task visibility based on assignment

**Test Steps:**

1. **Setup:**
   - Create 3 tasks assigned to Technician A
   - Create 2 tasks assigned to Technician B
   - Create 1 task assigned to Manager

2. **Login as Technician A:**
   - Navigate to `/my-tasks`
   - Verify sees only 3 assigned tasks
   - Verify does NOT see Technician B's tasks

3. **Login as Technician B:**
   - Navigate to `/my-tasks`
   - Verify sees only 2 assigned tasks
   - Verify does NOT see Technician A's tasks

4. **Login as Manager:**
   - Navigate to `/my-tasks`
   - Verify sees only 1 assigned task
   - Can optionally view all team tasks via filter

**Expected Result:** Task visibility correctly filtered by assignment

---

### Scenario 1.10: Task Notifications

**Objective:** Verify notification system for task events

**Test Steps:**

1. **Assign New Task:**
   - As Manager, assign a task to Technician
   - Verify Technician receives notification

2. **Check Notification:**
   - Login as Technician
   - Click notification icon/bell
   - Verify notification shows:
     - ✅ Task name
     - ✅ "Assigned to you" message
     - ✅ Link to task

3. **Complete Task Notification:**
   - Complete an approval task
   - Verify Manager receives notification
   - Verify notification shows task completion

**Expected Result:** Notifications delivered for key task events

---

### Scenario 1.11: Performance - Dashboard Load Time

**Objective:** Verify dashboard meets performance benchmarks

**Test Steps:**

1. **Setup High Load:**
   - Create account with 100 assigned tasks (mix of all entity types)

2. **Measure Load Time:**
   - Open browser DevTools → Network tab
   - Clear browser cache
   - Navigate to `/my-tasks`
   - Record page load time
   - Record API response time for `tasks.myTasks`

3. **Verify Performance:**
   - ✅ Page load <500ms (target: 350ms)
   - ✅ API response <200ms (target: 150ms)
   - ✅ No UI lag when scrolling
   - ✅ Pagination works smoothly

4. **Test Filtering Performance:**
   - Apply various filters
   - Verify filter response <100ms

**Expected Result:** All performance benchmarks met under load

---

### Scenario 1.12: Mobile Responsiveness

**Objective:** Test task dashboard on mobile viewport

**Test Steps:**

1. **Setup:**
   - Open Chrome DevTools
   - Toggle device toolbar (Ctrl+Shift+M)
   - Select "iPhone 12 Pro" viewport

2. **Test Mobile UI:**
   - Navigate to `/my-tasks`
   - Verify layout adapts to mobile
   - ✅ Task cards stack vertically
   - ✅ Filters accessible via hamburger menu
   - ✅ Action buttons sized for touch
   - ✅ Text readable without zoom
   - ✅ No horizontal scroll

3. **Test Task Actions:**
   - Start a task on mobile
   - Complete a task on mobile
   - Verify all actions work smoothly

**Expected Result:** Full functionality on mobile devices

---

## PHASE 2: SERIAL ENTRY - Automation & Compliance

### Scenario 2.1: Auto-Create Serial Entry Tasks

**Objective:** Verify serial entry tasks auto-created on receipt approval

**Test Steps:**

1. **Create Inventory Receipt:**
   - Navigate to `/inventory/documents/receipts/new`
   - Fill in receipt details:
     - Warehouse: "Công ty"
     - Product: "ZOTAC RTX 4070 Ti"
     - Quantity: 10
     - Virtual warehouse: "Kho Chính"
   - Save receipt (status = 'pending')

2. **Approve Receipt:**
   - Navigate to receipt detail page
   - Click "Approve" button
   - Confirm approval

3. **Verify Task Auto-Creation:**
   - Navigate to `/my-tasks`
   - ✅ Serial entry task auto-created
   - ✅ Task name: "Nhập serial cho [Product Name]"
   - ✅ Task category: "Serial Entry"
   - ✅ Task shows progress: "0/10 serials"
   - ✅ Task status: "pending"
   - ✅ Priority: "high" (based on quantity)

4. **Verify Stock Updated:**
   - Check product stock
   - ✅ Stock increased by 10 immediately (non-blocking)
   - ✅ Stock available even though serials not entered yet

**Expected Result:** Tasks auto-created on approval, stock updated immediately

---

### Scenario 2.2: Serial Entry Progress Tracking

**Objective:** Test serial entry progress updates in real-time

**Test Steps:**

1. **Start Serial Entry Task:**
   - Navigate to `/my-tasks/serial-entry`
   - Find the task from Scenario 2.1
   - Click task to navigate to receipt detail page

2. **Enter Serials Incrementally:**
   - Enter serial 1: "ZT4070TI001"
   - Observe progress update: "1/10 (10%)"
   - ✅ Progress bar color: Red
   - Enter serials 2-5
   - Observe progress: "5/10 (50%)"
   - ✅ Progress bar color: Yellow
   - Enter serials 6-9
   - Observe progress: "9/10 (90%)"
   - ✅ Progress bar color: Yellow

3. **Complete Serial Entry:**
   - Enter serial 10: "ZT4070TI010"
   - Observe progress: "10/10 (100%)"
   - ✅ Progress bar color: Green

4. **Verify Auto-Completion:**
   - ✅ Task automatically marked "completed"
   - ✅ Receipt status changes to "completed"
   - ✅ Task removed from serial entry dashboard
   - ✅ Completion timestamp recorded

**Expected Result:** Real-time progress tracking with color-coded indicators and auto-completion

---

### Scenario 2.3: Serial Entry - Smart Input & Validation

**Objective:** Test serial input auto-save and duplicate validation

**Test Steps:**

1. **Auto-Save Testing:**
   - Start entering a serial number
   - Type: "SSTCSSD001"
   - Wait 500ms (auto-save debounce)
   - ✅ Serial auto-saved (check via loading indicator)
   - Refresh page
   - ✅ Serial persisted in database

2. **Duplicate Detection:**
   - Try to enter "SSTCSSD001" again
   - ✅ Error displayed: "Serial number đã tồn tại trong hệ thống"
   - ✅ Input highlighted in red
   - ✅ Serial not saved

3. **System-Wide Duplicate Check:**
   - Create a different receipt
   - Try to enter "SSTCSSD001" in new receipt
   - ✅ Error displayed (system-wide check)

4. **Bulk Serial Entry:**
   - Use bulk entry mode
   - Paste 10 serials (comma or newline separated)
   - Click "Import"
   - ✅ All serials validated
   - ✅ Progress jumps to 100%
   - ✅ Task auto-completes

**Expected Result:** Auto-save, validation, and bulk entry all functional

---

### Scenario 2.4: Serial Entry Dashboard - Priority View

**Objective:** Test dedicated serial entry dashboard with priority filtering

**Test Steps:**

1. **Create Multiple Serial Tasks:**
   - Create 3 receipts with different priorities:
     - Receipt 1: 50 units (high priority)
     - Receipt 2: 10 units (medium priority)
     - Receipt 3: 5 units (low priority)
   - Approve all 3 receipts

2. **Navigate to Serial Entry Dashboard:**
   - Go to `/my-tasks/serial-entry`
   - ✅ All 3 serial tasks displayed

3. **Test Priority Filters:**
   - Click "Mine" filter
   - ✅ Shows only tasks assigned to current user
   - Click "Available" filter
   - ✅ Shows unassigned serial tasks
   - Click "Overdue" filter
   - ✅ Shows tasks past due date

4. **Test Task Cards:**
   - Verify each card shows:
     - ✅ Product name and image
     - ✅ Receipt number
     - ✅ Progress bar with percentage
     - ✅ Color coding (red/yellow/green)
     - ✅ Due date
     - ✅ Priority badge

**Expected Result:** Dedicated dashboard with effective filtering and prioritization

---

### Scenario 2.5: Serial Entry - Manager Compliance Widget

**Objective:** Test manager compliance metrics widget

**Test Steps:**

1. **Login as Manager:**
   - Navigate to `/dashboard`

2. **Locate Compliance Widget:**
   - Find "Serial Entry Compliance" widget
   - Verify displays:
     - ✅ Total receipts pending serial entry
     - ✅ Percentage compliance (completed/total)
     - ✅ Overdue tasks count
     - ✅ Color indicator (red if <90%, green if >95%)

3. **Click Widget:**
   - Click to drill down
   - Verify shows list of:
     - ✅ Receipts with incomplete serials
     - ✅ Assigned technician
     - ✅ Days overdue
     - ✅ Priority level

**Expected Result:** Manager has visibility into serial entry compliance

---

### Scenario 2.6: Serial Entry - CSV Import

**Objective:** Test bulk serial import via CSV

**Test Steps:**

1. **Prepare CSV File:**
   - Create CSV with format: `serial_number`
   - Example content:
     ```
     ZOTAC001
     ZOTAC002
     ZOTAC003
     ...
     ZOTAC050
     ```

2. **Navigate to Receipt:**
   - Open receipt with 50 units needing serials
   - Find CSV import option

3. **Import CSV:**
   - Click "Import CSV" button
   - Select prepared CSV file
   - Click "Upload"

4. **Verify Import:**
   - ✅ All 50 serials imported
   - ✅ Progress shows 100%
   - ✅ Task auto-completes
   - ✅ No duplicates allowed
   - ✅ Invalid serials flagged with error

5. **Test Error Handling:**
   - Create CSV with duplicate serial
   - Try to import
   - ✅ Error message displayed
   - ✅ Specific row/serial identified
   - ✅ No partial import (transaction rolled back)

**Expected Result:** CSV import works with comprehensive validation

---

### Scenario 2.7: Serial Entry - Partial Completion Persistence

**Objective:** Verify partial serial entry persists across sessions

**Test Steps:**

1. **Start Serial Entry:**
   - Open receipt with 20 units
   - Enter 10 serials
   - Verify progress: "10/20 (50%)"
   - Do NOT complete task
   - Log out

2. **Resume Later:**
   - Log back in
   - Navigate to task
   - ✅ Previously entered 10 serials still present
   - ✅ Progress shows 50%
   - ✅ Can continue from where left off

3. **Different User Continues:**
   - Reassign task to different technician
   - Log in as new technician
   - ✅ Sees existing 10 serials
   - ✅ Can add remaining 10 serials
   - Complete task

**Expected Result:** Serial entry data persists reliably across sessions and users

---

### Scenario 2.8: 100% Serial Compliance Achievement

**Objective:** End-to-end test of serial entry compliance workflow

**Test Steps:**

1. **Baseline Measurement:**
   - Login as Manager
   - Check compliance dashboard
   - Note current compliance percentage

2. **Create 5 Receipts:**
   - Create 5 inventory receipts
   - Approve all 5
   - Verify 5 serial entry tasks auto-created

3. **Complete All Serial Entries:**
   - Assign tasks to technicians
   - Complete serial entry for all 5 receipts
   - Verify all progress reaches 100%
   - Verify all tasks auto-complete

4. **Verify 100% Compliance:**
   - Check manager compliance widget
   - ✅ Compliance shows 100%
   - ✅ Zero pending serial entries
   - ✅ Zero overdue tasks
   - ✅ All receipts have status "completed"

5. **Verify Business Impact:**
   - Check receipt audit report
   - ✅ Zero receipts with missing serials
   - ✅ All serials traceable in system

**Expected Result:** System achieves and maintains 100% serial entry compliance

---

## PHASE 3: ADVANCED FEATURES

### Scenario 3.1: Transfer Approval Workflow

**Objective:** Test high-value transfer approval process

**Test Steps:**

1. **Create High-Value Transfer:**
   - Navigate to `/inventory/documents/transfers/new`
   - Create transfer:
     - From: "Kho Chính"
     - To: "Kho Bảo Hành"
     - Product: "ZOTAC RTX 4090" (high value)
     - Quantity: 10
     - Estimated value: >10M VND
   - Submit transfer

2. **Verify Approval Task Created:**
   - Check manager's task dashboard
   - ✅ Approval task auto-created
   - ✅ Task assigned to manager
   - ✅ Task category: "Approval"
   - ✅ Task shows transfer details

3. **Verify Transfer Blocked:**
   - Try to execute transfer before approval
   - ✅ Action blocked
   - ✅ Error: "Transfer chờ phê duyệt"

4. **Manager Approves:**
   - Login as Manager
   - Navigate to approval task
   - Review transfer details
   - Click "Approve" with note
   - Complete task

5. **Verify Transfer Executes:**
   - ✅ Transfer status changes to "approved"
   - ✅ Stock auto-updated (deducted from source, added to destination)
   - ✅ Audit log entry created
   - ✅ Notification sent to requester

6. **Test Rejection:**
   - Create another high-value transfer
   - Manager clicks "Reject" with reason
   - ✅ Transfer status: "rejected"
   - ✅ Stock NOT updated
   - ✅ Rejection reason logged

**Expected Result:** Approval workflow blocks execution until manager approval

---

### Scenario 3.2: Service Request Draft Mode

**Objective:** Test draft saving and resumption for service requests

**Test Steps:**

1. **Create Draft Request:**
   - Navigate to `/operations/service-requests/new`
   - Fill partial information:
     - Customer phone: "0912345678"
     - Product serial: "ZOTAC001"
     - Leave other fields blank
   - Click "Save Draft" button

2. **Verify Draft Saved:**
   - ✅ Toast: "Draft saved successfully"
   - ✅ Request status: "draft"
   - ✅ Tracking token generated
   - ✅ No tickets created yet
   - Navigate away from page

3. **Resume Draft:**
   - Navigate to `/operations/service-requests`
   - Find saved draft in list
   - Click "Edit Draft"
   - ✅ Previously entered data loaded
   - Complete remaining fields
   - Click "Submit Request"

4. **Verify Submission:**
   - ✅ Request status changes to "received"
   - ✅ Tickets auto-created
   - ✅ Tasks assigned to technicians
   - ✅ Draft no longer editable

5. **Test Draft Deletion:**
   - Create another draft
   - Click "Delete Draft"
   - Confirm deletion
   - ✅ Draft removed from system

**Expected Result:** Draft mode allows saving incomplete requests for later completion

---

### Scenario 3.3: Service Request Phone Lookup

**Objective:** Test customer auto-fill via phone lookup

**Test Steps:**

1. **Setup:**
   - Ensure customer exists in database:
     - Phone: "0987654321"
     - Name: "Nguyễn Văn A"
     - Email: "nguyenvana@example.com"

2. **Test Auto-Fill:**
   - Navigate to service request form
   - Enter phone: "0987654321"
   - Wait 500ms (debounce delay)

3. **Verify Auto-Fill:**
   - ✅ Loading spinner appears during lookup
   - ✅ Customer name auto-fills: "Nguyễn Văn A"
   - ✅ Email auto-fills: "nguyenvana@example.com"
   - ✅ Toast notification: "Tìm thấy thông tin khách hàng"
   - ✅ Green checkmark next to phone field

4. **Test New Customer:**
   - Clear form
   - Enter phone: "0911111111" (not in database)
   - Wait 500ms
   - ✅ No error displayed (silent fail)
   - ✅ Name and email fields remain empty
   - ✅ User can enter new customer info
   - Submit form
   - ✅ New customer created with unique phone

**Expected Result:** Phone lookup auto-fills customer data, allows new customer creation

---

### Scenario 3.4: Service Request Status Flow

**Objective:** Test full service request status progression

**Test Steps:**

1. **Create Request (Walk-In Customer):**
   - Fill service request form
   - Check "Đã nhận sản phẩm từ khách hàng" (default checked)
   - Submit

2. **Verify Auto-Progression:**
   - ✅ Initial status: "received"
   - ✅ Tickets auto-created immediately
   - ✅ Tasks assigned to technicians
   - ✅ Status auto-changes to "processing"

3. **Create Request (Pickup Needed):**
   - Fill service request form
   - UNCHECK "Đã nhận sản phẩm từ khách hàng"
   - Submit

4. **Verify Pickup Flow:**
   - ✅ Initial status: "pickingup"
   - ✅ No tickets created yet
   - ✅ Waiting for staff confirmation

5. **Staff Confirms Receipt:**
   - Staff navigates to request
   - Clicks "Confirm Receipt" button

6. **Verify Auto-Ticket Creation:**
   - ✅ Status changes to "received"
   - ✅ Tickets auto-created
   - ✅ Status changes to "processing"
   - ✅ Tasks assigned

7. **Complete All Tasks:**
   - Complete all tasks for the request
   - ✅ Request status changes to "completed"

**Expected Result:** Status flow works for both walk-in and pickup scenarios

---

### Scenario 3.5: Analytics API - Task Type Stats

**Objective:** Test analytics endpoint for task performance metrics

**Test Steps:**

1. **Setup Test Data:**
   - Complete 10 tasks of various types:
     - 3 serial entry tasks (avg: 2h each)
     - 3 approval tasks (avg: 0.5h each)
     - 4 inspection tasks (avg: 1h each)

2. **Call Analytics API:**
   - Open browser DevTools → Console
   - Execute:
     ```javascript
     const stats = await trpc.analytics.getTaskTypeStats.query();
     console.table(stats);
     ```

3. **Verify Response:**
   - ✅ Returns array of task statistics
   - For each task type, verify fields:
     - ✅ `task_name`
     - ✅ `category`
     - ✅ `total_executions`
     - ✅ `completed_count`
     - ✅ `avg_hours`
     - ✅ `min_hours`
     - ✅ `max_hours`
     - ✅ `median_hours`

4. **Verify Accuracy:**
   - Compare calculated averages with actual task durations
   - ✅ Serial entry avg: ~2h
   - ✅ Approval avg: ~0.5h
   - ✅ Inspection avg: ~1h
   - ✅ Calculations accurate

**Expected Result:** Analytics API returns accurate task performance metrics

---

### Scenario 3.6: Analytics API - User Performance

**Objective:** Test user performance metrics endpoint

**Test Steps:**

1. **Setup:**
   - Technician A completes 5 tasks (total: 10 hours)
   - Technician B completes 10 tasks (total: 15 hours)

2. **Call API:**
   ```javascript
   const userPerf = await trpc.analytics.getUserPerformance.query({
     dateFrom: '2025-01-01',
     dateTo: '2025-12-31',
   });
   console.table(userPerf);
   ```

3. **Verify Response:**
   - ✅ Returns array of user statistics
   - For Technician A:
     - ✅ `tasksCompleted`: 5
     - ✅ `totalHours`: 10
     - ✅ `avgHours`: 2.0
   - For Technician B:
     - ✅ `tasksCompleted`: 10
     - ✅ `totalHours`: 15
     - ✅ `avgHours`: 1.5

4. **Test Date Filtering:**
   - Call API with `dateFrom: '2025-11-01'`
   - ✅ Only returns tasks completed in November
   - Call without date filters
   - ✅ Returns all completed tasks

**Expected Result:** User performance metrics accurate with date filtering

---

### Scenario 3.7: Notification System

**Objective:** Test notification delivery for key events

**Test Steps:**

1. **Task Assignment Notification:**
   - Manager assigns task to Technician
   - Login as Technician
   - ✅ Notification bell shows badge (1)
   - Click bell icon
   - ✅ Notification displays: "New task assigned: [Task Name]"
   - Click notification
   - ✅ Navigates to task detail

2. **Task Completion Notification:**
   - Technician completes approval task
   - Login as Manager
   - ✅ Notification received
   - ✅ Shows: "[Technician] completed task: [Task Name]"

3. **Overdue Task Notification:**
   - Create task with due date in the past
   - ✅ Notification sent: "Task overdue: [Task Name]"
   - ✅ Notification style: warning/red

4. **Mark as Read:**
   - Click notification
   - ✅ Notification marked as read
   - ✅ Badge count decrements
   - ✅ Notification grayed out or removed

**Expected Result:** Notifications delivered reliably for all key events

---

### Scenario 3.8: Audit Trail

**Objective:** Verify audit logging for critical operations

**Test Steps:**

1. **Task Operations:**
   - Start a task
   - Complete a task
   - Query audit log API or database

2. **Verify Audit Entries:**
   - ✅ Task start logged with:
     - User ID
     - Timestamp
     - Action: "task_started"
     - Task ID and entity context
   - ✅ Task complete logged with:
     - User ID
     - Timestamp
     - Action: "task_completed"
     - Completion notes

3. **Workflow Operations:**
   - Activate a workflow
   - Deactivate a workflow
   - ✅ Both actions logged
   - ✅ Reason field populated

4. **Approval Operations:**
   - Approve a transfer
   - ✅ Approval logged with:
     - Approver ID
     - Timestamp
     - Approval decision
     - Reason/notes

**Expected Result:** Complete audit trail for all critical operations

---

### Scenario 3.9: Performance Under Load

**Objective:** Test system performance with concurrent users

**Test Steps:**

1. **Simulate 10 Concurrent Users:**
   - Open 10 browser tabs
   - Login with different accounts
   - Navigate to `/my-tasks` in all tabs simultaneously

2. **Measure Performance:**
   - ✅ All dashboards load <500ms
   - ✅ No API timeouts
   - ✅ No UI lag or freezing

3. **Concurrent Task Actions:**
   - In all 10 tabs, start different tasks simultaneously
   - ✅ All actions succeed
   - ✅ No race conditions
   - ✅ No duplicate task starts

4. **Check Database:**
   - Query `entity_tasks` table
   - ✅ All 10 tasks marked in_progress
   - ✅ All `started_at` timestamps accurate
   - ✅ No data corruption

**Expected Result:** System handles concurrent users without performance degradation

---

### Scenario 3.10: Optimization Validation

**Objective:** Verify optimization features work correctly

**Test Steps:**

1. **Test Pagination:**
   - Create account with 200 tasks
   - Navigate to `/my-tasks`
   - ✅ Only 20-50 tasks loaded initially (paginated)
   - Scroll to bottom
   - ✅ Next page loads automatically (infinite scroll)
   - ✅ Smooth scrolling, no lag

2. **Test Real-Time Updates:**
   - Open dashboard
   - In another tab, complete a task
   - Wait 500ms (polling interval)
   - ✅ Dashboard auto-refreshes
   - ✅ Completed task removed from list
   - ✅ No full page reload

3. **Test Code Splitting:**
   - Open browser DevTools → Network tab
   - Navigate to `/my-tasks`
   - ✅ Only necessary chunks loaded
   - Navigate to `/workflows`
   - ✅ Workflow route chunk loaded on-demand

4. **Test Lazy Loading:**
   - Scroll through task list
   - ✅ Task detail panels load only when expanded
   - ✅ Images lazy-loaded
   - ✅ Reduces initial load time

**Expected Result:** All optimization features functional and effective

---

## PHASE 4: WORKFLOW ENHANCEMENTS

### Scenario 4.1: Workflow Validation - Real-Time Feedback

**Objective:** Test real-time workflow validation during creation

**Test Steps:**

1. **Create New Workflow:**
   - Navigate to `/workflows/new`
   - Leave name field empty
   - Try to add tasks

2. **Verify Validation:**
   - ✅ Validation summary shows red error
   - ✅ Error: "Tên quy trình không được để trống"
   - ✅ Submit button disabled
   - ✅ Cannot proceed

3. **Add Name:**
   - Enter workflow name: "Test Workflow"
   - ✅ Error clears immediately
   - ✅ Validation summary turns green
   - ✅ Submit button enabled

4. **Test Task Validation:**
   - Submit workflow with no tasks
   - ✅ Error: "Quy trình phải có ít nhất 1 task"
   - ✅ Submit blocked

5. **Add Tasks:**
   - Add Task 1: "Kiểm tra"
   - ✅ Warning clears
   - Add Task 2: "Kiểm tra" (duplicate name)
   - ✅ Warning: "Task trùng tên: Kiểm tra"
   - ✅ Warning is yellow (not blocking)
   - ✅ Can still submit

6. **Test Sequence Validation:**
   - Set sequence order: 1, 3, 5 (skipped 2 and 4)
   - ✅ Warning: "Sequence order có khoảng trống"
   - ✅ Still allows submission (warning not error)

**Expected Result:** Real-time validation with clear error/warning distinction

---

### Scenario 4.2: Workflow Preview Mode

**Objective:** Test visual workflow preview with flow diagram

**Test Steps:**

1. **Create Workflow:**
   - Navigate to `/workflows/new`
   - Fill workflow details:
     - Name: "Quy trình kiểm định sản phẩm"
     - Description: "Kiểm tra chất lượng sản phẩm trước khi xuất kho"
     - Service type: "Kiểm định"
     - Notes: "Áp dụng cho sản phẩm ZOTAC và SSTC"
   - Add 5 tasks in sequence

2. **Open Preview:**
   - Click "Xem trước quy trình" button
   - Wait for preview dialog to open

3. **Verify Preview Content:**
   - ✅ Workflow header shows:
     - Workflow name
     - Description
     - Service type
   - ✅ Task sequence visualized with arrows
   - ✅ Each task card shows:
     - Task name
     - Sequence number
     - Required/optional badge
     - Custom instructions (if any)
   - ✅ Summary statistics displayed:
     - Total tasks: 5
     - Required tasks: 4
     - Optional tasks: 1
   - ✅ Notes section visible at bottom

4. **Test Mobile Preview:**
   - Switch to mobile viewport
   - Open preview
   - ✅ Layout adapts to mobile
   - ✅ Task cards stack vertically
   - ✅ Readable without zoom

5. **Close Preview:**
   - Click "Close" or outside dialog
   - ✅ Returns to edit mode
   - ✅ No data lost

**Expected Result:** Preview provides clear visualization of workflow structure

---

### Scenario 4.3: Workflow Documentation Field

**Objective:** Test workflow notes field with character limit

**Test Steps:**

1. **Add Notes:**
   - In workflow form, find "Notes" textarea
   - Enter detailed instructions (500 characters)
   - ✅ Character counter shows: "500/2000"

2. **Test Character Limit:**
   - Continue typing until 2000 characters
   - ✅ Counter shows: "2000/2000"
   - Try to type more
   - ✅ Input blocked or shows error
   - ✅ Cannot exceed 2000 characters

3. **Save Workflow:**
   - Complete workflow creation
   - Click "Save"
   - ✅ Notes saved successfully

4. **Verify Notes Display:**
   - Open workflow detail page
   - ✅ Notes displayed in "Documentation" section
   - Open workflow preview
   - ✅ Notes displayed at bottom of preview

5. **Test Optional Nature:**
   - Create new workflow
   - Leave notes field empty
   - ✅ Can still save workflow
   - ✅ Notes field nullable

**Expected Result:** Notes field works with 2000 char limit, optional

---

### Scenario 4.4: Task Time Tracking - Automatic Timestamps

**Objective:** Verify automatic timestamp recording for task start/complete

**Test Steps:**

1. **Start Task:**
   - Find a pending task
   - Note current time: 14:30:00
   - Click "Start Task"
   - Wait for confirmation

2. **Verify Start Timestamp:**
   - Check task details (via API or UI)
   - ✅ `started_at` field set
   - ✅ Timestamp accurate (within 1 second of click time)
   - ✅ Format: ISO 8601 (e.g., "2025-11-03T14:30:00Z")

3. **Work on Task:**
   - Wait 2 hours (or simulate by updating database)

4. **Complete Task:**
   - Note current time: 16:30:00
   - Click "Complete Task"
   - Enter notes
   - Submit

5. **Verify Completion Timestamp:**
   - ✅ `completed_at` field set
   - ✅ Timestamp accurate
   - ✅ Duration calculated: 2h 0m

6. **Verify Duration Display:**
   - Check task detail view
   - ✅ Shows duration: "2h 0m"
   - ✅ Duration color: green/yellow/red based on expected time

**Expected Result:** Timestamps automatically recorded with accurate duration calculation

---

### Scenario 4.5: Duration Calculations and Formatting

**Objective:** Test duration utility functions

**Test Steps:**

1. **Test Duration Formatting:**
   - Complete tasks with various durations:
     - Task 1: 30 minutes
     - Task 2: 1.5 hours
     - Task 3: 3 hours 15 minutes

2. **Verify Format Display:**
   - Task 1: ✅ "30m"
   - Task 2: ✅ "1h 30m"
   - Task 3: ✅ "3h 15m"
   - ✅ Format concise and readable

3. **Test Average Duration:**
   - View task statistics
   - ✅ Shows average: "1h 38m"
   - ✅ Calculation accurate

4. **Test Duration Color Coding:**
   - Task completed in <avg time: ✅ Green
   - Task completed in avg time ±20%: ✅ Yellow
   - Task completed in >avg time +20%: ✅ Red
   - Pending task with no duration: ✅ Gray

**Expected Result:** Duration utilities format and color-code correctly

---

### Scenario 4.6: Task Statistics View

**Objective:** Test task_statistics database view accuracy

**Test Steps:**

1. **Setup Test Data:**
   - Complete 10 instances of "Serial Entry" task:
     - 5 completed in 1-2 hours
     - 3 completed in 2-3 hours
     - 2 completed in 3-4 hours

2. **Query Statistics:**
   - Call `analytics.getTaskTypeStats()`
   - Find "Serial Entry" task in results

3. **Verify Aggregations:**
   - ✅ `total_executions`: 10
   - ✅ `completed_count`: 10
   - ✅ `avg_hours`: ~2.3 (calculated correctly)
   - ✅ `min_hours`: ~1.0
   - ✅ `max_hours`: ~4.0
   - ✅ `median_hours`: ~2.5

4. **Test Real-Time Update:**
   - Complete another instance (5 hours)
   - Re-query statistics
   - ✅ `total_executions`: 11
   - ✅ `max_hours`: ~5.0 (updated)
   - ✅ `avg_hours` recalculated

**Expected Result:** Statistics view provides accurate aggregations updated in real-time

---

### Scenario 4.7: Smart Assignment Suggestions - Workload Based

**Objective:** Test assignment suggestion algorithm

**Test Steps:**

1. **Setup User Workloads:**
   - Technician A: 5 active tasks (pending/in_progress)
   - Technician B: 2 active tasks
   - Technician C: 0 active tasks

2. **Create New Task:**
   - Create a new serial entry task
   - Task type: "Serial Entry"
   - Do NOT assign yet

3. **Get Assignment Suggestion:**
   - Call API:
     ```javascript
     const suggestion = await trpc.assignments.getSuggestion.query({
       taskId: 'new-task-id',
     });
     console.log(suggestion);
     ```

4. **Verify Suggestion:**
   - ✅ Suggests Technician C (lowest workload)
   - ✅ Response includes:
     - `userId`: Technician C ID
     - `userName`: "Technician C Name"
     - `workload`: 0
     - `reason`: "Technician C hiện không có công việc nào"
     - `avgCompletionTime`: null (no history)

5. **Test with Historical Data:**
   - Technician B has completed 10 serial entry tasks (avg: 1.5h)
   - Technician C has no history
   - Create another serial entry task
   - Get suggestion

6. **Verify Historical Consideration:**
   - ✅ Still suggests Technician C (lower workload)
   - OR
   - ✅ Suggests Technician B if algorithm weights experience
   - ✅ Reason mentions avg completion time: "Technician B có 2 công việc đang thực hiện và thường hoàn thành trong 1.5h"

**Expected Result:** Suggestion algorithm considers workload and historical performance

---

### Scenario 4.8: Workflow Drag-and-Drop Task Reordering

**Objective:** Test drag-and-drop task reordering in workflow builder

**Test Steps:**

1. **Create Workflow with Tasks:**
   - Navigate to `/workflows/new`
   - Add 5 tasks:
     - Task 1: "Kiểm tra"
     - Task 2: "Phê duyệt"
     - Task 3: "Xử lý"
     - Task 4: "Kiểm định"
     - Task 5: "Hoàn tất"

2. **Test Drag-and-Drop:**
   - Grab Task 3 ("Xử lý")
   - Drag to position 1
   - Drop

3. **Verify Reordering:**
   - ✅ Task order updates immediately:
     1. "Xử lý" (was Task 3)
     2. "Kiểm tra" (was Task 1)
     3. "Phê duyệt" (was Task 2)
     4. "Kiểm định" (was Task 4)
     5. "Hoàn tất" (was Task 5)
   - ✅ Sequence numbers auto-update
   - ✅ No page refresh required

4. **Test Multiple Reorders:**
   - Drag Task 5 to position 2
   - Drag Task 1 to position 4
   - ✅ All reorders reflected immediately
   - ✅ Visual feedback during drag

5. **Save Workflow:**
   - Click "Save"
   - ✅ Task order persisted to database
   - Reload page
   - ✅ Task order maintained

**Expected Result:** Drag-and-drop reordering smooth and persistent

---

## 🎯 Cross-Cutting Concerns

### Scenario CC.1: Role-Based Access Control

**Objective:** Verify RBAC enforced across all features

**Test Steps:**

1. **Technician Access:**
   - Login as Technician
   - ✅ Can view assigned tasks only
   - ✅ Can start/complete tasks
   - ✅ Can enter serials for any receipt
   - ✅ CANNOT create workflows
   - ✅ CANNOT access analytics APIs
   - ✅ CANNOT approve transfers

2. **Manager Access:**
   - Login as Manager
   - ✅ Can view all team tasks
   - ✅ Can create/edit workflows
   - ✅ Can approve transfers
   - ✅ Can access analytics APIs
   - ✅ Can view compliance metrics

3. **Admin Access:**
   - Login as Admin
   - ✅ Full access to all features
   - ✅ Can manage team members
   - ✅ Can configure system settings

**Expected Result:** Permissions enforced at database (RLS) and API (middleware) levels

---

### Scenario CC.2: Data Integrity - Concurrent Updates

**Objective:** Test data integrity with concurrent task updates

**Test Steps:**

1. **Setup:**
   - Open same task in 2 browser tabs
   - Login as same user in both

2. **Concurrent Start:**
   - In Tab 1, click "Start Task"
   - Immediately in Tab 2, click "Start Task"

3. **Verify:**
   - ✅ Only one start succeeds
   - ✅ Second attempt fails gracefully
   - ✅ Error: "Task already started"
   - ✅ No duplicate `started_at` timestamps

4. **Concurrent Complete:**
   - Start a task
   - Open in 2 tabs
   - Try to complete simultaneously

5. **Verify:**
   - ✅ Only one complete succeeds
   - ✅ No duplicate completions
   - ✅ Database remains consistent

**Expected Result:** Concurrent updates handled safely with no data corruption

---

### Scenario CC.3: Error Recovery

**Objective:** Test system resilience to errors

**Test Steps:**

1. **Network Failure:**
   - Start a task
   - Disconnect network before response returns
   - ✅ Error toast displayed
   - ✅ Task state unchanged
   - Reconnect network
   - Retry action
   - ✅ Action succeeds

2. **API Error:**
   - Simulate API error (500)
   - Try to complete task
   - ✅ Error message clear and actionable
   - ✅ User can retry
   - ✅ No partial state changes

3. **Validation Error:**
   - Try to save workflow with invalid data
   - ✅ Validation errors displayed
   - ✅ Form remains editable
   - ✅ User can correct and resubmit

**Expected Result:** Graceful error handling with clear user feedback

---

### Scenario CC.4: Vietnamese Localization

**Objective:** Verify all user-facing text in Vietnamese

**Test Steps:**

1. **UI Text:**
   - Navigate through all pages
   - ✅ All buttons in Vietnamese
   - ✅ All labels in Vietnamese
   - ✅ All error messages in Vietnamese
   - ✅ All toast notifications in Vietnamese

2. **Error Messages:**
   - Trigger various errors
   - ✅ Validation errors in Vietnamese
   - ✅ API errors in Vietnamese
   - ✅ No English fallbacks visible

3. **Date/Time Formatting:**
   - ✅ Dates formatted for Vietnamese locale
   - ✅ Time displayed in 24-hour format
   - ✅ Currency formatted as VND

**Expected Result:** Complete Vietnamese localization

---

### Scenario CC.5: Build Verification

**Objective:** Ensure production build succeeds with zero errors

**Test Steps:**

1. **Run Build:**
   ```bash
   pnpm build
   ```

2. **Verify:**
   - ✅ Build completes successfully
   - ✅ Zero TypeScript errors
   - ✅ Zero build warnings
   - ✅ Build time <3 minutes
   - ✅ All routes compiled successfully

3. **Check Bundle Size:**
   - ✅ Main bundle <500KB
   - ✅ Code splitting working
   - ✅ Lazy loading chunks generated

**Expected Result:** Production build clean and optimized

---

## 📊 Test Execution Summary

### Test Metrics

| Phase | Scenarios | Priority | Est. Time | Pass Criteria |
|-------|-----------|----------|-----------|---------------|
| Phase 1 | 12 | Critical | 2-3 hours | 100% pass |
| Phase 2 | 8 | Critical | 1.5-2 hours | 100% pass |
| Phase 3 | 10 | High | 2-3 hours | ≥90% pass |
| Phase 4 | 8 | High | 1.5-2 hours | ≥90% pass |
| Cross-Cutting | 5 | Critical | 1 hour | 100% pass |
| **Total** | **43** | - | **8-11 hours** | **≥95% overall** |

### Execution Schedule

**Day 1 (4 hours):**
- Morning: Phase 1 scenarios (1.1-1.12)
- Afternoon: Phase 2 scenarios (2.1-2.8)

**Day 2 (4 hours):**
- Morning: Phase 3 scenarios (3.1-3.10)
- Afternoon: Phase 4 scenarios (4.1-4.8)

**Day 3 (2-3 hours):**
- Morning: Cross-cutting scenarios (CC.1-CC.5)
- Afternoon: Bug fixes and retesting

### Pass/Fail Criteria

**PASS if:**
- ✅ All Critical scenarios (Phase 1, 2, CC) pass 100%
- ✅ High priority scenarios (Phase 3, 4) pass ≥90%
- ✅ All performance benchmarks met
- ✅ Zero critical bugs
- ✅ Zero data integrity issues

**CONCERNS if:**
- ⚠️ 1-2 High priority scenarios fail
- ⚠️ Performance slightly below benchmarks (<20% deviation)
- ⚠️ Minor UI/UX issues
- ⚠️ Non-blocking bugs found

**FAIL if:**
- ❌ Any Critical scenario fails
- ❌ Data corruption possible
- ❌ Security vulnerabilities found
- ❌ Performance <50% of benchmarks
- ❌ System unusable in key workflows

---

## 🐛 Bug Reporting Template

When bugs are found during testing, report using this template:

```markdown
**Bug ID:** BUG-001
**Severity:** Critical/High/Medium/Low
**Phase:** Phase X, Scenario X.X
**Title:** Short description

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happens

**Impact:**
User impact description

**Screenshots:**
[Attach if applicable]

**Environment:**
- Browser: Chrome 120
- User Role: Technician
- Date/Time: 2025-11-03 14:30
```

---

## ✅ Test Sign-Off

### Completion Checklist

- [ ] All scenarios executed
- [ ] Test results documented
- [ ] Bugs logged and triaged
- [ ] Performance benchmarks measured
- [ ] Screenshots/recordings captured
- [ ] Stakeholder review completed

### Sign-Off

**Tester:** ___________________________
**Date:** ___________________________
**Result:** PASS / CONCERNS / FAIL
**Notes:** ___________________________

---

## 📚 References

- **Implementation Plan:** `docs/IMPLEMENTATION-PLAN-FINAL-STATUS.md`
- **Architecture Docs:** `docs/PHASE-3-ARCHITECTURE-DECISIONS.md`
- **User Guide:** `docs/USER-GUIDE-TASK-MANAGEMENT.md`
- **API Docs:** tRPC router definitions in `src/server/routers/`

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Test Architect:** Quinn 🧪
**Status:** Ready for Execution
