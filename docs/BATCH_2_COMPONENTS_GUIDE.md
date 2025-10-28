# Batch 2 - UI Components Implementation Guide

**Status:** ✅ Shared Components Complete | ⏳ Overview Components In Progress
**Date:** 2025-01-27

---

## ✅ COMPLETED - Shared Components (4/4)

### 1. Stock Status Badge
**File:** `src/components/inventory/shared/stock-status-badge.tsx`
**Status:** ✅ Complete
**Usage:**
```tsx
import { StockStatusBadge } from "@/components/inventory/shared/stock-status-badge";
<StockStatusBadge status="critical" />
```

### 2. Document Status Badge
**File:** `src/components/inventory/shared/document-status-badge.tsx`
**Status:** ✅ Complete
**Usage:**
```tsx
import { DocumentStatusBadge } from "@/components/inventory/shared/document-status-badge";
<DocumentStatusBadge status="pending_approval" />
```

### 3. Warehouse Selectors
**File:** `src/components/inventory/shared/warehouse-selector.tsx`
**Status:** ✅ Complete
**Usage:**
```tsx
import { VirtualWarehouseSelector, PhysicalWarehouseSelector } from "@/components/inventory/shared/warehouse-selector";

<VirtualWarehouseSelector
  value={virtualWarehouse}
  onValueChange={setVirtualWarehouse}
/>

<PhysicalWarehouseSelector
  value={physicalWarehouse}
  onValueChange={setPhysicalWarehouse}
/>
```

### 4. Product Search
**File:** `src/components/inventory/shared/product-search.tsx`
**Status:** ✅ Complete
**Usage:**
```tsx
import { ProductSearch } from "@/components/inventory/shared/product-search";
<ProductSearch value={productId} onValueChange={setProductId} />
```

---

## ⏳ IN PROGRESS - Overview Page Components

### 5. Inventory Stat Cards
**File:** `src/components/inventory/overview/inventory-stat-cards.tsx`
**Status:** ✅ Complete
Displays 3 cards: Total SKUs, Total Stock, Alerts

### 6. Inventory Tabs Navigation
**File:** `src/components/inventory/overview/inventory-tabs.tsx`
**Status:** ⏳ Need to create

**Implementation:**
```tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTableAll } from "./inventory-table-all";
import { InventoryTablePhysical } from "./inventory-table-physical";
import { InventoryTableVirtual } from "./inventory-table-virtual";

export function InventoryTabs() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="all">All Warehouses</TabsTrigger>
        <TabsTrigger value="physical">Physical</TabsTrigger>
        <TabsTrigger value="virtual">Virtual</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <InventoryTableAll />
      </TabsContent>

      <TabsContent value="physical" className="mt-4">
        <InventoryTablePhysical />
      </TabsContent>

      <TabsContent value="virtual" className="mt-4">
        <InventoryTableVirtual />
      </TabsContent>
    </Tabs>
  );
}
```

### 7. All Warehouses Table
**File:** `src/components/inventory/overview/inventory-table-all.tsx`
**Status:** ⏳ Need to create

**Implementation Pattern:**
```tsx
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockStatusBadge } from "../shared/stock-status-badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function InventoryTableAll() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ok" | "warning" | "critical" | undefined>();

  const { data: stock, isLoading } = trpc.inventory.stock.getAggregated.useQuery({
    search,
    status,
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={status || ""}
          onChange={(e) => setStatus(e.target.value as any || undefined)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Status</option>
          <option value="ok">OK</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Declared</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Gap</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : !stock || stock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No stock data found.
                </TableCell>
              </TableRow>
            ) : (
              stock.map((item) => (
                <TableRow key={item.product_id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell>{item.sku || "-"}</TableCell>
                  <TableCell className="text-right">{item.total_declared}</TableCell>
                  <TableCell className="text-right">{item.total_actual}</TableCell>
                  <TableCell className="text-right">
                    {item.serial_gap !== 0 && (
                      <span className={item.serial_gap > 0 ? "text-yellow-600" : "text-red-600"}>
                        {item.serial_gap > 0 ? `+${item.serial_gap}` : item.serial_gap}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StockStatusBadge status={item.stock_status} />
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

### 8. Physical Warehouse Table
**File:** `src/components/inventory/overview/inventory-table-physical.tsx`
**Status:** ⏳ Need to create

Similar to All Warehouses table but with:
- Physical warehouse selector dropdown
- Uses `trpc.inventory.stock.getByPhysicalWarehouse.useQuery()`
- Shows physical warehouse breakdown

### 9. Virtual Warehouse Table
**File:** `src/components/inventory/overview/inventory-table-virtual.tsx`
**Status:** ⏳ Need to create

Similar pattern but with:
- Virtual warehouse selector (warranty_stock, rma_staging, etc.)
- Uses `trpc.inventory.stock.getByVirtualWarehouse.useQuery()`

### 10. Main Overview Page
**File:** `src/app/(auth)/inventory/overview/page.tsx`
**Status:** ⏳ Need to create

**Implementation:**
```tsx
import { InventoryStatCards } from "@/components/inventory/overview/inventory-stat-cards";
import { InventoryTabs } from "@/components/inventory/overview/inventory-tabs";

export default function InventoryOverviewPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Overview</h1>
        <p className="text-muted-foreground">
          Monitor stock levels across all warehouses
        </p>
      </div>

      <InventoryStatCards />

      <InventoryTabs />
    </div>
  );
}
```

---

## 🔥 CRITICAL - Serial Entry Drawer

This is the most important component for data entry workflow.

### 11. Serial Entry Drawer
**File:** `src/components/inventory/serials/serial-entry-drawer.tsx`
**Status:** ⏳ Need to create

**Key Features:**
- Drawer/Modal for entering multiple serial numbers
- Real-time validation against duplicates
- Progress tracking (e.g., "5/10 serials entered")
- Batch entry (paste multiple serials)
- Individual add/remove
- Warranty date/months per serial
- CSV import button

**Implementation Pattern:**
```tsx
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SerialValidationDisplay } from "./serial-validation-display";
import { SerialProgressBar } from "./serial-progress-bar";

interface SerialEntryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptItemId: string;
  declaredQuantity: number;
  currentSerialCount: number;
  onSuccess: () => void;
}

export function SerialEntryDrawer({
  open,
  onOpenChange,
  receiptItemId,
  declaredQuantity,
  currentSerialCount,
  onSuccess,
}: SerialEntryDrawerProps) {
  const [serialInput, setSerialInput] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);

  const validateMutation = trpc.inventory.serials.validateSerials.useMutation();
  const addSerialsMutation = trpc.inventory.receipts.addSerials.useMutation();

  const handleValidate = async () => {
    const serials = serialInput
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    const result = await validateMutation.mutateAsync({ serialNumbers: serials });
    setValidationResult(result);
  };

  const handleAdd = async () => {
    if (!validationResult || !validationResult.summary.allValid) return;

    const serials = validationResult.results
      .filter((r: any) => r.isValid)
      .map((r: any) => ({ serialNumber: r.serialNumber }));

    await addSerialsMutation.mutateAsync({
      receiptItemId,
      serials,
    });

    onSuccess();
    setSerialInput("");
    setValidationResult(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Add Serial Numbers</SheetTitle>
          <SheetDescription>
            Enter serial numbers (one per line). {declaredQuantity - currentSerialCount} remaining.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <SerialProgressBar
            current={currentSerialCount}
            total={declaredQuantity}
          />

          <div>
            <Label htmlFor="serials">Serial Numbers</Label>
            <Textarea
              id="serials"
              placeholder="SN001\nSN002\nSN003"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              rows={10}
              className="font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleValidate}
              disabled={!serialInput.trim() || validateMutation.isPending}
            >
              {validateMutation.isPending ? "Validating..." : "Validate"}
            </Button>

            {validationResult && (
              <Button
                onClick={handleAdd}
                disabled={!validationResult.summary.allValid || addSerialsMutation.isPending}
                variant={validationResult.summary.allValid ? "default" : "secondary"}
              >
                {addSerialsMutation.isPending ? "Adding..." : "Add Serials"}
              </Button>
            )}
          </div>

          {validationResult && (
            <SerialValidationDisplay validation={validationResult} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### 12. Serial Validation Display
**File:** `src/components/inventory/serials/serial-validation-display.tsx`
**Pattern:** Display validation results with icons (✅ valid, ❌ duplicate, etc.)

### 13. Serial Progress Bar
**File:** `src/components/inventory/serials/serial-progress-bar.tsx`
**Pattern:** Simple progress bar showing "5/10 serials (50%)"

---

## 📝 REMAINING - Receipt Wizard

### 14. Receipt Create Drawer (3-Step Wizard)
**File:** `src/components/inventory/receipts/receipt-create-drawer.tsx`

**Steps:**
1. **Step 1:** Receipt type, warehouse, date, supplier
2. **Step 2:** Add product items with quantities
3. **Step 3:** Review and create

---

## 🎯 NEXT ACTIONS

**Option 1 - Continue with Batch 2:**
I can continue generating the remaining overview components (tables, page) and the serial entry drawer.

**Option 2 - Test API First:**
Use the completed API layer to test backend functionality before building more UI.

**Option 3 - Prioritize Critical Components:**
Focus only on the serial entry drawer and receipt wizard (most used features).

**What would you like me to do?**
