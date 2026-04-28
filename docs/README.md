# Docs

Single source of truth for project knowledge. **Agents: always start here before reading source files.**

## Quick orientation

| Document | What it tells you |
|----------|------------------|
| [architecture.md](./architecture.md) | Tech stack, data model, feature breakdown, deployment pipeline, open questions |
| [decisions/](./decisions/README.md) | Why key technical choices were made (ADRs) |
| [specs/](./specs/) | Requirement specs for planned and in-progress features |
| [bugs/](./bugs/README.md) | Known bugs and issues with severity and status |

## Structure

```
docs/
├── README.md              ← you are here
├── architecture.md        ← implementation plan, always keep current
├── decisions/
│   ├── README.md          ← ADR index + template
│   ├── 001-tech-stack.md
│   └── 002-offline-storage.md
├── specs/
│   ├── TEMPLATE.md        ← copy this for new features
│   └── initial-release.md
└── bugs/
    ├── README.md          ← bug index + template
    └── 001-inapp-browser-data-isolation.md
```

## Conventions

- **Architecture changes** → update `architecture.md` and add an ADR in `decisions/`.
- **New features** → copy `specs/TEMPLATE.md`, fill in requirements and acceptance criteria, set Status to `Ready for implementation` when ready for an agent to act on.
- **Bugs found during implementation** → create a file in `bugs/` before continuing. Reference it from the relevant spec or ADR.
- **Completed work** → update the spec's Status field and mark relevant bugs as Fixed.

## For agents

Before starting any implementation task:
1. Read `architecture.md` for the full picture.
2. Read the relevant spec in `specs/`.
3. Check `bugs/README.md` for known issues in your area.
4. Update spec Status to `In progress` when you begin.
5. Document any new bugs or issues you find in `bugs/` as you go.
6. Update spec Status to `Done` and close resolved bugs when work is complete.
