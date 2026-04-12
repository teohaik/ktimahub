@AGENTS.md

# field-manager

## Project Overview

A web app for managing agricultural fields distributed across Greece. The owner tracks field details, leaseholders, and yearly crop history. Built for both desktop and mobile (hard requirement).

---

## Application Roles

- **Super Admin**: Manages users, roles, and permissions. Creates accounts and sets username/password for leaseholders.
- **Land Owner**: Manages all fields via an admin interface.
- **Leaseholder**: Declares the crop planted on their assigned field(s) for the running year. Can be assigned to multiple fields.

---

## Application Features

### Land Owner — Fields Table View
Restricted, non-public view with a table of all fields. Columns:
- Field ID
- KAEK (National Land Registry ID)
- Field Name
- Official Area (m² — from land registry contracts, manually entered, editable)
- Calculated Area (m² — auto-calculated from polygon vertices, read-only)
- Leaseholder Name
- Link to show field on map

### Land Owner — Map View
- All fields displayed as **blue polygons** on an **OpenStreetMap** map (Leaflet.js)
- Must support **satellite imagery** of Greek territory

### Land Owner — Add / Edit Field View
Form fields (always visible): Field Name, KAEK, Official Area (m²), Calculated Area (m² — read-only, auto-calculated from polygon).

**Polygon input** uses a segmented control with two mutually exclusive modes:

1. **Draw on map** (default)
   - Click on map to place vertices one by one
   - **Mobile GPS mode**: "Add current location as vertex" button uses device GPS for live field surveying

2. **Paste coordinates**
   - Textarea to paste tab-separated vertices exported from the Greek land registry (EGSA87 / EPSG:2100 format)
   - Format: `A/A  X  Y` header + rows (e.g. `0  416623.92  4489235.86`)
   - Client-side coordinate conversion via **proj4js**: EPSG:2100 → WGS84
   - On paste/import: polygon renders on map, Calculated Area auto-fills, Official Area auto-fills (editable — owner can fine-tune)

Same view used for both adding and editing a field.

### Land Owner — Crop History
- Per field, per year: track which crop was planted (full history, not just current year)
- Crops: Wheat (Σιτάρι), Barley (Κριθάρι), Cotton (Βαμβάκι), Vetch (Βίκος), Clover (Τριφύλλι)

### Land Owner — PDF Reports
1. **Table Report**: Full fields table only. Column headers repeat on each page.
2. **Full Report**: Fields table + a map screenshot per field. Column headers repeat on each page.

### Leaseholder View
- Leaseholder logs in and sees their assigned fields
- For each field, declares the crop for the current year
- Interface is in **Greek by default** with ability to switch to English

---

## Authentication
- Google OAuth
- Username / Password
- Super Admin creates leaseholder accounts manually (username + password)

---

## Internationalization (i18n)
- Bilingual: **Greek** (default) and **English**
- Language switcher available in the UI
- Leaseholder interface defaults to Greek

---

## Tech Stack
- **Frontend**: React (Next.js 16), TypeScript
- **Backend**: Next.js API routes (Node.js)
- **Database**: Neon (Vercel Postgres) via **Prisma 7** + `@prisma/adapter-pg`
- **Map**: Leaflet.js + OpenStreetMap (with satellite layer for Greece)
- **Auth**: NextAuth.js v5 (Google OAuth + credentials provider)
- **i18n**: next-intl v4
- **Coordinate conversion**: proj4js (EGSA87/EPSG:2100 → WGS84)
- **PDF**: react-pdf or puppeteer for report generation
- **Deployment**: Vercel

---

## Architecture
Classic 3-tier architecture via Next.js on Vercel:
- **Presentation**: Next.js App Router pages + React components
- **Logic**: Next.js API routes
- **Data**: Neon Postgres via Prisma 7

### Map Provider Abstraction
Use the **Strategy + Adapter pattern** for the map layer. The `MapProvider` interface (`src/lib/map/types.ts`) abstracts all map operations. The OpenStreetMap/Leaflet implementation is one concrete adapter. Swapping to Google Maps or Mapbox means writing a new adapter without touching any other code.

### Key file paths
- Prisma schema: `prisma/schema.prisma`
- Prisma config (DB URL): `prisma.config.ts`
- Generated Prisma client: `src/generated/prisma/client.ts` (import from here, not `@/generated/prisma`)
- DB singleton: `src/lib/db.ts`
- Auth config: `src/auth.ts`
- i18n routing: `src/i18n/routing.ts`
- i18n request config: `src/i18n/request.ts`
- Messages: `messages/el.json`, `messages/en.json`
- Map types/interface: `src/lib/map/types.ts`
- Coordinate conversion: `src/lib/map/coords.ts`
- Middleware: `src/middleware.ts`

---

## Mobile
- Mobile-friendly UI is a **hard requirement**
- GPS live survey feature requires mobile browser geolocation API
