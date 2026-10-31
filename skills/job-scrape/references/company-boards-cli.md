# Company Career Boards CLI

Searches the career boards of a list of target companies through the public, keyless job-board API of their ATS. **Zero dependencies**: only the Python 3 stdlib. Same output contract as `getonbrd_search.py`, so `/job-scrape` treats it as one more source.

The script is `scripts/career_boards.py`. It exists because many companies (fintechs, banks, betting, AI startups) post only on their own ATS page, never on LinkedIn or GetOnBoard.

## Usage

```bash
python .claude/skills/job-scrape/scripts/career_boards.py search -q "golang,backend,ai engineer" [--sector fintech] [--brief]
python .claude/skills/job-scrape/scripts/career_boards.py manual
python .claude/skills/job-scrape/scripts/career_boards.py selftest
```

- `search -q` - **required**, comma-separated keywords matched as whole words against the **title** (`go` does not match "Go-To-Market" or "Gopher"). One run covers every company in the file.
- `--sector <value>` - only companies with that `sector` in the companies file.
- `--brief` - truncates each `description` to 300 chars and sets `description_truncated`. Use it in the sweep, as with GetOnBoard.
- `manual` - prints the companies with `ats: manual` and their careers URL, to check by hand.
- `selftest` - assert-based checks of the 4 parsers, the filters and the shipped example file. No network.
- `--companies <path>` - goes **before** the subcommand. Overrides the companies file.

## Companies file

First found wins: `--companies <path>` → `<workspace>/tools/company_boards/target_companies.json` (workspace = env `CAREER_WORKSPACE` or `./career-workspace`) → `scripts/target_companies.example.json`, with a note on stderr. Keep the real list in the workspace: `arcane update` overwrites edits to installed skills.

```json
[
  {"name": "Nubank", "sector": "fintech", "ats": "ashby", "slug": "nubank", "careers_url": null},
  {"name": "Banco Galicia", "sector": "bank", "ats": "manual", "slug": null, "careers_url": "https://empleos.galicia.com.ar"}
]
```

| `ats` | API read | `slug` is |
|---|---|---|
| `greenhouse` | `boards-api.greenhouse.io/v1/boards/<slug>/jobs?content=true` | the part after `boards.greenhouse.io/` |
| `ashby` | `api.ashbyhq.com/posting-api/job-board/<slug>` | the part after `jobs.ashbyhq.com/` |
| `lever` | `api.lever.co/v0/postings/<slug>?mode=json` | the part after `jobs.lever.co/` |
| `smartrecruiters` | `api.smartrecruiters.com/v1/companies/<slug>/postings` (paged by 100) | the part after `jobs.smartrecruiters.com/` |
| `manual` | none (Workday, own sites, bot-blocked pages) | `null`; set `careers_url` instead |

To add a company: open its careers page, follow an "apply" link to see which ATS it uses, copy the slug, and confirm the API URL above answers 200 before saving it. `sector` is free text; use the same values every time so `--sector` works.

## Filters

- **Title**: any keyword as a whole word.
- **Location**: kept when it names LATAM, Latin/South America, Americas, Argentina or Buenos Aires, or when it is remote with no city or region ("Remote", "Remote, Global"). "Remote - US" or "Palo Alto, Remote" is dropped: a remote posting that names a place is usually closed to other countries. Edit `LATAM` in the script for another target market.

## Data it returns (JSON)

`meta`: `count`, `companies_queried`, `failed` (`[{company, error}]`: a board that answers 404 means a wrong slug or a company that left that ATS; fix or move it to `manual`), `keywords`.

`results[]`: `id`, `title`, `company`, `location`, `date` (ISO), `url` (the posting on the ATS), `description` (plain text through `posting_guard`), `integrity`. No salary or seniority fields: these APIs rarely publish them, so the quick score treats them as unknown.

## Limits

- Public boards only. Workday, SuccessFactors and custom sites go in `manual`.
- Low volume: one GET per company per run (SmartRecruiters: one per 100 postings), 8 in parallel.
