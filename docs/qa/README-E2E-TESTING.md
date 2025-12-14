# E2E Testing Guide - Polymorphic Task Management System

**Project:** PTMS-2025
**Version:** 4.0
**Date:** November 3, 2025
**Status:** Ready for Testing

---

## 📚 Quick Start

### 1. Load Test Data
```bash
# Import mock data (script to be created)
pnpm run seed:ptms-test-data

# Or manually import via Supabase Studio
# File: docs/data/mock-data-ptms-v4.json
```

### 2. Open Test Plan
📄 **Test Plan:** `docs/qa/E2E-TEST-PLAN-PTMS-WITH-MOCK-DATA.md`

### 3. Login with Test Accounts
- **Manager:** manager@sstc.vn / tantran
- **Tech 1:** tech1@sstc.vn / tantran (5 tasks)
- **Tech 2:** tech2@sstc.vn / tantran (2 tasks)
- **Tech 3:** tech3@sstc.vn / tantran (3 tasks)
- **Reception:** reception@sstc.vn / tantran

### 4. Execute Tests
Follow test plan sequentially:
- **Phase 1:** Foundation (2-3 hours)
- **Phase 2:** Serial Entry (1.5-2 hours)
- **Phase 3:** Advanced Features (2-3 hours)
- **Phase 4:** Workflow Enhancements (1.5-2 hours)
- **Cross-Cutting:** (1 hour)

**Total Time:** 8-11 hours

---

## 📂 Documentation Structure

```
docs/
├── qa/
│   ├── README-E2E-TESTING.md (this file)
│   ├── E2E-TEST-PLAN-PTMS-WITH-MOCK-DATA.md (main test plan)
│   └── E2E-TEST-PLAN-PTMS-COMPLETE.md (original detailed plan)
└── data/
    ├── mock-data-ptms-v4.json (test data)
    └── mock-data.json (original production-ready data)
```

---

## 🎯 Test Coverage

### What's Tested

**Phase 1: Foundation (10 tests)**
✅ Unified task dashboard across 5 entity types
✅ Task filtering and sorting
✅ Task lifecycle (start → complete)
✅ Entity context display
✅ Sequence enforcement
✅ Auto-progression
✅ Task visibility by user
✅ Performance benchmarks
✅ Mobile responsiveness

**Phase 2: Serial Entry (8 tests)**
✅ Auto-task creation on receipt approval
✅ Progress tracking (0% → 50% → 100%)
✅ Color-coded progress bars (red → yellow → green)
✅ Auto-completion at 100%
✅ Partial entry persistence
✅ Duplicate detection (system-wide)
✅ CSV bulk import
✅ Manager compliance dashboard

**Phase 3: Advanced Features (10 tests)**
✅ Transfer approval workflow (high/low value)
✅ Service request draft mode
✅ Phone lookup auto-fill
✅ Status flow (walk-in vs pickup)
✅ Analytics APIs (task stats, user performance)
✅ Notification system
✅ Audit trail

**Phase 4: Workflow Enhancements (8 tests)**
✅ Real-time validation
✅ Visual workflow preview
✅ Documentation field (notes)
✅ Automatic time tracking
✅ Duration formatting
✅ Task statistics view
✅ Smart assignment suggestions
✅ Drag-and-drop reordering

**Cross-Cutting (5 tests)**
✅ Role-based access control
✅ Vietnamese localization
✅ Build verification
✅ Mobile responsiveness
✅ Performance under load

**Total: 41 test scenarios**

---

## 📊 Test Data Overview

### Mock Data v4.0.0 Contents

**Users (5):**
- 1 Manager
- 3 Technicians (varying workloads)
- 1 Reception

**Customers (10):**
- Complete profiles with phone, email, address
- Mix of business and individual customers

**Products (6):**
- ZOTAC graphics cards (RTX 4070, 4060 Ti)
- SSTC SSDs, RAM
- ZOTAC Mini PC

**Task Library (12 task types):**
- Inspection, serial entry, approval
- Diagnosis, repair, quality check
- Customer service, receiving
- Inventory management

**Workflows (5 templates):**
- Inventory receipt workflow (with serial entry)
- Inventory issue workflow
- Inventory transfer workflow (with approval)
- Service request workflow
- Service ticket workflow (6-step repair process)

**Test Scenarios:**

**Scenario 1: Serial Entry (3 receipts)**
- 1A: No serials (0% progress, red)
- 1B: Partial serials (50% progress, yellow)
- 1C: Almost complete (90% progress, yellow)

**Scenario 2: Service Tickets (5 tickets)**
- Various stages of workflow completion
- Different technicians assigned
- Mix of pending, in_progress, completed

**Scenario 3: Service Requests (4 requests)**
- Draft (not submitted)
- Pickingup (waiting for customer)
- Received (tasks in progress)
- Processing (tickets created)

**Scenario 4: Transfers (3 transfers)**
- Low value (no approval needed)
- High value (requires manager approval)
- Approved (execution in progress)

**Scenario 5: Mixed Workload**
- Tech 1: 5 active tasks
- Tech 2: 2 active tasks (lowest - for assignment test)
- Tech 3: 3 active tasks

---

## ✅ Success Criteria

### Pass Requirements

**PASS if:**
- ✅ All Critical tests (Phase 1, 2, CC) pass 100%
- ✅ Non-critical tests (Phase 3, 4) pass ≥90%
- ✅ Zero critical bugs found
- ✅ Zero data integrity issues
- ✅ All performance benchmarks met:
  - Dashboard load: <500ms
  - API response: <200ms
  - Build time: <3 minutes
  - Zero TypeScript errors

**CONCERNS if:**
- ⚠️ 1-2 non-critical tests fail
- ⚠️ Performance slightly below benchmarks (<20% deviation)
- ⚠️ Minor UI/UX issues
- ⚠️ Non-blocking bugs found

**FAIL if:**
- ❌ Any Critical test fails
- ❌ Data corruption possible
- ❌ Security vulnerabilities found
- ❌ Performance <50% of benchmarks
- ❌ System unusable in key workflows

---

## 🐛 Bug Reporting

### Severity Levels

**Critical:**
- System crash
- Data loss/corruption
- Security vulnerability
- Core functionality broken

**High:**
- Major feature not working
- Workflow blocked
- Performance severely degraded

**Medium:**
- Feature partially working
- Workaround available
- UI/UX issue affecting usability

**Low:**
- Minor cosmetic issue
- Rare edge case
- Enhancement request

### Bug Report Template

```markdown
**Bug ID:** PTMS-BUG-XXX
**Severity:** Critical/High/Medium/Low
**Test:** Phase X, Test X.X
**Title:** [Short description]

**Steps to Reproduce:**
1. Login as [user]
2. Navigate to [page]
3. [Action]
4. [Result]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Test Data Used:**
[Specific entity from mock data]

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- User: tech1@sstc.vn
- Date: 2025-11-03 14:30

**Screenshots/Videos:**
[Attach if available]
```

---

## 📝 Test Execution Tips

### Before Starting

1. **Clear Browser Data:**
   - Clear cache, cookies, local storage
   - Start with clean session

2. **Check Prerequisites:**
   - Supabase running (pnpx supabase start)
   - Next.js dev server running (pnpm dev)
   - Mock data loaded successfully
   - All test accounts accessible

3. **Prepare Tools:**
   - Browser DevTools open (F12)
   - Network tab ready for performance checks
   - Console open for API calls
   - Screenshot tool ready

### During Testing

1. **Follow Test Order:**
   - Execute tests sequentially (1.1 → 1.2 → 1.3...)
   - Some tests depend on previous test data
   - Don't skip tests

2. **Document Everything:**
   - Mark ✅ or ❌ for each checkpoint
   - Take screenshots of failures
   - Note actual vs expected results
   - Record performance measurements

3. **Use DevTools:**
   - Network tab: Check API responses, timing
   - Console: Execute test API calls
   - Performance: Monitor load times
   - Application: Inspect local storage, cookies

4. **Test Edge Cases:**
   - Try invalid inputs
   - Test boundary values
   - Simulate network errors (disconnect/reconnect)
   - Test with different user roles

### After Testing

1. **Generate Report:**
   - Pass/fail count per phase
   - Overall pass percentage
   - Critical bugs found
   - Performance measurements

2. **Prioritize Bugs:**
   - Critical bugs block release
   - High bugs must be fixed
   - Medium/Low can be deferred

3. **Sign Off:**
   - Complete test sign-off form
   - Get stakeholder approval
   - Archive test results

---

## 🚀 Next Steps After Testing

### If Tests PASS (≥95%)

1. **Production Deployment:**
   - Apply migrations to production
   - Deploy application
   - Monitor for 24-48 hours

2. **User Training:**
   - Train managers on analytics
   - Train technicians on task system
   - Train reception on service requests

3. **Documentation:**
   - Update user guides
   - Create video tutorials
   - Prepare FAQs

### If Tests FAIL (<95%)

1. **Bug Triage:**
   - Prioritize by severity
   - Assign to developers
   - Set fix deadlines

2. **Regression Testing:**
   - Re-test failed scenarios after fixes
   - Verify no new bugs introduced
   - Check related functionality

3. **Decide:**
   - Fix and retest OR
   - Defer non-critical issues OR
   - Scope down release

---

## 📞 Support

**Questions about testing:**
- Review test plan: `E2E-TEST-PLAN-PTMS-WITH-MOCK-DATA.md`
- Check implementation status: `docs/IMPLEMENTATION-PLAN-FINAL-STATUS.md`
- Review architecture decisions: `docs/PHASE-3-ARCHITECTURE-DECISIONS.md`

**Need help with test data:**
- Mock data file: `docs/data/mock-data-ptms-v4.json`
- Data schema: `docs/data/schemas/`

**Found bugs:**
- Create issue in project tracker
- Use bug report template above
- Include all relevant details

---

## ✨ Test Plan Evolution

**Version History:**

**v1.0 (Original):**
- Generic test scenarios
- No specific test data
- Theory-based testing

**v2.0 (Data-Driven - Current):**
- Aligned with mock data v4.0
- Specific test entities referenced
- Practical, executable tests
- Pre-configured scenarios

**Future:**
- Automated E2E tests (Playwright)
- CI/CD integration
- Performance regression tests
- Load testing scenarios

---

**Document Version:** 2.0
**Last Updated:** November 3, 2025
**Test Architect:** Quinn 🧪
**Status:** ✅ Ready for Execution
