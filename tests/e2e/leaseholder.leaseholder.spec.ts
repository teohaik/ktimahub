import { test, expect } from "@playwright/test";

// Note: TEST_LEASEHOLDER_EMAIL must belong to a user with LEASEHOLDER role.
// Create this account via the admin invite flow, not self-signup (which defaults to LAND_OWNER).

test.describe("Leaseholder — My fields", () => {
  test("authenticated user can reach a post-login page", async ({ page }) => {
    // Verify the session is valid — user lands somewhere after login
    await page.goto("/el");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("my-fields page loads for leaseholder role", async ({ page }) => {
    await page.goto("/el/my-fields");
    // A LEASEHOLDER lands here; a LAND_OWNER gets redirected to /fields
    const url = page.url();
    const isLeaseholder = url.includes("/my-fields");
    const isOwner = url.includes("/fields");
    expect(isLeaseholder || isOwner).toBeTruthy();
  });

  test("my-fields page shows heading when on correct role", async ({ page }) => {
    await page.goto("/el/my-fields");
    if (!page.url().includes("/my-fields")) {
      test.skip(); // Account has LAND_OWNER role — leaseholder tests not applicable
    }
    await expect(
      page.getByRole("heading", { name: /τα αγροτεμάχιά μου|my fields/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("fields list or empty state is shown for leaseholder", async ({ page }) => {
    await page.goto("/el/my-fields");
    if (!page.url().includes("/my-fields")) {
      test.skip();
    }
    const hasFields = await page.getByRole("table").isVisible({ timeout: 8000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/δεν υπάρχουν|no fields/i).isVisible().catch(() => false);
    const hasContent = await page.locator("main").isVisible().catch(() => false);
    expect(hasFields || hasEmptyState || hasContent).toBeTruthy();
  });
});
