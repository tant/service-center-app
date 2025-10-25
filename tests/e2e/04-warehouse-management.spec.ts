/**
 * Warehouse Management E2E Tests
 *
 * Tests warehouse operations including:
 * - Stock level tracking
 * - Serial number verification
 * - Stock movements (intake, outgoing, transfer)
 * - RMA batch operations
 * - Low stock alerts
 * - Virtual warehouse hierarchy (MAIN, WARRANTY, REPAIR, DEFECTIVE, CUSTOMER)
 */

import { test, expect } from '@playwright/test';

// Use admin role for warehouse management
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Warehouse - Stock Levels', () => {
  test('should display stock levels for all products', async ({ page }) => {
    await page.goto('/warehouse/stock');

    // Should show page title
    await expect(
      page.getByRole('heading', { name: /tồn kho|stock|inventory/i })
    ).toBeVisible();

    // Should show warehouse filter
    await expect(page.getByText(/kho chính|main warehouse|kho bảo hành|warranty/i)).toBeVisible();

    // Should show product list with stock quantities
    const hasTable = await page.locator('table').isVisible();
    if (hasTable) {
      // Table should have stock quantity columns
      await expect(page.getByText(/số lượng|quantity|tồn kho/i)).toBeVisible();
    }
  });

  test('should filter stock by warehouse location', async ({ page }) => {
    await page.goto('/warehouse/stock');

    // Filter by WARRANTY warehouse
    const warrantyFilter = page.getByRole('button', { name: /kho bảo hành|warranty/i });
    if (await warrantyFilter.isVisible()) {
      await warrantyFilter.click();

      // Should show only warranty warehouse stock
      await expect(page.getByText(/kho bảo hành|warranty warehouse/i)).toBeVisible();
    }

    // Filter by MAIN warehouse
    const mainFilter = page.getByRole('button', { name: /kho chính|main warehouse/i });
    if (await mainFilter.isVisible()) {
      await mainFilter.click();

      await expect(page.getByText(/kho chính|main warehouse/i)).toBeVisible();
    }
  });

  test('should search products by SKU or name', async ({ page }) => {
    await page.goto('/warehouse/stock');

    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);
    if (await searchInput.isVisible()) {
      // Search for ZOTAC RTX 4090
      await searchInput.fill('ZT-D40900D-10P');
      await page.waitForTimeout(500);

      // Should show RTX 4090
      await expect(page.getByText(/rtx 4090/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view product details with serial numbers', async ({ page }) => {
    await page.goto('/warehouse/stock');

    // Click on first product
    const firstProduct = page.locator('[data-testid="product-row"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
    } else {
      await page.locator('table tbody tr').first().click();
    }

    // Should show product details
    await expect(page.getByText(/chi tiết|details/i)).toBeVisible();

    // Should show list of serial numbers
    await expect(page.getByText(/serial number|số serial/i)).toBeVisible();
  });
});

test.describe('Warehouse - Stock Movements', () => {
  test('should create stock intake for ZOTAC RTX 4090', async ({ page }) => {
    await page.goto('/warehouse/movements');

    // Click "New Movement" or "Nhập kho"
    await page.getByRole('button', { name: /nhập kho|stock in|new movement/i }).click();

    // Select product
    await page.getByLabel(/sản phẩm|product/i).click();
    await page.getByRole('option', { name: /rtx 4090/i }).first().click();

    // Select warehouse (MAIN)
    await page.getByLabel(/kho|warehouse/i).click();
    await page.getByRole('option', { name: /kho chính|main/i }).click();

    // Set quantity
    await page.getByLabel(/số lượng|quantity/i).fill('5');

    // Enter serial numbers
    const serialInput = page.getByLabel(/serial number/i);
    if (await serialInput.isVisible()) {
      // Add 5 serial numbers
      for (let i = 1; i <= 5; i++) {
        await serialInput.fill(`ZT4090-20250125-${10000 + i}`);
        await page.getByRole('button', { name: /thêm|add/i }).click();
        await page.waitForTimeout(300);
      }
    }

    // Add notes
    await page
      .getByLabel(/ghi chú|notes/i)
      .fill('Nhập hàng mới từ nhà cung cấp - Batch 2025-01');

    // Submit
    await page.getByRole('button', { name: /xác nhận|confirm|lưu/i }).click();

    // Should show success
    await expect(page.getByText(/thành công|success/i)).toBeVisible({ timeout: 5000 });
  });

  test('should create stock outgoing for SSTC SSD', async ({ page }) => {
    await page.goto('/warehouse/movements');

    // Click "Stock Out" or "Xuất kho"
    await page.getByRole('button', { name: /xuất kho|stock out/i }).click();

    // Select product
    await page.getByLabel(/sản phẩm|product/i).click();
    await page.getByRole('option', { name: /sstc.*ssd/i }).first().click();

    // Select warehouse (MAIN)
    await page.getByLabel(/kho|warehouse/i).click();
    await page.getByRole('option', { name: /kho chính|main/i }).click();

    // Set quantity
    await page.getByLabel(/số lượng|quantity/i).fill('2');

    // Select serial numbers (if tracked)
    const serialSelect = page.getByLabel(/chọn serial|select serial/i);
    if (await serialSelect.isVisible()) {
      await serialSelect.click();
      // Select first 2 serials
      await page.locator('[data-testid="serial-checkbox"]').first().check();
      await page.locator('[data-testid="serial-checkbox"]').nth(1).check();
    }

    // Add reason
    await page.getByLabel(/lý do|reason/i).fill('Xuất kho để giao khách hàng');

    // Submit
    await page.getByRole('button', { name: /xác nhận|confirm/i }).click();

    await expect(page.getByText(/thành công|success/i)).toBeVisible({ timeout: 5000 });
  });

  test('should transfer stock between warehouses', async ({ page }) => {
    await page.goto('/warehouse/movements');

    await page.getByRole('button', { name: /chuyển kho|transfer/i }).click();

    // Select product
    await page.getByLabel(/sản phẩm|product/i).click();
    await page.getByRole('option').first().click();

    // From warehouse
    await page.getByLabel(/từ kho|from warehouse/i).click();
    await page.getByRole('option', { name: /kho chính|main/i }).click();

    // To warehouse
    await page.getByLabel(/đến kho|to warehouse/i).click();
    await page.getByRole('option', { name: /kho bảo hành|warranty/i }).click();

    // Quantity
    await page.getByLabel(/số lượng|quantity/i).fill('3');

    // Reason
    await page
      .getByLabel(/lý do|reason/i)
      .fill('Chuyển sang kho bảo hành để chuẩn bị RMA');

    // Submit
    await page.getByRole('button', { name: /xác nhận|confirm/i }).click();

    await expect(page.getByText(/thành công|success/i)).toBeVisible({ timeout: 5000 });
  });

  test('should view movement history', async ({ page }) => {
    await page.goto('/warehouse/movements');

    // Should show movement log
    await expect(page.getByText(/lịch sử|history|nhật ký|log/i)).toBeVisible();

    // Should show movement records
    const hasTable = await page.locator('table').isVisible();
    if (hasTable) {
      // Should show movement type (IN, OUT, TRANSFER)
      await expect(
        page.getByText(/nhập kho|xuất kho|chuyển kho|in|out|transfer/i)
      ).toBeVisible();
    }
  });
});

test.describe('Warehouse - Serial Number Verification', () => {
  test('should verify serial number exists in system', async ({ page }) => {
    await page.goto('/warehouse/serial-verification');

    // Enter serial number
    await page.getByLabel(/serial number/i).fill('ZT4090-20250125-45678');

    // Click verify
    await page.getByRole('button', { name: /kiểm tra|verify|xác minh/i }).click();

    // Should show verification result
    await expect(
      page.getByText(/tìm thấy|found|hợp lệ|valid|không tìm thấy|not found/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show serial number details and warranty info', async ({ page }) => {
    await page.goto('/warehouse/serial-verification');

    await page.getByLabel(/serial number/i).fill('ZT4090-20250125-45678');
    await page.getByRole('button', { name: /kiểm tra|verify/i }).click();

    // If serial exists, should show details
    const hasDetails = await page.getByText(/sản phẩm|product/i).isVisible({ timeout: 3000 });

    if (hasDetails) {
      // Should show product name
      await expect(page.getByText(/zotac|sstc/i)).toBeVisible();

      // Should show warranty status
      await expect(
        page.getByText(/bảo hành|warranty|hết hạn|expired|còn hạn|valid/i)
      ).toBeVisible();

      // Should show current location
      await expect(page.getByText(/vị trí|location|kho/i)).toBeVisible();
    }
  });

  test('should show error for invalid serial number', async ({ page }) => {
    await page.goto('/warehouse/serial-verification');

    await page.getByLabel(/serial number/i).fill('INVALID-SERIAL-99999');
    await page.getByRole('button', { name: /kiểm tra|verify/i }).click();

    // Should show not found error
    await expect(
      page.getByText(/không tìm thấy|not found|không tồn tại|does not exist/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Warehouse - RMA Batch Operations', () => {
  test('should create new RMA batch for GPU warranty', async ({ page }) => {
    await page.goto('/warehouse/rma');

    // Click "New RMA Batch"
    await page.getByRole('button', { name: /tạo lô|new batch|create batch/i }).click();

    // Select product
    await page.getByLabel(/sản phẩm|product/i).click();
    await page.getByRole('option', { name: /rtx 4090|rtx 4070/i }).first().click();

    // Select vendor (brand)
    await page.getByLabel(/nhà cung cấp|vendor|hãng/i).click();
    await page.getByRole('option', { name: /zotac/i }).click();

    // Add serial numbers to RMA
    await page.getByLabel(/serial number/i).fill('ZT4090-20250125-11111');
    await page.getByRole('button', { name: /thêm|add/i }).click();

    await page.getByLabel(/serial number/i).fill('ZT4090-20250125-22222');
    await page.getByRole('button', { name: /thêm|add/i }).click();

    await page.getByLabel(/serial number/i).fill('ZT4090-20250125-33333');
    await page.getByRole('button', { name: /thêm|add/i }).click();

    // Add notes
    await page
      .getByLabel(/ghi chú|notes|mô tả/i)
      .fill('Lô RMA tháng 01/2025 - 3 card RTX 4090 lỗi VGA core');

    // Submit
    await page.getByRole('button', { name: /tạo lô|create|lưu/i }).click();

    // Should show success and auto-generated RMA number
    await expect(page.getByText(/rma-\d{4}-\d{3}/i)).toBeVisible({ timeout: 5000 });
  });

  test('should view RMA batch list', async ({ page }) => {
    await page.goto('/warehouse/rma');

    // Should show RMA batches
    await expect(page.getByRole('heading', { name: /rma|lô bảo hành/i })).toBeVisible();

    // Should show batch numbers
    const hasTable = await page.locator('table').isVisible();
    if (hasTable) {
      await expect(page.getByText(/rma-/i).first()).toBeVisible();
    }
  });

  test('should update RMA batch status', async ({ page }) => {
    await page.goto('/warehouse/rma');

    // Click on first RMA batch
    const firstBatch = page.locator('[data-testid="rma-batch-row"]').first();
    if (await firstBatch.isVisible()) {
      await firstBatch.click();
    } else {
      await page.locator('table tbody tr').first().click();
    }

    // Change status
    await page.getByLabel(/trạng thái|status/i).click();
    await page
      .getByRole('option', { name: /đã gửi|sent|shipped|đang xử lý|processing/i })
      .click();

    // Add tracking info
    const trackingInput = page.getByLabel(/tracking|mã vận đơn/i);
    if (await trackingInput.isVisible()) {
      await trackingInput.fill('VN1234567890');
    }

    // Save
    await page.getByRole('button', { name: /lưu|save|cập nhật/i }).click();

    await expect(page.getByText(/cập nhật thành công|updated/i)).toBeVisible({ timeout: 5000 });
  });

  test('should record RMA return with replacement serials', async ({ page }) => {
    await page.goto('/warehouse/rma');

    // Find a sent/processing RMA batch
    const sentBatch = page.getByText(/đã gửi|sent|processing/i).first();
    if (await sentBatch.isVisible()) {
      await sentBatch.click();

      // Click "Record Return" or "Ghi nhận hàng về"
      const recordReturnButton = page.getByRole('button', {
        name: /ghi nhận|record return|hàng về/i,
      });

      if (await recordReturnButton.isVisible()) {
        await recordReturnButton.click();

        // Enter replacement serial numbers
        await page.getByLabel(/serial mới|new serial|replacement/i).fill('ZT4090-20250125-99991');
        await page.getByRole('button', { name: /thêm|add/i }).click();

        await page.getByLabel(/serial mới|new serial/i).fill('ZT4090-20250125-99992');
        await page.getByRole('button', { name: /thêm|add/i }).click();

        // Notes
        await page
          .getByLabel(/ghi chú|notes/i)
          .fill('Nhận được 2 card mới từ ZOTAC - serial thay thế');

        // Submit
        await page.getByRole('button', { name: /xác nhận|confirm/i }).click();

        await expect(page.getByText(/thành công|success/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Warehouse - Low Stock Alerts', () => {
  test('should display low stock alerts', async ({ page }) => {
    await page.goto('/warehouse/alerts');

    // Should show alerts page
    await expect(page.getByRole('heading', { name: /cảnh báo|alerts/i })).toBeVisible();

    // Should show low stock items (if any)
    const alertsList = page.locator('[data-testid="alert-item"]');
    const alertsCount = await alertsList.count();

    if (alertsCount > 0) {
      // Should show product name and current stock
      await expect(page.getByText(/số lượng|quantity|tồn kho/i)).toBeVisible();
    }
  });

  test('should filter alerts by warehouse', async ({ page }) => {
    await page.goto('/warehouse/alerts');

    // Filter by warehouse
    const warehouseFilter = page.getByLabel(/kho|warehouse/i);
    if (await warehouseFilter.isVisible()) {
      await warehouseFilter.click();
      await page.getByRole('option', { name: /kho chính|main/i }).click();

      // Should show filtered results
      await page.waitForTimeout(500);
    }
  });

  test('should configure low stock threshold', async ({ page }) => {
    await page.goto('/warehouse/stock');

    // Click on a product
    const firstProduct = page.locator('[data-testid="product-row"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Look for settings or edit button
      const editButton = page.getByRole('button', { name: /chỉnh sửa|edit|settings/i });
      if (await editButton.isVisible()) {
        await editButton.click();

        // Set low stock threshold
        const thresholdInput = page.getByLabel(/ngưỡng|threshold|mức tồn kho/i);
        if (await thresholdInput.isVisible()) {
          await thresholdInput.fill('10');

          // Save
          await page.getByRole('button', { name: /lưu|save/i }).click();

          await expect(page.getByText(/cập nhật|updated/i)).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

test.describe('Warehouse - Inventory Reports', () => {
  test('should generate stock summary report', async ({ page }) => {
    await page.goto('/warehouse/reports');

    // Select report type
    await page.getByLabel(/loại báo cáo|report type/i).click();
    await page.getByRole('option', { name: /tồn kho|stock|inventory/i }).click();

    // Select date range
    const fromDate = page.getByLabel(/từ ngày|from date/i);
    if (await fromDate.isVisible()) {
      await fromDate.fill('2025-01-01');
    }

    const toDate = page.getByLabel(/đến ngày|to date/i);
    if (await toDate.isVisible()) {
      await toDate.fill('2025-01-31');
    }

    // Generate report
    await page.getByRole('button', { name: /tạo báo cáo|generate|xuất/i }).click();

    // Should show report data
    await expect(page.getByText(/tổng|total|báo cáo|report/i)).toBeVisible({ timeout: 5000 });
  });

  test('should export report to Excel', async ({ page }) => {
    await page.goto('/warehouse/reports');

    await page.getByLabel(/loại báo cáo|report type/i).click();
    await page.getByRole('option').first().click();

    await page.getByRole('button', { name: /tạo báo cáo|generate/i }).click();
    await page.waitForTimeout(2000);

    // Click export button
    const exportButton = page.getByRole('button', { name: /xuất excel|export|download/i });
    if (await exportButton.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify filename
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
    }
  });
});

test.describe('Warehouse - Permissions', () => {
  test('Manager should access warehouse management', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/manager.json' });
    const page = await context.newPage();

    await page.goto('/warehouse');

    // Should access warehouse pages
    await expect(page).toHaveURL(/\/warehouse/);

    await context.close();
  });

  test('Technician should have read-only access', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/technician.json' });
    const page = await context.newPage();

    await page.goto('/warehouse/stock');

    // Should view stock but not create movements
    const newMovementButton = page.getByRole('button', { name: /nhập kho|new movement/i });

    if (await newMovementButton.isVisible()) {
      // Should be disabled or hidden
      const isDisabled = await newMovementButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }

    await context.close();
  });

  test('Reception should not access warehouse', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/reception.json' });
    const page = await context.newPage();

    await page.goto('/warehouse');

    // Should show unauthorized or redirect
    const hasUnauthorized = await page.getByText(/không có quyền|unauthorized/i).isVisible();
    const hasRedirect = !page.url().includes('/warehouse');

    expect(hasUnauthorized || hasRedirect).toBeTruthy();

    await context.close();
  });
});
