# Bug: In-app browser data isolation

> **Severity:** High  
> **Status:** Open — mitigated by detection banner  
> **Discovered:** 2026-04-28  
> **Affected area:** Storage / PWA (all routes)

## Description

IndexedDB storage is scoped to a browser origin **and** browser instance. When a user opens a Sider link inside an in-app browser (e.g. Facebook Messenger, Instagram, Snapchat), they are operating in an isolated storage context. Any ciders logged there will **not** appear when they later open the app in Safari or Chrome, and vice versa.

This is a fundamental browser security boundary, not a bug in Sider's code, but it is a significant user-facing data consistency issue given that Sider links are likely to be shared over messaging apps.

## Steps to reproduce

1. Open Sider in Safari and log a cider.
2. Share the Sider URL in a Messenger conversation.
3. Open the link from Messenger (opens in Messenger's in-app browser).
4. Navigate to the overview — the cider logged in step 1 is not visible.

## Expected behaviour

A user's logged ciders are available regardless of how they open the app.

## Actual behaviour

Data is siloed per browser instance. The in-app browser is effectively a separate "browser" with its own storage.

## Mitigation / fix

**Short-term (v1):** Detect in-app browsers via user-agent sniffing on app load. When detected, show a persistent dismissible banner:

> *"Du bruker en innebygd nettleser. Åpne Sider i Safari eller Chrome for å se og lagre sideringen din."*

Detection heuristics:
- `navigator.userAgent` includes `FBAN`, `FBAV` (Facebook), `Instagram`, `Snapchat`, `Line`, `WeChat`, `Twitter`
- iOS: absence of `Safari` in UA despite being WebKit
- Android: presence of `wv` (WebView) in UA

**Long-term:** A JSON export/import or optional cloud sync would permanently solve data scatter. See open question in [architecture.md §9](../architecture.md#9-open-questions).

## References

- [architecture.md §5.7](../architecture.md#57-in-app-browser-detection-req-01) — in-app browser detection feature
- [ADR-002](../decisions/002-offline-storage.md) — storage decision and data loss risk discussion
