#!/usr/bin/env bash
# Session watch (PostToolUse and Stop): see session-watch.mjs.
# session-watch.sh post-tool | session-watch.sh stop
command -v node >/dev/null 2>&1 || exit 0
node "$(dirname "${BASH_SOURCE[0]}")/session-watch.mjs" "$@" 2>/dev/null
exit 0
