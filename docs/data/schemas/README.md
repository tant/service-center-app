# Service Center Database Schema

**Version:** 3.0 (Inventory Redesign Complete)
**Last Updated:** 2025-10-29
**Total Schema Files:** 16 (00-12, 15-17) + seed.sql
**Total Tables:** 31

This directory contains the **complete source of truth** for the Service Center database schema, designed for use with Supabase PostgreSQL.

---

## 📁 Schema Files Overview

All schema files are numbered to ensure proper execution order due to dependencies:

### Core Schema Files (00-12, 15-17)

| File | Purpose | Key Objects | Size |
|------|---------|-------------|------|
| **00_base_schema.sql** | ENUMs, domains, base functions | 12 ENUMs, `is_admin()`, `is_admin_or_manager()` | 10KB |
| **01_users_and_customers.sql** | User profiles and customers | `profiles`, `customers` tables | 3.6KB |
| **02_products_and_inventory.sql** | Products and parts | `products`, `brands`, `parts` tables | 6.9KB |
| **03_service_tickets.sql** | Core ticket workflow | `service_tickets` + related tables | 12.7KB |
| **04_task_and_warehouse.sql** | Tasks & warehouses | `task_templates`, `physical_warehouses`, RMA | 12KB |
| **05_service_requests.sql** | Public portal + FK constraints | `service_requests`, FK constraints | 6.2KB |
| **06_policies_and_views.sql** | RLS policies and views | Base RLS policies, helper views | 20KB |
| **07_storage.sql** | File upload storage | Storage buckets and policies | 6.3KB |
| **08_inventory_functions.sql** | Inventory helpers | Stock movement functions | 1.9KB |
| **09_role_helpers.sql** | RBAC functions | `get_my_role()`, `has_role()`, etc. | 5.3KB |
| **10_audit_logs.sql** | Audit logging system | `audit_logs` table + functions | 10.7KB |
| **11_rls_policy_updates.sql** | Updated RBAC policies | Role-based RLS policies | 12.6KB |
| **12_seed_test_users.sql** | Test user documentation | Comments only (no SQL) | 8.3KB |
| **15_virtual_warehouse_physical_link.sql** | Virtual ↔ Physical link | Auto-create virtual warehouses | 4.8KB |
| **16_inventory_documents.sql** | Inventory management | Receipts, issues, transfers, serials | 22.8KB |
| **17_stock_update_triggers.sql** | Stock automation | Triggers for stock updates on approval | 4.3KB |

### Seed Data

| File | Purpose | Records Created |
|------|---------|----------------|
| **seed.sql** | Default task types | 27+ task types (Intake, Diagnosis, Repair, QA, Closing) |

**Total:** 147KB across 16 schema files + 6KB seed data

---

## 🚀 Quick Setup (Automated)

The simplest way to set up the database:

```bash
# From project root
./docs/data/schemas/setup_schema.sh
```

This script automatically:
1. ✅ Copies all 16 schema files to `supabase/schemas/`
2. ✅ Copies `seed.sql` to `supabase/` folder
3. ✅ Creates storage buckets
4. ✅ Generates migration via `db diff`
5. ✅ Applies migration and storage policies
6. ✅ **Loads seed data automatically** (27+ task types)
7. ✅ Verifies database setup (31 tables, RBAC functions)
8. ✅ Cleans up temporary files

**Time:** 2-3 minutes
**Result:** Fully configured database ready for development

---

## 📋 Schema Execution Order

**CRITICAL:** Schemas must be applied in numerical order (00 → 12, then 15 → 17) due to dependencies.

```
00_base_schema.sql                        # ENUMs and base functions FIRST
  ↓
01_users_and_customers.sql                # Users and customer tables
  ↓
02_products_and_inventory.sql             # Products, brands, parts
  ↓
03_service_tickets.sql                    # Service tickets (without FKs to 04, 05)
  ↓
04_task_and_warehouse.sql                 # Creates task_templates and physical_warehouses
  ↓
05_service_requests.sql                   # Creates service_requests + adds FK constraints to 03
  ↓
06_policies_and_views.sql                 # Base RLS policies and views
  ↓
07_storage.sql                            # Storage buckets and policies
  ↓
08_inventory_functions.sql                # Inventory management functions
  ↓
09_role_helpers.sql                       # RBAC helper functions
  ↓
10_audit_logs.sql                         # Audit logging system
  ↓
11_rls_policy_updates.sql                 # Updated RLS policies (uses functions from 09)
  ↓
12_seed_test_users.sql                    # Documentation only
  ↓
15_virtual_warehouse_physical_link.sql    # Links virtual warehouses to physical warehouses
  ↓
16_inventory_documents.sql                # Stock receipts, issues, transfers, serials
  ↓
17_stock_update_triggers.sql              # Auto-update stock on document approval
  ↓
seed.sql                                  # Task types (REQUIRED for workflow system)
```

### Why Order Matters

- **ENUMs** must exist before tables use them (file 00)
- **Tables** must exist before FK constraints reference them (files 01-05)
- **Functions** must exist before policies use them (file 09 before 11)
- **Policies** can only be updated after tables exist (file 11)
- **Seed data** requires tables to exist (loaded last)

---

## 🔄 Circular Dependency Resolution

**Problem:** File 03 (`service_tickets`) needed foreign keys to tables created in files 04 and 05.

**Solution:** Deferred FK constraints using ALTER TABLE pattern.

### Implementation

**File 03 (service_tickets.sql):**
```sql
-- Phase 2 columns (FK constraints added in 05_service_requests.sql)
"template_id" uuid,  -- No FK constraint yet
"request_id" uuid,   -- No FK constraint yet
```

**File 05 (service_requests.sql):**
```sql
-- Add FK constraints after all tables exist
ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES public.task_templates(id)
  ON DELETE SET NULL;

ALTER TABLE public.service_tickets
  ADD CONSTRAINT service_tickets_request_id_fkey
  FOREIGN KEY (request_id)
  REFERENCES public.service_requests(id)
  ON DELETE SET NULL;
```

This ensures sequential application works without errors while maintaining data integrity.

---

## 🗄️ Database Structure

### Complete Table List (25 Tables)

**Users & Customers:**
- `profiles` - Extended user info with roles (Admin, Manager, Technician, Reception)
- `customers` - Customer information

**Products & Inventory:**
- `brands` - Product manufacturers
- `products` - Product catalog with warranty info
- `physical_products` - Serial-tracked physical product instances
- `parts` - Replacement parts inventory
- `product_parts` - Product-to-parts mapping

**Service Management:**
- `service_tickets` - Core workflow with auto-numbering (SV-YYYY-NNN)
- `service_ticket_parts` - Parts used in tickets
- `service_ticket_comments` - Comments and communication
- `service_ticket_attachments` - File attachments
- `service_requests` - Public portal requests
- `service_request_tracking` - Request status tracking

**Task Workflow:**
- `task_types` - Task type definitions (seeded with 27+ types)
- `task_templates` - Template workflows
- `task_templates_tasks` - Template task configurations
- `tasks` - Individual task instances
- `task_dependencies` - Task dependency rules
- `task_execution` - Task completion tracking

**Warehouse Management:**
- `warehouses` - Physical and virtual warehouse hierarchy
- `warehouse_stock_levels` - Real-time stock tracking (view)
- `rma_batches` - RMA batch processing
- `rma_batch_items` - Items in RMA batches

**Email & Notifications:**
- `email_notifications` - Email queue and tracking

**Audit & Logging:**
- `audit_logs` - Complete audit trail

---

## 🔐 Security & RBAC

### Role Hierarchy

1. **Admin** - Full system access, setup via `/setup` endpoint
2. **Manager** - Operations oversight, team management, approvals
3. **Technician** - Task execution, limited to assigned work
4. **Reception** - Customer intake, ticket creation

### Security Implementation

**Database Level:**
- Row Level Security (RLS) enabled on all tables
- Role-based policies filter data based on `get_my_role()` function
- Audit logging tracks all permission-sensitive operations

**Helper Functions (09_role_helpers.sql):**
```sql
get_my_role()           -- Returns current user's role
has_role(role)          -- Check if user has specific role
has_any_role(roles[])   -- Check if user has any of multiple roles
is_admin()              -- Quick admin check
is_admin_or_manager()   -- Manager+ access check
```

**Audit Trail (10_audit_logs.sql):**
- All high-value operations logged
- Immutable records (no UPDATE/DELETE allowed)
- Tracks: user, timestamp, operation, reason, metadata

---

## 🌱 Seed Data (REQUIRED)

**File:** `seed.sql`

### Why Required?

The workflow system **cannot function** without seed data:

- ✅ Creates 27+ task types (Intake, Diagnosis, Repair, QA, Closing)
- ✅ Required by Story 01.02 acceptance criteria
- ✅ `task_templates_tasks` has NOT NULL FK to `task_types`
- ✅ Templates cannot be created without task types

### Task Categories

| Category | Task Types | Examples |
|----------|-----------|----------|
| **Intake** | 4 | Product Receiving, Serial Verification |
| **Diagnosis** | 4 | Run Diagnostic Tests, Identify Root Cause |
| **Approval** | 3 | Manager Approval, Quote Creation |
| **Repair** | 4 | Replace Component, Firmware Update |
| **Warehouse** | 3 | Warehouse Out, RMA Processing |
| **QA** | 4 | Quality Check, Burn-In Test |
| **Closing** | 4 | Customer Notification, Package for Delivery |

**Total:** 26-27 task types

### Loading Seed Data

**Automated:** Setup script loads automatically (recommended)

**Manual:**
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed.sql
```

---

## 📚 Source of Truth

**All database files in `docs/data/schemas/` are the single source of truth.**

### Best Practices

- ✅ Always edit schemas in `docs/data/schemas/`
- ✅ Setup script copies to `supabase/` for deployment
- ✅ Never edit `supabase/schemas/` or `supabase/seed.sql` directly
- ✅ Never manually edit generated migrations
- ✅ Commit only `docs/data/schemas/` files to git

### Workflow for Schema Changes

1. Edit files in `docs/data/schemas/`
2. Run `./docs/data/schemas/setup_schema.sh`
3. Test in local environment
4. Verify with `pnpx supabase db diff` (should show "no changes")
5. Commit schema files to git

---

## 🛠️ Manual Setup (Advanced)

If you need manual control or troubleshooting:

### Step 1: Copy Schema Files
```bash
mkdir -p supabase/schemas
cp docs/data/schemas/00_base_schema.sql supabase/schemas/
cp docs/data/schemas/01_users_and_customers.sql supabase/schemas/
# ... (copy all 13 files)
cp docs/data/schemas/seed.sql supabase/
```

### Step 2: Apply Schemas Directly
```bash
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Apply all schemas in order
psql "$DB_URL" -f supabase/schemas/00_base_schema.sql
psql "$DB_URL" -f supabase/schemas/01_users_and_customers.sql
# ... (apply all 13 files in order)
```

### Step 3: Load Seed Data
```bash
psql "$DB_URL" -f supabase/seed.sql
```

### Step 4: Verify Setup
```bash
# Count tables (expected: 25)
psql "$DB_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"

# Verify RBAC functions (expected: 5)
psql "$DB_URL" -c "SELECT proname FROM pg_proc WHERE proname IN ('get_my_role', 'has_role', 'has_any_role', 'is_admin', 'is_admin_or_manager');"

# Verify task types (expected: 26+)
psql "$DB_URL" -c "SELECT COUNT(*) FROM public.task_types;"
```

---

## 🔍 Key Features

### 1. Automatic Ticket Numbering
- Format: `SV-YYYY-NNN` (SV-2025-001, SV-2025-002, etc.)
- Function: `generate_ticket_number()` creates sequential numbers per year
- Trigger: `set_ticket_number()` assigns number on insert

### 2. Task Workflow System
- Template-based task generation
- Automatic task creation from templates
- Dependency management (sequential/parallel)
- Task execution tracking with photos and notes

### 3. Warehouse Hierarchy
- Virtual warehouses (Pending Diagnosis, Ready to Ship, etc.)
- Physical warehouses with locations
- Automatic product movement based on ticket events
- Real-time stock level tracking

### 4. RMA Batch Processing
- Batch numbering: `RMA-YYYYMMDD-NNN`
- Track multiple products sent to manufacturer
- Integration with warehouse management

### 5. Audit Trail
- All tables include `created_at`, `updated_at` timestamps
- Creator/modifier tracking with `created_by`, `updated_by` fields
- Complete audit log for high-value operations
- Immutable audit records

### 6. Email Notifications
- Queue-based email system
- Track delivery status and attempts
- Support for templates and priorities

---

## ⚠️ Common Issues & Solutions

### Issue 1: "relation does not exist"
**Cause:** Trying to apply schemas out of order
**Solution:** Always apply in numerical order (00 → 12)

### Issue 2: "type does not exist"
**Cause:** ENUMs not created before tables use them
**Solution:** Ensure `00_base_schema.sql` is applied first

### Issue 3: "DROP POLICY fails on empty database"
**Cause:** Migration has DROP statements for non-existent policies
**Solution:** Setup script automatically adds `IF EXISTS` to generated migrations

### Issue 4: Seed file errors on reset
**Cause:** `seed.sql` has DELETE statements for non-existent tables
**Solution:** Seed file now uses DO blocks with existence checks

---

## 📊 Verification Checklist

After setup, verify:

- [ ] **25 tables** created in public schema
- [ ] **5 RBAC functions** exist (is_admin, get_my_role, etc.)
- [ ] **2 FK constraints** on service_tickets (template_id, request_id)
- [ ] **audit_logs table** exists and has proper indexes
- [ ] **23+ storage policies** created for file uploads
- [ ] **RLS enabled** on all sensitive tables
- [ ] **26+ task types** loaded from seed data

Quick verification:
```bash
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Count tables (expected: 25)
psql "$DB_URL" -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"

# Check RBAC functions (expected: 5)
psql "$DB_URL" -c "SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_my_role', 'has_role', 'has_any_role', 'is_admin', 'is_admin_or_manager');"

# Check task types (expected: 26+)
psql "$DB_URL" -c "SELECT COUNT(*) FROM public.task_types;"

# Verify FK constraints (expected: 2+)
psql "$DB_URL" -c "SELECT COUNT(*) FROM pg_constraint WHERE conname LIKE 'service_tickets_%_fkey';"
```

---

## 🧹 Clean Slate Setup

To start completely fresh:

```bash
# Clean up and reset everything
./docs/data/cleanup_supabase.sh

# Setup from scratch (automatically loads seed data)
./docs/data/schemas/setup_schema.sh
```

The cleanup script:
- Stops Supabase
- Removes Docker containers and volumes
- Cleans migration and schema files
- Temporarily moves seed file (to avoid errors on empty DB)
- Restarts Supabase fresh

---

## 📖 Additional Documentation

- **Database Setup Guide:** `docs/DATABASE_SETUP.md`
- **RBAC Implementation:** `docs/detail-reqs/ROLES-AND-PERMISSIONS.md`
- **Architecture Docs:** `docs/architecture/03-data-models.md`
- **Schema Fix Report:** `docs/reports/SCHEMA-FIX-REPORT-2025-10-25.md`

---

## 🎯 Next Steps After Setup

1. **Create admin user** via `/setup` endpoint
2. **Create test users** (see `12_seed_test_users.sql` for details)
3. **Run tests** to verify setup
4. **Start development:** `pnpm dev`

---

**Version History:**
- v2.0 (2025-10-25): Phase 2 complete - RBAC, audit logging, task workflow, warehouse management
- v1.0 (2025-10-23): Initial schema - core service ticket management
