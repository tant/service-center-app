# Frontend Update Guide - Inventory Redesign

## 📋 Progress Summary

### ✅ Completed
1. **Backend (100% Done)**
   - ✅ TypeScript types updated (`src/types/inventory.ts`)
   - ✅ tRPC routers updated (receipts, issues, transfers)
   - ✅ Zod validation schemas updated

2. **Frontend (Partial)**
   - ✅ Transfer new page (`src/app/(auth)/inventory/documents/transfers/new/page.tsx`)

### 🚧 Remaining Work

## 1. Transfer Detail Page
**File:** `src/app/(auth)/inventory/documents/transfers/[id]/page.tsx`

**Changes needed:**
- Replace `from_virtual_warehouse_type` → `from_virtual_warehouse_id`
- Replace `to_virtual_warehouse_type` → `to_virtual_warehouse_id`
- Display `generated_issue_id` and `generated_receipt_id` (NEW FEATURE)
- Show links to auto-generated documents

**Example:**
```tsx
{transfer.generated_issue_id && (
  <div>
    <Label>Phiếu xuất tự động</Label>
    <Link href={`/inventory/documents/issues/${transfer.generated_issue_id}`}>
      Xem phiếu xuất
    </Link>
  </div>
)}
```

---

## 2. Receipt Forms

### 2.1 Receipt New Page
**File:** `src/app/(auth)/inventory/documents/receipts/new/page.tsx`

**Changes needed:**
1. **Type Selector** - Change from 5 options to 2:
```tsx
// OLD:
const RECEIPT_TYPES = [
  { value: "supplier_receipt", label: "Nhập từ nhà cung cấp" },
  { value: "rma_return", label: "RMA Return" },
  { value: "transfer_in", label: "Chuyển kho vào" },
  { value: "breakdown", label: "Tách linh kiện" },
  { value: "adjustment_in", label: "Điều chỉnh tăng" },
];

// NEW:
const RECEIPT_TYPES = [
  { value: "normal", label: "Phiếu nhập bình thường" },
  { value: "adjustment", label: "Phiếu điều chỉnh (kiểm kê)" },
];
```

2. **Warehouse Selector** - Use virtual warehouse IDs:
```tsx
// ADD:
const { data: virtualWarehouses } = trpc.warehouse.listVirtualWarehouses.useQuery();

// CHANGE state:
const [virtualWarehouseId, setVirtualWarehouseId] = useState("");

// CHANGE Select:
<Select value={virtualWarehouseId} onValueChange={setVirtualWarehouseId}>
  {virtualWarehouses?.map((wh) => (
    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
  ))}
</Select>
```

3. **Mutation Call:**
```tsx
// OLD:
virtualWarehouseType: warehouseType,
physicalWarehouseId: physicalWarehouseId,

// NEW:
virtualWarehouseId: virtualWarehouseId,
```

4. **Quantity Input** - Allow negative for adjustments:
```tsx
{receiptType === 'adjustment' && (
  <p className="text-sm text-muted-foreground">
    💡 Phiếu điều chỉnh: số dương = tăng stock, số âm = giảm stock
  </p>
)}

<Input
  type="number"
  value={item.declaredQuantity}
  onChange={(e) => handleItemChange(index, "declaredQuantity", parseInt(e.target.value))}
  // Remove min="1" for adjustment type
/>
```

### 2.2 Receipt Detail Page
**File:** `src/app/(auth)/inventory/documents/receipts/[id]/page.tsx`

**Changes needed:**
- Display warehouse name from `virtual_warehouse_id` instead of type
- Update type badge to show 'normal' or 'adjustment'
- Show negative quantities with color coding (red for negative)

---

## 3. Issue Forms

### 3.1 Issue New Page
**File:** `src/app/(auth)/inventory/documents/issues/new/page.tsx`

**Same changes as Receipt New Page:**
1. Type selector: 2 options (normal, adjustment)
2. Warehouse selector: Use virtual warehouse IDs
3. Allow negative quantities for adjustments
4. Update mutation call

### 3.2 Issue Detail Page
**File:** `src/app/(auth)/inventory/documents/issues/[id]/page.tsx`

**Changes needed:**
- Display warehouse name from `virtual_warehouse_id`
- Update type badge
- Show negative quantities with color coding

---

## 4. Inventory Overview Components

### Files to Update:
- `src/components/inventory/overview/inventory-table-virtual.tsx`
- `src/components/inventory/overview/inventory-table-all.tsx`
- `src/app/(auth)/inventory/overview/page.tsx`

**Changes needed in all:**

1. **Replace field references:**
```tsx
// OLD:
item.virtual_warehouse_type

// NEW:
item.virtual_warehouse_id
item.virtual_warehouse_name  // New field from view
```

2. **Table Key:**
```tsx
// OLD:
key={`${item.product_id}-${item.virtual_warehouse_type}`}

// NEW:
key={`${item.product_id}-${item.virtual_warehouse_id}`}
```

3. **Display:**
```tsx
// Show warehouse name instead of type
<TableCell>{item.virtual_warehouse_name}</TableCell>
```

---

## 5. Search/Filter Components

Any component filtering by warehouse type needs update:

```tsx
// OLD:
.eq("virtual_warehouse_type", selectedType)

// NEW:
.eq("virtual_warehouse_id", selectedWarehouseId)
```

---

## 🎯 Quick Find & Replace Guide

### Global Replacements (be careful with context):

1. **State Variables:**
```
fromWarehouseType → fromWarehouseId
toWarehouseType → toWarehouseId
warehouseType → warehouseId
virtual_warehouse_type → virtual_warehouse_id
```

2. **Mutation Parameters:**
```
virtualWarehouseType → virtualWarehouseId
physicalWarehouseId → (remove - no longer needed)
fromVirtualWarehouseType → fromVirtualWarehouseId
toVirtualWarehouseType → toVirtualWarehouseId
```

3. **Warehouse Type Arrays:**
Replace hardcoded arrays with API call:
```tsx
const { data: virtualWarehouses } = trpc.warehouse.listVirtualWarehouses.useQuery();
```

4. **Receipt/Issue Type:**
```
"supplier_receipt" | "rma_return" | etc → "normal" | "adjustment"
```

---

## 🧪 Testing Checklist

After all changes:

1. **Transfers:**
   - [ ] Create transfer (select virtual warehouses)
   - [ ] Approve transfer → verify auto-generated issue + receipt
   - [ ] Complete transfer → verify both documents completed
   - [ ] Check stock updated correctly

2. **Receipts:**
   - [ ] Create normal receipt
   - [ ] Create adjustment receipt with negative quantity
   - [ ] Verify stock increases (positive) or decreases (negative)
   - [ ] Submit for approval

3. **Issues:**
   - [ ] Create normal issue
   - [ ] Create adjustment issue with negative quantity
   - [ ] Verify stock decreases (positive) or increases (negative)
   - [ ] Submit for approval

4. **Stock Overview:**
   - [ ] View stock by virtual warehouse
   - [ ] Verify warehouse names display correctly
   - [ ] Check filters work with new structure

---

## 📝 Notes

### Important Reminders:

1. **Negative Quantities Only for Adjustments:**
   - Normal receipts/issues: must be positive
   - Adjustment receipts/issues: can be positive or negative (but not zero)
   - Frontend should validate this

2. **Warehouse Display:**
   - Old: "Kho Bảo Hành" (type name)
   - New: "Warehouse A - Kho Chính" (virtual warehouse instance name)

3. **Auto-Generated Documents:**
   - Only show for transfers with status >= 'approved'
   - Links should be visible in transfer detail page
   - Both documents link back to the transfer

4. **Type Labels:**
   - Consider Vietnamese labels:
     - normal → "Bình thường"
     - adjustment → "Điều chỉnh"

---

## 🚀 Suggested Order of Implementation

1. ✅ Transfer new page (DONE)
2. **Next: Receipt new page** (most commonly used)
3. Issue new page (similar to receipt)
4. Transfer detail page (show auto-generated docs)
5. Receipt/Issue detail pages
6. Inventory overview components
7. Final testing

---

## 🆘 Common Issues & Solutions

### Issue: Warehouse dropdown empty
**Solution:** Make sure `trpc.warehouse.listVirtualWarehouses` is called

### Issue: Type validation fails
**Solution:** Check Zod schema updated to accept 'normal' | 'adjustment'

### Issue: Negative quantity rejected
**Solution:** Only allowed for adjustment type, check frontend validation

### Issue: Transfer doesn't create documents
**Solution:** Database trigger only fires on status='approved', check database logs

---

**Last Updated:** 2025-10-28
**Status:** Backend complete, Frontend 20% complete
