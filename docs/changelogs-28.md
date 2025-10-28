# Changelog - October 28, 2025

## Removed Stock Levels Page

**Date:** October 28, 2025

### Summary
Removed the `/inventory/stock-levels` page and all related code from the application.

### Changes Made

#### 1. Page Deletion
- **Deleted:** `/src/app/(auth)/inventory/stock-levels/page.tsx`
  - Removed the entire Stock Levels dashboard page
  - This page displayed warehouse stock levels with filters and low stock alerts

#### 2. Navigation Updates
- **Modified:** `/src/components/app-sidebar.tsx`
  - Removed "Mức tồn kho" (Stock Levels) menu item from inventory section (lines 98-104)
  - Navigation now goes directly from "Sản phẩm vật lý" to "Quản lý RMA"

#### 3. Hook Cleanup
- **Modified:** `/src/hooks/use-warehouse.ts`
  - Removed `useStockLevels()` hook - queried stock levels with filters
  - Removed `useLowStockAlerts()` hook - fetched low stock alerts with counts
  - Removed `useExportStockReport()` hook - exported stock reports to CSV
  - Removed `useSetThreshold()` hook - set stock thresholds for products

#### 4. API Cleanup
- **Modified:** `/src/server/routers/physical-products.ts`
  - Removed `getStockLevels` tRPC procedure - aggregated stock levels query
  - Removed `getLowStockAlerts` tRPC procedure - low stock alerts query
  - Removed `exportStockReport` tRPC procedure - CSV export functionality
  - Removed `setThreshold` tRPC procedure - stock threshold management

### Components Preserved
- **`StockStatusBadge`** component was preserved as it's still used by:
  - `/src/components/inventory/overview/inventory-table-virtual.tsx`
  - `/src/components/inventory/overview/inventory-table-physical.tsx`
  - `/src/components/inventory/overview/inventory-table-all.tsx`

### Build Verification
- ✅ Project builds successfully without errors
- ✅ Route `/inventory/stock-levels` no longer appears in build output
- ✅ All TypeScript types validated successfully

### Documentation Note
Documentation files in `/docs/stories/` and `/docs/reports/` still reference the stock levels feature, but this is expected as they serve as historical records.

### Impact
This change removes the dedicated stock levels monitoring page. Stock information is still accessible through:
- Inventory Overview page (`/inventory/overview`)
- Physical Products page (`/inventory/products`)
- Related inventory tables that display stock status badges

---

## Inventory System Redesign - Virtual Warehouse Implementation

**Date:** October 28, 2025

### Summary
Complete redesign of the inventory management system to use specific virtual warehouse instances instead of warehouse types, with simplified document types and support for adjustment documents with negative quantities.

### Business Requirements
- Change from warehouse "types" to specific "virtual warehouse instances" because only virtual warehouses track stock
- Simplify receipt types from 5 to 2: `normal` (default) and `adjustment` (for stocktake/corrections)
- Simplify issue types from 6 to 2: `normal` (default) and `adjustment` (for stocktake/corrections)
- Adjustment documents allow negative quantities (positive = increase stock, negative = decrease stock)
- Transfer documents use 2 virtual warehouses (source and destination), and auto-generate both issue and receipt documents when approved

### Database Changes

#### 1. Migration Files (8 new migrations)
- **`20251028160000_inventory_redesign_part1_drop_old.sql`**
  - Dropped all existing inventory tables and ENUMs for clean slate

- **`20251028160001_inventory_redesign_part2_enums.sql`**
  - Created simplified ENUMs:
    ```sql
    CREATE TYPE stock_receipt_type AS ENUM ('normal', 'adjustment');
    CREATE TYPE stock_issue_type AS ENUM ('normal', 'adjustment');
    ```

- **`20251028160002_inventory_redesign_part3_receipts.sql`**
  - Redesigned `stock_receipts` table:
    - Changed from `virtual_warehouse_type + physical_warehouse_id` to `virtual_warehouse_id`
    - Allows negative quantities: `CONSTRAINT receipt_items_quantity_not_zero CHECK (declared_quantity != 0)`

- **`20251028160003_inventory_redesign_part4_issues.sql`**
  - Redesigned `stock_issues` table with same warehouse pattern

- **`20251028160004_inventory_redesign_part5_transfers.sql`**
  - Redesigned `stock_transfers` table:
    - Changed from warehouse types to warehouse IDs
    - Added auto-generation columns:
      ```sql
      generated_issue_id UUID REFERENCES stock_issues(id),
      generated_receipt_id UUID REFERENCES stock_receipts(id)
      ```

- **`20251028160005_inventory_redesign_part6_views.sql`**
  - Updated `v_stock_summary` view to use virtual warehouse relations
  - Added `virtual_warehouse_name` field

- **`20251028160006_inventory_redesign_part7_triggers.sql`**
  - Created `auto_generate_transfer_documents()` trigger
  - Automatically creates issue + receipt documents when transfer is approved
  - Copies items and serials to generated documents

- **`20251028160007_inventory_redesign_part8_fix_receipt_completion.sql`**
  - Fixed receipt completion trigger to use new field names

### Backend Changes

#### 1. Type Definitions (`src/types/inventory.ts`)
- Updated ENUMs:
  ```typescript
  export type StockReceiptType = 'normal' | 'adjustment';
  export type StockIssueType = 'normal' | 'adjustment';
  ```
- Updated interfaces to use `virtual_warehouse_id` instead of `virtual_warehouse_type`
- Added to `StockTransfer`:
  ```typescript
  generated_issue_id: string | null;
  generated_receipt_id: string | null;
  ```

#### 2. tRPC Routers

**Receipts Router** (`src/server/routers/inventory/receipts.ts`):
- Updated `create` input schema:
  ```typescript
  receiptType: z.enum(["normal", "adjustment"]),
  virtualWarehouseId: z.string(),
  items: z.array(z.object({
    declaredQuantity: z.number().int(), // Can be negative
  }))
  ```
- Added validation refinement for normal vs adjustment types
- Updated `getById` to include warehouse relation:
  ```typescript
  virtual_warehouse:virtual_warehouses!virtual_warehouse_id(id, name)
  ```

**Issues Router** (`src/server/routers/inventory/issues.ts`):
- Similar changes as receipts router
- Updated `getAvailableSerials` to fetch warehouse info first
- Added warehouse relation to `getById` query

**Transfers Router** (`src/server/routers/inventory/transfers.ts`):
- Changed input from:
  ```typescript
  fromVirtualWarehouseType: z.string(),
  toVirtualWarehouseType: z.string(),
  ```
- To:
  ```typescript
  fromVirtualWarehouseId: z.string(),
  toVirtualWarehouseId: z.string(),
  ```
- Updated `getById` to include:
  - Warehouse relations (from/to)
  - Generated document relations (issue/receipt)

### Frontend Changes

#### 1. Receipt Forms

**Receipt New Page** (`src/app/(auth)/inventory/documents/receipts/new/page.tsx`):
- Simplified type selector to 2 options:
  ```typescript
  const RECEIPT_TYPES = [
    { value: "normal", label: "Phiếu nhập bình thường" },
    { value: "adjustment", label: "Phiếu điều chỉnh (kiểm kê)" },
  ];
  ```
- Changed from warehouse type to warehouse ID:
  ```typescript
  const [virtualWarehouseId, setVirtualWarehouseId] = useState("");
  const { data: virtualWarehouses } = trpc.warehouse.listVirtualWarehouses.useQuery();
  ```
- Added adjustment alert:
  ```typescript
  {receiptType === "adjustment" && (
    <Alert>
      <AlertDescription>
        Số dương = tăng stock, số âm = giảm stock
      </AlertDescription>
    </Alert>
  )}
  ```
- Modified quantity input to allow negative for adjustments

**Receipt Detail Header** (`src/components/inventory/documents/receipt-detail-header.tsx`):
- Updated type labels from 5 to 2 options
- Added warehouse display:
  ```typescript
  <Label>Kho nhập</Label>
  <div>{receipt.virtual_warehouse?.name || "-"}</div>
  ```

**Receipt Items Table** (`src/components/inventory/documents/receipt-items-table.tsx`):
- Added red text styling for negative quantities:
  ```typescript
  <span className={item.declared_quantity < 0 ? "text-red-600 font-medium" : ""}>
    {item.declared_quantity}
  </span>
  ```

#### 2. Issue Forms

**Issue New Page** (`src/app/(auth)/inventory/documents/issues/new/page.tsx`):
- Same changes as receipt new page
- 2 issue types (normal/adjustment)
- Uses virtual warehouse IDs
- Allows negative quantities for adjustments

**Issue Detail Header** (`src/components/inventory/documents/issue-detail-header.tsx`):
- Updated type labels to 2 options
- Added warehouse display field

**Issue Items Table** (`src/components/inventory/documents/issue-items-table.tsx`):
- Added red text styling for negative quantities

#### 3. Transfer Forms

**Transfer New Page** (`src/app/(auth)/inventory/documents/transfers/new/page.tsx`):
- Changed state variables:
  ```typescript
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  ```
- Updated Select dropdowns to use `virtualWarehouses` from API
- Updated mutation call to use warehouse IDs

**Transfer Detail Header** (`src/components/inventory/documents/transfer-detail-header.tsx`):
- Updated to display warehouse names instead of types
- Added auto-generated document links:
  ```typescript
  {transfer.generated_issue && (
    <div>
      <Label>Phiếu xuất tự động</Label>
      <Link href={`/inventory/documents/issues/${transfer.generated_issue.id}`}>
        {transfer.generated_issue.issue_number}
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  )}
  ```

#### 4. Inventory Overview Components

**Physical Warehouse Table** (`src/components/inventory/overview/inventory-table-physical.tsx`):
- Updated table key from:
  ```typescript
  key={`${item.product_id}-${item.virtual_warehouse_type}`}
  ```
- To:
  ```typescript
  key={`${item.product_id}-${item.virtual_warehouse_id}`}
  ```
- Updated warehouse display:
  ```typescript
  {item.virtual_warehouse_name}
  ```

### Key Features

#### 1. Negative Quantities Only for Adjustments
- Normal receipts/issues: must be positive
- Adjustment receipts/issues: can be positive or negative (but not zero)
- Frontend validates based on document type
- Backend uses Zod refinement for validation

#### 2. Warehouse Display
- Old: "Kho Bảo Hành" (type name)
- New: "Warehouse A - Kho Chính" (virtual warehouse instance name)

#### 3. Auto-Generated Documents
- Only shown for transfers with status >= 'approved'
- Links visible in transfer detail page
- Both documents link back to the transfer
- Created automatically by database trigger

#### 4. Type Labels
Vietnamese labels:
- `normal` → "Bình thường"
- `adjustment` → "Điều chỉnh (kiểm kê)"

### Files Modified

**Backend (7 files):**
- `src/types/inventory.ts` - Type definitions
- `src/server/routers/inventory/receipts.ts` - Receipts router
- `src/server/routers/inventory/issues.ts` - Issues router
- `src/server/routers/inventory/transfers.ts` - Transfers router

**Frontend (11 files):**
- `src/app/(auth)/inventory/documents/receipts/new/page.tsx` - Receipt creation
- `src/app/(auth)/inventory/documents/receipts/[id]/page.tsx` - Receipt detail
- `src/app/(auth)/inventory/documents/issues/new/page.tsx` - Issue creation
- `src/app/(auth)/inventory/documents/issues/[id]/page.tsx` - Issue detail
- `src/app/(auth)/inventory/documents/transfers/new/page.tsx` - Transfer creation
- `src/components/inventory/documents/receipt-detail-header.tsx` - Receipt header
- `src/components/inventory/documents/receipt-items-table.tsx` - Receipt items
- `src/components/inventory/documents/issue-detail-header.tsx` - Issue header
- `src/components/inventory/documents/issue-items-table.tsx` - Issue items
- `src/components/inventory/documents/transfer-detail-header.tsx` - Transfer header
- `src/components/inventory/overview/inventory-table-physical.tsx` - Overview table

**Database (8 files):**
- `supabase/migrations/20251028160000_inventory_redesign_part1_drop_old.sql`
- `supabase/migrations/20251028160001_inventory_redesign_part2_enums.sql`
- `supabase/migrations/20251028160002_inventory_redesign_part3_receipts.sql`
- `supabase/migrations/20251028160003_inventory_redesign_part4_issues.sql`
- `supabase/migrations/20251028160004_inventory_redesign_part5_transfers.sql`
- `supabase/migrations/20251028160005_inventory_redesign_part6_views.sql`
- `supabase/migrations/20251028160006_inventory_redesign_part7_triggers.sql`
- `supabase/migrations/20251028160007_inventory_redesign_part8_fix_receipt_completion.sql`

### Build Verification
- ✅ All TypeScript compilation succeeded
- ✅ No compilation errors
- ✅ Production build completed successfully
- ✅ All routes generated without issues

### Testing Checklist
After deployment, verify:

**Transfers:**
- [ ] Create transfer (select virtual warehouses)
- [ ] Approve transfer → verify auto-generated issue + receipt
- [ ] Complete transfer → verify both documents completed
- [ ] Check stock updated correctly

**Receipts:**
- [ ] Create normal receipt
- [ ] Create adjustment receipt with negative quantity
- [ ] Verify stock increases (positive) or decreases (negative)
- [ ] Submit for approval

**Issues:**
- [ ] Create normal issue
- [ ] Create adjustment issue with negative quantity
- [ ] Verify stock decreases (positive) or increases (negative)
- [ ] Submit for approval

**Stock Overview:**
- [ ] View stock by virtual warehouse
- [ ] Verify warehouse names display correctly
- [ ] Check filters work with new structure

### Impact
This is a breaking change that completely redesigns the inventory system:
- **Simplified workflow** - Reduced from 11 document types to 4 (2 receipt + 2 issue)
- **Better accuracy** - Virtual warehouse instances track actual stock locations
- **Flexible adjustments** - Negative quantities allow for corrections
- **Automated transfers** - Auto-generates issue and receipt documents
- **Improved UX** - Clearer warehouse selection, visual indicators for negative quantities

### Migration Notes
- This requires a clean database state (all existing inventory data will be lost)
- Run migrations in exact order (part1 through part8)
- Test thoroughly before production deployment
- Backup existing data before migration
