import { test, expect } from "@playwright/test";

test.describe("i18n — Language switching", () => {
  test("default locale is Greek", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/el/);
    await expect(page.getByText(/ψηφιακά|διαχειριστείτε/i)).toBeVisible();
  });

  test("language switcher is visible on landing page", async ({ page }) => {
    await page.goto("/el");
    await expect(page.getByRole("button", { name: /english/i })).toBeVisible();
  });

  test("switching to English changes page content", async ({ page }) => {
    await page.goto("/el");
    await page.getByRole("button", { name: /english/i }).click();
    await expect(page).toHaveURL(/\/en/, { timeout: 8000 });
    await expect(page.getByText(/manage your agricultural land/i)).toBeVisible();
  });

  test("English page has Greek switcher", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("button", { name: /ελληνικά/i })).toBeVisible();
  });

  test("switching back to Greek works", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: /ελληνικά/i }).click();
    await expect(page).toHaveURL(/\/el/, { timeout: 8000 });
  });

  test("login page is accessible in both locales", async ({ page }) => {
    await page.goto("/el/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();

    await page.goto("/en/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("signup page is accessible in both locales", async ({ page }) => {
    await page.goto("/el/signup");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();

    await page.goto("/en/signup");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });
});
