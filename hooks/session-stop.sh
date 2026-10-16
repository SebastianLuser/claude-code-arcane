#!/usr/bin/env bash
set +e
main() {
  [[ -d .claude/session-state ]] || return 0
  # Claude creates the folder the first time it writes active.md; keep it out of
  # commits from that same turn on.
  [[ -f .claude/session-state/.gitignore ]] || echo '*' > .claude/session-state/.gitignore
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Session stopped" >> .claude/session-state/sessions.log
}
main 2>/dev/null
exit 0
