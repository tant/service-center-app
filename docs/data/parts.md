# Cấu trúc dữ liệu linh kiện (Part Data Structure)

## Mô tả tổng quan
Tài liệu này mô tả cấu trúc dữ liệu chi tiết của linh kiện trong hệ thống service center. Linh kiện là các bộ phận có thể cần thay thế khi sửa chữa sản phẩm.

## Các trường dữ liệu chính

### 1. Thông tin cơ bản (Basic Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `id` | UUID | ✅ | ID tự động generate bởi Supabase |
| `product_id` | UUID | ✅ | ID sản phẩm (khóa ngoại tới products) |
| `name` | String | ✅ | Tên linh kiện |
| `part_number` | String | ❌ | Mã số linh kiện của nhà sản xuất |
| `sku` | String | ❌ | Mã SKU nội bộ |
| `description` | Text | ❌ | Mô tả chi tiết về linh kiện |
| `price` | Decimal(10,2) | ✅ | Giá linh kiện (VND) |
| `image_url` | String/URL | ❌ | Hình ảnh linh kiện |

### 2. Metadata và audit (Metadata & Audit)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `created_at` | Timestamp | ✅ | Thời gian tạo |
| `updated_at` | Timestamp | ✅ | Thời gian cập nhật cuối |
| `created_by` | UUID | ❌ | ID người tạo |
| `updated_by` | UUID | ❌ | ID người cập nhật cuối |

## Ví dụ JSON Schema

```json
{
  "id": "part-uuid-001",
  "product_id": "product-uuid-iphone15promax",
  "name": "Màn hình iPhone 15 Pro Max",
  "part_number": "A3108-LCD-001",
  "sku": "LCD-IP15PM-001",
  "description": "Màn hình OLED nguyên bản cho iPhone 15 Pro Max",
  "price": 9500000,
  "image_url": "https://example.com/iphone15-screen.jpg",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Ghi chú quan trọng

1. **Indexing**: Các trường `id`, `product_id`, `part_number`, `sku` nên được index để tìm kiếm nhanh
2. **Validation**: 
   - Validate giá tiền phải > 0
   - Validate `product_id` phải tồn tại trong bảng products
3. **Relationships**: 
   - Khóa ngoại `product_id` liên kết với bảng products (1 sản phẩm có nhiều linh kiện)
   - Có thể liên kết với bảng service_tickets khi sử dụng linh kiện
4. **Security**: Kiểm soát quyền truy cập thông tin giá cả
5. **Price History**: Nên lưu lịch sử thay đổi giá để theo dõi
6. **Search**: 
   - Hỗ trợ tìm kiếm theo tên, part_number, sku
   - Có thể lọc linh kiện theo sản phẩm thông qua `product_id`