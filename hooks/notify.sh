#!/usr/bin/env bash
set +e
main() {
  [[ -d .claude/session-state ]] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] notification" >> .claude/session-state/notifications.log
}
main 2>/dev/null
exit 0
