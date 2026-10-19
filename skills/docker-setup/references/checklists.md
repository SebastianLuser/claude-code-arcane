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

## Runtime Hardening

The image is half of it; how the container runs is the other half.

```yaml
# docker-compose.yml (prod-like)
services:
  api:
    read_only: true            # root filesystem read-only
    tmpfs: [/tmp]              # writable scratch space only where needed
    cap_drop: [ALL]            # add back only what is used, e.g. NET_BIND_SERVICE
    security_opt: [no-new-privileges:true]
    user: "1001:1001"
    mem_limit: 512m
    pids_limit: 200
```

- [ ] Read-only root filesystem, with `tmpfs` or a volume only for paths the app writes
- [ ] `cap_drop: [ALL]`; no `privileged: true`; no Docker socket mounted into app containers
- [ ] `no-new-privileges` so setuid binaries cannot escalate
- [ ] Memory and PID limits on every service
- [ ] Production images pinned by digest (`image@sha256:...`), and signed and verified (`cosign`) when the registry supports it
- [ ] Managed platforms: set the equivalents where they exist (ECS task definition `readonlyRootFilesystem` and `linuxParameters.capabilities.drop`; Cloud Run already runs containers in a sandbox and does not expose capabilities)

## Health Check Patterns

| Service | Check |
|---------|-------|
| HTTP backend | `wget --spider http://localhost:<port>/health` |
| PostgreSQL | `pg_isready -U <user>` |
| Redis | `redis-cli ping` |
| Nginx/static | `wget --spider http://localhost:<port>` |
