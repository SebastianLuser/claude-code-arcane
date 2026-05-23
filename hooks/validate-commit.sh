#!/usr/bin/env bash
# Validate git commit commands
# Blocks commits with obvious issues

# Read the tool input from stdin (Claude Code passes it as JSON)
INPUT=$(cat)

# Extract command if it's a git commit
COMMAND=$(echo "$INPUT" | grep -oE '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//')

# Only validate git commit commands
if [[ "$COMMAND" != *"git commit"* ]]; then
  exit 0
fi

# Block if --no-verify is present (would skip hooks)
if [[ "$COMMAND" == *"--no-verify"* ]]; then
  echo "BLOCK: --no-verify is not allowed. Fix the underlying issue instead of bypassing hooks." >&2
  exit 2
fi

# Block empty commits unless explicitly --allow-empty
if [[ "$COMMAND" == *"-m \"\""* ]]; then
  echo "BLOCK: empty commit message not allowed." >&2
  exit 2
fi

exit 0
