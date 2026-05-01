#!/usr/bin/env bash
# Profile: frontend
# Description: Frontend React + Vite + TypeScript
# Type: base

DESCRIPTION="Frontend React + Vite + TypeScript"

SKILLS=(
  testing
  i18n-setup
  deps-audit
  env-sync
  observability
  release
  onboard
  scaffold-react-vite
  state-management
  form-validation
  accessibility
  web-security
  ci-cd-setup
  cdn-setup
  file-uploads
  frontend-dev
  csp-headers
)

RULES_UNIVERSAL=(frontend-code)
RULES_GAMEDEV=()

AGENTS=(engineering)

PERMISSIONS_ALLOW=(
  "Bash(npm *)"
  "Bash(yarn *)"
  "Bash(pnpm *)"
)

PERMISSIONS_DENY=()
