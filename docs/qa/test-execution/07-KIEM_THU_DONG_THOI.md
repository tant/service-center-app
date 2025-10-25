# Danh Sách Kiểm Thử Đồng Thời - EPIC-01 Giai Đoạn 2

**Mức Độ Ưu Tiên:** P2 - TRUNG BÌNH
**Tiêu Chí Đạt:** Tỷ lệ đạt 70%+ (3+ trong số 4 bài kiểm thử phải đạt)
**Thời Gian Ước Tính:** 1-2 giờ
**Tổng Số Bài Kiểm Thử:** 4
**Phạm Vi:** Xác minh hệ thống xử lý nhiều người dùng đồng thời một cách chính xác

**⚠️ QUAN TRỌNG:** Các vấn đề đồng thời có thể gây hỏng dữ liệu hoặc xung đột trong môi trường production.

---

## Thiết Lập Trước Khi Kiểm Thử

**Môi Trường Kiểm Thử:**
- [ ] Ứng dụng đang chạy: http://localhost:3025
- [ ] Supabase Studio có thể truy cập: http://localhost:54323
- [ ] Nhiều hồ sơ trình duyệt hoặc cửa sổ ẩn danh sẵn sàng
- [ ] Tài khoản kiểm thử cho nhiều người dùng

**Tài Khoản Kiểm Thử:**
- [ ] Admin: admin@example.com
- [ ] Manager: manager@example.com
- [ ] Technician 1: technician@example.com
- [ ] Technician 2: Tạo hoặc dùng tài khoản kỹ thuật viên thứ hai
- [ ] Reception: reception@example.com

**Dữ Liệu Kiểm Thử:**
- [ ] Phiếu kiểm thử dùng chung
- [ ] Khách hàng kiểm thử dùng chung
- [ ] Đủ dữ liệu kiểm thử cho truy cập đồng thời

**Thiết Lập Trình Duyệt:**
- [ ] Trình duyệt 1: Cửa sổ bình thường (Người dùng A)
- [ ] Trình duyệt 2: Cửa sổ ẩn danh (Người dùng B)
- [ ] Hoặc dùng các hồ sơ trình duyệt khác nhau

---

## Danh Mục Kiểm Thử: Các Kịch Bản Đồng Thời Nhiều Người Dùng

**Các Bài Kiểm Thử:** 4
**Mức Độ Ưu Tiên:** TRUNG BÌNH
**Tiêu Chí Đạt:** 3/4 bài kiểm thử đạt

### CONC-1.1: Hai Kỹ Thuật Viên Cập Nhật Các Phiếu Khác Nhau
**Mục Tiêu:** Xác minh các cập nhật đồng thời cho các bản ghi khác nhau không xung đột

**Các Bước Kiểm Thử:**
1. Chuẩn bị 2 phiếu kiểm thử:
   - Phiếu A: Được giao cho technician1@example.com
   - Phiếu B: Được giao cho technician2@example.com (hoặc dùng tài khoản kỹ thuật viên khác)

2. **Trình Duyệt 1:**
   - Đăng nhập với Kỹ Thuật Viên 1
   - Điều hướng đến Phiếu A
   - Bắt đầu một công việc trên Phiếu A
   - Để công việc ở trạng thái "in_progress" (chưa hoàn thành)

3. **Trình Duyệt 2 (Ẩn Danh):**
   - Đăng nhập với Kỹ Thuật Viên 2
   - Điều hướng đến Phiếu B
   - Bắt đầu một công việc trên Phiếu B
   - Để công việc ở trạng thái "in_progress"

4. **Trình Duyệt 1:**
   - Hoàn thành công việc trên Phiếu A
   - Nhập ghi chú hoàn thành
   - Gửi

5. **Trình Duyệt 2:**
   - Đồng thời (hoặc ngay sau đó), hoàn thành công việc trên Phiếu B
   - Nhập ghi chú hoàn thành
   - Gửi

6. Xác minh cả hai cập nhật đều thành công
7. Kiểm tra database:

```sql
-- Xác minh cả hai công việc đã cập nhật
SELECT st.ticket_number, stt.title, stt.status, stt.completed_at
FROM service_ticket_tasks stt
JOIN service_tickets st ON st.id = stt.service_ticket_id
WHERE st.ticket_number IN ('[TICKET_A]', '[TICKET_B]')
ORDER BY stt.completed_at DESC
LIMIT 2;
```

**Kết Quả Mong Đợi:**
- ✅ Cả hai công việc hoàn thành thành công
- ✅ Không có lỗi hoặc xung đột
- ✅ Cả hai ghi chú hoàn thành được lưu
- ✅ Cả hai công việc hiển thị trạng thái đã hoàn thành
- ✅ Không mất dữ liệu hoặc hỏng dữ liệu
- ✅ Các transaction database được cách ly đúng cách

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Xác Minh:**
- Công việc Phiếu A hoàn thành: [ ] CÓ [ ] KHÔNG
- Công việc Phiếu B hoàn thành: [ ] CÓ [ ] KHÔNG
- Có lỗi nào: [ ] CÓ [ ] KHÔNG
- Tính toàn vẹn dữ liệu được duy trì: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- Ảnh chụp màn hình từ cả hai trình duyệt: _____________
- Xác minh SQL: _____________

**Ghi Chú:**

---

### CONC-1.2: Hai Người Dùng Chỉnh Sửa Cùng Một Khách Hàng
**Mục Tiêu:** Xác minh các chỉnh sửa đồng thời cho cùng một bản ghi xử lý xung đột một cách phù hợp

**Các Bước Kiểm Thử:**
1. Tạo hoặc chọn khách hàng kiểm thử:
   - Tên: "Test Concurrent Customer"
   - Điện thoại: "0999999999"
   - Email: "concurrent.test@example.com"
   - Địa chỉ: "Original Address"

2. **Trình Duyệt 1:**
   - Đăng nhập với Admin
   - Điều hướng đến chi tiết khách hàng
   - Nhấp "Chỉnh Sửa"
   - Thay đổi địa chỉ thành "Address Updated by User 1"
   - CHƯA GỬI

3. **Trình Duyệt 2 (Ẩn Danh):**
   - Đăng nhập với Lễ Tân
   - Điều hướng đến cùng chi tiết khách hàng
   - Nhấp "Chỉnh Sửa"
   - Thay đổi địa chỉ thành "Address Updated by User 2"
   - CHƯA GỬI

4. **Trình Duyệt 1:**
   - Gửi chỉnh sửa
   - Quan sát thành công

5. **Trình Duyệt 2:**
   - Ngay sau đó, gửi chỉnh sửa
   - Quan sát kết quả

6. Kiểm tra trạng thái cuối cùng:

```sql
SELECT full_name, phone, address, updated_at
FROM customers
WHERE phone = '0999999999';
```

7. Xác định cách giải quyết xung đột:
   - Ghi Cuối Thắng (Last Write Wins): Địa chỉ = "Address Updated by User 2"
   - Khóa Lạc Quan (Optimistic Locking): Người dùng 2 nhận lỗi về dữ liệu cũ
   - Cách giải quyết xung đột khác

**Kết Quả Mong Đợi:**
- ✅ Hệ thống xử lý các chỉnh sửa đồng thời một cách nhẹ nhàng
- ✅ Một trong những điều sau xảy ra:
  - Ghi cuối thắng (cập nhật Người dùng 2 thành công, ghi đè Người dùng 1)
  - Khóa lạc quan (Người dùng 2 nhận lỗi xung đột)
  - Thông báo xung đột hợp nhất
- ✅ Không hỏng dữ liệu
- ✅ Không ứng dụng bị crash hoặc đóng băng
- ✅ Phản hồi rõ ràng cho người dùng

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Cách Giải Quyết Xung Đột Quan Sát:**
- [ ] Ghi Cuối Thắng
- [ ] Lỗi Khóa Lạc Quan
- [ ] Khác: _____________

**Giá Trị Địa Chỉ Cuối Cùng:** _______________________

**Bằng Chứng:**
- Ảnh chụp màn hình từ cả hai trình duyệt: _____________
- Kết quả SQL: _____________

**Ghi Chú:**

---

### CONC-1.3: Nhiều Yêu Cầu Công Khai Được Gửi Đồng Thời
**Mục Tiêu:** Xác minh cổng công khai xử lý các gửi đồng thời

**Các Bước Kiểm Thử:**
1. Mở 5 cửa sổ trình duyệt (ẩn danh/các trình duyệt khác nhau)
2. Trong mỗi cửa sổ, điều hướng đến `/service-request`
3. Điền form với dữ liệu khác nhau:
   - Cửa sổ 1: Khách hàng "Concurrent Test 1", Điện thoại "0988888881"
   - Cửa sổ 2: Khách hàng "Concurrent Test 2", Điện thoại "0988888882"
   - Cửa sổ 3: Khách hàng "Concurrent Test 3", Điện thoại "0988888883"
   - Cửa sổ 4: Khách hàng "Concurrent Test 4", Điện thoại "0988888884"
   - Cửa sổ 5: Khách hàng "Concurrent Test 5", Điện thoại "0988888885"
4. Gửi tất cả các form gần như cùng lúc (trong vòng 1-2 giây)
5. Ghi lại mã theo dõi từ mỗi cái
6. Xác minh tất cả các gửi:

```sql
-- Kiểm tra tất cả 5 yêu cầu đã tạo
SELECT tracking_token, customer_name, customer_phone, created_at
FROM service_requests
WHERE customer_phone IN ('0988888881', '0988888882', '0988888883', '0988888884', '0988888885')
ORDER BY created_at;
```

7. Xác minh:
   - Tất cả 5 yêu cầu được tạo
   - Tất cả có mã theo dõi duy nhất
   - Tất cả dấu thời gian gần nhau
   - Không có mã theo dõi trùng lặp

**Kết Quả Mong Đợi:**
- ✅ Tất cả 5 yêu cầu được gửi thành công
- ✅ Mỗi yêu cầu nhận được mã theo dõi duy nhất
- ✅ Không có deadlock database hoặc lỗi transaction
- ✅ Không có mã trùng lặp
- ✅ Tất cả dữ liệu được lưu chính xác
- ✅ Hệ thống xử lý ghi đồng thời một cách nhẹ nhàng

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**Các Gửi:**
- Tổng số gửi: ___ (mong đợi: 5)
- Thành công: ___ (mong đợi: 5)
- Thất bại: ___
- Mã duy nhất: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- Truy vấn SQL hiển thị tất cả 5 yêu cầu: _____________
- Mã theo dõi: _____________

**Ghi Chú:**

---

### CONC-1.4: Cập Nhật Thời Gian Thực Trên Bảng Điều Khiển Trong Khi Làm Việc Đồng Thời
**Mục Tiêu:** Xác minh bảng điều khiển quản lý phản ánh các thay đổi do kỹ thuật viên thực hiện theo thời gian thực

**Các Bước Kiểm Thử:**
1. **Trình Duyệt 1:**
   - Đăng nhập với Quản Lý
   - Điều hướng đến `/dashboard/task-progress`
   - Ghi chú các số liệu hiện tại:
     - Phiếu Đang Hoạt Động: ___
     - Công Việc Đang Thực Hiện: ___
     - Công Việc Bị Chặn: ___
   - Để bảng điều khiển mở (với tự động làm mới)

2. **Trình Duyệt 2:**
   - Đăng nhập với Kỹ Thuật Viên 1
   - Điều hướng đến `/my-tasks`
   - Bắt đầu một công việc
   - Hoàn thành một công việc

3. **Trình Duyệt 3:**
   - Đăng nhập với Kỹ Thuật Viên 2 (hoặc dùng cùng tài khoản kỹ thuật viên)
   - Điều hướng đến phiếu khác
   - Chặn một công việc (nhập lý do chặn)

4. **Trình Duyệt 1 (Bảng Điều Khiển Quản Lý):**
   - Đợi tự động làm mới (30-60 giây) hoặc làm mới thủ công
   - Xác minh các số liệu đã cập nhật:
     - Công Việc Đang Thực Hiện: giảm 1 (một đã hoàn thành)
     - Công Việc Bị Chặn: tăng 1
     - Phiếu Đang Hoạt Động: có thể thay đổi
   - Kiểm tra phần "Cảnh Báo Công Việc Bị Chặn" hiển thị công việc bị chặn mới

5. Xác minh độ chính xác bảng điều khiển:

```sql
-- Tính toán các số liệu thực tế
SELECT
  COUNT(DISTINCT stt.service_ticket_id) as active_tickets,
  COUNT(CASE WHEN stt.status = 'in_progress' THEN 1 END) as tasks_in_progress,
  COUNT(CASE WHEN stt.status = 'blocked' THEN 1 END) as blocked_tasks
FROM service_ticket_tasks stt
JOIN service_tickets st ON st.id = stt.service_ticket_id
WHERE st.status IN ('pending', 'in_progress');
```

6. So sánh hiển thị bảng điều khiển với kết quả SQL

**Kết Quả Mong Đợi:**
- ✅ Bảng điều khiển cập nhật tự động (hoặc khi làm mới thủ công)
- ✅ Các số liệu phản ánh các thay đổi do kỹ thuật viên thực hiện
- ✅ Số lượng Công Việc Đang Thực Hiện chính xác
- ✅ Số lượng Công Việc Bị Chặn chính xác
- ✅ Phần Cảnh Báo Công Việc Bị Chặn hiển thị công việc bị chặn mới
- ✅ Không hiển thị dữ liệu cũ
- ✅ Cập nhật thời gian thực (hoặc gần thời gian thực)

**Kết Quả Thực Tế:**
- [ ] ĐẠT [ ] KHÔNG ĐẠT

**So Sánh Số Liệu:**
| Số Liệu | Trước | Sau | SQL Thực Tế | Khớp? |
|---------|-------|-----|-------------|-------|
| Phiếu Đang Hoạt Động | ___ | ___ | ___ | [ ] |
| Công Việc Đang Thực Hiện | ___ | ___ | ___ | [ ] |
| Công Việc Bị Chặn | ___ | ___ | ___ | [ ] |

**Tự Động Làm Mới:**
- Bảng điều khiển tự động làm mới: [ ] CÓ [ ] KHÔNG
- Khoảng thời gian làm mới: ___ giây
- Làm mới thủ công hoạt động: [ ] CÓ [ ] KHÔNG

**Bằng Chứng:**
- Ảnh chụp màn hình trước thay đổi: _____________
- Ảnh chụp màn hình sau thay đổi: _____________
- Xác minh SQL: _____________

**Ghi Chú:**

---

## Tóm Tắt Kiểm Thử Đồng Thời

| ID Bài Kiểm Thử | Tên Bài Kiểm Thử | Trạng Thái | Vấn Đề Tìm Thấy |
|-----------------|------------------|-----------|-----------------|
| CONC-1.1 | Hai Kỹ Thuật Viên Các Phiếu Khác Nhau | [ ] ĐẠT [ ] KHÔNG ĐẠT | |
| CONC-1.2 | Hai Người Dùng Cùng Khách Hàng | [ ] ĐẠT [ ] KHÔNG ĐẠT | |
| CONC-1.3 | Nhiều Yêu Cầu Công Khai | [ ] ĐẠT [ ] KHÔNG ĐẠT | |
| CONC-1.4 | Cập Nhật Thời Gian Thực Bảng Điều Khiển | [ ] ĐẠT [ ] KHÔNG ĐẠT | |

**Tổng Số Bài Kiểm Thử:** 4
**Bài Kiểm Thử Đạt:** ___ / 4
**Tỷ Lệ Đạt:** ___%
**Tiêu Chí Đạt:** 70%+ (3+ bài kiểm thử phải đạt)

---

## Các Vấn Đề Đồng Thời Được Xác Định

**Race Conditions:**

**Xung Đột Dữ Liệu:**

**Lỗi Transaction:**

**Dữ Liệu Cũ:**

**Đề Xuất:**

---

## Đánh Giá Cuối Cùng

**Tỷ Lệ Đạt Tổng Thể:** ___% (Mục tiêu: 70%+)

**Kết Quả:** [ ] PHÊ DUYỆT [ ] TỪ CHỐI

**Xử Lý Đồng Thời:** [ ] TỐT [ ] CẦN CẢI THIỆN

**Sẵn Sàng Production:** [ ] SẴN SÀNG [ ] CHƯA SẴN SÀNG

**Đề Xuất:**

---

## Ký Duyệt

**Người Kiểm Thử:** _______________ Ngày: _______________
**Trưởng Kỹ Thuật:** _______________ Ngày: _______________
**Phê Duyệt:** [ ] ĐẠT - Đồng thời chấp nhận được [ ] KHÔNG ĐẠT - Vấn đề phải được giải quyết

---

**Các Bước Tiếp Theo:**
- Nếu ĐẠT: Hoàn thành tất cả thực hiện kiểm thử, chuẩn bị báo cáo cuối cùng
- Nếu KHÔNG ĐẠT: Điều tra các vấn đề đồng thời, triển khai sửa chữa, kiểm thử lại

**Tài Liệu Tham Khảo:**
- Kế Hoạch Kiểm Thử: docs/KE_HOACH_KIEM_THU.md
- Bảng Theo Dõi Chính: docs/qa/test-execution/BANG_THEO_DOI_THUC_HIEN_KIEM_THU.md

---

**Ghi Chú Về Đồng Thời:**
- Môi trường phát triển cục bộ có thể không sao chép hoàn toàn đồng thời của production
- Cân nhắc kiểm thử tải với các công cụ như k6 hoặc Artillery để xác thực production
- Giám sát production cho race conditions và deadlocks
- Triển khai optimistic locking khi phù hợp
- Sử dụng database transactions một cách chính xác
