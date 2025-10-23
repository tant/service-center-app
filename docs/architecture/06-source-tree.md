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
│   │   ├── (auth)/          # Protected routes
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── tickets/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── products/
│   │   │   │   └── page.tsx
│   │   │   ├── parts/
│   │   │   │   └── page.tsx
│   │   │   ├── team/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx   # Auth layout with sidebar
│   │   ├── (public)/        # Public routes
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── setup/
│   │   │       └── page.tsx
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
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── add-customer-form.tsx
│   │   ├── add-ticket-form.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── customer-select.tsx
│   │   ├── customer-table.tsx
│   │   ├── edit-customer-form.tsx
│   │   ├── edit-ticket-form.tsx
│   │   ├── product-select.tsx
│   │   ├── quick-upload-images-modal.tsx
│   │   ├── ticket-parts-manager.tsx
│   │   ├── ticket-status-badge.tsx
│   │   └── ticket-table.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── use-debounce.ts
│   │   └── use-media-query.ts
│   ├── lib/                 # Third-party library configs
│   │   └── utils.ts         # cn() for Tailwind merging
│   ├── server/              # tRPC backend
│   │   ├── routers/
│   │   │   ├── _app.ts      # Main router
│   │   │   ├── admin.ts     # Setup & config
│   │   │   ├── brands.ts    # Brand management
│   │   │   ├── customers.ts # Customer CRUD
│   │   │   ├── parts.ts     # Parts inventory
│   │   │   ├── products.ts  # Product catalog
│   │   │   ├── profile.ts   # User profiles
│   │   │   ├── revenue.ts   # Analytics
│   │   │   └── tickets.ts   # Service tickets (largest)
│   │   └── trpc.ts          # tRPC initialization
│   ├── types/               # TypeScript type definitions
│   │   └── database.types.ts  # Supabase generated types
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

```mermaid
graph TB
    App[app/]

    App --> Auth["(auth)/<br/>Protected Routes"]
    App --> Public["(public)/<br/>Public Routes"]
    App --> API[api/trpc/]

    Auth --> Dashboard[dashboard/]
    Auth --> Tickets[tickets/]
    Auth --> Customers[customers/]
    Auth --> Products[products/]
    Auth --> Parts[parts/]
    Auth --> Team[team/]

    Public --> Login[login/]
    Public --> Setup[setup/]

    API --> TRPCRoute["[...trpc]/route.ts"]

    style Auth fill:#4A90E2
    style Public fill:#50C878
    style API fill:#FFD700
```

**Route Groups:**
- `(auth)/` - Requires authentication, shares sidebar layout
- `(public)/` - No authentication, minimal layout
- `api/` - API routes (tRPC endpoint)

**File Conventions:**
- `page.tsx` - Page component (becomes route)
- `layout.tsx` - Shared layout for nested routes
- `loading.tsx` - Loading UI (Suspense fallback)
- `error.tsx` - Error boundary
- `not-found.tsx` - 404 page

---

### 6.3.2 `src/components/` - React Components

```mermaid
mindmap
  root((components/))
    ui/
      button.tsx
      card.tsx
      dialog.tsx
      form.tsx
      table.tsx
    Forms
      add-ticket-form.tsx
      edit-ticket-form.tsx
      add-customer-form.tsx
    Tables
      ticket-table.tsx
      customer-table.tsx
    Navigation
      app-sidebar.tsx
    Business Logic
      ticket-parts-manager.tsx
      quick-upload-images-modal.tsx
```

**Structure:**
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
