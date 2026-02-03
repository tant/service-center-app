# Epic 1: Service Center Phase 2 - Workflow, Warranty & Warehouse

**Epic ID:** EPIC-01
**Project Code:** SC-PHASE2
**Created:** 2025-10-23
**Status:** Draft
**Priority:** High

---

## Epic Goal

Deliver task-based workflow management, comprehensive warranty service support with two-tier warehouse management, and customer-facing service request portal to transform service operations and improve service quality, efficiency, and customer satisfaction.

---

## Business Value

### Problems Being Solved

1. **Operational Inefficiency**: Technicians lack structured workflows, leading to 30% skipping critical verification steps
2. **Warranty Management Gap**: ~15% of warranty claims require rework due to verification issues
3. **Inventory Visibility**: No distinction between warehouse types; managers spend 2-3 hours weekly tracking inventory manually
4. **Customer Experience**: No self-service portal for warranty verification and service requests

### Success Metrics

- **G1**: Reduce service errors by 40% through structured task workflows
- **G2**: Accelerate technician onboarding by 50% through standardized templates
- **G3**: Achieve 95% warranty verification accuracy through serial number validation
- **G4**: Reduce inventory stockouts by 60% through warehouse management
- **G5**: Enable 24/7 customer self-service via public portal
- **G6**: Provide granular task-level progress visibility for managers
- **G7**: Establish RMA workflow for product replacements

---

## Integration Requirements

**Build Additively on Existing Foundation:**
- Existing service ticket lifecycle (`pending → in_progress → completed`) remains intact
- Task execution layer **within** existing ticket workflow
- Warranty verification layer **before** ticket creation
- Warehouse management **parallel** to existing parts inventory

**Technology Integration:**
- Integrate with existing tRPC architecture (11.6.0)
- Extend Supabase RLS model for new tables
- Follow Next.js App Router patterns
- Leverage existing shadcn/ui design system

**Data Integration:**
- Link to existing tables: service_tickets, products, customers, profiles, parts
- Add 12+ new tables with proper foreign keys
- Extend service_tickets with nullable columns (template_id, request_id, delivery_method)

---

## Story Structure and Sequencing

**Total Stories:** 22
**Estimated Effort:** 338-426 hours
**Sequencing Strategy:** Risk-Minimizing Approach

### Phase 1: Foundation (Stories 1-3)
**Foundation First - Database & Frontend Structure**

- **Story 1.1**: Foundation Setup (Database + Frontend Structure) - 12-16 hours
- **Story 1.2**: Task Template Management (Admin) - 16-20 hours
- **Story 1.3**: Automatic Task Generation on Ticket Creation - 12-16 hours

### Phase 2: Core Workflow (Stories 4-5)
**Backend Before Frontend - Task Execution**

- **Story 1.4**: Task Execution UI for Technicians - 20-24 hours
- **Story 1.5**: Task Dependencies and Status Automation - 12-16 hours

### Phase 3: Warehouse Foundation (Stories 6-7)
**Infrastructure Before Operations**

- **Story 1.6**: Warehouse Hierarchy Setup - 12-16 hours
- **Story 1.7**: Physical Product Master Data with Serial Tracking - 16-20 hours

### Phase 4: Warehouse Operations (Stories 8-10)
**Internal Before Public**

- **Story 1.8**: Serial Number Verification and Stock Movements - 16-20 hours
- **Story 1.9**: Warehouse Stock Levels and Low Stock Alerts - 12-16 hours
- **Story 1.10**: RMA Batch Operations - 16-20 hours

### Phase 5: Public Portal (Stories 11-14)
**Customer-Facing Features**

- **Story 1.11**: Public Service Request Portal - 20-24 hours
- **Story 1.12**: Service Request Tracking Page - 12-16 hours
- **Story 1.13**: Staff Request Management and Ticket Conversion - 24-28 hours
- **Story 1.14**: Customer Delivery Confirmation Workflow - 16-20 hours

### Phase 6: Enhanced Features (Stories 15-17)
**Value-Added Capabilities**

- **Story 1.15**: Email Notification System (6 Key Moments) - 20-24 hours
- **Story 1.16**: Manager Task Progress Dashboard - 16-20 hours
- **Story 1.17**: Dynamic Template Switching During Service - 16-20 hours

### Phase 7: Quality Assurance (Stories 18-20)
**Testing and Deployment**

- **Story 1.18**: Integration Testing and Regression Verification - 16-20 hours
- **Story 1.19**: Documentation and Training Materials - 12-16 hours
- **Story 1.20**: Production Deployment and Monitoring Setup - 8-12 hours

### Phase 8: Enhancements (Stories 21-22)
**Post-MVP Features**

- **Story 1.21**: Customer Delivery Confirmation - 8-12 hours
- **Story 1.22**: Ticket Completion with Outcome & Replacement Product - 6-10 hours *(NEW)*
  - FR32-FR33: Outcome tracking, replacement product selection from warranty_stock
  - See: `docs/plans/TICKET-COMPLETION-WITH-REPLACEMENT.md`

**Dependencies:**
- Sequential execution required for stories 1-8
- Parallel execution possible for stories 9-17
- Story 1.18 serves as quality gate before production deployment
- Stories 21-22 can be implemented after MVP deployment

---

## Compatibility Requirements

### Database Compatibility
- ✅ New tables integrate via foreign keys to existing tables
- ✅ Existing database triggers and functions remain intact
- ✅ Existing RLS policies unchanged; new policies for new tables only
- ✅ New ENUMs added without altering existing ENUMs
- ✅ Backward-compatible migrations support rollback

### API Compatibility
- ✅ All existing tRPC procedures remain functional
- ✅ New routers (workflow, warranty, warehouse, service-request) added alongside existing
- ✅ Existing client components continue to work with current API contracts

### UI/UX Compatibility
- ✅ New pages follow existing App Router structure
- ✅ Task execution UI integrates into existing ticket detail view
- ✅ Warehouse pages follow existing CRUD patterns
- ✅ Public portal uses same Tailwind CSS 4 theme and shadcn/ui

### Integration Compatibility
- ✅ Existing service ticket auto-numbering (SV-YYYY-NNN) continues unchanged
- ✅ Existing parts inventory stock adjustments remain functional
- ✅ Existing comment/audit trail system extended (not replaced)
- ✅ Existing user roles maintained; no new roles required for MVP

---

## Risk Management

### Technical Risks

**1. Database Migration Complexity (High)**
- **Risk**: 12+ new tables with triggers may cause migration failures
- **Mitigation**: Test migrations on staging, implement idempotent SQL, version control all changes
- **Known Constraints**: Trigger execution order matters (create base functions before triggers)

**2. Service Role Bypasses RLS (High) - ARCHITECTURAL CONSTRAINT**
- **Risk**: tRPC uses `supabaseAdmin` which bypasses ALL RLS policies
- **Impact**: Developer must manually verify authorization in every tRPC procedure
- **Mitigation**: Use `ctx.user` to verify authentication, call `auth.check_role()` helper, code review checklist

**3. Performance Degradation (Medium)**
- **Risk**: Complex joins for task + warehouse queries may slow ticket list
- **Mitigation**: Create database views, add strategic indexes, implement pagination, monitor P95 latency
- **Reference**: NFR1 allows 15% latency increase threshold

**4. Breaking Existing Ticket Workflow (High)**
- **Risk**: Adding template_id to service_tickets may affect existing queries
- **Mitigation**: Make new columns nullable, test all existing tRPC procedures, maintain backward compatibility
- **Rollback Plan**: Column can be dropped without data loss

### Deployment Risks

**1. Migration Rollback Complexity (Medium)**
- **Risk**: Reverting 12 new tables with foreign keys may fail
- **Mitigation**: Create explicit DOWN migrations, test rollback on staging, backup before production
- **Constraint**: Cannot rollback if production data already written to new tables

### Mitigation Strategies
- **Pre-Deployment Testing**: Full regression test of existing ticket workflows
- **Staged Rollout**: Deploy to staging first, monitor for 24 hours before production
- **Feature Flags**: Use environment variables to disable new features if issues arise
- **Monitoring Plan**: Track NFR1 (performance), NFR5 (uptime), NFR14 (rate limiting) metrics

---

## Definition of Done

### Epic-Level Completion Criteria

- ✅ All 22 stories completed with acceptance criteria met (Stories 21-22 are post-MVP enhancements)
- ✅ Integration testing passed (Story 1.18)
- ✅ Documentation complete (Story 1.19)
- ✅ Production deployment successful (Story 1.20)
- ✅ Zero regression in existing functionality
- ✅ All 7 business goals (G1-G7) achieved

### Story-Level Requirements

Each story must include:
- ✅ Integration Verification (IV) criteria demonstrating existing functionality remains intact
- ✅ Acceptance Criteria with testable conditions
- ✅ Technical Notes documenting implementation approach
- ✅ Effort estimation (hours)

### Quality Gates

- **After Story 1.1**: Verify existing service_tickets queries run successfully
- **After Story 1.5**: Verify existing ticket creation workflow intact
- **After Story 1.10**: Verify warehouse operations don't interfere with parts inventory
- **After Story 1.13**: Verify walk-in ticket creation continues to work
- **Story 1.18**: Quality gate - full regression testing before production

---

## Architecture Strategy

**Frontend Architecture:**
- Story 1.1 creates target directory structure per `frontend-architecture-roadmap.md`
- All subsequent stories use organized structure (types/, hooks/, constants/, components/forms/tables/modals/shared/)
- Establishes best practices without breaking existing flat structure

**Database-First Design:**
- Schema files in `docs/data/schemas/` (source of truth)
- Run `./docs/data/schemas/setup_schema.sh` to copy to `supabase/schemas/`
- Generate migration: `pnpx supabase db diff -f migration_name`
- Apply migration: `pnpx supabase migration up`
- Generate TypeScript types: `pnpx supabase gen types typescript`

**Schema Dependency Order (CRITICAL):**
- MUST create ENUMs first: `00_base_types.sql` or `11_phase2_types.sql`
- MUST create helper functions second: `00_base_functions.sql` or `12_phase2_functions.sql`
- THEN create tables in foreign key dependency order
- Triggers and views created after tables exist

---

## Infrastructure Leverage

### Existing Supabase Services (13 services available)

**Required for Phase 2 MVP:**
- ✅ PostgreSQL 15.8.1.085 - Core database (12 new tables)
- ✅ Kong 2.8.1 - API Gateway (rate limiting for public portal)
- ✅ GoTrue v2.180.0 - SMTP for email notifications
- ✅ Storage API v1.28.0 - File uploads (photos, CSVs)
- ✅ imgproxy v3.8.0 - Image optimization
- ✅ Postgres-Meta v0.91.6 - Migrations

**Optional Enhancements:**
- 🔄 Realtime v2.51.11 - Upgrade from polling to WebSocket (Story 1.16+)
- 🔄 Edge Functions v1.69.6 - Custom email templates (if GoTrue SMTP insufficient)
- 🔄 PostgREST v13.0.7 - Public API alternative to tRPC (if needed)

**Always Available:**
- 📊 Studio 2025.10.01 - Development/debugging (port 3000)
- 📊 Logflare 1.22.6 + Vector 0.28.1 - Monitoring and logging

---

## References

- **PRD**: `docs/prd.md` (sharded to `docs/prd/`)
- **Project Brief**: `docs/brief.md` (v1.1)
- **Architecture Docs**: `docs/architecture/` (10 shards)
- **Frontend Roadmap**: `docs/architecture/frontend-architecture-roadmap.md`
- **Stories Location**: `docs/stories/`

---

**Status**: Ready for Story Development
**Next Step**: Generate individual story files for stories 1.1-1.20
