#!/usr/bin/env python3
"""
Searches freelance projects in public sources, with no API key.

Every source included meets three conditions, because this repo is public and
anyone installs it: it needs no key or sign-up, its terms allow consuming it
from a local tool, and it exposes real freelance/contract work.

Two sources that look like candidates were left out on purpose (RemoteOK and
Remotive): their terms require a do-follow backlink from a website and
threaten to suspend access if it is missing. A local CLI has no website, so we
cannot comply, and using them anyway would get the user's IP suspended.
Details in ../references/platforms.md.

Watch the filters: neither GetOnBrd nor Himalayas filter by work type on the
server side. They accept the parameter, return 200, and send full-time anyway
(7 name variants were tried on GetOnBrd and 4 on Himalayas). That is why the
freelance filter is client-side and paging is needed to gather volume.

The monthly "Ask HN: Freelancer? Seeking freelancer?" thread is not in `search`
on purpose. Six months were measured with the `market` subcommand itself: 113
freelancers offering themselves against 2 job offers. As a source of projects it
is useless; as a source of what others charge and how they position
themselves, it is the best there is for free. That is why it lives in the
`market` subcommand, which is what it really is.

Searching by category hid real work: "ecommerce" returned 0 while there was a
Shopify web developer posting in the pool, because nobody titles a posting
"ecommerce". That is why `search` expands synonyms (see SYNONYMS) and queries
the server once per term: the server ranking depends on `query`, so searching
"ecommerce" never brings back the pool where the Shopify one lives. --no-expand
turns it off.

Usage:
  python freelance_search.py sources
  python freelance_search.py search --query "unity developer" --source all
  python freelance_search.py search --query python --source getonbrd --pages 3
  python freelance_search.py market --months 3
  python freelance_search.py detail --source getonbrd --id <id>

Output: JSON on stdout. Errors: JSON with "error" and "code" on stdout, exit 1.
Stdlib only. Compatible with Python 3.9.
"""

from __future__ import annotations

import argparse
import collections
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from posting_guard import check, guard

UA = "Mozilla/5.0 (compatible; claude-code-arcane/freelance-scan; +https://github.com/SebastianLuser/claude-code-arcane)"
TIMEOUT = 30
MAX_RETRIES = 3
RETRY_SLEEP = 2

GETONBRD_API = "https://www.getonbrd.com/api/v0"
GETONBRD_JOBS = "https://www.getonbrd.com/jobs"
# /api/v0/modalities -> 1 Full time, 2 Part time, 3 Freelance, 4 Internship.
# Filtered by locale_key and not by id: with expand[] the id comes as the string
# "3" and without expand as the int 3, so comparing the id breaks silently.
GETONBRD_FREELANCE_KEY = "freelance"
# expand[] inlines the attributes of references. Without it, company and tags
# come as {"data":{"id":...}} and there is no name to show. Learned from
# job-scrape/scripts/getonbrd_search.py, which already used it.
GETONBRD_EXPAND = ("company", "tags", "modality")

HIMALAYAS_API = "https://himalayas.app/jobs/api"
HIMALAYAS_CONTRACT = "Contractor"
HIMALAYAS_PAGE = 20  # limit is capped at 20 even if you ask for more

HN_SEARCH = "https://hn.algolia.com/api/v1/search_by_date"
HN_ITEM = "https://hn.algolia.com/api/v1/items"
HN_THREAD_QUERY = '"Seeking freelancer"'
HN_HIRING = "seeking_freelancer"
HN_AVAILABLE = "seeking_work"

# Project sources. HN is not here: see `market` and the docstring above.
SOURCES = ("getonbrd", "himalayas")

# --------------------------------------------------------------------------- #
# Sources with a per-user credential
#
# They cannot join the automatic run: the key belongs to one person and anyone
# installs this repo. But leaving them out silently is worse, because the user
# never learns there is a source they could use. So they are declared here:
# `keys` explains how to get each one, and if the environment variable is set
# the source turns on by itself without touching anything else.
# --------------------------------------------------------------------------- #

UPWORK_GRAPHQL = "https://api.upwork.com/graphql"

KEYED_SOURCES = {
    "upwork": {
        "env": "UPWORK_ACCESS_TOKEN",
        "scope": "the largest marketplace; projects from all over the world",
        "how_to_get": [
            "Open the API Center of your Upwork account (freelancer or client, any plan).",
            "Request a new API key. No company account is needed.",
            "Upwork reviews it by hand and answers by email in ~1 week.",
            "Complete the account details before requesting it: the most common rejection is incomplete data.",
            "With the client id and secret, get an OAuth 2.0 access token and export it in UPWORK_ACCESS_TOKEN.",
        ],
        "limits": "40,000 requests per day, 10 per second per IP",
        "cannot_do": (
            "there is no mutation to send a proposal or spend Connects: "
            "Upwork closed it on purpose against auto-bidding. Applying is still done by hand"
        ),
        "doc": "https://www.upwork.com/developer/documentation/graphql/api/docs/index.html",
    },
    "freelancer": {
        "env": "FREELANCER_OAUTH_TOKEN",
        "scope": "global marketplace, lots of volume and lots of price competition",
        "how_to_get": [
            "Create an app in the developer section of Freelancer.com.",
            "It is self-service: there is no manual review like on Upwork.",
            "Export the token in FREELANCER_OAUTH_TOKEN.",
        ],
        "limits": "not published",
        "cannot_do": "the adapter is not written yet; the guide is here for whoever wants to write it",
        "doc": "https://developers.freelancer.com/",
        "adapter": False,
    },
}

# Synonym expansion.
#
# Nobody titles a posting "ecommerce": they title it "Shopify" or "WooCommerce".
# The full pool of both sources was measured (29 freelance postings) and
# searching "ecommerce" returned 0 while a Shopify web developer posting was in
# it; "website" returned 0 with a WordPress specialist and an Astro technical
# partner posting present. Searching by category hid real work.
#
# The key is the word the freelancer thinks; the values are the ones the client
# writes. It only expands downward (category -> technologies): the other way
# would inflate the results of someone already searching precisely.
#
# The map lives in synonyms.<lang>.json next to this script (synonyms.en.json,
# synonyms.es.json): GetOnBrd is a LatAm board, users search in Spanish and the
# postings are written in Spanish, so every pack applies at once. Unity and game
# design are in because they are the user's profile, not because the map
# targets gamedev: Unreal and Godot are left out on purpose.
def load_synonyms() -> dict:
    """Every synonyms.<lang>.json, in file-name order; a shared key appends the later pack's values."""
    here = os.path.dirname(os.path.abspath(__file__))
    merged: dict = {}
    for name in sorted(os.listdir(here)):
        if name.startswith("synonyms.") and name.endswith(".json"):
            with open(os.path.join(here, name), encoding="utf-8") as handle:
                for key, values in json.load(handle)["synonyms"].items():
                    known = merged.setdefault(key, [])
                    known.extend(v for v in values if v not in known)
    return merged


SYNONYMS = load_synonyms()
MAX_EXPANDED_TERMS = 6  # cap on extra terms: each one is one more request

RATE_PATTERNS = (
    r"(?:USD|US\$|\$|EUR|€)\s?(\d{1,4})(?:\s?[-a]\s?(?:USD|US\$|\$|EUR|€)?\s?(\d{1,4}))?\s?(?:/|per\s)\s?(hour|hr|h|day|d|week|wk|month|mo)",
    r"(\d{1,4})(?:\s?[-a]\s?(\d{1,4}))?\s?(?:USD|US\$|\$|EUR|€)\s?(?:/|per\s)\s?(hour|hr|h|day|d|week|wk|month|mo)",
)


class SourceError(RuntimeError):
    pass


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    last = ""
    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                return response.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            # 4xx is not retried: it is not going to change.
            if 400 <= e.code < 500 and e.code != 429:
                raise SourceError("HTTP {0} {1}".format(e.code, e.reason))
            last = "HTTP {0} {1}".format(e.code, e.reason)
        except Exception as e:  # timeout, DNS, reset
            last = "{0}: {1}".format(type(e).__name__, e)
        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_SLEEP * (attempt + 1))
    raise SourceError(last or "request failed")


def fetch_json(url: str):
    body = fetch(url)
    try:
        return json.loads(body)
    except ValueError as e:
        raise SourceError("response is not JSON: {0}".format(e))


def strip_html(raw: str) -> str:
    """Visible text of a posting: posting_guard removes hidden content and invisible characters."""
    return guard(raw or "", "html")[0]


# Commas and spaces separate terms. Spaces alone are not enough:
# "typescript,backend" is the natural way to write a list, and splitting only
# on spaces searched that literal string, which appears in no posting. The
# result was zero hits, read as "there is no work" instead of "I searched for
# nothing".
TERM_SEPARATOR = r"[,\s]+"


def expand_query(query: str):
    """
    Returns (search_terms, applied_expansions).

    The first term is always what the user typed: it is the one paged in depth.
    Synonyms come after and are queried more shallowly.
    """
    words = [w for w in re.split(TERM_SEPARATOR, (query or "").strip().lower()) if w]
    terms = list(words)
    applied = {}
    for word in words:
        extra = [s for s in SYNONYMS.get(word, []) if s not in terms]
        if not extra:
            continue
        room = MAX_EXPANDED_TERMS - (len(terms) - len(words))
        if room <= 0:
            break
        applied[word] = extra[:room]
        terms.extend(applied[word])
    return terms, applied


def matches_terms(terms, *fields) -> bool:
    """
    Client-side relevance check.

    GetOnBrd's search ranks by relevance, it does not filter: `query=unity`
    returns 21 pages where the last ones have nothing to do with it (SAP, COBOL,
    a recruiter). Paging in depth and keeping the freelance part of that long
    tail gives junk relevant to nothing.

    ONE term appearing is enough: "unity developer" has to bring the ones that
    say Unity even if they do not say developer, and with expansion "ecommerce"
    has to bring the Shopify ones.

    Matches on word boundaries, not substrings. In this domain many two-letter
    searches are legitimate (go, ux, ai, qa) and by substring "ux" would match
    inside "Linux" and "go" inside "Django". The cost is that searching
    "script" no longer finds "JavaScript"; that cost is preferred over
    returning Linux postings to someone searching for UX.

    Terms with non-alphanumeric characters (c#, .net, node.js, react native)
    fall back to substring: \\b does not work against `#`, `.` or the inner
    space of a two-word term.
    """
    terms = [t for t in (terms or []) if t]
    if not terms:
        return True
    haystack = " ".join(str(f or "") for f in fields).lower()
    for term in terms:
        if term.isalnum():
            if re.search(r"\b{0}\b".format(re.escape(term)), haystack):
                return True
        elif term in haystack:
            return True
    return False


def matches_query(query: str, *fields) -> bool:
    """Version without expansion, splitting the query into words."""
    return matches_terms([t for t in re.split(r"\s+", (query or "").strip().lower()) if t], *fields)


def record(**kw):
    """Common shape so /freelance-scan's dedup treats everything the same."""
    base = {
        "source": None, "id": None, "title": None, "company": None, "url": None,
        "modality": None, "published_at": None, "location": None,
        "salary_min": None, "salary_max": None, "tags": [], "excerpt": None,
    }
    base.update(kw)
    # The posting is third-party text: posting_guard's verdict travels with the
    # record only when it raises an alarm, so clean results get no extra field.
    _, integrity = check("\n".join(str(base.get(k) or "") for k in ("title", "excerpt", "description")), "text")
    if "flags" in integrity:
        base["integrity"] = integrity
    return base


# --------------------------------------------------------------------------- #
# GetOnBrd: LatAm + remote. Shares its API with /job-scrape, no key.
# --------------------------------------------------------------------------- #

def expanded_name(node):
    """Gets the name of an expanded JSON:API reference, or None."""
    data = (node or {}).get("data") or {}
    return ((data.get("attributes") or {}).get("name")) or None


def expanded_names(node):
    data = (node or {}).get("data") or []
    if isinstance(data, dict):
        data = [data]
    return [n for n in ((item.get("attributes") or {}).get("name") for item in data) if n]


def getonbrd_search(query: str, pages: int, per_page: int = 50, terms=None):
    """
    `query` drives the pool the server returns; `terms` filters what stays.

    Both are needed and they are not the same: the server ranks by relevance
    to `query`, so searching "ecommerce" never brings back the pool where the
    Shopify web developer posting lives. That is why the caller calls once per
    expanded term and dedupes; here only one is resolved.
    """
    terms = terms if terms is not None else [query]
    out = []
    truncated = False
    scanned = 0
    irrelevant = 0
    for page in range(1, pages + 1):
        params = [("query", query), ("per_page", str(per_page)), ("page", str(page))]
        params += [("expand[]", field) for field in GETONBRD_EXPAND]
        payload = fetch_json("{0}/search/jobs?{1}".format(GETONBRD_API, urllib.parse.urlencode(params)))
        data = payload.get("data") or []
        scanned += len(data)
        for job in data:
            attrs = job.get("attributes") or {}
            modality = (attrs.get("modality") or {}).get("data") or {}
            if ((modality.get("attributes") or {}).get("locale_key")) != GETONBRD_FREELANCE_KEY:
                continue
            tags = expanded_names(attrs.get("tags"))
            # Order matters: relevance is checked AFTER the work type, so
            # `irrelevant` counts only freelance dropped for being off-topic,
            # which is the number that tells the user to refine the query.
            if not matches_terms(terms, attrs.get("title"), " ".join(tags),
                                 attrs.get("description_headline")):
                irrelevant += 1
                continue
            out.append(record(
                source="getonbrd",
                id=str(job.get("id")),
                title=attrs.get("title"),
                company=expanded_name(attrs.get("company")),
                url="{0}/{1}".format(GETONBRD_JOBS, job.get("id")),
                modality="freelance",
                published_at=attrs.get("published_at"),
                location=attrs.get("remote_modality") or ", ".join(attrs.get("location_cities") or []),
                salary_min=attrs.get("min_salary"),
                salary_max=attrs.get("max_salary"),
                tags=tags,
                excerpt=(attrs.get("description_headline") or "")[:400] or None,
            ))
        total_pages = (payload.get("meta") or {}).get("total_pages") or 1
        if page >= total_pages:
            break
        if page == pages and total_pages > pages:
            truncated = True
    return out, truncated, scanned, irrelevant


def getonbrd_detail(job_id: str):
    payload = fetch_json("{0}/jobs/{1}".format(GETONBRD_API, urllib.parse.quote(str(job_id))))
    data = payload.get("data") or {}
    attrs = data.get("attributes") or {}
    _, integrity = check("\n".join(attrs.get(k) or "" for k in ("description", "functions", "desirable")))
    return {
        "source": "getonbrd",
        "id": str(data.get("id") or job_id),
        "title": attrs.get("title"),
        "url": "{0}/{1}".format(GETONBRD_JOBS, data.get("id") or job_id),
        "modality_id": (((attrs.get("modality") or {}).get("data") or {}).get("id")),
        "description": strip_html(attrs.get("description") or ""),
        "desirable": strip_html(attrs.get("desirable") or ""),
        "functions": strip_html(attrs.get("functions") or ""),
        "min_salary": attrs.get("min_salary"),
        "max_salary": attrs.get("max_salary"),
        "remote_modality": attrs.get("remote_modality"),
        "tags": attrs.get("tags") or [],
        "integrity": integrity,
    }


# --------------------------------------------------------------------------- #
# Himalayas: global remote. employmentType "Contractor" exists but does not filter.
# --------------------------------------------------------------------------- #

def himalayas_search(query: str, pages: int, terms=None):
    """Himalayas returns a single feed, so expansion only applies to the filter."""
    terms = terms if terms is not None else [query]
    out = []
    truncated = False
    scanned = 0
    irrelevant = 0
    for page in range(pages):
        params = urllib.parse.urlencode({"limit": HIMALAYAS_PAGE, "offset": page * HIMALAYAS_PAGE})
        payload = fetch_json("{0}?{1}".format(HIMALAYAS_API, params))
        jobs = payload.get("jobs") or []
        if not jobs:
            break
        scanned += len(jobs)
        for job in jobs:
            if job.get("employmentType") != HIMALAYAS_CONTRACT:
                continue
            if not matches_terms(terms, job.get("title"), job.get("excerpt"),
                                 " ".join(job.get("categories") or [])):
                irrelevant += 1
                continue
            out.append(record(
                source="himalayas",
                id=str(job.get("guid") or job.get("applicationLink")),
                title=job.get("title"),
                company=job.get("companyName"),
                url=job.get("applicationLink"),
                modality="contract",
                published_at=job.get("pubDate"),
                location=", ".join(job.get("locationRestrictions") or []) or "remote",
                salary_min=job.get("minSalary"),
                salary_max=job.get("maxSalary"),
                tags=job.get("categories") or [],
                excerpt=(job.get("excerpt") or "")[:400] or None,
            ))
        total = payload.get("totalCount")
        if total and (page + 1) * HIMALAYAS_PAGE >= total:
            break
        if page + 1 == pages:
            truncated = True
    return out, truncated, scanned, irrelevant


# --------------------------------------------------------------------------- #
# Hacker News: the monthly "Freelancer? Seeking freelancer?" thread.
#
# This is NOT a project finder, even if the thread title suggests it. Six
# months were measured (March to August 2026): 113 comments from freelancers
# offering themselves against 2 job offers. What it does give you, for free, is
# how others with your profile present themselves and how much they charge.
# That feeds /freelance-profile and the rate decision.
# --------------------------------------------------------------------------- #

# --------------------------------------------------------------------------- #
# WebSearch result triage
#
# WebSearch is the only path that reaches the marketplaces without a
# credential, but ~half of what it returns are not postings: they are "Hire
# Golang developers" landings, rate tables and Project Catalog gigs. They are
# separated by URL pattern, which is the deterministic part and that is why it
# lives here and not in the model's judgment.
#
# Whatever matches no pattern stays `unknown` on purpose. Guessing puts
# landings in the queue, and a queue with junk stops being looked at.
# --------------------------------------------------------------------------- #

URL_RULES = (
    ("upwork", r"(^|\.)upwork\.com$", (
        r"/jobs?/[^/]*~[0-9a-z]+",          # /job/Slug_~017abc...
        r"/freelance-jobs/apply/[^/]*~",    # /apply/ variant
    ), (
        r"/hire/", r"/services/product/", r"/services/",
        r"/freelance-jobs/[a-z]{2}/", r"/developer", r"/support",
        r"/nx/search/",                     # the search page, not a posting
    )),
    ("workana", r"(^|\.)workana\.com$", (
        r"/job/[^/?]+$",
        r"/(es|en|pt)/job/[^/?]+$",
    ), (
        r"/hire/", r"/skill/", r"/jobs\b", r"/work/",
    )),
    ("freelancer", r"(^|\.)freelancer\.(com|[a-z]{2})$", (
        r"/projects/[^/]+/[^/]+",
    ), (
        r"/jobs/", r"/freelancers/", r"/hire/",
    )),
    ("peopleperhour", r"(^|\.)peopleperhour\.com$", (
        r"/freelance-job/", r"/job/[^/?]+",
    ), (
        r"/hire-freelancers/", r"/freelance-[a-z-]+-jobs$", r"/site/",
    )),
    ("guru", r"(^|\.)guru\.com$", (
        r"/jobs/[^/]+/\d+",
    ), (
        r"/m/hire/", r"/m/find/", r"/d/jobs/browse/", r"/help/",
    )),
)


def classify_url(url: str):
    """
    Returns (platform, verdict) where verdict is posting | landing | unknown.

    Only the path is looked at: query parameters change per session and per
    campaign, so putting them in the decision makes it unstable.
    """
    try:
        parts = urllib.parse.urlsplit(url)
    except ValueError:
        return None, "unknown"

    host = (parts.netloc or "").lower().split(":")[0]
    path = parts.path or "/"

    for name, host_re, posting_res, landing_res in URL_RULES:
        if not re.search(host_re, host):
            continue
        for pattern in posting_res:
            if re.search(pattern, path, re.IGNORECASE):
                return name, "posting"
        for pattern in landing_res:
            if re.search(pattern, path, re.IGNORECASE):
                return name, "landing"
        return name, "unknown"

    return None, "unknown"


def triage_urls(urls):
    postings, landings, unknown, other = [], [], [], []
    seen = set()
    for raw in urls:
        url = (raw or "").strip()
        if not url or url in seen:
            continue
        seen.add(url)
        platform, verdict = classify_url(url)
        row = {"url": url, "platform": platform}
        if platform is None:
            other.append(row)
        elif verdict == "posting":
            postings.append(row)
        elif verdict == "landing":
            landings.append(row)
        else:
            unknown.append(row)

    by_platform = {}
    for row in postings:
        by_platform[row["platform"]] = by_platform.get(row["platform"], 0) + 1

    return {
        # The only thing worth opening. The rest is reported so you can see how
        # much noise the search brought, not to hide it.
        "postings": postings,
        "postings_by_platform": by_platform,
        "discarded_landings": landings,
        "unclassified": unknown,
        "outside_known_platforms": other,
        "total_received": len(seen),
        "warning": (
            "The search index does not filter by date: these URLs can be old. "
            "Check the date when opening each one before investing time."
        ),
    }


# --------------------------------------------------------------------------- #
# Upwork (opt-in, requires UPWORK_ACCESS_TOKEN)
# --------------------------------------------------------------------------- #

# The query is kept separate so it can be adjusted without touching the logic.
# It comes from Upwork's GraphQL docs; transport and parsing are tested against
# a fixed payload, but the exact shape of the query could not be verified
# against the real API because it needs an approved key. If Upwork renamed a
# field, the error below says so with the server's message in hand.
UPWORK_QUERY = """
query marketplaceJobPostings($filter: MarketplaceJobPostingsSearchFilter,
                             $pagination: PaginationInput) {
  marketplaceJobPostingsSearch(marketPlaceJobFilter: $filter,
                               searchType: USER_JOBS_SEARCH,
                               pagination: $pagination) {
    totalCount
    edges {
      node {
        id
        title
        description
        ciphertext
        duration
        engagement
        createdDateTime
        amount { rawValue currency }
        hourlyBudgetMin { rawValue }
        hourlyBudgetMax { rawValue }
        client { totalHires totalSpent { rawValue } verificationStatus location { country } }
        skills { name }
      }
    }
  }
}
"""


def upwork_token():
    return os.environ.get(KEYED_SOURCES["upwork"]["env"], "").strip()


def _walk_nodes(obj, out, depth=0):
    """
    Collects the `node`s of any GraphQL connection without assuming the nesting.

    Upwork changed the response shape at least once; walking the tree costs
    little and keeps an extra level from breaking everything with a KeyError.
    """
    if depth > 8:
        return
    if isinstance(obj, dict):
        if "node" in obj and isinstance(obj["node"], dict):
            out.append(obj["node"])
            return
        for value in obj.values():
            _walk_nodes(value, out, depth + 1)
    elif isinstance(obj, list):
        for value in obj:
            _walk_nodes(value, out, depth + 1)


def _money(node, *path):
    cur = node
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    if isinstance(cur, dict):
        cur = cur.get("rawValue")
    return cur


def upwork_search(query: str, pages: int, terms=None):
    token = upwork_token()
    if not token:
        raise SourceError(
            "{0} is missing. Run `keys` to see how to get the credential".format(
                KEYED_SOURCES["upwork"]["env"]
            )
        )

    found, seen = [], 0
    for page in range(max(1, pages)):
        payload = json.dumps({
            "query": UPWORK_QUERY,
            "variables": {
                "filter": {"titleExpression_eq": query or "developer"},
                "pagination": {"first": 50, "after": str(page * 50)},
            },
        }).encode("utf-8")

        req = urllib.request.Request(
            UPWORK_GRAPHQL,
            data=payload,
            headers={
                "Authorization": "Bearer {0}".format(token),
                "Content-Type": "application/json",
                "User-Agent": UA,
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                body = json.loads(resp.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:300] if exc.fp else ""
            if exc.code in (401, 403):
                raise SourceError(
                    "Upwork rejected the token ({0}). It may be expired: OAuth 2.0 access "
                    "tokens expire and have to be refreshed. {1}".format(exc.code, detail)
                )
            raise SourceError("Upwork HTTP {0}: {1}".format(exc.code, detail))
        except Exception as exc:  # noqa: BLE001
            raise SourceError("Upwork unreachable: {0}".format(exc))

        # GraphQL answers 200 with the errors inside, so they have to be checked.
        if body.get("errors"):
            msgs = "; ".join(str(e.get("message", e))[:160] for e in body["errors"][:3])
            raise SourceError(
                "Upwork returned GraphQL errors: {0}. If it mentions an unknown field, "
                "adjust UPWORK_QUERY: the schema may have changed.".format(msgs)
            )

        nodes = []
        _walk_nodes(body.get("data"), nodes)
        if not nodes:
            break

        for node in nodes:
            seen += 1
            title = node.get("title") or ""
            desc = strip_html(node.get("description") or "")
            skills = " ".join(s.get("name", "") for s in (node.get("skills") or [])
                              if isinstance(s, dict))
            if not matches_terms(terms, title, desc, skills):
                continue
            client = node.get("client") or {}
            cipher = node.get("ciphertext") or ""
            found.append(record(
                source="upwork",
                id=node.get("id"),
                title=title,
                description=desc[:600],
                url="https://www.upwork.com/jobs/{0}".format(cipher) if cipher else None,
                modality="freelance",
                published=node.get("createdDateTime"),
                engagement=node.get("engagement"),
                duration=node.get("duration"),
                budget=_money(node, "amount"),
                hourly_min=_money(node, "hourlyBudgetMin"),
                hourly_max=_money(node, "hourlyBudgetMax"),
                client_hires=client.get("totalHires"),
                client_spent=_money(client, "totalSpent"),
                client_verified=client.get("verificationStatus"),
                client_country=(client.get("location") or {}).get("country"),
                tags=[s.get("name") for s in (node.get("skills") or []) if isinstance(s, dict)],
            ))

        if len(nodes) < 50:
            break

    return found, seen, 0


def hn_latest_threads(limit: int = 3):
    params = urllib.parse.urlencode({
        "query": HN_THREAD_QUERY, "tags": "story", "hitsPerPage": limit,
    })
    payload = fetch_json("{0}?{1}".format(HN_SEARCH, params))
    return [
        {"id": h.get("objectID"), "title": h.get("title"),
         "created_at": h.get("created_at"), "num_comments": h.get("num_comments")}
        for h in (payload.get("hits") or [])
    ]


def hn_classify(text: str) -> str:
    """The thread's convention: the comment starts by declaring which side it is on."""
    head = re.sub(r"[^A-Za-z ]", " ", text[:110]).upper()
    head = re.sub(r"\s+", " ", head)
    if "SEEKING FREELANCER" in head:
        return HN_HIRING
    if "SEEKING WORK" in head:
        return HN_AVAILABLE
    return "unknown"


def extract_rates(text: str):
    """Rates mentioned in the text. Returns what it finds, without inventing."""
    found = []
    for pattern in RATE_PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            low, high, unit = m.group(1), m.group(2), m.group(3).lower()
            unit = {"hr": "hour", "h": "hour", "d": "day", "wk": "week", "mo": "month"}.get(unit, unit)
            found.append({"min": int(low), "max": int(high) if high else None,
                          "unit": unit, "quote": m.group(0).strip()})
    return found


def hn_market(months: int, query: str):
    """Positioning intelligence, not postings. See the comment above."""
    profiles, offers, counts = [], [], collections.Counter()
    threads_read = []

    for thread in hn_latest_threads(months):
        payload = fetch_json("{0}/{1}".format(HN_ITEM, thread["id"]))
        threads_read.append({"title": thread["title"], "id": thread["id"],
                             "created_at": thread["created_at"]})
        for child in (payload.get("children") or []):
            if child.get("type") != "comment":
                continue
            text = strip_html(child.get("text") or "")
            if not text:
                continue
            kind = hn_classify(text)
            counts[kind] += 1
            if query and query.strip().lower() not in text.lower():
                continue
            first = next((line.strip() for line in text.splitlines() if line.strip()), "")
            entry = {
                "author": child.get("author"),
                "created_at": child.get("created_at"),
                "url": "https://news.ycombinator.com/item?id={0}".format(child.get("id")),
                "headline": first[:160],
                "rates_mentioned": extract_rates(text),
                "excerpt": text[:700],
            }
            if kind == HN_HIRING:
                offers.append(entry)
            else:
                profiles.append(entry)

    rates = [r for p in profiles for r in p["rates_mentioned"]]
    return {
        "threads_read": threads_read,
        "composition": dict(counts),
        "note": ("The thread is dominated by freelancers offering themselves, not clients looking. "
                 "Use it for positioning and rates, not as a work queue. "
                 "Only ~3% of profiles state a parseable rate: always check the n "
                 "of rates_summary before treating the median as market data."),
        "competitor_profiles": profiles,
        "actual_offers": offers,
        "rates_found": rates,
        "rates_summary": rate_summary(rates),
    }


def rate_summary(rates):
    by_unit = {}
    for r in rates:
        by_unit.setdefault(r["unit"], []).append(r["min"])
    out = {}
    for unit, values in by_unit.items():
        values.sort()
        mid = len(values) // 2
        out[unit] = {
            "n": len(values), "min": values[0], "max": values[-1],
            "median": values[mid] if len(values) % 2 else (values[mid - 1] + values[mid]) / 2,
        }
    return out


# --------------------------------------------------------------------------- #

def run_search(args) -> int:
    if args.source == "all":
        # Keyed sources join by themselves when the variable is set. Without it
        # they are not tried, because they would fail on every run and the
        # user would learn to ignore the errors.
        wanted = list(SOURCES) + [
            name for name, spec in KEYED_SOURCES.items()
            if spec.get("adapter", True) and os.environ.get(spec["env"], "").strip()
        ]
    else:
        wanted = [args.source]
    base_query = args.query or "developer"

    if args.no_expand:
        terms, applied = [t for t in re.split(TERM_SEPARATOR, base_query.lower()) if t], {}
    else:
        terms, applied = expand_query(base_query)

    results, errors, truncated, scanned = [], {}, [], {}
    by_id = {}

    for name in wanted:
        try:
            if name == "getonbrd":
                # One request per term: the server ranks by `query`, so
                # "ecommerce" and "shopify" return different pools. The user's
                # term is paged deep; synonyms get one page (the top of the
                # relevance ranking is what matters and each one costs a request).
                found, seen, off, cut = [], 0, 0, False
                for i, term in enumerate(terms):
                    depth = args.pages if i < len(re.split(r"\s+", base_query.strip())) else 1
                    got, c, s, o = getonbrd_search(term, depth, terms=terms)
                    found.extend(got)
                    seen += s
                    off += o
                    cut = cut or c
            elif name == "upwork":
                found, seen, off = upwork_search(base_query, args.pages, terms=terms)
                cut = False
            else:
                found, cut, seen, off = himalayas_search(base_query, args.pages, terms=terms)

            fresh = 0
            for row in found:
                key = (row["source"], row["id"])
                if key in by_id:
                    continue
                by_id[key] = row
                results.append(row)
                fresh += 1
            scanned[name] = {"scanned": seen, "freelance": fresh,
                             "freelance_but_irrelevant": off}
            if cut:
                truncated.append(name)
        except SourceError as e:
            # One source down does not invalidate the others: report and move on.
            errors[name] = str(e)

    if errors and not results:
        emit({"error": "all sources failed", "code": "ALL_SOURCES_FAILED", "detail": errors})
        return 1

    emit({
        "query": args.query,
        # What was actually searched. Without this the user does not understand
        # why an "ecommerce" search brought a Shopify posting.
        "terms_searched": terms,
        "synonyms_applied": applied,
        "sources_requested": list(wanted),
        "sources_failed": errors,
        # Yield per source is always reported: filtering freelance client-side
        # means dropping a lot, and that has to be visible instead of looking
        # like the source has nothing. A high `freelance_but_irrelevant` means
        # the query is too broad for the source's catalog.
        "yield_by_source": scanned,
        "truncated": truncated,
        "count": len(results),
        "results": results,
    })
    return 0


def run_sources(_args) -> int:
    emit({"project_sources": [
        {"name": "getonbrd", "scope": "LatAm and remote", "auth": "none",
         "freelance_filter": "client-side (modality id 3); the server parameter does not filter",
         "shares_cli_with": "job-scrape"},
        {"name": "himalayas", "scope": "global remote", "auth": "none",
         "freelance_filter": "client-side (employmentType Contractor); the server parameter does not filter",
         "note": "limit capped at 20 per page"},
    ], "market_intel_only": [
        {"name": "hn", "subcommand": "market", "auth": "none (10k req/hour)",
         "why_not_projects": ("measured over 6 months: 113 freelancers offering themselves against 2 offers. "
                              "Useful for rates and positioning, not as a work queue")},
    ], "keyed_sources": [
        {"name": name, "env": spec["env"],
         "configured": bool(os.environ.get(spec["env"], "").strip()),
         "detail": "run `keys` to see how to get it"}
        for name, spec in KEYED_SOURCES.items()
    ], "excluded": [
        {"name": "remoteok", "why": "its terms require a do-follow backlink or they suspend access; a local CLI cannot comply"},
        {"name": "remotive", "why": "mandatory do-follow backlink, at most 4 requests per day and data delayed 24h"},
        {"name": "jobicy", "why": "no key and terms we can meet, but 99 of 100 postings are full-time and jobType=contract returns HTTP 400"},
        {"name": "workingnomads", "why": "no contract type field: no way to filter freelance without guessing from the title"},
        {"name": "workana", "why": "no public API or RSS (404 on the three routes tried). Searched with WebSearch and opened by hand"},
        {"name": "peopleperhour", "why": "no RSS, and its robots.txt forbids the filtered URLs a search would use"},
        {"name": "guru", "why": "no RSS and an explicit Disallow: /api/ in robots.txt"},
        {"name": "malt / freelancermap", "why": "real API behind 401: per-user credential, same wall as Upwork"},
    ], "reachable_without_api": {
        "how": "WebSearch with allowed_domains, then `triage` to separate postings from SEO noise",
        "platforms": ["upwork", "workana", "freelancer", "peopleperhour", "guru"],
        "limit": "WebFetch returns 403 on all of them: the posting is found but has to be opened by hand",
    }})
    return 0


def run_keys(_args) -> int:
    """
    Which sources need a credential, how to get each one and which is ready.

    It exists because leaving them out silently hides from the user that there
    is a source they could be using. The status is computed from the
    environment, so it answers for the machine it runs on and not for what a
    README says.
    """
    out = []
    for name, spec in KEYED_SOURCES.items():
        configured = bool(os.environ.get(spec["env"], "").strip())
        has_adapter = spec.get("adapter", True)
        if configured and has_adapter:
            status = "ready: the variable is set, `search --source {0}` already uses it".format(name)
        elif configured:
            status = "credential set but the adapter is not written yet"
        elif has_adapter:
            status = "not available: {0} is missing. With the variable set it turns on by itself".format(spec["env"])
        else:
            status = "not available: {0} is missing and the adapter is not written either".format(spec["env"])
        out.append({
            "source": name,
            "status": status,
            "configured": configured,
            "env_var": spec["env"],
            "scope": spec["scope"],
            "how_to_get": spec["how_to_get"],
            "limits": spec["limits"],
            "cannot_do": spec["cannot_do"],
            "doc": spec["doc"],
        })
    emit({
        "keyed_sources": out,
        "why_not_default": (
            "the credential belongs to one person and anyone installs this repo. "
            "A source that needs a key would work for one user and be broken for everyone else"
        ),
        "work_without_credential": list(SOURCES),
    })
    return 0


def run_triage(args) -> int:
    urls = list(args.url or [])
    if not urls and not sys.stdin.isatty():
        urls = [line.strip() for line in sys.stdin.read().splitlines()]
    if not urls:
        emit({"error": "no URLs received; pass --url or use stdin", "code": "NO_URLS"})
        return 1
    emit(triage_urls(urls))
    return 0


def run_market(args) -> int:
    emit(hn_market(args.months, args.query))
    return 0


def run_detail(args) -> int:
    if args.source != "getonbrd":
        emit({"error": "detail is only implemented for getonbrd; the other sources already bring the full text in search",
              "code": "NO_DETAIL"})
        return 1
    emit(getonbrd_detail(args.id))
    return 0


def emit(payload) -> None:
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


def force_utf8_streams() -> None:
    """
    On Windows stdout is cp1252, so an accent or a bullet in a description
    blows up with UnicodeEncodeError as soon as it is piped to a file.
    Same fix as job-scrape/scripts/getonbrd_search.py.
    """
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def main(argv=None) -> int:
    force_utf8_streams()
    parser = argparse.ArgumentParser(description="Searches freelance projects in public sources without an API key.")
    sub = parser.add_subparsers(dest="command", required=True)

    search = sub.add_parser("search", help="search freelance projects")
    search.add_argument("--query", default="", help="terms to search")
    search.add_argument("--source", default="all",
                        choices=list(SOURCES) + list(KEYED_SOURCES) + ["all"])
    search.add_argument("--pages", type=int, default=3, help="pages per source (default 3)")
    search.add_argument("--no-expand", action="store_true",
                        help="do not expand synonyms (ecommerce does not search shopify, etc)")
    search.set_defaults(func=run_search)

    sources = sub.add_parser("sources", help="list available sources and the excluded ones with their reason")
    sources.set_defaults(func=run_sources)

    keys = sub.add_parser("keys", help="sources that need a credential, how to get it and which is ready")
    keys.set_defaults(func=run_keys)

    triage = sub.add_parser(
        "triage",
        help="separate real postings from SEO noise in URLs brought by WebSearch",
    )
    triage.add_argument("--url", action="append", help="repeatable; if missing, reads from stdin")
    triage.set_defaults(func=run_triage)

    market = sub.add_parser("market", help="what other freelancers charge and how they position themselves (monthly HN thread)")
    market.add_argument("--months", type=int, default=3, help="how many monthly threads to read (default 3)")
    market.add_argument("--query", default="", help="filter by stack or word")
    market.set_defaults(func=run_market)

    detail = sub.add_parser("detail", help="get the full detail of a posting")
    detail.add_argument("--source", default="getonbrd", choices=list(SOURCES))
    detail.add_argument("--id", required=True)
    detail.set_defaults(func=run_detail)

    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except SourceError as e:
        emit({"error": str(e), "code": "SOURCE_ERROR"})
        return 1
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
