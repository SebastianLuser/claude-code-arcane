"""
vault_audit.py - Health report of an Obsidian vault. Counting only, never writes.

No dependencies beyond the Python 3 standard library. Walks the vault once,
resolves every [[wikilink]] the way Obsidian does, and emits the metrics a
review session needs to decide what to fix: orphans, broken links, stale notes,
tag sprawl, hollow notes, ambiguous filenames and frontmatter contract misses.

This exists because the same report built by reading notes through an agent
costs hundreds of thousands of tokens on a real vault and gets the counts wrong.
Python counts; the agent decides what the counts mean.

Usage:
    python vault_audit.py <vault> [--format json|text] [flags]

Findings are capped per category (--limit) and every capped list reports its
real total, so a truncated report never reads as a clean one.

Errors go to stderr as {"error": "...", "code": "..."} with exit code 1.
"""

import argparse
import json
import os
import re
import sys
import time

# Vault plumbing and sync leftovers: never notes, and walking them makes the
# scan an order of magnitude slower on a synced vault.
SKIP_DIRS = {
    ".obsidian", ".git", ".trash", ".stfolder", ".stversions",
    "node_modules", "__pycache__", ".smart-env",
}

# Scanned so links into them resolve, but excluded from the findings that would
# be pure noise: a template is hollow and unlinked by design, and an archived
# note is stale by definition. Override with --exempt when the vault names those
# folders differently (its CLAUDE.md declares the mapping); --audit-all drops the
# exemption entirely.
EXEMPT_DIRS = ("Templates", "04_Archive")

ATTACHMENT_EXTS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".pdf", ".mp3", ".mp4",
    ".wav", ".m4a", ".mov", ".webm", ".canvas", ".base", ".excalidraw",
}

DEFAULT_STALE_DAYS = 180
DEFAULT_HOLLOW_WORDS = 30
DEFAULT_TASK_DAYS = 7
DEFAULT_LIMIT = 25
DEFAULT_REQUIRED_FIELDS = ("created", "type")

FENCED_CODE = re.compile(r"^```.*?^```", re.DOTALL | re.MULTILINE)
INLINE_CODE = re.compile(r"`[^`\n]*`")
WIKILINK = re.compile(r"(!?)\[\[([^\[\]\n]+?)\]\]")
# A tag can't start with a digit and can't be preceded by a word char, a slash
# or another '#'. That rules out '## Heading', '#1', and url.com/x#fragment.
INLINE_TAG = re.compile(r"(?<![\w/#])#([A-Za-z_][\w/-]*)")
TASK = re.compile(r"^[ \t]*[-*+] \[(.)\]", re.MULTILINE)
DATE_IN_NAME = re.compile(r"(\d{4})-(\d{2})-(\d{2})")


def write_error(error, code):
    sys.stderr.write(json.dumps({"error": error, "code": code}) + "\n")


def strip_code(text):
    """
    Obsidian does not parse links or tags inside code, so neither do we. Without
    this every snippet documenting wikilink syntax shows up as a broken link.
    """
    return INLINE_CODE.sub("", FENCED_CODE.sub("", text))


def parse_frontmatter(text):
    """
    Minimal YAML subset: 'key: value', inline lists and block lists. Enough for
    the frontmatter contract and tags, and it never raises on a malformed file.
    Returns (fields, body_offset_in_lines).
    """
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return {}, 0

    fields = {}
    key = None
    for index in range(1, len(lines)):
        raw = lines[index]
        if raw.strip() == "---":
            return fields, index + 1
        if raw.startswith(("  - ", "- ", "\t- ")) and key:
            # 'tags:' parsed a line earlier as an empty scalar; the first block
            # item is what reveals it was a list all along.
            if not isinstance(fields.get(key), list):
                fields[key] = []
            fields[key].append(raw.split("- ", 1)[1].strip().strip("\"'"))
            continue
        if ":" not in raw:
            continue
        key, _, value = raw.partition(":")
        key = key.strip()
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            items = [v.strip().strip("\"'") for v in value[1:-1].split(",")]
            fields[key] = [v for v in items if v]
        else:
            fields[key] = value.strip("\"'")

    # No closing '---': treat the file as bodyless frontmatter rather than
    # silently reading the whole note as YAML.
    return fields, len(lines)


def collect_tags(fields, body):
    tags = set()
    declared = fields.get("tags")
    if isinstance(declared, list):
        tags.update(t.lstrip("#") for t in declared if t)
    elif isinstance(declared, str) and declared:
        tags.update(t.strip().lstrip("#") for t in declared.split(",") if t.strip())
    tags.update(INLINE_TAG.findall(body))
    return {t for t in tags if t}


def link_target(raw):
    """'folder/Note#Heading|Alias' -> 'folder/Note'. Empty for a same-note link."""
    target = raw.split("|", 1)[0].strip()
    target = target.split("#", 1)[0].strip()
    return target


def relative(path, root):
    return os.path.relpath(path, root).replace(os.sep, "/")


def resolve_exempt(args):
    """
    Folders scanned so links into them resolve, but kept out of the findings. A
    vault that renamed them (an adopted vault keeps its own layout) passes
    --exempt; argparse cannot carry a default for an append action without
    appending to it, so the fallback lives here.
    """
    if not getattr(args, "exempt", None):
        return EXEMPT_DIRS
    return tuple(d.strip().strip("/").replace("\\", "/") for d in args.exempt if d.strip())


def scan(root, args):
    """One walk over the vault. Returns (notes, attachments)."""
    exempt = resolve_exempt(args)
    notes = {}
    attachments = {}

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".."))
        for filename in sorted(filenames):
            full = os.path.join(dirpath, filename)
            rel = relative(full, root)
            _, ext = os.path.splitext(filename)
            ext = ext.lower()

            if ext != ".md":
                if ext in ATTACHMENT_EXTS:
                    attachments[rel] = {"path": rel, "embedded_by": []}
                continue

            try:
                with open(full, "r", encoding="utf-8", errors="replace") as handle:
                    text = handle.read()
                mtime = os.stat(full).st_mtime
            except OSError as e:
                write_error("cannot read {0}: {1}".format(rel, e), "READ_FAILED")
                continue

            fields, body_start = parse_frontmatter(text)
            body = strip_code("\n".join(text.split("\n")[body_start:]))
            links, embeds = [], []
            for bang, raw in WIKILINK.findall(body):
                target = link_target(raw)
                if not target:
                    continue
                (embeds if bang else links).append(target)

            notes[rel] = {
                "path": rel,
                "name": os.path.splitext(filename)[0],
                "fields": fields,
                "tags": collect_tags(fields, body),
                "links": links,
                "embeds": embeds,
                "words": len(body.split()),
                "mtime": mtime,
                "tasks": TASK.findall(body),
                "exempt": rel.startswith(exempt) and not args.audit_all,
            }

    return notes, attachments


def build_index(notes, attachments):
    """
    Obsidian resolves [[Name]] by unique basename anywhere in the vault, by path
    when the link contains one, and by the `aliases` a note declares in its
    frontmatter. Two files sharing a basename make every short link to that name
    ambiguous, which is why by_name keeps every match.

    Aliases are not a nicety here: hub notes exist to be linked by every name the
    entity goes by, so ignoring them reports every [[Nacho]] as a broken link
    while Obsidian resolves it fine.
    """
    by_path = {}
    by_name = {}
    by_alias = {}
    for rel in list(notes) + list(attachments):
        stem = rel[:-3] if rel.endswith(".md") else rel
        by_path[stem.lower()] = rel
        by_path[rel.lower()] = rel
        by_name.setdefault(os.path.basename(stem).lower(), []).append(rel)
    for rel, note in notes.items():
        declared = (note.get("fields") or {}).get("aliases")
        if isinstance(declared, str):
            declared = [a.strip() for a in declared.split(",")]
        for alias in declared or []:
            if alias:
                by_alias.setdefault(alias.strip().lower(), []).append(rel)
    return by_path, by_name, by_alias


def resolve(target, by_path, by_name, by_alias=None):
    """Returns (resolved_path_or_None, is_ambiguous)."""
    key = target.lower().rstrip("/")
    if key in by_path:
        return by_path[key], False
    for candidates in (by_name.get(os.path.basename(key), []), (by_alias or {}).get(key, [])):
        if len(candidates) == 1:
            return candidates[0], False
        if len(candidates) > 1:
            return candidates[0], True
    return None, False


def audit(root, args):
    # argparse's append action cannot carry a default without appending to it,
    # so the fallback lives here: audit() has to stand on its own, not depend on
    # main() having normalized its arguments first.
    required = tuple(args.require) if args.require else DEFAULT_REQUIRED_FIELDS
    notes, attachments = scan(root, args)
    by_path, by_name, by_alias = build_index(notes, attachments)

    backlinks = {rel: 0 for rel in notes}
    broken = []
    ambiguous_links = []
    total_links = 0
    now = time.time()

    for note in notes.values():
        for target in note["links"] + note["embeds"]:
            total_links += 1
            resolved, is_ambiguous = resolve(target, by_path, by_name, by_alias)
            if resolved is None:
                broken.append({"source": note["path"], "target": target})
                continue
            if is_ambiguous:
                ambiguous_links.append({"source": note["path"], "target": target})
            if resolved in backlinks:
                backlinks[resolved] += 1
            elif resolved in attachments:
                attachments[resolved]["embedded_by"].append(note["path"])

    tag_use = {}
    for note in notes.values():
        for tag in note["tags"]:
            tag_use[tag] = tag_use.get(tag, 0) + 1

    orphans, no_backlinks, stale, hollow, missing_fields, stale_tasks = [], [], [], [], [], []
    open_tasks = done_tasks = 0

    for note in notes.values():
        outgoing = len(note["links"]) + len(note["embeds"])
        incoming = backlinks[note["path"]]
        open_here = [t for t in note["tasks"] if t == " "]
        open_tasks += len(open_here)
        done_tasks += len([t for t in note["tasks"] if t in ("x", "X")])

        if note["exempt"]:
            continue

        if not outgoing and not incoming:
            orphans.append(note["path"])
        elif not incoming:
            no_backlinks.append(note["path"])

        age_days = int((now - note["mtime"]) // 86400)
        if age_days >= args.stale_days:
            stale.append({"path": note["path"], "days": age_days})

        if note["words"] < args.hollow_words:
            hollow.append({"path": note["path"], "words": note["words"]})

        missing = [f for f in required if f not in note["fields"]]
        if missing:
            missing_fields.append({"path": note["path"], "missing": missing})

        # Open tasks in a dated note (dump or daily) past the carry window: the
        # vault convention says they should have been cancelled in place, not
        # left hanging in a day that already closed.
        dated = DATE_IN_NAME.search(os.path.basename(note["path"]))
        if dated and open_here:
            try:
                note_age = int((now - time.mktime(time.strptime(dated.group(0), "%Y-%m-%d"))) // 86400)
            except ValueError:
                note_age = 0
            if note_age >= args.task_days:
                stale_tasks.append({
                    "path": note["path"], "days": note_age, "open": len(open_here),
                })

    note_count = len(notes)
    audited = len([n for n in notes.values() if not n["exempt"]])

    return {
        "vault": root,
        "scanned_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "thresholds": {
            "stale_days": args.stale_days,
            "hollow_words": args.hollow_words,
            "task_days": args.task_days,
            "required_fields": list(required),
            "exempt_dirs": [] if args.audit_all else list(resolve_exempt(args)),
        },
        "counts": {
            "notes": note_count,
            "notes_audited": audited,
            "attachments": len(attachments),
            "links": total_links,
            "broken_links": len(broken),
            "tags": len(tag_use),
            "tasks_open": open_tasks,
            "tasks_done": done_tasks,
        },
        "metrics": {
            # The signal for whether this is a vault of ideas or a folder of
            # documents. Counts embeds, since an embed is a real connection.
            "avg_links_per_note": round(total_links / note_count, 2) if note_count else 0.0,
            "orphan_rate": round(len(orphans) / audited, 3) if audited else 0.0,
            "single_use_tag_rate": (
                round(len([t for t, n in tag_use.items() if n == 1]) / len(tag_use), 3)
                if tag_use else 0.0
            ),
        },
        "findings": {
            "orphans": orphans,
            "no_backlinks": no_backlinks,
            "broken_links": broken,
            "ambiguous_links": ambiguous_links,
            "ambiguous_names": [
                {"name": name, "paths": paths}
                for name, paths in sorted(by_name.items()) if len(paths) > 1
            ],
            "stale": sorted(stale, key=lambda s: -s["days"]),
            "hollow": sorted(hollow, key=lambda h: h["words"]),
            "single_use_tags": sorted(t for t, n in tag_use.items() if n == 1),
            "orphan_attachments": sorted(
                a["path"] for a in attachments.values() if not a["embedded_by"]
            ),
            "missing_frontmatter": missing_fields,
            "stale_open_tasks": sorted(stale_tasks, key=lambda t: -t["days"]),
        },
    }


def cap(report, limit):
    """
    Truncate every finding list, recording the real total. A capped list that
    does not say so reads as 'nothing more to fix', which is the one lie a
    health report must never tell.
    """
    if limit <= 0:
        return report
    totals = {}
    for name, items in report["findings"].items():
        totals[name] = len(items)
        if len(items) > limit:
            report["findings"][name] = items[:limit]
    report["totals"] = totals
    report["truncated"] = sorted(k for k, n in totals.items() if n > limit)
    return report


def format_text(report):
    counts, metrics, totals = report["counts"], report["metrics"], report.get("totals", {})
    out = [
        "Vault: {0}".format(report["vault"]),
        "{0} notes ({1} audited), {2} attachments, {3} links, {4} tags".format(
            counts["notes"], counts["notes_audited"], counts["attachments"],
            counts["links"], counts["tags"],
        ),
        "{0} links/note, {1} tasks open, {2} done".format(
            metrics["avg_links_per_note"], counts["tasks_open"], counts["tasks_done"],
        ),
        "",
    ]
    labels = [
        ("orphans", "orphans (no links in or out)"),
        ("no_backlinks", "no backlinks (nothing points here)"),
        ("broken_links", "broken links"),
        ("ambiguous_names", "duplicate filenames (short links are ambiguous)"),
        ("stale_open_tasks", "dated notes with tasks still open"),
        ("stale", "stale notes"),
        ("hollow", "hollow notes"),
        ("single_use_tags", "tags used once"),
        ("orphan_attachments", "unused attachments"),
        ("missing_frontmatter", "frontmatter contract misses"),
        ("ambiguous_links", "links resolved ambiguously"),
    ]
    for key, label in labels:
        total = totals.get(key, len(report["findings"][key]))
        shown = len(report["findings"][key])
        suffix = " (showing {0})".format(shown) if shown < total else ""
        out.append("{0:>5}  {1}{2}".format(total, label, suffix))
    return "\n".join(out)


class JsonErrorParser(argparse.ArgumentParser):
    """Keep the CLI's error contract: a JSON line on stderr and exit code 1."""

    def error(self, message):
        code = "NO_VAULT" if "vault" in message and "required" in message else "BAD_ARG"
        write_error(message, code)
        raise SystemExit(1)


def build_parser():
    parser = JsonErrorParser(
        prog="vault_audit.py",
        description="Health report of an Obsidian vault. Read-only: it never writes "
        "to the vault. Notes under Templates/ and 04_Archive/ are scanned so links "
        "resolve but excluded from findings unless --audit-all.",
    )
    parser.add_argument("vault", help="path to the vault (the directory containing .obsidian/)")
    parser.add_argument("--format", choices=["json", "text"], default="json")
    parser.add_argument("--stale-days", type=int, default=DEFAULT_STALE_DAYS,
                        help="days without modification to count as stale. Default: 180")
    parser.add_argument("--hollow-words", type=int, default=DEFAULT_HOLLOW_WORDS,
                        help="word count below which a note is hollow. Default: 30")
    parser.add_argument("--task-days", type=int, default=DEFAULT_TASK_DAYS,
                        help="age of a dated note whose open tasks get flagged. Default: 7")
    parser.add_argument("--require", action="append", metavar="FIELD",
                        help="frontmatter field every note must declare (repeatable). "
                             "Default: created, type")
    parser.add_argument("-n", "--limit", type=int, default=DEFAULT_LIMIT,
                        help="max items per finding list; 0 for no cap. Default: 25")
    parser.add_argument("--exempt", action="append", metavar="DIR",
                        help="folder scanned but kept out of the findings (repeatable). "
                             "Default: Templates, 04_Archive")
    parser.add_argument("--audit-all", action="store_true",
                        help="include the exempt folders in the findings too")
    return parser


def force_utf8_streams():
    """
    On Windows stdout defaults to cp1252, so a note title with an accent raises
    UnicodeEncodeError the moment output is piped to a file.
    """
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def main():
    force_utf8_streams()
    args = build_parser().parse_args()
    root = os.path.abspath(os.path.expanduser(args.vault))
    if not os.path.isdir(root):
        write_error("no such directory: {0}".format(args.vault), "NO_VAULT")
        sys.exit(1)
    if not os.path.isdir(os.path.join(root, ".obsidian")):
        # Not fatal: a vault copied without its config, or a plain markdown
        # folder, still audits fine. But the caller should know it is not one.
        sys.stderr.write(
            json.dumps({"warning": "no .obsidian/ found: auditing as a plain markdown folder",
                        "code": "NOT_A_VAULT"}) + "\n"
        )

    report = cap(audit(root, args), args.limit)
    if args.format == "text":
        print(format_text(report))
    else:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    main()
