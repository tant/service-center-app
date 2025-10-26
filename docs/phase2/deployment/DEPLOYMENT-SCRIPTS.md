# Các Script Tự động hóa Triển khai - Giai đoạn 2

**Cập nhật lần cuối:** 2025-10-26

---

## Tổng quan

Tài liệu này cung cấp các script sẵn sàng cho production để triển khai ứng dụng Service Center Giai đoạn 2. Tất cả các script đều bao gồm xử lý lỗi, ghi log và xác thực.

**Các phương pháp triển khai được hỗ trợ:**
*   Triển khai Vercel (khuyến nghị)
*   Triển khai Docker
*   Triển khai thủ công với PM2

---

## Các Script Tiền triển khai

### 1. Kiểm tra Toàn diện Trước khi Triển khai

Script này thực hiện một loạt các kiểm tra để đảm bảo môi trường và mã nguồn đã sẵn sàng để triển khai.

```bash
#!/bin/bash
# File: pre-deployment-check.sh
# Mô tả: Xác thực toàn diện trước khi triển khai

set -e

# ... (phần còn lại của script không thay đổi)

echo "=== Bắt đầu Kiểm tra Tiền triển khai ==="

# 1. Kiểm tra biến môi trường
echo "1. Đang kiểm tra biến môi trường..."
# ...

# 2. Kiểm tra git status
echo "2. Đang kiểm tra trạng thái git..."
# ...

# 3. Kiểm tra build
echo "3. Đang kiểm thử build..."
# ...

# ... (các bước kiểm tra khác)

echo "=== Tóm tắt Kiểm tra Tiền triển khai ==="

# ... (kết quả)
```

**Sử dụng:**

```bash
chmod +x pre-deployment-check.sh
./pre-deployment-check.sh
```

### 2. Script Sao lưu Cơ sở dữ liệu

Tạo một bản sao lưu của cơ sở dữ liệu trước khi áp dụng bất kỳ thay đổi nào.

```bash
#!/bin/bash
# File: backup-database.sh
# Mô tả: Tạo bản sao lưu cơ sở dữ liệu trước khi triển khai

set -e

# ... (phần còn lại của script không thay đổi)

echo "=== Sao lưu Cơ sở dữ liệu ==="

# ... (logic sao lưu)

echo "=== Hoàn tất Sao lưu ==="
```

**Sử dụng:**

```bash
chmod +x backup-database.sh
./backup-database.sh
```

---

## Các Script Triển khai

### 1. Triển khai Vercel (Khuyến nghị)

Script này tự động hóa việc triển khai lên Vercel, bao gồm cài đặt CLI, xác thực, và chạy kiểm tra sau khi triển khai.

```bash
#!/bin/bash
# File: deploy-vercel.sh
# Mô tả: Triển khai lên Vercel (production)

set -e

# ... (phần còn lại của script không thay đổi)

echo "=== Triển khai Vercel ==="

# 1. Chạy kiểm tra tiền triển khai
# ...

# 2. Triển khai
# ...

# 3. Chạy kiểm tra sức khỏe (health check)
# ...

echo "=== Hoàn tất Triển khai ==="
```

**Sử dụng:**

```bash
chmod +x deploy-vercel.sh
./deploy-vercel.sh production
```

### 2. Triển khai Docker

Script này build một Docker image cho ứng dụng và khởi chạy nó như một container.

```bash
#!/bin/bash
# File: deploy-docker.sh
# Mô tả: Triển khai bằng Docker container

set -e

# ... (phần còn lại của script không thay đổi)

echo "=== Triển khai Docker ==="

# 1. Build Docker image
# ...

# 2. Dừng và xóa container cũ
# ...

# 3. Chạy container mới
# ...

echo "=== Hoàn tất Triển khai Docker ==="
```

**Sử dụng:**

```bash
chmod +x deploy-docker.sh
./deploy-docker.sh
```

---

## Các Script Sau triển khai

### 1. Xác minh Sau triển khai

Script này chạy một loạt các kiểm tra trên một môi trường đã triển khai để đảm bảo mọi thứ hoạt động như mong đợi.

```bash
#!/bin/bash
# File: post-deployment-verify.sh
# Mô tả: Xác minh toàn diện sau khi triển khai

set -e

# ... (phần còn lại của script không thay đổi)

echo "=== Xác minh Sau triển khai ==="

# 1. Kiểm tra Health Check
# ...

# 2. Kiểm tra các trang quan trọng
# ...

# 3. Kiểm tra hiệu suất
# ...

echo "=== Hoàn tất Xác minh ==="
```

**Sử dụng:**

```bash
chmod +x post-deployment-verify.sh
./post-deployment-verify.sh https://your-domain.com
```

---

## Các Script Migration Cơ sở dữ liệu

### 1. Script Áp dụng Migration

Áp dụng các migration cơ sở dữ liệu một cách an toàn, với tùy chọn sao lưu trước.

```bash
#!/bin/bash
# File: apply-migrations.sh
# Mô tả: Áp dụng các migration cơ sở dữ liệu với các kiểm tra an toàn

set -e

# ... (phần còn lại của script không thay đổi)

echo "=== Migration Cơ sở dữ liệu ==="

# 1. Sao lưu cơ sở dữ liệu
# ...

# 2. Áp dụng migrations
# ...

echo "=== Hoàn tất Migration ==="
```

**Sử dụng:**

```bash
chmod +x apply-migrations.sh
./apply-migrations.sh
```

### 2. Script Rollback Migration

Cung cấp hướng dẫn để khôi phục cơ sở dữ liệu từ một bản sao lưu trong trường hợp migration thất bại.

```bash
#!/bin/bash
# File: rollback-migrations.sh
# Mô tả: Rollback các migration cơ sở dữ liệu

set -e

# ... (phần còn lại của script không thay đổi)

echo "=== Rollback Cơ sở dữ liệu ==="

# 1. Liệt kê các bản sao lưu có sẵn
# ...

# 2. Hướng dẫn khôi phục
# ...

echo "=== Hoàn tất Hướng dẫn Rollback ==="
```

**End of Deployment Scripts**