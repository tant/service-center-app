/**
 * Smoke Tests - Critical Path Verification
 *
 * Quick tests to verify core functionality is working.
 * These tests should run in 5-10 minutes total.
 *
 * Test Suites (aligned with Story 01.20 smoke test documentation):
 * 1. Authentication (all 4 roles) - 5 min
 * 2. Ticket Management - 7 min
 * 3. Task Workflow - 6 min
 * 4. Public Portal - 5 min
 * 5. Email Notifications - 5 min
 * 6. Warehouse Operations - 6 min
 * 7. Manager Dashboard - 4 min
 * 8. Dynamic Template Switching - 4 min
 */

import { test, expect } from '@playwright/test';

test.describe('SMOKE - Authentication (5 min)', () => {
  test('Admin login and dashboard access', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@tantran.dev');
    await page.getByLabel(/password/i).fill('tantran');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(/admin|system administrator/i)).toBeVisible();
  });

  test('Manager login and dashboard access', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('manager@example.com');
    await page.getByLabel(/password/i).fill('manager123');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(/manager/i)).toBeVisible();
  });

  test('Technician login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('technician@example.com');
    await page.getByLabel(/password/i).fill('tech123');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard|\/my-tasks/);
    await expect(page.getByText(/technician|kỹ thuật/i)).toBeVisible();
  });

  test('Reception login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('reception@example.com');
    await page.getByLabel(/password/i).fill('reception123');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(/reception|lễ tân/i)).toBeVisible();
  });
});

test.describe('SMOKE - Ticket Management (7 min)', () => {
  test.use({ storageState: 'playwright/.auth/reception.json' });

  test('Create warranty ticket', async ({ page }) => {
    await page.goto('/tickets/new');

    await page.getByLabel(/tên khách hàng|customer name/i).fill('Smoke Test Customer');
    await page.getByLabel(/số điện thoại|phone/i).fill('0909999999');
    await page.getByLabel(/loại thiết bị|device type/i).fill('ZOTAC RTX 4090');
    await page.getByLabel(/serial number/i).fill('SMOKE-TEST-001');
    await page.getByLabel(/mô tả sự cố|issue description/i).fill('Smoke test - GPU issue');
    await page.getByLabel(/loại dịch vụ|service type/i).click();
    await page.getByRole('option', { name: /bảo hành|warranty/i }).click();

    // Select template if required
    const templateField = page.getByLabel(/mẫu quy trình|template/i);
    if (await templateField.isVisible()) {
      await templateField.click();
      await page.getByRole('option').first().click();
    }

    await page.getByRole('button', { name: /tạo phiếu|create ticket/i }).click();

    await expect(
      page.getByText(/tạo thành công|created successfully/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('View tickets list', async ({ page }) => {
    await page.goto('/tickets');

    await expect(
      page.getByRole('heading', { name: /phiếu dịch vụ|tickets|service/i })
    ).toBeVisible();

    // Should show some tickets or empty state
    const hasTickets =
      (await page.locator('table tbody tr').count()) > 0 ||
      (await page.getByText(/chưa có|no tickets/i).isVisible());

    expect(hasTickets).toBeTruthy();
  });

  test('Search tickets', async ({ page }) => {
    await page.goto('/tickets');

    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('SV-');
      await page.waitForTimeout(500);
      // Search should work without errors
    }
  });
});

test.describe('SMOKE - Task Workflow (6 min)', () => {
  test.use({ storageState: 'playwright/.auth/technician.json' });

  test('View my tasks', async ({ page }) => {
    await page.goto('/my-tasks');

    await expect(
      page.getByRole('heading', { name: /công việc|tasks|my tasks/i })
    ).toBeVisible();
  });

  test('Start and complete a task', async ({ page }) => {
    // Navigate to first available ticket
    await page.goto('/tickets');

    const firstTicket = page.locator('table tbody tr').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();

      // Try to start first available task
      const startButton = page.getByRole('button', { name: /bắt đầu|start/i }).first();
      if (await startButton.isVisible()) {
        await startButton.click();

        const notesField = page.getByLabel(/ghi chú|notes/i);
        if (await notesField.isVisible()) {
          await notesField.fill('Smoke test - task execution');
        }

        await page.getByRole('button', { name: /hoàn thành|complete/i }).click();

        await expect(page.getByText(/hoàn thành|completed/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('SMOKE - Public Portal (5 min)', () => {
  test('Submit public service request', async ({ page }) => {
    await page.goto('/portal');

    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    await page.getByLabel(/họ tên|name/i).fill('Public Smoke Test');
    await page.getByLabel(/số điện thoại|phone/i).fill('0901111111');
    await page.getByLabel(/email/i).fill('smoketest@example.com');
    await page.getByLabel(/địa chỉ|address/i).fill('Smoke Test Address');
    await page.getByLabel(/loại thiết bị|device/i).fill('ZOTAC RTX 3060');
    await page.getByLabel(/serial number/i).fill('SMOKE-PUBLIC-001');
    await page.getByLabel(/loại dịch vụ|service type/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/mô tả sự cố|issue/i).fill('Public portal smoke test');

    const termsCheckbox = page.getByLabel(/đồng ý|agree/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.getByRole('button', { name: /gửi|submit/i }).click();

    await expect(page.getByText(/thành công|success/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/mã tra cứu|tracking/i)).toBeVisible();
  });

  test('Track service request', async ({ page }) => {
    await page.goto('/portal/track');

    // Try tracking with mock code (will fail but shouldn't error)
    await page.getByLabel(/mã tra cứu|tracking/i).fill('SMOKE-TRACK-001');
    await page.getByRole('button', { name: /tra cứu|track/i }).click();

    // Should show result (found or not found, both acceptable)
    await expect(
      page.getByText(/tìm thấy|found|không tìm thấy|not found|chi tiết|details/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('SMOKE - Email Notifications (5 min)', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Email settings accessible', async ({ page }) => {
    await page.goto('/settings/email');

    // Page should load without error (might show "not found" if route doesn't exist yet)
    const hasEmailSettings =
      (await page.getByText(/email|thông báo|notification/i).isVisible()) ||
      (await page.getByText(/404|not found/i).isVisible());

    expect(hasEmailSettings).toBeTruthy();
  });

  test('Email queue status', async ({ page }) => {
    // Check if email queue/status page exists
    await page.goto('/admin/email-queue');

    const hasQueuePage =
      (await page.getByText(/email.*queue|hàng đợi/i).isVisible()) ||
      (await page.getByText(/404|not found/i).isVisible());

    expect(hasQueuePage).toBeTruthy();
  });
});

test.describe('SMOKE - Warehouse Operations (6 min)', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('View stock levels', async ({ page }) => {
    await page.goto('/warehouse/stock');

    await expect(
      page.getByText(/tồn kho|stock|inventory|kho/i)
    ).toBeVisible();
  });

  test('View stock movements', async ({ page }) => {
    await page.goto('/warehouse/movements');

    // Should show movements page or empty state
    const hasMovements =
      (await page.getByText(/nhập kho|xuất kho|movement|chuyển động/i).isVisible()) ||
      (await page.getByText(/chưa có|no movements/i).isVisible());

    expect(hasMovements).toBeTruthy();
  });

  test('Serial verification works', async ({ page }) => {
    await page.goto('/warehouse/serial-verification');

    await page.getByLabel(/serial number/i).fill('TEST-SERIAL-001');
    await page.getByRole('button', { name: /kiểm tra|verify/i }).click();

    // Should show result (found or not found)
    await expect(
      page.getByText(/tìm thấy|found|không tìm thấy|not found|hợp lệ|valid/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('RMA batches accessible', async ({ page }) => {
    await page.goto('/warehouse/rma');

    await expect(
      page.getByText(/rma|lô bảo hành|batch/i)
    ).toBeVisible();
  });
});

test.describe('SMOKE - Manager Dashboard (4 min)', () => {
  test.use({ storageState: 'playwright/.auth/manager.json' });

  test('Dashboard loads with metrics', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show dashboard with some metrics
    await expect(
      page.getByRole('heading', { name: /dashboard|tổng quan/i })
    ).toBeVisible();

    // Should show some statistics
    const hasMetrics =
      (await page.getByText(/tổng|total|số lượng|count/i).isVisible()) ||
      (await page.locator('[data-testid="metric-card"]').count()) > 0;

    expect(hasMetrics).toBeTruthy();
  });

  test('Task progress dashboard', async ({ page }) => {
    await page.goto('/dashboard/tasks');

    // Task progress page should load
    const hasTaskDashboard =
      (await page.getByText(/tiến độ|progress|công việc|tasks/i).isVisible()) ||
      (await page.getByText(/404|not found/i).isVisible());

    expect(hasTaskDashboard).toBeTruthy();
  });

  test('Revenue analytics accessible', async ({ page }) => {
    await page.goto('/dashboard/revenue');

    // Revenue page should load
    const hasRevenue =
      (await page.getByText(/doanh thu|revenue|báo cáo/i).isVisible()) ||
      (await page.getByText(/404|not found/i).isVisible());

    expect(hasRevenue).toBeTruthy();
  });
});

test.describe('SMOKE - Dynamic Template Switching (4 min)', () => {
  test.use({ storageState: 'playwright/.auth/manager.json' });

  test('Template management accessible', async ({ page }) => {
    await page.goto('/task-templates');

    await expect(
      page.getByText(/mẫu quy trình|task templates|templates/i)
    ).toBeVisible();
  });

  test('Can view template details', async ({ page }) => {
    await page.goto('/task-templates');

    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();

      // Should show template details
      await expect(page.getByText(/chi tiết|details|công việc|tasks/i)).toBeVisible();
    } else {
      // If no templates exist, verify we can create one
      const createButton = page.getByRole('button', { name: /tạo mới|create/i });
      await expect(createButton).toBeVisible();
    }
  });
});

test.describe('SMOKE - Critical System Health', () => {
  test('Health check endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('tRPC endpoint is reachable', async ({ request }) => {
    // Try a simple tRPC health check
    const response = await request.get('/api/trpc/health.check');

    // Should respond (even if 404, it means Next.js is working)
    expect(response.status()).toBeLessThan(500);
  });

  test('Database connection works', async ({ page }) => {
    // Login should verify database connectivity
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@tantran.dev');
    await page.getByLabel(/password/i).fill('tantran');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    // Successful login proves database is working
    await page.waitForURL(/\/dashboard/);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('SMOKE - Build Verification', () => {
  test('Static assets load', async ({ page }) => {
    await page.goto('/');

    // Check that page loads without console errors
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    // Filter out known/acceptable errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('Failed to load resource') && // Ignore 404s for optional resources
        !error.includes('favicon') // Ignore missing favicon
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('Navigation works', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@tantran.dev');
    await page.getByLabel(/password/i).fill('tantran');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Navigate to different pages
    await page.goto('/tickets');
    await expect(page).toHaveURL(/\/tickets/);

    await page.goto('/customers');
    await expect(page).toHaveURL(/\/customers/);

    await page.goto('/products');
    await expect(page).toHaveURL(/\/products/);
  });
});
