# 2. Requirements

## 2.1 Functional Requirements

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

## 2.2 Non-Functional Requirements

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

