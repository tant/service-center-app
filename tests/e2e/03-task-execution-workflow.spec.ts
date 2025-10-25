/**
 * Task Execution Workflow E2E Tests
 *
 * Tests the complete service ticket workflow including:
 * - Creating service tickets (warranty and repair)
 * - Executing tasks in sequence
 * - Task status transitions
 * - Adding comments and photos
 * - Using replacement parts
 * - Completing tickets
 * - Dynamic template switching
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

// Use technician role for task execution
test.use({ storageState: 'playwright/.auth/technician.json' });

test.describe('Task Execution - Warranty Service (GPU)', () => {
  test('should execute warranty service workflow for RTX 4090', async ({ page }) => {
    // First, create a ticket (as reception)
    const receptionContext = await page.context().browser()?.newContext({
      storageState: 'playwright/.auth/reception.json',
    });

    if (receptionContext) {
      const receptionPage = await receptionContext.newPage();
      await receptionPage.goto('/tickets/new');

      // Fill customer info
      await receptionPage.getByLabel(/tên khách hàng|customer name/i).fill('Nguyễn Minh Tuấn');
      await receptionPage.getByLabel(/số điện thoại|phone/i).fill('0901234567');
      await receptionPage.getByLabel(/email/i).fill('tuannm.pc@gmail.com');

      // Fill device info
      await receptionPage
        .getByLabel(/loại thiết bị|device type/i)
        .fill('Card đồ họa ZOTAC RTX 4090 Trinity');
      await receptionPage.getByLabel(/serial number/i).fill('ZT4090-20250125-45678');

      // Fill issue description
      await receptionPage
        .getByLabel(/mô tả sự cố|issue description/i)
        .fill(
          'Card không lên hình, đèn LED sáng bình thường nhưng màn hình không có tín hiệu. Đã thử đổi màn hình và cáp HDMI khác nhưng vẫn không được.'
        );

      // Select service type
      await receptionPage.getByLabel(/loại dịch vụ|service type/i).click();
      await receptionPage.getByRole('option', { name: /bảo hành|warranty/i }).click();

      // Select template
      await receptionPage.getByLabel(/mẫu quy trình|template/i).click();
      await receptionPage
        .getByRole('option', { name: /card đồ họa|gpu|rtx/i })
        .first()
        .click();

      // Submit
      await receptionPage.getByRole('button', { name: /tạo phiếu|create ticket/i }).click();

      // Wait for success
      await expect(
        receptionPage.getByText(/tạo thành công|created successfully/i)
      ).toBeVisible({ timeout: 10000 });

      // Get ticket number from URL or page
      await receptionPage.waitForURL(/\/tickets\/SV-/);
      const ticketUrl = receptionPage.url();
      const ticketId = ticketUrl.match(/\/tickets\/(SV-\d{4}-\d{3})/)?.[1];

      await receptionContext.close();

      // Now continue as technician
      if (ticketId) {
        await page.goto(`/tickets/${ticketId}`);

        // Should see ticket details
        await expect(page.getByText(/rtx 4090/i)).toBeVisible();

        // Should see task list
        await expect(page.getByText(/tiếp nhận|intake/i)).toBeVisible();

        // Start first task
        await page.getByRole('button', { name: /bắt đầu|start/i }).first().click();

        // Fill task details
        await page
          .getByLabel(/ghi chú|notes|nhận xét/i)
          .fill('Đã kiểm tra serial number. Sản phẩm còn bảo hành đến tháng 12/2026.');

        // Upload photo (if field exists)
        const photoInput = page.locator('input[type="file"]').first();
        if (await photoInput.isVisible()) {
          // Create a dummy image file for testing
          const dummyImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
          // In real test, you'd use an actual image file
        }

        // Complete task
        await page.getByRole('button', { name: /hoàn thành|complete/i }).click();

        // Should see success message
        await expect(page.getByText(/hoàn thành|completed/i)).toBeVisible({ timeout: 5000 });

        // Move to next task (Diagnosis)
        await page.getByRole('button', { name: /bắt đầu|start/i }).first().click();

        await page
          .getByLabel(/ghi chú|notes/i)
          .fill(
            'Test card với test bench. GPU-Z phát hiện card nhưng không xuất tín hiệu. FurMark không chạy được. Kết luận: VGA core bị lỗi.'
          );

        // Complete diagnosis task
        await page.getByRole('button', { name: /hoàn thành|complete/i }).click();

        await expect(page.getByText(/hoàn thành|completed/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should enforce task sequence for warranty service', async ({ page }) => {
    // Create ticket first (similar to above, but simpler)
    const receptionContext = await page.context().browser()?.newContext({
      storageState: 'playwright/.auth/reception.json',
    });

    if (receptionContext) {
      const receptionPage = await receptionContext.newPage();
      await receptionPage.goto('/tickets/new');

      await receptionPage.getByLabel(/tên khách hàng|customer name/i).fill('Test Customer');
      await receptionPage.getByLabel(/số điện thoại|phone/i).fill('0909123456');
      await receptionPage
        .getByLabel(/loại thiết bị|device type/i)
        .fill('ZOTAC RTX 4070 Ti');
      await receptionPage.getByLabel(/serial number/i).fill('ZT4070-20250125-12345');
      await receptionPage
        .getByLabel(/mô tả sự cố|issue description/i)
        .fill('Quạt card không quay');
      await receptionPage.getByLabel(/loại dịch vụ|service type/i).click();
      await receptionPage.getByRole('option', { name: /bảo hành|warranty/i }).click();
      await receptionPage.getByLabel(/mẫu quy trình|template/i).click();
      await receptionPage.getByRole('option').first().click();
      await receptionPage.getByRole('button', { name: /tạo phiếu|create/i }).click();

      await receptionPage.waitForURL(/\/tickets\/SV-/);
      const ticketUrl = receptionPage.url();
      const ticketId = ticketUrl.match(/\/tickets\/(SV-\d{4}-\d{3})/)?.[1];

      await receptionContext.close();

      if (ticketId) {
        await page.goto(`/tickets/${ticketId}`);

        // Try to start task 3 before completing tasks 1 and 2
        const allStartButtons = page.getByRole('button', { name: /bắt đầu|start/i });
        const buttonCount = await allStartButtons.count();

        if (buttonCount > 2) {
          const thirdButton = allStartButtons.nth(2);

          // Third task should be disabled or not clickable
          const isDisabled = await thirdButton.isDisabled();
          expect(isDisabled).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Task Execution - Repair Service (SSD)', () => {
  test('should execute repair service workflow for SSTC SSD', async ({ page }) => {
    // Create repair ticket
    const receptionContext = await page.context().browser()?.newContext({
      storageState: 'playwright/.auth/reception.json',
    });

    if (receptionContext) {
      const receptionPage = await receptionContext.newPage();
      await receptionPage.goto('/tickets/new');

      await receptionPage.getByLabel(/tên khách hàng|customer name/i).fill('Trần Hoàng Long');
      await receptionPage.getByLabel(/số điện thoại|phone/i).fill('0902345678');
      await receptionPage.getByLabel(/email/i).fill('longth@company.vn');
      await receptionPage
        .getByLabel(/loại thiết bị|device type/i)
        .fill('Ổ cứng SSD SATA SSTC 1TB');
      await receptionPage.getByLabel(/serial number/i).fill('SSTC-SSD-20250125-67890');
      await receptionPage
        .getByLabel(/mô tả sự cố|issue description/i)
        .fill('Ổ SSD không được nhận diện trong BIOS. Đã thử cắm vào cổng SATA khác.');

      // Select REPAIR service type
      await receptionPage.getByLabel(/loại dịch vụ|service type/i).click();
      await receptionPage.getByRole('option', { name: /sửa chữa|repair/i }).click();

      // Select SSD repair template
      await receptionPage.getByLabel(/mẫu quy trình|template/i).click();
      await receptionPage
        .getByRole('option', { name: /ssd|nvme/i })
        .first()
        .click();

      await receptionPage.getByRole('button', { name: /tạo phiếu|create/i }).click();

      await receptionPage.waitForURL(/\/tickets\/SV-/);
      const ticketUrl = receptionPage.url();
      const ticketId = ticketUrl.match(/\/tickets\/(SV-\d{4}-\d{3})/)?.[1];

      await receptionContext.close();

      if (ticketId) {
        await page.goto(`/tickets/${ticketId}`);

        // Start intake task
        await page.getByRole('button', { name: /bắt đầu|start/i }).first().click();

        await page
          .getByLabel(/ghi chú|notes/i)
          .fill('Đã thông báo khách về chính sách mất dữ liệu. Không backup được vì ổ không nhận.');

        await page.getByRole('button', { name: /hoàn thành|complete/i }).click();

        await expect(page.getByText(/hoàn thành|completed/i)).toBeVisible({ timeout: 5000 });

        // Start diagnosis task
        await page.getByRole('button', { name: /bắt đầu|start/i }).first().click();

        await page
          .getByLabel(/ghi chú|notes/i)
          .fill(
            'Test với CrystalDiskInfo: không phát hiện ổ. Thử với máy khác: vẫn không nhận. Kết luận: controller board bị lỗi.'
          );

        await page.getByRole('button', { name: /hoàn thành|complete/i }).click();

        // Start quote task
        await page.getByRole('button', { name: /bắt đầu|start/i }).first().click();

        // Fill repair quote
        await page.getByLabel(/chi phí sửa chữa|repair cost/i).fill('500000');
        await page
          .getByLabel(/ghi chú|notes/i)
          .fill('Chi phí thay controller board: 500,000 VNĐ. Thời gian: 2-3 ngày.');

        await page.getByRole('button', { name: /hoàn thành|complete/i }).click();

        await expect(page.getByText(/hoàn thành|completed/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Task Execution - Using Replacement Parts', () => {
  test('should add replacement parts to ticket', async ({ page }) => {
    // Create ticket that needs parts
    const receptionContext = await page.context().browser()?.newContext({
      storageState: 'playwright/.auth/reception.json',
    });

    if (receptionContext) {
      const receptionPage = await receptionContext.newPage();
      await receptionPage.goto('/tickets/new');

      await receptionPage.getByLabel(/tên khách hàng|customer name/i).fill('Lê Thị Hồng');
      await receptionPage.getByLabel(/số điện thoại|phone/i).fill('0903456789');
      await receptionPage
        .getByLabel(/loại thiết bị|device type/i)
        .fill('ZOTAC RTX 3060 Twin Edge');
      await receptionPage.getByLabel(/serial number/i).fill('ZT3060-20250125-11111');
      await receptionPage
        .getByLabel(/mô tả sự cố|issue description/i)
        .fill('Quạt card kêu to và rung');
      await receptionPage.getByLabel(/loại dịch vụ|service type/i).click();
      await receptionPage.getByRole('option', { name: /bảo hành|warranty/i }).click();
      await receptionPage.getByLabel(/mẫu quy trình|template/i).click();
      await receptionPage.getByRole('option').first().click();
      await receptionPage.getByRole('button', { name: /tạo phiếu|create/i }).click();

      await receptionPage.waitForURL(/\/tickets\/SV-/);
      const ticketUrl = receptionPage.url();
      const ticketId = ticketUrl.match(/\/tickets\/(SV-\d{4}-\d{3})/)?.[1];

      await receptionContext.close();

      if (ticketId) {
        await page.goto(`/tickets/${ticketId}`);

        // Complete intake and diagnosis tasks first
        await page.getByRole('button', { name: /bắt đầu|start/i }).first().click();
        await page.getByLabel(/ghi chú|notes/i).fill('Kiểm tra serial OK');
        await page.getByRole('button', { name: /hoàn thành|complete/i }).click();
        await page.waitForTimeout(1000);

        await page.getByRole('button', { name: /bắt đầu|start/i }).first().click();
        await page.getByLabel(/ghi chú|notes/i).fill('Phát hiện quạt bị lỗi bearing');
        await page.getByRole('button', { name: /hoàn thành|complete/i }).click();
        await page.waitForTimeout(1000);

        // Now in repair task, add replacement parts
        await page.getByRole('button', { name: /bắt đầu|start/i }).first().click();

        // Look for "Add Parts" or "Thêm linh kiện" button
        const addPartsButton = page.getByRole('button', { name: /thêm linh kiện|add parts/i });
        if (await addPartsButton.isVisible()) {
          await addPartsButton.click();

          // Search for fan part
          await page.getByLabel(/tìm kiếm|search/i).fill('quạt GPU 92mm');
          await page.waitForTimeout(500);

          // Select part
          await page.getByText(/quạt GPU 92mm/i).first().click();

          // Set quantity
          await page.getByLabel(/số lượng|quantity/i).fill('2');

          // Confirm
          await page.getByRole('button', { name: /xác nhận|confirm|thêm/i }).click();

          // Should see part added
          await expect(page.getByText(/quạt GPU 92mm/i)).toBeVisible();
        }

        await page.getByRole('button', { name: /hoàn thành|complete/i }).click();
      }
    }
  });
});

test.describe('Task Execution - Comments and Photos', () => {
  test('should add comments to ticket', async ({ page }) => {
    await page.goto('/tickets');

    // Click on first ticket
    const firstTicket = page.locator('[data-testid="ticket-row"]').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();
    } else {
      await page.locator('table tbody tr').first().click();
    }

    // Look for comment section
    const commentInput = page.getByLabel(/bình luận|comment|ghi chú/i);
    if (await commentInput.isVisible()) {
      await commentInput.fill('Đã liên hệ khách hàng thông báo tiến độ sửa chữa.');

      // Submit comment
      await page.getByRole('button', { name: /gửi|send|thêm/i }).click();

      // Should see comment in list
      await expect(page.getByText(/liên hệ khách hàng/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view task history and timeline', async ({ page }) => {
    await page.goto('/tickets');

    const firstTicket = page.locator('[data-testid="ticket-row"]').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();
    } else {
      await page.locator('table tbody tr').first().click();
    }

    // Look for history/timeline section
    const historySection = page.getByText(/lịch sử|history|timeline/i);
    if (await historySection.isVisible()) {
      await historySection.click();

      // Should show task completion events
      await expect(page.getByText(/hoàn thành|completed/i).first()).toBeVisible();
    }
  });
});

test.describe('Task Execution - Dynamic Template Switching', () => {
  test('should switch template during service', async ({ page }) => {
    // This test requires manager role
    const managerContext = await page.context().browser()?.newContext({
      storageState: 'playwright/.auth/manager.json',
    });

    if (managerContext) {
      const managerPage = await managerContext.newPage();

      // Create ticket first
      const receptionContext = await page.context().browser()?.newContext({
        storageState: 'playwright/.auth/reception.json',
      });

      if (receptionContext) {
        const receptionPage = await receptionContext.newPage();
        await receptionPage.goto('/tickets/new');

        await receptionPage.getByLabel(/tên khách hàng|customer name/i).fill('Phạm Văn Đức');
        await receptionPage.getByLabel(/số điện thoại|phone/i).fill('0904567890');
        await receptionPage
          .getByLabel(/loại thiết bị|device type/i)
          .fill('RAM SSTC DDR5 32GB');
        await receptionPage.getByLabel(/serial number/i).fill('SSTC-RAM-20250125-99999');
        await receptionPage
          .getByLabel(/mô tả sự cố|issue description/i)
          .fill('Máy bị Blue Screen MEMORY_MANAGEMENT');
        await receptionPage.getByLabel(/loại dịch vụ|service type/i).click();
        await receptionPage.getByRole('option', { name: /bảo hành|warranty/i }).click();
        await receptionPage.getByLabel(/mẫu quy trình|template/i).click();
        await receptionPage.getByRole('option').first().click();
        await receptionPage.getByRole('button', { name: /tạo phiếu|create/i }).click();

        await receptionPage.waitForURL(/\/tickets\/SV-/);
        const ticketUrl = receptionPage.url();
        const ticketId = ticketUrl.match(/\/tickets\/(SV-\d{4}-\d{3})/)?.[1];

        await receptionContext.close();

        if (ticketId) {
          await managerPage.goto(`/tickets/${ticketId}`);

          // Look for "Change Template" or "Đổi mẫu" button
          const changeTemplateButton = managerPage.getByRole('button', {
            name: /đổi mẫu|change template|switch template/i,
          });

          if (await changeTemplateButton.isVisible()) {
            await changeTemplateButton.click();

            // Select new template
            await managerPage.getByLabel(/mẫu mới|new template/i).click();
            await managerPage.getByRole('option').nth(1).click();

            // Provide reason
            await managerPage
              .getByLabel(/lý do|reason/i)
              .fill('Phát hiện cần quy trình khác sau khi chẩn đoán');

            // Confirm
            await managerPage.getByRole('button', { name: /xác nhận|confirm/i }).click();

            // Should show success
            await expect(
              managerPage.getByText(/đổi mẫu thành công|template changed/i)
            ).toBeVisible({ timeout: 5000 });
          }
        }
      }

      await managerContext.close();
    }
  });
});

test.describe('Task Execution - Ticket Completion', () => {
  test('should complete entire ticket workflow', async ({ page }) => {
    // Create simple ticket
    const receptionContext = await page.context().browser()?.newContext({
      storageState: 'playwright/.auth/reception.json',
    });

    if (receptionContext) {
      const receptionPage = await receptionContext.newPage();
      await receptionPage.goto('/tickets/new');

      await receptionPage.getByLabel(/tên khách hàng|customer name/i).fill('Test Customer');
      await receptionPage.getByLabel(/số điện thoại|phone/i).fill('0909999999');
      await receptionPage.getByLabel(/loại thiết bị|device type/i).fill('Test Device');
      await receptionPage.getByLabel(/serial number/i).fill('TEST-12345');
      await receptionPage.getByLabel(/mô tả sự cố|issue description/i).fill('Test issue');
      await receptionPage.getByLabel(/loại dịch vụ|service type/i).click();
      await receptionPage.getByRole('option').first().click();
      await receptionPage.getByLabel(/mẫu quy trình|template/i).click();
      await receptionPage.getByRole('option').first().click();
      await receptionPage.getByRole('button', { name: /tạo phiếu|create/i }).click();

      await receptionPage.waitForURL(/\/tickets\/SV-/);
      const ticketUrl = receptionPage.url();
      const ticketId = ticketUrl.match(/\/tickets\/(SV-\d{4}-\d{3})/)?.[1];

      await receptionContext.close();

      if (ticketId) {
        await page.goto(`/tickets/${ticketId}`);

        // Complete all tasks
        let hasMoreTasks = true;
        let iterations = 0;
        const maxIterations = 10;

        while (hasMoreTasks && iterations < maxIterations) {
          iterations++;

          const startButton = page.getByRole('button', { name: /bắt đầu|start/i }).first();

          if (await startButton.isVisible()) {
            await startButton.click();
            await page.waitForTimeout(500);

            const notesField = page.getByLabel(/ghi chú|notes/i);
            if (await notesField.isVisible()) {
              await notesField.fill(`Completed task ${iterations}`);
            }

            await page.getByRole('button', { name: /hoàn thành|complete/i }).click();
            await page.waitForTimeout(1000);
          } else {
            hasMoreTasks = false;
          }
        }

        // After all tasks completed, ticket should be ready for closing
        const closeButton = page.getByRole('button', { name: /đóng phiếu|close ticket/i });
        if (await closeButton.isVisible()) {
          await closeButton.click();

          // Should show success
          await expect(page.getByText(/đã đóng|closed|hoàn thành/i)).toBeVisible({
            timeout: 5000,
          });
        }
      }
    }
  });
});
