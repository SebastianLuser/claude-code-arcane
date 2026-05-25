# worktree-isolation-setup

One-time setup that makes a repo natively friendly to the worktree-isolation runtime, and ensures the SessionStart hook + scripts are installed on the user's machine.

This README explains **what setup does and why**. For step-by-step instructions, see [SKILL.md](SKILL.md).

---

## Install

```bash
npx skills add https://github.com/educabot/team-ai-skills --skill worktree-isolation-setup
```

> The host repo is private — `npx skills add` clones via Git, so the machine needs GitHub credentials with read access (e.g. `gh auth login` or an SSH key on the account).

After install, run the skill once per repo:

```
setup worktree isolation in this project
```

---

## What this skill does

Two distinct things:

### 1. Machine-level — install the SessionStart hook

Idempotent. Run once per machine.

- Copies `apply.py` + `lib.py` into `~/.claude/scripts/worktree-isolation/`
- Adds a `SessionStart` hook to `~/.claude/settings.json` that invokes `apply.py --quiet` on every Claude Code session start

After this, every time you open a worktree under Claude Code, the script auto-generates `.env.worktree` + `*.worktree.yml` overrides for that worktree without any further intervention.

### 2. Repo-level — parameterize compose + docs

For each `docker-compose*.yml` / `compose*.yml` in the repo root:

- **Hardcoded ports** like `"5432:5432"` → rewritten as `"${DB_5432_HOST_PORT-5432}:5432"`
- **Hardcoded `container_name:`** like `my-app-db` → rewritten as `my-app-db${WORKTREE_SUFFIX-}`

For `CLAUDE.md`:

- Test commands referencing `localhost:5432` → rewritten as `localhost:${DB_5432_HOST_PORT-5432}`
- A "Worktree isolation" section appended explaining how to use the env vars

For `.gitignore`:

- `.env.worktree`, `*.worktree.yml`, `*.worktree.yaml` added (only if missing)

### Single-checkout users see no behavior change

`WORKTREE_SUFFIX` defaults to empty, `DB_5432_HOST_PORT` defaults to `5432`. The compose file behaves identically for users who never source `.env.worktree`.

Multi-worktree users source `.env.worktree` (auto-populated by the hook), and the same compose file Just Works in parallel.

---

## Why both override files **and** env-var substitution?

Both mechanisms accomplish the same goal — different host ports per worktree — but they fail in different ways. The runtime script generates **override files** by default. Setup adds **env-var substitution** as a second mechanism. Belt-and-suspenders.

| Mechanism | Strength | Failure mode |
|---|---|---|
| **Override file** (`*.worktree.yml`) | Works on raw, unmodified repos. No assumptions about compose file content. | Requires `COMPOSE_FILE` chaining. Misses if user runs `docker compose -f docker-compose.yml up` explicitly. |
| **Env-var substitution** (`${VAR-default}`) | Works regardless of `COMPOSE_FILE`. Robust to explicit `-f` flags. | Requires the repo to have been prepared (this skill). |

After setup, both work in parallel.

---

## Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│  One-time per repo (humans):                                        │
│                                                                     │
│    user → "setup worktree isolation in this project"                │
│      → this skill runs                                              │
│        ├─ install_hook.py        (one-time per machine; idempotent) │
│        ├─ rewrites compose files (port + container_name params)     │
│        ├─ updates .gitignore                                        │
│        └─ amends CLAUDE.md                                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Every Claude Code session start (automatic, after setup):          │
│                                                                     │
│    SessionStart hook → apply.py --quiet                             │
│      ├─ generates *.worktree.yml override                           │
│      └─ writes .env.worktree                                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Every time the user brings the stack up (manual):                  │
│                                                                     │
│    set -a; source .env.worktree; set +a                             │
│    docker compose up -d                                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  On-demand, when needed (manual):                                   │
│                                                                     │
│    user → "regenerate worktree ports" / "show worktree ports"       │
│      → companion skill `worktree-isolation` runs                    │
└─────────────────────────────────────────────────────────────────────┘
```

For deep-dive details on how the runtime script works (port allocation, override generation, compose chaining), see the companion [`worktree-isolation`](../worktree-isolation/) skill's README.

---

## What this skill doesn't do

- Doesn't run `docker compose up`. Verification stops at `docker compose config`.
- Doesn't modify application code or test fixtures. If `tests/` hardcodes a port, that's a separate refactor (out of scope).
- Doesn't handle non-Docker dev servers.
- Doesn't try to be "smart" about which ports are safe to expose — compose port intent is taken at face value from `ports:`.

---

## File reference

```
skills/worktree-isolation-setup/
├── SKILL.md             # entry point — step-by-step setup procedure
├── README.md            # this file
└── scripts/
    ├── install_hook.py  # idempotent installer for the hook + scripts
    ├── apply.py         # copied into ~/.claude/scripts/ by install_hook.py
    └── lib.py           # ditto
```

`apply.py` and `lib.py` are duplicated from the [`worktree-isolation`](../worktree-isolation/) skill so this skill is self-contained. The runtime skill bundles its own copies for direct invocation.
