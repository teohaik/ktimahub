import { test, expect } from "@playwright/test";

const CURRENT_YEAR = new Date().getFullYear();
const TEST_YEAR = CURRENT_YEAR; // use current year to match page default

test.describe("Crop History — auth guard", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/el/crop-history");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

test.describe("Crop History — owner view", () => {
  // Clean up any crop history rows written during this test run
  test.afterAll(async ({ request }) => {
    // Fetch fields to find IDs used in tests, then clear their crop history for TEST_YEAR
    const res = await request.get(`/api/crop-history?year=${TEST_YEAR}`);
    if (!res.ok()) return;
    const rows: { field: { id: string } }[] = await res.json();
    await Promise.all(
      rows.map((r) =>
        request.put(`/api/crop-history/${r.field.id}/${TEST_YEAR}`, {
          data: { cropId: null, leaseholderId: null },
        })
      )
    );
  });

  test("nav link is visible and navigates to crop history page", async ({ page }) => {
    await page.goto("/el/fields");
    await expect(page.getByRole("link", { name: /ετήσια καλλιέργεια|annual crops/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("link", { name: /ετήσια καλλιέργεια|annual crops/i }).click();
    await expect(page).toHaveURL(/\/el\/crop-history/);
  });

  test("page loads with year dropdown defaulting to current year", async ({ page }) => {
    await page.goto("/el/crop-history");
    const select = page.locator("select").first();
    await expect(select).toBeVisible({ timeout: 10000 });
    await expect(select).toHaveValue(String(CURRENT_YEAR));
  });

  test("year dropdown contains correct range", async ({ page }) => {
    await page.goto("/el/crop-history");
    const select = page.locator("select").first();
    await expect(select).toBeVisible({ timeout: 10000 });

    const options = await select.locator("option").allTextContents();
    const years = options.map(Number);
    expect(years).toContain(2025);
    expect(years).toContain(CURRENT_YEAR + 5);
    expect(Math.min(...years)).toBe(2025);
    expect(Math.max(...years)).toBe(CURRENT_YEAR + 5);
  });

  test("table renders field rows", async ({ page }) => {
    await page.goto("/el/crop-history");
    // Desktop table row — CI runs on Desktop Chrome so the desktop table is the visible one
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });
  });

  test("edit button is visible and enables edit mode", async ({ page }) => {
    await page.goto("/el/crop-history");
    const editBtn = page.getByRole("button", { name: /επεξεργασία|edit/i });
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    // Save and Cancel buttons appear
    await expect(page.getByRole("button", { name: /αποθήκευση|save/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /ακύρωση|cancel/i })).toBeVisible();
    // Year dropdown is disabled in edit mode
    await expect(page.locator("select").first()).toBeDisabled();
  });

  test("cancel reverts edit mode without saving", async ({ page }) => {
    await page.goto("/el/crop-history");
    await page.getByRole("button", { name: /επεξεργασία|edit/i }).click({ timeout: 10000 });
    await page.getByRole("button", { name: /ακύρωση|cancel/i }).click();

    // Back to view mode
    await expect(page.getByRole("button", { name: /επεξεργασία|edit/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /αποθήκευση|save/i })).not.toBeVisible();
    // Year dropdown re-enabled
    await expect(page.locator("select").first()).toBeEnabled();
  });

  test("can set crop type for a field and save", async ({ page }) => {
    await page.goto("/el/crop-history");
    await page.getByRole("button", { name: /επεξεργασία|edit/i }).click({ timeout: 10000 });

    const firstCropSelect = page.locator("table tbody tr").first().locator("select").first();
    await expect(firstCropSelect).toBeVisible({ timeout: 10000 });

    const options = await firstCropSelect.locator("option").all();
    // Skip empty option, pick first real crop if available
    if (options.length > 1) {
      const val = await options[1].getAttribute("value");
      if (val) await firstCropSelect.selectOption(val);
    }

    await page.getByRole("button", { name: /αποθήκευση|save/i }).click();

    // Returns to view mode after save
    await expect(page.getByRole("button", { name: /επεξεργασία|edit/i })).toBeVisible({ timeout: 10000 });
  });

  test("changing year fetches new data", async ({ page }) => {
    await page.goto("/el/crop-history");
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });

    const select = page.locator("select").first();
    const otherYear = CURRENT_YEAR + 1;
    await select.selectOption(String(otherYear));

    // Table remains visible after year change (may be empty, but no crash)
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });
  });

  test("values persist after page reload", async ({ page }) => {
    await page.goto("/el/crop-history");
    await page.getByRole("button", { name: /επεξεργασία|edit/i }).click({ timeout: 10000 });

    const firstRow = page.locator("table tbody tr").first();
    const cropSelect = firstRow.locator("select").first();
    await expect(cropSelect).toBeVisible({ timeout: 10000 });

    const options = await cropSelect.locator("option").all();
    let savedValue = "";
    if (options.length > 1) {
      savedValue = (await options[1].getAttribute("value")) ?? "";
      if (savedValue) await cropSelect.selectOption(savedValue);
    }

    await page.getByRole("button", { name: /αποθήκευση|save/i }).click();
    await expect(page.getByRole("button", { name: /επεξεργασία|edit/i })).toBeVisible({ timeout: 10000 });

    if (savedValue) {
      // Reload and check value is still displayed
      await page.reload();
      await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });
      // The saved crop name should be visible somewhere in the first row
      const cropName = await page.locator(`option[value="${savedValue}"]`).first().textContent();
      if (cropName) {
        await expect(page.locator("table tbody tr").first()).toContainText(cropName.trim());
      }
    }
  });
});
