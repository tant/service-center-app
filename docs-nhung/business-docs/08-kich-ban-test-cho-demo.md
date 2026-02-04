# 8. KỊCH BẢN TEST CHO DEMO ⭐

> **Tài liệu này:** Hướng dẫn chi tiết 6 luồng test cho buổi demo với client
> **Tham chiếu:** [Tài liệu Quy trình Nghiệp vụ Chính](./03-quy-trinh-nghiep-vu-chinh.md)
> **Mục tiêu:** Client có thể follow từng bước test và hiểu rõ quy trình nghiệp vụ

---

## 8.1. Giới thiệu

Section này map 6 luồng test mà client sẽ thực hiện trong buổi demo với các quy trình đã mô tả trong document. Mỗi luồng test đều có link đến section tương ứng để dễ dàng tham khảo chi tiết.

**Mục tiêu:** Client có thể follow từng bước test một cách tuần tự và hiểu rõ quy trình nghiệp vụ.

---

## 8.2. Luồng Test 1: Nhập kho hàng mới (100 cái)

**Mục tiêu test:** Kiểm tra quy trình nhập kho với serial number tracking

**Tham khảo:** [Section 4.3 - Quy trình Nhập Kho](./03-quy-trinh-nghiep-vu-chinh.md#43-quy-trình-nhập-kho-stock-receipt)

**Các bước test:**

```
✅ BƯỚC 1: Tạo Phiếu Nhập Kho
   - Vào menu "Quản lý Kho" → "Nhập Kho"
   - Chọn nhà cung cấp
   - Chọn kho đích: "Kho Công ty" → "Kho Chính (Main)"

✅ BƯỚC 2: Thêm sản phẩm
   - Sản phẩm: ZOTAC RTX 4090 24GB
   - Số lượng: 100 cái
   - Kho ảo: Kho Chính (Main)

✅ BƯỚC 3: Nhập 100 Serial Numbers
   - ABC123456701
   - ABC123456702
   - ...
   - ABC123456800

✅ BƯỚC 4: Nhập thông tin bảo hành
   - Bảo hành hãng: 36 tháng (đến 01/02/2029)
   - Bảo hành công ty: 48 tháng (đến 01/02/2030)

✅ BƯỚC 5: Xác nhận nhập kho
   - Click "Xác nhận nhập kho"
   - Hệ thống tạo 100 bản ghi Physical Product

✅ BƯỚC 6: Kiểm tra kết quả
   - Vào "Quản lý Kho" → "Xem tồn kho"
   - Kho Chính (Main) phải có: 100 RTX 4090
   - Có thể tra cứu từng serial: ABC123456701 → Thấy thông tin đầy đủ
```

**Kết quả mong đợi:**
- ✅ 100 sản phẩm được nhập vào Kho Chính
- ✅ Mỗi sản phẩm có serial riêng biệt
- ✅ Thông tin bảo hành được lưu chính xác
- ✅ Tồn kho cập nhật: Main = 100

---

## 8.3. Luồng Test 2: Xuất bán cho khách (60 cái)

**Mục tiêu test:** Kiểm tra quy trình bán hàng và di chuyển sản phẩm từ kho → khách hàng

**Tham khảo:** [Section 4.7 - Quy trình Bán hàng](./03-quy-trinh-nghiep-vu-chinh.md#47-quy-trình-bán-hàng--mới) ⭐ MỚI

**Các bước test:**

```
✅ BƯỚC 1: Tạo Đơn bán hàng
   - Vào "Quản lý Kho" → "Xuất Kho"
   - Chọn loại: "Bán hàng" (Sales)

✅ BƯỚC 2: Nhập thông tin khách hàng
   - Họ tên: Nguyễn Văn A
   - Số điện thoại: 0912345678
   - Email: nguyenvana@email.com

✅ BƯỚC 3: Chọn sản phẩm
   - Sản phẩm: ZOTAC RTX 4090 24GB
   - Số lượng: 60 cái
   - Kho nguồn: Kho Chính (Main)

✅ BƯỚC 4: Chọn Serial Numbers
   - Chọn 60 serials đầu tiên: ABC123456701 → ABC123456760
   - Hoặc click "Chọn tất cả 60 đầu tiên"

✅ BƯỚC 5: Xác nhận bán
   - Kiểm tra thông tin đơn hàng
   - Click "Xác nhận xuất kho"
   - In hóa đơn cho khách

✅ BƯỚC 6: Kiểm tra kết quả
   - Kho Chính (Main): 100 → 40 cái ✅
   - Hàng Đã Bán (Customer Installed): +60 cái ✅
   - Tra cứu serial ABC123456701:
     + Trạng thái: Đã bán
     + Khách hàng: Nguyễn Văn A (0912345678)
     + Vị trí: Customer Installed
```

**Kết quả mong đợi:**
- ✅ Kho Chính còn: 40 sản phẩm (serials: 761-800)
- ✅ 60 sản phẩm chuyển sang "Hàng Đã Bán"
- ✅ 60 serials (701-760) link với khách hàng Nguyễn Văn A
- ✅ Khách có thể dùng serial để kiểm tra bảo hành online

**🤖 Quy tắc Tự động:** [Section 4.6.1 - Quy tắc #7](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động--mới)
- Khi xác nhận bán → Hệ thống TỰ ĐỘNG chuyển 60 serials: Main → Customer Installed
- Không cần thao tác thủ công di chuyển kho

---

## 8.4. Luồng Test 3: Lấy serial đã bán để nhập vào bảo hành

**Mục tiêu test:** Kiểm tra quy trình khách hàng tạo yêu cầu dịch vụ và xác minh bảo hành

**Tham khảo:**
- [Section 2.2 - Khách hàng Tạo Yêu cầu](./03-quy-trinh-nghiep-vu-chinh.md#22-bước-1-khách-hàng-tạo-yêu-cầu-dịch-vụ-service-request)
- [Section 2.3 - Lễ tân Chuyển đổi](./03-quy-trinh-nghiep-vu-chinh.md#23-bước-2-lễ-tân-xem-xét-và-chuyển-đổi-yêu-cầu)
- [Section 3.2 - Xác minh Bảo hành](./03-quy-trinh-nghiep-vu-chinh.md#32-quy-trình-xác-minh-bảo-hành)

**Các bước test:**

```
✅ BƯỚC 1: Khách hàng truy cập Portal công khai
   - Không cần đăng nhập
   - Vào trang "Tạo Yêu cầu Dịch vụ"

✅ BƯỚC 2: Xác minh bảo hành
   - Nhập serial: ABC123456701 (serial đã bán ở Test 2)
   - Hệ thống TỰ ĐỘNG hiển thị:
     🟢 Serial hợp lệ
     Sản phẩm: ZOTAC RTX 4090
     Bảo hành hãng: Còn hiệu lực đến 01/02/2029
     Bảo hành công ty: Còn hiệu lực đến 01/02/2030

✅ BƯỚC 3: Điền thông tin yêu cầu
   - Họ tên, SĐT tự động điền (vì đã mua hàng)
   - Mô tả lỗi: "Card không lên màn hình, có tiếng beep 3 lần"
   - Upload ảnh (tùy chọn)

✅ BƯỚC 4: Gửi yêu cầu
   - Click "Gửi yêu cầu"
   - Nhận mã tracking: SR-20260204-00001
   - Nhận email xác nhận

✅ BƯỚC 5: Lễ tân xem xét (Nội bộ)
   - Đăng nhập hệ thống với role "Reception"
   - Vào "Yêu cầu Dịch vụ" → Xem danh sách mới
   - Click vào SR-20260204-00001
   - Gọi điện xác nhận khách: 0912345678
   - Cập nhật trạng thái: "received"

✅ BƯỚC 6: Khách mang sản phẩm đến → Chuyển đổi thành Ticket
   - Click "Chuyển đổi thành Phiếu Bảo hành"
   - Hệ thống tự động tạo Service Ticket: SV-2026-001
   - Thông tin tự động điền sẵn:
     + Khách hàng: Nguyễn Văn A
     + Sản phẩm: ZOTAC RTX 4090
     + Serial: ABC123456701
     + Loại dịch vụ: Warranty (Bảo hành)
   - Chọn workflow: "Bảo hành ZOTAC RTX 4090"
   - Gán kỹ thuật viên (hoặc để Manager gán sau)
   - Xác nhận tạo phiếu

✅ BƯỚC 7: Kiểm tra kết quả
   - Phiếu SV-2026-001 được tạo với trạng thái: pending
   - Serial ABC123456701 di chuyển kho:
     Từ: Customer Installed
     Đến: In-Service (Kho Đang Sửa Chữa)
   - Workflow tasks tự động được tạo
```

**Kết quả mong đợi:**
- ✅ Service Request SR-20260204-00001 được tạo thành công
- ✅ Xác minh bảo hành tự động (không cần kiểm tra thủ công)
- ✅ Service Ticket SV-2026-001 được tạo với đầy đủ thông tin
- ✅ Sản phẩm ABC123456701 chuyển từ Customer → In-Service
- ✅ Workflow tasks sẵn sàng cho technician thực hiện

**🤖 Quy tắc Tự động:** [Section 4.6.1 - Quy tắc #1](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động--mới)
- Khi chuyển đổi SR → Ticket → Hệ thống TỰ ĐỘNG chuyển: Customer Installed → In-Service
- Không cần Manager thao tác thủ công di chuyển kho

---

## 8.5. Luồng Test 4: Kiểm tra các mục trong phiếu bảo hành

**Mục tiêu test:** Kiểm tra workflow tasks và quy trình kỹ thuật viên thực hiện công việc

**Tham khảo:**
- [Section 2.4 - Kỹ thuật viên Thực hiện](./03-quy-trinh-nghiep-vu-chinh.md#24-bước-3-kỹ-thuật-viên-thực-hiện-công-việc)
- [Section 5.4 - Hộp Công việc Cá nhân](./03-quy-trinh-nghiep-vu-chinh.md#54-hộp-công-việc-cá-nhân-personal-task-inbox)

**Các bước test:**

```
✅ BƯỚC 1: Đăng nhập với role "Technician"
   - User: Kỹ thuật viên A
   - Vào menu "Hộp công việc của tôi" (My Tasks)

✅ BƯỚC 2: Xem phiếu được gán
   - Hiển thị danh sách phiếu: SV-2026-001
   - Priority: Normal
   - Customer: Nguyễn Văn A
   - Sản phẩm: ZOTAC RTX 4090 (ABC123456701)

✅ BƯỚC 3: Click vào phiếu → Xem Workflow Tasks
   Danh sách tasks (Ví dụ: Workflow "Bảo hành ZOTAC RTX 4090"):

   ☐ Task 1: Kiểm tra bao bì và phụ kiện (5 phút) - Pending
   ☐ Task 2: Chụp ảnh tình trạng ban đầu (5 phút) - Blocked
   ☐ Task 3: Kiểm tra nguồn card (10 phút) - Blocked
   ☐ Task 4: Test stress GPU 30 phút (35 phút) - Blocked
   ☐ Task 5: Vệ sinh card (20 phút) - Blocked (không bắt buộc)
   ☐ Task 6: Chụp ảnh sau sửa chữa (5 phút) - Blocked

   (Chỉ Task 1 là Pending, các task khác Blocked vì bắt buộc tuần tự)

✅ BƯỚC 4: Thực hiện Task 1
   - Click "Bắt đầu" → Task chuyển: In Progress
   - Làm việc theo hướng dẫn
   - Nhập ghi chú: "Hộp nguyên vẹn, đầy đủ phụ kiện"
   - Click "Hoàn thành" → Task chuyển: Completed
   - Task 2 tự động chuyển: Pending

✅ BƯỚC 5: Thực hiện Task 2 (Yêu cầu ảnh)
   - Click "Bắt đầu"
   - Upload ảnh: card-truoc.jpg, card-sau.jpg
   - Nhập ghi chú: "Chụp 4 góc card, không thấy vết hư hỏng ngoại quan"
   - Click "Hoàn thành"
   - Task 3 tự động chuyển: Pending

✅ BƯỚC 6: Thực hiện các tasks tiếp theo
   - Task 3: Kiểm tra nguồn → Ghi chú kết quả
   - Task 4: Test stress → Ghi chú + Upload ảnh kết quả test
   - Task 5: Vệ sinh (không bắt buộc) → Có thể Skip
   - Task 6: Chụp ảnh cuối → Upload ảnh sau sửa

✅ BƯỚC 7: Kiểm tra tiến độ
   - Xem progress bar: 5/6 tasks completed (83%)
   - Khi hoàn thành task cuối → Phiếu tự động chuyển: ready_for_pickup
   - Email tự động gửi khách: "Sản phẩm đã sửa xong"
```

**Kết quả mong đợi:**
- ✅ Tasks hiển thị đúng thứ tự (tuần tự)
- ✅ Chỉ task hiện tại là Pending, các task sau là Blocked
- ✅ Task yêu cầu ghi chú/ảnh → Bắt buộc nhập mới được hoàn thành
- ✅ Khi hoàn thành task → Task tiếp theo tự động Pending
- ✅ Progress bar cập nhật realtime
- ✅ Hoàn thành tất cả → Phiếu chuyển ready_for_pickup

**🤖 Quy tắc Tự động:** [Section 4.6.1 - Quy tắc #2](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động--mới)
- Khi hoàn thành tất cả tasks và phiếu sửa chữa thành công (outcome: Repaired) → Hệ thống TỰ ĐỘNG chuyển: In-Service → Customer Installed
- Sản phẩm ABC123456701 tự động trở về "Hàng Đã Bán" (sẵn sàng giao cho khách)

---

## 8.6. Luồng Test 5: Duyệt phiếu bảo hành và xuất trả bằng sản phẩm khác

**Mục tiêu test:** Kiểm tra quy trình RMA và thay thế sản phẩm (Warranty Replacement)

**Tham khảo:**
- [Section 3.3.2 - Quy trình RMA Chi tiết](./03-quy-trinh-nghiep-vu-chinh.md#332-quy-trình-rma-chi-tiết)
- [Section 6.4 - Kịch bản 3: Bảo hành Đổi trả](./03-quy-trinh-nghiep-vu-chinh.md#64-kịch-bản-3-bảo-hành-đổi-trả-warranty-replacement)

**Giả định:** Kỹ thuật viên chẩn đoán → Không sửa được, cần đổi mới

**Các bước test:**

```
✅ BƯỚC 1: Technician đánh dấu "Không sửa được"
   - Vào phiếu SV-2026-001
   - Thực hiện tasks → Kết luận: Card hỏng nặng, không sửa được
   - Chọn Outcome: "Unrepairable" (Không sửa được)
   - Nhập lý do: "Chip GPU hỏng, không thể khắc phục"
   - Submit để Manager review

✅ BƯỚC 2: Manager xem xét và duyệt RMA
   - Đăng nhập với role "Manager"
   - Vào phiếu SV-2026-001
   - Xem kết quả chẩn đoán của technician
   - Quyết định: "Warranty Replacement" (Đổi sản phẩm mới)
   - Click "Duyệt đổi mới"

✅ BƯỚC 3: Chọn sản phẩm thay thế
   Hệ thống hiển thị:
   ┌────────────────────────────────────┐
   │ CHỌN SẢN PHẨM THAY THẾ             │
   ├────────────────────────────────────┤
   │ Kho: Kho Chính (Main)              │
   │ Sản phẩm: ZOTAC RTX 4090 24GB      │
   │ Số lượng khả dụng: 40 cái ✅       │
   │                                    │
   │ Danh sách Serial khả dụng:         │
   │ ⚪ ABC123456761 (New, BH: 01/02/29)│
   │ ⚪ ABC123456762 (New, BH: 01/02/29)│
   │ ⚪ ABC123456763 (New, BH: 01/02/29)│
   │ ...                                │
   └────────────────────────────────────┘

   - Chọn serial thay thế: ABC123456761
   - Click "Xác nhận thay thế"

✅ BƯỚC 4: Hệ thống TỰ ĐỘNG xử lý

   A) Sản phẩm LỖI (ABC123456701):
      Từ: In-Service (Kho Đang Sửa Chữa)
      Đến: Dead Stock (Kho Hàng Hỏng)

   B) Sản phẩm THAY THẾ (ABC123456761):
      Từ: Main (Kho Chính)
      Đến: Customer Installed (Hàng Đã Bán)

   C) Tạo Stock Issue (Phiếu xuất kho)
   D) Link serial thay thế vào phiếu SV-2026-001
   E) Đánh dấu outcome: "Warranty Replacement"
   F) Cập nhật tồn kho:
      Main: 40 → 39 cái
      Dead Stock: +1 cái (serial 701)

✅ BƯỚC 5: Tạo RMA Batch (để gửi về hãng)
   - Manager vào "Quản lý RMA"
   - Click "Tạo RMA Batch"
   - Chọn sản phẩm lỗi: ABC123456701
   - Mã lô: RMA-20260204-001
   - Xác nhận tạo lô

   → Sản phẩm 701 chuyển:
     Từ: Dead Stock
     Đến: RMA Staging (Kho Chờ Trả Hàng)

✅ BƯỚC 6: Giao sản phẩm thay thế cho khách
   - In phiếu giao hàng với serial mới: ABC123456761
   - Khách ký nhận
   - Xác nhận giao hàng trong hệ thống
   - Phiếu SV-2026-001 chuyển: Completed

✅ BƯỚC 7: Kiểm tra kết quả
   - Phiếu SV-2026-001:
     + Outcome: Warranty Replacement
     + Serial cũ: ABC123456701 (ở RMA Staging)
     + Serial mới: ABC123456761 (đã giao khách)
   - Kho Chính: 39 cái còn lại (serials: 762-800)
   - Khách nhận sản phẩm mới với bảo hành đầy đủ
```

**Kết quả mong đợi:**
- ✅ Sản phẩm lỗi (701) chuyển vào RMA Staging
- ✅ Sản phẩm thay thế (761) xuất cho khách
- ✅ Kho Chính còn: 39 sản phẩm
- ✅ Phiếu đánh dấu: Warranty Replacement
- ✅ RMA Batch được tạo để gửi về hãng
- ✅ Khách nhận sản phẩm mới, có bảo hành đầy đủ

**🤖 Quy tắc Tự động:** [Section 4.6.1 - Quy tắc #4, #5, #6](./03-quy-trinh-nghiep-vu-chinh.md#461-quy-tắc-di-chuyển-kho-tự-động--mới)

BƯỚC 4 kích hoạt 2 quy tắc tự động:
- **Quy tắc #4:** Khi duyệt đổi mới (Warranty Replacement) → Sản phẩm lỗi TỰ ĐỘNG chuyển: In-Service → Dead Stock
- **Quy tắc #5:** Khi chọn sản phẩm thay thế → Sản phẩm thay thế TỰ ĐỘNG chuyển: Main → Customer Installed

BƯỚC 5 kích hoạt quy tắc thứ 3:
- **Quy tắc #6:** Khi tạo RMA Batch và thêm sản phẩm lỗi vào lô → Sản phẩm TỰ ĐỘNG chuyển: Dead Stock → RMA Staging

**Lưu ý:** Manager KHÔNG cần thao tác thủ công di chuyển kho ở 3 bước trên. Hệ thống tự động xử lý dựa trên nghiệp vụ.

---

## 8.7. Luồng Test 6: Test phần RMA để gửi sản phẩm hư về nhà máy

**Mục tiêu test:** Kiểm tra quy trình gửi sản phẩm lỗi về nhà máy và nhận hàng thay thế

**Tham khảo:** [Section 3.3.2 - Quy trình RMA Chi tiết](./03-quy-trinh-nghiep-vu-chinh.md#332-quy-trình-rma-chi-tiết)

**Tiếp tục từ Test 5** (đã có sản phẩm lỗi trong RMA Staging)

**Các bước test:**

```
✅ BƯỚC 1: Xem RMA Batch
   - Manager vào "Quản lý RMA" → "Danh sách RMA Batches"
   - Thấy lô: RMA-20260204-001
   - Trạng thái: Pending (chưa gửi)
   - Sản phẩm: 1 cái (ABC123456701)

✅ BƯỚC 2: Chuẩn bị gửi hàng về hãng
   - Click vào lô RMA-20260204-001
   - Xem chi tiết:
     + Serial: ABC123456701
     + Sản phẩm: ZOTAC RTX 4090
     + Lý do RMA: "Chip GPU hỏng"
     + Vị trí hiện tại: RMA Staging

✅ BƯỚC 3: In phiếu RMA
   - Click "In phiếu RMA"
   - Phiếu hiển thị:
     ┌────────────────────────────────┐
     │ PHIẾU RMA - GỬI VỀ NHÀ MÁY    │
     ├────────────────────────────────┤
     │ Mã lô: RMA-20260204-001        │
     │ Ngày tạo: 04/02/2026           │
     │                                │
     │ Gửi đến: ZOTAC Technology      │
     │                                │
     │ SẢN PHẨM:                      │
     │ - ZOTAC RTX 4090 24GB          │
     │ - Serial: ABC123456701         │
     │ - Lý do: Chip GPU hỏng         │
     │ - Phiếu BH: SV-2026-001        │
     │                                │
     │ Yêu cầu: Đổi sản phẩm mới      │
     └────────────────────────────────┘

✅ BƯỚC 4: Đóng gói và gửi hàng
   - Đóng gói sản phẩm lỗi (ABC123456701)
   - Đính kèm phiếu RMA
   - Gửi qua đơn vị vận chuyển

✅ BƯỚC 5: Cập nhật trạng thái "Đã gửi"
   - Vào lô RMA-20260204-001
   - Click "Đánh dấu đã gửi"
   - Nhập thông tin vận chuyển:
     + Tracking number: VN1234567890
     + Ngày gửi: 04/02/2026
     + Dự kiến nhận: 14/02/2026 (10 ngày)
   - Trạng thái chuyển: "Shipped" (Đã gửi)

   → Serial ABC123456701 di chuyển:
     Từ: RMA Staging
     Đến: [Ra khỏi hệ thống - đã gửi hãng]

✅ BƯỚC 6: Nhận hàng thay thế từ hãng
   (Giả lập sau 10 ngày)

   - Nhận 1 sản phẩm mới từ ZOTAC
   - Serial mới: ZTC999888777
   - Vào "Quản lý Kho" → "Nhập Kho"
   - Tạo Stock Receipt:
     + Sản phẩm: ZOTAC RTX 4090
     + Serial: ZTC999888777
     + Nguồn: RMA Return (Trả về từ hãng)
     + Kho đích: Main (Kho Chính)
     + Link với RMA Batch: RMA-20260204-001

✅ BƯỚC 7: Hoàn tất RMA Batch
   - Vào lô RMA-20260204-001
   - Click "Đánh dấu hoàn tất"
   - Nhập thông tin:
     + Serial nhận được: ZTC999888777
     + Ngày nhận: 14/02/2026
   - Trạng thái chuyển: "Completed" (Hoàn tất)

✅ BƯỚC 8: Kiểm tra kết quả
   - RMA Batch RMA-20260204-001: Completed ✅
   - Serial lỗi (ABC123456701): Đã gửi về hãng
   - Serial mới (ZTC999888777): Đã nhập Kho Chính
   - Kho Chính: 39 + 1 = 40 cái
   - Có thể dùng ZTC999888777 để thay thế cho khách tiếp theo
```

**Kết quả mong đợi:**
- ✅ RMA Batch được tạo và quản lý đầy đủ
- ✅ Phiếu RMA in được với thông tin đầy đủ
- ✅ Tracking trạng thái RMA: Pending → Shipped → Completed
- ✅ Sản phẩm lỗi ra khỏi hệ thống (đã gửi hãng)
- ✅ Sản phẩm thay thế từ hãng được nhập kho
- ✅ Tồn kho được cập nhật chính xác
- ✅ Có audit trail đầy đủ cho quy trình RMA

---

## 8.8. Tổng hợp 6 Luồng Test

**Bảng tóm tắt:**

| # | Luồng Test | Section tham khảo | Kết quả mong đợi | Thời gian ước tính |
|---|------------|-------------------|------------------|--------------------|
| **1** | Nhập kho 100 cái | [4.3](./03-quy-trinh-nghiep-vu-chinh.md#43-quy-trình-nhập-kho-stock-receipt) | Kho Chính: +100 | 10-15 phút |
| **2** | Xuất bán 60 cái | [4.7](./03-quy-trinh-nghiep-vu-chinh.md#47-quy-trình-bán-hàng--mới) ⭐ | Main: 40, Customer: 60 | 5-10 phút |
| **3** | Tạo BH từ serial | [2.2](./03-quy-trinh-nghiep-vu-chinh.md#22-bước-1-khách-hàng-tạo-yêu-cầu-dịch-vụ-service-request), [2.3](./03-quy-trinh-nghiep-vu-chinh.md#23-bước-2-lễ-tân-xem-xét-và-chuyển-đổi-yêu-cầu) | Service Request + Ticket | 5-10 phút |
| **4** | Thực hiện tasks | [2.4](./03-quy-trinh-nghiep-vu-chinh.md#24-bước-3-kỹ-thuật-viên-thực-hiện-công-việc), [5.4](./03-quy-trinh-nghiep-vu-chinh.md#54-hộp-công-việc-cá-nhân-personal-task-inbox) | Tasks completed | 15-20 phút |
| **5** | Đổi sản phẩm mới | [3.3.2](./03-quy-trinh-nghiep-vu-chinh.md#332-quy-trình-rma-chi-tiết), [6.4](./03-quy-trinh-nghiep-vu-chinh.md#64-kịch-bản-3-bảo-hành-đổi-trả-warranty-replacement) | Main: 39, Thay thế thành công | 10-15 phút |
| **6** | RMA về hãng | [3.3.2](./03-quy-trinh-nghiep-vu-chinh.md#332-quy-trình-rma-chi-tiết) | RMA Completed, Kho cập nhật | 10-15 phút |

**Tổng thời gian demo:** 55-85 phút (khoảng 1-1.5 giờ)

