# Hoạt động Lô RMA (Return Merchandise Authorization)

**Tài liệu Tính năng**
**Cập nhật lần cuối:** 2025-10-26

---

## Tổng quan

**RMA (Return Merchandise Authorization)** là một quy trình chính thức để trả lại các sản phẩm bị lỗi cho nhà cung cấp để thay thế, sửa chữa hoặc nhận lại tín dụng. Tính năng Hoạt động Lô RMA cung cấp một cách có hệ thống để:

*   Nhóm nhiều sản phẩm để trả lại cho nhà cung cấp.
*   Theo dõi các lô hàng với số theo dõi.
*   Duy trì một lộ trình kiểm toán đầy đủ của các sản phẩm được trả lại.

### Các tính năng chính

*   **Tạo Lô:** Nhóm nhiều sản phẩm vào các lô RMA có tổ chức.
*   **Đánh số Tự động:** Tự động đánh số lô theo định dạng `RMA-YYYY-MM-NNN`.
*   **Theo dõi Trạng thái:** Giám sát tiến trình của lô qua các giai đoạn trong vòng đời.
*   **Tích hợp Kho:** Sản phẩm được tự động chuyển đến kho `RMA Staging`.

---

## Quy trình Kinh doanh

### Tổng quan Quy trình RMA

```
1. Xác định Sản phẩm
   ↓
2. Tạo Lô RMA (Nháp)
   ↓
3. Thêm Sản phẩm vào Lô
   ↓ (Sản phẩm được tự động chuyển đến Kho RMA Staging)
4. Hoàn tất Lô (Đã gửi)
   ↓
5. Gửi hàng (Đã vận chuyển)
   ↓
6. Nhà cung cấp Nhận hàng (Đã nhận bởi nhà cung cấp)
   ↓
7. Hoàn tất Xử lý (Đã giải quyết)
```

### Vai trò và Quyền hạn

*   **Admin & Manager:** Có thể tạo, quản lý và hoàn tất các lô RMA.
*   **Technician & Reception:** Chỉ có thể xem các lô RMA.

---

## Tạo và Quản lý các Lô RMA

### Tạo Lô

1.  Điều hướng đến **Dashboard → Inventory → RMA Management** và nhấp vào **"Create RMA Batch"**.
2.  Điền thông tin nhà cung cấp và các ghi chú cần thiết.
3.  Thêm các sản phẩm bị lỗi vào lô bằng cách tìm kiếm số serial hoặc chọn từ danh sách.
4.  Xem lại và hoàn tất lô. Một khi đã hoàn tất, không thể thêm hoặc bớt sản phẩm.

### Quản lý Lô

*   Trang quản lý RMA hiển thị một bảng với tất cả các lô, bao gồm số lô, nhà cung cấp, số lượng sản phẩm, và trạng thái.
*   Bạn có thể lọc các lô theo trạng thái, ngày tháng, hoặc tìm kiếm theo nhà cung cấp.

---

## Vòng đời Trạng thái

Luồng trạng thái là một chiều: `draft` → `submitted` → `shipped` → `received_by_supplier` → `resolved`.

*   **Draft (Nháp):** Lô đang được chuẩn bị. Có thể thêm/bớt sản phẩm.
*   **Submitted (Đã gửi):** Lô đã được hoàn tất và sẵn sàng để vận chuyển. Không thể thay đổi sản phẩm.
*   **Shipped (Đã vận chuyển):** Sản phẩm đang trên đường đến nhà cung cấp.
*   **Received by Supplier (Đã nhận bởi nhà cung cấp):** Nhà cung cấp đã xác nhận nhận được hàng.
*   **Resolved (Đã giải quyết):** Quy trình RMA đã hoàn tất. Đây là trạng thái cuối cùng.

---

## Chi tiết Kỹ thuật

### Lược đồ Cơ sở dữ liệu

*   **Bảng `rma_batches`:** Lưu trữ thông tin về mỗi lô, bao gồm số lô, nhà cung cấp, và trạng thái.
*   **Bảng `physical_products`:** Một cột `rma_batch_id` (khóa ngoại) được sử dụng để theo dõi sản phẩm nào thuộc về lô nào.

### Đánh số Lô Tự động

Một trigger của cơ sở dữ liệu tự động tạo ra một số lô duy nhất theo định dạng `RMA-YYYY-MM-NNN` mỗi khi một lô mới được tạo. Chuỗi số sẽ được reset hàng tháng.

### Các Thủ tục tRPC

*   **Router:** `inventory` (`/src/server/routers/inventory.ts`)
*   **`createRMABatch`:** Tạo một lô RMA mới ở trạng thái `draft`.
*   **`addProductsToRMA`:** Thêm sản phẩm vào một lô RMA đang ở trạng thái `draft`.
*   **`finalizeRMABatch`:** Hoàn tất một lô và thay đổi trạng thái thành `submitted`.
*   **`getRMABatches`:** Lấy danh sách các lô RMA với phân trang.
*   **`getRMABatchDetails`:** Lấy chi tiết của một lô cụ thể, bao gồm danh sách sản phẩm.

**End of RMA Operations Feature Document**