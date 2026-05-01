#!/usr/bin/env bash
# Profile: backend-ts
# Description: Backend TypeScript — Fastify, Prisma, Zod, API design
# Type: base

DESCRIPTION="Backend TypeScript — Fastify, Prisma, Zod, API design, CI"

SKILLS=(
  testing
  deps-audit
  env-sync
  observability
  scaffold-fastify-ts
  database
  api-design
  api-docs
  api-versioning
  auth-strategy
  jwt-strategy
  mfa-setup
  oauth-setup
  rbac-abac
  performance
  async-ops
  audit-log
  monorepo-setup
  data-migrations
  caching-strategy
  webhooks
  rate-limiting
  websocket-realtime-rooms
  search-setup
  ci-cd-setup
)

RULES_UNIVERSAL=(backend-code api-code migration-code)
RULES_GAMEDEV=()

AGENTS=(engineering)

PERMISSIONS_ALLOW=(
  "Bash(npm *)"
  "Bash(yarn *)"
  "Bash(pnpm *)"
  "Bash(docker ps*)"
  "Bash(docker images*)"
)

PERMISSIONS_DENY=()
