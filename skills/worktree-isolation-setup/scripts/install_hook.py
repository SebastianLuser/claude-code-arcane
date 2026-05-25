#!/usr/bin/env python3
"""Install the worktree-isolation SessionStart hook globally.

Idempotent. Safe to re-run.

What it does:
1. Copies `apply.py` + `lib.py` from this skill's `scripts/` dir into
   `~/.claude/scripts/worktree-isolation/` (creating the dir if needed).
2. Ensures `~/.claude/settings.json` has a `SessionStart` hook entry that
   invokes the copied `apply.py --quiet`.

Re-running is a no-op if the hook + scripts are already in place.
"""

from __future__ import annotations

import json
import os
import shutil
import stat
import sys
from pathlib import Path

HOME = Path.home()
TARGET_DIR = HOME / ".claude" / "scripts" / "worktree-isolation"
SETTINGS_PATH = HOME / ".claude" / "settings.json"
HOOK_COMMAND = f"{TARGET_DIR}/apply.py --quiet"

SCRIPTS_TO_COPY = ("apply.py", "lib.py")


def copy_scripts(source_dir: Path) -> list[str]:
    """Copy hook scripts into ~/.claude/scripts/worktree-isolation/. Returns list of actions taken."""
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    actions: list[str] = []
    for name in SCRIPTS_TO_COPY:
        src = source_dir / name
        dst = TARGET_DIR / name
        if not src.exists():
            raise FileNotFoundError(f"Source script missing: {src}")
        if dst.exists() and dst.read_bytes() == src.read_bytes():
            actions.append(f"  • {name}: already up-to-date")
            continue
        shutil.copy2(src, dst)
        # Ensure apply.py is executable.
        if name == "apply.py":
            mode = dst.stat().st_mode
            dst.chmod(mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
        actions.append(f"  • {name}: installed → {dst}")
    return actions


def hook_already_installed(settings: dict) -> bool:
    for entry in settings.get("hooks", {}).get("SessionStart", []):
        for hook in entry.get("hooks", []):
            cmd = hook.get("command", "")
            if "worktree-isolation/apply.py" in cmd and "--quiet" in cmd:
                return True
    return False


def install_hook() -> str:
    """Add SessionStart hook to ~/.claude/settings.json. Returns a status string."""
    if SETTINGS_PATH.exists():
        try:
            settings = json.loads(SETTINGS_PATH.read_text())
        except json.JSONDecodeError as exc:
            raise SystemExit(
                f"Refusing to modify malformed {SETTINGS_PATH}: {exc}. Fix manually and re-run."
            )
    else:
        settings = {}

    if hook_already_installed(settings):
        return "  • SessionStart hook: already present (no change)"

    hooks = settings.setdefault("hooks", {})
    session_start = hooks.setdefault("SessionStart", [])

    new_entry = {
        "matcher": "",
        "hooks": [{"type": "command", "command": HOOK_COMMAND}],
    }

    # Prefer to attach to an existing matcher="" entry rather than appending a new one.
    for entry in session_start:
        if entry.get("matcher", "") == "":
            entry.setdefault("hooks", []).append(new_entry["hooks"][0])
            break
    else:
        session_start.append(new_entry)

    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_PATH.write_text(json.dumps(settings, indent=2) + "\n")
    return f"  • SessionStart hook: added to {SETTINGS_PATH}"


def main() -> int:
    here = Path(__file__).resolve().parent
    print(f"Installing worktree-isolation hook from {here}")
    print()

    print("1) Copying hook scripts:")
    for line in copy_scripts(here):
        print(line)

    print()
    print("2) Wiring SessionStart hook:")
    print(install_hook())

    print()
    print("Done. Open a new Claude Code session inside any git worktree to verify.")
    print(f"   .env.worktree should appear in the worktree root automatically.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
