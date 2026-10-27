# LinkedIn Search CLI

Searches postings on LinkedIn's public job board (`jobs-guest` endpoints) for any country/region and remote. No authentication, no API key, **zero dependencies**: only the Python 3 stdlib.

The script is `scripts/linkedin_search.py`. Ported from the vendored TypeScript CLI in [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) (`.agents/skills/linkedin-search/`): skill scripts run in the user's project without a build step, and TypeScript there means requiring Node 24+ for native type stripping (see `docs/coding-standards.md`). The translation was verified by comparing the output of the two versions over the same HTML and the same detail: identical.

Differences from upstream, all deliberate:
- `normalize_id` accepts the trailing slash: the share-button URL is `/jobs/view/<id>/?refId=...` and the original regex only anchored on `?`.
- `NO_CARDS_PARSED` warning to stderr when the response has content but 0 cards are parsed (markup change vs "no postings").
- `&nbsp;` is normalized to a regular space: U+00A0 is invisible and breaks keyword matching in the JD.
- Forced UTF-8 output: on Windows `stdout` is cp1252 and any accent in the JD blew up when redirecting.

## ⚠️ Personal use, low volume

It reads public LinkedIn pages; automated access goes against their Terms of Service. **Keep volume low** (occasional searches, no mass sweeps or commercial use). The script retries 429/5xx with exponential backoff. `/job-scrape` asks for explicit confirmation before the first run of the session.

## Commands

### Search postings

```bash
python .claude/skills/job-scrape/scripts/linkedin_search.py search -l "<place>" [flags]
```

Flags:
- `-l / --location <text>` - **required.** LinkedIn place string: `"Spain"`, `"European Union"`, `"Remote"`, `"Berlin, Germany"`.
- `-q / --query <text>` - keywords (title, skill, role). Recommended.
- `--jobage <days>` - posted in the last `1`, `7`, `14` or `30` days.
- `--remote <mode>` - `remote`, `hybrid` or `onsite`.
- `--page <n>` - pagination (10 results per page).
- `-n / --limit <n>` - cap on emitted results (`0` emits none).
- `--format json|table|plain` - default `json`.

### Full detail of a posting

```bash
python .claude/skills/job-scrape/scripts/linkedin_search.py detail <id|url> [--format json|plain]
```

Accepts the numeric ID from search, a `jobs/view/...` URL (with or without a trailing slash and query params, like the one the share button gives) or a URN. Returns the full description, seniority, employment type, industries and link.

## Examples

```bash
# Remote fullstack in a country, last week
python .claude/skills/job-scrape/scripts/linkedin_search.py search -q "full stack developer" -l "Spain" --remote remote --jobage 7 --format table

# Remote .NET backend in a region
python .claude/skills/job-scrape/scripts/linkedin_search.py search -q ".NET developer" -l "European Union" --remote remote --jobage 14 --format table

# Global remote game developer
python .claude/skills/job-scrape/scripts/linkedin_search.py search -q "game developer" -l "Remote" --jobage 30 --format table

# Full JD of a posting
python .claude/skills/job-scrape/scripts/linkedin_search.py detail 4434569000 --format plain
```

## Notes

- Errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`. Non-fatal diagnostics use the same shape with a `warning` key (e.g. `NO_CARDS_PARSED`) and do not change the exit code.
- LinkedIn search **is not deterministic**: two consecutive runs with the same parameters can return different postings. Do not assume "does not appear" means "does not exist"; `/job-scrape`'s dedup exists precisely for that.
- `--format json` is meant for chaining: pull IDs and pass them to `detail`, or score postings against the criteria (`match_score`) before creating notes in the career workspace's `03-Applications/`.
- Reference for how the upstream URLs are built: `linkedin-urls.md`.
- Parser tests: `tests/job_scrape/test_linkedin_search.py` in the Arcane repo.
