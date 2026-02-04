# Test Cases - Quy trình bảo hành

## Quy trình tổng quan

1. Nhập kho hàng mới (100 cái)
2. Xuất bán cho khách (60 cái)
3. Lấy serial đã bán để tạo phiếu bảo hành
4. Kiểm tra các mục trong phiếu bảo hành
5. Duyệt phiếu và xuất trả bằng sản phẩm khác (từ 40 cái còn lại)
6. Tạo phiếu xuất kho RMA gửi sản phẩm hư về nhà máy

---

## Test Cases

### Bước 1: Nhập kho

| TC | Mô tả | Kết quả mong đợi |
|----|--------|-------------------|
| TC01 | Nhập kho 100 sản phẩm | Tồn kho = 100 |

> **✅ Issues đã fix - TC01:**
>
> **~~Status không đồng nhất~~ (FIXED 2026-02-02):**
> - ~~Sản phẩm vật lý sẽ có status **Draft** nếu được điền vào phiếu nhập **sau khi duyệt**~~
> - **Fix:** Trigger `create_physical_product_from_receipt_serial` đã sửa — serial thêm sau duyệt sẽ tự động có status `active`
> - Xem chi tiết: `docs/doc-kien/fix/fix-lock-document-after-approval.md`
>
> **~~Hiển thị status không chính xác~~ (FIXED 2026-02-02):**
> - ~~Trang danh sách sản phẩm vật lý hiển thị status **"Mới"** cho cả 3 status: **Draft**, **In stock** và **Issued**~~
> - **Fix:** Cột "Tình Trạng" hiển thị `condition` (tình trạng vật lý), đã thêm cột "Trạng Thái" riêng hiển thị `status` (vòng đời: Nháp/Sẵn sàng/Đang chuyển/Đã xuất/Đã hủy)
>
> **🔴 Edit product panel không thể thay đổi Tình trạng:**
> - Panel chỉnh sửa sản phẩm vật lý không cho phép thay đổi `condition` (Tình trạng: Mới/Tân trang/Đã dùng/Lỗi/Lấy linh kiện) trên UI
> - `status` (Trạng thái vòng đời) được hệ thống quản lý tự động qua chứng từ kho nên không cần cho chỉnh trên UI

### Bước 2: Xuất bán

| TC | Mô tả | Kết quả mong đợi |
|----|--------|-------------------|
| TC02 | Xuất bán 60 sản phẩm cho khách | Tồn kho giảm còn 40 |

> **✅ Issues đã fix - TC02:**
>
> **~~Tồn kho thực tế đếm cả sản phẩm đã bán~~ (FIXED 2026-02-03):**
> - ~~Warehouse functions (`get_warehouse_dashboard_stats`, `get_product_stock_details`) và reporting views (`warehouse_stock_overview`, `product_stock_alerts`, `virtual_warehouse_summary`) đếm tất cả `physical_products` không phân biệt status, dẫn đến số tồn kho thực tế bao gồm cả sản phẩm đã xuất bán (status = `issued`)~~
> - **Fix:** Thêm điều kiện `WHERE pp.status = 'active'` vào tất cả các query đếm `physical_products` trong `501_warehouse_functions.sql` và `700_reporting_views.sql`
> - Commit: `6cf0b2d`

> **Issues phát hiện - TC02:**
>
> **Yêu cầu:** Sản phẩm phải có status **In stock** thì mới được xuất.
>
> **🔴 Xóa phiếu nhập xuất:**
> - Phiếu có được phép xóa sau khi hủy phiếu không? (cần xác định business rule)
>
> **🔴 Vô hiệu hóa kho ảo:**
> - Trang quản lý kho chưa có tính năng xóa hay vô hiệu hóa kho ảo, trong khi database đã có cột `is_active` trong bảng `virtual_warehouses`
> - Dropdown chọn kho chưa filter theo `is_active`, kho không còn sử dụng vẫn hiển thị

### Bước 3: Tạo phiếu bảo hành

| TC | Mô tả | Kết quả mong đợi |
|----|--------|-------------------|
| TC03 | Tìm serial đã bán để tạo phiếu bảo hành | Serial được tìm thấy, liên kết đúng khách hàng |
| TC04 | Tạo phiếu bảo hành với serial chưa bán (negative) | Hệ thống từ chối hoặc cảnh báo |

### Bước 4: Kiểm tra phiếu bảo hành

| TC | Mô tả | Kết quả mong đợi |
|----|--------|-------------------|
| TC05 | Kiểm tra sản phẩm hư có được nhập vào kho bảo hành không | Sản phẩm hư nằm trong kho bảo hành |
| TC06 | Kiểm tra phiếu bảo hành có đầy đủ thông tin (khách, serial, lỗi) | Thông tin hiển thị đúng và đầy đủ |
| TC07 | Kiểm tra trạng thái phiếu bảo hành chuyển đúng (pending → in_progress) | Trạng thái cập nhật chính xác |

> **✅ ~~Không có phím tắt mở chi tiết sản phẩm vật lý~~ (ĐÃ FIX)**
> - Đã tạo trang chi tiết sản phẩm vật lý tại `/inventory/products/[id]`
> - Serial number đã là link clickable tại: service ticket detail, service request detail, serial list trong stock detail
> - Xem chi tiết fix: `docs/doc-kien/fix/fix-physical-product-detail-page.md`

### Bước 5: Duyệt phiếu & Xuất trả sản phẩm thay

| TC | Mô tả | Kết quả mong đợi |
|----|--------|-------------------|
| TC08 | Duyệt phiếu và chọn sản phẩm thay mới (serial khác) | Phiếu có thông tin sản phẩm thay mới |
| TC09 | Sau khi hoàn thành phiếu, sản phẩm thay mới ra khỏi kho bán | Tồn kho bán giảm (40 → 39) |
| TC10 | Xuất trả khi tồn kho = 0 (negative) | Hệ thống từ chối hoặc cảnh báo hết hàng |

> **✅ ~~Trang chi tiết phiếu sửa chữa không hiển thị thông tin sản phẩm trả~~ (FIXED 2026-02-02):**
> - ~~Sau khi duyệt phiếu và chọn sản phẩm thay thế, trang chi tiết phiếu sửa chữa (service ticket) không hiển thị thông tin sản phẩm trả cho khách~~
> - **Fix:** Thêm default outcome khi tạo ticket và cho phép chỉnh sửa outcome trên edit form, đảm bảo trang chi tiết hiển thị đúng thông tin sản phẩm trả

### Bước 6: Xuất kho RMA

| TC | Mô tả | Kết quả mong đợi |
|----|--------|-------------------|
| TC11 | Tạo phiếu xuất kho RMA cho sản phẩm hư | Phiếu RMA được tạo thành công |
| TC12 | Sau khi xuất kho RMA, sản phẩm ra khỏi kho bảo hành | Sản phẩm không còn trong kho bảo hành |
| TC13 | Kiểm tra sản phẩm hư chuyển sang trạng thái RMA | Trạng thái sản phẩm = RMA (không bị mất khỏi hệ thống) |

> **~~Chưa thể chuyển trạng thái lô RMA từ "Đã gửi" sang "Đã vận chuyển"~~ (FIXED 2026-02-02):**
> - ~~Sau khi finalize lô RMA (draft → submitted), không có API/UI để chuyển sang trạng thái `shipped`~~
> - **Fix:** Thêm tRPC procedure `shipRMABatch` và nút "Đánh dấu đã vận chuyển" trên trang chi tiết lô RMA (kèm cập nhật tracking number, ngày gửi)
>
> **~~Chưa thể chuyển trạng thái lô RMA từ "Đã vận chuyển" sang "Hoàn thành"~~ (FIXED 2026-02-02):**
> - ~~Không có API/UI để chuyển từ `shipped` → `completed`~~
> - **Fix:** Thêm tRPC procedure `completeRMABatch` và nút "Đánh dấu hoàn thành" trên trang chi tiết lô RMA
