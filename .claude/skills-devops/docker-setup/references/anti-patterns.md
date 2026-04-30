# Anti-patterns - Docker Setup

- `FROM node` / `FROM golang` without tag — non-reproducible build
- Single stage build — 2GB+ images with build tools in prod
- Copying `.env` into container — secrets leak in image layers
- `CMD ["npm", "start"]` without signal handler (tini/dumb-init) — signal issues
- Running as root in production
- Build args containing secrets — persisted in layer history
- `:latest` tag in production registry — no rollback traceability
- No `.dockerignore` — huge build context, slow builds, accidental secret inclusion
