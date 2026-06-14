import { test, expect } from "@playwright/test";

test("dashboard loads with stat cards", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });

  // Page title visible
  await expect(page.getByText(/dashboard/i).first()).toBeVisible();

  // At least one stat value rendered (numbers on cards)
  await expect(page.locator("h2, h3").first()).toBeVisible();
});

test("members page loads", async ({ page }) => {
  await page.goto("/dashboard/members");
  await expect(page).toHaveURL(/members/);
  await expect(page.getByText(/member/i).first()).toBeVisible();
});

test("navigation links are present", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /member/i }).first()).toBeVisible();
});
