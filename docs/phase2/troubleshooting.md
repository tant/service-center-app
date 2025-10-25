# Service Center Phase 2 - Troubleshooting Guide

**Version:** 1.0
**Last Updated:** 2025-10-24
**Purpose:** Diagnose and resolve common issues in Phase 2 features

---

## Table of Contents

1. [Task Workflow Issues](#task-workflow-issues)
2. [Warehouse Management Issues](#warehouse-management-issues)
3. [RMA Operations Issues](#rma-operations-issues)
4. [Public Portal Issues](#public-portal-issues)
5. [Email Notification Issues](#email-notification-issues)
6. [Database Issues](#database-issues)
7. [Authentication & Permission Errors](#authentication--permission-errors)
8. [Performance Issues](#performance-issues)
9. [UI Rendering Issues](#ui-rendering-issues)
10. [API & tRPC Errors](#api--trpc-errors)
11. [Browser Compatibility Issues](#browser-compatibility-issues)

---

## Task Workflow Issues

### Issue 1: Cannot Complete Task - Button Disabled

**Symptoms:**
- Complete task button is grayed out
- Lock icon displayed on task card
- Tooltip says "Prerequisites not completed"

**Possible Causes:**
1. Template uses strict sequence enforcement
2. Previous tasks not completed
3. Required predecessor tasks still pending
4. Task dependencies not satisfied

**Solutions:**

**Step 1: Check Template Enforcement Mode**
```sql
-- Query template enforcement setting
SELECT tt.enforce_sequence
FROM task_templates tt
JOIN service_tickets st ON st.template_id = tt.id
WHERE st.id = 'your-ticket-id';
```

If `enforce_sequence = true`, tasks must be completed in order.

**Step 2: Check Predecessor Tasks**
```sql
-- Find incomplete prerequisites
SELECT stt.name, stt.status, stt.sequence_order
FROM service_ticket_tasks stt
WHERE stt.ticket_id = 'your-ticket-id'
  AND stt.sequence_order < (
    SELECT sequence_order
    FROM service_ticket_tasks
    WHERE id = 'your-task-id'
  )
  AND stt.status NOT IN ('completed', 'skipped')
ORDER BY stt.sequence_order;
```

**Step 3: Resolution Options**

**Option A: Complete Prerequisites**
- Complete all previous tasks in sequence
- Skip optional tasks if applicable
- Verify each task transitions to completed status

**Option B: Switch to Flexible Mode**
If strict enforcement is too restrictive:
1. Edit the template (creates new version)
2. Set `enforce_sequence = false`
3. Apply new template to ticket (switch template)
4. Tasks now completable in any order

**Prevention:**
- Use flexible mode for experienced technicians
- Reserve strict mode for quality-critical workflows
- Design templates with minimal dependencies
- Group independent tasks together

---

### Issue 2: Template Switching Fails

**Symptoms:**
- Error message: "Cannot switch template"
- Template switch operation times out
- Tasks not updating after switch

**Possible Causes:**
1. Ticket in completed or cancelled status
2. New template same as current template
3. All tasks already completed
4. Insufficient permissions
5. Database constraint violation

**Solutions:**

**Step 1: Verify Ticket Status**
```sql
SELECT id, ticket_number, status, template_id
FROM service_tickets
WHERE id = 'your-ticket-id';
```

Ticket must have status: `pending` or `in_progress`

**Step 2: Check Template Difference**
Ensure new template ID differs from current `template_id`.

**Step 3: Verify Permissions**
User must have role: Admin, Manager, or Technician

**Step 4: Check Task States**
```sql
-- Count tasks by status
SELECT status, COUNT(*)
FROM service_ticket_tasks
WHERE ticket_id = 'your-ticket-id'
GROUP BY status;
```

If all tasks are completed, switching might not make sense.

**Step 5: Review Database Logs**
```sql
-- Check recent template changes
SELECT *
FROM ticket_template_changes
WHERE ticket_id = 'your-ticket-id'
ORDER BY created_at DESC
LIMIT 5;
```

**Prevention:**
- Switch templates early in service process
- Provide clear reason (minimum 10 characters)
- Verify new template is appropriate for service type
- Test template switching in staging environment first

---

### Issue 3: Tasks Not Appearing in "My Tasks"

**Symptoms:**
- Technician assigned but doesn't see tasks
- Empty "My Tasks" page despite active tickets
- Tasks visible in ticket detail but not in My Tasks

**Possible Causes:**
1. Tasks not assigned to technician
2. Tasks already completed or skipped
3. Caching issue in React Query
4. Authentication problem
5. Incorrect user profile

**Solutions:**

**Step 1: Verify Task Assignment**
```sql
SELECT stt.id, stt.name, stt.status, stt.assigned_to_id,
       prof.full_name AS assigned_to_name
FROM service_ticket_tasks stt
LEFT JOIN profiles prof ON stt.assigned_to_id = prof.id
WHERE stt.ticket_id = 'your-ticket-id'
  AND stt.status NOT IN ('completed', 'skipped');
```

Ensure `assigned_to_id` matches technician's profile ID.

**Step 2: Check User Authentication**
```typescript
// In browser console
console.log(await supabase.auth.getUser());
```

Verify user ID matches expected technician.

**Step 3: Clear React Query Cache**
```typescript
// In browser console
queryClient.invalidateQueries({ queryKey: ['workflow', 'myTasks'] });
```

Or hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

**Step 4: Verify Task Status Filter**
My Tasks page excludes:
- Completed tasks
- Skipped tasks
- Tasks assigned to other users

**Step 5: Reassign Tasks**
From ticket detail page:
1. Click task options menu
2. Select "Reassign Task"
3. Choose correct technician
4. Save changes

**Prevention:**
- Assign tasks during ticket creation
- Use ticket templates with default assignments
- Regularly review task assignments in progress dashboard
- Enable real-time notifications for task assignments (future)

---

### Issue 4: Task Completion Notes Rejected

**Symptoms:**
- Error: "Completion notes required"
- Cannot submit completion form
- Validation error message

**Possible Causes:**
1. Notes field empty or whitespace only
2. Notes less than 5 characters
3. Special characters causing validation issues
4. Network interruption during submission

**Solutions:**

**Step 1: Check Note Length**
Minimum requirement: **5 characters** (not including whitespace)

Bad examples:
- "" (empty)
- "OK" (2 chars)
- "Done" (4 chars)
- "     " (whitespace only)

Good examples:
- "Task completed successfully"
- "Replaced faulty component"
- "No issues found during inspection"

**Step 2: Validate Input**
```typescript
// Client-side validation
const notes = completionNotes.trim();
if (notes.length < 5) {
  throw new Error('Completion notes must be at least 5 characters');
}
```

**Step 3: Check for Special Characters**
Avoid problematic characters:
- Control characters (tabs, newlines in wrong place)
- Emoji-only notes (provide text description)
- SQL injection attempts (system sanitizes but be appropriate)

**Step 4: Retry Submission**
If network error:
1. Copy your notes to clipboard (Ctrl+C)
2. Refresh page
3. Paste notes back
4. Resubmit

**Prevention:**
- Provide detailed notes (aim for 50+ characters)
- Describe outcomes, not just actions
- Include findings, replacements, or observations
- Use structured format: "Action taken: [X]. Result: [Y]. Notes: [Z]."

---

### Issue 5: Task Progress Dashboard Not Updating

**Symptoms:**
- Metrics cards show stale data
- Technician workload doesn't reflect recent changes
- Blocked tasks count incorrect

**Possible Causes:**
1. Materialized view not refreshed
2. Caching at multiple layers
3. Database connection issues
4. Concurrent updates conflicting

**Solutions:**

**Step 1: Manual View Refresh**
```sql
-- Refresh materialized views
REFRESH MATERIALIZED VIEW v_task_progress_summary;
REFRESH MATERIALIZED VIEW v_tickets_with_blocked_tasks;
REFRESH MATERIALIZED VIEW v_technician_workload;
```

**Step 2: Check Last Refresh Time**
```sql
-- PostgreSQL (if tracking enabled)
SELECT schemaname, matviewname, last_refresh
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname LIKE 'v_%';
```

**Step 3: Clear Application Cache**
```typescript
// In browser console
queryClient.invalidateQueries({ queryKey: ['workflow', 'taskProgress'] });
queryClient.refetchQueries({ queryKey: ['workflow', 'taskProgress'] });
```

**Step 4: Verify Auto-Refresh Function**
```sql
-- Check if refresh function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'refresh_task_progress_views';
```

**Step 5: Hard Refresh Browser**
Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

**Prevention:**
- Dashboard auto-refreshes every 30 seconds
- Schedule periodic view refresh (cron job)
- Monitor database view performance
- Consider moving to real-time updates for critical metrics

---

## Warehouse Management Issues

### Issue 6: Serial Number Not Found

**Symptoms:**
- Error: "Serial number does not exist"
- Product not found during warranty verification
- Cannot add product to ticket

**Possible Causes:**
1. Serial number not registered in system
2. Typo in serial number entry
3. Case sensitivity issue
4. Product not yet synced from supplier

**Solutions:**

**Step 1: Verify Serial Format**
- Minimum 5 characters
- Alphanumeric only (A-Z, 0-9, dash, underscore)
- Automatically converted to uppercase
- No spaces or special characters

**Step 2: Search Database**
```sql
-- Exact match
SELECT id, serial_number, product_id, virtual_warehouse_type
FROM physical_products
WHERE serial_number = UPPER('ABC123456');

-- Partial match (if typo suspected)
SELECT id, serial_number, product_id
FROM physical_products
WHERE serial_number LIKE UPPER('%ABC123%');
```

**Step 3: Check Product Registration**
If product not found:
1. Navigate to **Dashboard → Inventory**
2. Click **"Register Product"**
3. Enter serial number and product details
4. Select warehouse type
5. Add warranty information if applicable
6. Submit registration

**Step 4: Bulk Import (Multiple Products)**
If many products need registration:
1. Prepare CSV with columns: serial_number, product_sku, condition, warehouse_type
2. Use **"Bulk Import"** feature
3. Review import results
4. Fix any validation errors

**Prevention:**
- Register products immediately upon receipt
- Use barcode scanner for accurate serial entry
- Standardize serial number formats
- Implement vendor serial sync (future enhancement)
- Maintain serial number naming conventions

---

### Issue 7: Product Stuck "In Service" Cannot Move

**Symptoms:**
- Cannot manually move product
- Error: "Product is currently in service"
- Product shows current_ticket_id set

**Possible Causes:**
1. Product assigned to active ticket
2. Ticket not properly closed
3. Automatic movement failed
4. Database trigger didn't fire

**Solutions:**

**Step 1: Check Current Ticket Status**
```sql
SELECT pp.serial_number,
       st.ticket_number,
       st.status AS ticket_status,
       pp.current_ticket_id,
       pp.virtual_warehouse_type
FROM physical_products pp
LEFT JOIN service_tickets st ON pp.current_ticket_id = st.id
WHERE pp.serial_number = 'YOUR_SERIAL';
```

**Step 2: Complete or Cancel Ticket**
If ticket is still active:
1. Navigate to ticket detail page
2. Complete all required tasks
3. Update ticket status to "completed"
4. System automatically moves product back

**Step 3: Manual Override (Admin Only)**
If ticket is orphaned or stuck:
```sql
-- WARNING: Only use if absolutely necessary
-- Clear ticket assignment
UPDATE physical_products
SET current_ticket_id = NULL,
    virtual_warehouse_type = 'warranty_stock'
WHERE serial_number = 'YOUR_SERIAL'
  AND current_ticket_id = 'orphaned-ticket-id';

-- Add manual movement record
INSERT INTO stock_movements (
  physical_product_id, movement_type,
  from_virtual_warehouse, to_virtual_warehouse,
  notes, moved_by_id
) VALUES (
  'product-id', 'return',
  'in_service', 'warranty_stock',
  'Manual correction - orphaned ticket', 'admin-user-id'
);
```

**Step 4: Verify Trigger Function**
```sql
-- Check if auto-movement trigger exists
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_move_product_on_ticket_event';
```

**Prevention:**
- Always properly close tickets (don't leave pending)
- Use "completed" or "cancelled" status, not orphaned states
- Monitor tickets with long in-progress duration
- Implement automated ticket cleanup for old pending tickets

---

### Issue 8: Stock Movement Not Recorded

**Symptoms:**
- Product location changed but no movement history
- Movement timeline shows gaps
- Audit trail incomplete

**Possible Causes:**
1. Manual database update bypassing triggers
2. Stock movement procedure not called
3. Permissions issue preventing insert
4. Transaction rollback due to error

**Solutions:**

**Step 1: Verify Movement Record Exists**
```sql
SELECT sm.id, sm.movement_type, sm.created_at,
       sm.from_virtual_warehouse, sm.to_virtual_warehouse,
       pp.serial_number
FROM stock_movements sm
JOIN physical_products pp ON sm.physical_product_id = pp.id
WHERE pp.serial_number = 'YOUR_SERIAL'
ORDER BY sm.created_at DESC
LIMIT 10;
```

**Step 2: Check Last Known Location**
```sql
-- Find last movement
SELECT movement_type, to_virtual_warehouse, created_at
FROM stock_movements
WHERE physical_product_id = 'product-id'
ORDER BY created_at DESC
LIMIT 1;
```

**Step 3: Manually Record Missing Movement**
```sql
-- Create correction movement record
INSERT INTO stock_movements (
  physical_product_id,
  movement_type,
  from_virtual_warehouse,
  to_virtual_warehouse,
  notes,
  moved_by_id,
  created_at
) VALUES (
  'product-id',
  'transfer',
  'previous-warehouse',
  'current-warehouse',
  'Manual correction - movement not recorded',
  auth.uid(),
  NOW()
);
```

**Step 4: Verify Current Product State**
```sql
-- Check product's current warehouse
SELECT serial_number, virtual_warehouse_type,
       physical_warehouse_id, current_ticket_id
FROM physical_products
WHERE id = 'product-id';
```

**Prevention:**
- Always use tRPC procedures for movements (not direct SQL)
- Use "Record Movement" UI feature
- Never manually UPDATE physical_products.virtual_warehouse_type
- Enable database audit logging
- Regularly review movement history for anomalies

---

### Issue 9: Low Stock Alerts Not Triggering

**Symptoms:**
- Stock below threshold but no alert
- Alert banner not displayed
- Email notifications not sent (future)

**Possible Causes:**
1. Threshold not configured for product
2. Alert disabled in configuration
3. Materialized view not refreshed
4. Stock level calculation incorrect

**Solutions:**

**Step 1: Check Threshold Configuration**
```sql
SELECT pst.product_id, p.name AS product_name,
       pst.warehouse_type, pst.minimum_quantity,
       pst.alert_enabled
FROM product_stock_thresholds pst
JOIN products p ON pst.product_id = p.id
WHERE p.id = 'your-product-id';
```

If no record found, threshold not set.

**Step 2: Set or Update Threshold**
1. Navigate to **Dashboard → Inventory → Stock Levels**
2. Find the product
3. Click **"Set Threshold"**
4. Enter minimum_quantity
5. Enable alerts checkbox
6. Save

**Step 3: Verify Alert Calculation**
```sql
-- Check current stock level vs threshold
SELECT
  p.name,
  pst.warehouse_type,
  COUNT(pp.id) AS current_stock,
  pst.minimum_quantity,
  CASE
    WHEN COUNT(pp.id) >= pst.minimum_quantity THEN 'OK'
    WHEN COUNT(pp.id) >= (pst.minimum_quantity * 0.5) THEN 'WARNING'
    ELSE 'CRITICAL'
  END AS alert_status
FROM products p
JOIN product_stock_thresholds pst ON pst.product_id = p.id
LEFT JOIN physical_products pp
  ON pp.product_id = p.id
  AND pp.virtual_warehouse_type = pst.warehouse_type
WHERE p.id = 'your-product-id'
GROUP BY p.id, p.name, pst.warehouse_type, pst.minimum_quantity;
```

**Step 4: Refresh Stock Levels View**
```sql
REFRESH MATERIALIZED VIEW v_warehouse_stock_levels;
```

Or use tRPC procedure:
```typescript
await trpc.inventory.getStockLevels.query({});
// Automatically refreshes view before querying
```

**Prevention:**
- Set thresholds for all critical products
- Review thresholds quarterly
- Base thresholds on historical usage
- Enable alerts by default
- Monitor alert response time

---

### Issue 10: Bulk Import Failing

**Symptoms:**
- CSV upload rejected
- Partial import with many errors
- Duplicate serial numbers detected

**Possible Causes:**
1. CSV format incorrect
2. Required columns missing
3. Invalid data in fields
4. Serial numbers already exist
5. Product SKUs not in catalog

**Solutions:**

**Step 1: Validate CSV Format**

**Required columns:**
- serial_number
- product_sku
- condition
- warehouse_type

**Optional columns:**
- warranty_start_date
- warranty_months
- purchase_price
- supplier_name

**Example CSV:**
```csv
serial_number,product_sku,condition,warehouse_type,warranty_start_date,warranty_months
IPHONE13-001,IP13-PRO-256,new,warranty_stock,2025-01-15,12
IPHONE13-002,IP13-PRO-256,new,warranty_stock,2025-01-15,12
```

**Step 2: Validate Data Types**
- serial_number: Alphanumeric, min 5 chars
- product_sku: Must exist in products table
- condition: One of: new, refurbished, used, faulty, for_parts
- warehouse_type: One of: warranty_stock, rma_staging, dead_stock, parts
- warranty_start_date: ISO format YYYY-MM-DD
- warranty_months: Positive integer

**Step 3: Check for Duplicates**

**Within CSV:**
```bash
# Check for duplicate serials in CSV
cut -d',' -f1 products.csv | sort | uniq -d
```

**Against Database:**
```sql
-- Create temporary table
CREATE TEMP TABLE temp_import (serial_number TEXT);

-- Load CSV (psql)
\copy temp_import FROM 'products.csv' WITH CSV HEADER;

-- Find existing serials
SELECT ti.serial_number
FROM temp_import ti
JOIN physical_products pp ON UPPER(ti.serial_number) = pp.serial_number;
```

**Step 4: Validate Product SKUs**
```sql
-- Check if all SKUs exist
SELECT DISTINCT product_sku
FROM temp_import
WHERE product_sku NOT IN (SELECT sku FROM products);
```

**Step 5: Import in Batches**
If CSV is large (>1000 rows):
1. Split into smaller files (100-200 rows each)
2. Import each batch separately
3. Review errors after each batch
4. Fix issues before next batch

**Prevention:**
- Use provided CSV template
- Validate data before upload
- Test with small batch first (10-20 rows)
- Remove duplicates before import
- Ensure product catalog is up to date

---

## RMA Operations Issues

### Issue 11: Cannot Finalize RMA Batch

**Symptoms:**
- Error: "Cannot finalize batch"
- Finalize button disabled or grayed out
- Validation error message

**Possible Causes:**
1. Batch has no products
2. Batch already finalized
3. Insufficient permissions
4. Database constraint violation

**Solutions:**

**Step 1: Verify Product Count**
```sql
SELECT rb.batch_number, rb.status,
       COUNT(pp.id) AS product_count
FROM rma_batches rb
LEFT JOIN physical_products pp ON pp.rma_batch_id = rb.id
WHERE rb.id = 'batch-id'
GROUP BY rb.id, rb.batch_number, rb.status;
```

Batch must have at least **1 product**.

**Step 2: Check Current Status**
```sql
SELECT batch_number, status
FROM rma_batches
WHERE id = 'batch-id';
```

Status must be **'draft'**. Cannot finalize if:
- Already submitted
- Already shipped
- Already completed

**Step 3: Verify User Permissions**
User must have role: **Admin** or **Manager**

**Step 4: Add Products if Empty**
1. Navigate to batch detail page
2. Click **"Add Products"**
3. Search by serial number or select from list
4. Add at least one product
5. Try finalizing again

**Step 5: Check Database Constraints**
```sql
-- Verify products actually linked to batch
SELECT pp.serial_number, pp.rma_batch_id
FROM physical_products pp
WHERE pp.rma_batch_id = 'batch-id';
```

**Prevention:**
- Add products immediately after creating batch
- Don't create empty batches
- Group 3-20 products per batch (optimal)
- Review batch contents before finalizing
- Implement pre-finalization checklist

---

### Issue 12: RMA Batch Number Not Generated

**Symptoms:**
- Batch created but batch_number is NULL
- Error: "Batch number generation failed"
- Duplicate batch numbers

**Possible Causes:**
1. Database trigger not functioning
2. Concurrent batch creation conflict
3. Date/time function issues
4. Sequence counter overflow (unlikely)

**Solutions:**

**Step 1: Verify Trigger Exists**
```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_generate_rma_batch_number'
  AND event_object_table = 'rma_batches';
```

**Step 2: Check Trigger Function**
```sql
-- Verify function exists
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'generate_rma_batch_number';
```

**Step 3: Manual Batch Number Generation**
If trigger failed, manually assign:
```sql
-- Find next sequence number for current month
WITH current_month AS (
  SELECT TO_CHAR(NOW(), 'YYYY-MM') AS ym
),
max_seq AS (
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(batch_number FROM 13 FOR 3) AS INT)
  ), 0) AS max_num
  FROM rma_batches
  WHERE batch_number ~ '^RMA-[0-9]{4}-[0-9]{2}-[0-9]{3}$'
    AND SUBSTRING(batch_number FROM 5 FOR 7) = (SELECT ym FROM current_month)
)
UPDATE rma_batches
SET batch_number = 'RMA-' || TO_CHAR(NOW(), 'YYYY-MM') || '-' ||
                   LPAD((SELECT max_num + 1 FROM max_seq)::TEXT, 3, '0')
WHERE id = 'batch-id'
  AND batch_number IS NULL;
```

**Step 4: Recreate Trigger (Admin Only)**
```sql
-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_generate_rma_batch_number ON rma_batches;

CREATE TRIGGER trigger_generate_rma_batch_number
  BEFORE INSERT ON rma_batches
  FOR EACH ROW
  WHEN (NEW.batch_number IS NULL)
  EXECUTE FUNCTION generate_rma_batch_number();
```

**Prevention:**
- Monitor trigger execution logs
- Test batch creation in staging before production
- Implement batch number validation
- Add alerting for NULL batch numbers
- Regular database maintenance checks

---

### Issue 13: Products Not Moving to RMA Staging

**Symptoms:**
- Product added to batch but warehouse type unchanged
- Product still shows original warehouse location
- Stock movement not recorded

**Possible Causes:**
1. Warehouse type update failed
2. Stock movement transaction rolled back
3. Permissions issue
4. Database constraint violation

**Solutions:**

**Step 1: Verify Product's Current Warehouse**
```sql
SELECT pp.serial_number, pp.virtual_warehouse_type,
       pp.rma_batch_id, rb.batch_number
FROM physical_products pp
LEFT JOIN rma_batches rb ON pp.rma_batch_id = rb.id
WHERE pp.id = 'product-id';
```

Expected: `virtual_warehouse_type = 'rma_staging'`

**Step 2: Check Stock Movement Record**
```sql
SELECT sm.movement_type, sm.from_virtual_warehouse,
       sm.to_virtual_warehouse, sm.created_at
FROM stock_movements sm
WHERE sm.physical_product_id = 'product-id'
ORDER BY sm.created_at DESC
LIMIT 5;
```

Should show movement to 'rma_staging'.

**Step 3: Manually Move Product**
If automatic movement failed:
```sql
BEGIN;

-- Update product warehouse
UPDATE physical_products
SET virtual_warehouse_type = 'rma_staging',
    rma_batch_id = 'batch-id'
WHERE id = 'product-id';

-- Record movement
INSERT INTO stock_movements (
  physical_product_id, movement_type,
  from_virtual_warehouse, to_virtual_warehouse,
  notes, moved_by_id
) VALUES (
  'product-id', 'transfer',
  (SELECT virtual_warehouse_type FROM physical_products WHERE id = 'product-id'),
  'rma_staging',
  'Manual correction - added to RMA batch RMA-2025-10-001',
  auth.uid()
);

COMMIT;
```

**Step 4: Retry via tRPC Procedure**
Use proper API instead of direct SQL:
```typescript
await trpc.inventory.addProductsToRMA.mutate({
  batch_id: 'batch-id',
  product_ids: ['product-id']
});
```

**Prevention:**
- Use tRPC API procedures (not direct database updates)
- Verify product not in service before adding to RMA
- Check product condition is appropriate (faulty, for_parts)
- Monitor RMA batch operations for errors

---

## Public Portal Issues

### Issue 14: Tracking Token Not Working

**Symptoms:**
- Error: "Request not found"
- Invalid tracking token message
- Token search returns no results

**Possible Causes:**
1. Token format incorrect (typos)
2. Request not yet created in database
3. Token case sensitivity
4. Database indexing issue

**Solutions:**

**Step 1: Verify Token Format**
Format: **SR-XXXXXXXXXXXX** (SR- followed by 12 alphanumeric characters)

Examples:
- Valid: SR-A8K3N9P2X7Q5
- Invalid: SRA8K3N9P2X7Q5 (missing dash)
- Invalid: SR-A8K3N9P2X7 (too short)
- Invalid: sr-a8k3n9p2x7q5 (lowercase - may need uppercase)

**Step 2: Search Database**
```sql
-- Exact match
SELECT id, tracking_token, customer_name, status
FROM service_requests
WHERE tracking_token = 'SR-A8K3N9P2X7Q5';

-- Case-insensitive search
SELECT id, tracking_token, customer_name, status
FROM service_requests
WHERE UPPER(tracking_token) = UPPER('sr-a8k3n9p2x7q5');
```

**Step 3: Verify Token Generation**
Check if trigger is working:
```sql
-- Recent requests with tokens
SELECT id, tracking_token, customer_email, created_at
FROM service_requests
ORDER BY created_at DESC
LIMIT 10;
```

If tracking_token is NULL, trigger failed.

**Step 4: Manually Generate Token (Admin Only)**
```sql
-- Generate token for request with NULL token
UPDATE service_requests
SET tracking_token = 'SR-' || UPPER(
  SUBSTR(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 12)
)
WHERE id = 'request-id'
  AND tracking_token IS NULL;
```

**Prevention:**
- Display token prominently after submission
- Email token to customer immediately
- Allow customers to bookmark tracking URL
- Implement "resend token" feature via email
- Add token to all email notifications

---

### Issue 15: Warranty Verification Failing

**Symptoms:**
- Serial number entered but "not found"
- Warranty check returns error
- Product exists but verification fails

**Possible Causes:**
1. Serial not registered in physical_products
2. Case sensitivity mismatch
3. Typo in serial number
4. Product deleted or inactive

**Solutions:**

**Step 1: Verify Serial Exists**
```sql
SELECT pp.serial_number, p.name AS product_name,
       pp.warranty_start_date, pp.warranty_end_date,
       pp.virtual_warehouse_type
FROM physical_products pp
JOIN products p ON pp.product_id = p.id
WHERE pp.serial_number = UPPER('ABC123456');
```

**Step 2: Check Warranty Calculation**
```sql
-- Verify warranty status calculation
SELECT
  serial_number,
  warranty_start_date,
  warranty_months,
  warranty_end_date,
  CASE
    WHEN warranty_end_date IS NULL THEN 'unknown'
    WHEN warranty_end_date <= CURRENT_DATE THEN 'expired'
    WHEN warranty_end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'active'
  END AS warranty_status,
  warranty_end_date - CURRENT_DATE AS days_remaining
FROM physical_products
WHERE serial_number = UPPER('ABC123456');
```

**Step 3: Register Product if Missing**
If product not found:
1. Register product in inventory
2. Set warranty_start_date and warranty_months
3. System auto-calculates warranty_end_date
4. Retry verification

**Step 4: Check API Response**
```typescript
// Browser console (public portal)
const result = await fetch('/api/trpc/serviceRequest.verifyWarranty', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    json: { serial_number: 'ABC123456' }
  })
});
console.log(await result.json());
```

**Prevention:**
- Register all products before customer service
- Use barcode scanner for accurate serial entry
- Implement vendor serial number sync
- Validate serial format on registration
- Display helpful error messages to customers

---

### Issue 16: Service Request Submission Blocked by Spam Protection

**Symptoms:**
- Error: "Invalid submission detected"
- Form submission fails without clear error
- Honeypot field triggered

**Possible Causes:**
1. Browser auto-fill filled honeypot field
2. Bot attempted submission
3. JavaScript disabled (honeypot field visible)
4. Form pre-fill extension interference

**Solutions:**

**Step 1: Check Honeypot Field**
```html
<!-- Honeypot field in form -->
<input
  type="text"
  name="website"
  tabIndex="-1"
  autoComplete="off"
  style="position: absolute; left: -9999px;"
/>
```

This field must remain **empty**. If filled, submission is rejected.

**Step 2: Verify Form Submission Data**
```typescript
// In browser console (before submission)
const formData = new FormData(document.querySelector('form'));
console.log('Honeypot field value:', formData.get('website'));
// Should be empty string or null
```

**Step 3: Disable Browser Auto-Fill**
1. Click browser address bar
2. Go to Settings → Auto-fill
3. Disable "Auto-fill forms"
4. Clear saved form data
5. Retry submission

**Step 4: Check for Extensions**
Disable form-filling extensions:
- LastPass
- 1Password
- Browser built-in password manager
- Any form auto-fill extensions

**Step 5: Test in Incognito Mode**
1. Open incognito/private browsing window
2. Navigate to service request portal
3. Submit request
4. Should work without extensions interfering

**Prevention:**
- Add `autocomplete="off"` to honeypot field
- Use more sophisticated bot detection (future)
- Implement rate limiting per IP
- Add CAPTCHA for suspicious patterns
- Monitor submission error rates

---

## Email Notification Issues

### Issue 17: Emails Not Being Sent

**Symptoms:**
- No email received by customer
- Email log shows "pending" status
- Notification expected but not delivered

**Possible Causes:**
1. Email service not configured
2. Customer unsubscribed from email type
3. Rate limit exceeded
4. Invalid email address
5. SMTP connection failure

**Solutions:**

**Step 1: Check Email Log**
```sql
SELECT id, email_type, recipient_email, status,
       sent_at, error_message, retry_count
FROM email_notifications
WHERE recipient_email = 'customer@example.com'
ORDER BY created_at DESC
LIMIT 10;
```

**Step 2: Verify Email Preferences**
```sql
SELECT email, email_preferences
FROM customers
WHERE email = 'customer@example.com';
```

If `email_preferences['request_submitted'] = false`, emails won't send.

**Step 3: Check Rate Limit**
```sql
-- Count emails sent in last 24 hours
SELECT COUNT(*)
FROM email_notifications
WHERE recipient_email = 'customer@example.com'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

Limit: **100 emails per 24 hours**

**Step 4: Retry Failed Email**
From **Dashboard → Notifications**:
1. Find failed email
2. Click "Retry" button
3. Check error message if fails again

Or via tRPC:
```typescript
await trpc.notifications.retry.mutate({
  emailId: 'email-id'
});
```

**Step 5: Check Email Service Configuration**
```bash
# Environment variables
echo $SMTP_HOST
echo $SMTP_PORT
echo $SMTP_USER
# Should be configured
```

**Prevention:**
- Monitor email delivery rates daily
- Set up SMTP monitoring/alerting
- Maintain clean recipient lists
- Implement email validation
- Use verified sending domain (SPF/DKIM/DMARC)

---

### Issue 18: Emails Going to Spam

**Symptoms:**
- Emails sent successfully but in spam folder
- Customers not seeing notifications
- Low open rates

**Possible Causes:**
1. SPF/DKIM/DMARC not configured
2. Poor email reputation
3. Spam trigger words in content
4. No unsubscribe link
5. Suspicious sending patterns

**Solutions:**

**Step 1: Verify DNS Records**
```bash
# Check SPF record
dig TXT sstc.vn | grep spf

# Check DKIM record
dig TXT default._domainkey.sstc.vn

# Check DMARC record
dig TXT _dmarc.sstc.vn
```

**Step 2: Test Email Authentication**
Send test email to: check-auth@verifier.port25.com
Review authentication results in reply.

**Step 3: Review Email Content**
Avoid spam triggers:
- ❌ ALL CAPS SUBJECT LINES
- ❌ Excessive exclamation marks!!!
- ❌ Words like "free", "winner", "urgent"
- ✅ Professional, clear subject lines
- ✅ Proper HTML formatting
- ✅ Plain text alternative

**Step 4: Verify Unsubscribe Link**
Every email must have unsubscribe link in footer:
```html
<a href="https://service.sstc.vn/unsubscribe?email={{email}}&type={{type}}">
  Hủy đăng ký
</a>
```

**Step 5: Warm Up Sending Domain**
If new domain:
- Start with low volume (50-100/day)
- Gradually increase over 2-4 weeks
- Monitor bounce rates
- Maintain consistent sending schedule

**Prevention:**
- Use authenticated sending domain
- Maintain email list hygiene
- Remove hard bounces immediately
- Monitor spam complaint rates
- Follow email best practices (CAN-SPAM, GDPR)

---

### Issue 19: Email Template Variables Not Rendering

**Symptoms:**
- Email shows {{customerName}} instead of actual name
- Variables appear as literal text
- Missing personalization data

**Possible Causes:**
1. Template rendering function error
2. Context data missing required fields
3. Template syntax error
4. Variable name mismatch

**Solutions:**

**Step 1: Verify Template Context**
```typescript
// Check context data passed to template
console.log(emailContext);
// Should include all required variables
```

**Step 2: Check Template Function**
```typescript
// In /src/lib/email-templates.ts
import { getEmailTemplate } from '@/lib/email-templates';

const { html, text, subject } = getEmailTemplate('request_submitted', {
  customerName: 'Test Customer',
  trackingToken: 'SR-TEST123456',
  productName: 'iPhone 13',
  unsubscribeUrl: 'https://...'
});

console.log(html); // Should show rendered values
```

**Step 3: Validate Required Variables**
Each template requires specific variables:
- request_submitted: customerName, trackingToken, productName
- ticket_created: customerName, ticketNumber, productName
- service_completed: customerName, ticketNumber, completedDate

**Step 4: Check Database Record**
```sql
SELECT context
FROM email_notifications
WHERE id = 'email-id';
```

Verify context JSONB contains all required fields.

**Step 5: Test Template Rendering**
```typescript
// Unit test
describe('Email Templates', () => {
  it('should render customer name', () => {
    const { html } = getEmailTemplate('request_submitted', {
      customerName: 'John Doe',
      // ... other required fields
    });
    expect(html).toContain('John Doe');
    expect(html).not.toContain('{{customerName}}');
  });
});
```

**Prevention:**
- Validate context data before calling template function
- Use TypeScript types for template context
- Add required field checks
- Test templates with various data scenarios
- Implement template preview feature

---

## Database Issues

### Issue 20: Foreign Key Constraint Violation

**Symptoms:**
- Error: "violates foreign key constraint"
- Cannot delete record
- Cannot update relationship

**Possible Causes:**
1. Attempting to delete referenced record
2. Invalid UUID reference
3. Orphaned records
4. Cascade delete not configured

**Solutions:**

**Step 1: Identify Constraint**
```sql
-- Find constraint details
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'your_table_name';
```

**Step 2: Find Dependent Records**
Example: Cannot delete product because physical_products reference it
```sql
-- Find physical products using this product
SELECT pp.id, pp.serial_number
FROM physical_products pp
WHERE pp.product_id = 'product-id-to-delete';
```

**Step 3: Handle Dependencies**

**Option A: Delete Dependents First**
```sql
-- Delete in correct order
DELETE FROM service_ticket_tasks WHERE ticket_id = 'ticket-id';
DELETE FROM service_ticket_comments WHERE ticket_id = 'ticket-id';
DELETE FROM service_tickets WHERE id = 'ticket-id';
```

**Option B: Use CASCADE (if configured)**
```sql
-- Check if cascade enabled
SELECT confdeltype
FROM pg_constraint
WHERE conname = 'constraint_name';
-- 'c' = CASCADE, 'r' = RESTRICT
```

**Option C: Soft Delete**
Instead of deleting, mark as inactive:
```sql
UPDATE products
SET is_active = false,
    deleted_at = NOW()
WHERE id = 'product-id';
```

**Prevention:**
- Use soft deletes for important entities
- Configure cascade deletes appropriately
- Implement "can delete" checks in UI
- Show dependent record counts before delete
- Use database constraints wisely

---

### Issue 21: Trigger Not Firing

**Symptoms:**
- Expected automatic action doesn't occur
- Calculated fields not updating
- Audit trail missing entries

**Possible Causes:**
1. Trigger disabled or dropped
2. Trigger condition not met
3. Trigger function has error
4. Transaction rolled back

**Solutions:**

**Step 1: Verify Trigger Exists**
```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'service_tickets'
ORDER BY trigger_name;
```

**Step 2: Check Trigger Status**
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'service_tickets'::regclass;
-- tgenabled: 'O' = Enabled, 'D' = Disabled
```

**Step 3: Test Trigger Function**
```sql
-- Manually execute trigger function
SELECT auto_move_product_on_ticket_event()
FROM service_tickets
WHERE id = 'ticket-id';
```

**Step 4: Check Trigger Conditions**
Example: Product movement trigger
```sql
-- Verify conditions met
SELECT id, serial_number, status
FROM service_tickets
WHERE id = 'ticket-id';
-- serial_number must be NOT NULL
-- status must be in expected values
```

**Step 5: Review Function Logs**
```sql
-- Enable logging (development)
SET client_min_messages = 'NOTICE';

-- Perform action that should trigger function
UPDATE service_tickets
SET status = 'completed'
WHERE id = 'ticket-id';

-- Check server logs for errors
```

**Step 6: Recreate Trigger**
```sql
-- Drop and recreate
DROP TRIGGER IF EXISTS trigger_name ON table_name;
CREATE TRIGGER trigger_name
  AFTER UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION function_name();
```

**Prevention:**
- Test triggers in development first
- Add error handling to trigger functions
- Use RAISE NOTICE for debugging
- Document trigger logic clearly
- Monitor trigger execution (pg_stat_user_functions)

---

### Issue 22: Slow Database Queries

**Symptoms:**
- Page loading takes 5+ seconds
- Queries timing out
- High CPU usage on database
- Application feels sluggish

**Possible Causes:**
1. Missing indexes
2. Inefficient query patterns
3. N+1 query problem
4. Large result sets without pagination
5. Materialized views not refreshed

**Solutions:**

**Step 1: Identify Slow Queries**
```sql
-- Enable slow query logging (PostgreSQL)
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
SELECT pg_reload_conf();

-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Step 2: Analyze Query Plan**
```sql
EXPLAIN ANALYZE
SELECT pp.serial_number, p.name, pp.virtual_warehouse_type
FROM physical_products pp
JOIN products p ON pp.product_id = p.id
WHERE pp.virtual_warehouse_type = 'warranty_stock';
```

Look for:
- Sequential Scans (should be Index Scans)
- High cost numbers
- Nested Loop joins with large sets

**Step 3: Add Missing Indexes**
```sql
-- Example: Index on foreign key
CREATE INDEX idx_physical_products_product_id
  ON physical_products(product_id);

-- Example: Composite index for common filter
CREATE INDEX idx_tickets_status_created
  ON service_tickets(status, created_at DESC)
  WHERE status IN ('pending', 'in_progress');
```

**Step 4: Optimize Queries**

**Bad (N+1):**
```typescript
// Fetches tickets, then products one-by-one
const tickets = await db.from('service_tickets').select('*');
for (const ticket of tickets) {
  const product = await db.from('products')
    .select('*')
    .eq('id', ticket.product_id)
    .single();
}
```

**Good (Single Query):**
```typescript
const tickets = await db
  .from('service_tickets')
  .select('*, products(*)')
  .limit(50);
```

**Step 5: Use Pagination**
```typescript
// Always paginate large lists
const { data, count } = await db
  .from('service_tickets')
  .select('*', { count: 'exact' })
  .range(0, 49) // First 50 records
  .order('created_at', { ascending: false });
```

**Prevention:**
- Index all foreign keys
- Use pagination on all list views
- Avoid SELECT * (select only needed columns)
- Use materialized views for complex aggregations
- Monitor query performance regularly
- Use connection pooling

---

## Authentication & Permission Errors

### Issue 23: "Forbidden" Error When Accessing Features

**Symptoms:**
- Error: "Access denied"
- HTTP 403 Forbidden
- "Insufficient permissions" message

**Possible Causes:**
1. User lacks required role
2. RLS policy blocking access
3. Session expired
4. User profile not properly configured

**Solutions:**

**Step 1: Verify User Role**
```sql
SELECT id, email, role, is_active
FROM profiles
WHERE id = auth.uid();
```

**Step 2: Check Required Permission**
Feature-specific requirements:

| Feature | Required Roles |
|---------|---------------|
| Task Templates | Admin, Manager |
| RMA Batches | Admin, Manager |
| Email Logs | Admin, Manager |
| Task Progress Dashboard | Admin, Manager |
| Service Request Review | Admin, Manager, Reception |

**Step 3: Verify RLS Policies**
```sql
-- Check policies on table
SELECT schemaname, tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'rma_batches';
```

**Step 4: Test Authentication**
```typescript
// In browser console
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);
console.log('Email:', user?.email);

// Get profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user?.id)
  .single();
console.log('Role:', profile?.role);
```

**Step 5: Refresh Session**
```typescript
// Force session refresh
await supabase.auth.refreshSession();
// Then reload page
```

**Prevention:**
- Implement role-based UI (hide unavailable features)
- Show clear "upgrade role" messages
- Log out and back in after role changes
- Check session validity before operations
- Implement graceful degradation

---

### Issue 24: Session Expires Too Quickly

**Symptoms:**
- Logged out after short inactivity
- "Session expired" message
- Must login frequently

**Possible Causes:**
1. Short JWT expiration time
2. Refresh token not working
3. Browser clearing storage
4. Session timeout configuration

**Solutions:**

**Step 1: Check JWT Settings**
```bash
# In Supabase dashboard or .env
GOTRUE_JWT_EXP=3600 # 1 hour default
GOTRUE_JWT_AUD=authenticated
```

**Step 2: Verify Refresh Token**
```typescript
// Check if refresh token exists
const { data: { session } } = await supabase.auth.getSession();
console.log('Access token expires:', new Date(session?.expires_at * 1000));
console.log('Refresh token:', session?.refresh_token ? 'Present' : 'Missing');
```

**Step 3: Enable Auto Refresh**
```typescript
// In supabase client initialization
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

**Step 4: Check Browser Storage**
```javascript
// In browser console
console.log(localStorage.getItem('supabase.auth.token'));
// Should contain JWT and refresh token
```

**Step 5: Increase Session Duration**
In Supabase Dashboard:
1. Go to Authentication → Settings
2. Increase JWT expiry (e.g., 7200 seconds = 2 hours)
3. Enable "Enable refresh token rotation"
4. Save changes

**Prevention:**
- Set appropriate JWT expiration (1-2 hours)
- Enable auto token refresh
- Don't clear auth storage unnecessarily
- Implement session timeout warnings
- Allow "remember me" option

---

## Performance Issues

### Issue 25: Page Load Times Excessive

**Symptoms:**
- Initial page load > 5 seconds
- White screen during loading
- Poor Core Web Vitals scores
- Slow Time to Interactive (TTI)

**Possible Causes:**
1. Large bundle size
2. Blocking network requests
3. Unoptimized images
4. Too many database queries
5. No code splitting

**Solutions:**

**Step 1: Analyze Bundle Size**
```bash
# Build and analyze
pnpm build
# Check .next/analyze output

# Or use bundle analyzer
pnpm add -D @next/bundle-analyzer
```

**Step 2: Implement Code Splitting**
```typescript
// Use dynamic imports for large components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/heavy-component'),
  { loading: () => <p>Loading...</p> }
);
```

**Step 3: Optimize Images**
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/product.jpg"
  width={500}
  height={500}
  alt="Product"
  placeholder="blur"
  loading="lazy"
/>
```

**Step 4: Implement Query Caching**
```typescript
// React Query with staleTime
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

**Step 5: Use SSR/ISR Appropriately**
```typescript
// Static Generation for mostly-static content
export async function generateStaticParams() {
  const products = await fetchProducts();
  return products.map((p) => ({ id: p.id }));
}

// ISR for semi-static content
export const revalidate = 60; // Revalidate every 60 seconds
```

**Step 6: Minimize JavaScript**
```typescript
// Mark components as Client only when needed
'use client'; // Only when necessary

// Keep Server Components by default
export default async function Page() {
  const data = await fetchData();
  return <StaticContent data={data} />;
}
```

**Prevention:**
- Regular bundle size audits
- Lazy load non-critical components
- Optimize images (WebP, proper sizing)
- Use CDN for static assets
- Implement proper caching strategies
- Monitor Core Web Vitals

---

### Issue 26: High Memory Usage

**Symptoms:**
- Browser tab consuming 500MB+ memory
- "Page Unresponsive" warnings
- Browser crashes or freezes
- Slow UI interactions

**Possible Causes:**
1. Memory leaks in React components
2. Too many cached queries
3. Large state objects
4. Event listeners not cleaned up
5. Circular references

**Solutions:**

**Step 1: Profile Memory Usage**
```javascript
// Chrome DevTools → Performance → Memory
// 1. Take heap snapshot
// 2. Perform actions
// 3. Take another snapshot
// 4. Compare to find leaks
```

**Step 2: Clean Up Effects**
```typescript
// Always cleanup in useEffect
useEffect(() => {
  const interval = setInterval(() => {
    refetch();
  }, 30000);

  // Cleanup function
  return () => {
    clearInterval(interval);
  };
}, [refetch]);
```

**Step 3: Limit Query Cache**
```typescript
// Configure React Query cache limits
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 60 * 1000, // 1 minute
    },
  },
});
```

**Step 4: Use Pagination**
```typescript
// Don't load entire list at once
const { data, hasNextPage, fetchNextPage } = useInfiniteQuery({
  queryKey: ['tickets'],
  queryFn: ({ pageParam = 0 }) => fetchTickets(pageParam, 50),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

**Step 5: Optimize State Management**
```typescript
// Avoid large state objects
// ❌ Bad - entire product list in state
const [products, setProducts] = useState(allProducts);

// ✅ Good - only IDs in state, query for details
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const { data: selectedProducts } = useProductsByIds(selectedIds);
```

**Prevention:**
- Always cleanup effects and listeners
- Use pagination for large lists
- Implement virtual scrolling (react-window)
- Clear query cache periodically
- Profile memory regularly during development

---

## UI Rendering Issues

### Issue 27: Components Not Updating After Data Change

**Symptoms:**
- UI shows stale data
- Changes not reflected immediately
- Need to refresh page to see updates

**Possible Causes:**
1. React Query cache not invalidated
2. Component not re-rendering
3. State not updating correctly
4. WebSocket/polling not working

**Solutions:**

**Step 1: Invalidate Query Cache**
```typescript
// After mutation, invalidate related queries
const mutation = useMutation({
  mutationFn: updateTicket,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
  },
});
```

**Step 2: Force Refetch**
```typescript
// Manual refetch
const { data, refetch } = useQuery({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
});

// Call refetch when needed
await refetch();
```

**Step 3: Check Component Dependencies**
```typescript
// Ensure useEffect dependencies are correct
useEffect(() => {
  fetchData();
}, [ticketId]); // Re-run when ticketId changes
```

**Step 4: Use Optimistic Updates**
```typescript
const mutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['tasks'] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['tasks']);

    // Optimistically update cache
    queryClient.setQueryData(['tasks'], (old) => ({
      ...old,
      ...newData,
    }));

    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previous);
  },
});
```

**Step 5: Enable Auto-Refresh**
```typescript
// Poll for updates
const { data } = useQuery({
  queryKey: ['tickets'],
  queryFn: fetchTickets,
  refetchInterval: 30000, // 30 seconds
  refetchIntervalInBackground: false,
});
```

**Prevention:**
- Always invalidate queries after mutations
- Use React Query's built-in cache management
- Implement optimistic updates for better UX
- Enable refetch on window focus
- Test state updates thoroughly

---

### Issue 28: Modal or Dialog Not Opening

**Symptoms:**
- Click button but modal doesn't appear
- Modal opens but content blank
- Z-index issues (modal behind other elements)

**Possible Causes:**
1. State not updating
2. Portal element missing
3. CSS z-index conflict
4. JavaScript error preventing render

**Solutions:**

**Step 1: Check State Management**
```typescript
// Verify state is updating
const [isOpen, setIsOpen] = useState(false);

// Add logging
const handleOpen = () => {
  console.log('Opening modal');
  setIsOpen(true);
  console.log('State set to:', true);
};

// In JSX
<Modal open={isOpen} onOpenChange={setIsOpen}>
  <ModalContent>...</ModalContent>
</Modal>
```

**Step 2: Verify Portal Element**
```html
<!-- In app layout or _document.tsx -->
<div id="modal-root"></div>
```

```typescript
// In modal component
import { createPortal } from 'react-dom';

if (typeof document !== 'undefined') {
  return createPortal(
    <ModalContent />,
    document.getElementById('modal-root')!
  );
}
```

**Step 3: Fix Z-Index Issues**
```css
/* Ensure modal has high z-index */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: fixed;
  z-index: 10000;
  /* ... other styles */
}
```

**Step 4: Check for JavaScript Errors**
```javascript
// Browser console should show errors
// Common issues:
// - Undefined variable
// - Missing import
// - Syntax error in JSX
```

**Step 5: Test with shadcn/ui Dialog**
```typescript
// Use built-in Dialog component
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <p>Modal content</p>
  </DialogContent>
</Dialog>
```

**Prevention:**
- Use established UI libraries (shadcn/ui, Radix)
- Test modals in different contexts
- Ensure proper state management
- Check browser console for errors
- Use TypeScript for type safety

---

## API & tRPC Errors

### Issue 29: tRPC Mutation Failing

**Symptoms:**
- Error: "UNAUTHORIZED" or "FORBIDDEN"
- Mutation returns unexpected error
- Network error or timeout

**Possible Causes:**
1. Missing authentication
2. Insufficient permissions
3. Invalid input data
4. Database constraint violation
5. Network connectivity issue

**Solutions:**

**Step 1: Check Authentication**
```typescript
// Verify session exists
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  console.error('Not authenticated');
}
```

**Step 2: Validate Input Data**
```typescript
// Log input before mutation
console.log('Mutation input:', input);

const result = await trpc.workflow.createTemplate.mutate(input);
```

**Step 3: Check tRPC Error Details**
```typescript
try {
  await trpc.workflow.createTemplate.mutate(input);
} catch (error) {
  if (error instanceof TRPCClientError) {
    console.error('tRPC Error Code:', error.data?.code);
    console.error('Error Message:', error.message);
    console.error('Stack:', error.stack);
  }
}
```

**Step 4: Test with Direct API Call**
```bash
# Test tRPC endpoint directly
curl -X POST http://localhost:3025/api/trpc/workflow.createTemplate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"json":{"name":"Test Template","service_type":"warranty"}}'
```

**Step 5: Check Server Logs**
```bash
# Development mode logs
pnpm dev
# Watch for errors in console

# Production logs
pm2 logs service-center
# or
docker logs service-center-app
```

**Prevention:**
- Validate input data before mutation
- Handle errors gracefully with user-friendly messages
- Implement retry logic for transient failures
- Log errors for debugging
- Use TypeScript for type safety

---

### Issue 30: CORS or API Route Errors

**Symptoms:**
- Error: "CORS policy blocked"
- 404 Not Found on API route
- "Access-Control-Allow-Origin" error

**Possible Causes:**
1. Incorrect API route path
2. CORS not configured
3. Middleware blocking request
4. Environment mismatch

**Solutions:**

**Step 1: Verify API Route Path**
tRPC endpoint: `/api/trpc/[...trpc]`

Check file exists:
```bash
ls -la src/app/api/trpc/\[...trpc\]/route.ts
```

**Step 2: Check CORS Configuration**
```typescript
// In src/app/api/trpc/[...trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

const handler = (req: Request) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });
};

export { handler as GET, handler as POST };
```

**Step 3: Add CORS Headers (if needed)**
```typescript
// Only for public endpoints
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

**Step 4: Test API Route**
```bash
# Test API route exists
curl -X POST http://localhost:3025/api/trpc/workflow.listTemplates

# Should return tRPC response, not 404
```

**Step 5: Check Next.js Config**
```typescript
// In next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ];
  },
};
```

**Prevention:**
- Follow Next.js API route conventions
- Test API routes in development
- Use tRPC client properly
- Configure CORS only where needed
- Monitor API route errors

---

## Browser Compatibility Issues

### Issue 31: Feature Not Working in Specific Browser

**Symptoms:**
- Works in Chrome but not Safari
- Mobile browser displays incorrectly
- JavaScript errors in older browsers

**Possible Causes:**
1. Browser doesn't support feature
2. Polyfills missing
3. CSS vendor prefixes needed
4. Service Worker not supported

**Solutions:**

**Step 1: Check Browser Support**
Visit [Can I Use](https://caniuse.com/) for:
- Fetch API
- CSS Grid
- IndexedDB
- WebP images

**Step 2: Add Polyfills**
```typescript
// In app/layout.tsx or _app.tsx
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

**Step 3: Use Feature Detection**
```typescript
// Check if feature is supported
if ('IntersectionObserver' in window) {
  // Use Intersection Observer
} else {
  // Fallback implementation
}
```

**Step 4: Test Across Browsers**
Recommended testing matrix:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

**Step 5: Use Autoprefixer**
```css
/* Tailwind includes autoprefixer by default */
/* For custom CSS: */
.flex-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}
```

**Prevention:**
- Use modern build tools (Next.js, Tailwind)
- Test in multiple browsers regularly
- Use progressive enhancement
- Provide fallbacks for unsupported features
- Check analytics for user browser versions

---

## Emergency Procedures

### Emergency Checklist

When critical issues occur in production:

**Step 1: Assess Severity**
- [ ] Users unable to submit requests?
- [ ] Data loss or corruption?
- [ ] Complete service outage?
- [ ] Security breach?

**Step 2: Immediate Actions**
- [ ] Notify system administrator
- [ ] Check server status and logs
- [ ] Verify database connectivity
- [ ] Review recent deployments

**Step 3: Communication**
- [ ] Notify affected users (if possible)
- [ ] Update status page
- [ ] Log incident details
- [ ] Estimate resolution time

**Step 4: Investigation**
- [ ] Review error logs
- [ ] Check database integrity
- [ ] Test affected functionality
- [ ] Identify root cause

**Step 5: Resolution**
- [ ] Implement fix or rollback
- [ ] Test in staging first
- [ ] Deploy to production
- [ ] Verify resolution

**Step 6: Post-Incident**
- [ ] Document incident report
- [ ] Conduct root cause analysis
- [ ] Implement preventive measures
- [ ] Update runbooks

---

## Additional Resources

### Useful Commands

**Database:**
```bash
# Supabase local
pnpx supabase start
pnpx supabase status
pnpx supabase db reset

# PostgreSQL
psql -h localhost -U postgres -d service_center
\dt  # List tables
\d+ table_name  # Describe table
```

**Development:**
```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Format code
pnpm format
```

**Logs:**
```bash
# View application logs
tail -f .next/server.log

# Database logs
tail -f supabase/logs/postgres.log

# System logs
journalctl -u service-center -f
```

### Documentation Links

- **Main Documentation:** `/CLAUDE.md`
- **Phase 2 Features:** `/docs/phase2/features/`
- **User Guides:** `/docs/phase2/user-guides/`
- **FAQ:** `/docs/phase2/faq.md`
- **Database Schemas:** `/docs/data/schemas/`

### Support Contacts

- **Technical Support:** admin@sstc.vn
- **Database Issues:** DBA team
- **Infrastructure:** DevOps team
- **Security:** security@sstc.vn

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Next Review:** 2025-11-24

**End of Troubleshooting Guide**
