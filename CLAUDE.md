# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev          # Start development server on port 3025 with Turbopack
pnpm build        # Build for production with Turbopack
pnpm start        # Start production server on port 3025
```

### Code Quality
```bash
pnpm lint         # Run Biome linter
pnpm format       # Format code with Biome
```

### Database (Supabase)
```bash
supabase start    # Start local Supabase stack
supabase db diff  # Generate schema migrations
supabase migration up  # Apply migrations
```

Development server runs on `http://localhost:3025` and Supabase Studio on `http://localhost:54323`.

## Architecture Overview

### Technology Stack
- **Next.js 15.5.4** with App Router and Turbopack
- **React 19.1.0** with TypeScript
- **Supabase** for PostgreSQL database and authentication
- **tRPC + TanStack Query** (in migration - see TODOS.md)
- **Tailwind CSS 4** + **Shadcn/ui** for styling
- **Biome** for linting and formatting

### Database Design
Schema files in `docs/data/schemas/` serve as source of truth. Core entities:
- `profiles` - Extended user info with roles (Admin, Manager, Technician, Reception)
- `customers`, `products`, `parts` - Business entities
- `service_tickets` - Core workflow with automatic numbering (SV-YYYY-NNN)
- `service_ticket_parts`, `service_ticket_comments` - Related data

Row Level Security (RLS) enforces access control at database level.

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/dashboard/   # Protected routes
│   ├── (public)/login/     # Public routes
│   └── api/               # API routes (being migrated to tRPC)
├── components/
│   ├── ui/               # Shadcn/ui base components
│   └── ...               # Business components
├── lib/supabase/         # Supabase client configurations
└── hooks/                # Custom React hooks
```

### Current Migration Status
The project is migrating from REST API to tRPC + TanStack Query. Check `TODOS.md` for detailed migration plan:
- **Current**: `/api/setup` REST endpoint for initial configuration
- **Target**: Type-safe tRPC procedures with service role Supabase access
- **Components**: tRPC client setup, React Query providers, zod validation

### Development Workflow
1. Start Supabase: `supabase start`
2. Start Next.js: `pnpm dev`
3. For database changes:
   - Edit schemas in `docs/data/schemas/`
   - Copy to `supabase/schemas/`
   - Generate migration: `supabase db diff`
   - Apply: `supabase migration up`

### Key Patterns
- **Server Components by default** - Use 'use client' only when needed
- **Compound Components** - For complex UI (sidebar, data tables)
- **Service Role Access** - Server-side database operations bypass RLS
- **Automatic Calculations** - Ticket totals from parts + service fees
- **Role-based UI** - Different dashboard views per user role

### Authentication & Setup
- Initial setup at `/setup` creates admin user and configures system
- Supabase Auth handles user authentication
- Profile roles determine access levels and UI visibility
- Setup requires `SETUP_PASSWORD` environment variable
- please note we use .env, we dont use .env.local
- include pnpx when you run supabase
- after you change code a lot, in serveral files, make sure to pass pnpm build before marking the task done