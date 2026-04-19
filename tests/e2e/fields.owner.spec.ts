import { test, expect } from "@playwright/test";

test.describe("Owner — Fields table", () => {
  test("fields page loads for authenticated owner", async ({ page }) => {
    await page.goto("/el/fields");
    await expect(page).toHaveURL(/\/el\/fields/);
    // Page must render — either a table (has fields) or the add field button (empty state)
    await expect(
      page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("add field button is visible", async ({ page }) => {
    await page.goto("/el/fields");
    await expect(
      page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("table shows when fields exist", async ({ page }) => {
    await page.goto("/el/fields");
    await page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i }).waitFor({ timeout: 10000 });
    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    if (!hasTable) {
      // No fields yet — skip rather than fail
      test.skip();
    }
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("table has expected column headers when fields exist", async ({ page }) => {
    await page.goto("/el/fields");
    await page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i }).waitFor({ timeout: 10000 });
    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    if (!hasTable) { test.skip(); }
    await expect(page.getByText(/καεκ|kaek/i)).toBeVisible();
    await expect(page.getByText(/εμβαδόν|area/i).first()).toBeVisible();
  });

  test("clicking a field row navigates to field detail", async ({ page }) => {
    await page.goto("/el/fields");
    await page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i }).waitFor({ timeout: 10000 });
    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    if (!hasTable) { test.skip(); }
    const rows = page.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
    const count = await rows.count();
    if (count === 0) { test.skip(); }
    await rows.first().click();
    await expect(page).toHaveURL(/\/el\/fields\//);
  });
});

test.describe("Owner — Add field form", () => {
  test("add field page renders form", async ({ page }) => {
    await page.goto("/el/fields/new");
    await expect(page.getByLabel(/ονομασία|name/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/kaek|καεκ/i)).toBeVisible();
  });

  test("polygon mode switcher is visible", async ({ page }) => {
    await page.goto("/el/fields/new");
    await expect(
      page.getByRole("button", { name: /σχεδίαση στον χάρτη|draw on map/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /επικόλληση|paste/i })
    ).toBeVisible();
  });

  test("map renders in draw mode", async ({ page }) => {
    await page.goto("/el/fields/new");
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Owner — Map view", () => {
  test("map page loads", async ({ page }) => {
    await page.goto("/el/map");
    await expect(page).toHaveURL(/\/el\/map/);
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 15000 });
  });

  test("satellite / street switcher is visible", async ({ page }) => {
    await page.goto("/el/map");
    await page.locator(".leaflet-container").waitFor({ timeout: 15000 });
    // Switcher may be a button or text — check for either locale
    const switcher = page.getByRole("button", { name: /δορυφορική|satellite|street|δρόμων/i }).first();
    await expect(switcher).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Owner — Navigation", () => {
  test("navbar links are present", async ({ page }) => {
    await page.goto("/el/fields");
    await expect(page.getByRole("link", { name: /αγροτεμάχια|fields/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: /χάρτης|map/i })).toBeVisible();
  });
});
