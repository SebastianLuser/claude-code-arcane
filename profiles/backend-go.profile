#!/usr/bin/env bash
# Profile: backend-go
# Description: Backend Go — Clean Arch, DB, auth, API design
# Type: base

DESCRIPTION="Backend Go — scaffold, DB, auth, API design, CI"

SKILLS_GENERAL=(
  tdd
  test-setup
  deps-audit
  security-audit
  env-sync
  error-tracking
  logging-setup
  observability-setup
)

SKILLS_GAMEDEV=()

SKILLS_SOFTWARE=(
  scaffold-go
  go-clean-architecture
  database-indexing
  db-diagram
  data-migrations
  run-migrations
  local-database-setup
  query-optimization
  data-seeding
  api-design
  api-docs
  api-versioning
  oauth-setup
  jwt-strategy
  rate-limiting
  rbac-abac
  caching-strategy
  webhooks
  job-scheduling
  audit-log
  ci-cd-setup
)

SKILLS_AGILE=()
SKILLS_DESIGN=()

RULES_UNIVERSAL=(backend-code api-code migration-code)
RULES_GAMEDEV=()

AGENTS=()

PERMISSIONS_ALLOW=(
  "Bash(go *)"
  "Bash(docker ps*)"
  "Bash(docker images*)"
)

PERMISSIONS_DENY=()
