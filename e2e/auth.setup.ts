import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate and select gym", async ({ page }) => {
  await page.goto("/login");

  await page.locator('input[type="email"]').fill(process.env.E2E_TEST_EMAIL!);
  await page
    .locator('input[type="password"]')
    .fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("**/select-gym", { timeout: 15000 });

  await page.getByRole("button", { name: /select/i }).first().click();

  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await expect(page).toHaveURL(/dashboard/);

  await page.context().storageState({ path: authFile });
});
