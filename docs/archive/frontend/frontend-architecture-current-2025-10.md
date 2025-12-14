# Service Center - Frontend Architecture (Current State)

**Version:** 2.0 (Current Production)
**Last Updated:** 2025-10-23
**Status:** ✅ Production - Documents Actual Implementation
**Author:** Winston (Architect Agent)

---

## Table of Contents

1. [Overview](#overview)
2. [Frontend Tech Stack](#frontend-tech-stack)
3. [Project Structure](#project-structure)
4. [Component Standards](#component-standards)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Routing](#routing)
8. [Styling Guidelines](#styling-guidelines)
9. [Environment Configuration](#environment-configuration)
10. [Frontend Developer Standards](#frontend-developer-standards)

---

## Overview

### Current Framework

This project is built on **Next.js 15.5.4** with App Router and Turbopack. The frontend is tightly integrated with the backend (not a separate SPA), leveraging modern React patterns with server-first architecture.

**Key Characteristics:**
- Next.js 15.5.4 with App Router (file-based routing)
- React 19.1.0 with Server Components
- shadcn/ui component library (built on Radix UI primitives)
- Tailwind CSS 4 with design token system
- tRPC for type-safe API communication
- TypeScript 5 for end-to-end type safety

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-23 | 2.0 | Current production architecture documentation | Winston (Architect) |
| 2025-10-23 | 1.0 | Initial architecture analysis | Winston (Architect) |

---

## Frontend Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Status |
|----------|-----------|---------|---------|--------|
| **Framework** | Next.js | 15.5.4 | React framework with App Router, SSR/SSG | ✅ Installed |
| **UI Library** | React | 19.1.0 | Core UI rendering library | ✅ Installed |
| **State Management** | TanStack Query | 5.90.2 | Server state synchronization and caching | ✅ Installed |
| **Routing** | Next.js App Router | 15.5.4 (built-in) | File-based routing with layouts | ✅ Installed |
| **Build Tool** | Turbopack | 15.5.4 (built-in) | Fast incremental bundler | ✅ Installed |
| **Styling** | Tailwind CSS | 4.0 | Utility-first CSS framework | ✅ Installed |
| **Component Library** | shadcn/ui | Latest | Accessible, customizable components | ✅ Installed |
| **Form Handling** | react-hook-form | Latest | Form validation and state management | ✅ Installed |
| **Dev Tools** | Biome | 2.2.0 | Linting and code formatting | ✅ Installed |
| **Type Safety** | TypeScript | 5.x | Static type checking | ✅ Installed |
| **API Client** | tRPC | 11.6.0 | Type-safe API communication | ✅ Installed |
| **Icons** | Lucide React + Tabler Icons | 0.544.0 / 3.35.0 | Icon libraries | ✅ Installed |
| **UI Primitives** | Radix UI | Various | Unstyled, accessible primitives | ✅ Installed |
| **Drag & Drop** | dnd-kit | 6.3.1 | Accessible drag and drop | ✅ Installed |
| **Data Visualization** | Recharts | 2.15.4 | Charts and graphs for dashboard | ✅ Installed |
| **Notifications** | Sonner | 2.0.7 | Toast notifications | ✅ Installed |
| **Theming** | next-themes | 0.4.6 | Dark mode support | ✅ Installed |
| **Class Utilities** | clsx + tailwind-merge | 2.1.1 / 3.3.1 | Conditional class composition | ✅ Installed |
| **Command Palette** | cmdk | 1.1.1 | Command menu UI | ✅ Installed |
| **Testing** | None | - | - | ❌ Not configured |
| **Animation** | None | - | - | ❌ Not configured |

---

## Project Structure

### Current Directory Structure

```plaintext
service-center/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/                    # Protected route group
│   │   │   ├── dashboard/             # Main dashboard
│   │   │   ├── tickets/               # Service ticket management
│   │   │   │   ├── page.tsx           # Tickets list
│   │   │   │   ├── add/page.tsx       # Create new ticket
│   │   │   │   └── [ticket-id]/       # Dynamic ticket routes
│   │   │   │       ├── page.tsx       # View ticket
│   │   │   │       └── edit/page.tsx  # Edit ticket
│   │   │   ├── customers/             # Customer management
│   │   │   ├── products/              # Product catalog
│   │   │   ├── parts/                 # Parts inventory
│   │   │   ├── brands/                # Brand management
│   │   │   ├── team/                  # Staff management
│   │   │   ├── report/                # Reporting
│   │   │   ├── account/               # User account settings
│   │   │   ├── setting/               # User settings
│   │   │   └── app-setting/           # Application settings
│   │   ├── (public)/                  # Public route group
│   │   │   ├── login/page.tsx         # Authentication page
│   │   │   └── setup/page.tsx         # Initial system setup
│   │   ├── api/                       # API routes
│   │   │   ├── trpc/[...trpc]/route.ts  # tRPC endpoint
│   │   │   ├── setup/route.ts         # Setup API
│   │   │   ├── staff/route.ts         # Staff API
│   │   │   └── health/route.ts        # Health check
│   │   ├── layout.tsx                 # Root layout
│   │   └── globals.css                # Global styles
│   │
│   ├── components/                    # React components (FLAT structure)
│   │   ├── ui/                        # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   ├── providers/                 # Context providers
│   │   │   └── trpc-provider.tsx
│   │   ├── add-ticket-form.tsx        # Create ticket form
│   │   ├── edit-ticket-form.tsx       # Edit ticket form
│   │   ├── login-form.tsx             # Login form
│   │   ├── ticket-table.tsx           # Tickets table
│   │   ├── customer-table.tsx         # Customers table
│   │   ├── product-table.tsx          # Products table
│   │   ├── parts-table.tsx            # Parts table
│   │   ├── brands-table.tsx           # Brands table
│   │   ├── team-table.tsx             # Team table
│   │   ├── data-table.tsx             # Reusable table component
│   │   ├── app-sidebar.tsx            # Main sidebar
│   │   ├── nav-main.tsx               # Main nav items
│   │   ├── nav-secondary.tsx          # Secondary nav
│   │   ├── nav-user.tsx               # User profile nav
│   │   ├── nav-documents.tsx          # Documents nav
│   │   ├── ticket-comments.tsx        # Ticket comments component
│   │   ├── quick-comment-modal.tsx    # Quick comment modal
│   │   ├── quick-upload-images-modal.tsx  # Image upload modal
│   │   ├── page-header.tsx            # Page header component
│   │   ├── section-cards.tsx          # Dashboard cards
│   │   └── ...                        # Other business components
│   │
│   ├── hooks/                         # Custom React hooks
│   │   └── ...                        # Various hooks
│   │
│   ├── server/                        # Server-side code (tRPC)
│   │   ├── routers/                   # tRPC route handlers
│   │   │   ├── _app.ts                # Main router
│   │   │   ├── tickets.ts             # Ticket operations
│   │   │   ├── customers.ts           # Customer operations
│   │   │   └── ...                    # Other routers
│   │   ├── utils/                     # Server utilities
│   │   │   ├── auto-comment.ts
│   │   │   ├── format-currency.ts
│   │   │   └── label-helpers.ts
│   │   └── trpc.ts                    # tRPC initialization
│   │
│   ├── lib/                           # Shared utilities
│   │   ├── supabase/                  # Supabase helpers
│   │   │   └── storage.ts
│   │   └── utils.ts                   # General utilities (cn helper, etc.)
│   │
│   ├── utils/                         # Core utilities
│   │   └── supabase/                  # Supabase client configurations
│   │       ├── client.ts              # Browser client
│   │       ├── server.ts              # Server component client
│   │       └── admin.ts               # Admin client (service role)
│   │
│   └── middleware.ts                  # Next.js middleware (auth guard)
│
├── public/                            # Static assets
├── docs/                              # Project documentation
├── supabase/                          # Supabase configuration
├── .env                               # Environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── biome.json
└── next.config.ts
```

**Key Observation:** Components are currently in a **flat structure** directly under `src/components/`, not organized into subdirectories.

---

## Component Standards

### TypeScript Type Definitions Standard

**🚨 ENFORCED RULE: Always use `type`, never `interface`**

This is enforced in `biome.json`:

```json
{
  "linter": {
    "rules": {
      "style": {
        "useConsistentTypeDefinitions": {
          "level": "error",
          "options": { "mode": "type" }
        }
      }
    }
  }
}
```

#### ✅ ALWAYS DO THIS:

```typescript
// Component props
type TicketCardProps = {
  ticket: Ticket
  onUpdate?: (ticket: Ticket) => void
  className?: string
}

// Data models
type Customer = {
  id: string
  name: string
  phone: string
  email?: string
}

// Type intersection for extending
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "default" | "destructive"
  isLoading?: boolean
}

// Discriminated unions
type FormFieldProps =
  | { type: "text"; placeholder: string }
  | { type: "number"; min: number; max: number }
  | { type: "select"; options: string[] }

// Zod inference
type CreateTicketInput = z.infer<typeof createTicketSchema>
```

#### ❌ NEVER DO THIS:

```typescript
// ❌ DON'T: Use interface
interface TicketCardProps {
  ticket: Ticket
}
```

### Component Template

```typescript
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

// External libraries
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Business Components
import { TicketStatusBadge } from "@/components/ticket-status-badge"

// Hooks & tRPC
import { trpc } from "@/components/providers/trpc-provider"

// Utils
import { cn } from "@/lib/utils"

// Types
type TicketCardProps = {
  ticket: Ticket
  onUpdate?: (ticket: Ticket) => void
  className?: string
}

// Component
export function TicketCard({ ticket, onUpdate, className }: TicketCardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = React.useState(false)

  const { data } = trpc.tickets.getTicket.useQuery({ id: ticket.id })

  const updateTicket = trpc.tickets.updateTicket.useMutation({
    onSuccess: (data) => {
      toast.success("Ticket updated")
      onUpdate?.(data.ticket)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <div className={cn("rounded-lg border p-4", className)}>
      {/* Component content */}
    </div>
  )
}

TicketCard.displayName = "TicketCard"
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Files** | kebab-case | `ticket-card.tsx`, `add-ticket-form.tsx` |
| **Components** | PascalCase | `TicketCard`, `AddTicketForm` |
| **Props Types** | PascalCase + `Props` | `TicketCardProps` |
| **Hooks** | camelCase with `use` prefix | `useTickets`, `useAuth` |
| **Event Handlers** | camelCase with `handle` prefix | `handleSubmit`, `handleClick` |
| **Boolean Props** | `is/has/can/should` prefix | `isLoading`, `hasError`, `canEdit` |

---

## State Management

### State Management Strategy

**Philosophy:** Server state and client state are fundamentally different.

#### 1. Server State (Primary) - TanStack Query via tRPC

```typescript
// Query example
export function TicketList() {
  const { data: tickets, isLoading, error } = trpc.tickets.getTickets.useQuery()

  if (isLoading) return <TicketsSkeleton />
  if (error) return <ErrorMessage error={error.message} />

  return <TicketTable data={tickets} />
}

// Mutation example
export function UpdateTicketButton({ ticketId }: { ticketId: string }) {
  const utils = trpc.useUtils()

  const updateStatus = trpc.tickets.updateTicketStatus.useMutation({
    onSuccess: () => {
      utils.tickets.getTickets.invalidate()
      utils.tickets.getTicket.invalidate({ id: ticketId })
      toast.success("Ticket updated!")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <Button onClick={() => updateStatus.mutate({ id: ticketId, status: "in_progress" })}>
      Start Work
    </Button>
  )
}
```

#### 2. Client State (Local) - React useState

```typescript
export function TicketCard({ ticket }: { ticket: Ticket }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {/* ... */}
    </Dialog>
  )
}
```

#### 3. Form State - react-hook-form

```typescript
export function AddTicketForm() {
  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      customer_data: { name: "", phone: "" },
      description: "",
      service_fee: 0,
    },
  })

  const createTicket = trpc.tickets.createTicket.useMutation({
    onSuccess: () => {
      form.reset()
      toast.success("Ticket created!")
    },
  })

  return (
    <form onSubmit={form.handleSubmit((data) => createTicket.mutate(data))}>
      <input {...form.register("customer_data.name")} />
    </form>
  )
}
```

---

## API Integration

### tRPC Configuration

#### Server Setup (`src/server/trpc.ts`)

```typescript
import { initTRPC } from "@trpc/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export function createTRPCContext(opts: { req: Request }) {
  // Two Supabase clients:
  const supabaseClient = createServerClient(/* ... */)  // For auth
  const supabaseAdmin = createClient(/* ... */)         // For data (bypasses RLS)

  return {
    supabaseClient,
    supabaseAdmin,
  }
}

const t = initTRPC.context<TRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure
```

#### Client Usage

```typescript
// Query
const { data: items, isLoading, error } = trpc.example.getItems.useQuery()

// Mutation
const utils = trpc.useUtils()
const createItem = trpc.example.createItem.useMutation({
  onSuccess: () => {
    utils.example.getItems.invalidate()
    toast.success("Created!")
  },
  onError: (error) => {
    toast.error(error.message)
  },
})
```

---

## Routing

### Route Groups Architecture

```plaintext
src/app/
├── (public)/                # Public routes (no auth)
│   ├── login/page.tsx       → /login
│   └── setup/page.tsx       → /setup
│
├── (auth)/                  # Protected routes (auth required)
│   ├── layout.tsx           → Auth guard + sidebar layout
│   ├── dashboard/page.tsx   → /dashboard
│   ├── tickets/
│   │   ├── page.tsx         → /tickets
│   │   ├── add/page.tsx     → /tickets/add
│   │   └── [ticket-id]/
│   │       ├── page.tsx     → /tickets/:id
│   │       └── edit/page.tsx → /tickets/:id/edit
│   └── ...
│
└── page.tsx                 → / (root)
```

### Authentication Guard

```typescript
// src/app/(auth)/layout.tsx
export default async function AuthLayout({ children }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
```

---

## Styling Guidelines

### Design Token System

```css
:root {
  /* Base colors */
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);

  /* Semantic colors */
  --primary: oklch(0.637 0.237 25.331);
  --primary-foreground: oklch(0.971 0.013 17.38);
  --destructive: oklch(0.577 0.245 27.325);

  /* UI elements */
  --card: oklch(1 0 0);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.637 0.237 25.331);

  /* Border radius */
  --radius: 0.65rem;
}
```

### The cn() Utility

```typescript
import { cn } from "@/lib/utils"

// Conditional classes
<div className={cn(
  "rounded-lg border p-4",
  isActive && "bg-primary",
  className
)} />
```

### Best Practices

```typescript
// ✅ DO: Use design tokens
<div className="bg-background text-foreground border-border" />

// ❌ DON'T: Use arbitrary colors
<div className="bg-white text-gray-900 border-gray-200" />

// ✅ DO: Use cn() for dynamic classes
<div className={cn("p-4", isActive && "bg-primary")} />

// ❌ DON'T: String concatenation
<div className={`p-4 ${isActive ? 'bg-primary' : ''}`} />
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase_start
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase_start

# Setup Configuration
SETUP_PASSWORD=change_this_to_secure_password

# Default Admin Account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
ADMIN_NAME=Administrator

# Storage (Optional)
S3_ACCESS_KEY=your_s3_access_key
```

### Setup Instructions

```bash
# 1. Copy example file
cp .env.example .env

# 2. Start Supabase
pnpx supabase start

# 3. Copy output values to .env
# 4. Update .env with your values
# 5. Start the app
pnpm dev
```

---

## Frontend Developer Standards

### Critical Coding Rules

**🚨 MUST FOLLOW**

```typescript
// RULE 1: Always use `type`, never `interface`
type ButtonProps = { variant: "primary" }

// RULE 2: Export Zod schemas for reuse
export const createTicketSchema = z.object({ /* ... */ })

// RULE 3: Use Server Components by default
export default async function Page() { /* ... */ }

// RULE 4: Use cn() for dynamic classes
<div className={cn("p-4", isActive && "bg-primary")} />

// RULE 5: Use design tokens
<div className="bg-background text-foreground" />

// RULE 6: Use tRPC hooks for server state
const { data } = trpc.tickets.getTickets.useQuery()

// RULE 7: Invalidate queries after mutations
onSuccess: () => utils.tickets.getTickets.invalidate()

// RULE 8: Use Server Components by default
export default async function Page() { /* ... */ }

// RULE 9: Always validate tRPC input
.input(createItemSchema)

// RULE 10: Use supabaseAdmin for data
await ctx.supabaseAdmin.from("tickets").select("*")
```

### Quick Commands

```bash
# Development
pnpm dev              # Start dev server (port 3025)
pnpm build            # Build for production
pnpm lint             # Run linter
pnpm format           # Format code

# Supabase
pnpx supabase start   # Start local Supabase
pnpx supabase stop    # Stop Supabase
pnpx supabase status  # Check status
```

---

## Summary

This document describes the **current production** frontend architecture of the Service Center application.

**Key Technologies:**
- **Next.js 15.5.4** with App Router and Server Components
- **React 19.1.0** with TypeScript 5
- **tRPC 11.6.0** for type-safe APIs
- **Tailwind CSS 4** with shadcn/ui
- **TanStack Query** for state management
- **react-hook-form** for form handling

**Key Characteristics:**
1. ✅ **Type safety first** - `type` over `interface`, Zod validation
2. ✅ **Server-first** - Server Components by default
3. ✅ **Design tokens** - Consistent theming with Tailwind
4. ✅ **Flat component structure** - All components in `src/components/`
5. ⚠️ **No testing** - Testing infrastructure not yet configured

**Known Limitations:**
- Components are in flat structure (not organized into subdirectories)
- No testing infrastructure
- No dedicated `types/` or `constants/` directories

For proposed improvements and future architecture, see [ui-architecture-next.md](ui-architecture-next.md).

---

**Document Version:** 2.0 (Current State)
**Generated by:** Winston (Architect Agent)
**Date:** 2025-10-23
