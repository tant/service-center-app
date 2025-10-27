# Bug Fix: Trigger auto_move_product_on_ticket_event

**Bug ID:** DI-CRITICAL-001
**Severity:** P0 - DEPLOYMENT BLOCKER
**Date Found:** 2025-10-25
**Found By:** Quinn (QA Testing)
**Status:** FIX READY

---

## Problem Summary

**Trigger:** `trigger_auto_move_product_on_ticket_event`
**Function:** `auto_move_product_on_ticket_event()`
**Error:** `record "new" has no field "serial_number"`
**Impact:** **BLOCKS ALL SERVICE TICKET CREATION**

### Root Cause

The trigger function tries to access `NEW.serial_number` on line 8:

```sql
IF NEW.serial_number IS NULL THEN
  RETURN NEW;
END IF;
```

But the `service_tickets` table **does NOT have a `serial_number` column**.

### Schema Analysis

**What EXISTS:**
- `service_tickets` has: `id`, `ticket_number`, `customer_id`, `product_id`, `request_id`
- `physical_products` has: `id`, `serial_number`, `product_id`, `current_ticket_id` (FK to service_tickets)
- `service_requests` has: `serial_number` (customer-provided, may not match physical inventory)

**The Mismatch:**
- The trigger assumes `service_tickets.serial_number` exists
- But the actual schema uses `physical_products.current_ticket_id` as the link

---

## Fix Options

### Option 1: Quick Fix (RECOMMENDED FOR IMMEDIATE DEPLOYMENT)

**Disable the trigger temporarily:**

```sql
-- Disable the problematic trigger
ALTER TABLE service_tickets
  DISABLE TRIGGER trigger_auto_move_product_on_ticket_event;
```

**Pros:**
- ✅ Immediate fix - tickets can be created instantly
- ✅ No risk - just disables auto-movement feature
- ✅ Can be re-enabled later with proper fix

**Cons:**
- ⚠️ Loses automatic product warehouse movement (may be acceptable if feature not critical yet)
- ⚠️ Products must be moved manually

**When to use:** If auto-movement feature is not critical for MVP/launch

---

### Option 2: Proper Fix (RECOMMENDED FOR LONG-TERM)

**Replace the function with corrected logic:**

The trigger should work differently based on how products are actually linked to tickets.

**Approach A: Use service_request.serial_number if ticket created from request**

```sql
CREATE OR REPLACE FUNCTION public.auto_move_product_on_ticket_event()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_product_id UUID;
  v_previous_warehouse warehouse_type;
  v_serial_number VARCHAR(255);
BEGIN
  -- Get serial number from related service_request (if ticket was created from request)
  IF NEW.request_id IS NOT NULL THEN
    SELECT serial_number INTO v_serial_number
    FROM service_requests
    WHERE id = NEW.request_id;
  END IF;

  -- Only process if we have a serial number
  IF v_serial_number IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find physical product by serial number
  SELECT id, virtual_warehouse_type INTO v_product_id, v_previous_warehouse
  FROM physical_products
  WHERE serial_number = v_serial_number;

  IF v_product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ticket created or in progress: move to In Service
  IF NEW.status IN ('pending', 'in_progress') AND (OLD IS NULL OR OLD.status != NEW.status) THEN
    -- Record movement
    INSERT INTO stock_movements (
      physical_product_id,
      movement_type,
      from_virtual_warehouse,
      to_virtual_warehouse,
      ticket_id,
      notes,
      moved_by_id
    ) VALUES (
      v_product_id,
      'assignment',
      v_previous_warehouse,
      'in_service',
      NEW.id,
      'Auto-moved to In Service (ticket ' || NEW.ticket_number || ')',
      COALESCE(NEW.created_by, NEW.updated_by)
    );

    -- Update product
    UPDATE physical_products
    SET virtual_warehouse_type = 'in_service',
        current_ticket_id = NEW.id
    WHERE id = v_product_id;
  END IF;

  -- Ticket completed: move back to previous warehouse
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    -- Get original warehouse (from last assignment movement)
    SELECT from_virtual_warehouse INTO v_previous_warehouse
    FROM stock_movements
    WHERE physical_product_id = v_product_id
      AND movement_type = 'assignment'
      AND ticket_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;

    -- If no previous warehouse found, default to 'main' (Kho Chính)
    -- (Historically this default was 'warranty_stock'; since 2025-10-26 default virtual warehouses are 'main')
    IF v_previous_warehouse IS NULL THEN
      v_previous_warehouse := 'main';
    END IF;

    -- Record movement
    INSERT INTO stock_movements (
      physical_product_id,
      movement_type,
      from_virtual_warehouse,
      to_virtual_warehouse,
      ticket_id,
      notes,
      moved_by_id
    ) VALUES (
      v_product_id,
      'return',
      'in_service',
      v_previous_warehouse,
      NEW.id,
      'Auto-moved from In Service (ticket ' || NEW.ticket_number || ' completed)',
      COALESCE(NEW.updated_by, NEW.created_by)
    );

    -- Update product
    UPDATE physical_products
    SET virtual_warehouse_type = v_previous_warehouse,
        current_ticket_id = NULL
    WHERE id = v_product_id;
  END IF;

  RETURN NEW;
END;
$function$;

  -- QA Note (Oct 26, 2025): The system now creates default virtual warehouses with
  -- warehouse_type = 'main'. When testing trigger behavior and stock movements,
  -- ensure test data accounts for 'main' as a possible previous or default warehouse.
  -- Related migrations: 202510260014, 202510260015, 202510260016.
```

**Changes Made:**
1. Line 8-13: Get serial_number from service_requests table via request_id FK
2. Line 15: Check if serial_number was found before proceeding
3. Line 35 & 66: Use COALESCE for created_by/updated_by (field names corrected)

**Pros:**
- ✅ Works with actual schema
- ✅ Maintains automatic product movement feature
- ✅ Only processes tickets created from service requests with serial numbers

**Cons:**
- ⚠️ Only works for tickets created via service request portal
- ⚠️ Tickets created directly won't trigger product movement

---

**Approach B: Add physical_product_id to service_tickets (Future Enhancement)**

If you want ALL tickets to track physical products:

```sql
-- Add column to service_tickets
ALTER TABLE service_tickets
  ADD COLUMN physical_product_id UUID REFERENCES physical_products(id);

-- Then update trigger to use this field
CREATE OR REPLACE FUNCTION public.auto_move_product_on_ticket_event()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_previous_warehouse warehouse_type;
BEGIN
  -- Only process if ticket is linked to a physical product
  IF NEW.physical_product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get current warehouse
  SELECT virtual_warehouse_type INTO v_previous_warehouse
  FROM physical_products
  WHERE id = NEW.physical_product_id;

  -- Ticket created or in progress: move to In Service
  IF NEW.status IN ('pending', 'in_progress') AND (OLD IS NULL OR OLD.status != NEW.status) THEN
    -- Record movement
    INSERT INTO stock_movements (
      physical_product_id,
      movement_type,
      from_virtual_warehouse,
      to_virtual_warehouse,
      ticket_id,
      notes,
      moved_by_id
    ) VALUES (
      NEW.physical_product_id,
      'assignment',
      v_previous_warehouse,
      'in_service',
      NEW.id,
      'Auto-moved to In Service (ticket ' || NEW.ticket_number || ')',
      COALESCE(NEW.created_by, NEW.updated_by)
    );

    -- Update product
    UPDATE physical_products
    SET virtual_warehouse_type = 'in_service',
        current_ticket_id = NEW.id
    WHERE id = NEW.physical_product_id;
  END IF;

  -- Ticket completed: move back
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    -- Get original warehouse
    SELECT from_virtual_warehouse INTO v_previous_warehouse
    FROM stock_movements
    WHERE physical_product_id = NEW.physical_product_id
      AND movement_type = 'assignment'
      AND ticket_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_previous_warehouse IS NULL THEN
      v_previous_warehouse := 'warranty_stock';
    END IF;

    -- Record movement
    INSERT INTO stock_movements (
      physical_product_id,
      movement_type,
      from_virtual_warehouse,
      to_virtual_warehouse,
      ticket_id,
      notes,
      moved_by_id
    ) VALUES (
      NEW.physical_product_id,
      'return',
      'in_service',
      v_previous_warehouse,
      NEW.id,
      'Auto-moved from In Service (ticket ' || NEW.ticket_number || ' completed)',
      COALESCE(NEW.updated_by, NEW.created_by)
    );

    -- Update product
    UPDATE physical_products
    SET virtual_warehouse_type = v_previous_warehouse,
        current_ticket_id = NULL
    WHERE id = NEW.physical_product_id;
  END IF;

  RETURN NEW;
END;
$function$;
```

**Pros:**
- ✅ Clean, direct relationship
- ✅ Works for all tickets
- ✅ No serial number lookup needed

**Cons:**
- ⚠️ Requires schema migration
- ⚠️ May need application code updates

---

### Option 3: Remove Trigger (If Feature Not Needed)

If automatic product movement isn't required yet:

```sql
-- Drop the trigger
DROP TRIGGER IF EXISTS trigger_auto_move_product_on_ticket_event ON service_tickets;

-- Drop the function
DROP FUNCTION IF EXISTS auto_move_product_on_ticket_event();
```

**Pros:**
- ✅ Simplest fix
- ✅ Removes complexity until feature is needed

**Cons:**
- ⚠️ Loses the feature entirely

---

## Recommended Implementation Path

### For Immediate Deployment (TODAY)

**Step 1: Disable the trigger**
```bash
psql $DATABASE_URL << 'EOF'
ALTER TABLE service_tickets
  DISABLE TRIGGER trigger_auto_move_product_on_ticket_event;
EOF
```

**Step 2: Verify tickets can be created**
```bash
psql $DATABASE_URL << 'EOF'
BEGIN;
INSERT INTO service_tickets (customer_id, product_id, issue_description)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  (SELECT id FROM products LIMIT 1),
  'Test ticket creation'
)
RETURNING id, ticket_number;
ROLLBACK;
EOF
```

**Step 3: Re-run data integrity tests**
- Execute blocked tests INT-1.1.3, INT-1.1.4, INT-2.1, INT-2.2, INT-2.3
- Verify 100% pass rate

### For Next Sprint (PROPER FIX)

**Option:** Implement Approach A (use service_request.serial_number)

This maintains the feature for tickets created via the public portal without schema changes.

---

## Testing Plan

### After Applying Fix

**Test 1: Create ticket successfully**
```sql
BEGIN;
INSERT INTO service_tickets (customer_id, product_id, issue_description)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  (SELECT id FROM products LIMIT 1),
  'Test ticket'
)
RETURNING id, ticket_number;
-- Should succeed with SV-2025-NNN format
ROLLBACK;
```

**Test 2: Create ticket from service request with serial number**
```sql
BEGIN;
-- Create service request
INSERT INTO service_requests (
  customer_name,
  customer_email,
  product_brand,
  product_model,
  serial_number,
  issue_description,
  service_type,
  delivery_method
) VALUES (
  'Test Customer',
  'test@example.com',
  'Apple',
  'iPhone 14 Pro',
  'TEST-SERIAL-123',
  'Test issue',
  'warranty',
  'pickup'
)
RETURNING id;

-- Convert to ticket (application would do this via API)
-- Verify trigger processes correctly
ROLLBACK;
```

**Test 3: Verify physical product movement** (if Approach A/B used)
```sql
-- Create physical product
-- Create ticket linked to it
-- Verify product moved to 'in_service' warehouse
-- Complete ticket
-- Verify product moved back
```

### Re-run Blocked Tests

After fix applied:
- ✅ INT-1.1.3: Prevent customer deletion with existing tickets
- ✅ INT-1.1.4: CASCADE delete tickets → tasks
- ✅ INT-2.1: Auto-numbering trigger
- ✅ INT-2.2: Auto-create tasks from template
- ✅ INT-2.3: Auto-calculate parts total

**Expected:** All 5 tests PASS

---

## Risk Assessment

### Option 1 (Disable Trigger) - LOW RISK ✅
- **Impact:** Feature disabled, tickets work
- **Effort:** 1 minute
- **Reversible:** Yes
- **Blocker:** No

### Option 2A (Fix with service_request) - MEDIUM RISK ⚠️
- **Impact:** Feature works for service request portal only
- **Effort:** 15 minutes
- **Reversible:** Yes
- **Blocker:** Requires testing

### Option 2B (Add column) - HIGH RISK ⚠️
- **Impact:** Schema change, potential app updates
- **Effort:** 1-2 hours
- **Reversible:** No (migration required to rollback)
- **Blocker:** Requires full regression testing

### Option 3 (Remove) - LOW RISK ✅
- **Impact:** Feature removed completely
- **Effort:** 1 minute
- **Reversible:** Can recreate later
- **Blocker:** No

---

## Decision Matrix

| Scenario | Recommended Fix |
|----------|----------------|
| **Need to deploy TODAY** | Option 1: Disable trigger |
| **Feature critical for launch** | Option 2A: Fix with service_request |
| **Feature not needed yet** | Option 3: Remove trigger |
| **Long-term solution** | Option 2B: Add physical_product_id column (next sprint) |

---

## Execution Script

### Quick Fix (Disable Trigger)

```bash
# Connect to database and disable trigger
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres << 'EOF'
-- Disable the problematic trigger
ALTER TABLE service_tickets
  DISABLE TRIGGER trigger_auto_move_product_on_ticket_event;

-- Verify trigger is disabled
SELECT
  tgname,
  tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_auto_move_product_on_ticket_event';
-- Should show tgenabled = 'D' (disabled)

-- Test ticket creation
BEGIN;
INSERT INTO service_tickets (customer_id, product_id, issue_description)
VALUES (
  (SELECT id FROM customers LIMIT 1),
  (SELECT id FROM products LIMIT 1),
  'Test ticket after fix'
)
RETURNING id, ticket_number;
ROLLBACK;

-- Success!
EOF
```

---

## Sign-Off

**Bug Analysis:** Complete
**Fix Ready:** Yes
**Recommended Action:** Disable trigger (Option 1) for immediate deployment
**Proper Fix:** Implement Option 2A in next sprint

**Analyst:** Quinn (Test Architect & Quality Advisor)
**Date:** 2025-10-25

**Next Steps:**
1. Apply quick fix (disable trigger)
2. Re-run blocked data integrity tests
3. Continue with remaining test categories
4. Plan proper fix for next sprint
