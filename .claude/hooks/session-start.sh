#!/usr/bin/env bash
# Session start hook - Claude Code Mega Studios
# Fires when a new session begins

# Ensure session state directory exists
mkdir -p production/session-state 2>/dev/null

# Create or update session log
SESSION_LOG="production/session-state/sessions.log"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Session started" >> "$SESSION_LOG"

exit 0
