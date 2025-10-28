# Warehouse ID Migration Status

## Overview
Migration from `virtual_warehouse_type` (enum) to `virtual_warehouse_id` (UUID reference) for physical_products system.

## Completed ✅

### 1. **Database Migration**
- ✅ Created `/supabase/migrations/20251029000000_update_physical_products_to_virtual_warehouse_id.sql`
- Migrates `physical_products` table
- Migrates `stock_movements` table
- Handles `previous_virtual_warehouse_type` → `previous_virtual_warehouse_id`

### 2. **TypeScript Types**
- ✅ Updated `/src/types/warehouse.ts`:
  - `PhysicalProductFormData.virtual_warehouse_id`
  - `StockMovementFormData.from/to_virtual_warehouse_id`
  - `BulkProductImportRow.virtual_warehouse_name`
  - `SerialVerification.current_location.virtual_warehouse_id`

### 3. **Documentation**
- ✅ Updated `/docs/DATA-SETUP-GUIDE.md`
- ✅ Updated `/docs/data/mock-data.json` (v2.0.0)
- ✅ Updated `/docs/changelogs-28.md`
- ✅ Updated `/src/app/(auth)/admin/app-settings/page.tsx` (UI notes)
- ✅ Updated `/src/server/routers/admin.ts` (seedMockData)

### 4. **Stock Documents System** (Already Updated in Previous Redesign)
- ✅ `stock_receipts` uses `virtual_warehouse_id`
- ✅ `stock_issues` uses `virtual_warehouse_id`
- ✅ `stock_transfers` uses `virtual_warehouse_id`
- ✅ All related routers updated
- ✅ All related frontend components updated

## Pending ❌

### 1. **Physical Products Router** (`src/server/routers/physical-products.ts`)

**Status**: Partially complete (basic CRUD done, complex operations pending)

**Completed**:
- ✅ `createProductSchema` - uses `virtual_warehouse_id`
- ✅ `updateProductSchema` - uses `virtual_warehouse_id`
- ✅ `listProductsSchema` - uses `virtual_warehouse_id`
- ✅ `createProduct` mutation - inserts with `virtual_warehouse_id`
- ✅ `listProducts` query - filters by `virtual_warehouse_id`

**Needs Update**:
- ❌ `recordMovement` procedure (lines 490-570)
  - Input schema uses `from/to_virtual_warehouse_type`
  - Insert to stock_movements uses old fields
  - Update uses `virtual_warehouse_type`
- ❌ `addToRMABatch` procedure (lines ~927-1049)
  - Check warehouse type before RMA
  - Save/restore warehouse location
- ❌ `removeFromRMABatch` procedure (lines ~1246-1273)
  - Restore previous warehouse location
- ❌ `issueToTicket` procedure (lines ~659-669)
  - Move to in_service warehouse

**Action Required**: See `/docs/PHYSICAL_PRODUCTS_UPDATE_NEEDED.md`

### 2. **Frontend Components**

**Need Full Update**:
- ❌ `/src/components/inventory/product-registration-modal.tsx`
  - Form uses `virtual_warehouse_type`
  - Dropdown selection needs warehouse ID lookup

- ❌ `/src/components/inventory/bulk-import-modal.tsx`
  - CSV column header uses `virtual_warehouse_type`
  - Import logic needs warehouse name → ID resolution

- ❌ `/src/components/modals/record-movement-modal.tsx`
  - Movement form uses `from/to_virtual_warehouse_type`
  - UI needs dropdown for warehouse selection

- ❌ `/src/components/inventory/product-inventory-table.tsx`
  - Table column shows `virtual_warehouse_type`
  - Filter uses warehouse type enum
  - Needs warehouse name display

### 3. **Other Routers**

**May Need Update** (Check for physical_product queries):
- ❌ `/src/server/routers/inventory/serials.ts` (lines 384, 433-459, 471, 507, 519, 561, 572)
- ❌ `/src/server/routers/inventory/stock.ts` (lines 88, 163, 190)
- ❌ `/src/server/routers/inventory/issues.ts` (lines 317, 328, 343, 447)
- ❌ `/src/server/routers/inventory/transfers.ts` (lines 373, 384, 399, 532, 577)

### 4. **Database Views** (May need recreation)
- ❌ Check if any views reference `virtual_warehouse_type` on physical_products

## Testing Plan

After all updates complete:

1. **Database Migration**
   - [ ] Run migration on test database
   - [ ] Verify data migrated correctly
   - [ ] Check indexes created

2. **API Testing**
   - [ ] Create physical product
   - [ ] List/filter products by warehouse
   - [ ] Move product between warehouses
   - [ ] Add/remove from RMA batch
   - [ ] Issue to service ticket

3. **UI Testing**
   - [ ] Product registration form
   - [ ] Bulk import
   - [ ] Product inventory table
   - [ ] Movement modal

4. **Build Verification**
   - [ ] `pnpm build` passes
   - [ ] No TypeScript errors
   - [ ] No runtime errors

## Estimated Remaining Work

- **Physical Products Router**: 4-6 procedures, ~200-300 lines
- **Frontend Components**: 4 files, ~400-500 lines total
- **Other Routers**: Review + selective updates
- **Testing**: Full regression

## Recommendation

Due to the scope, suggest:
1. Complete in phases (one system at a time)
2. Test after each phase
3. Consider creating a feature branch for this migration
4. Update changelog with complete list of changes

## Dependencies

All work depends on migration `20251029000000` being run first.
