#!/usr/bin/env bash
set +e
main() {
  [[ -d production/session-state ]] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] notification" >> production/session-state/notifications.log
}
main 2>/dev/null
exit 0
