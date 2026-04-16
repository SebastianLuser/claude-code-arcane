#!/usr/bin/env bash
# Session stop hook

SESSION_LOG="production/session-state/sessions.log"
[[ -d production/session-state ]] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Session stopped" >> "$SESSION_LOG"

exit 0
