// Deep link into the official Hellenic Cadastre map (maps.ktimatologio.gr).
// The app is an ArcGIS Experience Builder site: `data_s=where:<ds>~<ds>:<clause>` selects the
// parcel by KAEK and `zoom_to_selection` frames it — no lookup needed on our side.
// The data source ids are internals of that app (from /cdn/3/config.json); if the official
// site is redesigned, this is the only place to fix. See intents/kaek-click-to-map.md.

const MAP_URL = "https://maps.ktimatologio.gr/?locale=el";

// Parcel layers searched together: operating cadastre, public exhibit (ανάρτηση), preliminary.
const PARCEL_DATA_SOURCES = [
  "dataSource_1-18d44a16951-layer-12-18d5e0cb504-layer-16",
  "dataSource_1-18d44a16951-layer-12-18d5df9aabf-layer-15",
  "dataSource_1-18d44a16951-layer-12-18d5e7dfb35-layer-16",
];

/** Returns the official map URL for a KAEK, or null when the KAEK is empty. */
export function ktimatologioMapUrl(kaek: string | null | undefined): string | null {
  // KAEKs may contain Greek letters (e.g. 47089ΕΚ13318), so only strip whitespace — no format check
  const clean = (kaek ?? "").replace(/\s+/g, "").replace(/'/g, "");
  if (!clean) return null;
  // encodeURIComponent leaves ' as-is; encode it too to match the browser-verified form
  const where = encodeURIComponent(`KAEK='${clean}'`).replace(/'/g, "%27");
  return `${MAP_URL}#data_s=where:${PARCEL_DATA_SOURCES.join("~")}:${where}&zoom_to_selection=true`;
}
