import { test, expect, } from "@playwright/test";
import { adminUser, testUsers } from "./test-data";
import { login, logout, searchUser } from "./helpers";

test.describe("RBAC Read-Only Permissions", () => {
  test.describe("Admin Full Access Tests", () => {
    test("Admin can access all pages", async ({ page }) => {
      await login(page, adminUser);
      const adminPages = [
        { path: "/dashboard", name: "Dashboard" },
        { path: "/tickets", name: "Tickets" },
        { path: "/customers", name: "Customers" },
        { path: "/products", name: "Products" },
        { path: "/parts", name: "Parts" },
        { path: "/team", name: "Team Management" },
        { path: "/warehouses", name: "Warehouse" },
      ];
      for (const { path, name } of adminPages) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expect(page.getByText(/unauthorized|không có quyền|access denied/i)).not.toBeVisible();
        console.log(`✓ Admin can access: ${name}`);
      }
      await logout(page);
    });

    test("Admin can view dashboard with all metrics", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(/revenue|doanh thu/i).first()).toBeVisible({ timeout: 5000 });
      const hasMetrics = await page.getByText(/analytics|phân tích|metrics|kpi/i).isVisible({ timeout: 2000 }).catch(() => false);
      if (hasMetrics) {
        console.log("✓ Admin can view metrics/analytics");
      }
      await logout(page);
    });

    test("Admin can view users", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");
      for (const role of Object.keys(testUsers) as Array<keyof typeof testUsers>) {
        const user = testUsers[role];
        const found = await searchUser(page, user.email);
        expect(found).toBe(true);
        console.log(`✓ Admin can find user: ${user.email}`);
      }
      await logout(page);
    });
  });

  test.describe("Manager Permissions Tests", () => {
    test("Manager can access allowed pages", async ({ page }) => {
      await login(page, testUsers.manager);
      const allowedPages = ["/dashboard", "/tickets", "/customers", "/products", "/parts", "/warehouse", "/team"];
      for (const path of allowedPages) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expect(page.getByText(/unauthorized|không có quyền/i)).not.toBeVisible();
      }
      await logout(page);
    });
  });

  test.describe("Technician Permissions Tests", () => {
    test("Technician has restricted page access", async ({ page }) => {
      await login(page, testUsers.technician);
      const forbiddenPages = ["/team", "/warehouses"];
      for (const path of forbiddenPages) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const isUnauthorized = (await page.getByText(/unauthorized|không có quyền/i).isVisible({ timeout: 2000 }).catch(() => false)) || !page.url().includes(path);
        expect(isUnauthorized).toBe(true);
      }
      await logout(page);
    });
  });

  test.describe("Reception Permissions Tests", () => {
    test("Reception has restricted page access", async ({ page }) => {
      await login(page, testUsers.reception);
      const forbiddenPages = ["/team", "/warehouses", "/parts", "/products"];
      for (const path of forbiddenPages) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const isUnauthorized = (await page.getByText(/unauthorized|không có quyền/i).isVisible({ timeout: 2000 }).catch(() => false)) || !page.url().includes(path);
        expect(isUnauthorized).toBe(true);
      }
      await logout(page);
    });
  });
});
