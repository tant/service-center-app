# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG

---

## MỤC LỤC

### Phần A: Quản lý Sản phẩm & Kho
1. [Giới thiệu](#1-giới-thiệu)
2. [Đăng nhập hệ thống](#2-đăng-nhập-hệ-thống)
3. [Thêm sản phẩm mới vào danh mục](#3-thêm-sản-phẩm-mới-vào-danh-mục)
4. [Nhập kho hàng mới](#4-nhập-kho-hàng-mới)
5. [Bán hàng / Xuất kho cho khách](#5-bán-hàng--xuất-kho-cho-khách)
6. [Quản lý Khách hàng](#6-quản-lý-khách-hàng)

### Phần B: Tiếp nhận & Xử lý Bảo hành
7. [Tạo phiếu dịch vụ (Tiếp nhận bảo hành)](#7-tạo-phiếu-dịch-vụ-tiếp-nhận-bảo-hành)
8. [Kỹ thuật viên thực hiện công việc](#8-kỹ-thuật-viên-thực-hiện-công-việc)
9. [Duyệt đổi sản phẩm mới (Warranty Replacement)](#9-duyệt-đổi-sản-phẩm-mới-warranty-replacement)
10. [Quy trình RMA gửi hàng về hãng](#10-quy-trình-rma-gửi-hàng-về-hãng)

### Phần C: Tiện ích
11. [Tra cứu thông tin nhanh](#11-tra-cứu-thông-tin-nhanh)
12. [Xử lý lỗi thường gặp](#12-xử-lý-lỗi-thường-gặp)

---

## 1. Giới thiệu

Hệ thống quản lý trung tâm bảo hành giúp bạn thực hiện các công việc:

| Công việc | Mô tả |
|-----------|-------|
| **Quản lý sản phẩm** | Thêm mới, chỉnh sửa thông tin sản phẩm trong danh mục |
| **Nhập kho** | Nhập hàng mới từ nhà cung cấp, theo dõi serial number |
| **Bán hàng** | Xuất bán sản phẩm cho khách, lưu thông tin khách hàng |
| **Tiếp nhận bảo hành** | Tạo phiếu dịch vụ, kiểm tra tình trạng bảo hành |
| **Xử lý bảo hành** | Kỹ thuật viên thực hiện sửa chữa theo workflow |
| **Đổi trả & RMA** | Duyệt đổi sản phẩm mới, gửi hàng lỗi về hãng |
| **Tra cứu** | Kiểm tra tồn kho, tra cứu serial, thông tin bảo hành |

### Cấu trúc kho trong hệ thống

Hệ thống sử dụng **2 cấp kho**:
- **Kho vật lý (Physical Warehouse):** Vị trí lưu trữ thực tế
- **Kho ảo (Virtual Warehouse):** Phân loại trạng thái/mục đích của sản phẩm

#### 5 Loại Kho Ảo

| Tên Kho | Mục đích | Khi nào TĂNG tồn kho | Khi nào GIẢM tồn kho |
|---------|----------|----------------------|---------------------|
| **Kho Chính** | Lưu trữ hàng mới nhập, sẵn sàng để bán hoặc chuyển sang kho bảo hành | • Nhập hàng từ nhà cung cấp | • Xuất bán cho khách hàng<br>• Chuyển sang Kho Bảo Hành |
| **Kho Hàng Bán** | Theo dõi sản phẩm đã bán và đang sử dụng bởi khách hàng | • Tạo phiếu xuất bán hàng | • Tự động chuyển sang Kho Sửa Chữa khi tạo phiếu dịch vụ |
| **Kho Bảo Hành** | Lưu trữ hàng dự phòng để thay thế cho khách khi sản phẩm không sửa được | • Chuyển kho từ Kho Chính (phiếu chuyển kho thủ công) | • Đổi sản phẩm mới cho khách (Warranty Replacement) |
| **Kho Sửa Chữa** | Lưu trữ sản phẩm đang trong quá trình bảo hành/sửa chữa | • Tạo phiếu dịch vụ thành công<br>• Hàng tự động chuyển từ Kho Hàng Bán | • Sửa xong: tự động chuyển về Kho Hàng Bán<br>• Không sửa được: tự động chuyển sang Kho Hàng Hỏng |
| **Kho Hàng Hỏng** | Lưu trữ sản phẩm không sửa được, chờ thanh lý hoặc xử lý | • Kết thúc phiếu dịch vụ với kết quả "Không sửa được"<br>• Hàng tự động chuyển từ Kho Sửa Chữa | • Tạo lô RMA |

> **Lưu ý:** Hầu hết các chuyển động giữa các kho ảo đều được hệ thống **TỰ ĐỘNG** thực hiện dựa trên workflow nghiệp vụ, đảm bảo theo dõi chính xác vị trí và trạng thái của từng sản phẩm.

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

| Trường | Ví dụ | Ghi chú |
|--------|-------|---------|
| **Tên sản phẩm*** | ZOTAC RTX 4090 24GB | Tên đầy đủ của sản phẩm |
| **Mã sản phẩm (SKU)*** | ZT-RTX4090-24G | Mã duy nhất, không được trùng |
| **Thương hiệu*** | ZOTAC | Chọn từ danh sách |
| **Danh mục*** | Card đồ họa | Chọn từ danh sách |
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

## 6. Quản lý Khách hàng

> **Khi nào cần thực hiện:** Khi cần tạo hồ sơ khách hàng mới hoặc cập nhật thông tin khách hàng

### 6.1. Tạo khách hàng mới

**Menu:** Quản lý Khách hàng → Tạo Khách hàng Mới

#### Bước 1: Nhập thông tin cơ bản

| Trường | Ví dụ | Ghi chú |
|--------|-------|---------|
| **Họ tên*** | Nguyễn Văn A | Bắt buộc |
| **Số điện thoại*** | 0912345678 | Bắt buộc - dùng để định danh KH |
| Email | nguyenvana@email.com | Tùy chọn - dùng gửi thông báo |
| Địa chỉ | 123 Nguyễn Văn Linh, Q7, TP.HCM | Tùy chọn |

#### Bước 2: Lưu khách hàng

1. Kiểm tra lại thông tin
2. Nhấn **"Lưu Khách hàng"**
3. Nhận thông báo: "Tạo khách hàng thành công"

**Lưu ý:**
- Số điện thoại phải là **duy nhất** trong hệ thống
- Nếu SĐT đã tồn tại → Hệ thống báo lỗi "Số điện thoại đã được sử dụng"

### 6.2. Tìm kiếm khách hàng

**Menu:** Quản lý Khách hàng

**Cách tìm kiếm:**

1. Nhập vào ô tìm kiếm:
   - Số điện thoại (khuyến nghị)
   - Họ tên
   - Email
2. Nhấn **"Tìm kiếm"** hoặc Enter
3. Kết quả hiển thị danh sách khách hàng phù hợp

### 6.3. Xem chi tiết khách hàng

Click vào tên khách hàng để xem:

| Tab | Nội dung |
|-----|----------|
| **Thông tin** | Họ tên, SĐT, Email, Địa chỉ, Ghi chú |
| **Sản phẩm đã mua** | Danh sách SP đã mua + Serial |
| **Lịch sử bảo hành** | Các phiếu dịch vụ liên quan |
| **Lịch sử giao dịch** | Các phiếu xuất kho |

### 6.4. Cập nhật thông tin khách hàng

1. Tìm và mở chi tiết khách hàng
2. Nhấn **"Chỉnh sửa"**
3. Cập nhật thông tin cần thay đổi
4. Nhấn **"Lưu thay đổi"**
5. Nhận thông báo: "Cập nhật thông tin khách hàng thành công"

**Lưu ý:** Không thể thay đổi số điện thoại nếu khách hàng đã có lịch sử giao dịch.

### 6.5. Tạo khách hàng nhanh (trong flow Bán hàng)

Khi tạo phiếu xuất kho / bán hàng:

1. Nhập **Số điện thoại** khách hàng
2. Nhấn **"Kiểm tra"**
3. Nếu **khách mới**:
   - Hệ thống hiển thị: "Khách hàng mới"
   - Nhập **Họ tên** (bắt buộc)
   - Nhập Email, Địa chỉ (tùy chọn)
   - Khách hàng sẽ được tạo **tự động** khi xác nhận phiếu
4. Nếu **khách cũ**:
   - Hệ thống tự động điền thông tin
   - Có thể chỉnh sửa nếu cần

---

## 7. Tạo phiếu dịch vụ (Tiếp nhận bảo hành)

> **Khi nào cần thực hiện:** Khi khách hàng mang sản phẩm đến yêu cầu bảo hành/sửa chữa

### 6.1. Truy cập chức năng

**Menu:** Phiếu Dịch vụ → Tạo Phiếu Mới

### 6.2. Nhập Serial và Kiểm tra Bảo hành

1. Tại trường **"Serial Number"**, nhập serial sản phẩm khách mang đến
   - VD: `ABC123456701`
2. Nhấn **"Kiểm tra"**
3. Chờ hệ thống xác minh (1-2 giây)

**Kết quả kiểm tra:**

| Trạng thái | Hiển thị | Ý nghĩa |
|------------|----------|---------|
| ✅ Còn bảo hành | Badge xanh lá | Sản phẩm được bảo hành miễn phí |
| ⚠️ Hết bảo hành | Badge vàng | Dịch vụ có phí |
| ❌ Không hợp lệ | Badge đỏ | Serial không tồn tại trong hệ thống |

**Thông tin hiển thị sau khi kiểm tra:**

| Thông tin | Ví dụ |
|-----------|-------|
| Sản phẩm | ZOTAC RTX 4090 24GB |
| Thương hiệu | ZOTAC |
| BH Hãng | 04/02/2026 → 04/02/2029 (còn 1095 ngày) |
| BH Công ty | 04/02/2026 → 04/02/2030 (còn 1460 ngày) |
| Chủ sở hữu | Nguyễn Văn A (0912345678) |

### 6.3. Điền thông tin yêu cầu

Sau khi xác minh thành công, hệ thống **TỰ ĐỘNG ĐIỀN SẴN** thông tin khách hàng từ dữ liệu mua hàng.

**Thông tin cần nhập thêm:**

| Trường | Ví dụ | Ghi chú |
|--------|-------|---------|
| **Mô tả lỗi*** | Card không lên màn hình, có tiếng beep 3 lần | Bắt buộc - mô tả chi tiết |
| **Loại dịch vụ** | Warranty (Bảo hành) | Tự động chọn nếu còn BH |
| Ảnh đính kèm | card-loi.jpg | Tùy chọn - tối đa 5 ảnh |

### 6.4. Tạo phiếu dịch vụ

1. Kiểm tra lại thông tin:
   - Khách hàng đúng
   - Serial đúng
   - Mô tả lỗi rõ ràng
2. Nhấn **"Tạo Phiếu Dịch vụ"**
3. Chờ hệ thống xử lý
4. Nhận thông báo: "Tạo phiếu dịch vụ thành công! Mã phiếu: SV-20XX-XXX"

### Hệ thống tự động thực hiện

| Hành động | Chi tiết |
|-----------|----------|
| Tạo phiếu | Mã phiếu: SV-20XX-XXX, Trạng thái: Pending |
| Di chuyển kho | Serial từ **Hàng Đã Bán** → **Kho Đang Sửa Chữa** |
| Gửi thông báo | Email xác nhận đến khách hàng |

### 6.5. In phiếu tiếp nhận

1. Nhấn **"In phiếu tiếp nhận"**
2. In 2 bản: 1 cho khách ký, 1 lưu hồ sơ
3. Khách hàng ký xác nhận giao sản phẩm

---

## 8. Kỹ thuật viên thực hiện công việc

> **Khi nào cần thực hiện:** Khi có phiếu dịch vụ được gán cho kỹ thuật viên

### 8.1. Xem danh sách công việc

**Menu:** Hộp công việc của tôi (My Tasks)

Màn hình hiển thị danh sách phiếu được gán:

| Mã phiếu | Khách hàng | Sản phẩm | Trạng thái | Ưu tiên |
|----------|------------|----------|------------|---------|
| SV-2026-001 | Nguyễn Văn A | ZOTAC RTX 4090 | Pending | Normal |

### 8.2. Mở phiếu và xem Workflow Tasks

1. Click vào phiếu cần xử lý
2. Xem thông tin chi tiết: khách hàng, sản phẩm, mô tả lỗi
3. Xem danh sách **Workflow Tasks** (các bước cần thực hiện)

**Ví dụ danh sách tasks:**

| # | Task | Yêu cầu | Trạng thái |
|---|------|---------|------------|
| 1 | Kiểm tra bao bì và phụ kiện | Ghi chú | **Pending** ✅ |
| 2 | Chụp ảnh tình trạng ban đầu | Ảnh | Blocked |
| 3 | Kiểm tra nguồn card | Ghi chú | Blocked |
| 4 | Test stress GPU 30 phút | Ghi chú + Ảnh | Blocked |
| 5 | Vệ sinh card | - | Blocked (không bắt buộc) |
| 6 | Chụp ảnh sau sửa chữa | Ảnh | Blocked |
| 7 | Test cuối cùng | Ghi chú | Blocked |
| 8 | Đóng gói sản phẩm | - | Blocked |

> **Lưu ý:** Tasks phải thực hiện **theo thứ tự**. Task tiếp theo chỉ mở khóa khi task trước hoàn thành.

### 8.3. Thực hiện từng Task

**Quy trình cho mỗi task:**

1. Nhấn **"Bắt đầu"** → Task chuyển sang **In Progress**
2. Thực hiện công việc thực tế
3. Nhập kết quả theo yêu cầu:
   - **Ghi chú:** Nhập mô tả kết quả
   - **Ảnh:** Upload ảnh minh chứng
4. Nhấn **"Hoàn thành"** → Task chuyển sang **Completed**
5. Task tiếp theo tự động mở khóa (**Pending**)

**Ví dụ nhập kết quả:**

| Task | Kết quả nhập |
|------|--------------|
| Kiểm tra bao bì | "Hộp nguyên vẹn, đầy đủ phụ kiện: cáp nguồn 8-pin x2" |
| Chụp ảnh ban đầu | Upload: card-mat-truoc.jpg, card-mat-sau.jpg |
| Test stress GPU | "Chạy test 30 phút, nhiệt độ max 75°C, không crash" + ảnh kết quả |

### 8.4. Bỏ qua Task không bắt buộc

- Task không bắt buộc có nút **"Bỏ qua (Skip)"**
- Click để bỏ qua và chuyển sang task tiếp theo
- VD: Task "Vệ sinh card" có thể bỏ qua nếu không cần thiết

### 8.5. Hoàn thành phiếu

Khi hoàn thành task cuối cùng, hệ thống **TỰ ĐỘNG**:

| Hành động | Chi tiết |
|-----------|----------|
| Cập nhật phiếu | Trạng thái: **Sẵn sàng giao hàng** |
| Di chuyển kho | Serial từ **Kho Đang Sửa Chữa** → **Hàng Đã Bán** |
| Gửi email | Thông báo khách hàng: "Sản phẩm đã sửa xong" |

### 8.6. Báo cáo không sửa được

Nếu sản phẩm **KHÔNG SỬA ĐƯỢC**:

1. Nhấn **"Báo cáo kết quả"**
2. Chọn Outcome: **"Không sửa được (Unrepairable)"**
3. Nhập lý do: "Chip GPU hỏng hoàn toàn, không thể khắc phục"
4. Nhấn **"Gửi để Manager duyệt"**

→ Phiếu chuyển sang trạng thái **Chờ duyệt**, Manager sẽ quyết định đổi mới hoặc xử lý khác.

---

## 8. Duyệt đổi sản phẩm mới (Warranty Replacement)

> **Khi nào cần thực hiện:** Khi kỹ thuật viên báo cáo sản phẩm không sửa được và cần đổi mới

### 8.1. Xem phiếu chờ duyệt

**Menu:** Phiếu chờ duyệt (hoặc Dashboard thông báo)

1. Click vào phiếu cần duyệt
2. Xem kết quả chẩn đoán của kỹ thuật viên:
   - Outcome: Không sửa được
   - Lý do chi tiết
   - Ảnh và ghi chú từ các tasks

### 8.2. Kiểm tra điều kiện bảo hành

Xác nhận:
- ✅ Sản phẩm còn trong thời hạn bảo hành
- ✅ Lỗi thuộc phạm vi bảo hành (không do người dùng)
- ✅ Có sản phẩm thay thế trong kho

### 8.3. Duyệt đổi sản phẩm mới

1. Nhấn **"Duyệt đổi mới"**
2. Form **"Chọn sản phẩm thay thế"** hiển thị

### 8.4. Chọn sản phẩm thay thế

| Trường | Giá trị |
|--------|---------|
| **Kho nguồn** | Kho Chính (Main) |
| **Sản phẩm** | ZOTAC RTX 4090 24GB |
| **Số lượng khả dụng** | 39 cái |

1. Hệ thống hiển thị danh sách serial khả dụng
2. Chọn 1 serial để thay thế: VD: `ABC123456762`
3. Nhấn **"Xác nhận thay thế"**

### Hệ thống tự động thực hiện

| Hành động | Chi tiết |
|-----------|----------|
| Sản phẩm LỖI | Serial cũ: **Kho Đang Sửa Chữa** → **Kho Hàng Hỏng** |
| Sản phẩm THAY THẾ | Serial mới: **Kho Chính** → **Hàng Đã Bán** |
| Cập nhật phiếu | Outcome: Warranty Replacement, Trạng thái: Sẵn sàng giao |
| Tạo phiếu xuất | Ghi nhận xuất kho sản phẩm thay thế |

### 8.5. Giao sản phẩm thay thế cho khách

1. Khi khách đến nhận:
   - Kiểm tra thông tin khách hàng
   - In biên nhận với serial mới
2. Khách ký nhận
3. Nhấn **"Xác nhận đã giao hàng"**
4. Phiếu chuyển trạng thái: **Hoàn thành**

---

## 9. Quy trình RMA gửi hàng về hãng

> **Khi nào cần thực hiện:** Khi có sản phẩm lỗi cần gửi về nhà sản xuất để đổi/sửa

### 9.1. Tạo lô RMA

**Menu:** Quản lý RMA → Tạo RMA Batch

1. Nhấn **"Tạo lô RMA mới"**
2. Chọn sản phẩm lỗi cần gửi về hãng:
   - ☑ ABC123456702 (ZOTAC RTX 4090, Lỗi: Chip GPU hỏng)
3. Nhập thông tin:

| Trường | Ví dụ |
|--------|-------|
| **Nhà cung cấp/Hãng** | ZOTAC Technology |
| Ghi chú | RMA theo bảo hành hãng, phiếu SV-2026-002 |

4. Nhấn **"Xác nhận tạo lô RMA"**

**Kết quả:**
- Lô RMA được tạo: `RMA-20260205-001`
- Serial tự động chuyển: **Kho Hàng Hỏng** → **Kho Chờ Trả Hàng**

### 9.2. In phiếu RMA

1. Vào chi tiết lô RMA
2. Nhấn **"In phiếu RMA"**
3. Phiếu bao gồm:
   - Mã lô RMA
   - Danh sách sản phẩm + serial
   - Lý do RMA
   - Thông tin nhà cung cấp

### 9.3. Đóng gói và gửi hàng

1. Lấy sản phẩm từ **Kho Chờ Trả Hàng**
2. Đóng gói theo quy cách
3. Đính kèm phiếu RMA đã in
4. Gửi qua đơn vị vận chuyển

### 9.4. Cập nhật trạng thái "Đã gửi"

1. Vào lô RMA → Nhấn **"Đánh dấu đã gửi"**
2. Nhập thông tin vận chuyển:

| Trường | Ví dụ |
|--------|-------|
| **Tracking number** | VN1234567890 |
| **Đơn vị vận chuyển** | GHTK / GHN |
| **Ngày gửi** | 05/02/2026 |
| **Dự kiến nhận** | 15/02/2026 |

3. Nhấn **"Xác nhận"**
4. Lô RMA chuyển trạng thái: **Đã gửi (Shipped)**

### 9.5. Nhận hàng thay thế từ hãng

Khi nhận được hàng từ hãng:

1. Vào **Quản lý Kho → Nhập Kho**
2. Tạo phiếu nhập:

| Trường | Giá trị |
|--------|---------|
| **Loại nhập** | RMA Return (Trả về từ hãng) |
| **Sản phẩm** | ZOTAC RTX 4090 24GB |
| **Serial** | ZTC999888777 (serial mới từ hãng) |
| **Kho đích** | Kho Chính (Main) |
| **Link RMA Batch** | RMA-20260205-001 |

3. Nhấn **"Xác nhận nhập kho"**

### 9.6. Hoàn tất lô RMA

1. Vào lô RMA → Nhấn **"Đánh dấu hoàn tất"**
2. Nhập thông tin:
   - Serial nhận được: ZTC999888777
   - Ngày nhận: 15/02/2026
3. Nhấn **"Xác nhận hoàn tất"**
4. Lô RMA chuyển trạng thái: **Hoàn tất (Completed)**

---

## 10. Tra cứu thông tin nhanh

### 10.1. Tra cứu Serial

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

### 10.2. Tra cứu tồn kho

**Menu:** Quản lý Kho → Xem Tồn Kho

1. Chọn **Kho**: Kho Chính / Hàng Đã Bán / ...
2. Tìm kiếm theo tên sản phẩm (nếu cần)
3. Xem danh sách sản phẩm và số lượng

### 10.3. Tra cứu khách hàng

**Menu:** Quản lý Khách hàng

1. Nhập **Số điện thoại** hoặc **Tên** khách hàng
2. Nhấn **"Tìm kiếm"**
3. Xem thông tin:
   - Thông tin liên hệ
   - Sản phẩm đã mua
   - Lịch sử bảo hành

### 10.4. Tra cứu phiếu dịch vụ

**Menu:** Phiếu Dịch vụ → Danh sách

1. Tìm theo: Mã phiếu, Serial, Tên khách hàng, SĐT
2. Lọc theo: Trạng thái, Ngày tạo, Loại dịch vụ
3. Xem chi tiết phiếu: Timeline, Tasks, Kết quả

---

## 11. Xử lý lỗi thường gặp

### 11.1. "SKU đã tồn tại"

**Nguyên nhân:** Mã sản phẩm đã có trong hệ thống

**Cách xử lý:**
- Kiểm tra lại trong danh mục sản phẩm
- Nếu đã có, không cần tạo mới
- Nếu cần tạo SKU khác, đổi mã khác

### 11.2. "Serial đã tồn tại"

**Nguyên nhân:** Serial number đã được nhập trước đó

**Cách xử lý:**
- Tra cứu serial để xem sản phẩm đó đang ở đâu
- Kiểm tra lại serial trên sản phẩm thực tế
- Liên hệ quản lý nếu serial bị trùng thật sự

### 11.3. "Không đủ tồn kho"

**Nguyên nhân:** Số lượng muốn xuất lớn hơn số có sẵn

**Cách xử lý:**
- Kiểm tra tồn kho thực tế
- Giảm số lượng xuất
- Hoặc nhập thêm hàng trước khi xuất

### 11.4. "Validation failed"

**Nguyên nhân:** Thiếu thông tin bắt buộc

**Cách xử lý:**
- Kiểm tra các trường có dấu (*)
- Điền đầy đủ thông tin
- Kiểm tra định dạng (số điện thoại, email...)

### 11.5. "Serial không hợp lệ" (khi tạo phiếu bảo hành)

**Nguyên nhân:** Serial không tồn tại trong hệ thống

**Cách xử lý:**
- Kiểm tra lại serial trên sản phẩm
- Xác nhận sản phẩm có được mua từ công ty không
- Nếu sản phẩm không có trong hệ thống, tạo dịch vụ có phí

---

## Quy trình tổng quát

### A. Quy trình Nhập - Bán hàng

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

### B. Quy trình Bảo hành

```
┌─────────────────────────────────────────────────────────────────┐
│                      QUY TRÌNH BẢO HÀNH                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. TIẾP NHẬN (Reception)                                       │
│     Phiếu Dịch vụ → Tạo mới → Nhập Serial → Kiểm tra BH        │
│     → Mô tả lỗi → Tạo phiếu                                    │
│                           ↓                                     │
│  2. SỬA CHỮA (Technician)                                       │
│     Hộp công việc → Mở phiếu → Thực hiện tasks theo thứ tự     │
│                           ↓                                     │
│            ┌──────────────┴──────────────┐                      │
│            ↓                             ↓                      │
│      SỬA ĐƯỢC                    KHÔNG SỬA ĐƯỢC                 │
│         ↓                             ↓                         │
│   Hoàn thành tasks            Báo cáo → Manager duyệt          │
│         ↓                             ↓                         │
│   Giao SP cho khách           Đổi SP mới (Warranty Replacement)│
│                                       ↓                         │
│                               Giao SP thay thế cho khách       │
│                                       ↓                         │
│                               SP lỗi → Kho Hàng Hỏng → RMA     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### C. Quy trình RMA

```
┌─────────────────────────────────────────────────────────────────┐
│                        QUY TRÌNH RMA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. TẠO LÔ RMA                                                  │
│     Quản lý RMA → Tạo lô → Chọn SP lỗi → Xác nhận              │
│     SP chuyển: Kho Hàng Hỏng → Kho Chờ Trả Hàng                │
│                           ↓                                     │
│  2. GỬI HÀNG                                                    │
│     In phiếu RMA → Đóng gói → Gửi vận chuyển                   │
│     Cập nhật: Đánh dấu đã gửi + Tracking number                │
│                           ↓                                     │
│  3. NHẬN HÀNG TỪ HÃNG                                          │
│     Nhập Kho → Loại: RMA Return → Nhập serial mới              │
│                           ↓                                     │
│  4. HOÀN TẤT                                                    │
│     Đánh dấu hoàn tất lô RMA                                   │
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
_Phiên bản 2.0 - Ngày 04/02/2026_
