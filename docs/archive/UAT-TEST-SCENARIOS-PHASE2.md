# UAT Test Scenarios: Phase 2 Serial Entry Workflow

**Date:** November 3, 2025
**Phase:** 2 - Serial Entry Tasks
**Status:** Ready for UAT Execution
**Duration:** 5 days (Week 8)
**Participants:** 5 (1 Admin, 1 Manager, 3 Technicians)

---

## 📋 UAT Overview

### Objectives

1. Verify automatic task creation works correctly
2. Validate serial entry progress tracking accuracy
3. Test auto-completion logic for tasks and receipts
4. Confirm color-coded priority system helps users
5. Validate filters and sorting functionality
6. Ensure navigation flows are intuitive
7. Test error handling and edge cases
8. Gather user feedback on usability

### Success Criteria

- ✅ All 8 scenarios pass without P0 bugs
- ✅ >80% user satisfaction score (4/5 on feedback form)
- ✅ < 3 P1 bugs discovered
- ✅ All participants complete training successfully
- ✅ Zero data corruption or loss

### Test Environment

**Database:** Staging (isolated from production)
**URL:** http://localhost:3025 (development server)
**Test Data:** 50 stock receipts with varying products and quantities

---

## 👥 Participant Roles

### Admin (1 person)
**Responsibilities:**
- Create and assign workflows
- Approve stock receipts
- Monitor overall system performance
- Access all tasks across organization

### Manager (1 person)
**Responsibilities:**
- Oversee serial entry progress
- Review compliance metrics
- Reassign tasks if needed
- Generate reports

### Technicians (3 people)
**Responsibilities:**
- Claim and complete serial entry tasks
- Enter serials for products
- Report blockers or issues
- Use mobile devices for testing

---

## 🧪 Test Scenarios

### Scenario 1: Workflow Assignment & Task Creation

**Goal:** Verify automatic task creation when receipt approved

**Preconditions:**
- Admin has created "Serial Entry Workflow" for inventory_receipt
- Stock receipt created with 3 products:
  - ZOTAC RTX 4070 (10 units)
  - SSTC NVMe SSD 1TB (20 units)
  - SSTC DDR5 RAM 32GB (5 units)

**Test Steps:**

1. **Admin:** Log in and navigate to stock receipts
2. **Admin:** Find test receipt (status = 'pending')
3. **Admin:** Assign "Serial Entry Workflow" to receipt
   - Expected: Workflow dropdown shows available workflows
   - Expected: Can select and save workflow assignment
4. **Admin:** Approve receipt (change status to 'approved')
   - Expected: Approval succeeds
   - Expected: Toast notification: "Đã duyệt phiếu nhập kho"
5. **Admin:** Navigate to `/my-tasks` or `/my-tasks/serial-entry`
   - Expected: 3 new tasks created automatically
   - Expected: Task names:
     - "Enter serials for ZOTAC RTX 4070"
     - "Enter serials for SSTC NVMe SSD 1TB"
     - "Enter serials for SSTC DDR5 RAM 32GB"
   - Expected: All tasks status = 'pending'
   - Expected: Due date = receipt.created_at + 7 days

**Database Verification:**
```sql
SELECT
  name,
  status,
  metadata->>'product_name' as product,
  metadata->>'expected_quantity' as quantity
FROM entity_tasks
WHERE entity_type = 'inventory_receipt'
  AND entity_id = '<test-receipt-id>'
ORDER BY sequence_order;
```

**Expected Result:**
- 3 rows returned
- Status = 'pending' for all
- Product names and quantities match receipt items

**Pass Criteria:**
- ✅ All 3 tasks created within 2 seconds
- ✅ Task names include product names
- ✅ Metadata contains correct product_id, expected_quantity
- ✅ Tasks appear in dashboard immediately
- ✅ No duplicate tasks created

**Failure Handling:**
- If tasks not created: Check trigger logs in Supabase logs
- If duplicates created: Check idempotency logic
- If wrong quantities: Verify stock_receipt_items data

---

### Scenario 2: Serial Entry Progress Tracking

**Goal:** Verify progress bar updates as serials are entered

**Preconditions:**
- Scenario 1 completed successfully
- Task "Enter serials for ZOTAC RTX 4070" exists (10 units expected)

**Test Steps:**

1. **Technician 1:** Log in and navigate to `/my-tasks/serial-entry`
2. **Technician 1:** Filter by "Mine" or "Available"
   - Expected: See task for RTX 4070 with progress 0%
   - Expected: Progress bar red (urgent)
   - Expected: Badge: "Cần xử lý ngay"
3. **Technician 1:** Click "Nhập Serial" button
   - Expected: Navigate to receipt detail page
   - Expected: Serial entry form visible for RTX 4070
4. **Technician 1:** Enter 3 serial numbers:
   - `RTX4070-001`
   - `RTX4070-002`
   - `RTX4070-003`
   - Expected: Each serial saves successfully
   - Expected: Toast: "Đã thêm serial"
5. **Technician 1:** Return to `/my-tasks/serial-entry`
   - Expected: Task progress bar shows **30%** (3/10)
   - Expected: Progress bar still **red** (< 50%)
   - Expected: Serial count: "3 / 10 (30%)"
6. **Technician 1:** Return to receipt and enter 3 more serials (total 6)
7. **Technician 1:** Check dashboard again
   - Expected: Progress bar shows **60%** (6/10)
   - Expected: Progress bar now **yellow** (>= 50%)
   - Expected: Badge: "Đang xử lý"
8. **Technician 1:** Enter remaining 4 serials (total 10)
9. **Technician 1:** Check dashboard final time
   - Expected: Progress bar shows **100%** (10/10)
   - Expected: Progress bar now **green**
   - Expected: Badge: "Hoàn thành"
   - Expected: Checkmark icon visible
   - Expected: Task status auto-changed to 'completed'

**Database Verification:**
```sql
-- Check serial count
SELECT serial_count
FROM stock_receipt_items
WHERE id = '<receipt-item-id>';

-- Check task status
SELECT status, completed_at
FROM entity_tasks
WHERE id = '<task-id>';
```

**Expected Result:**
- serial_count = 10
- task status = 'completed'
- completed_at timestamp set

**Pass Criteria:**
- ✅ Progress updates within 2 seconds of serial entry
- ✅ Color changes at correct thresholds (50%, 100%)
- ✅ Task auto-completes at 100%
- ✅ No manual completion needed
- ✅ Percentage calculation accurate

**Performance Requirements:**
- Progress query: < 200ms
- Serial entry save: < 300ms
- Dashboard refresh: < 500ms

---

### Scenario 3: Receipt Auto-Completion

**Goal:** Verify receipt auto-completes when all tasks done

**Preconditions:**
- Receipt has 3 tasks (from Scenario 1)
- 2 tasks already completed (RTX 4070, DDR5 RAM)
- 1 task remaining (NVMe SSD: 0/20 serials)

**Test Steps:**

1. **Technician 2:** Log in and navigate to `/my-tasks/serial-entry`
2. **Technician 2:** Find task "Enter serials for SSTC NVMe SSD 1TB"
   - Expected: Progress 0%, red bar, urgent
3. **Technician 2:** Click "Nhập Serial" to go to receipt
4. **Technician 2:** Enter all 20 serials for NVMe SSD
   - Use format: `NVME-001` through `NVME-020`
5. **Technician 2:** After entering serial #20:
   - Expected: Task auto-completes immediately
   - Expected: Receipt status auto-updates to 'completed'
   - Expected: Toast: "Đã hoàn thành phiếu nhập kho"
6. **Manager:** Navigate to stock receipts list
   - Expected: Test receipt shows status = 'completed'
   - Expected: completed_at timestamp set
7. **Manager:** Navigate to `/my-tasks/serial-entry`
   - Expected: All 3 tasks show 100% progress
   - Expected: All tasks in green "ĐÃ HOÀN THÀNH" section
   - Expected: Receipt marked complete in task context

**Database Verification:**
```sql
-- Check all tasks complete
SELECT count(*)
FROM entity_tasks
WHERE entity_type = 'inventory_receipt'
  AND entity_id = '<receipt-id>'
  AND status = 'completed';
-- Expected: 3

-- Check receipt status
SELECT status, completed_at
FROM stock_receipts
WHERE id = '<receipt-id>';
-- Expected: status='completed', completed_at is not null
```

**Pass Criteria:**
- ✅ Receipt auto-completes within 2 seconds
- ✅ No manual status change needed
- ✅ All 3 tasks show completed
- ✅ Timestamp accuracy
- ✅ Audit log entry created

**Edge Cases to Test:**
- What if tasks completed out of sequence?
- What if receipt already completed manually?

---

### Scenario 4: Serial Deletion (Task Reopening)

**Goal:** Verify task reopens if serials deleted

**Preconditions:**
- Scenario 3 completed (receipt fully complete)
- RTX 4070 task has 10/10 serials
- Task status = 'completed'

**Test Steps:**

1. **Admin:** Navigate to receipt detail page
2. **Admin:** Find RTX 4070 serial list (10 serials)
3. **Admin:** Delete 2 serials (e.g., RTX4070-009, RTX4070-010)
   - Expected: Confirmation dialog appears
   - Expected: Serials deleted successfully
4. **Admin:** Check serial count
   - Expected: Now shows 8/10 serials
5. **Admin:** Navigate to `/my-tasks/serial-entry`
   - Expected: RTX 4070 task **reopened**
   - Expected: Task status = 'in_progress' (not completed)
   - Expected: Progress bar shows **80%** (8/10)
   - Expected: Progress bar **yellow**
   - Expected: Badge: "Đang xử lý"
6. **Admin:** Check receipt status
   - Expected: Receipt status changed back to 'approved'
   - Expected: completed_at cleared (null)
7. **Technician 1:** Re-enter the 2 deleted serials
8. **Technician 1:** Verify task re-completes
   - Expected: Task status = 'completed' again
   - Expected: Receipt status = 'completed' again

**Database Verification:**
```sql
-- Check task reopened
SELECT status, completed_at, metadata->>'reopened' as reopened
FROM entity_tasks
WHERE id = '<task-id>';
-- Expected: status='in_progress' OR 'completed', reopened='true' in metadata

-- Check receipt reopened
SELECT status, completed_at
FROM stock_receipts
WHERE id = '<receipt-id>';
```

**Pass Criteria:**
- ✅ Task reopens immediately when serial deleted
- ✅ Progress % recalculates correctly
- ✅ Receipt reopens if was completed
- ✅ Can re-complete task after adding serials back
- ✅ Metadata tracks reopening event

**Important Notes:**
- This tests data integrity
- Ensures system handles corrections gracefully
- Audit trail preserved

---

### Scenario 5: Task Filtering & Sorting

**Goal:** Validate dashboard filters and sort options work

**Preconditions:**
- Test database has 10+ receipts with tasks
- Mix of:
  - Assigned vs unassigned tasks
  - Different progress levels (0%, 30%, 70%, 100%)
  - Some overdue tasks
  - Some on-time tasks

**Test Steps: Filter by "All"**

1. **Manager:** Navigate to `/my-tasks/serial-entry`
2. **Manager:** Click "Tất cả" filter tab
   - Expected: Shows all serial entry tasks in system
   - Expected: Stats header shows accurate counts
   - Expected: Tasks grouped by priority (Urgent/High/Normal/Complete)

**Test Steps: Filter by "Mine"**

3. **Technician 3:** Log in and navigate to dashboard
4. **Technician 3:** Default filter should be "Của tôi"
   - Expected: Only tasks assigned to Technician 3
   - Expected: Unassigned tasks hidden
   - Expected: "My Tasks" count matches displayed tasks

**Test Steps: Filter by "Available"**

5. **Technician 3:** Click "Có thể hỗ trợ" filter
   - Expected: Shows only unassigned tasks
   - Expected: Tasks assigned to others hidden
   - Expected: "Available" count matches displayed tasks
6. **Technician 3:** Claim an available task (if implemented)
   - Expected: Task moves to "Mine" filter after claim

**Test Steps: Filter by "Overdue"**

7. **Manager:** Click "Quá hạn" filter
   - Expected: Shows only tasks past due_date
   - Expected: Tasks with due_date in future hidden
   - Expected: "Overdue" count matches
   - Expected: Red border on overdue task cards

**Test Steps: Sort by "Priority" (Default)**

8. **Manager:** Ensure sort = "Độ ưu tiên"
   - Expected: Urgent tasks (0-49%) at top
   - Expected: High tasks (50-99%) next
   - Expected: Normal tasks next
   - Expected: Completed (100%) at bottom

**Test Steps: Sort by "Date"**

9. **Manager:** Change sort to "Ngày tạo"
   - Expected: Newest receipts first
   - Expected: Order changes based on created_at

**Test Steps: Sort by "Progress"**

10. **Manager:** Change sort to "Tiến độ"
    - Expected: Lowest % completion first
    - Expected: 0% tasks at top, 100% at bottom

**Test Steps: Sort by "Age"**

11. **Manager:** Change sort to "Tuổi task"
    - Expected: Oldest tasks first
    - Expected: Calculated from created_at

**Pass Criteria:**
- ✅ All 4 filters work correctly
- ✅ All 4 sort options work correctly
- ✅ Stats counters accurate
- ✅ Filtering + sorting can combine
- ✅ No performance issues with 100+ tasks
- ✅ URL updates with filter/sort state (optional)

**Performance Requirements:**
- Filter change: < 100ms
- Sort change: < 100ms
- Dashboard with 50 tasks: < 500ms initial load

---

### Scenario 6: Priority-Based Visual Organization

**Goal:** Verify color-coded sections help users prioritize

**Preconditions:**
- Dashboard has tasks at various progress levels:
  - 3 tasks at 0-30% (urgent)
  - 2 tasks at 50-80% (high)
  - 4 tasks at 85-99% (normal)
  - 5 tasks at 100% (completed)

**Test Steps:**

1. **Manager:** Navigate to `/my-tasks/serial-entry`
2. **Manager:** Observe visual organization
   - Expected: 4 distinct sections:
     - 🔴 "CẦN XỬ LÝ NGAY" (red header, 3 tasks)
     - 🟡 "ĐANG XỬ LÝ" (yellow header, 2 tasks)
     - 🔵 "BÌNH THƯỜNG" (blue header, 4 tasks)
     - 🟢 "ĐÃ HOÀN THÀNH" (green header, 5 tasks)
3. **Manager:** Verify urgent section (red)
   - Expected: Tasks with 0-49% progress
   - Expected: Red progress bars
   - Expected: Badge: "Cần xử lý ngay" (destructive variant)
4. **Manager:** Verify high priority section (yellow)
   - Expected: Tasks with 50-99% progress
   - Expected: Yellow progress bars
   - Expected: Badge: "Đang xử lý"
5. **Manager:** Verify completed section (green)
   - Expected: Tasks with 100% progress
   - Expected: Green progress bars
   - Expected: Checkmark icons
   - Expected: Badge: "Hoàn thành"

**User Feedback Questions:**
- Q: "Can you quickly identify which tasks need urgent attention?"
- Q: "Do the colors help you prioritize work?"
- Q: "Is the grouping intuitive?"
- Q: "Would you change anything about the visual design?"

**Pass Criteria:**
- ✅ Color coding matches completion %
- ✅ Sections clearly separated
- ✅ Icons help readability
- ✅ >80% users find it helpful
- ✅ No confusion about priority levels

---

### Scenario 7: Mobile Experience & Navigation

**Goal:** Verify system usable on tablets/phones

**Preconditions:**
- Technician has tablet or large phone
- Serial entry typically done in warehouse (not at desk)

**Test Steps:**

1. **Technician 2:** Access site on tablet (iPad/Android)
2. **Technician 2:** Navigate to `/my-tasks/serial-entry`
   - Expected: Responsive layout (1 column on mobile)
   - Expected: Touch targets large enough (min 44x44px)
   - Expected: Text readable without zoom
3. **Technician 2:** Tap a task card
   - Expected: Card clickable, no delays
   - Expected: "Nhập Serial" button easy to tap
4. **Technician 2:** Navigate to receipt detail
   - Expected: Serial entry form responsive
   - Expected: Keyboard appears for serial input
   - Expected: Can type serial without issues
5. **Technician 2:** Enter 5 serials on mobile
   - Expected: Each save succeeds
   - Expected: No performance issues
   - Expected: Toast notifications visible
6. **Technician 2:** Return to dashboard
   - Expected: Progress updated correctly
   - Expected: Scroll works smoothly
   - Expected: Filters accessible in mobile layout

**Mobile-Specific Tests:**
- Test on both portrait and landscape
- Test with virtual keyboard open
- Test touch gestures (swipe, tap, long-press)
- Test network interruption handling

**Pass Criteria:**
- ✅ All features accessible on mobile
- ✅ No layout breaking on small screens
- ✅ Touch targets large enough
- ✅ Performance acceptable on mobile network
- ✅ Users comfortable using mobile for serial entry

**Performance Requirements (Mobile):**
- Dashboard load: < 1s on 4G
- Serial entry save: < 500ms
- Progress update: < 1s

---

### Scenario 8: Error Handling & Edge Cases

**Goal:** Verify system handles errors gracefully

**Test Steps: Missing Workflow**

1. **Admin:** Create receipt WITHOUT assigning workflow
2. **Admin:** Approve receipt
   - Expected: Receipt approves successfully
   - Expected: NO tasks created (graceful skip)
   - Expected: No error shown to user
   - Expected: Database log: "No workflow assigned, skipping"

**Test Steps: Duplicate Serial Entry**

3. **Technician 1:** Enter serial `RTX4070-001`
4. **Technician 1:** Try to enter `RTX4070-001` again
   - Expected: Validation error
   - Expected: Toast: "Serial đã tồn tại"
   - Expected: Serial not duplicated in database

**Test Steps: Invalid Serial Format**

5. **Technician 1:** Try to enter empty serial
   - Expected: Validation error
   - Expected: Toast: "Serial không được để trống"
6. **Technician 1:** Try to enter serial with special chars (if restricted)
   - Expected: Validation error or sanitization

**Test Steps: Network Interruption**

7. **Technician 2:** Disconnect network
8. **Technician 2:** Try to enter serial
   - Expected: Error toast: "Lỗi kết nối mạng"
   - Expected: Serial not saved
9. **Technician 2:** Reconnect network
10. **Technician 2:** Retry serial entry
    - Expected: Succeeds on retry

**Test Steps: Concurrent Updates**

11. **Technician 1 & 2:** Both open same receipt
12. **Technician 1:** Enter serial `NVME-001`
13. **Technician 2:** Enter serial `NVME-002` immediately after
    - Expected: Both serials save successfully
    - Expected: No conflicts or lost updates
    - Expected: Progress bar updates correctly for both users

**Test Steps: Task Permissions**

14. **Reception user:** Log in (if reception role exists)
15. **Reception:** Try to access `/my-tasks/serial-entry`
    - Expected: Either empty (no tasks) or unauthorized
    - Expected: No error, graceful handling

**Pass Criteria:**
- ✅ No crashes or 500 errors
- ✅ User-friendly error messages in Vietnamese
- ✅ Data integrity maintained
- ✅ Concurrent updates handled
- ✅ Network errors recoverable
- ✅ Validation prevents bad data

---

## 📊 UAT Feedback Form

### To be filled by each participant after testing

**Participant Information:**
- Name: _________________
- Role: Admin / Manager / Technician
- Date: _________________

**Ease of Use (1-5 scale)**

| Feature | Rating | Comments |
|---------|--------|----------|
| Dashboard layout | ☐1 ☐2 ☐3 ☐4 ☐5 | |
| Color-coded priority | ☐1 ☐2 ☐3 ☐4 ☐5 | |
| Task filtering | ☐1 ☐2 ☐3 ☐4 ☐5 | |
| Progress tracking | ☐1 ☐2 ☐3 ☐4 ☐5 | |
| Navigation (to receipt) | ☐1 ☐2 ☐3 ☐4 ☐5 | |
| Mobile experience | ☐1 ☐2 ☐3 ☐4 ☐5 | |
| Overall satisfaction | ☐1 ☐2 ☐3 ☐4 ☐5 | |

**Functionality (Pass/Fail)**

| Scenario | Pass | Fail | Notes |
|----------|------|------|-------|
| 1. Automatic task creation | ☐ | ☐ | |
| 2. Progress tracking | ☐ | ☐ | |
| 3. Auto-completion | ☐ | ☐ | |
| 4. Task reopening | ☐ | ☐ | |
| 5. Filtering & sorting | ☐ | ☐ | |
| 6. Visual organization | ☐ | ☐ | |
| 7. Mobile experience | ☐ | ☐ | |
| 8. Error handling | ☐ | ☐ | |

**Open-Ended Questions:**

1. What did you like most about the serial entry task system?

   _____________________________________________________________

2. What frustrated you or seemed confusing?

   _____________________________________________________________

3. Would you use this system daily? Why or why not?

   _____________________________________________________________

4. Suggestions for improvement:

   _____________________________________________________________

**Bugs Found:**

| Severity | Description | Steps to Reproduce |
|----------|-------------|-------------------|
| P0/P1/P2 | | |

---

## 📈 UAT Success Metrics

### Quantitative Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Scenarios passed | 8/8 | ___ | Pending |
| Average satisfaction | >4.0/5.0 | ___ | Pending |
| P0 bugs found | 0 | ___ | Pending |
| P1 bugs found | <3 | ___ | Pending |
| Task completion rate | >90% | ___ | Pending |
| Average time per scenario | <30 min | ___ | Pending |

### Qualitative Metrics

- User confidence in using system daily: ___/5 participants
- Clarity of visual priority system: ___/5 participants
- Intuitiveness of filters: ___/5 participants
- Mobile usability: ___/5 participants

---

## 🚦 Go/No-Go Decision Criteria

### ✅ GO to Production If:

- ✅ All 8 scenarios pass
- ✅ Average satisfaction >80% (4.0/5.0)
- ✅ Zero P0 bugs
- ✅ < 3 P1 bugs (documented, scheduled for fix)
- ✅ All participants trained successfully
- ✅ Rollback plan ready

### ⚠️ NO-GO (Extend UAT) If:

- ⚠️ Any scenario fails
- ⚠️ Average satisfaction <60%
- ⚠️ Any P0 bugs found
- ⚠️ >5 P1 bugs found
- ⚠️ Users not confident using system
- ⚠️ Major UX issues discovered

---

## 📅 UAT Schedule (Week 8)

### Day 1 (Monday)
- **9:00 AM:** UAT kickoff meeting
- **9:30 AM:** System walkthrough (30 minutes)
- **10:00 AM:** Participants start Scenario 1-2
- **12:00 PM:** Lunch break
- **1:00 PM:** Continue testing
- **4:00 PM:** Daily standup, bug triage
- **5:00 PM:** Day 1 complete

### Day 2 (Tuesday)
- **9:00 AM:** Daily standup
- **9:15 AM:** Scenario 3-4
- **4:00 PM:** Bug triage
- **5:00 PM:** Day 2 complete

### Day 3 (Wednesday)
- **9:00 AM:** Daily standup
- **9:15 AM:** Scenario 5-6
- **4:00 PM:** Bug triage
- **5:00 PM:** Day 3 complete

### Day 4 (Thursday)
- **9:00 AM:** Daily standup
- **9:15 AM:** Scenario 7-8
- **2:00 PM:** Open testing (explore features)
- **4:00 PM:** Bug triage
- **5:00 PM:** Day 4 complete

### Day 5 (Friday)
- **9:00 AM:** Feedback collection
- **10:00 AM:** Feedback form completion
- **11:00 AM:** Debrief meeting
- **2:00 PM:** Go/No-Go decision
- **4:00 PM:** (If GO) Deploy to production
- **5:00 PM:** Week 8 complete

---

## 🔧 Bug Reporting Template

### Bug Report Format

**Bug ID:** BUG-P2-001
**Severity:** P0 / P1 / P2 / P3
**Reported By:** Name, Role
**Date:** YYYY-MM-DD
**Scenario:** Scenario #
**Environment:** Staging / Production

**Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshots/Video:**
(Attach if available)

**Workaround:**
(If any exists)

**Assigned To:**
Developer name

**Status:**
Open / In Progress / Fixed / Verified / Closed

---

## 📞 UAT Support Contacts

**Tech Lead:** Available for urgent P0 bugs (Slack/Phone)
**QA Lead:** Bug triage, scenario clarification (Slack)
**Product Owner:** Feature questions, go/no-go decision (Email/Slack)
**Developers:** Bug fixes during UAT (Slack)

**Escalation Path:**
1. P0 bugs → Notify Tech Lead immediately (Slack)
2. P1 bugs → Report in daily standup, fix same day
3. P2 bugs → Report in daily standup, fix before rollout
4. P3 bugs → Document for future sprint

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** Ready for UAT Execution
**Next Action:** Schedule UAT participants for Week 8

---

**End of UAT Test Scenarios Document**
