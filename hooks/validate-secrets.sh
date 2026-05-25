#!/usr/bin/env bash
set +e

main() {
  local INPUT
  INPUT=$(cat 2>/dev/null) || true

  local COMMAND
  COMMAND=$(echo "$INPUT" | grep -oE '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//') || true

  [[ -z "$COMMAND" ]] && return 0

  if echo "$COMMAND" | grep -qE '(cat|type|less|more|head|tail)\s+.*\.env' 2>/dev/null; then
    echo "BLOCK: reading .env files is prohibited for security." >&2
    exit 2
  fi

  if echo "$COMMAND" | grep -qE 'curl.*\-d.*(api_key|password|secret|token)=' 2>/dev/null; then
    echo "WARN: command appears to send credentials over network. Review carefully." >&2
  fi
}
main
exit 0
