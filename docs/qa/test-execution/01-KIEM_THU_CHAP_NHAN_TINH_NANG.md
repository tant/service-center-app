# Checklist Kiểm Thử Chấp Nhận Tính Năng - EPIC-01 Giai Đoạn 2

**Ưu Tiên:** P0 - QUAN TRỌNG
**Tiêu Chí Pass:** Tỷ lệ pass ≥95% (84+ trên 88 tests phải pass)
**Thời Gian Ước Tính:** 10-12 giờ
**Tổng Số Tests:** 88
**Stories Được Bao Phủ:** 1.2, 1.4, 1.5, 1.6-1.10, 1.11-1.14, 1.15, 1.16, 1.17

**⚠️ QUAN TRỌNG:** Danh mục kiểm thử này xác thực tất cả tính năng mới của Giai Đoạn 2. Yêu cầu tỷ lệ pass tối thiểu 95% để triển khai.

---

## Thiết Lập Trước Kiểm Thử

**Môi Trường Kiểm Thử:**
- [ ] Ứng dụng đang chạy: http://localhost:3025
- [ ] Supabase Studio truy cập được: http://localhost:54323
- [ ] Browser DevTools mở (tab Network, Console)
- [ ] Tài khoản test sẵn sàng (Admin, Manager, Technician, Reception)
- [ ] SQL client kết nối đến database

**Dữ Liệu Test:**
- [ ] Database seed mới đã áp dụng
- [ ] Khách hàng test đã tạo (ít nhất 5)
- [ ] Mẫu test đã tạo (warranty, paid, replacement)
- [ ] Sản phẩm test đã tạo (ít nhất 10)
- [ ] Kho test đã tạo (ít nhất 2)
- [ ] Phiếu dịch vụ test ở các trạng thái khác nhau

---

## Danh Mục Test 1: Quản Lý Mẫu Công Việc (Story 1.2)

**Tests:** 4
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** Tất cả 4 tests phải pass

### FT-1.1: Tạo Mẫu Công Việc
**Mục Tiêu:** Xác minh admin có thể tạo mẫu công việc mới

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin (admin@example.com)
2. Điều hướng đến `/workflows/templates`
3. Nhấp nút "Mẫu Mới"
4. Điền chi tiết mẫu:
   - Tên: "Test Template - Warranty Service"
   - Loại Dịch Vụ: Chọn "warranty"
   - Bắt Buộc Theo Thứ Tự: Đánh dấu checkbox
5. Thêm 3 công việc:
   - Công việc 1: "Initial Diagnosis" (thứ tự: 1)
   - Công việc 2: "Repair Work" (thứ tự: 2)
   - Công việc 3: "Quality Check" (thứ tự: 3)
6. Nhấp "Lưu Mẫu"
7. Xác minh thông báo thành công xuất hiện
8. Kiểm tra mẫu xuất hiện trong danh sách

**Kết Quả Mong Đợi:**
- ✅ Form tạo mẫu hiển thị tất cả trường bắt buộc
- ✅ Mẫu lưu thành công không có lỗi
- ✅ Thông báo thành công hiển thị
- ✅ Mẫu xuất hiện trong danh sách mẫu
- ✅ Mẫu hiển thị đúng tên, loại dịch vụ, và số lượng công việc

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của form mẫu: _____________
- Screenshot của danh sách mẫu: _____________

**Ghi Chú:**

---

### FT-1.2: Chỉnh Sửa Mẫu Hiện Tại
**Mục Tiêu:** Xác minh admin có thể sửa đổi mẫu hiện có

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Điều hướng đến `/workflows/templates`
3. Tìm mẫu đã tạo trong FT-1.1
4. Nhấp nút "Chỉnh Sửa" trên mẫu
5. Sửa đổi mẫu:
   - Đổi tên thành "Test Template - Warranty Service (Updated)"
   - Thêm công việc thứ 4: "Final Testing" (thứ tự: 4)
6. Nhấp "Lưu Thay Đổi"
7. Xác minh thông báo thành công xuất hiện
8. Kiểm tra thay đổi được phản ánh trong danh sách mẫu
9. Mở Supabase Studio SQL Editor
10. Thực thi:

```sql
-- Xác minh lịch sử mẫu được bảo tồn
SELECT * FROM task_templates
WHERE name LIKE '%Test Template - Warranty%'
ORDER BY updated_at DESC;

-- Xác minh số lượng công việc
SELECT COUNT(*) FROM task_template_items
WHERE template_id = (SELECT id FROM task_templates WHERE name = 'Test Template - Warranty Service (Updated)');
-- Mong đợi: 4
```

**Kết Quả Mong Đợi:**
- ✅ Form chỉnh sửa mở với dữ liệu mẫu hiện tại
- ✅ Thay đổi lưu thành công
- ✅ Danh sách mẫu hiển thị tên đã cập nhật
- ✅ 4 công việc tồn tại trong database
- ✅ Timestamp updated_at thay đổi

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot form chỉnh sửa: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-1.3: Mẫu với Bắt Buộc Theo Thứ Tự
**Mục Tiêu:** Xác minh chế độ thứ tự nghiêm ngặt hoạt động đúng

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Tạo mẫu mới với:
   - Tên: "Strict Sequence Template"
   - Loại Dịch Vụ: "paid"
   - Bắt Buộc Theo Thứ Tự: TRUE (đã đánh dấu)
   - Công việc:
     - "Step 1 - Must Complete First" (thứ tự: 1)
     - "Step 2 - Must Complete Second" (thứ tự: 2)
     - "Step 3 - Must Complete Last" (thứ tự: 3)
3. Lưu mẫu
4. Tạo phiếu dịch vụ mới sử dụng mẫu này
5. Đăng nhập với Technician
6. Điều hướng đến phiếu dịch vụ
7. Thử bắt đầu "Step 3" trước khi hoàn thành "Step 1"

**Kết Quả Mong Đợi:**
- ✅ Mẫu được tạo với enforce_sequence = true
- ✅ Phiếu dịch vụ tạo thành công với 3 công việc chờ xử lý
- ✅ Hệ thống ngăn chặn bắt đầu Step 3 không theo thứ tự
- ✅ Thông báo lỗi hiển thị: "Phải hoàn thành các công việc trước đó trước"
- ✅ Chỉ Step 1 có thể bắt đầu (các công việc khác bị vô hiệu hóa hoặc hiển thị cảnh báo)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của lỗi bắt buộc thứ tự: _____________
- Screenshot hiển thị công việc bị vô hiệu hóa: _____________

**Ghi Chú:**

---

### FT-1.4: Mẫu với Chế Độ Linh Hoạt
**Mục Tiêu:** Xác minh chế độ linh hoạt cho phép thực thi không theo thứ tự

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Tạo mẫu mới với:
   - Tên: "Flexible Template"
   - Loại Dịch Vụ: "warranty"
   - Bắt Buộc Theo Thứ Tự: FALSE (không đánh dấu)
   - Công việc:
     - "Task A" (thứ tự: 1)
     - "Task B" (thứ tự: 2)
     - "Task C" (thứ tự: 3)
3. Lưu mẫu
4. Tạo phiếu dịch vụ mới sử dụng mẫu này
5. Đăng nhập với Technician
6. Điều hướng đến phiếu dịch vụ
7. Bắt đầu và hoàn thành "Task C" trước (bỏ qua A và B)
8. Kiểm tra cảnh báo (nên hiển thị cảnh báo nhưng cho phép hoàn thành)

**Kết Quả Mong Đợi:**
- ✅ Mẫu được tạo với enforce_sequence = false
- ✅ Phiếu dịch vụ tạo với 3 công việc chờ xử lý
- ✅ Hệ thống cho phép bắt đầu Task C mà không hoàn thành A và B
- ✅ Thông báo cảnh báo hiển thị (tùy chọn): "Thứ tự khuyến nghị không được tuân theo"
- ✅ Tất cả công việc có thể bắt đầu bất kể thứ tự
- ✅ Task C hoàn thành thành công

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của hoàn thành không theo thứ tự: _____________
- Xác minh trạng thái công việc: _____________

**Ghi Chú:**

---

## Danh Mục Test 2: Giao Diện Thực Hiện Công Việc (Story 1.4)

**Tests:** 4
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** Tất cả 4 tests phải pass

### FT-2.1: Bắt Đầu Công Việc
**Mục Tiêu:** Xác minh kỹ thuật viên có thể bắt đầu công việc chờ xử lý

**Các Bước Kiểm Thử:**
1. Tạo phiếu dịch vụ test với mẫu (sử dụng mẫu từ FT-1.3)
2. Phân công phiếu dịch vụ cho technician@example.com
3. Đăng nhập với Technician
4. Điều hướng đến `/my-tasks`
5. Tìm phiếu dịch vụ test trong danh sách công việc
6. Nhấp nút "Bắt Đầu" trên công việc đầu tiên
7. Xác nhận hành động
8. Quan sát thay đổi trạng thái công việc
9. Xác minh trong database:

```sql
SELECT id, title, status, started_at, assigned_to
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]'
ORDER BY task_order;
```

**Kết Quả Mong Đợi:**
- ✅ Trang Công Việc Của Tôi hiển thị công việc được phân công
- ✅ Nút "Bắt Đầu" hiển thị và được kích hoạt
- ✅ Trạng thái công việc thay đổi từ "pending" thành "in_progress"
- ✅ Timestamp started_at được ghi lại
- ✅ Công việc hiển thị chỉ báo trực quan "đang thực hiện"
- ✅ Nút "Hoàn Thành" và "Chặn" hiện có sẵn

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot trước khi bắt đầu: _____________
- Screenshot sau khi bắt đầu: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-2.2: Hoàn Thành Công Việc với Ghi Chú
**Mục Tiêu:** Xác minh kỹ thuật viên có thể hoàn thành công việc với ghi chú hoàn thành

**Các Bước Kiểm Thử:**
1. Tiếp tục từ FT-2.1 (công việc ở trạng thái "in_progress")
2. Nhấp nút "Hoàn Thành"
3. Modal mở để nhập ghi chú hoàn thành
4. Thử gửi với ghi chú trống (nên thất bại xác thực)
5. Nhập ghi chú: "Test completion note - verified all steps completed successfully"
6. Gửi
7. Quan sát thay đổi trạng thái công việc
8. Xác minh trong database:

```sql
SELECT id, title, status, completed_at, completion_notes
FROM service_ticket_tasks
WHERE id = '[TASK_ID]';
```

**Kết Quả Mong Đợi:**
- ✅ Modal hoàn thành mở
- ✅ Xác thực yêu cầu tối thiểu 5 ký tự cho ghi chú
- ✅ Ghi chú trống bị từ chối với thông báo lỗi
- ✅ Với ghi chú hợp lệ, trạng thái công việc thay đổi thành "completed"
- ✅ Timestamp completed_at được ghi lại
- ✅ completion_notes được lưu trong database
- ✅ Công việc hiển thị chỉ báo trực quan "đã hoàn thành" (dấu kiểm/màu xanh)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của modal hoàn thành: _____________
- Screenshot của công việc đã hoàn thành: _____________
- SQL output hiển thị ghi chú: _____________

**Ghi Chú:**

---

### FT-2.3: Chặn Công Việc với Lý Do
**Mục Tiêu:** Xác minh kỹ thuật viên có thể chặn công việc khi gặp vấn đề

**Các Bước Kiểm Thử:**
1. Bắt đầu công việc mới trên phiếu dịch vụ test
2. Nhấp nút "Chặn"
3. Modal mở để nhập lý do chặn
4. Thử gửi không có lý do (nên thất bại xác thực)
5. Nhập lý do: "Missing parts - waiting for part delivery"
6. Gửi
7. Quan sát thay đổi trạng thái công việc
8. Đăng nhập với Manager
9. Điều hướng đến `/dashboard/task-progress`
10. Xác minh công việc bị chặn xuất hiện trong phần "Cảnh Báo Công Việc Bị Chặn"
11. Xác minh trong database:

```sql
SELECT id, title, status, blocked_at, blocked_reason
FROM service_ticket_tasks
WHERE id = '[TASK_ID]';
```

**Kết Quả Mong Đợi:**
- ✅ Modal chặn mở
- ✅ Xác thực yêu cầu lý do chặn (tối thiểu 10 ký tự)
- ✅ Lý do trống bị từ chối với thông báo lỗi
- ✅ Trạng thái công việc thay đổi thành "blocked"
- ✅ Timestamp blocked_at được ghi lại
- ✅ blocked_reason được lưu trong database
- ✅ Công việc hiển thị chỉ báo trực quan "bị chặn" (cảnh báo/màu đỏ)
- ✅ Bảng điều khiển quản lý hiển thị cảnh báo công việc bị chặn

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của modal chặn: _____________
- Screenshot của công việc bị chặn: _____________
- Screenshot của cảnh báo bảng điều khiển quản lý: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-2.4: Bắt Buộc Thứ Tự Công Việc
**Mục Tiêu:** Xác minh thứ tự nghiêm ngặt ngăn chặn thực thi không theo thứ tự

**Các Bước Kiểm Thử:**
1. Tạo phiếu dịch vụ sử dụng "Strict Sequence Template" (từ FT-1.3)
2. Phân công cho technician@example.com
3. Đăng nhập với Technician
4. Điều hướng đến trang chi tiết phiếu dịch vụ
5. Quan sát tất cả 3 công việc (Step 1, Step 2, Step 3)
6. Thử nhấp nút "Bắt Đầu" trên Step 3 (nên bị vô hiệu hóa)
7. Thử nhấp nút "Bắt Đầu" trên Step 2 (nên bị vô hiệu hóa)
8. Bắt đầu Step 1
9. Hoàn thành Step 1 với ghi chú
10. Bây giờ thử bắt đầu Step 3 (vẫn nên bị vô hiệu hóa)
11. Bắt đầu Step 2 (bây giờ nên được kích hoạt)
12. Hoàn thành Step 2
13. Bắt đầu và hoàn thành Step 3 (bây giờ nên được kích hoạt)

**Kết Quả Mong Đợi:**
- ✅ Ban đầu, chỉ nút "Bắt Đầu" của Step 1 được kích hoạt
- ✅ Step 2 và Step 3 hiển thị trạng thái bị vô hiệu hóa hoặc biểu tượng khóa
- ✅ Sau khi Step 1 hoàn thành, Step 2 được kích hoạt
- ✅ Step 3 vẫn bị vô hiệu hóa cho đến khi Step 2 hoàn thành
- ✅ Tooltip hover hiển thị: "Hoàn thành các công việc trước đó trước"
- ✅ Thứ tự nghiêm ngặt được thực thi trong toàn bộ quy trình

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot hiển thị công việc bị vô hiệu hóa: _____________
- Screenshot của tiến trình: _____________

**Ghi Chú:**

---

## Danh Mục Test 3: Phụ Thuộc Công Việc (Story 1.5)

**Tests:** 3
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** Tất cả 3 tests phải pass

### FT-3.1: Bắt Buộc Cổng Tuần Tự
**Mục Tiêu:** Xác minh hệ thống chặn hoàn thành không theo thứ tự ở chế độ nghiêm ngặt

**Các Bước Kiểm Thử:**
1. Sử dụng phiếu dịch vụ với "Strict Sequence Template" từ FT-2.4
2. Đặt lại tất cả công việc về trạng thái chờ xử lý (qua SQL nếu cần):

```sql
UPDATE service_ticket_tasks
SET status = 'pending', started_at = NULL, completed_at = NULL
WHERE service_ticket_id = '[TICKET_ID]';
```

3. Đăng nhập với Technician
4. Thử hoàn thành Task 3 mà không hoàn thành Task 2
5. Quan sát phản hồi hệ thống
6. Thử bắt đầu Task 2 mà không hoàn thành Task 1
7. Quan sát phản hồi hệ thống

**Kết Quả Mong Đợi:**
- ✅ Hệ thống ngăn chặn bắt đầu Task 2 trước khi Task 1 hoàn thành
- ✅ Hệ thống ngăn chặn bắt đầu Task 3 trước khi Task 2 hoàn thành
- ✅ Thông báo lỗi rõ ràng: "Không thể bắt đầu công việc này. Các công việc trước đó phải được hoàn thành trước."
- ✅ Các nút công việc vẫn bị vô hiệu hóa cho đến khi đáp ứng phụ thuộc
- ✅ Không có cập nhật database cho các hành động bị chặn

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của thông báo lỗi: _____________
- Xác minh trạng thái công việc: _____________

**Ghi Chú:**

---

### FT-3.2: Cảnh Báo Chế Độ Linh Hoạt
**Mục Tiêu:** Xác minh chế độ linh hoạt hiển thị cảnh báo nhưng cho phép hoàn thành không theo thứ tự

**Các Bước Kiểm Thử:**
1. Tạo phiếu dịch vụ với "Flexible Template" (từ FT-1.4)
2. Đăng nhập với Technician
3. Điều hướng đến phiếu dịch vụ
4. Bỏ qua Task A và Task B
5. Bắt đầu và hoàn thành Task C trước
6. Quan sát nếu cảnh báo được hiển thị
7. Xác minh Task C hoàn thành thành công
8. Kiểm tra database:

```sql
SELECT title, task_order, status, completed_at
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]'
ORDER BY task_order;
-- Task C (order 3) nên hiển thị đã hoàn thành trong khi A và B đang chờ xử lý
```

**Kết Quả Mong Đợi:**
- ✅ Tất cả công việc có thể bắt đầu bất kể thứ tự
- ✅ Hệ thống có thể hiển thị cảnh báo thông tin (không chặn)
- ✅ Task C hoàn thành thành công
- ✅ Database hiển thị Task C đã hoàn thành trong khi A và B chờ xử lý
- ✅ Không có lỗi hoặc thất bại hệ thống

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot hiển thị hoàn thành không theo thứ tự: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-3.3: Tự Động Chuyển Trạng Thái Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh trạng thái phiếu dịch vụ tự động chuyển khi tất cả công việc hoàn thành

**Các Bước Kiểm Thử:**
1. Tạo phiếu dịch vụ mới với mẫu (bất kỳ mẫu nào có 3+ công việc)
2. Xác minh trạng thái phiếu dịch vụ ban đầu là "pending" hoặc "in_progress"
3. Đăng nhập với Technician
4. Hoàn thành tất cả công việc từng cái một
5. Sau khi hoàn thành công việc cuối cùng, quan sát trạng thái phiếu dịch vụ
6. Xác minh trong database:

```sql
-- Kiểm tra trạng thái phiếu dịch vụ
SELECT ticket_number, status, updated_at
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- Trạng thái mong đợi: 'completed'

-- Kiểm tra tất cả công việc đã hoàn thành
SELECT COUNT(*) as total_tasks,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]';
-- Tổng và đã hoàn thành nên khớp
```

**Kết Quả Mong Đợi:**
- ✅ Phiếu dịch vụ bắt đầu ở trạng thái "pending" hoặc "in_progress"
- ✅ Sau khi tất cả công việc hoàn thành, phiếu dịch vụ tự động chuyển sang "completed"
- ✅ Thay đổi trạng thái phiếu dịch vụ là ngay lập tức (không cần cập nhật thủ công)
- ✅ Database phản ánh thay đổi trạng thái với timestamp cập nhật
- ✅ Phiếu dịch vụ xuất hiện trong phần "Đã Hoàn Thành" của danh sách phiếu dịch vụ

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của phiếu dịch vụ trước công việc cuối cùng: _____________
- Screenshot của phiếu dịch vụ sau công việc cuối cùng: _____________
- SQL output: _____________

**Ghi Chú:**

---

## Danh Mục Test 4: Hoạt Động Kho (Stories 1.6-1.10)

**Tests:** 4
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** Tất cả 4 tests phải pass

### FT-4.1: Ghi Nhận Chuyển Động Tồn Kho
**Mục Tiêu:** Xác minh chuyển động tồn kho có thể được ghi nhận và cập nhật số lượng

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Điều hướng đến `/dashboard/inventory/products`
3. Ghi nhận mức tồn kho hiện tại của sản phẩm test
4. Nhấp "Ghi Nhận Chuyển Động" trên sản phẩm
5. Điền form chuyển động:
   - Loại Chuyển Động: "IN" (nhập kho)
   - Số Lượng: 10
   - Kho: Chọn kho test
   - Lý Do: "Test stock replenishment"
6. Gửi
7. Xác minh số lượng tồn kho cập nhật
8. Ghi nhận chuyển động khác:
   - Loại Chuyển Động: "OUT"
   - Số Lượng: 5
   - Kho: Cùng kho
   - Lý Do: "Test stock consumption"
9. Xác minh số lượng tồn kho cập nhật lại
10. Kiểm tra database:

```sql
-- Kiểm tra lịch sử chuyển động
SELECT movement_type, quantity, reason, created_at
FROM stock_movements
WHERE physical_product_id = '[PRODUCT_ID]'
ORDER BY created_at DESC
LIMIT 2;

-- Kiểm tra mức tồn kho hiện tại
SELECT quantity_in_stock
FROM physical_products
WHERE id = '[PRODUCT_ID]';
-- Nên là: ban đầu + 10 - 5
```

**Kết Quả Mong Đợi:**
- ✅ Form chuyển động mở với tất cả trường bắt buộc
- ✅ Nhập kho tăng số lượng theo số lượng chỉ định
- ✅ Xuất kho giảm số lượng theo số lượng chỉ định
- ✅ Cả hai chuyển động được ghi lại trong bảng stock_movements
- ✅ Số lượng tồn kho cuối cùng = ban đầu + 10 - 5
- ✅ Lịch sử chuyển động hiển thị trong chi tiết sản phẩm

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số:**
- Tồn kho ban đầu: ___
- Sau IN (+10): ___
- Sau OUT (-5): ___
- Dự kiến cuối cùng: ___
- Thực tế cuối cùng: ___

**Bằng Chứng:**
- Screenshot của form chuyển động: _____________
- Screenshot của tồn kho cập nhật: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-4.2: Cảnh Báo Tồn Kho Thấp
**Mục Tiêu:** Xác minh ngưỡng tồn kho thấp kích hoạt cảnh báo

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Điều hướng đến `/dashboard/inventory/products`
3. Chọn sản phẩm test
4. Đặt low_stock_threshold = 10
5. Ghi nhận chuyển động tồn kho để giảm số lượng xuống 9 (dưới ngưỡng)
6. Điều hướng đến `/dashboard/inventory/stock-levels`
7. Quan sát phần cảnh báo tồn kho thấp
8. Xác minh sản phẩm xuất hiện trong danh sách cảnh báo
9. Kiểm tra database:

```sql
-- Xác minh sản phẩm tồn kho thấp
SELECT name, quantity_in_stock, low_stock_threshold
FROM physical_products
WHERE quantity_in_stock < low_stock_threshold;
-- Nên bao gồm sản phẩm test

-- Kiểm tra materialized view (nếu tồn tại)
SELECT * FROM vw_stock_levels
WHERE status = 'low_stock';
```

**Kết Quả Mong Đợi:**
- ✅ Ngưỡng low_stock_threshold của sản phẩm có thể được đặt
- ✅ Khi tồn kho giảm dưới ngưỡng, cảnh báo được kích hoạt
- ✅ Sản phẩm xuất hiện trong phần "Cảnh Báo Tồn Kho Thấp"
- ✅ Cảnh báo hiển thị tên sản phẩm, tồn kho hiện tại, và ngưỡng
- ✅ Chỉ báo trực quan (biểu tượng cảnh báo màu vàng/cam)
- ✅ Truy vấn database trả về sản phẩm trong danh sách tồn kho thấp

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số:**
- Ngưỡng đặt: ___
- Tồn kho giảm xuống: ___
- Cảnh báo hiển thị: [ ] Có [ ] Không

**Bằng Chứng:**
- Screenshot của cảnh báo tồn kho thấp: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-4.3: Tạo Lô RMA
**Mục Tiêu:** Xác minh lô RMA có thể được tạo với sản phẩm và số serial

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Điều hướng đến `/dashboard/inventory/rma`
3. Nhấp "Tạo Lô RMA"
4. Điền form lô:
   - Nhà Cung Cấp: Chọn nhà cung cấp test
   - Lý Do: "Defective units - screen flickering"
   - Ngày Trả Dự Kiến: (chọn ngày tương lai)
5. Thêm sản phẩm vào lô:
   - Sản phẩm 1: Chọn sản phẩm, nhập số serial "SN-TEST-001", số lượng: 1
   - Sản phẩm 2: Chọn sản phẩm, nhập số serial "SN-TEST-002", số lượng: 1
6. Lưu lô
7. Xác minh thông báo thành công
8. Kiểm tra danh sách lô hiển thị lô mới
9. Xác minh số lô tự động tạo (định dạng RMA-YYYY-NNN)
10. Kiểm tra database:

```sql
-- Kiểm tra lô RMA đã tạo
SELECT batch_number, supplier_id, reason, status, expected_return_date
FROM rma_batches
WHERE batch_number LIKE 'RMA-%'
ORDER BY created_at DESC
LIMIT 1;

-- Kiểm tra các mục RMA
SELECT COUNT(*) as item_count
FROM rma_batch_items
WHERE rma_batch_id = '[BATCH_ID]';
-- Mong đợi: 2
```

**Kết Quả Mong Đợi:**
- ✅ Form lô RMA hiển thị tất cả trường bắt buộc
- ✅ Lô lưu thành công
- ✅ Số lô tự động tạo theo định dạng RMA-YYYY-NNN
- ✅ Lô xuất hiện trong danh sách RMA với trạng thái "pending"
- ✅ 2 mục liên kết với lô
- ✅ Số serial được lưu chính xác

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chi Tiết Lô:**
- Số lô đã tạo: _____________
- Số lượng mục: ___
- Trạng thái: _____________

**Bằng Chứng:**
- Screenshot của form lô RMA: _____________
- Screenshot của danh sách lô RMA: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-4.4: Tự Động Chuyển Vị Trí Sản Phẩm Khi Thay Đổi Trạng Thái Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh sản phẩm tự động chuyển vị trí dựa trên trạng thái phiếu dịch vụ

**Các Bước Kiểm Thử:**
1. Tạo sản phẩm test với vị trí hiện tại "Kho chính"
2. Tạo phiếu dịch vụ mới cho sản phẩm này
3. Đặt trạng thái phiếu dịch vụ thành "in_progress"
4. Kiểm tra vị trí sản phẩm - nên tự động chuyển sang "Đang sửa chữa"
5. Hoàn thành phiếu dịch vụ
6. Kiểm tra vị trí sản phẩm - nên tự động chuyển sang vị trí thích hợp
7. Xác minh trong database:

```sql
-- Kiểm tra thay đổi vị trí sản phẩm
SELECT pp.serial_number, pp.current_location, st.status, st.updated_at
FROM physical_products pp
JOIN service_tickets st ON pp.id = st.physical_product_id
WHERE pp.id = '[PRODUCT_ID]'
ORDER BY st.updated_at DESC;

-- Kiểm tra lịch sử vị trí (nếu được theo dõi)
SELECT location, changed_at, reason
FROM product_location_history
WHERE physical_product_id = '[PRODUCT_ID]'
ORDER BY changed_at DESC;
```

**Kết Quả Mong Đợi:**
- ✅ Vị trí sản phẩm ban đầu: "Kho chính"
- ✅ Khi trạng thái phiếu dịch vụ = "in_progress", vị trí chuyển sang "Đang sửa chữa"
- ✅ Thay đổi vị trí là tự động (không can thiệp thủ công)
- ✅ Thay đổi vị trí được kích hoạt bởi cập nhật trạng thái phiếu dịch vụ
- ✅ Database phản ánh vị trí hiện tại chính xác

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Theo Dõi Vị Trí:**
- Vị trí ban đầu: _____________
- Vị trí sau "in_progress": _____________
- Vị trí sau "completed": _____________

**Bằng Chứng:**
- Screenshot của thay đổi vị trí sản phẩm: _____________
- SQL output: _____________

**Ghi Chú:**

---

## Danh Mục Test 5: Cổng Yêu Cầu Dịch Vụ Công Khai (Stories 1.11-1.14)

**Tests:** 5
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** Tất cả 5 tests phải pass

### FT-5.1: Gửi Yêu Cầu Dịch Vụ (Không Cần Đăng Nhập)
**Mục Tiêu:** Xác minh người dùng công khai có thể gửi yêu cầu dịch vụ mà không cần xác thực

**Các Bước Kiểm Thử:**
1. Đăng xuất khỏi ứng dụng (đảm bảo không được xác thực)
2. Mở `/service-request` trong trình duyệt
3. Xác minh trang tải mà không yêu cầu đăng nhập
4. Điền form yêu cầu dịch vụ:
   - Tên: "John Doe"
   - Điện Thoại: "0123456789"
   - Email: "john.doe@example.com"
   - Loại Thiết Bị: "Laptop"
   - Mô Tả Vấn Đề: "Laptop won't turn on, tried charging but no response"
5. Gửi form
6. Quan sát phản hồi
7. Ghi nhận token theo dõi hiển thị
8. Xác minh trong database:

```sql
SELECT tracking_token, customer_name, customer_phone, device_type, issue_description, status
FROM service_requests
WHERE customer_phone = '0123456789'
ORDER BY created_at DESC
LIMIT 1;
```

**Kết Quả Mong Đợi:**
- ✅ Trang có thể truy cập mà không cần đăng nhập
- ✅ Form hiển thị tất cả trường bắt buộc
- ✅ Xác thực form hoạt động (trường bắt buộc được thực thi)
- ✅ Gửi thành công
- ✅ Thông báo thành công hiển thị với token theo dõi
- ✅ Token theo dõi là duy nhất (định dạng UUID)
- ✅ Yêu cầu được lưu trong database với trạng thái "pending"
- ✅ Thông báo email được xếp hàng đợi (kiểm tra bảng email_notifications)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chi Tiết Yêu Cầu:**
- Token theo dõi: _____________
- ID yêu cầu: _____________
- Trạng thái: _____________

**Bằng Chứng:**
- Screenshot của form công khai: _____________
- Screenshot của thông báo thành công với token: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-5.2: Theo Dõi Yêu Cầu Dịch Vụ với Token
**Mục Tiêu:** Xác minh khách hàng có thể theo dõi trạng thái yêu cầu bằng token

**Các Bước Kiểm Thử:**
1. Sử dụng token theo dõi từ FT-5.1
2. Mở `/service-request/track` (không đăng nhập)
3. Nhập token theo dõi
4. Gửi
5. Quan sát trạng thái yêu cầu hiển thị
6. Xác minh thông tin hiển thị:
   - Trạng thái yêu cầu
   - Ngày gửi
   - Loại thiết bị
   - Mô tả vấn đề (được che giấu vì bảo mật)
   - Trạng thái hiện tại (Pending/Converted/Completed)
7. Thử token không hợp lệ "INVALID-TOKEN-12345"
8. Xác minh thông báo lỗi

**Kết Quả Mong Đợi:**
- ✅ Trang theo dõi có thể truy cập mà không cần đăng nhập
- ✅ Với token hợp lệ, chi tiết yêu cầu được hiển thị
- ✅ Trạng thái hiển thị "Pending" (chưa được chuyển đổi)
- ✅ Ngày gửi hiển thị
- ✅ Thông tin nhạy cảm được bảo vệ (email có thể được che giấu)
- ✅ Với token không hợp lệ, thông báo lỗi: "Không tìm thấy yêu cầu"
- ✅ Không có quyền truy cập vào yêu cầu của khách hàng khác

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của trang theo dõi: _____________
- Screenshot của lỗi token không hợp lệ: _____________

**Ghi Chú:**

---

### FT-5.3: Nhân Viên Chuyển Đổi Yêu Cầu Thành Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh nhân viên lễ tân có thể chuyển đổi yêu cầu thành phiếu dịch vụ

**Các Bước Kiểm Thử:**
1. Đăng nhập với Reception (reception@example.com)
2. Điều hướng đến `/dashboard/service-requests`
3. Tìm yêu cầu đã gửi trong FT-5.1
4. Nhấp nút "Chuyển Thành Phiếu Dịch Vụ"
5. Form chuyển đổi mở
6. Điền chi tiết phiếu dịch vụ:
   - Khách Hàng: Chọn khách hàng hiện có hoặc tạo mới
   - Sản Phẩm: Chọn sản phẩm
   - Loại Dịch Vụ: "warranty"
   - Mẫu: Chọn mẫu thích hợp
   - Phân Công Cho: Chọn kỹ thuật viên
7. Gửi chuyển đổi
8. Quan sát thông báo thành công
9. Xác minh phiếu dịch vụ được tạo
10. Kiểm tra database:

```sql
-- Kiểm tra trạng thái yêu cầu cập nhật
SELECT tracking_token, status, converted_to_ticket_id, converted_at, converted_by
FROM service_requests
WHERE tracking_token = '[TOKEN]';
-- Trạng thái nên là 'converted'

-- Kiểm tra phiếu dịch vụ được tạo
SELECT ticket_number, customer_id, status
FROM service_tickets
WHERE id = (SELECT converted_to_ticket_id FROM service_requests WHERE tracking_token = '[TOKEN]');
```

**Kết Quả Mong Đợi:**
- ✅ Bảng điều khiển yêu cầu hiển thị tất cả yêu cầu chờ xử lý
- ✅ Nút "Chuyển Thành Phiếu Dịch Vụ" có sẵn
- ✅ Form chuyển đổi điền trước dữ liệu yêu cầu
- ✅ Phiếu dịch vụ được tạo thành công
- ✅ Trạng thái yêu cầu thay đổi thành "converted"
- ✅ converted_to_ticket_id liên kết đến phiếu dịch vụ mới
- ✅ Timestamp converted_at được ghi lại
- ✅ converted_by ghi lại người dùng nhân viên
- ✅ Yêu cầu không còn xuất hiện trong danh sách "Chờ Xử Lý"

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chi Tiết Chuyển Đổi:**
- Số phiếu dịch vụ đã tạo: _____________
- Chuyển đổi bởi: _____________
- Chuyển đổi lúc: _____________

**Bằng Chứng:**
- Screenshot của bảng điều khiển yêu cầu: _____________
- Screenshot của form chuyển đổi: _____________
- Screenshot của phiếu dịch vụ đã tạo: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-5.4: Xác Nhận Giao Hàng
**Mục Tiêu:** Xác minh quy trình xác nhận giao hàng

**Các Bước Kiểm Thử:**
1. Hoàn thành phiếu dịch vụ đã tạo trong FT-5.3
2. Đăng nhập với Manager hoặc Admin
3. Điều hướng đến phiếu dịch vụ đã hoàn thành
4. Nhấp nút "Xác Nhận Giao Hàng"
5. Modal xác nhận giao hàng mở
6. Điền chi tiết giao hàng:
   - Ngày Giao Hàng: (chọn ngày)
   - Giao Cho: "John Doe"
   - Phương Thức Giao Hàng: "Khách Hàng Nhận"
   - Ghi Chú: "Customer picked up device, verified all repairs complete"
7. Gửi
8. Xác minh thông báo thành công
9. Kiểm tra thông báo email đã gửi
10. Xác minh trong database:

```sql
-- Kiểm tra xác nhận giao hàng
SELECT ticket_number, status, delivery_confirmed_at, delivery_confirmed_by, delivery_notes
FROM service_tickets
WHERE id = '[TICKET_ID]';

-- Kiểm tra thông báo email
SELECT recipient, template_type, status
FROM email_notifications
WHERE reference_id = '[TICKET_ID]'
  AND template_type = 'delivery_confirmation'
ORDER BY created_at DESC
LIMIT 1;
```

**Kết Quả Mong Đợi:**
- ✅ Nút "Xác Nhận Giao Hàng" xuất hiện trên phiếu dịch vụ đã hoàn thành
- ✅ Modal hiển thị tất cả trường giao hàng
- ✅ Xác thực yêu cầu các trường bắt buộc
- ✅ Xác nhận giao hàng lưu thành công
- ✅ Timestamp delivery_confirmed_at được ghi lại
- ✅ delivery_confirmed_by ghi lại người dùng nhân viên
- ✅ Thông báo email được xếp hàng đợi với chi tiết giao hàng
- ✅ Phiếu dịch vụ hiển thị huy hiệu hoặc trạng thái "Đã Giao"

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chi Tiết Giao Hàng:**
- Xác nhận lúc: _____________
- Xác nhận bởi: _____________
- Email đã gửi: [ ] Có [ ] Không

**Bằng Chứng:**
- Screenshot của modal xác nhận giao hàng: _____________
- Screenshot của phiếu dịch vụ sau giao hàng: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-5.5: Rate Limiting (Bảo Mật)
**Mục Tiêu:** Xác minh cổng công khai thực thi rate limiting

**Các Bước Kiểm Thử:**
1. Đăng xuất khỏi ứng dụng
2. Mở `/service-request`
3. Gửi 10 yêu cầu dịch vụ liên tiếp nhanh chóng:
   - Sử dụng số điện thoại khác nhau cho mỗi yêu cầu (0100000001, 0100000002, v.v.)
   - Điền các trường bắt buộc
4. Sau lần gửi thứ 10, gửi yêu cầu thứ 11
5. Quan sát phản hồi
6. Kiểm tra lỗi rate limit (429 Too Many Requests)
7. Đợi thời gian cooldown (nếu có thể cấu hình)
8. Thử gửi lại sau cooldown

**Kết Quả Mong Đợi:**
- ✅ 10 yêu cầu đầu tiên thành công
- ✅ Yêu cầu thứ 11 bị chặn với lỗi rate limit
- ✅ Thông báo lỗi: "Vượt quá giới hạn. Tối đa 10 yêu cầu mỗi giờ mỗi IP."
- ✅ Mã trạng thái HTTP: 429 Too Many Requests
- ✅ Sau thời gian cooldown, yêu cầu được phép lại

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số Rate Limit:**
- Yêu cầu thành công: ___ / 10
- Yêu cầu thứ 11 bị chặn: [ ] Có [ ] Không
- Mã lỗi nhận được: ___
- Thời gian cooldown: ___ phút

**Bằng Chứng:**
- Screenshot của lỗi rate limit: _____________
- Phản hồi network hiển thị 429: _____________

**Ghi Chú:**

---

## Danh Mục Test 6: Hệ Thống Thông Báo Email (Story 1.15)

**Tests:** 4
**Ưu Tiên:** MỨC CAO
**Tiêu Chí Pass:** Tất cả 4 tests phải pass

### FT-6.1: Email Thay Đổi Trạng Thái Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh thông báo email được xếp hàng đợi khi thay đổi trạng thái phiếu dịch vụ

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Tạo phiếu dịch vụ mới cho khách hàng có email
3. Cập nhật trạng thái phiếu dịch vụ thành "in_progress"
4. Kiểm tra bảng email_notifications
5. Cập nhật trạng thái phiếu dịch vụ thành "completed"
6. Kiểm tra bảng email_notifications lại
7. Xác minh trong database:

```sql
-- Kiểm tra thông báo email cho phiếu dịch vụ
SELECT template_type, recipient, status, created_at
FROM email_notifications
WHERE reference_id = '[TICKET_ID]'
ORDER BY created_at DESC;
-- Nên thấy 2 email: status_update (in_progress), status_update (completed)
```

**Kết Quả Mong Đợi:**
- ✅ Email được xếp hàng đợi khi trạng thái thay đổi thành "in_progress"
- ✅ Email được xếp hàng đợi khi trạng thái thay đổi thành "completed"
- ✅ Mỗi email có template_type chính xác
- ✅ Người nhận là email khách hàng
- ✅ Trạng thái là "pending" hoặc "sent"
- ✅ Nội dung email bao gồm số phiếu dịch vụ và trạng thái mới

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chi Tiết Email:**
- Email được xếp hàng đợi: ___ / 2
- Loại template: _____________
- Người nhận: _____________

**Bằng Chứng:**
- SQL output: _____________

**Ghi Chú:**

---

### FT-6.2: Chức Năng Hủy Đăng Ký
**Mục Tiêu:** Xác minh khách hàng có thể hủy đăng ký thông báo email

**Các Bước Kiểm Thử:**
1. Lấy token hủy đăng ký cho khách hàng
2. Mở URL hủy đăng ký: `/unsubscribe/[TOKEN]`
3. Trang hủy đăng ký hiển thị
4. Nhấp "Xác Nhận Hủy Đăng Ký"
5. Xác minh thông báo thành công
6. Tạo phiếu dịch vụ mới cho khách hàng đã hủy đăng ký
7. Cập nhật trạng thái phiếu dịch vụ
8. Kiểm tra bảng email_notifications
9. Xác minh trong database:

```sql
-- Kiểm tra khách hàng đã hủy đăng ký
SELECT email, email_notifications_enabled
FROM customers
WHERE id = '[CUSTOMER_ID]';
-- email_notifications_enabled nên là false

-- Kiểm tra không có email được xếp hàng đợi
SELECT COUNT(*) as email_count
FROM email_notifications
WHERE recipient = '[CUSTOMER_EMAIL]'
  AND created_at > '[UNSUBSCRIBE_TIME]';
-- Nên là 0
```

**Kết Quả Mong Đợi:**
- ✅ Trang hủy đăng ký có thể truy cập với token hợp lệ
- ✅ Nút xác nhận hiển thị
- ✅ Sau xác nhận, thông báo thành công hiển thị
- ✅ email_notifications_enabled của khách hàng được đặt thành false
- ✅ Không có email tiếp theo được xếp hàng đợi cho khách hàng đã hủy đăng ký
- ✅ Token không hợp lệ hiển thị thông báo lỗi

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chi Tiết Hủy Đăng Ký:**
- Khách hàng đã hủy đăng ký: [ ] Có [ ] Không
- Email bị chặn sau khi hủy đăng ký: [ ] Có [ ] Không

**Bằng Chứng:**
- Screenshot của trang hủy đăng ký: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-6.3: Nhật Ký Email Admin
**Mục Tiêu:** Xác minh admin có thể xem tất cả thông báo email

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Điều hướng đến `/dashboard/notifications` hoặc trang nhật ký email
3. Quan sát danh sách email
4. Xác minh các cột hiển thị:
   - Người Nhận
   - Loại Template
   - Trạng Thái (Pending/Sent/Failed)
   - Ngày Tạo
   - Ngày Gửi (nếu đã gửi)
5. Tìm kiếm/lọc theo email người nhận
6. Tìm kiếm/lọc theo loại template
7. Kiểm tra phân trang (nếu có nhiều email)

**Kết Quả Mong Đợi:**
- ✅ Trang nhật ký email có thể truy cập cho Admin
- ✅ Tất cả email hiển thị trong bảng
- ✅ Mỗi email hiển thị: người nhận, loại template, trạng thái, ngày tháng
- ✅ Tìm kiếm/lọc hoạt động chính xác
- ✅ Phân trang hoạt động (nếu có)
- ✅ Trạng thái chỉ báo rõ ràng: pending (xám), sent (xanh), failed (đỏ)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số Nhật Ký Email:**
- Tổng email hiển thị: ___
- Chức năng lọc: [ ] Hoạt Động [ ] Không Hoạt Động
- Phân trang: [ ] Hoạt Động [ ] N/A

**Bằng Chứng:**
- Screenshot của trang nhật ký email: _____________

**Ghi Chú:**

---

### FT-6.4: Xem Trước Email
**Mục Tiêu:** Xác minh admin có thể xem trước nội dung email

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Điều hướng đến trang nhật ký email
3. Tìm email trong danh sách
4. Nhấp nút "Xem" hoặc "Xem Trước"
5. Modal xem trước email mở
6. Xác minh nội dung hiển thị:
   - Dòng chủ đề
   - Nội dung email (HTML hoặc text được định dạng)
   - Người nhận
   - Loại template
   - Ngày/giờ gửi
7. Đóng modal
8. Xem trước email khác với loại template khác

**Kết Quả Mong Đợi:**
- ✅ Nút "Xem" có sẵn cho mỗi email
- ✅ Modal mở hiển thị nội dung email
- ✅ Dòng chủ đề hiển thị
- ✅ Nội dung email được định dạng chính xác
- ✅ Tất cả biến email được thay thế (ví dụ: {{ticket_number}}, {{customer_name}})
- ✅ Liên kết hủy đăng ký có trong footer email
- ✅ Modal có thể đóng

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của modal xem trước email: _____________

**Ghi Chú:**

---

## Danh Mục Test 7: Bảng Điều Khiển Tiến Độ Công Việc Quản Lý (Story 1.16)

**Tests:** 4
**Ưu Tiên:** MỨC CAO
**Tiêu Chí Pass:** Tất cả 4 tests phải pass

### FT-7.1: Xem Chỉ Số Bảng Điều Khiển
**Mục Tiêu:** Xác minh bảng điều khiển quản lý hiển thị các chỉ số chính

**Các Bước Kiểm Thử:**
1. Chuẩn bị dữ liệu test:
   - Tạo 5 phiếu dịch vụ với công việc ở các trạng thái khác nhau
   - 2 phiếu dịch vụ với công việc "in_progress"
   - 1 phiếu dịch vụ với công việc bị chặn
   - 2 phiếu dịch vụ với công việc đã hoàn thành
2. Đăng nhập với Manager (manager@example.com)
3. Điều hướng đến `/dashboard/task-progress`
4. Quan sát các thẻ chỉ số
5. Xác minh chỉ số hiển thị:
   - Phiếu Dịch Vụ Hoạt Động (phiếu dịch vụ với công việc in_progress)
   - Công Việc Đang Thực Hiện (số lượng)
   - Công Việc Bị Chặn (số lượng)
   - Thời Gian Hoàn Thành Trung Bình (nếu có thể tính toán)
6. Xác minh số lượng khớp với dữ liệu test

**Kết Quả Mong Đợi:**
- ✅ Trang bảng điều khiển tải thành công
- ✅ 4 thẻ chỉ số hiển thị nổi bật
- ✅ Số Phiếu Dịch Vụ Hoạt Động: 2 (hoặc khớp với dữ liệu test)
- ✅ Số Công Việc Đang Thực Hiện: khớp với số lượng thực tế
- ✅ Số Công Việc Bị Chặn: 1 (hoặc khớp với dữ liệu test)
- ✅ Thời Gian Hoàn Thành Trung Bình hiển thị hoặc "N/A"
- ✅ Chỉ số được tính toán theo thời gian thực từ database

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số Quan Sát:**
- Phiếu Dịch Vụ Hoạt Động: ___
- Công Việc Đang Thực Hiện: ___
- Công Việc Bị Chặn: ___
- Thời Gian Hoàn Thành TB: ___

**Bằng Chứng:**
- Screenshot của chỉ số bảng điều khiển: _____________

**Ghi Chú:**

---

### FT-7.2: Phần Cảnh Báo Công Việc Bị Chặn
**Mục Tiêu:** Xác minh công việc bị chặn được làm nổi bật trong phần cảnh báo

**Các Bước Kiểm Thử:**
1. Đảm bảo ít nhất 1 công việc bị chặn (từ FT-2.3)
2. Đăng nhập với Manager
3. Điều hướng đến `/dashboard/task-progress`
4. Cuộn đến phần "Cảnh Báo Công Việc Bị Chặn"
5. Xác minh phần hiển thị:
   - Số phiếu dịch vụ
   - Tiêu đề công việc
   - Lý do bị chặn
   - Ngày bị chặn
   - Kỹ thuật viên được phân công
6. Nhấp vào phiếu dịch vụ để điều hướng đến chi tiết phiếu dịch vụ
7. Bỏ chặn công việc (hoặc hoàn thành nó)
8. Quay lại bảng điều khiển
9. Xác minh phần cảnh báo cập nhật (công việc bị chặn đã xóa)

**Kết Quả Mong Đợi:**
- ✅ Phần "Cảnh Báo Công Việc Bị Chặn" hiển thị
- ✅ Hiển thị tất cả công việc hiện đang bị chặn
- ✅ Mỗi mục hiển thị: số phiếu dịch vụ, tiêu đề công việc, lý do, ngày, kỹ thuật viên
- ✅ Chỉ báo trực quan (biểu tượng cảnh báo, màu đỏ/cam)
- ✅ Có thể nhấp để điều hướng đến phiếu dịch vụ
- ✅ Cập nhật theo thời gian thực khi công việc bỏ chặn

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chi Tiết Công Việc Bị Chặn:**
- Số lượng hiển thị: ___
- Chi tiết hiển thị: [ ] Đầy Đủ [ ] Không Đầy Đủ

**Bằng Chứng:**
- Screenshot của cảnh báo công việc bị chặn: _____________
- Screenshot sau khi bỏ chặn: _____________

**Ghi Chú:**

---

### FT-7.3: Bảng Khối Lượng Công Việc Kỹ Thuật Viên
**Mục Tiêu:** Xác minh thống kê khối lượng công việc kỹ thuật viên được hiển thị

**Các Bước Kiểm Thử:**
1. Đảm bảo nhiều kỹ thuật viên có công việc được phân công
2. Đăng nhập với Manager
3. Điều hướng đến `/dashboard/task-progress`
4. Cuộn đến bảng "Khối Lượng Công Việc Kỹ Thuật Viên"
5. Xác minh các cột bảng:
   - Tên Kỹ Thuật Viên
   - Công Việc Hoạt Động (số lượng in_progress)
   - Công Việc Chờ Xử Lý (đã phân công nhưng chưa bắt đầu)
   - Công Việc Đã Hoàn Thành (số lượng)
   - Tỷ Lệ Hoàn Thành (đã hoàn thành / tổng)
6. Xác minh tất cả kỹ thuật viên được liệt kê
7. Kiểm tra tính toán chính xác
8. Xác minh trong database:

```sql
-- Tính toán khối lượng công việc theo kỹ thuật viên
SELECT
  p.full_name,
  COUNT(CASE WHEN stt.status = 'in_progress' THEN 1 END) as active_tasks,
  COUNT(CASE WHEN stt.status = 'pending' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN stt.status = 'completed' THEN 1 END) as completed_tasks,
  ROUND(
    COUNT(CASE WHEN stt.status = 'completed' THEN 1 END)::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100,
    2
  ) as completion_rate
FROM profiles p
LEFT JOIN service_ticket_tasks stt ON stt.assigned_to = p.id
WHERE p.role = 'technician'
GROUP BY p.id, p.full_name
ORDER BY active_tasks DESC;
```

**Kết Quả Mong Đợi:**
- ✅ Bảng khối lượng công việc hiển thị tất cả kỹ thuật viên
- ✅ Mỗi hàng hiển thị: tên, số lượng hoạt động, chờ xử lý, đã hoàn thành
- ✅ Tỷ lệ hoàn thành được tính toán chính xác (phần trăm)
- ✅ Bảng có thể sắp xếp theo các cột
- ✅ Số lượng khớp với kết quả truy vấn database
- ✅ Kỹ thuật viên không có công việc hiển thị số lượng 0

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Xác Minh Bảng Khối Lượng Công Việc:**
- Kỹ thuật viên được liệt kê: ___
- Tính toán chính xác: [ ] Có [ ] Không

**Bằng Chứng:**
- Screenshot của bảng khối lượng công việc: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-7.4: Tự Động Làm Mới Bảng Điều Khiển
**Mục Tiêu:** Xác minh dữ liệu bảng điều khiển tự động làm mới

**Các Bước Kiểm Thử:**
1. Đăng nhập với Manager
2. Mở `/dashboard/task-progress`
3. Ghi nhận chỉ số hiện tại (Phiếu Dịch Vụ Hoạt Động, Công Việc Đang Thực Hiện, v.v.)
4. Trong tab trình duyệt khác, đăng nhập với Technician
5. Bắt đầu công việc mới
6. Quay lại tab bảng điều khiển Manager
7. Đợi khoảng thời gian tự động làm mới (ví dụ: 30 giây)
8. Quan sát chỉ số cập nhật mà không cần làm mới trang thủ công
9. Kiểm tra console trình duyệt để tìm nhật ký làm mới (nếu có triển khai)

**Kết Quả Mong Đợi:**
- ✅ Bảng điều khiển tự động làm mới mỗi 30-60 giây
- ✅ Chỉ số cập nhật để phản ánh trạng thái công việc mới
- ✅ Không tải lại toàn bộ trang (cập nhật mượt mà)
- ✅ Người dùng không bị gián đoạn trong khi làm mới
- ✅ Chỉ báo trực quan thời gian làm mới lần cuối (tùy chọn)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chi Tiết Tự Động Làm Mới:**
- Khoảng thời gian làm mới: ___ giây
- Chỉ số đã cập nhật: [ ] Có [ ] Không
- Cập nhật mượt mà: [ ] Có [ ] Không

**Bằng Chứng:**
- Screenshot trước khi làm mới: _____________
- Screenshot sau khi làm mới: _____________

**Ghi Chú:**

---

## Danh Mục Test 8: Chuyển Đổi Mẫu Động (Story 1.17)

**Tests:** 5
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** Tất cả 5 tests phải pass

### FT-8.1: Chuyển Đổi Mẫu Giữa Dịch Vụ
**Mục Tiêu:** Xác minh kỹ thuật viên có thể chuyển đổi mẫu trong quá trình dịch vụ

**Các Bước Kiểm Thử:**
1. Tạo phiếu dịch vụ với mẫu "Warranty Service" (3 công việc)
2. Phân công cho technician@example.com
3. Đăng nhập với Technician
4. Hoàn thành công việc đầu tiên: "Initial Diagnosis"
5. Thêm ghi chú hoàn thành: "Discovered issue requires paid repair instead of warranty"
6. Nhấp nút "Chuyển Đổi Mẫu"
7. Modal chuyển đổi mẫu mở
8. Chọn mẫu "Paid Repair"
9. Xem trước hiển thị tất cả công việc từ mẫu mới
10. Nhập lý do: "Customer issue not covered under warranty - requires motherboard replacement"
11. Xác nhận chuyển đổi
12. Xác minh thông báo thành công
13. Quan sát danh sách công việc cập nhật
14. Kiểm tra database:

```sql
-- Kiểm tra thay đổi mẫu được ghi lại
SELECT ticket_id, old_template_id, new_template_id, reason,
       tasks_before, tasks_after, completed_tasks_preserved, changed_by
FROM ticket_template_changes
WHERE ticket_id = '[TICKET_ID]'
ORDER BY changed_at DESC
LIMIT 1;

-- Kiểm tra công việc cập nhật
SELECT title, task_order, status
FROM service_ticket_tasks
WHERE service_ticket_id = '[TICKET_ID]'
ORDER BY task_order;
-- Nên hiển thị: công việc đã hoàn thành được bảo tồn + công việc mới từ mẫu mới
```

**Kết Quả Mong Đợi:**
- ✅ Nút "Chuyển Đổi Mẫu" hiển thị trên phiếu dịch vụ đang thực hiện
- ✅ Modal hiển thị tất cả mẫu có sẵn
- ✅ Xem trước hiển thị công việc từ mẫu đã chọn
- ✅ Trường lý do xác thực (tối thiểu 10 ký tự)
- ✅ Mẫu chuyển đổi thành công
- ✅ Công việc đã hoàn thành được bảo tồn (vẫn hiển thị là đã hoàn thành)
- ✅ Công việc mới được thêm từ mẫu mới
- ✅ Bản ghi kiểm toán được tạo trong ticket_template_changes
- ✅ Thông báo thành công hiển thị

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chi Tiết Chuyển Đổi Mẫu:**
- Mẫu cũ: _____________
- Mẫu mới: _____________
- Công việc trước: ___
- Công việc sau: ___
- Đã hoàn thành được bảo tồn: ___

**Bằng Chứng:**
- Screenshot của modal chuyển đổi: _____________
- Screenshot của xem trước mẫu: _____________
- Screenshot của danh sách công việc cập nhật: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-8.2: Xem Trước Mẫu trong Modal Chuyển Đổi
**Mục Tiêu:** Xác minh xem trước mẫu hiển thị tất cả công việc trước khi chuyển đổi

**Các Bước Kiểm Thử:**
1. Tiếp tục từ FT-8.1 hoặc tạo phiếu dịch vụ đang thực hiện mới
2. Nhấp "Chuyển Đổi Mẫu"
3. Chọn mẫu khác từ dropdown
4. Quan sát phần xem trước
5. Xác minh xem trước hiển thị:
   - Tên mẫu
   - Loại dịch vụ
   - Tất cả công việc với số thứ tự
   - Tiêu đề công việc
   - Trình tự mong đợi
6. Chọn mẫu khác
7. Xác minh xem trước cập nhật ngay lập tức

**Kết Quả Mong Đợi:**
- ✅ Phần xem trước hiển thị trong modal
- ✅ Xem trước cập nhật khi thay đổi lựa chọn mẫu
- ✅ Tất cả công việc từ mẫu đã chọn được hiển thị
- ✅ Thứ tự công việc hiển thị chính xác
- ✅ Tên mẫu và loại dịch vụ hiển thị
- ✅ Không có độ trễ trong cập nhật xem trước

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của xem trước mẫu: _____________

**Ghi Chú:**

---

### FT-8.3: Kiểm Toán cho Thay Đổi Mẫu
**Mục Tiêu:** Xác minh thay đổi mẫu được ghi nhật ký để kiểm toán

**Các Bước Kiểm Thử:**
1. Sử dụng phiếu dịch vụ từ FT-8.1 nơi mẫu đã được chuyển đổi
2. Đăng nhập với Admin hoặc Manager
3. Điều hướng đến trang chi tiết phiếu dịch vụ
4. Tìm phần "Lịch Sử Thay Đổi Mẫu" hoặc nhật ký kiểm toán
5. Xác minh thông tin hiển thị:
   - Ngày/giờ thay đổi
   - Người thay đổi (tên kỹ thuật viên)
   - Tên mẫu cũ
   - Tên mẫu mới
   - Lý do thay đổi
   - Số lượng công việc (trước/sau)
6. Xác minh trong database:

```sql
-- Kiểm tra kiểm toán
SELECT
  ttc.changed_at,
  p.full_name as changed_by,
  old_tt.name as old_template,
  new_tt.name as new_template,
  ttc.reason,
  ttc.tasks_before,
  ttc.tasks_after,
  ttc.completed_tasks_preserved
FROM ticket_template_changes ttc
JOIN profiles p ON p.id = ttc.changed_by
JOIN task_templates old_tt ON old_tt.id = ttc.old_template_id
JOIN task_templates new_tt ON new_tt.id = ttc.new_template_id
WHERE ttc.ticket_id = '[TICKET_ID]'
ORDER BY ttc.changed_at DESC;
```

**Kết Quả Mong Đợi:**
- ✅ Kiểm toán hiển thị trong UI
- ✅ Tất cả thay đổi mẫu được ghi nhật ký
- ✅ Chi tiết thay đổi bao gồm: ai, khi nào, cái gì, tại sao
- ✅ Lý do hiển thị trong nhật ký kiểm toán
- ✅ Số lượng công việc hiển thị (trước/sau)
- ✅ Database ghi lại kiểm toán đầy đủ
- ✅ Thay đổi không thể thay đổi (không thể xóa)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của kiểm toán trong UI: _____________
- SQL output: _____________

**Ghi Chú:**

---

### FT-8.4: Xác Thực - Không Thể Chuyển Đổi Trên Phiếu Dịch Vụ Đã Hoàn Thành
**Mục Tiêu:** Xác minh hệ thống ngăn chặn chuyển đổi mẫu trên phiếu dịch vụ đã hoàn thành

**Các Bước Kiểm Thử:**
1. Tạo phiếu dịch vụ mới với bất kỳ mẫu nào
2. Hoàn thành tất cả công việc trên phiếu dịch vụ
3. Xác minh trạng thái phiếu dịch vụ là "completed"
4. Thử nhấp nút "Chuyển Đổi Mẫu"
5. Quan sát trạng thái nút (nên bị vô hiệu hóa hoặc không hiển thị)
6. Hoặc, thử truy cập chuyển đổi mẫu qua API/URL manipulation
7. Xác minh phản hồi lỗi

**Kết Quả Mong Đợi:**
- ✅ Nút "Chuyển Đổi Mẫu" bị vô hiệu hóa trên phiếu dịch vụ đã hoàn thành
- ✅ Hoặc nút không hiển thị
- ✅ Tooltip giải thích: "Không thể chuyển đổi mẫu trên phiếu dịch vụ đã hoàn thành"
- ✅ Cuộc gọi API trực tiếp trả về lỗi: "Không cho phép chuyển đổi mẫu trên phiếu dịch vụ đã hoàn thành"
- ✅ Trạng thái HTTP: 400 Bad Request hoặc 422 Unprocessable Entity

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot hiển thị nút bị vô hiệu hóa: _____________
- Thông báo lỗi: _____________

**Ghi Chú:**

---

### FT-8.5: Xác Thực - Không Thể Chuyển Đổi Khi Tất Cả Công Việc Hoàn Thành
**Mục Tiêu:** Xác minh hệ thống ngăn chặn chuyển đổi khi tất cả công việc hiện tại đã hoàn thành

**Các Bước Kiểm Thử:**
1. Tạo phiếu dịch vụ với mẫu (3 công việc)
2. Hoàn thành tất cả 3 công việc
3. Trước khi phiếu dịch vụ tự động chuyển sang "completed"
4. Thử nhấp nút "Chuyển Đổi Mẫu"
5. Quan sát trạng thái nút hoặc thông báo lỗi
6. Xác minh logic xác thực

**Kết Quả Mong Đợi:**
- ✅ Hệ thống ngăn chặn chuyển đổi mẫu khi tất cả công việc đã hoàn thành
- ✅ Thông báo lỗi: "Không thể chuyển đổi mẫu khi tất cả công việc đã hoàn thành"
- ✅ Gợi ý: "Hoàn thành phiếu dịch vụ hoặc bỏ chặn công việc để tiếp tục"
- ✅ Xác thực ngăn chặn chuyển đổi mẫu vô nghĩa

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của lỗi xác thực: _____________

**Ghi Chú:**

---

## Tóm Tắt Test Chấp Nhận Tính Năng

| Story | Test IDs | Tổng | Đã Thực Hiện | Pass | Fail | Bị Chặn | Tỷ Lệ Pass |
|-------|----------|------|--------------|------|------|---------|------------|
| 1.2 - Mẫu Công Việc | FT-1.1 đến FT-1.4 | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.4 - Thực Hiện Công Việc | FT-2.1 đến FT-2.4 | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.5 - Phụ Thuộc | FT-3.1 đến FT-3.3 | 3 | ___ | ___ | ___ | ___ | ___% |
| 1.6-1.10 - Kho | FT-4.1 đến FT-4.4 | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.11-1.14 - Cổng Công Khai | FT-5.1 đến FT-5.5 | 5 | ___ | ___ | ___ | ___ | ___% |
| 1.15 - Hệ Thống Email | FT-6.1 đến FT-6.4 | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.16 - Bảng Điều Khiển Quản Lý | FT-7.1 đến FT-7.4 | 4 | ___ | ___ | ___ | ___ | ___% |
| 1.17 - Chuyển Đổi Mẫu | FT-8.1 đến FT-8.5 | 5 | ___ | ___ | ___ | ___ | ___% |
| **TỔNG** | **FT-1.1 đến FT-8.5** | **88** | **___** | **___** | **___** | **___** | **___%** |

**Tiêu Chí Pass:** Tỷ lệ pass ≥95% = 84+ tests phải pass
**Lỗi Nghiêm Trọng:** ___ (phải bằng không cho tests P0)

---

## Đánh Giá Cuối Cùng

**Tỷ Lệ Pass Tổng Thể:** ___% (Mục tiêu: ≥95%)

**Kết Quả:** [ ] CHẤP THUẬN [ ] TỪ CHỐI

**Vấn Đề Nghiêm Trọng Tìm Thấy:** ___

**Khuyến Nghị:**

---

## Ký Duyệt

**Người Kiểm Thử:** _______________ Ngày: _______________
**Trưởng Nhóm QA:** _______________ Ngày: _______________
**Phê Duyệt:** [ ] PASS - Tiến hành danh mục test tiếp theo [ ] FAIL - Sửa lỗi và kiểm thử lại

---

**Bước Tiếp Theo:**
- Nếu TẤT CẢ PASS: Tiến hành Checklist Kiểm Thử Hồi Quy
- Nếu BẤT KỲ FAIL: Ghi nhật ký lỗi, sửa, kiểm thử lại các trường hợp thất bại

**Tài Liệu Tham Khảo:**
- Kế Hoạch Kiểm Thử: docs/KE_HOACH_KIEM_THU.md
- Master Tracker: docs/qa/test-execution/BANG_THEO_DOI_THUC_HIEN_KIEM_THU.md
- Cổng Chất Lượng: docs/qa/gates/epic-01-phase2-quality-gate.yaml
