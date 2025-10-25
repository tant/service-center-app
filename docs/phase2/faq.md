# Service Center Phase 2 - Frequently Asked Questions (FAQ)

**Version:** 1.0
**Last Updated:** 2025-10-24
**Related Features:** Task Workflow, Warehouse Management, RMA Operations, Public Portal, Email Notifications

---

## Table of Contents

1. [General Phase 2 Questions](#general-phase-2-questions)
2. [Task Workflow System](#task-workflow-system)
3. [Warehouse Management](#warehouse-management)
4. [RMA Operations](#rma-operations)
5. [Public Service Request Portal](#public-service-request-portal)
6. [Email Notifications](#email-notifications)
7. [User Management & Permissions](#user-management--permissions)
8. [Common "How Do I..." Questions](#common-how-do-i-questions)

---

## General Phase 2 Questions

### Q1: What is Service Center Phase 2?

**A:** Phase 2 is a major feature expansion that adds:
- Task workflow system for structured service execution
- Comprehensive warehouse management with serial number tracking
- RMA batch operations for supplier returns
- Public customer portal for service requests
- Automated email notification system
- Enhanced inventory tracking and stock alerts

### Q2: Do I need special training to use Phase 2 features?

**A:** Basic features are intuitive for existing users. However, managers should review:
- Task template creation workflows
- Warehouse stock threshold configuration
- RMA batch processes
- Staff training user guides are available in `/docs/phase2/user-guides/`

### Q3: Will Phase 2 affect my existing tickets and data?

**A:** No. All existing data remains intact. Phase 2 features are additive:
- Old tickets continue to work normally
- You can optionally add task workflows to new tickets
- Existing inventory can be migrated to the new warehouse system
- No data is lost or modified

### Q4: Can I use Phase 1 features without Phase 2?

**A:** Yes, absolutely. Phase 2 features are optional enhancements. You can:
- Continue using simple ticket workflows
- Skip task templates if not needed
- Use basic inventory without warehouse management
- All Phase 1 features remain fully functional

### Q5: Where can I find detailed documentation for Phase 2?

**A:** Documentation is organized in `/docs/phase2/`:
- Feature docs: `/docs/phase2/features/`
- User guides: `/docs/phase2/user-guides/`
- API reference: `/docs/phase2/api/`
- Quick reference: `/docs/phase2/quick-reference/`

---

## Task Workflow System

### Q6: What is a task template?

**A:** A task template is a predefined workflow that breaks down a service into individual steps. For example, "iPhone Screen Replacement" might include:
1. Receive Device
2. Initial Inspection
3. Remove Old Screen
4. Install New Screen
5. Quality Check
6. Return to Customer

### Q7: Do all tickets need a task template?

**A:** No. Task templates are optional. You can:
- Create tickets without templates (simple workflow)
- Add templates to tickets that need structure
- Switch templates mid-service if needed
- Mix templated and non-templated tickets

### Q8: What's the difference between strict and flexible enforcement modes?

**A:**
- **Strict mode:** Tasks must be completed in order. Task 2 is locked until Task 1 is done.
- **Flexible mode:** Tasks can be completed in any order, but you'll see warnings if completing out of sequence.
- Use strict mode for quality-critical workflows, flexible for experienced teams.

### Q9: Can I change a task template after creating it?

**A:** Yes, but it creates a new version:
- Old template becomes inactive
- New version is created with your changes
- Active tickets continue using their original template
- New tickets use the updated template
- This preserves historical data integrity

### Q10: What happens to tasks when I switch templates mid-service?

**A:** The system intelligently handles template switching:
- **Preserved:** Completed and in-progress tasks are kept
- **Removed:** Pending and blocked tasks from the old template are deleted
- **Added:** New tasks from the new template are added as pending
- Complete audit trail is maintained in `ticket_template_changes` table

### Q11: Can technicians skip tasks?

**A:**
- **Optional tasks:** Can be skipped (status changes to "skipped")
- **Required tasks:** Cannot be skipped in strict mode
- In flexible mode, required tasks can be completed out of order but not fully skipped
- Skipped tasks don't count toward progress completion

### Q12: Why can't I complete a task that's locked?

**A:** In strict enforcement mode, tasks are locked until prerequisites complete. Check:
- Are all previous tasks completed or skipped?
- Is the template using strict sequence enforcement?
- Does the task have unsatisfied dependencies?
- Use "flexible mode" if you need more freedom

### Q13: How do I track task progress across all tickets?

**A:** Navigate to **Dashboard → Task Progress** (`/dashboard/task-progress`) to see:
- Active tickets with in-progress tasks
- Blocked tasks requiring attention
- Technician workload distribution
- Average completion times
- Overall system metrics

### Q14: Can multiple technicians work on the same ticket's tasks?

**A:** Yes:
- Each task can be assigned to a specific technician
- Multiple technicians can work in parallel (flexible mode)
- Task history tracks who did what
- Best practice: assign related tasks to the same tech

### Q15: What's the minimum information required to complete a task?

**A:** To complete a task, you must provide:
- Completion notes (minimum 5 characters)
- All prerequisite tasks must be done (strict mode only)
- Task must be in "in_progress" status
- You must have permission to complete tasks

---

## Warehouse Management

### Q16: What's the difference between physical and virtual warehouses?

**A:**
- **Virtual warehouses:** System-defined categories (warranty_stock, rma_staging, dead_stock, in_service, parts). These classify products by purpose.
- **Physical warehouses:** User-defined storage locations (Main Warehouse, Repair Station 2, etc.). These represent actual places.
- Products have both: a virtual category AND a physical location

### Q17: Can I modify or delete virtual warehouses?

**A:** No. Virtual warehouses are system-defined and cannot be:
- Deleted
- Modified
- Renamed
- Created by users

They are core to the inventory management logic. You can only create/modify physical warehouses.

### Q18: How do serial numbers work?

**A:** Serial numbers are:
- Unique identifiers for each product instance
- Minimum 5 characters, alphanumeric (A-Z, 0-9, dash, underscore)
- Automatically converted to uppercase
- Must be globally unique in the system
- Format example: `IPHONE13-12345678`, `MAC-BOOK-PRO-2023-ABC123`

### Q19: What happens to products when a ticket is created?

**A:** When you add a serial number to a ticket:
1. System verifies product exists
2. Product automatically moves to "in_service" virtual warehouse
3. Stock movement is recorded
4. `current_ticket_id` is set
5. When ticket completes, product returns to original warehouse

This automation happens via database triggers - no manual action needed.

### Q20: How do I track warranty expiration?

**A:** Warranty tracking is automatic:
- Set `warranty_start_date` and `warranty_months` when registering product
- System auto-calculates `warranty_end_date`
- Warranty status: active, expiring_soon (< 30 days), expired, unknown
- Use **Dashboard → Stock Levels** to see warranty status
- View `v_warranty_expiring_soon` for products expiring soon

### Q21: Can I bulk import products?

**A:** Yes, bulk import supports:
- CSV/Excel format
- Up to 1,000 products per batch
- Required columns: serial_number, product_sku, condition, warehouse_type
- Optional columns: warranty info, purchase price, supplier
- Duplicate detection (within batch and against database)
- Partial success handling with error reporting

### Q22: What's the difference between product conditions?

**A:**
- **new:** Brand new, unused (warranty replacements)
- **refurbished:** Professionally restored (warranty stock)
- **used:** Previously used but functional (trade-ins)
- **faulty:** Not working properly (needs repair/RMA)
- **for_parts:** Non-functional (parts harvesting)

### Q23: How do stock level alerts work?

**A:** Stock alerts trigger when:
- Current quantity falls below minimum threshold
- Alert status: **OK** (above threshold), **Warning** (at/near threshold), **Critical** (below 50% of threshold)
- Configure thresholds per product + warehouse type
- Default thresholds for warranty_stock: minimum=5, reorder=10
- View alerts at **Dashboard → Inventory → Stock Levels**

### Q24: Why is my stock level not updating immediately?

**A:** Stock levels use a materialized view for performance:
- View refreshes automatically before each query
- Typical refresh time: < 500ms for 1000+ products
- Small delay (seconds) is normal
- For real-time accuracy, query `physical_products` directly

### Q25: Can I move products manually between warehouses?

**A:** Yes, use the "Record Movement" feature:
- Choose movement type (receipt, transfer, assignment, return, disposal)
- Select from/to locations (virtual and/or physical)
- Products in service cannot be moved (unless force flag)
- All movements are logged in immutable audit trail
- Movement history visible on product detail page

---

## RMA Operations

### Q26: What is an RMA batch?

**A:** RMA (Return Merchandise Authorization) batch is a group of defective products being returned to a supplier. It includes:
- Multiple products with same supplier
- Batch tracking number (RMA-YYYY-MM-NNN)
- Shipping information
- Status tracking through lifecycle
- Complete audit trail

### Q27: What's the RMA batch lifecycle?

**A:** RMA batches follow this flow:
```
draft → submitted → shipped → received_by_supplier → resolved
```
- **draft:** Products being gathered, can add/remove
- **submitted:** Finalized, ready to ship
- **shipped:** In transit to supplier
- **received_by_supplier:** Supplier confirmed receipt
- **resolved:** Process complete (replacement/credit received)

Status cannot move backwards.

### Q28: Can I add products to a finalized RMA batch?

**A:** No. Once a batch is finalized (status = submitted):
- Products are locked in
- No additions or removals allowed
- This ensures accurate tracking and prevents errors
- Create a new batch if you need to return more products

### Q29: What happens to products when added to RMA batch?

**A:** When you add a product to RMA batch:
1. Product automatically moves to "rma_staging" virtual warehouse
2. Stock movement recorded with type "rma_out"
3. Product's `rma_batch_id` is set
4. Current location tracked
5. Complete audit trail maintained

### Q30: How are RMA batch numbers generated?

**A:** Batch numbers follow format: **RMA-YYYY-MM-NNN**
- `RMA`: Fixed prefix
- `YYYY`: Four-digit year (2025)
- `MM`: Two-digit month (01-12)
- `NNN`: Three-digit sequence (001-999)
- Sequence resets monthly
- Auto-generated by database trigger
- Example: RMA-2025-10-001 (first batch in October 2025)

### Q31: Can I delete an RMA batch?

**A:**
- **Draft batches:** Can be deleted if empty
- **Finalized batches:** Should not be deleted (use status to close)
- Best practice: Change status to "resolved" instead of deleting
- Maintains historical records for audits

### Q32: What products should go in an RMA batch?

**A:** Include products that are:
- Defective or faulty (condition: faulty, for_parts)
- Within supplier warranty period
- From the same supplier
- Have similar defect patterns (optional but helpful)
- Properly documented with defect notes

### Q33: How do I track RMA batch progress?

**A:** Access RMA dashboard at **Dashboard → Inventory → RMA**:
- View all batches with status badges
- Filter by status (Draft, Submitted, Shipped, etc.)
- Click batch to see full details and product list
- Statistics cards show counts by status
- Export batch reports for supplier communication

---

## Public Service Request Portal

### Q34: Can customers access the system without login?

**A:** Yes, the public portal allows anonymous access for:
- Submitting warranty service requests
- Tracking request status by token
- Verifying product warranty
- No account creation required

Customers cannot access internal dashboards or staff features.

### Q35: How does warranty verification work?

**A:** Customer enters serial number:
- System checks `physical_products` table
- Returns product details (brand, model)
- Displays warranty status: active, expiring_soon, or expired
- Shows days remaining if warranty active
- Determines eligibility for service request
- No authentication required

### Q36: What is a tracking token?

**A:** Tracking token is a unique identifier for service requests:
- Format: **SR-XXXXXXXXXXXX** (12 random alphanumeric characters)
- Auto-generated when request is submitted
- Used to track request status without login
- Customer receives token immediately after submission
- Token included in all email notifications

### Q37: How long does it take for staff to review requests?

**A:** Target SLA is 24 hours, but actual time varies:
- Most requests reviewed within business day
- Status updates sent via email automatically
- Customer can track progress in real-time using token
- Urgent requests should include contact info for follow-up

### Q38: What happens when a request is rejected?

**A:** When staff rejects a request:
- Request status changes to "cancelled"
- Customer receives rejection email with reason
- Reason is provided by staff (minimum 10 characters)
- Customer can submit a new request if issue resolved
- Original request remains in system for audit

### Q39: Can customers update their service request after submission?

**A:** No, submitted requests cannot be edited by customers:
- Submit accurate information initially
- Contact staff via phone/email if changes needed
- Staff can add notes and update internally
- Prevents data tampering and maintains integrity

### Q40: How does request-to-ticket conversion work?

**A:** Staff converts approved requests to tickets:
- System checks for existing customer or creates new
- Product details pre-populated from request
- Service type selected by staff (warranty/paid)
- Initial comment added with request details
- Customer notified with both tracking token and ticket number
- Original request linked to ticket for reference

---

## Email Notifications

### Q41: What types of emails are sent automatically?

**A:** Six notification types cover the customer journey:
1. **request_submitted:** Immediate confirmation with tracking token
2. **request_received:** Staff has reviewed request
3. **request_rejected:** Request declined with reason
4. **ticket_created:** Service ticket created, work starting
5. **service_completed:** Service done, ready for pickup/delivery
6. **delivery_confirmed:** Product delivered to customer

### Q42: Can customers unsubscribe from emails?

**A:** Yes, customers have granular control:
- Each email type can be enabled/disabled individually
- Unsubscribe link in every email footer
- Preferences managed at `/unsubscribe` page
- Changes take effect immediately
- Can resubscribe anytime
- Some critical emails may still be sent (configurable)

### Q43: How do I know if an email was sent successfully?

**A:** Check **Dashboard → Notifications** to view:
- Email log with all sent notifications
- Status: pending, sent, failed, bounced
- Error messages for failed emails
- Retry count and history
- Filter by type, status, recipient
- Real-time statistics cards

### Q44: What happens if email delivery fails?

**A:** System automatically handles failures:
- Email logged with "failed" status
- Error message captured
- Automatic retry up to 3 times
- Exponential backoff between retries
- Manual retry available from admin dashboard
- Customer preferences checked before retry

### Q45: Is there a limit on email sending?

**A:** Yes, rate limits prevent spam:
- **Per customer:** 100 emails per 24 hours
- **System-wide:** Depends on email service configuration
- Rate limit checks before sending
- Exceeded limits logged with reason
- Admin can view rate limit violations

### Q46: Can I customize email templates?

**A:** Currently, templates are code-based:
- Located in `/src/lib/email-templates.ts`
- Require developer to modify
- Future enhancement: Admin UI for template editing
- All templates support Vietnamese language
- Mobile-responsive design
- Consistent branding across all emails

### Q47: Why did my customer not receive an email?

**A:** Check these common causes:
1. Customer unsubscribed from that email type
2. Rate limit exceeded (100/day)
3. Email service configuration error
4. Invalid email address format
5. Email went to spam folder
6. Network/connectivity issues

Review `email_notifications` table for specific error message.

---

## User Management & Permissions

### Q48: What roles can access Phase 2 features?

**A:** Role-based permissions:

| Feature | Admin | Manager | Technician | Reception |
|---------|-------|---------|------------|-----------|
| Task Templates | Create/Edit | Create/Edit | View | View |
| Execute Tasks | Yes | Yes | Yes | No |
| Warehouse Management | Full | Full | Add Products | View |
| RMA Batches | Full | Full | View | View |
| Service Requests | Review/Convert | Review/Convert | View | Review/Convert |
| Email Notifications | View Logs | View Logs | No | No |
| Task Progress Dashboard | Yes | Yes | No | No |

### Q49: Can technicians create task templates?

**A:** No, only Admin and Manager roles can:
- Create new templates
- Edit existing templates
- Delete templates
- Configure enforcement modes

Technicians can view templates and execute tasks but cannot modify workflows.

### Q50: What can Reception staff do with service requests?

**A:** Reception staff can:
- View pending service requests
- Review request details
- Accept requests (mark as received)
- Reject requests with reason
- Convert requests to tickets
- Assign priority and service type

They cannot: modify templates, access RMA batches, or view email logs.

---

## Common "How Do I..." Questions

### Q51: How do I create my first task template?

**A:**
1. Navigate to **Workflows → Templates** (`/workflows/templates`)
2. Click **"Create New Template"**
3. Fill in template name and details
4. Select service type (warranty/paid/replacement)
5. Choose enforcement mode (strict/flexible)
6. Add tasks from the task library
7. Set sequence order and required flags
8. Review and click **"Create Template"**

### Q52: How do I apply a template to a ticket?

**A:**
1. Create or edit a service ticket
2. Find the "Task Template" dropdown
3. Select template (filtered by service type)
4. System instantiates tasks automatically
5. Tasks appear in ticket detail view
6. Assigned technician sees tasks in "My Tasks"

### Q53: How do I register a new product in inventory?

**A:**
1. Navigate to **Dashboard → Inventory**
2. Click **"Register Product"**
3. Enter serial number (uppercase alphanumeric)
4. Select product from catalog
5. Choose condition (new, refurbished, etc.)
6. Select virtual warehouse type (usually warranty_stock)
7. Optionally add warranty info, purchase details
8. Upload photos (optional)
9. Click **"Register"**

### Q54: How do I set up low stock alerts?

**A:**
1. Go to **Dashboard → Inventory → Stock Levels**
2. Find the product you want to monitor
3. Click **"Set Threshold"** button
4. Enter minimum quantity (alert triggers when below this)
5. Enter reorder quantity (suggested reorder amount)
6. Enable alerts checkbox
7. Save settings
8. System monitors automatically

### Q55: How do I create an RMA batch for returns?

**A:**
1. Navigate to **Dashboard → Inventory → RMA**
2. Click **"Create RMA Batch"**
3. Enter supplier name
4. Optionally add shipping date and notes
5. Click **"Create"** (batch created in draft status)
6. Use "Add Products" to include items
7. Review product list
8. Click **"Finalize Batch"** when ready
9. Update status as batch progresses

### Q56: How do I switch a ticket's template mid-service?

**A:**
1. Open ticket detail page
2. Scroll to tasks section
3. Click **"Switch Template"** button
4. Select new template from dropdown
5. Enter reason for switch (minimum 10 characters)
6. Review preview showing:
   - Tasks to be preserved (completed/in-progress)
   - Tasks to be removed (pending/blocked)
   - Tasks to be added (from new template)
7. Confirm switch
8. System updates tasks and creates audit log

### Q57: How do I track products through the service lifecycle?

**A:**
1. Navigate to product detail page (from inventory)
2. View "Movement History" timeline showing:
   - All warehouse movements
   - Ticket associations
   - Who moved the product and when
   - Reasons and notes
3. Check "Current Location" section for:
   - Virtual warehouse (category)
   - Physical warehouse (location)
   - In-service status
   - Current ticket (if any)

### Q58: How do I view a customer's service request status?

**A:** As staff:
1. Go to **Dashboard → Service Requests**
2. Search by tracking token, name, or serial number
3. Click request to view full details
4. See timeline of status changes
5. Review product and customer information
6. Take action (accept, reject, convert to ticket)

As customer:
1. Visit `/service-request/track`
2. Enter tracking token
3. View status timeline and request details
4. Page auto-refreshes every 30 seconds

### Q59: How do I bulk import products?

**A:**
1. Prepare CSV file with columns:
   - serial_number (required)
   - product_sku (required)
   - condition (required)
   - warehouse_type (required)
   - warranty_start_date, warranty_months, purchase_price (optional)
2. Navigate to **Dashboard → Inventory**
3. Click **"Bulk Import"**
4. Upload CSV file
5. Review validation results
6. System processes successful imports
7. View error report for failed items
8. Fix errors and re-import failed items

### Q60: How do I monitor task workflow progress?

**A:**
1. Navigate to **Dashboard → Task Progress** (`/dashboard/task-progress`)
2. View metric cards:
   - Active tickets with tasks
   - Tasks in progress
   - Blocked tasks count
   - Average completion time
3. Check "Blocked Tasks Alert" for issues requiring attention
4. Review "Technician Workload" table to see:
   - Tasks per technician
   - Completion rates
   - Workload distribution
5. Click ticket numbers to navigate to details
6. Take action on blocked or delayed tasks

---

## Additional Resources

### Documentation Links

- **User Guides:** `/docs/phase2/user-guides/`
  - Admin Guide
  - Manager Guide
  - Technician Guide
  - Reception Guide

- **Feature Documentation:** `/docs/phase2/features/`
  - Task Workflow
  - Warehouse Management
  - RMA Operations
  - Public Portal
  - Email Notifications

- **API Reference:** `/docs/phase2/api/`
- **Quick Reference:** `/docs/phase2/quick-reference/`
- **Troubleshooting:** `/docs/phase2/troubleshooting.md`

### Support Contacts

- **Technical Issues:** Contact system administrator
- **Training Requests:** Contact manager
- **Feature Requests:** Submit via internal ticketing system
- **Bug Reports:** Use `/docs/BUG_REPORT_TEMPLATE.md`

### Version Information

- **Phase 2 Version:** 1.0
- **Release Date:** 2025-10-24
- **Last Updated:** 2025-10-24
- **Next Review:** 2025-11-24

---

**End of FAQ Document**
