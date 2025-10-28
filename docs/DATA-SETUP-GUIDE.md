# Data Setup Guide - Thứ Tự Tạo Dữ Liệu

## Thứ Tự Khuyến Nghị

Hãy tạo dữ liệu theo thứ tự sau để hệ thống hoạt động được ngay:

1. **Admin User** - Tài khoản quản trị
2. **Staff Users** - Manager, Technicians, Reception
3. **Physical Warehouses** - Kho vật lý và kho ảo
4. **Brands** - Nhãn hàng (ZOTAC, SSTC...)
5. **Parts** - Linh kiện (Fan, Capacitor, HDMI Port...) 
6. **Products** - Sản phẩm (VGA, SSD, RAM...) - Bind parts vào products
7. **Physical Products** - Nhập hàng bảo hành vào kho
8. **Task Types** - Loại công việc (**BẮT BUỘC** để định nghĩa quy trình)
9. **Task Templates** - Mẫu quy trình (**BẮT BUỘC** để tổ chức hoạt động)
10. **Service Tickets** - Bắt đầu vận hành
11. **Customers** - Khách hàng (*tùy chọn* - chỉ cần nếu import từ hệ thống cũ)

---

### **Ghi chú**:
- ✅ **Bước 1-9**: Bắt buộc phải tạo để hệ thống hoạt động
- 🟢 **Bước 10**: Có thể bắt đầu vận hành ngay sau bước 9
- ⚪ **Bước 11**: Customers sẽ được tạo tự động khi tiếp nhận khách hàng thực tế. Chỉ cần import dữ liệu này nếu bạn có hệ thống cũ.


---

### **Bước 1: Admin User**

**Trang**: `/setup` (chạy một lần duy nhất)

**Dữ liệu**:
- Email: `admin@sstc.vn`
- Password: (theo SETUP_PASSWORD trong .env)
- Full name: `Administrator`

---

### **Bước 2: Staff Users**

**Trang**: `/management/team`

**Dữ liệu gợi ý**:

**Manager (1 người)**:
- Email: `manager@sstc.vn`
- Password: `manager123`
- Full name: `Nguyễn Văn Quản Lý`
- Role: Manager

**Technicians (2-3 người)**:
- Email: `tech1@sstc.vn`, `tech2@sstc.vn`, `tech3@sstc.vn`
- Password: `tech123`
- Full name: `Kỹ Thuật Viên 1`, `Kỹ Thuật Viên 2`, `Kỹ Thuật Viên 3`
- Role: Technician

**Reception (1-2 người)**:
- Email: `reception@sstc.vn`
- Password: `reception123`
- Full name: `Lễ Tân`
- Role: Reception

---

### **Bước 3: Physical Warehouses & Virtual Warehouses**

**Trang**: `/inventory/warehouses`

**Lưu ý quan trọng**: Trong hệ thống mới, **Virtual Warehouses** là các thực thể kho riêng biệt (database records) được tạo và liên kết với Physical Warehouses. Mỗi virtual warehouse có ID duy nhất và theo dõi tồn kho thực tế.

**Quy trình tạo kho**:
1. Tạo Physical Warehouses trước (địa điểm vật lý)
2. Sau đó tạo Virtual Warehouses cho mỗi Physical Warehouse (các khu vực logic trong kho)

---

#### **Bước 3a: Tạo Physical Warehouses**

**Kho vật lý 1: Kho nhà cũ**
- Name: `Kho nhà cũ`
- Code: `WH-OLD-HOUSE`
- Location: `69/18 Nguyễn Cửu Đàm, Phường Tân Sơn Nhì, TP.HCM`
- Description: `Kho cũ dùng cho sản phẩm hỏng không còn giá trị`

**Kho vật lý 2: SSTC** (Kho chính)
- Name: `SSTC`
- Code: `WH-SSTC-MAIN`
- Location: `69/18 Nguyễn Cửu Đàm, Phường Tân Sơn Nhì, TP.HCM`
- Description: `Kho chính SSTC Service Center`

**Kho vật lý 3: Hà Nội**
- Name: `Hà Nội`
- Code: `WH-HANOI`
- Location: `123 Trần Duy Hưng, Quận Cầu Giấy, Hà Nội`
- Description: `Chi nhánh Hà Nội - kho tạm thời`

---

#### **Bước 3b: Tạo Virtual Warehouses**

**Sau khi tạo xong Physical Warehouses**, tạo các Virtual Warehouses như sau:

**Virtual Warehouses cho "Kho nhà cũ"**:

1. **Hàng hỏng - Kho nhà cũ**
   - Name: `Hàng hỏng - Kho nhà cũ`
   - Warehouse Type: `dead_stock`
   - Physical Warehouse: `Kho nhà cũ`
   - Description: `Sản phẩm hỏng không sửa được, chờ thanh lý`
   - Color Code: `#dc2626` (đỏ)

**Virtual Warehouses cho "SSTC" (Kho chính)**:

1. **Kho bảo hành - SSTC**
   - Name: `Kho bảo hành - SSTC`
   - Warehouse Type: `warranty_stock`
   - Physical Warehouse: `SSTC`
   - Description: `Sản phẩm bảo hành mới, sẵn sàng thay thế cho khách`
   - Color Code: `#16a34a` (xanh lá)

2. **Kho RMA - SSTC**
   - Name: `Kho RMA - SSTC`
   - Warehouse Type: `rma_staging`
   - Physical Warehouse: `SSTC`
   - Description: `Sản phẩm lỗi chờ trả về nhà cung cấp (ZOTAC, SSTC)`
   - Color Code: `#ea580c` (cam)

3. **Hàng hỏng - SSTC**
   - Name: `Hàng hỏng - SSTC`
   - Warehouse Type: `dead_stock`
   - Physical Warehouse: `SSTC`
   - Description: `Sản phẩm hỏng không RMA được, chờ thanh lý`
   - Color Code: `#dc2626` (đỏ)

4. **Đang sửa chữa - SSTC**
   - Name: `Đang sửa chữa - SSTC`
   - Warehouse Type: `in_service`
   - Physical Warehouse: `SSTC`
   - Description: `Sản phẩm đang được sử dụng trong service tickets`
   - Color Code: `#2563eb` (xanh dương)

5. **Kho linh kiện - SSTC**
   - Name: `Kho linh kiện - SSTC`
   - Warehouse Type: `parts`
   - Physical Warehouse: `SSTC`
   - Description: `Linh kiện thay thế (fan, thermal pad, capacitor...)`
   - Color Code: `#7c3aed` (tím)

**Virtual Warehouses cho "Hà Nội"**:
- Không cần tạo virtual warehouse cho kho này (tùy chọn)

---

### **Bước 4: Brands**

**Trang**: `/catalog/brands`

**Dữ liệu gợi ý**:
1. Name: `ZOTAC`, Description: `Card đồ họa và Mini PC`
2. Name: `SSTC`, Description: `SSD, RAM, Barebone PC`
3. Name: `Kingston`, Description: `RAM và Storage`
4. Name: `Samsung`, Description: `SSD và RAM`

---

### **Bước 5: Parts**

**Trang**: `/catalog/parts`

**Lưu ý**: Parts phải tạo TRƯỚC Products vì khi tạo Product, bạn cần bind các parts có thể dùng để sửa chữa sản phẩm đó (ví dụ: VGA RTX 4070 có thể dùng Fan VGA ZOTAC 90mm, Capacitor, HDMI Port để sửa chữa).

**Dữ liệu gợi ý**:

**Linh kiện làm mát (Cooling)**:
- Name: `Fan VGA ZOTAC 90mm`
- Part Number: `FAN-ZT-90`
- Category: `Cooling`
- Price: `150,000`
- Cost Price: `80,000`
- Stock Quantity: `20`
- Min Stock Level: `5`

**Linh kiện điện tử (Electronics)**:
- Name: `Capacitor 470uF 16V`
- Part Number: `CAP-470-16`
- Category: `Electronics`
- Price: `10,000`
- Cost Price: `5,000`
- Stock Quantity: `100`
- Min Stock Level: `20`

- Name: `VRM Mosfet`
- Part Number: `VRM-MOSFET`
- Category: `Electronics`
- Price: `50,000`
- Cost Price: `25,000`
- Stock Quantity: `50`
- Min Stock Level: `10`
- Description: `Mosfet cho VRM (Voltage Regulator Module), điều chỉnh điện áp cho GPU`

**Cổng kết nối (Connectors)**:
- Name: `HDMI Port Female`
- Part Number: `HDMI-F`
- Category: `Connectors`
- Price: `30,000`
- Cost Price: `15,000`
- Stock Quantity: `30`
- Min Stock Level: `10`

- Name: `DisplayPort Female`
- Part Number: `DP-F`
- Category: `Connectors`
- Price: `35,000`
- Cost Price: `18,000`
- Stock Quantity: `25`
- Min Stock Level: `8`

- Name: `Power Connector 8-pin`
- Part Number: `PWR-8PIN`
- Category: `Connectors`
- Price: `25,000`
- Cost Price: `12,000`
- Stock Quantity: `40`
- Min Stock Level: `10`

**Chip và bộ nhớ (Memory)**:
- Name: `VRAM Chip GDDR6 1GB`
- Part Number: `VRAM-GDDR6-1G`
- Category: `Memory`
- Price: `500,000`
- Cost Price: `250,000`
- Stock Quantity: `10`
- Min Stock Level: `3`
- Description: `Chip VRAM GDDR6 1GB, dùng để thay thế chip bộ nhớ hỏng trên VGA`

---

### **Bước 6: Products**

**Trang**: `/catalog/products`

**Lưu ý**: Khi tạo Product, bạn cần bind các Parts (đã tạo ở Bước 5) mà sản phẩm này có thể sử dụng để sửa chữa.

**Dữ liệu gợi ý**:

**Card đồ họa ZOTAC**:

**VGA 1: ZOTAC RTX 4070 Gaming**
- Name: `ZOTAC RTX 4070 Gaming`
- Type: `VGA`
- Brand: `ZOTAC`
- Model: `RTX 4070`
- SKU: `ZT-4070-G`
- Warranty: `36` tháng
- **Parts có thể dùng để sửa chữa** (bind các parts sau vào product này):
  1. ✅ `Fan VGA ZOTAC 90mm` - Thay fan hỏng, kêu bất thường
  2. ✅ `Capacitor 470uF 16V` - Thay capacitor phồng, chết
  3. ✅ `VRM Mosfet` - Thay mosfet cháy, VGA không lên nguồn
  4. ✅ `HDMI Port Female` - Thay cổng HDMI lỏng, hỏng
  5. ✅ `DisplayPort Female` - Thay cổng DisplayPort lỏng, hỏng
  6. ✅ `Power Connector 8-pin` - Thay cổng nguồn cháy, lỏng
  7. ✅ `VRAM Chip GDDR6 1GB` - Thay chip VRAM lỗi (artifact, không nhận đủ dung lượng)

**Gợi ý**: Khi tạo product này, hãy add tất cả 7 parts trên vào danh sách parts có thể sử dụng. Điều này giúp khi tạo service ticket sửa chữa VGA, hệ thống sẽ gợi ý các parts phù hợp để technician chọn.

---

**VGA 2: ZOTAC RTX 4060 Ti**
- Name: `ZOTAC RTX 4060 Ti`
- Type: `VGA`
- Brand: `ZOTAC`
- Model: `RTX 4060 Ti`
- SKU: `ZT-4060Ti`
- Warranty: `36` tháng
- **Parts có thể dùng để sửa chữa** (bind các parts sau vào product này):
  1. ✅ `Fan VGA ZOTAC 90mm` - Thay fan hỏng, kêu bất thường
  2. ✅ `Capacitor 470uF 16V` - Thay capacitor phồng, chết
  3. ✅ `VRM Mosfet` - Thay mosfet cháy, VGA không lên nguồn
  4. ✅ `HDMI Port Female` - Thay cổng HDMI lỏng, hỏng
  5. ✅ `DisplayPort Female` - Thay cổng DisplayPort lỏng, hỏng
  6. ✅ `Power Connector 8-pin` - Thay cổng nguồn cháy, lỏng
  7. ✅ `VRAM Chip GDDR6 1GB` - Thay chip VRAM lỗi (artifact, không nhận đủ dung lượng)

**Gợi ý**: Khi tạo product này, hãy add tất cả 7 parts trên vào danh sách parts có thể sử dụng.

---

**SSD SSTC**:
- Name: `SSTC SSD NVMe Gen4 1TB`
- Type: `SSD`
- Brand: `SSTC`
- Model: `NVMe Gen4 1TB`
- SKU: `SSTC-1TB-G4`
- Warranty: `60` tháng
- **Parts có thể dùng**: (SSD thường thay thế toàn bộ, không sửa bằng parts)

- Name: `SSTC SSD NVMe Gen3 512GB`
- Type: `SSD`
- Brand: `SSTC`
- Model: `NVMe Gen3 512GB`
- SKU: `SSTC-512GB-G3`
- Warranty: `60` tháng
- **Parts có thể dùng**: (SSD thường thay thế toàn bộ, không sửa bằng parts)

**RAM SSTC**:
- Name: `SSTC DDR4 16GB 3200MHz`
- Type: `RAM`
- Brand: `SSTC`
- Model: `DDR4 16GB 3200`
- SKU: `SSTC-16GB-3200`
- Warranty: `60` tháng
- **Parts có thể dùng**: (RAM thường thay thế toàn bộ, không sửa bằng parts)

**Mini PC ZOTAC**:
- Name: `ZOTAC ZBOX Mini PC`
- Type: `MiniPC`
- Brand: `ZOTAC`
- Model: `ZBOX CI series`
- SKU: `ZBOX-CI`
- Warranty: `36` tháng
- **Parts có thể dùng**: (Tùy theo cấu hình, có thể dùng Fan, Capacitor...)

---

### **Bước 7: Physical Products (Nhập hàng bảo hành)**

**Trang**: `/inventory/documents/receipts`

**Tạo GRN (Goods Receipt Note)**:

**Phiếu nhập 1 - VGA ZOTAC**:
- Receipt Type: `normal` (Phiếu nhập bình thường)
- Virtual Warehouse: `Kho bảo hành - SSTC` (chọn từ dropdown list)
- Supplier: `ZOTAC Supplier`
- Receipt Date: `2025-01-01`
- Notes: `Nhập hàng bảo hành VGA tháng 01/2025`

**Sản phẩm trong phiếu**:
- Product: `ZOTAC RTX 4070 Gaming`
- Quantity: `5`
- Serials:
  - `ZT4070-2025-001`
  - `ZT4070-2025-002`
  - `ZT4070-2025-003`
  - `ZT4070-2025-004`
  - `ZT4070-2025-005`
- Warranty Start Date: `2025-01-01`
- Warranty Months: `36`

- Product: `ZOTAC RTX 4060 Ti`
- Quantity: `3`
- Serials:
  - `ZT4060Ti-2025-001`
  - `ZT4060Ti-2025-002`
  - `ZT4060Ti-2025-003`
- Warranty Start Date: `2025-01-01`
- Warranty Months: `36`

**Phiếu nhập 2 - SSD & RAM SSTC**:
- Receipt Type: `normal` (Phiếu nhập bình thường)
- Virtual Warehouse: `Kho bảo hành - SSTC` (chọn từ dropdown list)
- Supplier: `SSTC Supplier`
- Receipt Date: `2025-01-01`
- Notes: `Nhập hàng bảo hành SSD & RAM tháng 01/2025`

**Sản phẩm trong phiếu**:
- Product: `SSTC SSD NVMe Gen4 1TB`
- Quantity: `10`
- Serials:
  - `SSTC1TB-2025-001`
  - `SSTC1TB-2025-002`
  - `SSTC1TB-2025-003`
  - `SSTC1TB-2025-004`
  - `SSTC1TB-2025-005`
  - `SSTC1TB-2025-006`
  - `SSTC1TB-2025-007`
  - `SSTC1TB-2025-008`
  - `SSTC1TB-2025-009`
  - `SSTC1TB-2025-010`
- Warranty Start Date: `2025-01-01`
- Warranty Months: `60`

- Product: `SSTC DDR4 16GB 3200MHz`
- Quantity: `10`
- Serials:
  - `SSTCRAM-2025-001` đến `SSTCRAM-2025-010`
- Warranty Start Date: `2025-01-01`
- Warranty Months: `60`

**Sau khi nhập xong**:
- Nhập serial numbers cho tất cả sản phẩm
- Approve GRN để sản phẩm vào kho `SSTC - Kho bảo hành`

---

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

### **Hướng dẫn chọn Template**

**Theo loại lỗi**:
- 🔧 **Lỗi phần cứng nhỏ** → Template 1 (Sửa chữa VGA - Linh kiện)
- 💀 **Lỗi phần cứng nặng** → Template 2 hoặc 4 (Thay thế VGA/SSD)
- 💻 **Lỗi phần mềm** → Template 3 (Sửa chữa SSD - Phần mềm)
- ⏳ **Thiếu linh kiện** → Template 5 (Sửa chữa - Chờ linh kiện)
- 🔄 **Trả hàng nhà cung cấp** → Template 7 (RMA)

**Theo tình trạng bảo hành**:
- ✅ **Còn bảo hành** → Template 1, 2, 3, 4, 5, 7, 9, 10
- ❌ **Hết bảo hành** → Template 6 (Sửa chữa trả phí)
- 🆙 **Nâng cấp** → Template 8 (Upgrade)

**Theo độ phức tạp**:
- 🟢 **Đơn giản** → Template 10 (Kiểm tra nhanh)
- 🟡 **Trung bình** → Template 1, 3 (Sửa chữa)
- 🟠 **Phức tạp** → Template 2, 4, 7 (Thay thế, RMA)
- 🔴 **Rất phức tạp** → Template 6, 8 (Trả phí, Nâng cấp)

---

### **Lưu ý quan trọng khi tạo Templates**

**Các trường dữ liệu bắt buộc**:
1. **Name**: Tên template duy nhất
2. **Description**: Mô tả chi tiết quy trình (giúp user hiểu khi nào dùng)
3. **Product**: Chọn sản phẩm áp dụng
4. **Service Type**: Warranty / Paid Service / Out of Warranty
5. **Enforce Sequence**: true (bắt buộc tuân thủ) / false (linh hoạt)
6. **Created By**: ID của Manager hoặc Admin tạo template

**Cấu hình Tasks trong Template**:
- Mỗi task cần có: **Task Type**, **Sequence Order**, **Is Required**, **Custom Instructions**
- Templates 3-10 trong tài liệu này đã liệt kê đầy đủ tasks với thời gian, nhưng khi nhập vào hệ thống cần thêm:
  - **Is Required** (✅ Required / ❌ Optional) cho từng task
  - **Custom Instructions** (ghi chú/hướng dẫn riêng) nếu cần

**Ví dụ chi tiết**: Xem Template 1 và Template 2 ở trên đã có đầy đủ các trường dữ liệu.

**Lưu ý**: Task Templates là công cụ tự động hóa workflow. Khi tạo ticket mới, chọn template phù hợp và hệ thống sẽ tự động tạo danh sách tasks theo quy trình đã định nghĩa. Đây là yếu tố quan trọng để chuẩn hóa quy trình làm việc!

---

### **Bước 10: Service Tickets (Bắt đầu vận hành)**

**Trang**: `/operations/tickets`

**Lưu ý**: Khi tạo ticket thực tế, nếu chưa có customer trong hệ thống, bạn sẽ được yêu cầu tạo customer mới ngay trong form. Không cần phải tạo customer trước!

**Ticket 1 - Sửa chữa (dùng Parts)**:
- Customer: `Nguyễn Văn A` (tạo mới trong form nếu chưa có)
  - Phone: `0901234567`
  - Email: `nguyenvana@gmail.com`
- Product: `ZOTAC RTX 4070 Gaming`
- Issue Description: `VGA không quay fan, tiếng kêu bất thường`
- Priority: `Normal`
- Warranty Type: `Warranty`
- Assigned To: `Kỹ Thuật Viên 1`

**Sau khi tạo**:
- Technician chẩn đoán: Fan hỏng
- Add parts: `Fan VGA ZOTAC 90mm` (Quantity: 1)
- Complete ticket

**Ticket 2 - Thay thế (dùng Physical Products)**:
- Customer: `Trần Thị B` (tạo mới trong form nếu chưa có)
  - Phone: `0912345678`
  - Email: `tranthib@gmail.com`
- Product: `ZOTAC RTX 4070 Gaming`
- Issue Description: `VGA không lên hình, không phát hiện được card`
- Priority: `High`
- Warranty Type: `Warranty`
- Assigned To: `Kỹ Thuật Viên 2`

**Sau khi tạo**:
- Technician chẩn đoán: Chip chết
- Manager tìm VGA mới trong kho: `ZT4070-2025-001`
- Issue VGA từ `warranty_stock` → `in_service`
- Complete ticket
- VGA lỗi tạo physical product record → move to `rma_staging`

**Ticket 3 - Repair SSD**:
- Customer: `Phạm Văn C` (tạo mới trong form nếu chưa có)
  - Phone: `0923456789`
  - Email: `phamvanc@gmail.com`
- Product: `SSTC SSD NVMe Gen4 1TB`
- Issue Description: `SSD không nhận diện, không đọc được dữ liệu`
- Priority: `Urgent`
- Warranty Type: `Warranty`
- Assigned To: `Kỹ Thuật Viên 1`

**Sau khi tạo**:
- Technician chẩn đoán: Lỗi firmware
- Manager thay thế SSD mới: `SSTC1TB-2025-001`
- Issue → RMA
- Complete ticket

---

### **Bước 11: Customers (TÙY CHỌN - chỉ cần nếu import từ hệ thống cũ)**

**Trang**: `/management/customers`

**Khi nào cần tạo Customers trước?**
- ✅ Bạn có dữ liệu khách hàng từ hệ thống cũ cần import
- ✅ Bạn muốn tạo sẵn danh sách khách hàng VIP/doanh nghiệp
- ❌ **KHÔNG CẦN** nếu bắt đầu hệ thống mới từ đầu

**Lý do**: Khi tạo Service Ticket, nếu khách hàng chưa có trong hệ thống, form sẽ cho phép tạo customer mới ngay tại chỗ. Đây là cách làm việc tự nhiên nhất cho trung tâm bảo hành.

**Dữ liệu gợi ý** (nếu muốn tạo sẵn để test):

**Khách hàng 1**:
- Name: `Nguyễn Văn A`
- Phone: `0901234567`
- Email: `nguyenvana@gmail.com`
- Address: `123 Nguyễn Huệ, Q.1, TP.HCM`

**Khách hàng 2**:
- Name: `Trần Thị B`
- Phone: `0912345678`
- Email: `tranthib@gmail.com`
- Address: `456 Lê Lợi, Q.3, TP.HCM`

**Khách hàng 3**:
- Name: `Phạm Văn C`
- Phone: `0923456789`
- Email: `phamvanc@gmail.com`
- Address: `789 Hai Bà Trưng, Q.1, TP.HCM`

**Khách hàng 4**:
- Name: `Lê Thị D`
- Phone: `0934567890`
- Email: `lethid@gmail.com`
- Address: `321 Trần Hưng Đạo, Q.5, TP.HCM`

---

## ✅ Hoàn Tất Setup

Sau khi tạo đủ dữ liệu theo bước 1-9 (bắt buộc) + bước 10 (bắt đầu vận hành), hệ thống đã sẵn sàng để:
- ✅ Tiếp nhận khách hàng
- ✅ Tạo service tickets
- ✅ Sửa chữa bằng parts
- ✅ Thay thế sản phẩm từ kho
- ✅ Track serial numbers
- ✅ Quản lý RMA

---

## 📝 Quick Reference

### URLs quan trọng:
- Setup admin: `http://localhost:3025/setup`
- Login: `http://localhost:3025/login`
- Dashboard: `http://localhost:3025/dashboard`

### Test accounts:
- Admin: `admin@sstc.vn`
- Manager: `manager@sstc.vn`
- Technician: `tech1@sstc.vn`
- Reception: `reception@sstc.vn`

### Workflows cơ bản:
1. **Repair**: Ticket → Add Parts → Complete
2. **Replacement**: Ticket → Issue from Warehouse → RMA
3. **GRN**: Create Receipt → Enter Serials → Approve

---

## 📚 Related Documentation

- **CLAUDE.md** - Full architecture overview
- **ROLES-AND-PERMISSIONS.md** - Complete RBAC specification
- **front-end-spec-grn-serial-entry.md** - Serial number entry workflow
