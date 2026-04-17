#!/usr/bin/env bash
# Claude Code Arcane - Status Line
# Reads Claude Code session JSON from stdin and prints a status line.

INPUT=$(cat)

BRANCH=$(git branch --show-current 2>/dev/null || echo "no-git")

# Follow symlinks — .claude/skills/ is an aggregator of junctions to per-stack dirs
SKILLS=$(find -L .claude/skills -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')

PYCMD=$(command -v python 2>/dev/null || command -v python3 2>/dev/null || command -v py 2>/dev/null)

MODEL=""
EXTRA=""
if [ -n "$PYCMD" ]; then
  OUT=$(PYTHONIOENCODING=utf-8 "$PYCMD" -c '
import json, sys, os
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
path = data.get("transcript_path") or ""
model = data.get("model") or {}
model_id = model.get("id", "")
model_name = model.get("display_name") or model_id or ""
# emit model on first line for bash to pick up
print("MODEL=" + model_name)
if not path or not os.path.exists(path):
    sys.exit(0)
last_usage = None
try:
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                m = json.loads(line)
            except Exception:
                continue
            if m.get("type") == "assistant":
                msg = m.get("message") or {}
                u = msg.get("usage")
                if u:
                    last_usage = u
except Exception:
    sys.exit(0)
parts = []
if last_usage:
    total = (last_usage.get("input_tokens", 0)
             + last_usage.get("cache_read_input_tokens", 0)
             + last_usage.get("cache_creation_input_tokens", 0))
    limit = 1000000 if ("[1m]" in model_id or model_id.endswith("-1m")) else 200000
    pct = int(round(total * 100 / limit))
    parts.append("\U0001F9E0 %d%% ctx" % pct)
print("EXTRA=" + " | ".join(parts))
' <<< "$INPUT" 2>/dev/null)
  MODEL=$(echo "$OUT" | grep '^MODEL=' | head -1 | sed 's/^MODEL=//')
  EXTRA=$(echo "$OUT" | grep '^EXTRA=' | head -1 | sed 's/^EXTRA=//')
fi

PREFIX="🔮 Arcane"
[ -n "$MODEL" ] && PREFIX="🤖 ${MODEL} | ${PREFIX}"

if [ -n "$EXTRA" ]; then
  echo "${PREFIX} | 🌿 ${BRANCH} | 🛠️ ${SKILLS} skills | ${EXTRA}"
else
  echo "${PREFIX} | 🌿 ${BRANCH} | 🛠️ ${SKILLS} skills"
fi
