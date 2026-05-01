#!/usr/bin/env bash
# Profile: backend-go
# Description: Backend Go — Clean Arch, DB, auth, API design
# Type: base

DESCRIPTION="Backend Go — scaffold, DB, auth, API design, CI"

SKILLS=(
  test-setup
  deps-audit
  security-audit
  env-sync
  observability
  scaffold-go
  go-clean-architecture
  database-setup
  data-operations
  data-migrations
  api-design
  api-docs
  auth-strategy
  jwt-strategy
  mfa-setup
  oauth-setup
  rbac-abac
  rate-limiting
  caching-strategy
  webhooks
  job-scheduling
  audit-log
  slo-sli
  ci-cd-setup
)

RULES_UNIVERSAL=(backend-code api-code migration-code)
RULES_GAMEDEV=()

AGENTS=(engineering)

PERMISSIONS_ALLOW=(
  "Bash(go *)"
  "Bash(docker ps*)"
  "Bash(docker images*)"
)

PERMISSIONS_DENY=()
