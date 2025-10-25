# Checklist Kiểm Thử Toàn Vẹn Dữ Liệu - EPIC-01 Giai Đoạn 2

**Ưu Tiên:** P0 - QUAN TRỌNG
**Tiêu Chí Pass:** Tỷ lệ pass 100% (TẤT CẢ 9 tests phải pass)
**Thời Gian Ước Tính:** 1-2 giờ
**Tổng Số Tests:** 9
**Phạm Vi:** Xác minh constraints database, triggers, và tính nhất quán dữ liệu

**⚠️ QUAN TRỌNG:** Lỗi toàn vẹn dữ liệu có thể dẫn đến hỏng dữ liệu. TẤT CẢ tests phải pass.

---

## Thiết Lập Trước Kiểm Thử

**Môi Trường Kiểm Thử:**
- [ ] Ứng dụng đang chạy: http://localhost:3025
- [ ] Supabase Studio truy cập được: http://localhost:54323
- [ ] SQL client kết nối đến database
- [ ] Backup database đã tạo (trong trường hợp hỏng trong quá trình kiểm thử)

**Dữ Liệu Test:**
- [ ] Database seed mới đã áp dụng
- [ ] Dữ liệu test sẵn sàng cho xác thực constraint

---

## Danh Mục Test 1: Database Constraints

**Tests:** 4
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** Tất cả 4 tests phải pass

### INT-1.1: Foreign Key Constraints
**Mục Tiêu:** Xác minh quan hệ foreign key ngăn chặn bản ghi mồ côi

**Các Bước Kiểm Thử:**
1. Mở Supabase Studio → SQL Editor
2. Kiểm tra foreign key constraints với dữ liệu không hợp lệ:

```sql
-- Test 1: Thử tạo phiếu dịch vụ với khách hàng không tồn tại
BEGIN;
INSERT INTO service_tickets (customer_id, issue_description, service_type)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 'warranty');
-- Mong đợi: Lỗi vi phạm foreign key
ROLLBACK;

-- Test 2: Thử tạo công việc với phiếu dịch vụ không tồn tại
BEGIN;
INSERT INTO service_ticket_tasks (service_ticket_id, title, task_order)
VALUES ('00000000-0000-0000-0000-000000000000', 'Test Task', 1);
-- Mong đợi: Lỗi vi phạm foreign key
ROLLBACK;

-- Test 3: Thử xóa khách hàng có phiếu dịch vụ hiện có
BEGIN;
-- Đầu tiên, tạo khách hàng test với phiếu dịch vụ
INSERT INTO customers (full_name, phone, email)
VALUES ('Test Delete Customer', '0000000001', 'delete.test@example.com')
RETURNING id;
-- Ghi nhận ID khách hàng

INSERT INTO service_tickets (customer_id, issue_description, service_type)
VALUES ('[CUSTOMER_ID]', 'Test ticket', 'warranty');

-- Bây giờ thử xóa khách hàng (nên thất bại do FK constraint)
DELETE FROM customers WHERE id = '[CUSTOMER_ID]';
-- Mong đợi: Lỗi vi phạm foreign key
ROLLBACK;

-- Test 4: Xác minh ON DELETE CASCADE hoạt động như dự định
BEGIN;
-- Tạo phiếu dịch vụ với công việc
INSERT INTO service_tickets (customer_id, issue_description, service_type)
VALUES ((SELECT id FROM customers LIMIT 1), 'Test cascade', 'warranty')
RETURNING id;
-- Ghi nhận ticket ID

INSERT INTO service_ticket_tasks (service_ticket_id, title, task_order)
VALUES ('[TICKET_ID]', 'Task 1', 1),
       ('[TICKET_ID]', 'Task 2', 2);

-- Xóa phiếu dịch vụ (công việc nên cascade delete)
DELETE FROM service_tickets WHERE id = '[TICKET_ID]';

-- Xác minh công việc đã xóa
SELECT COUNT(*) FROM service_ticket_tasks WHERE service_ticket_id = '[TICKET_ID]';
-- Mong đợi: 0
ROLLBACK;
```

**Kết Quả Mong Đợi:**
- ✅ Test 1: Lỗi vi phạm FK ngăn chặn phiếu dịch vụ mồ côi
- ✅ Test 2: Lỗi vi phạm FK ngăn chặn công việc mồ côi
- ✅ Test 3: Vi phạm FK ngăn chặn xóa khách hàng có phiếu dịch vụ
- ✅ Test 4: Cascade delete hoạt động đúng cho phiếu dịch vụ→công việc
- ✅ Tất cả FK constraints được thực thi ở cấp database

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Thông báo lỗi SQL: _____________
- Xác minh cascade delete: _____________

**Ghi Chú:**

---

### INT-1.2: Unique Constraints
**Mục Tiêu:** Xác minh unique constraints ngăn chặn dữ liệu trùng lặp

**Các Bước Kiểm Thử:**
1. Mở Supabase Studio → SQL Editor
2. Kiểm tra unique constraints:

```sql
-- Test 1: Thử tạo SKU trùng lặp cho linh kiện
BEGIN;
-- Lấy SKU hiện có
SELECT sku FROM parts LIMIT 1;
-- Ghi nhận SKU

-- Thử tạo linh kiện với cùng SKU
INSERT INTO parts (name, sku, category, unit_price, stock_quantity)
VALUES ('Duplicate Part', '[EXISTING_SKU]', 'Test', 10000, 10);
-- Mong đợi: Lỗi vi phạm unique constraint
ROLLBACK;

-- Test 2: Thử tạo khách hàng với email trùng lặp
BEGIN;
-- Lấy email khách hàng hiện có
SELECT email FROM customers WHERE email IS NOT NULL LIMIT 1;
-- Ghi nhận email

-- Thử tạo khách hàng với cùng email
INSERT INTO customers (full_name, phone, email)
VALUES ('Duplicate Customer', '0000000002', '[EXISTING_EMAIL]');
-- Mong đợi: Lỗi vi phạm unique constraint
ROLLBACK;

-- Test 3: Thử tạo tên mẫu trùng lặp (nếu unique)
-- Kiểm tra nếu tên mẫu có unique constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'task_templates'
  AND constraint_type = 'UNIQUE';

-- Nếu unique constraint tồn tại trên name:
BEGIN;
SELECT name FROM task_templates LIMIT 1;
-- Thử tạo mẫu với cùng tên
INSERT INTO task_templates (name, service_type, enforce_sequence)
VALUES ('[EXISTING_NAME]', 'warranty', true);
-- Mong đợi: Vi phạm unique nếu constraint tồn tại
ROLLBACK;
```

**Kết Quả Mong Đợi:**
- ✅ SKU trùng lặp bị từ chối với lỗi unique constraint
- ✅ Email trùng lặp bị từ chối (nếu unique constraint tồn tại)
- ✅ Tất cả unique constraints được thực thi đúng
- ✅ Thông báo lỗi rõ ràng và mô tả

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Thông báo lỗi SQL: _____________

**Ghi Chú:**

---

### INT-1.3: Check Constraints (Chuyển Đổi Trạng Thái)
**Mục Tiêu:** Xác minh check constraints ngăn chặn dữ liệu không hợp lệ

**Các Bước Kiểm Thử:**
1. Mở Supabase Studio → SQL Editor
2. Kiểm tra check constraints:

```sql
-- Test 1: Thử tạo phiếu dịch vụ với trạng thái không hợp lệ
BEGIN;
INSERT INTO service_tickets (customer_id, issue_description, service_type, status)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  'Test invalid status',
  'warranty',
  'invalid_status'
);
-- Mong đợi: Vi phạm check constraint hoặc lỗi ENUM
ROLLBACK;

-- Test 2: Thử tạo công việc với trạng thái không hợp lệ
BEGIN;
INSERT INTO service_ticket_tasks (
  service_ticket_id,
  title,
  task_order,
  status
)
VALUES (
  (SELECT id FROM service_tickets LIMIT 1),
  'Test task',
  1,
  'invalid_task_status'
);
-- Mong đợi: Vi phạm check constraint hoặc lỗi ENUM
ROLLBACK;

-- Test 3: Thử đặt số lượng tồn kho âm (nếu check constraint tồn tại)
BEGIN;
UPDATE physical_products
SET quantity_in_stock = -10
WHERE id = (SELECT id FROM physical_products LIMIT 1);
-- Mong đợi: Vi phạm check constraint nếu constraint tồn tại
ROLLBACK;

-- Test 4: Thử đặt giá âm
BEGIN;
UPDATE parts
SET unit_price = -1000
WHERE id = (SELECT id FROM parts LIMIT 1);
-- Mong đợi: Vi phạm check constraint nếu constraint tồn tại
ROLLBACK;
```

**Kết Quả Mong Đợi:**
- ✅ Giá trị trạng thái không hợp lệ bị từ chối
- ✅ Số lượng âm bị từ chối (nếu constraint tồn tại)
- ✅ Giá âm bị từ chối (nếu constraint tồn tại)
- ✅ Check constraints thực thi quy tắc nghiệp vụ

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Thông báo lỗi SQL: _____________

**Ghi Chú:**

---

### INT-1.4: NOT NULL Constraints
**Mục Tiêu:** Xác minh các trường bắt buộc được thực thi ở cấp database

**Các Bước Kiểm Thử:**
1. Mở Supabase Studio → SQL Editor
2. Kiểm tra NOT NULL constraints trên các trường quan trọng:

```sql
-- Test 1: Thử tạo khách hàng không có trường bắt buộc
BEGIN;
-- Thử không có tên
INSERT INTO customers (phone, email)
VALUES ('0000000003', 'test@example.com');
-- Mong đợi: Vi phạm NOT NULL trên full_name

-- Thử không có điện thoại
INSERT INTO customers (full_name, email)
VALUES ('Test Customer', 'test2@example.com');
-- Mong đợi: Vi phạm NOT NULL trên phone
ROLLBACK;

-- Test 2: Thử tạo phiếu dịch vụ không có trường bắt buộc
BEGIN;
-- Thử không có customer_id
INSERT INTO service_tickets (issue_description, service_type)
VALUES ('Test issue', 'warranty');
-- Mong đợi: Vi phạm NOT NULL trên customer_id

-- Thử không có service_type
INSERT INTO service_tickets (customer_id, issue_description)
VALUES ((SELECT id FROM customers LIMIT 1), 'Test issue');
-- Mong đợi: Vi phạm NOT NULL trên service_type
ROLLBACK;

-- Test 3: Thử tạo công việc không có trường bắt buộc
BEGIN;
-- Thử không có title
INSERT INTO service_ticket_tasks (service_ticket_id, task_order)
VALUES ((SELECT id FROM service_tickets LIMIT 1), 1);
-- Mong đợi: Vi phạm NOT NULL trên title
ROLLBACK;

-- Test 4: Thử tạo linh kiện không có trường bắt buộc
BEGIN;
-- Thử không có SKU
INSERT INTO parts (name, category, unit_price, stock_quantity)
VALUES ('Test Part', 'Test', 10000, 10);
-- Mong đợi: Vi phạm NOT NULL trên sku
ROLLBACK;
```

**Kết Quả Mong Đợi:**
- ✅ Tất cả NOT NULL constraints được thực thi
- ✅ Không thể tạo bản ghi thiếu trường bắt buộc
- ✅ Thông báo lỗi rõ ràng chỉ ra trường thiếu

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Thông báo lỗi SQL: _____________

**Ghi Chú:**

---

## Danh Mục Test 2: Triggers và Cập Nhật Tự Động

**Tests:** 5
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** Tất cả 5 tests phải pass

### INT-2.1: Trigger Đánh Số Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh phiếu dịch vụ nhận số tuần tự tự động

**Các Bước Kiểm Thử:**
1. Mở Supabase Studio → SQL Editor
2. Lấy số phiếu dịch vụ tối đa hiện tại:

```sql
SELECT MAX(ticket_number) FROM service_tickets;
-- Ghi nhận số, ví dụ: SV-2025-050
```

3. Tạo phiếu dịch vụ mới qua SQL:

```sql
INSERT INTO service_tickets (customer_id, issue_description, service_type)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  'Test auto-numbering',
  'warranty'
)
RETURNING id, ticket_number;
-- Mong đợi: ticket_number = SV-2025-051 (tiếp theo trong chuỗi)
```

4. Tạo phiếu dịch vụ khác:

```sql
INSERT INTO service_tickets (customer_id, issue_description, service_type)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  'Test auto-numbering 2',
  'paid'
)
RETURNING id, ticket_number;
-- Mong đợi: SV-2025-052
```

5. Xác minh chuỗi:

```sql
SELECT ticket_number
FROM service_tickets
ORDER BY created_at DESC
LIMIT 3;
-- Nên hiển thị số tuần tự
```

**Kết Quả Mong Đợi:**
- ✅ Mỗi phiếu dịch vụ nhận số tự động tạo
- ✅ Định dạng: SV-YYYY-NNN (ví dụ: SV-2025-001)
- ✅ Số tuần tự (051, 052, 053...)
- ✅ Trigger hoạt động ngay cả khi chèn nhiều phiếu dịch vụ
- ✅ Không có số phiếu dịch vụ trùng lặp

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Số Phiếu Dịch Vụ Đã Tạo:**
- Phiếu dịch vụ 1: _____________
- Phiếu dịch vụ 2: _____________
- Tuần tự: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- SQL output: _____________

**Ghi Chú:**

---

### INT-2.2: Tạo Công Việc Tự Động từ Mẫu
**Mục Tiêu:** Xác minh công việc tự động tạo khi phiếu dịch vụ được gán mẫu

**Các Bước Kiểm Thử:**
1. Lấy mẫu với số lượng công việc đã biết:

```sql
SELECT id, name, (
  SELECT COUNT(*) FROM task_template_items WHERE template_id = tt.id
) as task_count
FROM task_templates tt
LIMIT 1;
-- Ghi nhận template ID và task count
```

2. Tạo phiếu dịch vụ với mẫu này:

```sql
-- Kiểm tra nếu tự động tạo xảy ra khi tạo phiếu dịch vụ hoặc cuộc gọi API riêng
-- Điều này có thể khác nhau dựa trên triển khai

-- Nếu tự động tạo khi tạo phiếu dịch vụ với template_id:
INSERT INTO service_tickets (
  customer_id,
  issue_description,
  service_type,
  template_id
)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  'Test auto task generation',
  'warranty',
  '[TEMPLATE_ID]'
)
RETURNING id;

-- Kiểm tra công việc đã tạo
SELECT COUNT(*) as tasks_created
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]';
-- Mong đợi: COUNT khớp với task_count của mẫu
```

3. Xác minh chi tiết công việc:

```sql
SELECT title, task_order, status
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]'
ORDER BY task_order;
-- Tất cả công việc nên có trạng thái 'pending'
```

**Kết Quả Mong Đợi:**
- ✅ Công việc tự động tạo khi mẫu được gán
- ✅ Số lượng công việc khớp với số lượng công việc của mẫu
- ✅ Tất cả công việc được tạo với trạng thái 'pending'
- ✅ Thứ tự công việc được bảo tồn từ mẫu
- ✅ Tiêu đề công việc khớp với mẫu

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Xác Minh:**
- Số lượng công việc mẫu: ___
- Công việc tự động tạo: ___
- Khớp: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- SQL output: _____________

**Ghi Chú:**

---

### INT-2.3: Tự Động Tính Toán Tổng Linh Kiện
**Mục Tiêu:** Xác minh total_parts cập nhật tự động khi linh kiện được thêm/xóa

**Các Bước Kiểm Thử:**
1. Tạo hoặc sử dụng phiếu dịch vụ hiện có
2. Kiểm tra total_parts ban đầu:

```sql
SELECT ticket_number, total_parts
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- Ghi nhận total_parts ban đầu (có thể là 0 hoặc NULL)
```

3. Thêm linh kiện:

```sql
INSERT INTO service_ticket_parts (service_ticket_id, part_id, quantity, unit_price)
VALUES (
  '[TICKET_ID]',
  (SELECT id FROM parts LIMIT 1),
  2,
  100000
);
-- subtotal = 2 * 100000 = 200000
```

4. Kiểm tra total_parts đã cập nhật:

```sql
SELECT ticket_number, total_parts
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- Mong đợi: total_parts = 200000
```

5. Thêm linh kiện khác:

```sql
INSERT INTO service_ticket_parts (service_ticket_id, part_id, quantity, unit_price)
VALUES (
  '[TICKET_ID]',
  (SELECT id FROM parts LIMIT 1 OFFSET 1),
  1,
  50000
);
-- subtotal = 1 * 50000 = 50000
```

6. Kiểm tra total_parts đã cập nhật:

```sql
SELECT ticket_number, total_parts
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- Mong đợi: total_parts = 200000 + 50000 = 250000
```

7. Xóa linh kiện:

```sql
DELETE FROM service_ticket_parts
WHERE service_ticket_id = '[TICKET_ID]'
  AND quantity = 1;
```

8. Xác minh total_parts giảm:

```sql
SELECT ticket_number, total_parts
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- Mong đợi: total_parts = 200000
```

**Kết Quả Mong Đợi:**
- ✅ total_parts tính toán đúng khi linh kiện được thêm
- ✅ total_parts cập nhật khi linh kiện bị xóa
- ✅ Công thức: SUM(quantity * unit_price) cho tất cả linh kiện
- ✅ Trigger thực thi tự động (không cần cập nhật thủ công)
- ✅ total_cost cũng cập nhật: service_fee + total_parts - discount

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Tính Toán:**
- Sau linh kiện đầu tiên: ___ (mong đợi: 200000)
- Sau linh kiện thứ hai: ___ (mong đợi: 250000)
- Sau khi xóa: ___ (mong đợi: 200000)

**Bằng Chứng:**
- SQL outputs: _____________

**Ghi Chú:**

---

### INT-2.4: Tự Động Chuyển Trạng Thái Phiếu Dịch Vụ Khi Tất Cả Công Việc Hoàn Thành
**Mục Tiêu:** Xác minh phiếu dịch vụ tự động hoàn thành khi tất cả công việc xong

**Các Bước Kiểm Thử:**
1. Tạo phiếu dịch vụ với mẫu (2-3 công việc)
2. Xác minh trạng thái phiếu dịch vụ là 'in_progress' hoặc 'pending'
3. Hoàn thành tất cả công việc trừ một:

```sql
-- Hoàn thành công việc đầu tiên
UPDATE service_ticket_tasks
SET status = 'completed', completed_at = NOW()
WHERE service_ticket_id = '[TICKET_ID]'
  AND task_order = 1;

-- Kiểm tra trạng thái phiếu dịch vụ (vẫn nên là in_progress)
SELECT status FROM service_tickets WHERE id = '[TICKET_ID]';
-- Mong đợi: 'in_progress' hoặc 'pending'
```

4. Hoàn thành công việc cuối cùng:

```sql
-- Hoàn thành công việc thứ hai
UPDATE service_ticket_tasks
SET status = 'completed', completed_at = NOW()
WHERE service_ticket_id = '[TICKET_ID]'
  AND task_order = 2;

-- Nếu có nhiều công việc hơn, hoàn thành tất cả...
```

5. Kiểm tra trạng thái phiếu dịch vụ:

```sql
SELECT status FROM service_tickets WHERE id = '[TICKET_ID]';
-- Mong đợi: 'completed' (tự động chuyển)
```

6. Xác minh tất cả công việc đã hoàn thành:

```sql
SELECT COUNT(*) as total_tasks,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]';
-- total_tasks nên bằng completed_tasks
```

**Kết Quả Mong Đợi:**
- ✅ Phiếu dịch vụ KHÔNG tự động hoàn thành cho đến khi TẤT CẢ công việc xong
- ✅ Khi công việc cuối cùng hoàn thành, trạng thái phiếu dịch vụ chuyển sang 'completed'
- ✅ Trigger thực thi tự động
- ✅ Chuyển đổi trạng thái theo luồng cho phép
- ✅ Không cần can thiệp thủ công

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Theo Dõi Trạng Thái:**
- Trước khi hoàn thành tất cả công việc: _____________
- Sau khi hoàn thành tất cả công việc: _____________
- Tự động chuyển: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- SQL outputs: _____________

**Ghi Chú:**

---

### INT-2.5: Trigger Tự Động Chuyển Sản Phẩm Khi Thay Đổi Trạng Thái Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh sản phẩm vật lý tự động chuyển vị trí khi trạng thái phiếu dịch vụ thay đổi

**Các Bước Kiểm Thử:**
1. Tạo hoặc tìm sản phẩm vật lý với vị trí "Kho chính"
2. Tạo phiếu dịch vụ cho sản phẩm này:

```sql
-- Lấy product ID
SELECT id, serial_number, current_location
FROM physical_products
WHERE current_location = 'Kho chính'
LIMIT 1;

-- Tạo phiếu dịch vụ cho sản phẩm này
INSERT INTO service_tickets (
  customer_id,
  issue_description,
  service_type,
  physical_product_id
)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  'Test auto-move',
  'warranty',
  '[PRODUCT_ID]'
)
RETURNING id;
```

3. Cập nhật trạng thái phiếu dịch vụ thành 'in_progress':

```sql
UPDATE service_tickets
SET status = 'in_progress'
WHERE id = '[TICKET_ID]';
```

4. Kiểm tra vị trí sản phẩm:

```sql
SELECT serial_number, current_location
FROM physical_products
WHERE id = '[PRODUCT_ID]';
-- Mong đợi: current_location = 'Đang sửa chữa' (hoặc vị trí đã cấu hình)
```

5. Hoàn thành phiếu dịch vụ:

```sql
UPDATE service_tickets
SET status = 'completed'
WHERE id = '[TICKET_ID]';
```

6. Kiểm tra lại vị trí sản phẩm:

```sql
SELECT serial_number, current_location
FROM physical_products
WHERE id = '[PRODUCT_ID]';
-- Mong đợi: current_location có thể thay đổi thành 'Đã sửa xong' hoặc giữ nguyên
-- (phụ thuộc vào triển khai logic nghiệp vụ)
```

**Kết Quả Mong Đợi:**
- ✅ Vị trí sản phẩm thay đổi khi trạng thái phiếu dịch vụ thay đổi
- ✅ Trạng thái 'in_progress' → Vị trí 'Đang sửa chữa'
- ✅ Trigger thực thi tự động
- ✅ Cập nhật vị trí phản ánh quy trình nghiệp vụ
- ✅ Không cần cập nhật vị trí thủ công

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Theo Dõi Vị Trí:**
- Vị trí ban đầu: _____________
- Sau 'in_progress': _____________
- Sau 'completed': _____________
- Tự động cập nhật: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- SQL outputs: _____________

**Ghi Chú:**

---

## Tóm Tắt Test Toàn Vẹn Dữ Liệu

| Danh Mục | Test IDs | Tổng | Đã Thực Hiện | Pass | Fail | Tỷ Lệ Pass |
|----------|----------|------|--------------|------|------|------------|
| Database Constraints | INT-1.1 đến INT-1.4 | 4 | ___ | ___ | ___ | ___% |
| Triggers & Cập Nhật Tự Động | INT-2.1 đến INT-2.5 | 5 | ___ | ___ | ___ | ___% |
| **TỔNG** | **INT-1.1 đến INT-2.5** | **9** | **___** | **___** | **___** | **___%** |

**Tiêu Chí Pass:** Tỷ lệ pass 100% = TẤT CẢ 9 tests phải pass
**Lỗi Nghiêm Trọng:** ___ (PHẢI BẰNG KHÔNG)

---

## Đánh Giá Cuối Cùng

**Tỷ Lệ Pass Tổng Thể:** ___% (Mục tiêu: 100%)

**Kết Quả:** [ ] CHẤP THUẬN [ ] TỪ CHỐI

**Vấn Đề Toàn Vẹn Dữ Liệu:** ___

**Sức Khỏe Database:** [ ] TỐT [ ] TÌM THẤY VẤN ĐỀ

**Khuyến Nghị:**

---

## Ký Duyệt

**Người Kiểm Thử:** _______________ Ngày: _______________
**Quản Trị Viên Database:** _______________ Ngày: _______________
**Phê Duyệt:** [ ] PASS - Toàn vẹn dữ liệu đã xác minh [ ] FAIL - Vấn đề toàn vẹn phải được sửa

**⚠️ CHẶN TRIỂN KHAI:** Bất kỳ lỗi toàn vẹn dữ liệu nào cũng chặn triển khai cho đến khi được sửa.

---

**Bước Tiếp Theo:**
- Nếu TẤT CẢ PASS: Tiến hành Kiểm Thử Quy Trình E2E
- Nếu BẤT KỲ FAIL: Sửa vấn đề database ngay lập tức, xác minh backups, kiểm thử lại TẤT CẢ tests

**Tài Liệu Tham Khảo:**
- Kế Hoạch Kiểm Thử: docs/KE_HOACH_KIEM_THU.md
- Master Tracker: docs/qa/test-execution/BANG_THEO_DOI_THUC_HIEN_KIEM_THU.md
- Database Schema: docs/data/schemas/
