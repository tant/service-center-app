# Implementation Patterns & Consistency Rules

## Pattern Categories Defined

**12 conflict areas** đã xác định và document dựa trên patterns hiện có trong codebase.

## Naming Patterns

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

## Structure Patterns

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
├── lib/
│   ├── supabase/
│   │   └── server.ts      # Admin client (service role, bypass RLS)
│   └── trpc/              # tRPC client setup
└── utils/
    └── supabase/
        ├── client.ts      # Browser client (@supabase/ssr createBrowserClient)
        ├── server.ts      # Server client (@supabase/ssr createServerClient, cookie-aware)
        └── middleware.ts   # Middleware session sync helper
```

**Rule:** Components tổ chức theo domain khi >3 files, shared khi <=3 files.

**Route Pattern:**
- List page: `/operations/tickets/page.tsx`
- Detail page: `/operations/tickets/[id]/page.tsx`
- Create page: `/operations/tickets/add/page.tsx`
- Edit page: `/operations/tickets/[id]/edit/page.tsx`

## Format Patterns

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

## Communication Patterns

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

## Process Patterns

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

## Enforcement Guidelines

**Tất cả code MỚI phải tuân thủ:**
1. Naming conventions đã document ở trên
2. tRPC procedures PHẢI có Zod input schema
3. Mutations quan trọng PHẢI có audit log
4. Role-based procedures PHẢI dùng middleware (requireRole, requireAdmin...)
5. User-facing messages PHẢI bằng tiếng Việt
6. Database changes PHẢI có migration file trong supabase/schemas/
7. New routes PHẢI nằm trong đúng route group ((auth)/ hoặc (public)/)

## Anti-Patterns (KHÔNG làm)

- Tạo REST endpoints ngoài tRPC
- Query database trực tiếp từ components (phải qua tRPC)
- Dùng `supabaseAdmin` ở client-side
- Hardcode role checks thay vì dùng middleware
- Dùng `any` type — always type properly
- Mutate state trực tiếp thay vì invalidate queries
- Tạo global state store cho server data
- Skip audit logging cho mutations quan trọng
