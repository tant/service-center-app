# Requirements: Service Request Layer

## Document Information

**Document ID**: REQ-SRL-001
**Version**: 1.0
**Date**: 2025-10-22
**Status**: Draft
**Related Documents**:
- REQ_WAREHOUSE_PHYSICAL_PRODUCTS.md
- TASK_WORKFLOW_ARCHITECTURE.md
- USER_JOURNEY.md

---

## Business Context

### Purpose

The Service Request Layer provides a customer-facing interface for initiating service requests and bridges the gap between customer expectations and internal service ticket processing. It serves as a critical verification and intake point that:

1. **Validates warranty eligibility** through serial number verification
2. **Captures customer expectations** before physical product receipt
3. **Enables tracking transparency** through public portal access
4. **Reduces reception workload** through pre-populated data
5. **Manages discrepancies** between expected vs actual received products

### Key Stakeholders

- **Customers**: Create service requests online or in-person
- **Reception Staff**: Convert requests to tickets, verify products
- **Technicians**: Reference customer expectations during diagnosis
- **Managers**: Monitor request-to-ticket conversion metrics

### Business Value

- **Reduced wait times**: Pre-filled customer information speeds up in-person check-in
- **Warranty gate**: Prevents non-warranty items from entering warranty workflow
- **Customer satisfaction**: Transparent tracking and proactive communication
- **Audit trail**: Complete history from initial request through service completion

---

## Functional Requirements

### FR-SRL-001: Serial Number Verification Gate

**Description**: System must verify serial numbers against the physical products database before allowing service request creation.

**Business Rules**:
- Serial number must exist in `physical_products` table
- System displays product information upon successful verification
- Invalid serial numbers prevent request creation with clear error message
- Multiple serial numbers can be added sequentially in one request

**User Story**:
```
AS A customer
I WANT to verify my product serial number online
SO THAT I know if my product qualifies for warranty service before shipping
```

**Acceptance Criteria**:
- [ ] Serial number input field with barcode scanner support
- [ ] Real-time verification (AJAX call on input completion)
- [ ] Display: Product model, warranty status (company/manufacturer/expired)
- [ ] Clear error message for unrecognized serial numbers
- [ ] Support adding multiple products in single request

**Technical Notes**:
```typescript
// API Endpoint
POST /api/public/verify-serial
{
  "serial_number": "SN123456789"
}

// Response
{
  "valid": true,
  "product": {
    "id": "uuid",
    "serial_number": "SN123456789",
    "model": "iPhone 14 Pro",
    "brand": "Apple",
    "warranty_status": "company_warranty", // or "manufacturer_warranty" or "expired"
    "warranty_end_date": "2025-12-31"
  }
}
```

---

### FR-SRL-002: Public Service Request Creation

**Description**: Customers can create service requests online without authentication, using a unique tracking link for future access.

**Business Rules**:
- No login required for request creation
- Tracking token generated as unique identifier (format: `SR-YYYYMMDD-XXXXX`)
- Customer email + phone number required for contact
- Request can contain 1+ verified products
- Each request session creates ONE service request (multiple products allowed)

**User Story**:
```
AS A customer
I WANT to create a service request online before shipping my product
SO THAT the service center is prepared to receive my device
```

**Acceptance Criteria**:
- [ ] Public form accessible at `/request` or `/request?serial=XXX` (pre-filled)
- [ ] Multi-step wizard: Contact Info → Product Verification → Issue Description → Confirmation
- [ ] Generate unique tracking token (SR-YYYYMMDD-XXXXX)
- [ ] Send confirmation email with tracking link
- [ ] Allow adding multiple products with individual issue descriptions
- [ ] Display estimated service timeline

**Workflow**:
```
Customer Journey (Online Request):
1. Navigate to public request form
2. Enter contact information (name, phone, email)
3. Add products:
   a. Enter/scan serial number
   b. System verifies and displays product info
   c. Customer describes issue symptoms
   d. Add to request
   e. Repeat for additional products
4. Review request summary
5. Submit request
6. Receive confirmation email with tracking link
```

---

### FR-SRL-003: Walk-In Service Request Creation

**Description**: Reception staff can create service requests on behalf of walk-in customers with streamlined workflow.

**Business Rules**:
- Staff authenticates via system login (role: Reception or higher)
- Phone number used as customer lookup key
- Existing customer data auto-populated
- Products verified at point of creation
- Request immediately converted to ticket (status: `received`)

**User Story**:
```
AS A reception staff member
I WANT to quickly create a service request for walk-in customers
SO THAT I can minimize customer wait time during check-in
```

**Acceptance Criteria**:
- [ ] Staff interface at `/dashboard/requests/new`
- [ ] Phone number search with auto-complete for existing customers
- [ ] Serial verification with barcode scanner support
- [ ] One-click conversion to service ticket
- [ ] Print ticket receipt for customer
- [ ] Skip email confirmation (customer present in-person)

**Workflow**:
```
Walk-In Customer Journey:
1. Staff asks for customer phone number
2. System retrieves existing customer data (if any)
3. Staff verifies/updates customer information
4. Customer presents products
5. Staff scans serial numbers (verification)
6. Customer describes issues
7. Staff creates request and immediately converts to ticket
8. System assigns ticket number (SV-YYYY-NNN)
9. Staff provides tracking number to customer
10. Customer leaves products at service center
```

---

### FR-SRL-004: Request-Ticket Relationship (1:N)

**Description**: A single service request can generate multiple service tickets based on product complexity or service type.

**Business Rules**:
- One service request → One or more service tickets
- Default behavior: 1 request → 1 ticket (containing all products)
- Reception staff can split into multiple tickets if needed
- Each ticket tracks subset of products from original request
- Splitting criteria: Different service types, different technicians, complex repairs

**User Story**:
```
AS A reception staff member
I WANT to split a multi-product request into separate tickets
SO THAT different technicians can work on different devices simultaneously
```

**Acceptance Criteria**:
- [ ] Default: Single ticket contains all products from request
- [ ] Option to split request during ticket creation
- [ ] Link tickets back to original request (audit trail)
- [ ] Customer tracking page shows all tickets from their request
- [ ] Cannot split after ticket status changes from `pending`

**Data Model**:
```sql
-- Relationship tracking
service_requests (1) ──< (N) service_tickets
  via: service_tickets.request_id → service_requests.id

-- Splitting scenario example:
Request SR-20251022-00001 (2 products):
  - Product A: iPhone 14 (water damage)
  - Product B: MacBook Pro (screen replacement)

Split into:
  - Ticket SV-2025-001: iPhone 14 only (assigned to Tech A)
  - Ticket SV-2025-002: MacBook Pro only (assigned to Tech B)

Both tickets reference request_id = SR-20251022-00001
```

---

### FR-SRL-005: Request Status Flow

**Description**: Service requests follow a defined status lifecycle from submission through completion.

**Status Definitions**:

| Status | Description | Trigger | Next States |
|--------|-------------|---------|-------------|
| `submitted` | Request created, awaiting product delivery | Customer submits online request | `received`, `cancelled` |
| `received` | Products physically received at service center | Staff confirms receipt | `processing` |
| `processing` | Converted to service ticket(s), work in progress | Ticket creation | `completed` |
| `completed` | All related tickets completed, customer notified | Last ticket marked completed | N/A (terminal) |
| `cancelled` | Request cancelled before service | Customer/staff cancellation | N/A (terminal) |

**Business Rules**:
- Status transitions are sequential (no backwards movement)
- `submitted` → `received`: Manual confirmation by reception staff
- `received` → `processing`: Automatic when ticket created
- `processing` → `completed`: Automatic when all related tickets completed
- `cancelled`: Allowed only in `submitted` status

**User Story**:
```
AS A customer
I WANT to track my service request status online
SO THAT I know where my device is in the service process
```

**Acceptance Criteria**:
- [ ] Status displayed on public tracking page
- [ ] Email notification on each status change
- [ ] Status history with timestamps visible to staff
- [ ] Clear status descriptions for customers (non-technical)

---

### FR-SRL-006: Expected vs Actual Product Reconciliation

**Description**: System tracks discrepancies between products listed in online request and products actually received at service center.

**Business Rules**:
- Online requests list "expected" products (serial numbers)
- Reception staff confirms "actual" products received
- Discrepancies flagged for staff review
- Common scenarios:
  - Customer ships fewer products than listed
  - Customer ships different product than listed
  - Additional products not in original request

**User Story**:
```
AS A reception staff member
I WANT to be alerted when received products don't match the request
SO THAT I can resolve discrepancies before creating the ticket
```

**Acceptance Criteria**:
- [ ] Display expected products from request
- [ ] Scan actual products upon receipt
- [ ] Highlight mismatches (missing, extra, substituted)
- [ ] Require staff acknowledgment before proceeding
- [ ] Log discrepancies in request history
- [ ] Option to update request or contact customer

**Workflow**:
```
Reconciliation Process:
1. Staff opens pending request (status: submitted)
2. System displays expected products list
3. Staff scans each received product
4. System compares scanned vs expected
5. IF mismatch:
   a. Display warning with details
   b. Staff options:
      - Contact customer for clarification
      - Update request to match actual products
      - Reject products (cancel request)
6. Staff confirms reconciliation
7. Status → received
```

---

### FR-SRL-007: Customer Delivery Confirmation Workflow

**Description**: After service completion, customers must confirm delivery details through public portal before finalizing ticket closure.

**Business Rules**:
- Trigger: All repairs completed, ticket status → `awaiting_customer_confirmation`
- Customer receives email with confirmation link
- Options: Self pickup or request delivery
- If delivery requested: Provide address and preferred time
- 3-day timeout: Auto-fallback to self-pickup if no response
- Customer can view service summary and costs before confirmation

**User Story**:
```
AS A customer
I WANT to choose how to receive my repaired device
SO THAT I can pick the most convenient delivery method
```

**Acceptance Criteria**:
- [ ] Unique confirmation link sent via email
- [ ] Display service summary (services performed, costs, parts used)
- [ ] Options: "I will pick up" or "Request delivery"
- [ ] If delivery: Address form + date/time preference
- [ ] Confirmation deadline displayed (3 days)
- [ ] Auto-fallback to self-pickup after timeout
- [ ] Notify staff when customer confirms

**Workflow**:
```
Delivery Confirmation Flow:
1. Technician marks ticket as completed
2. System sends email to customer:
   - Subject: "Your device is ready - Choose delivery method"
   - Link: https://domain.com/confirm/{tracking_token}
3. Customer clicks link, sees:
   - Service summary
   - Total cost
   - Two buttons: "Self Pickup" | "Request Delivery"
4. Customer selects option:
   a. Self Pickup:
      - Show service center address and hours
      - Generate QR code for pickup verification
      - Ticket status → ready_for_pickup
   b. Request Delivery:
      - Address form (pre-filled if available)
      - Preferred date/time selection
      - Ticket status → ready_for_delivery
      - Creates delivery task for staff
5. IF no response after 3 days:
   - Auto-select self-pickup
   - Send reminder email
   - Ticket status → ready_for_pickup
```

---

### FR-SRL-008: Email Notification Strategy (6 Key Moments)

**Description**: Automated email notifications keep customers informed at critical service milestones.

**Notification Moments**:

1. **Request Confirmation** (Status: `submitted`)
   - **Trigger**: Customer submits online request
   - **Content**:
     - Tracking number and link
     - Products listed in request
     - Next steps: Ship device or visit center
     - Estimated receipt confirmation timeline
   - **Recipient**: Customer email

2. **Product Received** (Status: `received`)
   - **Trigger**: Staff confirms product receipt
   - **Content**:
     - Confirmation of received products
     - Any discrepancies noted
     - Estimated diagnosis timeline (24-48 hours)
     - Tracking link for updates
   - **Recipient**: Customer email

3. **Diagnosis Complete - Action Required** (Ticket: `awaiting_approval`)
   - **Trigger**: Technician completes diagnosis, awaits customer approval
   - **Content**:
     - Diagnosis summary
     - Recommended services and costs
     - Approval request link
     - Approval deadline (3 days)
   - **Recipient**: Customer email

4. **Service Completed** (Ticket: `completed`)
   - **Trigger**: All repairs finished
   - **Content**:
     - Services performed
     - Total cost breakdown
     - Delivery confirmation request
     - Link to choose pickup/delivery
   - **Recipient**: Customer email

5. **Ready for Pickup/Delivery** (Ticket: `ready_for_pickup` or `ready_for_delivery`)
   - **Trigger**: Customer confirms pickup OR delivery scheduled
   - **Content**:
     - Pickup: Service center address, hours, QR code
     - Delivery: Estimated delivery date/time
     - Final invoice
     - What to bring (payment method, ID)
   - **Recipient**: Customer email

6. **Deadline Reminder** (Various triggers)
   - **Trigger**: 1 day before auto-fallback deadline
   - **Content**:
     - Action required (approval or delivery confirmation)
     - Current deadline
     - Consequence of inaction (auto-fallback behavior)
     - Quick action link
   - **Recipient**: Customer email

**Business Rules**:
- All emails include tracking link to public portal
- Emails use plain language (avoid technical jargon)
- Include service center contact info for questions
- Unsubscribe option not provided (transactional emails)
- Log all sent emails in system (audit trail)

**User Story**:
```
AS A customer
I WANT to receive timely email updates about my service request
SO THAT I stay informed without needing to constantly check the tracking page
```

**Acceptance Criteria**:
- [ ] Email templates for all 6 moments
- [ ] Vietnamese language support
- [ ] Mobile-responsive email design
- [ ] Clear call-to-action buttons
- [ ] Delivery confirmation (read receipts)
- [ ] Retry logic for failed sends

---

## Data Model

### Service Requests Table

```sql
CREATE TABLE service_requests (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token VARCHAR(20) NOT NULL UNIQUE, -- Format: SR-YYYYMMDD-XXXXX

  -- Customer information
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,

  -- Request source
  source VARCHAR(20) NOT NULL CHECK (source IN ('online', 'walk_in')),
  created_by_staff_id UUID REFERENCES profiles(id), -- NULL if online

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'received', 'processing', 'completed', 'cancelled')),

  -- Products and issues (JSON for flexibility)
  expected_products JSONB NOT NULL, -- Array of {serial_number, issue_description}
  actual_products JSONB, -- Filled when received, may differ from expected
  discrepancies TEXT, -- Notes about expected vs actual differences

  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  received_at TIMESTAMP, -- When status → received
  processing_at TIMESTAMP, -- When first ticket created
  completed_at TIMESTAMP, -- When all tickets completed
  updated_at TIMESTAMP DEFAULT now(),

  -- Indexes
  CONSTRAINT tracking_token_format CHECK (tracking_token ~ '^SR-[0-9]{8}-[0-9]{5}$')
);

-- Indexes for performance
CREATE INDEX idx_requests_tracking_token ON service_requests(tracking_token);
CREATE INDEX idx_requests_customer_phone ON service_requests(customer_phone);
CREATE INDEX idx_requests_status ON service_requests(status);
CREATE INDEX idx_requests_created_at ON service_requests(created_at DESC);

-- Auto-update timestamp trigger
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**JSON Schema for expected_products**:
```json
[
  {
    "serial_number": "SN123456789",
    "product_id": "uuid",
    "product_name": "iPhone 14 Pro",
    "warranty_status": "company_warranty",
    "issue_description": "Screen cracked after drop, touch not responding"
  },
  {
    "serial_number": "SN987654321",
    "product_id": "uuid",
    "product_name": "MacBook Pro 16\"",
    "warranty_status": "manufacturer_warranty",
    "issue_description": "Battery draining very fast, only lasts 2 hours"
  }
]
```

---

### Request-Ticket Link Table

```sql
CREATE TABLE request_tickets (
  -- Relationship tracking
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  split_reason TEXT, -- Why this ticket was split from request

  -- Primary key
  PRIMARY KEY (request_id, ticket_id)
);

-- Index for lookups
CREATE INDEX idx_request_tickets_request ON request_tickets(request_id);
CREATE INDEX idx_request_tickets_ticket ON request_tickets(ticket_id);
```

---

### Email Notifications Log Table

```sql
CREATE TABLE email_notifications (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),

  -- Content
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- 'request_confirmation', 'product_received', etc.

  -- Context
  related_request_id UUID REFERENCES service_requests(id),
  related_ticket_id UUID REFERENCES service_tickets(id),

  -- Delivery tracking
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  retry_count INT DEFAULT 0,

  -- Audit
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_notifications_request ON email_notifications(related_request_id);
CREATE INDEX idx_email_notifications_ticket ON email_notifications(related_ticket_id);
CREATE INDEX idx_email_notifications_sent ON email_notifications(sent_at);
```

---

### Service Tickets Extension

```sql
-- Add columns to existing service_tickets table
ALTER TABLE service_tickets
  ADD COLUMN request_id UUID REFERENCES service_requests(id),
  ADD COLUMN expected_issues TEXT, -- Customer's description from request
  ADD COLUMN delivery_method VARCHAR(20)
    CHECK (delivery_method IN ('self_pickup', 'delivery', 'pending')),
  ADD COLUMN delivery_address TEXT,
  ADD COLUMN delivery_preferred_time TIMESTAMP,
  ADD COLUMN customer_confirmed_at TIMESTAMP;

-- Index for request lookups
CREATE INDEX idx_service_tickets_request ON service_tickets(request_id);
```

---

## Business Rules

### BR-SRL-001: Serial Verification Required

**Rule**: All products in a service request must have verified serial numbers before submission.

**Enforcement**:
- Frontend: Disable submit button until all products verified
- Backend: API validation rejects requests with unverified products
- Database: Foreign key constraint ensures products exist

**Exceptions**: None (warranty gate is critical business requirement)

**SQL Implementation**:
```sql
-- Backend validation in tRPC procedure
const verifiedProducts = await Promise.all(
  products.map(p =>
    supabase
      .from('physical_products')
      .select('id, serial_number, product_id, company_warranty_end_date, manufacturer_warranty_end_date')
      .eq('serial_number', p.serial_number)
      .single()
  )
);

if (verifiedProducts.some(p => !p.data)) {
  throw new Error('All serial numbers must be verified before creating request');
}
```

---

### BR-SRL-002: Status Transition Validation

**Rule**: Service request status transitions must follow defined flow. No backwards movement allowed.

**Valid Transitions**:
```
submitted → received
submitted → cancelled
received → processing
processing → completed
```

**Invalid Transitions** (must be rejected):
- `received` → `submitted`
- `completed` → `processing`
- Any transition from `completed` or `cancelled`

**Enforcement**:
```sql
-- Database check constraint
CREATE OR REPLACE FUNCTION validate_request_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Terminal states cannot change
  IF OLD.status IN ('completed', 'cancelled') AND NEW.status != OLD.status THEN
    RAISE EXCEPTION 'Cannot change status from terminal state %', OLD.status;
  END IF;

  -- Validate specific transitions
  IF OLD.status = 'submitted' AND NEW.status NOT IN ('received', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid transition from submitted to %', NEW.status;
  END IF;

  IF OLD.status = 'received' AND NEW.status != 'processing' THEN
    RAISE EXCEPTION 'Invalid transition from received to %', NEW.status;
  END IF;

  IF OLD.status = 'processing' AND NEW.status != 'completed' THEN
    RAISE EXCEPTION 'Invalid transition from processing to %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_request_status_transition
  BEFORE UPDATE OF status ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_request_status_transition();
```

---

### BR-SRL-003: Tracking Token Uniqueness

**Rule**: Each service request must have a unique tracking token in format `SR-YYYYMMDD-XXXXX`.

**Format Specification**:
- Prefix: `SR-`
- Date: `YYYYMMDD` (creation date)
- Sequence: `XXXXX` (5-digit daily sequence starting at 00001)

**Generation Logic**:
```sql
CREATE OR REPLACE FUNCTION generate_request_tracking_token()
RETURNS TRIGGER AS $$
DECLARE
  today_date TEXT;
  sequence_num INT;
  new_token TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_date := to_char(CURRENT_DATE, 'YYYYMMDD');

  -- Find highest sequence number for today
  SELECT COALESCE(
    MAX(
      CAST(
        substring(tracking_token from 'SR-[0-9]{8}-([0-9]{5})')
        AS INTEGER
      )
    ), 0
  ) + 1
  INTO sequence_num
  FROM service_requests
  WHERE tracking_token LIKE 'SR-' || today_date || '-%';

  -- Generate token
  new_token := 'SR-' || today_date || '-' || LPAD(sequence_num::TEXT, 5, '0');

  NEW.tracking_token := new_token;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_request_tracking_token
  BEFORE INSERT ON service_requests
  FOR EACH ROW
  WHEN (NEW.tracking_token IS NULL)
  EXECUTE FUNCTION generate_request_tracking_token();
```

---

### BR-SRL-004: Request-Ticket Relationship Constraints

**Rule**:
- A service request can have 1+ service tickets
- A service ticket can belong to 0-1 service request (walk-in tickets have no request)
- Tickets cannot be created for cancelled requests

**Enforcement**:
```sql
-- Check constraint in application logic (tRPC)
async function createTicketFromRequest(requestId: string) {
  // Verify request is in valid status
  const request = await supabase
    .from('service_requests')
    .select('status')
    .eq('id', requestId)
    .single();

  if (!request.data || request.data.status === 'cancelled') {
    throw new Error('Cannot create ticket from cancelled request');
  }

  if (request.data.status !== 'received') {
    throw new Error('Request must be in received status before creating ticket');
  }

  // Create ticket with request_id reference
  const ticket = await supabase
    .from('service_tickets')
    .insert({
      request_id: requestId,
      // ... other ticket data
    });

  // Update request status to processing
  await supabase
    .from('service_requests')
    .update({ status: 'processing', processing_at: new Date() })
    .eq('id', requestId);
}
```

---

### BR-SRL-005: Auto-Completion Logic

**Rule**: A service request is automatically marked `completed` when ALL related service tickets reach terminal states (`completed`, `cancelled`, `closed`).

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION auto_complete_service_request()
RETURNS TRIGGER AS $$
DECLARE
  req_id UUID;
  pending_tickets INT;
BEGIN
  -- Get the request_id from the updated ticket
  req_id := NEW.request_id;

  -- Skip if ticket has no associated request
  IF req_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count non-terminal tickets for this request
  SELECT COUNT(*)
  INTO pending_tickets
  FROM service_tickets
  WHERE request_id = req_id
    AND status NOT IN ('completed', 'cancelled', 'closed');

  -- If no pending tickets, mark request as completed
  IF pending_tickets = 0 THEN
    UPDATE service_requests
    SET
      status = 'completed',
      completed_at = now()
    WHERE id = req_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_request_completion
  AFTER UPDATE OF status ON service_tickets
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'cancelled', 'closed'))
  EXECUTE FUNCTION auto_complete_service_request();
```

---

### BR-SRL-006: 3-Day Auto-Fallback for Customer Confirmation

**Rule**: If customer does not confirm delivery method within 3 days of service completion, system automatically selects self-pickup.

**Implementation**:
```sql
-- Scheduled job (run daily via cron or pg_cron)
CREATE OR REPLACE FUNCTION auto_fallback_delivery_confirmation()
RETURNS void AS $$
BEGIN
  -- Find tickets awaiting confirmation for 3+ days
  UPDATE service_tickets
  SET
    delivery_method = 'self_pickup',
    status = 'ready_for_pickup',
    updated_at = now()
  WHERE status = 'awaiting_customer_confirmation'
    AND completed_at < now() - INTERVAL '3 days'
    AND delivery_method = 'pending';

  -- Send reminder emails
  INSERT INTO email_notifications (
    recipient_email,
    recipient_name,
    subject,
    body,
    template_type,
    related_ticket_id
  )
  SELECT
    c.email,
    c.name,
    'Reminder: Your device is ready for pickup',
    'Your device has been ready for 3 days. We have automatically scheduled it for self-pickup...',
    'auto_fallback_reminder',
    t.id
  FROM service_tickets t
  JOIN customers c ON t.customer_id = c.id
  WHERE t.status = 'ready_for_pickup'
    AND t.delivery_method = 'self_pickup'
    AND t.updated_at >= now() - INTERVAL '1 hour'; -- Recently updated
END;
$$ LANGUAGE plpgsql;

-- Schedule to run daily at 9 AM
SELECT cron.schedule('auto-fallback-delivery', '0 9 * * *', 'SELECT auto_fallback_delivery_confirmation()');
```

---

## Workflows

### Workflow 1: Online Service Request to Ticket Conversion

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ONLINE SERVICE REQUEST FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

CUSTOMER (Public Portal)                 SYSTEM                        STAFF (Dashboard)

1. Navigate to /request
   ├─> Enter contact info
   └─> Click "Add Product"

2. Enter/scan serial number ──────────> Verify in physical_products DB
                                         │
                                         ├─> Valid: Return product info
                                         │   + warranty status
                                         │
                                         └─> Invalid: Show error
                                             "Serial not recognized"

3. View product details
   ├─> Warranty status displayed
   └─> Enter issue description

4. Add to request
   └─> Repeat for more products

5. Review request summary
   └─> Submit request ───────────────> Generate tracking token
                                        (SR-YYYYMMDD-XXXXX)
                                         │
                                         ├─> Create service_request record
                                         │   status: 'submitted'
                                         │
                                         └─> Send email notification
                                             "Request Confirmation"

6. Receive email with
   tracking link ◄──────────────────── Email sent

7. Ship products to service center
   │
   └─> Products arrive at center ────────────────────────────────────> Reception receives package

8. Staff opens pending requests ◄────────────────────────────────────  Filter: status='submitted'

9. Staff scans tracking token ──────────────────────────────────────>  Load request details
                                                                        │
                                                                        └─> Display expected products

10. Staff scans each product ──────────────────────────────────────>   Compare actual vs expected
                                                                         │
                                                                         ├─> Match: Green checkmark
                                                                         │
                                                                         └─> Mismatch: Red warning
                                                                             ├─> Missing product
                                                                             ├─> Extra product
                                                                             └─> Wrong product

11. IF discrepancies: ◄──────────────────────────────────────────────  Show reconciliation options:
                                                                         [ ] Contact customer
                                                                         [ ] Update request
                                                                         [ ] Reject/cancel

12. Staff confirms receipt ─────────────────────────────────────────>  Update request:
                                                                        ├─> status: 'received'
                                                                        ├─> actual_products: [...]
                                                                        ├─> received_at: now()
                                                                        │
                                                                        └─> Send email notification
                                                                            "Product Received"

13. Receive confirmation email ◄───────────────────────────────────── Email sent

14. Staff clicks "Create Ticket" ──────────────────────────────────>   Open ticket creation form
                                                                        (pre-filled with request data)

15. Staff completes ticket ────────────────────────────────────────>   Create service_ticket:
    ├─> Assign technician                                              ├─> request_id: linked
    ├─> Set priority                                                   ├─> Generate SV-YYYY-NNN
    └─> Confirm                                                        ├─> status: 'pending'
                                                                        │
                                                                        └─> Update request:
                                                                            status: 'processing'

16. Track via public portal ◄──────────────────────────────────────── Request + ticket statuses
    /track/{tracking_token}                                            visible to customer
```

---

### Workflow 2: Walk-In Customer Request

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WALK-IN SERVICE REQUEST FLOW                    │
└─────────────────────────────────────────────────────────────────────┘

CUSTOMER (In-Person)                     STAFF (Reception)                    SYSTEM

1. Customer arrives with
   product(s) needing service

2. Staff greets customer ───────────────> Ask for phone number

3. Provide phone number ────────────────> Search customer by phone ────────> Query customers table
                                                                              │
                                                                              ├─> Found: Load data
                                                                              │
                                                                              └─> Not found: New form

4. Staff verifies/updates ──────────────> Display/edit customer info
   customer details

5. Hand product to staff

6. Staff scans serial number ──────────> Barcode scanner input ──────────> Verify serial in DB
                                                                            │
                                                                            ├─> Valid: Show product
                                                                            │   + warranty status
                                                                            │
                                                                            └─> Invalid: Error
                                                                                Cannot accept product

7. Customer describes issue ───────────> Enter issue description

8. Staff adds product to request ──────> Add to product list
   └─> Repeat for more products

9. Staff reviews summary ──────────────> Click "Create Request & Ticket" ──> Transaction START
                                                                               │
                                                                               ├─> Create service_request:
                                                                               │   ├─ source: 'walk_in'
                                                                               │   ├─ status: 'received'
                                                                               │   ├─ created_by_staff_id
                                                                               │   └─ tracking_token
                                                                               │
                                                                               ├─> Create service_ticket:
                                                                               │   ├─ request_id: linked
                                                                               │   ├─ ticket_number
                                                                               │   └─ status: 'pending'
                                                                               │
                                                                               └─> Transaction COMMIT

10. Staff prints ticket receipt ◄────── Print ticket details
                                         ├─> Tracking number
                                         ├─> Ticket number
                                         ├─> Products listed
                                         └─> QR code for tracking

11. Receive ticket receipt ◄─────────── Hand receipt to customer
    + tracking number

12. Leave products at center

13. Staff stores products ─────────────> Move to appropriate warehouse
                                          (Kho Tạm / Kho Bảo Hành)

14. Customer leaves

15. Customer can track later ──────────────────────────────────────────────> Access /track/{token}
    using tracking number                                                     via web or QR code
```

---

### Workflow 3: Delivery Confirmation Process

```
┌─────────────────────────────────────────────────────────────────────┐
│               CUSTOMER DELIVERY CONFIRMATION FLOW                   │
└─────────────────────────────────────────────────────────────────────┘

TECHNICIAN                    SYSTEM                              CUSTOMER

1. Complete all repairs
   └─> Mark ticket as
       'completed' ────────────> Update ticket:
                                  ├─> status: 'completed'
                                  ├─> completed_at: now()
                                  └─> Trigger notification

                                                                   2. Receive email ◄──────── Send email:
                                                                      "Service Completed"       "Your device is ready"
                                                                      │                         │
                                                                      └─> Click confirmation    └─> Link: /confirm/{token}
                                                                          link

                                                                   3. View service summary:
                                                                      ├─> Services performed
                                                                      ├─> Parts used
                                                                      ├─> Total cost
                                                                      └─> Before/after notes

                                                                   4. Choose delivery method:
                                                                      [ Self Pickup ]
                                                                      [ Request Delivery ]

                              ┌─────────────────────────────────────────────┴─────────────────────────────────────┐
                              │                                                                                   │
                         OPTION A: SELF PICKUP                                                       OPTION B: REQUEST DELIVERY

                   5a. Click "Self Pickup" ───────> Update ticket:                   5b. Click "Request Delivery" ───> Show delivery form:
                                                     ├─> delivery_method:                                              ├─> Address (pre-filled)
                                                     │   'self_pickup'                                                 ├─> Preferred date/time
                                                     ├─> status:                                                       └─> Special instructions
                                                     │   'ready_for_pickup'
                                                     └─> customer_confirmed_at

                   6a. Receive confirmation ◄────── Send email:                      6b. Submit delivery request ────> Validate delivery info
                       email                         "Ready for Pickup"                                                 │
                       ├─> Service center address    ├─> Address + hours                                               └─> Update ticket:
                       ├─> Operating hours           ├─> QR code for pickup                                                ├─> delivery_method:
                       ├─> What to bring             └─> Total amount due                                                  │   'delivery'
                       └─> QR code                                                                                         ├─> delivery_address
                                                                                                                           ├─> delivery_preferred_time
                                                                                                                           └─> status:
                                                                                                                               'ready_for_delivery'

                   7a. Visit service center ────────────────────────────────────────> 7b. Receive confirmation ◄───── Send email:
                       ├─> Show QR code                                                  email                         "Delivery Scheduled"
                       ├─> Verify identity                                               ├─> Estimated delivery time   ├─> Delivery details
                       └─> Pay and receive device                                        └─> Contact for changes       └─> Total amount due

                   8a. Staff scans QR code ─────> Verify customer                    8b. Staff schedules delivery ──> Create delivery task
                                                   └─> Mark as picked up                  └─> Assign delivery staff

                                                                                      9b. Staff delivers product ────> Update ticket:
                                                                                          ├─> Customer signs receipt       └─> status: 'closed'
                                                                                          ├─> Collect payment
                                                                                          └─> Complete delivery

                              └────────────────────────────────┬───────────────────────────────────────────────────────┘
                                                                │
                                            NO RESPONSE SCENARIO (3+ days)

                                                Auto-fallback ◄────────── Scheduled job runs daily:
                                                triggers                    │
                                                                            ├─> Find tickets in
                                                                            │   'awaiting_customer_confirmation'
                                                                            │   older than 3 days
                                                                            │
                                                                            └─> Update tickets:
                                                                                ├─> delivery_method: 'self_pickup'
                                                                                ├─> status: 'ready_for_pickup'
                                                                                └─> Send reminder email

                                                Customer receives ◄───────── Send email:
                                                reminder email                 "Auto-selected Self Pickup"
                                                                               ├─> Reason: No response
                                                                               ├─> Pickup instructions
                                                                               └─> Contact to change
```

---

## UI/UX Requirements

### Public Service Request Form (/request)

**Layout**: Multi-step wizard (responsive design)

**Step 1: Contact Information**
```
┌─────────────────────────────────────────────────┐
│  Create Service Request                         │
│                                                  │
│  Step 1 of 4: Your Information                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Full Name *                                     │
│  ┌─────────────────────────────────────────┐   │
│  │ Nguyễn Văn A                             │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Phone Number *                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ 0909 123 456                             │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Email *                                         │
│  ┌─────────────────────────────────────────┐   │
│  │ nguyenvana@email.com                     │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Address (optional)                              │
│  ┌─────────────────────────────────────────┐   │
│  │ 123 Nguyen Trai, District 1, HCMC       │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│                       [ Next Step → ]            │
└─────────────────────────────────────────────────┘
```

**Step 2: Add Products**
```
┌─────────────────────────────────────────────────┐
│  Create Service Request                         │
│                                                  │
│  Step 2 of 4: Add Products                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Serial Number *                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ SN123456789                    🔍        │   │  ← Real-time verification
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ✅ Product Found:                              │
│  ┌─────────────────────────────────────────┐   │
│  │ 📱 iPhone 14 Pro (Apple)                │   │
│  │ Warranty: Under Company Warranty         │   │
│  │ Valid until: Dec 31, 2025                │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Describe the issue *                            │
│  ┌─────────────────────────────────────────┐   │
│  │ Screen cracked after drop. Touch not    │   │
│  │ responding on right side.                │   │
│  │                                           │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [ + Add This Product ]                          │
│                                                  │
│  ─────────────────────────────────────────────  │
│  Products Added (1):                             │
│  • iPhone 14 Pro (SN123456789)            [×]   │
│                                                  │
│  [ + Add Another Product ]                       │
│                                                  │
│  [ ← Back ]              [ Next Step → ]        │
└─────────────────────────────────────────────────┘
```

**Step 3: Review & Submit**
```
┌─────────────────────────────────────────────────┐
│  Create Service Request                         │
│                                                  │
│  Step 3 of 4: Review Your Request               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Your Information:                               │
│  • Nguyễn Văn A                                  │
│  • 0909 123 456                                  │
│  • nguyenvana@email.com                          │
│                                                  │
│  Products for Service:                           │
│  ┌─────────────────────────────────────────┐   │
│  │ 1. iPhone 14 Pro                         │   │
│  │    Serial: SN123456789                   │   │
│  │    Warranty: Company (until Dec 31, 2025)│   │
│  │    Issue: Screen cracked after drop...   │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Next Steps:                                     │
│  1. Submit this request                          │
│  2. Ship your product to our service center      │
│  3. We'll notify you when received               │
│  4. Track status with your unique number         │
│                                                  │
│  Estimated diagnosis time: 24-48 hours           │
│                                                  │
│  [ ← Back ]              [ Submit Request ]      │
└─────────────────────────────────────────────────┘
```

**Step 4: Confirmation**
```
┌─────────────────────────────────────────────────┐
│  ✅ Request Created Successfully!               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Your Tracking Number:                           │
│  ┌─────────────────────────────────────────┐   │
│  │  SR-20251022-00001                       │   │  ← Large, copyable text
│  │  [Copy]                                   │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  📧 We've sent a confirmation email to:         │
│     nguyenvana@email.com                         │
│                                                  │
│  🎯 Next Steps:                                 │
│  1. Ship your products to:                       │
│     SSTC Service Center                          │
│     123 Nguyen Trai St, District 1               │
│     Ho Chi Minh City                             │
│                                                  │
│  2. Include your tracking number in the package  │
│                                                  │
│  3. Track your request status:                   │
│     [ View Tracking Page ]                       │
│                                                  │
│  📞 Questions? Call us: 028 1234 5678           │
│                                                  │
│  [ Create Another Request ]                      │
└─────────────────────────────────────────────────┘
```

---

### Staff Request Management Interface

**Pending Requests Dashboard**
```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  Pending Service Requests                                       🔄 Refresh  [+New] │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  Filters: [All] [Submitted] [Received]    Search: ┌──────────────────┐  🔍       │
│                                                     │                  │            │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  Tracking #        Customer        Products  Status       Created      Actions    │
│  ─────────────────────────────────────────────────────────────────────────────   │
│  SR-20251022-00001 Nguyễn Văn A    2 items   Submitted    2h ago      [View]     │
│                    0909123456                                           [Receive]  │
│                                                                                    │
│  SR-20251022-00002 Trần Thị B      1 item    Received     5h ago      [View]     │
│                    0908765432                                           [Ticket]   │
│                                                                                    │
│  SR-20251021-00045 Lê Văn C        3 items   Submitted    1d ago      [View]     │
│                    0907654321                                           [Receive]  │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

**Product Reconciliation Screen** (when clicking "Receive")
```
┌───────────────────────────────────────────────────────────────────┐
│  Receive Products - SR-20251022-00001                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Customer: Nguyễn Văn A (0909123456)                              │
│  Created: Oct 22, 2025 10:30 AM                                   │
│                                                                    │
│  Expected Products (from online request):                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 1. ✅ iPhone 14 Pro (SN123456789)                         │  │
│  │    Issue: Screen cracked, touch not responding             │  │
│  │                                                              │  │
│  │ 2. ❌ MacBook Pro 16" (SN987654321)                       │  │  ← Missing
│  │    Issue: Battery draining fast                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Scan Received Products:                                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Serial Number:                                    [Scan]    │  │
│  │ ┌──────────────────────────────────────┐                   │  │
│  │ │ _                                     │ ← Barcode input  │  │
│  │ └──────────────────────────────────────┘                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Scanned Products:                                                 │
│  • ✅ iPhone 14 Pro (SN123456789) - Matches expected             │
│                                                                    │
│  ⚠️  Discrepancies Found:                                         │
│  • MacBook Pro 16" (SN987654321) - NOT RECEIVED                   │
│                                                                    │
│  Notes:                                                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Customer only sent iPhone, will ship MacBook later         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [ Contact Customer ]  [ Update Request ]  [ Confirm Receipt ]    │
└───────────────────────────────────────────────────────────────────┘
```

---

### Public Tracking Page (/track/{token})

```
┌─────────────────────────────────────────────────┐
│  🔍 Track Your Service Request                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Tracking #: SR-20251022-00001                  │
│  Status: Processing                              │
│                                                  │
│  ◉───────◉───────●───────○                      │  ← Progress bar
│  Submitted Received Processing Completed          │
│                                                  │
│  ───────────────────────────────────────────────│
│                                                  │
│  Your Information:                               │
│  • Nguyễn Văn A                                  │
│  • 0909 123 456                                  │
│  • nguyenvana@email.com                          │
│                                                  │
│  Products in Service:                            │
│  ┌─────────────────────────────────────────┐   │
│  │ 📱 iPhone 14 Pro (SN123456789)          │   │
│  │                                           │   │
│  │ Service Ticket: SV-2025-001               │   │
│  │ Status: In Diagnosis                      │   │
│  │ Assigned to: Technician Minh              │   │
│  │                                           │   │
│  │ Timeline:                                 │   │
│  │ • Oct 22, 10:30 - Request created         │   │
│  │ • Oct 22, 14:00 - Received at center      │   │
│  │ • Oct 22, 15:30 - Diagnosis started       │   │
│  │                                           │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Estimated Completion: Oct 24, 2025              │
│                                                  │
│  📧 Email Notifications:                        │
│  We'll notify you at key milestones              │
│                                                  │
│  📞 Questions?                                  │
│  Call: 028 1234 5678                             │
│  Email: support@sstc.com                         │
│                                                  │
│  [ Download Receipt ]  [ Print ]                 │
└─────────────────────────────────────────────────┘
```

---

## Edge Cases & Error Handling

### EC-SRL-001: Serial Number Not Found

**Scenario**: Customer enters serial number not in system database.

**Behavior**:
- Display clear error: "Serial number not recognized. Please check and try again."
- Suggest alternatives:
  - "Is this a product purchased from us? Contact support."
  - "Check if serial number is entered correctly"
- Prevent request creation until all serials verified

**Business Impact**: Prevents non-warranty products from entering service queue.

---

### EC-SRL-002: Expired Warranty Serial Number

**Scenario**: Customer enters valid serial but warranty expired.

**Behavior**:
- Allow request creation (paid service possible)
- Display warning: "⚠️ Warranty expired. Service will be charged."
- Show warranty end dates clearly
- Continue to request creation

**Business Impact**: Manages customer expectations early about costs.

---

### EC-SRL-003: Duplicate Tracking Token (Collision)

**Scenario**: Generated tracking token already exists (highly unlikely but possible).

**Behavior**:
- Retry generation with incremented sequence
- Maximum 3 retries
- If still fails, alert system admin and show user error

**Technical Implementation**:
```typescript
async function generateUniqueTrackingToken(retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    const token = await generateToken(); // SR-YYYYMMDD-XXXXX
    const exists = await checkTokenExists(token);
    if (!exists) return token;
  }
  throw new Error('Unable to generate unique tracking token');
}
```

---

### EC-SRL-004: Customer Never Ships Products

**Scenario**: Customer creates online request but never ships products.

**Behavior**:
- Request remains in `submitted` status
- No automatic cancellation (may ship late)
- Admin can manually cancel stale requests
- Consider weekly cleanup job for requests older than 30 days in `submitted`

**Business Impact**: Prevents database clutter, maintains accurate metrics.

---

### EC-SRL-005: Products Received Don't Match Request

**Scenario**: Customer ships different products than listed in online request.

**Behavior**:
- Reconciliation screen shows discrepancies:
  - Missing products (expected but not received)
  - Extra products (received but not expected)
  - Wrong products (different serial than expected)
- Staff options:
  1. Contact customer for clarification
  2. Update request to match actual products
  3. Reject products and cancel request

**Business Rule**: Staff MUST acknowledge discrepancies before proceeding.

---

### EC-SRL-006: Email Delivery Failure

**Scenario**: Email notification fails to send (invalid email, server error).

**Behavior**:
- Log failure in `email_notifications` table
- Retry up to 3 times with exponential backoff
- If all retries fail:
  - Flag in admin dashboard
  - Staff manually contacts customer
  - SMS fallback (if implemented)

**Monitoring**: Daily report of failed email deliveries.

---

### EC-SRL-007: Request Created During Offline Mode

**Scenario**: System offline, customer fills form, submits when connection restored.

**Behavior** (if offline support implemented):
- Browser stores request in localStorage
- Show message: "Offline. Request will submit when connection restored."
- Auto-submit when online detected
- Generate tracking token server-side (not client-side)

**Alternative**: Show error if offline, ask customer to retry later.

---

### EC-SRL-008: Customer Loses Tracking Number

**Scenario**: Customer cannot find tracking number email or receipt.

**Behavior**:
- Public "Find My Request" page
- Lookup by: Phone + Email (verification)
- Security: Send tracking link to registered email (don't display directly)
- Rate limiting: Max 3 lookups per hour per phone/email

---

### EC-SRL-009: Multi-Product Request, Some Completed Before Others

**Scenario**: Request split into 2 tickets, one completes before the other.

**Behavior**:
- Request remains in `processing` status until ALL tickets completed
- Tracking page shows individual ticket statuses
- Customer receives completion email only when ALL done
- Exception: If split was intentional, may send partial completion emails

---

## Success Metrics

### Operational Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Online Request Adoption | 40% of total requests within 3 months | `COUNT(source='online') / COUNT(*) * 100` |
| Request-to-Ticket Conversion Time | < 2 hours (for received requests) | `AVG(processing_at - received_at)` |
| Serial Verification Error Rate | < 5% | `COUNT(failed verifications) / COUNT(attempts)` |
| Email Delivery Success | > 98% | `COUNT(delivered) / COUNT(sent) * 100` |
| Customer Tracking Page Views | > 60% of requests | `COUNT(tracking_page_views) / COUNT(requests)` |

### Customer Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Customer Confirmation Response Rate | > 70% within 24 hours | `COUNT(confirmed < 24h) / COUNT(total)` |
| Auto-Fallback Frequency | < 20% | `COUNT(auto_fallback) / COUNT(confirmations)` |
| Product Discrepancy Rate | < 10% | `COUNT(actual != expected) / COUNT(requests)` |
| Average Request Creation Time | < 5 minutes | User analytics on form completion time |

### Business Impact Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Reduction in Reception Workload | 30% time savings per request | Staff time tracking comparison |
| Warranty Rejection Rate | Track baseline → optimize | `COUNT(expired_warranty) / COUNT(verifications)` |
| Customer Satisfaction (NPS) | > 8.0 | Post-service survey |

---

## Open Questions & Future Considerations

### Q1: SMS Notifications as Fallback?

**Question**: Should we implement SMS notifications for critical moments if email fails?

**Considerations**:
- Cost per SMS
- Customer phone number validation
- Which notifications warrant SMS (all 6 or just critical ones?)

**Recommendation**: Phase 2 feature, implement for critical notifications only (diagnosis approval, ready for pickup).

---

### Q2: Multi-Language Support?

**Question**: Support both Vietnamese and English in public portal?

**Current**: Vietnamese default (customer base)

**Future**: Add language toggle if international customers increase.

---

### Q3: Request Editing After Submission?

**Question**: Allow customers to edit requests after submission but before receipt?

**Current**: No editing allowed (prevents fraud/confusion)

**Alternative**: Allow cancel + recreate if needed.

---

### Q4: Barcode Format Standardization?

**Question**: Should system generate printable barcode labels for products without manufacturer barcodes?

**Scenario**: Some products may not have scannable serial barcodes.

**Recommendation**: Print QR codes containing serial numbers at reception for easy scanning.

---

### Q5: Request Templates for Repeat Customers?

**Question**: Save customer's previous requests as templates for faster creation?

**Example**: Customer who regularly services multiple devices.

**Recommendation**: Phase 2 feature, "Create request like last time" option.

---

## Appendix: API Endpoints

### Public API (No Auth Required)

```typescript
// Serial verification
POST /api/public/verify-serial
Body: { serial_number: string }
Response: { valid: boolean, product?: ProductInfo }

// Create service request
POST /api/public/requests
Body: { customer: CustomerInfo, products: ProductInfo[] }
Response: { tracking_token: string, request_id: string }

// Track service request
GET /api/public/track/:tracking_token
Response: { request: RequestDetails, tickets: TicketDetails[] }

// Confirm delivery method
POST /api/public/confirm-delivery/:tracking_token
Body: { method: 'self_pickup' | 'delivery', delivery_info?: DeliveryInfo }
Response: { success: boolean }

// Lookup lost tracking number
POST /api/public/find-request
Body: { phone: string, email: string }
Response: { success: boolean, message: string } // Sends email, doesn't return token
```

### Staff API (Auth Required)

```typescript
// List pending requests
GET /api/requests?status=submitted
Response: { requests: RequestSummary[] }

// Get request details
GET /api/requests/:id
Response: { request: RequestDetails, expected_products: Product[], actual_products?: Product[] }

// Mark request as received
PATCH /api/requests/:id/receive
Body: { actual_products: Product[], discrepancies?: string }
Response: { request: RequestDetails }

// Create ticket from request
POST /api/requests/:id/create-ticket
Body: { ticket_data: TicketCreateInput, split?: boolean }
Response: { ticket: TicketDetails }

// Cancel request
PATCH /api/requests/:id/cancel
Body: { reason: string }
Response: { request: RequestDetails }
```

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-22 | Mary (BA Agent) | Initial requirements document based on elicitation sessions Q13-Q19 |

---

**End of Document**
