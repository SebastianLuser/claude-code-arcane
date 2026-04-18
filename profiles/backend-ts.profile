#!/usr/bin/env bash
# Profile: backend-ts
# Description: Backend TypeScript — Fastify, Prisma, Zod, API design
# Type: base

DESCRIPTION="Backend TypeScript — Fastify, Prisma, Zod, API design, CI"

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
  scaffold-fastify-ts
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
  monorepo-setup
  ci-cd-setup
)

SKILLS_AGILE=()
SKILLS_DESIGN=()

RULES_UNIVERSAL=(backend-code api-code migration-code)
RULES_GAMEDEV=()

AGENTS=()

PERMISSIONS_ALLOW=(
  "Bash(npm *)"
  "Bash(yarn *)"
  "Bash(pnpm *)"
  "Bash(docker ps*)"
  "Bash(docker images*)"
)

PERMISSIONS_DENY=()
