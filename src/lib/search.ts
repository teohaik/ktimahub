// Client-side "%like%" search: case-, accent- and final-sigma-insensitive substring matching.
// A query of several words matches when every word appears somewhere in the row's text.

/** Lowercases, strips diacritics (Greek tonos/dialytika, Latin accents) and folds ς → σ. */
export function normalizeForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ς/g, "σ");
}

/** Splits a query into normalized words; an empty result means "match everything". */
export function searchTerms(query: string): string[] {
  return normalizeForSearch(query).split(/\s+/).filter(Boolean);
}

/** True when every term is a substring of at least one of the values. */
export function matchesSearch(values: (string | null | undefined)[], terms: string[]): boolean {
  if (terms.length === 0) return true;
  // Join with a separator no term can contain, so a term never matches across two values
  const haystack = normalizeForSearch(values.filter(Boolean).join("\u0000"));
  return terms.every((term) => haystack.includes(term));
}
