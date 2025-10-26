# Thẻ tham khảo nhanh cho Lễ tân

**Vai trò:** Lễ tân | **Cập nhật:** 2025-10-26

---

## Trách nhiệm chính của bạn

*   Tạo phiếu sửa chữa mới cho khách hàng.
*   Quản lý thông tin khách hàng.
*   Kiểm tra tình trạng phiếu sửa chữa cho khách hàng.
*   Trả lời các câu hỏi của khách hàng.

---

## Các công việc thường ngày

### Tạo Phiếu sửa chữa Mới

*   **Trang:** `/tickets/add`
1.  **Tra cứu Khách hàng:** Nhập số điện thoại của khách hàng. Hệ thống sẽ tự động điền nếu khách hàng đã tồn tại. Nếu không, hãy tạo khách hàng mới.
2.  **Chọn Sản phẩm:** Tìm kiếm và chọn sản phẩm từ danh mục.
3.  **Thêm Linh kiện (Tùy chọn):** Thêm các linh kiện cần thiết từ kho.
4.  **Chi tiết Dịch vụ:** Điền phí dịch vụ, phí chẩn đoán, mức độ ưu tiên, và mô tả sự cố.
5.  **Xem lại & Gửi:** Kiểm tra lại tất cả thông tin và tạo phiếu. Ghi lại mã số phiếu để cung cấp cho khách hàng.

### Tìm Phiếu sửa chữa Hiện có

*   **Trang:** `/operations/tickets`
*   Sử dụng các bộ lọc để tìm kiếm theo mã số phiếu, tên khách hàng, số điện thoại, hoặc trạng thái.
*   **Màu sắc Trạng thái:** Vàng (Đang chờ), Xanh dương (Đang tiến hành), Xanh lá (Hoàn thành), Xám (Đã hủy).

### Quản lý Khách hàng

*   **Trang:** `/management/customers`
*   Thêm khách hàng mới hoặc chỉnh sửa thông tin của khách hàng hiện tại. Xem lịch sử tất cả các phiếu sửa chữa của một khách hàng bằng cách nhấp vào tên của họ.

---

## Các Bảng tham khảo nhanh

### Ý nghĩa các Trạng thái Phiếu sửa chữa

| Trạng thái | Ý nghĩa | Nói gì với Khách hàng |
|---|---|---|
| Pending | Chưa bắt đầu | "Chúng tôi đã nhận thiết bị của bạn, đang chờ kỹ thuật viên" |
| In Progress | Đang được sửa | "Kỹ thuật viên đang làm việc trên đó" |
| Completed | Đã hoàn thành | "Thiết bị của bạn đã sẵn sàng để nhận lại!" |
| Cancelled | Đã hủy | "Dịch vụ đã bị hủy" |

### Các Mức độ Ưu tiên

| Ưu tiên | Khi nào sử dụng | Màu sắc |
|---|---|---|
| Low | Không khẩn cấp | Xám |
| Normal | Dịch vụ tiêu chuẩn | Xanh dương |
| High | Khách hàng cần sớm | Cam |
| Urgent | Khẩn cấp, trong ngày | Đỏ |

---

## Các Lỗi Thường gặp và Cách khắc phục

*   **"Số điện thoại phải có ít nhất 10 ký tự"**: Nhập số điện thoại đầy đủ.
*   **"Khách hàng với số điện thoại này đã tồn tại"**: Tìm kiếm khách hàng hiện có trước, sau đó tạo phiếu sửa chữa.
*   **"Không đủ hàng tồn kho"**: Chọn một linh kiện khác hoặc thông báo cho Quản lý để nhập thêm hàng.

---

## Các Thực hành Tốt nhất

*   Luôn kiểm tra xem khách hàng đã tồn tại chưa trước khi tạo mới.
*   Kiểm tra lại độ chính xác của số điện thoại.
*   Viết mô tả sự cố rõ ràng và chi tiết.
*   Cung cấp cho khách hàng mã số phiếu để tham khảo.

**Cần giúp đỡ? Hãy hỏi Quản lý của bạn hoặc kiểm tra hướng dẫn sử dụng đầy đủ.**