# Checklist Kiểm Thử Hồi Quy - EPIC-01 Giai Đoạn 2

**Ưu Tiên:** P1 - MỨC CAO
**Tiêu Chí Pass:** Tỷ lệ pass ≥95% (13+ trên 13 tests phải pass)
**Thời Gian Ước Tính:** 2-3 giờ
**Tổng Số Tests:** 13
**Phạm Vi:** Xác minh các tính năng Giai Đoạn 1 vẫn hoạt động sau khi triển khai Giai Đoạn 2

**⚠️ QUAN TRỌNG:** Danh mục test này đảm bảo các thay đổi Giai Đoạn 2 không phá vỡ chức năng hiện có.

---

## Thiết Lập Trước Kiểm Thử

**Môi Trường Kiểm Thử:**
- [ ] Ứng dụng đang chạy: http://localhost:3025
- [ ] Supabase Studio truy cập được: http://localhost:54323
- [ ] Tài khoản test sẵn sàng (Admin, Manager, Technician, Reception)
- [ ] Dữ liệu test Giai Đoạn 1 có sẵn

**Dữ Liệu Test:**
- [ ] Khách hàng hiện có trong database
- [ ] Sản phẩm hiện có trong database
- [ ] Linh kiện hiện có trong database
- [ ] Phiếu dịch vụ test từ Giai Đoạn 1

---

## Danh Mục Test 1: Quản Lý Phiếu Dịch Vụ (Tính Năng Cốt Lõi Giai Đoạn 1)

**Tests:** 5
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** Tất cả 5 tests phải pass

### RT-1.1: Tạo Phiếu Dịch Vụ Mới
**Mục Tiêu:** Xác minh tạo phiếu dịch vụ vẫn hoạt động với đánh số tự động

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin hoặc Reception
2. Điều hướng đến `/tickets`
3. Nhấp nút "Phiếu Dịch Vụ Mới"
4. Điền form phiếu dịch vụ:
   - Khách Hàng: Chọn khách hàng hiện có
   - Sản Phẩm: Chọn sản phẩm
   - Mô Tả Vấn Đề: "Test regression - screen not working"
   - Loại Dịch Vụ: "warranty"
   - Ưu Tiên: "high"
5. Lưu phiếu dịch vụ
6. Xác minh thông báo thành công
7. Kiểm tra danh sách phiếu dịch vụ để tìm phiếu dịch vụ mới
8. Xác minh định dạng số phiếu dịch vụ: SV-YYYY-NNN
9. Truy vấn database:

```sql
SELECT ticket_number, customer_id, status, created_at
FROM service_tickets
ORDER BY created_at DESC
LIMIT 1;
-- Xác minh ticket_number khớp định dạng SV-2025-XXX
```

**Kết Quả Mong Đợi:**
- ✅ Form tạo phiếu dịch vụ hiển thị
- ✅ Tất cả trường xác thực đúng
- ✅ Phiếu dịch vụ lưu thành công
- ✅ Số phiếu dịch vụ tự động tạo theo định dạng SV-YYYY-NNN
- ✅ Phiếu dịch vụ xuất hiện trong danh sách phiếu dịch vụ
- ✅ Trạng thái ban đầu là "pending"

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Chi Tiết Phiếu Dịch Vụ:**
- Số phiếu dịch vụ: _____________
- Trạng thái: _____________

**Bằng Chứng:**
- Screenshot của form phiếu dịch vụ: _____________
- Screenshot của danh sách phiếu dịch vụ: _____________
- SQL output: _____________

**Ghi Chú:**

---

### RT-1.2: Chỉnh Sửa Phiếu Dịch Vụ Hiện Có
**Mục Tiêu:** Xác minh chức năng chỉnh sửa phiếu dịch vụ vẫn hoạt động

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Điều hướng đến danh sách phiếu dịch vụ
3. Mở phiếu dịch vụ được tạo trong RT-1.1
4. Nhấp nút "Chỉnh Sửa"
5. Sửa đổi chi tiết phiếu dịch vụ:
   - Thay đổi mô tả vấn đề
   - Thay đổi ưu tiên thành "medium"
   - Thêm chi phí ước tính
6. Lưu thay đổi
7. Xác minh thông báo thành công
8. Tải lại trang chi tiết phiếu dịch vụ
9. Xác minh thay đổi được duy trì
10. Kiểm tra database:

```sql
SELECT ticket_number, issue_description, priority, estimated_cost, updated_at
FROM service_tickets
WHERE ticket_number = '[TICKET_NUMBER]';
```

**Kết Quả Mong Đợi:**
- ✅ Form chỉnh sửa mở với dữ liệu hiện tại
- ✅ Thay đổi lưu thành công
- ✅ Timestamp updated_at thay đổi
- ✅ Tất cả sửa đổi được phản ánh trong database
- ✅ Không mất dữ liệu hoặc hỏng

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot trước khi chỉnh sửa: _____________
- Screenshot sau khi chỉnh sửa: _____________
- SQL output: _____________

**Ghi Chú:**

---

### RT-1.3: Cập Nhật Trạng Thái Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh chuyển đổi trạng thái phiếu dịch vụ hoạt động chính xác

**Các Bước Kiểm Thử:**
1. Tạo hoặc sử dụng phiếu dịch vụ hiện có ở trạng thái "pending"
2. Đăng nhập với Admin hoặc Manager
3. Mở chi tiết phiếu dịch vụ
4. Thay đổi trạng thái thành "in_progress"
5. Lưu
6. Xác minh trạng thái cập nhật
7. Thay đổi trạng thái thành "completed"
8. Lưu
9. Xác minh trạng thái cập nhật
10. Thử thay đổi phiếu dịch vụ đã hoàn thành trở lại "pending" (nên bị chặn bởi RLS)
11. Kiểm tra database:

```sql
SELECT ticket_number, status, updated_at
FROM service_tickets
WHERE ticket_number = '[TICKET_NUMBER]';
```

**Kết Quả Mong Đợi:**
- ✅ Trạng thái thay đổi từ "pending" sang "in_progress" thành công
- ✅ Trạng thái thay đổi từ "in_progress" sang "completed" thành công
- ✅ Không thể sửa đổi phiếu dịch vụ đã hoàn thành (bảo vệ RLS)
- ✅ Database phản ánh thay đổi trạng thái
- ✅ Chuyển đổi trạng thái theo luồng cho phép

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshots của thay đổi trạng thái: _____________
- SQL output: _____________

**Ghi Chú:**

---

### RT-1.4: Thêm Linh Kiện vào Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh linh kiện vẫn có thể được thêm vào phiếu dịch vụ và tổng tính toán đúng

**Các Bước Kiểm Thử:**
1. Tạo hoặc sử dụng phiếu dịch vụ hiện có
2. Điều hướng đến trang chi tiết phiếu dịch vụ
3. Đi đến tab "Linh Kiện"
4. Nhấp "Thêm Linh Kiện"
5. Chọn linh kiện từ tồn kho
6. Nhập số lượng: 2
7. Nhập đơn giá: 100000
8. Lưu
9. Xác minh linh kiện xuất hiện trong danh sách linh kiện phiếu dịch vụ
10. Thêm linh kiện khác:
    - Số lượng: 1
    - Đơn giá: 50000
11. Xác minh total_parts tính toán: 2*100000 + 1*50000 = 250000
12. Kiểm tra database:

```sql
-- Kiểm tra linh kiện đã thêm
SELECT p.name, stp.quantity, stp.unit_price, stp.subtotal
FROM service_ticket_parts stp
JOIN parts p ON p.id = stp.part_id
WHERE stp.service_ticket_id = '[TICKET_ID]';

-- Kiểm tra tổng đã tính toán
SELECT ticket_number, total_parts, service_fee, total_cost
FROM service_tickets
WHERE id = '[TICKET_ID]';
-- total_parts nên là 250000
```

**Kết Quả Mong Đợi:**
- ✅ Linh kiện có thể được thêm vào phiếu dịch vụ
- ✅ Số lượng và đơn giá được xác thực
- ✅ Subtotal tính toán tự động: quantity * unit_price
- ✅ total_parts cập nhật tự động qua trigger
- ✅ total_cost tính toán lại: service_fee + total_parts - discount
- ✅ Database phản ánh tổng chính xác

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Tính Toán:**
- Subtotal linh kiện 1: ___
- Subtotal linh kiện 2: ___
- Tổng linh kiện: ___
- Tổng chi phí: ___

**Bằng Chứng:**
- Screenshot của danh sách linh kiện: _____________
- SQL output: _____________

**Ghi Chú:**

---

### RT-1.5: Thêm Bình Luận vào Phiếu Dịch Vụ
**Mục Tiêu:** Xác minh chức năng bình luận vẫn hoạt động

**Các Bước Kiểm Thử:**
1. Mở phiếu dịch vụ hiện có
2. Điều hướng đến tab "Bình Luận"
3. Nhập bình luận: "Test regression comment - verifying comment system works"
4. Gửi
5. Xác minh bình luận xuất hiện trong danh sách
6. Xác minh bình luận hiển thị:
   - Văn bản bình luận
   - Người dùng đã đăng (tên người dùng của bạn)
   - Timestamp
7. Thêm bình luận khác
8. Xác minh cả hai bình luận hiển thị
9. Kiểm tra database:

```sql
SELECT comment, created_by, created_at
FROM service_ticket_comments
WHERE service_ticket_id = '[TICKET_ID]'
ORDER BY created_at DESC;
```

**Kết Quả Mong Đợi:**
- ✅ Form bình luận hiển thị
- ✅ Bình luận lưu thành công
- ✅ Bình luận xuất hiện trong danh sách ngay lập tức
- ✅ Người dùng và timestamp ghi lại chính xác
- ✅ Nhiều bình luận có thể được thêm
- ✅ Bình luận được sắp xếp theo timestamp (mới nhất trước)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của bình luận: _____________
- SQL output: _____________

**Ghi Chú:**

---

## Danh Mục Test 2: Quản Lý Khách Hàng

**Tests:** 3
**Ưu Tiên:** MỨC CAO
**Tiêu Chí Pass:** Tất cả 3 tests phải pass

### RT-2.1: Tạo Khách Hàng
**Mục Tiêu:** Xác minh chức năng tạo khách hàng hoạt động

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin hoặc Reception
2. Điều hướng đến `/customers`
3. Nhấp "Khách Hàng Mới"
4. Điền form khách hàng:
   - Họ Tên: "Test Customer Regression"
   - Điện Thoại: "0987654321"
   - Email: "test.regression@example.com"
   - Địa Chỉ: "123 Test St, Test City"
5. Lưu khách hàng
6. Xác minh thông báo thành công
7. Tìm khách hàng trong danh sách khách hàng
8. Kiểm tra database:

```sql
SELECT full_name, phone, email, address, created_at
FROM customers
WHERE phone = '0987654321';
```

**Kết Quả Mong Đợi:**
- ✅ Form khách hàng hiển thị
- ✅ Xác thực yêu cầu các trường bắt buộc
- ✅ Khách hàng lưu thành công
- ✅ Khách hàng xuất hiện trong danh sách khách hàng
- ✅ Tất cả dữ liệu lưu đúng trong database

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của form khách hàng: _____________
- Screenshot của danh sách khách hàng: _____________
- SQL output: _____________

**Ghi Chú:**

---

### RT-2.2: Chỉnh Sửa Khách Hàng
**Mục Tiêu:** Xác minh dữ liệu khách hàng có thể được cập nhật

**Các Bước Kiểm Thử:**
1. Mở khách hàng được tạo trong RT-2.1
2. Nhấp "Chỉnh Sửa"
3. Sửa đổi chi tiết:
   - Thay đổi địa chỉ thành "456 Updated St, New City"
   - Thay đổi email thành "test.updated@example.com"
4. Lưu thay đổi
5. Xác minh thông báo thành công
6. Tải lại chi tiết khách hàng
7. Xác minh thay đổi được duy trì
8. Kiểm tra database:

```sql
SELECT full_name, email, address, updated_at
FROM customers
WHERE phone = '0987654321';
```

**Kết Quả Mong Đợi:**
- ✅ Form chỉnh sửa mở với dữ liệu hiện tại
- ✅ Thay đổi lưu thành công
- ✅ Timestamp updated_at cập nhật
- ✅ Tất cả sửa đổi được phản ánh trong database

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot sau khi chỉnh sửa: _____________
- SQL output: _____________

**Ghi Chú:**

---

### RT-2.3: Xem Phiếu Dịch Vụ Của Khách Hàng
**Mục Tiêu:** Xác minh lịch sử phiếu dịch vụ của khách hàng hiển thị đúng

**Các Bước Kiểm Thử:**
1. Tạo 2-3 phiếu dịch vụ cho khách hàng từ RT-2.1
2. Điều hướng đến trang chi tiết khách hàng
3. Đi đến tab "Phiếu Dịch Vụ"
4. Xác minh tất cả phiếu dịch vụ của khách hàng hiển thị
5. Xác minh thông tin phiếu dịch vụ hiển thị:
   - Số phiếu dịch vụ
   - Mô tả vấn đề
   - Trạng thái
   - Ngày tạo
6. Nhấp vào phiếu dịch vụ để xem chi tiết
7. Kiểm tra database:

```sql
SELECT COUNT(*) as ticket_count
FROM service_tickets
WHERE customer_id = '[CUSTOMER_ID]';
-- Nên khớp với số lượng hiển thị trong UI
```

**Kết Quả Mong Đợi:**
- ✅ Tab phiếu dịch vụ của khách hàng hiển thị tất cả phiếu dịch vụ
- ✅ Số lượng phiếu dịch vụ khớp với database
- ✅ Thông tin phiếu dịch vụ chính xác
- ✅ Phiếu dịch vụ có thể nhấp để xem chi tiết
- ✅ Phiếu dịch vụ được sắp xếp theo ngày (mới nhất trước)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Số Lượng Phiếu Dịch Vụ:**
- Hiển thị trong UI: ___
- Số lượng trong database: ___

**Bằng Chứng:**
- Screenshot của phiếu dịch vụ khách hàng: _____________
- SQL output: _____________

**Ghi Chú:**

---

## Danh Mục Test 3: Tồn Kho Linh Kiện

**Tests:** 3
**Ưu Tiên:** MỨC CAO
**Tiêu Chí Pass:** Tất cả 3 tests phải pass

### RT-3.1: Thêm Linh Kiện Mới
**Mục Tiêu:** Xác minh linh kiện có thể được tạo với SKU

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Điều hướng đến `/parts`
3. Nhấp "Linh Kiện Mới"
4. Điền form linh kiện:
   - Tên: "Test Part Regression"
   - SKU: "TEST-REG-001"
   - Danh Mục: "Electronics"
   - Đơn Giá: 75000
   - Số Lượng Tồn Kho: 50
5. Lưu linh kiện
6. Xác minh thông báo thành công
7. Tìm linh kiện trong danh sách linh kiện
8. Kiểm tra database:

```sql
SELECT name, sku, category, unit_price, stock_quantity
FROM parts
WHERE sku = 'TEST-REG-001';
```

**Kết Quả Mong Đợi:**
- ✅ Form linh kiện hiển thị
- ✅ Tính duy nhất SKU được thực thi
- ✅ Linh kiện lưu thành công
- ✅ Linh kiện xuất hiện trong danh sách linh kiện
- ✅ Tất cả dữ liệu lưu đúng

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của form linh kiện: _____________
- Screenshot của danh sách linh kiện: _____________
- SQL output: _____________

**Ghi Chú:**

---

### RT-3.2: Cập Nhật Tồn Kho Linh Kiện
**Mục Tiêu:** Xác minh số lượng tồn kho linh kiện có thể được cập nhật

**Các Bước Kiểm Thử:**
1. Mở linh kiện được tạo trong RT-3.1
2. Nhấp "Cập Nhật Tồn Kho" hoặc "Chỉnh Sửa"
3. Thay đổi số lượng tồn kho từ 50 thành 75
4. Lưu
5. Xác minh thông báo thành công
6. Tải lại chi tiết linh kiện
7. Xác minh số lượng tồn kho là 75
8. Kiểm tra database:

```sql
SELECT name, sku, stock_quantity, updated_at
FROM parts
WHERE sku = 'TEST-REG-001';
```

**Kết Quả Mong Đợi:**
- ✅ Số lượng tồn kho có thể được cập nhật
- ✅ Thay đổi lưu thành công
- ✅ Database phản ánh số lượng mới
- ✅ Timestamp updated_at thay đổi

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Theo Dõi Tồn Kho:**
- Tồn kho ban đầu: 50
- Tồn kho cập nhật: ___
- Mong đợi: 75

**Bằng Chứng:**
- Screenshot sau khi cập nhật: _____________
- SQL output: _____________

**Ghi Chú:**

---

### RT-3.3: Tìm Kiếm Linh Kiện
**Mục Tiêu:** Xác minh chức năng tìm kiếm linh kiện hoạt động

**Các Bước Kiểm Thử:**
1. Điều hướng đến `/parts`
2. Sử dụng hộp tìm kiếm
3. Tìm kiếm "Test Part Regression"
4. Xác minh linh kiện xuất hiện trong kết quả
5. Tìm kiếm SKU "TEST-REG-001"
6. Xác minh linh kiện xuất hiện trong kết quả
7. Tìm kiếm linh kiện không tồn tại "ZZZZZ"
8. Xác minh thông báo "Không có kết quả"

**Kết Quả Mong Đợi:**
- ✅ Tìm kiếm theo tên trả về kết quả đúng
- ✅ Tìm kiếm theo SKU trả về kết quả đúng
- ✅ Tìm kiếm không phân biệt chữ hoa chữ thường
- ✅ Không có kết quả hiển thị thông báo phù hợp
- ✅ Tìm kiếm hiệu năng cao (<1 giây)

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của kết quả tìm kiếm: _____________

**Ghi Chú:**

---

## Danh Mục Test 4: Xác Thực & Điều Hướng

**Tests:** 2
**Ưu Tiên:** QUAN TRỌNG
**Tiêu Chí Pass:** Cả hai tests phải pass

### RT-4.1: Đăng Nhập Người Dùng và Truy Cập Dựa Trên Vai Trò
**Mục Tiêu:** Xác minh xác thực và quyền vai trò vẫn hoạt động

**Các Bước Kiểm Thử:**
1. Đăng xuất khỏi ứng dụng
2. Điều hướng đến `/login`
3. Đăng nhập với Admin (admin@example.com)
4. Xác minh chuyển hướng đến `/dashboard`
5. Xác minh các mục menu admin hiển thị:
   - Mẫu
   - Kho
   - Tồn Kho
   - Nhóm
6. Đăng xuất
7. Đăng nhập với Technician (technician@example.com)
8. Xác minh menu dành riêng cho kỹ thuật viên hiển thị:
   - Công Việc Của Tôi
   - Phiếu Dịch Vụ
9. Xác minh các tính năng chỉ dành cho admin không hiển thị
10. Kiểm tra session database:

```sql
-- Kiểm tra Supabase auth, có thể yêu cầu quyền admin
-- Xác minh người dùng đã xác thực đúng
```

**Kết Quả Mong Đợi:**
- ✅ Trang đăng nhập có thể truy cập
- ✅ Thông tin đăng nhập hợp lệ cho phép đăng nhập
- ✅ Thông tin đăng nhập không hợp lệ bị từ chối
- ✅ Admin thấy tất cả các mục menu
- ✅ Kỹ thuật viên thấy các mục menu hạn chế
- ✅ Truy cập dựa trên vai trò được thực thi

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Bằng Chứng:**
- Screenshot của bảng điều khiển admin: _____________
- Screenshot của bảng điều khiển kỹ thuật viên: _____________

**Ghi Chú:**

---

### RT-4.2: Điều Hướng Giữa Các Trang
**Mục Tiêu:** Xác minh tất cả liên kết điều hướng hoạt động

**Các Bước Kiểm Thử:**
1. Đăng nhập với Admin
2. Điều hướng qua các mục menu chính:
   - Bảng Điều Khiển
   - Phiếu Dịch Vụ
   - Khách Hàng
   - Sản Phẩm
   - Linh Kiện
   - Quy Trình → Mẫu
   - Tồn Kho → Kho
   - Tồn Kho → Mức Tồn Kho
   - Tồn Kho → RMA
   - Nhóm
3. Xác minh mỗi trang tải thành công
4. Kiểm tra console trình duyệt để tìm lỗi
5. Xác minh không có liên kết bị hỏng

**Kết Quả Mong Đợi:**
- ✅ Tất cả mục menu có thể nhấp
- ✅ Tất cả trang tải mà không có lỗi
- ✅ Không có lỗi 404
- ✅ Điều hướng mượt mà
- ✅ Không có lỗi console

**Kết Quả Thực Tế:**
- [ ] PASS [ ] FAIL

**Các Trang Đã Kiểm Thử:**
- Bảng Điều Khiển: [ ] OK [ ] Lỗi
- Phiếu Dịch Vụ: [ ] OK [ ] Lỗi
- Khách Hàng: [ ] OK [ ] Lỗi
- Sản Phẩm: [ ] OK [ ] Lỗi
- Linh Kiện: [ ] OK [ ] Lỗi
- Mẫu: [ ] OK [ ] Lỗi
- Kho: [ ] OK [ ] Lỗi
- Mức Tồn Kho: [ ] OK [ ] Lỗi
- RMA: [ ] OK [ ] Lỗi
- Nhóm: [ ] OK [ ] Lỗi

**Bằng Chứng:**
- Lỗi console (nếu có): _____________

**Ghi Chú:**

---

## Tóm Tắt Test Hồi Quy

| Danh Mục | Test IDs | Tổng | Đã Thực Hiện | Pass | Fail | Tỷ Lệ Pass |
|----------|----------|------|--------------|------|------|------------|
| Quản Lý Phiếu Dịch Vụ | RT-1.1 đến RT-1.5 | 5 | ___ | ___ | ___ | ___% |
| Quản Lý Khách Hàng | RT-2.1 đến RT-2.3 | 3 | ___ | ___ | ___ | ___% |
| Tồn Kho Linh Kiện | RT-3.1 đến RT-3.3 | 3 | ___ | ___ | ___ | ___% |
| Auth & Điều Hướng | RT-4.1 đến RT-4.2 | 2 | ___ | ___ | ___ | ___% |
| **TỔNG** | **RT-1.1 đến RT-4.2** | **13** | **___** | **___** | **___** | **___%** |

**Tiêu Chí Pass:** Tỷ lệ pass ≥95% = 13+ tests phải pass
**Lỗi Nghiêm Trọng:** ___ (phải bằng không)

---

## Đánh Giá Cuối Cùng

**Tỷ Lệ Pass Tổng Thể:** ___% (Mục tiêu: ≥95%)

**Kết Quả:** [ ] CHẤP THUẬN [ ] TỪ CHỐI

**Vấn Đề Hồi Quy Tìm Thấy:** ___

**Các Tính Năng Giai Đoạn 1 Vẫn Hoạt Động:** [ ] CÓ [ ] KHÔNG

**Khuyến Nghị:**

---

## Ký Duyệt

**Người Kiểm Thử:** _______________ Ngày: _______________
**Trưởng Nhóm QA:** _______________ Ngày: _______________
**Phê Duyệt:** [ ] PASS - Không phát hiện hồi quy [ ] FAIL - Vấn đề hồi quy phải được sửa

---

**Bước Tiếp Theo:**
- Nếu TẤT CẢ PASS: Tiến hành Checklist Kiểm Thử Hiệu Năng
- Nếu BẤT KỲ FAIL: Ghi log lỗi hồi quy (ƯU TIÊN CAO), sửa ngay lập tức, kiểm thử lại

**Tài Liệu Tham Khảo:**
- Kế Hoạch Kiểm Thử: docs/KE_HOACH_KIEM_THU.md
- Master Tracker: docs/qa/test-execution/BANG_THEO_DOI_THUC_HIEN_KIEM_THU.md
