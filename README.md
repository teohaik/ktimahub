# Field Manager — Διαχείριση Αγροτεμαχίων

> v0.0.5 · [myfields.vercel.app](https://myfields.vercel.app)

A web application for managing agricultural fields distributed across Greece. The land owner tracks field details, leaseholders, and yearly crop history. Built for both desktop and mobile.

---

## Features

### Land Owner
- **Fields table** — view all fields with ID, KAEK, name, official area, calculated area, and leaseholder
- **Map view** — all fields displayed as blue polygons on OpenStreetMap with satellite imagery support
- **Add / edit fields** — draw polygons on the map or paste tab-separated coordinates exported from the Greek land registry (EGSA87 / EPSG:2100), with automatic coordinate conversion and area calculation
- **GPS mode** — add the device's current GPS position as a polygon vertex (mobile field surveying)
- **Crop history** — track which crop was planted per field per year
- **PDF reports** — table-only report or full report with per-field map screenshots

### Leaseholder
- View assigned fields and declare the crop for the current year

### Super Admin
- Create and manage user accounts (name, email, role, password)
- Assign roles: Super Admin, Land Owner, Leaseholder

### Multi-role support
- A user account can hold multiple roles
- A role-selection screen is shown at login when a user has more than one role

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Neon (PostgreSQL) via Prisma 7 + `@prisma/adapter-pg` |
| Auth | NextAuth.js v5 — Google OAuth + credentials |
| Map | Leaflet.js + OpenStreetMap (satellite layer for Greece) |
| Coordinate conversion | proj4js — EGSA87 / EPSG:2100 → WGS84 |
| i18n | next-intl v4 — Greek (default) and English |
| PDF generation | @react-pdf/renderer |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel |

---

## Roles

| Role | Access |
|---|---|
| `SUPER_ADMIN` | User management |
| `LAND_OWNER` | Fields, map, crop history, PDF reports |
| `LEASEHOLDER` | Declare crop for assigned fields |

---

## Local Development

### Prerequisites
- Node.js 20+
- A Neon (or any PostgreSQL) database
- Google OAuth credentials

### Setup

```bash
git clone https://github.com/teohaik/field-manager.git
cd field-manager
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...
AUTH_SECRET=<random string>
AUTH_GOOGLE_ID=<google oauth client id>
AUTH_GOOGLE_SECRET=<google oauth client secret>
NEXTAUTH_URL=http://localhost:3000
```

Apply database migrations and generate the Prisma client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Migrations

Migrations live in `prisma/migrations/`. To apply all pending migrations:

```bash
npx prisma migrate deploy
```

To create a new migration during development:

```bash
npx prisma migrate dev --name <migration-name>
```

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Generate Prisma client + build for production |
| `npm start` | Start production server |
| `npx tsx --env-file=.env.local scripts/set-super-admin.ts` | Grant a user the SUPER_ADMIN + LAND_OWNER roles |

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (admin)/users/           # Super Admin — user management
│   │   ├── (owner)/fields/          # Land Owner — fields CRUD + map
│   │   ├── (leaseholder)/my-fields/ # Leaseholder — crop declaration
│   │   ├── select-role/             # Role selection screen (multi-role users)
│   │   └── login/                   # Login page
│   └── api/                         # API routes (fields, users, crops, reports)
├── components/
│   ├── auth/                        # LoginForm, RoleSelector
│   ├── admin/                       # UsersManager
│   ├── fields/                      # FieldsTable, FieldForm, MapView
│   └── layout/                      # AppShell, Navbar
├── lib/
│   ├── db.ts                        # Prisma singleton
│   ├── auth-helpers.ts              # requireAuth / requireRole helpers
│   ├── map/                         # MapProvider interface, Leaflet adapter, coord conversion
│   └── pdf/                         # PDF report components
├── types/
│   └── next-auth.d.ts               # Session type augmentation
└── auth.ts                          # NextAuth configuration
prisma/
├── schema.prisma
└── migrations/
messages/
├── el.json                          # Greek translations (default)
└── en.json                          # English translations
```

---

## Map Architecture

The map layer uses the **Strategy + Adapter pattern**. `src/lib/map/types.ts` defines the `MapProvider` interface. The OpenStreetMap / Leaflet implementation is one concrete adapter. Swapping to Google Maps or Mapbox only requires a new adapter — no other code changes.

---

## Deployment

The app is deployed on Vercel. Every push to `main` triggers a production deployment.

Environment variables are managed via the Vercel dashboard or `vercel env`.

The build command (`prisma generate && next build`) ensures the Prisma client is always generated fresh in the Vercel build environment.
