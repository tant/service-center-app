# Coding Standards

**Version:** 1.0 (Phase 2)
**Last Updated:** 2025-10-23
**Status:** Active

---

## Table of Contents

1. [TypeScript Standards](#typescript-standards)
2. [React/Next.js Patterns](#reactnextjs-patterns)
3. [tRPC API Standards](#trpc-api-standards)
4. [Database Standards](#database-standards)
5. [Component Standards](#component-standards)
6. [Testing Standards](#testing-standards)
7. [Security Standards](#security-standards)

---

## TypeScript Standards

### Naming Conventions

**Components & Types:**
```typescript
// ✅ Correct
interface TaskTemplateFormProps {
  initialData?: TaskTemplate;
  onSuccess?: (data: TaskTemplate) => void;
}

// ❌ Incorrect
type TaskTemplateFormProps = {  // Use interface for props
  initialData?: TaskTemplate;
}
```

**Variables & Functions:**
```typescript
// ✅ Correct
const calculateWarrantyEndDate = (startDate: Date): Date => {
  // camelCase for functions and variables
}

// ❌ Incorrect
const CalculateWarrantyEndDate = () => {}  // Should be camelCase
```

**Files:**
```typescript
// ✅ Correct
task-template-form.tsx
use-workflow.ts
warehouse-stock-table.tsx

// ❌ Incorrect
TaskTemplateForm.tsx  // Should be kebab-case
useWorkflow.ts        // Should be kebab-case
```

**Database:**
```sql
-- ✅ Correct
CREATE TABLE task_templates (
  template_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ
);

-- ❌ Incorrect
CREATE TABLE TaskTemplates (  -- Should be snake_case
  templateId UUID            -- Should be snake_case
);
```

### Type Definitions

**Props: Use `interface`**
```typescript
// ✅ Correct
interface WarehouseFormProps {
  warehouse?: PhysicalWarehouse;
  onClose: () => void;
}

// ❌ Incorrect
type WarehouseFormProps = {  // Use interface for props
  warehouse?: PhysicalWarehouse;
}
```

**Other Types: Use `type`**
```typescript
// ✅ Correct
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
type WarehouseType = 'warranty_stock' | 'rma_staging' | 'dead_stock';

// ✅ Also correct
interface ServiceTicket {
  id: string;
  status: TaskStatus;
  // ...
}
```

### Type Safety

**Explicit Typing (No `any`):**
```typescript
// ✅ Correct
const fetchTasks = async (ticketId: string): Promise<ServiceTicketTask[]> => {
  const { data, error } = await supabase
    .from('service_ticket_tasks')
    .select('*')
    .eq('ticket_id', ticketId);

  if (error) throw error;
  return data;
}

// ❌ Incorrect
const fetchTasks = async (ticketId: any): Promise<any> => {  // Avoid any
  // ...
}
```

**Zod Validation:**
```typescript
// ✅ All tRPC inputs must have Zod schemas
const createTaskTemplateSchema = z.object({
  name: z.string().min(3),
  product_type: z.string().uuid(),
  service_type: z.enum(['warranty', 'paid', 'replacement']),
  enforce_sequence: z.boolean().default(true), // API uses enforce_sequence, mapped to strict_sequence in DB
});
```

---

## React/Next.js Patterns

### Server vs Client Components

**Server Components (Default):**
```typescript
// ✅ Default - No 'use client' directive
// app/(auth)/dashboard/page.tsx

import { createClient } from '@/utils/supabase/server';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data } = await supabase.from('service_tickets').select('*');

  return <div>{/* Render data */}</div>;
}
```

**Client Components (When Needed):**
```typescript
// ✅ Use 'use client' only for interactivity
'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';

export function TaskTemplateForm() {
  const [name, setName] = useState('');
  const mutation = trpc.workflow.createTemplate.useMutation();

  // Interactive form with state
}
```

**When to Use Client Components:**
- Forms with state management
- Interactive UI (modals, dropdowns)
- Browser APIs (localStorage, navigator)
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect)
- TanStack Query / tRPC hooks

### Component Structure

**Standard Component Template:**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';
import type { TaskTemplate } from '@/types/workflow';

// Interface for props
interface TaskTemplateFormProps {
  initialData?: TaskTemplate;
  onSuccess?: (data: TaskTemplate) => void;
  onCancel?: () => void;
}

// Main component
export function TaskTemplateForm({
  initialData,
  onSuccess,
  onCancel
}: TaskTemplateFormProps) {
  // 1. State declarations
  const [name, setName] = useState(initialData?.name ?? '');

  // 2. tRPC hooks
  const utils = trpc.useUtils();
  const mutation = trpc.workflow.createTemplate.useMutation({
    onSuccess: (data) => {
      toast.success('Template created');
      utils.workflow.listTemplates.invalidate();
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // 3. Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name });
  };

  // 4. JSX return
  return (
    <form onSubmit={handleSubmit}>
      {/* Component implementation */}
    </form>
  );
}
```

### No Prop Spreading

```typescript
// ❌ Incorrect
export function Button({ ...props }) {
  return <button {...props} />;
}

// ✅ Correct
interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button({ onClick, disabled, children }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{children}</button>;
}
```

---

## tRPC API Standards

### Router Structure

```typescript
// src/server/routers/workflow.ts

import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// Input schemas at top
const createTemplateSchema = z.object({
  name: z.string().min(3),
  product_type: z.string().uuid(),
  service_type: z.enum(['warranty', 'paid', 'replacement']),
});

export const workflowRouter = router({
  // List procedure
  listTemplates: publicProcedure
    .query(async ({ ctx }) => {
      // 1. Auth check
      if (!ctx.user || !['admin', 'manager'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // 2. Database query with supabaseAdmin
      const { data, error } = await ctx.supabaseAdmin
        .from('task_templates')
        .select('*')
        .order('created_at', { ascending: false });

      // 3. Error handling
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        });
      }

      // 4. Return data
      return data;
    }),

  // Create procedure
  createTemplate: publicProcedure
    .input(createTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      // Always check auth
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const { data, error } = await ctx.supabaseAdmin
        .from('task_templates')
        .insert({
          ...input,
          created_by_id: ctx.user.id  // Always use ctx.user.id
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data;
    }),
});
```

### CRITICAL: Service Role Security

**❗ ARCHITECTURAL CONSTRAINT: tRPC uses `supabaseAdmin` which bypasses ALL RLS policies**

```typescript
// ❌ SECURITY VULNERABILITY
export const workflow Router = router({
  updateTask: publicProcedure
    .input(z.object({ taskId: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Missing auth check - ANY user can update ANY task!
      const { data } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .update({ status: input.status })
        .eq('id', input.taskId);

      return data;
    })
});

// ✅ SECURE
export const workflowRouter = router({
  updateTask: publicProcedure
    .input(z.object({ taskId: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify authentication
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // 2. Verify authorization (role check)
      if (!['admin', 'manager', 'technician'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // 3. Verify ownership or permissions
      const { data: task } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .select('assigned_to_id')
        .eq('id', input.taskId)
        .single();

      if (task.assigned_to_id !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not assigned to you' });
      }

      // 4. Perform update
      const { data } = await ctx.supabaseAdmin
        .from('service_ticket_tasks')
        .update({ status: input.status })
        .eq('id', input.taskId)
        .select()
        .single();

      return data;
    })
});
```

**Every tRPC Procedure Must:**
1. ✅ Check `ctx.user` for authentication
2. ✅ Check `ctx.user.role` for authorization
3. ✅ Use `ctx.user.id` (never trust client-provided user_id)
4. ✅ Verify ownership or permissions before modifications

---

## Database Standards

### Schema Dependency Order (CRITICAL)

```bash
# MUST follow this order:
1. 00_base_types.sql       # ENUMs first
2. 00_base_functions.sql   # Helper functions second
3. core_*.sql              # Tables in FK dependency order
4. functions_*.sql         # Triggers and views last
```

### Migration Workflow

```bash
# 1. Create schema in docs/data/schemas/
vim docs/data/schemas/13_task_tables.sql

# 2. Copy to supabase/schemas/
./docs/data/schemas/setup_schema.sh

# 3. Generate migration
pnpx supabase db diff -f phase2_foundation

# 4. Review migration
cat supabase/migrations/YYYYMMDDHHMMSS_phase2_foundation.sql

# 5. Apply migration
pnpx supabase migration up

# 6. Generate TypeScript types
pnpx supabase gen types typescript --local > src/types/database.types.ts
```

### Field Mapping (DB ↔ API)

**Convention:** When database field names differ from API field names, map them in tRPC procedures.

**Example:** `task_templates.strict_sequence` (DB) ↔ `enforce_sequence` (API)

```typescript
// ✅ Correct - Map fields in tRPC procedures
// CREATE procedure
const { tasks, enforce_sequence, ...templateData } = input;
const { data: template } = await ctx.supabaseAdmin
  .from('task_templates')
  .insert({
    ...templateData,
    strict_sequence: enforce_sequence, // Map API → DB
    created_by_id: profile.id,
  });

// Helper function for responses
function mapTemplateFromDb(template: any) {
  const { strict_sequence, ...rest } = template;
  return { ...rest, enforce_sequence: strict_sequence }; // Map DB → API
}

// LIST procedure
const { data } = await ctx.supabaseAdmin.from('task_templates').select('*');
return mapTemplatesFromDb(data); // Always map before returning

// ❌ Incorrect - Don't expose DB field names in API
return { ...template, strict_sequence: true }; // Client expects enforce_sequence
```

**Why?**
- Database schemas may use legacy or different naming conventions
- API provides a consistent interface regardless of DB changes
- Enables gradual schema migrations without breaking clients

### RLS Policy Pattern

```sql
-- Use existing auth.check_role() helper
CREATE POLICY "task_templates_read" ON public.task_templates
  FOR SELECT
  USING (
    auth.check_role('admin') OR
    auth.check_role('manager') OR
    auth.check_role('technician')
  );

CREATE POLICY "task_templates_write" ON public.task_templates
  FOR INSERT
  USING (auth.check_role('admin'));
```

### Idempotent Migrations

```sql
-- ✅ Correct - Safe to run multiple times
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'generate_tracking_token_trigger'
  ) THEN
    CREATE TRIGGER generate_tracking_token_trigger
      BEFORE INSERT ON service_requests
      FOR EACH ROW EXECUTE FUNCTION generate_tracking_token();
  END IF;
END $$;
```

---

## Component Standards

### Directory Organization (Phase 2)

```
src/components/
├── ui/                    # shadcn/ui base components
├── forms/                 # 🆕 Business forms
│   ├── task-template-form.tsx
│   └── warehouse-form.tsx
├── tables/                # 🆕 Data tables
│   ├── task-template-table.tsx
│   └── warehouse-stock-table.tsx
├── modals/                # 🆕 Modal dialogs
│   ├── template-editor-modal.tsx
│   └── stock-movement-modal.tsx
└── shared/                # 🆕 Shared business components
    ├── task-status-badge.tsx
    └── warehouse-type-badge.tsx
```

### Component Naming

```typescript
// ✅ Correct
export function TaskTemplateForm() {}      // PascalCase
export function TaskStatusBadge() {}       // Descriptive
export function WarehouseStockTable() {}   // Clear purpose

// ❌ Incorrect
export function Form() {}                  // Too generic
export function TTF() {}                   // Abbreviations
export function taskTemplateForm() {}      // Should be PascalCase
```

### shadcn/ui Usage

```typescript
// ✅ Always import from @/components/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ❌ Don't create custom versions
import { Button } from './my-button';  // Use shadcn/ui
```

---

## Testing Standards

### Current State
- ⚠️ No tests currently implemented
- ✅ Testing framework planned (Vitest + Playwright)
- ✅ Follow `docs/architecture/frontend-architecture-roadmap.md` when implementing

### Manual Testing Required
```typescript
// Integration Verification (IV) criteria in stories
// Example from Story 1.1:
// - IV1: Existing service_tickets queries run successfully
// - IV2: Creating new service ticket works without errors
// - IV3: Existing RLS policies remain functional
```

### Future Test Structure
```typescript
// Unit tests: src/hooks/use-workflow.test.ts
// Component tests: src/components/forms/task-template-form.test.tsx
// E2E tests: e2e/ticket-creation.spec.ts
```

---

## Security Standards

### Authentication Checks

```typescript
// ✅ All tRPC procedures must check auth
if (!ctx.user) {
  throw new TRPCError({ code: 'UNAUTHORIZED' });
}

// ✅ Check roles for authorization
if (!['admin', 'manager'].includes(ctx.user.role)) {
  throw new TRPCError({ code: 'FORBIDDEN' });
}

// ✅ Always use ctx.user.id
created_by_id: ctx.user.id

// ❌ Never trust client-provided user_id
user_id: input.userId  // Vulnerability!
```

### Public Endpoints

```typescript
// Public endpoints (no auth) require special care
export const serviceRequestRouter = router({
  // ✅ Public endpoint with rate limiting
  verifyWarranty: publicProcedure
    .input(z.object({ serial_number: z.string() }))
    .query(async ({ ctx, input }) => {
      // No ctx.user check - this is public

      // Rate limiting via Kong (configured separately)
      // Honeypot protection
      // Limited data exposure

      const { data } = await ctx.supabaseAdmin
        .from('physical_products')
        .select('serial_number, warranty_end_date')  // Limited fields
        .eq('serial_number', input.serial_number)
        .single();

      return {
        found: !!data,
        // Don't expose full product data
      };
    })
});
```

### Input Sanitization

```typescript
// ✅ Zod validation for all inputs
const schema = z.object({
  serial_number: z.string().min(5).regex(/^[A-Z0-9]+$/),
  email: z.string().email(),
  phone: z.string().min(10),
  description: z.string().min(20).max(1000),
});

// ✅ Vietnamese filename sanitization
const sanitizeFilename = (filename: string): string => {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
    .replace(/[^a-zA-Z0-9.-]/g, '_')  // Replace special chars
    .toLowerCase();
};
```

---

## Code Quality

### Build Verification

```bash
# ALWAYS run before marking story complete
pnpm build

# Check for TypeScript errors
pnpm tsc --noEmit

# Run linter
pnpm lint
```

### Documentation

```typescript
// ✅ JSDoc for complex functions
/**
 * Calculates warranty end date based on start date and duration.
 *
 * @param startDate - Warranty start date
 * @param warrantyMonths - Warranty duration in months
 * @returns Calculated warranty end date
 */
export function calculateWarrantyEndDate(
  startDate: Date,
  warrantyMonths: number
): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + warrantyMonths);
  return endDate;
}

// ✅ Inline comments for business logic
// Check if task sequence is strict mode
// Note: DB field is strict_sequence, API uses enforce_sequence
if (template.enforce_sequence) {
  // Block task completion if previous tasks incomplete
  const incompleteTasks = await checkPreviousTasks(taskId);
  if (incompleteTasks > 0) {
    throw new Error('Complete previous tasks first');
  }
}
```

---

## Common Pitfalls

### ❌ Don't Do This

```typescript
// Don't create Supabase clients manually in tRPC
const supabase = createClient();  // ❌ Use ctx.supabaseAdmin

// Don't use implicit any
const data: any = await fetch();  // ❌ Use explicit types

// Don't spread props
<Component {...props} />  // ❌ List props explicitly

// Don't trust client user_id
.eq('user_id', input.userId)  // ❌ Use ctx.user.id

// Don't modify completed tickets
if (ticket.status === 'completed') {
  // ❌ RLS prevents this
}

// Don't apply migrations out of order
11_phase2_tables.sql  // ❌ Must create 11_phase2_types.sql first
```

---

## Quick Reference

### Component Template
```typescript
'use client';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';

interface MyComponentProps {
  data?: MyData;
  onSuccess?: () => void;
}

export function MyComponent({ data, onSuccess }: MyComponentProps) {
  const [state, setState] = useState('');
  const mutation = trpc.router.procedure.useMutation({
    onSuccess: () => onSuccess?.(),
  });

  return <div>{/* JSX */}</div>;
}
```

### tRPC Procedure Template
```typescript
myProcedure: publicProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    // 1. Auth check
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    // 2. Authorization check
    if (!['admin'].includes(ctx.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    // 3. Database operation
    const { data, error } = await ctx.supabaseAdmin
      .from('table')
      .insert({ ...input, created_by: ctx.user.id });

    // 4. Error handling
    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

    // 5. Return
    return data;
  })
```

---

**Version:** 1.0
**Status:** Active for Phase 2 Development
**Last Updated:** 2025-10-23
