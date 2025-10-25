# RMA Batch Operations

**Feature ID:** PHASE2-1.10
**Status:** Implemented
**Version:** 1.0
**Last Updated:** 2025-10-24

---

## Table of Contents

1. [Overview](#overview)
2. [Business Process](#business-process)
3. [Creating RMA Batches](#creating-rma-batches)
4. [Managing Batches](#managing-batches)
5. [Status Lifecycle](#status-lifecycle)
6. [Technical Details](#technical-details)
7. [Best Practices](#best-practices)

---

## Overview

### What is RMA?

**RMA (Return Merchandise Authorization)** is a formal process for returning defective or faulty products to suppliers for replacement, repair, or credit. The RMA Batch Operations feature provides a systematic way to:

- Group multiple products for return to suppliers
- Track batch shipments with tracking numbers
- Maintain audit trails of returned products
- Manage product lifecycle from detection to resolution

### Key Features

- **Batch Creation**: Group multiple products into organized RMA batches
- **Auto-Numbering**: Automatic batch numbering in `RMA-YYYY-MM-NNN` format
- **Status Tracking**: Monitor batch progress through lifecycle stages
- **Product Management**: Add/track products within batches
- **Supplier Integration**: Associate batches with specific suppliers
- **Warehouse Integration**: Products automatically moved to RMA Staging warehouse
- **Audit Trail**: Complete history of all movements and status changes

### Use Cases

1. **Warranty Returns**: Return faulty warranty stock to manufacturers
2. **Dead Stock Disposal**: Batch return of non-functional products
3. **Supplier Exchanges**: Exchange defective inventory with suppliers
4. **Quality Issues**: Return products with quality problems discovered during service

---

## Business Process

### RMA Workflow Overview

```
1. Identify Products
   ↓
2. Create RMA Batch (Draft)
   ↓
3. Add Products to Batch
   ↓ (Products auto-moved to RMA Staging)
4. Finalize Batch (Submitted)
   ↓
5. Ship Products (Shipped)
   ↓
6. Supplier Receives (Received by Supplier)
   ↓
7. Resolution Complete (Resolved)
```

### Roles and Permissions

**Admin & Manager:**
- Create RMA batches
- Add products to batches
- Finalize batches
- View all batch details
- Update batch status

**Technician & Reception:**
- View RMA batches (read-only)
- Check product RMA status

### Prerequisites

Before creating an RMA batch:

1. **Physical Products**: Products must exist in inventory with serial numbers
2. **Virtual Warehouse**: RMA Staging virtual warehouse must be configured
3. **Product Condition**: Products should be in appropriate condition (faulty, for_parts)
4. **Supplier Information**: Supplier name or ID should be available

---

## Creating RMA Batches

### Step 1: Initiate Batch Creation

Navigate to **Dashboard → Inventory → RMA Management** and click **"Create RMA Batch"**.

### Step 2: Enter Batch Details

**Required Fields:**
- **Supplier Name**: Name of the supplier receiving the return
  - Example: "Samsung Vietnam", "LG Electronics"
  - Used for organizing and filtering batches

**Optional Fields:**
- **Shipping Date**: Planned or actual shipping date
- **Tracking Number**: Courier tracking number for shipment
- **Notes**: Internal notes about the batch
  - Reason for return
  - Special handling instructions
  - Contact information

### Step 3: Add Products to Batch

After batch creation, add products using one of these methods:

**Method 1: Serial Number Search**
```
1. Enter serial number in search field
2. Click "Add" when product is found
3. Product automatically moved to RMA Staging
4. Repeat for additional products
```

**Method 2: Product Selection**
```
1. Click "Select Products" button
2. Filter by condition (faulty, for_parts)
3. Filter by current warehouse
4. Select products from list
5. Click "Add Selected Products"
```

**Product Addition Logic:**
- Products are validated before adding
- Products already in another batch cannot be added
- Products automatically moved to RMA Staging warehouse
- Stock movement record created for audit trail
- Cannot add products to finalized batches

### Step 4: Review and Finalize

Before finalizing:
- Review all products in batch
- Verify supplier information
- Add shipping date and tracking number (if available)
- Add any final notes

**Finalization Rules:**
- Batch must contain at least one product
- Batch must be in "draft" status
- Once finalized, products cannot be added or removed
- Batch status changes to "submitted"

### Example: Creating a Warranty Return Batch

```
Scenario: Return 5 faulty phones to Samsung

1. Create Batch
   - Supplier: "Samsung Vietnam"
   - Notes: "Warranty returns - screen defects"

2. Add Products
   - SAMSUNG-SN001 (faulty)
   - SAMSUNG-SN002 (faulty)
   - SAMSUNG-SN003 (faulty)
   - SAMSUNG-SN004 (faulty)
   - SAMSUNG-SN005 (faulty)

3. Finalize
   - Shipping Date: 2025-10-25
   - Tracking: VNP1234567890
   - Status: Submitted

4. Auto-Generated Batch Number
   - RMA-2025-10-001
```

---

## Managing Batches

### Viewing RMA Batches

**Main RMA Page** (`/dashboard/inventory/rma`)

Displays batch table with:
- **Batch Number**: Auto-generated identifier (RMA-YYYY-MM-NNN)
- **Supplier**: Supplier name
- **Product Count**: Number of products in batch
- **Status**: Current batch status with color indicator
- **Shipping Date**: Planned/actual shipping date
- **Tracking Number**: Courier tracking number
- **Created By**: User who created the batch
- **Created At**: Batch creation timestamp

**Filters:**
- Status filter tabs (All, Draft, Submitted, Shipped, Completed)
- Date range filters
- Supplier search
- Batch number search

### Viewing Batch Details

Click on any batch to view full details:

**Batch Information Card:**
- Batch number and status
- Supplier details
- Shipping information (date, tracking)
- Creator and timestamps
- Notes

**Products Table:**
- Serial number
- Product name and SKU
- Product type
- Condition
- Added date
- Added by user

**Actions:**
- Update status (if permitted)
- Print manifest (future feature)
- Edit notes (draft only)
- Export product list

### Batch Statistics

Dashboard displays:
- **Total Batches**: All-time count
- **Draft Batches**: Pending finalization
- **Shipped Batches**: Currently in transit
- **Completed Batches**: Resolved returns

---

## Status Lifecycle

### Status Flow

```
draft → submitted → shipped → received_by_supplier → resolved
```

**Status cannot move backwards.** This ensures data integrity and accurate tracking.

### Status Definitions

#### 1. Draft (Initial State)

**Description:** Batch is being prepared, products can be added.

**Characteristics:**
- Products can be added or removed
- Batch details can be edited
- Not yet sent to supplier
- No shipping information required

**Actions Available:**
- Add products
- Edit supplier information
- Edit notes
- Finalize batch
- Delete batch

**Business Meaning:** Warehouse team is gathering products for return.

---

#### 2. Submitted (After Finalization)

**Description:** Batch finalized and ready for shipment.

**Characteristics:**
- Products locked (cannot add/remove)
- Awaiting physical shipment
- Shipping date and tracking number may be added
- Cannot revert to draft

**Actions Available:**
- Update shipping information
- Update status to "shipped"
- View product list
- Print manifest (future)

**Business Meaning:** Batch paperwork complete, waiting for courier pickup.

---

#### 3. Shipped (In Transit)

**Description:** Products physically shipped to supplier.

**Characteristics:**
- In transit to supplier
- Tracking number active
- Supplier expects delivery
- Products no longer on premises

**Actions Available:**
- Update tracking information
- Update status to "received_by_supplier"
- View shipment details

**Business Meaning:** Products en route to supplier warehouse.

---

#### 4. Received by Supplier (Supplier Confirmed)

**Description:** Supplier confirmed receipt of products.

**Characteristics:**
- Supplier has physical possession
- Inspection may be in progress
- Waiting for resolution (replacement/credit)

**Actions Available:**
- Update status to "resolved"
- Add supplier feedback notes
- Track resolution timeline

**Business Meaning:** Supplier inspecting products, processing claim.

---

#### 5. Resolved (Final State)

**Description:** RMA process completed, issue resolved.

**Characteristics:**
- Replacement products received, OR
- Credit issued, OR
- Products returned to sender
- No further action needed
- Archived status

**Actions Available:**
- View only (read-only)
- Generate final report

**Business Meaning:** RMA claim closed, financial settlement complete.

---

### Status Transition Rules

| From Status | To Status | Allowed? | Trigger |
|-------------|-----------|----------|---------|
| draft | submitted | ✅ Yes | Finalize batch (manual) |
| draft | Any other | ❌ No | Must finalize first |
| submitted | shipped | ✅ Yes | Add tracking, mark shipped |
| submitted | draft | ❌ No | No backwards flow |
| shipped | received_by_supplier | ✅ Yes | Supplier confirms receipt |
| shipped | submitted | ❌ No | No backwards flow |
| received_by_supplier | resolved | ✅ Yes | Resolution complete |
| resolved | Any | ❌ No | Final state |

---

## Technical Details

### Database Schema

#### RMA Batches Table

```sql
CREATE TABLE public.rma_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number VARCHAR(20) NOT NULL UNIQUE,
  supplier_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  shipping_date DATE,
  tracking_number VARCHAR(255),
  notes TEXT,
  created_by_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Columns:**
- `batch_number`: Auto-generated (RMA-YYYY-MM-NNN)
- `supplier_id`: Reference to supplier (optional)
- `status`: Current lifecycle status
- `shipping_date`: When batch was/will be shipped
- `tracking_number`: Courier tracking identifier
- `created_by_id`: User who created batch

**Indexes:**
- `idx_rma_batches_batch_number`: Fast batch lookup
- `idx_rma_batches_status`: Filter by status
- `idx_rma_batches_created`: Sort by creation date

---

#### RMA Batch Products Table

The `rma_batch_products` table is implied but not yet implemented in the current codebase. Products are tracked via the `physical_products.rma_batch_id` foreign key.

**Current Implementation:**
```sql
-- In physical_products table
rma_batch_id UUID REFERENCES rma_batches(id) ON DELETE SET NULL
```

**Future Enhancement (rma_batch_items):**
```sql
CREATE TABLE public.rma_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES rma_batches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES physical_products(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by_id UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  UNIQUE(batch_id, product_id)
);
```

---

### Automatic Batch Numbering

#### Format: RMA-YYYY-MM-NNN

**Components:**
- `RMA`: Prefix identifying batch type
- `YYYY`: Four-digit year (e.g., 2025)
- `MM`: Two-digit month (01-12)
- `NNN`: Three-digit sequence (001-999)

**Examples:**
- `RMA-2025-10-001` (First batch in October 2025)
- `RMA-2025-10-042` (42nd batch in October 2025)
- `RMA-2025-11-001` (First batch in November 2025)

#### Database Function

```sql
CREATE OR REPLACE FUNCTION generate_rma_batch_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_sequence INT;
  v_batch_number TEXT;
BEGIN
  -- Get current year and month
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');

  -- Find next sequence number for current month
  SELECT COALESCE(MAX(
    CASE
      WHEN batch_number ~ '^RMA-[0-9]{4}-[0-9]{2}-[0-9]{3}$'
        AND SUBSTRING(batch_number FROM 5 FOR 4) = v_year
        AND SUBSTRING(batch_number FROM 10 FOR 2) = v_month
      THEN CAST(SUBSTRING(batch_number FROM 13 FOR 3) AS INT)
      ELSE 0
    END
  ), 0) + 1
  INTO v_sequence
  FROM rma_batches;

  -- Generate batch number
  v_batch_number := 'RMA-' || v_year || '-' || v_month || '-' ||
                    LPAD(v_sequence::TEXT, 3, '0');

  NEW.batch_number := v_batch_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Key Features:**
- **Monthly Reset**: Sequence resets to 001 each month
- **Automatic**: Triggers on INSERT when batch_number is NULL
- **Collision-Safe**: Uses MAX() to find next available number
- **Format Validation**: Regex ensures proper format

---

### tRPC Procedures

Located in: `/src/server/routers/inventory.ts`

#### 1. createRMABatch

**Purpose:** Create new RMA batch in draft status

**Input:**
```typescript
{
  supplier_name: string (min 2 chars),
  shipping_date?: string (ISO date),
  tracking_number?: string,
  notes?: string
}
```

**Output:** Created RMA batch object

**Authorization:** Admin or Manager only

**Logic:**
1. Validate user authentication and role
2. Insert batch with status='draft'
3. Batch number auto-generated by trigger
4. Return created batch

---

#### 2. addProductsToRMA

**Purpose:** Add products to existing RMA batch

**Input:**
```typescript
{
  batch_id: string (UUID),
  product_ids: string[] (array of UUIDs)
}
```

**Output:**
```typescript
{
  success: boolean,
  added: number,
  errors?: string[]
}
```

**Authorization:** Admin or Manager only

**Logic:**
1. Verify batch exists and is in draft status
2. For each product:
   - Validate product exists
   - Check not already in another batch
   - Move to RMA Staging warehouse (if needed)
   - Record stock movement
   - Add to batch
3. Return success count and any errors

**Error Handling:** Partial success supported - processes all products, returns error list

---

#### 3. finalizeRMABatch

**Purpose:** Finalize batch and change status to submitted

**Input:**
```typescript
{
  batch_id: string (UUID),
  shipping_date?: string,
  tracking_number?: string
}
```

**Output:** Updated RMA batch object

**Authorization:** Admin or Manager only

**Validations:**
1. Batch must have at least one product
2. Batch must be in draft status
3. Cannot finalize twice

**Logic:**
1. Count products in batch
2. Validate non-empty
3. Update status to 'submitted'
4. Update shipping info (if provided)
5. Return updated batch

---

#### 4. getRMABatches

**Purpose:** List RMA batches with pagination

**Input:**
```typescript
{
  status?: 'draft' | 'submitted' | 'shipped' | 'completed',
  limit?: number (1-100, default 50),
  offset?: number (default 0)
}
```

**Output:**
```typescript
{
  batches: RMABatch[],
  total: number
}
```

**Authorization:** Admin or Manager only

**Features:**
- Optional status filter
- Pagination support
- Includes product count per batch
- Includes creator profile
- Sorted by creation date (newest first)

---

#### 5. getRMABatchDetails

**Purpose:** Get single batch with full product list

**Input:**
```typescript
{
  batch_id: string (UUID)
}
```

**Output:**
```typescript
{
  batch: RMABatch (with creator profile),
  products: PhysicalProduct[] (with product info, added_by)
}
```

**Authorization:** Any authenticated user

**Includes:**
- Full batch details
- Creator profile information
- All products in batch with:
  - Serial numbers
  - Product info (name, SKU, type)
  - Who added each product
  - When each product was added

---

### React Hooks

Located in: `/src/hooks/use-warehouse.ts`

```typescript
// Query hooks
const { data, isLoading } = useRMABatches({ status: 'draft' });
const { data: details } = useRMABatchDetails({ batch_id: 'uuid' });

// Mutation hooks
const createBatch = useCreateRMABatch();
const addProducts = useAddProductsToRMA();
const finalizeBatch = useFinalizeRMABatch();
```

**Features:**
- TanStack Query integration
- Automatic cache invalidation
- Loading and error states
- Optimistic updates

---

### UI Components

#### Main RMA Page

**Location:** `/src/app/(auth)/dashboard/inventory/rma/page.tsx`

**Features:**
- Stats cards (Total, Draft, Shipped, Completed)
- Status filter tabs
- Create RMA batch dialog
- Batches table with sorting
- Status badges with color coding

**Status Colors:**
- Draft: Gray
- Submitted: Blue
- Shipped: Yellow
- Received: Purple
- Resolved: Green

---

### Integration with Virtual Warehouses

When products are added to an RMA batch:

1. **Source Location**: Product can be in any virtual warehouse
2. **Automatic Movement**: Product moved to `rma_staging` warehouse
3. **Stock Movement Record**: Created with type `rma_out`
4. **Audit Trail**: Movement tracked in `stock_movements` table
5. **Product Update**: `virtual_warehouse_type` changed to `rma_staging`

**Stock Movement Example:**
```typescript
{
  physical_product_id: "uuid",
  movement_type: "rma_out",
  from_virtual_warehouse: "warranty_stock",
  to_virtual_warehouse: "rma_staging",
  notes: "Moved to RMA batch for supplier return",
  moved_by_id: "user-uuid"
}
```

---

## Best Practices

### 1. Batch Organization

**Group by Supplier:**
- Create separate batches per supplier
- Don't mix different suppliers in one batch
- Simplifies shipping and tracking

**Group by Issue Type:**
- Separate batches for warranty vs. non-warranty
- Group similar defects together
- Helps supplier process efficiently

**Optimal Batch Size:**
- **Minimum**: 3-5 products (economical shipping)
- **Maximum**: 50 products (manageable tracking)
- **Recommended**: 10-20 products per batch

### 2. Product Selection

**Before Adding to Batch:**
- Verify product is actually defective
- Document defect in product notes
- Check warranty status
- Ensure serial number is correct
- Take photos if needed

**Product Conditions Suitable for RMA:**
- `faulty`: Defective products
- `for_parts`: Products beyond repair
- Avoid: `new`, `refurbished`, `used` (unless defective)

### 3. Documentation

**Batch Notes Should Include:**
- Reason for return (warranty claim, quality issue)
- Defect patterns (all have same problem)
- Supplier RMA reference number (if provided)
- Special handling requirements
- Expected resolution (replacement/credit)

**Example Good Note:**
```
Warranty returns - 10 units with screen flickering issue
Supplier RMA#: RMA-SUPPLIER-2025-1234
Expecting replacement units within 14 days
Contact: John Doe (supplier@example.com)
```

### 4. Shipping Information

**When to Add Tracking:**
- Add tracking number as soon as available
- Update status to "shipped" when courier picks up
- Verify tracking number is correct

**Tracking Best Practices:**
- Use courier's official tracking format
- Include courier name in notes
- Monitor tracking status externally
- Update internal status when supplier confirms

### 5. Status Updates

**Timely Updates:**
- Update status promptly when changes occur
- Don't let batches sit in old status
- Document status change reasons in notes

**Status Change Timing:**
- **Draft → Submitted**: When all products gathered and paperwork complete
- **Submitted → Shipped**: When courier picks up package
- **Shipped → Received**: When supplier confirms receipt
- **Received → Resolved**: When resolution complete (replacement/credit received)

### 6. Communication

**With Suppliers:**
- Provide batch number in all communications
- Send product list before shipping
- Confirm receipt expectations
- Follow up on delayed resolutions

**Internal Team:**
- Notify team when batch is shipped
- Update team on supplier feedback
- Document resolution details
- Share replacement product info

### 7. Audit and Compliance

**Regular Reviews:**
- Weekly review of open batches
- Monthly RMA metrics analysis
- Identify slow-moving batches
- Track supplier response times

**Metrics to Track:**
- Average time from creation to resolution
- Success rate per supplier
- Most common return reasons
- Financial impact (cost of returns vs. credits)

### 8. Error Prevention

**Common Mistakes to Avoid:**
- ❌ Adding products already in another batch
- ❌ Finalizing empty batches
- ❌ Missing shipping dates and tracking
- ❌ Poor documentation in notes
- ❌ Not updating status after shipping
- ❌ Mixing multiple suppliers in one batch

**Pre-Finalization Checklist:**
- ✅ All products scanned and verified
- ✅ Supplier name correct
- ✅ Notes complete with return reason
- ✅ Product count matches physical count
- ✅ All products actually defective
- ✅ Shipping plan determined

### 9. Data Integrity

**Maintain Accuracy:**
- Verify serial numbers before adding
- Double-check product conditions
- Ensure products exist in inventory
- Validate supplier information

**Prevent Data Loss:**
- Don't delete batches (use status instead)
- Keep historical data for reports
- Maintain complete audit trail
- Archive resolved batches properly

### 10. Performance Optimization

**For Large Batches:**
- Add products in smaller groups
- Avoid adding 100+ products at once
- Use product filters to narrow selection
- Process in batches of 20-30 products

**System Health:**
- Don't keep too many draft batches open
- Finalize or delete abandoned drafts
- Regular cleanup of old resolved batches
- Monitor database performance

---

## Summary

The RMA Batch Operations feature provides a comprehensive solution for managing product returns to suppliers. By following the workflows and best practices outlined in this document, warehouse managers can:

- Efficiently organize product returns
- Maintain complete audit trails
- Track batch progress through lifecycle
- Integrate seamlessly with warehouse operations
- Ensure data accuracy and compliance

For technical implementation details, refer to:
- Story documentation: `/docs/stories/01.10.rma-batch-operations.md`
- Database schemas: `/docs/data/schemas/13_task_tables.sql`
- API implementation: `/src/server/routers/inventory.ts`
- UI components: `/src/app/(auth)/dashboard/inventory/rma/`

---

**Document Version:** 1.0
**Last Review:** 2025-10-24
**Next Review:** 2025-11-24
**Owner:** System Architect
**Stakeholders:** Warehouse Manager, Admin, Development Team
