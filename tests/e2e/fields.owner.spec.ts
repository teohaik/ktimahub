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

  test("export CSV downloads the visible table rows", async ({ page }) => {
    await page.goto("/el/fields");
    await page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i }).waitFor({ timeout: 10000 });
    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    if (!hasTable) { test.skip(); }

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /εξαγωγή csv|export csv/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^ktimahub-fields-\d{4}-\d{2}-\d{2}\.csv$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const content = Buffer.concat(chunks).toString("utf-8");

    // BOM so Excel detects UTF-8 (Greek characters)
    expect(content.charCodeAt(0)).toBe(0xfeff);
    const lines = content.slice(1).split("\r\n");
    expect(lines[0]).toMatch(/ΚΑΕΚ/i);
    expect(lines[0]).not.toMatch(/ενέργειες/i);
    const tableRowCount = await page.locator("tbody tr").count();
    expect(lines.length - 1).toBe(tableRowCount);
  });

  test("Land Registry action links to maps.ktimatologio.gr in a new tab", async ({ page }) => {
    await page.goto("/el/fields");
    await page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i }).waitFor({ timeout: 10000 });
    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    if (!hasTable) { test.skip(); }

    const registryLink = { name: /επίσημο κτηματολόγιο|land registry map/i };
    // `has` is resolved relative to each row, so the inner locator must not start from the table
    const rows = page.locator("tbody tr").filter({ has: page.getByRole("link", registryLink) });
    if ((await rows.count()) === 0) { test.skip(); } // no field has a KAEK

    // Check the link of a row against that row's own KAEK (2nd column)
    const row = rows.first();
    const kaek = ((await row.locator("td").nth(1).textContent()) ?? "").replace(/\s+/g, "");
    const link = row.getByRole("link", registryLink);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    const href = (await link.getAttribute("href")) ?? "";
    expect(href).toMatch(/^https:\/\/maps\.ktimatologio\.gr\/\?locale=el#data_s=where:/);
    expect(href).toContain(`KAEK%3D%27${encodeURIComponent(kaek)}%27`);
    expect(href).toContain("zoom_to_selection=true");
  });

  test.describe("search", () => {
    const searchBox = (page: import("@playwright/test").Page) =>
      page.getByRole("searchbox", { name: /αναζήτηση|search/i });

    // Opens the table and returns its data rows, skipping when there are no fields
    async function openTable(page: import("@playwright/test").Page) {
      await page.goto("/el/fields");
      await page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i }).waitFor({ timeout: 10000 });
      const hasTable = await page.getByRole("table").isVisible().catch(() => false);
      if (!hasTable) { test.skip(); }
      // Data rows only — the "no results" row is marked data-empty-state
      return page.locator("tbody tr:not([data-empty-state])");
    }

    test("partial KAEK narrows the table to matching rows", async ({ page }) => {
      const rows = await openTable(page);
      const total = await rows.count();
      const kaek = ((await rows.first().locator("td").nth(1).textContent()) ?? "").trim();
      if (kaek.length < 6) { test.skip(); }

      // A middle slice of the KAEK — %like%, not prefix or exact match
      const part = kaek.slice(2, 8);
      await searchBox(page).fill(part);
      // The original row stays; other rows may match the slice in any column
      await expect(rows.filter({ hasText: kaek }).first()).toBeVisible();
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(total);
      await expect(page.locator("tfoot")).toContainText(`(${count})`);
    });

    test("matches Greek text without accents and case-insensitively", async ({ page }) => {
      const rows = await openTable(page);
      const name = ((await rows.first().locator("td").nth(3).textContent()) ?? "").trim();
      if (!name) { test.skip(); }
      const plain = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      await searchBox(page).fill(plain);
      await expect(rows.filter({ hasText: name }).first()).toBeVisible();
    });

    test("no matches shows an empty state, clearing restores all rows", async ({ page }) => {
      const rows = await openTable(page);
      const total = await rows.count();

      await searchBox(page).fill("zzqx-no-such-field-9");
      await expect(page.locator("tbody tr[data-empty-state]")).toContainText(/δεν βρέθηκαν αγροτεμάχια|no fields match/i);
      await expect(rows).toHaveCount(0);
      await expect(page.locator("tfoot")).toContainText("(0)");

      await page.getByRole("button", { name: /καθαρισμός αναζήτησης|clear search/i }).click();
      await expect(searchBox(page)).toHaveValue("");
      await expect(rows).toHaveCount(total);

      // Esc also clears
      await searchBox(page).fill("zzqx");
      await expect(rows).toHaveCount(0);
      await searchBox(page).press("Escape");
      await expect(searchBox(page)).toHaveValue("");
      await expect(rows).toHaveCount(total);
    });

    test("several words must all match, in any column", async ({ page }) => {
      const rows = await openTable(page);
      const first = rows.first();
      const kaek = ((await first.locator("td").nth(1).textContent()) ?? "").trim();
      const name = ((await first.locator("td").nth(3).textContent()) ?? "").trim().split(/\s+/)[0];
      if (!kaek || !name) { test.skip(); }

      // KAEK slice + first word of the name: two columns, both required
      await searchBox(page).fill(`${kaek.slice(-4)} ${name}`);
      await expect(rows.filter({ hasText: kaek }).first()).toBeVisible();
      // Adding a word that matches nothing empties the table
      await searchBox(page).fill(`${kaek.slice(-4)} ${name} zzqx-no-such-word`);
      await expect(rows).toHaveCount(0);
    });

    test("filters the mobile cards too", async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 851 });
      await page.goto("/el/fields");
      await page.getByRole("link", { name: /προσθήκη αγροτεμαχίου|add field/i }).waitFor({ timeout: 10000 });
      const box = searchBox(page);
      // No fields → no table and no search box
      if (!(await box.isVisible().catch(() => false))) { test.skip(); }

      await box.fill("zzqx-no-such-field-9");
      await expect(page.getByText(/δεν βρέθηκαν αγροτεμάχια|no fields match/i).first()).toBeVisible();
      await box.press("Escape");
      await expect(page.getByText(/δεν βρέθηκαν αγροτεμάχια|no fields match/i).first()).toBeHidden();
    });

    test("CSV export contains only the matching rows", async ({ page }) => {
      const rows = await openTable(page);
      const kaek = ((await rows.first().locator("td").nth(1).textContent()) ?? "").trim();
      if (!kaek) { test.skip(); }
      await searchBox(page).fill(kaek);
      const count = await rows.count();

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: /εξαγωγή csv|export csv/i }).click(),
      ]);
      const stream = await download.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk as Buffer);
      // slice(1) drops the UTF-8 BOM
      const lines = Buffer.concat(chunks).toString("utf-8").slice(1).split("\r\n");
      expect(lines.length - 1).toBe(count);
      // Other rows may match the KAEK digits in another column, so only require the searched row
      expect(lines.slice(1).some((line) => line.includes(kaek))).toBe(true);
    });
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
