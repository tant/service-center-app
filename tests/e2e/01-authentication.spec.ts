/**
 * Authentication E2E Tests
 *
 * Tests all authentication flows including:
 * - Login with all 4 roles (admin, manager, technician, reception)
 * - Role-based page access
 * - Logout functionality
 * - Invalid credentials handling
 * - Session persistence
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication - Login', () => {
  test('should login as Admin and access dashboard', async ({ page }) => {
    await page.goto('/login');

    // Fill credentials
    await page.getByLabel(/email/i).fill('admin@tantran.dev');
    await page.getByLabel(/password/i).fill('tantran');

    // Click login button
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    // Wait for navigation to dashboard
    await page.waitForURL(/\/dashboard/);

    // Verify we're on dashboard and user info is visible
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/admin|system administrator/i)).toBeVisible();

    // Verify admin can access admin-only pages
    await page.goto('/team');
    await expect(page).toHaveURL(/\/team/);
    await expect(page.getByText(/quản lý nhân viên|team management/i)).toBeVisible();
  });

  test('should login as Manager and access dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('manager@example.com');
    await page.getByLabel(/password/i).fill('manager123');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    await page.waitForURL(/\/dashboard/);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/manager/i)).toBeVisible();

    // Verify manager can access tickets
    await page.goto('/tickets');
    await expect(page).toHaveURL(/\/tickets/);
  });

  test('should login as Technician and access my tasks', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('technician@example.com');
    await page.getByLabel(/password/i).fill('tech123');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    // Technician might be redirected to my-tasks instead of dashboard
    await page.waitForURL(/\/dashboard|\/my-tasks/);

    // Verify technician identity
    await expect(page.getByText(/technician|kỹ thuật/i)).toBeVisible();
  });

  test('should login as Reception and access dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('reception@example.com');
    await page.getByLabel(/password/i).fill('reception123');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    await page.waitForURL(/\/dashboard/);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/reception|lễ tân/i)).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);

    // Should show error message
    await expect(
      page.getByText(/invalid.*credentials|email.*password.*incorrect|sai.*mật khẩu/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show error with empty credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to submit without filling anything
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    // Should show validation errors
    await expect(page.getByText(/email.*required|bắt buộc/i)).toBeVisible();
  });
});

test.describe('Authentication - Logout', () => {
  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@tantran.dev');
    await page.getByLabel(/password/i).fill('tantran');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Find and click logout button (usually in user menu)
    // Try to find user menu first
    const userMenu = page.getByRole('button', { name: /admin|system administrator/i }).first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }

    // Click logout
    await page.getByRole('button', { name: /đăng xuất|logout|sign out/i }).click();

    // Should redirect to login page
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should not access protected pages after logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@tantran.dev');
    await page.getByLabel(/password/i).fill('tantran');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Logout
    const userMenu = page.getByRole('button', { name: /admin|system administrator/i }).first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }
    await page.getByRole('button', { name: /đăng xuất|logout|sign out/i }).click();
    await page.waitForURL(/\/login/);

    // Try to access protected page
    await page.goto('/dashboard');

    // Should redirect back to login
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Authentication - Role-based Access', () => {
  test('Admin should access all pages', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@tantran.dev');
    await page.getByLabel(/password/i).fill('tantran');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Test access to various pages
    const pages = ['/dashboard', '/tickets', '/customers', '/products', '/parts', '/team'];

    for (const url of pages) {
      await page.goto(url);
      await expect(page).toHaveURL(url);
      // Should not redirect to login
      await expect(page).not.toHaveURL(/\/login/);
    }
  });

  test('Technician should not access admin-only pages', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('technician@example.com');
    await page.getByLabel(/password/i).fill('tech123');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard|\/my-tasks/);

    // Try to access admin-only page
    await page.goto('/team');

    // Should either redirect to dashboard or show unauthorized message
    await expect(
      page.getByText(/không có quyền|unauthorized|access denied/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('Reception should not access warehouse pages', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('reception@example.com');
    await page.getByLabel(/password/i).fill('reception123');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Try to access warehouse page
    await page.goto('/warehouse');

    // Should show unauthorized or redirect
    await page.waitForTimeout(1000); // Wait for any redirects
    const currentUrl = page.url();

    if (currentUrl.includes('/warehouse')) {
      // If still on warehouse page, should show unauthorized message
      await expect(
        page.getByText(/không có quyền|unauthorized|access denied/i)
      ).toBeVisible();
    } else {
      // Or should have redirected away
      await expect(page).not.toHaveURL(/\/warehouse/);
    }
  });
});

test.describe('Authentication - Session Persistence', () => {
  test('should persist session after page reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@tantran.dev');
    await page.getByLabel(/password/i).fill('tantran');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Reload the page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/admin|system administrator/i)).toBeVisible();
  });

  test('should persist session in new tab', async ({ context, page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@tantran.dev');
    await page.getByLabel(/password/i).fill('tantran');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Open new tab
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');

    // Should be logged in automatically
    await expect(newPage).toHaveURL(/\/dashboard/);
    await expect(newPage.getByText(/admin|system administrator/i)).toBeVisible();

    await newPage.close();
  });
});
