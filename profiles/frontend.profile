#!/usr/bin/env bash
# Profile: frontend
# Description: Frontend React + Vite + TypeScript
# Type: base

DESCRIPTION="Frontend React + Vite + TypeScript"

SKILLS_GENERAL=(
  tdd
  test-setup
  test-helpers
  i18n-setup
  deps-audit
  security-audit
  env-sync
  error-tracking
  release-checklist
  patch-notes
  onboard
)

SKILLS_GAMEDEV=()

SKILLS_SOFTWARE=(
  scaffold-react-vite
  state-management
  form-validation
  accessibility
  csp-headers
  owasp-top10-check
  ci-cd-setup
  cdn-setup
  file-uploads
)

SKILLS_AGILE=()
SKILLS_DESIGN=()

RULES_UNIVERSAL=(frontend-code)
RULES_GAMEDEV=()

AGENTS=()

PERMISSIONS_ALLOW=(
  "Bash(npm *)"
  "Bash(yarn *)"
  "Bash(pnpm *)"
)

PERMISSIONS_DENY=()
