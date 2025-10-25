# Production Deployment Checklist - Phase 2
## Service Center Phase 2 - Workflow, Warranty & Warehouse

**Epic:** EPIC-01 - Service Center Phase 2
**Story:** 1.20 - Production Deployment and Monitoring Setup
**Last Updated:** 2025-10-24

---

## Pre-Deployment Checklist

### 1. Integration Verification (Stories 1.1-1.19)

**Phase 1: Foundation (Stories 1.1-1.3)** ✅
- [ ] Story 1.1: Foundation Setup complete
  - [ ] Database tables created (task_types, task_templates, etc.)
  - [ ] RLS policies applied
  - [ ] Type definitions generated
- [ ] Story 1.2: Task Template Management working
  - [ ] Templates can be created/edited
  - [ ] Template tasks can be added
  - [ ] Service types assigned correctly
- [ ] Story 1.3: Task Execution UI functional
  - [ ] My Tasks page displays assigned tasks
  - [ ] Tasks can be started/completed
  - [ ] Task notes can be added

**Phase 2: Core Workflow (Stories 1.4-1.5)** ✅
- [ ] Story 1.4: Task Execution complete
  - [ ] Task status updates working
  - [ ] Task completion requires notes
  - [ ] Real-time task updates functioning
- [ ] Story 1.5: Task Dependencies working
  - [ ] Sequence enforcement (strict/flexible modes)
  - [ ] Dependency validation
  - [ ] Warning system for flexible mode

**Phase 3: Warehouse Foundation (Stories 1.6-1.7)** ✅
- [ ] Story 1.6: Warehouse system setup
  - [ ] Physical warehouses can be created
  - [ ] Virtual warehouses auto-created
  - [ ] Warehouse types working correctly
- [ ] Story 1.7: Product tracking functional
  - [ ] Physical products can be registered
  - [ ] Serial number tracking working
  - [ ] Product-warehouse linkage correct

**Phase 4: Warehouse Operations (Stories 1.8-1.10)** ✅
- [ ] Story 1.8: Serial Verification working
  - [ ] Serial number verification during ticket creation
  - [ ] Stock movements recorded
  - [ ] Audit trail complete
- [ ] Story 1.9: Stock Levels accurate
  - [ ] Materialized view refreshing correctly
  - [ ] Low stock alerts triggering
  - [ ] Stock level calculations correct
- [ ] Story 1.10: RMA Operations functional
  - [ ] RMA batches can be created
  - [ ] Product movement to supplier warehouse
  - [ ] RMA status tracking working

**Phase 5: Public Portal (Stories 1.11-1.14)** ✅
- [ ] Story 1.11: Public Service Request Portal working
  - [ ] Anonymous request submission
  - [ ] Rate limiting active (10 requests/hour/IP)
  - [ ] Tracking token generation
- [ ] Story 1.12: Request Tracking functional
  - [ ] Public tracking page accessible
  - [ ] Status updates displayed
  - [ ] No authentication required
- [ ] Story 1.13: Staff Request Management working
  - [ ] Staff can view/manage requests
  - [ ] Conversion to tickets functional
  - [ ] Status updates synchronized
- [ ] Story 1.14: Delivery Confirmation working
  - [ ] Delivery method tracking
  - [ ] Delivery confirmation updates ticket
  - [ ] Customer signature capture

**Phase 6: Enhanced Features (Stories 1.15-1.17)** ✅
- [ ] Story 1.15: Email Notification System working
  - [ ] Emails sent on status changes
  - [ ] Admin log page accessible
  - [ ] Unsubscribe functionality working
  - [ ] Rate limiting (100 emails/24h/customer)
- [ ] Story 1.16: Manager Dashboard functional
  - [ ] Task progress metrics displaying
  - [ ] Workload distribution visible
  - [ ] Blocked task alerts working
- [ ] Story 1.17: Dynamic Template Switching working
  - [ ] Template can be switched mid-service
  - [ ] Completed tasks preserved
  - [ ] Audit trail recorded

**Phase 7: QA & Deployment (Stories 1.18-1.19)** ✅
- [ ] Story 1.18: Integration Testing complete
  - [ ] Test plan executed
  - [ ] 137+ test cases passed
  - [ ] Critical bugs resolved
- [ ] Story 1.19: Documentation complete
  - [ ] User guides created (Admin, Manager, Technician, Reception)
  - [ ] Feature documentation available
  - [ ] API documentation complete
  - [ ] Deployment guide ready

---

### 2. Database Backup

**Before ANY deployment operations:**
- [ ] Create full database backup
  ```bash
  # Backup command
  pnpx supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql
  ```
- [ ] Verify backup file created successfully
- [ ] Test backup restore on staging (if available)
- [ ] Store backup in secure location
- [ ] Document backup location and timestamp
- [ ] Backup retention: Keep last 7 daily backups

**Backup Verification:**
- [ ] Backup file size > 0 bytes
- [ ] Backup contains all Phase 2 tables
- [ ] Backup SQL syntax is valid

---

### 3. Migration Testing

**Staging Environment (if available):**
- [ ] Run all migrations on staging database
- [ ] Verify no errors in migration execution
- [ ] Check all tables created correctly
- [ ] Verify RLS policies applied
- [ ] Test data integrity after migration
- [ ] Verify triggers and functions working
- [ ] Check materialized views refreshing

**Migration Checklist:**
- [ ] All Phase 2 migrations present in `supabase/migrations/`
- [ ] Migrations are in correct sequential order
- [ ] No migration conflicts with Phase 1
- [ ] DOWN migrations available for rollback
- [ ] Migration execution time documented

---

### 4. Rollback Plan

**Rollback Documentation:**
- [ ] Rollback procedures documented (see ROLLBACK-PROCEDURES.md)
- [ ] Team trained on rollback process
- [ ] Rollback scripts tested on staging
- [ ] Maximum rollback time: 15 minutes
- [ ] Rollback decision criteria defined
- [ ] Rollback responsibility assigned

**Rollback Triggers:**
- Database migration failure
- Critical application errors
- Data corruption detected
- System unavailable > 5 minutes
- More than 3 critical bugs in first hour

---

### 5. Team Notification

**Communication Plan:**
- [ ] Deployment window scheduled (low-traffic period)
- [ ] All team members notified 48 hours in advance
- [ ] Deployment window: Date/Time specified
- [ ] Expected downtime communicated (if any)
- [ ] Post-deployment tasks assigned
- [ ] Emergency contact list updated

**Notification Channels:**
- [ ] Email sent to all staff
- [ ] Team meeting held to discuss deployment
- [ ] Internal chat/Slack announcement
- [ ] Deployment calendar event created

**Team Roles:**
- [ ] Deployment Lead assigned
- [ ] Database Administrator assigned
- [ ] Application Administrator assigned
- [ ] QA Lead assigned
- [ ] Support Lead assigned

---

### 6. Environment Validation

**Production Environment:**
- [ ] Node.js version: 18.17+ installed
- [ ] pnpm version: 8.0+ installed
- [ ] All environment variables set (see .env.example)
- [ ] Supabase project created and configured
- [ ] Database connection verified
- [ ] Storage buckets created
- [ ] SSL certificates valid
- [ ] Domain DNS configured

**Required Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=<production_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<production_service_role_key>
SETUP_PASSWORD=<secure_password>
ADMIN_EMAIL=<admin_email>
ADMIN_PASSWORD=<secure_admin_password>
ADMIN_NAME=<admin_name>
```

- [ ] All environment variables validated
- [ ] No development values in production .env
- [ ] Secrets stored securely (not in version control)

---

### 7. Application Build

**Build Verification:**
- [ ] Run `pnpm build` locally without errors
- [ ] No TypeScript compilation errors
- [ ] No linting errors
- [ ] Build output size reasonable
- [ ] All pages compile successfully
- [ ] tRPC routes registered correctly

**Build Artifacts:**
- [ ] `.next/` directory created
- [ ] Static files generated
- [ ] Server functions compiled
- [ ] Build size < 50MB

---

### 8. Security Checklist

**Authentication & Authorization:**
- [ ] RLS policies active on all tables
- [ ] Role-based access control working
- [ ] Session management secure
- [ ] Password requirements enforced

**API Security:**
- [ ] Rate limiting active on public endpoints
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified

**Data Security:**
- [ ] Sensitive data encrypted at rest
- [ ] No secrets in client-side code
- [ ] Audit trail enabled for critical operations
- [ ] Backup encryption enabled

---

### 9. Performance Baseline

**Metrics to Record (for comparison after deployment):**
- [ ] Average page load time: ___ms
- [ ] API response time (P95): ___ms
- [ ] Database query time (P95): ___ms
- [ ] Active user count: ___
- [ ] Daily ticket volume: ___
- [ ] Email delivery rate: ___%

---

### 10. Monitoring Setup (Pre-Deployment)

**Supabase Configuration:**
- [ ] Logflare logging enabled
- [ ] Error alerts configured
- [ ] Performance monitoring active
- [ ] Database query logging enabled

**Alert Configuration:**
- [ ] Database error alerts
- [ ] API failure alerts
- [ ] Email failure alerts
- [ ] Rate limit breach alerts
- [ ] High latency alerts (>500ms)

**Monitoring Dashboard:**
- [ ] Supabase Studio dashboard configured
- [ ] Key metrics visible
- [ ] Alert history accessible
- [ ] Team has dashboard access

---

### 11. Smoke Test Plan

**Critical Path Testing (to run immediately after deployment):**
1. **Authentication:**
   - [ ] Admin can log in
   - [ ] Manager can log in
   - [ ] Technician can log in
   - [ ] Reception can log in

2. **Ticket Management:**
   - [ ] Create new ticket
   - [ ] Assign task to technician
   - [ ] Complete task
   - [ ] Update ticket status

3. **Task Workflow:**
   - [ ] View My Tasks page
   - [ ] Start task
   - [ ] Add task notes
   - [ ] Complete task
   - [ ] Verify task sequence enforcement

4. **Public Portal:**
   - [ ] Submit service request
   - [ ] Receive tracking token
   - [ ] Track request status
   - [ ] Convert request to ticket

5. **Email Notifications:**
   - [ ] Request submitted email sent
   - [ ] Ticket created email sent
   - [ ] View email log in admin panel
   - [ ] Verify unsubscribe link works

6. **Warehouse Operations:**
   - [ ] Register physical product
   - [ ] View stock levels
   - [ ] Create RMA batch
   - [ ] Verify stock movements

7. **Manager Dashboard:**
   - [ ] View task progress metrics
   - [ ] View workload distribution
   - [ ] View blocked tasks

8. **Dynamic Template Switching:**
   - [ ] Switch template mid-service
   - [ ] Verify completed tasks preserved
   - [ ] Check audit trail

---

### 12. Business Goals Verification

**Phase 2 Business Goals:**
- [ ] **G1**: Task workflow reduces errors
  - Metric: Task completion rate > 95%
- [ ] **G2**: Technician onboarding faster
  - Metric: Time to first completed task < 2 hours
- [ ] **G3**: Warranty verification accurate
  - Metric: Serial verification success rate > 98%
- [ ] **G4**: Inventory stockouts reduced
  - Metric: Low stock alert response time < 24 hours
- [ ] **G5**: 24/7 self-service enabled
  - Metric: Public portal available 24/7, uptime > 99.5%
- [ ] **G6**: Task-level visibility
  - Metric: Manager dashboard usage > 5 views/day
- [ ] **G7**: RMA workflow established
  - Metric: RMA batch creation > 1 per week

---

### 13. Documentation Review

**Required Documentation:**
- [ ] User guides available and accessible
- [ ] Feature documentation complete
- [ ] API documentation up-to-date
- [ ] Deployment guide reviewed
- [ ] Rollback procedures documented
- [ ] Troubleshooting guide available
- [ ] FAQ document complete
- [ ] Quick reference cards printed

---

### 14. Training Verification

**Staff Training:**
- [ ] Admin training completed
- [ ] Manager training completed
- [ ] Technician training completed
- [ ] Reception training completed
- [ ] Training materials distributed
- [ ] Training quiz/assessment passed
- [ ] Hands-on practice session conducted

---

### 15. Final Sign-Off

**Deployment Approval:**
- [ ] Technical Lead sign-off: _________________ Date: _____
- [ ] Product Manager sign-off: _________________ Date: _____
- [ ] QA Lead sign-off: _________________ Date: _____
- [ ] System Administrator sign-off: _________________ Date: _____

**Deployment Window:**
- [ ] Scheduled Date/Time: _________________________
- [ ] Deployment Lead: _________________________
- [ ] Backup Administrator: _________________________
- [ ] On-call Support: _________________________

---

## Deployment Day Checklist

### Pre-Deployment (1 hour before)
- [ ] Final team notification sent
- [ ] Backup created and verified
- [ ] Rollback plan reviewed
- [ ] Monitoring dashboard open
- [ ] Support team on standby

### During Deployment
- [ ] Apply database migrations
- [ ] Deploy application
- [ ] Verify Supabase services
- [ ] Run smoke tests
- [ ] Monitor for errors

### Post-Deployment (first hour)
- [ ] All smoke tests passed
- [ ] No critical errors in logs
- [ ] Performance metrics acceptable
- [ ] Team notified of successful deployment
- [ ] Enable public portal (if applicable)

### Post-Deployment (first 24 hours)
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Address any issues promptly
- [ ] Update documentation if needed

---

## Notes

- **Deployment Window:** Schedule during low-traffic hours (e.g., late evening or weekend)
- **Expected Downtime:** Aim for zero downtime; plan for worst case 15 minutes
- **Rollback Decision Time:** Maximum 30 minutes to decide on rollback
- **Support Availability:** 24-hour on-call support for first 3 days post-deployment
- **Phased Rollout:** Enable staff features first, public portal 24 hours later if stable

---

## Checklist Completion

**Pre-Deployment Checklist Complete:** [ ] Yes [ ] No

**Deployment Approved:** [ ] Yes [ ] No

**Ready for Production:** [ ] Yes [ ] No

**If NO, list blockers:**
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Next Review:** Before deployment
