# QUY TRÌNH NGHIỆP VỤ CHÍNH
## Hệ Thống Quản Lý Trung Tâm Bảo Hành - SSTC

**Dành cho:** Công ty Cổ phần Công nghệ SSTC
**Mục đích:** Tài liệu quy trình nghiệp vụ
**Ngày tạo:** 2026-02-04
**Phiên bản:** 1.0 - Draft for Client Review
**Trạng thái:** Đang chờ phê duyệt

---

## 📚 MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Quy trình 1: Tiếp nhận và Xử lý Yêu cầu Dịch vụ](#2-quy-trình-1-tiếp-nhận-và-xử-lý-yêu-cầu-dịch-vụ)
3. [Quy trình 2: Xác minh Bảo hành và RMA](#3-quy-trình-2-xác-minh-bảo-hành-và-rma)
4. [Quy trình 3: Quản lý Kho và Di chuyển Hàng hóa](#4-quy-trình-3-quản-lý-kho-và-di-chuyển-hàng-hóa)
5. [Vai trò và Trách nhiệm](#6-vai-trò-và-trách-nhiệm)
6. [Kết luận](#7-kết-luận)

---

## 1. TỔNG QUAN

### 1.1. Giới thiệu Hệ thống

Hệ thống Quản lý Trung tâm Bảo hành là nền tảng quản lý toàn diện cho trung tâm sửa chữa và bảo hành sản phẩm điện tử. Hệ thống quản lý toàn bộ chu trình từ khi khách hàng gửi yêu cầu đến khi nhận lại sản phẩm đã sửa xong.

**Phạm vi quản lý:**
- ✅ Portal công khai 24/7 cho khách hàng tạo yêu cầu dịch vụ
- ✅ Chu trình hoàn chỉnh: Service Request → Service Ticket → Thực hiện → Giao hàng
- ✅ Xác minh bảo hành tự động qua serial number
- ✅ Quản lý sản phẩm với tracking serial và thông tin bảo hành chi tiết
- ✅ Hệ thống kho 2 cấp (1 kho vật lý + 7 kho ảo theo mục đích)
- ✅ Quy trình RMA (Return Merchandise Authorization) và đổi trả bảo hành
- ✅ Quy trình bán hàng với tracking serial từ đầu
- ✅ 3 kịch bản xử lý: Sửa được, Không sửa được, Đổi mới
- ✅ Quản lý khách hàng và lịch sử dịch vụ đầy đủ

### 1.3. Các Module Chính

| Module | Mô tả | Người dùng chính |
|--------|-------|------------------|
| **Service Request & Ticket** | Quản lý yêu cầu dịch vụ và phiếu bảo hành/sửa chữa từ đầu đến cuối | Reception, Manager, Technician |
| **Bán hàng** | Xuất bán sản phẩm mới với tracking serial từ đầu | Reception, Manager |
| **Quản lý Kho 2 cấp** | 1 kho vật lý + 7 kho ảo, di chuyển tự động theo nghiệp vụ | Manager, Reception |
| **Xác minh Bảo hành** | Kiểm tra tình trạng BH qua serial, portal & hệ thống nội bộ | Reception, Manager, Customer |
| **Quản lý RMA** | Quy trình đổi trả sản phẩm lỗi về hãng và nhận hàng thay thế | Manager |
| **Quản lý Sản phẩm** | Catalog sản phẩm, serial tracking, thông tin BH chi tiết | Manager, Admin |

---

## 2. QUY TRÌNH 1: TIẾP NHẬN VÀ XỬ LÝ YÊU CẦU DỊCH VỤ

### 2.1. Tổng quan Quy trình

**Mục tiêu:** Quản lý toàn bộ chu trình từ khi khách hàng gửi yêu cầu dịch vụ đến khi nhận lại sản phẩm hoàn chỉnh.

**Thời gian trung bình:** 3-7 ngày (tùy loại dịch vụ)

**Các bước chính:**
1. Khách hàng tạo yêu cầu dịch vụ (Service Request) qua portal công khai
2. Lễ tân/Reception xem xét và chuyển đổi thành phiếu bảo hành (Service Ticket)
3. Kỹ thuật viên thực hiện công việc theo workflow được gán
4. Hệ thống tự động cập nhật trạng thái và gửi thông báo email
5. Khách hàng xác nhận phương thức nhận hàng (tự lấy hoặc giao hàng)
6. Hoàn tất phiếu và giao sản phẩm cho khách

---

### 2.2. Bước 1: Khách hàng Tạo Yêu cầu Dịch vụ (Service Request)

#### 2.2.1. Quy trình từ phía Khách hàng

**Kênh:** Portal công khai (không cần đăng nhập) - Truy cập 24/7

**Các bước thực hiện:**

```
[Khách hàng]
    ↓
1. Truy cập trang web công khai của trung tâm
    ↓
2. Chọn "Tạo Yêu cầu Dịch vụ"
    ↓
3. Nhập Serial Number sản phẩm
    ↓
4. Hệ thống TỰ ĐỘNG kiểm tra:
   ✅ Serial number có hợp lệ không?
   ✅ Sản phẩm còn bảo hành không?
   ✅ Loại bảo hành (hãng / công ty)?
   ✅ Ngày hết hạn bảo hành?
    ↓
5. Nếu hợp lệ → Hiển thị form điền thông tin:
   - Họ tên, số điện thoại, email
   - Mô tả tình trạng/lỗi sản phẩm
   - Ảnh minh họa (tùy chọn)
   - Địa chỉ (nếu muốn giao/nhận hàng tận nơi)
    ↓
6. Gửi yêu cầu
    ↓
7. Nhận mã tracking: SR-YYYYMMDD-XXXXX
   (Ví dụ: SR-20260204-00001)
    ↓
8. Nhận email xác nhận với link theo dõi
```

**Thông tin Khách hàng Cần cung cấp:**
- ✅ **Bắt buộc**: Serial number sản phẩm, họ tên, số điện thoại, mô tả lỗi
- ⭕ **Không bắt buộc**: Email, địa chỉ, ảnh minh họa

**Kết quả:**
- Khách hàng nhận được **mã tracking SR-XXXXXXX** để theo dõi tiến độ
- Yêu cầu được lưu vào hệ thống với trạng thái `submitted` (đã gửi)
- Email tự động gửi đến khách hàng (nếu có email)

#### 2.2.2. Xác minh Bảo hành Tự động

**Khi khách nhập serial number, hệ thống tự động:**

| Điều kiện | Kết quả hiển thị | Hành động tiếp theo |
|-----------|------------------|---------------------|
| Serial hợp lệ + còn bảo hành hãng | 🟢 "Sản phẩm đủ điều kiện bảo hành" | Cho phép tạo yêu cầu |
| Serial hợp lệ + còn bảo hành công ty | 🟡 "Sản phẩm có bảo hành công ty" | Cho phép tạo yêu cầu |
| Serial hợp lệ + hết bảo hành | 🔴 "Sản phẩm hết hạn bảo hành, dịch vụ có phí" | Cho phép tạo yêu cầu (loại: trả phí) |
| Serial không tồn tại | ❌ "Serial number không hợp lệ" | Không cho phép tạo yêu cầu |

**Lợi ích:**
- ✅ Khách hàng biết trước tình trạng bảo hành, không bị bất ngờ
- ✅ Giảm thiểu tình trạng khách mang sản phẩm không hợp lệ đến trung tâm
- ✅ Tăng độ tin cậy và minh bạch

---

### 2.3. Bước 2: Lễ tân Xem xét và Chuyển đổi Yêu cầu

#### 2.3.1. Quy trình từ phía Lễ tân (Reception)

**Vai trò:** Reception Staff

**Các bước thực hiện:**

1. **Vào "Yêu cầu Dịch vụ"** → Xem danh sách yêu cầu mới (trạng thái: `submitted`)
   - Hiển thị: Mã SR, khách hàng, sản phẩm, ngày tạo
   - Có thể lọc theo: trạng thái, ngày, loại dịch vụ

2. **Click xem chi tiết:**
   - ✅ Thông tin khách hàng, sản phẩm, tình trạng BH (tự động)
   - ✅ Mô tả lỗi từ khách, ảnh minh họa

3. **Xác nhận thông tin:**
   - Gọi điện cho khách xác nhận
   - Kiểm tra thông tin khách hàng
   - Xác nhận lịch mang sản phẩm đến

4. **Cập nhật trạng thái yêu cầu:**
   - `received` (đã tiếp nhận) - nếu khách xác nhận
   - `cancelled` (hủy) - nếu khách không đến

5. **Khi khách mang sản phẩm đến:**
   - Click "Chuyển đổi thành Phiếu Bảo hành"
   - Hệ thống tự động tạo Service Ticket (thông tin đã điền sẵn)
   - Lễ tân bổ sung (nếu cần):
     + Kiểm tra tình trạng thực tế sản phẩm
     + Chọn workflow template phù hợp
     + Gán kỹ thuật viên (hoặc để Manager gán sau)

6. **In phiếu tiếp nhận** cho khách hàng

7. **Cập nhật trạng thái** → `completed`

**Trường hợp đặc biệt:** Sản phẩm thực tế khác với yêu cầu (serial khác, model khác)
→ Lễ tân **đánh dấu discrepancy** và nhập thông tin thực tế

**Kết quả:**
- Service Request chuyển `completed`
- Service Ticket mới được tạo với mã **SV-YYYY-NNN**
- Email tự động: "Đã tiếp nhận sản phẩm, mã phiếu: SV-2026-001"

---
### 2.4. Bước 3: Kỹ thuật viên Thực hiện Công việc

#### 2.4.1. Luồng Công việc (Task Workflow)

**Vai trò:** Technician (Kỹ thuật viên)

**Quy trình thực hiện:**

1. **Nhận thông báo** phiếu mới được gán
2. **Vào "Hộp công việc của tôi"** - xem danh sách tasks (sắp xếp theo ưu tiên, deadline)
3. **Click vào phiếu** → Hiển thị WORKFLOW với danh sách Tasks

**Thực hiện từng Task:**
- Click "Bắt đầu" → Task chuyển `in_progress`
- Làm việc theo hướng dẫn
- Nhập ghi chú kết quả (nếu yêu cầu)
- Upload ảnh (nếu yêu cầu)
- Click "Hoàn thành" → Task chuyển `completed`

**Loại Task:**
- ☐ Task thường: Có thời gian ước tính
- ☐ Task yêu cầu ghi chú: BẮT BUỘC nhập kết quả
- ☐ Task yêu cầu ảnh: BẮT BUỘC upload ảnh
- ☐ Task không bắt buộc: Có thể skip

**Chế độ Workflow:**
- **Bắt buộc tuần tự:** Phải hoàn thành Task 1 mới làm Task 2 (các task chưa đến lượt bị `blocked`)
- **Không tuần tự:** Có thể làm task nào cũng được (tất cả `pending`)

**Trong quá trình làm:**
- Có thể thêm linh kiện (Parts) vào phiếu
- Có thể thêm comment/ghi chú
- Có thể đánh dấu task `skipped` nếu không cần thiết

**Khi hoàn thành TẤT CẢ tasks bắt buộc:**
- → Phiếu tự động chuyển `ready_for_pickup`
- → Email tự động gửi khách: "Sản phẩm đã sửa xong"

**Trường hợp đổi Workflow:**
- Manager có thể **Chuyển đổi Workflow** (VD: Bảo hành → Sửa trả phí)
- Các task đã hoàn thành **KHÔNG bị xóa**
- Hệ thống **thêm** các task mới từ workflow mới

---
### 2.4.2. Quản lý Thời gian và Deadline

**Tính toán thời gian:**
- Mỗi task có "Thời gian ước tính"
- Hệ thống tính tổng thời gian = tổng thời gian tất cả tasks
- Ví dụ: Workflow có 8 tasks, tổng 110 phút ≈ 2 giờ

**Deadline và Cảnh báo:**
- Khi task được bắt đầu → Hệ thống tính due time
- Nếu task quá hạn → Hiển thị cảnh báo đỏ
- Manager nhìn dashboard biết task nào đang bị delay

---

### 2.5. Bước 4: Xác nhận Phương thức Giao hàng

#### 2.5.1. Quy trình từ phía Khách hàng

**Khi nào:** Sau khi phiếu chuyển trạng thái `ready_for_pickup` (sẵn sàng giao hàng)

**Kênh:** Email + Link tracking công khai

**Quy trình:**

```
[Technician hoàn thành tất cả tasks]
    ↓
Hệ thống tự động:
1. Chuyển trạng thái phiếu → `ready_for_pickup`
2. Gửi email cho khách hàng:

   "Kính gửi Anh/Chị [Tên],

   Sản phẩm [Tên sản phẩm - Serial] của Quý khách đã được sửa chữa xong.

   Vui lòng xác nhận phương thức nhận hàng:
   - Tự đến lấy tại trung tâm
   - Yêu cầu giao hàng tận nơi

   Link xác nhận: [URL]
   Mã phiếu: SV-2026-001"
    ↓
[Khách hàng click link]
    ↓
Hiển thị form xác nhận:
┌─────────────────────────────────┐
│ Xác nhận phương thức nhận hàng   │
│                                 │
│ ⚪ Tự đến lấy tại trung tâm     │
│ ⚪ Yêu cầu giao hàng tận nơi    │
│                                 │
│ [Xác nhận]                      │
└─────────────────────────────────┘
    ↓
Khách chọn và xác nhận
    ↓
Hệ thống lưu lại lựa chọn
```

**Fallback tự động:**
- Nếu sau **3 ngày** khách không xác nhận
- Hệ thống **TỰ ĐỘNG** chuyển về "Tự đến lấy" (pickup)
- Lý do: Tránh phiếu bị treo mãi, mặc định khách sẽ đến lấy

#### 2.5.2. Quy trình Giao hàng

**Trường hợp 1: Khách tự đến lấy (Pickup)**

```
1. Khách đến trung tâm
    ↓
2. Lễ tán kiểm tra phiếu
    ↓
3. Lễ tán click "Xác nhận đã giao hàng"
   - Ghi rõ: Người nhận, CMND/CCCD, thời gian nhận
    ↓
4. In biên nhận giao hàng cho khách ký
    ↓
5. Phiếu chuyển trạng thái → `completed`
```

**Trường hợp 2: Giao hàng tận nơi (Delivery)**

```
1. Nhân viên giao hàng nhận sản phẩm
    ↓
2. Giao đến địa chỉ khách hàng
    ↓
3. Khách ký nhận
    ↓
4. Nhân viên chụp ảnh biên nhận (hoặc nhập thông tin vào app)
    ↓
5. Cập nhật hệ thống: "Đã giao hàng"
   - Ghi rõ: Người nhận, thời gian, ảnh biên nhận
    ↓
6. Phiếu chuyển trạng thái → `completed`
```

---

### 2.6. Bước 5: Hoàn tất Phiếu

**Điều kiện để đóng phiếu:**
- ✅ Tất cả tasks bắt buộc đã hoàn thành
- ✅ Khách hàng đã nhận hàng (có xác nhận)
- ✅ Trạng thái: `completed`

**Khi phiếu ở trạng thái `completed`:**
- ❌ **KHÔNG** thể sửa đổi thông tin nữa
- ✅ Vẫn có thể xem lại lịch sử
- ✅ Dữ liệu được lưu vào báo cáo và phân tích

**Thông tin được lưu trữ:**
- Toàn bộ lịch sử tasks (ai làm gì, khi nào)
- Tất cả comments và ghi chú
- Hình ảnh trước/sau sửa chữa
- Thời gian thực tế của mỗi task
- Chi phí linh kiện và dịch vụ

---

### 2.7. Tóm tắt Quy trình

**Luồng hoàn chỉnh:**

1. **Khách hàng:** Tạo Service Request qua Portal → Nhận mã tracking SR-XXXXXXX
2. **Lễ tán:** Xem xét yêu cầu → Xác nhận khách → Khi khách đến: Chuyển SR → Service Ticket → In phiếu tiếp nhận
3. **Kỹ thuật viên:** Nhận phiếu → Thực hiện tasks theo workflow → Hoàn thành → Phiếu tự động chuyển "ready_for_pickup"
4. **Khách hàng:** Nhận email "Sản phẩm đã sửa xong" → Chọn phương thức nhận hàng (Tự lấy / Giao hàng)
5. **Lễ tán/Giao hàng:** Giao sản phẩm cho khách → Xác nhận giao hàng → Phiếu chuyển "completed"

**Kết quả:** Lưu lịch sử hoàn chỉnh, dữ liệu vào báo cáo.

---

---

## 3. QUY TRÌNH 2: XÁC MINH BẢO HÀNH VÀ RMA

### 3.1. Tổng quan Quy trình Bảo hành

**Mục tiêu:** Quản lý chu trình bảo hành từ xác minh điều kiện đến xử lý sản phẩm lỗi và thay thế.

**3 Loại Dịch vụ:**

| Loại dịch vụ | Mô tả | Điều kiện | Badge màu |
|--------------|-------|-----------|-----------|
| **Warranty** (Bảo hành) | Dịch vụ miễn phí, thuộc bảo hành hãng hoặc công ty | Còn thời hạn BH, không vi phạm điều kiện | 🔵 Xanh |
| **Paid** (Trả phí) | Sửa chữa có tính phí | Hết bảo hành hoặc vi phạm điều kiện BH | 🟢 Xanh lá |
| **Goodwill** (Thiện chí) | Hỗ trợ miễn phí ngoài bảo hành | Quyết định của Manager | 🟠 Cam |

### 3.2. Quy trình Xác minh Bảo hành

#### 3.2.1. Xác minh qua Portal Công khai

**Ai sử dụng:** Khách hàng (không cần đăng nhập)

**Quy trình:**

1. Khách truy cập trang xác minh bảo hành
2. Nhập Serial Number sản phẩm
3. Hệ thống kiểm tra Database

**Kết quả kiểm tra:**

**A) Serial HỢP LỆ - CÒN BẢO HÀNH:**
- ✅ Hiển thị: Serial, Sản phẩm, Thương hiệu
- 📅 Thông tin BH: Loại BH, Ngày bắt đầu, Ngày hết hạn, Thời gian còn lại
- 🟢 Trạng thái: **CÒN BẢO HÀNH**
- → Nút: [Tạo Yêu cầu Dịch vụ]

**B) Serial HỢP LỆ - HẾT BẢO HÀNH:**
- 🟡 Hiển thị: Serial, Sản phẩm
- 📅 Ngày hết hạn
- 🔴 Trạng thái: **HẾT BẢO HÀNH**
- ℹ️ Sản phẩm vẫn được phục vụ sửa chữa có phí
- → Nút: [Tạo Yêu cầu Sửa chữa Trả phí]

**C) Serial KHÔNG TÌM THẤY:**
- ❌ **SERIAL KHÔNG HỢP LỆ**
- Serial không tồn tại trong hệ thống
- Khuyến nghị: Kiểm tra lại serial hoặc liên hệ hotline

**Lợi ích:**
- ✅ Khách tự kiểm tra 24/7, không cần gọi điện
- ✅ Giảm tải công việc cho lễ tân
- ✅ Tăng độ tin cậy, minh bạch
- ✅ Giảm tình trạng khách mang sản phẩm không hợp lệ đến

---
### 3.2.2. Xác minh qua Hệ thống Nội bộ

**Ai sử dụng:** Reception, Manager

**Màn hình:** Quản lý Sản phẩm / Tìm kiếm Serial

**Quy trình:**

```
[Nhân viên đăng nhập hệ thống]
    ↓
1. Vào "Quản lý Sản phẩm" → "Tìm kiếm Serial"
    ↓
2. Nhập serial number hoặc quét barcode
    ↓
3. Hiển thị thông tin CHI TIẾT:

   ┌────────────────────────────────────────────┐
   │ THÔNG TIN SẢN PHẨM                         │
   ├────────────────────────────────────────────┤
   │ Serial: ABC123456789                        │
   │ Sản phẩm: ZOTAC RTX 4090 24GB             │
   │ Tình trạng: Mới (new)                      │
   │ Vị trí kho: Kho Chính → Hàng Bảo Hành     │
   │                                            │
   │ BẢO HÀNH HÃ​NG (Manufacturer Warranty):    │
   │ • Bắt đầu: 01/01/2025                      │
   │ • Hết hạn: 01/01/2028 (còn 1095 ngày)     │
   │ • Trạng thái: 🟢 Còn hiệu lực             │
   │                                            │
   │ BẢO HÀNH CÔNG TY (Company Warranty):      │
   │ • Bắt đầu: 01/01/2025                      │
   │ • Hết hạn: 01/01/2029 (còn 1460 ngày)     │
   │ • Trạng thái: 🟢 Còn hiệu lực             │
   │                                            │
   │ LỊCH SỬ DỊCH VỤ:                           │
   │ • 15/01/2026: Sửa chữa (SV-2026-015)       │
   │              Lỗi: Quạt kêu                 │
   │              Kết quả: Đã sửa xong          │
   └────────────────────────────────────────────┘
    ↓
4. Nhân viên đánh giá:
   - Có đủ điều kiện bảo hành không?
   - Loại bảo hành nào áp dụng (hãng/công ty)?
   - Tạo Service Ticket với loại dịch vụ phù hợp
```

### 3.3. Quy trình RMA (Return Merchandise Authorization)

**RMA là gì?**
- RMA = Quy trình trả hàng lỗi về nhà cung cấp/hãng để đổi mới
- Áp dụng khi: Sản phẩm không sửa được hoặc lỗi nặng thuộc diện đổi mới

#### 3.3.1. Khi nào cần RMA?

**3 Tình huống:**

| Tình huống | Mô tả | Quyết định |
|------------|-------|------------|
| **Sửa được** | Kỹ thuật viên sửa chữa thành công | ✅ Không cần RMA, trả sản phẩm đã sửa cho khách |
| **Không sửa được + Không BH** | Hết bảo hành, sản phẩm hỏng nặng | ❌ Không RMA, trả nguyên sản phẩm lỗi cho khách |
| **Không sửa được + Còn BH** | Trong bảo hành, sản phẩm hỏng không sửa được | 🔄 **CẦN RMA** - Đổi sản phẩm mới cho khách |

#### 3.3.2. Quy trình RMA Chi tiết

```
[Kỹ thuật viên chẩn đoán: "Không sửa được, cần đổi mới"]
    ↓
1. Technician đánh dấu phiếu:
   - Kết quả: "Unrepairable" (không sửa được)
   - Lý do: [Mô tả chi tiết]
    ↓
2. Manager xem xét và duyệt RMA
    ↓
3. Manager tạo RMA Batch (Lô RMA):
   - Chọn các sản phẩm lỗi cần trả về hãng
   - Gom vào 1 lô RMA
   - Mã lô: RMA-YYYYMMDD-XXX
    ↓
4. Hệ thống TỰ ĐỘNG di chuyển sản phẩm lỗi:
   📦 Từ: "Kho Đang Sửa Chữa" (In-Service)
   📦 Đến: "Kho Hàng Hỏng" (Dead Stock)
    ↓
5. Xuất kho gửi về hãng:
   - In phiếu RMA
   - Đóng gói sản phẩm lỗi
   - Gửi về nhà cung cấp/hãng
    ↓
6. Chọn sản phẩm thay thế từ kho:
   📦 Từ: "Kho Bảo Hành" (Warranty Stock)
   📦 Lấy: 1 sản phẩm cùng model (hoặc tương đương)
    ↓
7. Gán sản phẩm thay thế cho phiếu:
   - Link serial number sản phẩm mới
   - Hệ thống TỰ ĐỘNG cập nhật:
     📦 Sản phẩm mới chuyển: "Hàng Đã Bán" (Sold/Customer Installed)
     ✅ Phiếu đánh dấu: "Warranty Replacement"
    ↓
8. Giao sản phẩm mới cho khách
    ↓
9. Khi nhận hàng thay thế từ hãng:
   - Nhập kho mới vào "Kho Bảo Hành"
   - Cập nhật trạng thái lô RMA: "Completed"
```

#### 3.3.3. Luồng Kho trong RMA

**Sản phẩm lỗi của khách:**
```
Hàng Đã Bán (Customer)
    ↓ (Khách gửi bảo hành)
Kho Đang Sửa Chữa (In-Service)
    ↓ (Chẩn đoán: không sửa được)
Kho Hàng Hỏng (Dead Stock)
    ↓ (Gửi RMA về hãng)
Kho Chờ Trả Hàng (RMA Staging)
    ↓ (Trả về hãng)
[Ra khỏi hệ thống]
```

**Sản phẩm thay thế cho khách:**
```
Kho Bảo Hành (Warranty Stock)
    ↓ (Chọn để thay thế)
Hàng Đã Bán (Customer Installed)
    ↓
[Giao cho khách hàng]
```

---

## 4. QUY TRÌNH 3: QUẢN LÝ KHO VÀ DI CHUYỂN HÀNG HÓA

### 4.1. Tổng quan Hệ thống Kho 2 Cấp

**Kiến trúc Kho:**

```
┌─────────────────────────────────────────────────────────┐
│           KHO VẬT LÝ (Physical Warehouse)               │
│                                                         │
│  Ví dụ: "Kho Công ty", "Chi nhánh Quận 1", "Kho TP.HCM"│
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬──────────┬──────────┬─────────┬────────┐
        ↓                 ↓                 ↓          ↓          ↓         ↓        ↓
┌──────────────┐  ┌──────────────┐  ┌─────────┐  ┌────────┐  ┌────────┐  ┌─────┐  ┌──────────┐
│  Kho Chính   │  │ Kho Bảo Hành │  │ Kho Chờ │  │  Kho   │  │  Kho   │  │ Linh│  │  Hàng    │
│    (Main)    │  │(Warranty Stock)│ │   RMA   │  │ Hàng   │  │ Đang   │  │ Kiện│  │ Đã Bán   │
│              │  │              │  │(Staging)│  │ Hỏng   │  │ Sửa    │  │(Parts)│ │(Customer)│
│  Hàng mới    │  │ Hàng dự trữ  │  │ Chờ trả │  │ (Dead  │  │(In-    │  │     │  │          │
│  nhập về     │  │ để thay thế  │  │ về hãng │  │ Stock) │  │Service)│  │     │  │  Đã giao │
└──────────────┘  └──────────────┘  └─────────┘  └────────┘  └────────┘  └─────┘  └──────────┘
   KHO ẢO           KHO ẢO           KHO ẢO       KHO ẢO      KHO ẢO    KHO ẢO    KHO ẢO
(Virtual WH)     (Virtual WH)     (Virtual WH) (Virtual WH)(Virtual WH)(Virtual)(Virtual)
```

**Giải thích:**
- **Kho Vật lý (Physical Warehouse):** Vị trí thực tế (tòa nhà, chi nhánh)
- **Kho Ảo (Virtual Warehouse):** Phân loại theo mục đích sử dụng

### 4.2. Các Loại Kho Ảo (Virtual Warehouse)

| Tên kho ảo | Mục đích | Ví dụ sản phẩm |
|------------|----------|----------------|
| **Main** (Kho Chính) | Hàng mới nhập về, chưa bán | Card đồ họa mới nhập từ nhà cung cấp |
| **Warranty Stock** (Kho Bảo Hành) | Hàng dự trữ để thay thế cho khách BH | Card đồ họa mới, giữ sẵn để đổi cho khách |
| **RMA Staging** (Kho Chờ RMA) | Hàng lỗi chờ trả về hãng | Card hỏng nặng, chuẩn bị gửi RMA |
| **Dead Stock** (Kho Hàng Hỏng) | Hàng hỏng không sửa được, không RMA | Card hỏng do khách làm rơi (không BH) |
| **In-Service** (Kho Đang Sửa) | Sản phẩm đang trong quá trình sửa chữa | Card đang được technician kiểm tra/sửa |
| **Parts** (Kho Linh Kiện) | Linh kiện thay thế | Quạt tản nhiệt, keo tản nhiệt, tụ điện |
| **Customer Installed** (Hàng Đã Bán) | Sản phẩm đã bán, đang ở tay khách | Card đã bán cho khách, đang sử dụng |

---

### 4.2.1. Setup Mặc định Khi Khởi tạo Hệ thống

**Khi cài đặt hệ thống lần đầu, database TỰ ĐỘNG tạo:**

**1. Kho Vật lý: "Công ty"** (mặc định, không thể xóa)

**2. 7 Kho Ảo tự động** (thuộc kho "Công ty"):

| # | Tên Kho Ảo | Loại | Mục đích |
|---|------------|------|----------|
| 1 | Kho Chính | `main` | Hàng nhập mới |
| 2 | Kho Bảo Hành | `warranty_stock` | Dự trữ thay thế |
| 3 | Kho Chờ RMA | `rma_staging` | Chờ gửi hãng |
| 4 | Kho Hàng Hỏng | `dead_stock` | Hàng lỗi |
| 5 | Kho Đang Sửa | `in_service` | Đang xử lý BH |
| 6 | Kho Linh Kiện | `parts` | Phụ tùng |
| 7 | Hàng Đã Bán | `customer_installed` | Tracking SP khách |

**Đặc điểm:**
- ✅ Tự động tạo khi khởi tạo database
- ⚠️ Không thể xóa kho mặc định
- ✅ Có thể tạo thêm kho vật lý mới (Chi nhánh, Showroom...)
- ✅ Mỗi kho vật lý mới tự động có 7 kho ảo tương ứng

---

---

### 4.3. Quy trình Nhập Kho (Stock Receipt)

**Mục tiêu:** Nhập hàng mới từ nhà cung cấp vào hệ thống

**Vai trò:** Warehouse Manager / Reception

**Quy trình:**

1. **Vào** "Quản lý Kho" → "Nhập Kho"

2. **Tạo Phiếu Nhập Kho mới:**
   - Chọn nhà cung cấp
   - Chọn kho vật lý đích (VD: "Kho Công ty")
   - Nhập ghi chú (số PO, số hóa đơn...)

3. **Thêm sản phẩm vào phiếu** (với MỖI sản phẩm):
   - Sản phẩm, Số lượng
   - Kho ảo đích (VD: Kho Chính)
   - **Nhập Serial Numbers** (từng serial)
   - **Bảo hành hãng:** Ngày bắt đầu, Thời hạn, Ngày hết hạn
   - **Bảo hành công ty:** Thời hạn, Ngày hết hạn
   - Tình trạng: Mới (New)

4. **Kiểm tra thông tin phiếu:**
   - Tổng số sản phẩm
   - Tất cả serials đã nhập đầy đủ

5. **Xác nhận nhập kho**

6. **Hệ thống TỰ ĐỘNG:**
   - ✅ Tạo bản ghi Physical Product với serial riêng biệt
   - ✅ Gán vào Kho ảo đã chọn
   - ✅ Lưu ngày bảo hành cho từng sản phẩm
   - ✅ Cập nhật số lượng tồn kho
   - ✅ Ghi log nhập kho

7. **In phiếu nhập kho** để lưu trữ

**Lưu ý:**
- ⚠️ **Serial phải unique** trong toàn hệ thống
- ⚠️ Nhập serial trùng → Hệ thống báo lỗi

**Kết quả:**
- Kho tăng số lượng sản phẩm
- Mỗi sản phẩm có serial riêng, thông tin bảo hành riêng
- Có thể tra cứu từng sản phẩm theo serial

---
### 4.4. Quy trình Chuyển Kho (Stock Transfer)

**Mục tiêu:** Di chuyển sản phẩm giữa các kho ảo

**Ví dụ:** Chuyển sản phẩm từ "Kho Chính" sang "Kho Bảo Hành" để dự trữ thay thế

**Quy trình:**

```
[Manager quyết định chuyển kho]
    ↓
1. Vào "Quản lý Kho" → "Chuyển Kho"
    ↓
2. Tạo Phiếu Chuyển Kho:

   ┌────────────────────────────────────────┐
   │ PHIẾU CHUYỂN KHO                       │
   ├────────────────────────────────────────┤
   │ Từ kho: Kho Công ty → Kho Chính (Main) │
   │ Đến kho: Kho Công ty → Kho Bảo Hành    │
   │                                        │
   │ Sản phẩm: ZOTAC RTX 4090 24GB          │
   │ Số lượng: 5 cái                        │
   │                                        │
   │ Chọn Serial Numbers:                   │
   │ ☑ ABC123456781                         │
   │ ☑ ABC123456782                         │
   │ ☑ ABC123456783                         │
   │ ☑ ABC123456784                         │
   │ ☑ ABC123456785                         │
   │                                        │
   │ Lý do: Dự trữ bảo hành                 │
   │                                        │
   │ [Xác nhận chuyển kho]                  │
   └────────────────────────────────────────┘
    ↓
3. Hệ thống TỰ ĐỘNG:
   ✅ Cập nhật virtual_warehouse_id cho 5 sản phẩm
   ✅ Ghi log di chuyển:
      "2026-02-04 14:30 - Chuyển 5 RTX 4090 từ Main → Warranty Stock"
   ✅ Cập nhật số lượng tồn kho:
      Main: -5
      Warranty Stock: +5
    ↓
4. Phiếu chuyển kho hoàn tất
```

### 4.5. Quy trình Xuất Kho (Stock Issue)

**Mục tiêu:** Xuất sản phẩm ra khỏi kho (bán, thay thế, sửa chữa, hủy...)

**Các loại xuất kho:**

| Loại | Mục đích | Kho nguồn | Kho đích |
|------|----------|-----------|----------|
| **Bán hàng** | Bán sản phẩm mới cho khách | Main | Customer Installed |
| **Thay thế BH** | Đổi sản phẩm mới cho khách BH | Warranty Stock | Customer Installed |
| **Sửa chữa** | Chuyển sản phẩm vào sửa | Customer Installed | In-Service |
| **RMA** | Gửi hàng lỗi về hãng | RMA Staging | [Ra khỏi hệ thống] |
| **Hủy** | Thanh lý hàng hỏng không RMA | Dead Stock | [Ra khỏi hệ thống] |

**Ví dụ: Xuất kho để thay thế bảo hành**

```
[Kỹ thuật viên xác định: Cần thay sản phẩm mới cho khách]
    ↓
1. Vào phiếu bảo hành (Service Ticket)
    ↓
2. Chọn "Gán sản phẩm thay thế"
    ↓
3. Hệ thống hiển thị:

   ┌────────────────────────────────────────┐
   │ CHỌN SẢN PHẨM THAY THẾ                 │
   ├────────────────────────────────────────┤
   │ Kho: Warranty Stock                    │
   │ Sản phẩm: ZOTAC RTX 4090 24GB          │
   │                                        │
   │ Danh sách Serial khả dụng:             │
   │ ⚪ ABC123456781 (New, BH: 01/02/2029)  │
   │ ⚪ ABC123456782 (New, BH: 01/02/2029)  │
   │ ⚪ ABC123456783 (New, BH: 01/02/2029)  │
   │                                        │
   │ Chọn serial: ABC123456781 ✅           │
   │                                        │
   │ [Xác nhận]                             │
   └────────────────────────────────────────┘
    ↓
4. Hệ thống TỰ ĐỘNG:
   ✅ Tạo Stock Issue (Phiếu Xuất Kho)
   ✅ Chuyển sản phẩm ABC123456781:
      Từ: Warranty Stock
      Đến: Customer Installed
   ✅ Link sản phẩm vào Service Ticket
   ✅ Đánh dấu outcome: "Warranty Replacement"
   ✅ Ghi log: "Xuất 1 RTX 4090 (ABC123456781) thay thế cho khách"
    ↓
5. Giao sản phẩm mới cho khách
```

### 4.6.1. Quy tắc Di chuyển Kho Tự động

**Tổng quan:** Hệ thống TỰ ĐỘNG di chuyển sản phẩm giữa các kho trong các tình huống sau.

#### Bảng 9 Quy tắc Tự động

| # | Sự kiện Trigger | Từ Kho | Đến Kho | Ai thực hiện | Ghi chú |
|---|----------------|---------|---------|--------------|---------|
| **1** | Tạo Service Ticket từ SR | Customer Installed | In-Service | Lễ tán | SP khách gửi vào sửa |
| **2** | Hoàn thành sửa chữa (Repaired) | In-Service | Customer Installed | Technician | SP sửa xong, trả khách |
| **3** | Không sửa được + Không BH | In-Service | Customer Installed | Manager | Trả SP lỗi cho khách |
| **4** | Duyệt Warranty Replacement | In-Service | Dead Stock | Manager | SP lỗi giữ lại RMA |
| **5** | Chọn SP thay thế | Warranty Stock | Customer Installed | Manager | SP mới xuất cho khách |
| **6** | Thêm vào RMA Batch | Dead Stock | RMA Staging | Manager | Chuẩn bị gửi hãng |
| **7** | Bán hàng (Sales) | Main | Customer Installed | Reception | Xuất bán SP mới |
| **8** | Nhập kho từ NCC | - | Main | Reception | Hàng mới về |
| **9** | Nhận hàng RMA từ hãng | - | Main / Warranty Stock | Manager | Hàng thay thế |

#### Giải thích Quy tắc Chính

**Quy tắc 1: Tạo Service Ticket**
- Khi: Lễ tán chuyển SR → Ticket
- Hệ thống tự động: Tìm serial → Chuyển sang In-Service → Link với ticket

**Quy tắc 2-3: Hoàn thành Sửa chữa**
- **Sửa được:** In-Service → Customer Installed (trả SP đã sửa)
- **Không sửa được + Không BH:** In-Service → Customer Installed (trả SP lỗi)
- **Warranty Replacement:** Xem Quy tắc 4+5

**Quy tắc 4-5: Warranty Replacement (2 bước)**
- **Bước 1:** Manager duyệt đổi mới → SP lỗi: In-Service → Dead Stock
- **Bước 2:** Manager chọn SP thay thế → SP mới: Warranty Stock → Customer Installed
- Kết quả: SP lỗi chờ RMA, SP mới giao khách

**Quy tắc 6: RMA Batch**
- Manager thêm SP vào lô RMA → Dead Stock → RMA Staging → Sẵn sàng gửi hãng

**Quy tắc 7: Bán hàng**
- Reception xác nhận đơn → Main → Customer Installed → Link với KH

**Quy tắc 8-9: Nhập kho**
- Mặc định vào Main (trừ khi chọn kho khác)
- Hàng RMA từ hãng → Warranty Stock (để dự trữ)

#### Đặc điểm Tự động

**Tất cả di chuyển tự động đều:**
- ✅ Ghi log đầy đủ (thời gian, người thực hiện)
- ✅ Cập nhật tồn kho realtime
- ✅ Có audit trail
- ✅ Atomicity (thành công hoàn toàn hoặc rollback)

**Phân quyền:**
- Manager/Admin: Can thiệp vào RMA, thay thế SP
- Technician: Chỉ hoàn thành tasks (không di chuyển kho thủ công)
- Reception: Di chuyển qua Bán hàng, Nhập kho, Tạo ticket

#### So sánh: Tự động vs Thủ công

| Loại di chuyển | Tự động | Thủ công |
|----------------|---------|----------|
| SR → Ticket, Sửa chữa, RMA, Bán hàng, Nhập kho | ✅ | ❌ |
| Chuyển kho Main ↔ Warranty, Chuyển giữa chi nhánh | ❌ | ✅ |

**Kết luận:** Hầu hết di chuyển trong luồng nghiệp vụ chính đều TỰ ĐỘNG.

---

### 4.7. Quy trình Bán hàng ⭐ MỚI

**Mục tiêu:** Xuất bán sản phẩm mới cho khách hàng với tracking serial number đầy đủ.

**Vai trò:** Reception, Manager

**Khi nào sử dụng:**
- Khách hàng mua sản phẩm mới tại trung tâm
- Cần xuất kho và giao hàng cho khách
- Tracking serial để quản lý bảo hành sau này

#### 4.7.1. Quy trình Bán hàng Chi tiết

**Quy trình 9 bước:**

1. **Reception/Manager tạo Đơn bán hàng**
   - Vào "Quản lý Kho" → "Xuất Kho" → Chọn loại "Bán hàng"

2. **Nhập thông tin khách hàng:**
   - Họ tên (*), Số điện thoại (*), Email, Địa chỉ

3. **Chọn sản phẩm cần bán:**
   - Sản phẩm, Số lượng
   - Kho nguồn (VD: Kho Công ty → Kho Chính)
   - Kiểm tra số lượng khả dụng

4. **Chọn Serial Numbers:**
   - Hệ thống hiển thị danh sách serials khả dụng trong kho
   - Chọn đủ số lượng cần bán (VD: 60/60)
   - Có thể: Chọn tất cả, Chọn theo serial cụ thể

5. **Xác nhận thông tin đơn hàng:**
   - Khách hàng, Sản phẩm, Số lượng, Serials
   - Giá bán, Thành tiền, Phương thức thanh toán

6. **Xác nhận → Hệ thống TỰ ĐỘNG:**
   - ✅ Tạo Phiếu Xuất Kho (Stock Issue)
   - ✅ Cập nhật sản phẩm:
     * Virtual Warehouse: Main → Customer Installed
     * Trạng thái: Đã bán
     * Khách hàng sở hữu: [Tên + SĐT]
     * Ngày bán
   - ✅ Cập nhật tồn kho (VD: Main: 100 → 40, Customer Installed: +60)
   - ✅ Ghi log di chuyển
   - ✅ Lưu thông tin khách hàng vào database

7. **In Hóa đơn/Biên nhận:**
   - Mã đơn, Ngày, Khách hàng
   - Sản phẩm, Số lượng, Giá, Thành tiền
   - Danh sách Serial Numbers
   - Thông tin bảo hành (hãng + công ty)

8. **Giao hàng cho khách**

9. **KẾT QUẢ:**
   - ✅ Sản phẩm đã bán có đầy đủ: Serial, Khách hàng sở hữu, Ngày BH
   - ✅ Tồn kho cập nhật chính xác
   - ✅ Khách dùng serial để kiểm tra BH online và tạo yêu cầu dịch vụ

---
### 4.7.2. Luồng Kho trong Bán hàng

```
TRƯỚC BÁN:
┌─────────────────────────┐
│ Kho Chính (Main)        │
│ 100 sản phẩm            │
│ Serials: 701-800        │
└─────────────────────────┘

SAU BÁN 60 CÁI:
┌─────────────────────────┐     ┌──────────────────────────┐
│ Kho Chính (Main)        │     │ Hàng Đã Bán              │
│ 40 sản phẩm             │     │ (Customer Installed)     │
│ Serials: 761-800        │     │ 60 sản phẩm              │
└─────────────────────────┘     │ Serials: 701-760         │
                                │ Chủ sở hữu: Nguyễn Văn A │
                                └──────────────────────────┘
```

#### 4.7.3. Kết nối với Quy trình Bảo hành

**Sau khi bán → Khách có thể:**

```
[Khách hàng mua sản phẩm - Serial: ABC123456701]
    ↓
[Sản phẩm ở: Customer Installed]
    ↓
[Một thời gian sau, sản phẩm hỏng]
    ↓
[Khách truy cập Portal công khai]
    ↓
Nhập serial: ABC123456701
    ↓
Hệ thống TỰ ĐỘNG hiển thị:
✅ Serial hợp lệ
✅ Sản phẩm: ZOTAC RTX 4090
✅ Khách hàng: Nguyễn Văn A (tự động điền sẵn)
✅ Bảo hành hãng: Còn hiệu lực đến 01/02/2029
✅ Bảo hành công ty: Còn hiệu lực đến 01/02/2030
    ↓
[Khách tạo Service Request]
    ↓
→ Chuyển sang QUY TRÌNH 1 (Section 2)
   để xử lý bảo hành
```

**Lợi ích của việc tracking serial khi bán:**
- ✅ Khách hàng tự kiểm tra bảo hành online 24/7
- ✅ Không cần giữ hóa đơn giấy (có serial là đủ)
- ✅ Hệ thống tự động điền thông tin khi tạo phiếu BH
- ✅ Quản lý lịch sử bảo hành của từng sản phẩm
- ✅ Phát hiện sản phẩm giả (serial không tồn tại)

## 5. LUỒNG KHO THEO KỊCH BẢN SỬA CHỮA

### 5.1. Ba Kịch bản Chính

Dựa trên tài liệu `warehouse-location-workflow.md`, có 3 kịch bản xử lý sản phẩm khách hàng:

---

### 5.2. Kịch bản 1: Sửa chữa Thành công

**Tình huống:** Sản phẩm hỏng của khách được sửa chữa thành công và trả lại cho khách.

**Luồng di chuyển kho:**

```
[Trước khi khách gửi]
Sản phẩm ở tay khách hàng (không trong hệ thống kho)
    ↓
[Mốc 1: Tạo Service Request]
Khách tạo yêu cầu dịch vụ → Hệ thống ghi nhận
    ↓
[Mốc 2: Khách mang sản phẩm đến, tạo Service Ticket]
Lễ tán tiếp nhận → Chuyển sản phẩm cho kỹ thuật viên
→ Sản phẩm vào: KHO ĐANG SỬA CHỮA (In-Service)
    ↓
[Kỹ thuật viên sửa chữa]
Thực hiện các tasks trong workflow
Sản phẩm vẫn ở: KHO ĐANG SỬA CHỮA
    ↓
[Mốc 3: Hoàn thành sửa chữa]
Kỹ thuật viên hoàn thành tất cả tasks
→ Sản phẩm chuyển về: HÀNG ĐÃ BÁN (Customer Installed)
(Vì sản phẩm thuộc sở hữu của khách, chỉ tạm gửi sửa)
    ↓
[Giao lại cho khách]
Khách nhận sản phẩm đã sửa xong
```

**Sơ đồ:**
```
Hàng Đã Bán (Customer)
    → Kho Đang Sửa Chữa (In-Service)
    → Hàng Đã Bán (Customer)
```

---

### 5.3. Kịch bản 2: Không sửa được + Không bảo hành

**Tình huống:** Sản phẩm không thể sửa chữa, không thuộc diện bảo hành. Trả nguyên sản phẩm hỏng lại cho khách (sản phẩm thuộc sở hữu của khách).

**Luồng di chuyển kho:**

```
[Trước khi khách gửi]
Sản phẩm ở tay khách hàng
    ↓
[Mốc 1: Tạo Service Request]
Khách tạo yêu cầu dịch vụ
    ↓
[Mốc 2: Tạo Service Ticket]
Lễ tán tiếp nhận
→ Sản phẩm vào: KHO ĐANG SỬA CHỮA (In-Service)
    ↓
[Kỹ thuật viên chẩn đoán]
Kết luận: Không sửa được
Lý do: Vi phạm điều kiện bảo hành (rơi vỡ, ngấm nước...)
Outcome: "Unrepairable"
    ↓
[Mốc 3: Hoàn thành phiếu]
Không thay thế, trả nguyên sản phẩm lỗi cho khách
→ Sản phẩm chuyển về: HÀNG ĐÃ BÁN (Customer Installed)
(Sản phẩm lỗi vẫn thuộc khách, không giữ lại)
    ↓
[Giao lại cho khách]
Khách nhận lại sản phẩm hỏng + được giải thích lý do
```

**Sơ đồ:**
```
Hàng Đã Bán (Customer)
    → Kho Đang Sửa Chữa (In-Service)
    → Hàng Đã Bán (Customer)
```

*Giống Kịch bản 1, nhưng khác ở kết quả: sản phẩm vẫn lỗi*

---

### 5.4. Kịch bản 3: Bảo hành Đổi trả (Warranty Replacement)

**Tình huống:** Sản phẩm thuộc diện bảo hành đổi trả. Khách nhận sản phẩm thay thế mới, sản phẩm hỏng được giữ lại để trả về nhà sản xuất.

#### 6.4.1. Luồng Sản phẩm Lỗi của Khách

```
[Trước khi khách gửi]
Sản phẩm ở tay khách hàng
    ↓
[Mốc 1: Tạo Service Request]
Khách tạo yêu cầu dịch vụ, hệ thống xác minh còn BH
    ↓
[Mốc 2: Tạo Service Ticket]
Lễ tán tiếp nhận
→ Sản phẩm vào: KHO ĐANG SỬA CHỮA (In-Service)
    ↓
[Kỹ thuật viên chẩn đoán]
Kết luận: Không sửa được, cần đổi mới
Lý do: Lỗi phần cứng nghiêm trọng (trong BH)
Outcome: "Warranty Replacement"
    ↓
[Manager duyệt RMA]
Thêm sản phẩm lỗi vào RMA Batch
→ Sản phẩm lỗi chuyển: KHO HÀNG HỎNG (Dead Stock)
    ↓
[Xuất kho gửi RMA về hãng]
Đóng gói, gửi về nhà cung cấp/hãng
→ Sản phẩm lỗi chuyển: KHO CHỜ TRẢ HÀNG (RMA Staging)
    ↓
[Gửi đi]
Sản phẩm lỗi rời khỏi hệ thống (đã gửi về hãng)
```

**Sơ đồ sản phẩm lỗi:**
```
Hàng Đã Bán (Customer)
    → Kho Đang Sửa Chữa (In-Service)
    → Kho Hàng Hỏng (Dead Stock)
    → Kho Chờ Trả Hàng (RMA Staging)
    → [Ra khỏi hệ thống - gửi về hãng]
```

#### 6.4.2. Luồng Sản phẩm Thay thế Trả cho Khách

```
[Sản phẩm thay thế trong kho]
KHO BẢO HÀNH (Warranty Stock)
- Hàng mới, dự trữ sẵn để thay thế
    ↓
[Mốc 3: Gán sản phẩm thay thế]
Manager/Technician chọn serial thay thế từ Warranty Stock
Ví dụ: ZOTAC RTX 4090 - Serial: XYZ999
    ↓
[Hệ thống TỰ ĐỘNG]
✅ Tạo Stock Issue (Phiếu xuất kho)
✅ Link sản phẩm XYZ999 vào Service Ticket
✅ Chuyển sản phẩm XYZ999:
   Từ: Kho Bảo Hành (Warranty Stock)
   Đến: Hàng Đã Bán (Customer Installed)
✅ Đánh dấu phiếu: "Warranty Replacement"
    ↓
[Giao sản phẩm mới cho khách]
Khách nhận sản phẩm thay thế mới
→ Sản phẩm ở: HÀNG ĐÃ BÁN (Customer Installed)
```

**Sơ đồ sản phẩm thay thế:**
```
Kho Bảo Hành (Warranty Stock)
    → Hàng Đã Bán (Customer Installed)
```

#### 6.4.3. Khi Nhận hàng Thay thế từ Hãng

```
[Hãng gửi sản phẩm mới về]
    ↓
[Nhập kho]
Tạo Stock Receipt (Phiếu nhập kho)
→ Nhập vào: KHO BẢO HÀNH (Warranty Stock)
    ↓
[Cập nhật RMA Batch]
Đánh dấu lô RMA: "Completed" (Đã nhận hàng thay thế)
    ↓
[Sản phẩm sẵn sàng]
Có thể dùng để thay thế cho khách hàng tiếp theo
```

---

### 5.5. Tổng hợp So sánh 3 Kịch bản

| Kịch bản | Kết quả | Luồng Kho | Sản phẩm khách nhận lại |
|----------|---------|-----------|------------------------|
| **1. Sửa được** | Repaired | Customer → In-Service → Customer | Sản phẩm cũ đã sửa |
| **2. Không sửa được + Không BH** | Unrepairable | Customer → In-Service → Customer | Sản phẩm cũ (vẫn lỗi) |
| **3. Đổi mới BH** | Warranty Replacement | **Sản phẩm lỗi:** Customer → In-Service → Dead Stock → RMA Staging → [Gửi hãng]<br>**Sản phẩm mới:** Warranty Stock → Customer | Sản phẩm mới (thay thế) |

---

## 6. VAI TRÒ VÀ TRÁCH NHIỆM

### 6.1. Bảng Phân quyền Tổng quan

| Chức năng | Admin | Manager | Technician | Reception |
|-----------|-------|---------|------------|-----------|
| **Yêu cầu Dịch vụ** |
| Xem danh sách Service Requests | ✅ | ✅ | ❌ | ✅ |
| Chuyển đổi SR → Service Ticket | ✅ | ✅ | ❌ | ✅ |
| **Phiếu Bảo hành** |
| Tạo Service Ticket mới | ✅ | ✅ | ❌ | ✅ |
| Xem tất cả phiếu | ✅ | ✅ | Chỉ phiếu được gán | ✅ |
| Sửa phiếu | ✅ | ✅ | Chỉ tasks được gán | ❌ |
| Gán kỹ thuật viên | ✅ | ✅ | ❌ | ❌ |
| Hủy phiếu | ✅ | ✅ | ❌ | ❌ |
| **Workflow & Tasks** |
| Tạo/Sửa Task | ✅ | ✅ | ❌ | ❌ |
| Tạo/Sửa Workflow | ✅ | ✅ | ❌ | ❌ |
| Thực hiện Tasks | ✅ | ✅ | ✅ | ❌ |
| Chuyển đổi Workflow | ✅ | ✅ | ❌ | ❌ |
| **Kho** |
| Xem tồn kho | ✅ | ✅ | Chỉ đọc | ✅ |
| Nhập kho (Stock Receipt) | ✅ | ✅ | ❌ | ✅ |
| Chuyển kho (Transfer) | ✅ | ✅ | ❌ | ❌ |
| Xuất kho (Issue) | ✅ | ✅ | ❌ | ❌ |
| Tạo RMA Batch | ✅ | ✅ | ❌ | ❌ |
| **Khách hàng & Sản phẩm** |
| Quản lý khách hàng | ✅ | ✅ | Chỉ đọc | ✅ |
| Quản lý sản phẩm (catalog) | ✅ | ✅ | Chỉ đọc | ❌ |
| Tra cứu bảo hành | ✅ | ✅ | ✅ | ✅ |
| **Báo cáo & Dashboard** |
| Xem Dashboard | ✅ | ✅ | Chỉ tasks của mình | ❌ |
| Xuất báo cáo | ✅ | ✅ | ❌ | ❌ |
| **Quản trị Hệ thống** |
| Quản lý người dùng | ✅ | ❌ | ❌ | ❌ |
| Cấu hình hệ thống | ✅ | ❌ | ❌ | ❌ |

---

### 6.2. Mô tả Chi tiết Vai trò

#### 7.2.1. Admin (Quản trị viên)

**Trách nhiệm:**
- Cấu hình toàn bộ hệ thống
- Quản lý người dùng, phân quyền
- Tạo và quản lý Workflows, Tasks
- Giám sát toàn bộ hoạt động
- Truy cập mọi dữ liệu và chức năng

**Workflow hàng ngày:**
1. Kiểm tra Dashboard tổng quan
2. Xem xét cảnh báo hệ thống (tồn kho thấp, bảo hành hết hạn)
3. Quản lý tài khoản người dùng mới
4. Cập nhật/tối ưu workflows khi cần
5. Xuất báo cáo định kỳ

#### 7.2.2. Manager (Quản lý)

**Trách nhiệm:**
- Giám sát hoạt động trung tâm
- Gán phiếu cho kỹ thuật viên
- Duyệt RMA, quyết định thay thế sản phẩm
- Quản lý kho, nhập/xuất/chuyển kho
- Xử lý các trường hợp đặc biệt

**Workflow hàng ngày:**
1. Xem Dashboard: phiếu pending, tasks quá hạn
2. Gán phiếu mới cho technicians
3. Xem xét các phiếu "không sửa được" → quyết định RMA
4. Kiểm tra tồn kho, tạo RMA Batch nếu cần
5. Giải quyết escalations từ khách hàng
6. Xuất báo cáo hiệu suất team

#### 7.2.3. Technician (Kỹ thuật viên)

**Trách nhiệm:**
- Thực hiện sửa chữa/bảo hành sản phẩm
- Hoàn thành tasks theo workflow được gán
- Ghi chú kết quả, chụp ảnh minh chứng
- Báo cáo vấn đề phát sinh cho Manager

**Workflow hàng ngày:**
1. Đăng nhập, vào "Hộp công việc của tôi"
2. Xem danh sách tasks (sắp xếp theo priority, deadline)
3. Chọn task → Bắt đầu → Thực hiện
4. Ghi chú kết quả, upload ảnh
5. Đánh dấu task hoàn thành
6. Lặp lại cho đến hết giờ làm việc
7. Báo cáo tasks quá hạn hoặc blocked

#### 7.2.4. Reception (Lễ tân)

**Trách nhiệm:**
- Tiếp nhận yêu cầu dịch vụ từ khách hàng
- Chuyển đổi Service Request → Service Ticket
- Xác minh bảo hành ban đầu
- Xác nhận giao hàng cho khách
- Nhập kho sản phẩm mới (nếu được phân công)

**Workflow hàng ngày:**
1. Xem danh sách Service Requests mới (submitted)
2. Gọi điện xác nhận khách hàng
3. Cập nhật trạng thái: received
4. Khi khách đến, chuyển đổi SR → Service Ticket
5. In phiếu tiếp nhận cho khách
6. Xác nhận giao hàng khi khách đến lấy sản phẩm đã sửa
7. Nhập kho sản phẩm mới (nếu có hàng về)

---

## 7. KẾT LUẬN

### 7.1. Tóm tắt Các Quy trình Chính

Hệ thống Quản lý Trung tâm Bảo hành cung cấp **4 quy trình nghiệp vụ chính**:

1. **Quy trình Tiếp nhận và Xử lý Yêu cầu Dịch vụ** (Service Request → Ticket Lifecycle)
   - Portal công khai 24/7 cho khách hàng
   - Xác minh bảo hành tự động
   - Workflow tasks chuẩn hóa
   - Xác nhận giao hàng linh hoạt

2. **Quy trình Xác minh Bảo hành và RMA** (Warranty & RMA)
   - 3 loại dịch vụ: Warranty, Paid, Goodwill
   - Xác minh bảo hành realtime
   - RMA workflow cho sản phẩm đổi trả
   - Cảnh báo hết hạn bảo hành

3. **Quy trình Quản lý Kho 2 Cấp** (Warehouse Management)
   - Kho vật lý + 7 loại kho ảo
   - Serial number tracking chi tiết
   - Stock movements: Receipt, Transfer, Issue
   - Cảnh báo tồn kho thấp

4. **Quy trình Quản lý Công việc** (Workflow & Task Management)
   - Thư viện Tasks tái sử dụng
   - Workflow templates chuẩn hóa
   - Hộp công việc cá nhân
   - Dynamic workflow switching

### 7.2. Lợi ích Tổng thể

**Giảm Chi phí:**
- ⬇️ 40% lỗi dịch vụ → Giảm chi phí rework
- ⬇️ 50% thời gian training → Tiết kiệm nhân sự
- ⬇️ 60% tình trạng thiếu hàng → Tối ưu tồn kho

**Tăng Hiệu quả:**
- ⬆️ 95% độ chính xác bảo hành → Giảm tranh chấp
- ⬆️ Onboarding nhanh hơn → Scale team dễ dàng
- ⬆️ Quy trình chuẩn hóa → Chất lượng nhất quán

**Cải thiện Trải nghiệm Khách hàng:**
- 💚 Self-service portal 24/7
- 💚 Minh bạch tiến độ sửa chữa
- 💚 Xác minh bảo hành tức thì
- 💚 Giao hàng linh hoạt

### 7.3. Bước Tiếp theo

**Để triển khai hệ thống:**

1. **Review và Sign-off Tài liệu này**
   - Xác nhận các quy trình phù hợp với nghiệp vụ thực tế
   - Đề xuất điều chỉnh (nếu có)

2. **Trả lời Bảng câu hỏi Chi tiết** (docs-nhung/SSTC_Questionnaire.md)
   - 67 câu hỏi về: Roles, Products, Warehouse, Orders, Warranty, RMA, Tasks, Reports
   - Giúp customize hệ thống chính xác hơn

3. **Demo Hệ thống**
   - Xem các quy trình hoạt động thực tế
   - Test các tính năng chính

4. **Training & Onboarding**
   - Đào tạo từng vai trò
   - Nhập dữ liệu master (sản phẩm, khách hàng, kho)

5. **Go-live**
   - Triển khai từng module
   - Hỗ trợ sát sao trong giai đoạn đầu

---

**Liên hệ:**
- Email: support@sstc.vn
- Hotline: 1900-xxxx

---

_Tài liệu này được tạo cho: Công ty Cổ phần Công nghệ SSTC_
_Ngày tạo: 2026-02-04_
_Phiên bản: 1.0 - Draft for Client Review_
_Mục đích: Client Demo & Sign-off_
