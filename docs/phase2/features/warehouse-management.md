# Hệ thống Quản lý Kho - Tài liệu Tính năng

**Cập nhật lần cuối:** 2025-10-26

---

## Tổng quan

Hệ thống Quản lý Kho cung cấp khả năng theo dõi hàng tồn kho toàn diện cho các sản phẩm có số serial, cùng với việc quản lý bảo hành. Nó hỗ trợ cả các vị trí kho vật lý và các danh mục kho ảo, cho phép theo dõi chính xác sản phẩm qua vòng đời của chúng.

### Các khả năng chính

*   **Hệ thống Kho Kép:** Các vị trí vật lý và phân loại ảo.
*   **Theo dõi theo Số Serial:** Định danh duy nhất cho mỗi sản phẩm.
*   **Quản lý Bảo hành:** Tự động tính toán và theo dõi hạn bảo hành.
*   **Lộ trình Kiểm toán Di chuyển:** Lịch sử đầy đủ của tất cả các lần di chuyển sản phẩm.
*   **Cảnh báo Tồn kho Thấp:** Ngưỡng có thể cấu hình với giám sát thời gian thực.

---

## Các loại Kho

### Kho ảo

Là các danh mục do hệ thống định nghĩa để phân loại sản phẩm theo mục đích hoặc trạng thái hiện tại. Chúng được tạo tự động và không thể sửa đổi.

*   **`warranty_stock` (Hàng bảo hành):** Sản phẩm còn bảo hành, sẵn sàng để thay thế cho khách hàng.
*   **`rma_staging` (Chờ trả hàng):** Sản phẩm đang chờ để trả lại cho nhà cung cấp.
*   **`dead_stock` (Hàng hỏng):** Sản phẩm không thể sửa chữa, dùng để lấy linh kiện hoặc thải loại.
*   **`in_service` (Đang trong dịch vụ):** Sản phẩm đang được gán cho một phiếu sửa chữa đang hoạt động.
*   **`parts` (Linh kiện):** Hàng tồn kho các linh kiện và bộ phận thay thế.

### Kho vật lý

Đại diện cho các vị trí lưu trữ thực tế trong cơ sở của bạn. Chúng do người dùng định nghĩa và có thể được tạo/sửa đổi bởi các vai trò Admin và Manager.

---

## Theo dõi Sản phẩm

### Dữ liệu Chính của Sản phẩm Vật lý

Mỗi sản phẩm có số serial được theo dõi như một thực thể duy nhất với các chi tiết toàn diện, bao gồm định danh, vị trí, thông tin bảo hành, và thông tin nhà cung cấp.

### Đăng ký Sản phẩm

*   **Nhập thủ công:** Nhập từng sản phẩm thông qua giao diện người dùng.
*   **Nhập hàng loạt:** Tải lên tệp CSV/Excel chứa tối đa 1.000 sản phẩm mỗi lô.

---

## Các Hoạt động Tồn kho

### Di chuyển Tồn kho

Tất cả các lần di chuyển sản phẩm giữa các kho đều được ghi lại trong một lộ trình kiểm toán không thể thay đổi. Các loại di chuyển bao gồm: `receipt` (nhận hàng), `transfer` (chuyển kho), `assignment` (gán cho phiếu sửa chữa), `return` (trả về), và `disposal` (thải loại).

### Mức tồn kho và Cảnh báo

Hệ thống cung cấp giám sát mức tồn kho thời gian thực thông qua một materialized view của cơ sở dữ liệu (`v_warehouse_stock_levels`). Các ngưỡng có thể được cấu hình cho mỗi sản phẩm để kích hoạt cảnh báo tồn kho thấp (`warning` hoặc `critical`).

---

## Tự động hóa

### Tự động Di chuyển Sản phẩm

Sản phẩm tự động di chuyển vào và ra khỏi kho ảo "In Service" dựa trên các sự kiện của phiếu sửa chữa. Một trigger của cơ sở dữ liệu (`auto_move_product_on_ticket_event()`) xử lý logic này.

*   **Khi phiếu được tạo hoặc đang tiến hành:** Sản phẩm được chuyển đến kho `in_service`.
*   **Khi phiếu hoàn thành:** Sản phẩm được trả về kho ban đầu của nó (thường là `warranty_stock`).

---

## Chi tiết Kỹ thuật

### Lược đồ Cơ sở dữ liệu

*   **Các bảng chính:** `physical_warehouses`, `virtual_warehouses`, `physical_products`, `stock_movements`, `product_stock_thresholds`.
*   **Các View:** `v_warehouse_stock_levels` (materialized), `v_stock_movement_history`, `v_low_stock_alerts`, `v_warranty_expiring_soon`.

### Các Thủ tục tRPC

*   **Router:** `warehouse` và `inventory`.
*   Cung cấp các điểm cuối để quản lý kho, sản phẩm, di chuyển tồn kho, và các hoạt động RMA.

**End of Warehouse Management Feature Document**