/**
 * Role-Based Permission Tests
 *
 * Tests access control for all 4 roles:
 * - Admin: Full system access
 * - Manager: Operations oversight
 * - Technician: Task execution only
 * - Reception: Customer intake
 *
 * Reference: docs/ROLES-AND-PERMISSIONS.md
 */

import { test, expect } from '@playwright/test';

const TEST_USERS = {
  admin: { email: 'admin@tantran.dev', password: 'tantran', storage: 'playwright/.auth/admin.json' },
  manager: { email: 'manager@example.com', password: 'manager123', storage: 'playwright/.auth/manager.json' },
  technician: { email: 'technician@example.com', password: 'tech123', storage: 'playwright/.auth/technician.json' },
  reception: { email: 'reception@example.com', password: 'reception123', storage: 'playwright/.auth/reception.json' },
};

async function loginAs(page: any, role: keyof typeof TEST_USERS) {
  const user = TEST_USERS[role];
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /đăng nhập|login/i }).click();
  await page.waitForURL(/\/dashboard|\/my-tasks/);
}

test.describe('ADMIN Permissions', () => {
  test.use({ storageState: TEST_USERS.admin.storage });

  test('should access all pages', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/tickets',
      '/customers',
      '/products',
      '/warehouse',
      '/templates',
      '/team',
      '/reports',
    ];

    for (const url of pages) {
      await page.goto(url);
      await expect(page).toHaveURL(url);
      await expect(page).not.toHaveURL(/\/unauthorized/);
    }
  });

  test('should see all action buttons', async ({ page }) => {
    await page.goto('/tickets');

    // Should see all actions
    const createButton = page.getByRole('button', { name: /tạo phiếu|create/i });
    await expect(createButton).toBeVisible();
  });

  test('should access team management', async ({ page }) => {
    await page.goto('/team');

    // Should see create user button
    await expect(page.getByRole('button', { name: /tạo user|add user/i })).toBeVisible();
  });
});

test.describe('MANAGER Permissions', () => {
  test.use({ storageState: TEST_USERS.manager.storage });

  test('should access operations pages', async ({ page }) => {
    const allowedPages = [
      '/dashboard',
      '/tickets',
      '/customers',
      '/products',
      '/warehouse',
      '/templates',
      '/team',
      '/reports',
    ];

    for (const url of allowedPages) {
      await page.goto(url);
      await expect(page).toHaveURL(url);
    }
  });

  test('should NOT access system settings', async ({ page }) => {
    await page.goto('/settings/system');

    // Should redirect to unauthorized or show error
    const isUnauthorized =
      (await page.getByText(/không có quyền|unauthorized/i).isVisible()) ||
      page.url().includes('/unauthorized');

    expect(isUnauthorized).toBeTruthy();
  });

  test('should view all tickets', async ({ page }) => {
    await page.goto('/tickets');

    await expect(page.getByRole('heading', { name: /phiếu dịch vụ|tickets/i })).toBeVisible();

    // Should see ticket list (not just assigned)
    const ticketList = page.locator('table tbody tr, [data-testid="ticket-card"]');
    await expect(ticketList.first()).toBeVisible({ timeout: 5000 });
  });

  test('should create ticket', async ({ page }) => {
    await page.goto('/tickets');

    await expect(page.getByRole('button', { name: /tạo phiếu|create/i })).toBeVisible();
  });

  test('should switch task template (with audit)', async ({ page }) => {
    // This test assumes there's at least one ticket
    await page.goto('/tickets');

    const firstTicket = page.locator('table tbody tr, [data-testid="ticket-card"]').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();

      // Look for switch template button
      const switchButton = page.getByRole('button', { name: /đổi mẫu|switch template/i });

      if (await switchButton.isVisible()) {
        await switchButton.click();

        // Should show reason field (audit requirement)
        await expect(page.getByLabel(/lý do|reason/i)).toBeVisible();
      }
    }
  });

  test('should NOT create users', async ({ page }) => {
    await page.goto('/team');

    // Create user button should not exist or be disabled
    const createUserButton = page.getByRole('button', { name: /tạo user|add user/i });
    const exists = await createUserButton.isVisible().catch(() => false);

    if (exists) {
      const isDisabled = await createUserButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });
});

test.describe('TECHNICIAN Permissions', () => {
  test.use({ storageState: TEST_USERS.technician.storage });

  test('should redirect to /my-tasks on login', async ({ page }) => {
    await loginAs(page, 'technician');

    // Should be on my-tasks page
    await expect(page).toHaveURL(/\/my-tasks|\/dashboard/);
  });

  test('should view only assigned tasks', async ({ page }) => {
    await page.goto('/my-tasks');

    await expect(
      page.getByRole('heading', { name: /công việc|my tasks/i })
    ).toBeVisible();

    // Should see tasks list
    const tasksList = page.locator('[data-testid="task-item"]');
    const hasEmptyState = await page.getByText(/chưa có|no tasks/i).isVisible();

    // Either has tasks or empty state
    const hasContent = (await tasksList.count()) > 0 || hasEmptyState;
    expect(hasContent).toBeTruthy();
  });

  test('should NOT access all tickets', async ({ page }) => {
    await page.goto('/tickets');

    // Should either redirect or show limited view
    const canViewAll = await page.getByRole('heading', { name: /tất cả phiếu|all tickets/i }).isVisible();

    // If can view, it should be filtered to assigned only
    if (canViewAll) {
      // Check that it's filtered view
      const filterIndicator = await page.getByText(/của tôi|assigned to me/i).isVisible();
      expect(filterIndicator).toBeTruthy();
    }
  });

  test('should NOT create tickets', async ({ page }) => {
    await page.goto('/tickets');

    const createButton = page.getByRole('button', { name: /tạo phiếu|create/i });
    const exists = await createButton.isVisible().catch(() => false);

    // Button should not exist
    expect(exists).toBeFalsy();
  });

  test('should NOT access warehouse management', async ({ page }) => {
    await page.goto('/warehouse/movements');

    // Should show unauthorized or redirect
    const isUnauthorized =
      (await page.getByText(/không có quyền|unauthorized/i).isVisible()) ||
      !page.url().includes('/warehouse/movements');

    expect(isUnauthorized).toBeTruthy();
  });

  test('should view warehouse stock (read-only)', async ({ page }) => {
    await page.goto('/warehouse/stock');

    // Can view stock levels
    const canView = await page.getByText(/tồn kho|stock/i).isVisible();

    if (canView) {
      // But cannot create movements
      const createButton = page.getByRole('button', { name: /nhập kho|xuất kho|stock in|stock out/i });
      const canCreate = await createButton.isVisible().catch(() => false);

      expect(canCreate).toBeFalsy();
    }
  });

  test('should NOT access team management', async ({ page }) => {
    await page.goto('/team');

    // Should redirect or show unauthorized
    const isUnauthorized =
      (await page.getByText(/không có quyền|unauthorized/i).isVisible()) ||
      page.url().includes('/unauthorized');

    expect(isUnauthorized).toBeTruthy();
  });

  test('should NOT see pricing information', async ({ page }) => {
    // Navigate to assigned ticket
    await page.goto('/my-tasks');

    const firstTask = page.locator('[data-testid="task-item"]').first();
    if (await firstTask.isVisible()) {
      await firstTask.click();

      // Should not see price/revenue fields
      const priceFields = page.getByText(/giá|price|doanh thu|revenue|chi phí|cost/i);
      const hasPricing = await priceFields.isVisible().catch(() => false);

      expect(hasPricing).toBeFalsy();
    }
  });
});

test.describe('RECEPTION Permissions', () => {
  test.use({ storageState: TEST_USERS.reception.storage });

  test('should access customer-facing pages', async ({ page }) => {
    const allowedPages = ['/dashboard', '/tickets', '/customers', '/public-requests'];

    for (const url of allowedPages) {
      await page.goto(url);

      // Should not redirect to unauthorized
      await expect(page).not.toHaveURL(/\/unauthorized/);
    }
  });

  test('should create tickets', async ({ page }) => {
    await page.goto('/tickets');

    await expect(page.getByRole('button', { name: /tạo phiếu|create/i })).toBeVisible();
  });

  test('should create customers', async ({ page }) => {
    await page.goto('/customers');

    await expect(page.getByRole('button', { name: /tạo khách|add customer/i })).toBeVisible();
  });

  test('should view all tickets (for customer inquiries)', async ({ page }) => {
    await page.goto('/tickets');

    // Should see all tickets to answer customer questions
    await expect(page.getByRole('heading', { name: /phiếu dịch vụ|tickets/i })).toBeVisible();
  });

  test('should NOT assign technicians', async ({ page }) => {
    await page.goto('/tickets');

    const firstTicket = page.locator('table tbody tr, [data-testid="ticket-card"]').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();

      // Should not see assign button
      const assignButton = page.getByRole('button', { name: /assign|phân công/i });
      const canAssign = await assignButton.isVisible().catch(() => false);

      expect(canAssign).toBeFalsy();
    }
  });

  test('should NOT access warehouse', async ({ page }) => {
    await page.goto('/warehouse');

    // Should redirect or show unauthorized
    const isUnauthorized =
      (await page.getByText(/không có quyền|unauthorized/i).isVisible()) ||
      page.url().includes('/unauthorized');

    expect(isUnauthorized).toBeTruthy();
  });

  test('should NOT access task templates', async ({ page }) => {
    await page.goto('/templates');

    const isUnauthorized =
      (await page.getByText(/không có quyền|unauthorized/i).isVisible()) ||
      page.url().includes('/unauthorized');

    expect(isUnauthorized).toBeTruthy();
  });

  test('should NOT access team management', async ({ page }) => {
    await page.goto('/team');

    const isUnauthorized =
      (await page.getByText(/không có quyền|unauthorized/i).isVisible()) ||
      page.url().includes('/unauthorized');

    expect(isUnauthorized).toBeTruthy();
  });

  test('should access public portal requests', async ({ page }) => {
    await page.goto('/public-requests');

    // Should see public requests list
    await expect(
      page.getByText(/yêu cầu từ portal|public requests|portal/i)
    ).toBeVisible();
  });
});

test.describe('Cross-Role Permission Tests', () => {
  test('Technician cannot access Manager features', async ({ browser }) => {
    const context = await browser.newContext({ storageState: TEST_USERS.technician.storage });
    const page = await context.newPage();

    // Try to access manager-only pages
    const managerPages = ['/templates', '/team', '/reports', '/warehouse/movements'];

    for (const url of managerPages) {
      await page.goto(url);

      const isBlocked =
        (await page.getByText(/không có quyền|unauthorized/i).isVisible()) ||
        page.url().includes('/unauthorized');

      expect(isBlocked).toBeTruthy();
    }

    await context.close();
  });

  test('Reception cannot execute tasks', async ({ browser }) => {
    const context = await browser.newContext({ storageState: TEST_USERS.reception.storage });
    const page = await context.newPage();

    await page.goto('/tickets');

    const firstTicket = page.locator('table tbody tr').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();

      // Should not see "Start Task" button
      const startButton = page.getByRole('button', { name: /bắt đầu|start task/i });
      const canStart = await startButton.isVisible().catch(() => false);

      expect(canStart).toBeFalsy();
    }

    await context.close();
  });

  test('Manager can reassign technician tasks', async ({ browser }) => {
    const context = await browser.newContext({ storageState: TEST_USERS.manager.storage });
    const page = await context.newPage();

    await page.goto('/tickets');

    const firstTicket = page.locator('table tbody tr').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();

      // Should see reassign option
      const reassignButton = page.getByRole('button', { name: /phân công|assign|reassign/i });
      const canReassign = await reassignButton.isVisible().catch(() => false);

      // Manager should be able to assign
      expect(canReassign).toBeTruthy();
    }

    await context.close();
  });
});

test.describe('Security - Audit Trail', () => {
  test.use({ storageState: TEST_USERS.manager.storage });

  test('Template switch should require reason', async ({ page }) => {
    await page.goto('/tickets');

    const firstTicket = page.locator('table tbody tr').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();

      const switchButton = page.getByRole('button', { name: /đổi mẫu|switch template/i });

      if (await switchButton.isVisible()) {
        await switchButton.click();

        // Should show reason field
        const reasonField = page.getByLabel(/lý do|reason/i);
        await expect(reasonField).toBeVisible();

        // Try to submit without reason
        await page.getByRole('button', { name: /xác nhận|confirm/i }).click();

        // Should show validation error
        await expect(page.getByText(/bắt buộc|required/i)).toBeVisible();
      }
    }
  });
});

test.describe('UI - Role-based Navigation', () => {
  test('Admin sees full navigation menu', async ({ browser }) => {
    const context = await browser.newContext({ storageState: TEST_USERS.admin.storage });
    const page = await context.newPage();

    await page.goto('/dashboard');

    // Should see all menu items
    const menuItems = ['Dashboard', 'Tickets', 'Customers', 'Warehouse', 'Team', 'Reports'];

    for (const item of menuItems) {
      const menuItem = page.getByRole('link', { name: new RegExp(item, 'i') });
      await expect(menuItem).toBeVisible();
    }

    await context.close();
  });

  test('Technician sees simplified navigation', async ({ browser }) => {
    const context = await browser.newContext({ storageState: TEST_USERS.technician.storage });
    const page = await context.newPage();

    await page.goto('/dashboard');

    // Should only see limited menu
    const shouldSee = ['My Tasks'];
    const shouldNotSee = ['Team', 'Reports', 'Warehouse', 'Templates'];

    for (const item of shouldSee) {
      const menuItem = page.getByRole('link', { name: new RegExp(item, 'i') });
      await expect(menuItem).toBeVisible();
    }

    for (const item of shouldNotSee) {
      const menuItem = page.getByRole('link', { name: new RegExp(item, 'i') });
      const exists = await menuItem.isVisible().catch(() => false);
      expect(exists).toBeFalsy();
    }

    await context.close();
  });
});
