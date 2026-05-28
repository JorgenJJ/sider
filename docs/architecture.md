# Sider — Architecture & Implementation Plan

> **Status:** v1 implemented — build passing  
> **Last updated:** 2026-05-19  
> **Decisions logged:** Tech stack → SvelteKit confirmed (ADR-001). Ratings → deferred to post-v1. Export → JSON export included in v1. Registration simplified to single-screen chip flow ([simplified-registration spec](./specs/simplified-registration.md)).

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
| Hosting | **Cloudflare Workers Static Assets** | Free tier, global CDN, modern Cloudflare static-site primitive; see ADR-005 (supersedes ADR-001's "Pages" wording) |
| CI/CD | **Cloudflare Workers Builds (native Git integration)** | Cloudflare watches the GitHub repo, builds and deploys on every push; see ADR-004 |

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
// Sensory keys live in src/lib/db/schema.ts. The model follows the physical
// cider tasting wheel (siderhjul) — see specs/flavor-wheel-aromas.md (ADR-006).
type SweetnessKey = 'dry' | 'semidry' | 'semisweet' | 'sweet';
type CarbonationKey = 'flat' | 'creamy' | 'pearling' | 'sparkling'; // legacy 'still' → 'flat'
type CiderTypeKey = 'apple' | 'pear' | 'ice' | 'rose' | 'other';
type ColorKey = 'lightyellow' | 'golden' | 'amber' | 'pink';
type ClarityKey = 'clear' | 'cloudy' | 'hazy';
type StructureKey = 'sharp' | 'acidic' | 'round' | 'full';
type FaultKey = 'wetcardboard' | 'dampcellar' | 'rotten' | 'musty' | 'vinegar' | 'acetone' | 'sulfur';
// AromaKey: ~44 wheel-inspired keys organised into AROMA_GROUPS (epler/frukt/bær/
// blomster & planter/krydder/gjær & bakst/fat). Legacy aroma/appearance/flavor
// keys are retained for reading older records.

// Legacy v1 per-category notes — kept for backwards-compatible reads only.
interface CiderNotes {
  utseende?: string;
  aroma?: string;
  smak?: string;
  munnfølelse?: string;
  generelt?: string;
}

// ── Reserved for future rating feature — NOT exposed in v1 UI ──────────────
// Scale is intentionally unspecified; do not assume 1–5.
interface CiderRatings {
  utseende?: number;
  aroma?: number;
  smak?: number;
  munnfølelse?: number;
  totalinntrykk?: number;
}
// ────────────────────────────────────────────────────────────────────────────

interface Cider {
  id: string;
  name: string;
  producer: string;
  dateLogged: string;
  // Independent style axes:
  sweetness?: SweetnessKey;
  carbonation?: CarbonationKey;
  type?: CiderTypeKey;
  // Tasting-wheel sensory model (v3):
  color?: ColorKey;
  clarity?: ClarityKey;
  aroma?: AromaKey[];      // grouped (multi-select)
  structure?: StructureKey[];
  faults?: FaultKey[];
  // Single free-text note (replaces the five-category notes object):
  comment?: string;
  // Optional metadata:
  vintage?: number;
  abv?: number;
  // Legacy fields, still readable but no longer written:
  appearance?: AppearanceKey[];
  flavor?: FlavorKey[];
  style?: string;
  notes?: CiderNotes;
  // Reserved:
  ratings?: CiderRatings;
  imagePath?: string;
}
```

«Stil» er splittet i tre uavhengige akser (sødme, kullsyre, type) for å unngå konflikten der en sider kan være både «Tørr» og «Stille» samtidig. Sanseinntrykk lagres som chip-nøkler heller enn fri tekst. Modellen følger det fysiske smakshjulet (siderhjul): hurtigregistreringen speiler hjulets HURTIGANALYSE-akser (karbonisering, farge, klarhet, struktur, sødme + ABV), og aromaene er gruppert etter hjulets seksjoner ([flavor-wheel-aromas spec](./specs/flavor-wheel-aromas.md), [ADR-006](./decisions/006-tasting-wheel-sensory-model.md)). Numeric ratings are reserved in the type but carry no data in v1 — the scale is deliberately left unspecified until the rating feature is designed. `imagePath` is likewise reserved to avoid a future migration.

All ciders are stored in a single IndexedDB object store `ciders`, keyed by `id`. Indices on `producer` and `dateLogged` support the overview and filter views. Skjemaet ble bumpet additivt v1 → v2 → v3 (ingen destruktiv migrering); gamle felter (`style`, `notes`, `appearance`, `flavor`, og `carbonation: 'still'`) leses fortsatt fra eldre poster i detaljvisningen og migreres til de nye feltene ved neste lagring.

---

## 5. Feature breakdown (initial release)

### 5.1 Log a cider

The primary user flow. A single-screen form on `/new` with chip-based input — see [simplified-registration spec](./specs/simplified-registration.md):

- Name and producer text inputs (required).
- Single-select hurtiganalyse-akser: sødme (Tørr/Halvtørr/Halvsøt/Søt), kullsyre (Flat/Kremet/Perlende/Musserende), farge, klarhet (Klar/Skyet/Uklar).
- Struktur (flervalg: Skarp/Syrlig/Rund/Fyldig) og en gruppert lukt-velger (`AromaPicker`) med hjulets aromagrupper.
- `Mer info` skjuler avvik (off-aromaer), type, årgang, ABV og en valgfri fritekstboks.

The previous [notes-and-suggestions spec](./specs/notes-and-suggestions.md) is superseded by this design — suggestion chips drawn from past notes were removed in favour of a fixed common set. Eldre poster lagret med per-kategori notater leses fortsatt i detaljvisningen.

No numeric ratings. Saving creates a new `Cider` record in IndexedDB and navigates to the overview.

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
- **Manifest wiring:** `vite-plugin-pwa` builds `manifest.webmanifest` from the inline config in `vite.config.ts`, but the plugin's automatic HTML injection does not reach the SvelteKit-rendered `index.html`. The `<link rel="manifest">` is therefore added explicitly in `src/app.html` ([bug-003](./bugs/003-pwa-manifest-not-linked.md)).
- **Service worker registration:** Handled by SvelteKit's built-in auto-registration of `src/service-worker.ts`. The same file is processed by `vite-plugin-pwa`'s `injectManifest` strategy to embed the Workbox precache list, so SvelteKit ends up registering the Workbox-built SW. `vite-plugin-pwa` also emits an unused `registerSW.js` artefact — it is harmless and we do not load it.
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
Cloudflare Workers Builds (native Git integration)
  ├─ npm ci
  ├─ npm run build           → build/
  └─ wrangler versions upload → reads wrangler.jsonc, uploads build/ as assets
        │
        ▼
https://sider.<account>.workers.dev  (or custom domain)
```

- The Cloudflare Worker `sider` is connected to the GitHub repo via Cloudflare's native Git integration. There is no GitHub Actions workflow — Cloudflare handles checkout, install, build, and deploy on its own runners. See [ADR-004](./decisions/004-deploy-via-cloudflare-git-integration.md) for that pipeline choice and [ADR-005](./decisions/005-workers-static-assets-over-pages.md) for the choice of Workers Static Assets over Cloudflare Pages.
- Build configuration (set in the Cloudflare dashboard → project Settings → Build):
  - Build command: `npm run build`
  - Deploy command: `npx wrangler versions upload` (default for Workers projects; reads `wrangler.jsonc`)
  - Root directory: `/`
- Static-asset configuration lives in [`wrangler.jsonc`](../wrangler.jsonc) at the repo root: assets are served from `./build`, and `not_found_handling: "single-page-application"` makes any unknown path serve `index.html` so client-side routing works.
- Preview deployments are created automatically for pull requests as Workers preview URLs.
- The Workers Build uses an internal build token managed by Cloudflare (project Settings → Build configuration → Build token). It is **not** the same as a user-generated API token, and it is not stored in this repo or in GitHub secrets.
- No server-side code in production; the Worker only serves static assets — equivalent in behaviour to the original Cloudflare Pages plan.
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
- [x] **Cloudflare secrets**: ~~`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must be added to GitHub repository secrets before the CI/CD pipeline can deploy.~~ → **No longer applicable** (2026-05-19). The deploy now uses Cloudflare's native Git integration (see ADR-004); no GitHub secrets are required.

---

## 10. Out of scope (v1)

- Social / sharing features
- A curated database of ciders or producers
- Server-side storage or accounts
- Cross-device sync
