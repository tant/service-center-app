# Manager Quick Reference Card

**Version:** 1.0 | **Role:** Manager | **Updated:** 2025-10-24

---

## Your Main Responsibilities

- Oversee all service operations
- Manage inventory (products, parts, brands)
- Monitor team performance
- Review and edit all tickets
- Handle customer escalations
- Analyze business metrics
- Make operational decisions

---

## Common Tasks

### Monitor Dashboard Analytics

**Page:** `/dashboard`

**Key Metrics to Track:**

| Metric | What It Shows | Action If |
|--------|---------------|-----------|
| Monthly Revenue | Current vs previous month | Down → investigate |
| Pending Tickets | Work backlog | High → assign technicians |
| New Customers | Growth rate | Down → review marketing |
| New Products | Catalog additions | Track inventory expansion |
| New Parts | Inventory growth | Monitor stock levels |

**Daily Revenue Chart:**
- View trends: 7, 30, or 90 days
- Identify slow periods
- Plan resource allocation
- Track seasonal patterns

**Employee Performance:**
- Total tickets per technician
- Completion rates
- Active workload (in progress)
- Pending assignments
- Use for performance reviews

---

### Manage Service Tickets

**Page:** `/tickets`

#### View and Filter Tickets

**Filter Options:**
- Status: All, Pending, In Progress, Completed, Cancelled
- Priority: Urgent, High, Normal, Low
- Technician: View by assignee
- Date range: Custom periods
- Customer: Search by name/phone
- Ticket number: Direct lookup

#### Edit Any Ticket

**Page:** `/tickets/[id]/edit`

**You Can Update:**
- Service fee amount
- Diagnosis fee amount
- Discount amount (with reason)
- Priority level
- Warranty type
- Assigned technician
- Issue description
- Internal notes

**Auto-Comments Generated:**
- System logs all your changes
- Shows old value → new value
- Includes your name and timestamp
- Visible to all staff

#### Delete Tickets

**When to Delete:**
- Duplicate entry
- Test/demo ticket
- Created in error

**How:**
1. Open ticket details
2. Click "Delete Ticket" button
3. Confirm deletion

**Warning:** Cannot undo. Consider cancelling instead.

#### Reassign Technicians

1. Edit ticket
2. Change "Assigned To" field
3. Select different technician
4. Save changes
5. System logs assignment change

**Best Practice:** Add comment explaining why reassigned

---

### Manage Products

**Page:** `/products`

#### Add New Product

1. Click "+ Add Product" button
2. Fill required fields:
   - Product Name (required)
   - Brand (select from dropdown)
   - Product Type (category)
   - SKU (optional)
   - Description (optional)
3. Link related parts (optional):
   - Select parts commonly used
   - Helps technicians find parts faster
4. Click "Create Product"

#### Edit Product

1. Find product in list
2. Click "Edit" button
3. Update details
4. Modify part associations
5. Save changes

#### View Product Details

- Click product name
- See all associated parts
- View service history
- Check usage statistics

---

### Manage Parts Inventory

**Page:** `/parts`

#### Add New Part

1. Click "+ Add Part" button
2. Fill required information:
   - Part Name (required)
   - SKU (required, unique)
   - Part Number (manufacturer code)
   - Unit Price (required)
   - Initial Stock Quantity (required)
   - Description (optional)
3. Link to products (optional)
4. Click "Create Part"

#### Edit Part

**Update Any Field:**
- Name, SKU, Part Number
- Unit Price (affects new tickets)
- Description
- Product associations

**Stock Management:**
- View current stock level
- See usage history
- Check low stock alerts
- Restock as needed

#### Check Stock Levels

**Stock Status Indicators:**
- Green: Adequate stock
- Yellow: Low stock (reorder)
- Red: Out of stock (urgent)

**Stock Behavior:**
- Automatically decreases when added to tickets
- Automatically increases when removed from tickets
- Real-time updates
- Cannot go negative (system prevents)

#### Restock Parts

**Method 1: Edit Part**
1. Edit the part
2. Increase stock quantity
3. Add comment: "Restocked +50 units"

**Method 2: Receive Shipment**
- Update multiple parts at once
- Document supplier info
- Note purchase order numbers

---

### Manage Brands

**Page:** `/brands`

#### Add Brand

1. Click "+ Add Brand"
2. Enter brand name (required)
3. Add description (optional)
4. Set active status (default: active)
5. Save

#### Edit Brand

- Update name or description
- Toggle active/inactive status
- Inactive brands hidden from product creation

#### Delete Brand

**Requirements:**
- No products using this brand
- System checks before deleting
- If products exist, error shown

**Solution:** Reassign products to different brand first

---

### Handle Customer Issues

**Page:** `/customers`

#### Manage Customer Data

**Full CRUD Access:**
- Create new customers
- Edit all customer information
- Delete customers (if no tickets)
- View customer history
- Merge duplicate customers

#### Resolve Disputes

**Common Scenarios:**

**Price Dispute:**
1. Review ticket costs
2. Check parts pricing
3. Verify labor charges
4. Apply discount if justified
5. Document resolution in comments

**Quality Issue:**
1. Review technician's work
2. Check parts used
3. Inspect device if returned
4. Reassign for rework if needed
5. Apply goodwill discount

**Timeline Issue:**
1. Check ticket creation date
2. Review status history
3. Identify delays
4. Communicate with customer
5. Offer compensation if warranted

---

## Advanced Operations

### Bulk Operations

**Reassign Multiple Tickets:**
1. Filter tickets by technician
2. Edit each individually
3. Change assignment
4. Document reason

**Update Pricing:**
1. Edit parts in inventory
2. New price applies to future tickets
3. Existing tickets unchanged

### Reports and Analysis

**Page:** `/report` (Coming Soon)

**Current Analytics:**
- Dashboard metrics
- Revenue trends
- Employee performance
- Customer growth
- Inventory turnover

**Export Data:**
- Currently: Manual screenshot/copy
- Future: CSV, PDF exports

---

## Quick Reference Tables

### Status Management

| From Status | To Status | Your Action Required |
|-------------|-----------|---------------------|
| Pending | In Progress | Assign technician if needed |
| In Progress | Completed | Verify work done |
| Any | Cancelled | Add cancellation reason |
| Completed | - | Locked, cannot change |

### Priority Guidelines

| Priority | Response Time | Typical Cases |
|----------|--------------|---------------|
| Urgent | Same day | Business-critical devices, VIP customers |
| High | 1-2 days | Important devices, paying rush fee |
| Normal | 3-5 days | Standard repairs |
| Low | 1+ weeks | Non-urgent, budget repairs |

### Warranty Decision Guide

| Situation | Warranty Type | Customer Pays |
|-----------|---------------|---------------|
| Within warranty period | Warranty | No |
| Out of warranty | Paid | Yes (full) |
| Customer relations gesture | Goodwill | No |
| Partial coverage | Paid | Yes (parts only) |

### Delete Permissions

| Item | Can Delete? | Notes |
|------|-------------|-------|
| Tickets | Yes | You and Admin only |
| Customers | Yes | If no tickets |
| Products | Yes | Check dependencies first |
| Parts | Yes | Check usage first |
| Brands | Yes | If no products using it |
| Attachments | Yes | Any ticket attachment |

---

## Page URLs

| Section | URL | Purpose |
|---------|-----|---------|
| Dashboard | `/dashboard` | Analytics overview |
| Tickets | `/tickets` | All service tickets |
| New Ticket | `/tickets/add` | Create ticket |
| Edit Ticket | `/tickets/[id]/edit` | Modify ticket |
| Customers | `/customers` | Customer management |
| Products | `/products` | Product catalog |
| Parts | `/parts` | Inventory management |
| Brands | `/brands` | Brand management |
| Reports | `/report` | Analytics (placeholder) |
| Account | `/account` | Your profile |

---

## Common Error Messages

### "Cannot delete brand: Products are using it"
**Solution:**
1. Go to products page
2. Filter by this brand
3. Edit each product
4. Change to different brand
5. Then delete brand

### "Cannot delete part: Currently used in tickets"
**Solution:**
- Part is in active/completed tickets
- Cannot delete (data integrity)
- Mark inactive instead (future feature)

### "Insufficient stock"
**Solution:**
1. Check current stock level
2. Restock the part
3. Or approve substitute part
4. Update ticket accordingly

### "Cannot edit completed ticket"
**Solution:**
- Completed tickets are locked
- Admin can reopen if necessary
- Or create adjustment ticket

### "Customer has existing tickets"
**Solution:**
- Cannot delete customer with history
- Keeps data integrity
- Edit instead of delete

---

## Important Notes

### Cost Management

**Understanding Ticket Costs:**
```
Total Cost = Service Fee + Diagnosis Fee + Parts Total - Discount
```

**Parts Total:**
- Automatically calculated
- Sum of (Quantity × Unit Price)
- Updates when parts added/removed
- You cannot directly edit parts total

**When to Apply Discounts:**
- Customer loyalty (repeat business)
- Warranty goodwill
- Marketing promotions
- Service issues/delays
- Bulk services

**Discount Best Practices:**
- Document reason in comments
- Get approval for large discounts (>20%)
- Track discount trends
- Review monthly discount totals

### Inventory Management

**Reorder Points:**
- Monitor stock levels daily
- Set mental thresholds per part
- Common parts: reorder at 20% remaining
- Rare parts: reorder at 50% remaining
- Track supplier lead times

**Stock Accuracy:**
- System tracks automatically
- Verify physical count monthly
- Investigate discrepancies
- Update system if found differences

**Part Pricing:**
- Update prices when supplier changes
- Add markup for profit (typically 20-50%)
- Consider warranty vs paid pricing
- Review competitor pricing

### Team Management

**Workload Balancing:**
- Check employee performance table
- Distribute tickets evenly
- Consider skill levels
- Account for priority urgency
- Monitor completion rates

**Performance Indicators:**
| Metric | Good | Needs Attention |
|--------|------|----------------|
| Completion Rate | >80% | <70% |
| Pending Tickets | <5 per tech | >10 per tech |
| Avg. Time per Ticket | 1-2 days | >5 days |
| Quality Issues | <5% | >10% |

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search page | Ctrl + F (Cmd + F) |
| Refresh dashboard | F5 |
| Close modal | Esc |
| Quick filter | Alt + F |
| New ticket | Alt + N (from tickets page) |

---

## Best Practices

### Daily Routine

**Morning (15 mins):**
1. Review dashboard metrics
2. Check pending ticket count
3. Review urgent priority tickets
4. Check low stock alerts
5. Review yesterday's completions

**During Day:**
1. Monitor ticket flow
2. Handle escalations
3. Make assignment decisions
4. Approve discounts
5. Update inventory as needed
6. Respond to staff questions

**End of Day (10 mins):**
1. Review day's completions
2. Check tomorrow's workload
3. Plan part reorders
4. Note issues for next day
5. Update any critical tickets

### Decision Making

**Assign Tickets:**
- Match technician skill to repair type
- Balance workload evenly
- Priority tickets to experienced techs
- Group similar repairs to same tech

**Pricing Decisions:**
- Use standard service fee guide
- Adjust for complexity
- Consider customer history
- Be consistent across customers
- Document unusual pricing

**Quality Control:**
- Spot-check completed tickets
- Review parts usage patterns
- Verify proper documentation
- Check customer feedback
- Address issues immediately

### Communication

**With Technicians:**
- Clear assignment instructions
- Respond to part requests quickly
- Provide feedback on work
- Explain priority changes
- Support skill development

**With Reception:**
- Set clear pricing guidelines
- Communicate delays
- Clarify customer issues
- Share policy updates
- Coordinate customer communications

**With Customers:**
- Professional and empathetic
- Clear about costs
- Realistic timelines
- Proactive updates
- Own mistakes, offer solutions

---

## Quick Troubleshooting

### "Why is revenue down?"
**Investigate:**
1. Check completed ticket count
2. Review average ticket value
3. Compare to same period last year
4. Check seasonal patterns
5. Review discount usage
6. Analyze customer retention

### "Technician completion rate low"
**Actions:**
1. Review their assigned tickets
2. Check ticket complexity
3. Discuss with technician
4. Identify bottlenecks
5. Provide training if needed
6. Adjust assignments

### "Customer unhappy with cost"
**Resolution Steps:**
1. Review parts itemization
2. Explain labor/diagnosis fees
3. Compare to quote (if given)
4. Show parts pricing is fair
5. Offer payment plan
6. Apply discount if justified
7. Document resolution

### "Part constantly out of stock"
**Solutions:**
1. Check usage frequency
2. Increase reorder quantity
3. Find backup supplier
4. Raise price to reduce demand
5. Find alternative parts
6. Update reorder threshold

### "Ticket taking too long"
**Investigation:**
1. Check status history
2. Review technician comments
3. Identify delays (parts, customer, etc.)
4. Take corrective action
5. Update customer on timeline
6. Reassign if necessary

---

## When to Escalate to Admin

Contact Admin if:
- Staff access/permission issues
- System technical problems
- Need to reopen completed ticket
- Complex database issues
- Need to add/remove staff accounts
- Major policy decision needed
- Legal or compliance issues

---

## Performance Metrics to Track

### Daily
- Pending ticket count
- Urgent ticket count
- New tickets created
- Tickets completed
- Stock alerts

### Weekly
- Total revenue
- Average ticket value
- Technician completion rates
- Customer satisfaction
- Parts usage trends

### Monthly
- Revenue vs target
- Customer growth rate
- Inventory turnover
- Staff performance
- Profit margins

---

## Common Scenarios

### Scenario 1: Urgent VIP Customer
1. Reception creates ticket with Urgent priority
2. You receive notification (check dashboard)
3. Assign to best available technician
4. Add comment: "VIP customer, please prioritize"
5. Monitor progress throughout day
6. Ensure completion same day
7. Follow up with customer

### Scenario 2: Part Out of Stock
1. Technician reports stock issue
2. Check part details in inventory
3. Restock immediately if critical
4. Or approve substitute part
5. Update ticket with comment
6. Inform customer of delay if applicable
7. Update stock thresholds to prevent recurrence

### Scenario 3: Customer Complaint
1. Reception escalates to you
2. Review ticket history
3. Check work performed
4. Evaluate validity of complaint
5. Decide resolution (refund/rework/goodwill)
6. Apply discount if appropriate
7. Document full resolution
8. Follow up with customer

### Scenario 4: New Product Line
1. Add brand (if new)
2. Create products with details
3. Add common parts to inventory
4. Link parts to products
5. Set initial pricing
6. Train technicians on new products
7. Inform reception of new offerings

---

## Tips for Success

### Operations
- Stay ahead of stock levels
- Balance technician workload
- Document all decisions
- Be consistent with pricing
- Monitor quality constantly
- Respond quickly to issues

### Business
- Track metrics daily
- Identify trends early
- Control discount usage
- Maximize inventory turnover
- Build customer relationships
- Optimize part pricing

### Leadership
- Support your team
- Provide clear guidance
- Recognize good work
- Address issues promptly
- Train continuously
- Lead by example

---

## Contact Information

**System Issues:** Admin or IT Department
**Technical Questions:** Senior Technician
**Business Questions:** Owner or Admin
**Customer Escalations:** Handle personally

---

**Need help? Refer to full Manager's Guide or contact Admin.**
