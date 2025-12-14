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

## 📦 Physical Product Status Lifecycle

**Date Added:** 2025-11-05
**Status:** ✅ Implemented

### Overview

Physical products have a `status` field that tracks their lifecycle from creation through various warehouse transitions. This prevents double-selection and ensures data integrity.

### Status ENUM

```sql
CREATE TYPE public.physical_product_status AS ENUM (
  'draft',        -- From unapproved receipt (temporary, can be deleted)
  'active',       -- In stock, available (receipt approved)
  'transferring', -- In draft issue/transfer document (locked, cannot be selected)
  'issued',       -- Issued out (via approved stock issue document)
  'disposed'      -- Disposed/scrapped (no longer usable)
);
```

### Lifecycle Flow

```
Receipt Draft → draft (serial added)
    ↓
Receipt Approved → active (available in stock)
    ↓
Add to Issue/Transfer → transferring (locked, prevents double-selection)
    ↓
Issue Approved → issued (out of stock)
OR
Transfer Approved → active (in destination warehouse)
```

### Status Transitions

| Transition | Trigger | Business Rule |
|------------|---------|---------------|
| `NULL → draft` | Serial added to draft receipt | Products created immediately but marked as temporary |
| `draft → active` | Receipt approved | Products become available in stock |
| `active → transferring` | Serial added to draft issue/transfer | Product locked, cannot be selected by other documents |
| `transferring → active` | Serial removed from draft OR document cancelled | Unlock product, restore availability |
| `transferring → issued` | Issue approved | Product leaves warehouse permanently |
| `transferring → active` | Transfer approved | Product available in destination warehouse |
| `active → disposed` | Manual disposal operation | Product marked as scrapped/unusable |

### Key Benefits

1. **Prevents Double-Selection**
   - Products in `transferring` status cannot be selected by other documents
   - Only `active` products shown in selection lists

2. **Orphaned Data Cleanup**
   - Draft products automatically cleaned up when receipt cancelled
   - Transferring products restored to active when removed from draft documents

3. **Accurate Stock Counting**
   - Only `active` products count toward available stock
   - Excludes `draft` (not yet approved) and `transferring` (locked in documents)

4. **Full Audit Trail**
   - Every status change tracked
   - Complete product lifecycle history

### Validation Rules

**Receipt Serial Entry (3 Checkpoints):**
```typescript
// Only check ACTIVE products to avoid false positives
const duplicates = await supabase
  .from("physical_products")
  .select("serial_number")
  .in("serial_number", serialNumbers)
  .eq("status", "active");  // ✅ Exclude draft & transferring
```

**Issue/Transfer Serial Selection:**
```typescript
// Only allow selection of ACTIVE products
const products = await supabase
  .from("physical_products")
  .select("*")
  .eq("status", "active")  // ✅ Only active products
  .in("id", productIds);
```

### Database Triggers

**1. Create Draft Product (Receipt Serial Insert)**
```sql
CREATE TRIGGER trigger_create_physical_product_from_receipt_serial
  BEFORE INSERT ON stock_receipt_serials
  EXECUTE FUNCTION create_physical_product_from_receipt_serial();

-- Function sets: status = 'draft'
```

**2. Activate Products (Receipt Approval)**
```sql
CREATE TRIGGER trigger_activate_physical_products_on_receipt_approval
  AFTER UPDATE ON stock_receipts
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION activate_physical_products_on_receipt_approval();

-- Function updates: draft → active
```

**3. Lock Product (Issue/Transfer Serial Insert)**
```sql
CREATE TRIGGER trigger_mark_physical_product_as_transferring_on_issue
  AFTER INSERT ON stock_issue_serials
  EXECUTE FUNCTION mark_physical_product_as_transferring_on_issue();

-- Function updates: active → transferring

CREATE TRIGGER trigger_mark_physical_product_as_transferring_on_transfer
  AFTER INSERT ON stock_transfer_serials
  EXECUTE FUNCTION mark_physical_product_as_transferring_on_transfer();
```

**4. Restore Product (Serial Removal)**
```sql
CREATE TRIGGER trigger_restore_active_status_on_issue_serial_removal
  BEFORE DELETE ON stock_issue_serials
  EXECUTE FUNCTION restore_active_status_on_issue_serial_removal();

-- Function updates: transferring → active (if was transferring)

CREATE TRIGGER trigger_restore_active_status_on_transfer_serial_removal
  BEFORE DELETE ON stock_transfer_serials
  EXECUTE FUNCTION restore_active_status_on_transfer_serial_removal();
```

**5. Finalize Status (Document Approval)**
```sql
-- Issue approval: transferring → issued
CREATE TRIGGER trigger_mark_physical_products_as_issued_on_issue_approval
  AFTER UPDATE ON stock_issues
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION mark_physical_products_as_issued_on_issue_approval();

-- Transfer approval: transferring → active (in new warehouse)
CREATE TRIGGER trigger_restore_active_status_on_transfer_approval
  AFTER UPDATE ON stock_transfers
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION restore_active_status_on_transfer_approval();
```

**6. Restore on Cancellation**
```sql
CREATE TRIGGER trigger_restore_active_status_on_issue_cancel
  AFTER UPDATE ON stock_issues
  WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
  EXECUTE FUNCTION restore_active_status_on_issue_cancel();

CREATE TRIGGER trigger_restore_active_status_on_transfer_cancel
  AFTER UPDATE ON stock_transfers
  WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
  EXECUTE FUNCTION restore_active_status_on_transfer_cancel();

-- Both functions update: transferring → active
```

### Schema Location

- **ENUM Definition:** `docs/data/schemas/100_enums_and_sequences.sql` (lines 130-138)
- **Table Column:** `docs/data/schemas/202_task_and_warehouse.sql` (physical_products table)
- **Triggers:** `docs/data/schemas/600_stock_triggers.sql`
- **API Validation:** `src/server/routers/inventory/{receipts,issues,transfers}.ts`

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

## 📋 Serial Entry Task Automation

**Purpose:** Automate task creation and tracking for serial number entry using the polymorphic task system.

### Overview

When inventory receipts are approved, the system automatically creates serial entry tasks for technicians. Tasks track progress in real-time and auto-complete when serials reach 100%.

**Key Innovation:** Zero-touch workflow automation - no manual task creation or completion needed.

### Workflow

```
Receipt Approved
    ↓
Auto-Create Tasks (per product)
    ↓
Tasks Appear in Dashboard
    ↓
Technician Claims Task
    ↓
Enter Serials (progress tracked)
    ↓
Reaches 100% → Auto-Complete Task
    ↓
All Tasks Complete → Auto-Complete Receipt
```

### Database Schema

**Workflow Template:**
```sql
-- System workflow for serial entry
INSERT INTO workflows (id, name, entity_type, enforce_sequence)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'Serial Entry',
  'inventory_receipt',
  false  -- Serial entry can happen in any order
);

-- Link receipt to workflow
ALTER TABLE inventory_receipts
ADD COLUMN workflow_id UUID REFERENCES workflows(id);
```

**Task Creation:**
- Trigger fires on receipt approval
- Creates one `entity_task` per product in receipt
- Task name: "Enter serials for [Product Name]"
- `entity_type = 'inventory_receipt'`
- `assigned_to_id = NULL` (available to claim)

### Auto-Create Trigger

**Trigger:** `auto_create_serial_entry_tasks()`

**Fires When:** Receipt status → 'approved'

**Logic:**
```sql
1. Check if receipt has workflow_id
2. Check if tasks already exist (idempotency)
3. For EACH product in receipt:
   - Create entity_task
   - Set name = "Enter serials for [product_name]"
   - Set description = "[quantity] units"
   - Set assigned_to = NULL (available)
   - Set due_date = receipt.created_at + 7 days
4. Return NEW
```

### Auto-Complete Trigger

**Trigger:** `auto_complete_serial_entry_task()`

**Fires When:** Serial inserted/deleted in `stock_receipt_serials`

**Logic:**
```sql
1. Get receipt_id and product_id from serial
2. Count serials: SELECT COUNT(*) FROM stock_receipt_serials
3. Get declared_quantity from stock_receipt_items
4. Calculate progress: (serial_count / declared_quantity) * 100
5. IF progress = 100%:
   - UPDATE entity_task SET status = 'completed'
   - Check if ALL tasks for receipt complete
   - IF all complete: UPDATE receipt SET status = 'completed'
6. ELSE IF progress < 100% AND task was completed:
   - Reopen task (status = 'in_progress')
```

### Entity Adapter Pattern

**File:** `src/server/services/entity-adapters/inventory-receipt-adapter.ts`

**Purpose:** Provide business logic hooks for receipt-specific task operations.

**Key Methods:**
```typescript
class InventoryReceiptAdapter extends BaseEntityAdapter {
  // Can we start this task?
  async canStartTask(taskId: string): Promise<boolean> {
    const receipt = await this.getReceipt(taskId);
    return receipt.status === 'approved';
  }

  // Enrich task with receipt context
  async getEntityContext(entityId: string): Promise<object> {
    return {
      receiptNumber: receipt.receipt_number,
      warehouse: receipt.warehouse_id,
      status: receipt.status,
      priority: receipt.priority,
      serialProgress: {
        serialCount: 15,
        expectedQuantity: 100,
        percentage: 15
      }
    };
  }

  // Can we complete this task?
  async canCompleteTask(taskId: string): Promise<boolean> {
    const progress = await this.getSerialProgress(taskId);
    return progress.percentage === 100;
  }
}
```

### API Endpoints

**1. Task Enrichment** (`tasks.getMyTasks`)

Adds serial progress to task context:

```typescript
// Response example
{
  "id": "uuid",
  "name": "Enter serials for ZOTAC RTX 4090",
  "status": "in_progress",
  "entity_type": "inventory_receipt",
  "context": {
    "receiptNumber": "GRN-2025-001",
    "warehouse": "Công ty",
    "serialProgress": {
      "serialCount": 15,
      "expectedQuantity": 100,
      "percentage": 15
    }
  }
}
```

**2. Progress Tracking** (`tasks.getSerialEntryProgress`)

Returns detailed progress for all products in a receipt:

```typescript
{
  receiptId: string;
  receiptNumber: string;
  totalExpected: number;
  totalEntered: number;
  percentage: number;
  products: [{
    productName: "ZOTAC RTX 4090",
    expectedQuantity: 100,
    serialCount: 15,
    percentage: 15,
    taskId: "uuid",
    taskStatus: "in_progress"
  }];
  overdue: boolean;
}
```

### Frontend Components

**1. SerialEntryTaskCard** (`/my-tasks`)

Task card with progress visualization:

```
┌─────────────────────────────────────────────┐
│ 🔴 OVERDUE                         [Claim]  │
│                                              │
│ Enter serials for ZOTAC RTX 4090            │
│ Receipt: GRN-2025-001 | Công ty             │
│                                              │
│ Progress: 15/100 (15%)                       │
│ ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%      │
│                                              │
│ [Go to Serial Entry] ────────────────────►  │
└─────────────────────────────────────────────┘
```

**Color Coding:**
- 🔴 Red (0-49%): Critical - needs immediate attention
- 🟡 Yellow (50-99%): In progress - on track
- 🟢 Green (100%): Complete - success

**2. SerialProgressIndicator** (`/inventory/documents/receipts/[id]`)

Per-product breakdown on receipt detail page:

```
┌─────────────────────────────────────────────┐
│ Serial Entry Progress                        │
│                                              │
│ Overall: 150/300 (50%)                       │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░ 50%     │
│                                              │
│ ▼ ZOTAC RTX 4090 (100 units)                │
│   Progress: 15/100 (15%) 🔴                  │
│   Task: In Progress | Assigned to: Tân      │
│   [Go to Serial Entry] ──────────────►       │
└─────────────────────────────────────────────┘
```

**3. Dashboard Integration** (`/my-tasks`)

**Filter Tab:** "Serial Entry Tasks"

**Features:**
- Filter by status (Pending, In Progress, Completed)
- Filter by priority (Overdue, High Priority, Normal)
- Sort by progress (lowest % first)
- Claim available tasks
- Quick complete action (if 100%)

### Task Assignment

**Roles:**
- **Admin/Manager:** See all serial entry tasks, can assign to specific technician
- **Technician:** See assigned tasks + available (unassigned) tasks, can claim tasks

**Task Claiming:**
```typescript
// Technician claims task
await trpc.tasks.claimTask.mutate({ taskId: "uuid" });
// Sets assigned_to_id = current_user_id
```

### Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| Auto-create trigger | < 50ms | For receipt with 10 products |
| Auto-complete trigger | < 30ms | Per serial insert |
| Progress API | < 300ms | For receipt with 50 products |
| Dashboard load | < 500ms | With 100+ tasks |

### Security

**RLS Policies:**
```sql
-- Technicians can view their tasks and available tasks
CREATE POLICY "Technicians view tasks"
ON entity_tasks FOR SELECT
USING (
  assigned_to_id = auth.uid() OR
  (assigned_to_id IS NULL AND has_role('technician'))
);
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
- **Schema:** `docs/data/schemas/202_task_and_warehouse.sql` (entity_tasks, workflows)
- **Triggers:** `docs/data/schemas/17_stock_update_triggers.sql`
- **Triggers:** `docs/data/schemas/600_stock_triggers.sql` (physical product status lifecycle)
- **Entity Adapters:** `src/server/services/entity-adapters/inventory-receipt-adapter.ts`
- **Summary:** `docs/INVENTORY-REDESIGN-SUMMARY.md`
- **CLAUDE.md:** Updated with new workflow notes

---

**Last Updated:** 2025-11-05
**Version:** 2.2
**Status:** ✅ Implemented and Tested

**Version History:**
- v2.0 (2025-10-29): Initial non-blocking workflow with stock update triggers
- v2.1 (2025-10-30): Added document attachments support
- v2.2 (2025-11-05): Consolidated serial entry task automation (from SERIAL-ENTRY-WORKFLOW-ARCHITECTURE.md)
