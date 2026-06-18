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
    await expect(page.locator("th", { hasText: /καεκ|kaek/i })).toBeVisible();
    await expect(page.locator("th", { hasText: /εμβαδόν|area/i }).first()).toBeVisible();
  });

  test("clicking a field name navigates to field detail", async ({ page }) => {
    await page.goto("/el/fields");
    await page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i }).waitFor({ timeout: 10000 });
    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    if (!hasTable) { test.skip(); }
    const rows = page.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
    const count = await rows.count();
    if (count === 0) { test.skip(); }
    // Only the field name (4th column) links to the detail view — the row
    // itself no longer navigates so ID columns stay selectable/copyable.
    await rows.first().locator("td").nth(3).getByRole("link").click();
    await expect(page).toHaveURL(/\/el\/fields\//);
  });

  test("clicking the KAEK cell does not navigate", async ({ page }) => {
    await page.goto("/el/fields");
    await page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i }).waitFor({ timeout: 10000 });
    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    if (!hasTable) { test.skip(); }
    const rows = page.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
    const count = await rows.count();
    if (count === 0) { test.skip(); }
    // KAEK cell (2nd column) holds no link — clicking must stay on the list.
    await rows.first().locator("td").nth(1).click();
    await expect(page).toHaveURL(/\/el\/fields$/);
  });
});

test.describe("Owner — Add field form", () => {
  test("add field page renders form", async ({ page }) => {
    await page.goto("/el/fields/new");
    await expect(page.getByText(/ονομασία|^name$/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/kaek|καεκ/i).first()).toBeVisible();
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

test.describe("Owner — Field detail edits", () => {
  // Snapshot of the field we mutate, restored after the suite so we don't
  // leave test values in the shared preview database.
  let original: {
    id: string;
    name: string;
    fieldNumber: string | null;
    kaek: string;
    atak: string | null;
    officialArea: number;
    ownershipPercentage: number | null;
    polygon: unknown;
    leaseholderId: string | null;
    cropId: string | null;
  } | null = null;

  test.afterAll(async ({ request }) => {
    if (!original) return;
    await request.put(`/api/fields/${original.id}`, {
      data: {
        name: original.name,
        fieldNumber: original.fieldNumber,
        kaek: original.kaek,
        atak: original.atak,
        officialArea: original.officialArea,
        ownershipPercentage: original.ownershipPercentage,
        polygon: original.polygon,
        leaseholderId: original.leaseholderId,
        cropId: original.cropId,
      },
    });
  });

  test("detail form exposes ATAK and ownership inputs", async ({ page, request }) => {
    const res = await request.get("/api/fields");
    expect(res.ok()).toBeTruthy();
    const fields = await res.json();
    if (!fields.length) { test.skip(); }

    await page.goto(`/el/fields/${fields[0].id}`);
    await expect(page.locator('input[name="atak"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="ownershipPercentage"]')).toBeVisible();
  });

  test("editing ATAK and ownership percentage persists", async ({ page, request }) => {
    const res = await request.get("/api/fields");
    expect(res.ok()).toBeTruthy();
    const fields = await res.json();
    if (!fields.length) { test.skip(); }
    // API returns fields sorted by name asc — same order as the table/form.
    original = fields[0];

    await page.goto(`/el/fields/${original!.id}`);

    const atakInput = page.locator('input[name="atak"]');
    const ownershipInput = page.locator('input[name="ownershipPercentage"]');
    await expect(atakInput).toBeVisible({ timeout: 10000 });

    const newAtak = `E2E-${Date.now()}`;
    const newOwnership = "73";
    await atakInput.fill(newAtak);
    await ownershipInput.fill(newOwnership);

    // There are Save buttons at the top and bottom of the form — use the first.
    await page.getByRole("button", { name: /αποθήκευση|save/i }).first().click();

    // Saving redirects back to the fields list.
    await expect(page).toHaveURL(/\/el\/fields$/, { timeout: 10000 });

    // Re-open the same field — the edited values must round-trip through the API.
    await page.goto(`/el/fields/${original!.id}`);
    await expect(page.locator('input[name="atak"]')).toHaveValue(newAtak, { timeout: 10000 });
    await expect(page.locator('input[name="ownershipPercentage"]')).toHaveValue(newOwnership);

    // The master table also reflects the new ATAK and ownership values.
    // Locate the row by its detail link rather than assuming sort order.
    await page.goto("/el/fields");
    const row = page
      .locator("tbody tr")
      .filter({ has: page.locator(`a[href="/el/fields/${original!.id}"]`) });
    // Columns: 0:#  1:kaek  2:atak  3:name  4:fieldNumber  5:officialArea
    //          6:calculatedArea  7:ownership
    await expect(row.locator("td").nth(2)).toHaveText(newAtak);
    await expect(row.locator("td").nth(7)).toContainText(`${newOwnership}%`);
  });

  test("rejects ownership percentage above 100", async ({ request }) => {
    const res = await request.get("/api/fields");
    expect(res.ok()).toBeTruthy();
    const fields = await res.json();
    if (!fields.length) { test.skip(); }

    const f = fields[0];
    const bad = await request.put(`/api/fields/${f.id}`, {
      data: {
        name: f.name,
        kaek: f.kaek,
        atak: f.atak,
        officialArea: f.officialArea,
        ownershipPercentage: 150,
        polygon: f.polygon,
        leaseholderId: f.leaseholderId,
        cropId: f.cropId,
      },
    });
    expect(bad.status()).toBe(400);
  });
});
