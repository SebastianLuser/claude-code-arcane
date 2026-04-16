#!/usr/bin/env bash
[[ -d production/session-state ]] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] subagent_stop" >> production/session-state/agents.log
exit 0
