# 6. Epic Details

## Epic 1: Service Center Phase 2 - Workflow, Warranty & Warehouse

**Epic Goal**: Deliver task-based workflow management, comprehensive warranty service support with two-tier warehouse management, and customer-facing service request portal to transform service operations and improve service quality, efficiency, and customer satisfaction.

**Integration Requirements**:
- Build additively on existing service ticket foundation
- Maintain backward compatibility with current ticket lifecycle
- Integrate with existing tRPC architecture, Supabase RLS, Next.js App Router
- Extend (not replace) existing audit trail and comment system

**Total Stories**: 21 (Story 01.00 Foundation + Stories 01.01-01.20)
**Implementation Status**: 18/21 Complete (86%) - As of October 2025
**Note**: All feature development (Stories 01.00-01.17) COMPLETE. Only QA phase (01.18-01.20) remains.

---

### Story 01.00: Role-Based Access Control (RBAC) Implementation ✅ COMPLETE

**Status**: ✅ Complete (Oct 25, 2025)

**As a** system architect,
**I want** to implement comprehensive role-based access control across database, backend, and frontend,
**so that** users only access features and data appropriate for their role, ensuring security and audit compliance.

**Why This is Story 00 (Foundation):**
This story provides the security foundation that all other Phase 2 stories depend on. Without comprehensive RBAC:
- Cannot enforce technician-only task views (Story 1.4)
- Cannot restrict manager dashboards (Story 1.16)
- Cannot protect warehouse operations (Stories 1.6-1.10)
- Cannot audit template switches (Story 1.17)
- Cannot differentiate reception vs. technician access

**Key Deliverables (All Complete):**
1. **Database Layer**:
   - 6 role helper functions (`get_my_role()`, `has_role()`, `has_any_role()`, `is_manager_or_above()`, `is_technician()`, `is_reception()`)
   - `audit_logs` table with immutable records
   - 2 audit logging functions
   - Updated RLS policies for 5 core tables

2. **Backend Layer**:
   - `src/types/roles.ts` - Complete permission matrix (380 lines)
   - `src/server/middleware/requireRole.ts` - Main middleware + 5 convenience middlewares (211 lines)
   - `src/server/utils/auditLog.ts` - Audit logging utilities (350 lines)
   - 50+ API endpoints protected across 6 routers

3. **Frontend Layer**:
   - `src/hooks/use-role.ts` - Role checking hook (116 lines)
   - `src/components/auth/RequireRole.tsx` - Route guard component (81 lines)
   - `src/components/auth/Can.tsx` - Conditional rendering (90 lines)
   - `src/app/(auth)/unauthorized/page.tsx` - 403 error page (74 lines)

**Implementation Stats**:
- **Total Code**: ~2,500 lines across 18 files
- **API Endpoints Protected**: 50+
- **Database Tables with RLS**: 5
- **Documentation**: 6 comprehensive docs (3,000+ lines)

**Security Architecture (4 Layers)**:
1. UI Guards (RequireRole, Can components)
2. tRPC Middleware (requireRole checks)
3. Database RLS (Row-level security policies)
4. Audit Logging (Immutable audit trail)

**Role Permission Matrix**:
| Feature | Admin | Manager | Technician | Reception |
|---------|-------|---------|------------|-----------|
| View All Tickets | ✅ | ✅ | ❌ (assigned) | ✅ |
| Create Tickets | ✅ | ✅ | ❌ | ✅ |
| Assign Technician | ✅ | ✅ | ❌ | ❌ |
| Switch Template | ✅ | ✅ (audit) | ❌ | ❌ |
| Warehouse Mgmt | ✅ | ✅ | ✅ (RO) | ❌ |
| View Revenue | ✅ | ✅ | ❌ | ❌ |
| Team Management | ✅ | ❌ | ❌ | ❌ |

**Reference Documentation**:
- Story: `docs/stories/01.00.rbac-implementation.md`
- Specification: `docs/ROLES-AND-PERMISSIONS.md`
- Implementation Guide: `docs/IMPLEMENTATION-GUIDE-ROLES.md`
- Final Status: `docs/RBAC-FINAL-STATUS.md`

**Estimated Effort**: 12-16 hours
**Actual Effort**: ~4 hours

---

### Story 1.1: Foundation Setup (Database + Frontend Structure)

**As a** developer,
**I want** to create all new database tables, types, relationships, AND frontend directory structure,
**so that** the foundation exists for task workflows, warehouse management, and service requests.

**Dependencies**: Story 01.00 (RBAC Implementation) must be complete before starting this story

**Acceptance Criteria - Database:**
1. Create 12 new tables with proper foreign keys, indexes, and constraints
2. Add 4 new ENUM types (task_status, warehouse_type, request_status, product_condition) + extend existing ticket_status ENUM if needed
   - Note: `warehouse_type` was later extended to include 'main' ("Kho Chính") and legacy fields `display_name`/`color_code` on `virtual_warehouses` were removed via migrations `202510260014`..`202510260016`.
3. Extend service_tickets table with new nullable columns (template_id, request_id, delivery_method, delivery_address)
4. Create helper functions for auto-generation (tracking tokens, ticket numbers already exists)
5. Implement RLS policies for all new tables using role helper functions from Story 01.00 (`has_role()`, `has_any_role()`, etc.)
6. Create database views for stock levels and task analytics
7. All migrations are idempotent and include DOWN migrations for rollback
8. Create 3 new Supabase Storage buckets: `warehouse-photos`, `serial-photos`, `csv-imports`
9. **CRITICAL**: Follow schema dependency order:
   - Create new ENUMs in `00_base_types.sql` (or separate file loaded first)
   - Create helper functions in `00_base_functions.sql` (or separate file loaded second)
   - Create tables in numbered sequence (respect foreign key dependencies)
10. Schema files created in `docs/data/schemas/` (source of truth), then copied to `supabase/schemas/` via `./docs/data/schemas/setup_schema.sh`
11. Generate TypeScript types via `pnpx supabase gen types typescript` after schema changes
12. Generate migration via `pnpx supabase db diff -f phase2_foundation`

**Acceptance Criteria - Frontend Structure:**
9. Create new directory structure per `docs/architecture/frontend-architecture-roadmap.md`:
   - `src/types/` with subdirectory files (workflow.ts, warehouse.ts, warranty.ts, service-request.ts, enums.ts)
   - `src/hooks/` with hook files (use-workflow.ts, use-warehouse.ts, use-warranty.ts, use-service-requests.ts, use-debounce.ts)
   - `src/constants/` with constant files (workflow.ts, warehouse.ts, service-request.ts, messages.ts)
   - `src/components/forms/`, `src/components/tables/`, `src/components/modals/`, `src/components/shared/`
10. Create type definition stubs for new entities (TaskTemplate, PhysicalProduct, ServiceRequest, etc.)
11. Create constants for task statuses, warehouse types, request statuses
12. Update tsconfig.json if needed for new import paths

**Integration Verification:**
- IV1: Existing service_tickets queries run successfully with new nullable columns
- IV2: Creating new service ticket via existing tRPC procedure works without errors
- IV3: Existing RLS policies on service_tickets remain functional
- IV4: TypeScript compilation succeeds with new directory structure
- IV5: Existing components continue to import and work from flat structure

**Tables to Create:**
- task_templates, task_types, task_templates_tasks, service_ticket_tasks, task_history, ticket_template_changes
- physical_warehouses, virtual_warehouses, physical_products, stock_movements, product_stock_thresholds
- service_requests, email_notifications

**Storage Buckets to Create:**
- warehouse-photos (for product reception photos)
- serial-photos (for serial number verification)
- csv-imports (temporary storage for bulk imports)

**Estimated Effort:** 12-16 hours (was 8-12, increased due to frontend structure setup)

---

### Story 1.2: Task Template Management (Admin)

**As an** administrator,
**I want** to create and manage task templates for different service types,
**so that** technicians follow standardized workflows for each product/service combination.

**Acceptance Criteria:**
1. Seed database with 15+ default task types (Initial Inspection, Run Diagnostic Tests, etc.)
2. Create tRPC `workflow` router with procedures:
   - `taskType.list` - Get all task types
   - `taskType.create` - Create custom task type
   - `template.create` - Create task template
   - `template.update` - Update template (creates new version)
   - `template.list` - List templates by product type
   - `template.assignToProduct` - Link template to product type + service type
3. Implement template versioning (editing creates new version, marks old inactive)
4. Build admin UI at `/dashboard/workflows/templates`
5. Drag-and-drop task ordering in template editor
6. Preview template before activation
7. Validation: Cannot delete template if in use by active tickets

**Integration Verification:**
- IV1: Creating templates does not affect existing ticket creation workflow
- IV2: Existing tickets without templates continue to function normally
- IV3: Admin dashboard navigation includes new Workflows section

**Technical Notes:**
- Use React DnD or similar library for drag-and-drop
- Template editor uses multi-step modal (details → tasks → review)
- Version history displayed in template list

**Estimated Effort:** 16-20 hours

---

### Story 1.3: Automatic Task Generation on Ticket Creation

**As a** reception staff member,
**I want** tasks to be automatically created when I create a service ticket,
**so that** I don't have to manually set up the workflow.

**Acceptance Criteria:**
1. Create database trigger `generate_ticket_tasks()` that fires AFTER INSERT on service_tickets
2. Trigger finds appropriate template based on product_id + service_type
3. If template found, generate task instances linked to ticket_id
4. Set task sequence order, estimated durations, default assignees from template
5. Initial task status = 'pending' for all tasks
6. Update tRPC `tickets.create` procedure to return tasks array in response
7. Modify ticket detail page to display generated tasks (read-only accordion)
8. If no template found, ticket creates successfully with empty task list

**Integration Verification:**
- IV1: Existing ticket creation via tRPC still works for products without templates
- IV2: Ticket auto-numbering (SV-YYYY-NNN) continues to work correctly
- IV3: Existing ticket status transitions (pending → in_progress → completed) remain functional
- IV4: Creating ticket without assigned product (edge case) does not crash

**Technical Notes:**
- Trigger must be idempotent (don't generate tasks if they already exist for ticket)
- Task generation happens in same transaction as ticket creation (atomic)

**Estimated Effort:** 12-16 hours

---

*[Continuing with remaining 17 stories following the same pattern...]*

---

**Total Stories:** 20
**Estimated Total Effort:** 324-404 hours (includes frontend architecture setup in Story 1.1)
**Dependencies:** Sequential execution required for stories 1-8, parallel execution possible for stories 9-17
**Risk Mitigation:** Story 1.18 (Integration Testing) serves as quality gate before production deployment
**Rollback Strategy:** Database migrations reversible, feature flags can disable new UI if critical issues arise
**Architecture Strategy:** Story 1.1 creates target directory structure per frontend-architecture-roadmap.md; all subsequent stories use organized structure

---

