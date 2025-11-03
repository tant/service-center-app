# User Guide: Task Management System

**Version:** 1.0
**Date:** November 3, 2025
**Target Audience:** Technicians, Managers, Administrators

---

## Overview

The Task Management System provides a centralized dashboard for tracking and managing work across multiple types of operations:
- Service Ticket repairs
- Inventory receipts
- Inventory issues
- Inventory transfers
- Service requests

**Access:** Navigate to **My Tasks** (Công việc của tôi) from the main navigation menu.

---

## Task Dashboard Overview

### Key Features

#### 1. Statistics Cards (Top Row)
- **Total Tasks** (Tổng công việc): All tasks assigned to you
- **Assigned to Me** (Được giao cho tôi): Tasks specifically assigned to you
- **Pending** (Đang chờ): Tasks not yet started
- **In Progress** (Đang thực hiện): Tasks you're currently working on
- **Completed** (Hoàn thành): Finished tasks
- **Overdue** (Quá hạn): Tasks past their due date

#### 2. Filter Panel (Left Sidebar)
- **My Tasks** (Công việc của tôi): Show only tasks assigned to you
- **All Tasks** (Tất cả): View all tasks in the system
- **Available Tasks** (Có thể nhận): Unassigned tasks you can claim
- **Overdue Only** (Chỉ quá hạn): Filter to see only overdue tasks
- **Required Only** (Chỉ bắt buộc): Show only required tasks
- **Entity Type** (Loại): Filter by service ticket, inventory documents, etc.
- **Status** (Trạng thái): Filter by pending, in progress, completed, blocked

#### 3. Task Cards
Each task card displays:
- **Task Name** (Tên công việc): What needs to be done
- **Description** (Mô tả): Detailed instructions
- **Entity Context** (Bối cảnh):
  - Service Ticket: Ticket number (e.g., SV-2025-001)
  - Inventory Receipt: Document number (e.g., GRN-2025-001)
  - Inventory Issue: Document number (e.g., GIN-2025-001)
- **Priority Badge** (Mức ưu tiên): High, Normal, Low, Urgent
- **Status Badge** (Trạng thái): Pending, In Progress, Completed, Blocked
- **Due Date** (Hạn chót): Deadline with countdown
- **Assigned To** (Người thực hiện): Current assignee or "Unassigned"
- **Action Buttons** (Hành động): Start, Complete, Block, Unblock

---

## Common Workflows

### 1. Starting a Task

**Scenario:** You want to begin working on an assigned task

**Steps:**
1. Go to **My Tasks** dashboard
2. Enable **My Tasks** filter (toggle on)
3. Find the task you want to start
4. Click **Start Task** (Bắt đầu) button
5. Task status changes to **In Progress** (Đang thực hiện)

**Note:** You can only start tasks that are:
- Currently in **Pending** status
- Assigned to you OR unassigned

---

### 2. Completing a Task

**Scenario:** You've finished working on a task and want to mark it complete

**Steps:**
1. Locate the task with **In Progress** status
2. Click **Complete Task** (Hoàn thành) button
3. Enter **completion notes** in the dialog:
   - Describe what was done
   - Note any issues encountered
   - Mention parts used or recommendations
4. Click **Complete** to submit
5. Task status changes to **Completed** (Hoàn thành)

**Note:** Completion notes are **required** and will be saved for audit purposes.

---

### 3. Blocking a Task

**Scenario:** You cannot proceed with a task due to missing parts, information, or other blockers

**Steps:**
1. Find the task you need to block
2. Click **Block Task** (Chặn) button
3. In the dialog, provide a detailed reason:
   - Why is the task blocked?
   - What is needed to unblock it?
   - Who needs to take action?
4. Click **Block** to submit
5. Task status changes to **Blocked** (Bị chặn)

**Example Reasons:**
- "Waiting for replacement GPU from supplier"
- "Customer has not provided password for device"
- "Need manager approval for warranty replacement"

---

### 4. Unblocking a Task

**Scenario:** A blocked task can now proceed (parts arrived, information received)

**Steps:**
1. Locate the **Blocked** task
2. Click **Unblock Task** (Bỏ chặn) button
3. Task status returns to **Pending** (Đang chờ)
4. You can now click **Start Task** to resume work

---

### 5. Claiming an Available Task

**Scenario:** You want to work on an unassigned task

**Steps:**
1. Enable **Available Tasks** filter
2. Browse unassigned tasks
3. Click **Assign to Me** (Nhận việc) button on desired task
4. Task is now assigned to you
5. Click **Start Task** to begin work

**Note:** This helps managers distribute workload evenly.

---

### 6. Finding Overdue Tasks

**Scenario:** Manager wants to see which tasks are overdue

**Steps:**
1. Go to **My Tasks** dashboard
2. Enable **Overdue Only** filter (Chỉ quá hạn)
3. Review all tasks past their due date
4. Overdue tasks have a **red border** for visibility
5. Take action: contact assignees, reassign, or update priorities

---

## Task Priorities

| Priority | Vietnamese | Color | Meaning |
|----------|-----------|-------|---------|
| **Urgent** | Khẩn cấp | Red | Drop everything, do this now |
| **High** | Cao | Orange | High priority, do soon |
| **Normal** | Bình thường | Blue | Standard priority |
| **Low** | Thấp | Gray | Low priority, do when time allows |

---

## Task Statuses

| Status | Vietnamese | Color | Meaning |
|--------|-----------|-------|---------|
| **Pending** | Đang chờ | Gray | Not yet started |
| **In Progress** | Đang thực hiện | Blue | Currently being worked on |
| **Completed** | Hoàn thành | Green | Successfully finished |
| **Blocked** | Bị chặn | Red | Cannot proceed, needs intervention |
| **Skipped** | Bỏ qua | Yellow | Intentionally skipped (optional tasks) |

---

## Real-time Updates

The dashboard **automatically refreshes every 30 seconds** to show:
- New tasks assigned to you
- Status changes by other team members
- Updated due dates
- New completions

**Manual Refresh:** Reload the page to get instant updates.

---

## Mobile Access

The dashboard is **fully responsive** and works on tablets and smartphones:
- Filters collapse into a hamburger menu
- Task cards stack vertically for readability
- All actions remain accessible

**Tip:** Use landscape mode on tablets for the best experience.

---

## Tips & Best Practices

### For Technicians

1. **Check tasks daily** at the start of your shift
2. **Start tasks immediately** to signal you're working on them
3. **Block tasks proactively** if you encounter issues (don't wait!)
4. **Write detailed completion notes** for quality tracking
5. **Claim available tasks** during downtime

### For Managers

1. **Monitor overdue tasks daily** using the filter
2. **Check for blocked tasks** and help resolve blockers
3. **Review available tasks** and assign them if needed
4. **Use entity type filter** to see workload by operation type
5. **Review completion notes** for quality assurance

---

## Troubleshooting

### "I can't start a task"

**Possible Reasons:**
- Task is not assigned to you → Claim it first with **Assign to Me**
- Task is already in progress by someone else
- Task is blocked → Check blocked reason and resolve

---

### "Task disappeared from my view"

**Possible Reasons:**
- You have filters enabled → Disable filters to see all tasks
- Task was completed by you → Enable **Completed** status filter to see it
- Task was reassigned to someone else
- Task was deleted by a manager

---

### "I can't find the task I'm looking for"

**Solution:**
1. Disable all filters (click each toggle off)
2. Enable **All Tasks** instead of **My Tasks**
3. Search by entity type (e.g., select "Service Ticket")
4. If still not found, contact your manager

---

## Frequently Asked Questions

**Q: Can I reassign a task to someone else?**
A: No, only managers and administrators can reassign tasks. If you need to reassign, notify your manager.

**Q: What happens if I miss a due date?**
A: The task will show as **overdue** with a red border. Complete it as soon as possible and notify your manager.

**Q: Can I edit task details (name, description, due date)?**
A: No, task details are set by managers or workflows. If you need changes, contact your manager.

**Q: What if I accidentally marked a task complete?**
A: You cannot undo a completion. Contact your manager to reopen the task if needed.

**Q: Can I see tasks from other technicians?**
A: Enable **All Tasks** filter to see everyone's tasks. This helps with workload balancing.

**Q: Why do some tasks have no assignee?**
A: These are available tasks that anyone can claim with **Assign to Me**. This allows flexible workload distribution.

---

## Support

For technical issues or questions:
- **Contact:** Your system administrator
- **Email:** admin@sstcservice.com
- **Internal:** Use the support ticket system

For workflow or process questions:
- **Contact:** Your department manager
- **Training:** Additional training sessions available upon request

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 3, 2025 | Initial release with core task management features |

---

**Document End**
