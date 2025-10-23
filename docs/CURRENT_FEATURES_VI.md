# Ứng Dụng Quản Lý Trung Tâm Dịch Vụ - Tính Năng & Chức Năng

**Phiên Bản Tài Liệu:** 1.0
**Cập Nhật Lần Cuối:** 22/10/2025
**Trạng Thái:** Triển Khai Hiện Tại

---

## Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Vai Trò Người Dùng & Quyền Hạn](#vai-trò-người-dùng--quyền-hạn)
3. [Quy Trình Làm Việc Cốt Lõi](#quy-trình-làm-việc-cốt-lõi)
4. [Các Trang Ứng Dụng](#các-trang-ứng-dụng)
5. [API Endpoints](#api-endpoints)
6. [Logic Nghiệp Vụ & Tự Động Hóa](#logic-nghiệp-vụ--tự-động-hóa)
7. [Quản Lý Dữ Liệu](#quản-lý-dữ-liệu)
8. [Phân Tích & Báo Cáo](#phân-tích--báo-cáo)
9. [Xác Thực & Phân Quyền](#xác-thực--phân-quyền)
10. [Xử Lý File](#xử-lý-file)
11. [Tính Năng Database](#tính-năng-database)
12. [Thành Phần & Mẫu UI](#thành-phần--mẫu-ui)
13. [Triển Khai Kỹ Thuật](#triển-khai-kỹ-thuật)
14. [Hạn Chế Hiện Tại](#hạn-chế-hiện-tại)

---

## Tổng Quan

Ứng Dụng Quản Lý Trung Tâm Dịch Vụ là một ứng dụng web full-stack được thiết kế để quản lý quy trình phiếu dịch vụ, quan hệ khách hàng, tồn kho và phân tích kinh doanh cho các trung tâm dịch vụ/sửa chữa. Được xây dựng với Next.js 15, React 19, TypeScript, Supabase và tRPC, ứng dụng cung cấp tính an toàn kiểu dữ liệu đầu cuối và giao diện người dùng hiện đại, responsive.

**Khả Năng Chính:**
- Quản lý vòng đời phiếu dịch vụ với đánh số tự động
- Quản lý quan hệ khách hàng (CRM)
- Theo dõi danh mục sản phẩm và tồn kho linh kiện
- Kiểm soát truy cập dựa trên vai trò (Quản Trị Viên, Quản Lý, Kỹ Thuật Viên, Lễ Tân)
- Phân tích và bảng điều khiển hiệu suất thời gian thực
- Tính toán chi phí và quản lý kho tự động
- Theo dõi kiểm toán toàn diện qua ghi chú tự động

---

## Vai Trò Người Dùng & Quyền Hạn

### Quản Trị Viên (Admin) - Toàn Quyền Truy Cập Hệ Thống
- Tất cả khả năng của Quản Lý, Kỹ Thuật Viên và Lễ Tân
- Quản lý người dùng (tạo, sửa, xóa tài khoản nhân viên)
- Thiết lập và cấu hình hệ thống
- Xóa các thao tác bị hạn chế (phiếu dịch vụ, linh kiện, thương hiệu)
- Truy cập đầy đủ tất cả báo cáo và phân tích
- Truy cập trang quản lý nhóm

### Quản Lý (Manager)
- Tất cả khả năng của Kỹ Thuật Viên và Lễ Tân
- Quản lý danh mục sản phẩm (CRUD)
- Quản lý tồn kho linh kiện (CRUD)
- Truy cập phân tích và báo cáo bảng điều khiển
- Thao tác xóa phiếu dịch vụ
- Quản lý thương hiệu

### Kỹ Thuật Viên (Technician)
- Xem và làm việc trên các phiếu dịch vụ được giao
- Cập nhật trạng thái phiếu và thêm ghi chú/bình luận
- Thêm, sửa đổi và xóa linh kiện trên phiếu
- Xem thông tin khách hàng và sản phẩm
- Truy cập quản lý thương hiệu
- Truy cập bảng điều khiển hạn chế

### Lễ Tân (Reception)
- Tạo phiếu dịch vụ mới
- Xem tất cả phiếu (chỉ đọc cho phiếu chưa được giao)
- Quản lý thông tin khách hàng (CRUD)
- Xem sản phẩm và thương hiệu (chỉ đọc)
- Truy cập bảng điều khiển cơ bản

---

## Quy Trình Làm Việc Cốt Lõi

### Vòng Đời Phiếu Dịch Vụ

#### Luồng Trạng Thái (Một Chiều, Được Thực Thi Bởi Database)
```
Chờ xử lý (pending) → Đang xử lý (in_progress) → Hoàn thành (completed)
        ↓                      ↓
    Đã hủy (cancelled)    Đã hủy (cancelled)
```

**Trạng Thái Cuối:** Phiếu `hoàn thành` và `đã hủy` không thể sửa đổi (được thực thi bởi Row Level Security)

#### Tính Năng Tự Động
- **Đánh Số Phiếu:** Tự động tạo theo định dạng `SV-YYYY-NNN` (ví dụ: SV-2025-001)
- **Tính Toán Chi Phí:** `tổng_chi_phí = phí_dịch_vụ + phí_chẩn_đoán + tổng_linh_kiện - giảm_giá`
- **Tổng Linh Kiện:** Tự động cập nhật qua database triggers khi thêm/xóa linh kiện
- **Ghi Nhận Trạng Thái:** Tất cả thay đổi trạng thái được tự động ghi vào bình luận
- **Dấu Thời Gian:** `bắt_đầu_lúc` và `hoàn_thành_lúc` được theo dõi tự động
- **Theo Dõi Thay Đổi:** Tất cả thay đổi trường dữ liệu tạo ghi chú tự động

#### Thao Tác Trên Phiếu
1. **Tạo Phiếu:** Trình hướng dẫn nhiều bước với tra cứu/tạo khách hàng
2. **Cập Nhật Chi Tiết:** Phí dịch vụ, phí chẩn đoán, giảm giá, mức độ ưu tiên, loại bảo hành
3. **Giao Kỹ Thuật Viên:** Thay đổi kỹ thuật viên được giao (tự động ghi nhận)
4. **Thêm Linh Kiện:** Chọn từ kho, chỉ định số lượng (giảm tồn kho)
5. **Cập Nhật Linh Kiện:** Sửa số lượng hoặc giá (điều chỉnh tồn kho tương ứng)
6. **Xóa Linh Kiện:** Xóa linh kiện khỏi phiếu (trả lại tồn kho)
7. **Thêm Bình Luận:** Ghi chú, bình luận nội bộ với theo dõi tác giả
8. **Tải Lên Hình Ảnh:** Đính kèm ảnh/tài liệu vào phiếu
9. **Cập Nhật Trạng Thái:** Di chuyển qua các giai đoạn quy trình
10. **Hoàn Thành/Hủy:** Chuyển đổi trạng thái cuối

### Quản Lý Khách Hàng
- **Tự Động Phát Hiện:** Tra cứu số điện thoại trong khi tạo phiếu
- **Tạo Nhanh:** Tạo khách hàng ngay trong form nếu không tìm thấy
- **CRUD Đầy Đủ:** Tạo, xem, sửa, xóa khách hàng
- **Quản Lý Liên Hệ:** Theo dõi tên, điện thoại, email, địa chỉ
- **Theo Dõi Lịch Sử:** Xem lịch sử phiếu dịch vụ của khách hàng
- **Phân Tích Tăng Trưởng:** Số khách hàng mới hàng tháng với % thay đổi

### Quản Lý Tồn Kho
- **Theo Dõi Tồn Kho:** Cập nhật số lượng thời gian thực
- **Giảm Tự Động:** Khi linh kiện được thêm vào phiếu
- **Tăng Tự Động:** Khi linh kiện được xóa hoặc trả lại
- **Kiểm Tra Tồn Kho:** Ngăn chặn tồn kho âm
- **Thao Tác Nguyên Tử:** Các hàm RPC database đảm bảo tính nhất quán dữ liệu
- **Quan Hệ Sản Phẩm:** Linh kiện được liên kết với sản phẩm để dễ chọn

---

## Các Trang Ứng Dụng

### Trang Công Khai
| Đường Dẫn | Mô Tả | Truy Cập |
|-----------|-------|----------|
| `/login` | Trang đăng nhập với Supabase Auth | Công khai |
| `/setup` | Thiết lập hệ thống ban đầu (tạo tài khoản admin) | Bảo vệ bằng mật khẩu |
| `/error` | Trang xử lý lỗi | Công khai |

### Trang Yêu Cầu Đăng Nhập
| Đường Dẫn | Mô Tả | Vai Trò Yêu Cầu |
|-----------|-------|-----------------|
| `/dashboard` | Bảng điều khiển phân tích chính với số liệu và biểu đồ | Tất cả vai trò |
| `/tickets` | Danh sách phiếu dịch vụ với bộ lọc và tìm kiếm | Tất cả vai trò |
| `/tickets/add` | Tạo phiếu mới (trình hướng dẫn nhiều bước) | Lễ Tân+ |
| `/tickets/[id]` | Xem chi tiết phiếu với thông tin đầy đủ | Tất cả vai trò |
| `/tickets/[id]/edit` | Sửa chi tiết phiếu | Quản Lý+ |
| `/customers` | Quản lý khách hàng với thao tác CRUD | Tất cả vai trò |
| `/products` | Quản lý danh mục sản phẩm | Quản Lý+ |
| `/parts` | Quản lý tồn kho linh kiện | Quản Lý+ |
| `/brands` | Quản lý thương hiệu | Quản Lý+ |
| `/team` | Quản lý nhân viên/thành viên nhóm | Chỉ Admin |
| `/account` | Cài đặt hồ sơ người dùng | Tất cả vai trò |
| `/setting` | Cài đặt hệ thống | Admin+ |
| `/app-setting` | Cấu hình ứng dụng | Admin+ |
| `/report` | Trang báo cáo (placeholder) | Quản Lý+ |

---

## API Endpoints

### Admin Router (`admin.*`)
- `setup` - Thiết lập hệ thống ban đầu với bảo vệ mật khẩu và xử lý người dùng thông minh

### Profile Router (`profile.*`)
- `getCurrentUser` - Lấy hồ sơ người dùng đã xác thực với vai trò
- `updateProfile` - Cập nhật hồ sơ người dùng (tên, email, avatar)
- `getAllUsers` - Lấy danh sách tất cả người dùng đang hoạt động

### Tickets Router (`tickets.*`)
- `getTickets` - Liệt kê tất cả phiếu với thông tin khách hàng/sản phẩm
- `getTicket` - Lấy chi tiết phiếu đơn với thông tin đầy đủ và quan hệ
- `getPendingCount` - Đếm số phiếu chưa hoàn thành
- `getDailyRevenue` - Dữ liệu doanh thu theo ngày cho biểu đồ
- `createTicket` - Tạo phiếu mới với tra cứu/tạo khách hàng và linh kiện ban đầu
- `updateTicket` - Cập nhật các trường phiếu (tạo ghi chú tự động cho thay đổi)
- `updateTicketStatus` - Thay đổi trạng thái phiếu với kiểm tra
- `addTicketPart` - Thêm linh kiện vào phiếu (tự động giảm tồn kho)
- `updateTicketPart` - Cập nhật số lượng/giá linh kiện (tự động điều chỉnh tồn kho)
- `deleteTicketPart` - Xóa linh kiện khỏi phiếu (trả lại tồn kho)
- `addComment` - Thêm bình luận hoặc ghi chú vào phiếu
- `addAttachment` - Thêm metadata đính kèm file
- `getAttachments` - Lấy tất cả đính kèm của phiếu
- `deleteAttachment` - Xóa đính kèm (Quản Lý+)

### Customers Router (`customers.*`)
- `getCustomers` - Liệt kê tất cả khách hàng với thông tin liên hệ
- `getNewCustomers` - Số khách hàng hàng tháng với tỷ lệ tăng trưởng
- `createCustomer` - Thêm khách hàng mới với kiểm tra
- `updateCustomer` - Sửa chi tiết khách hàng
- `deleteCustomer` - Xóa khách hàng (bảo vệ cascade)

### Products Router (`products.*`)
- `getProducts` - Liệt kê tất cả sản phẩm với thông tin thương hiệu
- `getProduct` - Lấy sản phẩm đơn với linh kiện liên quan
- `getNewProducts` - Số sản phẩm hàng tháng với tỷ lệ tăng trưởng
- `createProduct` - Tạo sản phẩm với thương hiệu và quan hệ linh kiện
- `updateProduct` - Cập nhật chi tiết sản phẩm và liên kết linh kiện

### Parts Router (`parts.*`)
- `getParts` - Liệt kê tất cả linh kiện với mức tồn kho
- `getNewParts` - Số linh kiện hàng tháng với tỷ lệ tăng trưởng
- `createPart` - Thêm linh kiện mới với tồn kho ban đầu và liên kết sản phẩm
- `updatePart` - Cập nhật chi tiết, giá cả và quan hệ sản phẩm của linh kiện
- `deletePart` - Xóa linh kiện (dọn dẹp quan hệ sản phẩm)
- `getProducts` - Lấy sản phẩm để liên kết linh kiện

### Brands Router (`brands.*`)
- `getBrands` - Liệt kê tất cả thương hiệu với trạng thái hoạt động/không hoạt động
- `createBrand` - Tạo thương hiệu mới
- `updateBrand` - Cập nhật thương hiệu (tên, mô tả, trạng thái hoạt động)
- `deleteBrand` - Xóa thương hiệu (kiểm tra không có sản phẩm đang sử dụng)

### Revenue Router (`revenue.*`)
- `getMonthlyRevenue` - Doanh thu tháng hiện tại và tháng trước với tỷ lệ tăng trưởng

---

## Logic Nghiệp Vụ & Tự Động Hóa

### Tính Toán Tự Động
1. **Tổng Chi Phí Phiếu** (Cột Được Tạo):
   ```
   tổng_chi_phí = phí_dịch_vụ + phí_chẩn_đoán + tổng_linh_kiện - giảm_giá
   ```
2. **Tổng Linh Kiện Mỗi Phiếu** (Dựa Trên Trigger):
   - Tính toán lại khi thêm/xóa/cập nhật linh kiện
   - Tổng của (số_lượng × đơn_giá) cho tất cả linh kiện
3. **Tổng Từng Dòng**:
   - Mỗi dòng linh kiện: `số_lượng × đơn_giá`

### Hệ Thống Ghi Chú Tự Động

Hệ thống tự động tạo ghi chú cho:

| Sự Kiện | Định Dạng Ghi Chú | Loại |
|---------|-------------------|------|
| Tạo Phiếu | "Phiếu được tạo với [Sản phẩm] cho khách hàng [Tên]" | system |
| Thay Đổi Trạng Thái | "[Trạng thái cũ] → [Trạng thái mới]" | status_change |
| Thay Đổi Phí Dịch Vụ | "Phí dịch vụ cập nhật: [Cũ] → [Mới]" | note |
| Thay Đổi Phí Chẩn Đoán | "Phí chẩn đoán cập nhật: [Cũ] → [Mới]" | note |
| Áp Dụng Giảm Giá | "Giảm giá cập nhật: [Cũ] → [Mới] 💰" | note |
| Thay Đổi Mức Ưu Tiên | "Mức ưu tiên thay đổi: [Cũ] → [Mới]" | note |
| Thay Đổi Bảo Hành | "Loại bảo hành thay đổi: [Cũ] → [Mới]" | note |
| Giao Kỹ Thuật Viên | "Kỹ thuật viên thay đổi: [Cũ] → [Mới]" | assignment |
| Cập Nhật Vấn Đề | "Mô tả vấn đề cập nhật" | note |
| Cập Nhật Ghi Chú | "Ghi chú cập nhật" | note |
| Thêm Linh Kiện | "Thêm linh kiện: [Tên] (SL: X @ [Giá])" | note |
| Cập Nhật Linh Kiện | "Cập nhật linh kiện: [Tên] số lượng/giá" | note |
| Xóa Linh Kiện | "Xóa linh kiện: [Tên]" | note |

### Kiểm Tra & Quy Tắc Nghiệp Vụ

**Kiểm Tra Chuyển Trạng Thái:**
- Chỉ cho phép chuyển đổi hợp lệ (được thực thi trong API và database)
- Trạng thái cuối (hoàn thành, đã hủy) không thể sửa đổi

**Kiểm Tra Dữ Liệu:**
- Số điện thoại: 10+ ký tự, mẫu cụ thể
- Email: Kiểm tra định dạng tuân thủ RFC
- UUID: Tất cả tham chiếu khóa ngoại được kiểm tra
- Số dương: Phí, giá, số lượng phải > 0
- Số lượng tồn kho: Không thể âm

**Quản Lý Tồn Kho:**
- Thao tác nguyên tử qua các hàm RPC database
- Logic dự phòng nếu RPC không khả dụng
- Kiểm tra ngăn chặn bán quá mức

**Tính Toàn Vẹn Tham Chiếu:**
- Xóa cascade cho quan hệ
- Ngăn chặn mồ côi cho các thực thể quan trọng
- Thực thi ràng buộc khóa ngoại

---

## Quản Lý Dữ Liệu

### Thao Tác CRUD Khả Dụng

#### Khách Hàng (CRUD Đầy Đủ)
- **Tạo:** Tên, điện thoại (bắt buộc), email, địa chỉ
- **Đọc:** Tất cả khách hàng với hỗ trợ phân trang
- **Cập Nhật:** Tất cả trường có thể sửa đổi
- **Xóa:** Với kiểm tra bảo vệ cascade

#### Sản Phẩm (CRUD Đầy Đủ)
- **Tạo:** Tên, thương hiệu, loại, SKU, liên kết linh kiện
- **Đọc:** Với quan hệ thương hiệu và linh kiện
- **Cập Nhật:** Tất cả trường và quản lý liên kết linh kiện
- **Xóa:** Chỉ Admin/Quản Lý

#### Linh Kiện (CRUD Đầy Đủ)
- **Tạo:** Tên, SKU, mã linh kiện, giá, tồn kho, liên kết sản phẩm
- **Đọc:** Với mức tồn kho hiện tại
- **Cập Nhật:** Tất cả trường, giá, tồn kho, quan hệ sản phẩm
- **Xóa:** Với dọn dẹp bảng liên kết sản phẩm

#### Thương Hiệu (CRUD Đầy Đủ)
- **Tạo:** Tên, mô tả, trạng thái hoạt động
- **Đọc:** Với lọc hoạt động/không hoạt động
- **Cập Nhật:** Tên, mô tả, trạng thái hoạt động
- **Xóa:** Với kiểm tra sử dụng (ngăn xóa nếu có sản phẩm tồn tại)

#### Phiếu Dịch Vụ (CRUD Đầy Đủ)
- **Tạo:** Với tự động tìm hoặc tạo khách hàng
- **Đọc:** Tất cả quan hệ (khách hàng, sản phẩm, linh kiện, bình luận, đính kèm)
- **Cập Nhật:** Cập nhật trường rộng rãi với ghi chú tự động
- **Xóa:** Chỉ Admin/Quản Lý (có thể xóa mềm)

#### Linh Kiện Phiếu (CRUD Trên Phiếu)
- **Thêm:** Chọn từ kho với số lượng và giá
- **Cập Nhật:** Sửa số lượng hoặc đơn giá
- **Xóa:** Xóa khỏi phiếu với trả lại tồn kho

#### Bình Luận (Tạo/Đọc)
- **Tạo:** Thêm ghi chú, bình luận nội bộ
- **Đọc:** Xem với thông tin hồ sơ tác giả
- **Lọc:** Theo loại (bot/nhân viên/tất cả bình luận)

#### Đính Kèm (Tạo/Đọc/Xóa)
- **Tạo:** Tải lên hình ảnh với chuẩn hóa tên file tiếng Việt
- **Đọc:** Liệt kê tất cả đính kèm cho phiếu
- **Xóa:** Chỉ Quản Lý+

---

## Phân Tích & Báo Cáo

### Số Liệu Bảng Điều Khiển

**Chỉ Số Hiệu Suất Chính (KPI):**

1. **Doanh Thu Hàng Tháng**
   - Tổng tháng hiện tại (từ phiếu hoàn thành)
   - So sánh tháng trước
   - Phần trăm thay đổi (↑ hoặc ↓)

2. **Khách Hàng Mới**
   - Số khách hàng hàng tháng
   - Tỷ lệ tăng trưởng so với tháng trước

3. **Sản Phẩm Mới**
   - Thêm hàng tháng
   - Theo dõi tỷ lệ tăng trưởng

4. **Linh Kiện Mới**
   - Thêm tồn kho hàng tháng
   - Theo dõi tỷ lệ tăng trưởng

5. **Phiếu Chờ Xử Lý**
   - Đếm thời gian thực của phiếu chưa hoàn thành
   - Bao gồm trạng thái chờ xử lý, đang xử lý

### Biểu Đồ & Trực Quan Hóa

**Biểu Đồ Doanh Thu Hàng Ngày:**
- Biểu đồ vùng tương tác với tooltip
- Bộ lọc khoảng thời gian: 7, 30, 90 ngày
- Trực quan hóa xu hướng
- Hiển thị tổng doanh thu

**Bảng Hiệu Suất Nhân Viên:**
| Số Liệu | Mô Tả |
|---------|-------|
| Tổng Phiếu | Tất cả phiếu được giao cho kỹ thuật viên |
| Đang Xử Lý | Phiếu đang hoạt động hiện tại |
| Hoàn Thành | Phiếu hoàn thành thành công |
| Chờ Xử Lý | Phiếu chưa bắt đầu |
| Tỷ Lệ Hoàn Thành | Phần trăm phiếu hoàn thành |

### Phân Tích Doanh Thu
- Chỉ doanh thu phiếu hoàn thành (loại trừ chờ xử lý/đã hủy)
- Nhóm theo ngày để phân tích xu hướng
- So sánh tháng trước tháng sau
- Tính toán tỷ lệ tăng trưởng với chỉ số xu hướng

---

## Xác Thực & Phân Quyền

### Quy Trình Thiết Lập

**Quy Trình Thiết Lập Thông Minh:**

1. **Truy Cập Trang Thiết Lập:** Điều hướng đến `/setup`
2. **Xác Minh Mật Khẩu:** Nhập `SETUP_PASSWORD` từ biến môi trường
3. **Xử Lý Người Dùng Tự Động:**
   - **Thiết Lập Lần Đầu:** Tạo người dùng xác thực admin + hồ sơ
   - **Đặt Lại Mật Khẩu:** Nếu người dùng tồn tại, cập nhật mật khẩu
   - **Sửa Hồ Sơ:** Nếu xác thực tồn tại không có hồ sơ, tạo hồ sơ
   - **Dọn Dẹp Mồ Côi:** Nếu hồ sơ tồn tại không có xác thực, xóa mồ côi và tạo lại

**Biến Môi Trường Yêu Cầu:**
```bash
SETUP_PASSWORD=mat_khau_thiet_lap_cua_ban
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=mat_khau_bao_mat
ADMIN_NAME=Quản Trị Viên
```

### Kiểm Soát Truy Cập Dựa Trên Vai Trò (RBAC)

**Bảo Mật Ba Lớp:**

1. **Cấp Database (RLS Policies):**
   - Row Level Security trên tất cả bảng
   - Hàm trợ giúp: `is_admin()`, `is_admin_or_manager()`
   - Chính sách SELECT, INSERT, UPDATE, DELETE dựa trên vai trò

2. **Cấp API (tRPC):**
   - Context kiểm tra người dùng đã xác thực
   - Service role client bỏ qua RLS cho thao tác server
   - Kiểm tra Zod trên tất cả đầu vào

3. **Cấp UI (React):**
   - Render có điều kiện dựa trên vai trò người dùng
   - Trang bảo vệ với middleware
   - Menu điều hướng dựa trên vai trò

### Quản Lý Phiên

**Ba Loại Client:**

1. **Browser Client** (`src/utils/supabase/client.ts`)
   - Cho thao tác phía client
   - Sử dụng anon key với cookies

2. **Server Client** (`src/utils/supabase/server.ts`)
   - Cho Server Components với cookies
   - Nhận biết phiên

3. **Admin Client** (`src/utils/supabase/admin.ts`)
   - Service role key
   - Bỏ qua RLS cho thao tác server
   - Sử dụng trong context tRPC

**Luồng Xác Thực:**
- Supabase Auth với JWT tokens
- Phiên dựa trên cookie
- Tự động làm mới token
- Đăng xuất an toàn với xóa cookie

---

## Xử Lý File

### Storage Buckets

| Bucket | Mục Đích | Quyền Đọc | Quyền Ghi | Quyền Xóa |
|--------|----------|-----------|-----------|-----------|
| `avatars` | Ảnh đại diện người dùng | Công khai | Thư mục riêng | Thư mục riêng |
| `product_images` | Ảnh sản phẩm | Công khai | Thư mục riêng | Thư mục riêng |
| `service_media` | Đính kèm phiếu | Công khai | Đã xác thực | Quản Lý+ |

### Hỗ Trợ Ký Tự Tiếng Việt

**Chuẩn Hóa Tên File:**
- Loại bỏ dấu khỏi ký tự tiếng Việt:
  - `à, á, ả, ã, ạ, ă, ắ, ằ, ẳ, ẵ, ặ, â, ấ, ầ, ẩ, ẫ, ậ` → `a`
  - `đ` → `d`
  - `è, é, ẻ, ẽ, ẹ, ê, ế, ề, ể, ễ, ệ` → `e`
  - `ì, í, ỉ, ĩ, ị` → `i`
  - `ò, ó, ỏ, õ, ọ, ô, ố, ồ, ổ, ỗ, ộ, ơ, ớ, ờ, ở, ỡ, ợ` → `o`
  - `ù, ú, ủ, ũ, ụ, ư, ứ, ừ, ử, ữ, ự` → `u`
  - `ỳ, ý, ỷ, ỹ, ỵ` → `y`
- Thay thế ký tự đặc biệt bằng gạch dưới
- Giữ nguyên phần mở rộng file
- Ngăn chặn vấn đề tương thích hệ thống file

### Tính Năng Tải Lên

**Tải Lên Hình Ảnh Vào Phiếu:**
- Hỗ trợ chọn nhiều file
- Kiểm tra loại file (chỉ hình ảnh)
- Theo dõi kích thước file
- Mô tả/metadata tùy chọn
- Tự động tạo đường dẫn lưu trữ
- Liên kết qua bảng `service_ticket_attachments`

**Quản Lý Đính Kèm:**
- Xem danh sách tất cả đính kèm phiếu
- Xem trước hình ảnh (nếu hỗ trợ)
- Tải xuống file gốc
- Xóa đính kèm (chỉ Quản Lý+)

---

## Tính Năng Database

### Triggers

| Trigger | Bảng | Sự Kiện | Hành Động |
|---------|------|---------|-----------|
| `set_ticket_number` | `service_tickets` | INSERT | Tạo số phiếu duy nhất (SV-YYYY-NNN) |
| `log_status_change` | `service_tickets` | UPDATE | Tạo ghi chú tự động khi trạng thái thay đổi |
| `update_updated_at_column` | Tất cả bảng | UPDATE | Cập nhật dấu thời gian `updated_at` |

### Cột Được Tạo

| Bảng | Cột | Biểu Thức |
|------|-----|-----------|
| `service_tickets` | `total_cost` | `service_fee + diagnosis_fee + parts_total - discount_amount` |

### Indexes

**Service Tickets:**
- `ticket_number` (duy nhất)
- `customer_id`
- `product_id`
- `status`
- `priority`
- `created_at`

**Customers:**
- `phone` (indexed)
- `email` (indexed)

**Parts:**
- `sku` (indexed)
- `part_number` (indexed)

**Comments:**
- `ticket_id`
- `created_at`
- Tổng hợp: `(ticket_id, created_at DESC)`

### Hàm Database

| Hàm | Mục Đích | Tham Số |
|-----|----------|---------|
| `generate_ticket_number()` | Tạo số phiếu tuần tự mỗi năm | Không (sử dụng năm hiện tại) |
| `decrease_part_stock()` | Giảm tồn kho nguyên tử với kiểm tra | `part_id UUID, quantity INTEGER` |
| `increase_part_stock()` | Tăng tồn kho nguyên tử | `part_id UUID, quantity INTEGER` |
| `is_admin()` | Kiểm tra người dùng hiện tại là Admin | Không (sử dụng `auth.uid()`) |
| `is_admin_or_manager()` | Kiểm tra người dùng là Admin hoặc Quản Lý | Không (sử dụng `auth.uid()`) |
| `update_updated_at_column()` | Hàm trigger cho dấu thời gian | Không |

### ENUMs & Kiểu Tùy Chỉnh

**user_role:**
- `admin` (quản trị viên)
- `manager` (quản lý)
- `technician` (kỹ thuật viên)
- `reception` (lễ tân)

**ticket_status:**
- `pending` (chờ xử lý)
- `in_progress` (đang xử lý)
- `completed` (hoàn thành)
- `cancelled` (đã hủy)

**priority_level:**
- `low` (thấp)
- `normal` (bình thường)
- `high` (cao)
- `urgent` (khẩn cấp)

**warranty_type:**
- `warranty` (trong bảo hành)
- `paid` (hết bảo hành, khách hàng trả)
- `goodwill` (sửa miễn phí như cử chỉ)

**comment_type:**
- `note` (bình luận thủ công)
- `status_change` (tự động)
- `assignment` (thay đổi kỹ thuật viên)
- `system` (do hệ thống tạo)

### Database Views

**service_ticket_comments_with_author:**
- Nối `service_ticket_comments` với `profiles`
- Cung cấp bình luận với tên và email tác giả
- Sử dụng để hiển thị lịch sử bình luận với thông tin người dùng

### Ràng Buộc

**Khóa Ngoại:**
- Tất cả quan hệ với xóa cascade khi phù hợp
- Ngăn chặn bản ghi mồ côi

**Ràng Buộc Kiểm Tra:**
- Giá trị dương (phí, giá, số lượng > 0)
- Logic ngày (completed_at >= started_at)
- Giá trị enum hợp lệ

**Ràng Buộc Duy Nhất:**
- Số phiếu (mỗi năm)
- Email người dùng
- Điện thoại khách hàng (tùy chọn)

---

## Thành Phần & Mẫu UI

### Bảng Dữ Liệu

**Tính Năng:**
- Cột có thể sắp xếp
- Nút hành động nội tuyến (sửa, xóa)
- Hiển thị hành động dựa trên vai trò
- Dữ liệu thời gian thực qua tRPC + React Query
- Trạng thái loading và skeletons
- Placeholder trạng thái trống

**Bảng Phổ Biến:**
- Danh sách phiếu với badges trạng thái
- Bảng khách hàng với thông tin liên hệ
- Danh mục sản phẩm với quan hệ thương hiệu
- Tồn kho linh kiện với mức tồn kho
- Thành viên nhóm với badges vai trò
- Bảng hiệu suất nhân viên

### Forms

**Mẫu:**

1. **Trình Hướng Dẫn Nhiều Bước** (Tạo Phiếu):
   - Bước 1: Chọn/tạo khách hàng
   - Bước 2: Chọn sản phẩm
   - Bước 3: Chọn linh kiện
   - Bước 4: Chi tiết dịch vụ (phí, bảo hành, ưu tiên)
   - Chỉ báo tiến trình
   - Điều hướng Quay lại/Tiếp theo

2. **Chỉnh Sửa Nội Tuyến:**
   - Form chỉnh sửa dựa trên modal
   - Điền trước giá trị hiện tại
   - Kiểm tra thời gian thực
   - Cập nhật lạc quan

3. **Dropdown Có Thể Tìm Kiếm:**
   - Bộ chọn sản phẩm với tìm kiếm
   - Bộ chọn linh kiện với tìm kiếm
   - Tra cứu điện thoại khách hàng
   - Bộ chọn giao kỹ thuật viên

4. **Kiểm Tra Thời Gian Thực:**
   - Schemas Zod cho tất cả forms
   - Thông báo lỗi cấp trường
   - Nút gửi vô hiệu hóa cho đến khi hợp lệ

### Modals & Dialogs

**Modals Hành Động Nhanh:**
- **Bình Luận Nhanh:** Thêm ghi chú vào phiếu không cần tải lại trang
- **Tải Lên Hình Ảnh Nhanh:** Tải lên nhiều file với xem trước
- **Sửa Khách Hàng:** Cập nhật chi tiết khách hàng
- **Sửa Sản Phẩm/Linh Kiện:** Cập nhật mục tồn kho
- **Dialogs Xác Nhận:** Xác nhận xóa với cảnh báo

**Tính Năng Dialog:**
- Backdrop lớp phủ
- Phím tắt (ESC để đóng)
- Click bên ngoài để loại bỏ
- Khả năng truy cập (nhãn ARIA)

### Phản Hồi Trực Quan

**Phần Tử UI:**

1. **Thông Báo Toast:**
   - Thông báo thành công (xanh lá)
   - Thông báo lỗi (đỏ)
   - Tự động loại bỏ sau timeout
   - Nút hành động (hoàn tác, thử lại)

2. **Trạng Thái Loading:**
   - Màn hình skeleton cho bảng
   - Lớp phủ spinner cho forms
   - Chỉ báo loading nút
   - Ranh giới Suspense

3. **Badges Trạng Thái:**
   - Mã màu theo trạng thái (chờ=vàng, đang xử lý=xanh dương, hoàn thành=xanh lá, đã hủy=xám)
   - Chỉ báo ưu tiên (khẩn cấp=đỏ, cao=cam, bình thường=xanh dương, thấp=xám)
   - Badges vai trò trong bảng nhóm

4. **Chỉ Báo Tăng Trưởng:**
   - Icon xu hướng lên (xanh lá) cho tăng trưởng dương
   - Icon xu hướng xuống (đỏ) cho tăng trưởng âm
   - Hiển thị phần trăm thay đổi
   - Số liệu mã màu

5. **Trạng Thái Trống:**
   - Thông điệp thân thiện ("Chưa có phiếu")
   - Lời nhắc hành động ("Tạo phiếu đầu tiên của bạn")
   - Minh họa hoặc icons

---

## Triển Khai Kỹ Thuật

### Stack Kiến Trúc

**Frontend:**
- Next.js 15.5.4 với App Router
- React 19.1.0
- TypeScript (chế độ strict)
- Turbopack (dev và build)
- Tailwind CSS 4 với shadcn/ui

**Backend:**
- tRPC 11.6.0 cho lớp API
- Supabase cho PostgreSQL + Auth
- Server Components (RSC)
- Server Actions cho mutations

**Quản Lý Trạng Thái:**
- TanStack Query (React Query) cho trạng thái server
- React hooks cho trạng thái UI
- Trạng thái URL cho bộ lọc/phân trang
- Cập nhật lạc quan qua tRPC

**Công Cụ Developer:**
- Biome 2.2.0 (linting + formatting)
- TypeScript chế độ strict
- ESLint với config Next.js
- Git hooks (qua Husky, tùy chọn)

### An Toàn Kiểu

**Kiểu Đầu Cuối:**
1. Schema Database → Kiểu Supabase (tự động tạo)
2. tRPC routers → Kiểu Client (suy luận)
3. Zod schemas → Kiểm tra runtime
4. TypeScript → An toàn compile-time

**Mẫu:**
```typescript
// Server (tRPC procedure)
input: z.object({ ticketId: z.string().uuid() })

// Client (suy luận tự động)
const { data } = trpc.tickets.getTicket.useQuery({ ticketId })
// data được type đầy đủ dựa trên kiểu trả về server
```

### Server-Side Rendering

**Chiến Lược Rendering:**
- **Server Components:** Mặc định cho tất cả trang (không gửi JavaScript đến client)
- **Client Components:** Chỉ khi cần (chỉ thị `'use client'`)
  - Forms với tính tương tác
  - Modals và dialogs
  - Charts và trực quan hóa
  - Đăng ký dữ liệu thời gian thực

**Tối Ưu Hiệu Suất:**
- Streaming với `<Suspense>`
- Import động cho components nặng
- Code splitting ở cấp route
- Lazy loading của modals

### Mẫu Quản Lý Trạng Thái

**Trạng Thái Server (TanStack Query + tRPC):**
- Caching tự động với stale-while-revalidate
- Refetch nền
- Cập nhật lạc quan
- Xử lý lỗi và thử lại
- Thời gian stale 5 phút cho dữ liệu phân tích

**Trạng Thái UI (React Hooks):**
- `useState` cho trạng thái local component
- `useReducer` cho máy trạng thái phức tạp
- Context API cho theme và tùy chọn người dùng

**Trạng Thái URL:**
- Search params cho bộ lọc
- Route params cho ID thực thể
- Điều hướng với shallow routing

### Biện Pháp Bảo Mật

**Bảo Mật Database:**
- Row Level Security (RLS) trên tất cả bảng
- Hàm trợ giúp cho kiểm tra vai trò
- Ngăn chặn SQL injection (truy vấn tham số hóa)
- Ngăn chặn chiếm đoạt schema (`SET search_path = public, extensions`)

**Bảo Mật API:**
- Context tRPC kiểm tra người dùng đã xác thực
- Service role client cho thao tác server
- Kiểm tra đầu vào với Zod
- Bảo vệ CSRF qua Supabase Auth

**Bảo Mật Xác Thực:**
- JWT tokens với hết hạn ngắn
- Lưu trữ cookie an toàn (HttpOnly, SameSite)
- Tự động làm mới token
- Quản lý phiên

### Tối Ưu Hiệu Suất

**Database:**
- Indexes trên các cột thường truy vấn
- Indexes tổng hợp cho joins phổ biến
- Materialized views (nếu cần trong tương lai)
- Connection pooling qua Supabase

**Ứng Dụng:**
- Server-side rendering (FCP nhanh hơn)
- Code splitting mỗi route
- Tối ưu hình ảnh với Next.js `<Image>`
- Lazy loading của components không quan trọng

**Caching:**
- Cache React Query (5 phút cho metrics)
- Cache trình duyệt cho tài sản tĩnh
- Caching kết quả truy vấn database (Supabase)

---

## Hạn Chế Hiện Tại

### Chưa Triển Khai

**Module Báo Cáo:**
- Trang `/report` tồn tại nhưng không có chức năng
- Thông điệp placeholder: "Báo Cáo Sắp Ra Mắt"
- Tương lai: Xuất PDF, trình tạo báo cáo tùy chỉnh

**Trang Cài Đặt:**
- `/setting` và `/app-setting` có cấu trúc cơ bản
- Chức năng tối thiểu hiện tại
- Tương lai: Cài đặt công ty, thuế suất, mẫu email

**Thông Báo:**
- Không có hệ thống thông báo thời gian thực
- Không có thông báo push
- Không có thông báo email
- Tương lai: Thông báo WebSocket, cảnh báo email cho thay đổi trạng thái

**Liên Lạc:**
- Không gửi email (tích hợp SMTP)
- Không có thông báo SMS
- Tương lai: Biên lai email, cập nhật SMS

**Xuất & In:**
- Không xuất dữ liệu (CSV, Excel, PDF)
- Không in hóa đơn/phiếu
- Tương lai: Xem phiếu thân thiện in, hóa đơn PDF

**Tìm Kiếm:**
- Không có tìm kiếm toàn cục trên các thực thể
- Lọc hạn chế trên trang danh sách
- Tương lai: Tìm kiếm toàn văn với Postgres `pg_trgm`

**Phân Trang:**
- Không phân trang trên danh sách dài (tải tất cả bản ghi)
- Vấn đề hiệu suất tiềm ẩn với tập dữ liệu lớn
- Tương lai: Phân trang dựa trên cursor với tRPC

**Tính Năng Nâng Cao:**
- Không có thao tác hàng loạt (cập nhật trạng thái hàng loạt, xóa hàng loạt)
- Không có phiếu định kỳ hoặc lịch bảo trì
- Không có cổng khách hàng (theo dõi phiếu tự phục vụ)
- Không có cảnh báo tồn kho (cảnh báo tồn kho thấp)
- Không có UI nhật ký kiểm toán (database theo dõi thay đổi, nhưng không có UI)

### Nợ Kỹ Thuật

**Vấn Đề Đã Biết:**
- Một số Server Components có thể được tối ưu với streaming
- Đường dẫn lưu trữ đính kèm được hardcode
- Phạm vi error boundary hạn chế
- Một số components có thể được trích xuất vào thư viện UI chia sẻ

**Cải Tiến Tương Lai:**
- Triển khai React Suspense toàn diện hơn
- Thêm tests E2E với Playwright
- Thiết lập pipeline CI/CD
- Thêm ghi log lỗi toàn diện (Sentry, v.v.)
- Triển khai feature flags cho rollout dần dần

---

## Tóm Tắt

Ứng Dụng Quản Lý Trung Tâm Dịch Vụ là một **hệ thống sẵn sàng production, giàu tính năng** với:

✅ **Theo dõi phiếu mạnh mẽ** với đánh số tự động và thực thi trạng thái
✅ **Quản lý tồn kho** với điều chỉnh tồn kho tự động
✅ **Quản lý quan hệ khách hàng** với theo dõi lịch sử
✅ **Logic nghiệp vụ tự động** (tính toán chi phí, ghi chú tự động, triggers)
✅ **Phân tích toàn diện** với số liệu bảng điều khiển thời gian thực
✅ **Kiểm soát truy cập dựa trên vai trò** ở cấp database, API và UI
✅ **An toàn kiểu đầu cuối** qua tRPC và TypeScript
✅ **UI/UX hiện đại** với thiết kế responsive và cập nhật lạc quan
✅ **Xác thực an toàn** với Supabase Auth và quản lý phiên
✅ **Xử lý file** với hỗ trợ ký tự tiếng Việt

Ứng dụng nhấn mạnh **an toàn kiểu, bảo mật, trải nghiệm developer, hiệu suất và trải nghiệm người dùng** trong khi duy trì chất lượng code và mẫu kiến trúc xuất sắc.

---

**Để biết chi tiết kỹ thuật và quy trình phát triển, xem:**
- `CLAUDE.md` - Hướng dẫn phát triển và kiến trúc
- `docs/data/schemas/` - Định nghĩa schema database
- `src/server/routers/` - tRPC API endpoints

**Tài liệu được chuẩn bị bởi:** Sarah (Product Owner)
**Dựa trên:** Phân tích codebase tính đến 22/10/2025
