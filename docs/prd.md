# Service Center - Product Requirements Document

**Version:** 1.0
**Last Updated:** 2025-10-28
**Status:** Production (v0.2.1)
**Document Type:** Current State PRD

---

## 📋 Executive Summary

Service Center is a **comprehensive service and repair management platform** for repair centers. The system manages the complete service lifecycle from customer request through completion, with advanced features including task workflows, warehouse management, serialized inventory tracking, and customer self-service capabilities.

**Key Metrics:**
- **Pages:** 45+ pages (authenticated + public)
- **Database Tables:** 37 tables
- **API Endpoints:** 160+ tRPC procedures across 14 routers
- **Components:** 138 React components
- **User Roles:** 4 roles with granular RBAC

**Core Capabilities:**
1. Service ticket lifecycle management with automated workflows
2. Task-based workflow system with templates and dependencies
3. Two-tier warehouse management (physical + virtual)
4. Serialized product tracking with warranty management
5. Public service request portal with tracking
6. Role-based access control with audit trails
7. Email notification system
8. Analytics and reporting dashboards

---

## 1. System Overview

### 1.1 Purpose

Service Center provides repair centers with a complete digital platform to:
- Manage service tickets from intake through completion
- Track customer products with serial numbers and warranty dates
- Enforce standardized workflows through task templates
- Manage inventory across multiple warehouses and stock categories
- Enable customer self-service through public portal
- Monitor performance and productivity
- Maintain compliance through comprehensive audit trails

### 1.2 Users and Roles

The system supports four distinct user roles with hierarchical permissions:

| Role | Count | Primary Responsibilities | Key Permissions |
|------|-------|-------------------------|-----------------|
| **Admin** | 1 | System configuration, user management, full access | All operations, system settings, audit logs, team management |
| **Manager** | Multiple | Operations oversight, approvals, team coordination, reporting | All operations, approvals, reports, no system settings |
| **Technician** | Multiple | Task execution, service work, assigned tickets only | Execute tasks, view assigned tickets, read-only inventory |
| **Reception** | Multiple | Customer intake, ticket creation, delivery confirmation | Create tickets, manage customers, deliveries, basic operations |

**Permission Enforcement:**
- **Database Level:** Row Level Security (RLS) policies filter data by role
- **API Level:** tRPC middleware validates permissions before execution
- **UI Level:** Route guards and conditional rendering hide unauthorized features

### 1.3 Technology Stack

**Frontend:**
- Next.js 15.5.4 (App Router with Turbopack)
- React 19.1.0
- TypeScript 5.x (strict mode)
- Tailwind CSS 4 + shadcn/ui (Radix UI components)
- TanStack React Query 5.90.2 (server state management)
- TanStack React Table 8.21.3 (data tables)
- React Hook Form 7.65.0 + Zod 4.1.11 (forms & validation)

**Backend:**
- tRPC 11.6.0 (type-safe API layer)
- Supabase (PostgreSQL, Auth, Storage)
- Next.js API Routes
- Superjson 2.2.2 (type-safe serialization)

**Infrastructure:**
- Docker Compose (multi-service orchestration)
- Supabase Local Stack (12 services)
- PostgreSQL 15.8.1.085
- Kong API Gateway 2.8.1
- Supabase Storage (file uploads)
- GoTrue Auth (JWT + SMTP)

**Development Tools:**
- Biome 2.2.0 (linting & formatting)
- Playwright 1.56.1 (E2E testing)
- Turbopack (fast builds)
- pnpm (package management)

---

## 2. Functional Requirements

### 2.1 Service Ticket Management

#### 2.1.1 Ticket Lifecycle

**Status Flow:** One-way progression with cancellation option
```
pending → in_progress → completed
   ↓            ↓
cancelled    cancelled
```

**Key Features:**
- Auto-numbered tickets: `SV-YYYY-NNN` format
- Priority levels: low, normal, high, urgent
- Service types: warranty, paid, goodwill
- Automated cost calculations: `total = service_fee + diagnosis_fee + parts_total - discount_amount`
- Parts association and tracking
- Image/attachment uploads
- Comprehensive comment/audit trail
- Assignment to technicians
- Delivery method selection (pickup/delivery)

**Business Rules:**
- Terminal states (completed, cancelled) cannot be modified
- Status changes automatically logged to comments
- Parts total auto-updated via database triggers
- Cost fields support decimal precision
- Delivery confirmation required for completion

#### 2.1.2 Ticket Creation and Editing

**Creation Sources:**
1. Manual creation by Reception/Manager/Admin
2. Conversion from public service requests
3. Bulk import (future enhancement)

**Required Fields:**
- Customer (from master data)
- Product (from catalog)
- Service type (warranty/paid/goodwill)
- Priority level
- Description

**Optional Fields:**
- Assigned technician
- Service fee, diagnosis fee, discount
- Expected completion date
- Customer notes
- Task template selection

**Editing Permissions:**
- Admin/Manager: Full edit access
- Technician: Limited to assigned tickets, task execution only
- Reception: Create and edit pending tickets only

### 2.2 Task Workflow System

#### 2.2.1 Task Templates

**Purpose:** Define standardized workflows for different service types and products

**Structure:**
- Template name and description
- Product association (optional)
- Service type linkage
- Ordered list of tasks
- Enforcement mode: strict (enforced sequence) or flexible
- Version tracking

**Task Types:** Reusable task definitions with:
- Category (Intake, Diagnosis, Repair, QA, Closing)
- Name and description
- Estimated duration
- Default instructions
- Active/inactive status

**Template Operations:**
- Create template with drag-and-drop task ordering
- Edit template (creates new version, marks old inactive)
- Preview template before activation
- Assign template to product + service type combinations
- Delete unused templates
- Dynamic template switching (mid-workflow, with mandatory reason)

**Task Library Categories:**
1. **Intake:** Initial Inspection, Document Product Condition, Record Serial Numbers
2. **Diagnosis:** Run Diagnostic Tests, Identify Problem, Estimate Cost
3. **Repair:** Replace Components, Clean/Service Unit, Update Firmware
4. **QA:** Quality Check, Performance Test, Final Inspection
5. **Closing:** Package Product, Update Documentation, Customer Notification

#### 2.2.2 Task Execution

**Task Lifecycle:**
```
pending → in_progress → completed
            ↓
         blocked
```

**Task Execution Features:**
- Start task (sets started_at timestamp)
- Add findings and notes
- Mark complete (sets completed_at timestamp, auto-advances next dependent task)
- Mark blocked (with reason)
- Skip task (with mandatory reason)
- View dependency status
- Task history audit trail

**Task Dependencies:**
- Sequential dependencies (Task B requires Task A completion)
- Dependency validation prevents completing dependent tasks before prerequisites
- Blocked task detection and alerts
- Dependency visualization in UI

**Automatic Task Generation:**
- Trigger fires on ticket creation
- Finds template by product + service type
- Creates task instances linked to ticket
- Sets initial status = pending
- Copies instructions and estimated duration
- Maintains task sequence order

**Task Progress Tracking:**
- Manager dashboard shows all task progress across tickets
- Filter by status, technician, overdue
- Blocked task alerts
- Task completion rate metrics
- Estimated vs actual duration tracking

### 2.3 Warehouse and Inventory Management

#### 2.3.1 Warehouse Hierarchy

**Physical Warehouses:** Physical storage locations
- Name and code
- Address and contact information
- Active/inactive status
- Multiple virtual warehouses per physical location

**Virtual Warehouses:** Logical stock categories (5 types)
1. **Warranty Stock** (`warranty_stock`) - Products for warranty replacements
2. **RMA Staging** (`rma_staging`) - Products prepared for return to supplier
3. **Dead Stock** (`dead_stock`) - Obsolete or unsellable inventory
4. **In-Service** (`in_service`) - Products currently being serviced
5. **Parts** (`parts`) - Component inventory

**Warehouse Operations:**
- Create/edit physical warehouses
- Create/edit virtual warehouses (assigned to physical locations)
- Set default virtual warehouses by type
- Monitor stock levels by warehouse
- Stock movement tracking between warehouses

#### 2.3.2 Physical Product Tracking

**Product Master Data:** Serialized product instances with:
- Serial number (unique constraint across all products)
- Product reference (SKU from catalog)
- Product condition: new, refurbished, used, faulty, for_parts
- Current warehouse location (physical + virtual)
- Service ticket assignment (if in service)
- RMA batch assignment (if in RMA process)
- Warranty tracking (manufacturer + company)
- Purchase date and cost
- Supplier information

**Warranty Management:**
- Manufacturer warranty period (months)
- Company extended warranty period (months)
- Warranty start date
- Auto-calculated warranty end dates
- Warranty expiration alerts (30 days before)
- Warranty status helper: active, expired, near_expiration

**Product Operations:**
- Register new products with serial numbers
- Bulk import via CSV
- Transfer products between warehouses
- Assign products to service tickets
- Add products to RMA batches
- Update product condition
- Record product movements
- Track product history

#### 2.3.3 Stock Movement Tracking

**Movement Types:**
- **Receipt:** Incoming stock from suppliers/returns
- **Transfer:** Movement between warehouses
- **Assignment:** Allocation to service tickets
- **Return:** Return from service to warehouse
- **Disposal:** Removal from inventory (scrap, donation)

**Movement Records Capture:**
- Movement type and date
- Product serial number
- Source warehouse (for transfers/assignments)
- Destination warehouse (for receipts/transfers/returns)
- Quantity (always 1 for serialized products)
- Service ticket reference (for assignments/returns)
- Notes and reason
- Performed by user

**Movement Audit Trail:**
- Immutable movement history
- Timestamp and user tracking
- Movement validation (stock availability)
- ACID compliance for integrity

#### 2.3.4 Stock Documents

**Three Document Types:**

**1. Stock Receipts** (Phiếu Nhập Kho)
- Purpose: Record incoming inventory
- Status flow: draft → submitted → approved/rejected
- Serial entry: Can be completed after approval (non-blocking workflow)
- Approval workflow with manager authorization
- Automatic stock increase on approval

**2. Stock Issues** (Phiếu Xuất Kho)
- Purpose: Record outgoing inventory
- Status flow: draft → submitted → approved/rejected
- Serial verification before approval
- Approval workflow with manager authorization
- Automatic stock decrease on approval

**3. Stock Transfers** (Phiếu Chuyển Kho)
- Purpose: Record internal warehouse transfers
- Status flow: draft → submitted → approved/rejected
- Serial verification at source and destination
- Approval workflow with manager authorization
- Automatic stock movement on approval

**Document Features:**
- Document numbering: auto-generated per type
- Multiple line items per document
- Product selection from catalog
- Declared quantity vs serial count tracking
- Attachment uploads (photos, receipts)
- Approval notes and reason for rejection
- Audit trail of all status changes

**Serial Entry Workflow:** (Non-blocking, two-phase)
```
Phase 1: Create Receipt → Submit (0% serials OK) → Approve → Stock Updated IMMEDIATELY
Phase 2: Serial Entry Task (parallel) → Technician enters serials → 100% Complete
```

**Serial Entry Features:**
- Task dashboard at `/my-tasks/serial-entry`
- Priority escalation: normal (0-3 days) → warning (4-7 days) → critical (8+ days)
- Color-coded progress bars
- Manager compliance widget on dashboard
- Team collaboration (any technician can help)
- Auto-save (500ms debounce)
- Real-time validation (duplicates, quantity limits)
- Compliance target: >95% completion rate

#### 2.3.5 RMA (Return Merchandise Authorization)

**RMA Batch Management:**
- Auto-numbered batches: `RMA-YYYY-MM-NNN` format
- Batch status: draft, submitted, approved, shipped, completed
- Supplier information
- Shipping details
- Expected return date
- Multiple products per batch

**RMA Workflow:**
1. Create RMA batch (draft status)
2. Add products from warranty_stock (eligibility rule)
3. Products auto-moved to rma_staging
4. Submit for approval
5. Manager approves and ships
6. Update shipping information
7. Mark completed
8. Products removed from batch → return to previous virtual warehouse

**RMA Business Rules:**
- Only products in `warranty_stock` eligible for RMA
- Products store previous warehouse before moving to `rma_staging`
- Removing product from batch restores previous warehouse
- Batch cannot be edited after submission
- Shipping info required before marking shipped

#### 2.3.6 Stock Level Monitoring

**Low-Stock Alerts:**
- Configurable thresholds per product + warehouse
- Alert generation when stock below threshold
- Dashboard widgets show critical stock levels
- Email notifications to managers (optional)

**Stock Queries:**
- Stock by product across all warehouses
- Stock by warehouse (all products)
- Stock by virtual warehouse type
- Stock by condition (new, used, faulty, etc.)
- Stock movement history
- Available vs allocated stock

### 2.4 Public Service Request Portal

#### 2.4.1 Request Submission

**Public Access:** No authentication required

**Request Form Fields:**
- Customer information (name, phone, email)
- Product serial number (optional, with verification)
- Product description
- Issue description
- Photo uploads
- Preferred contact method
- Expected delivery/pickup

**Serial Verification Widget:**
- Real-time lookup of serial number
- Display warranty status
- Show product details
- Indicate repair center coverage

**Submission Confirmation:**
- Auto-generated tracking token: `SR-XXXXXXXXXXXX` format
- Confirmation email sent
- Tracking link provided
- Success page with instructions

#### 2.4.2 Request Tracking

**Public Tracking Page:** `/service-request/track`
- Enter tracking token
- View request status
- See progress timeline
- Customer notes and updates
- Expected completion date

**Request Statuses:**
- `submitted` - Request received, pending review
- `received` - Staff reviewed and accepted
- `processing` - Service work in progress
- `completed` - Service completed
- `cancelled` - Request declined or cancelled

#### 2.4.3 Staff Request Management

**Request Dashboard:** `/operations/service-requests`
- List all submitted requests
- Filter by status, date range, customer
- Sort by submission date, priority
- Bulk actions

**Request Operations:**
- Review request details
- Accept/reject request
- Add internal notes
- Convert to service ticket
- Update status
- Send customer notifications

**Conversion to Ticket:**
- Pre-fill customer and product information
- Select service type and priority
- Assign technician
- Apply task template
- Create ticket with reference to original request

### 2.5 Customer Management

**Customer Master Data:**
- Full name
- Phone number (primary and secondary)
- Email address
- Physical address
- Delivery preferences
- Notes
- Active/inactive status

**Customer Operations:**
- Create/edit customers
- Search by name, phone, email
- View service history (linked tickets)
- View delivery address
- Export customer list (future)

**Customer Linking:**
- Service tickets link to customer
- Service requests link to customer (post-conversion)
- Delivery confirmations link to customer
- Analytics by customer (ticket count, revenue, etc.)

### 2.6 Product and Parts Catalog

#### 2.6.1 Product Catalog (SKU Management)

**Product Master Data:**
- SKU/Model number
- Product name
- Brand association
- Category
- Description
- Default warranty period (months)
- Unit price
- Active/inactive status
- Product images

**Product Operations:**
- Create/edit products
- Search by SKU, name, brand
- Link to brands
- Associate parts (bill of materials)
- View service history
- Assign task templates

**Product-Parts Relationships:**
- Many-to-many relationship
- Quantity per product
- Common failure parts
- Replacement part numbers

#### 2.6.2 Parts Inventory

**Parts Master Data:**
- Part number (unique)
- Part name
- Category
- Unit price
- Stock quantity
- Minimum stock level
- Supplier information
- Active/inactive status

**Parts Operations:**
- Create/edit parts
- Adjust stock levels
- Low-stock alerts
- Price updates
- Supplier management
- Usage tracking (via service ticket parts)

**Parts in Service Tickets:**
- Associate parts used in repairs
- Track quantity and cost
- Auto-calculate parts total
- Stock deduction (manual or automatic)
- Parts history per ticket

#### 2.6.3 Brand Management

**Brand Master Data:**
- Brand name
- Brand logo
- Country of origin
- Website
- Contact information
- Active/inactive status

**Brand Operations:**
- Create/edit brands
- Delete unused brands
- View associated products
- Brand-based reporting

### 2.7 Team Management

**User Management:** (Admin only)
- Create user accounts with email/password
- Assign roles (admin, manager, technician, reception)
- Set full name and contact info
- Toggle active/inactive status
- Reset passwords
- View user activity logs

**Role Changes:**
- Admin can change user roles
- Mandatory reason logging (audit_logs table)
- Historical role tracking
- Permission recalculation on role change

**Password Management:**
- Admin can reset user passwords
- Secure password generation
- Email notification of reset
- Force password change on first login

**User Activity:**
- Track user logins
- Log ticket assignments
- Record task completions
- Audit permission-sensitive operations

### 2.8 Analytics and Reporting

#### 2.8.1 Main Dashboard

**Key Metrics Cards:**
- Total tickets (by status)
- Total revenue (current month, trend)
- Active customers
- Pending tasks
- Low stock alerts
- Open service requests

**Charts:**
- Revenue trend (area chart, last 12 months)
- Ticket volume by status (bar chart)
- Task completion rate (line chart)
- Top products serviced (pie chart)

**Widgets:**
- Employee performance leaderboard
- Recent tickets (last 10)
- Serial entry compliance (managers only)
- Upcoming warranty expirations
- Overdue tasks

#### 2.8.2 Task Progress Dashboard

**Purpose:** Manager oversight of all active tasks across tickets

**Features:**
- Summary cards: Total tasks, completed, in progress, blocked, overdue
- Task table with filters:
  - Status filter
  - Technician filter
  - Priority filter
  - Date range filter
- Blocked task alerts
- Task completion timeline
- Estimated vs actual duration analysis
- Technician workload distribution

#### 2.8.3 Notification Center

**Email Notification Tracking:**
- View all sent emails
- Filter by template, recipient, status
- Delivery status: sent, delivered, opened, clicked, bounced, failed
- Retry failed emails
- View email content
- Resend notifications
- Email statistics (delivery rate, open rate, click rate)

**Email Templates:** 6 types
1. Service request confirmation
2. Product received notification
3. Diagnosis complete notification
4. Service completed notification
5. Ready for pickup/delivery
6. Delivery deadline reminder

#### 2.8.4 Revenue Analytics

**Revenue Tracking:**
- Revenue by ticket (service fee + diagnosis fee + parts)
- Revenue by period (day, week, month, year)
- Revenue by service type (warranty, paid, goodwill)
- Revenue by technician
- Revenue by product/brand
- Average ticket value
- Revenue trends

**Reports:** (Future enhancement)
- Generate PDF reports
- Export to Excel
- Scheduled email delivery
- Custom date ranges
- Filter by multiple dimensions

### 2.9 Email Notification System

**Notification Triggers:**
- Service request submitted → Confirmation email
- Ticket created from request → Customer notification
- Ticket status changed → Customer update
- Service completed → Ready for pickup
- Delivery method not confirmed → Reminder (after 3 days)
- Delivery deadline approaching → Alert (1 day before)

**Email Features:**
- Template-based emails (6 templates)
- Personalization (customer name, ticket number, tracking token)
- Attachment support (optional)
- HTML formatting
- Delivery tracking (via GoTrue SMTP or Edge Functions)
- Retry logic for failed sends
- Rate limiting
- Unsubscribe management

**Email Status Tracking:**
- Email queued
- Email sent (SMTP accepted)
- Email delivered (recipient server confirmed)
- Email opened (tracking pixel)
- Link clicked (tracking links)
- Email bounced (delivery failed)
- Email failed (SMTP error)

**Email Management:**
- View sent emails
- Resend failed emails
- View email content (HTML preview)
- Email statistics dashboard
- Recipient history

### 2.10 System Administration

**System Settings:** (Admin only)
- Application name and logo
- Default warehouse settings
- Email notification enable/disable
- Low-stock alert thresholds
- Task workflow strict mode default
- Public portal enable/disable
- Delivery auto-fallback days (default: 3)
- Warranty alert days (default: 30)

**Audit Logs:**
- Immutable audit trail
- Log permission-sensitive operations:
  - User creation/deletion
  - Role changes
  - Template switches
  - High-value transactions
  - System setting changes
- Log fields: user, action, resource, timestamp, reason (for mandatory reason operations), old/new values

**Database Management:** (via Supabase Studio)
- Table browsing
- Query execution
- Migration management
- Backup/restore
- Performance monitoring

---

## 3. Non-Functional Requirements

### 3.1 Performance

- **Page Load Time:** <2 seconds for dashboard pages
- **API Response Time:** P95 <500ms for standard queries, <2s for complex aggregations
- **Concurrent Users:** Support 20+ simultaneous users without degradation
- **Real-time Updates:** TanStack Query polling (30-second intervals), optional WebSocket upgrade
- **Build Time:** <15 seconds for development (Turbopack), <2 minutes for production

### 3.2 Scalability

- **Multi-Tenant Architecture:** Port-based instance isolation via Docker Compose
- **Database:** Horizontal scaling via PostgreSQL read replicas (future)
- **API Layer:** Stateless tRPC procedures enable load balancing
- **File Storage:** Supabase Storage with local filesystem backend (migrate to S3-compatible for cloud)

### 3.3 Security

**Authentication:**
- JWT-based session management via Supabase Auth
- Secure password hashing (bcrypt)
- Session expiration (configurable)
- Password reset workflow

**Authorization:**
- Four-role hierarchy (admin > manager > technician > reception)
- Database RLS policies enforce data access
- tRPC middleware validates permissions
- Route guards protect UI pages
- Immutable audit logs for compliance

**Data Protection:**
- HTTPS-only access (production)
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escaping)
- CSRF protection (Next.js built-in)
- Rate limiting on public endpoints (100 req/min per IP)

**File Uploads:**
- Vietnamese filename sanitization
- File type validation
- Size limits (configurable)
- Virus scanning (future enhancement)

### 3.4 Reliability

- **Uptime:** 99.5% target for public service portal
- **Data Integrity:** ACID transactions for stock movements
- **Backup:** Daily automated database backups
- **Rollback:** Zero-downtime deployments with backward-compatible migrations
- **Error Handling:** Comprehensive try-catch blocks, error logging, user-friendly messages

### 3.5 Usability

- **Responsive Design:** Works on desktop (1920x1080), tablets (768x1024), mobile (375x667)
- **Accessibility:** WCAG 2.1 AA compliance target
- **Internationalization:** Vietnamese language support (UI labels, email templates, filenames)
- **Keyboard Navigation:** Full keyboard support for forms and tables
- **Screen Readers:** Semantic HTML and ARIA labels

### 3.6 Maintainability

- **Code Quality:** Biome linting enforces TypeScript best practices
- **Type Safety:** End-to-end type safety (database → tRPC → React)
- **Testing:** E2E tests with Playwright (RBAC, core workflows)
- **Documentation:** Inline comments, architecture docs, PRD
- **Version Control:** Git with feature branches and pull requests

---

## 4. Data Model

### 4.1 Core Entities

**Users and Customers:**
- `profiles` - User accounts (staff)
- `customers` - Customer master data

**Catalog:**
- `brands` - Product brands
- `products` - Product catalog (SKU)
- `parts` - Parts inventory
- `product_parts` - Product-parts relationships

**Service Operations:**
- `service_tickets` - Service tickets
- `service_ticket_parts` - Parts used in tickets
- `service_ticket_comments` - Comments and audit trail
- `service_ticket_attachments` - Image/file uploads

**Workflows:**
- `task_templates` - Workflow templates
- `task_types` - Reusable task definitions
- `task_templates_tasks` - Template-task junction table
- `service_ticket_tasks` - Task instances in tickets
- `task_history` - Task status audit trail
- `ticket_template_changes` - Template switch audit

**Warehouse and Inventory:**
- `physical_warehouses` - Physical storage locations
- `virtual_warehouses` - Logical stock categories
- `physical_products` - Serialized product instances
- `stock_movements` - Product movement history
- `product_stock_thresholds` - Low-stock alert configuration
- `product_warehouse_stock` - Stock levels by warehouse
- `rma_batches` - RMA batch management

**Stock Documents:**
- `stock_receipts` - Incoming stock documents
- `stock_receipt_items` - Receipt line items
- `stock_receipt_serials` - Receipt serial tracking
- `stock_issues` - Outgoing stock documents
- `stock_issue_items` - Issue line items
- `stock_issue_serials` - Issue serial tracking
- `stock_transfers` - Transfer documents
- `stock_transfer_items` - Transfer line items
- `stock_transfer_serials` - Transfer serial tracking
- `stock_document_attachments` - Document file uploads

**Public Portal:**
- `service_requests` - Customer service requests
- `email_notifications` - Email delivery tracking

**Security and Audit:**
- `audit_logs` - Immutable audit trail
- `system_settings` - Global configuration

### 4.2 Key Relationships

**Service Ticket Relationships:**
```
service_tickets → customers (N:1)
service_tickets → products (N:1)
service_tickets → profiles (N:1, assigned_to)
service_tickets → task_templates (N:1)
service_tickets → service_requests (N:1)
service_tickets ← service_ticket_tasks (1:N, cascade delete)
service_tickets ← service_ticket_parts (1:N, cascade delete)
service_tickets ← service_ticket_comments (1:N, cascade delete)
service_tickets ← service_ticket_attachments (1:N, cascade delete)
```

**Task Workflow Relationships:**
```
task_templates → products (N:1)
task_templates ← task_templates_tasks (1:N, cascade delete)
task_templates_tasks → task_types (N:1)
service_ticket_tasks → service_tickets (N:1, cascade delete)
service_ticket_tasks → task_types (N:1)
service_ticket_tasks ← task_history (1:N, immutable)
```

**Warehouse Relationships:**
```
physical_warehouses ← virtual_warehouses (1:N)
virtual_warehouses ← physical_products (1:N)
physical_products → products (N:1)
physical_products → service_tickets (N:1)
physical_products → rma_batches (N:1)
physical_products ← stock_movements (1:N, immutable)
```

**Stock Document Relationships:**
```
stock_receipts ← stock_receipt_items (1:N, cascade delete)
stock_receipt_items ← stock_receipt_serials (1:N)
stock_issues ← stock_issue_items (1:N, cascade delete)
stock_issue_items ← stock_issue_serials (1:N)
stock_transfers ← stock_transfer_items (1:N, cascade delete)
stock_transfer_items ← stock_transfer_serials (1:N)
```

### 4.3 Database Constraints

**Unique Constraints:**
- `profiles.email` - One email per user
- `customers.email` - One email per customer (optional field)
- `brands.name` - Unique brand names
- `products.sku` - Unique SKU per product
- `parts.part_number` - Unique part numbers
- `physical_products.serial_number` - Unique serial across all products
- `service_requests.tracking_token` - Unique tracking tokens

**Foreign Key Constraints:**
- All relationships enforce referential integrity
- Cascade deletes for dependent data (tasks, parts, comments)
- Restrict deletes for referenced master data (products, customers)

**Check Constraints:**
- `service_tickets.total_cost >= 0` - No negative costs
- `physical_products.warranty_months >= 0` - No negative warranty periods
- `task_templates.is_strict IN (true, false)` - Boolean enforcement
- `stock_movements.quantity > 0` - Positive quantities only

### 4.4 Database Functions and Triggers

**Auto-Numbering:**
- `generate_ticket_number()` - Ticket numbering (SV-YYYY-NNN)
- `set_ticket_number()` - Trigger on insert
- `generate_tracking_token()` - Service request tokens
- `generate_rma_batch_number()` - RMA batch numbers

**Automatic Updates:**
- `update_updated_at_column()` - Auto-update updated_at timestamp
- `update_service_ticket_parts_total()` - Recalculate parts total
- `calculate_physical_product_warranty_end_date()` - Warranty end dates

**Audit Logging:**
- `log_status_change()` - Auto-log ticket status changes to comments
- `log_audit()` - Manual audit log with validation
- `log_template_switch()` - Template switch with mandatory reason

**Role Checking:**
- `is_admin()` - Check if user is admin
- `is_admin_or_manager()` - Check if user is admin or manager
- `auth.check_role()` - Generic role validation for RLS

**Warranty Helpers:**
- `calculate_warranty_end_date()` - Calculate warranty expiration
- `get_warranty_status()` - Get warranty status (active/expired/near_expiration)

### 4.5 Row Level Security (RLS) Policies

**General Pattern:**
- **SELECT:** Public read access (filters by user role via `auth.check_role()`)
- **INSERT:** Admin/Manager only (or role-specific rules)
- **UPDATE:** Admin/Manager + Creator (or role-specific rules)
- **DELETE:** Admin only (or soft-delete via is_active flag)

**Special Cases:**
- **audit_logs:** Admin-only SELECT, no UPDATE/DELETE (immutable)
- **service_requests:** Public INSERT (no auth), Admin/Manager for UPDATE/DELETE
- **service_ticket_tasks:** Technician can UPDATE assigned tasks only
- **profiles:** Users can UPDATE their own profile

**Bypass via Service Role:**
- tRPC uses `supabaseAdmin` client (service role key)
- Service role bypasses ALL RLS policies
- Authorization manually enforced in tRPC middleware
- Always use `ctx.user` for authentication checks

---

## 5. User Interface

### 5.1 Navigation Structure

**Functional Grouping:**
```
📊 Dashboard
  └─ /dashboard - Main analytics
  └─ /dashboard/task-progress - Task monitoring (manager)
  └─ /dashboard/notifications - Notification center

🎯 Operations (Daily Work)
  └─ /operations/tickets - Service tickets
  └─ /operations/service-requests - Public requests
  └─ /operations/deliveries - Delivery confirmations
  └─ /my-tasks - Personal tasks (technician)
  └─ /my-tasks/serial-entry - Serial entry tasks

📦 Inventory (Stock & Warehouse)
  └─ /inventory/overview - Warehouse dashboard
  └─ /inventory/products - Physical products
  └─ /inventory/stock-levels - Stock monitoring
  └─ /inventory/rma - RMA management
  └─ /inventory/warehouses - Warehouse config
  └─ /inventory/documents - Stock documents
      └─ /documents/receipts - Stock receipts
      └─ /documents/issues - Stock issues
      └─ /documents/transfers - Stock transfers

📚 Catalog (Master Data)
  └─ /catalog/products - Product catalog
  └─ /catalog/parts - Parts inventory
  └─ /catalog/brands - Brand management

👥 Management (Admin Functions)
  └─ /management/customers - Customer management
  └─ /management/team - Team/user management

⚙️ Workflows (Process Templates)
  └─ /workflows/templates - Task templates
  └─ /workflows/task-types - Task type library

🔧 Settings (Configuration)
  └─ /settings/account - User account
  └─ /settings/system - System settings (admin)
```

**Role-Based Visibility:**
- Admin: 100% of pages (all 45+ pages)
- Manager: 89% (no system settings, no audit logs)
- Technician: 39% (task-focused, read-only inventory/catalog)
- Reception: 33% (customer intake, delivery, basic operations)

### 5.2 Key Pages

#### 5.2.1 Dashboard

**Main Dashboard** (`/dashboard`)
- **Metrics Cards:** Total tickets, revenue, customers, pending tasks, low stock, open requests
- **Revenue Chart:** Area chart showing last 12 months
- **Serial Entry Compliance Widget:** Manager-only, shows completion rate, overdue tasks, team performance
- **Employee Performance Table:** Technician leaderboard (completed tasks, revenue generated)
- **Recent Tickets:** Last 10 tickets with quick actions

**Task Progress Dashboard** (`/dashboard/task-progress`) - Manager only
- **Summary Cards:** Total tasks, completed, in progress, blocked, overdue
- **Task Table:** All active tasks across tickets
- **Filters:** Status, technician, priority, date range
- **Blocked Task Alerts:** Highlight tasks with dependency issues
- **Technician Workload:** Distribution chart

**Notification Center** (`/dashboard/notifications`)
- **Email Stats Cards:** Total sent, delivery rate, open rate, click rate
- **Email Table:** List all notifications with filters
- **Email Detail Modal:** View email content, resend, delivery status
- **Template Filter:** Filter by 6 email templates

#### 5.2.2 Operations

**Service Tickets** (`/operations/tickets`)
- **Ticket Table:** All tickets with filters (status, priority, date range, technician)
- **Quick Actions:** View, edit, add comment, change status, upload image
- **Create Button:** Opens add ticket wizard
- **Search:** Find by ticket number, customer name

**Ticket Detail** (`/operations/tickets/[id]`)
- **Ticket Header:** Ticket number, status badge, priority, service type
- **Customer Info:** Name, phone, email, address
- **Product Info:** SKU, model, brand, serial number
- **Cost Breakdown:** Service fee, diagnosis fee, parts total, discount, total
- **Task List Accordion:** All tasks with status, start/complete actions
- **Parts Used:** Parts table with add/remove actions
- **Comments:** Comment thread with quick comment modal
- **Attachments:** Image gallery with upload modal
- **Actions:** Edit ticket, change status, switch template, print

**Service Requests** (`/operations/service-requests`)
- **Request Table:** All submitted requests with filters
- **Request Detail Modal:** View full request details
- **Actions:** Accept, reject, convert to ticket, update status
- **Filters:** Status, date range, customer

**Deliveries** (`/operations/deliveries`)
- **Delivery Table:** Tickets pending delivery confirmation
- **Delivery Confirmation Modal:** Signature capture, delivery method selection, address entry
- **Filters:** Date range, delivery method
- **Alerts:** Overdue confirmations (>3 days)

#### 5.2.3 Inventory

**Inventory Overview** (`/inventory/overview`)
- **Stock Stats Cards:** Total products, low stock alerts, in-service count, RMA staging count
- **Stock by Warehouse Chart:** Bar chart showing distribution
- **Low Stock Alerts Table:** Products below threshold
- **Recent Movements:** Last 20 stock movements

**Physical Products** (`/inventory/products`)
- **Product Table:** All serialized products with filters
- **Filters:** Warehouse, virtual warehouse type, product, condition, warranty status
- **Search:** Serial number, product name
- **Actions:** Register new product, bulk import, transfer, assign to ticket, add to RMA
- **Product Detail:** Serial number, product, condition, warehouse, warranty dates, movement history

**Warehouses** (`/inventory/warehouses`)
- **Physical Warehouse Table:** List physical warehouses
- **Virtual Warehouse Table:** List virtual warehouses (nested under physical)
- **Actions:** Create warehouse, edit, toggle active
- **Warehouse Form Modal:** Name, code, address, type selection

**Stock Levels** (`/inventory/stock-levels`)
- **Stock Table:** Product stock by warehouse
- **Filters:** Product, warehouse, virtual warehouse type
- **Low Stock Highlights:** Red background for below threshold
- **Threshold Configuration:** Set min stock levels per product+warehouse

**RMA Management** (`/inventory/rma`)
- **RMA Batch Table:** List all RMA batches
- **Filters:** Status, date range, supplier
- **Create RMA Batch Drawer:** Supplier selection, expected return date
- **RMA Detail** (`/inventory/rma/[id]`): Batch info, product list, shipping info, actions
- **Actions:** Add products (from warranty_stock only), remove products, submit, approve, ship, complete

**Stock Documents:**
- **Receipts** (`/inventory/documents/receipts`)
  - **Receipt Table:** List all receipts with filters
  - **Create Receipt:** Add header info, add line items with declared quantities
  - **Receipt Detail** (`/receipts/[id]`): Header, items table, serial entry accordion, approval actions
  - **Serial Entry:** Per-product accordion with auto-save, validation, progress bar
  - **Approval Workflow:** Submit → Manager approves → Stock increased

- **Issues** (`/inventory/documents/issues`)
  - Similar structure to receipts
  - Serial verification before approval
  - Stock decrease on approval

- **Transfers** (`/inventory/documents/transfers`)
  - Similar structure to receipts/issues
  - Source and destination warehouse selection
  - Stock movement on approval

#### 5.2.4 Catalog

**Products** (`/catalog/products`)
- **Product Table:** All catalog products (SKU)
- **Filters:** Brand, category, active status
- **Actions:** Create product, edit, toggle active
- **Product Form:** SKU, name, brand, category, description, default warranty, price, image

**Parts** (`/catalog/parts`)
- **Parts Table:** All parts inventory
- **Filters:** Category, low stock, active status
- **Actions:** Create part, edit, adjust stock, toggle active
- **Part Form:** Part number, name, category, price, stock quantity, min stock, supplier

**Brands** (`/catalog/brands`)
- **Brand Table:** All brands
- **Actions:** Create brand, edit, delete (if unused), toggle active
- **Brand Form:** Name, logo, country, website, contact

#### 5.2.5 Workflows

**Task Templates** (`/workflows/templates`)
- **Template Table:** All templates with filters
- **Filters:** Product, service type, active status
- **Actions:** Create template, edit (creates new version), preview, assign to product
- **Template Form:** Name, description, product, service type, enforcement mode, drag-drop task ordering
- **Template Preview Modal:** Read-only view of task sequence

**Task Types** (`/workflows/task-types`)
- **Task Type Table:** All task types with filters
- **Tabs:** All / Active / Inactive
- **Actions:** Create task type, edit, toggle active
- **Task Type Form:** Name, category, description, estimated duration, instructions

#### 5.2.6 Management

**Customers** (`/management/customers`)
- **Customer Table:** All customers with search
- **Actions:** Create customer, edit, view service history
- **Customer Form:** Name, phone, email, address, delivery preference, notes

**Team** (`/management/team`) - Admin only
- **Team Table:** All staff users
- **Actions:** Create user, edit, reset password, change role, toggle active
- **User Form:** Email, full name, role, password
- **Role Change:** Dropdown with mandatory reason
- **Password Reset:** Generate new password, send email

#### 5.2.7 Public Pages

**Service Request** (`/service-request`) - Public
- **Request Form:** Customer info, product details, issue description, photos
- **Serial Verification Widget:** Real-time lookup, warranty status
- **Submit:** Auto-generate tracking token, send confirmation email
- **Success Page:** Display tracking token, instructions

**Request Tracking** (`/service-request/track`) - Public
- **Tracking Input:** Enter tracking token
- **Request Status Display:** Progress timeline, current status, expected completion
- **Customer Notes:** Updates from staff

### 5.3 Design System

**Colors:**
- Primary: Blue (tickets, primary actions)
- Success: Green (completed, approved)
- Warning: Yellow (in progress, warnings)
- Danger: Red (cancelled, rejected, critical alerts)
- Info: Cyan (informational messages)
- Muted: Gray (secondary text, disabled states)

**Components:** shadcn/ui (Radix UI primitives)
- Alert, Avatar, Badge, Button, Card, Checkbox, Command, Dialog, Dropdown, Form, Input, Label, Popover, Progress, Radio, Select, Separator, Sheet, Sidebar, Switch, Table, Tabs, Textarea, Toggle, Tooltip
- Custom: DataTable, FormDrawer, SearchableSelect, MultiSelectCombobox, DatePicker, SignatureCanvas

**Typography:**
- Headings: Bold, hierarchical sizing (H1-H6)
- Body: Regular weight, 14px base
- Labels: Semibold, 12px
- Captions: Regular, 12px, muted color

**Spacing:**
- Base unit: 4px (Tailwind scale: 1-96)
- Card padding: 6 (24px)
- Section gap: 4 (16px)
- Form field gap: 3 (12px)

**Responsive Breakpoints:**
- Mobile: 375px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Status Colors:**
- Pending: Gray
- In Progress: Blue
- Completed: Green
- Cancelled: Red
- Blocked: Orange
- Overdue: Red (pulsing animation)

### 5.4 User Flows

**Create Service Ticket:**
1. Navigate to `/operations/tickets`
2. Click "Create Ticket" button
3. Fill customer info (search existing or create new)
4. Select product from catalog
5. Choose service type and priority
6. Add description and photos
7. Optionally assign technician and template
8. Submit ticket
9. Tasks auto-generated from template
10. Redirect to ticket detail page

**Execute Task:**
1. Navigate to `/my-tasks` or `/operations/tickets/[id]`
2. Click "Start Task" on pending task
3. Task status → in_progress, timestamp recorded
4. Enter findings and notes
5. Click "Complete Task"
6. Task completion modal opens
7. Confirm completion or mark blocked
8. Task status → completed, timestamp recorded
9. Next task auto-enabled if dependencies met
10. Task completion logged to ticket comments

**Stock Receipt Workflow:**
1. Navigate to `/inventory/documents/receipts`
2. Click "Create Receipt"
3. Enter supplier, reference number, notes
4. Add line items: product, declared quantity
5. Save receipt as draft
6. Submit for approval (0% serials OK)
7. Manager reviews and approves
8. Stock increased immediately
9. Serial entry task created (parallel)
10. Technician enters serials at `/my-tasks/serial-entry`
11. Auto-save every 500ms, real-time validation
12. Progress tracked on manager dashboard
13. 100% completion achieved

**Convert Service Request to Ticket:**
1. Navigate to `/operations/service-requests`
2. Click request row to open detail modal
3. Review customer info, product, issue
4. Click "Convert to Ticket"
5. Convert modal opens with pre-filled data
6. Select service type, priority, assign technician
7. Optionally select task template
8. Submit conversion
9. Ticket created with reference to request
10. Request status → processing
11. Email sent to customer with ticket number
12. Redirect to new ticket detail page

---

## 6. API Design

### 6.1 tRPC Routers

**14 Main Routers:**

| Router | Purpose | Key Procedures | Middleware |
|--------|---------|----------------|------------|
| `admin` | System setup and initialization | `setup`, `createFirstAdmin`, `checkSetup`, `getSystemInfo` | Public |
| `profile` | User profile management | `getCurrent`, `update`, `getAll`, `getById` | Auth required |
| `tickets` | Service ticket CRUD and workflow | `list`, `getById`, `create`, `update`, `delete`, `updateStatus`, `addPart`, `removePart`, `confirmDelivery` | Role-based |
| `customers` | Customer management | `list`, `getById`, `create`, `update`, `delete`, `search` | Role-based |
| `products` | Product catalog | `list`, `getById`, `create`, `update`, `delete`, `toggleActive` | Role-based |
| `parts` | Parts inventory | `list`, `getById`, `create`, `update`, `delete`, `adjustStock` | Role-based |
| `brands` | Brand management | `list`, `getById`, `create`, `update`, `delete`, `toggleActive` | Role-based |
| `workflow` | Task templates and types | `taskType.list/create/update/toggleActive`, `template.list/create/update/assign/switchTemplate`, `task.list/getById/start/complete/updateStatus` | Role-based |
| `warehouse` | Warehouse configuration | `physical.list/create/update`, `virtual.list/create/update/getByPhysical` | Role-based |
| `inventory` | Inventory operations (sub-routers) | See below | Role-based |
| `physicalProducts` | Serialized products | `list`, `getById`, `create`, `bulkImport`, `transfer`, `assignToTicket`, `addToRMA` | Role-based |
| `serviceRequest` | Public service requests | `create`, `getByToken`, `list`, `getById`, `accept`, `reject`, `convertToTicket`, `updateStatus` | Mixed (public + auth) |
| `revenue` | Analytics and reporting | `getRevenueByPeriod`, `getRevenueByServiceType`, `getRevenueByTechnician`, `getTicketStats` | Manager+ |
| `notifications` | Email notifications | `list`, `getById`, `send`, `resend`, `getStats` | Role-based |

**Inventory Sub-Routers** (`inventory.*`):
- `stock.*` - Stock queries: `getByProduct`, `getByWarehouse`, `getLowStock`, `getMovementHistory`
- `receipts.*` - Stock receipts: `list`, `getById`, `create`, `update`, `submit`, `approve`, `reject`
- `issues.*` - Stock issues: `list`, `getById`, `create`, `update`, `submit`, `approve`, `reject`
- `transfers.*` - Stock transfers: `list`, `getById`, `create`, `update`, `submit`, `approve`, `reject`
- `serials.*` - Serial utilities: `getComplianceMetrics`, `getSerialEntryTasks`, `addSerial`, `removeSerial`, `bulkAddSerials`, `bulkImportCSV`, `validateSerials`
- `approvals.*` - Approval workflow: `listPending`, `approve`, `reject`, `getBatchApprovals`

**Total Procedures:** 160+

### 6.2 Authorization Middleware

**Middleware Functions:**
- `requireAdmin()` - Admin-only procedures
- `requireManagerOrAbove()` - Manager or Admin
- `requireAnyAuthenticated()` - Any logged-in user
- `requireRole(role)` - Specific role required
- Public procedures (no middleware) - Service request submission, tracking, serial verification

**Context:**
- `ctx.user` - Authenticated user (from JWT)
- `ctx.supabaseAdmin` - Service role client (bypasses RLS)
- `ctx.supabaseClient` - Anon key client (with user session)

**Authorization Pattern:**
```typescript
// Admin only
export const adminRouter = router({
  deleteUser: publicProcedure
    .use(requireAdmin)
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ctx.user guaranteed to be admin
      // Manual authorization already checked by middleware
      await ctx.supabaseAdmin.from('profiles').delete().eq('id', input.userId);
    })
});

// Manager or above
export const approvalRouter = router({
  approveReceipt: publicProcedure
    .use(requireManagerOrAbove)
    .input(z.object({ receiptId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ctx.user guaranteed to be manager or admin
      await ctx.supabaseAdmin
        .from('stock_receipts')
        .update({ status: 'approved', approved_by: ctx.user.id })
        .eq('id', input.receiptId);
    })
});
```

### 6.3 Input Validation

**All inputs validated with Zod schemas:**
```typescript
// Example: Create ticket input schema
const createTicketInput = z.object({
  customer_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  service_type: z.enum(['warranty', 'paid', 'goodwill']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  description: z.string().min(10).max(2000),
  service_fee: z.number().nonnegative().optional(),
  diagnosis_fee: z.number().nonnegative().optional(),
  discount_amount: z.number().nonnegative().optional(),
  assigned_to: z.string().uuid().optional(),
  template_id: z.string().uuid().optional(),
});
```

**Validation Rules:**
- UUIDs for all IDs
- Enums for status fields
- Min/max lengths for text fields
- Non-negative numbers for costs/quantities
- Email format validation
- Date format validation (ISO 8601)
- Optional vs required fields
- Custom validators for business rules

### 6.4 Error Handling

**Error Types:**
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks permission
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid input or business rule violation
- `CONFLICT` - Duplicate key or constraint violation
- `INTERNAL_SERVER_ERROR` - Unexpected server error

**Error Response Format:**
```typescript
{
  error: {
    code: "FORBIDDEN",
    message: "User does not have permission to perform this action",
    details: { requiredRole: "admin", userRole: "technician" }
  }
}
```

**Zod Validation Errors:**
```typescript
{
  error: "Validation Error",
  errors: [
    { path: ["email"], message: "Invalid email format" },
    { path: ["service_fee"], message: "Must be non-negative" }
  ]
}
```

---

## 7. Implementation Notes

### 7.1 Development Workflow

**Setup:**
```bash
# Clone repository
git clone <repository-url>

# Install dependencies
pnpm install

# Start Supabase stack (12 services via Docker Compose)
pnpx supabase start

# Start development server (Turbopack, port 3025)
pnpm dev
```

**Database Changes:**
1. Edit schema files in `docs/data/schemas/` (source of truth)
2. Run `./docs/data/schemas/setup_schema.sh` to copy to `supabase/schemas/`
3. Generate migration: `pnpx supabase db diff -f migration_name`
4. Review migration in `supabase/migrations/`
5. Apply: `pnpx supabase migration up`
6. Generate TypeScript types: `pnpx supabase gen types typescript`

**Code Quality:**
```bash
pnpm lint      # Biome linting
pnpm format    # Biome formatting
pnpm build     # Production build (Turbopack)
```

**Testing:**
```bash
pnpm test:e2e  # Playwright E2E tests
```

### 7.2 Deployment

**Build Process:**
1. Run `pnpm build` to create production bundle
2. Test build locally with `pnpm start`
3. Verify all pages load and API endpoints work

**Database Migration:**
1. Apply migrations to production: `pnpx supabase migration up --db-url <production-db-url>`
2. Verify migration success via Supabase Studio
3. Backup database before and after migration

**Application Deployment:**
1. Build Docker image for Next.js app
2. Deploy to production environment
3. Update environment variables
4. Restart application container
5. Verify health check endpoint

**Zero-Downtime Strategy:**
1. Ensure migrations are backward compatible
2. Deploy new code without breaking old code
3. Run migration after code deployment
4. Monitor for errors and rollback if needed

### 7.3 Environment Variables

**Required:**
```bash
# Supabase (from pnpx supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Setup
SETUP_PASSWORD=<secure-password>

# Admin Account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<secure-password>
ADMIN_NAME=Administrator
```

**Optional:**
```bash
# Feature Flags
PUBLIC_REQUEST_PORTAL_ENABLED=true
WAREHOUSE_LOW_STOCK_ALERT_ENABLED=true
TASK_WORKFLOW_STRICT_MODE_DEFAULT=false
EMAIL_NOTIFICATION_ENABLED=true

# Email (SMTP via GoTrue)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_SENDER_NAME=Service Center
```

**Production:**
```bash
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://service-center.example.com
```

### 7.4 File Structure

```
/home/tan/work/sevice-center/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                  # Authenticated routes
│   │   │   ├── dashboard/           # Analytics and overview
│   │   │   ├── operations/          # Daily operations (tickets, requests, deliveries, tasks)
│   │   │   ├── inventory/           # Inventory management (products, warehouses, RMA, documents)
│   │   │   ├── catalog/             # Master data (products, parts, brands)
│   │   │   ├── management/          # Admin functions (customers, team)
│   │   │   ├── workflows/           # Process templates (templates, task-types)
│   │   │   └── settings/            # Configuration (account, system)
│   │   ├── (public)/                # Public routes
│   │   │   ├── login/               # Authentication
│   │   │   ├── setup/               # Initial setup
│   │   │   ├── service-request/     # Public service portal
│   │   │   └── logout/              # Session termination
│   │   └── api/                     # API routes
│   │       ├── trpc/[...trpc]/      # tRPC endpoint
│   │       └── health/              # Health check
│   ├── components/                   # React components (138 files)
│   │   ├── ui/                      # shadcn/ui base components (45+)
│   │   ├── forms/                   # Business forms
│   │   ├── tables/                  # Data tables (15+)
│   │   ├── modals/                  # Modal dialogs
│   │   ├── drawers/                 # Drawer components
│   │   ├── shared/                  # Shared business components
│   │   ├── inventory/               # Inventory-specific components (20+)
│   │   ├── warehouse/               # Warehouse components
│   │   ├── templates/               # Template editor components
│   │   ├── auth/                    # Authorization components (RequireRole, Can)
│   │   ├── dashboard/               # Dashboard widgets
│   │   └── providers/               # Context providers
│   ├── server/
│   │   ├── routers/                 # tRPC routers (14 main + 6 inventory sub-routers)
│   │   │   ├── _app.ts              # Main router
│   │   │   ├── admin.ts
│   │   │   ├── profile.ts
│   │   │   ├── tickets.ts
│   │   │   ├── customers.ts
│   │   │   ├── products.ts
│   │   │   ├── parts.ts
│   │   │   ├── brands.ts
│   │   │   ├── workflow.ts
│   │   │   ├── warehouse.ts
│   │   │   ├── inventory/           # Inventory sub-routers
│   │   │   │   ├── index.ts
│   │   │   │   ├── stock.ts
│   │   │   │   ├── receipts.ts
│   │   │   │   ├── issues.ts
│   │   │   │   ├── transfers.ts
│   │   │   │   ├── serials.ts
│   │   │   │   └── approvals.ts
│   │   │   ├── physical-products.ts
│   │   │   ├── service-request.ts
│   │   │   ├── revenue.ts
│   │   │   └── notifications.ts
│   │   ├── middleware/              # tRPC middleware (requireRole, etc.)
│   │   └── trpc.ts                  # tRPC initialization
│   ├── hooks/                        # Custom React hooks
│   │   └── useRole.ts               # Role-based UI utilities
│   ├── types/                        # TypeScript type definitions
│   │   ├── database.types.ts        # Supabase generated types
│   │   └── roles.ts                 # Role types
│   ├── utils/
│   │   ├── supabase/                # Supabase clients
│   │   │   ├── client.ts            # Browser client
│   │   │   ├── server.ts            # Server client
│   │   │   └── admin.ts             # Service role client
│   │   └── trpc.ts                  # tRPC client
│   └── constants/                    # Application constants
├── supabase/
│   ├── migrations/                   # Database migrations (33 files)
│   ├── schemas/                      # Schema files (copied from docs/data/schemas/)
│   └── config.toml                   # Supabase configuration
├── docs/
│   ├── architecture/                 # Architecture documentation (10 shards)
│   ├── data/schemas/                 # Schema source of truth
│   ├── prd.md                        # This file
│   ├── CLAUDE.md                     # Project instructions
│   └── DEVELOPMENT.md                # Development guide
├── tests/
│   └── e2e/                          # Playwright E2E tests
├── public/                           # Static assets
├── package.json                      # Dependencies (v0.2.1)
├── tsconfig.json                     # TypeScript configuration
├── biome.json                        # Biome linting configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── next.config.mjs                   # Next.js configuration
├── docker-compose.yml                # Supabase stack orchestration
└── .env                              # Environment variables (local)
```

### 7.5 Key Files

**Configuration:**
- `package.json` - Dependencies, scripts, version (0.2.1)
- `tsconfig.json` - TypeScript strict mode, path aliases
- `biome.json` - Linting rules, formatting preferences
- `tailwind.config.ts` - Tailwind configuration, custom theme
- `next.config.mjs` - Next.js configuration, Turbopack settings
- `docker-compose.yml` - Supabase 12-service stack

**Documentation:**
- `docs/prd.md` - This file (Product Requirements Document)
- `docs/CLAUDE.md` - Project instructions for Claude Code
- `docs/architecture/` - 10 architecture shards (62KB+ total)
- `docs/DEVELOPMENT.md` - Development setup guide
- `docs/DEPLOYMENT.md` - Deployment guide (Vietnamese)

**Database:**
- `supabase/migrations/` - 33 migration files
- `docs/data/schemas/` - Schema source of truth
- `src/types/database.types.ts` - Generated TypeScript types

**API:**
- `src/server/routers/_app.ts` - Main tRPC router (combines all sub-routers)
- `src/server/routers/*.ts` - 14 main routers
- `src/server/routers/inventory/*.ts` - 6 inventory sub-routers
- `src/server/trpc.ts` - tRPC initialization, context creation
- `src/app/api/trpc/[...trpc]/route.ts` - Next.js API route handler

**Components:**
- `src/components/ui/*.tsx` - 45+ shadcn/ui components
- `src/components/tables/*.tsx` - 15+ data tables
- `src/components/forms/*.tsx` - Business forms
- `src/components/modals/*.tsx` - Modal dialogs
- `src/components/inventory/*.tsx` - 20+ inventory components

---

## 8. Future Enhancements

### 8.1 Planned Features

**Phase 3: Advanced Analytics**
- Custom report builder
- Revenue forecasting
- Technician productivity trends
- Customer retention metrics
- Inventory turnover analysis
- Predictive maintenance alerts

**Phase 4: Integration & Automation**
- Third-party integrations (accounting software, CRM)
- Automated email campaigns
- SMS notifications
- Barcode/QR code scanning (mobile app)
- E-signature for delivery confirmation
- Real-time WebSocket updates (replace polling)

**Phase 5: Mobile Application**
- Native iOS/Android apps for technicians
- Offline task execution
- Photo capture for documentation
- Push notifications
- Mobile-optimized task UI

**Phase 6: AI/ML Features**
- Predictive task duration
- Automatic issue categorization
- Smart part recommendations
- Anomaly detection in repair patterns
- Chatbot for customer support

### 8.2 Technical Debt

**Code Organization:**
- Migrate flat component structure to organized structure (per `docs/architecture/frontend-architecture-roadmap.md`)
- Consolidate duplicate code in table components
- Extract common patterns into shared utilities

**Testing:**
- Increase E2E test coverage (currently RBAC + basic workflows)
- Add unit tests for tRPC procedures
- Add component tests (React Testing Library)
- Implement visual regression testing

**Performance:**
- Implement caching layer for frequently accessed data
- Optimize database queries (add missing indexes)
- Image optimization (convert to WebP, lazy loading)
- Code splitting for large pages

**Security:**
- Implement rate limiting on all public endpoints
- Add CAPTCHA to service request form
- File upload virus scanning
- Enhanced audit logging (track all data changes)

**Documentation:**
- API documentation (OpenAPI/Swagger)
- User manual (end-user documentation)
- Video tutorials for common workflows
- Inline code documentation (JSDoc)

---

## 9. Glossary

**Terms:**
- **RBAC:** Role-Based Access Control - Permission system based on user roles
- **RLS:** Row Level Security - Database-level access control policies
- **tRPC:** TypeScript Remote Procedure Call - Type-safe API framework
- **SKU:** Stock Keeping Unit - Unique product identifier in catalog
- **RMA:** Return Merchandise Authorization - Process for returning defective products to supplier
- **GRN:** Goods Receipt Note - Document for incoming inventory (Stock Receipt)
- **JWT:** JSON Web Token - Authentication token format
- **ACID:** Atomicity, Consistency, Isolation, Durability - Database transaction properties
- **Supabase:** Open-source Firebase alternative (PostgreSQL, Auth, Storage)
- **Service Role:** Supabase administrative client that bypasses RLS policies
- **Virtual Warehouse:** Logical stock category (warranty_stock, rma_staging, etc.)
- **Physical Warehouse:** Physical storage location
- **Task Template:** Predefined workflow with ordered task sequence
- **Task Instance:** Individual task created from template, linked to specific ticket
- **Turbopack:** Next.js bundler (faster than Webpack)
- **shadcn/ui:** Component library built on Radix UI primitives
- **Phiếu Nhập Kho:** Vietnamese for Stock Receipt
- **Phiếu Xuất Kho:** Vietnamese for Stock Issue
- **Phiếu Chuyển Kho:** Vietnamese for Stock Transfer

**Abbreviations:**
- **SV:** Service (ticket prefix)
- **SR:** Service Request (tracking token prefix)
- **RMA:** Return Merchandise Authorization
- **E2E:** End-to-End (testing)
- **API:** Application Programming Interface
- **UI:** User Interface
- **UX:** User Experience
- **SMTP:** Simple Mail Transfer Protocol
- **WCAG:** Web Content Accessibility Guidelines
- **MVP:** Minimum Viable Product
- **CRUD:** Create, Read, Update, Delete

---

## 10. Change History

**Version 1.0** (2025-10-28)
- Complete PRD rewrite as current state document
- Removed all change logs, legacy planning, story-based structure
- Consolidated requirements from existing codebase
- Added comprehensive feature documentation
- Documented all 37 database tables, 14 routers, 45+ pages
- Present-tense descriptions of what exists NOW
- No historical baggage, single source of truth

---

**End of Product Requirements Document**

*For technical implementation details, see `docs/architecture/` (10 shards, 62KB+)*
*For project instructions, see `CLAUDE.md`*
*For development setup, see `DEVELOPMENT.md`*
