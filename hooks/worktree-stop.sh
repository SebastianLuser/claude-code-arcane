#!/usr/bin/env bash
# Hook: worktree-stop.sh — Stop
#
# A session that enters a worktree with EnterWorktree tends to stay there after the
# task is done, and the next pull or branch switch fails inside it. When the turn
# ends inside such a worktree with everything committed, block the stop once and ask
# Claude to leave with ExitWorktree (keep), or to say the task continues.
#
# Fires once per commit: a new commit means new progress, so it may ask again.
# Never fires when the session itself started inside the worktree (ExitWorktree
# could not leave it) or while there are uncommitted changes (work in progress).
set +e

main() {
  local INPUT PROJECT TOP BRANCH HEAD MARKER_DIR MARKER REASON
  INPUT=$(cat 2>/dev/null)
  # Second stop of the same turn: Claude already answered the block.
  echo "$INPUT" | grep -qE '"stop_hook_active"[[:space:]]*:[[:space:]]*true' && return 0

  PROJECT="${CLAUDE_PROJECT_DIR:-}"
  [ -n "$PROJECT" ] || return 0
  TOP=$(git rev-parse --show-toplevel 2>/dev/null) || return 0

  # Only worktrees EnterWorktree creates: under the project the session started in.
  case "$TOP" in
    "$PROJECT"/.claude/worktrees/*) ;;
    *) return 0 ;;
  esac

  [ -z "$(git status --porcelain 2>/dev/null)" ] || return 0

  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  HEAD=$(git rev-parse HEAD 2>/dev/null)
  MARKER_DIR="$PROJECT/.claude/session-state"
  MARKER="$MARKER_DIR/.worktree-stop"
  [ "$(cat "$MARKER" 2>/dev/null)" = "$TOP $HEAD" ] && return 0
  mkdir -p "$MARKER_DIR" 2>/dev/null
  [ -f "$MARKER_DIR/.gitignore" ] || echo '*' > "$MARKER_DIR/.gitignore"
  echo "$TOP $HEAD" > "$MARKER"

  REASON="You are still inside the worktree $TOP (branch $BRANCH) and its changes are committed. If the task is finished, push the branch if the task included pushing, then leave with ExitWorktree (action: keep) and tell the user the worktree path and branch. If the task continues, say so in one line and stop."
  REASON=${REASON//\\/\/}
  REASON=${REASON//\"/\'}
  printf '{"decision": "block", "reason": "%s"}\n' "$REASON"
}

main
exit 0
