# Cấu trúc dữ liệu phiếu dịch vụ (Service Ticket Data Structure)

## Mô tả tổng quan
Tài liệu này mô tả cấu trúc dữ liệu của phiếu dịch vụ trong hệ thống service center. Phiếu dịch vụ quản lý toàn bộ quy trình tiếp nhận và sửa chữa sản phẩm từ khách hàng.

## Các trường dữ liệu chính

### 1. Thông tin cơ bản (Basic Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `id` | UUID | ✅ | ID tự động generate bởi Supabase |
| `ticket_number` | String | ✅ | Mã số phiếu dịch vụ (unique) |
| `customer_id` | UUID | ✅ | ID khách hàng (khóa ngoại tới customers) |
| `product_id` | UUID | ✅ | ID sản phẩm (khóa ngoại tới products) |
| `issue_description` | Text | ✅ | Mô tả vấn đề/lỗi của sản phẩm |
| `status` | Enum | ✅ | Trạng thái phiếu dịch vụ |
| `priority_level` | Enum | ❌ | Mức độ ưu tiên (low/normal/high/urgent) |
| `warranty_type` | Enum | ❌ | Loại bảo hành (warranty/paid/goodwill) |

### 2. Thông tin chi phí (Cost Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `service_fee` | Decimal(10,2) | ✅ | Phí dịch vụ (VND) |
| `diagnosis_fee` | Decimal(10,2) | ❌ | Phí kiểm tra/chẩn đoán (VND) - Mặc định 0 |
| `discount_amount` | Decimal(10,2) | ❌ | Số tiền giảm giá (VND) - Mặc định 0 |
| `total_cost` | Decimal(10,2) | ✅ | Tổng chi phí = parts_total + service_fee + diagnosis_fee - discount_amount |

### 3. Thông tin linh kiện sử dụng (Parts Used)

**Lưu ý**: Thông tin linh kiện sử dụng được quản lý trong bảng `service_ticket_parts`. Xem chi tiết tại [service-ticket-parts.md](./service-ticket-parts.md).

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `parts_total` | Decimal(10,2) | ✅ | Tổng giá linh kiện (tính từ bảng service_ticket_parts) |

### 4. Thông tin thời gian (Timeline Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `received_at` | Timestamp | ✅ | Thời gian tiếp nhận |
| `estimated_completion` | Timestamp | ❌ | Thời gian hoàn thành dự kiến |
| `completed_at` | Timestamp | ❌ | Thời gian hoàn thành thực tế |

### 5. Metadata và audit (Metadata & Audit)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `created_at` | Timestamp | ✅ | Thời gian tạo |
| `updated_at` | Timestamp | ✅ | Thời gian cập nhật cuối |
| `created_by` | UUID | ❌ | ID nhân viên tạo phiếu (khóa ngoại tới profiles) |
| `assigned_to` | UUID | ❌ | ID kỹ thuật viên được giao (khóa ngoại tới profiles) |

## Ví dụ JSON Schema

```json
{
  "id": "ticket-uuid-001",
  "ticket_number": "SV-2024-001",
  "customer_id": "customer-uuid-001",
  "product_id": "product-uuid-iphone15promax",
  "issue_description": "Màn hình bị vỡ, không hiển thị được",
  "status": "in_progress",
  "priority_level": "high",
  "warranty_type": "paid",
  "service_fee": 500000,
  "diagnosis_fee": 100000,
  "discount_amount": 50000,
  "parts_total": 9500000,
  "total_cost": 10050000,
  "received_at": "2024-01-15T09:00:00Z",
  "estimated_completion": "2024-01-15T17:00:00Z",
  "completed_at": null,
  "created_at": "2024-01-15T09:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z",
  "created_by": "user-uuid-001",
  "assigned_to": "technician-uuid-001"
}
```

## Enum Values

### Status
- `pending` - Chờ xử lý
- `in_progress` - Đang sửa chữa
- `completed` - Hoàn thành
- `cancelled` - Hủy bỏ

### Priority Level
- `low` - Thấp
- `normal` - Bình thường (mặc định)
- `high` - Cao
- `urgent` - Khẩn cấp

### Warranty Type
- `warranty` - Bảo hành
- `paid` - Trả phí
- `goodwill` - Thiện chí

## Ghi chú quan trọng

1. **Indexing**: Các trường `id`, `ticket_number`, `customer_id`, `product_id`, `status`, `assigned_to`, `priority_level` nên được index
2. **Validation**: 
   - `ticket_number` phải unique
   - `total_cost` = `parts_total` + `service_fee` + `diagnosis_fee` - `discount_amount`
   - `parts_total` được tính từ bảng `service_ticket_parts`
   - `diagnosis_fee` và `discount_amount` mặc định là 0
3. **Relationships**: 
   - Liên kết với bảng customers thông qua `customer_id`
   - Liên kết với bảng products thông qua `product_id`
   - Liên kết với bảng service_ticket_parts thông qua `ticket_id` (1-nhiều)
   - Liên kết với bảng profiles thông qua `created_by`, `assigned_to`
4. **Business Logic**: 
   - `parts_total` được tính tự động từ bảng `service_ticket_parts`
   - `total_cost` được tự động tính từ các trường chi phí
   - Trigger đồng bộ `parts_total` từ bảng `service_ticket_parts`
5. **Default Values**:
   - `priority_level`: "normal"
   - `diagnosis_fee`: 0
   - `discount_amount`: 0
6. **Status Management**: Quản lý trạng thái theo quy trình nghiệp vụ từ tiếp nhận đến hoàn thành