import {
  chromium,
  expect,
  type FullConfig,
  test as setup,
} from "@playwright/test";
import { activateUser, isUserActive, login, searchUser } from "./helpers";
import { adminUser, testUsers } from "./test-data";

async function globalSetup(config: FullConfig) {
  console.log(
    "--- Starting Global Setup: Ensuring baseline data exists via UI ---",
  );
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  try {
    // Step 1: Ensure Admin user exists.
    console.log("\n[GlobalSetup] Step 1: Ensuring admin user exists...");
    await page.goto("/login");
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");

    const mainContentVisible = await page
      .getByRole("main")
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!mainContentVisible) {
      console.log(
        "[GlobalSetup] Admin login failed or profile missing, attempting initial setup...",
      );
      await page.goto("/setup");
      const setupPassword = process.env.SETUP_PASSWORD;
      if (!setupPassword) {
        throw new Error("SETUP_PASSWORD environment variable is not set.");
      }
      await page.fill("#password", setupPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL("/");
      console.log("[GlobalSetup] ✓ Admin account created via setup page.");
      await login(page, adminUser);
    } else {
      console.log(
        "[GlobalSetup] ✓ Admin user already exists and is logged in.",
      );
    }

    // Step 2: Ensure other test users exist
    console.log(
      "\n[GlobalSetup] Step 2: Ensuring standard test users exist...",
    );
    await page.goto("/team");
    await page.waitForLoadState("networkidle");

    for (const role of Object.keys(testUsers) as Array<
      keyof typeof testUsers
    >) {
      const user = testUsers[role];
      console.log(`[GlobalSetup] Checking user: ${user.email}...`);

      const userFound = await searchUser(page, user.email);

      if (userFound) {
        console.log(`[GlobalSetup] ✓ User ${user.email} already exists.`);
        const isActive = await isUserActive(page, user.email);
        if (!isActive) {
          console.log(
            `[GlobalSetup] ⚠ User ${user.email} is deactivated. Activating...`,
          );
          await activateUser(page, user.email);
        }
        continue;
      }

      console.log(
        `[GlobalSetup] Creating new user: ${user.email} with role: ${user.role}`,
      );
      const addButton = page.getByRole("button", {
        name: /add user|thêm nhân viên/i,
      });
      await addButton.click();
      await page
        .getByText("Thêm Nhân Viên Mới")
        .waitFor({ state: "visible", timeout: 5000 });
      await page.waitForTimeout(500);
      await page.getByPlaceholder(/nhập họ và tên/i).fill(user.name);
      await page.getByPlaceholder(/nhập địa chỉ email/i).fill(user.email);
      await page.getByPlaceholder(/nhập mật khẩu/i).fill(user.password);
      await page.locator("button#roles").click();
      await page.waitForTimeout(500);
      await page.getByRole("option", { name: user.role, exact: true }).click();
      await page.getByRole("button", { name: /tạo nhân viên/i }).click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const userCreated = await searchUser(page, user.email);
      if (!userCreated) {
        throw new Error(`[GlobalSetup] Failed to create user: ${user.email}`);
      }
      console.log(`[GlobalSetup] ✓ Successfully created user: ${user.email}`);
    }

    // Step 3: Ensure brands exist
    console.log("\n[GlobalSetup] Step 3: Ensuring brands exist...");
    await page.goto("/brands");
    await page.waitForLoadState("networkidle");

    const requiredBrands = ["ZOTAC", "SSTC", "ECS", "Other"];
    for (const brandName of requiredBrands) {
      const searchInput = page.getByPlaceholder("Tìm theo tên thương hiệu...");
      await searchInput.fill(brandName);
      await page.waitForTimeout(500);

      const noResultsText = page.getByText("Không tìm thấy thương hiệu nào.");
      const brandCell = page.getByRole("cell", {
        name: brandName,
        exact: true,
      });

      if ((await noResultsText.isVisible()) || !(await brandCell.isVisible())) {
        console.log(
          `[GlobalSetup] Brand "${brandName}" not found, creating it...`,
        );
        await page.getByTestId("add-brand-button").click();
        const dialog = page.getByTestId("brand-form-dialog");
        await dialog.getByLabel("Tên thương hiệu").fill(brandName);
        await dialog.getByRole("button", { name: "Tạo thương hiệu" }).click();
        await expect(
          page.getByText("Thương hiệu đã được tạo thành công"),
        ).toBeVisible();
        await page.waitForTimeout(2000);
      } else {
        console.log(`[GlobalSetup] ✓ Brand "${brandName}" already exists.`);
      }

      await searchInput.clear();
    }

    console.log("\n--- Global Setup Complete ---");
  } catch (error) {
    console.error("\n❌ Global Setup Failed:", error);
    await page.screenshot({ path: "test-results/global-setup-failure.png" });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
