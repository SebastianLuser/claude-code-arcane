#!/usr/bin/env bash
# PostToolUse guard for notes written into an Obsidian vault.
#
# Warns, never blocks: a note half-written is still worth keeping, and a hook
# that rejects writes turns capture into a fight. Everything here is a warning on
# stderr and the exit code is always 0.
#
# Only fires for .md files that live under a directory containing .obsidian/, so
# it stays silent in a code repo even when the profile is installed there.
set +e

VAULT_MARKER=".obsidian"

find_vault_root() {
  local dir="$1"
  while [[ -n "$dir" && "$dir" != "/" && "$dir" != "." ]]; do
    [[ -d "$dir/$VAULT_MARKER" ]] && { echo "$dir"; return 0; }
    local parent
    parent=$(dirname "$dir")
    [[ "$parent" == "$dir" ]] && break
    dir="$parent"
  done
  return 1
}

frontmatter_of() {
  # Lines between the opening --- on line 1 and the next ---. Empty if the note
  # has no frontmatter at all.
  awk 'NR==1 && $0!="---" {exit} NR==1 {next} /^---$/ {exit} {print}' "$1" 2>/dev/null
}

main() {
  local INPUT FILE
  INPUT=$(cat 2>/dev/null) || true
  FILE=$(echo "$INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"file_path"\s*:\s*"//;s/"$//') || true

  [[ -z "$FILE" ]] && return 0
  [[ "$FILE" != *.md ]] && return 0
  [[ ! -f "$FILE" ]] && return 0

  # Windows paths arrive backslash-escaped inside the JSON payload.
  FILE=$(echo "$FILE" | sed 's|\\\\|/|g; s|\\|/|g')
  [[ ! -f "$FILE" ]] && return 0

  local ROOT REL
  ROOT=$(find_vault_root "$(dirname "$FILE")") || return 0
  REL=${FILE#"$ROOT"/}

  # Templates are hollow and unlinked by design; vault config is not a note.
  case "$REL" in
    Templates/*|*/Templates/*|.obsidian/*) return 0 ;;
  esac

  local FM
  FM=$(frontmatter_of "$FILE")

  if [[ -z "$FM" ]]; then
    echo "WARN [vault] $REL has no frontmatter: the vault contract expects created and type" >&2
    return 0
  fi

  local MISSING=""
  echo "$FM" | grep -qE '^created:' || MISSING="created"
  echo "$FM" | grep -qE '^type:' || MISSING="${MISSING:+$MISSING, }type"
  [[ -n "$MISSING" ]] && \
    echo "WARN [vault] $REL is missing frontmatter field(s): $MISSING" >&2

  # A raw dump is allowed to have no links: /review-dump is what adds them.
  local TYPE
  TYPE=$(echo "$FM" | grep -E '^type:' | head -1 | sed 's/^type:[[:space:]]*//;s/["'\'']//g')
  case "$TYPE" in
    dump|"") return 0 ;;
  esac
  case "$REL" in
    _inbox/*) return 0 ;;
  esac

  if ! grep -q '\[\[' "$FILE" 2>/dev/null; then
    echo "WARN [vault] $REL has no wikilink: an unlinked note is an orphan the day it is written" >&2
  fi
}
# stderr is left alone on purpose: it is the whole output of this hook. Some
# hooks in hooks/ swallow it; here that would make the guard invisible.
main
exit 0
