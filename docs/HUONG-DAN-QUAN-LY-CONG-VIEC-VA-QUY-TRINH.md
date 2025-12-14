# Hướng Dẫn Quản Lý Công Việc và Quy Trình

**Dành cho:** Admin, Manager - SSTC Service Center
**Mục đích:** Hướng dẫn thiết lập và quản lý công việc (Tasks) và quy trình (Workflows) trong hệ thống
**Cập nhật:** 2025-11-05

---

## 📚 Mục Lục

1. [Giới Thiệu](#1-giới-thiệu)
2. [Khái Niệm Cơ Bản](#2-khái-niệm-cơ-bản)
3. [Quản Lý Công Việc (Tasks)](#3-quản-lý-công-việc-tasks)
4. [Quản Lý Quy Trình (Workflows)](#4-quản-lý-quy-trình-workflows)
5. [Ví Dụ Thực Tế](#5-ví-dụ-thực-tế)
6. [Thực Hành: Tạo Quy Trình Đầu Tiên](#6-thực-hành-tạo-quy-trình-đầu-tiên)
7. [Câu Hỏi Thường Gặp](#7-câu-hỏi-thường-gặp)
8. [Best Practices](#8-best-practices)

---

## 1. Giới Thiệu

### Hệ thống quản lý công việc và quy trình là gì?

Hệ thống này giúp bạn:
- ✅ **Chuẩn hóa quy trình làm việc** - Đảm bảo mọi người làm đúng các bước
- ✅ **Theo dõi tiến độ** - Biết công việc nào đang làm, đã xong, còn tồn đọng
- ✅ **Phân công rõ ràng** - Ai làm gì, làm khi nào
- ✅ **Đảm bảo chất lượng** - Không bỏ sót bước quan trọng
- ✅ **Tối ưu hiệu suất** - Giảm thời gian xử lý, tăng năng suất

### Ai cần đọc tài liệu này?

- 👤 **Admin** - Thiết lập toàn bộ hệ thống
- 👤 **Manager** - Tạo và điều chỉnh quy trình theo nhu cầu
- 👤 **Technician** (tham khảo) - Hiểu cách hệ thống hoạt động

---

## 2. Khái Niệm Cơ Bản

### 2.1. Công Việc (Task)

**Công việc** là một đơn vị công việc nhỏ, cụ thể mà một người có thể thực hiện.

**Ví dụ:**
- "Kiểm tra nguồn điện"
- "Thay thế tản nhiệt"
- "Nhập serial vào hệ thống"
- "Chạy test stress"
- "Chụp ảnh tình trạng sản phẩm"

**Đặc điểm của Task:**
- 🔹 **Độc lập** - Có thể sử dụng lại trong nhiều quy trình khác nhau
- 🔹 **Cụ thể** - Mô tả rõ ràng việc cần làm
- 🔹 **Đo lường được** - Có thời gian ước tính, có thể đánh dấu hoàn thành
- 🔹 **Thư viện chung** - Tạo một lần, dùng nhiều lần

**Thuộc tính của Task:**
| Thuộc tính | Mô tả | Ví dụ |
|------------|-------|-------|
| Tên | Tên ngắn gọn của công việc | "Kiểm tra nguồn" |
| Mô tả | Giải thích chi tiết cần làm gì | "Dùng đồng hồ vạn năng đo điện áp..." |
| Danh mục | Phân loại công việc | "Kiểm tra", "Sửa chữa", "Kiểm định" |
| Thời gian ước tính | Thời gian dự kiến hoàn thành | 15 phút |
| Yêu cầu ghi chú | Bắt buộc nhập ghi chú khi hoàn thành? | Có/Không |
| Yêu cầu ảnh | Bắt buộc chụp ảnh khi hoàn thành? | Có/Không |

---

### 2.2. Quy Trình (Workflow)

**Quy trình** là một chuỗi các công việc được sắp xếp theo thứ tự để hoàn thành một mục tiêu lớn.

**Ví dụ:**
- "Quy trình bảo hành card đồ họa ZOTAC"
- "Quy trình nhập kho sản phẩm mới"
- "Quy trình sửa chữa trả phí"

**Đặc điểm của Workflow:**
- 🔹 **Có trình tự** - Các công việc được sắp xếp theo thứ tự logic
- 🔹 **Áp dụng cho loại đối tượng** - Mỗi quy trình dành cho một loại đối tượng cụ thể (phiếu bảo hành, phiếu nhập kho, v.v.)
- 🔹 **Có thể bắt buộc tuần tự** - Có thể yêu cầu làm đúng thứ tự hoặc cho phép làm song song
- 🔹 **Kích hoạt tự động** - Khi tạo đối tượng mới, hệ thống tự động tạo các công việc theo quy trình

**Thuộc tính của Workflow:**
| Thuộc tính | Mô tả | Ví dụ |
|------------|-------|-------|
| Tên | Tên mô tả quy trình | "Bảo hành ZOTAC RTX 4090" |
| Mô tả | Giải thích mục đích quy trình | "Quy trình xử lý bảo hành card..." |
| Loại đối tượng | Áp dụng cho đối tượng nào | Phiếu bảo hành, Phiếu nhập kho, v.v. |
| Bắt buộc tuần tự | Phải làm đúng thứ tự? | Có/Không |
| Trạng thái | Đang kích hoạt hay tạm ngưng | Kích hoạt/Không kích hoạt |
| Danh sách công việc | Các công việc trong quy trình | Task 1 → Task 2 → Task 3... |

---

### 2.3. Mối Quan Hệ Giữa Task và Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    THƯ VIỆN CÔNG VIỆC                       │
│  (Các Task có thể tái sử dụng)                              │
│                                                              │
│  📝 Kiểm tra nguồn điện                                     │
│  📝 Vệ sinh card đồ họa                                     │
│  📝 Thay thế tản nhiệt                                      │
│  📝 Chạy test stress 30 phút                                │
│  📝 Chụp ảnh trước/sau sửa chữa                             │
│  📝 Nhập serial vào hệ thống                                │
│  📝 Cập nhật firmware                                        │
│  ... (50+ công việc khác)                                   │
└─────────────────────────────────────────────────────────────┘
         ↓ ↓ ↓               ↓ ↓                    ↓ ↓
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  QUY TRÌNH 1         │  │  QUY TRÌNH 2     │  │  QUY TRÌNH 3     │
│  Bảo hành ZOTAC      │  │  Nhập kho SSD    │  │  Sửa chữa trả phí│
│                      │  │                  │  │                  │
│  1. Kiểm tra nguồn   │  │  1. Nhập serial  │  │  1. Kiểm tra nguồn│
│  2. Vệ sinh card     │  │  2. Chụp ảnh     │  │  2. Chẩn đoán lỗi│
│  3. Test stress      │  │  3. Kiểm định    │  │  3. Báo giá      │
│  4. Chụp ảnh         │  │  4. Phê duyệt    │  │  4. Sửa chữa     │
└──────────────────────┘  └──────────────────┘  └──────────────────┘
```

**Lợi ích:**
- ✅ Tạo task một lần, dùng trong nhiều quy trình
- ✅ Thay đổi task → tất cả quy trình dùng task đó đều được cập nhật
- ✅ Tránh trùng lặp và dễ quản lý

---

## 3. Quản Lý Công Việc (Tasks)

### 3.1. Truy Cập Trang Quản Lý Công Việc

1. Đăng nhập hệ thống với tài khoản **Admin** hoặc **Manager**
2. Vào menu bên trái, chọn **"Công việc"** (trong mục Quy trình)
3. URL: `/workflows/tasks`

### 3.2. Danh Sách Công Việc Hiện Có

Khi vào trang, bạn sẽ thấy bảng danh sách các công việc:

**Các cột trong bảng:**
- **Tên** - Tên công việc
- **Danh mục** - Phân loại (Kiểm tra, Sửa chữa, Kiểm định...)
- **Thời gian** - Thời gian ước tính (phút)
- **Yêu cầu** - Badges hiển thị yêu cầu ghi chú/ảnh
- **Trạng thái** - Kích hoạt (màu xanh) / Không kích hoạt (màu xám)
- **Thao tác** - Nút để sửa hoặc bật/tắt

**Các chức năng:**
- 🔍 **Tìm kiếm** - Ô tìm kiếm ở trên cùng
- 📊 **Sắp xếp** - Click vào tên cột để sắp xếp
- 🔧 **Lọc theo trạng thái** - Tab "Tất cả" / "Kích hoạt" / "Không kích hoạt"
- ➕ **Tạo mới** - Nút "Tạo công việc" ở góc phải

---

### 3.3. Tạo Công Việc Mới

**Bước 1:** Click nút **"+ Tạo công việc"** ở góc phải trên

**Bước 2:** Form drawer sẽ hiện ra bên phải màn hình. Điền các thông tin:

| Trường | Bắt buộc | Mô tả | Ví dụ |
|--------|----------|-------|-------|
| **Tên công việc** | ✅ Có | Tên ngắn gọn, dễ hiểu | "Kiểm tra nguồn card đồ họa" |
| **Danh mục** | ❌ Không | Phân loại để dễ tìm kiếm | "Kiểm tra phần cứng" |
| **Mô tả** | ❌ Không | Hướng dẫn chi tiết cách làm | "Dùng đồng hồ vạn năng kiểm tra điện áp các rail +12V, +5V, +3.3V..." |
| **Thời gian ước tính** | ❌ Không | Số phút dự kiến | 15 (phút) |
| **Yêu cầu ghi chú** | ❌ Không | Bắt buộc nhập ghi chú khi hoàn thành? | ☑️ (tích chọn nếu có) |
| **Yêu cầu ảnh** | ❌ Không | Bắt buộc chụp ảnh khi hoàn thành? | ☑️ (tích chọn nếu có) |

**Bước 3:** Click **"Tạo mới"** để lưu

**Lưu ý:**
- ⚠️ Tên công việc phải duy nhất (không trùng với công việc đã có)
- 💡 Nên điền đầy đủ mô tả để kỹ thuật viên hiểu rõ cách làm
- 💡 Thời gian ước tính giúp quản lý lên kế hoạch tốt hơn

---

### 3.4. Sửa Công Việc

**Bước 1:** Tìm công việc cần sửa trong danh sách

**Bước 2:** Click vào icon **bút chì** (✏️) ở cột "Thao tác"

**Bước 3:** Form sửa sẽ hiện ra, chỉnh sửa các thông tin cần thiết

**Bước 4:** Click **"Cập nhật"** để lưu thay đổi

**Lưu ý:**
- ⚠️ Nếu công việc này đang được dùng trong quy trình đang chạy, việc sửa đổi sẽ ảnh hưởng đến các phiếu đang xử lý
- 💡 Nên thông báo cho team trước khi sửa đổi công việc quan trọng

---

### 3.5. Vô Hiệu Hóa Công Việc

Nếu một công việc không còn dùng nữa, **không nên xóa** mà nên **vô hiệu hóa** để:
- Giữ lại lịch sử
- Không ảnh hưởng đến các quy trình đã dùng công việc này trước đó

**Cách vô hiệu hóa:**
1. Click vào icon **công tắc** (🔄) ở cột "Thao tác"
2. Trạng thái sẽ chuyển từ "Kích hoạt" (xanh) sang "Không kích hoạt" (xám)
3. Công việc này sẽ không xuất hiện khi tạo quy trình mới

**Cách kích hoạt lại:**
- Click lại icon công tắc để bật lại

---

### 3.6. Ví Dụ: Các Công Việc Thường Dùng Cho Service Center

#### A. Danh mục: Kiểm tra phần cứng

| Tên công việc | Thời gian | Yêu cầu ghi chú | Yêu cầu ảnh |
|---------------|-----------|-----------------|-------------|
| Kiểm tra nguồn card đồ họa | 10 phút | ✅ | ❌ |
| Kiểm tra tản nhiệt | 5 phút | ✅ | ✅ |
| Test stress GPU 30 phút | 35 phút | ✅ | ✅ |
| Kiểm tra kết nối PCIe | 5 phút | ✅ | ❌ |
| Đo nhiệt độ hoạt động | 15 phút | ✅ | ❌ |

#### B. Danh mục: Sửa chữa

| Tên công việc | Thời gian | Yêu cầu ghi chú | Yêu cầu ảnh |
|---------------|-----------|-----------------|-------------|
| Vệ sinh card đồ họa | 20 phút | ✅ | ✅ |
| Thay thế tản nhiệt | 30 phút | ✅ | ✅ |
| Thay thế keo tản nhiệt | 15 phút | ✅ | ✅ |
| Sửa chữa mạch nguồn | 60 phút | ✅ | ✅ |
| Flash BIOS card đồ họa | 20 phút | ✅ | ❌ |

#### C. Danh mục: Kiểm định chất lượng

| Tên công việc | Thời gian | Yêu cầu ghi chú | Yêu cầu ảnh |
|---------------|-----------|-----------------|-------------|
| Kiểm tra bao bì sản phẩm | 5 phút | ✅ | ✅ |
| Kiểm tra phụ kiện đầy đủ | 5 phút | ✅ | ✅ |
| Test điểm benchmark | 20 phút | ✅ | ✅ |
| Kiểm tra ổn định 24h | 1440 phút | ✅ | ✅ |

#### D. Danh mục: Quản lý kho

| Tên công việc | Thời gian | Yêu cầu ghi chú | Yêu cầu ảnh |
|---------------|-----------|-----------------|-------------|
| Nhập serial vào hệ thống | 2 phút | ❌ | ❌ |
| Chụp ảnh sản phẩm nhập kho | 3 phút | ❌ | ✅ |
| Kiểm tra số lượng thực tế | 10 phút | ✅ | ❌ |
| Kiểm định chất lượng nhập kho | 15 phút | ✅ | ✅ |

---

## 4. Quản Lý Quy Trình (Workflows)

### 4.1. Truy Cập Trang Quản Lý Quy Trình

1. Đăng nhập hệ thống với tài khoản **Admin** hoặc **Manager**
2. Vào menu bên trái, chọn **"Quy trình"** (trong mục Quy trình)
3. URL: `/workflows`

### 4.2. Danh Sách Quy Trình Hiện Có

**Các cột trong bảng:**
- **Tên mẫu** - Tên quy trình (click vào để xem chi tiết)
- **Loại dịch vụ** - Badge màu hiển thị loại:
  - 🔵 **Bảo hành** (warranty)
  - 🟢 **Trả phí** (paid)
  - 🟠 **Đổi mới** (replacement)
- **Công việc** - Số lượng công việc trong quy trình + badge "Tuần tự" nếu bắt buộc tuần tự
- **Ngày tạo** - Ngày tạo quy trình
- **Thao tác** - Menu 3 chấm với các tùy chọn: Xem chi tiết, Sửa, Xóa

**Các chức năng:**
- 🔍 **Tìm kiếm** - Ô tìm kiếm ở trên cùng
- 🔧 **Lọc** - Tab "Tất cả mẫu" / "Đang hoạt động" / "Đã lưu trữ"
- 🎛️ **Tùy chỉnh cột** - Hiện/ẩn các cột theo ý muốn
- ➕ **Tạo mới** - Nút "Tạo quy trình" ở góc phải

---

### 4.3. Tạo Quy Trình Mới

**Bước 1:** Click nút **"+ Tạo quy trình"** ở góc phải trên

**Bước 2:** Trang tạo mới sẽ hiện ra với 3 phần chính:

#### **Phần 1: Thông Tin Cơ Bản**

| Trường | Bắt buộc | Mô tả | Ví dụ |
|--------|----------|-------|-------|
| **Tên quy trình** | ✅ Có | Tên mô tả rõ ràng | "Bảo hành ZOTAC RTX 4090" |
| **Mô tả** | ❌ Không | Giải thích mục đích và phạm vi áp dụng | "Quy trình xử lý bảo hành card đồ họa ZOTAC RTX 4090..." |
| **Loại đối tượng** | ✅ Có | Chọn loại đối tượng áp dụng | Phiếu bảo hành, Phiếu nhập kho, v.v. |
| **Loại dịch vụ** | ✅ Có (nếu là phiếu bảo hành) | Bảo hành / Trả phí / Đổi mới | Bảo hành |
| **Bắt buộc tuần tự** | ❌ Không | Phải làm đúng thứ tự? | ☑️ (tích nếu có) |

**Lưu ý về Loại đối tượng:**
- **Phiếu bảo hành (service_ticket)** - Quy trình sửa chữa, bảo hành sản phẩm của khách hàng
- **Phiếu nhập kho (inventory_receipt)** - Quy trình nhập hàng vào kho
- **Phiếu xuất kho (inventory_issue)** - Quy trình xuất hàng ra khỏi kho
- **Phiếu chuyển kho (inventory_transfer)** - Quy trình chuyển hàng giữa các kho
- **Yêu cầu dịch vụ (service_request)** - Quy trình tiếp nhận yêu cầu từ khách hàng

**Lưu ý về Bắt buộc tuần tự:**
- ✅ **Tích** - Kỹ thuật viên phải làm công việc 1 xong mới được làm công việc 2
- ❌ **Không tích** - Kỹ thuật viên có thể làm bất kỳ công việc nào trước

#### **Phần 2: Thêm Công Việc Vào Quy Trình**

1. Click nút **"+ Thêm công việc"**
2. Chọn công việc từ dropdown (danh sách các task đã tạo ở bước trước)
3. Thiết lập các tùy chọn:
   - **Bắt buộc** - Công việc này có bắt buộc phải hoàn thành không?
   - **Hướng dẫn tùy chỉnh** - Hướng dẫn riêng cho công việc này trong quy trình này

4. Kéo thả để **sắp xếp thứ tự** công việc (nếu quy trình có tuần tự)

**Ví dụ:**
```
Quy trình: Bảo hành ZOTAC RTX 4090
Tuần tự: Có ✅

1. Kiểm tra bao bì và phụ kiện (Bắt buộc ✅)
   Hướng dẫn: "Kiểm tra hộp, sách hướng dẫn, cáp nguồn..."

2. Chụp ảnh tình trạng ban đầu (Bắt buộc ✅)
   Hướng dẫn: "Chụp 4 góc card, đặc biệt chú ý vị trí hư hỏng..."

3. Kiểm tra nguồn card (Bắt buộc ✅)
   Hướng dẫn: không

4. Test stress GPU 30 phút (Bắt buộc ✅)
   Hướng dẫn: "Dùng FurMark, nhiệt độ không vượt 83°C..."

5. Vệ sinh card đồ họa (Không bắt buộc ❌)
   Hướng dẫn: "Chỉ làm nếu thấy bụi nhiều..."

6. Chụp ảnh sau sửa chữa (Bắt buộc ✅)
   Hướng dẫn: không
```

**Bước 3:** Click **"Tạo quy trình"** để lưu

---

### 4.4. Xem Chi Tiết Quy Trình

1. Click vào **tên quy trình** trong danh sách (hoặc chọn "Xem chi tiết" từ menu 3 chấm)
2. Trang chi tiết hiển thị:
   - **Thông tin tổng quan** - Tên, mô tả, loại, trạng thái
   - **Danh sách công việc** - Tất cả công việc với thứ tự, thời gian ước tính
   - **Thống kê** - Tổng số công việc, tổng thời gian ước tính

**Thông tin chi tiết mỗi công việc:**
- Số thứ tự
- Tên công việc
- Danh mục
- Thời gian ước tính
- Badge "Bắt buộc" nếu là công việc bắt buộc
- Hướng dẫn tùy chỉnh (nếu có)

---

### 4.5. Sửa Quy Trình

**Bước 1:** Vào trang chi tiết quy trình

**Bước 2:** Click nút **"Sửa quy trình"**

**Bước 3:** Chỉnh sửa các thông tin cần thiết:
- Thay đổi thông tin cơ bản
- Thêm/xóa công việc
- Thay đổi thứ tự công việc
- Sửa hướng dẫn tùy chỉnh

**Bước 4:** Click **"Lưu thay đổi"**

**⚠️ Lưu ý quan trọng:**
- Việc sửa đổi quy trình **không ảnh hưởng** đến các phiếu đã được tạo trước đó
- Chỉ các phiếu **mới tạo** sau khi sửa mới áp dụng quy trình mới
- Nếu muốn thay đổi quy trình cho phiếu đã tạo, phải dùng chức năng "Chuyển đổi quy trình" (xem phần 4.7)

---

### 4.6. Vô Hiệu Hóa Quy Trình

Tương tự như Task, nên **vô hiệu hóa** thay vì xóa quy trình không dùng nữa.

**Cách vô hiệu hóa:**
1. Vào trang chi tiết quy trình
2. Click nút **"Vô hiệu hóa"** hoặc chọn từ menu 3 chấm
3. Quy trình sẽ không xuất hiện khi tạo phiếu mới

**Cách kích hoạt lại:**
- Vào quy trình đã vô hiệu hóa và click **"Kích hoạt"**

---

### 4.7. Chuyển Đổi Quy Trình (Workflow Change)

Đôi khi trong quá trình xử lý, bạn cần **thay đổi quy trình** cho một phiếu đang làm.

**Khi nào cần chuyển đổi quy trình?**
- Khách hàng thay đổi từ bảo hành → trả phí
- Phát hiện lỗi phức tạp hơn dự kiến, cần quy trình khác
- Sai quy trình khi tạo phiếu

**Cách chuyển đổi:**
1. Vào trang chi tiết phiếu (ticket, receipt, issue...)
2. Tìm phần **"Quy trình"**
3. Click nút **"Chuyển đổi quy trình"**
4. Chọn quy trình mới
5. Nhập **lý do chuyển đổi** (bắt buộc - để audit trail)
6. Xác nhận

**Lưu ý:**
- ⚠️ Các công việc đã hoàn thành sẽ **không bị xóa**
- ✅ Hệ thống sẽ thêm các công việc mới từ quy trình mới
- 📝 Lý do chuyển đổi được lưu vào lịch sử để kiểm tra sau

---

## 5. Ví Dụ Thực Tế

### 5.1. Ví Dụ 1: Quy Trình Bảo Hành ZOTAC RTX 4090

**Mục tiêu:** Xử lý bảo hành card đồ họa cao cấp ZOTAC RTX 4090

**Thông tin quy trình:**
- **Tên:** "Bảo hành ZOTAC RTX 4090"
- **Loại đối tượng:** Phiếu bảo hành (service_ticket)
- **Loại dịch vụ:** Bảo hành (warranty)
- **Bắt buộc tuần tự:** Có ✅
- **Lý do tuần tự:** Phải kiểm tra từng bước để tránh làm hỏng thêm

**Danh sách công việc:**

| # | Tên công việc | Bắt buộc | Thời gian | Hướng dẫn tùy chỉnh |
|---|---------------|----------|-----------|---------------------|
| 1 | Kiểm tra bao bì và phụ kiện | ✅ | 5 phút | "Kiểm tra hộp nguyên vẹn, sách HD, cáp nguồn 8-pin x2" |
| 2 | Chụp ảnh tình trạng ban đầu | ✅ | 5 phút | "Chụp 4 góc card, serial number rõ ràng, vị trí hư hỏng nếu có" |
| 3 | Kiểm tra nguồn card | ✅ | 10 phút | "Đo điện áp PCIe 12VHPWR, phải đúng 12V ±5%" |
| 4 | Kiểm tra tản nhiệt | ✅ | 10 phút | "Tháo tản nhiệt, kiểm tra keo tản nhiệt, quạt hoạt động" |
| 5 | Test stress GPU 30 phút | ✅ | 35 phút | "FurMark max settings, nhiệt độ < 83°C, không crash" |
| 6 | Vệ sinh card đồ họa | ❌ | 20 phút | "Chỉ làm nếu thấy bụi dày > 2mm" |
| 7 | Thay thế keo tản nhiệt | ❌ | 15 phút | "Làm nếu test nhiệt độ > 80°C" |
| 8 | Flash BIOS card mới nhất | ❌ | 20 phút | "Chỉ flash nếu có lỗi BIOS hoặc hỗ trợ khắc phục" |
| 9 | Test điểm benchmark | ✅ | 20 phút | "3DMark Time Spy, điểm phải >= 95% điểm chuẩn" |
| 10 | Chụp ảnh sau sửa chữa | ✅ | 5 phút | "Chụp card hoàn chỉnh, kết quả benchmark" |

**Tổng thời gian ước tính:** 145 phút (~2.5 giờ)

**Khi nào quy trình này được áp dụng?**
- Khi tạo phiếu bảo hành mới cho sản phẩm "ZOTAC RTX 4090"
- Hệ thống tự động tạo 10 công việc theo đúng thứ tự trên
- Kỹ thuật viên làm từng bước, không được bỏ qua (vì bắt buộc tuần tự)

---

### 5.2. Ví Dụ 2: Quy Trình Nhập Kho SSD NVMe

**Mục tiêu:** Nhập kho ổ cứng SSD NVMe từ nhà cung cấp

**Thông tin quy trình:**
- **Tên:** "Nhập kho SSD NVMe"
- **Loại đối tượng:** Phiếu nhập kho (inventory_receipt)
- **Bắt buộc tuần tự:** Không ❌
- **Lý do không tuần tự:** Các công việc độc lập, có thể làm song song để tăng tốc

**Danh sách công việc:**

| # | Tên công việc | Bắt buộc | Thời gian | Hướng dẫn tùy chỉnh |
|---|---------------|----------|-----------|---------------------|
| 1 | Kiểm tra số lượng thực tế | ✅ | 10 phút | "Đếm số lượng thực tế, so sánh với phiếu giao hàng" |
| 2 | Nhập serial vào hệ thống | ✅ | 2 phút/sản phẩm | "Quét barcode hoặc nhập thủ công serial number" |
| 3 | Chụp ảnh sản phẩm nhập kho | ✅ | 3 phút/sản phẩm | "Chụp sản phẩm với serial rõ ràng" |
| 4 | Kiểm định chất lượng nhập kho | ✅ | 15 phút | "Random check 10% sản phẩm: test đọc/ghi, kiểm tra SMART" |
| 5 | Cập nhật thông tin bảo hành | ❌ | 5 phút | "Nhập ngày hết hạn bảo hành nếu có từ nhà cung cấp" |

**Tổng thời gian ước tính:** 35 phút (cho 1 sản phẩm)

**Khi nào quy trình này được áp dụng?**
- Khi tạo phiếu nhập kho mới cho sản phẩm "SSD NVMe"
- Nhân viên kho có thể làm song song (nhập serial trong khi người khác kiểm định)

---

### 5.3. Ví Dụ 3: Quy Trình Sửa Chữa Trả Phí

**Mục tiêu:** Xử lý sửa chữa có tính phí cho sản phẩm hết bảo hành

**Thông tin quy trình:**
- **Tên:** "Sửa chữa trả phí - Card đồ họa"
- **Loại đối tượng:** Phiếu bảo hành (service_ticket)
- **Loại dịch vụ:** Trả phí (paid)
- **Bắt buộc tuần tự:** Có ✅
- **Lý do tuần tự:** Phải báo giá trước khi sửa chữa

**Danh sách công việc:**

| # | Tên công việc | Bắt buộc | Thời gian | Hướng dẫn tùy chỉnh |
|---|---------------|----------|-----------|---------------------|
| 1 | Kiểm tra tình trạng sản phẩm | ✅ | 15 phút | "Kiểm tra toàn diện, liệt kê tất cả lỗi" |
| 2 | Chụp ảnh tình trạng ban đầu | ✅ | 5 phút | "Chụp rõ vị trí hư hỏng" |
| 3 | Chẩn đoán nguyên nhân | ✅ | 30 phút | "Xác định nguyên nhân gốc rễ của lỗi" |
| 4 | Lập báo giá sửa chữa | ✅ | 15 phút | "Chi tiết linh kiện cần thay, chi phí công, tổng tiền" |
| 5 | Chờ khách hàng xác nhận | ✅ | 0 phút | "Manager gọi điện xác nhận với khách, đánh dấu hoàn thành khi khách đồng ý" |
| 6 | Thực hiện sửa chữa | ✅ | 60-120 phút | "Thực hiện theo báo giá đã duyệt" |
| 7 | Test sau sửa chữa | ✅ | 30 phút | "Test đầy đủ các chức năng, benchmark" |
| 8 | Chụp ảnh sau sửa chữa | ✅ | 5 phút | "Chụp sản phẩm hoàn chỉnh, kết quả test" |
| 9 | Đóng gói và giao khách | ✅ | 10 phút | "Đóng gói cẩn thận, ghi chú các lưu ý với khách" |

**Tổng thời gian ước tính:** 170-230 phút (~3-4 giờ)

**Điểm khác biệt:**
- Có bước **Lập báo giá** và **Chờ khách xác nhận** (không có trong bảo hành)
- Bắt buộc tuần tự để đảm bảo không sửa trước khi khách đồng ý giá

---

## 6. Thực Hành: Tạo Quy Trình Đầu Tiên

Hãy cùng thực hành tạo một quy trình đơn giản từng bước.

### Bài Thực Hành: Quy Trình Tiếp Nhận Yêu Cầu Dịch Vụ

**Mục tiêu:** Tạo quy trình xử lý yêu cầu dịch vụ từ khách hàng qua online

---

### Bước 1: Tạo Các Công Việc Cần Thiết

Truy cập `/workflows/tasks` và tạo 4 công việc:

#### Công việc 1: Xác nhận thông tin khách hàng
- **Tên:** "Xác nhận thông tin khách hàng"
- **Danh mục:** "Tiếp nhận"
- **Mô tả:** "Gọi điện xác nhận số điện thoại, địa chỉ, sản phẩm cần bảo hành"
- **Thời gian:** 5 phút
- **Yêu cầu ghi chú:** ✅ Có
- **Yêu cầu ảnh:** ❌ Không

Click **"Tạo mới"**

#### Công việc 2: Lên lịch lấy hàng
- **Tên:** "Lên lịch lấy hàng tại nhà khách"
- **Danh mục:** "Tiếp nhận"
- **Mô tả:** "Thỏa thuận thời gian lấy hàng, ghi rõ địa chỉ và giờ"
- **Thời gian:** 5 phút
- **Yêu cầu ghi chú:** ✅ Có
- **Yêu cầu ảnh:** ❌ Không

Click **"Tạo mới"**

#### Công việc 3: Lấy hàng và kiểm tra
- **Tên:** "Lấy hàng tại nhà khách và kiểm tra"
- **Danh mục:** "Tiếp nhận"
- **Mô tả:** "Nhân viên đến lấy hàng, kiểm tra ngoại quan, chụp ảnh trước mặt khách"
- **Thời gian:** 30 phút
- **Yêu cầu ghi chú:** ✅ Có
- **Yêu cầu ảnh:** ✅ Có

Click **"Tạo mới"**

#### Công việc 4: Tạo phiếu bảo hành
- **Tên:** "Tạo phiếu bảo hành chính thức"
- **Danh mục:** "Tiếp nhận"
- **Mô tả:** "Tạo service ticket trong hệ thống với đầy đủ thông tin"
- **Thời gian:** 10 phút
- **Yêu cầu ghi chú:** ❌ Không
- **Yêu cầu ảnh:** ❌ Không

Click **"Tạo mới"**

---

### Bước 2: Tạo Quy Trình

Truy cập `/workflows` và click **"+ Tạo quy trình"**

#### Thông tin cơ bản:
- **Tên:** "Tiếp nhận yêu cầu dịch vụ online"
- **Mô tả:** "Quy trình xử lý yêu cầu bảo hành từ khách hàng qua website, bao gồm xác nhận thông tin và lên lịch lấy hàng tại nhà"
- **Loại đối tượng:** Yêu cầu dịch vụ (service_request)
- **Bắt buộc tuần tự:** ✅ Có (phải làm đúng thứ tự)

#### Thêm công việc:
1. Click **"+ Thêm công việc"**
2. Chọn **"Xác nhận thông tin khách hàng"**
   - Bắt buộc: ✅
   - Hướng dẫn: "Gọi điện trong vòng 2 giờ sau khi nhận yêu cầu"
3. Click **"+ Thêm công việc"**
4. Chọn **"Lên lịch lấy hàng tại nhà khách"**
   - Bắt buộc: ✅
   - Hướng dẫn: "Ưu tiên lịch trong ngày hoặc sáng hôm sau"
5. Click **"+ Thêm công việc"**
6. Chọn **"Lấy hàng tại nhà khách và kiểm tra"**
   - Bắt buộc: ✅
   - Hướng dẫn: "Mang theo túi chống tĩnh điện và giấy biên nhận"
7. Click **"+ Thêm công việc"**
8. Chọn **"Tạo phiếu bảo hành chính thức"**
   - Bắt buộc: ✅
   - Hướng dẫn: "Scan hoặc chụp ảnh biên nhận đã ký"

Click **"Tạo quy trình"** để hoàn tất!

---

### Bước 3: Kiểm Tra Quy Trình

1. Quay lại trang `/workflows`
2. Tìm quy trình **"Tiếp nhận yêu cầu dịch vụ online"** trong danh sách
3. Click vào tên để xem chi tiết
4. Kiểm tra:
   - ✅ 4 công việc hiển thị đúng thứ tự
   - ✅ Tổng thời gian: 50 phút
   - ✅ Badge "Tuần tự" hiển thị
   - ✅ Hướng dẫn tùy chỉnh hiển thị cho mỗi công việc

---

### Bước 4: Test Quy Trình

1. Truy cập trang tạo **Yêu cầu dịch vụ mới** (tùy theo UI của bạn)
2. Điền thông tin yêu cầu dịch vụ
3. Chọn quy trình **"Tiếp nhận yêu cầu dịch vụ online"**
4. Lưu yêu cầu
5. Kiểm tra:
   - ✅ Hệ thống tự động tạo 4 công việc
   - ✅ Công việc 1 có trạng thái "Pending", các công việc khác "Blocked" (do bắt buộc tuần tự)
   - ✅ Khi hoàn thành công việc 1, công việc 2 tự động chuyển sang "Pending"

**Chúc mừng! Bạn đã tạo thành công quy trình đầu tiên!** 🎉

---

## 7. Câu Hỏi Thường Gặp

### Q1: Tôi có thể xóa công việc đã dùng trong quy trình không?

**Không nên.** Nếu công việc đang được dùng trong quy trình, việc xóa sẽ gây lỗi. Thay vào đó:
- ✅ **Vô hiệu hóa** công việc (chuyển trạng thái thành "Không kích hoạt")
- ✅ Công việc sẽ không xuất hiện khi tạo quy trình mới
- ✅ Các quy trình cũ vẫn giữ nguyên công việc này

### Q2: Quy trình có bắt buộc tuần tự hay không bắt buộc tuần tự?

**Tùy vào tính chất công việc:**

**Nên bắt buộc tuần tự khi:**
- ✅ Công việc sau phụ thuộc vào kết quả công việc trước
- ✅ Cần đảm bảo thứ tự để tránh sai sót
- ✅ Ví dụ: Phải kiểm tra lỗi → báo giá → xác nhận khách → sửa chữa

**Không cần bắt buộc tuần tự khi:**
- ✅ Các công việc độc lập, không phụ thuộc nhau
- ✅ Muốn tăng tốc bằng cách làm song song
- ✅ Ví dụ: Nhập kho - có thể nhập serial và chụp ảnh cùng lúc

### Q3: Tôi có thể thay đổi quy trình đang chạy không?

**Có, nhưng cần cẩn thận:**

**Cách 1: Sửa quy trình (chỉ ảnh hưởng phiếu mới)**
- Vào trang chi tiết quy trình → Sửa quy trình
- Các phiếu đã tạo **không bị ảnh hưởng**
- Chỉ phiếu mới tạo sau khi sửa mới áp dụng quy trình mới

**Cách 2: Chuyển đổi quy trình (cho phiếu đang xử lý)**
- Vào trang chi tiết phiếu → Chuyển đổi quy trình
- Chọn quy trình mới
- Nhập lý do (bắt buộc)
- Các công việc đã hoàn thành **không bị xóa**, chỉ thêm công việc mới từ quy trình mới

### Q4: Làm sao để biết quy trình nào đang được dùng nhiều nhất?

**Hiện tại chưa có báo cáo tự động**, nhưng bạn có thể:
1. Vào trang danh sách **Quy trình**
2. Xem số lượng công việc và tần suất tạo phiếu
3. Hoặc hỏi dev team tạo báo cáo thống kê

**Trong tương lai:** Hệ thống sẽ có dashboard hiển thị:
- Quy trình được dùng nhiều nhất
- Thời gian hoàn thành trung bình
- Tỷ lệ hoàn thành công việc

### Q5: Tôi có thể tạo quy trình con (sub-workflow) không?

**Hiện tại chưa hỗ trợ**, nhưng bạn có thể:
- Tạo nhiều quy trình riêng biệt
- Dùng "Hướng dẫn tùy chỉnh" để tham chiếu quy trình khác
- Ví dụ: Trong công việc "Sửa chữa card", hướng dẫn: "Xem quy trình chi tiết tại trang Wiki"

### Q6: Công việc có thời hạn (deadline) không?

**Có**, khi tạo phiếu, hệ thống tự động tính:
- **Due date của công việc** = Thời gian ước tính + buffer
- Nếu quá hạn, hệ thống sẽ **highlight đỏ** và thông báo cho manager

**Ví dụ:**
- Công việc "Test stress 30 phút" - thời gian ước tính: 35 phút
- Nếu technician bắt đầu lúc 9:00, due date là 9:35
- Nếu 10:00 chưa xong → Hệ thống cảnh báo "Quá hạn"

### Q7: Có thể gán công việc cho nhiều người không?

**Hiện tại chỉ gán cho 1 người**, nhưng bạn có thể:
- Tạo nhiều công việc giống nhau cho nhiều người
- Hoặc dùng "Công việc chung" mà ai cũng có thể làm (không gán cụ thể)

**Ví dụ:**
- Công việc "Nhập serial" - không gán người cụ thể
- Bất kỳ technician nào rảnh cũng có thể vào làm

### Q8: Làm sao để theo dõi tiến độ tất cả phiếu?

**Truy cập Dashboard:**
1. Vào trang chủ Dashboard (`/dashboard`)
2. Xem các widget:
   - **Phiếu đang xử lý** - Số phiếu đang làm
   - **Công việc quá hạn** - Danh sách công việc chậm tiến độ
   - **Hiệu suất team** - Số công việc hoàn thành trong ngày/tuần

**Hoặc xem theo từng phiếu:**
- Vào trang danh sách phiếu
- Filter theo trạng thái: "Đang xử lý"
- Xem progress bar để biết % hoàn thành

---

## 8. Best Practices

### 8.1. Thiết Kế Công Việc (Tasks)

#### ✅ NÊN:
- **Tên ngắn gọn, dễ hiểu** - "Kiểm tra nguồn" thay vì "Kiểm tra nguồn điện của card đồ họa bằng đồng hồ vạn năng"
- **Mô tả chi tiết trong phần mô tả** - Giải thích cụ thể cách làm, công cụ cần dùng
- **Ước tính thời gian thực tế** - Dựa trên kinh nghiệm thực tế, không quá lạc quan
- **Yêu cầu ghi chú cho công việc quan trọng** - Để có audit trail
- **Yêu cầu ảnh cho công việc dễ tranh cãi** - Bằng chứng hình ảnh tránh khiếu nại
- **Phân loại danh mục rõ ràng** - "Kiểm tra", "Sửa chữa", "Kiểm định", "Quản lý kho"

#### ❌ KHÔNG NÊN:
- **Tên quá dài** - Khó đọc trong bảng
- **Tên quá chung chung** - "Làm việc", "Xử lý" không mô tả rõ làm gì
- **Mô tả quá ngắn** - Kỹ thuật viên không biết làm thế nào
- **Thời gian không thực tế** - Quá nhanh (gây áp lực) hoặc quá chậm (lãng phí)
- **Yêu cầu ảnh cho mọi công việc** - Tốn thời gian, không cần thiết

### 8.2. Thiết Kế Quy Trình (Workflows)

#### ✅ NÊN:
- **Tên mô tả rõ mục đích và phạm vi** - "Bảo hành ZOTAC RTX 4090" thay vì "Quy trình 1"
- **Bắt đầu bằng công việc kiểm tra/chụp ảnh** - Để có bằng chứng ban đầu
- **Kết thúc bằng công việc kiểm tra/chụp ảnh** - Để xác nhận hoàn thành
- **Sắp xếp công việc theo logic thực tế** - Theo thứ tự làm việc tự nhiên
- **Đánh dấu bắt buộc cho công việc quan trọng** - Không cho phép bỏ qua
- **Dùng hướng dẫn tùy chỉnh khi cần** - Ghi chú riêng cho công việc trong context này
- **Review và cập nhật định kỳ** - Quy trình cần được cải tiến theo thời gian

#### ❌ KHÔNG NÊN:
- **Quá nhiều công việc trong một quy trình** - Khó quản lý, nên tách thành nhiều quy trình nhỏ
- **Quá ít công việc** - Không đủ chi tiết để kiểm soát chất lượng
- **Bắt buộc tuần tự khi không cần** - Giảm hiệu suất, kéo dài thời gian
- **Không bắt buộc tuần tự khi cần** - Dễ sai sót, làm sai thứ tự
- **Tạo quá nhiều quy trình tương tự** - Khó quản lý, nên dùng chung và tùy chỉnh hướng dẫn

### 8.3. Quản Lý Hàng Ngày

#### ✅ NÊN:
- **Review dashboard mỗi sáng** - Xem công việc quá hạn, phiếu tồn đọng
- **Phân công công việc rõ ràng** - Assign cho từng technician cụ thể
- **Theo dõi tiến độ realtime** - Kiểm tra progress bar trong ngày
- **Thông báo khi có thay đổi quy trình** - Để team không bị bối rối
- **Thu thập feedback từ team** - Cải tiến quy trình dựa trên ý kiến thực tế
- **Backup dữ liệu định kỳ** - Tránh mất dữ liệu quy trình quan trọng

#### ❌ KHÔNG NÊN:
- **Thay đổi quy trình đột ngột** - Gây lộn xộn, team không kịp thích nghi
- **Không training khi có quy trình mới** - Team làm sai, giảm chất lượng
- **Bỏ qua công việc quá hạn** - Dẫn đến delay tích lũy
- **Không review định kỳ** - Quy trình lỗi thời, không phù hợp thực tế

### 8.4. Tối Ưu Hiệu Suất

#### Mẹo 1: Dùng Quy Trình Mẫu
Tạo quy trình mẫu (template workflow) cho từng loại sản phẩm:
- Một quy trình cho "Card đồ họa"
- Một quy trình cho "SSD NVMe"
- Một quy trình cho "Mini PC"
- → Dễ nhân rộng, thống nhất

#### Mẹo 2: Gom Nhóm Công Việc Tương Tự
Thay vì:
- "Kiểm tra nguồn RTX 4090"
- "Kiểm tra nguồn RTX 4080"
- "Kiểm tra nguồn RTX 4070"

Dùng:
- "Kiểm tra nguồn card đồ họa" (dùng chung)
- Hướng dẫn tùy chỉnh trong quy trình nếu cần

#### Mẹo 3: Dùng Thời Gian Ước Tính Thực Tế
- Thu thập dữ liệu thời gian thực tế từ hệ thống
- Điều chỉnh ước tính cho chính xác hơn
- Ví dụ: Nếu "Test stress" trung bình mất 40 phút (không phải 30 phút như ước tính ban đầu) → Cập nhật lại

#### Mẹo 4: Tạo Checklist Trong Mô Tả
Trong mô tả công việc, dùng markdown checklist:

```
**Công việc:** Kiểm tra card đồ họa trước sửa chữa

**Mô tả:**
- [ ] Kiểm tra ngoại quan (vết xước, cong vênh)
- [ ] Kiểm tra quạt tản nhiệt quay được
- [ ] Kiểm tra keo tản nhiệt chưa khô
- [ ] Kiểm tra mạch nguồn không có vết cháy
- [ ] Chụp ảnh 4 góc card
```

→ Kỹ thuật viên có checklist rõ ràng, không bỏ sót

---

## 9. Kết Luận

### Những Điểm Chính Cần Nhớ

1. **Task (Công việc)** = Đơn vị nhỏ nhất, có thể tái sử dụng
2. **Workflow (Quy trình)** = Chuỗi Tasks được sắp xếp có thứ tự
3. **Tuần tự vs Không tuần tự** = Tùy vào tính chất công việc
4. **Vô hiệu hóa thay vì xóa** = Giữ lại lịch sử
5. **Review và cải tiến** = Quy trình cần được cập nhật theo thực tế

### Bước Tiếp Theo

Bây giờ bạn đã hiểu cách quản lý công việc và quy trình, hãy:

1. ✅ **Xác định các quy trình quan trọng** của trung tâm bạn
2. ✅ **Tạo thư viện Tasks** - Liệt kê tất cả công việc thường làm
3. ✅ **Tạo 2-3 Workflows đầu tiên** - Bắt đầu với quy trình đơn giản
4. ✅ **Test và thu thập feedback** - Hỏi ý kiến team
5. ✅ **Cải tiến dần dần** - Điều chỉnh theo thực tế

### Hỗ Trợ

Nếu có câu hỏi hoặc cần hỗ trợ:
- 📧 **Email:** support@sstc.vn
- 📞 **Hotline:** 1900-xxxx
- 📚 **Tài liệu thêm:** `/docs/architecture/`

---

**Chúc bạn thành công trong việc xây dựng quy trình làm việc hiệu quả!** 🚀

---

_Tài liệu được tạo bởi: SSTC Service Center - Hệ thống quản lý trung tâm bảo hành_
_Phiên bản: 1.0_
_Cập nhật lần cuối: 2025-11-05_
