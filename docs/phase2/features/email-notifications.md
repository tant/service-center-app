# Hệ thống Thông báo qua Email

**Story:** 1.15 - Hệ thống Thông báo qua Email
**Cập nhật lần cuối:** 2025-10-26

---

## Tổng quan

Hệ thống Thông báo qua Email tự động gửi email cho khách hàng tại các thời điểm quan trọng trong quy trình dịch vụ, giúp họ luôn được cập nhật về tình trạng yêu cầu của mình.

### Các tính năng chính

*   **6 loại thông báo tự động:** Bao gồm toàn bộ hành trình của khách hàng.
*   **Hàng đợi và Ghi log Email:** Tất cả email được ghi lại trong cơ sở dữ liệu với trạng thái gửi.
*   **Quản lý Hủy đăng ký:** Khách hàng có thể quản lý tùy chọn nhận email của mình.
*   **Giới hạn Tần suất (Rate Limiting):** Chống spam email (100 email/khách hàng/ngày).
*   **Logic Thử lại:** Các email gửi thất bại sẽ được tự động thử lại.
*   **Dashboard cho Admin:** Nhân viên có thể xem log email và thử lại các lần gửi thất bại.

---

## Các Tác nhân Kích hoạt Thông báo

Hệ thống gửi email tại 6 thời điểm quan trọng:

1.  **Yêu cầu Dịch vụ được Gửi:** Khách hàng gửi yêu cầu qua cổng thông tin công cộng.
2.  **Yêu cầu được Nhân viên Tiếp nhận:** Nhân viên đánh dấu yêu cầu là "đã nhận".
3.  **Yêu cầu bị Từ chối:** Nhân viên từ chối một yêu cầu dịch vụ.
4.  **Phiếu sửa chữa được Tạo / Dịch vụ Bắt đầu:** Yêu cầu dịch vụ được chuyển đổi thành phiếu sửa chữa.
5.  **Dịch vụ Hoàn thành / Sẵn sàng để Nhận:** Phiếu sửa chữa được đánh dấu là "hoàn thành".
6.  **Giao hàng được Xác nhận:** Nhân viên xác nhận đã giao sản phẩm cho khách hàng.

---

## Mẫu Email

Tất cả các mẫu email đều có thiết kế nhất quán, hỗ trợ phiên bản HTML và văn bản thuần túy, và được viết chủ yếu bằng tiếng Việt.

### Cấu trúc Mẫu

*   **Thiết kế đáp ứng (Responsive):** Thân thiện với thiết bị di động.
*   **Thương hiệu:** Nhất quán với thương hiệu của trung tâm dịch vụ.
*   **Liên kết Hủy đăng ký:** Luôn có trong chân email.

---

## Hệ thống Hủy đăng ký

Khách hàng có toàn quyền kiểm soát các loại email họ muốn nhận.

### Luồng Hủy đăng ký

1.  **Liên kết ở Chân email:** Mỗi email đều chứa một liên kết để hủy đăng ký.
2.  **Trang Tùy chọn:** Khách hàng có thể quản lý các tùy chọn của mình trên trang `/unsubscribe`.
3.  **Kiểm tra Tùy chọn:** Hệ thống sẽ kiểm tra tùy chọn của khách hàng trước khi gửi bất kỳ email nào.

---

## Quản lý của Admin

### Trang Log Thông báo

*   **Vị trí:** `/dashboard/notifications`
*   **Truy cập:** Chỉ dành cho nhân viên đã xác thực.

### Các tính năng

*   **Thống kê Email:** Xem các thẻ thống kê thời gian thực về tổng số email, đã gửi, thất bại, và đang chờ xử lý.
*   **Bảng Log Email:** Xem danh sách chi tiết các email đã được gửi với khả năng lọc và tìm kiếm.
*   **Xem trước Nội dung Email:** Xem nội dung HTML và văn bản thuần túy của email.
*   **Thử lại Email Thất bại:** Nhân viên có thể thử lại việc gửi các email đã thất bại.

---

## Kiến trúc Kỹ thuật

### Lược đồ Cơ sở dữ liệu

*   **Bảng `email_notifications`:** Lưu trữ tất cả thông tin về email, bao gồm loại, người nhận, trạng thái, và nội dung.
*   **Bảng `customers`:** Chứa một cột `email_preferences` (JSONB) để lưu các tùy chọn của khách hàng.

### Các Thủ tục tRPC

*   **Router:** `notifications` (`/src/server/routers/notifications.ts`)
*   **`notifications.send`:** Thủ tục để gửi email. Nó kiểm tra giới hạn tần suất, tùy chọn hủy đăng ký, và ghi log email.
*   **`notifications.getLog`:** Lấy danh sách các email đã được ghi log với phân trang và bộ lọc.
*   **`notifications.getStats`:** Lấy các số liệu thống kê về email.
*   **`notifications.retry`:** Thử lại một email đã gửi thất bại.

**End of Email Notifications Feature Document**