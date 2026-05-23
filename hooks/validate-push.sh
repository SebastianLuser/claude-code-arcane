#!/usr/bin/env bash
# Validate git push commands
# Blocks destructive pushes

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -oE '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//')

if [[ "$COMMAND" != *"git push"* ]]; then
  exit 0
fi

# Block force push to main/master
if [[ "$COMMAND" == *"--force"* || "$COMMAND" == *"-f "* ]]; then
  if [[ "$COMMAND" == *"main"* || "$COMMAND" == *"master"* ]]; then
    echo "BLOCK: force push to main/master is prohibited." >&2
    exit 2
  fi
fi

exit 0
