#!/usr/bin/env python3
"""job_key for seen_jobs.json, and an audit of the state that already exists.

The rule used to live only in prose (references/dedup-playbook.md), so every
run applied it its own way and the file collected the same posting under two
keys: a title cut at another point, a legal suffix removed once and kept
another time. Here the key is a pure function of company + title:

  * slug: lowercase, no accents, words joined with "-", keeps the inner "."
    (coderslab.io, .net);
  * company without legal suffix (inc, llc, s.a., gmbh...); title without the
    work-mode or region qualifiers in parentheses ("(remote)", "(latam)");
    both word lists live in qualifiers.<lang>.json next to this script and
    every pack applies;
  * bounded length with a hash of the full slug: a long title always gives the
    same key and two different long titles never collide;
  * a name in another alphabet (Cyrillic, CJK) shrinks to almost nothing when
    turned into ASCII, and "Программист 1С" and "Аналитик 1С" would both end up
    as "1": there the identity comes from the numeric id in the URL, or a hash.

Adapted from tools/job_key.py of ai-job-search (MIT, (c) 2026 Mads Lorentzen;
see ATTRIBUTION.md) to the `company|title` key and Arcane's schema.

Usage:
  python .claude/skills/job-scrape/scripts/job_key.py --company "Acme Inc." --title "Backend Dev (Remote)" [--url URL]
  python .claude/skills/job-scrape/scripts/job_key.py --audit [path/to/seen_jobs.json]

Without a path, --audit reads <workspace>/tools/job_scraper/seen_jobs.json, with
the workspace from CAREER_WORKSPACE or ./career-workspace. Exits 0 with a key,
or with an audit without problems; 1 if the audit finds malformed keys or URLs
repeated across two entries. It never renames anything: it reports and the
user decides.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

COMPANY_MAX = 40
TITLE_MAX = 60
HASH_LEN = 6

def _load_packs():
    """Union of every qualifiers.<lang>.json next to this script: one board mixes languages."""
    suffixes, qualifiers = set(), set()
    for path in sorted(Path(__file__).resolve().parent.glob("qualifiers.*.json")):
        pack = json.loads(path.read_text(encoding="utf-8"))
        suffixes.update(pack["legal_suffixes"])
        qualifiers.update(pack["qualifiers"])
    return suffixes, qualifiers


LEGAL_SUFFIXES, QUALIFIERS = _load_packs()
_PAREN = re.compile(r"\(([^()]*)\)")
_WORD = re.compile(r"[a-z0-9]+(?:\.[a-z0-9]+)*")
_JOB_ID = re.compile(r"(\d{6,})")
# Canonical key: two slugs separated by a single "|".
_SLUG = r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?"
_CANONICAL = re.compile(rf"^{_SLUG}\|{_SLUG}$")


def _ascii(text):
    return unicodedata.normalize("NFKD", str(text or "")).encode("ascii", "ignore").decode("ascii").lower()


def slugify(text):
    """ASCII words joined with "-"; the "." only survives between alphanumerics."""
    return "-".join(_WORD.findall(_ascii(text)))


def _lost_letters(text):
    """True if turning it into ASCII dropped letters of another alphabet, so the slug no longer identifies.

    Latin letters without a decomposition (o, ae, ss, l with stroke) do not count:
    "Ørsted" becomes "rsted" and collides with nobody in practice.
    """
    for ch in unicodedata.normalize("NFKD", str(text or "")):
        if ord(ch) >= 128 and ch.isalpha() and not unicodedata.name(ch, "LATIN").startswith("LATIN"):
            return True
    return False


def _cap(slug, limit):
    """Bounds the length without the cut changing between runs: hash of the full slug."""
    if len(slug) <= limit:
        return slug
    return f"{slug[:limit].rstrip('-.')}-{hashlib.sha1(slug.encode('utf-8')).hexdigest()[:HASH_LEN]}"


def _digest(text):
    return hashlib.sha1(str(text).encode("utf-8")).hexdigest()[:HASH_LEN]


def company_slug(company):
    words = slugify(company).split("-") if slugify(company) else []
    while len(words) > 1 and words[-1].replace(".", "") in LEGAL_SUFFIXES:
        words.pop()
    slug = _cap("-".join(words), COMPANY_MAX)
    if slug and not _lost_letters(company):
        return slug
    name = unicodedata.normalize("NFC", str(company or "").strip().casefold())
    if not name:
        return "no-company"
    # A name in another alphabet still has an identity: the hash. Whatever Latin
    # survives stays as a readable prefix ("Сбер AI" and "Яндекс AI" give "ai").
    return f"{slug}-{_digest(name)}" if slug else f"company-{_digest(name)}"


def title_slug(title, url=""):
    def keep(group):
        words = set(slugify(group.group(1)).split("-"))
        return " " if words and words <= QUALIFIERS else group.group(0)

    slug = _cap(slugify(_PAREN.sub(keep, str(title or ""))), TITLE_MAX)
    if slug and not _lost_letters(title):
        return slug
    # Title in another alphabet: the portal's numeric id is the stable identity;
    # without an id, the hash of the URL (not of the title: a portal that
    # re-publishes with another title would store the same posting twice).
    match = _JOB_ID.search(url or "")
    if match:
        return f"{slug}-{match.group(1)}" if slug else match.group(1)
    digest = _digest(url or title)
    return f"{slug}-{digest}" if slug else f"untitled-{digest}"


def make_key(company, title, url=""):
    """The seen_jobs.json key for a posting."""
    return f"{company_slug(company)}|{title_slug(title, url)}"


def default_state():
    workspace = Path(os.environ.get("CAREER_WORKSPACE") or "career-workspace")
    return workspace / "tools" / "job_scraper" / "seen_jobs.json"


def audit(path):
    """Malformed keys, URLs in two entries, and keys that would come out different today."""
    try:
        doc = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(json.dumps({"error": f"could not read {path}: {exc}"}, ensure_ascii=False), file=sys.stderr)
        return 1
    jobs = doc.get("jobs") if isinstance(doc, dict) else None
    if not isinstance(jobs, dict) or not all(isinstance(v, dict) for v in jobs.values()):
        print(json.dumps({"error": f"{path}: expected a 'jobs' object of entries"}, ensure_ascii=False), file=sys.stderr)
        return 1

    malformed = [k for k in jobs if not _CANONICAL.match(k)]
    by_url = {}
    for key, entry in jobs.items():
        for source in entry.get("sources") or []:
            url = str((source or {}).get("url") or "").rstrip("/")
            if url and key not in by_url.setdefault(url, []):
                by_url[url].append(key)
    duplicates = {u: ks for u, ks in by_url.items() if len(ks) > 1}
    drift = {}
    for key, entry in jobs.items():
        url = next((s.get("url") for s in entry.get("sources") or [] if isinstance(s, dict) and s.get("url")), "")
        expected = make_key(entry.get("company", ""), entry.get("title", ""), url)
        if key != expected:
            drift[key] = expected

    print(json.dumps({
        "entries": len(jobs),
        "malformed_keys": malformed,
        "duplicate_urls": duplicates,
        "drifted_keys": drift,
    }, indent=2, ensure_ascii=False))
    return 1 if (malformed or duplicates) else 0


def _force_utf8_output():
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)  # does not exist on a test StringIO
        if reconfigure:
            reconfigure(encoding="utf-8")


def main(argv=None):
    _force_utf8_output()
    ap = argparse.ArgumentParser(description="job_key for seen_jobs.json, or an audit of the state.")
    ap.add_argument("--company")
    ap.add_argument("--title")
    ap.add_argument("--url", default="")
    ap.add_argument("--audit", nargs="?", const="", metavar="SEEN_JOBS_JSON")
    args = ap.parse_args(argv)

    if args.audit is not None:
        return audit(args.audit or default_state())
    if args.company is None or args.title is None:
        ap.error("pass --company and --title, or --audit")
    print(make_key(args.company, args.title, args.url))
    return 0


if __name__ == "__main__":
    sys.exit(main())
