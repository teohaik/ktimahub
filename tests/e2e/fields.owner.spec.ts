import { test, expect } from "@playwright/test";

test.describe("Owner — Fields table", () => {
  test("fields page loads and shows table", async ({ page }) => {
    await page.goto("/el/fields");
    await expect(page).toHaveURL(/\/el\/fields/);
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10000 });
  });

  test("table has expected column headers", async ({ page }) => {
    await page.goto("/el/fields");
    await page.getByRole("table").waitFor({ timeout: 10000 });
    await expect(page.getByText(/καεκ|kaek/i)).toBeVisible();
    await expect(page.getByText(/εμβαδόν|area/i).first()).toBeVisible();
  });

  test("add field button is visible", async ({ page }) => {
    await page.goto("/el/fields");
    await expect(
      page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("clicking a field row navigates to field detail", async ({ page }) => {
    await page.goto("/el/fields");
    await page.getByRole("table").waitFor({ timeout: 10000 });
    const rows = page.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
    const count = await rows.count();
    if (count > 0) {
      await rows.first().click();
      await expect(page).toHaveURL(/\/el\/fields\//);
    } else {
      test.skip();
    }
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
    // Leaflet map container
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
    await expect(page.getByText(/δορυφορική|satellite/i)).toBeVisible();
  });
});

test.describe("Owner — Navigation", () => {
  test("navbar links are present", async ({ page }) => {
    await page.goto("/el/fields");
    await expect(page.getByRole("link", { name: /αγροτεμάχια|fields/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: /χάρτης|map/i })).toBeVisible();
  });
});
