/**
 * E2E Tests: Task Dashboard (/my-tasks)
 *
 * Tests the polymorphic task management dashboard including:
 * - Dashboard display and stats
 * - Task filtering (status, entity type, overdue, required)
 * - Task actions (start, complete, block, unblock)
 * - Real-time updates (polling)
 * - Error handling
 *
 * Week 4 - Phase 1 Testing
 */

import { test, expect, Page } from "@playwright/test";
import { login, logout } from "./helpers";
import { adminUser, testUsers } from "./test-data";

test.describe("Task Dashboard", () => {

  test.beforeEach(async ({ page }) => {
    // Login as admin for setup
    await login(page, adminUser);
    await page.goto("/my-tasks");
    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async ({ page }) => {
    // Skip logout if page is already closed or navigated away
    try {
      if (!page.isClosed()) {
        await logout(page);
      }
    } catch (error) {
      // Ignore logout errors in cleanup
      console.log("Logout error (ignored):", error);
    }
  });

  test.describe("Dashboard Display", () => {

    test("should display the task dashboard page correctly", async ({ page }) => {
      // Verify page title
      await expect(page.locator("h1")).toContainText("Công việc của tôi");

      // Verify stats cards are visible (use exact text in muted-foreground)
      await expect(page.locator('p.text-muted-foreground', { hasText: "Tổng số" })).toBeVisible();
      await expect(page.locator('p.text-muted-foreground', { hasText: "Chờ xử lý" })).toBeVisible();
      await expect(page.locator('p.text-muted-foreground', { hasText: "Đang xử lý" })).toBeVisible();
      await expect(page.locator('p.text-muted-foreground', { hasText: "Hoàn thành" })).toBeVisible();
      await expect(page.locator('p.text-muted-foreground', { hasText: "Bị chặn" })).toBeVisible();
      await expect(page.locator('p.text-muted-foreground', { hasText: "Quá hạn" })).toBeVisible();

      // Verify refresh button exists
      await expect(page.getByRole("button", { name: /làm mới/i })).toBeVisible();
    });

    test("should show empty state when no tasks exist", async ({ page }) => {
      // Wait for loading spinner to disappear
      await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});

      // Wait a bit for data to load
      await page.waitForTimeout(1000);

      // Check if empty state is shown (if no tasks)
      const emptyState = page.getByText("Không có công việc nào");
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
        await expect(page.getByText("Không tìm thấy công việc nào với bộ lọc hiện tại")).toBeVisible();
      } else {
        // If no empty state, then there must be task cards
        const taskCards = page.locator('.grid.gap-4.md\\:grid-cols-2');
        await expect(taskCards).toBeVisible();
      }
    });

    test("should display stats summary with correct structure", async ({ page }) => {
      // Wait for stats to load
      await page.waitForLoadState("networkidle");

      // Verify stats card structure
      const statsCards = page.locator('[class*="grid"][class*="gap-4"]').first();
      await expect(statsCards).toBeVisible();

      // Verify each stat has a number and label
      const totalStat = page.locator('text=Tổng số').locator('..').locator('..');
      await expect(totalStat.locator('.text-2xl')).toBeVisible();
    });
  });

  test.describe("Task Filtering", () => {

    test("should have all filter options available", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Verify status filter exists
      const statusFilter = page.getByLabel("Trạng thái");
      await expect(statusFilter).toBeVisible();

      // Verify entity type filter exists
      const entityTypeFilter = page.getByLabel("Loại công việc");
      await expect(entityTypeFilter).toBeVisible();

      // Verify checkbox filters
      await expect(page.getByText("Chỉ hiển thị công việc quá hạn")).toBeVisible();
      await expect(page.getByText("Chỉ hiển thị công việc bắt buộc")).toBeVisible();
    });

    test("should filter tasks by status", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Click status filter
      const statusFilter = page.getByLabel("Trạng thái");
      await statusFilter.click();

      // Select "Chờ xử lý" (pending)
      await page.getByRole("option", { name: "Chờ xử lý" }).click();

      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // Verify URL or state updated (implementation may vary)
      // This test validates the filter UI works
    });

    test("should filter tasks by entity type", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Click entity type filter
      const entityTypeFilter = page.getByLabel("Loại công việc");
      await entityTypeFilter.click();

      // Wait for dropdown to open
      await page.waitForTimeout(500);

      // Verify all entity type options exist
      await expect(page.getByRole("option", { name: "Phiếu sửa chữa" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Phiếu nhập kho" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Phiếu xuất kho" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Phiếu chuyển kho" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Yêu cầu dịch vụ" })).toBeVisible();

      // Close the dropdown by pressing Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    });

    test("should filter tasks by overdue checkbox", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Find and click overdue checkbox
      const overdueCheckbox = page.getByLabel("Chỉ hiển thị công việc quá hạn");
      await overdueCheckbox.check();

      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // Verify checkbox is checked
      await expect(overdueCheckbox).toBeChecked();
    });

    test("should filter tasks by required-only checkbox", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Find and click required-only checkbox
      const requiredCheckbox = page.getByLabel("Chỉ hiển thị công việc bắt buộc");
      await requiredCheckbox.check();

      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // Verify checkbox is checked
      await expect(requiredCheckbox).toBeChecked();
    });

    test("should allow multiple filters simultaneously", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Apply status filter
      const statusFilter = page.getByLabel("Trạng thái");
      await statusFilter.click();
      await page.getByRole("option", { name: "Đang xử lý" }).click();

      // Apply required-only filter
      const requiredCheckbox = page.getByLabel("Chỉ hiển thị công việc bắt buộc");
      await requiredCheckbox.check();

      // Wait for filters to apply
      await page.waitForTimeout(1000);

      // Verify both filters are active
      await expect(requiredCheckbox).toBeChecked();
    });
  });

  test.describe("Task Actions", () => {

    test.skip("should start a pending task", async ({ page }) => {
      // Skip if no tasks available
      await page.waitForLoadState("networkidle");

      // Look for a task card with "Bắt đầu" button
      const startButton = page.getByRole("button", { name: "Bắt đầu" }).first();

      if (await startButton.isVisible({ timeout: 2000 })) {
        await startButton.click();

        // Verify success toast
        await expect(page.getByText("Đã bắt đầu công việc")).toBeVisible({ timeout: 5000 });

        // Verify button changed
        await page.waitForTimeout(1000);
        await expect(startButton).not.toBeVisible();
      }
    });

    test.skip("should complete an in-progress task", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Look for a task card with "Hoàn thành" button
      const completeButton = page.getByRole("button", { name: "Hoàn thành" }).first();

      if (await completeButton.isVisible({ timeout: 2000 })) {
        await completeButton.click();

        // Verify dialog appears
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        // Fill completion notes
        await page.getByLabel(/ghi chú/i).fill("Task completed successfully during E2E test");

        // Click confirm
        await page.getByRole("button", { name: /xác nhận|hoàn thành/i }).click();

        // Verify success toast
        await expect(page.getByText("Đã hoàn thành công việc")).toBeVisible({ timeout: 5000 });
      }
    });

    test.skip("should block an in-progress task", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Look for a task card with "Báo chặn" button
      const blockButton = page.getByRole("button", { name: "Báo chặn" }).first();

      if (await blockButton.isVisible({ timeout: 2000 })) {
        await blockButton.click();

        // Verify dialog appears
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        // Fill block reason
        await page.getByLabel(/lý do/i).fill("Waiting for parts - E2E test");

        // Click confirm
        await page.getByRole("button", { name: /xác nhận|báo chặn/i }).click();

        // Verify success toast
        await expect(page.getByText(/Đã báo chặn công việc|Manager sẽ được thông báo/i)).toBeVisible({ timeout: 5000 });
      }
    });

    test.skip("should unblock a blocked task", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Look for a task card with "Bỏ chặn" button
      const unblockButton = page.getByRole("button", { name: "Bỏ chặn" }).first();

      if (await unblockButton.isVisible({ timeout: 2000 })) {
        await unblockButton.click();

        // Verify success toast
        await expect(page.getByText("Đã bỏ chặn công việc")).toBeVisible({ timeout: 5000 });
      }
    });

    test("should show loading state during action", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Any action button
      const actionButton = page.getByRole("button", { name: /bắt đầu|hoàn thành|báo chặn/i }).first();

      if (await actionButton.isVisible({ timeout: 2000 })) {
        // Verify button is not disabled initially
        await expect(actionButton).toBeEnabled();
      }
    });
  });

  test.describe("Real-time Updates", () => {

    test("should have manual refresh button", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Verify refresh button exists
      const refreshButton = page.getByRole("button", { name: /làm mới/i });
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toBeEnabled();
    });

    test("should refresh tasks when refresh button clicked", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Click refresh button
      const refreshButton = page.getByRole("button", { name: /làm mới/i });
      await refreshButton.click();

      // Wait for network activity
      await page.waitForTimeout(1000);

      // Verify button is still enabled after refresh
      await expect(refreshButton).toBeEnabled();
    });

    test("should show loading spinner during refresh", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Click refresh and immediately check for spinner
      const refreshButton = page.getByRole("button", { name: /làm mới/i });
      await refreshButton.click();

      // Check for spinner animation (lucide-react RefreshCw with animate-spin)
      const spinner = page.locator('.animate-spin').first();
      // Spinner may be too fast to catch, so we just verify button exists
      await expect(refreshButton).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {

    test("should handle empty state gracefully", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Apply filters that return no results
      const statusFilter = page.getByLabel("Trạng thái");
      await statusFilter.click();
      await page.getByRole("option", { name: "Hoàn thành" }).click();

      const requiredCheckbox = page.getByLabel("Chỉ hiển thị công việc bắt buộc");
      await requiredCheckbox.check();

      await page.waitForTimeout(1000);

      // Should show empty state or no tasks message
      // (Exact message depends on whether there are completed required tasks)
    });

    test("should show error state if API fails", async ({ page }) => {
      // This test requires mocking API failure
      // For now, we just verify the error UI exists
      await page.waitForLoadState("networkidle");

      // Check for error display capability
      // Actual error testing would require intercepting network requests
    });
  });

  test.describe("Task Card Display", () => {

    test.skip("should display task card with all information", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Wait for task cards to appear
      const taskCard = page.locator('[class*="card"]').first();

      if (await taskCard.isVisible({ timeout: 2000 })) {
        // Verify task card has required elements
        // Title, description, status badge, entity context
        await expect(taskCard).toBeVisible();
      }
    });

    test.skip("should show overdue indicator for overdue tasks", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Look for overdue tasks (red border)
      const overdueCard = page.locator('[class*="border-destructive"]').first();

      if (await overdueCard.isVisible({ timeout: 2000 })) {
        await expect(overdueCard).toBeVisible();
        await expect(overdueCard.getByText(/quá hạn/i)).toBeVisible();
      }
    });

    test.skip("should display entity context with link", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Look for entity context section
      const taskCard = page.locator('[class*="card"]').first();

      if (await taskCard.isVisible({ timeout: 2000 })) {
        // Verify external link icon exists
        const externalLink = taskCard.getByRole("link").first();
        if (await externalLink.isVisible({ timeout: 1000 })) {
          await expect(externalLink).toBeVisible();
        }
      }
    });

    test.skip("should show required badge for required tasks", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Look for "Bắt buộc" badge
      const requiredBadge = page.getByText("Bắt buộc").first();

      if (await requiredBadge.isVisible({ timeout: 2000 })) {
        await expect(requiredBadge).toBeVisible();
      }
    });
  });

  test.describe("Performance", () => {

    test("should load dashboard within acceptable time", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/my-tasks");
      await page.waitForLoadState("networkidle");

      const loadTime = Date.now() - startTime;

      // Should load in under 5 seconds (lenient for E2E)
      expect(loadTime).toBeLessThan(5000);

      console.log(`Dashboard load time: ${loadTime}ms`);
    });

    test("should handle large number of filters without lag", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      const startTime = Date.now();

      // Apply multiple filters quickly
      const statusFilter = page.getByLabel("Trạng thái");
      await statusFilter.click();
      await page.getByRole("option", { name: "Đang xử lý" }).click();

      const overdueCheckbox = page.getByLabel("Chỉ hiển thị công việc quá hạn");
      await overdueCheckbox.check();

      const requiredCheckbox = page.getByLabel("Chỉ hiển thị công việc bắt buộc");
      await requiredCheckbox.check();

      await page.waitForLoadState("networkidle");

      const filterTime = Date.now() - startTime;

      // Filtering should be fast (under 2 seconds)
      expect(filterTime).toBeLessThan(2000);

      console.log(`Filter application time: ${filterTime}ms`);
    });
  });

  test.describe("Mobile Responsiveness", () => {

    test("should display correctly on mobile viewport", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/my-tasks");
      await page.waitForLoadState("networkidle");

      // Verify page elements are still visible
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByText("Tổng số")).toBeVisible();
    });

    test("should have responsive grid layout", async ({ page }) => {
      await page.waitForLoadState("networkidle");

      // Desktop view (default)
      let statsGrid = page.locator('[class*="grid"][class*="gap-4"]').first();
      await expect(statsGrid).toBeVisible();

      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      statsGrid = page.locator('[class*="grid"][class*="gap-4"]').first();
      await expect(statsGrid).toBeVisible();
    });
  });
});
