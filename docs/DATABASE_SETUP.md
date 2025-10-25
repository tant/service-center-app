# Database Setup Guide

**Last Updated:** 2025-10-25
**Version:** 2.0 (Phase 2 Complete)

---

## Overview

This guide explains how to set up the Service Center database schema from scratch using the source-of-truth schema files in `docs/data/schemas/`.

**Total Schema Files:** 13 (00-12)
**Total Tables Created:** 25
**Estimated Setup Time:** 2-3 minutes

---

## Prerequisites

1. **Supabase CLI** installed and configured
2. **Local Supabase** instance running (`pnpx supabase start`)
3. **PostgreSQL client** (psql) available
4. Project root directory access

---

## Quick Setup (Automated)

The simplest way to set up the database is using the automated setup script:

```bash
# From project root
./docs/data/schemas/setup_schema.sh
```

This script will:
1. ✅ Copy all 13 schema files to `supabase/schemas/`
2. ✅ Create storage buckets
3. ✅ Generate migration via `db diff`
4. ✅ Apply migration
5. ✅ Apply storage policies
6. ✅ Clean up temporary files

**Note:** The script uses `db diff` to generate a single migration from all schemas, avoiding circular dependency issues.

---

## Manual Setup (Step-by-Step)

If you prefer manual control or need to troubleshoot:

### Step 1: Reset Database (Optional)

Start with a clean database:

```bash
# Temporarily move seed file to avoid errors on empty DB
mv supabase/seed.sql supabase/seed.sql.backup

# Reset database
pnpx supabase db reset

# Restore seed file
mv supabase/seed.sql.backup supabase/seed.sql
```

### Step 2: Copy Schema Files

Copy all source schema files to Supabase schemas directory:

```bash
# Ensure directory exists
mkdir -p supabase/schemas

# Copy all 13 schema files
cp docs/data/schemas/00_base_schema.sql supabase/schemas/
cp docs/data/schemas/01_users_and_customers.sql supabase/schemas/
cp docs/data/schemas/02_products_and_inventory.sql supabase/schemas/
cp docs/data/schemas/03_service_tickets.sql supabase/schemas/
cp docs/data/schemas/04_task_and_warehouse.sql supabase/schemas/
cp docs/data/schemas/05_service_requests.sql supabase/schemas/
cp docs/data/schemas/06_policies_and_views.sql supabase/schemas/
cp docs/data/schemas/07_storage.sql supabase/schemas/
cp docs/data/schemas/08_inventory_functions.sql supabase/schemas/
cp docs/data/schemas/09_role_helpers.sql supabase/schemas/
cp docs/data/schemas/10_audit_logs.sql supabase/schemas/
cp docs/data/schemas/11_rls_policy_updates.sql supabase/schemas/
cp docs/data/schemas/12_seed_test_users.sql supabase/schemas/
```

### Step 3: Apply Schemas Directly (Recommended for Fresh Setup)

For a fresh database, applying schemas directly via `psql` is fastest and most reliable:

```bash
# Get database URL
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Apply all schemas in order
psql "$DB_URL" -f supabase/schemas/00_base_schema.sql
psql "$DB_URL" -f supabase/schemas/01_users_and_customers.sql
psql "$DB_URL" -f supabase/schemas/02_products_and_inventory.sql
psql "$DB_URL" -f supabase/schemas/03_service_tickets.sql
psql "$DB_URL" -f supabase/schemas/04_task_and_warehouse.sql
psql "$DB_URL" -f supabase/schemas/05_service_requests.sql
psql "$DB_URL" -f supabase/schemas/06_policies_and_views.sql
psql "$DB_URL" -f supabase/schemas/07_storage.sql
psql "$DB_URL" -f supabase/schemas/08_inventory_functions.sql
psql "$DB_URL" -f supabase/schemas/09_role_helpers.sql
psql "$DB_URL" -f supabase/schemas/10_audit_logs.sql
psql "$DB_URL" -f supabase/schemas/11_rls_policy_updates.sql
psql "$DB_URL" -f supabase/schemas/12_seed_test_users.sql
```

### Step 4: Verify Setup

Check that all tables were created:

```bash
psql "$DB_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
# Expected: 25 tables
```

List all tables:

```bash
psql "$DB_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
```

Verify RBAC functions:

```bash
psql "$DB_URL" -c "SELECT proname FROM pg_proc WHERE proname IN ('get_my_role', 'has_role', 'has_any_role', 'is_admin', 'is_admin_or_manager');"
# Expected: 5 functions
```

---

## Alternative: Migration-Based Setup

If you need to track changes via migrations:

### Step 1: Generate Migration from Schemas

```bash
# After copying schemas to supabase/schemas/
pnpx supabase db diff -f init_schema --schema public
```

This generates a migration file like `supabase/migrations/YYYYMMDD_init_schema.sql`.

### Step 2: Fix Generated Migration

The `db diff` command has some limitations. You may need to:

1. **Add IF EXISTS to DROP statements:**
   ```bash
   sed -i 's/^drop policy "/drop policy if exists "/' supabase/migrations/*_init_schema.sql
   ```

2. **Or remove DROP statements entirely for fresh setup:**
   ```bash
   sed -i '/^drop policy/d' supabase/migrations/*_init_schema.sql
   ```

### Step 3: Apply Migration

```bash
pnpx supabase migration up
```

---

## Schema Files Overview

| File | Purpose | Key Objects | Size |
|------|---------|-------------|------|
| **00_base_schema.sql** | ENUMs, domains, base functions | 12 ENUMs, is_admin(), is_admin_or_manager() | 9.9KB |
| **01_users_and_customers.sql** | User profiles and customers | profiles, customers tables | 3.6KB |
| **02_products_and_inventory.sql** | Products and parts | products, brands, parts tables | 6.8KB |
| **03_service_tickets.sql** | Core ticket workflow | service_tickets + related tables | 13KB |
| **04_task_and_warehouse.sql** | Tasks & warehouses | task_templates, warehouses, RMA | 12KB |
| **05_service_requests.sql** | Public portal + FK constraints | service_requests, FK constraints | 3.5KB |
| **06_policies_and_views.sql** | RLS policies and views | Base RLS policies, helper views | 20KB |
| **07_storage.sql** | File upload storage | Storage buckets and policies | 6.2KB |
| **08_inventory_functions.sql** | Inventory helpers | Stock movement functions | 1.9KB |
| **09_role_helpers.sql** | RBAC functions | get_my_role(), has_role(), etc. | 5.2KB |
| **10_audit_logs.sql** | Audit logging system | audit_logs table + functions | 11KB |
| **11_rls_policy_updates.sql** | Updated RBAC policies | Role-based RLS policies | 13KB |
| **12_seed_test_users.sql** | Test user documentation | Comments only (no SQL) | 8.2KB |

**Total:** 115KB across 13 files

---

## Dependency Resolution

### Circular Dependencies Fixed

The schema files were designed to resolve circular dependencies:

**Issue:** `service_tickets` table (file 03) needed foreign keys to:
- `task_templates` (created in file 04)
- `service_requests` (created in file 05)

**Solution:**
- File 03: Columns defined as plain UUID (no FK constraints)
- File 05: ALTER TABLE statements add FK constraints after tables exist

This ensures schemas can be applied sequentially without errors.

---

## Execution Order (Critical)

Schemas **MUST** be applied in numerical order (00 → 12):

```
00_base_schema.sql           # ENUMs and base functions FIRST
  ↓
01-03_*.sql                  # Core tables (users, products, tickets)
  ↓
04_task_and_warehouse.sql    # Creates task_templates and warehouses
  ↓
05_service_requests.sql      # Creates service_requests + adds FK constraints
  ↓
06-08_*.sql                  # Policies, storage, functions
  ↓
09_role_helpers.sql          # RBAC helper functions
  ↓
10_audit_logs.sql            # Audit logging
  ↓
11_rls_policy_updates.sql    # Updated RLS policies (uses functions from 09)
  ↓
12_seed_test_users.sql       # Documentation only
```

**Why order matters:**
- ENUMs must exist before tables use them
- Tables must exist before FK constraints reference them
- Functions must exist before policies use them
- Policies can only be updated after tables exist

---

## Common Issues & Solutions

### Issue 1: "relation does not exist"

**Cause:** Trying to apply schemas out of order
**Solution:** Always apply in numerical order (00 → 12)

### Issue 2: "type does not exist"

**Cause:** ENUMs not created before tables use them
**Solution:** Ensure `00_base_schema.sql` is applied first

### Issue 3: "DROP POLICY fails on empty database"

**Cause:** Migration has DROP statements for non-existent policies
**Solution:** Use `IF EXISTS` or remove DROP statements for fresh setup

### Issue 4: Seed file errors on reset

**Cause:** `supabase/seed.sql` has DELETE statements for non-existent tables
**Solution:** Temporarily move seed file during reset:
```bash
mv supabase/seed.sql supabase/seed.sql.backup
pnpx supabase db reset
mv supabase/seed.sql.backup supabase/seed.sql
```

---

## Verification Checklist

After setup, verify:

- [ ] **25 tables** created in public schema
- [ ] **5+ RBAC functions** exist (is_admin, get_my_role, etc.)
- [ ] **2 FK constraints** on service_tickets (template_id, request_id)
- [ ] **audit_logs table** exists and has proper indexes
- [ ] **Storage policies** created for file uploads
- [ ] **RLS enabled** on all sensitive tables

Quick verification:

```bash
# Count tables
psql "$DB_URL" -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"
# Expected: 25

# Check critical tables
psql "$DB_URL" -c "SELECT EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs');"
# Expected: t (true)

# Verify FK constraints
psql "$DB_URL" -c "SELECT COUNT(*) FROM pg_constraint WHERE conname LIKE 'service_tickets_%_fkey';"
# Expected: 7 or more
```

---

## Source of Truth

**Schema files in `docs/data/schemas/` are the single source of truth.**

- ✅ Always edit schemas there
- ✅ Copy to `supabase/schemas/` for deployment
- ✅ Never edit `supabase/schemas/` directly
- ✅ Never manually edit generated migrations

To update schemas:
1. Edit files in `docs/data/schemas/`
2. Run `./docs/data/schemas/setup_schema.sh`
3. Test in local environment
4. Commit schema files to git

---

## Next Steps After Setup

1. **Create admin user** via `/setup` endpoint
2. **Create test users** (manager, technician, reception)
3. **Load seed data** from `supabase/seed.sql`
4. **Run tests** to verify setup
5. **Start development server** (`pnpm dev`)

---

## Additional Resources

- **Setup Script:** `docs/data/schemas/setup_schema.sh`
- **Schema Documentation:** Each `.sql` file has detailed comments
- **Architecture Docs:** `docs/architecture/03-data-models.md`
- **RBAC Guide:** `docs/detail-reqs/ROLES-AND-PERMISSIONS.md`
- **Test Users Guide:** `docs/data/schemas/12_seed_test_users.sql`

---

## Troubleshooting

**Get help:**
- Check Supabase status: `pnpx supabase status`
- View database logs: `pnpx supabase db reset --debug`
- Inspect schema: `psql "$DB_URL" -c "\dt"` (list tables)
- Check functions: `psql "$DB_URL" -c "\df public.*"`

**Reset everything:**
```bash
pnpx supabase db reset
./docs/data/schemas/setup_schema.sh
```

---

**For questions or issues, refer to the project documentation or run the automated setup script.**
