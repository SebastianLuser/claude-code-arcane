# GetOnBoard Search CLI

Searches postings on GetOnBoard (LATAM tech job board) via its public v0 API. No auth, no API key, **zero dependencies**: only the Python 3 stdlib. Mirrors the contract of `linkedin_search.py` so `/job-scrape` can use both interchangeably.

The script is `scripts/getonbrd_search.py`. Custom-built following the `/add-portal` pattern from MadsLorentzen/ai-job-search (investigate the endpoint → scaffold with the same contract → live test), and ported from TypeScript to Python under the language-per-layer rule (`docs/coding-standards.md`); the output of the two versions was compared field by field over the same queries: identical.

## Usage

### Search postings

```bash
python .claude/skills/job-scrape/scripts/getonbrd_search.py search -q "<keywords>" [flags]
```

Flags:
- `-q / --query <text>` - **required**, minimum 3 chars. The API ANDs all the terms.
- `--jobage <days>` - published in the last N days (client-side filter on `published_at`).
- `--remote <mode>` - `remote` | `hybrid` | `onsite` (client-side filter).
- `--page <n>` - pagination (20 results per page).
- `-n / --limit <n>` - result cap (`0` emits none).
- `--brief` - `json` only: truncates each `description` to 300 chars and sets `description_truncated`. Full JDs are ~80% of the payload, so for triage use `--brief` and then `detail` on the shortlist.
- `--format json|table|plain` - default `json`.

No `--location` flag: GetOnBoard is LATAM/remote by nature; filter with `--remote` and read `countries` in the JSON.

### Detail of a posting

```bash
python .claude/skills/job-scrape/scripts/getonbrd_search.py detail <slug|url> [--format json|plain]
```

Accepts the `ID` (slug) from the search results or any getonbrd.com URL (`/jobs/...` or `/empleos/...`, with or without a category). Two layers:
1. **Search API** (progressive queries derived from the slug): full data, includes `applications_count`.
2. **Microdata fallback** (SSR page, schema.org JobPosting): for old postings or ones outside the index. Detects and flags **CLOSED** postings.

## Data it returns (JSON)

`id` (slug), `title`, `company`, `location`, `date` (ISO), `url`, `seniority` (Junior/Semi Senior/Senior/Expert), `remote`, `remote_modality` (`remote_local`/`hybrid`/`no_remote`...), `remote_zone`, `countries`, `salary_min_usd_month`/`salary_max_usd_month` (USD/month when published), `applications_count` (useful for the rubric's "posting quality" dimension), `description` (plain text).

## Examples

```bash
# Fullstack, last 2 weeks
python .claude/skills/job-scrape/scripts/getonbrd_search.py search -q "fullstack developer" --jobage 14 --format table

# Cheap triage: full structured data, truncated JD
python .claude/skills/job-scrape/scripts/getonbrd_search.py search -q "fullstack developer" --jobage 14 --brief

# Remote .NET
python .claude/skills/job-scrape/scripts/getonbrd_search.py search -q ".NET developer" --remote remote --format table

# Full JD of a posting
python .claude/skills/job-scrape/scripts/getonbrd_search.py detail "https://www.getonbrd.com/jobs/programming/full-stack-developer-buildwithin-remote-b1ef" --format plain
```

## Notes

- Public API in beta (`api/v0`); if it changes, the microdata fallback keeps working.
- Errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.
- Low volume out of courtesy; the API is public but not meant for bulk scraping.
- Endpoint reference: `getonbrd-urls.md`.
- Parser tests: `tests/job_scrape/test_getonbrd_search.py` in the Arcane repo.
