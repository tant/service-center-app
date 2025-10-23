# Frontend Specification - Service Center Application

**Version:** 2.0 (Phase 2 Upgrade)
**Date:** 2025-10-23
**Author:** Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State (Phase 1)](#current-state-phase-1)
3. [Phase 2 Upgrades](#phase-2-upgrades)
4. [Technology Stack](#technology-stack)
5. [Architecture](#architecture)
6. [Directory Structure](#directory-structure)
7. [Component Organization](#component-organization)
8. [State Management](#state-management)
9. [Routing](#routing)
10. [UI Components](#ui-components)
11. [Data Fetching](#data-fetching)
12. [Forms & Validation](#forms--validation)
13. [Styling](#styling)
14. [Migration Strategy](#migration-strategy)
15. [Development Guidelines](#development-guidelines)

---

## Executive Summary

This document specifies the frontend architecture for the Service Center application, covering:
- **Current State**: Phase 1 implementation (flat structure, basic CRUD)
- **Phase 2 Upgrade**: Organized architecture with 20 new features
- **Migration Path**: Incremental migration from flat to organized structure

### Key Changes in Phase 2
- ✅ Organized directory structure (types/, hooks/, constants/, components/)
- ✅ 20+ new components for workflow, warehouse, and public portal features
- ✅ Interface-based component props
- ✅ Enhanced state management with TanStack Query
- ✅ Public-facing routes (unauthenticated)
- ✅ Real-time updates (polling → optional WebSocket)

---

## Current State (Phase 1)

### Phase 1 Features

**Implemented Pages:**
1. **Authentication** (`/login`)
2. **Initial Setup** (`/setup`)
3. **Dashboard** (`/dashboard`)
   - Analytics overview
   - Recent tickets
   - Quick stats
4. **Tickets** (`/dashboard/tickets`)
   - List view with filters
   - Create ticket form
   - Ticket detail page
   - Status management
5. **Customers** (`/dashboard/customers`)
   - Customer list
   - Customer profile
   - CRUD operations
6. **Products** (`/dashboard/products`)
   - Product catalog
   - Product details
   - Brand management
7. **Parts** (`/dashboard/parts`)
   - Parts inventory
   - Stock adjustments
8. **Team** (`/dashboard/team`)
   - Staff management
   - Role assignment

### Current Tech Stack

```yaml
Framework: Next.js 15.5.4 (App Router)
Runtime: React 19.1.0
Language: TypeScript 5.x (strict mode)
Build Tool: Turbopack
Package Manager: pnpm
Port: 3025
```

### Current Directory Structure

```
src/
├── app/
│   ├── (auth)/                # Protected routes
│   │   └── dashboard/
│   │       ├── page.tsx       # Main dashboard
│   │       ├── tickets/
│   │       ├── customers/
│   │       ├── products/
│   │       ├── parts/
│   │       └── team/
│   ├── (public)/              # Public routes
│   │   ├── login/
│   │   └── setup/
│   └── api/
│       └── trpc/[...trpc]/
│
├── components/                 # 🚨 FLAT STRUCTURE (Legacy)
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ... (30+ components)
│   │
│   └── ... (business components mixed in flat structure)
│       ├── create-ticket-form.tsx
│       ├── customer-select.tsx
│       ├── ticket-status-badge.tsx
│       └── ... (scattered organization)
│
├── server/
│   ├── routers/
│   │   ├── _app.ts           # Main router
│   │   ├── admin.ts
│   │   ├── tickets.ts
│   │   ├── customers.ts
│   │   ├── products.ts
│   │   ├── parts.ts
│   │   └── brands.ts
│   └── trpc.ts
│
├── utils/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   └── trpc.ts
│
└── hooks/                      # ⚠️ Currently empty
```

### Current Component Examples

**Example 1: Ticket Status Badge** (Phase 1 - Flat)
```typescript
// src/components/ticket-status-badge.tsx
import { Badge } from '@/components/ui/badge';

type TicketStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const config = {
    pending: { label: 'Pending', variant: 'secondary' },
    in_progress: { label: 'In Progress', variant: 'default' },
    completed: { label: 'Completed', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'destructive' }
  };

  return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
}
```

### Current State Management

**tRPC Client Setup:**
```typescript
// src/utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
```

**Usage in Components:**
```typescript
'use client';

import { trpc } from '@/utils/trpc';

export function TicketList() {
  const { data: tickets, isLoading } = trpc.tickets.list.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {tickets?.map(ticket => (
        <div key={ticket.id}>{ticket.ticket_number}</div>
      ))}
    </div>
  );
}
```

### Current Styling Approach

```typescript
// Tailwind CSS 4 with shadcn/ui
import { cn } from '@/lib/utils';

<div className={cn(
  "rounded-lg border bg-card p-6",
  "hover:bg-accent transition-colors"
)}>
  Content
</div>
```

---

## Phase 2 Upgrades

### New Features Summary

**Phase 2 adds 7 major feature areas across 20 stories:**

1. **Task Workflow System** (Stories 1.1-1.5)
   - Task template management
   - Automatic task generation
   - Task execution UI
   - Task dependencies
   - Progress dashboard

2. **Warehouse Management** (Stories 1.6-1.10)
   - Physical/virtual warehouse hierarchy
   - Serial number tracking
   - Stock movements and audit trail
   - Low stock alerts
   - RMA batch operations

3. **Public Service Portal** (Stories 1.11-1.12)
   - Public service request submission
   - Warranty verification
   - Request tracking (no auth)

4. **Staff Request Management** (Story 1.13)
   - Request queue for staff
   - Request-to-ticket conversion

5. **Delivery Workflow** (Story 1.14)
   - Delivery confirmation
   - Digital signatures
   - Photo uploads

6. **Email Notifications** (Story 1.15)
   - 6 key notification moments
   - Email templates
   - Notification log

7. **Enhanced Dashboards** (Stories 1.16-1.17)
   - Manager task progress dashboard
   - Dynamic template switching
   - Advanced analytics

### New Pages/Routes

```
Phase 2 adds 15+ new routes:

AUTHENTICATED ROUTES (Staff Only):
/dashboard/workflows/templates      - Task template management
/dashboard/workflows/task-types     - Task type library
/dashboard/my-tasks                 - Technician task list
/dashboard/warehouses               - Warehouse management
/dashboard/inventory/products       - Physical product registry
/dashboard/inventory/stock-levels   - Stock level monitoring
/dashboard/inventory/rma            - RMA batch management
/dashboard/service-requests         - Request queue for staff
/dashboard/deliveries               - Delivery confirmations
/dashboard/notifications            - Email notification log
/dashboard/task-progress            - Manager dashboard

PUBLIC ROUTES (No Authentication):
/service-request                    - Public request portal
/service-request/success            - Submission confirmation
/service-request/track              - Track by token
```

---

## Technology Stack

### Core Technologies

```yaml
# Frontend Framework
Next.js: 15.5.4
  - App Router (file-based routing)
  - React Server Components (default)
  - Turbopack (build tool)
  - Port: 3025

# UI Library
React: 19.1.0
  - Server Components by default
  - Client Components with 'use client'
  - Suspense for loading states

# Language
TypeScript: 5.x
  - Strict mode enabled
  - Path aliases (@/ for src/)

# API Layer
tRPC: 11.6.0
  - End-to-end type safety
  - Integrated with React Query

# State Management
TanStack Query: v5
  - Server state management
  - Caching and invalidation
  - Optimistic updates
  - Real-time polling (30s intervals)
  - Optional: WebSocket via Supabase Realtime

# Styling
Tailwind CSS: 4.0
  - Utility-first CSS
  - Custom design tokens
  - Dark mode support (planned)

# Component Library
shadcn/ui: Latest
  - 40+ pre-built components
  - Radix UI primitives
  - Fully customizable
  - Accessible (WCAG 2.1)

# Form Handling
React Hook Form: Latest
  - Performance-optimized
  - Minimal re-renders

# Validation
Zod: Latest
  - Runtime type validation
  - Schema-based validation
  - Integration with React Hook Form

# Code Quality
Biome: 2.2.0
  - Linting
  - Formatting
  - Fast performance
```

### Additional Libraries (Phase 2)

```json
{
  "@dnd-kit/core": "latest",           // Drag-and-drop for task ordering
  "@dnd-kit/sortable": "latest",       // Sortable lists
  "recharts": "latest",                // Charts for dashboards
  "signature_pad": "latest",           // Digital signatures
  "date-fns": "latest"                 // Date manipulation
}
```

---

## Architecture

### Component Architecture Principles

**1. Server Components by Default**
```typescript
// Default: Server Component (no 'use client')
export default async function TicketDetailPage({ params }: Props) {
  const supabase = createClient();
  const ticket = await fetchTicket(params.id);

  return <TicketDetails ticket={ticket} />;
}

// Client Component (when needed)
'use client';

export function TicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ... interactive logic
}
```

**2. Separation of Concerns**
```
├── Server Components
│   ├── Data fetching
│   ├── Layout rendering
│   └── SEO/metadata
│
└── Client Components
    ├── Interactivity (forms, buttons)
    ├── State management
    ├── Real-time updates
    └── Browser APIs
```

**3. Composition Over Inheritance**
```typescript
// ✅ Good: Composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <TaskList tasks={tasks} />
  </CardContent>
</Card>

// ❌ Avoid: Deep inheritance
class TaskCard extends Card extends BaseCard { ... }
```

---

## Directory Structure

### Phase 2 Target Structure (ORGANIZED)

```
src/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Protected routes (existing + new)
│   │   └── dashboard/
│   │       ├── page.tsx          # ✓ Existing
│   │       ├── tickets/          # ✓ Existing
│   │       ├── customers/        # ✓ Existing
│   │       ├── products/         # ✓ Existing
│   │       ├── parts/            # ✓ Existing
│   │       ├── team/             # ✓ Existing
│   │       │
│   │       ├── workflows/        # 🆕 Phase 2
│   │       │   ├── templates/
│   │       │   └── task-types/
│   │       │
│   │       ├── my-tasks/         # 🆕 Phase 2
│   │       │   └── page.tsx
│   │       │
│   │       ├── warehouses/       # 🆕 Phase 2
│   │       │   └── page.tsx
│   │       │
│   │       ├── inventory/        # 🆕 Phase 2
│   │       │   ├── products/
│   │       │   ├── stock-levels/
│   │       │   └── rma/
│   │       │
│   │       ├── service-requests/ # 🆕 Phase 2
│   │       ├── deliveries/       # 🆕 Phase 2
│   │       ├── notifications/    # 🆕 Phase 2
│   │       └── task-progress/    # 🆕 Phase 2
│   │
│   ├── (public)/                 # Public routes
│   │   ├── login/                # ✓ Existing
│   │   ├── setup/                # ✓ Existing
│   │   │
│   │   └── service-request/      # 🆕 Phase 2 (PUBLIC PORTAL)
│   │       ├── page.tsx          # Request submission
│   │       ├── success/          # Confirmation page
│   │       └── track/            # Tracking page (no auth)
│   │
│   └── api/
│       ├── trpc/[...trpc]/       # ✓ Existing
│       └── health/               # 🆕 Health check endpoint
│
├── components/
│   ├── ui/                       # ✓ shadcn/ui (40+ components)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── forms/                    # 🆕 Phase 2 - Business Forms
│   │   ├── task-template-form.tsx
│   │   ├── warehouse-form.tsx
│   │   ├── physical-product-form.tsx
│   │   ├── service-request-wizard.tsx
│   │   ├── delivery-confirmation-form.tsx
│   │   └── rma-batch-form.tsx
│   │
│   ├── tables/                   # 🆕 Phase 2 - Data Tables
│   │   ├── task-template-table.tsx
│   │   ├── physical-warehouse-table.tsx
│   │   ├── virtual-warehouse-table.tsx
│   │   ├── stock-levels-table.tsx
│   │   ├── stock-movement-table.tsx
│   │   ├── service-requests-table.tsx
│   │   ├── task-progress-table.tsx
│   │   ├── rma-batches-table.tsx
│   │   └── delivery-log-table.tsx
│   │
│   ├── modals/                   # 🆕 Phase 2 - Modal Dialogs
│   │   ├── template-editor-modal.tsx
│   │   ├── task-completion-modal.tsx
│   │   ├── warehouse-form-modal.tsx
│   │   ├── product-registration-modal.tsx
│   │   ├── stock-movement-modal.tsx
│   │   ├── bulk-import-modal.tsx
│   │   ├── rma-batch-wizard.tsx
│   │   ├── set-threshold-modal.tsx
│   │   └── reject-request-modal.tsx
│   │
│   └── shared/                   # 🆕 Phase 2 - Shared Components
│       ├── task-status-badge.tsx
│       ├── warehouse-type-badge.tsx
│       ├── stock-status-badge.tsx
│       ├── warranty-status-badge.tsx
│       ├── serial-verification-widget.tsx
│       ├── task-execution-card.tsx
│       ├── task-dependency-indicator.tsx
│       ├── movement-history-timeline.tsx
│       ├── request-status-timeline.tsx
│       ├── low-stock-alerts.tsx
│       ├── product-photo-upload.tsx
│       └── draggable-task-list.tsx
│
├── types/                        # 🆕 Phase 2 - Type Definitions
│   ├── index.ts                  # Re-export all types
│   ├── database.types.ts         # ✓ Existing (Supabase generated)
│   ├── workflow.ts               # Task templates, instances
│   ├── warehouse.ts              # Warehouses, products, movements
│   ├── warranty.ts               # Serial verification, warranty
│   ├── service-request.ts        # Service requests, tracking
│   └── enums.ts                  # All ENUMs (task_status, etc.)
│
├── hooks/                        # 🆕 Phase 2 - Custom Hooks
│   ├── use-workflow.ts           # Task workflow hooks
│   ├── use-warehouse.ts          # Warehouse management hooks
│   ├── use-warranty.ts           # Serial verification hooks
│   ├── use-service-requests.ts   # Service request hooks
│   └── use-debounce.ts           # Utility hooks
│
├── constants/                    # 🆕 Phase 2 - Constants
│   ├── index.ts                  # Re-export all constants
│   ├── workflow.ts               # Task statuses, types
│   ├── warehouse.ts              # Warehouse types, thresholds
│   ├── service-request.ts        # Request statuses, formats
│   └── messages.ts               # UI messages, notifications
│
├── server/
│   ├── routers/
│   │   ├── _app.ts               # ✓ Main router (extended)
│   │   ├── admin.ts              # ✓ Existing
│   │   ├── tickets.ts            # ✓ Existing (extended)
│   │   ├── customers.ts          # ✓ Existing
│   │   ├── products.ts           # ✓ Existing
│   │   ├── parts.ts              # ✓ Existing
│   │   ├── brands.ts             # ✓ Existing
│   │   ├── revenue.ts            # ✓ Existing
│   │   │
│   │   ├── workflow.ts           # 🆕 Task workflow procedures
│   │   ├── warehouse.ts          # 🆕 Warehouse procedures (same file as inventory)
│   │   └── service-request.ts    # 🆕 Service request procedures
│   │       ├── Public procedures (no auth)
│   │       └── Staff procedures (authenticated)
│   │
│   └── trpc.ts                   # ✓ tRPC setup
│
├── utils/
│   ├── supabase/
│   │   ├── client.ts             # ✓ Browser client
│   │   ├── server.ts             # ✓ Server client
│   │   └── admin.ts              # ✓ Admin client
│   ├── trpc.ts                   # ✓ tRPC client
│   ├── warranty.ts               # 🆕 Warranty calculations
│   └── date.ts                   # 🆕 Date utilities
│
└── lib/
    └── utils.ts                  # ✓ Utility functions (cn, etc.)
```

---

## Component Organization

### Component Naming Conventions

```typescript
// ✅ CORRECT: Interface for props, PascalCase names
interface TaskTemplateFormProps {
  templateId?: string;
  onSuccess?: () => void;
}

export function TaskTemplateForm({ templateId, onSuccess }: TaskTemplateFormProps) {
  // Implementation
}

// ✅ File naming: kebab-case
// task-template-form.tsx

// ❌ INCORRECT: Type for props (old standard)
type TaskTemplateFormProps = { ... }  // Don't use for props

// ❌ INCORRECT: camelCase component
export function taskTemplateForm() { ... }
```

### Component Structure Template

```typescript
// src/components/forms/example-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';

// 1. Props Interface
interface ExampleFormProps {
  initialData?: ExampleData;
  onSuccess?: (data: ExampleData) => void;
  onCancel?: () => void;
}

// 2. Validation Schema
const formSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

type FormData = z.infer<typeof formSchema>;

// 3. Component
export function ExampleForm({ initialData, onSuccess, onCancel }: ExampleFormProps) {
  // Hooks
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const mutation = trpc.example.create.useMutation({
    onSuccess: (data) => {
      toast.success('Success!');
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Handlers
  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  // Render
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields */}
      <div>
        <Input {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
```

---

## State Management

### Client State (React)

```typescript
// Component-level state
const [isOpen, setIsOpen] = useState(false);
const [selectedId, setSelectedId] = useState<string | null>(null);

// Form state (React Hook Form)
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {},
});
```

### Server State (TanStack Query + tRPC)

```typescript
// Query (GET)
const { data, isLoading, error } = trpc.tickets.list.useQuery({
  status: 'pending',
  limit: 50,
});

// Mutation (POST/PUT/DELETE)
const mutation = trpc.tickets.create.useMutation({
  onSuccess: () => {
    // Invalidate queries to refetch
    utils.tickets.list.invalidate();
  },
});

// Optimistic updates
const updateMutation = trpc.tickets.updateStatus.useMutation({
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await utils.tickets.list.cancel();

    // Snapshot previous value
    const previous = utils.tickets.list.getData();

    // Optimistically update
    utils.tickets.list.setData(undefined, (old) => {
      // Update logic
    });

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.tickets.list.setData(undefined, context?.previous);
  },
});

// Real-time polling (30 seconds)
const { data } = trpc.workflow.myTasks.useQuery(undefined, {
  refetchInterval: 30000,
  refetchIntervalInBackground: false,
});
```

### Phase 2: Optional WebSocket (Supabase Realtime)

```typescript
// Future enhancement: Real-time subscriptions
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// Subscribe to task updates
supabase
  .channel('task-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'service_ticket_tasks',
  }, (payload) => {
    // Invalidate queries
    utils.workflow.myTasks.invalidate();
  })
  .subscribe();
```

---

## Routing

### Route Groups

```typescript
// (auth) - Protected routes (require authentication)
app/(auth)/
  - Middleware checks authentication
  - Redirects to /login if not authenticated

// (public) - Public routes (no authentication)
app/(public)/
  - Accessible without login
  - Rate limiting applied (Kong)
```

### Page Structure

```typescript
// app/(auth)/dashboard/warehouses/page.tsx
export default async function WarehousesPage() {
  // Server Component - can fetch data
  const supabase = createClient();
  const initialData = await fetchInitialData();

  return (
    <div>
      <h1>Warehouses</h1>
      <WarehouseManagementClient initialData={initialData} />
    </div>
  );
}

// Client component for interactivity
'use client';
function WarehouseManagementClient({ initialData }) {
  // Interactive logic
}
```

### Dynamic Routes

```typescript
// app/(auth)/dashboard/tickets/[id]/page.tsx
interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function TicketDetailPage({ params }: PageProps) {
  const ticket = await fetchTicket(params.id);
  return <TicketDetails ticket={ticket} />;
}
```

### Navigation

```typescript
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Programmatic navigation
const router = useRouter();
router.push('/dashboard/tickets');
router.back();

// Link component
<Link href="/dashboard/tickets/123">View Ticket</Link>

// With search params
<Link href={{ pathname: '/tickets', query: { status: 'pending' } }}>
  Pending Tickets
</Link>
```

---

## UI Components

### shadcn/ui Components Available

```typescript
// Base components (40+ available)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// And many more...
```

### Custom Component Patterns

**1. Status Badges**
```typescript
// src/components/shared/task-status-badge.tsx
interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'secondary' as const },
  in_progress: { label: 'In Progress', variant: 'default' as const },
  completed: { label: 'Completed', variant: 'success' as const },
  blocked: { label: 'Blocked', variant: 'destructive' as const },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
```

**2. Data Tables**
```typescript
// src/components/tables/stock-levels-table.tsx
interface StockLevelsTableProps {
  data: StockLevel[];
  isLoading: boolean;
}

export function StockLevelsTable({ data, isLoading }: StockLevelsTableProps) {
  if (isLoading) return <div>Loading...</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Warehouse</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.product_name}</TableCell>
            <TableCell>{item.warehouse_name}</TableCell>
            <TableCell>{item.current_stock}</TableCell>
            <TableCell>
              <StockStatusBadge status={item.stock_status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**3. Modal Dialogs**
```typescript
// src/components/modals/task-completion-modal.tsx
interface TaskCompletionModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
}

export function TaskCompletionModal({ open, onClose, taskId }: TaskCompletionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Task</DialogTitle>
        </DialogHeader>
        {/* Form content */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Complete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Data Fetching

### Server Components (Recommended)

```typescript
// Direct database queries in Server Components
import { createClient } from '@/utils/supabase/server';

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: ticket } = await supabase
    .from('service_tickets')
    .select('*, customer:customers(*), product:products(*)')
    .eq('id', params.id)
    .single();

  return <TicketDetails ticket={ticket} />;
}
```

### Client Components (tRPC)

```typescript
'use client';

import { trpc } from '@/utils/trpc';

export function TicketList() {
  const { data, isLoading, error } = trpc.tickets.list.useQuery({
    status: 'pending',
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

### Pagination

```typescript
const [page, setPage] = useState(0);
const limit = 50;

const { data } = trpc.tickets.list.useQuery({
  limit,
  offset: page * limit,
});

// Pagination controls
<Button onClick={() => setPage(p => p - 1)} disabled={page === 0}>
  Previous
</Button>
<Button onClick={() => setPage(p => p + 1)} disabled={!data?.hasMore}>
  Next
</Button>
```

### Infinite Scroll

```typescript
const { data, fetchNextPage, hasNextPage } = trpc.tickets.list.useInfiniteQuery(
  { limit: 20 },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }
);

// Load more button
{hasNextPage && (
  <Button onClick={() => fetchNextPage()}>
    Load More
  </Button>
)}
```

---

## Forms & Validation

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema
const warehouseSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  location: z.string().min(5, 'Location required'),
  is_active: z.boolean().default(true),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

// 2. Use in component
export function WarehouseForm() {
  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      location: '',
      is_active: true,
    },
  });

  const onSubmit = (data: WarehouseFormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <Label>Name</Label>
        <Input {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-destructive text-sm">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### File Uploads

```typescript
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function PhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleUpload = async (file: File) => {
    setUploading(true);

    const { data, error } = await supabase.storage
      .from('serial-photos')
      .upload(`${Date.now()}_${file.name}`, file);

    if (error) {
      console.error(error);
    } else {
      const url = supabase.storage
        .from('serial-photos')
        .getPublicUrl(data.path).data.publicUrl;

      // Use URL
      console.log(url);
    }

    setUploading(false);
  };

  return (
    <input
      type="file"
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      disabled={uploading}
    />
  );
}
```

---

## Styling

### Tailwind CSS Classes

```typescript
// Standard utility classes
<div className="flex items-center gap-4 p-6 rounded-lg border bg-card">
  <div className="text-lg font-semibold text-foreground">Title</div>
  <Badge className="ml-auto">New</Badge>
</div>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>

// Hover/focus states
<Button className="hover:bg-accent focus:ring-2 focus:ring-primary">
  Click Me
</Button>

// Conditional classes with cn()
import { cn } from '@/lib/utils';

<div className={cn(
  "rounded-lg p-4",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
  Content
</div>
```

### Theme Colors

```typescript
// Tailwind CSS 4 design tokens
const colors = {
  // Base colors
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',

  // Primary colors
  primary: 'hsl(var(--primary))',
  'primary-foreground': 'hsl(var(--primary-foreground))',

  // Secondary colors
  secondary: 'hsl(var(--secondary))',

  // Accent colors
  accent: 'hsl(var(--accent))',

  // Status colors
  destructive: 'hsl(var(--destructive))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',

  // UI elements
  card: 'hsl(var(--card))',
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  muted: 'hsl(var(--muted))',
};
```

### Custom CSS (When Needed)

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other variables */
  }
}

@layer components {
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted)) transparent;
  }
}
```

---

## Migration Strategy

### Phase 2 Implementation Approach

**Strategy: Additive (No Breaking Changes)**

1. ✅ **Create new directories** (types/, hooks/, constants/, components/forms|tables|modals|shared/)
2. ✅ **Build Phase 2 components in organized structure**
3. ✅ **Existing flat components remain untouched**
4. ✅ **Gradual migration post-Phase 2**

### Migration Phases

**Phase 2.0 (Current): Establish Target Architecture**
```
- Create organized directory structure
- Build ALL new Phase 2 components in organized folders
- Existing components stay in flat structure
- Zero disruption to existing features
```

**Phase 2.1 (Post-Implementation): Gradual Migration**
```
- Identify high-value components to migrate
- Move one component at a time
- Update imports
- Test thoroughly
- Repeat
```

**Phase 2.2 (Future): Complete Migration**
```
- All components in organized structure
- Remove legacy flat structure
- Update documentation
- Celebrate! 🎉
```

### Migration Checklist (Per Component)

```
□ 1. Create new component in organized structure
     Example: src/components/tables/ticket-table.tsx

□ 2. Copy component code
     Keep logic identical

□ 3. Update imports to use interface for props
     type TicketTableProps → interface TicketTableProps

□ 4. Update all import paths in other files
     @/components/ticket-table → @/components/tables/ticket-table

□ 5. Test thoroughly
     All functionality works

□ 6. Delete old flat component
     Remove src/components/ticket-table.tsx

□ 7. Update documentation
     Note migration in changelog
```

---

## Development Guidelines

### Code Quality Standards

**1. TypeScript**
```typescript
// ✅ Explicit types
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // Implementation
}

// ❌ Implicit any
function getUser(id) {  // Error: Parameter 'id' implicitly has 'any' type
  // ...
}
```

**2. Component Props**
```typescript
// ✅ Use interface for props
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

// ❌ Don't use type for props (old standard)
type ButtonProps = { ... }
```

**3. Server vs Client Components**
```typescript
// ✅ Server Component (default)
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✅ Client Component (explicit)
'use client';

export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ❌ Unnecessary 'use client'
'use client';  // Not needed if no client-side features

export function StaticComponent() {
  return <div>Static content</div>;
}
```

**4. Error Handling**
```typescript
// ✅ Proper error handling
try {
  const result = await mutation.mutateAsync(data);
  toast.success('Success!');
} catch (error) {
  if (error instanceof TRPCError) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
  }
}

// ❌ Generic catch
try {
  await mutation.mutateAsync(data);
} catch (error) {
  console.log(error);  // User sees nothing
}
```

**5. Performance**
```typescript
// ✅ Memoization when needed
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ Debounce search inputs
import { useDebounce } from '@/hooks/use-debounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

// Use debouncedSearch in queries
```

### Testing Guidelines

**Manual Testing Required (Phase 2)**
```
Per Story:
- Test all acceptance criteria
- Verify Integration Verification (IV1-IV4)
- Test with different user roles
- Test edge cases
- Verify mobile responsiveness
```

**Future: Automated Testing**
```typescript
// Planned: Vitest + Playwright
// docs/architecture/09-testing-strategy.md

// Unit tests
describe('TaskStatusBadge', () => {
  it('renders correct variant for status', () => {
    // Test implementation
  });
});

// Integration tests
describe('Ticket Creation Flow', () => {
  it('creates ticket and generates tasks', () => {
    // Test implementation
  });
});
```

### Git Workflow

```bash
# Feature branch naming
git checkout -b feature/story-1.6-warehouse-hierarchy

# Commit message format
git commit -m "feat(warehouse): add physical warehouse CRUD

- Implement warehouse table component
- Add warehouse form modal
- Create tRPC procedures

Story: SC-PHASE2-01.06"

# Push and create PR
git push -u origin feature/story-1.6-warehouse-hierarchy
```

### Code Review Checklist

```
□ TypeScript strict mode compliance
□ Interface used for component props
□ Proper error handling
□ Loading states implemented
□ Mobile responsive
□ Accessibility (ARIA labels, keyboard nav)
□ Performance optimized (memoization, debounce)
□ No console.log in production code
□ Comments for complex logic
□ Tests passing (when implemented)
```

---

## Performance Optimization

### Bundle Size

```typescript
// ✅ Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false,
});

// ✅ Code splitting by route (automatic with App Router)
app/dashboard/warehouses/page.tsx  // Separate bundle
app/dashboard/tickets/page.tsx      // Separate bundle
```

### Image Optimization

```typescript
import Image from 'next/image';

// ✅ Use Next.js Image component
<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={300}
  height={200}
  loading="lazy"
/>

// Uses imgproxy service for transformations
```

### Database Query Optimization

```typescript
// ✅ Select only needed fields
.select('id, name, status')

// ✅ Use indexes (defined in migration)
CREATE INDEX idx_tickets_status ON service_tickets(status);

// ✅ Pagination
.range(offset, offset + limit - 1)

// ❌ Avoid N+1 queries
// Use joins instead of separate queries
.select('*, customer:customers(*), product:products(*)')
```

---

## Accessibility

### WCAG 2.1 Compliance

```typescript
// ✅ Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

// ✅ ARIA labels
<button aria-label="Close dialog" onClick={onClose}>
  <X className="h-4 w-4" />
</button>

// ✅ Focus management
<Dialog open={open} onOpenChange={setOpen}>
  {/* Focus trapped within dialog */}
</Dialog>

// ✅ Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Interactive element
</div>
```

### Color Contrast

```
All color combinations meet WCAG AA standards:
- Text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- UI components: 3:1 contrast ratio
```

---

## Security

### Authentication

```typescript
// All authenticated routes protected by middleware
// src/middleware.ts checks Supabase session

// Public routes explicitly marked
app/(public)/service-request/  // No auth required
```

### Input Validation

```typescript
// ✅ Server-side validation (tRPC + Zod)
const schema = z.object({
  email: z.string().email(),
  serial: z.string().regex(/^[A-Z0-9]{5,}$/),
});

// Validation happens on server before database

// ✅ Sanitization
import DOMPurify from 'isomorphic-dompurify';
const clean = DOMPurify.sanitize(userInput);
```

### XSS Prevention

```typescript
// ✅ React auto-escapes
<div>{userInput}</div>  // Automatically escaped

// ❌ Dangerous HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // Avoid
```

### CSRF Protection

```
- Supabase handles CSRF tokens
- tRPC uses httpBatchLink with credentials: 'include'
- SameSite cookies enabled
```

---

## Deployment

### Build Process

```bash
# Install dependencies
pnpm install

# Run linter
pnpm lint

# Build application
pnpm build

# Start production server
pnpm start
```

### Environment Variables

```bash
# Required for frontend
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Internal (not exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Public portal settings
PUBLIC_REQUEST_PORTAL_ENABLED=true
```

### Production Checklist

```
□ All environment variables set
□ Database migrations applied
□ Build successful (pnpm build)
□ No TypeScript errors
□ No linter errors
□ All IV criteria passing
□ Performance metrics acceptable
□ Accessibility audit passed
□ Security review completed
□ Documentation updated
```

---

## Appendix

### Key File Locations

```
Configuration:
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # Tailwind config
├── next.config.js                 # Next.js config
├── biome.json                     # Biome (linting) config
└── .env                           # Environment variables

Documentation:
├── docs/prd/                      # Product requirements
├── docs/architecture/             # Architecture docs
├── docs/stories/                  # User stories
├── CLAUDE.md                      # Development guide
└── docs/frontend-specification.md # This document

Source Code:
├── src/app/                       # Routes
├── src/components/                # UI components
├── src/server/                    # tRPC backend
├── src/types/                     # TypeScript types
├── src/hooks/                     # Custom hooks
└── src/constants/                 # Constants
```

### Useful Commands

```bash
# Development
pnpm dev                           # Start dev server (port 3025)
pnpm build                         # Build for production
pnpm start                         # Start production server
pnpm lint                          # Run linter
pnpm format                        # Format code

# Database
pnpx supabase start                # Start Supabase stack
pnpx supabase stop                 # Stop Supabase
pnpx supabase db reset             # Reset database
pnpx supabase migration up         # Apply migrations
pnpx supabase gen types typescript # Generate types

# Troubleshooting
pnpm clean                         # Clean build cache
rm -rf .next node_modules          # Nuclear option
pnpm install                       # Reinstall dependencies
```

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [tRPC Documentation](https://trpc.io)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase Documentation](https://supabase.com/docs)

---

**Document Version:** 2.0
**Last Updated:** 2025-10-23
**Next Review:** After Phase 2 Implementation

---
