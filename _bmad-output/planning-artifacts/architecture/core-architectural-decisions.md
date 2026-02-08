# Core Architectural Decisions

## Decision Priority Analysis

**Critical Decisions (Đã xác lập trong codebase):**
- Data architecture: Supabase PostgreSQL + generated types
- Authentication: Supabase Auth SSR + three-layer RBAC + RLS
- API layer: tRPC end-to-end type safety
- Frontend state: React Query + tRPC integration
- Deployment: Docker Compose self-hosted

**Important Decisions (Bổ sung):**
- Error monitoring: Sentry (free tier)

**Deferred Decisions (Post go-live):**
- CI/CD pipeline
- Automated testing strategy
- Server-side caching (nếu cần)

## Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Supabase PostgreSQL 17 (self-hosted) | RLS, generated types, Auth (GoTrue), Storage, PostgREST tích hợp |
| Data access | Supabase JS SDK — PostgREST client (`.from().select()` pattern) | Không ORM. Type-safe qua generated types. PostgREST tự động tạo REST API từ PostgreSQL schema |
| Type generation | `supabase gen types --local --lang typescript` → database.types.ts (127KB) | Single source of truth cho DB types. Cần thêm npm script |
| Validation | Zod schemas tại tRPC input | Shared validation giữa client/server |
| Caching | React Query (staleTime: 5s) — không server-side cache | Đủ cho ~20 concurrent users |
| Schema management | SQL files trong `supabase/schemas/` (100-999 ordering) — custom approach | Tổ chức theo logic domain, không dùng standard CLI timestamp migrations |
| Data immutability | Stock movements là immutable records | Audit trail chính xác, không sửa/xóa |

## Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth provider | Supabase Auth / GoTrue (email/password) | Tích hợp sẵn, JWT-based, session cookies qua @supabase/ssr |
| Session | HTTP-only cookies, auto-refresh trong middleware | Secure, không lưu token ở client. Middleware gọi `supabase.auth.getUser()` mỗi request |
| Authorization | Three-layer: UI route guards → tRPC middleware → RLS | Defense in depth |
| RBAC | 4 roles: admin > manager > technician/reception | Hierarchical, permission matrix. Custom roles trong `profiles` table |
| RLS | Database-level trên tất cả tables | Chống bypass từ API/direct DB access. Helper functions: `auth.uid()`, `auth.jwt()`, custom `has_any_role()`, `is_technician()` |
| Three-client pattern | 3 utility files trong `src/utils/supabase/` và `src/lib/supabase/` | Tách biệt rõ ràng server/browser/admin contexts |

**Chi tiết Three-Client Pattern:**

| File | Factory | Package | Vai trò |
|------|---------|---------|---------|
| `src/utils/supabase/server.ts` | `createServerClient()` | @supabase/ssr | Server Components, Route Handlers, Middleware — cookie-aware, per-request |
| `src/utils/supabase/client.ts` | `createBrowserClient()` | @supabase/ssr | Client Components — singleton, browser-side |
| `src/lib/supabase/server.ts` | `createClient()` (service role) | @supabase/supabase-js | Admin operations — bypass RLS, lazy-init Proxy pattern, `autoRefreshToken: false` |

## API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API framework | tRPC 11.6.0 | End-to-end type safety, no API docs cần thiết |
| Transport | HTTP batch link (/api/trpc) | Gom nhiều requests thành 1 round trip |
| Serialization | SuperJSON | Support Date, Map, Set types |
| Error handling | TRPCError với codes (UNAUTHORIZED, FORBIDDEN...) | Standardized, type-safe errors |
| Input validation | Zod schemas trên mỗi procedure | Runtime validation + TypeScript inference |
| Router organization | 18 domain routers trong _app.ts | 1 router per business domain |
| Service layer | Services cho business logic phức tạp (task-service, assignment-service) | Tách logic khỏi routers |
| Entity adapters | Polymorphic adapter pattern cho 5 entity types | Extensible task system không cần thay đổi schema |

## Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering | Client Components ("use client") cho auth pages, Server Components cho layout/auth check | SSR cho auth guard, CSR cho interactivity |
| State management | React Query via tRPC — không global state store | Server state là source of truth |
| Route organization | Route groups: (auth)/ và (public)/ | Tách biệt auth flow |
| Component library | shadcn/ui (copy-paste) + Radix primitives | Full control, accessible by default |
| Form management | React Hook Form + Zod resolvers | Performance (uncontrolled), type-safe validation |
| Data tables | TanStack Table với generic data-table component | Reusable, sort/filter/pagination |
| Hooks pattern | Domain hooks (useRole, useWorkflow, useWarehouse...) | Encapsulate tRPC calls + business logic |

## Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | Self-hosted server nội bộ (LAN) | Toàn quyền dữ liệu, không phụ thuộc cloud, no telemetry |
| Containerization | Docker Compose (~14 Supabase services + Next.js app) | Reproducible deployment — xem chi tiết bên dưới |
| Next.js output | Standalone mode (BUILD_STANDALONE=true) | Optimized Docker image |
| Public access | Caddy (public VPS) → Tailscale tunnel → internal machine | Auto-TLS (Let's Encrypt), data stays on-premise |
| Port (internal) | 3025 (Next.js app), 8000 (Kong API gateway) | Chỉ expose qua Tailscale, không expose ra internet |
| Port (local dev) | 3025 (Next.js), 54321 (Supabase API), 54322 (PostgreSQL), 54323 (Studio) | Supabase CLI local stack |
| Backup | `pg_dump` scheduled (cron) + volume backup | NFR13: 24h/lần, lưu 30 ngày |
| CI/CD | **Deferred** — Manual deployment hiện tại | Xem xét sau go-live |
| Error monitoring | **Sentry (free tier)** — xem chi tiết bên dưới | Error tracking, performance monitoring |

### Production Network Topology

```
┌─────────────────────────────────┐        ┌─────────────────────────────────────────────┐
│  Public VPS                     │        │  Internal Machine (LAN)                     │
│                                 │        │                                             │
│  Caddy (:80/:443)               │  TS    │  Tailscale node                             │
│  ├─ sc.sstc.cloud  → ts:3025  │◄──────►│  ├─ Next.js app (:3025)                    │
│  └─ spb.sstc.cloud  → ts:8000  │ tunnel  │  └─ Docker Compose (Supabase)              │
│                                 │        │     ├─ Kong (:8000) — API gateway           │
│  Tailscale node                 │        │     ├─ db (:5432)                           │
│                                 │        │     ├─ auth, rest, storage, ...             │
└─────────────────────────────────┘        │     └─ Studio (:3000) ← LAN/Tailscale only │
                                           └─────────────────────────────────────────────┘
```

**Request Flow:**
1. Browser → `https://sc.sstc.cloud` → Caddy (TLS termination) → Tailscale → Next.js (:3025)
2. Browser Supabase SDK → `https://spb.sstc.cloud` → Caddy → Tailscale → Kong (:8000) → auth/rest/storage
3. Next.js server-side → `http://localhost:8000` → Kong → auth/rest/storage (cùng máy, no tunnel)

**Tại sao topology này:**
- **Data on-premise:** Toàn bộ DB, files, services nằm trên máy nội bộ
- **Public VPS stateless:** Chỉ proxy, không lưu data, dễ thay thế
- **Caddy auto-TLS:** Let's Encrypt auto-renewal, zero-config HTTPS
- **Tailscale:** WireGuard-based, encrypted tunnel, zero-config NAT traversal, no port forwarding needed
- **Studio không expose:** Truy cập qua LAN trực tiếp hoặc Tailscale admin (không qua Caddy)

**Caddyfile (public VPS):**
```
sc.sstc.cloud {
    reverse_proxy {tailscale-ip}:3025
}

spb.sstc.cloud {
    reverse_proxy {tailscale-ip}:8000
}
```

**Environment variables liên quan:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://spb.sstc.cloud    # Browser SDK → Caddy → Kong
NEXT_PUBLIC_SUPABASE_ANON_KEY=...                   # Public anon key
SUPABASE_URL=http://localhost:8000                   # Server-side → Kong trực tiếp (no tunnel)
SUPABASE_SERVICE_ROLE_KEY=...                        # Server-side admin key
SITE_URL=https://sc.sstc.cloud                      # Auth redirects
API_EXTERNAL_URL=https://spb.sstc.cloud              # Supabase external API URL
```

## Sentry Integration

**Quyết định:** Tích hợp Sentry free tier cho error monitoring và performance tracking.

**Phạm vi tích hợp:**

1. **Client-side (Next.js Browser)**
   - Bắt unhandled errors, promise rejections
   - Performance tracing cho page loads, navigation
   - User context (role, userId) cho mỗi error report

2. **Server-side (Next.js Server / tRPC)**
   - Bắt server errors trong tRPC procedures
   - API response time tracking
   - Database query errors

3. **Cấu hình:**
   - `@sentry/nextjs` — SDK chính thức cho Next.js
   - DSN lưu trong environment variables
   - Source maps upload khi build production
   - Sample rate: 100% errors, 10% transactions (free tier limit)
   - Environments: `development`, `production`

4. **Privacy:**
   - Không gửi PII (tên khách hàng, SĐT, email)
   - Chỉ gửi: error message, stack trace, user role, request URL
   - `beforeSend` hook để scrub sensitive data

5. **Files cần tạo/sửa:**
   - `sentry.client.config.ts` — Browser SDK init
   - `sentry.server.config.ts` — Server SDK init
   - `sentry.edge.config.ts` — Edge runtime init
   - `next.config.ts` — Thêm withSentryConfig wrapper
   - `src/instrumentation.ts` — Next.js instrumentation hook
   - `.env` — Thêm `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

## Supabase Infrastructure

### Kiến Trúc Supabase Self-Hosted (Docker Compose)

Supabase self-hosted bao gồm ~14 services, mỗi service là một container Docker chuyên biệt:

| # | Service | Image | Vai trò |
|---|---------|-------|---------|
| 1 | **db** | supabase/postgres (PG 17) | PostgreSQL database — trung tâm dữ liệu, chứa tất cả extensions (pgcrypto, pgjwt, pg_graphql, pg_stat_statements...) |
| 2 | **kong** | kong:2.8.1 | API Gateway — single entry point, routing tất cả traffic đến internal services, xác thực qua key-auth + ACL |
| 3 | **auth** | supabase/gotrue | GoTrue — JWT-based authentication server, xử lý đăng nhập/đăng ký, OAuth, password recovery |
| 4 | **rest** | postgrest/postgrest | PostgREST — tự động tạo REST API từ PostgreSQL schema, respect RLS policies |
| 5 | **realtime** | supabase/realtime | Elixir/Phoenix server — WebSocket cho database change notifications, Broadcast, Presence |
| 6 | **storage** | supabase/storage-api | S3-compatible file storage, quản lý uploads/downloads, RLS trên `storage.objects` table |
| 7 | **imgproxy** | darthsim/imgproxy | Image transformation on-the-fly (resize, crop, format conversion) cho Storage |
| 8 | **meta** | supabase/postgres-meta | PostgreSQL metadata API — powers Studio UI (tables, columns, roles, extensions) |
| 9 | **functions** | supabase/edge-runtime | Deno-based Edge Runtime cho TypeScript/JavaScript serverless functions |
| 10 | **analytics** | supabase/logflare | Log management và event analytics |
| 11 | **vector** | timberio/vector | High-performance log collection pipeline, forwards đến Logflare |
| 12 | **studio** | supabase/studio | Web dashboard — SQL editor, table editor, auth management |
| 13 | **supavisor** | supabase/supavisor | Elixir-based connection pooler (thay PgBouncer): session mode (port 5432) + transaction mode (port 6543) |
| 14 | **mail** | (dev only) | SMTP server cho local dev email testing |

**Service Dependency Chain:**
```
db (PostgreSQL)
  ← supavisor (connection pooling)
  ← auth/GoTrue (depends on db)
  ← rest/PostgREST (depends on db)
  ← realtime (depends on db)
  ← storage (depends on db + imgproxy)
  ← meta (depends on db)
  ← analytics/logflare (depends on db)
  ← functions/edge-runtime (depends on analytics)
  ← vector (depends on analytics)
  ← kong (routes đến auth, rest, realtime, storage, meta, functions)
  ← studio (depends on analytics + meta)
```

**Optional services** (có thể disable nếu không cần):
- analytics + vector (log/analytics — tốn CPU/RAM)
- realtime (chưa sử dụng trong app)
- functions/edge-runtime (chưa có functions nào)
- imgproxy (nếu không cần image transformation)

### Kong API Gateway Routing (Production)

| Route | Service | Auth |
|-------|---------|------|
| `/auth/v1/*` | auth:9999 (GoTrue) | API key required |
| `/rest/v1/*` | PostgREST | API key required |
| `/realtime/v1/*` | realtime:4000 | API key required (WebSocket + HTTP) |
| `/storage/v1/*` | storage:5000 | Self-authenticated |
| `/functions/v1/*` | functions | Self-authenticated |
| `/pg/*` | meta:8080 | Admin only (service_role key) |
| `/` (root) | studio:3000 | HTTP basic auth (DASHBOARD_USERNAME/PASSWORD) |

**Consumers & ACL:**
- `anon` consumer → `anon` ACL group → limited access
- `service_role` consumer → `admin` ACL group → full access

### Supabase CLI — Local Development Workflow

**Cài đặt:** `supabase` package đã có trong devDependencies (^2.48.3).

**Local stack commands:**
```bash
supabase start          # Khởi động toàn bộ local stack (14 containers)
supabase stop           # Dừng stack, giữ data trong Docker volumes
supabase stop --no-backup  # Dừng + XÓA toàn bộ data
supabase status         # Hiển thị URLs, ports, keys
supabase status -o env  # Export env vars
```

**Local development URLs:**

| Service | URL | Port |
|---------|-----|------|
| API (PostgREST) | `http://localhost:54321` | 54321 |
| PostgreSQL | `postgresql://postgres:postgres@localhost:54322/postgres` | 54322 |
| Studio Dashboard | `http://localhost:54323` | 54323 |
| Mailpit (email testing) | `http://localhost:54324` | 54324 |
| Edge Functions | `http://localhost:54321/functions/v1/<name>` | via Kong |

**Workflow phát triển điển hình:**
```
Terminal 1: supabase start       → Local Supabase stack (port 54321-54328)
Terminal 2: pnpm dev             → Next.js dev server (port 3025)
Studio:     http://localhost:54323  → Visual DB admin
```

1. Sửa schema qua Studio hoặc SQL
2. Capture changes: `supabase db diff --local -f my_change`
3. Regenerate types: `supabase gen types --local --lang typescript > src/types/database.types.ts`
4. Reset nếu cần: `supabase db reset` (re-apply migrations + seed)

### Schema Management (Custom Approach)

Project này sử dụng **custom schema organization** thay vì standard CLI timestamp migrations:

```
supabase/
├── config.toml                    # Supabase local config (PG 17, 4 storage buckets)
├── schemas/                       # Custom SQL schema files (ordered 100-999)
│   ├── 1xx_*.sql                 # Core: enums, base functions, core tables
│   ├── 2xx_*.sql                 # Domain: tickets, tasks, warehouses, requests, inventory
│   ├── 3xx_*.sql                 # Relations: foreign keys, virtual warehouse links
│   ├── 5xx_*.sql                 # Functions: inventory ops, warehouse ops, audit
│   ├── 6xx_*.sql                 # Triggers: stock, default warehouse, serial count
│   ├── 7xx_*.sql                 # Views: reporting, task statistics
│   ├── 8xx_*.sql                 # RLS policies: core, phase2, storage
│   └── 9xx_*.sql                 # Seed data: warehouses, sample tasks, workflows
├── migrations/                    # Standard CLI migrations (currently empty)
├── storage/                       # Local storage bucket data
└── snippets/                      # SQL snippets
```

**Lưu ý:** `config.toml` có `schema_paths = []` — schema files trong `schemas/` được apply thủ công hoặc qua `db reset`, không tự động qua CLI migration system.

### Type Generation

**Command:** `supabase gen types --local --lang typescript > src/types/database.types.ts`

**Output:** File `database.types.ts` (~127KB) chứa:
- Tất cả table Row/Insert/Update types
- Database enums (task_status, entity_type, roles...)
- Database functions signatures
- GraphQL schema types

**TODO:** Cần thêm npm script vào `package.json`:
```json
{
  "scripts": {
    "gen:types": "supabase gen types --local --lang typescript > src/types/database.types.ts"
  }
}
```

### Storage Configuration

4 buckets cấu hình trong `supabase/config.toml`:

| Bucket | Public | Max Size | MIME Types | Dùng cho |
|--------|--------|----------|------------|----------|
| `avatars` | Yes | 5MB | image/* | User profile pictures |
| `product_images` | Yes | 5MB | image/* | Product catalog images |
| `service_media` | Yes | 10MB | image/* | Service ticket attachments |
| `service_videos` | Yes | 200MB | video/mp4, quicktime, webm | Task video recordings |

**RLS Storage Policies** (trong `supabase/schemas/802_storage_policies.sql`):
- `avatars`: Users upload/delete own, all can read
- `product_images`: Owner can manage, all read
- `service_media`: Authenticated upload/read
- `service_videos`: Authenticated upload/read

### Realtime & Edge Functions (Available, Chưa Sử Dụng)

**Realtime:** Infrastructure enabled (`realtime.enabled = true` trong config.toml), nhưng codebase chưa có subscriptions. Potential uses:
- Live task status updates
- Real-time inventory changes
- Notification broadcasts

**Edge Functions:** Edge Runtime enabled (`edge_runtime.enabled = true`), nhưng chưa có functions nào. Potential uses:
- Email notification sending (thay vì từ Next.js server)
- Webhook receivers
- Scheduled jobs (via pg_cron + HTTP call)

### Production Deployment Checklist

**Internal machine (LAN):**
1. Đổi TẤT CẢ default secrets: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DASHBOARD_PASSWORD`, `SECRET_KEY_BASE`, `VAULT_ENC_KEY`
2. Cấu hình SMTP thật (thay `supabase-mail` dev server)
3. Disable services không cần: analytics, vector (tốn CPU/RAM), realtime, edge-runtime
4. Cấu hình `pg_dump` cron job cho database backup
5. Install Tailscale, join tailnet, note Tailscale IP
6. Set `SUPABASE_URL=http://localhost:8000` cho server-side (internal, no tunnel)
7. Set `NEXT_PUBLIC_SUPABASE_URL=https://spb.sstc.cloud` cho browser SDK (qua Caddy)

**Public VPS:**
1. Install Caddy + Tailscale
2. Join cùng tailnet với internal machine
3. Cấu hình Caddyfile: `sc.sstc.cloud` → `{tailscale-ip}:3025`, `spb.sstc.cloud` → `{tailscale-ip}:8000`
4. Caddy auto-provisions TLS certificates (Let's Encrypt)

**Environment variables production (`.env.docker` — internal machine):**

| Variable | Mô tả |
|----------|-------|
| `POSTGRES_PASSWORD` | Database password (thay default) |
| `JWT_SECRET` | JWT signing secret (≥32 chars) |
| `ANON_KEY` | JWT token với role=anon (public API key) |
| `SERVICE_ROLE_KEY` | JWT token với role=service_role (bypass RLS) |
| `SECRET_KEY_BASE` | Realtime/Supavisor comms (≥64 chars) |
| `VAULT_ENC_KEY` | Config encryption (exactly 32 chars) |
| `DASHBOARD_USERNAME/PASSWORD` | Studio HTTP basic auth |
| `SITE_URL` | `https://sc.sstc.cloud` (auth redirects, qua Caddy) |
| `API_EXTERNAL_URL` | `https://spb.sstc.cloud` (browser SDK endpoint, qua Caddy) |
| `SUPABASE_URL` | `http://localhost:8000` (server-side internal, không qua tunnel) |
| `SMTP_HOST/PORT/USER/PASS` | Production SMTP server |

**Generate secrets:**
```bash
openssl rand -base64 48    # SECRET_KEY_BASE
openssl rand -hex 16       # VAULT_ENC_KEY (32 chars)
# ANON_KEY và SERVICE_ROLE_KEY: JWT tokens signed với JWT_SECRET tại jwt.io
```

## Decision Impact Analysis

**Implementation Sequence:**
1. Sentry integration (độc lập, không ảnh hưởng code hiện tại)
2. Các decisions còn lại đã triển khai trong codebase

**Cross-Component Dependencies:**
- Sentry client config phụ thuộc Next.js config (withSentryConfig wrapper)
- Sentry server config cần access tRPC context cho user info
- Source maps cần SENTRY_AUTH_TOKEN trong build process
