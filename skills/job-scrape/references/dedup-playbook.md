# seen_jobs - /job-scrape deduplication state

`seen_jobs.json` records every posting seen by `/job-scrape` so they are not presented again in later runs. Formal schema in `seen_jobs.schema.json` (next to this file). It lives in `<workspace>/tools/job_scraper/` (not among the notes) because it is machine data, not a note: the vault/Obsidian does not index it.

## Source-of-truth matrix (anti-divergence rule)

| Data | Source of truth | Who writes |
|---|---|---|
| "I already saw this posting" + triage + pre-note discards | `seen_jobs.json` | `/job-scrape` (and `/job-apply` when creating or discarding) |
| Pipeline status (`interested -> applied -> ...`), final match_score | Frontmatter of the note in `03-Applications/` | `/job-apply` creates; `/job-outcome` updates |
| Human view of the queue | `00-Dashboard.md` | Derived from the notes; `/job-apply` and `/job-outcome` row by row |

The flow is **one-way**: seen_jobs -> note -> dashboard. When an entry moves to `status: note_created` it is frozen (it only keeps the `note` pointer); the pipeline continues in the note and is NEVER synced back. That is why the `applied` status does not exist in this file.

## Dedup keys

1. **Canonical URL** (per source): without utm/tracking params; LinkedIn reduced to `linkedin.com/jobs/view/<id>`; GetOnBoard `/empleos/` -> `/jobs/`.
2. **`job_key`** = `slug(company)|slug(title)`, always computed with `scripts/job_key.py` (the rule written only in prose produced different keys for the same posting depending on the run): lowercase, without accents, words joined with `-`, keeps the internal `.` (coderslab.io; `.NET` becomes `net`), without legal suffixes (inc, llc, s.a....), without parenthesized work-mode or region qualifiers ("(remote)", "(latam)"; "(OT/IoT)" stays). A long slug is shortened with a hash of the full one, and a name in another alphabet uses the numeric id from the URL or a hash. It detects the same posting published on two sources with different URLs; it is added to the existing entry's `sources[]` instead of duplicating. `job_key.py --audit` reviews an existing `seen_jobs.json`.
3. Soft matching (same company + high overlap of title tokens) = **warning** in `/job-scrape`, never automatic dedup (a company can have two legitimately similar roles, or the same role with a translated title).

## Maintenance

- **Broken pointers:** at startup `/job-scrape` validates that every `note_created` entry points to an existing note and reports the broken ones.
- **Pruning (opt-in):** `new`/`discarded` entries with a `last_seen` older than 90 days can be deleted. Only at the user's request, never automatic. `note_created` entries are not pruned (they are the dedup history against real applications).
- **First run:** the file starts empty (the schema skeleton). If notes already exist in `03-Applications/`, `/job-scrape` offers to backfill them as `note_created` (with `quick_score: null` and `url: "note://<file>"` if the note has no `posting_url`).
