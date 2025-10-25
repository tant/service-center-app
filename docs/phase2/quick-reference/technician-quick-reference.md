# Technician Quick Reference Card

**Version:** 1.0 | **Role:** Technician | **Updated:** 2025-10-24

---

## Your Main Responsibilities

- Work on assigned service tickets
- Diagnose and repair devices
- Update ticket status as work progresses
- Add/remove parts as needed
- Document work with comments
- Track time and costs accurately

---

## Common Tasks

### View Your Assigned Tickets

**Page:** `/tickets`

**Filter by Status:**
- Pending: Assigned but not started
- In Progress: Currently working on
- Completed: Finished by you
- All: See everything

**Find Tickets:**
- Search by ticket number
- Filter by customer name
- Sort by priority (urgent first)
- Check due dates

**Quick Status Check:**
- Yellow badge = Pending
- Blue badge = In Progress
- Green badge = Completed
- Gray badge = Cancelled

---

### Work on a Ticket (Main Workflow)

**Page:** `/tickets/[ticket-id]`

#### 1. Start Working (Pending → In Progress)

1. Click ticket from list
2. Review customer issue description
3. Click "Change Status" button
4. Select "In Progress"
5. System logs: "[Your Name] started working"
6. Add diagnostic comment with findings

#### 2. Add Parts as Needed

**From Ticket Details Page:**

1. Scroll to "Parts Used" section
2. Click "+ Add Part" button
3. Search part by name or SKU
4. Enter quantity needed
5. Price auto-fills (can adjust)
6. Click "Add Part"

**Result:**
- Part added to ticket
- Stock automatically decreased
- Parts total updates
- Total cost recalculates
- Auto-comment logged

**If Stock Insufficient:**
- Error message appears
- Check current stock level
- Request Manager to restock
- Or use alternative part

#### 3. Modify Part Quantity

1. Find part in "Parts Used" list
2. Click "Edit" (pencil icon)
3. Change quantity
4. Click "Update"

**System Actions:**
- Stock adjusted automatically
- If increasing qty: decreases stock
- If decreasing qty: returns stock
- Total cost recalculates

#### 4. Remove Parts

1. Find part in list
2. Click "Delete" (trash icon)
3. Confirm deletion

**Result:**
- Part removed from ticket
- Full stock returned
- Total cost updates
- Auto-comment logged

#### 5. Add Comments/Notes

**Quick Comment:**
1. Click "Add Comment" button
2. Write your notes
3. Click "Save Comment"

**What to Document:**
- Diagnostic findings
- Work performed
- Parts replaced
- Issues encountered
- Estimated completion time
- Customer callback items

#### 6. Upload Images

**From Ticket Page:**
1. Click "Upload Images" button
2. Select files (photos of device/damage)
3. Add description (optional)
4. Click "Upload"

**Uses:**
- Before/after photos
- Damage documentation
- Reference images
- Proof of work

#### 7. Complete the Ticket

1. Verify all work done
2. Check all parts added
3. Review total cost
4. Click "Change Status"
5. Select "Completed"
6. Add final comment with summary
7. System logs completion time

**Completion Checklist:**
- All repairs done?
- All parts documented?
- Quality check passed?
- Customer notes clear?
- Ready for pickup?

---

### Update Ticket Details

**Page:** `/tickets/[ticket-id]/edit` (if you have access)

**Or ask Manager to update:**
- Service fee
- Diagnosis fee
- Discount amount
- Priority level
- Warranty type

**What You Can Update:**
- Status (pending → in_progress → completed)
- Parts (add/remove/modify)
- Comments (add diagnostic notes)
- Attachments (upload photos)

---

## Ticket Status Flow

### One-Way Status Progression

```
pending → in_progress → completed
   ↓            ↓
cancelled   cancelled
```

### Rules
- Can only move forward (or to cancelled)
- Cannot reopen completed tickets
- Cannot edit completed/cancelled tickets
- Status changes auto-logged

---

## Parts Management

### Adding Parts

**Stock Check First:**
1. Go to `/parts` page
2. Search for part
3. Check "Stock" column
4. If stock = 0, notify Manager

**Part Information:**
| Field | Description |
|-------|-------------|
| Name | Part description |
| SKU | Stock Keeping Unit |
| Part Number | Manufacturer number |
| Stock | Available quantity |
| Unit Price | Default price |

### Stock Behavior

**When you add part to ticket:**
- Stock decreases immediately
- Cannot add more than available
- System prevents negative stock

**When you remove part:**
- Stock increases (returned)
- Full quantity restored

**When you change quantity:**
- Difference adjusted in stock
- Increase qty = decrease stock
- Decrease qty = increase stock

---

## Quick Reference Tables

### Priority Handling

| Priority | Response Time | Your Action |
|----------|--------------|-------------|
| Urgent | Same day | Start immediately |
| High | 1-2 days | Prioritize after urgent |
| Normal | 3-5 days | Standard workflow |
| Low | 1 week+ | When capacity allows |

### Status Meanings

| Status | Your Action | Customer Sees |
|--------|-------------|---------------|
| Pending | Not started, review ticket | "Waiting for technician" |
| In Progress | Actively working | "Being repaired" |
| Completed | Finished, ready for pickup | "Ready for pickup" |
| Cancelled | No work needed | "Service cancelled" |

### Warranty Types

| Type | Meaning | Parts Cost |
|------|---------|-----------|
| Warranty | Under warranty | Free (covered) |
| Paid | Customer pays | Full price |
| Goodwill | Free as gesture | Free (company absorbs) |

---

## Page URLs

| Task | URL | Access |
|------|-----|--------|
| Dashboard | `/dashboard` | View metrics |
| My Tickets | `/tickets` | View assigned |
| Ticket Details | `/tickets/[id]` | Work on ticket |
| Edit Ticket | `/tickets/[id]/edit` | Update details |
| Parts List | `/parts` | Check stock |
| Products | `/products` | View catalog |
| Brands | `/brands` | View brands |
| My Account | `/account` | Profile settings |

---

## Common Error Messages

### "Insufficient stock for part [Part Name]"
**Solution:**
1. Check current stock level
2. Use alternative part if available
3. Notify Manager to reorder
4. Add comment in ticket about delay

### "Cannot update completed ticket"
**Solution:**
- Completed tickets are locked
- Ask Manager or Admin to reopen if necessary
- Add comment explaining issue

### "Invalid quantity: must be greater than 0"
**Solution:** Enter valid quantity (1 or more)

### "Part not found in inventory"
**Solution:**
1. Notify Manager to add part
2. Use similar part as substitute
3. Add comment documenting change

### "You are not assigned to this ticket"
**Solution:**
- Ask Manager to reassign ticket to you
- Or view-only if checking others' work

---

## Important Notes

### Cost Calculation (Automatic)

**Formula:**
```
Total Cost = Service Fee + Diagnosis Fee + Parts Total - Discount
```

**Parts Total:**
- Sum of all parts (Quantity × Unit Price)
- Updates automatically
- Cannot manually edit

### Comments Best Practices

**Always Document:**
- What you found (diagnosis)
- What you did (work performed)
- Parts used and why
- Problems encountered
- Estimated completion
- Any customer communication needed

**Example Good Comment:**
```
Diagnosed faulty battery. Replaced with new OEM battery (Part #BAT-123).
Tested charging circuit - working normally. Device fully functional.
Ready for customer pickup. Time: 1.5 hours.
```

### Images and Documentation

**When to Upload Photos:**
- Before repair (show damage)
- During repair (for reference)
- After repair (prove completion)
- Any unusual findings

**File Support:**
- JPG, PNG, GIF formats
- Multiple files per ticket
- Vietnamese filenames supported

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search page | Ctrl + F (Cmd + F on Mac) |
| Refresh | F5 |
| Close modal | Esc |
| Quick save | Ctrl + Enter (in forms) |

---

## Best Practices

### Starting Your Day
1. Check dashboard for assigned tickets
2. Review pending tickets by priority
3. Start urgent tickets first
4. Plan your workload
5. Check parts stock for today's tickets

### During Repairs
1. Update status to "In Progress" when starting
2. Add diagnostic comment immediately
3. Document all parts used
4. Take photos if damage significant
5. Update comments as work progresses
6. Ask questions if unsure

### Before Completing
1. Test device thoroughly
2. Verify all repairs work
3. Check all parts documented
4. Add final summary comment
5. Update status to "Completed"
6. Clean up workspace

### Quality Standards
- Test all repairs before completion
- Use correct parts (OEM when warranty)
- Document everything clearly
- Double-check part quantities
- Verify total cost is accurate
- Clean device before returning

---

## Quick Troubleshooting

### "I added wrong part"
**Solution:**
1. Click "Delete" on the part
2. Stock will be returned
3. Add correct part

### "I need more parts than in stock"
**Solutions:**
1. Check alternative parts
2. Split repair (use what's available)
3. Notify Manager to restock
4. Add comment about delay
5. Update customer via Reception

### "Customer wants additional work"
**Solution:**
1. Add comment describing request
2. Notify Manager or Reception
3. May need new ticket or amendment
4. Don't start without approval

### "Part price is wrong"
**Solution:**
1. Edit the part in ticket
2. Adjust unit price
3. Or notify Manager to fix master price

### "I broke something"
**Solution:**
1. Document in comment immediately
2. Notify Manager or Admin
3. Add replacement part to ticket
4. Note as internal (don't mention to customer)

---

## When to Escalate

Contact Manager or Admin if:
- Customer requested additional repairs
- Warranty status unclear
- Part not in system (need to add)
- Repair impossible/not worth it
- Customer dispute about work
- Need special approval for cost
- Unusual damage or issue
- Delay beyond estimated time

---

## Daily Workflow

**Morning Routine:**
1. Log in and check dashboard
2. Review assigned tickets
3. Check priority and deadlines
4. Verify parts availability
5. Plan repair sequence

**During Day:**
1. Start with urgent tickets
2. Update status to "In Progress"
3. Document diagnostics immediately
4. Add parts as you use them
5. Take photos if needed
6. Add comments regularly
7. Complete tickets when done

**End of Day:**
1. Update all in-progress tickets
2. Add end-of-day comments
3. Check tomorrow's pending tickets
4. Note any parts needed
5. Log out

---

## Performance Tips

### Work Faster
- Organize workspace efficiently
- Keep common parts nearby
- Use search shortcuts
- Group similar repairs
- Document as you work (not after)

### Work Better
- Read full ticket before starting
- Check warranty type (affects parts choice)
- Test thoroughly before completing
- Use correct parts for warranty
- Document clearly for others

### Avoid Mistakes
- Double-check part numbers
- Verify quantities before adding
- Test after each repair step
- Read customer notes carefully
- Ask if uncertain

---

## Common Scenarios

### Scenario 1: Simple Repair
1. Review ticket (battery replacement)
2. Change status to "In Progress"
3. Open device and diagnose
4. Add comment: "Confirmed battery failure"
5. Add part: Battery (qty 1)
6. Replace battery
7. Test device (charging, boot)
8. Add comment: "Battery replaced, tested OK"
9. Upload photos (before/after)
10. Change status to "Completed"

### Scenario 2: Multiple Parts
1. Review ticket (screen + battery)
2. Start ticket
3. Diagnose: "Screen cracked, battery swollen"
4. Add part: Screen (qty 1)
5. Add part: Battery (qty 1)
6. Perform repairs
7. Test everything
8. Comment: "Both parts replaced, full test passed"
9. Complete ticket

### Scenario 3: No Parts Needed
1. Review ticket (software issue)
2. Start ticket
3. Diagnose and fix
4. Comment: "Software reset, no hardware issue"
5. No parts to add
6. Test functionality
7. Complete ticket

### Scenario 4: Need Part Not in Stock
1. Review ticket
2. Start ticket
3. Diagnose: "Need Part XYZ"
4. Check stock: Out of stock
5. Comment: "Awaiting Part XYZ, notified Manager"
6. Notify Manager to restock
7. Keep status "In Progress" (not completed)
8. Add part when arrives
9. Complete repair and ticket

---

## Contact Information

**Parts Issues:** Manager or Inventory Manager
**Customer Questions:** Reception
**System Issues:** Admin or IT
**Technical Help:** Senior Technician or Manager

---

**Need help? Ask your Manager or check the full technical manual.**
