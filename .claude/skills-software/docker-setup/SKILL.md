---
name: docker-setup
description: "Docker setup guide: Dockerfile best practices, image selection, compose, security, size optimization"
argument-hint: "[stack: go|ts|react] [--dev|--prod]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# docker-setup — Docker & Compose Setup

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

- [ ] Multi-stage: separate builder from runtime
- [ ] Copy lockfiles first, install deps, then copy source (cache optimization)
- [ ] Pin base image tags (never bare `:latest`)
- [ ] Non-root USER in runtime stage
- [ ] HEALTHCHECK instruction present
- [ ] Signal handler: tini/dumb-init for Node (Go handles signals natively)
- [ ] `CGO_ENABLED=0` for Go static binaries
- [ ] `npm ci --ignore-scripts` then `npm prune --omit=dev` for Node
- [ ] Build args for env-specific values (e.g., VITE_API_URL)
- [ ] OCI labels for image metadata

## Compose decisions

| Concern | Dev | Prod |
|---------|-----|------|
| Build target | builder stage (for hot reload) | runtime stage |
| Volumes | Source mounted for live reload | None (baked in) |
| Env vars | `.env` file, LOG_LEVEL=debug | Injected by orchestrator |
| Ports | Exposed to host | Internal only (behind LB) |
| Depends_on | `condition: service_healthy` | Managed by orchestrator |

Use `docker-compose.override.yml` for dev-only settings (auto-applied, not committed to prod).

## Health check patterns

| Service | Check |
|---------|-------|
| HTTP backend | `wget --spider http://localhost:<port>/health` |
| PostgreSQL | `pg_isready -U <user>` |
| Redis | `redis-cli ping` |
| Nginx/static | `wget --spider http://localhost:<port>` |

## Size optimization

- Multi-stage: only copy built artifacts to runtime
- Alpine or distroless bases (5-25MB vs 200MB+)
- BuildKit cache mounts: `RUN --mount=type=cache,target=<path>`
- `.dockerignore` excludes: `.git`, `node_modules`, `coverage`, `tests/`, `*.md`
- For Go: `-ldflags="-w -s"` strips debug info

## Security checklist

- [ ] No `USER root` in runtime
- [ ] `.dockerignore` excludes `.env`, `.git`, secrets
- [ ] Base image pinned by tag (consider digest for prod)
- [ ] No `COPY . .` before dependency prune in Node
- [ ] Image scanned pre-push (trivy / docker scout)
- [ ] Secrets never in ENV instruction or build args (they persist in layers)
- [ ] Lockfiles committed for reproducible builds
- [ ] No `apt install` without `--no-install-recommends` + layer cleanup

## Anti-patterns

- `FROM node` / `FROM golang` without tag — non-reproducible build
- Single stage build — 2GB+ images with build tools in prod
- Copying `.env` into container — secrets leak in image layers
- `CMD ["npm", "start"]` without signal handler (tini/dumb-init) — signal issues
- Running as root in production
- Build args containing secrets — persisted in layer history
- `:latest` tag in production registry — no rollback traceability
- No `.dockerignore` — huge build context, slow builds, accidental secret inclusion
