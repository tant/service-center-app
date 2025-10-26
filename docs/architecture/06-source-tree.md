# 6. Source Tree & File Organization

[← Previous: API Design](05-api-design.md) | [Back to Index](../architecture.md) | [Next: Infrastructure →](07-infrastructure.md)

---

## 6.1 Project Structure Overview

```mermaid
graph TB
    Root[Project Root]

    Root --> Src[src/<br/>Application Code]
    Root --> Docs[docs/<br/>Documentation]
    Root --> Supabase[supabase/<br/>Database]
    Root --> Public[public/<br/>Static Assets]
    Root --> Config[Config Files]

    Src --> App[app/<br/>Next.js App Router]
    Src --> Components[components/<br/>React Components]
    Src --> Server[server/<br/>tRPC Backend]
    Src --> Utils[utils/<br/>Utilities]
    Src --> Hooks[hooks/<br/>Custom Hooks]
    Src --> Types[types/<br/>TypeScript Types]

    Docs --> Architecture[architecture/<br/>Architecture Docs]
    Docs --> Data[data/schemas/<br/>Database Schemas]

    Supabase --> Migrations[migrations/<br/>SQL Migrations]
    Supabase --> Schemas[schemas/<br/>Schema Copies]

    style Src fill:#4A90E2
    style Docs fill:#50C878
    style Supabase fill:#FFD700
```

---

## 6.2 Complete Directory Tree

```
sevice-center/
├── .bmad-core/              # Multi-tenant instance data
├── .next/                   # Next.js build output (gitignored)
├── docs/                    # 📚 Documentation
│   ├── architecture.md      # Main architecture index
│   ├── architecture/        # Sharded architecture docs
│   │   ├── 01-introduction.md
│   │   ├── 02-technology-stack.md
│   │   ├── 03-data-models.md
│   │   ├── 04-component-architecture.md
│   │   ├── 05-api-design.md
│   │   ├── 06-source-tree.md (this file)
│   │   ├── 07-infrastructure.md
│   │   ├── 08-coding-standards.md
│   │   ├── 09-testing-strategy.md
│   │   ├── 10-security.md
│   │   ├── README.md
│   │   └── STATUS.md
│   └── data/
│       └── schemas/         # ⭐ Database schema source of truth
│           ├── 00_base_types.sql
│           ├── 00_base_functions.sql
│           ├── 01_profiles.sql
│           ├── 02_customers.sql
│           ├── 03_brands.sql
│           ├── 04_products.sql
│           ├── 05_parts.sql
│           ├── 06_product_parts.sql
│           ├── 07_service_tickets.sql
│           ├── 08_service_ticket_parts.sql
│           ├── 09_service_ticket_comments.sql
│           ├── 10_service_ticket_attachments.sql
│           ├── storage_policies.sql
│           └── setup_schema.sh
├── public/                  # Static assets
│   ├── favicon.ico
│   └── images/
├── scripts/                 # Automation scripts
│   └── setup-instance.sh    # Multi-tenant instance setup
├── src/                     # 🎯 Application source code
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Protected routes - Grouped by function
│   │   │   ├── dashboard/                  # Main dashboard + analytics
│   │   │   │   ├── page.tsx
│   │   │   │   ├── actions.ts
│   │   │   │   ├── data.json
│   │   │   │   ├── notifications/          # ✅ Notification center
│   │   │   │   │   └── page.tsx
│   │   │   │   └── task-progress/          # ✅ Task tracking
│   │   │   │       └── page.tsx
│   │   │   ├── operations/                 # 🎯 Daily Operations
│   │   │   │   ├── tickets/                # Service tickets
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── add/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [ticket-id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── edit/
│   │   │   │   │           └── page.tsx
│   │   │   │   ├── service-requests/       # Public service requests
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── deliveries/             # Delivery management
│   │   │   │   │   └── page.tsx
│   │   │   │   └── my-tasks/               # Technician tasks
│   │   │   │       └── page.tsx
│   │   │   ├── inventory/                  # 📦 Stock & Warehouse
│   │   │   │   ├── products/               # Physical products tracking
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── stock-levels/           # Stock levels & alerts
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── rma/                    # RMA management
│   │   │   │   │   └── page.tsx
│   │   │   │   └── warehouses/             # Warehouse management
│   │   │   │       └── page.tsx
│   │   │   ├── catalog/                    # 📚 Master Data
│   │   │   │   ├── products/               # Product catalog/SKU
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── parts/                  # Parts catalog
│   │   │   │   │   └── page.tsx
│   │   │   │   └── brands/                 # Brand management
│   │   │   │       └── page.tsx
│   │   │   ├── management/                 # 👥 Admin Functions
│   │   │   │   ├── customers/              # Customer management
│   │   │   │   │   └── page.tsx
│   │   │   │   └── team/                   # Team & users
│   │   │   │       └── page.tsx
│   │   │   ├── workflows/                  # ⚙️ Process Templates
│   │   │   │   ├── templates/              # Workflow templates
│   │   │   │   │   └── page.tsx
│   │   │   │   └── task-types/             # Task type definitions
│   │   │   │       └── page.tsx
│   │   │   ├── settings/                   # 🔧 Configuration
│   │   │   │   ├── account/                # User account settings
│   │   │   │   │   └── page.tsx
│   │   │   │   └── system/                 # System settings (admin)
│   │   │   │       └── page.tsx
│   │   │   ├── unauthorized/               # Access denied page
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx                  # Auth layout with sidebar
│   │   ├── (public)/        # Public routes
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── logout/
│   │   │   │   └── action.ts
│   │   │   ├── setup/
│   │   │   │   └── page.tsx
│   │   │   └── service-request/      # Public service request form
│   │   │       ├── page.tsx          # Request creation form
│   │   │       ├── track/
│   │   │       │   └── page.tsx      # Tracking page
│   │   │       └── success/
│   │   │           └── page.tsx      # Confirmation
│   │   ├── api/
│   │   │   └── trpc/
│   │   │       └── [...trpc]/
│   │   │           └── route.ts  # tRPC HTTP handler
│   │   ├── favicon.ico
│   │   ├── globals.css      # Tailwind imports
│   │   └── layout.tsx       # Root layout
│   ├── components/          # React components (flat structure)
│   │   ├── ui/              # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── providers/       # Context providers
│   │   │   └── trpc-provider.tsx
│   │   ├── tables/          # TanStack Table components
│   │   │   ├── email-notifications-table.tsx
│   │   │   ├── service-requests-table.tsx
│   │   │   ├── task-types-table.tsx
│   │   │   └── template-list-table.tsx
│   │   ├── inventory/       # Inventory-specific components
│   │   │   ├── product-inventory-table.tsx
│   │   │   └── ...
│   │   ├── warehouse/       # Warehouse-specific components
│   │   │   ├── physical-warehouse-table.tsx
│   │   │   ├── virtual-warehouse-table.tsx
│   │   │   └── warehouse-content.tsx
│   │   ├── workflow/        # Workflow-specific components
│   │   │   ├── task-card.tsx
│   │   │   └── ...
│   │   ├── app-sidebar.tsx              # Main sidebar navigation
│   │   ├── nav-overview.tsx             # Dashboard navigation
│   │   ├── nav-section.tsx              # Reusable section navigation
│   │   ├── nav-workflows.tsx            # Collapsible workflows nav
│   │   ├── nav-secondary.tsx            # Secondary links (Help, Support)
│   │   ├── nav-user.tsx                 # User profile dropdown
│   │   ├── customer-table.tsx
│   │   ├── ticket-table.tsx
│   │   ├── team-table.tsx
│   │   └── ...
│   │   ├── quick-upload-images-modal.tsx
│   │   ├── ticket-parts-manager.tsx
│   │   ├── ticket-status-badge.tsx
│   │   └── ticket-table.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   └── use-role.ts       # ✅ Phase 2 - Role-based hooks (Story 01.00)
│   ├── lib/                 # Third-party library configs
│   │   └── utils.ts         # cn() for Tailwind merging
│   ├── server/              # tRPC backend
│   │   ├── middleware/      # ✅ Phase 2 - Story 01.00
│   │   │   └── requireRole.ts  # RBAC middleware
│   │   ├── routers/
│   │   │   ├── _app.ts      # Main router (13 routers total)
│   │   │   ├── admin.ts     # Setup & config
│   │   │   ├── brands.ts    # Brand management
│   │   │   ├── customers.ts # Customer CRUD
│   │   │   ├── parts.ts     # Parts inventory
│   │   │   ├── products.ts  # Product catalog
│   │   │   ├── profile.ts   # User profiles
│   │   │   ├── revenue.ts   # Analytics
│   │   │   ├── tickets.ts   # Service tickets
│   │   │   ├── workflow.ts  # ✅ Phase 2 - Task templates & execution (43KB)
│   │   │   ├── warehouse.ts # ✅ Phase 2 - Physical/virtual warehouses (4KB)
│   │   │   ├── inventory.ts # ✅ Phase 2 - Physical products & RMA (40KB)
│   │   │   ├── serviceRequest.ts # ✅ Phase 2 - Public portal (28KB)
│   │   │   └── notifications.ts  # ✅ Phase 2 - Email system (11KB)
│   │   ├── utils/
│   │   │   └── auditLog.ts  # ✅ Phase 2 - Audit logging utility
│   │   └── trpc.ts          # tRPC initialization
│   ├── types/               # TypeScript type definitions
│   │   ├── database.types.ts   # Supabase generated types
│   │   └── roles.ts            # ✅ Phase 2 - Role types & permissions
│   └── utils/               # Utility functions
│       ├── supabase/
│       │   ├── admin.ts     # Service role client
│       │   ├── client.ts    # Browser client
│       │   ├── server.ts    # Server client
│       │   └── middleware.ts  # Auth middleware
│       ├── format.ts        # Formatting utilities
│       ├── sanitize-filename.ts  # Vietnamese char handling
│       └── trpc.ts          # tRPC client setup
├── supabase/                # Supabase configuration
│   ├── config.toml          # Supabase local config
│   ├── migrations/          # Generated SQL migrations
│   │   ├── 20250115000000_initial_schema.sql
│   │   └── ...
│   ├── schemas/             # Copy of docs/data/schemas/
│   └── seed.sql             # Seed data for development
├── tests/                   # ✅ Phase 2 - Test suite (Story 01.18)
│   └── e2e/                 # Playwright E2E tests
│       ├── 01-authentication.spec.ts
│       ├── 02-ticket-management.spec.ts
│       ├── 03-customer-management.spec.ts
│       ├── 04-product-management.spec.ts
│       ├── 05-parts-inventory.spec.ts
│       └── 06-role-permissions.spec.ts  # RBAC tests
├── playwright/              # ✅ Playwright configuration
│   └── config files         # Test artifacts and reports
├── playwright.config.ts     # ✅ Playwright configuration
├── .env                     # Environment variables (gitignored)
├── .gitignore
├── biome.json               # Biome linter/formatter config
├── components.json          # shadcn/ui config
├── next.config.ts           # Next.js configuration
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs       # PostCSS for Tailwind
├── tailwind.config.ts       # Tailwind CSS config
└── tsconfig.json            # TypeScript config
```

---

## 6.3 Key Directories Explained

### 6.3.1 `src/app/` - Next.js App Router

**Navigation Structure (October 2025 - Refactored):**

The application uses a **functional grouping** approach for better UX and role-based access control:

```mermaid
graph TB
    App["app/(auth)/"]

    App --> Dashboard["📊 dashboard/<br/>Analytics & Overview"]
    App --> Operations["🎯 operations/<br/>Daily Work"]
    App --> Inventory["📦 inventory/<br/>Stock & Warehouse"]
    App --> Catalog["📚 catalog/<br/>Master Data"]
    App --> Management["👥 management/<br/>Admin Functions"]
    App --> Workflows["⚙️ workflows/<br/>Process Templates"]
    App --> Settings["🔧 settings/<br/>Configuration"]

    Operations --> Tickets["tickets/<br/>Service tickets"]
    Operations --> ServiceReq["service-requests/<br/>Public requests"]
    Operations --> Deliveries["deliveries/<br/>Delivery management"]
    Operations --> MyTasks["my-tasks/<br/>Technician tasks"]

    Inventory --> InvProducts["products/<br/>Physical tracking"]
    Inventory --> StockLevels["stock-levels/<br/>Stock alerts"]
    Inventory --> RMA["rma/<br/>RMA management"]
    Inventory --> Warehouses["warehouses/<br/>Warehouse config"]

    Catalog --> CatProducts["products/<br/>Product SKU"]
    Catalog --> Parts["parts/<br/>Parts catalog"]
    Catalog --> Brands["brands/<br/>Brand management"]

    Management --> Customers["customers/<br/>Customer data"]
    Management --> Team["team/<br/>User management"]

    Workflows --> Templates["templates/<br/>Workflow templates"]
    Workflows --> TaskTypes["task-types/<br/>Task definitions"]

    Settings --> Account["account/<br/>User settings"]
    Settings --> System["system/<br/>Admin config"]

    style Dashboard fill:#FFD700
    style Operations fill:#4A90E2
    style Inventory fill:#FF6B6B
    style Catalog fill:#50C878
    style Management fill:#9370DB
    style Workflows fill:#FF8C00
    style Settings fill:#20B2AA
```

**Route Groups:**
- `(auth)/` - Requires authentication, shares sidebar layout
- `(public)/` - No authentication, minimal layout (login, service-request)
- `api/` - API routes (tRPC endpoint)

**URL Structure:**
```
/dashboard                       → Main dashboard
/operations/tickets             → Service tickets
/operations/service-requests    → Public service requests
/operations/deliveries          → Delivery management
/operations/my-tasks            → Technician tasks
/inventory/products             → Physical product tracking
/inventory/stock-levels         → Stock level monitoring
/inventory/rma                  → RMA batch management
/inventory/warehouses           → Warehouse configuration
/catalog/products               → Product catalog (SKU)
/catalog/parts                  → Parts catalog
/catalog/brands                 → Brand management
/management/customers           → Customer management
/management/team                → Team & user management
/workflows/templates            → Workflow templates
/workflows/task-types           → Task type definitions
/settings/account               → User account settings
/settings/system                → System configuration (admin)
```

**File Conventions:**
- `page.tsx` - Page component (becomes route)
- `layout.tsx` - Shared layout for nested routes
- `loading.tsx` - Loading UI (Suspense fallback)
- `error.tsx` - Error boundary
- `not-found.tsx` - 404 page
- `actions.ts` - Server actions

---

### 6.3.2 `src/components/` - React Components

**Navigation Components:**

```mermaid
graph TB
    AppSidebar[app-sidebar.tsx<br/>Main Sidebar Container]

    AppSidebar --> NavOverview[nav-overview.tsx<br/>Dashboard Navigation]
    AppSidebar --> NavSection[nav-section.tsx<br/>Reusable Section Component]
    AppSidebar --> NavWorkflows[nav-workflows.tsx<br/>Collapsible Workflows]
    AppSidebar --> NavSecondary[nav-secondary.tsx<br/>Help & Support Links]
    AppSidebar --> NavUser[nav-user.tsx<br/>User Profile Dropdown]

    NavSection --> Operations[Operations Section]
    NavSection --> Inventory[Inventory Section]
    NavSection --> Catalog[Catalog Section]
    NavSection --> Management[Management Section]
    NavSection --> Settings[Settings Section]

    style AppSidebar fill:#FFD700
    style NavSection fill:#4A90E2
```

**Component Structure:**
- **Flat** - All components in one directory (except `ui/`)
- **ui/** - shadcn/ui base components (copy-pasted, customizable)
- **Business Components** - Domain-specific (tickets, customers)

**Naming:**
- Files: `kebab-case.tsx`
- Exports: `PascalCase`

---

### 6.3.3 `src/server/` - tRPC Backend

```mermaid
graph LR
    Server[server/]
    Server --> TRPC[trpc.ts<br/>Context + Init]
    Server --> Routers[routers/]

    Routers --> App[_app.ts<br/>Main Router]
    Routers --> Tickets[tickets.ts<br/>15+ procedures]
    Routers --> Customers[customers.ts<br/>5 procedures]
    Routers --> Products[products.ts<br/>7 procedures]
    Routers --> Parts[parts.ts<br/>6 procedures]
    Routers --> More[...]

    style TRPC fill:#FFD700
    style App fill:#4A90E2
    style Tickets fill:#50C878
```

**Key Files:**
- `trpc.ts` - tRPC initialization, context creation (Supabase clients)
- `routers/_app.ts` - Combines all sub-routers
- `routers/*.ts` - Individual routers (one per domain)

---

### 6.3.4 `src/utils/` - Utilities

```mermaid
graph TB
    Utils[utils/]

    Utils --> Supabase[supabase/<br/>Client Configs]
    Utils --> Format[format.ts<br/>Currency, Date]
    Utils --> Sanitize[sanitize-filename.ts<br/>Vietnamese Support]
    Utils --> TRPCClient[trpc.ts<br/>Client Setup]

    Supabase --> Admin[admin.ts<br/>Service Role]
    Supabase --> Client[client.ts<br/>Browser Client]
    Supabase --> Server[server.ts<br/>Server Client]
    Supabase --> Middleware[middleware.ts<br/>Auth Middleware]

    style Supabase fill:#4A90E2
    style Admin fill:#FF6B6B
```

**Supabase Clients:**
- `admin.ts` - Service role (bypasses RLS), used in tRPC
- `client.ts` - Browser client (subject to RLS), for Client Components
- `server.ts` - Server client (with cookies), for Server Components
- `middleware.ts` - Auth middleware for route protection

---

### 6.3.5 `docs/` - Documentation

```mermaid
graph TB
    Docs[docs/]

    Docs --> Architecture[architecture/<br/>10 Shards]
    Docs --> Data[data/schemas/<br/>Database Schemas]

    Architecture --> Intro[01-introduction.md]
    Architecture --> Tech[02-technology-stack.md]
    Architecture --> DataModels[03-data-models.md]
    Architecture --> Components[04-component-architecture.md]
    Architecture --> API[05-api-design.md]
    Architecture --> SourceTree[06-source-tree.md]
    Architecture --> Infra[07-infrastructure.md]
    Architecture --> Standards[08-coding-standards.md]
    Architecture --> Testing[09-testing-strategy.md]
    Architecture --> Security[10-security.md]

    Data --> BaseTypes[00_base_types.sql]
    Data --> BaseFuncs[00_base_functions.sql]
    Data --> CoreTables[01-10_*.sql]

    style Architecture fill:#50C878
    style Data fill:#FFD700
```

---

### 6.3.6 `supabase/` - Database Configuration

```mermaid
graph LR
    Supabase[supabase/]

    Supabase --> Config[config.toml<br/>Local Settings]
    Supabase --> Migrations[migrations/<br/>SQL Files]
    Supabase --> Schemas[schemas/<br/>Copy from docs]
    Supabase --> Seed[seed.sql<br/>Test Data]

    style Migrations fill:#4A90E2
    style Schemas fill:#FFD700
```

**Migration Workflow:**
1. Edit schemas in `docs/data/schemas/`
2. Copy to `supabase/schemas/` via `setup_schema.sh`
3. Generate migration: `supabase db diff -f name`
4. Apply: `supabase db reset`

---

## 6.4 File Naming Conventions

```mermaid
graph TB
    subgraph "File Naming"
        Component[Components<br/>add-ticket-form.tsx]
        Page[Pages<br/>page.tsx]
        Layout[Layouts<br/>layout.tsx]
        API[API Routes<br/>route.ts]
        Util[Utils<br/>format-currency.ts]
        Hook[Hooks<br/>use-debounce.ts]
        Type[Types<br/>database.types.ts]
    end

    Component -.-> Rule1[kebab-case.tsx]
    Page -.-> Rule2[page.tsx fixed]
    Layout -.-> Rule3[layout.tsx fixed]
    API -.-> Rule4[route.ts fixed]
    Util -.-> Rule5[kebab-case.ts]
    Hook -.-> Rule6[use-*.ts]
    Type -.-> Rule7[*.types.ts]

    style Rule1 fill:#4A90E2
    style Rule2 fill:#50C878
    style Rule6 fill:#FFD700
```

**Conventions:**

| File Type | Pattern | Example |
|-----------|---------|---------|
| **Components** | `kebab-case.tsx` | `add-ticket-form.tsx` |
| **Pages** | `page.tsx` | `app/tickets/page.tsx` |
| **Layouts** | `layout.tsx` | `app/(auth)/layout.tsx` |
| **API Routes** | `route.ts` | `app/api/trpc/[...trpc]/route.ts` |
| **Utilities** | `kebab-case.ts` | `format-currency.ts` |
| **Hooks** | `use-*.ts` | `use-debounce.ts` |
| **Types** | `*.types.ts` | `database.types.ts` |

---

## 6.5 Import Path Aliases

**Configured in `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage Examples:**

```typescript
// ✅ CORRECT - Use alias
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/server';

// ❌ INCORRECT - Relative paths
import { trpc } from '../../../utils/trpc';
import { Button } from '../../components/ui/button';
```

**Benefits:**
- No `../../../` hell
- Easier refactoring
- Clear distinction (external vs internal)

---

## 6.6 Import Resolution Flow

```mermaid
graph LR
    Import[Import Statement]

    Import --> Check{Path starts<br/>with @/?}

    Check -->|Yes| Alias[Resolve from src/]
    Check -->|No| Check2{Starts with ./?}

    Check2 -->|Yes| Relative[Relative Import]
    Check2 -->|No| NodeModules[node_modules/]

    Alias --> File[Actual File]
    Relative --> File
    NodeModules --> Package[External Package]

    style Alias fill:#50C878
    style File fill:#4A90E2
```

**Examples:**

```typescript
// @/* → src/*
import { trpc } from '@/utils/trpc';
// Resolves to: src/utils/trpc.ts

// Relative import
import { helper } from './helper';
// Resolves to: same directory

// External package
import { z } from 'zod';
// Resolves to: node_modules/zod
```

---

## 6.7 Module Boundaries

```mermaid
graph TB
    subgraph "Client-Side Only"
        Client[Client Components<br/>'use client']
        BrowserClient[Browser Supabase Client]
    end

    subgraph "Server-Side Only"
        Server[Server Components]
        API[tRPC Procedures]
        AdminClient[Admin Supabase Client]
    end

    subgraph "Shared (Universal)"
        Types[Type Definitions]
        Utils[Utilities pure functions]
        Zod[Zod Schemas]
    end

    Client --> Types
    Server --> Types
    API --> Types

    Client --> Utils
    Server --> Utils
    API --> Utils

    Client --> BrowserClient
    API --> AdminClient

    style Client fill:#FFD700
    style Server fill:#4A90E2
    style Shared fill:#50C878
```

**Rules:**
- **Client Components** - Can't access server-only modules (Supabase admin, file system)
- **Server Components** - Can't use hooks, browser APIs
- **tRPC Procedures** - Server-only, use `ctx.supabaseAdmin`
- **Utilities** - Should be pure functions (work on both client/server)

---

## 6.8 Key Files Reference

| File | Purpose | Critical? |
|------|---------|-----------|
| `src/server/trpc.ts` | tRPC initialization, context creation | ⭐⭐⭐ |
| `src/server/routers/_app.ts` | Main router combining all sub-routers | ⭐⭐⭐ |
| `src/utils/supabase/admin.ts` | Service role Supabase client | ⭐⭐⭐ |
| `src/app/api/trpc/[...trpc]/route.ts` | tRPC HTTP handler | ⭐⭐⭐ |
| `docs/data/schemas/*.sql` | Database schema source of truth | ⭐⭐⭐ |
| `src/app/(auth)/layout.tsx` | Main app layout with sidebar | ⭐⭐ |
| `src/components/ui/*` | shadcn/ui base components | ⭐⭐ |
| `tailwind.config.ts` | Tailwind customization | ⭐⭐ |
| `next.config.ts` | Next.js configuration | ⭐⭐ |
| `biome.json` | Linter/formatter config | ⭐ |

---

## 6.9 Generated Files (Gitignored)

```bash
# Build artifacts
.next/                    # Next.js build output
dist/                     # Distribution build

# Dependencies
node_modules/             # npm packages
.pnpm-store/              # pnpm cache

# Environment
.env                      # Local environment variables

# Database
supabase/.temp/           # Supabase CLI temp files
supabase/functions/       # Edge functions (not used)

# IDE
.vscode/                  # VS Code settings (optional)
.idea/                    # IntelliJ settings

# Testing
coverage/                 # Test coverage reports
```

---

## 6.10 File Size Guidelines

**Recommended Limits:**

| File Type | Max Lines | Action if Exceeded |
|-----------|-----------|-------------------|
| **Component** | 300 | Split into smaller components |
| **tRPC Router** | 500 | Split into multiple routers |
| **Utility** | 200 | Split into multiple files |
| **Page** | 200 | Extract components |

**Example Split:**

```typescript
// ❌ BAD - One large tickets.ts router (800 lines)
export const ticketsRouter = router({
  list: /* ... */,
  create: /* ... */,
  update: /* ... */,
  // 15+ procedures
});

// ✅ GOOD - Split into multiple routers
// tickets/list.ts
export const ticketsListRouter = router({ /* ... */ });

// tickets/mutations.ts
export const ticketsMutationsRouter = router({ /* ... */ });

// tickets/_app.ts
export const ticketsRouter = router({
  ...ticketsListRouter,
  ...ticketsMutationsRouter,
});
```

---

## 6.11 Code Organization Best Practices

**DO:**
- ✅ Keep related files together (colocation)
- ✅ Use barrel exports (`index.ts`) for clean imports
- ✅ Extract reusable logic into hooks or utils
- ✅ Keep components focused (single responsibility)
- ✅ Use TypeScript path aliases (`@/*`)

**DON'T:**
- ❌ Create deeply nested directories (max 3 levels)
- ❌ Mix client and server code in same file
- ❌ Use relative imports for distant files
- ❌ Create giant "god" components
- ❌ Duplicate code across components

---

## 6.12 Finding Files Quickly

**By Pattern:**
```bash
# Find all tRPC routers
find src/server/routers -name "*.ts"

# Find all forms
find src/components -name "*-form.tsx"

# Find all pages
find src/app -name "page.tsx"
```

**By Content:**
```bash
# Find files using a specific component
grep -r "AddTicketForm" src/

# Find all tRPC procedure definitions
grep -r "publicProcedure" src/server/routers/
```

---

## Next Steps

Continue to [Infrastructure →](07-infrastructure.md) to understand the multi-tenant deployment architecture and Docker Compose setup.

---

[← Previous: API Design](05-api-design.md) | [Back to Index](../architecture.md) | [Next: Infrastructure →](07-infrastructure.md)
