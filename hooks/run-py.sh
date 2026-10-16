#!/usr/bin/env bash
# Runs a Python hook from this folder: run-py.sh <script.py> [args...]
#
# Uses the first Python that actually starts (on Windows `python3` can be the
# Microsoft Store stub, which exits non-zero instead of running). With no working
# Python the hook does nothing.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$1"
shift
[ -f "$DIR/$SCRIPT" ] || exit 0
INPUT=$(cat)

for PY in python3 python py; do
  command -v "$PY" >/dev/null 2>&1 || continue
  if OUT=$(printf '%s' "$INPUT" | "$PY" "$DIR/$SCRIPT" "$@" 2>/dev/null); then
    printf '%s' "$OUT"
    exit 0
  fi
done
exit 0
