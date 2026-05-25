# ADR-006 — Tasting-wheel sensory model

> **Status:** Accepted
> **Date:** 2026-05-25
> **Deciders:** Jørgen, Claude

## Context

Den opprinnelige sansemodellen ([ADR-003](./003-notes-structure.md), [simplified-registration](../specs/simplified-registration.md)) var bevisst minimal: 6 flate lukt-chips, 6 smak-chips og ett `appearance`-felt som blandet farge og klarhet. Brukeren har et fysisk **siderhjul** og ønsket at appen skulle bruke hjulets aromaer som inspirasjon, og at hurtigregistreringen skulle bygge på hjulets **HURTIGANALYSE** (Karbonisering, Farge, Klarhet, Struktur, Alkohol, Sødme).

Spørsmålet: hvor tro mot hjulet skal modellen være, gitt at den forrige spec-en hadde et hardt krav (REQ-01) om at hele skjemaet skal få plass på én telefonskjerm uten skroll?

## Options considered

### Option A — Kuratert flat liste
Utvid de eksisterende flate lukt-chipsene til ~12–16 hjul-inspirerte ord. Minimal endring, beholder no-scroll, men gjengir ikke hjulets struktur.

### Option B — Gruppert sansemodell etter hjulet ✅ Chosen
Innfør hjulets struktur: grupperte aromaer (kollapsbare), del `appearance` i Farge + Klarhet, legg til Struktur, utvid Karbonisering til fire nivåer, og en valgfri Avvik-gruppe. Mer tro mot hjulet og mer nyttig for smaking; krever mer UI og relakserer no-scroll-kravet.

### Option C — Full taksonomi
Alle ~60 begrep som grupperte chips i egen seksjon. Mest komplett, men tungt på mobil og bryter appens minimalistiske profil.

## Decision

Vi valgte **Option B** (avklart med bruker). Sansefeltene modelleres etter det fysiske smakshjulet:

- **HURTIGANALYSE-akser** i hurtigregistreringen: `carbonation` (4 nivåer), `color`, `clarity`, `structure`, `sweetness` + `abv`.
- **Aroma** velges fra en gruppert velger (`AromaPicker`) med hjulets seksjoner; ~44 kuraterte aromaer som «inspirasjon» (ikke alle 60).
- **Avvik** (`faults`) som valgfritt flervalg bak `Mer info`.
- IndexedDB bumpes additivt **v2 → v3**; legacy `appearance`/`flavor`/`style`/`notes` og `carbonation: 'still'` forblir lesbare og migreres ved neste lagring.

Det harde no-scroll-kravet (REQ-01 i simplified-registration) **relakseres** til «kompakt med minimal skroll»: enkeltvalg legges to-i-rad, aromagrupper er kollapset som standard, og Avvik/Type/Årgang/ABV/Notat ligger bak `Mer info`.

## Consequences

- Registreringen blir rikere og mer i tråd med hvordan sider faktisk vurderes, og matcher det fysiske verktøyet brukeren har ved siden av appen.
- Skjemaet er ikke lenger garantert skrollfritt på én skjerm; den minimalistiske ambisjonen ivaretas ved kollaps og to-i-rad-layout.
- Schema-kompleksiteten øker (flere nøkkellister + grupper), men forblir hardkodet i `schema.ts` uten nye avhengigheter.
- Eldre poster må håndteres med fallback ved visning og prefill — implementert via hjelpefunksjoner (`normalizeCarbonation`, `colorFromAppearance`, `clarityFromAppearance`).
- Avløser deler av [ADR-003](./003-notes-structure.md) og utvider [simplified-registration](../specs/simplified-registration.md); detaljene står i [flavor-wheel-aromas](../specs/flavor-wheel-aromas.md).
