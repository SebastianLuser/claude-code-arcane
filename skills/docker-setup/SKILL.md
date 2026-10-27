---
name: docker-setup
description: "Docker setup: Dockerfile best practices, multi-stage, compose, security, size optimization."
category: "infrastructure"
argument-hint: "[stack: go|ts|react] [--dev|--prod]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# docker-setup — Docker & Compose Setup

## Quick Start Checklist — Full setup from scratch

- [ ] `.dockerignore` created before any `COPY` (excludes `.git`, `node_modules`, `.env`, `coverage`, `*.md`)
- [ ] Multi-stage Dockerfile: `builder` stage separate from the `runtime` stage
- [ ] Base image with a pinned tag, never `:latest` (e.g. `golang:1.22-alpine`, `node:20-alpine`)
- [ ] Dependencies copied and installed BEFORE the source code (layer cache)
- [ ] Runtime stage uses a minimal image: `distroless` (Go) or `node:20-alpine` (TS) or `nginx:alpine` (React)
- [ ] `USER nonroot` or a non-root user in the runtime stage
- [ ] `HEALTHCHECK` present on every service
- [ ] Signal handler: `tini`/`dumb-init` on Node (native in Go); `CMD` in exec form
- [ ] `docker-compose.yml` with `depends_on: condition: service_healthy`
- [ ] `docker-compose.override.yml` for dev-only settings (volumes, ports) — not committed to prod
- [ ] Secrets never in `ENV` or build args — only via runtime env vars or mounts
- [ ] `trivy image` or `docker scout` in CI before pushing to the registry
- [ ] Hardened runtime: `read_only`, `cap_drop: [ALL]`, `no-new-privileges`, memory and PID limits (see `references/checklists.md`)

---

Generate production-ready Dockerfiles and docker-compose for Go, TypeScript, and React stacks.

## Principles

1. **Multi-stage builds** — build != runtime. Final image is lean.
2. **Non-root user** — never run as root in runtime stage
3. **Minimal base** — distroless or alpine for runtime
4. **.dockerignore** — exclude node_modules, .env, .git from build context
5. **Layer caching** — copy dependency files before source code
6. **Health checks** on all services
7. **Secrets via env vars / mounts** — never in Dockerfile or image layers

## Discovery questions

1. Stack: Go / TS (Fastify/Express) / React+Vite / monorepo
2. External services: Postgres / Redis / Kafka / others
3. Target: dev local only / prod only / both
4. Registry: GHCR / ECR / GCR
5. Deploy target: K8s / ECS / Cloud Run

## Base image selection

| Stack | Build stage | Runtime stage |
|-------|-------------|---------------|
| **Go** | `golang:<version>-alpine` | `gcr.io/distroless/static-debian12:nonroot` |
| **Node/TS** | `node:<version>-alpine` | `node:<version>-alpine` + dumb-init/tini |
| **React (static)** | `node:<version>-alpine` | `nginx:<version>-alpine` |

## Dockerfile best practices checklist

> → Read references/checklists.md for Dockerfile best practices (10 items), security checklist (8 items), runtime hardening, and health check patterns

## Compose decisions

| Concern | Dev | Prod |
|---------|-----|------|
| Build target | builder stage (for hot reload) | runtime stage |
| Volumes | Source mounted for live reload | None (baked in) |
| Env vars | `.env` file, LOG_LEVEL=debug | Injected by orchestrator |
| Ports | Exposed to host | Internal only (behind LB) |
| Depends_on | `condition: service_healthy` | Managed by orchestrator |

Use `docker-compose.override.yml` for dev-only settings (auto-applied, not committed to prod).

> → Read references/compose-and-debugging.md for multiple compose files and `config`, profiles, watch mode, multi-platform builds, and a debugging table (exit codes, healthchecks, networking, volumes, disk)

## Size optimization

> → Read references/size-optimization.md for image size reduction techniques

## Anti-patterns

> → Read references/anti-patterns.md for 8 common Docker anti-patterns
