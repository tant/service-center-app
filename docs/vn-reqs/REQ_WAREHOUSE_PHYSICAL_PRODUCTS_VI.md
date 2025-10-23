# Yêu cầu: Quản lý Kho & Theo dõi Sản phẩm Vật lý

**ID Tính năng:** REQ-WH-PP
**Phiên bản:** 1.0
**Ngày:** 2025-01-22
**Trạng thái:** Bản nháp
**Ưu tiên:** P0 (Bắt buộc)

---

## Mục lục

1. [Bối cảnh kinh doanh](#bối-cảnh-kinh-doanh)
2. [Yêu cầu chức năng](#yêu-cầu-chức-năng)
3. [Mô hình dữ liệu](#mô-hình-dữ-liệu)
4. [Quy tắc kinh doanh](#quy-tắc-kinh-doanh)
5. [Luồng công việc](#luồng-công-việc)
6. [Yêu cầu UI/UX](#yêu-cầu-uiux)
7. [Các trường hợp đặc biệt](#các-trường-hợp-đặc-biệt)

---

## Bối cảnh kinh doanh

### Tổng quan

Trung tâm Dịch vụ SSTC cần quản lý:
- **Hoạt động kho:** Tồn kho sản phẩm và linh kiện cho các hoạt động dịch vụ
- **Sản phẩm vật lý:** Theo dõi từng sản phẩm có số sê-ri qua vòng đời
- **Quản lý bảo hành:** Hệ thống bảo hành hai cấp (Công ty + Nhà sản xuất)
- **Vòng đời RMA:** Quản lý sản phẩm hỏng gửi về nhà máy và nhận sản phẩm thay thế

### Phạm vi

**TRONG PHẠM VI:**
- ✅ Quản lý kho (2 cấp: Vật lý → Ảo)
- ✅ Theo dõi sản phẩm vật lý với số sê-ri
- ✅ Di chuyển kho chỉ cho các hoạt động dịch vụ
- ✅ Quy trình quét mã vạch
- ✅ Theo dõi bảo hành hai cấp
- ✅ Quy trình thay thế (bảo hành/RMA)
- ✅ Tồn kho linh kiện (đơn giản hóa - theo dõi tiêu thụ)
- ✅ Cảnh báo tồn kho thấp

**NGOÀI PHẠM VI (Giai đoạn 1):**
- ❌ Tồn kho bán hàng thương mại (mua/bán)
- ❌ Quản lý nhà cung cấp & đơn đặt hàng
- ❌ Định giá đa tiền tệ
- ❌ Các tính năng kho nâng cao (vị trí kệ, lộ trình lấy hàng)
- ❌ In mã vạch/tạo nhãn

### Các bên liên quan chính

- **Nhân viên kho:** Xuất/nhập kho
- **Kỹ thuật viên:** Sử dụng linh kiện, xuất sản phẩm thay thế
- **Quản lý:** Giám sát mức tồn kho, phê duyệt thay thế
- **Khách hàng:** (Gián tiếp) Nhận sản phẩm thay thế

---

## Yêu cầu chức năng

### FR-WH-001: Kiến trúc kho hai cấp

**Yêu cầu:**
Hệ thống phải hỗ trợ hệ thống phân cấp kho 2 cấp: Kho vật lý → Kho ảo

**Lý do:**
- Kho vật lý = địa điểm thực tế (TP.HCM, Hà Nội)
- Kho ảo = phân loại theo quy trình làm việc/trạng thái
- Mỗi kho ảo BẮT BUỘC thuộc 1 kho vật lý
- Các mặt hàng tồn kho CHỈ nằm trong các kho ảo

**Tiêu chí chấp nhận:**
- [ ] Quản trị viên có thể tạo kho vật lý (tên, địa chỉ)
- [ ] Quản trị viên có thể tạo kho ảo (tên, mục đích, kho vật lý mẹ)
- [ ] Mỗi kho ảo phải liên kết với 1 kho vật lý
- [ ] Các mặt hàng tồn kho được gán cho kho ảo (vị trí vật lý ngầm định)
- [ ] Giao diện người dùng hiển thị hệ thống phân cấp: Vật lý → Ảo → Các mặt hàng tồn kho

**Giá trị kinh doanh:** Quản lý hậu cần linh hoạt trong khi theo dõi các vị trí vật lý

---

### FR-WH-002: Định nghĩa kho ảo

**Yêu cầu:**
Hệ thống phải có các kho ảo được xác định trước với mục đích rõ ràng

**Các loại kho ảo:**

1.  **Kho Bảo Hành (Warranty Stock)**
    -   Mục đích: Sản phẩm mới để thay thế cho khách hàng
    -   Đầu vào: Hàng mới từ nhà cung cấp, hàng trả lại từ RMA của nhà sản xuất
    -   Tình trạng: mới, đã tân trang
    -   Ưu tiên: Cao (tồn kho hoạt động)

2.  **Kho RMA (RMA Staging)**
    -   Mục đích: Sản phẩm hỏng sẵn sàng gửi về nhà máy
    -   Khu vực tập kết hàng xuất
    -   Lưu giữ tạm thời (ngày/tuần)
    -   Mục đích: Gửi hàng loạt đến nhà sản xuất

3.  **Kho Hàng Hư Hỏng (Dead Stock / Salvage)**
    -   Mục đích: Sản phẩm hết bảo hành, không thể RMA
    -   Lưu trữ dài hạn
    -   Sử dụng trong tương lai: Thu hoạch linh kiện
    -   Ưu tiên: Thấp (không hoạt động)

4.  **Kho Linh Kiện (Parts Inventory)**
    -   Mục đích: Linh kiện để sửa chữa
    -   Theo dõi: Chỉ tiêu thụ (không cần cảnh báo tồn kho)
    -   Xử lý: Giả định có sẵn không giới hạn

5.  **Kho Tạm / Đang Dịch Vụ (In-Service)**
    -   Mục đích: Sản phẩm đang được bảo hành
    -   Trạng thái tạm thời
    -   Chờ chẩn đoán, chờ quyết định

**Tiêu chí chấp nhận:**
- [ ] Hệ thống được cấu hình sẵn với 5 kho ảo trên
- [ ] Quản trị viên có thể thêm các kho ảo khác
- [ ] Mỗi loại có mô tả và mục đích rõ ràng
- [ ] Các di chuyển kho tôn trọng mục đích của kho

**Giá trị kinh doanh:** Tổ chức rõ ràng, quy trình làm việc được tiêu chuẩn hóa

---

### FR-WH-003: Dữ liệu chính sản phẩm vật lý

**Yêu cầu:**
Mỗi sản phẩm vật lý (có số sê-ri) phải có một bản ghi chính hoàn chỉnh

**Các trường bắt buộc:**
- `serial_number` (VARCHAR, duy nhất, KHÔNG NULL) - Mã định danh chính
- `product_id` (FK → bảng sản phẩm) - Liên kết đến danh mục sản phẩm
- `brand` (VARCHAR) - ZOTAC, SSTC
- `import_date` (DATE, KHÔNG NULL) - Ngày nhập khẩu/nhập kho
- `manufacturer_warranty_end_date` (DATE, có thể null) - Nhập thủ công
- `company_warranty_end_date` (DATE, có thể null) - Nhập thủ công
- `current_location_id` (FK → kho ảo, có thể null)
- `condition` (ENUM: mới, đã tân trang, bị lỗi, đang bảo hành, đang chờ RMA)
- `created_at`, `updated_at` (dấu vết kiểm toán)

**Các trường tùy chọn:**
- `sale_date` (DATE, có thể null) - Ngày bán cho khách hàng
- `customer_id` (FK → khách hàng, có thể null) - Nếu đã bán
- `supplier_info` (TEXT, có thể null)
- `purchase_order_ref` (VARCHAR, có thể null)
- `cost` (DECIMAL, có thể null)
- `notes` (TEXT, có thể null)

**Mối quan hệ:**
- `1:N` → phiếu dịch vụ (lịch sử dịch vụ)
- `1:N` → di chuyển kho (lịch sử di chuyển)

**Tiêu chí chấp nhận:**
- [ ] Tạo bản ghi sản phẩm vật lý với các trường bắt buộc
- [ ] Tính duy nhất của số sê-ri được thực thi (ràng buộc cơ sở dữ liệu)
- [ ] Ngày kết thúc bảo hành là nhập thủ công (không tự động tính toán)
- [ ] Theo dõi vị trí hiện tại (kho ảo)
- [ ] Xem lịch sử dịch vụ hoàn chỉnh cho một sê-ri
- [ ] Không thể xóa sản phẩm vật lý (chỉ xóa mềm)

**Giá trị kinh doanh:** Khả năng truy xuất nguồn gốc hoàn chỉnh cho mỗi đơn vị, quản lý bảo hành

---

### FR-WH-004: Xác minh & Bảo mật số sê-ri

**Yêu cầu:**
Chỉ sản phẩm có sê-ri trong hệ thống mới được bảo hành

**Quy tắc kinh doanh:**

1.  **Logic xác minh sê-ri:**
    ```
    NẾU serial_number TỒN TẠI trong bảng physical_products
    VÀ company_warranty_end_date >= ngày hiện tại
    → ĐỦ ĐIỀU KIỆN bảo hành công ty

    KHÁC NẾU serial_number TỒN TẠI
    VÀ manufacturer_warranty_end_date >= ngày hiện tại
    → ĐỦ ĐIỀU KIỆN bảo hành nhà sản xuất (RMA)

    KHÁC
    → KHÔNG ĐỦ ĐIỀU KIỆN bảo hành (chỉ sửa chữa có tính phí)
    ```

2.  **Xử lý sê-ri không xác định:**
    -   Sê-ri KHÔNG có trong cơ sở dữ liệu → Không phải hàng chính hãng
    -   NẾU khách hàng TỪ CHỐI sửa chữa có tính phí → Không làm gì, không tạo bản ghi
    -   NẾU khách hàng CHẤP NHẬN sửa chữa có tính phí → Tạo bản ghi sản phẩm vật lý:
        *   Đặt ngày bảo hành = NULL hoặc ngày trong quá khứ
        *   Gắn cờ: `out_of_warranty` = true
        *   Liên kết với phiếu dịch vụ (service_decision = 'paid_repair')

3.  **Chuyển quyền sở hữu:**
    -   KHÔNG quan tâm ai là chủ sở hữu hiện tại
    -   Chỉ kiểm tra: Sê-ri có trong hệ thống không?
    -   Bảo hành có thể chuyển nhượng cho bất kỳ người nào mang đến

**Tiêu chí chấp nhận:**
- [ ] Chức năng tra cứu sê-ri: Kiểm tra tính đủ điều kiện bảo hành
- [ ] Hiển thị trạng thái bảo hành: Công ty/Nhà sản xuất/Hết hạn
- [ ] Cho phép dịch vụ cho các sê-ri không xác định (với cờ sửa chữa có tính phí)
- [ ] Không thể xóa bản ghi sê-ri (duy trì lịch sử)
- [ ] Dấu vết kiểm toán: Các lần tra cứu sê-ri được ghi lại

**Giá trị kinh doanh:** Bảo vệ chống gian lận bảo hành, sửa chữa có tính phí linh hoạt

---

### FR-WH-005: Theo dõi di chuyển kho

**Yêu cầu:**
Theo dõi tất cả các di chuyển kho trong các hoạt động dịch vụ

**Các loại di chuyển (TRONG PHẠM VI):**

1.  **Tiếp nhận (VÀO)**
    -   Sản phẩm của khách hàng → Kho Tạm / Đang Dịch Vụ
    -   Kích hoạt: Nhân viên nhập kho sản phẩm từ khách
    -   Ghi lại: Sê-ri, dấu thời gian, nhân viên, ảnh

2.  **Xuất thay thế (RA)**
    -   Kho Bảo Hành → Khách hàng (qua phiếu dịch vụ)
    -   Kích hoạt: Kỹ thuật viên xuất sản phẩm thay thế
    -   Ghi lại: Sê-ri, liên kết phiếu dịch vụ, dấu thời gian

3.  **Sản phẩm lỗi VÀO (đến RMA)**
    -   Đang Dịch Vụ → Kho RMA
    -   Kích hoạt: Sản phẩm hỏng chuyển sang khu vực tập kết cho RMA
    -   Ghi lại: Sê-ri, liên kết phiếu dịch vụ, lý do

4.  **Xuất RMA**
    -   Kho RMA → Gửi đến nhà sản xuất
    -   Kích hoạt: Gửi hàng loạt
    -   Ghi lại: Nhiều sê-ri, ghi chú lô hàng

5.  **Nhập RMA**
    -   Nhận từ nhà sản xuất → Kho Bảo Hành
    -   Kích hoạt: Hàng thay thế đến
    -   Ghi lại: Sê-ri, tình trạng (mới/đã tân trang)

6.  **Sử dụng linh kiện (RA)**
    -   Kho Linh Kiện → Được sử dụng trong sửa chữa
    -   Kích hoạt: Kỹ thuật viên thêm linh kiện vào phiếu dịch vụ
    -   Ghi lại: SKU linh kiện, số lượng, liên kết phiếu dịch vụ

7.  **Chuyển nội bộ**
    -   Giữa các kho ảo
    -   Ví dụ: Kho Tạm → Kho Hàng Hư Hỏng

**Mô hình dữ liệu: stock_movements**
```sql
stock_movements
├─ id (UUID)
├─ movement_type (ENUM: in, out, transfer)
├─ movement_category (ENUM: reception, replacement, rma, parts_usage, transfer)
├─ physical_product_id (FK, có thể null) - Đối với sản phẩm có sê-ri
├─ part_id (FK, có thể null) - Đối với linh kiện không có sê-ri
├─ quantity (INTEGER, mặc định 1) - Chỉ đối với linh kiện
├─ from_location_id (FK → kho ảo, có thể null)
├─ to_location_id (FK → kho ảo, có thể null)
├─ ticket_id (FK → phiếu dịch vụ, có thể null)
├─ performed_by (FK → hồ sơ)
├─ timestamp (TIMESTAMP)
├─ notes (TEXT)
└─ metadata (JSONB)
```

**Tiêu chí chấp nhận:**
- [ ] Tự động tạo di chuyển kho khi có hoạt động kho
- [ ] Ghi lại cả vị trí nguồn và đích
- [ ] Liên kết các di chuyển với phiếu dịch vụ (để truy xuất nguồn gốc)
- [ ] Hỗ trợ cả sản phẩm có sê-ri và linh kiện (dựa trên số lượng)
- [ ] Lịch sử di chuyển có thể xem được cho mỗi sản phẩm
- [ ] Không thể xóa các di chuyển (dấu vết kiểm toán bất biến)

**Giá trị kinh doanh:** Khả năng truy xuất nguồn gốc hoàn chỉnh, tuân thủ kiểm toán

---

### FR-WH-006: Cảnh báo tồn kho thấp

**Yêu cầu:**
Hệ thống phải cảnh báo khi tồn kho của sản phẩm thấp hơn ngưỡng

**Phạm vi:**
- ✅ Áp dụng cho: Sản phẩm trong Kho Bảo Hành (tồn kho thay thế)
- ❌ KHÔNG áp dụng cho: Linh kiện (giả định không giới hạn)

**Cấu hình:**
-   Cho mỗi loại sản phẩm: Đặt mức tồn kho tối thiểu
-   Ví dụ: RTX 4080 tối thiểu = 3 đơn vị
-   Quản trị viên/Quản lý cấu hình ngưỡng

**Logic cảnh báo:**
```
NẾU stock_in_warranty_warehouse <= ngưỡng
→ Hiển thị cảnh báo trong bảng điều khiển
→ Mã màu: Đỏ (< ngưỡng), Vàng (= ngưỡng), Xanh (> ngưỡng)
→ Tùy chọn: Thông báo qua email cho người quản lý
```

**Tiêu chí chấp nhận:**
- [ ] Quản trị viên có thể đặt ngưỡng tồn kho cho mỗi loại sản phẩm
- [ ] Bảng điều khiển hiển thị mức tồn kho với mã màu
- [ ] Huy hiệu cảnh báo hiển thị số lượng tồn kho thấp
- [ ] Cảnh báo qua email tùy chọn (có thể cấu hình)
- [ ] Không chặn hoạt động (chỉ cảnh báo)

**Giá trị kinh doanh:** Quản lý tồn kho chủ động, ngăn chặn tình trạng hết hàng

---

### FR-WH-007: Quy trình thay thế - Tình trạng tồn kho

**Yêu cầu:**
Quản lý có thể phê duyệt thay thế ngay cả khi hết hàng

**Quy tắc kinh doanh:**
-   Việc phê duyệt KHÔNG bị chặn bởi tình trạng tồn kho
-   Nếu tồn kho = 0:
    *   Nhiệm vụ XUẤT kho được tạo nhưng trạng thái = BỊ CHẶN
    *   Nhiệm vụ hiển thị: "Chờ hàng về - Tồn kho hiện tại: 0"
    *   Khi hàng về (nhập kho mới) → Nhiệm vụ tự động được bỏ chặn
    *   Thông báo cho kỹ thuật viên
-   Giao tiếp với khách hàng: "Chờ hàng về 3-5 ngày"

**Lý do:**
-   Không từ chối khách hàng vì hết hàng tạm thời
-   Duy trì mối quan hệ khách hàng tốt
-   Quy trình làm việc linh hoạt > Quy tắc cứng nhắc

**Tiêu chí chấp nhận:**
- [ ] Quản lý có thể phê duyệt thay thế bất kể tồn kho
- [ ] Nhiệm vụ XUẤT kho được tạo với trạng thái BỊ CHẶN nếu tồn kho = 0
- [ ] Nhiệm vụ hiển thị mức tồn kho hiện tại
- [ ] Nhiệm vụ tự động được bỏ chặn khi có hàng
- [ ] Thông báo được gửi đến kỹ thuật viên được giao

**Giá trị kinh doanh:** Cách tiếp cận lấy khách hàng làm trung tâm, linh hoạt

---

### FR-WH-008: Quản lý linh kiện (Đơn giản hóa)

**Yêu cầu:**
Theo dõi tiêu thụ linh kiện cho mỗi phiếu dịch vụ, không cần xác thực tồn kho

**Sự khác biệt chính so với sản phẩm:**
- ❌ KHÔNG có số sê-ri (chỉ dựa trên SKU)
- ❌ KHÔNG có cảnh báo tồn kho
- ❌ KHÔNG có xác thực tồn kho (cho phép âm)
- ✅ Theo dõi: Sử dụng linh kiện cho mỗi phiếu dịch vụ
- ✅ Theo dõi: Số lượng tiêu thụ

**Luồng công việc:**
1.  Kỹ thuật viên thực hiện nhiệm vụ sửa chữa
2.  Thêm linh kiện vào phiếu dịch vụ: Chọn SKU + Nhập số lượng
3.  Hệ thống tự động:
    -   Liên kết linh kiện với phiếu dịch vụ (service_ticket_parts)
    -   Giảm số lượng tồn kho (không xác thực)
    -   Tạo bản ghi di chuyển kho
    -   Cập nhật tổng chi phí linh kiện của phiếu dịch vụ

**Mô hình dữ liệu: parts (bảng hiện có)**
```sql
parts
├─ sku, part_number, name
├─ current_stock (INTEGER) - Có thể âm
├─ unit_price (DECIMAL)
└─ ... (các trường hiện có)
```

**Tiêu chí chấp nhận:**
- [ ] Kỹ thuật viên có thể thêm linh kiện vào phiếu dịch vụ mà không cần kiểm tra tồn kho
- [ ] Tồn kho tự động giảm (cho phép âm)
- [ ] Tiêu thụ linh kiện được theo dõi cho mỗi phiếu dịch vụ
- [ ] Không có cảnh báo hoặc xác thực
- [ ] Tập trung: Theo dõi tiêu thụ để kế toán

**Giá trị kinh doanh:** Quy trình làm việc đơn giản, nhanh chóng; theo dõi chi phí

---

### FR-WH-009: Quy trình quét mã vạch

**Yêu cầu:**
Hỗ trợ quét mã vạch cho số sê-ri trong suốt các quy trình làm việc

**Các điểm quét:**

1.  **Tiếp nhận**
    -   Quét sê-ri → Tự động điền thông tin sản phẩm
    -   Xác thực sê-ri tồn tại trong cơ sở dữ liệu
    -   Hiển thị trạng thái bảo hành tức thì

2.  **Xuất kho (Thay thế)**
    -   Quét sê-ri của sản phẩm thay thế
    -   Xác thực: Sản phẩm ở đúng kho
    -   Tự động liên kết với phiếu dịch vụ

3.  **Nhập RMA**
    -   Quét nhiều sê-ri (hàng loạt)
    -   Tự động nhập vào Kho Bảo Hành

**Triển khai:**
-   Máy quét mã vạch = Nhập liệu từ bàn phím (máy quét USB tiêu chuẩn)
-   Trường nhập liệu: Tự động gửi khi có đầu vào từ máy quét (phát hiện phím Enter)
-   Xác thực: Phản hồi ngay lập tức (tồn tại/không tồn tại)

**Tiêu chí chấp nhận:**
- [ ] Các trường nhập liệu hỗ trợ đầu vào từ máy quét mã vạch
- [ ] Tự động gửi khi nhấn phím Enter (từ máy quét)
- [ ] Phản hồi xác thực ngay lập tức
- [ ] Hiển thị chi tiết sản phẩm khi quét thành công
- [ ] Thông báo lỗi nếu không tìm thấy sê-ri
- [ ] Hỗ trợ nhập thủ công làm phương án dự phòng

**Giá trị kinh doanh:** Tốc độ, độ chính xác, giảm lỗi nhập liệu

---

### FR-WH-010: Hoạt động hàng loạt RMA

**Yêu cầu:**
Hỗ trợ các hoạt động hàng loạt cho các lô hàng RMA

**Xuất RMA (đến Nhà sản xuất):**

Giao diện người dùng: Trang quản lý Kho RMA
-   Hiển thị: Danh sách sản phẩm trong Kho RMA
-   Chọn: Hộp kiểm nhiều sản phẩm
-   Hành động: Nút "Xuất RMA"
-   Hiệu ứng:
    *   Cập nhật các sản phẩm đã chọn: vị trí = NULL hoặc "shipped_to_manufacturer"
    *   Tạo các di chuyển kho (RA) cho mỗi sản phẩm
    *   Tùy chọn: Trường ghi chú (thông tin lô hàng, ngày)

**Nhập RMA (từ Nhà sản xuất):**

Giao diện người dùng: Trang Nhập Kho
-   Nhập liệu: Quét mã vạch (nhiều) hoặc danh sách thủ công
-   Đích: "Kho Bảo Hành"
-   Tình trạng: Chọn (mới / đã tân trang)
-   Hành động: Nút "Nhập kho"
-   Hiệu ứng:
    *   Cập nhật sản phẩm: vị trí → Kho Bảo Hành
    *   Cập nhật tình trạng
    *   Tạo các di chuyển kho (VÀO)
    *   Sản phẩm sẵn sàng để thay thế

**Ngoài phạm vi (Giai đoạn 1):**
- ❌ Theo dõi lô hàng RMA với nhà sản xuất
- ❌ Số theo dõi của nhà vận chuyển
- ❌ Số yêu cầu RMA
- ❌ Ngày trả hàng dự kiến
→ Được quản lý bên ngoài (email, Excel)

**Tiêu chí chấp nhận:**
- [ ] Chọn nhiều sản phẩm trong Kho RMA
- [ ] Hoạt động xuất hàng loạt
- [ ] Hoạt động nhập hàng loạt (quét nhiều sê-ri)
- [ ] Đặt tình trạng cho các sản phẩm nhập vào
- [ ] Tất cả các di chuyển được ghi lại riêng lẻ
- [ ] Giao diện người dùng đơn giản, không theo dõi phức tạp

**Giá trị kinh doanh:** Hoạt động hàng loạt hiệu quả, tập trung vào tồn kho

---

## Mô hình dữ liệu

### Các bảng

#### 1. physical_warehouses

```sql
CREATE TABLE physical_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 2. virtual_warehouses

```sql
CREATE TABLE virtual_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_warehouse_id UUID NOT NULL REFERENCES physical_warehouses(id),
  name VARCHAR(100) NOT NULL,
  purpose TEXT,
  warehouse_type VARCHAR(50), -- 'warranty', 'rma', 'faulty', 'parts', 'in_service'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_physical_warehouse
    FOREIGN KEY (physical_warehouse_id)
    REFERENCES physical_warehouses(id)
);
```

#### 3. physical_products

```sql
CREATE TABLE physical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number VARCHAR(100) NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id),
  brand VARCHAR(50) NOT NULL,

  -- Ngày
  import_date DATE NOT NULL,
  sale_date DATE,
  manufacturer_warranty_end_date DATE,
  company_warranty_end_date DATE,

  -- Vị trí & Trạng thái
  current_location_id UUID REFERENCES virtual_warehouses(id),
  condition VARCHAR(50) DEFAULT 'new',
    -- 'new', 'refurbished', 'faulty', 'in_service', 'out_for_rma', 'shipped_to_manufacturer'

  -- Quyền sở hữu
  customer_id UUID REFERENCES customers(id),

  -- Tùy chọn
  supplier_info TEXT,
  purchase_order_ref VARCHAR(100),
  cost DECIMAL(15,2),
  notes TEXT,

  -- Kiểm toán
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES profiles(id),

  -- Chỉ mục
  INDEX idx_serial (serial_number),
  INDEX idx_location (current_location_id),
  INDEX idx_customer (customer_id),
  INDEX idx_warranty_dates (company_warranty_end_date, manufacturer_warranty_end_date)
);
```

#### 4. stock_movements

```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'transfer'
  movement_category VARCHAR(50), -- 'reception', 'replacement', 'rma', 'parts_usage', 'transfer'

  -- Sản phẩm hoặc Linh kiện
  physical_product_id UUID REFERENCES physical_products(id),
  part_id UUID REFERENCES parts(id),
  quantity INTEGER DEFAULT 1,

  -- Vị trí
  from_location_id UUID REFERENCES virtual_warehouses(id),
  to_location_id UUID REFERENCES virtual_warehouses(id),

  -- Bối cảnh
  ticket_id UUID REFERENCES service_tickets(id),
  performed_by UUID NOT NULL REFERENCES profiles(id),

  timestamp TIMESTAMP DEFAULT now(),
  notes TEXT,
  metadata JSONB,

  -- Ràng buộc
  CONSTRAINT check_product_or_part CHECK (
    (physical_product_id IS NOT NULL AND part_id IS NULL) OR
    (physical_product_id IS NULL AND part_id IS NOT NULL)
  ),

  -- Chỉ mục
  INDEX idx_product (physical_product_id),
  INDEX idx_part (part_id),
  INDEX idx_ticket (ticket_id),
  INDEX idx_timestamp (timestamp DESC)
);
```

#### 5. product_stock_thresholds

```sql
CREATE TABLE product_stock_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  virtual_warehouse_id UUID NOT NULL REFERENCES virtual_warehouses(id),
  minimum_quantity INTEGER NOT NULL DEFAULT 3,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  UNIQUE(product_id, virtual_warehouse_id)
);
```

### Chế độ xem

#### v_warehouse_stock_levels

```sql
CREATE VIEW v_warehouse_stock_levels AS
SELECT
  vw.id AS warehouse_id,
  vw.name AS warehouse_name,
  p.id AS product_id,
  p.name AS product_name,
  COUNT(pp.id) AS current_stock,
  pst.minimum_quantity AS threshold,
  CASE
    WHEN COUNT(pp.id) < pst.minimum_quantity THEN 'low'
    WHEN COUNT(pp.id) = pst.minimum_quantity THEN 'warning'
    ELSE 'ok'
  END AS stock_status
FROM virtual_warehouses vw
CROSS JOIN products p
LEFT JOIN physical_products pp
  ON pp.current_location_id = vw.id
  AND pp.product_id = p.id
LEFT JOIN product_stock_thresholds pst
  ON pst.product_id = p.id
  AND pst.virtual_warehouse_id = vw.id
GROUP BY vw.id, vw.name, p.id, p.name, pst.minimum_quantity;
```

---

## Quy tắc kinh doanh

### BR-WH-001: Hệ thống phân cấp kho ảo

**Quy tắc:** Mỗi kho ảo BẮT BUỘC thuộc 1 kho vật lý

**Thực thi:**
-   Cơ sở dữ liệu: Ràng buộc khóa ngoại (KHÔNG NULL)
-   Giao diện người dùng: Trường bắt buộc khi tạo kho ảo

**Lý do:** Luôn biết vị trí vật lý

---

### BR-WH-002: Tính toàn vẹn của vị trí tồn kho

**Quy tắc:** Sản phẩm vật lý CHỈ có thể ở trong các kho ảo

**Thực thi:**
-   `current_location_id` tham chiếu đến bảng `virtual_warehouses`
-   Không tham chiếu trực tiếp đến các kho vật lý

**Lý do:** Thực thi tổ chức dựa trên quy trình làm việc

---

### BR-WH-003: Tính đủ điều kiện bảo hành

**Quy tắc:** Xác minh sê-ri xác định tính đủ điều kiện bảo hành

**Logic:**
```
company_warranty_end_date >= CURRENT_DATE
  → Bảo hành công ty (SSTC xử lý)

KHÁC NẾU manufacturer_warranty_end_date >= CURRENT_DATE
  → Bảo hành nhà sản xuất (RMA cho nhà sản xuất)

KHÁC
  → Hết bảo hành (chỉ sửa chữa có tính phí)
```

**Thực thi:**
-   Logic ứng dụng trong chức năng kiểm tra bảo hành
-   Hiển thị trong giao diện người dùng với mã màu

---

### BR-WH-004: Tính bất biến của di chuyển kho

**Quy tắc:** Các di chuyển kho KHÔNG thể xóa hoặc sửa

**Thực thi:**
-   Không có quyền XÓA trên bảng stock_movements
-   Không có quyền CẬP NHẬT (ngoại trừ thông qua ghi đè của quản trị viên)
-   Giao diện người dùng: Không có nút xóa/chỉnh sửa

**Lý do:** Tính toàn vẹn của dấu vết kiểm toán

---

### BR-WH-005: Phê duyệt thay thế không bị chặn

**Quy tắc:** Quản lý có thể phê duyệt thay thế ngay cả khi tồn kho = 0

**Thực thi:**
-   Không kiểm tra xác thực trong quy trình phê duyệt
-   Trạng thái bị chặn của nhiệm vụ được xử lý riêng

**Lý do:** Lấy khách hàng làm trung tâm, hoạt động linh hoạt

---

### BR-WH-006: Không xác thực tồn kho linh kiện

**Quy tắc:** Linh kiện có thể âm, không kiểm tra tồn kho

**Thực thi:**
-   Xóa ràng buộc KIỂM TRA trên parts.current_stock
-   Không xác thực trong ứng dụng

**Lý do:** Quy trình làm việc đơn giản hóa, tập trung vào theo dõi tiêu thụ

---

## Luồng công việc

### Luồng công việc 1: Luồng sản phẩm thay thế

```
┌─────────────────────────────────────────────┐
│ KHÁCH HÀNG MANG SẢN PHẨM LỖI ĐẾN              │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ TIẾP NHẬN                                   │
│ - Quét sê-ri (sản phẩm lỗi)              │
│ - Chụp ảnh                                    │
│ - Nhập kho: "Đang Dịch Vụ"                 │
│                                             │
│ Hệ thống:                                     │
│ - Tạo/cập nhật bản ghi physical_product     │
│ - Tạo stock_movement (VÀO)                │
│ - Liên kết với phiếu dịch vụ                            │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ CHẨN ĐOÁN                                   │
│ - Kỹ thuật viên: Không thể sửa chữa               │
│ - Cập nhật phiếu dịch vụ: is_repairable = false      │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ PHÊ DUYỆT CỦA QUẢN LÝ                            │
│ - Phê duyệt: service_decision = 'warranty_replace'│
│ - Hệ thống kiểm tra tồn kho (chỉ hiển thị)        │
│ - NẾU tồn kho > 0: OK                          │
│ - NẾU tồn kho = 0: Vẫn phê duyệt (chờ)       │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ NHIỆM VỤ XUẤT KHO                          │
│ - NẾU tồn kho > 0:                             │
│   * Kỹ thuật viên lấy sản phẩm thay thế            │
│   * Quét sê-ri (sản phẩm mới)               │
│   * Hệ thống:                                 │
│     - Liên kết với phiếu dịch vụ                        │
│     - Tạo stock_movement (RA)           │
│     - Cập nhật vị trí physical_product      │
│                                             │
│ - NẾU tồn kho = 0:                             │
│   * Trạng thái nhiệm vụ: BỊ CHẶN                    │
│   * Hiển thị: "Chờ hàng về"                  │
│   * Khi hàng về → Tự động bỏ chặn       │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ NHẬP KHO (LỖI)                       │
│ - Di chuyển sản phẩm lỗi:                      │
│   "Đang Dịch Vụ" → "Kho RMA"               │
│ - Hệ thống:                                   │
│   - Cập nhật vị trí physical_product        │
│   - Tạo stock_movement (CHUYỂN)        │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ KIỂM TRA & GIAO HÀNG                          │
│ - Kiểm tra sản phẩm thay thế                  │
│ - Hoàn thành phiếu dịch vụ                           │
│ - Trả lại cho khách hàng                        │
└─────────────────────────────────────────────┘
```

### Luồng công việc 2: Vòng đời RMA

```
┌─────────────────────────────────────────────┐
│ SẢN PHẨM LỖI TRONG "KHO RMA"                │
│ (Từ nhiều phiếu dịch vụ)                     │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ XUẤT RMA HÀNG LOẠT                            │
│ Giao diện người dùng: Trang Kho RMA                            │
│ - Nhân viên chọn sản phẩm (hộp kiểm)         │
│ - Nhấp vào "Xuất RMA"                          │
│ - Tùy chọn: Ghi chú lô hàng                     │
│                                             │
│ Hệ thống:                                     │
│ - Cập nhật physical_products:                 │
│   vị trí = NULL hoặc "shipped_to_mfr"       │
│ - Tạo stock_movements (RA) cho mỗi sản phẩm    │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ BÊN NGOÀI: Gửi đến Nhà sản xuất              │
│ (Quản lý ngoài hệ thống)                    │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ NHÀ SẢN XUẤT SỬA CHỮA/THAY THẾ               │
│ (Vài tuần sau)                               │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ NHẬP RMA HÀNG LOẠT                            │
│ Giao diện người dùng: Trang Nhập Kho                           │
│ - Nhân viên quét sê-ri (nhiều)            │
│ - Chọn: Đích = "Kho Bảo Hành"     │
│ - Chọn: Tình trạng = mới/đã tân trang       │
│ - Nhấp vào "Nhập kho"                          │
│                                             │
│ Hệ thống:                                     │
│ - Cập nhật physical_products:                 │
│   vị trí = Kho Bảo Hành                   │
│   tình trạng = đã chọn                      │
- Tạo stock_movements (VÀO) cho mỗi sản phẩm     │
│ - Sản phẩm hiện có sẵn để thay thế   │
└─────────────────────────────────────────────┘
```

---

## Yêu cầu UI/UX

### UI-WH-001: Bảng điều khiển quản lý kho

**Vị trí:** Menu Quản trị viên/Quản lý → Kho

**Các thành phần:**

1.  **Phần Kho vật lý**
    -   Danh sách: Tên, Địa chỉ, Trạng thái hoạt động
    -   Hành động: Thêm, Chỉnh sửa, Hủy kích hoạt

2.  **Phần Kho ảo**
    -   Chế độ xem phân cấp: Vật lý → Ảo
    -   Mở rộng/thu gọn
    -   Cho mỗi kho: Số lượng tồn kho theo loại sản phẩm
    -   Mã màu: Cảnh báo tồn kho thấp

3.  **Tóm tắt mức tồn kho**
    -   Bảng: Sản phẩm | Kho | Tồn kho hiện tại | Ngưỡng | Trạng thái
    -   Mã màu: 🔴 Thấp | 🟡 Cảnh báo | 🟢 OK
    -   Nhấp vào sản phẩm → Xem chi tiết

4.  **Hành động nhanh**
    -   Nút: "Nhập Kho" (nhiều sản phẩm)
    -   Nút: "Xuất RMA hàng loạt"
    -   Nút: "Báo cáo tồn kho"

---

### UI-WH-002: Quy trình tiếp nhận sản phẩm

**Bối cảnh:** Nhân viên nhận sản phẩm từ khách

**Luồng giao diện người dùng:**

```
┌─────────────────────────────────────────────┐
│ TIẾP NHẬN SẢN PHẨM                          │
│                                             │
│ Số sê-ri:                              │
│ [___________________] [Quét mã vạch]        │
│                                             │
│ → Sau khi quét/nhập:                         │
│ ✅ ZOTAC RTX 4080 Trinity OC                │
│ ✅ Có trong hệ thống                        │
│ ✅ Bảo hành công ty: Đến 15/03/2026         │
│                                             │
│ Chụp hình sản phẩm: * Bắt buộc              │
│ [📷 Tải lên] (bên ngoài, tem, sê-ri)        │
│ 📷 front.jpg 📷 seal.jpg 📷 serial.jpg      │
│                                             │
│ Tình trạng bên ngoài:                       │
│ ☑ Tem nguyên vẹn                          │
│ ☐ Tem bị rách/mở                          │
│ ☑ Không trầy xước                          │
│ ☐ Có trầy xước (ghi chú)                   │
│                                             │
│ Nhập vào kho:                               │
│ [Dropdown: Chọn kho ảo] * Bắt buộc          │
│ - Đang Dịch Vụ                             │
│ - Kho Tạm                                   │
│                                             │
│ Ghi chú:                                    │
│ [Vùng văn bản...]                              │
│                                             │
│ [Xác Nhận Tiếp Nhận]                       │
└─────────────────────────────────────────────┘
```

**Xác thực:**
-   Yêu cầu sê-ri
-   Yêu cầu ảnh
-   Yêu cầu kho đích

**Sau khi gửi:**
-   Tạo/cập nhật physical_product
-   Tạo stock_movement (VÀO)
-   Liên kết với phiếu dịch vụ
-   Tạo phiếu dịch vụ nếu bật tự động tạo

---

### UI-WH-003: Lựa chọn sản phẩm thay thế

**Bối cảnh:** Kỹ thuật viên xuất sản phẩm thay thế

**Luồng giao diện người dùng:**

```
┌─────────────────────────────────────────────┐
│ XUẤT SẢN PHẨM THAY THẾ                      │
│ Phiếu dịch vụ: SV-2025-150 (RTX 4080)             │
│                                             │
│ Cần thay thế: ZOTAC RTX 4080               │
│                                             │
│ Tồn kho hiện tại: 3 cái                    │
│ Kho: Kho Bảo Hành                          │
│                                             │
│ Quét sê-ri sản phẩm thay thế:              │
│ [___________________] [Quét]                │
│                                             │
│ → Sau khi quét:                               │
│ ✅ Sê-ri: ZT-XXX-NEW-001                   │
│ ✅ Tình trạng: Mới (new)                    │
│ ✅ Có trong Kho Bảo Hành                   │
│                                             │
│ [Xác Nhận Xuất Kho]                        │
└─────────────────────────────────────────────┘
```

**Nếu tồn kho = 0:**

```
┌─────────────────────────────────────────────┐
│ XUẤT SẢN PHẨM THAY THẾ                      │
│ Phiếu dịch vụ: SV-2025-150                         │
│                                             │
│ ⚠️ HẾT HÀNG                                 │
│ Tồn kho hiện tại: 0 cái                    │
│                                             │
│ Nhiệm vụ này sẽ tự động mở khóa khi có hàng về.│
│                                             │
│ Thông báo khách: "Chờ hàng về 3-5 ngày"   │
│                                             │
│ [OK]                                        │
└─────────────────────────────────────────────┘
```

---

### UI-WH-004: Hoạt động hàng loạt RMA

**Trang xuất RMA:**

```
┌─────────────────────────────────────────────┐
│ KHO RMA - XUẤT HÀNG VỀ NHÀ MÁY              │
│                                             │
│ Sản phẩm trong kho: 12 mặt hàng               │
│                                             │
│ ☐ Chọn tất cả                                │
│ ─────────────────────────────────────────── │
│ ☑ RTX 4080 - Sê-ri: ZT-001 - Phiếu dịch vụ: SV-150│
│ ☑ SSD 1TB - Sê-ri: SS-002 - Phiếu dịch vụ: SV-151│
│ ☐ RTX 4070 - Sê-ri: ZT-003 - Phiếu dịch vụ: SV-152│
│ ...                                         │
│                                             │
│ Đã chọn: 2 mặt hàng                           │
│                                             │
│ Ghi chú lô hàng (tùy chọn):                   │
│ [Lô RMA #2025-01, Ngày gửi: 22/01]     │
│                                             │
│ [Xuất RMA] [Hủy]                         │
└─────────────────────────────────────────────┘
```
