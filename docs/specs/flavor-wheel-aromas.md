# Spec: Smakshjul-inspirerte aromaer og hurtiganalyse-registrering

> **Status:** Done
> **Author:** Jørgen + Claude
> **Created:** 2026-05-25
> **Last updated:** 2026-05-25

---

## Overview

Sider hadde en bevisst minimal sansemodell: 6 flate lukt-chips, 6 smak-chips og et `appearance`-felt som blandet farge og klarhet ([simplified-registration](./simplified-registration.md)). Brukeren har et fysisk **siderhjul** (cider tasting wheel) og ønsket at appen skulle (1) bruke hjulets aromaer som inspirasjon til de ferdiglagde aromaene, og (2) la hurtigregistreringen bygge på hjulets **HURTIGANALYSE**. Denne spec-en bringer datamodellen og `/new`-skjemaet nærmere det fysiske hjulet.

## Goals

- Aromaene (Lukt) skal være **grupperte** etter hjulets seksjoner, ikke en flat liste.
- Hurtigregistreringen skal speile hjulets HURTIGANALYSE-akser: **Karbonisering, Farge, Klarhet, Struktur, Sødme** (+ ABV som alkohol-indikator).
- En valgfri **Avvik**-gruppe (off-aromaer) skal være tilgjengelig bak `Mer info`.
- Eksisterende poster skal forbli lesbare; ingen destruktiv migrering.

## Non-goals

- Gjengi alle ~60 begrepene på hjulet ordrett — vi bruker et kuratert, representativt utvalg (~44 aromaer) som «inspirasjon».
- Beskrivende alkohol-akse (mild/balansert/markant) — vi beholder ABV-tallfeltet.
- Brukerdefinerte egne aromaer (fortsatt dekket av `comment`-feltet).

## Background & context

Siderhjulets struktur (lest fra brukerens bilde):

- **AROMA FRA EPLER** — modne epler, unge epler
- **AROMA FRA GJÆR** — kort gjæring, lengre gjæring, fat
- **FRUKT OG TILSETNING** — planter og krydder, frukt og bær
- **Avvik** — våt papp, fuktig kjeller, råtten frukt, muggen, eddik, aceton, svovel
- **HURTIGANALYSE** (i glasset): Karbonisering (flat/kremet/perlende/musserende) · Farge · Klarhet (klar/skyet/uklar) · Struktur (skarp/syrlig/rund/fyldig) · Alkohol (mild/balansert/markant) · Sødme (tørr/medium/søt)

Designvalg er logget i [ADR-006](../decisions/006-tasting-wheel-sensory-model.md).

## Functional requirements

1. **REQ-01** `carbonation` skal ha fire nivåer: `flat`, `creamy`, `pearling`, `sparkling`. Lagret legacy-verdi `still` vises/prefilles som `flat`.
2. **REQ-02** Nytt enkeltvalg **Farge** (`color`): lys gul, gylden, rav, rosa.
3. **REQ-03** Nytt enkeltvalg **Klarhet** (`clarity`): klar, skyet, uklar.
4. **REQ-04** Nytt flervalg **Struktur** (`structure`): skarp, syrlig, rund, fyldig.
5. **REQ-05** Lukt (`aroma`) velges fra en **gruppert** velger (`AromaPicker`) med hjulets grupper: Epler, Frukt, Bær, Blomster & planter, Krydder, Gjær & bakst, Fat. Grupper er kollapset som standard.
6. **REQ-06** Valgfritt flervalg **Avvik** (`faults`) ligger bak `Mer info`.
7. **REQ-07** `/new` og redigering på `/cider/[id]` skal bruke samme UI.
8. **REQ-08** Eldre poster (`appearance`, `flavor`, `style`, `notes`, `carbonation: 'still'`) skal være lesbare. Ved redigering prefilles `color`/`clarity` fra legacy `appearance`, og posten migreres til de nye feltene ved lagring (legacy `appearance`/`flavor` fjernes da fra posten).

## Technical constraints

- Ingen nye runtime-avhengigheter (kun `idb`).
- All UI-tekst via `$lib/i18n` (nb + nn) — ingen hardkodet tekst i komponenter.
- IndexedDB bumpes additivt v2 → v3 (ingen destruktiv migrering).
- **REQ-01 fra [simplified-registration](./simplified-registration.md) (alt på én skjerm uten skroll) relakseres** til «kompakt med minimal skroll»: enkeltvalg legges to-i-rad, aromagruppene er kollapset, og Avvik/Type/Årgang/ABV/Notat ligger bak `Mer info`.

## Data model

Nye/endrede felt på `Cider` (alle valgfrie):

```ts
carbonation?: 'flat' | 'creamy' | 'pearling' | 'sparkling'; // var: 'still' | 'sparkling'
color?: 'lightyellow' | 'golden' | 'amber' | 'pink';
clarity?: 'clear' | 'cloudy' | 'hazy';
aroma?: AromaKey[];        // nytt, gruppert nøkkel-univers (AROMA_GROUPS)
structure?: StructureKey[];
faults?: FaultKey[];
```

Beholdt for bakoverkompatibel lesing: `appearance?: AppearanceKey[]`, `flavor?: FlavorKey[]`, `style?`, `notes?`.

Hjelpere i `src/lib/db/schema.ts`: `normalizeCarbonation`, `colorFromAppearance`, `clarityFromAppearance`. Komplette nøkkellister og `AROMA_GROUPS` bor også i `schema.ts`.

## Affected files / components

- `src/lib/db/schema.ts` — nye typer/nøkler, `AROMA_GROUPS`, utvidet `CarbonationKey`, nye `Cider`-felt, DB v3, legacy-hjelpere.
- `src/lib/components/ChipGroup.svelte` — ny `showLabel`-prop.
- `src/lib/components/AromaPicker.svelte` — **ny** gruppert, kollapsbar velger (bygger på `ChipGroup`).
- `src/routes/new/+page.svelte` — nye akser + `AromaPicker` + avvik bak `Mer info`.
- `src/routes/cider/[id]/+page.svelte` — samme UI + visning av nye felt + legacy-fallback/prefill.
- `src/routes/+page.svelte` — `notePreview` leser `structure` med fallback til legacy `flavor`.
- `messages/nb.json`, `messages/nn.json` — nye etiketter; ryddet bort foreldede nøkler (se [bug 002](../bugs/002-orphan-i18n-keys.md)).

## Acceptance criteria

- [x] **AC-01** (REQ-01) Kullsyre viser fire chips; gammel post med `still` vises som «Stille» og prefilles som «Flat».
- [x] **AC-02** (REQ-02, REQ-03) Farge og Klarhet er egne enkeltvalg-akser.
- [x] **AC-03** (REQ-04) Struktur er et flervalg med skarp/syrlig/rund/fyldig.
- [x] **AC-04** (REQ-05) Lukt vises som kollapsbare aromagrupper; valg lagres som flat `aroma`-liste.
- [x] **AC-05** (REQ-06) Avvik er et flervalg bak `Mer info`.
- [x] **AC-06** (REQ-07) `/new` og `/cider/[id]`-redigering bruker samme komponenter.
- [x] **AC-07** (REQ-08) Eldre poster vises korrekt; redigering migrerer `appearance`→`color`/`clarity` og fjerner legacy-feltene ved lagring.
- [x] **AC-08** `npm run check` og `npm run build` er grønne.

> Merk: AC verifisert med type-sjekk + build + SSR-smoke-test. Interaktiv nettlesertest var ikke mulig i utviklingsmiljøet (ingen nettleser-binær tilgjengelig) — bør gjøres manuelt på mobil-viewport før release.

## Open questions / future

- Fargeprøver (visuelle swatches) på Farge-chipsene — fint, men utsatt (samme åpne spørsmål som i simplified-registration).
- Bør Struktur være enkeltvalg (spektrum) i stedet for flervalg? Vurderes ut fra bruk.
- Beskrivende alkohol-akse kan legges til senere hvis ønskelig.

## References

- [simplified-registration spec](./simplified-registration.md) (utvidet av denne)
- [ADR-006 — Tasting-wheel sensory model](../decisions/006-tasting-wheel-sensory-model.md)
- [Bug 002 — Orphan i18n keys](../bugs/002-orphan-i18n-keys.md)
