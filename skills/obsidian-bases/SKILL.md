---
name: obsidian-bases
description: "Creates and edits Obsidian .base files: table/cards/list/map views, filters, formulas and summaries over note properties. Includes migration from Dataview queries. Triggers: obsidian bases, .base file, database in obsidian, notes view, obsidian dashboard, migrate dataview."
argument-hint: "[create <description> | explain <file.base> | migrate <dataview query>]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Obsidian Bases - Native views

Bases is the Obsidian core plugin (1.9+) that turns note properties into live tables and cards. Nothing to install. Adapted from `kepano/obsidian-skills` to this repo's format.

Mode: `$ARGUMENTS`

The full syntax reference is in `references/bases-syntax.md`. Read it before writing a `.base`: half the errors are YAML quoting, not logic.

## Phase 1 - Check that Bases is available

Read the vault's `.obsidian/core-plugins.json`. If `bases` is not enabled, say so and offer the two ways out: enable it (it is core, nothing to install) or solve the view with a static markdown table. **Never write a `.base` in a vault that does not have it enabled:** it ends up as a file Obsidian shows raw.

## Phase 2 - Modes

### `create` - New view
1. Understand what question the view answers. A view without a concrete question ends up as a table of the whole vault that nobody looks at.
2. **Check that the properties exist**: `Grep` the vault's frontmatter for the fields you are going to filter on. Filtering by a property no note declares produces an empty view and looks like a Bases bug.
3. Write the `.base` in `Bases/`, with approval before creating the file.
4. Say that it has to be opened in Obsidian to confirm it renders: the syntax is validated there, not here.

### `explain` - Read an existing `.base`
Translate the file into plain language: which notes go in, which columns it shows, what each formula computes. Read-only.

### `migrate` - From Dataview
Translate the query, and **say explicitly what cannot be translated**. Bases does not cover inline fields (`field:: value` in the middle of the note), computed text or `dataviewjs`. If the query depends on those, the honest answer is that it stays in Dataview: a half-done migration leaves the user with a view that lies.

## Structure of a `.base`

```yaml
filters:
  and:
    - file.inFolder("03_Resources")
    - 'type == "atomic"'

formulas:
  age_days: '(now() - file.mtime).days'

properties:
  formula.age_days:
    displayName: "Days untouched"

views:
  - type: table
    name: "Atomic notes"
    filters:
      not:
        - file.hasTag("archived")
    order:
      - file.name
      - created
      - formula.age_days
    summaries:
      formula.age_days: Average
```

The five top-level blocks are `filters`, `formulas`, `properties`, `summaries` and `views`. Global filters apply to every view; each view can add its own.

## The three recurring mistakes

1. **YAML quoting.** Any expression with `:`, `{`, `}`, `[`, `]` goes in quotes. If the expression already has double quotes inside, the string goes in single quotes: `'if(done, "Yes", "No")'`.
2. **Durations.** Subtracting two dates gives a `Duration`, not a number: access the field before operating on it (`.days`, `.hours`). `round(now() - file.mtime)` fails; `(now() - file.mtime).days` works.
3. **Nulls.** A missing property breaks the formula. Wrap it in `if(property, ...)` when the field can be missing, which in a real vault is almost always.

A formula referenced in `order` that is not declared in `formulas` fails silently: the column simply does not appear.

## Rules

- `file.backlinks` is expensive: do not put it in a view that is opened often.
- Do not create a view that depends on a property the vault does not use yet: first add it to the frontmatter contract in `CLAUDE.md`.
- One `.base` per question. A file with eight views is a dashboard nobody reads.
- Ask for approval before writing or overwriting a `.base`.
- No long dashes.

## Handoff

Base READY when the file exists and the user confirmed it renders in Obsidian. If the view needed fields the notes do not have, the next step is to update the frontmatter contract with `/second-brain` and fill in the notes with `/vault-tidy frontmatter`.
