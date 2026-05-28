# Known Bugs & Issues

One Markdown file per bug. Name files descriptively, e.g. `001-inapp-browser-data-isolation.md`.

Agents: when you discover a bug or potential issue during implementation, create a file here before continuing. Reference it from the relevant spec or ADR.

## Index

| File | Summary | Severity | Status |
|------|---------|----------|--------|
| [001-inapp-browser-data-isolation.md](./001-inapp-browser-data-isolation.md) | Data logged in an in-app browser is invisible in the user's main browser | High | Open — mitigated by detection banner |
| [002-orphan-i18n-keys.md](./002-orphan-i18n-keys.md) | i18n keys without a matching schema key (earth/oak/spicy/long/clear) | Low | Fixed |
| [003-pwa-manifest-not-linked.md](./003-pwa-manifest-not-linked.md) | Web App Manifest ble bygget men aldri lenket fra HTML — appen kunne ikke installeres | High | Fixed |
| [004-android-pwa-bottom-nav-clipped.md](./004-android-pwa-bottom-nav-clipped.md) | Bunnavigasjonen skjules bak Android-gestpillen i PWA standalone | High | Fixed |

## Severity guide

| Label | Meaning |
|-------|---------|
| **Critical** | Data loss or security issue; blocks release |
| **High** | Significant UX breakage; needs a workaround or fix before release |
| **Medium** | Noticeable problem with a workaround available |
| **Low** | Minor annoyance; address when convenient |

## Bug file template

```markdown
# Bug: [Short title]

> **Severity:** Critical | High | Medium | Low
> **Status:** Open | Mitigated | Fixed
> **Discovered:** YYYY-MM-DD
> **Affected area:** [Component / feature]

## Description

[What happens and under what conditions.]

## Steps to reproduce

1. …
2. …

## Expected behaviour

[What should happen.]

## Actual behaviour

[What actually happens.]

## Mitigation / fix

[Current workaround or proposed fix. Link to relevant spec/ADR if applicable.]
```
