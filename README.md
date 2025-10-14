# Hệ Thống Quản Lý Trung Tâm Bảo Hành

Ứng dụng quản lý trung tâm bảo hành full-stack được xây dựng với Next.js, Supabase và tRPC để quản lý phiếu bảo hành, kho linh kiện, khách hàng và sản phẩm.

## Tổng Quan

Ứng dụng này giúp các trung tâm bảo hành quản lý hoạt động hàng ngày bao gồm theo dõi khách hàng, quản lý kho sản phẩm, quy trình xử lý phiếu bảo hành và quản lý linh kiện. Được xây dựng với các công nghệ web hiện đại để đảm bảo độ tin cậy và khả năng mở rộng.

## Tính Năng Chính

- 🎫 **Quản Lý Phiếu Bảo Hành** - Quy trình hoàn chỉnh từ tiếp nhận đến hoàn thành với theo dõi trạng thái
- 📦 **Quản Lý Kho Linh Kiện** - Theo dõi tồn kho thời gian thực với cập nhật số lượng tự động
- 👥 **Quản Lý Khách Hàng** - Cơ sở dữ liệu khách hàng đầy đủ với lịch sử bảo hành
- 🛠️ **Danh Mục Sản Phẩm** - Quản lý sản phẩm với quan hệ linh kiện tương thích
- 👤 **Phân Quyền Theo Vai Trò** - Bốn loại vai trò: Quản trị viên, Quản lý, Kỹ thuật viên và Lễ tân
- 💾 **Lưu Trữ File** - Upload bảo mật cho ảnh đại diện, hình ảnh sản phẩm và tài liệu bảo hành
- 📊 **Cập Nhật Thời Gian Thực** - Đồng bộ dữ liệu trực tiếp được hỗ trợ bởi Supabase
- 🔒 **Row-Level Security** - Kiểm soát truy cập cấp độ cơ sở dữ liệu để bảo vệ dữ liệu

## Công Nghệ Sử Dụng

### Frontend
- **Framework**: Next.js 15.5 với App Router và Turbopack
- **UI Library**: React 19 với TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Type Safety**: Type-safe hoàn toàn với tRPC

### Backend
- **API**: tRPC cho các API route type-safe
- **Database**: PostgreSQL thông qua Supabase
- **Authentication**: Supabase Auth với JWT
- **Storage**: Supabase Storage cho upload file
- **Real-time**: Supabase Realtime subscriptions

### Công Cụ Phát Triển
- **Build Tool**: Turbopack (Next.js 15)
- **Package Manager**: pnpm
- **Linting/Formatting**: Biome
- **Database Migrations**: Supabase CLI với declarative schemas
- **Local Development**: Docker-based Supabase local stack

## Bắt Đầu Nhanh

Xem [DEVELOPMENT.md](./DEVELOPMENT.md) để biết hướng dẫn cài đặt chi tiết.

```bash
# Clone và cài đặt
git clone https://github.com/tant/service-center-app
cd service-center-app
pnpm install

# Thiết lập môi trường
cp .env.example .env

# Khởi động Supabase và thiết lập database
pnpx supabase start
./docs/data/schemas/setup_schema.sh

# Khởi động development server
pnpm dev
```

Truy cập `http://localhost:3025` và hoàn tất cài đặt tại endpoint `/setup`.

## Cấu Trúc Dự Án

```
service-center/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Protected routes (yêu cầu đăng nhập)
│   │   ├── (public)/          # Public routes (công khai)
│   │   └── api/               # tRPC API routes
│   ├── components/            # React components
│   ├── lib/                   # Utilities và configurations
│   └── hooks/                 # Custom React hooks
├── docs/
│   └── data/
│       ├── schemas/           # Định nghĩa database schema
│       └── seeds/             # Scripts seed data
├── supabase/                  # Cấu hình Supabase
│   ├── config.toml
│   └── migrations/           # Generated migrations
└── .env                      # Environment variables (git-ignored)
```

## Database Schema

Các entity chính và quan hệ của chúng:

- **Users & Auth**: Bảng `profiles` mở rộng từ Supabase Auth
- **Dữ Liệu Kinh Doanh**: `customers`, `products`, `parts`
- **Quy Trình Bảo Hành**: `service_tickets`, `service_ticket_parts`, `service_ticket_comments`
- **Quan Hệ**: `product_parts` (many-to-many)

Tất cả các bảng bao gồm:
- Timestamps tự động (`created_at`, `updated_at`)
- Audit trails (`created_by`, `updated_by`)
- Row-Level Security (RLS) policies
- Indexes được tối ưu hóa cho hiệu suất

## Tài Liệu

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Hướng dẫn thiết lập môi trường phát triển và đóng góp
- **[docs/data/schemas/README.md](./docs/data/schemas/README.md)** - Tài liệu database schema
- **[CLAUDE.md](./CLAUDE.md)** - Hướng dẫn cho Claude Code AI assistant

## Triển Khai

### Yêu Cầu
- Tài khoản Supabase ([đăng ký](https://supabase.com))
- Nền tảng hosting (Vercel, Railway, v.v.)

### Các Bước
1. Tạo Supabase project và ghi nhận thông tin xác thực
2. Liên kết local project: `pnpx supabase link --project-ref <ref>`
3. Push schema: `pnpx supabase db push`
4. Deploy frontend lên nền tảng hosting
5. Cấu hình environment variables

Xem [DEVELOPMENT.md](./DEVELOPMENT.md#production-deployment) để biết hướng dẫn triển khai chi tiết.

## Hỗ Trợ & Đóng Góp

- **Issues**: Báo cáo lỗi hoặc yêu cầu tính năng qua GitHub Issues
- **Đóng góp**: Xem [DEVELOPMENT.md](./DEVELOPMENT.md) để biết hướng dẫn đóng góp
- **Câu hỏi**: Liên hệ với đội ngũ phát triển

## License

Dự án này được cấp phép theo MIT License - xem file [LICENSE](./LICENSE) để biết chi tiết.

---

**Được phát triển với ❤️ để quản lý trung tâm bảo hành hiệu quả**
