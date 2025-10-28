# Physical Products Router - Update Required

## File: `src/server/routers/physical-products.ts`

This file needs comprehensive updates to replace `virtual_warehouse_type` with `virtual_warehouse_id`.

### Changes Needed:

#### 1. **Schema Updates** ✅ (COMPLETED)
- `createProductSchema` - Changed to `virtual_warehouse_id`
- `updateProductSchema` - Changed to `virtual_warehouse_id`
- `listProductsSchema` - Changed to `virtual_warehouse_id`

#### 2. **CRUD Operations** ✅ (COMPLETED)
- Line 97: Insert uses `virtual_warehouse_id`
- Line 195: List query filter uses `virtual_warehouse_id`

#### 3. **Movement Operations** ❌ (NEEDS UPDATE)
- Lines 490-494: Input schema uses `from_virtual_warehouse_type` and `to_virtual_warehouse_type`
  - Should be: `from_virtual_warehouse_id` and `to_virtual_warehouse_id`
- Lines 540-541: stock_movements insert
  - Should use: `from_virtual_warehouse_id` and `to_virtual_warehouse_id`
- Lines 558-559: Update product location
  - Should update: `virtual_warehouse_id`

#### 4. **RMA Operations** ❌ (NEEDS UPDATE)
- Lines around 927-931: Check warehouse type before RMA
  - Should check: `virtual_warehouse_id`
- Lines around 1038-1049: Move products to RMA staging
  - Should update: `virtual_warehouse_id` and `previous_virtual_warehouse_id`
- Lines around 1265-1273: Remove from RMA batch
  - Should restore: `virtual_warehouse_id` from `previous_virtual_warehouse_id`

#### 5. **Service Ticket Integration** ❌ (NEEDS UPDATE)
- Lines around 659, 669: Issue product to ticket
  - Should use: `virtual_warehouse_id`
- Line 468: Warehouse type comparison
  - Should compare: `virtual_warehouse_id`

### Recommended Approach:

Due to the file's size (1455 lines) and the number of procedures affected, recommend a systematic approach:

1. **Update Movement Schemas and Operations First**
   - Record movement procedure
   - Stock movement tracking

2. **Update RMA Operations**
   - Add to RMA batch
   - Remove from RMA batch
   - Previous warehouse tracking

3. **Update Service Ticket Integration**
   - Issue to ticket
   - Return from ticket

### Testing Checklist:

After updates:
- [ ] Product creation works
- [ ] Product movement between warehouses works
- [ ] RMA batch operations work (add/remove)
- [ ] Service ticket integration works (issue/return)
- [ ] Stock queries return correct data

### Migration Dependencies:

Requires migration `20251029000000_update_physical_products_to_virtual_warehouse_id.sql` to be run first.
