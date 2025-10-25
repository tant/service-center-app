# 9. Testing Strategy

[← Previous: Coding Standards](08-coding-standards.md) | [Back to Index](../architecture.md) | [Next: Security →](10-security.md)

---

## 9.1 Current State

**Status:** ✅ E2E Testing Infrastructure Implemented (Oct 2025)

```mermaid
graph LR
    Previous[Previous State<br/>❌ No test suite]
    Current[Current State<br/>✅ Playwright E2E Tests]
    Future[Target State<br/>✅ Full Coverage]

    Previous --> Current
    Current --> Future

    style Previous fill:#FF6B6B
    style Current fill:#50C878
    style Future fill:#FFD700
```

**✅ Implemented:**
- ✅ Playwright E2E testing framework
- ✅ Test execution reports in `docs/qa/test-execution/`
- ✅ Automated test scripts for critical workflows
- ✅ Role-based permission tests (Story 01.00)
- ✅ Integration test suite (Story 01.18)
- ✅ Test configuration and setup

**Current Test Suite:**

| Test File | Purpose | Status |
|-----------|---------|--------|
| **tests/e2e/01-authentication.spec.ts** | Login/logout flows | ✅ Active |
| **tests/e2e/02-ticket-management.spec.ts** | Ticket CRUD operations | ✅ Active |
| **tests/e2e/03-customer-management.spec.ts** | Customer operations | ✅ Active |
| **tests/e2e/04-product-management.spec.ts** | Product catalog | ✅ Active |
| **tests/e2e/05-parts-inventory.spec.ts** | Parts inventory | ✅ Active |
| **tests/e2e/06-role-permissions.spec.ts** | RBAC testing | ✅ Active |

**Test Execution Reports:**
- `docs/qa/test-execution/TEST-EXECUTION-REPORT-AUTOMATED.md`
- `docs/qa/test-execution/SECURITY-TEST-REPORT.md`
- `docs/qa/test-execution/DATA-INTEGRITY-TEST-REPORT.md`
- `docs/qa/test-execution/FINAL-TEST-REPORT.md`

**Remaining Gaps:**
- Unit tests for utilities and hooks (planned)
- Integration tests for Phase 2 routers (partial)
- Component tests for UI (planned)

---

## 9.2 Testing Pyramid

```mermaid
graph TB
    subgraph "Target Testing Pyramid"
        E2E[E2E Tests<br/>10-20 tests<br/>Critical user flows]
        Integration[Integration Tests<br/>50-100 tests<br/>tRPC procedures, DB]
        Unit[Unit Tests<br/>200-500 tests<br/>Utils, hooks, components]
    end

    Unit --> Integration
    Integration --> E2E

    subgraph "Cost & Speed"
        Fast[Fast<br/>Cheap<br/>Many]
        Medium[Medium<br/>Moderate<br/>Some]
        Slow[Slow<br/>Expensive<br/>Few]
    end

    Unit -.-> Fast
    Integration -.-> Medium
    E2E -.-> Slow

    style Unit fill:#50C878
    style Integration fill:#4A90E2
    style E2E fill:#FFD700
```

**Recommended Distribution:**
- **70%** Unit tests - Functions, hooks, utilities
- **20%** Integration tests - API procedures, database operations
- **10%** E2E tests - Critical workflows (login, create ticket)

---

## 9.3 Phased Implementation Plan

```mermaid
timeline
    title Testing Roadmap
    section Phase 1 (Weeks 1-2)
        Setup : Vitest + React Testing Library
              : Test database configuration
              : First 20 unit tests (utils)
    section Phase 2 (Weeks 3-4)
        Unit Tests : Component testing
                   : Hook testing
                   : 100+ unit tests
    section Phase 3 (Weeks 5-6)
        Integration : tRPC procedure tests
                    : Database integration
                    : 50+ integration tests
    section Phase 4 (Weeks 7-8)
        E2E : Playwright setup
            : Critical flows
            : 10-20 E2E tests
    section Phase 5 (Ongoing)
        CI/CD : GitHub Actions
              : Pre-commit hooks
              : Coverage reporting
```

---

## 9.4 Recommended Technology Stack

```mermaid
graph TB
    subgraph "Unit & Integration Testing"
        Vitest[Vitest<br/>Test Runner]
        RTL[React Testing Library<br/>Component Testing]
        MSW[MSW<br/>API Mocking]
    end

    subgraph "E2E Testing"
        Playwright[Playwright<br/>Browser Automation]
    end

    subgraph "Utilities"
        Coverage[Vitest Coverage<br/>c8 Provider]
        DB[Supabase Test Instance<br/>Isolated DB]
    end

    Vitest --> RTL
    Vitest --> MSW
    RTL --> Coverage
    MSW --> DB

    Playwright --> DB

    style Vitest fill:#50C878
    style Playwright fill:#4A90E2
```

**Rationale:**

| Tool | Purpose | Why Chosen |
|------|---------|------------|
| **Vitest** | Unit/Integration testing | Fast, Vite-powered, Jest-compatible API |
| **React Testing Library** | Component testing | User-centric, encourages accessible code |
| **MSW** | API mocking | Intercepts network requests, realistic mocking |
| **Playwright** | E2E testing | Multi-browser, fast, reliable, trace viewer |
| **c8** | Coverage reporting | Built-in V8 coverage, fast |

**Why Not Alternatives:**
- ❌ **Jest** - Slower than Vitest, requires more config
- ❌ **Cypress** - Slower than Playwright, limited multi-tab support
- ❌ **Enzyme** - Outdated, implementation-focused (not user-focused)

---

## 9.5 Test Coverage Matrix

```mermaid
graph TB
    subgraph "Layer Coverage"
        Utils[Utilities<br/>Target: 90%]
        Hooks[React Hooks<br/>Target: 80%]
        Components[Components<br/>Target: 70%]
        API[tRPC Procedures<br/>Target: 80%]
        DB[Database Logic<br/>Target: 90%]
        E2E[User Flows<br/>Target: Critical paths]
    end

    Utils --> High[High Priority]
    DB --> High
    API --> High

    Hooks --> Medium[Medium Priority]
    Components --> Medium

    E2E --> Low[Lower Coverage<br/>High Value]

    style Utils fill:#50C878
    style DB fill:#50C878
    style API fill:#4A90E2
    style E2E fill:#FFD700
```

**Coverage Targets:**

| Layer | Target Coverage | Priority | Example |
|-------|----------------|----------|---------|
| **Utilities** | 90%+ | High | `formatCurrency()`, `sanitizeFilename()` |
| **Database Triggers** | 90%+ | High | Ticket number generation, status logging |
| **tRPC Procedures** | 80%+ | High | `tickets.create`, `customers.list` |
| **React Hooks** | 80%+ | Medium | `useTicketData()`, `useDebounce()` |
| **Components** | 70%+ | Medium | Forms, tables, modals |
| **E2E Flows** | Critical paths | High Value | Login, create ticket, assign technician |

---

## 9.6 Phase 1: Setup & Utilities (Weeks 1-2)

### 9.6.1 Install Dependencies

```bash
# Install Vitest and related tools
pnpm add -D vitest @vitest/ui @vitest/coverage-v8
pnpm add -D @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event
pnpm add -D msw
```

### 9.6.2 Configure Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'vitest.config.ts',
        '**/*.test.{ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 9.6.3 Setup File

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### 9.6.4 Example Utility Tests

```typescript
// src/utils/format-currency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format-currency';

describe('formatCurrency', () => {
  it('formats VND currency correctly', () => {
    expect(formatCurrency(50000)).toBe('50.000 ₫');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('0 ₫');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(1000000)).toBe('1.000.000 ₫');
  });

  it('handles decimals (rounds)', () => {
    expect(formatCurrency(50000.75)).toBe('50.001 ₫');
  });
});
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 9.7 Phase 2: Component & Hook Testing (Weeks 3-4)

### 9.7.1 Component Test Example

```typescript
// src/components/add-ticket-form.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTicketForm } from './add-ticket-form';

describe('AddTicketForm', () => {
  it('renders form fields', () => {
    render(<AddTicketForm />);

    expect(screen.getByLabelText(/customer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/issue description/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<AddTicketForm />);

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    expect(await screen.findByText(/customer is required/i)).toBeInTheDocument();
  });

  it('calls onSuccess when form submits', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<AddTicketForm onSuccess={onSuccess} />);

    // Fill out form
    await user.selectOptions(screen.getByLabelText(/customer/i), 'customer-1');
    await user.selectOptions(screen.getByLabelText(/product/i), 'product-1');
    await user.type(screen.getByLabelText(/issue/i), 'Screen broken');

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(expect.any(String)); // ticket ID
    });
  });
});
```

### 9.7.2 Hook Test Example

```typescript
// src/hooks/use-ticket-data.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTicketData } from './use-ticket-data';
import { createWrapper } from '../test-utils/trpc-wrapper';

describe('useTicketData', () => {
  it('fetches ticket data', async () => {
    const { result } = renderHook(() => useTicketData('ticket-id'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      id: 'ticket-id',
      ticket_number: expect.stringMatching(/^SV-\d{4}-\d{3}$/),
    });
  });
});
```

---

## 9.8 Phase 3: Integration Testing (Weeks 5-6)

### 9.8.1 Test Database Setup

```typescript
// src/test-utils/test-db.ts
import { createClient } from '@supabase/supabase-js';

export function getTestSupabase() {
  return createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function resetTestDatabase() {
  const supabase = getTestSupabase();

  // Clear all tables in order (FK dependencies)
  await supabase.from('service_ticket_attachments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('service_ticket_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('service_ticket_parts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('service_tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // ... more tables
}
```

### 9.8.2 tRPC Procedure Test Example

```typescript
// src/server/routers/tickets.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from './_app';
import { createTRPCContext } from '../trpc';
import { resetTestDatabase, seedTestData } from '@/test-utils/test-db';

describe('tickets router', () => {
  beforeEach(async () => {
    await resetTestDatabase();
    await seedTestData();
  });

  it('creates a ticket', async () => {
    const ctx = await createTRPCContext({ headers: new Headers() });
    const caller = appRouter.createCaller(ctx);

    const ticket = await caller.tickets.create({
      customer_id: 'test-customer-id',
      product_id: 'test-product-id',
      issue_description: 'Screen not working',
      priority_level: 'high',
    });

    expect(ticket).toMatchObject({
      ticket_number: expect.stringMatching(/^SV-\d{4}-\d{3}$/),
      status: 'pending',
      priority_level: 'high',
    });
  });

  it('enforces status flow', async () => {
    const ctx = await createTRPCContext({ headers: new Headers() });
    const caller = appRouter.createCaller(ctx);

    const ticket = await caller.tickets.create({ /* ... */ });

    // Should allow pending -> in_progress
    await expect(
      caller.tickets.updateStatus({
        id: ticket.id,
        status: 'in_progress',
      })
    ).resolves.toBeDefined();

    // Should NOT allow in_progress -> pending (one-way flow)
    await expect(
      caller.tickets.updateStatus({
        id: ticket.id,
        status: 'pending',
      })
    ).rejects.toThrow();
  });
});
```

---

## 9.9 Phase 4: E2E Testing (Weeks 7-8)

### 9.9.1 Playwright Setup

```bash
pnpm add -D @playwright/test
pnpx playwright install
```

**Configuration:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:3025',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3025',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 9.9.2 E2E Test Example

```typescript
// e2e/ticket-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Ticket Creation Flow', () => {
  test('admin can create a ticket', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');

    // Navigate to tickets
    await page.click('text=Tickets');
    await expect(page).toHaveURL('/tickets');

    // Click create ticket
    await page.click('text=New Ticket');

    // Fill form
    await page.selectOption('[name="customer_id"]', { index: 1 });
    await page.selectOption('[name="product_id"]', { index: 1 });
    await page.fill('[name="issue_description"]', 'Screen is broken');
    await page.selectOption('[name="priority_level"]', 'high');

    // Submit
    await page.click('button:has-text("Create Ticket")');

    // Verify success
    await expect(page.locator('text=/SV-\\d{4}-\\d{3}/')).toBeVisible();
  });
});
```

---

## 9.10 Phase 5: CI/CD Integration

```mermaid
graph LR
    Push[Git Push] --> GHA[GitHub Actions]
    GHA --> Lint[Biome Lint]
    GHA --> TypeCheck[TypeScript Check]
    GHA --> UnitTests[Unit Tests]
    GHA --> IntTests[Integration Tests]

    Lint --> Build{Build Pass?}
    TypeCheck --> Build
    UnitTests --> Build
    IntTests --> Build

    Build -->|Yes| Deploy[Deploy]
    Build -->|No| Fail[Fail & Notify]

    style Build fill:#FFD700
    style Deploy fill:#50C878
    style Fail fill:#FF6B6B
```

**GitHub Actions Workflow:**

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: supabase/postgres:15.1.1.54
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 54322:5432

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm tsc --noEmit

      - name: Unit tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
```

**Pre-commit Hook:**

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint
pnpm tsc --noEmit
pnpm test
```

---

## 9.11 Test Types Summary

```mermaid
graph TB
    subgraph "Test Types"
        Unit[Unit Tests<br/>✅ Fast<br/>✅ Isolated<br/>Example: formatCurrency]
        Component[Component Tests<br/>✅ User-focused<br/>✅ Render testing<br/>Example: AddTicketForm]
        Integration[Integration Tests<br/>✅ Database<br/>✅ API procedures<br/>Example: tickets.create]
        E2E[E2E Tests<br/>✅ Full workflow<br/>✅ Browser automation<br/>Example: Login → Create Ticket]
    end

    Unit --> Component
    Component --> Integration
    Integration --> E2E

    style Unit fill:#50C878
    style Component fill:#4A90E2
    style Integration fill:#FFD700
    style E2E fill:#FF8C00
```

---

## 9.12 Testing Best Practices

**DO:**
- ✅ Test behavior, not implementation
- ✅ Use React Testing Library queries (`getByRole`, `getByLabelText`)
- ✅ Reset database between integration tests
- ✅ Mock external APIs (but not tRPC procedures)
- ✅ Write descriptive test names (`it('creates ticket with auto-generated number')`)
- ✅ Aim for high coverage on critical paths

**DON'T:**
- ❌ Test implementation details (`wrapper.instance()`)
- ❌ Use `getByTestId` as first choice (accessibility matters)
- ❌ Share state between tests
- ❌ Mock everything (integration tests need real DB)
- ❌ Ignore flaky tests (fix or remove)
- ❌ Chase 100% coverage on UI (diminishing returns)

---

## 9.13 Monitoring Test Health

**Metrics to Track:**
- Overall coverage percentage
- Test execution time (keep under 5 minutes)
- Flaky test rate (should be 0%)
- Failed test resolution time
- Coverage trend over time

**Tools:**
- **Codecov** - Coverage reporting and trending
- **GitHub Actions** - CI/CD pipeline
- **Vitest UI** - Interactive test runner
- **Playwright Trace Viewer** - Debug E2E failures

---

## Next Steps

Continue to [Security →](10-security.md) to understand the application's defense-in-depth security model.

---

[← Previous: Coding Standards](08-coding-standards.md) | [Back to Index](../architecture.md) | [Next: Security →](10-security.md)
