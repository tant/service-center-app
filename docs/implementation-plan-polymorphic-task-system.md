# Implementation Plan: Polymorphic Task Management System

**Project Code:** PTMS-2025
**Version:** 1.0
**Date:** January 2025
**Status:** Awaiting Approval
**Owner:** Engineering Team

---

## Executive Summary

### Vision
Transform operations through a unified task-driven workflow system where staff see all their work in one place, completing tasks automatically progresses business processes, and management gains real-time visibility into team performance.

### Business Impact
- **Operational Excellence:** Zero missed work (receipts with missing serials, forgotten approvals)
- **Performance Visibility:** Data-driven employee evaluation and resource optimization
- **Process Automation:** Workflows progress automatically based on task completion
- **Scalability:** Extensible architecture supports new entity types without code changes

### Investment Overview
| Metric | Value |
|--------|-------|
| **Total Investment** | $45,000 - $70,000 |
| **Timeline** | 22 weeks (5.5 months) |
| **Team Size** | 2 developers, 1 QA, 0.5 UX designer, 0.2 PM |
| **Expected ROI** | 10-15% productivity improvement |
| **Payback Period** | 12-18 months |

### Key Milestones
1. **Week 4:** MVP - Service tickets on polymorphic system
2. **Week 8:** Serial entry tasks operational (biggest pain point solved)
3. **Week 16:** Full analytics & performance tracking
4. **Week 22:** AI-powered insights & production launch

---

## Project Scope

### In Scope

#### Phase 1: Foundation (Weeks 1-4)
- Polymorphic `entity_tasks` table creation
- Migration of service ticket tasks
- Unified task API (tRPC endpoints)
- Basic "My Tasks" dashboard UI
- Task lifecycle management (start, complete, block)

#### Phase 2: Serial Entry Tasks (Weeks 5-8)
- Auto-create serial entry tasks on receipt approval
- Progress tracking (X/Y serials scanned)
- Auto-completion when all serials entered
- Receipt status auto-progression
- Integration with existing serial entry UI

#### Phase 3: Advanced Features (Weeks 9-16)
- Transfer approval workflows
- Service request processing workflows
- Auto-assignment algorithms
- SLA tracking & deadline alerts
- Manager performance dashboard
- Employee self-service metrics view

#### Phase 4: Polish & Scale (Weeks 17-22)
- Workflow builder UI (drag-and-drop)
- AI-powered task time predictions
- Advanced analytics & reporting
- Performance optimization
- Load testing & scalability improvements

### Out of Scope
- **Mobile applications** (iOS/Android) - Future phase
- **Third-party integrations** (accounting, ERP) - Future phase
- **Custom reporting builder** - Use pre-built dashboards only
- **Multi-language support** - Vietnamese only for MVP
- **Advanced AI features** - Only basic predictive analytics in Phase 4
- **Workflow versioning** - Simple update/replace model only

### Success Criteria
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Task completion rate | >95% | Weekly audit of pending tasks |
| Serial entry compliance | 100% (zero missing) | Receipt audit report |
| Dashboard load time | <500ms | Performance monitoring |
| User adoption | >90% daily active | Analytics tracking |
| System uptime | >99.5% | Infrastructure monitoring |
| Employee satisfaction | >4.0/5.0 | Quarterly survey |

---

## Phase 1: Foundation (Weeks 1-4)

### Objectives
- Prove polymorphic architecture works
- Zero regression for existing service ticket functionality
- Establish technical patterns for future phases

### Tasks Breakdown

#### Week 1: Database Schema & Migration
**Developer 1:**
- [ ] Create `entity_tasks` table with all constraints (8h)
- [ ] Create `entity_type` ENUM type (2h)
- [ ] Update `workflows` table with `entity_type` column (2h)
- [ ] Write migration script with rollback capability (8h)
- [ ] Create database indexes for performance (4h)

**Developer 2:**
- [ ] Design event bus architecture (8h)
- [ ] Implement event emitter service (8h)
- [ ] Create entity adapter pattern interfaces (8h)

**QA:**
- [ ] Write integration test plan for migration (8h)
- [ ] Set up test database with sample data (4h)

**Deliverables:**
- ✅ `entity_tasks` table in production
- ✅ Migration tested with rollback
- ✅ Zero data loss or corruption

---

#### Week 2: API Layer & Services
**Developer 1:**
- [ ] Implement `TaskService` class (16h)
- [ ] Create unified task API endpoints (tRPC) (16h)
  - `myTasks` - Get user's tasks
  - `startTask` - Mark task in progress
  - `completeTask` - Complete with notes
  - `blockTask` - Mark blocked with reason

**Developer 2:**
- [ ] Implement entity adapters (16h)
  - ServiceTicketAdapter
  - Base adapter pattern
- [ ] Create task progression logic (16h)
  - Check dependencies
  - Enforce sequence rules
  - Auto-progress entities

**QA:**
- [ ] Write API integration tests (16h)
- [ ] Performance benchmark tests (8h)

**Deliverables:**
- ✅ Task API endpoints functional
- ✅ Business logic tested
- ✅ API documentation complete

---

#### Week 3: Frontend Dashboard
**Developer 1:**
- [ ] Create unified task dashboard page (16h)
- [ ] Implement task card components (12h)
- [ ] Add task filters & sorting (8h)

**Developer 2:**
- [ ] Integrate with task API (8h)
- [ ] Implement real-time updates (WebSocket/polling) (8h)
- [ ] Add task actions (start/complete/block) (8h)
- [ ] Error handling & loading states (8h)

**UX Designer (Part-time):**
- [ ] Design task dashboard mockups (16h)
- [ ] Create task card component designs (8h)
- [ ] Design task action flows (8h)

**QA:**
- [ ] Write E2E tests for dashboard (16h)
- [ ] Cross-browser testing (8h)

**Deliverables:**
- ✅ Task dashboard accessible at `/my-tasks`
- ✅ Users can view and manage their tasks
- ✅ Mobile-responsive design

---

#### Week 4: Migration & Testing
**Developer 1 & 2:**
- [ ] Migrate existing service_ticket_tasks data (16h)
- [ ] Update all references to use new system (16h)
- [ ] Performance optimization (8h)
- [ ] Bug fixes from testing (16h)

**QA:**
- [ ] Full regression testing suite (24h)
- [ ] Load testing with production-scale data (8h)
- [ ] User acceptance testing with 5 staff (16h)

**PM:**
- [ ] Prepare rollout communication (4h)
- [ ] Training materials for staff (8h)
- [ ] Go/No-Go decision meeting prep (4h)

**Deliverables:**
- ✅ All service tickets using polymorphic system
- ✅ Zero regressions
- ✅ Performance benchmarks met
- ✅ **Go/No-Go Decision Made**

---

## Phase 2: Serial Entry Tasks (Weeks 5-8)

### Objectives
- Solve biggest pain point: missing serials
- Demonstrate workflow automation value
- Achieve 100% serial entry compliance

### Tasks Breakdown

#### Week 5: Workflow Design & Schema
**Developer 1:**
- [ ] Design serial entry workflow (8h)
- [ ] Create system workflows in database (4h)
- [ ] Add workflow_id to inventory_receipts (4h)
- [ ] Design auto-creation trigger logic (8h)

**Developer 2:**
- [ ] Create receipt entity adapter (12h)
- [ ] Implement serial progress calculation (8h)
- [ ] Design auto-completion logic (8h)

**Deliverables:**
- ✅ Serial entry workflow defined
- ✅ Database schema updated

---

#### Week 6: Backend Implementation
**Developer 1:**
- [ ] Implement auto-create tasks trigger (16h)
  - On receipt approval
  - One task per product line
- [ ] Implement auto-complete trigger (16h)
  - Check serial count vs expected
  - Mark task & receipt complete

**Developer 2:**
- [ ] Extend task API for serial context (8h)
- [ ] Add progress tracking endpoint (8h)
- [ ] Create serial entry helper functions (8h)
- [ ] Integrate with existing serial entry UI (8h)

**QA:**
- [ ] Test auto-creation scenarios (16h)
- [ ] Test auto-completion edge cases (16h)

**Deliverables:**
- ✅ Tasks auto-created on approval
- ✅ Tasks auto-complete when serials done
- ✅ Receipt status progresses automatically

---

#### Week 7: Frontend Integration
**Developer 1:**
- [ ] Update serial entry UI to show task context (16h)
- [ ] Add progress indicator to receipt detail (8h)
- [ ] Show serial tasks in main dashboard (8h)

**Developer 2:**
- [ ] Implement task-to-serial-entry navigation (8h)
- [ ] Add quick complete action from dashboard (8h)
- [ ] Update notifications for serial tasks (8h)

**UX Designer:**
- [ ] Design serial entry task cards (8h)
- [ ] Design progress visualization (8h)

**QA:**
- [ ] E2E test full serial entry flow (16h)
- [ ] Test with 50+ serial receipts (8h)

**Deliverables:**
- ✅ Serial tasks visible in dashboard
- ✅ Progress tracking clear and accurate
- ✅ UX smooth and intuitive

---

#### Week 8: Validation & Rollout
**Developer 1 & 2:**
- [ ] Bug fixes from testing (16h)
- [ ] Performance optimization (8h)
- [ ] Add audit logging (8h)

**QA:**
- [ ] Final regression testing (16h)
- [ ] Production smoke tests (8h)
- [ ] Monitor for 3 days post-rollout (24h)

**PM:**
- [ ] Train warehouse staff on new system (8h)
- [ ] Create video tutorials (4h)
- [ ] Measure baseline: receipts with missing serials (4h)

**Success Metric:**
- ✅ Zero receipts with missing serials for 2 consecutive weeks

---

## Phase 3: Advanced Features (Weeks 9-16)

### Week 9-10: Transfer Approvals
**Goals:**
- High-value transfers (>10M) require manager approval
- Block execution until approved
- Track approval metrics

**Tasks:**
- [ ] Design approval workflow (8h)
- [ ] Add workflow_id to transfers table (4h)
- [ ] Implement auto-assignment for high-value (8h)
- [ ] Create approval UI for managers (16h)
- [ ] Add approval notifications (8h)
- [ ] Testing & rollout (16h)

**Deliverables:**
- ✅ Approval tasks for high-value transfers
- ✅ Execution blocked until approved
- ✅ Audit trail of all approvals

---

### Week 11-12: Analytics & Performance Dashboard
**Goals:**
- Managers can track team performance
- Employees see their own metrics
- Identify bottlenecks in real-time

**Tasks:**
- [ ] Design metrics schema (8h)
- [ ] Implement metrics calculation jobs (16h)
- [ ] Create manager dashboard UI (24h)
- [ ] Create employee self-service view (16h)
- [ ] Add performance tier badges (8h)
- [ ] Implement recommendation engine (16h)
- [ ] Testing & validation (16h)

**Deliverables:**
- ✅ Manager dashboard at `/analytics/team`
- ✅ Employee view at `/my-performance`
- ✅ Daily metrics calculation job
- ✅ Automated recommendations

---

### Week 13-14: Service Request Processing
**Goals:**
- Service requests auto-create tasks
- Task completion triggers ticket creation
- Request status progresses automatically

**Tasks:**
- [ ] Design request processing workflow (8h)
- [ ] Add workflow_id to service_requests (4h)
- [ ] Implement auto-task creation (12h)
- [ ] Integrate with ticket creation trigger (12h)
- [ ] Update request status based on tasks (8h)
- [ ] Create request processing UI (16h)
- [ ] Testing & rollout (16h)

**Deliverables:**
- ✅ Request processing workflow operational
- ✅ Auto-ticket creation on approval
- ✅ Request status tracking

---

### Week 15-16: Optimization & Polish
**Goals:**
- Dashboard loads in <500ms
- System handles 100 concurrent users
- Test coverage >80%

**Tasks:**
- [ ] Database query optimization (16h)
- [ ] Implement Redis caching (16h)
- [ ] Add materialized views (8h)
- [ ] Frontend performance optimization (12h)
- [ ] Load testing (16h)
- [ ] Add monitoring & alerting (12h)
- [ ] Write comprehensive tests (24h)

**Deliverables:**
- ✅ Performance benchmarks met
- ✅ System scalable to 100+ users
- ✅ Test coverage >80%

---

## Phase 4: Polish & Scale (Weeks 17-22)

### Week 17-20: Workflow Builder UI
**Goals:**
- Managers create custom workflows without dev
- Drag-and-drop interface
- Workflow versioning support

**Tasks:**
- [ ] Design workflow builder UX (16h)
- [ ] Implement drag-and-drop editor (40h)
- [ ] Add workflow validation (16h)
- [ ] Create workflow testing sandbox (16h)
- [ ] Implement workflow approval process (16h)
- [ ] Testing & documentation (24h)

**Deliverables:**
- ✅ Workflow builder at `/workflows/builder`
- ✅ 3 new workflows created by managers
- ✅ Workflow library established

---

### Week 21-22: AI & Advanced Analytics
**Goals:**
- Predict task completion time
- Suggest optimal assignments
- Identify training needs

**Tasks:**
- [ ] Collect historical task data (8h)
- [ ] Train ML model for time prediction (24h)
- [ ] Implement assignment suggestions (16h)
- [ ] Create insights dashboard (16h)
- [ ] A/B test AI vs manual assignments (16h)
- [ ] Documentation & rollout (8h)

**Deliverables:**
- ✅ AI-powered predictions live
- ✅ 10% improvement in throughput
- ✅ Manager adoption >80%

---

## Resource Requirements

### Team Composition

#### Development Team
| Role | Allocation | Duration | Cost |
|------|------------|----------|------|
| **Senior Full-Stack Developer 1** | 100% | 22 weeks | $27,500 |
| **Senior Full-Stack Developer 2** | 100% | 22 weeks | $27,500 |
| **QA Engineer** | 75% | 22 weeks | $13,750 |
| **UX/UI Designer** | 25% | 16 weeks | $4,000 |
| **Project Manager** | 20% | 22 weeks | $5,500 |
| **DevOps Support** | 10% | 22 weeks | $2,750 |

**Total Labor Cost:** $81,000

### Infrastructure & Tools
| Item | Cost | Notes |
|------|------|-------|
| Development environments | $500 | 3 staging servers |
| Testing tools & licenses | $1,000 | Playwright, Jest, K6 |
| AI/ML services | $1,500 | Model training, API costs |
| Monitoring & logging | $500 | DataDog/NewRelic trial |

**Total Infrastructure:** $3,500

### Contingency & Buffer
- **Risk buffer (15%):** $12,675
- **Scope creep buffer (10%):** $8,450

### Total Budget Range
- **Minimum (optimistic):** $84,500
- **Expected (realistic):** $95,625
- **Maximum (pessimistic):** $105,625

**Recommended Budget:** **$98,000**

---

## Timeline & Milestones

### Gantt Chart Overview

```
Phase 1: Foundation           [████████] Weeks 1-4
  ├─ Schema & Migration       [████░░░░] Weeks 1-2
  ├─ API Layer               [░░░░████] Weeks 2-3
  ├─ Frontend Dashboard      [░░░████░] Weeks 3-4
  └─ Testing & Go/No-Go      [░░░░░███] Week 4

Phase 2: Serial Entry        [████████] Weeks 5-8
  ├─ Workflow Design         [████░░░░] Weeks 5-6
  ├─ Backend Implementation  [░░████░░] Weeks 6-7
  ├─ Frontend Integration    [░░░░████] Weeks 7-8
  └─ Validation              [░░░░░███] Week 8

Phase 3: Advanced Features   [████████] Weeks 9-16
  ├─ Transfer Approvals      [██░░░░░░] Weeks 9-10
  ├─ Analytics Dashboard     [░░██░░░░] Weeks 11-12
  ├─ Request Processing      [░░░░██░░] Weeks 13-14
  └─ Optimization            [░░░░░░██] Weeks 15-16

Phase 4: Polish & Scale      [████████] Weeks 17-22
  ├─ Workflow Builder        [████░░] Weeks 17-20
  └─ AI Features             [░░░░██] Weeks 21-22
```

### Critical Milestones

| Week | Milestone | Success Criteria | Decision Point |
|------|-----------|------------------|----------------|
| **Week 4** | **Phase 1 Complete** | Zero regressions, <500ms load time | **GO/NO-GO for Phase 2** |
| **Week 8** | **Phase 2 Complete** | Zero missing serials for 2 weeks | **GO/NO-GO for Phase 3** |
| **Week 16** | **Phase 3 Complete** | Manager dashboard daily usage >90% | **GO/NO-GO for Phase 4** |
| **Week 22** | **Project Complete** | All success criteria met | **Production Launch** |

### Decision Gates

**Week 4 Go/No-Go Criteria:**
- ✅ All service tickets migrated successfully
- ✅ Performance benchmarks met (<500ms)
- ✅ Zero critical bugs in production
- ✅ User acceptance testing passed
- ⚠️ If FAIL: Extend Phase 1 by 2 weeks OR pivot to simpler design

**Week 8 Go/No-Go Criteria:**
- ✅ Zero receipts with missing serials
- ✅ Staff adoption >80%
- ✅ Auto-completion working reliably
- ⚠️ If FAIL: Fix issues before proceeding OR descope Phase 3

**Week 16 Go/No-Go Criteria:**
- ✅ Manager dashboard usage >90%
- ✅ Performance metrics accurate
- ✅ System stable under load
- ⚠️ If FAIL: Consider stopping at Phase 3 OR reduce Phase 4 scope

---

## Risk Assessment & Mitigation

### High-Priority Risks

#### Risk 1: Data Migration Failure
**Probability:** Medium (30%)
**Impact:** Critical (System down)
**Mitigation:**
- Dual-write period: Write to both old and new tables simultaneously
- Extensive testing on production copy
- Rollback script tested and ready
- Phased migration: 10% → 50% → 100%
- **Contingency:** Rollback within 15 minutes if issues detected

#### Risk 2: Performance Degradation
**Probability:** Medium (40%)
**Impact:** High (Poor UX)
**Mitigation:**
- Early load testing with production-scale data
- Database query optimization sprint (Week 15)
- Caching strategy implementation
- Materialized views for common queries
- **Contingency:** Add caching layer before rollout

#### Risk 3: User Adoption Resistance
**Probability:** High (60%)
**Impact:** Medium (Project fails to deliver value)
**Mitigation:**
- Early user involvement in design
- Gradual rollout with champions
- Comprehensive training program
- Gamification elements (badges, leaderboards)
- Visible leadership support
- **Contingency:** Extended training period, incentives

#### Risk 4: Scope Creep
**Probability:** High (70%)
**Impact:** Medium (Budget/timeline overrun)
**Mitigation:**
- Strict change control process
- Feature freeze after each phase
- 10% buffer in budget
- Weekly scope review meetings
- **Contingency:** Descope Phase 4 features if needed

#### Risk 5: Key Team Member Departure
**Probability:** Low (20%)
**Impact:** High (Knowledge loss)
**Mitigation:**
- Pair programming for knowledge sharing
- Comprehensive documentation
- Code reviews mandatory
- Cross-training sessions
- **Contingency:** Contract extension for departed member OR hire replacement immediately

### Medium-Priority Risks

#### Risk 6: Third-Party API Changes
**Probability:** Low (15%)
**Impact:** Medium
**Mitigation:**
- Version pinning for all dependencies
- Monitor changelogs
- Abstraction layer for external services

#### Risk 7: Security Vulnerabilities
**Probability:** Medium (30%)
**Impact:** High
**Mitigation:**
- Security review in Week 4, 8, 16
- Penetration testing before launch
- OWASP top 10 compliance
- Regular dependency updates

#### Risk 8: Database Scalability Issues
**Probability:** Low (25%)
**Impact:** Medium
**Mitigation:**
- Partitioning strategy for entity_tasks
- Archive old completed tasks (>6 months)
- Read replicas for reporting queries

---

## Success Metrics & KPIs

### Operational Metrics

| Metric | Baseline | Target (3 months) | Measurement |
|--------|----------|-------------------|-------------|
| **Receipts with missing serials** | ~15% | 0% | Weekly audit |
| **Average receipt completion time** | 3 days | 1.5 days | System tracking |
| **Tasks completed on time (SLA)** | N/A | >90% | Task timestamps |
| **Workflow completion rate** | N/A | >95% | Workflow tracking |
| **Manager dashboard daily usage** | N/A | >90% | Analytics |

### Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Dashboard load time** | <500ms | Performance monitoring |
| **Task API response time** | <200ms | APM tools |
| **System uptime** | >99.5% | Infrastructure monitoring |
| **Concurrent users supported** | 100+ | Load testing |
| **Database query time (p95)** | <100ms | Query profiling |

### User Satisfaction Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Employee satisfaction score** | >4.0/5.0 | Quarterly survey |
| **Manager satisfaction score** | >4.5/5.0 | Quarterly survey |
| **Task dashboard NPS** | >40 | In-app survey |
| **Training completion rate** | >95% | LMS tracking |
| **Support tickets** | <5/week | Support system |

### Business Impact Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Overall productivity improvement** | 10-15% | Tasks completed per day |
| **Error rate reduction** | -50% | Quality audit |
| **Rework rate** | <5% | Task rejection tracking |
| **Employee retention improvement** | +10% | HR metrics |
| **Customer satisfaction** | +5% | CSAT surveys |

### ROI Calculation

**Costs:**
- Implementation: $110,000
- Annual maintenance: $15,000/year

**Benefits (Annual):**
- Productivity improvement: 15% × 20 staff × $30K salary = $90,000/year
- Error reduction: Fewer rework hours = $20,000/year
- Improved retention: Lower hiring costs = $10,000/year
- **Total Annual Benefit:** $120,000/year

**ROI:** ($120,000 - $15,000) / $110,000 = **95% first year**
**Payback Period:** 12.5 months

---

## Dependencies & Assumptions

### Technical Dependencies

1. **Database:** PostgreSQL 14+ with required extensions
2. **Backend:** Node.js 18+, Next.js 15, tRPC 11
3. **Frontend:** React 19, TanStack Query, Tailwind CSS
4. **Infrastructure:** Supabase hosted (or self-hosted equivalent)
5. **Monitoring:** DataDog/NewRelic or similar APM

### External Dependencies

1. **Stakeholder Availability:** Management approval by Week 0
2. **User Participation:** 5 staff for UAT each phase
3. **Training Facilities:** Conference room for 8h sessions
4. **Budget Approval:** $110K approved before start
5. **Infrastructure Access:** Production database access for migration

### Key Assumptions

1. **Team Availability:** 2 developers full-time for 5.5 months
2. **Current System Stability:** No major production incidents during implementation
3. **User Workload:** Staff have time for training and adoption
4. **Data Quality:** Existing data is clean and migratable
5. **Scope Stability:** No major requirement changes after Week 4
6. **Vendor Stability:** Supabase remains reliable and performant
7. **Leadership Support:** Executive sponsorship throughout project

### Constraints

1. **Budget:** Hard cap at $105,625
2. **Timeline:** Must complete by end of Q2 2025
3. **Resources:** Cannot hire additional full-time staff
4. **Technology:** Must use existing tech stack (Next.js, Supabase)
5. **Compliance:** Must maintain GDPR/data privacy standards
6. **Availability:** Zero downtime during migrations

---

## Change Management & Training

### Communication Plan

#### Week 0 (Kickoff)
- **Audience:** All staff
- **Message:** "New task management system coming - make your work easier"
- **Channel:** All-hands meeting, email announcement
- **Goal:** Build excitement, reduce anxiety

#### Week 3 (Preview)
- **Audience:** Champions/early adopters
- **Message:** "See preview, give feedback"
- **Channel:** Demo session
- **Goal:** Get buy-in, identify issues early

#### Week 4 (Phase 1 Launch)
- **Audience:** Service ticket users
- **Message:** "Tasks now in one place - here's how"
- **Channel:** Training session, video tutorial
- **Goal:** Smooth transition, minimize disruption

#### Week 8 (Phase 2 Launch)
- **Audience:** Warehouse staff
- **Message:** "Serial entry simplified - no more missing serials"
- **Channel:** Hands-on workshop
- **Goal:** 100% adoption for serial tasks

#### Week 16 (Phase 3 Launch)
- **Audience:** Managers
- **Message:** "Performance insights at your fingertips"
- **Channel:** Manager training + dashboard walkthrough
- **Goal:** Daily dashboard usage

### Training Program

#### Level 1: All Staff (4 hours)
- **Module 1:** Task dashboard overview (1h)
- **Module 2:** Starting, completing, blocking tasks (1h)
- **Module 3:** Understanding priorities and deadlines (1h)
- **Module 4:** Hands-on practice with test accounts (1h)
- **Materials:** Video tutorials, quick reference cards

#### Level 2: Technicians (1 hour)
- **Module 1:** Serial entry tasks in depth (1h)
- **Materials:** Step-by-step guides, FAQ document

#### Level 3: Managers (4 hours)
- **Module 1:** Performance dashboard deep dive (2h)
- **Module 2:** Interpreting metrics and taking action (1h)
- **Module 3:** Creating custom workflows (Phase 4) (1h)
- **Materials:** Manager handbook, best practices guide

### Support Structure

#### Tier 1: Self-Service
- **Video library:** 20+ tutorials
- **FAQ document:** Common questions
- **In-app tooltips:** Contextual help
- **Response time:** Immediate

#### Tier 2: Peer Support
- **Champions network:** 3 trained super-users per department
- **Slack channel:** #task-system-help
- **Weekly office hours:** 1h Q&A session
- **Response time:** <2 hours

#### Tier 3: Tech Support
- **Support ticket system:** For bugs and technical issues
- **Direct Slack to dev team:** For urgent issues
- **Response time:** <4 hours (business hours)

---

## Approval & Sign-Off

### Approval Checklist

#### Executive Sponsor
- [ ] Budget approved: $110,000
- [ ] Timeline acceptable: 6 months
- [ ] Business case validated: ROI >90%
- [ ] Resources allocated: 2 devs, 1 QA, 0.5 UX, 0.2 PM
- [ ] Strategic alignment confirmed

**Name:** ___________________________
**Title:** ___________________________
**Date:** ___________________________
**Signature:** ___________________________

---

#### Engineering Manager
- [ ] Technical design reviewed and approved
- [ ] Team capacity confirmed
- [ ] Infrastructure requirements understood
- [ ] Risk mitigation plans acceptable
- [ ] Quality standards defined

**Name:** ___________________________
**Title:** ___________________________
**Date:** ___________________________
**Signature:** ___________________________

---

#### Operations Manager
- [ ] Business requirements captured
- [ ] Change management plan approved
- [ ] Training program acceptable
- [ ] Success metrics agreed upon
- [ ] Staff availability confirmed

**Name:** ___________________________
**Title:** ___________________________
**Date:** ___________________________
**Signature:** ___________________________

---

#### Finance Manager
- [ ] Budget allocation approved
- [ ] ROI calculation validated
- [ ] Payment terms established
- [ ] Cost tracking method defined

**Name:** ___________________________
**Title:** ___________________________
**Date:** ___________________________
**Signature:** ___________________________

---

### Conditions of Approval

1. **Phase gate reviews mandatory** - Go/No-Go decision at Weeks 4, 8, 16
2. **Budget overrun approval required** - Any increase >10% needs re-approval
3. **Weekly status reports** - Email to stakeholders every Friday
4. **Monthly steering committee** - Review progress, risks, decisions
5. **Scope change control** - All scope changes require approval

### Escalation Path

1. **Issues <$5K impact:** Project Manager decides
2. **Issues $5K-$20K impact:** Engineering Manager approval
3. **Issues >$20K impact:** Executive Sponsor approval
4. **Timeline impact >2 weeks:** Steering committee decision

---

## Next Steps

### Immediate Actions (Week 0)

1. **Circulate for approval** - Send to all stakeholders by [DATE]
2. **Schedule kickoff meeting** - [DATE/TIME]
3. **Finalize team assignments** - Developer 1, Developer 2, QA, UX confirmed
4. **Set up project tracking** - JIRA/Linear board, Slack channel
5. **Provision environments** - Dev, staging, test databases

### Upon Approval

1. **Contract negotiations** - If external contractors needed
2. **Purchase tools/licenses** - Testing tools, AI/ML services
3. **Week 1 sprint planning** - Break down tasks, assign owners
4. **Stakeholder communication** - Announce project start
5. **Risk monitoring setup** - Weekly risk review cadence

---

## Extensibility Guide: Adding New Entity Types

### Overview

The polymorphic task system is **designed for extensibility**. When you need to add new document types (phiếu mới) in the future—such as warranty claims, quality checks, return merchandise authorizations, or equipment maintenance—you can integrate them into the task system **without rebuilding the core architecture**.

### Time Investment for New Entity Types

| Activity | Time Required | Complexity |
|----------|---------------|------------|
| Add entity type to ENUM | 5 minutes | Trivial |
| Create entity adapter class | 2-4 hours | Low |
| Define workflow template | 10-30 minutes | Trivial |
| Write integration tests | 4-8 hours | Medium |
| Update UI (if needed) | 2-4 hours | Low |
| **Total** | **1-2 days** | **Low** |

Compare this to a non-polymorphic system: **2-4 weeks** of development time.

---

### Step-by-Step Guide

#### Step 1: Add Entity Type to Database (5 minutes)

```sql
-- Add new value to entity_type ENUM
ALTER TYPE entity_type ADD VALUE 'warranty_claim';
ALTER TYPE entity_type ADD VALUE 'quality_check';
ALTER TYPE entity_type ADD VALUE 'rma_request';
-- etc.
```

**Note:** PostgreSQL ENUM values cannot be removed once added, only appended.

---

#### Step 2: Create Entity Adapter (2-4 hours)

Create a new adapter class implementing the `EntityAdapter` interface:

```typescript
// src/server/services/entity-adapters/warranty-claim-adapter.ts

import type { EntityAdapter, TaskContext } from './base-adapter';

export class WarrantyClaimAdapter implements EntityAdapter {
  entityType = 'warranty_claim' as const;

  /**
   * Check if a task can be started based on entity-specific rules
   */
  async canStartTask(
    ctx: TRPCContext,
    taskId: string
  ): Promise<{ canStart: boolean; reason?: string }> {
    // Example: Check if warranty claim is approved
    const task = await this.getTask(ctx, taskId);
    const claim = await ctx.supabaseAdmin
      .from('warranty_claims')
      .select('status')
      .eq('id', task.entity_id)
      .single();

    if (claim.data?.status === 'rejected') {
      return {
        canStart: false,
        reason: 'Không thể thực hiện task cho phiếu bảo hành đã từ chối',
      };
    }

    return { canStart: true };
  }

  /**
   * Called when a task is completed
   * Implement auto-progression logic here
   */
  async onTaskComplete(
    ctx: TRPCContext,
    taskId: string
  ): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Check if all required tasks are complete
    const allComplete = await this.areAllRequiredTasksComplete(
      ctx,
      task.entity_id
    );

    if (allComplete) {
      // Auto-progress warranty claim to next status
      await ctx.supabaseAdmin
        .from('warranty_claims')
        .update({ status: 'completed' })
        .eq('id', task.entity_id);
    }
  }

  /**
   * Called when a task is started
   */
  async onTaskStart(
    ctx: TRPCContext,
    taskId: string
  ): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Example: Update warranty claim status to 'processing'
    await ctx.supabaseAdmin
      .from('warranty_claims')
      .update({ status: 'processing' })
      .eq('id', task.entity_id);
  }

  /**
   * Get entity-specific context for task display
   */
  async getEntityContext(
    ctx: TRPCContext,
    entityId: string
  ): Promise<TaskContext> {
    const { data: claim } = await ctx.supabaseAdmin
      .from('warranty_claims')
      .select(`
        id,
        claim_number,
        customer:customers(full_name, phone),
        product:products(name, serial_number),
        status,
        created_at
      `)
      .eq('id', entityId)
      .single();

    return {
      entityId: claim.id,
      entityType: 'warranty_claim',
      title: `Phiếu bảo hành ${claim.claim_number}`,
      subtitle: `${claim.customer.full_name} - ${claim.product.name}`,
      status: claim.status,
      url: `/warranty-claims/${claim.id}`,
      metadata: {
        claimNumber: claim.claim_number,
        serialNumber: claim.product.serial_number,
      },
    };
  }

  /**
   * Validate if workflow can be assigned to this entity
   */
  async canAssignWorkflow(
    ctx: TRPCContext,
    entityId: string,
    workflowId: string
  ): Promise<{ canAssign: boolean; reason?: string }> {
    // Example: Only allow warranty workflows for in-warranty products
    const claim = await this.getClaim(ctx, entityId);

    if (!claim.product.is_under_warranty) {
      return {
        canAssign: false,
        reason: 'Sản phẩm hết hạn bảo hành, không thể áp dụng quy trình này',
      };
    }

    return { canAssign: true };
  }

  // Helper methods
  private async getTask(ctx: TRPCContext, taskId: string) {
    const { data } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    return data;
  }

  private async areAllRequiredTasksComplete(
    ctx: TRPCContext,
    entityId: string
  ): Promise<boolean> {
    const { data: tasks } = await ctx.supabaseAdmin
      .from('entity_tasks')
      .select('status, is_required')
      .eq('entity_id', entityId)
      .eq('entity_type', 'warranty_claim');

    return tasks?.every(
      (t) => !t.is_required || t.status === 'completed'
    ) ?? false;
  }
}
```

---

#### Step 3: Register Adapter in Adapter Registry (5 minutes)

```typescript
// src/server/services/entity-adapters/registry.ts

import { WarrantyClaimAdapter } from './warranty-claim-adapter';
import { ServiceTicketAdapter } from './service-ticket-adapter';
import { InventoryReceiptAdapter } from './inventory-receipt-adapter';
// ... other adapters

export class EntityAdapterRegistry {
  private adapters = new Map<string, EntityAdapter>();

  constructor() {
    // Register all adapters
    this.register(new ServiceTicketAdapter());
    this.register(new InventoryReceiptAdapter());
    this.register(new WarrantyClaimAdapter()); // ← Add new adapter
  }

  register(adapter: EntityAdapter) {
    this.adapters.set(adapter.entityType, adapter);
  }

  get(entityType: string): EntityAdapter {
    const adapter = this.adapters.get(entityType);
    if (!adapter) {
      throw new Error(`No adapter found for entity type: ${entityType}`);
    }
    return adapter;
  }
}

export const adapterRegistry = new EntityAdapterRegistry();
```

---

#### Step 4: Create Workflow Template (10-30 minutes)

Define workflow in database using existing `workflows` and `workflow_tasks` tables:

```sql
-- Create workflow for warranty claims
INSERT INTO workflows (
  id,
  name,
  description,
  entity_type,
  strict_sequence,
  is_active
) VALUES (
  gen_random_uuid(),
  'Quy trình xử lý bảo hành',
  'Quy trình chuẩn cho các phiếu bảo hành sản phẩm',
  'warranty_claim',
  true,
  true
);

-- Add tasks to workflow (assuming tasks already exist in tasks table)
INSERT INTO workflow_tasks (
  workflow_id,
  task_id,
  sequence_order,
  is_required,
  custom_instructions
) VALUES
  -- Task 1: Verify warranty eligibility
  (
    '<workflow_id>',
    '<task_id_verify_warranty>',
    1,
    true,
    'Kiểm tra serial number và ngày hết hạn bảo hành'
  ),
  -- Task 2: Inspect product condition
  (
    '<workflow_id>',
    '<task_id_inspect>',
    2,
    true,
    'Chụp ảnh sản phẩm, ghi nhận tình trạng'
  ),
  -- Task 3: Process replacement or repair
  (
    '<workflow_id>',
    '<task_id_process>',
    3,
    true,
    'Thay thế hoặc sửa chữa theo chính sách bảo hành'
  ),
  -- Task 4: Quality check
  (
    '<workflow_id>',
    '<task_id_qa>',
    4,
    true,
    'Kiểm tra chất lượng sau xử lý'
  ),
  -- Task 5: Return to customer
  (
    '<workflow_id>',
    '<task_id_return>',
    5,
    true,
    'Liên hệ khách hàng và giao trả sản phẩm'
  );
```

**Or use tRPC API:**

```typescript
// In your code
await trpc.workflow.template.create.mutate({
  name: 'Quy trình xử lý bảo hành',
  description: 'Quy trình chuẩn cho các phiếu bảo hành sản phẩm',
  entity_type: 'warranty_claim',
  enforce_sequence: true,
  tasks: [
    { task_id: 'uuid1', sequence_order: 1, is_required: true },
    { task_id: 'uuid2', sequence_order: 2, is_required: true },
    // ...
  ],
});
```

---

#### Step 5: Use Workflow When Creating Entity (5 minutes)

```typescript
// When creating a warranty claim
const warrantyClaimId = await createWarrantyClaim(ctx, claimData);

// Auto-create tasks from workflow
if (claimData.workflow_id) {
  await createTasksFromWorkflow(
    ctx,
    warrantyClaimId,
    claimData.workflow_id
  );
}

// ✅ Tasks now appear in staff dashboard
// ✅ Task completion auto-progresses warranty claim
// ✅ All existing task features work (assignments, SLA, notifications)
```

---

### Entity Adapter Interface Specification

All entity adapters must implement this interface:

```typescript
export interface EntityAdapter {
  /** Unique entity type identifier */
  entityType: string;

  /** Check if task can be started (optional) */
  canStartTask?(
    ctx: TRPCContext,
    taskId: string
  ): Promise<{ canStart: boolean; reason?: string }>;

  /** Called when task starts (optional) */
  onTaskStart?(ctx: TRPCContext, taskId: string): Promise<void>;

  /** Called when task completes (required) */
  onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void>;

  /** Called when task is blocked (optional) */
  onTaskBlock?(
    ctx: TRPCContext,
    taskId: string,
    reason: string
  ): Promise<void>;

  /** Get entity context for UI display (required) */
  getEntityContext(
    ctx: TRPCContext,
    entityId: string
  ): Promise<TaskContext>;

  /** Validate workflow assignment (optional) */
  canAssignWorkflow?(
    ctx: TRPCContext,
    entityId: string,
    workflowId: string
  ): Promise<{ canAssign: boolean; reason?: string }>;
}

export interface TaskContext {
  entityId: string;
  entityType: string;
  title: string; // Display title (e.g., "Phiếu bảo hành BH-2025-001")
  subtitle?: string; // Additional info (e.g., customer name)
  status: string;
  url: string; // Link to entity detail page
  metadata?: Record<string, any>; // Entity-specific data
}
```

---

### Real-World Examples

#### Example 1: Quality Check Documents

```sql
-- 1. Add entity type
ALTER TYPE entity_type ADD VALUE 'quality_check';

-- 2. Create workflow
INSERT INTO workflows (name, entity_type, strict_sequence)
VALUES ('Kiểm định chất lượng sản phẩm', 'quality_check', true);

-- 3. Define tasks
INSERT INTO workflow_tasks (workflow_id, task_id, sequence_order)
VALUES
  (workflow_id, 'visual_inspection_task_id', 1),
  (workflow_id, 'performance_test_task_id', 2),
  (workflow_id, 'documentation_task_id', 3);
```

```typescript
// 4. Create adapter (simplified)
export class QualityCheckAdapter implements EntityAdapter {
  entityType = 'quality_check';

  async onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void> {
    // Auto-progress quality check status
    const task = await this.getTask(ctx, taskId);
    const allComplete = await this.areAllTasksComplete(ctx, task.entity_id);

    if (allComplete) {
      await ctx.supabaseAdmin
        .from('quality_checks')
        .update({ status: 'passed' })
        .eq('id', task.entity_id);
    }
  }

  async getEntityContext(ctx: TRPCContext, entityId: string) {
    const qc = await this.getQualityCheck(ctx, entityId);
    return {
      entityId: qc.id,
      entityType: 'quality_check',
      title: `Kiểm định ${qc.check_number}`,
      subtitle: qc.product_name,
      status: qc.status,
      url: `/quality-checks/${qc.id}`,
    };
  }
}
```

#### Example 2: Equipment Maintenance

```typescript
// Maintenance adapter with scheduled task support
export class MaintenanceAdapter implements EntityAdapter {
  entityType = 'equipment_maintenance';

  async onTaskComplete(ctx: TRPCContext, taskId: string): Promise<void> {
    const task = await this.getTask(ctx, taskId);

    // Update maintenance record
    await ctx.supabaseAdmin
      .from('maintenance_records')
      .update({
        last_maintenance_date: new Date(),
        next_maintenance_date: addMonths(new Date(), 3),
      })
      .eq('id', task.entity_id);

    // Schedule next maintenance (create recurring tasks)
    if (task.name === 'Quarterly Inspection') {
      await this.scheduleNextMaintenance(ctx, task.entity_id);
    }
  }

  private async scheduleNextMaintenance(
    ctx: TRPCContext,
    equipmentId: string
  ) {
    // Create tasks for next maintenance cycle
    // (3 months in the future)
  }
}
```

---

### Best Practices

#### ✅ DO:
1. **Keep adapters focused** - One adapter per entity type
2. **Use consistent naming** - `{Entity}Adapter` (e.g., `WarrantyClaimAdapter`)
3. **Implement proper error handling** - Always catch and log errors in adapter methods
4. **Write comprehensive tests** - Test all lifecycle hooks (start, complete, block)
5. **Document business rules** - Comment complex logic in adapter code
6. **Use transaction** - Wrap multi-step operations in database transactions
7. **Emit events** - Use event bus for cross-entity notifications

#### ❌ DON'T:
1. **Don't modify core task logic** - Keep business logic in adapters, not in `TaskService`
2. **Don't create tight coupling** - Adapters should not call other adapters directly
3. **Don't skip validation** - Always validate entity state before task operations
4. **Don't forget permissions** - Check user roles in adapter methods if needed
5. **Don't ignore idempotency** - Task completion should be safe to call multiple times
6. **Don't hardcode IDs** - Use lookups and references instead of hardcoded UUIDs

---

### Common Pitfalls & Solutions

#### Pitfall 1: Circular Dependencies
**Problem:** Task completion triggers create new tasks, which trigger completion again.

**Solution:**
```typescript
async onTaskComplete(ctx: TRPCContext, taskId: string) {
  // Add guard clause
  const task = await this.getTask(ctx, taskId);
  if (task.metadata?.auto_created) {
    return; // Skip auto-progression for auto-created tasks
  }

  // Proceed with normal logic
}
```

#### Pitfall 2: Race Conditions
**Problem:** Multiple tasks complete simultaneously, causing duplicate status updates.

**Solution:**
```typescript
async onTaskComplete(ctx: TRPCContext, taskId: string) {
  // Use database-level locking
  const { data: entity } = await ctx.supabaseAdmin
    .from('warranty_claims')
    .select('*')
    .eq('id', entityId)
    .single()
    .for('UPDATE'); // PostgreSQL row-level lock

  // Safe to proceed
}
```

#### Pitfall 3: Performance Issues with Many Tasks
**Problem:** Checking task completion becomes slow with 100+ tasks per entity.

**Solution:**
```typescript
// Use database aggregation instead of loading all tasks
const { count } = await ctx.supabaseAdmin
  .from('entity_tasks')
  .select('*', { count: 'exact', head: true })
  .eq('entity_id', entityId)
  .eq('is_required', true)
  .neq('status', 'completed');

const allComplete = count === 0;
```

---

### Testing Checklist

When adding a new entity adapter, verify:

- [ ] Entity type added to database ENUM
- [ ] Adapter class implements all required methods
- [ ] Adapter registered in `EntityAdapterRegistry`
- [ ] Workflow template created in database
- [ ] Tasks auto-create when entity is created
- [ ] Task completion triggers correct entity status change
- [ ] Task blocking works correctly
- [ ] Entity context displays properly in dashboard
- [ ] Permissions enforced correctly
- [ ] Integration tests pass
- [ ] Load testing with 100+ tasks per entity
- [ ] Error scenarios handled gracefully

---

### Performance Considerations

**Optimization strategies for high-volume entity types:**

1. **Batch task creation**
   ```typescript
   // Instead of creating tasks one-by-one
   await ctx.supabaseAdmin
     .from('entity_tasks')
     .insert(tasks); // Single batch insert
   ```

2. **Cache entity context**
   ```typescript
   // Use Redis to cache entity metadata
   const cached = await redis.get(`entity:${entityId}`);
   if (cached) return JSON.parse(cached);
   ```

3. **Use materialized views**
   ```sql
   CREATE MATERIALIZED VIEW entity_task_progress AS
   SELECT
     entity_id,
     entity_type,
     COUNT(*) as total_tasks,
     COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks
   FROM entity_tasks
   GROUP BY entity_id, entity_type;
   ```

---

### Migration Path for Existing Features

If you already have a document type WITHOUT tasks (e.g., existing transfer approvals), here's how to migrate:

#### Before (Manual Approval):
```typescript
// Manual button click to approve
await updateTransfer({ id, status: 'approved' });
```

#### After (Task-Based Approval):
```typescript
// 1. One-time migration: Create tasks for existing transfers
const pendingTransfers = await getAllPendingTransfers();
for (const transfer of pendingTransfers) {
  await createTasksFromWorkflow(
    ctx,
    transfer.id,
    'transfer_approval_workflow_id'
  );
}

// 2. New transfers auto-create tasks
// 3. Completing approval task → auto-updates transfer status
```

**Migration script template available in:** `docs/migrations/add-tasks-to-existing-entity.sql`

---

### Future-Proofing

The system is designed to support future enhancements:

1. **Workflow versioning** - Track changes to workflows over time
2. **Conditional branching** - Tasks that only appear based on conditions
3. **Parallel task execution** - Multiple tasks can be done simultaneously
4. **Recurring workflows** - For maintenance and periodic tasks
5. **Cross-entity tasks** - Tasks that affect multiple entities
6. **External integrations** - Tasks that call third-party APIs

These features can be added **without changing the core schema**, only by extending adapter capabilities.

---

## Appendices

### Appendix A: Detailed Technical Architecture
*See: `/docs/architecture/polymorphic-task-system.md`*

### Appendix B: Database Schema DDL
*See: `/docs/schema/entity-tasks-ddl.sql`*

### Appendix C: API Endpoint Specifications
*See: `/docs/api/task-endpoints.yaml`*

### Appendix D: UI Mockups & Wireframes
*See: `/docs/design/task-dashboard-mockups.fig`*

### Appendix E: Test Plan
*See: `/docs/qa/task-system-test-plan.md`*

### Appendix F: Security Review Checklist
*See: `/docs/security/task-system-review.md`*

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-XX | BMad Orchestrator | Initial draft |
| | | | |

**Distribution List:**
- Executive Sponsor
- Engineering Manager
- Operations Manager
- Finance Manager
- Project Manager
- Development Team
- QA Team

---

**END OF IMPLEMENTATION PLAN**
