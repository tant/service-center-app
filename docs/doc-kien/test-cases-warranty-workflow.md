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

> **Issues phát hiện - TC02:**
>
> **Yêu cầu:** Sản phẩm phải có status **In stock** thì mới được xuất.
>
> **~~Kho đích sau khi xuất~~ (FIXED 2026-02-02):**
> - ~~Sản phẩm vẫn ở trong kho cũ sau khi xuất kho (không chuyển sang kho đích)~~
> - **Fix:** Thêm cột `to_virtual_warehouse_id` vào `stock_issues`, trigger duyệt phiếu xuất tự động chuyển `physical_products.virtual_warehouse_id` sang kho đích. Kho được phân loại `is_archive` để tách biệt kho khả dụng và kho lưu trữ.
> - Xem chi tiết: `docs/doc-kien/fix/fix-issue-destination-warehouse.md`
>
> **🔴 Xóa phiếu nhập xuất:**
> - Phiếu có được phép xóa sau khi hủy phiếu không? (cần xác định business rule)
>
> **🔴 Vô hiệu hóa kho ảo:**
> - Trang quản lý kho chưa có tính năng xóa hay vô hiệu hóa kho ảo, trong khi database đã có cột `is_active` trong bảng `virtual_warehouses`
> - Dropdown chọn kho chưa filter theo `is_active`, kho không còn sử dụng vẫn hiển thị

### Test Cases: Xuất kho chuyển kho đích (IMPLEMENTED 2026-02-02)

> Liên quan: `docs/doc-kien/fix/fix-issue-destination-warehouse.md`

| TC | Mô tả | Kết quả mong đợi | Trạng thái |
|----|--------|-------------------|------------|
| TC14 | Dropdown kho đích chỉ hiển thị kho archive | Chỉ hiện `rma_staging`, `dead_stock`, `customer_installed` | 🟡 Chờ test |
| TC15 | Dropdown kho nguồn không hiển thị kho archive | Chỉ hiện các kho có `is_archive = FALSE` | 🟡 Chờ test |
| TC16 | Tạo phiếu xuất không chọn kho đích | Validation lỗi, không cho submit | 🟡 Chờ test |
| TC17 | Tạo phiếu xuất với kho đích hợp lệ | Phiếu tạo thành công, `to_virtual_warehouse_id` lưu đúng | 🟡 Chờ test |
| TC18 | Duyệt phiếu xuất — sản phẩm chuyển kho đích | `physical_products.virtual_warehouse_id` = kho đích, `status = 'issued'`, stock kho nguồn bị trừ | 🟡 Chờ test |
| TC19 | Sau duyệt, sản phẩm không còn hiển thị ở kho nguồn | Danh sách sản phẩm kho nguồn không chứa sản phẩm đã xuất | 🟡 Chờ test |
| TC20 | Kho đích mặc định: xuất bán → `customer_installed`, xuất RMA → `rma_staging`, xuất hủy → `dead_stock` | Dropdown kho đích tự động chọn đúng theo ngữ cảnh | ⬜ Chưa implement (user chọn thủ công) |

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

### Bước 5: Duyệt phiếu & Xuất trả sản phẩm thay

| TC | Mô tả | Kết quả mong đợi |
|----|--------|-------------------|
| TC08 | Duyệt phiếu và chọn sản phẩm thay mới (serial khác) | Phiếu có thông tin sản phẩm thay mới |
| TC09 | Sau khi hoàn thành phiếu, sản phẩm thay mới ra khỏi kho bán | Tồn kho bán giảm (40 → 39) |
| TC10 | Xuất trả khi tồn kho = 0 (negative) | Hệ thống từ chối hoặc cảnh báo hết hàng |

### Bước 6: Xuất kho RMA

| TC | Mô tả | Kết quả mong đợi |
|----|--------|-------------------|
| TC11 | Tạo phiếu xuất kho RMA cho sản phẩm hư | Phiếu RMA được tạo thành công |
| TC12 | Sau khi xuất kho RMA, sản phẩm ra khỏi kho bảo hành | Sản phẩm không còn trong kho bảo hành |
| TC13 | Kiểm tra sản phẩm hư chuyển sang trạng thái RMA | Trạng thái sản phẩm = RMA (không bị mất khỏi hệ thống) |
