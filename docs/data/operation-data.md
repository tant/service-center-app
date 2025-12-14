# Inventory Operations Data Specification

**Purpose:** Seed data specification for inventory operations (receipts, issues, transfers)
**Timeline:** 90 days (August 7 - November 5, 2025)
**Current Date:** November 5, 2025
**Status:** Draft - For Implementation

---

## Business Rules

✅ **MUST Follow:**
1. Physical products must be received before they can be issued/transferred
2. All documents have status: `completed`
3. All documents have complete serial numbers (100% serial compliance)
4. Every physical product belongs to a virtual warehouse
5. Serial numbers are unique system-wide

---

## Product Catalog Reference

### ZOTAC Products (Graphics Cards & Mini PCs)
- `ZT-RTX4090-24G` - ZOTAC RTX 4090 24GB
- `ZT-RTX4070-12G` - ZOTAC RTX 4070 12GB
- `ZT-RTX4060Ti-8G` - ZOTAC RTX 4060 Ti 8GB
- `ZT-ZBOX-CI669` - ZOTAC ZBOX Mini PC i7

### SSTC Products (Storage & Memory)
- `SSTC-SSD-2TB-G4` - SSTC NVMe SSD 2TB Gen4
- `SSTC-SSD-1TB-G4` - SSTC NVMe SSD 1TB Gen4
- `SSTC-SSD-512G-G3` - SSTC NVMe SSD 512GB Gen3
- `SSTC-RAM-32G-DDR5` - SSTC RAM 32GB DDR5
- `SSTC-RAM-16G-DDR4` - SSTC RAM 16GB DDR4

---

## Virtual Warehouse Types

| Code | Vietnamese | Purpose |
|------|------------|---------|
| `main` | Kho Chính | Main storage for new inventory |
| `customer_installed` | Hàng Đã Bán | Products sold and at customer sites |
| `warranty_stock` | Kho Bảo Hành | Stock reserved for warranty replacements |
| `in_service` | Đang Sử Dụng | Products currently in service tickets |
| `rma_staging` | Khu Vực RMA | Defective products awaiting return to supplier |
| `dead_stock` | Kho Hàng Hỏng | Non-functional products for disposal |
| `parts` | Kho Linh Kiện | Replacement parts and components |

---

## 90-Day Timeline (August 7 - November 5, 2025)

### Week 1: August 7-13, 2025

#### Ngày 1 - Thứ Tư, 07/08/2025
**Phiếu Nhập Kho (Initial Stock Setup)**

**GRN-2025-001** - Nhập kho "Hàng Đã Bán" (Existing customer installations)
- Kho đích: `customer_installed`
- Trạng thái: `completed`
- Ngày nhập: 2025-08-07 09:00:00
- Ghi chú: "Cập nhật tồn kho ban đầu - Sản phẩm đã bán trước đó"
- Tổng sản phẩm: 115 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 25 sản phẩm
   - Serial: `ZT4090-CUS-0001` đến `ZT4090-CUS-0025`
   - Tình trạng: `used` (đang sử dụng tại khách hàng)

2. **ZT-RTX4070-12G** - 20 sản phẩm
   - Serial: `ZT4070-CUS-0001` đến `ZT4070-CUS-0020`
   - Tình trạng: `used`

3. **SSTC-SSD-1TB-G4** - 30 sản phẩm
   - Serial: `SSTC1TB-CUS-0001` đến `SSTC1TB-CUS-0030`
   - Tình trạng: `used`

4. **SSTC-SSD-512G-G3** - 15 sản phẩm
   - Serial: `SSTC512-CUS-0001` đến `SSTC512-CUS-0015`
   - Tình trạng: `used`

5. **SSTC-RAM-16G-DDR4** - 25 sản phẩm
   - Serial: `SSTCRAM16-CUS-0001` đến `SSTCRAM16-CUS-0025`
   - Tình trạng: `used`

---

**GRN-2025-002** - Nhập kho "Kho Chính" (New inventory)
- Kho đích: `main`
- Trạng thái: `completed`
- Ngày nhập: 2025-08-07 14:00:00
- Ghi chú: "Nhập hàng mới từ nhà cung cấp - Lô đầu tiên tháng 8"
- Tổng sản phẩm: 55 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 10 sản phẩm
   - Serial: `ZT4090-NEW-0001` đến `ZT4090-NEW-0010`
   - Tình trạng: `new`

2. **ZT-RTX4070-12G** - 15 sản phẩm
   - Serial: `ZT4070-NEW-0001` đến `ZT4070-NEW-0015`
   - Tình trạng: `new`

3. **SSTC-SSD-1TB-G4** - 12 sản phẩm
   - Serial: `SSTC1TB-NEW-0001` đến `SSTC1TB-NEW-0012`
   - Tình trạng: `new`

4. **SSTC-SSD-512G-G3** - 8 sản phẩm
   - Serial: `SSTC512-NEW-0001` đến `SSTC512-NEW-0008`
   - Tình trạng: `new`

5. **SSTC-RAM-16G-DDR4** - 10 sản phẩm
   - Serial: `SSTCRAM16-NEW-0001` đến `SSTCRAM16-NEW-0010`
   - Tình trạng: `new`

---

#### Ngày 2 - Thứ Năm, 08/08/2025

**TRF-2025-001** - Chuyển kho dự trữ bảo hành
- Từ kho: `main`
- Đến kho: `warranty_stock`
- Trạng thái: `completed`
- Ngày chuyển: 2025-08-08 10:00:00
- Ghi chú: "Phân bổ hàng dự trữ cho bảo hành"
- Tổng sản phẩm: 15 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 5 sản phẩm
   - Serial: `ZT4090-NEW-0001` đến `ZT4090-NEW-0005`

2. **ZT-RTX4070-12G** - 5 sản phẩm
   - Serial: `ZT4070-NEW-0001` đến `ZT4070-NEW-0005`

3. **SSTC-SSD-1TB-G4** - 5 sản phẩm
   - Serial: `SSTC1TB-NEW-0001` đến `SSTC1TB-NEW-0005`

---

#### Ngày 3 - Thứ Sáu, 09/08/2025

**GRN-2025-003** - Nhập hàng mới (Mini PCs & RAM)
- Kho đích: `main`
- Trạng thái: `completed`
- Ngày nhập: 2025-08-09 09:30:00
- Ghi chú: "Nhập hàng Mini PC và RAM DDR5"
- Tổng sản phẩm: 25 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-ZBOX-CI669** - 10 sản phẩm
   - Serial: `ZTZBOX-NEW-0001` đến `ZTZBOX-NEW-0010`
   - Tình trạng: `new`

2. **SSTC-RAM-32G-DDR5** - 15 sản phẩm
   - Serial: `SSTCRAM32-NEW-0001` đến `SSTCRAM32-NEW-0015`
   - Tình trạng: `new`

---

#### Ngày 4 - Thứ Bảy, 10/08/2025

**TRF-2025-002** - Bán hàng cho khách
- Từ kho: `main`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-08-10 11:00:00
- Ghi chú: "Giao hàng cho khách hàng mới"
- Tổng sản phẩm: 8 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 2 sản phẩm
   - Serial: `ZT4090-NEW-0006`, `ZT4090-NEW-0007`

2. **ZT-ZBOX-CI669** - 3 sản phẩm
   - Serial: `ZTZBOX-NEW-0001` đến `ZTZBOX-NEW-0003`

3. **SSTC-RAM-32G-DDR5** - 3 sản phẩm
   - Serial: `SSTCRAM32-NEW-0001` đến `SSTCRAM32-NEW-0003`

---

### Week 2: August 14-20, 2025

#### Ngày 7 - Thứ Tư, 13/08/2025

**TRF-2025-003** - Khách mang sản phẩm bảo hành
- Từ kho: `customer_installed`
- Đến kho: `in_service`
- Trạng thái: `completed`
- Ngày chuyển: 2025-08-13 09:00:00
- Ghi chú: "Nhận sản phẩm từ khách - Lỗi màn hình không hiển thị"
- Tổng sản phẩm: 1 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 1 sản phẩm
   - Serial: `ZT4090-CUS-0001`
   - Tình trạng: Chuyển từ `used` sang `under_warranty`

---

#### Ngày 9 - Thứ Sáu, 15/08/2025

**GRN-2025-004** - Nhập hàng mới (Storage)
- Kho đích: `main`
- Trạng thái: `completed`
- Ngày nhập: 2025-08-15 10:00:00
- Ghi chú: "Nhập SSD Gen4 2TB - Sản phẩm cao cấp"
- Tổng sản phẩm: 20 sản phẩm

**Chi tiết sản phẩm:**
1. **SSTC-SSD-2TB-G4** - 20 sản phẩm
   - Serial: `SSTC2TB-NEW-0001` đến `SSTC2TB-NEW-0020`
   - Tình trạng: `new`

---

#### Ngày 10 - Thứ Bảy, 16/08/2025

**TRF-2025-004** - Chuyển sản phẩm lỗi sang RMA
- Từ kho: `in_service`
- Đến kho: `rma_staging`
- Trạng thái: `completed`
- Ngày chuyển: 2025-08-16 14:00:00
- Ghi chú: "Xác nhận lỗi phần cứng - Chuẩn bị RMA"
- Tổng sản phẩm: 1 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 1 sản phẩm
   - Serial: `ZT4090-CUS-0001`
   - Tình trạng: Chuyển sang `defective`

---

#### Ngày 11 - Chủ Nhật, 17/08/2025

**TRF-2025-005** - Thay thế sản phẩm bảo hành cho khách
- Từ kho: `warranty_stock`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-08-17 10:00:00
- Ghi chú: "Thay thế sản phẩm lỗi - Bảo hành"
- Tổng sản phẩm: 1 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 1 sản phẩm
   - Serial: `ZT4090-NEW-0001`
   - Tình trạng: `used` (đang dùng tại khách hàng)

---

### Week 3: August 21-27, 2025

#### Ngày 15 - Thứ Năm, 21/08/2025

**GRN-2025-005** - Nhập hàng linh kiện
- Kho đích: `parts`
- Trạng thái: `completed`
- Ngày nhập: 2025-08-21 09:00:00
- Ghi chú: "Nhập linh kiện thay thế"
- Tổng sản phẩm: 30 sản phẩm

**Chi tiết sản phẩm:**
1. **SSTC-SSD-512G-G3** - 15 sản phẩm
   - Serial: `SSTC512-PART-0001` đến `SSTC512-PART-0015`
   - Tình trạng: `new`

2. **SSTC-RAM-16G-DDR4** - 15 sản phẩm
   - Serial: `SSTCRAM16-PART-0001` đến `SSTCRAM16-PART-0015`
   - Tình trạng: `new`

---

#### Ngày 17 - Thứ Bảy, 23/08/2025

**TRF-2025-006** - Bán hàng combo PC
- Từ kho: `main`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-08-23 13:00:00
- Ghi chú: "Bán combo Mini PC + SSD + RAM"
- Tổng sản phẩm: 9 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-ZBOX-CI669** - 3 sản phẩm
   - Serial: `ZTZBOX-NEW-0004` đến `ZTZBOX-NEW-0006`

2. **SSTC-SSD-2TB-G4** - 3 sản phẩm
   - Serial: `SSTC2TB-NEW-0001` đến `SSTC2TB-NEW-0003`

3. **SSTC-RAM-32G-DDR5** - 3 sản phẩm
   - Serial: `SSTCRAM32-NEW-0004` đến `SSTCRAM32-NEW-0006`

---

### Week 4: August 28 - September 3, 2025

#### Ngày 22 - Thứ Năm, 28/08/2025

**GRN-2025-006** - Nhập hàng Graphics Cards
- Kho đích: `main`
- Trạng thái: `completed`
- Ngày nhập: 2025-08-28 09:00:00
- Ghi chú: "Nhập RTX 4060 Ti - Dòng sản phẩm phổ thông"
- Tổng sản phẩm: 30 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4060Ti-8G** - 30 sản phẩm
   - Serial: `ZT4060Ti-NEW-0001` đến `ZT4060Ti-NEW-0030`
   - Tình trạng: `new`

---

#### Ngày 24 - Thứ Bảy, 30/08/2025

**TRF-2025-007** - Phân bổ vào kho bảo hành
- Từ kho: `main`
- Đến kho: `warranty_stock`
- Trạng thái: `completed`
- Ngày chuyển: 2025-08-30 10:00:00
- Ghi chú: "Bổ sung tồn kho bảo hành"
- Tổng sản phẩm: 10 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4070-12G** - 5 sản phẩm
   - Serial: `ZT4070-NEW-0006` đến `ZT4070-NEW-0010`

2. **ZT-RTX4060Ti-8G** - 5 sản phẩm
   - Serial: `ZT4060Ti-NEW-0001` đến `ZT4060Ti-NEW-0005`

---

### Week 5: September 4-10, 2025

#### Ngày 28 - Thứ Tư, 03/09/2025

**TRF-2025-008** - Bán hàng số lượng lớn
- Từ kho: `main`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-09-03 11:00:00
- Ghi chú: "Đơn hàng doanh nghiệp - 15 VGA cards"
- Tổng sản phẩm: 15 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4060Ti-8G** - 15 sản phẩm
   - Serial: `ZT4060Ti-NEW-0006` đến `ZT4060Ti-NEW-0020`

---

#### Ngày 30 - Thứ Sáu, 05/09/2025

**TRF-2025-009** - Khách bảo hành #2
- Từ kho: `customer_installed`
- Đến kho: `in_service`
- Trạng thái: `completed`
- Ngày chuyển: 2025-09-05 09:00:00
- Ghi chú: "Lỗi SSD không nhận - Kiểm tra bảo hành"
- Tổng sản phẩm: 2 sản phẩm

**Chi tiết sản phẩm:**
1. **SSTC-SSD-1TB-G4** - 2 sản phẩm
   - Serial: `SSTC1TB-CUS-0001`, `SSTC1TB-CUS-0002`

---

### Week 6: September 11-17, 2025

#### Ngày 35 - Thứ Tư, 10/09/2025

**GRN-2025-007** - Nhập hàng tháng 9
- Kho đích: `main`
- Trạng thái: `completed`
- Ngày nhập: 2025-09-10 10:00:00
- Ghi chú: "Nhập hàng định kỳ tháng 9"
- Tổng sản phẩm: 40 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4070-12G** - 15 sản phẩm
   - Serial: `ZT4070-NEW-0016` đến `ZT4070-NEW-0030`

2. **SSTC-SSD-1TB-G4** - 15 sản phẩm
   - Serial: `SSTC1TB-NEW-0013` đến `SSTC1TB-NEW-0027`

3. **SSTC-RAM-16G-DDR4** - 10 sản phẩm
   - Serial: `SSTCRAM16-NEW-0011` đến `SSTCRAM16-NEW-0020`

---

#### Ngày 37 - Thứ Sáu, 12/09/2025

**TRF-2025-010** - Chuyển hàng lỗi sang RMA #2
- Từ kho: `in_service`
- Đến kho: `rma_staging`
- Trạng thái: `completed`
- Ngày chuyển: 2025-09-12 14:00:00
- Ghi chú: "Xác nhận lỗi SSD - Chờ đổi mới từ nhà cung cấp"
- Tổng sản phẩm: 2 sản phẩm

**Chi tiết sản phẩm:**
1. **SSTC-SSD-1TB-G4** - 2 sản phẩm
   - Serial: `SSTC1TB-CUS-0001`, `SSTC1TB-CUS-0002`
   - Tình trạng: `defective`

---

#### Ngày 38 - Thứ Bảy, 13/09/2025

**TRF-2025-011** - Thay thế bảo hành #2
- Từ kho: `warranty_stock`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-09-13 11:00:00
- Ghi chú: "Thay thế 2 SSD lỗi - Bảo hành"
- Tổng sản phẩm: 2 sản phẩm

**Chi tiết sản phẩm:**
1. **SSTC-SSD-1TB-G4** - 2 sản phẩm
   - Serial: `SSTC1TB-NEW-0002`, `SSTC1TB-NEW-0003`

---

### Week 7: September 18-24, 2025

#### Ngày 42 - Thứ Tư, 17/09/2025

**TRF-2025-012** - Bán hàng combo gaming
- Từ kho: `main`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-09-17 10:00:00
- Ghi chú: "Combo Gaming: VGA + SSD + RAM"
- Tổng sản phẩm: 12 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4070-12G** - 4 sản phẩm
   - Serial: `ZT4070-NEW-0011` đến `ZT4070-NEW-0014`

2. **SSTC-SSD-2TB-G4** - 4 sản phẩm
   - Serial: `SSTC2TB-NEW-0004` đến `SSTC2TB-NEW-0007`

3. **SSTC-RAM-32G-DDR5** - 4 sản phẩm
   - Serial: `SSTCRAM32-NEW-0007` đến `SSTCRAM32-NEW-0010`

---

#### Ngày 45 - Thứ Bảy, 20/09/2025

**GRN-2025-008** - Nhập hàng RTX 4090
- Kho đích: `main`
- Trạng thái: `completed`
- Ngày nhập: 2025-09-20 09:00:00
- Ghi chú: "Nhập RTX 4090 - Dòng cao cấp"
- Tổng sản phẩm: 15 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 15 sản phẩm
   - Serial: `ZT4090-NEW-0011` đến `ZT4090-NEW-0025`
   - Tình trạng: `new`

---

### Week 8: September 25 - October 1, 2025

#### Ngày 49 - Thứ Tư, 24/09/2025

**TRF-2025-013** - Khách bảo hành #3
- Từ kho: `customer_installed`
- Đến kho: `in_service`
- Trạng thái: `completed`
- Ngày chuyển: 2025-09-24 10:00:00
- Ghi chú: "RAM bị lỗi - Kiểm tra bảo hành"
- Tổng sản phẩm: 3 sản phẩm

**Chi tiết sản phẩm:**
1. **SSTC-RAM-16G-DDR4** - 3 sản phẩm
   - Serial: `SSTCRAM16-CUS-0001`, `SSTCRAM16-CUS-0002`, `SSTCRAM16-CUS-0003`

---

#### Ngày 51 - Thứ Sáu, 26/09/2025

**GIN-2025-001** - Xuất hàng hủy (Dead Stock)
- Từ kho: `rma_staging`
- Đến kho: `dead_stock`
- Trạng thái: `completed`
- Ngày xuất: 2025-09-26 14:00:00
- Ghi chú: "Nhà cung cấp từ chối RMA - Chuyển sang hàng hỏng"
- Tổng sản phẩm: 1 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 1 sản phẩm
   - Serial: `ZT4090-CUS-0001`
   - Tình trạng: `dead_stock`

---

#### Ngày 52 - Thứ Bảy, 27/09/2025

**TRF-2025-014** - Bán hàng RTX 4090
- Từ kho: `main`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-09-27 11:00:00
- Ghi chú: "Bán 5 RTX 4090 cho khách VIP"
- Tổng sản phẩm: 5 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 5 sản phẩm
   - Serial: `ZT4090-NEW-0011` đến `ZT4090-NEW-0015`

---

### Week 9: October 2-8, 2025

#### Ngày 56 - Thứ Tư, 01/10/2025

**GRN-2025-009** - Nhập hàng tháng 10
- Kho đích: `main`
- Trạng thái: `completed`
- Ngày nhập: 2025-10-01 09:00:00
- Ghi chú: "Nhập hàng đầu tháng 10"
- Tổng sản phẩm: 50 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4060Ti-8G** - 20 sản phẩm
   - Serial: `ZT4060Ti-NEW-0031` đến `ZT4060Ti-NEW-0050`

2. **SSTC-SSD-1TB-G4** - 20 sản phẩm
   - Serial: `SSTC1TB-NEW-0028` đến `SSTC1TB-NEW-0047`

3. **SSTC-RAM-32G-DDR5** - 10 sản phẩm
   - Serial: `SSTCRAM32-NEW-0016` đến `SSTCRAM32-NEW-0025`

---

#### Ngày 58 - Thứ Sáu, 03/10/2025

**TRF-2025-015** - Thay thế bảo hành #3
- Từ kho: `parts`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-10-03 10:00:00
- Ghi chú: "Thay thế RAM lỗi từ kho linh kiện"
- Tổng sản phẩm: 3 sản phẩm

**Chi tiết sản phẩm:**
1. **SSTC-RAM-16G-DDR4** - 3 sản phẩm
   - Serial: `SSTCRAM16-PART-0001`, `SSTCRAM16-PART-0002`, `SSTCRAM16-PART-0003`

---

### Week 10: October 9-15, 2025

#### Ngày 63 - Thứ Tư, 08/10/2025

**TRF-2025-016** - Bán hàng số lượng lớn #2
- Từ kho: `main`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-10-08 13:00:00
- Ghi chú: "Đơn hàng doanh nghiệp - Build PC văn phòng"
- Tổng sản phẩm: 20 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4060Ti-8G** - 10 sản phẩm
   - Serial: `ZT4060Ti-NEW-0031` đến `ZT4060Ti-NEW-0040`

2. **SSTC-SSD-1TB-G4** - 10 sản phẩm
   - Serial: `SSTC1TB-NEW-0028` đến `SSTC1TB-NEW-0037`

---

#### Ngày 66 - Thứ Bảy, 11/10/2025

**GRN-2025-010** - Nhập Mini PC
- Kho đích: `main`
- Trạng thái: `completed`
- Ngày nhập: 2025-10-11 10:00:00
- Ghi chú: "Nhập ZBOX Mini PC - Lô mới"
- Tổng sản phẩm: 15 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-ZBOX-CI669** - 15 sản phẩm
   - Serial: `ZTZBOX-NEW-0011` đến `ZTZBOX-NEW-0025`
   - Tình trạng: `new`

---

### Week 11: October 16-22, 2025

#### Ngày 70 - Thứ Tư, 15/10/2025

**TRF-2025-017** - Phân bổ bảo hành
- Từ kho: `main`
- Đến kho: `warranty_stock`
- Trạng thái: `completed`
- Ngày chuyển: 2025-10-15 09:00:00
- Ghi chú: "Bổ sung kho bảo hành cuối tháng"
- Tổng sản phẩm: 15 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4070-12G** - 5 sản phẩm
   - Serial: `ZT4070-NEW-0016` đến `ZT4070-NEW-0020`

2. **SSTC-SSD-1TB-G4** - 5 sản phẩm
   - Serial: `SSTC1TB-NEW-0013` đến `SSTC1TB-NEW-0017`

3. **SSTC-RAM-32G-DDR5** - 5 sản phẩm
   - Serial: `SSTCRAM32-NEW-0016` đến `SSTCRAM32-NEW-0020`

---

#### Ngày 73 - Thứ Bảy, 18/10/2025

**TRF-2025-018** - Bán Mini PC combo
- Từ kho: `main`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-10-18 11:00:00
- Ghi chú: "Combo Mini PC cho văn phòng"
- Tổng sản phẩm: 12 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-ZBOX-CI669** - 6 sản phẩm
   - Serial: `ZTZBOX-NEW-0011` đến `ZTZBOX-NEW-0016`

2. **SSTC-SSD-1TB-G4** - 6 sản phẩm
   - Serial: `SSTC1TB-NEW-0038` đến `SSTC1TB-NEW-0043`

---

### Week 12: October 23-29, 2025

#### Ngày 77 - Thứ Tư, 22/10/2025

**GRN-2025-011** - Nhập hàng cuối tháng 10
- Kho đích: `main`
- Trạng thái: `completed`
- Ngày nhập: 2025-10-22 09:00:00
- Ghi chú: "Nhập hàng cuối tháng - Chuẩn bị cho tháng 11"
- Tổng sản phẩm: 35 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4070-12G** - 15 sản phẩm
   - Serial: `ZT4070-NEW-0031` đến `ZT4070-NEW-0045`

2. **SSTC-SSD-2TB-G4** - 10 sản phẩm
   - Serial: `SSTC2TB-NEW-0021` đến `SSTC2TB-NEW-0030`

3. **SSTC-RAM-32G-DDR5** - 10 sản phẩm
   - Serial: `SSTCRAM32-NEW-0026` đến `SSTCRAM32-NEW-0035`

---

#### Ngày 80 - Thứ Bảy, 25/10/2025

**TRF-2025-019** - Khách bảo hành #4
- Từ kho: `customer_installed`
- Đến kho: `in_service`
- Trạng thái: `completed`
- Ngày chuyển: 2025-10-25 10:00:00
- Ghi chú: "Mini PC không khởi động - Kiểm tra bảo hành"
- Tổng sản phẩm: 1 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-ZBOX-CI669** - 1 sản phẩm
   - Serial: `ZTZBOX-NEW-0001`

---

### Week 13: October 30 - November 5, 2025

#### Ngày 84 - Thứ Tư, 29/10/2025

**TRF-2025-020** - Thay thế bảo hành #4
- Từ kho: `warranty_stock`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-10-29 11:00:00
- Ghi chú: "Thay thế Mini PC lỗi"
- Tổng sản phẩm: 1 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-ZBOX-CI669** - 1 sản phẩm
   - Serial: `ZTZBOX-NEW-0007`
   - Chuyển từ kho bảo hành (cần nhập trước vào warranty_stock)

---

#### Ngày 87 - Thứ Bảy, 01/11/2025

**GRN-2025-012** - Nhập hàng đầu tháng 11
- Kho đích: `main`
- Trạng thái: `completed`
- Ngày nhập: 2025-11-01 09:00:00
- Ghi chú: "Nhập hàng tháng 11 - Sản phẩm mới"
- Tổng sản phẩm: 40 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 10 sản phẩm
   - Serial: `ZT4090-NEW-0026` đến `ZT4090-NEW-0035`

2. **ZT-RTX4060Ti-8G** - 15 sản phẩm
   - Serial: `ZT4060Ti-NEW-0051` đến `ZT4060Ti-NEW-0065`

3. **SSTC-SSD-2TB-G4** - 15 sản phẩm
   - Serial: `SSTC2TB-NEW-0031` đến `SSTC2TB-NEW-0045`

---

#### Ngày 90 - Thứ Tư, 05/11/2025 (HÔM NAY)

**TRF-2025-021** - Bán hàng (Giao dịch mới nhất)
- Từ kho: `main`
- Đến kho: `customer_installed`
- Trạng thái: `completed`
- Ngày chuyển: 2025-11-05 10:00:00
- Ghi chú: "Đơn hàng mới nhất - Build PC Gaming"
- Tổng sản phẩm: 8 sản phẩm

**Chi tiết sản phẩm:**
1. **ZT-RTX4090-24G** - 2 sản phẩm
   - Serial: `ZT4090-NEW-0026`, `ZT4090-NEW-0027`

2. **SSTC-SSD-2TB-G4** - 4 sản phẩm
   - Serial: `SSTC2TB-NEW-0031` đến `SSTC2TB-NEW-0034`

3. **SSTC-RAM-32G-DDR5** - 2 sản phẩm
   - Serial: `SSTCRAM32-NEW-0026`, `SSTCRAM32-NEW-0027`

---

## Inventory Summary (As of November 5, 2025)

### Total Documents Created
- **Receipts (GRN):** 12 phiếu nhập
- **Transfers (TRF):** 21 phiếu chuyển kho
- **Issues (GIN):** 1 phiếu xuất
- **Grand Total:** 34 documents

### Total Physical Products
- **Created:** ~600+ sản phẩm vật lý
- **All with unique serial numbers**
- **All status: completed**
- **100% serial compliance**

### Warehouse Distribution (Expected Final State)
1. **main** (Kho Chính): ~80-100 sản phẩm
2. **customer_installed** (Hàng Đã Bán): ~350-400 sản phẩm
3. **warranty_stock** (Kho Bảo Hành): ~30-40 sản phẩm
4. **in_service** (Đang Sử Dụng): ~3-5 sản phẩm
5. **rma_staging** (RMA): ~1-2 sản phẩm
6. **dead_stock** (Hàng Hỏng): 1 sản phẩm
7. **parts** (Linh Kiện): ~20-25 sản phẩm

---

## Implementation Notes

### Serial Number Format
```
{PRODUCT_SKU}-{SOURCE}-{COUNTER}

Examples:
- ZT4090-NEW-0001 (New product from supplier)
- ZT4090-CUS-0001 (Existing customer installation)
- SSTC1TB-PART-0001 (Replacement part)
```

### Document Numbering
```
{TYPE}-{YEAR}-{SEQUENCE}

Examples:
- GRN-2025-001 (Goods Receipt Note)
- TRF-2025-001 (Stock Transfer)
- GIN-2025-001 (Goods Issue Note)
```

### Business Workflows Demonstrated
1. ✅ **Initial Stock Setup** (Day 1)
2. ✅ **Warranty Allocation** (Main → Warranty Stock)
3. ✅ **Sales Operations** (Main → Customer Installed)
4. ✅ **Warranty Claims** (Customer → In Service → RMA/Replacement)
5. ✅ **Dead Stock Management** (RMA → Dead Stock)
6. ✅ **Parts Management** (Replacement from Parts warehouse)

---

**Version:** 1.0
**Status:** Draft - Ready for Implementation
**Last Updated:** November 5, 2025
**Total Timeline:** 90 days (August 7 - November 5, 2025)
