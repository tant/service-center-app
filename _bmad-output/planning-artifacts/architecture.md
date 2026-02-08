---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-service-center-app-2026-02-08.md
  - _bmad-output/bmb-creations/service-center-app-workflow-analysis.md
  - (codebase analysis - current source code)
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-08'
project_name: 'service-center-app'
user_name: 'Tan'
date: '2026-02-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
80 FRs phân bổ vào 10 domain modules — phản ánh hệ thống quản lý trung tâm bảo hành toàn diện thay thế Frappe/ERPNext. Các FRs đã được triển khai gần như đầy đủ trong codebase hiện tại (329 TypeScript files, 179 React components, 19+ tRPC routers).

| Domain | FRs | Architectural Impact |
|--------|-----|---------------------|
| Quản lý danh mục | FR1-FR5 | CRUD cơ bản, product-parts mapping N:M |
| Quản lý kho | FR6-FR15 | 7 virtual warehouses, immutable stock movements, serial tracking — domain logic phức tạp nhất |
| Khách hàng | FR16-FR18 | CRUD + auto-fill, phone uniqueness constraint |
| Phiếu yêu cầu | FR19-FR28 | 7 states, public portal, tracking token, workflow integration |
| Phiếu dịch vụ | FR29-FR41 | Task-based workflow, cost calculation, automatic stock movements on status change |
| Task & Workflow | FR42-FR51 | Polymorphic tasks (5 entity types), workflow templates, strict/flexible sequence |
| RMA | FR52-FR56 | Batch management, auto-numbering, serial gom lô |
| Email | FR57-FR65 | 6 templates, retry, rate limiting, tracking, unsubscribe |
| Dashboard | FR66-FR69 | Analytics, notifications, task progress |
| Phân quyền & Audit | FR70-FR77 | RBAC 4 roles, RLS database-level, audit log mọi thao tác |

**Non-Functional Requirements:**
- **Hiệu năng:** API < 500ms (P95), page load < 3s, ~20 concurrent users
- **Bảo mật:** HTTPS, RLS, RBAC, audit logging, rate limiting, CSRF/XSS prevention
- **Độ tin cậy:** 99% uptime giờ làm việc, backup 24h/lần, immutable stock movements
- **Bảo trì:** TypeScript strict mode, migration scripts, developer onboarding < 1 ngày
- **Ngôn ngữ:** Chỉ tiếng Việt — không cần i18n framework

**Scale & Complexity:**
- Primary domain: Full-stack web application (SPA + SSR hybrid)
- Complexity level: Medium-High (nghiệp vụ phức tạp, quy mô user nhỏ)
- Estimated architectural components: ~15 major modules
- Deployment: Self-hosted server nội bộ

### Technical Constraints & Dependencies

| Constraint | Impact |
|-----------|--------|
| Brownfield — code đã triển khai ~90%+ | Architecture phải phản ánh reality, không phải lý thuyết |
| Self-hosted deployment | Không dùng cloud-managed services ngoài Supabase |
| ~20 concurrent users | Không cần horizontal scaling, caching strategy đơn giản |
| Chỉ tiếng Việt | Không cần i18n abstraction layer |
| Supabase PostgreSQL | RLS policies, generated types, Auth, Storage — locked-in |
| tRPC 11.6.0 | End-to-end type safety, batch requests, no REST/GraphQL |
| Next.js 16 App Router | Server Components, Route Groups, Middleware |

### Cross-Cutting Concerns Identified

1. **Authentication & Authorization** — Supabase Auth (session cookies) → middleware → tRPC context → RLS. Enforced ở 3 layers: UI (route guards), API (role middleware), DB (RLS policies).

2. **Audit Logging** — Mọi thao tác quan trọng (CRUD, login, role change, stock movement, status change) được ghi log với user_id, action, old/new values, IP, timestamp.

3. **Stock Movement Automation** — Khi status phiếu dịch vụ thay đổi, hệ thống tự động tạo stock movements giữa virtual warehouses. Business rules phức tạp, immutable records.

4. **Email Notification Pipeline** — 6 templates, retry mechanism, rate limiting (100/ngày), tracking status (pending/sent/failed/bounced), unsubscribe.

5. **Polymorphic Task Lifecycle** — Tasks gắn vào 5 entity types khác nhau qua Entity Adapter pattern. Workflow templates define task sequences. Task status transitions có validation rules.

6. **Error Handling & Logging** — Request tracking IDs, comprehensive logging ở middleware/tRPC/services, user-friendly error messages.

7. **Data Validation** — Zod schemas ở tRPC input validation + React Hook Form ở client, ensuring consistent validation cả 2 đầu.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application (SPA + SSR hybrid) — brownfield project đã triển khai ~90%+. Tech stack đã xác lập, document này ghi nhận và đánh giá tính phù hợp.

### Tech Stack Đã Xác Lập

| Layer | Technology | Version | Vai Trò |
|-------|-----------|---------|---------|
| Framework | Next.js App Router | 16.1.6 | SSR/SSG cho public, CSR cho auth pages |
| UI Library | React | 19.2.4 | Component rendering, hooks |
| Language | TypeScript strict | ^5 | Type safety toàn codebase |
| API Layer | tRPC | 11.6.0 | End-to-end type-safe RPC |
| Database | Supabase PostgreSQL | ^2.58.0 | Data storage, RLS, Auth, Storage |
| Auth | Supabase Auth + SSR | ^0.7.0 | Session cookies, JWT |
| Styling | Tailwind CSS 4 + shadcn/ui | ^4 | Utility-first CSS + Radix primitives |
| State | TanStack Query | ^5.90.2 | Server state cache + sync |
| Tables | TanStack Table | ^8.21.3 | Data tables với sort/filter/pagination |
| Forms | React Hook Form + Zod 4 | ^7.65.0 / ^4.1.11 | Form state + schema validation |
| Charts | Recharts | 2.15.4 | Dashboard analytics |
| DnD | @dnd-kit | ^6.3.1 | Drag-and-drop cho task ordering |
| Linting | Biome | 2.2.0 | Lint + format (thay ESLint/Prettier) |
| Package Manager | pnpm | - | Fast, disk-efficient |
| Bundler | Turbopack | built-in | Dev server bundling |
| Deployment | Docker standalone | - | Self-hosted server nội bộ |

### Đánh Giá Tính Phù Hợp

**Phù hợp xuất sắc với PRD:**
- tRPC end-to-end type safety cho 19+ routers phức tạp — loại bỏ API contract drift
- Supabase RLS enforce security ở database level — đáp ứng NFR7
- TypeScript strict mode — đáp ứng NFR15
- Tailwind + shadcn/ui — rapid UI development, WCAG compliance từ Radix
- TanStack Query — automatic cache invalidation, đáp ứng NFR1 (API < 500ms perceived)

**Architectural Decisions Được Tech Stack Xác Lập:**
- **Monorepo single app** — Frontend + API cùng codebase, deploy cùng server
- **Type chain:** Supabase generated types → Zod schemas → tRPC procedures → React components
- **Auth flow:** Supabase session cookies → Next.js middleware → tRPC context → RLS
- **No REST/GraphQL** — tRPC là API layer duy nhất (trừ /api/trpc catch-all route)
- **No ORM** — Direct SQL via Supabase client, types generated từ schema
- **No i18n** — Hardcoded Vietnamese strings
- **CSS-in-utility** — Tailwind classes, không CSS modules hay styled-components

### Kết Luận

Tech stack hiện tại phù hợp hoàn toàn. Không cần thay đổi foundation. Architecture document này sẽ tập trung vào application-level decisions: cấu trúc code, patterns, conventions, và business logic organization.

## Core Architectural Decisions

### Decision Priority Analysis

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

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Supabase PostgreSQL | RLS, generated types, Auth tích hợp |
| ORM | Không dùng — Direct Supabase SDK | Đơn giản, type-safe qua generated types |
| Type generation | `supabase gen types` → database.types.ts | Single source of truth cho DB types |
| Validation | Zod schemas tại tRPC input | Shared validation giữa client/server |
| Caching | React Query (staleTime: 5s) — không server-side cache | Đủ cho ~20 concurrent users |
| Migrations | SQL files trong supabase/schemas/ (100-999 ordering) | Rollback-capable, version controlled |
| Data immutability | Stock movements là immutable records | Audit trail chính xác, không sửa/xóa |

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth provider | Supabase Auth (email/password) | Tích hợp sẵn, session cookies qua @supabase/ssr |
| Session | HTTP-only cookies, auto-refresh trong middleware | Secure, không lưu token ở client |
| Authorization | Three-layer: UI route guards → tRPC middleware → RLS | Defense in depth |
| RBAC | 4 roles: admin > manager > technician/reception | Hierarchical, permission matrix |
| RLS | Database-level trên tất cả tables | Chống bypass từ API/direct DB access |
| Two-client pattern | supabaseClient (anon) + supabaseAdmin (service role) | RLS cho user queries, bypass cho admin ops |

### API & Communication Patterns

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

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering | Client Components ("use client") cho auth pages, Server Components cho layout/auth check | SSR cho auth guard, CSR cho interactivity |
| State management | React Query via tRPC — không global state store | Server state là source of truth |
| Route organization | Route groups: (auth)/ và (public)/ | Tách biệt auth flow |
| Component library | shadcn/ui (copy-paste) + Radix primitives | Full control, accessible by default |
| Form management | React Hook Form + Zod resolvers | Performance (uncontrolled), type-safe validation |
| Data tables | TanStack Table với generic data-table component | Reusable, sort/filter/pagination |
| Hooks pattern | Domain hooks (useRole, useWorkflow, useWarehouse...) | Encapsulate tRPC calls + business logic |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | Self-hosted server nội bộ | Toàn quyền dữ liệu, không phụ thuộc cloud |
| Containerization | Docker Compose (12 Supabase services + Next.js app) | Reproducible deployment |
| Next.js output | Standalone mode (BUILD_STANDALONE=true) | Optimized Docker image |
| Port | 3025 (app), 8000 (Kong API gateway) | Fixed ports cho internal network |
| Backup | Supabase PostgreSQL backup (cấu hình trong Docker) | NFR13: 24h/lần, lưu 30 ngày |
| CI/CD | **Deferred** — Manual deployment hiện tại | Xem xét sau go-live |
| Error monitoring | **Sentry (free tier)** — xem chi tiết bên dưới | Error tracking, performance monitoring |

### Sentry Integration

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

### Decision Impact Analysis

**Implementation Sequence:**
1. Sentry integration (độc lập, không ảnh hưởng code hiện tại)
2. Các decisions còn lại đã triển khai trong codebase

**Cross-Component Dependencies:**
- Sentry client config phụ thuộc Next.js config (withSentryConfig wrapper)
- Sentry server config cần access tRPC context cho user info
- Source maps cần SENTRY_AUTH_TOKEN trong build process

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**12 conflict areas** đã xác định và document dựa trên patterns hiện có trong codebase.

### Naming Patterns

**Database Naming:**
- Tables: `snake_case`, số nhiều — `service_tickets`, `stock_movements`, `audit_logs`
- Columns: `snake_case` — `created_at`, `user_id`, `tracking_token`
- Foreign keys: `{entity}_id` — `customer_id`, `assigned_to_id`, `workflow_id`
- Enums: `snake_case` values — `in_progress`, `ready_for_pickup`, `warranty_stock`
- Auto-generated codes: `{PREFIX}-{YYYY}-{NNN}` — `SV-2026-001`, `PN-2026-0001`, `RMA-20260208-001`

**tRPC Router Naming:**
- Router names: `camelCase` — `serviceRequest`, `physicalProducts`, `appSettings`
- Procedures: `camelCase` động từ — `getAll`, `getById`, `create`, `update`, `updateStatus`
- Input schemas: `camelCase` + `Schema` suffix — `createCustomerSchema`, `updateTicketSchema`

**File & Directory Naming:**
- Pages/components: `kebab-case` — `add-ticket-form.tsx`, `page-header.tsx`, `data-table.tsx`
- Hooks: `use-` prefix, `kebab-case` — `use-role.ts`, `use-workflow.ts`, `use-warehouse.ts`
- Types: `kebab-case` — `database.types.ts`, `service-request.ts`, `workflow.ts`
- Constants: `kebab-case` — `warehouse.ts`, `service-request.ts`
- Route folders: `kebab-case` — `service-requests/`, `my-tasks/`, `app-settings/`

**Component & Variable Naming:**
- React components: `PascalCase` — `AppSidebar`, `PageHeader`, `DataTable`
- Functions/variables: `camelCase` — `getUserRole`, `handleSubmit`, `isLoading`
- Constants: `UPPER_SNAKE_CASE` — `ROLE_HIERARCHY`, `TASK_CATEGORIES`
- Types/interfaces: `PascalCase` — `ServiceRequest`, `TaskWithContext`, `StockReceipt`
- Enums: `PascalCase` name, `snake_case` values — `TicketStatus.IN_PROGRESS`

### Structure Patterns

**Project Organization (Feature-based + Layer-based hybrid):**

```
src/
├── app/                    # Routes (Next.js App Router)
│   ├── (auth)/            # Protected routes — server auth check in layout
│   ├── (public)/          # Public routes — no auth required
│   └── api/trpc/          # tRPC HTTP handler
├── components/            # React components (by domain + shared)
│   ├── ui/                # shadcn/ui primitives (button, dialog, table...)
│   ├── inventory/         # Inventory-specific components
│   ├── workflows/         # Workflow components
│   ├── tasks/             # Task components
│   ├── forms/             # Form components
│   └── [shared].tsx       # Shared components (app-sidebar, data-table, page-header...)
├── server/                # Backend logic
│   ├── routers/           # tRPC routers (1 file per domain)
│   ├── services/          # Business logic services
│   ├── middleware/         # tRPC middleware (requireRole)
│   └── utils/             # Server utilities (auditLog, auto-comment...)
├── hooks/                 # Custom React hooks (1 file per domain)
├── types/                 # TypeScript type definitions
├── constants/             # Application constants
├── lib/                   # Library setup (supabase clients, trpc client)
└── utils/                 # Shared utilities
```

**Rule:** Components tổ chức theo domain khi >3 files, shared khi <=3 files.

**Route Pattern:**
- List page: `/operations/tickets/page.tsx`
- Detail page: `/operations/tickets/[id]/page.tsx`
- Create page: `/operations/tickets/add/page.tsx`
- Edit page: `/operations/tickets/[id]/edit/page.tsx`

### Format Patterns

**API Response Format:**
- tRPC trả trực tiếp data — **KHÔNG dùng wrapper** `{data, error, success}`
- Mutations trả `{ success: true, [entity]: data }` hoặc throw TRPCError
- Queries trả array hoặc object trực tiếp
- Pagination: `{ items: T[], total: number }`

**Error Format:**

```typescript
throw new TRPCError({
  code: "NOT_FOUND",        // UNAUTHORIZED | FORBIDDEN | NOT_FOUND | BAD_REQUEST | INTERNAL_SERVER_ERROR
  message: "Mô tả lỗi bằng tiếng Việt cho user-facing errors"
});
```

**Date Format:**
- Database: ISO 8601 strings từ Supabase (`2026-02-08T10:30:00.000Z`)
- Display: `date-fns` format — `dd/MM/yyyy` hoặc `dd/MM/yyyy HH:mm`
- API input: ISO string hoặc Date object (SuperJSON serialize)

**JSON Field Convention:**
- Database → API: `snake_case` (giữ nguyên từ Supabase)
- API → Frontend: `snake_case` (không transform, consistent với DB types)

### Communication Patterns

**State Management:**
- Server state: React Query via tRPC — **single source of truth**
- Local UI state: `useState` cho filters, dialogs, form state
- URL state: Search params cho persistent filters/pagination
- **KHÔNG dùng** global state stores (Redux, Zustand, Context cho data)

**Cache Invalidation:**

```typescript
// Sau mutation thành công
const utils = trpc.useUtils();
onSuccess: () => {
  utils.tickets.getAll.invalidate();  // Invalidate related queries
}
```

**Toast Notifications:**
- Success: `toast.success("Tạo phiếu thành công")`
- Error: `toast.error("Không thể tạo phiếu. Vui lòng thử lại.")`
- Library: Sonner — **KHÔNG dùng** window.alert hoặc console.log cho user feedback

### Process Patterns

**Error Handling:**
1. **tRPC layer:** Zod validation tự throw → client nhận error message
2. **Router layer:** `throw new TRPCError({ code, message })` cho business errors
3. **Service layer:** Throw Error → router catch và wrap thành TRPCError
4. **Component layer:** `error` từ React Query → hiển thị error UI hoặc toast
5. **Global:** Sentry capture unhandled errors (client + server)

**Loading States:**
- Sử dụng React Query states: `isLoading`, `isError`, `data`
- Loading UI: Skeleton components hoặc spinner
- **KHÔNG** dùng boolean flags thủ công cho loading state khi có tRPC query

**Form Validation Pattern:**

```typescript
// 1. Define Zod schema (shared)
const schema = z.object({ name: z.string().min(1), phone: z.string().min(10) });

// 2. tRPC input validation
.input(schema).mutation(...)

// 3. React Hook Form validation
useForm({ resolver: zodResolver(schema) })
```

**Audit Logging Pattern:**

```typescript
// Gọi trong router sau mỗi mutation quan trọng
await createAuditLog(ctx.supabaseAdmin, {
  userId: ctx.user.id,
  action: "create" | "update" | "delete" | "status_change" | "stock_movement",
  resourceType: "service_ticket" | "stock_movement" | ...,
  resourceId: entity.id,
  oldValues: previousData,
  newValues: updatedData,
});
```

### Enforcement Guidelines

**Tất cả code MỚI phải tuân thủ:**
1. Naming conventions đã document ở trên
2. tRPC procedures PHẢI có Zod input schema
3. Mutations quan trọng PHẢI có audit log
4. Role-based procedures PHẢI dùng middleware (requireRole, requireAdmin...)
5. User-facing messages PHẢI bằng tiếng Việt
6. Database changes PHẢI có migration file trong supabase/schemas/
7. New routes PHẢI nằm trong đúng route group ((auth)/ hoặc (public)/)

### Anti-Patterns (KHÔNG làm)

- Tạo REST endpoints ngoài tRPC
- Query database trực tiếp từ components (phải qua tRPC)
- Dùng `supabaseAdmin` ở client-side
- Hardcode role checks thay vì dùng middleware
- Dùng `any` type — always type properly
- Mutate state trực tiếp thay vì invalidate queries
- Tạo global state store cho server data
- Skip audit logging cho mutations quan trọng

## Project Structure & Boundaries

### Complete Project Directory Structure

```
service-center-app/
├── .env                            # Local environment variables
├── .env.example                    # Environment template
├── .env.docker                     # Docker production environment
├── .env.docker.example             # Docker env template
├── .gitignore
├── package.json                    # Dependencies (pnpm)
├── pnpm-lock.yaml
├── tsconfig.json                   # TypeScript strict config
├── next.config.ts                  # Next.js 16 config (standalone, turbopack)
├── biome.json                      # Biome linter/formatter config
├── postcss.config.mjs              # PostCSS + Tailwind
├── docker-compose.yml              # Full stack: 12 Supabase services + app
├── Dockerfile                      # Next.js standalone build
│
├── sentry.client.config.ts         # [NEW] Sentry browser SDK
├── sentry.server.config.ts         # [NEW] Sentry server SDK
├── sentry.edge.config.ts           # [NEW] Sentry edge SDK
│
├── public/                         # Static assets
│   └── uploads/                    # User-uploaded files (Docker volume)
│
├── supabase/                       # Database layer
│   ├── config.toml                 # Supabase local config
│   ├── schemas/                    # SQL schema files (ordered 100-999)
│   │   ├── 1xx_*.sql              # Core tables (profiles, auth, audit)
│   │   ├── 2xx_*.sql              # Phase 2 (tasks, workflows, warehouses)
│   │   ├── 5xx_*.sql              # Functions (warehouse ops, audit)
│   │   ├── 7xx_*.sql              # Reporting views
│   │   ├── 8xx_*.sql              # RLS policies
│   │   └── 9xx_*.sql              # Seed data
│   ├── migrations/                 # Applied migrations
│   └── functions/                  # Supabase Edge Functions (if any)
│
├── docker/                         # Docker support files
│
└── src/                            # Application source code
    ├── middleware.ts                # Next.js middleware (session sync)
    ├── instrumentation.ts          # [NEW] Sentry instrumentation hook
    │
    ├── app/                        # Next.js App Router — ROUTES
    │   ├── globals.css             # Tailwind base styles
    │   ├── layout.tsx              # Root layout (TRPCProvider, fonts)
    │   │
    │   ├── (public)/               # PUBLIC ROUTES (no auth)
    │   │   ├── login/
    │   │   │   ├── page.tsx
    │   │   │   └── action.ts
    │   │   ├── logout/action.ts
    │   │   ├── service-request/
    │   │   │   ├── page.tsx
    │   │   │   ├── success/page.tsx
    │   │   │   └── track/page.tsx
    │   │   ├── setup/page.tsx
    │   │   ├── unsubscribe/page.tsx
    │   │   └── error/page.tsx
    │   │
    │   ├── (auth)/                 # PROTECTED ROUTES (auth required)
    │   │   ├── layout.tsx          # Auth guard + sidebar layout
    │   │   ├── dashboard/
    │   │   │   ├── page.tsx
    │   │   │   ├── notifications/page.tsx
    │   │   │   ├── task-progress/page.tsx
    │   │   │   └── dashboard-quick-links.tsx
    │   │   ├── my-tasks/
    │   │   │   ├── page.tsx
    │   │   │   └── [taskId]/page.tsx
    │   │   ├── operations/
    │   │   │   ├── service-requests/
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── new/page.tsx
    │   │   │   │   ├── [id]/page.tsx
    │   │   │   │   └── [id]/edit/page.tsx
    │   │   │   ├── tickets/
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── add/page.tsx
    │   │   │   │   ├── [id]/page.tsx
    │   │   │   │   └── [id]/edit/page.tsx
    │   │   │   └── deliveries/page.tsx
    │   │   ├── inventory/
    │   │   │   ├── overview/page.tsx
    │   │   │   ├── products/
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── [id]/page.tsx
    │   │   │   │   └── [id]/stock/page.tsx
    │   │   │   ├── warehouses/page.tsx
    │   │   │   ├── rma/
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── [id]/page.tsx
    │   │   │   └── documents/
    │   │   │       ├── page.tsx
    │   │   │       ├── receipts/...
    │   │   │       ├── issues/...
    │   │   │       └── transfers/...
    │   │   ├── catalog/
    │   │   │   ├── products/page.tsx
    │   │   │   ├── parts/page.tsx
    │   │   │   └── brands/page.tsx
    │   │   ├── management/
    │   │   │   ├── customers/page.tsx
    │   │   │   └── team/page.tsx
    │   │   ├── settings/account/page.tsx
    │   │   ├── admin/app-settings/page.tsx
    │   │   └── unauthorized/page.tsx
    │   │
    │   └── api/trpc/[...trpc]/route.ts
    │
    ├── components/                 # REACT COMPONENTS
    │   ├── providers/
    │   │   └── trpc-provider.tsx
    │   ├── ui/                     # shadcn/ui primitives (~40 files)
    │   ├── forms/                  # Form components
    │   ├── inventory/              # Inventory domain components
    │   ├── workflows/              # Workflow domain components
    │   ├── tasks/                  # Task domain components
    │   ├── dashboard/              # Dashboard components
    │   ├── drawers/                # Slide-out panels
    │   ├── app-sidebar.tsx         # Main navigation
    │   ├── data-table.tsx          # Generic data table
    │   ├── page-header.tsx         # Reusable page header
    │   └── [domain]-table.tsx      # Domain-specific tables
    │
    ├── server/                     # BACKEND LOGIC
    │   ├── trpc.ts                 # tRPC context + router init
    │   ├── routers/
    │   │   ├── _app.ts             # Root router (18 sub-routers)
    │   │   ├── tickets.ts
    │   │   ├── service-request.ts
    │   │   ├── workflow.ts
    │   │   ├── tasks.ts
    │   │   ├── customers.ts
    │   │   ├── products.ts
    │   │   ├── parts.ts
    │   │   ├── brands.ts
    │   │   ├── warehouse.ts
    │   │   ├── physical-products.ts
    │   │   ├── staff.ts
    │   │   ├── notifications.ts
    │   │   ├── analytics.ts
    │   │   ├── revenue.ts
    │   │   ├── assignments.ts
    │   │   ├── admin.ts
    │   │   ├── profile.ts
    │   │   ├── appSettings.ts
    │   │   └── inventory/
    │   │       ├── index.ts
    │   │       ├── stock.ts
    │   │       ├── receipts.ts
    │   │       ├── issues.ts
    │   │       ├── transfers.ts
    │   │       └── serials.ts
    │   ├── services/
    │   │   ├── task-service.ts
    │   │   ├── assignment-service.ts
    │   │   └── entity-adapters/
    │   │       ├── base-adapter.ts
    │   │       ├── service-ticket-adapter.ts
    │   │       ├── service-request-adapter.ts
    │   │       ├── inventory-receipt-adapter.ts
    │   │       ├── inventory-issue-adapter.ts
    │   │       ├── inventory-transfer-adapter.ts
    │   │       ├── registry.ts
    │   │       └── init.ts
    │   ├── middleware/
    │   │   └── requireRole.ts
    │   └── utils/
    │       ├── auditLog.ts
    │       ├── auto-comment.ts
    │       └── workflow-tasks.ts
    │
    ├── hooks/
    │   ├── use-role.ts
    │   ├── use-workflow.ts
    │   ├── use-warehouse.ts
    │   ├── use-service-request.ts
    │   ├── use-entity-tasks.ts
    │   ├── use-delivery.ts
    │   ├── use-staff-api.ts
    │   ├── use-notifications.ts
    │   ├── use-task-progress.ts
    │   ├── use-debounce.ts
    │   └── use-mobile.ts
    │
    ├── types/
    │   ├── database.types.ts       # Auto-generated (127KB)
    │   ├── enums.ts
    │   ├── roles.ts
    │   ├── service-request.ts
    │   ├── workflow.ts
    │   └── inventory.ts
    │
    ├── constants/
    │   ├── workflow.ts
    │   ├── service-request.ts
    │   ├── warehouse.ts
    │   └── task-attachments.ts
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts
    │   │   └── server.ts
    │   └── trpc/
    │
    └── utils/
        └── supabase/
            └── middleware.ts
```

### Architectural Boundaries

**API Boundary:**
- Tất cả client-server communication qua `/api/trpc/[...trpc]`
- Public: `serviceRequest.submitPublic`, `serviceRequest.trackByToken`
- Authenticated: Tất cả procedures còn lại qua role middleware
- Admin bypass: `supabaseAdmin` chỉ dùng server-side

**Component Boundary:**
- `(public)/`: Không import components phụ thuộc auth context
- `(auth)/`: Có thể dùng `useRole()`, sidebar, toast
- `components/ui/`: Stateless, không import tRPC — reusable primitives
- `components/forms/`: Có thể import tRPC mutations, Zod schemas

**Service Boundary:**
- `server/routers/`: Thin layer — validation + delegation
- `server/services/`: Business logic phức tạp (task lifecycle, assignments)
- `server/services/entity-adapters/`: Mỗi adapter xử lý 1 entity type
- Routers KHÔNG gọi nhau — share logic qua services

**Data Boundary:**
- `supabaseClient` (anon): RLS-protected queries
- `supabaseAdmin` (service role): Privileged operations
- `database.types.ts`: Regenerate khi schema thay đổi
- Stock movements: Write-once, KHÔNG update/delete

### Requirements to Structure Mapping

| FR Domain | Routes | Router | Components | Hooks |
|-----------|--------|--------|------------|-------|
| Danh mục (FR1-5) | catalog/* | products, parts, brands | catalog/ | - |
| Kho (FR6-15) | inventory/* | inventory/*, warehouse, physicalProducts | inventory/ | use-warehouse |
| Khách hàng (FR16-18) | management/customers | customers | customer-table | - |
| Phiếu yêu cầu (FR19-28) | operations/service-requests, (public)/service-request | serviceRequest | forms/, drawers/ | use-service-request |
| Phiếu dịch vụ (FR29-41) | operations/tickets | tickets | forms/, tasks/ | use-workflow |
| Task & Workflow (FR42-51) | my-tasks | tasks, workflow, assignments | tasks/, workflows/ | use-entity-tasks |
| RMA (FR52-56) | inventory/rma | inventory (nested) | inventory/ | - |
| Email (FR57-65) | - (server-only) | notifications | - | use-notifications |
| Dashboard (FR66-69) | dashboard/* | analytics, revenue | dashboard/ | use-task-progress |
| Phân quyền (FR70-77) | admin/*, management/team | admin, staff, profile | auth/ | use-role |

### Integration Points

**Internal Data Flow:**

```
Browser → Middleware (session sync) → App Router → Page Component
→ tRPC Client (React Query) → /api/trpc/ → Router (Zod + role middleware)
→ Service Layer → Supabase SDK (PostgreSQL + RLS) → Response
→ React Query cache → UI update
```

**External Integrations:**
- Supabase Auth: Login/logout/session
- Supabase Storage: File uploads
- SMTP Server: Email notifications (Docker)
- Sentry: Error monitoring (cloud, free tier)

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
Tất cả technology choices hoạt động tốt cùng nhau. Next.js 16.1.6 + React 19.2.4 + tRPC 11.6.0 + Supabase SDK 2.58.0 — đã verified compatible trong codebase hiện tại (329 files, no dependency conflicts). SuperJSON serialization tương thích với cả tRPC transport và React Query caching. Tailwind CSS 4 + shadcn/ui + Radix primitives — no conflicts, đã triển khai ~40 UI components. Biome 2.2.0 thay thế hoàn toàn ESLint/Prettier — không conflicts.

**Pattern Consistency:**
- Naming conventions nhất quán: `snake_case` database → `camelCase` tRPC routers/procedures → `PascalCase` components → `kebab-case` files
- Format patterns rõ ràng: tRPC trả data trực tiếp (no wrapper), TRPCError cho errors, ISO dates, `snake_case` JSON fields
- Communication patterns thống nhất: React Query via tRPC = single source of truth, Sonner cho toast, invalidation after mutations

**Structure Alignment:**
- Feature-based + layer-based hybrid organization phù hợp với tech stack
- Route groups `(auth)/` và `(public)/` đúng với Next.js App Router conventions
- Server code tách biệt rõ ràng: routers → services → entity-adapters
- Boundary rules enforce đúng: UI → tRPC → Service → DB (no shortcuts)

### Requirements Coverage Validation

**Functional Requirements Coverage (80 FRs):**

| Domain | FRs | Status | Coverage |
|--------|-----|--------|----------|
| Danh mục | FR1-FR5 | Architecturally supported | Routers + CRUD patterns defined |
| Kho | FR6-FR15 | Architecturally supported | 7 virtual warehouses + immutable stock movements + serial tracking |
| Khách hàng | FR16-FR18 | Architecturally supported | CRUD + phone uniqueness constraint |
| Phiếu yêu cầu | FR19-FR28 | Architecturally supported | 7-state workflow + public portal + tracking token |
| Phiếu dịch vụ | FR29-FR41 | Architecturally supported | Task-based workflow + auto stock movements |
| Task & Workflow | FR42-FR51 | Architecturally supported | Polymorphic entity adapters (5 types) |
| RMA | FR52-FR56 | Architecturally supported | Batch management + auto-numbering |
| Email | FR57-FR65 | Architecturally supported | Templates + retry + rate limiting + tracking |
| Dashboard | FR66-FR69 | Architecturally supported | Analytics routers + Recharts |
| Phân quyền & Audit | FR70-FR77 | Architecturally supported | Three-layer RBAC + RLS + audit logging |

**Non-Functional Requirements Coverage:**

| NFR | Requirement | Architectural Support |
|-----|------------|----------------------|
| Performance | API < 500ms (P95), page < 3s | React Query caching (staleTime: 5s), tRPC batch link, Turbopack dev |
| Security | HTTPS, RBAC, audit | Three-layer auth, RLS, Supabase Auth cookies, audit logging |
| Reliability | 99% uptime | Docker Compose, standalone Next.js, Supabase backup 24h |
| Maintainability | Dev onboarding < 1 day | TypeScript strict, consistent patterns, generated types |
| Monitoring | Error tracking | Sentry free tier (client + server + edge) |

### Implementation Readiness Validation

**Decision Completeness:**
- Tất cả critical decisions documented với versions cụ thể
- Implementation patterns comprehensive với concrete examples (code snippets)
- Consistency rules rõ ràng và enforceable (7 enforcement rules + anti-patterns list)
- Examples cho tất cả major patterns: tRPC procedures, error handling, audit logging, form validation, cache invalidation

**Structure Completeness:**
- Complete project tree: ~100 files/directories defined
- Route hierarchy: 25+ pages với exact paths
- Router organization: 18 domain routers listed individually
- Entity adapters: 5 types explicitly mapped
- Hooks: 11 custom hooks documented

**Pattern Completeness:**
- 12 conflict areas identified và resolved
- 5 naming categories: database, tRPC, file/directory, component/variable, auto-generated codes
- Format patterns: API response, error, date, JSON field conventions
- Process patterns: error handling (5 layers), loading states, form validation, audit logging
- Anti-patterns: 8 explicit "KHÔNG làm" rules

### Gap Analysis Results

**Critical Gaps:** Không có — tất cả architectural decisions đã đầy đủ cho implementation.

**Important Gaps (Post go-live):**

1. **Sentry chưa tích hợp** — Architecture đã document chi tiết (6 files cần tạo/sửa), nhưng chưa implement. Priority: trước go-live.

2. **Không có CI/CD pipeline** — Manual deployment hiện tại. Cần xem xét GitHub Actions hoặc similar sau go-live.

3. **Không có automated testing** — Không có unit/integration/e2e tests. Cần xem xét testing strategy sau go-live.

4. **Console.log cleanup** — Codebase hiện tại còn console.log. Cần chuyển sang Sentry + proper error handling.

**Nice-to-Have Gaps:**
- Server-side caching nếu performance cần cải thiện
- API rate limiting ngoài email (100/day)
- Documentation auto-generation từ tRPC routers

### Validation Issues Addressed

Không phát hiện critical issues. Architecture phản ánh đúng codebase hiện tại với bổ sung hợp lý (Sentry integration). Tất cả decisions coherent và compatible.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed (80 FRs, 18 NFRs, 10 domains)
- [x] Scale and complexity assessed (medium-high complexity, ~20 users)
- [x] Technical constraints identified (brownfield, self-hosted, Supabase lock-in)
- [x] Cross-cutting concerns mapped (7 concerns documented)

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (15 technologies with exact versions)
- [x] Integration patterns defined (tRPC + React Query + Supabase)
- [x] Performance considerations addressed (caching, batch requests)

**Implementation Patterns**

- [x] Naming conventions established (5 categories)
- [x] Structure patterns defined (hybrid feature/layer-based)
- [x] Communication patterns specified (React Query, toast, invalidation)
- [x] Process patterns documented (error handling, loading, validation, audit)

**Project Structure**

- [x] Complete directory structure defined (~100 files/directories)
- [x] Component boundaries established (4 boundary types)
- [x] Integration points mapped (internal flow + 4 external)
- [x] Requirements to structure mapping complete (10 domains → specific locations)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH — dựa trên brownfield validation (code đã chạy, patterns đã proven)

**Key Strengths:**
- Architecture document phản ánh reality — không phải lý thuyết
- End-to-end type safety chain: DB types → Zod → tRPC → React components
- Three-layer security architecture đã proven trong codebase
- Polymorphic entity adapter pattern cho extensible task system
- Consistent naming/structure patterns dựa trên code hiện tại

**Areas for Future Enhancement:**
- Sentry integration (planned, documented, chưa implement)
- CI/CD pipeline (post go-live)
- Automated testing strategy (post go-live)
- Server-side caching nếu performance bottlenecks xuất hiện

### Implementation Handoff

**Guidelines:**

- Follow tất cả architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure và boundaries (đặc biệt API boundary qua tRPC)
- Refer to this document cho tất cả technical decisions

**First Implementation Priority:**
Tích hợp Sentry (6 files) — độc lập, không ảnh hưởng code hiện tại, cung cấp error monitoring ngay lập tức.
