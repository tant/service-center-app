import { test, expect, Page } from "@playwright/test";
import { adminUser, testUsers } from "./test-data";
import { login, logout, searchUser } from "./helpers";

test.describe("RBAC Write Operations", () => {
  test.describe("Team Management Operations", () => {
    test("Admin can change user role", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");
      const searchInput = page.getByPlaceholder(/tìm theo tên hoặc email/i);
      await searchInput.fill(testUsers.technician.email);
      await page.waitForTimeout(500);
      const techRow = page.getByTestId(`team-member-row-${testUsers.technician.email}`);
      await expect(techRow).toBeVisible({ timeout: 5000 });
      const roleButton = techRow.getByRole('button', { name: 'Thay đổi vai trò' });
      await roleButton.click();
      await page.waitForTimeout(500);
      const dropdownContent = page.locator('[role="menu"]').first();
      await expect(dropdownContent).toBeVisible({ timeout: 3000 });
      const receptionOption = page.locator('[role="menuitem"][data-role="reception"]');
      await receptionOption.click();
      await expect(page.getByText(/vai trò đã được cập nhật/i)).toBeVisible({ timeout: 5000 });
      // Revert change to keep state clean
      await roleButton.click();
      await page.waitForTimeout(500);
      const technicianOption = page.locator('[role="menuitem"][data-role="technician"]');
      await technicianOption.click();
      await expect(page.getByText(/vai trò đã được cập nhật/i)).toBeVisible({ timeout: 5000 });
      await logout(page);
    });

    test("Admin can reset password for a user", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/team");
      const tempUser = { email: `pw-reset-${Date.now()}@example.com`, password: "password123", name: "PW Reset User", role: "Kỹ thuật viên" };
      const addButton = page.getByRole("button", { name: /add user|thêm nhân viên/i });
      await addButton.click();
      await page.getByText("Thêm Nhân Viên Mới").waitFor({ state: "visible", timeout: 5000 });
      await page.getByPlaceholder(/nhập họ và tên/i).fill(tempUser.name);
      await page.getByPlaceholder(/nhập địa chỉ email/i).fill(tempUser.email);
      await page.getByPlaceholder(/nhập mật khẩu/i).fill(tempUser.password);
      await page.locator('button#roles').click();
      await page.getByRole("option", { name: tempUser.role, exact: true }).click();
      await page.getByRole("button", { name: /tạo nhân viên/i }).click();
      await page.waitForLoadState("networkidle");
      const userRow = page.getByTestId(`team-member-row-${tempUser.email}`);
      await expect(userRow).toBeVisible({ timeout: 5000 });
      const passwordButton = userRow.getByTestId('password-reset-button');
      await passwordButton.click();
      const dialog = page.getByTestId('password-reset-dialog');
      await expect(dialog).toBeVisible({ timeout: 3000 });
      await dialog.getByTestId('new-password-input').fill("NewPassword456!");
      await dialog.getByTestId('confirm-password-reset').click();
      await expect(page.getByText(/đặt lại mật khẩu thành công/i)).toBeVisible({ timeout: 5000 });
      await logout(page);
    });

    test("Admin can activate/deactivate user", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/team");
      const tempUser = { email: `toggle-${Date.now()}@example.com`, password: "password123", name: "Toggle User", role: "Lễ tân" };
      const addButton = page.getByRole("button", { name: /add user|thêm nhân viên/i });
      await addButton.click();
      await page.getByText("Thêm Nhân Viên Mới").waitFor({ state: "visible", timeout: 5000 });
      await page.getByPlaceholder(/nhập họ và tên/i).fill(tempUser.name);
      await page.getByPlaceholder(/nhập địa chỉ email/i).fill(tempUser.email);
      await page.getByPlaceholder(/nhập mật khẩu/i).fill(tempUser.password);
      await page.locator('button#roles').click();
      await page.getByRole("option", { name: tempUser.role, exact: true }).click();
      await page.getByRole("button", { name: /tạo nhân viên/i }).click();
      await page.waitForLoadState("networkidle");
      const userRow = page.getByTestId(`team-member-row-${tempUser.email}`);
      await expect(userRow).toBeVisible({ timeout: 5000 });
      const toggleButton = userRow.getByTestId('toggle-active-button');
      await toggleButton.click();
      await expect(page.getByText(/tài khoản đã được vô hiệu hóa/i)).toBeVisible({ timeout: 5000 });
      await toggleButton.click();
      await expect(page.getByText(/tài khoản đã được kích hoạt/i)).toBeVisible({ timeout: 5000 });
      await logout(page);
    });
  });
});
