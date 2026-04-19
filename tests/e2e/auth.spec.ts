import { test, expect } from "@playwright/test";

test.describe("Auth guards", () => {
  test("protected route /el/fields redirects to login", async ({ page }) => {
    await page.goto("/el/fields");
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected route /el/users redirects to login", async ({ page }) => {
    await page.goto("/el/users");
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected route /el/my-fields redirects to login", async ({ page }) => {
    await page.goto("/el/my-fields");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Login page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/el/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /σύνδεση με email|sign in with email/i })).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/el/login");
    await page.locator('input[type="email"]').fill("nobody@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /σύνδεση με email|sign in with email/i }).click();
    await expect(page.getByText(/λανθασμένα|invalid credentials/i)).toBeVisible({ timeout: 10000 });
  });

  test("Google sign-in button is visible", async ({ page }) => {
    await page.goto("/el/login");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });

  test("sign up link navigates to signup", async ({ page }) => {
    await page.goto("/el/login");
    await page.getByRole("link", { name: /εγγραφή|sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe("Signup page", () => {
  test("renders signup options", async ({ page }) => {
    await page.goto("/el/signup");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /email/i })).toBeVisible();
  });

  test("email signup form appears after clicking email option", async ({ page }) => {
    await page.goto("/el/signup");
    await page.getByRole("button", { name: /εγγραφή με email|sign up with email/i }).click();
    await expect(page.locator("#signup-name")).toBeVisible();
    await expect(page.locator("#signup-email")).toBeVisible();
  });

  test("password mismatch shows error", async ({ page }) => {
    await page.goto("/el/signup");
    await page.getByRole("button", { name: /εγγραφή με email|sign up with email/i }).click();
    await page.locator("#signup-name").fill("Test User");
    await page.locator("#signup-email").fill("test@example.com");
    await page.locator("#signup-password").fill("password123");
    await page.locator("#signup-confirm").fill("differentpass");
    await page.getByRole("button", { name: /δημιουργία λογαριασμού|create account/i }).click();
    await expect(page.getByText(/κωδικοί δεν ταιριάζουν|passwords do not match/i)).toBeVisible();
  });

  test("back button returns to signup options", async ({ page }) => {
    await page.goto("/el/signup");
    await page.getByRole("button", { name: /εγγραφή με email|sign up with email/i }).click();
    await page.getByRole("button", { name: /πίσω|back/i }).click();
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });
});

test.describe("Email verification page", () => {
  test("check-email view renders without token", async ({ page }) => {
    await page.goto("/el/verify-email");
    await expect(page.getByText(/ελέγξτε το email|check your email/i)).toBeVisible();
  });

  test("invalid token shows error", async ({ page }) => {
    await page.goto("/el/verify-email?token=invalidtoken123");
    await expect(page.getByText(/αποτυχία επιβεβαίωσης|verification failed/i)).toBeVisible({ timeout: 10000 });
  });
});
