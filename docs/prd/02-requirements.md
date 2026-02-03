# 2. Requirements

**✅ IMPLEMENTATION STATUS: 30/33 Functional Requirements COMPLETE (91%)**
**Note**: FR1-FR30 have been implemented. FR31 (Default Warehouse Seeding), FR32-FR33 (Ticket Completion with Outcome & Replacement) require implementation. See `docs/plans/TICKET-COMPLETION-WITH-REPLACEMENT.md` for FR32-FR33 implementation plan.

## 2.1 Functional Requirements

**FR1**: The system shall provide task template management allowing Admins to create, update, and delete workflow templates with associated task sequences.

**FR2**: The system shall support task templates configured by product type and service type (warranty, paid repair, replacement).

**FR3**: The system shall provide a task library with minimum 15 pre-defined task types across categories (Intake, Diagnosis, Repair, QA, Closing).

**FR4**: The system shall automatically instantiate task sequences from templates when a service ticket is created or service type changes.

**FR5**: The system shall enforce task dependencies, preventing dependent tasks from being marked complete until prerequisite tasks are completed.

**FR6**: The system shall allow technicians to execute tasks, add findings/notes, and mark tasks complete within the ticket workflow.

**FR7**: The system shall automatically transition ticket status based on task completion (e.g., ticket moves to "completed" when all tasks are done).

**FR8**: The system shall provide warehouse hierarchy management with physical warehouses containing virtual warehouses.

**FR9**: The system shall support 7 virtual warehouse types: Main (default), Warranty Stock, RMA Staging, Dead Stock, In-Service, Parts, and Customer Installed (tracks sold products currently with customers).

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

**FR31**: The system shall automatically create a default physical warehouse named "Công ty" (Company) with all 7 virtual warehouse types linked on initial database setup, and these defaults shall be recreated on database reset and cannot be deleted by users.

**FR32**: The system shall support ticket completion with outcome tracking (repaired, warranty_replacement, unrepairable), allowing staff to select a replacement product from warranty_stock when outcome is warranty_replacement, and automatically update inventory locations.

**FR33**: The system shall display replacement product information on ticket detail page for warranty tickets, showing the selected replacement product's serial number, model, and warranty status.

---

### 2.1.1 Functional Requirements Implementation Mapping

**Task Workflow Requirements (FR1-FR7)** - ✅ Stories 01.02-01.05:
- FR1-FR3: Story 01.02 (Task Template Management)
- FR4: Story 01.03 (Automatic Task Generation)
- FR5-FR7: Stories 01.04-01.05 (Task Execution & Dependencies)

**Warehouse Requirements (FR8-FR11, FR15-FR17, FR19, FR31)** - ✅ Stories 01.06-01.10:
- FR8-FR9, FR31: Story 01.06 (Warehouse Hierarchy & Default Warehouse Seeding)
- FR10-FR11: Story 01.07 (Physical Product Master Data)
- FR15-FR17: Stories 01.08-01.09 (Stock Movements & Alerts)
- FR19: Story 01.10 (RMA Batch Operations - includes CSV import)

**Public Portal Requirements (FR12-FR14, FR20, FR25)** - ✅ Stories 01.11-01.13:
- FR12-FR14: Story 01.11 (Public Service Request Portal)
- FR20, FR25: Story 01.13 (Staff Request Management)

**Delivery & Communication Requirements (FR26-FR29)** - ✅ Stories 01.14-01.15:
- FR27-FR29: Story 01.14 (Customer Delivery Confirmation)
- FR26: Story 01.15 (Email Notification System)

**Enhanced Features Requirements (FR21-FR23, FR30)** - ✅ Stories 01.16-01.17:
- FR21-FR23: Story 01.16 (Manager Task Progress Dashboard)
- FR30: Story 01.17 (Dynamic Template Switching)

**Integration Requirements (FR18, FR24)** - ✅ Multiple Stories:
- FR18: Story 01.01 (Foundation maintains backward compatibility)
- FR24: Story 01.10 (RMA workflow)

**Ticket Completion & Warranty Replacement (FR32-FR33)** - 🔲 Story 01.22 (Pending):
- FR32-FR33: Story 01.22 (Ticket Completion with Outcome & Replacement Product)
- See: `docs/plans/TICKET-COMPLETION-WITH-REPLACEMENT.md`

---

## 2.2 Non-Functional Requirements

**✅ IMPLEMENTATION STATUS: 15/15 Non-Functional Requirements MET (100%)**

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

## 2.3 Compatibility Requirements

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

