# QUY TRÌNH NGHIỆP VỤ CHÍNH

## Hệ Thống Quản Lý Trung Tâm Bảo Hành

**Dành cho:** Công ty Cổ phần Công nghệ SSTC
**Phiên bản:** 2.0
**Ngày cập nhật:** 2026-02-05
**Trạng thái:** Chờ phê duyệt

---

## MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Kiến trúc Kho](#2-kiến-trúc-kho)
3. [Quản lý Danh mục Sản phẩm](#3-quản-lý-danh-mục-sản-phẩm)
4. [Nhập Kho](#4-nhập-kho)
5. [Quản lý Khách hàng](#5-quản-lý-khách-hàng)
6. [Bán hàng](#6-bán-hàng)
7. [Bảo hành & Sửa chữa](#7-bảo-hành--sửa-chữa)
8. [RMA — Đổi trả về hãng](#8-rma--đổi-trả-về-hãng)
9. [Vai trò & Phân quyền](#9-vai-trò--phân-quyền)
10. [Phê duyệt](#10-phê-duyệt)

---

## 1. TỔNG QUAN

### 1.1. Mục đích

Hệ thống quản lý toàn bộ hoạt động của trung tâm bảo hành linh kiện điện tử — từ nhập hàng, bán hàng, tiếp nhận bảo hành, sửa chữa, đến đổi trả về hãng (RMA). Mọi sản phẩm đều được theo dõi theo **serial number** xuyên suốt vòng đời.

### 1.2. Phạm vi & Các Module

| Module | Phạm vi |
|--------|---------|
| Danh mục Sản phẩm | Danh mục sản phẩm, thương hiệu, phân loại |
| Quản lý Kho | Kho 2 cấp (vật lý + 5 kho ảo), nhập/xuất/chuyển kho, theo dõi serial |
| Bán hàng | Xuất bán sản phẩm theo serial, gán thông tin khách hàng |
| Phiếu Yêu cầu | Tiếp nhận yêu cầu bảo hành/sửa chữa từ khách hàng |
| Phiếu Dịch vụ | Quản lý quá trình sửa chữa/bảo hành theo 3 kịch bản kết quả |
| Quản lý RMA | Gửi hàng lỗi về nhà sản xuất, nhận hàng thay thế |
| Quản lý Khách hàng | Hồ sơ khách hàng, liên kết đơn hàng |

---

## 2. KIẾN TRÚC KHO

Hệ thống sử dụng **2 cấp kho**:

- **Kho vật lý:** Vị trí lưu trữ thực tế.
- **Kho ảo:** Phân loại theo trạng thái và mục đích sử dụng.

### 2.1. 5 Kho ảo

| Kho ảo | Mục đích |
|--------|----------|
| **Kho Chính** | Hàng mới nhập, sẵn sàng để bán hoặc chuyển sang kho bảo hành |
| **Kho Hàng Bán** | Sản phẩm đã bán, khách hàng đang sử dụng |
| **Kho Bảo Hành** | Hàng dự phòng để thay thế cho khách khi sản phẩm không sửa được |
| **Kho Sửa Chữa** | Sản phẩm đang trong quá trình bảo hành/sửa chữa |
| **Kho Hàng Hỏng** | Sản phẩm không sửa được, chờ xử lý |

> **Lưu ý:** Sản phẩm đã bán vẫn nằm trong hệ thống (Kho Hàng Bán) để theo dõi bảo hành. Chỉ khi gửi RMA về hãng thì sản phẩm mới ra khỏi hệ thống.

### 2.2. Quy tắc di chuyển kho

| # | Sự kiện nghiệp vụ | Từ kho | Đến kho | Loại |
|---|-------------------|--------|---------|------|
| 1 | Nhập kho từ nhà cung cấp | — | Kho Chính | Tự động |
| 2 | Bán hàng | Kho Chính | Kho Hàng Bán | Tự động |
| 3 | Tạo phiếu dịch vụ | Kho Hàng Bán | Kho Sửa Chữa | Tự động |
| 4 | Sửa xong — trả khách | Kho Sửa Chữa | Kho Hàng Bán | Tự động |
| 5 | Hết bảo hành, trả sản phẩm lỗi cho khách | Kho Sửa Chữa | Kho Hàng Bán | Tự động |
| 6 | Còn bảo hành, đổi mới — sản phẩm lỗi giữ lại | Kho Sửa Chữa | Kho Hàng Hỏng | Tự động |
| 7 | Còn bảo hành, đổi mới — sản phẩm thay thế cho khách | Kho Bảo Hành | Kho Hàng Bán | Tự động |
| 8 | Gửi RMA về hãng | Kho Hàng Hỏng | Ra khỏi hệ thống | Tự động |
| 9 | Chuyển hàng dự phòng bảo hành | Kho Chính | Kho Bảo Hành | **Thủ công** |

> **Lưu ý:** Quy tắc #9 là thao tác thủ công **duy nhất**. Tất cả các quy tắc còn lại đều tự động theo nghiệp vụ.

---

## 3. QUẢN LÝ DANH MỤC SẢN PHẨM

**Mục tiêu:** Tạo và quản lý danh mục sản phẩm. Sản phẩm phải có trong danh mục trước khi nhập kho.

### 3.1. Quy trình

1. Truy cập "Danh mục Sản phẩm"
2. Chọn "Thêm Sản phẩm"
3. Nhập thông tin
4. Lưu
5. Sản phẩm xuất hiện trong danh mục, sẵn sàng để nhập kho

### 3.2. Thông tin sản phẩm

| Trường | Bắt buộc | Ví dụ |
|--------|:--------:|-------|
| Tên sản phẩm | ✅ | ZOTAC RTX 4090 24GB |
| Mã sản phẩm (SKU) | ✅ | ZT-RTX4090-24G |
| Thương hiệu | ✅ | ZOTAC |
| Loại sản phẩm | ✅ | Card đồ họa |
| Model | | ZT-D40900J-10P |
| Mô tả | | ZOTAC Gaming GeForce RTX 4090 24GB GDDR6X |
| Hình ảnh | | URL hoặc upload |

### 3.3. Quy tắc nghiệp vụ

- SKU trùng → **Block** (không cho tạo)
- Tên sản phẩm trùng → **Cảnh báo** (cho phép tiếp tục)

---

## 4. NHẬP KHO

**Mục tiêu:** Nhập hàng mới vào hệ thống, ghi nhận serial và thông tin bảo hành cho từng sản phẩm.

### 4.1. Quy trình

1. Chọn "Tạo Phiếu Nhập"
2. Chọn: Lý do nhập kho, Kho đích, Ngày nhập
3. Thêm sản phẩm + số lượng (có thể nhiều sản phẩm trong 1 phiếu)
4. Nhấn "Tạo phiếu nhập"
5. Nhập serial numbers (mỗi serial 1 dòng)
6. Nhập thông tin bảo hành (hãng + công ty)
7. Nhấn "Xác nhận nhập kho"

### 4.2. Thông tin phiếu nhập

| Trường | Bắt buộc | Ghi chú |
|--------|:--------:|---------|
| Lý do nhập kho | ✅ | Nhập mua hàng / Nhập RMA về |
| Kho đích | ✅ | Kho Chính hoặc Kho Bảo Hành |
| Ngày nhập | ✅ | Không cho phép ngày tương lai; lùi ngày tối đa 7 ngày |
| Sản phẩm | ✅ | Chọn từ danh mục |
| Số lượng | ✅ | |
| Serial numbers | ✅ | Duy nhất toàn hệ thống |
| Bảo hành hãng: ngày bắt đầu + thời hạn | ✅ | Tự động tính ngày hết hạn |
| Bảo hành công ty: ngày bắt đầu + thời hạn | ✅ | Tự động tính ngày hết hạn |
| Ghi chú | | Số đơn đặt hàng, hóa đơn... |

### 4.3. Kết quả

- Hệ thống tạo **bản ghi sản phẩm vật lý** cho mỗi serial
- Thông tin mỗi serial gồm: vị trí kho, bảo hành hãng và công ty, tình trạng sản phẩm
- Hệ thống tự động cập nhật tồn kho
- Người dùng có thể tra cứu bất kỳ serial nào

### 4.4. Quy tắc nghiệp vụ

- Serial đã tồn tại trong hệ thống → **Block**

---

## 5. QUẢN LÝ KHÁCH HÀNG

**Mục tiêu:** Tạo và quản lý hồ sơ khách hàng để liên kết với đơn hàng.

### 5.1. Thông tin khách hàng

| Trường | Bắt buộc | Ghi chú |
|--------|:--------:|---------|
| Họ tên | ✅ | |
| Số điện thoại | ✅ | Duy nhất — dùng để định danh khách hàng |
| Email | | |
| Địa chỉ | | |
| Loại khách hàng | ✅ | Cá nhân / Doanh nghiệp |
| Ghi chú | | |

### 5.2. Quy tắc nghiệp vụ

- Số điện thoại trùng → **Block** (hiển thị link đến khách hàng đã có)
- Tìm kiếm khách hàng bằng: họ tên, số điện thoại, email
- Khi tạo phiếu xuất bán, nhập số điện thoại → hệ thống **tự động điền** thông tin khách hàng nếu đã có trong hệ thống

---

## 6. BÁN HÀNG

**Mục tiêu:** Xuất bán sản phẩm cho khách hàng, làm cơ sở xác minh bảo hành sau này.

### 6.1. Quy trình

1. Chọn "Tạo Phiếu Xuất Kho" — Loại: Bán hàng
2. Nhập thông tin khách hàng (số điện thoại → tự động điền nếu khách hàng đã có)
3. Chọn sản phẩm, số lượng, kho nguồn
4. Chọn serial numbers cụ thể
5. Nhấn "Xác nhận Xuất Kho & Bán Hàng"

### 6.2. Hệ thống tự động thực hiện khi xác nhận

| Hành động | Chi tiết |
|-----------|----------|
| Tạo phiếu xuất kho | Lưu đầy đủ thông tin đơn hàng |
| Di chuyển kho | **Kho Chính → Kho Hàng Bán** |
| Cập nhật serial | Trạng thái = Đã bán, Chủ sở hữu = Khách hàng |
| Cập nhật tồn kho | Kho Chính giảm, Kho Hàng Bán tăng |
| Ghi log | Thời gian, người thực hiện, chi tiết |

### 6.3. Kết nối với Bảo hành

Sau khi bán, khách hàng dùng **serial number** để yêu cầu bảo hành. Quy trình xác minh bảo hành xem tại [mục 7.2](#72-tạo-phiếu-yêu-cầu).

### 6.4. Quy tắc nghiệp vụ

- Số lượng vượt tồn kho → **Block**
- Chỉ cho phép chọn serial **đang ở Kho Chính**

---

## 7. BẢO HÀNH & SỬA CHỮA

**Mục tiêu:** Quản lý toàn bộ chu trình từ tiếp nhận sản phẩm lỗi, chẩn đoán, sửa chữa, đến hoàn trả cho khách hàng.

### 7.1. Tổng quan 3 kịch bản xử lý

| Kịch bản | Điều kiện | Kết quả | Khách nhận |
|-----------|-----------|---------|------------|
| **A — Sửa được** | Kỹ thuật viên sửa thành công | Repaired | Sản phẩm cũ đã sửa |
| **B — Không sửa được, hết bảo hành** | Hết bảo hành, không sửa được | Return to Customer | Sản phẩm cũ (vẫn lỗi) |
| **C — Không sửa được, còn bảo hành** | Còn bảo hành, không sửa được | Warranty Replacement | Sản phẩm mới thay thế |

### 7.2. Tạo Phiếu Yêu cầu

Phiếu Yêu cầu được tạo khi tiếp nhận yêu cầu bảo hành/sửa chữa từ khách hàng.

1. Truy cập "Phiếu Yêu cầu" → Nhấn "Tạo Phiếu Mới"
2. Nhập serial number
3. Hệ thống tự động xác minh bảo hành
4. Điền thông tin yêu cầu (mô tả lỗi, ảnh minh họa...)
5. Nhấn "Tạo Phiếu Yêu cầu"

**Xác minh bảo hành tự động khi nhập serial:**

| Kết quả kiểm tra | Hiển thị | Loại dịch vụ |
|-------------------|----------|-------------|
| Serial hợp lệ + còn bảo hành | Thông tin sản phẩm, khách hàng (điền sẵn), thời hạn bảo hành | Warranty (miễn phí) |
| Serial hợp lệ + hết bảo hành | Cảnh báo hết bảo hành | Paid Service (có phí) |
| Serial không tồn tại | Lỗi — không cho tạo phiếu | — |
| Serial chưa bán (còn trong kho) | Lỗi — không cho tạo phiếu | — |
| Serial đang có phiếu yêu cầu mở | Lỗi — hiển thị link đến phiếu hiện tại | — |

**Trạng thái Phiếu Yêu cầu:** **Open** → **In Service** → **Completed**

| Trạng thái | Ý nghĩa |
|------------|---------|
| **Open** | Đã tiếp nhận yêu cầu, chưa bắt đầu xử lý |
| **In Service** | Đã tạo Phiếu Dịch vụ, đang xử lý |
| **Completed** | Đã hoàn tất, trả hàng cho khách |

### 7.3. Tạo Phiếu Dịch vụ

Phiếu Dịch vụ được tạo từ Phiếu Yêu cầu khi bắt đầu quá trình sửa chữa/bảo hành.

> **Lưu ý:** Quan hệ 1:1 — Mỗi Phiếu Yêu cầu tạo tối đa 1 Phiếu Dịch vụ. Phiếu Yêu cầu có thể tồn tại độc lập (chưa tạo Phiếu Dịch vụ).

1. Từ Phiếu Yêu cầu → Nhấn "Tạo Phiếu Dịch vụ"
2. Hệ thống tự động:
   - Di chuyển kho: Kho Hàng Bán → Kho Sửa Chữa
   - Tạo mã phiếu: SV-YYYY-NNN

### 7.4. Kịch bản A — Sửa được (Repaired)

1. Kỹ thuật viên sửa chữa xong
2. Cập nhật kết quả: "Sửa được" (Repaired)
3. Hệ thống tự động:
   - Di chuyển kho: Kho Sửa Chữa → Kho Hàng Bán
4. Chuyển quy trình giao hàng (mục 7.7)

**Luồng kho:** `Kho Hàng Bán → Kho Sửa Chữa → Kho Hàng Bán`

### 7.5. Kịch bản B — Không sửa được + Hết bảo hành → Trả lại khách

1. Kỹ thuật viên chẩn đoán → Kết quả: "Không sửa được" (Unrepairable)
2. Nhập lý do chi tiết
3. Quyết định: "Trả lại khách" (Return to Customer)
4. Hệ thống tự động:
   - Di chuyển kho: Kho Sửa Chữa → Kho Hàng Bán
5. Chuyển quy trình giao hàng (mục 7.7)

**Luồng kho:** `Kho Hàng Bán → Kho Sửa Chữa → Kho Hàng Bán`
*(Sản phẩm vẫn lỗi, trả nguyên cho khách)*

### 7.6. Kịch bản C — Không sửa được + Còn bảo hành → Đổi mới (Warranty Replacement)

1. Kỹ thuật viên chẩn đoán → Kết quả: "Không sửa được" (Unrepairable)
2. Quyết định: "Đổi mới" (Warranty Replacement)
3. Chọn sản phẩm thay thế từ Kho Bảo Hành (chọn serial cụ thể)
4. Hệ thống tự động:
   - Sản phẩm lỗi: Kho Sửa Chữa → Kho Hàng Hỏng
   - Sản phẩm thay thế: Kho Bảo Hành → Kho Hàng Bán
   - Liên kết sản phẩm thay thế vào phiếu
5. Tạo hoặc thêm sản phẩm lỗi vào lô RMA
6. Chuyển quy trình giao hàng (mục 7.7)

**Luồng kho sản phẩm lỗi:** `Kho Hàng Bán → Kho Sửa Chữa → Kho Hàng Hỏng → [Gửi RMA → Ra khỏi hệ thống]`

**Luồng kho sản phẩm thay thế:** `Kho Bảo Hành → Kho Hàng Bán → [Giao cho khách]`

### 7.7. Quy trình giao hàng (chung cho tất cả kịch bản)

1. Phiếu chuyển trạng thái: Ready for Pickup
2. Khách đến nhận → Nhấn "Xác nhận đã giao hàng"
3. Phiếu chuyển trạng thái: Completed

### 7.8. Trạng thái Phiếu Dịch vụ

**In Progress** → **Ready for Pickup** → **Completed**

| Trạng thái | Ý nghĩa |
|------------|---------|
| **In Progress** | Đang sửa chữa |
| **Ready for Pickup** | Sẵn sàng giao khách |
| **Completed** | Đã giao khách, phiếu đóng |

---

## 8. RMA — ĐỔI TRẢ VỀ HÃNG

**Mục tiêu:** Gom sản phẩm lỗi không sửa được thành lô, ghi nhận thông tin gửi về nhà sản xuất.

### 8.1. Thông tin lô RMA

| Trường | Mô tả |
|--------|-------|
| Mã lô | RMA-YYYYMMDD-XXX |
| Nhà sản xuất/Nhà cung cấp | Hãng nhận hàng trả |
| Danh sách serial | Các serial từ Kho Hàng Hỏng |
| Mã vận đơn | Mã theo dõi vận chuyển |
| Ghi chú | Thông tin bổ sung |

### 8.2. Nhận hàng thay thế từ hãng

Khi nhà sản xuất gửi hàng thay thế về → tạo **Phiếu Nhập Kho** với lý do **"Nhập RMA về"** (xem mục 4).

---

## 9. VAI TRÒ & PHÂN QUYỀN

### 9.1. Vai trò

| Vai trò | Mô tả ngắn |
|---------|------------|
| **Quản trị** | Quản trị hệ thống và người dùng |
| **Quản lý** | Giám sát vận hành toàn bộ |
| **Kỹ thuật viên** | Sửa chữa sản phẩm |
| **Tiếp nhận** | Giao dịch trực tiếp với khách hàng |

### 9.2. Ma trận phân quyền

**Ký hiệu:** ✅ = Toàn quyền | Chỉ đọc = Xem, không sửa | — = Không có quyền

| Chức năng | Quản trị | Quản lý | Kỹ thuật viên | Tiếp nhận |
|-----------|:--------:|:-------:|:-------------:|:---------:|
| **Danh mục Sản phẩm** | | | | |
| Xem | ✅ | ✅ | Chỉ đọc | — |
| Tạo / Sửa | ✅ | ✅ | — | — |
| **Kho** | | | | |
| Xem tồn kho | ✅ | ✅ | Chỉ đọc | ✅ |
| Nhập kho | ✅ | ✅ | — | ✅ |
| Chuyển kho | ✅ | ✅ | — | — |
| Xuất kho / Bán hàng | ✅ | ✅ | — | ✅ |
| **Phiếu Dịch vụ** | | | | |
| Tạo phiếu | ✅ | ✅ | — | ✅ |
| Xem tất cả phiếu | ✅ | ✅ | Chỉ phiếu được gán | ✅ |
| Gán kỹ thuật viên | ✅ | ✅ | — | — |
| Thực hiện sửa chữa | ✅ | ✅ | ✅ | — |
| Hủy phiếu | ✅ | ✅ | — | — |
| Xác nhận giao hàng | ✅ | ✅ | — | ✅ |
| **RMA** | | | | |
| Tạo / Quản lý lô RMA | ✅ | ✅ | — | — |
| **Khách hàng** | | | | |
| Quản lý | ✅ | ✅ | Chỉ đọc | ✅ |
| **Hệ thống** | | | | |
| Quản lý người dùng | ✅ | — | — | — |
| Cấu hình | ✅ | — | — | — |

---

## 10. PHÊ DUYỆT

| | Người ký | Chữ ký | Ngày |
|--|---------|--------|------|
| **Bên cung cấp** | | | |
| Project Manager | _________________ | _________________ | ___/___/______ |
| **Bên khách hàng (SSTC)** | | | |
| Người đại diện | _________________ | _________________ | ___/___/______ |

> **Lưu ý:** Tài liệu này mô tả các quy trình nghiệp vụ của hệ thống. Các bên đã đọc, hiểu và đồng ý với nội dung.
