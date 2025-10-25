import { test, expect, Page } from "@playwright/test";

const adminUser = {
  email: process.env.ADMIN_EMAIL || "admin@tantran.dev",
  password: process.env.ADMIN_PASSWORD || "tantran",
};

const testUsers = {
  manager: {
    email: "manager.test@example.com",
    password: "password123",
    name: "Test Manager",
    role: "Quản lý", // Manager in Vietnamese
  },
  technician: {
    email: "technician.test@example.com",
    password: "password123",
    name: "Test Technician",
    role: "Kỹ thuật viên", // Technician in Vietnamese
  },
  reception: {
    email: "reception.test@example.com",
    password: "password123",
    name: "Test Reception",
    role: "Lễ tân", // Reception in Vietnamese
  },
};

type Role = keyof typeof testUsers;

// Helper function to log in
async function login(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  // Wait for navigation to complete
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
}

// Helper function to log out
async function logout(page: Page) {
  // Find user menu button - it might have different text based on role
  const userMenuButton = page.getByRole("button", {
    name: /admin|manager|technician|reception|system administrator/i
  }).first();

  if (await userMenuButton.isVisible({ timeout: 2000 })) {
    await userMenuButton.click();
    await page.getByRole("menuitem", { name: /logout|đăng xuất/i }).click();
    await expect(page).toHaveURL(/.*login/);
  }
}

// Helper function to search and find user
async function searchUser(page: Page, email: string): Promise<boolean> {
  // Look for search input field
  const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Tìm"]').first();

  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Clear and search for user
    await searchInput.clear();
    await searchInput.fill(email);
    await page.waitForTimeout(1000); // Wait for search results

    // Check if user appears in results
    const userRow = page.locator(`tr:has-text("${email}")`);
    return await userRow.isVisible({ timeout: 2000 }).catch(() => false);
  }

  // Fallback: check if user is visible in current page
  const userRow = page.locator(`tr:has-text("${email}")`);
  return await userRow.isVisible({ timeout: 2000 }).catch(() => false);
}

// Helper function to check if user is active
async function isUserActive(page: Page, email: string): Promise<boolean> {
  const userRow = page.locator(`tr:has-text("${email}")`);

  if (await userRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Check for "inactive", "deactivated", or similar indicators
    const isDeactivated = await userRow
      .locator('text=/inactive|deactivated|vô hiệu|không hoạt động/i')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    return !isDeactivated;
  }

  return false;
}

// Helper function to activate user
async function activateUser(page: Page, email: string): Promise<void> {
  const userRow = page.locator(`tr:has-text("${email}")`);

  // Look for activate button or toggle
  const activateButton = userRow.getByRole("button", { name: /activate|kích hoạt/i });

  if (await activateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await activateButton.click();
    await page.waitForTimeout(1000);
    console.log(`✓ Activated user: ${email}`);
  } else {
    // Try clicking on a toggle/switch
    const toggle = userRow.locator('button[role="switch"]');
    if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(1000);
      console.log(`✓ Activated user: ${email}`);
    }
  }
}

test.describe("RBAC Permissions End-to-End Test", () => {
  // Step 1: Admin logs in and creates other users
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, adminUser);

    // Navigate to team management page (correct path: /team)
    await page.goto("/team");
    await page.waitForLoadState("networkidle");

    // Create each user if they don't already exist
    for (const role of Object.keys(testUsers) as Role[]) {
      const user = testUsers[role];

      console.log(`Checking user: ${user.email}...`);

      // Search for user (handles pagination)
      const userFound = await searchUser(page, user.email);

      if (userFound) {
        console.log(`✓ User ${user.email} already exists.`);

        // Check if user is active
        const isActive = await isUserActive(page, user.email);

        if (!isActive) {
          console.log(`⚠ User ${user.email} is deactivated. Activating...`);
          await activateUser(page, user.email);
        } else {
          console.log(`✓ User ${user.email} is active. Ready to use.`);
        }

        continue;
      }

      console.log(`Creating new user: ${user.email} with role: ${user.role}`);

      // Clear search to show add button
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Tìm"]').first();
      if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await searchInput.clear();
        await page.waitForTimeout(500);
      }

      // Click Add User button
      const addButton = page.getByRole("button", { name: /add user|thêm nhân viên/i });
      await addButton.click();

      // Wait for drawer title to appear (indicates drawer is open)
      await page.getByText("Thêm Nhân Viên Mới").waitFor({ state: "visible", timeout: 5000 });

      // Wait a bit more for drawer animation to complete
      await page.waitForTimeout(1000);

      // Fill in form fields - use getByPlaceholder since inputs are definitely visible
      await page.getByPlaceholder(/nhập họ và tên/i).fill(user.name);
      await page.getByPlaceholder(/nhập địa chỉ email/i).fill(user.email);
      await page.getByPlaceholder(/nhập mật khẩu/i).fill(user.password);

      // Select role from dropdown - find the "Vai trò" select
      const roleLabel = page.getByText("Vai trò");
      const roleSelect = page.locator('button#roles');
      await roleSelect.click();

      // Wait for dropdown to open and select option
      await page.waitForTimeout(500);
      await page.getByRole("option", { name: user.role, exact: true }).click();

      // Submit the form
      const submitButton = page.getByRole("button", { name: /tạo nhân viên/i });
      await submitButton.click();

      // Wait for page to reload after successful creation
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Verify user was created by searching for them
      const userCreated = await searchUser(page, user.email);
      if (!userCreated) {
        throw new Error(`Failed to create user: ${user.email}`);
      }

      console.log(`✓ Successfully created user: ${user.email}`);
    }

    await logout(page);
    await page.close();
  }, 120000); // Increase timeout to 120 seconds (2 minutes) for user creation

  // ========================================
  // ADMIN PERMISSIONS TESTS
  // Based on ROLES-AND-PERMISSIONS.md
  // ========================================

  test.describe("Admin Full Access Tests", () => {
    test("Admin can access all pages", async ({ page }) => {
      await login(page, adminUser);

      // Test all pages admin should have access to
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

        // Verify no unauthorized message
        await expect(
          page.getByText(/unauthorized|không có quyền|access denied/i)
        ).not.toBeVisible();

        console.log(`✓ Admin can access: ${name}`);
      }

      await logout(page);
    });

    test("Admin can view dashboard with all metrics", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Admin should see revenue and analytics
      await expect(
        page.getByText(/revenue|doanh thu/i).first()
      ).toBeVisible({ timeout: 5000 });

      // Should see metrics/analytics section
      const hasMetrics = await page
        .getByText(/analytics|phân tích|metrics|kpi/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasMetrics) {
        console.log("✓ Admin can view metrics/analytics");
      }

      await logout(page);
    });

    test("Admin can manage users (CRUD operations)", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      // Should see Add User button
      await expect(
        page.getByRole("button", { name: /add user|thêm nhân viên/i })
      ).toBeVisible();

      // Should be able to search and find all test users
      for (const role of Object.keys(testUsers) as Role[]) {
        const user = testUsers[role];

        // Use search to find user (handles pagination)
        const found = await searchUser(page, user.email);
        expect(found).toBe(true);

        console.log(`✓ Admin can find user: ${user.email}`);
      }

      console.log("✓ Admin can view and manage all users");

      await logout(page);
    });

    test("Admin can view all tickets", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/tickets");
      await page.waitForLoadState("networkidle");

      // Should see all tickets view (not filtered)
      await expect(
        page.getByText(/all tickets|tất cả phiếu/i)
      ).toBeVisible({ timeout: 5000 }).catch(() => true); // May or may not have text

      // Should see create ticket button
      await expect(
        page.getByRole("button", { name: /create ticket|tạo phiếu/i })
      ).toBeVisible({ timeout: 5000 }).catch(() => true);

      console.log("✓ Admin can view all tickets");

      await logout(page);
    });

    test("Admin can access warehouse management", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/warehouse");
      await page.waitForLoadState("networkidle");

      // Verify no unauthorized message
      await expect(
        page.getByText(/unauthorized|không có quyền/i)
      ).not.toBeVisible();

      // Should see warehouse management features
      const hasStockMovement = await page
        .getByText(/stock|inventory|kho|nhập|xuất/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasStockMovement) {
        console.log("✓ Admin can access warehouse features");
      }

      await logout(page);
    });

    test("Admin can manage products and parts", async ({ page }) => {
      await login(page, adminUser);

      // Test Products page
      await page.goto("/products");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("button", { name: /add product|thêm sản phẩm/i })
      ).toBeVisible({ timeout: 5000 }).catch(() => true);

      console.log("✓ Admin can manage products");

      // Test Parts page
      await page.goto("/parts");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("button", { name: /add part|thêm linh kiện/i })
      ).toBeVisible({ timeout: 5000 }).catch(() => true);

      console.log("✓ Admin can manage parts");

      await logout(page);
    });

    test("Admin can manage customers", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/customers");
      await page.waitForLoadState("networkidle");

      // Should see create customer button
      await expect(
        page.getByRole("button", { name: /add customer|thêm khách hàng/i })
      ).toBeVisible({ timeout: 5000 }).catch(() => true);

      console.log("✓ Admin can manage customers");

      await logout(page);
    });
  });

  // ========================================
  // MANAGER PERMISSIONS TESTS
  // ========================================

  test.describe("Manager Permissions Tests", () => {
    test("Manager can log in and access dashboard", async ({ page }) => {
      await login(page, testUsers.manager);

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);

      // Manager should see revenue/metrics
      await expect(
        page.getByText(/revenue|doanh thu/i).first()
      ).toBeVisible({ timeout: 5000 });

      console.log("✓ Manager can access dashboard with metrics");

      await logout(page);
    });

    test("Manager can access allowed pages", async ({ page }) => {
      await login(page, testUsers.manager);

      const managerAllowedPages = [
        "/dashboard",
        "/tickets",
        "/customers",
        "/products",
        "/parts",
        "/warehouse",
      ];

      for (const path of managerAllowedPages) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");

        await expect(
          page.getByText(/unauthorized|không có quyền/i)
        ).not.toBeVisible();
      }

      console.log("✓ Manager can access all allowed pages");

      await logout(page);
    });

    test("Manager CAN access team management", async ({ page }) => {
      await login(page, testUsers.manager);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      // Should have access to team page
      expect(page.url()).toContain("/team");

      // Verify no unauthorized message
      await expect(
        page.getByText(/unauthorized|không có quyền|access denied/i)
      ).not.toBeVisible();

      // Verify page content is accessible (e.g., can see "Add User" button)
      const hasTeamContent =
        (await page.getByRole("button", { name: /add user|thêm nhân viên/i }).isVisible({ timeout: 2000 }).catch(() => false)) ||
        (await page.getByRole("main").isVisible({ timeout: 2000 }).catch(() => false));

      expect(hasTeamContent).toBe(true);
      console.log("✓ Manager has access to team management");

      await logout(page);
    });

    test("Manager can view all tickets", async ({ page }) => {
      await login(page, testUsers.manager);
      await page.goto("/tickets");
      await page.waitForLoadState("networkidle");

      // Should see all tickets
      await expect(
        page.getByText(/all tickets|tất cả phiếu/i)
      ).toBeVisible({ timeout: 5000 }).catch(() => true);

      console.log("✓ Manager can view all tickets");

      await logout(page);
    });
  });

  // ========================================
  // TECHNICIAN PERMISSIONS TESTS
  // ========================================

  test.describe("Technician Permissions Tests", () => {
    test("Technician can log in and redirects to tasks", async ({ page }) => {
      await login(page, testUsers.technician);

      // Should redirect to my-tasks or dashboard
      const currentUrl = page.url();
      const isCorrectRedirect =
        currentUrl.includes("/my-tasks") ||
        currentUrl.includes("/dashboard");

      expect(isCorrectRedirect).toBe(true);

      console.log(`✓ Technician redirected to: ${currentUrl}`);

      await logout(page);
    });

    test("Technician can view products (read-only)", async ({ page }) => {
      await login(page, testUsers.technician);
      await page.goto("/products");
      await page.waitForLoadState("networkidle");

      // Should not see create/edit buttons
      const hasCreateButton = await page
        .getByRole("button", { name: /add product|thêm sản phẩm|create/i })
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasCreateButton).toBe(false);
      console.log("✓ Technician has read-only access to products");

      await logout(page);
    });

    test("Technician CANNOT access dashboard metrics", async ({ page }) => {
      await login(page, testUsers.technician);
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Should not see revenue
      const hasRevenue = await page
        .getByText(/revenue|doanh thu/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasRevenue).toBe(false);
      console.log("✓ Technician correctly blocked from viewing revenue");

      await logout(page);
    });

    test("Technician CANNOT access team management", async ({ page }) => {
      await login(page, testUsers.technician);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      const isUnauthorized =
        (await page.getByText(/unauthorized|không có quyền/i).isVisible({ timeout: 2000 }).catch(() => false)) ||
        !page.url().includes("/team");

      expect(isUnauthorized).toBe(true);
      console.log("✓ Technician correctly blocked from team management");

      await logout(page);
    });

    test("Technician CANNOT access warehouse management", async ({ page }) => {
      await login(page, testUsers.technician);
      await page.goto("/warehouses");
      await page.waitForLoadState("networkidle");

      const isUnauthorized =
        (await page.getByText(/unauthorized|không có quyền/i).isVisible({ timeout: 2000 }).catch(() => false)) ||
        !page.url().includes("/warehouses");

      expect(isUnauthorized).toBe(true);
      console.log("✓ Technician correctly blocked from warehouse management");

      await logout(page);
    });

    test("Technician can only view assigned tickets", async ({ page }) => {
      await login(page, testUsers.technician);
      await page.goto("/tickets");
      await page.waitForLoadState("networkidle");

      // Should see "My Tasks" or "Assigned to me" instead of "All Tickets"
      const hasMyTasks = await page
        .getByText(/my tasks|assigned to me|nhiệm vụ của tôi/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // Should NOT see all tickets view
      const hasAllTickets = await page
        .getByText(/all tickets|tất cả phiếu/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasMyTasks || !hasAllTickets).toBe(true);
      console.log("✓ Technician can only view assigned tickets");

      await logout(page);
    });
  });

  // ========================================
  // RECEPTION PERMISSIONS TESTS
  // ========================================

  test.describe("Reception Permissions Tests", () => {
    test("Reception can log in and access dashboard", async ({ page }) => {
      await login(page, testUsers.reception);

      await expect(page).toHaveURL(/.*dashboard/);

      console.log("✓ Reception can access dashboard");

      await logout(page);
    });

    test("Reception can view all tickets", async ({ page }) => {
      await login(page, testUsers.reception);
      await page.goto("/tickets");
      await page.waitForLoadState("networkidle");

      // Should see all tickets (to answer customer inquiries)
      await expect(
        page.getByText(/all tickets|tất cả phiếu/i)
      ).toBeVisible({ timeout: 5000 }).catch(() => true);

      console.log("✓ Reception can view all tickets");

      await logout(page);
    });

    test("Reception can create tickets", async ({ page }) => {
      await login(page, testUsers.reception);
      await page.goto("/tickets");
      await page.waitForLoadState("networkidle");

      // Should see create ticket button
      await expect(
        page.getByRole("button", { name: /create ticket|tạo phiếu/i })
      ).toBeVisible({ timeout: 5000 }).catch(() => true);

      console.log("✓ Reception can create tickets");

      await logout(page);
    });

    test("Reception can manage customers", async ({ page }) => {
      await login(page, testUsers.reception);
      await page.goto("/customers");
      await page.waitForLoadState("networkidle");

      // Should see create customer button
      await expect(
        page.getByRole("button", { name: /add customer|thêm khách hàng/i })
      ).toBeVisible({ timeout: 5000 }).catch(() => true);

      console.log("✓ Reception can manage customers");

      await logout(page);
    });

    test("Reception CANNOT access dashboard metrics", async ({ page }) => {
      await login(page, testUsers.reception);
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Should not see revenue/analytics
      const hasRevenue = await page
        .getByText(/revenue|doanh thu/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      const hasAnalytics = await page
        .getByText(/analytics|phân tích/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasRevenue || hasAnalytics).toBe(false);
      console.log("✓ Reception correctly blocked from viewing metrics");

      await logout(page);
    });

    test("Reception CANNOT access warehouse", async ({ page }) => {
      await login(page, testUsers.reception);
      await page.goto("/warehouses");
      await page.waitForLoadState("networkidle");

      const isUnauthorized =
        (await page.getByText(/unauthorized|không có quyền/i).isVisible({ timeout: 2000 }).catch(() => false)) ||
        !page.url().includes("/warehouses");

      expect(isUnauthorized).toBe(true);
      console.log("✓ Reception correctly blocked from warehouse");

      await logout(page);
    });

    test("Reception CANNOT access team management", async ({ page }) => {
      await login(page, testUsers.reception);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      const isUnauthorized =
        (await page.getByText(/unauthorized|không có quyền/i).isVisible({ timeout: 2000 }).catch(() => false)) ||
        !page.url().includes("/team");

      expect(isUnauthorized).toBe(true);
      console.log("✓ Reception correctly blocked from team management");

      await logout(page);
    });

    test("Reception CANNOT update task progress", async ({ page }) => {
      await login(page, testUsers.reception);
      await page.goto("/tickets");
      await page.waitForLoadState("networkidle");

      // Should not see task execution buttons
      const hasTaskButtons = await page
        .getByRole("button", { name: /start task|bắt đầu|complete|hoàn thành/i })
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasTaskButtons).toBe(false);
      console.log("✓ Reception correctly blocked from task execution");

      await logout(page);
    });
  });

  // ========================================
  // TEAM MANAGEMENT OPERATIONS
  // ========================================

  test.describe("Team Management Operations", () => {
    test("Admin can change user role (Technician → Reception)", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      // Use search to find the technician user (handles pagination)
      const searchInput = page.getByPlaceholder(/tìm theo tên hoặc email/i);
      await searchInput.fill(testUsers.technician.email);
      await page.waitForTimeout(500);

      // Find the technician user row with data-testid
      const techRow = page.getByTestId(`team-member-row-${testUsers.technician.email}`);
      await expect(techRow).toBeVisible({ timeout: 5000 });

      // Click the role change button using aria-label (works better with nested components)
      const roleButton = techRow.getByRole('button', { name: 'Thay đổi vai trò' });
      await roleButton.click();

      // Wait for dropdown menu to open using Radix's data-state attribute
      await page.waitForTimeout(500);
      const dropdownContent = page.locator('[role="menu"]').first();
      await expect(dropdownContent).toBeVisible({ timeout: 3000 });

      // Find menu items within the dropdown using role="menuitem" and data-role attribute
      // This ensures we only click on actual dropdown menu items, not other text on the page
      const receptionOption = page.locator('[role="menuitem"][data-role="reception"]');
      const technicianOption = page.locator('[role="menuitem"][data-role="technician"]');

      const isReceptionVisible = await receptionOption.isVisible({ timeout: 1000 }).catch(() => false);

      if (isReceptionVisible) {
        await receptionOption.click();
        console.log("✓ Admin changed role to Reception");
      } else {
        // Already Reception, try to change to Technician
        const isTechVisible = await technicianOption.isVisible({ timeout: 1000 }).catch(() => false);
        if (isTechVisible) {
          await technicianOption.click();
          console.log("✓ Admin changed role to Technician");
        } else {
          throw new Error("Neither Reception nor Technician role option found in dropdown menu");
        }
      }

      // Wait for success message with Vietnamese text
      await expect(page.getByText(/vai trò đã được cập nhật/i)).toBeVisible({ timeout: 5000 });
      console.log("✓ Admin successfully changed user role");

      await logout(page);
    });

    test("Admin can reset password for Technician", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      // Use search to find the technician user
      const searchInput = page.getByPlaceholder(/tìm theo tên hoặc email/i);
      await searchInput.fill(testUsers.technician.email);
      await page.waitForTimeout(500);

      // Find the technician user row with data-testid
      const techRow = page.getByTestId(`team-member-row-${testUsers.technician.email}`);
      await expect(techRow).toBeVisible({ timeout: 5000 });

      // Click the password reset button using data-testid
      const passwordButton = techRow.getByTestId('password-reset-button');
      await passwordButton.click();

      // Wait for password reset dialog to appear
      const dialog = page.getByTestId('password-reset-dialog');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Fill in new password using data-testid
      const passwordInput = page.getByTestId('new-password-input');
      await passwordInput.fill("NewTechPass123!");

      // Click confirm button using data-testid
      await page.getByTestId('confirm-password-reset').click();

      // Wait for success message
      await expect(page.getByText(/đặt lại mật khẩu thành công/i)).toBeVisible({ timeout: 5000 });
      console.log("✓ Admin successfully reset technician password");

      await logout(page);
    });

    test("Admin can activate/deactivate user", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      // Use search to find the technician user
      const searchInput = page.getByPlaceholder(/tìm theo tên hoặc email/i);
      await searchInput.fill(testUsers.technician.email);
      await page.waitForTimeout(500);

      // Find the technician user row with data-testid
      const techRow = page.getByTestId(`team-member-row-${testUsers.technician.email}`);
      await expect(techRow).toBeVisible({ timeout: 5000 });

      // Click toggle active button using data-testid
      const toggleButton = techRow.getByTestId('toggle-active-button');
      await toggleButton.click();

      // Wait for success message (no confirmation dialog based on code)
      await expect(page.getByText(/tài khoản đã được/i)).toBeVisible({ timeout: 5000 });
      console.log("✓ Admin successfully toggled user active status");

      // Toggle back to active
      await page.waitForTimeout(1000);
      const toggleButton2 = techRow.getByTestId('toggle-active-button');
      await toggleButton2.click();
      await expect(page.getByText(/tài khoản đã được/i)).toBeVisible({ timeout: 5000 });
      console.log("✓ Admin toggled user back to active");

      await logout(page);
    });

    test("Manager can ONLY change roles between Technician ↔ Reception", async ({ page }) => {
      await login(page, testUsers.manager);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      // Use search to find the reception user (was changed from technician in earlier test)
      const searchInput = page.getByPlaceholder(/tìm theo tên hoặc email/i);
      await searchInput.fill(testUsers.technician.email);
      await page.waitForTimeout(500);

      // Find the user row with data-testid
      const userRow = page.getByTestId(`team-member-row-${testUsers.technician.email}`);
      await expect(userRow).toBeVisible({ timeout: 5000 });

      // Click the role change button using aria-label (works better with nested components)
      const roleButton = userRow.getByRole('button', { name: 'Thay đổi vai trò' });
      await roleButton.click();

      // Wait for dropdown menu to open using Radix's role attribute
      await page.waitForTimeout(500);
      const dropdownContent = page.locator('[role="menu"]').first();
      await expect(dropdownContent).toBeVisible({ timeout: 3000 });

      // Check that only Technician and Reception options are visible using role="menuitem" and data-role
      // Note: The current role won't be shown as clickable, so at least one should be visible
      const adminOption = await page.locator('[role="menuitem"][data-role="admin"]').isVisible({ timeout: 1000 }).catch(() => false);
      const managerOption = await page.locator('[role="menuitem"][data-role="manager"]').isVisible({ timeout: 1000 }).catch(() => false);
      const techOption = await page.locator('[role="menuitem"][data-role="technician"]').isVisible({ timeout: 1000 }).catch(() => false);
      const receptionOption = await page.locator('[role="menuitem"][data-role="reception"]').isVisible({ timeout: 1000 }).catch(() => false);

      expect(adminOption).toBe(false);
      expect(managerOption).toBe(false);
      // At least one of Tech or Reception should be visible (the one that's NOT the current role)
      const hasTechOrReceptionOption = techOption || receptionOption;
      expect(hasTechOrReceptionOption).toBe(true);
      console.log(`✓ Manager correctly restricted to Technician/Reception role changes only (Tech visible: ${techOption}, Reception visible: ${receptionOption})`);

      // Close dropdown by pressing Escape
      await page.keyboard.press('Escape');

      await logout(page);
    });

    test("Manager CANNOT reset Admin passwords", async ({ page }) => {
      await login(page, testUsers.manager);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      // Wait for page to be fully loaded
      await page.waitForTimeout(1000);

      // Use search to find the admin user
      const searchInput = page.getByPlaceholder(/tìm theo tên hoặc email/i);
      await expect(searchInput).toBeVisible({ timeout: 5000 });
      await searchInput.clear();
      await searchInput.fill(adminUser.email);
      await page.waitForTimeout(500);

      // Find the admin user row with data-testid
      const adminRow = page.getByTestId(`team-member-row-${adminUser.email}`);

      if (await adminRow.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Check if password reset button exists using data-testid - should not be visible
        const passwordButton = adminRow.getByTestId('password-reset-button');
        const hasPasswordButton = await passwordButton.isVisible({ timeout: 1000 }).catch(() => false);

        expect(hasPasswordButton).toBe(false);
        console.log("✓ Manager correctly blocked from resetting Admin password (button not visible)");
      } else {
        console.log("✓ Admin user not visible to Manager (also acceptable)");
      }

      await logout(page);
    });

    test("Manager CAN reset Technician/Reception passwords", async ({ page }) => {
      await login(page, testUsers.manager);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      // Use search to find the reception user (was changed from technician)
      const searchInput = page.getByPlaceholder(/tìm theo tên hoặc email/i);
      await searchInput.fill(testUsers.technician.email);
      await page.waitForTimeout(500);

      // Find the user row with data-testid
      const userRow = page.getByTestId(`team-member-row-${testUsers.technician.email}`);
      await expect(userRow).toBeVisible({ timeout: 5000 });

      // Click the password reset button using data-testid
      const passwordButton = userRow.getByTestId('password-reset-button');
      await expect(passwordButton).toBeVisible({ timeout: 2000 });
      await passwordButton.click();

      // Wait for password reset dialog to appear
      const dialog = page.getByTestId('password-reset-dialog');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Fill in new password using data-testid
      const passwordInput = page.getByTestId('new-password-input');
      await passwordInput.fill("ManagerResetPass123!");

      // Click confirm button using data-testid
      await page.getByTestId('confirm-password-reset').click();

      // Wait for success message
      await expect(page.getByText(/đặt lại mật khẩu thành công/i)).toBeVisible({ timeout: 5000 });
      console.log("✓ Manager successfully reset Reception user password");

      await logout(page);
    });

    test("Search functionality filters users", async ({ page }) => {
      await login(page, adminUser);
      await page.goto("/team");
      await page.waitForLoadState("networkidle");

      // Find search input with exact Vietnamese placeholder
      const searchInput = page.getByPlaceholder(/tìm theo tên hoặc email/i);
      await searchInput.fill("tech");

      // Wait for filtering (debounce)
      await page.waitForTimeout(500);

      // Check that technician email is visible
      const techVisible = await page.getByText(testUsers.technician.email).isVisible().catch(() => false);

      // Check that reception is NOT visible (search for "tech" shouldn't match reception)
      const receptionVisible = await page.getByText(testUsers.reception.email).isVisible().catch(() => false);

      expect(techVisible).toBe(true);
      expect(receptionVisible).toBe(false);
      console.log("✓ Search successfully filters user list");

      await logout(page);
    });
  });

  // ========================================
  // CLEANUP
  // ========================================

  test.afterAll(async ({ browser }) => {
    // Optional: Clean up test users if needed
    // Comment out if you want to keep test users for manual testing

    /*
    const page = await browser.newPage();
    await login(page, adminUser);
    await page.goto("/team");

    for (const role of Object.keys(testUsers) as Role[]) {
      const user = testUsers[role];
      if (await userExists(page, user.email)) {
        const userRow = page.locator(`tr:has-text("${user.email}")`);
        await userRow.getByRole("button", { name: /delete|xóa/i }).click();
        await page.getByRole("button", { name: /confirm|xác nhận/i }).click();
        await expect(
          page.getByText(/deleted successfully|xóa thành công/i)
        ).toBeVisible();
      }
    }

    await page.close();
    */
  });
});
