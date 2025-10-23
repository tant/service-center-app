# Technology Stack

**Version:** 1.0 (Phase 2)
**Last Updated:** 2025-10-23
**Status:** Active

---

## Table of Contents

1. [Frontend Stack](#frontend-stack)
2. [Backend Stack](#backend-stack)
3. [Database & Infrastructure](#database--infrastructure)
4. [Development Tools](#development-tools)
5. [Package Management](#package-management)
6. [Configuration](#configuration)

---

## Frontend Stack

### Core Framework

| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Next.js** | 15.5.4 | React framework with App Router | [docs](https://nextjs.org/docs) |
| **React** | 19.1.0 | UI library | [docs](https://react.dev) |
| **TypeScript** | 5.x | Type-safe JavaScript | [docs](https://www.typescriptlang.org) |

**Configuration:**
- App Router architecture (not Pages Router)
- Turbopack for fast builds
- Server Components by default
- Strict TypeScript mode enabled

### API & State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **tRPC** | 11.6.0 | End-to-end type-safe API |
| **TanStack Query** | v5 | Server state management |
| **Zod** | Latest | Schema validation |

**tRPC Integration:**
```typescript
// src/server/routers/_app.ts
export const appRouter = router({
  admin: adminRouter,
  profile: profileRouter,
  tickets: ticketsRouter,
  customers: customersRouter,
  products: productsRouter,
  parts: partsRouter,
  brands: brandsRouter,
  revenue: revenueRouter,
  // Phase 2:
  workflow: workflowRouter,      // 🆕
  warehouse: warehouseRouter,    // 🆕
  warranty: warrantyRouter,      // 🆕
  serviceRequest: serviceRequestRouter, // 🆕
});
```

### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.0 | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library (40+ components) |
| **React Hook Form** | Latest | Form state management |
| **sonner** | Latest | Toast notifications |
| **lucide-react** | Latest | Icon library |

**shadcn/ui Components Available:**
- button, input, select, textarea
- dialog, sheet, dropdown-menu
- table, tabs, card
- badge, alert, toast
- form, label, checkbox, radio-group
- _and 25+ more..._

### File Structure (Phase 2)

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Protected routes
│   ├── (public)/           # Public routes
│   └── api/trpc/           # tRPC endpoint
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── forms/              # 🆕 Business forms
│   ├── tables/             # 🆕 Data tables
│   ├── modals/             # 🆕 Modal dialogs
│   └── shared/             # 🆕 Shared components
├── types/                  # 🆕 Type definitions
├── hooks/                  # 🆕 Custom hooks
├── constants/              # 🆕 Application constants
├── server/routers/         # tRPC routers
└── utils/supabase/         # Supabase clients
```

---

## Backend Stack

### API Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **tRPC** | 11.6.0 | Type-safe API procedures |
| **Supabase JS Client** | Latest | Database client library |

**tRPC Context:**
```typescript
// src/server/trpc.ts
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  // Two clients created per request:
  return {
    supabaseClient,  // Anon key + cookies (RLS enforced)
    supabaseAdmin,   // Service role (RLS bypassed) ⚠️
    user,            // Authenticated user from session
  };
};
```

### Authentication

| Service | Version | Purpose |
|---------|---------|---------|
| **Supabase Auth (GoTrue)** | v2.180.0 | JWT-based authentication |

**Features:**
- Email/password authentication
- Session management via cookies
- JWT token validation
- SMTP integration for emails

**User Roles:**
- `admin` - Full access
- `manager` - Management functions
- `technician` - Task execution
- `reception` - Customer service

---

## Database & Infrastructure

### Database

| Service | Version | Purpose |
|---------|---------|---------|
| **PostgreSQL** | 15.8.1.085 | Primary database |
| **PostgREST** | v13.0.7 | Auto-generated REST API |
| **Postgres-Meta** | v0.91.6 | Migration management |

**Extensions:**
- `pgvector` - Vector similarity search
- `pgsodium` - Encryption

**Key Features:**
- Row-Level Security (RLS)
- Database triggers for auto-calculations
- Generated columns
- Full-text search
- JSON/JSONB support

### Supabase Services (13 Total)

| Service | Version | Port | Purpose |
|---------|---------|------|---------|
| **PostgreSQL** | 15.8.1.085 | 5432 | Main database |
| **Kong** | 2.8.1 | 8000 | API Gateway |
| **GoTrue** | v2.180.0 | - | Authentication |
| **PostgREST** | v13.0.7 | - | REST API |
| **Realtime** | v2.51.11 | - | WebSocket subscriptions |
| **Storage** | v1.28.0 | - | File storage (S3-compatible) |
| **imgproxy** | v3.8.0 | - | Image transformation |
| **Edge Functions** | v1.69.6 | - | Serverless functions (Deno) |
| **Logflare** | 1.22.6 | - | Analytics & logging |
| **Studio** | 2025.10.01 | 3000 | Database UI |
| **Vector** | 0.28.1 | - | Log aggregation |
| **Postgres-Meta** | v0.91.6 | - | Metadata API |
| **Inbucket** | Latest | - | Email testing (SMTP) |

**Docker Compose Orchestration:**
```yaml
# All services defined in docker-compose.yml
# Started via: pnpx supabase start
# Stopped via: pnpx supabase stop
```

### Storage

**Supabase Storage (S3-Compatible):**
- Local filesystem backend: `./volumes/storage`
- Image optimization via imgproxy
- Multiple buckets supported

**Buckets:**
- `ticket-images` (existing) - Service ticket photos
- `warehouse-photos` (new) - Product reception photos
- `serial-photos` (new) - Serial verification photos
- `csv-imports` (new) - Bulk import files

### Email

**Options:**
1. **GoTrue SMTP** (Current) - Built-in SMTP via GoTrue
2. **Edge Functions** (Optional) - Custom email templates via Deno
3. **External Service** (Future) - SendGrid, Resend, etc.

**SMTP Configuration:**
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_SENDER_NAME=Service Center
```

---

## Development Tools

### Code Quality

| Tool | Version | Purpose | Command |
|------|---------|---------|---------|
| **Biome** | 2.2.0 | Linter + Formatter | `pnpm lint` / `pnpm format` |
| **TypeScript** | 5.x | Type checking | `pnpm tsc --noEmit` |

**Biome Configuration:**
```json
// biome.json
{
  "linter": { "enabled": true },
  "formatter": { "enabled": true }
}
```

### Testing (Planned)

| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| **Vitest** | Latest | Unit testing | Planned |
| **Playwright** | Latest | E2E testing | Planned |
| **React Testing Library** | Latest | Component testing | Planned |

**Current:** Manual testing via Integration Verification (IV) criteria in stories

### Database Tools

```bash
# Supabase CLI
pnpx supabase start           # Start local stack
pnpx supabase stop            # Stop services
pnpx supabase status          # Check status
pnpx supabase db reset        # Reset database (⚠️ deletes data)
pnpx supabase db diff -f name # Generate migration
pnpx supabase migration up    # Apply migrations
pnpx supabase gen types typescript --local > src/types/database.types.ts

# Schema setup script
./docs/data/schemas/setup_schema.sh
```

**Supabase Studio:**
- Access: `http://localhost:54323`
- Database browser
- SQL editor
- Table editor
- Authentication management
- Storage browser

---

## Package Management

### Package Manager

**pnpm** - Fast, disk space efficient package manager

```bash
pnpm install          # Install dependencies
pnpm add <package>    # Add package
pnpm remove <package> # Remove package
pnpm update          # Update packages
```

**Why pnpm:**
- Faster than npm/yarn
- Saves disk space (content-addressable store)
- Strict dependency resolution
- Better monorepo support

### Key Dependencies

```json
{
  "dependencies": {
    "next": "15.5.4",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "@trpc/server": "11.6.0",
    "@trpc/client": "11.6.0",
    "@trpc/react-query": "11.6.0",
    "@tanstack/react-query": "^5.0.0",
    "@supabase/supabase-js": "latest",
    "zod": "latest",
    "react-hook-form": "latest",
    "tailwindcss": "^4.0.0",
    "sonner": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@biomejs/biome": "2.2.0",
    "typescript": "^5.0.0",
    "@types/node": "latest",
    "@types/react": "latest"
  }
}
```

---

## Configuration

### Environment Variables

**Required:**
```bash
# Supabase (from `pnpx supabase start`)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Setup
SETUP_PASSWORD=your_setup_password

# Admin Account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password
ADMIN_NAME=Administrator

# SMTP (for email notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_SENDER_NAME=Service Center
```

**Phase 2 Additions:**
```bash
PUBLIC_REQUEST_PORTAL_ENABLED=true
WAREHOUSE_LOW_STOCK_ALERT_ENABLED=true
TASK_WORKFLOW_STRICT_MODE_DEFAULT=false
EMAIL_NOTIFICATION_ENABLED=true
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Next.js Configuration

```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@supabase/supabase-js'],
  experimental: {
    turbo: true,  // Turbopack for faster builds
  }
};
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

## Development Workflow

### Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start Supabase services
pnpx supabase start

# 3. Start Next.js dev server
pnpm dev

# Access:
# - App: http://localhost:3025
# - Studio: http://localhost:54323
# - API: http://localhost:8000
```

### Database Changes

```bash
# 1. Edit schema in docs/data/schemas/
vim docs/data/schemas/13_task_tables.sql

# 2. Run setup script
./docs/data/schemas/setup_schema.sh

# 3. Generate migration
pnpx supabase db diff -f migration_name

# 4. Review migration
cat supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql

# 5. Apply migration
pnpx supabase migration up

# 6. Generate types
pnpx supabase gen types typescript --local > src/types/database.types.ts
```

### Build Verification

```bash
# Before marking story complete:
pnpm build              # Build for production
pnpm tsc --noEmit      # Type check
pnpm lint              # Lint code
```

---

## Ports Reference

| Service | Port | URL |
|---------|------|-----|
| **Next.js App** | 3025 | http://localhost:3025 |
| **Supabase Studio** | 54323 | http://localhost:54323 |
| **Kong API Gateway** | 8000 | http://localhost:8000 |
| **PostgreSQL** | 5432 | postgresql://localhost:5432 |
| **Inbucket (Email)** | 54324 | http://localhost:54324 |

---

## Performance Targets

### Non-Functional Requirements

| Metric | Target | Monitoring |
|--------|--------|------------|
| **API Response Time (P95)** | < 500ms (15% increase allowed) | Logflare |
| **Serial Verification** | < 2s | Manual testing |
| **Database Query Time** | < 200ms | Studio monitoring |
| **Page Load Time** | < 3s | Browser DevTools |
| **Uptime (Public Portal)** | 99.5% | Health checks |
| **CSV Import (1000 records)** | < 30s | Manual testing |

---

## Security

### Authentication Flow

```
User → Next.js → tRPC → Supabase Admin Client → PostgreSQL
                  ↓
            Auth Check (ctx.user)
                  ↓
            Role Check (ctx.user.role)
                  ↓
              Data Access
```

### RLS vs Service Role

**RLS (Row-Level Security):**
- Enforced at database level
- Applies to anon/authenticated keys
- **NOT enforced for service role**

**Service Role (supabaseAdmin):**
- ⚠️ **Bypasses ALL RLS policies**
- Used in tRPC procedures
- **Manual auth checks required in every procedure**

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-23 | Initial Phase 2 tech stack documentation |

---

**Status:** Active for Phase 2 Development
**Last Updated:** 2025-10-23
