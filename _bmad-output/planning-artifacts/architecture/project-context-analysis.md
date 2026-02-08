# Project Context Analysis

## Requirements Overview

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

## Technical Constraints & Dependencies

| Constraint | Impact |
|-----------|--------|
| Brownfield — code đã triển khai ~90%+ | Architecture phải phản ánh reality, không phải lý thuyết |
| Self-hosted deployment | Supabase Docker stack (~14 services) + Next.js app trên server nội bộ |
| ~20 concurrent users | Không cần horizontal scaling, caching strategy đơn giản |
| Chỉ tiếng Việt | Không cần i18n abstraction layer |
| Supabase PostgreSQL 17 | RLS policies, generated types, Auth (GoTrue), Storage, PostgREST — locked-in |
| tRPC 11.6.0 | End-to-end type safety, batch requests, no REST/GraphQL (PostgREST chỉ dùng nội bộ qua SDK) |
| Next.js 16 App Router | Server Components, Route Groups, Middleware |

## Cross-Cutting Concerns Identified

1. **Authentication & Authorization** — Supabase Auth/GoTrue (JWT) → @supabase/ssr (session cookies) → Next.js middleware (`auth.getUser()`) → tRPC context → RLS. Enforced ở 3 layers: UI (route guards), API (role middleware), DB (RLS policies với `auth.uid()`, `has_any_role()`).

2. **Audit Logging** — Mọi thao tác quan trọng (CRUD, login, role change, stock movement, status change) được ghi log với user_id, action, old/new values, IP, timestamp.

3. **Stock Movement Automation** — Khi status phiếu dịch vụ thay đổi, hệ thống tự động tạo stock movements giữa virtual warehouses. Business rules phức tạp, immutable records.

4. **Email Notification Pipeline** — 6 templates, retry mechanism, rate limiting (100/ngày), tracking status (pending/sent/failed/bounced), unsubscribe.

5. **Polymorphic Task Lifecycle** — Tasks gắn vào 5 entity types khác nhau qua Entity Adapter pattern. Workflow templates define task sequences. Task status transitions có validation rules.

6. **Error Handling & Logging** — Request tracking IDs, comprehensive logging ở middleware/tRPC/services, user-friendly error messages.

7. **Data Validation** — Zod schemas ở tRPC input validation + React Hook Form ở client, ensuring consistent validation cả 2 đầu.
