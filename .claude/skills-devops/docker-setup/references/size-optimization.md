# Size Optimization - Docker

- Multi-stage: only copy built artifacts to runtime
- Alpine or distroless bases (5-25MB vs 200MB+)
- BuildKit cache mounts: `RUN --mount=type=cache,target=<path>`
- `.dockerignore` excludes: `.git`, `node_modules`, `coverage`, `tests/`, `*.md`
- For Go: `-ldflags="-w -s"` strips debug info
