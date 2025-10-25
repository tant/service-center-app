# Administrator User Guide - Service Center Phase 2

**Version:** 1.0
**Last Updated:** 2025-10-24
**Audience:** System Administrators
**Access Level:** Full system access

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Task Template Management](#task-template-management)
4. [Warehouse System Setup](#warehouse-system-setup)
5. [Product and Inventory Management](#product-and-inventory-management)
6. [RMA Batch Operations](#rma-batch-operations)
7. [Email Notification Management](#email-notification-management)
8. [User Management](#user-management)
9. [System Configuration](#system-configuration)
10. [Reports and Analytics](#reports-and-analytics)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

### Overview
As a System Administrator, you have full access to all features of the Service Center system. This guide covers Phase 2 features including task workflow management, warehouse operations, and system configuration.

### Your Responsibilities
- Create and manage task templates for different service types
- Set up and configure warehouse locations
- Manage product catalog and inventory
- Oversee RMA operations
- Monitor email notifications
- Manage user accounts and permissions
- Configure system settings

### Key Phase 2 Features
- **Task Template System:** Define standardized workflows for different repair types
- **Warehouse Management:** Track product locations and stock movements
- **RMA Operations:** Manage bulk return merchandise authorizations
- **Email Notifications:** Automated customer communications
- **Public Service Portal:** Customer-facing request submission system

---

## Getting Started

### Accessing the System
1. Navigate to `http://localhost:3025` (or your production URL)
2. Click "Login"
3. Enter your admin credentials:
   - Email: `admin@example.com`
   - Password: (your admin password)

### Admin Dashboard
After login, you'll see the admin dashboard with:
- **Navigation Menu:** Access to all system sections
- **Quick Stats:** Active tickets, pending requests, low stock alerts
- **Recent Activity:** Latest system events
- **Action Buttons:** Quick access to common admin tasks

### Navigation Overview
- **Dashboard:** Home page with system overview
- **Tickets:** Service ticket management
- **Customers:** Customer database
- **Products:** Product catalog
- **Parts:** Parts inventory
- **Workflows/Templates:** Task template management
- **Warehouses:** Warehouse configuration
- **Team:** User management
- **Reports:** Analytics and reporting

---

## Task Template Management

### What are Task Templates?
Task templates define the sequence of tasks that technicians must complete for different service types (warranty, paid repair, replacement). Each template contains:
- Service type classification
- Ordered list of tasks
- Sequence enforcement mode (strict/flexible)
- Required vs. optional tasks

### Creating a New Task Template

**Step 1: Navigate to Templates**
1. Click "Workflows" in main menu
2. Select "Templates"
3. Click "+ New Template" button

**Step 2: Enter Template Details**
- **Template Name:** Descriptive name (e.g., "Laptop Screen Replacement")
- **Service Type:** Select one:
  - `Warranty` - Covered under warranty
  - `Paid` - Customer pays for service
  - `Replacement` - Product exchange
- **Description:** Optional detailed description
- **Product Type:** Optional - link to specific product category
- **Enforce Sequence:** Toggle on/off
  - **ON (Strict Mode):** Tasks must be completed in order
  - **OFF (Flexible Mode):** Tasks can be completed in any order (with warnings)

**Step 3: Add Tasks**
1. Click "+ Add Task" button
2. For each task:
   - **Task Type:** Select from predefined task types (e.g., "Diagnosis", "Screen Replacement")
   - **Sequence Order:** Number (1, 2, 3...)
   - **Required:** Check if task is mandatory
   - **Custom Instructions:** Optional specific notes for this template

**Example Task Sequence:**
```
1. Customer Check-in (Required)
2. Visual Inspection (Required)
3. Diagnosis (Required)
4. Screen Removal (Required)
5. Screen Replacement (Required)
6. Testing (Required)
7. Quality Check (Required)
8. Customer Notification (Required)
```

**Step 4: Save Template**
- Click "Save Template"
- Template becomes available for ticket creation
- Existing tickets with this template are NOT affected (see Template Switching)

### Managing Existing Templates

**Viewing Templates**
- Navigate to Workflows > Templates
- See list of all templates
- Filter by:
  - Service Type
  - Active/Inactive status
  - Product Type

**Editing Templates**
1. Click template name to open
2. Modify details or tasks
3. Click "Save Changes"
4. **Important:** Changes only affect NEW tickets

**Deactivating Templates**
- Click "..." menu on template
- Select "Deactivate"
- Template hidden from new ticket creation
- Existing tickets continue using it

**Best Practices:**
- Use clear, descriptive template names
- Start with strict sequence mode for critical workflows
- Document custom instructions clearly
- Review and update templates quarterly
- Keep 3-5 templates per service type maximum

---

## Warehouse System Setup

### Warehouse Types
The system includes three warehouse types:

**1. Physical Warehouses** (Customer locations)
- Main Warehouse
- Branch offices
- Custom locations

**2. Virtual Warehouses** (System-managed, auto-created)
- Đang sửa chữa (Under Repair)
- Đã sửa xong (Repaired)
- Chờ trả khách (Ready for Pickup)
- Lỗi không sửa được (Cannot Repair)
- Đã trả khách (Returned to Customer)

**3. Supplier Warehouses** (External)
- Supplier locations for RMA

### Creating a Physical Warehouse

**Step 1: Navigate to Warehouses**
1. Click "Warehouses" in main menu
2. Click "+ New Warehouse" button

**Step 2: Enter Warehouse Details**
- **Name:** Warehouse name (e.g., "Main Warehouse - HCM")
- **Type:** Select "physical"
- **Code:** Short code (e.g., "HCM-01")
- **Address:** Full address
- **Contact Person:** Manager name
- **Contact Phone:** Phone number
- **Is Active:** Checked by default

**Step 3: Save**
- Click "Create Warehouse"
- Warehouse immediately available for stock movements

### Managing Warehouse Locations

**Viewing Stock Levels**
1. Navigate to Dashboard > Inventory > Stock Levels
2. See materialized view of all product locations
3. Filter by:
   - Warehouse
   - Product
   - Low stock alerts

**Stock Movement Rules:**
- Products automatically move between virtual warehouses based on ticket status
- Manual movements recorded in stock_movements table
- All movements require reason and operator ID

**Automatic Product Movement (Phase 6):**
When ticket status changes, products automatically move:
- Ticket created → "Đang sửa chữa"
- Ticket completed → "Đã sửa xong"
- Delivery confirmed → "Đã trả khách"
- Ticket cancelled → Return to original location

---

## Product and Inventory Management

### Physical Product Master Data

**What is a Physical Product?**
- Individual tracked item (e.g., specific laptop with serial number)
- Always has a serial number
- Tracked across warehouses
- Linked to service tickets

**Registering a New Physical Product**
1. Navigate to Dashboard > Inventory > Products
2. Click "Register Product"
3. Enter details:
   - **Serial Number:** Must be unique
   - **Product (SKU):** Select from product catalog
   - **Condition:** new, used, refurbished
   - **Purchase Date:** Date acquired
   - **Warranty Start/End:** Optional warranty dates
   - **Current Warehouse:** Initial location
   - **Notes:** Optional notes

4. Click "Register"
5. Product now tracked in system

**Bulk Product Registration**
1. Click "Bulk Import"
2. Download CSV template
3. Fill in product data
4. Upload CSV
5. Review and confirm

### Viewing Product Location History
1. Navigate to product detail page
2. Scroll to "Movement History" section
3. See all warehouse transitions with:
   - Date/time
   - From/to warehouse
   - Reason
   - Operator

### Low Stock Alerts
**Setting Thresholds:**
1. Navigate to Parts inventory
2. Edit part
3. Set "Low Stock Threshold" (e.g., 10 units)
4. Save

**Monitoring Alerts:**
- Dashboard shows low stock count
- Navigate to Stock Levels page
- Filter by "Low Stock" to see items below threshold

---

## RMA Batch Operations

### What is an RMA Batch?
Return Merchandise Authorization (RMA) batches allow you to process multiple product returns to suppliers in one operation.

### Creating an RMA Batch

**Step 1: Navigate to RMA**
1. Go to Dashboard > Inventory > RMA
2. Click "+ New RMA Batch"

**Step 2: Enter Batch Details**
- **Supplier:** Select supplier warehouse
- **Reason:** e.g., "Defective products", "Warranty returns"
- **Notes:** Optional additional information

**Step 3: Add Products**
1. Click "+ Add Product"
2. For each product:
   - **Physical Product:** Select by serial number
   - **Reason:** Specific defect or issue
   - **Expected Resolution:** Replacement, Repair, Refund
3. Repeat for all products

**Step 4: Review and Create**
- Review product list
- RMA batch number auto-generated (RMA-YYYY-NNN)
- Click "Create Batch"
- Products moved to supplier warehouse

**Step 5: Track Status**
- View batch in RMA list
- Status: initiated, shipped, received_by_supplier, resolved
- Update status as batch progresses

### Managing RMA Batches

**Viewing Batches:**
- List shows all RMA batches
- Filter by:
  - Status
  - Supplier
  - Date range

**Updating Batch Status:**
1. Open batch
2. Click "Update Status"
3. Select new status
4. Add notes if needed
5. Save

**Completing RMA:**
1. When supplier resolves
2. Update status to "resolved"
3. Products automatically returned or marked

---

## Email Notification Management

### Email Notification System Overview
Automated emails sent to customers when ticket status changes. All emails logged to database.

### Viewing Email Logs
1. Navigate to Dashboard > Notifications
2. See all sent emails with:
   - Recipient
   - Subject
   - Status (pending, sent, failed)
   - Sent date
   - Template used

### Viewing Email Content
1. Find email in list
2. Click "View" button
3. Modal shows full email HTML

### Email Templates
Templates are hardcoded in system:
- Ticket Created
- Status Update
- Task Completed
- Delivery Ready
- Delivery Confirmed

### Managing Unsubscribes
**Viewing Unsubscribed Customers:**
1. Check customers table
2. Filter by `email_unsubscribed = true`

**Re-subscribing Customer:**
1. Edit customer record
2. Uncheck `email_unsubscribed`
3. Save
4. Customer receives emails again

### Troubleshooting Email Issues
**Email Not Sent:**
- Check email_notifications table for status
- Look for error messages
- Verify customer email address
- Check if customer unsubscribed

**Customer Not Receiving:**
- Ask customer to check spam folder
- Verify email address is correct
- Check unsubscribe status

---

## User Management

### User Roles
The system has 4 roles with different permissions:

| Role | Access Level | Key Permissions |
|------|--------------|-----------------|
| **Admin** | Full access | All features, template management, warehouse setup |
| **Manager** | Oversight | Dashboards, reports, approvals, read-only templates |
| **Technician** | Task execution | Task management, template switching, product handling |
| **Reception** | Customer service | Request management, ticket creation, customer management |

### Creating a New User

**Via Team Management:**
1. Navigate to "Team"
2. Click "+ Add Team Member"
3. Enter details:
   - **Full Name:** User's name
   - **Email:** Login email (must be unique)
   - **Role:** Select appropriate role
   - **Phone:** Optional contact number
4. Click "Create"
5. System sends invitation email with password setup link

### Managing Existing Users

**Editing User:**
1. Go to Team page
2. Click user name
3. Modify details
4. Save changes

**Deactivating User:**
1. Open user profile
2. Click "Deactivate"
3. Confirm action
4. User cannot log in (but data preserved)

**Changing User Role:**
1. Edit user
2. Change "Role" dropdown
3. Save
4. User permissions update immediately

### Best Practices
- Create unique accounts for each staff member
- Regularly review user list and deactivate former employees
- Use principle of least privilege (assign minimum necessary role)
- Document role assignments

---

## System Configuration

### Initial Setup Checklist
- [ ] Create admin account (via /setup)
- [ ] Add team members
- [ ] Create task templates (at least one per service type)
- [ ] Set up warehouses
- [ ] Import product catalog
- [ ] Import parts inventory
- [ ] Configure low stock thresholds
- [ ] Test email notifications
- [ ] Review RLS policies

### Database Management

**Running Migrations:**
```bash
pnpx supabase db reset
```

**Viewing Database:**
- Access Supabase Studio: http://localhost:54323
- Browse tables
- Run SQL queries
- View logs

**Backup Strategy:**
- Supabase handles backups automatically
- For production, configure backup schedule
- Test restore procedure regularly

### Environment Variables
Key environment variables (see `.env`):
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SETUP_PASSWORD=your_setup_password
```

**Never commit `.env` to version control!**

---

## Reports and Analytics

### Manager Dashboard Access
1. Navigate to Dashboard > Task Progress
2. View real-time metrics:
   - Active tickets
   - Tasks in progress
   - Blocked tasks
   - Average completion time

### Technician Workload
- See workload distribution table
- Monitor completion rates
- Identify bottlenecks

### Revenue Reports
1. Navigate to Reports
2. Select date range
3. View:
   - Total revenue
   - Revenue by service type
   - Top products/services
   - Customer lifetime value

### Exporting Data
**Via Supabase Studio:**
1. Open table
2. Select rows
3. Click "Export CSV"

**Via SQL Query:**
```sql
COPY (SELECT * FROM service_tickets WHERE created_at >= '2025-01-01')
TO '/tmp/tickets.csv' CSV HEADER;
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Cannot create task template
**Symptoms:** Error when saving template
**Solutions:**
- Verify at least one task is added
- Check task sequence numbers are unique and sequential
- Ensure service type is selected
- Check browser console for errors

#### Issue: Product not appearing in warehouse
**Symptoms:** Product registered but not in stock levels
**Solutions:**
- Verify product has valid serial number
- Check current_warehouse_id is set
- Refresh materialized view: `REFRESH MATERIALIZED VIEW v_warehouse_stock_levels;`
- Check stock_movements table for history

#### Issue: Emails not sending
**Symptoms:** Notifications show "pending" status
**Solutions:**
- Check email_notifications table for errors
- Verify customer email address
- Check if customer unsubscribed
- Review email service configuration

#### Issue: Template switching not working
**Symptoms:** Error when switching template mid-service
**Solutions:**
- Verify ticket is not completed/cancelled
- Check that all tasks are not completed
- Verify new template has different ID
- Ensure reason is at least 10 characters

#### Issue: RLS Policy Blocking Access
**Symptoms:** "Permission denied" errors
**Solutions:**
- Verify user role is correct
- Check RLS policies for table
- Ensure user is authenticated
- Review database logs in Supabase Studio

### Getting Additional Help

**Documentation:**
- Feature guides in `docs/phase2/features/`
- API documentation in `docs/phase2/api/`
- FAQ in `docs/phase2/faq.md`

**Technical Support:**
- Check troubleshooting guide: `docs/phase2/troubleshooting.md`
- Review system logs in Supabase Studio
- Contact development team

**Database Issues:**
- Access Supabase Studio: http://localhost:54323
- Check "Logs" tab for errors
- Review RLS policies in "Authentication" section

---

## Appendix

### Keyboard Shortcuts
- `Ctrl+K` or `Cmd+K` - Quick search (when available)
- `Esc` - Close modal dialogs
- `Enter` - Submit forms (when focused)

### Glossary
- **RLS:** Row Level Security - Database-level access control
- **tRPC:** Type-safe API framework used in system
- **SKU:** Stock Keeping Unit - Unique product identifier
- **RMA:** Return Merchandise Authorization
- **Materialized View:** Cached database query results

### Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-24 | Initial documentation for Phase 2 |

---

**Document End**
