# Hướng dẫn Triển khai Production - Giai đoạn 2

**Phiên bản:** 0.2.1 (Giai đoạn 2)
**Cập nhật lần cuối:** 10/2025
**Đối tượng:** Kỹ sư DevOps, Quản trị viên Hệ thống

---

## Danh sách kiểm tra trước khi triển khai

### Yêu cầu hạ tầng

*   **CPU:** Tối thiểu 2 vCPU (khuyến nghị 4 vCPU)
*   **RAM:** Tối thiểu 4 GB (khuyến nghị 8 GB)
*   **Lưu trữ:** Tối thiểu 20 GB SSD (khuyến nghị 50 GB)
*   **Hệ điều hành:** Ubuntu 22.04 LTS hoặc mới hơn
*   **Phần mềm:** Docker, Node.js, pnpm

### Các công việc cần làm

*   **Kiểm tra mã nguồn:** Đảm bảo tất cả các tính năng đã được kiểm thử, không còn mã gỡ lỗi, và build thành công (`pnpm build`, `pnpm lint`).
*   **Chuẩn bị cơ sở dữ liệu:** Sao lưu, kiểm thử các migration script trong môi trường staging.
*   **Xem xét bảo mật:** Xoay vòng khóa API, tạo mật khẩu mạnh, cấu hình CORS.
*   **Thiết lập hạ tầng:** Chuẩn bị tên miền, DNS, chứng chỉ SSL, và các công cụ giám sát.

---

## Thiết lập Môi trường

### Biến môi trường Production

Tạo một tệp `.env` cho môi trường production với các biến cần thiết. **Cảnh báo: Không bao giờ commit tệp này lên git.**

```bash
# Cấu hình Supabase (lấy từ dashboard của Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Mật khẩu cho trang /setup
SETUP_PASSWORD=STRONG_RANDOM_PASSWORD

# Tài khoản admin mặc định
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=STRONG_ADMIN_PASSWORD
```

### Tạo các giá trị bí mật an toàn

Sử dụng các lệnh sau để tạo các chuỗi ngẫu nhiên an toàn:

```bash
# Tạo mật khẩu mạnh (32 ký tự)
openssl rand -base64 32

# Tạo khóa hex (64 ký tự)
openssl rand -hex 32
```

---

## Chiến lược Migration Cơ sở dữ liệu

### Thứ tự Migration

**Quan trọng:** Các migration phải được áp dụng theo đúng thứ tự đã được định nghĩa trong thư mục `supabase/migrations`.

### Sao lưu trước khi Migration

**Luôn luôn sao lưu trước khi thực hiện migration!**

```bash
# Đối với Supabase Cloud: Sử dụng Dashboard

# Đối với Docker self-hosted
docker exec supabase-db pg_dump \
  -U postgres -Fc -f /tmp/backup.dump postgres
docker cp supabase-db:/tmp/backup.dump ./backups/
```

### Các chiến lược Migration

*   **Cài đặt mới (Khuyến nghị):** Chạy `pnpx supabase start` và sau đó là script `setup_schema.sh`.
*   **Migration tăng dần:** Sao lưu, xem xét các migration đang chờ, và áp dụng bằng `pnpx supabase migration up`.
*   **Triển khai Blue-Green (Không thời gian chết):** Tạo một dự án Supabase mới, push tất cả migration, di chuyển dữ liệu, và sau đó chuyển hướng traffic.

---

## Cấu hình Supabase Production

### Lựa chọn 1: Supabase Cloud (Dịch vụ được quản lý)

*   **Ưu điểm:** Sao lưu tự động, giám sát tích hợp, tự động mở rộng.
*   **Các bước:** Tạo dự án trên Supabase, liên kết với CLI (`pnpx supabase link`), push schema (`pnpx supabase db push`), và cấu hình các bucket lưu trữ và xác thực trên dashboard.

### Lựa chọn 2: Self-Hosted Supabase (Docker)

*   **Ưu điểm:** Toàn quyền kiểm soát, không bị khóa nhà cung cấp, tuân thủ chủ quyền dữ liệu.
*   **Các bước:** Sử dụng tệp `docker-compose.prod.yml` để ghi đè các cài đặt phát triển, tinh chỉnh hiệu suất PostgreSQL trong `postgresql.conf`, và triển khai bằng `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`.

---

## Build và Triển khai Next.js

### Quy trình Build Production

1.  **Chuẩn bị:** Chạy `pnpm install --frozen-lockfile`, `pnpm lint`, và `pnpm tsc --noEmit`.
2.  **Build:** Chạy `NODE_ENV=production pnpm build`. Cấu hình `next.config.ts` đã được tối ưu cho output `standalone`.

### Triển khai Docker

Dockerfile đã sẵn sàng cho production với multi-stage build.

**Build image:**

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -t service-center:latest \
  .
```

**Chạy container:**

```bash
docker run -d --name service-center-prod -p 3025:3025 \
  -e NODE_ENV=production \
  -e ... (các biến môi trường khác) \
  service-center:latest
```

---

## Xác minh sau khi triển khai

Sử dụng script `scripts/verify-deployment.sh` để tự động kiểm tra các điểm cuối quan trọng, hoặc thực hiện kiểm tra thủ công:

*   **Truy cập ứng dụng:** Trang chủ tải không lỗi, không có lỗi console.
*   **Thiết lập ban đầu:** Trang `/setup` hoạt động, có thể tạo và đăng nhập bằng tài khoản admin.
*   **Chức năng cốt lõi:** Tạo phiếu sửa chữa, khách hàng, sản phẩm.
*   **Tính năng Giai đoạn 2:** Mẫu công việc, quản lý kho, RMA, cổng dịch vụ công cộng hoạt động.
*   **Hiệu suất và Bảo mật:** Thời gian tải trang nhanh, HTTPS được thực thi.

---

## Quy trình Sao lưu và Khôi phục

### Sao lưu

Sử dụng script `scripts/backup-database.sh` và lên lịch chạy hàng ngày bằng crontab.

### Khôi phục

*   **Rollback ứng dụng:** Sử dụng tag Docker của phiên bản trước đó hoặc rollback trên Vercel.
*   **Rollback cơ sở dữ liệu:** Áp dụng một migration "down" để hoàn tác các thay đổi hoặc khôi phục hoàn toàn từ một bản sao lưu.

---

## Giám sát và Bảo mật

*   **Giám sát:** Thiết lập health check endpoint, sử dụng các dịch vụ như UptimeRobot, và cấu hình log aggregation (ví dụ: ELK Stack).
*   **Bảo mật:** Bảo vệ biến môi trường, sử dụng các HTTP security header, kích hoạt RLS trên tất cả các bảng, và tăng cường bảo mật cho SSH và Docker.

**End of Deployment Guide**