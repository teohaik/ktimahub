import { test, expect } from "@playwright/test";

test.describe("Leaseholder — My fields", () => {
  test("my-fields page loads", async ({ page }) => {
    await page.goto("/el/my-fields");
    await expect(page).toHaveURL(/\/el\/my-fields/);
  });

  test("page heading is visible", async ({ page }) => {
    await page.goto("/el/my-fields");
    await expect(
      page.getByRole("heading", { name: /τα αγροτεμάχιά μου|my fields/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("fields list or empty state is shown", async ({ page }) => {
    await page.goto("/el/my-fields");
    // Either fields are listed or an empty state message is shown
    const hasFields = await page.getByRole("table").isVisible({ timeout: 8000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/δεν υπάρχουν|no fields/i).isVisible().catch(() => false);
    expect(hasFields || hasEmptyState).toBeTruthy();
  });

  test("crop type options are visible when a field is assigned", async ({ page }) => {
    await page.goto("/el/my-fields");
    const hasCropSelect = await page
      .getByRole("combobox")
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    if (!hasCropSelect) {
      // No fields assigned to this test leaseholder
      test.skip();
    }
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });
});
