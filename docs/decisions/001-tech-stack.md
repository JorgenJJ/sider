# ADR-001 — Tech stack: SvelteKit + Cloudflare

> **Status:** Accepted (hosting primitive narrowed to Workers Static Assets in [ADR-005](./005-workers-static-assets-over-pages.md))
> **Date:** 2026-04-28
> **Deciders:** Jørgen

---

## Context

Sider is a small, mobile-first PWA with no backend. It needs to be:

- Free to host (REQ-03)
- Deployed via GitHub/Cloudflare (REQ-04, REQ-05)
- Mobile-friendly and fast (REQ-02)
- Buildable and maintainable by a single developer or AI agent

The framework choice influences bundle size, routing, i18n ergonomics, and PWA tooling.

## Options considered

### Option A — SvelteKit ✅ Chosen

- Svelte compiles components to vanilla JS at build time — no virtual DOM, tiny runtime.
- Built-in file-based routing, layouts, and transitions.
- First-class static adapter (`@sveltejs/adapter-static`) produces a fully static SPA — perfect for Cloudflare Pages.
- `vite-plugin-pwa` integrates cleanly for service worker and offline support.
- Paraglide JS (inlang) provides compile-time i18n with zero runtime overhead.
- Growing ecosystem; excellent Vite integration.

**Drawback:** Smaller ecosystem than React; fewer off-the-shelf UI component libraries.

### Option B — React + Vite

- Largest ecosystem, most familiar to most developers.
- `vite-plugin-pwa` also works here.
- React Router or TanStack Router for routing.
- More boilerplate and a larger baseline bundle than Svelte.
- i18n via `react-i18next` (runtime overhead, larger bundle) or Paraglide (also supported).

**Rejected because:** Bundle size and boilerplate outweigh the ecosystem benefit for an app this small. Svelte's reactivity model is simpler for a data-entry/display app with no complex state.

### Option C — Vanilla HTML/CSS/JS (no framework)

- Zero framework overhead.
- Tedious to maintain as the app grows; no component model.
- Routing and templating would be hand-rolled.

**Rejected because:** Even modest feature growth (multiple views, reactive list updates) becomes painful without a component model.

### Option D — Next.js + Vercel

- Strong DX and ecosystem.
- Vercel free tier is generous but is not Cloudflare (violates REQ-05).
- Next.js introduces SSR/RSC complexity that is unnecessary for a local-only app.

**Rejected because:** Violates REQ-05 and adds unnecessary complexity.

## Decision

**SvelteKit** with `@sveltejs/adapter-static`, deployed to **Cloudflare** via GitHub integration. TypeScript throughout. Styling via plain CSS with CSS custom properties (no additional CSS framework dependency).

> **Update (2026-05-19):** The specific Cloudflare product is **Workers Static Assets**, not Cloudflare Pages. See [ADR-005](./005-workers-static-assets-over-pages.md). Behaviour (static file hosting, global CDN, free tier, Git-triggered deploys) is unchanged.

## Consequences

- Developers unfamiliar with Svelte will need to learn its reactivity model (runes in Svelte 5).
- The static output means no server-side logic — acceptable since the app has no backend.
- Changing framework later would require a significant rewrite; this decision is sticky.
