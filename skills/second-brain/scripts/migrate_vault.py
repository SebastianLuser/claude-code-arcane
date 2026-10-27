#!/usr/bin/env python3
"""
migrate_vault.py - Moves an Obsidian vault from the second brain's old Spanish
contract to the English one the skills now read.

The old names live in legacy_contract.es.json next to this script. What gets
rewritten, and nothing else:

  * heading lines that match a mapped heading exactly (the whole line), in any note;
  * in the vault-root CLAUDE.md: its section names, the marker of an unused role
    and the list of project statuses;
  * the `status:` frontmatter value of project notes (`type: project`);
  * the "why I saved it" label that opens a line in clip notes;
  * in .base files: view names, display names, the age formula and status filters.

The user's templates (the `templates` role of the CLAUDE.md paths table, default
Templates/) are migrated like any other note and listed as templates in the plan,
since no skill touches them otherwise. No other body text is edited. What it does
not recognize (a project status outside the old and new vocabularies, a heading
that differs from a mapped one only in accents or case) is reported and left as is.

Usage:
    python migrate_vault.py <vault>            # dry run: prints the plan per file
    python migrate_vault.py <vault> --apply    # backs up each file it changes, then rewrites it

--apply first copies every file it is about to change into
<vault>/.arcane-migration-backup/<timestamp>/, keeping relative paths. Running it
again plans nothing. Skips .obsidian/, .git/, .trash/ and the backups.
Stdlib only. Compatible with Python 3.9.
"""

import argparse
import json
import os
import re
import shutil
import sys
import time
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
LEGACY_FILE = os.path.join(HERE, "legacy_contract.es.json")
BACKUP_DIR = ".arcane-migration-backup"
SKIP_DIRS = {".obsidian", ".git", ".trash", BACKUP_DIR}
DEFAULT_TEMPLATES = "Templates"
PATHS_HEADING = "## Paths"
# Statuses the current contract uses: left alone and never reported.
KNOWN_STATUSES = {"seed", "provisional", "evergreen", "contested", "archived",
                  "active", "paused", "closed"}

FENCE = re.compile(r"^\s*(```|~~~)")
FIELD = re.compile(r"^(?P<key>[A-Za-z_]+):\s*(?P<q>[\"']?)(?P<value>[^\"'#]*?)(?P=q)\s*(?:#.*)?$")
BASE_LABEL = re.compile(r"^\s*(?:-\s+)?(?:name|displayName):\s*(?P<q>[\"']?)(?P<value>.*?)(?P=q)\s*$")
BASE_STATUS = re.compile(r"\bstatus\s*[!=]=\s*(?P<q>[\"'])(?P<value>[^\"']*)(?P=q)")
TABLE_ROW = re.compile(r"^\|\s*`?(?P<role>[\w-]+)`?\s*\|\s*`?(?P<path>[^`|]*?)`?\s*\|")


def write_error(error, code):
    sys.stderr.write(json.dumps({"error": error, "code": code}) + "\n")


def load_legacy(path=LEGACY_FILE):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def fold(text):
    """Lowercase without accents: spots a heading that is almost a mapped one."""
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(c for c in decomposed if not unicodedata.combining(c)).lower()


def read_text(path):
    # newline="" keeps CRLF files as CRLF when they are written back.
    with open(path, encoding="utf-8", newline="") as handle:
        return handle.read()


def split_eol(line):
    body = line.rstrip("\r\n")
    return body, line[len(body):]


def replace_span(text, match, group, value):
    return text[:match.start(group)] + value + text[match.end(group):]


def frontmatter_end(lines):
    """Index of the first body line: 0 when the note has no frontmatter."""
    if not lines or split_eol(lines[0])[0].lstrip("﻿") != "---":
        return 0
    for i in range(1, len(lines)):
        if split_eol(lines[i])[0].strip() == "---":
            return i + 1
    return 0


def templates_dir(root, legacy):
    """The `templates` role from the CLAUDE.md paths table, the way the skills read it."""
    try:
        lines = read_text(os.path.join(root, "CLAUDE.md")).splitlines()
    except (OSError, UnicodeDecodeError):
        return DEFAULT_TEMPLATES
    names = {PATHS_HEADING} | {old for old, new in legacy["claude_md_headings"].items()
                               if new == PATHS_HEADING}
    inside = False
    for line in lines:
        if line.startswith("#"):
            inside = line.strip() in names
            continue
        match = TABLE_ROW.match(line.strip()) if inside else None
        if match and match.group("role") == "templates":
            value = match.group("path").strip().strip("/")
            return None if value.startswith("(") else value
    return DEFAULT_TEMPLATES


def vault_files(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for name in sorted(filenames):
            if name.endswith((".md", ".base")):
                yield os.path.relpath(os.path.join(dirpath, name), root).replace(os.sep, "/")


def migrate_project_status(body, legacy, report, line_no):
    match = FIELD.match(body)
    if not match or match.group("key") != "status":
        return body
    value = match.group("value").strip()
    mapped = legacy["project_status"].get(value.lower())
    if mapped:
        return replace_span(body, match, "value", mapped)
    if value and value.lower() not in KNOWN_STATUSES:
        report("project status {0!r}".format(value), line_no)
    return body


def migrate_markdown(lines, legacy, root_claude_md, report):
    headings = dict(legacy["note_headings"])
    if root_claude_md:
        headings.update(legacy["claude_md_headings"])
    almost = {fold(old): old for old in headings}
    end = frontmatter_end(lines)
    note_type = ""
    for line in lines[1:end]:
        match = FIELD.match(split_eol(line)[0])
        if match and match.group("key") == "type":
            note_type = match.group("value").strip().lower()

    out, in_fence = [], False
    for i, line in enumerate(lines):
        body, eol = split_eol(line)
        new = body
        if 0 < i < end - 1:
            if note_type == "project":
                new = migrate_project_status(body, legacy, report, i + 1)
        elif i >= end:
            if FENCE.match(body):
                in_fence = not in_fence
            elif not in_fence:
                heading = body.rstrip()
                if heading in headings:
                    new = headings[heading]
                elif heading.startswith("#") and fold(heading) in almost:
                    report("heading {0!r} is close to {1!r} but not equal".format(
                        heading, almost[fold(heading)]), i + 1)
                if note_type == "clip":
                    for old, label in legacy["clip_labels"].items():
                        if new.startswith(old):
                            new = label + new[len(old):]
                if root_claude_md:
                    for old, value in legacy["claude_md_values"].items():
                        new = new.replace(old, value)
        out.append(new + eol)
    return out


def migrate_base(lines, legacy, report):
    out = []
    for i, line in enumerate(lines):
        body, eol = split_eol(line)
        new = body
        for old, name in legacy["base_identifiers"].items():
            new = re.sub(r"\b{0}\b".format(re.escape(old)), name, new)
        match = BASE_LABEL.match(new)
        if match and match.group("value") in legacy["base_labels"]:
            new = replace_span(new, match, "value", legacy["base_labels"][match.group("value")])

        def status(found, n=i + 1):
            value = found.group("value")
            mapped = legacy["project_status"].get(value.lower())
            if mapped:
                return found.group(0)[:found.start("value") - found.start()] + mapped + found.group("q")
            if value.lower() not in KNOWN_STATUSES:
                report("status filter value {0!r}".format(value), n)
            return found.group(0)

        new = BASE_STATUS.sub(status, new)
        out.append(new + eol)
    return out


def plan(root, legacy=None):
    """Every file the migration would change, plus what it saw and did not recognize."""
    legacy = legacy or load_legacy()
    templates = templates_dir(root, legacy)
    changes, unrecognized = [], []
    for rel in vault_files(root):
        path = os.path.join(root, rel.replace("/", os.sep))

        def report(what, line_no, rel=rel):
            unrecognized.append({"path": rel, "line": line_no, "value": what})

        try:
            text = read_text(path)
        except UnicodeDecodeError:
            report("not UTF-8, skipped", 0)
            continue
        lines = text.splitlines(keepends=True)
        if rel.endswith(".base"):
            new_lines = migrate_base(lines, legacy, report)
        else:
            new_lines = migrate_markdown(lines, legacy, rel == "CLAUDE.md", report)
        edits = [{"line": n + 1, "old": split_eol(a)[0], "new": split_eol(b)[0]}
                 for n, (a, b) in enumerate(zip(lines, new_lines)) if a != b]
        if edits:
            changes.append({
                "path": rel,
                "template": bool(templates) and rel.startswith(templates.rstrip("/") + "/"),
                "edits": edits,
                "text": "".join(new_lines),
            })
    return {"templates": templates, "changes": changes, "unrecognized": unrecognized}


def backup_folder(root):
    stamp = time.strftime("%Y%m%d-%H%M%S")
    folder, n = os.path.join(root, BACKUP_DIR, stamp), 1
    while os.path.exists(folder):  # never overwrite an earlier backup
        folder, n = os.path.join(root, BACKUP_DIR, "{0}-{1}".format(stamp, n)), n + 1
    return folder


def apply(root, result):
    """Copies every file about to change into the backup, then rewrites them."""
    folder = backup_folder(root)
    for change in result["changes"]:
        source = os.path.join(root, change["path"].replace("/", os.sep))
        target = os.path.join(folder, change["path"].replace("/", os.sep))
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copy2(source, target)
    for change in result["changes"]:
        path = os.path.join(root, change["path"].replace("/", os.sep))
        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(change["text"])
    return folder


def print_plan(result):
    print("Templates folder: {0}".format(result["templates"] or "(unused)"))
    for change in result["changes"]:
        print("\n{0}{1}".format(change["path"], "  (template)" if change["template"] else ""))
        for edit in change["edits"]:
            print("  {0}: {1} -> {2}".format(edit["line"], edit["old"].strip(), edit["new"].strip()))
    if result["unrecognized"]:
        print("\nNot recognized, left as they are:")
        for item in result["unrecognized"]:
            print("  {0}:{1}: {2}".format(item["path"], item["line"], item["value"]))
    print()


def build_parser():
    parser = argparse.ArgumentParser(
        description="Migrate a second-brain vault from the old Spanish contract to the English one.")
    parser.add_argument("vault", help="path to the vault (the folder that contains .obsidian/)")
    parser.add_argument("--apply", action="store_true",
                        help="back up and rewrite the files; without it, only print the plan")
    return parser


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    args = build_parser().parse_args(argv)
    root = os.path.abspath(args.vault)
    if not os.path.isdir(os.path.join(root, ".obsidian")):
        write_error("{0} has no .obsidian/ folder: it is not an Obsidian vault".format(root),
                    "not_a_vault")
        return 1
    result = plan(root)
    print_plan(result)
    if not result["changes"]:
        print("Nothing to migrate: the vault already uses the English contract.")
        return 0
    if not args.apply:
        print("{0} files to change. Dry run: nothing was written. "
              "Run again with --apply to migrate.".format(len(result["changes"])))
        return 0
    folder = apply(root, result)
    print("Backed up {0} files to {1} and migrated them.".format(
        len(result["changes"]), os.path.relpath(folder, root).replace(os.sep, "/")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
