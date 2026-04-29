# Spec: PWA install prompt

> **Status:** Ready for implementation  
> **Author:** Jørgen  
> **Created:** 2026-04-28  
> **Last updated:** 2026-04-28

---

## Overview

Sider should be installable as a PWA so users can launch it from their home screen, get a full-screen experience, and rely on it working fully offline. The app must prompt the user to install at the right moment — after they've seen the value of the app, not on the first page load.

There are two fundamentally different install paths depending on platform, and both must be handled:

- **Chrome (Android, desktop):** The browser fires a `beforeinstallprompt` event that can be captured and triggered programmatically.
- **iOS Safari:** No programmatic install API exists. The user must manually tap the Share button → "Legg til på hjemmskjerm". The app must detect this scenario and show manual instructions.

---

## Goals

- Prompt the user to install at a moment when they have already experienced value
- Handle the iOS manual-instruction flow without treating it as a second-class experience
- Never show the prompt more than once per dismissal; respect the user's choice
- Meet all browser PWA installability criteria so the prompt can actually fire

## Non-goals

- Forcing or repeatedly nagging the user to install
- Tracking install rates (no analytics in v1)
- Desktop-specific install UI beyond what Chrome provides natively

---

## Functional requirements

### Trigger timing

1. **REQ-01** The install prompt must **not** be shown on the first visit before the user has interacted with the app.
2. **REQ-02** The prompt must be shown after the user **saves their first cider entry**. This is the earliest moment at which the value of offline persistence is obvious and relevant.
3. **REQ-03** If the user has already installed the app (detected via `display-mode: standalone` media query), no prompt is shown.
4. **REQ-04** If the user has previously dismissed the prompt, it must not reappear in the same browser. Dismissal is persisted in `localStorage` under the key `pwa-install-dismissed`.

### Chrome / Android flow

5. **REQ-05** The app must capture the `beforeinstallprompt` event on `window` and hold it without showing the browser's default UI.
6. **REQ-06** At the trigger moment (REQ-02), show a bottom sheet with: app icon, app name ("Sider"), a one-line description, an "Installer" primary button, and a dismiss link ("Ikke nå").
7. **REQ-07** Tapping "Installer" calls `prompt()` on the deferred event, waits for the user's response, and closes the sheet regardless of outcome.
8. **REQ-08** If the browser does not fire `beforeinstallprompt` by the trigger moment (e.g. already installed, unsupported browser), the bottom sheet is silently skipped.

### iOS Safari flow

9. **REQ-09** Detect iOS Safari by checking for: `navigator.standalone === false` (the property exists on iOS) **and** a Safari-style user agent (`/iPhone|iPad|iPod/` + absence of `CriOS`/`FxiOS`).
10. **REQ-10** At the trigger moment (REQ-02), show a bottom sheet with manual instructions: "Trykk på Del-knappen (⬆), deretter «Legg til på hjemmskjerm» (⊞)." Include a small illustrated diagram of the Share icon and menu item.
11. **REQ-11** The iOS sheet must include a dismiss button ("Forstått") that persists dismissal identically to REQ-04.

### PWA technical requirements (installability criteria)

12. **REQ-12** The app must have a `manifest.webmanifest` with: `name`, `short_name`, `start_url`, `display: "standalone"`, `background_color`, `theme_color`, and at minimum a 192×192 and a 512×512 icon.
13. **REQ-13** The service worker (managed by `vite-plugin-pwa`) must be registered and must serve a fetch handler so the browser considers the app installable.
14. **REQ-14** The app must be served over HTTPS (Cloudflare Pages provides this automatically).

---

## Component design

### `InstallPrompt.svelte`

A single component handles both flows. Props:

```typescript
// No external props — component reads its own context from window/navigator
```

Internal state:
- `deferredPrompt: BeforeInstallPromptEvent | null` — captured from `window`
- `show: boolean` — controls sheet visibility
- `platform: 'chromium' | 'ios' | 'unsupported'`

The component is mounted once in `+layout.svelte` and subscribes to a Svelte store (`src/lib/stores/installPrompt.ts`) that receives a trigger signal when the first cider is saved.

### `src/lib/stores/installPrompt.ts`

Exports a writable store `triggerInstallPrompt`. The cider-save handler calls `triggerInstallPrompt.set(true)` after successfully writing to IndexedDB, but only if:
- The `pwa-install-dismissed` key is absent from `localStorage`
- The app is not already running in `standalone` mode

---

## Affected files / components

- `src/lib/components/InstallPrompt.svelte` — new component (bottom sheet, both flows)
- `src/lib/stores/installPrompt.ts` — new store; triggers the prompt after first save
- `src/routes/+layout.svelte` — mount `<InstallPrompt />` once at app shell level
- `src/routes/new/+page.svelte` — call `triggerInstallPrompt.set(true)` after first successful save
- `static/manifest.webmanifest` — must meet REQ-12
- `static/icons/` — 192×192 and 512×512 PNG icons required
- `vite.config.ts` — configure `vite-plugin-pwa` with manifest and workbox options
- `messages/nb.json`, `messages/nn.json` — install prompt strings

---

## Localisation strings (Bokmål defaults)

| Key | Value |
|-----|-------|
| `install.title` | Legg til Sider på hjemmskjermen |
| `install.description` | Få rask tilgang og bruk appen uten internett |
| `install.cta` | Installer |
| `install.dismiss` | Ikke nå |
| `install.ios.instruction` | Trykk på Del-knappen (⬆), deretter «Legg til på hjemmskjerm» (⊞) |
| `install.ios.dismiss` | Forstått |

---

## Acceptance criteria

- [ ] **AC-01** (REQ-01, REQ-02) Opening the app for the first time shows no install prompt. Saving the first cider triggers the prompt.
- [ ] **AC-02** (REQ-03) Opening the app in standalone mode (already installed) shows no prompt at any point.
- [ ] **AC-03** (REQ-04) Dismissing the prompt on Chrome and reloading the app: prompt does not reappear. `localStorage` key `pwa-install-dismissed` is set to `"true"`.
- [ ] **AC-04** (REQ-06, REQ-07) On Chrome/Android: bottom sheet appears with correct copy, tapping "Installer" triggers the native browser prompt, sheet closes afterwards.
- [ ] **AC-05** (REQ-08) On Firefox or an unsupported browser where `beforeinstallprompt` never fires: no sheet appears, no errors in console.
- [ ] **AC-06** (REQ-09, REQ-10, REQ-11) On iOS Safari: bottom sheet appears with Share icon instructions, tapping "Forstått" closes it and sets dismissal flag.
- [ ] **AC-07** (REQ-12) Lighthouse PWA audit passes installability checks (manifest, icons, HTTPS).
- [ ] **AC-08** (REQ-13) Service worker is registered and active; app loads correctly after network is disabled following first visit.
- [ ] **AC-09** All prompt strings are localised; no hardcoded Norwegian in component templates.

---

## Open questions

- [ ] Should the install prompt reappear after a long time has passed (e.g. 30 days) even if previously dismissed? Reasonable for a v2 improvement; for v1, permanent dismissal is simpler and less annoying.
- [ ] Icon design: who supplies the 192×192 and 512×512 icons? These are required before the app can be submitted to any PWA directory or pass a Lighthouse audit.
