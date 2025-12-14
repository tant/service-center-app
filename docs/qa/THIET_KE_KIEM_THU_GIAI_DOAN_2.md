# Thiết Kế Kiểm Thử Giai Đoạn 2 - Trung Tâm Dịch Vụ

**Phiên Bản:** 1.0
**Ngày Tạo:** 2025-10-25
**Giai Đoạn:** Phase 2 - Workflow, Warranty & Warehouse
**Stories:** 1.1 - 1.17

---

## Mục Lục

1. [Giới Thiệu](#giới-thiệu)
2. [Phương Pháp Kiểm Thử](#phương-pháp-kiểm-thử)
3. [Dữ Liệu Kiểm Thử](#dữ-liệu-kiểm-thử)
4. [Thiết Kế Kiểm Thử Theo Story](#thiết-kế-kiểm-thử-theo-story)
   - [Phase 1: Foundation (1.1-1.3)](#phase-1-foundation)
   - [Phase 2: Core Workflow (1.4-1.5)](#phase-2-core-workflow)
   - [Phase 3: Warehouse Foundation (1.6-1.7)](#phase-3-warehouse-foundation)
   - [Phase 4: Warehouse Operations (1.8-1.10)](#phase-4-warehouse-operations)
   - [Phase 5: Public Portal (1.11-1.14)](#phase-5-public-portal)
   - [Phase 6: Enhanced Features (1.15-1.17)](#phase-6-enhanced-features)
5. [Ma Trận Truy Xuất](#ma-trận-truy-xuất)

---

## Giới Thiệu

Tài liệu này mô tả chi tiết thiết kế kiểm thử cho tất cả các stories trong Giai Đoạn 2 của hệ thống Trung Tâm Dịch Vụ. Mỗi story được thiết kế kiểm thử theo phương pháp Given-When-Then để đảm bảo:

- **Truy xuất yêu cầu đầy đủ** - Ánh xạ từng test case đến acceptance criteria
- **Tính nhất quán** - Sử dụng cùng thuật ngữ và cấu trúc
- **Khả năng tự động hóa** - Kịch bản rõ ràng, dễ chuyển thành test scripts
- **Độ bao phủ toàn diện** - Kiểm thử chức năng, bảo mật, hiệu suất, tích hợp

---

## Phương Pháp Kiểm Thử

### Mẫu Given-When-Then

Tất cả test case được viết theo định dạng:

```
**Given** (Điều kiện ban đầu)
  - Trạng thái hệ thống
  - Dữ liệu có sẵn
  - Quyền người dùng

**When** (Hành động)
  - Các bước thực hiện
  - Tương tác với hệ thống

**Then** (Kết quả mong đợi)
  - Thay đổi dữ liệu
  - Phản hồi UI
  - Thông báo
  - Logs/audit trail
```

### Phân Loại Kiểm Thử

- **[FUNC]** - Functional Testing (Kiểm thử chức năng)
- **[SEC]** - Security Testing (Kiểm thử bảo mật)
- **[PERF]** - Performance Testing (Kiểm thử hiệu suất)
- **[INT]** - Integration Testing (Kiểm thử tích hợp)
- **[E2E]** - End-to-End Testing (Kiểm thử đầu cuối)

---

## Dữ Liệu Kiểm Thử

### Người Dùng Kiểm Thử

| Vai Trò | Email | Tên | Mật Khẩu |
|---------|-------|-----|----------|
| Quản Trị Viên | admin@test.com | Admin Test | test_admin_123 |
| Quản Lý | manager@test.com | Manager Test | test_manager_123 |
| Kỹ Thuật Viên 1 | tech1@test.com | Kỹ Thuật Viên 1 | test_tech1_123 |
| Kỹ Thuật Viên 2 | tech2@test.com | Kỹ Thuật Viên 2 | test_tech2_123 |
| Lễ Tân | reception@test.com | Lễ Tân Test | test_reception_123 |

### Khách Hàng Kiểm Thử

| Tên | Điện Thoại | Email |
|-----|-----------|-------|
| Nguyễn Văn A | 0901234567 | nguyenvana@example.com |
| Trần Thị B | 0912345678 | tranthib@example.com |
| Lê Văn C | 0923456789 | levanc@example.com |

### Sản Phẩm Kiểm Thử

| Tên | Thương Hiệu | Loại | SKU | Serial Number |
|-----|-------------|------|-----|---------------|
| iPhone 13 Pro | Apple | Smartphone | IP13P-128-BLU | SN-IP13P-001 |
| Samsung Galaxy S23 | Samsung | Smartphone | SGS23-256-BLK | SN-SGS23-001 |
| MacBook Air M2 | Apple | Laptop | MBA-M2-512-SLV | SN-MBA-001 |

### Loại Công Việc Kiểm Thử

| Danh Mục | Tên | Mô Tả | Thời Gian Ước Tính |
|----------|-----|-------|-------------------|
| Intake | Tiếp nhận máy | Kiểm tra ngoại quan, phụ kiện | 15 phút |
| Diagnosis | Chẩn đoán sự cố | Xác định nguyên nhân hư hỏng | 30 phút |
| Repair | Thay màn hình | Thay thế màn hình hư | 60 phút |
| QA | Kiểm tra chất lượng | Kiểm tra sau sửa chữa | 20 phút |
| Closing | Đóng gói giao hàng | Chuẩn bị giao hàng cho khách | 10 phút |

---

## Thiết Kế Kiểm Thử Theo Story

## Phase 1: Foundation

### Story 1.1: Foundation Setup

**Mục tiêu:** Xác minh cơ sở hạ tầng database và frontend được thiết lập đúng

#### TC-1.1.1: Kiểm Tra Database Tables [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Structure Validation

**Given:**
- Supabase đang chạy trên local
- Migrations đã được apply

**When:**
- Truy vấn danh sách tables trong database

**Then:**
- 14 bảng Phase 2 tồn tại:
  - `task_templates`, `task_types`, `task_templates_tasks`
  - `service_ticket_tasks`, `task_history`, `ticket_template_changes`
  - `physical_warehouses`, `virtual_warehouses`, `physical_products`
  - `stock_movements`, `product_stock_thresholds`
  - `rma_batches`, `service_requests`, `email_notifications`

**SQL Kiểm Tra:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'task_templates', 'task_types', 'service_ticket_tasks',
  'physical_warehouses', 'virtual_warehouses', 'rma_batches'
)
ORDER BY table_name;
```

---

#### TC-1.1.2: Kiểm Tra ENUMs [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Data Type Validation

**Given:**
- Database đã được migrate

**When:**
- Truy vấn các ENUM types

**Then:**
- Các ENUM sau tồn tại với giá trị đúng:
  - `task_status`: pending, in_progress, completed, blocked, skipped
  - `warehouse_type`: main, warranty_stock, rma_staging, dead_stock, in_service, parts

**SQL Kiểm Tra:**
```sql
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('task_status', 'warehouse_type')
ORDER BY t.typname, e.enumsortorder;
```

---

#### TC-1.1.3: Kiểm Tra RLS Policies [SEC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Security

**Given:**
- Database đã được thiết lập
- RLS đã được enable

**When:**
- Truy vấn policies cho từng bảng Phase 2

**Then:**
- Mỗi bảng có ít nhất 4 policies (SELECT, INSERT, UPDATE, DELETE)
- Policies phân quyền theo role:
  - Admin: Full access
  - Manager: Read + limited write
  - Technician: Task-specific access
  - Reception: Request management

**SQL Kiểm Tra:**
```sql
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('task_templates', 'service_ticket_tasks')
ORDER BY tablename, cmd;
```

---

#### TC-1.1.4: Kiểm Tra tRPC Routers [INT]

**Mức Độ Ưu Tiên:** High
**Loại:** API Integration

**Given:**
- Next.js dev server đang chạy
- tRPC routers đã được đăng ký

**When:**
- Gọi health check endpoint
- Kiểm tra router registration

**Then:**
- 7 routers Phase 2 khả dụng:
  - workflow, warehouse, inventory
  - serviceRequest, notifications
  - tickets, customers

**Cách Kiểm Tra:**
```bash
curl http://localhost:3025/api/health
# Response: { "status": "healthy" }
```

---

### Story 1.2: Task Template Management

**Mục tiêu:** Quản lý mẫu công việc với khả năng CRUD đầy đủ

#### TC-1.2.1: Tạo Mẫu Công Việc Mới [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Create Operation

**Given:**
- Đăng nhập với vai trò Quản Trị Viên
- Đang ở trang /workflows/templates
- Có sẵn 15 loại công việc trong database

**When:**
1. Nhấp nút "Mẫu Mới"
2. Điền thông tin:
   - Tên: "Sửa Chữa Màn Hình iPhone"
   - Mô tả: "Quy trình thay màn hình cho iPhone"
   - Loại dịch vụ: "Trả phí" (paid)
   - Thực thi trình tự: Bật (strict_sequence: true)
3. Thêm 5 công việc:
   - Tiếp nhận máy (Intake, bắt buộc)
   - Chẩn đoán (Diagnosis, bắt buộc)
   - Thay màn hình (Repair, bắt buộc)
   - Kiểm tra chất lượng (QA, bắt buộc)
   - Đóng gói giao hàng (Closing, tùy chọn)
4. Kéo thả để sắp xếp thứ tự
5. Nhấp "Lưu"

**Then:**
- Toast thông báo: "Tạo mẫu thành công"
- Mẫu xuất hiện trong bảng danh sách
- Database có bản ghi mới:
  - Bảng `task_templates`: 1 dòng
  - Bảng `task_templates_tasks`: 5 dòng
- `sequence_order` được đánh số: 1, 2, 3, 4, 5
- `enforce_sequence` = true
- `is_active` = true
- `version` = 1

**SQL Kiểm Tra:**
```sql
-- Kiểm tra template được tạo
SELECT id, name, service_type, enforce_sequence, is_active, version
FROM task_templates
WHERE name = 'Sửa Chữa Màn Hình iPhone';

-- Kiểm tra tasks được liên kết
SELECT tt.name, ttt.sequence_order, ttt.is_required, t.name as task_name
FROM task_templates_tasks ttt
JOIN task_templates tt ON tt.id = ttt.template_id
JOIN task_types t ON t.id = ttt.task_type_id
WHERE tt.name = 'Sửa Chữa Màn Hình iPhone'
ORDER BY ttt.sequence_order;
```

---

#### TC-1.2.2: Chỉnh Sửa Mẫu Hiện Có [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Update Operation

**Given:**
- Có mẫu "Sửa Chữa Màn Hình iPhone" từ TC-1.2.1
- Đăng nhập với vai trò Quản Trị Viên

**When:**
1. Nhấp nút "Sửa" trên mẫu
2. Modal mở ra với dữ liệu đã điền sẵn
3. Thay đổi tên thành: "Sửa Chữa Màn Hình iPhone - Nâng Cao"
4. Thêm công việc thứ 6: "Dán kính cường lực" (sau QA)
5. Bỏ chọn "bắt buộc" cho công việc "Đóng gói"
6. Nhấp "Lưu"

**Then:**
- Toast thông báo: "Cập nhật mẫu thành công"
- Tên mẫu thay đổi trong bảng
- Version tăng lên 2
- Có 6 công việc trong mẫu
- Công việc "Đóng gói" có `is_required` = false
- History được giữ (version cũ vẫn tồn tại nếu có phiếu đang sử dụng)

**SQL Kiểm Tra:**
```sql
-- Kiểm tra version mới
SELECT name, version, updated_at
FROM task_templates
WHERE name LIKE 'Sửa Chữa Màn Hình iPhone%'
ORDER BY version DESC;

-- Kiểm tra số lượng tasks
SELECT COUNT(*) as task_count
FROM task_templates_tasks
WHERE template_id = (
  SELECT id FROM task_templates
  WHERE name LIKE 'Sửa Chữa Màn Hình iPhone%'
  ORDER BY version DESC LIMIT 1
);
```

---

#### TC-1.2.3: Xóa Mẫu Không Được Sử Dụng [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Delete Operation

**Given:**
- Có mẫu "Test Template" chưa được sử dụng bởi phiếu nào
- Đăng nhập với vai trò Quản Trị Viên

**When:**
1. Nhấp nút "Xóa" trên mẫu "Test Template"
2. Dialog xác nhận hiện ra
3. Nhấp "Xác nhận xóa"

**Then:**
- Toast thông báo: "Xóa mẫu thành công"
- Mẫu biến mất khỏi danh sách
- Bản ghi trong database bị xóa (hoặc `deleted_at` được set)

---

#### TC-1.2.4: Ngăn Xóa Mẫu Đang Được Sử Dụng [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Validation

**Given:**
- Có mẫu "Sửa Chữa Màn Hình iPhone" đang được sử dụng bởi 3 phiếu
- Đăng nhập với vai trò Quản Trị Viên

**When:**
1. Nhấp nút "Xóa" trên mẫu
2. Nhấp "Xác nhận xóa"

**Then:**
- Toast lỗi: "Không thể xóa mẫu đang được sử dụng bởi 3 phiếu dịch vụ"
- Mẫu vẫn tồn tại trong database
- Không có thay đổi dữ liệu

---

#### TC-1.2.5: Xem Trước Mẫu [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Read Operation

**Given:**
- Có mẫu với 5 công việc
- Đăng nhập với bất kỳ vai trò nào

**When:**
1. Nhấp nút "Xem" trên mẫu
2. Modal preview mở ra

**Then:**
- Hiển thị đầy đủ thông tin:
  - Tên mẫu
  - Mô tả
  - Loại dịch vụ (badge màu)
  - Trạng thái hoạt động
  - Cảnh báo nếu enforce_sequence = true
- Danh sách 5 công việc với:
  - Số thứ tự
  - Tên công việc
  - Badge "Bắt buộc" nếu is_required = true
  - Thời gian ước tính

---

#### TC-1.2.6: Kiểm Tra Phân Quyền - Manager Không Thể Sửa [SEC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Authorization

**Given:**
- Đăng nhập với vai trò Quản Lý (Manager)
- Đang ở trang /workflows/templates

**When:**
- Xem danh sách mẫu

**Then:**
- Nút "Mẫu Mới" KHÔNG hiển thị
- Nút "Sửa" KHÔNG hiển thị
- Nút "Xóa" KHÔNG hiển thị
- Chỉ có nút "Xem" khả dụng
- tRPC mutation bị từ chối nếu gọi trực tiếp

---

### Story 1.3: Automatic Task Generation

**Mục tiêu:** Tự động tạo công việc khi tạo phiếu dịch vụ

#### TC-1.3.1: Tự Động Tạo Công Việc Khi Tạo Phiếu [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Trigger Automation

**Given:**
- Có mẫu "Sửa Chữa Màn Hình iPhone" với 5 công việc
- Mẫu có service_type = "paid"
- Sản phẩm iPhone 13 Pro tồn tại
- Đăng nhập với vai trò Lễ Tân

**When:**
1. Điều hướng đến /tickets/add
2. Tạo phiếu mới:
   - Khách hàng: Nguyễn Văn A
   - Sản phẩm: iPhone 13 Pro
   - Loại bảo hành: "Trả phí" (paid)
   - Vấn đề: "Màn hình bị vỡ"
3. Hoàn thành tạo phiếu

**Then:**
- Phiếu được tạo thành công
- 5 công việc được tự động tạo trong `service_ticket_tasks`:
  - Tất cả có status = "pending"
  - sequence_order: 1, 2, 3, 4, 5
  - is_required đúng với cấu hình mẫu
  - task_type_id khớp với mẫu
- Khi mở trang chi tiết phiếu → hiển thị 5 công việc

**SQL Kiểm Tra:**
```sql
-- Kiểm tra tasks được tạo
SELECT
  t.ticket_number,
  stt.sequence_order,
  tt.name as task_name,
  stt.status,
  stt.is_required
FROM service_ticket_tasks stt
JOIN service_tickets t ON t.id = stt.ticket_id
JOIN task_types tt ON tt.id = stt.task_type_id
WHERE t.ticket_number = 'SV-2025-XXX' -- Thay bằng số phiếu thực tế
ORDER BY stt.sequence_order;
```

---

#### TC-1.3.2: Không Tạo Task Nếu Không Có Mẫu Phù Hợp [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Edge Case

**Given:**
- Không có mẫu nào cho service_type = "warranty" + product "Samsung Galaxy"
- Đăng nhập với vai trò Lễ Tân

**When:**
1. Tạo phiếu mới:
   - Sản phẩm: Samsung Galaxy S23
   - Loại bảo hành: "Bảo hành" (warranty)
2. Hoàn thành tạo phiếu

**Then:**
- Phiếu được tạo thành công
- Không có công việc nào được tạo
- Trang chi tiết phiếu hiển thị thông báo: "Chưa có mẫu công việc được áp dụng"

---

#### TC-1.3.3: Xử Lý NULL product_id [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Edge Case

**Given:**
- Phiếu không có product_id (dịch vụ tổng quát)
- Đăng nhập với vai trò Lễ Tân

**When:**
- Tạo phiếu không chọn sản phẩm

**Then:**
- Phiếu được tạo thành công
- Không có công việc nào được tạo
- Không có lỗi xảy ra
- Có thể thêm công việc thủ công sau

---

## Phase 2: Core Workflow

### Story 1.4: Task Execution UI

**Mục tiêu:** Giao diện thực hiện công việc cho Kỹ Thuật Viên

#### TC-1.4.1: Xem Danh Sách Công Việc Được Giao [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Read Operation

**Given:**
- Đăng nhập với vai trò Kỹ Thuật Viên 1 (tech1@test.com)
- Có 3 phiếu được giao cho Kỹ Thuật Viên 1
- Mỗi phiếu có 5 công việc

**When:**
- Điều hướng đến /my-tasks

**Then:**
- Hiển thị 3 nhóm (theo phiếu)
- Mỗi nhóm hiển thị:
  - Số phiếu (SV-2025-XXX)
  - Tên khách hàng
  - Thanh tiến độ (X/5 hoàn thành)
  - Danh sách công việc
- Statistics cards hiển thị:
  - Tổng: 15 công việc
  - Chờ xử lý: X
  - Đang xử lý: Y
  - Hoàn thành: Z
  - Bị chặn: 0

---

#### TC-1.4.2: Bắt Đầu Công Việc [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** State Transition

**Given:**
- Đăng nhập với vai trò Kỹ Thuật Viên
- Có công việc với status = "pending"
- Đang ở trang /my-tasks

**When:**
1. Nhấp nút "Bắt Đầu" trên công việc
2. Xác nhận

**Then:**
- Toast thông báo: "Bắt đầu công việc thành công"
- Status công việc chuyển thành "in_progress"
- `started_at` được set = now()
- Icon công việc thay đổi thành icon "in progress"
- Nút "Bắt Đầu" biến mất
- Nút "Hoàn Thành" và "Chặn" xuất hiện
- Statistics card "Đang xử lý" tăng 1
- Cache tự động refresh

**SQL Kiểm Tra:**
```sql
SELECT status, started_at, completed_at
FROM service_ticket_tasks
WHERE id = 'task_id_here';
```

---

#### TC-1.4.3: Hoàn Thành Công Việc Với Ghi Chú [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** State Transition + Validation

**Given:**
- Công việc có status = "in_progress"
- Đang ở trang /my-tasks

**When:**
1. Nhấp nút "Hoàn Thành"
2. Modal mở ra yêu cầu ghi chú
3. Nhập ghi chú: "Đã thay màn hình thành công. Màn hình mới hoạt động tốt."
4. Nhấp "Xác nhận"

**Then:**
- Toast thông báo: "Hoàn thành công việc thành công"
- Status chuyển thành "completed"
- `completed_at` được set = now()
- `actual_duration_minutes` được tính = completed_at - started_at
- Completion notes được lưu
- Icon công việc thay đổi thành icon "completed"
- Statistics card "Hoàn thành" tăng 1
- Nút action biến mất (task đã xong)

---

#### TC-1.4.4: Validation Ghi Chú Hoàn Thành [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Validation

**Given:**
- Modal "Hoàn thành công việc" đang mở

**When:**
1. Để trống ghi chú
2. Nhấp "Xác nhận"

**Then:**
- Hiển thị lỗi: "Ghi chú hoàn thành là bắt buộc (tối thiểu 5 ký tự)"
- Modal không đóng
- Công việc vẫn có status = "in_progress"

**When:**
1. Nhập ghi chú: "OK"
2. Nhấp "Xác nhận"

**Then:**
- Hiển thị lỗi: "Ghi chú hoàn thành phải có ít nhất 5 ký tự"
- Modal không đóng

---

#### TC-1.4.5: Chặn Công Việc Với Lý Do [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** State Transition

**Given:**
- Công việc có status = "in_progress"
- Đang ở trang /my-tasks

**When:**
1. Nhấp nút "Chặn"
2. Dialog yêu cầu lý do
3. Nhập lý do: "Thiếu linh kiện màn hình, chờ nhập hàng"
4. Xác nhận

**Then:**
- Toast thông báo: "Đã chặn công việc"
- Status chuyển thành "blocked"
- Lý do được lưu vào notes
- Icon công việc thay đổi thành icon "blocked"
- Statistics card "Bị chặn" tăng 1
- Nút "Tiếp Tục" xuất hiện thay cho "Hoàn Thành"

---

#### TC-1.4.6: Tiếp Tục Công Việc Bị Chặn [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** State Transition

**Given:**
- Công việc có status = "blocked"

**When:**
1. Nhấp nút "Tiếp Tục"
2. Xác nhận

**Then:**
- Toast thông báo: "Tiếp tục công việc thành công"
- Status chuyển lại thành "in_progress"
- Statistics card cập nhật
- Nút "Hoàn Thành" và "Chặn" xuất hiện lại

---

#### TC-1.4.7: Auto-Refresh Mỗi 30 Giây [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Real-time Updates

**Given:**
- Đang ở trang /my-tasks
- Tab đang active (không minimize)

**When:**
- Chờ 30 giây

**Then:**
- TanStack Query tự động refetch dữ liệu
- Danh sách công việc cập nhật nếu có thay đổi từ database
- Không có loading indicator toàn trang (background refresh)
- Statistics cards cập nhật

---

#### TC-1.4.8: Chỉ Xem Công Việc Được Giao Cho Mình [SEC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Authorization

**Given:**
- Kỹ Thuật Viên 1 có 5 công việc
- Kỹ Thuật Viên 2 có 3 công việc

**When:**
- Đăng nhập với Kỹ Thuật Viên 1
- Mở /my-tasks

**Then:**
- Chỉ hiển thị 5 công việc của Kỹ Thuật Viên 1
- KHÔNG hiển thị công việc của Kỹ Thuật Viên 2
- tRPC query filter theo `assigned_to = current_user_id`

---

### Story 1.5: Task Dependencies and Status Automation

**Mục tiêu:** Thực thi trình tự công việc và tự động nâng trạng thái phiếu

#### TC-1.5.1: Ngăn Chặn Thực Hiện Không Đúng Thứ Tự (Strict Mode) [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Sequence Enforcement

**Given:**
- Phiếu có mẫu với `enforce_sequence` = true
- Công việc 1: "Tiếp nhận" - completed
- Công việc 2: "Chẩn đoán" - pending
- Công việc 3: "Sửa chữa" - pending
- Đăng nhập với vai trò Kỹ Thuật Viên

**When:**
1. Cố gắng nhấp "Bắt Đầu" trên công việc 3 (bỏ qua công việc 2)

**Then:**
- Nút "Bắt Đầu" bị disable
- Icon khóa xuất hiện
- Tooltip hiển thị: "Phải hoàn thành công việc trước đó: Chẩn đoán"
- Không thể thay đổi status
- Database trigger `check_task_sequence_gate` ngăn chặn UPDATE

**SQL Kiểm Tra:**
```sql
-- Thử update trực tiếp (sẽ bị reject)
UPDATE service_ticket_tasks
SET status = 'in_progress'
WHERE sequence_order = 3
AND ticket_id = 'ticket_id_here';
-- Expected: ERROR: Cannot start task out of sequence
```

---

#### TC-1.5.2: Cảnh Báo Thực Hiện Không Đúng Thứ Tự (Flexible Mode) [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Warning Display

**Given:**
- Phiếu có mẫu với `enforce_sequence` = false
- Công việc 2: "Chẩn đoán" - pending
- Công việc 3: "Sửa chữa" - pending

**When:**
1. Bắt đầu công việc 3 trước công việc 2
2. Cố gắng hoàn thành công việc 3

**Then:**
- Cho phép bắt đầu công việc 3
- Icon cảnh báo (⚠️) xuất hiện
- Modal hoàn thành hiển thị cảnh báo:
  - "Bạn đang hoàn thành công việc không đúng thứ tự"
  - "Công việc trước đó chưa hoàn thành: Chẩn đoán"
  - Checkbox xác nhận: "Tôi hiểu và muốn tiếp tục"
- Vẫn cho phép hoàn thành sau khi xác nhận

---

#### TC-1.5.3: Tự Động Nâng Phiếu Lên "Đang Xử Lý" [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Auto Status Transition

**Given:**
- Phiếu có status = "pending"
- Phiếu có 5 công việc, tất cả status = "pending"

**When:**
1. Kỹ thuật viên bắt đầu công việc đầu tiên
2. Status công việc chuyển từ "pending" → "in_progress"

**Then:**
- Trigger `auto_advance_ticket_status` kích hoạt
- Phiếu tự động chuyển status từ "pending" → "in_progress"
- Thông báo được log vào `service_ticket_comments`:
  - Loại: "system"
  - Nội dung: "Phiếu tự động chuyển sang 'Đang xử lý' khi công việc đầu tiên bắt đầu"
- `started_at` của phiếu được set = now()

**SQL Kiểm Tra:**
```sql
-- Kiểm tra phiếu đã nâng status
SELECT ticket_number, status, started_at
FROM service_tickets
WHERE id = 'ticket_id_here';

-- Kiểm tra comment tự động
SELECT comment_text, comment_type, created_at
FROM service_ticket_comments
WHERE ticket_id = 'ticket_id_here'
AND comment_type = 'system'
ORDER BY created_at DESC
LIMIT 1;
```

---

#### TC-1.5.4: Tự Động Hoàn Thành Phiếu Khi Tất Cả Task Xong [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Auto Status Transition

**Given:**
- Phiếu có status = "in_progress"
- Phiếu có 5 công việc:
  - 4 công việc bắt buộc: completed
  - 1 công việc tùy chọn: pending

**When:**
- Hoàn thành công việc bắt buộc cuối cùng

**Then:**
- Trigger `auto_advance_ticket_status` kiểm tra:
  - Tất cả công việc bắt buộc đã completed ✓
  - Công việc tùy chọn có thể bỏ qua ✓
- Phiếu tự động chuyển status → "completed"
- `completed_at` của phiếu được set = now()
- Comment tự động: "Phiếu tự động hoàn thành khi tất cả công việc bắt buộc đã xong"

---

#### TC-1.5.5: Không Tự Động Hoàn Thành Nếu Còn Task Bắt Buộc [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Validation

**Given:**
- Phiếu có 5 công việc bắt buộc
- 4 công việc: completed
- 1 công việc bắt buộc: blocked

**When:**
- Hoàn thành công việc bắt buộc thứ 4

**Then:**
- Phiếu VẪN ở status = "in_progress"
- KHÔNG tự động chuyển sang "completed"
- Lý do: còn 1 công việc bắt buộc bị blocked

---

#### TC-1.5.6: Kiểm Tra Dependency Indicator UI [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** UI Component

**Given:**
- Phiếu với strict sequence
- Đang ở trang chi tiết phiếu hoặc /my-tasks

**When:**
- Xem danh sách công việc

**Then:**
- Component `TaskDependencyIndicator` hiển thị:
  - Công việc đã hoàn thành: Icon ✓ (xanh)
  - Công việc hiện tại có thể làm: Không có icon
  - Công việc bị khóa: Icon 🔒 (xám) + tooltip
- Tooltip của task bị khóa hiển thị:
  - "Phải hoàn thành công việc trước đó"
  - Tên công việc cần hoàn thành

---

## Phase 3: Warehouse Foundation

### Story 1.6: Warehouse Hierarchy Setup

**Mục tiêu:** Thiết lập hệ thống kho (vật lý, ảo, nhà cung cấp)

#### TC-1.6.1: Kiểm Tra Virtual Warehouses Được Seed [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Data Seeding

**Given:**
- Migration `20251024000002_seed_virtual_warehouses.sql` đã chạy

**When:**
- Truy vấn bảng `virtual_warehouses`

**Then:**
- 4 kho ảo tồn tại:
  - "Kho Bảo Hành" (warranty_stock)
  - "Kho RMA" (rma_staging)
  - "Kho Hư Hỏng" (dead_stock)
  - "Đang Sửa Chữa" (in_service)
- Tất cả có `is_active` = true

**SQL Kiểm Tra:**
```sql
SELECT name, warehouse_type, is_active
FROM virtual_warehouses
ORDER BY name;
```

---

#### TC-1.6.2: Tạo Kho Vật Lý Mới [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Create Operation

**Given:**
- Đăng nhập với vai trò Quản Trị Viên
- Đang ở trang /warehouses

**When:**
1. Nhấp "Thêm Kho Vật Lý"
2. Điền thông tin:
   - Tên: "Kho Trung Tâm Hà Nội"
   - Mã kho: "HN-001"
   - Địa chỉ: "123 Trần Duy Hưng, Cầu Giấy, Hà Nội"
   - Mô tả: "Kho chính tại trung tâm Hà Nội"
3. Nhấp "Lưu"

**Then:**
- Toast thông báo: "Tạo kho vật lý thành công"
- Bản ghi mới trong `physical_warehouses`
- Kho hiển thị trong bảng danh sách
- `is_active` = true mặc định

---

#### TC-1.6.3: Chỉ Admin Có Thể Quản Lý Kho [SEC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Authorization

**Given:**
- Đăng nhập với vai trò Manager

**When:**
- Truy cập /warehouses

**Then:**
- Nút "Thêm Kho" KHÔNG hiển thị
- Nút "Sửa" và "Xóa" KHÔNG hiển thị
- Chỉ xem được danh sách (read-only)

---

### Story 1.7: Physical Product Master Data

**Mục tiêu:** Quản lý sản phẩm vật lý với serial number

#### TC-1.7.1: Đăng Ký Sản Phẩm Vật Lý [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Create Operation

**Given:**
- Đăng nhập với vai trò Manager
- Đang ở trang /dashboard/inventory/products
- Có sản phẩm "iPhone 13 Pro" trong catalog

**When:**
1. Nhấp "Đăng Ký Sản Phẩm"
2. Điền thông tin:
   - Sản phẩm: "iPhone 13 Pro"
   - Serial Number: "SN-IP13P-12345"
   - IMEI: "123456789012345"
   - Ngày mua: "2025-01-15"
   - Nhà cung cấp: "Apple Authorized Store"
   - Trạng thái bảo hành: "Còn bảo hành" (in_warranty)
   - Ngày hết bảo hành: "2026-01-15"
   - Kho hiện tại: "Kho Bảo Hành"
3. Upload ảnh sản phẩm (tùy chọn)
4. Nhấp "Lưu"

**Then:**
- Toast thông báo: "Đăng ký sản phẩm thành công"
- Bản ghi mới trong `physical_products`
- Serial number là unique
- Sản phẩm hiển thị trong bảng inventory
- Ảnh được upload lên Supabase Storage (nếu có)

**SQL Kiểm Tra:**
```sql
SELECT
  serial_number, imei, warranty_status,
  purchase_date, warranty_expiry_date,
  current_warehouse_id
FROM physical_products
WHERE serial_number = 'SN-IP13P-12345';
```

---

#### TC-1.7.2: Validation Serial Number Trùng Lặp [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Validation

**Given:**
- Đã có sản phẩm với serial "SN-IP13P-12345"

**When:**
1. Thử đăng ký sản phẩm mới
2. Nhập serial "SN-IP13P-12345"
3. Nhấp "Lưu"

**Then:**
- Lỗi hiển thị: "Serial number đã tồn tại"
- Không tạo bản ghi mới
- Database constraint `unique(serial_number)` ngăn chặn

---

#### TC-1.7.3: Tự Động Tính Warranty Status [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Business Logic

**Given:**
- Hôm nay là 2025-10-25
- Sản phẩm có `warranty_expiry_date` = 2025-09-01

**When:**
- View sản phẩm trong bảng inventory

**Then:**
- Trường `warranty_status` tự động là "out_of_warranty"
- Badge màu đỏ hiển thị "Hết bảo hành"

---

#### TC-1.7.4: Upload Ảnh Sản Phẩm [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** File Upload

**Given:**
- Đang ở form đăng ký sản phẩm
- Có file ảnh "iphone.jpg" (2MB, JPG format)

**When:**
1. Nhấp "Upload Ảnh"
2. Chọn file "iphone.jpg"
3. Xem preview
4. Nhấp "Lưu"

**Then:**
- Ảnh được upload lên bucket `product_images`
- Filename được sanitize (bỏ dấu tiếng Việt)
- URL ảnh được lưu trong `physical_products.photo_url`
- Ảnh hiển thị trong bảng inventory

---

## Phase 4: Warehouse Operations

### Story 1.8: Serial Verification and Stock Movements

**Mục tiêu:** Xác minh serial và ghi nhận di chuyển kho

#### TC-1.8.1: Xác Minh Serial Number [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Verification

**Given:**
- Có sản phẩm với serial "SN-IP13P-001" trong database
- Đang ở trang public portal /service-request

**When:**
1. Nhập serial: "SN-IP13P-001"
2. Nhấp "Xác Minh"

**Then:**
- Hiển thị thông tin sản phẩm:
  - Tên: "iPhone 13 Pro 128GB Blue"
  - Trạng thái bảo hành: "Còn bảo hành"
  - Ngày hết bảo hành: "15/01/2026"
  - Icon ✓ (xanh)
- Cho phép tiếp tục tạo yêu cầu

---

#### TC-1.8.2: Serial Không Tồn Tại [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Error Handling

**Given:**
- Serial "SN-INVALID-999" không tồn tại trong database

**When:**
1. Nhập serial: "SN-INVALID-999"
2. Nhấp "Xác Minh"

**Then:**
- Hiển thị lỗi: "Serial number không tồn tại trong hệ thống"
- Gợi ý: "Vui lòng kiểm tra lại hoặc liên hệ trung tâm"
- Icon ✗ (đỏ)
- Không cho phép tiếp tục

---

#### TC-1.8.3: Ghi Nhận Di Chuyển Kho [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Stock Movement

**Given:**
- Đăng nhập với vai trò Manager
- Sản phẩm "SN-IP13P-001" đang ở "Kho Bảo Hành"
- Đang ở trang /dashboard/inventory/stock-levels

**When:**
1. Chọn sản phẩm "SN-IP13P-001"
2. Nhấp "Di Chuyển"
3. Dialog mở ra:
   - Từ kho: "Kho Bảo Hành" (auto-fill)
   - Đến kho: Chọn "Đang Sửa Chữa"
   - Lý do: "Chuyển sang sửa chữa"
   - Ghi chú: "Khách hàng gửi sửa màn hình"
4. Nhấp "Xác nhận"

**Then:**
- Toast thông báo: "Di chuyển kho thành công"
- Bản ghi mới trong `stock_movements`:
  - product_id, from_warehouse, to_warehouse
  - movement_type = 'transfer'
  - moved_by = current_user_id
  - moved_at = now()
- `physical_products.current_warehouse_id` cập nhật = "Đang Sửa Chữa"
- Lịch sử di chuyển hiển thị trong timeline

**SQL Kiểm Tra:**
```sql
-- Kiểm tra warehouse hiện tại
SELECT serial_number, current_warehouse_id
FROM physical_products
WHERE serial_number = 'SN-IP13P-001';

-- Kiểm tra lịch sử
SELECT movement_type, from_warehouse_id, to_warehouse_id, moved_at
FROM stock_movements
WHERE product_id = (
  SELECT id FROM physical_products WHERE serial_number = 'SN-IP13P-001'
)
ORDER BY moved_at DESC;
```

---

#### TC-1.8.4: Tự Động Di Chuyển Khi Phiếu Chuyển Trạng Thái [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Trigger Automation

**Given:**
- Phiếu có product "SN-IP13P-001"
- Sản phẩm đang ở "Kho Bảo Hành"
- Phiếu có status = "pending"

**When:**
- Cập nhật phiếu status → "in_progress"

**Then:**
- Trigger `auto_move_product_on_ticket_event` kích hoạt
- Sản phẩm tự động di chuyển:
  - Từ: "Kho Bảo Hành"
  - Đến: "Đang Sửa Chữa"
- Bản ghi `stock_movements` với:
  - movement_type = 'ticket_start'
  - notes = "Tự động di chuyển khi phiếu {ticket_number} bắt đầu"

**When:**
- Cập nhật phiếu status → "completed"

**Then:**
- Sản phẩm tự động di chuyển:
  - Từ: "Đang Sửa Chữa"
  - Đến: "Kho Bảo Hành" (hoặc kho ban đầu)
- movement_type = 'ticket_complete'

---

### Story 1.9: Warehouse Stock Levels and Low Stock Alerts

**Mục tiêu:** Hiển thị mức tồn kho và cảnh báo tồn kho thấp

#### TC-1.9.1: Xem Mức Tồn Kho Theo Kho [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Materialized View Query

**Given:**
- Có 100 sản phẩm phân bổ trong các kho
- Đăng nhập với vai trò Manager
- Đang ở trang /dashboard/inventory/stock-levels

**When:**
- Trang load

**Then:**
- Hiển thị bảng với các cột:
  - Kho (warehouse_name)
  - Tổng sản phẩm (total_products)
  - Còn bảo hành (in_warranty_count)
  - Hết bảo hành (out_of_warranty_count)
  - Cảnh báo tồn kho thấp (low_stock_count)
- Dữ liệu lấy từ view `v_warehouse_stock_levels`
- Thời gian tải < 200ms

**SQL Kiểm Tra:**
```sql
SELECT * FROM v_warehouse_stock_levels
ORDER BY warehouse_name;
```

---

#### TC-1.9.2: Cảnh Báo Tồn Kho Thấp [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Alert System

**Given:**
- Sản phẩm "iPhone 13 Pro" có `low_stock_threshold` = 10
- Hiện có 9 cái trong "Kho Bảo Hành"

**When:**
- Xem trang stock levels

**Then:**
- Badge cảnh báo màu đỏ hiển thị: "Tồn kho thấp"
- Số lượng hiển thị màu đỏ: "9 / 10"
- Icon ⚠️ xuất hiện
- Alert box ở đầu trang:
  - "Có 1 sản phẩm tồn kho thấp cần nhập hàng"
  - Danh sách sản phẩm cần nhập

---

#### TC-1.9.3: Cập Nhật Threshold Tồn Kho [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Configuration

**Given:**
- Đăng nhập với vai trò Admin
- Sản phẩm "iPhone 13 Pro" có threshold = 10

**When:**
1. Nhấp "Cài Đặt Ngưỡng" trên sản phẩm
2. Nhập threshold mới: 15
3. Chọn kho áp dụng: "Kho Bảo Hành"
4. Nhấp "Lưu"

**Then:**
- Bản ghi mới/cập nhật trong `product_stock_thresholds`
- Cảnh báo tồn kho thấp cập nhật theo threshold mới
- Nếu hiện có 9 cái → cảnh báo xuất hiện (9 < 15)

---

### Story 1.10: RMA Batch Operations

**Mục tiêu:** Quản lý lô trả hàng nhà cung cấp (RMA)

#### TC-1.10.1: Tạo Lô RMA Mới [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Create Operation

**Given:**
- Đăng nhập với vai trò Manager
- Có 5 sản phẩm hư hỏng trong "Kho Hư Hỏng"
- Đang ở trang /dashboard/inventory/rma

**When:**
1. Nhấp "Tạo Lô RMA"
2. Điền thông tin:
   - Nhà cung cấp: "Apple Authorized"
   - Mô tả: "Trả hàng lỗi màn hình tháng 10/2025"
   - Loại RMA: "Warranty Return"
3. Thêm 5 sản phẩm:
   - Scan/nhập serial number
   - Nhập lý do trả hàng
4. Nhấp "Tạo Lô"

**Then:**
- Toast thông báo: "Tạo lô RMA thành công"
- Bản ghi mới trong `rma_batches`:
  - `batch_number` tự động: "RMA-2025-001"
  - `status` = 'draft'
  - `total_items` = 5
- 5 bản ghi trong `rma_batch_items`
- Batch hiển thị trong danh sách

**SQL Kiểm Tra:**
```sql
-- Kiểm tra batch
SELECT batch_number, status, total_items, created_by_id
FROM rma_batches
WHERE batch_number = 'RMA-2025-001';

-- Kiểm tra items
SELECT rbi.product_id, pp.serial_number, rbi.reason
FROM rma_batch_items rbi
JOIN physical_products pp ON pp.id = rbi.product_id
WHERE rbi.batch_id = (
  SELECT id FROM rma_batches WHERE batch_number = 'RMA-2025-001'
);
```

---

#### TC-1.10.2: Gửi Lô RMA Cho Nhà Cung Cấp [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Status Transition

**Given:**
- Có lô RMA "RMA-2025-001" với status = 'draft'
- Lô có 5 items

**When:**
1. Nhấp "Gửi Nhà Cung Cấp"
2. Xác nhận gửi
3. Nhập tracking number (tùy chọn): "TRACK-12345"
4. Xác nhận

**Then:**
- Status chuyển thành 'sent'
- `sent_date` = now()
- `tracking_number` = "TRACK-12345"
- 5 sản phẩm tự động di chuyển sang "Kho RMA"
- Email thông báo gửi cho supplier (nếu có)

---

#### TC-1.10.3: Nhận Hàng Thay Thế Từ Nhà Cung Cấp [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Status Transition

**Given:**
- Lô RMA có status = 'sent'
- Nhà cung cấp gửi lại 5 sản phẩm thay thế

**When:**
1. Nhấp "Nhận Hàng Thay Thế"
2. Scan serial number của 5 sản phẩm mới
3. Xác nhận

**Then:**
- Status chuyển thành 'completed'
- `completed_date` = now()
- 5 sản phẩm cũ vẫn ở "Kho RMA"
- 5 sản phẩm mới được đăng ký vào "Kho Bảo Hành"

---

## Phase 5: Public Portal

### Story 1.11: Public Service Request Portal

**Mục tiêu:** Cổng gửi yêu cầu dịch vụ công khai (không cần đăng nhập)

#### TC-1.11.1: Gửi Yêu Cầu Dịch Vụ [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Public Submission

**Given:**
- Không đăng nhập
- Đang ở trang /service-request
- Có sản phẩm với serial "SN-IP13P-001"

**When:**
**Bước 1: Xác minh bảo hành**
1. Nhập serial: "SN-IP13P-001"
2. Nhấp "Kiểm Tra Bảo Hành"
3. Hệ thống hiển thị: "Còn bảo hành đến 15/01/2026"
4. Nhấp "Tiếp Tục"

**Bước 2: Thông tin khách hàng**
1. Điền form:
   - Tên: "Nguyễn Văn A"
   - Điện thoại: "0901234567"
   - Email: "nguyenvana@example.com"
   - Địa chỉ: "123 Trần Duy Hưng, Hà Nội"
   - Mô tả vấn đề: "Màn hình bị vỡ góc trên bên phải"
   - Phương thức giao nhận: "Gửi máy đến trung tâm"
2. Nhấp "Gửi Yêu Cầu"

**Then:**
- Redirect đến /service-request/success
- Hiển thị tracking token: "SR-XXXXXXXXXXXX"
- Nút "Copy Token"
- Bản ghi mới trong `service_requests`:
  - `tracking_token` = unique 12-char string
  - `status` = 'submitted'
  - `serial_number` = "SN-IP13P-001"
  - `warranty_status` = true
  - Customer info được lưu
- Email xác nhận gửi đến customer (nếu có email)

**SQL Kiểm Tra:**
```sql
SELECT tracking_token, status, customer_name, serial_number, issue_description
FROM service_requests
WHERE tracking_token = 'SR-XXXXXXXXXXXX';
```

---

#### TC-1.11.2: Validation Form Thông Tin [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Client Validation

**Given:**
- Đang ở bước 2 của form

**When:**
1. Để trống "Tên"
2. Nhập phone: "123" (quá ngắn)
3. Nhập email: "invalid-email"
4. Nhấp "Gửi Yêu Cầu"

**Then:**
- Form không submit
- Hiển thị lỗi:
  - "Tên là bắt buộc"
  - "Số điện thoại phải có ít nhất 10 số"
  - "Email không hợp lệ"
- Toast: "Vui lòng kiểm tra lại thông tin"

---

#### TC-1.11.3: Spam Protection - Honeypot [SEC]

**Mức Độ Ưu Tiên:** High
**Loại:** Bot Prevention

**Given:**
- Bot tự động điền form
- Bot điền vào trường hidden "website" (honeypot)

**When:**
- Bot submit form với field "website" có giá trị

**Then:**
- tRPC mutation từ chối request
- Không tạo service request
- Không có thông báo lỗi rõ ràng (silent rejection)
- Log spam attempt

---

#### TC-1.11.4: Rate Limiting - 10 Requests Per Hour [SEC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Rate Limiting

**Given:**
- Cùng IP address đã gửi 10 requests trong 60 phút

**When:**
- Gửi request thứ 11

**Then:**
- HTTP 429 Too Many Requests
- Thông báo: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 giờ."
- Request không được tạo

---

### Story 1.12: Service Request Tracking Page

**Mục tiêu:** Theo dõi yêu cầu dịch vụ qua tracking token

#### TC-1.12.1: Theo Dõi Yêu Cầu Bằng Token [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Public Query

**Given:**
- Có yêu cầu với token "SR-ABC123XYZ789"
- Không đăng nhập
- Đang ở trang /service-request/track

**When:**
1. Nhập token: "SR-ABC123XYZ789"
2. Nhấp "Theo Dõi"

**Then:**
- Hiển thị thông tin yêu cầu:
  - Số yêu cầu: "SR-ABC123XYZ789"
  - Trạng thái: "Đã tiếp nhận" (badge màu xanh)
  - Timeline: 4 giai đoạn (Submitted, Received, Processing, Completed)
  - Giai đoạn hiện tại được highlight
- Thông tin khách hàng (đã mask):
  - Tên: "Nguyễn Văn A" (hiển thị đầy đủ)
  - Email: "ngu***@example.com"
  - Phone: "****4567"
- Thông tin sản phẩm:
  - Serial: "SN-IP13P-001"
  - Trạng thái bảo hành: "Còn bảo hành"
- Thông tin phiếu (nếu đã convert):
  - Số phiếu: "SV-2025-001"
  - Link: "/tickets/SV-2025-001" (nếu logged in)
- Message giai đoạn hiện tại:
  - "Yêu cầu của bạn đã được tiếp nhận và đang chờ xử lý"
- Timestamp: "Cập nhật lần cuối: 25/10/2025 14:30"

---

#### TC-1.12.2: Token Không Hợp Lệ [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Error Handling

**Given:**
- Token "SR-INVALID-000" không tồn tại

**When:**
1. Nhập token: "SR-INVALID-000"
2. Nhấp "Theo Dõi"

**Then:**
- Hiển thị lỗi: "Không tìm thấy yêu cầu với mã này"
- Gợi ý: "Vui lòng kiểm tra lại mã theo dõi"
- Icon ✗ (đỏ)

---

#### TC-1.12.3: Auto-Refresh Mỗi 30 Giây [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Real-time Updates

**Given:**
- Đang xem trang tracking
- Tab đang active

**When:**
- Chờ 30 giây

**Then:**
- TanStack Query tự động refetch
- Trạng thái cập nhật nếu có thay đổi
- Timestamp "Cập nhật lần cuối" thay đổi
- Không có full page reload

---

#### TC-1.12.4: URL Parameter Support [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** URL Routing

**Given:**
- URL: /service-request/track?token=SR-ABC123XYZ789

**When:**
- Mở URL

**Then:**
- Token tự động điền vào input field
- Tự động query và hiển thị kết quả
- Tiện cho share link tracking

---

### Story 1.13: Staff Request Management and Ticket Conversion

**Mục tiêu:** Nhân viên quản lý yêu cầu và chuyển thành phiếu

#### TC-1.13.1: Xem Danh Sách Yêu Cầu Chờ Xử Lý [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** List View

**Given:**
- Đăng nhập với vai trò Lễ Tân
- Có 10 yêu cầu với status = 'submitted'
- Đang ở trang /dashboard/service-requests

**When:**
- Trang load

**Then:**
- Hiển thị statistics cards:
  - Tổng yêu cầu: 10
  - Mới: 5
  - Đã tiếp nhận: 3
  - Đang xử lý: 2
  - Hoàn thành: 0
- Bảng danh sách yêu cầu với các cột:
  - Mã tracking
  - Tên khách hàng
  - Điện thoại
  - Serial number
  - Trạng thái
  - Ngày gửi
  - Actions (Xem, Chuyển, Từ chối)
- Filter bar:
  - Trạng thái (dropdown)
  - Tìm kiếm (theo tên, phone, serial)

---

#### TC-1.13.2: Xem Chi Tiết Yêu Cầu [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Detail View

**Given:**
- Có yêu cầu "SR-ABC123"
- Đăng nhập với vai trò Reception

**When:**
1. Nhấp nút "Xem" trên yêu cầu
2. Modal mở ra

**Then:**
- Hiển thị đầy đủ thông tin:
  - Tracking token
  - Thông tin khách hàng (KHÔNG mask - full access)
  - Serial number + warranty status
  - Mô tả vấn đề
  - Phương thức giao nhận
  - Ngày gửi
  - Timeline trạng thái
- Nút actions:
  - "Chuyển Thành Phiếu"
  - "Cập Nhật Trạng Thái"
  - "Từ Chối"
  - "Đóng"

---

#### TC-1.13.3: Chuyển Yêu Cầu Thành Phiếu Dịch Vụ [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Conversion Operation

**Given:**
- Yêu cầu "SR-ABC123" với:
  - customer_name: "Nguyễn Văn A"
  - customer_phone: "0901234567"
  - serial_number: "SN-IP13P-001"
- Đăng nhập với vai trò Reception

**When:**
1. Nhấp "Chuyển Thành Phiếu"
2. Modal conversion mở ra với:
   - Pre-filled customer info (auto-detect or create new)
   - Pre-filled product (from serial)
   - Pre-filled issue description
3. Bổ sung thông tin:
   - Chọn mẫu công việc: "Sửa Chữa Màn Hình"
   - Giao cho: Kỹ Thuật Viên 1
   - Ưu tiên: "Bình thường"
4. Nhấp "Tạo Phiếu"

**Then:**
- Toast thông báo: "Chuyển đổi thành công! Phiếu SV-2025-XXX đã được tạo"
- Phiếu mới được tạo:
  - Ticket number: SV-2025-XXX (auto-generated)
  - Customer: Nguyễn Văn A (existing or newly created)
  - Product: iPhone 13 Pro (from serial)
  - Issue: From request description
  - Template: "Sửa Chữa Màn Hình"
  - Assigned to: Kỹ Thuật Viên 1
  - Status: "pending"
- Service request cập nhật:
  - `status` = 'converted'
  - `converted_to_ticket_id` = new ticket id
  - `converted_at` = now()
  - `converted_by_id` = current user id
- Công việc tự động tạo (từ template)
- Email thông báo gửi cho customer: "Yêu cầu đã được chuyển thành phiếu SV-2025-XXX"

**SQL Kiểm Tra:**
```sql
-- Kiểm tra request đã convert
SELECT status, converted_to_ticket_id, converted_at
FROM service_requests
WHERE tracking_token = 'SR-ABC123';

-- Kiểm tra ticket mới
SELECT ticket_number, customer_id, product_id, status
FROM service_tickets
WHERE id = (
  SELECT converted_to_ticket_id FROM service_requests
  WHERE tracking_token = 'SR-ABC123'
);
```

---

#### TC-1.13.4: Tự Động Tạo Khách Hàng Mới Nếu Chưa Tồn Tại [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Auto Customer Creation

**Given:**
- Yêu cầu từ khách hàng mới (phone chưa có trong database)
- customer_phone: "0999999999"

**When:**
- Chuyển đổi request thành ticket

**Then:**
- Tự động tạo customer mới:
  - name từ request.customer_name
  - phone từ request.customer_phone
  - email từ request.customer_email
  - address từ request.customer_address
- Ticket được tạo với customer mới
- Không cần nhập thông tin customer thủ công

---

#### TC-1.13.5: Từ Chối Yêu Cầu Với Lý Do [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Rejection

**Given:**
- Yêu cầu "SR-ABC123"
- Đăng nhập với vai trò Manager

**When:**
1. Nhấp "Từ Chối"
2. Dialog mở ra
3. Chọn lý do:
   - "Sản phẩm hết bảo hành"
   - "Không hỗ trợ sản phẩm này"
   - "Thông tin không đầy đủ"
   - "Khác" (nhập lý do tùy chỉnh)
4. Nhập lý do: "Sản phẩm không nằm trong chính sách bảo hành"
5. Nhấp "Xác Nhận Từ Chối"

**Then:**
- status = 'cancelled'
- `cancellation_reason` được lưu
- `reviewed_by_id` = current user ID
- `reviewed_at` = now()
- Email thông báo gửi cho customer với lý do từ chối

---

#### TC-1.13.6: Badge Số Lượng Yêu Cầu Chờ Xử Lý [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** UI Notification

**Given:**
- Có 7 yêu cầu chưa xử lý (status = submitted)
- Đăng nhập với vai trò Reception

**When:**
- Xem sidebar navigation

**Then:**
- Link "Yêu cầu dịch vụ" hiển thị badge số: "7"
- Badge màu đỏ nổi bật
- Auto-refresh mỗi 30 giây
- Badge biến mất khi count = 0

---

### Story 1.14: Customer Delivery Confirmation Workflow

**Mục tiêu:** Xác nhận giao hàng cho khách

#### TC-1.14.1: Xác Nhận Giao Hàng [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Delivery Confirmation

**Given:**
- Phiếu "SV-2025-001" có status = "completed"
- Phiếu chưa được xác nhận giao hàng
- Đăng nhập với vai trò Manager

**When:**
1. Mở trang chi tiết phiếu
2. Nhấp "Xác Nhận Giao Hàng"
3. Modal mở ra:
   - Phương thức: "Khách đến lấy" / "Giao hàng tận nơi"
   - Người nhận: "Nguyễn Văn A"
   - Chữ ký: Canvas để khách ký
   - Ghi chú: "Khách hài lòng với dịch vụ"
4. Khách ký trên canvas
5. Nhấp "Xác Nhận"

**Then:**
- Toast thông báo: "Xác nhận giao hàng thành công"
- Database updates:
  - `delivery_confirmed` = true
  - `delivery_confirmed_at` = now()
  - `delivery_confirmed_by_id` = current user
  - `delivery_method` = "pickup" / "delivery"
  - `delivery_recipient_name` = "Nguyễn Văn A"
  - `delivery_signature_url` = URL to signature image
  - `delivery_notes` = "Khách hài lòng..."
- Chữ ký được upload lên Supabase Storage bucket `signatures`
- Email xác nhận giao hàng gửi cho customer
- Phiếu hiển thị section "Thông tin giao hàng" với:
  - Ngày giao: 25/10/2025 15:30
  - Người xác nhận: Manager Test
  - Phương thức: Khách đến lấy
  - Người nhận: Nguyễn Văn A
  - Chữ ký (ảnh)
  - Ghi chú

**SQL Kiểm Tra:**
```sql
SELECT
  delivery_confirmed, delivery_confirmed_at,
  delivery_method, delivery_recipient_name,
  delivery_signature_url, delivery_notes
FROM service_tickets
WHERE ticket_number = 'SV-2025-001';
```

---

#### TC-1.14.2: Danh Sách Phiếu Chờ Giao Hàng [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** List View

**Given:**
- Có 5 phiếu completed chưa xác nhận giao hàng
- Đăng nhập với vai trò Manager
- Đang ở trang /dashboard/deliveries

**When:**
- Trang load

**Then:**
- Hiển thị bảng 5 phiếu với các cột:
  - Số phiếu
  - Khách hàng
  - Sản phẩm
  - Ngày hoàn thành
  - Actions (Xác nhận giao hàng)
- Badge số lượng ở sidebar: "5"
- Auto-refresh mỗi 30 giây

---

#### TC-1.14.3: Signature Canvas - Vẽ Bằng Chuột [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Signature Capture

**Given:**
- Modal xác nhận giao hàng đang mở
- Canvas signature component hiển thị

**When:**
1. Click và kéo chuột trên canvas
2. Vẽ chữ ký "Nguyễn Văn A"
3. Release chuột

**Then:**
- Đường nét được vẽ lên canvas
- Nút "Xóa chữ ký" khả dụng
- Preview chữ ký hiển thị
- Canvas convert to PNG khi submit

---

#### TC-1.14.4: Signature Canvas - Vẽ Bằng Touch [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Touch Support

**Given:**
- Sử dụng thiết bị touch (tablet, smartphone)
- Modal xác nhận giao hàng đang mở

**When:**
- Touch và kéo ngón tay trên canvas

**Then:**
- Đường nét được vẽ smooth
- Không có scroll khi vẽ
- Hỗ trợ multi-touch (prevent default)

---

#### TC-1.14.5: Validation - Bắt Buộc Chữ Ký [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Validation

**Given:**
- Modal xác nhận giao hàng đang mở
- Canvas trống (chưa có chữ ký)

**When:**
- Nhấp "Xác Nhận" mà chưa ký

**Then:**
- Hiển thị lỗi: "Vui lòng ký xác nhận trước khi gửi"
- Modal không đóng
- Không cập nhật database

---

## Phase 6: Enhanced Features

### Story 1.15: Email Notification System

**Mục tiêu:** Hệ thống thông báo email tự động

#### TC-1.15.1: Email Khi Gửi Yêu Cầu Dịch Vụ [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Email Trigger

**Given:**
- Khách hàng gửi yêu cầu mới
- Email: "customer@example.com"

**When:**
- Request được tạo thành công

**Then:**
- Email được queue trong `email_notifications`:
  - `email_type` = 'request_submitted'
  - `recipient_email` = "customer@example.com"
  - `status` = 'pending'
- Email content bao gồm:
  - Subject: "Yêu cầu dịch vụ của bạn đã được gửi"
  - Tracking token: SR-ABC123
  - Link theo dõi: /service-request/track?token=SR-ABC123
  - Thông tin yêu cầu
  - Unsubscribe link
- Email được gửi (hoặc log nếu dev mode)
- Status cập nhật: 'sent' hoặc 'failed'

**SQL Kiểm Tra:**
```sql
SELECT email_type, recipient_email, status, sent_at
FROM email_notifications
WHERE request_id = 'request_id_here'
AND email_type = 'request_submitted';
```

---

#### TC-1.15.2: Email Khi Chuyển Đổi Thành Phiếu [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Email Trigger

**Given:**
- Yêu cầu được chuyển thành phiếu "SV-2025-001"

**When:**
- Conversion thành công

**Then:**
- Email type = 'ticket_created'
- Content:
  - Subject: "Yêu cầu của bạn đã được chuyển thành phiếu dịch vụ"
  - Số phiếu: SV-2025-001
  - Kỹ thuật viên được giao
  - Thời gian ước tính
  - Unsubscribe link

---

#### TC-1.15.3: Email Khi Phiếu Hoàn Thành [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Email Trigger

**Given:**
- Phiếu "SV-2025-001" chuyển status → "completed"

**When:**
- Status update thành công

**Then:**
- Email type = 'service_completed'
- Content:
  - Subject: "Dịch vụ của bạn đã hoàn thành"
  - Số phiếu
  - Thông tin để đến lấy máy
  - Giờ làm việc trung tâm

---

#### TC-1.15.4: Email Khi Xác Nhận Giao Hàng [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Email Trigger

**Given:**
- Delivery được xác nhận

**When:**
- Confirmation thành công

**Then:**
- Email type = 'delivery_confirmed'
- Content:
  - Subject: "Xác nhận giao hàng thành công"
  - Thông tin giao hàng
  - Lời cảm ơn

---

#### TC-1.15.5: Unsubscribe Functionality [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Email Preference

**Given:**
- Customer nhận email
- Email có link: /unsubscribe?email=customer@example.com&type=service_completed

**When:**
1. Click link unsubscribe
2. Trang /unsubscribe mở ra
3. Checkbox để chọn loại email muốn hủy:
   - ☑ Email khi yêu cầu được tiếp nhận
   - ☑ Email khi dịch vụ hoàn thành
   - ☐ Email khi giao hàng
4. Nhấp "Cập Nhật Cài Đặt"

**Then:**
- Customer.email_preferences được cập nhật:
  ```json
  {
    "request_received": false,
    "service_completed": false,
    "delivery_confirmed": true
  }
  ```
- Thông báo: "Cài đặt email của bạn đã được cập nhật"
- Các email loại 'request_received' và 'service_completed' sẽ KHÔNG gửi cho customer này
- Email 'delivery_confirmed' vẫn gửi bình thường

---

#### TC-1.15.6: Admin Xem Log Email [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Admin Dashboard

**Given:**
- Đăng nhập với vai trò Admin
- Có 100 email đã gửi
- Đang ở trang /dashboard/notifications

**When:**
- Trang load

**Then:**
- Statistics cards:
  - Tổng email: 100
  - Đã gửi: 85
  - Thất bại: 10
  - Đang chờ: 5
- Bảng email log với columns:
  - Loại email (badge màu)
  - Người nhận
  - Trạng thái (sent/failed/pending)
  - Ngày gửi
  - Actions (Xem, Retry)
- Filters:
  - Loại email (dropdown)
  - Trạng thái (dropdown)
  - Tìm kiếm email
- Pagination: 50/page

---

#### TC-1.15.7: Admin Retry Failed Email [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Retry Mechanism

**Given:**
- Email có status = 'failed'
- Error message: "SMTP connection timeout"

**When:**
1. Admin nhấp "Thử Lại"
2. Xác nhận

**Then:**
- Email được queue lại
- Status → 'pending'
- `retry_count` tăng lên
- Email được gửi lại
- Nếu thành công: status → 'sent'
- Nếu thất bại: status → 'failed', retry_count++
- Max retry: 3 lần

---

#### TC-1.15.8: Rate Limiting - 100 Emails Per 24h Per Customer [SEC]

**Mức Độ Ưu Tiên:** High
**Loại:** Rate Limiting

**Given:**
- Customer "customer@example.com" đã nhận 100 emails trong 24h

**When:**
- Hệ thống cố gắng gửi email thứ 101

**Then:**
- Email KHÔNG được queue
- Log warning: "Rate limit exceeded for customer@example.com"
- Admin nhận thông báo (nếu có monitoring)

---

### Story 1.16: Manager Task Progress Dashboard

**Mục tiêu:** Bảng điều khiển tiến độ công việc cho Quản Lý

#### TC-1.16.1: Xem Metrics Tổng Quan [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Dashboard View

**Given:**
- Có 20 phiếu active
- 50 công việc đang xử lý
- 5 công việc bị chặn
- Đăng nhập với vai trò Manager
- Đang ở trang /dashboard/task-progress

**When:**
- Trang load

**Then:**
- 4 Metrics cards hiển thị:
  1. **Phiếu Hoạt Động**: 20
     - Icon: 📋
  2. **Công Việc Đang Xử Lý**: 50
     - Subtitle: "(12 chờ xử lý)"
     - Icon: ⏳
  3. **Công Việc Bị Chặn**: 5
     - Màu đỏ nếu > 0
     - Icon: 🚫
  4. **Thời Gian Hoàn Thành TB**: 45 phút
     - Subtitle: "(120 công việc đã xong)"
     - Icon: ⏱️
- Dữ liệu từ view `v_task_progress_summary`
- Auto-refresh mỗi 30 giây

---

#### TC-1.16.2: Xem Danh Sách Phiếu Có Task Bị Chặn [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Alert List

**Given:**
- Phiếu "SV-2025-001" có 1 task blocked
- Phiếu "SV-2025-005" có 2 tasks blocked
- Các phiếu khác không có task blocked

**When:**
- Xem trang dashboard

**Then:**
- Section "Cảnh Báo Công Việc Bị Chặn":
  - Nếu có blocked tasks:
    - Alert màu đỏ
    - Tiêu đề: "⚠️ Có 2 phiếu với công việc bị chặn"
    - Danh sách:
      - SV-2025-001 (1 công việc bị chặn)
      - SV-2025-005 (2 công việc bị chặn)
    - Link đến từng phiếu
  - Nếu không có:
    - Alert màu xanh
    - "✓ Không có công việc bị chặn"

---

#### TC-1.16.3: Xem Bảng Khối Lượng Công Việc Kỹ Thuật Viên [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Workload Table

**Given:**
- Kỹ Thuật Viên 1:
  - Tổng tasks: 25
  - Đang xử lý: 5
  - Chờ xử lý: 10
  - Hoàn thành: 9
  - Bị chặn: 1
- Kỹ Thuật Viên 2:
  - Tổng tasks: 15
  - Đang xử lý: 3
  - Chờ xử lý: 5
  - Hoàn thành: 7
  - Bị chặn: 0

**When:**
- Xem section "Khối Lượng Công Việc Kỹ Thuật Viên"

**Then:**
- Bảng hiển thị 2 hàng:

| Kỹ Thuật Viên | Đang Xử Lý | Chờ Xử Lý | Hoàn Thành | Bị Chặn | Tỷ Lệ Hoàn Thành |
|---------------|------------|-----------|------------|---------|------------------|
| Kỹ Thuật Viên 1 | 5 (badge) | 10 | 9 | 1 (đỏ) | 36% (9/25) |
| Kỹ Thuật Viên 2 | 3 (badge) | 5 | 7 | 0 | 47% (7/15) |

- Sắp xếp theo tổng tasks (nhiều nhất trước)
- Badge màu theo trạng thái
- Tỷ lệ hoàn thành = (completed / total) * 100%

---

#### TC-1.16.4: Filter Theo Kỹ Thuật Viên [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Filtering

**Given:**
- Dashboard đang hiển thị tất cả kỹ thuật viên

**When:**
1. Select dropdown "Kỹ Thuật Viên"
2. Chọn "Kỹ Thuật Viên 1"

**Then:**
- Metrics cards cập nhật:
  - Chỉ hiển thị số liệu của KTV 1
- Bảng workload:
  - Chỉ hiển thị 1 hàng (KTV 1)
- URL update: ?technician=tech1_id

---

#### TC-1.16.5: Auto-Refresh Dashboard [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Real-time Updates

**Given:**
- Dashboard đang mở
- Tab active

**When:**
- Chờ 30 giây

**Then:**
- TanStack Query refetch:
  - Task progress summary
  - Blocked tasks
  - Technician workload
- Metrics cards cập nhật
- Bảng workload cập nhật
- Không có full page reload

---

### Story 1.17: Dynamic Template Switching

**Mục tiêu:** Chuyển đổi mẫu công việc giữa dịch vụ

#### TC-1.17.1: Chuyển Đổi Mẫu Giữa Dịch Vụ [FUNC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Template Switch

**Given:**
- Phiếu "SV-2025-001":
  - Template hiện tại: "Sửa Màn Hình" (5 tasks)
  - Tasks: 2 completed, 1 in_progress, 2 pending
  - Status: "in_progress"
- Đăng nhập với vai trò Kỹ Thuật Viên
- Đang ở trang chi tiết phiếu

**When:**
1. Nhấp "Đổi Mẫu"
2. Modal mở ra
3. Chọn mẫu mới: "Sửa Chữa Bo Mạch" (7 tasks)
4. Preview mẫu mới:
   - 7 tasks được liệt kê
   - Cảnh báo: "2 công việc đã hoàn thành sẽ được giữ lại"
   - "3 công việc mới sẽ được thêm vào"
5. Nhập lý do (min 10 chars):
   "Chẩn đoán phát hiện lỗi bo mạch thay vì màn hình. Cần thay đổi quy trình sửa chữa."
6. Nhấp "Xác Nhận Đổi Mẫu"

**Then:**
- Toast thông báo: "Đã chuyển template thành công! 2 công việc giữ lại, 3 công việc mới được thêm."
- Database updates:
  - `service_tickets.template_id` = new template id
  - `service_ticket_tasks`:
    - 2 completed tasks: GIỮ NGUYÊN
    - 1 in_progress task: GIỮ NGUYÊN
    - 2 pending tasks: BỊ XÓA
    - 3 new tasks: ĐƯỢC THÊM (status = pending)
  - Tổng tasks sau switch: 6 (3 giữ + 3 mới)
  - Sequence order được tái đánh số: 1-6
- Audit trail trong `ticket_template_changes`:
  - old_template_id, new_template_id
  - reason = "Chẩn đoán phát hiện..."
  - tasks_preserved_count = 3
  - tasks_added_count = 3
  - changed_by_id = technician id
  - changed_at = now()
- Trang reload/refresh với danh sách tasks mới

**SQL Kiểm Tra:**
```sql
-- Kiểm tra template đã đổi
SELECT template_id FROM service_tickets WHERE ticket_number = 'SV-2025-001';

-- Kiểm tra tasks sau switch
SELECT sequence_order, task_type_id, status
FROM service_ticket_tasks
WHERE ticket_id = (SELECT id FROM service_tickets WHERE ticket_number = 'SV-2025-001')
ORDER BY sequence_order;

-- Kiểm tra audit trail
SELECT old_template_id, new_template_id, reason, tasks_preserved_count, tasks_added_count
FROM ticket_template_changes
WHERE ticket_id = (SELECT id FROM service_tickets WHERE ticket_number = 'SV-2025-001');
```

---

#### TC-1.17.2: Validation - Không Đổi Template Phiếu Hoàn Thành [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Validation

**Given:**
- Phiếu có status = "completed"

**When:**
- Thử nhấp "Đổi Mẫu"

**Then:**
- Nút "Đổi Mẫu" KHÔNG hiển thị
- Hoặc nếu gọi trực tiếp tRPC mutation:
  - TRPCError: "Không thể đổi mẫu cho phiếu đã hoàn thành"

---

#### TC-1.17.3: Validation - Không Đổi Nếu Tất Cả Tasks Đã Xong [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Validation

**Given:**
- Phiếu có status = "in_progress"
- Tất cả tasks có status = "completed"

**When:**
- Thử đổi mẫu

**Then:**
- Lỗi: "Tất cả công việc đã hoàn thành. Không thể đổi mẫu."
- Gợi ý: "Vui lòng hoàn thành phiếu thay vì đổi mẫu."

---

#### TC-1.17.4: Smart Task Merging - Không Trùng Lặp [FUNC]

**Mức Độ Ưu Tiên:** High
**Loại:** Business Logic

**Given:**
- Mẫu cũ có tasks: A, B, C, D, E
- Tasks A, B: completed
- Mẫu mới có tasks: A, B, F, G, H

**When:**
- Switch template

**Then:**
- Tasks được giữ:
  - A (completed) - giữ lại
  - B (completed) - giữ lại
- Tasks mới được thêm:
  - F, G, H (KHÔNG thêm A, B vì đã tồn tại)
- Tổng tasks sau switch: 5 (A, B, F, G, H)
- Logic: Chỉ thêm tasks có `task_type_id` chưa tồn tại

---

#### TC-1.17.5: Xem Lịch Sử Đổi Template [FUNC]

**Mức Độ Ưu Tiên:** Medium
**Loại:** Audit Trail View

**Given:**
- Phiếu đã đổi template 2 lần
- Đang ở trang chi tiết phiếu

**When:**
- Scroll xuống section "Lịch Sử Đổi Mẫu"

**Then:**
- Timeline hiển thị 2 lần đổi:

**Lần 1:**
- Thời gian: 25/10/2025 10:00
- Từ: "Sửa Màn Hình" → "Sửa Bo Mạch"
- Lý do: "Chẩn đoán phát hiện lỗi bo mạch..."
- Người đổi: Kỹ Thuật Viên 1
- Công việc: 2 giữ lại, 3 thêm mới

**Lần 2:**
- Thời gian: 25/10/2025 14:00
- Từ: "Sửa Bo Mạch" → "Thay Linh Kiện"
- Lý do: "Bo mạch không sửa được, cần thay hoàn toàn"
- Người đổi: Kỹ Thuật Viên 1
- Công việc: 3 giữ lại, 2 thêm mới

---

#### TC-1.17.6: Permission - Chỉ Technician/Manager/Admin [SEC]

**Mức Độ Ưu Tiên:** Critical
**Loại:** Authorization

**Given:**
- Đăng nhập với vai trò Reception

**When:**
- Xem trang chi tiết phiếu

**Then:**
- Nút "Đổi Mẫu" KHÔNG hiển thị
- Nếu gọi trực tiếp tRPC:
  - TRPCError: "Không có quyền thực hiện thao tác này"

---

## Ma Trận Truy Xuất

### Bảng Ánh Xạ Test Cases → Acceptance Criteria

| Story | Test Case ID | Acceptance Criteria | Priority |
|-------|-------------|---------------------|----------|
| 1.1 | TC-1.1.1, TC-1.1.2, TC-1.1.3, TC-1.1.4 | AC1-AC8 (Foundation setup) | Critical |
| 1.2 | TC-1.2.1, TC-1.2.2, TC-1.2.3, TC-1.2.4, TC-1.2.5, TC-1.2.6 | AC1-AC7 (Template CRUD) | Critical |
| 1.3 | TC-1.3.1, TC-1.3.2, TC-1.3.3 | AC1-AC5 (Auto task generation) | Critical |
| 1.4 | TC-1.4.1 thru TC-1.4.8 | AC1-AC8 (Task execution UI) | Critical |
| 1.5 | TC-1.5.1 thru TC-1.5.6 | AC1-AC6 (Dependencies & automation) | Critical |
| 1.6 | TC-1.6.1, TC-1.6.2, TC-1.6.3 | AC1-AC4 (Warehouse setup) | High |
| 1.7 | TC-1.7.1 thru TC-1.7.4 | AC1-AC5 (Product master data) | High |
| 1.8 | TC-1.8.1 thru TC-1.8.4 | AC1-AC6 (Serial & stock movements) | Critical |
| 1.9 | TC-1.9.1, TC-1.9.2, TC-1.9.3 | AC1-AC4 (Stock levels & alerts) | High |
| 1.10 | TC-1.10.1, TC-1.10.2, TC-1.10.3 | AC1-AC5 (RMA operations) | High |
| 1.11 | TC-1.11.1 thru TC-1.11.4 | AC1-AC12 (Public portal) | Critical |
| 1.12 | TC-1.12.1 thru TC-1.12.4 | AC1-AC11 (Request tracking) | Critical |
| 1.13 | TC-1.13.1 thru TC-1.13.6 | AC1-AC10 (Staff request mgmt) | Critical |
| 1.14 | TC-1.14.1 thru TC-1.14.5 | AC1-AC7 (Delivery confirmation) | High |
| 1.15 | TC-1.15.1 thru TC-1.15.8 | AC1-AC9 (Email notifications) | Critical |
| 1.16 | TC-1.16.1 thru TC-1.16.5 | AC1-AC8 (Manager dashboard) | High |
| 1.17 | TC-1.17.1 thru TC-1.17.6 | AC1-AC10 (Dynamic template switch) | Critical |

### Độ Bao Phủ Theo Loại Kiểm Thử

| Loại | Số Lượng Test Cases | Phần Trăm |
|------|---------------------|-----------|
| [FUNC] - Functional | 75 | 68% |
| [SEC] - Security | 15 | 14% |
| [INT] - Integration | 8 | 7% |
| [PERF] - Performance | 6 | 5% |
| [E2E] - End-to-End | 6 | 5% |
| **Tổng** | **110** | **100%** |

### Độ Bao Phủ Theo Mức Độ Ưu Tiên

| Mức Độ | Số Lượng | Phần Trăm |
|--------|----------|-----------|
| Critical | 45 | 41% |
| High | 38 | 35% |
| Medium | 27 | 24% |
| **Tổng** | **110** | **100%** |

---

## Ghi Chú Thực Hiện

### Môi Trường Kiểm Thử

```bash
# Setup môi trường
pnpx supabase start
pnpm dev

# Seed dữ liệu test
psql -h localhost -p 54322 -U postgres -f test-data.sql

# Chạy migrations
pnpx supabase db reset
```

### Công Cụ Hỗ Trợ

- **Supabase Studio**: http://localhost:54323 - Kiểm tra database
- **tRPC Panel**: /api/panel - Test API endpoints
- **Chrome DevTools**: Network tab - Monitor requests
- **React DevTools**: Component inspection

### Checklist Trước Khi Kiểm Thử

- [ ] Database migrations đã apply
- [ ] Seed data đã load
- [ ] Dev server đang chạy
- [ ] Test users đã tạo
- [ ] Supabase services đang hoạt động

---

**Tài Liệu Này Bao Gồm:**
- 110 test cases chi tiết
- Given-When-Then format
- SQL queries kiểm tra
- Validation scenarios
- Security test cases
- Integration test cases
- End-to-end workflows

**Sẵn Sàng Cho:**
- Manual testing
- Test automation
- Regression testing
- User acceptance testing (UAT)

---

**Kết Thúc Tài Liệu**
