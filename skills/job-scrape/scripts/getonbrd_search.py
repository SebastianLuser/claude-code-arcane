"""
getonbrd_search.py - Search jobs on GetOnBoard's public API v0 (LATAM tech job board).

No authentication, no API key, no dependencies beyond the Python 3 standard
library. Mirrors the contract of linkedin_search.py so /job-scrape can use both
interchangeably.

Usage:
    python getonbrd_search.py search -q "<keywords>" [flags]
    python getonbrd_search.py detail <slug|url> [--format json|plain]

Search returns JSON:API records that already include the full job description,
so there is no per-job API call (the individual job endpoint is private/401).
`detail` finds the record through search and falls back to the SSR page's
schema.org JobPosting microdata for old or unindexed postings.

Full JDs are ~80% of a json payload: --brief truncates them for triage.
Public API is in beta and may change. Low volume, personal use.

Errors go to stderr as {"error": "...", "code": "..."} with exit code 1.
"""

import argparse
import calendar
import html
import json
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API_BASE = "https://www.getonbrd.com/api/v0"
SEARCH_URL = f"{API_BASE}/search/jobs"
PUBLIC_JOB_URL = "https://www.getonbrd.com/jobs"

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

MAX_RETRIES = 5
JOBAGE_ALL = 9999
PER_PAGE = 20

# Chars of description kept per result under --brief.
BRIEF_DESCRIPTION_CHARS = 300

STOPWORDS = {
    "y", "de", "e", "la", "el", "los", "las", "en", "para", "con", "a",
    "and", "the", "of", "at", "in", "remote", "hybrid",
}


def write_error(error, code):
    sys.stderr.write(json.dumps({"error": error, "code": code}) + "\n")


def _fetch(url, accept):
    """Fetch with exponential backoff on 429/5xx. Returns None on a 404."""
    delay = 0.5
    for attempt in range(MAX_RETRIES + 1):
        request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            retryable = e.code == 429 or e.code >= 500
            if not retryable or attempt == MAX_RETRIES:
                raise RuntimeError(f"Request failed: {e.code} {e.reason}") from None
            time.sleep(delay + random.random() * 0.5)
            delay = min(delay * 2, 8)
    raise RuntimeError("Request failed after max retries")


def json_fetch(url):
    body = _fetch(url, "application/json")
    return None if body is None else json.loads(body)


def html_fetch(url):
    return _fetch(url, "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8") or ""


BR_RE = re.compile(r"<\s*br\s*/?>", re.I)
BLOCK_END_RE = re.compile(r"</(p|li|ul|ol|div|h\d)>", re.I)
LI_OPEN_RE = re.compile(r"<li[^>]*>", re.I)
TAG_RE = re.compile(r"<[^>]+>")


def html_to_text(markup):
    """HTML -> plain text, preserving paragraph/list breaks as newlines."""
    if not markup:
        return None
    with_breaks = LI_OPEN_RE.sub("- ", BLOCK_END_RE.sub("\n", BR_RE.sub("\n", markup)))
    text = html.unescape(TAG_RE.sub("", with_breaks)).replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" ?\n ?", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text or None


def unix_to_iso_date(unix):
    if not unix:
        return None
    return time.strftime("%Y-%m-%d", time.gmtime(unix))


def normalize_job(record):
    """Normalize one JSON:API job record from /search/jobs into a flat dict."""
    attrs = record.get("attributes") or {}
    seniority = ((attrs.get("seniority") or {}).get("data") or {}).get("attributes", {}).get("name")
    company = ((attrs.get("company") or {}).get("data") or {}).get("attributes", {}).get("name")
    countries = attrs.get("countries") if isinstance(attrs.get("countries"), list) else []
    modality = attrs.get("remote_modality")

    location_parts = list(countries)
    if modality and "Remote" not in countries:
        location_parts.append(f"({modality})")

    description_parts = [
        attrs.get("description") or "",
        f"\nFunciones:\n{attrs['functions']}" if attrs.get("functions") else "",
        f"\nDeseable:\n{attrs['desirable']}" if attrs.get("desirable") else "",
    ]

    return {
        "id": str(record.get("id")),
        "title": attrs.get("title") or "(untitled)",
        "company": company,
        "location": ", ".join(location_parts) if location_parts else None,
        "date": unix_to_iso_date(attrs.get("published_at")),
        "url": (record.get("links") or {}).get("public_url")
        or f"{PUBLIC_JOB_URL}/{record.get('id')}",
        "seniority": seniority,
        "remote": attrs["remote"] if isinstance(attrs.get("remote"), bool) else None,
        "remote_modality": modality,
        "remote_zone": attrs.get("remote_zone"),
        "countries": countries,
        "salary_min_usd_month": attrs.get("min_salary"),
        "salary_max_usd_month": attrs.get("max_salary"),
        "applications_count": attrs.get("applications_count"),
        "description": html_to_text("\n".join(p for p in description_parts if p)),
    }


def slug_from_input(value):
    """Extract the job slug from a GetOnBoard URL (jobs/empleos, with or without category)."""
    match = re.search(
        r"getonbrd\.[a-z.]+/(?:jobs|empleos)/(?:[^/]+/)?([a-z0-9-]+)", value, re.I
    )
    if match:
        return match.group(1).lower()
    if re.fullmatch(r"[a-z0-9-]+", value, re.I):
        return value.lower()
    return None


def slug_tokens(slug):
    """Slug -> tokens, dropping the trailing short hash if present."""
    parts = slug.split("-")
    if len(parts) > 1 and re.fullmatch(r"[0-9a-f]{3,5}", parts[-1]):
        parts.pop()
    return parts


def brief_job(job):
    """
    Same shape as a normalized job with the description truncated, so a consumer
    can still keyword-match on the opening lines and knows when text was dropped.
    """
    full = job.get("description") or ""
    truncated = len(full) > BRIEF_DESCRIPTION_CHARS
    return {
        **job,
        "description": full[:BRIEF_DESCRIPTION_CHARS].rstrip() + "..." if truncated
        else job.get("description"),
        "description_truncated": truncated,
    }


def matches_remote(job, mode):
    mode = (mode or "").lower()
    if mode == "remote":
        return job["remote"] is True
    if mode == "hybrid":
        return job["remote_modality"] == "hybrid"
    if mode in ("onsite", "on-site"):
        return job["remote_modality"] == "no_remote"
    return True


def within_jobage(job, days):
    if not days or days <= 0 or days >= JOBAGE_ALL or not job["date"]:
        return True
    # timegm, not mktime: published_at is UTC, and mktime would read the date in
    # local time - off by an hour in any DST zone, which drops boundary-day jobs.
    published = calendar.timegm(time.strptime(job["date"], "%Y-%m-%d"))
    return (time.time() - published) <= days * 86400


def salary_col(job):
    if job["salary_min_usd_month"] is None and job["salary_max_usd_month"] is None:
        return "-"
    low = job["salary_min_usd_month"] if job["salary_min_usd_month"] is not None else "?"
    high = job["salary_max_usd_month"] if job["salary_max_usd_month"] is not None else "?"
    return f"{low}-{high}"


def build_search_url(args):
    params = [
        ("query", args.query),
        ("per_page", str(PER_PAGE)),
        ("page", str(args.page)),
        ("expand[]", "seniority"),
        ("expand[]", "company"),
    ]
    return f"{SEARCH_URL}?{urllib.parse.urlencode(params)}"


def render_table(jobs):
    if not jobs:
        return "No results."
    header = (
        "TITLE".ljust(36) + " " + "COMPANY".ljust(20) + " " + "USD/MO".ljust(10) + " "
        + "SENIORITY".ljust(11) + " " + "DATE".ljust(10) + " ID"
    )
    rows = [
        f"{(j['title'] or '')[:36]:<36} {(j['company'] or '-')[:20]:<20} {salary_col(j):<10} "
        f"{(j['seniority'] or '-')[:11]:<11} {(j['date'] or '-'):<10} {j['id']}"
        for j in jobs
    ]
    return "\n".join([header, "-" * len(header), *rows])


def render_plain(jobs):
    return "\n\n".join(
        f"{j['title']}\n  {j['company'] or '-'} · {j['location'] or '-'} · {salary_col(j)} USD/mes"
        f" · {j['seniority'] or '-'} · {j['date'] or '-'}\n  id: {j['id']}\n  {j['url']}"
        for j in jobs
    )


def run_search(args):
    try:
        data = json_fetch(build_search_url(args))
        if data is None or not isinstance(data.get("data"), list):
            write_error("Unexpected API response (no data array)", "BAD_RESPONSE")
            return 1

        jobs = [normalize_job(r) for r in data["data"]]
        jobs = [j for j in jobs if within_jobage(j, args.jobage) and matches_remote(j, args.remote)]
        if args.limit is not None and args.limit >= 0:
            jobs = jobs[: args.limit]

        if args.format == "table":
            sys.stdout.write(render_table(jobs) + "\n")
        elif args.format == "plain":
            sys.stdout.write(render_plain(jobs) + "\n")
        else:
            # Full JDs are ~80% of this payload, and a triage pass only needs the
            # structured fields; --brief truncates them so a multi-query run stays
            # cheap to read. Fetch `detail <slug>` for the shortlist's full text.
            payload = {
                "meta": {
                    "count": len(jobs),
                    "page": args.page,
                    "total_pages": (data.get("meta") or {}).get("total_pages"),
                    "brief": bool(args.brief),
                },
                "results": [brief_job(j) for j in jobs] if args.brief else jobs,
            }
            sys.stdout.write(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
        return 0
    except Exception as e:
        write_error(str(e), "SEARCH_FAILED")
        return 1


def build_queries(tokens):
    """
    The search API ANDs every term, so the full slug usually over-constrains.
    Try progressively more selective queries; the slug tail (stack + company)
    is the most distinctive part.
    """
    filtered = [t for t in tokens if t not in STOPWORDS]
    queries = [" ".join(tokens)]
    if len(filtered) != len(tokens):
        queries.append(" ".join(filtered))
    if len(filtered) > 4:
        queries.append(" ".join(filtered[-4:]))
    if len(filtered) > 3:
        queries.append(" ".join(filtered[-3:]))
    return [q for q in dict.fromkeys(queries) if len(q) >= 3]


def detail_via_search(slug):
    """Layer 1: find the record through the search endpoint (full data, no auth)."""
    for query in build_queries(slug_tokens(slug)):
        params = [
            ("query", query),
            ("per_page", str(PER_PAGE)),
            ("expand[]", "seniority"),
            ("expand[]", "company"),
        ]
        data = json_fetch(f"{SEARCH_URL}?{urllib.parse.urlencode(params)}")
        if data is None or not isinstance(data.get("data"), list):
            continue
        for record in data["data"]:
            if str(record.get("id")).lower() == slug:
                return normalize_job(record)
    return None


def micro_prop(markup, prop, start=0):
    """First text content of an itemprop, searching from a start offset."""
    match = re.search(rf'itemprop="{prop}"[^>]*>\s*([^<]+)', markup[start:], re.I)
    return match.group(1).strip() if match else None


def micro_number(markup, prop):
    raw = micro_prop(markup, prop)
    if not raw:
        return None
    digits = re.sub(r"[^\d]", "", raw)
    return int(digits) if digits else None


def detail_via_microdata(slug):
    """
    Layer 2 fallback: the SSR job page carries schema.org JobPosting microdata
    (itemprop attributes), which is more stable than the page markup itself.
    """
    markup = html_fetch(f"{PUBLIC_JOB_URL}/{slug}")
    if not markup:
        return None

    # Closed jobs drop the JobPosting itemtype but keep the itemprops,
    # so key off itemprop="title" instead of the itemtype wrapper.
    title = micro_prop(markup, "title")
    if not title:
        return None

    org_match = re.search(r'itemprop="hiringOrganization"', markup, re.I)
    company = micro_prop(markup, "name", org_match.start()) if org_match else None

    description = None
    desc_match = re.search(r'itemprop="description"', markup, re.I)
    if desc_match:
        # Slice from after the closing ">" of the tag that carries the itemprop,
        # so the attribute text itself never leaks into the extracted description.
        start = markup.index(">", desc_match.start()) + 1
        end = len(markup)
        for marker in (r'itemprop="skills"', r'id="job-apply', r"</main", r"</body"):
            found = re.search(marker, markup[start:], re.I)
            if found and found.start() > 0:
                end = min(end, start + found.start())
        description = html_to_text(markup[start:end])

    date_posted = micro_prop(markup, "datePosted")

    return {
        "closed": bool(re.search(r"Closed job|No longer accepting", markup, re.I)),
        "id": slug,
        "title": title,
        "company": company,
        "location": micro_prop(markup, "address"),
        "date": date_posted[:10] if date_posted else None,
        "url": f"{PUBLIC_JOB_URL}/{slug}",
        "seniority": micro_prop(markup, "qualifications"),
        "remote": None,
        "remote_modality": None,
        "remote_zone": None,
        "countries": [],
        "salary_min_usd_month": micro_number(markup, "minValue"),
        "salary_max_usd_month": micro_number(markup, "maxValue"),
        "applications_count": None,
        "description": description,
    }


def run_detail(args):
    slug = slug_from_input(args.id)
    if not slug:
        write_error(f'Could not parse a job slug from "{args.id}"', "BAD_ID")
        return 1
    try:
        job = detail_via_search(slug)
        via = "search-api"
        if not job:
            job = detail_via_microdata(slug)
            via = "microdata"
        if not job:
            write_error(
                "Job not found (search API and microdata fallback both missed)", "NOT_FOUND"
            )
            return 1

        if args.format == "plain":
            salary = (
                f"{salary_col(job)} USD/mes"
                if job["salary_min_usd_month"] is not None or job["salary_max_usd_month"] is not None
                else None
            )
            lines = [
                job["title"],
                f"{job['company'] or '-'} · {job['location'] or '-'}",
                "⚠ CERRADA - ya no acepta postulaciones" if job.get("closed") else "",
                "",
                f"Seniority: {job['seniority']}" if job["seniority"] else "",
                f"Salario: {salary}" if salary else "",
                f"Aplicantes: {job['applications_count']}"
                if job["applications_count"] is not None else "",
                f"Publicada: {job['date']}" if job["date"] else "",
                "",
                job["description"] or "(no description)",
                "",
                f"URL: {job['url']}",
            ]
            sys.stdout.write("\n".join(line for line in lines if line != "") + "\n")
        else:
            sys.stdout.write(json.dumps({"via": via, **job}, indent=2, ensure_ascii=False) + "\n")
        return 0
    except Exception as e:
        write_error(str(e), "DETAIL_FAILED")
        return 1


class JsonErrorParser(argparse.ArgumentParser):
    """Keep the CLI's error contract: a JSON line on stderr and exit code 1."""

    def error(self, message):
        code = "NO_QUERY" if "query" in message and "required" in message else "BAD_ARG"
        write_error(message, code)
        raise SystemExit(1)


def build_parser():
    parser = JsonErrorParser(
        prog="getonbrd_search.py",
        description="Search jobs on GetOnBoard (LATAM tech job board). No --location flag: "
        "GetOnBoard is LATAM/remote by nature; filter with --remote and read the countries "
        "field. Salary fields are USD/month when published.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    search = sub.add_parser("search", help="search job postings")
    search.add_argument("-q", "--query", required=True,
                        help="REQUIRED. Keywords; the API ANDs every term")
    search.add_argument("--jobage", type=int, default=JOBAGE_ALL,
                        help="posted within N days (client-side filter). Default: all")
    search.add_argument("--remote", choices=["remote", "hybrid", "onsite", "on-site"],
                        help="workplace type (client-side filter)")
    search.add_argument("--page", type=int, default=1, help="1-indexed page (20 results/page)")
    search.add_argument("-n", "--limit", type=int,
                        help="cap results emitted (client-side; 0 emits none)")
    search.add_argument("--brief", action="store_true",
                        help="json only: truncate each description to 300 chars")
    search.add_argument("--format", choices=["json", "table", "plain"], default="json")
    search.set_defaults(func=run_search)

    detail = sub.add_parser("detail", help="full detail of one posting")
    detail.add_argument("id", help="slug from search results, or any getonbrd.com job URL")
    detail.add_argument("--format", choices=["json", "plain"], default="json")
    detail.set_defaults(func=run_detail)

    return parser


def force_utf8_streams():
    """
    On Windows stdout defaults to cp1252, so a bullet or an accent in a JD raises
    UnicodeEncodeError the moment output is piped to a file. Node writes UTF-8
    unconditionally; Python has to be told.
    """
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def main():
    force_utf8_streams()
    args = build_parser().parse_args()
    if args.command == "search":
        if len(args.query) < 3:
            write_error(
                'the --query/-q flag must be at least 3 chars (e.g. -q "fullstack developer")',
                "NO_QUERY",
            )
            sys.exit(1)
        if args.page < 1:
            args.page = 1
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
