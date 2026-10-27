# GetOnBoard API v0 - endpoint reference (verified 2026-07-13)

Base: `https://www.getonbrd.com/api/v0` - no authentication for public endpoints. JSON:API format.

## Posting search

```
GET /search/jobs?query=<q>&per_page=<n>&page=<n>&expand[]=seniority&expand[]=company
```

- `query`: required, min 3 chars. ANDs all the terms (long queries over-restrict).
- `per_page` / `page`: pagination; `meta: { page, per_page, total_pages }` in the response.
- `expand[]`: resolves the `seniority` and `company` references inline (without expand they come only as `{id, type}`).

Response per job (`data[]`): `id` = slug, `links.public_url`, and in `attributes`:
`title`, `description` (HTML), `functions` (HTML), `desirable` (HTML), `benefits` (HTML), `remote` (bool), `remote_modality` (`remote_local` | `hybrid` | `no_remote` | ...), `remote_zone`, `countries[]`, `min_salary`/`max_salary` (USD/month, null if not published), `published_at` (unix), `applications_count`, `seniority.data.attributes.name`, `company.data.attributes.name`, `lang`, `perks[]`.

## Public catalogs

```
GET /seniorities   -> Junior=2, Semi Senior=3, Senior=4, Expert=5, Sin experiencia=1 (locale_key no_experience)
GET /categories    -> categories (programming, design-ux, etc.)
```

The API returns the `name` of seniority 1 in Spanish (`Sin experiencia`); match on `locale_key` (`no_experience`), not on the name.

## What is NOT public

- `GET /jobs/<slug>` returns **401** (private endpoint, requires an account API key).
  That is why the script's `detail` uses search + a filter by exact id, with a microdata fallback.

## SSR pages (detail fallback)

- `https://www.getonbrd.com/jobs/<slug>` redirects 301 to `/jobs/<category>/<slug>`.
- The page renders schema.org JobPosting microdata via `itemprop` attributes:
  `title`, `hiringOrganization > name`, `datePosted`, `baseSalary > minValue/maxValue`,
  `description`, `qualifications` (seniority), `address`.
- Closed postings: they lose the `itemtype="http://schema.org/JobPosting"` but keep
  the `itemprop`s; the page contains the text "Closed job" / "No longer accepting".
