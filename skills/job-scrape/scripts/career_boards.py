"""
career_boards.py - Search target companies' own career boards (Greenhouse, Ashby, Lever, SmartRecruiters).

Many companies (fintechs, banks, betting, AI startups) post only on their own ATS
page, never on LinkedIn or GetOnBoard. This script reads the public, keyless job
board API of each ATS for the companies listed in a JSON file.

Output matches getonbrd_search.py: {"meta": ..., "results": [{id, title, company,
location, date, url, description, integrity}]}. Every description goes through
posting_guard. A board that answers 404 (wrong slug, company left the ATS) is
reported in meta.failed, never silently dropped.

Usage:
    python career_boards.py search -q "golang,backend,ai engineer" [--sector fintech] [--brief]
    python career_boards.py manual      companies without a public API, to check by hand
    python career_boards.py selftest

Companies file (first found): --companies <path>, then
<workspace>/tools/company_boards/target_companies.json (workspace = env
CAREER_WORKSPACE or ./career-workspace), then the example shipped next to this
script. Format: references/company-boards-cli.md.
"""

import argparse
import concurrent.futures
import html
import json
import os
import re
import sys
import time
from pathlib import Path

from _fetch import fetch
from posting_guard import check

HERE = Path(__file__).resolve().parent
EXAMPLE = HERE / "target_companies.example.json"
HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
BRIEF_CHARS = 300
LATAM = ("latam", "latin america", "south america", "americas", "argentina", "buenos aires")
ANYWHERE = {"remote", "global", "worldwide", "anywhere", "fully"}


def get_json(url):
    body = fetch(url, HEADERS, 2)
    if body is None:
        raise RuntimeError(f"board not found (404): {url}")
    return json.loads(body)


def ms_to_date(ms):
    return time.strftime("%Y-%m-%d", time.gmtime(ms / 1000)) if ms else None


def job(company, jid, title, location, date, url, raw_html):
    description, integrity = check(raw_html or title, "html")
    return {"id": str(jid), "title": title, "company": company, "location": location or None,
            "date": (date or "")[:10] or None, "url": url, "description": description,
            "integrity": integrity}


def parse_greenhouse(data, company):
    return [job(company, j["id"], j["title"], (j.get("location") or {}).get("name"),
                j.get("first_published") or j.get("updated_at"), j["absolute_url"],
                html.unescape(j.get("content") or ""))
            for j in data.get("jobs", [])]


def parse_ashby(data, company):
    out = []
    for j in data.get("jobs", []):
        places = [j.get("location") or ""] + [s.get("location", "") for s in j.get("secondaryLocations") or []]
        if j.get("isRemote") and "remote" not in " ".join(places).lower():
            places.append("Remote")
        out.append(job(company, j["id"], j["title"], ", ".join(p for p in places if p),
                       j.get("publishedAt"), j.get("jobUrl"), j.get("descriptionHtml")))
    return out


def parse_lever(data, company):
    out = []
    for j in data or []:
        cats = j.get("categories") or {}
        places = cats.get("allLocations") or [cats.get("location") or ""]
        if j.get("workplaceType") == "remote":
            places = places + ["Remote"]
        out.append(job(company, j["id"], j["text"], ", ".join(p for p in places if p),
                       ms_to_date(j.get("createdAt")), j.get("hostedUrl"),
                       j.get("description") or j.get("descriptionPlain")))
    return out


def parse_smartrecruiters(data, company, slug):
    out = []
    for j in data.get("content", []):
        loc = j.get("location") or {}
        place = loc.get("fullLocation") or ", ".join(x for x in (loc.get("city"), loc.get("country")) if x)
        if loc.get("remote"):
            place = f"{place}, Remote" if place else "Remote"
        out.append(job(company, j["id"], j["name"], place, j.get("releasedDate"),
                       f"https://jobs.smartrecruiters.com/{slug}/{j['id']}", None))
    return out


def fetch_company(c):
    slug, name = c["slug"], c["name"]
    if c["ats"] == "greenhouse":
        return parse_greenhouse(get_json(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true") or {}, name)
    if c["ats"] == "ashby":
        return parse_ashby(get_json(f"https://api.ashbyhq.com/posting-api/job-board/{slug}") or {}, name)
    if c["ats"] == "lever":
        return parse_lever(get_json(f"https://api.lever.co/v0/postings/{slug}?mode=json"), name)
    if c["ats"] == "smartrecruiters":
        jobs, offset = [], 0
        while True:
            page = get_json(f"https://api.smartrecruiters.com/v1/companies/{slug}/postings?limit=100&offset={offset}") or {}
            jobs += parse_smartrecruiters(page, name, slug)
            offset += 100
            if offset >= (page.get("totalFound") or 0):
                return jobs
    raise ValueError(f"unknown ats {c['ats']}")


def title_matches(title, keywords):
    t = re.sub(r"(?i)go[- ]to[- ]market", "", title)
    return any(re.search(rf"(?i)\b{re.escape(k)}\b", t) for k in keywords)


def location_ok(location):
    loc = (location or "").lower()
    words = set(re.findall(r"[a-z]+", loc))
    if any(m in loc for m in LATAM):
        return True
    # A remote posting that also names a city or region is usually closed to Argentina.
    return "remote" in words and words <= ANYWHERE


def companies_path(arg):
    if arg:
        return Path(arg)
    workspace = Path(os.environ.get("CAREER_WORKSPACE") or "career-workspace")
    own = workspace / "tools" / "company_boards" / "target_companies.json"
    if own.is_file():
        return own
    print(f"[note] {own} not found, using the bundled example list", file=sys.stderr)
    return EXAMPLE


def load_companies(path, sector=None):
    rows = json.loads(Path(path).read_text(encoding="utf-8"))
    return [r for r in rows if not sector or r["sector"] == sector]


def run_search(args):
    keywords = [k.strip() for k in args.query.split(",") if k.strip()]
    companies = [c for c in load_companies(companies_path(args.companies), args.sector) if c["ats"] != "manual"]
    results, failed = [], []
    with concurrent.futures.ThreadPoolExecutor(8) as ex:
        futures = {ex.submit(fetch_company, c): c for c in companies}
        for f in concurrent.futures.as_completed(futures):
            try:
                results += [j for j in f.result() if title_matches(j["title"], keywords) and location_ok(j["location"])]
            except Exception as e:
                failed.append({"company": futures[f]["name"], "error": str(e)})
    if args.brief:
        for j in results:
            d = j["description"] or ""
            j["description"], j["description_truncated"] = (d[:BRIEF_CHARS].rstrip() + "...", True) if len(d) > BRIEF_CHARS else (d, False)
    results.sort(key=lambda j: (j["company"], j["title"]))
    meta = {"count": len(results), "companies_queried": len(companies), "failed": failed, "keywords": keywords}
    print(json.dumps({"meta": meta, "results": results}, indent=2, ensure_ascii=False))
    return 0


def run_manual(args):
    for c in load_companies(companies_path(args.companies)):
        if c["ats"] == "manual":
            print(f"{c['sector']:<15} {c['name']:<30} {c.get('careers_url') or '(no link: search their site)'}")
    return 0


def run_selftest(_args):
    gh = parse_greenhouse({"jobs": [{"id": 1, "title": "Senior Go Engineer", "location": {"name": "Remote - LATAM"},
                                      "updated_at": "2026-10-01T00:00:00Z", "absolute_url": "https://x/1", "content": "&lt;p&gt;Go&lt;/p&gt;"}]}, "Acme")
    assert gh[0]["title"] == "Senior Go Engineer" and gh[0]["date"] == "2026-10-01" and gh[0]["description"].strip() == "Go"
    assert "verdict" in gh[0]["integrity"]
    ab = parse_ashby({"jobs": [{"id": "a", "title": "AI Engineer", "location": "Buenos Aires", "isRemote": True,
                                "secondaryLocations": [{"location": "Mexico City"}], "publishedAt": "2026-09-30T10:00:00Z",
                                "jobUrl": "https://y/a", "descriptionHtml": "<p>LLM</p>"}]}, "Acme")
    assert ab[0]["location"] == "Buenos Aires, Mexico City, Remote" and ab[0]["url"] == "https://y/a"
    lv = parse_lever([{"id": "l", "text": "Backend Developer", "categories": {"location": "Argentina"},
                       "workplaceType": "remote", "createdAt": 1790000000000, "hostedUrl": "https://z/l", "description": "<b>Go</b>"}], "Acme")
    assert lv[0]["location"] == "Argentina, Remote" and lv[0]["date"] == "2026-09-21"
    sr = parse_smartrecruiters({"content": [{"id": "9", "name": "Golang Dev", "location": {"city": "Buenos Aires", "country": "ar", "remote": True},
                                             "releasedDate": "2026-10-02T00:00:00.000Z"}]}, "Acme", "acme")
    assert sr[0]["url"] == "https://jobs.smartrecruiters.com/acme/9" and sr[0]["location"] == "Buenos Aires, ar, Remote"
    assert title_matches("Senior Go Engineer", ["go"]) and not title_matches("Go-To-Market Manager", ["go"])
    assert not title_matches("Gopher Advocate", ["go"])
    assert location_ok("Remote - LATAM") and location_ok("Buenos Aires") and location_ok("Remote")
    assert location_ok("Remote, Global") and location_ok("Argentina Remote")
    assert not location_ok("Remote - US") and not location_ok("San Francisco, CA") and not location_ok(None)
    assert not location_ok("Palo Alto, Remote") and not location_ok("Sweden | Remote")
    rows = load_companies(EXAMPLE)
    assert rows and all({"name", "sector", "ats", "slug", "careers_url"} <= set(r) for r in rows)
    assert all(r["ats"] in ("greenhouse", "ashby", "lever", "smartrecruiters", "manual") for r in rows)
    print("selftest OK: 4 parsers, title and location filters, example companies file")
    return 0


def main():
    for s in (sys.stdout, sys.stderr):
        if hasattr(s, "reconfigure"):
            s.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(prog="career_boards.py", description=__doc__.strip().splitlines()[0])
    p.add_argument("--companies", help="path to the companies JSON (default: the workspace's, else the bundled example)")
    sub = p.add_subparsers(dest="command", required=True)
    s = sub.add_parser("search", help="search the target companies' boards")
    s.add_argument("-q", "--query", required=True, help="comma-separated title keywords, e.g. 'golang,backend,llm'")
    s.add_argument("--sector", help="only companies with this sector value in the companies file")
    s.add_argument("--brief", action="store_true", help=f"truncate descriptions to {BRIEF_CHARS} chars")
    s.set_defaults(func=run_search)
    sub.add_parser("manual", help="companies without a public API").set_defaults(func=run_manual)
    sub.add_parser("selftest", help="assert-based checks of the parsers and filters").set_defaults(func=run_selftest)
    args = p.parse_args()
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
