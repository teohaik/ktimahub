import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(process.cwd(), ".playwright/owner.json");

setup("authenticate as owner", async ({ page }) => {
  const email = process.env.TEST_OWNER_EMAIL;
  const password = process.env.TEST_OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_OWNER_EMAIL and TEST_OWNER_PASSWORD must be set"
    );
  }

  await page.goto("/el/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/κωδικός|password/i).fill(password);
  await page.getByRole("button", { name: /σύνδεση με email|sign in with email/i }).click();

  await expect(page).toHaveURL(/\/el\/(fields|select-role)/, { timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
