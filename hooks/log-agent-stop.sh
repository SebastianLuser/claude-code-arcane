#!/usr/bin/env bash
set +e
main() {
  [[ -d production/session-state ]] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] subagent_stop" >> production/session-state/agents.log
}
main 2>/dev/null
exit 0
