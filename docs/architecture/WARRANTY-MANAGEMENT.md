# Warranty Management System

**Version:** 2.0 (NEW ARCHITECTURE)
**Date:** 2025-10-29
**Status:** Implemented

---

## Overview

The warranty management system has been redesigned to use a **dual end-date model** that separates warranty tracking from stock receipt workflow, providing greater flexibility and accuracy.

---

## Data Model

### Physical Products Table

```sql
-- Warranty fields in physical_products table
manufacturer_warranty_end_date DATE NULL  -- Warranty from manufacturer
user_warranty_end_date        DATE NULL  -- Extended warranty for end user
```

**Key Changes from Old Schema:**
```
OLD SCHEMA (v1.0):                    NEW SCHEMA (v2.0):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
warranty_start_date DATE      →       manufacturer_warranty_end_date DATE
warranty_months     INTEGER   →       user_warranty_end_date        DATE
warranty_end_date   DATE      →       [removed - calculated field]
```

---

## Workflow

### 1. Stock Receipt Phase (NO WARRANTY)

**When:** Creating stock receipts and adding serials
**Where:** `/inventory/documents/receipts`

```
Action: Add serials to receipt
Input:  Serial numbers ONLY
Result: physical_products created with warranty fields = NULL
```

**CSV Format (Serial Entry):**
```csv
serial_number
SN001
SN002
SN003
```

✅ **No warranty information required**
✅ **Simplified data entry**
✅ **Focus on inventory tracking first**

---

### 2. Warranty Management Phase (AFTER STOCK RECEIPT)

**When:** After products are in inventory
**Where:** `/inventory/products`

#### A. Individual Product Update

1. Navigate to **Inventory → Products**
2. Find product by serial number
3. Click **Edit** button (✏️)
4. Update warranty dates:
   - **Ngày Hết Hạn BH Nhà Máy** (Manufacturer)
   - **Ngày Hết Hạn BH User** (End User)
5. Click **Save**

**Date Format:** `YYYY-MM-DD`

#### B. Bulk Update via CSV

1. Navigate to **Inventory → Products**
2. Click **"Cập Nhật BH Hàng Loạt"** button
3. Upload CSV file

**CSV Format (Bulk Warranty Update):**
```csv
serial_number,manufacturer_warranty_end_date,user_warranty_end_date
SN001,2025-12-31,2026-12-31
SN002,2026-06-30,2027-06-30
SN003,2025-09-15,2026-09-15
```

✅ **All 3 columns required**
✅ **Can update hundreds of products at once**
✅ **Validation on date format and serial existence**

---

## Warranty Status Logic

### Priority Rules

When determining warranty status, the system uses:

```
1. Check user_warranty_end_date FIRST (if present)
2. Fallback to manufacturer_warranty_end_date (if user is NULL)
3. If both NULL → "no_warranty"
```

### Status Calculation

```typescript
const warrantyEndDate = user_warranty_end_date || manufacturer_warranty_end_date || null;

if (!warrantyEndDate) {
  status = "no_warranty"
} else if (warrantyEndDate < today) {
  status = "expired"
} else if (warrantyEndDate <= today + 30 days) {
  status = "expiring_soon"
} else {
  status = "active"
}
```

---

## Display Format

### Product Inventory Table

| Serial | Product | Warehouse | Condition | **BH Nhà Máy** | **BH Người Dùng** | Actions |
|--------|---------|-----------|-----------|----------------|-------------------|---------|
| SN001  | RTX 4070| Main      | New       | 31/12/2025     | 31/12/2026        | [Edit]  |
| SN002  | RTX 4060| Main      | New       | 30/06/2026     | —                 | [Edit]  |

**Color Coding:**
- 🔴 **Red text** - Expired (date < today)
- ⚫ **Normal text** - Active (date >= today)
- ⚪ **Gray dash (—)** - No warranty data

### Edit Product Drawer

```
┌─────────────────────────────────┐
│  Sửa Sản Phẩm Vật Lý           │
├─────────────────────────────────┤
│ Product: RTX 4070 Ti            │
│ SKU: ZT4070-001                 │
├─────────────────────────────────┤
│ Số Serial *                     │
│ [SN001                      ]   │
├─────────────────────────────────┤
│ Ngày Hết Hạn BH Nhà Máy        │
│ [📅 2025-12-31              ]   │
│ Format: YYYY-MM-DD              │
├─────────────────────────────────┤
│ Ngày Hết Hạn BH User           │
│ [📅 2026-12-31              ]   │
│ Format: YYYY-MM-DD              │
├─────────────────────────────────┤
│            [Hủy]  [Lưu]         │
└─────────────────────────────────┘
```

---

## API Endpoints (tRPC)

### Individual Update
```typescript
physicalProducts.updateProduct({
  id: "uuid",
  serial_number: "SN001",
  manufacturer_warranty_end_date: "2025-12-31", // Optional
  user_warranty_end_date: "2026-12-31"          // Optional
})
```

### Bulk Update
```typescript
physicalProducts.bulkUpdateWarranty({
  updates: [
    {
      serial_number: "SN001",
      manufacturer_warranty_end_date: "2025-12-31",
      user_warranty_end_date: "2026-12-31"
    },
    // ... more updates
  ]
})
```

### Serial Entry (NO WARRANTY)
```typescript
inventory.serials.bulkImportCSV({
  receiptItemId: "uuid",
  csvData: "serial_number\nSN001\nSN002\nSN003"
  // No warranty fields!
})
```

---

## Database Views

### v_warranty_expiring_soon

```sql
CREATE OR REPLACE VIEW v_warranty_expiring_soon AS
SELECT
  pp.id,
  pp.serial_number,
  pp.product_id,
  p.name AS product_name,
  vw.warehouse_type,
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
JOIN products p ON pp.product_id = p.id
JOIN virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
WHERE (pp.user_warranty_end_date IS NOT NULL
       AND pp.user_warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
   OR (pp.user_warranty_end_date IS NULL
       AND pp.manufacturer_warranty_end_date IS NOT NULL
       AND pp.manufacturer_warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days');
```

---

## Migration Notes

### Dropped Elements

```sql
-- Old triggers (REMOVED)
DROP TRIGGER trigger_physical_products_warranty_calculation;
DROP TRIGGER trigger_physical_products_end_user_warranty_calculation;
DROP FUNCTION calculate_physical_product_warranty_end_date();
DROP FUNCTION calculate_end_user_warranty_end_date();

-- Old columns (REMOVED)
ALTER TABLE physical_products
  DROP COLUMN warranty_start_date,
  DROP COLUMN warranty_months,
  DROP COLUMN warranty_end_date,
  DROP COLUMN end_user_warranty_start,
  DROP COLUMN end_user_warranty_months,
  DROP COLUMN end_user_warranty_end;

-- Old columns in receipt tables (REMOVED)
ALTER TABLE stock_receipt_items
  DROP COLUMN warranty_start_date,
  DROP COLUMN warranty_months;
```

### New Schema

```sql
-- Physical products (CURRENT)
ALTER TABLE physical_products
  ADD COLUMN manufacturer_warranty_end_date DATE NULL,
  ADD COLUMN user_warranty_end_date DATE NULL;

-- Stock receipt serials (CURRENT)
ALTER TABLE stock_receipt_serials
  ADD COLUMN manufacturer_warranty_end_date DATE NULL,
  ADD COLUMN user_warranty_end_date DATE NULL;
```

---

## Best Practices

### ✅ DO

- Add serials first during stock receipt (without warranty)
- Update warranty information later in Products page
- Use bulk CSV update for large batches
- Provide both manufacturer and user warranty when available
- Use date format YYYY-MM-DD consistently

### ❌ DON'T

- Don't try to enter warranty during serial entry
- Don't use old calculated fields (warranty_end_date)
- Don't mix date formats
- Don't require warranty for all products (optional)

---

## User Roles & Permissions

| Action | Admin | Manager | Technician | Reception |
|--------|-------|---------|------------|-----------|
| View warranty | ✅ | ✅ | ✅ | ✅ |
| Update warranty (individual) | ✅ | ✅ | ❌ | ❌ |
| Bulk update warranty | ✅ | ✅ | ❌ | ❌ |
| Serial entry (no warranty) | ✅ | ✅ | ✅ | ❌ |

---

## Testing Checklist

- [ ] Stock receipt without warranty → Success
- [ ] Serial entry CSV (serial only) → Success
- [ ] Individual warranty update → Fields saved correctly
- [ ] Bulk warranty CSV → All updates applied
- [ ] Warranty status calculation → Priority correct (user > manufacturer)
- [ ] Expiring soon view → Shows products within 30 days
- [ ] Edit drawer date pickers → Functional
- [ ] Bulk update validation → Rejects invalid dates/serials

---

## Related Documentation

- [Inventory Management Schema](./inventory-management-schema.md) - Full database schema
- [PRD Requirements](../prd/02-requirements.md) - Business requirements
- [CLAUDE.md](../../CLAUDE.md) - Development guide

---

**Last Updated:** 2025-10-29
**Implemented By:** Winston & Claude
