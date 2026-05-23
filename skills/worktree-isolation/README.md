# worktree-isolation

On-demand worktree isolation for the current directory. Regenerates per-worktree compose overrides + `.env.worktree`, or just prints the current allocation. Companion to [`worktree-isolation-setup`](../worktree-isolation-setup/), which is the one-time per-repo setup that wires everything to run automatically.

This README explains **how worktree isolation works under the hood**. For usage, see [SKILL.md](SKILL.md).

---

## Install

```bash
npx skills add https://github.com/educabot/team-ai-skills --skill worktree-isolation
```

> The host repo is private — `npx skills add` clones via Git, so the machine needs GitHub credentials with read access (e.g. `gh auth login` or an SSH key on the account).

After install, invoke with phrases like:

- `isolate worktree`
- `regenerate worktree ports`
- `which ports is this worktree using?`

If you also want a SessionStart hook that runs this automatically on every Claude Code session start, install the companion skill:

```bash
npx skills add https://github.com/educabot/team-ai-skills --skill worktree-isolation-setup
```

---

## The problem

You're working on a repo whose `docker-compose.yml` looks like:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: my-app-db
    ports:
      - "5432:5432"
```

You want to open a second worktree of the same repo (different branch, different feature) and run its stack in parallel. As soon as you `docker compose up -d` in worktree #2:

- **Port collision**: both worktrees try to bind host port `5432`.
- **Container name collision**: both try to create a container named `my-app-db`.
- **Project name collision**: Compose derives `COMPOSE_PROJECT_NAME` from the directory name; if both worktrees live under directories called `repo`, they share a project name and start sharing volumes.

You either (a) tear down worktree #1, (b) hand-edit ports for #2, or (c) live with conflicts. None of those scale.

## The solution

A small Python script that, run inside any worktree, generates per-worktree compose overrides and a `.env.worktree` env file with non-colliding ports and a unique project name. Same worktree path → identical output forever.

This skill exposes the script. The companion [`worktree-isolation-setup`](../worktree-isolation-setup/) skill installs it as a `SessionStart` hook so it runs automatically on every Claude Code session start.

---

## How it works

### 1. Computes a stable `worktree_id`

```
worktree_id = sha1(absolute_path_to_cwd)[:8]
```

Same worktree path → identical id forever. The id never changes unless you rename the directory.

### 2. Locates compose files

Globs `docker-compose*.yml` and `compose*.yml` in the cwd, **excluding** previously-generated `*.worktree.yml` overrides.

If no compose files match, the script is a no-op.

### 3. Generates per-compose-file overrides

For every base compose file (e.g. `docker-compose.yml`), it writes a sibling `docker-compose.worktree.yml` containing:

```yaml
name: my-repo-3f785ada              # COMPOSE_PROJECT_NAME for this stack

services:
  db:
    ports: !override                # Compose v2 syntax — replaces the list, doesn't merge
      - "26680:5432"
    container_name: my-app-db-3f785ada
  server:
    ports: !override
      - "25154:8000"
    container_name: my-app-server-3f785ada
```

Host ports are picked deterministically from a hash of `<worktree_id>:<service>:<container_port>` mapped into the 20000–29999 range. Same triple → same port across runs.

The `!override` tag is critical — without it, Compose **merges** the list (appending the override's ports), causing the original `5432:5432` mapping to coexist with `26680:5432`, which still collides.

### 4. Writes `.env.worktree`

A shell-sourceable env file at the worktree root:

```bash
COMPOSE_PROJECT_NAME=my-repo-3f785ada
COMPOSE_FILE=docker-compose.yml:docker-compose.worktree.yml
WORKTREE_ID=3f785ada
WORKTREE_SUFFIX=-3f785ada

DB_5432_HOST_PORT=26680
SERVER_8000_HOST_PORT=25154
```

The `COMPOSE_FILE` chain means `docker compose up -d` (no `-f` flags) automatically loads the base file plus the override.

The per-port env vars exist for a reason: if the project ran [`worktree-isolation-setup`](../worktree-isolation-setup/) and its compose files use `${DB_5432_HOST_PORT-5432}`, sourcing `.env.worktree` makes those substitutions resolve to the worktree's allocated port without any override file at all. The override file is still emitted as a belt-and-suspenders safety net.

### 5. Excludes generated files from git

Adds `.env.worktree` and `*.worktree.yml` to `.git/info/exclude` (per-checkout, never committed). [`worktree-isolation-setup`](../worktree-isolation-setup/) additionally adds them to `.gitignore` so they're excluded across all checkouts of the repo.

### 6. Idempotency

Same worktree path → identical output. Re-running is a no-op unless:
- A base compose file's mtime is newer than its override's
- `--force` is passed

---

## Why both override files **and** env-var substitution?

Both mechanisms accomplish the same goal — different host ports per worktree — but they fail in different ways. Belt-and-suspenders.

| Mechanism | Strength | Failure mode |
|---|---|---|
| **Override file** (`*.worktree.yml`) | Works on raw, unmodified repos. No assumptions about compose file content. | Requires `COMPOSE_FILE` chaining (env var must be sourced or passed). Misses if user runs `docker compose -f docker-compose.yml up` explicitly. |
| **Env-var substitution** (`${VAR-default}` in compose) | Works regardless of `COMPOSE_FILE`. Robust to explicit `-f` flags. | Requires the repo to have been prepared via [`worktree-isolation-setup`](../worktree-isolation-setup/) — won't work on raw compose files. |

Run `worktree-isolation-setup` and you get both. Use this skill alone and you only get the override file — which is enough for most workflows but breaks if a user invokes Compose with explicit `-f`.

---

## Compose file chaining

`COMPOSE_FILE` is a colon-separated list. Compose v2 reads each file in order and merges them, with later files overriding earlier ones:

```
COMPOSE_FILE=docker-compose.yml:docker-compose.worktree.yml
```

So:
1. `docker-compose.yml` defines the canonical service set.
2. `docker-compose.worktree.yml` overrides `name`, `ports`, `container_name`.

**Multi-compose projects** (e.g. `docker-compose.yml` + `docker-compose.processing.yml`) get one override per base file, all chained:

```
COMPOSE_FILE=docker-compose.yml:docker-compose.worktree.yml:docker-compose.processing.yml:docker-compose.processing.worktree.yml
```

---

## Port allocation strategy

Deterministic hash → 20000–29999 range:

```python
host_port = 20000 + (sha1(f"{worktree_id}:{service}:{container_port}").digest_int % 10000)
```

- **Range**: 20000–29999 chosen to avoid (a) the privileged range below 1024, (b) common dev ports below 10000, (c) the ephemeral range usually starting at 32768 on Linux/macOS.
- **Determinism**: same worktree path → same ports forever. You can copy-paste a curl command between sessions of the same worktree without it going stale.
- **Collisions**: with N worktrees and P ports per worktree, the probability of any two worktrees colliding on any port is ~`N²·P / 10000`. For 5 worktrees × 3 ports each, that's ~0.75% — acceptable. Surfaces as a `docker compose up` failure. Workaround: rename the worktree directory (changes the hash, regenerates ports).

---

## What this skill doesn't do

- Doesn't install the SessionStart hook globally — that's [`worktree-isolation-setup`](../worktree-isolation-setup/).
- Doesn't modify the repo's compose files / `CLAUDE.md` / `.gitignore` — also [`worktree-isolation-setup`](../worktree-isolation-setup/).
- Doesn't handle non-Docker dev servers (Next.js, uvicorn directly on host).
- Doesn't clean up orphan stacks from deleted worktrees — `docker compose ls` and `docker compose -p <project-name> down -v` manually.

---

## File reference

```
skills/worktree-isolation/
├── SKILL.md          # entry point — how to invoke
├── README.md         # this file
└── scripts/
    ├── apply.py      # the script itself
    └── lib.py        # compose parsing + port allocation + override generation
```
