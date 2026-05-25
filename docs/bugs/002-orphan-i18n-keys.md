# Bug: Foreldede/ubrukte i18n-nøkler vs. schema-nøkler

> **Severity:** Low
> **Status:** Fixed
> **Discovered:** 2026-05-25
> **Affected area:** `messages/nb.json`, `messages/nn.json`, `src/lib/db/schema.ts`

## Description

Under arbeidet med [flavor-wheel-aromas](../specs/flavor-wheel-aromas.md) ble det oppdaget at i18n-filene inneholdt nøkler som ikke fantes i de tilsvarende `*_KEYS`-listene i `schema.ts`, og dermed aldri ble vist:

- `aroma.earth`, `aroma.oak` — ikke i (gamle) `AROMA_KEYS`.
- `flavor.spicy`, `flavor.long` — ikke i `FLAVOR_KEYS`.
- `appearance.clear` — ikke i `APPEARANCE_KEYS` (klarhet ble representert med `hazy`).

Dette var ufarlig (ekstra nøkler skader ikke), men gjorde det uklart hvilke chips som faktisk var aktive, og økte risikoen for at en utvikler trodde en aroma var tilgjengelig når den ikke var det.

## Steps to reproduce

1. Sammenlign `AROMA_KEYS`/`FLAVOR_KEYS`/`APPEARANCE_KEYS` i `src/lib/db/schema.ts` med `aroma.*`/`flavor.*`/`appearance.*` i `messages/nb.json`.
2. Observér at flere i18n-nøkler ikke har en tilsvarende key i schema.

## Expected behaviour

Hver i18n-nøkkel for en chip-kategori bør tilsvare en aktiv key i `schema.ts` (eller være eksplisitt merket som legacy for lesing av eldre poster).

## Actual behaviour

Flere i18n-nøkler var foreldede og ble aldri brukt.

## Mitigation / fix

Ryddet opp som del av [flavor-wheel-aromas](../specs/flavor-wheel-aromas.md):

- Fjernet `flavor.spicy`, `flavor.long`, `appearance.clear`, og de gamle frittstående `aroma.earth`.
- `oak` gjenbrukes nå som en gyldig aroma i `barrel`-gruppen; `clear` er flyttet til riktig namespace som `clarity.clear`.
- Legacy-nøkler som fortsatt trengs for å vise eldre poster (`aroma.apple/floral/spice/yeast`, `flavor.*`, `appearance.*`, `carbonation.still`) beholdes bevisst og er kommentert som legacy.
