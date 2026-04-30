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
  auth-strategy
  performance
  async-ops
  audit-log
  monorepo-setup
  ci-cd-setup
)

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
