# Hướng dẫn Code Giao diện (UI Coding Guide)

**Phiên bản:** 1.1
**Cập nhật lần cuối:** 2025-10-27

---

## Giới thiệu

Tài liệu này định nghĩa các quy chuẩn và mẫu code để xây dựng giao diện người dùng (UI) cho các trang trong ứng dụng Service Center. Việc tuân thủ hướng dẫn này là **bắt buộc** để đảm bảo tính nhất quán về mặt hình ảnh và trải nghiệm người dùng (UX) trên toàn bộ ứng dụng.

**Trang tham khảo mẫu:**
*   `/catalog/products`
*   `/dashboard`

---

## 1. Cấu trúc Trang (Page Structure)

Mọi trang hiển thị dữ liệu (data-driven page) phải tuân theo cấu trúc phân cấp sau:

### Cấu trúc JSX

```tsx
<>
  <PageHeader title="[Tiêu đề trang]" />
  <div className="flex flex-1 flex-col">
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Các thành phần nội dung chính ở đây, ví dụ: Tabs, Cards, Tables */}
        <[TênComponent] data={data} />
      </div>
    </div>
  </div>
</>
```

### Các lớp (Classes) CSS bắt buộc

*   **Container ngoài cùng:** `flex flex-1 flex-col`
*   **Wrapper cho container query:** `@container/main flex flex-1 flex-col gap-2`
*   **Wrapper nội dung (với padding đáp ứng):** `flex flex-col gap-4 py-4 md:gap-6 md:py-6`

---

## 2. Style, Spacing và Padding

### Spacing (Khoảng cách)

Sử dụng các utility class của Tailwind để đảm bảo khoảng cách nhất quán.

*   **Giữa các section lớn của trang:** `gap-2`
*   **Bên trong content wrapper:** `gap-4` (mobile), `md:gap-6` (desktop)
*   **Giữa các button trong một nhóm:** `gap-2`
*   **Giữa các trường trong form:** `gap-4`

### Padding (Đệm)

*   **Padding ngang của trang:** `px-4` (mobile), `lg:px-6` (desktop)
*   **Padding dọc của trang:** `py-4` (mobile), `md:py-6` (desktop)

### Typography (Kiểu chữ)

*   **Tiêu đề trang/section:** `text-lg font-semibold`
*   **Nhãn (Labels):** `text-sm font-medium`
*   **Nội dung bảng (Table cells):** `text-sm`
*   **Chữ nhỏ (Badges, secondary info):** `text-xs`
*   **Chữ bị làm mờ (Muted text):** `text-muted-foreground`

---

## 2.5. Hệ Thống Màu Sắc & Badges (Color System & Badge Usage)

**✨ TIÊU CHUẨN MỚI (v1.1 - Oct 27, 2025)**

Hệ thống màu sắc và badges được thiết kế để tạo visual hierarchy rõ ràng, cải thiện khả năng quét thông tin (scannability), và mang lại personality cho UI.

### 2.5.1. Nguyên Tắc Sử Dụng Màu

**Quy tắc vàng:**
1. **Màu có ý nghĩa** - Mỗi màu phải truyền tải thông tin cụ thể
2. **Nhất quán** - Cùng một loại dữ liệu phải dùng cùng màu xuyên suốt app
3. **Phân biệt** - Các category khác nhau phải có màu riêng biệt
4. **Dark mode** - Tất cả màu phải có variant cho dark mode
5. **Accessibility** - Đảm bảo contrast ratio đủ (WCAG AA minimum)

### 2.5.2. Category Badge Pattern

**Áp dụng cho:** Phân loại dữ liệu (task types, product categories, service types, v.v.)

**Cấu trúc:**
```tsx
// 1. Define color mappings (at component top level)
const CATEGORY_COLORS = {
  "Category 1": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  "Category 2": "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  // ... more categories
} as const;

// 2. Optional: Define icons for visual recognition
const CATEGORY_ICONS = {
  "Category 1": "🔍",
  "Category 2": "🔧",
  // ... more icons
} as const;

// 3. Usage in table column
{
  accessorKey: "category",
  header: "Danh Mục",
  cell: ({ row }) => {
    const category = row.original.category || "Default";
    const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
    return (
      <Badge variant="outline" className={colorClass}>
        {category}
      </Badge>
    );
  },
}
```

**Bảng Màu Chuẩn cho Categories:**

| Category Type | Color | Light Mode | Dark Mode | Use Case |
|--------------|-------|------------|-----------|----------|
| Inspection/Kiểm tra | Blue | `bg-blue-100 text-blue-700 border-blue-300` | `dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700` | Các hành động kiểm tra, xem xét |
| Repair/Sửa chữa | Orange | `bg-orange-100 text-orange-700 border-orange-300` | `dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700` | Sửa chữa, khắc phục |
| Replace/Thay thế | Purple | `bg-purple-100 text-purple-700 border-purple-300` | `dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700` | Thay thế linh kiện |
| Clean/Vệ sinh | Green | `bg-green-100 text-green-700 border-green-300` | `dark:bg-green-900/30 dark:text-green-300 dark:border-green-700` | Vệ sinh, làm sạch |
| Install/Cài đặt | Cyan | `bg-cyan-100 text-cyan-700 border-cyan-300` | `dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700` | Cài đặt, setup |
| Test/Kiểm tra cuối | Indigo | `bg-indigo-100 text-indigo-700 border-indigo-300` | `dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700` | Kiểm tra cuối, QA |
| Other/Khác | Gray | `bg-gray-100 text-gray-700 border-gray-300` | `dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600` | Các loại khác |

### 2.5.3. Status Badge Pattern

**Áp dụng cho:** Trạng thái hoạt động (active/inactive, enabled/disabled, on/off)

**Cấu trúc:**
```tsx
{
  accessorKey: "is_active",
  header: "Trạng Thái",
  cell: ({ row }) => (
    <Badge
      variant={row.original.is_active ? "default" : "destructive"}
      className={row.original.is_active
        ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 dark:border-green-700"
        : "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-300 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-300 dark:border-red-700"
      }
    >
      <span className={row.original.is_active ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
        {row.original.is_active ? "●" : "○"}
      </span>
      <span className="ml-1">{row.original.is_active ? "Hoạt động" : "Vô hiệu"}</span>
    </Badge>
  ),
}
```

**Quy ước:**
- **Active/Enabled:** Gradient xanh lá → xanh emerald, filled dot (●)
- **Inactive/Disabled:** Gradient đỏ → đỏ hồng, empty dot (○)
- Luôn dùng gradient cho status badges để tạo visual depth

### 2.5.4. Boolean Badge Pattern

**Áp dụng cho:** Các giá trị boolean (yes/no, required/optional, has/hasn't)

**Cấu trúc:**
```tsx
// For positive boolean (Yes/Có/Required)
<Badge
  variant={value ? "default" : "secondary"}
  className={value
    ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
>
  {value ? "✓ Có" : "○ Không"}
</Badge>

// For specific boolean with icon context (e.g., photo required)
<Badge
  variant={requiresPhoto ? "default" : "secondary"}
  className={requiresPhoto
    ? "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700"
    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
>
  {requiresPhoto ? "📷 Có" : "○ Không"}
</Badge>
```

**Quy ước:**
- **True/Yes:** Màu xanh (emerald hoặc sky tùy context), checkmark (✓) hoặc icon phù hợp
- **False/No:** Màu xám, empty circle (○)
- Thêm icon emoji nếu có context cụ thể (📷 cho photo, 📝 cho notes, v.v.)

### 2.5.5. Metric Badge Pattern

**Áp dụng cho:** Các số liệu có ngưỡng (duration, quantity, score)

**Cấu trúc:**
```tsx
{
  accessorKey: "estimated_duration_minutes",
  header: "Thời Gian (phút)",
  cell: ({ row }) => {
    const duration = row.original.estimated_duration_minutes;
    if (!duration) {
      return <span className="text-sm text-muted-foreground">-</span>;
    }

    // Color coding based on thresholds
    let colorClass = "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
    if (duration > 60) {
      colorClass = "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
    } else if (duration > 30) {
      colorClass = "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700";
    }

    return (
      <Badge variant="outline" className={colorClass}>
        ⏱️ {duration} phút
      </Badge>
    );
  },
}
```

**Quy ước:**
- **Low/Fast:** Xanh lá (green)
- **Medium:** Vàng (yellow)
- **High/Slow:** Cam/Hổ phách (amber)
- Thêm icon emoji phù hợp (⏱️ cho time, 📊 cho metrics)

### 2.5.6. Icon Integration Pattern

**Áp dụng cho:** Tăng visual recognition cho các items trong bảng

**Cấu trúc:**
```tsx
{
  accessorKey: "name",
  header: "Tên",
  cell: ({ row }) => {
    const category = row.original.category || "Default";
    const icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg" role="img" aria-label={category}>
          {icon}
        </span>
        <span className="font-medium">{row.original.name}</span>
      </div>
    );
  },
}
```

**Quy ước:**
- Icon nằm bên trái text
- Gap 2 units (`gap-2`)
- Font size `text-lg` cho emoji icons
- Thêm `role="img"` và `aria-label` cho accessibility

### 2.5.7. Best Practices

**DO:**
- ✅ Sử dụng const objects với `as const` cho type safety
- ✅ Luôn có dark mode variant
- ✅ Sử dụng gradient cho status badges
- ✅ Thêm icons để tăng visual recognition
- ✅ Sử dụng semantic colors (xanh = tốt, đỏ = cảnh báo)
- ✅ Tạo color mappings ở top level của component

**DON'T:**
- ❌ Inline colors trực tiếp trong JSX
- ❌ Dùng cùng một màu cho nhiều ý nghĩa khác nhau
- ❌ Quên dark mode variants
- ❌ Dùng quá nhiều màu (tối đa 7-8 màu cho một category system)
- ❌ Bỏ qua accessibility (icons phải có aria-label)

### 2.5.8. Ví Dụ Thực Tế

**Tham khảo implementation:** `/src/components/tables/task-types-table.tsx`

File này là reference implementation đầy đủ của tất cả patterns trên.

---

## 2.6. Shared Components & Code Reusability

**✨ TIÊU CHUẨN MỚI (v1.2 - Oct 27, 2025)**

Để tránh code duplication và đảm bảo tính nhất quán, **LUÔN SỬ DỤNG** các shared components có sẵn thay vì tự implement lại logic tương tự.

### 2.6.1. Nguyên Tắc DRY (Don't Repeat Yourself)

**Quy tắc vàng:**
1. **Kiểm tra trước khi code** - Luôn search codebase để tìm implementation tương tự
2. **Tái sử dụng** - Dùng shared components thay vì copy-paste
3. **Refactor khi thấy repetition** - Nếu thấy code lặp lại ≥3 lần, extract thành component
4. **Single source of truth** - Mỗi pattern chỉ nên có 1 implementation chính

### 2.6.2. TablePagination Component

**Component:** `src/components/ui/table-pagination.tsx`

**Áp dụng cho:** TẤT CẢ các bảng có phân trang

**❌ KHÔNG LÀM:**
```tsx
// Đừng tự implement pagination UI (~70-80 lines)
<div className="flex items-center justify-between px-4 lg:px-6">
  <div className="flex-1 text-sm text-muted-foreground">
    {table.getFilteredSelectedRowModel().rows.length > 0 && (
      <span>Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong {table.getFilteredRowModel().rows.length}</span>
    )}
  </div>
  <div className="flex w-full items-center gap-8 lg:w-fit">
    <div className="hidden items-center gap-2 lg:flex">
      <Label htmlFor="rows-per-page">Hàng trên trang</Label>
      <Select value={`${pageSize}`} onValueChange={...}>
        {/* 30+ more lines */}
      </Select>
    </div>
    {/* 40+ more lines of pagination controls */}
  </div>
</div>
```

**✅ ĐÚNG:**
```tsx
import { TablePagination } from "@/components/ui/table-pagination";

// Chỉ 1 dòng thay thế ~70-80 lines
<TablePagination table={table} labelId="rows-per-page-products" />
```

**Props:**
- `table` - TanStack Table instance
- `labelId` - Unique ID cho label "Hàng trên trang" (để tránh conflict khi có nhiều table)

**Features:**
- ✅ Selection count display
- ✅ Page size selector (10, 20, 30, 40, 50)
- ✅ Current page indicator
- ✅ First/Previous/Next/Last navigation buttons
- ✅ Responsive design (mobile + desktop)
- ✅ Consistent styling across all tables

**Đã áp dụng cho 8 tables:**
1. `physical-warehouse-table.tsx`
2. `virtual-warehouse-table.tsx`
3. `team-table.tsx`
4. `brands-table.tsx`
5. `parts-table.tsx`
6. `product-table.tsx`
7. `customer-table.tsx`
8. `ticket-table.tsx`

### 2.6.3. FormDrawer Component

**Component:** `src/components/ui/form-drawer.tsx`

**Áp dụng cho:** TẤT CẢ các form trong Drawer (thêm/sửa entities)

**❌ KHÔNG LÀM:**
```tsx
// Đừng tự implement drawer wrapper (~150-200 lines)
<Drawer open={open} onOpenChange={setOpen} direction={isMobile ? "bottom" : "right"}>
  <DrawerTrigger asChild>{trigger}</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>{title}</DrawerTitle>
      <DrawerDescription>{description}</DrawerDescription>
    </DrawerHeader>
    <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
      {/* Form fields */}
    </div>
    <DrawerFooter>
      <Button onClick={handleSubmit} disabled={isLoading}>
        {submitLabel}
      </Button>
      <DrawerClose asChild>
        <Button variant="outline">Hủy bỏ</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

**✅ ĐÚNG:**
```tsx
import { FormDrawer } from "@/components/ui/form-drawer";

<FormDrawer
  open={open}
  onOpenChange={setOpen}
  trigger={trigger}
  title="Thêm Sản Phẩm Mới"
  description="Tạo sản phẩm mới trong danh mục"
  isSubmitting={isLoading}
  onSubmit={handleSubmit}
  submitLabel={isLoading ? "Đang tạo..." : "Tạo sản phẩm"}
  cancelLabel="Hủy bỏ"
>
  {/* Form fields only */}
</FormDrawer>
```

**Props:**
- `open` - Boolean state
- `onOpenChange` - State setter
- `trigger?` - Optional trigger button
- `title?` - Simple string title
- `titleElement?` - Custom React element for complex titles (e.g., with Avatar)
- `description?` - Drawer description
- `isSubmitting` - Loading state
- `onSubmit` - Submit handler
- `submitLabel` - Submit button text
- `cancelLabel?` - Cancel button text (default: "Hủy bỏ")
- `submitDisabled?` - Disable submit button
- `headerClassName?` - Custom header styling
- `children` - Form content

**Advanced: Custom Title with Avatar**
```tsx
<FormDrawer
  open={open}
  onOpenChange={setOpen}
  trigger={trigger}
  titleElement={
    <div className="flex items-center gap-3">
      <Avatar className="size-10">
        <AvatarImage src={member?.avatar_url} />
        <AvatarFallback>{member?.full_name?.[0]}</AvatarFallback>
      </Avatar>
      {mode === "add" ? "Thêm Nhân Viên Mới" : member?.full_name}
    </div>
  }
  description="Cập nhật thông tin nhân viên"
  isSubmitting={isLoading}
  onSubmit={handleSubmit}
  submitLabel="Lưu thay đổi"
  headerClassName="gap-1"
>
  {/* Form fields */}
</FormDrawer>
```

**Features:**
- ✅ Automatic mobile/desktop direction (bottom/right)
- ✅ Consistent header/footer layout
- ✅ Loading state management
- ✅ Scrollable content area
- ✅ Support for simple string titles OR complex custom title elements
- ✅ Customizable header styling

**Đã áp dụng cho các forms:**
1. Task type management
2. Template management
3. Warehouse management
4. Team member management
5. (Có thể mở rộng cho products, parts, brands, customers)

### 2.6.4. Impact & Benefits

**Từ các refactoring vừa qua:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total code removed | - | ~700 lines | Reduced duplication |
| Tables using TablePagination | 0 | 8 | 100% coverage |
| Forms using FormDrawer | 0 | 4+ | Growing adoption |
| Bundle size (avg) | Higher | 5-15 kB | Optimized |
| Maintainability | Low | High | Single source of truth |

**Lợi ích:**
- ⚡ **Faster development** - Không cần implement lại pagination/drawer
- 🎯 **Consistency** - Tất cả tables/forms có cùng UX
- 🔧 **Easy maintenance** - Fix bug một lần, apply cho tất cả
- 📦 **Smaller bundles** - Code reuse giảm bundle size
- ✅ **Type safety** - Shared components có proper TypeScript types

### 2.6.5. Best Practices

**Khi tạo component mới:**
1. ✅ Check xem đã có shared component chưa (search trong `src/components/ui/`)
2. ✅ Nếu thấy pattern lặp lại ≥3 lần → extract thành shared component
3. ✅ Đặt shared components trong `src/components/ui/`
4. ✅ Export proper TypeScript interfaces
5. ✅ Document props và usage examples
6. ✅ Ensure responsive design (mobile + desktop)
7. ✅ Add dark mode support

**Khi refactor existing code:**
1. ✅ Identify repetitive patterns across files
2. ✅ Create shared component with flexible props
3. ✅ Migrate existing code to use shared component
4. ✅ Verify build succeeds
5. ✅ Test on multiple breakpoints
6. ✅ Update documentation (như guide này)

---

## 3. Hệ thống Tabs (Tabs System)

Tất cả các trang dạng bảng (table pages) PHẢI sử dụng component `Tabs` với các biến thể cho mobile và desktop để chuyển đổi giữa các view (ví dụ: lọc theo trạng thái).

### Cấu trúc Tabs

```tsx
<Tabs defaultValue="[default-tab]" className="w-full flex-col justify-start gap-6">
  {/* Hàng 1: Bộ chọn View / Tabs + Các nút hành động */}
  <div className="flex items-center justify-between px-4 lg:px-6">
    {/* Mobile: Select Dropdown */}
    <Select defaultValue="[default-tab]">
      <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm">
        <SelectValue placeholder="[Placeholder]" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tab1">Tên Tab 1</SelectItem>
        <SelectItem value="tab2">Tên Tab 2</SelectItem>
      </SelectContent>
    </Select>

    {/* Desktop: Tab List */}
    <TabsList className="hidden @4xl/main:flex">
      <TabsTrigger value="tab1">Tên Tab 1</TabsTrigger>
      <TabsTrigger value="tab2">Tên Tab 2</TabsTrigger>
    </TabsList>

    {/* Các nút hành động */}
    <div className="flex items-center gap-2">
      {/* Các nút ở đây */}
    </div>
  </div>

  {/* Nội dung các Tab */}
  <TabsContent value="tab1" className="relative flex flex-col gap-4 px-4 lg:px-6">
    {/* Nội dung */}
  </TabsContent>
</Tabs>
```

*   **Breakpoint đáp ứng:** Sử dụng container query `@4xl/main` để chuyển đổi giữa `Select` (mobile) và `TabsList` (desktop).
*   **Các nút hành động:** Luôn được căn phải, bao gồm các hành động chính như "Thêm mới" và các tùy chọn như tùy chỉnh cột.

---

## 4. Bảng (Tables)

Các trang hiển thị danh sách dữ liệu phải sử dụng cấu trúc bảng tiêu chuẩn.

### Cấu trúc Bảng

```tsx
<div className="overflow-hidden rounded-lg border">
  <Table>
    <TableHeader className="bg-muted sticky top-0 z-10">
      {/* Headers ở đây */}
    </TableHeader>
    <TableBody>
      {/* Rows hoặc Trạng thái Rỗng ở đây */}
    </TableBody>
  </Table>
</div>
```

*   **Tiêu đề Bảng (Header):** Phải `sticky` và có nền `bg-muted` để luôn hiển thị khi cuộn.
*   **Container:** Bảng phải được bao bọc bởi một `div` có `overflow-hidden rounded-lg border`.

### Các Cột Tiêu chuẩn

1.  **Cột Chọn (Select):** Dành cho các thao tác hàng loạt.
2.  **Cột Chính (Tên/Name):** Phải là một `Button` có thể nhấp để mở `Drawer` chỉnh sửa.
3.  **Cột Hành động (Actions):**
    *   Để đảm bảo tính nhất quán và tiết kiệm không gian, tất cả các hành động cho một hàng phải được đặt bên trong một `DropdownMenu`.
    *   Trigger để mở menu này PHẢI là một `Button` **chỉ có icon** (icon-only) với `variant="ghost"`. Biểu tượng được khuyến nghị là "dấu ba chấm" (ví dụ: `IconDots`).
    *   **Không** hiển thị nhiều icon hành động riêng lẻ trên mỗi hàng.
    *   **Không** sử dụng cách tiếp cận hybrid (một icon riêng và một menu).
    *   **Lý do:** Cách tiếp cận này hoạt động tốt nhất trên cả desktop và mobile, có khả năng mở rộng và giữ cho giao diện bảng gọn gàng.

### Căn lề và Padding cho Ô (Cell Alignment & Padding)

Để đảm bảo layout của bảng nhất quán và dễ đọc, hãy tuân thủ các quy tắc về padding cho các cột đầu tiên.

**Quy tắc chung:**
*   Tất cả các ô chứa dữ liệu văn bản (`TableCell`) phải có padding mặc định của `shadcn/ui`, tức là `px-4` ở hai bên.

**Cấu trúc các cột đầu tiên:**

1.  **Cột Kéo-thả (Drag Handle) (nếu có):**
    *   Đây là cột đầu tiên.
    *   `TableCell` chứa nó nên có `className="p-0 w-8"`.
    *   Bên trong là một `Button` `variant="ghost"` để chứa icon `IconGripVertical`.
    *   **Ví dụ (`customer-table.tsx`):**
        ```tsx
        {
          id: "drag",
          header: () => null,
          cell: ({ row }) => <DragHandle id={row.original.id} />,
        }
        ```

2.  **Cột Chọn (Checkbox) (nếu có):**
    *   Đây là cột thứ hai (nếu có cột drag) hoặc cột đầu tiên (nếu không có).
    *   `TableCell` chứa nó nên có `className="p-0"`.
    *   Bên trong là một `div` với `className="flex items-center justify-center"` để căn giữa `Checkbox`.
    *   **Ví dụ (`parts-table.tsx`):**
        ```tsx
        {
          id: "select",
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <Checkbox ... />
            </div>
          ),
        }
        ```

3.  **Cột Dữ liệu Đầu tiên (First Data Column):**
    *   Đây là cột chứa nội dung chính đầu tiên (ví dụ: Tên sản phẩm, Tên khách hàng).
    *   `TableCell` của cột này **không cần thêm class tùy chỉnh** và sẽ tự động nhận padding `px-4` mặc định. Điều này tạo ra khoảng trống cần thiết so với lề trái hoặc so với cột checkbox/drag handle.

### Trạng thái Rỗng (Empty State)

Khi bảng không có dữ liệu để hiển thị, PHẢI hiển thị một hàng duy nhất bên trong `<TableBody>` với một thông báo rõ ràng.

**Quan trọng:** `TableHeader` của bảng **luôn luôn** phải được hiển thị, ngay cả khi không có dữ liệu. Điều này đảm bảo người dùng luôn thấy được cấu trúc của bảng và các nút hành động liên quan (như "Thêm mới") vẫn hiển thị, tránh thay đổi layout đột ngột.

**Cấu trúc:**
```tsx
<TableBody>
  {table.getRowModel().rows?.length ? (
    table.getRowModel().rows.map((row) => (
      // ... render a <TableRow> for each data row
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-24 text-center">
        Không tìm thấy [tên đối tượng] nào.
      </TableCell>
    </TableRow>
  )}
</TableBody>
```
*   **`colSpan`:** Phải bằng tổng số cột để thông báo chiếm toàn bộ chiều rộng của bảng.
*   **Styling:** Sử dụng `h-24 text-center` để đảm bảo thông báo được căn giữa và có đủ không gian.
*   **Nội dung:** Thông báo phải bằng tiếng Việt và thân thiện với người dùng (ví dụ: "Không tìm thấy sản phẩm nào.").

### Thanh Tìm kiếm và Lọc

*   Luôn đặt một thanh tìm kiếm `Input` phía trên bảng với `placeholder` tiếng Việt.
*   **Độ rộng tối đa:** `max-w-sm`.

### Phân trang (Pagination)

**⚠️ BẮT BUỘC: Sử dụng `TablePagination` Component**

Tất cả các bảng phải sử dụng component `TablePagination` để đảm bảo tính nhất quán và tránh code duplication.

**Cấu trúc:**
```tsx
import { TablePagination } from "@/components/ui/table-pagination";

<TablePagination table={table} labelId="rows-per-page-[table-name]" />
```

**KHÔNG tự implement pagination UI.** Component này cung cấp đầy đủ:
*   **Đếm số lượng đã chọn:** (ví dụ: "Đã chọn 5 trong 50")
*   **Chọn kích thước trang:** (10, 20, 30, 40, 50)
*   **Thông tin trang:** (ví dụ: "Trang 1 trên 10")
*   **Các nút điều hướng:** Trang đầu, Trang trước, Trang tiếp, Trang cuối

**Xem thêm:** Section 2.6.2 - TablePagination Component

---

## 5. Thẻ (Cards)

Sử dụng `Card` từ thư viện `shadcn/ui` để nhóm các thông tin liên quan, đặc biệt là trên các trang dashboard.

### Cấu trúc Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>[Tiêu đề Card]</CardTitle>
    <CardDescription>[Mô tả ngắn]</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Nội dung chính của card, ví dụ: biểu đồ, danh sách */}
  </CardContent>
  <CardFooter>
    {/* Các hành động hoặc thông tin phụ */}
  </CardFooter>
</Card>
```

### Ví dụ: Card trên Dashboard

Trên trang `/dashboard`, các thẻ được sử dụng để hiển thị các số liệu thống kê nhanh (ví dụ: "Doanh thu tháng này", "Phiếu chờ xử lý"). Chúng thường chỉ chứa `CardHeader` và `CardContent`.

---

## 6. Ngăn kéo (Drawers) cho Form

Để đảm bảo trải nghiệm người dùng nhất quán, tất cả các hành động **tạo mới** hoặc **chỉnh sửa** các mục phức tạp (ví dụ: sản phẩm, khách hàng) PHẢI sử dụng component `FormDrawer`.

`FormDrawer` là shared component cung cấp nhiều không gian cho các biểu mẫu phức tạp, xử lý responsive behavior tự động, và mang lại trải nghiệm người dùng hiện đại nhất quán.

### Hành vi và Giao diện

*   **Desktop:** Drawer sẽ trượt ra từ **bên phải** của màn hình.
*   **Mobile:** Drawer sẽ trượt lên từ **dưới cùng** của màn hình.
*   **Tự động detect:** Component tự xử lý responsive behavior, không cần `useIsMobile()`.

### Cấu trúc Drawer (Khuyến nghị)

**⚠️ BẮT BUỘC: Sử dụng `FormDrawer` Component**

```tsx
import { FormDrawer } from "@/components/ui/form-drawer";

function MyEntityModal({ mode, trigger, onSuccess, entity }) {
  const [open, setOpen] = React.useState(false);

  // ... (logic form và state)

  return (
    <FormDrawer
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={mode === "add" ? "Thêm Sản Phẩm Mới" : "Chỉnh sửa Sản Phẩm"}
      description={mode === "add"
        ? "Tạo sản phẩm mới trong danh mục"
        : "Cập nhật thông tin sản phẩm"}
      isSubmitting={isLoading}
      onSubmit={handleSubmit}
      submitLabel={isLoading
        ? (mode === "add" ? "Đang tạo..." : "Đang cập nhật...")
        : (mode === "add" ? "Tạo sản phẩm" : "Lưu thay đổi")}
      submitDisabled={!isValid}
    >
      {/* Chỉ cần viết form fields, không cần wrapper */}
      <div className="flex flex-col gap-4">
        <Label>Tên sản phẩm</Label>
        <Input ... />
        {/* More fields */}
      </div>
    </FormDrawer>
  );
}
```

**Xem thêm:** Section 2.6.3 - FormDrawer Component

### Cấu trúc Drawer (Cách cũ - Deprecated)

**⚠️ KHÔNG KHUYẾN KHÍCH** - Chỉ sử dụng nếu có requirements đặc biệt không phù hợp với FormDrawer.

<details>
<summary>Xem cách implement thủ công (deprecated)</summary>

```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

function MyEntityModal({ mode, trigger, onSuccess }) {
  const isMobile = useIsMobile(); // Hook để kiểm tra thiết bị
  const [open, setOpen] = React.useState(false);

  // ... (logic form và state)

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>[Tiêu đề, ví dụ: "Thêm Sản Phẩm Mới"]</DrawerTitle>
          <DrawerDescription>
            [Mô tả ngắn gọn về chức năng của form].
          </DrawerDescription>
        </DrawerHeader>

        {/* Nội dung chính, thường là một form có thể cuộn */}
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <MyForm />
        </div>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Lưu"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Hủy bỏ
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

**Vấn đề với cách này:**
- ❌ Tốn ~150-200 lines code mỗi form
- ❌ Phải tự handle `useIsMobile()`
- ❌ Code duplication cao
- ❌ Khó maintain khi cần thay đổi layout

</details>

### Khi nào sử dụng Drawer

*   Sử dụng cho các hành động **Tạo mới** và **Chỉnh sửa** có độ phức tạp vừa phải (ví dụ: quản lý sản phẩm, khách hàng).
*   Khi người dùng nhấp vào nút "Thêm mới" trên thanh action của bảng.
*   Khi người dùng nhấp vào một mục trong cột chính của bảng để chỉnh sửa.
*   **Lưu ý:** Đối với các đối tượng rất phức tạp (ví dụ: phiếu sửa chữa, quy trình làm việc), hãy sử dụng một **trang chuyên dụng** (xem mục 7).

### Biểu mẫu (Forms) bên trong Drawer

*   Nội dung chính của `Drawer` nên là một biểu mẫu (`<form>`).
*   Sử dụng `react-hook-form` và `zod` để quản lý và xác thực.
*   Các trường trong biểu mẫu phải tuân theo các quy tắc về spacing (`gap-4`).
*   Các nút hành động chính ("Lưu", "Tạo") và nút "Hủy" phải nằm trong `DrawerFooter`.

---

## 7. Trang Chuyên dụng cho Thêm/Sửa (Dedicated Add/Edit Pages)

Đối với các đối tượng có độ phức tạp cao (ví dụ: một phiếu sửa chữa với nhiều mục, hoặc một quy trình làm việc với các bước phụ thuộc), việc sử dụng `Drawer` có thể không đủ không gian và gây rối. Trong những trường hợp này, chúng ta sẽ sử dụng một trang chuyên dụng cho các hành động "Thêm mới" và "Chỉnh sửa".

### Nguyên tắc Thiết kế

*   **Tập trung:** Trang chỉ dành riêng cho một tác vụ duy nhất (thêm hoặc sửa).
*   **Điều hướng Rõ ràng:** Người dùng phải luôn biết cách quay lại, hủy bỏ, hoặc lưu lại tiến trình của mình.
*   **Nhất quán:** Cấu trúc của các trang này phải nhất quán trên toàn bộ ứng dụng.

### Cấu trúc Trang

```tsx
<>
  <PageHeader title="[Thêm/Sửa Đối tượng]" backHref="/[list-page-url]" />
  <div className="flex flex-1 flex-col">
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <MyComplexForm />
      </div>
    </div>
  </div>
  <PageFooter>
    <Button variant="outline" onClick={() => router.back()}>
      Hủy bỏ
    </Button>
    <Button type="submit" form="my-complex-form-id">
      Lưu thay đổi
    </Button>
  </PageFooter>
</>
```

### Các thành phần chính

1.  **`PageHeader` với Nút Quay lại:**
    *   `PageHeader` phải có một prop `backHref` để hiển thị một nút mũi tên cho phép người dùng quay lại trang danh sách trước đó.
    *   Tiêu đề phải rõ ràng, ví dụ: "Tạo Phiếu sửa chữa Mới" hoặc "Chỉnh sửa Sản phẩm".

2.  **Form chính:**
    *   Là thành phần chính của trang.
    *   Nên được chia thành các `Card` hoặc `section` hợp lý nếu có nhiều nhóm thông tin.

3.  **`PageFooter` với các Nút Hành động:**
    *   Một thanh footer `sticky` ở cuối trang để các nút hành động luôn hiển thị.
    *   **Nút "Hủy bỏ" (Cancel):**
        *   Luôn sử dụng `variant="outline"`.
        *   Hành động: Quay lại trang trước (`router.back()`).
        *   Nên có một hộp thoại xác nhận nếu có các thay đổi chưa được lưu.
    *   **Nút "Lưu" (Save/Submit):**
        *   Là nút hành động chính.
        *   Hành động: Gửi biểu mẫu. Sau khi thành công, chuyển hướng người dùng về trang danh sách hoặc trang chi tiết của mục vừa được tạo/chỉnh sửa.

---

## 8. Thanh Điều hướng (Sidebar)

Thanh điều hướng bên (sidebar) là thành phần điều hướng chính của ứng dụng. Cấu trúc và nội dung của nó được quản lý một cách tập trung và dựa trên dữ liệu.

### Cấu trúc và Nguyên tắc Hoạt động

Sidebar được xây dựng bằng cách sử dụng component `AppSidebar` (`src/components/app-sidebar.tsx`), và toàn bộ cấu trúc điều hướng được định nghĩa trong một đối tượng JavaScript có tên là `baseData` bên trong file này.

*   **Data-Driven:** Để thêm, xóa, hoặc sắp xếp lại các mục trong sidebar, bạn chỉ cần chỉnh sửa đối tượng `baseData`.
*   **Phân quyền theo Vai trò:** Mỗi mục trong `baseData` có một thuộc tính `allowedRoles` để kiểm soát vai trò nào có thể thấy mục đó. Logic lọc được xử lý bởi hàm `getFilteredData`.
*   **Component Tái sử dụng:** Các nhóm điều hướng được hiển thị bằng các component `NavSection` (cho các danh sách đơn giản) và `NavWorkflows` (cho các mục có thể thu gọn).

### Cách cập nhật Sidebar

Để cập nhật sidebar, hãy mở file `src/components/app-sidebar.tsx` và sửa đổi đối tượng `baseData`.

**Ví dụ về cấu trúc `baseData`:**

```javascript
const baseData = {
  // Nhóm Tổng quan
  overview: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      allowedRoles: ["admin", "manager"],
    },
    // ... các mục khác
  ],
  // Nhóm Vận hành
  operations: [
    {
      title: "Phiếu dịch vụ",
      url: "/operations/tickets",
      icon: IconClipboardList,
      allowedRoles: ["admin", "manager", "technician", "reception"],
    },
    // ... các mục khác
  ],
  // ... các nhóm khác
};
```

**Để thêm một mục mới:**

1.  Xác định nhóm bạn muốn thêm mục vào (ví dụ: `operations`).
2.  Thêm một object mới vào mảng của nhóm đó với các thuộc tính: `title`, `url`, `icon`, và `allowedRoles`.

**Để thay đổi thứ tự:**

*   Chỉ cần thay đổi thứ tự của các object trong các mảng của `baseData`.

### Giao diện và Style

*   **Màu sắc và Kích thước:** Các quy chuẩn về màu sắc, kích thước, và khoảng cách vẫn tuân theo các biến CSS được định nghĩa trong `src/app/globals.css` như đã mô tả trong các phần trước.
### Hành vi Đáp ứng (Responsive)

*   **Desktop (`md` trở lên):** Sidebar được cố định ở bên trái và luôn hiển thị. Nó có thể được thu gọn lại để chỉ hiển thị các icon.
*   **Mobile (dưới `md`):
    *   Sidebar được ẩn theo mặc định để tiết kiệm không gian.
    *   Nó được triển khai bằng component `Sheet`, xuất hiện dưới dạng một lớp phủ (overlay) trượt vào từ **bên trái** màn hình khi người dùng nhấp vào biểu tượng menu (hamburger icon).
    *   Khi mở, một lớp nền mờ sẽ che đi nội dung chính.
    *   Người dùng có thể đóng sidebar bằng cách nhấp vào lớp nền mờ, vuốt sidebar về lại bên trái, hoặc nhấp vào nút đóng (nếu có).

---

## 9. Quy chuẩn Giao diện cho Automation Test (Automation-Friendly UI Patterns)

Để đảm bảo các bài test tự động (ví dụ: Playwright) hoạt động ổn định và đáng tin cậy, các component giao diện cần được code theo các quy chuẩn sau.

### 9.1. Chiến lược Sử dụng Thuộc tính cho Test

Để chọn các phần tử một cách nhất quán trong các bài test, hãy ưu tiên sử dụng các thuộc tính sau:

1.  **`aria-label`:**
    *   **Công dụng:** Cung cấp một nhãn có thể truy cập cho các phần tử không có text hiển thị (ví dụ: nút chỉ có icon).
    *   **Lợi ích:** Cải thiện khả năng truy cập và tạo ra một selector ngữ nghĩa cho test.
    *   **Ví dụ:**
        ```tsx
        <Button aria-label="Chỉnh sửa sản phẩm">
          <IconEdit />
        </Button>
        ```
    *   **Sử dụng trong Test:** `page.getByRole('button', { name: 'Chỉnh sửa sản phẩm' })`

2.  **`data-testid`:**
    *   **Công dụng:** Cung cấp một định danh ổn định, duy nhất cho các phần tử không có vai trò hoặc nhãn rõ ràng.
    *   **Khi nào dùng:** Dùng cho các container, dialog, hoặc các phần tử cụ thể cần được nhắm đến trực tiếp.
    *   **Ví dụ:**
        ```tsx
        <DialogContent data-testid="edit-product-dialog">
        <TableRow data-testid={`product-row-${product.id}`}>
        ```
    *   **Sử dụng trong Test:** `page.getByTestId('edit-product-dialog')`

3.  **`data-role`:**
    *   **Công dụng:** Chọn các mục trong một danh sách mà không phụ thuộc vào ngôn ngữ hiển thị.
    *   **Lợi ích:** Giúp test chạy ổn định trên nhiều ngôn ngữ.
    *   **Ví dụ:**
        ```tsx
        <DropdownMenuItem data-role="reception">
          Lễ tân
        </DropdownMenuItem>
        ```
    *   **Sử dụng trong Test:** `page.locator('[role="menuitem"][data-role="reception"]')`

### 9.2. Quy tắc Lồng Component (Component Nesting)

**Vấn đề:** Các component tương tác lồng nhau không đúng cách có thể khiến test tự động thất bại, mặc dù chúng hoạt động bình thường khi kiểm tra thủ công.

**Quy tắc BẮT BUỘC:** Khi lồng `Tooltip` và `DropdownMenuTrigger`, **`DropdownMenuTrigger` phải nằm bên trong `TooltipTrigger`**.

*   **❌ SAI:**
    ```tsx
    <DropdownMenuTrigger>
      <Tooltip>
        <TooltipTrigger>
          <Button />
        </TooltipTrigger>
      </Tooltip>
    </DropdownMenuTrigger>
    ```
*   **✅ ĐÚNG:**
    ```tsx
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuTrigger asChild>
          <Button />
        </DropdownMenuTrigger>
      </TooltipTrigger>
    </Tooltip>
    ```

### 9.3. Các Thực hành Tốt nhất cho Test

*   **Dropdown Menus:**
    *   Luôn chờ cho menu mở ra trước khi tương tác: `await expect(page.locator('[role="menu"]')).toBeVisible();`
    *   Sử dụng selector có phạm vi rõ ràng để chọn các mục, ví dụ: `page.locator('[role="menuitem"][data-role="reception"]')`.
*   **Pagination:**
    *   Để xử lý phân trang, hãy luôn **sử dụng chức năng tìm kiếm** để lọc ra hàng (row) bạn cần trước khi tương tác với nó. Điều này đảm bảo hàng đó sẽ hiển thị trên trang hiện tại.
*   **Chọn Nút (Button Selection):**
    *   **Tránh** chọn nút dựa trên thứ tự (`.nth(0)`) hoặc các selector không ổn định.
    *   **Nên** sử dụng các selector ngữ nghĩa như `getByRole` (với `aria-label`) hoặc `getByTestId`.

**Tài liệu này là nguồn tham khảo chính cho việc phát triển giao diện. Vui lòng tuân thủ nghiêm ngặt.**

---

## 10. Change Log

**Version 1.1 (2025-10-27):**
- ✅ **Thêm Section 2.5:** Hệ Thống Màu Sắc & Badges (Color System & Badge Usage)
  - Category Badge Pattern với 7 màu chuẩn
  - Status Badge Pattern với gradients
  - Boolean Badge Pattern với icons
  - Metric Badge Pattern với color-coded thresholds
  - Icon Integration Pattern
  - Best practices và DO/DON'T guidelines
  - Reference implementation: `/src/components/tables/task-types-table.tsx`
- 🎨 Thiết lập tiêu chuẩn màu sắc nhất quán cho toàn bộ ứng dụng
- 🌙 Tất cả patterns đều có dark mode support

**Version 1.0 (2025-10-26):**
- Phiên bản ban đầu với các sections:
  - Page Structure
  - Style, Spacing và Padding
  - Tabs System
  - Tables
  - Cards
  - Drawers
  - Dedicated Add/Edit Pages
  - Sidebar
  - Automation-Friendly UI Patterns