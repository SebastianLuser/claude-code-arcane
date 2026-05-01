#!/usr/bin/env bash
# Profile: core
# Description: Skills universales — siempre incluido en todos los perfiles
# Type: base

DESCRIPTION="Skills universales, hooks y rules base"

SKILLS=(
  commit
  create-pr
  changelog
  check
  code-review
  context-prime
  help
  start
  fix-issue
  hotfix
  brainstorm
  scope-check
  reverse-document
  skill-improve
  skill-test
  tech-debt
  arcane-status
  arcane-list
  arcane-add
  arcane-remove
  arcane-clean
)

RULES_UNIVERSAL=(data-files prototype-code test-standards)
RULES_GAMEDEV=()

AGENTS=(quality)

HOOKS=(
  session-start.sh
  detect-division.sh
  detect-gaps.sh
  validate-commit.sh
  validate-push.sh
  validate-secrets.sh
  validate-assets.sh
  validate-skill-change.sh
  notify.sh
  pre-compact.sh
  post-compact.sh
  session-stop.sh
  log-agent.sh
  log-agent-stop.sh
  statusline.sh
)

PERMISSIONS_ALLOW=(
  "Bash(git status*)"
  "Bash(git diff*)"
  "Bash(git log*)"
  "Bash(git branch*)"
  "Bash(git rev-parse*)"
  "Bash(ls *)"
  "Bash(dir *)"
  "Bash(gh *)"
  "Bash(curl -s*)"
)

PERMISSIONS_DENY=(
  "Bash(rm -rf *)"
  "Bash(git push --force*)"
  "Bash(git push -f *)"
  "Bash(git reset --hard*)"
  "Bash(git clean -f*)"
  "Bash(sudo *)"
  "Bash(chmod 777*)"
  "Bash(*>.env*)"
  "Bash(cat *.env*)"
  "Bash(type *.env*)"
  "Read(**/.env*)"
  "Read(**/credentials*)"
  "Read(**/*.pem)"
  "Read(**/*.key)"
)
