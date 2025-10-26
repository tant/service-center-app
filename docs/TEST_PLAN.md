# Service Center Phase 2 - Integration Test Plan

**Document Version:** 1.0
**Created:** 2025-10-24
**Last Updated:** 2025-10-24
**Phase:** Phase 7 - QA & Deployment
**Story:** 1.18 - Integration Testing and Regression Verification

---

## Executive Summary

This document outlines the comprehensive test plan for Service Center Phase 2, covering all features implemented in Stories 1.1-1.17. The testing strategy ensures:
- All new features work as specified
- No regression in existing Phase 1 functionality
- Security policies are enforced correctly
- Performance meets NFR requirements
- System is ready for production deployment

---

## Test Scope

### In Scope
- **Phase 2 Features (Stories 1.1-1.17):**
  - Task template management and workflow automation
  - Task execution with dependencies and sequence enforcement
  - Warehouse operations (stock movements, RMA batches, low stock alerts)
  - Public service request portal with tracking
  - Staff request management and delivery confirmation
  - Email notification system with unsubscribe functionality
  - Manager task progress dashboard
  - Dynamic template switching during service

- **Phase 1 Regression:**
  - Ticket CRUD operations
  - Customer management
  - Parts inventory management
  - User authentication and authorization

- **Cross-cutting Concerns:**
  - Database integrity (foreign keys, constraints, triggers)
  - Row Level Security (RLS) policies
  - Performance and scalability
  - Security and data protection

### Out of Scope
- Load testing beyond 100 concurrent users
- Disaster recovery testing
- Third-party integrations (not yet implemented)

---

## Test Environment

- **Application:** http://localhost:3025
- **Supabase Studio:** http://localhost:54323
- **Database:** Local PostgreSQL via Supabase
- **Test Data:** Seeded via `supabase/seed.sql`
- **Browser:** Latest Chrome/Firefox
- **Node Version:** As specified in project

---

## Test Roles and Responsibilities

| Role | Username | Password | Responsibilities |
|------|----------|----------|------------------|
| Admin | admin@example.com | (from setup) | Full system access, template management |
| Manager | manager@example.com | (seeded) | Dashboard access, oversight, approvals |
| Technician | technician@example.com | (seeded) | Task execution, template switching |
| Reception | reception@example.com | (seeded) | Request conversion, customer management |

---

## Test Categories

### 1. Feature Acceptance Testing

#### 1.1 Task Template Management (Story 1.2)
**Test Cases:**

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| FT-1.1 | Create task template | 1. Login as Admin<br>2. Navigate to /workflows/templates<br>3. Click "New Template"<br>4. Fill name, service type, tasks<br>5. Save | Template created successfully | ⏳ |
| FT-1.2 | Edit existing template | 1. Open existing template<br>2. Modify name/tasks<br>3. Save | Changes saved, history preserved | ⏳ |
| FT-1.3 | Template with sequence enforcement | 1. Create template<br>2. Set enforce_sequence = true<br>3. Add 3 tasks | Template enforces strict sequence | ⏳ |
| FT-1.4 | Template with flexible mode | 1. Create template<br>2. Set enforce_sequence = false<br>3. Add 3 tasks | Tasks can be completed out of order | ⏳ |

#### 1.2 Task Execution UI (Story 1.4)
**Test Cases:**

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|---|--------|
| FT-2.1 | Start task | 1. Open ticket with pending tasks<br>2. Click "Start" on first task<br>3. Confirm | Task status changes to "in_progress" | ⏳ |
| FT-2.2 | Complete task with notes | 1. Start task<br>2. Click "Complete"<br>3. Enter notes (min 5 chars)<br>4. Submit | Task marked complete with notes saved | ⏳ |
| FT-2.3 | Block task with reason | 1. Start task<br>2. Click "Block"<br>3. Enter reason<br>4. Submit | Task marked blocked with reason | ⏳ |
| FT-2.4 | Task sequence enforcement | 1. Template with enforce_sequence=true<br>2. Try to start task #3 before #2 completes | System prevents out-of-order execution | ⏳ |

#### 1.3 Task Dependencies (Story 1.5)
**Test Cases:**

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|---|--------|
| FT-3.1 | Sequential gate enforcement | 1. Create ticket with strict template<br>2. Try to complete task 3 before task 2 | System blocks, shows warning | ⏳ |
| FT-3.2 | Flexible mode warning | 1. Create ticket with flexible template<br>2. Complete task 3 before task 2 | System allows but shows warning | ⏳ |
| FT-3.3 | Auto-advance ticket status | 1. Complete all required tasks<br>2. Observe ticket status | Ticket auto-advances to "completed" | ⏳ |

#### 1.4 Warehouse Operations (Stories 1.6-1.10)
**Test Cases:**

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|---|--------|
| FT-4.1 | Record stock movement | 1. Navigate to inventory<br>2. Select product<br>3. Record movement (IN/OUT)<br>4. Specify warehouse | Movement recorded, stock updated | ⏳ |
| FT-4.2 | Low stock alert | 1. Set product low_stock_threshold=10<br>2. Reduce stock to 9<br>3. Check dashboard | Alert appears on stock levels page | ⏳ |
| FT-4.3 | RMA batch creation | 1. Navigate to RMA page<br>2. Create new batch<br>3. Add products with serial numbers<br>4. Assign to supplier | Batch created with auto-generated number | ⏳ |
| FT-4.4 | Auto-move product on ticket | 1. Create ticket with physical product<br>2. Set status to "in_progress"<br>3. Check product location | Product moved to "Đang sửa chữa" automatically | ⏳ |

#### 1.5 Public Service Request Portal (Stories 1.11-1.14)
**Test Cases:**

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|---|--------|
| FT-5.1 | Submit service request | 1. Open /service-request<br>2. Fill form (no login)<br>3. Submit | Request created, tracking token returned | ⏳ |
| FT-5.2 | Track service request | 1. Use tracking token<br>2. Open /service-request/track<br>3. Enter token | Request status displayed | ⏳ |
| FT-5.3 | Staff converts request to ticket | 1. Login as Reception<br>2. Navigate to requests dashboard<br>3. Convert request to ticket | Ticket created, request marked converted | ⏳ |
| FT-5.4 | Delivery confirmation | 1. Complete ticket<br>2. Click "Confirm Delivery"<br>3. Enter confirmation details | Delivery confirmed, email sent | ⏳ |
| FT-5.5 | Rate limiting (security) | 1. Submit 11 requests in 1 minute | 11th request blocked with 429 error | ⏳ |

#### 1.6 Email Notification System (Story 1.15)
**Test Cases:**

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|---|--------|
| FT-6.1 | Ticket status change email | 1. Update ticket status<br>2. Check email_notifications table | Email queued with correct template | ⏳ |
| FT-6.2 | Unsubscribe functionality | 1. Click unsubscribe link in email<br>2. Confirm | Customer unsubscribed, no further emails | ⏳ |
| FT-6.3 | Admin email log | 1. Login as Admin<br>2. Navigate to /dashboard/notifications<br>3. View emails | All emails displayed with status | ⏳ |
| FT-6.4 | Email preview | 1. Open notification log<br>2. Click "View" on email<br>3. See modal | Email content displayed in modal | ⏳ |

#### 1.7 Manager Task Progress Dashboard (Story 1.16)
**Test Cases:**

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|---|--------|
| FT-7.1 | View dashboard metrics | 1. Login as Manager<br>2. Navigate to /dashboard/task-progress | Metrics cards display: active tickets, tasks in progress, blocked tasks, avg completion time | ⏳ |
| FT-7.2 | Blocked tasks alert | 1. Block a task on a ticket<br>2. Refresh dashboard | Alert section shows ticket with blocked tasks | ⏳ |
| FT-7.3 | Technician workload table | 1. View dashboard<br>2. Scroll to workload table | All technicians listed with task counts and completion rates | ⏳ |
| FT-7.4 | Auto-refresh | 1. Open dashboard<br>2. Wait 30 seconds<br>3. Observe | Data refreshes automatically | ⏳ |

#### 1.8 Dynamic Template Switching (Story 1.17)
**Test Cases:**

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|---|--------|
| FT-8.1 | Switch template mid-service | 1. Open in-progress ticket<br>2. Click "Switch Template"<br>3. Select new template<br>4. Enter reason (min 10 chars)<br>5. Confirm | Template switched, completed tasks preserved, new tasks added | ⏳ |
| FT-8.2 | Template preview | 1. Open switch modal<br>2. Select template<br>3. View preview | Preview shows all tasks from new template | ⏳ |
| FT-8.3 | Audit trail | 1. Switch template<br>2. Query ticket_template_changes table | Audit record created with reason, counts, technician | ⏳ |
| FT-8.4 | Validation - completed ticket | 1. Try to switch template on completed ticket | System blocks with error message | ⏳ |
| FT-8.5 | Validation - all tasks complete | 1. Complete all tasks<br>2. Try to switch template | System blocks with error message | ⏳ |

---

### 2. Regression Testing (Phase 1 Features)

#### 2.1 Ticket Management
**Test Cases:**

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| RT-1.1 | Create new ticket | Ticket created with auto-generated number (SV-YYYY-NNN) | ⏳ |
| RT-1.2 | Edit ticket | Changes saved correctly | ⏳ |
| RT-1.3 | Update ticket status | Status changes, no errors | ⏳ |
| RT-1.4 | Add parts to ticket | Parts added, total calculated automatically | ⏳ |
| RT-1.5 | Add comments | Comments saved with timestamp and user | ⏳ |

#### 2.2 Customer Management
**Test Cases:**

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| RT-2.1 | Create customer | Customer created successfully | ⏳ |
| RT-2.2 | Edit customer | Changes saved | ⏳ |
| RT-2.3 | View customer tickets | All customer tickets displayed | ⏳ |

#### 2.3 Parts Inventory
**Test Cases:**

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| RT-3.1 | Add new part | Part created with SKU | ⏳ |
| RT-3.2 | Update part stock | Stock quantity updated | ⏳ |
| RT-3.3 | Search parts | Search returns correct results | ⏳ |

---

### 3. Security Testing

#### 3.1 Row Level Security (RLS)
**Test Cases:**

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| SEC-1.1 | Admin full access | Login as Admin, access all pages | All pages accessible | ⏳ |
| SEC-1.2 | Manager limited access | Login as Manager, try to edit templates | Template edit blocked (view only) | ⏳ |
| SEC-1.3 | Technician task access | Login as Technician, access own tasks | Can see assigned tasks only | ⏳ |
| SEC-1.4 | Reception limited access | Login as Reception, try to access warehouse | Warehouse pages blocked | ⏳ |
| SEC-1.5 | Public portal isolation | Submit request, try to access other requests | Cannot access other requests' data | ⏳ |

#### 3.2 Input Validation
**Test Cases:**

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| SEC-2.1 | SQL injection attempt | Input blocked, no database error | ⏳ |
| SEC-2.2 | XSS attempt in comments | HTML escaped, script not executed | ⏳ |
| SEC-2.3 | Invalid UUID in URL | 404 or error page shown | ⏳ |
| SEC-2.4 | CSRF protection | Requests without valid token rejected | ⏳ |

#### 3.3 Rate Limiting
**Test Cases:**

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| SEC-3.1 | Public request rate limit | 10 requests/min limit enforced | ⏳ |
| SEC-3.2 | Tracking page rate limit | 20 requests/min limit enforced | ⏳ |

---

### 4. Performance Testing

#### 4.1 Response Time
**Test Cases:**

| ID | Test Case | Target | Actual | Status |
|----|-----------|--------|--------|--------|
| PERF-1.1 | Ticket list page load | < 2s | TBD | ⏳ |
| PERF-1.2 | Ticket detail page load | < 1.5s | TBD | ⏳ |
| PERF-1.3 | Dashboard load | < 3s | TBD | ⏳ |
| PERF-1.4 | Template list load | < 2s | TBD | ⏳ |
| PERF-1.5 | Public request submission | < 1s | TBD | ⏳ |

#### 4.2 Database Queries
**Test Cases:**

| ID | Test Case | Target | Actual | Status |
|----|-----------|--------|--------|--------|
| PERF-2.1 | Dashboard metrics query | < 500ms | TBD | ⏳ |
| PERF-2.2 | Workload table query | < 300ms | TBD | ⏳ |
| PERF-2.3 | Task list query | < 200ms | TBD | ⏳ |
| PERF-2.4 | Stock levels materialized view | < 100ms | TBD | ⏳ |

---

### 5. Data Integrity Testing

#### 5.1 Database Constraints
**Test Cases:**

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| INT-1.1 | Foreign key constraints | Orphaned records prevented | ⏳ |
| INT-1.2 | Unique constraints | Duplicate SKUs/emails prevented | ⏳ |
| INT-1.3 | Check constraints | Invalid status transitions blocked | ⏳ |
| INT-1.4 | NOT NULL constraints | Required fields enforced | ⏳ |

#### 5.2 Triggers and Functions
**Test Cases:**

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| INT-2.1 | Ticket numbering trigger | Sequential numbers generated | ⏳ |
| INT-2.2 | Auto task generation | Tasks created from template on ticket creation | ⏳ |
| INT-2.3 | Parts total calculation | total_parts updated when parts added/removed | ⏳ |
| INT-2.4 | Auto-advance ticket status | Ticket auto-completes when all tasks done | ⏳ |
| INT-2.5 | Product auto-move trigger | Product location updated on ticket status change | ⏳ |

---

### 6. End-to-End Workflow Tests

#### 6.1 Complete Service Flow
**Scenario:** Customer submits request → Staff converts → Tasks executed → Delivery confirmed → Email sent

**Steps:**
1. **Public Request Submission:**
   - Open /service-request
   - Fill form: name, phone, device, issue
   - Submit and receive tracking token

2. **Staff Conversion:**
   - Login as Reception
   - Navigate to /operations/service-requests
   - Find new request
   - Click "Convert to Ticket"
   - Select customer, product, template
   - Complete conversion

3. **Task Execution:**
   - Login as Technician
   - Navigate to /my-tasks
   - Start first task
   - Complete with notes
   - Continue through all tasks

4. **Delivery Confirmation:**
   - Login as Manager
   - Navigate to completed ticket
   - Click "Confirm Delivery"
   - Enter delivery details
   - Confirm

5. **Email Verification:**
   - Check email_notifications table
   - Verify email sent to customer
   - Verify content includes ticket number and status

**Expected Result:** All steps complete successfully, customer receives notification

**Status:** ⏳ Pending

#### 6.2 Template Switch Mid-Service
**Scenario:** Technician discovers different issue during diagnosis and switches template

**Steps:**
1. Create ticket with "Software Issue" template
2. Start diagnosis task
3. Complete diagnosis task with notes: "Found hardware issue instead"
4. Click "Switch Template"
5. Select "Hardware Repair" template
6. Enter reason: "Diagnosis revealed screen damage instead of software issue"
7. Confirm switch
8. Verify completed tasks preserved
9. Complete new hardware tasks
10. Verify audit trail

**Expected Result:** Template switched successfully, work continues seamlessly

**Status:** ⏳ Pending

---

### 7. Concurrency Testing

#### 7.1 Multi-User Scenarios
**Test Cases:**

| ID | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| CONC-1.1 | Two technicians update different tickets | Both updates succeed | ⏳ |
| CONC-1.2 | Two users edit same customer | Last write wins, no data corruption | ⏳ |
| CONC-1.3 | Multiple requests submitted simultaneously | All processed correctly | ⏳ |
| CONC-1.4 | Manager views dashboard while technicians work | Dashboard updates reflect changes | ⏳ |

---

## Test Execution Summary

### Execution Schedule
- **Day 1:** Feature acceptance testing (Stories 1.2-1.5)
- **Day 2:** Feature acceptance testing (Stories 1.6-1.10)
- **Day 3:** Feature acceptance testing (Stories 1.11-1.17)
- **Day 4:** Regression testing + Security testing
- **Day 5:** Performance testing + Data integrity testing
- **Day 6:** End-to-end workflows + Concurrency testing
- **Day 7:** Bug fixing and retesting

### Pass/Fail Criteria
- **Critical:** All security tests must pass (100%)
- **High Priority:** All feature acceptance tests must pass (95%+)
- **Medium Priority:** All regression tests must pass (95%+)
- **Low Priority:** Performance tests meet target (80%+)

### Test Results Summary (To be filled during execution)

| Category | Total | Passed | Failed | Blocked | Pass Rate |
|----------|-------|--------|--------|---------|-----------|
| Feature Acceptance | TBD | TBD | TBD | TBD | TBD |
| Regression | TBD | TBD | TBD | TBD | TBD |
| Security | TBD | TBD | TBD | TBD | TBD |
| Performance | TBD | TBD | TBD | TBD | TBD |
| Data Integrity | TBD | TBD | TBD | TBD | TBD |
| E2E Workflows | TBD | TBD | TBD | TBD | TBD |
| Concurrency | TBD | TBD | TBD | TBD | TBD |
| **TOTAL** | **TBD** | **TBD** | **TBD** | **TBD** | **TBD** |

---

## Bug Tracking

### Critical Bugs (P0)
*None identified yet*

### High Priority Bugs (P1)
*None identified yet*

### Medium Priority Bugs (P2)
*None identified yet*

### Low Priority Bugs (P3)
*None identified yet*

---

## Sign-off

### Test Completion Sign-off
- [ ] All test cases executed
- [ ] Critical bugs resolved
- [ ] Test results documented
- [ ] System ready for deployment

**Tested By:** _________________
**Date:** _________________

**Approved By:** _________________
**Date:** _________________

---

## Appendix

### A. Test Data Requirements
- 5 customers (various types)
- 3 task templates (warranty, paid, replacement)
- 10 products across different categories
- 50 parts with various stock levels
- 20 service tickets in different statuses
- 5 users (admin, manager, 2 technicians, reception)

### B. Known Limitations
- Email sending is simulated (logged to database, not actually sent)
- Performance testing limited to local environment
- No actual payment gateway integration

### C. Testing Tools
- Manual testing in browser
- Supabase Studio for database verification
- Chrome DevTools for network inspection
- SQL queries for data validation

---

**Document End**
