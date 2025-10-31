# Data Setup Guide - Thứ Tự Tạo Dữ Liệu

## Thứ Tự Khuyến Nghị

Hãy tạo dữ liệu theo thứ tự sau để hệ thống hoạt động được ngay:

1. **Admin User** - Tài khoản quản trị
2. **Staff Users** - Manager, Technicians, Reception
3. **Physical Warehouses** - Kho vật lý và kho ảo (*tự động* - hệ thống đã tạo sẵn)
4. **Brands** - Nhãn hàng (ZOTAC, SSTC...)
5. **Parts** - Linh kiện (Fan, Capacitor, HDMI Port...)
6. **Products** - Sản phẩm (VGA, SSD, RAM...) - Bind parts vào products
7. **Physical Products** - Nhập hàng bảo hành vào kho
8. **Task Types** - Loại công việc (*tự động* - đã có 41 task types)
9. **Task Templates** - Mẫu quy trình (*có 2 mẫu* - khuyến nghị tạo thêm)
10. **Service Tickets** - Bắt đầu vận hành
11. **Customers** - Khách hàng (*tùy chọn* - chỉ cần nếu import từ hệ thống cũ)

---

### **Ghi chú**:
- ✅ **Bước 1-2, 4-7**: Bắt buộc phải tạo để hệ thống hoạt động
- 🟦 **Bước 3, 8**: Đã tự động tạo sẵn - chỉ cần xem/chỉnh sửa nếu cần
- 🟡 **Bước 9**: Có 2 templates mẫu - khuyến nghị tạo thêm 3-5 templates trước khi vận hành
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

### **Bước 3: Physical Warehouses & Virtual Warehouses** (TÙY CHỌN)

**Trang**: `/inventory/warehouses`

**✅ Hệ thống đã tự động tạo sẵn:**
- **Kho vật lý mặc định**: `Công ty` (Code: `COMPANY`) - Kho chính không thể xóa
- **7 kho ảo (Virtual Warehouses)**:
  - `Kho Chính` (main)
  - `Kho Bảo Hành` (warranty_stock)
  - `Khu Vực RMA` (rma_staging)
  - `Kho Hàng Hỏng` (dead_stock)
  - `Đang Sử Dụng` (in_service)
  - `Kho Linh Kiện` (parts)
  - `Hàng Đã Bán` (customer_installed)

**Kho mặc định được tạo tự động** sau khi chạy `pnpx supabase db reset`.

---

#### **Bước 3a: Tùy chọn - Thêm kho vật lý (Physical Warehouses)**

Nếu công ty bạn có nhiều địa điểm, bạn có thể tạo thêm kho vật lý:

**Ví dụ - Kho chi nhánh Hà Nội**:
- Name: `Hà Nội`
- Code: `WH-HANOI`
- Location: `123 Trần Duy Hưng, Quận Cầu Giấy, Hà Nội`
- Description: `Chi nhánh Hà Nội`

**Sau khi tạo kho vật lý mới**, hệ thống sẽ tự động tạo sẵn 7 kho ảo liên kết với kho đó.

---

#### **Bước 3b: Tùy chọn - Chỉnh sửa kho mặc định**

Bạn có thể chỉnh sửa thông tin kho mặc định "Công ty":
- ✅ Có thể sửa: Name, Location, Description
- ❌ Không thể xóa: Kho mặc định được bảo vệ bởi hệ thống

**Gợi ý**: Cập nhật địa chỉ kho chính của công ty bạn vào trường "Location".

---

**Tham khảo**: Chi tiết về Default Warehouse System tại `docs/architecture/DEFAULT-WAREHOUSE-SYSTEM.md`

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

### **Bước 8: Task Types (ĐÃ TỰ ĐỘNG TẠO SẴN ✅)**

**✅ Hệ thống đã tự động tạo sẵn 41 Task Types** trong database khi chạy schema setup.

**Bạn KHÔNG cần tạo gì** - chỉ cần biết:
- ✅ Xem danh sách task types tại `/workflows/task-types`
- ✅ Có thể chỉnh sửa nếu cần (tên, mô tả, thời gian ước tính)
- ✅ Có thể thêm task types mới nếu cần thiết

**Task Types đã có sẵn**:
- 19 tasks Bắt buộc: Tiếp nhận, Chẩn đoán, Sửa chữa, QC, Giao hàng, Warehouse
- 10 tasks Khuyến nghị: Testing, Documentation, Communication
- 12 tasks Tùy chọn: Waiting, Approval, Maintenance, Billing

**➡️ Bỏ qua bước này, chuyển sang Bước 9.**

---

### **Bước 9: Task Templates (ĐÃ CÓ 2 MẪU - KHUYẾN NGHỊ TẠO THÊM)**

**✅ Hệ thống đã tạo sẵn 2 Task Templates mẫu** trong database:

1. **Sửa chữa VGA - Thay linh kiện** (17 tasks, không bắt buộc thứ tự)
   - Áp dụng cho: ZOTAC RTX 4070 Gaming
   - Khi nào dùng: Lỗi phần cứng nhỏ, sửa bằng parts

2. **Thay thế VGA - Xuất kho bảo hành** (16 tasks, bắt buộc thứ tự)
   - Áp dụng cho: ZOTAC RTX 4070 Gaming
   - Khi nào dùng: Lỗi nghiêm trọng, thay toàn bộ sản phẩm

**❗ KHUYẾN NGHỊ tạo thêm 3-5 templates** cho các workflow phổ biến của bạn:
- Sửa chữa/thay thế SSD
- Sửa chữa/thay thế RAM
- Quy trình RMA
- Sửa chữa trả phí (out of warranty)
- Nâng cấp sản phẩm (upgrade service)

**Cách tạo template mới** tại `/workflows/templates`:
1. Click "Tạo Template"
2. Nhập thông tin cơ bản:
   - **Name**: Tên template (ví dụ: "Sửa chữa SSD - Lỗi firmware")
   - **Description**: Mô tả chi tiết quy trình
   - **Product**: Chọn sản phẩm áp dụng
   - **Service Type**: Warranty / Paid Service / Out of Warranty
   - **Enforce Sequence**: true (bắt buộc thứ tự) hoặc false (linh hoạt)
3. Thêm tasks vào template:
   - Chọn Task Type từ 41 tasks đã có
   - Đặt thứ tự (Sequence Order)
   - Chọn Required/Optional
   - Thêm Custom Instructions (hướng dẫn riêng) nếu cần

**➡️ Bạn có thể bỏ qua bước này để test, nhưng nên tạo thêm templates trước khi vận hành chính thức.**

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
