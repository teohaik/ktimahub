import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(process.cwd(), ".playwright/leaseholder.json");

setup("authenticate as leaseholder", async ({ page }) => {
  const email = process.env.TEST_LEASEHOLDER_EMAIL;
  const password = process.env.TEST_LEASEHOLDER_PASSWORD;

  if (!email || !password) {
    throw new Error("TEST_LEASEHOLDER_EMAIL and TEST_LEASEHOLDER_PASSWORD must be set");
  }

  await page.goto("/el/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /σύνδεση με email|sign in with email/i }).click();

  // Accept any post-login destination (depends on roles assigned to test account)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
