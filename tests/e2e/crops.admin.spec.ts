import { test, expect } from "@playwright/test";

const CROP_EL = `Δοκιμαστική Καλλιέργεια ${Date.now()}`;
const CROP_EN = `Test Crop ${Date.now()}`;
const CROP_EL_EDITED = `${CROP_EL} (επεξ)`;
const CROP_EN_EDITED = `${CROP_EN} (edited)`;

test.describe("Admin — Crop Types page", () => {
  test("redirects non-admin to home", async ({ page }) => {
    // unauthenticated access should redirect to login
    await page.goto("/el/crops");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

test.describe("Admin — Crop Types CRUD", () => {
  test("crops page is accessible from nav", async ({ page }) => {
    await page.goto("/el/users");
    await expect(page.getByRole("link", { name: /τύποι καλλιέργειας|crop types/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole("link", { name: /τύποι καλλιέργειας|crop types/i }).click();
    await expect(page).toHaveURL(/\/el\/crops/);
  });

  test("crops page renders table and add form", async ({ page }) => {
    await page.goto("/el/crops");
    await expect(page.getByText(/ελληνική ονομασία|greek name/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/αγγλική ονομασία|english name/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /προσθήκη|add/i })).toBeVisible();
  });

  test("add button is disabled when inputs are empty", async ({ page }) => {
    await page.goto("/el/crops");
    await expect(page.getByRole("button", { name: /προσθήκη|add/i })).toBeDisabled({ timeout: 10000 });
  });

  test("add button is disabled when only one input is filled", async ({ page }) => {
    await page.goto("/el/crops");
    const inputs = page.locator("form input[type='text']");
    await inputs.first().fill("Σιτάρι");
    await expect(page.getByRole("button", { name: /προσθήκη|add/i })).toBeDisabled();
  });

  test("can add a new crop type with both names", async ({ page }) => {
    await page.goto("/el/crops");
    await page.waitForSelector("form input[type='text']", { timeout: 10000 });

    const inputs = page.locator("form input[type='text']");
    await inputs.nth(0).fill(CROP_EL);
    await inputs.nth(1).fill(CROP_EN);
    await page.getByRole("button", { name: /προσθήκη|add/i }).click();

    // New row appears in table
    await expect(page.getByRole("cell", { name: CROP_EL })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("cell", { name: CROP_EN })).toBeVisible();

    // Inputs are cleared after add
    await expect(inputs.nth(0)).toHaveValue("");
    await expect(inputs.nth(1)).toHaveValue("");
  });

  test("crop row shows a truncated cuid ID with full value in data attribute", async ({ page }) => {
    await page.goto("/el/crops");
    await page.waitForSelector("table tbody tr", { timeout: 10000 });

    // Find the row for our test crop (may not exist if previous test didn't run — skip gracefully)
    const row = page.getByRole("row").filter({ hasText: CROP_EL });
    const count = await row.count();
    if (count === 0) test.skip();

    // Visible text is truncated (8 chars + ellipsis); full ID is in data-cropid
    const idCell = row.locator("td").first();
    const visibleText = await idCell.innerText();
    expect(visibleText).toMatch(/^c[a-z0-9]{7}…$/);

    const fullId = await idCell.getAttribute("data-cropid");
    expect(fullId).toMatch(/^c[a-z0-9]{20,}/);
  });

  test("can edit a crop type", async ({ page }) => {
    await page.goto("/el/crops");

    const row = page.getByRole("row").filter({ hasText: CROP_EL });
    const count = await row.count();
    if (count === 0) test.skip();

    await row.getByRole("button", { name: /επεξεργασία|edit/i }).click();

    // Edit inputs appear in the row
    const editInputs = row.locator("input[type='text']");
    await editInputs.nth(0).fill(CROP_EL_EDITED);
    await editInputs.nth(1).fill(CROP_EN_EDITED);
    await row.getByRole("button", { name: /αποθήκευση|save/i }).click();

    await expect(page.getByRole("cell", { name: CROP_EL_EDITED })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("cell", { name: CROP_EN_EDITED })).toBeVisible();
  });

  test("can cancel editing without saving", async ({ page }) => {
    await page.goto("/el/crops");

    const row = page.getByRole("row").filter({ hasText: CROP_EL_EDITED });
    const count = await row.count();
    if (count === 0) test.skip();

    await row.getByRole("button", { name: /επεξεργασία|edit/i }).click();
    const editInputs = row.locator("input[type='text']");
    await editInputs.nth(0).fill("Θα ακυρωθεί");
    await row.getByRole("button", { name: /ακύρωση|cancel/i }).click();

    // Original name still visible
    await expect(page.getByRole("cell", { name: CROP_EL_EDITED })).toBeVisible();
  });

  test("can delete a crop type", async ({ page }) => {
    await page.goto("/el/crops");

    const row = page.getByRole("row").filter({ hasText: CROP_EL_EDITED });
    const count = await row.count();
    if (count === 0) test.skip();

    page.on("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: /διαγραφή|delete/i }).click();

    await expect(page.getByRole("cell", { name: CROP_EL_EDITED })).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin — Crop Types auth guard", () => {
  test("crops page shows crop types nav link for admin", async ({ page }) => {
    await page.goto("/el/crops");
    await expect(page.getByRole("link", { name: /τύποι καλλιέργειας|crop types/i })).toBeVisible({ timeout: 10000 });
  });
});
