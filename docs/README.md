# Docs

This folder is the single source of truth for project knowledge. Agents should always start here before reading individual source files.

## Structure

| Path | Purpose |
|------|---------|
| `docs/specs/` | Requirement specs for planned or in-progress features |
| `docs/bugs/` | Known bugs and issues (add one file per bug) |
| `docs/decisions/` | Architecture / design decisions (ADRs) |

## Conventions

- **Specs** follow `docs/specs/TEMPLATE.md`. Give each spec its own file, e.g. `docs/specs/user-auth.md`.
- **Bugs** can be plain markdown files named after the issue, e.g. `docs/bugs/login-redirect-loop.md`.
- Keep docs up to date as the codebase evolves — an outdated doc is worse than no doc.

## For agents

When starting work on a spec:
1. Read the relevant spec file under `docs/specs/`.
2. Check `docs/bugs/` for any known issues that might affect your work.
3. Update the spec's `Status` field as you progress.
4. If you discover new bugs or issues during implementation, document them in `docs/bugs/`.
