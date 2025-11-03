# User Acceptance Test Plan - Phase 2: Serial Entry Workflow System

**Document Version:** 1.0
**Project:** Service Center Management System
**Phase:** Phase 2 - Serial Entry Workflow
**Prepared By:** QA Team
**Date:** November 3, 2025
**Status:** Ready for Review

---

## Document Control

| Version | Date | Author | Changes | Approved By |
|---------|------|--------|---------|-------------|
| 0.1 | Nov 3, 2025 | QA Lead | Initial draft | - |
| 1.0 | Nov 3, 2025 | QA Lead | Final version | Pending |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Test Objectives](#2-test-objectives)
3. [Scope](#3-scope)
4. [Test Approach](#4-test-approach)
5. [Test Environment](#5-test-environment)
6. [Test Data Requirements](#6-test-data-requirements)
7. [Entry and Exit Criteria](#7-entry-and-exit-criteria)
8. [Test Cases](#8-test-cases)
9. [Defect Management](#9-defect-management)
10. [Roles and Responsibilities](#10-roles-and-responsibilities)
11. [UAT Schedule](#11-uat-schedule)
12. [Risk Assessment](#12-risk-assessment)
13. [Sign-Off Criteria](#13-sign-off-criteria)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This User Acceptance Test (UAT) plan defines the testing strategy, approach, resources, and schedule for validating Phase 2 of the Service Center Management System: Serial Entry Workflow System.

### 1.2 Background

Phase 2 introduces automated task management for inventory serial entry, addressing the #1 operational pain point: missing serial numbers in stock receipts. The system uses database triggers to automatically create and complete tasks based on serial entry progress.

### 1.3 Business Value

- **Primary Goal:** Achieve 100% serial entry compliance
- **Impact:** Eliminates manual task tracking overhead
- **ROI:** Reduces time spent on serial entry coordination by 60%
- **Compliance:** Improves warranty claim management accuracy

### 1.4 UAT Duration

**Total Duration:** 5 business days (Week 8)
**Test Execution:** Days 1-4 (November X-X, 2025)
**Feedback & Decision:** Day 5 (November X, 2025)

---

## 2. Test Objectives

### 2.1 Primary Objectives

1. **Validate Functional Correctness**
   - Automatic task creation when receipts approved
   - Real-time progress tracking as serials entered
   - Automatic task/receipt completion at 100%
   - Task reopening when serials deleted

2. **Verify Usability**
   - Dashboard intuitive for daily use
   - Color-coded priority system helpful
   - Filters and sorting improve workflow
   - Mobile experience acceptable for warehouse use

3. **Confirm Performance**
   - Dashboard loads < 500ms
   - Progress updates < 2 seconds
   - Serial entry saves < 300ms
   - System handles 50+ concurrent tasks

4. **Validate Business Rules**
   - Only approved receipts trigger task creation
   - Tasks cannot start before receipt approval
   - Progress percentage accurate at all times
   - Receipt completion logic correct

### 2.2 Secondary Objectives

- Identify usability improvements for Phase 3
- Gather user feedback on feature priorities
- Validate training materials effectiveness
- Assess readiness for production rollout

---

## 3. Scope

### 3.1 In Scope

#### Features to Test

1. **Automatic Task Creation**
   - Trigger on receipt approval
   - One task per product
   - Task metadata (product, quantity)
   - Due date calculation (created_at + 7 days)

2. **Serial Entry Progress Tracking**
   - Real-time percentage calculation
   - Color-coded progress bars (red/yellow/green)
   - Serial count display (X / Y)
   - Priority badges (Urgent/In Progress/Complete)

3. **Automatic Task Completion**
   - Task auto-completes at 100%
   - Receipt auto-completes when all tasks done
   - Timestamps set correctly
   - Metadata tracks auto-completion

4. **Task Reopening Logic**
   - Task reopens when serials deleted
   - Progress recalculates correctly
   - Receipt reopens if was completed
   - Audit trail preserved

5. **Dashboard Functionality**
   - Task listing with entity context
   - Filters: All/Mine/Available/Overdue
   - Sorting: Priority/Date/Progress/Age
   - Stats: Total/Mine/Overdue/Available
   - Grouping by priority level

6. **Navigation & Actions**
   - Link from task to receipt
   - Start task action
   - Complete task action
   - Toast notifications

7. **Mobile Experience**
   - Responsive layout
   - Touch-friendly targets
   - Performance on tablets
   - Keyboard interactions

#### User Roles to Test

- ✅ Admin (workflow setup, approvals)
- ✅ Manager (oversight, reporting)
- ✅ Technician (serial entry, task completion)
- ⚠️ Reception (verify no unauthorized access)

### 3.2 Out of Scope

#### Not Testing in UAT

- Workflow creation UI (tested in Phase 1)
- Receipt creation/editing (existing functionality)
- Serial entry form (existing functionality)
- Task assignment logic (existing functionality)
- Email notifications (not implemented yet)
- Reporting dashboards (future phase)
- API endpoint testing (developer responsibility)
- Database trigger unit tests (developer responsibility)
- Load testing 100+ users (performance team responsibility)

### 3.3 Assumptions

1. Test environment is stable and available 9am-5pm daily
2. Test data is prepared before UAT starts
3. Participants available full-time during UAT week
4. Developers available for bug fixes during UAT
5. Staging database isolated from production
6. Rollback plan prepared and tested

### 3.4 Constraints

1. UAT must complete in 5 days (business constraint)
2. No more than 5 participants (resource constraint)
3. Testing during business hours only (warehouse operational hours)
4. Mobile testing limited to available devices
5. Cannot test with real production data (data privacy)

---

## 4. Test Approach

### 4.1 Testing Methodology

**Type:** User Acceptance Testing (UAT)
**Style:** Scenario-based testing with real user workflows
**Execution:** Manual testing by end users
**Documentation:** Test case execution tracked in spreadsheet

### 4.2 Test Strategy

#### Phase 1: Guided Testing (Days 1-3)

- QA leads participants through scripted scenarios
- Step-by-step instructions provided
- Expected results clearly defined
- Participants execute, QA observes and records results

#### Phase 2: Exploratory Testing (Day 4)

- Participants explore features independently
- Encouraged to try edge cases and variations
- "Break it if you can" mindset
- QA available for questions and bug reporting

#### Phase 3: Feedback Collection (Day 5)

- Structured feedback form completion
- Group discussion of findings
- Prioritization of issues found
- Go/No-Go decision meeting

### 4.3 Testing Types

| Type | Description | Responsibility |
|------|-------------|----------------|
| **Functional Testing** | Verify features work as specified | All participants |
| **Usability Testing** | Assess ease of use and intuitiveness | All participants |
| **Regression Testing** | Ensure existing features still work | QA Lead |
| **Integration Testing** | Verify data flow between components | QA Lead + Admin |
| **Performance Testing** | Measure response times and load handling | QA Lead |
| **Mobile Testing** | Validate tablet/phone experience | Technicians |
| **Exploratory Testing** | Find unexpected issues | All participants |

### 4.4 Test Execution Process

```
1. QA explains scenario → 2. Participant performs steps → 3. QA observes
                                        ↓
                            4. Compare actual vs expected
                                        ↓
                    5a. PASS: Document    OR    5b. FAIL: Log bug
                                        ↓
                            6. Move to next scenario
```

### 4.5 Bug Triage Process

**Daily Bug Triage Meeting:** 4:00 PM daily

1. QA presents bugs found during day
2. Team assigns severity (P0/P1/P2/P3)
3. Developers estimate fix time
4. P0/P1 bugs assigned for immediate fix
5. P2/P3 bugs documented for future sprint

---

## 5. Test Environment

### 5.1 Environment Specification

**Environment Name:** Staging
**URL:** http://staging.service-center.local:3025
**Database:** PostgreSQL (Supabase) - Staging instance
**Purpose:** Isolated UAT environment, production-like configuration

### 5.2 Infrastructure Requirements

#### Application Server
- **Platform:** Node.js 20.x
- **Framework:** Next.js 15.5.4
- **Deployment:** Docker container
- **Resources:** 4GB RAM, 2 CPU cores

#### Database Server
- **Database:** PostgreSQL 15.x (via Supabase)
- **Connection:** postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Migrations:** All Phase 1 + Phase 2 migrations applied
- **Seeded Data:** Test users, workflows, receipts, products

#### Network
- **Access:** Internal network only
- **Latency:** < 50ms between app and database
- **Bandwidth:** Sufficient for 5 concurrent users

### 5.3 Test Data Requirements

See Section 6 for detailed test data requirements.

### 5.4 Browser and Device Matrix

#### Desktop Browsers (Required)
- ✅ Chrome 120+ (Primary)
- ✅ Firefox 121+ (Secondary)
- ✅ Edge 120+ (Tertiary)
- ⚠️ Safari 17+ (Optional, if available)

#### Mobile Devices (Required)
- ✅ iPad (iOS 16+, Safari)
- ✅ Android Tablet (Chrome)
- ⚠️ iPhone (iOS 16+, optional)

#### Screen Resolutions to Test
- Desktop: 1920x1080, 1366x768
- Tablet: 1024x768 (portrait and landscape)
- Mobile: 375x667 (if testing phones)

### 5.5 Access and Credentials

**Test User Accounts:**

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Admin | `uat_admin` | `UAT_Test2025!` | uat_admin@test.local |
| Manager | `uat_manager` | `UAT_Test2025!` | uat_manager@test.local |
| Technician 1 | `uat_tech1` | `UAT_Test2025!` | uat_tech1@test.local |
| Technician 2 | `uat_tech2` | `UAT_Test2025!` | uat_tech2@test.local |
| Technician 3 | `uat_tech3` | `UAT_Test2025!` | uat_tech3@test.local |

**Note:** Credentials provided to participants on Day 1 of UAT.

### 5.6 Environment Setup Checklist

**Pre-UAT Setup (Day -1):**

- [ ] Database restored from production-like snapshot
- [ ] All Phase 2 migrations applied successfully
- [ ] Test users created with correct roles
- [ ] Test workflows created and activated
- [ ] 50 test stock receipts loaded (various states)
- [ ] Test products loaded (ZOTAC, SSTC products)
- [ ] Application deployed to staging
- [ ] Smoke tests passed
- [ ] Performance baseline measured
- [ ] Backup taken (for rollback if needed)

---

## 6. Test Data Requirements

### 6.1 Test Data Overview

**Purpose:** Provide realistic data that covers all test scenarios
**Volume:** 50 stock receipts, 150 products, 5 test users
**Source:** Anonymized production data + synthetic data

### 6.2 Required Test Entities

#### 6.2.1 Workflows

| Workflow | Entity Type | Tasks | Status |
|----------|-------------|-------|--------|
| Serial Entry Workflow | `inventory_receipt` | Auto-created per product | Active |

#### 6.2.2 Stock Receipts

**Total Receipts:** 50

| Receipt State | Quantity | Purpose |
|---------------|----------|---------|
| Pending (no workflow) | 5 | Test workflow assignment |
| Pending (with workflow) | 5 | Test approval → task creation |
| Approved (tasks created, 0% progress) | 10 | Test serial entry from scratch |
| Approved (tasks in progress, 30%) | 10 | Test progress tracking |
| Approved (tasks in progress, 70%) | 10 | Test near-completion |
| Approved (tasks at 100%, receipt not complete) | 5 | Test receipt auto-completion |
| Completed | 5 | Test task reopening (delete serials) |

#### 6.2.3 Products

**Total Products:** 150 (50 receipts × 3 products avg)

| Product Type | Brand | Example | Quantity per Receipt |
|--------------|-------|---------|---------------------|
| Graphics Cards | ZOTAC | RTX 4070, RTX 4060 | 5-20 units |
| NVMe SSDs | SSTC | 1TB, 2TB | 10-50 units |
| RAM | SSTC | DDR5 32GB | 5-20 units |
| Mini PCs | ZOTAC | ZBOX Series | 2-10 units |

#### 6.2.4 Serial Numbers

**Total Serials:** ~1,500 (varying completion levels)

**Naming Convention:**
- Graphics Cards: `RTX4070-001`, `RTX4070-002`, ...
- SSDs: `NVME1TB-001`, `NVME1TB-002`, ...
- RAM: `DDR5-32GB-001`, `DDR5-32GB-002`, ...
- Mini PCs: `ZBOX-001`, `ZBOX-002`, ...

#### 6.2.5 Entity Tasks

**Total Tasks:** ~150 (50 receipts × 3 products avg)

| Task Status | Quantity | Purpose |
|-------------|----------|---------|
| Pending | 30 | Test task starting |
| In Progress | 60 | Test serial entry and progress |
| Completed | 45 | Test display of completed tasks |
| Blocked | 5 | Test blocked task handling |
| Skipped | 10 | Test optional task skipping |

### 6.3 Test Data Generation Scripts

**Script Location:** `docs/data/phase2-uat-test-data.sql`

**Generation Steps:**

```sql
-- 1. Create test users (if not exist)
-- 2. Create test products
-- 3. Create test warehouses
-- 4. Create Serial Entry workflow
-- 5. Create 50 stock receipts with items
-- 6. Assign workflows to receipts
-- 7. Approve 35 receipts (trigger task creation)
-- 8. Insert varying amounts of serials (simulate progress)
-- 9. Set some tasks to in_progress, completed
-- 10. Verify data integrity
```

**Execution:** Run script during environment setup (Day -1)

### 6.4 Data Privacy & Security

- ✅ All test data is synthetic or anonymized
- ✅ No real customer names, addresses, or contact info
- ✅ No real serial numbers (use test patterns)
- ✅ Test environment isolated from production
- ✅ Data purged after UAT completion

---

## 7. Entry and Exit Criteria

### 7.1 Entry Criteria (Must be met before UAT starts)

#### Technical Readiness

- [x] All Phase 2 code merged to main branch
- [x] Build passing with zero errors
- [x] All Phase 2 migrations applied to staging database
- [x] Database triggers verified (auto-create, auto-complete)
- [x] Entity adapter registered and functional
- [x] tRPC endpoints responding correctly

#### Environment Readiness

- [ ] Staging environment deployed and stable
- [ ] Test data loaded successfully
- [ ] Test user accounts created and verified
- [ ] Smoke tests passed (all critical paths working)
- [ ] Performance baseline measured
- [ ] Backup taken (for rollback)

#### Documentation Readiness

- [x] UAT test plan approved
- [x] Test scenarios documented
- [x] Feedback forms prepared
- [x] Bug report templates ready
- [ ] Training materials available (quick reference guide)

#### Team Readiness

- [ ] UAT participants identified and confirmed
- [ ] UAT schedule communicated to all participants
- [ ] Kickoff meeting scheduled
- [ ] Developers on standby for bug fixes
- [ ] QA team prepared to facilitate testing

#### Business Readiness

- [ ] Stakeholders aware of UAT schedule
- [ ] Go/No-Go decision makers identified
- [ ] Rollback plan approved
- [ ] Production deployment window reserved

**Entry Criteria Sign-Off:**

- [ ] QA Lead
- [ ] Tech Lead
- [ ] Product Owner

### 7.2 Exit Criteria (Must be met to approve production deployment)

#### Functional Criteria

- [ ] All 8 test scenarios executed
- [ ] Pass rate >= 95% (38/40 test cases)
- [ ] Zero P0 (Critical) bugs open
- [ ] P1 (High) bugs <= 3
- [ ] All P0/P1 bugs fixed and verified
- [ ] Regression testing passed (Phase 1 features intact)

#### Usability Criteria

- [ ] Average user satisfaction >= 4.0/5.0
- [ ] >= 80% users confident using system daily
- [ ] Color-coded priority system rated helpful (4+/5)
- [ ] Mobile experience rated acceptable (3+/5)
- [ ] No major usability blockers identified

#### Performance Criteria

- [ ] Dashboard load time < 500ms (95th percentile)
- [ ] Serial entry save < 300ms (95th percentile)
- [ ] Progress update < 2 seconds (real-time)
- [ ] No performance degradation vs baseline

#### Documentation Criteria

- [ ] All bugs documented with repro steps
- [ ] Test execution results recorded
- [ ] User feedback forms collected (5/5)
- [ ] Known issues list prepared (for release notes)

#### Business Criteria

- [ ] Go/No-Go decision meeting held
- [ ] Stakeholders approve production deployment
- [ ] Training materials reviewed and approved
- [ ] Rollback plan tested and ready

**Exit Criteria Sign-Off:**

- [ ] QA Lead - All testing complete, results documented
- [ ] Tech Lead - Code quality acceptable, bugs resolved
- [ ] Product Owner - Features meet business requirements
- [ ] Stakeholder - Approve production rollout

---

## 8. Test Cases

### 8.1 Test Case Structure

Each test case includes:
- **TC ID:** Unique identifier
- **Priority:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- **Scenario:** Which scenario it belongs to
- **Preconditions:** System state before test
- **Test Steps:** Numbered steps to execute
- **Expected Results:** What should happen
- **Actual Results:** What actually happened (filled during execution)
- **Status:** Pass / Fail / Blocked
- **Notes:** Additional observations

### 8.2 Test Case Summary

| Scenario | Test Cases | Total | Critical (P0) | High (P1) |
|----------|------------|-------|---------------|-----------|
| 1. Auto Task Creation | TC-001 to TC-005 | 5 | 3 | 2 |
| 2. Progress Tracking | TC-006 to TC-010 | 5 | 3 | 2 |
| 3. Receipt Auto-Complete | TC-011 to TC-015 | 5 | 4 | 1 |
| 4. Task Reopening | TC-016 to TC-020 | 5 | 3 | 2 |
| 5. Filtering & Sorting | TC-021 to TC-025 | 5 | 1 | 4 |
| 6. Visual Organization | TC-026 to TC-030 | 5 | 2 | 3 |
| 7. Mobile Experience | TC-031 to TC-035 | 5 | 2 | 3 |
| 8. Error Handling | TC-036 to TC-040 | 5 | 4 | 1 |
| **TOTAL** | | **40** | **22** | **18** |

---

### 8.3 Detailed Test Cases

#### Scenario 1: Automatic Task Creation

---

**TC-001: Verify workflow assignment to receipt**

**Priority:** P1
**Preconditions:**
- Admin logged in
- Serial Entry Workflow exists and is active
- Stock receipt in 'pending' status with 3 products

**Test Steps:**
1. Navigate to stock receipts list
2. Open test receipt (ID: `<receipt-id>`)
3. Click "Assign Workflow" button
4. Select "Serial Entry Workflow" from dropdown
5. Click "Save"

**Expected Results:**
- Workflow dropdown displays available workflows
- Can select workflow successfully
- Toast notification: "Đã gán quy trình"
- Receipt shows workflow_id in database

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-002: Verify tasks auto-create on receipt approval (Happy Path)**

**Priority:** P0 (CRITICAL)
**Preconditions:**
- Receipt has workflow assigned
- Receipt status = 'pending'
- Receipt has 3 products: RTX 4070 (10 units), NVMe SSD (20 units), RAM (5 units)

**Test Steps:**
1. Admin approves receipt (change status to 'approved')
2. Wait 2 seconds for trigger to execute
3. Navigate to `/my-tasks/serial-entry`
4. Verify tasks appear in dashboard

**Expected Results:**
- 3 tasks created automatically (one per product)
- Task names: "Enter serials for [product_name]"
- Task status: 'pending'
- Task due_date: receipt.created_at + 7 days
- Task metadata contains: product_id, expected_quantity, receipt_item_id
- Tasks visible in dashboard within 2 seconds

**Database Verification:**
```sql
SELECT count(*) FROM entity_tasks
WHERE entity_type = 'inventory_receipt' AND entity_id = '<receipt-id>';
-- Expected: 3
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-003: Verify task creation is idempotent (no duplicates)**

**Priority:** P0 (CRITICAL)
**Preconditions:**
- Receipt already has tasks created (from TC-002)

**Test Steps:**
1. Admin edits receipt (change some non-critical field)
2. Trigger UPDATE on stock_receipts table
3. Wait 2 seconds
4. Navigate to `/my-tasks/serial-entry`
5. Count tasks for this receipt

**Expected Results:**
- Still 3 tasks (no duplicates created)
- Original task IDs unchanged
- Trigger logs: "tasks already exist, skipping"

**Database Verification:**
```sql
SELECT count(*) FROM entity_tasks
WHERE entity_type = 'inventory_receipt' AND entity_id = '<receipt-id>';
-- Expected: 3 (not 6)
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-004: Verify tasks NOT created if no workflow assigned**

**Priority:** P1
**Preconditions:**
- Receipt has NO workflow assigned (workflow_id = NULL)
- Receipt status = 'pending'

**Test Steps:**
1. Admin approves receipt
2. Wait 2 seconds
3. Navigate to `/my-tasks/serial-entry`
4. Verify no tasks appear

**Expected Results:**
- Zero tasks created
- No error shown to user
- Trigger logs: "No workflow assigned, skipping"
- Receipt status = 'approved' (approval succeeds)

**Database Verification:**
```sql
SELECT count(*) FROM entity_tasks
WHERE entity_type = 'inventory_receipt' AND entity_id = '<receipt-id>';
-- Expected: 0
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-005: Verify task metadata contains correct data**

**Priority:** P1
**Preconditions:**
- Tasks created from TC-002

**Test Steps:**
1. Query database for task metadata
2. Verify metadata structure and values

**Expected Results:**
- metadata contains `product_id` (UUID)
- metadata contains `product_name` (string)
- metadata contains `expected_quantity` (integer)
- metadata contains `receipt_item_id` (UUID)
- metadata contains `auto_created` = true
- All values match stock_receipt_items table

**Database Verification:**
```sql
SELECT
  name,
  metadata->>'product_id' as product_id,
  metadata->>'product_name' as product_name,
  metadata->>'expected_quantity' as expected_quantity,
  metadata->>'receipt_item_id' as receipt_item_id,
  metadata->>'auto_created' as auto_created
FROM entity_tasks
WHERE entity_type = 'inventory_receipt' AND entity_id = '<receipt-id>';
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

#### Scenario 2: Serial Entry Progress Tracking

---

**TC-006: Verify progress updates from 0% to 30%**

**Priority:** P0 (CRITICAL)
**Preconditions:**
- Task exists for RTX 4070 (10 units expected)
- Current progress: 0/10 (0%)

**Test Steps:**
1. Technician navigates to `/my-tasks/serial-entry`
2. Verify task shows 0% progress, red bar, "Cần xử lý ngay" badge
3. Click "Nhập Serial" button to go to receipt
4. Enter 3 serials: `RTX4070-001`, `RTX4070-002`, `RTX4070-003`
5. Return to `/my-tasks/serial-entry`
6. Verify progress updated

**Expected Results:**
- Initial state: 0%, red bar, urgent badge
- After 3 serials: 30%, red bar (still < 50%), serial count "3 / 10 (30%)"
- Progress updates within 2 seconds of last serial entry
- No page refresh needed

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-007: Verify progress color changes at 50% threshold**

**Priority:** P0 (CRITICAL)
**Preconditions:**
- Task at 30% from TC-006

**Test Steps:**
1. Enter 3 more serials (total 6/10 = 60%)
2. Return to dashboard
3. Verify color changed to yellow

**Expected Results:**
- Progress: 60%
- Progress bar color: YELLOW (not red)
- Badge: "Đang xử lý" (not "Cần xử lý ngay")
- Priority level: high (not urgent)

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-008: Verify progress reaches 100% and turns green**

**Priority:** P0 (CRITICAL)
**Preconditions:**
- Task at 60% from TC-007

**Test Steps:**
1. Enter 4 more serials (total 10/10 = 100%)
2. Return to dashboard
3. Verify progress at 100%, green bar, checkmark

**Expected Results:**
- Progress: 100%
- Progress bar color: GREEN
- Badge: "Hoàn thành"
- Checkmark icon visible
- Task status: 'completed' (auto-changed)
- Priority level: low

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-009: Verify serial count display accuracy**

**Priority:** P1
**Preconditions:**
- Various tasks at different progress levels

**Test Steps:**
1. Navigate to dashboard
2. For each task, verify serial count matches database

**Expected Results:**
- Format: "X / Y (Z%)" where X=entered, Y=expected, Z=percentage
- Percentage calculation: (X/Y)*100, rounded to nearest integer
- Matches database serial_count exactly

**Database Verification:**
```sql
SELECT
  sri.declared_quantity,
  sri.serial_count,
  ROUND((sri.serial_count::numeric / sri.declared_quantity) * 100) as percentage
FROM stock_receipt_items sri
WHERE receipt_id = '<receipt-id>';
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-010: Verify progress updates in real-time**

**Priority:** P1
**Preconditions:**
- Two users logged in: Tech1 and Tech2
- Both viewing same task dashboard

**Test Steps:**
1. Tech1: Add 1 serial
2. Tech2: Refresh dashboard (or wait for auto-refresh if implemented)
3. Tech2: Verify progress updated

**Expected Results:**
- Tech2 sees updated progress after refresh
- If auto-refresh: updates without manual refresh (within 30s)
- Both users see same progress value
- No stale data displayed

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

#### Scenario 3: Receipt Auto-Completion

---

**TC-011: Verify task auto-completes at 100% progress**

**Priority:** P0 (CRITICAL)
**Preconditions:**
- Task at 99% (e.g., 19/20 serials for NVMe SSD)

**Test Steps:**
1. Enter final serial (20th serial)
2. Wait 2 seconds
3. Check task status in dashboard

**Expected Results:**
- Task status changes to 'completed' automatically
- completed_at timestamp set
- No manual "Complete" button click needed
- metadata has `auto_completed` = true
- Task moves to "ĐÃ HOÀN THÀNH" section

**Database Verification:**
```sql
SELECT status, completed_at, metadata->>'auto_completed'
FROM entity_tasks WHERE id = '<task-id>';
-- Expected: status='completed', completed_at NOT NULL, auto_completed='true'
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-012: Verify receipt auto-completes when all tasks done**

**Priority:** P0 (CRITICAL)
**Preconditions:**
- Receipt has 3 tasks
- 2 tasks already completed (100%)
- 1 task at 99% (19/20)

**Test Steps:**
1. Enter final serial for last task (reaches 100%)
2. Wait 2 seconds
3. Check receipt status

**Expected Results:**
- Last task auto-completes
- Receipt status changes to 'completed' automatically
- receipt.completed_at timestamp set
- All 3 tasks show status = 'completed'
- Receipt visible in "Completed Receipts" list

**Database Verification:**
```sql
-- Check all tasks complete
SELECT count(*) FROM entity_tasks
WHERE entity_id = '<receipt-id>' AND status = 'completed';
-- Expected: 3

-- Check receipt complete
SELECT status, completed_at FROM stock_receipts WHERE id = '<receipt-id>';
-- Expected: status='completed', completed_at NOT NULL
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-013: Verify receipt completion timestamp accuracy**

**Priority:** P1
**Preconditions:**
- Receipt just auto-completed from TC-012

**Test Steps:**
1. Query receipt.completed_at timestamp
2. Query last task.completed_at timestamp
3. Compare timestamps

**Expected Results:**
- receipt.completed_at >= last_task.completed_at
- Difference < 2 seconds (immediate completion)
- Timestamps in correct timezone (UTC or local)

**Database Verification:**
```sql
SELECT
  r.completed_at as receipt_completed,
  t.completed_at as last_task_completed,
  EXTRACT(EPOCH FROM (r.completed_at - t.completed_at)) as diff_seconds
FROM stock_receipts r
JOIN LATERAL (
  SELECT completed_at FROM entity_tasks
  WHERE entity_id = r.id
  ORDER BY completed_at DESC LIMIT 1
) t ON true
WHERE r.id = '<receipt-id>';
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-014: Verify receipt does NOT complete if optional tasks incomplete**

**Priority:** P1
**Preconditions:**
- Receipt has 3 required tasks + 1 optional task
- 3 required tasks completed
- 1 optional task not completed

**Test Steps:**
1. Verify all required tasks at 100%
2. Verify optional task < 100%
3. Check receipt status

**Expected Results:**
- Receipt auto-completes (optional tasks don't block)
- Receipt status = 'completed'
- Optional task can still be completed after receipt complete

**Database Verification:**
```sql
SELECT status FROM stock_receipts WHERE id = '<receipt-id>';
-- Expected: 'completed' even if optional task incomplete
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-015: Verify audit log entry created for auto-completion**

**Priority:** P2
**Preconditions:**
- Receipt auto-completed from TC-012

**Test Steps:**
1. Query audit_logs table
2. Verify entry exists for receipt completion

**Expected Results:**
- Audit log entry exists
- action = 'receipt_completed' or similar
- entity_type = 'stock_receipt'
- entity_id = receipt ID
- details mentions auto-completion
- timestamp matches receipt.completed_at

**Database Verification:**
```sql
SELECT * FROM audit_logs
WHERE entity_type = 'stock_receipt'
AND entity_id = '<receipt-id>'
AND action LIKE '%complet%'
ORDER BY created_at DESC LIMIT 1;
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

#### Scenario 4: Task Reopening (Serial Deletion)

---

**TC-016: Verify task reopens when serial deleted (100% → 80%)**

**Priority:** P0 (CRITICAL)
**Preconditions:**
- Task completed (10/10 serials = 100%)
- Task status = 'completed'

**Test Steps:**
1. Navigate to receipt detail
2. Delete 2 serials (e.g., RTX4070-009, RTX4070-010)
3. Confirm deletion
4. Return to dashboard
5. Verify task reopened

**Expected Results:**
- Task status changes to 'in_progress' (from 'completed')
- Progress shows 80% (8/10)
- Progress bar color: YELLOW (50-99%)
- Badge: "Đang xử lý"
- completed_at cleared (NULL)
- metadata has `reopened` = true

**Database Verification:**
```sql
SELECT status, completed_at, metadata->>'reopened'
FROM entity_tasks WHERE id = '<task-id>';
-- Expected: status='in_progress', completed_at IS NULL, reopened='true'
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-017: Verify receipt reopens when serial deleted**

**Priority:** P0 (CRITICAL)
**Preconditions:**
- Receipt completed (all tasks 100%)
- Receipt status = 'completed'

**Test Steps:**
1. Delete serials from one task (drops below 100%)
2. Check receipt status

**Expected Results:**
- Receipt status changes to 'approved' (from 'completed')
- receipt.completed_at cleared (NULL)
- Receipt moves out of "Completed" list
- Receipt remains approved (not back to pending)

**Database Verification:**
```sql
SELECT status, completed_at FROM stock_receipts WHERE id = '<receipt-id>';
-- Expected: status='approved', completed_at IS NULL
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-018: Verify task can be re-completed after reopening**

**Priority:** P1
**Preconditions:**
- Task reopened from TC-016 (8/10 = 80%)

**Test Steps:**
1. Re-enter the 2 deleted serials
2. Verify task auto-completes again

**Expected Results:**
- Task reaches 100% again (10/10)
- Task auto-completes to 'completed'
- Green bar, checkmark visible
- Metadata tracks both completion events

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-019: Verify progress recalculates correctly after deletion**

**Priority:** P1
**Preconditions:**
- Task at various progress levels

**Test Steps:**
1. Note current progress (e.g., 7/10 = 70%)
2. Delete 2 serials
3. Verify progress recalculates

**Expected Results:**
- New progress: 5/10 = 50%
- Progress bar updates correctly
- Color changes if crosses threshold (e.g., 70% yellow → 50% red NO, 50% is still yellow)
- Serial count display accurate

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-020: Verify audit trail preserved during reopening**

**Priority:** P2
**Preconditions:**
- Task has been completed, then reopened

**Test Steps:**
1. Query task metadata
2. Verify history preserved

**Expected Results:**
- Original completion timestamp still in metadata
- Reopen timestamp recorded
- Both `auto_completed` and `reopened` flags present
- Audit logs show both events

**Database Verification:**
```sql
SELECT metadata FROM entity_tasks WHERE id = '<task-id>';
-- Should contain completion_time AND reopen_time
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

#### Scenario 5: Filtering & Sorting

---

**TC-021: Verify "All" filter shows all tasks**

**Priority:** P1
**Preconditions:**
- Dashboard has 15 tasks total
- 5 assigned to current user
- 10 unassigned

**Test Steps:**
1. Manager navigates to `/my-tasks/serial-entry`
2. Click "Tất cả" filter tab
3. Count displayed tasks

**Expected Results:**
- Shows all 15 tasks
- Stats header: "Tất cả: 15"
- Includes both assigned and unassigned tasks
- Includes all progress levels

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-022: Verify "Mine" filter shows only user's tasks**

**Priority:** P0 (CRITICAL)
**Preconditions:**
- Technician 1 logged in
- 3 tasks assigned to Tech1
- 12 other tasks (assigned to others or unassigned)

**Test Steps:**
1. Navigate to `/my-tasks/serial-entry`
2. Default filter should be "Của tôi"
3. Verify only Tech1's tasks shown

**Expected Results:**
- Shows only 3 tasks (assigned to Tech1)
- Tasks assigned to others hidden
- Unassigned tasks hidden
- Stats header: "Của tôi: 3"

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-023: Verify "Available" filter shows unassigned tasks**

**Priority:** P1
**Preconditions:**
- 10 unassigned tasks (assigned_to_id IS NULL)
- 5 assigned tasks

**Test Steps:**
1. Tech2 navigates to dashboard
2. Click "Có thể hỗ trợ" filter
3. Verify only unassigned tasks shown

**Expected Results:**
- Shows 10 unassigned tasks
- Tasks assigned to anyone hidden
- Stats header: "Có thể hỗ trợ: 10"
- Tech2 can claim these tasks (if feature exists)

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-024: Verify "Overdue" filter shows only overdue tasks**

**Priority:** P1
**Preconditions:**
- 3 tasks past due_date
- 12 tasks on-time or no due_date

**Test Steps:**
1. Manager clicks "Quá hạn" filter
2. Verify only overdue tasks shown

**Expected Results:**
- Shows 3 overdue tasks only
- Tasks with due_date in future hidden
- Tasks with no due_date hidden
- Stats header: "Quá hạn: 3"
- Overdue tasks have red border

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-025: Verify "Priority" sort orders correctly**

**Priority:** P2
**Preconditions:**
- Tasks at various progress: 20%, 60%, 85%, 100%

**Test Steps:**
1. Ensure sort = "Độ ưu tiên" (default)
2. Observe task order

**Expected Results:**
- Urgent (0-49%) at top
- High (50-99%) next
- Normal next
- Completed (100%) at bottom
- Within same priority, sorted by age or date

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

#### Scenario 6: Visual Priority Organization

---

**TC-026: Verify urgent section displays correctly**

**Priority:** P1
**Preconditions:**
- 3 tasks at 0-49% progress

**Test Steps:**
1. Navigate to dashboard
2. Observe urgent section

**Expected Results:**
- Section header: "CẦN XỬ LÝ NGAY" (red color)
- Red AlertCircle icon
- Badge showing count: "3"
- Tasks have red progress bars
- Tasks have "Cần xử lý ngay" badge (destructive variant)

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-027: Verify high priority section displays correctly**

**Priority:** P1
**Preconditions:**
- 2 tasks at 50-99% progress

**Test Steps:**
1. Navigate to dashboard
2. Observe high priority section

**Expected Results:**
- Section header: "ĐANG XỬ LÝ" (yellow/orange color)
- Yellow AlertCircle icon
- Badge showing count: "2"
- Tasks have yellow progress bars
- Tasks have "Đang xử lý" badge

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-028: Verify completed section displays correctly**

**Priority:** P2
**Preconditions:**
- 5 tasks at 100% progress

**Test Steps:**
1. Navigate to dashboard
2. Observe completed section

**Expected Results:**
- Section header: "ĐÃ HOÀN THÀNH" (green color)
- Green ClipboardList icon
- Badge showing count: "5"
- Tasks have green progress bars
- Tasks have "Hoàn thành" badge
- Checkmark icons visible on task cards

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-029: Verify sections are clearly separated**

**Priority:** P2
**Preconditions:**
- Multiple sections with tasks

**Test Steps:**
1. View dashboard
2. Assess visual separation

**Expected Results:**
- Clear spacing between sections (margin/padding)
- Different header colors for each section
- Easy to distinguish sections at a glance
- No visual confusion about which section a task belongs to

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-030: Verify empty sections display helpful message**

**Priority:** P3
**Preconditions:**
- Filter set such that no tasks match (e.g., "Mine" but user has no tasks)

**Test Steps:**
1. Apply filter with no results
2. Observe empty state

**Expected Results:**
- Empty state card displayed
- Icon (ClipboardList or similar)
- Message: "Không có task nào"
- Context-specific message (e.g., "Bạn không có serial entry task nào. Tuyệt vời!")
- No broken UI or error messages

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

#### Scenario 7: Mobile Experience

---

**TC-031: Verify responsive layout on tablet**

**Priority:** P1
**Preconditions:**
- Access site on iPad or Android tablet
- Screen size: 1024x768

**Test Steps:**
1. Navigate to `/my-tasks/serial-entry`
2. Observe layout

**Expected Results:**
- Layout adjusts to tablet screen (1 or 2 columns)
- Text readable without zoom
- Touch targets >= 44x44px (Apple HIG guideline)
- No horizontal scrolling
- Filter tabs accessible and tappable
- Stats cards visible and formatted correctly

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-032: Verify serial entry on mobile works smoothly**

**Priority:** P0 (CRITICAL for warehouse use)
**Preconditions:**
- Tech on tablet
- Task needs serial entry

**Test Steps:**
1. Tap task card
2. Tap "Nhập Serial" button
3. Navigate to receipt detail
4. Enter 5 serials using on-screen keyboard

**Expected Results:**
- Navigation smooth, no delays
- Serial entry form responsive
- Keyboard appears correctly (alphanumeric)
- Each serial saves successfully (< 500ms on 4G)
- Toast notifications visible and readable
- No input lag or freezing

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-033: Verify touch gestures work correctly**

**Priority:** P1
**Preconditions:**
- Mobile device

**Test Steps:**
1. Tap task card (should navigate or expand)
2. Scroll dashboard (should scroll smoothly)
3. Tap buttons (should activate)
4. Tap filter tabs (should switch filters)

**Expected Results:**
- All taps register correctly (no double-tap required)
- Scroll smooth (60fps if possible)
- No accidental activations
- Swipe gestures don't interfere with UI

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-034: Verify portrait and landscape orientation**

**Priority:** P2
**Preconditions:**
- Tablet device

**Test Steps:**
1. View dashboard in portrait
2. Rotate to landscape
3. Verify layout adjusts

**Expected Results:**
- Layout adjusts correctly on rotation
- No content cut off
- All features accessible in both orientations
- Preferred: landscape shows 2-column grid

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-035: Verify performance on mobile network**

**Priority:** P1
**Preconditions:**
- Device on 4G network (not WiFi)

**Test Steps:**
1. Load dashboard on 4G
2. Measure load time
3. Perform serial entry
4. Measure save time

**Expected Results:**
- Dashboard load: < 1s (acceptable on 4G)
- Serial entry save: < 500ms
- Progress update: < 1s
- No timeout errors
- Acceptable user experience (subjective)

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

#### Scenario 8: Error Handling

---

**TC-036: Verify duplicate serial entry prevented**

**Priority:** P0 (CRITICAL - data integrity)
**Preconditions:**
- Serial `RTX4070-001` already exists in receipt

**Test Steps:**
1. Try to enter `RTX4070-001` again
2. Observe error

**Expected Results:**
- Validation error displayed
- Toast notification: "Serial đã tồn tại" or similar
- Serial NOT duplicated in database
- User can correct and try different serial

**Database Verification:**
```sql
SELECT count(*) FROM stock_receipt_serials
WHERE serial_number = 'RTX4070-001' AND receipt_item_id = '<item-id>';
-- Expected: 1 (not 2)
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-037: Verify empty serial rejected**

**Priority:** P0 (CRITICAL - data integrity)
**Preconditions:**
- Serial entry form open

**Test Steps:**
1. Leave serial field empty
2. Try to save
3. Observe error

**Expected Results:**
- Validation error: "Serial không được để trống"
- Form does not submit
- No empty serial in database

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-038: Verify network interruption handled gracefully**

**Priority:** P1
**Preconditions:**
- Network connection active

**Test Steps:**
1. Disconnect network (airplane mode or WiFi off)
2. Try to enter serial
3. Observe error
4. Reconnect network
5. Retry serial entry

**Expected Results:**
- Error toast: "Lỗi kết nối mạng" or similar
- Serial not saved during disconnection
- After reconnect, retry succeeds
- No data corruption or lost data

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-039: Verify concurrent updates handled correctly**

**Priority:** P0 (CRITICAL - data integrity)
**Preconditions:**
- Two users (Tech1, Tech2) viewing same receipt

**Test Steps:**
1. Tech1 enters serial `NVME-001`
2. Tech2 enters serial `NVME-002` immediately after
3. Both refresh and verify

**Expected Results:**
- Both serials saved successfully (no conflict)
- Progress updates correctly for both users
- No lost updates
- Database has both serials

**Database Verification:**
```sql
SELECT count(*) FROM stock_receipt_serials
WHERE receipt_item_id = '<item-id>'
AND serial_number IN ('NVME-001', 'NVME-002');
-- Expected: 2
```

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

**TC-040: Verify unauthorized role access prevented**

**Priority:** P1
**Preconditions:**
- Reception user logged in (if role exists)

**Test Steps:**
1. Reception user tries to access `/my-tasks/serial-entry`
2. Observe behavior

**Expected Results:**
- Either: Empty dashboard (no tasks for reception role)
- Or: Unauthorized page (403)
- Or: Redirect to appropriate page
- No error crash or 500 error
- Graceful handling

**Actual Results:**
[ To be filled during execution ]

**Status:** [ ] Pass [ ] Fail [ ] Blocked

**Notes:**
____________________________________________________________

---

## 9. Defect Management

### 9.1 Bug Severity Definitions

| Severity | Definition | Example | Response Time |
|----------|------------|---------|---------------|
| **P0 - Critical** | System unusable, data loss, security issue | Database triggers not firing, data corruption | Fix immediately (< 4 hours) |
| **P1 - High** | Major feature broken, workaround difficult | Task creation fails, progress not updating | Fix within 24 hours |
| **P2 - Medium** | Feature partially broken, workaround exists | Sort not working, filter shows wrong count | Fix before production |
| **P3 - Low** | Minor issue, cosmetic, enhancement | Text alignment, color shade off | Document for future |

### 9.2 Bug Reporting Process

**Step 1: Bug Discovery**
- Participant encounters issue during test execution
- Participant notifies QA Lead immediately (for P0) or at end of session (P1-P3)

**Step 2: Bug Verification**
- QA Lead attempts to reproduce bug
- If reproducible: Log as confirmed bug
- If not reproducible: Mark as "needs more info", request additional details

**Step 3: Bug Logging**
- QA Lead logs bug in tracking system (spreadsheet or Jira)
- Assigns bug ID, severity, scenario, detailed repro steps
- Attaches screenshots/videos if available

**Step 4: Daily Triage**
- 4:00 PM daily: Bug triage meeting
- Team reviews all bugs found that day
- Confirms severity assignments
- Assigns bugs to developers
- P0/P1 bugs scheduled for immediate fix

**Step 5: Bug Fix & Verification**
- Developer fixes bug
- Developer notifies QA when ready for retest
- QA verifies fix in staging environment
- If fixed: Mark as "Verified", retest in next UAT session
- If not fixed: Return to developer with details

**Step 6: Regression Testing**
- After all bugs fixed, QA runs regression tests
- Ensures bug fixes didn't break other features
- Verifies all P0/P1 bugs remain fixed

### 9.3 Bug Status Workflow

```
New → Open → Assigned → In Progress → Fixed → Verified → Closed
         ↓                                 ↓
    Won't Fix                        Reopen (if not fixed)
```

### 9.4 Bug Report Template

**Bug ID:** BUG-P1-042
**Severity:** P0 / P1 / P2 / P3
**Status:** New / Open / Assigned / In Progress / Fixed / Verified / Closed
**Reported By:** [Name], [Role]
**Date Reported:** YYYY-MM-DD HH:MM
**Test Case:** TC-XXX
**Environment:** Staging / Production
**Browser/Device:** Chrome 120 / iPad iOS 16

**Summary:**
One-line description of the bug

**Description:**
Detailed description of what went wrong

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshots/Videos:**
[Attach files]

**Database State (if relevant):**
```sql
SELECT * FROM ...;
```

**Console Errors (if any):**
```
Error message from browser console
```

**Workaround:**
[If any exists]

**Assigned To:** [Developer Name]
**Fixed In:** [Build/Commit ID]
**Verified By:** [QA Name]
**Verified Date:** YYYY-MM-DD

### 9.5 Critical Bug Escalation

**P0 Bug Discovery:**
1. QA Lead immediately notifies Tech Lead (Slack/Phone)
2. Development team stops current work
3. Emergency meeting within 30 minutes
4. Assess impact: Can UAT continue or must pause?
5. Fix deployed to staging ASAP
6. Verified before resuming UAT

**Multiple P1 Bugs:**
- If > 5 P1 bugs found in single day: Escalate to Product Owner
- Assess if UAT should pause for major fixes
- May extend UAT duration if needed

---

## 10. Roles and Responsibilities

### 10.1 QA Team

**QA Lead** (Full-time during UAT)

**Responsibilities:**
- Facilitate UAT sessions daily
- Guide participants through test scenarios
- Observe and record test execution
- Log bugs with detailed repro steps
- Triage bugs daily with development team
- Track test execution progress
- Verify bug fixes
- Run regression tests
- Collect user feedback forms
- Prepare UAT completion report
- Make Go/No-Go recommendation

**Deliverables:**
- Daily test execution summary
- Bug reports with repro steps
- Test result spreadsheet (40 test cases)
- UAT completion report
- Go/No-Go recommendation document

---

**QA Analyst** (Part-time support)

**Responsibilities:**
- Assist with test data preparation
- Help participants with technical issues
- Document observed usability issues
- Take screenshots/videos of bugs
- Assist with regression testing

---

### 10.2 Development Team

**Tech Lead**

**Responsibilities:**
- Available for P0 bug escalation
- Review and approve bug severity
- Assign bugs to developers
- Code review bug fixes
- Approve Go/No-Go decision
- Authorize production deployment

---

**Developer 1 & 2**

**Responsibilities:**
- Fix assigned bugs during UAT
- Deploy fixes to staging for verification
- Available for questions during UAT
- Support QA with repro steps if needed
- Attend daily bug triage meetings

---

### 10.3 Business Team

**Product Owner**

**Responsibilities:**
- Recruit and schedule UAT participants
- Ensure participant availability
- Review UAT results and feedback
- Make final Go/No-Go decision
- Approve production deployment
- Communicate with stakeholders

---

### 10.4 UAT Participants

**Admin** (1 person)

**Responsibilities:**
- Test workflow assignment
- Test receipt approval
- Test task creation verification
- Execute assigned test cases
- Provide feedback on admin features
- Report bugs encountered

**Time Commitment:** 4 hours/day × 4 days + 2 hours Day 5 = 18 hours

---

**Manager** (1 person)

**Responsibilities:**
- Test dashboard oversight features
- Test filtering and sorting
- Assess visual priority system
- Execute assigned test cases
- Provide feedback on reporting/monitoring features
- Report bugs encountered

**Time Commitment:** 4 hours/day × 4 days + 2 hours Day 5 = 18 hours

---

**Technicians** (3 people)

**Responsibilities:**
- Test serial entry workflow
- Test task claiming and completion
- Test mobile experience (tablets)
- Execute assigned test cases
- Provide feedback on daily workflow
- Report bugs encountered

**Time Commitment:** 4 hours/day × 4 days + 2 hours Day 5 = 18 hours each

---

### 10.5 RACI Matrix

| Activity | QA Lead | QA Analyst | Tech Lead | Developers | Product Owner | Participants |
|----------|---------|------------|-----------|------------|---------------|--------------|
| UAT Planning | R | C | A | I | C | I |
| Test Data Prep | A | R | I | C | I | - |
| Test Execution | A | C | I | I | I | R |
| Bug Logging | R | C | I | I | I | C |
| Bug Triage | C | I | A | R | C | I |
| Bug Fixing | I | I | A | R | I | - |
| Bug Verification | R | C | A | I | I | - |
| Feedback Collection | R | C | I | I | A | R |
| Go/No-Go Decision | C | I | A | C | R | I |
| Production Deployment | I | I | A | R | R | - |

**Legend:** R=Responsible, A=Accountable, C=Consulted, I=Informed

---

## 11. UAT Schedule

### 11.1 Weekly Schedule

**Week 8 (November X-X, 2025)**

| Day | Date | Activities | Participants | Hours |
|-----|------|------------|--------------|-------|
| **Day -1** | Thursday | Environment setup, data loading | QA Team + Devs | 8h |
| **Day 1** | Monday | Kickoff + Scenarios 1-2 | All 5 + QA | 6h |
| **Day 2** | Tuesday | Scenarios 3-4 | All 5 + QA | 6h |
| **Day 3** | Wednesday | Scenarios 5-6 | All 5 + QA | 6h |
| **Day 4** | Thursday | Scenarios 7-8 + Exploratory | All 5 + QA | 6h |
| **Day 5** | Friday | Feedback + Go/No-Go | All 5 + QA + Leads | 4h |

### 11.2 Daily Schedule (Days 1-4)

**9:00 AM - 9:15 AM:** Daily Standup
- Review yesterday's progress (Days 2-4)
- Preview today's scenarios
- Address questions or blockers

**9:15 AM - 12:00 PM:** Morning Test Session
- Execute assigned test scenarios
- QA observes and takes notes
- Log bugs as discovered

**12:00 PM - 1:00 PM:** Lunch Break

**1:00 PM - 3:30 PM:** Afternoon Test Session
- Continue test execution
- Exploratory testing encouraged
- QA available for support

**3:30 PM - 4:00 PM:** Participant Feedback Time
- Fill out daily feedback forms (quick survey)
- Rest break

**4:00 PM - 5:00 PM:** Bug Triage Meeting (QA + Developers)
- Review bugs found today
- Assign severity and priority
- Schedule fixes

### 11.3 Day 5 Schedule (Go/No-Go)

**9:00 AM - 10:00 AM:** Final Feedback Form Completion
- Participants complete detailed UAT feedback form
- QA collects and compiles responses

**10:00 AM - 11:30 AM:** Debrief Discussion
- Group discussion of findings
- What went well, what needs improvement
- Prioritization of issues

**11:30 AM - 1:00 PM:** Lunch + QA Report Preparation

**1:00 PM - 2:00 PM:** QA Presents Results
- Test execution summary (pass/fail rates)
- Bug summary (P0/P1/P2/P3 counts)
- User feedback summary (satisfaction scores)
- Recommendation: Go or No-Go

**2:00 PM - 3:00 PM:** Go/No-Go Decision Meeting
- Tech Lead, Product Owner, QA Lead, Stakeholders
- Review results and recommendation
- Decide: Deploy to production or extend UAT

**3:00 PM - 5:00 PM:** (If GO) Production Deployment Preparation
- Final regression tests
- Deployment checklist verification
- Rollback plan review

**5:00 PM:** (If GO) Deploy to Production

---

## 12. Risk Assessment

### 12.1 Identified Risks

| Risk ID | Risk Description | Probability | Impact | Mitigation Strategy | Owner |
|---------|------------------|-------------|--------|---------------------|-------|
| **R1** | UAT participants not available full-time | Medium | High | Confirm availability 1 week before, have backup participants | Product Owner |
| **R2** | Test environment unstable (crashes, slow) | Low | High | Stabilize environment Day -1, have rollback snapshot | QA Lead |
| **R3** | P0 bugs found requiring major rework | Medium | Critical | Daily bug triage, developers on standby, may extend UAT | Tech Lead |
| **R4** | Test data doesn't cover all scenarios | Medium | Medium | Review test data with team, add missing cases Day -1 | QA Analyst |
| **R5** | Users find feature confusing (< 60% satisfaction) | Medium | High | Gather feedback early (Day 2-3), iterate UX if needed | Product Owner |
| **R6** | Performance issues with 50+ tasks | Low | Medium | Load testing before UAT, optimize if needed | Developers |
| **R7** | Mobile devices not available for testing | Low | Medium | Borrow tablets from warehouse, test on available devices | QA Lead |
| **R8** | Network/database issues during UAT | Low | High | Have backup connectivity, database snapshots for restore | QA Lead |
| **R9** | Too many bugs found (> 10 P1) | Medium | High | May need to extend UAT, prioritize critical fixes first | Tech Lead |
| **R10** | Participants give up due to frustration | Low | Critical | QA provides hands-on support, positive encouragement | QA Lead |

### 12.2 Risk Response Plan

**IF multiple P0 bugs found:**
- PAUSE UAT immediately
- Emergency bug fix session
- Re-deploy to staging
- Re-run affected test scenarios
- May extend UAT by 1-2 days

**IF user satisfaction < 60%:**
- Conduct additional feedback sessions
- Identify specific pain points
- Assess if UX changes needed
- May extend UAT for iterations

**IF test environment fails:**
- Restore from backup snapshot (Day -1 backup)
- Deploy to alternative environment if needed
- Pause UAT until stable

---

## 13. Sign-Off Criteria

### 13.1 UAT Completion Sign-Off

**This UAT is considered complete when:**

- [ ] All 40 test cases executed
- [ ] Pass rate >= 95% (38/40)
- [ ] All P0 bugs resolved and verified
- [ ] P1 bugs <= 3 (and documented)
- [ ] All 5 participants completed feedback forms
- [ ] Average satisfaction >= 4.0/5.0
- [ ] UAT completion report prepared
- [ ] Go/No-Go decision made

**Signed:**

**QA Lead:** _________________________ Date: _________
(Certifies all testing complete and results documented)

**Tech Lead:** _________________________ Date: _________
(Certifies technical quality acceptable for production)

**Product Owner:** _________________________ Date: _________
(Certifies features meet business requirements)

### 13.2 Production Deployment Sign-Off

**Production deployment is approved when:**

- [ ] UAT sign-off complete
- [ ] Go decision made
- [ ] All P0/P1 bugs resolved
- [ ] Regression tests passed
- [ ] Rollback plan tested and ready
- [ ] Deployment checklist complete
- [ ] Monitoring dashboards prepared
- [ ] Support team briefed

**Signed:**

**Tech Lead:** _________________________ Date: _________
(Approves production deployment)

**Product Owner:** _________________________ Date: _________
(Authorizes production release)

**Stakeholder:** _________________________ Date: _________
(Acknowledges business impact and approves)

---

## 14. Appendices

### Appendix A: Test Data Generation Script

**File:** `docs/data/phase2-uat-test-data.sql`

See separate script file for test data generation.

### Appendix B: Quick Reference Guide (for Participants)

**Will be provided on Day 1:**
- System login instructions
- Key features overview
- Navigation guide
- Common tasks quick reference

### Appendix C: Feedback Form Template

**Will be distributed Day 5:**
- Satisfaction rating (1-5 scale)
- Open-ended questions
- Feature-specific feedback
- Improvement suggestions

### Appendix D: Bug Tracking Spreadsheet

**Columns:**
- Bug ID
- Severity
- Test Case ID
- Summary
- Status
- Assigned To
- Reported By
- Date Reported
- Date Fixed
- Date Verified

### Appendix E: Test Execution Tracking Sheet

**Columns:**
- Test Case ID
- Scenario
- Priority
- Tester
- Execution Date
- Status (Pass/Fail/Blocked)
- Notes
- Bug ID (if failed)

---

## Document Approval

**Prepared By:**

QA Lead: _________________________ Date: _________

**Reviewed By:**

Tech Lead: _________________________ Date: _________

Product Owner: _________________________ Date: _________

**Approved By:**

Project Manager: _________________________ Date: _________

---

**END OF UAT TEST PLAN**

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Next Review:** After UAT completion
**Status:** ✅ Ready for UAT Execution
