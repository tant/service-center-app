# Inventory Management System - Migration Guide

**Date:** 2025-01-27
**Version:** 1.0

---

## Overview

This guide helps you apply the inventory management database migrations to your Supabase instance.

---

## Prerequisites

Before running migrations:

1. ✅ **Backup your database**
   ```bash
   pnpx supabase db dump -f backup-$(date +%Y%m%d).sql
   ```

2. ✅ **Ensure Supabase is running**
   ```bash
   pnpx supabase status
   ```

3. ✅ **Check current migrations**
   ```bash
   ls supabase/migrations/
   ```

---

## Migration Files

Total: **11 migration files** (10 core + 1 optional seed)

| # | File | Description | Size |
|---|------|-------------|------|
| 1 | `20250127000001_add_inventory_enums.sql` | Create ENUMs | ~1 KB |
| 2 | `20250127000002_alter_existing_tables.sql` | Add warranty columns | ~2 KB |
| 3 | `20250127000003_create_product_warehouse_stock.sql` | Stock tracking table | ~2 KB |
| 4 | `20250127000004_create_stock_receipts.sql` | Receipts tables | ~4 KB |
| 5 | `20250127000005_create_stock_issues.sql` | Issues tables | ~3 KB |
| 6 | `20250127000006_create_stock_transfers.sql` | Transfers tables | ~3 KB |
| 7 | `20250127000007_create_document_attachments.sql` | Attachments table | ~1 KB |
| 8 | `20250127000008_create_triggers_functions.sql` | Automation triggers | ~6 KB |
| 9 | `20250127000009_create_views.sql` | Reporting views | ~4 KB |
| 10 | `20250127000010_apply_rls_policies.sql` | Security policies | ~5 KB |
| 11 | `20250127000011_seed_sample_data.sql` | **Optional** sample data | ~2 KB |

**Total SQL:** ~33 KB

---

## Step-by-Step Migration

### Option 1: Automatic Migration (Recommended)

Let Supabase CLI handle everything:

```bash
# 1. Make sure you're in the project root
cd /home/tan/work/sevice-center

# 2. Apply all pending migrations
pnpx supabase db push

# 3. Verify migrations applied
pnpx supabase migration list
```

**Expected Output:**
```
✓ All migrations applied successfully
✓ 10 new tables created
✓ 4 new ENUMs created
✓ 8 triggers created
✓ 2 views created
```

---

### Option 2: Manual Migration (Step-by-Step)

Apply migrations one at a time for control:

```bash
# Migration 1: ENUMs
pnpx supabase db execute -f supabase/migrations/20250127000001_add_inventory_enums.sql

# Migration 2: Alter tables
pnpx supabase db execute -f supabase/migrations/20250127000002_alter_existing_tables.sql

# Migration 3: Product warehouse stock
pnpx supabase db execute -f supabase/migrations/20250127000003_create_product_warehouse_stock.sql

# Migration 4: Stock receipts
pnpx supabase db execute -f supabase/migrations/20250127000004_create_stock_receipts.sql

# Migration 5: Stock issues
pnpx supabase db execute -f supabase/migrations/20250127000005_create_stock_issues.sql

# Migration 6: Stock transfers
pnpx supabase db execute -f supabase/migrations/20250127000006_create_stock_transfers.sql

# Migration 7: Document attachments
pnpx supabase db execute -f supabase/migrations/20250127000007_create_document_attachments.sql

# Migration 8: Triggers and functions
pnpx supabase db execute -f supabase/migrations/20250127000008_create_triggers_functions.sql

# Migration 9: Views
pnpx supabase db execute -f supabase/migrations/20250127000009_create_views.sql

# Migration 10: RLS policies
pnpx supabase db execute -f supabase/migrations/20250127000010_apply_rls_policies.sql
```

---

### Option 3: Seed Sample Data (Optional)

**⚠️ Only for development/testing!**

```bash
# Add sample stock entries for testing
pnpx supabase db execute -f supabase/migrations/20250127000011_seed_sample_data.sql
```

---

## Verification

After migrations, verify everything is working:

### 1. Check Tables Created

```bash
pnpx supabase db execute -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'stock_%' ORDER BY table_name;"
```

**Expected Output:**
```
stock_document_attachments
stock_issue_items
stock_issue_serials
stock_issues
stock_receipt_items
stock_receipt_serials
stock_receipts
stock_transfer_items
stock_transfer_serials
stock_transfers
product_warehouse_stock
```

### 2. Check ENUMs Created

```bash
pnpx supabase db execute -c "SELECT typname FROM pg_type WHERE typname LIKE '%stock%' OR typname LIKE '%transfer%';"
```

**Expected Output:**
```
stock_document_status
stock_receipt_type
stock_issue_type
transfer_status
```

### 3. Check Views Created

```bash
pnpx supabase db execute -c "SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'v_%';"
```

**Expected Output:**
```
v_stock_summary
v_pending_approvals
```

### 4. Check Triggers Created

```bash
pnpx supabase db execute -c "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_name LIKE '%stock%' ORDER BY trigger_name;"
```

**Expected Output:**
```
trigger_generate_issue_number (stock_issues)
trigger_generate_receipt_number (stock_receipts)
trigger_generate_transfer_number (stock_transfers)
trigger_process_stock_issue_completion (stock_issues)
trigger_process_stock_receipt_completion (stock_receipts)
trigger_stock_issues_updated_at (stock_issues)
trigger_stock_receipts_updated_at (stock_receipts)
trigger_stock_transfers_updated_at (stock_transfers)
trigger_update_receipt_item_serial_count_insert (stock_receipt_serials)
trigger_update_receipt_item_serial_count_delete (stock_receipt_serials)
```

### 5. Test Basic Operations

```sql
-- Test 1: Insert product warehouse stock
INSERT INTO product_warehouse_stock (
  product_id,
  virtual_warehouse_type,
  declared_quantity
)
SELECT id, 'warranty_stock', 0
FROM products
LIMIT 1;

-- Test 2: Create a draft receipt
INSERT INTO stock_receipts (
  receipt_type,
  virtual_warehouse_type,
  receipt_date,
  created_by_id
)
VALUES (
  'supplier_receipt',
  'warranty_stock',
  CURRENT_DATE,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);

-- Test 3: Verify auto-generated receipt number
SELECT receipt_number FROM stock_receipts ORDER BY created_at DESC LIMIT 1;
-- Expected: PN-2025-0001
```

---

## Rollback (If Needed)

If something goes wrong, rollback in **reverse order**:

```bash
# Drop tables in reverse order
pnpx supabase db execute -c "
DROP VIEW IF EXISTS v_pending_approvals CASCADE;
DROP VIEW IF EXISTS v_stock_summary CASCADE;
DROP TABLE IF EXISTS stock_document_attachments CASCADE;
DROP TABLE IF EXISTS stock_transfer_serials CASCADE;
DROP TABLE IF EXISTS stock_transfer_items CASCADE;
DROP TABLE IF EXISTS stock_transfers CASCADE;
DROP TABLE IF EXISTS stock_issue_serials CASCADE;
DROP TABLE IF EXISTS stock_issue_items CASCADE;
DROP TABLE IF EXISTS stock_issues CASCADE;
DROP TABLE IF EXISTS stock_receipt_serials CASCADE;
DROP TABLE IF EXISTS stock_receipt_items CASCADE;
DROP TABLE IF EXISTS stock_receipts CASCADE;
DROP TABLE IF EXISTS product_warehouse_stock CASCADE;
DROP TYPE IF EXISTS transfer_status CASCADE;
DROP TYPE IF EXISTS stock_issue_type CASCADE;
DROP TYPE IF EXISTS stock_receipt_type CASCADE;
DROP TYPE IF EXISTS stock_document_status CASCADE;
DROP SEQUENCE IF EXISTS transfer_number_seq CASCADE;
DROP SEQUENCE IF EXISTS issue_number_seq CASCADE;
DROP SEQUENCE IF EXISTS receipt_number_seq CASCADE;
DROP FUNCTION IF EXISTS generate_transfer_number CASCADE;
DROP FUNCTION IF EXISTS generate_issue_number CASCADE;
DROP FUNCTION IF EXISTS generate_receipt_number CASCADE;
DROP FUNCTION IF EXISTS process_stock_issue_completion CASCADE;
DROP FUNCTION IF EXISTS process_stock_receipt_completion CASCADE;
DROP FUNCTION IF EXISTS update_receipt_item_serial_count CASCADE;
DROP FUNCTION IF EXISTS auto_generate_stock_issue_from_ticket CASCADE;
DROP FUNCTION IF EXISTS get_aggregated_stock CASCADE;
DROP FUNCTION IF EXISTS get_inventory_stats CASCADE;
"

# Restore from backup
pnpx supabase db reset --db-url "postgresql://..." < backup-YYYYMMDD.sql
```

---

## Troubleshooting

### Issue: "ENUM already exists"

**Solution:**
```bash
# Check if ENUMs exist
pnpx supabase db execute -c "SELECT typname FROM pg_type WHERE typname = 'stock_document_status';"

# If exists, skip migration 1 or use IF NOT EXISTS (already included)
```

### Issue: "Column already exists"

**Solution:**
```bash
# Our migrations use IF NOT EXISTS, so this shouldn't happen
# If it does, check if previous migration partially applied
```

### Issue: "Trigger already exists"

**Solution:**
```bash
# Drop and recreate
pnpx supabase db execute -c "DROP TRIGGER IF EXISTS trigger_name ON table_name;"
# Then re-run migration
```

### Issue: "Permission denied"

**Solution:**
```bash
# Ensure you're using service role key in migrations
# Check .env file has SUPABASE_SERVICE_ROLE_KEY set
```

---

## Post-Migration Tasks

After successful migration:

### 1. Initialize Stock for Existing Products

```sql
-- Add stock entries for all existing products
INSERT INTO product_warehouse_stock (
  product_id,
  virtual_warehouse_type,
  declared_quantity,
  initial_stock_entry
)
SELECT
  p.id,
  'warranty_stock',
  0,
  0
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_warehouse_stock pws
  WHERE pws.product_id = p.id
    AND pws.virtual_warehouse_type = 'warranty_stock'
);
```

### 2. Set Warranty Defaults

```sql
-- Update products with default warranty periods
UPDATE products
SET
  default_warranty_months = 36,  -- 3 years manufacturer warranty
  end_user_warranty_months = 12  -- 1 year customer warranty
WHERE default_warranty_months IS NULL;
```

### 3. Configure Stock Thresholds

```sql
-- Set low stock thresholds (if using alerts)
INSERT INTO product_stock_thresholds (
  product_id,
  warehouse_type,
  minimum_quantity,
  reorder_quantity
)
SELECT
  id,
  'warranty_stock',
  10,  -- Alert when below 10 units
  20   -- Suggest reordering 20 units
FROM products
WHERE NOT EXISTS (
  SELECT 1 FROM product_stock_thresholds pst
  WHERE pst.product_id = products.id
);
```

---

## Performance Optimization

After migrations, optimize for production:

```sql
-- Analyze tables for query planner
ANALYZE product_warehouse_stock;
ANALYZE stock_receipts;
ANALYZE stock_issues;
ANALYZE stock_transfers;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Check index usage (after some data accumulates)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'stock%'
ORDER BY idx_scan DESC;
```

---

## Next Steps

After migrations complete:

1. ✅ **Test in Supabase Studio**
   - Open http://localhost:54323
   - Browse tables, try queries

2. ✅ **Build tRPC Routers**
   - Follow implementation plan
   - Start with stock router

3. ✅ **Build React UI**
   - Create inventory overview page
   - Add stat cards and tables

4. ✅ **Write Tests**
   - Unit tests for triggers
   - E2E tests for workflows

---

## Support

If you encounter issues:

1. Check logs: `pnpx supabase logs`
2. Review migration history: `pnpx supabase migration list`
3. Consult docs: `docs/architecture/inventory-management-schema.md`
4. Ask in project chat or create an issue

---

**Migration Created:** 2025-01-27
**Total Tables:** 13 (10 new + 3 modified)
**Total SQL Lines:** ~800 lines
**Estimated Migration Time:** 2-5 minutes

Good luck! 🚀
