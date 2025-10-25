# Manager User Guide - Service Center Phase 2

**Version:** 1.0
**Last Updated:** 2025-10-24
**Audience:** Service Center Managers
**Access Level:** Management oversight and coordination

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Task Progress Dashboard](#task-progress-dashboard)
4. [Service Request Management](#service-request-management)
5. [Delivery Confirmation](#delivery-confirmation)
6. [Team Performance Monitoring](#team-performance-monitoring)
7. [Reports and Analytics](#reports-and-analytics)
8. [Workflow Template Management](#workflow-template-management)
9. [Best Practices](#best-practices)
10. [Common Scenarios](#common-scenarios)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Introduction

### Overview
As a Service Center Manager, you are responsible for overseeing day-to-day operations, ensuring efficient workflow progression, and maintaining high service quality. This guide focuses on Phase 2 features that enable you to monitor task progress, manage service requests, and optimize team performance.

### Your Key Responsibilities
- **Monitor Task Progress:** Track active tickets and identify bottlenecks in real-time
- **Resolve Blocked Tasks:** Intervene when workflows are stuck or need escalation
- **Manage Service Requests:** Review and convert customer requests into service tickets
- **Confirm Deliveries:** Approve completed tickets for customer pickup/delivery
- **Analyze Performance:** Review team workload and completion metrics
- **Optimize Workflows:** Identify improvement opportunities and efficiency gains

### Key Phase 2 Features for Managers
- **Task Progress Dashboard:** Real-time overview of all active work
- **Service Request Queue:** Centralized intake from public portal
- **Delivery Confirmation Workflow:** Structured handoff to customers
- **Technician Workload Tracking:** Performance metrics and utilization
- **Auto-refresh Data:** 30-second updates for critical dashboards

---

## Getting Started

### Accessing Manager Features

After logging in with your Manager account, you have access to the following sections:

**Main Navigation:**
- **Dashboard** (`/dashboard`) - Overview with performance metrics
- **Task Progress** (`/dashboard/task-progress`) - Real-time task monitoring
- **Service Requests** (`/dashboard/service-requests`) - Incoming customer requests
- **Deliveries** (`/dashboard/deliveries`) - Completed tickets awaiting customer pickup
- **Tickets** (`/tickets`) - All service tickets
- **Customers** (`/customers`) - Customer database
- **Products** (`/products`) - Product catalog
- **Parts** (`/parts`) - Parts inventory
- **My Tasks** (`/my-tasks`) - Your assigned tasks (if you also work as technician)
- **Workflow Templates** (`/workflows/templates`) - Task template management

### Understanding Your Dashboard

Your main dashboard provides a high-level overview:
- **Section Cards:** Quick stats on tickets, customers, revenue
- **Revenue Trends:** Visual charts showing service revenue over time
- **Employee Performance:** Team completion rates and workload

**Action:** Bookmark the Task Progress Dashboard for quick access to your most important monitoring tool.

---

## Task Progress Dashboard

The Task Progress Dashboard is your primary tool for monitoring operational health across all active service tickets.

**Access:** Navigate to `/dashboard/task-progress` from the main menu.

### Dashboard Components

#### 1. Metrics Cards (Top Row)

Four key performance indicators update every 30 seconds:

**Active Tickets**
- **What it shows:** Number of tickets currently in progress
- **Color:** Blue icon
- **Why it matters:** Indicates current workload volume
- **Action threshold:** If this exceeds team capacity, consider prioritization

**Tasks In Progress**
- **What it shows:** Number of individual tasks being actively worked
- **Sub-metric:** Shows pending tasks count
- **Color:** Yellow icon
- **Why it matters:** Shows actual work happening right now
- **Action threshold:** If pending tasks are high relative to in-progress, investigate assignment issues

**Blocked Tasks**
- **What it shows:** Tasks that cannot proceed due to blockers
- **Color:** Red icon (when > 0), Gray (when 0)
- **Why it matters:** Critical bottlenecks requiring immediate attention
- **Action threshold:** ANY blocked task requires investigation

**Avg Completion Time**
- **What it shows:** Average hours to complete tasks
- **Sub-metric:** Total completed tasks count
- **Color:** Green icon
- **Why it matters:** Efficiency indicator for team performance
- **Action threshold:** Monitor trends; investigate sudden increases

#### 2. Blocked Tasks Alert Section

This section provides immediate visibility into workflow problems.

**Green Alert - "All Clear!"**
- No blocked tasks
- All workflows progressing smoothly
- No action needed

**Red Alert - "Blocked Tasks Require Attention"**
- Shows count of tickets with blocked tasks
- Lists up to 3 tickets with highest blocker counts
- Displays ticket number, customer name, and blocked task count
- Each ticket is clickable to view details

**How to Use:**
1. Review blocked ticket list immediately
2. Click ticket number to view full details
3. Identify blocking reason (typically in task notes)
4. Take action: order parts, escalate issue, or reassign
5. Follow up to ensure blocker is resolved

**Best Practice:** Check this section first thing each morning and after lunch.

#### 3. Technician Workload Table

Comprehensive view of team distribution and performance.

**Columns:**
- **Technician:** Name and email
- **Role:** Badge showing Admin/Manager/Technician
- **In Progress:** Current active tasks (yellow badge)
- **Pending:** Assigned but not started (orange badge)
- **Completed:** Finished tasks (green badge)
- **Blocked:** Stuck tasks requiring attention (red badge if > 0)
- **Completion Rate:** Percentage of completed vs total assigned tasks

**How to Interpret:**

**High Completion Rate (>80%):**
- Technician is efficient and productive
- May be ready for more complex assignments
- Consider for mentoring newer team members

**Medium Completion Rate (50-80%):**
- Normal range for most technicians
- Monitor for downward trends
- Provide support if rate is declining

**Low Completion Rate (<50%):**
- May indicate training needs
- Could signal too many difficult assignments
- Might have high blocked tasks - investigate

**High Pending Count:**
- Technician may be overloaded
- Consider redistributing assignments
- Check if tasks are properly sequenced

**High Blocked Count:**
- Requires immediate investigation
- Schedule 1-on-1 to understand blockers
- May need management intervention (parts, approvals, etc.)

**Using the Table:**
1. Sort by completion rate to identify top and bottom performers
2. Check blocked column for immediate actions needed
3. Balance workload by comparing in-progress counts
4. Use data for weekly performance reviews

### Auto-Refresh Functionality

The Task Progress Dashboard automatically refreshes every 30 seconds to provide real-time data.

**Indicators:**
- Data timestamp shown in browser tab
- No manual refresh needed
- Leave dashboard open on secondary monitor for continuous monitoring

**Best Practice:** Keep this dashboard visible during operating hours for proactive management.

---

## Service Request Management

Managers oversee the conversion of public service requests into internal service tickets.

**Access:** Navigate to `/dashboard/service-requests` from the main menu.

### Understanding the Service Request Flow

**Customer Journey:**
1. Customer submits request via public portal
2. Request appears in manager queue with "submitted" status
3. Manager reviews and changes to "received" status
4. Manager converts to ticket or rejects with reason
5. Customer receives automated email notification

### Service Requests Page Layout

#### Stats Cards

Four summary cards provide quick overview:
- **Total Requests:** All requests in system
- **Submitted:** New requests awaiting review
- **Received:** Acknowledged but not yet processed
- **Processing:** Currently being converted to tickets

**Action Items:**
- Focus on "Submitted" count each morning
- "Received" count should be processed within same day
- "Processing" should complete within 1 hour

#### Filters and Search

**Search Bar:**
- Search by tracking token (e.g., "SR-2025-001")
- Search by customer name
- Search by serial number
- Real-time search with 500ms debounce

**Status Filter:**
- All: Show everything
- Submitted: New requests only
- Received: Acknowledged requests
- Processing: Conversion in progress

**Clear Filters Button:**
- Appears when any filter is active
- One-click reset to show all requests

#### Requests Table

**Columns:**
- **Tracking Code:** Unique identifier (e.g., SR-2025-001)
- **Customer:** Name and email
- **Product:** Model and brand
- **Serial Number:** Device serial
- **Status:** Current state with color-coded badge
- **Submitted:** Time ago (e.g., "2 hours ago")
- **Actions:** View, Accept, Reject buttons

### Reviewing a Service Request

**Step 1: View Details**
1. Click "View" button (eye icon) on any request
2. Modal opens showing full request details:
   - Customer information
   - Product details
   - Serial number
   - Detailed issue description
   - Attached photos (if any)
   - Submission timestamp

**Step 2: Assess Validity**

**Valid Request Indicators:**
- Clear problem description
- Valid product information
- Customer contact info is complete
- Request is within service scope

**Invalid Request Indicators:**
- Insufficient information
- Out-of-warranty without paid service agreement
- Product not supported
- Duplicate request

### Converting Request to Ticket

**For Valid Requests:**

1. Click "Accept" button (green checkmark)
2. Convert to Ticket Modal opens

**Modal Contents:**
- Request summary (read-only)
- Customer selection/creation
- Product selection/creation
- Template selection (optional)
- Technician assignment (optional)
- Priority level
- Service fee fields
- Initial notes

**Step-by-Step Conversion:**

**Step 1: Customer Assignment**
- Search existing customers by name, email, or phone
- If found: Select from dropdown
- If not found: Click "Create New Customer"
  - Fill in name, email, phone
  - Add address (optional)
  - Save customer

**Step 2: Product Assignment**
- Search products by brand, model, or serial
- If found: Select from dropdown
- If not found: Click "Create New Product"
  - Select brand
  - Enter model name
  - Enter serial number
  - Add purchase date (if known)
  - Save product

**Step 3: Template Selection (Optional)**
- Choose workflow template based on service type:
  - **Warranty Repair:** Standard warranty workflow
  - **Paid Repair:** Customer-paid service workflow
  - **Replacement:** Product replacement workflow
- Leave blank for custom workflow
- Template auto-assigns task sequence

**Step 4: Technician Assignment**
- Review technician workload (shown in dropdown)
- Consider specialization and current capacity
- Leave unassigned for later assignment

**Step 5: Service Details**
- Set priority: Low, Normal, High, Urgent
- Enter service fee (if paid service)
- Enter diagnosis fee (if applicable)
- Add internal notes

**Step 6: Submit**
- Click "Convert to Ticket"
- System creates ticket with auto-generated number
- Request status updates to "processing"
- Customer receives email notification with ticket number
- Assigned technician receives notification (if assigned)

**Best Practice:** Convert requests within 4 business hours for good customer experience.

### Rejecting a Service Request

**When to Reject:**
- Product not supported
- Insufficient information (after follow-up attempt)
- Out-of-scope service
- Duplicate request
- Fraudulent request

**Rejection Process:**

1. Click "Reject" button (red X icon)
2. Reject Request Modal opens
3. Select rejection reason from dropdown:
   - Product not supported
   - Insufficient information
   - Out of warranty
   - Duplicate request
   - Other (specify)
4. Add detailed rejection message
   - Be professional and helpful
   - Suggest alternatives if applicable
   - Provide contact info for questions
5. Click "Reject Request"
6. Customer receives email with rejection reason

**Example Rejection Messages:**

**Product Not Supported:**
```
Thank you for your service request. Unfortunately, we do not service [Brand/Model]
products at this time. We recommend contacting [Alternative Service Provider] at
[Contact Info]. If you have questions, please call us at [Phone].
```

**Insufficient Information:**
```
We need additional information to process your request. Please reply to this email
with:
- Clear photos of the issue
- Purchase date and warranty status
- Detailed description of the problem

Once we receive this information, we can create a service ticket.
```

**Best Practice:** Always provide a helpful explanation and next steps, even when rejecting.

---

## Delivery Confirmation

Managers confirm that completed repairs are ready for customer pickup or delivery.

**Access:** Navigate to `/dashboard/deliveries` from the main menu.

### Understanding Delivery Confirmation Workflow

**Process Flow:**
1. Technician completes all tasks on ticket
2. Ticket status changes to "completed"
3. Ticket appears in Deliveries queue
4. Manager reviews and confirms delivery readiness
5. Customer receives pickup notification
6. Customer collects device or delivery is arranged

**Why Manager Confirmation?**
- Quality assurance checkpoint
- Ensures all paperwork is complete
- Confirms payment is processed (for paid services)
- Verifies device is properly packaged

### Deliveries Page Layout

#### Overview Card
- **Pending Deliveries Count:** Number awaiting confirmation
- Updates in real-time
- Click "Refresh" to manually update

#### Pending Deliveries Table

**Columns:**
- **Ticket Number:** Clickable link to ticket details
- **Customer:** Name and phone number
- **Product:** Device that was serviced
- **Completed:** Time since completion (e.g., "3 hours ago")
- **Assigned To:** Technician who completed work
- **Actions:** "Confirm Delivery" button

### Confirming a Delivery

**Step 1: Review Ticket**
1. Click ticket number to open full details
2. Review all completed tasks
3. Check if any notes mention issues
4. Verify service fee is paid (for paid services)
5. Close ticket detail view

**Step 2: Initiate Confirmation**
1. Click "Confirm Delivery" button
2. Delivery Confirmation Modal opens

**Modal Contents:**
- Ticket summary
- Customer contact info
- Completed tasks list
- Delivery method selection
- Delivery notes field
- Customer notification toggle

**Step 3: Select Delivery Method**
- **Customer Pickup:** Customer will collect device
- **Courier Delivery:** Device will be delivered to customer
- **On-site Delivery:** Technician delivers to customer location

**Step 4: Add Delivery Notes**
- Pickup location/instructions (for pickup)
- Delivery address (for delivery)
- Special instructions
- Operating hours
- Parking information (if relevant)

**Example Notes:**

**For Pickup:**
```
Device ready for pickup at reception desk. Please bring ID and ticket number.
Pickup hours: Mon-Fri 9AM-6PM, Sat 9AM-2PM. No appointment needed.
```

**For Delivery:**
```
Scheduled delivery tomorrow 2-4PM to 123 Main St. Customer has been contacted
and confirmed availability. Signature required on delivery.
```

**Step 5: Review and Confirm**
- Check "Send notification email" box (usually yes)
- Click "Confirm Delivery"
- System sends email to customer with pickup/delivery details
- Ticket status remains "completed" but marked as delivery-confirmed

### Delivery Quality Checklist

Before confirming delivery, verify:
- [ ] All tasks marked complete
- [ ] No open blockers or issues
- [ ] Device tested and functional
- [ ] Payment processed (if paid service)
- [ ] Customer contact info is current
- [ ] Delivery method is appropriate
- [ ] Special packaging done (if fragile)
- [ ] Warranty paperwork prepared
- [ ] Customer can be reached for notification

**Best Practice:** Process deliveries within 2 hours of completion to maintain momentum.

---

## Team Performance Monitoring

Managers track individual and team performance through multiple dashboards.

### Main Dashboard Employee Performance

**Access:** Main Dashboard (`/dashboard`)

The Employee Performance table appears at the bottom of your dashboard.

**Features:**
- Shows all staff members (Admin, Manager, Technician, Reception)
- Displays total assigned tickets per person
- Shows current status breakdown (In Progress, Completed, Pending)
- Calculates completion rate percentage
- Highlights top performer with "Top" badge
- Includes progress bar visualization

**Metrics Explained:**

**Total Assigned:**
- All tickets ever assigned to this person
- Includes historical and current

**In Progress:**
- Tickets currently being worked
- Should be balanced across team

**Completed:**
- Successfully finished tickets
- Key performance indicator

**Pending:**
- Assigned but not started
- High pending may indicate overload

**Completion Rate:**
- Formula: (Completed / Total Assigned) × 100
- Primary performance metric
- Top performer is highest rate with activity

**How to Use:**
1. Check weekly to identify performance trends
2. Recognize and reward top performers
3. Provide coaching to low performers
4. Balance assignments based on capacity
5. Use in performance reviews

### Task Progress Dashboard Workload View

**Access:** Task Progress Dashboard (`/dashboard/task-progress`)

Provides more granular task-level metrics:
- Individual task completion (not just tickets)
- Real-time blocked task visibility
- Task-level completion rates
- Technician specialization insights

**Differences from Main Dashboard:**
- Updates every 30 seconds (vs. on page load)
- Shows tasks not tickets
- Includes blocked task count
- More actionable for daily management

### Analyzing Team Performance

**Weekly Review Process:**

**Monday Morning:**
1. Review completion rates from previous week
2. Identify blockers that carried over weekend
3. Set weekly targets and priorities
4. Rebalance workload if needed

**Daily Check-ins:**
1. Morning: Review blocked tasks
2. Midday: Check pending task accumulation
3. End of day: Review completion progress

**Monthly Performance Review:**
1. Calculate average completion rates
2. Track improvement trends
3. Identify training needs
4. Plan capacity adjustments

**Red Flags to Watch:**

**Individual Level:**
- Completion rate dropping >10% from baseline
- Consistently high blocked tasks
- Pending tasks accumulating
- Tasks taking longer than estimates

**Team Level:**
- Overall completion rate <70%
- Blocked tasks increasing week-over-week
- Uneven workload distribution
- Frequent missed deadlines

---

## Reports and Analytics

Managers use reports to make data-driven decisions.

### Available Reports

#### Revenue Reports
**Access:** Main Dashboard charts

**What it shows:**
- Service revenue over time
- Trend lines for growth analysis
- Revenue by service type (warranty vs. paid)

**How to use:**
- Track monthly revenue targets
- Identify seasonal patterns
- Forecast capacity needs
- Support budget planning

#### Ticket Status Reports
**Access:** Tickets page (`/tickets`)

**What it shows:**
- Tickets by status (pending, in progress, completed, cancelled)
- Filter by date range
- Filter by customer, product, or technician

**How to use:**
- Calculate cycle time (pending to completed)
- Identify bottlenecks in workflow
- Track customer satisfaction metrics
- Monitor SLA compliance

#### Team Performance Reports
**Access:** Main Dashboard and Task Progress Dashboard

**What it shows:**
- Individual performance metrics
- Team aggregate statistics
- Completion rate trends
- Task type distribution

**How to use:**
- Performance reviews
- Workload planning
- Training needs assessment
- Capacity planning

### Key Performance Indicators (KPIs)

**For Daily Monitoring:**
- Blocked tasks count (target: 0)
- Average completion time (track trend)
- Pending tasks aging (target: <24hrs)

**For Weekly Reviews:**
- Team completion rate (target: >75%)
- Ticket cycle time (target: <7 days)
- Customer satisfaction scores

**For Monthly Analysis:**
- Revenue per technician
- Task completion accuracy
- Workflow efficiency gains
- Customer retention rate

---

## Workflow Template Management

Managers can view and understand workflow templates to make better assignment decisions.

**Access:** Navigate to `/workflows/templates`

### Understanding Templates

**What are Templates?**
- Predefined sequences of tasks for common service types
- Ensure consistency across similar repairs
- Enforce quality checkpoints
- Estimate completion time

**Common Template Types:**
1. **Warranty Repair:** Standard manufacturer warranty workflow
2. **Paid Repair:** Customer-paid service workflow
3. **Replacement:** Product replacement procedure
4. **Diagnostic Only:** Evaluation without repair

### Template Components

**Each template includes:**
- **Name:** Descriptive template name
- **Service Type:** Warranty, Paid, or Replacement
- **Product Type:** Which products this applies to
- **Sequence Mode:**
  - Strict: Tasks must complete in order
  - Flexible: Tasks can be done in any order
- **Task List:** Ordered list of tasks to perform

### Using Templates Effectively

**When Assigning Tickets:**
1. Match product type to template
2. Check service type (warranty status)
3. Consider technician expertise with template
4. Verify template has appropriate tasks

**Template Selection Guide:**

**Laptop Repair:**
- Use "Laptop Diagnostic & Repair" template
- Ensures systematic troubleshooting
- Includes data backup step
- Typical completion: 3-5 days

**Phone Screen Replacement:**
- Use "Phone Screen Replacement" template
- Quick turnaround template
- Includes quality testing
- Typical completion: 2-4 hours

**Complex Diagnosis:**
- Use "Comprehensive Diagnostic" template
- Thorough evaluation process
- Multiple testing phases
- Typical completion: 1-2 days

**Best Practice:** Review template tasks before assigning to ensure it matches customer needs.

---

## Best Practices

### Daily Manager Routine

**Morning (8:00 AM - 9:00 AM):**
1. Check Task Progress Dashboard for blocked tasks
2. Review overnight service requests
3. Check pending deliveries from yesterday
4. Review team workload distribution
5. Respond to urgent messages/emails

**Midday (12:00 PM - 1:00 PM):**
1. Convert morning service requests to tickets
2. Confirm completed deliveries
3. Check for new blocked tasks
4. Follow up on morning escalations

**Afternoon (3:00 PM - 4:00 PM):**
1. Process remaining service requests
2. Review daily completion progress
3. Prepare tomorrow's assignments
4. Update management on status

**End of Day (5:00 PM - 5:30 PM):**
1. Final blocked tasks check
2. Review team completion rates
3. Note carryover items for tomorrow
4. Respond to pending questions

### Weekly Manager Routine

**Monday:**
- Set weekly priorities and targets
- Review previous week's performance
- Rebalance workload if needed

**Wednesday:**
- Mid-week progress check
- Address any brewing issues
- Adjust assignments as needed

**Friday:**
- Week-end completion push
- Prepare weekend handoff notes
- Review weekly KPIs
- Plan next week

### Communication Best Practices

**With Technicians:**
- Daily standup or check-in
- Clear blocker resolution process
- Positive recognition for good work
- Constructive feedback on issues

**With Customers:**
- Professional email tone
- Clear expectations on timing
- Proactive status updates
- Empathetic problem resolution

**With Management:**
- Weekly status reports
- Early warning on issues
- Data-driven recommendations
- Success stories

### Prioritization Framework

**Priority Levels:**

**P1 - Urgent:**
- Customer VIP or escalated
- Device needed for business critical use
- Warranty deadline approaching
- Revenue impact >$500

**P2 - High:**
- Paid service (revenue generating)
- Quick turnaround possible
- Parts available
- Technician expertise matches

**P3 - Normal:**
- Standard warranty repair
- Typical complexity
- No time pressure
- Parts may need ordering

**P4 - Low:**
- Diagnostic only
- Low urgency
- Waiting on customer decision
- Educational/training opportunity

**Action:** Assign technicians based on priority and skill match.

---

## Common Scenarios

### Scenario 1: High Volume of Blocked Tasks

**Situation:**
Task Progress Dashboard shows 5+ blocked tasks across multiple tickets.

**Analysis Questions:**
- What is the common blocker? (parts, approvals, customer info)
- Is it one technician or multiple?
- How long have tasks been blocked?
- What is the business impact?

**Resolution Steps:**
1. Group blockers by type (parts, info, approval)
2. For parts blockers:
   - Check parts inventory
   - Expedite orders if possible
   - Consider alternative parts
3. For approval blockers:
   - Escalate to appropriate manager
   - Gather supporting information
   - Set decision deadline
4. For information blockers:
   - Contact customer immediately
   - Send email with specific questions
   - Set follow-up reminder
5. Update all stakeholders on resolution plan

**Prevention:**
- Improve parts stock levels
- Clarify approval processes
- Better upfront customer information gathering

### Scenario 2: Technician Performance Declining

**Situation:**
Team member's completion rate dropped from 75% to 55% over two weeks.

**Analysis Questions:**
- Are tasks more complex recently?
- High number of blocked tasks?
- Personal issues affecting work?
- Training gaps?

**Resolution Steps:**
1. Schedule private conversation
2. Review specific tickets causing delays
3. Identify root cause:
   - Skill gap: Arrange training or pairing
   - Overload: Redistribute assignments
   - Personal: Offer support and flexibility
   - Process: Fix systematic issues
4. Create improvement plan with clear goals
5. Schedule follow-up in one week
6. Monitor progress daily

**Prevention:**
- Regular performance conversations
- Balanced workload distribution
- Ongoing training opportunities
- Clear escalation paths

### Scenario 3: Service Request Surge

**Situation:**
20+ service requests submitted over weekend.

**Analysis Questions:**
- Is this seasonal or unusual?
- What product types are affected?
- Are requests valid or spam?
- Do we have capacity to handle?

**Resolution Steps:**
1. **Triage (30 minutes):**
   - Scan all requests for urgency
   - Flag VIP customers
   - Identify duplicates
   - Mark obvious rejects

2. **Batch Processing (2 hours):**
   - Convert all urgent/VIP first
   - Group similar requests
   - Reject invalid requests
   - Queue normal priority

3. **Capacity Planning:**
   - Check technician availability
   - Consider temporary help
   - Adjust completion targets
   - Communicate timeline to customers

4. **Communication:**
   - Send batch acknowledgment emails
   - Set realistic expectations
   - Update management on situation

**Prevention:**
- Marketing coordination on promotions
- Capacity planning for known busy seasons
- Automated request filtering
- Self-service diagnostic tools

### Scenario 4: Delivery Backlog

**Situation:**
15 completed tickets awaiting delivery confirmation, some 2+ days old.

**Analysis Questions:**
- Why wasn't this processed sooner?
- Are customers waiting?
- Is payment processed?
- Any special circumstances?

**Resolution Steps:**
1. **Prioritize by Age:**
   - Process oldest first
   - Focus on paying customers
   - Escalate >3 days old

2. **Batch Review (1 hour):**
   - Open each ticket
   - Verify completion quality
   - Check payment status
   - Prepare delivery notes

3. **Bulk Confirmation:**
   - Confirm all ready deliveries
   - Group notifications
   - Update customers on pickup/delivery

4. **Customer Recovery:**
   - Personal call to >3 day customers
   - Offer apology and explanation
   - Express delivery if appropriate
   - Note in CRM for follow-up

**Prevention:**
- Daily delivery confirmation process
- Automated alerts at 24 hours
- Include in daily checklist
- Assign backup processor

### Scenario 5: Customer Complaint About Service Quality

**Situation:**
Customer calls saying their device still has the original problem after "completed" repair.

**Immediate Response:**
1. Apologize sincerely
2. Gather details on issue
3. Review ticket history
4. Verify what was actually done

**Investigation Steps:**
1. Pull up completed ticket
2. Review all task notes
3. Check testing documentation
4. Identify if:
   - Misdiagnosis
   - Incomplete repair
   - New problem
   - User error

**Resolution:**
1. **If Our Error:**
   - Acknowledge mistake
   - Offer immediate free rework
   - Escalate to senior technician
   - No additional charge
   - Expedite processing

2. **If New Problem:**
   - Explain difference from original issue
   - Offer standard diagnostic
   - Customer decision on proceeding

3. **If User Error:**
   - Politely educate customer
   - Provide written instructions
   - Offer brief training
   - Build goodwill

**Follow-up:**
- Call customer after rework completion
- Verify satisfaction
- Learn from incident
- Update processes if needed

---

## Troubleshooting

### Dashboard Not Updating

**Symptoms:**
- Data appears stale
- Metrics don't change after known events
- "Last updated" timestamp is old

**Solutions:**
1. Check internet connection
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cache
4. Try different browser
5. Check with IT if persistent

### Service Request Not Appearing

**Symptoms:**
- Customer says they submitted request
- Not visible in manager queue
- Confirmation email sent to customer

**Solutions:**
1. Check all status filters (may be in wrong status)
2. Use search by customer email
3. Check tracking token customer provides
4. Verify request not already converted (check tickets)
5. Check system logs with IT support

### Cannot Convert Request to Ticket

**Symptoms:**
- "Convert" button disabled or missing
- Error message when attempting conversion
- Modal doesn't open

**Solutions:**
1. Check your user role (must be Manager or Admin)
2. Verify request is in correct status (submitted or received)
3. Refresh page and retry
4. Check browser console for errors
5. Contact system administrator

### Technician Not Seeing Assigned Tasks

**Symptoms:**
- You assigned ticket to technician
- Technician says they don't see it
- Notification email not sent

**Solutions:**
1. Verify assignment saved (reload ticket)
2. Check technician email is correct in profile
3. Ask technician to refresh their task page
4. Verify technician has correct role
5. Check notification system status

### Completion Rate Seems Wrong

**Symptoms:**
- Employee performance shows unexpected percentage
- Known completed tickets not counted
- Numbers don't match manual count

**Solutions:**
1. Verify date range being calculated
2. Check if tickets are truly "completed" status
3. Refresh dashboard to get latest data
4. Check if technician reassignment affected historical data
5. Report discrepancy to IT with specific examples

### Delivery Confirmation Email Not Sending

**Symptoms:**
- Confirmed delivery but customer didn't receive email
- No error message shown
- Other emails working fine

**Solutions:**
1. Check "Send notification" box was checked
2. Verify customer email address is correct
3. Ask customer to check spam folder
4. Resend notification from ticket detail page
5. Check email system status with IT

---

## FAQ

### General Questions

**Q: What's the difference between Manager and Admin roles?**

A: Admins have full system access including user management, system configuration, and advanced settings. Managers focus on operational oversight: monitoring tasks, managing requests, and team performance. Admins can do everything Managers can do, plus system administration.

**Q: How often should I check the Task Progress Dashboard?**

A: At minimum: morning, midday, and end of day. For busy periods, keep it open on a secondary monitor with auto-refresh. The 30-second update interval ensures you catch issues quickly.

**Q: Can I also work on tickets as a technician if I'm a Manager?**

A: Yes! Your Manager role gives you access to both management tools and the "My Tasks" section. You can be assigned tickets just like any technician. However, prioritize management duties during peak times.

### Task Management

**Q: What should I do when a task is blocked for more than 24 hours?**

A:
1. Investigate the blocker reason immediately
2. If waiting on parts: expedite order or find alternative
3. If waiting on customer: escalate contact attempts
4. If waiting on approval: escalate to decision maker
5. If technical issue: assign senior technician
6. Document all actions in ticket notes

**Q: How do I balance workload when one technician is much faster than others?**

A: Speed isn't the only factor. Consider:
- Give faster technician more complex/urgent tickets
- Use faster technician for training/mentoring
- Verify quality isn't sacrificed for speed
- Ensure difficult tickets aren't all with one person
- Balance revenue-generating vs. warranty work

**Q: Should I enforce strict template sequences?**

A: Depends on service type:
- **Strict for:** Safety-critical repairs, warranty work (compliance), training scenarios
- **Flexible for:** Experienced technicians, unusual situations, time-sensitive work
- Best practice: Start strict, relax as technician proves competence

### Service Requests

**Q: How quickly should I respond to service requests?**

A: Target response times:
- Acknowledge receipt: Within 4 business hours
- Initial review: Within 8 business hours
- Convert or reject decision: Within 24 business hours
- Urgent/VIP: Within 1 business hour

**Q: What if I don't have enough information to convert a request?**

A: Don't reject immediately. Instead:
1. Change status to "received" to acknowledge
2. Email customer requesting specific information
3. Give customer 48 hours to respond
4. Set reminder to follow up
5. If no response after 48 hours, send final reminder
6. Reject only after no response to multiple attempts

**Q: Can customers edit requests after submission?**

A: No, customers cannot edit after submission. If they need changes:
1. Ask them to submit new request
2. Reject old request (reason: "replaced by new request")
3. Link new request in notes
4. Process new request normally

### Delivery Confirmation

**Q: What if customer can't pick up device for 2+ weeks?**

A:
1. Confirm delivery anyway (marks work as done)
2. In notes: specify "holding until [date]"
3. Arrange secure storage location
4. Send customer periodic reminders
5. After 30 days: contact customer about abandonment policy
6. Document all communications

**Q: Can I let technician confirm their own deliveries?**

A: Not recommended. Manager confirmation provides:
- Quality assurance checkpoint
- Payment verification
- Customer communication consistency
- Service quality oversight
- However, for trusted senior technicians on simple repairs, you may delegate with spot-checking

**Q: What if device fails quality check before delivery?**

A:
1. Do NOT confirm delivery
2. Change ticket status back to "in progress"
3. Create new task for rework
4. Assign to same or different technician
5. Document issue in ticket notes
6. No additional customer charge if our error

### Performance Monitoring

**Q: Is 70% completion rate good or bad?**

A: Context matters:
- **70% for new technician:** Good (learning phase)
- **70% for experienced tech:** Investigate (may indicate issues)
- **70% for complex work:** Acceptable (difficult repairs take longer)
- **70% for simple work:** Low (should be >80%)

Trend is more important than absolute number. Declining rate is red flag.

**Q: My top performer wants a raise. How do I support that?**

A: Document evidence:
- Completion rate vs. team average
- Customer satisfaction feedback
- Mentor role / helping others
- Complex ticket success rate
- Revenue generated
- Use Employee Performance table data
- Present business case to senior management

**Q: How do I address a technician who complains about blocked tasks?**

A:
1. Review their specific blocked tasks
2. Validate if blockers are legitimate
3. If legitimate: work to resolve systemic issues
4. If not legitimate: coach on problem-solving
5. Compare their blocked % to team average
6. Provide training on escalation process

### System and Technical

**Q: Can I export performance data to Excel?**

A: Currently, use browser print-to-PDF:
1. Open dashboard or table
2. Browser → Print
3. Select "Save as PDF"
4. Use PDF for records/reports
(Future versions may include direct export)

**Q: Can I customize which metrics show on dashboards?**

A: Dashboard metrics are currently fixed based on role. Customization is planned for future release. For now, use bookmarks to quickly access different dashboards.

**Q: What happens if two managers convert the same request?**

A: System prevents this:
- First conversion succeeds
- Second receives error: "Request already converted"
- Original request shows linked ticket
- Second manager should check tickets page

**Q: Can I see historical data beyond what's shown?**

A: Current dashboards show real-time/recent data. For historical analysis:
- Use ticket search with date filters
- Export ticket reports
- Contact IT for database queries
- Future releases will include historical dashboards

---

## Additional Resources

### Quick Reference Cards

See `/docs/phase2/quick-reference/` for printable guides:
- Daily manager checklist
- Blocked task resolution guide
- Service request decision tree
- Delivery confirmation checklist

### Video Tutorials

Coming soon:
- Task Progress Dashboard walkthrough
- Converting service requests end-to-end
- Performance monitoring best practices
- Team workload balancing

### Support Contacts

**Technical Support:**
- Email: support@sstc-service.com
- Phone: (555) 123-4567
- Hours: Mon-Fri 8AM-6PM

**System Administrator:**
- Contact your IT administrator for:
  - User access issues
  - Data discrepancies
  - System configuration
  - Feature requests

**Training:**
- New manager onboarding: Contact HR
- Refresher training: Schedule with Admin
- Advanced features: Request via support

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-24 | Initial manager guide for Phase 2 | System Documentation |

---

**Next Steps:**
1. Bookmark Task Progress Dashboard for quick access
2. Set up daily calendar reminders for dashboard checks
3. Schedule weekly performance review meetings
4. Create manager workspace with dual monitors (recommended)
5. Review Admin Guide for additional system capabilities

**Remember:** Your role as Manager is to keep work flowing, support your team, and maintain quality. Use these tools proactively to prevent problems rather than reactively to fix them.
