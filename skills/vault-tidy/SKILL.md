---
name: vault-tidy
description: "Applies the fixes /vault-audit reported, with item-by-item approval: link orphans, resolve duplicate names, cancel carried-over tasks, complete frontmatter and archive. Never deletes. Triggers: clean up the vault, fix orphans, vault tidy, apply the audit, tidy the vault, resolve broken links."
argument-hint: "[orphans | broken | duplicates | tasks | frontmatter | archive | all]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Vault Tidy - Apply the fixes

You are the only skill in the profile that edits existing notes in bulk, and therefore the most dangerous one. Every change is proposed and approved: there is no batch mode, no "I fix everything and tell you afterwards".

Category to fix: `$ARGUMENTS` (default: ask which one, never `all` by omission)

The `vault-conventions` rule applies.

**Paths by role:** destinations are named by role, and each one's real path comes from the `## Paths` section of the vault's `CLAUDE.md`. The defaults in parentheses only apply if the vault does not declare otherwise.

## Phase 1 - Before touching anything

1. **Locate the vault** and read its `CLAUDE.md`: the frontmatter contract and the structure come from there, not from your defaults.
2. **Check git.** If the vault is a repo and the tree is dirty, stop and ask for a commit first. This skill is the one that most justifies having git: it is the only real undo for a run of 30 edits.
3. **Run `/vault-audit`** and work from those findings. Never decide by eye what to fix.
4. **Bound the run.** If the user asked for `all`, propose splitting it by category and start with the highest-impact one. A run of 200 edits cannot be reviewed and therefore cannot really be approved.

## Phase 2 - The fixes, by category

### `duplicates` - Duplicate names
The most urgent: two files with the same name make every `[[short link]]` to that name resolve unpredictably.

For each pair: show both notes and propose renaming the less-linked one, or merging them if they are the same thing. **The user does the rename in Obsidian**, not you: Obsidian updates wikilinks when the rename happens inside the app, and from the filesystem they break silently. Your deliverable here is the list of renames to make and their order.

### `orphans` - Orphans
For each orphan: read it, propose the hub or note to link it from, and add the link **in the hub**, not in the orphan. The incoming link is what makes it findable.

If several orphans are on the same topic, the fix is not to link them one by one: it is to create the missing hub with `/hub-note` and link them from there. Say so before you start patching.

### `broken` - Broken links
Classify each one before touching it:

- **Typo:** the target exists under another name. Fix the link.
- **Intent:** the note does not exist yet and the link is a reminder. **Leave it.** An intentional broken link is a pending note, not an error, and deleting it destroys information.
- **Junk:** a link to something that no longer applies. Remove the link, keep the text.

Ask which it is when it cannot be inferred from context. Do not guess.

### `tasks` - Carried-over tasks
For each task left open on a day that already closed: mark it `- [-]` on its original day and ask whether it is still relevant. If it is, create it in the project's note or in today's dump. Never move the original.

### `frontmatter` - Contract
Fill in the fields missing from the vault's contract. `created` is inferred from the file name if it has a date, or from the mtime; `type` is inferred from the folder. If it cannot be inferred, ask. **Never overwrite a `created` that already exists**, even if it looks wrong: it is historical data.

### `archive` - Archive
Move to the `archive` role (default `04_Archive/`) what the user confirms is closed, keeping the name. **Never delete anything.** The move carries the same warning as the rename: if there are notes linking to the one being moved, say which ones and let the user do it from Obsidian.

## Phase 3 - Apply and report

1. Propose the changes in a table: note, what changes, why. Group identical mechanical changes so you do not ask 40 questions, and ask one by one about the ones that need judgment.
2. Apply only what was approved, with `Edit` on verbatim quotes so nothing around them is touched.
3. Report what changed and what is still pending, and remind the user to commit.

Tidy COMPLETE when the approved changes are applied and the rest is explicitly pending, not forgotten.

## Rules

- **Never delete a note.** Archive it.
- **Never rename or move from the filesystem** without warning that it breaks wikilinks: propose that the user do it from Obsidian.
- No bulk edits without approval, not even trivial ones.
- Do not touch the `templates` role (default `Templates/`) or `.obsidian/`.
- Do not rewrite the user's content: you add links and frontmatter, you do not edit their prose.
- No long dashes.

## Handoff

With the fixes applied, run `/vault-audit` again to confirm the numbers moved: if a finding is unchanged, the fix was not the right one. If the run exposed topics without a hub, the next step is `/hub-note`.
