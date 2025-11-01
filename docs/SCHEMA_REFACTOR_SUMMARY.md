# Schema Refactor Summary - Physical Products Warehouse Fields

**Date:** 2025-10-31
**Status:** ✅ Complete

## Overview

Refactored `physical_products` table to use specific virtual warehouse instances instead of warehouse types, removing redundant fields.

## Changes Made

### 1. Database Schema Changes

#### `physical_products` table:

**REMOVED:**
- ❌ `virtual_warehouse_type` (warehouse_type) - No longer use type enum, use warehouse instance
- ❌ `physical_warehouse_id` (UUID) - Redundant, get from virtual_warehouse
- ❌ `previous_virtual_warehouse_type` (warehouse_type) - Changed to ID-based

**ADDED/UPDATED:**
- ✅ `virtual_warehouse_id` (UUID, NOT NULL, ON DELETE RESTRICT) - Warehouse instance this product belongs to
- ✅ `previous_virtual_warehouse_id` (UUID, NULLABLE, ON DELETE SET NULL) - For RMA batch restoration

### 2. Data Model Changes

**Before:**
```
physical_products
  ├─ virtual_warehouse_type (ENUM)
  ├─ physical_warehouse_id → physical_warehouses
  └─ previous_virtual_warehouse_type (ENUM)
```

**After:**
```
physical_products
  ├─ virtual_warehouse_id → virtual_warehouses
  │   └─ physical_warehouse_id → physical_warehouses
  └─ previous_virtual_warehouse_id → virtual_warehouses
```

### 3. Views Updated

All views now join through `virtual_warehouses` to get warehouse information:

#### `v_warehouse_stock_levels`
- Now shows `virtual_warehouse_id`, `virtual_warehouse_name`
- Includes `physical_warehouse_id`, `physical_warehouse_name` from join
- Groups by specific warehouse instances instead of types

#### `v_warranty_expiring_soon`
- Uses `GREATEST()` for warranty calculation
- Joins through virtual_warehouses for location info
- Includes customer information

#### `v_low_stock_alerts`
- Joins physical_products → virtual_warehouses to aggregate by warehouse_type
- Correctly matches against product_stock_thresholds

### 4. Functions Updated

#### `get_inventory_stats()`
- Removed non-existent `pp.physical_warehouse_id` condition
- Removed non-existent `pp.deleted_at` condition
- Correctly joins on `pp.virtual_warehouse_id = pws.virtual_warehouse_id`

### 5. Files Modified

**Schema Source Files (docs/data/schemas/):**
- ✅ `04_task_and_warehouse.sql` - physical_products table definition
- ✅ `06_policies_and_views.sql` - All views updated
- ✅ `18_inventory_stock_functions.sql` - Stats functions updated

**Migration Files (supabase/schemas/):**
- ✅ `19_add_virtual_warehouse_id_to_physical_products.sql` - Add new column
- ✅ `20_refactor_physical_products_warehouse_fields.sql` - Data migration & cleanup
- ✅ `21_update_views_for_virtual_warehouse_id.sql` - Recreate views

**Copied to supabase/schemas:**
- ✅ `04_task_and_warehouse.sql`
- ✅ `06_policies_and_views.sql`
- ✅ `18_inventory_stock_functions.sql`

## Benefits

1. **Clearer Data Model:** Products belong to specific warehouse instances, not just types
2. **Eliminates Redundancy:** No need to store `physical_warehouse_id` on products
3. **Flexible Warehouse Management:** Can have multiple warehouses of same type
4. **RMA Tracking:** `previous_virtual_warehouse_id` allows proper RMA batch restoration
5. **Consistent Design:** Matches the virtual_warehouses → physical_warehouses relationship

## Migration Notes

- Existing data migrated to default "main" warehouse
- `virtual_warehouse_id` set to NOT NULL with RESTRICT deletion
- Previous RMA data preserved where possible

## Testing Required

1. ✅ Database structure verified
2. ✅ Views recreated successfully
3. ✅ Functions updated
4. 🔄 Test serial entry on receipts (pending user test)
5. 🔄 Test inventory overview page (pending user test)
6. 🔄 Test warehouse stock levels (pending user test)

## Rollback Plan

If issues occur:
1. Restore from backup
2. Re-run migrations from before schema change
3. Database reset: `pnpx supabase db reset`
