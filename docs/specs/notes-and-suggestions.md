# Spec: Per-category tasting notes with suggestions

> **Status:** Ready for implementation  
> **Author:** Jørgen  
> **Created:** 2026-04-28  
> **Last updated:** 2026-04-28

---

## Overview

When logging a cider, the user fills in tasting notes across five structured categories. As they write in each field, the app surfaces relevant phrases and sentences they have used in that same category on previous ciders. Suggestions are purely local — no network, no external model — built from the user's own IndexedDB history.

---

## Goals

- Make it faster to describe a cider by reusing language the user has already developed
- Keep suggestions unobtrusive: they should never interrupt the writing flow
- Scope suggestions tightly to category so "Aroma" suggestions don't bleed into "Munnfølelse"
- Keep the implementation fully offline with no additional heavy dependencies

## Non-goals

- Suggestions drawn from any external corpus or database
- NLP, semantic similarity, or ML-based suggestions
- Suggestions for the name, producer, or metadata fields (those use simple datalist autocomplete)
- Spell-checking or grammar assistance

---

## Functional requirements

1. **REQ-01** The notes form must present five separate text areas, one per category: Utseende, Aroma, Smak, Munnfølelse, Generelt. All fields are optional.
2. **REQ-02** Each category field must display a short hint describing what to observe (see §Hint text). The hint must be visually subordinate and must not occupy space when the field is focused.
3. **REQ-03** When a category field is focused, the app must fetch all non-empty values previously stored in that category from IndexedDB and present them as suggestions.
4. **REQ-04** Suggestions must be displayed as tappable chips below (or overlaying) the active field.
5. **REQ-05** Tapping a suggestion chip must append its text to the current field value. If the field is empty, the suggestion text is inserted directly. If the field already has content, insert a separator (`, `) before the suggestion text.
6. **REQ-06** Suggestions must be deduplicated and ranked by frequency of use across all past entries, descending.
7. **REQ-07** The suggestion list must be capped at **8 chips** to avoid visual clutter.
8. **REQ-08** If a category has fewer than 2 past entries, no suggestions are shown (not enough signal).
9. **REQ-09** Suggestions must update reactively if the user saves a new entry and returns to the form in the same session.

---

## Suggestion extraction algorithm

Suggestions are extracted at the **sentence level**, not word level. This preserves the user's natural phrasing and makes chips readable.

**Extraction steps (runs in `src/lib/suggestions.ts`):**

1. Fetch all `Cider` records from IndexedDB.
2. For the active category key (e.g. `aroma`), collect all non-empty `notes.aroma` strings.
3. Split each string on sentence boundaries: `.`, `!`, `,`, and newlines. Trim whitespace. Discard tokens under 3 characters.
4. Build a frequency map: `Map<string (lowercase), { original: string, count: number }>`. Preserve the original casing of the most-recently-seen instance.
5. Sort by `count` descending, then alphabetically for ties.
6. Return the top 8 entries as `SuggestionChip[]`.

This is intentionally simple — no stemming, no stop-word removal. The user's own phrasing is the feature, not a cleaned vocabulary.

---

## Hint text (per category)

Hints are rendered in the active locale. These are the default Norwegian Bokmål strings:

| Category | Key | Hint |
|----------|-----|------|
| Utseende | `hint.utseende` | Farge, klarhet, brus, skum |
| Aroma | `hint.aroma` | Frukt, blomst, jord, gjær, eddik |
| Smak | `hint.smak` | Sødme, syre, bitterhet, fruktkarakter, ettersmak |
| Munnfølelse | `hint.munnfølelse` | Kropp, karbonering, lengde |
| Generelt | `hint.generelt` | Generelle inntrykk, kontekst, anbefalinger |

---

## Data model note

The `CiderNotes` interface in `src/lib/db/schema.ts` maps directly to the five category keys:

```typescript
interface CiderNotes {
  utseende?: string;
  aroma?: string;
  smak?: string;
  munnfølelse?: string;
  generelt?: string;
}
```

An empty `CiderNotes` object (`{}`) is stored even when no notes are entered, to avoid null-checks throughout the codebase.

---

## Affected files / components

- `src/lib/db/schema.ts` — defines `CiderNotes` and `Cider`; `notes` field changes from `string` to `CiderNotes`
- `src/lib/suggestions.ts` — new module; exports `getSuggestions(category: keyof CiderNotes): Promise<SuggestionChip[]>`
- `src/lib/components/NoteField.svelte` — new component; wraps a `<textarea>` with hint text and suggestion chips
- `src/routes/new/+page.svelte` — uses five `<NoteField>` instances
- `src/routes/cider/[id]/+page.svelte` — same `<NoteField>` instances in edit mode
- `messages/nb.json`, `messages/nn.json` — add hint keys and chip UI strings

---

## Acceptance criteria

- [ ] **AC-01** (REQ-01) The log-a-cider form has exactly five note fields in the order: Utseende, Aroma, Smak, Munnfølelse, Generelt.
- [ ] **AC-02** (REQ-02) Each field shows hint text when empty and unfocused; hint collapses or fades when the field is focused.
- [ ] **AC-03** (REQ-03, REQ-08) No suggestion chips appear for a category with fewer than 2 past entries.
- [ ] **AC-04** (REQ-04, REQ-07) On focus, up to 8 chips appear; more than 8 are never shown.
- [ ] **AC-05** (REQ-05) Tapping a chip on an empty field sets the field value to the chip text. Tapping on a field with existing content appends `, <chip text>`.
- [ ] **AC-06** (REQ-06) Chips are ordered by frequency of use across all past entries; the most-used phrase appears first.
- [ ] **AC-07** (REQ-09) After saving a cider and tapping "Ny sidering", chips in the new form reflect the just-saved entry.
- [ ] **AC-08** All strings are localised; no hardcoded Norwegian in component templates.
- [ ] **AC-09** The feature works fully offline with no network requests.
- [ ] **AC-10** `getSuggestions` has unit tests covering: empty history, < 2 entries, deduplication, frequency ranking, 8-chip cap.

---

## Future expansion hooks

The `CiderRatings` interface is reserved in the schema but carries no data in v1. When ratings are introduced:

- A DB version bump populates `ratings` from user input.
- The `NoteField` component can optionally accept a `rating` prop — render the rating control inline with the note field for that category, keeping the UI cohesive.
- The suggestion algorithm can be extended to weight chips by the rating of the entry they came from (e.g. prefer phrases from highly-rated ciders).

The specific rating scale is not yet decided. See open question in [architecture.md §9](../architecture.md#9-open-questions).

---

## Open questions

- [ ] Should the suggestions panel be always-visible on focus, or only appear after the user pauses typing (debounced)? Always-on is simpler; debounced feels less intrusive.
- [ ] Should chips be dismissible per-session so a user can hide suggestions they find unhelpful?
