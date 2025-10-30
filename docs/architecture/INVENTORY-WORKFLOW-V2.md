# Inventory Document Workflow v2.0

**Date:** 2025-10-29
**Status:** ✅ Implemented
**Migration:** `20251029_add_stock_update_triggers.sql`

---

## 🎯 Overview

Major workflow simplification that decouples stock updates from serial entry completion, enabling immediate stock visibility while maintaining full traceability.

### Key Principles

1. **Stock updates on approval** - Not waiting for serial completion
2. **Serial entry is non-blocking** - Can happen before or after approval
3. **Auto-complete at 100%** - Documents transition to completed when serials reach declared quantity
4. **No in_transit state** - Simplified transfer workflow to match receipts/issues

---

## 📋 Receipt Workflow

### Status Flow

```
Draft → Pending Approval → Approved → Completed
  ↓
Cancelled
```

### State Transitions

| From | To | Trigger | Stock Impact | Serial Impact |
|------|----|---------|--------------| --------------|
| draft | pending_approval | Manager submits | None | None |
| pending_approval | approved | Manager approves | ✅ **Stock +qty** | Can continue adding |
| pending_approval | cancelled | Manager rejects | None | None |
| approved | completed | Serials reach 100% | None (already updated) | Entry complete |

### Business Logic

```typescript
// On Approval (Database Trigger)
function update_stock_on_receipt_approval() {
  for each item in receipt {
    stock[warehouse][product] += item.declared_quantity
  }
}

// On Serial Entry (Application Logic)
function addSerials() {
  // Add serials
  insert_serials()

  // Check if complete
  if (total_serials >= total_declared_quantity && status === 'approved') {
    status = 'completed'
    completed_at = now()
  }
}
```

### Key Features

- ✅ Manager can approve with 0% serials
- ✅ Stock visible immediately after approval
- ✅ Technicians can add serials gradually
- ✅ Auto-completes when 100% serials entered
- ✅ Status remains 'approved' until 100% (not blocking)

---

## 📤 Issue Workflow

### Status Flow

```
Draft → Pending Approval → Approved → Completed
  ↓
Cancelled
```

### State Transitions

| From | To | Trigger | Stock Impact | Serial Impact |
|------|----|---------|--------------| --------------|
| draft | pending_approval | Manager submits | None | None |
| pending_approval | approved | Manager approves | ✅ **Stock -qty** | Can continue selecting |
| pending_approval | cancelled | Manager rejects | None | None |
| approved | completed | Serials reach 100% | None (already updated) | Selection complete |

### Business Logic

```typescript
// On Approval (Database Trigger)
function update_stock_on_issue_approval() {
  for each item in issue {
    stock[warehouse][product] -= item.quantity
  }
}

// On Serial Selection (Application Logic)
function selectSerialsByNumbers() {
  // Select serials from available stock
  insert_issue_serials()

  // Check if complete
  if (total_serials >= total_quantity && status === 'approved') {
    status = 'completed'
    completed_at = now()
  }
}
```

### Key Features

- ✅ Manager can approve with 0% serials
- ✅ Stock reduced immediately (reserved for issue)
- ✅ Technicians select serials from available stock
- ✅ Auto-completes when 100% serials selected
- ✅ Can select serials before or after approval

---

## 🔄 Transfer Workflow

### Status Flow (Simplified - No in_transit)

```
Draft → Pending Approval → Approved → Completed
  ↓
Cancelled
```

### State Transitions

| From | To | Trigger | Stock Impact | Auto-Generation |
|------|----|---------|--------------| ----------------|
| draft | pending_approval | Manager submits | None | None |
| pending_approval | approved | Manager approves | ✅ **Source -qty, Dest +qty** | Creates Issue + Receipt |
| pending_approval | cancelled | Manager rejects | None | None |
| approved | completed | Serials reach 100% | None (already updated) | Completes Issue + Receipt |

### Auto-Generation on Approval

```typescript
// Database Trigger: auto_generate_transfer_documents()
function on_transfer_approved() {
  // 1. Create Issue (source warehouse)
  issue = create_issue({
    warehouse: transfer.from_warehouse,
    status: 'approved',  // Pre-approved
    items: transfer.items
  })

  // 2. Create Receipt (destination warehouse)
  receipt = create_receipt({
    warehouse: transfer.to_warehouse,
    status: 'approved',  // Pre-approved
    items: transfer.items
  })

  // 3. Link documents
  transfer.generated_issue_id = issue.id
  transfer.generated_receipt_id = receipt.id

  // 4. Stock triggers fire automatically
  // - Issue trigger: stock[source][product] -= qty
  // - Receipt trigger: stock[dest][product] += qty
}
```

### Auto-Completion at 100%

```typescript
// Application Logic
function selectSerialsByNumbers_Transfer() {
  // Select serials
  insert_transfer_serials()

  // Check if complete
  if (total_serials >= total_quantity && status === 'approved') {
    // Update transfer
    transfer.status = 'completed'
    transfer.completed_at = now()

    // Update generated documents
    issue.status = 'completed'
    receipt.status = 'completed'
  }
}
```

### Key Changes from v1

- ❌ **Removed:** `in_transit` state
- ✅ **Added:** Stock updates on approval (not completion)
- ✅ **Added:** Auto-complete at 100% serials
- ✅ **Simplified:** Matches receipt/issue workflow pattern

---

## 🗄️ Database Triggers

### Helper Function

```sql
CREATE FUNCTION public.upsert_product_stock(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity_delta INT
)
```

**Purpose:** Update or create stock record with quantity delta

**Usage:**
```sql
-- Increment stock
PERFORM upsert_product_stock(product_id, warehouse_id, +10);

-- Decrement stock
PERFORM upsert_product_stock(product_id, warehouse_id, -5);

-- Adjustment (can be negative)
PERFORM upsert_product_stock(product_id, warehouse_id, -3);
```

### Receipt Approval Trigger

```sql
CREATE TRIGGER trigger_update_stock_on_receipt_approval
  AFTER UPDATE ON public.stock_receipts
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION update_stock_on_receipt_approval();
```

**Fires when:** Receipt transitions to 'approved'
**Action:** Increments stock for all items
**Effect:** Stock immediately visible in system

### Issue Approval Trigger

```sql
CREATE TRIGGER trigger_update_stock_on_issue_approval
  AFTER UPDATE ON public.stock_issues
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION update_stock_on_issue_approval();
```

**Fires when:** Issue transitions to 'approved'
**Action:** Decrements stock for all items
**Effect:** Stock reserved/reduced immediately

---

## 🔍 Application Logic (Auto-Complete)

### Implementation Locations

**Receipts:** `src/server/routers/inventory/receipts.ts:404-449`
```typescript
addSerials: mutation({
  // ... add serials logic

  // Auto-complete check
  const receipt = await getReceipt(receiptItemId)
  if (receipt.status === 'approved') {
    const allItems = await getAllReceiptItems(receipt.id)
    const totalDeclared = sum(allItems.declared_quantity)
    const totalSerials = sum(allItems.serials.length)

    if (totalSerials >= totalDeclared) {
      await update_receipt({
        status: 'completed',
        completed_at: now(),
        completed_by_id: user.id
      })
    }
  }
})
```

**Issues:** `src/server/routers/inventory/issues.ts:397-442, 543-588`
```typescript
selectSerialsByNumbers: mutation({
  // ... select serials logic

  // Auto-complete check
  const issue = await getIssue(issueItemId)
  if (issue.status === 'approved') {
    const allItems = await getAllIssueItems(issue.id)
    const totalQuantity = sum(allItems.quantity)
    const totalSerials = sum(allItems.serials.length)

    if (totalSerials >= totalQuantity) {
      await update_issue({
        status: 'completed',
        completed_at: now(),
        completed_by_id: user.id
      })
    }
  }
})
```

**Transfers:** `src/server/routers/inventory/transfers.ts:454-499, 600-645`
```typescript
selectSerialsByNumbers: mutation({
  // ... select serials logic

  // Auto-complete check
  const transfer = await getTransfer(transferItemId)
  if (transfer.status === 'approved') {
    const allItems = await getAllTransferItems(transfer.id)
    const totalQuantity = sum(allItems.quantity)
    const totalSerials = sum(allItems.serials.length)

    if (totalSerials >= totalQuantity) {
      await update_transfer({
        status: 'completed',
        completed_at: now(),
        received_by_id: user.id
      })

      // Also complete generated documents
      await update_issue({ status: 'completed' })
      await update_receipt({ status: 'completed' })
    }
  }
})
```

---

## 📊 Status Matrix

### Receipt/Issue Status Meanings

| Status | Stock Updated | Serials Required | Can Add Serials | Can Edit |
|--------|---------------|------------------|-----------------|----------|
| draft | ❌ | No | ✅ | ✅ |
| pending_approval | ❌ | No | ✅ | ❌ |
| approved | ✅ **YES** | No (can be 0%) | ✅ | ❌ |
| completed | ✅ | Yes (100%) | ❌ | ❌ |
| cancelled | ❌ | N/A | ❌ | ❌ |

### Transfer Status Meanings

| Status | Stock Updated | Auto-Generated | Can Select Serials | Can Edit |
|--------|---------------|----------------|-------------------|----------|
| draft | ❌ | No | ✅ | ✅ |
| pending_approval | ❌ | No | ✅ | ❌ |
| approved | ✅ **YES** | ✅ Issue + Receipt | ✅ | ❌ |
| completed | ✅ | Completed | ❌ | ❌ |
| cancelled | ❌ | No | ❌ | ❌ |

---

## 🎯 Business Benefits

### Before (Old Workflow)

```
Approve → Wait for 100% serials → Stock update
  ↓
❌ Stock not visible until completion
❌ Blocks warehouse from using stock
❌ Serial entry becomes bottleneck
```

### After (New Workflow)

```
Approve → Stock update immediately → Serial entry (parallel)
  ↓
✅ Stock visible right away
✅ Warehouse can use stock before serials complete
✅ Serial entry non-blocking
✅ Auto-complete when done
```

### Concrete Example

**Scenario:** Receipt of 100 products

| Old Workflow | New Workflow |
|--------------|--------------|
| Day 1: Approve → Wait | Day 1: Approve → **Stock +100** |
| Day 2: Enter 50 serials | Day 2: Enter 50 serials (stock already available) |
| Day 3: Enter 50 serials → Stock +100 | Day 3: Enter 50 serials → Auto-complete ✅ |
| **Result:** Stock unavailable for 3 days | **Result:** Stock available from Day 1 |

---

## 🧪 Testing Scenarios

### Test 1: Receipt with Gradual Serial Entry

1. Create receipt (qty: 10)
2. Submit for approval
3. Approve → **Verify stock +10**
4. Add 5 serials → Status still 'approved'
5. Add 5 more serials → **Verify auto-complete**

### Test 2: Issue Before Approval Serial Selection

1. Create issue (qty: 5)
2. Select 3 serials (while draft)
3. Submit for approval
4. Approve → **Verify stock -5**
5. Select 2 more serials → **Verify auto-complete**

### Test 3: Transfer Stock Updates

1. Create transfer (source: W1, dest: W2, qty: 10)
2. Submit for approval
3. Approve → **Verify W1 stock -10, W2 stock +10**
4. Select 10 serials → **Verify auto-complete + generated docs complete**

---

## 📎 Document Attachments

### Purpose

Staff can attach scanned documents or photos to inventory documents (receipts, issues, transfers) for audit trail and verification.

### Implementation

**Table:** `stock_document_attachments`

```sql
CREATE TABLE stock_document_attachments (
  id UUID PRIMARY KEY,
  document_type VARCHAR(50) NOT NULL,  -- 'receipt', 'issue', 'transfer'
  document_id UUID NOT NULL,           -- FK to the document
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,             -- Storage bucket path
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
```

### Permissions

- **Admin/Manager:** Full access (upload, view, delete)
- **Technician:** View all, upload own
- **Reception:** No access

### Use Cases

- Scanned delivery notes for receipts
- Photos of damaged items for issues
- Authorization documents for transfers
- Proof of delivery for customer_installed warehouse transfers

---

## 📝 Migration History

| Date | Migration | Description |
|------|-----------|-------------|
| 2025-10-28 | 20251028160000_* | Initial inventory redesign |
| 2025-10-29 | 20251029_add_stock_update_triggers.sql | **Stock update triggers** |
| 2025-10-30 | 20251030014845_init_schema.sql | Added stock_document_attachments, auto_complete_service_request |

---

## 🔗 Related Documentation

- **Schema:** `docs/data/schemas/16_inventory_documents.sql` (includes stock_document_attachments)
- **Schema:** `docs/data/schemas/05_service_requests.sql` (includes auto_complete_service_request)
- **Triggers:** `docs/data/schemas/17_stock_update_triggers.sql`
- **Summary:** `docs/INVENTORY-REDESIGN-SUMMARY.md`
- **CLAUDE.md:** Updated with new workflow notes

---

**Last Updated:** 2025-10-30
**Version:** 2.1
**Status:** ✅ Implemented and Tested
