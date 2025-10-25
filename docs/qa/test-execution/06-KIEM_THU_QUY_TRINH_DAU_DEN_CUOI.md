# Danh Sách Kiểm Thử Quy Trình Đầu-Đến-Cuối - EPIC-01 Giai Đoạn 2

**Mức Độ Ưu Tiên:** P0 - QUAN TRỌNG
**Tiêu Chí Đạt:** Tỷ lệ đạt 100% (CẢ HAI kịch bản phải đạt)
**Thời Gian Ước Tính:** 1-2 giờ
**Tổng Số Kịch Bản:** 2
**Phạm Vi:** Xác thực các quy trình nghiệp vụ hoàn chỉnh từ đầu đến cuối

**⚠️ QUAN TRỌNG:** Các kịch bản E2E xác minh toàn bộ hệ thống hoạt động kết hợp chặt chẽ với nhau.

---

## Thiết Lập Trước Khi Kiểm Thử

**Môi Trường Kiểm Thử:**
- [ ] Ứng dụng đang chạy: http://localhost:3025
- [ ] Supabase Studio có thể truy cập: http://localhost:54323
- [ ] Tất cả dịch vụ hoạt động tốt (kiểm tra `pnpx supabase status`)
- [ ] Dữ liệu kiểm thử mới được khởi tạo
- [ ] Nhiều tab trình duyệt sẵn sàng (cho các vai trò người dùng khác nhau)

**Tài Khoản Kiểm Thử:**
- [ ] Admin: admin@example.com
- [ ] Manager: manager@example.com
- [ ] Technician: technician@example.com
- [ ] Reception: reception@example.com

**Dữ Liệu Kiểm Thử:**
- [ ] Mẫu đã được cấu hình (Bảo Hành, Sửa Chữa Trả Phí, Thay Thế)
- [ ] Khách hàng đã được tạo
- [ ] Sản phẩm trong kho
- [ ] Kho hàng đã được cấu hình
- [ ] Phụ tùng có sẵn

---

## Kịch Bản E2E 1: Quy Trình Dịch Vụ Hoàn Chỉnh

**Mục Tiêu:** Xác minh toàn bộ hành trình khách hàng từ yêu cầu công khai đến xác nhận giao hàng

**Thời Lượng:** 30-40 phút
**Vai Trò Tham Gia:** Khách hàng (công khai), Lễ Tân, Kỹ Thuật Viên, Quản Lý
**Các Bước:** 12

---

### Bước 1: Gửi Yêu Cầu Công Khai
**Tác Nhân:** Khách Hàng (Người Dùng Công Khai - Không Đăng Nhập)

**Các Hành Động:**
1. Mở trình duyệt ở chế độ ẩn danh (để mô phỏng người dùng công khai)
2. Điều hướng đến `http://localhost:3025/service-request`
3. Xác minh trang tải được mà không yêu cầu đăng nhập
4. Điền form yêu cầu dịch vụ:
   - Tên: "Jane Doe"
   - Điện thoại: "0912345678"
   - Email: "jane.doe@example.com"
   - Loại Thiết Bị: "Smartphone"
   - Mô Tả Vấn Đề: "Điện thoại không sạc được. Đã thử nhiều cục sạc, không có phản ứng. Cần sửa chữa khẩn cấp."
5. Gửi form
6. Ghi lại mã theo dõi được hiển thị
7. Chụp ảnh màn hình trang thành công

**Kết Quả Mong Đợi:**
- ✅ Form có thể truy cập mà không cần xác thực
- ✅ Xác thực form hoạt động (các trường bắt buộc)
- ✅ Gửi thành công
- ✅ Mã theo dõi được hiển thị (định dạng UUID)
- ✅ Thông báo thành công rõ ràng và hữu ích

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Mã Theo Dõi:** _______________________

**Bằng Chứng:**
- Ảnh chụp màn hình form yêu cầu: _____________
- Ảnh chụp màn hình trang thành công: _____________

**Ghi Chú:**

---

### Bước 2: Xác Minh Yêu Cầu Trong Database
**Tác Nhân:** Kỹ Sư Kiểm Thử

**Các Hành Động:**
1. Mở Supabase Studio → SQL Editor
2. Truy vấn yêu cầu dịch vụ:

```sql
SELECT id, tracking_token, customer_name, customer_phone, customer_email,
       device_type, issue_description, status, created_at
FROM service_requests
WHERE tracking_token = '[TOKEN_FROM_STEP_1]';
```

3. Xác minh thông báo email được xếp hàng:

```sql
SELECT template_type, recipient, status
FROM email_notifications
WHERE reference_id = (SELECT id FROM service_requests WHERE tracking_token = '[TOKEN]')
ORDER BY created_at DESC
LIMIT 1;
```

**Kết Quả Mong Đợi:**
- ✅ Yêu cầu được lưu trong database
- ✅ Status là 'pending'
- ✅ Tất cả dữ liệu form được ghi nhận chính xác
- ✅ Thông báo email được xếp hàng

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Kết quả truy vấn SQL: _____________

**Ghi Chú:**

---

### Bước 3: Theo Dõi Yêu Cầu Với Vai Trò Khách Hàng
**Tác Nhân:** Khách Hàng (Người Dùng Công Khai)

**Các Hành Động:**
1. Trong cùng trình duyệt ẩn danh
2. Điều hướng đến `/service-request/track`
3. Nhập mã theo dõi từ Bước 1
4. Gửi
5. Xác minh trạng thái yêu cầu được hiển thị
6. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Trang theo dõi có thể truy cập mà không cần đăng nhập
- ✅ Chi tiết yêu cầu được hiển thị
- ✅ Trạng thái hiển thị "Đang Chờ - Chờ Nhân Viên Xem Xét"
- ✅ Ngày gửi hiển thị
- ✅ Không lộ dữ liệu nhạy cảm của nhân viên

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Ảnh chụp màn hình trang theo dõi: _____________

**Ghi Chú:**

---

### Bước 4: Nhân Viên Chuyển Đổi Yêu Cầu Thành Phiếu
**Tác Nhân:** Nhân Viên Lễ Tân

**Các Hành Động:**
1. Đóng trình duyệt ẩn danh
2. Mở trình duyệt thông thường
3. Đăng nhập với Lễ Tân (reception@example.com)
4. Điều hướng đến `/dashboard/service-requests`
5. Tìm yêu cầu từ Jane Doe
6. Nhấp "Chuyển Thành Phiếu"
7. Điền form chuyển đổi:
   - Khách hàng: Tìm kiếm và chọn hiện tại hoặc tạo mới
     - Nếu tạo mới: Dùng Jane Doe, 0912345678, jane.doe@example.com
   - Sản phẩm: Chọn sản phẩm "Smartphone"
   - Loại Dịch Vụ: "warranty"
   - Mẫu: Chọn mẫu "Dịch Vụ Bảo Hành"
   - Mức Độ Ưu Tiên: "high"
   - Giao Cho: Chọn technician@example.com
8. Gửi chuyển đổi
9. Ghi lại số phiếu được tạo
10. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Yêu cầu xuất hiện trong bảng điều khiển yêu cầu đang chờ
- ✅ Form chuyển đổi tự động điền dữ liệu khách hàng từ yêu cầu
- ✅ Có thể tạo khách hàng mới từ dữ liệu yêu cầu
- ✅ Phiếu được tạo thành công
- ✅ Số phiếu tự động tạo (SV-YYYY-NNN)
- ✅ Trạng thái yêu cầu chuyển thành 'converted'
- ✅ Yêu cầu được liên kết với phiếu (converted_to_ticket_id)

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Số Phiếu:** _______________________

**Bằng Chứng:**
- Ảnh chụp màn hình bảng yêu cầu: _____________
- Ảnh chụp màn hình form chuyển đổi: _____________
- Ảnh chụp màn hình phiếu đã tạo: _____________

**Xác minh trong database:**
```sql
-- Yêu cầu phải được đánh dấu đã chuyển đổi
SELECT status, converted_to_ticket_id, converted_at, converted_by
FROM service_requests
WHERE tracking_token = '[TOKEN]';

-- Phiếu phải tồn tại
SELECT ticket_number, customer_id, status, template_id
FROM service_tickets
WHERE ticket_number = '[TICKET_NUMBER]';
```

**Ghi Chú:**

---

### Bước 5: Khách Hàng Theo Dõi Trạng Thái Cập Nhật
**Tác Nhân:** Khách Hàng (Người Dùng Công Khai)

**Các Hành Động:**
1. Quay lại trang theo dõi từ Bước 3
2. Làm mới hoặc nhập lại mã theo dõi
3. Xác minh trạng thái đã cập nhật
4. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Trạng thái bây giờ hiển thị "Đã Chuyển Thành Phiếu"
- ✅ Số phiếu được hiển thị (nếu được thiết kế để hiển thị)
- ✅ Khách hàng có thể xem cập nhật tiến trình

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Ảnh chụp màn hình theo dõi đã cập nhật: _____________

**Ghi Chú:**

---

### Bước 6: Kỹ Thuật Viên Xem Công Việc Được Giao
**Tác Nhân:** Kỹ Thuật Viên

**Các Hành Động:**
1. Đăng xuất khỏi Lễ Tân
2. Đăng nhập với Kỹ Thuật Viên (technician@example.com)
3. Điều hướng đến `/my-tasks`
4. Tìm công việc từ phiếu được tạo ở Bước 4
5. Xác minh các công việc được hiển thị:
   - Công Việc 1: "Chẩn Đoán Ban Đầu"
   - Công Việc 2: "Công Việc Sửa Chữa"
   - Công Việc 3: "Kiểm Tra Chất Lượng" (hoặc dựa trên mẫu)
6. Ghi chú số phiếu khớp
7. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Công việc hiển thị trong trang "Công Việc Của Tôi"
- ✅ Tất cả công việc từ mẫu được tạo
- ✅ Tất cả công việc ở trạng thái 'pending'
- ✅ Số phiếu hiển thị
- ✅ Thông tin khách hàng có thể truy cập

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Công Việc Hiển Thị:** ___ (mong đợi: 3+)

**Bằng Chứng:**
- Ảnh chụp màn hình trang Công Việc Của Tôi: _____________

**Ghi Chú:**

---

### Bước 7: Kỹ Thuật Viên Thực Hiện Công Việc
**Tác Nhân:** Kỹ Thuật Viên

**Các Hành Động:**
1. Nhấp vào công việc đầu tiên: "Chẩn Đoán Ban Đầu"
2. Nhấp nút "Bắt Đầu"
3. Xác nhận
4. Xác minh trạng thái công việc chuyển thành "in_progress"
5. Thực hiện công việc mô phỏng (đợi 10 giây)
6. Nhấp nút "Hoàn Thành"
7. Nhập ghi chú hoàn thành:
   "Chẩn đoán hoàn tất. Tìm thấy cổng sạc bị hỏng. Cần thay thế. Ước tính thời gian sửa chữa 1 giờ."
8. Gửi
9. Xác minh công việc được đánh dấu "completed"
10. Bắt đầu công việc thứ hai: "Công Việc Sửa Chữa"
11. Hoàn thành với ghi chú:
    "Thay thế cổng sạc thành công. Thiết bị hiện sạc bình thường. Đã kiểm tra với nhiều cục sạc."
12. Bắt đầu và hoàn thành công việc thứ ba: "Kiểm Tra Chất Lượng"
13. Nhập ghi chú:
    "Tất cả chức năng đã được kiểm tra. Sạc hoạt động hoàn hảo. Thiết bị sẵn sàng để khách hàng nhận."
14. Xác minh tất cả công việc đã hoàn thành
15. Chụp ảnh màn hình ở các giai đoạn chính

**Kết Quả Mong Đợi:**
- ✅ Tiến trình trạng thái công việc: pending → in_progress → completed
- ✅ Ghi chú hoàn thành được yêu cầu và lưu
- ✅ Tất cả công việc hoàn thành thành công
- ✅ Trạng thái phiếu tự động chuyển thành "completed" sau công việc cuối cùng

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Hoàn Thành Công Việc:**
- Công việc 1 hoàn thành: [ ] CÓ [ ] KHÔNG
- Công việc 2 hoàn thành: [ ] CÓ [ ] KHÔNG
- Công việc 3 hoàn thành: [ ] CÓ [ ] KHÔNG
- Phiếu tự động hoàn thành: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- Ảnh chụp màn hình thực hiện công việc: _____________
- Ảnh chụp màn hình ghi chú hoàn thành: _____________
- Ảnh chụp màn hình tất cả công việc hoàn thành: _____________

**Xác minh trong database:**
```sql
-- Tất cả công việc phải được hoàn thành
SELECT title, status, completed_at, completion_notes
FROM service_ticket_tasks
WHERE service_ticket_id = (SELECT id FROM service_tickets WHERE ticket_number = '[TICKET_NUMBER]')
ORDER BY task_order;

-- Phiếu phải được hoàn thành
SELECT ticket_number, status, updated_at
FROM service_tickets
WHERE ticket_number = '[TICKET_NUMBER]';
```

**Ghi Chú:**

---

### Bước 8: Quản Lý Xem Xét Bảng Điều Khiển
**Tác Nhân:** Quản Lý

**Các Hành Động:**
1. Đăng xuất khỏi Kỹ Thuật Viên
2. Đăng nhập với Quản Lý (manager@example.com)
3. Điều hướng đến `/dashboard/task-progress`
4. Xác minh các số liệu đã cập nhật:
   - Số lượng phiếu đang hoạt động
   - Số lượng công việc đã hoàn thành
   - Khối lượng công việc kỹ thuật viên hiển thị công việc đã hoàn thành
5. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Bảng điều khiển phản ánh công việc đã hoàn thành
- ✅ Khối lượng công việc kỹ thuật viên đã cập nhật
- ✅ Số liệu chính xác
- ✅ Không có công việc bị chặn cho phiếu này

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Ảnh chụp màn hình bảng điều khiển quản lý: _____________

**Ghi Chú:**

---

### Bước 9: Xác Nhận Giao Hàng
**Tác Nhân:** Quản Lý hoặc Admin

**Các Hành Động:**
1. Tiếp tục đăng nhập với Quản Lý (hoặc đăng nhập với Admin)
2. Điều hướng đến `/tickets`
3. Lọc để hiển thị các phiếu đã hoàn thành
4. Tìm phiếu từ Bước 4
5. Mở chi tiết phiếu
6. Nhấp nút "Xác Nhận Giao Hàng"
7. Điền form xác nhận giao hàng:
   - Ngày Giao: (ngày hôm nay)
   - Giao Cho: "Jane Doe"
   - Phương Thức Giao: "Khách Hàng Nhận"
   - Ghi Chú Giao: "Khách hàng đã nhận thiết bị. Xác minh sạc hoạt động. Khách hàng hài lòng với việc sửa chữa."
8. Gửi
9. Xác minh thông báo thành công
10. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Nút "Xác Nhận Giao Hàng" hiển thị trên phiếu đã hoàn thành
- ✅ Form giao hàng hiển thị tất cả trường
- ✅ Xác nhận giao hàng lưu thành công
- ✅ Phiếu hiển thị trạng thái hoặc huy hiệu "Đã Giao"
- ✅ Thông báo email được xếp hàng cho khách hàng

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Ảnh chụp màn hình xác nhận giao hàng: _____________
- Ảnh chụp màn hình phiếu sau khi giao: _____________

**Xác minh trong database:**
```sql
-- Xác nhận giao hàng được ghi lại
SELECT ticket_number, delivery_confirmed_at, delivery_confirmed_by, delivery_notes
FROM service_tickets
WHERE ticket_number = '[TICKET_NUMBER]';

-- Email giao hàng được xếp hàng
SELECT template_type, recipient, status
FROM email_notifications
WHERE reference_id = (SELECT id FROM service_tickets WHERE ticket_number = '[TICKET_NUMBER]')
  AND template_type = 'delivery_confirmation'
ORDER BY created_at DESC
LIMIT 1;
```

**Ghi Chú:**

---

### Bước 10: Xác Minh Thông Báo Email
**Tác Nhân:** Kỹ Sư Kiểm Thử

**Các Hành Động:**
1. Mở Supabase Studio → SQL Editor
2. Truy vấn tất cả email cho phiếu này:

```sql
SELECT
  template_type,
  recipient,
  status,
  created_at,
  sent_at
FROM email_notifications
WHERE reference_id IN (
  SELECT id FROM service_tickets WHERE ticket_number = '[TICKET_NUMBER]'
  UNION
  SELECT id FROM service_requests WHERE tracking_token = '[TOKEN]'
)
ORDER BY created_at;
```

3. Xác minh các email mong đợi được xếp hàng:
   - Yêu cầu dịch vụ đã nhận
   - Cập nhật trạng thái phiếu (nếu được cấu hình)
   - Xác nhận giao hàng

**Kết Quả Mong Đợi:**
- ✅ Tất cả email mong đợi được xếp hàng
- ✅ Người nhận là email khách hàng
- ✅ Trạng thái email là 'pending' hoặc 'sent'
- ✅ Không có email thất bại

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Email Được Xếp Hàng:** ___ (mong đợi: 2-3)

**Bằng Chứng:**
- Kết quả truy vấn SQL: _____________

**Ghi Chú:**

---

### Bước 11: Kiểm Tra Theo Dõi Cuối Cùng Của Khách Hàng
**Tác Nhân:** Khách Hàng (Người Dùng Công Khai)

**Các Hành Động:**
1. Quay lại trình duyệt ẩn danh
2. Điều hướng đến `/service-request/track`
3. Nhập lại mã theo dõi
4. Xác minh trạng thái cuối cùng
5. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Trạng thái hiển thị "Đã Hoàn Thành - Đã Giao"
- ✅ Khách hàng có thể thấy dịch vụ đã hoàn tất
- ✅ Có thể hiển thị ngày giao (nếu hiển thị cho khách hàng)

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Ảnh chụp màn hình trạng thái theo dõi cuối cùng: _____________

**Ghi Chú:**

---

### Bước 12: Xác Minh Đầu-Đến-Cuối
**Tác Nhân:** Kỹ Sư Kiểm Thử

**Các Hành Động:**
1. Xem xét toàn bộ quy trình hoàn thành
2. Xác minh tính nhất quán dữ liệu:

```sql
-- Xác minh quy trình đầy đủ
SELECT
  sr.tracking_token,
  sr.customer_name,
  sr.status as request_status,
  st.ticket_number,
  st.status as ticket_status,
  st.delivery_confirmed_at,
  (SELECT COUNT(*) FROM service_ticket_tasks WHERE service_ticket_id = st.id) as total_tasks,
  (SELECT COUNT(*) FROM service_ticket_tasks WHERE service_ticket_id = st.id AND status = 'completed') as completed_tasks
FROM service_requests sr
JOIN service_tickets st ON st.id = sr.converted_to_ticket_id
WHERE sr.tracking_token = '[TOKEN]';
```

3. Xác minh tất cả các bước đã hoàn thành thành công
4. Ghi lại bất kỳ vấn đề nào gặp phải

**Kết Quả Mong Đợi:**
- ✅ Trạng thái yêu cầu: 'converted'
- ✅ Trạng thái phiếu: 'completed'
- ✅ Tất cả công việc đã hoàn thành (total_tasks = completed_tasks)
- ✅ Giao hàng đã xác nhận
- ✅ Thông báo email đã gửi
- ✅ Toàn bộ quy trình mượt mà

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Xác minh SQL cuối cùng: _____________

**Ghi Chú:**

---

## Tóm Tắt Kịch Bản E2E 1

| Bước | Mô Tả | Trạng Thái | Thời Lượng | Vấn Đề |
|------|-------|-----------|-----------|--------|
| 1 | Gửi Yêu Cầu Công Khai | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 2 | Xác Minh Trong Database | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 3 | Theo Dõi Yêu Cầu | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 4 | Chuyển Thành Phiếu | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 5 | Khách Hàng Theo Dõi Cập Nhật | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 6 | Kỹ Thuật Viên Xem Công Việc | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 7 | Thực Hiện Công Việc | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 8 | Xem Xét Quản Lý | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 9 | Xác Nhận Giao Hàng | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 10 | Xác Minh Email | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 11 | Theo Dõi Cuối Cùng | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 12 | Xác Minh E2E | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |

**Kịch Bản 1 Tổng Thể:** [ ] ĐẠT [ ] KHÔNG ĐẠT

**Tổng Thời Lượng:** ___ phút

---

## Kịch Bản E2E 2: Chuyển Đổi Mẫu Giữa Dịch Vụ

**Mục Tiêu:** Xác minh kỹ thuật viên có thể chuyển đổi mẫu quy trình khi phát hiện vấn đề khác

**Thời Lượng:** 20-30 phút
**Vai Trò Tham Gia:** Admin, Kỹ Thuật Viên
**Các Bước:** 8

---

### Bước 1: Tạo Phiếu Với Mẫu Ban Đầu
**Tác Nhân:** Admin

**Các Hành Động:**
1. Đăng nhập với Admin
2. Điều hướng đến `/tickets`
3. Tạo phiếu mới:
   - Khách hàng: Chọn bất kỳ khách hàng nào
   - Sản phẩm: Chọn smartphone hoặc laptop
   - Vấn Đề: "Khách hàng báo cáo phần mềm không khởi động. Có thể bị hỏng phần mềm."
   - Loại Dịch Vụ: "warranty"
   - Mẫu: Mẫu "Vấn Đề Phần Mềm" hoặc "Chẩn Đoán"
   - Giao Cho: technician@example.com
4. Gửi
5. Ghi lại số phiếu
6. Xác minh công việc được tạo từ mẫu
7. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Phiếu được tạo với mẫu "Vấn Đề Phần Mềm"
- ✅ Công việc được tạo từ mẫu (ví dụ: "Chẩn Đoán Phần Mềm", "Cài Đặt Lại Phần Mềm", "Kiểm Tra")
- ✅ Tất cả công việc ở trạng thái 'pending'

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Số Phiếu:** _______________________

**Mẫu Ban Đầu:** _______________________

**Công Việc Được Tạo:** ___ công việc

**Bằng Chứng:**
- Ảnh chụp màn hình tạo phiếu: _____________
- Ảnh chụp màn hình công việc ban đầu: _____________

**Ghi Chú:**

---

### Bước 2: Kỹ Thuật Viên Bắt Đầu Chẩn Đoán
**Tác Nhân:** Kỹ Thuật Viên

**Các Hành Động:**
1. Đăng xuất khỏi Admin
2. Đăng nhập với Kỹ Thuật Viên
3. Điều hướng đến `/my-tasks`
4. Tìm phiếu từ Bước 1
5. Bắt đầu công việc đầu tiên: "Chẩn Đoán Phần Mềm"
6. Hoàn thành công việc với ghi chú:
   "Chẩn đoán hoàn tất. Vấn đề KHÔNG phải phần mềm. Tìm thấy hư hỏng do nước bên trong thiết bị. Phát hiện ăn mòn bo mạch. Cần sửa chữa phần cứng, không phải sửa phần mềm."
7. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Công việc được bắt đầu và hoàn thành thành công
- ✅ Ghi chú hoàn thành được lưu
- ✅ Kỹ thuật viên phát hiện vấn đề phần cứng trong quá trình chẩn đoán phần mềm

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Ảnh chụp màn hình chẩn đoán đã hoàn thành: _____________
- Ảnh chụp màn hình ghi chú hoàn thành: _____________

**Ghi Chú:**

---

### Bước 3: Kỹ Thuật Viên Chuyển Đổi Mẫu
**Tác Nhân:** Kỹ Thuật Viên

**Các Hành Động:**
1. Trên trang chi tiết phiếu, nhấp nút "Chuyển Mẫu"
2. Modal chuyển đổi mẫu mở ra
3. Duyệt các mẫu có sẵn
4. Chọn mẫu "Sửa Chữa Phần Cứng"
5. Quan sát xem trước mẫu hiển thị công việc mới
6. Nhập lý do chuyển đổi:
   "Chẩn đoán ban đầu phát hiện hư hỏng do nước và ăn mòn bo mạch. Mẫu phần mềm không phù hợp. Chuyển sang quy trình sửa chữa phần cứng. Khách hàng sẽ được thông báo về tác động bảo hành."
7. Xác nhận chuyển đổi
8. Quan sát thông báo thành công
9. Xác minh danh sách công việc đã cập nhật
10. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Nút "Chuyển Mẫu" hiển thị và được kích hoạt
- ✅ Modal hiển thị tất cả các mẫu có sẵn
- ✅ Xem trước hiển thị công việc từ mẫu đã chọn
- ✅ Trường lý do xác thực (tối thiểu 10 ký tự)
- ✅ Mẫu chuyển đổi thành công
- ✅ Thông báo thành công được hiển thị

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Mẫu Mới:** _______________________

**Bằng Chứng:**
- Ảnh chụp màn hình modal chuyển đổi: _____________
- Ảnh chụp màn hình xem trước mẫu: _____________
- Ảnh chụp màn hình nhập lý do: _____________
- Ảnh chụp màn hình thông báo thành công: _____________

**Ghi Chú:**

---

### Bước 4: Xác Minh Danh Sách Công Việc Đã Cập Nhật
**Tác Nhân:** Kỹ Thuật Viên

**Các Hành Động:**
1. Kiểm tra danh sách công việc đã cập nhật
2. Xác minh:
   - Công việc đã hoàn thành "Chẩn Đoán Phần Mềm" vẫn hiển thị là đã hoàn thành
   - Các công việc đang chờ cũ ("Cài Đặt Lại Phần Mềm", "Kiểm Tra") bị xóa hoặc được đánh dấu
   - Công việc mới từ mẫu "Sửa Chữa Phần Cứng" được thêm:
     - "Tháo Rời Thiết Bị"
     - "Làm Sạch Ăn Mòn"
     - "Thay Thế Bo Mạch"
     - "Lắp Ráp Lại Và Kiểm Tra"
3. Đếm tổng số công việc
4. Xác minh thứ tự công việc
5. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Công việc đã hoàn thành "Chẩn Đoán Phần Mềm" được BẢO TOÀN (vẫn hiển thị đã hoàn thành)
- ✅ Các công việc chưa hoàn thành cũ bị xóa
- ✅ Công việc mới từ mẫu "Sửa Chữa Phần Cứng" được thêm
- ✅ Công việc mới ở trạng thái 'pending'
- ✅ Thứ tự công việc phản ánh mẫu mới

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Theo Dõi Công Việc:**
- Công việc đã hoàn thành được bảo toàn: ___ (mong đợi: 1)
- Công việc mới được thêm: ___ (mong đợi: 4+)
- Tổng công việc bây giờ: ___

**Bằng Chứng:**
- Ảnh chụp màn hình danh sách công việc đã cập nhật: _____________

**Ghi Chú:**

---

### Bước 5: Xác Minh Dấu Vết Kiểm Toán
**Tác Nhân:** Kỹ Sư Kiểm Thử hoặc Kỹ Thuật Viên

**Các Hành Động:**
1. Trong trang chi tiết phiếu, tìm kiếm "Lịch Sử Thay Đổi Mẫu" hoặc phần kiểm toán
2. Nếu hiển thị trong UI, xác minh hiển thị:
   - Tên mẫu cũ
   - Tên mẫu mới
   - Thay đổi bởi (tên kỹ thuật viên)
   - Dấu thời gian
   - Lý do
3. Truy vấn database:

```sql
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
WHERE ttc.ticket_id = (SELECT id FROM service_tickets WHERE ticket_number = '[TICKET_NUMBER]')
ORDER BY ttc.changed_at DESC;
```

**Kết Quả Mong Đợi:**
- ✅ Thay đổi mẫu được ghi lại trong database
- ✅ Bản ghi kiểm toán hiển thị: mẫu cũ, mẫu mới, lý do, kỹ thuật viên, dấu thời gian
- ✅ Số lượng công việc trước/sau được ghi lại
- ✅ Số lượng công việc đã hoàn thành được bảo toàn được ghi lại
- ✅ Dấu vết kiểm toán không thể thay đổi

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Ảnh chụp màn hình dấu vết kiểm toán (nếu trong UI): _____________
- Kết quả truy vấn SQL: _____________

**Ghi Chú:**

---

### Bước 6: Hoàn Thành Công Việc Quy Trình Mới
**Tác Nhân:** Kỹ Thuật Viên

**Các Hành Động:**
1. Tiếp tục với Kỹ Thuật Viên
2. Bắt đầu và hoàn thành công việc mới từng cái một:
   - "Tháo Rời Thiết Bị" - Ghi chú: "Thiết bị đã tháo rời. Xác nhận hư hỏng do nước trên bo mạch."
   - "Làm Sạch Ăn Mòn" - Ghi chú: "Ăn mòn đã được làm sạch. Bo mạch hỏng không thể sửa, cần thay thế."
   - "Thay Thế Bo Mạch" - Ghi chú: "Bo mạch đã được thay thế bằng đơn vị mới. Phụ tùng #MB-123."
   - "Lắp Ráp Lại Và Kiểm Tra" - Ghi chú: "Thiết bị đã lắp ráp lại. Tất cả chức năng đã kiểm tra. Thiết bị hoạt động hoàn hảo."
3. Xác minh tất cả công việc hoàn thành
4. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Tất cả công việc mới có thể hoàn thành
- ✅ Quy trình tiếp tục mượt mà sau khi chuyển đổi mẫu
- ✅ Không có lỗi hoặc vấn đề khi thực hiện công việc mới
- ✅ Phiếu tự động chuyển thành 'completed' sau khi tất cả công việc hoàn thành

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Công Việc Đã Hoàn Thành:**
- Tháo rời: [ ] CÓ [ ] KHÔNG
- Làm sạch: [ ] CÓ [ ] KHÔNG
- Thay thế: [ ] CÓ [ ] KHÔNG
- Lắp ráp lại: [ ] CÓ [ ] KHÔNG
- Phiếu hoàn thành: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- Ảnh chụp màn hình tất cả công việc hoàn thành: _____________

**Ghi Chú:**

---

### Bước 7: Xác Minh Trạng Thái Cuối Cùng
**Tác Nhân:** Kỹ Sư Kiểm Thử

**Các Hành Động:**
1. Truy vấn database để xác minh trạng thái cuối cùng:

```sql
-- Xác minh tất cả công việc
SELECT title, task_order, status, completed_at, completion_notes
FROM service_ticket_tasks
WHERE service_ticket_id = (SELECT id FROM service_tickets WHERE ticket_number = '[TICKET_NUMBER]')
ORDER BY task_order;
-- Phải hiển thị: 1 công việc cũ đã hoàn thành + tất cả công việc mới đã hoàn thành

-- Xác minh trạng thái phiếu
SELECT ticket_number, status, template_id, updated_at
FROM service_tickets
WHERE ticket_number = '[TICKET_NUMBER]';
-- Status phải là 'completed'
-- template_id phải là mẫu mới

-- Xác minh số lượng thay đổi mẫu
SELECT COUNT(*) as template_changes
FROM ticket_template_changes
WHERE ticket_id = (SELECT id FROM service_tickets WHERE ticket_number = '[TICKET_NUMBER]');
-- Phải là 1
```

**Kết Quả Mong Đợi:**
- ✅ Tất cả công việc (cũ + mới) hiển thị đã hoàn thành
- ✅ Trạng thái phiếu là 'completed'
- ✅ template_id của phiếu đã cập nhật sang mẫu mới
- ✅ Bản ghi kiểm toán thay đổi mẫu tồn tại
- ✅ Tính nhất quán dữ liệu được duy trì

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Kết quả truy vấn SQL: _____________

**Ghi Chú:**

---

### Bước 8: Kiểm Tra Trường Hợp Biên - Không Thể Chuyển Đổi Trên Phiếu Đã Hoàn Thành
**Tác Nhân:** Admin

**Các Hành Động:**
1. Đăng nhập với Admin
2. Điều hướng đến phiếu đã hoàn thành
3. Thử nhấp nút "Chuyển Mẫu"
4. Xác minh nút bị vô hiệu hóa hoặc không hiển thị
5. Nếu nút hiển thị, thử nhấp
6. Quan sát thông báo lỗi (phải chặn)
7. Chụp ảnh màn hình

**Kết Quả Mong Đợi:**
- ✅ Nút "Chuyển Mẫu" bị vô hiệu hóa trên phiếu đã hoàn thành
- ✅ Hoặc nút không hiển thị hoàn toàn
- ✅ Nếu thử, thông báo lỗi được hiển thị: "Không thể chuyển mẫu trên phiếu đã hoàn thành"
- ✅ Xác thực ngăn chặn chuyển đổi mẫu không hợp lệ

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Bằng Chứng:**
- Ảnh chụp màn hình hiển thị nút bị vô hiệu hóa: _____________
- Thông báo lỗi (nếu có): _____________

**Ghi Chú:**

---

## Tóm Tắt Kịch Bản E2E 2

| Bước | Mô Tả | Trạng Thái | Thời Lượng | Vấn Đề |
|------|-------|-----------|-----------|--------|
| 1 | Tạo Phiếu | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 2 | Bắt Đầu Chẩn Đoán | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 3 | Chuyển Đổi Mẫu | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 4 | Xác Minh Công Việc Đã Cập Nhật | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 5 | Xác Minh Dấu Vết Kiểm Toán | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 6 | Hoàn Thành Công Việc Mới | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 7 | Xác Minh Trạng Thái Cuối Cùng | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |
| 8 | Xác Thực Trường Hợp Biên | [ ] ĐẠT [ ] KHÔNG ĐẠT | ___ phút | |

**Kịch Bản 2 Tổng Thể:** [ ] ĐẠT [ ] KHÔNG ĐẠT

**Tổng Thời Lượng:** ___ phút

---

## Tóm Tắt Kiểm Thử Quy Trình E2E

| Kịch Bản | Các Bước | Đạt | Không Đạt | Trạng Thái |
|----------|---------|-----|-----------|-----------|
| Kịch Bản 1: Quy Trình Dịch Vụ Hoàn Chỉnh | 12 | ___ | ___ | [ ] ĐẠT [ ] KHÔNG ĐẠT |
| Kịch Bản 2: Chuyển Đổi Mẫu Giữa Dịch Vụ | 8 | ___ | ___ | [ ] ĐẠT [ ] KHÔNG ĐẠT |

**Tổng Số Kịch Bản:** 2
**Kịch Bản Đạt:** ___
**Tiêu Chí Đạt:** 2/2 (100%)

---

## Đánh Giá Cuối Cùng

**Tỷ Lệ Đạt Tổng Thể:** ___% (Mục tiêu: 100%)

**Kết Quả:** [ ] PHÊ DUYỆT [ ] TỪ CHỐI

**Vấn Đề Quy Trình E2E:** ___

**Tích Hợp Hệ Thống:** [ ] MƯỢT MÀ [ ] TÌM THẤY VẤN ĐỀ

**Đề Xuất:**

---

## Ký Duyệt

**Người Kiểm Thử:** _______________ Ngày: _______________
**Trưởng QA:** _______________ Ngày: _______________
**Quản Lý Sản Phẩm:** _______________ Ngày: _______________

**Phê Duyệt:** [ ] ĐẠT - Quy trình E2E đã xác minh [ ] KHÔNG ĐẠT - Vấn đề tích hợp phải được sửa

**⚠️ CHẶN TRIỂN KHAI:** Lỗi E2E cho thấy vấn đề tích hợp chặn triển khai.

---

**Các Bước Tiếp Theo:**
- Nếu CẢ HAI ĐẠT: Tiến hành Kiểm Thử Đồng Thời
- Nếu BẤT KỲ CÁI NÀO KHÔNG ĐẠT: Sửa các vấn đề tích hợp, xác minh tất cả các thành phần hoạt động cùng nhau, kiểm thử lại

**Tài Liệu Tham Khảo:**
- Kế Hoạch Kiểm Thử: docs/KE_HOACH_KIEM_THU.md
- Bảng Theo Dõi Chính: docs/qa/test-execution/BANG_THEO_DOI_THUC_HIEN_KIEM_THU.md
