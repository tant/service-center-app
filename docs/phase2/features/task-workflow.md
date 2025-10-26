# Hệ thống Quy trình Công việc (Task Workflow)

**Tài liệu Tính năng**
**Cập nhật lần cuối:** 2025-10-26

---

## Tổng quan

Hệ thống Quy trình Công việc cho phép thực thi dịch vụ một cách có cấu trúc và có thể theo dõi thông qua các mẫu công việc được định sẵn. Nó biến các phiếu sửa chữa từ việc theo dõi trạng thái đơn giản thành các quy trình làm việc chi tiết, từng bước một.

### Các lợi ích chính

*   **Tiêu chuẩn hóa:** Đảm bảo chất lượng dịch vụ nhất quán.
*   **Khả năng truy vết:** Cung cấp một lộ trình kiểm toán đầy đủ cho mỗi công việc.
*   **Linh hoạt:** Hỗ trợ cả chế độ thực thi nghiêm ngặt theo trình tự và linh hoạt.
*   **Minh bạch:** Theo dõi tiến độ thời gian thực cho quản lý và kỹ thuật viên.

---

## Các Khái niệm Cốt lõi

### 1. Loại Công việc (Task Types)

Là các đơn vị công việc có thể tái sử dụng trong nhiều mẫu khác nhau (ví dụ: "Chẩn đoán ban đầu", "Thay pin").

### 2. Mẫu Công việc (Task Templates)

Là các quy trình được định sẵn, kết hợp nhiều loại công việc theo một trình tự cụ thể. Mỗi mẫu có thể ở một trong hai chế độ:

*   **Chế độ Nghiêm ngặt (Strict Mode):** Các công việc phải được hoàn thành theo đúng thứ tự.
*   **Chế độ Linh hoạt (Flexible Mode):** Các công việc có thể được hoàn thành không theo thứ tự, nhưng sẽ có cảnh báo.

### 3. Các Công việc của Phiếu sửa chữa (Service Ticket Tasks)

Là các phiên bản công việc được tạo ra khi một mẫu được áp dụng cho một phiếu sửa chữa. Mỗi công việc có một vòng đời trạng thái:

```
pending → in_progress → completed
   ↓            ↓
blocked      skipped
```

---

## Các tính năng

### Quản lý Mẫu công việc

*   **Quyền truy cập:** Admin, Manager.
*   **Khả năng:** Tạo, sửa (tạo phiên bản mới), và xóa các mẫu công việc.

### Thực thi Công việc

*   **Quyền truy cập:** Technician, Admin, Manager.
*   **Trang "Công việc của tôi":** Hiển thị tất cả các công việc được giao cho người dùng hiện tại.
*   **Hành động:** Bắt đầu, hoàn thành (yêu cầu ghi chú), hoặc chặn một công việc.

### Dashboard Tiến độ Công việc

*   **Quyền truy cập:** Admin, Manager.
*   **Số liệu:** Cung cấp cái nhìn tổng quan về các công việc đang hoạt động, bị chặn, và phân bổ công việc cho các kỹ thuật viên.

### Chuyển đổi Mẫu công việc Động

*   **Quyền truy cập:** Technician, Admin, Manager.
*   **Công dụng:** Cho phép thay đổi mẫu công việc giữa chừng nếu chẩn đoán ban đầu không chính xác. Các công việc đã hoàn thành sẽ được giữ lại.

---

## Quy trình làm việc của Người dùng

1.  **Tạo Mẫu công việc (Quản lý/Admin):** Tạo một quy trình mới bằng cách kết hợp các loại công việc có sẵn.
2.  **Áp dụng Mẫu cho Phiếu sửa chữa (Lễ tân/Kỹ thuật viên):** Khi tạo một phiếu sửa chữa, chọn một mẫu phù hợp. Các công việc sẽ được tự động tạo ra.
3.  **Thực thi Công việc (Kỹ thuật viên):** Trên trang "Công việc của tôi", bắt đầu và hoàn thành các công việc theo trình tự.
4.  **Giám sát Tiến độ (Quản lý/Admin):** Sử dụng dashboard để theo dõi hiệu suất và xác định các điểm nghẽn.

---

## Chi tiết Kỹ thuật

### Các bảng Cơ sở dữ liệu

*   **`task_types`:** Thư viện các định nghĩa công việc có thể tái sử dụng.
*   **`task_templates`:** Các định nghĩa quy trình làm việc.
*   **`task_templates_tasks`:** Bảng nối giữa loại công việc và mẫu.
*   **`service_ticket_tasks`:** Các phiên bản công việc cho các phiếu sửa chữa cụ thể.
*   **`ticket_template_changes`:** Lộ trình kiểm toán cho việc chuyển đổi mẫu.

### Các Thủ tục tRPC

*   **Router:** `workflow` (`/src/server/routers/workflow.ts`)
*   Bao gồm các thủ tục để quản lý loại công việc, mẫu công việc, thực thi công việc, và lấy dữ liệu cho dashboard.

**End of Task Workflow Feature Document**