# Serial Entry Workflow Architecture

**Version:** 1.0
**Date:** November 3, 2025
**Phase:** 2 - Serial Entry Tasks
**Status:** ✅ **APPROVED**

---

## 1. Executive Summary

This document defines the architecture for **automated serial entry task management** using the polymorphic task system built in Phase 1. The system will automatically create serial entry tasks when inventory receipts are approved, track progress in real-time, and auto-complete tasks and receipts when serial entry reaches 100%.

**Business Objective:** Achieve 100% serial entry compliance by eliminating manual tracking.

**Key Innovation:** Zero-touch workflow automation - no manual task creation or completion needed.

---

## 2. System Overview

### 2.1 High-Level Workflow

```
┌─────────────────┐
│ Inventory       │
│ Receipt Created │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Receipt         │
│ Approved        │  ← Manager approves receipt
└────────┬────────┘
         │
         ▼ TRIGGER: auto_create_serial_entry_tasks()
         │
┌─────────────────────────────────────────────┐
│ For EACH product in receipt:                │
│   CREATE entity_task                        │
│   - entity_type = 'inventory_receipt'       │
│   - entity_id = receipt.id                  │
│   - name = "Enter serials for [product]"    │
│   - assigned_to = NULL (available to claim) │
│   - workflow_id = [Serial Entry Workflow]   │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Tasks appear in │
│ Dashboard       │  ← Technicians see tasks
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Technician      │
│ Claims Task     │  ← Start task, enter serials
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Serials Entered │
│ (Progress %)    │  ← Real-time progress tracking
└────────┬────────┘
         │
         ▼ When serial count = expected quantity
         │
         ▼ TRIGGER: auto_complete_serial_entry_task()
         │
┌─────────────────────────────────────┐
│ UPDATE entity_task                  │
│   SET status = 'completed'          │
│   SET completed_at = NOW()          │
│                                     │
│ IF all tasks for receipt complete:  │
│   UPDATE inventory_receipt          │
│   SET status = 'completed'          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Receipt         │
│ Completed       │  ← 100% automated!
└─────────────────┘
```

### 2.2 Key Components

| Component | Responsibility | Technology |
|-----------|----------------|------------|
| **Workflows Table** | Store "Serial Entry" workflow template | PostgreSQL |
| **Entity Tasks Table** | Store auto-created serial entry tasks | PostgreSQL (Phase 1) |
| **Auto-Create Trigger** | Create tasks on receipt approval | PL/pgSQL Trigger |
| **Auto-Complete Trigger** | Complete tasks when serials = 100% | PL/pgSQL Trigger |
| **Receipt Entity Adapter** | Business logic for receipt workflows | TypeScript Class |
| **Task Service** | Enrich tasks with serial context | TypeScript Service |
| **Progress Tracking API** | Real-time serial progress calculation | tRPC Endpoint |
| **Serial Entry UI** | Task cards, progress bars, dashboard | React Components |

---

## 3. Database Design

### 3.1 Schema Changes

**New Column: `workflows.entity_type`**

Already exists from Phase 1:

```sql
CREATE TYPE entity_type AS ENUM (
  'service_ticket',
  'inventory_receipt',
  'inventory_issue',
  'inventory_transfer',
  'service_request'
);

ALTER TABLE workflows ADD COLUMN entity_type entity_type;
```

**New Column: `inventory_receipts.workflow_id`**

```sql
ALTER TABLE inventory_receipts
ADD COLUMN workflow_id UUID REFERENCES workflows(id);
```

**Purpose:** Link receipt to "Serial Entry" workflow template.

### 3.2 System Workflow Template

**Insert "Serial Entry" workflow:**

```sql
INSERT INTO workflows (id, name, description, entity_type, enforce_sequence)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-000000000001', -- System UUID
  'Serial Entry',
  'Automated workflow for serial number entry on inventory receipts',
  'inventory_receipt',
  false -- Serial entry can happen in any order
);

-- Insert workflow task template
INSERT INTO workflow_tasks (
  workflow_id,
  name,
  description,
  sequence_order,
  is_required,
  depends_on_task_ids
)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'Enter Serial Numbers',
  'Enter serial numbers for all products in this receipt',
  1,
  true,
  '{}'
);
```

**Note:** Actual task names will be generated dynamically per product (e.g., "Enter serials for ZOTAC RTX 4090").

### 3.3 Indexes for Performance

```sql
-- Index for finding receipts by workflow
CREATE INDEX idx_inventory_receipts_workflow_id
ON inventory_receipts(workflow_id);

-- Index for finding serial entry tasks by receipt
-- (Already exists from Phase 1)
CREATE INDEX idx_entity_tasks_entity
ON entity_tasks(entity_type, entity_id);

-- Index for progress calculation (serial count)
CREATE INDEX idx_physical_products_receipt
ON physical_products(receipt_id);
```

---

## 4. Trigger Design

### 4.1 Auto-Create Tasks Trigger

**Trigger Name:** `auto_create_serial_entry_tasks()`

**Fires When:** Receipt status changes to 'approved'

**Logic:**

```
1. Check if receipt has workflow_id (Serial Entry workflow)
2. Check if tasks already exist (idempotency - prevent duplicates)
3. For EACH product line in receipt:
   a. Get workflow_tasks template
   b. Create entity_task:
      - entity_type = 'inventory_receipt'
      - entity_id = receipt.id
      - name = "Enter serials for [product_name]"
      - description = "[expected_quantity] units"
      - sequence_order = product line number
      - is_required = true
      - assigned_to_id = NULL (available to claim)
      - workflow_id = receipt.workflow_id
      - due_date = receipt.created_at + 7 days (or based on priority)
4. Return NEW (allow receipt status update)
```

**Idempotency:** If tasks already exist for this receipt, skip creation (no duplicates).

**Performance:** Estimated < 50ms for receipt with 10 products.

### 4.2 Auto-Complete Task Trigger

**Trigger Name:** `auto_complete_serial_entry_task()`

**Fires When:** Serial number inserted/deleted in `physical_products` table

**Logic:**

```
1. Get receipt_id from physical_product
2. Get product_id from physical_product
3. Count serials for this receipt + product:
   SELECT COUNT(*) FROM physical_products
   WHERE receipt_id = X AND product_id = Y
4. Get expected_quantity from receipt_products
5. Calculate progress: (serial_count / expected_quantity) * 100
6. IF progress = 100%:
   a. Find entity_task for this receipt + product
   b. UPDATE entity_task SET status = 'completed', completed_at = NOW()
   c. Check if ALL tasks for receipt are complete
   d. IF all complete:
      UPDATE inventory_receipt SET status = 'completed'
7. ELSE IF progress < 100% AND task was previously completed:
   a. Reopen task (set status = 'in_progress')
   b. Reopen receipt (set status = 'approved')
8. Return NEW (allow serial insert/delete)
```

**Edge Cases:**
- Serial deleted → Reduce progress, reopen task if needed
- Multiple products → Each product has its own task
- Concurrent serial entry → Database transaction ensures consistency

**Performance:** Estimated < 30ms per serial insert.

---

## 5. Entity Adapter Design

### 5.1 Receipt Entity Adapter

**File:** `src/server/services/entity-adapters/inventory-receipt-adapter.ts`

**Extends:** `BaseEntityAdapter`

**Methods:**

```typescript
class InventoryReceiptAdapter extends BaseEntityAdapter {
  entityType = 'inventory_receipt' as const;

  // Hook: Can we start this task?
  async canStartTask(taskId: string): Promise<boolean> {
    // Serial entry can start anytime after receipt approved
    const receipt = await this.getReceipt(taskId);
    return receipt.status === 'approved';
  }

  // Hook: Called when task starts
  async onTaskStart(taskId: string, userId: string): Promise<void> {
    // No-op for serial entry (no special logic needed)
  }

  // Hook: Can we complete this task?
  async canCompleteTask(taskId: string): Promise<boolean> {
    // Check if serials = 100%
    const progress = await this.getSerialProgress(taskId);
    return progress.percentage === 100;
  }

  // Hook: Called when task completes (manual or auto)
  async onTaskComplete(taskId: string, userId: string): Promise<void> {
    // Check if all tasks for receipt are complete
    const allTasksComplete = await this.areAllTasksComplete(taskId);

    if (allTasksComplete) {
      // Auto-complete receipt
      await this.updateReceiptStatus(taskId, 'completed');
    }
  }

  // Hook: Enrich task with receipt context
  async getEntityContext(entityId: string): Promise<object> {
    const receipt = await this.db
      .from('inventory_receipts')
      .select('receipt_number, warehouse_id, status, priority')
      .eq('id', entityId)
      .single();

    return {
      receiptNumber: receipt.receipt_number,
      warehouse: receipt.warehouse_id,
      status: receipt.status,
      priority: receipt.priority,
      // Serial progress calculated in real-time
    };
  }

  // Helper: Get serial progress for a task
  async getSerialProgress(taskId: string): Promise<Progress> {
    // Get task to find product_id
    // Count serials for this product
    // Get expected_quantity
    // Return { serialCount, expectedQuantity, percentage }
  }
}
```

### 5.2 Adapter Integration

**Register in:** `src/server/services/entity-adapters/index.ts`

```typescript
import { InventoryReceiptAdapter } from './inventory-receipt-adapter';

export const entityAdapters = {
  service_ticket: new ServiceTicketAdapter(),
  inventory_receipt: new InventoryReceiptAdapter(), // NEW
  inventory_issue: new InventoryIssueAdapter(),
  inventory_transfer: new InventoryTransferAdapter(),
  service_request: new ServiceRequestAdapter(),
};
```

---

## 6. API Design

### 6.1 Task Enrichment (Existing)

**Endpoint:** `tasks.getMyTasks` (enhanced)

**Enhancement:** Add serial progress to task context

```typescript
// TaskService.enrichTaskWithContext()
const adapter = getEntityAdapter(task.entity_type);
const context = await adapter.getEntityContext(task.entity_id);

if (task.entity_type === 'inventory_receipt') {
  // Add serial progress
  const progress = await adapter.getSerialProgress(task.id);
  context.serialProgress = progress;
}

return { ...task, context };
```

**Response Example:**

```json
{
  "id": "uuid",
  "name": "Enter serials for ZOTAC RTX 4090",
  "status": "in_progress",
  "entity_type": "inventory_receipt",
  "context": {
    "receiptNumber": "GRN-2025-001",
    "warehouse": "Công ty",
    "status": "approved",
    "priority": "high",
    "serialProgress": {
      "serialCount": 15,
      "expectedQuantity": 100,
      "percentage": 15
    }
  }
}
```

### 6.2 Progress Tracking (NEW)

**Endpoint:** `tasks.getSerialEntryProgress`

**Input:**

```typescript
const getSerialEntryProgressSchema = z.object({
  receiptId: z.string().uuid(),
});
```

**Output:**

```typescript
{
  receiptId: string;
  receiptNumber: string;
  totalExpected: number;
  totalEntered: number;
  percentage: number;
  products: Array<{
    productId: string;
    productName: string;
    expectedQuantity: number;
    serialCount: number;
    percentage: number;
    taskId: string | null;
    taskStatus: 'pending' | 'in_progress' | 'completed';
  }>;
  overdue: boolean;
}
```

**SQL Query (optimized - single query):**

```sql
SELECT
  rp.product_id,
  p.name as product_name,
  rp.quantity as expected_quantity,
  COUNT(pp.id) as serial_count,
  ROUND((COUNT(pp.id)::NUMERIC / rp.quantity) * 100, 2) as percentage,
  et.id as task_id,
  et.status as task_status
FROM receipt_products rp
JOIN products p ON rp.product_id = p.id
LEFT JOIN physical_products pp ON pp.receipt_id = rp.receipt_id AND pp.product_id = rp.product_id
LEFT JOIN entity_tasks et ON et.entity_id = rp.receipt_id AND et.entity_type = 'inventory_receipt'
WHERE rp.receipt_id = $1
GROUP BY rp.product_id, p.name, rp.quantity, et.id, et.status
ORDER BY rp.product_id;
```

**Performance:** < 100ms for receipt with 50 products.

---

## 7. Frontend Design

### 7.1 Serial Entry Task Cards

**Component:** `SerialEntryTaskCard`

**Location:** Task Dashboard (`/my-tasks`)

**Features:**
- Receipt number (clickable → navigate to serial entry)
- Product name
- Progress bar (color-coded: 0-49% red, 50-99% yellow, 100% green)
- Serial count (15/100)
- Percentage (15%)
- Priority badge (overdue = red, high priority = yellow)
- "Claim Task" button (if unassigned)
- "Complete Task" button (if assigned + 100%)

**Design Mockup (Text):**

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

### 7.2 Progress Indicator (Receipt Detail)

**Component:** `SerialProgressIndicator`

**Location:** Receipt detail page (`/inventory/documents/receipts/[id]`)

**Features:**
- Overall progress (all products combined)
- Per-product breakdown (accordion)
- "Jump to Serial Entry" button
- Auto-refresh every 30 seconds

**Design Mockup (Text):**

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
│                                              │
│ ▼ SSTC NVMe SSD 1TB (200 units)             │
│   Progress: 135/200 (67.5%) 🟡               │
│   Task: In Progress | Assigned to: Minh     │
│   [Go to Serial Entry] ──────────────►       │
└─────────────────────────────────────────────┘
```

### 7.3 Dashboard Integration

**Enhancement:** `/my-tasks` dashboard

**New Filter Tab:** "Serial Entry Tasks"

**Features:**
- Filter by status (Pending, In Progress, Completed)
- Filter by priority (Overdue, High Priority, Normal)
- Sort by progress (ascending - show lowest % first)
- Claim available tasks
- Quick complete action (if 100%)

---

## 8. Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| **Auto-create trigger** | < 50ms | For receipt with 10 products |
| **Auto-complete trigger** | < 30ms | Per serial insert |
| **Progress API** | < 300ms | For receipt with 50 products |
| **Dashboard load** | < 500ms | With 100+ tasks |
| **Task enrichment** | < 200ms | Add serial progress to task |

**Optimization Strategies:**
- Single SQL query for progress calculation (avoid N+1)
- Database indexes on receipt_id, product_id
- Caching for workflow templates (rarely change)
- Real-time updates via polling (30s interval)

---

## 9. Error Handling

### 9.1 Trigger Failures

**Scenario:** Workflow not found

**Handling:**
```sql
IF NOT FOUND workflow THEN
  RAISE WARNING 'Serial Entry workflow not found for receipt %', receipt_id;
  RETURN NEW; -- Don't block receipt approval
END IF;
```

**Scenario:** Duplicate tasks

**Handling:**
```sql
-- Check if tasks already exist
IF EXISTS (SELECT 1 FROM entity_tasks WHERE entity_id = receipt_id) THEN
  RETURN NEW; -- Skip creation (idempotent)
END IF;
```

### 9.2 API Failures

**Scenario:** Receipt not found

**Response:** 404 Not Found

**Scenario:** Progress calculation fails

**Response:** 500 Internal Server Error (log error, return partial data)

---

## 10. Security & Permissions

**Task Visibility:**
- Admins: See all serial entry tasks
- Managers: See all serial entry tasks
- Technicians: See only assigned tasks + available (unassigned) tasks

**Task Actions:**
- Claim task: Technicians can claim unassigned tasks
- Complete task: Only assigned user can complete (or admin/manager)

**RLS Policies:** (Already exist from Phase 1)

```sql
-- View tasks policy (technicians see own + available)
CREATE POLICY "Technicians can view their tasks and available tasks"
ON entity_tasks FOR SELECT
TO authenticated
USING (
  assigned_to_id = auth.uid() OR
  (assigned_to_id IS NULL AND has_role('technician'))
);
```

---

## 11. Rollback Plan

**If Phase 2 fails in production:**

1. Drop triggers:
   ```sql
   DROP TRIGGER IF EXISTS auto_create_serial_entry_tasks ON inventory_receipts;
   DROP TRIGGER IF EXISTS auto_complete_serial_entry_task ON physical_products;
   ```

2. Remove workflow_id column:
   ```sql
   ALTER TABLE inventory_receipts DROP COLUMN workflow_id;
   ```

3. Delete serial entry tasks:
   ```sql
   DELETE FROM entity_tasks WHERE workflow_id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
   ```

4. Estimated rollback time: **10 minutes**

---

## 12. Success Criteria

**Technical:**
- ✅ Tasks auto-created on receipt approval (100% success rate)
- ✅ Tasks auto-complete when serials = 100% (100% success rate)
- ✅ Performance targets met (all operations < 500ms)
- ✅ Zero P0 bugs in production

**Business:**
- ✅ Zero receipts with missing serials for 2 consecutive weeks
- ✅ Staff adoption >80% (measured by active users)
- ✅ Average time to 100% serial entry < 24 hours

---

## 13. Future Enhancements

**Phase 3+ Opportunities:**

1. **Real-time notifications** - WebSocket updates instead of polling
2. **Bulk serial import** - CSV upload for faster entry
3. **Serial validation** - Check format, duplicates, manufacturer database
4. **Progress dashboard** - Manager view of all receipts
5. **Auto-assignment** - AI-based task assignment to balance workload

---

**Document Status:** ✅ **APPROVED**
**Approved By:**
- Tech Lead: ________________
- Product Owner: ________________
- Date: November 3, 2025

**See Also:**
- [Database Design](./SERIAL-ENTRY-DATABASE-DESIGN.md)
- [API Contract](./SERIAL-ENTRY-API-CONTRACT.md)
- [Receipt Entity Adapter Design](./RECEIPT-ENTITY-ADAPTER-DESIGN.md)
