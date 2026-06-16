#!/usr/bin/env bash
# Claude Code Arcane - Status Line
# Reads Claude Code session JSON from stdin and prints a status line.

INPUT=$(cat)

PROJECT=$(basename "$(pwd)")

if command -v git &>/dev/null && git rev-parse --is-inside-work-tree &>/dev/null; then
  BRANCH=$(git branch --show-current 2>/dev/null)
else
  BRANCH=""
fi

# Skills/agents Claude can actually invoke = global (~/.claude) + project (.claude),
# deduped by name (project overrides global). Follow -L so .claude/skills junctions count.
# Top-level only (mindepth/maxdepth 2) so bundled sub-skills don't inflate the total.
SKILLS=$( { find -L "$HOME/.claude/skills" -mindepth 2 -maxdepth 2 -name "SKILL.md" 2>/dev/null;
            find -L .claude/skills          -mindepth 2 -maxdepth 2 -name "SKILL.md" 2>/dev/null; } \
          | xargs -n1 dirname 2>/dev/null | xargs -n1 basename 2>/dev/null | sort -u | wc -l | tr -d ' ')
AGENTS=$( { find -L "$HOME/.claude/agents" -name "*.md" 2>/dev/null;
            find -L .claude/agents         -name "*.md" 2>/dev/null; } \
          | xargs -n1 basename 2>/dev/null | sort -u | wc -l | tr -d ' ')

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
model = data.get("model") or {}
model_id = model.get("id", "")
model_name = model.get("display_name") or model_id or ""
# emit model on first line for bash to pick up
print("MODEL=" + model_name)

def fmt(n):
    if n >= 1000000:
        return ("%.1fM" % (n / 1000000.0)).replace(".0M", "M")
    if n >= 1000:
        return "%dk" % int(round(n / 1000.0))
    return str(n)

total = None
limit = None
pct = None

# Preferred: Claude Code provides the real context window for THIS session/model.
# context_window_size is the actual max (200k, 1M, ...) — never hardcode it.
cw = data.get("context_window") or {}
if isinstance(cw, dict) and cw:
    limit = cw.get("context_window_size") or None
    cu = cw.get("current_usage") or {}
    if cu:
        total = (cu.get("input_tokens", 0)
                 + cu.get("cache_read_input_tokens", 0)
                 + cu.get("cache_creation_input_tokens", 0))
    up = cw.get("used_percentage")
    if up is not None:
        try:
            pct = float(up)
        except Exception:
            pct = None

# Fallback (older Claude Code without context_window): scan transcript usage.
if total is None:
    path = data.get("transcript_path") or ""
    # Windows python cannot resolve MSYS/Git-Bash paths (/c/Users/...); convert to C:/Users/...
    if os.name == "nt" and len(path) > 2 and path[0] == "/" and path[2] == "/" and path[1].isalpha():
        path = path[1].upper() + ":" + path[2:]
    if path and os.path.exists(path):
        last_usage = None
        try:
            with open(path, encoding="utf-8") as f:
                for line in f:
                    try:
                        m = json.loads(line)
                    except Exception:
                        continue
                    if m.get("type") == "assistant":
                        u = (m.get("message") or {}).get("usage")
                        if u:
                            last_usage = u
        except Exception:
            last_usage = None
        if last_usage:
            total = (last_usage.get("input_tokens", 0)
                     + last_usage.get("cache_read_input_tokens", 0)
                     + last_usage.get("cache_creation_input_tokens", 0))
            # last-resort only: infer window from a 1M marker, else assume 200k
            if limit is None:
                limit = 1000000 if ("[1m]" in model_id or model_id.endswith("-1m")) else 200000

parts = []
if total is not None and limit:
    # pct from Claude Code when available; else total/limit (consistent with tokens shown).
    if pct is None:
        pct = total * 100.0 / limit
    parts.append("\U0001F9E0 %s / %s (%d%%)" % (fmt(total), fmt(limit), int(round(pct))))
print("EXTRA=" + " | ".join(parts))
' <<< "$INPUT" 2>/dev/null)
  MODEL=$(echo "$OUT" | grep '^MODEL=' | head -1 | sed 's/^MODEL=//')
  EXTRA=$(echo "$OUT" | grep '^EXTRA=' | head -1 | sed 's/^EXTRA=//')
fi

PREFIX="🔮 ${PROJECT}"
[ -n "$MODEL" ] && PREFIX="⚡ ${MODEL} | ${PREFIX}"

PARTS="${PREFIX}"
[ -n "$BRANCH" ] && PARTS="${PARTS} | 🌿 ${BRANCH}"
PARTS="${PARTS} | 🛠️ ${SKILLS} skills"
[ "$AGENTS" -gt 0 ] 2>/dev/null && PARTS="${PARTS} | 🤖 ${AGENTS} agents"
[ -n "$EXTRA" ] && PARTS="${PARTS} | ${EXTRA}"

echo "$PARTS"
