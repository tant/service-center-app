# Cấu trúc dữ liệu sản phẩm (Product Data Structure)

## Mô tả tổng quan
Tài liệu này mô tả cấu trúc dữ liệu chi tiết của sản phẩm sẽ được bảo hành và sửa chữa trong hệ thống service center. Hiện tại sẽ làm đơn giản để dễ quản lý và sẽ phát triển, bổ sung thêm sau này

## Các trường dữ liệu chính

### 1. Thông tin cơ bản (Basic Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `id` | UUID/String | ✅ | Mã định danh duy nhất của sản phẩm |
| `name` | String | ✅ | Tên sản phẩm |
| `sku` | String | ❌ | Mã SKU (Stock Keeping Unit) |
| `short_description` | String(255) | ❌ | Mô tả ngắn gọn về sản phẩm |

### 2. Phân loại và danh mục (Category & Classification)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `brand` | String | ❌ | Thương hiệu sản phẩm |
| `model` | String | ❌ | Mẫu mã sản phẩm |
| `type` | Enum | ❌ | Loại sản phẩm (hardware, software, accessory, etc.) |

### 3. Thông tin media và hình ảnh (Media Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `primary_image` | String/URL | ❌ | Hình ảnh chính của sản phẩm |

### 4. Metadata và audit (Metadata & Audit Trail)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `created_at` | Timestamp | ✅ | Thời gian tạo |
| `updated_at` | Timestamp | ✅ | Thời gian cập nhật cuối |
| `created_by` | UUID/String | ❌ | ID người tạo |
| `updated_by` | UUID/String | ❌ | ID người cập nhật cuối |

## Ví dụ JSON Schema

```json
{
  "id": "uuid-string",
  "name": "iPhone 15 Pro Max",
  "sku": "IPH15PM-256-NTL",
  "short_description": "Premium smartphone",
  "brand": "Apple",
  "model": "A3108",
  "type": "hardware",
  "primary_image": "https://example.com/iphone15.jpg",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Ghi chú quan trọng

1. **Indexing**: Các trường `id`, `sku` nên được index để tối ưu hiệu suất truy vấn
2. **Validation**: Cần validate dữ liệu đầu vào, đặc biệt là định dạng URL cho hình ảnh
3. **Relationships**: Cần thiết lập quan hệ với các bảng khác nếu cần
4. **Security**: Kiểm soát quyền truy cập cho việc tạo và cập nhật sản phẩm
5. **Audit Log**: Nên lưu lịch sử thay đổi để theo dõi các cập nhật dữ liệu sản phẩm