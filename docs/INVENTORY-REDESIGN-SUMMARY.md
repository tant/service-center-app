# Inventory System Redesign - Implementation Summary

## 📅 Date: 2025-10-28

## 🎯 Overview

Completed comprehensive redesign of inventory management system with simplified types and virtual warehouse references.

---

## ✨ Key Changes

### 1. **Simplified Document Types**

**Before:**
- Receipt types: 5 types (supplier_receipt, rma_return, transfer_in, breakdown, adjustment_in)
- Issue types: 6 types (warranty_return, parts_usage, rma_out, transfer_out, disposal, adjustment_out)

**After:**
- Receipt types: 2 types (**normal**, **adjustment**)
- Issue types: 2 types (**normal**, **adjustment**)

### 2. **Virtual Warehouse Reference**

**Before:**
```sql
virtual_warehouse_type public.warehouse_type NOT NULL,
physical_warehouse_id UUID REFERENCES physical_warehouses(id)
```

**After:**
```sql
virtual_warehouse_id UUID NOT NULL REFERENCES virtual_warehouses(id)
```

All inventory documents now reference **specific virtual warehouse instances** rather than warehouse types.

### 3. **Adjustment Document Behavior**

- **Receipts and Issues** can now have **negative quantities** when type is `adjustment`
- Allows single document for inventory corrections (increase or decrease)
- Requires detailed notes explaining the adjustment reason

### 4. **Transfer Auto-Generation**

New feature: When a transfer is **approved**, the system automatically:

1. Creates **Issue document** (Phiếu Xuất) from source warehouse
2. Creates **Receipt document** (Phiếu Nhập) to destination warehouse
3. Copies all items and serials to both documents
4. Stores references in `generated_issue_id` and `generated_receipt_id`
5. When transfer **completes**, both documents are auto-completed

**Schema:**
```sql
stock_transfers (
  ...
  generated_issue_id UUID REFERENCES stock_issues(id),
  generated_receipt_id UUID REFERENCES stock_receipts(id)
)
```

---

## 📁 Migration Files

### Applied Migrations

1. **20251028160000_inventory_redesign_part1_drop_old.sql**
   - Drops existing inventory tables and ENUMs
   - Clean slate approach

2. **20251028160001_inventory_redesign_part2_enums.sql**
   - Creates new simplified ENUM types
   - Recreates sequences

3. **20251028160002_inventory_redesign_part3_receipts.sql**
   - Recreates `stock_receipts` with `virtual_warehouse_id`
   - Allows negative quantities in `stock_receipt_items`

4. **20251028160003_inventory_redesign_part4_issues.sql**
   - Recreates `stock_issues` with `virtual_warehouse_id`
   - Allows negative quantities in `stock_issue_items`

5. **20251028160004_inventory_redesign_part5_transfers.sql**
   - Recreates `stock_transfers` with auto-generation columns
   - References source and destination virtual warehouses

6. **20251028160005_inventory_redesign_part6_stock.sql**
   - Recreates `product_warehouse_stock` with simplified schema
   - Single unique constraint on `(product_id, virtual_warehouse_id)`

7. **20251028160006_inventory_redesign_part7_triggers.sql**
   - Creates `auto_generate_transfer_documents()` trigger
   - Creates `auto_complete_transfer_documents()` trigger

8. **20251028160007_recreate_views.sql**
   - Recreates `v_stock_summary` view with new schema
   - Recreates `v_pending_approvals` view
   - Updates helper functions

### Schema Source Files

**New file:** `docs/data/schemas/16_inventory_documents.sql`
- Complete source of truth for inventory system
- Includes all tables, ENUMs, triggers, and views

---

## 🔄 Workflow Changes

### Receipt Workflow

```
Draft → Pending Approval → Approved → Completed
  ↓
Cancelled
```

- **Normal receipts**: Standard intake (supplier, RMA return, etc.)
- **Adjustment receipts**: Inventory corrections from stocktake

### Issue Workflow

```
Draft → Pending Approval → Approved → Completed
  ↓
Cancelled
```

- **Normal issues**: Standard outbound (warranty, parts usage, disposal, etc.)
- **Adjustment issues**: Inventory corrections from stocktake

### Transfer Workflow (NEW)

```
Draft → Pending Approval → Approved → In Transit → Completed
  ↓                          ↓
Cancelled              Auto-generate Issue + Receipt
                              ↓
                         Completed → Auto-complete Issue + Receipt
```

**Key Points:**
- Transfer approval triggers automatic document creation
- Transfer completion triggers automatic document completion
- Stock updates happen when auto-generated documents complete

---

## 📊 Database Schema

### Core Tables

| Table | Purpose | Key Change |
|-------|---------|------------|
| `stock_receipts` | Phiếu Nhập Kho | Uses `virtual_warehouse_id` |
| `stock_receipt_items` | Receipt line items | Allows negative quantities |
| `stock_receipt_serials` | Serial tracking | Unchanged |
| `stock_issues` | Phiếu Xuất Kho | Uses `virtual_warehouse_id` |
| `stock_issue_items` | Issue line items | Allows negative quantities |
| `stock_issue_serials` | Serial tracking | Unchanged |
| `stock_transfers` | Phiếu Chuyển Kho | Auto-generation columns added |
| `stock_transfer_items` | Transfer line items | Unchanged |
| `stock_transfer_serials` | Serial tracking | Unchanged |
| `product_warehouse_stock` | Stock tracking | Simplified to `(product, warehouse)` |

### ENUMs

```sql
-- Receipt Types
CREATE TYPE stock_receipt_type AS ENUM ('normal', 'adjustment');

-- Issue Types
CREATE TYPE stock_issue_type AS ENUM ('normal', 'adjustment');

-- Document Status
CREATE TYPE stock_document_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'completed', 'cancelled'
);

-- Transfer Status
CREATE TYPE transfer_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'in_transit', 'completed', 'cancelled'
);
```

---

## 🎨 Frontend Impact

### Required Updates

1. **Warehouse Selection**
   - Change from dropdown with (type + physical warehouse) to dropdown of virtual warehouse instances
   - Example: Instead of "Warranty Stock + Warehouse A", show "Warehouse A - Kho Chính"

2. **Receipt/Issue Type Selection**
   - Simplify to 2-option radio: "Normal" or "Adjustment"
   - Add prominent notes field for adjustments

3. **Transfer Detail Page**
   - Show generated document links when available
   - Display: `Phiếu xuất: PX-2025-0001` and `Phiếu nhập: PN-2025-0002`

4. **Quantity Input for Adjustments**
   - Allow negative values when type is "adjustment"
   - Show warning/confirmation for negative quantities

### API Changes Needed

**tRPC Routers to Update:**
- `inventory.receipts.*` - Update warehouse parameter
- `inventory.issues.*` - Update warehouse parameter
- `inventory.transfers.*` - Add generated document fields
- `inventory.stock.*` - Update warehouse queries

**Key Changes:**
```typescript
// Before
interface CreateReceiptInput {
  virtual_warehouse_type: WarehouseType;
  physical_warehouse_id?: string;
}

// After
interface CreateReceiptInput {
  virtual_warehouse_id: string;
}
```

---

## ✅ Testing Checklist

- [x] Migrations applied successfully
- [x] Views recreated
- [x] Triggers created
- [ ] Test receipt creation (normal)
- [ ] Test receipt creation (adjustment with negative qty)
- [ ] Test issue creation (normal)
- [ ] Test issue creation (adjustment)
- [ ] Test transfer creation
- [ ] Test transfer approval (verify auto-generation)
- [ ] Test transfer completion (verify auto-completion)
- [ ] Test stock tracking accuracy

---

## 🚀 Next Steps

### Immediate (Must Do Before Code Changes)

1. **Update tRPC schemas** - Change Zod validators for warehouse references
2. **Update TypeScript types** - Reflect new ENUM values and fields
3. **Test migration on clean database** - Ensure reproducibility

### Frontend Development

1. **Update warehouse selector components**
2. **Simplify receipt/issue type selection**
3. **Add adjustment quantity warnings**
4. **Display generated documents in transfer detail**
5. **Update stock views to use virtual_warehouse_id**

### Backend Development

1. **Update tRPC procedures** - All inventory routers
2. **Add validation** - Negative quantities only for adjustments
3. **Update stock calculation functions**
4. **Add RLS policies** - If needed for new columns

### Testing

1. **Unit tests** - Trigger functions
2. **Integration tests** - Transfer auto-generation workflow
3. **E2E tests** - Full document workflows

---

## 📝 Design Decisions

### Why 2 types instead of many?

**Rationale:**
- Simplifies business logic
- Specific use cases (supplier, RMA, etc.) tracked via notes/reference numbers
- Easier to maintain and understand
- Frontend UI simpler

### Why allow negative quantities?

**Rationale:**
- Single document for increase/decrease adjustments
- Matches real-world stocktake processes
- Reduces document count
- Clear audit trail with notes

### Why auto-generate instead of manual?

**Rationale:**
- Ensures data consistency
- Reduces human error
- Maintains referential integrity
- Simplifies user workflow

---

## 🔧 Configuration

No configuration changes required. All behavior is controlled by database schema and triggers.

---

## 📚 References

- Schema source: `docs/data/schemas/16_inventory_documents.sql`
- Migration folder: `supabase/migrations/20251028160000_*`
- CLAUDE.md updated with inventory redesign notes

---

**Status:** ✅ **COMPLETED** - Ready for frontend/backend development
