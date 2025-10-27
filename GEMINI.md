# GEMINI.md

This document provides a comprehensive overview of the Service Center Management System project, intended as a guide for AI-assisted development.

## Project Overview

This is a full-stack web application designed to manage the operations of a warranty and repair service center. It includes features for handling service tickets, managing customers, tracking product and parts inventory, and enforcing role-based access control for staff.

### Core Technologies

*   **Framework**: Next.js 15.5.4 (with App Router & Turbopack)
*   **Language**: TypeScript
*   **API Layer**: tRPC for end-to-end type-safe APIs.
*   **Database & Backend**: Supabase (PostgreSQL, Auth, Storage).
*   **Styling**: Tailwind CSS with shadcn/ui components.
*   **Code Quality**: Biome for linting and formatting.
*   **Testing**: Playwright for end-to-end tests.
*   **Local Environment**: Docker Compose for running the Supabase stack locally.

### Architecture

The project follows a standard monorepo structure for a Next.js application.
*   The frontend is built with React 19 and server components.
*   The backend API is built using tRPC, with routers defined in `src/server/routers/`.
*   The database schema, policies, and functions are managed declaratively in the `supabase/` directory.
*   Authentication is handled by Supabase Auth, with role-based access control (RBAC) enforced by database-level Row-Level Security (RLS) policies.

## Building and Running

The project uses `pnpm` as its package manager.

### Key Commands

*   **Run in Development Mode:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:3025`.

*   **Build for Production:**
    ```bash
    pnpm build
    ```

*   **Run Production Server:**
    ```bash
    pnpm start
    ```

*   **Linting & Formatting:**
    ```bash
    # Check for issues
    pnpm lint

    # Automatically fix format
    pnpm format
    ```

### Testing

End-to-end tests are managed with Playwright.

*   **Run All Tests:**
    ```bash
    npx playwright test
    ```

*   **Run a Specific File:**
    ```bash
    npx playwright test e2e-tests/03-rbac-permissions.spec.ts
    ```

## Development Conventions

*   **API:** All backend logic should be exposed via tRPC routers in `src/server/routers/`. New routers must be added to `_app.ts`.
*   **Database:** Schema changes should be made in the SQL files within `supabase/migrations`. Use the Supabase CLI to manage migrations.
*   **Styling:** Use Tailwind CSS utility classes and shadcn/ui components for consistency.
*   **Testing:** E2E tests are located in the `e2e-tests/` directory. A global setup file (`global.setup.ts`) is used to seed the database with required users and brands before tests run.
*   **State Management:** Client-side state and server-caching are handled by TanStack Query (React Query) via the tRPC client.
