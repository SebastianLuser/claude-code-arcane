#!/usr/bin/env python3
"""
Migrates a career workspace from the old Spanish data contract to the English one.

Before the change the workspace used Spanish folder names, fixed note names,
template names, frontmatter keys and values and seen_jobs.json fields. The
skills now read only the English contract, so an old workspace looks empty
until it is migrated. Every old name lives in legacy_contract.es.json next to
this script; this file only knows the English side.

What it touches, and nothing else:
  * the numbered folders and a few fixed note names (the master profile, the
    portfolio data note, the Templates/ files);
  * the frontmatter of the notes in the numbered folders, 00-Dashboard.md and
    Templates/: known keys and known enum values;
  * tools/job_scraper/seen_jobs.json (schema version 1 -> 2).

Note bodies are never edited. Wikilinks in a body that name a renamed note or
folder are reported so the user can fix them; values it does not recognize are
reported and left as they are.

Usage:
  python migrate_workspace.py                  # dry run: prints the plan as JSON
  python migrate_workspace.py --apply          # copies the workspace to a backup, then migrates
  python migrate_workspace.py --workspace PATH [--apply]

The workspace resolves like career_registry.py: --workspace, CAREER_WORKSPACE,
or ./career-workspace. --apply never deletes a file (an old folder is removed
only once it is empty) and running it twice changes nothing.
Stdlib only. Compatible with Python 3.9.
"""

import argparse
import json
import os
import re
import shutil
import sys
import unicodedata
from datetime import datetime
from pathlib import Path

DEFAULT_WORKSPACE = "career-workspace"
SEEN_JOBS = Path("tools") / "job_scraper" / "seen_jobs.json"
DASHBOARD = "00-Dashboard.md"
TEMPLATES_DIR = "Templates"

with open(Path(__file__).with_name("legacy_contract.es.json"), encoding="utf-8") as _pack:
    LEGACY = json.load(_pack)

FOLDERS = LEGACY["folders"]  # old -> new
NOTE_FOLDERS = ("02-CVs",) + tuple(FOLDERS) + tuple(FOLDERS.values())

# (folder, old file name, new file name). The folder is the new name; the old
# folder name is checked too, since files are renamed before folders.
FILE_RENAMES = [tuple(entry) for entry in LEGACY["file_renames"]]

KEYS = LEGACY["frontmatter_keys"]

# Per (new) key: old value -> new value, and the values already valid in English.
# Lookups are accent- and case-insensitive. A key in STRICT reports any other value.
VALID = {
    "type": {"application", "freelance", "contract", "profile", "company", "contact",
             "interview", "custom_cv", "dashboard", "application-costs", "upskill",
             "pipeline"},
    "status": {"interested", "applied", "interviewing", "offer", "hired", "rejected",
               "no_response", "declined", "discarded", "screened", "proposal_sent",
               "in_conversation", "contract_active", "delivered", "won_closed", "disputed",
               "active", "closed", "paused"},
    "priority": {"high", "medium", "low"},
    "pricing": {"fixed", "hourly"},
    "client_risk": {"low", "medium", "high", "do not apply"},
    "work_mode": {"remote", "hybrid", "onsite"},
}
VALUES = {key: (LEGACY["frontmatter_values"].get(key, {}), VALID.get(key, set()))
          for key in set(VALID) | set(LEGACY["frontmatter_values"])}
STRICT = {"type", "status", "priority", "pricing", "client_risk", "work_mode"}

# Text replaced inside frontmatter values and reported when found in a body.
# Templates are never wikilinked, so only the other renamed notes count.
LINKS = [("[[" + old[:-3], "[[" + new[:-3]) for folder, old, new in FILE_RENAMES
         if folder != TEMPLATES_DIR]
PATHS = [(old + "/", new + "/") for old, new in FOLDERS.items()]

SEEN = LEGACY["seen_jobs"]
SEEN_TOP_KEYS = SEEN["top_keys"]
SEEN_ENTRY_KEYS = SEEN["entry_keys"]
SEEN_STATUS = SEEN["status"]
SEEN_STATUS_VALID = {"new", "discarded", "note_created"}
SEEN_SOURCE_KEYS = SEEN["source_keys"]
SEEN_SOURCE_VALUES = LEGACY["frontmatter_values"]["source"]
NOTE_URL_SCHEME = tuple(SEEN["note_url_scheme"])  # (old, new)
# The fallback slugs job_key.py puts in a key, by their new name.
_OLD_SLUG = {new: re.escape(old) for old, new in SEEN["job_key_slugs"].items()}
# shortcut: a company slugged exactly like the old hash fallback would be renamed
# too; it only happens with a hash-shaped name, so recomputing job_key is not worth it.
SEEN_KEY_PARTS = [(re.compile("^" + _OLD_SLUG["no-company"] + r"\|"), "no-company|"),
                  (re.compile("^" + _OLD_SLUG["company"] + r"-([0-9a-f]{6})\|"), r"company-\1|"),
                  (re.compile(r"\|" + _OLD_SLUG["untitled"] + r"-([0-9a-f]{6})$"), r"|untitled-\1")]

LINE = re.compile(r"^(\w[\w-]*)([ \t]*:)([ \t]*)(.*?)([ \t]*)$")
ITEM = re.compile(r"^(\s+-[ \t]+|-[ \t]+)(.*?)([ \t]*)$")


def fold(text):
    decomposed = unicodedata.normalize("NFD", str(text).lower())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn")


def replace_text(value):
    for old, new in LINKS + PATHS:
        value = value.replace(old, new)
    return value


def map_scalar(key, raw, note, unknown):
    """One frontmatter value for `key`, with its quotes kept. Reports unknown enum values."""
    quote = raw[0] if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in "\"'" else ""
    value = raw[1:-1] if quote else raw
    if key in VALUES and value.strip() and "{{" not in value:
        mapping, valid = VALUES[key]
        folded = fold(value.strip())
        if folded in mapping:
            value = mapping[folded]
        elif key in STRICT and folded not in valid:
            unknown.append({"note": note, "key": key, "value": value.strip()})
    return quote + replace_text(value) + quote


def map_value(key, raw, note, unknown):
    if raw.startswith("[") and raw.endswith("]"):
        items = [i.strip() for i in raw[1:-1].split(",") if i.strip()]
        return "[" + ", ".join(map_scalar(key, i, note, unknown) for i in items) + "]"
    return map_scalar(key, raw, note, unknown)


def split_frontmatter(text):
    """(prefix, frontmatter lines with their line endings, rest) or None."""
    bom = "﻿" if text.startswith("﻿") else ""
    lines = text[len(bom):].splitlines(keepends=True)
    if not lines or lines[0].rstrip("\r\n") != "---":
        return None
    for index in range(1, len(lines)):
        if lines[index].rstrip("\r\n") == "---":
            return bom + lines[0], lines[1:index], "".join(lines[index:])
    return None


def rewrite_note(text, note):
    """Returns (new_text, changes, unknown, conflicts, body_links)."""
    changes, unknown, conflicts = [], [], []
    parts = split_frontmatter(text)
    body = parts[2] if parts else text
    body_links = sorted({old for old, _ in LINKS + [("[[" + o, "") for o, _ in PATHS]
                         if old in body})
    if not parts:
        return text, changes, unknown, conflicts, body_links
    head, fm_lines, rest = parts
    present = {m.group(1) for m in (LINE.match(l.rstrip("\r\n")) for l in fm_lines) if m}

    out, key = [], None
    for line in fm_lines:
        content = line.rstrip("\r\n")
        eol = line[len(content):]
        match = LINE.match(content)
        item = ITEM.match(content) if not match else None
        if match:
            name, sep, gap, value, tail = match.groups()
            key = name
            if name in KEYS:
                if KEYS[name] in present:
                    conflicts.append({"note": note, "problem": "both '{0}' and '{1}' exist; "
                                      "'{0}' left as is".format(name, KEYS[name])})
                else:
                    key = KEYS[name]
            new_value = map_value(key, value, note, unknown) if value else value
            new_line = key + sep + gap + new_value + tail
        elif item and key:
            prefix, value, tail = item.groups()
            new_line = prefix + map_scalar(key, value, note, unknown) + tail
        else:
            new_line = content
        if new_line != content:
            changes.append("{0} -> {1}".format(content.strip(), new_line.strip()))
        out.append(new_line + eol)
    return head + "".join(out) + rest, changes, unknown, conflicts, body_links


def read_note(path):
    """newline="" keeps the note's own line endings, so writing it back changes only the edits."""
    with open(path, encoding="utf-8", errors="replace", newline="") as handle:
        return handle.read()


def note_files(workspace):
    """Notes whose frontmatter belongs to the contract: never portfolio/ or tools/."""
    files = [workspace / DASHBOARD] if (workspace / DASHBOARD).is_file() else []
    for folder in NOTE_FOLDERS + (TEMPLATES_DIR,):
        base = workspace / folder
        if base.is_dir():
            files.extend(sorted(p for p in base.rglob("*.md") if p.is_file()))
    return files


def rewrite_seen(doc, unknown):
    """seen_jobs.json, v1 -> v2. Returns (new_doc, changes)."""
    if not isinstance(doc, dict):
        return doc, []
    changes = []
    new = {}
    for k, v in doc.items():
        target = SEEN_TOP_KEYS.get(k)
        if target and target not in doc:
            new[target] = v
            changes.append("{0} -> {1}".format(k, target))
        else:
            new[k] = v
    if new.get("schema_version") == 1:
        new["schema_version"] = 2
        changes.append("schema_version 1 -> 2")

    def fix_entry(job_key, entry):
        if not isinstance(entry, dict):
            return entry
        fixed = {}
        for k, v in entry.items():
            target = SEEN_ENTRY_KEYS.get(k, k)
            if target != k and target in entry:
                target = k  # both names present: leave the old one alone
            if target != k:
                changes.append("{0}: {1} -> {2}".format(job_key, k, target))
            if target == "status" and v in SEEN_STATUS:
                changes.append("{0}: status {1} -> {2}".format(job_key, v, SEEN_STATUS[v]))
                v = SEEN_STATUS[v]
            elif target == "status" and v not in SEEN_STATUS_VALID:
                unknown.append({"note": str(SEEN_JOBS), "key": job_key + ".status", "value": v})
            elif target in ("note", "url") and isinstance(v, str):
                v = replace_text(v).replace(*NOTE_URL_SCHEME)
            elif target == "sources" and isinstance(v, list):
                v = [fix_source(job_key, s) for s in v]
            fixed[target] = v
        return fixed

    def fix_source(job_key, source):
        if not isinstance(source, dict):
            return source
        fixed = {}
        for k, v in source.items():
            target = SEEN_SOURCE_KEYS.get(k, k)
            if target in source:
                target = k  # both names present: leave the old one alone
            if k == "source" and isinstance(v, str) and v in SEEN_SOURCE_VALUES:
                v = SEEN_SOURCE_VALUES[v]
            if k == "url" and isinstance(v, str):
                v = v.replace(*NOTE_URL_SCHEME)
            fixed[target] = v
        if fixed != source:
            changes.append("{0}: sources entry updated".format(job_key))
        return fixed

    jobs = new.get("jobs")
    if isinstance(jobs, dict):
        renamed = {}
        for job_key, entry in jobs.items():
            target = job_key
            for pattern, repl in SEEN_KEY_PARTS:
                target = pattern.sub(repl, target)
            if target != job_key and target in jobs:
                target = job_key  # the new key is taken: keep the old one
            if target != job_key:
                changes.append("key {0} -> {1}".format(job_key, target))
            renamed[target] = fix_entry(target, entry)
        new["jobs"] = renamed
    elif isinstance(jobs, list):
        new["jobs"] = [fix_entry("jobs[{0}]".format(i), e) for i, e in enumerate(jobs)]
    return new, changes


def plan(workspace):
    result = {"rename_files": [], "rename_folders": [], "frontmatter": [], "state_files": [],
              "unknown_values": [], "conflicts": [], "body_links_to_old_names": []}

    for folder, old_name, new_name in FILE_RENAMES:
        old_folder = next((o for o, n in FOLDERS.items() if n == folder), None)
        for base in (folder, old_folder):
            if not base or not (workspace / base / old_name).is_file():
                continue
            src, dst = Path(base) / old_name, Path(base) / new_name
            if (workspace / dst).exists():
                result["conflicts"].append({"note": str(src), "problem": "{0} already exists; "
                                            "not renamed".format(dst)})
            else:
                result["rename_files"].append({"from": src.as_posix(), "to": dst.as_posix()})

    for old, new in FOLDERS.items():
        if (workspace / old).is_dir():
            how = "merge" if (workspace / new).exists() else "rename"
            result["rename_folders"].append({"from": old, "to": new, "how": how})

    for path in note_files(workspace):
        rel = path.relative_to(workspace).as_posix()
        text = read_note(path)
        new_text, changes, unknown, conflicts, links = rewrite_note(text, rel)
        if new_text != text:
            result["frontmatter"].append({"note": rel, "changes": changes})
        result["unknown_values"].extend(unknown)
        result["conflicts"].extend(conflicts)
        if links:
            result["body_links_to_old_names"].append({"note": rel, "links": links})

    seen = workspace / SEEN_JOBS
    if seen.is_file():
        try:
            doc = json.loads(seen.read_text(encoding="utf-8"))
        except ValueError as e:
            result["conflicts"].append({"note": SEEN_JOBS.as_posix(),
                                        "problem": "not valid JSON, left alone: {0}".format(e)})
        else:
            new_doc, changes = rewrite_seen(doc, result["unknown_values"])
            if new_doc != doc:
                result["state_files"].append({"file": SEEN_JOBS.as_posix(), "changes": changes})
    return result


def has_work(result):
    return any(result[k] for k in ("rename_files", "rename_folders", "frontmatter", "state_files"))


def apply(workspace, result):
    """Content first, then file renames, then folders: every planned path is still valid."""
    for item in result["frontmatter"]:
        path = workspace / item["note"]
        new_text = rewrite_note(read_note(path), item["note"])[0]  # read before "w" truncates
        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(new_text)

    if result["state_files"]:
        seen = workspace / SEEN_JOBS
        doc, _ = rewrite_seen(json.loads(seen.read_text(encoding="utf-8")), [])
        seen.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    for item in result["rename_files"]:
        os.rename(workspace / item["from"], workspace / item["to"])

    for item in result["rename_folders"]:
        old, new = workspace / item["from"], workspace / item["to"]
        if not new.exists():
            os.rename(old, new)
            continue
        for child in sorted(old.iterdir()):
            if (new / child.name).exists():
                result["conflicts"].append({"note": "{0}/{1}".format(item["from"], child.name),
                                            "problem": "{0}/{1} already exists; left in {2}".format(
                                                item["to"], child.name, item["from"])})
            else:
                os.rename(child, new / child.name)
        if not any(old.iterdir()):
            old.rmdir()


def backup(workspace):
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    target = workspace.parent / "{0}.backup-{1}".format(workspace.name, stamp)
    # node_modules of a portfolio site is reinstallable and the migration never touches it.
    shutil.copytree(workspace, target, ignore=shutil.ignore_patterns("node_modules"))
    return target


def resolve_workspace(args):
    candidate = args.workspace or os.environ.get("CAREER_WORKSPACE") or DEFAULT_WORKSPACE
    path = Path(candidate).expanduser().resolve()
    if not path.is_dir():
        emit({"error": "workspace does not exist: {0}".format(path), "code": "NO_WORKSPACE",
              "help": "pass --workspace, or set CAREER_WORKSPACE"})
        raise SystemExit(1)
    return path


def emit(payload):
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2, default=str)
    sys.stdout.write("\n")


def main(argv=None):
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(
        description="Migrate a career workspace to the English data contract (dry run by default).")
    parser.add_argument("--workspace", help="path to the career workspace")
    parser.add_argument("--apply", action="store_true",
                        help="back up the workspace next to it, then migrate")
    args = parser.parse_args(argv)
    try:
        workspace = resolve_workspace(args)
    except SystemExit as e:
        return int(e.code or 0)

    result = plan(workspace)
    work = has_work(result)
    payload = {"workspace": str(workspace), "mode": "apply" if args.apply else "dry-run",
               "nothing_to_do": not work, "backup": None}
    if args.apply and work:
        payload["backup"] = str(backup(workspace))
        apply(workspace, result)
    payload.update(result)
    emit(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
