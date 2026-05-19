# ADR-005 — Cloudflare Workers Static Assets over Cloudflare Pages

> **Status:** Accepted (supersedes the "Cloudflare Pages" wording in ADR-001)
> **Date:** 2026-05-19
> **Deciders:** Jørgen

---

## Context

ADR-001 selected Cloudflare Pages as the hosting target. When the project was actually set up in the Cloudflare dashboard, the wizard created a **Cloudflare Worker with Static Assets** instead of a Pages project — these two products look almost identical in the dashboard but use different deploy mechanics:

- Pages projects accept a pre-built directory uploaded via `cloudflare/pages-action` or `wrangler pages deploy`.
- Workers Static Assets projects use `wrangler versions upload` and read a `wrangler.jsonc` / `wrangler.toml` file at the repo root that points to the asset directory.

The first build under the native Git integration ran `npx wrangler versions upload` (the Workers command) and failed with *"Missing entry-point to Worker script or to assets directory"* because there was no `wrangler.jsonc` in the repo.

We then had to choose: adapt the repo to the Workers primitive, or recreate the dashboard project as a Pages project.

## Options considered

### Option A — Add `wrangler.jsonc`, keep the Workers Static Assets project ✅ Chosen

Add a minimal `wrangler.jsonc` at the repo root:

```jsonc
{
    "name": "sider",
    "compatibility_date": "2026-05-19",
    "assets": {
        "directory": "./build",
        "not_found_handling": "single-page-application"
    }
}
```

The `single-page-application` value for `not_found_handling` makes any path that does not match a real file fall back to `index.html`, which is exactly the SPA-routing behaviour SvelteKit's static adapter already assumes.

**Pros:**
- Workers Static Assets is the primitive Cloudflare is investing in going forward; Pages is in maintenance mode for new features as of 2024–2025.
- One small config file in the repo is the entire repo-side change.
- Built-in `single-page-application` not-found handling is cleaner than Pages' `_redirects` / `_routes.json` mechanisms for the same goal.
- No dashboard rework required — the existing project, build token, and Git connection all keep working.

**Cons:**
- Diverges from ADR-001's literal wording ("Cloudflare Pages"). This ADR supersedes that part of ADR-001.
- One extra config file in the repo root.
- Slightly newer surface area; less written about online than Pages.

### Option B — Recreate the dashboard project as a Cloudflare Pages project

Delete the current Worker in the Cloudflare dashboard, create a new Pages project named `sider`, reconnect it to the GitHub repo. Set build command `npm run build`, output directory `build`. No repo change needed.

**Pros:**
- Honours ADR-001 verbatim.
- No `wrangler.jsonc` in the repo.

**Cons:**
- Pages is the older primitive; Cloudflare's roadmap is now Workers Static Assets.
- Dashboard rework, rolling tokens again, redoing the Git connection — all the setup pain we already absorbed.
- Cloudflare may eventually deprecate Pages new-project creation, forcing this migration anyway.

## Decision

**Option A.** Cloudflare has been steering everyone toward Workers Static Assets since 2024, and the dashboard wizard apparently now creates that by default. The hosting behaviour we actually need — static file serving from a global CDN with SPA fallback, deployed automatically from `git push`, free tier — is identical under either primitive. Adding a 9-line `wrangler.jsonc` is the cheapest path that aligns us with where Cloudflare is heading.

## Consequences

- `wrangler.jsonc` at the repo root is now part of the deployment contract. Renaming the project, changing the asset directory, or adding Worker code in the future all happen there.
- The public URL pattern changes from `*.pages.dev` (as originally planned) to `*.workers.dev`, or whichever custom domain we attach later. The "Custom domain" open question in `architecture.md` is unaffected.
- ADR-001's mention of "Cloudflare Pages" is superseded by this ADR. The framework/language decisions in ADR-001 are unchanged.
- ADR-004 ("Deploy via Cloudflare's native Git integration") remains valid — only the underlying Cloudflare product changed, not the pipeline choice.
- `.wrangler/` is added to `.gitignore` in case anyone runs wrangler locally; the build still runs only in CI.
