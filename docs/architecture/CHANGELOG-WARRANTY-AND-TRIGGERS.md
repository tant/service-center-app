# Warranty Schema & Auto-Triggers Changelog

**Date:** 2025-10-29
**Version:** 3.0
**Type:** Breaking Change + New Feature

---

## Summary

This document records the migration from single `warranty_end_date` to dual warranty fields, plus the addition of automatic physical product creation triggers.

---

## Breaking Changes

### 1. Warranty Field Changes

#### ❌ REMOVED Fields

```sql
-- physical_products table
warranty_start_date   DATE     -- REMOVED
warranty_months       INTEGER  -- REMOVED
warranty_end_date     DATE     -- REMOVED (was calculated)

-- stock_receipt_items table
warranty_start_date   DATE     -- REMOVED
warranty_months       INTEGER  -- REMOVED

-- stock_receipt_serials table
warranty_start_date   DATE     -- REMOVED
warranty_months       INTEGER  -- REMOVED
```

#### ✅ NEW Fields

```sql
-- physical_products table
manufacturer_warranty_end_date DATE NULL  -- NEW: Direct end date from manufacturer
user_warranty_end_date        DATE NULL  -- NEW: Extended warranty for end user

-- stock_receipt_serials table
manufacturer_warranty_end_date DATE NULL  -- NEW: Optional warranty during serial entry
user_warranty_end_date        DATE NULL  -- NEW: Optional warranty during serial entry
```

---

## New Features

### 2. Auto-Creation Triggers

**Files:**
- `docs/data/schemas/17_stock_update_triggers.sql` (source)
- `supabase/migrations/20251029160000_add_physical_product_serial_triggers.sql` (migration)

#### Trigger 1: Receipt Serials → Physical Products

```sql
CREATE TRIGGER trigger_create_physical_product_from_receipt_serial
  BEFORE INSERT ON stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION create_physical_product_from_receipt_serial();
```

**Behavior:**
- Automatically creates `physical_products` record when serial is added
- Links via `physical_product_id` in `stock_receipt_serials`
- Copies warranty dates if provided (both nullable)

#### Trigger 2: Issue Serials → Delete Physical Products

```sql
CREATE TRIGGER trigger_delete_physical_product_on_issue
  AFTER INSERT ON stock_issue_serials
  FOR EACH ROW
  EXECUTE FUNCTION delete_physical_product_on_issue();
```

**Behavior:**
- Deletes `physical_products` when issued out of warehouse
- Permanent removal (product leaves inventory)

#### Trigger 3: Transfer Serials → Update Warehouse

```sql
CREATE TRIGGER trigger_update_physical_product_warehouse_on_transfer
  AFTER INSERT ON stock_transfer_serials
  FOR EACH ROW
  EXECUTE FUNCTION update_physical_product_warehouse_on_transfer();
```

**Behavior:**
- Updates `virtual_warehouse_id` (new location)
- Sets `previous_virtual_warehouse_id` (for audit trail)

---

## Migration Impact

### Code Changes Required

#### ✅ Fixed Files

1. **`src/server/routers/inventory/issues.ts`**
   - Line 80: Query getIssue
   - Line 690: Query searchAvailableProducts
   - Changed: `warranty_end_date` → `manufacturer_warranty_end_date, user_warranty_end_date`

2. **`src/server/routers/inventory/transfers.ts`**
   - Line 74: Query getTransfer
   - Line 723: Query searchAvailableProducts
   - Changed: `warranty_end_date` → `manufacturer_warranty_end_date, user_warranty_end_date`

3. **`src/server/routers/inventory/serials.ts`**
   - Line 477: Removed `endDate: physicalProduct.warranty_end_date`
   - Kept: `manufacturerEndDate`, `userEndDate`

4. **`src/server/routers/inventory/receipts.ts`**
   - Already using correct field names ✅

5. **`src/server/routers/physical-products.ts`**
   - No warranty queries ✅

### Database Changes

#### Views Updated

```sql
-- v_warranty_expiring_soon
-- Now uses manufacturer_warranty_end_date and user_warranty_end_date
-- Priority: user > manufacturer

CREATE OR REPLACE VIEW v_warranty_expiring_soon AS
SELECT
  pp.manufacturer_warranty_end_date,
  pp.user_warranty_end_date,
  CASE
    WHEN pp.user_warranty_end_date IS NOT NULL
      THEN pp.user_warranty_end_date - CURRENT_DATE
    WHEN pp.manufacturer_warranty_end_date IS NOT NULL
      THEN pp.manufacturer_warranty_end_date - CURRENT_DATE
    ELSE NULL
  END AS days_remaining
FROM physical_products pp
-- ...
WHERE (pp.user_warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
   OR (pp.user_warranty_end_date IS NULL
       AND pp.manufacturer_warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days');
```

#### Triggers Removed

```sql
DROP TRIGGER trigger_physical_products_warranty_calculation;
DROP FUNCTION calculate_physical_product_warranty_end_date();
```

---

## Workflow Changes

### Old Workflow (v1.0)

```
Create Receipt
  ↓
Add Serials (with warranty_start_date + warranty_months)
  ↓
Submit Receipt
  ↓
Approve Receipt
  ↓
Trigger calculates warranty_end_date
  ↓
Physical products exist with calculated warranty
```

### New Workflow (v3.0)

```
Create Receipt
  ↓
Add Serials (serial_number ONLY)
  ↓ (TRIGGER FIRES IMMEDIATELY)
Physical products created (warranty = NULL)
  ↓
Submit Receipt
  ↓
Approve Receipt
  ↓ (Stock updated)
Later: Update warranty at /inventory/products
```

---

## Benefits

### ✅ Advantages

1. **Immediate Availability**
   - Physical products exist as soon as serial is entered
   - No waiting for approval or completion
   - Supports real-time inventory tracking

2. **Flexible Warranty Management**
   - Warranty data optional (nullable)
   - Can be updated any time after receipt
   - Supports partial data entry

3. **Dual Warranty Support**
   - Manufacturer warranty (from vendor)
   - User warranty (extended protection)
   - Clear priority rules (user > manufacturer)

4. **Automatic Lifecycle**
   - Insert serial → Create physical product
   - Issue serial → Delete physical product
   - Transfer serial → Update location
   - No manual sync needed

### ⚠️ Considerations

1. **Breaking Change**
   - All existing code referencing `warranty_end_date` must be updated
   - Database views need recreation
   - Frontend displays need adjusting

2. **Data Migration**
   - Existing `warranty_end_date` → `manufacturer_warranty_end_date`
   - One-time migration script required
   - Historical data preserved

---

## Testing Checklist

- [x] Build succeeds without errors
- [x] Trigger creates physical products on serial insert
- [x] Trigger deletes physical products on issue
- [x] Trigger updates warehouse on transfer
- [x] Warranty fields accept NULL values
- [x] Warranty priority logic works (user > manufacturer)
- [x] Existing data migrated successfully
- [x] Views recreated with new schema
- [x] API endpoints updated
- [x] Frontend displays correct fields

---

## Related Files

### Source of Truth
- `docs/data/schemas/17_stock_update_triggers.sql` - Trigger definitions
- `docs/data/schemas/20251029150400_update_warranty_to_end_dates.sql` - Warranty migration

### Migrations Applied
- `20251029073412_init_schema.sql` - Initial schema
- `20251029150400_update_warranty_to_end_dates.sql` - Warranty fields update
- `20251029160000_add_physical_product_serial_triggers.sql` - Auto-creation triggers

### Documentation
- `docs/architecture/WARRANTY-MANAGEMENT.md` - Complete warranty guide
- `docs/architecture/INVENTORY-WORKFLOW-V2.md` - Workflow documentation
- `CLAUDE.md` - Developer quick reference

### Code Files
- `src/server/routers/inventory/issues.ts`
- `src/server/routers/inventory/transfers.ts`
- `src/server/routers/inventory/receipts.ts`
- `src/server/routers/inventory/serials.ts`
- `src/server/routers/physical-products.ts`

---

## Rollback Plan

If issues arise, rollback requires:

1. **Remove triggers:**
   ```sql
   DROP TRIGGER trigger_create_physical_product_from_receipt_serial;
   DROP TRIGGER trigger_delete_physical_product_on_issue;
   DROP TRIGGER trigger_update_physical_product_warehouse_on_transfer;
   ```

2. **Restore old schema** (NOT RECOMMENDED - data loss)
   ```sql
   ALTER TABLE physical_products
     ADD COLUMN warranty_end_date DATE;
   -- Migrate back: manufacturer_warranty_end_date → warranty_end_date
   ```

3. **Revert code changes**
   - Restore old queries using `warranty_end_date`
   - Rebuild and redeploy

**Note:** Full rollback not feasible due to breaking schema changes. Forward-only migration recommended.

---

**Version History:**
- v1.0 (Old): Single `warranty_end_date` calculated field
- v2.0 (2025-10-29): Dual warranty fields (manual creation)
- v3.0 (2025-10-29): Auto-creation triggers added

**Status:** ✅ Fully Implemented & Tested
