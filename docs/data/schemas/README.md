# Database Schema Files

**Version:** 4.0 (Schema Refactoring Complete - 100-900 Numbering)
**Last Updated:** 2025-10-31

This directory contains the **source of truth** for the Service Center PostgreSQL database schema.

---

## File Organization

Schema files use a systematic numbering scheme (100-900):

### 100-199: Base Schema
- `100_enums_and_sequences.sql` - All enum types and sequences
- `150_base_functions.sql` - Core helper functions (role checking, auto-numbering)

### 200-299: Tables
- `200_core_tables.sql` - Profiles, customers, brands, products, parts
- `201_service_tickets.sql` - Service ticket workflow
- `202_task_and_warehouse.sql` - Task management and warehouses
- `203_service_requests.sql` - Public service request portal
- `204_inventory_documents.sql` - Stock receipts/issues/transfers
- `205_audit_logs.sql` - Audit trail

### 300-399: Constraints
- `300_virtual_warehouse_physical_link.sql` - Warehouse linking migrations
- `301_foreign_key_constraints.sql` - Deferred FK constraints

### 500-599: Functions
- `500_inventory_functions.sql` - Part stock management
- `501_warehouse_functions.sql` - Warehouse statistics
- `502_audit_functions.sql` - Audit logging

### 600-699: Triggers
- `600_stock_triggers.sql` - Stock update triggers
- `601_default_warehouse_triggers.sql` - Warehouse auto-creation

### 700-799: Views
- `700_reporting_views.sql` - Reporting and analytics

### 800-899: RLS Policies
- `800_core_rls_policies.sql` - Core table policies
- `801_phase2_rls_policies.sql` - Phase 2 table policies
- `802_storage_policies.sql` - Storage bucket policies

### 900-999: Seed Data
- `900_default_warehouse_seed.sql` - Default warehouse system

---

## Quick Setup

```bash
./docs/data/schemas/setup_schema.sh
```

This script:
1. Copies schema files to `supabase/schemas/`
2. Generates migration via `db diff`
3. Applies migration
4. Seeds default warehouse system

**Time:** 2-3 minutes

---

## Execution Order

Files **must** be executed in numerical order:

```
100 → 150 → 200-205 → 300-301 → 500-502 → 600-601 → 700 → 800-802 → 900
```

**Key dependencies:**
- ENUMs (100) must exist before tables (200-205)
- Role functions (150) required by RLS policies (800-802)
- Tables required before constraints (300-301)
- Complete schema required before views (700) and seed data (900)

---

## Key Features

### Automatic Numbering
- Service Tickets: `SV-YYYY-NNN`
- Stock Documents: `PN/PX/PC-YYYY-NNNN`
- RMA Batches: `RMA-YYYY-MM-NNN`
- Service Requests: `SR-XXXXXXXXXXXX`

### Inventory Workflow v2.0
```
Create → Submit → Approve → ✅ Stock Updated → Serial Entry (0-100%)
                                   ↓                    ↓
                          Available immediately    Auto-complete
```

### Default Warehouse System
- System-managed "Công ty" physical warehouse
- 7 virtual warehouse types: `main`, `warranty_stock`, `rma_staging`, `dead_stock`, `in_service`, `parts`, `customer_installed`

### Security
- All functions use `SET search_path = ''` (prevents injection attacks)
- RLS enabled on all tables
- Role-based access control (Admin, Manager, Technician, Reception)
- Immutable audit logging

---

## Troubleshooting

**Migration conflicts:**
```bash
pnpx supabase migration repair <timestamp> --status applied
```

**Schema out of sync:**
```bash
pnpx supabase db reset  # WARNING: Deletes all data
```

**Function search path warnings:**
- Check Supabase Studio → Database → Linter
- Add `SET search_path = ''` to flagged functions

---

## Version History

- **v4.0 (2025-10-31)**: Schema refactoring - 100-900 numbering scheme
- **v3.0 (2025-10-29)**: Inventory workflow v2.0 (non-blocking)
- **v2.0 (2025-10-27)**: Audit logging and RBAC
- **v1.0 (2025-10-23)**: Initial schema

---

## References

- [CLAUDE.md](../../../CLAUDE.md) - Project architecture
- [ordering.md](./ordering.md) - File organization plan
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
