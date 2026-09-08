#!/bin/bash
# Hook: check-update.sh — SessionStart
# Lightweight update check against GitHub. Cached for 4 hours.
set +e

CHECK_FILE="$HOME/.arcane/last-check.json"
CHECK_INTERVAL=14400  # 4 hours in seconds
GITHUB_API="https://api.github.com/repos/SebastianLuser/Claude-Code-Arcane/commits/main"

# `arcane` is the bin name, so it only exists on PATH after `npm i -g`. The
# README installs with npx, so most projects running this hook have no `arcane`
# to run: printing it hands them "'arcane' is not recognized" instead of an
# update. Unlike the CLI, a hook can test the real thing rather than infer it.
if command -v arcane &>/dev/null; then
  ARCANE_CMD="arcane"
else
  ARCANE_CMD="npx claude-code-arcane"
fi

main() {
  if [ ! -f ".claude/arcane-manifest.json" ]; then
    exit 0
  fi

  if [ -f "$CHECK_FILE" ]; then
    if command -v python3 &>/dev/null; then
      LAST_CHECK=$(python3 -c "
import json, sys
from datetime import datetime, timezone
try:
    data = json.load(open('$CHECK_FILE'))
    checked = datetime.fromisoformat(data['checked_at'].replace('Z', '+00:00'))
    age = (datetime.now(timezone.utc) - checked).total_seconds()
    if age < $CHECK_INTERVAL:
        if data.get('update_available', False):
            print('UPDATE_AVAILABLE')
        else:
            print('UP_TO_DATE')
    else:
        print('STALE')
except:
    print('STALE')
" 2>/dev/null)

      case "$LAST_CHECK" in
        UPDATE_AVAILABLE)
          echo "Arcane update available. Run: $ARCANE_CMD update"
          exit 0
          ;;
        UP_TO_DATE)
          exit 0
          ;;
      esac
    fi
  fi

  REMOTE_SHA=$(curl -sf -H "User-Agent: arcane-cli" -H "Accept: application/vnd.github.v3+json" \
    --connect-timeout 3 --max-time 5 "$GITHUB_API" 2>/dev/null | \
    python3 -c "import json,sys; print(json.load(sys.stdin)['sha'][:12])" 2>/dev/null)

  if [ -z "$REMOTE_SHA" ]; then
    exit 0
  fi

  LOCAL_VERSION=$(python3 -c "
import json
try:
    data = json.load(open('.claude/arcane-manifest.json'))
    print(data.get('source_version', data.get('arcane_version', 'unknown')))
except:
    print('unknown')
" 2>/dev/null)

  # Parity with isContentUpdateAvailable() in src/update-check.ts: the remote content
  # identity is a commit SHA, so only a SHA-shaped local version can be compared against
  # it. A bundled install — which is every `npx claude-code-arcane install` — records a
  # semver instead, and "2.9.6" never equals a SHA. The CLI got this guard; the hook did
  # not, so it announced an update on every single session no matter how current the
  # install was, and pointed at a command npx users do not have.
  UPDATE_AVAILABLE="false"
  if ! echo "$LOCAL_VERSION" | grep -qiE '^[0-9a-f]{7,40}$'; then
    UPDATE_AVAILABLE="false"
  elif [ "$LOCAL_VERSION" != "$REMOTE_SHA" ] && ! echo "$REMOTE_SHA" | grep -q "^$LOCAL_VERSION"; then
    UPDATE_AVAILABLE="true"
    echo "Arcane update available: $LOCAL_VERSION → $REMOTE_SHA. Run: $ARCANE_CMD update"
  fi

  mkdir -p "$HOME/.arcane" 2>/dev/null
  cat > "$CHECK_FILE" <<CHECKEOF
{
  "checked_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "local_version": "$LOCAL_VERSION",
  "remote_sha": "$REMOTE_SHA",
  "update_available": $UPDATE_AVAILABLE
}
CHECKEOF
}

main 2>/dev/null
exit 0
