# Source Tree Structure

**Version:** 1.0 (Phase 2)
**Last Updated:** 2025-10-23
**Status:** Active

---

## Table of Contents

1. [Current Structure (Phase 1)](#current-structure-phase-1)
2. [Target Structure (Phase 2)](#target-structure-phase-2)
3. [Directory Purposes](#directory-purposes)
4. [File Naming Conventions](#file-naming-conventions)
5. [Migration Strategy](#migration-strategy)

---

## Current Structure (Phase 1)

### Root Directory

```
sevice-center/
├── .bmad-core/              # BMAD agent configuration
│   ├── core-config.yaml
│   ├── checklists/
│   └── tasks/
├── .next/                   # Next.js build output (gitignored)
├── docs/                    # Documentation
│   ├── prd/                # Product requirements (sharded)
│   ├── architecture/       # Architecture docs (sharded)
│   ├── stories/            # User stories
│   └── data/schemas/       # Database schemas (source of truth)
├── node_modules/            # Dependencies (gitignored)
├── public/                  # Static assets
├── src/                     # Source code (see below)
├── supabase/               # Supabase configuration
│   ├── config.toml
│   ├── migrations/         # Database migrations
│   └── seed.sql
├── volumes/                 # Docker volumes (gitignored)
│   └── storage/            # Supabase storage files
├── .env                     # Environment variables (gitignored)
├── .gitignore
├── biome.json              # Biome configuration
├── CLAUDE.md               # Claude Code guidance
├── docker-compose.yml      # Supabase services
├── LICENSE
├── next.config.js          # Next.js configuration
├── package.json
├── pnpm-lock.yaml
├── README.md
├── tailwind.config.js      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

### Source Directory (Phase 1)

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                 # Protected routes group
│   │   ├── account/
│   │   │   └── page.tsx
│   │   ├── app-setting/
│   │   │   └── page.tsx
│   │   ├── customers/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── add/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── parts/
│   │   │   ├── add/
│   │   │   └── page.tsx
│   │   ├── products/
│   │   │   ├── add/
│   │   │   └── page.tsx
│   │   ├── setting/
│   │   │   └── page.tsx
│   │   ├── team/
│   │   │   ├── [id]/edit/
│   │   │   ├── add/
│   │   │   └── page.tsx
│   │   ├── tickets/
│   │   │   ├── [id]/
│   │   │   │   ├── edit/
│   │   │   │   └── page.tsx
│   │   │   ├── add/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (public)/               # Public routes group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── setup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   └── trpc/
│   │       └── [...trpc]/
│   │           └── route.ts    # tRPC API endpoint
│   ├── favicon.ico
│   ├── globals.css
│   └── layout.tsx              # Root layout
│
├── components/                  # 🚨 FLAT STRUCTURE (Phase 1)
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   └── ... (40+ components)
│   ├── add-customer-form.tsx   # Business components mixed
│   ├── add-ticket-form.tsx
│   ├── app-sidebar.tsx
│   ├── customer-table.tsx
│   ├── edit-customer-form.tsx
│   ├── edit-ticket-form.tsx
│   ├── quick-upload-images-modal.tsx
│   ├── ticket-parts-manager.tsx
│   ├── ticket-table.tsx
│   └── ... (20+ more files)
│
├── lib/
│   └── utils.ts                # Utility functions
│
├── server/
│   ├── routers/
│   │   ├── _app.ts            # Main tRPC router
│   │   ├── admin.ts           # Admin procedures
│   │   ├── brands.ts          # Brand CRUD
│   │   ├── customers.ts       # Customer CRUD
│   │   ├── parts.ts           # Parts inventory
│   │   ├── products.ts        # Product catalog
│   │   ├── profile.ts         # User profile
│   │   ├── revenue.ts         # Analytics
│   │   └── tickets.ts         # Service tickets
│   └── trpc.ts                # tRPC initialization
│
└── utils/
    └── supabase/
        ├── admin.ts            # Admin client (service role)
        ├── client.ts           # Browser client
        └── server.ts           # Server client (with cookies)
```

---

## Target Structure (Phase 2)

### Source Directory (Phase 2)

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                 # Protected routes
│   │   ├── account/
│   │   ├── app-setting/
│   │   ├── customers/
│   │   ├── dashboard/
│   │   ├── parts/
│   │   ├── products/
│   │   ├── requests/           # 🆕 Staff request management
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   ├── setting/
│   │   ├── team/
│   │   ├── tickets/
│   │   ├── warehouses/         # 🆕 Warehouse management
│   │   │   ├── page.tsx
│   │   │   ├── physical/
│   │   │   └── virtual/
│   │   ├── workflows/          # 🆕 Task template management
│   │   │   ├── page.tsx
│   │   │   ├── templates/
│   │   │   └── tasks/
│   │   └── layout.tsx
│   ├── (public)/               # Public routes
│   │   ├── login/
│   │   ├── setup/
│   │   ├── service-request/    # 🆕 Public request portal
│   │   │   ├── page.tsx
│   │   │   ├── success/
│   │   │   └── track/
│   │   └── layout.tsx
│   ├── api/
│   │   └── trpc/
│   │       └── [...trpc]/
│   │           └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── ui/                     # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── radio-group.tsx
│   │   ├── switch.tsx
│   │   └── ... (40+ components)
│   │
│   ├── forms/                  # 🆕 Business forms
│   │   ├── task-template-form.tsx
│   │   ├── warehouse-form.tsx
│   │   ├── physical-product-form.tsx
│   │   ├── service-request-wizard.tsx
│   │   ├── delivery-confirmation-form.tsx
│   │   ├── rma-batch-form.tsx
│   │   └── stock-movement-form.tsx
│   │
│   ├── tables/                 # 🆕 Data tables
│   │   ├── task-template-table.tsx
│   │   ├── task-type-table.tsx
│   │   ├── physical-warehouse-table.tsx
│   │   ├── virtual-warehouse-table.tsx
│   │   ├── warehouse-stock-table.tsx
│   │   ├── stock-movement-table.tsx
│   │   ├── service-request-table.tsx
│   │   ├── task-progress-table.tsx
│   │   ├── physical-product-table.tsx
│   │   └── rma-batch-table.tsx
│   │
│   ├── modals/                 # 🆕 Modal dialogs
│   │   ├── template-editor-modal.tsx
│   │   ├── task-execution-modal.tsx
│   │   ├── stock-movement-modal.tsx
│   │   ├── bulk-import-modal.tsx
│   │   ├── rma-batch-modal.tsx
│   │   └── warehouse-form-modal.tsx
│   │
│   ├── shared/                 # 🆕 Shared business components
│   │   ├── task-status-badge.tsx
│   │   ├── warehouse-type-badge.tsx
│   │   ├── warranty-status-badge.tsx
│   │   ├── serial-verification-input.tsx
│   │   ├── task-execution-card.tsx
│   │   ├── tracking-timeline.tsx
│   │   ├── product-select.tsx
│   │   └── customer-select.tsx
│   │
│   └── ... (existing Phase 1 components - to be migrated later)
│
├── types/                      # 🆕 Type definitions
│   ├── index.ts               # Re-export all types
│   ├── database.types.ts      # Supabase generated types
│   ├── workflow.ts            # Task template, task instance types
│   ├── warehouse.ts           # Warehouse, stock movement types
│   ├── warranty.ts            # Serial, warranty verification types
│   ├── service-request.ts     # Service request, tracking types
│   └── enums.ts               # New ENUMs (task status, warehouse types)
│
├── hooks/                      # 🆕 Custom React hooks
│   ├── use-workflow.ts        # Task template, execution hooks
│   ├── use-warehouse.ts       # Warehouse, stock hooks
│   ├── use-warranty.ts        # Serial verification hooks
│   ├── use-service-requests.ts # Request management hooks
│   └── use-debounce.ts        # Utility hooks
│
├── constants/                  # 🆕 Application constants
│   ├── index.ts               # Re-export all constants
│   ├── workflow.ts            # Task statuses, default task types
│   ├── warehouse.ts           # Warehouse types, stock thresholds
│   ├── service-request.ts     # Request statuses, tracking token format
│   └── messages.ts            # UI messages for new features
│
├── lib/
│   └── utils.ts               # Utility functions
│
├── server/
│   ├── routers/
│   │   ├── _app.ts            # Main tRPC router (updated)
│   │   ├── admin.ts
│   │   ├── brands.ts
│   │   ├── customers.ts
│   │   ├── parts.ts
│   │   ├── products.ts
│   │   ├── profile.ts
│   │   ├── revenue.ts
│   │   ├── tickets.ts
│   │   ├── workflow.ts        # 🆕 Task workflow procedures
│   │   ├── warehouse.ts       # 🆕 Warehouse management procedures
│   │   ├── warranty.ts        # 🆕 Warranty verification procedures
│   │   └── serviceRequest.ts  # 🆕 Service request procedures
│   └── trpc.ts
│
└── utils/
    └── supabase/
        ├── admin.ts
        ├── client.ts
        └── server.ts
```

---

## Directory Purposes

### `/src/app/` - Next.js App Router

**Route Groups:**
- `(auth)/` - Protected routes requiring authentication
- `(public)/` - Public routes (no auth required)

**Routing Pattern:**
```
app/(auth)/tickets/page.tsx          → /tickets
app/(auth)/tickets/[id]/page.tsx     → /tickets/:id
app/(auth)/tickets/add/page.tsx      → /tickets/add
app/(public)/login/page.tsx          → /login
```

### `/src/components/` - React Components

**Phase 2 Organization:**

#### `ui/` - shadcn/ui Base Components
- Pre-built, generic UI components
- No business logic
- Reusable across entire app
- Examples: Button, Input, Dialog, Table

#### `forms/` - Business Forms
- Complete form components with validation
- React Hook Form + Zod integration
- Handle submission logic
- Examples: task-template-form.tsx, warehouse-form.tsx

#### `tables/` - Data Tables
- Complex table components with sorting, filtering
- TanStack Query integration
- Pagination support
- Examples: task-template-table.tsx, warehouse-stock-table.tsx

#### `modals/` - Modal Dialogs
- Modal/Dialog wrappers for forms or confirmations
- shadcn/ui Dialog component wrapped
- Examples: template-editor-modal.tsx, stock-movement-modal.tsx

#### `shared/` - Shared Business Components
- Reusable business-specific components
- Used across multiple features
- Examples: task-status-badge.tsx, serial-verification-input.tsx

### `/src/types/` - Type Definitions

**Purpose:**
- Centralized TypeScript types
- Domain model interfaces
- Enum types
- Re-exported from index.ts

**Files:**
- `database.types.ts` - Generated from Supabase
- `workflow.ts` - Task templates, instances
- `warehouse.ts` - Warehouses, products, movements
- `warranty.ts` - Serial verification, warranty info
- `service-request.ts` - Public requests, tracking
- `enums.ts` - Status enums, types

### `/src/hooks/` - Custom React Hooks

**Purpose:**
- Reusable state logic
- tRPC query/mutation wrappers
- Utility hooks

**Pattern:**
```typescript
// hooks/use-workflow.ts
export function useTaskTemplates() {
  return trpc.workflow.listTemplates.useQuery();
}

export function useCreateTemplate() {
  const utils = trpc.useUtils();
  return trpc.workflow.createTemplate.useMutation({
    onSuccess: () => utils.workflow.listTemplates.invalidate(),
  });
}
```

### `/src/constants/` - Application Constants

**Purpose:**
- Static configuration values
- UI labels and messages
- Default values
- Re-exported from index.ts

**Examples:**
```typescript
// constants/workflow.ts
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
  skipped: 'Skipped',
};
```

### `/src/server/routers/` - tRPC API Routers

**Structure:**
- One file per domain (workflow, warehouse, etc.)
- Procedures grouped by entity
- Zod schemas at top of file
- Auth checks in every procedure

**Pattern:**
```typescript
// server/routers/workflow.ts
import { router, publicProcedure } from '../trpc';

export const workflowRouter = router({
  listTemplates: publicProcedure.query(async ({ ctx }) => {
    // Implementation
  }),
  createTemplate: publicProcedure
    .input(schema)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

### `/docs/` - Documentation

```
docs/
├── prd/                    # Product Requirements (sharded)
│   ├── index.md
│   ├── 01-intro-project-analysis-and-context.md
│   ├── 02-requirements.md
│   ├── 03-user-interface-enhancement-goals.md
│   ├── 04-technical-constraints-and-integration-requirements.md
│   ├── 05-epic-and-story-structure.md
│   ├── 06-epic-details.md
│   └── 07-infrastructure-leverage-summary.md
│
├── architecture/           # Architecture docs (sharded)
│   ├── coding-standards.md
│   ├── tech-stack.md
│   ├── source-tree.md
│   └── frontend-architecture-roadmap.md
│
├── stories/               # User stories
│   ├── epic-01-workflow-warranty-warehouse.md
│   ├── 01.01.foundation-setup.md
│   ├── 01.02.task-template-management.md
│   └── ... (01.03 - 01.20)
│
└── data/schemas/          # Database schemas (SOURCE OF TRUTH)
    ├── 00_base_types.sql
    ├── 00_base_functions.sql
    ├── core_01_profiles.sql
    ├── core_02_customers.sql
    ├── ... (existing tables)
    ├── 11_phase2_types.sql         # 🆕 Phase 2 ENUMs
    ├── 12_phase2_functions.sql     # 🆕 Phase 2 functions
    ├── 13_task_tables.sql          # 🆕 Task workflow tables
    ├── 14_warehouse_tables.sql     # 🆕 Warehouse tables
    ├── 15_service_request_tables.sql # 🆕 Service request tables
    └── setup_schema.sh
```

### `/supabase/` - Supabase Configuration

```
supabase/
├── config.toml            # Supabase configuration
├── migrations/            # Database migrations (GENERATED)
│   ├── 20231001000000_initial_schema.sql
│   ├── 20231015000000_add_parts.sql
│   └── ... (timestamped migrations)
└── seed.sql              # Seed data
```

---

## File Naming Conventions

### Components

```
kebab-case.tsx

✅ task-template-form.tsx
✅ warehouse-stock-table.tsx
✅ serial-verification-input.tsx

❌ TaskTemplateForm.tsx
❌ warehouse_stock_table.tsx
❌ serialVerificationInput.tsx
```

### Types

```
kebab-case.ts

✅ workflow.ts
✅ warehouse.ts
✅ service-request.ts

❌ Workflow.ts
❌ warehouse_types.ts
```

### Hooks

```
use-kebab-case.ts

✅ use-workflow.ts
✅ use-warehouse.ts
✅ use-debounce.ts

❌ useWorkflow.ts
❌ workflow-hooks.ts
```

### Routes

```
kebab-case/page.tsx

✅ app/(auth)/warehouses/page.tsx
✅ app/(auth)/service-requests/[id]/page.tsx

❌ app/(auth)/Warehouses/page.tsx
❌ app/(auth)/service_requests/page.tsx
```

### Database Files

```
snake_case.sql

✅ 13_task_tables.sql
✅ core_07_service_tickets.sql
✅ functions_inventory.sql

❌ 13-task-tables.sql
❌ TaskTables.sql
```

---

## Migration Strategy

### Phase 2 Implementation

**✅ DO:**
- Create new directories: `types/`, `hooks/`, `constants/`
- Create new subdirectories: `components/forms/`, `components/tables/`, etc.
- Place ALL new Phase 2 components in organized structure
- Use organized imports: `import { TaskTemplateForm } from '@/components/forms/task-template-form'`

**❌ DON'T:**
- Move existing Phase 1 components yet
- Break existing imports
- Modify existing flat structure components

### Post-Phase 2 Migration

**Gradual Migration Plan:**
1. Move forms: `add-customer-form.tsx` → `components/forms/customer-form.tsx`
2. Move tables: `customer-table.tsx` → `components/tables/customer-table.tsx`
3. Move modals: `quick-upload-images-modal.tsx` → `components/modals/quick-upload-images-modal.tsx`
4. Update imports throughout codebase
5. Test thoroughly after each batch
6. Remove old files once migration complete

---

## Import Patterns

### Absolute Imports (Recommended)

```typescript
// ✅ Use absolute imports with @ alias
import { Button } from '@/components/ui/button';
import { TaskTemplateForm } from '@/components/forms/task-template-form';
import { useWorkflow } from '@/hooks/use-workflow';
import { TASK_STATUS_LABELS } from '@/constants/workflow';
import type { TaskTemplate } from '@/types/workflow';
```

### Relative Imports (Avoid)

```typescript
// ❌ Avoid relative imports
import { Button } from '../../../components/ui/button';
import { TaskTemplateForm } from '../../forms/task-template-form';
```

---

## Quick Reference

### Component Location Guide

| Component Type | Location | Example |
|----------------|----------|---------|
| shadcn/ui base | `components/ui/` | `button.tsx` |
| Business form | `components/forms/` | `task-template-form.tsx` |
| Data table | `components/tables/` | `warehouse-stock-table.tsx` |
| Modal dialog | `components/modals/` | `template-editor-modal.tsx` |
| Shared business | `components/shared/` | `task-status-badge.tsx` |
| Type definition | `types/` | `workflow.ts` |
| Custom hook | `hooks/` | `use-workflow.ts` |
| Constant | `constants/` | `workflow.ts` |
| tRPC router | `server/routers/` | `workflow.ts` |
| Page route | `app/(auth|public)/*/` | `page.tsx` |

### File Templates

**Component:**
```typescript
// src/components/forms/example-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ExampleFormProps {
  data?: ExampleData;
  onSuccess?: () => void;
}

export function ExampleForm({ data, onSuccess }: ExampleFormProps) {
  return <form>{/* Implementation */}</form>;
}
```

**Type Definition:**
```typescript
// src/types/workflow.ts
export interface TaskTemplate {
  id: string;
  name: string;
  created_at: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
```

**Custom Hook:**
```typescript
// src/hooks/use-workflow.ts
import { trpc } from '@/utils/trpc';

export function useTaskTemplates() {
  return trpc.workflow.listTemplates.useQuery();
}
```

**Constant:**
```typescript
// src/constants/workflow.ts
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-23 | Initial Phase 2 source tree documentation |

---

**Status:** Active for Phase 2 Development
**Last Updated:** 2025-10-23
