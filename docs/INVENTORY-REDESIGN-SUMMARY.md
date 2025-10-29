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

## 🔄 Workflow Changes (Updated 2025-10-29)

### Receipt Workflow

```
Draft → Submit → Pending Approval → Approve → Approved
  ↓                                              ↓
Cancelled                                 ✅ STOCK UPDATED (via trigger)
                                                  ↓
                                          Serial Entry (0-100%)
                                                  ↓
                                          100% Complete → Auto-transition to Completed
```

- **Normal receipts**: Standard intake (supplier, RMA return, etc.)
- **Adjustment receipts**: Inventory corrections from stocktake
- **Stock update**: Happens IMMEDIATELY on approval, regardless of serial entry status
- **Auto-complete**: When serials reach 100% of declared quantity

### Issue Workflow

```
Draft → Submit → Pending Approval → Approve → Approved
  ↓                                              ↓
Cancelled                                 ✅ STOCK UPDATED (via trigger)
                                                  ↓
                                          Serial Selection (0-100%)
                                                  ↓
                                          100% Complete → Auto-transition to Completed
```

- **Normal issues**: Standard outbound (warranty, parts usage, disposal, etc.)
- **Adjustment issues**: Inventory corrections from stocktake
- **Stock update**: Happens IMMEDIATELY on approval, regardless of serial selection status
- **Auto-complete**: When serials reach 100% of declared quantity

### Transfer Workflow (Updated - Removed in_transit)

```
Draft → Submit → Pending Approval → Approve → Approved
  ↓                                              ↓
Cancelled                              Auto-generate Issue + Receipt (both approved)
                                                  ↓
                                          ✅ STOCK UPDATED (source -qty, dest +qty)
                                                  ↓
                                          Serial Selection (0-100%)
                                                  ↓
                                          100% Complete → Auto-transition to Completed
                                                  ↓
                                          Auto-complete generated Issue + Receipt
```

**Key Changes (2025-10-29):**
- ❌ **Removed "in_transit" state** - Simplified to match receipt/issue workflow
- ✅ **Stock updates on approval** - No longer waits for completion
- ✅ **Auto-complete at 100% serials** - Automatic transition to completed status
- Transfer approval triggers automatic document creation (both status='approved')
- Stock updates happen immediately via issue/receipt triggers
- Serial entry can happen before or after approval (non-blocking)

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

-- Transfer Status (Updated 2025-10-29: Removed in_transit)
CREATE TYPE transfer_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'completed', 'cancelled'
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

## 🔥 Database Triggers (Added 2025-10-29)

### Stock Update Triggers

**Migration:** `supabase/migrations/20251029_add_stock_update_triggers.sql`

Three new functions and triggers to handle automatic stock updates:

#### 1. Helper Function: `upsert_product_stock()`
```sql
CREATE FUNCTION public.upsert_product_stock(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity_delta INT
)
```
- Updates or creates stock record with quantity delta
- Handles both positive and negative adjustments
- Used by receipt and issue approval triggers

#### 2. Receipt Approval Trigger: `update_stock_on_receipt_approval()`
```sql
CREATE TRIGGER trigger_update_stock_on_receipt_approval
  AFTER UPDATE ON public.stock_receipts
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
```
- **Fires when:** Receipt transitions to 'approved' status
- **Action:** Increments stock by `declared_quantity` for each item
- **Warehouse:** Uses `virtual_warehouse_id` from receipt

#### 3. Issue Approval Trigger: `update_stock_on_issue_approval()`
```sql
CREATE TRIGGER trigger_update_stock_on_issue_approval
  AFTER UPDATE ON public.stock_issues
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
```
- **Fires when:** Issue transitions to 'approved' status
- **Action:** Decrements stock by `quantity` for each item
- **Warehouse:** Uses `virtual_warehouse_id` from issue

### How Transfers Work with Triggers

When a transfer is approved:
1. `auto_generate_transfer_documents()` creates Issue + Receipt (both status='approved')
2. The above triggers fire automatically:
   - Issue trigger → Decrements stock from source warehouse
   - Receipt trigger → Increments stock in destination warehouse
3. Result: Immediate stock transfer between warehouses

### Schema Files

**New files:**
- `docs/data/schemas/17_stock_update_triggers.sql` - Stock trigger definitions
- `docs/data/schemas/18_remove_in_transit_status.sql` - Remove in_transit enum value

---

## 📚 References

- Schema source: `docs/data/schemas/16_inventory_documents.sql`
- Triggers source: `docs/data/schemas/17_stock_update_triggers.sql`
- Migration folder: `supabase/migrations/20251028160000_*`
- Stock triggers migration: `supabase/migrations/20251029_add_stock_update_triggers.sql`
- CLAUDE.md updated with inventory redesign notes

---

**Status:** ✅ **COMPLETED** - Stock updates on approval implemented (2025-10-29)
