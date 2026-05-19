# ADR-004 — Deploy via Cloudflare's native Git integration (not GitHub Actions)

> **Status:** Accepted
> **Date:** 2026-05-19
> **Deciders:** Jørgen

---

## Context

The initial deployment pipeline used a GitHub Actions workflow (`.github/workflows/deploy.yml`) that ran `npm ci`, `npm run check`, `npm run build`, and then called `cloudflare/pages-action@v1` to upload the `build/` directory to Cloudflare Pages.

While setting up the project in the Cloudflare dashboard, the Pages project was also connected to the GitHub repository, which enabled Cloudflare's native **Workers Builds** integration. Workers Builds watches the repo via webhook and runs its own build pipeline on every push — independent of the GitHub Actions workflow.

This left two pipelines deploying the same commit on every push, with overlapping responsibilities and a real risk of race conditions, duplicated preview URLs, and confusing status checks on PRs. We needed to pick one.

(Separately, `cloudflare/pages-action@v1` was archived by Cloudflare in late 2024. We migrated it to `cloudflare/wrangler-action@v3` while investigating — but that migration is now moot.)

## Options considered

### Option A — Cloudflare Workers Builds only ✅ Chosen

- Delete `.github/workflows/deploy.yml`.
- Configure build settings in the Cloudflare dashboard: build command `npm run build`, output directory `build`, root `/`.
- Cloudflare handles checkout, install, build, deploy, and preview URLs for PRs.

**Pros:**
- Single source of truth for "how Sider gets deployed".
- No GitHub secrets to manage (no `CLOUDFLARE_API_TOKEN`, no `CLOUDFLARE_ACCOUNT_ID`); Cloudflare manages its own internal build token.
- One less moving part for a single-developer / agent-driven project.
- Preview URLs and deployment status surface natively on PRs via the `cloudflare-workers-and-pages` bot.

**Cons:**
- Build runs on Cloudflare's runner — we can't slot in pre-deploy steps that don't make sense to ship (e.g. a separate `npm run check` gate before deploy).
- Less portable: moving off Cloudflare later means re-creating a CI pipeline from scratch.

### Option B — GitHub Actions only

- Keep `.github/workflows/deploy.yml` (migrated to `cloudflare/wrangler-action@v3`).
- Disconnect the Cloudflare project from Git, or switch it to "Direct Upload" mode so it stops auto-building.
- Maintain `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub Actions secrets.

**Pros:**
- Full control over the pipeline (type-check, lint, future test step can all gate the deploy).
- Pipeline definition lives in the repo, reviewable via PR.

**Cons:**
- Two systems to understand (GitHub Actions + Cloudflare API).
- Secrets to rotate and protect.
- Cloudflare's PR preview comments and status checks don't show up automatically — would need to wire them in.

### Option C — Run both

Rejected outright: nondeterministic deploy ordering, duplicated build minutes, conflicting status checks on PRs, and confusing UX when one succeeds and the other fails.

## Decision

**Option A.** Sider is a small, single-purpose PWA with no test suite yet and a build that already passes locally and in Cloudflare's runner. The marginal control from Option B doesn't justify maintaining a second pipeline and a pair of long-lived secrets. The GitHub Actions workflow was removed.

If we later add a test suite or other gates that must run before deploy, we can revisit by either:
- Adding a separate GitHub Actions workflow that runs *only* checks (no deploy) and blocks merge, leaving Cloudflare to handle the deploy from `main`; or
- Switching to Option B with a fuller workflow.

## Consequences

- **No GitHub Actions secrets needed** for deployment. The `CLOUDFLARE_API_TOKEN` previously added to the repo can be deleted (it has already been rolled once during setup); the `CLOUDFLARE_ACCOUNT_ID` is also no longer referenced.
- **Cloudflare dashboard becomes the canonical place** for build configuration. Build command, output directory, and environment variables (none required today) are configured there, not in the repo.
- **No pre-deploy gate.** Anything that lands on a watched branch will be deployed, even if `npm run check` would fail. Local discipline (and PR review) are the only safeguards until we add Option-C-style check-only CI.
- **`.github/` directory was removed entirely** when `deploy.yml` was the only file under it.
- **Cloudflare's build token** (project Settings → Build configuration → Build token) is the credential that authorises the Workers Build. It is managed by Cloudflare and is not the same as a user-generated API token. Rolling a personal API token does *not* invalidate it, but rolling the build token itself does — and will require an in-dashboard update before the next build will run.
