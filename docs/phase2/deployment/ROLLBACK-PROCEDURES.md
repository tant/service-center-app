# Quy trình Rollback - Triển khai Giai đoạn 2

**Cập nhật lần cuối:** 2025-10-26
**Thời gian Rollback Tối đa:** 15 phút

---

## Tổng quan

Tài liệu này mô tả quy trình rollback hoàn chỉnh cho việc triển khai Giai đoạn 2. Rollback nên được thực hiện nếu các vấn đề nghiêm trọng được phát hiện sau khi triển khai mà không thể giải quyết nhanh chóng.

**Chiến lược Rollback:**
*   **Cơ sở dữ liệu:** Khôi phục từ bản sao lưu và hoàn tác các migration.
*   **Ứng dụng:** Triển khai lại phiên bản trước đó.

---

## Khi nào cần Rollback

### Các Tình huống Khẩn cấp (Rollback Ngay lập tức)

1.  **Hỏng hóc Cơ sở dữ liệu:** Toàn vẹn dữ liệu bị ảnh hưởng.
2.  **Hệ thống Ngừng hoạt động:** Ứng dụng không khả dụng > 5 phút.
3.  **Mất mát Dữ liệu:** Dữ liệu người dùng bị mất hoặc hỏng.
4.  **Vi phạm Bảo mật:** Phát hiện truy cập trái phép.
5.  **Migration Thất bại:** Migration cơ sở dữ liệu thất bại và báo lỗi.

### Các Tình huống Lớn (Rollback trong vòng 30 phút)

1.  **Tỷ lệ lỗi cao:** Tỷ lệ lỗi > 5% tổng số yêu cầu.
2.  **Hiệu suất Giảm sút:** Thời gian phản hồi > 3 giây một cách nhất quán.
3.  **Tính năng Quan trọng Bị hỏng:** Luồng công việc cốt lõi không hoạt động.

---

## Quy trình Rollback

### Giai đoạn 1: Thông báo (1 phút)

**Giao tiếp ngay lập tức:**
*   Thông báo trên kênh chat của đội ngũ: "ĐANG TIẾN HÀNH ROLLBACK - Không thực hiện thay đổi".
*   Cập nhật trang trạng thái (nếu có): "Dịch vụ đang trong quá trình bảo trì".

### Giai đoạn 2: Rollback Ứng dụng (3-5 phút)

*   **Vercel (khuyến nghị):** Trong dashboard của Vercel, tìm bản triển khai ổn định trước đó và chọn "Promote to Production".
*   **Docker:** Dừng container hiện tại và khởi động lại container với image của phiên bản ổn định trước đó.
    ```bash
    docker stop service-center-app
    docker run -d --name service-center-app service-center:previous
    ```
*   **Thủ công (PM2):** Checkout phiên bản ổn định trước đó từ git, cài đặt lại dependencies, build, và khởi động lại ứng dụng bằng PM2.

### Giai đoạn 3: Rollback Cơ sở dữ liệu (8-10 phút)

**QUAN TRỌNG:** Rollback cơ sở dữ liệu sẽ làm mất tất cả các thay đổi dữ liệu kể từ khi triển khai.

1.  **Dừng traffic đến ứng dụng:** Dừng ứng dụng để ngăn chặn các lượt ghi vào cơ sở dữ liệu.
2.  **Tạo bản sao lưu của trạng thái hiện tại:** Ngay cả khi đang rollback, hãy sao lưu trạng thái hiện tại để điều tra sau.
    ```bash
    pnpx supabase db dump -f backup-pre-rollback-$(date +%Y%m%d-%H%M%S).sql
    ```
3.  **Khôi phục từ bản sao lưu:** Sử dụng bản sao lưu được tạo trước khi triển khai để khôi phục cơ sở dữ liệu.
    ```bash
    psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres < backup-YYYYMMDD-HHMMSS.sql
    ```
4.  **Xác minh tính toàn vẹn của dữ liệu:** Kiểm tra xem các bảng của Giai đoạn 1 có còn tồn tại không và các bảng của Giai đoạn 2 đã bị xóa.

### Giai đoạn 4: Khôi phục Môi trường và Khởi động lại (3-5 phút)

*   Khôi phục lại các biến môi trường từ tệp sao lưu (`.env.backup`).
*   Khởi động lại ứng dụng.
*   Chạy smoke test sau khi rollback để đảm bảo các chức năng cốt lõi của Giai đoạn 1 hoạt động bình thường.

### Giai đoạn 5: Giao tiếp sau Rollback (1 phút)

*   Thông báo cho đội ngũ và các bên liên quan rằng quá trình rollback đã hoàn tất và hệ thống đã ổn định.
*   Lên lịch một cuộc họp để phân tích nguyên nhân sự cố.

---

## Các Hành động sau Rollback

*   **Ngay lập tức:** Giám sát sự ổn định của hệ thống và thu thập bằng chứng (log, ảnh chụp màn hình lỗi) từ lần triển khai thất bại.
*   **Trong vòng 24 giờ:** Phân tích nguyên nhân gốc rễ và phát triển một bản vá lỗi.
*   **Trong vòng 1 tuần:** Tổ chức một cuộc họp post-mortem để rút kinh nghiệm và cải thiện quy trình.

**End of Rollback Procedures**