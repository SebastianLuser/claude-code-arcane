# Checklists - Docker Setup

## Dockerfile Best Practices Checklist

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

## Security Checklist

- [ ] No `USER root` in runtime
- [ ] `.dockerignore` excludes `.env`, `.git`, secrets
- [ ] Base image pinned by tag (consider digest for prod)
- [ ] No `COPY . .` before dependency prune in Node
- [ ] Image scanned pre-push (trivy / docker scout)
- [ ] Secrets never in ENV instruction or build args (they persist in layers)
- [ ] Lockfiles committed for reproducible builds
- [ ] No `apt install` without `--no-install-recommends` + layer cleanup

## Health Check Patterns

| Service | Check |
|---------|-------|
| HTTP backend | `wget --spider http://localhost:<port>/health` |
| PostgreSQL | `pg_isready -U <user>` |
| Redis | `redis-cli ping` |
| Nginx/static | `wget --spider http://localhost:<port>` |
