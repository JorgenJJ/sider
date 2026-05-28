# Bug: Bunnavigasjonen klippes av Android-gestpillen i PWA standalone

> **Severity:** High
> **Status:** Fixed
> **Discovered:** 2026-05-28
> **Affected area:** `src/app.css`, `src/routes/+layout.svelte`, Android Chrome PWA standalone mode

## Description

Når Sider kjører som installert PWA på Android (Chrome standalone), blir bunnavigasjonen (`Oversikt / + / Innstillinger`) skjult bak systemets gestpille. Brukeren ser bare toppen av den grønne FAB-knappen som tittes opp i bunnen — selve nav-bakgrunnen og merkelappene er helt utenfor synlig område.

Roten er en kjent uoverensstemmelse i Android Chrome PWA standalone: `env(safe-area-inset-bottom)` rapporterer `0px` selv om systemets gestindikator overlegges appens viewport. CSS-en vår brukte denne verdien direkte (`padding-bottom: var(--safe-bottom)`), så ingen plass ble reservert under nav-en. iOS er upåvirket fordi Safari rapporterer `safe-area-inset-bottom: 34px` korrekt for home indicator.

## Steps to reproduce

1. Installer Sider på en Android-telefon med gestnavigering (Pixel/Samsung One UI med gestmodus).
2. Åpne appen fra hjemmskjermen.
3. Observér at bunnavigasjonen ikke vises — bare toppen av «+»-FAB-en tittes opp over systemets gestpille.

## Expected behaviour

Bunnavigasjonen skal være fullt synlig over gestpillen, med nok klaring til at «sveip-opp»-gesten ikke aktiverer nav-knappene ved et uhell.

## Actual behaviour

Hele nav-bakgrunnen og merkelappene er skjult under gestpilleområdet. Kun den hevede FAB-en (`margin-top: -8px`) titter så vidt opp.

## Mitigation / fix

I `src/app.css` overstyres `--safe-bottom` for PWA standalone-modus til en garantert minsteverdi:

```css
@media (display-mode: standalone) {
	:root {
		--safe-bottom: max(env(safe-area-inset-bottom, 0px), 16px);
	}
}
```

- På iOS i standalone gir `max(34px, 16px) = 34px` — ingen endring.
- På Android Chrome PWA standalone gir `max(0px, 16px) = 16px` — nok klaring for gestpillen.
- Utenfor standalone-modus (vanlig nettleserfane) brukes fortsatt rå `env()`-verdien, så vi legger ikke til luft i bunnen for desktop-/nettleserbrukere som ikke trenger den.

Mediaspørringen `(display-mode: standalone)` matcher både Chrome PWA, Edge PWA, iOS hjemmskjerm-installasjon og Safaris `display-mode`-emulering, så vi treffer alle de relevante kontekstene.
