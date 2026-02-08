# Starter Template Evaluation

## Primary Technology Domain

Full-stack web application (SPA + SSR hybrid) — brownfield project đã triển khai ~90%+. Tech stack đã xác lập, document này ghi nhận và đánh giá tính phù hợp.

## Tech Stack Đã Xác Lập

| Layer | Technology | Version | Vai Trò |
|-------|-----------|---------|---------|
| Framework | Next.js App Router | 16.1.6 | SSR/SSG cho public, CSR cho auth pages |
| UI Library | React | 19.2.4 | Component rendering, hooks |
| Language | TypeScript strict | ^5 | Type safety toàn codebase |
| API Layer | tRPC | 11.6.0 | End-to-end type-safe RPC |
| Database | Supabase PostgreSQL 17 | self-hosted | Data storage, RLS, Auth, Storage, Realtime |
| Supabase JS SDK | @supabase/supabase-js | ^2.58.0 | PostgREST client, Auth, Storage API |
| Supabase SSR | @supabase/ssr | ^0.7.0 | Cookie-based session cho Next.js SSR |
| Supabase CLI | supabase (devDep) | ^2.48.3 | Local dev stack, type generation, migrations |
| Auth | Supabase Auth (GoTrue) | self-hosted | Session cookies, JWT, email/password |
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

## Đánh Giá Tính Phù Hợp

**Phù hợp xuất sắc với PRD:**
- tRPC end-to-end type safety cho 19+ routers phức tạp — loại bỏ API contract drift
- Supabase RLS enforce security ở database level — đáp ứng NFR7
- TypeScript strict mode — đáp ứng NFR15
- Tailwind + shadcn/ui — rapid UI development, WCAG compliance từ Radix
- TanStack Query — automatic cache invalidation, đáp ứng NFR1 (API < 500ms perceived)

**Architectural Decisions Được Tech Stack Xác Lập:**
- **Monorepo single app** — Frontend + API cùng codebase, deploy cùng server
- **Type chain:** `supabase gen types` → database.types.ts → Zod schemas → tRPC procedures → React components
- **Auth flow:** Supabase Auth (GoTrue) → @supabase/ssr session cookies → Next.js middleware → tRPC context → RLS
- **No REST/GraphQL exposed** — tRPC là API layer duy nhất cho client (PostgREST chỉ dùng nội bộ qua Supabase SDK)
- **No ORM** — Supabase JS SDK (PostgREST client) với `.from().select()` pattern, types generated từ schema
- **No i18n** — Hardcoded Vietnamese strings
- **CSS-in-utility** — Tailwind classes, không CSS modules hay styled-components

## Kết Luận

Tech stack hiện tại phù hợp hoàn toàn. Không cần thay đổi foundation. Architecture document này sẽ tập trung vào application-level decisions: cấu trúc code, patterns, conventions, và business logic organization.
