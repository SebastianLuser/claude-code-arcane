#!/usr/bin/env bash
# Save summary before context compaction
[[ -d production/session-state ]] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] pre-compact" >> production/session-state/sessions.log
exit 0
