# Luồng phiếu kho trong nghiệp vụ bảo hành

## Khái niệm cơ bản

### Ba loại phiếu kho

| Phiếu | Bản chất | Tồn kho |
|---|---|---|
| **Phiếu nhập kho** | Hàng đi vào trung tâm từ bên ngoài | Tăng |
| **Phiếu xuất kho** | Hàng đi ra khỏi trung tâm ra bên ngoài | Giảm |
| **Phiếu chuyển kho** | Hàng di chuyển giữa các kho nội bộ | Không đổi (tổng) |

### Kho ảo (Virtual Warehouse)

Kho ảo là đơn vị quản lý tồn kho trên hệ thống, không tương ứng với vị trí vật lý cụ thể. Dùng để theo dõi **trạng thái** hoặc **quyền sở hữu** của hàng hóa.

#### Phân loại kho ảo theo cách quản lý tồn kho

Hệ thống có 2 loại kho ảo:

**1. Kho quản lý tồn kho vật lý** (Physical Stock Warehouses)
- Theo dõi số lượng thực tế của hàng hóa
- Khi xuất/nhập sẽ trừ/cộng số lượng tồn kho
- Bao gồm: `main` (kho chính), `warranty_stock` (kho bảo hành), `in_service` (kho đang sửa chữa)

**2. Kho theo dõi vị trí/trạng thái** (Location-Only Warehouses)
- Chỉ đánh dấu sản phẩm đang ở đâu hoặc có trạng thái gì
- **KHÔNG** theo dõi số lượng tồn kho (stock count = 0 hoặc không có record)
- Bao gồm: `customer_installed` (kho hàng bán), `dead_stock` (kho hàng hỏng), `rma_staging` (kho chờ RMA)

#### Các kho ảo trong hệ thống

| Kho ảo | Loại | Mô tả |
|---|---|---|
| **Kho hàng bán** (customer_installed) | Vị trí | Hàng đã bán, đang ở phía khách hàng. Đại diện cho nghĩa vụ bảo hành của trung tâm |
| **Kho đang sửa chữa** (in_service) | Vật lý | Hàng đang được kiểm tra / sửa chữa tại trung tâm |
| **Kho hàng hỏng** (dead_stock) | Vị trí | Hàng đã xác nhận lỗi, chờ xử lý tiếp (RMA, hủy...) |
| **Kho bảo hành** (warranty_stock) | Vật lý | Hàng mới dành cho đổi trả bảo hành |
| **Kho chính** (main) | Vật lý | Kho lưu trữ hàng hóa chính |
| **Kho chờ RMA** (rma_staging) | Vị trí | Hàng đã xuất để gửi bảo hành hãng |

### Traceability (Truy vết nguồn gốc)

Các phiếu kho có thể được liên kết với yêu cầu dịch vụ gốc qua field `request_id`:
- **Phiếu nhập kho** (`stock_receipts.request_id`): Link về service request khi khách trả hàng về trung tâm
- **Phiếu xuất kho** (`stock_issues.request_id`): Link về service request khi xuất hàng thay thế cho khách

Điều này giúp:
- Truy vết được phiếu kho nào được tạo tự động từ service request nào
- Dễ dàng tra cứu lịch sử xử lý của một yêu cầu dịch vụ
- Báo cáo và phân tích luồng hàng hóa theo từng case

## Luồng: Đổi trả bảo hành (khách mang hàng lỗi đến, nhận hàng mới)

### Tiền đề

- Khách hàng đã mua sản phẩm từ trung tâm (sản phẩm đang nằm trong "Kho hàng bán")
- Sản phẩm còn trong thời hạn bảo hành
- Sản phẩm được xác nhận lỗi và đủ điều kiện đổi mới

### Flow

```
Kho hàng bán ──(nhập kho)──▶ Kho đang sửa chữa ──(chuyển kho)──▶ Kho hàng hỏng
                                                                        │
Kho bảo hành ──(xuất kho)──▶ Kho hàng bán                              │
                                                                   (xử lý tiếp)
```

### Chi tiết từng bước

| Bước | Sự kiện | Phiếu | Từ | Đến |
|---|---|---|---|---|
| 1 | Khách mang hàng lỗi đến trung tâm | **Nhập kho** | Kho hàng bán | Kho đang sửa chữa |
| 2 | Kiểm tra xong, xác nhận lỗi | **Chuyển kho** | Kho đang sửa chữa | Kho hàng hỏng |
| 3 | Xuất hàng mới trả cho khách | **Xuất kho** | Kho bảo hành | Kho hàng bán |

### Giải thích

- **Bước 1 — Nhập kho**: Hàng từ phía khách (bên ngoài trung tâm) đi vào trung tâm. "Kho đang sửa chữa" tăng.
  - **Lưu ý**: "Kho hàng bán" là kho theo dõi vị trí, không theo dõi tồn kho vật lý, nên không bị trừ số lượng khi khách trả hàng về.
- **Bước 2 — Chuyển kho**: Sau khi xác nhận lỗi, hàng chuyển trạng thái nội bộ. Không có hàng vào/ra trung tâm, chỉ thay đổi phân loại.
  - "Kho đang sửa chữa" (vật lý) giảm, "Kho hàng hỏng" (vị trí) tăng.
- **Bước 3 — Xuất kho**: Hàng mới từ kho bảo hành đi ra khỏi trung tâm, giao cho khách. "Kho bảo hành" (vật lý) giảm, "Kho hàng bán" (vị trí) tăng (khách giữ sản phẩm mới, trung tâm tiếp tục có nghĩa vụ bảo hành).

### Xử lý tiếp hàng hỏng (ngoài luồng đổi trả)

Hàng trong "Kho hàng hỏng" sẽ được xử lý riêng tùy tình huống:

| Hướng xử lý | Phiếu | Từ | Đến |
|---|---|---|---|
| Gửi bảo hành hãng (RMA) | Xuất kho | Kho hàng hỏng | Kho RMA |
| Sửa được, nhập lại hàng tốt | Chuyển kho | Kho hàng hỏng | Kho hàng tốt |
| Hủy (không sửa được) | Xuất kho (hủy) | Kho hàng hỏng | (hủy) |

## Chi tiết kỹ thuật

### Xử lý tồn kho khi nhập từ kho theo dõi vị trí

Khi tạo phiếu nhập kho có nguồn gốc từ kho theo dõi vị trí (như nhập hàng từ khách), hệ thống xử lý như sau:

**Trigger `create_physical_product_on_receipt_serial`** (file: `600_stock_triggers.sql`):
1. Kiểm tra loại kho nguồn (old warehouse)
2. **Nếu là kho theo dõi vị trí** (`customer_installed`, `dead_stock`, `rma_staging`):
   - Bỏ qua việc trừ tồn kho từ kho nguồn (vì không track số lượng)
   - Chỉ cộng tồn kho vào kho đích
3. **Nếu là kho vật lý** (`main`, `warranty_stock`, `in_service`):
   - Trừ tồn kho từ kho nguồn
   - Cộng tồn kho vào kho đích

Cách xử lý này **ngăn chặn lỗi "declared_quantity_non_negative"** khi:
- Kho nguồn có stock count = 0 (hoặc không có record)
- Trigger cố gắng trừ: 0 - 1 = -1
- Constraint violation → Serial không được insert → Phiếu nhập thiếu serial

**Ví dụ thực tế**:
```
Khách trả hàng về (Bước 1 - Nhập kho):
- Nguồn: customer_installed (vị trí, không track stock)
  → Không trừ stock (skip deduction)
- Đích: in_service (vật lý, track stock)
  → Cộng stock: 10 + 1 = 11
```
