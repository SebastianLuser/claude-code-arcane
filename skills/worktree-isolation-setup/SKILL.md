---
name: worktree-isolation-setup
description: One-time per-repo setup that makes a project natively friendly to the worktree-isolation runtime. Refactors docker-compose port mappings + container_name to use ${VAR-default} substitutions, updates .gitignore, amends CLAUDE.md test commands, and ensures the global SessionStart hook + scripts are installed on the user's machine. Run once per repo. Trigger phrases include "setup worktree isolation in this project", "prepare repo for worktree isolation", "make this repo isolation-aware", "preparar repo para worktrees paralelos". DO NOT use mid-session for routine port regeneration — that is the `worktree-isolation` skill.
---

# Worktree Isolation — Setup (one-time)

This is the **opt-in, project-level** prep that complements the `worktree-isolation` runtime skill. Run it once per repo to make compose files + project docs natively cooperative with the per-worktree port allocator, and to ensure the SessionStart hook is installed on the current machine.

After this runs:
- `docker-compose*.yml` ports + `container_name` are parameterized with `${VAR-default}`
- `CLAUDE.md` test commands reference the same env vars
- `.gitignore` excludes the runtime-generated `.env.worktree` + `*.worktree.yml`
- `~/.claude/scripts/worktree-isolation/` has `apply.py` + `lib.py` copied
- `~/.claude/settings.json` has a `SessionStart` hook that runs `apply.py --quiet` on every session start

For an in-depth explanation of how isolation works (hook lifecycle, override generation, port allocation, compose chaining), see [README.md](README.md).

---

## Step 1 — Ensure the global hook is installed

Run the bundled installer. It is idempotent — safe to re-run.

```bash
python3 scripts/install_hook.py
```

What it does:
1. Copies `scripts/apply.py` + `scripts/lib.py` into `~/.claude/scripts/worktree-isolation/`
2. Adds (or confirms) a `SessionStart` hook in `~/.claude/settings.json` that invokes `~/.claude/scripts/worktree-isolation/apply.py --quiet`

If the hook is already present, it reports "already present" and exits 0.

---

## Step 2 — Inventory the repo

Read every `docker-compose*.yml` / `compose*.yml` in the repo root. For each service, identify:

- **Hardcoded ports**: e.g. `"54399:5432"` → propose `"${POSTGRES_INTEGRATION_5432_HOST_PORT-54399}:5432"`
- **Hardcoded `container_name:`**: e.g. `container_name: rr-processing-pg` → propose `container_name: rr-processing-pg${WORKTREE_SUFFIX-}`
- **Already-substituted ports** (e.g. `"${TEST_DB_PORT-5433}:5432"`) → leave alone, just note them

Env var naming convention (must match the runtime hook's `env_var_name()`):

```
<SERVICE_UPPERSNAKE>_<CONTAINER_PORT>_HOST_PORT
```

Examples:
- service `postgres-integration` + container port `5432` → `POSTGRES_INTEGRATION_5432_HOST_PORT`
- service `server` + container port `8000` → `SERVER_8000_HOST_PORT`
- service `db` + container port `5432` → `DB_5432_HOST_PORT`

Then read `CLAUDE.md` (if present) and find lines that hardcode legacy host ports (e.g. `localhost:54399`). Propose substitutions with the matching env var.

Also check `.gitignore`: identify whether `.env.worktree` and `*.worktree.yml` are already listed.

---

## Step 3 — Confirm with the user

Use `AskUserQuestion` (multiSelect: true) listing the proposed changes. Group by file. Example options:

- `docker-compose.processing.yml: parameterize ports + container_name (5 changes)`
- `docker-compose.integration.yml: parameterize ports + container_name (2 changes)`
- `CLAUDE.md: replace 6 hardcoded localhost:PORT references with $VAR`
- `CLAUDE.md: add "Worktree isolation" section`
- `.gitignore: add .env.worktree and *.worktree.yml`

Default: all selected. Show the actual diffs in your text response before invoking `AskUserQuestion` so the user can decide informed.

---

## Step 4 — Apply

Use the `Edit` tool with surgical replacements that preserve surrounding YAML/Markdown formatting (comments, blank lines, indentation). Do NOT use yaml round-tripping or full-file rewrites — those drop comments and reorder keys.

### Compose port transformation

Find:
```yaml
    ports:
      - "54399:5432"
```

Replace the port string only:
```yaml
    ports:
      - "${POSTGRES_INTEGRATION_5432_HOST_PORT-54399}:5432"
```

For port forms with explicit host IP (`"127.0.0.1:54399:5432"`), parameterize only the middle field. For multi-port entries (`["8080:80", "8443:443"]`), parameterize each independently.

### `container_name` transformation

```yaml
    container_name: rr-processing-pg
```
→
```yaml
    container_name: rr-processing-pg${WORKTREE_SUFFIX-}
```

Default empty preserves existing behavior (single-checkout stays unchanged). The runtime hook sets `WORKTREE_SUFFIX=-<worktree_id>` in `.env.worktree`.

### `CLAUDE.md` test-command transformation

Find:
```bash
DATABASE_URL=postgresql://rr_test:rr_test_pw@localhost:54399/rr_integration uv run pytest ...
```

Replace with:
```bash
DATABASE_URL=postgresql://rr_test:rr_test_pw@localhost:${POSTGRES_INTEGRATION_5432_HOST_PORT-54399}/rr_integration uv run pytest ...
```

If commands rely on `source .env.worktree`, surface that in a small preamble:
```bash
set -a; source .env.worktree 2>/dev/null; set +a
```

### `CLAUDE.md` "Worktree isolation" section

Append (or insert near the top of the testing/dev section):

````markdown
## Worktree isolation

This repo is wired to work with Claude Code's `worktree-isolation` runtime hook. Every worktree gets a deterministic set of host ports + a unique `COMPOSE_PROJECT_NAME` so multiple worktrees can run their stacks in parallel.

The runtime hook generates `.env.worktree` on session start. To bring up the stack:

```bash
set -a; source .env.worktree; set +a
docker compose up -d
```

Test commands above reference worktree-aware env vars (e.g. `${POSTGRES_INTEGRATION_5432_HOST_PORT-54399}`). Source `.env.worktree` once per shell and they Just Work.

If `.env.worktree` is missing, run the `worktree-isolation` skill (it regenerates the file).
````

### `.gitignore`

Append (only if missing):
```
# Worktree isolation (generated per-worktree)
.env.worktree
*.worktree.yml
*.worktree.yaml
```

---

## Step 5 — Verify

```bash
docker compose config --services 2>&1 | head
```

Should succeed. The output won't show env-substitution failures because defaults cover them.

Then re-run the runtime hook to confirm it picks up the new structure:
```bash
~/.claude/scripts/worktree-isolation/apply.py --cwd "$PWD" --verbose --force
```

Confirm:
- `.env.worktree` is generated
- The captured `var_name`s match the ones introduced (the hook detects `${VAR-default}` and exports `VAR` automatically)

---

## Edge cases

- **Service with `expose:` only (no `ports:`)** — nothing to do. Internal-only services don't need parameterization.
- **`docker-compose.override.yml` exists** — leave it alone. The runtime hook generates `*.worktree.yml` siblings, which are different files.
- **Compose file under `version: '3.x'`** — still works (Compose v2 reads it). The `version` line is obsolete but not harmful.
- **Repo has its own `.env.example`** — do NOT add the new vars there. Defaults live inline in compose substitutions; `.env.example` is for app-level secrets.
- **`CLAUDE.md` mentions ports in prose** ("the integration DB listens on port 54399") — leave prose unchanged. Only rewrite executable command examples.
- **`tests/` hardcodes a port** — out of scope. Surface it to the user as a follow-up.

---

## Out of scope

- Does not run `docker compose up`. Verification stops at `docker compose config`.
- Does not modify application code or test fixtures.
- Does not try to be "smart" about which ports are safe to expose — compose port intent is taken at face value from `ports:`.
