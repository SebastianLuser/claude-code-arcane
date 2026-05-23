#!/usr/bin/env bash
# Notification hook - logs notifications
[[ -d production/session-state ]] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] notification" >> production/session-state/notifications.log
exit 0
