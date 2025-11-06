# Hướng Dẫn Cấu Hình Workflow Kiểm Định Sản Phẩm

> Lưu ý hợp nhất: Tài liệu này hiện là nguồn tham chiếu duy nhất (canonical) cho quy trình kiểm định Service Request. Các tài liệu cũ đã được chuyển hướng về đây để tránh trùng lặp (Architecture + Implementation Requirements).


**Dành cho:** Admin, Manager
**Mục đích:** Thiết lập quy trình kiểm định sản phẩm trước khi tự động tạo Service Tickets
**Thời gian thực hiện:** ~45 phút
**Cập nhật:** 2025-11-06

---

## 📋 Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Điều Kiện Tiên Quyết](#2-điều-kiện-tiên-quyết)
3. [Bước 1: Tạo Thư Viện Công Việc](#3-bước-1-tạo-thư-viện-công-việc)
4. [Bước 2: Tạo Quy Trình Kiểm Định](#4-bước-2-tạo-quy-trình-kiểm-định)
5. [Bước 3: Kết Nối Quy Trình Với Service Request](#5-bước-3-kết-nối-quy-trình-với-service-request)
6. [Bước 4: Kiểm Tra Hoạt Động](#6-bước-4-kiểm-tra-hoạt-động)
7. [Xử Lý Lỗi Thường Gặp](#7-xử-lý-lỗi-thường-gặp)

---

## 1. Tổng Quan

### Quy Trình Hoạt Động

```
┌────────────────────────────────────────────────────────┐
│ 1. TIẾP NHẬN (Reception)                               │
│    - Tạo Service Request                               │
│    - Nhập serial → Tự động hiển thị warranty status    │
│    - ☑️ "Đã nhận sản phẩm từ khách hàng"              │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│ 2. KIỂM ĐỊNH (Reception/Manager)                       │
│    → Workflow tự động tạo 3 tasks:                     │
│       Task 1: Kiểm tra điều kiện BH (10 phút)         │
│       Task 2: Chụp ảnh sản phẩm (10 phút)             │
│       Task 3: Xác định loại dịch vụ (15 phút)         │
│                                                         │
│    → Thông tin thu thập:                               │
│       - Ghi chú kiểm tra (ĐẠT/KHÔNG ĐẠT)              │
│       - Ảnh sản phẩm (tối thiểu 5 ảnh)                │
│       - Loại dịch vụ (WARRANTY/PAID)                   │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│ 3. TỰ ĐỘNG TẠO TICKETS (Hệ thống)                     │
│    → Khi hoàn tất SR workflow:                         │
│       - Tự động tạo 1 ticket cho mỗi sản phẩm         │
│       - Copy inspection notes từ Task 1                │
│       - Copy ảnh từ Task 2                             │
│       - Copy service type từ Task 3                    │
│       - Link ticket → service_request_items            │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│ 4. XỬ LÝ SỬA CHỮA (Technician)                        │
│    → Ticket workflow (riêng biệt):                     │
│       - Chẩn đoán kỹ thuật chi tiết                   │
│       - Sửa chữa/Thay linh kiện                       │
│       - Test sau sửa                                   │
│       - Chụp ảnh sau sửa (THÊM vào ảnh có sẵn)       │
│       - Hoàn tất                                       │
└────────────────────────────────────────────────────────┘
```

### Lợi Ích

✅ **Thu thập thông tin đầy đủ** trước khi tạo ticket
✅ **Tự động tạo tickets** - Không cần nhập form lại
✅ **Xử lý nhiều sản phẩm** - 1 ticket per product
✅ **Kế thừa thông tin** - Ảnh + notes từ SR → Tickets
✅ **Bằng chứng pháp lý** - Ảnh + ghi chú đầy đủ

---

## 2. Điều Kiện Tiên Quyết

### Kiểm Tra Quyền Hạn

Bạn cần có quyền **Admin** hoặc **Manager** để thực hiện cấu hình.

**Cách kiểm tra:**
1. Đăng nhập hệ thống
2. Vào menu bên trái, tìm mục **"Quy trình"**
3. Nếu THẤY menu này → Bạn có quyền ✅
4. Nếu KHÔNG THẤY → Liên hệ Admin để cấp quyền ❌

### Kiểm Tra Database

Đảm bảo database đã có các bảng cần thiết:

```sql
-- Chạy query này để kiểm tra
SELECT
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'workflows') as has_workflows,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') as has_tasks,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'entity_tasks') as has_entity_tasks,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'service_requests') as has_service_requests;
```

**Kết quả mong đợi:**
```
has_workflows | has_tasks | has_entity_tasks | has_service_requests
     true     |    true   |       true       |         true
```

Nếu có bất kỳ cột nào = `false` → Liên hệ Dev Team để chạy migrations.

---

## 3. Bước 1: Tạo Thư Viện Công Việc

### 3.1. Truy Cập Trang Quản Lý Công Việc

1. Đăng nhập với tài khoản Admin/Manager
2. Menu bên trái → **"Công việc"** (trong mục Quy trình)
3. URL: `/workflows/tasks`

### 3.2. Tạo Task 1: Kiểm Tra Điều Kiện Bảo Hành

Click **"+ Tạo công việc"** và điền thông tin:

| Trường | Giá trị |
|--------|---------|
| **Tên công việc** | `Kiểm tra điều kiện bảo hành vật lý` |
| **Danh mục** | `Kiểm tra bảo hành` |
| **Thời gian ước tính** | `10` (phút) |
| **Yêu cầu ghi chú** | ☑️ **BẮT BUỘC** |
| **Yêu cầu ảnh** | ☐ Không (ảnh sẽ chụp ở Task 2) |

**Mô tả:** (Copy toàn bộ text này)

```
KIỂM TRA ĐIỀU KIỆN BẢO HÀNH (Checklist):

### 1. TEM BẢO HÀNH
- [ ] Tem còn nguyên, dán chắc chắn
- [ ] Tem không rách, mờ, hoặc bị tẩy xóa
- [ ] Serial trên tem khớp với serial trên sản phẩm
- [ ] Tem SSTC/ZOTAC còn nguyên vẹn

### 2. DẤU HIỆU NƯỚC/ẨM ƯỚT
- [ ] Không có vết nước/ẩm ướt
- [ ] Không có dấu hiệu oxi hóa (màu xanh, rỉ sét)
- [ ] Không có mùi cháy hoặc khét

### 3. BIẾN DẠNG/VA ĐẬP
- [ ] Không bị cong vênh, móp méo
- [ ] Không có vết nứt trên PCB/vỏ
- [ ] Các linh kiện không bị bật ra

### 4. TỰ Ý SỬA CHỮA
- [ ] Không có dấu hiệu tháo lắp trước đó
- [ ] Vít còn nguyên (không bị xước)
- [ ] Keo tản nhiệt nguyên bản (chưa thay)

## KẾT QUẢ

### ✅ ĐẠT điều kiện bảo hành
→ Completion notes: "ĐẠT - Tem nguyên, không nước, không biến dạng"

### ❌ KHÔNG ĐẠT điều kiện bảo hành
→ Completion notes: "KHÔNG ĐẠT - [Ghi rõ lý do: tem rách/nước/cháy/tự sửa]"
→ PHẢI chụp ảnh bằng chứng (sẽ chụp ở Task 2)
→ Báo khách lý do từ chối BH
→ Hỏi khách: "Anh/chị có muốn sửa trả phí không?"

## LƯU Ý

- Nếu khách PHẢN ĐỐI → GỌI MANAGER
- Nếu WARRANTY STATUS từ form = "Hết hạn" → Tự động = Paid Service
- Nếu WARRANTY STATUS = "Còn BH" + ĐẠT → Warranty Service
- Nếu WARRANTY STATUS = "Còn BH" + KHÔNG ĐẠT → Paid Service
```

Click **"Tạo mới"**

---

### 3.3. Tạo Task 2: Chụp Ảnh Sản Phẩm

Click **"+ Tạo công việc"** và điền thông tin:

| Trường | Giá trị |
|--------|---------|
| **Tên công việc** | `Chụp ảnh sản phẩm trước sửa chữa` |
| **Danh mục** | `Kiểm tra chất lượng` |
| **Thời gian ước tính** | `10` (phút) |
| **Yêu cầu ghi chú** | ☐ Không |
| **Yêu cầu ảnh** | ☑️ **BẮT BUỘC** |

**Mô tả:** (Copy toàn bộ text này)

```
Chụp ảnh sản phẩm để lưu trữ và làm bằng chứng.

## BẮT BUỘC CHỤP (Tối thiểu 5 ảnh)

### 1. SERIAL NUMBER (1 ảnh)
- Chụp rõ serial trên sản phẩm
- Đảm bảo đủ ánh sáng, không mờ

### 2. TEM BẢO HÀNH (1-2 ảnh)
- Chụp rõ tem SSTC/ZOTAC
- Nếu tem rách/mờ → Chụp cận cảnh

### 3. TOÀN CẢNH SẢN PHẨM (2 ảnh)
- Góc trên: Nhìn từ trên xuống
- Góc cạnh: Nhìn từ bên hông

### 4. VỊ TRÍ HƯ HỎNG (Nếu thấy - 1-3 ảnh)
- Chụp vị trí lỗi (nếu nhìn thấy được)
- VD: Vết cháy, nứt, biến dạng

### 5. BẰNG CHỨNG (Nếu Task 1 = KHÔNG ĐẠT)
- Chụp cận cảnh tem rách/mờ
- Chụp vết nước/oxi hóa
- Chụp vết cháy/nổ
- Chụp dấu hiệu tự sửa chữa

## YÊU CẦU KỸ THUẬT

- Định dạng: JPG hoặc PNG
- Kích thước: Tối thiểu 800x600px
- Dung lượng: Tối đa 5MB/ảnh
- Background: Bàn sạch sẽ, ánh sáng đủ

## CÁCH UPLOAD

1. Chụp ảnh bằng điện thoại/máy ảnh
2. Upload vào hệ thống (attach vào task)
3. Đặt tên: [Serial]_[Vị trí]_[Ngày].jpg

## LƯU Ý

- Những ảnh này sẽ TỰ ĐỘNG COPY sang Service Ticket
- Technician có thể THÊM ảnh trong quá trình sửa chữa
- Ảnh trước sửa ≠ Ảnh sau sửa (sẽ chụp riêng trong ticket workflow)
```

Click **"Tạo mới"**

---

### 3.4. Tạo Task 3: Xác Định Loại Dịch Vụ

Click **"+ Tạo công việc"** và điền thông tin:

| Trường | Giá trị |
|--------|---------|
| **Tên công việc** | `Xác định loại dịch vụ (Warranty/Paid)` |
| **Danh mục** | `Tiếp nhận` |
| **Thời gian ước tính** | `15` (phút) |
| **Yêu cầu ghi chú** | ☑️ **BẮT BUỘC** |
| **Yêu cầu ảnh** | ☐ Không |

**Mô tả:** (Copy toàn bộ text này)

```
Dựa trên kết quả kiểm tra, xác định loại dịch vụ.

## LOGIC XÁC ĐỊNH

### BƯỚC 1: Kiểm tra WARRANTY STATUS (từ form)

**Nếu "Hết hạn" hoặc "Không có thông tin BH":**
   → Loại dịch vụ: **PAID** (Trả phí)
   → Thông báo khách: "Sản phẩm hết bảo hành, sửa chữa có phí"
   → Hỏi khách: Đồng ý sửa trả phí? (Có/Không)
   → Nếu KHÔNG → Hủy phiếu, trả sản phẩm

**Nếu "Còn BH" (X tháng/ngày):**
   → Kiểm tra kết quả Task 1:

   - Task 1 = ✅ ĐẠT điều kiện
     → Loại dịch vụ: **WARRANTY** (Bảo hành miễn phí)
     → Thông báo khách: "Sửa chữa miễn phí theo bảo hành"

   - Task 1 = ❌ KHÔNG ĐẠT (tem rách/nước/cháy)
     → Loại dịch vụ: **PAID** (Trả phí)
     → Thông báo khách: "Không đủ điều kiện BH vì [lý do]"
     → Hỏi khách: Đồng ý sửa trả phí? (Có/Không)
     → Nếu KHÔNG → Hủy phiếu, trả sản phẩm

### BƯỚC 2: Ghi Completion Notes

**Format bắt buộc:**
```
Loại dịch vụ: [WARRANTY/PAID]
Lý do: [Còn BH + đạt điều kiện / Hết BH / Không đạt - tem rách]
Khách đồng ý: [CÓ/KHÔNG]
Thời gian dự kiến: [3-5 ngày làm việc]
```

**Ví dụ:**
```
Loại dịch vụ: WARRANTY
Lý do: Còn BH 8 tháng + đạt điều kiện kiểm tra
Khách đồng ý: CÓ
Thời gian dự kiến: 3-5 ngày làm việc
```

### SAU KHI COMPLETE TASK NÀY

→ Hệ thống TỰ ĐỘNG:
   1. Tạo Service Ticket cho mỗi sản phẩm
   2. Copy inspection notes từ Task 1
   3. Copy ảnh từ Task 2
   4. Set service type = WARRANTY/PAID
   5. Link ticket → service_request_items
   6. Update service_request.status = 'processing'

→ Reception KHÔNG CẦN tạo ticket thủ công
→ Ticket sẽ tự động gán workflow phù hợp
```

Click **"Tạo mới"**

---

### ✅ Checkpoint 1: Kiểm Tra Tasks Đã Tạo

Sau khi tạo xong 3 tasks, kiểm tra:

1. Vào `/workflows/tasks`
2. Tìm kiếm: "Kiểm tra điều kiện bảo hành"
3. Phải thấy 3 tasks:
   - ✅ Kiểm tra điều kiện bảo hành vật lý
   - ✅ Chụp ảnh sản phẩm trước sửa chữa
   - ✅ Xác định loại dịch vụ (Warranty/Paid)

4. Click vào từng task, kiểm tra:
   - ✅ Trạng thái = "Kích hoạt" (màu xanh)
   - ✅ Mô tả đầy đủ
   - ✅ Thời gian ước tính đúng

**Nếu có bất kỳ task nào bị thiếu hoặc sai → Sửa lại trước khi tiếp tục**

---

## 4. Bước 2: Tạo Quy Trình Kiểm Định

### 4.1. Truy Cập Trang Quản Lý Quy Trình

1. Menu bên trái → **"Quy trình"** (trong mục Quy trình)
2. URL: `/workflows`

### 4.2. Tạo Workflow Mới

Click **"+ Tạo quy trình"** và điền thông tin:

#### **Phần 1: Thông Tin Cơ Bản**

| Trường | Giá trị |
|--------|---------|
| **Tên quy trình** | `Kiểm định sản phẩm bảo hành tại chỗ` |
| **Loại đối tượng** | `Yêu cầu dịch vụ` (service_request) |
| **Bắt buộc tuần tự** | ☑️ **CÓ** (PHẢI làm đúng thứ tự) |

**Mô tả:** (Copy toàn bộ text này)

```
Quy trình kiểm tra vật lý sản phẩm, chụp ảnh bằng chứng, và xác định loại dịch vụ (warranty/paid) khi tiếp nhận khách hàng walk-in tại trung tâm.

Sau khi hoàn tất 3 tasks, hệ thống sẽ TỰ ĐỘNG tạo Service Ticket cho mỗi sản phẩm với đầy đủ thông tin đã thu thập.

Thời gian: ~35 phút
Áp dụng: Khách mang sản phẩm đến trực tiếp
```

#### **Phần 2: Thêm Công Việc**

**Task 1:**
- Click **"+ Thêm công việc"**
- Chọn: `Kiểm tra điều kiện bảo hành vật lý`
- Bắt buộc: ☑️ CÓ
- Hướng dẫn tùy chỉnh:
  ```
  Kiểm tra kỹ tem bảo hành. Nếu khách phản đối, gọi Manager để quyết định.
  Nếu KHÔNG ĐẠT → Task 2 phải chụp ảnh bằng chứng cận cảnh.
  ```

**Task 2:**
- Click **"+ Thêm công việc"**
- Chọn: `Chụp ảnh sản phẩm trước sửa chữa`
- Bắt buộc: ☑️ CÓ
- Hướng dẫn tùy chỉnh:
  ```
  Tối thiểu 5 ảnh. Nếu Task 1 = KHÔNG ĐẠT, phải chụp ảnh cận cảnh bằng chứng (tem rách, nước, cháy...).
  Những ảnh này sẽ tự động chuyển sang Service Ticket.
  ```

**Task 3:**
- Click **"+ Thêm công việc"**
- Chọn: `Xác định loại dịch vụ (Warranty/Paid)`
- Bắt buộc: ☑️ CÓ
- Hướng dẫn tùy chỉnh:
  ```
  Xác định dựa trên: Warranty status (form) + Kết quả Task 1.
  Ghi rõ: Loại dịch vụ + Lý do + Khách đồng ý (CÓ/KHÔNG).
  Sau khi complete task này, hệ thống sẽ TỰ ĐỘNG tạo ticket - KHÔNG cần tạo thủ công.
  ```

#### **Phần 3: Kiểm Tra Thứ Tự**

Đảm bảo thứ tự đúng:
```
1. Kiểm tra điều kiện bảo hành vật lý
2. Chụp ảnh sản phẩm trước sửa chữa
3. Xác định loại dịch vụ (Warranty/Paid)
```

Nếu sai thứ tự → Kéo thả để sắp xếp lại

Click **"Tạo quy trình"** để lưu

---

### ✅ Checkpoint 2: Kiểm Tra Workflow Đã Tạo

1. Vào `/workflows`
2. Tìm: "Kiểm định sản phẩm bảo hành tại chỗ"
3. Click vào tên để xem chi tiết
4. Kiểm tra:
   - ✅ Loại đối tượng = "Yêu cầu dịch vụ"
   - ✅ Bắt buộc tuần tự = "Có" (có badge "Tuần tự")
   - ✅ Có 3 công việc đúng thứ tự
   - ✅ Tổng thời gian = 35 phút
   - ✅ Trạng thái = "Đang hoạt động"

**Screenshot mẫu:**
```
┌─────────────────────────────────────────────────────┐
│ Kiểm định sản phẩm bảo hành tại chỗ                │
│ Loại đối tượng: Yêu cầu dịch vụ  [Tuần tự]        │
│ Trạng thái: Đang hoạt động                         │
├─────────────────────────────────────────────────────┤
│ 1. ✓ Kiểm tra điều kiện bảo hành vật lý  (10 phút)│
│ 2. ✓ Chụp ảnh sản phẩm trước sửa chữa      (10 phút)│
│ 3. ✓ Xác định loại dịch vụ (Warranty/Paid) (15 phút)│
├─────────────────────────────────────────────────────┤
│ Tổng: 3 công việc • 35 phút                        │
└─────────────────────────────────────────────────────┘
```

---

## 5. Bước 3: Kết Nối Quy Trình Với Service Request

### ⚠️ Lưu Ý Quan Trọng

Hiện tại, tính năng **tự động gắn workflow** vào Service Request **CHƯA CÓ** trong UI.

Có **2 cách** để sử dụng workflow này:

---

### **Cách 1: Gắn Thủ Công Qua API (Tạm thời)**

Sau khi tạo Service Request, gắn workflow bằng API:

**Bước 1:** Tạo Service Request bình thường tại `/operations/service-requests/new`

**Bước 2:** Lấy `service_request_id` và `workflow_id`

```javascript
// Mở Console trong trình duyệt (F12)

// Lấy Service Request ID vừa tạo
const serviceRequestId = "uuid-từ-url"; // VD: SR-2025-100

// Lấy Workflow ID
// Cách 1: Lấy từ URL khi xem workflow detail
// Cách 2: Query database
const workflowId = "uuid-của-workflow-kiểm-định";

// Gọi API để tạo tasks
await fetch('/api/trpc/tasks.createTasksFromWorkflow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    entityType: 'service_request',
    entityId: serviceRequestId,
    workflowId: workflowId
  })
});
```

**Bước 3:** Refresh trang Service Request detail → Sẽ thấy 3 tasks

---

### **Cách 2: Yêu Cầu Dev Team Thêm UI (Khuyến nghị)**

Tạo ticket cho Dev Team để thêm UI chọn workflow trong form:

**Feature Request:**

```
Title: Thêm workflow selector vào Service Request form

Description:
- Thêm dropdown chọn workflow trong form tạo Service Request
- Vị trí: Sau section "Tình trạng nhận hàng"
- Label: "Quy trình kiểm định (tùy chọn)"
- Hiển thị: Chỉ workflows có entity_type = 'service_request' và is_active = true
- Logic:
  * Nếu chọn workflow → Tự động tạo tasks khi submit
  * Nếu không chọn → Tạo tickets ngay (behavior hiện tại)

Acceptance Criteria:
- [ ] Dropdown hiển thị danh sách workflows đúng
- [ ] Tasks tự động tạo khi submit với workflow
- [ ] Tickets chỉ tạo sau khi hoàn tất workflow
- [ ] Copy ảnh + notes từ SR tasks sang tickets
```

Sau khi Dev Team implement → Cách dùng sẽ như này:

```
1. Vào: /operations/service-requests/new
2. Điền form như bình thường
3. ☑️ "Đã nhận sản phẩm từ khách hàng"
4. → MỚI: Dropdown "Quy trình kiểm định"
   → Chọn: "Kiểm định sản phẩm bảo hành tại chỗ"
5. Click "Tạo phiếu yêu cầu"
   → Hệ thống tạo SR + 3 tasks (CHƯA tạo tickets)
6. Hoàn tất 3 tasks
   → Task 3 complete → TỰ ĐỘNG tạo tickets
```

---

## 6. Bước 4: Kiểm Tra Hoạt Động

### 6.1. Test Case 1: Sản Phẩm Còn BH + Đạt Điều Kiện

**Scenario:** Khách mang card ZOTAC RTX 4090 còn BH 8 tháng, tem nguyên, không nước

**Bước thực hiện:**

1. **Tạo Service Request:**
   - Vào `/operations/service-requests/new`
   - Nhập serial: `ZT-RTX4090-001234`
   - Hệ thống hiển thị: ✅ "ZOTAC RTX 4090 • BH: Còn 8 tháng"
   - Nhập SĐT khách: `0912345678`
   - ☑️ "Đã nhận sản phẩm từ khách hàng"
   - Gắn workflow (Cách 1 hoặc Cách 2)
   - Click "Tạo phiếu yêu cầu"

2. **Task 1: Kiểm tra điều kiện BH**
   - Vào trang chi tiết Service Request
   - Tìm Task 1: "Kiểm tra điều kiện bảo hành vật lý"
   - Click "Bắt đầu"
   - Kiểm tra checklist:
     - ✅ Tem nguyên
     - ✅ Không nước
     - ✅ Không biến dạng
     - ✅ Không tự sửa
   - Click "Hoàn thành"
   - Nhập notes: `ĐẠT - Tem nguyên, không nước, không biến dạng`

3. **Task 2: Chụp ảnh**
   - Task 2 tự động unlock (do tuần tự)
   - Click "Bắt đầu"
   - Upload 5 ảnh:
     1. `ZT4090001_Serial_20251106.jpg`
     2. `ZT4090001_Tem_20251106.jpg`
     3. `ZT4090001_Top_20251106.jpg`
     4. `ZT4090001_Side_20251106.jpg`
     5. `ZT4090001_Issue_20251106.jpg`
   - Click "Hoàn thành"

4. **Task 3: Xác định loại dịch vụ**
   - Task 3 tự động unlock
   - Click "Bắt đầu"
   - Logic:
     - Warranty status = "Còn 8 tháng" ✅
     - Task 1 result = "ĐẠT" ✅
     - → Loại dịch vụ = **WARRANTY**
   - Thông báo khách: "Anh nhé, sản phẩm còn BH 8 tháng, em sửa miễn phí. Dự kiến 3-5 ngày."
   - Click "Hoàn thành"
   - Nhập notes:
     ```
     Loại dịch vụ: WARRANTY
     Lý do: Còn BH 8 tháng + đạt điều kiện kiểm tra
     Khách đồng ý: CÓ
     Thời gian dự kiến: 3-5 ngày làm việc
     ```

5. **Kiểm tra kết quả:**
   - Service Request status → `processing` ✅
   - Hệ thống TỰ ĐỘNG tạo ticket: `SV-2025-123`
   - Ticket có:
     - ✅ Customer = Khách từ SR
     - ✅ Product = ZOTAC RTX 4090
     - ✅ Serial = ZT-RTX4090-001234
     - ✅ Service type = **warranty**
     - ✅ Có 5 ảnh từ Task 2
     - ✅ Có notes từ Task 1 và Task 3
     - ✅ Link về service_request_items

---

### 6.2. Test Case 2: Sản Phẩm Còn BH + KHÔNG Đạt Điều Kiện

**Scenario:** Khách mang SSD còn BH 6 tháng, nhưng tem bị rách

**Bước thực hiện:**

1. **Tạo Service Request** (như Test Case 1)

2. **Task 1: Kiểm tra điều kiện BH**
   - Kiểm tra checklist:
     - ❌ Tem bị rách
     - ✅ Không nước
     - ✅ Không biến dạng
     - ✅ Không tự sửa
   - Kết luận: **KHÔNG ĐẠT**
   - Báo khách: "Anh ơi, em kiểm tra thấy tem bảo hành bị rách rồi. Theo chính sách, sản phẩm không đủ điều kiện bảo hành miễn phí. Anh có muốn sửa có phí không ạ?"
   - Khách: "Ừ được, sửa có phí đi"
   - Click "Hoàn thành"
   - Nhập notes: `KHÔNG ĐẠT - Tem bảo hành bị rách`

3. **Task 2: Chụp ảnh**
   - Upload 6 ảnh (5 ảnh bình thường + 1 ảnh cận cảnh tem rách)
   - Ảnh 6: `SSD001_TemRach_20251106.jpg` (QUAN TRỌNG - bằng chứng)

4. **Task 3: Xác định loại dịch vụ**
   - Logic:
     - Warranty status = "Còn 6 tháng" ✅
     - Task 1 result = "KHÔNG ĐẠT - Tem rách" ❌
     - → Loại dịch vụ = **PAID**
   - Nhập notes:
     ```
     Loại dịch vụ: PAID
     Lý do: Còn BH 6 tháng nhưng không đạt điều kiện - tem bị rách
     Khách đồng ý: CÓ (sửa có phí)
     Thời gian dự kiến: 3-5 ngày làm việc, báo giá sau chẩn đoán
     ```

5. **Kiểm tra kết quả:**
   - Ticket được tạo với service_type = **paid** ✅
   - Có ảnh bằng chứng tem rách ✅

---

### 6.3. Test Case 3: Sản Phẩm Hết BH

**Scenario:** Khách mang card hết bảo hành 3 tháng trước

**Bước thực hiện:**

1. **Tạo Service Request**
   - Nhập serial
   - Hệ thống hiển thị: 🔴 "BH: Hết hạn (15/08/2024)"

2. **Task 1: Kiểm tra điều kiện BH**
   - ⚠️ Có thể SKIP checklist vì đã hết BH
   - Nhập notes: `Sản phẩm hết bảo hành từ 15/08/2024`

3. **Task 2: Chụp ảnh** (vẫn phải chụp)

4. **Task 3: Xác định loại dịch vụ**
   - Logic:
     - Warranty status = "Hết hạn" ❌
     - → Loại dịch vụ = **PAID**
   - Báo khách: "Anh ơi, sản phẩm hết bảo hành từ tháng 8 rồi. Sửa chữa có phí. Anh có muốn sửa không?"
   - Nếu khách: **"Không, em lấy về"**
     - Nhập notes:
       ```
       Loại dịch vụ: PAID
       Lý do: Hết bảo hành từ 15/08/2024
       Khách đồng ý: KHÔNG
       Hành động: Hủy phiếu, trả sản phẩm cho khách
       ```
     - Hủy Service Request (status = 'cancelled')
     - **KHÔNG tạo ticket**

---

### 6.4. Test Case 4: Nhiều Sản Phẩm

**Scenario:** Khách mang 3 card ZOTAC cùng lúc

**Bước thực hiện:**

1. **Tạo Service Request**
   - Nhập serial #1: `ZT-RTX4090-001`
   - Click "Thêm sản phẩm"
   - Nhập serial #2: `ZT-RTX4090-002`
   - Click "Thêm sản phẩm"
   - Nhập serial #3: `ZT-RTX4090-003`
   - Mô tả chung: "Cả 3 card đều không lên hình"

2. **Task 1-3:** Làm như bình thường (kiểm tra chung 3 card)

3. **Kiểm tra kết quả:**
   - Hệ thống TỰ ĐỘNG tạo **3 tickets riêng biệt:**
     - SV-2025-123 (Serial: ZT-RTX4090-001)
     - SV-2025-124 (Serial: ZT-RTX4090-002)
     - SV-2025-125 (Serial: ZT-RTX4090-003)
   - ✅ Cả 3 tickets đều có:
     - Cùng khách hàng
     - Cùng ảnh từ Task 2 (chung)
     - Cùng notes từ Task 1, 3
     - Nhưng mỗi ticket xử lý 1 sản phẩm riêng

---

## 7. Xử Lý Lỗi Thường Gặp

### Lỗi 1: Không Tìm Thấy Menu "Quy trình"

**Nguyên nhân:** Tài khoản không có quyền Admin/Manager

**Giải pháp:**
1. Kiểm tra role: Query `SELECT role FROM profiles WHERE id = '<your-user-id>'`
2. Nếu role ≠ 'admin' hoặc 'manager' → Liên hệ Admin để cấp quyền

---

### Lỗi 2: Task Không Tự Động Tạo Sau Khi Submit SR

**Nguyên nhân:** Chưa gắn workflow vào service request

**Giải pháp:**
1. Kiểm tra: `SELECT workflow_id FROM service_requests WHERE id = '<sr-id>'`
2. Nếu `workflow_id` = NULL → Workflow chưa được gắn
3. Dùng Cách 1 (API) để gắn workflow thủ công
4. Hoặc yêu cầu Dev Team implement Cách 2 (UI)

---

### Lỗi 3: Tickets Không Tự Động Tạo Sau Khi Complete Task 3

**Nguyên nhân:** Logic trigger chưa được implement

**Hiện trạng:**
- Auto ticket creation hiện chạy NGAY khi submit SR (status = 'received')
- Chưa có logic check "workflow tasks completed"

**Giải pháp tạm thời:**
1. Hoàn tất Task 3
2. Vào trang chi tiết Service Request
3. Nếu KHÔNG thấy tickets tự động tạo → Tạo thủ công:
   - Click "Tạo Service Ticket"
   - Copy thông tin từ SR
   - Copy ảnh từ Task 2
   - Copy notes từ Task 1, 3

**Giải pháp lâu dài:** Yêu cầu Dev Team implement logic:
```typescript
// Pseudo-code
async onTaskComplete(taskId) {
  const task = await getTask(taskId);
  const isLastTask = await isLastTaskInWorkflow(taskId);

  if (isLastTask) {
    const sr = await getServiceRequest(task.entity_id);

    // Auto-create tickets
    await createTicketsFromServiceRequest(sr.id, {
      copyPhotos: true,        // From Task 2
      copyInspectionNotes: true, // From Task 1
      serviceTypeNotes: task.completion_notes // From Task 3
    });
  }
}
```

---

### Lỗi 4: Ảnh Từ Task 2 Không Chuyển Sang Ticket

**Nguyên nhân:** Logic copy ảnh chưa được implement

**Giải pháp tạm thời:**
1. Vào Service Request → Task 2 → Download ảnh
2. Vào Service Ticket → Upload lại ảnh

**Giải pháp lâu dài:** Yêu cầu Dev Team implement:
```typescript
// Khi tạo ticket từ SR
const srTaskPhotos = await getTaskAttachments({
  entityType: 'service_request',
  entityId: sr.id,
  taskName: 'Chụp ảnh sản phẩm trước sửa chữa'
});

// Copy sang ticket
for (const photo of srTaskPhotos) {
  await copyAttachment({
    from: photo,
    toEntityType: 'service_ticket',
    toEntityId: ticket.id
  });
}
```

---

### Lỗi 5: Không Thể Upload Ảnh Trong Task 2

**Nguyên nhân:** Task attachment system chưa được implement

**Hiện trạng:** Hệ thống chưa có tính năng attach ảnh vào tasks

**Giải pháp tạm thời:**
1. Chụp ảnh bằng điện thoại
2. Upload vào folder tạm: `/uploads/service-requests/SR-2025-XXX/`
3. Ghi link ảnh vào completion notes của Task 2

**Giải pháp lâu dài:** Yêu cầu Dev Team implement:
- File: `src/server/routers/tasks.ts` → `uploadAttachment` (đã có sẵn)
- UI Component: `<TaskAttachmentUpload />` (cần tạo mới)

---

## 📚 Tài Liệu Tham Khảo

- [Hướng Dẫn Quản Lý Công Việc và Quy Trình](./HUONG-DAN-QUAN-LY-CONG-VIEC-VA-QUY-TRINH.md)
- [Kiến trúc & luồng tổng quan (đã hợp nhất ở tài liệu này)](./HUONG-DAN-CAU-HINH-WORKFLOW-KIEM-DINH.md#1-tổng-quan)
- [Yêu cầu triển khai chi tiết (xem các mục Phases trong tài liệu này)](./HUONG-DAN-CAU-HINH-WORKFLOW-KIEM-DINH.md#implementation-notes)
- [Service Request Draft & Phone Lookup](./architecture/SERVICE-REQUEST-DRAFT-AND-PHONE-LOOKUP.md)

---

## 💡 Tips & Best Practices

### Tip 1: Test Workflow Với Dữ Liệu Thật

Trước khi áp dụng rộng rãi:
1. Chọn 5-10 service requests thật
2. Chạy workflow này
3. Thu thập feedback từ Reception
4. Điều chỉnh mô tả tasks nếu cần

### Tip 2: Training Reception Staff

1. Tạo video hướng dẫn (screen recording)
2. In checklist Task 1 để dán tại quầy tiếp nhận
3. Chuẩn bị 2-3 sản phẩm mẫu để training

### Tip 3: Customize Theo Sản Phẩm

Có thể tạo nhiều workflows riêng:
- "Kiểm định Card Đồ Họa" (focus vào GPU, quạt, keo tản nhiệt)
- "Kiểm định SSD" (focus vào kết nối, SMART status)
- "Kiểm định Mini PC" (focus vào RAM, ổ cứng, nguồn)

### Tip 4: Metrics & Reporting

Sau 1 tháng chạy, phân tích:
- % warranty rejections (từ chối BH)
- Lý do từ chối phổ biến (tem rách, nước, cháy...)
- Thời gian trung bình hoàn thành workflow
- % khách đồng ý sửa trả phí sau khi từ chối BH

---

## ❓ Câu Hỏi & Hỗ Trợ

Nếu gặp vấn đề trong quá trình cấu hình:

1. **Kiểm tra lại từng bước** trong hướng dẫn này
2. **Xem phần "Xử Lý Lỗi"** phía trên
3. **Liên hệ:**
   - Email: support@sstc.vn
   - Hotline: 1900-xxxx
   - Hoặc tạo issue trong repository

---

**Chúc bạn cấu hình thành công!** 🚀

_Tài liệu được tạo: 2025-11-06_
_Phiên bản: 1.0_
