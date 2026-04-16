#!/usr/bin/env bash
# Detect secrets in Bash commands (cat .env, echo secrets, etc.)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -oE '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//')

# Block reading .env files
if echo "$COMMAND" | grep -qE '(cat|type|less|more|head|tail)\s+.*\.env'; then
  echo "BLOCK: reading .env files is prohibited for security." >&2
  exit 2
fi

# Block commands that might exfiltrate secrets
if echo "$COMMAND" | grep -qE 'curl.*\-d.*(api_key|password|secret|token)='; then
  echo "WARN: command appears to send credentials over network. Review carefully." >&2
fi

exit 0
