# Reception User Guide - Service Center Phase 2

**Version:** 1.0
**Last Updated:** 2025-10-24
**Audience:** Reception Staff
**Access Level:** Customer service and ticket creation

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Service Request Management](#service-request-management)
4. [Converting Requests to Tickets](#converting-requests-to-tickets)
5. [Direct Ticket Creation](#direct-ticket-creation)
6. [Customer Management](#customer-management)
7. [Delivery Confirmation Support](#delivery-confirmation-support)
8. [Communication Best Practices](#communication-best-practices)
9. [Common Workflows](#common-workflows)
10. [Tips and Best Practices](#tips-and-best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

### Overview
As a Reception staff member, you are the first point of contact for customers seeking service. This guide covers your responsibilities in Phase 2, including managing online service requests, creating service tickets, and supporting the delivery confirmation process.

### Your Responsibilities
- **Monitor and manage** incoming service requests from the public portal
- **Convert requests** into service tickets
- **Create tickets** directly for walk-in customers
- **Manage customer records** and maintain accurate contact information
- **Support delivery coordination** when repairs are completed
- **Communicate effectively** with customers throughout the service process

### Key Phase 2 Features for Reception
- **Service Request Queue:** Real-time dashboard of incoming customer requests
- **One-Click Conversion:** Transform online requests into service tickets
- **Smart Customer Matching:** Automatic customer lookup by phone/email
- **Template Selection:** Choose appropriate service workflows
- **Delivery Tracking:** Monitor completed repairs awaiting customer pickup
- **Email Notifications:** Automated customer communications

---

## Getting Started

### Accessing the System
1. Navigate to `http://localhost:3025` (or your organization's URL)
2. Click "Login" button
3. Enter your reception credentials:
   - Email: your assigned email
   - Password: your password
4. Click "Sign In"

### Reception Dashboard Overview
After login, your dashboard displays:

**Key Sections:**
- **Service Requests Counter** - Number of pending requests awaiting review
- **Active Tickets** - Tickets currently in progress
- **Pending Deliveries** - Completed repairs ready for customer pickup
- **Quick Actions** - Fast access to common tasks

**Navigation Menu:**
- **Dashboard** - Home page overview
- **Service Requests** - Online request queue (your primary workspace)
- **Tickets** - All service tickets (view and create)
- **Customers** - Customer database
- **Deliveries** - Completed tickets awaiting pickup

### Understanding Your Role
Reception staff have permissions to:
- ✅ View and manage service requests
- ✅ Create new service tickets
- ✅ Create and edit customer records
- ✅ View ticket details and status
- ✅ Support delivery confirmations
- ❌ Modify task workflows or templates (Admin only)
- ❌ Complete technical tasks (Technician only)
- ❌ Manage warehouses or RMA batches (Admin only)

---

## Service Request Management

### What is a Service Request?
Service requests are online submissions from customers through the public portal. Customers fill out a form describing their repair needs, and these requests appear in your queue for review.

**Request Information Includes:**
- Tracking token (for customer reference)
- Customer name, email, phone
- Product brand and model
- Serial number
- Issue description
- Submission timestamp

### Accessing the Service Request Queue

**Step 1: Navigate to Service Requests**
1. Click "Service Requests" in the main menu
2. View the dashboard showing:
   - **Total Requests** - All requests in system
   - **Đã gửi (Submitted)** - New requests awaiting review
   - **Đã tiếp nhận (Received)** - Acknowledged but not yet processed
   - **Đang xử lý (Processing)** - Currently being converted to tickets

**Step 2: Understanding Request Status**
- **Đã gửi (Submitted)** - New request, no action taken yet
- **Đã tiếp nhận (Received)** - You acknowledged receipt
- **Đang xử lý (Processing)** - Conversion to ticket in progress
- **Đã từ chối (Rejected)** - Request declined with reason

### Searching and Filtering Requests

**Search by:**
- Tracking token (e.g., TRK-2025-001)
- Customer name
- Serial number

**Filter by Status:**
1. Click the "Lọc theo trạng thái" (Filter by status) dropdown
2. Select desired status
3. View filtered results

**Clear Filters:**
- Click "Xóa bộ lọc" (Clear filters) button to reset

### Viewing Request Details

**To see full request information:**
1. Find the request in the table
2. Click the "Xem" (View) button with eye icon
3. Review the detail modal showing:
   - Complete customer information
   - Full product details
   - Issue description
   - Uploaded images (if any)
   - Request submission date

**Quick Actions from Detail View:**
- **Chấp nhận (Accept)** - Convert to ticket
- **Từ chối (Reject)** - Decline the request
- **Close** - Return to list

### Rejecting a Request

Sometimes you need to decline a request (e.g., out of warranty, not serviceable).

**Steps:**
1. Open request detail or click "Từ chối" (Reject) button
2. Enter rejection reason (required, at least 10 characters)
   - Example: "Sản phẩm này nằm ngoài phạm vi dịch vụ của chúng tôi"
3. Click "Xác nhận từ chối" (Confirm rejection)
4. System automatically sends email to customer with reason
5. Request status changes to "Đã từ chối"

**When to Reject:**
- Product not covered by your service center
- Issue outside warranty terms
- Duplicate submission
- Insufficient information (after attempting to contact customer)

---

## Converting Requests to Tickets

### Overview
Converting a request creates an official service ticket in the system. This is the most common task for reception staff.

### Step-by-Step Conversion Process

**Step 1: Select Request**
1. Navigate to Service Requests page
2. Find the request to convert
3. Click "Chấp nhận" (Accept) button
4. Conversion modal opens

**Step 2: Review Pre-populated Information**
The system automatically fills in:
- ✅ Customer name
- ✅ Customer email
- ✅ Customer phone
- ✅ Product brand and model
- ✅ Serial number
- ✅ Issue description

**Information Display:**
- **Customer Card** - Shows customer details that will be used
- **Product Card** - Shows product information
- System note: "Hệ thống sẽ tìm hoặc tạo mới khách hàng với thông tin này" (System will find or create customer with this information)

**Step 3: Select Service Type**
Choose one:
- **Bảo hành (Warranty)** - Covered under warranty terms
- **Dịch vụ trả phí (Paid)** - Customer pays for service

**How to Decide:**
- Check product warranty period
- Review customer's warranty documentation
- If unsure, select "Bảo hành" and technician can adjust later

**Step 4: Set Priority Level**
Choose one:
- **Thấp (Low)** - Routine service, no urgency
- **Bình thường (Normal)** - Standard priority (default)
- **Cao (High)** - Customer needs quick turnaround

**Priority Guidelines:**
- **High:** Business-critical devices, urgent customer need
- **Normal:** Most standard repairs
- **Low:** Cosmetic issues, no time pressure

**Step 5: Add Additional Notes (Optional)**
- Enter any extra information from your conversation with the customer
- Notes about special handling requirements
- Customer preferences or concerns
- Examples:
  - "Khách hàng yêu cầu gọi trước khi sửa nếu chi phí > 500k"
  - "Thiết bị có dữ liệu quan trọng, cần backup"
  - "Khách hàng sẽ ghé lấy vào thứ 6"

**Step 6: Create Ticket**
1. Review all information
2. Click "Tạo phiếu dịch vụ" (Create service ticket)
3. System processes conversion:
   - Finds existing customer by phone/email OR creates new customer
   - Generates ticket number (e.g., SV-2025-042)
   - Changes request status to "Processing"
   - Links request to ticket
   - Sends email confirmation to customer
4. You're redirected to the new ticket detail page

### After Conversion

**What Happens Next:**
- Ticket appears in the main ticket queue
- Customer receives email with ticket number and tracking link
- Technicians can see the ticket and begin work
- You can view ticket status anytime

**Customer Communication:**
- Ticket number is automatically sent to customer email
- Customer can track status via public portal
- System sends automated updates when status changes

---

## Direct Ticket Creation

### When to Use Direct Creation
Use direct ticket creation for:
- Walk-in customers (not from online request)
- Phone call requests
- Emergency repairs
- VIP customers requiring immediate processing

### Step-by-Step Direct Creation

**Step 1: Navigate to Ticket Creation**
1. Click "Tickets" in main menu
2. Click "+ Tạo phiếu mới" (Create new ticket) button
3. Or navigate directly to `/tickets/add`

**Step 2: Enter Customer Information**

**Phone Number (Required):**
1. Enter customer phone number in "Số điện thoại" field
2. System automatically searches for existing customer
3. If found, customer details auto-populate
4. If not found, fill in new customer information

**Customer Details (Required):**
- **Họ tên (Full Name):** Customer's full name
- **Số điện thoại (Phone):** Contact number (must be unique)
- **Email:** Email address (optional but recommended)
- **Địa chỉ (Address):** Customer address (optional)

**Tip:** Always verify phone number accuracy - it's the primary identifier!

**Step 3: Select Product**

**Using Searchable Select:**
1. Click "Chọn sản phẩm" (Select product) dropdown
2. Type to search by:
   - Product name
   - Brand name
   - Model number
   - SKU code
3. Select the matching product

**Product Information Shows:**
- Product name
- Brand
- Product type (Laptop, Phone, Tablet, etc.)
- Model number
- SKU code

**If Product Not Found:**
- Ask admin to add product to catalog first
- Cannot create ticket without product selection

**Step 4: Enter Issue Description**
1. In "Mô tả vấn đề" (Issue description) field
2. Enter detailed description of the problem
3. Include:
   - Specific symptoms
   - When issue started
   - Any error messages
   - Customer's observations

**Good Example:**
```
Laptop không khởi động được. Màn hình đen hoàn toàn.
Khách hàng cho biết tối qua còn dùng bình thường.
Sáng nay bật máy không lên. Đèn nguồn không sáng.
```

**Poor Example:**
```
Máy bị hỏng
```

**Step 5: Set Service Parameters**

**Service Type:**
- **Warranty:** Product under warranty
- **Paid:** Out of warranty or paid service
- **Goodwill:** Courtesy repair (rare, check with manager)

**Priority Level:**
- **Low:** No urgency
- **Normal:** Standard priority (default)
- **High:** Urgent
- **Urgent:** Critical (rare, requires manager approval)

**Step 6: Enter Cost Estimates (Optional)**
You can enter initial estimates:
- **Phí dịch vụ (Service Fee):** Labor cost
- **Phí chuẩn đoán (Diagnosis Fee):** Inspection fee
- **Giảm giá (Discount):** Any applicable discount

**Note:** Technicians usually update these during service. You can leave at 0 initially.

**Step 7: Add Parts (Optional)**
If you know specific parts needed:
1. Click "+ Thêm linh kiện" (Add part)
2. Search for part
3. Set quantity
4. Repeat for additional parts

**Tip:** Usually skip this step - technicians add parts during diagnosis.

**Step 8: Review and Submit**
1. Scroll through form and verify all required fields
2. Check for typos in customer information
3. Click "Tạo phiếu dịch vụ" (Create service ticket)
4. System validates and creates ticket
5. You're redirected to ticket detail page

### After Creation

**Immediate Actions:**
- Ticket number is generated (e.g., SV-2025-043)
- Customer receives confirmation email
- Ticket appears in technician queue
- Initial comment is added with issue description

**Best Practice:**
- Print or note the ticket number for customer
- Confirm customer email address so they receive updates
- Inform customer of estimated turnaround time

---

## Customer Management

### Viewing Customer Database

**Access Customer List:**
1. Click "Customers" in main menu
2. View complete customer database
3. Use search to find specific customers
4. Filter and sort as needed

**Customer Information Displayed:**
- Full name
- Phone number (primary identifier)
- Email address
- Address
- Total tickets (service history count)
- Registration date

### Adding a New Customer

**When Creating Tickets:**
- New customers are automatically created during ticket creation
- System uses phone number as unique identifier

**Manual Customer Creation:**
1. Navigate to Customers page
2. Click "+ Add Customer" button
3. Fill in form:
   - **Full Name** (required)
   - **Phone** (required, must be unique)
   - **Email** (optional but recommended)
   - **Address** (optional)
4. Click "Create Customer"

**Important:** Phone number must be unique in system!

### Editing Customer Information

**To Update Customer Details:**
1. Go to Customers page
2. Find customer in list
3. Click customer name or edit button
4. Modify information:
   - Update phone number
   - Fix email address
   - Update address
   - Correct name spelling
5. Click "Save Changes"

**Common Updates:**
- Phone number changes
- Email address additions
- Address updates
- Name corrections

### Viewing Customer History

**To See Past Tickets:**
1. Click on customer name
2. View customer detail page
3. See "Service History" section with:
   - All previous tickets
   - Ticket numbers
   - Dates
   - Status
   - Products serviced

**Use History For:**
- Understanding repeat issues
- Checking warranty status
- Providing better service based on history
- Identifying VIP customers

### Customer Communication Management

**Email Unsubscribe:**
- Customers can unsubscribe from emails via links in notifications
- Check `email_unsubscribed` field in customer record
- If customer asks to resubscribe, ask admin to update the field

**Contact Preferences:**
- Note customer preferences in ticket comments
- Some customers prefer phone over email
- Document special instructions

---

## Delivery Confirmation Support

### Overview
When repairs are completed, products move to "Chờ trả khách" (Ready for Pickup) status. Reception staff coordinate with customers for pickup or delivery.

### Accessing Pending Deliveries

**Navigation:**
1. Click "Dashboard" then "Deliveries"
2. Or navigate to `/dashboard/deliveries`
3. View list of completed tickets awaiting delivery

**Information Shown:**
- Ticket number
- Customer name and phone
- Product
- Completion date
- Time waiting for pickup

### Notifying Customers

**When Ticket is Completed:**
1. System automatically sends email notification
2. Email includes:
   - Ticket number
   - "Repair completed" status
   - Pickup instructions
   - Your contact information

**Follow-up Communication:**
If customer hasn't responded in 2-3 days:
1. Call customer using phone number on ticket
2. Confirm they received email notification
3. Arrange pickup time
4. Note conversation in ticket comments

**Phone Call Script:**
```
"Xin chào [Tên khách hàng],

Đây là [Tên bạn] từ [Tên công ty].

Chúng tôi gọi để thông báo thiết bị [sản phẩm]
của quý khách đã sửa xong, mã phiếu [số phiếu].

Quý khách có thể đến nhận máy vào thời gian nào
thuận tiện ạ?"
```

### Coordinating Pickup

**Scheduling Pickup:**
1. Confirm customer preferred date/time
2. Note pickup appointment in ticket comments
3. Prepare device and any accessories
4. Have invoice ready (if paid service)

**During Pickup:**
1. Verify customer identity (ID or phone number)
2. Show device and explain repairs performed
3. Demonstrate device is working
4. Collect payment if applicable
5. Proceed to delivery confirmation

### Delivery Confirmation Process

**When Customer Arrives:**
1. Open the ticket detail page
2. Scroll to delivery section
3. Click "Xác nhận giao hàng" (Confirm delivery) button
4. Delivery confirmation modal opens

**Confirmation Steps:**
1. **Verify customer identity** - Check ID or phone
2. **Show device to customer** - Demonstrate repairs
3. **Add delivery notes** (optional)
   - Example: "Khách hàng đã kiểm tra và hài lòng"
4. **Collect customer signature**
   - Click "Thêm chữ ký" (Add signature)
   - Hand device/tablet to customer
   - Customer signs on signature pad
   - Save signature
5. **Complete confirmation**
   - Click "Xác nhận giao hàng"
   - System updates ticket status to "Delivered"
   - Uploads signature to storage
   - Sends final email to customer

**What Happens After Confirmation:**
- Ticket status changes to "Đã trả khách" (Returned to Customer)
- Signature is saved to ticket record
- Final email confirmation sent to customer
- Product moves to "Đã trả khách" warehouse (automatic)
- Ticket is closed

### Handling Delivery Issues

**Customer Not Satisfied:**
1. Do NOT confirm delivery
2. Document customer concerns in ticket comments
3. Escalate to technician or manager
4. Re-open ticket if necessary
5. Arrange for additional repairs

**Missing Accessories:**
1. Check ticket intake notes
2. Search for items in storage
3. Document what was returned vs. what was received
4. Get manager approval before confirming delivery

**Payment Issues:**
1. Confirm payment amount with ticket total cost
2. Collect payment before device handover
3. Issue receipt
4. Then proceed with delivery confirmation

---

## Communication Best Practices

### Professional Customer Service

**Greeting Customers:**
- Use formal Vietnamese address (Quý khách, Anh/Chị)
- Introduce yourself and your role
- Smile and maintain friendly tone

**Active Listening:**
- Let customer fully explain the issue
- Take notes while they speak
- Ask clarifying questions
- Repeat back to confirm understanding

**Setting Expectations:**
- Provide realistic time estimates
- Explain the service process
- Inform about any potential costs
- Give ticket number for tracking

### Phone Communication

**Answering Calls:**
```
"[Tên công ty], bộ phận tiếp nhận, [Tên bạn] nghe ạ."
```

**Taking Messages:**
- Note caller name and phone
- Document issue or request
- Promise callback time
- Create reminder for follow-up

**Following Up:**
- Call back at promised time
- Reference previous conversation
- Provide updates or solutions
- Document call in ticket comments

### Email Communication

**Professional Email Format:**
- Use company email template
- Include ticket number in subject
- Be clear and concise
- Close with contact information

**Response Time:**
- Reply to customer emails within 24 hours
- Even if just to acknowledge receipt
- Provide expected resolution timeframe

### Difficult Situations

**Angry Customers:**
- Stay calm and professional
- Acknowledge their frustration
- Apologize for inconvenience
- Focus on solutions
- Escalate to manager if needed

**Language Barriers:**
- Speak slowly and clearly
- Use simple terms
- Avoid technical jargon
- Confirm understanding
- Use visual aids if helpful

**Complaints:**
- Listen without interrupting
- Express empathy
- Document the complaint
- Explain next steps
- Follow up to ensure resolution

---

## Common Workflows

### Workflow 1: Public Request → Conversion → Ticket Creation

**Scenario:** Customer submits online service request

**Steps:**
1. **Monitor Queue**
   - Check Service Requests page regularly
   - Look for new "Đã gửi" (Submitted) requests

2. **Review Request**
   - Click "Xem" (View) to see details
   - Verify information is complete
   - Check if request is valid

3. **Decision Point**
   - ✅ **Accept:** Request is valid and serviceable
   - ❌ **Reject:** Request cannot be serviced

4. **If Accepting:**
   - Click "Chấp nhận" (Accept)
   - Review pre-populated information
   - Select service type (Warranty/Paid)
   - Set priority (Normal is default)
   - Add any notes from customer contact
   - Click "Tạo phiếu dịch vụ"

5. **Post-Conversion**
   - Note ticket number
   - Verify customer received email
   - Monitor ticket progress
   - Ready to answer customer inquiries

**Time:** 3-5 minutes per request

---

### Workflow 2: Walk-in Customer → Direct Ticket Creation

**Scenario:** Customer walks in with device needing service

**Steps:**
1. **Greet Customer**
   - Welcome professionally
   - Ask for phone number
   - Check if existing customer

2. **Gather Information**
   - Customer name and contact details
   - Product information (brand, model, serial)
   - Detailed issue description
   - Warranty status
   - Urgency level

3. **Create Ticket**
   - Navigate to Tickets > Add New
   - Enter phone number (system searches)
   - If existing customer: verify information
   - If new customer: enter all details
   - Select product from dropdown
   - Enter issue description
   - Set service type and priority
   - Create ticket

4. **Communicate with Customer**
   - Provide ticket number (write it down)
   - Explain service process
   - Give estimated timeframe
   - Confirm email for updates
   - Provide tracking portal URL

5. **Document Device Condition**
   - Add comment about device condition
   - Note any existing damage
   - Document accessories received
   - Have customer confirm

**Time:** 10-15 minutes per walk-in

---

### Workflow 3: Completed Repair → Customer Notification → Delivery Confirmation

**Scenario:** Technician completes repair, customer needs to pick up device

**Steps:**
1. **Monitor Deliveries Page**
   - Check pending deliveries daily
   - Note tickets ready for pickup
   - Review customer contact information

2. **Email Notification (Automatic)**
   - System sends email when ticket completes
   - Email includes:
     - Ticket number
     - Completion notice
     - Pickup instructions

3. **Follow-up Contact (If Needed)**
   - Wait 1-2 business days
   - If no response, call customer
   - Use phone script (see section above)
   - Schedule pickup appointment
   - Note appointment in ticket comments

4. **Prepare for Pickup**
   - Locate device and accessories
   - Review repair notes
   - Check invoice/payment status
   - Have ticket details ready

5. **Customer Arrives**
   - Verify customer identity
   - Show device
   - Explain repairs performed
   - Demonstrate functionality
   - Collect payment (if applicable)

6. **Delivery Confirmation**
   - Open ticket detail page
   - Click "Xác nhận giao hàng"
   - Add delivery notes
   - Collect digital signature
   - Complete confirmation
   - Provide receipt/documentation

7. **Post-Delivery**
   - Thank customer
   - Provide warranty information
   - Invite feedback
   - Close interaction professionally

**Time:** 5-10 minutes per delivery

---

## Tips and Best Practices

### Daily Routine

**Start of Day (15 minutes):**
- [ ] Log into system
- [ ] Check Service Requests queue for overnight submissions
- [ ] Review Pending Deliveries list
- [ ] Note any priority items
- [ ] Check email for customer inquiries

**During Day:**
- [ ] Check Service Requests every 1-2 hours
- [ ] Respond to customer calls promptly
- [ ] Convert requests to tickets quickly (within 4 hours)
- [ ] Follow up on delivery appointments
- [ ] Document all customer interactions

**End of Day (10 minutes):**
- [ ] Review unconverted requests (send status updates if needed)
- [ ] Call customers who haven't picked up devices
- [ ] Document pending follow-ups
- [ ] Clear workspace
- [ ] Log out

### Accuracy Tips

**Customer Information:**
- ✅ Always verify phone numbers (read back to customer)
- ✅ Double-check email addresses (common typo source)
- ✅ Ask customer to spell unusual names
- ✅ Confirm address if delivery is needed
- ❌ Don't assume information is correct

**Product Selection:**
- ✅ Ask customer to show device for model verification
- ✅ Check serial number on device itself
- ✅ Verify brand and model from device label
- ✅ Take photo if uncertain
- ❌ Don't guess product model

**Issue Description:**
- ✅ Document exact customer words
- ✅ Ask for symptoms, not diagnoses
- ✅ Note when issue started
- ✅ Record error messages exactly
- ❌ Don't use vague terms like "broken"

### Priority Setting Guidelines

**Use LOW priority for:**
- Cosmetic issues only
- Device works but has minor problem
- Customer has no time pressure
- Non-essential device

**Use NORMAL priority for:**
- Standard repairs
- Average turnaround acceptable
- No special urgency
- Most tickets (80% of cases)

**Use HIGH priority for:**
- Business-critical device
- Customer has urgent need
- Device completely non-functional
- Time-sensitive situation

**Use URGENT priority for:**
- Emergency situations only
- Manager approval required
- VIP customers (when appropriate)
- Critical business impact

### Template Selection Tips

When system supports templates (Phase 2+):
- **Warranty repairs:** Use warranty template
- **Screen replacements:** Use screen replacement template
- **Water damage:** Use water damage diagnostic template
- **Battery issues:** Use battery replacement template
- **General repair:** Use standard repair template
- **Not sure:** Choose "General Repair" - technicians can switch later

### Avoiding Common Mistakes

**❌ Common Error:** Creating duplicate tickets
- **✅ Solution:** Always search by phone number first

**❌ Common Error:** Wrong customer contact info
- **✅ Solution:** Verify phone and email with customer before submitting

**❌ Common Error:** Vague issue descriptions
- **✅ Solution:** Ask questions until you understand the problem clearly

**❌ Common Error:** Forgetting to set service type
- **✅ Solution:** Check warranty status before creating ticket

**❌ Common Error:** Confirming delivery without signature
- **✅ Solution:** Never skip signature collection step

### Time Management

**Quick Wins (< 5 minutes):**
- Convert simple service requests
- Update customer phone numbers
- Add notes to tickets
- Call customers for pickup scheduling

**Regular Tasks (5-15 minutes):**
- Create walk-in tickets
- Review request details
- Conduct delivery confirmations
- Customer phone calls

**Longer Tasks (15-30 minutes):**
- Handle difficult customer situations
- Research product information
- Coordinate complex deliveries
- Training new staff

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Cannot find customer by phone number

**Symptoms:** Searching by phone returns no results, but customer claims to be in system

**Solutions:**
1. Check for typos in phone number
2. Try alternative phone formats:
   - With country code: +84...
   - Without country code: 0...
   - With spaces vs. without spaces
3. Search by customer name instead
4. Search by email address
5. Check with manager if customer may be using different phone
6. If still not found: Create as new customer

---

#### Issue: Service request conversion fails

**Symptoms:** Error message when clicking "Tạo phiếu dịch vụ"

**Solutions:**
1. Check all required fields are completed:
   - Service type is selected
   - Priority is selected
   - Customer information is valid
2. Verify internet connection is stable
3. Refresh page and try again
4. Check browser console for error details
5. Try different browser
6. Contact admin if issue persists

---

#### Issue: Product not in dropdown list

**Symptoms:** Cannot find customer's product in product selection

**Solutions:**
1. Try different search terms:
   - Brand name
   - Model number
   - Product type
   - SKU code
2. Check if product name is spelled differently
3. Look at device label for exact model
4. Ask admin to add product to catalog
5. Create ticket with closest match temporarily
6. Add note explaining actual product
7. Manager can update ticket later

---

#### Issue: Customer didn't receive email notification

**Symptoms:** Customer says they didn't get ticket confirmation or status update

**Solutions:**
1. Verify email address is correct in customer record
2. Ask customer to check spam/junk folder
3. Check customer hasn't unsubscribed (look for `email_unsubscribed` flag)
4. Verify email in system email logs (ask manager to check)
5. Resend email if possible (ask admin)
6. Provide information via phone/SMS instead
7. Update email address if incorrect

---

#### Issue: Signature pad not working

**Symptoms:** Customer cannot sign during delivery confirmation

**Solutions:**
1. Refresh page and try again
2. Check device touch screen is working (test in other apps)
3. Try different finger or stylus
4. Adjust signature area size
5. Use different device/tablet if available
6. As last resort: Skip signature and document reason in notes
7. Take photo of customer ID instead
8. Get manager approval for alternative

---

#### Issue: Ticket creation is very slow

**Symptoms:** System takes long time to create ticket or times out

**Solutions:**
1. Check internet connection speed
2. Close unnecessary browser tabs
3. Clear browser cache
4. Try different browser
5. Reduce number of parts added
6. Create ticket without parts first, add later
7. Check system status with admin
8. Retry during off-peak hours

---

#### Issue: Cannot confirm delivery - button disabled

**Symptoms:** "Xác nhận giao hàng" button is grayed out

**Solutions:**
1. Verify ticket status is "Completed"
2. Check signature has been collected
3. Ensure delivery notes are filled in (if required)
4. Refresh page
5. Check you have permission (Reception role)
6. Ask manager to check ticket status
7. Verify ticket isn't already delivered

---

### Getting Help

**For Technical Issues:**
- Check this troubleshooting section first
- Ask colleagues if they've encountered issue
- Contact system administrator
- Check documentation in `docs/` folder
- Report persistent bugs to development team

**For Customer Service Issues:**
- Escalate to manager for difficult situations
- Use communication best practices (see above)
- Document all interactions
- Follow up within 24 hours
- Request manager mediation if needed

**For System Access Issues:**
- Verify login credentials
- Reset password if needed
- Check with admin about account status
- Ensure role permissions are correct
- Contact IT support

---

## Appendix

### Useful Keyboard Shortcuts
- `Esc` - Close modal dialogs
- `Enter` - Submit forms (when focused)
- `Ctrl+F` or `Cmd+F` - Search in page
- `F5` - Refresh page

### Glossary

**Terms Used in Reception Work:**
- **Service Request:** Online submission from public portal
- **Ticket:** Official service record in system (e.g., SV-2025-042)
- **Tracking Token:** Customer reference code for requests (e.g., TRK-2025-001)
- **Conversion:** Process of creating ticket from service request
- **Priority Level:** Urgency ranking (Low, Normal, High, Urgent)
- **Service Type:** Classification (Warranty, Paid, Goodwill)
- **Delivery Confirmation:** Process of handing device back to customer with signature
- **Walk-in:** Customer who visits in person vs. online submission

### Quick Reference: Request Status Flow

```
Đã gửi (Submitted)
       ↓
Đã tiếp nhận (Received)
       ↓
Đang xử lý (Processing) → Ticket Created
       ↓
[Alternative: Đã từ chối (Rejected)]
```

### Quick Reference: Ticket Status Flow

```
Pending → In Progress → Completed → Delivered
   ↓            ↓
Cancelled    Cancelled
```

### Sample Customer Communication Templates

**Welcome Message (Walk-in):**
```
"Xin chào [Anh/Chị], chào mừng đến [Tên công ty].
Hôm nay [Anh/Chị] cần hỗ trợ gì ạ?"
```

**Ticket Created Confirmation:**
```
"Phiếu dịch vụ của [Anh/Chị] đã được tạo với mã số [SV-YYYY-NNN].
Chúng tôi sẽ gửi thông tin và cập nhật trạng thái qua email [email address].
Dự kiến thời gian hoàn thành là [X ngày làm việc]."
```

**Pickup Reminder:**
```
"Xin chào [Tên khách hàng],
Thiết bị [tên sản phẩm] của quý khách đã sửa xong.
Vui lòng đến nhận máy trong giờ hành chính.
Mã phiếu: [SV-YYYY-NNN]
Cảm ơn quý khách!"
```

### Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-24 | Initial documentation for Reception staff in Phase 2 |

---

**Document End**

**For questions or feedback about this guide, contact your system administrator.**
