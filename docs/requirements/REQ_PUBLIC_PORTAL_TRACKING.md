# Requirements: Public Portal & Tracking

## Document Information

**Document ID**: REQ-PPT-001
**Version**: 1.0
**Date**: 2025-10-22
**Status**: Draft
**Related Documents**:
- REQ_WAREHOUSE_PHYSICAL_PRODUCTS.md
- REQ_SERVICE_REQUEST_LAYER.md
- REQ_TASK_WORKFLOW_SYSTEM.md
- USER_JOURNEY.md

---

## Business Context

### Purpose

The Public Portal & Tracking system provides customers with transparent, real-time visibility into their service requests and tickets without requiring authentication. It serves as the primary customer-facing interface that:

1. **Builds Trust**: Transparent progress updates reduce customer anxiety
2. **Reduces Support Load**: Self-service tracking decreases "where's my device?" calls
3. **Enhances Experience**: Proactive communication keeps customers informed
4. **Enables Self-Service**: Customers can take actions (approve repairs, confirm delivery) online
5. **Maintains Privacy**: Secure tracking without exposing sensitive business data

### Key Stakeholders

- **Customers**: Primary users seeking service status updates
- **Reception Staff**: Share tracking links and QR codes with customers
- **Management**: Monitor customer engagement with tracking portal

### Business Value

- **Reduced Call Volume**: 40-60% reduction in status inquiry calls
- **Improved Satisfaction**: Customers appreciate transparency and control
- **Faster Approvals**: Online approval faster than phone tag
- **Brand Differentiation**: Modern, transparent service experience
- **Operational Efficiency**: Staff focus on service, not status updates

---

## Functional Requirements

### FR-PPT-001: Unauthenticated Access via Tracking Token

**Description**: Customers can access tracking information using unique tracking token without login/account creation.

**Access Methods**:
1. **Direct URL**: `https://domain.com/track/{tracking_token}`
2. **QR Code**: Scan printed QR code on receipt
3. **Email Link**: Click link in notification emails
4. **Manual Entry**: Enter tracking number on tracking page

**Security Considerations**:
- Tracking token acts as authorization (possession = access)
- Token complexity: SR-YYYYMMDD-XXXXX (difficult to guess)
- Rate limiting: Max 20 requests per token per hour
- No sensitive financial data displayed (only totals)
- No technician personal information exposed

**User Story**:
```
AS A customer
I WANT to check my service status without creating an account
SO THAT I can get updates quickly and easily
```

**Acceptance Criteria**:
- [ ] URL with tracking token loads tracking page
- [ ] QR code scan redirects to tracking page
- [ ] Invalid token shows friendly error message
- [ ] No authentication required
- [ ] Session timeout: 30 minutes of inactivity
- [ ] Works on mobile and desktop browsers

---

### FR-PPT-002: Real-Time Status Visualization

**Description**: Display current service status with visual progress indicators and timeline.

**Status Display Components**:

**1. Progress Bar**
```
Submitted → Received → Diagnosis → Repair → Completed
   ●───────────●──────────●─────────○────────○
  Done       Done      Current    Pending   Pending
```

**2. Timeline View**
```
✅ Oct 22, 10:30 AM - Service request created
✅ Oct 22, 02:00 PM - Device received at service center
✅ Oct 22, 03:15 PM - Diagnosis started
⏳ Oct 22, 04:30 PM - Diagnosis in progress
⏸️ Estimated completion: Oct 24, 2025
```

**3. Current Status Badge**
- Color-coded status indicator (green, yellow, orange, blue)
- Plain-language status description
- Next expected action clearly stated

**Business Rules**:
- Status updates in real-time (no page refresh required via WebSocket or polling)
- Estimated completion date shown if available
- Customer-friendly language (no technical jargon)
- Show only customer-relevant events (hide internal operations)

**User Story**:
```
AS A customer
I WANT to see visual progress of my service
SO THAT I understand where my device is in the process
```

**Acceptance Criteria**:
- [ ] Progress bar shows completed steps highlighted
- [ ] Timeline displays chronological events
- [ ] Status badge prominently displayed
- [ ] Mobile-responsive design
- [ ] Auto-refresh every 60 seconds
- [ ] Manual refresh button available

---

### FR-PPT-003: Service Details Display

**Description**: Show comprehensive service information relevant to customer.

**Information Displayed**:

**Request Information**:
- Tracking number (large, prominent)
- Customer name and contact info
- Request creation date
- Source (online or walk-in)

**Product Information**:
- Product model and serial number
- Reported issue description
- Warranty status (active or expired)

**Service Progress**:
- Current phase (simplified task progress)
- Assigned technician (first name only, e.g., "Tech: Minh")
- Services performed (list)
- Parts replaced (list with descriptions)

**Financial Information**:
- Diagnosis fee (if applicable)
- Service fee
- Parts cost (itemized)
- Total cost (excluding discount details)
- Payment status (Pending, Paid, Partially Paid)

**Privacy Safeguards**:
- No technician full names or contact info
- No internal cost breakdowns (labor vs parts margin)
- No staff notes visible to customers
- No other customer information visible

**User Story**:
```
AS A customer
I WANT to see detailed information about my service
SO THAT I know exactly what's being done and what it costs
```

**Acceptance Criteria**:
- [ ] All customer-relevant information displayed
- [ ] Sensitive internal data hidden
- [ ] Financial breakdown clear and accurate
- [ ] Product details include warranty status
- [ ] Services/parts updated in real-time

---

### FR-PPT-004: Multi-Product Request Tracking

**Description**: For requests with multiple products, clearly distinguish status of each item.

**Display Pattern**:
- Show overall request status
- List individual products as expandable cards
- Each product shows independent ticket status
- Overall completion when all products done

**Example Layout**:
```
Request SR-20251022-00001
Status: In Progress (1 of 2 devices completed)

┌─────────────────────────────────────────┐
│ 📱 iPhone 14 Pro (SN123456789)         │
│ Ticket: SV-2025-001                     │
│ Status: ✅ Completed                    │
│ Ready for pickup                         │
│ [ View Details ]                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 💻 MacBook Pro 16" (SN987654321)       │
│ Ticket: SV-2025-002                     │
│ Status: ⏳ In Diagnosis                 │
│ Estimated completion: Oct 24            │
│ [ View Details ]                         │
└─────────────────────────────────────────┘
```

**Business Rules**:
- Each product card clickable for detailed view
- Progress bar shows overall completion percentage
- Notifications sent when ANY product status changes
- Pickup/delivery options appear when ALL products ready

**User Story**:
```
AS A customer with multiple devices in service
I WANT to see individual status for each device
SO THAT I know which ones are ready and which are still being worked on
```

**Acceptance Criteria**:
- [ ] Multi-product requests show all items
- [ ] Individual ticket status visible per product
- [ ] Overall progress calculated correctly
- [ ] Expandable detail view per product
- [ ] Delivery confirmation available when all ready

---

### FR-PPT-005: Interactive Customer Actions

**Description**: Customers can take specific actions through the tracking portal.

**Available Actions**:

**1. Approve Repair Quote** (when ticket status = `awaiting_approval`)
- Display diagnosis findings
- Show detailed cost breakdown
- Options: "Approve Repair" or "Decline Repair"
- Approval deadline countdown (3 days default)
- What happens if declined clearly explained

**2. Confirm Delivery Method** (when ticket status = `awaiting_customer_confirmation`)
- View service summary and invoice
- Choose: "Self Pickup" or "Request Delivery"
- If delivery: Provide address and preferred time
- Deadline countdown (3 days, then auto-fallback to pickup)

**3. Cancel Request** (only if status = `submitted`)
- Cancel before products received
- Reason selection (optional)
- Confirmation dialog required

**4. Download Receipt/Invoice**
- PDF download of service receipt
- Includes all service details, costs, warranty info
- Available after service completion

**5. Contact Service Center**
- Pre-filled contact form with ticket context
- Phone number and email displayed
- Live chat integration (future consideration)

**Business Rules**:
- Actions only available when ticket in appropriate status
- All actions logged with timestamp and IP address
- Confirmation emails sent after each action
- Actions cannot be undone (show warnings)

**User Story**:
```
AS A customer
I WANT to approve repairs and choose delivery options online
SO THAT I don't have to call or visit the service center
```

**Acceptance Criteria**:
- [ ] Action buttons shown only when applicable
- [ ] Clear instructions for each action
- [ ] Confirmation dialogs prevent accidental actions
- [ ] Success messages after action completion
- [ ] Email confirmation sent for each action
- [ ] Mobile-friendly action interfaces

---

### FR-PPT-006: QR Code Integration

**Description**: Generate and scan QR codes for quick tracking access.

**QR Code Types**:

**1. Tracking QR Code** (on customer receipt)
- Contains: Tracking URL with embedded token
- Format: `https://domain.com/track/{tracking_token}`
- Printed on receipts given to customers
- Scannable via any QR reader app

**2. Pickup Verification QR Code** (for self-pickup)
- Contains: Verification token + ticket ID
- Format: JSON payload for staff scanner app
- Displayed on tracking page when ready for pickup
- Staff scans to verify customer identity and complete pickup

**QR Code Generation**:
```typescript
// Tracking QR code
const trackingQrCode = generateQRCode({
  data: `https://sstc.com/track/${trackingToken}`,
  size: 200,
  errorCorrection: 'M'
});

// Pickup verification QR code
const pickupQrCode = generateQRCode({
  data: JSON.stringify({
    type: 'pickup_verification',
    ticket_id: ticketId,
    tracking_token: trackingToken,
    customer_name: customerName,
    verification_code: generateVerificationCode()
  }),
  size: 250,
  errorCorrection: 'H' // High error correction for reliability
});
```

**User Story**:
```
AS A customer
I WANT to scan a QR code to quickly access my service status
SO THAT I don't have to manually type the tracking number
```

**Acceptance Criteria**:
- [ ] QR code printed on customer receipt
- [ ] QR code scannable by standard camera apps
- [ ] Tracking page displays pickup QR when ready
- [ ] QR codes work offline (static URL, not dynamic)
- [ ] High contrast for reliable scanning

---

### FR-PPT-007: Notification Preferences

**Description**: Customers can manage how they receive updates (email, SMS in future).

**Preference Options**:
- Email notifications ON/OFF (default: ON)
- SMS notifications ON/OFF (future feature, default: OFF)
- Notification frequency: All updates | Major milestones only
- Contact phone number (for SMS when implemented)

**Preference Management**:
- Link in tracking page: "Notification Settings"
- Link in email footer: "Update Notification Preferences"
- Changes apply immediately
- Confirmation email sent when preferences changed

**Critical Notifications** (cannot be disabled):
- Service completed
- Awaiting approval (action required)
- Ready for pickup (action required)

**Business Rules**:
- Customers can reduce notifications but not disable critical ones
- Unsubscribe from all emails not allowed (transactional emails)
- Preferences stored per tracking token (not global account)

**User Story**:
```
AS A customer
I WANT to control how often I receive notifications
SO THAT I'm not overwhelmed with emails but stay informed
```

**Acceptance Criteria**:
- [ ] Notification preferences link in tracking page
- [ ] Simple ON/OFF toggles
- [ ] Critical notifications clearly marked
- [ ] Changes saved immediately
- [ ] Confirmation message shown

---

### FR-PPT-008: Mobile-First Responsive Design

**Description**: Tracking portal optimized for mobile devices (60%+ of traffic expected).

**Mobile Design Principles**:
- **Mobile-first**: Design for small screens, enhance for desktop
- **Touch-friendly**: Minimum 44px touch targets
- **Readable**: Minimum 16px font size, high contrast
- **Fast loading**: Optimized images, minimal JS
- **Offline-friendly**: Show cached data if connection lost

**Responsive Breakpoints**:
- Mobile: <640px (single column, stacked layout)
- Tablet: 640-1024px (two columns where appropriate)
- Desktop: >1024px (full layout with sidebars)

**Mobile-Specific Features**:
- **Click-to-call**: Phone numbers tappable
- **Click-to-email**: Email addresses open mail app
- **Add to Calendar**: Add pickup appointment to phone calendar
- **Share Link**: Native share sheet for sharing tracking link

**Performance Targets**:
- First Contentful Paint: <1.5s on 3G
- Time to Interactive: <3s on 3G
- Lighthouse Performance Score: >90

**User Story**:
```
AS A customer on mobile
I WANT the tracking page to work smoothly on my phone
SO THAT I can check status anywhere, anytime
```

**Acceptance Criteria**:
- [ ] Responsive design tested on iOS and Android
- [ ] Touch targets meet accessibility guidelines
- [ ] No horizontal scrolling on mobile
- [ ] Fast load times on slow connections
- [ ] Works offline with cached data

---

### FR-PPT-009: Multi-Language Support

**Description**: Support Vietnamese and English languages in public portal.

**Language Options**:
- **Primary**: Vietnamese (default for Vietnam market)
- **Secondary**: English (for international customers)
- Language toggle in header (VN | EN flags)
- Language preference saved in browser cookie

**Translated Content**:
- All UI labels and buttons
- Status descriptions
- Email notifications
- Error messages
- Help text and tooltips

**Business Rules**:
- Service data (notes, descriptions) remain in original language
- Auto-detect browser language on first visit
- Staff interface language independent of public portal

**User Story**:
```
AS AN international customer
I WANT to view tracking information in English
SO THAT I can understand the service status
```

**Acceptance Criteria**:
- [ ] Language toggle prominently displayed
- [ ] All static content translated
- [ ] Language preference persists across sessions
- [ ] RTL support not required (VN and EN both LTR)
- [ ] Date/time formats localized

---

### FR-PPT-010: Analytics and Engagement Tracking

**Description**: Track customer engagement with tracking portal for insights and improvements.

**Tracked Metrics**:
- Page views per tracking token
- Time spent on tracking page
- Actions taken (approvals, delivery confirmations)
- QR code scan rate
- Email link click-through rate
- Device types (mobile vs desktop)
- Browser types
- Bounce rate (single page view)

**Privacy Considerations**:
- No personally identifiable tracking (GDPR compliant)
- Aggregate analytics only
- No third-party tracking pixels
- Cookie consent banner if required by jurisdiction

**Business Insights**:
- Identify low-engagement customers for follow-up
- Optimize notification timing based on open rates
- Improve mobile experience based on device data
- A/B test layout changes

**User Story**:
```
AS A business owner
I WANT to understand how customers use the tracking portal
SO THAT I can improve the experience and increase engagement
```

**Acceptance Criteria**:
- [ ] Analytics dashboard for management
- [ ] Privacy-compliant tracking implementation
- [ ] No impact on page load performance
- [ ] Opt-out mechanism available
- [ ] Data retention policy defined (90 days)

---

## Data Model

### Tracking Sessions Table

```sql
CREATE TABLE tracking_sessions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  tracking_token VARCHAR(20) NOT NULL REFERENCES service_requests(tracking_token),

  -- Session data
  session_id VARCHAR(100) UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(20), -- 'mobile', 'tablet', 'desktop'
  browser VARCHAR(50),

  -- Engagement
  first_visit_at TIMESTAMP DEFAULT now(),
  last_visit_at TIMESTAMP DEFAULT now(),
  page_views INT DEFAULT 1,
  actions_taken JSONB DEFAULT '[]', -- Array of action objects

  -- Source
  referrer VARCHAR(255), -- 'email', 'qr_code', 'direct', 'search'
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),

  -- Preferences
  language_preference VARCHAR(10) DEFAULT 'vi',
  notification_preferences JSONB
);

-- Indexes
CREATE INDEX idx_tracking_sessions_token ON tracking_sessions(tracking_token);
CREATE INDEX idx_tracking_sessions_session ON tracking_sessions(session_id);
CREATE INDEX idx_tracking_sessions_first_visit ON tracking_sessions(first_visit_at);
```

---

### Customer Actions Table

```sql
CREATE TABLE customer_actions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  tracking_token VARCHAR(20) NOT NULL REFERENCES service_requests(tracking_token),
  ticket_id UUID REFERENCES service_tickets(id),
  session_id VARCHAR(100),

  -- Action details
  action_type VARCHAR(50) NOT NULL, -- 'approve_repair', 'decline_repair', 'confirm_delivery', 'cancel_request', 'download_receipt'
  action_data JSONB, -- Action-specific data

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  performed_at TIMESTAMP DEFAULT now(),

  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_customer_actions_token ON customer_actions(tracking_token);
CREATE INDEX idx_customer_actions_ticket ON customer_actions(ticket_id);
CREATE INDEX idx_customer_actions_type ON customer_actions(action_type);
CREATE INDEX idx_customer_actions_performed ON customer_actions(performed_at DESC);
```

---

### QR Code Logs Table

```sql
CREATE TABLE qr_code_scans (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  tracking_token VARCHAR(20) NOT NULL REFERENCES service_requests(tracking_token),
  qr_code_type VARCHAR(20) NOT NULL, -- 'tracking', 'pickup_verification'

  -- Scan details
  scanned_at TIMESTAMP DEFAULT now(),
  scanner_device VARCHAR(50), -- 'ios', 'android', 'web', 'staff_app'
  ip_address INET,

  -- Location (if GPS permission granted)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- Indexes
CREATE INDEX idx_qr_scans_token ON qr_code_scans(tracking_token);
CREATE INDEX idx_qr_scans_scanned_at ON qr_code_scans(scanned_at DESC);
```

---

## Business Rules

### BR-PPT-001: Tracking Token Security

**Rule**: Tracking tokens must be sufficiently random to prevent enumeration attacks.

**Token Format**: `SR-YYYYMMDD-XXXXX`
- Date portion: Identifies creation date (not secret)
- Sequence portion: 5-digit number (00001-99999)
- Randomization: Daily sequence randomized (not sequential)

**Security Measures**:
- Rate limiting: 20 requests per token per hour
- IP-based rate limiting: 100 requests per IP per hour
- Failed access attempts logged
- No token enumeration allowed (search disabled)

**Enforcement**:
```typescript
// Rate limiting middleware
async function trackingRateLimiter(req, res, next) {
  const token = req.params.tracking_token;
  const ip = req.ip;

  // Check token-based rate limit
  const tokenRequests = await redis.incr(`rate:token:${token}`);
  if (tokenRequests === 1) await redis.expire(`rate:token:${token}`, 3600);
  if (tokenRequests > 20) {
    return res.status(429).json({ error: 'Too many requests for this tracking token' });
  }

  // Check IP-based rate limit
  const ipRequests = await redis.incr(`rate:ip:${ip}`);
  if (ipRequests === 1) await redis.expire(`rate:ip:${ip}`, 3600);
  if (ipRequests > 100) {
    return res.status(429).json({ error: 'Too many requests from your IP address' });
  }

  next();
}
```

---

### BR-PPT-002: Action Authorization

**Rule**: Customer actions must be authorized based on current ticket status and timing.

**Authorization Matrix**:

| Action | Allowed When | Deadline |
|--------|--------------|----------|
| Cancel Request | status = 'submitted' | Anytime before receipt |
| Approve Repair | status = 'awaiting_approval' | Within 3 days |
| Decline Repair | status = 'awaiting_approval' | Within 3 days |
| Confirm Delivery | status = 'awaiting_customer_confirmation' | Within 3 days |
| Download Receipt | status = 'completed' | Anytime |

**Enforcement**:
```sql
CREATE OR REPLACE FUNCTION validate_customer_action(
  p_ticket_id UUID,
  p_action_type VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  ticket_status VARCHAR(50);
  ticket_completed_at TIMESTAMP;
BEGIN
  -- Get ticket status
  SELECT status, completed_at
  INTO ticket_status, ticket_completed_at
  FROM service_tickets
  WHERE id = p_ticket_id;

  -- Validate action based on status
  CASE p_action_type
    WHEN 'approve_repair', 'decline_repair' THEN
      RETURN ticket_status = 'awaiting_approval';

    WHEN 'confirm_delivery' THEN
      RETURN ticket_status = 'awaiting_customer_confirmation'
         AND ticket_completed_at > now() - INTERVAL '3 days';

    WHEN 'download_receipt' THEN
      RETURN ticket_status = 'completed';

    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

---

### BR-PPT-003: Data Visibility Rules

**Rule**: Only customer-appropriate data should be visible on tracking portal.

**Hidden Data**:
- Staff full names and contact information
- Internal cost breakdowns (labor margins, parts markups)
- Staff notes and internal comments
- Other customers' information
- Sensitive diagnostic details (only summary visible)

**Visible Data**:
- Customer's own information
- Product details and warranty status
- High-level service progress
- Total costs (not detailed breakdowns)
- Public-safe status descriptions

**Enforcement** (database view):
```sql
CREATE VIEW public_tracking_view AS
SELECT
  sr.tracking_token,
  sr.customer_name,
  sr.customer_phone,
  sr.customer_email,
  sr.status,
  sr.created_at,
  sr.expected_products,

  st.ticket_number,
  st.status AS ticket_status,
  st.service_type,
  st.diagnosis_notes, -- Sanitized version only
  st.total_cost,
  st.completed_at,

  -- Sanitized task progress (customer-friendly labels)
  (SELECT json_agg(
    json_build_object(
      'name', COALESCE(customer_task_labels.label, tt.name),
      'status', stt.status,
      'completed_at', stt.completed_at
    )
    ORDER BY stt.sequence_order
  )
  FROM service_ticket_tasks stt
  JOIN task_types tt ON stt.task_type_id = tt.id
  LEFT JOIN customer_task_labels ON tt.id = customer_task_labels.task_type_id
  WHERE stt.ticket_id = st.id
  ) AS tasks

FROM service_requests sr
LEFT JOIN service_tickets st ON st.request_id = sr.id
WHERE sr.status != 'cancelled';
```

---

### BR-PPT-004: Real-Time Update Mechanism

**Rule**: Tracking page should reflect current status within 10 seconds of any change.

**Implementation Options**:

**Option A: WebSocket (Recommended)**
- Server pushes updates to connected clients
- Instant updates when ticket status changes
- Lower server load than polling

**Option B: Short Polling (Fallback)**
- Client requests updates every 30-60 seconds
- Works with all browsers, no special infrastructure
- Higher server load

**Enforcement**:
```typescript
// WebSocket implementation
io.on('connection', (socket) => {
  // Client subscribes to tracking token
  socket.on('track', (trackingToken) => {
    socket.join(`tracking:${trackingToken}`);
  });

  // Emit update when ticket changes
  async function onTicketUpdate(ticketId) {
    const ticket = await getTicketDetails(ticketId);
    const trackingToken = ticket.request.tracking_token;

    io.to(`tracking:${trackingToken}`).emit('status_update', {
      ticket: sanitizeForPublic(ticket),
      timestamp: new Date()
    });
  }
});
```

---

### BR-PPT-005: Offline Capability

**Rule**: Tracking page should display last known status if connection lost.

**Behavior**:
- Cache tracking data in browser localStorage
- Show cached data with "Last updated: X minutes ago" warning
- Retry connection automatically
- Display "Offline - trying to reconnect" banner

**Implementation**:
```typescript
// Service Worker for offline support
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/track/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return fetch(event.request)
          .then((networkResponse) => {
            // Update cache with fresh data
            caches.open('tracking-v1').then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
            return networkResponse;
          })
          .catch(() => {
            // Network failed, return cached data
            return cachedResponse || new Response('Offline - please try again later');
          });
      })
    );
  }
});
```

---

## Workflows

### Workflow 1: Customer Tracking Journey

```
┌─────────────────────────────────────────────────────────────┐
│                 CUSTOMER TRACKING JOURNEY                   │
└─────────────────────────────────────────────────────────────┘

CUSTOMER                        SYSTEM

1. Receive receipt with ◄───────────── Reception prints receipt
   tracking number + QR code            ├─> Tracking #: SR-20251022-00001
                                         └─> QR code: tracking URL

2. Scan QR code or ─────────────────> Detect scan via QR code log
   click email link

3. Redirect to tracking page ◄──────── Load: /track/SR-20251022-00001
   https://sstc.com/track/             │
   SR-20251022-00001                    ├─> Rate limit check (pass)
                                         ├─> Validate token (valid)
                                         └─> Fetch tracking data

4. View tracking page ◄─────────────── Render tracking interface:
   ┌─────────────────────────────┐     ├─> Progress bar
   │ 🔍 Track Your Service       │     ├─> Timeline
   │ SR-20251022-00001           │     ├─> Product details
   │                              │     ├─> Service status
   │ Status: In Diagnosis         │     └─> Estimated completion
   │                              │
   │ ●───●───●───○───○            │
   │ Submitted → Received →       │
   │ Diagnosis → Repair →         │
   │ Completed                    │
   │                              │
   │ iPhone 14 Pro                │
   │ Ticket: SV-2025-001          │
   │                              │
   │ Timeline:                    │
   │ ✅ Oct 22, 10:30 - Submitted │
   │ ✅ Oct 22, 14:00 - Received  │
   │ ⏳ Oct 22, 15:30 - Diagnosis │
   │                              │
   │ Est. completion: Oct 24      │
   └─────────────────────────────┘

5. Subscribe to updates ────────────> WebSocket connection
   (automatic)                         └─> Join room: tracking:SR-20251022-00001

6. Continue using phone ───────────────────────────────────────────
   (tracking page in background)

                    [30 minutes later]

7. Ticket updated (staff) ──────────> Technician completes diagnosis
                                       └─> Ticket status: awaiting_approval

8. Receive real-time update ◄──────── WebSocket emit:
   (page auto-updates)                 └─> status_update event

9. See updated status ◄────────────── Re-render tracking page:
   ┌─────────────────────────────┐     ├─> New status badge
   │ Status: Awaiting Approval   │     ├─> Action button appears
   │                              │     └─> Update timeline
   │ ⚠️ Action Required           │
   │                              │
   │ Diagnosis Complete:          │
   │ Screen digitizer faulty      │
   │ Battery degraded (65%)       │
   │                              │
   │ Repair Cost: 800,000 VND     │
   │ ├─> Diagnosis: 100,000       │
   │ ├─> Parts: 500,000           │
   │ └─> Labor: 200,000           │
   │                              │
   │ Approve by: Oct 25 (3 days)  │
   │                              │
   │ [ Approve Repair ]           │
   │ [ Decline Repair ]           │
   └─────────────────────────────┘

10. Also receive email ◄────────────── Email notification sent:
    notification                        "Action Required: Approve Repair"

11. Review cost details
    └─> Scroll through diagnosis

12. Click "Approve Repair" ─────────> Confirmation dialog:
                                       "Approve repair for 800,000 VND?"

13. Confirm approval ───────────────> POST /api/public/approve-repair
                                       │
                                       ├─> Validate action (allowed)
                                       ├─> Update ticket: status = approved
                                       ├─> Log customer_action
                                       └─> Send confirmation email

14. See success message ◄──────────── "Repair approved! Work will begin soon."
    └─> Page updates to                └─> WebSocket update sent
        "Repair in Progress"

15. Continue tracking progress ────────────────────────────────────>
    over next few days                 (repeat steps 5-9 as status updates)

                    [2 days later]

16. Final notification ◄───────────── Ticket completed:
    "Device ready for pickup"          └─> Email + WebSocket update

17. Open tracking page ─────────────> Load latest status

18. See completion status ◄────────── Render completion view:
    ┌─────────────────────────────┐
    │ ✅ Service Completed!       │
    │                              │
    │ Your device is ready!        │
    │                              │
    │ Choose delivery method:      │
    │                              │
    │ [ Self Pickup ]              │
    │ [ Request Delivery ]         │
    │                              │
    │ QR Code for Pickup:          │
    │ [   QR CODE IMAGE   ]        │
    │                              │
    │ [ Download Receipt ]         │
    └─────────────────────────────┘

19. Choose "Self Pickup" ───────────> POST /api/public/confirm-delivery
                                       └─> delivery_method: self_pickup

20. See pickup details ◄───────────── Render pickup instructions:
    + QR code                          ├─> Service center address
    + Address                           ├─> Operating hours
    + Hours                             ├─> QR code for verification
                                         └─> Total amount due

21. Visit service center
    └─> Show QR code to staff ──────> Staff scans QR code
                                       └─> Verify customer + ticket

22. Receive device ◄───────────────── Staff completes pickup:
    + Pay amount due                   └─> Ticket: status = closed
    + Get receipt
```

---

## UI/UX Requirements

### Desktop Tracking Page

```
┌───────────────────────────────────────────────────────────────────────┐
│  🏢 SSTC Service Center                             VN | EN  ☰ Menu   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │         🔍 Track Your Service Request                           │ │
│  │                                                                  │ │
│  │         Tracking #: SR-20251022-00001                           │ │
│  │         Status: In Diagnosis               ⏱ Last updated: 2m ago│ │
│  │                                                                  │ │
│  │         ●────────●────────●────────○────────○                   │ │
│  │      Submitted Received Diagnosis Repair Completed              │ │
│  │                                                                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────┐  ┌────────────────────────────────┐   │
│  │ 📋 Request Information   │  │ 📱 Product Details              │   │
│  ├──────────────────────────┤  ├────────────────────────────────┤   │
│  │ Customer: Nguyễn Văn A   │  │ iPhone 14 Pro                   │   │
│  │ Phone: 0909 123 456      │  │ Serial: SN123456789             │   │
│  │ Email: nguyenvana@...    │  │                                  │   │
│  │                           │  │ Warranty: Company Warranty      │   │
│  │ Created: Oct 22, 10:30   │  │ Valid until: Dec 31, 2025       │   │
│  │ Source: Online           │  │                                  │   │
│  └──────────────────────────┘  │ Reported Issue:                  │   │
│                                  │ Screen cracked after drop,      │   │
│  ┌──────────────────────────┐  │ touch not responding on right   │   │
│  │ 📊 Service Progress      │  │ side.                            │   │
│  ├──────────────────────────┤  └────────────────────────────────┘   │
│  │ Current Phase:           │                                        │
│  │ Diagnosis in Progress    │  ┌────────────────────────────────┐   │
│  │                           │  │ 💰 Cost Estimate                │   │
│  │ Assigned to: Tech Minh   │  ├────────────────────────────────┤   │
│  │                           │  │ Diagnosis Fee:     100,000 VND  │   │
│  │ Estimated Completion:    │  │ Service Fee:       200,000 VND  │   │
│  │ Oct 24, 2025             │  │ Parts Cost:        500,000 VND  │   │
│  │                           │  │                                  │   │
│  │ Step 3 of 8 tasks        │  │ Total:            800,000 VND   │   │
│  │ ━━━━━●━━━━━━━ 38%       │  │                                  │   │
│  └──────────────────────────┘  │ Payment: Pending                 │   │
│                                  └────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 📅 Timeline                                                   │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                                │   │
│  │  ✅ Oct 22, 10:30 AM - Service request created online         │   │
│  │  ✅ Oct 22, 02:00 PM - Device received at service center      │   │
│  │  ✅ Oct 22, 03:15 PM - Initial inspection completed            │   │
│  │  ⏳ Oct 22, 03:45 PM - Diagnosis in progress                  │   │
│  │  ⏸️ Estimated: Oct 23, 10:00 AM - Diagnosis completion        │   │
│  │                                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 📞 Need Help?                                                 │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  📱 Call: 028 1234 5678                                       │   │
│  │  ✉️ Email: support@sstc.com                                  │   │
│  │  📍 Visit: 123 Nguyen Trai St, District 1, HCMC             │   │
│  │                                                                │   │
│  │  [ 💬 Send Message ]                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  [ 🔄 Refresh ]  [ 📧 Update Notifications ]  [ 📄 Download Receipt ]│
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
│  © 2025 SSTC Service Center | Privacy Policy | Terms of Service      │
└───────────────────────────────────────────────────────────────────────┘
```

---

### Mobile Tracking Page

```
┌──────────────────────────┐
│  SSTC   🔍  VN|EN  ☰     │  ← Sticky header
├──────────────────────────┤
│                           │
│  Track Your Service       │
│                           │
│  SR-20251022-00001        │
│  [Copy]                   │
│                           │
│  ●────●────●────○────○   │
│  ⬆ In Diagnosis          │
│                           │
│  ⏱ Updated: 2m ago       │
│  🔄 Auto-refresh ON       │
│                           │
├──────────────────────────┤
│                           │
│  📱 iPhone 14 Pro        │
│  SN123456789              │
│                           │
│  ✅ Company Warranty      │
│  Until: Dec 31, 2025      │
│                           │
│  Issue: Screen cracked    │
│  after drop...            │
│  [Read more]              │
│                           │
├──────────────────────────┤
│                           │
│  📊 Progress (Step 3/8)  │
│  ━━━━●━━━━━━ 38%         │
│                           │
│  Current: Diagnosis       │
│  Tech: Minh               │
│  Est: Oct 24              │
│                           │
├──────────────────────────┤
│                           │
│  💰 Cost Estimate        │
│  Total: 800,000 VND       │
│  [View breakdown ▼]       │
│                           │
├──────────────────────────┤
│                           │
│  📅 Timeline              │
│                           │
│  ✅ Oct 22, 10:30 AM      │
│  Service request created  │
│                           │
│  ✅ Oct 22, 02:00 PM      │
│  Device received          │
│                           │
│  ✅ Oct 22, 03:15 PM      │
│  Inspection completed     │
│                           │
│  ⏳ Oct 22, 03:45 PM      │
│  Diagnosis in progress    │
│                           │
│  [Show all ▼]             │
│                           │
├──────────────────────────┤
│                           │
│  📞 Need Help?           │
│                           │
│  [ 📱 Call Us ]           │  ← Click-to-call
│  [ ✉️ Email Us ]          │  ← Opens mail app
│  [ 💬 Send Message ]      │
│                           │
├──────────────────────────┤
│                           │
│  Your Info:               │
│  Nguyễn Văn A            │
│  0909 123 456             │
│                           │
│  [📧 Notification Settings]│
│                           │
└──────────────────────────┘
```

---

## Success Metrics

### Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tracking Page Views | >70% of requests tracked | `COUNT(sessions) / COUNT(requests)` |
| Repeat Visits | >3 views per request | `AVG(page_views per token)` |
| QR Code Scan Rate | >50% of walk-in customers | `COUNT(qr_scans) / COUNT(walk_in_requests)` |
| Mobile Traffic | >60% of views | `COUNT(mobile) / COUNT(all_sessions)` |

### Action Completion Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Online Approval Rate | >80% approve online | `COUNT(online_approvals) / COUNT(total_approvals)` |
| Delivery Confirmation Response | >70% within 24h | `COUNT(confirmed < 24h) / COUNT(confirmations)` |
| Auto-Fallback Rate | <20% | `COUNT(auto_fallback) / COUNT(confirmations)` |

### Support Reduction Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Status Inquiry Call Reduction | 40-60% decrease | Compare call logs pre/post tracking portal |
| Customer Satisfaction (Tracking) | >8.5/10 | Post-service survey rating |
| Average Response Time | N/A (self-service) | Support tickets decrease |

### Technical Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time (Mobile 3G) | <3s | Lighthouse / WebPageTest |
| Real-Time Update Latency | <10s | Time from ticket update to client notification |
| Uptime | >99.5% | Monitoring service |
| Error Rate | <0.1% | Application error tracking |

---

## Security Considerations

### SEC-001: Token-Based Access Control

**Risks**:
- Tracking token shared publicly exposes customer data
- Token guessing/enumeration attacks

**Mitigations**:
- High-entropy tokens (date + 5-digit sequence)
- Rate limiting (20 req/token/hour, 100 req/IP/hour)
- No search functionality (prevent enumeration)
- Monitor for suspicious access patterns
- Log all access attempts

---

### SEC-002: Data Privacy (GDPR/PDPA Compliance)

**Customer Data Stored**:
- Name, phone, email (necessary for service)
- IP addresses (for fraud prevention, 90-day retention)
- Session data (analytics, 90-day retention)

**Privacy Measures**:
- Cookie consent banner (if required)
- Privacy policy clearly linked
- Data retention policy enforced (auto-delete after 90 days)
- No third-party tracking scripts
- Customer can request data deletion (GDPR right to be forgotten)

---

### SEC-003: XSS and Injection Prevention

**Risks**:
- User-submitted data (issue descriptions) could contain malicious scripts
- SQL injection via tracking token input

**Mitigations**:
- Sanitize all user input (HTML escaping)
- Use parameterized queries (no string concatenation)
- Content Security Policy headers
- Input validation on all API endpoints

---

## Open Questions & Future Considerations

### Q1: Native Mobile App?

**Question**: Should we develop native iOS/Android apps for tracking?

**Current**: Mobile-responsive web app sufficient
**Future**: Consider native app if >80% mobile traffic and user requests

---

### Q2: SMS Notifications?

**Question**: Add SMS notifications in addition to email?

**Considerations**:
- Cost per SMS (~$0.01-0.05 per message)
- Customer phone number validation required
- Critical notifications only (approval requests, ready for pickup)

**Recommendation**: Phase 2 feature, implement for critical notifications

---

### Q3: Live Chat Support?

**Question**: Integrate live chat on tracking page for instant support?

**Current**: Contact form + phone/email links
**Future**: Add live chat if support call volume remains high despite tracking portal

---

### Q4: Public API for Partners?

**Question**: Provide API for corporate clients to track their devices programmatically?

**Use Case**: Company IT departments tracking multiple employee devices
**Recommendation**: Phase 3, if B2B segment grows

---

### Q5: Estimated Completion Time Algorithm?

**Question**: How to accurately predict service completion dates?

**Current**: Manual estimate by reception staff
**Future**: ML model based on historical task completion times, parts availability, technician workload

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-22 | Mary (BA Agent) | Initial requirements document based on elicitation sessions Q26-Q27 and overall system design |

---

**End of Document**
