# Rollback Procedures - Phase 2 Deployment
## Service Center Phase 2 - Workflow, Warranty & Warehouse

**Epic:** EPIC-01 - Service Center Phase 2
**Story:** 1.20 - Production Deployment and Monitoring Setup
**Last Updated:** 2025-10-24
**Maximum Rollback Time:** 15 minutes

---

## Overview

This document outlines the complete rollback procedure for Phase 2 deployment. A rollback should be executed if critical issues are detected post-deployment that cannot be quickly resolved.

**Rollback Strategy:**
- Database: Restore from backup + revert migrations
- Application: Redeploy previous version
- Maximum time: 15 minutes
- Decision time: 30 minutes maximum

---

## When to Rollback

### Critical Triggers (Immediate Rollback)
1. **Database Corruption**: Data integrity compromised
2. **System Down**: Application unavailable > 5 minutes
3. **Data Loss**: User data lost or corrupted
4. **Security Breach**: Unauthorized access detected
5. **Migration Failure**: Database migration fails with errors

### Major Triggers (Rollback within 30 minutes)
1. **High Error Rate**: Error rate > 5% of requests
2. **Performance Degradation**: Response time > 3 seconds consistently
3. **Critical Feature Broken**: Core workflow non-functional
4. **Multiple Critical Bugs**: > 3 critical bugs in first hour
5. **RLS Policy Failures**: Unauthorized data access possible

### Minor Issues (Do NOT rollback)
- Single non-critical bug
- Minor UI issues
- Performance issues affecting < 10% of users
- Non-critical feature not working
- Email delivery delays

---

## Rollback Decision Process

### 1. Issue Detection
- Monitor error logs in Supabase Studio
- Check application health endpoint: `/api/health`
- Review user reports
- Monitor performance metrics

### 2. Impact Assessment (5 minutes)
```
Severity: [ ] Critical [ ] Major [ ] Minor
Users Affected: _______%
Systems Impacted: [ ] Auth [ ] Tickets [ ] Tasks [ ] Warehouse [ ] Email
Data at Risk: [ ] Yes [ ] No
Quick Fix Available: [ ] Yes [ ] No (estimated time: ____ minutes)
```

### 3. Rollback Decision (within 30 minutes)
**Decision Makers:**
- Deployment Lead (primary)
- Technical Lead (backup)
- Product Manager (business impact)

**Decision Criteria:**
- IF Critical Trigger → Immediate Rollback
- IF Major Trigger + No Quick Fix → Rollback
- IF Major Trigger + Quick Fix Available → Attempt fix (max 15 min)
- IF Minor Issue → No rollback, log for post-deployment fix

---

## Rollback Procedures

### Phase 1: Notification (1 minute)

**Immediate Communication:**
```bash
# Send alert to team
1. Post in team chat: "ROLLBACK IN PROGRESS - Do not make changes"
2. Email all stakeholders: "Phase 2 rollback initiated due to [REASON]"
3. Update status page (if available): "Service maintenance in progress"
```

**Notification Checklist:**
- [ ] Team chat notification sent
- [ ] Email notification sent
- [ ] Status page updated
- [ ] On-call support notified

---

### Phase 2: Application Rollback (3-5 minutes)

#### Option A: Vercel/Cloud Platform
```bash
# Vercel (recommended)
1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find last stable deployment (before Phase 2)
4. Click "..." menu → "Promote to Production"
5. Wait for deployment (30-60 seconds)
6. Verify deployment successful
```

#### Option B: Docker Deployment
```bash
# Stop current container
docker stop service-center-app

# Rollback to previous image
docker run -d \
  --name service-center-app \
  -p 3025:3025 \
  --env-file .env.backup \
  service-center:previous

# Verify container running
docker ps | grep service-center-app

# Check health
curl http://localhost:3025/api/health
```

#### Option C: Manual Deployment
```bash
# Navigate to project directory
cd /path/to/sevice-center

# Stash any uncommitted changes
git stash

# Checkout previous stable version
git checkout [PREVIOUS_STABLE_TAG]

# Install dependencies
pnpm install

# Build application
pnpm build

# Stop current process
pm2 stop service-center

# Start previous version
pm2 start npm --name "service-center" -- start

# Verify process running
pm2 status
```

**Application Rollback Verification:**
- [ ] Previous version deployed
- [ ] Application accessible
- [ ] Health check returns 200
- [ ] Login page loads
- [ ] Dashboard accessible

---

### Phase 3: Database Rollback (8-10 minutes)

**CRITICAL:** Database rollback is destructive. All data changes since deployment will be lost.

#### Step 3.1: Stop Application Traffic (30 seconds)
```bash
# If using load balancer, remove app from pool
# Or update DNS to maintenance page
# Or stop application to prevent database writes

# Vercel:
vercel env rm NEXT_PUBLIC_SUPABASE_URL production

# Docker:
docker stop service-center-app

# Manual:
pm2 stop service-center
```

#### Step 3.2: Create Current State Backup (2 minutes)
```bash
# Even during rollback, backup current state
pnpx supabase db dump -f backup-pre-rollback-$(date +%Y%m%d-%H%M%S).sql

# Verify backup created
ls -lh backup-pre-rollback-*.sql
```

#### Step 3.3: Restore Database from Backup (5 minutes)
```bash
# Option A: Supabase CLI (recommended)
# Restore from pre-deployment backup
pnpx supabase db reset --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
pnpx supabase db push --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" --file backup-YYYYMMDD-HHMMSS.sql

# Option B: psql command
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres < backup-YYYYMMDD-HHMMSS.sql

# Option C: Supabase Studio
1. Navigate to SQL Editor in Supabase Studio
2. Execute: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
3. Copy contents of backup SQL file
4. Execute backup SQL
5. Refresh materialized views
```

#### Step 3.4: Revert Migrations (if partial migration applied)
```bash
# If some migrations applied but not all
# Run DOWN migrations in reverse order

# Identify which migrations were applied
pnpx supabase migration list

# For each migration to revert (newest first):
# Edit migration file and add DOWN logic, then:
pnpx supabase db push --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" --file supabase/migrations/[MIGRATION_FILE_DOWN].sql
```

**Database Rollback Verification:**
- [ ] Backup file restored successfully
- [ ] Phase 2 tables removed (verify task_templates table gone)
- [ ] Phase 1 tables intact (verify service_tickets table exists)
- [ ] No migration errors in logs
- [ ] Materialized views refreshed
- [ ] RLS policies intact

#### Step 3.5: Verify Data Integrity (2 minutes)
```sql
-- Connect to database
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

-- Check table existence
\dt public.*

-- Verify critical tables exist
SELECT COUNT(*) FROM service_tickets;
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM parts;

-- Verify Phase 2 tables removed
SELECT COUNT(*) FROM task_templates; -- Should error if rollback successful

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Verify triggers
SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';
```

**Data Integrity Checks:**
- [ ] Critical Phase 1 tables exist
- [ ] Phase 2 tables removed
- [ ] RLS policies intact
- [ ] Triggers functioning
- [ ] No orphaned data

---

### Phase 4: Environment Restoration (1-2 minutes)

```bash
# Restore environment variables to pre-deployment state
cp .env.backup .env

# Verify environment variables
cat .env | grep -E "SUPABASE|SETUP"

# If using Vercel, restore production environment
vercel env pull .env.production
```

**Environment Verification:**
- [ ] Environment variables restored
- [ ] Database connection string correct
- [ ] API keys valid
- [ ] No Phase 2 feature flags enabled

---

### Phase 5: Application Restart and Verification (2-3 minutes)

```bash
# Restart application with rolled-back code and database
# Vercel: Already restarted in Phase 2
# Docker:
docker start service-center-app

# Manual:
pm2 restart service-center

# Wait for application to fully start (30-60 seconds)
sleep 60

# Verify health
curl -f http://localhost:3025/api/health || echo "Health check failed"

# Test critical paths
curl -f http://localhost:3025/login || echo "Login page failed"
curl -f http://localhost:3025/dashboard || echo "Dashboard failed"
```

**Post-Rollback Smoke Tests:**
1. [ ] Application accessible
2. [ ] Health check passes
3. [ ] Login works (test with admin account)
4. [ ] Dashboard loads
5. [ ] Tickets page loads
6. [ ] Can create new ticket
7. [ ] Can view existing ticket
8. [ ] No Phase 2 features visible (My Tasks, Templates)

---

### Phase 6: Post-Rollback Communication (1 minute)

```bash
# Notify team of rollback completion
1. Team chat: "Rollback complete. System stable on Phase 1 version."
2. Email stakeholders: "Phase 2 rollback successful. Investigation in progress."
3. Update status page: "Service operational"
```

**Communication Checklist:**
- [ ] Team notified of rollback completion
- [ ] Stakeholders informed
- [ ] Status page updated to operational
- [ ] Post-mortem meeting scheduled

---

## Post-Rollback Actions

### Immediate (within 1 hour)
1. **Monitor System Stability**
   - Check error rates (should return to baseline)
   - Monitor performance metrics
   - Review user feedback
   - Verify no new issues introduced

2. **Preserve Evidence**
   - Save application logs from failed deployment
   - Export database query logs
   - Capture screenshots of errors
   - Save current state backup (backup-pre-rollback-*.sql)

3. **Document Incident**
   - What triggered rollback
   - Timeline of events
   - Impact assessment
   - Root cause (if known)

### Short-term (within 24 hours)
1. **Root Cause Analysis**
   - Review logs and errors
   - Identify what went wrong
   - Determine if issue was:
     - Code bug
     - Migration error
     - Configuration issue
     - Environment problem
     - User error

2. **Fix Development**
   - Create hotfix branch
   - Implement fix
   - Add tests to prevent regression
   - Test fix in staging

3. **Communication**
   - Send detailed incident report to stakeholders
   - Update team on fix progress
   - Schedule re-deployment (if applicable)

### Long-term (within 1 week)
1. **Post-Mortem Meeting**
   - Review what happened
   - Identify improvement opportunities
   - Update deployment procedures
   - Update rollback procedures
   - Improve testing processes

2. **Process Improvements**
   - Add automated checks to prevent similar issues
   - Improve monitoring/alerting
   - Enhance smoke test coverage
   - Update documentation

3. **Re-Deployment Planning**
   - Schedule new deployment window
   - Ensure all fixes tested
   - Review pre-deployment checklist
   - Conduct rehearsal (if needed)

---

## Rollback Time Estimates

| Phase | Estimated Time | Critical Path |
|-------|----------------|---------------|
| 1. Notification | 1 minute | Yes |
| 2. Application Rollback | 3-5 minutes | Yes |
| 3. Database Rollback | 8-10 minutes | Yes |
| 4. Environment Restoration | 1-2 minutes | Yes |
| 5. Application Restart | 2-3 minutes | Yes |
| 6. Post-Rollback Communication | 1 minute | No |
| **Total Critical Path** | **15-21 minutes** | - |

**Target:** Complete rollback within 15 minutes
**Maximum:** 21 minutes (worst case)

---

## Rollback Rehearsal

**Before production deployment, conduct rollback rehearsal:**

1. **Staging Environment:**
   - Deploy Phase 2 to staging
   - Create backup
   - Introduce simulated critical issue
   - Execute rollback procedure
   - Time each phase
   - Document any issues

2. **Rehearsal Checklist:**
   - [ ] Rollback procedure followed successfully
   - [ ] All commands executed without errors
   - [ ] Rollback completed within 15 minutes
   - [ ] System stable post-rollback
   - [ ] Team members know their roles
   - [ ] Documentation accurate and complete

---

## Emergency Contacts

**Rollback Team Roles:**

| Role | Primary | Backup | Phone |
|------|---------|--------|-------|
| Deployment Lead | [NAME] | [NAME] | [PHONE] |
| Database Administrator | [NAME] | [NAME] | [PHONE] |
| Application Administrator | [NAME] | [NAME] | [PHONE] |
| Communications Lead | [NAME] | [NAME] | [PHONE] |

**Escalation:**
- Primary contacts: Respond within 5 minutes
- Backup contacts: Respond within 10 minutes
- Executive escalation: If issue not resolved within 30 minutes

---

## Rollback Decision Matrix

| Scenario | Severity | Rollback Decision | Max Decision Time |
|----------|----------|-------------------|-------------------|
| Database corruption | Critical | YES - Immediate | 0 minutes |
| System unavailable >5min | Critical | YES - Immediate | 0 minutes |
| Data loss detected | Critical | YES - Immediate | 0 minutes |
| Security breach | Critical | YES - Immediate | 0 minutes |
| Migration failure | Critical | YES - Immediate | 0 minutes |
| Error rate >5% | Major | YES - within 30min | 30 minutes |
| Response time >3s | Major | YES - within 30min | 30 minutes |
| Core workflow broken | Major | YES - within 30min | 30 minutes |
| >3 critical bugs | Major | YES - within 30min | 30 minutes |
| RLS policy failure | Major | YES - within 30min | 30 minutes |
| Single non-critical bug | Minor | NO - Fix later | N/A |
| Minor UI issue | Minor | NO - Fix later | N/A |
| Email delays | Minor | NO - Fix later | N/A |

---

## Testing Rollback Procedure

**Quarterly Rollback Drill:**
To ensure team readiness, conduct rollback drill every quarter:

1. Schedule drill during low-traffic period
2. Deploy test version to staging
3. Execute full rollback procedure
4. Time each phase
5. Document lessons learned
6. Update procedures as needed

**Drill Checklist:**
- [ ] Drill scheduled and announced
- [ ] All team members participate
- [ ] Each phase timed accurately
- [ ] Issues documented
- [ ] Procedures updated
- [ ] Next drill scheduled

---

## Appendix A: Quick Reference Commands

### Application Rollback
```bash
# Vercel
vercel rollback [DEPLOYMENT_ID]

# Docker
docker stop service-center-app
docker run -d --name service-center-app service-center:previous

# Manual
git checkout [PREVIOUS_TAG]
pnpm install && pnpm build
pm2 restart service-center
```

### Database Rollback
```bash
# Backup current state
pnpx supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
psql [CONNECTION_STRING] < backup-YYYYMMDD-HHMMSS.sql

# Verify
psql [CONNECTION_STRING] -c "SELECT COUNT(*) FROM service_tickets;"
```

### Health Check
```bash
# Application health
curl http://localhost:3025/api/health

# Database connection
psql [CONNECTION_STRING] -c "SELECT 1"

# Supabase services
curl https://[PROJECT_ID].supabase.co/rest/v1/
```

---

## Appendix B: Rollback Scenarios and Solutions

### Scenario 1: Partial Migration Applied
**Problem:** Some Phase 2 migrations applied, some failed
**Solution:**
1. Don't restore from backup (would lose ALL data)
2. Write DOWN migrations for successfully applied migrations
3. Apply DOWN migrations in reverse order
4. Verify Phase 2 tables removed
5. Keep Phase 1 data intact

### Scenario 2: Application Rollback but Database Not
**Problem:** App rolled back but database still has Phase 2 schema
**Solution:**
1. Phase 1 app will error trying to access Phase 2 tables
2. Immediately proceed with database rollback (Phase 3)
3. Expected: Some errors during database rollback period
4. Verify both app and DB on Phase 1 after completion

### Scenario 3: Rollback Fails
**Problem:** Rollback procedure encounters errors
**Solution:**
1. Don't panic - original backup is safe
2. Document error messages
3. Try alternative rollback method (Option B or C)
4. If still failing, engage vendor support (Supabase, Vercel)
5. Worst case: Restore to completely fresh environment from backup

### Scenario 4: Data Created During Phase 2
**Problem:** Users created data (tickets, tasks) during Phase 2 deployment
**Solution:**
1. Accept data loss is unavoidable in rollback
2. Export Phase 2 data before database rollback:
   ```sql
   COPY service_ticket_tasks TO '/tmp/tasks_backup.csv' CSV HEADER;
   ```
3. Manually migrate critical data to Phase 1 schema if needed
4. Inform affected users of data loss

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Next Review:** Before each deployment
**Last Tested:** [DATE OF LAST DRILL]
