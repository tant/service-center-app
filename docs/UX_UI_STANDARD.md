# UX/UI Standard - Service Center Application

**Version:** 1.0
**Date:** 2025-10-23
**Reference Pages:** `/parts`, `/products`

## Table of Contents

1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Layout Components](#layout-components)
4. [Table Components](#table-components)
5. [Pagination System](#pagination-system)
6. [Interactive Elements](#interactive-elements)
7. [Responsive Design](#responsive-design)
8. [Spacing & Typography](#spacing--typography)
9. [Accessibility](#accessibility)
10. [Implementation Checklist](#implementation-checklist)

---

## Overview

This document defines the standard UX/UI patterns for all data listing pages in the Service Center application. All new pages MUST follow these standards to ensure consistency across the application.

**Standard Reference Pages:**
- `/parts` (Linh kiện) - `src/components/parts-table.tsx`
- `/products` (Sản phẩm) - `src/components/product-table.tsx`

**Key Principle:** Same UX/UI structure, different functionality only.

---

## Page Structure

### Page Layout Hierarchy

```tsx
<>
  <PageHeader title="[Page Title]" />
  <div className="flex flex-1 flex-col">
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <[TableComponent] data={data} />
      </div>
    </div>
  </div>
</>
```

### Wrapper Classes (MANDATORY)

```tsx
// Outer container
className="flex flex-1 flex-col"

// Container query wrapper (for responsive tabs/selects)
className="@container/main flex flex-1 flex-col gap-2"

// Content wrapper with responsive padding
className="flex flex-col gap-4 py-4 md:gap-6 md:py-6"
```

**Gap Standards:**
- Mobile: `gap-4`, `py-4`
- Desktop (md+): `gap-6`, `py-6`

---

## Layout Components

### 1. Tabs System

All table pages MUST use `Tabs` component with mobile/desktop variants:

```tsx
<Tabs defaultValue="[default-tab]" className="w-full flex-col justify-start gap-6">
  {/* Row 1: View Selector / Tabs + Action Buttons */}
  <div className="flex items-center justify-between px-4 lg:px-6">
    {/* Mobile: Select Dropdown */}
    <Select defaultValue="[default-tab]">
      <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm">
        <SelectValue placeholder="[Placeholder]" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tab1">Tab 1 Name</SelectItem>
        <SelectItem value="tab2">Tab 2 Name</SelectItem>
      </SelectContent>
    </Select>

    {/* Desktop: Tab List */}
    <TabsList className="hidden @4xl/main:flex">
      <TabsTrigger value="tab1">Tab 1 Name</TabsTrigger>
      <TabsTrigger value="tab2">Tab 2 Name</TabsTrigger>
    </TabsList>

    {/* Action Buttons */}
    <div className="flex items-center gap-2">
      {/* Buttons here */}
    </div>
  </div>

  {/* Tab Contents */}
  <TabsContent value="tab1" className="relative flex flex-col gap-4 px-4 lg:px-6">
    {/* Content */}
  </TabsContent>
</Tabs>
```

**Breakpoint:** `@4xl/main` (container query)

### 2. Action Buttons Row

Located in the tabs header, right-aligned:

```tsx
<div className="flex items-center gap-2">
  {/* Optional: Column Visibility Dropdown */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <IconLayoutColumns />
        <span className="hidden lg:inline">Tùy chỉnh cột</span>
        <span className="lg:hidden">Cột</span>
        <IconChevronDown />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      {/* Column checkboxes */}
    </DropdownMenuContent>
  </DropdownMenu>

  {/* Primary Action: Create/Add */}
  <Button variant="outline" size="sm">
    <IconPlus />
    <span className="hidden lg:inline">[Full Action Text]</span>
  </Button>

  {/* Optional: Sample Data Button */}
  <AddSampleDataButton />
</div>
```

**Button Standards:**
- Size: `sm`
- Variant: `outline`
- Icons: Always include icon
- Text: Hidden on mobile (`hidden lg:inline`), shown on desktop

---

## Table Components

### Table Structure

```tsx
<div className="overflow-hidden rounded-lg border">
  <Table>
    <TableHeader className="bg-muted sticky top-0 z-10">
      {/* Headers */}
    </TableHeader>
    <TableBody>
      {/* Rows */}
    </TableBody>
  </Table>
</div>
```

**Header Standards:**
- Background: `bg-muted`
- Position: `sticky top-0 z-10`
- Container: `overflow-hidden rounded-lg border`

### Column Definitions

#### Required Columns (if applicable)

1. **Select Column** (for bulk operations)
```tsx
{
  id: "select",
  header: ({ table }) => (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Chọn tất cả"
      />
    </div>
  ),
  cell: ({ row }) => (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Chọn hàng"
      />
    </div>
  ),
  enableSorting: false,
  enableHiding: false,
}
```

2. **Name/Primary Column** (clickable to edit)
```tsx
{
  accessorKey: "name",
  header: "[Column Title]",
  cell: ({ row }) => (
    <Button
      variant="ghost"
      className="h-auto p-2 font-medium hover:bg-accent"
      onClick={() => onEdit(row.original.id)}
    >
      {row.original.name}
    </Button>
  ),
  enableHiding: false,
}
```

**IMPORTANT:** Primary column MUST be clickable button to open edit modal.

3. **Actions Column**
```tsx
{
  id: "actions",
  header: () => <div className="text-right">Hành động</div>,
  cell: ({ row }) => (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            Hành động
            <IconChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
            <IconEdit className="mr-2 h-4 w-4" />
            Sửa
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(row.original.id)}
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
}
```

### Search/Filter Bar

Located above table:

```tsx
<div className="flex items-center gap-2">
  <Input
    placeholder="[Search placeholder in Vietnamese]..."
    value={searchValue}
    onChange={(e) => setSearchValue(e.target.value)}
    className="max-w-sm"
  />
  {/* Additional filters if needed */}
</div>
```

**Max Width:** `max-w-sm` (320px)

### Empty State

```tsx
<TableRow>
  <TableCell colSpan={columns.length} className="h-24 text-center">
    Không tìm thấy [entity name] nào.
  </TableCell>
</TableRow>
```

---

## Pagination System

### MANDATORY Pagination Components

ALL table pages MUST include full pagination with these components:

```tsx
<div className="flex items-center justify-between px-4">
  {/* Left: Selection Count */}
  <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
    Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong{" "}
    {table.getFilteredRowModel().rows.length} [entity name]
  </div>

  {/* Right: Pagination Controls */}
  <div className="flex w-full items-center gap-8 lg:w-fit">
    {/* Page Size Selector */}
    <div className="hidden items-center gap-2 lg:flex">
      <Label htmlFor="rows-per-page" className="text-sm font-medium">
        Số dòng mỗi trang
      </Label>
      <Select
        value={`${table.getState().pagination.pageSize}`}
        onValueChange={(value) => table.setPageSize(Number(value))}
      >
        <SelectTrigger size="sm" className="w-20" id="rows-per-page">
          <SelectValue placeholder={table.getState().pagination.pageSize} />
        </SelectTrigger>
        <SelectContent side="top">
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <SelectItem key={pageSize} value={`${pageSize}`}>
              {pageSize}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Page Info */}
    <div className="flex w-fit items-center justify-center text-sm font-medium">
      Trang {table.getState().pagination.pageIndex + 1} trên{" "}
      {table.getPageCount()}
    </div>

    {/* Navigation Buttons */}
    <div className="ml-auto flex items-center gap-2 lg:ml-0">
      {/* First Page (desktop only) */}
      <Button
        variant="outline"
        className="hidden h-8 w-8 p-0 lg:flex"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        <span className="sr-only">Đến trang đầu</span>
        <IconChevronsLeft />
      </Button>

      {/* Previous Page */}
      <Button
        variant="outline"
        className="size-8"
        size="icon"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <span className="sr-only">Trang trước</span>
        <IconChevronLeft />
      </Button>

      {/* Next Page */}
      <Button
        variant="outline"
        className="size-8"
        size="icon"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <span className="sr-only">Trang tiếp</span>
        <IconChevronRight />
      </Button>

      {/* Last Page (desktop only) */}
      <Button
        variant="outline"
        className="hidden size-8 lg:flex"
        size="icon"
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        <span className="sr-only">Đến trang cuối</span>
        <IconChevronsRight />
      </Button>
    </div>
  </div>
</div>
```

### Required Icons

Import from `@tabler/icons-react`:
```tsx
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
```

### Pagination State

```tsx
const [pagination, setPagination] = React.useState({
  pageIndex: 0,
  pageSize: 10,
});

const table = useReactTable({
  // ...
  state: {
    pagination,
    // ... other states
  },
  onPaginationChange: setPagination,
  getPaginationRowModel: getPaginationRowModel(),
});
```

### Page Size Options

MUST support: `[10, 20, 30, 40, 50]`

---

## Interactive Elements

### Row Selection

Required for bulk operations:

```tsx
const [rowSelection, setRowSelection] = React.useState({});

const table = useReactTable({
  // ...
  state: {
    rowSelection,
    // ...
  },
  getRowId: (row) => row.id,
  enableRowSelection: true,
  onRowSelectionChange: setRowSelection,
});
```

### Column Visibility

```tsx
const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

const table = useReactTable({
  // ...
  state: {
    columnVisibility,
    // ...
  },
  onColumnVisibilityChange: setColumnVisibility,
});
```

### Sorting

```tsx
const [sorting, setSorting] = React.useState<SortingState>([]);

const table = useReactTable({
  // ...
  state: {
    sorting,
    // ...
  },
  onSortingChange: setSorting,
  getSortedRowModel: getSortedRowModel(),
});
```

### Filtering

```tsx
const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
const [searchValue, setSearchValue] = React.useState("");

// For simple search
const filteredData = React.useMemo(() => {
  if (!searchValue) return initialData;

  return initialData.filter((item) => {
    const searchLower = searchValue.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.sku?.toLowerCase().includes(searchLower)
      // Add other searchable fields
    );
  });
}, [initialData, searchValue]);

const table = useReactTable({
  data: filteredData,
  // ...
  state: {
    columnFilters,
    // ...
  },
  onColumnFiltersChange: setColumnFilters,
  getFilteredRowModel: getFilteredRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
});
```

---

## Responsive Design

### Breakpoint Standards

- **Mobile:** Default (< 640px)
- **Tablet:** `md:` (640px+)
- **Desktop:** `lg:` (1024px+)
- **Container Query:** `@4xl/main` (for tabs)

### Mobile Optimizations

1. **Buttons:** Icon only, text hidden
   ```tsx
   <span className="hidden lg:inline">[Button Text]</span>
   ```

2. **Tabs:** Use Select dropdown instead of TabsList
   ```tsx
   className="flex w-fit @4xl/main:hidden"  // Mobile Select
   className="hidden @4xl/main:flex"        // Desktop Tabs
   ```

3. **Pagination:** Hide first/last buttons, hide page size selector
   ```tsx
   className="hidden h-8 w-8 p-0 lg:flex"  // First/Last buttons
   ```

4. **Selection Count:** Hide on mobile
   ```tsx
   className="text-muted-foreground hidden flex-1 text-sm lg:flex"
   ```

### Padding Standards

```tsx
// Horizontal padding
px-4 lg:px-6

// Vertical padding
py-4 md:py-6

// Gap spacing
gap-4 md:gap-6
```

---

## Spacing & Typography

### Container Spacing

```tsx
// Outer wrapper
gap-2                          // Between page sections

// Content wrapper
gap-4 py-4 md:gap-6 md:py-6   // Responsive content spacing

// Tab content
gap-4 px-4 lg:px-6             // Tab inner spacing
```

### Component Gaps

```tsx
// Button groups
gap-2

// Form fields
gap-4

// Pagination controls
gap-2  (buttons)
gap-8  (sections)
```

### Font Sizes

```tsx
// Headers
text-lg font-semibold       // Section headers
text-sm font-medium         // Labels

// Body
text-sm                     // Table cells
text-xs                     // Small badges

// Muted text
text-muted-foreground       // Secondary info
```

---

## Accessibility

### Screen Reader Text

ALL icon-only buttons MUST have screen reader labels:

```tsx
<Button>
  <span className="sr-only">Descriptive action</span>
  <IconName />
</Button>
```

### ARIA Labels

```tsx
// Checkbox
aria-label="Chọn tất cả"
aria-label="Chọn hàng"

// Select
<Label htmlFor="unique-id" className="sr-only">Label Text</Label>
<Select>
  <SelectTrigger id="unique-id">...</SelectTrigger>
</Select>
```

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Use semantic HTML (Button, not div with onClick)
- Maintain logical tab order

---

## Implementation Checklist

When creating a new table/listing page, verify ALL these items:

### ✅ Page Structure
- [ ] PageHeader with Vietnamese title
- [ ] Proper wrapper hierarchy (`flex flex-1 flex-col` → `@container/main` → content)
- [ ] Responsive padding (`py-4 md:py-6`)

### ✅ Tabs System
- [ ] Mobile Select dropdown (hidden on `@4xl/main`)
- [ ] Desktop TabsList (shown on `@4xl/main`)
- [ ] Proper default value
- [ ] Vietnamese labels

### ✅ Action Buttons
- [ ] Icon + text pattern (text hidden on mobile)
- [ ] `size="sm" variant="outline"`
- [ ] Proper gap spacing (`gap-2`)

### ✅ Table Structure
- [ ] Sticky header with `bg-muted sticky top-0 z-10`
- [ ] Rounded border container
- [ ] Empty state message in Vietnamese

### ✅ Columns
- [ ] Select column (if bulk operations needed)
- [ ] Clickable primary column (Button with `onClick`)
- [ ] Actions dropdown (right-aligned)
- [ ] All columns have Vietnamese headers

### ✅ Search/Filter
- [ ] Input with `max-w-sm`
- [ ] Vietnamese placeholder
- [ ] Proper filtering logic

### ✅ Pagination (COMPLETE SYSTEM)
- [ ] Selection count (left, hidden on mobile)
- [ ] Page size selector (10, 20, 30, 40, 50)
- [ ] Page info ("Trang X trên Y")
- [ ] 4 navigation buttons (First, Prev, Next, Last)
- [ ] First/Last hidden on mobile
- [ ] All buttons have screen reader labels
- [ ] Icons from `@tabler/icons-react`
- [ ] `justify-between` layout

### ✅ State Management
- [ ] `rowSelection` (if checkboxes)
- [ ] `columnVisibility` (if column toggle)
- [ ] `sorting`
- [ ] `columnFilters`
- [ ] `pagination` (pageIndex, pageSize)

### ✅ Responsive
- [ ] Container queries for tabs
- [ ] Media queries for buttons, padding
- [ ] Mobile-first approach

### ✅ Accessibility
- [ ] Screen reader labels on all icon buttons
- [ ] ARIA labels on form controls
- [ ] Semantic HTML
- [ ] Keyboard navigation works

### ✅ Vietnamese Localization
- [ ] All UI text in Vietnamese
- [ ] Search placeholders
- [ ] Button labels
- [ ] Empty states
- [ ] Pagination labels

---

## Common Pitfalls to Avoid

### ❌ WRONG: Simplified Pagination

```tsx
// DON'T DO THIS (from old template-list-table.tsx)
<div className="flex items-center justify-end space-x-2">
  <Button onClick={() => table.previousPage()}>Trước</Button>
  <Button onClick={() => table.nextPage()}>Sau</Button>
</div>
```

### ✅ CORRECT: Full Pagination System

See [Pagination System](#pagination-system) section above.

### ❌ WRONG: Non-Clickable Primary Column

```tsx
// DON'T DO THIS
<div className="font-medium">{row.original.name}</div>
```

### ✅ CORRECT: Clickable Primary Column

```tsx
// DO THIS
<Button
  variant="ghost"
  className="h-auto p-2 font-medium hover:bg-accent"
  onClick={() => onEdit(row.original.id)}
>
  {row.original.name}
</Button>
```

### ❌ WRONG: Missing Column Visibility

```tsx
// DON'T: Hardcode all columns visible
```

### ✅ CORRECT: Column Visibility Control

```tsx
// DO: Add dropdown menu for column visibility
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <IconLayoutColumns />
      <span className="hidden lg:inline">Tùy chỉnh cột</span>
    </Button>
  </DropdownMenuTrigger>
  {/* Column checkboxes */}
</DropdownMenu>
```

---

## Code Templates

### Minimal Table Component Template

```tsx
"use client";

import * as React from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconEdit,
  IconLayoutColumns,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataItem {
  id: string;
  name: string;
  // ... other fields
}

const columns: ColumnDef<DataItem>[] = [
  // Select column
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn hàng"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Name column (clickable)
  {
    accessorKey: "name",
    header: "Tên",
    cell: ({ row, table }) => {
      const onEdit = (table.options.meta as any)?.onEdit;
      return (
        <Button
          variant="ghost"
          className="h-auto p-2 font-medium hover:bg-accent"
          onClick={() => onEdit?.(row.original.id)}
        >
          {row.original.name}
        </Button>
      );
    },
    enableHiding: false,
  },
  // Actions column
  {
    id: "actions",
    header: () => <div className="text-right">Hành động</div>,
    cell: ({ row, table }) => {
      const onEdit = (table.options.meta as any)?.onEdit;
      const onDelete = (table.options.meta as any)?.onDelete;
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Hành động
                <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(row.original.id)}>
                <IconEdit className="mr-2 h-4 w-4" />
                Sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(row.original.id)}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function DataTable({
  data: initialData,
  onEdit,
  onDelete,
  onCreateNew,
}: {
  data: DataItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchValue, setSearchValue] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchValue) return initialData;
    return initialData.filter((item) =>
      item.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [initialData, searchValue]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    meta: {
      onEdit,
      onDelete,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Tabs defaultValue="list" className="w-full flex-col justify-start gap-6">
      {/* Row 1: Tabs + Buttons */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="list">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Chọn hiển thị" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">Danh sách</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="list">Danh sách</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Tùy chỉnh cột</span>
                <span className="lg:hidden">Cột</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onCreateNew} size="sm" variant="outline">
            <IconPlus />
            <span className="hidden lg:inline">Tạo mới</span>
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <TabsContent value="list" className="relative flex flex-col gap-4 px-4 lg:px-6">
        {/* Search */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Không tìm thấy dữ liệu.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong{" "}
            {table.getFilteredRowModel().rows.length} mục
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Số dòng mỗi trang
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Trang {table.getState().pagination.pageIndex + 1} trên{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Đến trang đầu</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Trang trước</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Trang tiếp</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Đến trang cuối</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
```

---

## Conclusion

This standard ensures:

1. **Consistency:** All pages look and behave the same way
2. **Accessibility:** Screen readers, keyboard navigation work properly
3. **Responsiveness:** Optimized for mobile, tablet, desktop
4. **User Experience:** Familiar patterns, predictable interactions
5. **Maintainability:** Easy to update, debug, extend

**Remember:** When in doubt, refer to `/parts` or `/products` pages as the golden standard.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-23
**Maintained by:** Development Team
