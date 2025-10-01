# Service Center Management System

A full-stack service center management application built with Next.js, Supabase, and tRPC for managing service tickets, parts inventory, customers, and products.

## Overview

This application helps service centers manage their daily operations including customer tracking, product inventory, service ticket workflows, and parts management. Built with modern web technologies for reliability and scalability.

## Key Features

- 🎫 **Service Ticket Management** - Complete workflow from receipt to completion with status tracking
- 📦 **Parts Inventory** - Real-time stock tracking with automatic quantity updates
- 👥 **Customer Management** - Comprehensive customer database with service history
- 🛠️ **Product Catalog** - Product management with compatible parts relationships
- 👤 **Role-Based Access Control** - Four role types: Admin, Manager, Technician, and Reception
- 💾 **File Storage** - Secure upload for avatars, product images, and service documentation
- 📊 **Real-time Updates** - Live data synchronization powered by Supabase
- 🔒 **Row-Level Security** - Database-level access control for data protection

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5 with App Router and Turbopack
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Type Safety**: End-to-end type safety with tRPC

### Backend
- **API**: tRPC for type-safe API routes
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with JWT
- **Storage**: Supabase Storage for file uploads
- **Real-time**: Supabase Realtime subscriptions

### Development Tools
- **Build Tool**: Turbopack (Next.js 15)
- **Package Manager**: pnpm
- **Linting/Formatting**: Biome
- **Database Migrations**: Supabase CLI with declarative schemas
- **Local Development**: Docker-based Supabase local stack

## Quick Start

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

```bash
# Clone and install
git clone https://github.com/tant/service-center-app
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

Visit `http://localhost:3025` and complete setup at `/setup` endpoint.

## Project Structure

```
service-center/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Protected routes
│   │   ├── (public)/          # Public routes
│   │   └── api/               # tRPC API routes
│   ├── components/            # React components
│   ├── lib/                   # Utilities and configurations
│   └── hooks/                 # Custom React hooks
├── docs/
│   └── data/
│       ├── schemas/           # Database schema definitions
│       └── seeds/             # Seed data scripts
├── supabase/                  # Supabase configuration
│   ├── config.toml
│   └── migrations/           # Generated migrations
└── .env                      # Environment variables (git-ignored)
```

## Database Schema

Core entities and their relationships:

- **Users & Auth**: `profiles` table extends Supabase Auth
- **Business Data**: `customers`, `products`, `parts`
- **Service Workflow**: `service_tickets`, `service_ticket_parts`, `service_ticket_comments`
- **Relationships**: `product_parts` (many-to-many)

All tables include:
- Automatic timestamps (`created_at`, `updated_at`)
- Audit trails (`created_by`, `updated_by`)
- Row-Level Security (RLS) policies
- Optimized indexes for performance

## Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development environment setup and contribution guide
- **[docs/data/schemas/README.md](./docs/data/schemas/README.md)** - Database schema documentation
- **[CLAUDE.md](./CLAUDE.md)** - Claude Code AI assistant instructions

## Deployment

### Prerequisites
- Supabase account ([sign up](https://supabase.com))
- Hosting platform (Vercel, Railway, etc.)

### Steps
1. Create Supabase project and note credentials
2. Link local project: `pnpx supabase link --project-ref <ref>`
3. Push schema: `pnpx supabase db push`
4. Deploy frontend to hosting platform
5. Configure environment variables

See [DEVELOPMENT.md](./DEVELOPMENT.md#production-deployment) for detailed deployment instructions.

## Support & Contributing

- **Issues**: Report bugs or request features via GitHub Issues
- **Contributing**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for contribution guidelines
- **Questions**: Contact the development team

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

**Made with ❤️ for efficient service center management**
