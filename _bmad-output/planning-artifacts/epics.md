---
stepsCompleted: [step-01-validate-prerequisites, step-01-requirements-confirmed, step-02-epics-approved, step-03-stories-created, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - (codebase analysis - current source code, 322 TS files, 177 components, 47 pages)
projectContext: brownfield
implementationStatus: ~90% complete
---

# service-center-app - Epic Breakdown

## Overview

This document provides the epic and story breakdown for service-center-app, focusing on **GAP ANALYSIS** — only features that are NOT YET implemented or are incomplete in the current codebase. Requirements already implemented are listed for traceability but will NOT generate epics/stories.

## Requirements Inventory

### Functional Requirements

**Quản Lý Danh Mục (FR1-FR5)** — IMPLEMENTED
- FR1: Manager/Admin CRUD sản phẩm (tên, SKU, thương hiệu, loại, model, mô tả, hình ảnh, bảo hành) ✅
- FR2: Hệ thống từ chối SKU trùng ✅
- FR3: Manager/Admin CRUD thương hiệu ✅
- FR4: Manager/Admin CRUD linh kiện (parts) ✅
- FR5: Product-parts mapping (N:M) ✅

**Quản Lý Kho (FR6-FR15)** — MOSTLY IMPLEMENTED
- FR6: 7 kho ảo (main, warranty_stock, rma_staging, dead_stock, in_service, parts, customer_installed) ✅
- FR7: Phiếu nhập kho auto-numbering PN-YYYY-NNNN ✅
- FR8: 3 lý do nhập kho (purchase, customer_return, rma_return) ✅
- FR9: Serial number tracking per physical product ✅
- FR10: Phiếu xuất kho multi-reason ✅
- FR11: Phiếu chuyển kho giữa kho ảo ✅
- FR12: Immutable stock movement audit trail ✅
- FR13: Physical product tracking (condition, status, warehouse) ✅
- FR14: Ngưỡng tồn kho tối thiểu ⚠️ PARTIAL — DB view exists, UI/hook not implemented
- FR15: Tổng quan tồn kho, lọc, tìm kiếm ✅

**Quản Lý Khách Hàng (FR16-FR18)** — IMPLEMENTED
- FR16: CRUD khách hàng ✅
- FR17: Tìm kiếm theo tên/SĐT/email ✅
- FR18: Auto-fill khi SĐT đã tồn tại ✅

**Phiếu Yêu Cầu - Service Request (FR19-FR28)** — MOSTLY IMPLEMENTED
- FR19: Trang public tạo phiếu (không đăng nhập) ✅
- FR20: Staff tạo phiếu nội bộ ✅
- FR21: Tracking token 15 ký tự ✅
- FR22: 7 trạng thái workflow ✅
- FR23: Multiple items per request ✅
- FR24: Upload ảnh cho items ⚠️ PARTIAL — UI exists, Supabase Storage integration is placeholder
- FR25: Tra cứu tracking token (public) ✅
- FR26: Staff review/confirm/reject ✅
- FR27: Tracking trạng thái nhận hàng ✅
- FR28: Workflow gán cho phiếu yêu cầu ✅

**Phiếu Dịch Vụ - Service Ticket (FR29-FR41)** — MOSTLY IMPLEMENTED
- FR29: Tạo phiếu DV từ phiếu YC, mã SV-YYYY-NNN ✅
- FR30: 5 trạng thái workflow ✅
- FR31: Gán kỹ thuật viên ✅
- FR32: 4 mức ưu tiên ✅
- FR33: 3 loại bảo hành ✅
- FR34: 3 kết quả (repaired, warranty_replacement, unrepairable) ⚠️ PARTIAL — UI exists, task execution hook is stub
- FR35: Chọn sản phẩm thay thế từ warranty_stock ⚠️ PARTIAL — logic not fully wired
- FR36: Chi phí dịch vụ calculation ✅
- FR37: Service ticket parts (linh kiện sử dụng) ✅
- FR38: Comments/notes ✅
- FR39: Attachments ⚠️ PARTIAL — Supabase Storage integration placeholder
- FR40: Phương thức giao hàng (pickup/delivery) ✅
- FR41: Auto stock movements khi status thay đổi ⚠️ PARTIAL — hook stub, logic not fully wired

**Hệ Thống Task & Workflow (FR42-FR51)** — MOSTLY IMPLEMENTED
- FR42: Workflow templates ✅
- FR43: strict_sequence support ✅
- FR44: Polymorphic tasks (5 entity types) ✅
- FR45: Task status transitions (5 states) ✅
- FR46: completion_notes / blocked_reason ⚠️ PARTIAL — task execution hook is stub
- FR47: Task attachments ⚠️ PARTIAL — Supabase Storage placeholder
- FR48: Task status change history ✅
- FR49: Task library ✅
- FR50: Assign tasks to technicians ✅
- FR51: Audit khi đổi workflow template ✅

**RMA (FR52-FR56)** — PARTIALLY IMPLEMENTED
- FR52: Tạo lô RMA, mã RMA-YYYYMMDD-XXX ✅
- FR53: Gom serial từ rma_staging vào lô ✅ (deep analysis: validateRMASerials, addProductsToRMA fully implemented)
- FR54: 4 trạng thái RMA ✅ (deep analysis: finalizeRMABatch, completeRMABatch, cancelRMABatch implemented)
- FR55: Tracking number cho lô RMA ✅ (deep analysis: tracking_number field in createRMABatch/finalize)
- FR56: Nhập kho rma_return liên kết lô RMA ⚠️ PARTIAL — link logic not complete

**Email Notifications (FR57-FR65)** — IMPLEMENTED
- FR57-FR62: 6 email templates (request_submitted, received, rejected, ticket_created, service_completed, delivery_confirmed) ✅
- FR63: Email status tracking (pending/sent/failed/bounced) ✅
- FR64: Retry mechanism ✅
- FR65: Unsubscribe page ✅

**Dashboard & Analytics (FR66-FR69)** — IMPLEMENTED
- FR66: Dashboard tổng quan ✅
- FR67: Task progress ✅
- FR68: Revenue analytics ✅
- FR69: Staff notifications ✅

**Phân Quyền & Audit (FR70-FR77)** — IMPLEMENTED
- FR70: RBAC 4 vai trò ✅
- FR71: Admin CRUD tài khoản + gán role ✅
- FR72: Technician chỉ xem phiếu được gán ✅
- FR73: Reception permissions ✅
- FR74: RLS database-level ✅
- FR75: Audit logging ✅
- FR76: Audit log fields (user_id, action, old/new values, IP, timestamp) ✅
- FR77: System settings (SMTP, company info) ✅

**Trang Public (FR78-FR80)** — IMPLEMENTED
- FR78: Public pages không cần auth ✅
- FR79: Tạo phiếu, tra cứu, unsubscribe ✅
- FR80: Setup page khởi tạo admin ✅

### NonFunctional Requirements

- NFR1: API < 500ms P95 ✅ (React Query caching, tRPC batch)
- NFR2: Public page < 2s ✅
- NFR3: Auth page < 3s first load, < 1s navigation ✅
- NFR4: DB queries < 200ms with pagination ✅
- NFR5: HTTPS ✅
- NFR6: Auth with session management ✅
- NFR7: RLS enforced ✅
- NFR8: Audit logging ✅
- NFR9: API rate limiting ⚠️ PARTIAL — email rate limiting done, general API rate limiting not implemented
- NFR10: Email rate limiting 100/day ✅
- NFR11: No passwords in app code ✅
- NFR12: 99% uptime ✅ (Docker Compose deployment)
- NFR13: DB backup 24h ⚠️ NOT VERIFIED — needs Docker config check
- NFR14: Immutable stock movements ✅
- NFR15: TypeScript strict mode ✅
- NFR16: Migration scripts ✅
- NFR17: Dev onboarding < 1 day ⚠️ PARTIAL — docs outdated per user
- NFR18: Vietnamese only (no i18n) ✅

### Additional Requirements

**From Architecture:**
- Sentry integration (client + server + edge) — NOT IMPLEMENTED (6 files needed)
- CI/CD pipeline — DEFERRED (post go-live)
- Automated testing — DEFERRED (post go-live)
- Console.log cleanup → proper error handling — NOT DONE

**From UX:**
- `prefers-reduced-motion` CSS support — NOT IMPLEMENTED
- Skip links ("Skip to main content") — NOT IMPLEMENTED
- `lang="vi"` on `<html>` element — NOT IMPLEMENTED
- Screen reader testing — NOT DONE
- Notification center dropdown (bell icon) — NOT IMPLEMENTED as standalone component
- Onboarding tour component — NOT IMPLEMENTED

**From Codebase Analysis (TODO/FIXME gaps):**
- Warranty tracking hooks (use-warranty.ts) — 6 stubs: expiration monitoring, analytics, date calculations, verification, alerts
- Warehouse analytics hooks (use-warehouse.ts) — 4 stubs: movement tracking, analytics queries, movement history
- Task execution logic (use-workflow.ts) — 3 stubs: execution, progress tracking, status validation
- Supabase Storage integration — photo/document uploads are placeholder
- Delivery management — page exists, feature completion needed

### FR Coverage Map

| FR | Epic | Mô tả |
|----|------|-------|
| FR14 | Epic 6 | Ngưỡng tồn kho tối thiểu — UI/hook |
| FR24 | Epic 1 | Upload ảnh cho service request items |
| FR34 | Epic 2 | 3 kết quả ticket (repaired/replacement/unrepairable) |
| FR35 | Epic 2 | Chọn sản phẩm thay thế từ warranty_stock |
| FR39 | Epic 1 | Ticket attachments upload |
| FR41 | Epic 2 | Auto stock movements khi ticket status thay đổi |
| FR46 | Epic 2 | Task completion_notes / blocked_reason execution |
| FR47 | Epic 1 | Task attachments upload |
| FR53 | ✅ Implemented | Gom serial từ rma_staging — validateRMASerials, addProductsToRMA |
| FR54 | ✅ Implemented | RMA status transitions — finalize, complete, cancel |
| FR55 | ✅ Implemented | RMA tracking number — createRMABatch, finalize |
| FR56 | Epic 4 | Nhập kho rma_return liên kết lô RMA |
| NFR9 | Epic 6 | API rate limiting |
| Arch | Epic 5 | Sentry error monitoring integration |
| UX | Epic 6 | Accessibility improvements |
| Codebase | Epic 3 | Warranty tracking hooks |
| Codebase | Epic 6 | Warehouse analytics hooks |

## Epic List

### Epic 1: File Uploads & Media Management
Staff và khách hàng có thể upload ảnh/tài liệu cho phiếu yêu cầu, phiếu dịch vụ, và tasks — Supabase Storage integration thay thế placeholder hiện tại.
**FRs covered:** FR24, FR39, FR47

### Epic 2: Task Execution & Ticket Completion Workflow
Kỹ thuật viên hoàn thành full workflow sửa chữa — chẩn đoán → chọn kết quả (repaired/replacement/unrepairable) → auto stock movements → phiếu tự đóng. Đây là **defining interaction** của app.
**FRs covered:** FR34, FR35, FR41, FR46

### Epic 3: Warranty Verification & Monitoring
Hệ thống tự xác minh bảo hành khi tạo phiếu, cảnh báo sản phẩm sắp hết hạn, cung cấp warranty analytics. Wire các warranty hooks hiện đang là stub.
**FRs covered:** Related to FR34/FR35 (warranty outcomes) + warranty hook gaps

### Epic 4: RMA Receipt-to-Batch Linking
Bổ sung link giữa phiếu nhập kho rma_return và lô RMA gốc. RMA lifecycle (create, validate, add, finalize, complete, cancel) đã implement đầy đủ — chỉ thiếu receipt linking.
**FRs covered:** FR56

### Epic 5: Error Monitoring (Sentry Integration)
Team vận hành có visibility vào lỗi hệ thống qua Sentry — client-side errors, server-side errors, performance tracing, PII scrubbing.
**FRs covered:** Architecture requirement (6 files)

### Epic 6: Production Readiness & Polish
Hệ thống đạt chuẩn production — accessible (prefers-reduced-motion, skip links, lang="vi"), min stock threshold UI, warehouse analytics, API rate limiting, console.log cleanup.
**FRs covered:** FR14, NFR9 + UX accessibility gaps + codebase cleanup

---

## Epic 1: File Uploads & Media Management

Staff và khách hàng có thể upload ảnh/tài liệu cho phiếu yêu cầu, phiếu dịch vụ, và tasks — Supabase Storage integration thay thế placeholder hiện tại.

### Story 1.1: Supabase Storage Infrastructure & Upload API

As a developer,
I want a configured Supabase Storage bucket with upload/download tRPC procedures,
So that all file upload features have a shared foundation.

**Acceptance Criteria:**

**Given** the system has Supabase configured
**When** a storage bucket "attachments" is created with RLS policies
**Then** authenticated users can upload files up to 10MB (images: jpg/png/webp, docs: pdf)
**And** files are organized by entity type: `service-requests/{id}/`, `tickets/{id}/`, `tasks/{id}/`
**And** tRPC procedures `upload.getSignedUrl`, `upload.deleteFile`, `upload.listFiles` are available
**And** RLS policies restrict file access to users with appropriate roles

### Story 1.2: Service Request Photo Uploads (FR24)

As a customer or reception staff,
I want to upload photos of damaged products when creating a service request,
So that technicians can see the issue before receiving the product.

**Acceptance Criteria:**

**Given** a user is creating/editing a service request with items
**When** they select photos via the existing upload UI
**Then** photos are uploaded to Supabase Storage under `service-requests/{id}/`
**And** photo previews display in the form and on the detail page
**And** public service request form supports camera capture on mobile
**And** maximum 5 photos per item, each up to 5MB

### Story 1.3: Service Ticket Attachments (FR39)

As a staff member,
I want to attach files to a service ticket,
So that diagnostic photos, repair docs, and other evidence are linked to the ticket.

**Acceptance Criteria:**

**Given** a staff member is viewing a service ticket detail page
**When** they upload attachments via the existing attachment UI
**Then** files are stored under `tickets/{id}/`
**And** attachments display with filename, size, upload date, and preview (images)
**And** download and delete actions are available (role-permissioned)
**And** audit log records attachment additions/deletions

### Story 1.4: Task Attachments (FR47)

As a technician,
I want to upload photos and documents to a task,
So that I can document my work (diagnostic photos, repair evidence).

**Acceptance Criteria:**

**Given** a technician is working on a task (My Tasks or task detail)
**When** they upload files via the task attachment UI
**Then** files are stored under `tasks/{id}/`
**And** camera capture works on mobile for quick photo documentation
**And** attachments are visible on the task card and in the ticket detail view
**And** task completion can reference attached evidence

---

## Epic 2: Task Execution & Ticket Completion Workflow

Kỹ thuật viên hoàn thành full workflow sửa chữa. Backend (tasks.ts, tickets.ts, task-service.ts) đã hoàn chỉnh — epic này focus vào wire client-side hooks và cleanup legacy code.

**Note:** Deep analysis cho thấy setOutcome, auto stock movements, replacement picker, task start/complete/block/skip đều đã implemented ở backend. Gap chỉ ở client hooks.

### Story 2.1: Wire Task Execution Hooks to Existing API

As a technician,
I want the task list and progress tracking to work correctly on ticket detail pages,
So that I can see all tasks for a ticket and track completion progress.

**Acceptance Criteria:**

**Given** a service ticket has tasks assigned via a workflow
**When** a user views the ticket detail page
**Then** `useTicketTasks()` returns the full task list from `tasks.getEntityTasks`
**And** `useTaskProgress()` returns completion stats (total, completed, percentage)
**And** `useApplyTemplate()` correctly creates tasks from a workflow template
**And** `useTaskTransition()` validates task dependencies before allowing status changes (strict_sequence)

### Story 2.2: Deprecate Legacy Workflow Task Procedures

As a developer,
I want the legacy task procedures in `workflow.ts` removed or redirected,
So that there's a single source of truth for task operations via `tasks.ts`.

**Acceptance Criteria:**

**Given** `workflow.ts` contains duplicate task procedures (myTasks, updateTaskStatus, addTaskNotes, completeTask)
**When** these legacy procedures are deprecated
**Then** all UI components use `tasks.*` procedures instead of `workflow.*` equivalents
**And** legacy procedures are removed or marked deprecated
**And** no functionality is lost during migration

---

## Epic 3: Warranty Verification & Monitoring

Hệ thống cung cấp warranty monitoring và analytics. Core warranty verification (verifySerial, WarrantyStatusBadge, getWarrantyStatus) đã hoàn chỉnh — epic này focus vào wire các monitoring hooks hiện đang là stub trong `use-warranty.ts`.

### Story 3.1: Wire Warranty Monitoring Hooks & Dashboard Integration

As a manager,
I want to see which products have expiring warranties and warranty statistics on the dashboard,
So that I can proactively manage warranty claims and stock levels.

**Acceptance Criteria:**

**Given** products have manufacturer/user warranty dates in the database
**When** a manager views warranty-related data
**Then** `useWarrantyExpiringSoon(30)` returns products expiring within 30 days from DB reporting view
**And** `useWarrantyAnalytics()` returns counts of active/expiring/expired warranties
**And** `useWarrantyCheck(serial)` calls the existing `verifySerial` procedure
**And** warranty expiration data is available for dashboard widgets
**And** `useWarrantyCalculation()` correctly handles edge cases (is_active fix: `> 0` not `> 30`)

---

## Epic 4: RMA Receipt-to-Batch Linking

RMA lifecycle đã implement đầy đủ (create, validate, add products, finalize, complete, cancel). Epic này chỉ bổ sung link giữa phiếu nhập kho rma_return và lô RMA gốc.

### Story 4.1: Link Inventory Receipt (rma_return) to RMA Batch

As a manager,
I want to link an inventory receipt with reason `rma_return` to the original RMA batch,
So that the full RMA cycle is traceable: send defective products → receive replacements.

**Acceptance Criteria:**

**Given** a manager creates an inventory receipt with reason `rma_return`
**When** they select an RMA batch to link
**Then** the receipt form shows a dropdown of completed RMA batches (filtered by supplier)
**And** the receipt record stores `rma_batch_id` linking to the source batch
**And** the RMA batch detail page shows linked receipts (replacement products received)
**And** stock movements from the receipt are traceable to the RMA batch

---

## Epic 5: Error Monitoring (Sentry Integration)

Team vận hành có visibility vào lỗi hệ thống qua Sentry. Theo Architecture document — 6 files cần tạo/sửa.

### Story 5.1: Sentry SDK Setup & Configuration

As an operations team member,
I want Sentry error monitoring integrated into the application,
So that client-side and server-side errors are automatically captured and reported.

**Acceptance Criteria:**

**Given** a Sentry project is created with a DSN
**When** `@sentry/nextjs` is installed and configured
**Then** `sentry.client.config.ts` initializes browser SDK with 100% error sample rate, 10% transaction sample rate
**And** `sentry.server.config.ts` initializes server SDK for tRPC/API errors
**And** `sentry.edge.config.ts` initializes edge runtime SDK
**And** `src/instrumentation.ts` hooks into Next.js instrumentation
**And** `next.config.ts` is wrapped with `withSentryConfig` for source maps upload
**And** environment variables `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` are added to `.env.example`
**And** environments are configured: `development` and `production`

### Story 5.2: Error Context & PII Scrubbing

As an operations team member,
I want errors enriched with user context but without sensitive personal data,
So that I can debug issues effectively while respecting privacy.

**Acceptance Criteria:**

**Given** Sentry SDK is initialized
**When** an error occurs (client or server)
**Then** user context includes: role, userId (but NOT name, phone, email)
**And** `beforeSend` hook scrubs PII from error events (customer names, phone numbers, emails)
**And** request URLs are captured but query parameters with sensitive data are redacted
**And** unhandled promise rejections and React error boundaries report to Sentry
**And** tRPC error middleware captures server errors with request context

---

## Epic 6: Production Readiness & Polish

Hệ thống đạt chuẩn production — accessible, monitored, sạch logs, rate-limited. Tập hợp các gap nhỏ còn lại.

### Story 6.1: Accessibility Improvements

As a user (including those with disabilities),
I want the application to meet accessibility standards,
So that the system is usable with assistive technologies and respects user preferences.

**Acceptance Criteria:**

**Given** the application renders pages
**When** accessibility features are implemented
**Then** `<html lang="vi">` is set on the root element
**And** a "Skip to main content" link is added for keyboard users
**And** `prefers-reduced-motion` media query disables/reduces animations (sidebar transitions, toast animations, page transitions)
**And** all existing Radix primitives continue to provide keyboard navigation and focus management

### Story 6.2: Min Stock Threshold Alerts UI (FR14)

As a manager,
I want to see alerts when product stock drops below minimum thresholds,
So that I can reorder before running out of warranty replacement stock.

**Acceptance Criteria:**

**Given** products have min stock thresholds configured and a DB reporting view exists
**When** a manager views inventory or dashboard
**Then** a tRPC procedure returns products below minimum threshold per warehouse
**And** the inventory overview page highlights low-stock products with warning badges
**And** the dashboard shows a low-stock alert widget (count + link to filtered view)
**And** warehouse analytics hooks (`use-warehouse.ts` stubs) are wired to existing views

### Story 6.3: API Rate Limiting & Console Cleanup (NFR9)

As an admin,
I want API endpoints protected by rate limiting and production logs cleaned up,
So that the system is resilient against abuse and logs are meaningful.

**Acceptance Criteria:**

**Given** the application runs in production
**When** rate limiting is applied to API endpoints
**Then** tRPC endpoints have configurable rate limits (e.g., 100 requests/minute per IP)
**And** rate limit exceeded returns HTTP 429 with Vietnamese error message
**And** `console.log` statements throughout the codebase are removed or replaced with proper error handling
**And** only intentional logging remains (error boundaries, critical operations)
