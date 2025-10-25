# Public Service Request Portal

**Feature Documentation**
**Stories:** 1.11 - 1.14 (Public Portal, Tracking, Staff Management, Delivery)
**Created:** 2025-10-24
**Status:** Production Ready

---

## Overview

The Public Service Request Portal provides customers with a self-service interface to submit warranty service requests online without requiring authentication. The system enables anonymous submissions, tracks requests through a unique token system, and integrates with the internal staff workflow for request review and ticket conversion.

### Key Capabilities

- **Anonymous Warranty Requests**: Customers submit requests with serial number verification
- **Real-time Tracking**: Token-based tracking without authentication
- **Staff Management**: Internal dashboard for request review and conversion
- **Ticket Integration**: Seamless conversion of requests to service tickets
- **Email Notifications**: Automated updates at each stage (Story 1.15)
- **Rate Limiting**: Protection against abuse (10 requests per minute per IP)
- **Spam Protection**: Honeypot fields and validation

### Business Value

- Reduces walk-in traffic by enabling online submissions
- Provides 24/7 request intake capability
- Improves customer experience with transparent tracking
- Integrates public requests into existing workflow
- Maintains security through token-based access

---

## Customer Journey

### Phase 1: Warranty Verification

**Route:** `/service-request`

**User Flow:**
1. Customer navigates to public portal
2. Enters product serial number (e.g., "ABC123456")
3. System verifies serial against `physical_products` table
4. Displays warranty status with details:
   - Product name and brand
   - Warranty status: active, expiring_soon, or expired
   - Days remaining until expiration
   - Eligibility message

**Technical Implementation:**
```typescript
// tRPC procedure: serviceRequest.verifyWarranty
// Queries physical_products with warranty calculation
const warrantyStatus = getWarrantyStatus(warrantyEndDate);
const daysRemaining = getRemainingDays(warrantyEndDate);
const eligible = warrantyStatus === 'active' || warrantyStatus === 'expiring_soon';
```

**Validation Rules:**
- Serial number: minimum 5 characters, alphanumeric
- Case-insensitive search (converted to uppercase)
- Read-only query (no data modification)

### Phase 2: Request Submission

**User Flow:**
1. After warranty verification, customer proceeds to request form
2. Completes required fields:
   - Full name (minimum 2 characters)
   - Email (validated format)
   - Phone number (minimum 10 digits)
   - Problem description (minimum 20 characters)
   - Delivery method: pickup or delivery
   - Delivery address (conditional, required if delivery selected)

3. Hidden honeypot field for spam protection
4. Submits request

**Technical Implementation:**
```typescript
// tRPC procedure: serviceRequest.submit
// Validation schema with Zod
const submitRequestSchema = z.object({
  serial_number: z.string().min(5).regex(/^[A-Z0-9_-]+$/i),
  customer_name: z.string().min(2),
  customer_email: z.string().email(),
  customer_phone: z.string().min(10),
  problem_description: z.string().min(20),
  preferred_delivery_method: z.enum(['pickup', 'delivery']),
  delivery_address: z.string().optional(),
  honeypot: z.string().optional(),
});
```

**Spam Protection:**
- Honeypot field check (reject if filled)
- Rate limiting at API gateway level
- Serial number verification before submission

**Database Actions:**
1. Create record in `service_requests` table
2. Trigger auto-generates tracking token (format: `SR-XXXXXXXXXXXX`)
3. Status set to `submitted`
4. Timestamp recorded in `created_at`

### Phase 3: Confirmation

**Route:** `/service-request/success?token={tracking_token}`

**Display:**
- Large, prominent tracking token
- Copy-to-clipboard functionality
- Instructions to save token
- Link to tracking page
- Expected timeline information

**Technical Implementation:**
```typescript
// Tracking token generation (PostgreSQL trigger)
CREATE TRIGGER trigger_generate_service_request_tracking_token
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tracking_token();

// Format: SR-[12 random alphanumeric characters]
// Example: SR-A8K3N9P2X7Q5
```

### Phase 4: Request Tracking

**Route:** `/service-request/track` or `/service-request/track?token={token}`

**User Flow:**
1. Customer enters tracking token or arrives via URL parameter
2. System queries `service_requests` table by tracking token
3. Displays request status and timeline
4. Auto-refreshes every 30 seconds when page is active

**Information Displayed:**
- **Status Timeline**: Visual progress indicator
  - Submitted (timestamp)
  - Received (if reviewed by staff)
  - Processing (if converted to ticket)
  - Completed (if service finished)

- **Product Information**:
  - Brand and model
  - Serial number

- **Customer Information** (privacy-masked):
  - Full name (not masked)
  - Email (masked: first 3 chars + `***@domain.com`)
  - Phone (masked: last 4 digits only)

- **Request Details**:
  - Problem description
  - Delivery method and address
  - Submission timestamp

- **Linked Ticket** (if converted):
  - Ticket number
  - Current ticket status

**Privacy Masking Implementation:**
```typescript
// Email masking: show first 3 chars + ***@domain
const maskedEmail = email.replace(
  /^(.{3})(.*)(@.*)$/,
  (_, p1, p2, p3) => p1 + '*'.repeat(Math.min(p2.length, 10)) + p3
);

// Phone masking: show last 4 digits only
const maskedPhone = phone.replace(
  /^(.*)(.{4})$/,
  (_, p1, p2) => '*'.repeat(p1.length) + p2
);
```

**Auto-refresh:**
```typescript
// React Query configuration
const { data, refetch } = useTrackServiceRequest(
  { tracking_token: token },
  {
    enabled: shouldFetch,
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: false,
  }
);
```

---

## Staff Workflows

### Staff Dashboard Access

**Route:** `/dashboard/service-requests`

**Permissions:** Admin, Manager, Reception roles

**Features:**
- Tabular list of pending requests
- Status filters: Submitted, Received, Processing
- Search by tracking token, customer name, or serial number
- Pagination (50 records per page)
- Badge counter showing pending count in navigation

### Request Review Workflow

**Step 1: View Request Queue**

Display columns:
- Tracking token (clickable)
- Customer name
- Product brand and model
- Serial number
- Submission date (relative time)
- Status badge
- Quick actions: View Details, Accept, Reject

**Step 2: Review Request Details**

Modal displays complete information:
- Customer contact details (unmasked)
- Product verification results
- Full problem description
- Delivery preferences
- Request metadata (IP address, user agent)

**Step 3: Decision Actions**

**Option A: Accept Request**
```typescript
// tRPC procedure: serviceRequest.updateStatus
await updateStatus({
  request_id: requestId,
  status: 'received',
});
// Sets reviewed_at timestamp
// Sends email notification (Story 1.15)
```

**Option B: Reject Request**
```typescript
// tRPC procedure: serviceRequest.reject
await rejectRequest({
  request_id: requestId,
  rejection_reason: reason,
});
// Sets status to 'rejected'
// Records rejection_reason and rejected_by_id
// Sends rejection email with reason (Story 1.15)
```

**Option C: Convert to Ticket** (see below)

### Request to Ticket Conversion

**Purpose:** Transform validated service request into internal service ticket

**Pre-conversion Actions:**
1. Staff reviews request details
2. Verifies product information
3. Confirms customer eligibility
4. Selects service type (warranty/paid)
5. Assigns priority level

**Conversion Process:**

```typescript
// tRPC procedure: serviceRequest.convertToTicket
const result = await convertToTicket({
  request_id: requestId,
  customer_id: customerId, // Optional: override or auto-match
  service_type: 'warranty',
  priority: 'normal',
  additional_notes: 'Staff comments...',
});
```

**Automatic Actions:**
1. **Customer Management**:
   - Search for existing customer by email
   - If found: link to existing customer record
   - If not found: create new customer record with request data

2. **Product Lookup**:
   - Query `physical_products` by serial number
   - Extract `product_id` for ticket linkage

3. **Ticket Creation**:
   - Create record in `service_tickets` table
   - Pre-populate fields from request:
     - `customer_id`
     - `product_id`
     - `serial_number`
     - `problem_description`
     - `preferred_delivery_method`
     - `delivery_address`
   - Set `status = 'pending'`
   - Record `created_by_id` as staff member

4. **Initial Comment**:
   - Add comment to `service_ticket_comments`
   - Include original request tracking token
   - Copy problem description
   - Add any staff notes

5. **Request Update**:
   - Set `request.ticket_id = ticket.id`
   - Update `status = 'processing'`
   - Record `converted_at` timestamp

6. **Notifications**:
   - Send "Ticket Created" email to customer (Story 1.15)
   - Include both tracking token and ticket number

**Post-conversion:**
- Request remains in tracking system
- Ticket follows normal workflow (Story 1.3 tasks)
- Customer can track both request and ticket

### Delivery Confirmation Flow (Story 1.14)

**Scenario:** Customer selected "delivery" method during submission

**When Ticket Completes:**
1. Staff marks ticket as `completed`
2. System checks `preferred_delivery_method = 'delivery'`
3. Sends delivery confirmation email with:
   - Estimated delivery date
   - Tracking information (if applicable)
   - Contact information

**Technical Implementation:**
```typescript
// In ticket completion workflow
if (ticket.preferred_delivery_method === 'delivery') {
  await sendEmailNotification(
    ctx,
    'delivery_confirmed',
    customer.email,
    customer.name,
    {
      ticketNumber: ticket.ticket_number,
      deliveryDate: estimatedDate,
      deliveryAddress: ticket.delivery_address,
    },
    null,
    ticket.id
  );
}
```

---

## Security Considerations

### Authentication & Authorization

**Public Endpoints:**
- `serviceRequest.verifyWarranty` - No auth required
- `serviceRequest.submit` - No auth required
- `serviceRequest.track` - No auth required (token-based)

**Staff Endpoints:**
- `serviceRequest.listPending` - Requires authentication + role check
- `serviceRequest.getDetails` - Requires authentication + role check
- `serviceRequest.updateStatus` - Requires authentication + role check
- `serviceRequest.convertToTicket` - Requires authentication + role check
- `serviceRequest.reject` - Requires authentication + role check
- `serviceRequest.getPendingCount` - Requires authentication

**Role-Based Access Control:**
```typescript
// Middleware check in tRPC procedures
const { profile } = await getAuthenticatedUserWithRole(ctx);

if (!['admin', 'manager', 'reception'].includes(profile.role)) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Access denied. Admin, manager, or reception role required.',
  });
}
```

### Rate Limiting

**Configuration:**
- **Public Submissions**: 10 requests per minute per IP address
- **Email Notifications**: 100 emails per day per customer
- **Tracking Lookups**: Unlimited (read-only)

**Implementation:**
```typescript
// Email rate limiting check
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const { count } = await supabaseAdmin
  .from('email_notifications')
  .select('id', { count: 'exact', head: true })
  .eq('recipient_email', recipientEmail)
  .gte('created_at', oneDayAgo);

if (count && count >= 100) {
  console.log(`[EMAIL SKIPPED] Rate limit exceeded for ${recipientEmail}`);
  return { success: false, reason: 'rate_limit' };
}
```

### Spam Protection

**Honeypot Field:**
- Hidden input field named "website"
- CSS positioned off-screen: `position: absolute; left: -9999px`
- Bots typically auto-fill all fields
- Rejection if honeypot contains value

**Implementation:**
```typescript
// Server-side check
if (input.honeypot && input.honeypot.length > 0) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Invalid submission detected',
  });
}
```

### Data Privacy

**Public Tracking:**
- No authentication required
- Customer data masked in tracking results
- Only tracking token holder can view request

**Staff Access:**
- Full customer data visible to authenticated staff
- Audit trail: `reviewed_by_id`, `rejected_by_id`
- IP address and user agent logged for security

**RLS Policies:**
```sql
-- Public can INSERT but not SELECT
CREATE POLICY service_requests_public_insert
  ON public.service_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Staff can SELECT their assigned requests
CREATE POLICY service_requests_staff_select
  ON public.service_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager', 'reception')
    )
  );
```

### Input Validation

**Client-side (Real-time feedback):**
- Serial format: alphanumeric, min 5 characters
- Email format: standard email regex
- Phone format: 10+ digits
- Description: min 20 characters

**Server-side (Zod schemas):**
- All inputs validated before database insertion
- Type coercion: serial numbers converted to uppercase
- Sanitization: trim whitespace, remove special characters
- Length constraints enforced

---

## Technical Implementation

### Database Schema

**Table: `service_requests`**

Key columns:
- `id` (UUID, primary key)
- `tracking_token` (VARCHAR(15), unique, auto-generated)
- Customer fields: `customer_name`, `customer_email`, `customer_phone`
- Product fields: `product_brand`, `product_model`, `serial_number`
- `issue_description` (TEXT)
- `issue_photos` (JSONB array of storage URLs)
- `service_type` (ENUM: warranty, paid, replacement)
- `delivery_method` (ENUM: pickup, delivery)
- `delivery_address` (TEXT, conditional)
- Status tracking: `status`, `reviewed_by_id`, `reviewed_at`
- Ticket linkage: `ticket_id`, `converted_at`
- Rejection: `rejection_reason`, `rejected_at`, `rejected_by_id`
- Metadata: `submitted_ip`, `user_agent`, `created_at`, `updated_at`

**Constraints:**
```sql
-- Rejection requires reason
CONSTRAINT service_requests_rejected_requires_reason CHECK (
  status != 'cancelled' OR rejection_reason IS NOT NULL
)

-- Completion requires ticket
CONSTRAINT service_requests_converted_requires_ticket CHECK (
  status != 'completed' OR ticket_id IS NOT NULL
)

-- Delivery requires address
CONSTRAINT service_requests_delivery_requires_address CHECK (
  delivery_method != 'delivery' OR delivery_address IS NOT NULL
)
```

**Indexes:**
```sql
CREATE INDEX idx_service_requests_tracking_token ON service_requests(tracking_token);
CREATE INDEX idx_service_requests_email ON service_requests(customer_email);
CREATE INDEX idx_service_requests_phone ON service_requests(customer_phone);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_created ON service_requests(created_at DESC);
CREATE INDEX idx_service_requests_pending ON service_requests(status, created_at DESC)
  WHERE status IN ('submitted', 'received');
```

**Triggers:**
```sql
-- Auto-generate tracking token
CREATE TRIGGER trigger_generate_service_request_tracking_token
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tracking_token();

-- Auto-update updated_at
CREATE TRIGGER trigger_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### tRPC API Endpoints

**Public Procedures:**

1. **`serviceRequest.verifyWarranty`**
   - Input: `{ serial_number: string }`
   - Output: Warranty status, product details, eligibility
   - Authentication: None required
   - Rate limit: None (read-only)

2. **`serviceRequest.submit`**
   - Input: Customer and product details
   - Output: `{ tracking_token, request_id }`
   - Authentication: None required
   - Rate limit: 10/min per IP
   - Side effects: Creates request, sends email

3. **`serviceRequest.track`**
   - Input: `{ tracking_token: string }`
   - Output: Request details with masked customer data
   - Authentication: None required
   - Rate limit: None (read-only)

**Staff Procedures:**

4. **`serviceRequest.listPending`**
   - Input: `{ status?, search?, limit, offset }`
   - Output: Paginated request list with count
   - Authentication: Required (admin, manager, reception)
   - Filters: Status, search by token/name/serial

5. **`serviceRequest.getDetails`**
   - Input: `{ request_id: UUID }`
   - Output: Complete request details
   - Authentication: Required (admin, manager, reception)

6. **`serviceRequest.updateStatus`**
   - Input: `{ request_id: UUID, status: 'received' | 'processing' }`
   - Output: Updated request
   - Authentication: Required (admin, manager, reception)
   - Side effects: Updates timestamp, sends email

7. **`serviceRequest.convertToTicket`**
   - Input: `{ request_id, customer_id?, service_type, priority, additional_notes? }`
   - Output: Created ticket with details
   - Authentication: Required (admin, manager, reception)
   - Side effects: Creates ticket, links request, sends email

8. **`serviceRequest.reject`**
   - Input: `{ request_id: UUID, rejection_reason: string }`
   - Output: Updated request
   - Authentication: Required (admin, manager, reception)
   - Side effects: Marks rejected, sends email

9. **`serviceRequest.getPendingCount`**
   - Input: None
   - Output: Integer count
   - Authentication: Required (any staff)
   - Used for: Navigation badge counter

### Email Notifications (Story 1.15)

**Email Types:**

1. **`request_submitted`**: Sent immediately after submission
   - Includes tracking token and instructions
   - Estimated review timeline

2. **`request_received`**: Sent when staff marks as "received"
   - Confirmation that request is under review
   - Expected next steps

3. **`ticket_created`**: Sent after conversion to ticket
   - Includes both tracking token and ticket number
   - Service timeline information

4. **`request_rejected`**: Sent if request is rejected
   - Includes rejection reason
   - Guidance on next steps

5. **`delivery_confirmed`**: Sent when service completed with delivery
   - Estimated delivery date
   - Tracking information

**Email Notification System:**
```typescript
async function sendEmailNotification(
  ctx: TRPCContext,
  emailType: EmailType,
  recipientEmail: string,
  recipientName: string,
  context: EmailContext,
  serviceRequestId?: string,
  serviceTicketId?: string
) {
  // Rate limit check (100/day per customer)
  // Email preference check (opt-out support)
  // Generate email content from template
  // Log to email_notifications table
  // Send via email service (async)
  // Update status (sent/failed)
}
```

**Table: `email_notifications`**
- Audit trail for all emails sent
- Status tracking: pending, sent, delivered, failed
- Retry mechanism for failed emails (max 3 attempts)
- Related entity linking (request or ticket)

### UI Components

**Public Components:**

1. **`/app/(public)/service-request/page.tsx`**
   - Multi-step form: Verify → Details → Submit
   - Warranty verification step with status display
   - Request details form with validation
   - Delivery method selection

2. **`/app/(public)/service-request/success/page.tsx`**
   - Prominent tracking token display
   - Copy-to-clipboard functionality
   - Next steps information

3. **`/app/(public)/service-request/track/page.tsx`**
   - Tracking token input
   - Auto-populate from URL parameter
   - Status timeline component
   - Request details display
   - Auto-refresh every 30 seconds

**Shared Components:**

4. **`RequestStatusTimeline`** (`src/components/shared/request-status-timeline.tsx`)
   - Visual progress indicator
   - Timeline steps: Submitted → Received → Processing → Completed
   - Timestamp display for completed steps

5. **`StatusMessage`** (`src/components/shared/status-message.tsx`)
   - Status-specific messages
   - Color-coded alerts
   - Action guidance

**Staff Components:**

6. **`ServiceRequestsTable`** (staff dashboard)
   - Sortable, filterable table
   - Pagination controls
   - Quick action buttons
   - Status badges

7. **`RequestDetailModal`**
   - Full request information display
   - Product verification results
   - Customer contact details
   - Action buttons (Accept, Reject, Convert)

8. **`ConvertToTicketModal`**
   - Pre-populated ticket form
   - Service type selection
   - Priority assignment
   - Additional notes field

9. **`RejectRequestModal`**
   - Rejection reason textarea
   - Common reasons dropdown
   - Confirmation with warning

### Custom Hooks

**Public Hooks:**
- `useVerifyWarranty()` - Warranty verification mutation
- `useSubmitServiceRequest()` - Request submission mutation
- `useTrackServiceRequest()` - Tracking query with auto-refresh

**Staff Hooks:**
- `usePendingRequests()` - List query with filters
- `useRequestDetails()` - Single request query
- `useUpdateRequestStatus()` - Status update mutation
- `useConvertToTicket()` - Ticket conversion mutation
- `useRejectRequest()` - Rejection mutation
- `usePendingCount()` - Badge counter query

---

## Best Practices

### For Customers

**Submitting Requests:**
1. Have your product serial number ready
2. Verify warranty status before submitting
3. Provide detailed problem description (min 20 characters)
4. Double-check contact information (email and phone)
5. Save your tracking token immediately
6. Check email for confirmation

**Tracking Requests:**
1. Use the exact tracking token from confirmation email
2. Bookmark the tracking page for easy access
3. Page auto-refreshes every 30 seconds
4. Contact support if status doesn't update within 24 hours

**Delivery vs Pickup:**
- Choose "pickup" if you can collect from service center
- Choose "delivery" and provide complete address if needed
- Delivery may incur additional charges (check policy)

### For Staff

**Request Review:**
1. Review requests within 24 hours (SLA target)
2. Verify serial number in system before accepting
3. Check warranty status and eligibility
4. Contact customer if information is unclear
5. Provide clear rejection reasons if declining

**Ticket Conversion:**
1. Ensure customer record exists or create new
2. Match product correctly from serial number
3. Select appropriate service type (warranty/paid)
4. Set realistic priority based on issue severity
5. Copy problem description to ticket notes
6. Add any staff observations in additional notes

**Communication:**
1. Email notifications sent automatically at each stage
2. Monitor `email_notifications` table for failures
3. Respond to customer inquiries promptly
4. Keep tracking page updated (auto-updates on ticket changes)

### For Developers

**Adding New Fields:**
1. Update database schema first
2. Add Zod validation in tRPC procedure
3. Update TypeScript types
4. Add UI form fields
5. Update email templates if needed

**Security Considerations:**
1. Never expose staff-only endpoints publicly
2. Always validate input on server side
3. Mask customer data in public tracking
4. Log suspicious activity (multiple failed attempts)
5. Monitor rate limits and adjust as needed

**Performance Optimization:**
1. Index all frequently queried columns
2. Use pagination for large result sets
3. Implement query result caching where appropriate
4. Optimize email sending (async, batch processing)
5. Monitor database query performance

**Testing:**
1. Test public portal without authentication
2. Verify rate limiting with multiple submissions
3. Test spam protection (honeypot field)
4. Validate all email notifications
5. Check ticket conversion workflow end-to-end
6. Test tracking with various status combinations

---

## Troubleshooting

### Common Issues

**Customer Reports: "Serial number not found"**
- Verify serial exists in `physical_products` table
- Check for typos (serial numbers are case-insensitive)
- Confirm product has been properly registered in system
- Serial may not be activated yet

**Customer Reports: "Tracking token not working"**
- Verify exact token format (SR-XXXXXXXXXXXX)
- Check for spaces or special characters
- Confirm request was successfully created in database
- Token may be case-sensitive in some browsers

**Staff Reports: "Cannot see pending requests"**
- Verify user has correct role (admin, manager, or reception)
- Check RLS policies are enabled
- Confirm authentication is working
- Review tRPC context creation

**Email Notifications Not Sending:**
- Check `email_notifications` table for status
- Review rate limit (100/day per customer)
- Verify email service configuration
- Check for opt-out preferences
- Review retry count and error messages

### Monitoring

**Key Metrics:**
- Requests submitted per day
- Average review time (submitted → received)
- Average conversion time (received → ticket created)
- Conversion rate (requests converted vs rejected)
- Email delivery success rate
- Rate limit violations per hour

**Database Queries:**
```sql
-- Pending requests count
SELECT COUNT(*) FROM service_requests
WHERE status IN ('submitted', 'received');

-- Average review time
SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))/3600) as avg_hours
FROM service_requests
WHERE reviewed_at IS NOT NULL;

-- Conversion rate
SELECT
  COUNT(CASE WHEN ticket_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as conversion_rate
FROM service_requests
WHERE status IN ('processing', 'completed');
```

---

## Related Documentation

- **Stories:**
  - `/docs/stories/01.11.public-service-request-portal.md` - Public submission
  - `/docs/stories/01.12.service-request-tracking-page.md` - Tracking interface
  - `/docs/stories/01.13.staff-request-management-and-ticket-conversion.md` - Staff workflow
  - `/docs/stories/01.15.email-notification-system.md` - Email system

- **Requirements:**
  - `/docs/requirements/REQ_SERVICE_REQUEST_LAYER.md` - Business requirements
  - `/docs/requirements/REQ_PUBLIC_PORTAL_TRACKING.md` - Tracking requirements

- **Technical:**
  - `/docs/data/schemas/15_service_request_tables.sql` - Database schema
  - `/docs/data/schemas/12_phase2_functions.sql` - Trigger functions
  - `/docs/data/schemas/17_phase2_rls_policies.sql` - Security policies
  - `/src/server/routers/service-request.ts` - tRPC API implementation

- **Architecture:**
  - `/CLAUDE.md` - Project overview and patterns
  - `/docs/architecture/coding-standards.md` - Code guidelines

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-24 | 1.0 | Initial documentation | Development Team |
