# Thẻ tham khảo nhanh cho Kỹ thuật viên

**Vai trò:** Kỹ thuật viên | **Cập nhật:** 2025-10-26

---

## Trách nhiệm chính của bạn

*   Làm việc trên các phiếu sửa chữa được giao.
*   Chẩn đoán và sửa chữa thiết bị.
*   Cập nhật trạng thái phiếu sửa chữa khi có tiến triển.
*   Thêm/bớt linh kiện khi cần thiết.
*   Ghi lại công việc đã làm bằng các bình luận.

---

## Các công việc thường ngày

### Xem các Phiếu sửa chữa được giao

*   **Trang:** `/tickets`
*   Sử dụng bộ lọc để xem các phiếu theo trạng thái: `Pending` (Đang chờ), `In Progress` (Đang tiến hành), `Completed` (Hoàn thành).
*   Tìm kiếm phiếu theo mã số, tên khách hàng, hoặc sắp xếp theo mức độ ưu tiên.

### Làm việc trên một Phiếu sửa chữa (Quy trình chính)

*   **Trang:** `/tickets/[ticket-id]`

1.  **Bắt đầu Công việc:**
    *   Xem lại mô tả sự cố của khách hàng.
    *   Thay đổi trạng thái từ `Pending` thành `In Progress`.
    *   Thêm bình luận chẩn đoán với những phát hiện của bạn.

2.  **Thêm Linh kiện khi cần:**
    *   Trong mục "Linh kiện đã sử dụng", tìm và thêm các linh kiện cần thiết.
    *   Số lượng tồn kho sẽ tự động giảm.

3.  **Thêm Bình luận/Ghi chú:**
    *   Ghi lại những gì bạn đã tìm thấy, đã làm, các linh kiện đã thay thế, và các vấn đề gặp phải.

4.  **Hoàn thành Phiếu sửa chữa:**
    *   Xác minh rằng tất cả công việc đã hoàn thành và các linh kiện đã được ghi lại.
    *   Thay đổi trạng thái thành `Completed`.
    *   Thêm một bình luận cuối cùng tóm tắt công việc.

---

## Luồng Trạng thái Phiếu sửa chữa

Quy trình trạng thái chỉ đi theo một chiều:

```
pending → in_progress → completed
```

*   Bạn không thể mở lại các phiếu đã hoàn thành. Hãy liên hệ Quản lý nếu cần.

---

## Quản lý Linh kiện

*   **Kiểm tra Tồn kho:** Trước khi thêm một linh kiện, hãy kiểm tra số lượng có sẵn trong trang `/parts`.
*   **Hành vi Tồn kho:**
    *   Khi bạn thêm một linh kiện vào phiếu, tồn kho sẽ **giảm**.
    *   Khi bạn xóa một linh kiện khỏi phiếu, tồn kho sẽ **tăng** (được trả lại).

---

## Các Lỗi Thường gặp và Cách khắc phục

*   **"Không đủ hàng tồn kho cho linh kiện [Tên linh kiện]"**: Thông báo cho Quản lý để nhập thêm hàng hoặc sử dụng một linh kiện thay thế.
*   **"Không thể cập nhật phiếu đã hoàn thành"**: Các phiếu đã hoàn thành bị khóa. Yêu cầu Quản lý hoặc Admin mở lại nếu cần thiết.
*   **"Linh kiện không tìm thấy trong kho"**: Thông báo cho Quản lý để thêm linh kiện mới vào hệ thống.

---

## Các Thực hành Tốt nhất

*   **Bắt đầu Ngày làm việc:** Kiểm tra dashboard để xem các phiếu được giao, ưu tiên các phiếu khẩn cấp trước.
*   **Trong khi Sửa chữa:** Cập nhật trạng thái thành `In Progress` khi bắt đầu. Ghi lại chẩn đoán và các linh kiện đã sử dụng ngay lập tức.
*   **Trước khi Hoàn thành:** Kiểm tra kỹ lưỡng thiết bị và đảm bảo tất cả công việc đã được ghi lại.

**Cần giúp đỡ? Hãy hỏi Quản lý của bạn hoặc kiểm tra hướng dẫn kỹ thuật đầy đủ.**