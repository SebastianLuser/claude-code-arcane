---
name: second-brain
description: "Entry point for the Obsidian second brain. Creates or adopts a vault (PARA + Zettelkasten + hub files), writes its CLAUDE.md, detects which plugins are installed, connects other projects to the same vault and routes to the right skill. Triggers: second brain, set up obsidian vault, organize my vault, start a vault, adopt my vault."
argument-hint: "[setup | adopt | status | next | link]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Second Brain - Vault Orchestrator

You are the entry point of the second brain. Your job is: locate (or create) the vault, understand what state it is in, and route to the right skill. You do not do everything yourself, you orchestrate.

Apply the `vault-conventions` rule to every write.

## Language

Talk to the user in the language they write in. Vault notes go in the language the user writes their dumps in: detect it from the existing content and do not change it.

The section headings other skills key on (`## Paths`, `## Current status`, `## Notes`, `## History`, `## Reflection`) and the frontmatter values are part of the vault's contract: write them as the templates do, whatever language the notes are in. A vault set up before the contract moved to English still has the old Spanish names: see [Migrate an existing vault](#migrate-an-existing-vault).

## Locate the vault

In this order: the `--vault <path>` flag, the `OBSIDIAN_VAULT` env var, or the current directory if it contains `.obsidian/`. If there is none, ask before assuming. A directory without `.obsidian/` is not a vault: it is a folder with markdown, and you have to say so.

## The vault

```
CLAUDE.md              the vault's contract: structure, frontmatter, link rules
hot.md                 recent-context cache, rewritten by /review-dump
_inbox/                raw capture, one file per day (YYYY-MM-DD dump.md)
Reflect/
  Daily/               synthesis of the day, created by /review-dump
  Weekly/              weekly retrospective
  Monthly/             patterns and balance of the month
01_Projects/           with a deadline or a defined outcome            [PARA]
02_Areas/              ongoing responsibilities                        [PARA]
03_Resources/          atomic notes, flat, no subfolders               [Zettelkasten]
04_Archive/            closed, never deleted                           [PARA]
Hubs/                  one note per entity that matters
Bases/                 .base views
Templates/             the user's templates
```

That tree is the **`setup` default**, not an imposition: the `## Paths` section of the vault's `CLAUDE.md` maps each role (`inbox`, `daily`, `hubs`...) to the folder that fills it, and the skills read that mapping. An adopted vault keeps its names and everything keeps working.

Two frameworks, two layers: **PARA is the navigation layer** (every note has a home) and **Zettelkasten is the knowledge layer** (atomic notes live flat in `03_Resources/` and connect through links). **Hub files** are the tissue between the two: one note per entity that matters (person, tool, concept, company) that accumulates knowledge over time.

Folders group by purpose, links group by meaning: a note lives in one folder and links to many.

## Capability detection

Before generating any view or syntax that depends on a plugin, read `.obsidian/core-plugins.json` and `.obsidian/community-plugins.json` and adapt:

| If present | Use it for | If absent |
|---|---|---|
| `bases` (core, Obsidian 1.9+) | dashboards and aggregated views (`.base`) | a static markdown table in the dashboard |
| `dataview` | inline fields and computed text Bases cannot express | rephrase the view so Bases can express it |
| `obsidian-tasks-plugin` | date and priority syntax in tasks | plain markdown checkboxes |
| `templater-obsidian` | high-frequency templates (daily) | the skills write the file directly |
| `omnisearch` | offer it for fuzzy search from the Obsidian UI | `/vault-recall`, which ranks without depending on plugins |

Never use in a note the syntax of a plugin the user does not have installed: it stays as broken text in reading view. Record the detection result in the vault's `CLAUDE.md` so it is not repeated every session.

## Modes

### `setup` - Create the vault
1. Confirm the vault path and whether `.obsidian/` already exists (if it does not, warn that Obsidian has to open it once to initialize it).
2. Run capability detection.
3. Create the folder tree.
4. Copy the templates from `references/templates/` to the vault's `Templates/`.
5. Write the vault's `CLAUDE.md` from `references/templates/vault-CLAUDE.md`, filling in **the `## Paths` section** (role to folder), the frontmatter contract and the detected plugins. `## Paths` is not decorative: it is where every other skill gets where to write.
6. If `bases` is present, create `Bases/Dashboard.base` with the views for open tasks and recent notes (delegate the syntax to `/obsidian-bases`).
7. Create `hot.md` from `references/templates/hot.md`, empty. It is the cache that opens the following sessions (see below).
8. If the user writes code, create `codebases.md` from its template: it is the vault's bridge to the repo, and what keeps the architecture from being copied into the vault.
9. **Build the index** so the first search and the first review do not pay for full indexing:
   ```bash
   python .claude/skills/vault-recall/scripts/vault_index.py "<vault>" refresh
   ```
10. **Offer the validation hook** (optional, see below).
11. Check that the vault is a git repo; if it is not, recommend it and explain why (it is the undo for any run). Also ask whether the vault is synced and, if the answer is yes, apply the sync rules below **before** writing anything else.

Ask for approval before writing. Verdict: vault READY when the tree, the templates and the `CLAUDE.md` with its `## Paths` exist.

### `adopt` - Adopt an existing vault
For a vault that is already set up, with or without a coherent structure. It does not migrate anything on its own.

1. Map what is there: `Glob` of the top-level folders, note count per folder, frontmatter fields in use (`Grep`), naming convention of the periodic notes, most-used tags.
2. **Map role to folder**, which is the central deliverable of this mode. For each role (`inbox`, `daily`, `weekly`, `monthly`, `atomic`, `hubs`, `projects`, `areas`, `archive`, `templates`), propose which vault folder fills it today, and mark the ones that do not exist as `(unused)`. Confirm the mapping with the user item by item: it is the translation every other skill depends on, and a wrongly mapped role makes them write into the wrong folder with no visible error.
3. Run `/vault-audit` with the flags that come from that mapping (`--exempt` for `templates` and `archive`, `--require` with the frontmatter fields the vault already uses) to get real metrics and not false findings.
4. Report the mapping and propose **one of two** paths, with the cost of each:
   - **Adopt the existing structure:** write the `CLAUDE.md` with the `## Paths` you just mapped. Zero files moved, zero links broken. It is the default option.
   - **Migrate to the `setup` structure:** an explicit plan of which folder goes where, executed by `/vault-tidy` with item-by-item approval, in a clean git repo.
5. Write the `CLAUDE.md` for the chosen path, with the full `## Paths`. Never move files in this mode.
6. Build the index (`vault_index.py refresh`) passing the mapping: `--role hubs=<folder> --role atomic=<folder> ...`.

Verdict: vault READY when the `CLAUDE.md` describes the vault's real conventions, not the ideal ones, and its `## Paths` covers the ten roles or marks them as unused.

### `status` - Where am I
1. Read `hot.md` first: it is 40 lines and answers "where was I" without opening anything else. If it is empty or out of date, continue anyway and say so.
2. Read the vault's `CLAUDE.md` to resolve the roles.
3. Run `vault_index.py "<vault>" inventory --format text`: it already returns the dumps without a daily, the latest weekly and monthly, and the hubs with their aliases. It is one call instead of several `Glob`s, and it does not grow with the vault.
4. Report that plus the open tasks and the projects with no recent activity.
5. Recommend the highest-impact action.

### `next` - What do I do now
Depending on the state, recommend the next skill (see routing).

### `link` - Connect another project to the vault
To use the same second brain from any repo, without duplicating notes.

1. Confirm the vault path and that the current project is not the vault itself.
2. Read `references/cross-project.md` and propose the snippet, with the real path filled in.
3. With approval, add it to the `CLAUDE.md` **of the current project** (create the file if it does not exist). The vault is never touched in this mode.
4. Explain the two rules that make this work: the read cascade (`hot.md` → search → hub → note) and that **the vault is not read for general programming questions**. Without the second one, every query pays the vault's cost and gets nothing back.

Verdict: project READY when its `CLAUDE.md` declares the path, the cascade and the write limit.

## Migrate an existing vault

Vaults set up before the contract moved to English have Spanish section headings, Spanish project statuses and Spanish `.base` view names, and the skills no longer find those sections. `scripts/migrate_vault.py` renames them; the old to new mapping lives in `scripts/legacy_contract.es.json`. Offer it when `status` or any skill finds the old names (for example the paths table under its old heading).

```bash
python .claude/skills/second-brain/scripts/migrate_vault.py "<vault>"            # dry run: the plan per file
python .claude/skills/second-brain/scripts/migrate_vault.py "<vault>" --apply    # backup, then rewrite
```

It rewrites only: heading lines that match a mapped heading exactly, the `status:` of project notes (`active | paused | closed`), the "why I saved it" label in clips, the vault `CLAUDE.md` section names with its unused-role marker and project status list, and the view names, labels and status filters of `.base` files. The user's templates (the `templates` role, default `Templates/`) are migrated too and listed as such. Any other body text, `.obsidian/`, `.git/` and `.trash/` are never touched.

1. Run the dry run and show the plan, including what it reports as not recognized (a project status or a heading it does not know is left as is, never guessed).
2. Recommend a clean git tree, then run `--apply` with approval. It copies every file it changes into `<vault>/.arcane-migration-backup/<timestamp>/` first (the audit and the index skip that folder; delete it once the vault looks right); a second run plans nothing.
3. Rebuild the index (`vault_index.py refresh`). Placeholder text inside the old templates stays Spanish: offer to copy the English ones from `references/templates/` if the user wants them.

## The bridge to code (`repos:`)

A hub or project note that has code declares `repos:` in its frontmatter, and `codebases.md` translates each repo to its local path, how it runs and whether it has a queryable graph. It is the reverse direction of `/second-brain link`: that mode makes a repo read the vault, this makes the vault know where the repo is.

The rule that holds it up is **the vault points, it does not copy**: the architecture lives in the repo and goes stale the day someone merges. And if the repo has a code graph, querying it is the first stop before sending subagents to explore: a survey costs on the order of 100k tokens, a graph query one or two thousand.

## The hot cache (`hot.md`)

A short file at the vault root with where you were: what you are working on, which notes changed, which threads are still open, which tasks are alive. `/review-dump` rewrites it when closing the day and `/second-brain status` reads it, as does any other project connected with `link`.

Idea taken from `AgriciDaniel/claude-obsidian`, and it is the one that closes the hole in the cycle: the three reviews give something back **when you ask for them**. The cache gives something back when the session opens, without asking.

Four rules, hard because it is the only thing in the vault that is rewritten without asking:

- **40-line ceiling.** If it does not fit, summarize more, do not raise the ceiling.
- **No secrets or raw transcripts**, even if they appear in a dump.
- **No claim without its link.** The cache does not create knowledge, it points to what exists.
- **It is rewritten in full.** A cache that gets appended to is a log, and nobody reads a log.

It is disposable by design: if it contradicts a note, the note wins, and deleting it loses nothing because it is regenerated.

## Sync: two rules that prevent 90% of the problems

If the vault is synced (Drive, iCloud, Dropbox, Obsidian Sync, git), two things break reproducibly:

1. **`.obsidian/` is not synced.** It is per-machine config (plugins, theme, layout) and it is the number one source of conflicts. The pattern that solves it is keeping the vault root local and putting the shared content inside it through a symlink:

   ```
   ~/ObsidianVault/          local root, never synced
   ├── .obsidian/            YOUR config, stays local
   └── content/              symlink to the synced folder
   ```

   Obsidian follows the symlink and reads the notes; the config never leaves your machine. If the vault is only yours and you use git, the alternative is a `.gitignore` with `.obsidian/`, `.vault-index.json` and `.trash/`.

2. **A single transport.** Never two sync mechanisms over the same folder (Drive + Obsidian Sync, or iCloud + git with auto-commit): they produce random reverts nobody can explain afterwards.

And if the vault is shared with other people: **one writer per note**. No sync merges markdown; whoever saves second generates a conflicted copy. This profile assumes a personal vault, and that is its honest limit: for a team you need to declare an owner per note and accept that co-editing does not exist.

## Validation hook (optional)

The skill ships a `PostToolUse` hook that checks every note written in the vault: frontmatter present, `created` and `type` declared, and at least one `[[wikilink]]` except in dumps. It warns on stderr and **never blocks the write**.

It covers what the skills do not: the notes you write by hand or from another session. To enable it, add the content of `.claude/skills/second-brain/hooks/hooks.json` to the **vault's** `.claude/settings.json`:

```json
"PostToolUse": [
  {
    "matcher": "Write|Edit",
    "hooks": [
      { "type": "command", "command": "bash .claude/skills/second-brain/hooks/validate-note.sh", "timeout": 5 }
    ]
  }
]
```

It is opt-in on purpose and goes in the vault's settings, not the repo's: a hook that runs on every `Write` in any project is weight nobody asked for. Offer it during `setup`, explain it is only a warning, and respect a no.

## Routing

| Situation | Skill |
|---|---|
| There is no vault | `/second-brain setup` |
| Existing vault without `CLAUDE.md` | `/second-brain adopt` |
| Capture something now, without thinking where it goes | `/brain-dump` |
| Process the day's dump and create the daily | `/review-dump` |
| Close the week | `/review-weekly` |
| Close the month | `/review-monthly` |
| An idea from the dump deserves its own note | `/zettel` |
| An entity repeats across several dumps | `/hub-note` |
| Save an article or web page | `/vault-clip` |
| Find something you already wrote | `/vault-recall` |
| Use the vault from another project | `/second-brain link` |
| Know how healthy the vault is | `/vault-audit` |
| Apply the fixes the audit proposed | `/vault-tidy` |
| Obsidian, Bases or Canvas syntax questions | `/obsidian-markdown`, `/obsidian-bases`, `/obsidian-canvas` |

## Standard cycle

During the day: `/brain-dump` as many times as needed (or write directly in `_inbox/YYYY-MM-DD.md`).
At night: `/review-dump` classifies, updates hubs and creates the daily.
End of the week: `/review-weekly`. End of the month: `/review-monthly`.
Every so often: `/vault-audit` and, if needed, `/vault-tidy`.

## Rules

- Never reorganize folders or rename notes without approval: it silently breaks `[[wikilinks]]`.
- Capture has to stay frictionless. If the user has to decide where something goes while writing it, the system has already failed.
- Do not stack frameworks. PARA + Zettelkasten + hub files is the ceiling; adding GTD or CODE on top is the number one reason these systems get abandoned.
- One plugin too many is debt: do not recommend any the vault does not need for what the user actually does.
- Maximally actionable: the user always ends up knowing which skill to run next.

## Handoff

Ask for approval before writing or overwriting vault files. When the vault is READY, the next step is `/brain-dump` for the first capture, and `/review-dump` at night to close the full cycle for the first time.
