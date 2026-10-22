// Client-side "%like%" search: case-, accent- and final-sigma-insensitive substring matching.
// A query of several words matches when every word appears somewhere in the row's text.

/** Lowercases, strips diacritics (Greek tonos/dialytika, Latin accents) and folds ς → σ. */
export function normalizeForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ς/g, "σ");
}

/** Splits a query into normalized words; an empty result means "match everything". */
export function searchTerms(query: string): string[] {
  return normalizeForSearch(query).split(/\s+/).filter(Boolean);
}

/** Normalized text of a row's values, built once per row and reused for every keystroke. */
export function buildSearchText(values: (string | null | undefined)[]): string {
  // Join with a separator no term can contain, so a term never matches across two values
  return normalizeForSearch(values.filter(Boolean).join("\u0000"));
}

/** True when every term is a substring of the row's search text. */
export function matchesSearch(searchText: string, terms: string[]): boolean {
  return terms.every((term) => searchText.includes(term));
}
