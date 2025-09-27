# Service Center Project - Qwen Context

## Project Overview

This is a Next.js 15.5.4 application called "Service Center" that was bootstrapped with `create-next-app`. The project uses TypeScript, Tailwind CSS with the new `@tailwindcss/postcss` plugin, and implements a modern UI with components from Radix UI and shadcn/ui. The application integrates with Supabase for backend services (authentication, database, storage) and uses several libraries for UI functionality including drag-and-drop (@dnd-kit), data tables (@tanstack/react-table), and charts (recharts).

## Key Technologies & Dependencies

- **Framework**: Next.js 15.5.4 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 with custom theme definitions, Geist/Geist Mono fonts
- **UI Components**: Radix UI primitives, with additional UI libraries
- **Database/Authentication**: Supabase (client library: `@supabase/supabase-js`)
- **Drag & Drop**: @dnd-kit libraries
- **Data Tables**: @tanstack/react-table
- **Charts**: recharts
- **Icons**: Lucide React and Tabler Icons
- **State Management**: Zod for schema validation
- **Notifications**: Sonner
- **Code Quality**: Biome for linting and formatting

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (auth)/          # Authentication-related routes
│   ├── (public)/        # Public routes
│   ├── globals.css      # Global styles and Tailwind configuration
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # UI components
│   ├── ui/             # Reusable UI components
│   └── various .tsx files # Custom components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and shared libraries
```

## Building and Running

### Development
```bash
# Start the development server (port 3025)
pnpm dev

# Start Supabase locally (if needed)
pnpx supabase start
```

### Production
```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

### Code Quality
```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

## Development Conventions

- **Port**: The application runs on port 3025 (both dev and start scripts)
- **Code Formatting**: Biome is configured with 2-space indentation and Prettier-like rules
- **Styling**: Tailwind CSS with custom CSS variables for theming, including dark mode support
- **File Naming**: Component files use PascalCase (e.g., `AppSidebar.tsx`)
- **Path Aliases**: Uses `@/*` to reference files under `src/*`
- **Type Safety**: Strict TypeScript configuration with React 19 compatibility

## Supabase Integration

The project includes Supabase for backend services:
- API URL: http://127.0.0.1:54321
- Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Studio URL: http://127.0.0.1:54323
- Publishable key: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
- Secret key: sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz

## Special Features

- **Dark Mode**: Implemented with next-themes
- **Interactive Charts**: Using recharts with custom area chart component
- **Data Tables**: Custom data table implementation with sorting/filtering
- **Sidebar Navigation**: Custom sidebar component with main/secondary navigation
- **Form Handling**: Login form component with Supabase integration
- **Responsive Design**: Mobile-first responsive design with Tailwind CSS
- **Accessibility**: Radix UI components that follow WAI-ARIA standards

## Configuration Files

- `next.config.ts`: Next.js configuration with allowed development origins
- `tsconfig.json`: TypeScript configuration with path aliases and Next.js plugin
- `biome.json`: Biome configuration for linting and formatting
- `tailwind.config.ts`: (Not explicitly visible but likely exists for Tailwind CSS v4 usage)
- `postcss.config.mjs`: PostCSS configuration for Tailwind CSS

## Notes

The project appears to be in early development stage with authentication and public route sections indicating a planned login/logout flow. The README mentions Supabase is running locally for development, suggesting this is a full-stack application with database-driven functionality.