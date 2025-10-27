# 11. Audit Logging System

**Last Updated:** 2025-10-27
**Status:** ✅ Implemented

---

## Overview

The Service Center implements a comprehensive audit logging system to track all sensitive operations and maintain data integrity. All audit logs are **immutable** (no updates/deletes allowed) and stored in JSONB format for flexible querying.

---

## Architecture

### Database Schema

**Table:** `public.audit_logs`

```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- WHO performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT NOT NULL,
  user_email TEXT,

  -- WHAT action was performed
  action TEXT NOT NULL,           -- 'create', 'update', 'delete', etc.
  resource_type TEXT NOT NULL,    -- 'template', 'ticket', 'user', etc.
  resource_id TEXT NOT NULL,

  -- WHAT changed (structured data)
  old_values JSONB,               -- Snapshot before change
  new_values JSONB,               -- Snapshot after change
  changes JSONB,                  -- Computed diff

  -- WHY (required for sensitive operations)
  reason TEXT,

  -- WHERE (client information)
  ip_address INET,
  user_agent TEXT,

  -- Additional context
  metadata JSONB
);
```

**Key Features:**
- ✅ **Immutable:** No UPDATE or DELETE policies (only INSERT and SELECT)
- ✅ **Admin-Only Read:** Only admins can view audit logs via RLS
- ✅ **JSONB Snapshots:** Full before/after snapshots for complete history
- ✅ **Auto-Diff:** `changes` field computed automatically by trigger
- ✅ **GIN Indexes:** Fast JSONB queries on old_values, new_values, changes

---

## Supported Actions

### Template Operations (2025-10-27)

**Action:** `update`

Templates are updated in-place with active ticket validation. All changes are logged for audit trail.

**Fields Logged:**
```typescript
{
  action: 'update',
  resourceType: 'template',
  resourceId: 'template-uuid',
  oldValues: {
    name: 'Bảo hành VGA',
    description: '...',
    service_type: 'warranty',
    strict_sequence: true,
    tasks: [
      { task_type_id: '...', sequence_order: 1, is_required: true, ... },
      ...
    ]
  },
  newValues: {
    name: 'Bảo hành VGA (Updated)',
    description: '...',
    service_type: 'warranty',
    strict_sequence: false,
    tasks: [
      { task_type_id: '...', sequence_order: 1, is_required: true, ... },
      ...
    ]
  },
  metadata: {
    tasks_count_before: 5,
    tasks_count_after: 7
  }
}
```

**Action:** `delete`

Templates can be soft-deleted (mark inactive) or hard-deleted. Both operations are logged.

**Fields Logged:**
```typescript
{
  action: 'delete',
  resourceType: 'template',
  resourceId: 'template-uuid',
  oldValues: {
    name: 'Bảo hành VGA',
    service_type: 'warranty',
    is_active: true
  },
  metadata: {
    soft_delete: true  // or false for hard delete
  }
}
```

### Other Supported Actions

- `template_switch` - Dynamic template switching (Story 1.17)
- `role_change` - User role changes
- `stock_movement` - Inventory movements
- `rma_create`, `rma_send` - RMA batch operations
- `approve`, `reject` - High-value transaction approvals
- `assign`, `reassign` - Task assignments
- `status_change` - Status transitions
- `export_data` - Data exports

---

## TypeScript API

### Location

**Helper Functions:** `src/server/utils/auditLog.ts`

### Usage

#### Basic Logging

```typescript
import { logAudit } from '@/server/utils/auditLog';

await logAudit(supabaseAdmin, userId, {
  action: 'update',
  resourceType: 'template',
  resourceId: templateId,
  oldValues: { name: 'Old Name', ... },
  newValues: { name: 'New Name', ... },
  metadata: { tasks_count_before: 5, tasks_count_after: 7 }
});
```

#### Template Update Example

```typescript
// In workflow.ts template.update procedure
try {
  await logAudit(ctx.supabaseAdmin, user.id, {
    action: 'update',
    resourceType: 'template',
    resourceId: input.template_id,
    oldValues: {
      name: oldTemplate.name,
      description: oldTemplate.description,
      service_type: oldTemplate.service_type,
      strict_sequence: oldTemplate.strict_sequence,
      tasks: oldTemplate.tasks,
    },
    newValues: {
      name: updatedTemplate.name,
      description: updatedTemplate.description,
      service_type: updatedTemplate.service_type,
      strict_sequence: updatedTemplate.strict_sequence,
      tasks: input.tasks,
    },
    metadata: {
      tasks_count_before: oldTemplate.tasks?.length || 0,
      tasks_count_after: input.tasks.length,
    },
  });
} catch (auditError) {
  // Log error but don't fail the operation
  console.error('[AUDIT] Failed to log template update:', auditError);
}
```

#### Specialized Functions

**Template Switch (with reason validation):**
```typescript
import { logTemplateSwitchWithCheck } from '@/server/utils/auditLog';

await logTemplateSwitchWithCheck(
  supabaseAdmin,
  userId,
  ticketId,
  oldTemplateId,
  newTemplateId,
  'Customer requested warranty service instead of paid repair' // Min 10 chars
);
```

**Role Change:**
```typescript
import { logRoleChange } from '@/server/utils/auditLog';

await logRoleChange(
  supabaseAdmin,
  adminUserId,
  targetUserId,
  'technician',
  'manager',
  'Promotion for outstanding performance'
);
```

---

## Querying Audit Logs

### Admin Dashboard (Future)

Audit logs are currently accessible only via SQL. Future work: Admin dashboard for viewing audit logs.

### SQL Queries

**Recent template changes:**
```sql
SELECT
  created_at,
  user_email,
  action,
  old_values->>'name' as old_name,
  new_values->>'name' as new_name,
  metadata
FROM public.audit_logs
WHERE resource_type = 'template'
ORDER BY created_at DESC
LIMIT 50;
```

**All actions by a specific user:**
```sql
SELECT * FROM public.audit_logs
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

**Changes to specific resource:**
```sql
SELECT * FROM public.audit_logs
WHERE resource_type = 'template'
  AND resource_id = 'template-uuid'
ORDER BY created_at ASC;
```

**JSONB queries (find templates with name change):**
```sql
SELECT
  id,
  created_at,
  user_email,
  changes->'name' as name_change
FROM public.audit_logs
WHERE resource_type = 'template'
  AND changes ? 'name'
ORDER BY created_at DESC;
```

---

## Best Practices

### When to Log

**Always log:**
- ✅ Template updates/deletes
- ✅ Template switches (requires reason ≥10 chars)
- ✅ Role changes
- ✅ High-value transactions (>5M VND)
- ✅ RMA batch operations
- ✅ Data exports
- ✅ Status changes for critical resources

**Don't log:**
- ❌ Read operations (too noisy)
- ❌ Routine ticket updates (use ticket history instead)
- ❌ Low-value changes (e.g., fixing typos)

### Snapshot Guidelines

**Include full snapshot when:**
- Resource is small (<100KB)
- Full history is critical (templates, users)
- Rollback capability may be needed

**Include partial snapshot when:**
- Resource is large (>100KB)
- Only specific fields are sensitive
- Full snapshot would be wasteful

**Example - Full Snapshot (Template):**
```typescript
oldValues: {
  ...fullTemplate,
  tasks: [...allTasks]
}
```

**Example - Partial Snapshot (Ticket):**
```typescript
oldValues: {
  status: 'pending',
  assigned_to_id: 'old-user-id'
}
// Don't include entire ticket + comments + parts
```

### Error Handling

**Audit logging should never fail the operation:**

```typescript
try {
  await logAudit(...);
} catch (auditError) {
  // Log to console for debugging
  console.error('[AUDIT] Failed to log action:', auditError);
  // DON'T throw - continue with the operation
}
```

**Rationale:** User operations should succeed even if audit logging fails temporarily.

---

## Future Enhancements

### Planned Features

1. **Admin Audit Dashboard**
   - Browse audit logs with filters (date, user, action, resource)
   - Search JSONB fields
   - Export audit logs to CSV/Excel

2. **Rollback Capability**
   - Use `old_values` to restore previous state
   - Admin-only with confirmation
   - Limited to specific resource types (templates, users)

3. **Alerting**
   - Email alerts for sensitive operations
   - Slack notifications for admin actions
   - Real-time dashboard for live monitoring

4. **Retention Policy**
   - Auto-archive logs older than 2 years
   - Compressed JSONB storage for old logs
   - Configurable retention per resource type

---

## Related Documentation

- **Database Schema:** `docs/data/schemas/10_audit_logs.sql`
- **Implementation Guide:** `docs/detail-reqs/IMPLEMENTATION-GUIDE-ROLES.md` (Section 2.3)
- **Helper Functions:** `src/server/utils/auditLog.ts`
- **Security Overview:** `docs/architecture/10-security.md`

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-10-27 | 1.0 | Initial documentation - Template update/delete logging |
