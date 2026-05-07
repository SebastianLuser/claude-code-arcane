---
name: git-worktree-manager
description: "Run parallel feature work safely with Git worktrees. Standardizes branch isolation, port allocation, environment sync, and cleanup so each worktree behaves like an independent local app."
category: "git"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Git Worktree Manager

Use this skill to run parallel feature work safely with Git worktrees. It standardizes branch isolation, port allocation, environment sync, and cleanup so each worktree behaves like an independent local app without stepping on another branch.

Optimized for multi-agent workflows where each agent or terminal session owns one worktree.

## Core Capabilities

- Create worktrees from new or existing branches with deterministic naming
- Auto-allocate non-conflicting ports per worktree and persist assignments
- Copy local environment files (`.env*`) from main repo to new worktree
- Optionally install dependencies based on lockfile detection
- Detect stale worktrees and uncommitted changes before cleanup
- Identify merged branches and safely remove outdated worktrees

## When to Use

- You need 2+ concurrent branches open locally
- You want isolated dev servers for feature, hotfix, and PR validation
- You are working with multiple agents that must not share a branch
- Your current branch is blocked but you need to ship a quick fix now
- You want repeatable cleanup instead of ad-hoc `rm -rf` operations

## Key Workflows

### 1. Create a Fully-Prepared Worktree

```bash
python scripts/worktree_manager.py \
  --repo . \
  --branch feature/new-auth \
  --name wt-auth \
  --base-branch main \
  --install-deps \
  --format text
```

### 2. Cleanup with Safety Checks

```bash
python scripts/worktree_cleanup.py --repo . --stale-days 14 --format text
python scripts/worktree_cleanup.py --repo . --remove-merged --format text
```

### 3. Port Allocation Strategy

Default: `base + (index * stride)` with collision checks. App: `3000`, Postgres: `5432`, Redis: `6379`, Stride: `10`.

> See [references/port-allocation-strategy.md](references/port-allocation-strategy.md) for full strategy and edge cases.

> See [references/docker-compose-patterns.md](references/docker-compose-patterns.md) for per-worktree Docker Compose templates.

## Common Pitfalls

1. Creating worktrees inside the main repo directory
2. Reusing `localhost:3000` across all branches
3. Sharing one database URL across isolated feature branches
4. Removing a worktree with uncommitted changes
5. Forgetting to prune old metadata after branch deletion
6. Assuming merged status without checking against the target branch

## Best Practices

1. One branch per worktree, one agent per worktree.
2. Keep worktrees short-lived; remove after merge.
3. Use a deterministic naming pattern (`wt-<topic>`).
4. Persist port mappings in file, not memory or terminal notes.
5. Run cleanup scan weekly in active repos.
6. Use `--format json` for machine flows and `--format text` for human review.
7. Never force-remove dirty worktrees unless changes are intentionally discarded.

## Decision Matrix

- Need isolated dependencies and server ports --> create a new worktree
- Need only a quick local diff review --> stay on current tree
- Need hotfix while feature branch is dirty --> create dedicated hotfix worktree
- Need ephemeral reproduction branch for bug triage --> create temporary worktree and cleanup same day
