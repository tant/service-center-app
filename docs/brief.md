# Project Brief: Service Center Phase 2 - Workflow, Warranty & Warehouse

**Version:** 1.1
**Date:** 2025-10-23
**Project Code:** SC-PHASE2
**Status:** Draft for Review

**Changelog:**
- v1.1 (2025-10-23): Updated Technical Considerations to reflect full Supabase infrastructure stack (13 services), resolved email service decision (GoTrue SMTP), added frontend architecture improvement, clarified rate limiting approach
- v1.0 (2025-10-23): Initial draft

---

## Executive Summary

The Service Center Phase 2 project enhances the existing service ticket management system by introducing three critical capabilities: **Task-Based Workflow Management**, **Comprehensive Warranty Service Support**, and **Warehouse Management with Physical Product Tracking**.

Currently, the system tracks service tickets through simple status transitions (pending → in_progress → completed). Phase 2 transforms this into a structured, task-based workflow system that ensures consistency, enables warranty verification, and provides granular inventory control through two-tier warehouse management.

**Primary Problem Being Solved**: Service centers lack structured processes for managing complex repair workflows, cannot verify warranty eligibility upfront, and have no systematic way to track physical products and manage warehouse operations.

**Target Market**: Service and repair centers handling warranty claims, replacement workflows, and inventory management for electronic products and appliances.

**Key Value Proposition**: Transform from basic ticket tracking into a comprehensive service management platform with warranty verification, standardized task workflows, RMA management, and physical inventory control.

---

## Problem Statement

### Current State and Pain Points

The existing Service Center application (v1.0) provides solid fundamentals:
- Service ticket lifecycle management with automatic numbering
- Customer relationship management
- Product catalog and parts inventory tracking
- Role-based access control
- Real-time analytics dashboard

However, critical gaps exist:

1. **No Structured Workflow Management**
   - Technicians rely on implicit knowledge of service procedures
   - No standardized checklist ensures quality and consistency
   - Managers have no visibility into granular task progress
   - New technicians require extensive training to understand service procedures
   - **Impact**: Inconsistent service quality, errors in critical steps, slow onboarding

2. **No Warranty Verification System**
   - Cannot verify warranty eligibility before accepting products
   - No distinction between manufacturer warranty vs company warranty
   - No automated warranty expiration tracking
   - **Impact**: Accepting non-warranty items, customer dissatisfaction, lost revenue

3. **No Physical Product Tracking**
   - Parts inventory tracked, but not serialized products
   - Cannot trace individual products through service lifecycle
   - No RMA (Return Merchandise Authorization) workflow
   - **Impact**: Cannot manage product replacements, no audit trail for warranty claims

4. **No Warehouse Management**
   - No separation between warranty stock, RMA staging, and dead stock
   - Cannot track product movements between locations
   - No low-stock alerts for replacement inventory
   - **Impact**: Stockouts on critical warranty replacements, disorganized inventory

### Quantifiable Impact

- **Service Consistency**: Estimated 30% of technicians skip verification steps due to lack of checklists
- **Warranty Errors**: ~15% of warranty claims require rework due to eligibility verification issues
- **Inventory Visibility**: Managers spend 2-3 hours weekly manually tracking warranty stock levels
- **Customer Experience**: Average 2-day delay for customers waiting for warranty eligibility confirmation

### Why Existing Solutions Fall Short

- **Generic ticketing systems** (Zendesk, Freshdesk): Designed for IT support, not physical repair workflows
- **Inventory management systems** (Zoho Inventory): Lack service ticket integration and warranty tracking
- **Repair shop software** (RepairShopr, Syncro): Expensive, overly complex, lack Vietnamese language support

### Urgency and Importance

**Why Now:**
- Current system adoption is strong (all 4 user roles actively using)
- Business is scaling (3 new technicians onboarded in Q1 2025)
- Warranty claim volume increasing (40% growth in Q4 2024)
- Existing foundation (architecture, database, authentication) ready for enhancement

---

## Proposed Solution

### Core Concept and Approach

Phase 2 builds on the existing brownfield architecture to add three interconnected modules:

**1. Task Workflow System**
- Template-based workflows with pre-defined task sequences
- Different templates for warranty service, paid repair, and replacement scenarios
- Task library with reusable definitions (diagnosis, repair, QA steps)
- Dynamic template switching when service type changes
- Progress tracking at task level (not just ticket status)

**2. Warranty Service Layer**
- Serial number verification gate (public-facing portal)
- Two-tier warranty tracking (manufacturer + company warranties)
- Automatic warranty expiration calculations
- Service request creation before product drop-off
- Discrepancy management (expected vs received products)

**3. Warehouse Management**
- Two-level hierarchy: Physical Warehouses → Virtual Warehouses
- Virtual warehouse types: Warranty Stock, RMA Staging, Dead Stock, In-Service
- Physical product master data with serial number tracking
- Stock movement logging with barcode scanning support
- Low-stock alerts and automated reorder points

### Key Differentiators

**vs. Simple Status Tracking:**
- Granular task-level progress instead of black-box "in_progress" status
- Checklists ensure quality and completeness
- Historical data enables time estimation improvements

**vs. Generic Inventory Systems:**
- Purpose-built for service center workflows
- Integrated warranty verification and RMA management
- Seamless connection between service tickets and physical products

**vs. Competitor Solutions:**
- Built on existing brownfield foundation (no migration required)
- Fully type-safe end-to-end (TypeScript + tRPC)
- Vietnamese language support with filename sanitization
- Open-source stack (no vendor lock-in)

### Why This Solution Will Succeed

1. **Incremental Enhancement**: Builds on proven foundation rather than greenfield rewrite
2. **User-Centered Design**: Addresses actual pain points from current system users
3. **Technical Foundation**: Leverages existing architecture (Next.js, Supabase, tRPC)
4. **Clear ROI**: Reduces errors, speeds onboarding, improves warranty claim accuracy

### High-Level Vision

The product transforms service centers from reactive ticket processors into proactive service orchestrators with:
- **Predictable Quality**: Every product receives consistent service through structured workflows
- **Customer Confidence**: Upfront warranty verification and transparent tracking
- **Operational Excellence**: Real-time inventory visibility and automated alerts
- **Audit Compliance**: Complete traceability from service request through completion

---

## Target Users

### Primary User Segment: Service Technicians

**Demographics:**
- Age: 22-45 years
- Location: Vietnam (TP.HCM, Hà Nội)
- Role: Repair technicians for electronics and appliances
- Experience: 1-10 years in service industry

**Current Behaviors and Workflows:**
- Receive assigned tickets from managers
- Follow implicit procedures learned through training
- Update ticket status manually (pending → in_progress → completed)
- Add parts and comments to tickets
- Rely on senior technicians for complex issues

**Specific Needs and Pain Points:**
- Need clear, step-by-step checklists for unfamiliar products
- Want visibility into warranty status before starting work
- Need to track which parts are available for replacements
- Struggle with remembering all quality check steps
- Want to record diagnostic findings systematically

**Goals They're Trying to Achieve:**
- Complete repairs efficiently without errors
- Meet quality standards consistently
- Reduce rework from skipped verification steps
- Build expertise through structured learning

---

### Secondary User Segment: Service Managers

**Demographics:**
- Age: 28-50 years
- Role: Operations managers, team leads
- Responsibility: Oversee 5-20 technicians
- Focus: Quality control, resource allocation, customer satisfaction

**Current Behaviors and Workflows:**
- Assign tickets to technicians
- Monitor ticket status via dashboard
- Review monthly revenue and performance metrics
- Handle escalations and complex service decisions
- Manage product and parts inventory

**Specific Needs and Pain Points:**
- No visibility into task-level progress (tickets stuck in "in_progress" for days)
- Cannot identify workflow bottlenecks
- Manually track warranty stock levels
- Lack audit trail for warranty claims
- Cannot measure process efficiency

**Goals They're Trying to Achieve:**
- Ensure consistent service quality across all technicians
- Identify and resolve bottlenecks quickly
- Maintain adequate warranty replacement inventory
- Demonstrate compliance with manufacturer warranty requirements
- Optimize resource allocation

---

### Tertiary User Segment: Reception Staff

**Demographics:**
- Age: 20-35 years
- Role: Front desk, customer service
- Responsibility: Intake, customer communication

**Current Behaviors and Workflows:**
- Create new service tickets when customers arrive
- Look up customer and product information
- Answer customer questions about service status
- Handle product drop-off and pickup

**Specific Needs and Pain Points:**
- Cannot verify warranty eligibility upfront
- Customers arrive with non-eligible products (wasted trips)
- Lack detailed progress updates to share with customers
- Manual data entry for every intake

**Goals They're Trying to Achieve:**
- Reduce customer wait times at check-in
- Provide accurate service status updates
- Verify warranty before accepting products
- Minimize data entry through pre-filled forms

---

## Goals & Success Metrics

### Business Objectives

1. **Reduce Service Errors by 40%**
   - Metric: Percentage of tickets requiring rework due to skipped steps
   - Target: Decrease from 30% to 18% by Q3 2025
   - Measurement: Track rework tickets (status changes from completed back to in_progress)

2. **Improve Technician Onboarding Speed by 50%**
   - Metric: Days to productivity (completing 3 tickets independently)
   - Target: Reduce from 21 days to 10 days
   - Measurement: HR onboarding completion reports

3. **Increase Warranty Claim Accuracy to 95%**
   - Metric: Percentage of warranty claims accepted without rework
   - Target: Increase from 85% to 95%
   - Measurement: Warranty claim approval rate from manufacturers

4. **Reduce Inventory Stockouts by 60%**
   - Metric: Number of delayed replacements due to stock unavailability
   - Target: Reduce from 15/month to 6/month
   - Measurement: Tickets marked "waiting for replacement product"

5. **Enable 24/7 Customer Self-Service**
   - Metric: Service requests created outside business hours
   - Target: 30% of requests created via public portal
   - Measurement: Service request creation timestamps

### User Success Metrics

1. **Technician Task Completion Rate**
   - **What**: Percentage of required tasks marked complete
   - **Target**: >95% task completion rate
   - **Measurement**: Count of completed tasks / total required tasks

2. **Manager Dashboard Utilization**
   - **What**: Daily active managers viewing workflow dashboards
   - **Target**: 100% of managers check dashboard daily
   - **Measurement**: Analytics on dashboard page views

3. **Reception Verification Time**
   - **What**: Average time to verify warranty and create ticket
   - **Target**: Reduce from 8 minutes to 3 minutes
   - **Measurement**: Timestamp between customer arrival and ticket creation

4. **Customer Portal Adoption**
   - **What**: Percentage of customers using tracking portal
   - **Target**: 40% of customers access tracking link at least once
   - **Measurement**: Unique tracking link clicks

### Key Performance Indicators (KPIs)

1. **Workflow Compliance Rate**: Percentage of tickets completing all required tasks (Target: >90%)
2. **Warranty Verification Success Rate**: Valid serial numbers / total verification attempts (Target: >75%)
3. **Stock Accuracy**: Physical count matches system records (Target: >98%)
4. **Average Task Completion Time**: Mean duration for each task type (Baseline: TBD, Improvement: -20% by Q4 2025)
5. **RMA Turnaround Time**: Days from faulty product receipt to replacement dispatch (Target: <7 days)

---

## MVP Scope

### Core Features (Must Have)

**1. Task Template Management (Admin)**
- **Description**: Admin interface to create and manage workflow templates
- **Rationale**: Foundation for all workflow functionality; must exist before technicians can use tasks
- **Acceptance Criteria**:
  - CRUD operations for task templates
  - Assign templates to product types
  - Define task sequence with dependencies
  - Set estimated durations and default assignees
  - Activate/deactivate templates (versioning)

**2. Task Library with Default Types**
- **Description**: Pre-configured library of common task types (Initial Inspection, Diagnostic Tests, Component Replacement, Quality Check, etc.)
- **Rationale**: Accelerates template creation; provides standardization
- **Acceptance Criteria**:
  - Minimum 15 pre-defined task types across categories (Intake, Diagnosis, Repair, QA, Closing)
  - Admin can add custom task types
  - Categorization and search functionality

**3. Task Instance Execution (Technician Workflow)**
- **Description**: Technicians execute tasks on service tickets, mark complete, add findings
- **Rationale**: Core user experience for technicians; replaces black-box status updates
- **Acceptance Criteria**:
  - View task list for assigned ticket
  - Mark tasks complete with notes
  - Cannot mark dependent tasks until prerequisites complete
  - Task completion triggers ticket status transitions
  - Mobile-responsive UI for workshop use

**4. Warehouse Hierarchy Setup (Admin)**
- **Description**: Define physical warehouses and virtual warehouses
- **Rationale**: Organizational foundation for inventory management
- **Acceptance Criteria**:
  - Create physical warehouses (name, address)
  - Create virtual warehouses with parent physical warehouse
  - Pre-configured virtual warehouse types (Warranty Stock, RMA Staging, Dead Stock, In-Service, Parts)

**5. Physical Product Master Data**
- **Description**: Serial number tracking with warranty dates and product relationships
- **Rationale**: Enables warranty verification and product traceability
- **Acceptance Criteria**:
  - CRUD for physical products with serial numbers
  - Fields: serial, product_id, brand, import date, warranty dates (manufacturer + company), condition, location
  - Unique serial number constraint
  - Bulk import via CSV

**6. Serial Number Verification (Public Portal)**
- **Description**: Public-facing page where customers verify warranty eligibility
- **Rationale**: Gates non-warranty products; reduces reception workload
- **Acceptance Criteria**:
  - Input serial number → display product and warranty status
  - No authentication required
  - Mobile-responsive
  - Error messaging for invalid serials

**7. Stock Movement Tracking**
- **Description**: Log product movements between warehouses
- **Rationale**: Audit trail for product transfers; enables location tracking
- **Acceptance Criteria**:
  - Create movement record (product, from_location, to_location, reason, moved_by)
  - Automatic movements when ticket status changes
  - Movement history view per product

**8. Low Stock Alerts**
- **Description**: Automated notifications when warranty stock falls below threshold
- **Rationale**: Prevents stockouts on critical replacement inventory
- **Acceptance Criteria**:
  - Define reorder points per product type
  - Dashboard alert banner when stock below threshold
  - Email/toast notifications to managers

### Out of Scope for MVP

- **Barcode label printing** - Use existing serial number stickers
- **Supplier management and purchase orders** - Manage offline for now
- **Advanced warehouse features** (bin locations, picking routes, lot tracking)
- **Multi-location service centers** - Single physical location initially
- **Automated RMA submissions** to manufacturers - Manual process
- **Service request status SMS/email notifications** - Portal-only tracking
- **Parts inventory integration with warehouse** - Simplified consumption tracking only
- **Mobile app** - Mobile-responsive web only
- **Custom reporting** - Use existing analytics dashboard
- **Barcode scanner hardware integration** - Manual serial entry acceptable

### MVP Success Criteria

**MVP is successful if:**
1. ✅ 80%+ of service tickets use template-based workflows
2. ✅ 50%+ of warranty verifications happen via public portal
3. ✅ Warehouse stock levels are accurate within 5% variance
4. ✅ Zero stockouts on top-5 warranty replacement products
5. ✅ Technicians complete MVP training in <4 hours
6. ✅ System handles 100 concurrent service tickets without performance degradation

---

## Post-MVP Vision

### Phase 2 Features (3-6 Months Post-MVP)

**Enhanced Workflow Automation:**
- Automatic task assignment based on technician workload and expertise
- Task time tracking with performance analytics
- Workflow optimization suggestions based on historical data
- Approval workflows for high-value replacements

**Advanced Warranty Features:**
- RMA submission integration with manufacturer APIs
- Warranty claim document generation (PDF export)
- Customer notification automation (email/SMS when warranty verified)
- Warranty trend reporting (most common failures by product)

**Warehouse Optimization:**
- Barcode scanning mobile app for stock movements
- Bin location tracking within warehouses
- Automated reorder point calculations based on usage trends
- Supplier integration for purchase order management

### Long-term Vision (1-2 Year Horizon)

**Customer Portal Expansion:**
- Self-service ticket creation (upload photos, describe issue)
- Real-time task progress updates
- Direct messaging with technicians
- Service history and warranty lookup

**Business Intelligence:**
- Predictive maintenance alerts based on product age and failure patterns
- Technician performance dashboards with task completion metrics
- Cost per repair analytics (labor + parts + overhead)
- Customer satisfaction tracking post-service

**Ecosystem Integration:**
- Manufacturer warranty portal integrations (automatic claim submission)
- Shipping carrier integrations for RMA tracking
- Accounting system integration (parts consumption → COGS)
- E-commerce integration for replacement product sales

### Expansion Opportunities

**Geographic Expansion:**
- Multi-location warehouse management
- Inter-branch product transfers
- Regional service request routing

**Service Type Expansion:**
- Preventive maintenance scheduling
- On-site repair workflows
- Installation service tracking

**Industry Verticals:**
- Automotive service centers
- Appliance repair shops
- Medical equipment maintenance

---

## Technical Considerations

### Platform Requirements

**Target Platforms:**
- Web application (desktop + tablet + mobile browsers)
- Minimum browser support: Chrome 90+, Safari 14+, Edge 90+

**Browser/OS Support:**
- Desktop: Windows 10+, macOS 11+, Ubuntu 20.04+
- Mobile: iOS 14+, Android 10+
- Tablet: iPad (iOS 14+), Android tablets

**Performance Requirements:**
- Page load time: <2 seconds on 3G connection
- API response time: <500ms for 95th percentile
- Support 100 concurrent users
- Database queries: <200ms average

### Technology Preferences

**Frontend:**
- **Framework**: Next.js 15.5.4 (App Router) - **KEEP** existing
- **UI Library**: React 19.1.0 - **KEEP** existing
- **Styling**: Tailwind CSS 4 + shadcn/ui - **KEEP** existing
- **State Management**: TanStack Query + tRPC - **KEEP** existing
- **Forms**: react-hook-form + Zod validation - **KEEP** existing

**Backend:**
- **API Layer**: tRPC 11.6.0 - **KEEP** existing
- **Database**: Supabase Local Stack (13 services via Docker Compose) - **KEEP** existing
  - PostgreSQL 15.8, Kong API Gateway, GoTrue Auth, PostgREST, Realtime, Storage API, imgproxy, Postgres-Meta, Edge Functions, Logflare, Studio, Vector
- **Authentication**: Supabase Auth (GoTrue) with JWT - **KEEP** existing
- **Storage**: Supabase Storage API with imgproxy for image optimization - **KEEP** existing
- **Email**: GoTrue SMTP integration (already configured in production) - **LEVERAGE** existing

**Database:**
- **Primary**: PostgreSQL 15 via Supabase - **KEEP** existing
- **New Tables**:
  - `task_templates`, `task_types`, `template_tasks`
  - `task_instances` (links to service_tickets)
  - `physical_warehouses`, `virtual_warehouses`
  - `physical_products`, `stock_movements`
  - `service_requests` (public portal)
- **New Storage Buckets**: `warehouse-photos`, `serial-photos`, `csv-imports`

**Hosting/Infrastructure:**
- **Development**: Supabase local (Docker) - **KEEP** existing
- **Production**: Vercel (frontend) + Supabase Cloud (backend)
- **Multi-tenant**: Port-based isolation - **KEEP** existing

### Architecture Considerations

**Repository Structure:**
- **Monorepo**: Single repository - **KEEP** existing brownfield codebase
- **Frontend Architecture**: Establish organized directory structure (types/, hooks/, constants/, components/forms/tables/modals/shared/) - **NEW** for Phase 2, enables gradual migration of existing components
- **New Routes**:
  - `/workflows` - Template management (Admin)
  - `/tasks` - Task execution (Technician)
  - `/warehouse` - Stock management (Manager)
  - `/public/verify` - Serial verification (Public)
  - `/public/track` - Request tracking (Public)

**Service Architecture:**
- **Pattern**: Serverless functions via Next.js API routes - **KEEP** existing
- **New tRPC Routers**:
  - `taskTemplates.*` - Template CRUD
  - `taskInstances.*` - Task execution
  - `warehouses.*` - Warehouse management
  - `physicalProducts.*` - Serial number tracking
  - `serviceRequests.*` - Public portal endpoints

**Integration Requirements:**
- **Existing System**: Integrate with current `service_tickets` table
- **File Storage**: Leverage existing Supabase Storage for photos and CSV imports
- **Email Notifications**: Use existing GoTrue SMTP configuration (6 notification types: request confirmation, product received, diagnosis complete, service complete, ready for pickup/delivery, deadline reminders)
- **Barcode Scanning**: HTML5 camera API for mobile barcode reading (post-MVP enhancement)

**Security/Compliance:**
- **RLS Policies**: Extend existing Row Level Security for new tables
- **Public Endpoints**: Rate limiting on serial verification to prevent abuse
- **Data Privacy**: No PII in service requests until converted to tickets
- **Audit Trail**: All warehouse movements logged with user_id and timestamp

---

## Constraints & Assumptions

### Constraints

**Budget:**
- **Development Budget**: Utilize existing team (no new hires required)
- **Infrastructure Budget**: ~$200/month for Supabase Pro (existing commitment + new table storage)
- **No Commercial Software**: Open-source stack only (no licensing fees)

**Timeline:**
- **MVP Delivery**: 8-10 weeks from project kickoff
- **Phase 2 Features**: +3-6 months post-MVP
- **Team Capacity**: 1 full-stack developer + 1 architect (part-time)

**Resources:**
- **Development Team**: Existing team familiar with brownfield codebase
- **Testing**: Manual testing initially (no QA team)
- **Documentation**: Must update existing architecture docs in `docs/architecture/`

**Technical:**
- **Brownfield Constraints**: Must maintain backward compatibility with existing `service_tickets` workflow
- **Database**: Cannot break existing RLS policies or table structures
- **Performance**: Existing hardware (developer laptops, local Supabase Docker)
- **No Breaking Changes**: Existing user roles and permissions must continue working

### Key Assumptions

**User Adoption:**
- Reception staff will manually enter serial numbers initially (barcode scanning Phase 2)
- Managers will define task templates before technician training
- Technicians are comfortable with checklist-based workflows
- Customers will use public portal if prompted via QR codes/links

**Data Availability:**
- Serial number data can be bulk imported from existing Excel/CSV files
- Historical warranty dates are available for existing products
- Current parts inventory data is accurate

**Business Process:**
- Service workflows are standardizable (not every ticket is unique)
- Warranty verification can happen before product drop-off
- Warehouse staff will be trained on stock movement logging

**Technical:**
- Existing Supabase local stack can handle additional database tables
- tRPC can support public (unauthenticated) endpoints for serial verification
- React Hook Form can handle complex multi-step service request creation
- Mobile browsers support HTML5 camera API for future barcode scanning

**Operational:**
- Admin will spend 1-2 weeks defining initial task templates
- Technicians will provide feedback on task definitions during pilot
- One physical warehouse location sufficient for MVP (TP.HCM)
- RMA process remains manual (no manufacturer API integrations in MVP)

---

## Risks & Open Questions

### Key Risks

**1. Template Definition Complexity (High Impact, Medium Likelihood)**
- **Risk**: Task templates too rigid → technicians bypass system
- **Impact**: System underutilized, workflow compliance low
- **Mitigation**:
  - Involve senior technicians in template design
  - Allow "skip task" with required justification
  - Iterative template refinement based on usage data

**2. Serial Number Data Quality (High Impact, High Likelihood)**
- **Risk**: Existing serial number records incomplete or inaccurate
- **Impact**: Warranty verification failures, customer frustration
- **Mitigation**:
  - Data cleanup sprint before MVP launch
  - Allow manual warranty override by managers
  - Progressive enhancement: add serials as products come in

**3. Performance Degradation with Large Datasets (Medium Impact, Low Likelihood)**
- **Risk**: Task instance table grows rapidly → slow queries
- **Impact**: Dashboard lag, poor user experience
- **Mitigation**:
  - Database indexes on `ticket_id`, `status`, `created_at`
  - Archive completed tasks after 12 months
  - Pagination on task lists (limit 50 per page)

**4. User Training Resistance (High Impact, Medium Likelihood)**
- **Risk**: Technicians resist new workflow → continue using old status-only method
- **Impact**: Incomplete adoption, lost development investment
- **Mitigation**:
  - Pilot with 2-3 early adopter technicians
  - Show time savings through task time tracking
  - Manager enforcement: require task completion for ticket completion
  - Gradual rollout: one product type at a time

**5. Warehouse Movement Data Integrity (Medium Impact, Medium Likelihood)**
- **Risk**: Manual stock movement entry → data drift from reality
- **Impact**: Stock levels inaccurate, stockouts or overstock
- **Mitigation**:
  - Monthly physical inventory reconciliation
  - Barcode scanning (Phase 2) reduces manual entry errors
  - Automatic movements when possible (ticket status changes)

### Open Questions

**Business Process:**
1. **Q: Who is responsible for defining task templates?**
   - Candidate: Operations Manager + Senior Technician collaboration
   - Decision by: Week 1 of project

2. **Q: What happens if customer disputes warranty expiration date?**
   - Options: Manager manual override vs strict system enforcement
   - Decision by: Before MVP launch

3. **Q: How do we handle products without serial numbers (older inventory)?**
   - Options: Generate internal IDs vs mark as "legacy" with limited tracking
   - Decision by: Week 2 of project

4. **Q: RMA shipping: who pays freight costs?**
   - Impact: Affects whether to batch shipments vs immediate dispatch
   - Decision by: Before warehouse module implementation

**Technical:**
5. **Q: Email notification service for customer communications?**
   - **✅ RESOLVED**: Use existing GoTrue SMTP configuration (already set up in production)
   - **Decision**: Leverage existing infrastructure, no additional service needed

6. **Q: Public serial verification: how to prevent abuse (brute force serial guessing)?**
   - Options: Rate limiting (Kong API Gateway) vs CAPTCHA vs require partial customer info
   - **Decision**: Rate limiting (100 requests/min per IP) - leverages existing Kong infrastructure
   - Decision by: Before public portal development

7. **Q: Task dependencies: support complex DAGs (Directed Acyclic Graphs) or simple linear sequences?**
   - Options: Linear (MVP) → Complex dependencies (Phase 2)
   - Decision by: Week 3 (before task template schema finalization)

8. **Q: Barcode format: QR Code vs traditional barcodes?**
   - Impact: Mobile camera API support varies
   - Decision by: Post-MVP (Phase 2 enhancement)

9. **Q: Multi-currency support for international product imports?**
   - Scope: Out for MVP, confirm for Phase 2
   - Decision by: Before Phase 2 roadmap

### Areas Needing Further Research

**User Experience:**
- **Topic**: Optimal task UI for mobile workshop use (tablets vs phones)
- **Why**: Technicians may not have dedicated workstations
- **Research Method**: User interviews with technicians
- **Timeline**: Week 2-3 of project

**Technical Feasibility:**
- **Topic**: HTML5 camera API reliability across Android devices for barcode scanning
- **Why**: Barcode scanning is Phase 2 feature but affects architecture decisions
- **Research Method**: Prototype testing on 5-10 device models
- **Timeline**: Before Phase 2 kickoff

**Business Impact:**
- **Topic**: Actual time savings from task checklists
- **Why**: Validate ROI assumptions
- **Research Method**: Pilot with 3 technicians for 2 weeks, measure completion times
- **Timeline**: Week 6-8 of MVP development

**Competitive Landscape:**
- **Topic**: How do competitors handle warranty verification?
- **Why**: Identify industry best practices
- **Research Method**: Competitive analysis of 3-5 repair shop software products
- **Timeline**: Week 1 of project (already have initial requirements)

---

## Appendices

### A. Research Summary

**Market Research Conducted:**
- Analyzed requirements documents: `REQ_TASK_WORKFLOW_SYSTEM.md`, `REQ_WAREHOUSE_PHYSICAL_PRODUCTS.md`, `REQ_SERVICE_REQUEST_LAYER.md`
- Reviewed current system capabilities: `CURRENT_FEATURES.md`
- Examined brownfield architecture: `docs/architecture/` (10 shards + frontend architecture docs)

**Key Findings:**
1. **Existing System Strengths**: Solid foundation with tRPC type safety, 4 user roles, automatic cost calculations, audit trail via auto-comments
2. **User Pain Points**: Lack of structured workflows, no warranty gate, no serial tracking
3. **Technical Foundation**: TypeScript strict mode, Supabase RLS, modular tRPC routers - ready for enhancement
4. **Vietnamese Market Needs**: Filename sanitization already implemented, multi-language support TBD

**Competitive Analysis:**
- Repair shop software (RepairShopr, Syncro): Feature-rich but expensive, no Vietnamese support
- Generic inventory systems: Lack service ticket integration
- Custom solution advantage: Built for specific workflow, brownfield integration

### B. Stakeholder Input

**From Requirements Documents (Authored 2025-10-22):**
- Task workflow needs identified by operations team
- Warehouse requirements driven by inventory challenges
- Service request layer designed to reduce reception workload
- User journey mapping completed for customer portal

**Current System Adoption (from CURRENT_FEATURES.md):**
- 4 user roles actively using system: Admin, Manager, Technician, Reception
- Service ticket lifecycle stable with one-way status flow
- Real-time analytics dashboard in production
- Automated features (ticket numbering, cost calculations, auto-comments) proven reliable

### C. References

**Internal Documentation:**
- [Current Features](CURRENT_FEATURES.md) - Complete feature inventory
- [Architecture Documentation](architecture.md) - Main index
- [Frontend Architecture - Current](architecture/frontend-architecture-current.md) - Production frontend state
- [Frontend Architecture - Roadmap](architecture/frontend-architecture-roadmap.md) - Planned improvements
- [Data Models](architecture/03-data-models.md) - Database schema
- [API Design](architecture/05-api-design.md) - tRPC procedures
- [Coding Standards](architecture/08-coding-standards.md) - Development conventions

**Requirements Specifications:**
- `docs/requirements/REQ_TASK_WORKFLOW_SYSTEM.md` - Task/workflow requirements
- `docs/requirements/REQ_WAREHOUSE_PHYSICAL_PRODUCTS.md` - Warehouse/inventory requirements
- `docs/requirements/REQ_SERVICE_REQUEST_LAYER.md` - Public portal requirements

**Technical Stack:**
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React 19 Documentation](https://react.dev/)

---

## Next Steps

### Immediate Actions

1. **Week 1: Project Validation & Planning**
   - Review and approve this Project Brief
   - Stakeholder kickoff meeting (Managers + Senior Technician + Development Team)
   - Define task template ownership (who creates/maintains)
   - Prioritize: Start with Task Workflow OR Warehouse first?

2. **Week 1-2: Data Preparation**
   - Export existing serial number data (if available)
   - Data cleanup: validate serial numbers, warranty dates
   - Identify 3-5 pilot products for initial task templates

3. **Week 2: Technical Design**
   - Database schema design for new tables
   - tRPC router planning (endpoints and types)
   - UI/UX mockups for task execution interface
   - Public portal wireframes

4. **Week 3: Pilot Template Creation**
   - Work with Senior Technician to define 2 initial task templates
   - Test template execution with 3 pilot tickets
   - Refine based on feedback before full development

5. **Week 4+: MVP Development**
   - Implement in priority order:
     1. Task template management (Admin)
     2. Task library seeding
     3. Task execution (Technician)
     4. Physical products + serial verification
     5. Warehouse hierarchy
     6. Stock movements
     7. Low stock alerts
     8. Public portal

### PM Handoff

This Project Brief provides the full context for **Service Center Phase 2**. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.

**Key Areas to Expand in PRD:**
- Detailed user stories for each feature
- UI/UX specifications with wireframes
- Database schema definitions
- API endpoint specifications
- Test scenarios and acceptance criteria
- Implementation sequence and dependencies
- Training plan and rollout strategy

---

**Project Brief v1.0**
**Prepared by:** Mary (Business Analyst)
**Date:** 2025-10-23
**Next Review:** Week 1 stakeholder validation
