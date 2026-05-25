#!/usr/bin/env bash
set +e

main() {
  local INPUT
  INPUT=$(cat 2>/dev/null) || true

  local FILE
  FILE=$(echo "$INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"file_path"\s*:\s*"//;s/"$//') || true

  [[ -z "$FILE" ]] && return 0
  [[ "$FILE" != *"/skills/"*"/SKILL.md" && "$FILE" != *"/skills/"*"/skill.md" ]] && return 0

  if ! head -3 "$FILE" 2>/dev/null | grep -q "^---$"; then
    echo "WARN: skill file $FILE may be missing frontmatter" >&2
  fi
}
main 2>/dev/null
exit 0
