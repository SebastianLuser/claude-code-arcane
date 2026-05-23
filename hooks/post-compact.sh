#!/usr/bin/env bash
# Load summary after compaction
[[ -d production/session-state ]] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] post-compact" >> production/session-state/sessions.log
exit 0
