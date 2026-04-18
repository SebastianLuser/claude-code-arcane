---
name: docker-setup
description: "Genera Dockerfiles + docker-compose para stacks de Educabot (Go, TypeScript backend, React+Vite, React Native). Multi-stage builds optimizados, dev + prod, con Postgres/Redis/etc. Usar para: dockerizar, docker, containerizar, docker-compose, contenedor."
argument-hint: "[stack: go|ts|react|rn] [--dev|--prod]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# docker-setup — Docker & Docker Compose Generator

Genera **Dockerfiles production-ready** y **docker-compose** para los stacks oficiales de Educabot: **Go**, **TypeScript backend (Fastify)**, **React+Vite frontend**.

## Cuándo usar

- Dockerizar un proyecto existente (Alizia, Tuni, Vigía, Tich)
- Arrancar stack local con múltiples servicios (app + DB + Redis)
- Preparar imágenes para CI/CD
- Ambiente reproducible para devs nuevos

## Principios

1. **Multi-stage builds** — build ≠ runtime. Imagen final liviana.
2. **Non-root user** — nunca correr como root en runtime
3. **Distroless o alpine** para runtime (imagen pequeña, menos surface attack)
4. **`.dockerignore`** bien armado (no mandar `node_modules` al build context)
5. **Layer caching** optimizado — copiar deps antes que código
6. **Healthchecks** en todos los servicios
7. **Secrets por env vars**, nunca hardcoded en Dockerfile

## Preguntas previas

1. **Stack del proyecto**: Go / TS (Fastify) / React+Vite / RN / monorepo
2. **Servicios externos**: Postgres / MySQL / Redis / Kafka / MinIO / otros
3. **Target**: solo dev local / prod también / ambos
4. **Registry destino**: GHCR / ECR / GCR / Docker Hub
5. **Deploy target**: K8s / ECS / Cloud Run / Railway / self-hosted

---

## 1. Go backend (estilo Alizia-BE)

### `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.7

# ─── Builder ─────────────────────────────────────────
FROM golang:1.23-alpine AS builder

WORKDIR /build

# Deps cache layer
COPY go.mod go.sum ./
RUN go mod download

# Source
COPY . .

# Build con flags de optimización
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s -X main.version=$(git rev-parse --short HEAD 2>/dev/null || echo dev)" \
    -o /app ./cmd/server

# ─── Runtime ─────────────────────────────────────────
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /

COPY --from=builder /app /app

# Distroless nonroot = UID 65532
USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/app"]
```

### `.dockerignore`

```
.git
.github
.vscode
*.md
Dockerfile*
docker-compose*
.env
.env.*
!.env.example
tmp/
vendor/
coverage.out
*.log
bin/
dist/
```

---

## 2. TypeScript backend (Fastify)

### `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.7

# ─── Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npx prisma generate && npm run build

# Prune devDeps
RUN npm prune --omit=dev

# ─── Runtime ─────────────────────────────────────────
FROM node:20-alpine AS runtime

# dumb-init para signal handling correcto
RUN apk add --no-cache dumb-init tini

WORKDIR /app

# Non-root user (node user ya existe en node:alpine)
COPY --chown=node:node --from=builder /build/node_modules ./node_modules
COPY --chown=node:node --from=builder /build/dist ./dist
COPY --chown=node:node --from=builder /build/package.json ./
COPY --chown=node:node --from=builder /build/prisma ./prisma

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/server.js"]
```

### `.dockerignore`

```
node_modules
npm-debug.log
.env
.env.*
!.env.example
.git
.github
.vscode
*.md
dist
coverage
.nyc_output
tests/
__tests__/
*.test.ts
Dockerfile*
docker-compose*
```

---

## 3. React + Vite frontend (estilo Alizia/Tuni)

### `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.7

# ─── Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Runtime ─────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Non-root nginx
RUN addgroup -g 1001 -S app && adduser -S -u 1001 -G app app

# Config custom
COPY nginx.conf /etc/nginx/nginx.conf

# Static files
COPY --from=builder --chown=app:app /build/dist /usr/share/nginx/html

# nginx pid en path writable por app user
RUN touch /var/run/nginx.pid && \
    chown -R app:app /var/run/nginx.pid /var/cache/nginx /etc/nginx/conf.d

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### `nginx.conf` (para SPA con client-side routing)

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events { worker_connections 1024; }

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

  server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Cache assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
      try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
  }
}
```

---

## 4. docker-compose.yml (full stack local dev)

Ejemplo para proyecto con **Go backend + React frontend + Postgres + Redis**:

```yaml
name: ${PROJECT_NAME:-myapp}

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-app}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-app}
      POSTGRES_DB: ${DB_NAME:-app}
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-app}"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: builder  # en dev usa builder para hot reload
    environment:
      DATABASE_URL: postgres://${DB_USER:-app}:${DB_PASSWORD:-app}@db:5432/${DB_NAME:-app}?sslmode=disable
      REDIS_URL: redis://redis:6379
      PORT: 8080
      ENV: development
    ports:
      - "8080:8080"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/build
    # Para Go: usar air para hot reload
    command: ["air", "-c", ".air.toml"]

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:8080
    ports:
      - "5173:8080"
    depends_on:
      - backend

volumes:
  db_data:
```

### `docker-compose.override.yml` (dev only)

Se aplica automáticamente en dev, no se commitea a prod:

```yaml
services:
  backend:
    volumes:
      - ./backend:/build
    environment:
      LOG_LEVEL: debug

  frontend:
    command: ["npm", "run", "dev", "--", "--host"]
```

---

## 5. Scripts utilitarios

### `Makefile`

```makefile
.PHONY: help up down logs rebuild clean shell

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

up: ## Levanta stack
	docker compose up -d

down: ## Baja stack
	docker compose down

logs: ## Logs de todos los servicios
	docker compose logs -f --tail=100

rebuild: ## Rebuild + up
	docker compose up -d --build

clean: ## Down + volumes
	docker compose down -v

shell-backend: ## Shell en backend
	docker compose exec backend sh

db-psql: ## Psql en DB
	docker compose exec db psql -U app -d app
```

---

## 6. Optimizaciones avanzadas

### BuildKit cache mounts
```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

### SBOM (Software Bill of Materials)
```bash
docker buildx build --sbom=true -t myapp:latest .
```

### Image scanning pre-push
```bash
docker scout cves myapp:latest
# o
trivy image myapp:latest
```

### Multi-arch builds (arm64 + amd64)
```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/educabot/myapp:latest --push .
```

---

## 7. Checklist de seguridad

- [ ] No `USER root` en runtime
- [ ] `.dockerignore` excluye secrets, `.env`, `.git`
- [ ] Image base pineada por digest (no `:latest`)
- [ ] Sin `COPY . .` antes de prune deps en node
- [ ] `HEALTHCHECK` configurado
- [ ] Image final escaneada (trivy/scout)
- [ ] Secrets como env vars o mount, nunca `ENV SECRET=xxx`
- [ ] Build reproducible (lockfiles committed)
- [ ] Labels estándar (OCI)

### Labels OCI recomendados
```dockerfile
LABEL org.opencontainers.image.source="https://github.com/educabot/myapp" \
      org.opencontainers.image.description="MyApp backend" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.version="${VERSION}"
```

---

## 8. Anti-patterns a evitar

- ❌ `FROM node` sin tag → build no reproducible
- ❌ `apt install` sin `--no-install-recommends` + cleanup
- ❌ Copiar `.env` al container
- ❌ Un solo stage → imagen de 2GB
- ❌ `CMD ["npm", "start"]` → dumb-init/tini ausente = signal issues
- ❌ Correr como root
- ❌ Build args con secrets (quedan en layers)
- ❌ `LATEST` en registry para prod

---

## Output final

```
✅ Dockerfile generado (multi-stage, non-root)
✅ .dockerignore optimizado
✅ docker-compose.yml con healthchecks
✅ docker-compose.override.yml para dev
✅ Makefile con shortcuts

Próximos pasos:
  cp .env.example .env
  make up
  make logs
  # App disponible en http://localhost:5173 (front) y :8080 (back)

Para producción:
  docker buildx build --platform linux/amd64 -t ghcr.io/educabot/<app>:$(git rev-parse --short HEAD) --push .
```

## Delegación

**Coordinar con:** `platform-lead`, `cloud-architect`, `sre-lead`
**Reporta a:** `cloud-architect`

**Skills relacionadas:**
- `/k8s-deploy` — manifests de Kubernetes
- `/ci-cd-setup` — GitHub Actions que builda estas imágenes
- `/terraform-init` — infra donde corren los containers
- `/deploy-check` — pre-deploy verification
