#!/bin/bash
# Hook: session-start.sh — SessionStart
# Graceful: wraps in main(), never blocks session
set +e

# Hook logs and state. Only hooks write here, so Claude Code's protection of .claude/
# never gets in the way.
STATE_DIR=".claude/session-state"
# The progress file Claude itself writes. Claude Code asks before every edit under
# .claude/, even in acceptEdits and with an allow rule, so it lives outside it.
PROGRESS_DIR=".arcane/session-state"
LEGACY_PROGRESS_DIRS="production/session-state .claude/session-state"

# Both folders hold session notes, never project files: a .gitignore with `*` keeps
# them out of every commit without touching the project's own .gitignore.
ensure_ignored_dir() {
  mkdir -p "$1" 2>/dev/null
  [ -f "$1/.gitignore" ] || echo '*' > "$1/.gitignore" 2>/dev/null
}

# active.md used to live in production/session-state/ and then .claude/session-state/.
# Move it once, so a task left half done before the update still shows up here.
migrate_legacy_progress() {
  local DIR
  [ -f "$PROGRESS_DIR/active.md" ] && return 0
  for DIR in $LEGACY_PROGRESS_DIRS; do
    [ -f "$DIR/active.md" ] || continue
    ensure_ignored_dir "$PROGRESS_DIR"
    mv "$DIR/active.md" "$PROGRESS_DIR/active.md" 2>/dev/null &&
      echo "Moved $DIR/active.md to $PROGRESS_DIR/active.md"
    return 0
  done
}

# A session started inside a worktree should know it, and where the main checkout is.
worktree_notice() {
  local DIRS GIT_DIR COMMON_DIR TOP BRANCH MAIN MAIN_BRANCH
  DIRS=$(git rev-parse --path-format=absolute --git-dir --git-common-dir 2>/dev/null) || return 0
  GIT_DIR=$(echo "$DIRS" | sed -n 1p)
  COMMON_DIR=$(echo "$DIRS" | sed -n 2p)
  [ -z "$COMMON_DIR" ] || [ "$GIT_DIR" = "$COMMON_DIR" ] && return 0
  TOP=$(git rev-parse --show-toplevel 2>/dev/null)
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  MAIN=$(dirname "$COMMON_DIR")
  MAIN_BRANCH=$(git -C "$MAIN" rev-parse --abbrev-ref HEAD 2>/dev/null)
  echo "Worktree: you are in $TOP on branch $BRANCH."
  echo "Main checkout: $MAIN on branch $MAIN_BRANCH. See the git-worktrees rule before pulling or switching branches."
  echo ""
}

main() {
  migrate_legacy_progress
  [ -d "$STATE_DIR" ] && ensure_ignored_dir "$STATE_DIR"
  [ -d "$PROGRESS_DIR" ] && ensure_ignored_dir "$PROGRESS_DIR"
  [ -d "$STATE_DIR" ] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Session started" >> "$STATE_DIR/sessions.log" 2>/dev/null

  echo "=== Claude Code Arcane — Session Context ==="
  worktree_notice

  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  if [ -n "$BRANCH" ]; then
    echo "Branch: $BRANCH"
    echo ""
    echo "Recent commits:"
    git log --oneline -5 2>/dev/null | while read -r line; do
      echo "  $line"
    done
  fi

  LATEST_SPRINT=$(ls -t production/sprints/sprint-*.md 2>/dev/null | head -1)
  if [ -n "$LATEST_SPRINT" ]; then
    echo ""
    echo "Active sprint: $(basename "$LATEST_SPRINT" .md)"
  fi

  LATEST_MILESTONE=$(ls -t production/milestones/*.md 2>/dev/null | head -1)
  if [ -n "$LATEST_MILESTONE" ]; then
    echo "Active milestone: $(basename "$LATEST_MILESTONE" .md)"
  fi

  BUG_COUNT=0
  for dir in tests/playtest production issues; do
    if [ -d "$dir" ]; then
      count=$(find "$dir" -name "BUG-*.md" 2>/dev/null | wc -l)
      BUG_COUNT=$((BUG_COUNT + count))
    fi
  done
  BUG_COUNT=$(echo "$BUG_COUNT" | tr -d ' ')
  if [ "$BUG_COUNT" -gt 0 ]; then
    echo "Open bugs: $BUG_COUNT"
  fi

  if [ -d "src" ]; then
    # Variable names avoid "todo", a Spanish word the repo's language check counts.
    OPEN_MARKERS=$(grep -r "TODO" src/ 2>/dev/null | wc -l | tr -d ' ')
    FIX_MARKERS=$(grep -r "FIXME" src/ 2>/dev/null | wc -l | tr -d ' ')
    if [ "$OPEN_MARKERS" -gt 0 ] || [ "$FIX_MARKERS" -gt 0 ]; then
      echo ""
      echo "Code health: ${OPEN_MARKERS} TODOs, ${FIX_MARKERS} FIXMEs in src/"
    fi
  fi

  STATE_FILE="$PROGRESS_DIR/active.md"
  if [ -f "$STATE_FILE" ]; then
    echo ""
    echo "=== ACTIVE SESSION STATE DETECTED ==="
    echo "A previous session left state at: $STATE_FILE"
    echo "Read this file to recover context and continue where you left off."
    echo ""
    echo "Quick summary:"
    head -20 "$STATE_FILE" 2>/dev/null
    TOTAL_LINES=$(wc -l < "$STATE_FILE" 2>/dev/null)
    TOTAL_LINES=$(echo "$TOTAL_LINES" | tr -d ' ')
    if [ "$TOTAL_LINES" -gt 20 ]; then
      echo "  ... ($TOTAL_LINES total lines — read the full file to continue)"
    fi
    echo "=== END SESSION STATE PREVIEW ==="
  fi

  echo "==================================="
}
main 2>/dev/null
exit 0
