# Email Notification System

**Story:** 1.15 - Email Notification System (6 Key Moments)
**Version:** 1.0
**Last Updated:** 2025-10-24
**Status:** Production Ready

---

## Overview

The Email Notification System provides automated email communications to customers at critical moments in the service workflow. The system ensures customers stay informed about their service requests and tickets without needing to contact the service center.

### Key Features

- **6 Automated Notification Types** - Covering the complete customer journey from request submission to delivery confirmation
- **Email Queueing and Logging** - All emails are logged in the database with delivery status tracking
- **Unsubscribe Management** - Customers can manage their email preferences for each notification type
- **Rate Limiting** - Protection against email spam (100 emails per customer per day)
- **Retry Logic** - Failed emails are automatically retried up to 3 times
- **Admin Dashboard** - Staff can view email logs, statistics, and retry failed deliveries

### Business Value

- **Reduced Support Calls** - Proactive notifications decrease customer inquiries about status
- **Improved Customer Experience** - Customers stay informed at every step
- **Transparency** - Clear communication builds trust
- **Operational Efficiency** - Admin dashboard for monitoring and troubleshooting

---

## Notification Triggers

The system sends emails at 6 critical moments in the service workflow:

### 1. Service Request Submitted

**Trigger:** Customer submits a service request via the public portal
**Timing:** Immediate (within seconds)
**Email Type:** `request_submitted`

**Content Includes:**
- Tracking token for status lookup
- Product details (brand, model, serial number)
- Next steps and expected timeline
- Link to track request status

**Purpose:** Provide immediate confirmation and tracking information to the customer.

**Integration Point:**
```typescript
// In service-request.ts router
await ctx.trpc.notifications.send({
  emailType: 'request_submitted',
  recipientEmail: customer.email,
  recipientName: customer.name,
  context: {
    trackingToken: request.tracking_token,
    productName: `${request.product_brand} ${request.product_model}`,
    serialNumber: request.serial_number,
  },
  serviceRequestId: request.id,
});
```

---

### 2. Request Received by Staff

**Trigger:** Staff member marks service request as "received"
**Timing:** When reception/manager reviews and accepts the request
**Email Type:** `request_received`

**Content Includes:**
- Tracking token
- Current status update
- Information about next processing steps
- Link to track request

**Purpose:** Inform customer that their request is being actively processed.

---

### 3. Request Rejected

**Trigger:** Staff member rejects a service request
**Timing:** When rejection action is performed
**Email Type:** `request_rejected`

**Content Includes:**
- Tracking token
- Rejection reason (from staff input)
- Alternative options (submit new request, contact support)
- Support contact information

**Purpose:** Explain why the request was rejected and provide next steps.

**Integration Point:**
```typescript
// When rejecting a request
await ctx.trpc.notifications.send({
  emailType: 'request_rejected',
  recipientEmail: request.customer_email,
  recipientName: request.customer_name,
  context: {
    trackingToken: request.tracking_token,
    rejectionReason: input.rejectionReason,
  },
  serviceRequestId: request.id,
});
```

---

### 4. Ticket Created / Service Started

**Trigger:** Service request is converted to a service ticket
**Timing:** When ticket is created from approved request
**Email Type:** `ticket_created`

**Content Includes:**
- Service ticket number (SV-YYYY-NNN)
- Original tracking token reference
- Product details
- Estimated completion time (3-7 days)
- Current status: "In Progress"

**Purpose:** Notify customer that work has officially started on their product.

---

### 5. Service Completed / Ready for Pickup

**Trigger:** Ticket status changes to "completed"
**Timing:** When technician marks service as complete
**Email Type:** `service_completed`

**Content Includes:**
- Ticket number
- Completion date
- Pickup/delivery instructions
- Business hours
- Required documents for pickup

**Purpose:** Inform customer that their product is ready for collection or delivery.

**Integration Point:**
```typescript
// When completing a ticket
await ctx.trpc.notifications.send({
  emailType: 'service_completed',
  recipientEmail: ticket.customer_email,
  recipientName: ticket.customer_name,
  context: {
    ticketNumber: ticket.ticket_number,
    completedDate: format(new Date(), 'dd/MM/yyyy'),
    productName: ticket.product_name,
  },
  serviceTicketId: ticket.id,
});
```

---

### 6. Delivery Confirmed

**Trigger:** Staff confirms product delivery to customer
**Timing:** When delivery is recorded in the system
**Email Type:** `delivery_confirmed`

**Content Includes:**
- Ticket number
- Delivery date
- Product details
- Post-delivery instructions (inspection, warranty info)
- Thank you message

**Purpose:** Final confirmation and closure of the service cycle.

---

## Email Templates

All email templates follow a consistent design with HTML and plain text versions.

### Template Structure

**HTML Template Features:**
- Responsive design (mobile-friendly)
- SSTC Service Center branding
- Clean, professional layout
- Action buttons with clear CTAs
- Unsubscribe link in footer

**Common Components:**
```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Responsive, mobile-first styles */
    /* Professional color scheme (blue primary) */
    /* Clear typography hierarchy */
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">SSTC Service Center</div>
    </div>
    <div class="content">
      <!-- Template-specific content -->
    </div>
    <div class="footer">
      <!-- Contact info and unsubscribe link -->
    </div>
  </div>
</body>
</html>
```

### Template Variables

All templates support these context variables:

| Variable | Type | Description | Required |
|----------|------|-------------|----------|
| `customerName` | string | Customer's full name | Yes |
| `trackingToken` | string | Service request tracking code | Conditional |
| `ticketNumber` | string | Service ticket number | Conditional |
| `productName` | string | Product brand and model | No |
| `serialNumber` | string | Product serial number | No |
| `rejectionReason` | string | Reason for rejection | For rejection emails |
| `completedDate` | string | Service completion date | For completion emails |
| `deliveryDate` | string | Delivery date | For delivery emails |
| `unsubscribeUrl` | string | Unsubscribe preference URL | Yes |

### Template Generation

Templates are generated programmatically in `/src/lib/email-templates.ts`:

```typescript
import { getEmailTemplate } from '@/lib/email-templates';

const { html, text, subject } = getEmailTemplate('ticket_created', {
  customerName: 'Nguyen Van A',
  ticketNumber: 'SV-2025-001',
  productName: 'iPhone 15 Pro',
  unsubscribeUrl: 'https://...',
});
```

### Language Support

- **Primary Language:** Vietnamese (vi)
- **Date Format:** Vietnamese locale (dd/MM/yyyy)
- All user-facing content is in Vietnamese
- Technical terms use English (tracking token, service ticket)

---

## Unsubscribe System

### Customer Preferences

Each customer has email preferences stored in the `customers` table:

```json
{
  "request_submitted": true,
  "request_received": true,
  "request_rejected": true,
  "ticket_created": true,
  "service_completed": true,
  "delivery_confirmed": true
}
```

### Unsubscribe Flow

1. **Email Footer Link** - Every email includes an unsubscribe link:
   ```
   https://service.sstc.vn/unsubscribe?email={email}&type={emailType}
   ```

2. **Preference Page** - Customers can manage preferences at `/unsubscribe`:
   - View all notification types with descriptions
   - Toggle individual notification types
   - Unsubscribe from all or subscribe to all
   - Changes take effect immediately

3. **Preference Check** - Before sending any email:
   ```typescript
   const { data: customer } = await ctx.supabaseAdmin
     .from('customers')
     .select('email_preferences')
     .eq('email', recipientEmail)
     .single();

   if (customer?.email_preferences?.[emailType] === false) {
     // Skip sending email
     return { success: true, skipped: true, reason: 'unsubscribed' };
   }
   ```

### Important Notes

- Preferences are per email type (granular control)
- Unsubscribe is immediate (no delay)
- Some critical emails may still be sent (configurable)
- Customers can resubscribe at any time

---

## Admin Management

### Notification Log Page

**Location:** `/dashboard/notifications`
**Access:** Authenticated staff only (all roles)

### Features

#### 1. Email Statistics Cards

Dashboard displays real-time statistics:

- **Total Emails** - Total count of all notifications
- **Sent Successfully** - Emails delivered successfully
- **Failed** - Emails that failed to send
- **Pending** - Emails queued for sending

Statistics auto-refresh every 30 seconds.

#### 2. Email Log Table

**Columns:**
- Email Type (with badge)
- Recipient (name and email)
- Subject
- Status (pending/sent/failed/bounced)
- Sent/Failed Time
- Retry Count
- Actions (View, Retry)

**Filtering Options:**
- By email type
- By status
- By recipient email (search)
- Pagination (50 per page)

**Sorting:**
- Default: Most recent first (created_at DESC)

#### 3. Email Content Preview

Clicking "View" opens a modal with:

- **Metadata Section:**
  - Recipient name and email
  - Status badge
  - Email type
  - Sent/created timestamp
  - Error message (if failed)
  - Retry count

- **Email Content:**
  - Subject line
  - HTML preview (rendered)
  - Plain text version
  - Context data (JSON)

**Technical Implementation:**
```typescript
// Using the EmailContentModal component
import { EmailContentModal } from '@/components/modals/email-content-modal';

<EmailContentModal
  email={selectedEmail}
  open={isModalOpen}
  onOpenChange={setIsModalOpen}
/>
```

#### 4. Retry Failed Emails

Failed emails can be manually retried:

```typescript
const retryMutation = useRetryEmail();

await retryMutation.mutateAsync({
  emailId: email.id,
});
```

**Retry Conditions:**
- Email status must be "failed"
- Retry count must be less than max retries (3)
- Authentication required

---

## Technical Architecture

### Database Schema

#### Email Notifications Table

**Table:** `public.email_notifications`

```sql
CREATE TABLE public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email metadata
  email_type public.email_type NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,

  -- Context data for template variables
  context JSONB,

  -- Status tracking
  status public.email_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,

  -- Related entities
  service_request_id UUID REFERENCES service_requests(id),
  service_ticket_id UUID REFERENCES service_tickets(id),

  -- Unsubscribe tracking
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Email Type ENUM

```sql
CREATE TYPE public.email_type AS ENUM (
  'request_submitted',
  'request_received',
  'request_rejected',
  'ticket_created',
  'service_completed',
  'delivery_confirmed'
);
```

#### Email Status ENUM

```sql
CREATE TYPE public.email_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'bounced'
);
```

#### Customer Email Preferences

**Table:** `public.customers`

```sql
ALTER TABLE public.customers
  ADD COLUMN email_preferences JSONB DEFAULT '{
    "request_submitted": true,
    "request_received": true,
    "request_rejected": true,
    "ticket_created": true,
    "service_completed": true,
    "delivery_confirmed": true
  }'::jsonb;
```

### Indexes

Performance-optimized indexes:

```sql
-- Pending emails for queue processing
CREATE INDEX idx_email_notifications_status
  ON email_notifications(status)
  WHERE status = 'pending';

-- Lookup by recipient
CREATE INDEX idx_email_notifications_recipient
  ON email_notifications(recipient_email);

-- Filter by type
CREATE INDEX idx_email_notifications_type
  ON email_notifications(email_type);

-- Sort by date
CREATE INDEX idx_email_notifications_created_at
  ON email_notifications(created_at);

-- Related entity lookups
CREATE INDEX idx_email_notifications_request
  ON email_notifications(service_request_id)
  WHERE service_request_id IS NOT NULL;

CREATE INDEX idx_email_notifications_ticket
  ON email_notifications(service_ticket_id)
  WHERE service_ticket_id IS NOT NULL;
```

### tRPC Procedures

**Router:** `notifications` (`/src/server/routers/notifications.ts`)

#### 1. Send Email

**Procedure:** `notifications.send`
**Type:** Mutation (public procedure)

```typescript
notifications.send({
  emailType: 'request_submitted',
  recipientEmail: 'customer@example.com',
  recipientName: 'Nguyen Van A',
  context: {
    trackingToken: 'ABC123456',
    productName: 'iPhone 15',
  },
  serviceRequestId: 'uuid',
  serviceTicketId: 'uuid', // optional
});
```

**Process:**
1. Rate limit check (100 emails/day per recipient)
2. Check customer email preferences
3. Generate unsubscribe URL
4. Render email template with context
5. Log email in database (status: pending)
6. Attempt to send email
7. Update status (sent/failed)
8. Log errors and retry count

**Returns:**
```typescript
{
  success: boolean;
  emailId?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
  willRetry?: boolean;
}
```

#### 2. Get Email Log

**Procedure:** `notifications.getLog`
**Type:** Query (authenticated)

```typescript
notifications.getLog({
  limit: 50,
  offset: 0,
  emailType: 'ticket_created', // optional
  status: 'failed', // optional
  recipientEmail: 'customer@example.com', // optional
});
```

**Returns:**
```typescript
{
  emails: EmailNotification[];
  total: number;
  limit: number;
  offset: number;
}
```

#### 3. Get Email Statistics

**Procedure:** `notifications.getStats`
**Type:** Query (authenticated)

**Returns:**
```typescript
{
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: Record<EmailType, number>;
}
```

#### 4. Retry Failed Email

**Procedure:** `notifications.retry`
**Type:** Mutation (authenticated)

```typescript
notifications.retry({
  emailId: 'uuid',
});
```

**Validation:**
- Email must exist
- Status must be 'failed'
- Retry count < max_retries (3)

---

## Email Content Structure

### Header Section

- SSTC Service Center logo (text-based)
- Clean, professional design
- Consistent across all templates

### Body Content

**Standard Structure:**

1. **Greeting** - "Xin chào {customerName}"
2. **Main Message** - Clear statement of what happened
3. **Key Information Box** - Highlighted tracking token or ticket number
4. **Details Section** - Additional context (product, dates, etc.)
5. **Next Steps** - Bulleted list of what happens next
6. **Call to Action** - Button or link (if applicable)
7. **Support Message** - How to get help

### Footer Section

**Company Information:**
- SSTC Service Center name
- Hotline: +84 123 456 789
- Email: support@sstc.vn

**Unsubscribe Link:**
- Plain text link: "Hủy đăng ký"
- Direct to preference management page

### Design Principles

- **Mobile-first** - Responsive design for small screens
- **Accessibility** - High contrast, readable fonts
- **Brand Consistency** - Blue primary color (#2563eb)
- **Clarity** - Clear hierarchy, easy to scan
- **Actionable** - Clear next steps for customer

---

## Best Practices

### 1. Email Sending Strategy

**Asynchronous Sending:**
- Email sending does not block primary operations
- Failed emails don't cause transaction rollbacks
- Use background jobs for bulk sending

**Error Handling:**
```typescript
try {
  await sendEmail(email);
  // Update status to 'sent'
} catch (error) {
  // Log error, update status to 'failed'
  // Don't throw - email failures shouldn't break workflows
  console.error('Email failed:', error);
}
```

### 2. Rate Limiting

**Protection Mechanism:**
```typescript
// Check emails sent in last 24 hours
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
const recentEmailCount = await db
  .from('email_notifications')
  .count()
  .eq('recipient_email', email)
  .gte('created_at', oneDayAgo);

if (recentEmailCount >= 100) {
  throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
}
```

**Purpose:**
- Prevent email spam
- Protect against abuse
- Comply with email service limits

### 3. Template Maintenance

**Version Control:**
- Store templates in code repository
- Track changes via Git
- Review changes before deployment

**Testing:**
```typescript
// Test template rendering
const template = getEmailTemplate('ticket_created', testContext);
expect(template.html).toContain(testContext.ticketNumber);
expect(template.subject).toBeDefined();
```

### 4. Monitoring and Debugging

**Logging:**
```typescript
console.log(`[EMAIL SENT] ${emailType} to ${recipientEmail}`);
console.error(`[EMAIL FAILED] ${emailType}:`, error);
```

**Metrics to Track:**
- Send success rate
- Average send time
- Failed email patterns
- Unsubscribe rate by type

**Admin Dashboard:**
- Regular review of failed emails
- Monitor bounce rates
- Check for delivery issues

### 5. Privacy and Compliance

**Unsubscribe Requirements:**
- Include unsubscribe link in EVERY email
- Honor unsubscribe requests immediately
- Provide granular control (per email type)

**Data Protection:**
- Store minimal customer data
- Secure email content (no sensitive data in logs)
- Comply with GDPR/data protection laws

**Email Content:**
- Avoid embedding sensitive financial data
- Use generic product descriptions
- Link to secure portal for detailed info

### 6. Performance Optimization

**Database Queries:**
- Use partial indexes for pending emails
- Paginate log queries
- Cache statistics (30 second refresh)

**Template Rendering:**
- Pre-compile template functions
- Cache common partials
- Minimize template complexity

### 7. Integration Testing

**Test Scenarios:**
1. Send email on request submission
2. Verify email logged in database
3. Check unsubscribe functionality
4. Test retry logic
5. Validate rate limiting
6. Confirm preference filtering

**Manual Testing:**
```typescript
// Trigger test email from tRPC
await trpc.notifications.send({
  emailType: 'request_submitted',
  recipientEmail: 'test@example.com',
  recipientName: 'Test User',
  context: { trackingToken: 'TEST123' },
});
```

---

## Future Enhancements

### Planned Features

1. **Email Service Integration**
   - Production: Integrate with Resend, SendGrid, or Supabase Edge Functions
   - Replace mock implementation with actual SMTP

2. **Email Open Tracking**
   - Add tracking pixels
   - Log open events
   - Display open rate in admin dashboard

3. **Click Tracking**
   - Track link clicks in emails
   - Measure engagement
   - Identify most-clicked actions

4. **Email Templates Editor**
   - Admin UI to customize templates
   - Preview before saving
   - A/B testing support

5. **Scheduled Emails**
   - Queue emails for future sending
   - Reminder emails (pickup overdue)
   - Follow-up campaigns

6. **SMS Notifications**
   - Add SMS as alternative to email
   - Critical notifications via SMS
   - Customer preference for channel

---

## Related Documentation

- **Story Document:** `/docs/stories/01.15.email-notification-system.md`
- **Database Migration:** `/supabase/migrations/20251024110000_email_notifications_system.sql`
- **Template Library:** `/src/lib/email-templates.ts`
- **Notifications Router:** `/src/server/routers/notifications.ts`
- **Admin Page:** `/src/app/(auth)/dashboard/notifications/page.tsx`
- **Unsubscribe Page:** `/src/app/(public)/unsubscribe/page.tsx`
- **Test Plan:** `/docs/TEST_PLAN.md` (Story 1.15 section)

---

## Support and Troubleshooting

### Common Issues

**Problem:** Emails not sending
**Solution:** Check email service configuration, verify SMTP settings, review error logs

**Problem:** High bounce rate
**Solution:** Validate email addresses before sending, clean recipient list

**Problem:** Emails going to spam
**Solution:** Configure SPF/DKIM/DMARC, use verified sending domain

**Problem:** Retry limit exceeded
**Solution:** Investigate root cause, manually retry after fixing issue

### Admin Actions

**View Failed Emails:**
1. Go to `/dashboard/notifications`
2. Filter by status: "failed"
3. Click "View" to see error message
4. Click "Retry" if issue resolved

**Check Customer Preferences:**
1. Navigate to customer profile
2. View email preferences JSON
3. Verify unsubscribe status

**Monitor Send Rate:**
1. Review statistics cards
2. Check success rate trends
3. Investigate anomalies

---

**Document Version:** 1.0
**Last Review:** 2025-10-24
**Next Review:** 2026-01-24
