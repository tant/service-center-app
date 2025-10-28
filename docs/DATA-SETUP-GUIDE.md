# Data Setup Guide - Thứ Tự Tạo Dữ Liệu

## Thứ Tự Khuyến Nghị

Hãy tạo dữ liệu theo thứ tự sau để hệ thống hoạt động được ngay:

1. **Admin User** - Tài khoản quản trị
2. **Staff Users** - Manager, Technicians, Reception
3. **Physical Warehouses** - Kho vật lý và kho ảo
4. **Brands** - Nhãn hàng (ZOTAC, SSTC...)
5. **Products** - Sản phẩm (VGA, SSD, RAM...)
6. **Parts** - Linh kiện (Fan, Thermal pad...)
7. **Physical Products** - Nhập hàng bảo hành vào kho
8. **Customers** - Khách hàng
9. **Task Types** - Loại công việc (tùy chọn)
10. **Task Templates** - Mẫu quy trình (tùy chọn)
11. **Service Tickets** - Bắt đầu vận hành

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

### **Bước 3: Physical Warehouses**

**Trang**: `/inventory/warehouses`

**Dữ liệu gợi ý**:

**Kho vật lý 1: Kho nhà cũ**
- Name: `Kho nhà cũ`
- Code: `WH-OLD-HOUSE`
- Location: `69/18 Nguyễn Cửu Đàm, Phường Tân Sơn Nhì, TP.HCM`
- Description: `Kho cũ dùng cho sản phẩm hỏng không còn giá trị`

**Kho ảo bên dưới kho này**:
- Virtual Warehouse Type: `dead_stock`
- Display Name: `Hàng hỏng - Kho nhà cũ`
- Description: `Sản phẩm hỏng không sửa được, chờ thanh lý`
- Color Code: `#dc2626` (đỏ)

---

**Kho vật lý 2: SSTC** (Kho chính)
- Name: `SSTC`
- Code: `WH-SSTC-MAIN`
- Location: `69/18 Nguyễn Cửu Đàm, Phường Tân Sơn Nhì, TP.HCM`
- Description: `Kho chính SSTC Service Center`

**Kho ảo bên dưới kho này**:

1. Virtual Warehouse Type: `warranty_stock`
   - Display Name: `Kho bảo hành - SSTC`
   - Description: `Sản phẩm bảo hành mới, sẵn sàng thay thế cho khách`
   - Color Code: `#16a34a` (xanh lá)

2. Virtual Warehouse Type: `rma_staging`
   - Display Name: `Kho RMA - SSTC`
   - Description: `Sản phẩm lỗi chờ trả về nhà cung cấp (ZOTAC, SSTC)`
   - Color Code: `#ea580c` (cam)

3. Virtual Warehouse Type: `dead_stock`
   - Display Name: `Hàng hỏng - SSTC`
   - Description: `Sản phẩm hỏng không RMA được, chờ thanh lý`
   - Color Code: `#dc2626` (đỏ)

4. Virtual Warehouse Type: `in_service`
   - Display Name: `Đang sửa chữa - SSTC`
   - Description: `Sản phẩm đang được sử dụng trong service tickets`
   - Color Code: `#2563eb` (xanh dương)

5. Virtual Warehouse Type: `parts`
   - Display Name: `Kho linh kiện - SSTC`
   - Description: `Linh kiện thay thế (fan, thermal pad, capacitor...)`
   - Color Code: `#7c3aed` (tím)

---

**Kho vật lý 3: Hà Nội**
- Name: `Hà Nội`
- Code: `WH-HANOI`
- Location: `123 Trần Duy Hưng, Quận Cầu Giấy, Hà Nội`
- Description: `Chi nhánh Hà Nội - kho tạm thời`

**Kho ảo**: Không cần tạo kho ảo cho kho này

---

### **Bước 4: Brands**

**Trang**: `/catalog/brands`

**Dữ liệu gợi ý**:
1. Name: `ZOTAC`, Description: `Card đồ họa và Mini PC`
2. Name: `SSTC`, Description: `SSD, RAM, Barebone PC`
3. Name: `Kingston`, Description: `RAM và Storage`
4. Name: `Samsung`, Description: `SSD và RAM`

---

### **Bước 5: Products**

**Trang**: `/catalog/products`

**Dữ liệu gợi ý**:

**Card đồ họa ZOTAC**:
- Name: `ZOTAC RTX 4070 Gaming`
- Type: `VGA`
- Brand: `ZOTAC`
- Model: `RTX 4070`
- SKU: `ZT-4070-G`
- Warranty: `36` tháng

- Name: `ZOTAC RTX 4060 Ti`
- Type: `VGA`
- Brand: `ZOTAC`
- Model: `RTX 4060 Ti`
- SKU: `ZT-4060Ti`
- Warranty: `36` tháng

**SSD SSTC**:
- Name: `SSTC SSD NVMe Gen4 1TB`
- Type: `SSD`
- Brand: `SSTC`
- Model: `NVMe Gen4 1TB`
- SKU: `SSTC-1TB-G4`
- Warranty: `60` tháng

- Name: `SSTC SSD NVMe Gen3 512GB`
- Type: `SSD`
- Brand: `SSTC`
- Model: `NVMe Gen3 512GB`
- SKU: `SSTC-512GB-G3`
- Warranty: `60` tháng

**RAM SSTC**:
- Name: `SSTC DDR4 16GB 3200MHz`
- Type: `RAM`
- Brand: `SSTC`
- Model: `DDR4 16GB 3200`
- SKU: `SSTC-16GB-3200`
- Warranty: `60` tháng

**Mini PC ZOTAC**:
- Name: `ZOTAC ZBOX Mini PC`
- Type: `MiniPC`
- Brand: `ZOTAC`
- Model: `ZBOX CI series`
- SKU: `ZBOX-CI`
- Warranty: `36` tháng

---

### **Bước 6: Parts**

**Trang**: `/catalog/parts`

**Dữ liệu gợi ý**:

**Linh kiện VGA**:
- Name: `Fan VGA ZOTAC 90mm`
- Part Number: `FAN-ZT-90`
- Category: `Cooling`
- Price: `150,000`
- Cost Price: `80,000`
- Stock Quantity: `20`
- Min Stock Level: `5`

**Linh kiện điện tử**:
- Name: `Capacitor 470uF 16V`
- Part Number: `CAP-470-16`
- Category: `Electronics`
- Price: `10,000`
- Cost Price: `5,000`
- Stock Quantity: `100`
- Min Stock Level: `20`

- Name: `HDMI Port Female`
- Part Number: `HDMI-F`
- Category: `Connectors`
- Price: `30,000`
- Cost Price: `15,000`
- Stock Quantity: `30`
- Min Stock Level: `10`

---

### **Bước 7: Physical Products (Nhập hàng bảo hành)**

**Trang**: `/inventory/documents/receipts`

**Tạo GRN (Goods Receipt Note)**:

**Phiếu nhập 1 - VGA ZOTAC**:
- Document Type: `Receipt`
- From: `ZOTAC Supplier`
- To Warehouse Type: `warranty_stock`
- To Physical Warehouse: `SSTC` (Kho bảo hành - SSTC)
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
- Document Type: `Receipt`
- From: `SSTC Supplier`
- To Warehouse Type: `warranty_stock`
- To Physical Warehouse: `SSTC` (Kho bảo hành - SSTC)
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

### **Bước 8: Customers**

**Trang**: `/management/customers`

**Dữ liệu gợi ý**:
- Name: `Nguyễn Văn A`
- Phone: `0901234567`
- Email: `nguyenvana@gmail.com`
- Address: `123 Nguyễn Huệ, Q.1, TP.HCM`

- Name: `Trần Thị B`
- Phone: `0912345678`
- Email: `tranthib@gmail.com`
- Address: `456 Lê Lợi, Q.3, TP.HCM`

- Name: `Phạm Văn C`
- Phone: `0923456789`
- Email: `phamvanc@gmail.com`
- Address: `789 Hai Bà Trưng, Q.1, TP.HCM`

- Name: `Lê Thị D`
- Phone: `0934567890`
- Email: `lethid@gmail.com`
- Address: `321 Trần Hưng Đạo, Q.5, TP.HCM`

---

### **Bước 9: Task Types (Tùy chọn - cho workflow automation)**

**Trang**: `/workflows/task-types`

**Dữ liệu gợi ý**: Danh sách đầy đủ các công việc có thể có tại trung tâm bảo hành

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
| 19 | Nhập kho RMA | Warehouse | 10 | ✅ Yes | ✅ Yes | **Bắt buộc** | Chuyển sản phẩm lỗi vào kho RMA |
| 20 | Tạo phiếu RMA | Documentation | 15 | ✅ Yes | ❌ No | Khuyến nghị | Tạo phiếu trả hàng về nhà cung cấp |
| **KIỂM TRA CHẤT LƯỢNG (QC)** |
| 21 | Kiểm tra sau sửa | QC | 20 | ✅ Yes | ❌ No | **Bắt buộc** | Test sản phẩm sau khi sửa chữa xong |
| 22 | Test ổn định | QC | 30 | ✅ Yes | ❌ No | Khuyến nghị | Test sản phẩm chạy ổn định trong 30 phút |
| 23 | Kiểm tra cuối cùng | QC | 15 | ✅ Yes | ✅ Yes | **Bắt buộc** | Kiểm tra toàn diện trước khi giao khách |
| 24 | Chụp ảnh kết quả | Documentation | 5 | ❌ No | ✅ Yes | Khuyến nghị | Chụp ảnh sản phẩm sau sửa, kết quả test |
| **GIAO HÀNG (Delivery)** |
| 25 | Thông báo khách hàng | Communication | 5 | ✅ Yes | ❌ No | **Bắt buộc** | Gọi điện/nhắn tin thông báo sản phẩm đã xong |
| 26 | Đóng gói sản phẩm | Packaging | 10 | ❌ No | ❌ No | **Bắt buộc** | Đóng gói cẩn thận, đính kèm phụ kiện |
| 27 | Giao hàng | Delivery | 15 | ✅ Yes | ❌ No | **Bắt buộc** | Giao sản phẩm cho khách, thu tiền (nếu có) |
| 28 | Hướng dẫn sử dụng | Support | 10 | ❌ No | ❌ No | Tùy chọn | Hướng dẫn khách cách sử dụng, bảo quản |
| **QUẢN LÝ KHO (Warehouse)** |
| 29 | Nhập kho hàng mới | Warehouse | 30 | ✅ Yes | ❌ No | **Bắt buộc** | Tạo GRN, nhập sản phẩm bảo hành vào kho |
| 30 | Nhập serial number | Warehouse | 45 | ✅ Yes | ❌ No | **Bắt buộc** | Nhập serial cho từng sản phẩm trong GRN |
| 31 | Kiểm kê kho | Warehouse | 120 | ✅ Yes | ❌ No | Khuyến nghị | Kiểm kê định kỳ tồn kho, đối chiếu số liệu |
| 32 | Chuyển kho | Warehouse | 15 | ✅ Yes | ❌ No | Tùy chọn | Chuyển sản phẩm giữa các kho vật lý |
| **KHÁC (Others)** |
| 33 | Chờ phụ tùng | Waiting | - | ✅ Yes | ❌ No | Tùy chọn | Đánh dấu đang chờ linh kiện về |
| 34 | Chờ phê duyệt | Approval | - | ✅ Yes | ❌ No | Tùy chọn | Chờ manager phê duyệt báo giá/thay thế |
| 35 | Liên hệ nhà cung cấp | Communication | 15 | ✅ Yes | ❌ No | Tùy chọn | Liên hệ ZOTAC, SSTC về bảo hành, RMA |
| 36 | Chờ khách quyết định | Waiting | - | ✅ Yes | ❌ No | Tùy chọn | Chờ khách xác nhận có sửa/không sửa |

---

**Ghi chú**:
- **Bắt buộc**: Các công việc không thể thiếu trong workflow, nên tạo ngay
- **Khuyến nghị**: Các công việc quan trọng, giúp quy trình chuyên nghiệp hơn
- **Tùy chọn**: Các công việc không cấp thiết, tùy vào nhu cầu cụ thể

**Hướng dẫn tạo**:
1. Tạo tất cả task types **Bắt buộc** trước (15 tasks)
2. Tạo thêm task types **Khuyến nghị** nếu muốn quy trình chuyên nghiệp (10 tasks)
3. Tạo task types **Tùy chọn** khi cần thiết (11 tasks)

---

### **Bước 10: Task Templates (Tùy chọn - cho workflow automation)**

**Trang**: `/workflows/templates`

**Dữ liệu gợi ý**:

**Template 1: Quy trình sửa chữa VGA**
- Name: `Quy trình sửa chữa VGA`
- Product Type: `ZOTAC RTX 4070 Gaming` (hoặc product khác)
- Service Type: `Warranty`
- Enforce Sequence: `false`

**Tasks trong template**:
1. Sequence 1: `Kiểm tra ban đầu`
2. Sequence 2: `Chẩn đoán lỗi`
3. Sequence 3: `Sửa chữa - Thay linh kiện`
4. Sequence 4: `Kiểm tra chất lượng`
5. Sequence 5: `Giao hàng`

**Template 2: Quy trình thay thế VGA**
- Name: `Quy trình thay thế VGA`
- Product Type: `ZOTAC RTX 4070 Gaming`
- Service Type: `Warranty`
- Enforce Sequence: `true`

**Tasks trong template**:
1. Sequence 1: `Kiểm tra ban đầu`
2. Sequence 2: `Chẩn đoán lỗi`
3. Sequence 3: `Thay thế sản phẩm`
4. Sequence 4: `Kiểm tra chất lượng`
5. Sequence 5: `Giao hàng`

---

### **Bước 11: Service Tickets (Bắt đầu vận hành)**

**Trang**: `/operations/tickets`

**Ticket 1 - Sửa chữa (dùng Parts)**:
- Customer: `Nguyễn Văn A`
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
- Customer: `Trần Thị B`
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
- Customer: `Phạm Văn C`
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

## ✅ Hoàn Tất Setup

Sau khi tạo đủ dữ liệu theo 11 bước trên, hệ thống đã sẵn sàng để:
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
