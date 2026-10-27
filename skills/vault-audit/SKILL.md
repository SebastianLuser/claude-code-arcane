---
name: vault-audit
description: "Obsidian vault health report via a Python script: orphans, broken links, stale notes, tag sprawl, duplicate names and frontmatter outside the contract. Read-only, writes nothing. Triggers: audit the vault, vault health, orphan notes, broken links, vault audit, how healthy is my vault."
argument-hint: "[--vault <path>] [--stale-days N] [--seed-days N] [--exempt <dir>] [-n 0]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Vault Audit - Vault health

You measure the real state of the vault and explain what the numbers mean. **This skill is read-only:** it does not write a single line in the vault. Fixes need the user's approval and are applied by `/vault-tidy`.

Flags: `$ARGUMENTS`

## Phase 1 - Run the script

Python does the counting, not you: reading note by note to count links costs hundreds of thousands of tokens on a real vault and gives worse numbers.

```bash
python .claude/skills/vault-audit/scripts/vault_audit.py "<vault>" --format json
```

Useful flags: `--stale-days N` (default 180), `--hollow-words N` (default 30), `--task-days N` (default 7), `--seed-days N` (default 30), `--require <field>` (repeatable, default `created` and `type`), `--exempt <folder>` (repeatable, default `Templates` and `04_Archive`), `-n 0` to not truncate lists, `--audit-all` to also audit the exempt folders.

The script only reads the filesystem: no dependencies, it runs over thousands of notes in seconds.

**The defaults are not the vault's truth: the `CLAUDE.md` is.** Before running, read its contract and translate it into flags: the frontmatter fields into `--require`, and the `templates` and `archive` roles into `--exempt`. Auditing an adopted vault with the defaults produces false findings (its templates show up as hollow orphans) and hides the real ones.

## Phase 2 - Interpret

A finding is not a problem until you know why it is there. The readings that matter:

| Finding | What it usually means | When it is NOT a problem |
|---|---|---|
| `orphans` | Notes nobody links to and that link to nothing: the symptom of the vault-graveyard | Almost never. It is the finding most worth tackling. |
| `no_backlinks` | Nothing points to the note, although it does point to others | Entry notes (dashboards, top-level hubs) |
| `broken_links` | A link to a note that does not exist. Frontmatter `aliases` are already resolved, just like in Obsidian, so a `[[Nacho]]` pointing to the hub "Ignacio Martinez" does not show up here | **A broken link is often an intention, not an error:** it is the note the user has not written yet. Tell a typo from an intention before proposing anything. |
| `ambiguous_names` | Two files with the same name in different folders | Never: it makes every `[[short link]]` to that name resolve unpredictably. It is the most urgent finding even if it looks minor. |
| `stale` | Untouched for 180 days or more. `evergreen` notes do **not** show up here: they already said what they had to say | A reference that already did its job but nobody has marked `evergreen` yet |
| `stale_seeds` | Notes in `seed` for more than 30 days | Almost never. It is the classic vault failure: seeds never mature. It is worse than an orphan because it is not visible. |
| `contested` | Notes marked as contradictory and unresolved | It is never a vault error: it is the vault doing its job. It goes to `/review-monthly`, not to `/vault-tidy`. |
| `hollow` | Fewer than 30 words | A recent seed. Let it grow. |
| `single_use_tags` | Tags used only once | Harmless unless there are hundreds: then it is vocabulary confusion, not organization. |
| `stale_open_tasks` | Open tasks on a day that has already closed | The carry-over rule was broken: they should have been cancelled on their day. |
| `missing_frontmatter` | Contract fields missing | Old notes that predate the contract |
| `orphan_attachments` | Images and PDFs nobody embeds | They take up space, they break nothing |

The contract's `status` field (`seed | provisional | evergreen | contested | archived`) is what makes `stale` and `hollow` actionable: without it, a reference note that already did its job and an abandoned stub are reported the same. `counts.by_status` tells you how much of the vault is declared and how much is not.

Two trend metrics are worth more than any list: **`avg_links_per_note`** (if it is low, the vault is a document archive, not a network of ideas) and **`orphan_rate`**. Compare against the previous monthly if there is one.

## Phase 3 - Report

1. The counts first, in a short table. No embellishment.
2. The 3 to 5 findings worth it, sorted by real impact: `ambiguous_names` and `orphans` at the top, `hollow` and `single_use_tags` at the bottom or left out entirely if they are noise.
3. **If the report has `truncated`, say so with the real total.** A truncated report that is not announced reads as a healthy vault, and that is the one lie this skill cannot tell.
4. Close with a concrete recommendation: what you would fix first and why.

Audit COMPLETE when the user knows the numbers, which ones matter and what the first fix is.

## Rules

- Do not write to the vault. Not a note, not a frontmatter field, not a link. That is what `/vault-tidy` is for.
- Do not dramatize the numbers: a 2000-note vault with 40 orphans is healthy.
- Do not propose plugins as the solution to a hygiene problem: fewer plugins is healthier.
- Do not suggest deleting anything. The vocabulary is archiving.
- No em dashes in the report.

## Handoff

With the report ready, the next step is `/vault-tidy` to apply the chosen fixes with item-by-item approval. If the audit shows many orphans on the same topic, the real fix is `/hub-note` for the missing hub. `/review-monthly` runs this audit as part of closing the month.
