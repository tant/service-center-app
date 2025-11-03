# Service Request: Draft Mode & Phone Lookup

**Feature ID:** SR-DRAFT-LOOKUP
**Created:** 2025-11-02
**Status:** ✅ Complete
**Version:** 1.0

---

## Overview

Enhancement to service request creation workflow with two major features:
1. **Draft Mode**: Save incomplete requests without submission
2. **Phone Lookup**: Auto-fill customer information based on phone number

---

## Business Requirements

### Problem Statement

**Before:**
- Staff must complete entire service request form in one session
- Lost data if interrupted or need to verify information
- Manual re-entry of existing customer information
- Cannot save progress for complex multi-product requests

**After:**
- Staff can save progress as draft and return later
- Automatic customer lookup reduces data entry
- Drafts can be deleted if no longer needed
- Streamlined workflow for walk-in customers

---

## Feature 1: Draft Mode

### Status Flow

```
NEW STATE: draft (saved, not submitted)
    ↓
    Submit → received (checkbox: đã nhận sản phẩm ✓)
    ↓
    Auto-create tickets → processing

OR

    Submit → pickingup (checkbox: đã nhận sản phẩm ✗)
    ↓
    Staff confirms receipt → received
    ↓
    Auto-create tickets → processing
```

### Complete Status Enum

```typescript
type RequestStatus =
  | 'draft'        // NEW: Saved but not submitted
  | 'submitted'    // DEPRECATED: Not used in new workflow
  | 'pickingup'    // Waiting for product pickup from customer
  | 'received'     // Products received, triggers ticket creation
  | 'processing'   // Tickets created, work in progress
  | 'completed'    // All tickets completed
  | 'cancelled';   // Request cancelled/rejected
```

### Draft Validation Rules

**Save as Draft (Lenient):**
- ✅ Phone number ≥ 10 characters
- ✅ At least 1 product with serial number
- ❌ Name not required
- ❌ Email not required
- ❌ Issue description not required

**Submit Request (Strict):**
- ✅ All draft validation rules
- ✅ Customer name ≥ 2 characters
- ✅ Email valid format (if provided)
- ✅ Issue description not empty
- ✅ All serials ≥ 5 characters
- ✅ Delivery address required if delivery method = 'delivery'

### Draft Operations

#### Save Draft

**Endpoint:** `serviceRequest.saveDraft`

**Access:** Admin, Manager, Reception (authenticated)

**Behavior:**
```typescript
{
  status: 'draft',
  reviewed_by_id: <current_staff_id>,
  tracking_token: 'SR-YYYY-NNN',  // Still generated
  // All other fields saved as-is
}
```

**UI Flow:**
```
1. Staff clicks "Lưu nháp" button
2. Lenient validation (phone + 1 serial)
3. Save to database with status = 'draft'
4. Toast: "Đã lưu nháp SR-2025-XXX"
5. Redirect to /operations/service-requests
6. Draft appears in list with badge "Nháp"
```

#### Delete Draft

**Endpoint:** `serviceRequest.deleteDraft`

**Access:** Admin, Manager, Reception (authenticated)

**Validation:**
```typescript
if (request.status !== 'draft') {
  throw new Error('Chỉ có thể xóa các phiếu yêu cầu ở trạng thái nháp');
}
```

**Cascade Delete:**
- ✅ service_request_items (ON DELETE CASCADE)
- ✅ email_notifications (if any)

**UI Flow:**
```
1. Staff clicks delete icon on draft request
2. Confirmation dialog
3. Delete from database
4. Remove from list
5. Toast: "Đã xóa nháp"
```

### Submit Logic Based on Receipt Status

#### Scenario A: Products Already Received (Default)

**Checkbox:** ✓ Đã nhận sản phẩm từ khách hàng

**Flow:**
```
Submit (receipt_status = 'received')
    ↓
Initial status = 'received'
    ↓
Database Trigger: auto_create_tickets_on_received()
    ├─ Lookup customer by phone (unique)
    ├─ If found → Update name/email if changed
    ├─ If not found → Create new customer
    ├─ For each item:
    │   ├─ Lookup product_id from serial_number
    │   ├─ Create service_ticket (status = 'pending')
    │   └─ Link ticket_id to service_request_items
    └─ Auto-update status = 'processing'
```

**Toast Message:**
```
"Đã tạo phiếu yêu cầu SR-2025-XXX và đang tự động tạo phiếu sửa chữa"
```

**Use Case:**
- Walk-in customers bringing products directly to service center
- Customer ships product and staff confirms receipt

#### Scenario B: Waiting for Pickup

**Checkbox:** ✗ Đã nhận sản phẩm từ khách hàng

**Flow:**
```
Submit (receipt_status = 'pending_receipt')
    ↓
Initial status = 'pickingup'
    ↓
Staff goes to customer location or waits for delivery
    ↓
Staff updates: receipt_status = 'received'
    ↓
Status changes to 'received'
    ↓
Database Trigger: auto_create_tickets_on_received()
    └─ Same as Scenario A
```

**Toast Message (Initial Submit):**
```
"Đã tạo phiếu yêu cầu SR-2025-XXX và đang chờ lấy hàng"
```

**Use Case:**
- Online service requests (Story 1.11)
- Customer requests pickup service
- Products at customer location

---

## Feature 2: Phone Lookup & Auto-fill

### API Endpoint

**Name:** `customers.getByPhone`

**Type:** Query (public procedure, no auth required for lookup)

**Input:**
```typescript
{
  phone: string; // Min 10 characters
}
```

**Output:**
```typescript
{
  id: string;
  name: string;
  email: string | null;
  phone: string;
} | null
```

**Database Query:**
```sql
SELECT id, name, email, phone
FROM customers
WHERE phone = ?
LIMIT 1;
```

### Frontend Implementation

#### Debounced Lookup

**Trigger:** User types in phone number field

**Debounce:** 500ms

**Conditions:**
- ✅ Phone length ≥ 10 characters
- ✅ User stopped typing for 500ms

**Flow:**
```
1. User types: "091234567"
2. After 500ms → API call
3. Loading spinner appears (⟳)
4. Customer found → Auto-fill
5. Green checkmark appears (✓)
6. Toast: "Đã tìm thấy khách hàng: Nguyễn Văn A"
```

#### Auto-fill Behavior

**When Customer Found:**
```typescript
setCustomerName(data.name);
setCustomerEmail(data.email || "");
setCustomerFound(true);
```

**Fields Updated:**
- ✅ Họ tên (customer_name)
- ✅ Email (customer_email)

**Fields NOT Updated:**
- ❌ Số điện thoại (user already entered this)
- ❌ Sản phẩm / Serial numbers
- ❌ Mô tả vấn đề

**When Customer Not Found:**
- ❌ No toast/notification (silent)
- ✅ Staff continues manual entry
- ✅ New customer will be created on submit

#### Visual Indicators

**States:**

| State | Icon | Helper Text | Field Style |
|-------|------|-------------|-------------|
| Idle | None | None | Default |
| Loading | ⟳ (spinning) | None | pr-10 (padding for icon) |
| Found | ✓ (green check) | "✓ Đã tìm thấy thông tin khách hàng" | pr-10, text-green-600 |
| Not Found | None | None | Default |

**Icons:**
```typescript
// Loading
<IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />

// Success
<IconCheck className="h-4 w-4 text-green-600" />
```

### User Experience Flow

**New Customer:**
```
1. Staff enters phone: "0999999999"
2. Wait 500ms
3. Loading spinner
4. Not found (silent)
5. Staff manually enters name, email
6. Submit creates new customer record
```

**Existing Customer:**
```
1. Staff enters phone: "0912345678"
2. Wait 500ms
3. Loading spinner
4. Found! Toast + checkmark
5. Name & email auto-filled
6. Staff only needs to enter serial + issue
7. Submit uses existing customer record
```

**Editing Auto-filled Data:**
```
✅ Staff can edit name/email after auto-fill
✅ Changes are saved (not overwritten)
✅ Useful for updating customer information
```

---

## Database Changes

### Migration 1: 20251102081000_add_draft_status_to_service_requests.sql

```sql
-- Add 'draft' status to enum
ALTER TYPE public.request_status ADD VALUE 'draft' BEFORE 'submitted';

COMMENT ON TYPE public.request_status IS 'Status flow: draft (saved, not submitted) → submitted → pickingup (waiting pickup) → received (auto-creates tickets) → processing → completed';
```

### Migration 2: 20251102082000_add_unique_phone_and_update_customer_lookup.sql

**Purpose:** Make phone unique and update customer lookup logic

```sql
-- Remove duplicate phone numbers (keep most recent)
WITH duplicates AS (
  SELECT id, phone, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as rn
  FROM public.customers
  WHERE phone IS NOT NULL
)
DELETE FROM public.customers
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Add unique constraint
ALTER TABLE public.customers
  ADD CONSTRAINT customers_phone_unique UNIQUE (phone);

-- Update trigger function (see Customer Lookup Logic section below)
```

**Business Rules:**
- Phone is now UNIQUE across all customers
- Duplicate phones are removed before constraint is added (keeps newest)
- Customer lookup prioritizes phone over email
- Existing customer info is updated on each service request submit

### Trigger Function Update

**Function:** `auto_create_tickets_on_received()`

**Trigger Condition:**
```sql
-- Trigger when receipt_status OR status changes to 'received'
IF (NEW.receipt_status = 'received' AND (OLD.receipt_status IS NULL OR OLD.receipt_status = 'pending_receipt'))
   OR (NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status IN ('submitted', 'pickingup')))
```

**Customer Lookup Logic (Updated 2025-11-02):**
```sql
-- Find or create customer (lookup by phone first, as it's unique)
SELECT id INTO v_customer_id
FROM public.customers
WHERE phone = NEW.customer_phone
LIMIT 1;

-- If customer exists, update name/email if changed
IF v_customer_id IS NOT NULL THEN
  UPDATE public.customers
  SET
    name = NEW.customer_name,
    email = COALESCE(NEW.customer_email, email),
    updated_at = NOW()
  WHERE id = v_customer_id
    AND (name != NEW.customer_name OR email IS DISTINCT FROM NEW.customer_email);
ELSE
  -- Customer doesn't exist, create new one
  INSERT INTO public.customers (name, email, phone, created_by_id)
  VALUES (NEW.customer_name, NEW.customer_email, NEW.customer_phone, NEW.reviewed_by_id)
  RETURNING id INTO v_customer_id;
END IF;
```

**Why Phone is Primary Lookup:**
- Phone is UNIQUE constraint in customers table
- Phone is required (NOT NULL)
- Email is optional (can be NULL)
- Phone is more reliable identifier for walk-in customers
- Updates existing customer info if name/email changed

---

## API Endpoints Summary

### New Endpoints

| Endpoint | Type | Auth | Purpose |
|----------|------|------|---------|
| `serviceRequest.saveDraft` | Mutation | Staff | Save incomplete request as draft |
| `serviceRequest.deleteDraft` | Mutation | Staff | Delete draft request |
| `customers.getByPhone` | Query | Public | Lookup customer by phone for auto-fill |

### Modified Endpoints

| Endpoint | Change | Reason |
|----------|--------|--------|
| `serviceRequest.submit` | Initial status logic | Support received vs pickingup |
| `serviceRequest.submit` | Return status field | Client needs to show appropriate toast |

---

## Frontend Components

### Modified Files

```
src/app/(auth)/operations/service-requests/new/page.tsx
  - Add saveDraft mutation
  - Add handleSaveDraft handler
  - Add "Lưu nháp" button
  - Update toast messages based on status

src/components/forms/service-request-form.tsx
  - Add onSaveDraft prop
  - Add validateForm(isDraft) function
  - Add buildFormData() helper
  - Add handleSaveDraft handler
  - Add submit-draft event listener
  - Add phone lookup with useEffect
  - Add debounce logic (500ms)
  - Add auto-fill logic
  - Add visual indicators (loading, success)

src/components/tables/service-requests-table.tsx
  - Update status schema enum
  - Add draft/pickingup to STATUS_MAP
  - Update stats calculation
  - Update badge labels
```

### Button Layout

```
┌─────────────────────────────────────────────────────┐
│ Footer Actions                                      │
├─────────────┬──────────────┬────────────────────────┤
│ [Hủy bỏ]   │ [Lưu nháp]   │ [Tạo phiếu yêu cầu]   │
│ outline     │ outline      │ default (primary)      │
└─────────────┴──────────────┴────────────────────────┘
```

**Behavior:**
- All buttons disabled during submission/save
- "Lưu nháp" dispatches custom event `submit-draft`
- "Tạo phiếu yêu cầu" triggers normal form submit

---

## Status Badge Mapping

```typescript
const STATUS_MAP = {
  draft:      { label: "Nháp",           variant: "outline" },
  submitted:  { label: "Đã gửi",         variant: "secondary" },
  pickingup:  { label: "Chờ lấy hàng",   variant: "secondary" },
  received:   { label: "Đã tiếp nhận",   variant: "default" },
  processing: { label: "Đang xử lý",     variant: "default" },
  completed:  { label: "Hoàn thành",     variant: "default" },
  cancelled:  { label: "Đã hủy",         variant: "destructive" },
};
```

---

## Permission Matrix

| Action | Admin | Manager | Reception | Technician |
|--------|-------|---------|-----------|------------|
| Create draft | ✅ | ✅ | ✅ | ❌ |
| Save draft | ✅ | ✅ | ✅ | ❌ |
| Delete draft | ✅ | ✅ | ✅ | ❌ |
| Submit request | ✅ | ✅ | ✅ | ❌ |
| Phone lookup | ✅ | ✅ | ✅ | ✅ (any authenticated) |

---

## Testing Scenarios

### Draft Workflow

**Test 1: Save Draft - Minimal Data**
```
1. Enter phone: 0912345678
2. Add 1 product with serial
3. Click "Lưu nháp"
4. ✓ Should save successfully
5. ✓ Redirect to list page
6. ✓ See draft with "Nháp" badge
```

**Test 2: Save Draft - Edit Later**
```
1. Create draft (as above)
2. Go back to /operations/service-requests/new
3. Should show empty form (drafts are not auto-loaded)
4. Note: Edit draft feature not implemented yet
```

**Test 3: Delete Draft**
```
1. Find draft in list
2. Click delete button
3. Confirm
4. ✓ Draft removed from list
5. ✓ Database record deleted
```

**Test 4: Cannot Delete Submitted Request**
```
1. Try to delete request with status = 'pickingup'
2. ✗ Error: "Chỉ có thể xóa các phiếu yêu cầu ở trạng thái nháp"
```

### Submit Workflow

**Test 5: Submit with Products Received**
```
1. Create new request
2. Checkbox "Đã nhận sản phẩm" = ✓ (default)
3. Fill all fields
4. Click "Tạo phiếu yêu cầu"
5. ✓ Initial status = 'received'
6. ✓ Trigger creates tickets
7. ✓ Status auto-changes to 'processing'
8. ✓ Toast: "...và đang tự động tạo phiếu sửa chữa"
```

**Test 6: Submit Waiting for Pickup**
```
1. Create new request
2. Uncheck "Đã nhận sản phẩm"
3. Fill all fields
4. Click "Tạo phiếu yêu cầu"
5. ✓ Initial status = 'pickingup'
6. ✓ No tickets created yet
7. ✓ Toast: "...và đang chờ lấy hàng"
```

### Phone Lookup

**Test 7: Existing Customer Lookup**
```
1. Enter phone of existing customer
2. Wait 500ms
3. ✓ Loading spinner appears
4. ✓ Customer found
5. ✓ Name auto-filled
6. ✓ Email auto-filled
7. ✓ Green checkmark + toast
```

**Test 8: New Customer (Not Found)**
```
1. Enter new phone number
2. Wait 500ms
3. ✓ Loading spinner appears
4. ✓ No customer found (silent)
5. ✓ No error message
6. ✓ Fields remain empty
7. ✓ Staff enters manually
```

**Test 9: Debounce Behavior**
```
1. Start typing phone: "091234..."
2. Continue typing within 500ms: "5678"
3. ✓ No API call yet (debounced)
4. Wait 500ms after last keystroke
5. ✓ API call fires
```

**Test 10: Edit Auto-filled Data**
```
1. Lookup finds customer: "Nguyễn Văn A"
2. Staff edits name to: "Nguyễn Văn An"
3. Submit form
4. ✓ Saved with edited value
5. ✓ Customer record not updated (uses form data)
```

---

## Performance Considerations

### Phone Lookup

**Debounce Rationale:**
- 500ms delay prevents excessive API calls
- Waits for user to finish typing
- Balance between responsiveness and efficiency

**Query Optimization:**
```sql
-- Index on phone column (should exist)
CREATE INDEX idx_customers_phone ON customers(phone);

-- Fast lookup query
SELECT id, name, email, phone
FROM customers
WHERE phone = ?
LIMIT 1;
```

**Expected Performance:**
- Database query: <10ms
- Network latency: 20-50ms
- Total: <100ms from API call to result

### Draft Storage

**Storage Impact:**
- Drafts remain in database indefinitely (no auto-cleanup)
- Recommendation: Add periodic cleanup job (future enhancement)
- Drafts older than 30 days could be auto-deleted

---

## Future Enhancements

### Not Implemented (Yet)

1. **Edit Draft:**
   - Load draft data into form
   - Update existing draft
   - Track draft versions

2. **Draft Auto-save:**
   - Auto-save every 30 seconds
   - Save on blur events
   - Recover from browser crash

3. **Bulk Phone Lookup:**
   - Import CSV with phone numbers
   - Batch lookup customers
   - Create multiple requests

4. **Customer Merge:**
   - Detect duplicate customers (different phone/email)
   - Suggest merge
   - Consolidate service history

5. **Draft Cleanup:**
   - Scheduled job to delete old drafts
   - Configurable retention period
   - Notification before deletion

---

## Technical Debt

### Known Issues

1. **Draft Edit Not Implemented:**
   - Creating draft doesn't auto-populate form on return
   - User must re-create from scratch
   - Mitigation: Add link "Edit Draft" in list page

2. **No Validation on Field Order:**
   - Phone field must be before name/email in UI
   - Auto-fill depends on field order
   - Should refactor to explicit field refs

3. **Customer Lookup Race Condition:**
   - Rapid phone changes could cause stale data
   - Mitigation: Track latest lookup ID
   - Cancel previous requests

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-02 | 1.0 | Initial documentation - Draft mode & phone lookup | Claude Code |

---

## Related Documentation

- **Stories:**
  - `docs/stories/01.11.public-service-request-portal.md`
  - `docs/stories/01.13.staff-request-management-and-ticket-conversion.md`

- **Database Schema:**
  - `docs/data/schemas/100_enums_and_sequences.sql`
  - `docs/data/schemas/203_service_requests.sql`

- **Migrations:**
  - `supabase/migrations/20251102080000_make_service_request_email_optional.sql`
  - `supabase/migrations/20251102081000_add_draft_status_to_service_requests.sql`

- **API Files:**
  - `src/server/routers/service-request.ts`
  - `src/server/routers/customers.ts`

- **UI Components:**
  - `src/app/(auth)/operations/service-requests/new/page.tsx`
  - `src/components/forms/service-request-form.tsx`
  - `src/components/tables/service-requests-table.tsx`
