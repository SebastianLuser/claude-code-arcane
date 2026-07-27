"""
linkedin_search.py - Search jobs on LinkedIn's public jobs-guest endpoints.

Any country/region plus remote. No authentication, no API key, no dependencies
beyond the Python 3 standard library.

Usage:
    python linkedin_search.py search -l "<place>" [flags]
    python linkedin_search.py detail <id|url> [--format json|plain]

Ported from the TypeScript CLI vendored from MadsLorentzen/ai-job-search: skill
scripts run in the user's project without a build step, and TypeScript there
means requiring Node 24+ for native type stripping (see docs/coding-standards.md).

Personal use only. This reads LinkedIn's public job pages; automated access is
against LinkedIn's Terms of Service, so keep volume low and do not use it
commercially or for bulk data collection. Run it on your own responsibility.

Errors go to stderr as {"error": "...", "code": "..."} with exit code 1;
non-fatal diagnostics use the same shape with a "warning" key.
"""

import argparse
import html
import json
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

SEARCH_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
DETAIL_URL = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting"

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Below this size a response is empty/an error page, not a markup change.
MARKUP_SANITY_BYTES = 5000

MAX_RETRIES = 6
JOBAGE_ALL = 9999


def write_error(error, code):
    sys.stderr.write(json.dumps({"error": error, "code": code}) + "\n")


def write_warning(warning, code):
    """Non-fatal diagnostic on stderr. Same JSON-line shape, `warning` key."""
    sys.stderr.write(json.dumps({"warning": warning, "code": code}) + "\n")


def html_fetch(url):
    """Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404."""
    delay = 0.5
    for attempt in range(MAX_RETRIES + 1):
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": UA,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "X-Requested-With": "XMLHttpRequest",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return ""
            retryable = e.code == 429 or e.code >= 500
            if not retryable or attempt == MAX_RETRIES:
                raise RuntimeError(f"Request failed: {e.code} {e.reason}") from None
            time.sleep(delay + random.random() * 0.5)
            delay = min(delay * 2, 8)
    raise RuntimeError("Request failed after max retries")


def unescape(markup):
    """
    html.unescape plus &nbsp; -> plain space. U+00A0 is invisible in a diff and
    breaks keyword matching downstream, which is the whole point of pulling the JD.
    """
    return html.unescape(markup).replace("\xa0", " ")


def strip_tags(markup):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", markup)).strip()


def clean(markup):
    return unescape(strip_tags(markup))


CARD_SPLIT_RE = re.compile(r'data-entity-urn="urn:li:jobPosting:')
CARD_ID_RE = re.compile(r"^(\d+)")
CARD_LINK_RE = re.compile(r'class="base-card__full-link[^"]*"[^>]*href="([^"]+)"', re.I)
CARD_TITLE_RE = re.compile(r'class="base-search-card__title"[^>]*>(.*?)</h3>', re.I | re.S)
CARD_SR_ONLY_RE = re.compile(r'class="sr-only"[^>]*>(.*?)</span>', re.I | re.S)
CARD_SUBTITLE_RE = re.compile(r'class="base-search-card__subtitle"[^>]*>(.*?)</h4>', re.I | re.S)
CARD_HREF_RE = re.compile(r'href="([^"]+)"', re.I)
CARD_LOCATION_RE = re.compile(r'class="job-search-card__location"[^>]*>(.*?)</span>', re.I | re.S)
CARD_DATE_RE = re.compile(r'class="job-search-card__listdate[^"]*"[^>]*datetime="([^"]+)"', re.I)


def parse_job_cards(markup):
    """
    Parse the search response: a flat list of <li> job cards. We split on the
    job-posting URN and parse each chunk independently so one malformed card
    cannot break the rest.
    """
    results = []

    for chunk in CARD_SPLIT_RE.split(markup)[1:]:
        id_match = CARD_ID_RE.match(chunk)
        if not id_match:
            continue
        job_id = id_match.group(1)

        # Full link + title (title lives in the sr-only span or the <h3> title).
        link_match = CARD_LINK_RE.search(chunk)
        url = unescape(link_match.group(1)).split("?")[0] if link_match else ""

        title = None
        h3 = CARD_TITLE_RE.search(chunk)
        if h3:
            title = clean(h3.group(1))
        if not title:
            sr = CARD_SR_ONLY_RE.search(chunk)
            if sr:
                title = clean(sr.group(1))
        if not title:
            continue

        # Company (subtitle <h4> with optional inner <a>).
        company = None
        company_url = None
        sub = CARD_SUBTITLE_RE.search(chunk)
        if sub:
            href = CARD_HREF_RE.search(sub.group(1))
            if href:
                company_url = unescape(href.group(1)).split("?")[0]
            company = clean(sub.group(1)) or None

        # Location + date.
        loc = CARD_LOCATION_RE.search(chunk)
        location = (clean(loc.group(1)) or None) if loc else None
        date_match = CARD_DATE_RE.search(chunk)

        results.append(
            {
                "id": job_id,
                "title": title,
                "company": company,
                "companyUrl": company_url,
                "location": location,
                "date": date_match.group(1) if date_match else None,
                "url": url or f"https://www.linkedin.com/jobs/view/{job_id}",
            }
        )

    # Regex parsing degrades silently when LinkedIn changes its markup: a page
    # full of content yields zero cards, which reads exactly like "no job matches
    # the query". Warn so the caller can tell the two apart.
    if not results and len(markup) > MARKUP_SANITY_BYTES:
        write_warning(
            f"parsed 0 job cards out of a {len(markup)}-byte response; "
            "LinkedIn markup may have changed",
            "NO_CARDS_PARSED",
        )

    return results


DETAIL_TITLE_RE = re.compile(
    r'class="(?:top-card-layout__title|topcard__title)[^"]*"[^>]*>(.*?)</h[12]>', re.I | re.S
)
DETAIL_ORG_RE = re.compile(
    r'class="topcard__org-name-link[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', re.I | re.S
)
DETAIL_LOCATION_RE = re.compile(
    r'class="topcard__flavor topcard__flavor--bullet"[^>]*>(.*?)</span>', re.I | re.S
)
DETAIL_DESC_RE = re.compile(
    r'class="(?:show-more-less-html__markup|description__text[^"]*)"[^>]*>(.*?)</div>', re.I | re.S
)
DETAIL_CRITERIA_RE = re.compile(
    r'class="description__job-criteria-subheader"[^>]*>(.*?)</h3>'
    r'.*?class="description__job-criteria-text[^"]*"[^>]*>(.*?)</span>',
    re.I | re.S,
)
DETAIL_APPLY_RE = re.compile(r'class="topcard__link[^"]*"[^>]*href="([^"]+)"', re.I)
BR_RE = re.compile(r"<\s*br\s*/?>", re.I)
BLOCK_END_RE = re.compile(r"</(p|li|ul|ol|div|h\d)>", re.I)


def parse_job_detail(markup, job_id):
    """Parse the single-job detail page."""
    title_match = DETAIL_TITLE_RE.search(markup)
    org_match = DETAIL_ORG_RE.search(markup)
    company = (clean(org_match.group(2)) or None) if org_match else None
    company_url = unescape(org_match.group(1)).split("?")[0] if org_match else None

    loc_match = DETAIL_LOCATION_RE.search(markup)
    location = (clean(loc_match.group(1)) or None) if loc_match else None

    # Rich description block. Keep paragraph/line breaks as newlines.
    description = None
    desc_match = DETAIL_DESC_RE.search(markup)
    if desc_match:
        with_breaks = BLOCK_END_RE.sub("\n", BR_RE.sub("\n", desc_match.group(1)))
        description = re.sub(r"\n{3,}", "\n\n", unescape(strip_tags(with_breaks))).strip() or None

    # Job-criteria items: subheader label -> text value.
    criteria = {
        clean(label).lower(): clean(value)
        for label, value in DETAIL_CRITERIA_RE.findall(markup)
    }

    apply_match = DETAIL_APPLY_RE.search(markup)

    return {
        "id": job_id,
        "title": clean(title_match.group(1)) if title_match else "(untitled)",
        "company": company,
        "companyUrl": company_url,
        "location": location,
        "date": None,
        "url": f"https://www.linkedin.com/jobs/view/{job_id}",
        "description": description,
        "seniority": criteria.get("seniority level"),
        "employmentType": criteria.get("employment type"),
        "jobFunction": criteria.get("job function"),
        "industries": criteria.get("industries"),
        "applyUrl": unescape(apply_match.group(1)).split("?")[0] if apply_match else None,
    }


def jobage_to_tpr(days):
    """Convert a job-age in days to LinkedIn's f_TPR seconds value."""
    if not days or days <= 0 or days >= JOBAGE_ALL:
        return None
    return f"r{days * 86400}"


def work_type_flag(mode):
    """Workplace-type flag: on-site=1, remote=2, hybrid=3."""
    return {"remote": "2", "hybrid": "3", "onsite": "1", "on-site": "1"}.get((mode or "").lower())


def normalize_id(value):
    """
    Accept a raw job ID, a job-view URL, or a job URN. The ID may be followed by
    a slash as well as a query string: the share button yields URLs shaped like
    `/jobs/view/<id>/?refId=...`, so anchoring on `?` alone rejects the most
    common paste.
    """
    urn = re.search(r"urn:li:jobPosting:(\d+)", value)
    if urn:
        return urn.group(1)
    url = re.search(r"-(\d{6,})(?:[/?]|$)", value) or re.search(r"/(\d{6,})(?:[/?]|$)", value)
    if url:
        return url.group(1)
    if re.fullmatch(r"\d{6,}", value):
        return value
    return None


def build_search_url(args):
    params = []
    if args.query:
        params.append(("keywords", args.query))
    if args.location:
        params.append(("location", args.location))
    tpr = jobage_to_tpr(args.jobage)
    if tpr:
        params.append(("f_TPR", tpr))
    work_type = work_type_flag(args.remote)
    if work_type:
        params.append(("f_WT", work_type))
    params.append(("start", str((args.page - 1) * 10)))
    return f"{SEARCH_URL}?{urllib.parse.urlencode(params)}"


def render_table(cards):
    if not cards:
        return "No results."
    header = (
        "ID".ljust(11) + " " + "TITLE".ljust(42) + " " + "COMPANY".ljust(26) + " "
        + "LOCATION".ljust(24) + " DATE"
    )
    rows = [
        f"{c['id']:<11} {(c['title'] or '')[:42]:<42} {(c['company'] or '-')[:26]:<26} "
        f"{(c['location'] or '-')[:24]:<24} {c['date'] or '-'}"
        for c in cards
    ]
    return "\n".join([header, "-" * len(header), *rows])


def render_plain(cards):
    return "\n\n".join(
        f"{c['title']}\n  {c['company'] or '-'} · {c['location'] or '-'} · {c['date'] or '-'}\n"
        f"  id: {c['id']}\n  {c['url']}"
        for c in cards
    )


def run_search(args):
    try:
        cards = parse_job_cards(html_fetch(build_search_url(args)))
        if args.limit is not None and args.limit >= 0:
            cards = cards[: args.limit]

        if args.format == "table":
            sys.stdout.write(render_table(cards) + "\n")
        elif args.format == "plain":
            sys.stdout.write(render_plain(cards) + "\n")
        else:
            payload = {"meta": {"count": len(cards), "page": args.page}, "results": cards}
            sys.stdout.write(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
        return 0
    except Exception as e:
        write_error(str(e), "SEARCH_FAILED")
        return 1


def run_detail(args):
    job_id = normalize_id(args.id)
    if not job_id:
        write_error(f'Could not parse a job ID from "{args.id}"', "BAD_ID")
        return 1
    try:
        markup = html_fetch(f"{DETAIL_URL}/{job_id}")
        if not markup:
            write_error("Job not found", "NOT_FOUND")
            return 1
        job = parse_job_detail(markup, job_id)

        if args.format == "plain":
            lines = [
                job["title"],
                f"{job['company'] or '-'} · {job['location'] or '-'}",
                "",
                f"Seniority: {job['seniority']}" if job["seniority"] else "",
                f"Employment: {job['employmentType']}" if job["employmentType"] else "",
                f"Function: {job['jobFunction']}" if job["jobFunction"] else "",
                f"Industries: {job['industries']}" if job["industries"] else "",
                "",
                job["description"] or "(no description)",
                "",
                f"URL: {job['url']}",
                f"Apply: {job['applyUrl']}" if job["applyUrl"] else "",
            ]
            sys.stdout.write("\n".join(line for line in lines if line != "") + "\n")
        else:
            sys.stdout.write(json.dumps(job, indent=2, ensure_ascii=False) + "\n")
        return 0
    except Exception as e:
        write_error(str(e), "DETAIL_FAILED")
        return 1


class JsonErrorParser(argparse.ArgumentParser):
    """Keep the CLI's error contract: a JSON line on stderr and exit code 1."""

    def error(self, message):
        code = "NO_LOCATION" if "location" in message and "required" in message else "BAD_ARG"
        write_error(message, code)
        raise SystemExit(1)


def build_parser():
    parser = JsonErrorParser(
        prog="linkedin_search.py",
        description="Search jobs on LinkedIn (any country/region, plus remote). "
        "Personal use only - uses LinkedIn's public pages; keep volume low (LinkedIn ToS).",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    search = sub.add_parser("search", help="search job postings")
    search.add_argument("-l", "--location", required=True,
                        help='REQUIRED. e.g. "Berlin, Germany", "Spain", "Remote"')
    search.add_argument("-q", "--query", help="keywords (job title, skill, or role)")
    search.add_argument("--jobage", type=int, default=JOBAGE_ALL,
                        help="posted within N days: 1, 7, 14, 30. Default: all")
    search.add_argument("--remote", choices=["remote", "hybrid", "onsite", "on-site"],
                        help="filter by workplace type")
    search.add_argument("--page", type=int, default=1, help="1-indexed page (10 results/page)")
    search.add_argument("-n", "--limit", type=int,
                        help="cap results emitted (client-side; 0 emits none)")
    search.add_argument("--format", choices=["json", "table", "plain"], default="json")
    search.set_defaults(func=run_search)

    detail = sub.add_parser("detail", help="full detail of one posting")
    detail.add_argument("id", help="job ID, jobs/view URL (with or without trailing slash), or URN")
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
    if getattr(args, "page", 1) < 1:
        args.page = 1
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
