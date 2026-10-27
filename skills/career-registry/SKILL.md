---
name: career-registry
description: "Traceability across the whole career workspace: check whether you already applied somewhere before spending another application, export everything to CSV, and audit the registry for gaps and drift. Covers job applications, freelance proposals and contracts. Triggers: did I already apply to, I already applied here, export applications to csv, application registry, traceability, application history, how many did I send, applications spreadsheet, audit the registry."
argument-hint: "[check <company|url> | export | stats | audit]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Career Registry - Traceability and records

You answer the question that grepping by hand answers badly: **did I already apply here?** And you provide the full registry as CSV to look at in a spreadsheet.

It serves both profiles: `+job-hunt` (jobs) and `+freelance` (projects). Paths are relative to the career workspace (`--workspace`, env `CAREER_WORKSPACE`, or `./career-workspace/`).

Mode: `$ARGUMENTS`

## The rule that holds all of this up

**The notes are the source of truth. The CSV is derived from them, always.**

There is no second database to keep in sync, and there will not be one: a second database diverges within two weeks and then nobody knows which one is lying. It is the same one-way flow as the `/job-scrape` dedup (`seen_jobs` → note → view, never back).

Practical consequence: if the CSV is wrong, the note gets fixed, not the CSV. And if the user asks "save the CSV so I can edit it by hand", warn them that the next run overwrites it.

## The four modes

```bash
python .claude/skills/career-registry/scripts/career_registry.py check "Acme"
python .claude/skills/career-registry/scripts/career_registry.py check "https://www.linkedin.com/jobs/view/123"
python .claude/skills/career-registry/scripts/career_registry.py export --csv registry.csv
python .claude/skills/career-registry/scripts/career_registry.py stats
python .claude/skills/career-registry/scripts/career_registry.py audit
```

### `check` - before spending another application

It searches by **three keys** because the user pastes any of the three: counterpart name, posting URL, or note title.

It is tolerant where it matters: `acme` finds "Acme Inc" (ignores legal suffixes), `zurich labs` finds "Zürich Labs GmbH" (ignores accents), and a URL with a different `?utm_source=...` finds the same posting (it canonicalizes the link, like the dedup does).

It returns a three-value verdict, and the difference between the first two matters:

| Verdict | What it means |
|---|---|
| `ALREADY APPLIED` | There is a note in a sent status. Do not repeat |
| `SEEN, NOT APPLIED` | There is a note or a dedup entry, but it was never sent. Worth reviewing before discarding it again |
| `NO RECORD` | It never showed up |

When to run it: **before `/client-screen` or `/job-apply`**, when the name sounds familiar. A screen on something you discarded three months ago is repeated work, and worse, it makes you repeat the discard without remembering why.

### `export` - the CSV

One row per note, with `type` telling job / freelance / contract apart. Columns: counterpart, title, status, whether it is open, platform, `match_score`, client risk, profile used, bid or amount, cost of applying, dates, **days idle**, link and the note path.

Without `--csv` it goes to stdout; with `--csv <file>` it is written as UTF-8 with BOM so Excel does not break accented characters. `--type` filters to a single type.

`days_idle` is the most useful column in the spreadsheet: sorting by it surfaces what was left hanging.

### `stats` - counts

Total and open per type, breakdown by status, how many were sent and the recorded cost of applications.

It includes `enough_sample_for_rates`: **with fewer than 10 sent it is `false`, and then no conversion rates should be computed**. Ten rejections are not a pattern, and treating them as one sends the user to fix what was not broken.

### `audit` - the drift

What makes traceability real and not an intention:

- Notes without `status` or without a counterpart
- Sent without a sent date (breaks any timing calculation)
- **Open and stalled for 21+ days** - candidates for a follow-up with `/cold-outreach` or for closing as `no_response`
- Possible duplicates: same counterpart, same title, two notes
- **Contracts with actual hours above the estimate**, with the excess in hours and as a percentage. Each one is work given away if there was no change order
- Dedup pointers that point to notes that no longer exist

### Workspaces from before the English contract

A workspace created before the English data contract reads as empty, and the result carries a "pre-English layout" problem. The migration ships here, so freelance-only installs get it too: `scripts/migrate_workspace.py` rewrites folders, fixed note names, frontmatter, the template structure in note bodies and `seen_jobs.json`, with every old name taken from `scripts/legacy_contract.es.json` (the same pack `career_registry.py` reads to spot the old layout). In a body it rewrites only whole lines that are an old template heading (a title by its prefix), an old bold label at the start of a line (the value after it kept), a table header row that matches an old one cell for cell, and the enum cells (`Status`, `Billable`, `Result`, `Source`) of that table's rows; prose, plain list items, comments, code fences and links stay as written.

```bash
python .claude/skills/career-registry/scripts/migrate_workspace.py            # dry run: prints the plan, changes nothing
python .claude/skills/career-registry/scripts/migrate_workspace.py --apply    # backs up the workspace next to it, then migrates
```

Show the dry run (the `body` section lists each line it would rewrite), point out `unknown_values` (frontmatter values and ledger cells it does not recognize, left as they are) and `body_links_to_old_names` (links are never rewritten), and run `--apply` only with the user's approval. With `+job-hunt` installed, `/job-hunt migrate` walks the same steps.

## Process

1. Run the requested mode. If the workspace does not exist, the script says so and suggests `/freelance-hunt setup` or `/job-hunt setup`.
2. **Show the result in the chat, not just the raw JSON.** For `check`, the verdict and one line per match with its status. For `audit`, grouped by severity: first what costs money (extra hours, sent without a date), then the cosmetic issues.
3. For each `audit` finding, offer the concrete action: follow-up, close as `no_response`, change order, or fill in the missing field.
4. Fixes are made **in the note** with the user's approval, one at a time. Never in bulk.

## Rules

- **Never edit the CSV as if it were the source of truth.** It is regenerated; changes go to the note.
- **Do not edit notes in bulk.** Each fix is shown and approved.
- Never make up missing data: if a note has no sent date, ask or leave the gap reported.
- Do not change `status`: that is done by `/job-outcome`, the only one that moves the pipeline.
- The CSV may contain client names and amounts: **do not commit it to a remote without explicit confirmation**.
- No long dashes in text added to notes.

## Handoff

Ask for approval before writing the CSV or touching a note. Registry COMPLETE when the mode ran and the user knows what to do with each finding. Depending on the case, the next step is `/cold-outreach` (follow-up on what stalled), `/job-outcome` (close what will not answer), `/contract-and-proposal-writer` (change order for the extra hours) or `/freelance-pipeline` (if there are 10+ resolved and you want the funnel diagnosis).
