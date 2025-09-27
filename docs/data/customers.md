# Cấu trúc dữ liệu khách hàng (Customer Data Structure)

## Mô tả tổng quan
Tài liệu này mô tả cấu trúc dữ liệu đơn giản của khách hàng trong hệ thống service center.

## Các trường dữ liệu chính

### 1. Thông tin cơ bản (Basic Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Unique | Mô tả |
|--------|-------------|----------|--------|-------|
| `id` | UUID | ✅ | ✅ | ID tự động generate bởi Supabase |
| `name` | String | ✅ | ❌ | Tên khách hàng |
| `phone` | String | ✅ | ✅ | Số điện thoại (unique) |
| `email` | String | ❌ | ❌ | Email khách hàng |
| `address` | Text | ❌ | ❌ | Địa chỉ khách hàng |

### 2. Metadata và audit (Metadata & Audit)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `created_at` | Timestamp | ✅ | Thời gian tạo |
| `updated_at` | Timestamp | ✅ | Thời gian cập nhật cuối |

## Ví dụ JSON Schema

```json
{
  "id": "customer-uuid-001",
  "name": "Nguyễn Văn A",
  "phone": "0123456789",
  "email": "nguyenvana@example.com",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Ghi chú quan trọng

1. **Indexing**: Các trường `id`, `phone` nên được index để tìm kiếm nhanh
2. **Validation**: 
   - Phone phải unique
   - Email phải đúng định dạng email (nếu có)
3. **Relationships**: Liên kết với bảng service_tickets thông qua customer_id
4. **Search**: Hỗ trợ tìm kiếm theo tên và số điện thoại để nhanh chóng tìm khách hàng khi tạo phiếu dịch vụ