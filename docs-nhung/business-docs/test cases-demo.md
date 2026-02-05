# 8. KỊCH BẢN TEST CHO DEMO

> **Tham chiếu:** [Tài liệu Quy trình Nghiệp vụ Chính](./03-quy-trinh-nghiep-vu-chinh.md)
> **Mục tiêu:** Khách hàng có thể thực hiện từng bước test và kiểm tra kết quả tại mỗi bước
> **Phiên bản:** 3.1

---

## MỤC LỤC

1. [Giới thiệu](#81-giới-thiệu)
2. [Luồng Test 0: Thêm sản phẩm mới vào danh mục (Product Catalog)](#82-luồng-test-0-thêm-sản-phẩm-mới-vào-danh-mục-product-catalog)
3. [Luồng Test 1: Nhập kho hàng mới (100 cái)](#83-luồng-test-1-nhập-kho-hàng-mới-100-cái)
4. [Luồng Test 2: Xuất bán cho khách (60 cái)](#84-luồng-test-2-xuất-bán-cho-khách-60-cái)
5. [Luồng Test 3: Tạo yêu cầu bảo hành từ serial đã bán](#85-luồng-test-3-tạo-yêu-cầu-bảo-hành-từ-serial-đã-bán)
6. [Luồng Test 4: Kỹ thuật viên thực hiện tasks trong phiếu bảo hành](#86-luồng-test-4-kỹ-thuật-viên-thực-hiện-tasks-trong-phiếu-bảo-hành)
7. [Luồng Test 5: Duyệt đổi sản phẩm mới (Warranty Replacement)](#87-luồng-test-5-duyệt-đổi-sản-phẩm-mới-warranty-replacement)
8. [Luồng Test 6: Quy trình RMA gửi sản phẩm hư về nhà máy](#88-luồng-test-6-quy-trình-rma-gửi-sản-phẩm-hư-về-nhà-máy)
9. [Tổng hợp](#89-tổng-hợp-7-luồng-test)

---

## 📝 ISSUES TỔNG HỢP (Ngoài Test Cases)

> Section này ghi nhận các issue phát hiện trong quá trình test nhưng không thuộc test case cụ thể nào.

| # | Loại | Mô tả | Mức độ | Status |
|---|------|-------|--------|--------|
| 1 | UI | Remove "Phiếu nhập kho / Phiếu điều chỉnh (kiểm kê)" | Medium | Open |
| 2 | UI | Hide Workflows module | Medium | Open |
| 3 | UI | Bỏ "Danh mục linh kiện" trên menu (liên quan đến bỏ trường Linh kiện) | Medium | Open |
| 4 | UI | Remove "Phiếu xuất điều chỉnh (kiểm kê)" | Medium | Open |

---

## 8.1. Giới thiệu

Tài liệu này trình bày **7 luồng test chính** để demo hệ thống quản lý trung tâm bảo hành. Mỗi luồng test:

- ✅ Có các bước thực hiện rõ ràng (step-by-step)
- ✅ Có kết quả mong đợi (Expected Outcome) sau mỗi bước
- ✅ Có link tham chiếu đến quy trình nghiệp vụ chi tiết
- ✅ Đánh dấu các điểm tự động hóa của hệ thống

**Cách sử dụng tài liệu:**

1. Thực hiện từng bước theo thứ tự
2. Kiểm tra "Expected Outcome" sau mỗi bước
3. Nếu kết quả không đúng, báo ngay để xử lý
4. Click vào link Section để xem chi tiết quy trình nghiệp vụ

**Tóm tắt trạng thái kho sau khi hoàn thành tất cả test:**

| Thời điểm | Kho Chính (Main) | Hàng Đã Bán (Customer) | In-Service | Dead Stock | RMA Staging |
|-----------|------------------|------------------------|------------|------------|-------------|
| Sau Test 0 | 0 | 0 | 0 | 0 | 0 | *(Sản phẩm đã có trong catalog, chưa nhập kho)* |
| Sau Test 1 | 100 | 0 | 0 | 0 | 0 |
| Sau Test 2 | 39 | 61 | 0 | 0 | 0 |
| Sau Test 3 | 39 | 60 | 1 | 0 | 0 |
| Sau Test 4 | 39 | 61 | 0 | 0 | 0 |
| Sau Test 5 | 38 | 61 | 0 | 0 | 1 |
| Sau Test 6 | 39 | 61 | 0 | 0 | 0 |

---

## 8.2. Luồng Test 0: Thêm sản phẩm mới vào danh mục (Product Catalog)

**Mục tiêu:** Kiểm tra quy trình thêm sản phẩm mới vào danh mục trước khi có thể nhập kho

**Tham khảo:** [Section 1.3 - Các Module Chính](./03-quy-trinh-nghiep-vu-chinh.md#13-các-module-chính) - Quản lý Sản phẩm (catalog)

**Vai trò thực hiện:** Manager / Admin

**Lưu ý:** Đây là bước chuẩn bị **BẮT BUỘC** trước khi thực hiện Test 1 (Nhập kho). Sản phẩm phải tồn tại trong catalog trước khi có thể nhập hàng vật lý.

---

### BƯỚC 1: Truy cập Quản lý Sản phẩm

**Thao tác:**

1. Đăng nhập hệ thống với vai trò **Manager** hoặc **Admin**
2. Vào menu **"Quản lý Sản phẩm"** → **"Danh mục Sản phẩm"**
3. Click nút **"Thêm Sản phẩm Mới"**

**Expected Outcome:**

- ✅ Màn hình "Danh mục Sản phẩm" hiển thị
- ✅ Danh sách sản phẩm hiện có (nếu có) được hiển thị
- ✅ Nút "Thêm Sản phẩm Mới" hiển thị và có thể click
- ✅ Form "Tạo Sản phẩm Mới" hiển thị sau khi click

---

### BƯỚC 2: Nhập Thông tin Cơ bản

**Thao tác:**

1. Tại form "Tạo Sản phẩm Mới", nhập các thông tin cơ bản:
   - **Tên sản phẩm**: ZOTAC RTX 4090 24GB *(bắt buộc)*
   - **Mã sản phẩm (SKU)**: ZT-RTX4090-24G *(bắt buộc)*
   - **Thương hiệu**: ZOTAC *(bắt buộc)*
   - **Danh mục**: Card đồ họa / Graphics Card *(bắt buộc)*
   - **Mô tả**: "Card đồ họa ZOTAC Gaming GeForce RTX 4090 24GB GDDR6X" *(tùy chọn)*

**Expected Outcome:**

- ✅ Form hiển thị đầy đủ các trường thông tin
- ✅ Các trường bắt buộc được đánh dấu (*)
- ✅ Dropdown "Thương hiệu" hiển thị danh sách brands (có thể thêm mới nếu chưa có)
- ✅ Dropdown "Danh mục" hiển thị cây danh mục sản phẩm
- ✅ Validation realtime khi nhập liệu

#### 📝 ISSUES (Bước 2)
| # | Loại | Mô tả | Mức độ | Status |
|---|------|-------|--------|--------|
| 1 | Feature | Thêm trường "Nhà cung cấp" vào form tạo sản phẩm | Medium | Open |

---

### BƯỚC 3: Cấu hình Thông tin Bảo hành Mặc định

**Thao tác:**

1. Tại phần **"Cấu hình Bảo hành Mặc định"**, nhập:
   - **Bảo hành hãng (Manufacturer Warranty)**:
     + Thời hạn mặc định: **36 tháng** (3 năm)
   - **Bảo hành công ty (Company Warranty)**:
     + Thời hạn mặc định: **48 tháng** (4 năm)
   - **Điều kiện bảo hành**: "Không áp dụng với hư hỏng do người dùng, ngấm nước, thiên tai"

**Expected Outcome:**

- ✅ Phần cấu hình bảo hành hiển thị
- ✅ Có thể nhập thời hạn BH mặc định (sẽ tự động áp dụng khi nhập kho)
- ✅ Preview hiển thị:
  - BH Hãng: 36 tháng
  - BH Công ty: 48 tháng
- ✅ Điều kiện bảo hành được lưu để hiển thị cho khách hàng

#### 📝 ISSUES (Bước 3)
| # | Loại | Mô tả | Mức độ | Status |
|---|------|-------|--------|--------|
| 1 | UI | Bỏ trường "Linh kiện liên quan" | Low | Open |

---

### BƯỚC 4: Thêm Thông tin Bổ sung (Tùy chọn)

**Thao tác:**

1. Tại phần **"Thông tin Bổ sung"**, có thể nhập:
   - **Giá bán lẻ tham khảo**: 25,000,000 VNĐ
   - **Hình ảnh sản phẩm**: Upload ảnh (rtx4090-front.jpg, rtx4090-back.jpg)
   - **Thông số kỹ thuật**:
     + GPU: AD102
     + VRAM: 24GB GDDR6X
     + Công suất: 450W
   - **Ghi chú nội bộ**: "Sản phẩm flagship, ưu tiên bảo hành"

**Expected Outcome:**

- ✅ Các trường tùy chọn có thể bỏ trống
- ✅ Upload hình ảnh thành công (preview hiển thị)
- ✅ Thumbnail hiển thị bên ngoài sau khi thêm ảnh ✨
- ✅ Thông số kỹ thuật có thể thêm nhiều cặp key-value
- ✅ Ghi chú nội bộ chỉ hiển thị cho nhân viên, không hiển thị cho khách

---

### BƯỚC 5: Lưu Sản phẩm

**Thao tác:**

1. Kiểm tra lại toàn bộ thông tin:
   - Tên: ZOTAC RTX 4090 24GB
   - SKU: ZT-RTX4090-24G
   - Thương hiệu: ZOTAC
   - Danh mục: Card đồ họa
   - BH Hãng: 36 tháng, BH Công ty: 48 tháng
2. Click nút **"Lưu Sản phẩm"**
3. Chờ hệ thống xử lý

**Expected Outcome:**

- ✅ Hệ thống validation toàn bộ form
- ✅ Kiểm tra trùng SKU (nếu trùng → báo lỗi)
- ✅ Kiểm tra trùng tên sản phẩm (nếu trùng → cảnh báo, cho phép tiếp tục)
- ✅ Hiển thị thông báo: "✅ Đã tạo sản phẩm thành công"

#### 📝 ISSUES (Bước 5)
| # | Loại | Mô tả | Mức độ | Status |
|---|------|-------|--------|--------|
| 1 | Feature | Cần thêm cảnh báo khi trùng tên sản phẩm (warning) và trùng SKU (block) | Medium | Open |
- ✅ Sản phẩm xuất hiện trong danh mục với:

| Thông tin | Giá trị |
|-----------|---------|
| ID | PRD-001 (tự động tạo) |
| Tên | ZOTAC RTX 4090 24GB |
| SKU | ZT-RTX4090-24G |
| Thương hiệu | ZOTAC |
| Danh mục | Card đồ họa |
| Tồn kho | 0 (chưa nhập hàng) |
| Trạng thái | Active |

---

### BƯỚC 6: Kiểm tra Kết quả

**Thao tác:**

1. Vào **"Danh mục Sản phẩm"** → Tìm kiếm "RTX 4090"
2. Click vào sản phẩm vừa tạo để xem chi tiết
3. Kiểm tra sản phẩm có sẵn trong dropdown khi tạo phiếu nhập kho

**Expected Outcome:**

**A) Danh mục Sản phẩm:**

- ✅ Sản phẩm "ZOTAC RTX 4090 24GB" xuất hiện trong danh sách
- ✅ Có thể tìm kiếm bằng: Tên, SKU, Thương hiệu
- ✅ Hiển thị: Tên, SKU, Thương hiệu, Danh mục, Tồn kho (0)

**B) Chi tiết Sản phẩm:**

| Thông tin | Giá trị |
|-----------|---------|
| Tên | ZOTAC RTX 4090 24GB |
| SKU | ZT-RTX4090-24G |
| Thương hiệu | ZOTAC |
| Danh mục | Card đồ họa |
| BH Hãng mặc định | 36 tháng |
| BH Công ty mặc định | 48 tháng |
| Tồn kho hiện tại | 0 cái |
| Số lượng đã bán | 0 cái |

**C) Sẵn sàng cho Nhập kho:**

- ✅ Khi vào "Quản lý Kho" → "Nhập Kho" → Chọn sản phẩm
- ✅ Dropdown hiển thị: "ZOTAC RTX 4090 24GB (ZT-RTX4090-24G)"
- ✅ Có thể chọn sản phẩm này để nhập kho (Test 1)

---

### Các trường hợp Test bổ sung

**A) Thêm Thương hiệu mới:**

1. Nếu thương hiệu "ZOTAC" chưa tồn tại
2. Click **"+ Thêm Thương hiệu Mới"** trong dropdown
3. Nhập: Tên thương hiệu, Logo, Website, Ghi chú
4. Lưu → Thương hiệu mới xuất hiện trong dropdown

**B) Thêm Danh mục mới:**

1. Nếu danh mục "Card đồ họa" chưa tồn tại
2. Click **"+ Thêm Danh mục Mới"**
3. Nhập: Tên danh mục, Danh mục cha (nếu có), Mô tả
4. Lưu → Danh mục mới xuất hiện trong cây danh mục

**C) Sửa thông tin sản phẩm:**

1. Vào chi tiết sản phẩm → Click **"Sửa"**
2. Thay đổi thông tin cần thiết
3. Lưu → Thông tin được cập nhật

**D) Vô hiệu hóa sản phẩm:**

1. Vào chi tiết sản phẩm → Click **"Vô hiệu hóa"**
2. Xác nhận → Sản phẩm chuyển trạng thái: Active → **Inactive**
3. Sản phẩm không xuất hiện trong dropdown khi tạo phiếu nhập kho/bán hàng

---

## 8.3. Luồng Test 1: Nhập kho hàng mới (100 cái)

**Điều kiện tiên quyết:** Đã hoàn thành Test 0 - Sản phẩm "ZOTAC RTX 4090 24GB" đã tồn tại trong danh mục

**Mục tiêu:** Kiểm tra quy trình nhập kho với serial number tracking

**Tham khảo:** [Section 4.3 - Quy trình Nhập Kho](./03-quy-trinh-nghiep-vu-chinh.md#43-quy-trình-nhập-kho-stock-receipt)

**Vai trò thực hiện:** Warehouse Manager / Reception

---

### BƯỚC 1: Tạo Phiếu Nhập Kho

**Thao tác:**

1. Đăng nhập hệ thống với vai trò Manager/Reception
2. Vào menu **"Quản lý Kho"** → **"Nhập Kho"**
3. Click nút **"Tạo Phiếu Nhập Kho Mới"**
4. Chọn **Nhà cung cấp**: ZOTAC Technology
5. Chọn **Kho vật lý đích**: "Kho Công ty"
6. Nhập **Ghi chú**: "Nhập hàng mới theo PO-2026-001"

**Expected Outcome:**

- ✅ Form "Tạo Phiếu Nhập Kho" hiển thị đầy đủ các trường thông tin
- ✅ Dropdown nhà cung cấp hiển thị danh sách các nhà cung cấp
- ✅ Dropdown kho đích hiển thị "Kho Công ty" (kho vật lý mặc định)
- ✅ Sẵn sàng để thêm sản phẩm vào phiếu

#### 📝 ISSUES (Bước 1)
| # | Loại | Mô tả | Mức độ | Status |
|---|------|-------|--------|--------|
| 1 | Validation | Ngày nhập: Block future date, chỉ cho phép back date tối đa 7 ngày | Medium | Open |
| 2 | UI | Bỏ button "Bắt đầu nhập serial" | Medium | Open |
| 3 | UI | Bỏ "Nhập CSV" trong Nhập số Serial - Phiếu nhập | Low | Open |
| 4 | Validation | Cảnh báo khi số serial trùng với serial đã có trong hệ thống | High | Open |
| 5 | Feature | Thêm trường "Thời hạn bảo hành hãng" khi nhập phiếu nhập kho (nhập ngày bắt đầu - ngày kết thúc theo thông tin trên sản phẩm/phiếu từ hãng) | **Critical** | ✅ Fixed |

> **✅ Fixed (2026-02-05):** Đã thêm warranty fields trong serial input drawer. Sử dụng DatePicker (dd/mm/yyyy), có thể áp dụng cho tất cả serials cùng lúc.

---

### BƯỚC 2: Thêm Sản phẩm vào Phiếu

**Thao tác:**

1. Click nút **"Thêm Sản phẩm"**
2. Chọn **Sản phẩm**: ZOTAC RTX 4090 24GB
3. Nhập **Số lượng**: 100
4. Chọn **Kho ảo đích**: Kho Chính (Main)
5. Click **"Thêm"**

**Expected Outcome:**

- ✅ Sản phẩm được thêm vào danh sách với thông tin:
  - Tên: ZOTAC RTX 4090 24GB
  - Số lượng: 100
  - Kho đích: Main (Kho Chính)
- ✅ Hiển thị thông báo: "Cần nhập 100 serial numbers"
- ✅ Form nhập serial được kích hoạt

---

### BƯỚC 3: Nhập 100 Serial Numbers

**Thao tác:**

1. Click vào ô **"Nhập Serial Numbers"**
2. Nhập danh sách serials (mỗi serial một dòng):
   ```
   ABC123456701
   ABC123456702
   ABC123456703
   ...
   ABC123456800
   ```
   *(Tổng cộng 100 serials từ 701-800)*

3. Click **"Validate Serials"**

**Expected Outcome:**

- ✅ Hệ thống kiểm tra và hiển thị: "100/100 serials hợp lệ"
- ✅ Không có serial trùng lặp
- ✅ Nếu có serial đã tồn tại trong hệ thống → Hiển thị cảnh báo đỏ
- ✅ Danh sách serial được lưu và sẵn sàng cho bước tiếp theo

---

### BƯỚC 4: Nhập Thông tin Bảo hành

**Thao tác:**

1. Tại phần **"Thông tin Bảo hành"**, nhập:
   - **Bảo hành hãng (Manufacturer Warranty)**:
     + Ngày bắt đầu: 04/02/2026 (hôm nay)
     + Thời hạn: 36 tháng
     + Ngày hết hạn: 04/02/2029 (tự động tính)
   - **Bảo hành công ty (Company Warranty)**:
     + Ngày bắt đầu: 04/02/2026
     + Thời hạn: 48 tháng
     + Ngày hết hạn: 04/02/2030 (tự động tính)

2. Chọn **Tình trạng sản phẩm**: New (Mới)

**Expected Outcome:**

- ✅ Ngày hết hạn bảo hành được tính tự động dựa trên ngày bắt đầu + thời hạn
- ✅ Hiển thị preview:
  - BH Hãng: 04/02/2026 → 04/02/2029 (3 năm)
  - BH Công ty: 04/02/2026 → 04/02/2030 (4 năm)
- ✅ Form validation pass (tất cả trường bắt buộc đã điền đầy đủ)
- ✅ Nút "Xác nhận nhập kho" được kích hoạt

---

### BƯỚC 5: Xác nhận Nhập Kho

**Thao tác:**

1. Kiểm tra lại thông tin tổng quan:
   - Sản phẩm: ZOTAC RTX 4090 24GB
   - Số lượng: 100 cái
   - Serials: ABC123456701 → ABC123456800
   - Kho đích: Kho Công ty → Main
2. Click nút **"Xác nhận Nhập Kho"**
3. Chờ hệ thống xử lý

**Expected Outcome:**

- ✅ Hiển thị loading indicator: "Đang xử lý nhập kho..."
- ✅ **Hệ thống TỰ ĐỘNG thực hiện:**
  1. Tạo 100 bản ghi Physical Product (mỗi serial một bản ghi)
  2. Gán mỗi sản phẩm vào Kho ảo "Main"
  3. Lưu thông tin bảo hành cho từng sản phẩm
  4. Cập nhật tồn kho: Main +100
  5. Ghi log: "04/02/2026 - Nhập 100 RTX 4090 từ ZOTAC Technology"
- ✅ Hiển thị thông báo thành công: "✅ Đã nhập kho thành công 100 sản phẩm"
- ✅ Phiếu nhập kho được lưu với mã: SR-2026-001 (Stock Receipt)

---

### BƯỚC 6: Kiểm tra Kết quả

**Thao tác:**

1. Vào menu **"Quản lý Kho"** → **"Xem Tồn Kho"**
2. Chọn kho: **Kho Công ty → Main (Kho Chính)**
3. Tìm sản phẩm: **ZOTAC RTX 4090 24GB**
4. Click vào sản phẩm để xem chi tiết
5. Thử tra cứu một serial cụ thể:
   - Vào **"Tra cứu Serial"**
   - Nhập: **ABC123456701**
   - Click **"Tìm kiếm"**

**Expected Outcome:**

**A) Màn hình Tồn Kho:**

| Thông tin | Giá trị |
|-----------|---------|
| Kho | Kho Công ty → Main (Kho Chính) |
| Sản phẩm | ZOTAC RTX 4090 24GB |
| Tồn kho | **100 cái** ✅ |
| Serials | ABC123456701 - ABC123456800 |
| Trạng thái | Available (Sẵn sàng) |

**B) Chi tiết Serial ABC123456701:**

| Thông tin | Giá trị |
|-----------|---------|
| Serial | ABC123456701 ✅ |
| Sản phẩm | ZOTAC RTX 4090 24GB |
| Tình trạng | New (Mới) |
| Vị trí | Kho Công ty → Main |
| BH Hãng | 04/02/2026 → 04/02/2029 (còn 1095 ngày) 🟢 |
| BH Công ty | 04/02/2026 → 04/02/2030 (còn 1460 ngày) 🟢 |
| Lịch sử | 04/02/2026: Nhập kho (SR-2026-001) |

**C) Tổng kết:**

- ✅ 100 sản phẩm xuất hiện trong Kho Chính
- ✅ Mỗi serial có bản ghi riêng với thông tin đầy đủ
- ✅ Thông tin bảo hành chính xác (hãng: 3 năm, công ty: 4 năm)
- ✅ Tồn kho dashboard cập nhật: Main = 100
- ✅ Log nhập kho được ghi nhận đầy đủ

---

## 8.4. Luồng Test 2: Xuất bán cho khách (60 cái)

**Mục tiêu:** Kiểm tra quy trình bán hàng và di chuyển sản phẩm từ kho → khách hàng

**Tham khảo:** [Section 4.7 - Quy trình Bán hàng](./03-quy-trinh-nghiep-vu-chinh.md#47-quy-trình-bán-hàng--mới)

**Vai trò thực hiện:** Reception / Manager

**Tự động hóa:** Hệ thống TỰ ĐỘNG di chuyển kho khi xác nhận bán (Main → Customer Installed) - [Quy tắc #7](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động)

---

### BƯỚC 1: Tạo Đơn Bán Hàng

**Thao tác:**

1. Đăng nhập với vai trò Reception/Manager
2. Vào menu **"Quản lý Kho"** → **"Xuất Kho"**
3. Click nút **"Tạo Phiếu Xuất Kho"**
4. Chọn **Loại xuất kho**: "Bán hàng (Sales)"
5. Click **"Tiếp tục"**

**Expected Outcome:**

- ✅ Form "Tạo Đơn Bán Hàng" hiển thị
- ✅ Các trường thông tin khách hàng sẵn sàng để nhập
- ✅ Dropdown "Loại xuất kho" hiển thị: Sales, Transfer, RMA, etc.
- ✅ Loại "Sales" được chọn

#### 📝 ISSUES (Bước 1)
| # | Loại | Mô tả | Mức độ | Status |
|---|------|-------|--------|--------|
| 1 | Validation | Ngày xuất: Block future date, chỉ cho phép back date tối đa 7 ngày (như phiếu nhập) | Medium | Open |
| 2 | UI | Bỏ "Nhập CSV" trong chọn Serial - Phiếu xuất (như phiếu nhập) | Low | Open |

---

### BƯỚC 2: Nhập Thông tin Khách hàng

**Thao tác:**

1. Tại phần **"Thông tin Khách hàng"**, nhập:
   - **Họ tên**: Nguyễn Văn A *(bắt buộc)*
   - **Số điện thoại**: 0912345678 *(bắt buộc)*
   - **Email**: nguyenvana@email.com *(tùy chọn)*
   - **Địa chỉ**: 123 Nguyễn Văn Linh, Q7, TP.HCM *(tùy chọn)*

2. Click **"Kiểm tra khách hàng"**

**Expected Outcome:**

- ✅ Hệ thống kiểm tra SĐT trong database:
  - Nếu khách cũ → Tự động điền thông tin (tên, email, địa chỉ)
  - Nếu khách mới → Tạo profile khách hàng mới
- ✅ Hiển thị: "✅ Khách hàng mới - Sẵn sàng tạo đơn"
- ✅ Form validation pass
- ✅ Section "Chọn sản phẩm" được kích hoạt

---

### BƯỚC 3: Chọn Sản phẩm

**Thao tác:**

1. Click **"Thêm Sản phẩm"**
2. Chọn **Kho nguồn**: Kho Công ty → Main (Kho Chính)
3. Chọn **Sản phẩm**: ZOTAC RTX 4090 24GB
4. Nhập **Số lượng**: 61
5. Hệ thống hiển thị **Số lượng khả dụng**: 100 cái ✅
6. Click **"Thêm"**

**Expected Outcome:**

- ✅ Sản phẩm được thêm vào đơn hàng:
  - ZOTAC RTX 4090 24GB
  - Số lượng: 61 / 100 khả dụng
  - Kho: Main (Kho Chính)
  - Trạng thái: ⏳ Chờ chọn serials
- ✅ Hiển thị cảnh báo: "Cần chọn 61 serial numbers"
- ✅ Nút "Chọn Serials" được kích hoạt
- ✅ Nút "Xác nhận bán" bị disable (chưa chọn đủ serials)

---

### BƯỚC 4: Chọn Serial Numbers

**Thao tác:**

1. Click **"Chọn Serials"**
2. Hệ thống hiển thị danh sách 100 serials khả dụng trong Main
3. **Cách 1:** Click checkbox chọn từng serial (61 serials đầu: 701-761)
   **HOẶC**
   **Cách 2:** Click **"Chọn tự động 61 đầu tiên"**
4. Kiểm tra: Đã chọn đủ 61/61 serials
5. Click **"Xác nhận chọn serials"**

**Expected Outcome:**

- ✅ Danh sách 61 serials được chọn: ABC123456701 đến ABC123456761
- ✅ Hiển thị: "✅ Đã chọn 61/61 serials"
- ✅ Preview danh sách serials đã chọn
- ✅ Nút "Xác nhận bán" được kích hoạt (enable)
- ✅ Có thể xem/in danh sách serials trước khi xác nhận

---

### BƯỚC 5: Xác nhận Bán Hàng

**Thao tác:**

1. Kiểm tra lại thông tin tổng quan:
   - Khách hàng: Nguyễn Văn A (0912345678)
   - Sản phẩm: ZOTAC RTX 4090 24GB × 61
   - Serials: ABC123456701 → ABC123456761
2. Chọn **Phương thức thanh toán**: Tiền mặt / Chuyển khoản
3. Click **"Xác nhận Xuất Kho & Bán Hàng"**
4. Chờ hệ thống xử lý

**Expected Outcome:**

- ✅ Loading indicator: "Đang xử lý bán hàng..."
- ✅ **Hệ thống TỰ ĐỘNG thực hiện:**

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| A | Tạo Stock Issue (Phiếu xuất kho) | Mã phiếu: SO-2026-001 |
| B | Di chuyển kho TỰ ĐỘNG (Quy tắc #7) | 61 serials: Main → Customer Installed |
| C | Cập nhật thông tin sản phẩm | Trạng thái: Đã bán, Chủ sở hữu: Nguyễn Văn A |
| D | Cập nhật tồn kho | Main: 100 → 39, Customer Installed: 0 → 61 |
| E | Ghi log | "04/02/2026 - Xuất bán 61 RTX 4090 cho KH Nguyễn Văn A" |

- ✅ Hiển thị: "✅ Bán hàng thành công! Mã đơn: SO-2026-001"

#### 📝 ISSUES (Bước 5)
| # | Loại | Mô tả | Mức độ | Status |
|---|------|-------|--------|--------|
| 1 | Bug | Sau khi hoàn thành phiếu xuất, hàng chưa được chuyển qua kho "Hàng đã Bán" (Customer Installed). Hiện chỉ đang thay status là "Đã Xuất" - cần auto di chuyển kho theo Quy tắc #7 | High | ✅ Fixed |

> **✅ Fixed (2026-02-05):** Trigger `process_issue_serial()` đã tự động chuyển sản phẩm sang kho `customer_installed` khi xuất với reason='sale'. Đồng thời lưu `last_known_customer_id` để tracking khách hàng.

---

### BƯỚC 6: Kiểm tra Kết quả

**Thao tác:**

1. Vào **"Quản lý Kho"** → **"Xem Tồn Kho"** kiểm tra kho Main
2. Kiểm tra kho Customer Installed
3. Tra cứu serial **ABC123456701**

**Expected Outcome:**

**A) Tồn kho sau khi bán:**

| Kho | Số lượng | Serials |
|-----|----------|---------|
| Main (Kho Chính) | **39 cái** ✅ | ABC123456762 → ABC123456800 |
| Customer Installed (Hàng Đã Bán) | **61 cái** ✅ | ABC123456701 → ABC123456761 |

**B) Serial ABC123456701:**

| Thông tin | Giá trị |
|-----------|---------|
| Trạng thái | Đã bán |
| Vị trí | Customer Installed |
| Chủ sở hữu | Nguyễn Văn A (0912345678) |
| Ngày mua | 04/02/2026 |
| Lịch sử | Nhập kho (SR-2026-001) → Bán cho KH (SO-2026-001) |

#### 📝 ISSUES (Bước 6)
| # | Loại | Mô tả | Mức độ | Status |
|---|------|-------|--------|--------|
| 1 | Bug | Inventory cập nhật không đúng (xem chi tiết bên dưới) | **Critical** | Open |

**Chi tiết Critical Bug #1:**
- **Hiện tại:** Kho Chính = 39, Customer Installed = 0, các kho khác = 0
- **Mong đợi:** Kho Chính = 39, Customer Installed = 61 (sau khi bán 61 từ 100)
- **Vấn đề:**
  1. 61 items đã xuất không được ghi nhận vào kho Customer Installed
  2. Quy tắc #7 (Auto di chuyển Main → Customer Installed khi bán) không hoạt động
- **Impact:** Mất tracking 61 sản phẩm, inventory không khớp, ảnh hưởng báo cáo tồn kho

---

## 8.5. Luồng Test 3: Tạo yêu cầu bảo hành từ serial đã bán

**Mục tiêu:** Kiểm tra quy trình tạo yêu cầu dịch vụ và xác minh bảo hành tự động

**Tham khảo:**

- [Section 2.3 - Lễ tân Chuyển đổi](./03-quy-trinh-nghiep-vu-chinh.md#23-bước-2-lễ-tân-xem-xét-và-chuyển-đổi-yêu-cầu)
- [Section 3.2 - Xác minh Bảo hành](./03-quy-trinh-nghiep-vu-chinh.md#32-quy-trình-xác-minh-bảo-hành)

**Vai trò thực hiện:** Customer Reps / Reception (Nội bộ)

**Tự động hóa:** Xác minh bảo hành tự động, Di chuyển kho tự động khi tạo ticket - [Quy tắc #1](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động)

---

### BƯỚC 1: Tạo Phiếu Dịch vụ và Xác minh Bảo hành (Tự động)

**Thao tác:**

1. Đăng nhập hệ thống với vai trò **Customer Reps / Reception**
2. Vào menu **"Phiếu Dịch vụ"** → **"Tạo Phiếu Mới"**
3. Tại trường **"Serial Number"**, nhập: **ABC123456701**
   *(Serial đã bán cho khách Nguyễn Văn A ở Test 2)*
3. Click **"Kiểm tra"**
4. Chờ hệ thống xác minh (1-2 giây)

**Expected Outcome:**

- ✅ Hệ thống TỰ ĐỘNG kiểm tra database và hiển thị:

| Thông tin | Giá trị |
|-----------|---------|
| Trạng thái | ✅ SERIAL HỢP LỆ - CÒN BẢO HÀNH |
| Serial | ABC123456701 |
| Sản phẩm | ZOTAC RTX 4090 24GB |
| Thương hiệu | ZOTAC |
| BH Hãng | 04/02/2026 → 04/02/2029 (còn 1095 ngày) 🟢 ĐANG HIỆU LỰC |
| BH Công ty | 04/02/2026 → 04/02/2030 (còn 1460 ngày) 🟢 ĐANG HIỆU LỰC |
| Kết luận | ✅ Sản phẩm đủ điều kiện bảo hành miễn phí |

**Các trường hợp khác:**

| Tình huống | Hiển thị |
|------------|----------|
| Hết bảo hành | 🔴 "Sản phẩm hết hạn BH, dịch vụ có phí" |
| Serial không tồn tại | ❌ "Serial không hợp lệ, vui lòng kiểm tra lại" |

---

### BƯỚC 2: Điền Thông tin Yêu cầu

**Thao tác:**

1. Sau khi xác minh thành công, hệ thống hiển thị form với thông tin **TỰ ĐỘNG ĐIỀN SẴN**:
   - Họ tên: Nguyễn Văn A *(từ dữ liệu mua hàng)*
   - Số điện thoại: 0912345678
   - Email: nguyenvana@email.com
2. Nhập thông tin bắt buộc:
   - **Mô tả lỗi**: "Card không lên màn hình, có tiếng beep 3 lần liên tiếp khi khởi động"
   - **Loại dịch vụ**: Tự động chọn "Warranty (Bảo hành)" *(vì còn BH)*
3. Tùy chọn:
   - Upload ảnh: card-khong-hoat-dong.jpg, error-screen.jpg

**Expected Outcome:**

- ✅ Form điền sẵn thông tin khách hàng (từ database khi mua hàng)
- ✅ Chỉ cần nhập mô tả lỗi
- ✅ Upload ảnh thành công (tối đa 5 ảnh, mỗi ảnh < 5MB)
- ✅ Preview ảnh hiển thị sau khi upload
- ✅ Validation form pass, nút "Tạo phiếu" enable

---

### BƯỚC 3: Tạo Phiếu Dịch vụ

**Thao tác:**

1. Kiểm tra lại toàn bộ thông tin
2. Click nút **"Tạo Phiếu Dịch vụ"**
3. Chờ hệ thống xử lý (2-3 giây)

**Expected Outcome:**

- ✅ **Hệ thống TỰ ĐỘNG tạo Service Ticket:**

| Thông tin | Giá trị |
|-----------|---------|
| Mã phiếu | **SV-2026-001** |
| Khách hàng | Nguyễn Văn A |
| Sản phẩm | ZOTAC RTX 4090 (ABC123456701) |
| Loại | Warranty (Bảo hành) |
| Trạng thái | Pending (Chờ xử lý) |

- ✅ Hiển thị thông báo thành công với mã phiếu
- ✅ **Hệ thống TỰ ĐỘNG (Quy tắc #1):**

| Hành động | Chi tiết |
|-----------|----------|
| Di chuyển kho | Serial ABC123456701: Customer Installed → **In-Service** |
| Gửi email | "Đã tiếp nhận sản phẩm - Phiếu SV-2026-001" |

- ✅ In phiếu tiếp nhận cho khách ký

---

### BƯỚC 4: Kiểm tra Kết quả

**Thao tác:**

1. Vào **"Quản lý Phiếu Dịch vụ"** → Xem phiếu **SV-2026-001**
2. Vào **"Tra cứu Serial"** → Nhập **ABC123456701**
3. Vào **"Quản lý Kho"** → Xem tồn kho **In-Service**

**Expected Outcome:**

**A) Phiếu Dịch vụ SV-2026-001:**

| Thông tin | Giá trị |
|-----------|---------|
| Mã phiếu | **SV-2026-001** |
| Trạng thái | Pending (Chờ xử lý) |
| Khách hàng | Nguyễn Văn A |
| Sản phẩm | ZOTAC RTX 4090 (ABC123456701) |

**B) Serial ABC123456701:**

| Thông tin | Giá trị |
|-----------|---------|
| Vị trí hiện tại | **In-Service** (Kho Đang Sửa Chữa) ✅ |
| Link với phiếu | SV-2026-001 |
| Lịch sử | Nhập kho → Bán cho KH → **Chuyển vào In-Service** |

**C) Tồn kho:**

| Kho | Trước | Sau |
|-----|-------|-----|
| Customer Installed | 61 | **60** |
| In-Service | 0 | **1** (ABC123456701) |

---

## 8.6. Luồng Test 4: Kỹ thuật viên thực hiện tasks trong phiếu bảo hành

**Mục tiêu:** Kiểm tra workflow tasks và quy trình kỹ thuật viên thực hiện công việc

**Tham khảo:**

- [Section 2.4 - Kỹ thuật viên Thực hiện](./03-quy-trinh-nghiep-vu-chinh.md#24-bước-3-kỹ-thuật-viên-thực-hiện-công-việc)
- [Section 2.4.2 - Quản lý Thời gian và Deadline](./03-quy-trinh-nghiep-vu-chinh.md#242-quản-lý-thời-gian-và-deadline)

**Vai trò thực hiện:** Technician (Kỹ thuật viên)

**Tự động hóa:** Khi hoàn thành tất cả tasks → Phiếu tự động chuyển ready_for_pickup, Di chuyển kho tự động - [Quy tắc #2](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động)

---

### BƯỚC 1: Đăng nhập và Xem danh sách Phiếu

**Thao tác:**

1. Đăng nhập hệ thống với vai trò **"Technician"** (Kỹ thuật viên A)
2. Vào menu **"Hộp công việc của tôi"** (My Tasks)
3. Xem danh sách phiếu được gán

**Expected Outcome:**

- ✅ Màn hình "Hộp công việc của tôi" hiển thị
- ✅ Danh sách phiếu được gán cho kỹ thuật viên:

| Mã phiếu | Priority | Khách hàng | Sản phẩm | Trạng thái |
|----------|----------|------------|----------|------------|
| SV-2026-001 | Normal | Nguyễn Văn A | ZOTAC RTX 4090 (ABC123456701) | Pending |

- ✅ Sắp xếp theo: Priority, Deadline
- ✅ Có filter: theo trạng thái, ngày, loại dịch vụ

---

### BƯỚC 2: Mở Phiếu và Xem Workflow Tasks

**Thao tác:**

1. Click vào phiếu **SV-2026-001**
2. Xem thông tin chi tiết phiếu
3. Xem danh sách Workflow Tasks

**Expected Outcome:**

- ✅ Thông tin phiếu hiển thị đầy đủ:
  - Khách hàng, sản phẩm, serial, mô tả lỗi
  - Loại dịch vụ: Warranty (Bảo hành)
  - Workflow: Bảo hành ZOTAC RTX 4090

- ✅ Danh sách tasks (chế độ **bắt buộc tuần tự**):

| # | Task | Thời gian | Yêu cầu | Trạng thái |
|---|------|-----------|---------|------------|
| 1 | Kiểm tra bao bì và phụ kiện | 5 phút | Ghi chú | **Pending** ✅ |
| 2 | Chụp ảnh tình trạng ban đầu | 5 phút | Ảnh | Blocked |
| 3 | Kiểm tra nguồn card | 10 phút | Ghi chú | Blocked |
| 4 | Test stress GPU 30 phút | 35 phút | Ghi chú + Ảnh | Blocked |
| 5 | Vệ sinh card | 20 phút | - | Blocked (không bắt buộc) |
| 6 | Chụp ảnh sau sửa chữa | 5 phút | Ảnh | Blocked |
| 7 | Test cuối cùng | 15 phút | Ghi chú | Blocked |
| 8 | Đóng gói sản phẩm | 5 phút | - | Blocked |

- ✅ Chỉ Task 1 là Pending, các task khác Blocked (vì bắt buộc tuần tự)
- ✅ Progress bar: 0/8 tasks completed (0%)

---

### BƯỚC 3: Thực hiện Task 1 - Kiểm tra bao bì

**Thao tác:**

1. Tại Task 1 "Kiểm tra bao bì và phụ kiện", click nút **"Bắt đầu"**
2. Task chuyển trạng thái: **In Progress**
3. Thực hiện kiểm tra bao bì và phụ kiện thực tế
4. Nhập **Ghi chú kết quả**: "Hộp nguyên vẹn, đầy đủ phụ kiện: cáp nguồn 8-pin x2, hướng dẫn sử dụng"
5. Click nút **"Hoàn thành"**

**Expected Outcome:**

- ✅ Task 1 chuyển: Pending → **In Progress** (khi bắt đầu)
- ✅ Hiển thị form nhập ghi chú (vì task yêu cầu ghi chú)
- ✅ Validation: Không cho hoàn thành nếu chưa nhập ghi chú
- ✅ Task 1 chuyển: In Progress → **Completed** (khi hoàn thành)
- ✅ Task 2 tự động chuyển: Blocked → **Pending**
- ✅ Progress bar: 1/8 tasks completed (12.5%)
- ✅ Ghi nhận thời gian thực tế thực hiện task

---

### BƯỚC 4: Thực hiện Task 2 - Chụp ảnh ban đầu

**Thao tác:**

1. Tại Task 2 "Chụp ảnh tình trạng ban đầu", click **"Bắt đầu"**
2. Task chuyển: **In Progress**
3. Upload ảnh:
   - card-mat-truoc.jpg
   - card-mat-sau.jpg
   - card-cac-goc.jpg
4. Nhập **Ghi chú**: "Chụp 4 góc card, không thấy vết hư hỏng ngoại quan"
5. Click **"Hoàn thành"**

**Expected Outcome:**

- ✅ Task 2 chuyển: Pending → **In Progress**
- ✅ Form upload ảnh hiển thị (vì task yêu cầu ảnh)
- ✅ Validation: Không cho hoàn thành nếu chưa upload ảnh
- ✅ Preview ảnh sau khi upload
- ✅ Task 2 chuyển: In Progress → **Completed**
- ✅ Task 3 tự động chuyển: Blocked → **Pending**
- ✅ Progress bar: 2/8 tasks completed (25%)

---

### BƯỚC 5: Thực hiện các Tasks tiếp theo (3-7)

**Thao tác:**

Lặp lại quy trình tương tự cho các tasks còn lại:

| Task | Thao tác | Kết quả nhập |
|------|----------|--------------|
| Task 3 | Kiểm tra nguồn card | Ghi chú: "Nguồn card hoạt động bình thường, không có dấu hiệu cháy nổ" |
| Task 4 | Test stress GPU | Ghi chú + Ảnh: "Chạy test 30 phút, nhiệt độ max 75°C, không crash", upload kết quả benchmark |
| Task 5 | Vệ sinh card *(không bắt buộc)* | **Có thể Skip** hoặc thực hiện và ghi chú kết quả |
| Task 6 | Chụp ảnh sau sửa | Upload ảnh card sau khi hoàn thành |
| Task 7 | Test cuối cùng | Ghi chú: "Card hoạt động ổn định, xuất hình OK" |

**Expected Outcome:**

- ✅ Mỗi task khi hoàn thành → Task tiếp theo tự động Pending
- ✅ Task 5 (không bắt buộc) có nút **"Skip"** - click để bỏ qua
- ✅ Progress bar cập nhật realtime sau mỗi task
- ✅ Tất cả ghi chú và ảnh được lưu vào timeline

---

### BƯỚC 6: Hoàn thành Task cuối cùng

**Thao tác:**

1. Tại Task 8 "Đóng gói sản phẩm", click **"Bắt đầu"**
2. Thực hiện đóng gói sản phẩm
3. Click **"Hoàn thành"**

**Expected Outcome:**

- ✅ Task 8 chuyển: In Progress → **Completed**
- ✅ Progress bar: **8/8 tasks completed (100%)**
- ✅ **Hệ thống TỰ ĐỘNG (Quy tắc #2):**

| Hành động | Chi tiết |
|-----------|----------|
| Cập nhật phiếu | Trạng thái: Pending → **ready_for_pickup** |
| Di chuyển kho | Serial ABC123456701: In-Service → **Customer Installed** |
| Gửi email | "Sản phẩm đã sửa xong" đến khách hàng |
| Ghi log | "05/02/2026 - Hoàn thành sửa chữa SV-2026-001" |

- ✅ Thông báo hiển thị: "✅ Phiếu hoàn thành! Sản phẩm sẵn sàng giao cho khách"

---

### BƯỚC 7: Kiểm tra Kết quả

**Thao tác:**

1. Xem lại phiếu SV-2026-001
2. Tra cứu serial ABC123456701
3. Kiểm tra tồn kho

**Expected Outcome:**

**A) Phiếu SV-2026-001:**

| Thông tin | Giá trị |
|-----------|---------|
| Trạng thái | **ready_for_pickup** (Sẵn sàng giao hàng) |
| Outcome | Repaired (Đã sửa xong) |
| Tasks | 8/8 completed (hoặc 7/8 nếu skip task 5) |
| Timeline | Đầy đủ ghi chú và ảnh của từng task |

**B) Serial ABC123456701:**

| Thông tin | Giá trị |
|-----------|---------|
| Vị trí | **Customer Installed** ✅ (đã chuyển về từ In-Service) |
| Trạng thái | Sẵn sàng giao cho khách |

**C) Tồn kho:**

| Kho | Trước | Sau |
|-----|-------|-----|
| In-Service | 1 | **0** |
| Customer Installed | 59 | **60** |

**D) Email đã gửi cho khách:**

- Subject: [SSTC] Sản phẩm đã sửa xong - Phiếu SV-2026-001
- Nội dung: Thông báo sản phẩm sẵn sàng, link xác nhận phương thức nhận hàng

---

## 8.7. Luồng Test 5: Duyệt đổi sản phẩm mới (Warranty Replacement)

**Mục tiêu:** Kiểm tra quy trình RMA và thay thế sản phẩm khi không sửa được

**Tham khảo:**

- [Section 3.3 - Quy trình RMA](./03-quy-trinh-nghiep-vu-chinh.md#33-quy-trình-rma-return-merchandise-authorization)
- [Section 5.4 - Kịch bản 3: Bảo hành Đổi trả](./03-quy-trinh-nghiep-vu-chinh.md#54-kịch-bản-3-bảo-hành-đổi-trả-warranty-replacement)

**Vai trò thực hiện:** Technician (chẩn đoán), Manager (duyệt RMA)

**Giả định:** Tạo phiếu bảo hành mới, Kỹ thuật viên chẩn đoán → Không sửa được, cần đổi mới

**Tự động hóa:**
- [Quy tắc #4](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động): Sản phẩm lỗi tự động chuyển In-Service → Dead Stock
- [Quy tắc #5](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động): Sản phẩm thay thế tự động chuyển Main → Customer Installed

---

### BƯỚC 1: Tạo phiếu bảo hành mới (Chuẩn bị)

**Thao tác:**

1. Lặp lại Luồng Test 3 với serial khác: **ABC123456702**
2. Tạo Service Request và chuyển thành Service Ticket: **SV-2026-002**

**Expected Outcome:**

- ✅ Service Ticket SV-2026-002 được tạo
- ✅ Serial ABC123456702 chuyển: Customer Installed → **In-Service**
- ✅ Tồn kho: Customer Installed: 60 → 59, In-Service: 0 → 1

---

### BƯỚC 2: Technician đánh dấu "Không sửa được"

**Thao tác:**

1. Đăng nhập với vai trò **"Technician"**
2. Vào phiếu **SV-2026-002**
3. Thực hiện một số tasks chẩn đoán (Task 1-3)
4. Kết luận: **Card hỏng nặng, chip GPU chết, không sửa được**
5. Click nút **"Báo cáo kết quả"**
6. Chọn Outcome: **"Unrepairable"** (Không sửa được)
7. Nhập lý do chi tiết: "Chip GPU hỏng hoàn toàn, không thể khắc phục. Đề xuất thay thế sản phẩm mới theo bảo hành."
8. Click **"Submit để Manager review"**

**Expected Outcome:**

- ✅ Phiếu SV-2026-002 chuyển trạng thái: Pending → **awaiting_approval**
- ✅ Outcome được lưu: Unrepairable
- ✅ Lý do chi tiết được ghi vào timeline
- ✅ Thông báo gửi đến Manager: "Phiếu SV-2026-002 cần duyệt"
- ✅ Serial ABC123456702 vẫn ở **In-Service** (chờ Manager quyết định)

---

### BƯỚC 3: Manager xem xét và duyệt đổi mới

**Thao tác:**

1. Đăng nhập với vai trò **"Manager"**
2. Vào **"Phiếu chờ duyệt"** hoặc Dashboard thông báo
3. Click vào phiếu **SV-2026-002**
4. Xem kết quả chẩn đoán của Technician:
   - Outcome: Unrepairable
   - Lý do: "Chip GPU hỏng hoàn toàn..."
   - Ảnh và ghi chú từ các tasks đã thực hiện
5. Kiểm tra tình trạng bảo hành: ✅ Còn hiệu lực
6. Quyết định: **"Warranty Replacement"** (Đổi sản phẩm mới)
7. Click nút **"Duyệt đổi mới"**

**Expected Outcome:**

- ✅ Form "Chọn sản phẩm thay thế" hiển thị
- ✅ Hệ thống hiển thị thông tin:
  - Sản phẩm lỗi: ZOTAC RTX 4090 (ABC123456702)
  - Tình trạng BH: Còn hiệu lực ✅
  - Quyết định: Warranty Replacement

---

### BƯỚC 4: Chọn sản phẩm thay thế

**Thao tác:**

1. Tại form "Chọn sản phẩm thay thế":
   - **Kho nguồn**: Kho Chính (Main)
   - **Sản phẩm**: ZOTAC RTX 4090 24GB
   - **Số lượng khả dụng**: 40 cái ✅

2. Hệ thống hiển thị danh sách serials khả dụng:
   ```
   ⚪ ABC123456761 (New, BH: 04/02/2029)
   ⚪ ABC123456762 (New, BH: 04/02/2029)
   ⚪ ABC123456763 (New, BH: 04/02/2029)
   ... (37 serials khác)
   ```

3. Chọn serial thay thế: **ABC123456761**
4. Click **"Xác nhận thay thế"**

**Expected Outcome:**

- ✅ Hệ thống TỰ ĐỘNG thực hiện:

| Bước | Hành động | Chi tiết |
|------|-----------|----------|
| A | Sản phẩm LỖI di chuyển (Quy tắc #4) | ABC123456702: In-Service → **Dead Stock** |
| B | Sản phẩm THAY THẾ di chuyển (Quy tắc #5) | ABC123456761: Main → **Customer Installed** |
| C | Tạo Stock Issue | Phiếu xuất kho thay thế |
| D | Link serial thay thế | ABC123456761 gán vào phiếu SV-2026-002 |
| E | Đánh dấu outcome | "Warranty Replacement" |
| F | Cập nhật tồn kho | Main: 40 → 39, Dead Stock: 0 → 1 |

- ✅ Hiển thị thông báo: "✅ Đã xác nhận thay thế sản phẩm"
- ✅ Phiếu SV-2026-002 cập nhật:
  - Serial cũ (lỗi): ABC123456702 → Dead Stock
  - Serial mới (thay thế): ABC123456761 → Sẵn sàng giao khách

---

### BƯỚC 5: Tạo RMA Batch (để gửi về hãng)

**Thao tác:**

1. Manager vào menu **"Quản lý RMA"** → **"Tạo RMA Batch"**
2. Click **"Tạo lô RMA mới"**
3. Chọn sản phẩm lỗi cần gửi về hãng:
   - ☑ ABC123456702 (ZOTAC RTX 4090, Lỗi: Chip GPU hỏng)
4. Nhập thông tin lô:
   - **Nhà cung cấp/Hãng**: ZOTAC Technology
   - **Ghi chú**: "RMA theo bảo hành hãng, phiếu SV-2026-002"
5. Click **"Xác nhận tạo lô RMA"**

**Expected Outcome:**

- ✅ RMA Batch được tạo:

| Thông tin | Giá trị |
|-----------|---------|
| Mã lô | **RMA-20260205-001** |
| Trạng thái | Pending (Chưa gửi) |
| Sản phẩm | 1 cái (ABC123456702) |
| Hãng | ZOTAC Technology |

- ✅ **Hệ thống TỰ ĐỘNG (Quy tắc #6):**
  - Serial ABC123456702 chuyển: Dead Stock → **RMA Staging**

- ✅ Tồn kho cập nhật:
  - Dead Stock: 1 → 0
  - RMA Staging: 0 → 1

---

### BƯỚC 6: Giao sản phẩm thay thế cho khách

**Thao tác:**

1. Reception/Manager vào phiếu **SV-2026-002**
2. Phiếu hiển thị:
   - Trạng thái: ready_for_pickup
   - Serial thay thế: ABC123456761 (Sẵn sàng giao)
3. Khi khách đến nhận:
   - Kiểm tra thông tin khách hàng
   - In biên nhận giao hàng với serial mới: ABC123456761
4. Khách ký nhận
5. Click **"Xác nhận đã giao hàng"**
6. Nhập: Người nhận, CMND/CCCD, Thời gian

**Expected Outcome:**

- ✅ Phiếu SV-2026-002 chuyển: ready_for_pickup → **Completed**
- ✅ Biên nhận giao hàng in ra với:
  - Serial mới: ABC123456761
  - Thông tin bảo hành mới (3 năm hãng + 4 năm công ty)
- ✅ Email xác nhận gửi khách:
  - "Đã hoàn tất bảo hành, sản phẩm thay thế: ABC123456761"

---

### BƯỚC 7: Kiểm tra Kết quả

**Thao tác:**

1. Xem phiếu SV-2026-002
2. Tra cứu serial ABC123456702 (sản phẩm lỗi)
3. Tra cứu serial ABC123456761 (sản phẩm thay thế)
4. Kiểm tra tồn kho

**Expected Outcome:**

**A) Phiếu SV-2026-002:**

| Thông tin | Giá trị |
|-----------|---------|
| Trạng thái | **Completed** |
| Outcome | **Warranty Replacement** |
| Serial cũ | ABC123456702 (ở RMA Staging) |
| Serial mới | ABC123456761 (đã giao khách) |

**B) Serial ABC123456702 (Sản phẩm lỗi):**

| Thông tin | Giá trị |
|-----------|---------|
| Vị trí | **RMA Staging** |
| Trạng thái | Chờ gửi về hãng |
| RMA Batch | RMA-20260205-001 |

**C) Serial ABC123456761 (Sản phẩm thay thế):**

| Thông tin | Giá trị |
|-----------|---------|
| Vị trí | **Customer Installed** |
| Chủ sở hữu | Nguyễn Văn A |
| Giao theo phiếu | SV-2026-002 |

**D) Tồn kho cuối cùng:**

| Kho | Số lượng |
|-----|----------|
| Main (Kho Chính) | **39** (giảm 1 vì xuất thay thế) |
| Customer Installed | **60** |
| RMA Staging | **1** (ABC123456702) |

---

## 8.8. Luồng Test 6: Quy trình RMA gửi sản phẩm hư về nhà máy

**Mục tiêu:** Kiểm tra quy trình gửi sản phẩm lỗi về nhà máy và nhận hàng thay thế

**Tham khảo:** [Section 3.3.2 - Quy trình RMA Chi tiết](./03-quy-trinh-nghiep-vu-chinh.md#332-quy-trình-rma-chi-tiết)

**Vai trò thực hiện:** Manager

**Tiếp tục từ Test 5:** Đã có sản phẩm lỗi ABC123456702 trong RMA Staging

---

### BƯỚC 1: Xem RMA Batch

**Thao tác:**

1. Đăng nhập với vai trò **"Manager"**
2. Vào menu **"Quản lý RMA"** → **"Danh sách RMA Batches"**
3. Click vào lô **RMA-20260205-001**

**Expected Outcome:**

- ✅ Danh sách RMA Batches hiển thị:

| Mã lô | Trạng thái | Số lượng | Hãng | Ngày tạo |
|-------|------------|----------|------|----------|
| RMA-20260205-001 | Pending | 1 cái | ZOTAC | 05/02/2026 |

- ✅ Chi tiết lô RMA-20260205-001:

| Thông tin | Giá trị |
|-----------|---------|
| Serial | ABC123456702 |
| Sản phẩm | ZOTAC RTX 4090 24GB |
| Lý do RMA | "Chip GPU hỏng" |
| Phiếu BH gốc | SV-2026-002 |
| Vị trí hiện tại | RMA Staging |

---

### BƯỚC 2: In Phiếu RMA

**Thao tác:**

1. Tại chi tiết lô RMA-20260205-001
2. Click nút **"In phiếu RMA"**
3. Kiểm tra nội dung phiếu

**Expected Outcome:**

- ✅ Phiếu RMA hiển thị đầy đủ:

```
┌──────────────────────────────────────┐
│     PHIẾU RMA - GỬI VỀ NHÀ MÁY      │
├──────────────────────────────────────┤
│ Mã lô: RMA-20260205-001              │
│ Ngày tạo: 05/02/2026                 │
│                                      │
│ GỬI ĐẾN:                             │
│ ZOTAC Technology Ltd.                │
│ [Địa chỉ nhà cung cấp]               │
│                                      │
│ DANH SÁCH SẢN PHẨM:                  │
│ 1. ZOTAC RTX 4090 24GB               │
│    Serial: ABC123456702              │
│    Lý do: Chip GPU hỏng hoàn toàn    │
│    Phiếu BH: SV-2026-002             │
│                                      │
│ YÊU CẦU: Đổi sản phẩm mới            │
│                                      │
│ Chữ ký người gửi: ____________       │
│ Ngày gửi: ___/___/______             │
└──────────────────────────────────────┘
```

- ✅ Có thể in phiếu để đính kèm khi gửi hàng

---

### BƯỚC 3: Đóng gói và Chuẩn bị Gửi hàng

**Thao tác:**

1. Lấy sản phẩm lỗi ABC123456702 từ RMA Staging
2. Đóng gói sản phẩm theo quy cách
3. Đính kèm phiếu RMA đã in
4. Chuẩn bị gửi qua đơn vị vận chuyển

**Expected Outcome:**

- ✅ Sản phẩm được đóng gói đúng quy cách
- ✅ Phiếu RMA đính kèm trong kiện hàng
- ✅ Sẵn sàng gửi đi

---

### BƯỚC 4: Cập nhật Trạng thái "Đã gửi"

**Thao tác:**

1. Quay lại hệ thống, vào lô **RMA-20260205-001**
2. Click nút **"Đánh dấu đã gửi"**
3. Nhập thông tin vận chuyển:
   - **Tracking number**: VN1234567890
   - **Đơn vị vận chuyển**: GHTK / GHN / Viettel Post
   - **Ngày gửi**: 05/02/2026
   - **Dự kiến nhận**: 15/02/2026 (10 ngày)
4. Click **"Xác nhận"**

**Expected Outcome:**

- ✅ Lô RMA-20260205-001 chuyển: Pending → **Shipped** (Đã gửi)
- ✅ Thông tin vận chuyển được lưu:

| Thông tin | Giá trị |
|-----------|---------|
| Tracking number | VN1234567890 |
| Ngày gửi | 05/02/2026 |
| Dự kiến nhận | 15/02/2026 |

- ✅ Serial ABC123456702 đánh dấu: **Đã gửi về hãng** (ra khỏi hệ thống kho)
- ✅ Tồn kho: RMA Staging: 1 → 0

---

### BƯỚC 5: Nhận hàng Thay thế từ Hãng

**Thao tác:**

*(Giả lập sau 10 ngày, ngày 15/02/2026)*

1. Nhận 1 sản phẩm mới từ ZOTAC Technology
2. Kiểm tra: Serial mới **ZTC999888777**
3. Vào menu **"Quản lý Kho"** → **"Nhập Kho"**
4. Tạo Stock Receipt:
   - **Loại nhập**: RMA Return (Trả về từ hãng)
   - **Sản phẩm**: ZOTAC RTX 4090 24GB
   - **Serial**: ZTC999888777
   - **Kho đích**: Main (Kho Chính)
   - **Link với RMA Batch**: RMA-20260205-001
   - **Thông tin BH**: Nhập theo thông tin trên sản phẩm mới
5. Click **"Xác nhận nhập kho"**

**Expected Outcome:**

- ✅ Stock Receipt được tạo:

| Thông tin | Giá trị |
|-----------|---------|
| Mã phiếu | SR-2026-002 |
| Loại | RMA Return |
| Serial | ZTC999888777 |
| Kho đích | Main |
| Link RMA | RMA-20260205-001 |

- ✅ Sản phẩm mới ZTC999888777 được nhập vào **Kho Chính (Main)**
- ✅ Tồn kho: Main: 39 → **40**

---

### BƯỚC 6: Hoàn tất RMA Batch

**Thao tác:**

1. Vào lô **RMA-20260205-001**
2. Click nút **"Đánh dấu hoàn tất"**
3. Nhập thông tin:
   - **Serial nhận được**: ZTC999888777
   - **Ngày nhận**: 15/02/2026
   - **Ghi chú**: "Đã nhận hàng thay thế từ ZOTAC, nhập kho Main"
4. Click **"Xác nhận hoàn tất"**

**Expected Outcome:**

- ✅ Lô RMA-20260205-001 chuyển: Shipped → **Completed** (Hoàn tất)
- ✅ Thông tin hoàn tất được lưu:

| Thông tin | Giá trị |
|-----------|---------|
| Serial gửi đi | ABC123456702 |
| Serial nhận về | ZTC999888777 |
| Ngày hoàn tất | 15/02/2026 |
| Trạng thái | Completed ✅ |

---

### BƯỚC 7: Kiểm tra Kết quả

**Thao tác:**

1. Xem chi tiết lô RMA-20260205-001
2. Tra cứu serial ZTC999888777 (sản phẩm mới nhận)
3. Kiểm tra tồn kho

**Expected Outcome:**

**A) RMA Batch RMA-20260205-001:**

| Thông tin | Giá trị |
|-----------|---------|
| Trạng thái | **Completed** ✅ |
| Serial gửi | ABC123456702 (đã gửi về hãng) |
| Serial nhận | ZTC999888777 (đã nhập kho) |
| Thời gian | 05/02 → 15/02/2026 (10 ngày) |

**B) Serial ABC123456702 (Sản phẩm lỗi):**

| Thông tin | Giá trị |
|-----------|---------|
| Trạng thái | **Đã gửi về hãng** |
| RMA Batch | RMA-20260205-001 |
| Không còn trong hệ thống kho | ✅ |

**C) Serial ZTC999888777 (Sản phẩm mới từ hãng):**

| Thông tin | Giá trị |
|-----------|---------|
| Vị trí | **Main (Kho Chính)** |
| Trạng thái | New (Mới) |
| Nguồn | RMA Return từ ZOTAC |
| Sẵn sàng | Có thể dùng thay thế cho khách tiếp theo |

**D) Tồn kho cuối cùng:**

| Kho | Số lượng | Ghi chú |
|-----|----------|---------|
| Main (Kho Chính) | **40** | +1 (ZTC999888777 từ RMA) |
| Customer Installed | **60** | Không đổi |
| In-Service | **0** | Không đổi |
| Dead Stock | **0** | Không đổi |
| RMA Staging | **0** | ABC123456702 đã gửi đi |

---

## 8.9. Tổng hợp 7 Luồng Test

### Bảng Tóm tắt

| # | Luồng Test | Section tham khảo | Vai trò | Kết quả chính |
|---|------------|-------------------|---------|---------------|
| **0** | Thêm sản phẩm mới | [1.3](./03-quy-trinh-nghiep-vu-chinh.md#13-các-module-chính) | Manager/Admin | Sản phẩm xuất hiện trong catalog, sẵn sàng nhập kho |
| **1** | Nhập kho 100 cái | [4.3](./03-quy-trinh-nghiep-vu-chinh.md#43-quy-trình-nhập-kho-stock-receipt) | Manager/Reception | Kho Chính: +100, Serial tracking hoạt động |
| **2** | Xuất bán 60 cái | [4.7](./03-quy-trinh-nghiep-vu-chinh.md#47-quy-trình-bán-hàng--mới) | Reception/Manager | Main: 40, Customer: 60, Auto di chuyển kho |
| **3** | Tạo yêu cầu BH | [2.2](./03-quy-trinh-nghiep-vu-chinh.md#22-bước-1-khách-hàng-tạo-yêu-cầu-dịch-vụ-service-request), [2.3](./03-quy-trinh-nghiep-vu-chinh.md#23-bước-2-lễ-tân-xem-xét-và-chuyển-đổi-yêu-cầu) | Khách hàng, Reception | SR + Ticket tạo thành công, Auto xác minh BH |
| **4** | Thực hiện tasks | [2.4](./03-quy-trinh-nghiep-vu-chinh.md#24-bước-3-kỹ-thuật-viên-thực-hiện-công-việc) | Technician | Workflow tuần tự, Auto chuyển trạng thái |
| **5** | Đổi sản phẩm mới | [3.3](./03-quy-trinh-nghiep-vu-chinh.md#33-quy-trình-rma-return-merchandise-authorization), [5.4](./03-quy-trinh-nghiep-vu-chinh.md#54-kịch-bản-3-bảo-hành-đổi-trả-warranty-replacement) | Technician, Manager | Main: 39, Thay thế thành công, Auto di chuyển 3 kho |
| **6** | RMA về hãng | [3.3.2](./03-quy-trinh-nghiep-vu-chinh.md#332-quy-trình-rma-chi-tiết) | Manager | RMA Completed, Nhận hàng từ hãng |

### Quy tắc Di chuyển Kho Tự động Đã Test

| Quy tắc | Mô tả | Test |
|---------|-------|------|
| #1 | Tạo Ticket → Customer Installed → In-Service | Test 3 |
| #2 | Hoàn thành sửa → In-Service → Customer Installed | Test 4 |
| #4 | Duyệt đổi mới → In-Service → Dead Stock | Test 5 |
| #5 | Chọn SP thay thế → Main → Customer Installed | Test 5 |
| #6 | Tạo RMA Batch → Dead Stock → RMA Staging | Test 5 |
| #7 | Bán hàng → Main → Customer Installed | Test 2 |
| #8 | Nhập kho → Main | Test 1, Test 6 |

### Checklist Hoàn thành Demo

- [ ] **Test 0:** Thêm sản phẩm mới vào catalog
- [ ] **Test 1:** Nhập kho 100 sản phẩm thành công
- [ ] **Test 2:** Xuất bán 60 sản phẩm, hóa đơn in OK
- [ ] **Test 3:** Tạo SR từ portal, chuyển thành Ticket
- [ ] **Test 4:** Technician hoàn thành workflow tasks
- [ ] **Test 5:** Warranty Replacement hoạt động
- [ ] **Test 6:** RMA cycle hoàn chỉnh

---

**Liên hệ hỗ trợ:**
- Email: support@sstc.vn
- Hotline: 1900-xxxx

---

_Tài liệu này được tạo cho: Công ty Cổ phần Công nghệ SSTC_
_Ngày cập nhật: 2026-02-04_
_Phiên bản: 3.0 - Consolidated with Step-by-Step Expected Outcomes_
