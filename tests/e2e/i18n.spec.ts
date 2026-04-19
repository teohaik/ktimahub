import { test, expect } from "@playwright/test";

test.describe("i18n — Language switching", () => {
  test("root redirects to a valid locale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(el|en)/);
  });

  test("language switcher is visible in navbar on landing page", async ({ page }) => {
    await page.goto("/el");
    // Use the navbar (header) switcher specifically — footer also has one
    await expect(page.getByRole("banner").getByRole("button", { name: /english|ελληνικά/i })).toBeVisible();
  });

  test("switching to English from Greek works", async ({ page }) => {
    await page.goto("/el");
    await page.getByRole("banner").getByRole("button", { name: /english/i }).click();
    await expect(page).toHaveURL(/\/en/, { timeout: 8000 });
    await expect(page.getByText(/manage your agricultural land/i)).toBeVisible();
  });

  test("English page has Greek switcher", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("banner").getByRole("button", { name: /ελληνικά/i })).toBeVisible();
  });

  test("switching back to Greek from English works", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("banner").getByRole("button", { name: /ελληνικά/i }).click();
    await expect(page).toHaveURL(/\/el/, { timeout: 8000 });
  });

  test("login page is accessible in both locales", async ({ page }) => {
    await page.goto("/el/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await page.goto("/en/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("signup page is accessible in both locales", async ({ page }) => {
    await page.goto("/el/signup");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();

    await page.goto("/en/signup");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });
});
