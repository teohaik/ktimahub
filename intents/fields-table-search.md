# Intent: Global search on the fields table

**Status:** Implemented (v0.9.4), PR open
**Created:** 2026-10-19
**Area:** Land Owner — Fields table (`/fields`)

## Goal

A search bar in the table toolbar, left of "Export CSV", that filters the table as you type. It searches every column and matches like SQL `%like%` (substring), not exact values.

## Desired behaviour

- **Placement:** toolbar row, right side, immediately left of the Export CSV button. On mobile it takes the full width of its line, with Export CSV next to it.
- **Matching:**
  - Substring match, case-insensitive.
  - Accent-insensitive and final-sigma-insensitive for Greek: `σιταρι` matches "Σιτάρι", `ΠΑΠΑΔΟΠΟΥΛΟΣ` matches "Παπαδόπουλος".
  - Several words are ANDed: each word must appear somewhere in the row, in any column (`σιταρι 50` → wheat fields at 50% ownership).
- **Columns searched:** KAEK, ATAK, name, field number, crop (Greek and English names), leaseholder, official area, calculated area, ownership %. Not the row number (#), which depends on the sort.
- **Numbers** match both as displayed (`12.345`) and as raw digits (`12345`).
- **Clearing:** × button inside the box, or Esc.
- **Combines** with the ownership filter (AND) and keeps the current sort.
- **Everything follows the search:** desktop rows, mobile cards, footer totals and count, and the CSV export.
- **No results:** "Δεν βρέθηκαν αγροτεμάχια για «…»" / "No fields match “…”".

## Decisions

- **Client-side only.** The page already loads all of the owner's fields; no API or DB change.
- Matching lives in `src/lib/search.ts` (`normalizeForSearch`, `searchTerms`, `matchesSearch`).
- Footer "Total (N)" now counts visible rows (it previously counted all rows, which was wrong with the ownership filter too).
- **Out of scope for v1:** highlighting matches; persisting the query in the URL (`?q=`); Greek↔Latin transliteration (`papa` does not match "Παπαδόπουλος").

## Acceptance criteria

- [x] Search box left of Export CSV, labelled "Αναζήτηση…" / "Search…".
- [x] Partial KAEK (middle slice) narrows the table to matching rows.
- [x] Unaccented, uppercase Greek finds accented text.
- [x] No matches shows the empty state and "(0)" in the footer; × and Esc restore all rows.
- [x] CSV export after a search contains only the matching rows.
