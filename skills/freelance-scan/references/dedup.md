# Dedup between /freelance-scan runs

If `+job-hunt` is installed, the source of truth is `../job-scrape/references/dedup-playbook.md` and the state file is **the same one**: two are never created. This file is the self-contained summary for whoever installed `+freelance` alone.

## Where it lives

`<workspace>/tools/job_scraper/seen_jobs.json`, not among the notes: it is machine data, and the Obsidian vault should not index it.

## Source-of-truth matrix

| Data | Source of truth | Who writes |
|---|---|---|
| "I already saw this posting" + triage + pre-note discards | `seen_jobs.json` | `/freelance-scan` |
| Pipeline status, final `match_score` | Frontmatter of the note in `03-Applications/` | `/client-screen` creates; `/job-outcome` updates |
| Human view of the queue | `00-Dashboard.md` | Derived from the notes |

The flow is **one-way**: `seen_jobs` → note → dashboard. When an entry moves to `note_created` it is frozen and keeps only the pointer to the note; the pipeline continues in the note and is never synced back. That is why `proposal_sent` does not exist in this file.

## Dedup keys

1. **Canonical URL**: without tracking parameters (`utm_*`, referrals), reduced to the posting identifier.
2. **`job_key`** = `slug(client)|slug(title)`: lowercase, without accents or punctuation, without legal suffixes (inc, llc, sa), without parenthesized title qualifiers ("(remote)", "(urgent)"). Detects the same posting under different URLs.
3. **Soft matching** (same client + high overlap of title tokens) is a **warning**, never automatic dedup: a client can have two similar, legitimate projects.

## Reposts: Upwork's own case

It is common for a client to close a posting and publish it again, sometimes several times. With a new URL, the canonical URL is not enough - the `job_key` catches it.

When a `job_key` matches an entry in `discarded`, **do not triage it again from scratch**: warn that it was already discarded before and why, and let the user decide whether something changed (corrected budget, clarified scope). A client who republishes the same posting five times without changing the budget is itself a signal for `/client-screen`.

## Maintenance

- **Broken pointers:** at startup, validate that every `note_created` entry points to a note that exists. Report the broken ones, do not delete them silently.
- **Pruning (opt-in):** `new` or `discarded` entries with a `last_seen` older than 90 days can be deleted, only at the user's request. `note_created` entries are not pruned: they are the history the pipeline is measured against.
- **First run:** the file starts with the empty skeleton. If there are already notes in `03-Applications/` with `type: freelance`, offer to backfill them as `note_created`.
