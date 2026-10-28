#!/usr/bin/env python3
"""
Registry and traceability for the career workspace: jobs and freelance in one place.

Answers the question that grepping by hand answers badly: "did I already apply here?".
And exports everything to CSV to look at in a spreadsheet.

The rule behind all of this: **the notes are the source of truth and the CSV is
derived from them**. There is no second database to keep in sync, because a
second database drifts within two weeks and then nobody knows which one lies.
Same one-way flow as job-scrape's dedup: seen_jobs -> note -> view.

Reads three note types, no matter which profile created them:
  type: application  (03-Applications/, +job-hunt)
  type: freelance    (03-Applications/, +freelance)
  type: contract     (08-Contracts/, +freelance)

Usage:
  python career_registry.py check "Acme"
  python career_registry.py check https://www.linkedin.com/jobs/view/123
  python career_registry.py export --csv registry.csv
  python career_registry.py stats
  python career_registry.py audit

Everything is read-only except `export --csv`, which writes the file you ask for.
Stdlib only. Compatible with Python 3.9.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sys
import unicodedata
from datetime import date, datetime
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

DEFAULT_WORKSPACE = "career-workspace"
APPLICATIONS_DIR = "03-Applications"
CONTRACTS_DIR = "08-Contracts"
# The applications folder of the pre-English layout, from the pack migrate_workspace.py uses.
with open(Path(__file__).with_name("legacy_contract.es.json"), encoding="utf-8") as _pack:
    LEGACY_APPLICATIONS_DIR = next(old for old, new in json.load(_pack)["folders"].items()
                                   if new == APPLICATIONS_DIR)
SEEN_JOBS = os.path.join("tools", "job_scraper", "seen_jobs.json")

KNOWN_TYPES = ("application", "freelance", "contract")

# Open statuses per type: the ones still waiting on the other side.
OPEN_STATES = {
    "application": ("interested", "applied", "interviewing", "offer"),
    "freelance": ("interested", "screened", "proposal_sent",
                  "in_conversation", "contract_active"),
    "contract": ("active", "paused"),
}
# Statuses that mean "this was already sent" - the ones that matter to avoid repeating.
SENT_STATES = ("applied", "interviewing", "offer", "hired", "rejected",
               "no_response", "declined", "proposal_sent",
               "in_conversation", "contract_active", "delivered",
               "won_closed", "disputed")

STALE_DAYS = 21

# Legal suffixes that do not tell one company from another. Same rule as the
# dedup job_key, so both tools agree.
LEGAL_SUFFIXES = ("inc", "llc", "ltd", "sa", "srl", "sas", "gmbh", "bv", "co",
                  "corp", "company", "sl", "spa", "plc", "ag", "oy", "ab",
                  "limited", "corporation", "ltda", "sapi", "sac", "cv", "de")

CSV_COLUMNS = ("type", "counterpart", "title", "status", "open", "platform",
               "match_score", "client_risk", "profile", "bid_or_amount",
               "application_cost", "sent_date", "updated",
               "days_idle", "posting_url", "note")


# --------------------------------------------------------------------------- #
# Reading notes
# --------------------------------------------------------------------------- #

def fold(text: str) -> str:
    """Lowercase without accents, to compare 'Zurich' with 'Zürich'."""
    decomposed = unicodedata.normalize("NFD", (text or "").lower())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn")


def slug(text: str) -> str:
    """
    Comparable name: no accents, no punctuation, no legal suffix.

    Dots are removed BEFORE tokenizing, not turned into spaces: "S.A." has to
    collapse to "sa" for the legal suffix to be recognized. Splitting it left
    "s" and "a", neither is in the list, and "Globex S.A." did not match
    "Globex".
    """
    base = re.sub(r"\.", "", fold(text))
    base = re.sub(r"[^a-z0-9 ]+", " ", base)
    words = base.split()
    # Only at the end: "AB Tasty" and "Spa Group" are names, "Acme S.A. de C.V." is Acme.
    while len(words) > 1 and words[-1] in LEGAL_SUFFIXES:
        words.pop()
    return " ".join(words)


def parse_frontmatter(text: str):
    """
    Flat YAML frontmatter: `key: value` and block lists.

    Does not use pyyaml because skill scripts run without installing anything.
    Supports what the workspace templates actually use; anything more exotic
    is ignored instead of blowing up.
    """
    text = text.lstrip("\ufeff")
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    fields = {}
    key = None
    for raw in text[3:end].splitlines():
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.lstrip().startswith("- ") and key:
            # A block list only counts if the key was left empty; otherwise the
            # scalar value already read is the right one.
            if not isinstance(fields.get(key), list):
                if str(fields.get(key) or "").strip():
                    continue
                fields[key] = []
            fields[key].append(line.lstrip()[2:].strip())
            continue
        match = re.match(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$", line)
        if not match:
            continue
        key = match.group(1)
        value = match.group(2).strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        fields[key] = value
    return fields


def parse_date(value):
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(str(value).strip(), fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def number(value):
    """Number or None. An empty template field is not a zero."""
    text = str(value or "").strip().replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def days_since(value, today):
    parsed = parse_date(value)
    return (today - parsed).days if parsed else None


def canonical_url(url: str) -> str:
    """URL without tracking, so two links to the same posting match."""
    if not url:
        return ""
    parts = urlsplit(url.strip())
    query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
             if not (k.startswith("utm_") or k in ("ref", "source", "trk", "trackingId"))]
    clean = urlunsplit(parts._replace(query=urlencode(query), fragment=""))
    match = re.search(r"linkedin\.com/jobs/view/(\d+)", clean)
    if match:
        return "https://www.linkedin.com/jobs/view/{0}".format(match.group(1))
    return clean.rstrip("/").lower()


def load_notes(workspace: Path):
    """Every application, proposal and contract note, normalized."""
    rows, problems = [], []
    today = date.today()

    if (workspace / LEGACY_APPLICATIONS_DIR).exists():
        problems.append({"note": LEGACY_APPLICATIONS_DIR + "/",
                         "problem": "workspace still uses the pre-English layout; run "
                                    "python .claude/skills/career-registry/scripts/"
                                    "migrate_workspace.py (dry run first)"})

    for folder in (APPLICATIONS_DIR, CONTRACTS_DIR):
        base = workspace / folder
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.md")):
            if path.name.startswith("_"):  # _index and the like
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError as e:
                problems.append({"note": path.name, "problem": "could not read: {0}".format(e)})
                continue
            fields = parse_frontmatter(text)
            if not fields:
                problems.append({"note": path.name, "problem": "no frontmatter"})
                continue

            kind = (fields.get("type") or "").strip() or "unknown"
            if kind not in KNOWN_TYPES:
                problems.append({"note": path.name,
                                 "problem": "unknown type: {0}".format(kind)})

            status = (fields.get("status") or "").strip()
            # Compatibility: old notes use `score` instead of `match_score`.
            score = fields.get("match_score") or fields.get("score") or ""
            # Company for jobs, client for freelance and contracts.
            counterpart = (fields.get("company") or fields.get("client") or "").strip()
            sent_date = fields.get("applied_date") or fields.get("sent_date") \
                or fields.get("start_date") or ""
            updated = fields.get("updated") or ""

            rows.append({
                "type": kind,
                "counterpart": counterpart,
                "title": path.stem,
                "status": status,
                "open": "yes" if status in OPEN_STATES.get(kind, ()) else "no",
                "platform": (fields.get("platform") or fields.get("source") or "").strip(),
                "match_score": score,
                "client_risk": (fields.get("client_risk") or "").strip(),
                "profile": (fields.get("profile") or fields.get("base_profile") or "").strip(),
                "bid_or_amount": (fields.get("bid") or fields.get("agreed_amount")
                                  or fields.get("salary_range") or "").strip(),
                "application_cost": (fields.get("connects_spent") or "").strip(),
                "sent_date": sent_date,
                "updated": updated,
                "days_idle": days_since(updated, today),
                "posting_url": (fields.get("posting_url") or "").strip(),
                "note": str(path.relative_to(workspace)).replace("\\", "/"),
                # Contracts only. Kept raw so audit can compare without
                # reopening the file.
                "estimated_hours": number(fields.get("estimated_hours")),
                "actual_hours": number(fields.get("actual_hours")),
            })

    return rows, problems


def load_seen_jobs(workspace: Path):
    path = workspace / SEEN_JOBS
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except (OSError, ValueError):
        return None


def seen_entries(seen):
    """Entries of seen_jobs.json: `jobs` is a job_key -> entry map (a list also works)."""
    jobs = (seen or {}).get("jobs") or []
    return [e for e in (jobs.values() if isinstance(jobs, dict) else jobs) if isinstance(e, dict)]


def entry_urls(entry):
    """Canonical URLs of an entry: the schema keeps them in sources[], older files at the top."""
    urls = [entry.get("url")] + [s.get("url") for s in entry.get("sources") or []
                                 if isinstance(s, dict)]
    return [canonical_url(str(u)) for u in urls if u]


# --------------------------------------------------------------------------- #
# check: the "did I already apply here?" question
# --------------------------------------------------------------------------- #

def match_rows(rows, needle: str):
    """
    Searches by three different keys because the user pastes any of the three:
    the counterpart's name, the posting URL, or the note title.
    """
    hits = []
    url = canonical_url(needle) if "://" in needle else ""
    target = slug(needle)

    for row in rows:
        why = None
        if url and canonical_url(row["posting_url"]) == url:
            why = "same posting URL"
        elif target and target == slug(row["counterpart"]):
            why = "same counterpart"
        elif target and target in slug(row["title"]):
            why = "note title match"
        elif target and slug(row["counterpart"]) and target in slug(row["counterpart"]):
            why = "similar counterpart"
        if why:
            hits.append(dict(row, matched_by=why))
    return hits


def run_check(args) -> int:
    workspace = resolve_workspace(args)
    rows, _ = load_notes(workspace)
    needle = args.term
    hits = match_rows(rows, needle)

    seen = load_seen_jobs(workspace)
    seen_hits = []
    if seen and "://" in needle:
        url = canonical_url(needle)
        for entry in seen_entries(seen):
            if url in entry_urls(entry):
                seen_hits.append({"status": entry.get("status"),
                                  "quick_score": entry.get("quick_score"),
                                  "note": entry.get("note"),
                                  "last_seen": entry.get("last_seen")})

    already_sent = [h for h in hits if h["status"] in SENT_STATES]
    verdict = "ALREADY APPLIED" if already_sent else (
        "SEEN, NOT APPLIED" if (hits or seen_hits) else "NO RECORD")

    emit({
        "query": needle,
        "verdict": verdict,
        "note_matches": hits,
        "dedup_matches": seen_hits,
        "dedup_available": seen is not None,
    })
    return 0


# --------------------------------------------------------------------------- #
# export, stats, audit
# --------------------------------------------------------------------------- #

def run_export(args) -> int:
    workspace = resolve_workspace(args)
    rows, problems = load_notes(workspace)
    if args.type != "all":
        rows = [r for r in rows if r["type"] == args.type]
    rows.sort(key=lambda r: (r["type"], str(r["updated"] or ""), r["title"]),
              reverse=True)

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(CSV_COLUMNS), extrasaction="ignore",
                            lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    content = buffer.getvalue()

    if args.csv:
        target = Path(args.csv)
        # newline="" so csv does not write \r\r\n on Windows.
        with open(target, "w", encoding="utf-8-sig", newline="") as handle:
            handle.write(content)
        emit({"written": str(target), "rows": len(rows), "columns": list(CSV_COLUMNS),
              "notes_with_problems": problems})
        return 0

    sys.stdout.write(content)
    return 0


def run_stats(args) -> int:
    workspace = resolve_workspace(args)
    rows, problems = load_notes(workspace)
    today = date.today()

    by_type = {}
    for row in rows:
        bucket = by_type.setdefault(row["type"], {"total": 0, "open": 0, "by_status": {}})
        bucket["total"] += 1
        bucket["open"] += 1 if row["open"] == "yes" else 0
        status = row["status"] or "(no status)"
        bucket["by_status"][status] = bucket["by_status"].get(status, 0) + 1

    sent = [r for r in rows if r["status"] in SENT_STATES]
    cost = sum(float(r["application_cost"]) for r in sent
               if str(r["application_cost"]).replace(".", "", 1).isdigit())

    emit({
        "today": today.isoformat(),
        "total_notes": len(rows),
        "by_type": by_type,
        "sent": len(sent),
        "recorded_application_cost": cost or None,
        "notes_with_problems": len(problems),
        # Without a big enough sample any rate is noise. The script says so,
        # not the interpretation that comes after.
        "enough_sample_for_rates": len(sent) >= 10,
    })
    return 0


def run_audit(args) -> int:
    """Divergences. Without this, traceability is just an intention."""
    workspace = resolve_workspace(args)
    rows, problems = load_notes(workspace)
    seen = load_seen_jobs(workspace)

    missing_status = [r["note"] for r in rows if not r["status"]]
    missing_counterpart = [r["note"] for r in rows if not r["counterpart"]]
    sent_without_date = [r["note"] for r in rows
                         if r["status"] in SENT_STATES and not r["sent_date"]]
    stalled = [{"note": r["note"], "status": r["status"], "days": r["days_idle"]}
               for r in rows
               if r["open"] == "yes" and (r["days_idle"] or 0) >= STALE_DAYS]

    # Duplicates: the same counterpart with the same title twice.
    keys = {}
    for row in rows:
        key = (slug(row["counterpart"]), slug(row["title"]))
        if not key[0]:
            continue
        keys.setdefault(key, []).append(row["note"])
    duplicates = [{"counterpart": k[0], "notes": v} for k, v in keys.items() if len(v) > 1]

    # Actual hours above the estimate = free work if there was no change
    # order. Only flagged here; the pattern analysis belongs to /freelance-pipeline.
    over_hours = []
    for row in rows:
        est, real = row.get("estimated_hours"), row.get("actual_hours")
        if est and real and real > est:
            over_hours.append({
                "note": row["note"], "estimated": est, "actual": real,
                "excess_hours": round(real - est, 2),
                "excess_pct": round((real - est) / est * 100),
            })

    broken_pointers = []
    if seen:
        existing = {r["note"] for r in rows}
        for entry in seen_entries(seen):
            target = entry.get("note")
            if target and not any(target in n or n in target for n in existing):
                urls = entry_urls(entry)
                broken_pointers.append({"url": urls[0] if urls else None, "note": target})

    emit({
        "notes_checked": len(rows),
        "missing_frontmatter_or_unknown_type": problems,
        "missing_status": missing_status,
        "missing_counterpart": missing_counterpart,
        "sent_without_sent_date": sent_without_date,
        "open_stalled_over_{0}_days".format(STALE_DAYS): stalled,
        "possible_duplicates": duplicates,
        "contracts_over_estimated_hours": over_hours,
        "broken_dedup_pointers": broken_pointers,
        "dedup_available": seen is not None,
    })
    return 0


# --------------------------------------------------------------------------- #

def resolve_workspace(args) -> Path:
    candidate = args.workspace or os.environ.get("CAREER_WORKSPACE") or DEFAULT_WORKSPACE
    path = Path(candidate).expanduser()
    if not path.exists():
        emit({"error": "workspace does not exist: {0}".format(path),
              "code": "NO_WORKSPACE",
              "help": "pass --workspace, or set CAREER_WORKSPACE, or run /freelance-hunt setup"})
        raise SystemExit(1)
    return path


def emit(payload) -> None:
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2, default=str)
    sys.stdout.write("\n")


def force_utf8_streams() -> None:
    """On Windows stdout is cp1252 and an accent blows up when piped to a file."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def build_parser():
    parser = argparse.ArgumentParser(
        description="Registry and traceability of applications, proposals and contracts.")
    parser.add_argument("--workspace", help="path to the career workspace")
    sub = parser.add_subparsers(dest="command", required=True)

    check = sub.add_parser("check", help="did I already apply here? by company, URL or title")
    check.add_argument("term")
    check.set_defaults(func=run_check)

    export = sub.add_parser("export", help="export everything to CSV")
    export.add_argument("--csv", help="target file; without it, goes to stdout")
    export.add_argument("--type", default="all",
                        choices=list(KNOWN_TYPES) + ["all"])
    export.set_defaults(func=run_export)

    stats = sub.add_parser("stats", help="counts by type and status")
    stats.set_defaults(func=run_stats)

    audit = sub.add_parser("audit", help="divergences, duplicates and stalled notes")
    audit.set_defaults(func=run_audit)
    return parser


def main(argv=None) -> int:
    force_utf8_streams()
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except SystemExit as e:
        return int(e.code or 0)
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
