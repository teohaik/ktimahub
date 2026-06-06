import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(process.cwd(), ".playwright/admin.json");

setup("authenticate as admin", async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set");
  }

  await page.goto("/el/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /σύνδεση με email|sign in with email/i }).click();

  await expect(page).toHaveURL(/\/el\/(users|select-role)/, { timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
