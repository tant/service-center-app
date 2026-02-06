# 8. KỊCH BẢN TEST CHO DEMO

> **Tham chiếu:** [Tài liệu Quy trình Nghiệp vụ Chính](./03-quy-trinh-nghiep-vu-chinh.md)
> **Mục tiêu:** Khách hàng có thể thực hiện từng bước test và kiểm tra kết quả tại mỗi bước
> **Phiên bản:** 5.0

---

## MỤC LỤC

1. [Giới thiệu](#81-giới-thiệu)
   - [Kiến trúc Kho trong Hệ thống](#811-kiến-trúc-kho-trong-hệ-thống)
2. [[TC-CAT-001] Luồng Test 0: Thêm sản phẩm mới vào danh mục](#82-tc-cat-001-luồng-test-0-thêm-sản-phẩm-mới-vào-danh-mục-product-catalog)
3. [[TC-INV-001] Luồng Test 1: Nhập kho hàng mới (100 cái)](#83-tc-inv-001-luồng-test-1-nhập-kho-hàng-mới-100-cái)
4. [[TC-CUS-001] Luồng Test 1B: Tạo khách hàng mới](#84-tc-cus-001-luồng-test-1b-tạo-khách-hàng-mới-customer-management)
5. [[TC-INV-002] Luồng Test 1C: Chuyển kho thủ công *(OPTIONAL)*](#85-tc-inv-002-luồng-test-1c-chuyển-kho-thủ-công-từ-kho-chính-sang-kho-bảo-hành-optional)
6. [[TC-SALE-001] Luồng Test 2: Xuất bán cho khách (60 cái)](#86-tc-sale-001-luồng-test-2-xuất-bán-cho-khách-60-cái)
7. [[TC-WRN-001] Luồng Test 3: Tạo yêu cầu bảo hành](#87-tc-wrn-001-luồng-test-3-tạo-yêu-cầu-bảo-hành-từ-serial-đã-bán)
8. [[TC-WRN-002] Luồng Test 4: Kỹ thuật viên thực hiện tasks](#88-tc-wrn-002-luồng-test-4-kỹ-thuật-viên-thực-hiện-tasks-trong-phiếu-bảo-hành)
9. [[TC-WRN-003] Luồng Test 5A: Hết BH → Trả lại khách](#89-tc-wrn-003-luồng-test-5a-hết-bảo-hành-không-sửa-được--trả-lại-khách)
10. [[TC-WRN-004] Luồng Test 5B: Còn BH → Đổi mới](#810-tc-wrn-004-luồng-test-5b-còn-bảo-hành-không-sửa-được--đổi-mới-warranty-replacement)
11. [[TC-RMA-001] Luồng Test 6: Quy trình RMA](#811-tc-rma-001-luồng-test-6-quy-trình-rma-gửi-sản-phẩm-hư-về-nhà-máy)
12. [Negative Test Cases (TC-NEG-001 → TC-CONC-001)](#812-negative-test-cases-kiểm-tra-trường-hợp-lỗi--biên)
13. [Tổng hợp](#813-tổng-hợp-10-luồng-test)

---

## 📝 ISSUES TỔNG HỢP (Ngoài Test Cases)

> Section này ghi nhận các issue phát hiện trong quá trình test nhưng không thuộc test case cụ thể nào.

| # | Loại | Mô tả | Mức độ | Status |
|---|------|-------|--------|--------|
| 1 | UI | Remove "Phiếu nhập kho / Phiếu điều chỉnh (kiểm kê)" | Medium | Open |
| 2 | UI | Hide Workflows module | Medium | Open |
| 3 | UI/Feature | **Hide tất cả features liên quan đến Linh kiện (Parts):**<br>🚫 **Cần ẩn:**<br>- Menu "Danh mục linh kiện" (Parts Catalog)<br>- Kho ảo "Kho Linh kiện" (`parts`) trong danh sách kho<br>- Trường/cột "Linh kiện" trong các form và bảng<br>- Báo cáo/màn hình liên quan đến linh kiện<br>- Options chọn kho linh kiện trong dropdown<br>- Tab/section linh kiện trong các màn hình quản lý kho<br>✅ **Yêu cầu:**<br>- Không xóa dữ liệu, chỉ ẩn UI/UX<br>- Backend vẫn giữ logic để có thể enable lại sau<br>- Kiểm tra toàn bộ hệ thống để đảm bảo không còn references | Medium | Open |
| 4 | UI | Remove "Phiếu xuất điều chỉnh (kiểm kê)" | Medium | Open |
| 6 | UI | **Trang Tổng quan Kho hàng:**<br>- Chỉ hiển thị các cột: **Sản phẩm, SKU, Tồn kho, Xem chi tiết**<br>- Remove card cảnh báo | Medium | Open |
| 7 | UI/UX Bug | **Panel di chuyển theo chuột và nhấp nháy:**<br>🐛 **Hiện tượng:**<br>- Panel/popover/tooltip di chuyển theo con trỏ chuột<br>- Panel xuất hiện và biến mất liên tục (flickering) khi nhập dữ liệu<br>- Ảnh hưởng đến các trường input trong panel<br>🔍 **Nguyên nhân có thể:**<br>- Event listener không đúng (mousemove, mouseenter/leave)<br>- Z-index hoặc positioning conflicts<br>- Re-render không cần thiết khi typing<br>- Validation/tooltip trigger sai thời điểm<br>✅ **Yêu cầu fix:**<br>- Panel phải cố định vị trí khi đang mở<br>- Không re-position khi user đang tương tác với form fields<br>- Chỉ close panel khi user click outside hoặc click close button<br>- Test với tất cả các form có panel/popover/modal | High | Open |
| 21 | Bug | **Lỗi "URI too long" khi nhập số lượng lớn serial:**<br>🐛 **Hiện tượng:**<br>- Nhập ~500 serials vào phiếu → báo lỗi "URI too long"<br>📍 **Ảnh hưởng:**<br>- Phiếu nhập kho (Stock Receipt)<br>- Phiếu xuất kho (Stock Issue)<br>- Phiếu chuyển kho (Transfer)<br>- Lô RMA (RMA Batch)<br>🔍 **Nguyên nhân có thể:**<br>- API gửi danh sách serial qua URL params (GET) thay vì request body (POST/PUT)<br>- URL vượt quá giới hạn cho phép của browser/server<br>✅ **Yêu cầu fix:**<br>- Chuyển sang gửi data qua request body (POST/PUT)<br>- Kiểm tra và xác định số lượng serial tối đa được hỗ trợ<br>- Test với số lượng lớn: 500, 1000 serials | High | Open |

### ISSUES TỪ TEST CASES

> Issues phát hiện trong quá trình thực hiện từng bước test. Mỗi issue được ghi nhận tại bước test tương ứng.

| # | Test Case | Bước | Loại | Mô tả | Mức độ | Status |
|---|-----------|------|------|-------|--------|--------|
| 8 | TC-CAT-001 (Test 0) | Bước 2 | Feature | Thêm trường "Nhà cung cấp" vào form tạo sản phẩm | Medium | Open |
| 9 | TC-CAT-001 (Test 0) | Bước 3 | UI | Bỏ trường "Linh kiện liên quan" | Low | Open |
| 10 | TC-CAT-001 (Test 0) | Bước 5 | Feature | Cần thêm cảnh báo khi trùng tên sản phẩm (warning) và trùng SKU (block) | Medium | Open |
| 11 | TC-INV-001 (Test 1) | Bước 1 | Validation | Ngày nhập: Block future date, chỉ cho phép back date tối đa 7 ngày | Medium | Open |
| 12 | TC-INV-001 (Test 1) | Bước 1 | UI | Bỏ button "Bắt đầu nhập serial" | Medium | Open |
| 13 | TC-INV-001 (Test 1) | Bước 1 | UI | Bỏ "Nhập CSV" trong Nhập số Serial - Phiếu nhập | Low | Open |
| 14 | TC-INV-001 (Test 1) | Bước 1 | Validation | Cảnh báo khi số serial trùng với serial đã có trong hệ thống | High | Open |
| 15 | TC-INV-001 (Test 1) | Bước 1 | Feature | Thêm trường "Thời hạn bảo hành hãng" khi nhập phiếu nhập kho | **Critical** | **DONE** |
| 16 | TC-SALE-001 (Test 2) | Bước 1 | Validation | Ngày xuất: Block future date, chỉ cho phép back date tối đa 7 ngày (như phiếu nhập) | Medium | Open |
| 17 | TC-SALE-001 (Test 2) | Bước 1 | UI | Bỏ "Nhập CSV" trong chọn Serial - Phiếu xuất (như phiếu nhập) | Low | Open |
| 18 | TC-SALE-001 (Test 2) | Bước 2 | Note | Khi thêm thông tin người liên hệ trong phiếu xuất (bán hàng) thì thông tin người liên hệ tự được thêm vào danh sách customer | Info | Open |
| 19 | TC-SALE-001 (Test 2) | Bước 5 | Bug | Sau khi hoàn thành phiếu xuất, hàng chưa được chuyển qua Kho Hàng Bán | High | **DONE** |
| 20 | TC-SALE-001 (Test 2) | Bước 6 | Bug | Inventory cập nhật không đúng - Kho Hàng Bán = 0 thay vì 60 sau khi bán | **Critical** | Open |
| 22 | TC-CAT-001 (Test 0) | Bước 2 | Validation | Trường SKU khi tạo sản phẩm mới phải là bắt buộc (required) - hiện tại chưa enforce | Medium | Open |
| 23 | TC-CAT-001 (Test 0) | Bước 4 | UI | Bỏ cột "Linh kiện" trong màn hình Sản phẩm (danh sách & chi tiết) - liên quan Issue #3 | Medium | Open |
| 24 | TC-INV-001 (Test 1) | Bước 1 | UI | Bỏ trường "Loại phiếu" trong form Phiếu nhập kho | Medium | Open |
| 25 | TC-INV-001 (Test 1) | Bước 1 | UI | Dropdown "Lý do nhập kho" chỉ hiển thị: Nhập mua hàng, Nhập RMA về (ẩn các lý do khác) | Medium | Open |
| 26 | TC-INV-001 (Test 1) | Bước 1 | UI | Dropdown "Kho nhập" chỉ hiển thị: Kho Chính + Kho Bảo Hành (ẩn các kho khác) | Medium | Open |
| 27 | TC-INV-001 (Test 1) | Bước 1 | Bug | Trường số lượng: khi xóa số mặc định (1) thì hiển thị cứng số 0, cần cho phép xóa toàn bộ để nhập lại | Low | Open |
| 28 | TC-INV-001 (Test 1) | Bước 1 | UX | Trường ngày tháng: cho phép nhập tự do theo format dd/mm/yy, tự động thêm dấu `/` phân cách và hiển thị lịch theo best practice | Medium | Open |
| 29 | TC-WRN-004 (Test 5B) | Bước 4 | Feature | **Gán thời hạn bảo hành sản phẩm thay thế theo sản phẩm cũ:**<br>Khi đổi mới (Warranty Replacement), thời hạn bảo hành của sản phẩm thay thế phải được gán theo **ngày hết hạn bảo hành của sản phẩm cũ** (không tính lại từ đầu) | High | Open |

> **Tổng:** 29 issues (2 DONE, 27 Open)
> **Validation cho SĐT và Email** → Đã chuyển sang [Improvements & Feature Requests](./improvements-feature-requests.md)

---

## 8.1. Giới thiệu

Tài liệu này trình bày **10 luồng test chính** để demo hệ thống quản lý trung tâm bảo hành. Mỗi luồng test:

- ✅ Có các bước thực hiện rõ ràng (step-by-step)
- ✅ Có kết quả mong đợi (Expected Outcome) sau mỗi bước
- ✅ Có link tham chiếu đến quy trình nghiệp vụ chi tiết
- ✅ Đánh dấu các điểm tự động hóa của hệ thống

**Môi trường Test:**

| Thông tin | Giá trị |
|-----------|---------|
| URL | *[Điền URL staging/dev trước khi test]* |
| Browser | Chrome (latest) / Firefox (latest) |
| Ngày test | *[Điền ngày thực hiện]* |
| Người test | *[Điền tên QC]* |

**Tài khoản test:**

| Vai trò | Username | Password |
|---------|----------|----------|
| Admin/Manager | *[Điền trước khi test]* | *[Điền trước khi test]* |
| Reception | *[Điền trước khi test]* | *[Điền trước khi test]* |
| Technician | *[Điền trước khi test]* | *[Điền trước khi test]* |

**Cách sử dụng tài liệu:**

1. Thực hiện từng bước theo thứ tự
2. Kiểm tra "Expected Outcome" sau mỗi bước
3. Ghi nhận **Actual Result** và đánh dấu **Pass/Fail** vào bảng kết quả mỗi bước
4. Nếu kết quả không đúng (Fail), báo ngay để xử lý
5. Click vào link Section để xem chi tiết quy trình nghiệp vụ

**Mẫu ghi kết quả test (áp dụng cho mỗi bước):**

| # | Expected Outcome | Actual Result | Status | Ghi chú |
|---|-----------------|---------------|--------|---------|
| 1 | *(Copy từ Expected Outcome)* | *(Ghi kết quả thực tế)* | Pass / Fail / Blocked | *(Bug ID nếu Fail)* |

**Tóm tắt trạng thái kho sau khi hoàn thành tất cả test:**

> **Thứ tự chạy bắt buộc:** Test 0 → 1 → 1B → (1C tùy chọn) → 2 → 3 → 4 → 5A → 5B → 6
> Test 5A và 5B dùng serial khác nhau (703 và 702), có thể chạy độc lập nhưng bảng dưới giả định chạy tuần tự.

| Thời điểm | Kho Chính | Kho Hàng Bán | Kho Sửa Chữa | Kho Hàng Hỏng | Out of System | Ghi chú |
|-----------|-----------|-------------|--------------|---------------|---------------|---------|
| Sau Test 0 | 0 | 0 | 0 | 0 | 0 | Sản phẩm có trong catalog, chưa nhập kho |
| Sau Test 1 | 100 | 0 | 0 | 0 | 0 | |
| Sau Test 1B | 100 | 0 | 0 | 0 | 0 | Khách hàng đã tạo, chưa mua hàng |
| Sau Test 1C *(tùy chọn)* | 90 | 0 | 0 | 0 | 0 | +10 Kho Bảo Hành (không hiển thị trong bảng) |
| Sau Test 2 | 40 | 60 | 0 | 0 | 0 | |
| Sau Test 3 | 40 | 59 | 1 | 0 | 0 | Serial 701 → Kho Sửa Chữa |
| Sau Test 4 | 40 | 60 | 0 | 0 | 0 | Serial 701 sửa xong → về Kho Hàng Bán |
| Sau Test 5A | 40 | 60 | 0 | 0 | 0 | Serial 703 hết BH, trả lại KH → vẫn ở Kho Hàng Bán |
| Sau Test 5B | 39 | 60 | 0 | 1 | 0 | Serial 702 lỗi → Kho Hàng Hỏng; Serial 761 thay thế → Kho Hàng Bán |
| Sau Test 6 | 40 | 60 | 0 | 0 | 1 | Serial 702 gửi RMA (out); nhận serial ZTC999888777 → Kho Chính |

---

## 8.1.1. Kiến trúc Kho trong Hệ thống

### Cấu trúc 2 cấp kho

Hệ thống sử dụng **2 cấp kho**:
- **Kho vật lý (Physical Warehouse):** Vị trí lưu trữ thực tế (ví dụ: Kho Công ty, Chi nhánh Q1, Chi nhánh Q7...)
- **Kho ảo (Virtual Warehouse):** Phân loại trạng thái/mục đích của sản phẩm

Mỗi kho vật lý có 7 kho ảo tương ứng.

---

### 5 Loại Kho Ảo

| Tên Kho | Ý nghĩa | Khi nào TĂNG tồn kho | Khi nào GIẢM tồn kho |
|---------|---------|----------------------|---------------------|
| **Kho Chính** | Lưu trữ hàng mới nhập, sẵn sàng để bán hoặc chuyển sang kho bảo hành | • Nhập hàng từ nhà cung cấp (AUTO) | • Xuất bán cho khách hàng (AUTO)<br>• Chuyển sang Kho Bảo Hành (THỦ CÔNG) |
| **Kho Hàng Bán** | Theo dõi sản phẩm đã bán và đang sử dụng bởi khách hàng | • Tạo phiếu xuất bán hàng (AUTO) | • Tự động chuyển sang Kho Sửa Chữa khi tạo phiếu dịch vụ (AUTO) |
| **Kho Bảo Hành** | Lưu trữ hàng dự phòng để thay thế cho khách khi sản phẩm không sửa được | • Chuyển kho từ Kho Chính (THỦ CÔNG) | • Đổi sản phẩm mới cho khách (Warranty Replacement) (AUTO) |
| **Kho Sửa Chữa** | Lưu trữ sản phẩm đang trong quá trình bảo hành/sửa chữa | • Tạo phiếu dịch vụ thành công (AUTO)<br>• Hàng tự động chuyển từ Kho Hàng Bán | • Sửa xong: tự động chuyển về Kho Hàng Bán (AUTO)<br>• Không sửa được: tự động chuyển sang Kho Hàng Hỏng (AUTO) |
| **Kho Hàng Hỏng** | Lưu trữ sản phẩm không sửa được, chờ thanh lý hoặc xử lý | • Kết thúc phiếu dịch vụ với kết quả "Không sửa được" (AUTO)<br>• Hàng tự động chuyển từ Kho Sửa Chữa | • Tạo lô RMA (AUTO - ra khỏi hệ thống) |

> **Lưu ý quan trọng:**
> - Hầu hết các chuyển động giữa các kho ảo đều được hệ thống **TỰ ĐỘNG** thực hiện dựa trên workflow nghiệp vụ
> - **Chuyển động THỦ CÔNG duy nhất**: Chuyển kho từ Kho Chính → Kho Bảo Hành (phiếu chuyển kho thủ công)
> - **Không còn Kho Linh Kiện (Parts)** - đã được ẩn khỏi hệ thống
> - **Không còn Kho Chờ RMA (RMA Staging)** - Sản phẩm RMA trực tiếp ra khỏi hệ thống khi gửi về hãng

---

### Phân biệt: TRONG HỆ THỐNG vs RA KHỎI HỆ THỐNG

#### ✅ TRONG HỆ THỐNG (Đếm tồn kho)

**Định nghĩa:** Sản phẩm đang ở **một trong 5 kho ảo** bên trên, được tracking và đếm vào tổng tồn kho.

**Đặc điểm:**
- ✅ Serial có `warehouse_id` (thuộc 1 kho ảo cụ thể)
- ✅ Hiển thị trong báo cáo tồn kho
- ✅ Có thể tra cứu vị trí
- ✅ Đếm vào tổng: "Tổng tồn kho = X SP"

**Ví dụ:**
```
Serial ABC123456701:
  Warehouse: customer_installed
  Status: sold
  Customer: Nguyễn Văn A

→ VẪN TRONG HỆ THỐNG vì cần tracking bảo hành
→ Đếm vào tồn kho: Kho Hàng Bán = +1
```

**Lưu ý quan trọng:**
> **Hàng đã bán VẪN TÍNH TỒN KHO** vì doanh nghiệp cần:
> - Tracking để quản lý bảo hành
> - Biết serial đó thuộc khách nào
> - Kiểm tra warranty status
> - Theo dõi lịch sử service

---

#### ❌ RA KHỎI HỆ THỐNG (KHÔNG đếm tồn kho)

**Định nghĩa:** Sản phẩm **KHÔNG còn ở bất kỳ kho ảo nào**, không tracking vị trí, không đếm tồn kho.

**Đặc điểm:**
- ❌ Serial có `warehouse_id = NULL` hoặc `out_of_system`
- ❌ KHÔNG hiển thị trong báo cáo tồn kho
- ❌ KHÔNG đếm vào tổng tồn kho
- ✅ VẪN có lịch sử (history/audit log)
- ✅ VẪN tra cứu được "đã đi đâu, khi nào"

**Trường hợp duy nhất: RMA - Gửi về NSX**

```
Serial ABC123456702:
  Warehouse: NULL (hoặc out_of_system)
  Status: rma_sent
  RMA Batch: RMA-20260205-001

→ RA KHỎI HỆ THỐNG vì đã gửi cho ZOTAC
→ KHÔNG đếm tồn kho
→ VẪN có history để audit
```

**Lý do:**
- ❌ SP không còn ở công ty (đã gửi NSX)
- ❌ Không thể kiểm kê vật lý
- ❌ Không quay lại (NSX giữ, trả serial mới)

---

### So sánh: Hàng Bán vs Hàng RMA

| Đặc điểm | Hàng Bán | Hàng RMA |
|----------|----------|----------|
| **Warehouse** | `customer_installed` ✅ | `NULL` / `out_of_system` ❌ |
| **Đếm tồn kho?** | **CÓ** ✅ | **KHÔNG** ❌ |
| **Vật lý ở đâu?** | Nhà khách (vẫn track) | Nhà máy NSX (không track) |
| **Có quay lại?** | CÓ (khi bảo hành) | KHÔNG (NSX giữ) |
| **Lý do tracking** | Quản lý bảo hành | Audit/history only |
| **Serial mới** | Không | CÓ (nhận từ NSX) |

---

### Tóm tắt

```
┌─────────────────────────────────────────────────────┐
│        TRONG HỆ THỐNG (Đếm tồn kho)                 │
├─────────────────────────────────────────────────────┤
│ • Kho Chính                                  │
│ • Kho Bảo Hành                     │
│ • Kho Hàng Bán ← ✅ Vẫn đếm!   │
│ • Kho Sửa Chữa                             │
│ • Kho Hàng Hỏng                            │
│                                                     │
│ Tổng: 5 kho ảo                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│       RA KHỎI HỆ THỐNG (Không đếm tồn kho)          │
├─────────────────────────────────────────────────────┤
│ • RMA Sent (Đã gửi về NSX)                          │
│   → Không còn ở công ty                             │
│   → Không tracking vị trí (warehouse_id = NULL)    │
│   → Vẫn có history để audit                         │
│   → Khi tạo RMA: Kho Hàng Hỏng → NULL (out of system) │
└─────────────────────────────────────────────────────┘
```

---

## 8.2. [TC-CAT-001] Luồng Test 0: Thêm sản phẩm mới vào danh mục (Product Catalog)

**Mục tiêu:** Kiểm tra quy trình thêm sản phẩm mới vào danh mục trước khi có thể nhập kho

**Tham khảo:** [Section 1.3 - Các Module Chính](./03-quy-trinh-nghiep-vu-chinh.md#13-các-module-chính) - Quản lý Sản phẩm (catalog)

**Lưu ý:** Đây là bước chuẩn bị **BẮT BUỘC** trước khi thực hiện Test 1 (Nhập kho). Sản phẩm phải tồn tại trong catalog trước khi có thể nhập hàng vật lý.

---

### BƯỚC 1: Truy cập Quản lý Sản phẩm

**Thao tác:**

1. Đăng nhập hệ thống
2. Vào menu **"Danh mục Sản phẩm"**
3. Click nút **"Thêm Sản phẩm"**

**Expected Outcome:**

- ✅ Màn hình "Sản Phẩm" hiển thị
- ✅ Danh sách sản phẩm hiện có được hiển thị
- ✅ Nút "Thêm Sản Phẩm" hiển thị và có thể click
- ✅ Form "Thêm Sản Phẩm Mới" hiển thị sau khi click

---

### BƯỚC 2: Nhập Thông tin Cơ bản

**Thao tác:**

1. Tại form "Thêm Sản Phẩm Mới", nhập các thông tin cơ bản:
   - **Tên sản phẩm**: ZOTAC RTX 4090 24GB *(bắt buộc)*
   - **Mã sản phẩm (SKU)**: ZT-RTX4090-24G *(bắt buộc)*
   - **Thương hiệu**: ZOTAC *(bắt buộc)*
   - **Model**: ZT-D40900J-10P *(tùy chọn)*
   - **Loại sản phẩm**: Card đồ họa / Graphics Card *(bắt buộc)*
   - **Mô tả**: "Card đồ họa ZOTAC Gaming GeForce RTX 4090 24GB GDDR6X" *(tùy chọn)*
   - **Đường dẫn hình ảnh**: URL hoặc upload ảnh sản phẩm *(tùy chọn)*

**Expected Outcome:**

- ✅ Form hiển thị đầy đủ các trường thông tin
- ✅ Các trường bắt buộc được đánh dấu (*)
- ✅ Dropdown "Thương hiệu" hiển thị danh sách brands
- ✅ Dropdown "Loại sản phẩm" hiển thị danh sách các loại sản phẩm
- ✅ Validation realtime khi nhập liệu

> 📋 **Issue #8** - Xem [ISSUES TỔNG HỢP](#-issues-tổng-hợp-ngoài-test-cases)

---

### BƯỚC 3: Lưu Sản phẩm

**Thao tác:**

1. Kiểm tra lại toàn bộ thông tin:
   - Tên: ZOTAC RTX 4090 24GB
   - SKU: ZT-RTX4090-24G
   - Thương hiệu: ZOTAC
   - Model: ZT-D40900J-10P
   - Loại sản phẩm: Card đồ họa
2. Click nút **"Tạo Sản phẩm"**
3. Sản phẩm được tạo thành công và sản phẩm mới được hiển thị đầu tiên trên màn hình Sản Phẩm

**Expected Outcome:**

- ✅ Hệ thống validation toàn bộ form
- ✅ Kiểm tra trùng SKU (nếu trùng → báo lỗi)
- ✅ Kiểm tra trùng tên sản phẩm (nếu trùng → cảnh báo, cho phép tiếp tục)
- ✅ Hiển thị thông báo: "✅ Đã tạo sản phẩm thành công"

> 📋 **Issue #10** - Xem [ISSUES TỔNG HỢP](#-issues-tổng-hợp-ngoài-test-cases)

- ✅ Sản phẩm xuất hiện trong danh mục với:

| Thông tin | Giá trị |
|-----------|---------|
| Tên | ZOTAC RTX 4090 24GB |
| SKU | ZT-RTX4090-24G |
| Thương hiệu | ZOTAC |
| Loại | Card đồ họa |

---

### BƯỚC 4: Kiểm tra Kết quả

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
| Model | ZT-D40900J-10P |
| Loại sản phẩm | Card đồ họa |
| Tồn kho hiện tại | 0 cái |
| Số lượng đã bán | 0 cái |

**C) Sẵn sàng cho Nhập kho:**

- ✅ Khi vào "Quản lý Kho" → "Nhập Kho" → Chọn sản phẩm
- ✅ Dropdown hiển thị: "ZOTAC RTX 4090 24GB (ZT-RTX4090-24G)"
- ✅ Có thể chọn sản phẩm này để nhập kho (Test 1)

---

### Các trường hợp Test bổ sung

**A) Sửa thông tin sản phẩm:**

1. Vào chi tiết sản phẩm → Click **"Sửa"**
2. Thay đổi thông tin cần thiết
3. Lưu → Thông tin được cập nhật

---

## 8.3. [TC-INV-001] Luồng Test 1: Nhập kho hàng mới (100 cái)

**Điều kiện tiên quyết:** Đã hoàn thành Test 0 - Sản phẩm "ZOTAC RTX 4090 24GB" đã tồn tại trong danh mục

**Mục tiêu:** Kiểm tra quy trình nhập kho với serial number tracking

**Tham khảo:** [Section 4.3 - Quy trình Nhập Kho](./03-quy-trinh-nghiep-vu-chinh.md#43-quy-trình-nhập-kho-stock-receipt)

---

### BƯỚC 1: Tạo Phiếu Nhập Kho

**Thao tác:**

1. Đăng nhập hệ thống
2. Vào menu **"Tổng quan Kho hàng"** / **"Phiếu xuất nhập kho"**
3. Click nút **"Tạo Phiếu Nhập"**
4. Chọn **Lý do nhập kho** *(bắt buộc)*
5. Chọn **Kho vật lý đích** muốn nhập hàng *(bắt buộc)*
6. **Ngày nhập** *(bắt buộc)*
7. Nhập **Ghi chú**: "Nhập hàng mới theo PO-2026-001" *(tùy chọn)*
8. Click **"Thêm sản phẩm"**, chọn sản phẩm tương ứng từ dropdown danh sách sản phẩm và điền số lượng tương ứng
   > Có thể thêm nhiều sản phẩm khác nhau trong cùng 1 phiếu nhập
9. Click **"Tạo phiếu nhập"**
10. Hệ thống hiển thị thông báo đã tạo phiếu nhập thành công và auto chuyển sang màn hình phiếu nhập vừa tạo

**Expected Outcome:**

- ✅ Form "Tạo Phiếu Nhập" hiển thị đầy đủ các trường thông tin
- ✅ Dropdown "Lý do nhập kho" hiển thị các lựa chọn
- ✅ Dropdown "Kho vật lý đích" hiển thị danh sách kho
- ✅ Dropdown sản phẩm hiển thị danh sách sản phẩm từ catalog
- ✅ Có thể thêm nhiều sản phẩm khác nhau vào phiếu
- ✅ Phiếu nhập được tạo thành công, chuyển sang màn hình chi tiết phiếu

> 📋 **Issues #11-15, #24-28** - Xem [ISSUES TỔNG HỢP](#-issues-tổng-hợp-ngoài-test-cases)
> **DONE (Issue #15, 2026-02-05):** Đã thêm warranty fields trong serial input drawer. Sử dụng DatePicker (dd/mm/yyyy), có thể áp dụng cho tất cả serials cùng lúc.

---

### BƯỚC 2: Nhập Serial Numbers và Thông tin Bảo hành

**Thao tác:**

1. Tại màn hình chi tiết phiếu nhập vừa tạo, click **"Thêm serial"**
2. Nhập danh sách serials (mỗi serial một dòng):
   ```
   ABC123456701
   ABC123456702
   ABC123456703
   ...
   ABC123456800
   ```
   *(Tổng cộng 100 serials từ 701-800)*
3. Nhập thông tin thời hạn bảo hành cho serials
4. Click **"Xác nhận"**

**Expected Outcome:**

- ✅ Hệ thống kiểm tra và hiển thị: "100/100 serials hợp lệ"
- ✅ Không có serial trùng lặp
- ✅ Nếu có serial đã tồn tại trong hệ thống → Hiển thị cảnh báo đỏ
- ✅ Thông tin bảo hành được lưu cho từng serial
- ✅ Danh sách serial được lưu và sẵn sàng cho bước tiếp theo

---

### BƯỚC 3: Nhập Thông tin Bảo hành

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

### BƯỚC 4: Xác nhận Nhập Kho

**Thao tác:**

1. Kiểm tra lại thông tin tổng quan:
   - Sản phẩm: ZOTAC RTX 4090 24GB
   - Số lượng: 100 cái
   - Serials: ABC123456701 → ABC123456800
   - Kho đích: Kho Công ty → Kho Chính
2. Click nút **"Xác nhận Nhập Kho"**
3. Chờ hệ thống xử lý

**Expected Outcome:**

- ✅ Hiển thị loading indicator: "Đang xử lý nhập kho..."
- ✅ **Hệ thống TỰ ĐỘNG thực hiện:**
  1. Tạo 100 bản ghi Physical Product (mỗi serial một bản ghi)
  2. Gán mỗi sản phẩm vào Kho ảo "Kho Chính"
  3. Lưu thông tin bảo hành cho từng sản phẩm
  4. Cập nhật tồn kho: Kho Chính +100
  5. Ghi log: "04/02/2026 - Nhập 100 RTX 4090 từ ZOTAC Technology"
- ✅ Hiển thị thông báo thành công: "✅ Đã nhập kho thành công 100 sản phẩm"
- ✅ Phiếu nhập kho được lưu với mã: SR-2026-001 (Stock Receipt)

---

### BƯỚC 5: Kiểm tra Kết quả

**Thao tác:**

1. Vào menu **"Quản lý Kho"** → **"Xem Tồn Kho"**
2. Chọn kho: **Kho Công ty → Kho Chính**
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
| Kho | Kho Công ty → Kho Chính |
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
| Vị trí | Kho Công ty → Kho Chính |
| BH Hãng | 04/02/2026 → 04/02/2029 (còn 1095 ngày) 🟢 |
| BH Công ty | 04/02/2026 → 04/02/2030 (còn 1460 ngày) 🟢 |
| Lịch sử | 04/02/2026: Nhập kho (SR-2026-001) |

**C) Tổng kết:**

- ✅ 100 sản phẩm xuất hiện trong Kho Chính
- ✅ Mỗi serial có bản ghi riêng với thông tin đầy đủ
- ✅ Thông tin bảo hành chính xác (hãng: 3 năm, công ty: 4 năm)
- ✅ Tồn kho dashboard cập nhật: Kho Chính = 100
- ✅ Log nhập kho được ghi nhận đầy đủ

---

## 8.4. [TC-CUS-001] Luồng Test 1B: Tạo khách hàng mới (Customer Management)

**Mục tiêu:** Kiểm tra quy trình tạo và quản lý thông tin khách hàng trong hệ thống

**Lưu ý:** Đây là bước chuẩn bị trước khi thực hiện Test 2 (Xuất bán). Khách hàng cần tồn tại trong hệ thống để liên kết với đơn hàng và theo dõi bảo hành.

---

### BƯỚC 1: Truy cập Quản lý Khách hàng

**Thao tác:**

1. Đăng nhập hệ thống
2. Vào menu **"Quản lý Khách hàng"** → **"Danh sách Khách hàng"**
3. Click nút **"Thêm Khách hàng Mới"**

**Expected Outcome:**

- ✅ Màn hình "Danh sách Khách hàng" hiển thị
- ✅ Danh sách khách hàng hiện có (nếu có) được hiển thị
- ✅ Nút "Thêm Khách hàng Mới" hiển thị và có thể click
- ✅ Form "Tạo Khách hàng Mới" hiển thị sau khi click

---

### BƯỚC 2: Nhập Thông tin Khách hàng

**Thao tác:**

1. Tại form "Tạo Khách hàng Mới", nhập các thông tin:
   - **Họ tên**: Nguyễn Văn A *(bắt buộc)*
   - **Số điện thoại**: 0912345678 *(bắt buộc)*
   - **Email**: nguyenvana@email.com *(tùy chọn)*
   - **Địa chỉ**: 123 Nguyễn Văn Linh, Q7, TP.HCM *(tùy chọn)*
   - **Loại khách hàng**: Cá nhân / Doanh nghiệp *(bắt buộc)*
   - **Ghi chú**: "Khách hàng mới, mua số lượng lớn" *(tùy chọn)*

**Expected Outcome:**

- ✅ Form hiển thị đầy đủ các trường thông tin
- ✅ Các trường bắt buộc được đánh dấu (*)
- ✅ Validation realtime:
  - SĐT đúng định dạng (10-11 số, bắt đầu bằng 0)
  - Email đúng format (nếu có nhập)
- ✅ Dropdown "Loại khách hàng" hiển thị các lựa chọn

---

### BƯỚC 3: Lưu Khách hàng

**Thao tác:**

1. Kiểm tra lại toàn bộ thông tin:
   - Họ tên: Nguyễn Văn A
   - SĐT: 0912345678
   - Email: nguyenvana@email.com
   - Loại: Cá nhân
2. Click nút **"Lưu Khách hàng"**
3. Chờ hệ thống xử lý

**Expected Outcome:**

- ✅ Hệ thống validation toàn bộ form
- ✅ Kiểm tra trùng SĐT (nếu trùng → báo lỗi "Khách hàng với SĐT này đã tồn tại", hiển thị link đến KH cũ)
- ✅ Hiển thị thông báo: "✅ Đã tạo khách hàng thành công"
- ✅ Khách hàng xuất hiện trong danh sách với:

| Thông tin | Giá trị |
|-----------|---------|
| Họ tên | Nguyễn Văn A |
| SĐT | 0912345678 |
| Email | nguyenvana@email.com |
| Loại | Cá nhân |
| Trạng thái | Active |

---

### BƯỚC 4: Kiểm tra Kết quả

**Thao tác:**

1. Vào **"Danh sách Khách hàng"** → Tìm kiếm "Nguyễn Văn A" hoặc "0912345678"
2. Click vào khách hàng vừa tạo để xem chi tiết
3. Kiểm tra khách hàng có sẵn trong dropdown khi tạo phiếu xuất kho/bán hàng

**Expected Outcome:**

**A) Danh sách Khách hàng:**

- ✅ Khách hàng "Nguyễn Văn A" xuất hiện trong danh sách
- ✅ Có thể tìm kiếm bằng: Họ tên, SĐT, Email
- ✅ Hiển thị: Họ tên, SĐT, Email, Loại KH, Trạng thái

**B) Chi tiết Khách hàng:**

| Thông tin | Giá trị |
|-----------|---------|
| Họ tên | Nguyễn Văn A |
| SĐT | 0912345678 |
| Email | nguyenvana@email.com |
| Địa chỉ | 123 Nguyễn Văn Linh, Q7, TP.HCM |
| Loại | Cá nhân |
| Số đơn hàng | 0 (chưa mua hàng) |
| Số phiếu BH | 0 |

**C) Sẵn sàng cho Bán hàng:**

- ✅ Khi vào "Quản lý Kho" → "Xuất Kho" → Nhập thông tin khách hàng
- ✅ Tìm kiếm SĐT: "0912345678" → Tự động điền thông tin Nguyễn Văn A
- ✅ Có thể chọn khách hàng này cho phiếu xuất kho (Test 2)

---

### Các trường hợp Test bổ sung

**A) Tạo khách hàng trùng SĐT:**

1. Thử tạo khách hàng mới với SĐT: 0912345678 (đã tồn tại)
2. Hệ thống hiển thị: "❌ Số điện thoại đã tồn tại - KH: Nguyễn Văn A"
3. Có link "Xem khách hàng" để chuyển đến profile KH cũ

**B) Sửa thông tin khách hàng:**

1. Vào chi tiết KH → Click **"Sửa"**
2. Thay đổi thông tin cần thiết (email, địa chỉ, ghi chú)
3. Lưu → Thông tin được cập nhật

**C) Tìm kiếm khách hàng:**

1. Tìm bằng SĐT: 0912345678 → Hiển thị Nguyễn Văn A
2. Tìm bằng tên: "Nguyễn Văn A" → Hiển thị kết quả phù hợp
3. Tìm bằng email: nguyenvana@email.com → Hiển thị Nguyễn Văn A

---

## 8.5. [TC-INV-002] Luồng Test 1C: Chuyển kho thủ công từ Kho Chính sang Kho Bảo Hành *(OPTIONAL)*

> **Test này là TÙY CHỌN** - Có thể bỏ qua và chuyển thẳng sang Test 2. Mục đích để minh họa chuyển động THỦ CÔNG duy nhất trong hệ thống.

**Mục tiêu:** Kiểm tra quy trình chuyển kho THỦ CÔNG để chuẩn bị hàng dự phòng cho bảo hành

**Điều kiện tiên quyết:** Đã hoàn thành Test 1 - Có 100 sản phẩm trong Kho Chính

**Lưu ý quan trọng:** Đây là **chuyển động THỦ CÔNG DUY NHẤT** trong hệ thống. Tất cả các chuyển động kho khác đều tự động.

**Ảnh hưởng đến flow demo:**
- Nếu **CHẠY Test 1C**: Kho Chính sẽ giảm xuống 90 (các test tiếp theo cần điều chỉnh số lượng)
- Nếu **BỎ QUA Test 1C**: Kho Chính vẫn là 100 (tiếp tục Test 2 bình thường)

---

### BƯỚC 1: Tạo Phiếu Chuyển Kho

**Thao tác:**

1. Đăng nhập hệ thống
2. Vào menu **"Quản lý Kho"** → **"Chuyển Kho"**
3. Click nút **"Tạo Phiếu Chuyển Kho"**
4. Nhập thông tin:
   - **Kho nguồn**: Kho Công ty → Kho Chính
   - **Kho đích**: Kho Công ty → Kho Bảo Hành
   - **Lý do**: "Chuẩn bị hàng dự phòng cho bảo hành"
   - **Ghi chú**: "Chuyển 10 sản phẩm sang kho bảo hành"

**Expected Outcome:**

- ✅ Form "Tạo Phiếu Chuyển Kho" hiển thị
- ✅ Dropdown kho nguồn và kho đích hiển thị các kho ảo
- ✅ Sẵn sàng để chọn sản phẩm chuyển kho

---

### BƯỚC 2: Chọn Sản phẩm và Serial

**Thao tác:**

1. Click **"Thêm Sản phẩm"**
2. Chọn **Sản phẩm**: ZOTAC RTX 4090 24GB
3. Nhập **Số lượng**: 10
4. Click **"Thêm"**
5. Chọn serials cần chuyển (10 serials cuối: ABC123456791-800)

**Expected Outcome:**

- ✅ Sản phẩm được thêm vào phiếu chuyển kho
- ✅ Hiển thị: "Cần chọn 10 serials"
- ✅ Danh sách 100 serials khả dụng từ Kho Chính hiển thị
- ✅ Chọn đủ 10 serials: ABC123456791 → ABC123456800

---

### BƯỚC 3: Xác nhận Chuyển Kho

**Thao tác:**

1. Kiểm tra lại thông tin:
   - Sản phẩm: ZOTAC RTX 4090 24GB × 10
   - Từ: Kho Chính → Kho Bảo Hành
   - Serials: ABC123456791-800
2. Click **"Xác nhận Chuyển Kho"**
3. Chờ hệ thống xử lý

**Expected Outcome:**

- ✅ Hiển thị loading: "Đang xử lý chuyển kho..."
- ✅ **Hệ thống TỰ ĐỘNG:**
  - Di chuyển 10 serials: Kho Chính → Kho Bảo Hành
  - Cập nhật tồn kho: Kho Chính: 100 → 90, Kho Bảo Hành: 0 → 10
  - Tạo phiếu chuyển kho: TRF-2026-001
  - Ghi log: "Chuyển kho thủ công 10 RTX 4090"
- ✅ Thông báo: "✅ Đã chuyển kho thành công 10 sản phẩm"

---

### BƯỚC 4: Kiểm tra Kết quả

**Thao tác:**

1. Vào **"Quản lý Kho"** → **"Xem Tồn Kho"**
2. Kiểm tra Kho Chính
3. Kiểm tra kho Kho Bảo Hành
4. Tra cứu serial **ABC123456791**

**Expected Outcome:**

**A) Tồn kho sau chuyển:**

| Kho | Trước | Sau |
|-----|-------|-----|
| Kho Chính | 100 | **90** |
| Kho Bảo Hành | 0 | **10** |

**B) Serial ABC123456791:**

| Thông tin | Giá trị |
|-----------|---------|
| Vị trí | **Kho Bảo Hành** ✅ |
| Trạng thái | Available (Sẵn sàng thay thế) |
| Lịch sử | Nhập kho (SR-2026-001) → **Chuyển kho thủ công (TRF-2026-001)** |

**C) Phiếu chuyển kho:**

| Thông tin | Giá trị |
|-----------|---------|
| Mã phiếu | TRF-2026-001 |
| Loại | Transfer (Chuyển kho) |
| Từ → Đến | Kho Chính → Kho Bảo Hành |
| Số lượng | 10 sản phẩm |
| Trạng thái | Completed |

---

### Lưu ý quan trọng

> **Đây là chuyển động THỦ CÔNG DUY NHẤT:**
> - Tất cả chuyển động kho khác đều TỰ ĐỘNG theo workflow nghiệp vụ
> - Chuyển kho từ Kho Chính → Kho Bảo Hành phải được thực hiện CHỦ ĐỘNG bởi Manager
> - Mục đích: Chuẩn bị hàng dự phòng để thay thế nhanh cho khách khi sản phẩm không sửa được

---

## 8.6. [TC-SALE-001] Luồng Test 2: Xuất bán cho khách (60 cái)

**Điều kiện tiên quyết:**
- Đã hoàn thành Test 1B - Khách hàng "Nguyễn Văn A" đã tồn tại trong hệ thống
- Có ít nhất 60 sản phẩm trong Kho Chính (100 nếu bỏ qua Test 1C, hoặc 90 nếu đã chạy Test 1C)

**Mục tiêu:** Kiểm tra quy trình bán hàng và di chuyển sản phẩm từ kho → khách hàng

**Tham khảo:** [Section 4.7 - Quy trình Bán hàng](./03-quy-trinh-nghiep-vu-chinh.md#47-quy-trình-bán-hàng--mới)

**Tự động hóa:** Hệ thống TỰ ĐỘNG di chuyển kho khi xác nhận bán (Kho Chính → Kho Hàng Bán) - [Quy tắc #7](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động)

---

### BƯỚC 1: Tạo Đơn Bán Hàng

**Thao tác:**

1. Đăng nhập hệ thống
2. Vào menu **"Quản lý Kho"** → **"Xuất Kho"**
3. Click nút **"Tạo Phiếu Xuất Kho"**
4. Chọn **Loại xuất kho**: "Bán hàng (Sales)"
5. Click **"Tiếp tục"**

**Expected Outcome:**

- ✅ Form "Tạo Đơn Bán Hàng" hiển thị
- ✅ Các trường thông tin khách hàng sẵn sàng để nhập
- ✅ Dropdown "Loại xuất kho" hiển thị: Sales, Transfer, RMA, etc.
- ✅ Loại "Sales" được chọn

> 📋 **Issues #16-17** - Xem [ISSUES TỔNG HỢP](#-issues-tổng-hợp-ngoài-test-cases)

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

> 📋 **Issue #18** - Xem [ISSUES TỔNG HỢP](#-issues-tổng-hợp-ngoài-test-cases)

---

### BƯỚC 3: Chọn Sản phẩm

**Thao tác:**

1. Click **"Thêm Sản phẩm"**
2. Chọn **Kho nguồn**: Kho Công ty → Kho Chính
3. Chọn **Sản phẩm**: ZOTAC RTX 4090 24GB
4. Nhập **Số lượng**: 60
5. Hệ thống hiển thị **Số lượng khả dụng**: 100 cái ✅
6. Click **"Thêm"**

**Expected Outcome:**

- ✅ Sản phẩm được thêm vào đơn hàng:
  - ZOTAC RTX 4090 24GB
  - Số lượng: 60 / 100 khả dụng
  - Kho: Kho Chính
  - Trạng thái: ⏳ Chờ chọn serials
- ✅ Hiển thị cảnh báo: "Cần chọn 60 serial numbers"
- ✅ Nút "Chọn Serials" được kích hoạt
- ✅ Nút "Xác nhận bán" bị disable (chưa chọn đủ serials)

---

### BƯỚC 4: Chọn Serial Numbers

**Thao tác:**

1. Click **"Chọn Serials"**
2. Hệ thống hiển thị danh sách 100 serials khả dụng trong Kho Chính
3. **Cách 1:** Click checkbox chọn từng serial (60 serials đầu: 701-760)
   **HOẶC**
   **Cách 2:** Click **"Chọn tự động 60 đầu tiên"**
4. Kiểm tra: Đã chọn đủ 60/60 serials
5. Click **"Xác nhận chọn serials"**

**Expected Outcome:**

- ✅ Danh sách 60 serials được chọn: ABC123456701 đến ABC123456760
- ✅ Hiển thị: "✅ Đã chọn 60/60 serials"
- ✅ Preview danh sách serials đã chọn
- ✅ Nút "Xác nhận bán" được kích hoạt (enable)
- ✅ Có thể xem/in danh sách serials trước khi xác nhận

---

### BƯỚC 5: Xác nhận Bán Hàng

**Thao tác:**

1. Kiểm tra lại thông tin tổng quan:
   - Khách hàng: Nguyễn Văn A (0912345678)
   - Sản phẩm: ZOTAC RTX 4090 24GB × 60
   - Serials: ABC123456701 → ABC123456760
2. Chọn **Phương thức thanh toán**: Tiền mặt / Chuyển khoản
3. Click **"Xác nhận Xuất Kho & Bán Hàng"**
4. Chờ hệ thống xử lý

**Expected Outcome:**

- ✅ Loading indicator: "Đang xử lý bán hàng..."
- ✅ **Hệ thống TỰ ĐỘNG thực hiện:**

| Bước | Hành động | Kết quả |
|------|-----------|---------|
| A | Tạo Stock Issue (Phiếu xuất kho) | Mã phiếu: SO-2026-001 |
| B | Di chuyển kho TỰ ĐỘNG (Quy tắc #7) | 60 serials: Kho Chính → Kho Hàng Bán |
| C | Cập nhật thông tin sản phẩm | Trạng thái: Đã bán, Chủ sở hữu: Nguyễn Văn A |
| D | Cập nhật tồn kho | Kho Chính: 100 → 40, Kho Hàng Bán: 0 → 60 |
| E | Ghi log | "04/02/2026 - Xuất bán 60 RTX 4090 cho KH Nguyễn Văn A" |

- ✅ Hiển thị: "✅ Bán hàng thành công! Mã đơn: SO-2026-001"

> 📋 **Issue #19 (DONE)** - Xem [ISSUES TỔNG HỢP](#-issues-tổng-hợp-ngoài-test-cases)
> **DONE (2026-02-05):** Trigger `process_issue_serial()` đã tự động chuyển sản phẩm sang kho `customer_installed` khi xuất với reason='sale'. Đồng thời lưu `last_known_customer_id` để tracking khách hàng.

---

### BƯỚC 6: Kiểm tra Kết quả

**Thao tác:**

1. Vào **"Quản lý Kho"** → **"Xem Tồn Kho"** kiểm tra Kho Chính
2. Kiểm tra kho Kho Hàng Bán
3. Tra cứu serial **ABC123456701**

**Expected Outcome:**

**A) Tồn kho sau khi bán:**

| Kho | Số lượng | Serials |
|-----|----------|---------|
| Kho Chính | **40 cái** ✅ | ABC123456761 → ABC123456800 |
| Kho Hàng Bán | **60 cái** ✅ | ABC123456701 → ABC123456760 |

**B) Serial ABC123456701:**

| Thông tin | Giá trị |
|-----------|---------|
| Trạng thái | Đã bán |
| Vị trí | Kho Hàng Bán |
| Chủ sở hữu | Nguyễn Văn A (0912345678) |
| Ngày mua | 04/02/2026 |
| Lịch sử | Nhập kho (SR-2026-001) → Bán cho KH (SO-2026-001) |

> 📋 **Issue #20 (Critical)** - Xem [ISSUES TỔNG HỢP](#-issues-tổng-hợp-ngoài-test-cases)
>
> **Chi tiết:** Kho Hàng Bán = 0 thay vì 60 sau khi bán. Quy tắc #7 không hoạt động → Mất tracking 60 SP.

---

## 8.7. [TC-WRN-001] Luồng Test 3: Tạo yêu cầu bảo hành từ serial đã bán

**Mục tiêu:** Kiểm tra quy trình tạo yêu cầu dịch vụ và xác minh bảo hành tự động

**Tham khảo:**

- [Section 2.3 - Lễ tân Chuyển đổi](./03-quy-trinh-nghiep-vu-chinh.md#23-bước-2-lễ-tân-xem-xét-và-chuyển-đổi-yêu-cầu)
- [Section 3.2 - Xác minh Bảo hành](./03-quy-trinh-nghiep-vu-chinh.md#32-quy-trình-xác-minh-bảo-hành)

**Tự động hóa:** Xác minh bảo hành tự động, Di chuyển kho tự động khi tạo ticket - [Quy tắc #1](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động)

---

### BƯỚC 1: Tạo Phiếu Dịch vụ và Xác minh Bảo hành (Tự động)

**Thao tác:**

1. Đăng nhập hệ thống
2. Vào menu **"Phiếu Dịch vụ"** → **"Tạo Phiếu Mới"**
3. Tại trường **"Serial Number"**, nhập: **ABC123456701**
   *(Serial đã bán cho khách Nguyễn Văn A ở Test 2)*
4. Click **"Kiểm tra"**
5. Chờ hệ thống xác minh (1-2 giây)

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
| Di chuyển kho | Serial ABC123456701: Kho Hàng Bán → **Kho Sửa Chữa** |
| Gửi email | "Đã tiếp nhận sản phẩm - Phiếu SV-2026-001" |

- ✅ In phiếu tiếp nhận cho khách ký

---

### BƯỚC 4: Kiểm tra Kết quả

**Thao tác:**

1. Vào **"Quản lý Phiếu Dịch vụ"** → Xem phiếu **SV-2026-001**
2. Vào **"Tra cứu Serial"** → Nhập **ABC123456701**
3. Vào **"Quản lý Kho"** → Xem tồn kho **Kho Sửa Chữa**

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
| Vị trí hiện tại | **Kho Sửa Chữa**  ✅ |
| Link với phiếu | SV-2026-001 |
| Lịch sử | Nhập kho → Bán cho KH → **Chuyển vào Kho Sửa Chữa** |

**C) Tồn kho:**

| Kho | Trước | Sau |
|-----|-------|-----|
| Kho Hàng Bán | 60 | **59** |
| Kho Sửa Chữa | 0 | **1** (ABC123456701) |

---

## 8.8. [TC-WRN-002] Luồng Test 4: Kỹ thuật viên thực hiện tasks trong phiếu bảo hành

**Mục tiêu:** Kiểm tra workflow tasks và quy trình kỹ thuật viên thực hiện công việc

**Tham khảo:**

- [Section 2.4 - Kỹ thuật viên Thực hiện](./03-quy-trinh-nghiep-vu-chinh.md#24-bước-3-kỹ-thuật-viên-thực-hiện-công-việc)
- [Section 2.4.2 - Quản lý Thời gian và Deadline](./03-quy-trinh-nghiep-vu-chinh.md#242-quản-lý-thời-gian-và-deadline)

**Tự động hóa:** Khi hoàn thành tất cả tasks → Phiếu tự động chuyển ready_for_pickup, Di chuyển kho tự động - [Quy tắc #2](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động)

---

### BƯỚC 1: Đăng nhập và Xem danh sách Phiếu

**Thao tác:**

1. Đăng nhập hệ thống
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
| Di chuyển kho | Serial ABC123456701: Kho Sửa Chữa → **Kho Hàng Bán** |
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
| Vị trí | **Kho Hàng Bán** ✅ (đã chuyển về từ Kho Sửa Chữa) |
| Trạng thái | Sẵn sàng giao cho khách |

**C) Tồn kho:**

| Kho | Trước | Sau |
|-----|-------|-----|
| Kho Sửa Chữa | 1 | **0** |
| Kho Hàng Bán | 59 | **60** |

**D) Email đã gửi cho khách:**

- Subject: [SSTC] Sản phẩm đã sửa xong - Phiếu SV-2026-001
- Nội dung: Thông báo sản phẩm sẵn sàng, link xác nhận phương thức nhận hàng

---

## 8.9. [TC-WRN-003] Luồng Test 5A: Hết bảo hành, không sửa được → Trả lại khách

**Mục tiêu:** Kiểm tra quy trình xử lý sản phẩm HẾT bảo hành, không sửa được

**Giả định:** Tạo phiếu dịch vụ mới với serial đã HẾT bảo hành, Kỹ thuật viên chẩn đoán → Không sửa được

**Chuẩn bị dữ liệu test:**
> Để giả lập serial hết bảo hành, cần thực hiện **MỘT trong các cách sau** trước khi bắt đầu test:
> - **Cách 1 (Khuyến nghị):** Admin/Dev sửa trực tiếp trong DB - cập nhật warranty dates của serial ABC123456703 về quá khứ
> - **Cách 2:** Tạo phiếu nhập kho riêng với serial ABC123456703 có ngày BH bắt đầu từ 04/02/2023
> - **Cách 3:** Sử dụng tính năng "time travel" nếu môi trường test hỗ trợ
>
> ```sql
> -- Cách 1: Script cập nhật DB (chạy trên môi trường test)
> UPDATE physical_products
> SET manufacturer_warranty_start = '2023-02-04',
>     manufacturer_warranty_end = '2026-02-04',
>     company_warranty_start = '2023-02-04',
>     company_warranty_end = '2027-02-04'
> WHERE serial_number = 'ABC123456703';
> ```

---

### BƯỚC 1: Tạo phiếu dịch vụ với serial HẾT bảo hành

**Thao tác:**

1. Xác nhận serial **ABC123456703** đã được giả lập HẾT bảo hành (xem phần "Chuẩn bị dữ liệu test" ở trên)
   - BH Hãng: 04/02/2023 → 04/02/2026 (đã hết)
   - BH Công ty: 04/02/2023 → 04/02/2027 (đã hết)
2. Lặp lại Luồng Test 3 với serial: **ABC123456703**
3. Tạo Service Ticket: **SV-2026-003**

**Expected Outcome:**

- ✅ Hệ thống kiểm tra và hiển thị:

| Thông tin | Giá trị |
|-----------|---------|
| Trạng thái | ⚠️ **HẾT BẢO HÀNH** |
| BH Hãng | 04/02/2023 → 04/02/2026 (đã hết 365 ngày) 🔴 |
| BH Công ty | 04/02/2023 → 04/02/2027 (đã hết) 🔴 |
| Loại dịch vụ | **Paid Service** (Dịch vụ có phí) |
| Kết luận | ⚠️ Sản phẩm hết bảo hành, dịch vụ có phí |

- ✅ Service Ticket SV-2026-003 được tạo
- ✅ Serial ABC123456703 chuyển: Kho Hàng Bán → **Kho Sửa Chữa**
- ✅ Tồn kho: Kho Hàng Bán: 60 → 59, Kho Sửa Chữa: 0 → 1

---

### BƯỚC 2: Technician đánh dấu "Không sửa được"

**Thao tác:**

1. Đăng nhập hệ thống
2. Vào phiếu **SV-2026-003**
3. Thực hiện một số tasks chẩn đoán (Task 1-3)
4. Kết luận: **Card hỏng nặng, chip GPU chết, không sửa được**
5. Chi phí sửa chữa ước tính: **15,000,000 VNĐ** (quá cao)
6. Click nút **"Báo cáo kết quả"**
7. Chọn Outcome: **"Unrepairable"** (Không sửa được)
8. Nhập lý do: "Chip GPU hỏng hoàn toàn, chi phí sửa 15M VNĐ (cao hơn giá sản phẩm mới). Khuyến nghị khách mua sản phẩm mới."
9. Click **"Submit để Manager review"**

**Expected Outcome:**

- ✅ Phiếu SV-2026-003 chuyển trạng thái: Pending → **awaiting_approval**
- ✅ Outcome: Unrepairable (Không sửa được)
- ✅ Lý do và chi phí được ghi vào timeline
- ✅ Thông báo gửi đến Manager

---

### BƯỚC 3: Manager duyệt và quyết định trả lại khách

**Thao tác:**

1. Đăng nhập hệ thống
2. Vào **"Phiếu chờ duyệt"**
3. Click vào phiếu **SV-2026-003**
4. Xem kết quả chẩn đoán:
   - Outcome: Unrepairable
   - Lý do: "Chip GPU hỏng hoàn toàn..."
   - Chi phí sửa: 15M VNĐ
   - Tình trạng BH: ❌ **Đã hết**
5. Quyết định: **"Return to Customer"** (Trả lại khách)
6. Click nút **"Duyệt trả lại khách"**
7. Nhập ghi chú: "Sản phẩm hết bảo hành, chi phí sửa quá cao. Trả lại khách, khuyến nghị mua sản phẩm mới."

**Expected Outcome:**

- ✅ Phiếu SV-2026-003 cập nhật:
  - Outcome: **Return to Customer**
  - Trạng thái: **ready_for_pickup**
- ✅ **Hệ thống TỰ ĐỘNG:**
  - Serial ABC123456703: **Kho Sửa Chữa → Kho Hàng Bán**
  - Trả lại vị trí ban đầu (nhà khách)
- ✅ Email thông báo gửi khách:
  - "Sản phẩm không sửa được, vui lòng đến nhận lại"
  - Chi phí: 0 VNĐ (chưa sửa)
- ✅ Tồn kho:
  - Kho Sửa Chữa: 1 → 0
  - Kho Hàng Bán: 59 → 60

---

### BƯỚC 4: Giao sản phẩm trả lại cho khách

**Thao tác:**

1. Khi khách đến nhận:
   - Kiểm tra thông tin khách hàng
   - Giải thích tình trạng: Hết bảo hành, không sửa được
   - Tư vấn: Mua sản phẩm mới hoặc nâng cấp
2. Khách ký nhận sản phẩm gốc
3. Click **"Xác nhận đã giao hàng"**

**Expected Outcome:**

- ✅ Phiếu SV-2026-003 chuyển: ready_for_pickup → **Completed**
- ✅ Outcome: Return to Customer (không đổi mới, không RMA)
- ✅ Serial ABC123456703 vẫn ở **Kho Hàng Bán** (nhà khách)
- ✅ Không có sản phẩm mới thay thế
- ✅ Không tạo RMA

---

### BƯỚC 5: Kiểm tra Kết quả

**Thao tác:**

1. Xem phiếu SV-2026-003
2. Tra cứu serial ABC123456703
3. Kiểm tra tồn kho

**Expected Outcome:**

**A) Phiếu SV-2026-003:**

| Thông tin | Giá trị |
|-----------|---------|
| Trạng thái | **Completed** |
| Outcome | **Return to Customer** |
| Loại dịch vụ | Paid Service (Hết BH) |
| Serial | ABC123456703 (đã trả lại khách) |
| Chi phí | 0 VNĐ (không sửa) |

**B) Serial ABC123456703:**

| Thông tin | Giá trị |
|-----------|---------|
| Vị trí | **Kho Hàng Bán** ✅ |
| Chủ sở hữu | Nguyễn Văn A |
| Trạng thái BH | Đã hết |
| Lịch sử | Nhập kho → Bán → Dịch vụ (không sửa được) → **Trả lại khách** |

**C) Tồn kho:**

| Kho | Số lượng |
|-----|----------|
| Kho Chính | **40** (không đổi - Test 5A không tác động Kho Chính) |
| Kho Hàng Bán | **60** (không đổi - serial 703 trả lại KH, vẫn ở Kho Hàng Bán) |
| Kho Sửa Chữa | 0 |
| Kho Hàng Hỏng | 0 |

> **So sánh với Test 5B:**
> - Test 5A (Hết BH): Không sửa được → **Trả lại khách** → Serial về Kho Hàng Bán
> - Test 5B (Còn BH): Không sửa được → **Đổi mới** → Serial lỗi → Kho Hàng Hỏng → RMA

---

## 8.10. [TC-WRN-004] Luồng Test 5B: Còn bảo hành, không sửa được → Đổi mới (Warranty Replacement)

**Mục tiêu:** Kiểm tra quy trình RMA và thay thế sản phẩm khi không sửa được

**Tham khảo:**

- [Section 3.3 - Quy trình RMA](./03-quy-trinh-nghiep-vu-chinh.md#33-quy-trình-rma-return-merchandise-authorization)
- [Section 5.4 - Kịch bản 3: Bảo hành Đổi trả](./03-quy-trinh-nghiep-vu-chinh.md#54-kịch-bản-3-bảo-hành-đổi-trả-warranty-replacement)

**Giả định:** Tạo phiếu bảo hành mới, Kỹ thuật viên chẩn đoán → Không sửa được, cần đổi mới

**Tự động hóa:**
- [Quy tắc #4](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động): Sản phẩm lỗi tự động chuyển Kho Sửa Chữa → Kho Hàng Hỏng
- [Quy tắc #5](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động): Sản phẩm thay thế tự động chuyển Kho Chính → Kho Hàng Bán

---

### BƯỚC 1: Tạo phiếu bảo hành mới (Chuẩn bị)

**Thao tác:**

1. Lặp lại Luồng Test 3 với serial khác: **ABC123456702**
2. Tạo Service Request và chuyển thành Service Ticket: **SV-2026-002**

**Expected Outcome:**

- ✅ Service Ticket SV-2026-002 được tạo
- ✅ Serial ABC123456702 chuyển: Kho Hàng Bán → **Kho Sửa Chữa**
- ✅ Tồn kho: Kho Hàng Bán: 60 → 59, Kho Sửa Chữa: 0 → 1

---

### BƯỚC 2: Technician đánh dấu "Không sửa được"

**Thao tác:**

1. Đăng nhập hệ thống
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
- ✅ Serial ABC123456702 vẫn ở **Kho Sửa Chữa** (chờ Manager quyết định)

---

### BƯỚC 3: Manager xem xét và duyệt đổi mới

**Thao tác:**

1. Đăng nhập hệ thống
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
   - **Kho nguồn**: Kho Chính
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
| A | Sản phẩm LỖI di chuyển (Quy tắc #4) | ABC123456702: Kho Sửa Chữa → **Kho Hàng Hỏng** |
| B | Sản phẩm THAY THẾ di chuyển (Quy tắc #5) | ABC123456761: Kho Chính → **Kho Hàng Bán** |
| C | Tạo Stock Issue | Phiếu xuất kho thay thế |
| D | Link serial thay thế | ABC123456761 gán vào phiếu SV-2026-002 |
| E | Đánh dấu outcome | "Warranty Replacement" |
| F | Gán thời hạn bảo hành (Issue #29) | ABC123456761 nhận ngày hết hạn BH của ABC123456702 (04/02/2029) |
| G | Cập nhật tồn kho | Kho Chính: 40 → 39, Kho Hàng Hỏng: 0 → 1 |

- ✅ Hiển thị thông báo: "✅ Đã xác nhận thay thế sản phẩm"
- ✅ Phiếu SV-2026-002 cập nhật:
  - Serial cũ (lỗi): ABC123456702 → Kho Hàng Hỏng
  - Serial mới (thay thế): ABC123456761 → Sẵn sàng giao khách

---

### BƯỚC 5: Tạo RMA Batch (để gửi về hãng)

**Thao tác:**

**Phần 1: Tạo lô RMA**

1. Manager vào menu **"Quản lý RMA"** → **"Tạo lô RMA mới"**
2. Điền thông tin lô RMA:
   - **Tên Nhà cung cấp/Hãng**: ZOTAC Technology
   - **Ngày vận chuyển dự kiến**: 10/02/2026
   - **Mã vận đơn**: VN1234567890 *(có thể điền trước hoặc để trống)*
   - **Ghi chú**: "RMA theo bảo hành hãng, phiếu SV-2026-002"
3. Click **"Tạo lô RMA"**

**Phần 2: Thêm sản phẩm vào lô RMA**

4. Hệ thống tạo lô RMA và chuyển đến màn hình chi tiết
5. Tại màn hình chi tiết lô RMA, click **"Thêm sản phẩm"**
6. Chọn sản phẩm lỗi cần gửi về hãng:
   - **Sản phẩm**: ZOTAC RTX 4090 24GB
   - **Serial**: ABC123456702
   - Hoặc chọn từ danh sách sản phẩm trong Kho Hàng Hỏng
7. Click **"Xác nhận thêm sản phẩm"**

**Expected Outcome:**

**A) Sau khi tạo lô RMA (Phần 1):**

- ✅ RMA Batch được tạo:

| Thông tin | Giá trị |
|-----------|---------|
| Mã lô | **RMA-20260205-001** |
| Trạng thái | Draft (Chưa gửi) |
| Nhà cung cấp | ZOTAC Technology |
| Ngày dự kiến | 10/02/2026 |
| Mã vận đơn | VN1234567890 |
| Số lượng SP | 0 (chưa thêm sản phẩm) |

- ✅ Chuyển đến màn hình chi tiết lô RMA
- ✅ Hiển thị nút **"Thêm sản phẩm"**

**B) Sau khi thêm sản phẩm (Phần 2):**

- ✅ Serial ABC123456702 được thêm vào lô RMA
- ✅ Số lượng sản phẩm: 0 → **1**
- ✅ Danh sách sản phẩm trong lô hiển thị:

| Serial | Sản phẩm | Lý do | Phiếu gốc | Vị trí |
|--------|----------|-------|-----------|--------|
| ABC123456702 | ZOTAC RTX 4090 24GB | Chip GPU hỏng | SV-2026-002 | Kho Hàng Hỏng |

- ✅ **Sản phẩm VẪN Ở Kho Hàng Hỏng** (chưa gửi đi)
- ✅ Tồn kho:
  - Kho Hàng Hỏng: 1 (ABC123456702 chờ gửi)

> **Lưu ý:** Serial chỉ ra khỏi hệ thống khi đánh dấu "Đã gửi" (Test 6 - BƯỚC 4)

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
| Serial cũ | ABC123456702 (ở Kho Hàng Hỏng) |
| Serial mới | ABC123456761 (đã giao khách) |

**B) Serial ABC123456702 (Sản phẩm lỗi):**

| Thông tin | Giá trị |
|-----------|---------|
| Vị trí | **Kho Hàng Hỏng** |
| Trạng thái | Chờ gửi về hãng |
| RMA Batch | RMA-20260205-001 (đã được thêm vào lô) |

**C) Serial ABC123456761 (Sản phẩm thay thế):**

| Thông tin | Giá trị |
|-----------|---------|
| Vị trí | **Kho Hàng Bán** |
| Chủ sở hữu | Nguyễn Văn A |
| Thời hạn bảo hành | **04/02/2029** (gán theo BH sản phẩm cũ, không tính lại) |
| Giao theo phiếu | SV-2026-002 |

**D) Tồn kho cuối cùng:**

| Kho | Số lượng |
|-----|----------|
| Kho Chính | **39** (giảm 1 vì xuất thay thế) |
| Kho Hàng Bán | **60** |
| Kho Hàng Hỏng | **1** (ABC123456702 - chờ gửi RMA) |

---

## 8.11. [TC-RMA-001] Luồng Test 6: Quy trình RMA gửi sản phẩm hư về nhà máy

**Mục tiêu:** Kiểm tra quy trình gửi sản phẩm lỗi về nhà máy và nhận hàng thay thế

**Tham khảo:** [Section 3.3.2 - Quy trình RMA Chi tiết](./03-quy-trinh-nghiep-vu-chinh.md#332-quy-trình-rma-chi-tiết)

**Tiếp tục từ Test 5:** Đã có sản phẩm lỗi ABC123456702 trong Kho Hàng Hỏng, RMA Batch đã tạo

---

### BƯỚC 1: Xem RMA Batch

**Thao tác:**

1. Đăng nhập hệ thống
2. Vào menu **"Quản lý RMA"** → **"Danh sách RMA Batches"**
3. Click vào lô **RMA-20260205-001**

**Expected Outcome:**

- ✅ Danh sách RMA Batches hiển thị:

| Mã lô | Trạng thái | Số lượng | Hãng | Ngày tạo |
|-------|------------|----------|------|----------|
| RMA-20260205-001 | Draft/Pending | 1 cái | ZOTAC Technology | 05/02/2026 |

- ✅ Chi tiết lô RMA-20260205-001:

| Thông tin | Giá trị |
|-----------|---------|
| Mã lô | RMA-20260205-001 |
| Nhà cung cấp | ZOTAC Technology |
| Ngày dự kiến | 10/02/2026 |
| Mã vận đơn | VN1234567890 |
| Trạng thái | Draft/Pending (Chưa gửi) |
| Số lượng | 1 sản phẩm |

**Danh sách sản phẩm trong lô:**

| Serial | Sản phẩm | Lý do | Phiếu BH gốc | Vị trí |
|--------|----------|-------|--------------|--------|
| ABC123456702 | ZOTAC RTX 4090 24GB | Chip GPU hỏng | SV-2026-002 | Kho Hàng Hỏng |

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

1. Lấy sản phẩm lỗi ABC123456702 từ Kho Hàng Hỏng
2. Đóng gói sản phẩm theo quy cách
3. Đính kèm phiếu RMA đã in
4. Chuẩn bị gửi qua đơn vị vận chuyển

**Expected Outcome:**

- ✅ Sản phẩm được đóng gói đúng quy cách
- ✅ Phiếu RMA đính kèm trong kiện hàng
- ✅ Sẵn sàng gửi đi
- ✅ Sản phẩm vẫn ở Kho Hàng Hỏng (chưa cập nhật "Đã gửi")

---

### BƯỚC 4: Cập nhật Trạng thái "Đã gửi"

**Thao tác:**

1. Quay lại hệ thống, vào lô **RMA-20260205-001**
2. Click nút **"Đánh dấu đã gửi"** hoặc **"Cập nhật thông tin vận chuyển"**
3. Xác nhận/Cập nhật thông tin vận chuyển:
   - **Mã vận đơn**: VN1234567890 *(đã có từ khi tạo lô, có thể cập nhật)*
   - **Đơn vị vận chuyển**: GHTK / GHN / Viettel Post *(có thể bổ sung)*
   - **Ngày gửi thực tế**: 05/02/2026
   - **Ngày dự kiến nhận**: 10/02/2026 *(đã có từ khi tạo lô)*
4. Click **"Xác nhận đã gửi"**

**Expected Outcome:**

- ✅ Lô RMA-20260205-001 chuyển: Draft/Pending → **Shipped** (Đã gửi)
- ✅ Thông tin vận chuyển được lưu/cập nhật:

| Thông tin | Giá trị |
|-----------|---------|
| Mã vận đơn | VN1234567890 |
| Đơn vị vận chuyển | GHTK / GHN / Viettel Post |
| Ngày gửi | 05/02/2026 |
| Dự kiến nhận | 10/02/2026 |

- ✅ **Hệ thống TỰ ĐỘNG:**
  - Serial ABC123456702: **Kho Hàng Hỏng → NULL (Out of System)**
  - warehouse_id = NULL
  - Status = "rma_sent"
  - **RA KHỎI HỆ THỐNG** - không còn tracking vị trí kho

- ✅ Tồn kho cập nhật:
  - Kho Hàng Hỏng: 1 → **0**
  - Sản phẩm không còn trong bất kỳ kho ảo nào

> **Lưu ý:** Đây là trường hợp duy nhất sản phẩm RA KHỎI HỆ THỐNG (không đếm tồn kho). Vẫn có history để audit nhưng không tracking vị trí.

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
   - **Kho đích**: Kho Chính
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
| Kho đích | Kho Chính |
| Link RMA | RMA-20260205-001 |

- ✅ Sản phẩm mới ZTC999888777 được nhập vào **Kho Chính**
- ✅ Tồn kho: Kho Chính: 39 → **40**

---

### BƯỚC 6: Hoàn tất RMA Batch

**Thao tác:**

1. Vào lô **RMA-20260205-001**
2. Click nút **"Đánh dấu hoàn tất"**
3. Nhập thông tin:
   - **Serial nhận được**: ZTC999888777
   - **Ngày nhận**: 15/02/2026
   - **Ghi chú**: "Đã nhận hàng thay thế từ ZOTAC, nhập Kho Chính"
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
| Trạng thái | **Đã gửi về hãng (rma_sent)** |
| Warehouse | **NULL (Out of System)** ✅ |
| RMA Batch | RMA-20260205-001 |
| Không còn trong hệ thống kho | ✅ (không đếm tồn kho) |
| Vẫn có history | ✅ (để audit) |

**C) Serial ZTC999888777 (Sản phẩm mới từ hãng):**

| Thông tin | Giá trị |
|-----------|---------|
| Vị trí | **Kho Chính** |
| Trạng thái | New (Mới) |
| Nguồn | RMA Return từ ZOTAC |
| Sẵn sàng | Có thể dùng thay thế cho khách tiếp theo |

**D) Tồn kho cuối cùng:**

| Kho | Số lượng | Ghi chú |
|-----|----------|---------|
| Kho Chính | **40** | +1 (ZTC999888777 từ RMA) |
| Kho Hàng Bán | **60** | Không đổi |
| Kho Sửa Chữa | **0** | Không đổi |
| Kho Hàng Hỏng | **0** | ABC123456702 đã OUT OF SYSTEM (không còn đếm) |

> **Lưu ý:** ABC123456702 không còn trong bất kỳ kho nào (warehouse_id = NULL), vẫn có lịch sử để audit

---

## 8.12. Negative Test Cases (Kiểm tra trường hợp lỗi / biên)

> **Mục tiêu:** Kiểm tra hệ thống xử lý đúng khi người dùng thao tác sai, dữ liệu không hợp lệ, hoặc xung đột logic nghiệp vụ.

---

### [TC-NEG-001] Nhập kho serial trùng

**Mức độ:** Critical
**Liên quan:** Test 1 - Nhập kho

**Thao tác:**

1. Hoàn thành Test 1 (đã có 100 serials: ABC123456701-800 trong hệ thống)
2. Tạo phiếu nhập kho mới
3. Nhập serial đã tồn tại: **ABC123456701**
4. Click "Validate Serials"

**Expected Outcome:**

- ✅ Hệ thống hiển thị lỗi: "Serial ABC123456701 đã tồn tại trong hệ thống"
- ✅ Serial trùng được highlight đỏ trong danh sách
- ✅ Không cho phép xác nhận nhập kho khi còn serial trùng
- ✅ Các serial hợp lệ khác vẫn hiển thị bình thường

| # | Expected Outcome | Actual Result | Status | Ghi chú |
|---|-----------------|---------------|--------|---------|
| 1 | Block serial trùng | | | |
| 2 | Hiển thị lỗi rõ ràng | | | |

---

### [TC-NEG-002] Bán hàng vượt tồn kho

**Mức độ:** Critical
**Liên quan:** Test 2 - Xuất bán

**Thao tác:**

1. Kiểm tra tồn kho Kho Chính: 40 cái (sau Test 2)
2. Tạo phiếu xuất bán mới
3. Nhập số lượng: **150** (vượt quá tồn kho)
4. Click "Thêm sản phẩm"

**Expected Outcome:**

- ✅ Hệ thống hiển thị: "Số lượng yêu cầu (150) vượt quá tồn kho khả dụng (40)"
- ✅ Không cho phép thêm sản phẩm với số lượng vượt tồn kho
- ✅ Hiển thị số lượng khả dụng thực tế

| # | Expected Outcome | Actual Result | Status | Ghi chú |
|---|-----------------|---------------|--------|---------|
| 1 | Block số lượng vượt tồn kho | | | |
| 2 | Hiển thị số khả dụng | | | |

---

### [TC-NEG-003] Tạo bảo hành với serial chưa bán

**Mức độ:** High
**Liên quan:** Test 3 - Tạo yêu cầu BH

**Thao tác:**

1. Vào "Phiếu Dịch vụ" → "Tạo Phiếu Mới"
2. Nhập serial còn trong Kho Chính (chưa bán): **ABC123456770**
3. Click "Kiểm tra"

**Expected Outcome:**

- ✅ Hệ thống hiển thị: "Serial ABC123456770 chưa được bán - Không thể tạo phiếu bảo hành"
- ✅ Hoặc hiển thị cảnh báo: "Serial này đang ở Kho Chính, chưa xuất bán cho khách hàng"
- ✅ Không cho phép tạo phiếu dịch vụ

| # | Expected Outcome | Actual Result | Status | Ghi chú |
|---|-----------------|---------------|--------|---------|
| 1 | Block tạo BH cho serial chưa bán | | | |

---

### [TC-NEG-004] Tạo bảo hành trùng cho serial đang có phiếu mở

**Mức độ:** High
**Liên quan:** Test 3 - Tạo yêu cầu BH

**Thao tác:**

1. Đảm bảo serial **ABC123456701** đang có phiếu SV-2026-001 (trạng thái chưa Completed)
2. Vào "Phiếu Dịch vụ" → "Tạo Phiếu Mới"
3. Nhập serial: **ABC123456701**
4. Click "Kiểm tra"

**Expected Outcome:**

- ✅ Hệ thống hiển thị: "Serial ABC123456701 đang có phiếu dịch vụ SV-2026-001 chưa hoàn thành"
- ✅ Có link đến phiếu hiện tại để xem chi tiết
- ✅ Không cho phép tạo phiếu mới (hoặc yêu cầu xác nhận từ Manager)

| # | Expected Outcome | Actual Result | Status | Ghi chú |
|---|-----------------|---------------|--------|---------|
| 1 | Block tạo phiếu trùng | | | |
| 2 | Hiển thị link phiếu đang mở | | | |

---

### [TC-NEG-005] Hủy phiếu giữa chừng - kiểm tra rollback kho

**Mức độ:** High
**Liên quan:** Test 2, Test 3

**Thao tác (Trường hợp 1 - Hủy phiếu xuất bán):**

1. Tạo phiếu xuất bán cho 5 sản phẩm (serials đã chọn)
2. Xác nhận bán hàng (kho đã tự động di chuyển: Kho Chính → Kho Hàng Bán)
3. Click **"Hủy phiếu"** trên phiếu vừa tạo
4. Xác nhận hủy

**Expected Outcome:**

- ✅ Hệ thống yêu cầu xác nhận: "Bạn có chắc muốn hủy phiếu SO-xxx? Thao tác này sẽ hoàn trả kho."
- ✅ 5 serials tự động chuyển ngược: Kho Hàng Bán → **Kho Chính**
- ✅ Tồn kho cập nhật đúng (rollback)
- ✅ Phiếu chuyển trạng thái: **Cancelled**
- ✅ Log ghi nhận: "Hủy phiếu + Rollback kho"

**Thao tác (Trường hợp 2 - Hủy phiếu dịch vụ):**

1. Tạo phiếu dịch vụ (serial đã chuyển: Kho Hàng Bán → Kho Sửa Chữa)
2. Click **"Hủy phiếu"**
3. Xác nhận hủy

**Expected Outcome:**

- ✅ Serial tự động chuyển ngược: Kho Sửa Chữa → **Kho Hàng Bán**
- ✅ Tồn kho cập nhật đúng

| # | Expected Outcome | Actual Result | Status | Ghi chú |
|---|-----------------|---------------|--------|---------|
| 1 | Rollback kho khi hủy phiếu xuất | | | |
| 2 | Rollback kho khi hủy phiếu dịch vụ | | | |

---

### [TC-NEG-006] Bán serial đang ở Kho Sửa Chữa

**Mức độ:** High
**Liên quan:** Test 2, Test 3

**Thao tác:**

1. Đảm bảo serial **ABC123456701** đang ở Kho Sửa Chữa (đang BH)
2. Tạo phiếu xuất bán mới
3. Thử chọn serial **ABC123456701** trong danh sách

**Expected Outcome:**

- ✅ Serial ABC123456701 KHÔNG xuất hiện trong danh sách serial khả dụng khi bán
- ✅ Hoặc hiển thị với trạng thái: "Đang sửa chữa - Không khả dụng"
- ✅ Không cho phép chọn serial đang ở Kho Sửa Chữa/Hàng Hỏng

| # | Expected Outcome | Actual Result | Status | Ghi chú |
|---|-----------------|---------------|--------|---------|
| 1 | Serial không khả dụng | | | |

---

### [TC-NEG-007] Thêm serial không thuộc Kho Hàng Hỏng vào lô RMA

**Mức độ:** Medium
**Liên quan:** Test 5B, Test 6

**Thao tác:**

1. Vào "Quản lý RMA" → Mở lô RMA hiện có
2. Click "Thêm sản phẩm"
3. Thử thêm serial đang ở **Kho Chính**: ABC123456770

**Expected Outcome:**

- ✅ Hệ thống hiển thị lỗi: "Serial ABC123456770 đang ở Kho Chính, chỉ serial ở Kho Hàng Hỏng mới có thể thêm vào lô RMA"
- ✅ Không cho phép thêm serial không thuộc Kho Hàng Hỏng

| # | Expected Outcome | Actual Result | Status | Ghi chú |
|---|-----------------|---------------|--------|---------|
| 1 | Block serial không hợp lệ | | | |

---

### [TC-NEG-008] Chuyển kho vượt số lượng khả dụng

**Mức độ:** Medium
**Liên quan:** Test 1C - Chuyển kho

**Thao tác:**

1. Tạo phiếu chuyển kho: Kho Chính → Kho Bảo Hành
2. Nhập số lượng: **200** (vượt quá tồn kho Kho Chính)

**Expected Outcome:**

- ✅ Hệ thống hiển thị: "Số lượng yêu cầu (200) vượt quá tồn kho khả dụng"
- ✅ Không cho phép tạo phiếu chuyển kho

| # | Expected Outcome | Actual Result | Status | Ghi chú |
|---|-----------------|---------------|--------|---------|
| 1 | Block chuyển vượt tồn kho | | | |

---

### [TC-CONC-001] Concurrent Access - Hai người cùng chọn một serial

**Mức độ:** Medium
**Liên quan:** Test 2 - Xuất bán

**Thao tác:**

1. **User A** (tab 1): Tạo phiếu xuất bán, chọn serial **ABC123456770**
2. **User B** (tab 2): Đồng thời tạo phiếu xuất bán, cũng chọn serial **ABC123456770**
3. User A click "Xác nhận bán" trước
4. User B click "Xác nhận bán" sau

**Expected Outcome:**

- ✅ User A: Bán hàng thành công
- ✅ User B: Hệ thống hiển thị lỗi: "Serial ABC123456770 đã được bán trong phiếu khác"
- ✅ Không xảy ra tình trạng 1 serial bán cho 2 khách (data integrity)
- ✅ Hệ thống sử dụng optimistic/pessimistic locking để ngăn xung đột

| # | Expected Outcome | Actual Result | Status | Ghi chú |
|---|-----------------|---------------|--------|---------|
| 1 | Chỉ 1 user bán thành công | | | |
| 2 | User thứ 2 nhận lỗi rõ ràng | | | |

---

## 8.13. Tổng hợp 10 Luồng Test

### Bảng Tóm tắt

| Test ID | Luồng Test | Section tham khảo | Vai trò | Kết quả chính |
|---------|------------|-------------------|---------|---------------|
| **TC-CAT-001** | Test 0: Thêm sản phẩm mới | [1.3](./03-quy-trinh-nghiep-vu-chinh.md#13-các-module-chính) | Manager/Admin | Sản phẩm xuất hiện trong catalog, sẵn sàng nhập kho |
| **TC-INV-001** | Test 1: Nhập kho 100 cái | [4.3](./03-quy-trinh-nghiep-vu-chinh.md#43-quy-trình-nhập-kho-stock-receipt) | Manager/Reception | Kho Chính: +100, Serial tracking hoạt động |
| **TC-CUS-001** | Test 1B: Tạo khách hàng mới | - | Reception/Manager | Khách hàng tạo thành công, sẵn sàng cho bán hàng |
| **TC-INV-002** | Test 1C: Chuyển kho thủ công *(OPTIONAL)* | - | Manager | Kho Chính: -10 → Kho Bảo Hành: +10, **Chuyển động THỦ CÔNG duy nhất** |
| **TC-SALE-001** | Test 2: Xuất bán 60 cái | [4.7](./03-quy-trinh-nghiep-vu-chinh.md#47-quy-trình-bán-hàng--mới) | Reception/Manager | Kho Chính: 40, Customer: 60, Auto di chuyển kho |
| **TC-WRN-001** | Test 3: Tạo yêu cầu BH | [2.2](./03-quy-trinh-nghiep-vu-chinh.md#22-bước-1-khách-hàng-tạo-yêu-cầu-dịch-vụ-service-request), [2.3](./03-quy-trinh-nghiep-vu-chinh.md#23-bước-2-lễ-tân-xem-xét-và-chuyển-đổi-yêu-cầu) | Khách hàng, Reception | SR + Ticket tạo thành công, Auto xác minh BH |
| **TC-WRN-002** | Test 4: Thực hiện tasks | [2.4](./03-quy-trinh-nghiep-vu-chinh.md#24-bước-3-kỹ-thuật-viên-thực-hiện-công-việc) | Technician | Workflow tuần tự, Auto chuyển trạng thái, Sửa thành công |
| **TC-WRN-003** | Test 5A: **Hết BH** → Trả lại khách | - | Technician, Manager | Không sửa được, Hết BH → **Return to Customer** → Serial về Kho Hàng Bán |
| **TC-WRN-004** | Test 5B: **Còn BH** → Đổi mới | [3.3](./03-quy-trinh-nghiep-vu-chinh.md#33-quy-trình-rma-return-merchandise-authorization), [5.4](./03-quy-trinh-nghiep-vu-chinh.md#54-kịch-bản-3-bảo-hành-đổi-trả-warranty-replacement) | Technician, Manager | Không sửa được, Còn BH → **Warranty Replacement** → SP lỗi → Kho Hàng Hỏng |
| **TC-RMA-001** | Test 6: RMA về hãng | [3.3.2](./03-quy-trinh-nghiep-vu-chinh.md#332-quy-trình-rma-chi-tiết) | Manager | RMA Completed, SP ra khỏi hệ thống, Nhận hàng mới từ hãng |
| **TC-NEG-001→008** | Negative Tests | - | Tất cả | Kiểm tra xử lý lỗi, validation, edge cases |
| **TC-CONC-001** | Concurrent Access | - | Tất cả | Kiểm tra xung đột khi nhiều user thao tác đồng thời |

### Quy tắc Di chuyển Kho Tự động Đã Test

| Quy tắc | Mô tả | Loại | Test |
|---------|-------|------|------|
| #1 | Tạo Ticket → Kho Hàng Bán → Kho Sửa Chữa | AUTO | Test 3, 5A, 5B |
| #2 | Hoàn thành sửa → Kho Sửa Chữa → Kho Hàng Bán | AUTO | Test 4 |
| #2A | Hết BH, trả lại khách → Kho Sửa Chữa → Kho Hàng Bán | AUTO | Test 5A |
| #3 | Duyệt đổi mới → Kho Sửa Chữa → Kho Hàng Hỏng | AUTO | Test 5B |
| #4 | Chọn SP thay thế → Kho Chính → Kho Hàng Bán | AUTO | Test 5B |
| #5 | RMA Đã gửi → Kho Hàng Hỏng → NULL (Out of System) | AUTO | Test 6 |
| #6 | Bán hàng → Kho Chính → Kho Hàng Bán | AUTO | Test 2 |
| #7 | Nhập kho → Kho Chính | AUTO | Test 1, Test 6 |
| #8 | Chuyển kho → Kho Chính → Kho Bảo Hành | **THỦ CÔNG** | Test 1C |

> **Lưu ý:**
> - Hầu hết chuyển động là **TỰ ĐỘNG** (AUTO)
> - **Chuyển động THỦ CÔNG duy nhất**: Kho Chính → Kho Bảo Hành (phiếu chuyển kho thủ công)
> - **Không còn RMA Staging**: Sản phẩm RMA trực tiếp OUT OF SYSTEM khi đánh dấu "Đã gửi"

### Checklist Hoàn thành Demo

**Happy Path Tests:**

- [ ] **[TC-CAT-001] Test 0:** Thêm sản phẩm mới vào catalog
- [ ] **[TC-INV-001] Test 1:** Nhập kho 100 sản phẩm thành công
- [ ] **[TC-CUS-001] Test 1B:** Tạo khách hàng mới thành công
- [ ] **[TC-INV-002] Test 1C:** *(OPTIONAL)* Chuyển kho thủ công Kho Chính → Kho Bảo Hành
- [ ] **[TC-SALE-001] Test 2:** Xuất bán 60 sản phẩm, hóa đơn in OK
- [ ] **[TC-WRN-001] Test 3:** Tạo phiếu dịch vụ, auto xác minh BH
- [ ] **[TC-WRN-002] Test 4:** Technician hoàn thành workflow tasks, sửa thành công
- [ ] **[TC-WRN-003] Test 5A:** Hết BH, không sửa được → Trả lại khách
- [ ] **[TC-WRN-004] Test 5B:** Còn BH, không sửa được → Warranty Replacement
- [ ] **[TC-RMA-001] Test 6:** RMA cycle hoàn chỉnh, SP OUT OF SYSTEM

**Negative & Edge Case Tests:**

- [ ] **[TC-NEG-001]** Nhập kho serial trùng → Block
- [ ] **[TC-NEG-002]** Bán hàng vượt tồn kho → Block
- [ ] **[TC-NEG-003]** Tạo BH serial chưa bán → Block
- [ ] **[TC-NEG-004]** Tạo BH trùng (serial đang có phiếu mở) → Block
- [ ] **[TC-NEG-005]** Hủy phiếu giữa chừng → Rollback kho đúng
- [ ] **[TC-NEG-006]** Bán serial đang sửa chữa → Block
- [ ] **[TC-NEG-007]** Thêm serial không hợp lệ vào RMA → Block
- [ ] **[TC-NEG-008]** Chuyển kho vượt số lượng → Block
- [ ] **[TC-CONC-001]** Concurrent access → Data integrity OK

---

**Liên hệ hỗ trợ:**
- Email: support@sstc.vn
- Hotline: 1900-xxxx

---

_Tài liệu này được tạo cho: Công ty Cổ phần Công nghệ SSTC_
_Ngày cập nhật: 2026-02-05_
_Phiên bản: 5.1 - QC Review: Tối ưu cấu trúc, bổ sung Negative Tests_

**Thay đổi chính v5.1:**
- **Thêm Test IDs** cho tất cả test cases (format: TC-[Module]-[Số])
- **Thêm 9 Negative Test Cases** (TC-NEG-001 → TC-NEG-008, TC-CONC-001) cho kiểm tra lỗi/biên
- **Thêm section Môi trường Test** và mẫu ghi kết quả Pass/Fail
- **Gom tất cả Issues** vào bảng ISSUES TỔNG HỢP (20 issues), inline chỉ giữ reference
- **Sửa lỗi số liệu tồn kho**: Tách rõ Sau Test 5A / Sau Test 5B, sửa Kho Chính Test 5A (39→40)
- **Bổ sung hướng dẫn chuẩn bị dữ liệu** cho Test 5A (giả lập hết BH)
- **Chuyển Issues SĐT/Email validation** sang [Improvements](./improvements-feature-requests.md#-improvement-2-validation-cho-số-điện-thoại-và-email)
- **Sửa lỗi đánh số bước trùng** trong Test 3 (Bước 1)
- **Đồng bộ phiên bản** header (3.1 → 5.0 → 5.1)
- **Thêm concurrent test** (TC-CONC-001)

**Thay đổi chính v5.0:**
- **Tách Test 5 thành 2 luồng riêng biệt theo kết quả bảo hành:**
  - **Test 5A**: Hết bảo hành, không sửa được → **Trả lại khách** (Return to Customer)
  - **Test 5B**: Còn bảo hành, không sửa được → **Đổi mới** (Warranty Replacement)
- Tổng số luồng test: **9 → 10 luồng**
- Cập nhật bảng tóm tắt và quy tắc di chuyển kho
- Cập nhật checklist hoàn thành demo

**Thay đổi chính v4.1:**
- Giảm từ 7 xuống **5 loại kho ảo** (bỏ RMA Staging và Parts)
- **Bỏ cột "Mã Kho"** trong bảng 5 Loại Kho Ảo
- **Chuẩn hóa tên kho**: Sử dụng tên tiếng Việt chính thức trong toàn bộ document
- Thêm bảng **"Khi nào TĂNG/GIẢM tồn kho"** cho từng kho ảo
- Phân biệt rõ chuyển động **AUTO vs THỦ CÔNG**
- **RMA không qua RMA Staging** - trực tiếp OUT OF SYSTEM khi đánh dấu "Đã gửi"
- **Quy trình RMA mới (2-bước)**:
  1. Tạo lô RMA với thông tin vận chuyển (Nhà cung cấp, Ngày dự kiến, Mã vận đơn, Ghi chú)
  2. Vào chi tiết lô → Thêm sản phẩm/serial vào lô RMA
- Thêm **Test 1C (OPTIONAL)**: Chuyển kho thủ công Kho Chính → Kho Bảo Hành
