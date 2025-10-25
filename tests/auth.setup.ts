/**
 * Authentication Setup for Playwright Tests
 *
 * This file sets up authentication state for all 4 user roles:
 * - Admin
 * - Manager
 * - Technician
 * - Reception
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = {
  admin: path.join(__dirname, '../playwright/.auth/admin.json'),
  manager: path.join(__dirname, '../playwright/.auth/manager.json'),
  technician: path.join(__dirname, '../playwright/.auth/technician.json'),
  reception: path.join(__dirname, '../playwright/.auth/reception.json'),
};

// Admin setup
setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  // Fill in admin credentials
  await page.getByLabel(/email/i).fill('admin@tantran.dev');
  await page.getByLabel(/password/i).fill('tantran');

  // Click login button
  await page.getByRole('button', { name: /đăng nhập|login/i }).click();

  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/);

  // Verify we're logged in (check for user menu or dashboard content)
  await expect(page.getByText(/admin|system administrator/i)).toBeVisible({ timeout: 10000 });

  // Save authentication state
  await page.context().storageState({ path: authFile.admin });
});

// Manager setup
setup('authenticate as manager', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('manager@example.com');
  await page.getByLabel(/password/i).fill('manager123');
  await page.getByRole('button', { name: /đăng nhập|login/i }).click();

  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText(/manager/i)).toBeVisible({ timeout: 10000 });

  await page.context().storageState({ path: authFile.manager });
});

// Technician setup
setup('authenticate as technician', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('technician@example.com');
  await page.getByLabel(/password/i).fill('tech123');
  await page.getByRole('button', { name: /đăng nhập|login/i }).click();

  await page.waitForURL(/\/dashboard|\/my-tasks/);
  await expect(page.getByText(/technician|kỹ thuật/i)).toBeVisible({ timeout: 10000 });

  await page.context().storageState({ path: authFile.technician });
});

// Reception setup
setup('authenticate as reception', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('reception@example.com');
  await page.getByLabel(/password/i).fill('reception123');
  await page.getByRole('button', { name: /đăng nhập|login/i }).click();

  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText(/reception|lễ tân/i)).toBeVisible({ timeout: 10000 });

  await page.context().storageState({ path: authFile.reception });
});
