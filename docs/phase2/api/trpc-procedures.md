# tRPC API Reference - Service Center Phase 2

**Version:** 2.0
**Last Updated:** 2025-10-24

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication & Authorization](#authentication--authorization)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Router Reference](#router-reference)
   - [Workflow Router](#workflow-router)
   - [Inventory Router](#inventory-router)
   - [Tickets Router](#tickets-router)
   - [Profile Router](#profile-router)
   - [Admin Router](#admin-router)
   - [Notifications Router](#notifications-router)
   - [Customers Router](#customers-router)
6. [Best Practices](#best-practices)

---

## Introduction

Service Center uses **tRPC 11.6.0** for end-to-end type-safe API communication between the Next.js frontend and backend. All API procedures are defined in `src/server/routers/` and combined in the main `appRouter`.

### Base URL

All tRPC procedures are accessed through:

```
POST /api/trpc/[procedure-path]
```

### Content Type

All requests use JSON:

```
Content-Type: application/json
```

### Type Safety

tRPC provides full TypeScript inference from server to client. Import the `AppRouter` type for type-safe API calls:

```typescript
import { type AppRouter } from '@/server/routers/_app';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>();
```

---

## Authentication & Authorization

### Authentication Method

Service Center uses **Supabase Auth** with JWT tokens stored in HTTP-only cookies.

### Context Creation

Each tRPC request creates two Supabase clients:

1. **supabaseClient** - Uses anon key with request cookies (for authenticated operations)
2. **supabaseAdmin** - Uses service role key (bypasses RLS for server operations)

Most procedures use `supabaseAdmin` to bypass Row Level Security restrictions.

### User Verification

Authentication is checked using:

```typescript
const { data: { user }, error } = await ctx.supabaseClient.auth.getUser();
if (error || !user) {
  throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
}
```

### Role-Based Access Control

User roles are stored in the `profiles` table:

- **admin** - Full system access
- **manager** - Can manage templates, users, RMA batches
- **technician** - Can execute tasks, switch templates
- **reception** - Can view templates, create tickets

Role verification example:

```typescript
const { data: profile } = await ctx.supabaseAdmin
  .from('profiles')
  .select('role')
  .eq('user_id', user.id)
  .single();

if (!['admin', 'manager'].includes(profile.role)) {
  throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
}
```

---

## Error Handling

### Error Codes

tRPC uses standard error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (duplicate) |
| `BAD_REQUEST` | 400 | Invalid input data |
| `PRECONDITION_FAILED` | 412 | Operation precondition not met |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Error Response Format

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in to create templates"
  }
}
```

### Client-Side Error Handling

```typescript
const mutation = trpc.workflow.template.create.useMutation({
  onError: (error) => {
    if (error.data?.code === 'UNAUTHORIZED') {
      // Redirect to login
    } else if (error.data?.code === 'CONFLICT') {
      // Show duplicate error
    }
  }
});
```

---

## Rate Limiting

### Email Notifications

Email sending is rate-limited to **100 emails per day per recipient** to prevent spam.

Rate limit check:

```typescript
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const { count } = await ctx.supabaseAdmin
  .from('email_notifications')
  .select('id', { count: 'exact', head: true })
  .eq('recipient_email', recipientEmail)
  .gte('created_at', oneDayAgo);

if (count && count >= 100) {
  throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });
}
```

### General API Rate Limiting

There is no general rate limiting on tRPC procedures. Consider implementing at the middleware level if needed.

---

## Router Reference

---

## Workflow Router

**Path:** `workflow.*`

Manages task templates, task types, and workflow operations.

---

### Task Type Procedures

#### `workflow.taskType.list`

**Type:** Query
**Auth Required:** Yes
**Roles:** Admin, Manager, Technician, Reception

List all active task types.

**Input:** None

**Output:**

```typescript
Array<{
  id: string;
  name: string;
  description?: string;
  category?: string;
  estimated_duration_minutes?: number;
  requires_notes: boolean;
  requires_photo: boolean;
  is_active: boolean;
  created_at: string;
}>
```

**Example:**

```typescript
const taskTypes = await trpc.workflow.taskType.list.useQuery();
```

**Errors:**
- `UNAUTHORIZED` - Not logged in
- `FORBIDDEN` - Insufficient permissions

---

#### `workflow.taskType.create`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** Admin, Manager

Create a new custom task type.

**Input:**

```typescript
{
  name: string; // min 3, max 255
  description?: string;
  category?: string;
  estimated_duration_minutes?: number; // positive integer
  requires_notes?: boolean; // default false
  requires_photo?: boolean; // default false
  is_active?: boolean; // default true
}
```

**Output:**

```typescript
{
  id: string;
  name: string;
  // ... all task type fields
}
```

**Example:**

```typescript
const result = await trpc.workflow.taskType.create.mutate({
  name: 'Screen Calibration',
  category: 'Quality Check',
  estimated_duration_minutes: 15,
  requires_photo: true
});
```

**Errors:**
- `UNAUTHORIZED` - Not logged in
- `FORBIDDEN` - Only admin/manager can create
- `CONFLICT` - Task type name already exists

---

### Template Procedures

#### `workflow.template.list`

**Type:** Query
**Auth Required:** Yes
**Roles:** Admin, Manager, Technician, Reception

List templates with optional filters.

**Input:**

```typescript
{
  product_type?: string; // UUID
  service_type?: 'warranty' | 'paid' | 'replacement';
  is_active?: boolean;
}
```

**Output:**

```typescript
Array<{
  id: string;
  name: string;
  description?: string;
  product_type?: string;
  service_type: 'warranty' | 'paid' | 'replacement';
  enforce_sequence: boolean;
  is_active: boolean;
  created_at: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  tasks: Array<{
    id: string;
    sequence_order: number;
    is_required: boolean;
    custom_instructions?: string;
    task_type: {
      id: string;
      name: string;
      category?: string;
      // ... task type fields
    };
  }>;
}>
```

**Example:**

```typescript
const templates = await trpc.workflow.template.list.useQuery({
  service_type: 'warranty',
  is_active: true
});
```

---

#### `workflow.template.getById`

**Type:** Query
**Auth Required:** Yes
**Roles:** Admin, Manager, Technician, Reception

Get a single template by ID with its tasks.

**Input:**

```typescript
{
  template_id: string; // UUID
}
```

**Output:** Same as single template in `list` output, with tasks sorted by sequence_order.

**Errors:**
- `NOT_FOUND` - Template not found

---

#### `workflow.template.create`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** Admin, Manager

Create a new task template.

**Input:**

```typescript
{
  name: string; // min 3, max 255
  description?: string;
  product_type?: string; // UUID
  service_type: 'warranty' | 'paid' | 'replacement';
  enforce_sequence?: boolean; // default true
  is_active?: boolean; // default true
  tasks: Array<{
    task_type_id: string; // UUID
    sequence_order: number; // positive integer
    is_required?: boolean; // default true
    custom_instructions?: string;
  }>; // min 1 task required
}
```

**Output:** Complete template with nested tasks

**Example:**

```typescript
const template = await trpc.workflow.template.create.mutate({
  name: 'Standard Phone Repair',
  service_type: 'warranty',
  enforce_sequence: true,
  tasks: [
    { task_type_id: '...', sequence_order: 1, is_required: true },
    { task_type_id: '...', sequence_order: 2, is_required: true }
  ]
});
```

**Errors:**
- `CONFLICT` - Template name already exists
- `BAD_REQUEST` - Duplicate sequence orders

---

#### `workflow.template.update`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** Admin, Manager

Update a template (creates new version, marks old as inactive).

**Input:**

```typescript
{
  template_id: string; // UUID of template to update
  name: string;
  description?: string;
  product_type?: string;
  service_type: 'warranty' | 'paid' | 'replacement';
  enforce_sequence: boolean;
  tasks: Array<{
    task_type_id: string;
    sequence_order: number;
    is_required: boolean;
    custom_instructions?: string;
  }>;
}
```

**Output:** New template version with tasks

**Note:** Template versioning is automatic. Old version is deactivated; new version created.

---

#### `workflow.template.delete`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** Admin, Manager

Delete or deactivate a template.

**Input:**

```typescript
{
  template_id: string; // UUID
  soft_delete?: boolean; // default true
}
```

**Output:**

```typescript
{
  success: boolean;
  soft_deleted: boolean;
}
```

**Validation:** Cannot delete template if in use by active tickets (pending/in_progress).

**Errors:**
- `CONFLICT` - Template in use by active tickets

---

### Task Execution Procedures

#### `workflow.myTasks`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get tasks assigned to current user.

**Input:** None

**Output:**

```typescript
Array<{
  id: string;
  ticket_id: string;
  task_type_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  sequence_order: number;
  assigned_to_id: string;
  started_at?: string;
  completed_at?: string;
  task_type: { /* task type fields */ };
  ticket: {
    id: string;
    ticket_number: string;
    status: string;
    customer: {
      name: string;
      phone: string;
    };
  };
}>
```

---

#### `workflow.updateTaskStatus`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Update task status.

**Input:**

```typescript
{
  task_id: string; // UUID
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
}
```

**Output:** Updated task

**Side Effects:**
- Sets `started_at` when status changes to `in_progress`
- Updates `updated_at` timestamp

---

#### `workflow.addTaskNotes`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Add notes to a task.

**Input:**

```typescript
{
  task_id: string; // UUID
  notes: string; // min 1 char
}
```

**Output:**

```typescript
{
  success: boolean;
  notes: string; // updated notes with timestamp
}
```

**Note:** Notes are appended to `custom_instructions` with timestamp.

---

#### `workflow.completeTask`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Complete a task with required completion notes.

**Input:**

```typescript
{
  task_id: string; // UUID
  completion_notes: string; // min 5 chars
}
```

**Output:** Completed task with `completed_at` and `completed_by_id` set

---

#### `workflow.getTaskDependencies`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get prerequisite tasks for sequence validation.

**Input:**

```typescript
{
  task_id: string; // UUID
}
```

**Output:**

```typescript
{
  prerequisites: Array<{
    id: string;
    sequence_order: number;
    status: string;
    is_required: boolean;
    task_type: { /* task type */ };
  }>;
  enforce_sequence: boolean;
  incomplete_count: number;
}
```

---

### Progress Dashboard Procedures

#### `workflow.getTaskProgressSummary`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get overall task progress metrics.

**Input:** None

**Output:**

```typescript
{
  total_tasks: number;
  tasks_pending: number;
  tasks_in_progress: number;
  tasks_completed: number;
  tasks_blocked: number;
  completion_rate: number;
}
```

---

#### `workflow.getTicketsWithBlockedTasks`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get tickets with blocked tasks.

**Input:** None

**Output:**

```typescript
Array<{
  ticket_id: string;
  ticket_number: string;
  blocked_tasks_count: number;
  // ... other ticket fields
}>
```

---

#### `workflow.getTechnicianWorkload`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get task workload metrics per technician.

**Input:**

```typescript
{
  technicianId?: string; // UUID, optional
}
```

**Output:**

```typescript
Array<{
  technician_id: string;
  technician_name: string;
  tasks_pending: number;
  tasks_in_progress: number;
  tasks_completed: number;
  tasks_blocked: number;
}>
```

---

#### `workflow.getTaskCompletionTimeline`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get task completion timeline for last N days.

**Input:**

```typescript
{
  daysBack?: number; // default 7, min 1, max 90
}
```

**Output:**

```typescript
Array<{
  date: string;
  tasks_completed: number;
}>
```

---

#### `workflow.switchTemplate`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** Technician, Admin, Manager

Switch task template mid-service while preserving completed tasks.

**Input:**

```typescript
{
  ticket_id: string; // UUID
  new_template_id: string; // UUID
  reason: string; // min 10 chars
}
```

**Output:**

```typescript
{
  success: boolean;
  summary: {
    tasks_preserved: number;
    tasks_removed: number;
    tasks_added: number;
    total_tasks: number;
  };
}
```

**Validation:**
- Ticket must be in `pending` or `in_progress` status
- New template must be different from current
- Not all tasks can be completed

**Side Effects:**
- Deletes pending/blocked tasks not in new template
- Adds new tasks from template
- Re-sequences all tasks
- Creates audit log in `ticket_template_changes`

---

## Inventory Router

**Path:** `inventory.*`

Manages physical products, serial numbers, stock movements, and RMA batches.

---

### Product Registration

#### `inventory.createProduct`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Register a new physical product with serial number.

**Input:**

```typescript
{
  serial_number: string; // min 5, A-Z 0-9 dash underscore, uppercase
  product_id: string; // UUID
  physical_warehouse_id?: string; // UUID
  virtual_warehouse_type: 'warranty_stock' | 'rma_staging' | 'dead_stock' | 'in_service' | 'parts';
  condition: 'new' | 'refurbished' | 'used' | 'faulty' | 'for_parts';
  warranty_start_date?: string; // ISO date
  warranty_months?: number; // >= 0
  purchase_date?: string; // ISO date
  supplier_id?: string; // UUID
  supplier_name?: string;
  purchase_price?: number; // >= 0
  notes?: string;
  photo_urls?: string[]; // array of URLs
}
```

**Output:** Created product record

**Errors:**
- `CONFLICT` - Serial number already exists

---

#### `inventory.updateProduct`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Update physical product details.

**Input:** Same as create, but all fields optional except `id`

**Output:** Updated product record

---

#### `inventory.listProducts`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

List products with filters and pagination.

**Input:**

```typescript
{
  physical_warehouse_id?: string;
  virtual_warehouse_type?: 'warranty_stock' | 'rma_staging' | 'dead_stock' | 'in_service' | 'parts';
  condition?: 'new' | 'refurbished' | 'used' | 'faulty' | 'for_parts';
  warranty_status?: 'active' | 'expired' | 'expiring_soon' | 'no_warranty';
  search?: string; // searches serial number
  limit?: number; // default 50, max 100
  offset?: number; // default 0
}
```

**Output:**

```typescript
{
  products: Array<{
    id: string;
    serial_number: string;
    condition: string;
    warranty_end_date?: string;
    product: {
      id: string;
      name: string;
      sku: string;
      brand: { name: string };
    };
    physical_warehouse?: {
      id: string;
      name: string;
      code: string;
      location: string;
    };
    // ... other fields
  }>;
  total: number;
}
```

---

#### `inventory.getProduct`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get single product by ID or serial number.

**Input:**

```typescript
{
  id?: string; // UUID
  serial_number?: string;
}
```

**Note:** Must provide either `id` or `serial_number`.

**Output:** Single product with related data

**Errors:**
- `BAD_REQUEST` - Neither id nor serial_number provided
- `NOT_FOUND` - Product not found

---

#### `inventory.bulkImport`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Bulk import products from CSV.

**Input:**

```typescript
{
  products: Array<{
    // Same as createProduct input
  }>;
}
```

**Output:**

```typescript
{
  total: number;
  success_count: number;
  error_count: number;
  success: Array<any>; // successfully created products
  errors: Array<{
    row: number;
    serial: string;
    error: string;
  }>;
}
```

**Validation:**
- Checks for duplicate serials in database
- Checks for duplicate serials within batch

---

### Stock Movements

#### `inventory.verifySerial`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Verify warranty status by serial number.

**Input:**

```typescript
{
  serial_number: string;
}
```

**Output:**

```typescript
{
  found: boolean;
  message?: string; // if not found
  product?: {
    // ... product fields
  };
  warranty?: {
    status: 'active' | 'expired' | 'expiring_soon' | 'no_warranty';
    daysRemaining: number | null;
    startDate?: string;
    endDate?: string;
  };
  location?: {
    physical: { /* warehouse */ };
    virtual: { /* warehouse */ };
  };
  inService: boolean;
}
```

---

#### `inventory.recordMovement`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Record product movement between warehouses.

**Input:**

```typescript
{
  product_id: string; // UUID
  movement_type: 'receipt' | 'transfer' | 'assignment' | 'return' | 'disposal';
  from_physical_warehouse_id?: string;
  to_physical_warehouse_id?: string;
  from_virtual_warehouse_type?: 'warranty_stock' | 'rma_staging' | 'dead_stock' | 'in_service' | 'parts';
  to_virtual_warehouse_type?: 'warranty_stock' | 'rma_staging' | 'dead_stock' | 'in_service' | 'parts';
  reference_ticket_id?: string;
  notes?: string;
  force?: boolean; // default false
}
```

**Output:**

```typescript
{ success: boolean }
```

**Validation:**
- Cannot move product in service unless `force: true`

**Errors:**
- `PRECONDITION_FAILED` - Product in service without force flag

---

#### `inventory.getMovementHistory`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get movement history for a product.

**Input:**

```typescript
{
  product_id: string;
  limit?: number; // default 50, max 100
  offset?: number; // default 0
}
```

**Output:**

```typescript
{
  movements: Array<{
    id: string;
    movement_type: string;
    created_at: string;
    from_physical?: { /* warehouse */ };
    to_physical?: { /* warehouse */ };
    from_virtual_warehouse?: string;
    to_virtual_warehouse?: string;
    ticket?: { ticket_number: string };
    moved_by?: { full_name: string };
    notes?: string;
  }>;
  total: number;
}
```

---

#### `inventory.assignToTicket`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Assign product to service ticket (move to In Service).

**Input:**

```typescript
{
  serial_number: string;
  ticket_id: string; // UUID
}
```

**Output:**

```typescript
{ success: boolean }
```

**Side Effects:**
- Records movement to `in_service` warehouse
- Sets `current_ticket_id` on product

---

### Stock Levels and Alerts

#### `inventory.getStockLevels`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get aggregated stock levels with alert status.

**Input:**

```typescript
{
  warehouse_type?: 'warranty_stock' | 'rma_staging' | 'dead_stock' | 'in_service' | 'parts';
  status?: 'ok' | 'warning' | 'critical';
  search?: string; // product name or SKU
  limit?: number; // default 50
  offset?: number; // default 0
}
```

**Output:**

```typescript
{
  stockLevels: Array<{
    product_id: string;
    product_name: string;
    sku: string;
    product_type: string;
    virtual_warehouse_type: string;
    current_stock: number;
    threshold: number;
    reorder_quantity: number;
    status: 'ok' | 'warning' | 'critical';
    alert_enabled: boolean;
  }>;
  total: number;
}
```

**Note:** Refreshes materialized view before querying.

---

#### `inventory.setThreshold`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Set stock threshold for product.

**Input:**

```typescript
{
  product_id: string; // UUID
  warehouse_type: 'warranty_stock' | 'rma_staging' | 'dead_stock' | 'in_service' | 'parts';
  minimum_quantity: number; // >= 0
  reorder_quantity?: number; // >= 0, defaults to minimum * 2
  alert_enabled?: boolean; // default true
}
```

**Output:**

```typescript
{ success: boolean }
```

---

#### `inventory.getLowStockAlerts`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get low stock alerts (warning + critical).

**Input:** None

**Output:**

```typescript
{
  alerts: Array<{
    // Same as stockLevels items
  }>;
  criticalCount: number;
  warningCount: number;
}
```

---

#### `inventory.exportStockReport`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Export stock report to CSV.

**Input:**

```typescript
{
  warehouse_type?: 'warranty_stock' | 'rma_staging' | 'dead_stock' | 'in_service' | 'parts';
  status?: 'ok' | 'warning' | 'critical';
}
```

**Output:**

```typescript
{
  csv: string; // CSV content
  filename: string; // suggested filename with date
}
```

---

### RMA Batch Operations

#### `inventory.createRMABatch`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** Admin, Manager

Create new RMA batch for supplier returns.

**Input:**

```typescript
{
  supplier_name: string; // min 2 chars
  shipping_date?: string; // ISO date
  tracking_number?: string;
  notes?: string;
}
```

**Output:** Created RMA batch with status `draft`

---

#### `inventory.addProductsToRMA`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** Admin, Manager

Add products to RMA batch.

**Input:**

```typescript
{
  batch_id: string; // UUID
  product_ids: string[]; // array of UUIDs
}
```

**Output:**

```typescript
{
  success: boolean;
  added: number; // count of products added
  errors?: string[]; // any errors encountered
}
```

**Validation:**
- Batch must be in `draft` status
- Products cannot already be in another batch

**Side Effects:**
- Moves products to `rma_staging` virtual warehouse
- Records stock movement

---

#### `inventory.finalizeRMABatch`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** Admin, Manager

Finalize RMA batch (submit).

**Input:**

```typescript
{
  batch_id: string; // UUID
  shipping_date?: string;
  tracking_number?: string;
}
```

**Output:** Updated batch with status `submitted`

**Validation:**
- Batch must have at least one product
- Batch must be in `draft` status

**Errors:**
- `PRECONDITION_FAILED` - Empty batch or already finalized

---

#### `inventory.getRMABatches`

**Type:** Query
**Auth Required:** Yes
**Roles:** Admin, Manager

Get RMA batches with pagination.

**Input:**

```typescript
{
  status?: 'draft' | 'submitted' | 'shipped' | 'completed';
  limit?: number; // default 50, max 100
  offset?: number; // default 0
}
```

**Output:**

```typescript
{
  batches: Array<{
    id: string;
    supplier_name: string;
    status: string;
    shipping_date?: string;
    tracking_number?: string;
    created_at: string;
    created_by: { full_name: string };
    product_count: number;
  }>;
  total: number;
}
```

---

#### `inventory.getRMABatchDetails`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get RMA batch details with products.

**Input:**

```typescript
{
  batch_id: string; // UUID
}
```

**Output:**

```typescript
{
  batch: {
    id: string;
    supplier_name: string;
    status: string;
    // ... batch fields
    created_by: { full_name: string };
  };
  products: Array<{
    id: string;
    product_id: string;
    added_at: string;
    product: {
      // physical product fields
      product_info: {
        name: string;
        sku: string;
        type: string;
      };
    };
    added_by: { full_name: string };
  }>;
}
```

---

## Tickets Router

**Path:** `tickets.*`

Service ticket CRUD operations, parts management, comments, and delivery tracking.

---

### Ticket CRUD

#### `tickets.getTickets`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get all service tickets.

**Input:** None

**Output:**

```typescript
Array<{
  id: string;
  ticket_number: string; // auto-generated SV-YYYY-NNN
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority_level: 'low' | 'normal' | 'high' | 'urgent';
  warranty_type: 'warranty' | 'paid' | 'goodwill';
  service_fee: number;
  diagnosis_fee: number;
  discount_amount: number;
  parts_total: number;
  total_cost: number; // calculated: service_fee + diagnosis_fee + parts_total - discount_amount
  issue_description: string;
  created_at: string;
  customers: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  products: {
    id: string;
    name: string;
    type: string;
    brands: { name: string };
  };
}>
```

---

#### `tickets.getTicket`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get single ticket by ID.

**Input:**

```typescript
{
  id: string; // UUID
}
```

**Output:** Single ticket with `parts` and `comments` arrays

---

#### `tickets.getTasks`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get tasks for a ticket.

**Input:**

```typescript
{
  ticketId: string; // UUID
}
```

**Output:**

```typescript
Array<{
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  sequence_order: number;
  is_required: boolean;
  assigned_to_id?: string;
  started_at?: string;
  completed_at?: string;
  task_type: { /* task type */ };
  assigned_to?: {
    id: string;
    full_name: string;
    role: string;
  };
}>
```

---

#### `tickets.createTicket`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Create new service ticket.

**Input:**

```typescript
{
  customer_data: {
    id?: string; // existing customer UUID
    name: string;
    phone: string; // min 10 chars, format validated
    email?: string | null;
    address?: string | null;
  };
  product_id: string; // UUID
  description: string;
  priority_level?: 'low' | 'normal' | 'high' | 'urgent'; // default 'normal'
  warranty_type?: 'warranty' | 'paid' | 'goodwill'; // default 'paid'
  service_fee: number; // >= 0
  diagnosis_fee?: number; // >= 0, default 0
  discount_amount?: number; // >= 0, default 0
  parts?: Array<{
    part_id: string; // UUID
    quantity: number; // >= 1
    unit_price: number; // >= 0
  }>;
}
```

**Output:**

```typescript
{
  success: boolean;
  ticket: { /* created ticket */ };
  tasks: Array<{ /* auto-generated tasks from template */ }>;
}
```

**Side Effects:**
- Creates or finds customer by phone
- Calculates `parts_total` and `total_cost`
- Auto-generates `ticket_number` via database trigger
- Adds parts to `service_ticket_parts`
- Decreases part stock quantities
- Creates auto-comment for ticket creation
- Generates tasks from template (via database trigger)

---

#### `tickets.updateTicket`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Update ticket details.

**Input:**

```typescript
{
  id: string; // UUID
  issue_description?: string;
  priority_level?: 'low' | 'normal' | 'high' | 'urgent';
  warranty_type?: 'warranty' | 'paid' | 'goodwill';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  service_fee?: number;
  diagnosis_fee?: number;
  discount_amount?: number;
  notes?: string | null;
  assigned_to?: string | null; // UUID
}
```

**Output:**

```typescript
{
  success: boolean;
  ticket: { /* updated ticket */ };
}
```

**Side Effects:**
- Creates auto-comments for significant changes (fees, discounts, priority, warranty, assignment, etc.)
- Validates status transitions
- Sets `started_at` when status → `in_progress`
- Sets `completed_at` when status → `completed`

---

#### `tickets.updateTicketStatus`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Update only ticket status.

**Input:**

```typescript
{
  id: string; // UUID
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}
```

**Output:**

```typescript
{
  success: boolean;
  ticket: { /* updated ticket */ };
}
```

**Validation:**
- Status transitions enforced by `VALID_STATUS_TRANSITIONS`
- Terminal states (completed, cancelled) cannot be changed

**Side Effects:**
- Auto-comment created by database trigger
- Sends email notification when status → `completed`

---

### Parts Management

#### `tickets.addTicketPart`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Add part to ticket.

**Input:**

```typescript
{
  ticket_id: string; // UUID
  part_id: string; // UUID
  quantity: number; // >= 1
  unit_price: number; // >= 0
}
```

**Output:**

```typescript
{
  success: boolean;
  part: { /* added part */ };
}
```

**Side Effects:**
- Decreases part stock
- Updates `parts_total` and `total_cost` via database trigger
- Creates auto-comment with part details and cost

---

#### `tickets.updateTicketPart`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Update part quantity or price.

**Input:**

```typescript
{
  id: string; // UUID of service_ticket_parts record
  quantity?: number; // >= 1
  unit_price?: number; // >= 0
}
```

**Output:**

```typescript
{
  success: boolean;
  part: { /* updated part */ };
}
```

**Side Effects:**
- Adjusts part stock (increase if quantity decreased, decrease if increased)
- Updates `parts_total` and `total_cost`
- Creates auto-comment showing changes

---

#### `tickets.deleteTicketPart`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Remove part from ticket.

**Input:**

```typescript
{
  id: string; // UUID
}
```

**Output:**

```typescript
{
  success: boolean;
}
```

**Side Effects:**
- Returns parts to stock
- Updates `parts_total` and `total_cost`
- Creates auto-comment

---

### Comments and Attachments

#### `tickets.addComment`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Add comment to ticket.

**Input:**

```typescript
{
  ticket_id: string; // UUID
  comment: string; // min 1 char
  is_internal?: boolean; // default false
  comment_type?: 'note' | 'status_change' | 'assignment' | 'system'; // default 'note'
}
```

**Output:**

```typescript
{
  success: boolean;
  comment: {
    id: string;
    comment: string;
    is_internal: boolean;
    comment_type: string;
    created_at: string;
    profiles: {
      id: string;
      full_name: string;
      role: string;
    };
  };
}
```

---

#### `tickets.addAttachment`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Add attachment to ticket.

**Input:**

```typescript
{
  ticket_id: string; // UUID
  file_name: string;
  file_path: string; // Supabase Storage path
  file_type: string; // MIME type
  file_size: number; // bytes
  description?: string;
}
```

**Output:**

```typescript
{
  success: boolean;
  attachment: { /* created attachment */ };
}
```

---

#### `tickets.getAttachments`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get attachments for ticket.

**Input:**

```typescript
{
  ticket_id: string; // UUID
}
```

**Output:** Array of attachments

---

#### `tickets.deleteAttachment`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Delete attachment.

**Input:**

```typescript
{
  id: string; // UUID
}
```

**Output:**

```typescript
{
  success: boolean;
}
```

---

### Delivery Tracking

#### `tickets.confirmDelivery`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Confirm ticket delivery with signature.

**Input:**

```typescript
{
  ticket_id: string; // UUID
  signature_url: string; // URL to signature image
  notes?: string;
}
```

**Output:**

```typescript
{
  success: boolean;
  ticket: { /* updated ticket */ };
}
```

**Validation:**
- Ticket must have status `completed`

**Side Effects:**
- Sets `delivery_confirmed_at`, `delivery_confirmed_by_id`, `delivery_signature_url`, `delivery_notes`
- Creates comment about delivery
- Sends delivery confirmation email

**Errors:**
- `BAD_REQUEST` - Ticket not completed

---

#### `tickets.getPendingDeliveries`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get completed tickets pending delivery confirmation.

**Input:**

```typescript
{
  limit?: number; // default 50, max 100
  offset?: number; // default 0
}
```

**Output:**

```typescript
{
  tickets: Array<{ /* completed tickets without delivery_confirmed_at */ }>;
  total: number;
  limit: number;
  offset: number;
}
```

---

#### `tickets.getPendingDeliveriesCount`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get count of pending deliveries for badge.

**Input:** None

**Output:** `number` - count of completed tickets without delivery confirmation

---

### Analytics

#### `tickets.getPendingCount`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get count of non-completed tickets.

**Input:** None

**Output:** `number`

---

#### `tickets.getDailyRevenue`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get daily revenue from completed tickets.

**Input:** None

**Output:**

```typescript
Array<{
  date: string; // YYYY-MM-DD
  revenue: number;
}>
```

---

## Profile Router

**Path:** `profile.*`

User profile management.

---

#### `profile.getCurrentUser`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get current authenticated user's profile.

**Input:** None

**Output:**

```typescript
{
  id: string; // profile ID
  user_id: string; // auth.users ID
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role: 'admin' | 'manager' | 'technician' | 'reception';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**Errors:**
- `UNAUTHORIZED` - Not logged in
- `NOT_FOUND` - No profile found

---

#### `profile.updateProfile`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Update current user's profile.

**Input:**

```typescript
{
  full_name: string; // min 1 char
  email: string; // valid email
  avatar_url?: string | null; // valid URL
}
```

**Output:** Updated profile

---

#### `profile.getAllUsers`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get all active users (for assignment dropdowns).

**Input:** None

**Output:**

```typescript
Array<{
  user_id: string;
  full_name: string;
  role: string;
  is_active: boolean;
}>
```

---

## Admin Router

**Path:** `admin.*`

System setup and administration.

---

#### `admin.setup`

**Type:** Mutation
**Auth Required:** No
**Roles:** Public (requires setup password)

Initial system setup - creates admin account.

**Input:**

```typescript
{
  password: string; // SETUP_PASSWORD from env
}
```

**Output:**

```typescript
{
  message: string;
  action: 'created' | 'password_reset' | 'profile_created';
}
```

**Environment Variables Required:**
- `SETUP_PASSWORD` - Setup password
- `ADMIN_EMAIL` - Admin email
- `ADMIN_PASSWORD` - Admin password
- `ADMIN_NAME` - Admin full name

**Scenarios:**
1. **First-time setup** - Creates auth user and profile
2. **Reset password** - If admin exists, resets password
3. **Repair profile** - If auth user exists but no profile, creates profile

**Errors:**
- `UNAUTHORIZED` - Invalid setup password
- `INTERNAL_SERVER_ERROR` - Missing env vars or database error

---

## Notifications Router

**Path:** `notifications.*`

Email notification system.

---

#### `notifications.send`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All (typically called internally)

Send email notification.

**Input:**

```typescript
{
  emailType: 'request_submitted' | 'request_received' | 'request_rejected' |
             'ticket_created' | 'service_completed' | 'delivery_confirmed';
  recipientEmail: string;
  recipientName: string;
  context: {
    trackingToken?: string;
    ticketNumber?: string;
    productName?: string;
    serialNumber?: string;
    rejectionReason?: string;
    completedDate?: string;
    deliveryDate?: string;
  };
  serviceRequestId?: string; // UUID
  serviceTicketId?: string; // UUID
}
```

**Output:**

```typescript
{
  success: boolean;
  emailId?: string; // UUID of email log
  skipped?: boolean; // true if user unsubscribed
  reason?: string; // 'unsubscribed' | 'rate_limit'
  error?: string; // if failed
  willRetry?: boolean; // if failed but retries available
}
```

**Rate Limiting:**
- 100 emails per day per recipient
- Returns `TOO_MANY_REQUESTS` if exceeded

**Email Preferences:**
- Checks customer `email_preferences` for opt-out
- Skips sending if user unsubscribed from email type

**Side Effects:**
- Logs email in `email_notifications` table
- Marks as `sent`, `failed`, or `pending`
- Includes retry count and error messages

---

#### `notifications.getLog`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get email notification log.

**Input:**

```typescript
{
  limit?: number; // default 50, max 100
  offset?: number; // default 0
  emailType?: 'request_submitted' | 'request_received' | ... ;
  status?: 'pending' | 'sent' | 'failed' | 'bounced';
  recipientEmail?: string;
}
```

**Output:**

```typescript
{
  emails: Array<{
    id: string;
    email_type: string;
    recipient_email: string;
    recipient_name: string;
    subject: string;
    status: string;
    created_at: string;
    sent_at?: string;
    failed_at?: string;
    error_message?: string;
    retry_count: number;
    // ...
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

---

#### `notifications.getStats`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get email statistics.

**Input:** None

**Output:**

```typescript
{
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: Record<string, number>; // count per email type
}
```

---

#### `notifications.retry`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Retry failed email.

**Input:**

```typescript
{
  emailId: string; // UUID
}
```

**Output:**

```typescript
{
  success: boolean;
}
```

**Validation:**
- Email must not be already sent
- Retry count must be below `max_retries`

**Errors:**
- `NOT_FOUND` - Email not found
- `BAD_REQUEST` - Already sent or max retries exceeded

---

## Customers Router

**Path:** `customers.*`

Customer management.

---

#### `customers.getCustomers`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get all customers.

**Input:** None

**Output:** Array of customers

---

#### `customers.createCustomer`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Create new customer.

**Input:**

```typescript
{
  name: string;
  phone: string; // min 10, format validated
  email?: string | null;
  address?: string | null;
}
```

**Output:**

```typescript
{
  success: boolean;
  customer: { /* created customer */ };
}
```

---

#### `customers.updateCustomer`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Update customer details.

**Input:**

```typescript
{
  id: string; // UUID
  name?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
}
```

**Output:**

```typescript
{
  success: boolean;
  customer: { /* updated customer */ };
}
```

---

#### `customers.deleteCustomer`

**Type:** Mutation
**Auth Required:** Yes
**Roles:** All

Delete customer.

**Input:**

```typescript
{
  id: string; // UUID
}
```

**Output:**

```typescript
{
  success: boolean;
}
```

---

#### `customers.getByEmail`

**Type:** Query
**Auth Required:** No (public)
**Roles:** Public

Get customer by email (for unsubscribe page).

**Input:**

```typescript
{
  email: string;
}
```

**Output:** Customer record with `email_preferences` or `null`

---

#### `customers.updateEmailPreferences`

**Type:** Mutation
**Auth Required:** No (public)
**Roles:** Public

Update customer email preferences (unsubscribe).

**Input:**

```typescript
{
  email: string;
  preferences: Record<string, boolean>; // email_type -> enabled
}
```

**Output:**

```typescript
{
  success: boolean;
}
```

**Example:**

```typescript
await trpc.customers.updateEmailPreferences.mutate({
  email: 'customer@example.com',
  preferences: {
    service_completed: false, // unsubscribe from service completion emails
    delivery_confirmed: true
  }
});
```

---

#### `customers.getNewCustomers`

**Type:** Query
**Auth Required:** Yes
**Roles:** All

Get new customer count and growth rate for current month.

**Input:** None

**Output:**

```typescript
{
  currentMonthCount: number;
  previousMonthCount: number;
  growthRate: number; // percentage
  hasPreviousData: boolean;
  latestUpdate: string; // ISO timestamp
}
```

---

## Best Practices

### 1. Always Handle Errors

```typescript
const mutation = trpc.workflow.template.create.useMutation({
  onSuccess: (data) => {
    toast.success('Template created');
  },
  onError: (error) => {
    if (error.data?.code === 'CONFLICT') {
      toast.error('Template name already exists');
    } else {
      toast.error('Failed to create template');
    }
  }
});
```

### 2. Use Optimistic Updates

```typescript
const utils = trpc.useContext();
const mutation = trpc.tickets.updateTicketStatus.useMutation({
  onMutate: async (newData) => {
    await utils.tickets.getTicket.cancel();
    const previousData = utils.tickets.getTicket.getData({ id: newData.id });

    utils.tickets.getTicket.setData({ id: newData.id }, (old) => ({
      ...old!,
      status: newData.status
    }));

    return { previousData };
  },
  onError: (err, newData, context) => {
    utils.tickets.getTicket.setData({ id: newData.id }, context?.previousData);
  }
});
```

### 3. Leverage React Query Features

```typescript
// Automatic refetch on window focus
const { data } = trpc.tickets.getTickets.useQuery(undefined, {
  refetchOnWindowFocus: true,
  staleTime: 30000 // 30 seconds
});

// Infinite queries for pagination
const {
  data,
  fetchNextPage,
  hasNextPage
} = trpc.inventory.listProducts.useInfiniteQuery(
  { limit: 50 },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor
  }
);
```

### 4. Batch Related Queries

```typescript
// Use parallel queries
const [tickets, customers, products] = trpc.useQueries((t) => [
  t.tickets.getTickets(),
  t.customers.getCustomers(),
  t.products.getProducts()
]);
```

### 5. Type-Safe Input Validation

```typescript
// Zod schema inference
import { z } from 'zod';

const createTicketInput = z.object({
  customer_data: z.object({
    name: z.string().min(1),
    phone: z.string().min(10)
  }),
  // ...
});

type CreateTicketInput = z.infer<typeof createTicketInput>;
```

### 6. Handle Side Effects Properly

```typescript
// Chain mutations that depend on each other
const createTicket = trpc.tickets.createTicket.useMutation();
const assignToTechnician = trpc.tickets.updateTicket.useMutation();

const handleCreateAndAssign = async (data) => {
  const ticket = await createTicket.mutateAsync(data);
  await assignToTechnician.mutateAsync({
    id: ticket.ticket.id,
    assigned_to: selectedTechnicianId
  });
};
```

### 7. Cache Invalidation

```typescript
const utils = trpc.useContext();

const mutation = trpc.tickets.addTicketPart.useMutation({
  onSuccess: (data) => {
    // Invalidate related queries
    utils.tickets.getTicket.invalidate({ id: data.part.ticket_id });
    utils.parts.getParts.invalidate();
  }
});
```

### 8. Use Subscriptions for Real-Time Data

```typescript
// If using WebSocket subscriptions (not implemented yet)
trpc.tickets.onStatusChange.useSubscription(
  { ticketId },
  {
    onData: (data) => {
      utils.tickets.getTicket.setData({ id: ticketId }, data);
    }
  }
);
```

### 9. Implement Retry Logic

```typescript
const query = trpc.inventory.getProduct.useQuery(
  { id: productId },
  {
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  }
);
```

### 10. Monitor Performance

```typescript
// Add timing logs
const query = trpc.workflow.template.list.useQuery(undefined, {
  onSuccess: (data) => {
    console.log(`Loaded ${data.length} templates`);
  },
  meta: {
    measurePerformance: true
  }
});
```

---

## Appendix: Common Patterns

### Pattern: Conditional Mutations

```typescript
const updateTicket = trpc.tickets.updateTicket.useMutation();

const handleStatusChange = async (newStatus: string) => {
  if (ticket.status === 'completed') {
    toast.error('Cannot modify completed ticket');
    return;
  }

  await updateTicket.mutateAsync({ id: ticket.id, status: newStatus });
};
```

### Pattern: Loading States

```typescript
const { data, isLoading, isError, error } = trpc.tickets.getTicket.useQuery({ id });

if (isLoading) return <Spinner />;
if (isError) return <ErrorMessage error={error.message} />;
return <TicketDetails ticket={data} />;
```

### Pattern: Dependent Queries

```typescript
const { data: ticket } = trpc.tickets.getTicket.useQuery({ id: ticketId });
const { data: tasks } = trpc.tickets.getTasks.useQuery(
  { ticketId: ticket?.id! },
  { enabled: !!ticket?.id }
);
```

### Pattern: Prefetching

```typescript
const utils = trpc.useContext();

const handleMouseEnter = (ticketId: string) => {
  utils.tickets.getTicket.prefetch({ id: ticketId });
};
```

---

**End of tRPC API Reference**

For additional support or to report issues, please refer to the project documentation or contact the development team.
