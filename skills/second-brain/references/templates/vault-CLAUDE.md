# <VAULT NAME>

Obsidian vault used as a second brain. This file is the contract: Claude Code reads it at the start of every session and takes from here where everything goes. If a convention changes, it changes here first.

## Who I am

<Role, which projects I am in, which topics interest me. Two or three lines: it gives the syntheses context so they are not generic.>

## Paths

Paths contract: the skills write to **roles**, and this table says which folder each role is in this vault. If you move a folder, change it here and everything else keeps working. The skills find this table by its `## Paths` heading: do not rename it.

| Role | Path in this vault |
|---|---|
| `inbox` | `_inbox` |
| `daily` | `Reflect/Daily` |
| `weekly` | `Reflect/Weekly` |
| `monthly` | `Reflect/Monthly` |
| `atomic` | `03_Resources` |
| `hubs` | `Hubs` |
| `projects` | `01_Projects` |
| `areas` | `02_Areas` |
| `archive` | `04_Archive` |
| `templates` | `Templates` |

And three fixed files at the root: this `CLAUDE.md` (the contract), `hot.md` (the recent-context cache, rewritten by `/review-dump`) and `codebases.md` (the bridge to the repos, if there is code).

A role this vault does not use is marked `(unused)` instead of deleting the row: that way it is explicit that the absence was a decision.

The scripts receive this through a flag: `--role hubs=Hubs --role atomic=03_Resources`.

## Structure

| Folder | What lives here |
|---|---|
| `_inbox/` | Raw capture, one file per day (`YYYY-MM-DD dump.md`). No structure, no tags, no thinking. The suffix keeps the name from clashing with the daily's. |
| `Reflect/Daily/` | Synthesis of the day (`YYYY-MM-DD.md`), created by `/review-dump`. |
| `Reflect/Weekly/` | Weekly retrospective (`YYYY-Www.md`). |
| `Reflect/Monthly/` | Balance of the month (`YYYY-MM.md`). |
| `01_Projects/` | Something with a deadline or a defined outcome. When it closes, it goes to `04_Archive/`. |
| `02_Areas/` | Ongoing responsibility with no end date (health, finances, a role). |
| `03_Resources/` | Atomic notes: one idea per note, flat, no subfolders. |
| `04_Archive/` | Closed. Nothing is ever deleted, it is archived. |
| `Hubs/` | One note per entity that matters: person, tool, concept, company. |
| `Bases/` | `.base` views. |
| `Templates/` | My templates. Claude does not edit them. |

## Frontmatter contract

Every field that gets written has to be here. A field that is not declared is not invented: it is proposed and added here first.

```yaml
---
created: YYYY-MM-DD        # ISO, never rewritten
type: daily                # daily | weekly | monthly | dump | atomic | hub | project | area | clip
status: seed               # maturity, only on atomic, hub and clip (see below)
tags: []
---
```

### `status`: note maturity

Only for `atomic`, `hub` and `clip`. Periodic notes (`daily`, `weekly`, `monthly`, `dump`) do not carry it: they are a record, not knowledge, and they do not mature.

| Value | Means | Effect |
|---|---|---|
| `seed` | Just planted, incomplete on purpose | Does not count as hollow. If it is still `seed` after 30 days, the audit flags it: a seed that never grew is the classic vault failure. |
| `provisional` | Has a body but I would not defend it in a discussion | Default for a freshly written note with content |
| `evergreen` | Says what it has to say. It can stay still for years | **Does not count as stale.** It is what tells a note that already did its job apart from an abandoned one. |
| `contested` | Contradicts another note in the vault and is unresolved | The audit lists it so a review looks at it. The contradiction is preserved, it does not resolve itself. |
| `archived` | Closed | Out of the audit's scope, wherever it lives |

Without this field the audit cannot tell a reference note that finished its job from a stub that never grew, and reports both as stale.

**Projects use the same field with another vocabulary** (`active | paused | closed`): it is their lifecycle, not their maturity. The audit only interprets the five values above, so an `active` is inert to it and the project is evaluated like any other note. If that bothers you, rename it here and the contract rules.

Additional fields per type:

| `type` | Own fields |
|---|---|
| `project` | `status: active \| paused \| closed`, `deadline` (optional), `repos:` if it has code |
| `clip` | `source` (URL), `author` (optional) |
| `hub` | `aliases` (alternative names of the entity), `repos:` if the entity has code |

`repos:` is the bridge to code: the list of repos that implement that entity. It is translated to a local path in `codebases.md`. **The vault points, it does not copy:** the architecture lives in the repo.

## Link rules

- **Links go up, never down.** A dump links to hubs and projects. A daily links to the dump. A weekly links to the dailies. A monthly links to the weeklies. Obsidian backlinks give the reverse direction for free.
- **No note is closed without at least one `[[wikilink]]`.** If there is nothing to link it to, a hub file is missing.
- `[[wikilinks]]` for internal links, `[text](url)` only for external URLs.

## Tasks

Tasks live in the note they belong to, not in a central list. A project task lives in the project note; one that came up during the day lives in that day's dump.

**An open task is not carried over to the next day.** It stays in its day marked as cancelled (`- [-]`) and is created again where it belongs. Not having done something on a given day is information.

## What Claude can do

- Create and edit notes, classify the dump, update hub files, generate dailies/weeklies/monthlies, search the vault, propose links.

## What Claude cannot do

- Delete notes (it moves them to `04_Archive/`).
- Rename or move notes without my approval.
- Edit `Templates/` or anything inside `.obsidian/`.
- Write the reflection section of the reviews: Claude synthesizes the facts, I write the interpretation.
- Bulk edit: changes that affect many notes go through `/vault-tidy` with approval.

## Installed plugins

<Filled in by `/second-brain setup` with the real detection. Whatever is not on this list is not used in the notes.>

## Who writes what

- **Authored** (I write it, Claude does not touch it without approval): dumps, atomic notes, hubs, clips, projects, this file, and the `## Reflection` of the reviews.
- **Synthesized** (Claude writes it with my OK and it stays as a note): dailies, weeklies, monthlies, the `## History` of the hubs.
- **Projected** (Claude rewrites it without asking, it is derived and disposable): `hot.md`, `.vault-index.json`, the `.base` views. I do not edit them by hand because they get overwritten.

## Use from other projects

Other repos can read this vault. The read order is `hot.md` → search with `vault_index.py` → the topic's hub → the note. **The vault is not read for general programming questions**, and it is not written to from another project unless explicitly asked. Full recipe: `/second-brain link`.

## Git

This vault is a git repo. Before a run that writes several notes, the tree has to be clean: it is the only reliable undo.
