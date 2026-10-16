#!/usr/bin/env python3
"""PreToolUse guard for Bash and file-writing tools.

Reads the hook payload on stdin and answers with a permission decision:
  deny - actions the user runs by hand if they really want them (force push,
         bypassing git hooks, sudo, writing .env files ...)
  ask  - destructive or supply-chain-sensitive actions (rm -rf outside build
         output, dropping data, a new dependency, editing CI or lint configs ...)
  none - everything else; the normal permission rules decide.

The command is parsed quote-aware and split on && || ; | so a chained or
quoted command cannot hide a match the old grep-based hooks missed. This is a
guard against mistakes, not a sandbox: a script or an interpreter one-liner
can still do anything.

It replaces validate-push.sh and validate-secrets.sh, whose substring checks
also fired on text inside arguments. `guard.py --command` only prints the Bash
command from the payload; validate-commit.sh uses it instead of a regex.
"""
from __future__ import annotations

import json
import os
import re
import shlex
import sys
from fnmatch import fnmatch

DENY, ASK, NONE = "deny", "ask", None
RANK = {DENY: 2, ASK: 1, NONE: 0}

# Build output that a command regenerates; rm -rf on these alone never asks.
REGENERABLE = {
    "node_modules", "dist", "build", ".next", "out", "coverage",
    "__pycache__", ".pytest_cache", "Library", "Temp", "obj",
    "Binaries", "Intermediate", "DerivedDataCache",
}

SEPARATORS = {"&&", "||", ";", "|", "&", "(", ")", "|&", ";;"}
WRAPPERS = {"command", "exec", "time", "nohup", "env", "builtin", "nice"}
DB_CLIENTS = {
    "psql", "mysql", "mariadb", "sqlite3", "sqlcmd", "mongo", "mongosh",
    "redis-cli", "cockroach", "clickhouse-client", "duckdb",
}
DATA_LOSS_SQL = [
    (r"\bDROP\s+(TABLE|DATABASE|SCHEMA)\b", "drops a table, database or schema"),
    (r"\bTRUNCATE\b", "truncates a table"),
    (r"\bFLUSH(ALL|DB)\b", "flushes Redis"),
    (r"\.dropDatabase\s*\(", "drops a MongoDB database"),
]
# (programs that run it, pattern over the segment, reason). Scoped to the program so
# a commit message that merely mentions "terraform destroy" does not match.
TEXT_RULES = [
    ({"prisma"}, r"\bmigrate\s+reset\b", "resets the database (prisma migrate reset)"),
    ({"supabase"}, r"\bdb\s+reset\b", "resets the database (supabase db reset)"),
    ({"dotnet"}, r"\bef\s+database\s+drop\b", "drops the database (dotnet ef database drop)"),
    ({"php", "rails", "rake", "bundle", "knex", "sequelize", "sequelize-cli"},
     r"\b(migrate|db):(rollback|reset|fresh|undo|drop)\b|\bdb:migrate:undo\b", "rolls back or drops the database"),
    ({"alembic"}, r"\bdowngrade\b", "rolls back migrations (alembic downgrade)"),
    ({"goose", "migrate"}, r"\sdown\b", "rolls back migrations"),
    ({"docker"}, r"\bsystem\s+prune\b", "deletes Docker data (system prune)"),
    ({"docker"}, r"\bvolume\s+(rm|prune)\b", "deletes Docker volumes"),
    ({"docker", "docker-compose"}, r"\bdown\b.*\s(-v|--volumes)\b", "deletes the compose volumes (database data)"),
    ({"terraform", "tofu", "pulumi"}, r"\bdestroy\b", "destroys infrastructure"),
    ({"kubectl"}, r"\bdelete\b", "deletes Kubernetes resources"),
    ({"helm"}, r"\b(uninstall|delete)\b", "uninstalls a Helm release"),
    ({"npm", "pnpm", "yarn"}, r"^\S+\s+(publish|unpublish)\b", "publishes or unpublishes a package"),
]
# Launchers whose first argument is the real program (npx prisma ..., pnpm exec knex ...).
LAUNCHERS = {"npx", "pnpx", "bunx", "pnpm", "yarn", "npm", "bun", "uv", "uvx", "poetry"}

ENV_FILE = re.compile(r"^\.env(\..+)?$")
READERS = {"cat", "type", "less", "more", "head", "tail", "bat", "nl", "strings", "grep", "rg"}
ENV_SAFE_SUFFIXES = (".example", ".sample", ".template", ".dist")

# Write/Edit targets, matched against the path relative to the project root.
ASK_ALWAYS = [
    (".github/workflows/*", "edits a CI workflow, which runs with the repo's secrets"),
    ("infra/*", "edits infrastructure code"),
    ("terraform/*", "edits infrastructure code"),
    ("*.tf", "edits infrastructure code"),
    ("*.tfvars", "edits infrastructure variables"),
]
ASK_IF_EXISTS = [
    ("migrations/*", "edits an existing migration; shipped migrations are immutable"),
    ("*/migrations/*", "edits an existing migration; shipped migrations are immutable"),
    ("alembic/versions/*", "edits an existing migration; shipped migrations are immutable"),
    ("db/migrate/*", "edits an existing migration; shipped migrations are immutable"),
]
MANIFESTS = {
    "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb",
    "requirements.txt", "pyproject.toml", "poetry.lock", "uv.lock", "Pipfile", "Pipfile.lock",
    "go.mod", "go.sum", "Cargo.toml", "Cargo.lock", "Gemfile", "Gemfile.lock",
    "composer.json", "composer.lock", "packages.lock.json",
}
MANIFEST_GLOBS = ["requirements*.txt", "*.csproj", "Directory.Packages.props", "Packages/manifest.json"]
CHECK_CONFIGS = [
    ".eslintrc*", "eslint.config.*", ".prettierrc*", "prettier.config.*", "tsconfig*.json",
    "biome.json", "biome.jsonc", ".golangci.y*ml", ".golangci.toml", "ruff.toml", ".ruff.toml",
    ".flake8", ".stylelintrc*", "stylelint.config.*", ".editorconfig",
]


# --- command parsing -------------------------------------------------------

def strip_heredoc_bodies(command: str) -> str:
    """Drop heredoc bodies: their text is data (a commit message), not commands."""
    return re.sub(
        r"<<-?\s*(['\"]?)(\w+)\1([^\n]*)\n.*?\n\s*\2\s*(?=\n|$|\))",
        r"<<\2\3",
        command,
        flags=re.S,
    )


def newlines_to_separators(command: str) -> str:
    out, quote = [], None
    for ch in command:
        if quote:
            if ch == quote:
                quote = None
        elif ch in "'\"":
            quote = ch
        elif ch == "\n":
            ch = ";"
        out.append(ch)
    return "".join(out)


def tokenize(command: str) -> list[str]:
    try:
        lexer = shlex.shlex(command, posix=True, punctuation_chars=True)
        lexer.whitespace_split = True
        return list(lexer)
    except ValueError:  # unbalanced quotes: fall back to a plain split
        return re.findall(r"&&|\|\||[;|&()]|[^\s;|&()]+", command)


def segments(command: str) -> list[list[str]]:
    command = newlines_to_separators(strip_heredoc_bodies(command))
    result, current = [], []
    for token in tokenize(command):
        if token in SEPARATORS:
            if current:
                result.append(current)
            current = []
        else:
            current.append(token)
    if current:
        result.append(current)
    return result


def nested_commands(tokens: list[str]) -> list[str]:
    """Command strings run by this segment: bash -c "...", eval "...", $(...)."""
    found = []
    for i, token in enumerate(tokens):
        if os.path.basename(token) in ("bash", "sh", "zsh") and i + 2 < len(tokens) and tokens[i + 1] == "-c":
            found.append(tokens[i + 2])
        if token == "eval" and i + 1 < len(tokens):
            found.append(" ".join(tokens[i + 1:]))
        found.extend(re.findall(r"\$\(([^()]*)\)", token))
        found.extend(re.findall(r"`([^`]*)`", token))
    return found


def program(tokens: list[str]) -> tuple[str, list[str]]:
    """Strip env assignments and wrappers; return (basename, args)."""
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", token) or os.path.basename(token) in WRAPPERS:
            i += 1
            continue
        break
    if i >= len(tokens):
        return "", []
    name = os.path.basename(tokens[i]).lower()
    if name.endswith(".exe"):
        name = name[:-4]
    return name, tokens[i + 1:]


def effective_program(name: str, args: list[str]) -> str:
    """`npx prisma migrate reset` runs prisma; `php artisan migrate:fresh` runs php."""
    if name not in LAUNCHERS:
        return name
    rest = [a for a in args if not a.startswith("-")]
    if rest[:1] and rest[0] in ("exec", "dlx", "run", "x"):
        rest = rest[1:]
    return os.path.basename(rest[0]).lower() if rest else name


def short_flags(args: list[str]) -> set[str]:
    letters = set()
    for arg in args:
        if arg.startswith("-") and not arg.startswith("--") and len(arg) > 1:
            letters.update(arg[1:])
    return letters


def positional(args: list[str], takes_value: set[str] = frozenset()) -> list[str]:
    out, skip = [], False
    for arg in args:
        if skip:
            skip = False
            continue
        if arg in takes_value:
            skip = True
            continue
        if not arg.startswith("-"):
            out.append(arg)
    return out


# --- rules -----------------------------------------------------------------

def check_git(args: list[str]) -> tuple[str | None, str]:
    i = 0
    while i < len(args) and args[i].startswith("-"):
        if args[i] == "-c" and i + 1 < len(args):
            if args[i + 1].lower().startswith("core.hookspath"):
                return DENY, "git -c core.hooksPath= bypasses the repository's git hooks"
            i += 2
        elif args[i] in ("-C", "--git-dir", "--work-tree") and i + 1 < len(args):
            i += 2
        else:
            i += 1
    if i >= len(args):
        return NONE, ""
    sub, rest = args[i], args[i + 1:]
    flags = short_flags(rest)

    if "--no-verify" in rest and sub in ("commit", "push", "merge", "rebase", "cherry-pick", "am"):
        return DENY, "--no-verify skips the git hooks; fix what they report instead"
    if sub == "commit" and "n" in flags:
        return DENY, "git commit -n skips the git hooks; fix what they report instead"
    if sub == "push":
        forced = any(a == "--force" or a.startswith("--force-") for a in rest) or "f" in flags
        if forced or any(a.startswith("+") for a in rest):
            return DENY, ("Force push is blocked. If it is really needed, ask the user to run it "
                          "themselves: `! git push --force-with-lease`")
        if "--delete" in rest or "d" in flags or any(a.startswith(":") and len(a) > 1 for a in rest):
            return ASK, "deletes a remote branch or tag"
    if sub == "reset" and "--hard" in rest:
        return DENY, "git reset --hard throws away uncommitted work; the user runs it by hand"
    if sub == "clean" and ("f" in flags or "--force" in rest):
        return DENY, "git clean -f deletes untracked files; the user runs it by hand"
    whole_tree = any(a in (".", ":/", "*", ":/*") for a in rest)
    if sub == "checkout" and (whole_tree or "f" in flags or "--force" in rest):
        return ASK, "discards uncommitted changes (git checkout)"
    if sub == "restore" and whole_tree and not ("--staged" in rest and "--worktree" not in rest):
        return ASK, "discards uncommitted changes (git restore)"
    if sub == "stash" and rest[:1] and rest[0] in ("drop", "clear"):
        return ASK, "deletes stashed work"
    if sub == "branch" and ("D" in flags or ("--delete" in rest and "--force" in rest)):
        return ASK, "force-deletes a branch without checking it is merged"
    if sub == "tag" and ("d" in flags or "--delete" in rest):
        return ASK, "deletes a tag"
    if sub in ("filter-repo", "filter-branch"):
        return ASK, "rewrites the repository history"
    return NONE, ""


def check_rm(args: list[str]) -> tuple[str | None, str]:
    flags = short_flags(args)
    recursive = bool(flags & {"r", "R"}) or "--recursive" in args
    force = "f" in flags or "--force" in args
    if not (recursive and force):
        return NONE, ""
    targets = positional(args)
    safe = targets and all(
        not t.startswith(("/", "~")) and not re.match(r"^[A-Za-z]:", t)
        and ".." not in re.split(r"[/\\]", t) and "*" not in t
        and os.path.basename(t.rstrip("/\\")) in REGENERABLE
        for t in targets
    )
    if safe:
        return NONE, ""
    return ASK, f"recursively force-deletes {', '.join(targets) or 'files'}"


def check_new_dependency(name: str, args: list[str]) -> tuple[str | None, str]:
    packages: list[str] = []
    if name in ("npm", "pnpm", "yarn", "bun") and args:
        sub, rest = args[0], args[1:]
        if sub in ("add",) or (name in ("npm", "pnpm") and sub in ("install", "i", "in", "ins")):
            packages = positional(rest)
    elif name in ("pip", "pip3") and args[:1] == ["install"]:
        packages = pip_packages(args[1:])
    elif name in ("python", "python3", "py") and args[:3] == ["-m", "pip", "install"]:
        packages = pip_packages(args[3:])
    elif name == "uv" and args[:2] == ["pip", "install"]:
        packages = pip_packages(args[2:])
    elif name in ("uv", "poetry", "cargo") and args[:1] == ["add"]:
        packages = positional(args[1:])
    elif name == "go" and args[:1] == ["get"]:
        packages = [p for p in positional(args[1:]) if not p.startswith(".")]
    elif name == "dotnet" and args[:2] == ["add", "package"]:
        packages = positional(args[2:])
    if not packages:
        return NONE, ""
    return ASK, (f"adds a new dependency: {', '.join(packages)}. Check the exact name before "
                 "installing: a one-letter typo can install a malicious package")


def pip_packages(args: list[str]) -> list[str]:
    takes_value = {"-r", "--requirement", "-c", "--constraint", "-e", "--editable", "-i",
                   "--index-url", "--extra-index-url", "-t", "--target", "--prefix", "-f", "--find-links"}
    return [p for p in positional(args, takes_value)
            if not (p.startswith((".", "/")) or p.endswith((".whl", ".tar.gz", ".zip")))]


def writes_env_file(tokens: list[str]) -> bool:
    targets = []
    for i, token in enumerate(tokens):
        if token in (">", ">>") and i + 1 < len(tokens):
            targets.append(tokens[i + 1])
    name, args = program(tokens)
    if name == "tee":
        targets.extend(positional(args))
    return any(is_env_file(t) for t in targets)


def is_env_file(path: str) -> bool:
    base = os.path.basename(path.replace("\\", "/"))
    return bool(ENV_FILE.match(base)) and not base.endswith(ENV_SAFE_SUFFIXES)


def check_segment(tokens: list[str], depth: int = 0) -> tuple[str | None, str]:
    name, args = program(tokens)
    text = " ".join(tokens)
    decisions = []

    if name == "sudo":
        decisions.append((DENY, "sudo is blocked; the user runs privileged commands by hand"))
    if name == "chmod" and any(a in ("777", "0777") for a in args):
        decisions.append((DENY, "chmod 777 makes files writable by everyone"))
    if writes_env_file(tokens):
        decisions.append((DENY, "writing a .env file is blocked; the user edits secrets by hand"))
    if name in READERS and any(is_env_file(a) for a in positional(args)):
        decisions.append((DENY, "reading a .env file would put its secrets in the conversation"))
    if name == "git":
        decisions.append(check_git(args))
    if name == "rm":
        decisions.append(check_rm(args))
    if name == "gh":
        if args[:2] in (["repo", "delete"], ["release", "delete"], ["secret", "delete"], ["secret", "remove"]):
            decisions.append((ASK, f"gh {' '.join(args[:2])} deletes data on GitHub"))
        if args[:1] == ["api"] and re.search(r"(-X|--method)[ =]?\s*DELETE\b", text, re.I):
            decisions.append((ASK, "gh api DELETE request"))
    decisions.append(check_new_dependency(name, args))
    if DB_CLIENTS & {os.path.basename(t).lower() for t in tokens}:
        for pattern, reason in DATA_LOSS_SQL:
            if re.search(pattern, text, re.I):
                decisions.append((ASK, reason))
        if re.search(r"\bDELETE\s+FROM\b", text, re.I) and not re.search(r"\bWHERE\b", text, re.I):
            decisions.append((ASK, "DELETE without WHERE removes every row"))
    runs = {name, effective_program(name, args)}
    for programs, pattern, reason in TEXT_RULES:
        if runs & programs and re.search(pattern, text, re.I):
            decisions.append((ASK, reason))
    if depth < 3:
        for inner in nested_commands(tokens):
            decisions.append(check_command(inner, depth + 1))
    return worst(decisions)


def check_command(command: str, depth: int = 0) -> tuple[str | None, str]:
    return worst([check_segment(seg, depth) for seg in segments(command)])


def worst(decisions: list[tuple[str | None, str]]) -> tuple[str | None, str]:
    best = (NONE, "")
    for decision in decisions:
        if RANK[decision[0]] > RANK[best[0]]:
            best = decision
    return best


def check_file(path: str, root: str) -> tuple[str | None, str]:
    if not path:
        return NONE, ""
    absolute = os.path.abspath(os.path.join(root, path))
    rel = os.path.relpath(absolute, root).replace("\\", "/")
    if rel.startswith("../"):
        return NONE, ""
    rel = re.sub(r"^\.claude/worktrees/[^/]+/", "", rel)
    base = os.path.basename(rel)

    if is_env_file(base):
        return DENY, "writing a .env file is blocked; the user edits secrets by hand"
    for pattern, reason in ASK_ALWAYS:
        if fnmatch(rel, pattern):
            return ASK, reason
    if not os.path.exists(absolute):
        return NONE, ""
    for pattern, reason in ASK_IF_EXISTS:
        if fnmatch(rel, pattern):
            return ASK, reason
    if base in MANIFESTS or any(fnmatch(rel, g) or fnmatch(base, g) for g in MANIFEST_GLOBS):
        return ASK, "edits a dependency manifest or lockfile"
    if any(fnmatch(base, g) for g in CHECK_CONFIGS):
        return ASK, "edits a lint, format or type-check config; fix the code instead of loosening the check"
    return NONE, ""


# --- entry point -----------------------------------------------------------

def decide(payload: dict) -> tuple[str | None, str]:
    tool = payload.get("tool_name", "")
    tool_input = payload.get("tool_input") or {}
    if tool == "Bash":
        return check_command(tool_input.get("command", ""))
    if tool in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
        root = os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or os.getcwd()
        return check_file(tool_input.get("file_path") or tool_input.get("notebook_path", ""), root)
    return NONE, ""


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except ValueError:
        return 0
    if "--command" in sys.argv[1:]:
        print((payload.get("tool_input") or {}).get("command", ""))
        return 0
    decision, reason = decide(payload)
    if decision:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": decision,
                "permissionDecisionReason": f"Arcane guard: {reason}.",
            }
        }))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:  # a guard bug must never break the user's tool call
        sys.exit(0)
