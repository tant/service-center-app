# User Acceptance Testing (UAT) Plan - Phase 1
## Polymorphic Task Management System

**Version:** 1.0
**Date:** November 3, 2025
**UAT Period:** November 4-17, 2025 (2 weeks)
**System Under Test:** Task Dashboard (`/my-tasks`)
**Phase:** Phase 1 - Foundation
**Status:** 📋 Ready for Execution

---

## 1. Executive Summary

### Purpose
Validate that the Polymorphic Task Management System meets business requirements and is ready for production deployment. This UAT confirms the system works correctly in real-world scenarios with actual users.

### Scope
- Task Dashboard functionality at `/my-tasks`
- Task management workflows (view, filter, start, complete, block)
- Real-time updates and notifications
- Mobile responsiveness
- Performance under normal load

### Success Criteria
- ✅ All 5 participants complete 8 core scenarios without critical errors
- ✅ Overall satisfaction score ≥ 4/5
- ✅ < 3 usability issues per participant
- ✅ Zero P0 (critical) bugs discovered
- ✅ 100% of critical workflows functional

---

## 2. Test Participants

### Target Users (5 Required)

| # | Role | User Type | Name | Email | Scheduled |
|---|------|-----------|------|-------|-----------|
| 1 | System Administrator | admin | [TBD] | [TBD] | [ ] |
| 2 | Operations Manager | manager | [TBD] | [TBD] | [ ] |
| 3 | Senior Technician | technician | [TBD] | [TBD] | [ ] |
| 4 | Junior Technician | technician | [TBD] | [TBD] | [ ] |
| 5 | Reception Staff | reception | [TBD] | [TBD] | [ ] |

### Participant Requirements
- ✅ Active staff member with system access
- ✅ Familiar with current workflow processes
- ✅ Available for 2-hour testing session + 30 min feedback
- ✅ Willing to provide honest feedback
- ✅ No prior exposure to new task dashboard (fresh perspective)

---

## 3. Test Environment

### System Access
- **URL:** `http://localhost:3025/my-tasks` (staging environment)
- **Build:** Production build (Phase 1 complete)
- **Database:** Test database with sample data
- **Browser:** Firefox (primary), Chrome (secondary)
- **Devices:** Desktop + Mobile/Tablet

### Sample Data Setup
- 3 service tickets with tasks (SV-2025-001, SV-2025-002, SV-2025-003)
- 8 entity_tasks with various statuses (pending, in_progress, blocked, overdue)
- Multiple entity types (service_ticket, inventory_receipt, etc.)
- Tasks assigned to test users

### Pre-Test Checklist
- [ ] Staging environment deployed and stable
- [ ] Sample data loaded and verified
- [ ] Test user accounts created and credentials shared
- [ ] User guide distributed to participants
- [ ] Feedback forms prepared
- [ ] Screen recording tools ready (optional)
- [ ] QA engineer available for support

---

## 4. Test Scenarios

### Core Scenarios (All Participants)

#### Scenario 1: View Task Dashboard
**Objective:** Verify users can access and understand the task dashboard

**Test Steps:**
1. Log in to the system with provided credentials
2. Navigate to "My Tasks" (Công việc của tôi) from main menu
3. Observe the dashboard layout

**Expected Results:**
- ✅ Dashboard loads within 5 seconds
- ✅ Stats summary cards display (Tổng công việc, Được giao cho tôi, Đang chờ, etc.)
- ✅ Task cards visible with clear information
- ✅ Filters panel on left side
- ✅ No errors or blank screens

**Pass Criteria:**
- User successfully views dashboard
- User understands the layout (self-reported)
- No critical errors

---

#### Scenario 2: Filter Tasks by Status
**Objective:** Verify filtering functionality works correctly

**Test Steps:**
1. From task dashboard, locate the filter panel (left sidebar)
2. Click "Status" filter dropdown
3. Select "Đang chờ" (Pending)
4. Observe filtered results
5. Clear filter and select "Đang thực hiện" (In Progress)

**Expected Results:**
- ✅ Dropdown opens with 6 status options
- ✅ Task list updates immediately after selection
- ✅ Only tasks matching selected status are displayed
- ✅ Stats cards update to reflect filtered data
- ✅ Filter can be cleared

**Pass Criteria:**
- Filtering works as expected
- Results are accurate (verified by QA)
- User finds filtering intuitive

---

#### Scenario 3: Filter Tasks by Entity Type
**Objective:** Verify entity type filtering works

**Test Steps:**
1. From task dashboard, click "Entity Type" (Loại) filter dropdown
2. Select "Service Ticket" (Phiếu dịch vụ)
3. Observe filtered results
4. Change filter to "Inventory Receipt" (Phiếu nhập kho)

**Expected Results:**
- ✅ Dropdown shows all 5 entity types
- ✅ Task list updates immediately
- ✅ Only tasks for selected entity type shown
- ✅ Entity context in task cards matches filter

**Pass Criteria:**
- Entity filtering works correctly
- User understands entity types
- No confusion about entity context

---

#### Scenario 4: View Overdue Tasks
**Objective:** Verify overdue task highlighting and filtering

**Test Steps:**
1. From task dashboard, enable "Chỉ hiển thị công việc quá hạn" (Overdue only) checkbox
2. Observe filtered results
3. Look for visual indicators on overdue tasks

**Expected Results:**
- ✅ Only overdue tasks displayed
- ✅ Overdue tasks have red border
- ✅ "Quá hạn" stat card shows correct count
- ✅ Due date shows how overdue (e.g., "Quá hạn 1 ngày")

**Pass Criteria:**
- Overdue filtering works
- Visual indicators are clear
- User immediately recognizes overdue tasks

---

#### Scenario 5: Start a Pending Task
**Objective:** Verify users can start assigned tasks

**Test Steps:**
1. From task dashboard, enable "My Tasks" filter (Công việc của tôi)
2. Find a task with "Đang chờ" (Pending) status assigned to you
3. Click "Bắt đầu" (Start Task) button
4. Confirm action if prompted
5. Observe task status change

**Expected Results:**
- ✅ "Bắt đầu" button visible on pending tasks assigned to user
- ✅ Task status changes to "Đang thực hiện" (In Progress)
- ✅ "Đang thực hiện" stat card increments by 1
- ✅ Toast notification appears confirming success
- ✅ Task card updates to show in-progress status

**Pass Criteria:**
- User successfully starts task
- Status change is immediate
- Feedback is clear (toast notification)

---

#### Scenario 6: Complete an In-Progress Task
**Objective:** Verify task completion workflow

**Test Steps:**
1. Find a task with "Đang thực hiện" (In Progress) status assigned to you
2. Click "Hoàn thành" (Complete Task) button
3. In the dialog, enter completion notes (e.g., "Đã hoàn thành kiểm tra, sản phẩm hoạt động tốt")
4. Click "Hoàn thành" to confirm
5. Observe task status change

**Expected Results:**
- ✅ "Hoàn thành" button visible on in-progress tasks
- ✅ Dialog opens requesting completion notes (required)
- ✅ Cannot submit without notes (validation)
- ✅ Task status changes to "Hoàn thành" (Completed)
- ✅ "Hoàn thành" stat card increments by 1
- ✅ Toast notification confirms completion
- ✅ Task moves to completed list

**Pass Criteria:**
- User successfully completes task
- Completion notes are required and saved
- User understands why notes are required

---

#### Scenario 7: Block a Task with Reason
**Objective:** Verify task blocking workflow

**Test Steps:**
1. Find a task with "Đang thực hiện" (In Progress) or "Đang chờ" (Pending) status
2. Click "Chặn" (Block Task) button
3. In the dialog, enter a blocked reason (e.g., "Chờ linh kiện từ nhà cung cấp")
4. Click "Chặn" to confirm
5. Observe task status change

**Expected Results:**
- ✅ "Chặn" button visible on pending or in-progress tasks
- ✅ Dialog opens requesting blocked reason (required)
- ✅ Cannot submit without reason (validation)
- ✅ Task status changes to "Bị chặn" (Blocked)
- ✅ "Bị chặn" stat card increments (if stat exists)
- ✅ Toast notification confirms blocking
- ✅ Task card shows blocked status with reason

**Pass Criteria:**
- User successfully blocks task
- Blocked reason is required and visible
- User understands when to use blocking

---

#### Scenario 8: Unblock a Blocked Task
**Objective:** Verify task unblocking workflow

**Test Steps:**
1. Find a task with "Bị chặn" (Blocked) status
2. Read the blocked reason displayed on task card
3. Click "Bỏ chặn" (Unblock Task) button
4. Observe task status change

**Expected Results:**
- ✅ "Bỏ chặn" button visible on blocked tasks
- ✅ Task status changes to "Đang chờ" (Pending)
- ✅ Blocked reason is cleared
- ✅ Toast notification confirms unblocking
- ✅ Task can now be started again

**Pass Criteria:**
- User successfully unblocks task
- Status returns to pending
- User understands workflow continuation

---

### Additional Scenarios (Role-Specific)

#### Manager Scenario: View All Tasks
**Objective:** Verify managers can see team workload

**Test Steps:**
1. Toggle off "My Tasks" filter (show "All Tasks")
2. Observe all tasks from team members
3. Review overdue tasks across team
4. Check task assignments

**Expected Results:**
- ✅ All team tasks visible (not just manager's tasks)
- ✅ Assigned user displayed on each task card
- ✅ Can see team workload distribution
- ✅ Overdue filter shows all team overdue tasks

**Pass Criteria:**
- Manager sees full team visibility
- Can identify bottlenecks
- Useful for workload management

---

#### Technician Scenario: Claim Available Task
**Objective:** Verify technicians can claim unassigned tasks

**Test Steps:**
1. Enable "Available Tasks" filter (Có thể nhận)
2. Find an unassigned task
3. Click "Nhận việc" (Assign to Me) button
4. Start the task

**Expected Results:**
- ✅ Available tasks filter shows unassigned tasks
- ✅ "Nhận việc" button visible on unassigned tasks
- ✅ Task gets assigned to current user
- ✅ Task now appears in "My Tasks" filter
- ✅ Can immediately start the task

**Pass Criteria:**
- Technician successfully claims task
- Workload distribution mechanism works
- User finds it easy to pick up work

---

### Mobile/Tablet Scenarios

#### Scenario 9: Mobile Responsiveness
**Objective:** Verify dashboard works on mobile devices

**Test Steps:**
1. Access dashboard on mobile device or use browser mobile view
2. Navigate through filters
3. Perform task actions (start, complete, block)
4. Observe layout and usability

**Expected Results:**
- ✅ Dashboard adapts to mobile screen size
- ✅ Grid layout stacks vertically (1-2 columns)
- ✅ Filters remain accessible (hamburger menu or similar)
- ✅ All buttons are tappable (not too small)
- ✅ Task actions work on mobile
- ✅ No horizontal scrolling required

**Pass Criteria:**
- Mobile experience is usable
- No major usability issues
- User can complete core tasks on mobile

---

### Performance Scenarios

#### Scenario 10: Dashboard Load Time
**Objective:** Verify dashboard loads quickly

**Test Steps:**
1. Clear browser cache
2. Navigate to `/my-tasks`
3. Measure time until dashboard is fully interactive
4. Repeat 3 times and average

**Expected Results:**
- ✅ Dashboard loads in < 5 seconds (user perception)
- ✅ Stats cards appear first (progressive loading)
- ✅ Task cards load immediately after
- ✅ No long blank screens or spinners

**Pass Criteria:**
- Load time feels fast to users
- No performance complaints
- Meets < 5 second target

---

#### Scenario 11: Real-Time Updates
**Objective:** Verify polling updates work

**Test Steps:**
1. Open dashboard in Browser A (User 1)
2. Open same dashboard in Browser B (User 2)
3. User 2 completes a task visible to User 1
4. Wait 30 seconds (polling interval)
5. Observe if User 1's dashboard updates

**Expected Results:**
- ✅ User 1's dashboard refreshes after 30 seconds
- ✅ Completed task status updates automatically
- ✅ Stats cards update to reflect change
- ✅ No manual refresh required

**Pass Criteria:**
- Real-time updates work as expected
- 30-second interval is acceptable
- Users notice updates without confusion

---

## 5. Test Execution Process

### Session Structure (2.5 hours per participant)

**Preparation (15 min)**
- Welcome and introduction
- Explain UAT purpose (not a test of the user!)
- Review test scenarios
- Set up screen recording (optional, with consent)
- Answer questions

**Guided Testing (1.5 hours)**
- QA guides user through 8 core scenarios
- User performs actions while thinking aloud
- QA observes and takes notes
- User reports issues immediately
- QA assists only if user is blocked

**Free Exploration (30 min)**
- User explores dashboard freely
- Try different filter combinations
- Attempt edge cases
- Report any confusion or issues

**Feedback Session (30 min)**
- Complete feedback form (survey)
- Discuss likes/dislikes
- Suggest improvements
- Rate overall experience
- Sign-off on test completion

---

### Testing Guidelines

**For Participants:**
- ✅ Think aloud - verbalize your thoughts
- ✅ Be honest - negative feedback is valuable
- ✅ Report confusion immediately
- ✅ Take your time - no rush
- ✅ Ask questions if unclear

**For QA Engineer:**
- ✅ Observe, don't lead - let user struggle a bit
- ✅ Take detailed notes on behavior
- ✅ Record unexpected actions
- ✅ Note usability issues (even minor)
- ✅ Assist only if user is completely blocked
- ✅ Maintain neutral tone - don't bias results

---

## 6. Test Data & Setup

### Sample Tasks (Pre-created)

| Task ID | Entity Type | Entity ID | Name | Status | Assigned To | Due Date | Priority |
|---------|-------------|-----------|------|--------|-------------|----------|----------|
| T1 | service_ticket | SV-2025-001 | Kiểm tra ban đầu | pending | Admin | Today +1d | high |
| T2 | service_ticket | SV-2025-001 | Chẩn đoán lỗi | pending | Admin | Today +2d | high |
| T3 | service_ticket | SV-2025-001 | Sửa chữa phần cứng | pending | Unassigned | Today +3d | high |
| T4 | service_ticket | SV-2025-001 | Test phần cứng | pending | Unassigned | Today +4d | normal |
| T5 | service_ticket | SV-2025-002 | Kiểm tra ban đầu | in_progress | Technician | Today +1d | normal |
| T6 | service_ticket | SV-2025-002 | Chẩn đoán lỗi | blocked | Unassigned | Today -1d | normal |
| T7 | service_ticket | SV-2025-003 | Kiểm tra ban đầu | pending | Technician 2 | Today +3d | low |
| T8 | service_ticket | SV-2025-003 | Chẩn đoán lỗi | pending | Unassigned | Today +4d | low |

**Note:** Dates are relative to test execution date.

---

## 7. Feedback Collection

### Feedback Form (Google Form / Survey)

#### Section 1: Demographics
1. What is your role? (Admin / Manager / Technician / Reception)
2. How long have you worked at SSTC? (< 6 months / 6-12 months / 1-2 years / 2+ years)
3. How comfortable are you with technology? (1=Not comfortable, 5=Very comfortable)

#### Section 2: Usability (1=Strongly Disagree, 5=Strongly Agree)
4. The task dashboard is easy to navigate
5. Filters are intuitive to use
6. Task actions (start, complete, block) are clear
7. I understand what each task status means
8. The dashboard provides useful information at a glance
9. I can easily find my assigned tasks
10. The mobile version is usable (if tested)

#### Section 3: Functionality
11. Did you encounter any errors during testing? (Yes/No)
    - If yes, describe the error
12. Did any feature not work as expected? (Yes/No)
    - If yes, which feature?
13. Was anything confusing or unclear? (Yes/No)
    - If yes, what was confusing?

#### Section 4: Performance
14. How fast did the dashboard load? (Very slow / Slow / Acceptable / Fast / Very fast)
15. Did you notice any lag or delays? (Yes/No)
    - If yes, where?

#### Section 5: Overall Satisfaction
16. Overall, how satisfied are you with the task dashboard? (1=Very unsatisfied, 5=Very satisfied)
17. Would you use this dashboard in your daily work? (Yes / No / Maybe)
18. What did you like most about the dashboard?
19. What did you like least about the dashboard?
20. Any suggestions for improvement?

#### Section 6: Sign-Off
21. Based on your testing, do you approve this system for production use? (Approve / Approve with minor fixes / Do not approve)
22. Additional comments

---

## 8. Issue Tracking

### Issue Severity Levels

| Severity | Definition | Example | Response |
|----------|------------|---------|----------|
| **P0 - Critical** | System unusable, data loss, security breach | Cannot log in, tasks deleted | **BLOCK DEPLOYMENT** - Fix immediately |
| **P1 - High** | Major functionality broken, workaround exists | Filter doesn't work, but can use search | Fix before production |
| **P2 - Medium** | Minor functionality issue, doesn't block work | Button label typo, slow load | Fix in next sprint |
| **P3 - Low** | Cosmetic issue, enhancement request | Color preference, nice-to-have feature | Backlog |

### Issue Log Template

| Issue # | Date | Reporter | Severity | Description | Steps to Reproduce | Expected | Actual | Status | Assigned To |
|---------|------|----------|----------|-------------|-------------------|----------|--------|--------|-------------|
| UAT-001 | 2025-11-04 | [Name] | P2 | [Description] | [Steps] | [Expected] | [Actual] | Open | [Dev] |

---

## 9. Success Criteria & Exit Conditions

### UAT Pass Criteria (All Must Be Met)

✅ **Functional:**
- All 8 core scenarios pass for all 5 participants
- Zero P0 (critical) bugs
- < 3 P1 (high) bugs
- P2/P3 bugs documented but don't block

✅ **Usability:**
- Average satisfaction score ≥ 4/5
- < 3 usability issues per participant
- 80%+ of participants approve for production

✅ **Performance:**
- Dashboard loads in < 5 seconds (user perception)
- No lag or delays reported by > 50% of users

✅ **Completion:**
- All 5 participants complete testing
- All feedback forms submitted
- All issues logged and triaged

### UAT Fail Criteria (Any Triggers Re-Test)

❌ **Critical Failures:**
- Any P0 bug discovered
- > 50% of participants report same P1 bug
- Average satisfaction score < 3/5
- < 60% participants approve for production

❌ **Incomplete Testing:**
- < 4 participants complete testing
- Major scenario not tested
- Technical issues prevent testing

---

## 10. Test Schedule

### Week 1 (Nov 4-8, 2025)

| Day | Time | Participant | Role | Status |
|-----|------|-------------|------|--------|
| Mon, Nov 4 | 9:00 AM | Participant 1 | Admin | [ ] Scheduled |
| Mon, Nov 4 | 2:00 PM | Participant 2 | Manager | [ ] Scheduled |
| Tue, Nov 5 | 9:00 AM | Participant 3 | Senior Tech | [ ] Scheduled |
| Wed, Nov 6 | 9:00 AM | Participant 4 | Junior Tech | [ ] Scheduled |
| Thu, Nov 7 | 9:00 AM | Participant 5 | Reception | [ ] Scheduled |
| Fri, Nov 8 | All Day | QA Engineer | Issue triage & reporting | [ ] |

### Week 2 (Nov 11-15, 2025)

| Day | Activity | Owner | Status |
|-----|----------|-------|--------|
| Mon, Nov 11 | Fix P1 bugs | Dev Team | [ ] |
| Tue, Nov 12 | Re-test fixes | QA Engineer | [ ] |
| Wed, Nov 13 | Final approval meeting | Stakeholders | [ ] |
| Thu, Nov 14 | Update documentation | PM | [ ] |
| Fri, Nov 15 | UAT sign-off | All | [ ] |

---

## 11. Deliverables

### UAT Completion Deliverables

1. **UAT Test Results Report**
   - File: `docs/UAT-TEST-RESULTS-PHASE1.md`
   - Summary of all test sessions
   - Pass/fail for each scenario
   - Participant feedback highlights

2. **Issue Log**
   - File: `docs/UAT-ISSUES-PHASE1.csv`
   - All issues discovered with severity
   - Status of each issue (open/fixed/deferred)

3. **Feedback Analysis**
   - File: `docs/UAT-FEEDBACK-ANALYSIS-PHASE1.md`
   - Quantitative results (satisfaction scores, approval %)
   - Qualitative themes (likes, dislikes, suggestions)
   - Recommendations for improvements

4. **Sign-Off Document**
   - File: `docs/UAT-SIGNOFF-PHASE1.md`
   - Final Go/No-Go decision
   - Stakeholder signatures
   - Conditions for production deployment

---

## 12. Roles & Responsibilities

| Role | Name | Responsibilities |
|------|------|------------------|
| **UAT Lead** | QA Engineer | Coordinate all testing, schedule sessions, track issues, report results |
| **Test Facilitator** | QA Engineer | Guide participants, observe, take notes, assist when blocked |
| **Participants** | 5 Staff Members | Complete test scenarios, provide honest feedback, report issues |
| **Development Team** | Dev Lead | Fix issues discovered, re-deploy fixes, support QA |
| **Product Owner** | PM | Define success criteria, approve sign-off, make Go/No-Go decision |
| **Stakeholders** | Management | Review results, provide final approval |

---

## 13. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Participants unavailable** | Medium | High | Recruit backup participants, flexible scheduling |
| **Critical bugs discovered** | Low | Critical | Developer on standby, rapid fix process |
| **Testing environment unstable** | Low | High | Pre-test environment health check, backup environment |
| **Participants biased (too positive)** | Medium | Medium | Emphasize honesty, assure no negative consequences |
| **Not enough time** | Medium | Medium | Prioritize P0/P1 fixes, defer P2/P3 to Phase 2 |
| **Technical issues during testing** | Low | Medium | QA engineer available, IT support on standby |

---

## 14. Communication Plan

### Status Updates

**Daily (During Testing Week 1):**
- End-of-day summary to stakeholders
- Format: Email with issues found, participants completed, blockers

**Weekly (Week 2):**
- Monday: Issue triage meeting
- Wednesday: Progress check-in
- Friday: Final sign-off meeting

### Escalation Path

**P0 (Critical) Issues:**
1. Report immediately to Dev Lead (within 1 hour)
2. Escalate to Product Owner if not resolved in 4 hours
3. Emergency meeting if deployment at risk

**P1 (High) Issues:**
1. Log and report end-of-day
2. Discuss in daily standup
3. Prioritize fixes for Week 2

---

## 15. Acceptance Criteria

### Definition of Done for UAT

- [x] UAT test plan approved by Product Owner
- [ ] 5 participants recruited and scheduled
- [ ] Test environment deployed with sample data
- [ ] All 5 participants complete testing (8 core scenarios)
- [ ] All feedback forms submitted
- [ ] All issues logged and triaged
- [ ] P0 bugs: 0 (or fixed and re-tested)
- [ ] P1 bugs: < 3 (or documented with workarounds)
- [ ] Average satisfaction score ≥ 4/5
- [ ] ≥ 80% participants approve for production
- [ ] UAT report delivered to stakeholders
- [ ] Go/No-Go decision made
- [ ] Sign-off document completed

---

## 16. Appendices

### Appendix A: Pre-Test Checklist

**Environment Setup:**
- [ ] Staging environment deployed (`http://localhost:3025`)
- [ ] Production build verified (no dev tools, correct URLs)
- [ ] Sample data loaded (3 tickets, 8 tasks)
- [ ] Database stable and backed up
- [ ] Browser compatibility verified (Firefox, Chrome)

**Participant Setup:**
- [ ] 5 participants recruited
- [ ] Test accounts created for each participant
- [ ] Credentials shared securely
- [ ] Calendar invites sent
- [ ] Reminders sent 1 day before session

**Materials Prepared:**
- [ ] User guide distributed (`docs/USER-GUIDE-TASK-MANAGEMENT.md`)
- [ ] Feedback form created (Google Form link)
- [ ] Issue tracking spreadsheet ready
- [ ] Screen recording software installed (if using)
- [ ] Note-taking templates prepared

**QA Readiness:**
- [ ] QA engineer trained on scenarios
- [ ] Observation checklist prepared
- [ ] Support contact list ready
- [ ] Developer on standby for critical issues

---

### Appendix B: Feedback Form Link

**Google Form:** [TBD - Create before UAT starts]

**Backup:** Paper forms available if technical issues

---

### Appendix C: Contact Information

| Role | Name | Email | Phone | Availability |
|------|------|-------|-------|--------------|
| **UAT Lead** | [QA Engineer] | qa@sstcservice.com | [Phone] | Mon-Fri 8am-6pm |
| **Dev Support** | [Tech Lead] | dev@sstcservice.com | [Phone] | On-call during UAT |
| **Product Owner** | [PM] | pm@sstcservice.com | [Phone] | Mon-Fri 9am-5pm |
| **IT Support** | [IT] | it@sstcservice.com | [Phone] | Mon-Fri 8am-6pm |

---

### Appendix D: Test Data Scripts

**Location:** `docs/data/uat-sample-data.sql`

**Contents:**
- 3 service tickets (SV-2025-001, SV-2025-002, SV-2025-003)
- 8 entity_tasks with various statuses
- 5 test user profiles (admin, manager, 3 technicians)

**Setup Command:**
```bash
psql $DATABASE_URL < docs/data/uat-sample-data.sql
```

---

## 17. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-03 | QA Engineer | Initial UAT test plan created |

---

**Document Owner:** QA Engineer
**Approved By:** [Product Owner] - Date: [TBD]
**Next Review:** After UAT completion (November 17, 2025)

---

**END OF UAT TEST PLAN**
