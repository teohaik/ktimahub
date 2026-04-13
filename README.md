# KtimaHub — Διαχείριση Αγροτεμαχίων

> v0.3.1 · [ktimahub.gr](https://ktimahub.gr)

A bilingual (Greek / English) web application for managing agricultural fields across Greece. The land owner tracks field details, leaseholders, and yearly crop history. Built for both desktop and mobile.

---

## Features

### Public landing page
- Bilingual welcome page at the root URL with feature overview and sign-in CTA
- Automatically redirects authenticated users to their role-based dashboard

### Land Owner
- **Fields table** — all fields with ID, KAEK, name, field number (village registry), official area, calculated area, and leaseholder; click any row to open the field
- **Map view** — all fields as blue polygons on OpenStreetMap with satellite imagery; hover shows `Name - FieldNumber`
- **Add / edit fields** — draw polygons on satellite map or paste tab-separated EGSA87/EPSG:2100 coordinates from the Greek land registry; automatic coordinate conversion and area calculation; fullscreen map mode for easier vertex placement on mobile
- **Vertex editing** — drag vertices to move, right-click to delete
- **GPS mode** — add current device position as a vertex for live field surveying on mobile
- **Crop history** — track crop type per field per year (Wheat, Barley, Cotton, Vetch, Clover)
- **PDF table report** — landscape A4, all fields with Greek Unicode support via Noto Sans
- **PDF full report** — table + per-field satellite map with polygon overlay; maps rendered via pure Web Mercator tile math (no html2canvas, pixel-perfect alignment)

### Leaseholder
- View assigned fields and declare the crop for the current year
- Interface defaults to Greek

### Super Admin
- Create and manage user accounts with name, email, role, and optional password
- **Email invitations** — invite users by email with a chosen role; invited users accept via Google OAuth or by setting a password; powered by Resend
- Assign roles: Super Admin, Land Owner, Leaseholder

### Multi-role support
- A user account can hold multiple roles
- Role-selection screen shown at login when more than one role is held
- In-app role switcher in the navbar (no logout required)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Neon (PostgreSQL) via Prisma 7 + `@prisma/adapter-pg` |
| Auth | NextAuth.js v5 — Google OAuth + credentials |
| Map | Leaflet.js + OpenStreetMap / ArcGIS World Imagery |
| Coordinate conversion | proj4js — EGSA87 / EPSG:2100 → WGS84 |
| i18n | next-intl v4 — Greek (default) and English |
| PDF generation | @react-pdf/renderer (server) + jsPDF (client) |
| Fonts | Noto Sans (TTF) for Greek Unicode in PDFs |
| Email | Resend |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel |

---

## Roles

| Role | Access |
|---|---|
| `SUPER_ADMIN` | User management, email invitations |
| `LAND_OWNER` | Fields CRUD, map, crop history, PDF reports |
| `LEASEHOLDER` | Declare crop for assigned fields |

---

## Local Development

### Prerequisites
- Node.js 20+
- A Neon (or any PostgreSQL) database
- Google OAuth credentials
- A [Resend](https://resend.com) account and verified sender domain (for email invitations)

### Setup

```bash
git clone https://github.com/teohaik/field-manager.git
cd field-manager
npm install
```

Pull environment variables from Vercel (recommended):

```bash
vercel link
vercel env pull .env.local
```

Or copy the example file and fill in values manually:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=<random string — generate with: openssl rand -base64 32>
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=<google oauth client id>
AUTH_GOOGLE_SECRET=<google oauth client secret>
RESEND_API_KEY=re_...
EMAIL_FROM=KtimaHub <noreply@ktimahub.gr>
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Migrations

Migrations live in `prisma/migrations/`. To apply pending migrations:

```bash
npx prisma migrate deploy
```

The Vercel build command (`prisma generate && prisma migrate deploy && next build`) applies migrations automatically on every deployment.

To promote an existing user to SUPER_ADMIN + LAND_OWNER:

```bash
npx tsx --env-file=.env.local scripts/set-super-admin.ts
```

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Migrate + generate Prisma client + build |
| `npm start` | Start production server |
| `npx tsx --env-file=.env.local scripts/set-super-admin.ts` | Grant SUPER_ADMIN + LAND_OWNER roles to a user |

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (admin)/users/           # Super Admin — user management
│   │   ├── (owner)/fields/          # Land Owner — fields CRUD + map
│   │   ├── (leaseholder)/my-fields/ # Leaseholder — crop declaration
│   │   ├── invite/[token]/          # Email invite acceptance (public)
│   │   ├── select-role/             # Role selection (multi-role users)
│   │   ├── login/                   # Login page
│   │   └── page.tsx                 # Landing page (public) / role redirect (auth)
│   └── api/
│       ├── fields/                  # Fields CRUD
│       ├── users/                   # User management
│       ├── invites/                 # Email invite creation + acceptance
│       ├── crops/                   # Crop history
│       └── reports/                 # PDF report generation
├── components/
│   ├── auth/                        # LoginForm, RoleSelector, InviteAcceptForm
│   ├── admin/                       # UsersManager (with invite modal)
│   ├── fields/                      # FieldsTable, FieldForm, FullReportButton
│   ├── map/                         # LeafletMap, MapContainer, MapView
│   └── layout/                      # AppShell, Navbar
├── lib/
│   ├── db.ts                        # Prisma singleton
│   ├── email.ts                     # Resend email client
│   ├── auth-helpers.ts              # requireAuth / requireRole
│   ├── map/                         # MapProvider interface, types, coord conversion
│   └── pdf/                         # FieldsTablePdf component
├── types/
│   └── next-auth.d.ts               # Session + JWT type augmentation
└── auth.ts                          # NextAuth configuration
prisma/
├── schema.prisma
└── migrations/
messages/
├── el.json                          # Greek translations (default)
└── en.json                          # English translations
public/
└── fonts/                           # NotoSans-Regular.ttf, NotoSans-Bold.ttf
```

---

## Map Architecture

The map layer uses the **Strategy + Adapter pattern**. `src/lib/map/types.ts` defines the `MapProvider` interface. The Leaflet implementation is one concrete adapter. Swapping to Google Maps or Mapbox only requires a new adapter — no other code changes.

PDF map screenshots are rendered entirely via a pure canvas tile renderer (`renderFieldMap` in `FullReportButton.tsx`): tiles are fetched from ArcGIS World Imagery and drawn using Web Mercator projection math; the polygon is drawn using the same projection, guaranteeing pixel-perfect alignment without any DOM capture.

---

## Deployment

The app is deployed on Vercel. Every push to `main` triggers a production deployment.

Environment variables are managed via the Vercel dashboard or `vercel env add`. After adding or updating variables, pull them locally with:

```bash
vercel env pull .env.local --yes
```
