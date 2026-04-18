import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("root redirects to /el", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/el/);
  });

  test("landing page is visible to unauthenticated visitors", async ({ page }) => {
    await page.goto("/el");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("hero section renders with CTA buttons", async ({ page }) => {
    await page.goto("/el");
    const signupBtns = page.getByRole("link", { name: /δωρεάν λογαριασμό|create free account/i });
    await expect(signupBtns.first()).toBeVisible();
  });

  test("features section is visible", async ({ page }) => {
    await page.goto("/el");
    await page.getByText(/χαρτογράφηση|satellite field mapping/i).first().waitFor();
    await expect(page.getByText(/ιστορικό καλλιεργειών|crop history/i).first()).toBeVisible();
    await expect(page.getByText(/ενοικιαστ|leaseholder/i).first()).toBeVisible();
  });

  test("how it works section is visible", async ({ page }) => {
    await page.goto("/el");
    await expect(page.getByText(/πώς λειτουργεί|how it works/i)).toBeVisible();
  });

  test("signup CTA navigates to signup page", async ({ page }) => {
    await page.goto("/el");
    await page.getByRole("link", { name: /δωρεάν λογαριασμό|create free account/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("sign in link navigates to login page", async ({ page }) => {
    await page.goto("/el");
    await page.getByRole("link", { name: /^σύνδεση$|^sign in$/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("footer is visible", async ({ page }) => {
    await page.goto("/el");
    await expect(page.getByText(/ktimahub\.gr/i)).toBeVisible();
  });
});
