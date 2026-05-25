#!/usr/bin/env bash
set +e

main() {
  local INPUT
  INPUT=$(cat 2>/dev/null) || true

  local COMMAND
  COMMAND=$(echo "$INPUT" | grep -oE '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//') || true

  [[ -z "$COMMAND" || "$COMMAND" != *"git push"* ]] && return 0

  if [[ "$COMMAND" == *"--force"* || "$COMMAND" == *"-f "* ]]; then
    if [[ "$COMMAND" == *"main"* || "$COMMAND" == *"master"* ]]; then
      echo "BLOCK: force push to main/master is prohibited." >&2
      exit 2
    fi
  fi
}
main
exit 0
