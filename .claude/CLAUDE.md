# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                    # Dev server on port 3025 (Turbopack)
pnpm build                  # Production build
pnpm start                  # Production server on port 3025
pnpm lint                   # Biome check (lint + format check)
pnpm format                 # Biome format --write

pnpx supabase start         # Start local Supabase stack (~14 containers)
pnpx supabase stop           # Stop (keep data)
pnpx supabase db reset       # Re-apply all schemas + seeds
pnpx supabase db diff --local -f <name>  # Capture schema changes
pnpx supabase gen types --local --lang typescript > src/types/database.types.ts  # Regenerate DB types
```

No test framework configured. No CI/CD pipeline.

## Architecture Overview

**Stack:** Next.js 16 App Router + tRPC 11 + Supabase self-hosted (PostgreSQL 17) + Tailwind CSS 4 + shadcn/ui

### Data Flow

```
Browser → Next.js App Router → Page Component
→ tRPC Client (React Query) → /api/trpc/[...trpc] → tRPC Router (Zod input + role middleware)
→ Service Layer → Supabase JS SDK (.from().select() — PostgREST) → PostgreSQL (RLS)
→ Response → React Query cache → UI
```

### Three Supabase Clients

The project uses three distinct Supabase client instances — never mix them:

| File | Purpose | Auth |
|------|---------|------|
| `src/utils/supabase/client.ts` | Browser components | `createBrowserClient()` — anon key, singleton |
| `src/utils/supabase/server.ts` | Server Components, Route Handlers | `createServerClient()` — anon key + cookies (respects RLS) |
| `src/lib/supabase/server.ts` | Admin operations in tRPC | `createClient()` — service role key (bypasses RLS) |

In tRPC context (`src/server/trpc.ts`), both `supabaseClient` (RLS-aware) and `supabaseAdmin` (bypass RLS) are available via `ctx`.

### tRPC Router Organization

18 domain routers registered in `src/server/routers/_app.ts`. Each router is one file per domain. The `inventory` router has nested subrouters (stock, receipts, issues, transfers, serials).

**Procedure pattern:**
```typescript
export const exampleRouter = router({
  getAll: publicProcedure
    .use(requireOperationsStaff)     // role middleware
    .input(z.object({ ... }))        // Zod validation
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabaseAdmin.from("table").select("*");
      return data;
    }),
});
```

**Role middleware** (`src/server/middleware/requireRole.ts`): `requireAdmin`, `requireManagerOrAbove`, `requireTechnician`, `requireOperationsStaff`, `requireAnyAuthenticated`. Each fetches the user's role from `profiles` table and adds `userRole` to context.

### Entity Adapter Pattern (Polymorphic Tasks)

The task system supports 5 entity types via a registry of adapters:

- `src/server/services/entity-adapters/base-adapter.ts` — abstract base with `onTaskComplete`, `onTaskStart`, `canStartTask`, `getEntityContext`
- `src/server/services/entity-adapters/registry.ts` — singleton `adapterRegistry`
- `src/server/services/entity-adapters/init.ts` — registers all 5 adapters, called at module load in `trpc.ts`

Entity types: `service_ticket`, `service_request`, `inventory_receipt`, `inventory_issue`, `inventory_transfer`. Each adapter defines auto-progression logic (e.g., ServiceTicketAdapter moves ticket to `in_progress` when first task starts).

### Auth & Route Groups

- `src/app/(auth)/layout.tsx` — Server-side auth check via `supabase.auth.getUser()`, redirects to `/login` if unauthenticated. Wraps content with sidebar layout.
- `src/app/(public)/` — No auth required (login, service request portal, tracking).
- No `src/middleware.ts` exists — auth is layout-based only.

### Role System

4 roles with hierarchy: `admin(4) > manager(3) > technician(2) > reception(1)`. Defined in `src/types/roles.ts` with `ROLE_HIERARCHY`, `PERMISSIONS` matrix, and helper functions. Three-layer authorization: UI (`<Can>` component) → tRPC middleware → PostgreSQL RLS.

## Key Conventions

- **Vietnamese-first UI** — All user-facing text, toast messages, error messages in Vietnamese
- **snake_case from DB** — Supabase returns `snake_case` fields; don't transform to camelCase
- **tRPC returns data directly** — No `{ data, error, success }` wrapper. Throw `TRPCError` for errors
- **React Query via tRPC** — Server state is the source of truth. No global state stores. Invalidate queries after mutations
- **Naming:** `snake_case` DB → `camelCase` routers/procedures → `PascalCase` components → `kebab-case` files
- **Path alias:** `@/*` maps to `src/*`
- **Styling:** Tailwind CSS 4 with OKLch colors, `cn()` utility from `src/lib/utils.ts` for class merging
- **Icons:** Tabler Icons (`@tabler/icons-react`) + Lucide (`lucide-react`)
- **Toast:** Sonner (`toast.success()`, `toast.error()`)
- **Tables:** TanStack Table with generic `data-table.tsx`
- **Container queries:** `@container/main` for responsive layout, `useIsMobile()` hook at 768px
- **Audit logging:** Call `createAuditLog()` in routers after important mutations
- **DB schema:** SQL files in `supabase/schemas/` ordered 100-999 (not standard migrations)
- **Stock movements are immutable** — write-once, never update or delete

## Database Access

No ORM. All DB access via Supabase JS SDK (PostgREST client):

```typescript
// Query
const { data, error } = await ctx.supabaseAdmin
  .from("service_tickets")
  .select("*, customers(*), profiles(*)")
  .eq("status", "in_progress")
  .order("created_at", { ascending: false });

// Mutation
const { data, error } = await ctx.supabaseAdmin
  .from("service_tickets")
  .update({ status: "completed" })
  .eq("id", ticketId)
  .select()
  .single();
```

Type safety comes from `src/types/database.types.ts` (auto-generated, 127KB). Regenerate after schema changes.
