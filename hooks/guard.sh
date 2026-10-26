#!/usr/bin/env bash
# PreToolUse guard (Bash, PowerShell, Write, Edit): see guard.mjs for the rules.
#
# Arcane is installed with npx, so Node is there. Without it the guard does
# nothing and the static permission rules in settings.json remain the only check.
command -v node >/dev/null 2>&1 || exit 0
node "$(dirname "${BASH_SOURCE[0]}")/guard.mjs" "$@" 2>/dev/null
exit 0
