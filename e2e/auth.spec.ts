import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("login with valid credentials redirects to gym selection", async ({
  page,
}) => {
  await page.goto("/");

  await page.locator('input[type="email"]').fill(process.env.E2E_TEST_EMAIL!);
  await page
    .locator('input[type="password"]')
    .fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/select-gym/, { timeout: 15000 });
});

test("login with wrong password shows error", async ({ page }) => {
  await page.goto("/");

  await page.locator('input[type="email"]').fill(process.env.E2E_TEST_EMAIL!);
  await page.locator('input[type="password"]').fill("WrongPassword999!");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(
    page.getByText(/invalid credentials|incorrect|wrong/i)
  ).toBeVisible({ timeout: 10000 });
});

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login|\/$/);
});
