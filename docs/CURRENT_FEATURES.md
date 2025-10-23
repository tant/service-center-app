# Service Center Management Application - Features & Functionality

**Document Version:** 1.0
**Last Updated:** 2025-10-22
**Status:** Current Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Workflows](#core-workflows)
4. [Application Pages](#application-pages)
5. [API Endpoints](#api-endpoints)
6. [Business Logic & Automation](#business-logic--automation)
7. [Data Management](#data-management)
8. [Analytics & Reporting](#analytics--reporting)
9. [Authentication & Authorization](#authentication--authorization)
10. [File Handling](#file-handling)
11. [Database Features](#database-features)
12. [UI Components & Patterns](#ui-components--patterns)
13. [Technical Implementation](#technical-implementation)
14. [Known Limitations](#known-limitations)

---

## Overview

The Service Center Management Application is a full-stack web application designed for managing service ticket workflows, customer relationships, inventory, and business analytics for service/repair centers. Built with Next.js 15, React 19, TypeScript, Supabase, and tRPC, it provides end-to-end type safety and a modern, responsive user interface.

**Key Capabilities:**
- Service ticket lifecycle management with automatic numbering
- Customer relationship management
- Product catalog and parts inventory tracking
- Role-based access control (Admin, Manager, Technician, Reception)
- Real-time analytics and performance dashboards
- Automated cost calculations and stock management
- Comprehensive audit trail via auto-comments

---

## User Roles & Permissions

### Admin (Full System Access)
- All Manager, Technician, and Reception capabilities
- User management (create, edit, delete staff accounts)
- System setup and configuration
- Delete restricted operations (tickets, parts, brands)
- Full access to all reports and analytics
- Team management page access

### Manager
- All Technician and Reception capabilities
- Product catalog management (CRUD)
- Parts inventory management (CRUD)
- Dashboard analytics and reports access
- Delete operations on tickets
- Brand management

### Technician
- View and work on assigned service tickets
- Update ticket status and add notes/comments
- Add, modify, and remove parts on tickets
- View customer and product information
- Access to brands management
- Limited dashboard access

### Reception
- Create new service tickets
- View all tickets (read-only for unassigned)
- Manage customer information (CRUD)
- View products and brands (read-only)
- Basic dashboard access

---

## Core Workflows

### Service Ticket Lifecycle

#### Status Flow (One-Way, Database-Enforced)
```
pending → in_progress → completed
   ↓            ↓
cancelled    cancelled
```

**Terminal States:** `completed` and `cancelled` tickets cannot be modified (enforced by Row Level Security)

#### Automatic Features
- **Ticket Numbering:** Auto-generated in format `SV-YYYY-NNN` (e.g., SV-2025-001)
- **Cost Calculation:** `total_cost = service_fee + diagnosis_fee + parts_total - discount_amount`
- **Parts Total:** Automatically updated via database triggers when parts added/removed
- **Status Logging:** All status changes automatically logged to comments
- **Timestamps:** `started_at` and `completed_at` tracked automatically
- **Change Tracking:** All field modifications generate auto-comments

#### Ticket Operations
1. **Create Ticket:** Multi-step wizard with customer lookup/creation
2. **Update Details:** Service fees, diagnosis fees, discounts, priority, warranty type
3. **Assign Technician:** Change assigned technician (logged automatically)
4. **Add Parts:** Select from inventory, specify quantity (decreases stock)
5. **Update Parts:** Modify quantity or pricing (adjusts stock accordingly)
6. **Remove Parts:** Delete part from ticket (returns stock)
7. **Add Comments:** Notes, internal comments with author tracking
8. **Upload Images:** Attach photos/documents to tickets
9. **Progress Status:** Move through workflow stages
10. **Complete/Cancel:** Terminal state transitions

### Customer Management
- **Auto-Detection:** Phone number lookup during ticket creation
- **Quick Creation:** In-line customer creation if not found
- **Full CRUD:** Create, view, edit, delete customers
- **Contact Management:** Name, phone, email, address tracking
- **History Tracking:** View customer's service ticket history
- **Growth Analytics:** Monthly new customer count with % change

### Inventory Management
- **Stock Tracking:** Real-time quantity updates
- **Automatic Decreases:** When parts added to tickets
- **Automatic Increases:** When parts removed or returned
- **Stock Validation:** Prevents negative inventory
- **Atomic Operations:** Database RPC functions ensure data consistency
- **Product Relationships:** Parts linked to products for easy selection

---

## Application Pages

### Public Routes
| Route | Description | Access |
|-------|-------------|--------|
| `/login` | Authentication page with Supabase Auth | Public |
| `/setup` | Initial system setup (creates admin account) | Password-protected |
| `/error` | Error handling page | Public |

### Authenticated Routes
| Route | Description | Required Role |
|-------|-------------|---------------|
| `/dashboard` | Main analytics dashboard with metrics and charts | All roles |
| `/tickets` | Service tickets list with filters and search | All roles |
| `/tickets/add` | Create new ticket (multi-step wizard) | Reception+ |
| `/tickets/[id]` | Ticket detail view with full information | All roles |
| `/tickets/[id]/edit` | Edit ticket details | Manager+ |
| `/customers` | Customer management with CRUD operations | All roles |
| `/products` | Product catalog management | Manager+ |
| `/parts` | Parts inventory management | Manager+ |
| `/brands` | Brand management | Manager+ |
| `/team` | Staff/team member management | Admin only |
| `/account` | User profile settings | All roles |
| `/setting` | System settings | Admin+ |
| `/app-setting` | Application configuration | Admin+ |
| `/report` | Reports page (placeholder) | Manager+ |

---

## API Endpoints

### Admin Router (`admin.*`)
- `setup` - Initial system setup with password protection and intelligent user handling

### Profile Router (`profile.*`)
- `getCurrentUser` - Get authenticated user profile with role
- `updateProfile` - Update user profile (name, email, avatar)
- `getAllUsers` - Get list of all active users

### Tickets Router (`tickets.*`)
- `getTickets` - List all tickets with customer/product information
- `getTicket` - Get single ticket with full details and relationships
- `getPendingCount` - Count of non-completed tickets
- `getDailyRevenue` - Revenue data grouped by date for charts
- `createTicket` - Create new ticket with customer lookup/creation and initial parts
- `updateTicket` - Update ticket fields (generates auto-comments for changes)
- `updateTicketStatus` - Change ticket status with validation
- `addTicketPart` - Add part to ticket (automatically decreases stock)
- `updateTicketPart` - Update part quantity/price (adjusts stock automatically)
- `deleteTicketPart` - Remove part from ticket (returns stock)
- `addComment` - Add comment or note to ticket
- `addAttachment` - Add file attachment metadata
- `getAttachments` - Get all attachments for a ticket
- `deleteAttachment` - Delete attachment (Manager+)

### Customers Router (`customers.*`)
- `getCustomers` - List all customers with contact information
- `getNewCustomers` - Monthly customer count with growth rate
- `createCustomer` - Add new customer with validation
- `updateCustomer` - Edit customer details
- `deleteCustomer` - Remove customer (cascade protection)

### Products Router (`products.*`)
- `getProducts` - List all products with brand information
- `getProduct` - Get single product with related parts
- `getNewProducts` - Monthly product count with growth rate
- `createProduct` - Create product with brand and part relationships
- `updateProduct` - Update product details and part links

### Parts Router (`parts.*`)
- `getParts` - List all parts with stock levels
- `getNewParts` - Monthly parts count with growth rate
- `createPart` - Add new part with initial stock and product links
- `updatePart` - Update part details, pricing, and product relationships
- `deletePart` - Remove part (cleans up product relationships)
- `getProducts` - Get products for part linking

### Brands Router (`brands.*`)
- `getBrands` - List all brands with active/inactive status
- `createBrand` - Create new brand
- `updateBrand` - Update brand (name, description, active status)
- `deleteBrand` - Delete brand (validates no products are using it)

### Revenue Router (`revenue.*`)
- `getMonthlyRevenue` - Current and previous month revenue with growth rate

---

## Business Logic & Automation

### Auto-Calculations
1. **Ticket Total Cost** (Generated Column):
   ```
   total_cost = service_fee + diagnosis_fee + parts_total - discount_amount
   ```
2. **Parts Total per Ticket** (Trigger-Based):
   - Recalculated when parts added/removed/updated
   - Sum of (quantity × unit_price) for all parts
3. **Individual Line Totals**:
   - Each part line: `quantity × unit_price`

### Auto-Comments System

The system automatically generates comments for:

| Event | Comment Format | Type |
|-------|---------------|------|
| Ticket Creation | "Ticket created with [Product] for customer [Name]" | system |
| Status Change | "[Old Status] → [New Status]" | status_change |
| Service Fee Change | "Service fee updated: [Old] → [New]" | note |
| Diagnosis Fee Change | "Diagnosis fee updated: [Old] → [New]" | note |
| Discount Applied | "Discount updated: [Old] → [New] 💰" | note |
| Priority Change | "Priority changed: [Old] → [New]" | note |
| Warranty Change | "Warranty type changed: [Old] → [New]" | note |
| Technician Assignment | "Technician changed: [Old] → [New]" | assignment |
| Issue Updated | "Issue description updated" | note |
| Notes Updated | "Notes updated" | note |
| Part Added | "Added part: [Name] (Qty: X @ [Price])" | note |
| Part Updated | "Updated part: [Name] quantity/price" | note |
| Part Removed | "Removed part: [Name]" | note |

### Validation & Business Rules

**Status Transition Validation:**
- Only valid transitions allowed (enforced in API and database)
- Terminal states (completed, cancelled) cannot be modified

**Data Validation:**
- Phone numbers: 10+ characters, specific patterns
- Email: RFC-compliant format validation
- UUIDs: All foreign key references validated
- Positive numbers: Fees, prices, quantities must be > 0
- Stock quantities: Cannot go negative

**Stock Management:**
- Atomic operations via database RPC functions
- Fallback logic if RPC unavailable
- Validation prevents overselling

**Referential Integrity:**
- Cascade deletes for relationships
- Orphan prevention for critical entities
- Foreign key constraint enforcement

---

## Data Management

### Available CRUD Operations

#### Customers (Full CRUD)
- **Create:** Name, phone (required), email, address
- **Read:** All customers with pagination support
- **Update:** All fields modifiable
- **Delete:** With cascade protection checks

#### Products (Full CRUD)
- **Create:** Name, brand, type, SKU, part associations
- **Read:** With brand and parts relationships
- **Update:** All fields and part link management
- **Delete:** Admin/Manager only

#### Parts (Full CRUD)
- **Create:** Name, SKU, part number, pricing, stock, product links
- **Read:** With current stock levels
- **Update:** All fields, pricing, stock, product relationships
- **Delete:** With cleanup of product link table

#### Brands (Full CRUD)
- **Create:** Name, description, active status
- **Read:** With active/inactive filtering
- **Update:** Name, description, active status
- **Delete:** With usage validation (prevents deletion if products exist)

#### Service Tickets (Full CRUD)
- **Create:** With customer auto-find or creation
- **Read:** All relationships (customer, product, parts, comments, attachments)
- **Update:** Extensive field updates with auto-commenting
- **Delete:** Admin/Manager only (soft delete possible)

#### Ticket Parts (CRUD on Ticket)
- **Add:** Select from inventory with quantity and pricing
- **Update:** Modify quantity or unit price
- **Delete:** Remove from ticket with stock return

#### Comments (Create/Read)
- **Create:** Add notes, internal comments
- **Read:** View with author profile information
- **Filter:** By type (bot/staff/all comments)

#### Attachments (Create/Read/Delete)
- **Create:** Upload images with Vietnamese filename sanitization
- **Read:** List all attachments for ticket
- **Delete:** Manager+ only

---

## Analytics & Reporting

### Dashboard Metrics

**Key Performance Indicators (KPIs):**

1. **Monthly Revenue**
   - Current month total (from completed tickets)
   - Previous month comparison
   - Percentage change (↑ or ↓)

2. **New Customers**
   - Monthly customer count
   - Growth rate vs previous month

3. **New Products**
   - Monthly additions
   - Growth rate tracking

4. **New Parts**
   - Monthly inventory additions
   - Growth rate tracking

5. **Pending Tickets**
   - Real-time count of non-completed tickets
   - Includes pending, in_progress statuses

### Charts & Visualizations

**Daily Revenue Chart:**
- Interactive area chart with tooltip
- Time range filters: 7, 30, 90 days
- Trend visualization
- Total revenue display

**Employee Performance Table:**
| Metric | Description |
|--------|-------------|
| Total Tickets | All tickets assigned to technician |
| In Progress | Currently active tickets |
| Completed | Successfully finished tickets |
| Pending | Not yet started tickets |
| Completion Rate | Percentage of completed tickets |

### Revenue Analytics
- Completed ticket revenue only (excludes pending/cancelled)
- Daily grouping for trend analysis
- Month-over-month comparison
- Growth rate calculations with trending indicators

---

## Authentication & Authorization

### Setup Flow

**Intelligent Setup Process:**

1. **Access Setup Page:** Navigate to `/setup`
2. **Password Verification:** Enter `SETUP_PASSWORD` from environment variables
3. **Automated User Handling:**
   - **First-Time Setup:** Creates admin auth user + profile
   - **Password Reset:** If user exists, updates password
   - **Profile Repair:** If auth exists without profile, creates profile
   - **Orphan Cleanup:** If profile exists without auth, removes orphan and recreates

**Environment Variables Required:**
```bash
SETUP_PASSWORD=your_setup_password
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password
ADMIN_NAME=Administrator
```

### Role-Based Access Control (RBAC)

**Three-Layer Security:**

1. **Database Level (RLS Policies):**
   - Row Level Security on all tables
   - Helper functions: `is_admin()`, `is_admin_or_manager()`
   - Role-based SELECT, INSERT, UPDATE, DELETE policies

2. **API Level (tRPC):**
   - Context validates authenticated user
   - Service role client bypasses RLS for server operations
   - Zod validation on all inputs

3. **UI Level (React):**
   - Conditional rendering based on user role
   - Protected routes with middleware
   - Role-based navigation menu

### Session Management

**Three Client Types:**

1. **Browser Client** (`src/utils/supabase/client.ts`)
   - For client-side operations
   - Uses anon key with cookies

2. **Server Client** (`src/utils/supabase/server.ts`)
   - For Server Components with cookies
   - Session-aware

3. **Admin Client** (`src/utils/supabase/admin.ts`)
   - Service role key
   - Bypasses RLS for server operations
   - Used in tRPC context

**Authentication Flow:**
- Supabase Auth with JWT tokens
- Cookie-based sessions
- Automatic token refresh
- Secure logout with cookie clearing

---

## File Handling

### Storage Buckets

| Bucket | Purpose | Read Access | Write Access | Delete Access |
|--------|---------|-------------|--------------|---------------|
| `avatars` | User profile pictures | Public | Own folder | Own folder |
| `product_images` | Product photos | Public | Own folder | Own folder |
| `service_media` | Ticket attachments | Public | Authenticated | Manager+ |

### Vietnamese Character Support

**Filename Sanitization:**
- Removes diacritics from Vietnamese characters:
  - `à, á, ả, ã, ạ, ă, ắ, ằ, ẳ, ẵ, ặ, â, ấ, ầ, ẩ, ẫ, ậ` → `a`
  - `đ` → `d`
  - `è, é, ẻ, ẽ, ẹ, ê, ế, ề, ể, ễ, ệ` → `e`
  - `ì, í, ỉ, ĩ, ị` → `i`
  - `ò, ó, ỏ, õ, ọ, ô, ố, ồ, ổ, ỗ, ộ, ơ, ớ, ờ, ở, ỡ, ợ` → `o`
  - `ù, ú, ủ, ũ, ụ, ư, ứ, ừ, ử, ữ, ự` → `u`
  - `ỳ, ý, ỷ, ỹ, ỵ` → `y`
- Replaces special characters with underscores
- Preserves file extensions
- Prevents filesystem compatibility issues

### Upload Features

**Image Upload to Tickets:**
- Multi-file selection support
- File type validation (images only)
- File size tracking
- Optional description/metadata
- Automatic storage path generation
- Linked via `service_ticket_attachments` table

**Attachment Management:**
- View list of all ticket attachments
- Preview images (if supported)
- Download original files
- Delete attachments (Manager+ only)

---

## Database Features

### Triggers

| Trigger | Table | Event | Action |
|---------|-------|-------|--------|
| `set_ticket_number` | `service_tickets` | INSERT | Generates unique ticket number (SV-YYYY-NNN) |
| `log_status_change` | `service_tickets` | UPDATE | Creates auto-comment when status changes |
| `update_updated_at_column` | All tables | UPDATE | Updates `updated_at` timestamp |

### Generated Columns

| Table | Column | Expression |
|-------|--------|------------|
| `service_tickets` | `total_cost` | `service_fee + diagnosis_fee + parts_total - discount_amount` |

### Indexes

**Service Tickets:**
- `ticket_number` (unique)
- `customer_id`
- `product_id`
- `status`
- `priority`
- `created_at`

**Customers:**
- `phone` (indexed)
- `email` (indexed)

**Parts:**
- `sku` (indexed)
- `part_number` (indexed)

**Comments:**
- `ticket_id`
- `created_at`
- Composite: `(ticket_id, created_at DESC)`

### Database Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `generate_ticket_number()` | Creates sequential ticket numbers per year | None (uses current year) |
| `decrease_part_stock()` | Atomic stock decrease with validation | `part_id UUID, quantity INTEGER` |
| `increase_part_stock()` | Atomic stock increase | `part_id UUID, quantity INTEGER` |
| `is_admin()` | Check if current user is Admin | None (uses `auth.uid()`) |
| `is_admin_or_manager()` | Check if user is Admin or Manager | None (uses `auth.uid()`) |
| `update_updated_at_column()` | Trigger function for timestamps | None |

### ENUMs & Custom Types

**user_role:**
- `admin`
- `manager`
- `technician`
- `reception`

**ticket_status:**
- `pending`
- `in_progress`
- `completed`
- `cancelled`

**priority_level:**
- `low`
- `normal`
- `high`
- `urgent`

**warranty_type:**
- `warranty` (under warranty)
- `paid` (out of warranty, customer pays)
- `goodwill` (free repair as gesture)

**comment_type:**
- `note` (manual comment)
- `status_change` (automated)
- `assignment` (technician change)
- `system` (system-generated)

### Database Views

**service_ticket_comments_with_author:**
- Joins `service_ticket_comments` with `profiles`
- Provides comment with author name and email
- Used for displaying comment history with user info

### Constraints

**Foreign Keys:**
- All relationships with cascade deletes where appropriate
- Prevents orphaned records

**Check Constraints:**
- Positive values (fees, prices, quantities > 0)
- Date logic (completed_at >= started_at)
- Valid enum values

**Unique Constraints:**
- Ticket numbers (per year)
- User emails
- Customer phones (optional)

---

## UI Components & Patterns

### Data Tables

**Features:**
- Sortable columns
- Inline action buttons (edit, delete)
- Role-based action visibility
- Real-time data via tRPC + React Query
- Loading states and skeletons
- Empty state placeholders

**Common Tables:**
- Tickets list with status badges
- Customers table with contact info
- Products catalog with brand relationships
- Parts inventory with stock levels
- Team members with role badges
- Employee performance table

### Forms

**Patterns:**

1. **Multi-Step Wizard** (Ticket Creation):
   - Step 1: Customer selection/creation
   - Step 2: Product selection
   - Step 3: Parts selection
   - Step 4: Service details (fees, warranty, priority)
   - Progress indicator
   - Back/Next navigation

2. **Inline Editing:**
   - Modal-based edit forms
   - Pre-filled current values
   - Real-time validation
   - Optimistic updates

3. **Searchable Dropdowns:**
   - Product selector with search
   - Parts selector with search
   - Customer phone lookup
   - Technician assignment picker

4. **Real-Time Validation:**
   - Zod schemas for all forms
   - Field-level error messages
   - Submit button disabled until valid

### Modals & Dialogs

**Quick Action Modals:**
- **Quick Comment:** Add note to ticket without page reload
- **Quick Image Upload:** Multi-file upload with preview
- **Edit Customer:** Update customer details
- **Edit Product/Part:** Update inventory items
- **Confirmation Dialogs:** Delete confirmations with warnings

**Dialog Features:**
- Overlay backdrop
- Keyboard shortcuts (ESC to close)
- Click outside to dismiss
- Accessibility (ARIA labels)

### Visual Feedback

**UI Elements:**

1. **Toast Notifications:**
   - Success messages (green)
   - Error messages (red)
   - Auto-dismiss after timeout
   - Action buttons (undo, retry)

2. **Loading States:**
   - Skeleton screens for tables
   - Spinner overlays for forms
   - Button loading indicators
   - Suspense boundaries

3. **Status Badges:**
   - Color-coded by status (pending=yellow, in_progress=blue, completed=green, cancelled=gray)
   - Priority indicators (urgent=red, high=orange, normal=blue, low=gray)
   - Role badges in team table

4. **Growth Indicators:**
   - Trending up icons (green) for positive growth
   - Trending down icons (red) for negative growth
   - Percentage change display
   - Color-coded metrics

5. **Empty States:**
   - Friendly messages ("No tickets yet")
   - Actionable prompts ("Create your first ticket")
   - Illustrations or icons

---

## Technical Implementation

### Architecture Stack

**Frontend:**
- Next.js 15.5.4 with App Router
- React 19.1.0
- TypeScript (strict mode)
- Turbopack (dev and build)
- Tailwind CSS 4 with shadcn/ui

**Backend:**
- tRPC 11.6.0 for API layer
- Supabase for PostgreSQL + Auth
- Server Components (RSC)
- Server Actions for mutations

**State Management:**
- TanStack Query (React Query) for server state
- React hooks for UI state
- URL state for filters/pagination
- Optimistic updates via tRPC

**Developer Tools:**
- Biome 2.2.0 (linting + formatting)
- TypeScript strict mode
- ESLint with Next.js config
- Git hooks (via Husky, optional)

### Type Safety

**End-to-End Types:**
1. Database schema → Supabase types (auto-generated)
2. tRPC routers → Client types (inferred)
3. Zod schemas → Runtime validation
4. TypeScript → Compile-time safety

**Pattern:**
```typescript
// Server (tRPC procedure)
input: z.object({ ticketId: z.string().uuid() })

// Client (automatic inference)
const { data } = trpc.tickets.getTicket.useQuery({ ticketId })
// data is fully typed based on server return type
```

### Server-Side Rendering

**Rendering Strategies:**
- **Server Components:** Default for all pages (no JavaScript sent to client)
- **Client Components:** Only when needed (`'use client'` directive)
  - Forms with interactivity
  - Modals and dialogs
  - Charts and visualizations
  - Real-time data subscriptions

**Performance Optimizations:**
- Streaming with `<Suspense>`
- Dynamic imports for heavy components
- Code splitting at route level
- Lazy loading of modals

### State Management Patterns

**Server State (TanStack Query + tRPC):**
- Automatic caching with stale-while-revalidate
- Background refetching
- Optimistic updates
- Error handling and retries
- 5-minute stale time for analytics data

**UI State (React Hooks):**
- `useState` for component-local state
- `useReducer` for complex state machines
- Context API for theme and user preferences

**URL State:**
- Search params for filters
- Route params for entity IDs
- Navigation with shallow routing

### Security Measures

**Database Security:**
- Row Level Security (RLS) on all tables
- Helper functions for role checks
- SQL injection prevention (parameterized queries)
- Schema hijacking prevention (`SET search_path = public, extensions`)

**API Security:**
- tRPC context validates authenticated user
- Service role client for server operations
- Input validation with Zod
- CSRF protection via Supabase Auth

**Authentication Security:**
- JWT tokens with short expiry
- Secure cookie storage (HttpOnly, SameSite)
- Automatic token refresh
- Session management

### Performance Optimizations

**Database:**
- Indexes on frequently queried columns
- Composite indexes for common joins
- Materialized views (if needed in future)
- Connection pooling via Supabase

**Application:**
- Server-side rendering (faster FCP)
- Code splitting per route
- Image optimization with Next.js `<Image>`
- Lazy loading of non-critical components

**Caching:**
- React Query cache (5 minutes for metrics)
- Browser cache for static assets
- Database query result caching (Supabase)

---

## Known Limitations

### Not Yet Implemented

**Reports Module:**
- `/report` page exists but has no functionality
- Placeholder message: "Reports Coming Soon"
- Future: PDF export, custom report builder

**Settings Pages:**
- `/setting` and `/app-setting` have basic structure
- Minimal functionality currently
- Future: Company settings, tax rates, email templates

**Notifications:**
- No real-time notification system
- No push notifications
- No email notifications
- Future: WebSocket notifications, email alerts for status changes

**Communication:**
- No email sending (SMTP integration)
- No SMS notifications
- Future: Email receipts, SMS updates

**Export & Print:**
- No data export (CSV, Excel, PDF)
- No invoice/ticket printing
- Future: Print-friendly ticket views, PDF invoices

**Search:**
- No global search across entities
- Limited filtering on list pages
- Future: Full-text search with Postgres `pg_trgm`

**Pagination:**
- No pagination on long lists (loads all records)
- Potential performance issue with large datasets
- Future: Cursor-based pagination with tRPC

**Advanced Features:**
- No bulk operations (bulk status updates, bulk delete)
- No recurring tickets or maintenance schedules
- No customer portal (self-service ticket tracking)
- No inventory alerts (low stock warnings)
- No audit log UI (database tracks changes, but no UI)

### Technical Debt

**Known Issues:**
- Some Server Components could be optimized with streaming
- Attachment storage paths hardcoded
- Limited error boundary coverage
- Some components could be extracted to shared UI library

**Future Improvements:**
- Implement React Suspense more comprehensively
- Add E2E tests with Playwright
- Set up CI/CD pipeline
- Add comprehensive error logging (Sentry, etc.)
- Implement feature flags for gradual rollouts

---

## Summary

The Service Center Management Application is a **production-ready, feature-rich system** with:

✅ **Robust ticket tracking** with automatic numbering and status enforcement
✅ **Inventory management** with automatic stock adjustments
✅ **Customer relationship management** with history tracking
✅ **Automated business logic** (cost calculations, auto-comments, triggers)
✅ **Comprehensive analytics** with real-time dashboard metrics
✅ **Role-based access control** at database, API, and UI levels
✅ **End-to-end type safety** via tRPC and TypeScript
✅ **Modern UI/UX** with responsive design and optimistic updates
✅ **Secure authentication** with Supabase Auth and session management
✅ **File handling** with Vietnamese character support

The application emphasizes **type safety, security, developer experience, performance, and user experience** while maintaining excellent code quality and architectural patterns.

---

**For technical details and development workflow, see:**
- `CLAUDE.md` - Development guide and architecture
- `docs/data/schemas/` - Database schema definitions
- `src/server/routers/` - tRPC API endpoints

**Document prepared by:** Sarah (Product Owner)
**Based on:** Codebase analysis as of 2025-10-22
