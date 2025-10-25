# Checklist Kiểm Thử Bảo Mật - EPIC-01 Giai Đoạn 2

**Ưu Tiên:** P0 - QUAN TRỌNG
**Tiêu Chí Pass:** Tỷ lệ pass 100% (KHÔNG CHO PHÉP LỖI)
**Thời Gian Ước Tính:** 3-4 giờ
**Tổng Số Tests:** 12

**⚠️ QUAN TRỌNG:** Tất cả test bảo mật phải pass. Bất kỳ lỗi nào cũng là CHẶN TRIỂN KHAI.

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
- [ ] Phiếu dịch vụ test đã tạo
- [ ] Khách hàng test đã tạo
- [ ] Mẫu test đã tạo

---

## Danh Mục Test 1: Row Level Security (RLS) Policies

**Tests:** 5
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** 100% (5/5 phải pass)

### SEC-1.1: Vai Trò Quản Trị Viên - Truy Cập Toàn Bộ Tất Cả Bảng
**Mục Tiêu:** Xác minh admin có thể truy cập tất cả bản ghi trong tất cả bảng Giai Đoạn 2

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin (admin@example.com)
2. Mở Supabase Studio → SQL Editor
3. Thực thi các truy vấn sau:

```sql
-- Test 1: bảng task_templates
SELECT COUNT(*) FROM task_templates;
-- Mong đợi: Trả về số lượng (không có lỗi)

-- Test 2: bảng service_ticket_tasks
SELECT COUNT(*) FROM service_ticket_tasks;
-- Mong đợi: Trả về số lượng (không có lỗi)

-- Test 3: bảng warehouses
SELECT COUNT(*) FROM warehouses;
-- Mong đợi: Trả về số lượng (không có lỗi)

-- Test 4: bảng physical_products
SELECT COUNT(*) FROM physical_products;
-- Mong đợi: Trả về số lượng (không có lỗi)

-- Test 5: bảng rma_batches
SELECT COUNT(*) FROM rma_batches;
-- Mong đợi: Trả về số lượng (không có lỗi)
```

4. Điều hướng đến `/workflows/templates` trong ứng dụng
5. Xác minh mẫu hiển thị và có thể chỉnh sửa
6. Điều hướng đến `/warehouses`
7. Xác minh kho hiển thị và có thể chỉnh sửa

**Kết Quả Mong Đợi:**
- ✅ Tất cả truy vấn SQL trả về kết quả (không có lỗi RLS)
- ✅ Tất cả trang UI có thể truy cập
- ✅ Có thể tạo/chỉnh sửa/xóa bản ghi

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot: _____________
- SQL output: _____________

**Ghi Chú:**

---

### SEC-1.2: Vai Trò Quản Lý - Truy Cập Chỉ Đọc Mẫu
**Mục Tiêu:** Xác minh quản lý không thể sửa đổi mẫu công việc

**Các Bước Kiểm Thử:**
1. Đăng nhập với Manager (manager@example.com)
2. Điều hướng đến `/workflows/templates`
3. Thử nhấp nút "Mẫu Mới"
4. Thử chỉnh sửa mẫu hiện có
5. Mở Supabase Studio SQL Editor (với vai trò manager)
6. Thực thi:

```sql
-- Thử tạo mẫu (nên thất bại)
INSERT INTO task_templates (name, service_type, enforce_sequence)
VALUES ('Test Template', 'warranty', true);
-- Mong đợi: Lỗi RLS policy

-- Thử cập nhật mẫu (nên thất bại)
UPDATE task_templates SET name = 'Modified' WHERE id = (SELECT id FROM task_templates LIMIT 1);
-- Mong đợi: Lỗi RLS policy
```

**Kết Quả Mong Đợi:**
- ✅ UI ngăn chặn tạo mẫu (nút bị vô hiệu hóa hoặc không hiển thị)
- ✅ UI ngăn chặn chỉnh sửa mẫu (chế độ chỉ đọc)
- ✅ SQL INSERT thất bại với lỗi RLS policy
- ✅ SQL UPDATE thất bại với lỗi RLS policy

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot UI: _____________
- Thông báo lỗi SQL: _____________

**Ghi Chú:**

---

### SEC-1.3: Vai Trò Kỹ Thuật Viên - Chỉ Xem Công Việc Của Mình
**Mục Tiêu:** Xác minh kỹ thuật viên chỉ có thể truy cập công việc được phân công cho họ

**Các Bước Kiểm Thử:**
1. Tạo 2 phiếu dịch vụ test với công việc
2. Phân công công việc trên Phiếu #1 cho technician@example.com
3. Phân công công việc trên Phiếu #2 cho người dùng khác
4. Đăng nhập với Technician (technician@example.com)
5. Điều hướng đến `/my-tasks`
6. Xác minh chỉ công việc từ Phiếu #1 hiển thị
7. Mở Supabase Studio SQL Editor
8. Thực thi:

```sql
-- Nên chỉ thấy công việc của mình
SELECT COUNT(*) FROM service_ticket_tasks WHERE assigned_to = auth.uid();
-- Mong đợi: Trả về số lượng công việc của mình

-- Thử truy cập tất cả công việc (nên được lọc bởi RLS)
SELECT COUNT(*) FROM service_ticket_tasks;
-- Mong đợi: Cùng số lượng như trên (RLS lọc tự động)
```

**Kết Quả Mong Đợi:**
- ✅ Trang Công Việc Của Tôi chỉ hiển thị công việc được phân công
- ✅ Không thể xem công việc được phân công cho người khác
- ✅ Truy vấn SQL tự động lọc bởi RLS
- ✅ Không thể truy vấn thủ công công việc của người dùng khác

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot trang Công Việc Của Tôi: _____________
- SQL output: _____________
- Xác minh số lượng công việc: Của mình: ___ Tổng hiển thị: ___

**Ghi Chú:**

---

### SEC-1.4: Vai Trò Lễ Tân - Không Thể Truy Cập Tính Năng Quy Trình
**Mục Tiêu:** Xác minh lễ tân không thể truy cập trang quy trình công việc

**Các Bước Kiểm Thử:**
1. Đăng nhập với Reception (reception@example.com)
2. Thử điều hướng đến `/workflows/templates`
3. Thử điều hướng đến `/my-tasks`
4. Kiểm tra điều hướng sidebar
5. Mở Supabase Studio SQL Editor
6. Thực thi:

```sql
-- Thử truy cập task templates (nên thất bại hoặc trả về rỗng)
SELECT COUNT(*) FROM task_templates;
-- Mong đợi: RLS ngăn chặn truy cập hoặc trả về 0

-- Thử truy cập service_ticket_tasks
SELECT COUNT(*) FROM service_ticket_tasks;
-- Mong đợi: RLS ngăn chặn truy cập hoặc trả về 0
```

**Kết Quả Mong Đợi:**
- ✅ `/workflows/templates` trả về 403 Forbidden hoặc chuyển hướng
- ✅ `/my-tasks` trả về 403 Forbidden hoặc chuyển hướng
- ✅ Sidebar không hiển thị menu "Quy Trình"
- ✅ Truy vấn SQL bị chặn bởi RLS hoặc trả về 0 kết quả

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot thử điều hướng: _____________
- Lỗi SQL: _____________

**Ghi Chú:**

---

### SEC-1.5: Truy Cập Không Xác Thực - RLS Chặn Tất Cả Bảng Nội Bộ
**Mục Tiêu:** Xác minh người dùng ẩn danh không thể truy cập dữ liệu nội bộ

**Các Bước Kiểm Thử:**
1. Đăng xuất khỏi ứng dụng
2. Mở Supabase Studio (hoặc sử dụng cuộc gọi API ẩn danh)
3. Thực thi:

```sql
-- Thử truy cập task templates (nên thất bại)
SELECT * FROM task_templates;
-- Mong đợi: Lỗi RLS hoặc yêu cầu xác thực

-- Thử truy cập service tickets (nên thất bại)
SELECT * FROM service_tickets;
-- Mong đợi: Lỗi RLS hoặc yêu cầu xác thực

-- Thử truy cập warehouses (nên thất bại)
SELECT * FROM warehouses;
-- Mong đợi: Lỗi RLS hoặc yêu cầu xác thực
```

4. Thử truy cập `/dashboard` mà không đăng nhập
5. Thử truy cập `/workflows/templates` mà không đăng nhập

**Kết Quả Mong Đợi:**
- ✅ Tất cả truy vấn SQL trả về lỗi RLS policy
- ✅ Dashboard chuyển hướng đến đăng nhập
- ✅ Trang Workflows chuyển hướng đến đăng nhập
- ✅ Không có dữ liệu nội bộ bị lộ cho người dùng ẩn danh

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Lỗi SQL: _____________
- Hành vi chuyển hướng: _____________

**Ghi Chú:**

---

## Danh Mục Test 2: Xác Thực Đầu Vào & Phòng Chống XSS

**Tests:** 2
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** 100% (2/2 phải pass)

### SEC-2.1: Phòng Chống XSS - Trường Tên Mẫu
**Mục Tiêu:** Xác minh trường tên mẫu làm sạch các script độc hại

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Điều hướng đến `/workflows/templates`
3. Nhấp "Mẫu Mới"
4. Nhập các nội dung sau vào trường "Tên Mẫu":

```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
```

5. Điền các trường bắt buộc khác bình thường
6. Nhấp "Tạo Mẫu"
7. Điều hướng quay lại danh sách mẫu
8. Kiểm tra nếu tên mẫu hiển thị chính xác
9. Mở Browser DevTools Console
10. Kiểm tra thực thi cảnh báo XSS

**Kết Quả Mong Đợi:**
- ✅ Không có cảnh báo JavaScript thực thi
- ✅ Thẻ script được escape/làm sạch trong hiển thị
- ✅ Mẫu lưu với nội dung đã escape
- ✅ Không có lỗi trong console liên quan đến XSS

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot danh sách mẫu: _____________
- Console log: _____________
- Kiểm tra HTML source: _____________

**Ghi Chú:**

---

### SEC-2.2: Phòng Chống XSS - Mô Tả Yêu Cầu Dịch Vụ
**Mục Tiêu:** Xác minh cổng công khai làm sạch đầu vào người dùng

**Các Bước Kiểm Thử:**
1. Mở cổng công khai: `/service-request`
2. Điền form với các payload XSS trong mô tả:

```html
<script>alert('XSS')</script>
<iframe src="javascript:alert('XSS')"></iframe>
<body onload=alert('XSS')>
javascript:alert('XSS')
<img src=x onerror=alert(document.cookie)>
```

3. Gửi form
4. Lấy token theo dõi
5. Điều hướng đến `/service-request/track`
6. Nhập token theo dõi
7. Kiểm tra nếu các script độc hại thực thi
8. Đăng nhập với Reception
9. Điều hướng đến `/dashboard/service-requests`
10. Xem yêu cầu đã gửi
11. Kiểm tra nếu script thực thi trong giao diện admin

**Kết Quả Mong Đợi:**
- ✅ Không có cảnh báo JavaScript thực thi trên trang theo dõi
- ✅ Không có cảnh báo JavaScript thực thi trong giao diện admin
- ✅ Mã độc hại được escape/làm sạch
- ✅ Không có cookie hoặc dữ liệu nhạy cảm bị lộ
- ✅ Nội dung hiển thị dưới dạng plain text

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot trang theo dõi: _____________
- Screenshot giao diện admin: _____________
- HTML source: _____________

**Ghi Chú:**

---

## Danh Mục Test 3: Phòng Chống SQL Injection

**Tests:** 1
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** 100% (1/1 phải pass)

### SEC-3.1: SQL Injection - Đầu Vào Tìm Kiếm và Bộ Lọc
**Mục Tiêu:** Xác minh ứng dụng ngăn chặn các cuộc tấn công SQL injection

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Kiểm tra SQL injection trong các trường tìm kiếm/lọc khác nhau:

**Tìm Kiếm Mẫu:**
- Điều hướng đến `/workflows/templates`
- Nhập vào trường tìm kiếm: `'; DROP TABLE task_templates; --`
- Gửi tìm kiếm
- Xác minh bảng vẫn tồn tại

**Tìm Kiếm Phiếu Dịch Vụ:**
- Điều hướng đến `/tickets`
- Nhập vào trường tìm kiếm: `' OR '1'='1`
- Gửi tìm kiếm
- Xác minh chỉ kết quả được ủy quyền trả về

**Tìm Kiếm Khách Hàng:**
- Điều hướng đến `/customers`
- Nhập vào trường tìm kiếm: `admin' --`
- Gửi tìm kiếm
- Kiểm tra kết quả

**Bộ Lọc Lô RMA:**
- Điều hướng đến `/dashboard/inventory/rma`
- Thử lọc với: `' UNION SELECT * FROM profiles --`
- Gửi bộ lọc

3. Kiểm tra toàn vẹn database:

```sql
-- Xác minh các bảng quan trọng vẫn tồn tại
SELECT COUNT(*) FROM task_templates;
SELECT COUNT(*) FROM service_tickets;
SELECT COUNT(*) FROM profiles;
-- Mong đợi: Tất cả trả về số lượng (không bị xóa)
```

4. Kiểm tra application logs để tìm lỗi SQL

**Kết Quả Mong Đợi:**
- ✅ Không có bảng bị xóa hoặc sửa đổi
- ✅ Tìm kiếm trả về kết quả an toàn, mong đợi
- ✅ SQL độc hại không được thực thi
- ✅ Không có lỗi cú pháp SQL trong application logs
- ✅ Tham số hóa tRPC/Prisma ngăn chặn injection

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshots của các lần thử tìm kiếm: _____________
- Kiểm tra toàn vẹn database: _____________
- Application logs: _____________

**Ghi Chú:**

---

## Danh Mục Test 4: Bảo Vệ CSRF

**Tests:** 1
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** 100% (1/1 phải pass)

### SEC-4.1: Xác Thực Token CSRF trên Các Thao Tác Thay Đổi Trạng Thái
**Mục Tiêu:** Xác minh bảo vệ CSRF trên mutations

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Mở Browser DevTools → tab Network
3. Điều hướng đến `/workflows/templates`
4. Tạo mẫu mới
5. Bắt request trong tab Network
6. Sao chép request dưới dạng cURL
7. Đăng xuất khỏi ứng dụng
8. Mở cửa sổ ẩn danh mới
9. Thử replay request đã bắt bằng cURL hoặc Postman
10. Kiểm tra nếu thao tác thành công mà không có session hợp lệ

**Test thay thế (nếu tRPC bảo vệ tự động):**
1. Tạo file HTML bên ngoài với form:

```html
<html>
  <body>
    <form action="http://localhost:3025/api/trpc/workflow.template.create" method="POST">
      <input name="name" value="Malicious Template">
      <input type="submit" value="Submit">
    </form>
  </body>
</html>
```

2. Mở file trong trình duyệt (origin khác)
3. Gửi form
4. Kiểm tra nếu mẫu được tạo

**Kết Quả Mong Đợi:**
- ✅ Request replay thất bại (401 Unauthorized hoặc 403 Forbidden)
- ✅ Gửi form cross-origin bị chặn
- ✅ Không có mẫu độc hại được tạo
- ✅ Xác thực session Supabase ngăn chặn CSRF

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Kết quả replay request network: _____________
- Lỗi CORS (nếu có): _____________

**Ghi Chú:**

---

## Danh Mục Test 5: Rate Limiting

**Tests:** 2
**Ưu Tiên:** MỨC CAO
**Tiêu Chí Pass:** 100% (2/2 phải pass)

### SEC-5.1: Rate Limiting Cổng Công Khai (10 requests/giờ/IP)
**Mục Tiêu:** Xác minh cổng yêu cầu dịch vụ công khai thực thi rate limiting

**Các Bước Kiểm Thử:**
1. Xóa bất kỳ trạng thái rate limit hiện có (khởi động lại nếu cần)
2. Mở `/service-request` trong trình duyệt
3. Gửi 11 yêu cầu dịch vụ liên tiếp nhanh chóng (cùng IP, dữ liệu khác nhau)
4. Quan sát phản hồi ở request thứ 11
5. Kiểm tra lỗi rate limit
6. Đợi 1 giờ
7. Thử gửi lại
8. Xác minh request thành công sau cooldown

**Kết Quả Mong Đợi:**
- ✅ 10 request đầu tiên thành công
- ✅ Request thứ 11 thất bại với lỗi rate limit (429 Too Many Requests)
- ✅ Thông báo lỗi: "Vượt quá giới hạn. Tối đa 10 yêu cầu mỗi giờ mỗi IP."
- ✅ Sau 1 giờ cooldown, request thành công lại
- ✅ Theo dõi rate limit trong database (nếu có)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số:**
- Request thành công trước giới hạn: ___
- Request kích hoạt giới hạn: ___
- Mã lỗi nhận được: ___
- Cooldown đã xác minh: [ ] Có [ ] Không

**Bằng Chứng:**
- Screenshot lỗi rate limit: _____________
- Phản hồi network: _____________

**Ghi Chú:**

---

### SEC-5.2: Rate Limiting Email (100 emails/24h/khách hàng)
**Mục Tiêu:** Xác minh hệ thống email thực thi rate limiting mỗi khách hàng

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Tạo khách hàng test: test-rate-limit@example.com
3. Tạo 101 phiếu dịch vụ test cho khách hàng này liên tiếp nhanh chóng
4. Kiểm tra bảng email_notifications:

```sql
SELECT
  recipient,
  COUNT(*) as email_count,
  MAX(created_at) as last_email
FROM email_notifications
WHERE recipient = 'test-rate-limit@example.com'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY recipient;
-- Mong đợi: Số lượng nên là ≤ 100
```

5. Kiểm tra nếu rate limit ngăn chặn email thứ 101
6. Kiểm tra logs để tìm cảnh báo rate limit

**Kết Quả Mong Đợi:**
- ✅ Tối đa 100 email gửi đến khách hàng trong khoảng 24h
- ✅ Email thứ 101 bị chặn với rate limit
- ✅ Rate limit được ghi log trong bảng email_notifications (status='rate_limited')
- ✅ Không có email gửi vượt quá giới hạn

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chỉ Số:**
- Tổng email đã gửi: ___
- Email bị chặn bởi rate limit: ___
- Trạng thái rate limit trong DB: [ ] Đã Xác Minh [ ] Không Tìm Thấy

**Bằng Chứng:**
- Kết quả truy vấn SQL: _____________
- Screenshot nhật ký email: _____________

**Ghi Chú:**

---

## Danh Mục Test 6: Quản Lý Session

**Tests:** 1
**Ưu Tiên:** MỨC CAO
**Tiêu Chí Pass:** 100% (1/1 phải pass)

### SEC-6.1: Hết Hạn và Dọn Dẹp Session
**Mục Tiêu:** Xác minh session hết hạn chính xác và không thể tái sử dụng

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Mở Browser DevTools → Application → Cookies
3. Ghi nhận giá trị session cookie
4. Đăng xuất
5. Thử đặt lại giá trị cookie cũ thủ công
6. Điều hướng đến `/dashboard`
7. Kiểm tra nếu truy cập bị từ chối

**Test thay thế:**
1. Đăng nhập với Admin
2. Sao chép authentication token (nếu hiển thị trong local storage/cookies)
3. Đợi session timeout (hoặc vô hiệu hóa thủ công trong Supabase)
4. Thử sử dụng token đã hết hạn để truy cập route được bảo vệ
5. Xác minh truy cập bị từ chối

**Kết Quả Mong Đợi:**
- ✅ Sau khi đăng xuất, session cookie bị vô hiệu hóa
- ✅ Session cũ không thể tái sử dụng
- ✅ Session đã hết hạn chuyển hướng đến đăng nhập
- ✅ Không có dữ liệu nhạy cảm trong cookies/local storage sau khi đăng xuất
- ✅ Session Supabase được xóa đúng cách

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Kiểm tra cookie: _____________
- Screenshot truy cập bị từ chối: _____________

**Ghi Chú:**

---

## Tóm Tắt Test Bảo Mật

| Test ID | Tên Test | Ưu Tiên | Kết Quả | Vấn Đề Tìm Thấy |
|---------|----------|---------|---------|-----------------|
| SEC-1.1 | Admin Truy Cập Toàn Bộ | QUAN TRỌNG | [ ] PASS [ ] FAIL | |
| SEC-1.2 | Manager Chỉ Đọc | QUAN TRỌNG | [ ] PASS [ ] FAIL | |
| SEC-1.3 | Technician Công Việc Của Mình | QUAN TRỌNG | [ ] PASS [ ] FAIL | |
| SEC-1.4 | Reception Không Quy Trình | QUAN TRỌNG | [ ] PASS [ ] FAIL | |
| SEC-1.5 | Chặn Không Xác Thực | QUAN TRỌNG | [ ] PASS [ ] FAIL | |
| SEC-2.1 | XSS - Tên Mẫu | QUAN TRỌNG | [ ] PASS [ ] FAIL | |
| SEC-2.2 | XSS - Yêu Cầu Dịch Vụ | QUAN TRỌNG | [ ] PASS [ ] FAIL | |
| SEC-3.1 | SQL Injection | QUAN TRỌNG | [ ] PASS [ ] FAIL | |
| SEC-4.1 | Bảo Vệ CSRF | QUAN TRỌNG | [ ] PASS [ ] FAIL | |
| SEC-5.1 | Rate Limit Cổng Công Khai | MỨC CAO | [ ] PASS [ ] FAIL | |
| SEC-5.2 | Rate Limit Email | MỨC CAO | [ ] PASS [ ] FAIL | |
| SEC-6.1 | Quản Lý Session | MỨC CAO | [ ] PASS [ ] FAIL | |

**Tổng Số Tests:** 12
**Pass:** ___ / 12
**Fail:** ___ / 12
**Tỷ Lệ Pass:** ___%

---

## Đánh Giá Bảo Mật Cuối Cùng

**Tiêu Chí Pass:** Tỷ lệ pass 100% (12/12 tests phải pass)

**Kết Quả:** [ ] CHẤP THUẬN [ ] TỪ CHỐI

**Lỗi Nghiêm Trọng:** ___ (PHẢI BẰNG KHÔNG)

**Mối Quan Ngại Bảo Mật:**

**Khuyến Nghị:**

---

## Ký Duyệt

**Người Kiểm Thử:** _______________ Ngày: _______________
**Người Đánh Giá Bảo Mật:** _______________ Ngày: _______________
**Phê Duyệt:** [ ] PASS - Sẵn sàng triển khai [ ] FAIL - Vấn đề bảo mật phải được sửa

**⚠️ CHẶN TRIỂN KHAI:** Bất kỳ test bảo mật thất bại nào cũng chặn triển khai cho đến khi được sửa và kiểm thử lại.

---

**Bước Tiếp Theo:**
- Nếu TẤT CẢ PASS: Tiến hành Kiểm Thử Chấp Nhận Tính Năng
- Nếu BẤT KỲ FAIL: Ghi log lỗi nghiêm trọng, sửa ngay lập tức, kiểm thử lại tất cả test bảo mật

**Tài Liệu Tham Khảo:**
- Cổng Chất Lượng: docs/qa/gates/epic-01-phase2-quality-gate.yaml
- Kế Hoạch Kiểm Thử: docs/KE_HOACH_KIEM_THU.md (phần Kiểm Thử Bảo Mật)
- Master Tracker: docs/qa/test-execution/BANG_THEO_DOI_THUC_HIEN_KIEM_THU.md
