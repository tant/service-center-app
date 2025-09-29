
# Cấu trúc dữ liệu: Products & Parts

Tài liệu này gộp mô tả cấu trúc dữ liệu của hai thực thể chính trong hệ thống service center: Sản phẩm (Product) và Linh kiện / Phụ kiện (Part). Mục tiêu là đặt hai mô tả cạnh nhau để dễ tham chiếu, quản lý mối quan hệ (một sản phẩm có nhiều linh kiện) và thống nhất các ghi chú về index, validation, bảo mật và audit.

---

## 1) Product (Sản phẩm)

### Mô tả tổng quan
Tài liệu này mô tả cấu trúc dữ liệu chi tiết của sản phẩm sẽ được bảo hành và sửa chữa trong hệ thống service center. Hiện tại mô tả ở mức đơn giản để dễ quản lý; có thể mở rộng thêm sau này.

### Các trường dữ liệu chính

#### 1. Thông tin cơ bản (Basic Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `id` | UUID | ✅ | ID tự động generate bởi Supabase |
| `name` | String | ✅ | Tên sản phẩm |
| `sku` | String | ❌ | Mã SKU (Stock Keeping Unit) |
| `short_description` | String(255) | ❌ | Mô tả ngắn gọn về sản phẩm |

#### 2. Phân loại và danh mục (Category & Classification)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `brand` | Enum | ❌ | Thương hiệu sản phẩm (ví dụ: ZOTAC, SSTC, Other) |
| `model` | String | ❌ | Mã model |
| `type` | Enum | ❌ | Loại sản phẩm (VGA, MiniPC, SSD, RAM, Mainboard, Other) |

#### 3. Thông tin media và hình ảnh (Media Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `primary_image` | String/URL | ❌ | Hình ảnh chính của sản phẩm |

#### 4. Metadata và audit (Metadata & Audit Trail)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `created_at` | Timestamp | ✅ | Thời gian tạo |
| `updated_at` | Timestamp | ✅ | Thời gian cập nhật cuối |
| `created_by` | UUID | ❌ | ID người tạo (khóa ngoại tới `profiles.user_id`) |
| `updated_by` | UUID | ❌ | ID người cập nhật cuối (khóa ngoại tới `profiles.user_id`) |

### Ví dụ JSON cho Product

```json
{
  "id": "uuid-string",
  "name": "iPhone 15 Pro Max",
  "sku": "IPH15PM-256-NTL",
  "short_description": "Premium smartphone",
  "brand": "ZOTAC",
  "model": "A3108",
  "type": "VGA",
  "primary_image": "https://example.com/iphone15.jpg",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Ghi chú quan trọng cho Product

1. Indexing: Các trường `id`, `sku` nên được index để tối ưu truy vấn.
2. Validation: Cần validate dữ liệu đầu vào, đặc biệt là định dạng URL cho hình ảnh.
3. Relationships: Thiết lập quan hệ với các bảng khác khi cần (ví dụ: `parts`, `service_tickets`).
4. Security: Kiểm soát quyền truy cập đối với thao tác tạo/cập nhật sản phẩm.
5. Audit Log: Nên lưu lịch sử thay đổi để theo dõi các cập nhật dữ liệu sản phẩm.

---

## 2) Part (Linh kiện / Phụ kiện)

### Mô tả tổng quan
Linh kiện là các bộ phận có thể cần thay thế khi sửa chữa sản phẩm. Một sản phẩm có thể có nhiều linh kiện. Phần này mô tả cấu trúc dữ liệu cho linh kiện và các yêu cầu đi kèm.

### Các trường dữ liệu chính

#### 1. Thông tin cơ bản (Basic Information)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `id` | UUID | ✅ | ID tự động generate bởi Supabase |
| `name` | String | ✅ | Tên linh kiện |
| `part_number` | String | ❌ | Mã số linh kiện của nhà sản xuất |
| `sku` | String | ❌ | Mã SKU nội bộ |
| `description` | Text | ❌ | Mô tả chi tiết về linh kiện |
| `price` | Decimal(10,2) | ✅ | Giá bán linh kiện (VND) |
| `cost_price` | Decimal(10,2) | ✅ | Giá vốn (VND) — dùng cho báo cáo lợi nhuận |
| `stock_quantity` | Integer | ✅ | Số lượng tồn kho hiện tại (số nguyên >= 0) |
| `stock_value` | Decimal(12,2) | ❌ | Giá trị tồn kho (tính toán: cost_price * stock_quantity). Có thể lưu hoặc tính khi cần |
| `image_url` | String/URL | ❌ | Hình ảnh linh kiện |

#### 2. Metadata và audit (Metadata & Audit)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| `created_at` | Timestamp | ✅ | Thời gian tạo |
| `updated_at` | Timestamp | ✅ | Thời gian cập nhật cuối |
| `created_by` | UUID | ❌ | ID người tạo (khóa ngoại tới `profiles.user_id`) |
| `updated_by` | UUID | ❌ | ID người cập nhật cuối (khóa ngoại tới `profiles.user_id`) |

### Ví dụ JSON cho Part

```json
{
  "id": "part-uuid-001",
  "name": "Màn hình iPhone 15 Pro Max",
  "part_number": "A3108-LCD-001",
  "sku": "LCD-IP15PM-001",
  "description": "Màn hình OLED nguyên bản cho iPhone 15 Pro Max",
  "price": 9500000,
  "cost_price": 6000000,
  "stock_quantity": 12,
  "stock_value": 72000000,
  "image_url": "https://example.com/iphone15-screen.jpg",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Ghi chú quan trọng cho Part

1. Indexing: Các trường `id`, `part_number`, `sku` nên được index để tìm kiếm nhanh. Với mô hình mới, cần thêm index cho bảng nối `product_parts` (ví dụ: `(product_id, part_id)` và `(part_id, product_id)`).
2. Validation:
  - Giá bán (`price`) phải > 0.
  - Giá vốn (`cost_price`) phải >= 0.
  - `stock_quantity` phải là số nguyên >= 0.
  - `stock_value` nên khớp `cost_price * stock_quantity` nếu được lưu; nếu không lưu, tính khi cần.
3. Relationships:
  - Không còn `product_id` trực tiếp trên `parts` — thay bằng bảng nối `product_parts` để biểu diễn quan hệ nhiều-nhiều giữa `products` và `parts`.
  - `parts` là thực thể toàn cục (shared). Khi một bản ghi part được dùng cho nhiều products, chỉ cần tạo các hàng tương ứng trong `product_parts`.
  - `service_tickets` vẫn có thể tham chiếu tới `parts` khi linh kiện được sử dụng trong sửa chữa.
4. Security: Kiểm soát quyền truy cập thông tin giá cả.
5. Price History: Nên lưu lịch sử thay đổi giá để theo dõi.
6. Search: Hỗ trợ tìm kiếm theo `name`, `part_number`, `sku` và lọc theo `product_id`.

---

## 3) Quan hệ tổng quan & Lưu ý chung

- Một `product` có thể có nhiều `part` thông qua bảng nối `product_parts` (N:N). 
  - Bảng `product_parts` tối giản gồm `product_id` (UUID) và `part_id` (UUID). (Bạn đã yêu cầu giữ đơn giản — không thêm price override.)
- Khi xóa một `product`, cân nhắc hành vi với `parts` liên quan (cascade delete hay restrict).
- Nên có transaction khi cập nhật cùng lúc nhiều bản ghi liên quan (ví dụ: cập nhật product và thêm/remove parts).
- Quyền và phân quyền: phân biệt quyền xem sản phẩm/linh kiện và quyền sửa/xóa/đặt giá.

## 4) Ví dụ JSON kết hợp (Product + Parts)

```json
{
  "product": {
    "id": "product-uuid-iphone15promax",
    "name": "iPhone 15 Pro Max",
    "sku": "IPH15PM-256-NTL",
    "brand": "Apple",
    "model": "A3108",
    "type": "Smartphone",
    "primary_image": "https://example.com/iphone15.jpg",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "parts": [
    {
      "id": "part-uuid-001",
      "name": "Màn hình iPhone 15 Pro Max",
      "part_number": "A3108-LCD-001",
      "price": 9500000,
      "cost_price": 6000000,
      "stock_quantity": 12,
      "stock_value": 72000000
    },
    {
      "id": "part-uuid-002",
      "name": "Pin iPhone 15 Pro Max",
      "part_number": "A3108-BATT-001",
      "price": 1500000,
      "cost_price": 800000,
      "stock_quantity": 30,
      "stock_value": 24000000
    }
  ],
  "product_parts": [
    { "product_id": "product-uuid-iphone15promax", "part_id": "part-uuid-001" },
    { "product_id": "product-uuid-iphone15promax", "part_id": "part-uuid-002" }
  ]
}
```

## 5) Tóm tắt thay đổi thực hiện

- File mới `docs/data/products&parts.md` được tạo bằng cách gộp nội dung từ `docs/data/products.md` và `docs/data/parts.md`.

---

## 6) Next steps đề xuất (tùy chọn)

- Thêm schema SQL/ migration tương ứng trong thư mục `docs/schemas` hoặc `supabase/migrations` nếu muốn đồng bộ với database.
- Thêm vài test unit nhỏ (hoặc JSON schema validation) để đảm bảo các trường bắt buộc và ràng buộc được enforced.
