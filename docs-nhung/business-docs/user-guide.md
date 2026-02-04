# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG
## Dành cho Nhân viên Tiếp nhận & Bán Hàng

> **Phiên bản:** 1.0
> **Cập nhật:** 04/02/2026
> **Đối tượng:** Nhân viên tiếp nhận bảo hành, Nhân viên bán linh kiện

---

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Đăng nhập hệ thống](#2-đăng-nhập-hệ-thống)
3. [Thêm sản phẩm mới vào danh mục](#3-thêm-sản-phẩm-mới-vào-danh-mục)
4. [Nhập kho hàng mới](#4-nhập-kho-hàng-mới)
5. [Bán hàng / Xuất kho cho khách](#5-bán-hàng--xuất-kho-cho-khách)
6. [Tra cứu thông tin nhanh](#6-tra-cứu-thông-tin-nhanh)
7. [Xử lý lỗi thường gặp](#7-xử-lý-lỗi-thường-gặp)

---

## 1. Giới thiệu

Hệ thống quản lý trung tâm bảo hành giúp bạn thực hiện các công việc:

| Công việc | Mô tả |
|-----------|-------|
| **Quản lý sản phẩm** | Thêm mới, chỉnh sửa thông tin sản phẩm trong danh mục |
| **Nhập kho** | Nhập hàng mới từ nhà cung cấp, theo dõi serial number |
| **Bán hàng** | Xuất bán sản phẩm cho khách, lưu thông tin khách hàng |
| **Tra cứu** | Kiểm tra tồn kho, tra cứu serial, thông tin bảo hành |

### Cấu trúc kho trong hệ thống

Hệ thống sử dụng **2 cấp kho**:
- **Kho vật lý (Physical Warehouse):** Vị trí lưu trữ thực tế (VD: Kho Công ty)
- **Kho ảo (Virtual Warehouse):** Phân loại trạng thái/mục đích của sản phẩm

#### 7 Loại Kho Ảo

| Tên Kho | Ý nghĩa |
|---------|---------|
| **Kho Chính** | Hàng tồn kho thông thường, sẵn sàng để bán |
| **Kho Bảo Hành** | Hàng còn bảo hành, sẵn sàng thay thế cho khách |
| **Hàng Đã Bán** | Sản phẩm đã bán, đang ở phía khách hàng |
| **Kho Đang Sửa Chữa** | Sản phẩm đang được bảo hành/sửa chữa |
| **Kho Hàng Hỏng** | Sản phẩm hỏng không sửa được, chờ thanh lý hoặc tháo linh kiện |
| **Kho Chờ Trả Hàng** | Sản phẩm chờ gửi trả nhà cung cấp/nhà sản xuất |
| **Kho Linh Kiện** | Linh kiện thay thế và phụ tùng |

---

## 2. Đăng nhập hệ thống

### Bước thực hiện

1. Mở trình duyệt web (Chrome, Firefox, Edge)
2. Truy cập địa chỉ hệ thống: `https://[địa-chỉ-hệ-thống]`
3. Nhập **Tên đăng nhập** và **Mật khẩu**
4. Nhấn **"Đăng nhập"**

### Sau khi đăng nhập thành công

- Màn hình **Dashboard** hiển thị
- Thanh menu bên trái hiển thị các chức năng theo quyền của bạn
- Góc phải trên hiển thị tên tài khoản

> **Lưu ý:** Nếu quên mật khẩu, liên hệ quản trị viên để reset

---

## 3. Thêm sản phẩm mới vào danh mục

> **Khi nào cần thực hiện:** Khi có sản phẩm mới chưa có trong hệ thống, cần thêm vào danh mục trước khi nhập kho.

### 3.1. Truy cập chức năng

**Menu:** Quản lý Sản phẩm → Danh mục Sản phẩm → Thêm Sản phẩm Mới

### 3.2. Nhập thông tin cơ bản

Điền các thông tin bắt buộc (có dấu *):

| Trường | Ví dụ | Ghi chú |
|--------|-------|---------|
| **Tên sản phẩm*** | ZOTAC RTX 4090 24GB | Tên đầy đủ của sản phẩm |
| **Mã sản phẩm (SKU)*** | ZT-RTX4090-24G | Mã duy nhất, không được trùng |
| **Thương hiệu*** | ZOTAC | Chọn từ danh sách hoặc thêm mới |
| **Danh mục*** | Card đồ họa | Chọn từ cây danh mục |
| Mô tả | Card đồ họa ZOTAC Gaming... | Tùy chọn |

### 3.3. Cấu hình bảo hành mặc định

| Trường | Ví dụ | Ghi chú |
|--------|-------|---------|
| **Bảo hành hãng** | 36 tháng | Thời hạn BH từ nhà sản xuất |
| **Bảo hành công ty** | 48 tháng | Thời hạn BH của công ty |
| Điều kiện BH | Không áp dụng với hư hỏng do người dùng... | Ghi chú điều kiện |

### 3.4. Thông tin bổ sung (tùy chọn)

- Giá bán lẻ tham khảo
- Hình ảnh sản phẩm (upload)
- Thông số kỹ thuật
- Ghi chú nội bộ

### 3.5. Lưu sản phẩm

1. Kiểm tra lại thông tin
2. Nhấn **"Lưu Sản phẩm"**
3. Chờ thông báo: "Đã tạo sản phẩm thành công"

### Kiểm tra kết quả

- Sản phẩm xuất hiện trong **Danh mục Sản phẩm**
- Có thể tìm kiếm bằng tên, SKU hoặc thương hiệu
- Tồn kho hiển thị: **0** (chưa nhập hàng)

---

## 4. Nhập kho hàng mới

> **Khi nào cần thực hiện:** Khi nhận hàng từ nhà cung cấp, cần nhập vào hệ thống để quản lý.

### 4.1. Truy cập chức năng

**Menu:** Quản lý Kho → Nhập Kho → Tạo Phiếu Nhập Kho Mới

### 4.2. Tạo phiếu nhập kho

| Trường | Ví dụ | Ghi chú |
|--------|-------|---------|
| **Nhà cung cấp** | ZOTAC Technology | Chọn từ danh sách |
| **Kho vật lý đích** | Kho Công ty | Thường là "Kho Công ty" |
| Ghi chú | Nhập hàng theo PO-2026-001 | Tùy chọn |

### 4.3. Thêm sản phẩm vào phiếu

1. Nhấn **"Thêm Sản phẩm"**
2. Chọn **Sản phẩm**: VD: ZOTAC RTX 4090 24GB
3. Nhập **Số lượng**: VD: 100
4. Chọn **Kho ảo đích**: Main (Kho Chính)
5. Nhấn **"Thêm"**

### 4.4. Nhập Serial Numbers

> **Quan trọng:** Mỗi sản phẩm cần có serial number riêng để theo dõi

**Cách nhập:**

1. Click vào ô **"Nhập Serial Numbers"**
2. Nhập mỗi serial trên một dòng:
   ```
   ABC123456701
   ABC123456702
   ABC123456703
   ...
   ```
3. Nhấn **"Validate Serials"** để kiểm tra
4. Đảm bảo hiển thị: "100/100 serials hợp lệ" (số tương ứng với số lượng nhập)

**Lưu ý khi nhập serial:**
- Không được trùng với serial đã có trong hệ thống
- Mỗi serial phải là duy nhất
- Số lượng serial phải bằng số lượng sản phẩm nhập

### 4.5. Nhập thông tin bảo hành

| Trường | Ví dụ | Ghi chú |
|--------|-------|---------|
| **Ngày bắt đầu BH hãng** | 04/02/2026 | Ngày bắt đầu BH từ hãng |
| **Thời hạn BH hãng** | 36 tháng | Hệ thống tự tính ngày hết hạn |
| **Ngày bắt đầu BH công ty** | 04/02/2026 | Thường là ngày nhập kho |
| **Thời hạn BH công ty** | 48 tháng | Hệ thống tự tính ngày hết hạn |
| **Tình trạng sản phẩm** | New (Mới) | Chọn: New/Used/Refurbished |

### 4.6. Xác nhận nhập kho

1. Kiểm tra lại toàn bộ thông tin:
   - Sản phẩm đúng
   - Số lượng đúng
   - Serial đầy đủ
   - Thông tin bảo hành chính xác
2. Nhấn **"Xác nhận Nhập Kho"**
3. Chờ hệ thống xử lý
4. Nhận thông báo: "Đã nhập kho thành công X sản phẩm"

### Kiểm tra kết quả

**Vào Quản lý Kho → Xem Tồn Kho:**

| Thông tin | Giá trị |
|-----------|---------|
| Kho | Main (Kho Chính) |
| Sản phẩm | ZOTAC RTX 4090 24GB |
| Số lượng | 100 cái |
| Trạng thái | Available (Sẵn sàng) |

---

## 5. Bán hàng / Xuất kho cho khách

> **Khi nào cần thực hiện:** Khi khách hàng mua sản phẩm

### 5.1. Truy cập chức năng

**Menu:** Quản lý Kho → Xuất Kho → Tạo Phiếu Xuất Kho

### 5.2. Chọn loại xuất kho

1. Chọn **Loại xuất kho**: "Bán hàng (Sales)"
2. Nhấn **"Tiếp tục"**

### 5.3. Nhập thông tin khách hàng

| Trường | Ví dụ | Ghi chú |
|--------|-------|---------|
| **Họ tên*** | Nguyễn Văn A | Bắt buộc |
| **Số điện thoại*** | 0912345678 | Bắt buộc - dùng để tra cứu |
| Email | nguyenvana@email.com | Tùy chọn |
| Địa chỉ | 123 Nguyễn Văn Linh, Q7 | Tùy chọn |

Nhấn **"Kiểm tra khách hàng"**:
- Nếu khách cũ: Hệ thống tự điền thông tin
- Nếu khách mới: Hệ thống tạo profile mới

### 5.4. Chọn sản phẩm bán

1. Nhấn **"Thêm Sản phẩm"**
2. Chọn **Kho nguồn**: Main (Kho Chính)
3. Chọn **Sản phẩm**: VD: ZOTAC RTX 4090 24GB
4. Nhập **Số lượng**: VD: 1
5. Nhấn **"Thêm"**

### 5.5. Chọn Serial Numbers

> **Quan trọng:** Phải chọn đúng serial sản phẩm giao cho khách

1. Nhấn **"Chọn Serials"**
2. Hệ thống hiển thị danh sách serials có sẵn
3. **Cách 1:** Click chọn từng serial cần bán
4. **Cách 2:** Nhấn "Chọn tự động X đầu tiên"
5. Xác nhận đã chọn đủ số lượng: "Đã chọn X/X serials"
6. Nhấn **"Xác nhận chọn serials"**

### 5.6. Xác nhận bán hàng

1. Kiểm tra lại thông tin:
   - Khách hàng: Đúng tên, SĐT
   - Sản phẩm: Đúng loại, số lượng
   - Serials: Đã chọn đủ
2. Chọn **Phương thức thanh toán**: Tiền mặt / Chuyển khoản
3. Nhấn **"Xác nhận Xuất Kho & Bán Hàng"**
4. Chờ hệ thống xử lý
5. Nhận thông báo: "Bán hàng thành công! Mã đơn: SO-20XX-XXX"

### Hệ thống tự động thực hiện

Khi bạn xác nhận bán hàng, hệ thống **TỰ ĐỘNG**:

| Hành động | Chi tiết |
|-----------|----------|
| Tạo phiếu xuất kho | Mã phiếu: SO-20XX-XXX |
| Di chuyển kho | Sản phẩm từ Main → Customer Installed |
| Cập nhật sản phẩm | Trạng thái: Đã bán, Chủ sở hữu: Tên KH |
| Cập nhật tồn kho | Main giảm, Customer Installed tăng |
| Ghi log | Lưu lịch sử giao dịch |

### Kiểm tra kết quả

**Tồn kho sau khi bán (ví dụ bán 1 cái từ 100):**

| Kho | Trước | Sau |
|-----|-------|-----|
| Main (Kho Chính) | 100 | 99 |
| Customer Installed | 0 | 1 |

---

## 6. Tra cứu thông tin nhanh

### 6.1. Tra cứu Serial

**Menu:** Tra cứu Serial

1. Nhập serial number: VD: ABC123456701
2. Nhấn **"Tìm kiếm"**
3. Xem thông tin:

| Thông tin | Ý nghĩa |
|-----------|---------|
| Sản phẩm | Tên sản phẩm |
| Tình trạng | New/Used/Refurbished |
| Vị trí | Kho hiện tại |
| Chủ sở hữu | Tên khách hàng (nếu đã bán) |
| BH Hãng | Ngày hết hạn + số ngày còn lại |
| BH Công ty | Ngày hết hạn + số ngày còn lại |
| Lịch sử | Các sự kiện đã xảy ra |

### 6.2. Tra cứu tồn kho

**Menu:** Quản lý Kho → Xem Tồn Kho

1. Chọn **Kho**: Main / Customer Installed / ...
2. Tìm kiếm theo tên sản phẩm (nếu cần)
3. Xem danh sách sản phẩm và số lượng

### 6.3. Tra cứu khách hàng

**Menu:** Quản lý Khách hàng

1. Nhập **Số điện thoại** hoặc **Tên** khách hàng
2. Nhấn **"Tìm kiếm"**
3. Xem thông tin:
   - Thông tin liên hệ
   - Sản phẩm đã mua
   - Lịch sử bảo hành

---

## 7. Xử lý lỗi thường gặp

### 7.1. "SKU đã tồn tại"

**Nguyên nhân:** Mã sản phẩm đã có trong hệ thống

**Cách xử lý:**
- Kiểm tra lại trong danh mục sản phẩm
- Nếu đã có, không cần tạo mới
- Nếu cần tạo SKU khác, đổi mã khác

### 7.2. "Serial đã tồn tại"

**Nguyên nhân:** Serial number đã được nhập trước đó

**Cách xử lý:**
- Tra cứu serial để xem sản phẩm đó đang ở đâu
- Kiểm tra lại serial trên sản phẩm thực tế
- Liên hệ quản lý nếu serial bị trùng thật sự

### 7.3. "Không đủ tồn kho"

**Nguyên nhân:** Số lượng muốn xuất lớn hơn số có sẵn

**Cách xử lý:**
- Kiểm tra tồn kho thực tế
- Giảm số lượng xuất
- Hoặc nhập thêm hàng trước khi xuất

### 7.4. "Validation failed"

**Nguyên nhân:** Thiếu thông tin bắt buộc

**Cách xử lý:**
- Kiểm tra các trường có dấu (*)
- Điền đầy đủ thông tin
- Kiểm tra định dạng (số điện thoại, email...)

---

## Quy trình tổng quát

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUY TRÌNH NHẬP - BÁN HÀNG                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. THÊM SẢN PHẨM (nếu chưa có)                                │
│     Quản lý Sản phẩm → Danh mục → Thêm mới                     │
│                           ↓                                     │
│  2. NHẬP KHO                                                    │
│     Quản lý Kho → Nhập Kho → Tạo phiếu                         │
│     → Thêm SP → Nhập Serial → Nhập BH → Xác nhận               │
│                           ↓                                     │
│  3. BÁN HÀNG                                                    │
│     Quản lý Kho → Xuất Kho → Bán hàng                          │
│     → Nhập KH → Chọn SP → Chọn Serial → Xác nhận               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Liên hệ hỗ trợ

Nếu gặp vấn đề không giải quyết được, liên hệ:

| Kênh | Thông tin |
|------|-----------|
| Email | support@sstc.vn |
| Hotline | 1900-xxxx |
| Quản lý trực tiếp | [Tên quản lý] |

---

_Tài liệu hướng dẫn sử dụng - Công ty Cổ phần Công nghệ SSTC_
_Phiên bản 1.0 - Ngày 04/02/2026_
