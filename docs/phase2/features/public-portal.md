# Cổng Yêu cầu Dịch vụ Công cộng

**Tài liệu Tính năng**
**Cập nhật lần cuối:** 2025-10-26

---

## Tổng quan

Cổng Yêu cầu Dịch vụ Công cộng cung cấp cho khách hàng một giao diện tự phục vụ để gửi các yêu cầu dịch vụ bảo hành trực tuyến mà không cần xác thực. Hệ thống cho phép gửi yêu cầu ẩn danh, theo dõi yêu cầu thông qua một hệ thống mã thông báo duy nhất, và tích hợp với quy trình làm việc nội bộ của nhân viên.

### Các khả năng chính

*   **Yêu cầu Bảo hành Ẩn danh:** Khách hàng gửi yêu cầu với xác minh số serial.
*   **Theo dõi Thời gian thực:** Theo dõi dựa trên mã thông báo mà không cần xác thực.
*   **Quản lý bởi Nhân viên:** Dashboard nội bộ để xem xét và chuyển đổi yêu cầu.
*   **Tích hợp Phiếu sửa chữa:** Chuyển đổi liền mạch các yêu cầu thành phiếu sửa chữa.
*   **Thông báo qua Email:** Cập nhật tự động ở mỗi giai đoạn.
*   **Giới hạn Tần suất (Rate Limiting):** Chống lạm dụng (10 yêu cầu/phút/IP).

---

## Hành trình của Khách hàng

### Giai đoạn 1: Xác minh Bảo hành

*   **Luồng người dùng:** Khách hàng truy cập cổng thông tin, nhập số serial sản phẩm. Hệ thống xác minh và hiển thị tình trạng bảo hành.
*   **Kỹ thuật:** Sử dụng thủ tục tRPC `serviceRequest.verifyWarranty` để truy vấn bảng `physical_products`.

### Giai đoạn 2: Gửi Yêu cầu

*   **Luồng người dùng:** Sau khi xác minh bảo hành, khách hàng điền vào biểu mẫu yêu cầu với các thông tin cần thiết.
*   **Kỹ thuật:** Sử dụng thủ tục tRPC `serviceRequest.submit` với xác thực schema của Zod. Có một trường honeypot ẩn để chống spam.

### Giai đoạn 3: Xác nhận và Theo dõi

*   **Luồng người dùng:** Sau khi gửi, khách hàng nhận được một mã theo dõi duy nhất. Họ có thể sử dụng mã này để theo dõi tình trạng yêu cầu của mình trên trang theo dõi.
*   **Kỹ thuật:** Mã theo dõi được tạo tự động bởi một trigger trong cơ sở dữ liệu. Trang theo dõi tự động làm mới sau mỗi 30 giây.

---

## Quy trình làm việc của Nhân viên

### Dashboard và Xem xét Yêu cầu

*   **Quyền truy cập:** Các vai trò Admin, Manager, Reception.
*   **Tính năng:** Danh sách các yêu cầu đang chờ, bộ lọc trạng thái, tìm kiếm, và các hành động nhanh (Chấp nhận, Từ chối, Chuyển đổi).

### Chuyển đổi Yêu cầu thành Phiếu sửa chữa

*   **Quy trình:** Nhân viên xem xét yêu cầu, xác minh thông tin, và chọn chuyển đổi nó thành một phiếu sửa chữa nội bộ.
*   **Hành động Tự động:**
    1.  Tìm kiếm hoặc tạo khách hàng mới.
    2.  Tạo một bản ghi mới trong bảng `service_tickets`, điền sẵn dữ liệu từ yêu cầu.
    3.  Thêm một bình luận ban đầu với thông tin từ yêu cầu gốc.
    4.  Cập nhật trạng thái của yêu cầu thành `processing`.
    5.  Gửi email "Phiếu sửa chữa đã được tạo" cho khách hàng.

---

## Các Vấn đề Bảo mật

*   **Xác thực & Phân quyền:** Các điểm cuối công cộng không yêu cầu xác thực, trong khi các điểm cuối của nhân viên yêu cầu xác thực và kiểm tra vai trò.
*   **Giới hạn Tần suất (Rate Limiting):** Giới hạn 10 yêu cầu/phút/IP cho việc gửi công cộng.
*   **Chống Spam:** Sử dụng trường honeypot ẩn.
*   **Quyền riêng tư Dữ liệu:** Dữ liệu khách hàng được che giấu trong các kết quả theo dõi công cộng.
*   **Chính sách RLS:** Các chính sách bảo mật cấp hàng (Row-Level Security) được áp dụng để kiểm soát quyền truy cập dữ liệu.

---

## Triển khai Kỹ thuật

### Lược đồ Cơ sở dữ liệu

*   **Bảng `service_requests`:** Lưu trữ tất cả thông tin liên quan đến các yêu cầu của khách hàng, bao gồm thông tin khách hàng, chi tiết sản phẩm, mô tả sự cố, và trạng thái.
*   **Trigger:** Tự động tạo mã theo dõi và cập nhật dấu thời gian `updated_at`.

### Các Điểm cuối API tRPC

*   **Công cộng:** `verifyWarranty`, `submit`, `track`.
*   **Nhân viên:** `listPending`, `getDetails`, `updateStatus`, `convertToTicket`, `reject`.

**End of Public Portal Feature Document**