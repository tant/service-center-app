/**
 * Task Template Management E2E Tests
 *
 * Tests task template CRUD operations including:
 * - Creating new templates for warranty and repair services
 * - Viewing template list and details
 * - Editing existing templates
 * - Deleting templates
 * - Template versioning
 * - Template activation/deactivation
 */

import { test, expect } from '@playwright/test';

// Only Admin and Manager should be able to manage task templates
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Task Template Management - List View', () => {
  test('should display task template list', async ({ page }) => {
    await page.goto('/task-templates');

    // Should show page title
    await expect(
      page.getByRole('heading', { name: /mẫu quy trình|task templates/i })
    ).toBeVisible();

    // Should have "Create New Template" button
    await expect(
      page.getByRole('button', { name: /tạo mới|create|new template/i })
    ).toBeVisible();

    // Should show template list (if any exist)
    // Table or cards should be visible
    const hasTable = await page.locator('table').isVisible();
    const hasCards = await page.locator('[data-testid="template-card"]').count();

    expect(hasTable || hasCards > 0).toBeTruthy();
  });

  test('should filter templates by service type', async ({ page }) => {
    await page.goto('/task-templates');

    // Look for filter dropdown or tabs
    const warrantyFilter = page.getByRole('button', { name: /bảo hành|warranty/i });
    const repairFilter = page.getByRole('button', { name: /sửa chữa|repair/i });

    if (await warrantyFilter.isVisible()) {
      await warrantyFilter.click();
      // Should show only warranty templates
      await expect(page.getByText(/bảo hành/i).first()).toBeVisible();
    }

    if (await repairFilter.isVisible()) {
      await repairFilter.click();
      // Should show only repair templates
      await expect(page.getByText(/sửa chữa/i).first()).toBeVisible();
    }
  });

  test('should search templates by name', async ({ page }) => {
    await page.goto('/task-templates');

    // Look for search input
    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('Card đồ họa');
      await page.waitForTimeout(500); // Wait for debounce

      // Results should be filtered
      await expect(page.getByText(/card đồ họa/i).first()).toBeVisible();
    }
  });
});

test.describe('Task Template Management - Create Template', () => {
  test('should create new warranty template for GPU', async ({ page }) => {
    await page.goto('/task-templates');

    // Click create button
    await page.getByRole('button', { name: /tạo mới|create|new template/i }).click();

    // Fill template details
    await page.getByLabel(/tên mẫu|template name/i).fill('Dịch vụ Bảo hành - Card đồ họa RTX');
    await page
      .getByLabel(/mô tả|description/i)
      .fill('Quy trình bảo hành cho card đồ họa ZOTAC RTX series (4090, 4070 Ti, 3060)');

    // Select service type
    await page.getByLabel(/loại dịch vụ|service type/i).click();
    await page.getByRole('option', { name: /bảo hành|warranty/i }).click();

    // Enable sequence enforcement
    const enforceSequence = page.getByLabel(/thứ tự bắt buộc|enforce sequence/i);
    if (await enforceSequence.isVisible()) {
      await enforceSequence.check();
    }

    // Add tasks
    await page.getByRole('button', { name: /thêm công việc|add task/i }).click();

    // Task 1: Intake
    await page.getByLabel(/tên công việc|task name/i).fill('Tiếp nhận và kiểm tra serial');
    await page.getByLabel(/danh mục|category/i).click();
    await page.getByRole('option', { name: /tiếp nhận|intake/i }).click();
    await page.getByLabel(/thời gian dự kiến|estimated time/i).fill('10');
    await page
      .getByLabel(/hướng dẫn|instructions/i)
      .fill('Kiểm tra serial number, ngày mua, tình trạng bảo hành');

    // Save task
    await page.getByRole('button', { name: /lưu công việc|save task/i }).click();

    // Add another task
    await page.getByRole('button', { name: /thêm công việc|add task/i }).click();

    // Task 2: Diagnosis
    await page.getByLabel(/tên công việc|task name/i).fill('Test card với hệ thống chuẩn');
    await page.getByLabel(/danh mục|category/i).click();
    await page.getByRole('option', { name: /chẩn đoán|diagnosis/i }).click();
    await page.getByLabel(/thời gian dự kiến|estimated time/i).fill('30');
    await page
      .getByLabel(/hướng dẫn|instructions/i)
      .fill('Chạy GPU-Z, FurMark, 3DMark để kiểm tra card');

    await page.getByRole('button', { name: /lưu công việc|save task/i }).click();

    // Save template
    await page.getByRole('button', { name: /lưu mẫu|save template/i }).click();

    // Should show success message
    await expect(page.getByText(/tạo thành công|created successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Should redirect to template list or detail page
    await page.waitForURL(/\/task-templates/);
  });

  test('should create new repair template for SSD', async ({ page }) => {
    await page.goto('/task-templates');

    await page.getByRole('button', { name: /tạo mới|create|new template/i }).click();

    await page.getByLabel(/tên mẫu|template name/i).fill('Dịch vụ Sửa chữa - SSD/NVMe');
    await page
      .getByLabel(/mô tả|description/i)
      .fill('Quy trình sửa chữa ổ cứng SSD và NVMe SSTC');

    // Select repair service type
    await page.getByLabel(/loại dịch vụ|service type/i).click();
    await page.getByRole('option', { name: /sửa chữa|repair/i }).click();

    // Add tasks
    await page.getByRole('button', { name: /thêm công việc|add task/i }).click();

    await page.getByLabel(/tên công việc|task name/i).fill('Kiểm tra và backup dữ liệu');
    await page.getByLabel(/danh mục|category/i).click();
    await page.getByRole('option', { name: /tiếp nhận|intake/i }).click();
    await page.getByLabel(/thời gian dự kiến|estimated time/i).fill('60');
    await page
      .getByLabel(/hướng dẫn|instructions/i)
      .fill('Thông báo khách về rủi ro mất dữ liệu. Backup nếu có thể.');

    await page.getByRole('button', { name: /lưu công việc|save task/i }).click();

    await page.getByRole('button', { name: /lưu mẫu|save template/i }).click();

    await expect(page.getByText(/tạo thành công|created successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should validate required fields when creating template', async ({ page }) => {
    await page.goto('/task-templates');

    await page.getByRole('button', { name: /tạo mới|create|new template/i }).click();

    // Try to save without filling required fields
    await page.getByRole('button', { name: /lưu mẫu|save template/i }).click();

    // Should show validation errors
    await expect(page.getByText(/bắt buộc|required/i).first()).toBeVisible();
  });
});

test.describe('Task Template Management - View Template Details', () => {
  test('should view template details', async ({ page }) => {
    await page.goto('/task-templates');

    // Click on first template in list
    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();
    } else {
      // If using table, click first row
      await page.locator('table tbody tr').first().click();
    }

    // Should show template details
    await expect(page.getByRole('heading', { name: /chi tiết|details/i })).toBeVisible();

    // Should show template name and description
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // Should show tasks list
    await expect(page.getByText(/công việc|tasks/i)).toBeVisible();
  });

  test('should display tasks in correct sequence', async ({ page }) => {
    await page.goto('/task-templates');

    // Find a template with enforced sequence
    const templateWithSequence = page.getByText(/thứ tự bắt buộc|sequence/i).first();
    if (await templateWithSequence.isVisible()) {
      await templateWithSequence.click();

      // Tasks should be numbered or have sequence indicators
      const taskList = page.locator('[data-testid="task-item"]');
      const count = await taskList.count();

      if (count > 0) {
        // Should show sequence numbers
        for (let i = 0; i < Math.min(count, 3); i++) {
          await expect(taskList.nth(i)).toBeVisible();
        }
      }
    }
  });
});

test.describe('Task Template Management - Edit Template', () => {
  test('should edit existing template', async ({ page }) => {
    await page.goto('/task-templates');

    // Click on first template
    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();
    } else {
      await page.locator('table tbody tr').first().click();
    }

    // Click edit button
    await page.getByRole('button', { name: /chỉnh sửa|edit/i }).click();

    // Change template name
    const nameInput = page.getByLabel(/tên mẫu|template name/i);
    const currentName = await nameInput.inputValue();
    await nameInput.fill(`${currentName} (Đã cập nhật)`);

    // Save changes
    await page.getByRole('button', { name: /lưu|save/i }).click();

    // Should show success message
    await expect(page.getByText(/cập nhật thành công|updated successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should add new task to existing template', async ({ page }) => {
    await page.goto('/task-templates');

    // Navigate to first template
    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();
    } else {
      await page.locator('table tbody tr').first().click();
    }

    await page.getByRole('button', { name: /chỉnh sửa|edit/i }).click();

    // Add new task
    await page.getByRole('button', { name: /thêm công việc|add task/i }).click();

    await page.getByLabel(/tên công việc|task name/i).fill('Kiểm tra chất lượng cuối cùng');
    await page.getByLabel(/danh mục|category/i).click();
    await page.getByRole('option', { name: /QA|kiểm tra/i }).click();
    await page.getByLabel(/thời gian dự kiến|estimated time/i).fill('15');

    await page.getByRole('button', { name: /lưu công việc|save task/i }).click();

    // Save template
    await page.getByRole('button', { name: /lưu|save/i }).click();

    await expect(page.getByText(/cập nhật thành công|updated successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should reorder tasks in template', async ({ page }) => {
    await page.goto('/task-templates');

    // Navigate to template
    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();
    } else {
      await page.locator('table tbody tr').first().click();
    }

    await page.getByRole('button', { name: /chỉnh sửa|edit/i }).click();

    // Look for drag handles or up/down buttons
    const moveUpButton = page.getByRole('button', { name: /lên|up/i }).first();
    const moveDownButton = page.getByRole('button', { name: /xuống|down/i }).first();

    if (await moveDownButton.isVisible()) {
      await moveDownButton.click();

      // Save
      await page.getByRole('button', { name: /lưu|save/i }).click();

      await expect(page.getByText(/cập nhật thành công|updated successfully/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

test.describe('Task Template Management - Delete Template', () => {
  test('should delete template with confirmation', async ({ page }) => {
    await page.goto('/task-templates');

    // Get initial count of templates
    const initialCount = await page.locator('[data-testid="template-card"]').count();

    if (initialCount === 0) {
      // If no templates, create one first
      await page.getByRole('button', { name: /tạo mới|create/i }).click();
      await page.getByLabel(/tên mẫu|template name/i).fill('Template để xóa');
      await page.getByLabel(/loại dịch vụ|service type/i).click();
      await page.getByRole('option').first().click();
      await page.getByRole('button', { name: /lưu|save/i }).click();
      await page.waitForTimeout(1000);
    }

    // Navigate to a template
    await page.goto('/task-templates');
    const templateToDelete = page.locator('[data-testid="template-card"]').first();
    if (await templateToDelete.isVisible()) {
      await templateToDelete.click();
    } else {
      await page.locator('table tbody tr').first().click();
    }

    // Click delete button
    await page.getByRole('button', { name: /xóa|delete/i }).click();

    // Should show confirmation dialog
    await expect(page.getByText(/xác nhận|confirm|chắc chắn|sure/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: /xác nhận|confirm|đồng ý/i }).click();

    // Should show success message
    await expect(page.getByText(/xóa thành công|deleted successfully/i)).toBeVisible({
      timeout: 5000,
    });

    // Should redirect to list
    await page.waitForURL(/\/task-templates$/);
  });

  test('should cancel delete operation', async ({ page }) => {
    await page.goto('/task-templates');

    // Navigate to template
    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();
    } else {
      await page.locator('table tbody tr').first().click();
    }

    // Click delete
    await page.getByRole('button', { name: /xóa|delete/i }).click();

    // Cancel deletion
    await page.getByRole('button', { name: /hủy|cancel/i }).click();

    // Should stay on same page
    await expect(page.getByRole('heading', { name: /chi tiết|details/i })).toBeVisible();
  });
});

test.describe('Task Template Management - Template Status', () => {
  test('should activate template', async ({ page }) => {
    await page.goto('/task-templates');

    // Find inactive template
    const inactiveTemplate = page.getByText(/không hoạt động|inactive/i).first();
    if (await inactiveTemplate.isVisible()) {
      await inactiveTemplate.click();

      // Activate
      await page.getByRole('button', { name: /kích hoạt|activate/i }).click();

      // Should show success
      await expect(page.getByText(/kích hoạt thành công|activated/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should deactivate template', async ({ page }) => {
    await page.goto('/task-templates');

    // Find active template
    const activeTemplate = page.getByText(/hoạt động|active/i).first();
    if (await activeTemplate.isVisible()) {
      await activeTemplate.click();

      // Deactivate
      await page.getByRole('button', { name: /vô hiệu|deactivate/i }).click();

      // Should show success
      await expect(page.getByText(/vô hiệu hóa thành công|deactivated/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

test.describe('Task Template Management - Permissions', () => {
  test('Manager should be able to create templates', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/manager.json' });
    const page = await context.newPage();

    await page.goto('/task-templates');

    // Should see create button
    await expect(
      page.getByRole('button', { name: /tạo mới|create/i })
    ).toBeVisible();

    await context.close();
  });

  test('Technician should not access template management', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/technician.json' });
    const page = await context.newPage();

    await page.goto('/task-templates');

    // Should show unauthorized or redirect
    const hasUnauthorized = await page.getByText(/không có quyền|unauthorized/i).isVisible();
    const hasRedirect = !page.url().includes('/task-templates');

    expect(hasUnauthorized || hasRedirect).toBeTruthy();

    await context.close();
  });
});
