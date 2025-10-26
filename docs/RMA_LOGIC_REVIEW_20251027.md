# RMA Management - Logic Review & Updates

## Ngày cập nhật: 27/10/2025

## Tổng quan thay đổi

Đã rà soát và cập nhật toàn bộ logic quản lý RMA theo yêu cầu mới:

### 1. Ràng buộc kho nguồn khi thêm sản phẩm vào lô RMA

**Yêu cầu**: Chỉ chấp nhận sản phẩm từ kho `warranty_stock`

**Thay đổi**:
- File: `src/server/routers/inventory.ts` - procedure `validateRMASerials`
- Logic cũ: Chấp nhận sản phẩm từ nhiều loại kho (main, warranty_stock, dead_stock, rma_staging)
- Logic mới: Chỉ chấp nhận sản phẩm đang ở `warranty_stock`, các sản phẩm ở kho khác sẽ bị reject với thông báo rõ ràng

**Lý do**: Đảm bảo chỉ sản phẩm đủ điều kiện RMA (đang trong bảo hành) mới được chuyển về nhà cung cấp

### 2. Lưu kho nguồn khi thêm sản phẩm

**Yêu cầu**: Lưu lại kho cũ của sản phẩm trước khi chuyển vào RMA staging

**Thay đổi**:
- Migration: `202510270004_add_previous_warehouse_to_physical_products.sql`
  - Thêm cột `previous_virtual_warehouse_type` vào bảng `physical_products`
  - Kiểu dữ liệu: `warehouse_type` (enum)
  
- File: `src/server/routers/inventory.ts` - procedure `addProductsToRMA`
  - Khi thêm sản phẩm vào lô RMA, lưu `virtual_warehouse_type` hiện tại vào `previous_virtual_warehouse_type`
  - Sau đó mới chuyển sản phẩm sang `rma_staging`
  - Validation: Reject sản phẩm không phải từ `warranty_stock`

**Lợi ích**: Có thể truy vết và trả sản phẩm về đúng vị trí ban đầu

### 3. Trả sản phẩm về kho cũ khi xóa khỏi lô RMA

**Yêu cầu**: Không dùng kho mặc định, trả về kho đã lưu

**Thay đổi**:
- File: `src/server/routers/inventory.ts` - procedure `removeProductFromRMA`
  - Logic cũ: Đọc cấu hình `default_rma_return_warehouse` từ system_settings và chuyển về kho đó
  - Logic mới: Đọc `previous_virtual_warehouse_type` của sản phẩm và trả về kho đó
  - Fallback: Nếu không có `previous_virtual_warehouse_type` (dữ liệu cũ), mặc định về `warranty_stock`
  - Clear `previous_virtual_warehouse_type` sau khi trả về

**Lợi ích**: Đảm bảo sản phẩm quay về đúng vị trí ban đầu, không bị nhầm lẫn

### 4. Dọn dẹp trang cài đặt admin

**Yêu cầu**: Giữ lại cấu trúc trang nhưng xóa phần cấu hình kho mặc định

**Thay đổi**:
- File: `src/app/(auth)/admin/settings/page.tsx`
  - Xóa toàn bộ logic chọn kho mặc định RMA
  - Giữ lại khung trang với thông báo "đang phát triển"
  - Dành chỗ cho các cấu hình khác trong tương lai

- Migration: `202510270005_remove_unused_rma_default_setting.sql`
  - Xóa record `default_rma_return_warehouse` khỏi bảng `system_settings`

**Lợi ích**: Tránh nhầm lẫn và dữ liệu thừa

## Luồng hoạt động mới

### Thêm sản phẩm vào lô RMA:

1. User paste/import danh sách serial
2. Hệ thống validate:
   - Serial có tồn tại không?
   - Serial có bị trùng trong danh sách không?
   - Sản phẩm có đang trong lô RMA khác không?
   - **Sản phẩm có đang ở kho `warranty_stock` không?** ⭐ (mới)
3. Hiển thị kết quả validation với thông báo lỗi rõ ràng
4. User xác nhận thêm các sản phẩm hợp lệ
5. Hệ thống:
   - Lưu `previous_virtual_warehouse_type` = `warranty_stock` ⭐ (mới)
   - Chuyển sản phẩm sang `rma_staging`
   - Ghi nhận `stock_movements`

### Xóa sản phẩm khỏi lô RMA:

1. User click xóa sản phẩm từ danh sách lô RMA
2. Xác nhận dialog
3. Hệ thống:
   - Đọc `previous_virtual_warehouse_type` của sản phẩm ⭐ (mới)
   - Chuyển sản phẩm về kho đó (fallback: `warranty_stock`)
   - Xóa `rma_batch_id` và các trường RMA
   - Clear `previous_virtual_warehouse_type` ⭐ (mới)
   - Ghi nhận `stock_movements` với movement_type = `rma_return`

## Các file đã thay đổi

### Migrations (Database Schema):
1. `supabase/migrations/202510270004_add_previous_warehouse_to_physical_products.sql` - Thêm cột lưu kho nguồn
2. `supabase/migrations/202510270005_remove_unused_rma_default_setting.sql` - Xóa cấu hình cũ

### Backend (tRPC Procedures):
1. `src/server/routers/inventory.ts`:
   - `validateRMASerials`: Chỉ chấp nhận warranty_stock
   - `addProductsToRMA`: Lưu kho nguồn trước khi chuyển
   - `removeProductFromRMA`: Trả về kho nguồn đã lưu

### Frontend:
1. `src/app/(auth)/admin/settings/page.tsx` - Simplified settings page

## Testing checklist

- [ ] Tạo sản phẩm mới ở kho `warranty_stock`
- [ ] Tạo lô RMA mới
- [ ] Paste/import danh sách serial (có cả hợp lệ và không hợp lệ)
  - [ ] Kiểm tra validation hiển thị đúng message
  - [ ] Sản phẩm từ kho khác `warranty_stock` bị reject
- [ ] Thêm sản phẩm hợp lệ vào lô RMA
  - [ ] Kiểm tra `previous_virtual_warehouse_type` được lưu
  - [ ] Sản phẩm chuyển sang `rma_staging`
  - [ ] `stock_movements` được ghi nhận
- [ ] Xóa sản phẩm khỏi lô RMA
  - [ ] Sản phẩm quay về `warranty_stock` (hoặc kho đã lưu)
  - [ ] `previous_virtual_warehouse_type` được clear
  - [ ] `stock_movements` ghi movement_type = `rma_return`
- [ ] Kiểm tra trang admin settings không còn phần cấu hình kho mặc định

## Notes

- Tất cả migrations đã được apply thành công
- TypeScript compilation không có lỗi
- Logic cũ về system_settings.default_rma_return_warehouse đã bị xóa hoàn toàn
- Trang admin settings vẫn tồn tại để mở rộng các cấu hình khác sau này
