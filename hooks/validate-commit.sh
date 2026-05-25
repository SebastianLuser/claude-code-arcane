#!/usr/bin/env bash
set +e

main() {
  local INPUT
  INPUT=$(cat 2>/dev/null) || true

  local COMMAND
  COMMAND=$(echo "$INPUT" | grep -oE '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//') || true

  [[ -z "$COMMAND" || "$COMMAND" != *"git commit"* ]] && return 0

  if [[ "$COMMAND" == *"--no-verify"* ]]; then
    echo "BLOCK: --no-verify is not allowed. Fix the underlying issue instead of bypassing hooks." >&2
    exit 2
  fi

  if [[ "$COMMAND" == *"-m \"\""* ]]; then
    echo "BLOCK: empty commit message not allowed." >&2
    exit 2
  fi
}
main
exit 0
