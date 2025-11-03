# Backend & Frontend Update Plan - Physical Products Schema Changes

## Status: 🔴 REQUIRES UPDATES

## Summary

The database schema has been updated, but backend and frontend code still reference old field names. This document outlines all required changes.

---

## 1. Missing Database View

### `v_stock_summary` - NEEDS TO BE CREATED

**Used by:** `src/server/routers/inventory/stock.ts`

**Expected Structure (from TypeScript types):**
```typescript
{
  product_id: string;
  product_name: string;
  sku: string | null;
  virtual_warehouse_id: string;        // Virtual warehouse instance
  virtual_warehouse_name: string;      // Virtual warehouse name
  warehouse_type: string;              // Warehouse type (from virtual warehouse)
  physical_warehouse_id: string | null; // From virtual_warehouse.physical_warehouse_id
  physical_warehouse_name: string | null;
  declared_quantity: number;
  actual_serial_count: number;
  serial_gap: number;
  initial_stock_entry: number;
  minimum_quantity: number | null;
  reorder_quantity: number | null;
  stock_status: StockStatus; // 'ok' | 'warning' | 'critical'
  created_at: string;
  updated_at: string;
}
```

**Action:** Create view that joins:
- `product_warehouse_stock`
- `products`
- `virtual_warehouses`
- `physical_warehouses`
- `physical_products` (for actual count)
- `product_stock_thresholds` (for min/max)

---

## 2. Backend Code Updates Required

### File: `src/server/routers/physical-products.ts`

#### Issue 1: CREATE operation
**Line ~190:**
```typescript
physical_warehouse_id: input.physical_warehouse_id,  // ❌ WRONG - doesn't exist
```
**Fix:** Remove this line (redundant - get from virtual_warehouse)

#### Issue 2: LIST filters
**Lines ~220-230:**
```typescript
if (input.physical_warehouse_id) {
  query = query.eq("physical_warehouse_id", input.physical_warehouse_id); // ❌ WRONG
}
```
**Fix:** Remove this filter or join through virtual_warehouses

#### Issue 3: MOVE operation
**Lines ~350:**
```typescript
updateData.physical_warehouse_id = input.to_physical_warehouse_id; // ❌ WRONG
```
**Fix:** Update `virtual_warehouse_id` instead

---

### File: `src/server/routers/inventory/stock.ts`

#### Issue 1: getSummary filters
**Line 88:**
```typescript
query = query.eq("virtual_warehouse_type", input.virtualWarehouseType); // ❌ Field doesn't exist in new schema
```
**Fix:**
```typescript
query = query.eq("warehouse_type", input.virtualWarehouseType); // warehouse_type comes from virtual_warehouses
```

#### Issue 2: getByWarehouseType
**Line ~150:**
```typescript
.eq("virtual_warehouse_type", input.warehouseType); // ❌ Field doesn't exist
```
**Fix:**
```typescript
.eq("warehouse_type", input.warehouseType); // Use warehouse_type from joined virtual_warehouses
```

---

### File: `src/server/routers/inventory/issues.ts`

#### Issue: Serial validation
**Lines checking physical_warehouse_id on physical_products:**
```typescript
(issue.physical_warehouse_id && p.physical_warehouse_id !== issue.physical_warehouse_id) // ❌ WRONG
```
**Fix:** Join through virtual_warehouses to check physical warehouse

---

### File: `src/server/routers/inventory/serials.ts`

#### Issue: Serial entry tracking
**References to `physical_warehouse_id` on physical_products**
**Fix:** Get physical_warehouse_id from virtual_warehouses join

---

## 3. Frontend Code Updates

### Search for references:
```bash
grep -r "virtual_warehouse_type\|physical_warehouse_id" src/app src/components --include="*.tsx"
```

**Expected issues:**
- Form inputs for creating/editing physical products
- Filter dropdowns for warehouse selection
- Display components showing warehouse info

---

## 4. Type Updates Required

### File: `src/types/inventory.ts`

Check that types match new schema:
- ✅ `StockSummary` - Already updated
- ❓ `PhysicalProduct` - May need updates
- ❓ Router input types - Need to remove old fields

---

## 5. Migration Order

1. ✅ Database schema updated
2. ✅ Views updated (v_warehouse_stock_levels, v_warranty_expiring_soon, v_low_stock_alerts)
3. 🔄 **CREATE v_stock_summary view**
4. 🔄 **Update backend routers**
5. 🔄 **Update TypeScript types**
6. 🔄 **Update frontend components**
7. 🔄 **Test all inventory features**

---

## 6. Testing Checklist

After updates:
- [ ] Create new physical product (receipt with serials)
- [ ] List physical products with filters
- [ ] Move product between warehouses
- [ ] View inventory overview page
- [ ] View stock by warehouse
- [ ] Filter by warehouse type
- [ ] Issue/Transfer with serial selection
- [ ] RMA batch management

---

## 7. Files to Update

**Database:**
- [ ] Create `supabase/schemas/22_v_stock_summary.sql`

**Backend:**
- [ ] `src/server/routers/physical-products.ts`
- [ ] `src/server/routers/inventory/stock.ts`
- [ ] `src/server/routers/inventory/issues.ts`
- [ ] `src/server/routers/inventory/serials.ts`

**Types:**
- [ ] `src/types/inventory.ts` (verify PhysicalProduct interface)

**Frontend:**
- [ ] TBD (after searching for references)
