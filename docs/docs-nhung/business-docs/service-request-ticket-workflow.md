# Quy trình Phiếu Yêu Cầu & Phiếu Dịch Vụ

## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Mối quan hệ giữa Phiếu Yêu Cầu và Phiếu Dịch Vụ](#2-mối-quan-hệ-giữa-phiếu-yêu-cầu-và-phiếu-dịch-vụ)
- [3. Vòng đời Phiếu Yêu Cầu](#3-vòng-đời-phiếu-yêu-cầu)
- [4. Vòng đời Phiếu Dịch Vụ](#4-vòng-đời-phiếu-dịch-vụ)
- [5. Luồng xử lý chi tiết](#5-luồng-xử-lý-chi-tiết)
- [6. Thông tin tài chính](#6-thông-tin-tài-chính)
- [7. Kết quả dịch vụ](#7-kết-quả-dịch-vụ)
- [8. Email thông báo tự động](#8-email-thông-báo-tự-động)
- [9. Phân quyền](#9-phân-quyền)

---

## 1. Tổng quan

Hệ thống quản lý dịch vụ hoạt động theo mô hình **tự động hóa cao** gồm 2 loại phiếu chính:

- **Phiếu Yêu Cầu (Service Request)**: Đầu vào từ khách hàng hoặc nhân viên, mô tả nhu cầu sửa chữa/bảo hành cho một hoặc nhiều sản phẩm.
- **Phiếu Dịch Vụ (Service Ticket)**: Phiếu xử lý kỹ thuật cho từng sản phẩm riêng lẻ, được tạo tự động từ phiếu yêu cầu.

Khi sản phẩm được nhận, hệ thống **tự động tạo** phiếu dịch vụ cho từng sản phẩm. Khi tất cả phiếu dịch vụ hoàn tất, phiếu yêu cầu **tự động đóng**.

---

## 2. Mối quan hệ giữa Phiếu Yêu Cầu và Phiếu Dịch Vụ

- **1 Phiếu Yêu Cầu → Nhiều Phiếu Dịch Vụ** (quan hệ 1:N)
- Ví dụ: Khách gửi 1 yêu cầu với 3 sản phẩm → hệ thống tự tạo 3 phiếu dịch vụ
- Liên kết qua bảng `service_request_items` (mỗi item liên kết đến 1 phiếu dịch vụ)
- Mỗi phiếu dịch vụ sau khi tạo sẽ hoạt động **độc lập** (có trạng thái, chi phí, kỹ thuật viên riêng)

**Sơ đồ quan hệ:**

```
service_requests (1)
    │
    ├── service_request_items (N)
    │       │
    │       └── service_tickets (1 per item)
    │               │
    │               ├── service_ticket_parts (N)
    │               └── comments / attachments
    │
    └── tracking_token (để khách theo dõi)
```

---

## 3. Vòng đời Phiếu Yêu Cầu

### 3.1. Sơ đồ trạng thái

```
                    ┌──────────┐
                    │  draft    │  (Nháp - chỉ nhân viên tạo)
                    └─────┬────┘
                          │ Gửi phiếu
                          ▼
┌──────────────┐   ┌────────────┐
│ Khách gửi    │──▶│ submitted  │  (Đã gửi - chờ xem xét)
│ qua web      │   └──────┬─────┘
└──────────────┘          │
                          ▼
                 ┌─────────────┐
                 │  pickingup   │  (Đang đón hàng - nếu chưa nhận SP)
                 └───────┬─────┘
                         │ Nhận sản phẩm
                         ▼
                 ┌─────────────┐
                 │  received    │  (Đã nhận sản phẩm)
                 └───────┬─────┘
                         │ [Tự động] Tạo phiếu dịch vụ
                         ▼
                 ┌─────────────┐
                 │ processing   │  (Đang xử lý)
                 └───────┬─────┘
                         │ [Tự động] Khi tất cả ticket hoàn thành
                         ▼
                 ┌─────────────┐
                 │  completed   │  (Hoàn thành)
                 └─────────────┘

    Bất kỳ trạng thái nào (trừ completed) → cancelled (Hủy - bắt buộc nhập lý do)
```

### 3.2. Bảng mô tả trạng thái

| Trạng thái   | Nhãn tiếng Việt | Mô tả                                              |
| ------------- | ---------------- | --------------------------------------------------- |
| `draft`       | Nháp             | Nhân viên tạo nhưng chưa gửi, có thể chỉnh sửa    |
| `submitted`   | Đã gửi           | Đã gửi, chờ nhân viên xem xét                      |
| `pickingup`   | Đang đón hàng    | Chờ nhận sản phẩm từ khách hàng                     |
| `received`    | Đã nhận SP       | Đã nhận sản phẩm, kích hoạt tạo phiếu dịch vụ      |
| `processing`  | Đang xử lý       | Các phiếu dịch vụ đang được thực hiện               |
| `completed`   | Hoàn thành       | Tất cả phiếu dịch vụ đã hoàn tất (trạng thái cuối) |
| `cancelled`   | Đã hủy           | Bị từ chối hoặc khách hủy (trạng thái cuối)         |

### 3.3. Cơ chế tự động

- **Tự động tạo phiếu dịch vụ**: Khi `receipt_status` chuyển sang `received`, DB trigger tự tạo phiếu dịch vụ cho từng sản phẩm trong yêu cầu.
- **Tự động hoàn thành**: Khi tất cả phiếu dịch vụ ở trạng thái `completed` hoặc `cancelled`, phiếu yêu cầu tự động chuyển sang `completed`.
- **Workflow (nếu có)**: Nếu phiếu yêu cầu có gắn workflow kiểm tra, hệ thống sẽ đợi tất cả task trong workflow hoàn thành trước khi tạo phiếu dịch vụ.

---

## 4. Vòng đời Phiếu Dịch Vụ

### 4.1. Sơ đồ trạng thái

```
┌───────────┐
│  pending    │  (Chờ xử lý)
└─────┬─────┘
      │ Phân công kỹ thuật viên & bắt đầu
      ▼
┌────────────────┐
│  in_progress    │  (Đang sửa chữa)
└───────┬────────┘
        │ Hoàn tất sửa chữa
        ▼
┌─────────────────────┐
│  ready_for_pickup    │  (Sẵn sàng bàn giao)
└──────────┬──────────┘
           │ Giao/trả hàng cho khách
           ▼
┌───────────────┐
│  completed     │  (Hoàn thành)
└───────────────┘

Bất kỳ trạng thái nào (trừ completed) → cancelled (Hủy bỏ)
```

### 4.2. Quy tắc chuyển trạng thái

| Trạng thái hiện tại   | Có thể chuyển sang               |
| ---------------------- | -------------------------------- |
| `pending`              | `in_progress`, `cancelled`       |
| `in_progress`          | `ready_for_pickup`, `cancelled`  |
| `ready_for_pickup`     | `completed`, `cancelled`         |
| `completed`            | _(trạng thái cuối)_             |
| `cancelled`            | _(trạng thái cuối)_             |

### 4.3. Thông tin trên Phiếu Dịch Vụ

- **Mã phiếu**: Tự sinh theo định dạng `SV-YYYY-NNN` (VD: `SV-2026-001`)
- **Khách hàng**: Tên, số điện thoại, email
- **Sản phẩm**: Thông tin sản phẩm + serial number
- **Mô tả vấn đề**: Lỗi cần sửa chữa
- **Mức độ ưu tiên**: Low / Normal / High / Urgent
- **Loại bảo hành**: Bảo hành (warranty) / Có phí (paid) / Thiện chí (goodwill)
- **Kỹ thuật viên**: Người được phân công xử lý
- **Phương thức giao**: Đến lấy (pickup) / Giao hàng (delivery)

---

## 5. Luồng xử lý chi tiết

### 5.1. Khách hàng gửi yêu cầu (Cổng công khai)

1. Khách truy cập trang **Gửi yêu cầu dịch vụ** → nhập thông tin cá nhân + danh sách sản phẩm cần sửa
2. Hệ thống xử lý:
   - Kiểm tra serial number hợp lệ (phải tồn tại trong kho `customer_installed`)
   - Tạo phiếu yêu cầu + các mục sản phẩm
   - Tự động nhập kho `in_service` (chuyển SP vào kho dịch vụ)
   - Gửi email xác nhận cho khách
3. Khách nhận **mã theo dõi** (VD: `SR-XXXXXXXXXXXX`) để tra cứu trạng thái

### 5.2. Nhân viên tạo yêu cầu (Cổng nội bộ)

1. Nhân viên tạo phiếu nháp → lưu thông tin khách + sản phẩm
2. Có thể chỉnh sửa phiếu nháp nhiều lần
3. Khi sẵn sàng → gửi phiếu (chuyển từ `draft` sang `submitted`)
4. Hệ thống xử lý tương tự như khách gửi

### 5.3. Nhân viên tiếp nhận xử lý yêu cầu

1. Xem danh sách phiếu yêu cầu đang chờ
2. Xem chi tiết phiếu → quyết định:
   - **Chấp nhận**: Cập nhật trạng thái → `received` → hệ thống **tự động tạo phiếu dịch vụ**
   - **Từ chối**: Hủy phiếu → nhập lý do → gửi email thông báo cho khách

### 5.4. Kỹ thuật viên xử lý phiếu dịch vụ

1. Được phân công phiếu dịch vụ
2. Bắt đầu xử lý: trạng thái → `in_progress`
3. Trong quá trình sửa:
   - Thêm linh kiện sử dụng
   - Cập nhật phí dịch vụ, phí chẩn đoán
   - Đính kèm ghi chú / hình ảnh
4. Hoàn tất sửa chữa: trạng thái → `ready_for_pickup`
5. Bàn giao cho khách: trạng thái → `completed`

### 5.5. Tự động hoàn thành yêu cầu

- Khi **tất cả** phiếu dịch vụ của một yêu cầu đều ở trạng thái `completed` hoặc `cancelled`
- Phiếu yêu cầu tự động chuyển sang `completed`

---

## 6. Thông tin tài chính

Mỗi phiếu dịch vụ theo dõi chi phí riêng biệt:

| Khoản mục          | Mô tả                                  |
| ------------------- | --------------------------------------- |
| `service_fee`       | Phí dịch vụ sửa chữa                   |
| `diagnosis_fee`     | Phí chẩn đoán / kiểm tra               |
| `parts_total`       | Tổng chi phí linh kiện                  |
| `discount_amount`   | Giảm giá                                |
| **`total_cost`**    | = service_fee + diagnosis_fee + parts_total - discount_amount |

- `total_cost` được **tự động tính** bởi database
- Linh kiện được quản lý qua bảng `service_ticket_parts` (nhiều linh kiện cho 1 phiếu)

---

## 7. Kết quả dịch vụ

Mỗi phiếu dịch vụ khi hoàn thành sẽ có một trong các kết quả:

| Kết quả                  | Mô tả                                                              |
| ------------------------ | ------------------------------------------------------------------- |
| `repaired`               | Đã sửa chữa thành công                                             |
| `warranty_replacement`   | Thay thế bảo hành (cần chỉ định sản phẩm thay thế)                |
| `unrepairable`           | Không thể sửa chữa                                                 |

---

## 8. Email thông báo tự động

| Sự kiện                      | Người nhận | Nội dung                             |
| ---------------------------- | ---------- | ------------------------------------ |
| Khách gửi yêu cầu           | Khách hàng | Xác nhận đã nhận yêu cầu + mã theo dõi |
| Nhân viên nhận sản phẩm      | Khách hàng | Thông báo sản phẩm đã được tiếp nhận |
| Từ chối yêu cầu             | Khách hàng | Thông báo hủy kèm lý do              |
| Tạo phiếu dịch vụ           | Khách hàng | Thông báo bắt đầu xử lý              |
| Hoàn thành phiếu dịch vụ    | Khách hàng | Thông báo hoàn tất, sẵn sàng bàn giao |

---

## 9. Phân quyền

| Vai trò                 | Quyền hạn                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| **Khách hàng (Public)** | Gửi yêu cầu, theo dõi trạng thái bằng mã theo dõi               |
| **Lễ tân (Reception)**  | Xem tất cả yêu cầu, quản lý phiếu nháp, cập nhật trạng thái     |
| **Kỹ thuật viên**       | Xem và cập nhật phiếu dịch vụ được phân công                     |
| **Quản lý (Manager)**   | Toàn quyền yêu cầu + phiếu dịch vụ                              |
| **Admin**               | Toàn quyền hệ thống + báo cáo                                    |

---

## Mã định danh

- **Phiếu Yêu Cầu**: `SR-XXXXXXXXXXXX` (12 ký tự ngẫu nhiên)
- **Phiếu Dịch Vụ**: `SV-YYYY-NNN` (năm + số thứ tự tăng dần)
