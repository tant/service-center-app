# Cài đặt Giám sát Production - Giai đoạn 2

**Cập nhật lần cuối:** 2025-10-26
**Đối tượng:** Đội ngũ Vận hành (Operations)

---

## Tổng quan

Tài liệu này cung cấp hướng dẫn toàn diện để thiết lập giám sát cho ứng dụng Service Center Giai đoạn 2 trong môi trường production. Hệ thống giám sát đảm bảo tuân thủ các yêu cầu phi chức năng (NFR) và cho phép phát hiện, phản ứng sự cố nhanh chóng.

**Chiến lược giám sát:**
*   **Chủ động:** Cảnh báo trước khi sự cố ảnh hưởng đến người dùng.
*   **Toàn diện:** Giám sát cơ sở dữ liệu, API, email, và giới hạn truy cập (rate limits).
*   **Hành động được:** Quy trình phản ứng và người chịu trách nhiệm rõ ràng.
*   **Tự động:** Giảm thiểu công việc giám sát thủ công.

---

## Yêu cầu về Hiệu suất

### Các mục tiêu tuân thủ NFR

*   **Thời gian phản hồi API (NFR1):** P95 < 500ms.
*   **Thời gian hoạt động của hệ thống (NFR5):** > 99% hàng tháng.
*   **Giới hạn truy cập (NFR14):** Cổng công cộng: 10 yêu cầu/giờ/IP; Email: 100 email/24h/khách hàng.
*   **Tỷ lệ lỗi:** < 1% tổng số yêu cầu.

---

## Cấu hình Supabase Logflare

### Bước 1: Kích hoạt Tích hợp Logflare

*   Trong Supabase Studio, đi đến **Settings → Integrations**.
*   Tìm và kích hoạt tích hợp **Logflare**.
*   Đặt thời gian lưu trữ log là **30 ngày**.

### Bước 2: Cấu hình Nguồn Log

Kích hoạt tất cả các nguồn log trong **Logs → Settings**, bao gồm Postgres, API, Auth, và Storage. Đặt mức log là **INFO** cho production.

### Bước 3: Tạo các Truy vấn Log Tùy chỉnh

Trong **Logs → Query Editor**, tạo và lưu các truy vấn để theo dõi:
*   **Lỗi API (24 giờ qua):** Tìm các yêu cầu có mã trạng thái không phải 2xx.
*   **Truy vấn Cơ sở dữ liệu Chậm:** Tìm các truy vấn có thời gian thực thi > 200ms.
*   **Lỗi Xác thực:** Tìm các lần đăng nhập thất bại.
*   **Lượt truy cập bị giới hạn (Rate Limit):** Tìm các yêu cầu có mã trạng thái 429.

---

## Cấu hình Cảnh báo

### Cảnh báo Quan trọng (Yêu cầu Phản ứng Ngay lập tức)

*   **Lỗi nghiêm trọng Cơ sở dữ liệu:** Kích hoạt khi có > 5 lỗi `ERROR` hoặc `FATAL` trong 5 phút.
*   **Tỷ lệ lỗi API Cao:** Kích hoạt khi tỷ lệ lỗi 5xx > 5% hoặc có > 20 lỗi trong 5 phút.
*   **Lỗi Gửi Email:** Kích hoạt khi tỷ lệ gửi thất bại > 5% trong 15 phút.
*   **Vi phạm Rate Limit:** Kích hoạt khi có > 50 yêu cầu bị chặn từ một IP trong 10 phút.
*   **Độ trễ Cao:** Kích hoạt khi P95 latency > 500ms trong 10 phút.

### Cảnh báo (Cần theo dõi chặt chẽ)

*   **Tỷ lệ lỗi 4xx Tăng cao:** Kích hoạt khi tỷ lệ lỗi 4xx > 10% trong 15 phút.
*   **Truy vấn Cơ sở dữ liệu Chậm:** Kích hoạt khi có > 20 truy vấn chậm trong 15 phút.

---

## Giám sát Hiệu suất

### Theo dõi Thời gian Phản hồi API (NFR1)

Sử dụng truy vấn SQL trên Logflare để tính toán P95 latency. Tạo một script để chạy truy vấn này định kỳ và gửi cảnh báo nếu vượt ngưỡng.

```sql
-- P95 latency cho tất cả các điểm cuối API (1 giờ qua)
SELECT
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float) as p95_latency
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '1 hour'
  AND metadata->>'duration_ms' IS NOT NULL;
```

### Theo dõi Thời gian Hoạt động (NFR5)

Sử dụng một dịch vụ giám sát bên ngoài như **UptimeRobot** (có gói miễn phí) để kiểm tra endpoint `/api/health` mỗi 5 phút.

---

## Cấu hình Dashboard

Tạo một dashboard tùy chỉnh trong Supabase Studio (**Logs → Dashboard**) để trực quan hóa các số liệu quan trọng:

*   **Lượng yêu cầu (24 giờ qua):** Biểu đồ đường.
*   **Tỷ lệ lỗi theo mã trạng thái:** Biểu đồ cột.
*   **Phân phối độ trễ API (P50, P95, P99):** Biểu đồ nhiều đường.
*   **Hiệu suất truy vấn cơ sở dữ liệu:** Biểu đồ vùng.
*   **Các truy vấn chậm hàng đầu:** Bảng.

---

## Quy trình Phản ứng Sự cố

### Mức độ Nghiêm trọng của Sự cố

*   **P1 - Nghiêm trọng:** Hệ thống ngừng hoạt động, mất dữ liệu, vi phạm bảo mật.
*   **P2 - Cao:** Tính năng chính bị lỗi, tỷ lệ lỗi cao.
*   **P3 - Trung bình:** Tính năng phụ bị lỗi, hiệu suất giảm.
*   **P4 - Thấp:** Lỗi nhỏ, vấn đề giao diện.

### Quy trình Phản ứng

1.  **Phát hiện:** Cảnh báo được kích hoạt hoặc người dùng báo cáo.
2.  **Ghi nhận (trong 5 phút):** Thông báo cho đội ngũ rằng sự cố đang được xem xét.
3.  **Đánh giá (trong 15 phút):** Chạy các script chẩn đoán để xác định nguyên nhân.
4.  **Giao tiếp:** Cập nhật trang thái và thông báo cho các bên liên quan.
5.  **Giải quyết:** Thực hiện các bước để khắc phục sự cố, ví dụ: rollback, khởi động lại dịch vụ.
6.  **Xem xét sau sự cố:** Phân tích nguyên nhân gốc rễ và xác định các hành động để ngăn chặn tái diễn.

**End of Monitoring Setup Guide**