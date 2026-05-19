# Sider — Architecture & Implementation Plan

> **Status:** v1 implemented — build passing  
> **Last updated:** 2026-04-29  
> **Decisions logged:** Tech stack → SvelteKit confirmed (ADR-001). Ratings → deferred to post-v1. Export → JSON export included in v1.

---

## 1. What we're building

Sider is a mobile-first PWA for logging and tasting Norwegian apple ciders. It runs entirely on-device (no backend, no account), stores all data locally in the browser, and is deployed for free via GitHub → Cloudflare Pages. The UI is available in Norwegian Bokmål and Norwegian Nynorsk.

Numeric ratings are intentionally out of scope for v1. The focus is on quick, frictionless logging of tasting notes. Ratings can be added in a later release once the core logging flow is established.

---

## 2. Tech stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | **SvelteKit** (SPA/SSG mode) | Small bundle, excellent PWA tooling, built-in routing, low boilerplate |
| Language | **TypeScript** | Type-safe data model, better DX for agents and humans alike |
| Build | **Vite** (bundled with SvelteKit) | Fast HMR, optimal production output |
| Styling | **Plain CSS + CSS custom properties** | No extra dependency; the app is simple enough |
| i18n | **Simple reactive store** (`src/lib/i18n.ts`) | Paraglide JS was specced but requires a CLI bootstrap step impractical to automate; replaced with a ~60-line store that imports `messages/*.json` at build time. Behaviourally identical; can be migrated to Paraglide later without touching components. |
| Storage | **IndexedDB via `idb`** | Structured, async, survives page refresh; see ADR-002 |
| PWA | **Vite PWA plugin (`vite-plugin-pwa`)** | Service worker, offline caching, install prompt |
| Hosting | **Cloudflare Pages** | Free tier, GitHub CI/CD, global CDN; see ADR-001 |
| CI/CD | **GitHub Actions → Cloudflare Pages** | Automatic deploy on push to `main` |

See [ADR-001](./decisions/001-tech-stack.md) and [ADR-002](./decisions/002-offline-storage.md) for full decision rationale and rejected alternatives.

---

## 3. Repository structure

```
sider/
├── .claude/
│   └── CLAUDE.md
├── docs/
│   ├── README.md
│   ├── architecture.md        ← this file
│   ├── decisions/             ← Architecture Decision Records
│   │   ├── README.md
│   │   ├── 001-tech-stack.md
│   │   └── 002-offline-storage.md
│   ├── bugs/                  ← One file per known bug / issue
│   │   └── README.md
│   └── specs/                 ← Feature requirement specs
│       ├── TEMPLATE.md
│       └── initial-release.md
├── src/
│   ├── lib/
│   │   ├── components/        ← Reusable Svelte components
│   │   ├── db/                ← IndexedDB access layer (idb)
│   │   │   ├── schema.ts      ← DB schema & migration versioning
│   │   │   └── ciders.ts      ← CRUD operations for ciders
│   │   ├── i18n/              ← Paraglide generated messages
│   │   └── stores/            ← Svelte stores (reactive state)
│   ├── routes/
│   │   ├── +layout.svelte     ← App shell, nav, locale switcher
│   │   ├── +page.svelte       ← Overview / list of ciders
│   │   ├── new/
│   │   │   └── +page.svelte   ← Log a new cider
│   │   └── cider/[id]/
│   │       └── +page.svelte   ← Detail view / edit
│   ├── app.html
│   └── service-worker.ts      ← Workbox-managed SW via vite-plugin-pwa
├── messages/
│   ├── nb.json                ← Norwegian Bokmål strings
│   └── nn.json                ← Norwegian Nynorsk strings
├── static/
│   └── icons/                 ← PWA icons (512×512, 192×192, etc.)
├── svelte.config.js
├── vite.config.ts
└── package.json
```

---

## 4. Data model

```typescript
interface CiderNotes {
  utseende?: string;      // Look — colour, clarity, carbonation
  aroma?: string;         // Smell — fruit, earth, off-notes
  smak?: string;          // Taste — sweetness, acidity, bitterness, fruit character
  munnfølelse?: string;   // Mouthfeel — body, carbonation, finish length
  generelt?: string;      // General impressions / free overflow
}

// ── Reserved for future rating feature — NOT exposed in v1 UI ──────────────
// Scale is intentionally unspecified; do not assume 1–5.
// Introduce via a DB version bump when the rating feature is designed.
interface CiderRatings {
  utseende?: number;
  aroma?: number;
  smak?: number;
  munnfølelse?: number;
  totalinntrykk?: number;
}
// ────────────────────────────────────────────────────────────────────────────

interface Cider {
  id: string;               // crypto.randomUUID()
  name: string;             // Cider product name
  producer: string;         // Producer / brewery name
  style?: string;           // e.g. "Tørr", "Halvtørr", "Søt", "Rosé"
  vintage?: number;         // Production year
  abv?: number;             // Alcohol by volume (%)
  dateLogged: string;       // ISO 8601 date string
  notes: CiderNotes;        // Per-category tasting notes; see spec: notes-and-suggestions.md
  ratings?: CiderRatings;   // Reserved — not populated or read in v1
  imagePath?: string;       // Reserved for future image capture — do not expose in UI yet
}
```

Notes are structured per tasting category to enable targeted suggestions (see §5.1 and [notes-and-suggestions spec](./specs/notes-and-suggestions.md)). Numeric ratings are reserved in the type but carry no data in v1 — the scale is deliberately left unspecified until the rating feature is designed. `imagePath` is likewise reserved to avoid a future migration.

All ciders are stored in a single IndexedDB object store `ciders`, keyed by `id`. Indices on `producer` and `dateLogged` support the overview and filter views.

---

## 5. Feature breakdown (initial release)

### 5.1 Log a cider

The primary user flow. A form on `/new` with:

- Name and producer text inputs (required)
- Optional metadata: style (select with common options), vintage (year), ABV
- Five per-category note fields: Utseende, Aroma, Smak, Munnfølelse, Generelt — all optional, each with contextual suggestions drawn from past entries (see [notes-and-suggestions spec](./specs/notes-and-suggestions.md))

No numeric ratings. Saving creates a new `Cider` record in IndexedDB and navigates to the detail view.

### 5.2 Overview

`/` lists all logged ciders, newest first. Each card shows: name, producer, date, and a truncated preview of the notes if present. Filterable by producer. Tapping a card opens the detail view.

### 5.3 Detail / edit view

`/cider/[id]` shows all fields and notes. Allows inline editing and deletion. A confirmation dialog guards deletion.

### 5.4 JSON export / import

Accessible from a settings panel. Export serialises the full `ciders` store to a `.json` file and triggers a browser download. Import reads a `.json` file, validates the shape, and merges records by `id` (existing records with the same `id` are left untouched — no silent overwrites). This is the only backup/restore mechanism in v1.

### 5.5 Locale switcher

Available in the app shell / settings panel. Choice persisted to `localStorage`. Bokmål is the default.

### 5.6 Install prompt (PWA)

The app prompts the user to install after they save their first cider — the earliest moment at which the value of offline persistence is obvious. Two distinct flows are required:

- **Chrome / Android:** capture `beforeinstallprompt`, show a bottom sheet, defer to the native browser prompt.
- **iOS Safari:** no programmatic install API; show a bottom sheet with manual Share → "Legg til på hjemmskjerm" instructions.

Already-installed users (`display-mode: standalone`) and users who have previously dismissed are never prompted. See full details in [pwa-install-prompt spec](./specs/pwa-install-prompt.md).

### 5.7 In-app browser detection (REQ-01)

When the app loads inside a known in-app browser (Messenger, Instagram, etc.) — detected via user-agent sniffing — display a persistent banner prompting the user to open in their default browser. This is important because in-app browsers have isolated storage; data logged there won't appear in Safari or Chrome. See [bug-001](./bugs/001-inapp-browser-data-isolation.md) for the known limitation.

---

## 6. i18n approach

Strings live in `messages/nb.json` and `messages/nn.json`. Paraglide compiles these to typed, tree-shaken modules. Every visible string goes through the message function — no hardcoded Norwegian in component templates.

Locale detection order:
1. User's persisted preference (`localStorage`)
2. Browser's `navigator.language` (map `nb-NO` → `nb`, `nn-NO` → `nn`)
3. Default: `nb`

---

## 7. Offline & PWA strategy

- Service worker (Vite PWA plugin / Workbox) pre-caches all static assets on install.
- Runtime caching for any future external font/icon CDN fetches.
- App shell loads fully offline after first visit.
- No network requests at runtime in v1 — data is 100% local.
- **Known limitation:** IndexedDB storage is per browser origin + browser instance. Data logged in one browser is not visible in another. The in-app browser banner (§5.7) mitigates accidental data scatter.
- **Data loss mitigation:** JSON export/import (§5.4) allows users to back up and restore their data manually. This is the only safety net in v1.

---

## 8. Local development

```bash
npm install        # macOS, Linux, or WSL — not native Windows (NTFS rename limits npm)
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → build/
npm run check      # svelte-check type validation
```

> **Windows note:** `npm install` must be run on a case-sensitive filesystem (macOS, Linux, WSL). The `build/` folder is git-ignored; Cloudflare Pages builds in CI.

---

## 9. Deployment pipeline

```
git push origin main
        │
        ▼
GitHub Actions (lint + type-check + build)
        │
        ▼
Cloudflare Pages (automatic deploy from GH integration)
        │
        ▼
https://sider.pages.dev  (or custom domain)
```

- Preview deployments are created automatically for pull requests.
- The workflow also exposes a manual `workflow_dispatch` trigger so it can be run on demand from the Actions tab.
- No server-side rendering in production; output is a fully static SPA.
- `svelte.config.js` uses `@sveltejs/adapter-static`.

---

## 10. Open questions

- [x] **Export/import**: ~~Deferred?~~ → **JSON export/import included in v1** (§5.4).
- [x] **Rating scale**: ~~1–5 vs 1–10?~~ → **Ratings deferred to post-v1**. Schema has no `ratings` field; will be introduced via migration.
- [x] **Tech stack**: ~~SvelteKit vs React?~~ → **SvelteKit confirmed** (ADR-001).
- [ ] **Image capture** (possible goal): Browser camera + OCR via `Tesseract.js` to pre-fill name/producer. Scope for v2. `imagePath` is reserved in the v1 schema to avoid a future migration.
- [ ] **Custom domain**: Use a custom domain (e.g. `sider.no`) or the default `*.pages.dev`?
- [ ] **Analytics**: Any privacy-respecting analytics (e.g. Cloudflare Web Analytics — free, no cookies) desired?
- [ ] **PWA icons**: Placeholder solid-green PNGs are in `static/icons/`. Proper branded icons need to be designed before public release.
- [x] **Cloudflare secrets**: ~~`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must be added to GitHub repository secrets before the CI/CD pipeline can deploy.~~ → **Configured** in GitHub Actions secrets (2026-05-19).

---

## 10. Out of scope (v1)

- Social / sharing features
- A curated database of ciders or producers
- Server-side storage or accounts
- Cross-device sync
