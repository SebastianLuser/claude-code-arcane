#!/usr/bin/env bash
# PreToolUse guard (Bash, Write, Edit): see guard.py for the rules.
#
# Runs guard.py with the first Python that actually starts. On Windows `python3`
# can be the Microsoft Store stub, which exits non-zero instead of running, so
# each candidate is tried in turn. With no working Python the guard does nothing
# and the static permission rules in settings.json remain the only check.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT=$(cat)

for PY in python3 python py; do
  command -v "$PY" >/dev/null 2>&1 || continue
  if OUT=$(printf '%s' "$INPUT" | "$PY" "$DIR/guard.py" "$@" 2>/dev/null); then
    printf '%s' "$OUT"
    exit 0
  fi
done
exit 0
