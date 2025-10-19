# Service Center Management System

A full-stack warranty and repair management application built with Next.js, Supabase, and tRPC for managing service tickets, inventory, customers, and products.

## Overview

This application helps service centers manage daily operations including customer tracking, product inventory management, warranty service ticket workflows, and parts inventory management. Built with modern web technologies to ensure reliability and scalability.

## Key Features

- 🎫 **Service Ticket Management** - Complete workflow from intake to completion with status tracking
- 📦 **Parts Inventory Management** - Real-time stock tracking with automatic quantity updates
- 👥 **Customer Management** - Comprehensive customer database with service history
- 🛠️ **Product Catalog** - Product management with compatible parts relationships
- 👤 **Role-Based Access Control** - Four user roles: Admin, Manager, Technician, and Reception
- 💾 **File Storage** - Secure uploads for avatars, product images, and service ticket attachments
- 📊 **Real-time Updates** - Live data synchronization powered by Supabase
- 🔒 **Row-Level Security** - Database-level access control for data protection
- 📈 **Analytics Dashboard** - Revenue tracking, customer growth, and performance metrics
- 💬 **Comment System** - Internal notes and customer-facing communication threads

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **UI Library**: React 19.1.0 with TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Type Safety**: End-to-end type safety with tRPC
- **Icons**: Tabler Icons + Lucide React
- **Charts**: Recharts for data visualization

### Backend
- **API**: tRPC 11.6.0 for type-safe API routes
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with JWT
- **Storage**: Supabase Storage for file uploads
- **Real-time**: Supabase Realtime subscriptions

### Development Tools
- **Build Tool**: Turbopack (Next.js 15)
- **Package Manager**: pnpm
- **Linting/Formatting**: Biome 2.2.0
- **Database Migrations**: Supabase CLI with declarative schemas
- **Local Development**: Docker-based Supabase local stack

## Quick Start

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

```bash
# Clone and install
git clone https://github.com/tantran/service-center-app
cd service-center-app
pnpm install

# Set up environment
cp .env.example .env

# Start Supabase and set up database
pnpx supabase start
./docs/data/schemas/setup_schema.sh

# Start development server
pnpm dev
```

Visit `http://localhost:3025` and complete setup at the `/setup` endpoint.

## Project Structure

```
service-center/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Protected routes (require authentication)
│   │   ├── (public)/          # Public routes
│   │   └── api/               # tRPC API routes
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui base components
│   │   └── ...               # Business components
│   ├── server/               # tRPC server
│   │   └── routers/         # API route handlers
│   ├── lib/                  # Utilities and configurations
│   ├── utils/                # Helper functions
│   └── hooks/                # Custom React hooks
├── docs/
│   └── data/
│       ├── schemas/          # Database schema definitions
│       └── seeds/            # Seed data scripts
├── supabase/                 # Supabase configuration
│   ├── config.toml
│   └── migrations/          # Generated migrations
└── .env                     # Environment variables (git-ignored)
```

## Database Schema

Core entities and their relationships:

### User Management
- **profiles** - Extended user information with roles (Admin, Manager, Technician, Reception)

### Business Data
- **customers** - Customer information with phone-based lookup
- **brands** - Product brand management
- **products** - Service-able products with warranty periods
- **parts** - Spare parts/components with stock tracking

### Service Workflow
- **service_tickets** - Core workflow entity with auto-numbering (SV-YYYY-NNN)
- **service_ticket_parts** - Parts used in service tickets (junction table)
- **service_ticket_comments** - Communication history and audit trail
- **service_ticket_attachments** - Image attachments for tickets

### Key Features
- Automatic timestamps (`created_at`, `updated_at`)
- Audit trails (`created_by`, `updated_by`)
- Row-Level Security (RLS) policies
- Optimized indexes for performance
- Generated columns for automatic calculations
- Database triggers for workflow automation

## Service Ticket Workflow

The system enforces a one-way status flow to ensure data integrity:

```
pending → in_progress → completed
   ↓            ↓
 cancelled   cancelled
```

**Key Features:**
- Terminal state enforcement (completed/cancelled tickets cannot be modified)
- Automatic ticket numbering (format: SV-YYYY-NNN)
- Cost calculation: `total_cost = service_fee + diagnosis_fee + parts_total - discount_amount`
- Automatic status change logging for audit trail
- Technician assignment tracking
- Warranty type support (warranty, paid, goodwill)

## User Roles & Permissions

### Admin
- Full system access
- Manage all entities
- Create/edit/delete users
- System configuration

### Manager
- Create/edit/delete products, parts, brands
- Manage customer data
- Delete service tickets
- Edit own profile

### Technician
- View assigned tickets
- Add comments and attachments
- Update ticket status
- Read-only access to customer/product info

### Reception
- Create new service tickets
- View/update customers
- Read-only access to most data

All permissions are enforced at the database level through Row-Level Security policies.

## Development Commands

```bash
# Development
pnpm dev          # Start dev server with hot reload (port 3025)
pnpm build        # Build for production with Turbopack
pnpm start        # Run production server (port 3025)

# Code Quality
pnpm lint         # Run Biome linter
pnpm format       # Auto-format code with Biome

# Database
pnpx supabase start           # Start Supabase services
pnpx supabase stop            # Stop Supabase services
pnpx supabase status          # Check service status
pnpx supabase db reset        # Reset database (deletes all data)
pnpx supabase db diff         # Generate migration from schema changes
pnpx supabase migration up    # Apply pending migrations
```

## API Architecture

The application uses **tRPC** for type-safe API communication:

### Available Routers
- `admin` - Setup and initial configuration
- `profile` - User profile management
- `tickets` - Service ticket CRUD operations
- `customers` - Customer management
- `products` - Product catalog management
- `parts` - Parts inventory management
- `brands` - Brand management
- `revenue` - Revenue analytics

### Input Validation
All inputs are validated using Zod schemas:
- Phone format validation (10+ characters)
- Email format validation
- UUID validation for IDs
- Enum validation for status transitions
- Numeric range validation for prices and quantities

## File Upload & Storage

- **Vietnamese Character Support** - Filename sanitization for Vietnamese diacritics
- **Supabase Storage** - Secure upload with isolated paths per entity type
- **Image Attachments** - Linked to service tickets for documentation
- **Sanitization** - Removes special characters for filesystem compatibility

## Analytics & Reporting

Dashboard provides comprehensive analytics:
- **Revenue Metrics** - Current vs previous month comparison
- **Customer Growth** - New customers with month-over-month percentage
- **Ticket Statistics** - By status, priority, and assigned staff
- **Parts Metrics** - New parts added and stock status
- **Employee Performance** - Tickets handled and completion rates
- **Interactive Charts** - Trend visualization with Recharts

## Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development environment setup and contribution guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide (Vietnamese)
- **[CLAUDE.md](./CLAUDE.md)** - Guide for Claude Code AI assistant
- **[docs/data/schemas/](./docs/data/schemas/)** - Database schema documentation

## Deployment

Two deployment methods are available:

### Docker + Cloudflare Tunnel (Recommended)

**Advantages:**
- Simple setup without requiring public IP
- No SSL certificate management needed
- Built-in DDoS protection via Cloudflare
- Multi-instance support on a single server

**Requirements:**
- Ubuntu VPS (public IP not required)
- Docker Engine + Docker Compose
- Cloudflare account (free tier)
- Domain added to Cloudflare

**Quick Start:**
```bash
# Clone and configure
git clone https://github.com/tantran/service-center-app
cd service-center-app
cp .env.example .env
nano .env

# Deploy
./docker/scripts/setup-instance.sh
./docker/scripts/deploy.sh

# Setup Cloudflare Tunnel
cloudflared tunnel login
cloudflared tunnel create service-center
# Configure and you're done!
```

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions (Vietnamese).**

### Cloud Platforms (Managed Services)

**Supabase Cloud + Vercel/Railway:**
1. Create Supabase project at [supabase.com](https://supabase.com)
2. Link project: `pnpx supabase link --project-ref <ref>`
3. Push schema: `pnpx supabase db push`
4. Deploy frontend to Vercel/Railway
5. Configure environment variables

## Environment Variables

Required environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=         # Your Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (server-side only)

# Application Setup
SETUP_PASSWORD=                    # Password for initial setup
ADMIN_EMAIL=                       # Initial admin email
ADMIN_PASSWORD=                    # Initial admin password
ADMIN_NAME=                        # Initial admin name
```

## Multi-Instance Deployment

The system supports multiple isolated instances on a single server:

- Each instance has its own isolated database
- Unique port configuration per instance
- Separate Docker networks for isolation
- Independent Cloudflare Tunnel domains

**Resource Requirements per Instance:**
- RAM: 2-3 GB
- Disk: 500 MB + data growth
- CPU: Moderate

**Recommended Server Specs:**
- 8 GB RAM → 1-2 instances
- 16 GB RAM → 4-6 instances
- 32 GB RAM → 10-12 instances

See [DEPLOYMENT.md](./DEPLOYMENT.md) for multi-instance setup guide.

## Security Features

- **JWT Authentication** - Secure token-based authentication via Supabase Auth
- **Row-Level Security** - Database-level access control policies
- **Role-Based Access** - Four distinct user roles with granular permissions
- **Input Validation** - Zod schema validation on all inputs
- **SQL Injection Prevention** - Supabase client abstraction
- **Secure File Upload** - Filename sanitization and path isolation
- **HTTP-Only Cookies** - Secure session token storage

## Contributing

Before submitting a pull request:

1. Code follows style guidelines (run `pnpm lint`)
2. Build passes locally (`pnpm build`)
3. Database migrations tested
4. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
5. Branch is up to date with `main`

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed contribution guidelines.

## Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check the `docs/` folder for detailed documentation
- **Questions**: Contact Tan Tran at [me@tantran.dev](mailto:me@tantran.dev)
- **Website**: [www.tantran.dev](https://www.tantran.dev)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

**Built with ❤️ by [Tan Tran](https://www.tantran.dev) for efficient service center management**

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Type-safe APIs with [tRPC](https://trpc.io/)
