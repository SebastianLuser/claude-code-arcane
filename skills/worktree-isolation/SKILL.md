---
name: worktree-isolation
description: "Regenerate or show this worktree's Docker ports (.env.worktree + compose overrides) so parallel worktrees don't collide. Leaves repo files alone; to prepare a repo once, use worktree-isolation-setup."
argument-hint: "[apply | status]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Worktree Isolation — On-Demand

Manually apply or inspect worktree isolation for the current directory. Use this skill any time you want to:

- **Regenerate** `.env.worktree` + `*.worktree.yml` overrides (e.g. after editing a base compose file)
- **Inspect** which host ports + `COMPOSE_PROJECT_NAME` are allocated to this worktree
- **Bootstrap** isolation when the SessionStart hook hasn't run (new clone, hook not installed)

If you want the SessionStart hook to do this automatically on every session start, **and** you want the repo's compose files + `CLAUDE.md` parameterized so commands "just work" without needing to source `.env.worktree`, run the [`worktree-isolation-setup`](../worktree-isolation-setup/) skill once per repo first.

The script is Node, not Python, because it also runs as a hook: Node is always there where Arcane is installed, and it needs no YAML library.

For an in-depth explanation of how isolation works (hook lifecycle, override generation, port allocation, compose chaining), see [README.md](README.md).

---

## Sub-commands

### `apply` (default — regenerate)

```bash
node scripts/apply.mjs --cwd "$PWD" --verbose --force
```

If the global hook+scripts are already installed at `~/.claude/scripts/worktree-isolation/`, prefer that path instead — it's the same code:

```bash
node ~/.claude/scripts/worktree-isolation/apply.mjs --cwd "$PWD" --verbose --force
```

After running, bring the stack up:
```bash
set -a; source .env.worktree; set +a
docker compose up -d
```

`COMPOSE_FILE` in `.env.worktree` chains base + override files automatically — no `-f` flags needed.

### `status` (inspect)

```bash
node scripts/apply.mjs --cwd "$PWD" --status
```

Prints the current `.env.worktree`. Use when the user asks about ports or `COMPOSE_PROJECT_NAME`.

---

## When to invoke

- **"regenerate worktree ports"** / **"isolate worktree"** / **"my hook didn't fire"** → `apply --force`
- **"which ports is this worktree using?"** / **"show worktree ports"** / **"what's my COMPOSE_PROJECT_NAME?"** → `status`
- **"compose file changed, regenerate overrides"** → `apply` (without `--force`; mtime detection handles it, but `--force` is fine too)

---

## Port substitution in ad-hoc commands

The repo's `CLAUDE.md` may hardcode legacy host ports in test commands. Substitute the legacy port for the worktree-allocated one from `.env.worktree`:

```bash
# .env.worktree shows POSTGRES_INTEGRATION_5432_HOST_PORT=28156
DATABASE_URL=postgresql://rr_test:rr_test_pw@localhost:28156/rr_integration uv run pytest ...
```

This skill does not auto-rewrite `CLAUDE.md` or scripts (zero-touch on project files by design). To make a project natively isolation-aware, run [`worktree-isolation-setup`](../worktree-isolation-setup/).

---

## Edge cases

- **No docker-compose files in cwd** → no-op.
- **Service has `ports:` using `${VAR-default}` already** → the script captures `VAR` and exports it in `.env.worktree` (substitution picks up the new port automatically). The override file still rewrites the port too (belt + suspenders).
- **Base compose file edited after a previous run** → `apply` (without `--force`) detects the mtime change and regenerates.
- **Two worktrees collide on a port** (1/10000 chance per port) → currently surfaces as a `docker compose up` failure. Workaround: rename the worktree directory (changes the hash, regenerates ports).

---

## Out of scope

- Does not install the SessionStart hook. `npx claude-code-arcane global` does that, once per machine.
- Does not modify the repo's compose files / `CLAUDE.md` / `.gitignore`. Use [`worktree-isolation-setup`](../worktree-isolation-setup/) for that.
- Does not clean up orphan stacks from deleted worktrees. For now, `docker compose ls` and `docker compose -p <project-name> down -v` manually.
- Does not handle non-docker dev servers (Next.js, uvicorn directly on host).
