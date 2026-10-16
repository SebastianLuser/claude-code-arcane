#!/usr/bin/env python3
"""Session watch: cheap, deterministic signals the model should not have to remember.

`session_watch.py post-tool` (PostToolUse, every tool):
  - records each file Claude edits, for the Stop check below;
  - warns when the same tool runs with the same input 5 times in a row (a loop);
  - warns once when a session has edited 15 files (scope drift);
  - warns when the context passes 70% and 85% of the real window, so active.md is
    brought up to date before a compaction. The window size comes from the status
    line (statusline.sh caches what Claude Code reports); without it, no warning,
    since guessing the window would warn far too early on 1M-token sessions.

`session_watch.py stop` (Stop): formats the files edited this turn and type-checks
them with the project's own tools (Prettier or Biome + tsc, gofmt + go vet,
dotnet format). Only errors in files edited this turn block the stop, once, so
errors the project already had never trap a session.

State lives in .claude/session-state/watch-<session>.json, which ignores itself.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

LOOP_LENGTH = 5
SCOPE_FILES = 15
CONTEXT_WARNINGS = (70, 85)
FILE_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}
IGNORED_INPUT_KEYS = {"description", "timeout"}
CHECK_TIMEOUT = 90
MAX_REPORT_LINES = 25


# --- state -------------------------------------------------------------------

def state_dir(project: str) -> str:
    path = os.path.join(project, ".claude", "session-state")
    os.makedirs(path, exist_ok=True)
    ignore = os.path.join(path, ".gitignore")
    if not os.path.exists(ignore):
        with open(ignore, "w", encoding="utf-8") as f:
            f.write("*\n")
    return path


def load_state(project: str, session: str) -> dict:
    path = os.path.join(state_dir(project), f"watch-{safe(session)}.json")
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def save_state(project: str, session: str, state: dict) -> None:
    path = os.path.join(state_dir(project), f"watch-{safe(session)}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f)


def safe(session: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]", "", session or "default")[:64] or "default"


# --- post-tool -----------------------------------------------------------------

def post_tool(payload: dict, project: str) -> list[str]:
    """Update the session state and return the warnings to show Claude."""
    session = payload.get("session_id", "")
    state = load_state(project, session)
    warnings: list[str] = []
    tool = payload.get("tool_name", "")
    tool_input = payload.get("tool_input") or {}

    if tool in FILE_TOOLS:
        path = tool_input.get("file_path") or tool_input.get("notebook_path")
        if path:
            absolute = os.path.abspath(os.path.join(project, path))
            pending = state.setdefault("pending", [])
            if absolute not in pending:
                pending.append(absolute)
            edited = state.setdefault("edited", [])
            if absolute not in edited:
                edited.append(absolute)
            if len(edited) >= SCOPE_FILES and not state.get("scope_warned"):
                state["scope_warned"] = True
                warnings.append(f"This session has edited {len(edited)} files. Check the change is still "
                                "within the task's scope before going further.")

    # The description is Claude's label for the call ("call 2 of 6"), not what runs.
    action = {k: v for k, v in tool_input.items() if k not in IGNORED_INPUT_KEYS}
    digest = hashlib.sha1(json.dumps([tool, action], sort_keys=True).encode()).hexdigest()
    recent = (state.get("recent", []) + [digest])[-LOOP_LENGTH:]
    state["recent"] = recent
    if len(recent) == LOOP_LENGTH and len(set(recent)) == 1 and state.get("loop_warned") != digest:
        state["loop_warned"] = digest
        warnings.append(f"{tool} ran {LOOP_LENGTH} times in a row with the same input. Stop repeating it: "
                        "name the assumption that may be wrong, or ask the user one diagnostic question.")

    used = context_used(project, session)
    if used is not None:
        for level in CONTEXT_WARNINGS:
            if used >= level and state.get("context_warned", 0) < level:
                state["context_warned"] = level
                warnings.append(f"Context is at {used:.0f}% of the window. At the next logical point "
                                "(a commit, a finished step), update .claude/session-state/active.md if this "
                                "task has one, then suggest the user run /compact.")
                break

    save_state(project, session, state)
    return warnings


def context_used(project: str, session: str) -> float | None:
    """Percent of the real context window in use, as the status line last saw it."""
    path = os.path.join(project, ".claude", "session-state", "context.json")
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError):
        return None
    if data.get("session_id") != session:
        return None
    try:
        return float(data["used_percentage"])
    except (KeyError, TypeError, ValueError):
        return None


# --- stop ----------------------------------------------------------------------

def find_up(start: str, names: tuple[str, ...], stop_at: str) -> str | None:
    """Nearest ancestor of `start` (up to `stop_at`) containing one of `names`."""
    current = os.path.dirname(start)
    stop_at = os.path.abspath(stop_at)
    while True:
        if any(os.path.exists(os.path.join(current, n)) for n in names):
            return current
        if os.path.abspath(current) == stop_at or os.path.dirname(current) == current:
            return None
        current = os.path.dirname(current)


def local_bin(root: str, name: str) -> str | None:
    """A tool installed in the project; never one npx would download."""
    for folder in (root, os.path.dirname(root)):
        base = os.path.join(folder, "node_modules", ".bin", name)
        for candidate in ((base + ".cmd", base) if os.name == "nt" else (base,)):
            if os.path.exists(candidate):
                return candidate
    return None


def plan_checks(files: list[str], project: str) -> list[dict]:
    """Group edited files by project root and pick the format and check commands."""
    plans: dict[tuple, dict] = {}

    def add(key: tuple, cwd: str, fmt: list | None, check: list | None, file: str) -> None:
        plan = plans.setdefault(key, {"cwd": cwd, "format": fmt, "check": check, "files": []})
        plan["files"].append(file)

    for file in files:
        if not os.path.exists(file):
            continue
        ext = os.path.splitext(file)[1].lower()
        if ext in (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", ".scss", ".md"):
            root = find_up(file, ("package.json",), project)
            if not root:
                continue
            fmt = None
            biome = local_bin(root, "biome")
            prettier = local_bin(root, "prettier")
            if biome and any(os.path.exists(os.path.join(root, n)) for n in ("biome.json", "biome.jsonc")):
                fmt = [biome, "format", "--write"]
            elif prettier:
                fmt = [prettier, "--write", "--log-level", "warn"]
            check = None
            if ext in (".ts", ".tsx"):
                tsconfig = find_up(file, ("tsconfig.json",), project)
                tsc = local_bin(root, "tsc")
                if tsconfig and tsc:
                    check = [tsc, "--noEmit", "--pretty", "false", "-p", os.path.join(tsconfig, "tsconfig.json")]
            add(("node", root, tuple(check or ())), root, fmt, check, file)
        elif ext == ".go" and shutil.which("gofmt"):
            root = find_up(file, ("go.mod",), project)
            if root:
                rel = "./" + os.path.relpath(os.path.dirname(file), root).replace("\\", "/")
                check = ["go", "vet", rel] if shutil.which("go") else None
                add(("go", root, rel), root, ["gofmt", "-w"], check, file)
        elif ext == ".cs" and shutil.which("dotnet"):
            root = find_up(file, (".editorconfig",), project) or project
            add(("dotnet", root), root, ["dotnet", "format", "whitespace", ".", "--folder", "--include"], None, file)
    return list(plans.values())


def run(command: list[str], cwd: str) -> tuple[int, str]:
    try:
        result = subprocess.run(command, cwd=cwd, capture_output=True, text=True,
                                timeout=CHECK_TIMEOUT, encoding="utf-8", errors="replace")
        return result.returncode, (result.stdout or "") + (result.stderr or "")
    except (OSError, subprocess.TimeoutExpired) as error:
        return 0, f"skipped: {error}"


def errors_in(output: str, files: list[str], cwd: str) -> list[str]:
    """Error lines that name one of `files`; errors elsewhere predate this turn."""
    wanted = {os.path.normcase(os.path.abspath(f)) for f in files}
    lines = []
    for line in output.splitlines():
        match = re.match(r"^(.+?)(?:\(\d+,\d+\)|:\d+:\d+)", line.strip())
        if not match:
            continue
        candidate = os.path.normcase(os.path.abspath(os.path.join(cwd, match.group(1).strip())))
        if candidate in wanted:
            lines.append(line.strip())
    return lines


def stop(payload: dict, project: str) -> dict | None:
    session = payload.get("session_id", "")
    state = load_state(project, session)
    files = state.pop("pending", [])
    save_state(project, session, state)
    if not files or payload.get("stop_hook_active"):
        return None

    problems: list[str] = []
    for plan in plan_checks(files, project):
        if plan["format"]:
            run(plan["format"] + plan["files"], plan["cwd"])
        if plan["check"]:
            code, output = run(plan["check"], plan["cwd"])
            if code != 0:
                problems.extend(errors_in(output, plan["files"], plan["cwd"]))
    if not problems:
        return None
    shown = problems[:MAX_REPORT_LINES]
    more = f"\n... and {len(problems) - len(shown)} more" if len(problems) > len(shown) else ""
    return {
        "decision": "block",
        "reason": "The type check found errors in files you edited this turn. Fix them before finishing:\n"
                  + "\n".join(shown) + more,
    }


# --- entry point ---------------------------------------------------------------

def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except ValueError:
        return 0
    project = os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or os.getcwd()
    if mode == "post-tool":
        warnings = post_tool(payload, project)
        if warnings:
            print(json.dumps({"hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": "Arcane session watch: " + " ".join(warnings),
            }}))
    elif mode == "stop":
        decision = stop(payload, project)
        if decision:
            print(json.dumps(decision))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:  # a watch bug must never break the session
        sys.exit(0)
