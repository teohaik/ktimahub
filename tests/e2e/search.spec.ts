import { test, expect } from "@playwright/test";
import { buildSearchText, matchesSearch, normalizeForSearch, searchTerms } from "../../src/lib/search";

// Pure unit tests of the table search helper — no page, no login, no data needed.
const matches = (values: (string | null | undefined)[], query: string) =>
  matchesSearch(buildSearchText(values), searchTerms(query));

test.describe("search helper", () => {
  test("normalizes case, Greek accents, dialytika and final sigma", () => {
    expect(normalizeForSearch("Σιτάρι")).toBe("σιταρι");
    expect(normalizeForSearch("ΠΑΠΑΔΌΠΟΥΛΟΣ")).toBe("παπαδοπουλοσ");
    expect(normalizeForSearch("Παπαδόπουλος")).toBe("παπαδοπουλοσ");
    expect(normalizeForSearch("Προϊόν")).toBe("προιον");
    expect(normalizeForSearch("Café")).toBe("cafe");
  });

  test("substring match anywhere in any value", () => {
    const row = ["390300201011", "Παπαδόπουλος", "Σιτάρι", "12.345", "50%"];
    expect(matches(row, "0201")).toBe(true);
    expect(matches(row, "σιταρι")).toBe(true);
    expect(matches(row, "ΠΑΠΑΔΟΠΟΥΛΟΣ")).toBe(true);
    expect(matches(row, "δοπ")).toBe(true);
    expect(matches(row, "xyz")).toBe(false);
  });

  test("several words are ANDed across values", () => {
    const row = ["390300201011", "Σιτάρι", "50%"];
    expect(matches(row, "σιταρι 50")).toBe(true);
    expect(matches(row, "  σιταρι   50  ")).toBe(true);
    expect(matches(row, "σιταρι 99")).toBe(false);
  });

  test("a term never matches across two adjacent values", () => {
    // "abc" + "def" must not match "cd"
    expect(matches(["abc", "def"], "cd")).toBe(false);
  });

  test("empty query matches everything; null values are ignored", () => {
    expect(searchTerms("   ")).toEqual([]);
    expect(matches(["a"], "")).toBe(true);
    expect(matches([null, undefined, "Κριθάρι"], "κριθ")).toBe(true);
    expect(matches([null, undefined], "x")).toBe(false);
  });
});
