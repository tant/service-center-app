# Kế Hoạch Kiểm Thử Giai Đoạn 2 - Trung Tâm Dịch Vụ

**Phiên Bản Tài Liệu:** 1.0
**Ngày Tạo:** 2025-10-24
**Cập Nhật Lần Cuối:** 2025-10-25
**Giai Đoạn:** Giai Đoạn 7 - QA & Triển Khai
**Story:** 1.18 - Kiểm Thử Tích Hợp và Xác Minh Hồi Quy

---

## Tóm Tắt Tổng Quan

Tài liệu này trình bày kế hoạch kiểm thử toàn diện cho Giai Đoạn 2 Trung Tâm Dịch Vụ, bao gồm tất cả tính năng được triển khai trong Stories 1.1-1.17. Chiến lược kiểm thử đảm bảo:
- Tất cả tính năng mới hoạt động như đã chỉ định
- Không có hồi quy trong chức năng Giai Đoạn 1 hiện có
- Chính sách bảo mật được thực thi chính xác
- Hiệu suất đáp ứng yêu cầu NFR
- Hệ thống sẵn sàng để triển khai production

---

## Phạm Vi Kiểm Thử

### Trong Phạm Vi
- **Tính Năng Giai Đoạn 2 (Stories 1.1-1.17):**
  - Quản lý mẫu công việc và tự động hóa quy trình
  - Thực hiện công việc với phụ thuộc và thực thi trình tự
  - Hoạt động kho (di chuyển tồn kho, lô RMA, cảnh báo tồn kho thấp)
  - Cổng yêu cầu dịch vụ công khai với theo dõi
  - Quản lý yêu cầu nhân viên và xác nhận giao hàng
  - Hệ thống thông báo email với chức năng hủy đăng ký
  - Bảng điều khiển tiến độ công việc cho Quản Lý
  - Chuyển đổi mẫu động trong quá trình dịch vụ

- **Hồi Quy Giai Đoạn 1:**
  - Thao tác CRUD phiếu dịch vụ
  - Quản lý khách hàng
  - Quản lý tồn kho linh kiện
  - Xác thực và phân quyền người dùng

- **Mối Quan Tâm Xuyên Suốt:**
  - Tính toàn vẹn database (khóa ngoại, ràng buộc, triggers)
  - Chính sách Row Level Security (RLS)
  - Hiệu suất và khả năng mở rộng
  - Bảo mật và bảo vệ dữ liệu

### Ngoài Phạm Vi
- Kiểm thử tải vượt quá 100 người dùng đồng thời
- Kiểm thử khôi phục thảm họa
- Tích hợp bên thứ ba (chưa được triển khai)

---

## Môi Trường Kiểm Thử

- **Ứng Dụng:** http://localhost:3025
- **Supabase Studio:** http://localhost:54323
- **Database:** Local PostgreSQL qua Supabase
- **Dữ Liệu Kiểm Thử:** Seeded qua `supabase/seed.sql`
- **Trình Duyệt:** Chrome/Firefox mới nhất
- **Phiên Bản Node:** Như được chỉ định trong dự án

---

## Vai Trò và Trách Nhiệm Kiểm Thử

| Vai Trò | Tên Đăng Nhập | Mật Khẩu | Trách Nhiệm |
|---------|---------------|----------|-------------|
| Quản Trị Viên | admin@example.com | (từ setup) | Truy cập đầy đủ hệ thống, quản lý mẫu |
| Quản Lý | manager@example.com | (seeded) | Truy cập bảng điều khiển, giám sát, phê duyệt |
| Kỹ Thuật Viên | technician@example.com | (seeded) | Thực hiện công việc, chuyển đổi mẫu |
| Lễ Tân | reception@example.com | (seeded) | Chuyển đổi yêu cầu, quản lý khách hàng |

---

## Các Danh Mục Kiểm Thử

### 1. Kiểm Thử Chấp Nhận Tính Năng

#### 1.1 Quản Lý Mẫu Công Việc (Story 1.2)
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Các Bước | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|----------|------------------|------------|
| FT-1.1 | Tạo mẫu công việc | 1. Đăng nhập với vai trò Quản Trị Viên<br>2. Điều hướng đến /workflows/templates<br>3. Nhấp "Mẫu Mới"<br>4. Điền tên, loại dịch vụ, công việc<br>5. Lưu | Mẫu được tạo thành công | ⏳ |
| FT-1.2 | Chỉnh sửa mẫu hiện có | 1. Mở mẫu hiện có<br>2. Sửa đổi tên/công việc<br>3. Lưu | Thay đổi được lưu, lịch sử được giữ | ⏳ |
| FT-1.3 | Mẫu với thực thi trình tự | 1. Tạo mẫu<br>2. Đặt strict_sequence = true<br>3. Thêm 3 công việc | Mẫu thực thi trình tự nghiêm ngặt | ⏳ |
| FT-1.4 | Mẫu với chế độ linh hoạt | 1. Tạo mẫu<br>2. Đặt strict_sequence = false<br>3. Thêm 3 công việc | Công việc có thể hoàn thành không theo thứ tự | ⏳ |

#### 1.2 Giao Diện Thực Hiện Công Việc (Story 1.4)
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Các Bước | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|----------|------------------|------------|
| FT-2.1 | Bắt đầu công việc | 1. Mở phiếu với công việc chờ xử lý<br>2. Nhấp "Bắt Đầu" trên công việc đầu tiên<br>3. Xác nhận | Trạng thái công việc chuyển sang "in_progress" | ⏳ |
| FT-2.2 | Hoàn thành công việc với ghi chú | 1. Bắt đầu công việc<br>2. Nhấp "Hoàn Thành"<br>3. Nhập ghi chú (tối thiểu 5 ký tự)<br>4. Gửi | Công việc được đánh dấu hoàn thành với ghi chú được lưu | ⏳ |
| FT-2.3 | Chặn công việc với lý do | 1. Bắt đầu công việc<br>2. Nhấp "Chặn"<br>3. Nhập lý do<br>4. Gửi | Công việc được đánh dấu chặn với lý do | ⏳ |
| FT-2.4 | Thực thi trình tự công việc | 1. Mẫu với strict_sequence=true<br>2. Thử bắt đầu công việc #3 trước khi #2 hoàn thành | Hệ thống ngăn chặn thực hiện không đúng thứ tự | ⏳ |

#### 1.3 Phụ Thuộc Công Việc (Story 1.5)
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Các Bước | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|----------|------------------|------------|
| FT-3.1 | Thực thi cổng tuần tự | 1. Tạo phiếu với mẫu nghiêm ngặt<br>2. Thử hoàn thành công việc 3 trước công việc 2 | Hệ thống chặn, hiển thị cảnh báo | ⏳ |
| FT-3.2 | Cảnh báo chế độ linh hoạt | 1. Tạo phiếu với mẫu linh hoạt<br>2. Hoàn thành công việc 3 trước công việc 2 | Hệ thống cho phép nhưng hiển thị cảnh báo | ⏳ |
| FT-3.3 | Tự động nâng trạng thái phiếu | 1. Hoàn thành tất cả công việc bắt buộc<br>2. Quan sát trạng thái phiếu | Phiếu tự động nâng lên "hoàn thành" | ⏳ |

#### 1.4 Hoạt Động Kho (Stories 1.6-1.10)
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Các Bước | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|----------|------------------|------------|
| FT-4.1 | Ghi nhận di chuyển kho | 1. Điều hướng đến tồn kho<br>2. Chọn sản phẩm<br>3. Ghi nhận di chuyển (NHẬP/XUẤT)<br>4. Chỉ định kho | Di chuyển được ghi nhận, tồn kho cập nhật | ⏳ |
| FT-4.2 | Cảnh báo tồn kho thấp | 1. Đặt ngưỡng tồn kho thấp của sản phẩm=10<br>2. Giảm tồn kho xuống 9<br>3. Kiểm tra bảng điều khiển | Cảnh báo xuất hiện trên trang mức tồn kho | ⏳ |
| FT-4.3 | Tạo lô RMA | 1. Điều hướng đến trang RMA<br>2. Tạo lô mới<br>3. Thêm sản phẩm với số seri<br>4. Gán cho nhà cung cấp | Lô được tạo với số tự động tạo | ⏳ |
| FT-4.4 | Tự động di chuyển sản phẩm trên phiếu | 1. Tạo phiếu với sản phẩm vật lý<br>2. Đặt trạng thái thành "đang xử lý"<br>3. Kiểm tra vị trí sản phẩm | Sản phẩm được di chuyển đến "Đang sửa chữa" tự động | ⏳ |

#### 1.5 Cổng Yêu Cầu Dịch Vụ Công Khai (Stories 1.11-1.14)
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Các Bước | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|----------|------------------|------------|
| FT-5.1 | Gửi yêu cầu dịch vụ | 1. Mở /service-request<br>2. Điền form (không cần đăng nhập)<br>3. Gửi | Yêu cầu được tạo, token theo dõi được trả về | ⏳ |
| FT-5.2 | Theo dõi yêu cầu dịch vụ | 1. Sử dụng token theo dõi<br>2. Mở /service-request/track<br>3. Nhập token | Trạng thái yêu cầu được hiển thị | ⏳ |
| FT-5.3 | Nhân viên chuyển đổi yêu cầu thành phiếu | 1. Đăng nhập với vai trò Lễ Tân<br>2. Điều hướng đến bảng điều khiển yêu cầu<br>3. Tìm yêu cầu mới<br>4. Nhấp "Chuyển Thành Phiếu"<br>5. Chọn khách hàng, sản phẩm, mẫu<br>6. Hoàn thành chuyển đổi | Phiếu được tạo, yêu cầu được đánh dấu đã chuyển đổi | ⏳ |
| FT-5.4 | Xác nhận giao hàng | 1. Hoàn thành phiếu<br>2. Nhấp "Xác Nhận Giao Hàng"<br>3. Nhập chi tiết xác nhận<br>4. Xác nhận | Giao hàng được xác nhận, email được gửi | ⏳ |
| FT-5.5 | Giới hạn tốc độ (bảo mật) | 1. Gửi 11 yêu cầu trong 1 phút | Yêu cầu thứ 11 bị chặn với lỗi 429 | ⏳ |

#### 1.6 Hệ Thống Thông Báo Email (Story 1.15)
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Các Bước | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|----------|------------------|------------|
| FT-6.1 | Email thay đổi trạng thái phiếu | 1. Cập nhật trạng thái phiếu<br>2. Kiểm tra bảng email_notifications | Email được xếp hàng với mẫu chính xác | ⏳ |
| FT-6.2 | Chức năng hủy đăng ký | 1. Nhấp liên kết hủy đăng ký trong email<br>2. Xác nhận | Khách hàng hủy đăng ký, không có email tiếp theo | ⏳ |
| FT-6.3 | Nhật ký email quản trị viên | 1. Đăng nhập với vai trò Quản Trị Viên<br>2. Điều hướng đến /dashboard/notifications<br>3. Xem email | Tất cả email được hiển thị với trạng thái | ⏳ |
| FT-6.4 | Xem trước email | 1. Mở nhật ký thông báo<br>2. Nhấp "Xem" trên email<br>3. Xem modal | Nội dung email được hiển thị trong modal | ⏳ |

#### 1.7 Bảng Điều Khiển Tiến Độ Công Việc Quản Lý (Story 1.16)
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Các Bước | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|----------|------------------|------------|
| FT-7.1 | Xem số liệu bảng điều khiển | 1. Đăng nhập với vai trò Quản Lý<br>2. Điều hướng đến /dashboard/task-progress | Các thẻ số liệu hiển thị: phiếu hoạt động, công việc đang xử lý, công việc bị chặn, thời gian hoàn thành trung bình | ⏳ |
| FT-7.2 | Cảnh báo công việc bị chặn | 1. Chặn một công việc trên phiếu<br>2. Làm mới bảng điều khiển | Phần cảnh báo hiển thị phiếu với công việc bị chặn | ⏳ |
| FT-7.3 | Bảng khối lượng công việc kỹ thuật viên | 1. Xem bảng điều khiển<br>2. Cuộn đến bảng khối lượng công việc | Tất cả kỹ thuật viên được liệt kê với số lượng công việc và tỷ lệ hoàn thành | ⏳ |
| FT-7.4 | Tự động làm mới | 1. Mở bảng điều khiển<br>2. Đợi 30 giây<br>3. Quan sát | Dữ liệu tự động làm mới | ⏳ |

#### 1.8 Chuyển Đổi Mẫu Động (Story 1.17)
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Các Bước | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|----------|------------------|------------|
| FT-8.1 | Chuyển mẫu giữa dịch vụ | 1. Mở phiếu đang xử lý<br>2. Nhấp "Đổi Mẫu"<br>3. Chọn mẫu mới<br>4. Nhập lý do (tối thiểu 10 ký tự)<br>5. Xác nhận | Mẫu được chuyển, công việc đã hoàn thành được giữ, công việc mới được thêm | ⏳ |
| FT-8.2 | Xem trước mẫu | 1. Mở modal chuyển đổi<br>2. Chọn mẫu<br>3. Xem xem trước | Xem trước hiển thị tất cả công việc từ mẫu mới | ⏳ |
| FT-8.3 | Dấu vết kiểm toán | 1. Chuyển mẫu<br>2. Truy vấn bảng ticket_template_changes | Bản ghi kiểm toán được tạo với lý do, số lượng, kỹ thuật viên | ⏳ |
| FT-8.4 | Kiểm tra - phiếu đã hoàn thành | 1. Thử chuyển mẫu trên phiếu đã hoàn thành | Hệ thống chặn với thông báo lỗi | ⏳ |
| FT-8.5 | Kiểm tra - tất cả công việc hoàn thành | 1. Hoàn thành tất cả công việc<br>2. Thử chuyển mẫu | Hệ thống chặn với thông báo lỗi | ⏳ |

---

### 2. Kiểm Thử Hồi Quy (Tính Năng Giai Đoạn 1)

#### 2.1 Quản Lý Phiếu Dịch Vụ
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|------------------|------------|
| RT-1.1 | Tạo phiếu mới | Phiếu được tạo với số tự động tạo (SV-YYYY-NNN) | ⏳ |
| RT-1.2 | Chỉnh sửa phiếu | Thay đổi được lưu chính xác | ⏳ |
| RT-1.3 | Cập nhật trạng thái phiếu | Trạng thái thay đổi, không có lỗi | ⏳ |
| RT-1.4 | Thêm linh kiện vào phiếu | Linh kiện được thêm, tổng được tính tự động | ⏳ |
| RT-1.5 | Thêm bình luận | Bình luận được lưu với dấu thời gian và người dùng | ⏳ |

#### 2.2 Quản Lý Khách Hàng
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|------------------|------------|
| RT-2.1 | Tạo khách hàng | Khách hàng được tạo thành công | ⏳ |
| RT-2.2 | Chỉnh sửa khách hàng | Thay đổi được lưu | ⏳ |
| RT-2.3 | Xem phiếu của khách hàng | Tất cả phiếu của khách hàng được hiển thị | ⏳ |

#### 2.3 Tồn Kho Linh Kiện
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|------------------|------------|
| RT-3.1 | Thêm linh kiện mới | Linh kiện được tạo với SKU | ⏳ |
| RT-3.2 | Cập nhật tồn kho linh kiện | Số lượng tồn kho được cập nhật | ⏳ |
| RT-3.3 | Tìm kiếm linh kiện | Tìm kiếm trả về kết quả chính xác | ⏳ |

---

### 3. Kiểm Thử Bảo Mật

#### 3.1 Row Level Security (RLS)
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Các Bước | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|----------|------------------|------------|
| SEC-1.1 | Quản trị viên truy cập đầy đủ | Đăng nhập với vai trò Quản Trị Viên, truy cập tất cả trang | Tất cả trang có thể truy cập | ⏳ |
| SEC-1.2 | Quản lý truy cập hạn chế | Đăng nhập với vai trò Quản Lý, thử chỉnh sửa mẫu | Chỉnh sửa mẫu bị chặn (chỉ xem) | ⏳ |
| SEC-1.3 | Kỹ thuật viên truy cập công việc | Đăng nhập với vai trò Kỹ Thuật Viên, truy cập công việc của mình | Chỉ có thể xem công việc được gán | ⏳ |
| SEC-1.4 | Lễ tân truy cập hạn chế | Đăng nhập với vai trò Lễ Tân, thử truy cập kho | Trang kho bị chặn | ⏳ |
| SEC-1.5 | Cách ly cổng công khai | Gửi yêu cầu, thử truy cập yêu cầu khác | Không thể truy cập dữ liệu yêu cầu khác | ⏳ |

#### 3.2 Kiểm Tra Đầu Vào
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|------------------|------------|
| SEC-2.1 | Thử SQL injection | Đầu vào bị chặn, không có lỗi database | ⏳ |
| SEC-2.2 | Thử XSS trong bình luận | HTML được escape, script không được thực thi | ⏳ |
| SEC-2.3 | UUID không hợp lệ trong URL | Trang 404 hoặc trang lỗi được hiển thị | ⏳ |
| SEC-2.4 | Bảo vệ CSRF | Yêu cầu không có token hợp lệ bị từ chối | ⏳ |

#### 3.3 Giới Hạn Tốc Độ
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|------------------|------------|
| SEC-3.1 | Giới hạn tốc độ yêu cầu công khai | Giới hạn 10 yêu cầu/phút được thực thi | ⏳ |
| SEC-3.2 | Giới hạn tốc độ trang theo dõi | Giới hạn 20 yêu cầu/phút được thực thi | ⏳ |

---

### 4. Kiểm Thử Hiệu Suất

#### 4.1 Thời Gian Phản Hồi
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Mục Tiêu | Thực Tế | Trạng Thái |
|----|---------------------|----------|---------|------------|
| PERF-1.1 | Tải trang danh sách phiếu | < 2s | TBD | ⏳ |
| PERF-1.2 | Tải trang chi tiết phiếu | < 1.5s | TBD | ⏳ |
| PERF-1.3 | Tải bảng điều khiển | < 3s | TBD | ⏳ |
| PERF-1.4 | Tải danh sách mẫu | < 2s | TBD | ⏳ |
| PERF-1.5 | Gửi yêu cầu công khai | < 1s | TBD | ⏳ |

#### 4.2 Truy Vấn Database
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Mục Tiêu | Thực Tế | Trạng Thái |
|----|---------------------|----------|---------|------------|
| PERF-2.1 | Truy vấn số liệu bảng điều khiển | < 500ms | TBD | ⏳ |
| PERF-2.2 | Truy vấn bảng khối lượng công việc | < 300ms | TBD | ⏳ |
| PERF-2.3 | Truy vấn danh sách công việc | < 200ms | TBD | ⏳ |
| PERF-2.4 | Materialized view mức tồn kho | < 100ms | TBD | ⏳ |

---

### 5. Kiểm Thử Tính Toàn Vẹn Dữ Liệu

#### 5.1 Ràng Buộc Database
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|------------------|------------|
| INT-1.1 | Ràng buộc khóa ngoại | Bản ghi mồ côi được ngăn chặn | ⏳ |
| INT-1.2 | Ràng buộc duy nhất | SKU/email trùng lặp được ngăn chặn | ⏳ |
| INT-1.3 | Ràng buộc kiểm tra | Chuyển trạng thái không hợp lệ bị chặn | ⏳ |
| INT-1.4 | Ràng buộc NOT NULL | Trường bắt buộc được thực thi | ⏳ |

#### 5.2 Triggers và Functions
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|------------------|------------|
| INT-2.1 | Trigger đánh số phiếu | Số tuần tự được tạo | ⏳ |
| INT-2.2 | Tạo công việc tự động | Công việc được tạo từ mẫu khi tạo phiếu | ⏳ |
| INT-2.3 | Tính toán tổng linh kiện | tổng_linh_kiện được cập nhật khi thêm/xóa linh kiện | ⏳ |
| INT-2.4 | Tự động nâng trạng thái phiếu | Phiếu tự động hoàn thành khi tất cả công việc xong | ⏳ |
| INT-2.5 | Trigger tự động di chuyển sản phẩm | Vị trí sản phẩm được cập nhật khi thay đổi trạng thái phiếu | ⏳ |

---

### 6. Kiểm Thử Quy Trình Đầu Cuối

#### 6.1 Quy Trình Dịch Vụ Hoàn Chỉnh
**Kịch Bản:** Khách hàng gửi yêu cầu → Nhân viên chuyển đổi → Công việc được thực hiện → Giao hàng được xác nhận → Email được gửi

**Các Bước:**
1. **Gửi Yêu Cầu Công Khai:**
   - Mở /service-request
   - Điền form: tên, điện thoại, thiết bị, vấn đề
   - Gửi và nhận token theo dõi

2. **Chuyển Đổi Nhân Viên:**
   - Đăng nhập với vai trò Lễ Tân
   - Điều hướng đến /dashboard/service-requests
   - Tìm yêu cầu mới
   - Nhấp "Chuyển Thành Phiếu"
   - Chọn khách hàng, sản phẩm, mẫu
   - Hoàn thành chuyển đổi

3. **Thực Hiện Công Việc:**
   - Đăng nhập với vai trò Kỹ Thuật Viên
   - Điều hướng đến /my-tasks
   - Bắt đầu công việc đầu tiên
   - Hoàn thành với ghi chú
   - Tiếp tục qua tất cả công việc

4. **Xác Nhận Giao Hàng:**
   - Đăng nhập với vai trò Quản Lý
   - Điều hướng đến phiếu đã hoàn thành
   - Nhấp "Xác Nhận Giao Hàng"
   - Nhập chi tiết giao hàng
   - Xác nhận

5. **Xác Minh Email:**
   - Kiểm tra bảng email_notifications
   - Xác minh email được gửi đến khách hàng
   - Xác minh nội dung bao gồm số phiếu và trạng thái

**Kết Quả Mong Đợi:** Tất cả các bước hoàn thành thành công, khách hàng nhận thông báo

**Trạng Thái:** ⏳ Đang chờ

#### 6.2 Chuyển Mẫu Giữa Dịch Vụ
**Kịch Bản:** Kỹ thuật viên phát hiện vấn đề khác trong quá trình chẩn đoán và chuyển mẫu

**Các Bước:**
1. Tạo phiếu với mẫu "Vấn Đề Phần Mềm"
2. Bắt đầu công việc chẩn đoán
3. Hoàn thành công việc chẩn đoán với ghi chú: "Phát hiện vấn đề phần cứng thay vì phần mềm"
4. Nhấp "Đổi Mẫu"
5. Chọn mẫu "Sửa Chữa Phần Cứng"
6. Nhập lý do: "Chẩn đoán phát hiện hư hỏng màn hình thay vì vấn đề phần mềm"
7. Xác nhận chuyển đổi
8. Xác minh công việc đã hoàn thành được giữ
9. Hoàn thành công việc phần cứng mới
10. Xác minh dấu vết kiểm toán

**Kết Quả Mong Đợi:** Mẫu được chuyển đổi thành công, công việc tiếp tục liền mạch

**Trạng Thái:** ⏳ Đang chờ

---

### 7. Kiểm Thử Đồng Thời

#### 7.1 Kịch Bản Đa Người Dùng
**Trường Hợp Kiểm Thử:**

| ID | Trường Hợp Kiểm Thử | Kết Quả Mong Đợi | Trạng Thái |
|----|---------------------|------------------|------------|
| CONC-1.1 | Hai kỹ thuật viên cập nhật phiếu khác nhau | Cả hai cập nhật thành công | ⏳ |
| CONC-1.2 | Hai người dùng chỉnh sửa cùng khách hàng | Ghi cuối cùng thắng, không có hỏng dữ liệu | ⏳ |
| CONC-1.3 | Nhiều yêu cầu được gửi đồng thời | Tất cả được xử lý chính xác | ⏳ |
| CONC-1.4 | Quản lý xem bảng điều khiển trong khi kỹ thuật viên làm việc | Bảng điều khiển cập nhật phản ánh thay đổi | ⏳ |

---

## Tóm Tắt Thực Hiện Kiểm Thử

### Lịch Trình Thực Hiện
- **Ngày 1:** Kiểm thử chấp nhận tính năng (Stories 1.2-1.5)
- **Ngày 2:** Kiểm thử chấp nhận tính năng (Stories 1.6-1.10)
- **Ngày 3:** Kiểm thử chấp nhận tính năng (Stories 1.11-1.17)
- **Ngày 4:** Kiểm thử hồi quy + Kiểm thử bảo mật
- **Ngày 5:** Kiểm thử hiệu suất + Kiểm thử tính toàn vẹn dữ liệu
- **Ngày 6:** Quy trình đầu cuối + Kiểm thử đồng thời
- **Ngày 7:** Sửa lỗi và kiểm thử lại

### Tiêu Chí Đạt/Không Đạt
- **Quan Trọng:** Tất cả kiểm thử bảo mật phải đạt (100%)
- **Ưu Tiên Cao:** Tất cả kiểm thử chấp nhận tính năng phải đạt (95%+)
- **Ưu Tiên Trung Bình:** Tất cả kiểm thử hồi quy phải đạt (95%+)
- **Ưu Tiên Thấp:** Kiểm thử hiệu suất đạt mục tiêu (80%+)

### Tóm Tắt Kết Quả Kiểm Thử (Điền trong quá trình thực hiện)

| Danh Mục | Tổng | Đạt | Không Đạt | Chặn | Tỷ Lệ Đạt |
|----------|------|-----|-----------|------|-----------|
| Chấp Nhận Tính Năng | TBD | TBD | TBD | TBD | TBD |
| Hồi Quy | TBD | TBD | TBD | TBD | TBD |
| Bảo Mật | TBD | TBD | TBD | TBD | TBD |
| Hiệu Suất | TBD | TBD | TBD | TBD | TBD |
| Toàn Vẹn Dữ Liệu | TBD | TBD | TBD | TBD | TBD |
| Quy Trình Đầu Cuối | TBD | TBD | TBD | TBD | TBD |
| Đồng Thời | TBD | TBD | TBD | TBD | TBD |
| **TỔNG** | **TBD** | **TBD** | **TBD** | **TBD** | **TBD** |

---

## Theo Dõi Lỗi

### Lỗi Quan Trọng (P0)
*Chưa xác định*

### Lỗi Ưu Tiên Cao (P1)
*Chưa xác định*

### Lỗi Ưu Tiên Trung Bình (P2)
*Chưa xác định*

### Lỗi Ưu Tiên Thấp (P3)
*Chưa xác định*

---

## Ký Duyệt

### Ký Duyệt Hoàn Thành Kiểm Thử
- [ ] Tất cả trường hợp kiểm thử đã được thực hiện
- [ ] Lỗi quan trọng đã được giải quyết
- [ ] Kết quả kiểm thử đã được ghi lại
- [ ] Hệ thống sẵn sàng để triển khai

**Người Kiểm Thử:** _________________
**Ngày:** _________________

**Người Phê Duyệt:** _________________
**Ngày:** _________________

---

## Phụ Lục

### A. Yêu Cầu Dữ Liệu Kiểm Thử
- 5 khách hàng (nhiều loại khác nhau)
- 3 mẫu công việc (bảo hành, trả phí, đổi mới)
- 10 sản phẩm qua nhiều danh mục
- 50 linh kiện với nhiều mức tồn kho khác nhau
- 20 phiếu dịch vụ ở các trạng thái khác nhau
- 5 người dùng (quản trị viên, quản lý, 2 kỹ thuật viên, lễ tân)

### B. Hạn Chế Đã Biết
- Gửi email được mô phỏng (ghi vào database, không thực sự gửi)
- Kiểm thử hiệu suất giới hạn ở môi trường local
- Không có tích hợp cổng thanh toán thực tế

### C. Công Cụ Kiểm Thử
- Kiểm thử thủ công trong trình duyệt
- Supabase Studio để xác minh database
- Chrome DevTools để kiểm tra network
- Truy vấn SQL để kiểm tra dữ liệu

---

## Thuật Ngữ Giao Diện

### Trạng Thái Phiếu Dịch Vụ
- **Chờ xử lý** (pending) - Phiếu mới chưa bắt đầu
- **Đang xử lý** (in_progress) - Đang được xử lý
- **Hoàn thành** (completed) - Đã hoàn thành
- **Đã hủy** (cancelled) - Đã hủy bỏ

### Trạng Thái Công Việc
- **Chờ xử lý** (pending) - Chưa bắt đầu
- **Đang xử lý** (in_progress) - Đang thực hiện
- **Hoàn thành** (completed) - Đã hoàn thành
- **Bị chặn** (blocked) - Bị chặn bởi vấn đề
- **Đã bỏ qua** (skipped) - Đã bỏ qua

### Mức Độ Ưu Tiên
- **Thấp** (low)
- **Bình thường** (normal)
- **Cao** (high)
- **Khẩn cấp** (urgent)

### Loại Dịch Vụ
- **Bảo hành** (warranty) - Trong thời gian bảo hành
- **Trả phí** (paid) - Hết bảo hành, khách hàng trả phí
- **Đổi mới** (replacement) - Đổi sản phẩm mới

### Vai Trò Người Dùng
- **Quản Trị Viên** (Admin) - Quyền truy cập đầy đủ
- **Quản Lý** (Manager) - Giám sát và phê duyệt
- **Kỹ Thuật Viên** (Technician) - Thực hiện công việc
- **Lễ Tân** (Reception) - Tiếp nhận và chuyển đổi yêu cầu

### Các Thuật Ngữ Khác
- **Phiếu dịch vụ** - Service Ticket
- **Khách hàng** - Customer
- **Sản phẩm** - Product
- **Linh kiện** - Parts
- **Tồn kho** - Stock/Inventory
- **Kho** - Warehouse
- **Đang sửa chữa** - Under repair (virtual warehouse)
- **Yêu cầu dịch vụ** - Service Request
- **Mẫu công việc** - Task Template
- **Công việc** - Task
- **Chuyển đổi** - Convert
- **Giao hàng** - Delivery
- **Thông báo** - Notification

---

**Kết Thúc Tài Liệu**
