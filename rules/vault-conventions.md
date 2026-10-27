# Vault Conventions Rule (second brain in Obsidian)

Rules that govern every write inside an Obsidian vault. They exist because an agent writing notes without constraints degrades the vault faster than it builds it: it links everything to everything, silently carries tasks forward and renames files, breaking `[[wikilinks]]`.

Paths are relative to the vault (`--vault`, env `OBSIDIAN_VAULT`, or the current directory if it contains `.obsidian/`).

## When it applies

- Any skill in the `second-brain` profile that creates or edits notes.
- Any write in a directory that contains `.obsidian/`, even from another skill.
- It does NOT apply to the vault's configuration files (`.obsidian/**`): those are never touched without an explicit request from the user.

## Who writes each file

Before touching anything, the question is whose file it is. There are three classes and the write permission differs for each. Adapted from the **authored / projected** distinction in Educabot's product knowledge base, which is what lets an agent and a person write in the same repository without stepping on each other.

| Class | Who writes | What the agent may do | Examples |
|---|---|---|---|
| **Authored** | The person. Changes slowly | **Nothing without approval.** No reformatting, no "improving" | Dumps, atomic notes, hubs, clips, projects, the vault's `CLAUDE.md`, the `## Reflection` section of the reviews |
| **Synthesized** | The agent, with approval, and it stays as a permanent note | Propose, and write after the OK. Idempotent: running twice does not duplicate | Dailies, weeklies, monthlies, a hub's `## History` |
| **Projected** | The agent, without asking. Derived and disposable | Rewrite it in full when appropriate | `hot.md`, the `.vault-index.json` index, the `.base` views |

Three consequences that settle the questions that come up in practice:

- **Projected files are not edited by hand.** If the user edits one, the next review overwrites it. That is why `hot.md` carries the warning inside.
- **Projected files are not a source of truth.** If one contradicts a note, the note wins. It can be deleted without losing anything.
- **Authored files are not touched, not even to fix them.** If one of the user's notes has broken frontmatter, propose the fix; do not apply it on your own. The exception is the categories `/vault-tidy` applies with item-by-item approval.

If you do not know which class a file falls into, it is authored. The default is not to write.

## The vault points, it does not copy

When something already has a source of truth outside, the vault keeps **the pointer and the why**, never a copy:

| Content | Source of truth | In the vault |
|---|---|---|
| Code and architecture | The repo | `repos:` in the frontmatter, and `codebases.md` with the local path |
| Tickets, statuses, sprints | Jira, ClickUp, Linear | Link, and the decision that came out of it |
| Designs | Figma | Link in the topic's note |
| Articles, papers | The web | The clip, with `source:` and **your** summary |

A copy goes stale silently, and then there are two truths and neither wins. What the vault does accumulate is what none of those sources has: **what you decided, why, and what you learned**. That does not live in Jira or in the code.

## Path resolution: roles, not folders

No skill writes to a literal path. It writes to a **role**, and the `## Paths` section of the vault's `CLAUDE.md` says which folder that role is in this vault. That is what lets an adopted vault with a different structure work without touching the skills.

| Role | What it holds | `setup` default |
|---|---|---|
| `inbox` | the day's raw capture | `_inbox` |
| `daily` | daily synthesis | `Reflect/Daily` |
| `weekly` | weekly retrospective | `Reflect/Weekly` |
| `monthly` | monthly review | `Reflect/Monthly` |
| `atomic` | atomic notes | `03_Resources` |
| `hubs` | hub files per entity | `Hubs` |
| `projects` | projects with a deadline | `01_Projects` |
| `areas` | ongoing responsibilities | `02_Areas` |
| `archive` | closed, never deleted | `04_Archive` |
| `templates` | the user's templates | `Templates` |

Resolution order, no exceptions:

1. The `## Paths` section of the vault's `CLAUDE.md`.
2. If the vault does not declare it, the table's default, **telling the user it is being assumed**.
3. If the role does not exist in this vault (not every vault has `areas`), ask before creating the folder.

Scripts receive the mapping by flag (`--role hubs=People`), they never guess it. **If the vault's `CLAUDE.md` declares paths that differ from the default and a skill writes to the default anyway, that is a bug in the skill, not a preference.**

## The three structure rules

### 1. Links go up, never down

Each note links to its context, not to its detail:

| From | Links to | Never to |
|---|---|---|
| Note in `_inbox/` (dump) | hub files, projects, areas | other dumps |
| Daily | the day's dump, notes created that day | other dailies |
| Weekly | the week's dailies | loose atomic notes |
| Monthly | the month's weeklies | dailies |
| Hub file | atomic notes and projects on the topic | dumps or dailies |

Without this rule the agent creates bidirectional links in every direction and the graph turns into noise: every note points to everything and no relationship means anything. Obsidian's backlinks already give you the reverse direction for free; there is no need to write it.

### 2. No note is closed without at least one `[[wikilink]]`

This is the only rule that prevents orphans at the root. If, when a note is finished, there is nothing to link it to, that is the signal a hub file is missing: create the hub (see `/hub-note`) before closing the note, or leave it in `_inbox/` instead of filing it in `03_Resources/`.

Exception: raw dumps in `_inbox/` may be born without links, because `/review-dump` adds them.

### 3. Undone tasks are not carried forward silently

A task open in Monday's dump that is still open on Tuesday **stays on Monday**, marked as cancelled (`- [-]`), and is created again on Tuesday. It is not moved.

Not having done something on a given day is information. Carrying the task forward produces a clean list and a false history.

## What the agent may not do

- **Never delete a note.** Move it to `04_Archive/`, keeping its name. Deleting is always the user's decision.
- **Never rename or move a note without explicit approval.** It silently breaks `[[wikilinks]]`: Obsidian only updates them when the rename happens inside the app.
- **Never edit in bulk.** A run touches that run's notes. Changes that affect many notes are proposed as a plan and applied by `/vault-tidy` with item-by-item approval.
- **Never touch `Templates/`** unless explicitly asked: they are the user's contract, not the agent's.
- **Never rewrite the user's reflection section.** Reviews synthesize facts; the user writes the interpretation.

## Frontmatter contract

Every field a skill writes must be declared in the vault's `CLAUDE.md`. A field that is not in the contract is not invented: it is proposed and added to the contract first.

Minimum per note type:

```yaml
---
created: 2026-07-27        # ISO, never rewritten
type: daily                # daily | weekly | monthly | dump | atomic | hub | project | area | clip
tags: []
---
```

Types with their own fields (`status` in projects, `source` in clips) are declared by the skill that creates them.

## Writing conventions

- No long dashes: if generated text contains an em-dash or en-dash, normalize it to `-` before writing.
- `[[wikilinks]]` for everything internal, `[text](url)` only for external URLs. Obsidian tracks renames of wikilinks, not of markdown links.
- ISO dates (`YYYY-MM-DD`) in frontmatter and in the file names of periodic notes.
- One idea per atomic note. If a note needs two unrelated `##` headings, it is two notes.
- Section headings and frontmatter values are written exactly as the templates have them, whatever language the note is in: the skills find sections by name. If the vault still uses the pre-English names, offer the migration in `/second-brain` instead of writing a mix.

## This file does not hold the structure up

A convention that only lives in a document dies within three months. What holds it up is what runs:

| Convention | What enforces it |
|---|---|
| Complete frontmatter, notes with at least one link | The `second-brain` `PostToolUse` hook, on write, if you enabled it during `setup` (it is opt-in) |
| Orphans, broken links, duplicate names, seeds that do not grow | `/vault-audit`, every time it runs |
| Unresolved contradictions | `status: contested`, which the audit lists and the monthly looks at |
| Paths by role | The contract's `## Paths` section, which the skills read before writing |
| Tasks that are not carried forward | The task step of `/review-dump`, and `stale_open_tasks` in the audit |

If a new rule in this file has no right-hand column, it is an intention, not a rule. Before adding it, ask what is going to enforce it.

## Git as a safety net

The vault should be a git repo. Before a run that writes several notes (`/review-dump`, `/vault-tidy`), check that the tree is clean and tell the user if it is not. That is what lets you undo a whole run without reviewing note by note.
