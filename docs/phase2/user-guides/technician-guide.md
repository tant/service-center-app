# Technician User Guide - Service Center Phase 2

**Version:** 1.0
**Last Updated:** 2025-10-24
**Audience:** Service Technicians
**Access Level:** Task execution and ticket management

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [My Tasks Page](#my-tasks-page)
4. [Task Execution Workflow](#task-execution-workflow)
5. [Dynamic Template Switching](#dynamic-template-switching)
6. [Task Sequence Modes](#task-sequence-modes)
7. [Product Handling](#product-handling)
8. [Comments and Notes](#comments-and-notes)
9. [Practical Examples](#practical-examples)
10. [Tips and Best Practices](#tips-and-best-practices)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Introduction

### Overview
As a Technician, you are responsible for executing service tasks assigned to you. This guide covers Phase 2 task workflow features including task execution, template switching, and proper documentation practices.

### Your Responsibilities
- Execute tasks assigned to you in a timely manner
- Update task status accurately as you progress
- Document your work with completion notes
- Switch templates when diagnosis reveals different issues
- Handle physical products correctly during repairs
- Communicate blockers and issues promptly
- Maintain accurate records for audit and warranty purposes

### Key Technician Features
- **My Tasks Page:** Centralized view of all your assigned tasks
- **Task Execution:** Start, complete, and block tasks with proper documentation
- **Template Switching:** Adapt workflows when issues differ from initial assessment
- **Real-Time Updates:** Tasks refresh automatically every 30 seconds
- **Progress Tracking:** Visual indicators show your progress per ticket

---

## Getting Started

### Accessing the System
1. Navigate to your service center URL (e.g., `http://localhost:3025`)
2. Click "Login"
3. Enter your technician credentials
4. You'll be directed to your dashboard

### Navigation for Technicians
Your main menu includes:
- **Dashboard:** Overview of your work and statistics
- **My Tasks (Công việc của tôi):** Your assigned tasks grouped by ticket
- **Tickets:** All service tickets (you can view and work on assigned ones)
- **Customers:** Customer information (read-only)
- **Products:** Product catalog (read-only)
- **Brands:** Brand information

### Quick Access
The fastest way to see your work:
1. Click "Workflows" in the main menu
2. Select "Công việc của tôi" (My Tasks)
3. All your assigned tasks appear grouped by ticket

---

## My Tasks Page

### Overview
The My Tasks page (`/operations/my-tasks`) is your command center. It shows all tasks currently assigned to you, automatically grouped by service ticket.

### Page Layout

**Statistics Dashboard (Top Section):**
- **Total Tasks:** Total number of tasks assigned to you
- **Pending (Chờ xử lý):** Tasks not yet started (gray)
- **In Progress (Đang xử lý):** Tasks you're currently working on (blue)
- **Completed (Hoàn thành):** Tasks you've finished (green)
- **Blocked (Bị chặn):** Tasks that cannot proceed due to issues (red)

**Ticket Groups (Main Section):**
Each ticket displays:
- Ticket number (e.g., SV-2025-042)
- Customer name and phone number
- Progress indicator: "3/8" tasks completed
- Progress bar showing completion percentage
- List of all tasks for that ticket

### Task Card Information
Each task card shows:
- **Sequence number:** #1, #2, #3, etc.
- **Task name:** What needs to be done
- **Status badge:** Current state (Pending, In Progress, Completed, Blocked)
- **Category:** Task classification (if available)
- **Estimated duration:** Expected time in minutes
- **Actual duration:** Time taken (after completion)
- **Custom instructions:** Special notes for this task
- **Dependency indicators:** Lock icon or warning badge (if applicable)

### Real-Time Updates
- Tasks automatically refresh every 30 seconds
- You'll see updates if managers assign new tasks or change assignments
- Progress bars update automatically as you complete tasks
- No need to manually refresh the page

---

## Task Execution Workflow

### Understanding Task Status Flow
Tasks follow this lifecycle:
```
Pending → In Progress → Completed
            ↓
         Blocked
```

**Status Definitions:**
- **Pending (Chờ xử lý):** Task assigned but not started
- **In Progress (Đang xử lý):** Task actively being worked on
- **Completed (Hoàn thành):** Task finished with completion notes
- **Blocked (Bị chặn):** Task cannot proceed due to issues (missing parts, equipment failure, etc.)

### Starting a Task

**Step 1: Locate Your Task**
1. Go to "My Tasks" page
2. Find the ticket you're working on
3. Locate the task in the sequence

**Step 2: Click "Bắt đầu công việc" (Start Task)**
- Button appears for tasks in "Pending" status
- Task immediately changes to "In Progress"
- System records the start time automatically
- If this is the first task on a pending ticket, the ticket automatically advances to "In Progress" status

**Important Notes:**
- You can only start tasks if no blockers are present
- In strict sequence mode, you may need to complete previous tasks first (see lock icon)
- Starting a task signals to managers that you're actively working on it

### Completing a Task

**Step 1: Finish the Work**
Complete the actual repair or service work according to task requirements.

**Step 2: Click "Hoàn thành" (Complete)**
The completion modal will open.

**Step 3: Enter Completion Notes** (REQUIRED)
- Minimum 5 characters required
- Describe what you did:
  - Actions taken
  - Results achieved
  - Issues encountered and resolved
  - Parts used (if any)
  - Test results

**Good Example:**
```
Replaced cracked LCD screen with new OEM part (Serial: LCD-2025-1234).
Tested display functionality - all pixels working.
Touchscreen calibrated and responsive.
Applied new protective film.
```

**Bad Example:**
```
Done
```

**Step 4: Handle Warnings (Flexible Mode Only)**
If the template is in flexible mode and you're completing tasks out of order:
- A warning alert will appear showing incomplete previous tasks
- Review the warning to ensure this is intentional
- Proceed with completion

**Step 5: Click "Hoàn thành công việc"**
- Task marked as completed
- Completion notes saved to task history
- System records completion time
- If this is the last task on the ticket, the ticket automatically changes to "Completed" status

### Blocking a Task

**When to Block a Task:**
Block a task when you cannot proceed due to:
- Missing parts or components
- Defective replacement parts
- Equipment or tool unavailable
- Customer approval needed
- Technical issue beyond your capability
- Safety concerns

**How to Block:**
1. Click "Bị chặn" (Block) button on an in-progress task
2. Task status changes to "Blocked"
3. Add a comment explaining the blocker (see Comments section)

**Important:**
- Always document WHY you blocked the task in comments
- Notify your manager immediately about blocked tasks
- Include what's needed to unblock (e.g., "Need part #ABC-123")

**Unblocking:**
Once the blocker is resolved:
1. Click "Tiếp tục công việc" (Continue Task)
2. Task returns to "In Progress" status
3. Continue working normally

---

## Dynamic Template Switching

### What is Template Switching?
Sometimes, initial diagnosis reveals a different problem than reported. Template switching allows you to change the task workflow mid-service to match the actual issue discovered.

**Story 1.17 Feature**

### When to Switch Templates

**Common Scenarios:**
1. **Initial Report:** "Phone won't turn on" (Software diagnosis template)
   **Actual Issue:** Cracked screen preventing boot (Screen replacement template)

2. **Initial Report:** "Laptop running slow" (Software maintenance template)
   **Actual Issue:** Hard drive failure (Hardware replacement template)

3. **Initial Report:** "Water damage" (Standard repair template)
   **Actual Issue:** Too extensive, needs replacement (Replacement template)

### How to Switch Templates

**Prerequisites:**
- You must be viewing the ticket detail page
- Ticket must NOT be completed or cancelled
- You should have diagnostic evidence of the different issue

**Step-by-Step Process:**

**Step 1: Open Ticket Detail**
1. From My Tasks, click the ticket number
2. Ticket detail page opens

**Step 2: Click "Đổi Template" (Switch Template)**
- Button located in top-right ticket actions area
- Only visible to Technicians and Managers
- Only appears if ticket has a current template

**Step 3: Review Current Template**
- Modal opens showing current template name
- A blue info alert displays the current template

**Step 4: Read the Warning**
The red warning alert explains what happens:
- ✅ **Preserved:** Completed and in-progress tasks stay
- ❌ **Removed:** Pending and blocked tasks are deleted
- ➕ **Added:** New tasks from selected template are added
- 📝 **Logged:** Change recorded in audit history

**Step 5: Select New Template**
1. Click the "Chọn Template mới" dropdown
2. Browse available templates (current template excluded)
3. Select the appropriate template for the actual issue
4. Templates show service type badge (Warranty/Paid/Replacement)

**Step 6: Preview New Tasks**
- Preview box shows all tasks from the new template
- Each task displays:
  - Sequence number (#1, #2, #3...)
  - Task name
  - Custom instructions (if any)
  - Required/Optional badge
- Scroll through the preview to verify
- Total task count shown at bottom

**Step 7: Enter Reason** (REQUIRED)
- Minimum 10 characters required
- Be specific about why you're switching:
  - What you discovered during diagnosis
  - Why original template doesn't apply
  - What the actual issue is

**Good Example:**
```
Sau khi chẩn đoán, phát hiện màn hình bị vỡ hoàn toàn do rơi,
không phải lỗi phần mềm như báo cáo ban đầu. Cần thay thế màn hình.
```

**Step 8: Confirm Switch**
- Click "Xác nhận chuyển đổi" (Confirm Switch)
- System processes the change:
  - Preserves your completed work
  - Removes pending tasks
  - Adds new template tasks
  - Logs the change with your reason
  - Notifies manager

**Step 9: Continue Working**
- Modal closes
- Ticket now uses new template
- Continue with new task sequence
- Your completed work is preserved

### What Happens Behind the Scenes

**Preserved Data:**
- All completed tasks remain in history
- All in-progress tasks continue unchanged
- Task completion notes are kept
- Time tracking continues

**Changed Data:**
- Pending tasks removed (not started yet)
- Blocked tasks removed (blockers likely irrelevant to new workflow)
- New tasks added from new template
- Template reference updated

**Audit Trail:**
- Template change logged with timestamp
- Your reason recorded
- Old and new template names stored
- Manager receives notification

### Important Notes
- ⚠️ **Cannot undo:** Template switches are permanent
- ⚠️ **Choose carefully:** Review preview before confirming
- ⚠️ **Document well:** Your reason helps future analysis
- ✅ **Work preserved:** Completed tasks are never lost
- 🔔 **Manager notified:** Changes are transparent

---

## Task Sequence Modes

### Overview
Templates can be configured in two modes that control how strictly you must follow task order.

### Strict Mode (Default)

**How It Works:**
- Tasks MUST be completed in order
- You cannot skip ahead
- Locked tasks show a 🔒 lock icon
- Complete button is disabled on locked tasks

**Visual Indicators:**
- Lock icon next to task name
- Tooltip shows which tasks must be completed first
- Complete button is grayed out with tooltip

**Example:**
```
✅ #1 Customer Check-in (Completed)
✅ #2 Visual Inspection (Completed)
🔒 #3 Diagnosis (Locked - Complete task #2 first)
🔒 #4 Repair (Locked)
```

**When Locked:**
1. Hover over lock icon to see prerequisites
2. Complete previous tasks first
3. Lock automatically releases when prerequisites done
4. No warnings or confirmations needed

### Flexible Mode

**How It Works:**
- Tasks CAN be completed in any order
- System shows warnings but doesn't block
- Warning icon (⚠️) appears when completing out of order
- Manager decided this template allows flexibility

**Visual Indicators:**
- Warning icon next to task name
- Orange/yellow color scheme
- Completion modal shows warning alert

**Example:**
```
✅ #1 Customer Check-in (Completed)
❌ #2 Visual Inspection (Pending)
⚠️ #3 Diagnosis (Warning - #2 not complete)
❌ #4 Repair (Pending)
```

**When Completing Out of Order:**
1. Click "Hoàn thành" on task #3 (for example)
2. Warning alert appears in completion modal:
   - "Cảnh báo: Hoàn thành không theo thứ tự"
   - Lists incomplete previous tasks
   - Explains flexible mode allows this
3. Enter completion notes as normal
4. Click "Hoàn thành công việc"
5. Task completes successfully

**Why Use Flexible Mode:**
- Some workflows are naturally parallel
- Experienced technicians may optimize order
- Certain tasks don't depend on previous ones
- Manager trusts technician judgment

### How to Tell Which Mode?
- **Strict Mode:** Look for lock icons on pending tasks
- **Flexible Mode:** Look for warning icons when appropriate
- Ask your manager if unclear
- Template settings determine the mode

---

## Product Handling

### Physical Product Tracking
When working on service tickets, you may need to handle physical products with serial numbers.

### Checking Product Serial Numbers

**During Check-In:**
1. Locate product serial number on device
   - Usually on back, bottom, or battery compartment
   - May be on original packaging
2. Verify serial matches what's recorded in system
3. Report any mismatches immediately to reception/manager

**Common Locations for Serial Numbers:**
- Laptops: Bottom panel or battery compartment
- Phones: Settings > About or SIM tray
- Tablets: Back panel or Settings
- Accessories: Product label or packaging

### Recording Product Condition

**Initial Inspection:**
- Document any existing damage (scratches, dents, cracks)
- Take photos if necessary
- Note in task completion notes
- This protects both you and the customer

**Example Inspection Note:**
```
Initial condition: Minor scratches on back cover, screen intact,
no water damage indicators. Camera functioning normally.
```

**After Repair:**
- Note final condition
- Document any cosmetic changes
- List new parts installed with serial numbers

### Automatic Warehouse Movements

**What Happens Automatically:**
When you work on tickets with physical products, the system tracks:

**Check-In Flow:**
- Product enters "Service In Progress" virtual warehouse
- Location tracked by ticket number
- System knows exactly where product is

**Check-Out Flow:**
- Product moves to "Ready for Pickup" when ticket completes
- Customer notified automatically
- Warehouse staff knows product location

**Replacement Flow:**
- Failed product moves to "RMA Queue"
- Replacement product issued from "Available Stock"
- Serial numbers tracked for warranty

**What You Need to Do:**
- Ensure product serial number is recorded correctly
- Complete tasks accurately (triggers movements)
- Report any product handling issues immediately

### Best Practices
- ✅ Always verify serial numbers match
- ✅ Handle products carefully to avoid additional damage
- ✅ Document existing damage before starting work
- ✅ Keep products in designated service area
- ✅ Never release products without manager approval
- ❌ Don't skip serial number verification
- ❌ Don't work on products not assigned to you

---

## Comments and Notes

### Types of Documentation

**1. Task Completion Notes:**
- Required when completing any task
- Minimum 5 characters
- Stored in task history
- Visible to managers and other technicians

**2. Task Custom Instructions:**
- Set by manager when assigning task
- Shows in task card
- Read these before starting work
- Provides context and special requirements

**3. Ticket Comments:**
- General notes about the entire ticket
- Can be internal or external
- Support photo attachments

### Adding Ticket Comments

**When to Add Comments:**
- Providing diagnosis findings
- Reporting unexpected issues
- Communicating with team about complex problems
- Documenting customer interactions
- Noting part shortages or delays

**How to Add:**
1. Open ticket detail page
2. Scroll to Comments section (bottom)
3. Click "Add Comment" or comment text area
4. Type your comment
5. Choose comment type:
   - **Internal:** Only staff can see
   - **External:** Customer can see (use for updates they need)
6. Click "Submit" or "Add Comment"

### Internal vs External Comments

**Internal Comments (Default):**
Use for:
- Technical details
- Part numbers and costs
- Internal communication
- Issues and blockers
- Process notes

**Example Internal:**
```
INTERNAL: Waiting for LCD part (Part #LCD-ABC-123) - Expected delivery tomorrow.
Customer not informed yet. Will test and complete once part arrives.
```

**External Comments:**
Use for:
- Customer updates
- Completion notifications
- Delivery status
- What customer needs to know

**Example External:**
```
EXTERNAL: Màn hình đã được thay thế hoàn tất. Sản phẩm đã qua kiểm tra
chất lượng và sẵn sàng để nhận. Xin liên hệ quầy lễ tân để nhận máy.
```

### Photo Attachments

**When to Attach Photos:**
- Documenting initial damage
- Showing diagnosis findings
- Proving repair quality
- Recording before/after states
- Supporting warranty claims

**How to Attach:**
1. In comment area, look for attachment icon
2. Click to open file picker
3. Select photo(s) from device
4. Photos upload automatically
5. Add comment describing photos
6. Submit comment with attachments

**Photo Best Practices:**
- ✅ Use good lighting
- ✅ Capture clear, focused images
- ✅ Include serial numbers when relevant
- ✅ Show full context (not too zoomed in)
- ✅ Label photos in comment text
- ❌ Don't upload irrelevant photos
- ❌ Don't include customer personal information in photos

---

## Practical Examples

### Example 1: Completing a Standard Repair Workflow

**Scenario:** iPhone screen replacement, strict sequence mode

**Initial State:**
- Ticket: SV-2025-042
- Template: "iPhone Screen Replacement"
- Tasks: 8 tasks assigned to you

**Your Workflow:**

**Task #1: Customer Check-In**
1. Go to My Tasks page
2. Find ticket SV-2025-042
3. Click "Bắt đầu công việc" on Task #1
4. Verify customer name and phone match
5. Record initial device condition
6. Click "Hoàn thành"
7. Enter notes:
   ```
   Customer confirmed: Mai Nguyen - 0901234567.
   Device: iPhone 12, Serial: F17ABC123XYZ.
   Initial condition: Cracked screen, device powers on normally,
   no water damage. Customer signed service agreement.
   ```
8. Click "Hoàn thành công việc"

**Task #2: Visual Inspection**
1. Task automatically unlocked after Task #1 completed
2. Click "Bắt đầu công việc"
3. Inspect device thoroughly
4. Take photos of damage
5. Click "Hoàn thành"
6. Enter notes:
   ```
   Screen shattered in upper right corner. LCD functional but touch
   not responsive in damaged area. Back housing intact. Camera working.
   Battery health 87%. No other issues found.
   ```
7. Attach photos
8. Click "Hoàn thành công việc"

**Task #3: Parts Preparation**
1. Click "Bắt đầu công việc"
2. Check inventory for OEM iPhone 12 screen
3. Retrieve part from warehouse
4. Verify part serial number
5. Click "Hoàn thành"
6. Enter notes:
   ```
   OEM screen retrieved from warehouse: Part #SCREEN-IP12-OEM-001.
   Part inspected - no defects. Tools prepared: spudger set, suction cup,
   heat gun, adhesive strips.
   ```

**Task #4: Screen Removal**
1. Click "Bắt đầu công việc"
2. Power off device
3. Heat edges and remove screen
4. Disconnect cables carefully
5. Click "Hoàn thành"
6. Enter notes:
   ```
   Old screen removed successfully. All cables disconnected cleanly.
   No damage to housing or connectors. Cleaned adhesive residue.
   ```

**Continue similarly for remaining tasks...**

**Result:**
- All tasks completed in sequence
- Proper documentation at each step
- When final task completed, ticket auto-advances to "Completed"
- Customer receives notification

---

### Example 2: Template Switch After Diagnosis

**Scenario:** Customer reports "laptop won't turn on" - discovers it's actually a broken screen

**Initial State:**
- Ticket: SV-2025-055
- Template: "Laptop Power Diagnosis"
- Customer complaint: "Laptop won't turn on"

**Your Workflow:**

**Task #1: Initial Assessment (Complete)**
1. Start task
2. Receive laptop from customer
3. Complete notes:
   ```
   Customer reports laptop won't turn on. Device received,
   Serial: LT-2025-ABC123. No visible external damage.
   ```

**Task #2: Power Diagnosis (Complete)**
1. Start task
2. Test power button
3. Check battery and AC adapter
4. **Discovery:** Laptop IS turning on (LED indicators show activity)
5. Complete notes:
   ```
   FINDING: Laptop actually powers on normally. Power LED active,
   fan spinning, hard drive activity. Issue is NOT power-related.
   Screen remains completely black - likely screen failure or
   loose connection.
   ```

**Task #3: Discover Different Issue**
1. At this point, you realize current template is wrong
2. Go to ticket detail page
3. Click "Đổi Template" button

**Template Switch Process:**
1. Modal opens showing current template: "Laptop Power Diagnosis"
2. Read warnings carefully
3. Select new template: "Laptop Screen Replacement"
4. Preview shows new tasks:
   ```
   #1 Visual Inspection
   #2 Screen Connection Check
   #3 Screen Replacement
   #4 Testing
   #5 Quality Check
   ```
5. Enter reason (minimum 10 characters):
   ```
   Sau khi chẩn đoán, phát hiện laptop hoạt động bình thường nhưng
   màn hình hoàn toàn đen. Không phải vấn đề nguồn như báo cáo ban đầu.
   Laptop cần thay màn hình. Đèn nguồn sáng, quạt chạy, có hoạt động ổ cứng.
   ```
6. Click "Xác nhận chuyển đổi"

**After Template Switch:**
1. Your completed Tasks #1 and #2 are preserved in history
2. Remaining power diagnosis tasks removed
3. New screen replacement tasks appear
4. Manager receives notification
5. Continue with new Task #1: Visual Inspection

**Task #1 (New Template): Visual Inspection**
1. Start task
2. Inspect screen carefully
3. Complete notes:
   ```
   Screen completely black, no backlight visible. Tested with flashlight -
   no faint image visible (not just backlight issue). Screen connection
   checked - firmly connected. Screen needs full replacement.
   ```

**Continue with new template tasks...**

**Result:**
- Workflow adapted to actual issue
- All diagnostic work preserved
- Proper repair path followed
- Customer gets correct fix

---

### Example 3: Handling a Blocked Task

**Scenario:** Need to replace a part but it's out of stock

**Initial State:**
- Ticket: SV-2025-067
- Task: #4 Battery Replacement
- Issue: Battery part not in stock

**Your Workflow:**

**Task #4: Battery Replacement**
1. Start task
2. Check part inventory
3. **Discovery:** Required battery (Model: BAT-IP11-OEM) is out of stock
4. Click "Bị chặn" (Block) button
5. Task status changes to "Blocked"

**Add Comment:**
1. Go to ticket comments section
2. Add internal comment:
   ```
   INTERNAL: Task #4 blocked - Battery part (BAT-IP11-OEM) out of stock.
   Checked warehouse, no stock available. Estimated restock: 2 days.
   Customer not yet informed. Awaiting manager approval to order part
   or source alternative.
   ```
3. Submit comment

**Notify Manager:**
1. Use internal communication (Slack, Teams, etc.)
2. Alert manager to blocked task
3. Provide ticket number and part needed

**Wait for Resolution:**
- Manager orders part or approves alternative
- Part arrives in 2 days
- Manager notifies you

**Resume Work:**
1. Return to My Tasks page
2. Find blocked task on ticket SV-2025-067
3. Click "Tiếp tục công việc" (Continue Task)
4. Task returns to "In Progress"
5. Retrieve new battery part
6. Install battery
7. Click "Hoàn thành"
8. Enter completion notes:
   ```
   Replacement battery (BAT-IP11-OEM, Serial: BAT-2025-456) installed.
   Battery capacity: 100%. Charging tested - working normally.
   Device powered on successfully. Battery health verified in settings.
   ```

**Result:**
- Blocker documented clearly
- Manager aware and resolved issue
- Work resumed and completed
- Customer receives fully repaired device

---

## Tips and Best Practices

### Task Execution Tips

**Before Starting:**
- ✅ Read custom instructions carefully
- ✅ Check if you have all required parts/tools
- ✅ Verify product serial number
- ✅ Review previous task notes for context

**During Work:**
- ✅ Start task immediately when you begin work (accurate time tracking)
- ✅ Follow safety procedures for your specialty
- ✅ Document unexpected findings as you go
- ✅ Take photos of important stages

**After Completing:**
- ✅ Write clear, detailed completion notes
- ✅ Include part serial numbers when relevant
- ✅ Describe test results
- ✅ Note any deviations from standard process

### Documentation Best Practices

**Be Specific:**
❌ Bad: "Fixed the screen"
✅ Good: "Replaced cracked LCD with OEM part #SCR-123, tested touch and display - working"

**Include Evidence:**
❌ Bad: "Device working"
✅ Good: "Powered on successfully, all apps launching, battery charging at 1.2A"

**Record Part Details:**
❌ Bad: "Installed new battery"
✅ Good: "Installed OEM battery (Part: BAT-IP11-001, Serial: BAT-2025-789), capacity 100%"

**Note Issues:**
❌ Bad: "Had a problem"
✅ Good: "Connector pin bent, carefully straightened with precision tool, connection stable"

### Time Management

**Prioritize:**
1. Blocked tasks that are now unblocked
2. Tickets nearing SLA deadline
3. In-progress tasks (finish before starting new)
4. High-priority tickets (marked by manager)

**Batch Similar Tasks:**
- If you have multiple screen replacements, do them together
- Reduces tool setup/cleanup time
- More efficient workflow

**Communicate Delays:**
- If task takes longer than estimated, update manager
- Add comment explaining why
- Better to communicate early than miss deadlines

### Template Switching Tips

**When NOT to Switch:**
- If you're almost done with current template
- If issue is minor and can be handled within current workflow
- If you're unsure - ask manager first

**When TO Switch:**
- Issue discovered is completely different
- Current template would waste time on irrelevant tasks
- New template significantly better matches actual issue

**Always:**
- Write detailed reason (helps future analysis)
- Double-check template preview
- Complete diagnostic tasks before switching

### Quality Assurance

**Before Marking Complete:**
- ✅ Test the repair thoroughly
- ✅ Verify all functions work
- ✅ Clean the device
- ✅ Check all screws/panels are secure
- ✅ Verify serial numbers match

**Think Like the Customer:**
- Would you be satisfied with this repair?
- Is it better than when they brought it in?
- Would it pass your personal quality standards?

---

## Troubleshooting

### Cannot Start a Task

**Issue:** "Start Task" button is grayed out or missing

**Possible Causes:**
1. **Task is locked (strict mode):** Complete previous tasks first
   - Look for lock icon
   - Hover to see which tasks are needed
2. **Task already in progress or completed:** Check status badge
3. **Task assigned to someone else:** Verify it's actually assigned to you
4. **Ticket is completed/cancelled:** Cannot start tasks on finished tickets

**Solution:**
- Complete prerequisites first
- Ask manager to reassign if needed
- Refresh page if status looks wrong

### Cannot Complete a Task

**Issue:** "Complete" button is disabled

**Possible Causes:**
1. **Task is locked (strict mode):** Complete previous tasks
2. **Task not in "In Progress" status:** Must start task first
3. **Template in strict mode with incomplete prerequisites**

**Solution:**
- Hover over disabled button for tooltip explanation
- Complete previous tasks
- Ask manager about template sequence mode

### Completion Notes Validation Error

**Issue:** "Ghi chú hoàn thành phải có ít nhất 5 ký tự"

**Cause:** Your notes are too short (less than 5 characters)

**Solution:**
- Write meaningful completion notes
- Describe what you did, results achieved, tests performed
- Minimum 5 characters, but should be much longer for quality

### Template Switch Button Missing

**Issue:** Cannot find "Đổi Template" button

**Possible Causes:**
1. **Ticket already completed/cancelled:** Cannot switch finished tickets
2. **Ticket has no template:** Nothing to switch from
3. **Not on ticket detail page:** Button only shows on detail view

**Solution:**
- Check ticket status
- Verify ticket was created with a template
- Navigate to full ticket detail page (not just My Tasks)

### Task Not Appearing in My Tasks

**Issue:** Manager says task is assigned but you don't see it

**Possible Causes:**
1. **Page not refreshed:** Tasks auto-refresh every 30 seconds
2. **Task on different ticket:** Check all ticket groups
3. **Filter applied:** Check if you have any filters enabled
4. **Assignment to wrong user:** Manager assigned to someone else by mistake

**Solution:**
- Wait 30 seconds for auto-refresh or refresh page manually
- Scroll through all ticket groups
- Ask manager to verify assignment

### System Shows Wrong Task Status

**Issue:** Status doesn't match what you see

**Possible Causes:**
1. **Cache issue:** Browser showing old data
2. **Concurrent update:** Someone else updated the task
3. **Network delay:** Update not synced yet

**Solution:**
- Refresh the page
- Wait 30 seconds for auto-refresh
- Check with manager if discrepancy persists

---

## FAQ

### General Questions

**Q: How often do my tasks refresh automatically?**
A: Every 30 seconds. The My Tasks page automatically polls for updates.

**Q: Can I work on multiple tasks at the same time?**
A: Technically yes, but best practice is to focus on one task at a time. Only start a task when you're actively working on it for accurate time tracking.

**Q: What happens if I start a task but get interrupted?**
A: The task stays "In Progress" until you complete it. If you're interrupted for a long time, add a comment explaining the delay.

**Q: Can I see tasks assigned to other technicians?**
A: No, My Tasks only shows YOUR assigned tasks. Managers can see all tasks.

### Task Execution Questions

**Q: What's the minimum length for completion notes?**
A: 5 characters, but you should write much more detailed notes for quality and warranty purposes.

**Q: Can I edit completion notes after submitting?**
A: No, completion notes cannot be edited once submitted. Double-check before clicking "Hoàn thành công việc."

**Q: What if I accidentally completed the wrong task?**
A: Contact your manager immediately. They may need to adjust the record or create a corrective ticket.

**Q: Can I skip a task?**
A: Not by yourself. If a task is not needed, ask your manager to skip it. Managers can mark tasks as "Skipped."

**Q: What does the "actual duration" field mean?**
A: It's automatically calculated from start time to completion time. Helps track how long tasks really take.

### Template Switching Questions

**Q: Can I switch templates multiple times on one ticket?**
A: Yes, but avoid excessive switching. Each switch is logged and reviewed.

**Q: What happens to tasks I already completed when I switch?**
A: They're preserved. Completed and in-progress tasks always stay.

**Q: Can I switch back to the original template?**
A: Yes, but you'll need to go through the same process. Previously removed tasks don't come back.

**Q: Do I need manager approval to switch templates?**
A: No, but managers are notified automatically. If unsure, ask before switching.

**Q: What if the new template has a task I already completed manually?**
A: The system adds it anyway. You can mark it as complete again with a note like "Already completed before template switch."

### Sequence Mode Questions

**Q: How do I know if a template is in strict or flexible mode?**
A: Look for lock icons (strict) or warning icons (flexible) on tasks.

**Q: Can I request a template be changed to flexible mode?**
A: Yes, ask your manager. They can update template settings.

**Q: In flexible mode, should I still follow sequence?**
A: Yes, when possible. The sequence is recommended for a reason. Only deviate when necessary.

**Q: What happens if I complete tasks out of order in strict mode?**
A: You can't. The system prevents it. Complete previous tasks first.

### Product Handling Questions

**Q: What if the serial number doesn't match the system?**
A: Stop work immediately and notify reception/manager. Do not proceed.

**Q: Where can I find a product's serial number?**
A: Check device back/bottom, settings menu, SIM tray, or original packaging.

**Q: What if there's no serial number?**
A: Report to manager. Some products may need manual serial number creation/documentation.

**Q: Do I need to track warehouse movements?**
A: No, the system tracks automatically based on task completion and ticket status.

### Comments Questions

**Q: When should I use internal vs external comments?**
A: Internal for technical details and team communication. External only for customer-facing updates.

**Q: Can customers see my completion notes?**
A: No, completion notes are internal. Only comments marked "External" are visible to customers.

**Q: How many photos can I attach?**
A: Typically 5-10 per comment. Check with your manager if you need to attach more.

**Q: Can I delete a comment after posting?**
A: No, comments are permanent for audit purposes. Be careful what you write.

---

## Need More Help?

### Escalation Path

**For Technical Issues:**
1. Check this guide's Troubleshooting section
2. Ask a senior technician
3. Contact your manager
4. Email IT support (if system bug)

**For Process Questions:**
1. Check this guide's relevant section
2. Ask your manager
3. Refer to company policy documents

**For Urgent Blockers:**
1. Block the task immediately
2. Add detailed comment
3. Notify manager right away
4. Document everything

### Contact Information

**Manager:** [Your manager's name and contact]
**IT Support:** [IT support contact]
**Help Desk:** [Help desk extension/email]

---

## Document Information

**Version History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-24 | Initial technician guide for Phase 2 | Documentation Team |

**Related Documents:**
- Administrator User Guide (`admin-guide.md`)
- System Architecture (`/docs/TASK_WORKFLOW_ARCHITECTURE.md`)
- API Documentation (`/docs/architecture/coding-standards.md`)

**Feedback:**
If you have suggestions for improving this guide, please contact your manager or the documentation team.

---

*This guide is part of the Service Center Phase 2 documentation suite.*
