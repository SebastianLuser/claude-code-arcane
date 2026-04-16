#!/usr/bin/env bash
# Warn if a skill file was modified
# Ensures frontmatter is valid

INPUT=$(cat)
FILE=$(echo "$INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"file_path"\s*:\s*"//;s/"$//')

# Only validate SKILL.md files
if [[ "$FILE" != *"/skills/"*"/SKILL.md" && "$FILE" != *"/skills/"*"/skill.md" ]]; then
  exit 0
fi

# Check frontmatter exists
if ! head -3 "$FILE" 2>/dev/null | grep -q "^---$"; then
  echo "WARN: skill file $FILE may be missing frontmatter" >&2
fi

exit 0
