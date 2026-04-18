import { test, expect } from "@playwright/test";

// All tests in this file run on iPhone 14 viewport via the "mobile" project in playwright.config.ts

test.describe("Mobile — Landing page", () => {
  test("landing page renders on mobile", async ({ page }) => {
    await page.goto("/el");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("hero CTA button is tappable on mobile", async ({ page }) => {
    await page.goto("/el");
    const cta = page.getByRole("link", { name: /δωρεάν λογαριασμό|create free account/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });

  test("navbar logo is visible", async ({ page }) => {
    await page.goto("/el");
    await expect(page.getByText("KtimaHub").first()).toBeVisible();
  });
});

test.describe("Mobile — Auth pages", () => {
  test("login form renders correctly on mobile", async ({ page }) => {
    await page.goto("/el/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/κωδικός|password/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /σύνδεση με email|sign in with email/i })
    ).toBeVisible();
  });

  test("signup page renders correctly on mobile", async ({ page }) => {
    await page.goto("/el/signup");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /email/i })).toBeVisible();
  });

  test("email signup form is usable on mobile", async ({ page }) => {
    await page.goto("/el/signup");
    await page.getByRole("button", { name: /εγγραφή με email|sign up with email/i }).click();
    await expect(page.getByLabel(/ονοματεπώνυμο|full name/i)).toBeVisible();
    // Input is tappable
    await page.getByLabel(/ονοματεπώνυμο|full name/i).tap();
    await page.getByLabel(/ονοματεπώνυμο|full name/i).fill("Test");
    await expect(page.getByLabel(/ονοματεπώνυμο|full name/i)).toHaveValue("Test");
  });
});

test.describe("Mobile — Auth guards", () => {
  test("protected route redirects to login on mobile", async ({ page }) => {
    await page.goto("/el/fields");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Mobile — Language switcher", () => {
  test("language switcher is accessible on mobile", async ({ page }) => {
    await page.goto("/el");
    await expect(page.getByRole("button", { name: /english/i })).toBeVisible();
  });
});
