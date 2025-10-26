# Hướng dẫn Code Giao diện (UI Coding Guide)

**Phiên bản:** 1.0
**Cập nhật lần cuối:** 2025-10-26

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
      {/* Rows ở đây */}
    </TableBody>
  </Table>
</div>
```

*   **Tiêu đề Bảng (Header):** Phải `sticky` và có nền `bg-muted` để luôn hiển thị khi cuộn.
*   **Container:** Bảng phải được bao bọc bởi một `div` có `overflow-hidden rounded-lg border`.

### Các Cột Tiêu chuẩn

1.  **Cột Chọn (Select):** Dành cho các thao tác hàng loạt.
2.  **Cột Chính (Tên/Name):** Phải là một `Button` có thể nhấp để mở modal chỉnh sửa.
3.  **Cột Hành động (Actions):** Một `DropdownMenu` ở cuối mỗi hàng, chứa các hành động như "Sửa" và "Xóa".

### Thanh Tìm kiếm và Lọc

*   Luôn đặt một thanh tìm kiếm `Input` phía trên bảng với `placeholder` tiếng Việt.
*   **Độ rộng tối đa:** `max-w-sm`.

### Phân trang (Pagination)

Tất cả các bảng phải có hệ thống phân trang đầy đủ ở phía dưới, bao gồm:
*   **Đếm số lượng đã chọn:** (ví dụ: "Đã chọn 5 trong 50")
*   **Chọn kích thước trang:** (10, 20, 30, 40, 50)
*   **Thông tin trang:** (ví dụ: "Trang 1 trên 10")
*   **Các nút điều hướng:** Trang đầu, Trang trước, Trang tiếp, Trang cuối.

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

Để đảm bảo trải nghiệm người dùng nhất quán, tất cả các hành động **tạo mới** hoặc **chỉnh sửa** các mục phức tạp (ví dụ: sản phẩm, khách hàng) PHẢI sử dụng component `Drawer`.

`Drawer` cung cấp nhiều không gian hơn cho các biểu mẫu phức tạp và mang lại trải nghiệm người dùng hiện đại.

### Hành vi và Giao diện

*   **Desktop:** `Drawer` sẽ trượt ra từ **bên phải** của màn hình.
*   **Mobile:** `Drawer` sẽ trượt lên từ **dưới cùng** của màn hình.

### Cấu trúc Drawer

Sử dụng các component `Drawer` từ `@/components/ui/drawer`.

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

**Tài liệu này là nguồn tham khảo chính cho việc phát triển giao diện. Vui lòng tuân thủ nghiêm ngặt.**
