import { test, expect } from "@playwright/test";

test.describe("Setup Page", () => {
  test("should show error with wrong password", async ({ page }) => {
    await page.goto("/setup");
    await page.fill("#password", "wrong-password");
    await page.click('button[type="submit"]');
    const errorMessage = page.locator("div.text-red-500");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Invalid setup password");
  });

  test("should show success with correct password", async ({ page }) => {
    // IMPORTANT: Replace 'your_actual_setup_password' with the real password from your .env file
    const correctPassword = process.env.SETUP_PASSWORD || "your_actual_setup_password";

    if (correctPassword === "your_actual_setup_password") {
      test.skip(true, "Setup password is not configured in the test environment. Skipping test.");
      return;
    }
    
    await page.goto("/setup");

    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("successfully");
      await dialog.accept();
    });

    await page.fill("#password", correctPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});
