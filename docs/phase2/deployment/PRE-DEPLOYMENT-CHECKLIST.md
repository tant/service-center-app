# Danh sách kiểm tra trước khi triển khai Production - Giai đoạn 2

**Cập nhật lần cuối:** 2025-10-26

---

## Danh sách kiểm tra

### 1. Xác minh Tích hợp

*   **Nền tảng (Foundation):** Các bảng cơ sở dữ liệu, RLS, và định nghĩa kiểu đã được tạo.
*   **Quản lý Mẫu công việc:** Tạo/sửa mẫu, thêm công việc vào mẫu hoạt động.
*   **Quy trình Công việc (Workflow):** Giao diện thực thi công việc, cập nhật trạng thái, và các ràng buộc phụ thuộc hoạt động.
*   **Quản lý Kho:** Tạo kho vật lý, theo dõi sản phẩm bằng số serial, và các di chuyển trong kho được ghi lại chính xác.
*   **Cổng thông tin Công cộng:** Gửi và theo dõi yêu cầu dịch vụ hoạt động, bao gồm cả việc giới hạn truy cập (rate limiting).
*   **Các tính năng Nâng cao:** Hệ thống thông báo email, dashboard của quản lý, và chuyển đổi mẫu công việc động hoạt động.
*   **QA & Triển khai:** Kế hoạch kiểm thử đã được thực thi, các lỗi nghiêm trọng đã được giải quyết, và tài liệu đã hoàn tất.

### 2. Sao lưu Cơ sở dữ liệu

**Trước BẤT KỲ hoạt động triển khai nào:**
*   [ ] Tạo một bản sao lưu đầy đủ của cơ sở dữ liệu.
    ```bash
    pnpx supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql
    ```
*   [ ] Xác minh rằng tệp sao lưu đã được tạo thành công và lưu trữ ở một nơi an toàn.

### 3. Kiểm thử Migration

*   [ ] Chạy tất cả các migration trên môi trường staging (nếu có) và xác minh không có lỗi.
*   [ ] Kiểm tra xem tất cả các bảng, chính sách RLS, trigger, và view đã được tạo đúng cách.

### 4. Kế hoạch Rollback

*   [ ] Tài liệu về quy trình rollback đã được chuẩn bị và đội ngũ đã được đào tạo.
*   [ ] Các kịch bản kích hoạt rollback đã được định nghĩa (ví dụ: migration thất bại, lỗi ứng dụng nghiêm trọng).

### 5. Thông báo cho Đội ngũ

*   [ ] Lên lịch cho cửa sổ triển khai (trong thời gian ít traffic).
*   [ ] Thông báo cho tất cả các thành viên trong đội ngũ ít nhất 48 giờ trước khi triển khai.
*   [ ] Phân công vai trò và trách nhiệm rõ ràng (Deployment Lead, DBA, QA, ...).

### 6. Xác thực Môi trường

*   [ ] Môi trường production đã được cài đặt đúng phiên bản Node.js, pnpm.
*   [ ] Tất cả các biến môi trường đã được thiết lập và xác thực. **Không chứa các giá trị của môi trường phát triển.**
*   [ ] Kết nối đến Supabase và các dịch vụ lưu trữ đã được xác minh.

### 7. Build Ứng dụng

*   [ ] Chạy `pnpm build` cục bộ không có lỗi.
*   [ ] Không có lỗi TypeScript hoặc linting.
*   [ ] Kích thước của build artifact hợp lý.

### 8. Danh sách kiểm tra Bảo mật

*   [ ] Các chính sách RLS được kích hoạt trên tất cả các bảng.
*   [ ] Phân quyền dựa trên vai trò hoạt động đúng.
*   [ ] Giới hạn truy cập (rate limiting) được kích hoạt trên các endpoint công cộng.
*   [ ] CORS được cấu hình đúng.
*   [ ] Không có thông tin bí mật nào bị lộ ở phía client.

### 9. Kế hoạch Smoke Test

**Kiểm tra các luồng quan trọng ngay sau khi triển khai:**
*   **Xác thực:** Đăng nhập với các vai trò khác nhau (admin, manager, technician, reception).
*   **Quản lý Phiếu sửa chữa:** Tạo, gán, và hoàn thành một phiếu sửa chữa.
*   **Cổng thông tin Công cộng:** Gửi và theo dõi một yêu cầu dịch vụ.
*   **Thông báo Email:** Xác minh rằng các email được gửi đi khi có các sự kiện quan trọng.
*   **Hoạt động Kho:** Đăng ký sản phẩm, xem tồn kho.

### 10. Phê duyệt Cuối cùng

*   [ ] Trưởng nhóm Kỹ thuật (Technical Lead) phê duyệt.
*   [ ] Quản lý Sản phẩm (Product Manager) phê duyệt.
*   [ ] Trưởng nhóm QA phê duyệt.

---

## Ghi chú

*   **Cửa sổ triển khai:** Lên lịch vào những giờ ít người dùng.
*   **Thời gian chết dự kiến:** Hướng tới không có thời gian chết; kế hoạch cho trường hợp xấu nhất là 15 phút.
*   **Hỗ trợ:** Có người trực hỗ trợ 24/24 trong 3 ngày đầu sau khi triển khai.

**End of Checklist**