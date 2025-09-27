# Cấu trúc dữ liệu linh kiện sử dụng trong phiếu dịch vụ (Service Ticket Parts Data Structure)

## Mô tả tổng quan
Tài liệu này mô tả cấu trúc dữ liệu của bảng `service_ticket_parts` - bảng trung gian để quản lý các linh kiện được sử dụng trong từng phiếu dịch vụ.

## Các trường dữ liệu chính

### 1. Thông tin cơ bản (Basic Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `id` | UUID | ✅ | ID tự động generate bởi Supabase |
| `ticket_id` | UUID | ✅ | ID phiếu dịch vụ (khóa ngoại tới service_tickets) |
| `part_id` | UUID | ✅ | ID linh kiện (khóa ngoại tới parts) |
| `quantity` | Integer | ✅ | Số lượng linh kiện sử dụng - Mặc định 1 |
| `unit_price` | Decimal(10,2) | ✅ | Giá đơn vị tại thời điểm sử dụng (VND) |
| `total_price` | Decimal(10,2) | ✅ | Thành tiền = quantity * unit_price |

### 2. Metadata và audit (Metadata & Audit)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `created_at` | Timestamp | ✅ | Thời gian thêm linh kiện |
| `updated_at` | Timestamp | ✅ | Thời gian cập nhật cuối |
| `created_by` | UUID | ❌ | ID người thêm linh kiện (khóa ngoại tới profiles) |

## Ví dụ JSON Schema

```json
{
  "id": "service-ticket-part-uuid-001",
  "ticket_id": "ticket-uuid-001",
  "part_id": "part-uuid-001",
  "quantity": 1,
  "unit_price": 9500000,
  "total_price": 9500000,
  "created_at": "2024-01-15T14:30:00Z",
  "updated_at": "2024-01-15T14:30:00Z",
  "created_by": "technician-uuid-001"
}
```

## Ví dụ nhiều linh kiện cho một phiếu dịch vụ

```json
[
  {
    "id": "service-ticket-part-uuid-001",
    "ticket_id": "ticket-uuid-001",
    "part_id": "part-uuid-screen",
    "quantity": 1,
    "unit_price": 9500000,
    "total_price": 9500000,
    "created_at": "2024-01-15T14:30:00Z"
  },
  {
    "id": "service-ticket-part-uuid-002", 
    "ticket_id": "ticket-uuid-001",
    "part_id": "part-uuid-battery",
    "quantity": 1,
    "unit_price": 1200000,
    "total_price": 1200000,
    "created_at": "2024-01-15T15:00:00Z"
  }
]
```

## Relationships và Constraints

### Foreign Keys:
- `ticket_id` → `service_tickets.id`
- `part_id` → `parts.id`
- `created_by` → `profiles.user_id`

### Unique Constraints:
- Composite unique constraint trên (`ticket_id`, `part_id`) để tránh trùng lặp linh kiện trong cùng phiếu dịch vụ

## Query Examples

### Lấy tất cả linh kiện của một phiếu dịch vụ:
```sql
SELECT stp.*, p.name as part_name, p.image_url
FROM service_ticket_parts stp
JOIN parts p ON stp.part_id = p.id
WHERE stp.ticket_id = 'ticket-uuid-001'
ORDER BY stp.created_at;
```

### Tính tổng giá linh kiện của một phiếu:
```sql
SELECT ticket_id, SUM(total_price) as parts_total
FROM service_ticket_parts
WHERE ticket_id = 'ticket-uuid-001'
GROUP BY ticket_id;
```

### Thống kê linh kiện được sử dụng nhiều nhất:
```sql
SELECT p.name, SUM(stp.quantity) as total_used
FROM service_ticket_parts stp
JOIN parts p ON stp.part_id = p.id
GROUP BY p.id, p.name
ORDER BY total_used DESC
LIMIT 10;
```

## Ghi chú quan trọng

1. **Indexing**: 
   - Index trên `ticket_id` để query nhanh theo phiếu dịch vụ
   - Index trên `part_id` để thống kê theo linh kiện
   - Composite index trên (`ticket_id`, `part_id`) nếu cần unique constraint

2. **Validation**: 
   - `quantity` phải > 0
   - `unit_price` phải > 0
   - `total_price` = `quantity` * `unit_price`

3. **Business Logic**: 
   - Tự động cập nhật `parts_total` trong bảng `service_tickets` khi có thay đổi
   - Lưu `unit_price` tại thời điểm sử dụng để đảm bảo tính nhất quán

4. **Triggers**: 
   - Trigger tự động tính lại `parts_total` trong bảng tickets
   - Trigger validation đảm bảo `total_price` = `quantity` * `unit_price`

5. **Default Values**:
   - `quantity`: 1

6. **Permissions**: 
   - Technician được assign và admin có quyền thêm/sửa/xóa
   - Audit log để theo dõi thay đổi

## Tích hợp với bảng service_tickets

Bảng `service_ticket_parts` tích hợp với bảng `service_tickets` thông qua:

### Trường liên kết:
- `parts_total` trong `service_tickets` được tự động tính từ `service_ticket_parts`

### Query tính toán parts_total:
```sql
SELECT ticket_id, SUM(total_price) as parts_total
FROM service_ticket_parts
WHERE ticket_id = 'ticket-uuid-001'
GROUP BY ticket_id;
```