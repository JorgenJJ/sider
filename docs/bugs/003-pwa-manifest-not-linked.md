# Bug: Web App Manifest ble ikke lenket fra HTML

> **Severity:** High
> **Status:** Fixed
> **Discovered:** 2026-05-28
> **Affected area:** `src/app.html`, `vite.config.ts`, `vite-plugin-pwa` + SvelteKit integration

## Description

Applikasjonen var konfigurert som PWA via `vite-plugin-pwa` ([architecture §7](../architecture.md), [pwa-install-prompt spec](../specs/pwa-install-prompt.md)), men nettleseren oppdaget den aldri som installerbar. Dermed avfyrte ikke Chromium-baserte nettlesere `beforeinstallprompt`-hendelsen, og `InstallPrompt`-arket i §5.6 dukket aldri opp på Android/desktop.

Roten var en stille integrasjonsbrist mellom `vite-plugin-pwa` og SvelteKit: pluginen genererer `manifest.webmanifest` korrekt og hekter normalt inn en `<link rel="manifest">` via en `transformIndexHtml`-hook, men SvelteKit prosesserer `src/app.html` på en måte som ikke kjører hookene fra andre Vite-plugins for slutt-HTMLen. Resultatet er at manifest-fila finnes i `build/`, men `index.html` lenker den aldri.

Service-worker-registreringen ble derimot lagt på av SvelteKit selv (auto-registrering av `src/service-worker.ts`), så SW-en lastet inn og precachet 34 entries — appen fungerte offline, men kunne ikke installeres.

## Steps to reproduce

1. `npm run build`
2. `grep manifest build/index.html` — ingen treff.
3. Server `build/` over HTTPS og åpne i Chrome på Android. «Installer app»-knappen i adresselinja eller den programatiske install-bottom-sheet-en dukker aldri opp.

## Expected behaviour

`build/index.html` skal inneholde `<link rel="manifest" href="/manifest.webmanifest" />` slik at nettleseren leser manifestet og merker appen som installerbar (oppfyller [REQ-12](../specs/pwa-install-prompt.md) og [AC-07](../specs/pwa-install-prompt.md)).

## Actual behaviour

`build/index.html` manglet både `<link rel="manifest">` og `<script src="/registerSW.js">`. `registerSW.js` ble generert, men aldri lastet. Manifest-fila ble heller ikke precachet av SW-en fordi `.webmanifest` ikke matchet `globPatterns`.

## Mitigation / fix

1. La til `<link rel="manifest" href="/manifest.webmanifest" />` direkte i `src/app.html` (siden Vite-pluginens auto-injeksjon ikke når gjennom SvelteKit).
2. La `webmanifest` til `injectManifest.globPatterns` i `vite.config.ts` så SW-en precacher manifestet og install-prompten fungerer ved offline-start.
3. Satte `lang: 'nb'` og `id: '/'` på manifestet — `vite-plugin-pwa` defaultet til `lang: 'en'`, og en eksplisitt `id` gjør at oppdateringer av `start_url` senere ikke skaper en «ny» PWA-identitet.

SW-registrering håndteres fortsatt av SvelteKits innebygde mekanisme (auto-registrerer `src/service-worker.ts`); `vite-plugin-pwa`s `registerSW.js` produseres som artefakt men brukes ikke. Det er en mulig opprydning å sette `injectRegister: false` for å slippe den ubrukte fila, men den er harmløs i dag.
