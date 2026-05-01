"""CLI entry point: arcane install, arcane list, arcane clean."""

from __future__ import annotations

import argparse
import io
import os
import sys
from pathlib import Path

from . import __version__
from .profiles import Profile, list_profiles, merge_profiles, parse_profile
from .installer import Installer, clean

if sys.platform == "win32":
    os.system("")  # enable ANSI escapes on Windows
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ARCANE_DIR = Path(__file__).resolve().parent.parent

C_RESET = "\033[0m"
C_BOLD = "\033[1m"
C_GREEN = "\033[32m"
C_CYAN = "\033[36m"
C_YELLOW = "\033[33m"
C_RED = "\033[31m"
C_DIM = "\033[2m"


def _profiles_dir() -> Path:
    return ARCANE_DIR / "profiles"


# ── Interactive menu ──


def _interactive_select(profiles: list[Profile]) -> list[str]:
    """Arrow-key profile picker. Works cross-platform with msvcrt/tty."""
    bases = [p for p in profiles if p.profile_type == "base"]
    addons = [p for p in profiles if p.profile_type == "addon"]

    selected_base: set[str] = set()
    selected_addons: set[str] = set()

    all_items = bases + addons
    cursor = 0
    phase = "all"  # single phase, toggle selection

    def render() -> None:
        sys.stdout.write("\033[2J\033[H")  # clear screen
        print(f"{C_BOLD}Claude Code Arcane — Profile Selector{C_RESET}\n")
        print(f"  {C_DIM}↑/↓ move  •  SPACE toggle  •  ENTER confirm  •  q quit{C_RESET}\n")

        print(f"  {C_CYAN}Base profiles{C_RESET}")
        for i, p in enumerate(bases):
            marker = "[x]" if p.name in selected_base else "[ ]"
            arrow = "> " if i == cursor else "  "
            color = C_GREEN if p.name in selected_base else ""
            reset = C_RESET if color else ""
            print(f"  {arrow}{color}{marker} {p.name:<18}{C_RESET} {C_DIM}{p.description}{C_RESET}")

        print(f"\n  {C_CYAN}Add-ons{C_RESET}")
        for j, p in enumerate(addons):
            i = len(bases) + j
            marker = "[x]" if p.name in selected_addons else "[ ]"
            arrow = "> " if i == cursor else "  "
            color = C_GREEN if p.name in selected_addons else ""
            print(f"  {arrow}{color}{marker} +{p.name:<17}{C_RESET} {C_DIM}{p.description}{C_RESET}")

        selected = list(selected_base) + list(selected_addons)
        if selected:
            print(f"\n  {C_BOLD}Selected:{C_RESET} {C_GREEN}{' + '.join(selected)}{C_RESET}")
        else:
            print(f"\n  {C_DIM}Nothing selected yet{C_RESET}")

    def toggle() -> None:
        if cursor < len(bases):
            name = bases[cursor].name
            if name in selected_base:
                selected_base.discard(name)
            else:
                selected_base.add(name)
        else:
            name = addons[cursor - len(bases)].name
            if name in selected_addons:
                selected_addons.discard(name)
            else:
                selected_addons.add(name)

    try:
        return _interactive_loop(all_items, render, toggle, cursor, selected_base, selected_addons)
    except (ImportError, OSError):
        return _fallback_select(bases, addons)


def _interactive_loop(
    all_items: list,
    render,
    toggle,
    cursor: int,
    selected_base: set[str],
    selected_addons: set[str],
) -> list[str]:
    total = len(all_items)

    if sys.platform == "win32":
        import msvcrt

        while True:
            render()
            key = msvcrt.getch()
            if key == b'\xe0' or key == b'\x00':
                key2 = msvcrt.getch()
                if key2 == b'H':  # up
                    cursor = (cursor - 1) % total
                elif key2 == b'P':  # down
                    cursor = (cursor + 1) % total
            elif key == b' ':
                toggle()
            elif key == b'\r':
                result = list(selected_base) + list(selected_addons)
                if not result:
                    continue
                sys.stdout.write("\033[2J\033[H")
                return result
            elif key in (b'q', b'\x1b'):
                sys.stdout.write("\033[2J\033[H")
                print("Cancelled.")
                sys.exit(0)
            # update cursor for next render by reassigning via nonlocal-like trick
            render.__code__ = render.__code__  # no-op to keep linter happy
            # We need to pass cursor back — use mutable container
            _interactive_loop.cursor = cursor
            # Actually, let's restructure to avoid this issue
        # unreachable
    else:
        import tty
        import termios

        fd = sys.stdin.fileno()
        old = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            while True:
                render()
                ch = sys.stdin.read(1)
                if ch == '\x1b':
                    seq = sys.stdin.read(2)
                    if seq == '[A':  # up
                        cursor = (cursor - 1) % total
                    elif seq == '[B':  # down
                        cursor = (cursor + 1) % total
                elif ch == ' ':
                    toggle()
                elif ch == '\r':
                    result = list(selected_base) + list(selected_addons)
                    if not result:
                        continue
                    return result
                elif ch in ('q', '\x03'):
                    print("\033[2J\033[H")
                    print("Cancelled.")
                    sys.exit(0)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old)
            sys.stdout.write("\033[2J\033[H")

    return list(selected_base) + list(selected_addons)


# Fix Windows interactive loop — rewrite to avoid cursor scoping issue
def _interactive_select(profiles: list[Profile]) -> list[str]:
    bases = [p for p in profiles if p.profile_type == "base"]
    addons = [p for p in profiles if p.profile_type == "addon"]
    all_items = bases + addons
    total = len(all_items)
    cursor = 0
    selected_base: set[str] = set()
    selected_addons: set[str] = set()

    def render() -> None:
        sys.stdout.write("\033[2J\033[H")
        print(f"{C_BOLD}Claude Code Arcane — Profile Selector{C_RESET}\n")
        print(f"  {C_DIM}↑/↓ move  •  SPACE toggle  •  ENTER confirm  •  q quit{C_RESET}\n")
        print(f"  {C_CYAN}Base profiles{C_RESET}")
        for i, p in enumerate(bases):
            marker = "[x]" if p.name in selected_base else "[ ]"
            arrow = "> " if i == cursor else "  "
            color = C_GREEN if p.name in selected_base else ""
            print(f"  {arrow}{color}{marker} {p.name:<18}{C_RESET} {C_DIM}{p.description}{C_RESET}")
        print(f"\n  {C_CYAN}Add-ons{C_RESET}")
        for j, p in enumerate(addons):
            i = len(bases) + j
            marker = "[x]" if p.name in selected_addons else "[ ]"
            arrow = "> " if i == cursor else "  "
            color = C_GREEN if p.name in selected_addons else ""
            print(f"  {arrow}{color}{marker} +{p.name:<17}{C_RESET} {C_DIM}{p.description}{C_RESET}")
        selected = list(selected_base) + list(selected_addons)
        if selected:
            print(f"\n  {C_BOLD}Selected:{C_RESET} {C_GREEN}{' + '.join(selected)}{C_RESET}")
        else:
            print(f"\n  {C_DIM}Nothing selected yet{C_RESET}")

    def toggle() -> None:
        if cursor < len(bases):
            name = bases[cursor].name
            selected_base.symmetric_difference_update({name})
        else:
            name = addons[cursor - len(bases)].name
            selected_addons.symmetric_difference_update({name})

    try:
        if sys.platform == "win32":
            import msvcrt
            while True:
                render()
                key = msvcrt.getch()
                if key in (b'\xe0', b'\x00'):
                    key2 = msvcrt.getch()
                    if key2 == b'H':
                        cursor = (cursor - 1) % total
                    elif key2 == b'P':
                        cursor = (cursor + 1) % total
                elif key == b' ':
                    toggle()
                elif key == b'\r':
                    result = list(selected_base) + list(selected_addons)
                    if result:
                        sys.stdout.write("\033[2J\033[H")
                        return result
                elif key in (b'q', b'\x1b'):
                    sys.stdout.write("\033[2J\033[H")
                    print("Cancelled.")
                    sys.exit(0)
        else:
            import tty
            import termios
            fd = sys.stdin.fileno()
            old = termios.tcgetattr(fd)
            try:
                tty.setraw(fd)
                while True:
                    render()
                    ch = sys.stdin.read(1)
                    if ch == '\x1b':
                        seq = sys.stdin.read(2)
                        if seq == '[A':
                            cursor = (cursor - 1) % total
                        elif seq == '[B':
                            cursor = (cursor + 1) % total
                    elif ch == ' ':
                        toggle()
                    elif ch == '\r':
                        result = list(selected_base) + list(selected_addons)
                        if result:
                            return result
                    elif ch in ('q', '\x03'):
                        print("\033[2J\033[H")
                        print("Cancelled.")
                        sys.exit(0)
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old)
                sys.stdout.write("\033[2J\033[H")
    except (ImportError, OSError):
        return _fallback_select(bases, addons)

    return []


def _fallback_select(bases: list[Profile], addons: list[Profile]) -> list[str]:
    """Simple numbered fallback for non-TTY environments."""
    print(f"\n{C_BOLD}Base profiles:{C_RESET}")
    for i, p in enumerate(bases, 1):
        print(f"  {i}. {p.name:<18} {p.description}")
    print(f"\n{C_BOLD}Add-ons:{C_RESET}")
    for j, p in enumerate(addons, len(bases) + 1):
        print(f"  {j}. +{p.name:<17} {p.description}")

    print(f"\n{C_BOLD}Enter numbers separated by spaces (e.g. 1 3 8):{C_RESET}")
    try:
        line = input("> ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\nCancelled.")
        sys.exit(0)

    all_items = bases + addons
    selected = []
    for token in line.split():
        try:
            idx = int(token) - 1
            if 0 <= idx < len(all_items):
                selected.append(all_items[idx].name)
        except ValueError:
            pass

    if not selected:
        print("Nothing selected.")
        sys.exit(1)
    return selected


# ── Commands ──


def cmd_install(args: argparse.Namespace) -> None:
    target = Path.cwd() if args.target is None else Path(args.target).resolve()
    profiles_dir = _profiles_dir()

    if args.profile:
        profile_names = args.profile.split("+")
    else:
        all_profiles = list_profiles(profiles_dir)
        if not all_profiles:
            print(f"{C_RED}No profiles found in {profiles_dir}{C_RESET}")
            sys.exit(1)
        profile_names = _interactive_select(all_profiles)

    print(f"\n{C_BOLD}Claude Code Arcane — Install{C_RESET}")
    print(f"Profiles: {C_CYAN}{' + '.join(profile_names)}{C_RESET}")
    print(f"Target:   {C_CYAN}{target}{C_RESET}")

    if not args.dry_run and not target.is_dir():
        print(f"\n{C_RED}Error: Target directory does not exist: {target}{C_RESET}")
        sys.exit(1)

    try:
        merged = merge_profiles(profiles_dir, profile_names)
    except FileNotFoundError as e:
        print(f"\n{C_RED}Error: {e}{C_RESET}")
        sys.exit(1)

    print(f"\n{C_BOLD}Summary:{C_RESET}")
    print(f"  Skills:      {C_GREEN}{merged.total_skills}{C_RESET}")
    print(f"  Rules:       {C_GREEN}{merged.total_rules}{C_RESET}")
    print(f"  Agents:      {C_GREEN}{len(merged.agents)} dirs{C_RESET}")
    print(f"  Permissions: {C_GREEN}{len(merged.permissions_allow)} allow / {len(merged.permissions_deny)} deny{C_RESET}")

    if args.dry_run:
        print(f"\n{C_YELLOW}Dry run — nothing was copied.{C_RESET}")
        installer = Installer(ARCANE_DIR, target, merged, dry_run=True)
        installer.run()
        return

    print(f"\n{C_BOLD}Installing to {target}/.claude/ ...{C_RESET}")
    installer = Installer(ARCANE_DIR, target, merged)
    installer.run()

    print(f"\n{C_GREEN}{C_BOLD}Done!{C_RESET} Installed {merged.total_skills} skills + {merged.total_rules} rules")
    print(f"Open Claude Code in {C_CYAN}{target}{C_RESET} and run {C_CYAN}/start{C_RESET} to begin.\n")


def cmd_list(args: argparse.Namespace) -> None:
    profiles = list_profiles(_profiles_dir())
    bases = [p for p in profiles if p.profile_type == "base"]
    addons = [p for p in profiles if p.profile_type == "addon"]

    print(f"\n{C_BOLD}Available profiles:{C_RESET}\n")
    print(f"  {C_CYAN}Base profiles{C_RESET}")
    for p in bases:
        print(f"    {C_GREEN}{p.name:<18}{C_RESET} {p.description}")
    print(f"\n  {C_CYAN}Add-ons{C_RESET}")
    for p in addons:
        print(f"    {C_GREEN}+{p.name:<17}{C_RESET} {p.description}")

    core = parse_profile(_profiles_dir() / "core.profile")
    print(f"\n  {C_CYAN}Core (always included){C_RESET}")
    print(f"    {C_GREEN}{'core':<18}{C_RESET} {core.description}")
    print()


def cmd_clean(args: argparse.Namespace) -> None:
    target = Path.cwd() if args.target is None else Path(args.target).resolve()
    print(f"\n{C_BOLD}Claude Code Arcane — Clean{C_RESET}")
    print(f"Target: {C_CYAN}{target}{C_RESET}\n")
    clean(target)
    print(f"\n{C_GREEN}{C_BOLD}Clean!{C_RESET} Arcane removed from {target}\n")


def cmd_status(args: argparse.Namespace) -> None:
    target = Path.cwd() if args.target is None else Path(args.target).resolve()
    manifest = target / ".claude" / "arcane-manifest.json"
    if not manifest.exists():
        print(f"\n{C_DIM}No Arcane installation found in {target}{C_RESET}\n")
        return

    import json
    data = json.loads(manifest.read_text(encoding="utf-8"))
    profiles = [p for p in data.get("profiles", []) if p != "core"]
    print(f"\n{C_BOLD}Arcane Status{C_RESET}")
    print(f"  Profiles:  {C_GREEN}{' + '.join(profiles)}{C_RESET}")
    print(f"  Skills:    {C_GREEN}{data.get('total_skills', '?')}{C_RESET}")
    print(f"  Rules:     {C_GREEN}{data.get('total_rules', '?')}{C_RESET}")
    print(f"  Installed: {C_CYAN}{data.get('installed_at', '?')}{C_RESET}")
    print(f"  Source:    {C_DIM}{data.get('source', '?')}{C_RESET}\n")


# ── Main ──


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="arcane",
        description="Claude Code Arcane — Deploy skills, rules, hooks and agents to any project",
    )
    parser.add_argument("-V", "--version", action="version", version=f"arcane {__version__}")
    sub = parser.add_subparsers(dest="command")

    p_install = sub.add_parser("install", aliases=["i"], help="Install profiles into a project")
    p_install.add_argument("profile", nargs="?", help="Profiles joined with + (e.g. unity-dev+agile)")
    p_install.add_argument("-t", "--target", help="Target project directory (default: current dir)")
    p_install.add_argument("--dry-run", action="store_true", help="Show what would be installed")

    p_list = sub.add_parser("list", aliases=["ls"], help="List available profiles")

    p_clean = sub.add_parser("clean", help="Remove Arcane from a project")
    p_clean.add_argument("-t", "--target", help="Target project directory (default: current dir)")

    p_status = sub.add_parser("status", aliases=["st"], help="Show Arcane installation status")
    p_status.add_argument("-t", "--target", help="Target project directory (default: current dir)")

    args = parser.parse_args()

    if args.command in ("install", "i"):
        cmd_install(args)
    elif args.command in ("list", "ls"):
        cmd_list(args)
    elif args.command == "clean":
        cmd_clean(args)
    elif args.command in ("status", "st"):
        cmd_status(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
