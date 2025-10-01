# Development Guide

This guide will help you set up your local development environment and start contributing to the Service Center Management System.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Code Style & Standards](#code-style--standards)
- [Database Development](#database-development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Prerequisites

Ensure you have the following installed before starting:

### Required
- ✅ **Node.js** 20+ ([Download](https://nodejs.org/))
- ✅ **pnpm** 8+ ([Install](https://pnpm.io/installation))
  ```bash
  npm install -g pnpm
  ```
- ✅ **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- ✅ **Git** ([Download](https://git-scm.com/))

### Recommended
- **VS Code** with extensions:
  - Biome (for linting/formatting)
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Supabase (for SQL syntax highlighting)

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/tant/service-center-app
cd service-center-app
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all project dependencies defined in `package.json`.

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set a secure `SETUP_PASSWORD`:

```bash
SETUP_PASSWORD=your_secure_password_here
```

> **Note**: Other variables will be populated after starting Supabase in the next step.

### 4. Start Docker

Ensure Docker Desktop is running. You can verify with:

```bash
docker ps
```

### 5. Start Supabase Local Stack

```bash
pnpx supabase start
```

This command will:
- Download and start all Supabase services (PostgreSQL, Auth, Storage, etc.)
- Output important credentials

**Important**: Copy these values to your `.env` file:

```bash
# From Supabase output:
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable key>
SUPABASE_SERVICE_ROLE_KEY=<Secret key>
SUPABASE_SERVICE_ROLE_JWT=<Secret key>  # Same as above
```

### 6. Set Up Database Schema

Run the automated setup script:

```bash
./docs/data/schemas/setup_schema.sh
```

This script will:
- Copy schema files to `supabase/schemas/`
- Create storage buckets
- Generate and apply migrations
- Set up all tables, functions, and RLS policies

**Verify** by visiting [Supabase Studio](http://127.0.0.1:54323):
- Tables tab should show all tables
- Storage tab should show 3 buckets

### 7. Start Development Server

```bash
pnpm dev
```

Application will be available at **http://localhost:3025**

### 8. Complete Initial Setup

1. Navigate to `http://localhost:3025/setup`
2. Enter your `SETUP_PASSWORD`
3. Admin account will be created using credentials from `.env`
4. You'll be redirected to login

### 9. Log In

Use the admin credentials from your `.env` file:
- Email: Value of `ADMIN_EMAIL`
- Password: Value of `ADMIN_PASSWORD`

---

## Development Workflow

### Daily Workflow

```bash
# 1. Ensure Supabase is running
pnpx supabase status

# 2. Start it if needed
pnpx supabase start

# 3. Start dev server
pnpm dev

# 4. Start coding!
```

### Available Commands

```bash
# Development
pnpm dev          # Start dev server with hot reload
pnpm build        # Build for production (test locally)
pnpm start        # Run production build locally

# Code Quality
pnpm lint         # Run Biome linter
pnpm format       # Auto-format code with Biome

# Database
pnpx supabase start           # Start Supabase services
pnpx supabase stop            # Stop Supabase services
pnpx supabase status          # Check service status
pnpx supabase db reset        # Reset database (⚠️ DELETES ALL DATA)
pnpx supabase db diff         # Generate migration from schema changes
pnpx supabase migration up    # Apply pending migrations
```

### Git Workflow

We follow a feature branch workflow:

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make your changes and commit
git add .
git commit -m "feat: add new feature description"

# 3. Push to remote
git push origin feature/your-feature-name

# 4. Create Pull Request on GitHub
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(tickets): add ticket status filter"
git commit -m "fix(auth): resolve login redirect issue"
git commit -m "docs: update database schema documentation"
```

---

## Project Structure

### Source Code (`src/`)

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Protected routes (require login)
│   │   ├── dashboard/
│   │   ├── tickets/
│   │   ├── customers/
│   │   ├── products/
│   │   └── ...
│   ├── (public)/            # Public routes
│   │   ├── login/
│   │   └── setup/
│   ├── api/                 # API routes
│   │   ├── trpc/           # tRPC router
│   │   └── ...
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/
│   ├── ui/                  # shadcn/ui base components
│   ├── forms/              # Form components
│   ├── tables/             # Data table components
│   └── ...
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── utils.ts            # Utility functions
│   └── constants.ts        # App constants
└── hooks/                   # Custom React hooks
    ├── use-auth.ts
    └── ...
```

### Database (`docs/data/`)

```
docs/data/
├── schemas/                 # Schema definitions (SOURCE OF TRUTH)
│   ├── 00_base_functions.sql
│   ├── core_01_profiles.sql
│   ├── core_02_customers.sql
│   ├── ...
│   ├── storage_policies.sql
│   └── setup_schema.sh     # Automated setup script
└── seeds/                   # Seed data
    └── storage_buckets.sql
```

---

## Code Style & Standards

### TypeScript

- ✅ Use TypeScript for all new files
- ✅ Avoid `any` type - use proper typing
- ✅ Use type inference where possible
- ✅ Export types for reusability

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = (id: string): Promise<User> => {
  // ...
}

// ❌ Bad
const getUser = (id: any): any => {
  // ...
}
```

### React Components

- ✅ Use functional components with hooks
- ✅ Server Components by default (Next.js 15)
- ✅ Use `"use client"` directive only when needed
- ✅ Extract reusable logic into custom hooks

```typescript
// ✅ Server Component (default)
export default async function TicketsPage() {
  const tickets = await getTickets();
  return <TicketList tickets={tickets} />;
}

// ✅ Client Component (when needed)
"use client";

export function TicketForm() {
  const [status, setStatus] = useState("pending");
  // ...
}
```

### File Naming

- **Components**: PascalCase (e.g., `TicketForm.tsx`)
- **Utilities**: kebab-case (e.g., `format-date.ts`)
- **Hooks**: kebab-case with `use-` prefix (e.g., `use-auth.ts`)
- **Types**: kebab-case with `.types.ts` suffix (e.g., `ticket.types.ts`)

### Code Formatting

We use **Biome** for linting and formatting:

```bash
# Format code
pnpm format

# Check for linting issues
pnpm lint
```

Configuration is in `biome.json`. The formatter runs automatically on save if you have the Biome VS Code extension.

---

## Database Development

### Schema Organization

Schemas are organized in `docs/data/schemas/`:

- `00_base_functions.sql` - Common functions
- `core_*.sql` - Core table definitions
- `functions_*.sql` - Business logic functions
- `storage_policies.sql` - Storage RLS policies

### Making Schema Changes

#### Option 1: Automated (Recommended for Fresh Setup)

```bash
# 1. Edit schema files in docs/data/schemas/
vim docs/data/schemas/core_06_service_tickets.sql

# 2. Run setup script (handles everything)
./docs/data/schemas/setup_schema.sh
```

#### Option 2: Manual Migration (Recommended for Incremental Changes)

```bash
# 1. Edit schema files
vim docs/data/schemas/core_06_service_tickets.sql

# 2. Copy to supabase/schemas/
cp docs/data/schemas/core_06_service_tickets.sql supabase/schemas/

# 3. Generate migration
pnpx supabase db diff -f add_ticket_priority

# 4. Review the generated migration
cat supabase/migrations/*_add_ticket_priority.sql

# 5. Apply migration
pnpx supabase migration up

# 6. Verify in Supabase Studio
```

### Schema Best Practices

- ✅ Always update `docs/data/schemas/` first (source of truth)
- ✅ Use descriptive migration names
- ✅ Test migrations locally before committing
- ✅ Include rollback steps in comments for complex migrations
- ✅ Use `(SELECT auth.uid())` for RLS performance
- ✅ Add `SET search_path = ''` to all functions for security

### Database Naming Conventions

- **Tables**: snake_case, plural (e.g., `service_tickets`)
- **Columns**: snake_case (e.g., `created_at`)
- **Indexes**: `{table}_{column}_idx` (e.g., `tickets_status_idx`)
- **Policies**: `{table}_{operation}_policy` (e.g., `tickets_select_policy`)
- **Functions**: snake_case, verb_noun (e.g., `update_ticket_status`)

---

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

- ✅ Build succeeds: `pnpm build`
- ✅ Linting passes: `pnpm lint`
- ✅ Feature works in browser
- ✅ Database migrations apply cleanly
- ✅ No console errors
- ✅ Responsive on mobile and desktop

### Testing Database Changes

```bash
# Reset database to clean state
pnpx supabase db reset

# Run setup script
./docs/data/schemas/setup_schema.sh

# Verify in Supabase Studio
# Test your feature
```

---

## Troubleshooting

### Supabase Won't Start

```bash
# Check Docker is running
docker ps

# Stop and restart Supabase
pnpx supabase stop
pnpx supabase start
```

### Schema Setup Fails

```bash
# Ensure Supabase is running
pnpx supabase status

# Reset and try again
pnpx supabase db reset
./docs/data/schemas/setup_schema.sh
```

### Port 3025 Already in Use

```bash
# Kill process on port 3025
lsof -ti:3025 | xargs kill -9

# Or use different port
pnpm dev -- -p 3000
```

### Database Changes Not Reflecting

```bash
# Hard reset
pnpx supabase db reset
./docs/data/schemas/setup_schema.sh

# Restart dev server
pnpm dev
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Build again
pnpm build
```

### Type Errors

```bash
# Regenerate tRPC types
# (Restart TypeScript server in VS Code)
# CMD/CTRL + Shift + P → "TypeScript: Restart TS Server"
```

---

## Contributing

### Before Submitting a PR

1. ✅ Code follows style guidelines
2. ✅ Build passes locally (`pnpm build`)
3. ✅ Linting passes (`pnpm lint`)
4. ✅ Database migrations tested
5. ✅ Commit messages follow convention
6. ✅ Branch is up to date with `main`

### PR Guidelines

- **Title**: Use conventional commit format
- **Description**: Explain what and why (not how)
- **Screenshots**: Include for UI changes
- **Testing**: Describe how you tested
- **Breaking Changes**: Call out if applicable

### Code Review Process

1. Submit PR with clear description
2. Address review comments
3. Maintain conversation until approved
4. Squash commits if requested
5. Maintainer will merge when ready

---

## Need Help?

- 📚 **Documentation**: Check `docs/` folder
- 💬 **Questions**: Contact the development team
- 🐛 **Issues**: Create GitHub issue with reproduction steps

---

**Happy coding! 🚀**
