# Fix: Không có phím tắt mở chi tiết sản phẩm vật lý

## Vấn đề

Trong các trang phiếu sửa chữa (service ticket) và phiếu yêu cầu dịch vụ (service request), serial number hiển thị dưới dạng text thuần - không click được để xem chi tiết sản phẩm vật lý. Ngoài ra, **chưa có trang chi tiết sản phẩm vật lý** (physical product detail page).

### Vị trí bị ảnh hưởng

1. **Service ticket detail** (`/operations/tickets/[id]`) - dòng serial hiển thị text thuần
2. **Service request detail** (`/operations/service-requests/[id]`) - serial number trong danh sách items
3. **Serial list trong stock detail** (`/inventory/products/[id]/stock`) - bảng serial không click được

## Giải pháp

### 1. Tạo trang chi tiết sản phẩm vật lý

- **Route**: `/inventory/products/[id]`
- **Backend**: Đã có sẵn tRPC procedure `physicalProducts.getProduct` (query by ID) và `physicalProducts.getMovementHistory`
- **Nội dung hiển thị**:
  - Thông tin cơ bản: serial, SKU, tên sản phẩm, thương hiệu, tình trạng (condition), trạng thái (status)
  - Bảo hành: manufacturer warranty, user warranty, trạng thái bảo hành
  - Vị trí: kho ảo, kho vật lý
  - Liên kết: phiếu sửa chữa hiện tại, lô RMA, khách hàng cuối
  - Lịch sử di chuyển (stock movements)

### 2. Biến serial number thành link clickable

Tại 3 vị trí nêu trên, thay thế text thuần bằng `<Link>` trỏ đến `/inventory/products/[id]`.

Do serial number không phải là ID, cần query physical product ID trước hoặc dùng route parameter khác. Giải pháp: sử dụng serial_number làm query param: `/inventory/products?serial=XXX`, hoặc truyền physical_product_id nếu đã có trong data.

## Files cần thay đổi

- `src/app/(auth)/inventory/products/[id]/page.tsx` (MỚI - physical product detail)
- `src/components/inventory/physical-product-detail.tsx` (MỚI)
- `src/components/inventory/stock-detail/serial-list-section.tsx` (SỬA - thêm link)
- `src/app/(auth)/operations/tickets/[id]/page.tsx` (SỬA - thêm link serial)
- `src/app/(auth)/operations/service-requests/[id]/page.tsx` (SỬA - thêm link serial)
