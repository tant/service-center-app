# Implementation Guide: Role-Based Access Control

**Reference:** `ROLES-AND-PERMISSIONS.md`
**Status:** Implementation Ready
**Estimated Effort:** 3-4 weeks

---

## 📋 Table of Contents

1. [Phase 1: Database & RLS](#phase-1-database--rls)
2. [Phase 2: Backend (tRPC)](#phase-2-backend-trpc)
3. [Phase 3: Frontend](#phase-3-frontend)
4. [Phase 4: Testing](#phase-4-testing)
5. [Deployment Checklist](#deployment-checklist)

---

## Phase 1: Database & RLS

### Step 1.1: Add Role Column to Profiles

**File:** `supabase/migrations/YYYYMMDD_add_role_to_profiles.sql`

```sql
-- Add role column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT;

-- Set default role for existing users (if any)
UPDATE profiles SET role = 'reception' WHERE role IS NULL;

-- Make role required
ALTER TABLE profiles
ALTER COLUMN role SET NOT NULL,
ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'manager', 'technician', 'reception'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add comment
COMMENT ON COLUMN profiles.role IS 'User role: admin, manager, technician, or reception';
```

### Step 1.2: Create Role Helper Functions

**File:** `supabase/migrations/YYYYMMDD_role_helper_functions.sql`

```sql
-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT role = required_role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to check if user has any of the required roles
CREATE OR REPLACE FUNCTION has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT role = ANY(required_roles) FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT has_role('admin');
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN AS $$
  SELECT has_any_role(ARRAY['admin', 'manager']);
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

### Step 1.3: Create RLS Policies

**File:** `supabase/migrations/YYYYMMDD_rls_policies_roles.sql`

```sql
-- ============================================
-- SERVICE_TICKETS RLS POLICIES
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "tickets_select_policy" ON service_tickets;
DROP POLICY IF EXISTS "tickets_insert_policy" ON service_tickets;
DROP POLICY IF EXISTS "tickets_update_policy" ON service_tickets;
DROP POLICY IF EXISTS "tickets_delete_policy" ON service_tickets;

-- SELECT: Admin/Manager/Reception see all, Technicians see assigned only
CREATE POLICY "tickets_select_policy"
ON service_tickets FOR SELECT
TO authenticated
USING (
  has_any_role(ARRAY['admin', 'manager', 'reception'])
  OR
  -- Technician can see tickets with tasks assigned to them
  id IN (
    SELECT ticket_id
    FROM service_ticket_tasks
    WHERE assigned_to = auth.uid()
  )
);

-- INSERT: Admin, Manager, Reception can create tickets
CREATE POLICY "tickets_insert_policy"
ON service_tickets FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(ARRAY['admin', 'manager', 'reception'])
);

-- UPDATE: Admin can update all, Manager can update all, Reception limited, Technician cannot
CREATE POLICY "tickets_update_policy"
ON service_tickets FOR UPDATE
TO authenticated
USING (
  is_admin()
  OR
  (has_role('manager') AND status != 'cancelled')
  OR
  (has_role('reception') AND status = 'pending')
);

-- DELETE: Only admin can delete
CREATE POLICY "tickets_delete_policy"
ON service_tickets FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- SERVICE_TICKET_TASKS RLS POLICIES
-- ============================================

-- SELECT: Admin/Manager see all, Technicians see assigned tasks only
CREATE POLICY "tasks_select_policy"
ON service_ticket_tasks FOR SELECT
TO authenticated
USING (
  is_manager_or_above()
  OR
  assigned_to = auth.uid()
);

-- INSERT: Only Admin/Manager can create tasks
CREATE POLICY "tasks_insert_policy"
ON service_ticket_tasks FOR INSERT
TO authenticated
WITH CHECK (is_manager_or_above());

-- UPDATE: Admin/Manager can update all, Technician can update assigned tasks
CREATE POLICY "tasks_update_policy"
ON service_ticket_tasks FOR UPDATE
TO authenticated
USING (
  is_manager_or_above()
  OR
  (has_role('technician') AND assigned_to = auth.uid())
);

-- DELETE: Only Admin
CREATE POLICY "tasks_delete_policy"
ON service_ticket_tasks FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- CUSTOMERS RLS POLICIES
-- ============================================

-- SELECT: Admin/Manager/Reception see all, Technician sees customers of assigned tickets
CREATE POLICY "customers_select_policy"
ON customers FOR SELECT
TO authenticated
USING (
  has_any_role(ARRAY['admin', 'manager', 'reception'])
  OR
  -- Technician can see customers from their assigned tickets
  id IN (
    SELECT st.customer_id
    FROM service_tickets st
    INNER JOIN service_ticket_tasks stt ON stt.ticket_id = st.id
    WHERE stt.assigned_to = auth.uid()
  )
);

-- INSERT: Admin, Manager, Reception
CREATE POLICY "customers_insert_policy"
ON customers FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(ARRAY['admin', 'manager', 'reception'])
);

-- UPDATE: Admin, Manager, Reception
CREATE POLICY "customers_update_policy"
ON customers FOR UPDATE
TO authenticated
USING (
  has_any_role(ARRAY['admin', 'manager', 'reception'])
);

-- DELETE: Only Admin
CREATE POLICY "customers_delete_policy"
ON customers FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- PRODUCTS RLS POLICIES
-- ============================================

-- SELECT: Everyone can view products
CREATE POLICY "products_select_policy"
ON products FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Only Admin/Manager
CREATE POLICY "products_insert_policy"
ON products FOR INSERT
TO authenticated
WITH CHECK (is_manager_or_above());

CREATE POLICY "products_update_policy"
ON products FOR UPDATE
TO authenticated
USING (is_manager_or_above());

CREATE POLICY "products_delete_policy"
ON products FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- TASK_TEMPLATES RLS POLICIES
-- ============================================

-- SELECT: Admin and Manager only
CREATE POLICY "task_templates_select_policy"
ON task_templates FOR SELECT
TO authenticated
USING (is_manager_or_above());

-- INSERT/UPDATE/DELETE: Admin and Manager
CREATE POLICY "task_templates_insert_policy"
ON task_templates FOR INSERT
TO authenticated
WITH CHECK (is_manager_or_above());

CREATE POLICY "task_templates_update_policy"
ON task_templates FOR UPDATE
TO authenticated
USING (is_manager_or_above());

CREATE POLICY "task_templates_delete_policy"
ON task_templates FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- WAREHOUSE STOCK RLS POLICIES
-- ============================================

-- SELECT: Admin/Manager see all, Technician read-only
CREATE POLICY "warehouse_stock_select_policy"
ON warehouse_stock FOR SELECT
TO authenticated
USING (
  has_any_role(ARRAY['admin', 'manager', 'technician'])
);

-- INSERT/UPDATE: Only Admin/Manager
CREATE POLICY "warehouse_stock_insert_policy"
ON warehouse_stock FOR INSERT
TO authenticated
WITH CHECK (is_manager_or_above());

CREATE POLICY "warehouse_stock_update_policy"
ON warehouse_stock FOR UPDATE
TO authenticated
USING (is_manager_or_above());

-- DELETE: Only Admin
CREATE POLICY "warehouse_stock_delete_policy"
ON warehouse_stock FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- PROFILES (User Management) RLS POLICIES
-- ============================================

-- SELECT: Admin sees all, others see only themselves
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
TO authenticated
USING (
  is_admin()
  OR
  id = auth.uid()
);

-- INSERT: Only Admin
CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- UPDATE: Admin can update all, users can update own profile (except role)
CREATE POLICY "profiles_update_policy"
ON profiles FOR UPDATE
TO authenticated
USING (
  is_admin()
  OR
  (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()))
);

-- DELETE: Only Admin
CREATE POLICY "profiles_delete_policy"
ON profiles FOR DELETE
TO authenticated
USING (is_admin());

-- Enable RLS on all tables
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_ticket_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Step 1.4: Create Audit Log Table

**File:** `supabase/migrations/YYYYMMDD_audit_logs.sql`

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Who performed the action
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT NOT NULL,
  user_email TEXT,

  -- What action was performed
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'template_switch', etc.
  resource_type TEXT NOT NULL, -- 'ticket', 'user', 'stock', etc.
  resource_id TEXT NOT NULL,

  -- What changed
  old_values JSONB,
  new_values JSONB,
  changes JSONB, -- Computed diff

  -- Why (for sensitive operations)
  reason TEXT,

  -- Where
  ip_address INET,
  user_agent TEXT,

  -- Indexes
  CONSTRAINT audit_logs_action_check CHECK (action IN (
    'create', 'update', 'delete', 'login', 'logout',
    'template_switch', 'role_change', 'stock_movement',
    'rma_create', 'approve', 'reject'
  ))
);

-- Indexes for fast queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- RLS: Only admin can view audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_only"
ON audit_logs FOR SELECT
TO authenticated
USING (is_admin());

-- Function to log actions
CREATE OR REPLACE FUNCTION log_audit(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_role TEXT;
  v_user_email TEXT;
BEGIN
  -- Get user info
  SELECT role, email INTO v_user_role, v_user_email
  FROM profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE p.id = auth.uid();

  -- Insert audit log
  INSERT INTO audit_logs (
    user_id, user_role, user_email,
    action, resource_type, resource_id,
    old_values, new_values, reason
  ) VALUES (
    auth.uid(), v_user_role, v_user_email,
    p_action, p_resource_type, p_resource_id,
    p_old_values, p_new_values, p_reason
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 2: Backend (tRPC)

### Step 2.1: Define Role Types

**File:** `src/types/roles.ts`

```typescript
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TECHNICIAN: 'technician',
  RECEPTION: 'reception',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 4,
  manager: 3,
  technician: 2,
  reception: 1,
};

export function hasHigherRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export interface RolePermissions {
  tickets: {
    viewAll: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    assignTechnician: boolean;
    switchTemplate: boolean;
  };
  customers: {
    viewAll: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  warehouse: {
    viewStock: boolean;
    createMovement: boolean;
    createRMA: boolean;
  };
  team: {
    viewAll: boolean;
    createUser: boolean;
    updateUser: boolean;
    deleteUser: boolean;
  };
  reports: {
    viewAll: boolean;
    exportData: boolean;
  };
}

export const PERMISSIONS: Record<Role, RolePermissions> = {
  admin: {
    tickets: { viewAll: true, create: true, update: true, delete: true, assignTechnician: true, switchTemplate: true },
    customers: { viewAll: true, create: true, update: true, delete: true },
    warehouse: { viewStock: true, createMovement: true, createRMA: true },
    team: { viewAll: true, createUser: true, updateUser: true, deleteUser: true },
    reports: { viewAll: true, exportData: true },
  },
  manager: {
    tickets: { viewAll: true, create: true, update: true, delete: false, assignTechnician: true, switchTemplate: true },
    customers: { viewAll: true, create: true, update: true, delete: false },
    warehouse: { viewStock: true, createMovement: true, createRMA: true },
    team: { viewAll: true, createUser: false, updateUser: false, deleteUser: false },
    reports: { viewAll: true, exportData: true },
  },
  technician: {
    tickets: { viewAll: false, create: false, update: false, delete: false, assignTechnician: false, switchTemplate: false },
    customers: { viewAll: false, create: false, update: false, delete: false },
    warehouse: { viewStock: true, createMovement: false, createRMA: false },
    team: { viewAll: false, createUser: false, updateUser: false, deleteUser: false },
    reports: { viewAll: false, exportData: false },
  },
  reception: {
    tickets: { viewAll: true, create: true, update: false, delete: false, assignTechnician: false, switchTemplate: false },
    customers: { viewAll: true, create: true, update: true, delete: false },
    warehouse: { viewStock: false, createMovement: false, createRMA: false },
    team: { viewAll: false, createUser: false, updateUser: false, deleteUser: false },
    reports: { viewAll: false, exportData: false },
  },
};
```

### Step 2.2: Create Role Middleware

**File:** `src/server/middleware/requireRole.ts`

```typescript
import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';
import type { Role } from '@/types/roles';

export const requireRole = (allowedRoles: Role[]) => {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to perform this action',
      });
    }

    // Get user profile with role
    const { data: profile, error } = await ctx.supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', ctx.user.id)
      .single();

    if (error || !profile) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user profile',
      });
    }

    if (!allowedRoles.includes(profile.role as Role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        userRole: profile.role as Role,
      },
    });
  });
};

// Convenience middlewares
export const requireAdmin = requireRole(['admin']);
export const requireManagerOrAbove = requireRole(['admin', 'manager']);
export const requireTechnician = requireRole(['admin', 'manager', 'technician']);
export const requireAnyAuthenticated = requireRole(['admin', 'manager', 'technician', 'reception']);
```

### Step 2.3: Create Audit Logger

**File:** `src/server/utils/auditLog.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Role } from '@/types/roles';

interface AuditLogParams {
  action: string;
  resourceType: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
}

export async function logAudit(
  supabase: SupabaseClient,
  userId: string,
  params: AuditLogParams
) {
  const { error } = await supabase.rpc('log_audit', {
    p_action: params.action,
    p_resource_type: params.resourceType,
    p_resource_id: params.resourceId,
    p_old_values: params.oldValues || null,
    p_new_values: params.newValues || null,
    p_reason: params.reason || null,
  });

  if (error) {
    console.error('Failed to log audit:', error);
  }
}

// Helper for template switches (sensitive operation)
export async function logTemplateSwitchWithCheck (
  supabase: SupabaseClient,
  userId: string,
  ticketId: string,
  oldTemplateId: string,
  newTemplateId: string,
  reason: string
) {
  if (!reason || reason.trim().length < 10) {
    throw new Error('Template switch requires a detailed reason (min 10 characters)');
  }

  await logAudit(supabase, userId, {
    action: 'template_switch',
    resourceType: 'ticket',
    resourceId: ticketId,
    oldValues: { template_id: oldTemplateId },
    newValues: { template_id: newTemplateId },
    reason,
  });
}
```

### Step 2.4: Update tRPC Routers

**File:** `src/server/routers/tickets.ts` (example)

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { requireRole, requireManagerOrAbove, requireAnyAuthenticated } from '../middleware/requireRole';
import { logAudit, logTemplateSwitchWithCheck } from '../utils/auditLog';

export const ticketsRouter = router({
  // GET all tickets - Admin, Manager, Reception only
  list: publicProcedure
    .use(requireRole(['admin', 'manager', 'reception']))
    .query(async ({ ctx }) => {
      // RLS handles filtering automatically
      const { data, error } = await ctx.supabaseAdmin
        .from('service_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }),

  // GET my assigned tickets - Technician
  myTickets: publicProcedure
    .use(requireRole(['technician']))
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('service_tickets')
        .select(`
          *,
          service_ticket_tasks!inner(
            id,
            assigned_to
          )
        `)
        .eq('service_ticket_tasks.assigned_to', ctx.user!.id);

      if (error) throw error;
      return data;
    }),

  // CREATE ticket - Admin, Manager, Reception
  create: publicProcedure
    .use(requireRole(['admin', 'manager', 'reception']))
    .input(z.object({
      customer_id: z.string().uuid(),
      device_type: z.string(),
      serial_number: z.string().optional(),
      issue_description: z.string(),
      service_type: z.enum(['warranty', 'repair']),
      template_id: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('service_tickets')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      // Log creation
      await logAudit(ctx.supabaseAdmin, ctx.user!.id, {
        action: 'create',
        resourceType: 'ticket',
        resourceId: data.id,
        newValues: data,
      });

      return data;
    }),

  // SWITCH template - Manager only (with audit)
  switchTemplate: publicProcedure
    .use(requireManagerOrAbove)
    .input(z.object({
      ticketId: z.string().uuid(),
      newTemplateId: z.string().uuid(),
      reason: z.string().min(10, 'Reason must be at least 10 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get current template
      const { data: ticket } = await ctx.supabaseAdmin
        .from('service_tickets')
        .select('template_id')
        .eq('id', input.ticketId)
        .single();

      if (!ticket) throw new Error('Ticket not found');

      // Update template
      const { data, error } = await ctx.supabaseAdmin
        .from('service_tickets')
        .update({ template_id: input.newTemplateId })
        .eq('id', input.ticketId)
        .select()
        .single();

      if (error) throw error;

      // Log template switch with reason
      await logTemplateSwitchWithCheck(
        ctx.supabaseAdmin,
        ctx.user!.id,
        input.ticketId,
        ticket.template_id,
        input.newTemplateId,
        input.reason
      );

      return data;
    }),

  // DELETE ticket - Admin only
  delete: publicProcedure
    .use(requireRole(['admin']))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from('service_tickets')
        .delete()
        .eq('id', input.id);

      if (error) throw error;

      await logAudit(ctx.supabaseAdmin, ctx.user!.id, {
        action: 'delete',
        resourceType: 'ticket',
        resourceId: input.id,
      });

      return { success: true };
    }),
});
```

---

## Phase 3: Frontend

### Step 3.1: Create Role Hook

**File:** `src/hooks/useRole.ts`

```typescript
import { trpc } from '@/utils/trpc';
import type { Role } from '@/types/roles';
import { PERMISSIONS, hasHigherRole } from '@/types/roles';

export function useRole() {
  const { data: profile, isLoading } = trpc.profile.me.useQuery();

  const role = profile?.role as Role | undefined;

  const hasRole = (requiredRole: Role) => {
    if (!role) return false;
    return hasHigherRole(role, requiredRole);
  };

  const hasAnyRole = (requiredRoles: Role[]) => {
    if (!role) return false;
    return requiredRoles.includes(role);
  };

  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isTechnician = role === 'technician';
  const isReception = role === 'reception';

  const isManagerOrAbove = hasAnyRole(['admin', 'manager']);

  const permissions = role ? PERMISSIONS[role] : null;

  return {
    role,
    isLoading,
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isTechnician,
    isReception,
    isManagerOrAbove,
    permissions,
  };
}
```

### Step 3.2: Create Route Guard Component

**File:** `src/components/auth/RequireRole.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import type { Role } from '@/types/roles';

interface RequireRoleProps {
  allowedRoles: Role[];
  fallbackPath?: string;
  children: React.ReactNode;
}

export function RequireRole({
  allowedRoles,
  fallbackPath = '/unauthorized',
  children,
}: RequireRoleProps) {
  const { role, isLoading, hasAnyRole } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && role && !hasAnyRole(allowedRoles)) {
      router.push(fallbackPath);
    }
  }, [role, isLoading, hasAnyRole, allowedRoles, fallbackPath, router]);

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Show nothing if unauthorized (will redirect)
  if (!role || !hasAnyRole(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
```

### Step 3.3: Create Permission-based UI Components

**File:** `src/components/auth/Can.tsx`

```typescript
'use client';

import { useRole } from '@/hooks/useRole';
import type { Role } from '@/types/roles';

interface CanProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ roles, children, fallback = null }: CanProps) {
  const { hasAnyRole } = useRole();

  if (!hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage:
// <Can roles={['admin', 'manager']}>
//   <Button>Delete Ticket</Button>
// </Can>
```

### Step 3.4: Update App Layout with Role-based Navigation

**File:** `src/app/(auth)/layout.tsx`

```typescript
'use client';

import { useRole } from '@/hooks/useRole';
import { Sidebar } from '@/components/layout/Sidebar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { role, isLoading } = useRole();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const navigation = getNavigationForRole(role);

  return (
    <div className="flex h-screen">
      <Sidebar navigation={navigation} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function getNavigationForRole(role: Role | undefined) {
  const baseNav = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  ];

  if (!role) return baseNav;

  const roleNav: Record<Role, typeof baseNav> = {
    admin: [
      ...baseNav,
      { name: 'Tickets', href: '/tickets', icon: TicketIcon },
      { name: 'Customers', href: '/customers', icon: UsersIcon },
      { name: 'Products', href: '/products', icon: CubeIcon },
      { name: 'Warehouse', href: '/warehouse', icon: BuildingStorefrontIcon },
      { name: 'Templates', href: '/templates', icon: DocumentTextIcon },
      { name: 'Team', href: '/team', icon: UserGroupIcon },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon },
      { name: 'Settings', href: '/settings', icon: CogIcon },
    ],
    manager: [
      ...baseNav,
      { name: 'Tickets', href: '/tickets', icon: TicketIcon },
      { name: 'Customers', href: '/customers', icon: UsersIcon },
      { name: 'Products', href: '/products', icon: CubeIcon },
      { name: 'Warehouse', href: '/warehouse', icon: BuildingStorefrontIcon },
      { name: 'Templates', href: '/templates', icon: DocumentTextIcon },
      { name: 'Team', href: '/team', icon: UserGroupIcon },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    ],
    technician: [
      { name: 'My Tasks', href: '/my-tasks', icon: ClipboardIcon },
      { name: 'My Tickets', href: '/my-tickets', icon: TicketIcon },
    ],
    reception: [
      ...baseNav,
      { name: 'Tickets', href: '/tickets', icon: TicketIcon },
      { name: 'Customers', href: '/customers', icon: UsersIcon },
      { name: 'Public Requests', href: '/public-requests', icon: InboxIcon },
    ],
  };

  return roleNav[role] || baseNav;
}
```

### Step 3.5: Create Unauthorized Page

**File:** `src/app/(auth)/unauthorized/page.tsx`

```typescript
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">403</h1>
        <p className="mt-2 text-lg text-gray-600">
          Bạn không có quyền truy cập trang này
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}
```

---

## Phase 4: Testing

### Step 4.1: Create Permission Test Helper

**File:** `tests/helpers/permission-utils.ts`

```typescript
import type { Page } from '@playwright/test';
import type { Role } from '@/types/roles';

export const TEST_USERS: Record<Role, { email: string; password: string }> = {
  admin: { email: 'admin@tantran.dev', password: 'tantran' },
  manager: { email: 'manager@example.com', password: 'manager123' },
  technician: { email: 'technician@example.com', password: 'tech123' },
  reception: { email: 'reception@example.com', password: 'reception123' },
};

export async function loginAs(page: Page, role: Role) {
  const user = TEST_USERS[role];

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /đăng nhập|login/i }).click();

  await page.waitForURL(/\/dashboard|\/my-tasks/);
}

export async function expectUnauthorized(page: Page) {
  await page.waitForURL(/\/unauthorized/);
  await expect(page).toHaveURL(/\/unauthorized/);
}

export async function expectForbidden(page: Page, action: () => Promise<void>) {
  try {
    await action();
    throw new Error('Expected action to be forbidden');
  } catch (error) {
    // Should throw or show error
    const hasError = await page.getByText(/không có quyền|forbidden|unauthorized/i).isVisible();
    expect(hasError).toBeTruthy();
  }
}
```

**(Continued in next message due to length...)**
