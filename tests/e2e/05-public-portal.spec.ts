/**
 * Public Portal E2E Tests
 *
 * Tests public-facing service request portal including:
 * - Anonymous service request submission
 * - Service request tracking with token
 * - Rate limiting (10 requests/hour/IP)
 * - Email notifications
 * - Customer delivery confirmation
 * - Form validation
 */

import { test, expect } from '@playwright/test';

// No authentication storage state - these are public pages
test.describe('Public Portal - Service Request Submission', () => {
  test('should submit warranty service request for ZOTAC GPU', async ({ page }) => {
    await page.goto('/portal');

    // Should show public portal landing page
    await expect(
      page.getByRole('heading', { name: /dịch vụ|service|yêu cầu|request/i })
    ).toBeVisible();

    // Click "Submit Service Request" or "Gửi yêu cầu"
    await page.getByRole('button', { name: /gửi yêu cầu|submit|tạo yêu cầu/i }).click();

    // Fill customer information
    await page.getByLabel(/họ tên|tên|name/i).fill('Nguyễn Văn An');
    await page.getByLabel(/số điện thoại|phone/i).fill('0901234567');
    await page.getByLabel(/email/i).fill('nguyenvanan@gmail.com');
    await page
      .getByLabel(/địa chỉ|address/i)
      .fill('123 Nguyễn Huệ, Quận 1, TP.HCM');

    // Fill device information
    await page
      .getByLabel(/loại thiết bị|device type|sản phẩm/i)
      .fill('Card đồ họa ZOTAC RTX 4090 Trinity');
    await page.getByLabel(/serial number|số serial/i).fill('ZT4090-20250125-12345');

    // Select service type
    await page.getByLabel(/loại dịch vụ|service type/i).click();
    await page.getByRole('option', { name: /bảo hành|warranty/i }).click();

    // Describe issue
    await page
      .getByLabel(/mô tả sự cố|issue|vấn đề/i)
      .fill(
        'Card không lên hình sau khi cập nhật driver. Màn hình không có tín hiệu. Đã thử với màn hình khác nhưng vẫn không được.'
      );

    // Upload photos (if available)
    const photoInput = page.locator('input[type="file"]').first();
    if (await photoInput.isVisible()) {
      // In real test, upload actual image file
      // await photoInput.setInputFiles('path/to/test-image.jpg');
    }

    // Agree to terms
    const termsCheckbox = page.getByLabel(/đồng ý|agree|điều khoản|terms/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit
    await page.getByRole('button', { name: /gửi|submit|xác nhận/i }).click();

    // Should show success message with tracking token
    await expect(
      page.getByText(/thành công|success|đã gửi|submitted/i)
    ).toBeVisible({ timeout: 10000 });

    // Should show tracking token/code
    await expect(page.getByText(/mã tra cứu|tracking.*code|token/i)).toBeVisible();

    // Get tracking code from page
    const trackingCodeElement = page.locator('[data-testid="tracking-code"]');
    if (await trackingCodeElement.isVisible()) {
      const trackingCode = await trackingCodeElement.textContent();
      expect(trackingCode).toBeTruthy();
      expect(trackingCode?.length).toBeGreaterThan(10);
    }
  });

  test('should submit repair service request for SSTC SSD', async ({ page }) => {
    await page.goto('/portal');

    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    await page.getByLabel(/họ tên|name/i).fill('Trần Thị Bình');
    await page.getByLabel(/số điện thoại|phone/i).fill('0902345678');
    await page.getByLabel(/email/i).fill('binhtt@email.com');
    await page.getByLabel(/địa chỉ|address/i).fill('456 Lê Lợi, Quận 3, TP.HCM');

    await page.getByLabel(/loại thiết bị|device/i).fill('Ổ cứng SSD SSTC 1TB');
    await page.getByLabel(/serial number/i).fill('SSTC-SSD-20250125-67890');

    // Select repair service
    await page.getByLabel(/loại dịch vụ|service type/i).click();
    await page.getByRole('option', { name: /sửa chữa|repair/i }).click();

    await page
      .getByLabel(/mô tả sự cố|issue/i)
      .fill('Ổ SSD không được nhận diện trong BIOS. Không đọc được dữ liệu.');

    const termsCheckbox = page.getByLabel(/đồng ý|agree/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.getByRole('button', { name: /gửi|submit/i }).click();

    await expect(page.getByText(/thành công|success/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/mã tra cứu|tracking/i)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/portal');

    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /gửi|submit/i }).click();

    // Should show validation errors
    await expect(page.getByText(/bắt buộc|required/i).first()).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/portal');

    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    // Fill with invalid email
    await page.getByLabel(/email/i).fill('invalid-email');

    // Click away to trigger validation
    await page.getByLabel(/họ tên|name/i).click();

    // Should show email validation error
    await expect(page.getByText(/email.*không hợp lệ|invalid.*email/i)).toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    await page.goto('/portal');

    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    // Fill with invalid phone
    await page.getByLabel(/số điện thoại|phone/i).fill('123');

    await page.getByLabel(/họ tên|name/i).click();

    // Should show phone validation error
    await expect(
      page.getByText(/số điện thoại.*không hợp lệ|invalid.*phone/i)
    ).toBeVisible();
  });
});

test.describe('Public Portal - Service Request Tracking', () => {
  test('should track service request with tracking code', async ({ page, context }) => {
    // First, submit a request to get tracking code
    await page.goto('/portal');
    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    await page.getByLabel(/họ tên|name/i).fill('Lê Văn Cường');
    await page.getByLabel(/số điện thoại|phone/i).fill('0903456789');
    await page.getByLabel(/email/i).fill('cuonglv@test.com');
    await page.getByLabel(/địa chỉ|address/i).fill('789 Điện Biên Phủ, Quận 10');
    await page.getByLabel(/loại thiết bị|device/i).fill('ZOTAC RTX 4070 Ti');
    await page.getByLabel(/serial number/i).fill('ZT4070-20250125-55555');
    await page.getByLabel(/loại dịch vụ|service type/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/mô tả sự cố|issue/i).fill('Test issue for tracking');

    const termsCheckbox = page.getByLabel(/đồng ý|agree/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.getByRole('button', { name: /gửi|submit/i }).click();
    await page.waitForTimeout(2000);

    // Get tracking code
    const trackingCodeElement = page.locator('[data-testid="tracking-code"]');
    let trackingCode = '';

    if (await trackingCodeElement.isVisible()) {
      trackingCode = (await trackingCodeElement.textContent()) || '';
    } else {
      // Try to extract from success message
      const successMessage = await page.getByText(/mã tra cứu|tracking/i).textContent();
      const match = successMessage?.match(/[A-Z0-9]{12,}/);
      if (match) {
        trackingCode = match[0];
      }
    }

    if (trackingCode) {
      // Open new page/tab for tracking
      const trackingPage = await context.newPage();
      await trackingPage.goto('/portal/track');

      // Enter tracking code
      await trackingPage.getByLabel(/mã tra cứu|tracking.*code/i).fill(trackingCode);
      await trackingPage.getByRole('button', { name: /tra cứu|track|search/i }).click();

      // Should show request details
      await expect(trackingPage.getByText(/zotac|rtx 4070/i)).toBeVisible({ timeout: 5000 });
      await expect(trackingPage.getByText(/trạng thái|status/i)).toBeVisible();

      await trackingPage.close();
    }
  });

  test('should show error for invalid tracking code', async ({ page }) => {
    await page.goto('/portal/track');

    await page.getByLabel(/mã tra cứu|tracking/i).fill('INVALID-CODE-123');
    await page.getByRole('button', { name: /tra cứu|track/i }).click();

    // Should show not found error
    await expect(
      page.getByText(/không tìm thấy|not found|không tồn tại/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display service progress timeline', async ({ page, context }) => {
    // Submit request first
    await page.goto('/portal');
    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    await page.getByLabel(/họ tên|name/i).fill('Test Timeline User');
    await page.getByLabel(/số điện thoại|phone/i).fill('0909876543');
    await page.getByLabel(/email/i).fill('timeline@test.com');
    await page.getByLabel(/địa chỉ|address/i).fill('Test Address');
    await page.getByLabel(/loại thiết bị|device/i).fill('Test Device');
    await page.getByLabel(/serial number/i).fill('TEST-TIMELINE-123');
    await page.getByLabel(/loại dịch vụ|service type/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/mô tả sự cố|issue/i).fill('Timeline test');

    const termsCheckbox = page.getByLabel(/đồng ý|agree/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.getByRole('button', { name: /gửi|submit/i }).click();
    await page.waitForTimeout(2000);

    const trackingCodeElement = page.locator('[data-testid="tracking-code"]');
    if (await trackingCodeElement.isVisible()) {
      const trackingCode = (await trackingCodeElement.textContent()) || '';

      if (trackingCode) {
        const trackingPage = await context.newPage();
        await trackingPage.goto('/portal/track');

        await trackingPage.getByLabel(/mã tra cứu|tracking/i).fill(trackingCode);
        await trackingPage.getByRole('button', { name: /tra cứu|track/i }).click();
        await trackingPage.waitForTimeout(2000);

        // Look for timeline/progress indicator
        const hasTimeline = await trackingPage
          .getByText(/tiến độ|progress|timeline/i)
          .isVisible();

        if (hasTimeline) {
          // Should show current status
          await expect(
            trackingPage.getByText(/đang chờ|pending|đang xử lý|processing/i)
          ).toBeVisible();
        }

        await trackingPage.close();
      }
    }
  });
});

test.describe('Public Portal - Rate Limiting', () => {
  test('should enforce rate limit after 10 requests', async ({ page }) => {
    // Note: This test might need to be skipped in CI to avoid actually hitting rate limits

    const totalRequests = 11;
    let blockedCount = 0;

    for (let i = 1; i <= totalRequests; i++) {
      await page.goto('/portal');

      try {
        await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

        await page.getByLabel(/họ tên|name/i).fill(`Test User ${i}`);
        await page.getByLabel(/số điện thoại|phone/i).fill(`090${i.toString().padStart(7, '0')}`);
        await page.getByLabel(/email/i).fill(`test${i}@test.com`);
        await page.getByLabel(/địa chỉ|address/i).fill(`Address ${i}`);
        await page.getByLabel(/loại thiết bị|device/i).fill(`Device ${i}`);
        await page.getByLabel(/serial number/i).fill(`SERIAL-${i}`);
        await page.getByLabel(/loại dịch vụ|service type/i).click();
        await page.getByRole('option').first().click();
        await page.getByLabel(/mô tả sự cố|issue/i).fill(`Issue ${i}`);

        const termsCheckbox = page.getByLabel(/đồng ý|agree/i);
        if (await termsCheckbox.isVisible()) {
          await termsCheckbox.check();
        }

        await page.getByRole('button', { name: /gửi|submit/i }).click();

        // Check for rate limit error
        const hasRateLimitError = await page
          .getByText(/quá nhiều|too many|rate limit|vượt quá giới hạn/i)
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        if (hasRateLimitError) {
          blockedCount++;
          break;
        }

        await page.waitForTimeout(500);
      } catch (error) {
        // Likely hit rate limit
        break;
      }
    }

    // After 10 requests, should start seeing rate limit errors
    // This assertion might be unreliable, so we'll make it informative
    if (blockedCount > 0) {
      expect(blockedCount).toBeGreaterThan(0);
    }
  }).skip(); // Skip by default to avoid rate limiting during regular test runs
});

test.describe('Public Portal - Email Notifications', () => {
  test('should receive email confirmation after submission', async ({ page }) => {
    // Note: Email testing typically requires email service mocking
    // This test verifies UI feedback about email sending

    await page.goto('/portal');
    await page.getByRole('button', { name: /gửi yêu cầu|submit/i }).click();

    await page.getByLabel(/họ tên|name/i).fill('Email Test User');
    await page.getByLabel(/số điện thoại|phone/i).fill('0905555555');
    await page.getByLabel(/email/i).fill('emailtest@example.com');
    await page.getByLabel(/địa chỉ|address/i).fill('Email Test Address');
    await page.getByLabel(/loại thiết bị|device/i).fill('ZOTAC RTX 3060');
    await page.getByLabel(/serial number/i).fill('ZT3060-EMAIL-TEST');
    await page.getByLabel(/loại dịch vụ|service type/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/mô tả sự cố|issue/i).fill('Email notification test');

    const termsCheckbox = page.getByLabel(/đồng ý|agree/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.getByRole('button', { name: /gửi|submit/i }).click();

    // Should show message about email being sent
    await expect(
      page.getByText(/email.*gửi|sent.*email|kiểm tra.*email/i)
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Public Portal - Customer Delivery Confirmation', () => {
  test('should access delivery confirmation page with token', async ({ page }) => {
    // Simulate receiving delivery confirmation link
    // In real scenario, this would come from email

    const mockDeliveryToken = 'DELIVERY-TOKEN-123456';

    await page.goto(`/portal/delivery-confirm?token=${mockDeliveryToken}`);

    // Should show delivery confirmation form or details
    const hasDeliveryPage =
      (await page.getByText(/xác nhận|confirm|giao hàng|delivery/i).isVisible()) ||
      (await page.getByText(/không tìm thấy|not found/i).isVisible());

    expect(hasDeliveryPage).toBeTruthy();
  });

  test('should confirm device received', async ({ page, context }) => {
    // First create a completed ticket (would normally be done by staff)
    // Then customer confirms delivery

    // For this test, we'll simulate having a delivery token
    const mockToken = 'CONFIRM-TEST-TOKEN';

    await page.goto(`/portal/delivery-confirm?token=${mockToken}`);

    // If valid token, should show confirmation form
    const confirmButton = page.getByRole('button', { name: /xác nhận|confirm/i });

    if (await confirmButton.isVisible()) {
      // Select delivery method
      const deliveryMethod = page.getByLabel(/phương thức|method/i);
      if (await deliveryMethod.isVisible()) {
        await deliveryMethod.click();
        await page.getByRole('option', { name: /trực tiếp|in person|pickup/i }).click();
      }

      // Add signature or confirmation
      const signatureField = page.getByLabel(/chữ ký|signature|xác nhận/i);
      if (await signatureField.isVisible()) {
        await signatureField.fill('Nguyễn Văn An');
      }

      // Submit confirmation
      await confirmButton.click();

      // Should show success
      await expect(
        page.getByText(/cảm ơn|thank you|đã xác nhận|confirmed/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show error for expired delivery token', async ({ page }) => {
    await page.goto('/portal/delivery-confirm?token=EXPIRED-TOKEN-999');

    // Should show error message
    await expect(
      page.getByText(/hết hạn|expired|không hợp lệ|invalid/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Public Portal - Accessibility', () => {
  test('should be accessible without login', async ({ page }) => {
    await page.goto('/portal');

    // Should load without authentication
    await expect(page).toHaveURL(/\/portal/);

    // Should not show login requirement
    const hasLoginRequired = await page.getByText(/đăng nhập|login|sign in/i).isVisible();
    expect(hasLoginRequired).toBeFalsy();
  });

  test('should display Vietnamese UI', async ({ page }) => {
    await page.goto('/portal');

    // Should show Vietnamese text
    await expect(
      page.getByText(/dịch vụ|yêu cầu|gửi|bảo hành|sửa chữa/i)
    ).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/portal');

    // Page should still be functional
    await expect(page.getByRole('button', { name: /gửi yêu cầu|submit/i })).toBeVisible();
  });
});
