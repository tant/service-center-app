import { expect, type Page } from "@playwright/test";

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
}

export async function logout(page: Page) {
  const userMenuButton = page.getByTestId('user-menu-trigger');
  if (await userMenuButton.isVisible({ timeout: 2000 })) {
    await userMenuButton.click();
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/.*login/);
  }
}

export async function searchUser(page: Page, email: string): Promise<boolean> {
  const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Tìm"]').first();
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchInput.clear();
    await searchInput.fill(email);
    await page.waitForTimeout(1000);
    const userRow = page.locator(`tr:has-text("${email}")`);
    return await userRow.isVisible({ timeout: 2000 }).catch(() => false);
  }
  const userRow = page.locator(`tr:has-text("${email}")`);
  return await userRow.isVisible({ timeout: 2000 }).catch(() => false);
}

export async function isUserActive(page: Page, email: string): Promise<boolean> {
  const userRow = page.locator(`tr:has-text("${email}")`);
  if (await userRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    const isDeactivated = await userRow
      .locator('text=/inactive|deactivated|vô hiệu|không hoạt động/i')
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    return !isDeactivated;
  }
  return false;
}

export async function activateUser(page: Page, email: string): Promise<void> {
  const userRow = page.locator(`tr:has-text("${email}")`);
  const activateButton = userRow.getByTestId('toggle-active-button');
  if (await activateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await activateButton.click();
    await expect(page.getByText(/tài khoản đã được kích hoạt/i)).toBeVisible({ timeout: 5000 });
    console.log(`✓ Activated user: ${email}`);
  }
}
