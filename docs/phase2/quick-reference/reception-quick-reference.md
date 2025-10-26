# Reception Quick Reference Card

**Version:** 1.0 | **Role:** Reception | **Updated:** 2025-10-24

---

## Your Main Responsibilities

- Create new service tickets for customers
- Manage customer information
- Check ticket status for customers
- Answer customer inquiries
- View product and brand catalogs

---

## Common Tasks

### Create a New Service Ticket

**Page:** `/tickets/add`

1. **Customer Lookup**
   - Enter customer phone number (10+ digits)
   - System auto-fills if customer exists
   - Click "Add New Customer" if not found
   - Fill: Name (required), Phone (required), Email, Address

2. **Select Product**
   - Search by name or brand
   - Select from dropdown
   - Product determines warranty status

3. **Add Parts (Optional)**
   - Search available parts in inventory
   - Enter quantity needed
   - Price auto-fills (can adjust if needed)
   - Multiple parts can be added

4. **Service Details**
   - Service Fee: Base repair charge
   - Diagnosis Fee: Inspection cost
   - Discount: Optional reduction
   - Priority: Low, Normal, High, Urgent
   - Warranty: Warranty, Paid, Goodwill
   - Issue Description: Customer's problem
   - Internal Notes: Staff-only notes

5. **Review & Submit**
   - Check all details
   - Click "Create Ticket"
   - Note the ticket number (SV-YYYY-NNN)

**Shortcut:** From dashboard, click "+ New Ticket" button

---

### Find Existing Tickets

**Page:** `/operations/tickets`

**Search Methods:**
- Ticket number (e.g., SV-2025-001)
- Customer name
- Phone number
- Status filter

**Status Colors:**
- Yellow badge = Pending (not started)
- Blue badge = In Progress (being worked on)
- Green badge = Completed (finished)
- Gray badge = Cancelled

**View Details:** Click any ticket row to see full information

---

### Manage Customers

**Page:** `/management/customers`

**Add New Customer:**
1. Click "+ Add Customer" button
2. Fill required fields:
   - Full Name (required)
   - Phone Number (required, 10+ digits)
   - Email (optional)
   - Address (optional)
3. Click "Create Customer"

**Edit Customer:**
1. Find customer in list
2. Click "Edit" button (pencil icon)
3. Update information
4. Click "Save Changes"

**View Customer History:**
- Click customer name to see all their tickets
- Review past service history

---

### Check Service Status for Customer

1. Go to `/operations/tickets` page
2. Search by customer phone or name
3. Note the status badge color
4. Click ticket to see details
5. Communicate status to customer:
   - Pending: "Ticket received, not started yet"
   - In Progress: "Technician is working on it"
   - Completed: "Ready for pickup"
   - Cancelled: "Service was cancelled"

---

### View Product Information

**Page:** `/catalog/products`

**What You Can Do:**
- View all products (read-only)
- See product names, brands, types
- Check associated parts
- Search by name or brand

**Cannot Do:**
- Add new products (Manager+ only)
- Edit products (Manager+ only)
- Delete products (Manager+ only)

---

## Quick Reference Tables

### Ticket Status Meanings

| Status | Meaning | What to Tell Customer |
|--------|---------|----------------------|
| Pending | Not started yet | "We've received your device, waiting for technician" |
| In Progress | Being repaired | "Technician is working on it now" |
| Completed | Finished | "Your device is ready for pickup!" |
| Cancelled | Not proceeding | "Service has been cancelled" |

### Priority Levels

| Priority | When to Use | Color |
|----------|-------------|-------|
| Low | Non-urgent, can wait | Gray |
| Normal | Standard service | Blue |
| High | Customer needs it soon | Orange |
| Urgent | Emergency, same-day | Red |

### Warranty Types

| Type | Meaning | Customer Pays? |
|------|---------|----------------|
| Warranty | Under warranty | No |
| Paid | Out of warranty | Yes |
| Goodwill | Free as gesture | No |

---

## Page URLs

| Task | URL | Shortcut |
|------|-----|----------|
| Dashboard | `/dashboard` | Click logo |
| All Tickets | `/operations/tickets` | Main menu |
| New Ticket | `/operations/tickets/add` | "+ New Ticket" button |
| Customers | `/management/customers` | Main menu |
| Products | `/catalog/products` | Main menu |
| Brands | `/catalog/brands` | Under "Catalog" |
| My Account | `/settings/account` | User menu (top right) |

---

## Common Error Messages

### "Phone number must be at least 10 characters"
**Solution:** Enter complete phone number with area code

### "Customer with this phone already exists"
**Solution:** Search for existing customer first, then create ticket

### "Cannot add part: Insufficient stock"
**Solution:** Choose different part or notify Manager to restock

### "All fields are required"
**Solution:** Fill all fields marked with red asterisk (*)

### "Invalid phone number format"
**Solution:** Use digits only, no spaces or special characters

---

## Important Notes

### Ticket Numbers
- Format: SV-YYYY-NNN (e.g., SV-2025-001)
- Automatically generated
- Sequential by year
- Give to customer for reference

### Customer Phone Numbers
- Required field
- Must be at least 10 digits
- Used as unique identifier
- System auto-finds existing customers

### Cost Calculation
**Total Cost = Service Fee + Diagnosis Fee + Parts Total - Discount**
- System calculates automatically
- Parts total updates when parts added/removed
- Check total before finalizing ticket

### What You Cannot Do
- Edit completed/cancelled tickets
- Delete tickets (Manager+ only)
- Change ticket status (Technician only)
- Add/remove parts after creation (Technician only)
- Manage staff accounts (Admin only)

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search in page | Ctrl + F (or Cmd + F) |
| Refresh page | F5 |
| Close modal | Esc |
| Submit form | Enter (in text fields) |

---

## Best Practices

### Creating Tickets
1. Always check if customer exists first
2. Double-check phone number accuracy
3. Ask customer about warranty status
4. Set appropriate priority level
5. Write clear issue description
6. Give ticket number to customer
7. Explain estimated timeline

### Customer Service
- Be polite and professional
- Set realistic expectations
- Record all customer concerns in notes
- Update customers proactively
- Confirm customer contact information
- Explain charges clearly

### Data Entry
- Use consistent naming (First Last)
- Verify phone numbers before saving
- Include area codes
- Add email for digital receipts
- Note special customer requests

---

## Quick Troubleshooting

### "I can't find a customer"
1. Search by phone number (most reliable)
2. Try variations (with/without spaces)
3. Check spelling of name
4. If truly new, create new customer

### "I created duplicate customers"
**Solution:** Notify Manager or Admin to merge/delete

### "I made a mistake on a ticket"
**Options:**
- If pending: Ask Manager to edit
- If wrong customer: Ask Admin to reassign
- If wrong product: Add comment explaining error

### "Customer asking about price"
**Information to provide:**
- Service Fee: Base repair charge
- Diagnosis Fee: Inspection cost
- Parts Cost: Itemized in ticket
- Discount: If applicable
- Total: Sum of all above

### "Part not in system"
**Solution:**
1. Note part details in ticket comments
2. Notify Manager to add to inventory
3. Technician can add it later

---

## When to Escalate

Contact Manager or Admin if:
- Customer dispute about charges
- Warranty claim issue
- Need to delete/cancel ticket
- Technical system problem
- Missing product or part in system
- Staff access issue
- Customer requests speak to manager

---

## Daily Workflow

**Morning:**
1. Log in to system
2. Check dashboard for pending tickets
3. Review any customer pickup scheduled
4. Prepare for new ticket intake

**During Day:**
1. Create tickets as customers arrive
2. Answer customer status inquiries
3. Update customer information as needed
4. Coordinate with technicians on urgent tickets

**End of Day:**
1. Check all tickets created today
2. Follow up on pending customer calls
3. Note any issues for tomorrow
4. Log out

---

## Contact Information

**Technical Support:** IT Department
**System Issues:** Admin user
**Ticket Questions:** Manager or Technician
**Customer Disputes:** Manager

---

## Tips for Success

- Smile when greeting customers (builds trust)
- Keep ticket numbers accurate for tracking
- Write detailed issue descriptions (helps technicians)
- Set realistic timelines (under-promise, over-deliver)
- Update customers proactively (reduces inquiries)
- Ask questions if unsure (better than guessing)
- Keep customer data confidential
- Always be professional in notes (others can see them)

---

**Need help? Ask your Manager or check the full user guide.**
