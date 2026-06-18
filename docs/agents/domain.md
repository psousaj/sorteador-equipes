# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`AGENTS.md`** at the repo root — contains project context, stack, conventions
- **`CONTEXT.md`** or **`CONTEXT-MAP.md`** at the repo root if they exist — build a shared domain language

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront.

## File structure

Single-context repo (single app):

```
/
├── AGENTS.md
├── CONTEXT.md
├── docs/agents/         ← this folder
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept, use the term as defined in `CONTEXT.md`. Don't drift to synonyms.

## Flag ADR conflicts

If your output contradicts an existing ADR (in `docs/adr/`), surface it explicitly rather than silently overriding.
