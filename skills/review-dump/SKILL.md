---
name: review-dump
description: "Processes the day's dump in the vault: classifies it item by item with confirmation, updates hub files, routes tasks to their note and creates the daily with the synthesis. Triggers: review dump, process the dump, close the day, review the inbox, classify what I captured, create the daily."
argument-hint: "[today | YYYY-MM-DD]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Review Dump - Classify the day

You turn the raw dump into structure. It is the session where the vault gets organized, and the only one in the daily cycle that writes to several places: that is why it goes item by item, with confirmation, and never as a silent batch.

Day to process: `$ARGUMENTS` (default: today)

Apply the `vault-conventions` rule.

**Paths by role:** destinations are named by role, and the real path of each one comes from the `## Paths` section of the vault's `CLAUDE.md`. The defaults in parentheses only apply if the vault does not declare otherwise.

## Phase 1 - Preparation

1. **Locate the vault** (`--vault`, env `OBSIDIAN_VAULT`, or the current directory with `.obsidian/`) and read its `CLAUDE.md`: it gives you the real structure, the frontmatter contract and the available plugins. If there is no `CLAUDE.md`, offer `/second-brain adopt` and stop.
2. **Check git.** If the vault is a repo and the tree is dirty, say so before writing: this run touches several notes and git is the undo.
3. **Read the dump** `<inbox>/YYYY-MM-DD dump.md` (default `_inbox/`), also accepting the name without the suffix if the vault predates it. If it does not exist, say so and offer `/brain-dump`. If the daily for that day already exists, warn that it will be updated and do not duplicate sections.
4. **Inventory the vault only once**, from the cached index and not with `Glob`:

   ```bash
   python .claude/skills/vault-recall/scripts/vault_index.py "<vault>" inventory --format text
   ```

   It returns hubs with their aliases, projects, areas, the dumps without a daily, and the dates of the last weekly and monthly. That is what you need to propose real destinations, and its cost does not grow with the vault: a `Glob` of four folders over thousands of notes puts a huge listing into context on every run. If the vault uses another structure, pass `--role name=path` with whatever the contract says. Without the script, `Glob` the `hubs`, `projects`, `areas` and `atomic` roles.

## Phase 2 - Item-by-item classification

For each line of the dump, propose a destination and wait for confirmation. One line per proposal, grouping the obvious ones so you do not ask 30 questions:

| What it is | Destination |
|---|---|
| Task for an existing project | The project's note in `<projects>` (default `01_Projects/`) |
| Task for the day without a project | Stays in the dump |
| An idea that stands on its own | New atomic note in `<atomic>` (default `03_Resources/`), delegate to `/zettel` |
| Mention of an entity with an existing hub | Entry in that hub's `## History` |
| Mention of a recurring entity without a hub | Propose a new hub (delegate to `/hub-note`) |
| URL to read later | Stays in the dump, or `/vault-clip` if the user wants it now |
| Noise, duplicate, already resolved | Nothing: it stays in the dump and is marked resolved |

**Capture taxonomy.** Before deciding the destination, classify what **type** of capture it is. Adapted from the pattern of organizing by type instead of by topic: topics create silos (a note on the psychology of attention and one on why short content performs never cross), types create collisions, and collisions are where original ideas come from.

| Type | What it is | Usually ends up in |
|---|---|---|
| observation | something I noticed, with no conclusion yet | the dump, or `atomic` if it stands on its own |
| reaction | my honest response to something I read or heard | the dump, or the topic hub's `## History` |
| pattern | the same principle showing up in two different domains | almost always `atomic`: it is the raw material of knowledge |
| question | something I genuinely do not know | the dump, and into the weekly as an open thread |
| number | a concrete data point, with its source | the topic's hub, or `atomic` if the number proves something |

**Sharpening.** Every item that moves out of the dump is rewritten as one line that makes sense on its own: if it still needs explaining, it is not sharp. "notes without links can't be found" is weak; "a note with no incoming link is invisible from the day it is written" holds up without context. Show the sharpened line to the user to confirm, because it is their idea and their words.

Classification rules:

- **Propose, do not decide.** Every move is confirmed. If the user says no, the item stays in the dump: staying is a valid destination and not a failure.
- **An entity deserves a hub when it appears in three different dumps**, not the first time. Before that it is a mention, not a topic.
- **An idea deserves an atomic note when the user might want to link it from something else.** If it only makes sense within the day it was written, it stays in the dump.
- Do not invent destinations: the proposed folders and hubs must exist in the inventory, or be created explicitly.

## Phase 3 - Tasks

Apply the carry-forward rule without exception:

1. Look for open tasks in the dumps of previous days (the last 7 days is enough).
2. The ones still open are marked `- [-]` (cancelled) **on their original day**, with the reason if the user gives one. They are not moved.
3. If the task is still relevant, it is created again: in the project's note if it has one, or in today's dump.
4. If the `obsidian-tasks-plugin` plugin is present, use its date and priority syntax; if not, a plain checkbox. Do not mix them.

Verdict for this phase: PASS when no task ended up duplicated between an old day and the new one.

## Phase 4 - Write

With approval on what was collected, in this order:

1. New atomic notes and new hubs (so they exist before anything links to them).
2. Updates to existing hubs: an entry in `## History`, and a rewrite of `## Current status` only if it really changed.
3. Tasks in the project notes.
4. The daily in `<daily>/YYYY-MM-DD.md` (default `Reflect/Daily/`) from `<templates>/Daily.md`: link to the dump, a 3 to 5 line synthesis, links to the notes created, and the real state of the day's tasks.
5. The dump stays as it is, except for the task marks. **The dump is never deleted or emptied:** it is the raw record of what happened that day.

Links go up: the daily links to the dump and to the notes created; no atomic note links back to the daily.

## Phase 5 - Close

1. **Rewrite `hot.md`** at the vault root (from `Templates/hot.md` the first time): where the user is, the notes that changed with one link each, the open threads and the live tasks. A 40-line ceiling, no secrets, no raw transcripts, and no claim without its link. **It is rewritten in full, not appended to.** It is the file that lets the next session open knowing where you were, and it is disposable: if it contradicts a note, the note wins.
2. Report in a table what was created, what was updated and what stayed in the dump.
3. The daily's `## Reflection` section stays empty: the user writes it. Do not fill it in or suggest it.
4. If the vault is a git repo, remind the user to commit.

Review COMPLETE when the daily exists, `hot.md` reflects today's state, the hubs touched are consistent and no task ended up duplicated.

## Rules

- Write the facts, do not interpret them: the synthesis says what happened, not what it means.
- Idempotent: running the review twice on the same day does not duplicate history entries or daily sections.
- Never delete content from the dump.
- No long dashes in anything you write.
- If the dump has more than 40 items, propose processing it in thematic blocks instead of item by item, and say why.

## Handoff

With the daily ready, the next step depends on the day: during the week go back to `/brain-dump`, and at the end of it `/review-weekly` to extract the week's themes. If the run left several entities without a hub or several ideas without a note, `/hub-note` and `/zettel` are the targeted steps.
