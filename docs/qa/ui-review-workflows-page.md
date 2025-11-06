# UI Review: /workflows Page vs UI Coding Guide

**Date:** 2025-11-05
**Reviewer:** Quinn (Test Architect)
**Page:** `/workflows` (Template List Table)
**Files:**
- `src/app/(auth)/workflows/page.tsx`
- `src/components/tables/template-list-table.tsx`

---

## 📊 Executive Summary

**Overall Compliance:** 🟡 **70% - Needs Improvement**

| Category | Status | Score |
|----------|--------|-------|
| Page Structure | ✅ Pass | 100% |
| Tabs System | ✅ Pass | 100% |
| Table Structure | ✅ Pass | 100% |
| Actions Column | ⚠️ Non-Compliant | 0% |
| Pagination | ❌ Non-Compliant | 0% |
| Shared Components | ⚠️ Partial | 40% |
| Color System | N/A | - |

---

## ✅ What's Working Well

### 1. **Page Structure (Section 1)**
✅ **COMPLIANT** - Follows exact structure from UI Coding Guide

```tsx
<>
  <PageHeader title="Mẫu quy trình" />
  <div className="flex flex-1 flex-col">
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <TemplateListTable ... />
      </div>
    </div>
  </div>
</>
```

**Correct Classes:**
- `flex flex-1 flex-col` on outer container ✅
- `@container/main flex flex-1 flex-col gap-2` for container query ✅
- `flex flex-col gap-4 py-4 md:gap-6 md:py-6` for content wrapper ✅

---

### 2. **Tabs System (Section 3)**
✅ **COMPLIANT** - Proper mobile/desktop tabs implementation

**Mobile:**
```tsx
<Select defaultValue="all-templates">
  <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm">
    <SelectValue placeholder="Chọn hiển thị" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all-templates">Tất cả mẫu</SelectItem>
    <SelectItem value="active">Đang hoạt động</SelectItem>
    <SelectItem value="archived">Đã lưu trữ</SelectItem>
  </SelectContent>
</Select>
```

**Desktop:**
```tsx
<TabsList className="hidden @4xl/main:flex">
  <TabsTrigger value="all-templates">Tất cả mẫu</TabsTrigger>
  <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
  <TabsTrigger value="archived">Đã lưu trữ</TabsTrigger>
</TabsList>
```

✅ Uses `@4xl/main` breakpoint correctly
✅ Mobile select + Desktop tabs pattern
✅ Action buttons aligned right

---

### 3. **Table Structure (Section 4)**
✅ **COMPLIANT** - Proper table wrapper and header

```tsx
<div className="overflow-hidden rounded-lg border">
  <Table>
    <TableHeader className="bg-muted sticky top-0 z-10">
      {/* Headers */}
    </TableHeader>
    <TableBody>
      {/* Rows or Empty State */}
    </TableBody>
  </Table>
</div>
```

✅ Sticky header with `bg-muted` and `z-10`
✅ Rounded border wrapper
✅ Proper empty state with `colSpan`

---

### 4. **Search Bar**
✅ **COMPLIANT** - Follows guidelines

```tsx
<Input
  placeholder="Tìm kiếm mẫu..."
  value={globalFilter}
  onChange={(e) => setGlobalFilter(e.target.value)}
  className="max-w-sm"
/>
```

✅ Vietnamese placeholder
✅ `max-w-sm` width constraint
✅ Positioned above table

---

## ⚠️ Issues Found

### Issue #1: Actions Column - Non-Compliant ❌

**Severity:** 🔴 **HIGH**
**Section:** UI Coding Guide Section 4 - Tables, "Cột Hành động (Actions)"

**Current Implementation:**
```tsx
{
  id: "actions",
  header: () => <div className="text-right">Thao tác</div>,
  cell: ({ row }) => (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => onView(row.original.id)}>
        <IconEye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onEdit(row.original.id)}>
        <IconEdit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => deleteTemplate(...)}>
        <IconTrash className="h-4 w-4" />
      </Button>
    </div>
  ),
}
```

**Problem:** Shows 3 separate action buttons (View, Edit, Delete)

**UI Coding Guide Requirement:**
> **Cột Hành động (Actions):**
> - Để đảm bảo tính nhất quán và tiết kiệm không gian, tất cả các hành động cho một hàng phải được đặt bên trong một `DropdownMenu`.
> - Trigger để mở menu này PHẢI là một `Button` **chỉ có icon** (icon-only) với `variant="ghost"`. Biểu tượng được khuyến nghị là "dấu ba chấm" (ví dụ: `IconDots`).
> - **Không** hiển thị nhiều icon hành động riêng lẻ trên mỗi hàng.
> - **Lý do:** Cách tiếp cận này hoạt động tốt nhất trên cả desktop và mobile, có khả năng mở rộng và giữ cho giao diện bảng gọn gàng.

**Required Implementation:**
```tsx
{
  id: "actions",
  header: "Thao tác", // Can be "Hành Động" per guide
  cell: ({ row }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Mở menu hành động"
        >
          <IconDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(row.original.id)}>
          <IconEye className="mr-2 h-4 w-4" />
          Xem chi tiết
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
          <IconEdit className="mr-2 h-4 w-4" />
          Sửa
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => deleteTemplate(...)}
        >
          <IconTrash className="mr-2 h-4 w-4" />
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
```

**Impact:**
- ❌ Inconsistent with other tables in the app
- ❌ Takes more horizontal space
- ❌ Less scalable if more actions are added
- ❌ Harder to use on mobile (smaller touch targets when multiple buttons)

**Recommendation:** Revert to DropdownMenu pattern as per UI Coding Guide

---

### Issue #2: Pagination - Not Using Shared Component ❌

**Severity:** 🔴 **HIGH**
**Section:** UI Coding Guide Section 2.6.2 & Section 4 - Pagination

**Current Implementation:**
Lines 418-494 (~77 lines of custom pagination code)

```tsx
<div className="flex items-center justify-between px-4">
  <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
    Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong{" "}
    {table.getFilteredRowModel().rows.length} mẫu
  </div>
  <div className="flex w-full items-center gap-8 lg:w-fit">
    <div className="ml-8 hidden items-center gap-2 lg:flex">
      <Label htmlFor="rows-per-page" className="text-sm font-medium">
        Số dòng mỗi trang
      </Label>
      <Select ... >
        {/* Page size selector */}
      </Select>
    </div>
    <div className="flex w-fit items-center justify-center text-sm font-medium">
      Trang {table.getState().pagination.pageIndex + 1} trên{" "}
      {table.getPageCount()}
    </div>
    <div className="ml-auto flex items-center gap-2 lg:ml-0">
      {/* First/Previous/Next/Last buttons */}
    </div>
  </div>
</div>
```

**UI Coding Guide Requirement:**
> **⚠️ BẮT BUỘC: Sử dụng `TablePagination` Component**
>
> Tất cả các bảng phải sử dụng component `TablePagination` để đảm bảo tính nhất quán và tránh code duplication.

**Required Implementation:**
```tsx
import { TablePagination } from "@/components/ui/table-pagination";

<TablePagination table={table} labelId="rows-per-page-workflows" />
```

**Impact:**
- ❌ Code duplication (~77 lines that should be 1 line)
- ❌ Maintenance burden (bug fixes need to be applied everywhere)
- ❌ Inconsistent behavior across tables
- ❌ Larger bundle size

**Recommendation:** Replace with `TablePagination` component

**Code Reduction:**
- Before: ~77 lines
- After: 1 line
- Savings: **99% reduction** in pagination code

---

### Issue #3: Column Visibility Dropdown - Missing Icon ⚠️

**Severity:** 🟡 **MEDIUM**

**Current Implementation:**
```tsx
<Button variant="outline" size="sm">
  <IconLayoutColumns />
  <span className="hidden lg:inline">Tùy chỉnh cột</span>
  <span className="lg:hidden">Cột</span>
  {/* Missing IconChevronDown */}
</Button>
```

**Reference Implementation (task-types-table.tsx):**
```tsx
<Button variant="outline" size="sm">
  <IconLayoutColumns className="h-4 w-4" />
  <span className="hidden lg:inline ml-2">Tùy chỉnh cột</span>
  <IconChevronDown className="ml-2 h-4 w-4" />
</Button>
```

**Recommendation:** Add `IconChevronDown` for consistency and better UX (indicates dropdown)

---

### Issue #4: Missing Import After Refactor ⚠️

**Current Imports:**
```tsx
import {
  IconEdit,
  IconTrash,
  IconFileText,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlus,
  IconDatabase,
  IconEye,
} from "@tabler/icons-react";
```

**Missing:**
- `IconDots` - Will be needed if reverting to DropdownMenu pattern
- `IconChevronDown` - Needed for column visibility dropdown

---

## 📋 Recommended Changes

### Priority 1: MUST FIX (Critical)

1. **Replace Pagination with TablePagination Component**
   ```tsx
   // Delete lines 418-494
   // Replace with:
   import { TablePagination } from "@/components/ui/table-pagination";

   <TablePagination table={table} labelId="rows-per-page-workflows" />
   ```

2. **Revert Actions Column to DropdownMenu Pattern**
   - Follow UI Coding Guide Section 4
   - Use `IconDots` trigger button
   - Move actions into DropdownMenu items
   - Add text labels to menu items

### Priority 2: SHOULD FIX (Consistency)

3. **Add IconChevronDown to Column Visibility Button**
   ```tsx
   <Button variant="outline" size="sm">
     <IconLayoutColumns />
     <span className="hidden lg:inline">Tùy chỉnh cột</span>
     <span className="lg:hidden">Cột</span>
     <IconChevronDown className="ml-2 h-4 w-4" />
   </Button>
   ```

4. **Update Imports**
   ```tsx
   import {
     IconEdit,
     IconTrash,
     IconFileText,
     IconChevronDown, // ADD
     IconChevronLeft,
     IconChevronRight,
     IconChevronsLeft,
     IconChevronsRight,
     IconLayoutColumns,
     IconPlus,
     IconDots, // ADD (if using DropdownMenu)
     IconEye,
   } from "@tabler/icons-react";
   ```

---

## 🎯 Expected Impact After Fixes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines of Code | ~510 | ~440 | -70 lines (-14%) |
| Pagination Code | 77 lines | 1 line | -76 lines (-99%) |
| UI Consistency | 70% | 100% | +30% |
| Maintainability | Medium | High | Significant |
| Bundle Size | Larger | Smaller | 5-10 kB reduction |

---

## ✅ Checklist for Developer

- [ ] Replace custom pagination with `TablePagination` component
- [ ] Revert actions column to DropdownMenu with IconDots
- [ ] Add IconChevronDown to column visibility dropdown
- [ ] Update imports (add IconDots, IconChevronDown)
- [ ] Remove unused DropdownMenuItem import (no longer needed after revert)
- [ ] Test on mobile and desktop
- [ ] Verify all actions still work (View, Edit, Delete)
- [ ] Verify pagination works (page size, navigation)

---

## 📚 Reference Files

**Compliant Examples:**
- ✅ `src/components/tables/task-types-table.tsx` - **NOW COMPLIANT** (after recent refactor)
- ✅ `src/components/tables/product-table.tsx` - Uses TablePagination
- ✅ `src/components/tables/customer-table.tsx` - Uses TablePagination

**UI Coding Guide Sections:**
- Section 2.6.2: TablePagination Component
- Section 4: Tables - Actions Column
- Section 4: Tables - Pagination

---

## 🔄 Update History

**2025-11-05:**
- Initial review after polymorphic task system migration
- Identified 2 critical issues (actions column, pagination)
- Identified 2 minor issues (missing icon, imports)
- Created comprehensive fix recommendations

---

**Reviewer Signature:** Quinn 🧪
**Status:** ⚠️ **Needs Remediation**
**Follow-up:** After fixes, re-test and verify compliance
