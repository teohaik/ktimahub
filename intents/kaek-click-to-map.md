# Intent: Add a new action in the last "Actions" Column of the master table to show the selected field on the official greek ktimatologio map.

**Status:** Implemented (v0.9.3)
**Created:** 2026-10-15
**Area:** Land Owner — Fields table (`/fields`) → external map (maps.ktimatologio.gr)

## Goal

In the fields table, the owner clicks a new small button next to "Show on map" existing button and is redirected on the official greek ktimatologio map with that field selected and in view.
Example URL of the official map is: https://maps.ktimatologio.gr/?locale=el#widget_6=active_datasource_id:dataSource_1,center:2513017.4947000016%2C4926497.84135%2C102100,level:18.537909866698218
The greek ktimatogio services need the KAEK number to find out the geometry to focus on.

## Investigation

Original pointers (from the owner): the official map's network traffic for KAEK 390300201011 showed
`geocode.arcgis.com/.../World/GeocodeServer/findAddressCandidates?SingleLine=390300201011` and
`services-eu1.arcgis.com/40tFGWzosjaLJpmn/.../GEOTEMAXIA_LEITOURGOUN_ON_gdb/FeatureServer/0/query?objectIds=3525770`;
also check https://sdigmap.tee.gov.gr/mapping/rest/services.

### Findings (2026-10-15)

**Result: no API call is needed.** maps.ktimatologio.gr is an ArcGIS Experience Builder 1.21 app (config: `https://maps.ktimatologio.gr/cdn/3/config.json`) and honours Experience Builder's standard `data_s` URL parameter, which selects features by a `where` clause and zooms to them. The link can be built from the KAEK alone.

**Verified link template** (tested in a real browser):

```
https://maps.ktimatologio.gr/?locale=el#data_s=where:{DS_LEITOURGOUN}~{DS_ANARTHSH}~{DS_PROKATARKTIKA}:KAEK%3D%27{KAEK}%27&zoom_to_selection=true
```

with the data source ids of the Greek page (`dataSource_1`):

| Layer | Meaning | Data source id |
|---|---|---|
| GEOTEMAXIA_LEITOURGOUN_ON_gdb | Operating cadastre (13.8M parcels) | `dataSource_1-18d44a16951-layer-12-18d5e0cb504-layer-16` |
| GEOTEMAXIA_ANARTHSH_ON_gdb | Public exhibit / ανάρτηση (3.8M) | `dataSource_1-18d44a16951-layer-12-18d5df9aabf-layer-15` |
| GEOTEMAXIA_PROKATARKTIKA_ON_gdb | Preliminary (0.24M) | `dataSource_1-18d44a16951-layer-12-18d5e7dfb35-layer-16` |

The `where` value is URL-encoded (`KAEK='…'` → `KAEK%3D%27…%27`, KAEK itself via `encodeURIComponent`). The `~` joins several data sources in one selection.

Browser test results:

| Case | KAEK | Result |
|---|---|---|
| Operating cadastre | `390300201011` | ✅ Zoomed, parcel highlighted, info popup with KAEK + area (16,393.5 m²) |
| Different region, fresh load | `051333809002` | ✅ Jumped to the parcel and highlighted it |
| Public exhibit layer only | `050050102001` | ✅ Found via the multi-layer link ("ΣΕ ΑΝΑΡΤΗΣΗ" popup) |
| Greek letters + duplicate KAEK | `47089ΕΚ13318` | ✅ Both matching features selected ("1 από 2"), view fits both |
| Non-existent KAEK | `999999999999` | ⚠️ No error: map opens on all of Greece, "Επιλεγμένα στοιχεία: 0" |

Notes:
- Do **not** add `widget_6=center…` together with `zoom_to_selection` — map params in the hash disable zoom-to-selection. (A centre+level+`data_s` variant also works, but needs a centroid lookup first; unnecessary.)
- Zoom is chosen by the app: very small parcels open at a tight zoom (level ~22). Acceptable.
- English page uses `widget_74` / `dataSource_3-…` ids; the Greek page with `?locale=el` works for both UI languages, so always link to the Greek page.
- The World geocoder call seen in the network trace is a red herring (returns no candidates for a KAEK).
- **Dead ends:** sdigmap.tee.gov.gr (urban planning/census/archaeology layers only, no parcels or KAEK), gis.ktimanet.gr (orthophoto basemap WMS only), INSPIRE/OGC cadastral services (none reachable for Greece), data.ktimatologio.gr (403).

### Optional: KAEK lookup service (not needed for this feature)

The parcel layers behind the map are public ArcGIS FeatureServers — no token, CORS `*`, ~0.6 s per query, updated daily:

```
https://services-eu1.arcgis.com/40tFGWzosjaLJpmn/arcgis/rest/services/GEOTEMAXIA_LEITOURGOUN_ON_gdb/FeatureServer/0/query?where=KAEK%3D%27{KAEK}%27&outFields=KAEK,AREA&returnGeometry=true&outSR=4326&f=geojson
```

Returns the parcel polygon in WGS84 and the true area (`AREA`, m²; `Shape__Area` is Web Mercator-inflated). Useful for a **future** feature: auto-fill a field's polygon / official area from its KAEK, or pre-check "found on the official map" before linking. A CC-BY bulk dataset of operating-cadastre parcels (EGSA87 shapefiles per region) exists on data.gov.gr.

### Risks

- The URL format and data source ids are internals of the official app, not a documented API. A redesign of maps.ktimatologio.gr can break the link silently. Keep the template in **one** helper so it is a one-line fix, and keep an E2E assertion on the generated href.
- No stated terms of use for the services; content is the Hellenic Cadastre's intellectual property. Linking out (new tab) is low risk; embedding (iframe) is not planned.

## Current behaviour

- There is no current behaviour. this is a new feature.

## Desired behaviour

1. **Desktop table:** In the "Actions column", next to "Show on map" a new button appears. Button click opens a new tab with the maps.ktimatologio.gr map and the field highlighted.
2. **Mobile cards:** A new option "Show on Land Registry Maps / Επίσημο Κτηματολόγιο" next to "Show on map" appears. Tapping it opens maps.ktimatologio.gr in a new tab with the field highlighted. The field detail page SHOULD NOT appear in this case (the mobile action row already stops click propagation).

## Edge cases

- **Empty KAEK** (allowed, e.g. from E9 imports): hide the new button (or render it disabled with a tooltip). The internal "Show on map" icon still works.
- **KAEK not on the official map** (typo, not yet cadastred): the official map opens on all of Greece with 0 selected — no error. Accept for v1; a later version can pre-check via the FeatureServer and show "Δεν βρέθηκε στο Κτηματολόγιο" / "Not found in the Land Registry".
- **Whitespace / formatting:** strip all whitespace from the KAEK before building the URL (the field update route does not normalise KAEK, unlike create and E9 import). Do not validate as 12 digits — some KAEKs contain Greek letters (e.g. `47089ΕΚ13318`).
- **Duplicate KAEK** (multipart parcels): handled by the official map (all parts selected).

## Acceptance criteria

- [ ] Clicking the new button in the desktop table opens `https://maps.ktimatologio.gr` in a new tab (`target="_blank" rel="noopener noreferrer"`) with that field highlighted.
- [ ] Tapping the new option on a mobile card does the same and does not open the field detail page.
- [ ] A field with an empty KAEK shows no active Ktimatologio button.
- [ ] The URL is built by a single helper (e.g. `src/lib/ktimatologio.ts → ktimatologioMapUrl(kaek)`) that strips whitespace and URL-encodes the KAEK.
- [ ] New labels exist in Greek and English (`messages/el.json`, `messages/en.json`, next to `common.showOnMap`).
- [ ] E2E: the button has `target="_blank"` and an href matching `maps.ktimatologio.gr/…data_s=where:…KAEK%3D%27…`.

## Decisions

- **Target:** the greek ktimatologio map, not the field detail page. The field name link already goes to the detail page.
- **Link-only, no lookup:** use the verified `data_s` + `zoom_to_selection` template; no server route, no external API call from our app.
- **Layers:** operating + public exhibit + preliminary in one link, so parcels in areas still under survey work too.

## Implementation notes

- `src/components/fields/FieldsTable.tsx`: desktop actions cell (`<div className="flex items-center gap-3">` next to the `MapIcon` link) and mobile action row (next to the `common.showOnMap` link). Use a plain `<a>`, not `next/link`, plus a new inline SVG icon in the style of `MapIcon`.
- No CSP in `next.config.ts`, so external links are not blocked.
