#!/usr/bin/env bash
set +e
main() {
  [[ -d .claude/session-state ]] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] pre-compact" >> .claude/session-state/sessions.log
}
main 2>/dev/null
exit 0
