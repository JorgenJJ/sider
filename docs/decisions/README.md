# Architecture Decision Records

This folder documents significant technical decisions made for Sider. Each record explains the problem, the options considered, and why a particular choice was made.

Use ADRs when a decision is hard to reverse, involves real trade-offs, or would otherwise leave future developers (or agents) wondering "why did they do it this way?"

## Index

| # | Title | Status |
|---|-------|--------|
| [001](./001-tech-stack.md) | Tech stack: SvelteKit + Cloudflare Pages | Accepted |
| [002](./002-offline-storage.md) | Offline storage: IndexedDB via `idb` | Accepted |

## How to add a new ADR

1. Copy the template below into a new file named `NNN-short-title.md`.
2. Fill in the context, options, and decision.
3. Add a row to the index table above.

### Template

```markdown
# ADR-NNN — [Short title]

> **Status:** Draft | Accepted | Superseded by ADR-XXX
> **Date:** YYYY-MM-DD
> **Deciders:** [names]

## Context

[Why is this decision needed?]

## Options considered

### Option A — [Name]
[Description and trade-offs]

### Option B — [Name] ✅ Chosen
[Description and trade-offs]

## Decision

[What was decided and why.]

## Consequences

[What does this mean going forward? What becomes easier or harder?]
```
