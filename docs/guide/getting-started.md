# Hướng dẫn khởi động dự án Service Center App

Tài liệu dành cho developer mới tham gia dự án.

## Yêu cầu hệ thống

- **Node.js** >= 18
- **pnpm** (package manager)
- **Docker** (cần thiết để chạy Supabase local)
- **Git**

Kiểm tra nhanh:

```bash
node -v
pnpm -v
docker --version
```

## Bước 1: Clone repo và cài dependencies

```bash
git clone <repo-url>
cd service-center-app
pnpm install
```

## Bước 2: Cấu hình biến môi trường

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Tạm thời giữ nguyên các giá trị mặc định. Sau khi chạy Supabase ở bước 3, bạn sẽ cập nhật lại các key.

## Bước 3: Khởi động Supabase

```bash
pnpx supabase start
```

Lệnh này sẽ pull Docker images (lần đầu mất vài phút) và khởi động các service: PostgreSQL, Auth, Storage, Studio...

Sau khi hoàn tất, terminal sẽ hiển thị thông tin kết nối. **Cập nhật file `.env`** với các giá trị từ output:

| Output của Supabase      | Biến trong `.env`                  |
| ------------------------ | ---------------------------------- |
| Publishable key          | `NEXT_PUBLIC_SUPABASE_ANON_KEY`    |
| Secret key               | `SUPABASE_SERVICE_ROLE_KEY`        |
| S3 Access Key            | `S3_ACCESS_KEY`                    |

Giá trị `NEXT_PUBLIC_SUPABASE_URL` giữ nguyên `http://127.0.0.1:54321`.

## Bước 4: Apply database schema

Schema không được quản lý qua migrations mà qua các file SQL trong `docs/data/schemas/`. Chạy script sau để apply toàn bộ:

```bash
./docs/data/schemas/setup_schema.sh
```

Script này sẽ tạo toàn bộ bảng, enum, function, trigger, RLS policy và seed data.

## Bước 5: Khởi động dev server

```bash
pnpm dev
```

App chạy tại: **http://localhost:3025**

Nếu muốn vừa xem log trực tiếp vừa lưu ra file:

```bash
pnpm dev 2>&1 | tee /tmp/sstc.log
```

## Bước 6: Tạo tài khoản admin

Sau khi dev server chạy, truy cập **http://localhost:3025/setup** để tạo tài khoản admin đầu tiên.

- Nhập **Setup Password** (giá trị `SETUP_PASSWORD` trong `.env`)
- Hệ thống sẽ tạo user admin với thông tin từ `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` trong `.env`

Sau khi setup xong, đăng nhập tại **http://localhost:3025/login** với email/password vừa cấu hình.

> **Lưu ý:** Mỗi khi reset database (`supabase db reset` hoặc `supabase stop` rồi `start` lại), bạn cần vào `/setup` để tạo lại tài khoản admin.

## Bước 7: Truy cập Supabase Studio (tuỳ chọn)

Supabase Studio cho phép xem/quản lý database trực tiếp trên trình duyệt:

- **Studio:** http://127.0.0.1:54323
- **Mailpit** (xem email test): http://127.0.0.1:54324

---

## Các lệnh thường dùng

### Development

| Lệnh          | Mô tả                        |
| -------------- | ----------------------------- |
| `pnpm dev`     | Chạy dev server (port 3025)   |
| `pnpm build`   | Build production              |
| `pnpm lint`    | Kiểm tra linting (Biome)     |
| `pnpm format`  | Auto-format code (Biome)      |

### Supabase

| Lệnh                               | Mô tả                                    |
| ----------------------------------- | ----------------------------------------- |
| `pnpx supabase start`              | Khởi động Supabase                        |
| `pnpx supabase stop`               | Dừng Supabase                             |
| `pnpx supabase status`             | Xem trạng thái và thông tin kết nối       |
| `pnpx supabase db reset`           | Reset database (xoá toàn bộ dữ liệu)     |
| `./docs/data/schemas/setup_schema.sh` | Apply schema từ file SQL                |

## Xử lý sự cố

### Port 3025 đã bị chiếm

```bash
# Tìm và kill process đang dùng port 3025
fuser -k 3025/tcp
# Sau đó chạy lại
pnpm dev
```

### Migration lỗi khi `supabase start`

Nếu có migration trong `supabase/migrations/` bị conflict với schema files, xoá file migration gây lỗi rồi chạy lại:

```bash
# Xem danh sách migrations
ls supabase/migrations/
# Xoá migration lỗi
rm supabase/migrations/<tên-file>.sql
# Chạy lại
pnpx supabase start
```

### Khi nào cần `supabase db reset`?

- Migration bị lỗi hoặc conflict nghiêm trọng
- Database bị hỏng, dữ liệu không nhất quán
- Muốn xoá sạch dữ liệu và bắt đầu lại

Sau khi reset, cần chạy lại `setup_schema.sh` và vào `/setup` để tạo admin.

### Đăng nhập báo "Invalid login credentials"

Tài khoản admin chưa được tạo hoặc đã bị xoá do reset database. Truy cập `/setup` để tạo lại.
