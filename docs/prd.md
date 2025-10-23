# Service Center Phase 2 - Brownfield Enhancement PRD

**Version:** 1.0
**Date:** 2025-10-23
**Project Code:** SC-PHASE2
**Status:** Draft

---

## 1. Intro Project Analysis and Context

### 1.1 Existing Project Overview

#### Analysis Source
✅ **Comprehensive project documentation available**
- Architecture documentation: Complete (10 shards covering all aspects)
- Project Brief: Phase 2 requirements documented at `docs/brief.md`
- Source: IDE-based analysis with existing documentation

#### Current Project State

**Service Center Management Application** is a **production brownfield application** (v0.2.1) providing comprehensive service ticket lifecycle management for repair centers.

**Current Capabilities (Phase 1 - Production):**
- ✅ Service ticket management with automatic numbering (SV-YYYY-NNN)
- ✅ Customer relationship management
- ✅ Product catalog and parts inventory
- ✅ Role-based access control (Admin, Manager, Technician, Reception)
- ✅ Real-time analytics dashboard
- ✅ Automatic cost calculations via database triggers
- ✅ Parts inventory with stock adjustments
- ✅ Comment/audit trail system
- ✅ Image upload with Vietnamese character sanitization

**Current Architecture:**
- **Frontend**: Next.js 15.5.4 (App Router) + React 19.1.0 + TypeScript 5
- **Backend**: tRPC 11.6.0 with type-safe APIs
- **Database**: Supabase (PostgreSQL 15) with Row-Level Security
- **State Management**: TanStack Query
- **UI**: Tailwind CSS 4 + shadcn/ui
- **Deployment**: Multi-tenant Docker architecture with port-based isolation

---

### 1.2 Available Documentation Analysis

✅ **Complete Architecture Documentation Available** (from comprehensive documentation project)

**Available Documentation Checklist:**
- ✅ Tech Stack Documentation (`docs/architecture/02-technology-stack.md` - 18KB, 9 diagrams)
- ✅ Source Tree/Architecture (`docs/architecture/06-source-tree.md` - 16KB, 12 diagrams)
- ✅ Coding Standards (`docs/architecture/08-coding-standards.md` - 16KB, 8 diagrams)
- ✅ API Documentation (`docs/architecture/05-api-design.md` - 20KB, 8 diagrams, 50+ procedures)
- ✅ Data Models (`docs/architecture/03-data-models.md` - 15KB, 6 diagrams, complete ERD)
- ✅ Component Architecture (`docs/architecture/04-component-architecture.md` - 12KB, 5 diagrams)
- ✅ Infrastructure (`docs/architecture/07-infrastructure.md` - 17KB, 7 diagrams)
- ✅ Security Model (`docs/architecture/10-security.md` - 16KB, 7 diagrams)
- ✅ Testing Strategy (`docs/architecture/09-testing-strategy.md` - 15KB, 7 diagrams)
- ✅ Frontend Architecture (`docs/architecture/frontend-architecture-current.md` - 21KB)
- ✅ Frontend Roadmap (`docs/architecture/frontend-architecture-roadmap.md` - 32KB)
- ✅ UX/UI Guidelines: Partial (shadcn/ui conventions documented)
- ✅ Technical Debt Documentation: Included in frontend roadmap
- ✅ **Project Brief**: Phase 2 requirements at `docs/brief.md`

**Documentation Quality**: **Excellent** - No gaps identified. All critical areas documented with 72+ Mermaid diagrams.

---

### 1.3 Enhancement Scope Definition

#### Enhancement Type
✅ **New Feature Addition** (Primary)
✅ **Integration with New Systems** (Secondary - public portal for warranty verification)
- Not checked: Major Feature Modification, Performance/Scalability, UI/UX Overhaul, Stack Upgrade

#### Enhancement Description

**Phase 2** transforms the Service Center from basic ticket tracking into a **comprehensive service management platform** by adding:

1. **Task-Based Workflow Management**: Structured, template-driven workflows with pre-defined task sequences for different service types (warranty, paid repair, replacement)
2. **Warranty Service Support**: Serial number verification, warranty tracking (manufacturer + company), RMA workflows
3. **Warehouse Management**: Two-tier architecture (Physical warehouses → Virtual warehouses) with physical product tracking and serial number management

#### Impact Assessment

✅ **Moderate to Significant Impact** (some existing code changes + new modules)

**Breakdown:**
- **Database Impact**: Significant - 8+ new tables (task templates, task instances, physical products, warehouses, serial numbers, warranty records, RMA requests, service requests)
- **API Impact**: Significant - 4+ new tRPC routers (workflow, warranty, warehouse, service-request)
- **Frontend Impact**: Moderate - New pages/components, but follows existing patterns
- **Existing Code Impact**: Minimal - Service ticket flow remains intact, enhancement is additive
- **RLS Impact**: Significant - New RLS policies for all new tables

---

### 1.4 Goals and Background Context

#### Goals

- **G1**: Reduce service errors by 40% through structured task workflows with mandatory checklists
- **G2**: Accelerate technician onboarding by 50% through standardized task templates
- **G3**: Achieve 95% warranty verification accuracy through serial number validation
- **G4**: Reduce inventory stockouts by 60% through warehouse management and low-stock alerts
- **G5**: Enable public-facing service request portal for warranty verification without authentication
- **G6**: Provide granular task-level progress visibility for managers
- **G7**: Establish RMA workflow for product replacements and warranty claims

#### Background Context

The Service Center application has successfully deployed Phase 1 and achieved strong adoption across all user roles (Admin, Manager, Technician, Reception). The existing system provides solid ticket management fundamentals but lacks three critical capabilities needed for scaling operations:

**Why This Enhancement Is Needed:**

1. **Operational Inefficiency**: Technicians rely on implicit knowledge of service procedures. Estimated 30% skip critical verification steps, leading to service quality inconsistencies and errors.

2. **Warranty Management Gap**: ~15% of warranty claims require rework due to eligibility verification issues. No upfront verification means accepting non-warranty items, causing customer dissatisfaction and lost revenue.

3. **Inventory Visibility**: No distinction between warranty stock, RMA staging, and dead stock. Managers spend 2-3 hours weekly manually tracking inventory. Frequent stockouts on critical warranty replacements.

4. **Business Growth**: 40% growth in warranty claim volume (Q4 2024), 3 new technicians onboarded (Q1 2025). Existing brownfield foundation (architecture, database, auth) is ready for enhancement.

**How It Fits the Existing Project:**

This enhancement builds **additively** on the existing brownfield architecture. The service ticket lifecycle (`pending → in_progress → completed`) remains intact. Phase 2 adds:
- Task execution layer **within** existing ticket workflow
- Warranty verification layer **before** ticket creation
- Warehouse management **parallel** to existing parts inventory

All new modules integrate with existing tRPC architecture, Supabase RLS model, and Next.js App Router patterns.

---

### 1.5 Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial Draft | 2025-10-23 | 1.0 | PRD created from Project Brief for Phase 2 | John (PM) |

---

## 2. Requirements

### 2.1 Functional Requirements

**FR1**: The system shall provide task template management allowing Admins to create, update, and delete workflow templates with associated task sequences.

**FR2**: The system shall support task templates configured by product type and service type (warranty, paid repair, replacement).

**FR3**: The system shall provide a task library with minimum 15 pre-defined task types across categories (Intake, Diagnosis, Repair, QA, Closing).

**FR4**: The system shall automatically instantiate task sequences from templates when a service ticket is created or service type changes.

**FR5**: The system shall enforce task dependencies, preventing dependent tasks from being marked complete until prerequisite tasks are completed.

**FR6**: The system shall allow technicians to execute tasks, add findings/notes, and mark tasks complete within the ticket workflow.

**FR7**: The system shall automatically transition ticket status based on task completion (e.g., ticket moves to "completed" when all tasks are done).

**FR8**: The system shall provide warehouse hierarchy management with physical warehouses containing virtual warehouses.

**FR9**: The system shall support 5 virtual warehouse types: Warranty Stock, RMA Staging, Dead Stock, In-Service, and Parts.

**FR10**: The system shall track physical products with serial numbers, product relationships, warranty dates (manufacturer + company), condition, and current location.

**FR11**: The system shall enforce unique serial number constraint across all physical products.

**FR12**: The system shall provide public-facing serial number verification without authentication, displaying warranty eligibility status.

**FR13**: The system shall allow customers to create service requests via public portal with serial number verification gate.

**FR14**: The system shall generate tracking tokens (SR-YYYYMMDD-XXXXX format) for service requests created via public portal.

**FR15**: The system shall provide stock movement workflows (receiving, transfer between warehouses, assignment to service, disposal).

**FR16**: The system shall generate low-stock alerts when physical product quantities fall below thresholds (by product type and virtual warehouse).

**FR17**: The system shall track warranty expiration dates and generate alerts 30 days before manufacturer or company warranty expires.

**FR18**: The system shall maintain integration with existing service ticket lifecycle without breaking current functionality.

**FR19**: The system shall support bulk import of physical products via CSV upload with serial numbers and warranty data.

**FR20**: The system shall allow Reception staff to convert verified service requests into service tickets with pre-filled customer/product data.

**FR21**: The system shall track task execution timestamps (started, completed) for reporting and analytics.

**FR22**: The system shall provide manager dashboard showing task-level progress across all active tickets.

**FR23**: The system shall log task completion events to service ticket comments for audit trail.

**FR24**: The system shall support RMA (Return Merchandise Authorization) workflow for product replacements with status tracking.

**FR25**: The system shall provide 1:N relationship between service requests and service tickets (one request can generate multiple tickets).

**FR26**: The system shall send 6 automated email notifications at key service milestones (request confirmation, product received, diagnosis complete, service completed, ready for pickup/delivery, deadline reminders).

**FR27**: The system shall provide customer delivery confirmation workflow with options for self-pickup or delivery request.

**FR28**: The system shall auto-fallback to self-pickup after 3 days if customer does not confirm delivery method.

**FR29**: The system shall track expected vs actual products received, flagging discrepancies for staff review.

**FR30**: The system shall support dynamic template switching when service type changes mid-workflow (preserve completed tasks, append new required tasks).

---

### 2.2 Non-Functional Requirements

**NFR1**: The system shall maintain existing performance characteristics; API response times must not exceed current P95 latency by more than 15%.

**NFR2**: The system shall support concurrent access by minimum 20 users without degradation (current capacity).

**NFR3**: Task execution UI shall be mobile-responsive for workshop/tablet use (min screen width: 375px).

**NFR4**: Public serial verification portal shall respond within 2 seconds for valid serial number lookups.

**NFR5**: The system shall maintain 99.5% uptime for public-facing service request portal.

**NFR6**: Database migrations shall be backward compatible, allowing zero-downtime deployments.

**NFR7**: The system shall enforce Row-Level Security (RLS) policies for all new tables consistent with existing security model.

**NFR8**: Physical product data import (CSV) shall process minimum 1,000 records within 30 seconds.

**NFR9**: The system shall maintain Vietnamese language support including filename sanitization for uploaded documents.

**NFR10**: All new UI components shall follow existing shadcn/ui design system and Tailwind CSS conventions.

**NFR11**: Task template changes shall not affect in-progress service tickets; only new tickets use updated templates.

**NFR12**: The system shall maintain ACID compliance for stock movements to prevent inventory discrepancies.

**NFR13**: Audit trail for task execution and stock movements shall be immutable and timestamped.

**NFR14**: Public portal shall implement rate limiting (max 100 requests/minute per IP) to prevent abuse.

**NFR15**: The system shall support horizontal scaling through existing multi-tenant Docker architecture.

---

### 2.3 Compatibility Requirements

**CR1: Existing API Compatibility**
- All existing tRPC procedures must remain functional without breaking changes
- New routers (workflow, warranty, warehouse, service-request) added alongside existing routers
- Existing client components continue to work with current API contracts

**CR2: Database Schema Compatibility**
- New tables integrate via foreign keys to existing tables (service_tickets, products, profiles)
- Existing database triggers and functions remain intact
- Existing RLS policies on service_tickets, customers, parts, products, profiles are not modified
- New ENUMs added without altering existing ENUMs

**CR3: UI/UX Consistency**
- New pages follow existing App Router structure: `app/(auth)/[module]/page.tsx`
- Task execution UI integrates into existing ticket detail view without replacing current functionality
- Warehouse management pages follow existing CRUD patterns (table + modal forms)
- Public portal uses same Tailwind CSS 4 theme and shadcn/ui components

**CR4: Integration Compatibility**
- Existing service ticket auto-numbering (SV-YYYY-NNN) continues unchanged
- Existing parts inventory stock adjustments remain functional alongside physical product tracking
- Existing comment/audit trail system extended (not replaced) to include task execution events
- Existing user roles (Admin, Manager, Technician, Reception) maintained; no new roles required for MVP

**CR5: Deployment Compatibility**
- New features deployable via existing Supabase migration workflow
- No changes to Docker Compose configuration or port allocation strategy
- Existing `.env` configuration variables unchanged; only additions allowed
- Backward compatible database migrations to support rollback scenarios

---

## 3. User Interface Enhancement Goals

### 3.1 Integration with Existing UI

**Design System Consistency:**
- All new components use existing shadcn/ui component library
- Follow current Tailwind CSS 4 utility-first approach
- Maintain existing color palette and typography scale
- Reuse existing form patterns (React Hook Form + Zod validation)

**Navigation Integration:**
- New workflow, warehouse, and request modules added to existing sidebar navigation
- Maintain current dashboard layout structure
- Follow existing breadcrumb and page header patterns
- Integrate with existing notification system

**Component Reuse:**
- Use existing Table component for data grids (tasks, warehouse stock, requests)
- Reuse existing Modal/Dialog components for forms
- Leverage existing Card components for dashboard widgets
- Utilize existing Badge components for status indicators

### 3.2 Modified/New Screens and Views

**New Pages (Admin/Manager):**
1. `/dashboard/workflows/templates` - Task template management
2. `/dashboard/workflows/task-types` - Task library
3. `/dashboard/warehouses` - Warehouse hierarchy management
4. `/dashboard/warehouses/stock-levels` - Inventory dashboard
5. `/dashboard/warehouses/movements` - Stock movement history
6. `/dashboard/requests` - Service request management

**Modified Pages (Existing):**
1. `/dashboard/tickets/[id]` - Enhanced with task execution UI (accordion section)
2. `/dashboard/tickets` - Add task progress column to ticket list
3. `/dashboard` - Add warehouse stock alerts widget

**New Pages (Technician):**
1. `/dashboard/my-tasks` - Personal task dashboard
2. `/dashboard/tickets/[id]/tasks/[taskId]` - Task completion form

**New Public Pages:**
1. `/request` - Service request creation form (multi-step wizard)
2. `/track/[token]` - Service request tracking page
3. `/confirm/[token]` - Delivery confirmation page
4. `/verify` - Serial number verification standalone page

### 3.3 UI Consistency Requirements

**Mobile Responsiveness:**
- All new pages must work on tablets (768px+) for workshop use
- Task execution UI optimized for iPad/Android tablet landscape mode
- Public request form fully responsive for mobile phones (375px+)
- Barcode scanner input fields work with mobile camera integration

**Accessibility:**
- Maintain WCAG 2.1 AA compliance across all new pages
- Keyboard navigation support for task workflows
- Screen reader compatibility for public portal
- Color contrast ratios meet existing standards

**Performance:**
- Page load times <2 seconds for dashboard pages
- Real-time task updates via TanStack Query polling (30-second intervals)
- Optimistic UI updates for task status changes
- Skeleton loaders for asynchronous data fetching

---

## 4. Technical Constraints and Integration Requirements

### 4.1 Existing Technology Stack

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

### 4.2 Integration Approach

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

### 4.3 Code Organization and Standards

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
- Use `type` over `interface` (enforced by coding standards)
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

### 4.4 Deployment and Operations

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

### 4.5 Risk Assessment and Mitigation

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

## 5. Epic and Story Structure

### 5.1 Epic Approach

**Epic Structure Decision:** **Single comprehensive epic** with logically sequenced stories

**Rationale:**
- All three modules (Task Workflow, Warranty/Warehouse, Service Request) are interconnected and build on the same foundation
- Splitting into separate epics would create artificial dependencies and delay integration testing
- Brownfield enhancement benefits from unified implementation approach to maintain system consistency
- Single epic allows for holistic testing of the complete service lifecycle

**Epic Goal:**
Transform Service Center from basic ticket tracking to comprehensive service management platform with task-based workflows, warranty verification, physical product tracking, and customer self-service portal.

**Integration Requirements:**
- Warehouse integration requires task workflow (warehouse OUT task when replacement approved)
- Service request portal requires serial verification which depends on physical products database
- Task workflow execution updates warehouse locations (product movements tied to tasks)
- All modules share existing service_tickets as integration point

**Story Sequencing Strategy (Risk-Minimizing Approach):**
1. **Foundation First**: Database schema and core data models
2. **Backend Before Frontend**: tRPC procedures before UI components
3. **Internal Before Public**: Staff-facing features before customer portal
4. **Incremental Integration**: Each story adds value while maintaining existing functionality
5. **Testing Checkpoints**: Verification that existing ticket workflow still works after each major story

---

## 6. Epic Details

### Epic 1: Service Center Phase 2 - Workflow, Warranty & Warehouse

**Epic Goal**: Deliver task-based workflow management, comprehensive warranty service support with two-tier warehouse management, and customer-facing service request portal to transform service operations and improve service quality, efficiency, and customer satisfaction.

**Integration Requirements**:
- Build additively on existing service ticket foundation
- Maintain backward compatibility with current ticket lifecycle
- Integrate with existing tRPC architecture, Supabase RLS, Next.js App Router
- Extend (not replace) existing audit trail and comment system

---

#### Story 1.1: Foundation Setup (Database + Frontend Structure)

**As a** developer,
**I want** to create all new database tables, types, relationships, AND frontend directory structure,
**so that** the foundation exists for task workflows, warehouse management, and service requests.

**Acceptance Criteria - Database:**
1. Create 12 new tables with proper foreign keys, indexes, and constraints
2. Add 4 new ENUM types (task_status, warehouse_type, request_status, product_condition) + extend existing ticket_status ENUM if needed
3. Extend service_tickets table with new nullable columns (template_id, request_id, delivery_method, delivery_address)
4. Create helper functions for auto-generation (tracking tokens, ticket numbers already exists)
5. Implement RLS policies for all new tables following existing security model (use existing `auth.check_role()` helper)
6. Create database views for stock levels and task analytics
7. All migrations are idempotent and include DOWN migrations for rollback
8. Create 3 new Supabase Storage buckets: `warehouse-photos`, `serial-photos`, `csv-imports`
9. **CRITICAL**: Follow schema dependency order:
   - Create new ENUMs in `00_base_types.sql` (or separate file loaded first)
   - Create helper functions in `00_base_functions.sql` (or separate file loaded second)
   - Create tables in numbered sequence (respect foreign key dependencies)
10. Schema files created in `docs/data/schemas/` (source of truth), then copied to `supabase/schemas/` via `./docs/data/schemas/setup_schema.sh`
11. Generate TypeScript types via `pnpx supabase gen types typescript` after schema changes
12. Generate migration via `pnpx supabase db diff -f phase2_foundation`

**Acceptance Criteria - Frontend Structure:**
9. Create new directory structure per `docs/architecture/frontend-architecture-roadmap.md`:
   - `src/types/` with subdirectory files (workflow.ts, warehouse.ts, warranty.ts, service-request.ts, enums.ts)
   - `src/hooks/` with hook files (use-workflow.ts, use-warehouse.ts, use-warranty.ts, use-service-requests.ts, use-debounce.ts)
   - `src/constants/` with constant files (workflow.ts, warehouse.ts, service-request.ts, messages.ts)
   - `src/components/forms/`, `src/components/tables/`, `src/components/modals/`, `src/components/shared/`
10. Create type definition stubs for new entities (TaskTemplate, PhysicalProduct, ServiceRequest, etc.)
11. Create constants for task statuses, warehouse types, request statuses
12. Update tsconfig.json if needed for new import paths

**Integration Verification:**
- IV1: Existing service_tickets queries run successfully with new nullable columns
- IV2: Creating new service ticket via existing tRPC procedure works without errors
- IV3: Existing RLS policies on service_tickets remain functional
- IV4: TypeScript compilation succeeds with new directory structure
- IV5: Existing components continue to import and work from flat structure

**Tables to Create:**
- task_templates, task_types, task_templates_tasks, service_ticket_tasks, task_history, ticket_template_changes
- physical_warehouses, virtual_warehouses, physical_products, stock_movements, product_stock_thresholds
- service_requests, email_notifications

**Storage Buckets to Create:**
- warehouse-photos (for product reception photos)
- serial-photos (for serial number verification)
- csv-imports (temporary storage for bulk imports)

**Estimated Effort:** 12-16 hours (was 8-12, increased due to frontend structure setup)

---

#### Story 1.2: Task Template Management (Admin)

**As an** administrator,
**I want** to create and manage task templates for different service types,
**so that** technicians follow standardized workflows for each product/service combination.

**Acceptance Criteria:**
1. Seed database with 15+ default task types (Initial Inspection, Run Diagnostic Tests, etc.)
2. Create tRPC `workflow` router with procedures:
   - `taskType.list` - Get all task types
   - `taskType.create` - Create custom task type
   - `template.create` - Create task template
   - `template.update` - Update template (creates new version)
   - `template.list` - List templates by product type
   - `template.assignToProduct` - Link template to product type + service type
3. Implement template versioning (editing creates new version, marks old inactive)
4. Build admin UI at `/dashboard/workflows/templates`
5. Drag-and-drop task ordering in template editor
6. Preview template before activation
7. Validation: Cannot delete template if in use by active tickets

**Integration Verification:**
- IV1: Creating templates does not affect existing ticket creation workflow
- IV2: Existing tickets without templates continue to function normally
- IV3: Admin dashboard navigation includes new Workflows section

**Technical Notes:**
- Use React DnD or similar library for drag-and-drop
- Template editor uses multi-step modal (details → tasks → review)
- Version history displayed in template list

**Estimated Effort:** 16-20 hours

---

#### Story 1.3: Automatic Task Generation on Ticket Creation

**As a** reception staff member,
**I want** tasks to be automatically created when I create a service ticket,
**so that** I don't have to manually set up the workflow.

**Acceptance Criteria:**
1. Create database trigger `generate_ticket_tasks()` that fires AFTER INSERT on service_tickets
2. Trigger finds appropriate template based on product_id + service_type
3. If template found, generate task instances linked to ticket_id
4. Set task sequence order, estimated durations, default assignees from template
5. Initial task status = 'pending' for all tasks
6. Update tRPC `tickets.create` procedure to return tasks array in response
7. Modify ticket detail page to display generated tasks (read-only accordion)
8. If no template found, ticket creates successfully with empty task list

**Integration Verification:**
- IV1: Existing ticket creation via tRPC still works for products without templates
- IV2: Ticket auto-numbering (SV-YYYY-NNN) continues to work correctly
- IV3: Existing ticket status transitions (pending → in_progress → completed) remain functional
- IV4: Creating ticket without assigned product (edge case) does not crash

**Technical Notes:**
- Trigger must be idempotent (don't generate tasks if they already exist for ticket)
- Task generation happens in same transaction as ticket creation (atomic)

**Estimated Effort:** 12-16 hours

---

*[Continuing with remaining 17 stories following the same pattern...]*

---

**Total Stories:** 20
**Estimated Total Effort:** 324-404 hours (includes frontend architecture setup in Story 1.1)
**Dependencies:** Sequential execution required for stories 1-8, parallel execution possible for stories 9-17
**Risk Mitigation:** Story 1.18 (Integration Testing) serves as quality gate before production deployment
**Rollback Strategy:** Database migrations reversible, feature flags can disable new UI if critical issues arise
**Architecture Strategy:** Story 1.1 creates target directory structure per frontend-architecture-roadmap.md; all subsequent stories use organized structure

---

## 7. Infrastructure Leverage Summary

### Existing Supabase Services Available for Phase 2

Phase 2 benefits significantly from the **comprehensive Supabase local stack** already running in production via docker-compose.yml. The following services are readily available and should be leveraged:

| Service | Version | Phase 2 Usage | Implementation Notes |
|---------|---------|---------------|----------------------|
| **PostgreSQL** | 15.8.1.085 | Primary database for all new tables | Add 12 new tables via migrations |
| **Kong API Gateway** | 2.8.1 | Reverse proxy for all Supabase APIs | Rate limiting (NFR14) configured here |
| **GoTrue Auth** | v2.180.0 | User authentication (existing) + **SMTP for emails** | Reuse SMTP config for Phase 2 email notifications |
| **PostgREST** | v13.0.7 | Direct REST API access if needed | Can supplement tRPC for public endpoints |
| **Realtime** | v2.51.11 | **Optional**: Real-time task/stock updates | Alternative to polling, WebSocket subscriptions |
| **Storage API** | v1.28.0 | **Primary**: File uploads (photos, CSVs) | Create 3 new buckets: warehouse-photos, serial-photos, csv-imports |
| **imgproxy** | v3.8.0 | Image optimization for storage | Automatic resize/optimize uploaded photos |
| **Postgres-Meta** | v0.91.6 | Migration management | Used by `pnpx supabase migration up` |
| **Edge Functions** | v1.69.6 | **Optional**: Custom email sending | Alternative to GoTrue SMTP if more control needed |
| **Logflare Analytics** | 1.22.6 | Log aggregation and monitoring | All service logs available for debugging |
| **Studio** | 2025.10.01 | Database UI (port 3000) | Development and troubleshooting |
| **Vector** | 0.28.1 | Log collection from Docker | Streams to Logflare |

### Key Infrastructure Advantages

1. **No New Services Required**: All Phase 2 needs already satisfied by existing stack
2. **SMTP Already Configured**: Email notifications can use existing GoTrue SMTP credentials
3. **Storage Already Running**: File uploads work out-of-box with Supabase Storage SDK
4. **Real-time Optional**: Can upgrade from polling to WebSocket subscriptions without infrastructure changes
5. **Monitoring Built-in**: Logflare + Vector provide comprehensive logging without additional setup
6. **Zero Additional Deployment Complexity**: All services orchestrated by existing docker-compose.yml

### Recommended Service Utilization Strategy

**Phase 2 MVP (Required Services):**
- ✅ PostgreSQL - Core database (12 new tables)
- ✅ Kong - API Gateway (rate limiting for public portal)
- ✅ GoTrue - SMTP for email notifications
- ✅ Storage API - File uploads (photos, CSVs)
- ✅ imgproxy - Image optimization
- ✅ Postgres-Meta - Migrations

**Phase 2 Enhancements (Optional Services):**
- 🔄 Realtime - Upgrade from polling to WebSocket (Story 1.16+)
- 🔄 Edge Functions - Custom email templates (if GoTrue SMTP insufficient)
- 🔄 PostgREST - Public API alternative to tRPC (if needed)

**Always Available (Operational Services):**
- 📊 Studio - Development/debugging
- 📊 Logflare + Vector - Monitoring and logging

---

**End of PRD Document**

