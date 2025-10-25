# Admin Quick Reference Card

**Version:** 1.0 | **Role:** Administrator | **Updated:** 2025-10-24

---

## Your Main Responsibilities

- Complete system oversight and control
- Manage user accounts and permissions
- Configure system settings
- Handle critical operations and escalations
- Ensure data integrity and security
- Perform system setup and maintenance
- All Manager, Technician, and Reception capabilities

---

## System Administration

### Initial System Setup

**Page:** `/setup`

**First Time Setup:**
1. Navigate to `/setup` page
2. Enter `SETUP_PASSWORD` from environment variables
3. System creates admin account automatically
4. Credentials from `.env` file:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ADMIN_NAME`

**Setup Behavior:**
- **First Run:** Creates new admin user + profile
- **Password Reset:** If user exists, updates password
- **Profile Repair:** If auth exists without profile, creates profile
- **Orphan Cleanup:** If profile exists without auth, removes and recreates

**Required Environment Variables:**
```bash
SETUP_PASSWORD=your_setup_password
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password
ADMIN_NAME=Administrator
```

---

### Manage Team Members

**Page:** `/team`

#### View All Staff

**Information Shown:**
- Full name
- Email address
- Role (Admin, Manager, Technician, Reception)
- Account status (active/inactive)
- Creation date
- Last login

#### Add New Staff Member

1. Click "+ Add Team Member" button
2. Fill required fields:
   - Full Name (required)
   - Email (required, unique)
   - Password (required, min 8 characters)
   - Role (required):
     - Admin: Full access
     - Manager: Manage operations
     - Technician: Work on tickets
     - Reception: Create tickets, manage customers
3. Click "Create User"

**Result:**
- Auth account created in Supabase
- Profile created with assigned role
- User can log in immediately
- Receives welcome email (if configured)

#### Edit Team Member

**What You Can Update:**
- Full name
- Email address
- Role assignment
- Password (reset)
- Active/inactive status

**How:**
1. Find user in team list
2. Click "Edit" button
3. Update fields
4. Save changes

**Role Change Impact:**
- Takes effect immediately
- User must re-login to see new permissions
- Access level changes automatically

#### Delete Team Member

**When to Delete:**
- Employee terminated
- Account created in error
- Duplicate account
- Security concern

**How:**
1. Find user in team list
2. Click "Delete" button
3. Confirm deletion

**Warning:**
- Cannot undo
- User loses all access immediately
- Profile data preserved in tickets (audit trail)

#### Reset Password

**Method 1: Via Team Page**
1. Edit user
2. Enter new password
3. Save

**Method 2: Via Setup Page**
- Re-run setup with new admin password
- Only works for admin account

---

## Advanced Operations

### System Settings

**Page:** `/setting`

**Configuration Options:**
- Company information
- Business rules
- Tax rates
- Currency settings
- Regional settings
- Email templates (future)
- Notification preferences (future)

**Current Status:** Basic structure, limited functionality

### Application Settings

**Page:** `/app-setting`

**Developer Options:**
- API configurations
- Integration settings
- Database connections
- Backup schedules (future)
- Logging levels (future)
- Feature flags (future)

**Current Status:** Basic structure, limited functionality

---

## Data Management

### Database Operations

**Direct Database Access:**
- Via Supabase Dashboard: `http://localhost:54323`
- SQL Editor for complex queries
- Table Editor for quick edits
- View logs and performance

**Common Admin Queries:**

**View All Users:**
```sql
SELECT id, email, created_at FROM auth.users;
```

**View All Profiles:**
```sql
SELECT * FROM profiles ORDER BY created_at DESC;
```

**Check Orphaned Records:**
```sql
-- Profiles without auth users
SELECT p.* FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Auth users without profiles
SELECT u.id, u.email FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

**Ticket Statistics:**
```sql
SELECT status, COUNT(*) as count
FROM service_tickets
GROUP BY status;
```

### Backup and Recovery

**Supabase CLI Commands:**

```bash
# Export database schema
pnpx supabase db dump -f backup_schema.sql --schema public

# Export data only
pnpx supabase db dump -f backup_data.sql --data-only

# Full backup
pnpx supabase db dump -f backup_full.sql

# Restore from backup
psql -h localhost -U postgres -f backup_full.sql
```

**Backup Schedule Recommendations:**
- Daily: Automated via cron/Task Scheduler
- Weekly: Full backup with verification
- Monthly: Archival backup to external storage
- Before major changes: Manual backup

---

## User Management

### Role Hierarchy

```
Admin (You)
  ↓
Manager
  ↓
Technician
  ↓
Reception
```

### Role Permissions Matrix

| Permission | Admin | Manager | Technician | Reception |
|------------|-------|---------|------------|-----------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ |
| Create Tickets | ✓ | ✓ | ✓ | ✓ |
| Edit Any Ticket | ✓ | ✓ | Own | No |
| Delete Tickets | ✓ | ✓ | No | No |
| Manage Customers | ✓ | ✓ | View | ✓ |
| Manage Products | ✓ | ✓ | View | View |
| Manage Parts | ✓ | ✓ | View | View |
| Manage Brands | ✓ | ✓ | ✓ | View |
| View Reports | ✓ | ✓ | Limited | No |
| Manage Team | ✓ | No | No | No |
| System Settings | ✓ | No | No | No |
| Delete Parts | ✓ | ✓ | No | No |
| Delete Brands | ✓ | ✓ | No | No |

### Row Level Security (RLS)

**Database-Level Enforcement:**
- All tables have RLS policies
- Helper functions: `is_admin()`, `is_admin_or_manager()`
- Cannot be bypassed via UI
- API uses service role (bypasses RLS for server operations)

**Key RLS Policies:**

**Profiles:**
- All users can view all profiles
- Users can update own profile
- Only admins can delete profiles

**Service Tickets:**
- All can view
- Reception+ can create
- Manager+ can edit any ticket
- Admin/Manager can delete
- Completed/cancelled tickets locked

**Products/Parts:**
- All can view
- Manager+ can create/edit
- Admin/Manager can delete

**Customers:**
- All can view
- Reception+ can create/edit
- Manager+ can delete

---

## Security Management

### Password Policies

**Requirements:**
- Minimum 8 characters
- Must contain mix of characters (enforced by Supabase)
- No maximum length
- Expires: Never (manual reset required)

**Best Practices:**
- Force password change on first login (future)
- Require complex passwords for admins
- Regular password audits
- Monitor failed login attempts

### Session Management

**Session Settings:**
- JWT expiry: 1 hour (default)
- Refresh token: 7 days
- Auto-refresh: Enabled
- Concurrent sessions: Allowed

**Security Measures:**
- HttpOnly cookies (XSS protection)
- SameSite=Lax (CSRF protection)
- Secure flag in production (HTTPS only)
- Token rotation on refresh

### Access Logs

**Monitor User Activity:**

**Via Supabase Dashboard:**
1. Go to Authentication > Users
2. Click user email
3. View "Sessions" tab
4. See login history, IP addresses

**Via SQL:**
```sql
-- Recent logins (from audit logs if enabled)
SELECT * FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## Troubleshooting

### Common Issues

#### "User can't log in"

**Checklist:**
1. Verify account exists in `/team`
2. Check account is active (not deleted)
3. Verify password is correct (reset if needed)
4. Check Supabase auth dashboard for errors
5. Verify environment variables set correctly
6. Check browser cookies enabled

**Solution:**
- Reset password via team page
- Or re-run setup for admin account

#### "User has wrong permissions"

**Diagnosis:**
1. Check role in team page
2. Verify RLS policies active
3. Check database profile role field

**Solution:**
1. Edit user in team page
2. Update role
3. User must re-login

#### "Duplicate user accounts"

**Cause:**
- Email typo created second account
- Setup run multiple times

**Solution:**
1. Identify correct account
2. Delete duplicate in team page
3. Verify auth user also deleted

#### "Orphaned profile or auth record"

**Symptoms:**
- User can log in but sees errors
- Profile shows in team but can't log in

**Solution:**
- Run setup page (auto-repairs)
- Or manually fix via Supabase dashboard:
  1. Delete orphaned record
  2. Recreate user properly

#### "Cannot delete user"

**Possible Causes:**
- User has active tickets
- User created records still referenced

**Solution:**
- Reassign user's tickets to another user first
- Then delete user account

---

### Database Troubleshooting

#### "Schema migration failed"

**Diagnosis:**
```bash
pnpx supabase db diff
pnpx supabase status
```

**Solution:**
```bash
# Reset local database
pnpx supabase db reset

# Reapply migrations
pnpx supabase migration up
```

#### "RLS policies not working"

**Check:**
1. Verify policies exist in Supabase dashboard
2. Test with SQL query
3. Check helper functions defined

**Test RLS:**
```sql
-- Test as admin
SELECT is_admin(); -- Should return true for admin users

-- Test policy
SELECT * FROM service_tickets;
-- Should return results based on role
```

#### "Performance issues"

**Investigate:**
1. Check query performance in Supabase
2. Review database indexes
3. Check connection pool usage
4. Monitor slow queries

**Common Fixes:**
- Add indexes to frequently queried columns
- Optimize complex queries
- Increase connection pool size
- Add caching layer

---

## Maintenance Tasks

### Daily

**Morning Checklist (5 mins):**
- [ ] Check dashboard for system health
- [ ] Review overnight ticket activity
- [ ] Check for user access issues
- [ ] Monitor error logs (if configured)

### Weekly

**Operations Review (15 mins):**
- [ ] Review user accounts (active/inactive)
- [ ] Check database size and growth
- [ ] Review failed login attempts
- [ ] Audit recent deletions
- [ ] Check backup status
- [ ] Review system performance

### Monthly

**Deep Maintenance (30 mins):**
- [ ] Full database backup
- [ ] Review and archive old data
- [ ] Audit user permissions
- [ ] Update system documentation
- [ ] Check for software updates
- [ ] Review security logs
- [ ] Performance optimization
- [ ] Test disaster recovery

### Quarterly

**Strategic Review (1 hour):**
- [ ] Review role structure
- [ ] Update security policies
- [ ] Plan system upgrades
- [ ] Review compliance requirements
- [ ] Audit complete data flow
- [ ] Test full system restore
- [ ] Update emergency procedures

---

## Emergency Procedures

### System Down

**Immediate Actions:**
1. Check Supabase status: `pnpx supabase status`
2. Restart if needed: `pnpx supabase stop && pnpx supabase start`
3. Check environment variables
4. Review recent changes
5. Check logs for errors

**Communication:**
- Inform all staff immediately
- Post status in communication channel
- Estimate restoration time
- Update regularly

### Data Loss

**Recovery Steps:**
1. Stop all operations immediately
2. Assess extent of loss
3. Restore from most recent backup
4. Verify data integrity
5. Document incident
6. Implement prevention measures

**Backup Restoration:**
```bash
# Stop current instance
pnpx supabase stop

# Restore from backup
psql -h localhost -U postgres -f backup_file.sql

# Restart
pnpx supabase start
```

### Security Breach

**Immediate Response:**
1. **Contain:** Disable affected accounts
2. **Assess:** Determine scope of breach
3. **Secure:** Change all passwords
4. **Document:** Log all findings
5. **Notify:** Inform affected parties
6. **Review:** Update security measures

**Password Reset All Users:**
1. Go to team page
2. Edit each user
3. Set new temporary password
4. Notify users to change on login

### Database Corruption

**Recovery:**
1. Stop application access
2. Backup current state (even if corrupted)
3. Run database integrity checks
4. Restore from last known good backup
5. Reapply recent changes manually if needed
6. Test thoroughly before reopening

---

## Advanced Features

### Custom SQL Functions

**Create Helper Functions:**

```sql
-- Example: Get ticket count by status
CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS TABLE (status ticket_status, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT st.status, COUNT(*)
  FROM service_tickets st
  GROUP BY st.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Grant Access:**
```sql
GRANT EXECUTE ON FUNCTION get_ticket_stats() TO authenticated;
```

### Database Triggers

**Custom Automation:**

```sql
-- Example: Log high-value tickets
CREATE OR REPLACE FUNCTION log_high_value_tickets()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_cost > 1000 THEN
    INSERT INTO high_value_log (ticket_id, amount, created_at)
    VALUES (NEW.id, NEW.total_cost, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER high_value_ticket_trigger
AFTER INSERT OR UPDATE ON service_tickets
FOR EACH ROW EXECUTE FUNCTION log_high_value_tickets();
```

### Database Views

**Create Reporting Views:**

```sql
-- Example: Customer lifetime value
CREATE VIEW customer_lifetime_value AS
SELECT
  c.id,
  c.name,
  c.phone,
  COUNT(st.id) as ticket_count,
  SUM(st.total_cost) as total_spent
FROM customers c
LEFT JOIN service_tickets st ON c.id = st.customer_id
WHERE st.status = 'completed'
GROUP BY c.id, c.name, c.phone;
```

---

## Quick Reference Tables

### Supabase CLI Commands

| Command | Description |
|---------|-------------|
| `pnpx supabase start` | Start local Supabase |
| `pnpx supabase stop` | Stop Supabase services |
| `pnpx supabase status` | Check service status |
| `pnpx supabase db reset` | Reset database (deletes data) |
| `pnpx supabase db diff -f name` | Generate migration |
| `pnpx supabase migration up` | Apply pending migrations |
| `pnpx supabase db dump -f file.sql` | Backup database |

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | From `supabase status` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin access key | From `supabase status` |
| `SETUP_PASSWORD` | Setup page password | Your secure password |
| `ADMIN_EMAIL` | Admin account email | `admin@example.com` |
| `ADMIN_PASSWORD` | Admin account password | Secure password |
| `ADMIN_NAME` | Admin display name | `Administrator` |

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Operation completed |
| 400 | Bad Request | Check input data |
| 401 | Unauthorized | Login required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Check logs, contact support |

---

## System Monitoring

### Key Metrics to Watch

**Performance:**
- Page load times
- Database query speed
- API response times
- Error rates

**Usage:**
- Active users count
- Tickets created per day
- Database size growth
- Storage usage

**Security:**
- Failed login attempts
- Unusual access patterns
- Permission errors
- Token refresh failures

### Health Check URLs

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | API health status |
| `http://localhost:54323` | Supabase dashboard |
| `http://localhost:3025` | Application |

---

## Page URLs Reference

| Page | URL | Access Level |
|------|-----|--------------|
| Setup | `/setup` | Password-protected |
| Dashboard | `/dashboard` | All authenticated |
| Tickets | `/tickets` | All authenticated |
| Customers | `/customers` | All authenticated |
| Products | `/products` | All authenticated |
| Parts | `/parts` | Manager+ |
| Brands | `/brands` | All authenticated |
| Team | `/team` | Admin only |
| Settings | `/setting` | Admin only |
| App Settings | `/app-setting` | Admin only |
| Reports | `/report` | Manager+ |

---

## Best Practices

### Security
- Never share admin credentials
- Use strong, unique passwords
- Enable 2FA when available (future)
- Regular password audits
- Monitor access logs
- Principle of least privilege

### Data Management
- Regular backups (daily minimum)
- Test restore procedures monthly
- Document all schema changes
- Version control migrations
- Audit data quality regularly

### User Management
- Create users with appropriate roles
- Deactivate rather than delete (audit trail)
- Document role changes
- Regular permission audits
- Train users on security

### System Maintenance
- Keep software updated
- Monitor performance trends
- Regular database optimization
- Document all configurations
- Test disaster recovery

---

## Contact Information

**Technical Support:**
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- tRPC Docs: https://trpc.io/docs

**Emergency Contacts:**
- Database Admin: [Your DBA contact]
- System Administrator: [Your sysadmin]
- Security Officer: [Security contact]

---

## Notes

### System Architecture

**Technology Stack:**
- Next.js 15.5.4 (Frontend framework)
- React 19.1.0 (UI library)
- Supabase (PostgreSQL + Auth)
- tRPC 11.6.0 (API layer)
- Tailwind CSS 4 (Styling)

**Server Ports:**
- Application: 3025
- Supabase Studio: 54323
- PostgreSQL: 54322
- API: 54321

### Development Commands

```bash
# Start development
pnpm dev

# Build production
pnpm build

# Start production
pnpm start

# Lint and format
pnpm lint
pnpm format
```

### File Locations

**Configuration:**
- `.env` - Environment variables
- `supabase/config.toml` - Supabase config

**Schemas:**
- `docs/data/schemas/` - Source of truth
- `supabase/schemas/` - Working copy
- `supabase/migrations/` - Applied changes

**Documentation:**
- `CLAUDE.md` - Development guide
- `docs/CURRENT_FEATURES.md` - Feature documentation
- `docs/phase2/quick-reference/` - These cheat sheets

---

**You have complete system control. Use it wisely.**
