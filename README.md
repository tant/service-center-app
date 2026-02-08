# Service Center Management (SSTC)

Hệ thống quản lý trung tâm bảo hành — quản lý phiếu yêu cầu, phiếu dịch vụ, task workflow, kho linh kiện, và serial tracking cho đội ngũ ~20 nhân viên nội bộ + cổng tra cứu công khai cho khách hàng.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| UI | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) + [Tailwind CSS 4](https://tailwindcss.com/) |
| API | [tRPC 11](https://trpc.io/) (end-to-end type safety, HTTP batch link) |
| Database | [Supabase](https://supabase.com/) self-hosted (PostgreSQL 17, PostgREST, GoTrue Auth, Storage) |
| State | [React Query](https://tanstack.com/query) via tRPC — server state as source of truth |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Charts | [Recharts](https://recharts.org/) |
| Linter | [Biome 2](https://biomejs.dev/) |
| Package Manager | [pnpm](https://pnpm.io/) |

## Features

### Cổng Công Khai (Public)
- Tạo phiếu yêu cầu bảo hành (không cần đăng nhập)
- Tra cứu trạng thái phiếu qua tracking token
- Hủy đăng ký email notification

### Quản Lý Vận Hành (Staff)
- **Phiếu yêu cầu** — Tiếp nhận, xác nhận, từ chối, chuyển đổi thành phiếu dịch vụ (7 trạng thái)
- **Phiếu dịch vụ** — Workflow sửa chữa với task system, 3 kết quả (repaired / warranty replacement / unrepairable)
- **Task & Workflow** — Template-based tasks, polymorphic (5 entity types), strict/flexible sequence, drag & drop
- **Kho & Serial** — 7 kho ảo, nhập/xuất/chuyển kho, serial tracking lifecycle, immutable stock movements
- **RMA** — Quản lý lô RMA, gom serial từ rma_staging, 4 trạng thái, tracking number
- **Giao hàng** — Xác nhận bàn giao, chữ ký khách hàng, bulk operations
- **Danh mục** — Sản phẩm, linh kiện, thương hiệu, product-parts mapping (N:M)
- **Khách hàng** — CRUD, tìm kiếm, auto-fill theo SĐT

### Dashboard & Analytics
- Tổng quan phiếu dịch vụ, task progress
- Doanh thu analytics
- Email notification log

### Phân Quyền & Bảo Mật
- 4 vai trò: Admin > Manager > Technician / Reception
- Three-layer authorization: UI guards → tRPC middleware → PostgreSQL RLS
- Audit logging cho mọi thay đổi quan trọng

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9
- **Docker** (cho Supabase local stack)
- **Supabase CLI** (đã có trong devDependencies)

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/tant/service-center-app.git
cd service-center-app
pnpm install
```

### 2. Start Supabase Local Stack

```bash
pnpx supabase start
```

Sau khi khởi động xong (~14 containers), lưu lại output chứa API URL, anon key, service role key.

| Service | URL |
|---------|-----|
| API (PostgREST) | http://localhost:54321 |
| PostgreSQL | localhost:54322 |
| Studio | http://localhost:54323 |
| Mailpit (email) | http://localhost:54324 |

### 3. Configure Environment

```bash
cp .env.example .env
```

Cập nhật `.env` với giá trị từ `supabase start` output:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SETUP_PASSWORD=your_secure_password
```

### 4. Apply Database Schema

Schema files nằm trong `supabase/schemas/` (ordered 100-999):

```bash
# Apply tất cả schema files theo thứ tự
pnpx supabase db reset
```

### 5. Start Development Server

```bash
pnpm dev
```

App chạy tại **http://localhost:3025**.

### 6. Initial Setup

Truy cập **http://localhost:3025/setup** để tạo tài khoản admin đầu tiên (cần `SETUP_PASSWORD`).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Protected routes (sidebar layout, auth guard)
│   ├── (public)/          # Public routes (login, service request, tracking)
│   └── api/trpc/          # tRPC HTTP handler
├── components/            # React components
│   ├── ui/                # shadcn/ui primitives (~40 components)
│   ├── forms/             # Form components
│   ├── inventory/         # Inventory domain
│   ├── tasks/             # Task domain
│   ├── workflows/         # Workflow domain
│   └── dashboard/         # Dashboard widgets
├── server/                # Backend logic
│   ├── routers/           # tRPC routers (18 domain routers)
│   ├── services/          # Business logic (task-service, entity-adapters)
│   ├── middleware/         # requireRole, requireAdmin
│   └── utils/             # auditLog, auto-comment
├── hooks/                 # Custom React hooks (use-role, use-workflow, etc.)
├── types/                 # TypeScript definitions (database.types.ts auto-generated)
├── constants/             # App constants
├── lib/supabase/          # Admin client (service role, bypass RLS)
└── utils/supabase/        # Browser client, server client, middleware
```

```
supabase/
├── config.toml            # Supabase CLI config (PG 17, 4 storage buckets)
└── schemas/               # SQL schema files (ordered 100-999)
    ├── 1xx_*.sql          # Core: enums, functions, tables
    ├── 2xx_*.sql          # Domain: tickets, tasks, warehouses, inventory
    ├── 3xx_*.sql          # Relations: foreign keys
    ├── 5xx_*.sql          # Functions: inventory ops, audit
    ├── 6xx_*.sql          # Triggers: stock, serial count
    ├── 7xx_*.sql          # Views: reporting, statistics
    ├── 8xx_*.sql          # RLS policies
    └── 9xx_*.sql          # Seed data
```

## Development Workflow

### Supabase CLI Commands

```bash
pnpx supabase start           # Start local stack
pnpx supabase stop            # Stop (keep data)
pnpx supabase stop --no-backup # Stop + delete data
pnpx supabase status          # Show URLs & keys
pnpx supabase db reset        # Re-apply schemas + seeds
pnpx supabase db diff --local -f my_change  # Capture schema changes
```

### Type Generation

```bash
pnpx supabase gen types --local --lang typescript > src/types/database.types.ts
```

### Lint & Format

```bash
pnpm lint                 # Biome check
pnpm format               # Biome format --write
```

### Build

```bash
pnpm build                # Next.js production build
pnpm start                # Start production server (port 3025)
```

## Production Deployment

### Network Topology

```
┌────────────────────────┐        ┌────────────────────────────────────┐
│  Public VPS            │        │  Internal Machine (LAN)            │
│                        │  TS    │                                    │
│  Caddy (:80/:443)      │◄──────►│  Tailscale node                   │
│  ├─ sc.sstc.cloud      │ tunnel │  ├─ Next.js app (:3025)           │
│  └─ spb.sstc.cloud     │        │  └─ Docker Compose (Supabase)     │
│                        │        │     ├─ Kong (:8000)               │
│  Tailscale node        │        │     ├─ PostgreSQL (:5432)         │
│                        │        │     ├─ Auth, REST, Storage, ...   │
└────────────────────────┘        │     └─ Studio (:3000) ← LAN only │
                                  └────────────────────────────────────┘
```

- **sc.sstc.cloud** — Next.js app (qua Caddy → Tailscale → port 3025)
- **spb.sstc.cloud** — Supabase API (qua Caddy → Tailscale → Kong port 8000)
- **Studio** — Chỉ truy cập qua LAN hoặc Tailscale trực tiếp (không expose qua Caddy)

### Key Environment Variables (Production)

```env
# Browser SDK → Caddy → Kong
NEXT_PUBLIC_SUPABASE_URL=https://spb.sstc.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Server-side → Kong direct (internal, no tunnel)
SUPABASE_URL=http://localhost:8000
SUPABASE_SERVICE_ROLE_KEY=...

# Auth & external URLs
SITE_URL=https://sc.sstc.cloud
API_EXTERNAL_URL=https://spb.sstc.cloud
```

### Docker Build

```bash
BUILD_STANDALONE=true pnpm build   # Standalone output for Docker
```

## Supabase Storage Buckets

| Bucket | Public | Max Size | MIME Types | Purpose |
|--------|--------|----------|------------|---------|
| `avatars` | Yes | 5MB | image/* | Profile pictures |
| `product_images` | Yes | 5MB | image/* | Product catalog |
| `service_media` | Yes | 10MB | image/* | Ticket attachments |
| `service_videos` | Yes | 200MB | video/* | Task video recordings |

## License

[MIT](LICENSE) &copy; 2025 Tan Tran
