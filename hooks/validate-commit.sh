#!/usr/bin/env bash
set +e

main() {
  local INPUT
  INPUT=$(cat 2>/dev/null) || true

  local COMMAND GUARDED=1
  # guard.sh parses the JSON properly; the regex is only a fallback without Node
  # and stops at the first escaped quote.
  COMMAND=$(printf '%s' "$INPUT" | bash "$(dirname "${BASH_SOURCE[0]}")/guard.sh" --command 2>/dev/null) || true
  if [[ -z "$COMMAND" ]]; then
    GUARDED=0
    COMMAND=$(echo "$INPUT" | grep -oE '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//') || true
  fi

  [[ -z "$COMMAND" || "$COMMAND" != *"git commit"* ]] && return 0

  # With Node the guard denies --no-verify on the parsed command; this substring
  # check would also fire on a commit message that only mentions the flag.
  if [[ "$GUARDED" == 0 && "$COMMAND" == *"--no-verify"* ]]; then
    echo "BLOCK: --no-verify is not allowed. Fix the underlying issue instead of bypassing hooks." >&2
    exit 2
  fi

  if [[ "$COMMAND" == *"-m \"\""* ]]; then
    echo "BLOCK: empty commit message not allowed." >&2
    exit 2
  fi

  validate_3d_exports
}

# 3D export gate. No-op unless the blender profile is installed and there are
# staged .glb/.gltf files: blocks only unambiguous failures (broken container, no UVs,
# unapplied conversion scale, textures outside the .glb). The tris budget is
# per project, so it is not passed here and stays a warning, not a block.
validate_3d_exports() {
  local VALIDATOR=".claude/skills/blender-export/scripts/validate_gltf.py"
  [[ -f "$VALIDATOR" ]] || return 0

  local STAGED
  STAGED=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep -iE '\.(glb|gltf)$') || true
  [[ -z "$STAGED" ]] && return 0

  local PY
  PY=$(command -v python3 2>/dev/null || command -v python 2>/dev/null) || return 0
  [[ -z "$PY" ]] && return 0

  local FAILED="" OUT
  while IFS= read -r FILE; do
    [[ -n "$FILE" && -f "$FILE" ]] || continue
    if ! OUT=$("$PY" "$VALIDATOR" "$FILE" 2>&1); then
      FAILED+="$OUT"$'
'
    fi
  done <<< "$STAGED"

  if [[ -n "$FAILED" ]]; then
    echo "BLOCK: staged 3D exports fail validation." >&2
    echo "$FAILED" >&2
    echo "Fix it in Blender and re-export (see /blender-export), or unstage the file." >&2
    exit 2
  fi
}

main
exit 0
