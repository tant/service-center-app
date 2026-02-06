# Docker Deployment Checklist

**Project**: Service Center App
**Created**: 2026-02-06
**Status**: In Progress

---

## 📋 Phase 1: Critical Fixes (REQUIRED)

**Timeline**: 1 hour | **Priority**: 🔴 HIGH

- [ ] **Task 1.1**: Enable Standalone Output
  - [ ] Edit `next.config.ts` line 16
  - [ ] Uncomment: `output: "standalone"`
  - [ ] Test: `docker compose build app`
  - [ ] Verify: Check image size reduced
  - **Time**: 5 min | **Assigned**: _______

- [ ] **Task 1.2**: Verify Health Endpoint
  - [ ] Check if `src/app/api/health/route.ts` exists
  - [ ] If not, create the file with status check
  - [ ] Test: `curl http://localhost:3025/api/health`
  - [ ] Verify: Returns `{"status":"ok"}`
  - **Time**: 10 min | **Assigned**: _______

- [ ] **Task 1.3**: Full Deployment Test
  - [ ] Run: `./docker/scripts/deploy.sh`
  - [ ] Select: Option 1 (Complete fresh deployment)
  - [ ] Verify: All 14+ services start successfully
  - [ ] Verify: Schema applies without errors
  - [ ] Verify: Can access http://localhost:3025/setup
  - [ ] Test: Create admin account and login
  - **Time**: 30 min | **Assigned**: _______

**Phase 1 Complete**: ☐ YES | **Date**: ___/___/___

---

## 🔧 Phase 2: Production Hardening (RECOMMENDED)

**Timeline**: 2-3 hours | **Priority**: 🟡 MEDIUM

- [ ] **Task 2.1**: Add Resource Limits
  - [ ] Define resource allocation (see recommendations below)
  - [ ] Update `docker-compose.yml` with deploy.resources
  - [ ] Test with: `docker compose config`
  - [ ] Deploy and monitor: `docker compose stats`
  - [ ] Adjust limits based on actual usage
  - **Time**: 30 min | **Assigned**: _______

  **Recommended Limits** (8GB VPS):
  ```yaml
  db: 3GB RAM, 1.5 CPUs
  app: 2GB RAM, 1.0 CPU
  kong: 512MB RAM, 0.25 CPU
  storage: 512MB RAM, 0.25 CPU
  auth: 256MB RAM, 0.25 CPU
  realtime: 256MB RAM, 0.25 CPU
  ```

- [ ] **Task 2.2**: Improve Error Handling
  - [ ] Add `restart: unless-stopped` to all services
  - [ ] Review health check intervals
  - [ ] Add startup probes where needed (optional)
  - [ ] Test failure scenarios (kill containers)
  - **Time**: 30 min | **Assigned**: _______

- [ ] **Task 2.3**: Security Review
  - [ ] Generate new secrets: `openssl rand -hex 32`
  - [ ] Update all passwords in `.env`
  - [ ] Regenerate API keys: `node docker/scripts/generate-keys.js`
  - [ ] Review exposed ports (only 3025, 8000, 3000)
  - [ ] Set proper file permissions: `chmod 600 .env`
  - [ ] Verify RLS policies in database
  - **Time**: 45 min | **Assigned**: _______

- [ ] **Task 2.4**: Documentation Update
  - [ ] Document deployed instance details
  - [ ] Create recovery procedures
  - [ ] Document custom configurations
  - [ ] Update runbook with actual URLs/credentials
  - **Time**: 30 min | **Assigned**: _______

**Phase 2 Complete**: ☐ YES | **Date**: ___/___/___

---

## 📊 Phase 3: Observability (OPTIONAL)

**Timeline**: 4-6 hours | **Priority**: 🟢 LOW

- [ ] **Task 3.1**: Monitoring Stack
  - [ ] Create `docker-compose.monitoring.yml`
  - [ ] Add Prometheus service
  - [ ] Add Grafana service
  - [ ] Add node-exporter for host metrics
  - [ ] Import dashboards for PostgreSQL, Next.js
  - [ ] Configure alerting rules
  - [ ] Test: Access http://localhost:3001
  - **Time**: 3 hours | **Assigned**: _______

- [ ] **Task 3.2**: Centralized Logging
  - [ ] Review existing Vector configuration
  - [ ] Configure log retention (default 7 days)
  - [ ] Add log parsing rules
  - [ ] Setup log-based alerts (optional)
  - [ ] Test log aggregation
  - **Time**: 2 hours | **Assigned**: _______

- [ ] **Task 3.3**: Backup Automation
  - [ ] Test manual backup: `./docker/scripts/backup.sh`
  - [ ] Create cron job for daily backups
  - [ ] Setup healthchecks.io monitoring (optional)
  - [ ] Configure backup retention (7-30 days)
  - [ ] Test restore procedure
  - [ ] Document backup locations
  - **Time**: 1 hour | **Assigned**: _______

**Phase 3 Complete**: ☐ YES | **Date**: ___/___/___

---

## 📚 Phase 4: Documentation (OPTIONAL)

**Timeline**: 4-6 hours | **Priority**: 🟢 LOW

- [ ] **Task 4.1**: Deployment Guides
  - [ ] Quick start guide
  - [ ] Production deployment guide
  - [ ] Multi-instance setup guide
  - [ ] Migration guide (dev → staging → prod)
  - **Time**: 2 hours | **Assigned**: _______

- [ ] **Task 4.2**: Operational Guides
  - [ ] Troubleshooting guide (common issues)
  - [ ] Backup & restore procedures
  - [ ] Scaling guide (vertical & horizontal)
  - [ ] Performance tuning guide
  - **Time**: 2 hours | **Assigned**: _______

- [ ] **Task 4.3**: Runbooks
  - [ ] Incident response procedures
  - [ ] Disaster recovery plan
  - [ ] Security audit checklist
  - [ ] Maintenance calendar template
  - **Time**: 2 hours | **Assigned**: _______

**Phase 4 Complete**: ☐ YES | **Date**: ___/___/___

---

## 🎯 Production Readiness Checklist

### Infrastructure ✅
- [ ] All services start successfully
- [ ] Health checks passing for all services
- [ ] Database schema applied correctly
- [ ] Storage buckets configured
- [ ] Network connectivity verified
- [ ] Resource limits configured
- [ ] Restart policies set

### Security 🔐
- [ ] All default secrets rotated
- [ ] Strong passwords generated (32+ chars)
- [ ] `.env` file secured (chmod 600)
- [ ] RLS policies verified
- [ ] Exposed ports documented
- [ ] Firewall rules configured (if self-hosted)
- [ ] SSL/TLS configured (Cloudflare or Nginx)

### Backup & Recovery 💾
- [ ] Backup script tested
- [ ] Automated backups scheduled
- [ ] Restore procedure tested
- [ ] Backup retention policy set
- [ ] Off-site backup configured (optional)
- [ ] Recovery runbook created

### Monitoring & Alerts 📈
- [ ] Log aggregation working
- [ ] Health checks configured
- [ ] Resource usage monitored
- [ ] Error alerts configured (optional)
- [ ] Uptime monitoring setup (optional)
- [ ] Dashboard created (optional)

### Documentation 📖
- [ ] Deployment steps documented
- [ ] Access credentials saved securely
- [ ] Troubleshooting guide created
- [ ] Recovery procedures documented
- [ ] Contact information listed
- [ ] Change log initialized

### Testing ✔️
- [ ] Fresh deployment tested
- [ ] Admin account creation tested
- [ ] Basic CRUD operations tested
- [ ] File upload tested
- [ ] Authentication tested
- [ ] Authorization (roles) tested
- [ ] Performance under load tested (optional)

---

## 📅 Timeline Summary

| Phase | Tasks | Time | Priority | Status |
|-------|-------|------|----------|--------|
| Phase 1 | Critical Fixes | 1h | 🔴 HIGH | ☐ |
| Phase 2 | Production Hardening | 2-3h | 🟡 MEDIUM | ☐ |
| Phase 3 | Observability | 4-6h | 🟢 LOW | ☐ |
| Phase 4 | Documentation | 4-6h | 🟢 LOW | ☐ |
| **TOTAL** | **All Phases** | **11-16h** | - | **☐** |

**Minimum for Production**: Phase 1 + Phase 2 = **3-4 hours**

---

## 🚀 Quick Deployment Path

**For immediate production deployment, follow this path:**

### Day 1: Critical Setup (1 hour)
```bash
☐ 1. Fix next.config.ts (5 min)
☐ 2. Verify/create health endpoint (10 min)
☐ 3. Run full deployment test (30 min)
☐ 4. Verify basic functionality (15 min)
```

### Day 1-2: Hardening (2-3 hours)
```bash
☐ 5. Add resource limits (30 min)
☐ 6. Configure restart policies (30 min)
☐ 7. Security review & rotate secrets (45 min)
☐ 8. Document everything (30 min)
☐ 9. Setup automated backups (30 min)
```

### Week 1: Enhancement (4-6 hours, optional)
```bash
☐ 10. Setup monitoring (3 hours)
☐ 11. Configure alerting (2 hours)
☐ 12. Create runbooks (2 hours)
```

---

## 📝 Notes & Issues

### Blockers
```
Date: ___/___/___
Issue: _________________________________________________
Status: ☐ OPEN | ☐ IN PROGRESS | ☐ RESOLVED
Notes: _________________________________________________
```

### Decisions Made
```
Date: ___/___/___
Decision: ______________________________________________
Reason: ________________________________________________
Impact: ________________________________________________
```

### Custom Configuration
```
Configuration: _________________________________________
Value: _________________________________________________
Reason: ________________________________________________
```

---

## ✅ Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | _______ | ___/___/___ | _______ |
| Tech Lead | _______ | ___/___/___ | _______ |
| DevOps | _______ | ___/___/___ | _______ |
| QA | _______ | ___/___/___ | _______ |

---

## 📞 Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Primary | _______ | ____________ | ____________ |
| Backup | _______ | ____________ | ____________ |
| Database | _______ | ____________ | ____________ |

---

**Document Version**: 1.0
**Last Updated**: 2026-02-06
**Next Review**: ___/___/___
