#!/usr/bin/env bash
set +e
# Claude may have cd'd into a subdirectory; the session files live at the checkout root.
TOP=$(git rev-parse --show-toplevel 2>/dev/null) && cd "$TOP"
main() {
  [[ -d .claude/session-state ]] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] post-compact" >> .claude/session-state/sessions.log
}
main 2>/dev/null
exit 0
