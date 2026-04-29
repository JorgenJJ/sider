# ADR-003 — Notes structure: per-category fields over single free text

> **Status:** Accepted  
> **Date:** 2026-04-28  
> **Deciders:** Jørgen

---

## Context

The initial data model had a single `notes?: string` field for free-text tasting observations. When a suggestion feature was introduced — surfacing past writing as chips when logging a new cider — the question of note structure became critical: suggestions drawn from a single undifferentiated blob of text would mix aroma observations with mouthfeel observations and produce low-quality, context-free chips.

## Options considered

### Option A — Single `notes: string` with word-level autocomplete

Keep the flat field; tokenise all past notes into a word/phrase vocabulary; offer completions as the user types.

**Problems:**
- "Fruktig" from an aroma note appears as a suggestion while describing mouthfeel.
- Short tokens (single words) aren't meaningful suggestions for tasting notes — users think in phrases and sentences.
- No structure to build on when ratings are added later.

**Rejected.**

### Option B — Per-category text fields ✅ Chosen

Split notes into five fields mirroring the standard tasting categories: Utseende, Aroma, Smak, Munnfølelse, Generelt. Suggestions for each field are sourced only from the same field in past entries.

**Benefits:**
- Suggestions are semantically scoped — aroma chips only appear when writing about aroma.
- The category structure guides less-experienced tasters naturally.
- The schema mirrors the same five categories that numeric ratings will eventually occupy; adding a `ratings` companion field later requires only a DB version bump, no restructuring.
- Sentence-level extraction (rather than word-level) produces readable, reusable chips.

**Drawback:** Slightly more form surface area than a single textarea. Mitigated by making all five fields optional and collapsible.

## Decision

**Per-category `CiderNotes` object** with five optional string fields. A single `notes: string` field is not used anywhere in the codebase. See [notes-and-suggestions spec](../specs/notes-and-suggestions.md) for the full UI and suggestion algorithm.

## Consequences

- The `NoteField` component becomes a reusable building block — the same component handles the form and edit view.
- When ratings are added, the five-category structure is already established; the rating control slots naturally alongside each note field.
- The suggestion extraction algorithm (`src/lib/suggestions.ts`) is scoped per category key, making it straightforward to extend (e.g. weight suggestions by rating score in a future release).
- Any import of data from external sources (e.g. a future curated cider database) must map to the same five-category structure or populate `generelt` as a fallback.
