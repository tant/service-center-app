# Frontend Guide - Service Center Application

**Version:** 1.0
**Date:** 2025-10-25
**Status:** Consolidated Master Document

---

## Introduction

This document is the single source of truth for the frontend of the Service Center Application. It consolidates three previous documents:
- `USER_JOURNEY.md`
- `UX_UI_STANDARD.md`
- `frontend-specification.md`

It is organized into three main parts to provide a complete picture, from the user's perspective to the technical implementation.

---

## Table of Contents

### Part 1: The User Journey
- [The Story: Lifecycle of a Product](#the-story-lifecycle-of-a-product)
- [Perspectives of Each Role](#perspectives-of-each-role)
  - [Customer - Anh Minh](#customer---anh-minh)
  - [Reception Staff - Chị Lan](#reception-staff---chị-lan)
  - [Technician - Anh Tùng](#technician---anh-tùng)
  - [Manager - Anh Hùng](#manager---anh-hùng)
- [Other Scenarios](#other-scenarios)

### Part 2: UX/UI Design Standard
- [Page Structure](#page-structure-1)
- [Layout Components](#layout-components)
- [Table Components](#table-components)
- [Pagination System](#pagination-system)
- [Interactive Elements](#interactive-elements)
- [Responsive Design](#responsive-design)
- [Spacing & Typography](#spacing--typography)
- [Accessibility](#accessibility)
- [Implementation Checklist](#implementation-checklist)

### Part 3: Frontend Technical Specification
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Component Organization](#component-organization)
- [State Management](#state-management)
- [Routing](#routing)
- [Data Fetching](#data-fetching)
- [Forms & Validation](#forms--validation)

---
---

# Part 1: The User Journey

*This section provides the "why" behind our application by telling the story of a product's service lifecycle from multiple perspectives.*

## 📖 The Story: Lifecycle of a Product

### Gặp Vấn Đề

**Anh Minh ở Đà Nẵng** vừa phát hiện chiếc card đồ họa ZOTAC RTX 4080 của mình có vấn đề:
- Quạt tản nhiệt không quay
- Máy nóng lên đến 92°C khi chơi game
- Còn 6 tháng bảo hành

Anh Minh nghĩ: *"Mình phải gửi về trung tâm bảo hành ở TP.HCM. Nhưng làm sao để biết tình trạng xử lý? Bao giờ xong?"*

### Hành Trình Bắt Đầu

**Ngày 1 - Thứ Hai, 20/10/2025**

Anh Minh vào website của trung tâm, tìm thấy form "Gửi Yêu Cầu Dịch Vụ". Điền thông tin:
- Sản phẩm: Card đồ họa ZOTAC RTX 4080
- Serial: ZT-D40800D-10P-12345
- Vấn đề: Quạt không quay, nhiệt độ cao
- Gửi qua: VNPost, mã vận đơn VNP123456

**Nhấn "Gửi yêu cầu"**

→ Hệ thống tạo:
- **Mã phiếu yêu cầu:** SR-2025-001
- **Mã phiếu sản phẩm:** SV-2025-150

Email xác nhận đến ngay:
```
Kính chào Anh Minh,

Chúng tôi đã nhận được yêu cầu dịch vụ của anh.

📋 Mã phiếu yêu cầu: SR-2025-001
📱 Mã phiếu sản phẩm: SV-2025-150 (RTX 4080)

🔍 Tra cứu tiến độ: https://service.center/track
    Nhập mã: SR-2025-001 + SĐT: 0901234567

Dự kiến nhận hàng: 22/10/2025
Dự kiến hoàn tất: 24/10/2025

Trân trọng,
Trung Tâm Bảo Hành ZOTAC & SSTC
```

### Cuộc Hành Trình Của Card Đồ Họa

**Ngày 2 - Thứ Ba, 21/10**

Card RTX 4080 đang trên đường từ Đà Nẵng → TP.HCM (VNPost).

Anh Minh vào link tracking, nhập mã:
```
🔍 TRACKING: SR-2025-001
Status: ĐÃ TIẾP NHẬN YÊU CẦU

TIẾN TRÌNH: ██░░░░░░░░░░░░░░░░░░ 10%

TIMELINE:
✅ 20/10 14:30 - Đã tiếp nhận yêu cầu
⏳ 22/10 - Dự kiến nhận hàng
⏳ 24/10 - Dự kiến hoàn tất
```

---

**Ngày 3 - Thứ Tư, 22/10**

**09:00 - Bưu kiện đến trung tâm**

📦 **Chi Tiết Hành Trình:**

**Bước 1: Nhân viên tiếp nhận (Chị Lan)**
- Quét mã vận đơn VNP123456
- Hệ thống hiện: "Phiếu SR-2025-001, khách Anh Minh"
- Mở kiện, chụp ảnh
- Scan serial card: ZT-D40800D-10P-12345 ✓ (khớp)
- Kiểm tra: Hộp nguyên vẹn, seal OK
- Xác nhận nhận hàng

→ SMS tự động gửi cho Anh Minh:
```
📱 Đã nhận sản phẩm RTX 4080 (SV-2025-150).
   Đang chuyển bộ phận kỹ thuật kiểm tra.
   Tra cứu: service.center/track
```

Anh Minh tracking lại:
```
TIẾN TRÌNH: ████░░░░░░░░░░░░░░░░ 20%

TIMELINE:
✅ 20/10 14:30 - Đã tiếp nhận yêu cầu
✅ 22/10 09:00 - Đã nhận hàng (VNPost)
🔵 22/10 - Đang kiểm tra sơ bộ
⏳ 23/10 - Dự kiến hoàn tất kiểm tra
```

---

**14:00 - Kỹ thuật viên kiểm tra (Anh Tùng)**

**Bước 2: Kiểm tra sơ bộ**
- Seal: OK, chưa ai mở
- Bên ngoài: Không trầy xước
- Cắm thử: Quạt giữa không quay

**Bước 3: Chẩn đoán chuyên sâu**
- Chạy Furmark stress test 30 phút
- Kết quả:
  ```
  Fan 1: 1880 RPM ✓
  Fan 2: 0 RPM ✗ (không quay!)
  Fan 3: 1890 RPM ✓
  Nhiệt độ: 92°C (quá cao)
  ```
- Kết luận: Quạt số 2 bị kẹt, có thể sửa được

Anh Tùng ghi vào hệ thống:
```
Tình trạng: Quạt số 2 không hoạt động
Có thể sửa: CÓ
Phương án: Thay quạt tản nhiệt
```

Anh Minh nhận thông báo tracking:
```
TIẾN TRÌNH: ████████░░░░░░░░░░░░ 40%

CHI TIẾT:
📱 RTX 4080 (SV-2025-150)
   Tình trạng: Đang chờ phê duyệt bảo hành
   Ghi chú: Quạt tản nhiệt bị lỗi, có thể thay mới
```

---

**15:30 - Kiểm tra bảo hành**

Anh Tùng kiểm tra:
- Serial: ZT-D40800D-10P-12345 ✓ (hợp lệ)
- Ngày mua: 15/03/2024
- Thời hạn BH: 15/03/2026 (còn 6 tháng)
- Seal: Nguyên vẹn ✓
- Kết luận: **ĐỦ ĐIỀU KIỆN BẢO HÀNH**

---

**Ngày 4 - Thứ Năm, 23/10**

**09:00 - Quản lý duyệt (Anh Hùng)**

**Bước 4: Phê duyệt bảo hành**

Anh Hùng vào hệ thống, xem phiếu SV-2025-150:
- Khách hàng: Anh Minh (khách quen, 2 lần BH trước)
- Sản phẩm: RTX 4080
- Vấn đề: Quạt số 2 không quay
- Bảo hành: Còn hiệu lực
- Chi phí sửa: 0đ (bảo hành)
- Thời gian: ~2 giờ

**Phê duyệt:** "OK, sửa bảo hành miễn phí"

→ Thông báo cho khách:
```
📧 EMAIL

Kính gửi Anh Minh,

Chúng tôi đã kiểm tra xong sản phẩm RTX 4080 của anh.

🔧 CHẨN ĐOÁN:
- Quạt tản nhiệt số 2 không hoạt động
- Nguyên nhân: Quạt bị kẹt

✅ PHƯƠNG ÁN:
- Thay quạt tản nhiệt mới
- Chi phí: 0đ (bảo hành miễn phí)
- Thời gian: Dự kiến hoàn tất 23/10

Chúng tôi sẽ tiến hành sửa chữa ngay.

Trân trọng,
TTBH ZOTAC & SSTC
```

---

**10:00 - Kỹ thuật viên sửa chữa (Anh Tùng)**

**Bước 5: Sửa chữa**
- Tháo card, tháo quạt cũ
- Lắp quạt mới
- Thay keo tản nhiệt
- Lắp lại

**Bước 6: Testing**
- Chạy Furmark 30 phút
- Kết quả:
  ```
  Fan 1: 1850 RPM ✓
  Fan 2: 1870 RPM ✓ (đã OK!)
  Fan 3: 1880 RPM ✓
  Nhiệt độ: 68°C (bình thường)
  ```
- Kết luận: **HOÀN TẤT, CHẤT LƯỢNG TốT**

Tracking update:
```
TIẾN TRÌNH: ████████████████████ 100%

CHI TIẾT:
✅ RTX 4080 (SV-2025-150)
   Tình trạng: Hoàn tất
   Dự kiến xong: 23/10/2025 ✓
   Ghi chú: Đã thay quạt mới, test OK
```

---

**14:00 - Thông báo hoàn tất**

```
📧 + 📱 EMAIL & SMS

Kính gửi Anh Minh,

🎉 Sản phẩm RTX 4080 của anh đã được sửa xong!

✅ ĐÃ HOÀN TẤT:
- Thay quạt tản nhiệt mới
- Kiểm tra chất lượng: Pass
- Chi phí: 0đ (bảo hành)

📦 GIAO TRẢ:
Vui lòng chọn cách nhận hàng:
1. Gửi về Đà Nẵng (miễn phí)
2. Nhận tại trung tâm

Reply email hoặc gọi: 1900-xxxx

Trân trọng,
TTBH ZOTAC & SSTC
```

---

**Ngày 5 - Thứ Sáu, 24/10**

Anh Minh chọn "Gửi về Đà Nẵng", trung tâm ship miễn phí.

**Ngày 7 - Chủ Nhật, 26/10**

Anh Minh nhận được card, test lại:
- Quạt chạy êm
- Nhiệt độ ổn định
- Chơi game mượt

**Đánh giá 5 sao ⭐⭐⭐⭐⭐**

```
"Dịch vụ nhanh, chu đáo. Có thể tra cứu tiến độ online rất tiện.
Sẽ giới thiệu bạn bè!"
```

---

## 👥 Perspectives of Each Role

### 1️⃣ Customer - Anh Minh

#### 📱 Trải Nghiệm Của Tôi

**Bước 1: Gửi yêu cầu dịch vụ**

*"Tôi ở Đà Nẵng, cần gửi card về HCM bảo hành. May mà có form online!"*

Tôi vào website, điền form:
- Thông tin cá nhân (tên, SĐT, email, địa chỉ)
- Thông tin sản phẩm (loại, model, serial, vấn đề)
- Thông tin vận chuyển (chọn VNPost, nhập mã vận đơn)

Nhấn "Gửi" → Nhận email xác nhận với:
- ✅ Mã phiếu: SR-2025-001
- ✅ Link tracking: có thể tra cứu bất cứ lúc nào

**Bước 2: Gửi hàng**

*"Tôi đóng gói cẩn thận, gửi qua bưu điện."*

**Bước 3: Theo dõi tiến độ**

*"Không cần gọi điện hỏi! Chỉ cần vào link tracking."*

Tôi vào link, nhập:
- Mã phiếu: SR-2025-001
- SĐT: 0901234567

Thấy ngay:
- Tiến độ: 40%
- Đang làm gì: "Đang kiểm tra và chẩn đoán"
- Dự kiến xong: 24/10

**Bước 4: Nhận thông báo**

*"Email/SMS tự động báo từng bước, tôi yên tâm!"*

Nhận thông báo khi:
- Đã nhận hàng
- Đã chẩn đoán xong
- Đã phê duyệt bảo hành
- Hoàn tất sửa chữa

**Bước 5: Nhận hàng**

*"Họ ship miễn phí về Đà Nẵng, quá tiện!"*

Nhận card, test OK, hoàn hảo!

#### 💭 Cảm Nghĩ Của Tôi

**Điều tôi thích:**
- ✅ Có mã phiếu ngay, không phải đợi
- ✅ Tra cứu online 24/7, không cần gọi điện
- ✅ Thông báo tự động, minh bạch
- ✅ Biết trước dự kiến xong khi nào
- ✅ Ship 2 chiều miễn phí

**So với trước đây:**
- ❌ Trước: Gửi hàng rồi... im lặng, không biết gì
- ❌ Phải gọi điện hỏi hoài, tốn công
- ❌ Không biết bao giờ xong

**Giờ:** Mọi thứ rõ ràng, yên tâm! 😊

---

### 2️⃣ Reception Staff - Chị Lan

#### 🏢 Công Việc Của Tôi

**Sáng 9h - Nhận bưu kiện**

*"Hôm nay có 5 kiện đến, phải tiếp nhận nhanh."*

**Quy trình của tôi:**

**Bước 1: Scan mã vận đơn**
- Quét mã VNP123456
- Hệ thống tự động hiện:
  ```
  🔍 TÌM THẤY:
  Phiếu: SR-2025-001
  Khách: Anh Minh (0901234567)
  Sản phẩm: 1 x RTX 4080
  Serial dự kiến: ZT-D40800D-10P-12345
  ```

**Bước 2: Mở kiện & kiểm tra**
- Chụp ảnh bưu kiện (trước khi mở)
- Mở ra, chụp ảnh sản phẩm
- Kiểm tra:
  - [ ] Đúng sản phẩm? ✓
  - [ ] Serial khớp? ✓
  - [ ] Hộp nguyên vẹn? ✓
  - [ ] Seal OK? ✓

**Bước 3: Scan serial sản phẩm**
- Scan hoặc nhập: ZT-D40800D-10P-12345
- Hệ thống check:
  ```
  ✅ KHỚP với phiếu SV-2025-150
  ✅ Serial hợp lệ
  ✅ Còn bảo hành đến 15/03/2026
  ```

**Bước 4: Xác nhận nhận hàng**
- Click "Xác nhận nhận hàng"
- Upload ảnh (3 ảnh: kiện, sản phẩm, serial)
- Ghi chú (nếu có): "Hộp nguyên vẹn, không trầy xước"

→ Hệ thống tự động:
- Gửi SMS cho khách
- Chuyển phiếu sang bộ phận kỹ thuật
- Cập nhật tracking

**Bước 5: In phiếu & chuyển bộ phận**
- In phiếu nhỏ dán lên sản phẩm:
  ```
  SV-2025-150
  RTX 4080
  Anh Minh
  Vấn đề: Quạt không quay
  ```
- Đặt vào khay "Chờ kiểm tra kỹ thuật"

**Xong! Chuyển sang sản phẩm tiếp theo.**

#### 💭 Công Việc Của Tôi Dễ Hơn Như Thế Nào?

**Trước đây:**
- ❌ Nhận hàng → Phải tạo phiếu thủ công
- ❌ Không biết khách đã báo trước chưa
- ❌ Phải gọi điện cho khách xác nhận
- ❌ Nhiều giấy tờ, dễ thất lạc

**Bây giờ:**
- ✅ Scan mã → Hệ thống hiện sẵn thông tin
- ✅ Chỉ cần xác nhận, upload ảnh
- ✅ SMS tự động gửi cho khách
- ✅ Mọi thứ trong hệ thống, không lo mất

**Thời gian:** 5 phút/sản phẩm (trước đây: 15 phút)

---

### 3️⃣ Technician - Anh Tùng

#### 🔧 Công Việc Của Tôi

**10h sáng - Nhận phiếu từ bộ phận tiếp nhận**

*"Hôm nay có 8 sản phẩm cần kiểm tra. Ưu tiên theo độ khẩn."*

**Dashboard của tôi:**
```
📋 CÔNG VIỆC HÔM NAY (23/10)

CẦN XỬ LÝ GẤP:
🔴 SV-2025-148 - SSD 1TB (quá hạn dự kiến!)
🟡 SV-2025-150 - RTX 4080 (dự kiến hôm nay)
🟡 SV-2025-151 - RAM 32GB (dự kiến hôm nay)

ĐANG CHỜ:
⚪ SV-2025-152 - Mini PC (dự kiến ngày mai)
⚪ SV-2025-153 - RTX 4070 (dự kiến ngày mai)
```

Tôi chọn SV-2025-150 (RTX 4080) để làm.

**Bước 1: Kiểm tra sơ bộ**

Tôi mở phiếu SV-2025-150 trong hệ thống:
```
📱 SV-2025-150
Sản phẩm: ZOTAC RTX 4080 Trinity OC
Serial: ZT-D40800D-10P-12345
Vấn đề: Quạt không quay, nhiệt độ cao

TASK HIỆN TẠI: Kiểm tra sơ bộ
Thời gian dự kiến: 0.5 giờ
```

Tôi click "Bắt đầu task" → Hệ thống bật timer.

Kiểm tra:
- [ ] Seal: OK ✓
- [ ] Bên ngoài: Không trầy xước ✓
- [ ] Cắm test nhanh: Quạt giữa không quay ✗

Ghi vào hệ thống:
```
Kết quả kiểm tra sơ bộ:
- Seal nguyên vẹn
- Quạt số 2 không hoạt động
- Cần chẩn đoán chuyên sâu

Ảnh: [Upload 3 ảnh]
```

Click "Hoàn tất task" → Tự động chuyển task tiếp theo.

**Bước 2: Chẩn đoán chuyên sâu**

*"Giờ tôi cần test kỹ để biết chính xác vấn đề."*

```
TASK HIỆN TẠI: Chẩn đoán chuyên sâu
Thời gian dự kiến: 1 giờ
```

Tôi click "Bắt đầu task", chạy Furmark:
- Stress test GPU 30 phút
- Ghi lại số liệu:
  ```
  Fan 1: 1880 RPM
  Fan 2: 0 RPM (không quay!)
  Fan 3: 1890 RPM
  Max temp: 92°C
  Clock: Stable
  VRAM: OK
  ```

Nhập vào hệ thống (form có sẵn):
```
Test tool: Furmark
Thời gian test: 30 phút
Kết quả:
  ☑ Fan 1: 1880 RPM (OK)
  ☒ Fan 2: 0 RPM (LỖI)
  ☑ Fan 3: 1890 RPM (OK)
  ☑ Clock: Stable
  ☑ VRAM: OK

Kết luận:
  Vấn đề: Quạt số 2 bị kẹt
  Có thể sửa: CÓ
  Phương án: Thay quạt tản nhiệt
  Chi phí dự kiến: 0đ (bảo hành)
  Thời gian sửa: 2 giờ
```

→ Hệ thống tự động update ticket:
- is_repairable = TRUE
- estimated_repair_time = 2 giờ

**Bước 3: Kiểm tra bảo hành**

```
TASK HIỆN TẠI: Kiểm tra điều kiện bảo hành
```

Hệ thống đã tự động check serial, tôi chỉ cần confirm:
```
✅ Serial hợp lệ: ZT-D40800D-10P-12345
✅ Ngày mua: 15/03/2024
✅ Bảo hành đến: 15/03/2026 (còn 6 tháng)
✅ Seal: Nguyên vẹn
✅ Không có dấu hiệu va đập/nước

KẾT LUẬN: ĐỦ ĐIỀU KIỆN BẢO HÀNH
```

Click "Xác nhận" → Chuyển task cho Quản lý phê duyệt.

**Tôi chuyển sang sản phẩm khác trong lúc chờ.**

---

**Chiều - Sau khi Manager duyệt**

Notification:
```
🔔 SV-2025-150 - RTX 4080
    Đã được phê duyệt: Sửa bảo hành miễn phí
    Task tiếp theo: Sửa chữa
    Assigned to: Bạn
```

**Bước 4: Sửa chữa**

```
TASK HIỆN TẠI: Sửa chữa
Thời gian dự kiến: 2 giờ
Phương án: Thay quạt tản nhiệt
```

Click "Bắt đầu task".

Tôi làm:
- Tháo card
- Tháo quạt cũ
- Lắp quạt mới (lấy từ kho)
- Thay keo tản nhiệt
- Lắp lại

Ghi vào hệ thống:
```
Đã thực hiện:
  ☑ Tháo quạt cũ
  ☑ Lắp quạt mới: Model FAN-4080-V2
  ☑ Thay thermal paste: Arctic MX-5
  ☑ Lắp ráp hoàn chỉnh

Linh kiện sử dụng:
  - Quạt: FAN-4080-V2 (từ kho)
  - Keo tản: Arctic MX-5

Thời gian thực tế: 1.8 giờ
```

**Bước 5: Testing**

```
TASK HIỆN TẠI: Kiểm tra chất lượng
Thời gian dự kiến: 1 giờ
```

Chạy lại Furmark 30 phút:
```
Test tool: Furmark
Thời gian: 30 phút
Kết quả:
  ☑ Fan 1: 1850 RPM (OK)
  ☑ Fan 2: 1870 RPM (ĐÃ OK!)
  ☑ Fan 3: 1880 RPM (OK)
  ☑ Temp: 68°C (Bình thường)
  ☑ Clock: Stable
  ☑ VRAM: OK

KẾT LUẬN: PASS - Chất lượng tốt
```

Upload video test (optional) để khách yên tâm.

Click "Hoàn tất task" → Chuyển bộ phận thông báo khách.

**Xong! Tôi chuyển sang sản phẩm tiếp theo.**

#### 💭 Cảm Nghĩ Về Hệ Thống

**Điều tôi thích:**
- ✅ Dashboard rõ ràng, biết cần làm gì
- ✅ Form nhập liệu có sẵn, không phải viết tay
- ✅ Tự động tính ETA, tôi không phải lo
- ✅ Upload ảnh/video dễ dàng
- ✅ Timer tự động đếm giờ làm việc

**Trước đây:**
- ❌ Phải ghi giấy, dễ mất
- ❌ Không biết sản phẩm nào ưu tiên
- ❌ Phải tự tính thời gian dự kiến
- ❌ Ảnh test phải lưu đâu đó, dễ quên

**Giờ:** Tập trung vào kỹ thuật, hệ thống lo phần còn lại! 👍

---

### 4️⃣ Manager - Anh Hùng

#### 👔 Công Việc Của Tôi

**9h sáng - Kiểm tra dashboard tổng quan**

*"Tôi cần nắm toàn bộ tình hình trung tâm."*

**Dashboard của tôi:**
```
📊 TỔNG QUAN (23/10/2025)

PHIẾU ĐANG XỬ LÝ: 23
├─ Đang kiểm tra: 8
├─ Chờ phê duyệt: 3 🔔 (CẦN XỬ LÝ)
├─ Đang sửa: 7
└─ Đang test: 5

HIỆU SUẤT:
├─ Đúng hạn: 18/20 (90%)
├─ Trễ hạn: 2 🔴 (cần can thiệp)
└─ Thời gian trung bình: 2.3 ngày

NHÂN SỰ:
├─ Kỹ thuật viên: 4/5 (Tùng, Nam, Hòa, Linh)
├─ Tiếp nhận: 2/2 (Lan, Mai)
└─ Nghỉ: Minh (sick leave)

CẦN CHÚ Ý:
🔴 SV-2025-148 - Trễ hạn 1 ngày (khách VIP!)
🟡 3 phiếu cần phê duyệt bảo hành
```

**Nhiệm vụ ưu tiên của tôi:**
1. Xử lý phiếu trễ hạn
2. Phê duyệt 3 phiếu chờ
3. Review hiệu suất team

---

**10h - Phê duyệt bảo hành**

*"3 phiếu cần tôi phê duyệt."*

**Phiếu 1: SV-2025-150 - RTX 4080**

Tôi click vào phiếu, xem đầy đủ thông tin:
```
📋 SV-2025-150
Khách hàng: Anh Minh (0901234567)
   Lịch sử: 2 lần BH trước (2023, 2024)
   Rating: ⭐⭐⭐⭐⭐ (khách tốt)

Sản phẩm: ZOTAC RTX 4080 Trinity OC
   Serial: ZT-D40800D-10P-12345
   Ngày mua: 15/03/2024
   Bảo hành đến: 15/03/2026 (còn 6 tháng)

Chẩn đoán:
   Vấn đề: Quạt số 2 không hoạt động
   Nguyên nhân: Quạt bị kẹt
   Có thể sửa: CÓ
   Phương án: Thay quạt tản nhiệt

Kiểm tra BH:
   ✅ Serial hợp lệ
   ✅ Còn hạn BH
   ✅ Seal nguyên vẹn
   ✅ Không va đập/nước

Chi phí:
   Linh kiện: 0đ (BH)
   Nhân công: 0đ (BH)
   Tổng: 0đ

Thời gian: 2 giờ

Kỹ thuật viên: Anh Tùng
```

Tôi xem ảnh, video test → Mọi thứ rõ ràng.

**Quyết định:**
```
☑ Phê duyệt: Sửa bảo hành miễn phí
Ghi chú: OK, khách quen, đủ điều kiện BH
```

Click "Phê duyệt" → Tự động:
- Gửi email thông báo cho khách
- Chuyển task "Sửa chữa" cho Anh Tùng
- Cập nhật tracking

**Phiếu 2: SV-2025-149 - SSD 1TB (phức tạp hơn)**

```
📋 SV-2025-149
Khách hàng: Chị Hoa (0909123456)
   Lịch sử: Lần đầu

Sản phẩm: SSTC NVMe 1TB
   Serial: SSTC-1TB-67890
   Ngày mua: 10/08/2024
   Bảo hành đến: 10/08/2027 (còn BH)

Chẩn đoán:
   Vấn đề: Không detect
   Nguyên nhân: Controller lỗi
   Có thể sửa: KHÔNG (phần cứng lõi)
   Phương án: Đổi sản phẩm mới

Kiểm tra BH:
   ✅ Serial hợp lệ
   ✅ Còn hạn BH
   ⚠️ Seal bị rách 1 chút (nhưng chưa mở)
   ✅ Không va đập
```

*"Seal rách... cần xem kỹ."*

Tôi xem ảnh seal: Rách nhỏ ở góc, nhưng rõ ràng chưa ai mở.

**Quyết định:**
```
☑ Phê duyệt: Đổi sản phẩm mới (bảo hành)
Ghi chú: Seal rách nhỏ do vận chuyển, chấp nhận BH.
         Yêu cầu kho xuất SSD mới.
```

---

**11h - Xử lý phiếu trễ hạn**

```
🔴 SV-2025-148 - SSD 512GB
   Khách: Anh Bình (khách VIP - doanh nghiệp)
   Dự kiến: 22/10
   Hiện tại: 23/10 (trễ 1 ngày!)
   Tình trạng: Đang chờ linh kiện từ kho
```

*"Khách VIP, phải xử lý ngay!"*

Tôi gọi kho:
- "SSD 512GB có trong kho không?"
- Kho: "Có, nhưng chưa được yêu cầu xuất."
- Tôi: "Priority cao, xuất ngay cho phiếu SV-2025-148."

Gọi khách:
```
"Xin lỗi anh Bình, sản phẩm bị delay 1 ngày do chờ linh kiện.
 Chúng tôi đã ưu tiên, dự kiến hoàn tất trong hôm nay.
 Chúng tôi sẽ ship express miễn phí để bù delay."
```

Khách: "OK, cảm ơn anh đã báo trước."

Ghi note vào hệ thống:
```
Ghi chú: Delay 1 ngày do kho.
Đền bù: Ship express miễn phí.
Cập nhật ETA: 23/10 17:00
```

---

**14h - Review hiệu suất team**

```
📈 HIỆU SUẤT TUẦN (16-22/10)

KỸ THUẬT VIÊN:
┌────────┬─────────┬──────────┬────────┐
│ Tên    │ Phiếu   │ Đúng hạn │ Rating │
├────────┼─────────┼──────────┼────────┤
│ Tùng   │ 18      │ 17/18    │ 4.8⭐  │
│ Nam    │ 15      │ 15/15    │ 4.9⭐  │
│ Hòa    │ 12      │ 11/12    │ 4.5⭐  │
│ Linh   │ 10      │ 9/10     │ 4.7⭐  │
└────────┴─────────┴──────────┴────────┘

KHÁCH HÀNG:
├─ Hài lòng: 92%
├─ Phàn nàn: 2 (đã xử lý)
└─ Review 5 sao: 45/55

VẤN ĐỀ:
🔴 Hòa trễ hạn 1 phiếu (do linh kiện)
   → Đã nhắc nhở, cải thiện quy trình kho
```

Tôi note meeting với Hòa:
- "Khi thiếu linh kiện, báo ngay. Đừng để phiếu delay."

---

**16h - Phê duyệt Goodwill (case đặc biệt)**

```
📋 SV-2025-153 - RTX 4070
Khách: Anh Đức (0908111222)
   Lịch sử: 5 lần BH trước (khách quen lâu năm)

Bảo hành:
   ❌ Hết hạn: 15/09/2025 (hết 1 tháng)

Chẩn đoán:
   Vấn đề: VRAM lỗi
   Có thể sửa: KHÔNG
   Phương án: Đổi sản phẩm
   Chi phí thị trường: 8,500,000đ

KỸ THUẬT VIÊN ĐỀ XUẤT:
   "Khách quen lâu năm, sản phẩm hết BH 1 tháng.
    Đề xuất Goodwill: Đổi sản phẩm miễn phí."
```

*"Anh Đức là khách VIP, 5 lần BH trước. Hết BH 1 tháng... OK."*

**Quyết định:**
```
☑ Phê duyệt: Goodwill - Đổi sản phẩm miễn phí
Lý do: Khách VIP, lịch sử tốt, hết BH gần đây
Chi phí: 0đ (công ty chịu)
```

Email gửi khách:
```
Kính gửi Anh Đức,

Chúng tôi đã kiểm tra RTX 4070 của anh.

Tuy sản phẩm đã hết bảo hành 1 tháng, nhưng vì anh là
khách hàng thân thiết lâu năm, chúng tôi quyết định:

🎁 ĐỔI SẢN PHẨM MỚI MIỄN PHÍ (Goodwill)

Chi phí: 0đ

Cảm ơn anh đã tin tưởng ZOTAC & SSTC!

Trân trọng,
TTBH ZOTAC & SSTC
```

---

#### 💭 Công Việc Quản Lý Của Tôi

**Dashboard giúp tôi:**
- ✅ Nhìn toàn cảnh 1 chỗ
- ✅ Phát hiện vấn đề sớm (phiếu trễ, khách VIP)
- ✅ Phê duyệt nhanh với đầy đủ thông tin
- ✅ Theo dõi hiệu suất team
- ✅ Đưa quyết định Goodwill hợp lý

**Trước đây:**
- ❌ Phải hỏi từng người để biết tình hình
- ❌ Phê duyệt chậm do thiếu thông tin
- ❌ Không biết phiếu nào trễ hạn
- ❌ Khó đánh giá hiệu suất team

**Giờ:** Quản lý chủ động, quyết định nhanh! 💼

---

## 🎯 Other Scenarios

### Kịch Bản 2: Khách Walk-In (Không Gửi Từ Xa)

**Chị Hương ở TP.HCM mang SSD đến trực tiếp**

**9h sáng - Chị Hương đến trung tâm**

Nhân viên tiếp nhận (Chị Mai):
- "Chào chị, chị cần gì ạ?"
- Chị Hương: "Em kiểm tra SSD giúp chị, không nhận dạng."

Chị Mai:
- Tạo phiếu ngay trong hệ thống
- Nhập thông tin khách (tên, SĐT)
- Scan serial SSD: SSTC-512GB-12345
- Chụp ảnh sản phẩm
- In giấy nhận hàng cho khách:
  ```
  📋 PHIẾU TIẾP NHẬN
  Mã phiếu: SR-2025-010
  Sản phẩm: SV-2025-160

  🔍 Tra cứu: service.center/track
      Mã: SR-2025-010
      SĐT: 0907654321

  Dự kiến: 24/10/2025

  Xin cảm ơn!
  ```

**Chị Hương về, theo dõi online như khách từ xa.**

**Khác biệt:** Không có bước chờ shipment, kiểm tra ngay!

---

### Kịch Bản 3: Hết Bảo Hành → Khách Chấp Nhận Trả Phí

**Anh Nam - GPU hết BH 3 tháng**

**Sau chẩn đoán:**
```
Vấn đề: Quạt hỏng
Bảo hành: Hết 3 tháng
Có thể sửa: CÓ
Chi phí: 800,000đ
```

Email gửi khách:
```
Kính gửi Anh Nam,

Sản phẩm của anh đã hết bảo hành 3 tháng.

💰 BÁO GIÁ SỬA CHỮA:
- Thay quạt tản nhiệt: 500,000đ
- Công sửa chữa: 300,000đ
- Tổng cộng: 800,000đ

Anh có muốn sửa không?
Reply email hoặc gọi: 1900-xxxx

Nếu không sửa, chúng tôi sẽ gửi trả sản phẩm
miễn phí (chưa sửa).

Trân trọng.
```

**Anh Nam reply: "OK, sửa đi."**

→ Hệ thống:
- Cập nhật: service_decision = 'paid_repair'
- Unlock task "Sửa chữa"
- Thêm task "Thu phí" sau khi xong

**Sau khi sửa xong:**
```
Task: Thu phí 800,000đ
Phương thức: Chuyển khoản / COD khi ship
```

Khách thanh toán → Hoàn tất!

---

### Kịch Bản 4: Nhiều Sản Phẩm Cùng Lúc

**Anh Tuấn gửi 3 sản phẩm:**
- 1 GPU RTX 4080
- 2 RAM 16GB

**1 Phiếu yêu cầu → 3 Phiếu sản phẩm:**
```
SR-2025-020
  ├─ SV-2025-170 (GPU)
  ├─ SV-2025-171 (RAM #1)
  └─ SV-2025-172 (RAM #2)
```
Mỗi sản phẩm được xử lý riêng, nhưng khách hàng có thể theo dõi tất cả dưới cùng một mã yêu cầu.

---
---

# Part 2: UX/UI Design Standard

*This section defines the standard visual and interactive patterns for all data-driven pages to ensure a consistent and high-quality user experience.*

## Overview

This document defines the standard UX/UI patterns for all data listing pages in the Service Center application. All new pages MUST follow these standards to ensure consistency across the application.

**Standard Reference Pages:**
- `/parts` (Linh kiện) - `src/components/parts-table.tsx`
- `/products` (Sản phẩm) - `src/components/product-table.tsx`

**Key Principle:** Same UX/UI structure, different functionality only.

---

## Page Structure

### Page Layout Hierarchy

```tsx
<>
  <PageHeader title="[Page Title]" />
  <div className="flex flex-1 flex-col">
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <[TableComponent] data={data} />
      </div>
    </div>
  </div>
</>
```

### Wrapper Classes (MANDATORY)

```tsx
// Outer container
className="flex flex-1 flex-col"

// Container query wrapper (for responsive tabs/selects)
className="@container/main flex flex-1 flex-col gap-2"

// Content wrapper with responsive padding
className="flex flex-col gap-4 py-4 md:gap-6 md:py-6"
```

**Gap Standards:**
- Mobile: `gap-4`, `py-4`
- Desktop (md+): `gap-6`, `py-6`

---

## Layout Components

### 1. Tabs System

All table pages MUST use `Tabs` component with mobile/desktop variants:

```tsx
<Tabs defaultValue="[default-tab]" className="w-full flex-col justify-start gap-6">
  {/* Row 1: View Selector / Tabs + Action Buttons */}
  <div className="flex items-center justify-between px-4 lg:px-6">
    {/* Mobile: Select Dropdown */}
    <Select defaultValue="[default-tab]">
      <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm">
        <SelectValue placeholder="[Placeholder]" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tab1">Tab 1 Name</SelectItem>
        <SelectItem value="tab2">Tab 2 Name</SelectItem>
      </SelectContent>
    </Select>

    {/* Desktop: Tab List */}
    <TabsList className="hidden @4xl/main:flex">
      <TabsTrigger value="tab1">Tab 1 Name</TabsTrigger>
      <TabsTrigger value="tab2">Tab 2 Name</TabsTrigger>
    </TabsList>

    {/* Action Buttons */}
    <div className="flex items-center gap-2">
      {/* Buttons here */}
    </div>
  </div>

  {/* Tab Contents */}
  <TabsContent value="tab1" className="relative flex flex-col gap-4 px-4 lg:px-6">
    {/* Content */}
  </TabsContent>
</Tabs>
```

**Breakpoint:** `@4xl/main` (container query)

### 2. Action Buttons Row

Located in the tabs header, right-aligned:

```tsx
<div className="flex items-center gap-2">
  {/* Optional: Column Visibility Dropdown */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <IconLayoutColumns />
        <span className="hidden lg:inline">Tùy chỉnh cột</span>
        <span className="lg:hidden">Cột</span>
        <IconChevronDown />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      {/* Column checkboxes */}
    </DropdownMenuContent>
  </DropdownMenu>

  {/* Primary Action: Create/Add */}
  <Button variant="outline" size="sm">
    <IconPlus />
    <span className="hidden lg:inline">[Full Action Text]</span>
  </Button>

  {/* Optional: Sample Data Button */}
  <AddSampleDataButton />
</div>
```

**Button Standards:**
- Size: `sm`
- Variant: `outline`
- Icons: Always include icon
- Text: Hidden on mobile (`hidden lg:inline`), shown on desktop

---

## Table Components

### Table Structure

```tsx
<div className="overflow-hidden rounded-lg border">
  <Table>
    <TableHeader className="bg-muted sticky top-0 z-10">
      {/* Headers */}
    </TableHeader>
    <TableBody>
      {/* Rows */}
    </TableBody>
  </Table>
</div>
```

**Header Standards:**
- Background: `bg-muted`
- Position: `sticky top-0 z-10`
- Container: `overflow-hidden rounded-lg border`

### Column Definitions

#### Required Columns (if applicable)

1. **Select Column** (for bulk operations)
```tsx
{
  id: "select",
  header: ({ table }) => (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Chọn tất cả"
      />
    </div>
  ),
  cell: ({ row }) => (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Chọn hàng"
      />
    </div>
  ),
  enableSorting: false,
  enableHiding: false,
}
```

2. **Name/Primary Column** (clickable to edit)
```tsx
{
  accessorKey: "name",
  header: "[Column Title]",
  cell: ({ row }) => (
    <Button
      variant="ghost"
      className="h-auto p-2 font-medium hover:bg-accent"
      onClick={() => onEdit(row.original.id)}
    >
      {row.original.name}
    </Button>
  ),
  enableHiding: false,
}
```

**IMPORTANT:** Primary column MUST be clickable button to open edit modal.

3. **Actions Column**
```tsx
{
  id: "actions",
  header: () => <div className="text-right">Hành động</div>,
  cell: ({ row }) => (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            Hành động
            <IconChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
            <IconEdit className="mr-2 h-4 w-4" />
            Sửa
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(row.original.id)}
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
}
```

### Search/Filter Bar

Located above table:

```tsx
<div className="flex items-center gap-2">
  <Input
    placeholder="[Search placeholder in Vietnamese]..."
    value={searchValue}
    onChange={(e) => setSearchValue(e.target.value)}
    className="max-w-sm"
  />
  {/* Additional filters if needed */}
</div>
```

**Max Width:** `max-w-sm` (320px)

### Empty State

```tsx
<TableRow>
  <TableCell colSpan={columns.length} className="h-24 text-center">
    Không tìm thấy [entity name] nào.
  </TableCell>
</TableRow>
```

---

## Pagination System

### MANDATORY Pagination Components

ALL table pages MUST include full pagination with these components:

```tsx
<div className="flex items-center justify-between px-4">
  {/* Left: Selection Count */}
  <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
    Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong{" "}
    {table.getFilteredRowModel().rows.length} [entity name]
  </div>

  {/* Right: Pagination Controls */}
  <div className="flex w-full items-center gap-8 lg:w-fit">
    {/* Page Size Selector */}
    <div className="hidden items-center gap-2 lg:flex">
      <Label htmlFor="rows-per-page" className="text-sm font-medium">
        Số dòng mỗi trang
      </Label>
      <Select
        value={`${table.getState().pagination.pageSize}`}
        onValueChange={(value) => table.setPageSize(Number(value))}
      >
        <SelectTrigger size="sm" className="w-20" id="rows-per-page">
          <SelectValue placeholder={table.getState().pagination.pageSize} />
        </SelectTrigger>
        <SelectContent side="top">
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <SelectItem key={pageSize} value={`${pageSize}`}>
              {pageSize}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Page Info */}
    <div className="flex w-fit items-center justify-center text-sm font-medium">
      Trang {table.getState().pagination.pageIndex + 1} trên{" "}
      {table.getPageCount()}
    </div>

    {/* Navigation Buttons */}
    <div className="ml-auto flex items-center gap-2 lg:ml-0">
      {/* First Page (desktop only) */}
      <Button
        variant="outline"
        className="hidden h-8 w-8 p-0 lg:flex"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        <span className="sr-only">Đến trang đầu</span>
        <IconChevronsLeft />
      </Button>

      {/* Previous Page */}
      <Button
        variant="outline"
        className="size-8"
        size="icon"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <span className="sr-only">Trang trước</span>
        <IconChevronLeft />
      </Button>

      {/* Next Page */}
      <Button
        variant="outline"
        className="size-8"
        size="icon"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <span className="sr-only">Trang tiếp</span>
        <IconChevronRight />
      </Button>

      {/* Last Page (desktop only) */}
      <Button
        variant="outline"
        className="hidden size-8 lg:flex"
        size="icon"
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        <span className="sr-only">Đến trang cuối</span>
        <IconChevronsRight />
      </Button>
    </div>
  </div>
</div>
```

### Required Icons

Import from `@tabler/icons-react`:
```tsx
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
```

### Pagination State

```tsx
const [pagination, setPagination] = React.useState({
  pageIndex: 0,
  pageSize: 10,
});

const table = useReactTable({
  // ...
  state: {
    pagination,
    // ... other states
  },
  onPaginationChange: setPagination,
  getPaginationRowModel: getPaginationRowModel(),
});
```

### Page Size Options

MUST support: `[10, 20, 30, 40, 50]`

---

## Interactive Elements

### Row Selection

Required for bulk operations:

```tsx
const [rowSelection, setRowSelection] = React.useState({});

const table = useReactTable({
  // ...
  state: {
    rowSelection,
    // ...
  },
  getRowId: (row) => row.id,
  enableRowSelection: true,
  onRowSelectionChange: setRowSelection,
});
```

### Column Visibility

```tsx
const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

const table = useReactTable({
  // ...
  state: {
    columnVisibility,
    // ...
  },
  onColumnVisibilityChange: setColumnVisibility,
});
```

### Sorting

```tsx
const [sorting, setSorting] = React.useState<SortingState>([]);

const table = useReactTable({
  // ...
  state: {
    sorting,
    // ...
  },
  onSortingChange: setSorting,
  getSortedRowModel: getSortedRowModel(),
});
```

### Filtering

```tsx
const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
const [searchValue, setSearchValue] = React.useState("");

// For simple search
const filteredData = React.useMemo(() => {
  if (!searchValue) return initialData;

  return initialData.filter((item) => {
    const searchLower = searchValue.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.sku?.toLowerCase().includes(searchLower)
      // Add other searchable fields
    );
  });
}, [initialData, searchValue]);

const table = useReactTable({
  data: filteredData,
  // ...
  state: {
    columnFilters,
    // ...
  },
  onColumnFiltersChange: setColumnFilters,
  getFilteredRowModel: getFilteredRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
});
```

---

## Responsive Design

### Breakpoint Standards

- **Mobile:** Default (< 640px)
- **Tablet:** `md:` (640px+)
- **Desktop:** `lg:` (1024px+)
- **Container Query:** `@4xl/main` (for tabs)

### Mobile Optimizations

1. **Buttons:** Icon only, text hidden
   ```tsx
   <span className="hidden lg:inline">[Button Text]</span>
   ```

2. **Tabs:** Use Select dropdown instead of TabsList
   ```tsx
   className="flex w-fit @4xl/main:hidden"  // Mobile Select
   className="hidden @4xl/main:flex"        // Desktop Tabs
   ```

3. **Pagination:** Hide first/last buttons, hide page size selector
   ```tsx
   className="hidden h-8 w-8 p-0 lg:flex"  // First/Last buttons
   ```

4. **Selection Count:** Hide on mobile
   ```tsx
   className="text-muted-foreground hidden flex-1 text-sm lg:flex"
   ```

### Padding Standards

```tsx
// Horizontal padding
px-4 lg:px-6

// Vertical padding
py-4 md:py-6

// Gap spacing
gap-4 md:gap-6
```

---

## Spacing & Typography

### Container Spacing

```tsx
// Outer wrapper
gap-2                          // Between page sections

// Content wrapper
gap-4 py-4 md:gap-6 md:py-6   // Responsive content spacing

// Tab content
gap-4 px-4 lg:px-6             // Tab inner spacing
```

### Component Gaps

```tsx
// Button groups
gap-2

// Form fields
gap-4

// Pagination controls
gap-2  (buttons)
gap-8  (sections)
```

### Font Sizes

```tsx
// Headers
text-lg font-semibold       // Section headers
text-sm font-medium         // Labels

// Body
text-sm                     // Table cells
text-xs                     // Small badges

// Muted text
text-muted-foreground       // Secondary info
```

---

## Accessibility

### Screen Reader Text

ALL icon-only buttons MUST have screen reader labels:

```tsx
<Button>
  <span className="sr-only">Descriptive action</span>
  <IconName />
</Button>
```

### ARIA Labels

```tsx
// Checkbox
aria-label="Chọn tất cả"
aria-label="Chọn hàng"

// Select
<Label htmlFor="unique-id" className="sr-only">Label Text</Label>
<Select>
  <SelectTrigger id="unique-id">...</SelectTrigger>
</Select>
```

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Use semantic HTML (Button, not div with onClick)
- Maintain logical tab order

---

## Implementation Checklist

When creating a new table/listing page, verify ALL these items:

### ✅ Page Structure
- [ ] PageHeader with Vietnamese title
- [ ] Proper wrapper hierarchy (`flex flex-1 flex-col` → `@container/main` → content)
- [ ] Responsive padding (`py-4 md:py-6`)

### ✅ Tabs System
- [ ] Mobile Select dropdown (hidden on `@4xl/main`)
- [ ] Desktop TabsList (shown on `@4xl/main`)
- [ ] Proper default value
- [ ] Vietnamese labels

### ✅ Action Buttons
- [ ] Icon + text pattern (text hidden on mobile)
- [ ] `size="sm" variant="outline"`
- [ ] Proper gap spacing (`gap-2`)

### ✅ Table Structure
- [ ] Sticky header with `bg-muted sticky top-0 z-10`
- [ ] Rounded border container
- [ ] Empty state message in Vietnamese

### ✅ Columns
- [ ] Select column (if bulk operations needed)
- [ ] Clickable primary column (Button with `onClick`)
- [ ] Actions dropdown (right-aligned)
- [ ] All columns have Vietnamese headers

### ✅ Search/Filter
- [ ] Input with `max-w-sm`
- [ ] Vietnamese placeholder
- [ ] Proper filtering logic

### ✅ Pagination (COMPLETE SYSTEM)
- [ ] Selection count (left, hidden on mobile)
- [ ] Page size selector (10, 20, 30, 40, 50)
- [ ] Page info ("Trang X trên Y")
- [ ] 4 navigation buttons (First, Prev, Next, Last)
- [ ] First/Last hidden on mobile
- [ ] All buttons have screen reader labels
- [ ] Icons from `@tabler/icons-react`
- [ ] `justify-between` layout

### ✅ State Management
- [ ] `rowSelection` (if checkboxes)
- [ ] `columnVisibility` (if column toggle)
- [ ] `sorting`
- [ ] `columnFilters`
- [ ] `pagination` (pageIndex, pageSize)

### ✅ Responsive
- [ ] Container queries for tabs
- [ ] Media queries for buttons, padding
- [ ] Mobile-first approach

### ✅ Accessibility
- [ ] Screen reader labels on all icon buttons
- [ ] ARIA labels on form controls
- [ ] Semantic HTML
- [ ] Keyboard navigation works

### ✅ Vietnamese Localization
- [ ] All UI text in Vietnamese
- [ ] Search placeholders
- [ ] Button labels
- [ ] Empty states
- [ ] Pagination labels

---
---

# Part 3: Frontend Technical Specification

*This section details the "how" - the technical architecture, standards, and patterns that developers must follow.*

## Executive Summary

This document specifies the frontend architecture for the Service Center application, covering:
- **Current State**: Phase 1 implementation (flat structure, basic CRUD)
- **Phase 2 Upgrade**: Organized architecture with 20 new features
- **Migration Path**: Incremental migration from flat to organized structure

### Key Changes in Phase 2
- ✅ Organized directory structure (types/, hooks/, constants/, components/)
- ✅ 20+ new components for workflow, warehouse, and public portal features
- ✅ Interface-based component props
- ✅ Enhanced state management with TanStack Query
- ✅ Public-facing routes (unauthenticated)
- ✅ Real-time updates (polling → optional WebSocket)

---

## Technology Stack

### Core Technologies

```yaml
# Frontend Framework
Next.js: 15.5.4
  - App Router (file-based routing)
  - React Server Components (default)
  - Turbopack (build tool)
  - Port: 3025

# UI Library
React: 19.1.0
  - Server Components by default
  - Client Components with 'use client'
  - Suspense for loading states

# Language
TypeScript: 5.x
  - Strict mode enabled
  - Path aliases (@/ for src/)

# API Layer
tRPC: 11.6.0
  - End-to-end type safety
  - Integrated with React Query

# State Management
TanStack Query: v5
  - Server state management
  - Caching and invalidation
  - Optimistic updates
  - Real-time polling (30s intervals)
  - Optional: WebSocket via Supabase Realtime

# Styling
Tailwind CSS: 4.0
  - Utility-first CSS
  - Custom design tokens
  - Dark mode support (planned)

# Component Library
shadcn/ui: Latest
  - 40+ pre-built components
  - Radix UI primitives
  - Fully customizable
  - Accessible (WCAG 2.1)

# Form Handling
React Hook Form: Latest
  - Performance-optimized
  - Minimal re-renders

# Validation
Zod: Latest
  - Runtime type validation
  - Schema-based validation
  - Integration with React Hook Form

# Code Quality
Biome: 2.2.0
  - Linting
  - Formatting
  - Fast performance
```

### Additional Libraries (Phase 2)

```json
{
  "@dnd-kit/core": "latest",           // Drag-and-drop for task ordering
  "@dnd-kit/sortable": "latest",       // Sortable lists
  "recharts": "latest",                // Charts for dashboards
  "signature_pad": "latest",           // Digital signatures
  "date-fns": "latest"                 // Date manipulation
}
```

---

## Architecture

### Component Architecture Principles

**1. Server Components by Default**
```typescript
// Default: Server Component (no 'use client')
export default async function TicketDetailPage({ params }: Props) {
  const supabase = createClient();
  const ticket = await fetchTicket(params.id);

  return <TicketDetails ticket={ticket} />;
}

// Client Component (when needed)
'use client';

export function TicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ... interactive logic
}
```

**2. Separation of Concerns**
```
├── Server Components
│   ├── Data fetching
│   ├── Layout rendering
│   └── SEO/metadata
│
└── Client Components
    ├── Interactivity (forms, buttons)
    ├── State management
    ├── Real-time updates
    └── Browser APIs
```

**3. Composition Over Inheritance**
```typescript
// ✅ Good: Composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <TaskList tasks={tasks} />
  </CardContent>
</Card>

// ❌ Avoid: Deep inheritance
class TaskCard extends Card extends BaseCard { ... }
```

---

## Directory Structure

### Phase 2 Target Structure (ORGANIZED)

```
src/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Protected routes (existing + new)
│   │   └── dashboard/
│   │       ├── page.tsx          # ✓ Existing
│   │       ├── tickets/          # ✓ Existing
│   │       ├── customers/        # ✓ Existing
│   │       ├── products/         # ✓ Existing
│   │       ├── parts/            # ✓ Existing
│   │       ├── team/             # ✓ Existing
│   │       │
│   │       ├── workflows/        # 🆕 Phase 2
│   │       │   ├── templates/
│   │       │   └── task-types/
│   │       │
│   │       ├── my-tasks/         # 🆕 Phase 2
│   │       │   └── page.tsx
│   │       │
│   │       ├── warehouses/       # 🆕 Phase 2
│   │       │   └── page.tsx
│   │       │
│   │       ├── inventory/        # 🆕 Phase 2
│   │       │   ├── products/
│   │       │   ├── stock-levels/
│   │       │   └── rma/
│   │       │
│   │       ├── service-requests/ # 🆕 Phase 2
│   │       ├── deliveries/       # 🆕 Phase 2
│   │       ├── notifications/    # 🆕 Phase 2
│   │       └── task-progress/    # 🆕 Phase 2
│   │
│   ├── (public)/                 # Public routes
│   │   ├── login/                # ✓ Existing
│   │   ├── setup/                # ✓ Existing
│   │   │
│   │   └── service-request/      # 🆕 Phase 2 (PUBLIC PORTAL)
│   │       ├── page.tsx          # Request submission
│   │       ├── success/          # Confirmation page
│   │       └── track/            # Tracking page (no auth)
│   │
│   └── api/
│       ├── trpc/[...trpc]/       # ✓ Existing
│       └── health/               # 🆕 Health check endpoint
│
├── components/
│   ├── ui/                       # ✓ shadcn/ui (40+ components)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── forms/                    # 🆕 Phase 2 - Business Forms
│   │   ├── task-template-form.tsx
│   │   ├── warehouse-form.tsx
│   │   ├── physical-product-form.tsx
│   │   ├── service-request-wizard.tsx
│   │   ├── delivery-confirmation-form.tsx
│   │   └── rma-batch-form.tsx
│   │
│   ├── tables/                   # 🆕 Phase 2 - Data Tables
│   │   ├── task-template-table.tsx
│   │   ├── physical-warehouse-table.tsx
│   │   ├── virtual-warehouse-table.tsx
│   │   ├── stock-levels-table.tsx
│   │   ├── stock-movement-table.tsx
│   │   ├── service-requests-table.tsx
│   │   ├── task-progress-table.tsx
│   │   ├── rma-batches-table.tsx
│   │   └── delivery-log-table.tsx
│   │
│   ├── modals/                   # 🆕 Phase 2 - Modal Dialogs
│   │   ├── template-editor-modal.tsx
│   │   ├── task-completion-modal.tsx
│   │   ├── warehouse-form-modal.tsx
│   │   ├── product-registration-modal.tsx
│   │   ├── stock-movement-modal.tsx
│   │   ├── bulk-import-modal.tsx
│   │   ├── rma-batch-wizard.tsx
│   │   ├── set-threshold-modal.tsx
│   │   └── reject-request-modal.tsx
│   │
│   └── shared/                   # 🆕 Phase 2 - Shared Components
│       ├── task-status-badge.tsx
│       ├── warehouse-type-badge.tsx
│       ├── stock-status-badge.tsx
│       ├── warranty-status-badge.tsx
│       ├── serial-verification-widget.tsx
│       ├── task-execution-card.tsx
│       ├── task-dependency-indicator.tsx
│       ├── movement-history-timeline.tsx
│       ├── request-status-timeline.tsx
│       ├── low-stock-alerts.tsx
│       ├── product-photo-upload.tsx
│       └── draggable-task-list.tsx
│
├── types/                        # 🆕 Phase 2 - Type Definitions
│   ├── index.ts                  # Re-export all types
│   ├── database.types.ts         # ✓ Existing (Supabase generated)
│   ├── workflow.ts               # Task templates, instances
│   ├── warehouse.ts              # Warehouses, products, movements
│   ├── warranty.ts               # Serial verification, warranty
│   ├── service-request.ts        # Service requests, tracking
│   └── enums.ts                  # All ENUMs (task_status, etc.)
│
├── hooks/                        # 🆕 Phase 2 - Custom Hooks
│   ├── use-workflow.ts           # Task workflow hooks
│   ├── use-warehouse.ts          # Warehouse management hooks
│   ├── use-warranty.ts           # Serial verification hooks
│   ├── use-service-requests.ts   # Service request hooks
│   └── use-debounce.ts           # Utility hooks
│
├── constants/                    # 🆕 Phase 2 - Constants
│   ├── index.ts                  # Re-export all constants
│   ├── workflow.ts               # Task statuses, types
│   ├── warehouse.ts              # Warehouse types, thresholds
│   ├── service-request.ts        # Request statuses, formats
│   └── messages.ts               # UI messages, notifications
│
├── server/
│   ├── routers/
│   │   ├── _app.ts               # ✓ Main router (extended)
│   │   ├── admin.ts              # ✓ Existing
│   │   ├── tickets.ts            # ✓ Existing (extended)
│   │   ├── customers.ts          # ✓ Existing
│   │   ├── products.ts           # ✓ Existing
│   │   ├── parts.ts              # ✓ Existing
│   │   ├── brands.ts             # ✓ Existing
│   │   ├── revenue.ts            # ✓ Existing
│   │   │
│   │   ├── workflow.ts           # 🆕 Task workflow procedures
│   │   ├── warehouse.ts          # 🆕 Warehouse procedures (same file as inventory)
│   │   └── service-request.ts    # 🆕 Service request procedures
│   │       ├── Public procedures (no auth)
│   │       └── Staff procedures (authenticated)
│   │
│   └── trpc.ts                   # ✓ tRPC setup
│
├── utils/
│   ├── supabase/
│   │   ├── client.ts             # ✓ Browser client
│   │   ├── server.ts             # ✓ Server client
│   │   └── admin.ts              # ✓ Admin client
│   ├── trpc.ts                   # ✓ tRPC client
│   ├── warranty.ts               # 🆕 Warranty calculations
│   └── date.ts                   # 🆕 Date utilities
│
└── lib/
    └── utils.ts                  # ✓ Utility functions (cn, etc.)
```

---

## Component Organization

### Component Naming Conventions

```typescript
// ✅ CORRECT: Interface for props, PascalCase names
interface TaskTemplateFormProps {
  templateId?: string;
  onSuccess?: () => void;
}

export function TaskTemplateForm({ templateId, onSuccess }: TaskTemplateFormProps) {
  // Implementation
}

// ✅ File naming: kebab-case
// task-template-form.tsx

// ❌ INCORRECT: Type for props (old standard)
type TaskTemplateFormProps = { ... }  // Don't use for props

// ❌ INCORRECT: camelCase component
export function taskTemplateForm() { ... }
```

### Component Structure Template

```typescript
// src/components/forms/example-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';

// 1. Props Interface
interface ExampleFormProps {
  initialData?: ExampleData;
  onSuccess?: (data: ExampleData) => void;
  onCancel?: () => void;
}

// 2. Validation Schema
const formSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

type FormData = z.infer<typeof formSchema>;

// 3. Component
export function ExampleForm({ initialData, onSuccess, onCancel }: ExampleFormProps) {
  // Hooks
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const mutation = trpc.example.create.useMutation({
    onSuccess: (data) => {
      toast.success('Success!');
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Handlers
  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  // Render
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields */}
      <div>
        <Input {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
```

---

## State Management

### Client State (React)

```typescript
// Component-level state
const [isOpen, setIsOpen] = useState(false);
const [selectedId, setSelectedId] = useState<string | null>(null);

// Form state (React Hook Form)
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {},
});
```

### Server State (TanStack Query + tRPC)

```typescript
// Query (GET)
const { data, isLoading, error } = trpc.tickets.list.useQuery({
  status: 'pending',
  limit: 50,
});

// Mutation (POST/PUT/DELETE)
const mutation = trpc.tickets.create.useMutation({
  onSuccess: () => {
    // Invalidate queries to refetch
    utils.tickets.list.invalidate();
  },
});

// Optimistic updates
const updateMutation = trpc.tickets.updateStatus.useMutation({
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await utils.tickets.list.cancel();

    // Snapshot previous value
    const previous = utils.tickets.list.getData();

    // Optimistically update
    utils.tickets.list.setData(undefined, (old) => {
      // Update logic
    });

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.tickets.list.setData(undefined, context?.previous);
  },
});

// Real-time polling (30 seconds)
const { data } = trpc.workflow.myTasks.useQuery(undefined, {
  refetchInterval: 30000,
  refetchIntervalInBackground: false,
});
```

### Phase 2: Optional WebSocket (Supabase Realtime)

```typescript
// Future enhancement: Real-time subscriptions
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// Subscribe to task updates
supabase
  .channel('task-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'service_ticket_tasks',
  }, (payload) => {
    // Invalidate queries
    utils.workflow.myTasks.invalidate();
  })
  .subscribe();
```

---

## Routing

### Route Groups

```typescript
// (auth) - Protected routes (require authentication)
app/(auth)/
  - Middleware checks authentication
  - Redirects to /login if not authenticated

// (public) - Public routes (no authentication)
app/(public)/
  - Accessible without login
  - Rate limiting applied (Kong)
```

### Page Structure

```typescript
// app/(auth)/dashboard/warehouses/page.tsx
export default async function WarehousesPage() {
  // Server Component - can fetch data
  const supabase = createClient();
  const initialData = await fetchInitialData();

  return (
    <div>
      <h1>Warehouses</h1>
      <WarehouseManagementClient initialData={initialData} />
    </div>
  );
}

// Client component for interactivity
'use client';
function WarehouseManagementClient({ initialData }) {
  // Interactive logic
}
```

### Dynamic Routes

```typescript
// app/(auth)/dashboard/tickets/[id]/page.tsx
interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function TicketDetailPage({ params }: PageProps) {
  const ticket = await fetchTicket(params.id);
  return <TicketDetails ticket={ticket} />;
}
```

### Navigation

```typescript
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Programmatic navigation
const router = useRouter();
router.push('/dashboard/tickets');
router.back();

// Link component
<Link href="/dashboard/tickets/123">View Ticket</Link>

// With search params
<Link href={{ pathname: '/tickets', query: { status: 'pending' } }}>
  Pending Tickets
</Link>
```

---

## Data Fetching

### Server Components (Recommended)

```typescript
// Direct database queries in Server Components
import { createClient } from '@/utils/supabase/server';

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: ticket } = await supabase
    .from('service_tickets')
    .select('*, customer:customers(*), product:products(*)')
    .eq('id', params.id)
    .single();

  return <TicketDetails ticket={ticket} />;
}
```

### Client Components (tRPC)

```typescript
'use client';

import { trpc } from '@/utils/trpc';

export function TicketList() {
  const { data, isLoading, error } = trpc.tickets.list.useQuery({
    status: 'pending',
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

---

## Forms & Validation

(This section is covered in detail in the Component Structure Template and UX/UI Standard)
