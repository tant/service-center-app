### **Bước 8: Task Types (BẮT BUỘC - để định nghĩa quy trình)**

**Trang**: `/workflows/task-types`

**Dữ liệu gợi ý**: Danh sách đầy đủ các công việc có thể có tại trung tâm bảo hành

**Các trường dữ liệu cần nhập cho Task Type**:
- **Name** (Bắt buộc): Tên task (ví dụ: "Tiếp nhận sản phẩm")
- **Description**: Mô tả chi tiết công việc
- **Category**: Nhóm task (Reception, Diagnosis, Repair, QC, Delivery, Warehouse, Communication, Waiting...)
- **Estimated Duration (Minutes)**: Thời gian dự kiến (phút)
- **Requires Notes**: Task này có yêu cầu ghi chú không? (✅ Yes / ❌ No)
- **Requires Photo**: Task này có yêu cầu chụp ảnh không? (✅ Yes / ❌ No)
- **Is Active**: Có đang sử dụng không? (mặc định: Yes)

| STT | Tên Task | Category | Duration (phút) | Requires Notes | Requires Photo | Đề xuất | Mô tả |
|-----|----------|----------|-----------------|----------------|----------------|---------|-------|
| **TIẾP NHẬN (Reception)** |
| 1 | Tiếp nhận sản phẩm | Reception | 10 | ✅ Yes | ✅ Yes | **Bắt buộc** | Nhận sản phẩm từ khách, kiểm tra ngoại quan ban đầu |
| 2 | Kiểm tra ban đầu | Inspection | 15 | ✅ Yes | ✅ Yes | **Bắt buộc** | Kiểm tra tình trạng bên ngoài, phụ kiện đi kèm |
| 3 | Chụp ảnh sản phẩm nhận | Documentation | 5 | ❌ No | ✅ Yes | Khuyến nghị | Chụp ảnh sản phẩm lúc nhận để tránh tranh chấp |
| 4 | Kiểm tra bảo hành | Verification | 5 | ✅ Yes | ❌ No | **Bắt buộc** | Kiểm tra serial, ngày mua, tình trạng bảo hành |
| **CHẨN ĐOÁN (Diagnosis)** |
| 5 | Chẩn đoán lỗi | Diagnosis | 30 | ✅ Yes | ❌ No | **Bắt buộc** | Xác định nguyên nhân lỗi chính xác |
| 6 | Test phần cứng | Testing | 20 | ✅ Yes | ❌ No | **Bắt buộc** | Test CPU, RAM, VGA, SSD... bằng công cụ |
| 7 | Test phần mềm | Testing | 15 | ✅ Yes | ❌ No | Khuyến nghị | Kiểm tra driver, firmware, hệ điều hành |
| 8 | Test stress | Testing | 60 | ✅ Yes | ❌ No | Tùy chọn | Test sản phẩm dưới tải nặng kéo dài |
| 9 | Báo giá sửa chữa | Quotation | 10 | ✅ Yes | ❌ No | **Bắt buộc** | Báo giá chi phí sửa chữa cho khách (nếu trả phí) |
| **SỬA CHỮA (Repair)** |
| 10 | Sửa chữa phần cứng | Repair | 45 | ✅ Yes | ✅ Yes | **Bắt buộc** | Hàn, sửa chữa bo mạch, thay linh kiện điện tử |
| 11 | Thay linh kiện VGA | Repair | 30 | ✅ Yes | ✅ Yes | **Bắt buộc** | Thay fan, capacitor, HDMI port... |
| 12 | Cài đặt phần mềm | Software | 20 | ✅ Yes | ❌ No | Khuyến nghị | Cài driver, firmware, cập nhật BIOS |
| 13 | Backup dữ liệu | Data | 30 | ✅ Yes | ❌ No | Khuyến nghị | Sao lưu dữ liệu khách trước khi sửa |
| 14 | Restore dữ liệu | Data | 30 | ✅ Yes | ❌ No | Khuyến nghị | Khôi phục dữ liệu sau khi sửa xong |
| 15 | Vệ sinh sản phẩm | Cleaning | 15 | ❌ No | ❌ No | Tùy chọn | Vệ sinh bụi bẩn, làm sạch sản phẩm |
| 16 | Thay keo tản nhiệt | Maintenance | 10 | ❌ No | ❌ No | Tùy chọn | Thay thermal paste cho VGA, CPU |
| **THAY THẾ (Replacement)** |
| 17 | Thay thế sản phẩm | Replacement | 20 | ✅ Yes | ✅ Yes | **Bắt buộc** | Thay thế toàn bộ sản phẩm từ kho bảo hành |
| 18 | Xuất kho bảo hành | Warehouse | 10 | ✅ Yes | ❌ No | **Bắt buộc** | Xuất sản phẩm mới từ warranty_stock |
| **RMA (Return Merchandise Authorization)** |
| 19 | Nhập kho RMA | Warehouse | 10 | ✅ Yes | ✅ Yes | **Bắt buộc** | Chuyển sản phẩm lỗi đã được kỹ thuật viên xác định cần RMA vào kho `rma_staging`. |
| 20 | Tạo lô RMA | Documentation | 15 | ✅ Yes | ❌ No | **Bắt buộc** | Tạo một lô RMA mới để nhóm các sản phẩm lỗi chờ trả về nhà cung cấp, xác định một đợt ship hàng. |
| 21 | Chuẩn bị & Gửi lô RMA | Logistics | 30 | ✅ Yes | ✅ Yes | **Bắt buộc** | Vệ sinh, sắp xếp, đóng gói các sản phẩm vật lý trong lô RMA đã tạo và đánh dấu lô đã được gửi đi. (Điểm đo KPI: Thời gian hoàn thành và số lượng sản phẩm). |
| **KIỂM TRA CHẤT LƯỢNG (QC)** |
| 22 | Kiểm tra sau sửa | QC | 20 | ✅ Yes | ❌ No | **Bắt buộc** | Test sản phẩm sau khi sửa chữa xong |
| 23 | Test ổn định | QC | 30 | ✅ Yes | ❌ No | Khuyến nghị | Test sản phẩm chạy ổn định trong 30 phút |
| 24 | Kiểm tra cuối cùng | QC | 15 | ✅ Yes | ✅ Yes | **Bắt buộc** | Kiểm tra toàn diện trước khi giao khách |
| 25 | Chụp ảnh kết quả | Documentation | 5 | ❌ No | ✅ Yes | Khuyến nghị | Chụp ảnh sản phẩm sau sửa, kết quả test |
| **GIAO HÀNG (Delivery)** |
| 26 | Thông báo khách hàng | Communication | 5 | ✅ Yes | ❌ No | **Bắt buộc** | Gọi điện/nhắn tin thông báo sản phẩm đã xong |
| 27 | Đóng gói sản phẩm | Packaging | 10 | ❌ No | ❌ No | **Bắt buộc** | Đóng gói cẩn thận, đính kèm phụ kiện |
| 28 | Giao hàng | Delivery | 15 | ✅ Yes | ❌ No | **Bắt buộc** | Giao sản phẩm cho khách, thu tiền (nếu có) |
| 29 | Hướng dẫn sử dụng | Support | 10 | ❌ No | ❌ No | Tùy chọn | Hướng dẫn khách cách sử dụng, bảo quản |
| **QUẢN LÝ KHO (Warehouse)** |
| 30 | Nhập kho hàng mới | Warehouse | 30 | ✅ Yes | ❌ No | **Bắt buộc** | Tạo GRN, nhập sản phẩm bảo hành vào kho |
| 31 | Nhập serial number | Warehouse | 45 | ✅ Yes | ❌ No | **Bắt buộc** | Nhập serial cho từng sản phẩm trong GRN |
| 32 | Kiểm kê kho | Warehouse | 120 | ✅ Yes | ❌ No | Khuyến nghị | Kiểm kê định kỳ tồn kho, đối chiếu số liệu |
| 33 | Chuyển kho | Warehouse | 15 | ✅ Yes | ❌ No | Tùy chọn | Chuyển sản phẩm giữa các kho vật lý |
| **KHÁC (Others)** |
| 34 | Chờ phụ tùng | Waiting | - | ✅ Yes | ❌ No | Tùy chọn | Đánh dấu đang chờ linh kiện về |
| 35 | Chờ phê duyệt | Approval | - | ✅ Yes | ❌ No | Tùy chọn | Chờ manager phê duyệt báo giá/thay thế |
| 36 | Liên hệ nhà cung cấp | Communication | 15 | ✅ Yes | ❌ No | Tùy chọn | Liên hệ ZOTAC, SSTC về bảo hành, RMA |
| 37 | Chờ khách quyết định | Waiting | - | ✅ Yes | ❌ No | Tùy chọn | Chờ khách xác nhận có sửa/không sửa |
| 38 | Yêu cầu thêm thông tin từ khách | Communication | 5 | ✅ Yes | ❌ No | Tùy chọn | Gửi yêu cầu (email/tin nhắn) cho khách hàng để làm rõ thêm về tình trạng lỗi hoặc thông tin cần thiết khác. |
| 39 | Chờ phản hồi từ khách | Waiting | - | ✅ Yes | ❌ No | Tùy chọn | Đánh dấu ticket đang tạm dừng để chờ thông tin phản hồi từ khách hàng. |
| 40 | Nâng cấp theo yêu cầu | Service | 30 | ✅ Yes | ✅ Yes | Tùy chọn | Thực hiện các yêu cầu nâng cấp (ví dụ: thêm RAM, đổi SSD) không nằm trong phạm vi bảo hành. |
| 41 | Tạo hóa đơn dịch vụ | Billing | 10 | ✅ Yes | ❌ No | Tùy chọn | Tạo và xuất hóa đơn chi tiết cho các dịch vụ sửa chữa có tính phí hoặc chi phí nâng cấp. |

---

**Ghi chú**:
- **Bắt buộc**: Các công việc không thể thiếu trong workflow, nên tạo ngay
- **Khuyến nghị**: Các công việc quan trọng, giúp quy trình chuyên nghiệp hơn
- **Tùy chọn**: Các công việc không cấp thiết, tùy vào nhu cầu cụ thể

**Hướng dẫn tạo**:
1. Tạo tất cả task types **Bắt buộc** trước (19 tasks) - Không thể thiếu
2. Tạo thêm task types **Khuyến nghị** nếu muốn quy trình chuyên nghiệp (10 tasks)
3. Tạo task types **Tùy chọn** khi cần thiết (12 tasks)

**Lưu ý**: Task Types là nền tảng để xây dựng Task Templates ở bước tiếp theo. Không có Task Types thì không thể tạo Templates!

---

### **Bước 9: Task Templates (BẮT BUỘC - để tổ chức hoạt động)**

**Trang**: `/workflows/templates`

**Dữ liệu gợi ý**: Các workflow phổ biến trong trung tâm bảo hành SSTC

**Các trường dữ liệu cần nhập cho Task Template**:
- **Name** (Bắt buộc): Tên template (ví dụ: "Sửa chữa VGA - Thay linh kiện")
- **Description**: Mô tả chi tiết quy trình
- **Product**: Chọn sản phẩm áp dụng (ví dụ: ZOTAC RTX 4070 Gaming)
- **Service Type**: Loại dịch vụ (Warranty, Paid Service, Out of Warranty)
- **Enforce Sequence**: Có bắt buộc tuân thủ thứ tự không? (true/false)
- **Created By**: Admin hoặc Manager tạo template
- **Is Active**: Có đang sử dụng không? (mặc định: Yes)

**Cấu hình Tasks trong Template** (Junction table: task_templates_tasks):
- **Task Type**: Chọn task type từ danh sách đã tạo ở Bước 9
- **Sequence Order**: Thứ tự task (1, 2, 3...)
- **Is Required**: Task này bắt buộc phải hoàn thành không? (✅ Yes / ❌ No)
- **Custom Instructions**: Ghi chú/hướng dẫn riêng cho task này trong template

---

#### **Template 1: Quy trình sửa chữa VGA (Repair với Parts)**
- **Name**: `Sửa chữa VGA - Thay linh kiện`
- **Description**: `Quy trình sửa chữa card đồ họa bằng cách thay thế linh kiện hỏng (fan, capacitor, HDMI port). Áp dụng cho các lỗi phần cứng nhỏ có thể sửa được.`
- **Product**: `ZOTAC RTX 4070 Gaming`
- **Service Type**: `Warranty`
- **Enforce Sequence**: `false` (không bắt buộc tuân thủ thứ tự)
- **Created By**: `Manager` (hoặc Admin)
- **Khi nào dùng**: VGA có lỗi phần cứng nhỏ (fan hỏng, capacitor chết, HDMI port lỏng) có thể sửa bằng linh kiện

**Tasks trong template**:
1. **Tiếp nhận sản phẩm** - Required ✅ - Ghi chú: "Kiểm tra số serial, phụ kiện đi kèm"
2. **Kiểm tra ban đầu** - Required ✅
3. **Chụp ảnh sản phẩm nhận** - Optional ❌ - Ghi chú: "Chụp 6 mặt sản phẩm để tránh tranh chấp"
4. **Kiểm tra bảo hành** - Required ✅
5. **Chẩn đoán lỗi** - Required ✅ - Ghi chú: "Ghi rõ nguyên nhân lỗi, linh kiện hỏng"
6. **Test phần cứng** - Required ✅
7. **Sửa chữa phần cứng** - Required ✅ - Ghi chú: "Hàn linh kiện điện tử, sửa chữa bo mạch"
8. **Thay linh kiện VGA** - Required ✅ - Ghi chú: "Cập nhật parts đã sử dụng vào ticket"
9. **Vệ sinh sản phẩm** - Optional ❌
10. **Thay keo tản nhiệt** - Optional ❌ - Ghi chú: "Chỉ thay nếu keo cũ khô/hỏng"
11. **Kiểm tra sau sửa** - Required ✅
12. **Test ổn định** - Optional ❌ - Ghi chú: "Chạy stress test 30 phút để đảm bảo ổn định"
13. **Kiểm tra cuối cùng** - Required ✅
14. **Chụp ảnh kết quả** - Optional ❌
15. **Thông báo khách hàng** - Required ✅
16. **Đóng gói sản phẩm** - Required ✅
17. **Giao hàng** - Required ✅

**Ước tính tổng thời gian**: ~4-5 giờ

**Lưu ý**:
- ✅ **Required**: Task bắt buộc phải hoàn thành
- ❌ **Optional**: Task không bắt buộc, có thể bỏ qua
- **Ghi chú** sẽ được lưu vào trường `custom_instructions` của từng task

---

#### **Template 2: Quy trình thay thế VGA (Replacement với Physical Products)**
- **Name**: `Thay thế VGA - Xuất kho bảo hành`
- **Description**: `Quy trình thay thế toàn bộ card đồ họa bằng sản phẩm mới từ kho bảo hành. Áp dụng khi lỗi quá nặng không thể sửa (chip chết, PCB cháy). Sản phẩm lỗi sẽ được chuyển vào kho RMA để trả về nhà cung cấp.`
- **Product**: `ZOTAC RTX 4070 Gaming`
- **Service Type**: `Warranty`
- **Enforce Sequence**: `true` (bắt buộc tuân thủ thứ tự nghiêm ngặt)
- **Created By**: `Manager` (hoặc Admin)
- **Khi nào dùng**: VGA có lỗi nghiêm trọng (chip chết, PCB cháy) không thể sửa được, cần thay thế toàn bộ

**Tasks trong template**:
1. **Tiếp nhận sản phẩm** - Required ✅
2. **Kiểm tra ban đầu** - Required ✅
3. **Chụp ảnh sản phẩm nhận** - Required ✅ - Ghi chú: "Chụp chi tiết lỗi để phục vụ RMA"
4. **Kiểm tra bảo hành** - Required ✅
5. **Chẩn đoán lỗi** - Required ✅ - Ghi chú: "Xác định chính xác lỗi để yêu cầu RMA"
6. **Test phần cứng** - Required ✅ - Ghi chú: "Chạy đầy đủ test để có bằng chứng lỗi"
7. **Chờ phê duyệt** - Required ✅ - Ghi chú: "Manager phê duyệt thay thế và RMA"
8. **Thay thế sản phẩm** - Required ✅ - Ghi chú: "Chọn VGA mới từ kho warranty_stock"
9. **Xuất kho bảo hành** - Required ✅
10. **Nhập kho RMA** - Required ✅ - Ghi chú: "Chuyển VGA lỗi vào rma_staging"
11. **Kiểm tra sau sửa** - Required ✅ - Ghi chú: "Test VGA mới trước khi giao khách"
12. **Kiểm tra cuối cùng** - Required ✅
13. **Chụp ảnh kết quả** - Optional ❌
14. **Thông báo khách hàng** - Required ✅
15. **Đóng gói sản phẩm** - Required ✅
16. **Giao hàng** - Required ✅

**Ước tính tổng thời gian**: ~3 giờ

---

#### **Template 3: Quy trình sửa chữa SSD (Software Fix)**
- **Name**: `Sửa chữa SSD - Lỗi phần mềm`
- **Product**: `SSTC SSD NVMe Gen4 1TB`
- **Service Type**: `Warranty`
- **Enforce Sequence**: `false`
- **Khi nào dùng**: SSD có lỗi firmware, driver, cần backup/restore dữ liệu

**Tasks trong template**:
1. **Tiếp nhận sản phẩm** (Reception) - 10 phút
2. **Kiểm tra ban đầu** (Inspection) - 15 phút
3. **Kiểm tra bảo hành** (Verification) - 5 phút
4. **Chẩn đoán lỗi** (Diagnosis) - 30 phút
5. **Test phần cứng** (Testing) - 20 phút
6. **Test phần mềm** (Testing) - 15 phút
7. **Backup dữ liệu** (Data) - 30 phút - Sao lưu dữ liệu khách trước khi sửa
8. **Cài đặt phần mềm** (Software) - 20 phút - Cập nhật firmware, driver
9. **Restore dữ liệu** (Data) - 30 phút - Khôi phục dữ liệu
10. **Kiểm tra sau sửa** (QC) - 20 phút
11. **Test ổn định** (QC) - 30 phút
12. **Kiểm tra cuối cùng** (QC) - 15 phút
13. **Thông báo khách hàng** (Communication) - 5 phút
14. **Đóng gói sản phẩm** (Packaging) - 10 phút
15. **Giao hàng** (Delivery) - 15 phút

**Ước tính tổng thời gian**: ~4 giờ

---

#### **Template 4: Quy trình thay thế SSD (Replacement)**
- **Name**: `Thay thế SSD - Lỗi phần cứng`
- **Product**: `SSTC SSD NVMe Gen4 1TB`
- **Service Type**: `Warranty`
- **Enforce Sequence**: `true`
- **Khi nào dùng**: SSD lỗi phần cứng không thể sửa (chip chết, PCB hỏng)

**Tasks trong template**:
1. **Tiếp nhận sản phẩm** (Reception) - 10 phút
2. **Kiểm tra ban đầu** (Inspection) - 15 phút
3. **Kiểm tra bảo hành** (Verification) - 5 phút
4. **Chẩn đoán lỗi** (Diagnosis) - 30 phút
5. **Test phần cứng** (Testing) - 20 phút
6. **Backup dữ liệu** (Data) - 30 phút - Cố gắng cứu dữ liệu (nếu có thể)
7. **Chờ phê duyệt** (Approval) - Manager phê duyệt thay thế
8. **Thay thế sản phẩm** (Replacement) - 20 phút
9. **Xuất kho bảo hành** (Warehouse) - 10 phút
10. **Nhập kho RMA** (Warehouse) - 10 phút
11. **Restore dữ liệu** (Data) - 30 phút - Restore vào SSD mới
12. **Kiểm tra sau sửa** (QC) - 20 phút
13. **Test ổn định** (QC) - 30 phút
14. **Kiểm tra cuối cùng** (QC) - 15 phút
15. **Thông báo khách hàng** (Communication) - 5 phút
16. **Đóng gói sản phẩm** (Packaging) - 10 phút
17. **Giao hàng** (Delivery) - 15 phút

**Ước tính tổng thời gian**: ~4.5 giờ

---

#### **Template 5: Quy trình sửa chữa chờ linh kiện (Repair with Parts Waiting)**
- **Name**: `Sửa chữa VGA - Chờ linh kiện`
- **Product**: `ZOTAC RTX 4070 Gaming`
- **Service Type**: `Warranty`
- **Enforce Sequence**: `false`
- **Khi nào dùng**: VGA cần sửa chữa nhưng linh kiện chưa có trong kho, phải đặt hàng

**Tasks trong template**:
1. **Tiếp nhận sản phẩm** (Reception) - 10 phút
2. **Kiểm tra ban đầu** (Inspection) - 15 phút
3. **Chụp ảnh sản phẩm nhận** (Documentation) - 5 phút
4. **Kiểm tra bảo hành** (Verification) - 5 phút
5. **Chẩn đoán lỗi** (Diagnosis) - 30 phút
6. **Test phần cứng** (Testing) - 20 phút
7. **Liên hệ nhà cung cấp** (Communication) - 15 phút - Đặt hàng linh kiện
8. **Chờ phụ tùng** (Waiting) - Đánh dấu đang chờ linh kiện về
9. **Thông báo khách hàng** (Communication) - 5 phút - Báo khách thời gian chờ
10. *(Sau khi linh kiện về)* **Sửa chữa phần cứng** (Repair) - 45 phút
11. **Thay linh kiện VGA** (Repair) - 30 phút
12. **Vệ sinh sản phẩm** (Cleaning) - 15 phút
13. **Kiểm tra sau sửa** (QC) - 20 phút
14. **Test ổn định** (QC) - 30 phút
15. **Kiểm tra cuối cùng** (QC) - 15 phút
16. **Thông báo khách hàng** (Communication) - 5 phút
17. **Đóng gói sản phẩm** (Packaging) - 10 phút
18. **Giao hàng** (Delivery) - 15 phút

**Ước tính tổng thời gian**: ~4.5 giờ + thời gian chờ linh kiện (3-7 ngày)

---

#### **Template 6: Quy trình sửa chữa trả phí (Paid Repair Service)**
- **Name**: `Sửa chữa ngoài bảo hành - Trả phí`
- **Product**: `ZOTAC RTX 4070 Gaming`
- **Service Type**: `Paid Service`
- **Enforce Sequence**: `true` (cần chờ khách đồng ý báo giá)
- **Khi nào dùng**: Sản phẩm hết bảo hành, lỗi do người dùng, cần báo giá và chờ phê duyệt

**Tasks trong template**:
1. **Tiếp nhận sản phẩm** (Reception) - 10 phút
2. **Kiểm tra ban đầu** (Inspection) - 15 phút
3. **Chụp ảnh sản phẩm nhận** (Documentation) - 5 phút
4. **Kiểm tra bảo hành** (Verification) - 5 phút - Xác nhận hết bảo hành
5. **Chẩn đoán lỗi** (Diagnosis) - 30 phút
6. **Test phần cứng** (Testing) - 20 phút
7. **Báo giá sửa chữa** (Quotation) - 10 phút - Tạo báo giá chi tiết
8. **Thông báo khách hàng** (Communication) - 5 phút - Gửi báo giá
9. **Chờ khách quyết định** (Waiting) - Chờ khách xác nhận có sửa hay không
10. *(Nếu khách đồng ý)* **Sửa chữa phần cứng** (Repair) - 45 phút
11. **Thay linh kiện VGA** (Repair) - 30 phút
12. **Vệ sinh sản phẩm** (Cleaning) - 15 phút
13. **Thay keo tản nhiệt** (Maintenance) - 10 phút
14. **Kiểm tra sau sửa** (QC) - 20 phút
15. **Test ổn định** (QC) - 30 phút
16. **Kiểm tra cuối cùng** (QC) - 15 phút
17. **Chụp ảnh kết quả** (Documentation) - 5 phút
18. **Tạo hóa đơn dịch vụ** (Billing) - 10 phút
19. **Thông báo khách hàng** (Communication) - 5 phút
20. **Đóng gói sản phẩm** (Packaging) - 10 phút
21. **Giao hàng** (Delivery) - 15 phút - Thu tiền

**Ước tính tổng thời gian**: ~5 giờ + thời gian chờ khách quyết định

---

#### **Template 7: Quy trình RMA (Return to Supplier)**
- **Name**: `RMA - Trả hàng nhà cung cấp`
- **Product**: `ZOTAC RTX 4070 Gaming` (hoặc bất kỳ sản phẩm nào)
- **Service Type**: `Warranty`
- **Enforce Sequence**: `true` (quy trình RMA phải tuân thủ nghiêm ngặt)
- **Khi nào dùng**: Sản phẩm lỗi nghiêm trọng, không sửa được, cần trả về nhà cung cấp (ZOTAC, SSTC)

**Tasks trong template**:
1. **Tiếp nhận sản phẩm** (Reception) - 10 phút
2. **Kiểm tra ban đầu** (Inspection) - 15 phút
3. **Chụp ảnh sản phẩm nhận** (Documentation) - 5 phút
4. **Kiểm tra bảo hành** (Verification) - 5 phút
5. **Chẩn đoán lỗi** (Diagnosis) - 30 phút
6. **Test phần cứng** (Testing) - 20 phút
7. **Test stress** (Testing) - 60 phút - Test kỹ để xác nhận lỗi
8. **Chờ phê duyệt** (Approval) - Manager phê duyệt RMA
9. **Thay thế sản phẩm** (Replacement) - 20 phút - Thay sản phẩm mới cho khách trước
10. **Xuất kho bảo hành** (Warehouse) - 10 phút
11. **Nhập kho RMA** (Warehouse) - 10 phút - Chuyển sản phẩm lỗi vào `rma_staging`
12. **Tạo lô RMA** (Documentation) - 15 phút - Tạo RMA batch để nhóm sản phẩm
13. **Vệ sinh sản phẩm** (Cleaning) - 15 phút - Vệ sinh sản phẩm lỗi trước khi trả
14. **Chuẩn bị & Gửi lô RMA** (Logistics) - 30 phút - Đóng gói, gửi về nhà cung cấp
15. **Kiểm tra cuối cùng** (QC) - 15 phút - Kiểm tra sản phẩm mới cho khách
16. **Thông báo khách hàng** (Communication) - 5 phút
17. **Đóng gói sản phẩm** (Packaging) - 10 phút
18. **Giao hàng** (Delivery) - 15 phút

**Ước tính tổng thời gian**: ~5 giờ

---

#### **Template 8: Quy trình nâng cấp (Upgrade Service)**
- **Name**: `Nâng cấp sản phẩm - Dịch vụ thêm`
- **Product**: `ZOTAC ZBOX Mini PC`
- **Service Type**: `Paid Service`
- **Enforce Sequence**: `false`
- **Khi nào dùng**: Khách yêu cầu nâng cấp (thêm RAM, đổi SSD lớn hơn) không liên quan bảo hành

**Tasks trong template**:
1. **Tiếp nhận sản phẩm** (Reception) - 10 phút
2. **Kiểm tra ban đầu** (Inspection) - 15 phút
3. **Chụp ảnh sản phẩm nhận** (Documentation) - 5 phút
4. **Test phần cứng** (Testing) - 20 phút - Test trước khi nâng cấp
5. **Backup dữ liệu** (Data) - 30 phút - Backup dữ liệu khách
6. **Báo giá sửa chữa** (Quotation) - 10 phút - Báo giá nâng cấp
7. **Thông báo khách hàng** (Communication) - 5 phút
8. **Chờ khách quyết định** (Waiting) - Chờ xác nhận
9. *(Nếu đồng ý)* **Nâng cấp theo yêu cầu** (Service) - 30 phút - Thay RAM, SSD...
10. **Cài đặt phần mềm** (Software) - 20 phút - Cài driver, OS
11. **Restore dữ liệu** (Data) - 30 phút
12. **Vệ sinh sản phẩm** (Cleaning) - 15 phút
13. **Thay keo tản nhiệt** (Maintenance) - 10 phút
14. **Kiểm tra sau sửa** (QC) - 20 phút
15. **Test ổn định** (QC) - 30 phút
16. **Kiểm tra cuối cùng** (QC) - 15 phút
17. **Chụp ảnh kết quả** (Documentation) - 5 phút
18. **Tạo hóa đơn dịch vụ** (Billing) - 10 phút
19. **Thông báo khách hàng** (Communication) - 5 phút
20. **Hướng dẫn sử dụng** (Support) - 10 phút - Hướng dẫn tính năng mới
21. **Đóng gói sản phẩm** (Packaging) - 10 phút
22. **Giao hàng** (Delivery) - 15 phút

**Ước tính tổng thời gian**: ~5.5 giờ

---

#### **Template 9: Quy trình yêu cầu thông tin từ khách (Information Request)**
- **Name**: `Yêu cầu thông tin - Chờ phản hồi khách`
- **Product**: Bất kỳ sản phẩm nào
- **Service Type**: `Warranty` hoặc `Paid Service`
- **Enforce Sequence**: `true`
- **Khi nào dùng**: Cần thêm thông tin từ khách để chẩn đoán chính xác (mật khẩu, mô tả chi tiết lỗi, hình ảnh thêm)

**Tasks trong template**:
1. **Tiếp nhận sản phẩm** (Reception) - 10 phút
2. **Kiểm tra ban đầu** (Inspection) - 15 phút
3. **Kiểm tra bảo hành** (Verification) - 5 phút
4. **Chẩn đoán lỗi** (Diagnosis) - 30 phút - Phát hiện cần thêm thông tin
5. **Yêu cầu thêm thông tin từ khách** (Communication) - 5 phút
6. **Chờ phản hồi từ khách** (Waiting) - Tạm dừng ticket
7. *(Sau khi có thông tin)* **Chẩn đoán lỗi** (Diagnosis) - 30 phút - Chẩn đoán lại
8. **Test phần cứng** (Testing) - 20 phút
9. **Sửa chữa phần cứng** (Repair) - 45 phút
10. **Kiểm tra sau sửa** (QC) - 20 phút
11. **Kiểm tra cuối cùng** (QC) - 15 phút
12. **Thông báo khách hàng** (Communication) - 5 phút
13. **Đóng gói sản phẩm** (Packaging) - 10 phút
14. **Giao hàng** (Delivery) - 15 phút

**Ước tính tổng thời gian**: ~3.5 giờ + thời gian chờ khách phản hồi

---

#### **Template 10: Quy trình kiểm tra nhanh (Quick Check)**
- **Name**: `Kiểm tra nhanh - Không có lỗi`
- **Product**: Bất kỳ sản phẩm nào
- **Service Type**: `Warranty`
- **Enforce Sequence**: `false`
- **Khi nào dùng**: Khách báo lỗi nhưng sản phẩm hoạt động bình thường, không phát hiện vấn đề

**Tasks trong template**:
1. **Tiếp nhận sản phẩm** (Reception) - 10 phút
2. **Kiểm tra ban đầu** (Inspection) - 15 phút
3. **Kiểm tra bảo hành** (Verification) - 5 phút
4. **Chẩn đoán lỗi** (Diagnosis) - 30 phút
5. **Test phần cứng** (Testing) - 20 phút
6. **Test phần mềm** (Testing) - 15 phút
7. **Test stress** (Testing) - 60 phút - Test kỹ để xác nhận không có lỗi
8. **Vệ sinh sản phẩm** (Cleaning) - 15 phút - Vệ sinh kỹ cho khách
9. **Thay keo tản nhiệt** (Maintenance) - 10 phút
10. **Kiểm tra cuối cùng** (QC) - 15 phút
11. **Chụp ảnh kết quả** (Documentation) - 5 phút - Chụp kết quả test
12. **Thông báo khách hàng** (Communication) - 5 phút - Báo không phát hiện lỗi
13. **Hướng dẫn sử dụng** (Support) - 10 phút - Hướng dẫn cách sử dụng đúng
14. **Đóng gói sản phẩm** (Packaging) - 10 phút
15. **Giao hàng** (Delivery) - 15 phút

**Ước tính tổng thời gian**: ~4 giờ

---

### **So sánh các Workflow Templates**

| Template | Product Type | Service Type | Enforce Sequence | Tổng Tasks | Thời gian | Khi nào dùng |
|----------|--------------|--------------|------------------|------------|-----------|--------------|
| 1. Sửa chữa VGA - Linh kiện | VGA | Warranty | ❌ No | 17 tasks | ~4-5h | Lỗi nhỏ, sửa bằng parts |
| 2. Thay thế VGA | VGA | Warranty | ✅ Yes | 16 tasks | ~3h | Lỗi nặng, thay toàn bộ |
| 3. Sửa chữa SSD - Phần mềm | SSD | Warranty | ❌ No | 15 tasks | ~4h | Lỗi firmware, driver |
| 4. Thay thế SSD | SSD | Warranty | ✅ Yes | 17 tasks | ~4.5h | Lỗi phần cứng SSD |
| 5. Sửa chữa - Chờ linh kiện | VGA | Warranty | ❌ No | 18 tasks | ~4.5h + 3-7 ngày | Thiếu linh kiện |
| 6. Sửa chữa trả phí | VGA | Paid Service | ✅ Yes | 21 tasks | ~5h + chờ khách | Ngoài bảo hành |
| 7. RMA | Any | Warranty | ✅ Yes | 18 tasks | ~5h | Trả hàng nhà cung cấp |
| 8. Nâng cấp | Mini PC | Paid Service | ❌ No | 22 tasks | ~5.5h | Upgrade RAM, SSD |
| 9. Yêu cầu thông tin | Any | Any | ✅ Yes | 14 tasks | ~3.5h + chờ khách | Cần thông tin thêm |
| 10. Kiểm tra nhanh | Any | Warranty | ❌ No | 15 tasks | ~4h | Không phát hiện lỗi |

---