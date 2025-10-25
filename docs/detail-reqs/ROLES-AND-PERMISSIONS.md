# Roles & Permissions Specification

**Project:** Service Center Management System
**Version:** 1.0
**Date:** 2025-10-25
**Status:** Approved for Implementation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Role Definitions](#role-definitions)
3. [Permission Matrix](#permission-matrix)
4. [Feature-Level Permissions](#feature-level-permissions)
5. [Security Requirements](#security-requirements)
6. [Business Rules](#business-rules)
7. [Implementation Notes](#implementation-notes)

---

## Overview

### Purpose
This document defines the role-based access control (RBAC) system for the Service Center application, ensuring proper separation of duties and data security.

### Roles Summary
- **Admin** (1 account) - System administrator with full access
- **Manager** (Multiple) - Operations supervisor with oversight capabilities
- **Technician** (Multiple) - Service execution staff with task-focused access
- **Reception** (Multiple) - Customer-facing staff with intake capabilities

### Design Principles
1. **Least Privilege:** Users have minimum permissions needed for their role
2. **Separation of Duties:** Critical operations require different roles
3. **Defense in Depth:** Security enforced at database, API, and UI levels
4. **Auditability:** All permission-sensitive actions are logged

---

## Role Definitions

### 1. ADMIN (Administrator)

**Số lượng:** Chỉ 1 account duy nhất
**Khởi tạo:** Qua `/setup` endpoint với credentials từ `.env`

#### Responsibilities
- Cấu hình và duy trì hệ thống
- Quản lý users và permissions
- Giám sát system health và logs
- Backup và disaster recovery

#### Full Access To
- ✅ **System Settings:** Email config, integrations, feature flags
- ✅ **User Management:** Create/update/delete all users (Manager, Technician, Reception)
- ✅ **All Business Features:** Tickets, customers, products, parts, warehouse
- ✅ **Task Templates:** Create and modify service workflows
- ✅ **Analytics & Reports:** Access all metrics and export data
- ✅ **Audit Logs:** View all system activities and changes
- ✅ **Database Operations:** Backup, restore, migrations

#### Restrictions
- ⚠️ **Recommended:** Admin should NOT perform daily operations
- ⚠️ **Best Practice:** Use Manager account for oversight, Admin only for system config

#### Environment Variables Required
```bash
ADMIN_EMAIL=admin@tantran.dev
ADMIN_PASSWORD=tantran
ADMIN_NAME=System Administrator
SETUP_PASSWORD=tantran
```

---

### 2. MANAGER (Quản lý)

**Số lượng:** Multiple accounts
**Khởi tạo:** Created by Admin

#### Responsibilities
- Giám sát daily operations và team performance
- Quản lý workload và assign tasks
- Approve high-value transactions và RMA
- Analyze metrics và make business decisions
- Handle customer escalations

#### Permissions

##### ✅ Full Access
- **Dashboard:** View all metrics, revenue, KPIs, trends
- **Customers:** Create, read, update customers (no delete)
- **Products/Parts:** Manage product catalog, pricing, categories
- **Task Templates:** Create and modify service workflows
- **Reports:** Access all analytics, export data
- **Email Templates:** Configure notification templates

##### ✅ Partial Access - Tickets
- **View:** All tickets across all statuses
- **Create:** New service tickets (like Reception)
- **Update:**
  - Assign/reassign technicians
  - Change priority (normal → high)
  - Update customer info
  - Add comments and notes
- **Special:** Switch task template mid-service (với audit trail và reason)
- **Cannot:** Delete tickets (only cancel/archive)

##### ✅ Partial Access - Warehouse
- **View:** All stock levels, movements, RMA batches
- **Create:** Stock movements (intake, outgoing, transfer)
- **Create:** RMA batches for warranty returns
- **Update:** RMA batch status
- **Approve:** High-value stock movements (>10 units or high-value items)
- **Cannot:** Delete stock records

##### ✅ Partial Access - Team
- **View:** All technicians and reception staff
- **Update:** Workload balancing, task assignment
- **Cannot:** Create/delete users (Admin only)

##### ❌ No Access
- **System Settings:** Cannot modify email config, integrations
- **User CRUD:** Cannot create/delete users
- **Audit Logs:** Cannot access system logs (Admin only)

#### Use Cases
1. **Morning:** Check dashboard → Review overnight tickets → Balance workload
2. **Escalation:** Customer complaint → Review ticket → Reassign to senior tech
3. **RMA:** Tech reports faulty GPU → Manager reviews → Creates RMA batch → Sends to ZOTAC
4. **Template Switch:** Warranty claim rejected → Switch to repair template
5. **Approval:** 10 GPUs stock out request → Manager approves → Stock movement executed

---

### 3. TECHNICIAN (Kỹ thuật viên)

**Số lượng:** Multiple accounts
**Khởi tạo:** Created by Admin

#### Responsibilities
- Execute service tasks (diagnose, repair, test, QA)
- Update task progress và upload photos
- Request parts từ warehouse
- Document work performed

#### Permissions

##### ✅ Full Access - My Tasks
- **View:** All tasks assigned to me
- **Update:** Task status (start, pause, complete)
- **Update:** Task notes, observations, photos
- **Update:** Parts used, time spent
- **Add:** Comments to tickets I'm working on

##### ✅ Partial Access - Tickets
- **View:** Only tickets that have tasks assigned to me
- **Read:** Customer info, device info, issue description
- **Cannot:**
  - View all tickets
  - Change ticket status
  - Assign tasks
  - Update pricing or fees
  - Delete tickets

##### ✅ Partial Access - Customers
- **View:** Customer info for tickets I'm handling
- **Cannot:** View all customers, create/update/delete

##### ✅ Partial Access - Products/Parts
- **View:** Product catalog, parts inventory
- **Search:** Product details, warranty info
- **Verify:** Serial numbers, warranty status
- **Cannot:** Update catalog, pricing, stock quantities

##### ✅ Partial Access - Warehouse
- **View:** Stock levels (read-only)
- **Search:** Serial verification tool
- **Request:** Parts for repair (creates request for Manager approval)
- **Cannot:** Create stock movements, RMA batches

##### ❌ No Access
- **Dashboard:** Cannot view revenue, analytics
- **Team Management:** Cannot view other technicians
- **Task Templates:** Cannot create/modify workflows
- **Reports:** Cannot access business reports
- **System Settings:** Cannot modify any settings

#### Workflow
1. **Login:** Redirect to `/my-tasks` dashboard
2. **Start Task:** Select task → Click "Bắt đầu" → Timer starts
3. **Work:** Diagnose issue → Take photos → Add notes
4. **Parts:** Need GPU fan → Search inventory → Request from warehouse
5. **Complete:** Upload before/after photos → Add summary → Mark done
6. **Next:** Auto-assigned next task in queue

#### UI Experience
- **Simplified Dashboard:** Only "My Tasks" và "Active Tickets"
- **No Pricing:** All cost/revenue fields hidden
- **Task-Focused:** Streamlined interface for execution

---

### 4. RECEPTION (Lễ tân)

**Số lượng:** Multiple accounts
**Khởi tạo:** Created by Admin

#### Responsibilities
- Greet customers và intake service requests
- Create service tickets
- Answer customer inquiries
- Convert public portal requests
- Handle delivery confirmations
- Basic customer support

#### Permissions

##### ✅ Full Access - Ticket Intake
- **View:** All tickets (to answer customer questions)
- **Create:** New service tickets (warranty & repair)
- **Select:** Task template during creation
- **Update:** Customer contact info, device info
- **Cannot:**
  - Assign technicians (auto-assign or Manager does)
  - Change ticket status manually
  - Update task progress
  - Modify pricing/fees

##### ✅ Full Access - Customers
- **View:** All customers
- **Create:** New customers
- **Update:** Contact info, address, notes
- **Search:** By phone, email, name
- **Cannot:** Delete customers

##### ✅ Partial Access - Products
- **View:** Product catalog
- **Search:** Warranty check by serial number
- **Cannot:** Update catalog, pricing

##### ✅ Partial Access - Public Portal
- **View:** Service requests from public portal
- **Convert:** Public request → Internal ticket
- **Update:** Request status
- **Notify:** Send email updates to customers

##### ✅ Full Access - Delivery
- **Mark:** Ticket ready for pickup/delivery
- **Send:** Delivery confirmation emails/SMS
- **Update:** Delivery status and method
- **Confirm:** Customer pickup signature

##### ❌ No Access
- **Dashboard:** Cannot view revenue/analytics
- **Task Execution:** Cannot update task progress
- **Warehouse:** Cannot access stock management
- **Team:** Cannot view technicians or workload
- **Reports:** Cannot access business reports
- **Task Templates:** Cannot create/modify workflows

#### Workflow
1. **Customer Walk-in:**
   - Create customer (if new)
   - Create ticket → Fill device info → Select template
   - Print receipt with ticket number
2. **Phone Inquiry:**
   - Search by phone number
   - Check ticket status
   - Inform customer of progress
3. **Public Portal:**
   - Review request
   - Convert to ticket
   - Send confirmation email
4. **Delivery:**
   - Mark ticket ready
   - Call customer
   - Handle pickup confirmation

#### UI Experience
- **Customer-Focused:** Large search bar, recent tickets
- **Simplified Forms:** Only essential fields
- **Status Board:** Visual display of today's tickets
- **No Technical Details:** Task progress hidden

---

## Permission Matrix

### Core Features

| Feature | Admin | Manager | Technician | Reception |
|---------|-------|---------|------------|-----------|
| **Dashboard** |
| View all metrics | ✅ | ✅ | ❌ | ❌ |
| View revenue | ✅ | ✅ | ❌ | ❌ |
| View my tasks | ✅ | ✅ | ✅ | ❌ |
| **Tickets** |
| View all tickets | ✅ | ✅ | ❌ | ✅ |
| View assigned tickets | ✅ | ✅ | ✅ | ✅ |
| Create ticket | ✅ | ✅ | ❌ | ✅ |
| Update ticket info | ✅ | ✅ | ❌ | ✅ (limited) |
| Assign technician | ✅ | ✅ | ❌ | ❌ |
| Change status | ✅ | ✅ | ❌ | ❌ |
| Switch template | ✅ | ✅ (audit) | ❌ | ❌ |
| Delete ticket | ✅ | ❌ | ❌ | ❌ |
| **Tasks** |
| View all tasks | ✅ | ✅ | ❌ | ❌ |
| View my tasks | ✅ | ✅ | ✅ | ❌ |
| Update task | ✅ | ✅ | ✅ (own) | ❌ |
| Assign task | ✅ | ✅ | ❌ | ❌ |
| **Customers** |
| View all | ✅ | ✅ | ❌ | ✅ |
| View assigned | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ❌ | ✅ |
| Update | ✅ | ✅ | ❌ | ✅ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Products/Parts** |
| View catalog | ✅ | ✅ | ✅ | ✅ |
| Create/Update | ✅ | ✅ | ❌ | ❌ |
| Update pricing | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Task Templates** |
| View | ✅ | ✅ | ❌ | ❌ |
| Create | ✅ | ✅ | ❌ | ❌ |
| Update | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Warehouse** |
| View stock | ✅ | ✅ | ✅ (RO) | ❌ |
| Stock movements | ✅ | ✅ | ❌ | ❌ |
| RMA operations | ✅ | ✅ | ❌ | ❌ |
| Serial verification | ✅ | ✅ | ✅ | ❌ |
| **Team** |
| View team | ✅ | ✅ | ❌ | ❌ |
| Create user | ✅ | ❌ | ❌ | ❌ |
| Update user | ✅ | ❌ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ | ❌ |
| Assign workload | ✅ | ✅ | ❌ | ❌ |
| **Reports** |
| View all reports | ✅ | ✅ | ❌ | ❌ |
| Export data | ✅ | ✅ | ❌ | ❌ |
| **System** |
| System settings | ✅ | ❌ | ❌ | ❌ |
| Email config | ✅ | ✅ | ❌ | ❌ |
| Audit logs | ✅ | ❌ | ❌ | ❌ |
| Backup/Restore | ✅ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full access
- ✅ (limited) Restricted access with conditions
- ✅ (audit) Allowed but logged with reason
- ✅ (RO) Read-only access
- ❌ No access

---

## Feature-Level Permissions

### Tickets - Detailed Breakdown

#### View Permissions
```typescript
type TicketViewScope =
  | 'all'              // Admin, Manager, Reception
  | 'assigned_to_me'   // Technician
  | 'none'             // (not applicable)

const ticketViewRules = {
  admin: 'all',
  manager: 'all',
  technician: 'assigned_to_me',
  reception: 'all'
}
```

#### Update Permissions
```typescript
interface TicketUpdatePermissions {
  customer_info: boolean;
  device_info: boolean;
  assign_technician: boolean;
  change_priority: boolean;
  change_status: boolean;
  switch_template: boolean;
  update_pricing: boolean;
  add_comments: boolean;
}

const ticketUpdateRules: Record<Role, TicketUpdatePermissions> = {
  admin: { /* all true */ },
  manager: {
    customer_info: true,
    device_info: true,
    assign_technician: true,
    change_priority: true,
    change_status: true,
    switch_template: true, // with audit
    update_pricing: true,
    add_comments: true
  },
  technician: {
    customer_info: false,
    device_info: false,
    assign_technician: false,
    change_priority: false,
    change_status: false,
    switch_template: false,
    update_pricing: false,
    add_comments: true // only to assigned tickets
  },
  reception: {
    customer_info: true,
    device_info: true,
    assign_technician: false,
    change_priority: false,
    change_status: false,
    switch_template: false,
    update_pricing: false,
    add_comments: true
  }
}
```

### Warehouse - Detailed Breakdown

#### Stock Movement Permissions
```typescript
interface StockMovementPermissions {
  view_all: boolean;
  create_intake: boolean;
  create_outgoing: boolean;
  create_transfer: boolean;
  approve_high_value: boolean; // >10 units or expensive items
  delete: boolean;
}

const warehouseRules: Record<Role, StockMovementPermissions> = {
  admin: { /* all true */ },
  manager: {
    view_all: true,
    create_intake: true,
    create_outgoing: true,
    create_transfer: true,
    approve_high_value: true,
    delete: false
  },
  technician: {
    view_all: true, // read-only
    create_intake: false,
    create_outgoing: false,
    create_transfer: false,
    approve_high_value: false,
    delete: false
  },
  reception: { /* all false */ }
}
```

---

## Security Requirements

### 1. Authentication
- ✅ All users must authenticate via Supabase Auth
- ✅ Session timeout: 24 hours (configurable)
- ✅ Password requirements:
  - Admin: Strong (12+ chars, mixed case, numbers, symbols)
  - Others: Medium (8+ chars, letters + numbers)
- ✅ Force password change on first login (except Admin)
- ✅ MFA recommended for Admin and Manager

### 2. Authorization

#### Database Level (RLS - Row Level Security)
```sql
-- Example: Technicians can only view assigned tickets
CREATE POLICY "technicians_view_assigned_tickets"
  ON service_tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT tt.assigned_to
      FROM service_ticket_tasks tt
      WHERE tt.ticket_id = service_tickets.id
    )
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'reception')
  );
```

#### API Level (tRPC Middleware)
```typescript
const requireRole = (roles: Role[]) => {
  return middleware(async ({ ctx, next }) => {
    const profile = await getProfile(ctx.user.id);
    if (!roles.includes(profile.role)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next();
  });
};
```

#### UI Level (Route Guards)
```typescript
// Redirect unauthorized users
const ProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const { data: profile } = useProfile();
  const router = useRouter();

  if (profile && !allowedRoles.includes(profile.role)) {
    router.push('/unauthorized');
  }

  return <Outlet />;
};
```

### 3. Audit Trail

#### Events to Log
- ✅ **Authentication:** Login, logout, failed attempts
- ✅ **User Management:** User created, role changed, user deleted
- ✅ **Critical Operations:**
  - Template switched (who, when, from/to, reason)
  - Stock movements >10 units
  - RMA batch created/sent
  - High-value ticket updates (>5M VNĐ)
- ✅ **Data Changes:** Ticket status changes, pricing updates

#### Log Structure
```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  user_id: string;
  user_role: Role;
  action: string;
  resource_type: 'ticket' | 'user' | 'stock' | 'template';
  resource_id: string;
  changes: Record<string, { old: any; new: any }>;
  reason?: string; // Required for sensitive operations
  ip_address: string;
}
```

### 4. Data Privacy

#### Field-Level Access Control
```typescript
// Hide financial data from Technicians
const ticketSanitizer = {
  technician: (ticket: Ticket) => omit(ticket, [
    'service_fee',
    'diagnosis_fee',
    'total_cost',
    'discount_amount'
  ])
};
```

#### Customer Data Protection
- ✅ Phone numbers masked in public portal (0901***567)
- ✅ Email partially masked (nguy***@gmail.com)
- ✅ Technicians cannot export customer lists
- ✅ GDPR-compliant: Customers can request data deletion

---

## Business Rules

### 1. Automatic Assignment
```typescript
// Reception creates ticket → Auto-assign to least busy technician
const autoAssignTechnician = async (ticketId: string) => {
  const techs = await getTechnicians();
  const workload = await getWorkloadPerTech(techs);
  const leastBusy = workload.sort((a, b) => a.tasks - b.tasks)[0];

  await assignTicket(ticketId, leastBusy.id);
  await notifyTechnician(leastBusy.id, ticketId);
};
```

### 2. Escalation Rules
- ⏰ Ticket > 3 days without progress → Notify Manager
- ⏰ Ticket > 5 days in "in_progress" → Manager review required
- 🔔 Customer complaint → Auto-escalate to Manager
- 🔔 High-value ticket (>10M VNĐ) → Manager must approve before closing

### 3. Approval Workflows

#### High-Value Repairs
```typescript
if (ticket.total_cost > 5_000_000) {
  ticket.status = 'pending_approval';
  await notifyManager('Approval needed for high-value repair');
  // Technician cannot proceed until Manager approves
}
```

#### RMA Batches
```typescript
const createRMABatch = async (productIds: string[]) => {
  const batch = await db.rmaBatch.create({ status: 'draft' });
  await notifyManager('RMA batch created, review required');
  // Manager must review and approve before sending to vendor
};
```

### 4. Manager Override
```typescript
// Manager can reassign task even if technician has started
const reassignTask = async (taskId: string, newTechId: string) => {
  requireRole(['manager', 'admin']);

  await db.task.update({
    where: { id: taskId },
    data: {
      assigned_to: newTechId,
      reassigned_at: new Date(),
      reassigned_by: currentUser.id,
      reassignment_reason: 'Workload balancing'
    }
  });

  await logAudit('task_reassigned', taskId);
};
```

---

## Implementation Notes

### Phase 1: Database (Week 1)
1. ✅ Add `role` column to `profiles` table
2. ✅ Create RLS policies for all tables
3. ✅ Create `audit_logs` table
4. ✅ Create database functions for role checks
5. ✅ Test RLS policies with different roles

### Phase 2: Backend (Week 2)
1. ✅ Create role middleware for tRPC
2. ✅ Update all tRPC procedures with role checks
3. ✅ Implement audit logging
4. ✅ Create role-based query filters
5. ✅ Write unit tests for authorization

### Phase 3: Frontend (Week 3)
1. ✅ Create route guards
2. ✅ Implement role-based UI hiding
3. ✅ Create unauthorized page
4. ✅ Update navigation based on role
5. ✅ Add role indicators in UI

### Phase 4: Testing (Week 4)
1. ✅ E2E tests for each role
2. ✅ Permission escalation tests
3. ✅ Negative tests (forbidden actions)
4. ✅ Audit log verification
5. ✅ Performance testing with RLS

### Migration Strategy
```sql
-- Step 1: Add role column (nullable first)
ALTER TABLE profiles ADD COLUMN role TEXT;

-- Step 2: Set default role for existing users
UPDATE profiles SET role = 'reception'; -- or appropriate default

-- Step 3: Make role required
ALTER TABLE profiles
  ALTER COLUMN role SET NOT NULL,
  ADD CONSTRAINT check_role CHECK (role IN ('admin', 'manager', 'technician', 'reception'));

-- Step 4: Create RLS policies (see IMPLEMENTATION-GUIDE-ROLES.md)
```

---

## Appendix

### A. Default User Setup

```bash
# Admin (via /setup endpoint)
Email: admin@tantran.dev
Password: (from .env)
Role: admin

# Manager (create via Admin panel)
Email: manager@example.com
Password: manager123 (force change on first login)
Role: manager

# Technician (create via Admin panel)
Email: tech1@example.com
Password: tech123 (force change on first login)
Role: technician

# Reception (create via Admin panel)
Email: reception@example.com
Password: reception123 (force change on first login)
Role: reception
```

### B. Common Scenarios

#### Scenario 1: New Employee Onboarding
1. Admin creates user account with appropriate role
2. User receives email with temp password
3. User logs in → Forced password change
4. User completes role-specific training
5. Manager assigns initial tasks (for Technician)

#### Scenario 2: Employee Role Change
1. Manager requests role change to Admin
2. Admin updates user role in system
3. User session invalidated → Must re-login
4. New permissions take effect immediately
5. Audit log records role change

#### Scenario 3: Emergency Override
1. All technicians offline/sick
2. Manager can temporarily handle tasks
3. System logs Manager performing Technician actions
4. Report generated for compliance review

### C. Testing Checklist

- [ ] Admin can create all user types
- [ ] Manager cannot delete users
- [ ] Technician cannot view all tickets
- [ ] Reception cannot assign tasks
- [ ] Template switch creates audit log
- [ ] RLS blocks unauthorized queries
- [ ] API returns 403 for forbidden actions
- [ ] UI hides forbidden features
- [ ] Audit logs capture all sensitive operations
- [ ] Session timeout works correctly

---

**Document Version:** 1.0
**Last Updated:** 2025-10-25
**Next Review:** After Phase 1 implementation
**Owner:** Development Team
**Approved By:** Product Owner
