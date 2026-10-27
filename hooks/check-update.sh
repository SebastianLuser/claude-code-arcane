#!/bin/bash
# Hook: check-update.sh — SessionStart
# Lightweight update check against GitHub, cached for 4 hours: see check-update.mjs.
command -v node >/dev/null 2>&1 || exit 0

# `arcane` is the bin name, so it only exists on PATH after `npm i -g`. The
# README installs with npx, so most projects running this hook have no `arcane`
# to run: printing it hands them "'arcane' is not recognized" instead of an
# update. Unlike the CLI, a hook can test the real thing rather than infer it.
if command -v arcane &>/dev/null; then
  ARCANE_CMD="arcane"
else
  ARCANE_CMD="npx claude-code-arcane"
fi

node "$(dirname "${BASH_SOURCE[0]}")/check-update.mjs" "$ARCANE_CMD" 2>/dev/null
exit 0
