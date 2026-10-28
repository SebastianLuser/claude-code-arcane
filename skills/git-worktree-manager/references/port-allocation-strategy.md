# Port Allocation Strategy

## Objective

Allocate deterministic, non-overlapping local ports for each worktree to avoid collisions across concurrent development sessions.

## Default Mapping

- App HTTP: `3000`
- Postgres: `5432`
- Redis: `6379`
- Stride per worktree: `10`

Formula by slot index `n`:

- `app = 3000 + (10 * n)`
- `db = 5432 + (10 * n)`
- `redis = 6379 + (10 * n)`

Examples:

- Slot 0: `3000/5432/6379`, the main checkout's; never assigned to a worktree
- Slot 1: `3010/5442/6389`, the first worktree
- Slot 2: `3020/5452/6399`

## Collision Avoidance

1. Read `.worktree-ports.json` from existing worktrees.
2. Skip any slot where one or more ports are already assigned.
3. Persist selected mapping in the new worktree.
4. On a rerun, keep the mapping the worktree already has, and leave its `.env` files alone.

## Operational Notes

- Keep stride >= number of services to avoid accidental overlaps when adding ports later.
- For custom service sets, reserve a contiguous block per worktree.
- If you also run local infra outside worktrees, offset bases to avoid global collisions.

## Recommended File Format

```json
{
  "app": 3010,
  "db": 5442,
  "redis": 6389
}
```
