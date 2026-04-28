# ADR-002 — Offline storage: IndexedDB via `idb`

> **Status:** Accepted  
> **Date:** 2026-04-28  
> **Deciders:** Jørgen

---

## Context

Sider stores all user data locally with no backend (v1). The storage mechanism must:

- Persist structured records (cider entries with multiple typed fields)
- Survive page reloads and app restarts
- Work offline and inside a PWA
- Support basic querying (filter by producer, sort by date)

## Options considered

### Option A — `localStorage`

- Simple key/value string store; synchronous API.
- No support for indices or structured queries.
- 5 MB storage quota — will hit the ceiling if users log many ciders with notes.
- Synchronous reads block the main thread.

**Rejected because:** Storage cap and lack of structured querying make it unsuitable as the primary data store. (Still used for small, non-critical preferences like locale choice.)

### Option B — IndexedDB (raw API)

- The browser's native structured storage; async, no size cap beyond device limits.
- Supports object stores with indices.
- Raw API is verbose and error-prone.

### Option C — IndexedDB via `idb` ✅ Chosen

- `idb` is a thin Promise-based wrapper around IndexedDB by Jake Archibald (~1 kB gzipped).
- Retains all IndexedDB capabilities with a clean, modern async/await API.
- Widely used and well-maintained.
- Schema versioning and migration support built-in.

### Option D — SQLite via WASM (e.g. `sql.js`, `wa-sqlite`)

- Full relational SQL in the browser.
- Much heavier (~1–3 MB WASM binary).
- Overkill for a single-entity app with simple query needs.

**Rejected because:** Dependency weight far exceeds the benefit for this use case.

### Option E — OPFS (Origin Private File System)

- Newer, faster persistent storage API.
- Browser support is still uneven (especially iOS Safari).
- Best paired with SQLite-over-WASM.

**Rejected because:** Browser support gaps and complexity are not justified for v1.

## Decision

**IndexedDB via `idb`**. One database (`sider-db`), one object store (`ciders`), keyed by `id` (UUID). Indices on `producer` and `dateLogged` for the overview and filter views. Schema versioning starts at version 1; migrations are handled in `src/lib/db/schema.ts`.

## Data loss risk ⚠️

IndexedDB is scoped to a browser origin and browser instance. This means:

- Data logged in Safari is not visible in Chrome.
- If a user follows a link in Messenger and logs a cider in the in-app browser, that data will not appear in their main browser.
- Clearing browser data or uninstalling the browser destroys all records permanently.

**Mitigation in v1:** An in-app browser detection banner (see `architecture.md §5.6`) warns users to switch to their main browser before logging anything.

**Strongly recommended before public release:** A JSON export/import feature so users can back up and restore their data. This is currently an open question in `architecture.md §9`.

## Consequences

- Schema changes require a version bump and a migration function in `schema.ts`.
- No cross-device or cross-browser sync without a future backend.
- The `idb` library adds a minimal dependency (~1 kB); acceptable.
