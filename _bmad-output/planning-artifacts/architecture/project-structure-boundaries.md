# Project Structure & Boundaries

## Complete Project Directory Structure

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
├── docker-compose.yml              # Full stack: ~14 Supabase services + Next.js app
├── Dockerfile                      # Next.js standalone build
│
├── sentry.client.config.ts         # [NEW] Sentry browser SDK
├── sentry.server.config.ts         # [NEW] Sentry server SDK
├── sentry.edge.config.ts           # [NEW] Sentry edge SDK
│
├── public/                         # Static assets (favicon, images)
│
├── supabase/                       # Supabase configuration & database layer
│   ├── config.toml                 # Supabase CLI config (PG 17, storage buckets, auth, etc.)
│   ├── schemas/                    # Custom SQL schema files (ordered 100-999)
│   │   ├── 1xx_*.sql              # Core: enums, base functions, core tables
│   │   ├── 2xx_*.sql              # Domain: tickets, tasks, warehouses, requests, inventory, settings
│   │   ├── 3xx_*.sql              # Relations: foreign keys, virtual warehouse links
│   │   ├── 5xx_*.sql              # Functions: inventory ops, warehouse ops, audit
│   │   ├── 6xx_*.sql              # Triggers: stock, default warehouse, serial count
│   │   ├── 7xx_*.sql              # Views: reporting, task statistics
│   │   ├── 8xx_*.sql              # RLS policies: core, phase2, storage
│   │   └── 9xx_*.sql              # Seed data: warehouses, sample tasks, workflows
│   ├── migrations/                 # Standard CLI migrations (empty — using schemas/ instead)
│   ├── storage/                    # Local storage bucket data (dev)
│   └── snippets/                   # SQL snippets
│
├── scripts/                        # [NEW] DevOps scripts
│   ├── backup.sh                   # pg_dump scheduled backup (cron, 30-day retention)
│   └── generate-secrets.sh         # Generate all required secrets (JWT, keys)
│
├── docker/                         # Docker support files
│   └── caddy/Caddyfile             # [NEW] Caddy reverse proxy config (public VPS)
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
    │   │   └── server.ts           # Admin client (service role, bypass RLS)
    │   └── trpc/
    │
    └── utils/
        └── supabase/
            ├── client.ts           # Browser client (@supabase/ssr createBrowserClient)
            ├── server.ts           # Server client (@supabase/ssr createServerClient, cookie-aware)
            └── middleware.ts       # Middleware session sync helper
```

## Architectural Boundaries

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

## Requirements to Structure Mapping

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

## Integration Points

**Internal Data Flow:**

```
Browser → Middleware (session sync) → App Router → Page Component
→ tRPC Client (React Query) → /api/trpc/ → Router (Zod + role middleware)
→ Service Layer → Supabase SDK (PostgreSQL + RLS) → Response
→ React Query cache → UI update
```

**External Integrations:**
- Supabase Auth (GoTrue): Login/logout/session cookies qua @supabase/ssr
- Supabase Storage: File uploads (4 buckets: avatars, product_images, service_media, service_videos)
- Supabase PostgREST: Auto-generated REST API, accessed qua @supabase/supabase-js SDK
- SMTP Server: Email notifications (supabase-mail dev / production SMTP)
- Sentry: Error monitoring (cloud, free tier)
- Caddy (public VPS): Reverse proxy + auto-TLS, connected via Tailscale tunnel
- Tailscale: WireGuard-based VPN tunnel giữa public VPS và internal machine
