import { test, expect, type Page } from "@playwright/test";

const adminUser = {
  email: process.env.ADMIN_EMAIL || "admin@tantran.dev",
  password: process.env.ADMIN_PASSWORD || "tantran",
};

// Helper function to log in
async function login(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
}

// Helper function to log out
async function logout(page: Page) {
  const userMenuButton = page.getByRole("button", {
    name: /admin|manager|technician|reception|system administrator/i
  }).first();

  if (await userMenuButton.isVisible({ timeout: 2000 })) {
    await userMenuButton.click();
    await page.getByRole("menuitem", { name: /logout|đăng xuất/i }).click();
    await expect(page).toHaveURL(/.*login/);
  }
}

test.describe("Brands Management", () => {
  const sampleBrands = ["Zotac", "SSTC", "ECS"];
  const searchBrand = sampleBrands[0]; // Zotac
  const editBrand = sampleBrands[2]; // ECS
  const updatedEditBrandName = `${editBrand} Updated`;

  // This will run once before all tests to ensure sample data exists.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, adminUser);
    await page.goto("/brands");

    for (const brandName of sampleBrands) {
      const searchInput = page.getByPlaceholder("Tìm theo tên thương hiệu...");
      await searchInput.fill(brandName);
      
      const noResultsText = page.getByText("Không tìm thấy thương hiệu nào.");
      const brandCell = page.getByRole("cell", { name: brandName, exact: true });
      
      if (await noResultsText.isVisible() || !(await brandCell.isVisible())) {
        console.log(`Brand "${brandName}" not found, creating it...`);
        await page.getByTestId("add-brand-button").click();
        const dialog = page.getByTestId("brand-form-dialog");
        await dialog.getByLabel("Tên thương hiệu").fill(brandName);
        await dialog.getByRole("button", { name: "Tạo thương hiệu" }).click();
        await expect(page.getByText("Thương hiệu đã được tạo thành công")).toBeVisible();
        await page.waitForTimeout(2000); // Wait for toast to disappear
      } else {
        console.log(`Brand "${brandName}" already exists.`);
      }
      
      await searchInput.clear();
    }
    await logout(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, adminUser);
    await page.goto("/brands");
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("should display the brands page correctly", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Thương hiệu");
    await expect(page.getByText("DS Thương hiệu")).toBeVisible();
    await expect(page.getByTestId("add-brand-button")).toBeVisible();
  });

  test("should allow creating a new unique brand", async ({ page }) => {
    const uniqueBrandName = `Test Brand ${Date.now()}`;
    await page.getByTestId("add-brand-button").click();

    const dialog = page.getByTestId("brand-form-dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Tên thương hiệu").fill(uniqueBrandName);
    await dialog.getByLabel("Mô tả").fill("This is a unique test brand.");
    await dialog.getByRole("button", { name: "Tạo thương hiệu" }).click();

    await expect(page.getByText("Thương hiệu đã được tạo thành công")).toBeVisible();
    await expect(dialog).not.toBeVisible();

    await expect(page.getByRole("cell", { name: uniqueBrandName })).toBeVisible();
  });

  test("should show validation error if brand name is empty", async ({ page }) => {
    await page.getByTestId("add-brand-button").click();

    const dialog = page.getByTestId("brand-form-dialog");
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByLabel("Tên thương hiệu");
    const isRequired = await nameInput.evaluate(el => (el as HTMLInputElement).required);
    expect(isRequired).toBe(true);

    await dialog.getByRole("button", { name: "Tạo thương hiệu" }).click();
    
    await expect(dialog).toBeVisible();
  });

  test("should allow searching for a brand", async ({ page }) => {
    await page.getByPlaceholder("Tìm theo tên thương hiệu...").fill(searchBrand);

    const tableRows = page.locator("tbody tr");
    await expect(tableRows.first()).toBeVisible();
    await expect(tableRows.first().getByRole("cell", { name: searchBrand })).toBeVisible();
  });

  test("should allow editing an existing brand and reverting the change", async ({ page }) => {
    // --- Edit Step ---
    const brandRow = page.getByRole("row", { name: editBrand });
    await brandRow.locator('[data-testid^="edit-brand-"]').click();

    const editDialog = page.getByTestId("brand-form-dialog");
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel("Tên thương hiệu").fill(updatedEditBrandName);
    await editDialog.getByRole("button", { name: "Cập nhật" }).click();

    await expect(page.getByText("Thương hiệu đã được cập nhật thành công")).toBeVisible();
    await expect(page.getByRole("cell", { name: updatedEditBrandName })).toBeVisible();

    // --- Revert Step (to ensure test idempotency) ---
    const updatedBrandRow = page.getByRole("row", { name: updatedEditBrandName });
    await updatedBrandRow.locator('[data-testid^="edit-brand-"]').click();
    
    const revertDialog = page.getByTestId("brand-form-dialog");
    await expect(revertDialog).toBeVisible();
    await revertDialog.getByLabel("Tên thương hiệu").fill(editBrand);
    await revertDialog.getByRole("button", { name: "Cập nhật" }).click();

    await expect(page.getByText("Thương hiệu đã được cập nhật thành công")).toBeVisible();
    await expect(page.getByRole("cell", { name: editBrand })).toBeVisible();
  });

  test("should allow canceling the create dialog", async ({ page }) => {
    await page.getByTestId("add-brand-button").click();

    const dialog = page.getByTestId("brand-form-dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Hủy" }).click();

    await expect(dialog).not.toBeVisible();
  });
});
