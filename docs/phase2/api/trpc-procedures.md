# Tham khảo API tRPC - Giai đoạn 2

**Phiên bản:** 2.0
**Cập nhật lần cuối:** 2025-10-26

---

## Giới thiệu

Trung tâm Dịch vụ sử dụng **tRPC** để giao tiếp API an toàn về kiểu (type-safe) giữa Next.js frontend và backend. Tất cả các thủ tục API được định nghĩa trong `src/server/routers/`.

### Type Safety

tRPC cung cấp suy luận kiểu TypeScript đầy đủ từ server đến client. Import kiểu `AppRouter` để gọi API an toàn về kiểu:

```typescript
import { type AppRouter } from '@/server/routers/_app';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>();
```

---

## Xác thực & Phân quyền

### Phương thức xác thực

Sử dụng **Supabase Auth** với JWT token được lưu trong cookie HTTP-only.

### Phân quyền dựa trên vai trò (Role-Based Access Control)

Vai trò người dùng được lưu trong bảng `profiles`:

*   **admin:** Toàn quyền truy cập hệ thống.
*   **manager:** Quản lý mẫu công việc, người dùng, lô RMA.
*   **technician:** Thực hiện công việc, chuyển đổi mẫu công việc.
*   **reception:** Xem mẫu công việc, tạo phiếu sửa chữa.

---

## Xử lý lỗi

tRPC sử dụng các mã lỗi tiêu chuẩn:

| Code | HTTP Status | Mô tả |
|---|---|---|
| `UNAUTHORIZED` | 401 | Người dùng chưa xác thực |
| `FORBIDDEN` | 403 | Không đủ quyền |
| `NOT_FOUND` | 404 | Không tìm thấy tài nguyên |
| `CONFLICT` | 409 | Xung đột tài nguyên (trùng lặp) |
| `BAD_REQUEST` | 400 | Dữ liệu đầu vào không hợp lệ |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi máy chủ |

---

## Tham khảo Router

---

## Workflow Router

**Đường dẫn:** `workflow.*`

Quản lý các mẫu công việc, loại công việc và các hoạt động liên quan đến quy trình làm việc.

### Thủ tục Loại công việc (Task Type)

#### `workflow.taskType.list`

*   **Loại:** Query
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Liệt kê tất cả các loại công việc đang hoạt động.

#### `workflow.taskType.create`

*   **Loại:** Mutation
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Admin, Manager

Tạo một loại công việc tùy chỉnh mới.

### Thủ tục Mẫu công việc (Template)

#### `workflow.template.list`

*   **Loại:** Query
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Liệt kê các mẫu công việc với các bộ lọc tùy chọn.

#### `workflow.template.create`

*   **Loại:** Mutation
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Admin, Manager

Tạo một mẫu công việc mới.

### Thủ tục Thực thi Công việc (Task Execution)

#### `workflow.myTasks`

*   **Loại:** Query
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Lấy danh sách các công việc được giao cho người dùng hiện tại.

#### `workflow.completeTask`

*   **Loại:** Mutation
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Hoàn thành một công việc với ghi chú bắt buộc.

---

## Inventory Router

**Đường dẫn:** `inventory.*`

Quản lý sản phẩm vật lý, số serial, di chuyển kho và các lô RMA.

### Đăng ký Sản phẩm

#### `inventory.createProduct`

*   **Loại:** Mutation
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Đăng ký một sản phẩm vật lý mới với số serial.

#### `inventory.listProducts`

*   **Loại:** Query
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Liệt kê sản phẩm với bộ lọc và phân trang.

### Di chuyển Kho (Stock Movements)

#### `inventory.verifySerial`

*   **Loại:** Mutation
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Kiểm tra tình trạng bảo hành bằng số serial.

#### `inventory.recordMovement`

*   **Loại:** Mutation
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Ghi lại việc di chuyển sản phẩm giữa các kho.

### Tồn kho và Cảnh báo

#### `inventory.getStockLevels`

*   **Loại:** Query
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Lấy mức tồn kho tổng hợp với trạng thái cảnh báo.

### Hoạt động Lô RMA

#### `inventory.createRMABatch`

*   **Loại:** Mutation
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Admin, Manager

Tạo lô RMA mới để trả hàng cho nhà cung cấp.

---

## Tickets Router

**Đường dẫn:** `tickets.*`

Các hoạt động CRUD cho phiếu sửa chữa, quản lý linh kiện, bình luận và theo dõi giao hàng.

### CRUD Phiếu sửa chữa

#### `tickets.getTickets`

*   **Loại:** Query
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Lấy tất cả các phiếu sửa chữa.

#### `tickets.createTicket`

*   **Loại:** Mutation
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Tạo phiếu sửa chữa mới.

### Quản lý Linh kiện

#### `tickets.addTicketPart`

*   **Loại:** Mutation
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Thêm linh kiện vào phiếu sửa chữa.

### Bình luận và Tệp đính kèm

#### `tickets.addComment`

*   **Loại:** Mutation
*   **Yêu cầu xác thực:** Có
*   **Vai trò:** Mọi người

Thêm bình luận vào phiếu sửa chữa.

---

Để biết thêm chi tiết về từng thủ tục, vui lòng tham khảo mã nguồn tại `src/server/routers/`.

**End of API Reference**