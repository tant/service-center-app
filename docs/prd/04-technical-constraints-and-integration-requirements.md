# 4. Technical Constraints and Integration Requirements

## 4.1 Existing Technology Stack

**Languages:**
- TypeScript 5.x (strict mode)
- SQL (PostgreSQL 15 dialect)

**Frameworks:**
- Next.js 15.5.4 (App Router with Turbopack)
- React 19.1.0 (Server Components by default)

**Database & Backend Services (Supabase Local Stack via Docker Compose):**
- **PostgreSQL 15.8.1.085** (supabase/postgres) - Main database with pgvector, pgsodium extensions
- **Kong 2.8.1** - API Gateway (port 8000) - Routes all Supabase service requests
- **GoTrue v2.180.0** - Authentication service with JWT tokens, SMTP integration for emails
- **PostgREST v13.0.7** - Auto-generated REST API from database schema (used for direct database access)
- **Realtime v2.51.11** - WebSocket/Realtime subscriptions for database changes (available for real-time updates)
- **Storage API v1.28.0** - S3-compatible file storage with local filesystem backend (`./volumes/storage`)
- **imgproxy v3.8.0** - Image transformation service for storage (resize, optimize images)
- **Postgres-Meta v0.91.6** - Database metadata and migration management
- **Edge Functions v1.69.6** - Deno runtime for serverless functions (available for email sending)
- **Logflare 1.22.6** - Analytics and logging service
- **Studio 2025.10.01** - Web UI for database management (port 3000)
- **Vector 0.28.1** - Log aggregation from all services

**Infrastructure:**
- Docker Compose orchestrating 13 services (Supabase stack + Next.js app)
- Port-based instance isolation (APP_PORT: 3025, KONG_PORT: 8000, STUDIO_PORT: 3000)
- Kong acts as reverse proxy for auth, rest, realtime, storage, functions
- All services communicate via Docker internal network
- Local development with Supabase CLI (`pnpx supabase start`)

**External Dependencies:**
- tRPC 11.6.0 (type-safe API layer)
- TanStack Query v5 (server state management)
- Tailwind CSS 4.0
- shadcn/ui component library
- React Hook Form + Zod (form validation)
- Biome 2.2.0 (linting/formatting)

## 4.2 Integration Approach

**Database Integration Strategy:**

**Database-First Design Workflow (ARCHITECTURAL CONSTRAINT):**
1. Create schema files in `docs/data/schemas/` (source of truth)
2. Run `./docs/data/schemas/setup_schema.sh` to copy to `supabase/schemas/`
3. Generate migration: `pnpx supabase db diff -f migration_name`
4. Review migration in `supabase/migrations/`
5. Apply migration: `pnpx supabase migration up`
6. Generate TypeScript types: `pnpx supabase gen types typescript`

**Schema Dependency Order (CRITICAL):**
- **MUST** create ENUMs first: `00_base_types.sql` or `11_phase2_types.sql`
- **MUST** create helper functions second: `00_base_functions.sql` or `12_phase2_functions.sql`
- **THEN** create tables in foreign key dependency order
- Triggers and views created after tables exist

**Tables and Extensions:**
- Add 12+ new tables (task_templates, task_types, task_templates_tasks, service_ticket_tasks, task_history, physical_warehouses, virtual_warehouses, physical_products, stock_movements, product_stock_thresholds, service_requests, email_notifications)
- Link via foreign keys to existing tables: service_tickets, products, customers, profiles, parts
- Extend service_tickets table with new nullable columns: template_id, request_id, delivery_method, delivery_address
- Create database views for complex queries (warehouse stock levels, task analytics)
- Implement triggers for auto-generation (tracking tokens, task instantiation, ticket status transitions)

**RLS Policy Pattern:**
- Use existing `auth.check_role(required_role user_role)` helper function
- Apply same pattern as existing tables (role-based visibility)
- Public portal endpoints use anon key with limited RLS policies

**API Integration Strategy:**
- Create 4 new tRPC routers:
  - `workflow` - Task template and task execution procedures
  - `warehouse` - Physical/virtual warehouse, stock movement procedures
  - `warranty` - Serial verification, warranty check procedures
  - `serviceRequest` - Public and staff request management procedures
- Merge into existing `appRouter` in `src/server/routers/_app.ts`
- Maintain backward compatibility with existing routers (admin, profile, tickets, customers, products, parts, brands, revenue)
- Use existing tRPC context (supabaseAdmin, supabaseClient, user)

**Frontend Integration Strategy:**
- Create new route groups:
  - `app/(auth)/workflows/*` - Task template management
  - `app/(auth)/warehouses/*` - Warehouse management
  - `app/(auth)/requests/*` - Request management
  - `app/(public)/request/*` - Public request creation
  - `app/(public)/track/*` - Public tracking
- Reuse existing components from `src/components/ui/*`
- Create domain-specific components in flat structure (src/components)
- Use Server Components for data fetching, Client Components for interactivity
- Integrate TanStack Query hooks with tRPC client

**File Storage Integration Strategy:**
- Use existing **Supabase Storage service** (already running in docker-compose)
- File uploads to `./volumes/storage` directory (local filesystem backend)
- Image transformations via **imgproxy** service (resize, optimize)
- Storage buckets to create:
  - `ticket-images` - Service ticket photos (existing)
  - `warehouse-photos` - Product reception photos (new)
  - `serial-photos` - Serial number verification photos (new)
  - `csv-imports` - Temporary storage for bulk import files (new)
- Integration via Supabase Storage SDK in tRPC procedures
- Automatic cleanup of temporary files after processing

**Email Notification Integration Strategy:**
- **Option 1 (Recommended)**: Use existing **GoTrue SMTP configuration**
  - GoTrue already configured with SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env)
  - Extend GoTrue email templates or trigger custom emails via database triggers
  - Pros: No additional service, already integrated, email credentials already configured

- **Option 2**: Use **Supabase Edge Functions**
  - Write Deno function for email sending via existing SMTP credentials
  - Trigger via database webhooks or tRPC procedure calls
  - Pros: More control over email content, HTML templates in code

- **Option 3**: Use external service (SendGrid, Resend, etc.)
  - Requires additional API keys and service dependency
  - Pros: Better deliverability, analytics, templates

- **Decision**: Start with Option 1 (GoTrue SMTP), migrate to Option 2 (Edge Functions) if more customization needed

**Real-time Updates Integration Strategy (Optional Enhancement):**
- **Supabase Realtime service** already available for WebSocket subscriptions
- Can replace TanStack Query polling (30-second intervals) with real-time database subscriptions
- Use cases:
  - Real-time task status updates on manager dashboard
  - Live stock level updates on warehouse dashboard
  - Instant notification of new service requests
- Implementation: Subscribe to PostgreSQL table changes via Realtime client
- Trade-off: Increased complexity vs reduced server load and instant updates

**Testing Integration Strategy:**
- Follow existing testing patterns (currently no tests, planned for future)
- Structure tests per `docs/architecture/09-testing-strategy.md` roadmap
- Vitest for unit tests, Playwright for E2E when implemented
- RLS policy testing via direct database queries

## 4.3 Code Organization and Standards

**File Structure Approach: ADOPT TARGET ARCHITECTURE**

⚠️ **Important:** Phase 2 should **NOT** follow the current flat component structure. Instead, implement the **target organized structure** documented in `docs/architecture/frontend-architecture-roadmap.md`.

**Rationale:**
- Phase 2 adds 20+ new components (forms, tables, modals for workflow/warehouse/requests)
- Adding to flat structure would worsen technical debt
- Creating organized structure now enables gradual migration of existing components
- New code should establish best practices, not inherit legacy patterns

**Phase 2 Directory Structure (NEW - to be created):**

```
src/
├── types/                         # 🆕 Centralized type definitions
│   ├── index.ts                   # Re-export all types
│   ├── database.types.ts          # Existing Supabase generated types
│   ├── workflow.ts                # Task template, task instance types
│   ├── warehouse.ts               # Warehouse, stock movement types
│   ├── warranty.ts                # Serial, warranty verification types
│   ├── service-request.ts         # Service request, tracking types
│   └── enums.ts                   # New ENUMs (task status, warehouse types, etc.)
│
├── hooks/                         # 🆕 Custom React hooks
│   ├── use-workflow.ts            # Task template, execution hooks
│   ├── use-warehouse.ts           # Warehouse, stock hooks
│   ├── use-warranty.ts            # Serial verification hooks
│   ├── use-service-requests.ts    # Request management hooks
│   └── use-debounce.ts            # Utility hooks
│
├── constants/                     # 🆕 Application constants
│   ├── index.ts                   # Re-export all constants
│   ├── workflow.ts                # Task statuses, default task types
│   ├── warehouse.ts               # Warehouse types, stock thresholds
│   ├── service-request.ts         # Request statuses, tracking token format
│   └── messages.ts                # UI messages for new features
│
├── components/
│   ├── ui/                        # Existing shadcn/ui components
│   │
│   ├── forms/                     # 🆕 Business forms (create if doesn't exist)
│   │   ├── task-template-form.tsx
│   │   ├── warehouse-form.tsx
│   │   ├── physical-product-form.tsx
│   │   ├── service-request-wizard.tsx
│   │   └── delivery-confirmation-form.tsx
│   │
│   ├── tables/                    # 🆕 Data tables (create if doesn't exist)
│   │   ├── task-template-table.tsx
│   │   ├── warehouse-stock-table.tsx
│   │   ├── stock-movement-table.tsx
│   │   ├── service-request-table.tsx
│   │   └── task-progress-table.tsx
│   │
│   ├── modals/                    # 🆕 Modal components (create if doesn't exist)
│   │   ├── template-editor-modal.tsx
│   │   ├── stock-movement-modal.tsx
│   │   ├── bulk-import-modal.tsx
│   │   └── rma-batch-modal.tsx
│   │
│   └── shared/                    # 🆕 Shared business components
│       ├── task-status-badge.tsx
│       ├── warehouse-type-badge.tsx
│       ├── serial-verification-input.tsx
│       ├── task-execution-card.tsx
│       └── tracking-timeline.tsx
│
└── server/routers/                # Existing tRPC routers
    ├── workflow.ts                # 🆕 Task workflow procedures
    ├── warehouse.ts               # 🆕 Warehouse management procedures
    ├── warranty.ts                # 🆕 Warranty verification procedures
    └── serviceRequest.ts          # 🆕 Service request procedures
```

**Migration Strategy:**
- ✅ **Phase 2**: Create new directories and use organized structure for ALL new components
- 🔄 **Post-Phase 2**: Gradually migrate existing components from flat structure to organized structure
- 📖 **Reference**: Full migration plan in `docs/architecture/frontend-architecture-roadmap.md`

**Benefits:**
1. Phase 2 components organized from day one
2. Establishes target architecture without breaking existing code
3. Existing components continue to work while migration happens incrementally
4. New developers see best practices in new code

**Naming Conventions:**
- Use `interface` for component props, `type` for other type definitions
- PascalCase for React components and types
- camelCase for functions and variables
- kebab-case for file names
- Database: snake_case for all tables/columns

**Coding Standards:**
- Follow `docs/architecture/08-coding-standards.md`
- Server Components by default (add `'use client'` only when needed)
- No prop spreading in components
- Explicit typing (no implicit `any`)
- Use service role client (`ctx.supabaseAdmin`) in tRPC procedures

**Documentation Standards:**
- Inline comments for complex business logic
- JSDoc for public functions
- README updates for new modules
- Database schema comments in migration files

## 4.4 Deployment and Operations

**Build Process Integration:**
- No changes to existing `pnpm build` process
- New tRPC routers auto-discovered via imports
- Static analysis via Biome continues
- Turbopack bundling for development and production

**Deployment Strategy:**
- **Supabase Stack Startup**: All 12 Supabase services started via `docker compose up` (from docker-compose.yml)
- **Service Dependencies**: Kong → Auth/Rest/Realtime/Storage/Functions → PostgreSQL → Vector/Analytics
- **Database Migrations**: Applied via `pnpx supabase migration up` (uses Postgres-Meta service)
- **Application Deployment**: Next.js app container depends on Kong (healthcheck ensures all Supabase services ready)
- **Schema Changes**: Deployed before application code to maintain compatibility
- **Zero-downtime**: Backward-compatible migrations allow rolling updates
- **Rollback Strategy**:
  1. Revert Next.js application code (redeploy previous Docker image)
  2. Revert database migrations if needed (run DOWN migrations)
  3. Supabase services remain running (no restart required unless configuration changes)

**Monitoring and Logging:**
- **Supabase Studio** (port 3000) - Database monitoring, table browsing, query execution
- **Logflare Analytics** - Service logs aggregated from all containers via Vector
- **Vector** - Collects logs from Docker sockets, streams to Logflare
- **Kong Gateway Logs** - API request/response logs, rate limiting metrics
- **Application Logs**: Console logging captured by Docker Compose logs
- **Database Monitoring**: PostgreSQL performance via Studio's monitoring tab
- **Browser DevTools** - Client-side debugging
- **tRPC Error Handling** - Follows existing patterns, logged to console and captured by Vector

**Configuration Management:**
- Add new environment variables to `.env`:
  - `PUBLIC_REQUEST_PORTAL_ENABLED` (default: true)
  - `WAREHOUSE_LOW_STOCK_ALERT_ENABLED` (default: true)
  - `TASK_WORKFLOW_STRICT_MODE_DEFAULT` (default: false)
  - `EMAIL_NOTIFICATION_ENABLED` (default: true)
- **Existing SMTP Configuration** (already in .env for GoTrue):
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email server credentials
  - `SMTP_ADMIN_EMAIL`, `SMTP_SENDER_NAME` - Email sender configuration
  - Can be reused for Phase 2 email notifications via GoTrue or Edge Functions
- **Existing Supabase Configuration** (no changes needed):
  - Kong port (8000), Studio port (3000), PostgreSQL port (5432)
  - JWT secrets, service role keys, anon keys
  - Storage backend configuration (local filesystem)
- Multi-tenant settings remain in Docker Compose
- All 12 Supabase services configured via docker-compose.yml volumes and environment variables

## 4.5 Risk Assessment and Mitigation

**Technical Risks:**

1. **Database Migration Complexity** (High)
   - Risk: 12+ new tables with triggers may cause migration failures
   - Mitigation: Test migrations on staging database, implement idempotent SQL, version control all schema changes
   - Known constraints: Trigger execution order matters (create base functions before triggers)

2. **Performance Degradation** (Medium)
   - Risk: Complex joins for task + warehouse queries may slow ticket list
   - Mitigation: Create database views, add strategic indexes, implement pagination, monitor P95 latency
   - Reference: NFR1 allows 15% latency increase threshold

3. **tRPC Type Generation Overhead** (Low)
   - Risk: Large number of new procedures may slow TypeScript compilation
   - Mitigation: Use Turbopack for faster builds, split routers into logical groups

4. **Vietnamese Filename Sanitization** (Low)
   - Risk: Edge cases in character mapping for warehouse photo uploads
   - Mitigation: Reuse existing sanitization logic from ticket image upload (already working)

**Integration Risks:**

1. **Breaking Existing Ticket Workflow** (High)
   - Risk: Adding template_id to service_tickets may affect existing queries
   - Mitigation: Make new columns nullable, test all existing tRPC procedures, maintain backward compatibility
   - Rollback plan: Column can be dropped without data loss

2. **RLS Policy Conflicts** (Medium)
   - Risk: New RLS policies on service_tickets may conflict with existing policies
   - Mitigation: Create separate policies for new tables, avoid modifying existing policies
   - Testing: Manual RLS testing via direct SQL queries

3. **Service Role Bypasses RLS** (High) - **ARCHITECTURAL CONSTRAINT**
   - Risk: tRPC uses `supabaseAdmin` (service role client) which bypasses ALL RLS policies
   - Impact: Developer must manually verify authorization in every tRPC procedure
   - Mitigation:
     * Use existing `ctx.user` to verify authentication in all procedures
     * Call `auth.check_role()` helper function for role-based access
     * Code review checklist: Every tRPC procedure has auth check
     * Never trust client-provided user_id, always use `ctx.user.id`
   - Reference: `docs/architecture/10-security.md` section 10.3

4. **Public Portal Security** (Medium)
   - Risk: Unauthenticated access to serial verification may enable data scraping
   - Mitigation: Implement rate limiting (NFR14), log all verification attempts, limit response data

**Deployment Risks:**

1. **Migration Rollback Complexity** (Medium)
   - Risk: Reverting 12 new tables with foreign keys may fail
   - Mitigation: Create explicit DOWN migrations, test rollback on staging, backup before production deployment
   - Constraint: Cannot rollback if production data already written to new tables

2. **Multi-Tenant Migration Coordination** (Low)
   - Risk: Multiple tenant databases need synchronized migrations
   - Mitigation: Use existing Supabase CLI migration workflow (already handles multi-tenant)

**Mitigation Strategies:**

- **Pre-Deployment Testing**: Full regression test of existing ticket workflows
- **Staged Rollout**: Deploy to staging instance first, monitor for 24 hours before production
- **Feature Flags**: Use environment variables to disable new features if issues arise
- **Data Validation**: Implement comprehensive Zod schemas for all new tRPC inputs
- **Monitoring Plan**: Track NFR1 (performance), NFR5 (uptime), NFR14 (rate limiting) metrics

---

