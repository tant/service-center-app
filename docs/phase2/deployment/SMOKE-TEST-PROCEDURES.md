# Quy trình Smoke Test - Triển khai Production Giai đoạn 2

**Cập nhật lần cuối:** 2025-10-26
**Đối tượng:** Kỹ sư QA, Trưởng nhóm Triển khai, Quản trị viên Hệ thống

---

## Tổng quan

### Smoke Test là gì?

Smoke test là các bài kiểm tra xác minh các luồng công việc quan trọng, được thực hiện ngay sau khi triển khai để đảm bảo các tính năng quan trọng nhất hoạt động chính xác. Đây là một "kiểm tra sơ bộ" để xác nhận việc triển khai đã thành công.

**Mục đích:**
*   Xác minh ứng dụng có thể truy cập và phản hồi.
*   Xác nhận tất cả các luồng công việc quan trọng hoạt động từ đầu đến cuối.
*   Phát hiện lỗi triển khai trước khi người dùng gặp phải.

### Khi nào cần chạy Smoke Test

*   **Bắt buộc:** Ngay sau khi triển khai production, sau khi có hotfix, hoặc sau khi migration cơ sở dữ liệu.
*   **Tùy chọn:** Sau khi thay đổi cấu hình lớn hoặc sau khi khắc phục sự cố.

---

## Thiết lập Môi trường Kiểm thử

### Danh sách kiểm tra trước khi kiểm thử

*   [ ] **Triển khai Hoàn tất:** Ứng dụng đã được triển khai thành công và đang chạy.
*   [ ] **Truy cập được Xác minh:** URL ứng dụng có thể truy cập, chứng chỉ HTTPS hợp lệ.
*   [ ] **Cơ sở dữ liệu Sẵn sàng:** Tất cả các migration đã được áp dụng, kết nối cơ sở dữ liệu hoạt động.

### Các tài khoản kiểm thử

Cần có các tài khoản kiểm thử cho các vai trò sau: **Admin, Manager, Technician, Reception**.

---

## Smoke Test Nhanh (5-10 phút)

**Mục đích:** Xác minh nhanh các luồng công việc quan trọng sau khi triển khai.

1.  **Khả năng truy cập ứng dụng (1 phút):**
    *   Truy cập URL chính của ứng dụng.
    *   **Tiêu chí đạt:** Trang tải thành công (HTTP 200), không có lỗi console.

2.  **Xác thực (2 phút):**
    *   Đăng nhập bằng tài khoản admin.
    *   **Tiêu chí đạt:** Đăng nhập thành công và chuyển hướng đến trang dashboard.

3.  **Tạo Phiếu sửa chữa (3 phút):**
    *   Tạo một phiếu sửa chữa mới với thông tin khách hàng và thiết bị.
    *   **Tiêu chí đạt:** Phiếu sửa chữa được tạo thành công với một mã số duy nhất.

4.  **Tạo Tác vụ (1 phút):**
    *   Kiểm tra xem các tác vụ có được tự động tạo ra từ mẫu công việc cho phiếu sửa chữa mới không.
    *   **Tiêu chí đạt:** Ít nhất một tác vụ được tạo với trạng thái "pending".

5.  **Khả năng truy cập Cổng thông tin Công cộng (2 phút):**
    *   Truy cập trang yêu cầu dịch vụ công cộng mà không cần đăng nhập.
    *   **Tiêu chí đạt:** Trang tải thành công và hiển thị biểu mẫu yêu cầu.

---

## Smoke Test Toàn diện (30-45 phút)

Thực hiện tất cả 8 bộ kiểm thử quan trọng theo thứ tự:

1.  **Bộ 1: Xác thực (5 phút):** Tất cả các vai trò có thể đăng nhập.
2.  **Bộ 2: Quản lý Phiếu sửa chữa (7 phút):** Luồng công việc cốt lõi của phiếu sửa chữa.
3.  **Bộ 3: Quy trình Công việc (6 phút):** Thực thi và các ràng buộc của tác vụ.
4.  **Bộ 4: Cổng thông tin Công cộng (5 phút):** Yêu cầu dịch vụ từ phía khách hàng.
5.  **Bộ 5: Thông báo Email (5 phút):** Gửi email và xem log.
6.  **Bộ 6: Hoạt động Kho (6 phút):** Theo dõi sản phẩm và RMA.
7.  **Bộ 7: Dashboard của Quản lý (4 phút):** Phân tích và số liệu.
8.  **Bộ 8: Chuyển đổi Mẫu công việc Động (4 phút):** Linh hoạt trong quá trình phục vụ.

---

## Các Bộ kiểm thử Quan trọng

### Bộ 1: Xác thực

*   **Mục tiêu:** Xác minh tất cả các vai trò người dùng có thể xác thực và truy cập các trang phù hợp.
*   **Các bước:** Đăng nhập và đăng xuất với các tài khoản **Admin, Manager, Technician, và Reception**. Kiểm tra quyền truy cập vào các trang dành riêng cho từng vai trò.
*   **Tiêu chí đạt:** Tất cả các vai trò có thể đăng nhập VÀ kiểm soát truy cập dựa trên vai trò hoạt động chính xác.

### Bộ 2: Quản lý Phiếu sửa chữa

*   **Mục tiêu:** Xác minh các hoạt động cốt lõi của phiếu sửa chữa.
*   **Các bước:** Tạo phiếu sửa chữa mới, cập nhật trạng thái, thêm linh kiện, và hoàn thành phiếu.
*   **Tiêu chí đạt:** Có thể tạo → thêm linh kiện → cập nhật trạng thái → hoàn thành phiếu sửa chữa.

### Bộ 3: Quy trình Công việc (Task Workflow)

*   **Mục tiêu:** Xác minh việc thực thi tác vụ, tuân thủ trình tự, và trang "Công việc của tôi".
*   **Các bước:** Đăng nhập với tư cách kỹ thuật viên, xem danh sách công việc, bắt đầu và hoàn thành các công việc theo trình tự.
*   **Tiêu chí đạt:** Các tác vụ có thể được bắt đầu → hoàn thành theo trình tự → tiến độ được theo dõi chính xác.

### Bộ 4: Cổng thông tin Công cộng

*   **Mục tiêu:** Xác minh cổng yêu cầu dịch vụ dành cho khách hàng.
*   **Các bước:** Gửi một yêu cầu dịch vụ mới mà không cần đăng nhập, nhận mã theo dõi, theo dõi trạng thái, và chuyển đổi yêu cầu thành phiếu sửa chữa (với tư cách nhân viên).
*   **Tiêu chí đạt:** Có thể gửi yêu cầu → nhận mã → theo dõi trạng thái → chuyển đổi thành phiếu sửa chữa.

---

## Script Smoke Test Tự động

Một script tự động có thể được sử dụng để kiểm tra các điểm cuối API quan trọng.

```bash
#!/bin/bash
# File: smoke-test.sh
# Mô tả: Chạy smoke test tự động trên các điểm cuối API

set -e

APP_URL="${1:-http://localhost:3025}"

# ... (logic kiểm tra API)

# 1. Kiểm tra Health Check
curl -sf "$APP_URL/api/health"

# 2. Kiểm tra trang đăng nhập
curl -sf "$APP_URL/login"

# ... (các kiểm tra khác)
```

**Sử dụng:**

```bash
chmod +x smoke-test.sh
./smoke-test.sh https://your-domain.com
```

**End of Smoke Test Procedures**