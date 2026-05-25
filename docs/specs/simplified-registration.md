# Spec: Forenklet sider-registrering

> **Status:** Done (sansemodellen utvidet av [flavor-wheel-aromas](./flavor-wheel-aromas.md))
> **Author:** Jørgen + Claude
> **Created:** 2026-05-19
> **Last updated:** 2026-05-25

---

> **Oppdatering 2026-05-25:** Sansemodellen i denne spec-en (chips for utseende/lukt/smak)
> er utvidet til en smakshjul-basert modell — se [flavor-wheel-aromas](./flavor-wheel-aromas.md)
> og [ADR-006](../decisions/006-tasting-wheel-sensory-model.md). Spesielt er **REQ-01** (alt på
> én skjerm uten skroll) relaksert til «kompakt med minimal skroll», og REQ-04s flate
> chip-akser er erstattet av Farge/Klarhet/Struktur + grupperte aromaer.

## Overview

Den opprinnelige `/new`-skjemaet (jf. [initial-release](./initial-release.md) §5.1 og [notes-and-suggestions](./notes-and-suggestions.md)) krevde scrolling på telefon og hadde en `style`-dropdown som blandet uavhengige akser (en sider kan være både «Tørr» og «Stille» samtidig). Denne spec-en erstatter logge-flyten med en enkelt mobilskjerm-flate som baserer seg på chip-valg, og splitter «stil» i tre uavhengige akser: sødme, kullsyre og type.

## Goals

- Registreringen skal få plass på én iPhone-skjerm uten skroll (på iPhone 13/14-størrelse og oppover).
- Brukeren skal kun trenge å skrive navn og produsent + noen få chip-trykk for å lagre.
- Kategorier som tidligere var blandet (sødme vs. kullsyre vs. type) skal være ortogonale.
- Smak/lukt/utseende velges fra et lite, vanlig sett — ikke pretensiøst, men dekkende.
- Fritekst skal være tilgjengelig, men bak ett trykk (`Mer info`).

## Non-goals

- Fjerne mulighet for fri-tekst helt.
- En kuratert global liste over cider-produkter.
- Suggestion-chips bygget fra tidligere notater (fjernet — chip-valgene erstatter denne funksjonen).

## Functional requirements

1. **REQ-01** Skjemaet på `/new` skal være ferdig synlig på en iPhone 13 (390×844) uten å måtte scrolle, så lenge `Mer info` er kollapset.
2. **REQ-02** Bare `name` og `producer` er obligatoriske. Alt annet er valgfritt.
3. **REQ-03** Skjemaet skal ha tre uavhengige enkeltvalg-akser:
   - **Sødme**: Tørr / Halvtørr / Halvsøt / Søt
   - **Kullsyre**: Stille / Musserende
   - **Type**: Eplesider / Pæresider / Iscider / Rosé / Annet (default: Eplesider, ligger i `Mer info`)
4. **REQ-04** Skjemaet skal ha tre flervalg-akser for sanseinntrykk:
   - **Utseende**: lys gul, gylden, rav, rosa, uklar
   - **Lukt**: eple, pære, sitrus, blomster, krydder, gjær
   - **Smak**: frisk, fruktig, syrlig, bitter, tannin, funky
5. **REQ-05** `Mer info` skal kollapse Type, årgang, ABV og en valgfri fritekstboks (`comment`). Panelet skal være kollapset ved første åpning av skjemaet, men automatisk åpent i redigering hvis ett av feltene har innhold.
6. **REQ-06** Lagring av en sider skal navigere tilbake til oversikten. Validering på obligatoriske felt skal vises inline.
7. **REQ-07** Redigeringsvisningen på `/cider/[id]` skal bruke samme UI som `/new`.
8. **REQ-08** Eksisterende sider med v1-felter (`style`, `notes: CiderNotes`) skal være lesbare i detaljvisningen, men kan ikke skrives tilbake i samme form — neste lagring skriver med de nye feltene.

## Technical constraints

- Ingen nye runtime-avhengigheter (kun `idb`, allerede i bruk).
- All UI-tekst gjennom `$lib/i18n` — ingen hardkoded norsk i komponenttemplates.
- IndexedDB-skjemaet bumper fra v1 → v2 additivt (ingen destruktiv migrering). Gamle felter beholdes på eksisterende poster.

## Data model

Nye felter på `Cider` (alle valgfrie):

```ts
sweetness?: 'dry' | 'semidry' | 'semisweet' | 'sweet';
carbonation?: 'still' | 'sparkling';
type?: 'apple' | 'pear' | 'ice' | 'rose' | 'other';
appearance?: AppearanceKey[];
aroma?: AromaKey[];
flavor?: FlavorKey[];
comment?: string;
```

Beholdt for bakoverkompatibel lesing:

```ts
style?: string;          // gammel kombinert akse
notes?: CiderNotes;      // gammel per-kategori notatobjekt
```

Komplette nøkkellister bor i `src/lib/db/schema.ts` (`SWEETNESS_KEYS`, `APPEARANCE_KEYS` osv.) og brukes både til UI og til typing av lagrede poster.

## Affected files / components

- `src/lib/db/schema.ts` — nye felter på `Cider`, nye type-aliaser, DB v2-upgrade.
- `src/lib/components/ChipGroup.svelte` — ny gjenbrukbar enkelt-/flervalg-chip-gruppe.
- `src/lib/components/NoteField.svelte` — **fjernet** (erstattet av chips + fritekst-boks).
- `src/lib/suggestions.ts` — **fjernet** (suggestion-funksjonalitet ikke lenger relevant).
- `src/routes/new/+page.svelte` — fullstendig redesign til chip-basert skjema.
- `src/routes/cider/[id]/+page.svelte` — samme chip-baserte redigering + visning av legacy-data.
- `src/routes/+page.svelte` — kortets `meta` og `notePreview` leser nye felter med fallback til gamle.
- `messages/nb.json`, `messages/nn.json` — nye chip-etiketter, fjernet ubrukte `notes.*`/`hint.*`/`suggestions.label`-nøkler.

## Acceptance criteria

- [x] **AC-01** (REQ-01) Innhold i `.app-main` på `/new` er ≤ tilgjengelig høyde (viewport − bunnav) på iPhone 13 (måles til 780×780 med Playwright).
- [x] **AC-02** (REQ-02) Submit uten utfylt navn eller produsent viser inline feilmelding og lagrer ikke.
- [x] **AC-03** (REQ-03, REQ-04) Sødme, kullsyre og type opptrer som tre uavhengige enkeltvalg; utseende, lukt og smak er flervalg.
- [x] **AC-04** (REQ-05) Type, årgang, ABV og fritekst er skjult bak `Mer info`-knappen ved første åpning av `/new`.
- [x] **AC-05** (REQ-07) `/cider/[id]` i redigering bruker samme ChipGroup-komponenter som `/new`.
- [x] **AC-06** (REQ-08) Eksisterende v1-poster vises med `style` og `notes`-kategorier i detaljvisningen; redigering migrerer poster til de nye feltene ved neste lagring.

## Open questions / future

- Skal sensory chip-knapper kunne legges til av brukeren selv (egne ord)? Vurderes hvis brukere etterspør det. Foreløpig dekker `comment`-feltet det behovet.
- Tannin og funky er litt mer «niche» i smaks-chipsene — kan byttes ut hvis bruksdata viser at de aldri velges.
- Skal `Lys gul / Gylden / Rav` representeres med fargeprøver i tillegg til tekst? Visuelt fint, men krever ekstra design-arbeid.
