---
paths:
  - "config/**"
  - "data/**"
  - "fixtures/**"
  - "seeds/**"
  - "**/*.json"
  - "**/*.yaml"
  - "**/*.yml"
  - "**/*.toml"
---

# Data & Config File Rules

- All JSON / YAML / TOML files must parse cleanly — malformed config blocks the build
- File naming: lowercase with hyphens or underscores, following `[domain]-[name].[ext]` pattern
- Every schema-bearing file must have a documented schema (JSON Schema, OpenAPI, Zod, Pydantic — whatever the stack uses)
- Numeric values with business meaning must include a comment or companion doc explaining unit and intent (`timeout_ms`, not bare `timeout`)
- Use consistent key naming within a file: camelCase for JSON, snake_case for YAML if that's the project convention — don't mix
- No orphaned entries — every record must be referenced by code, another config, or explicitly marked as a default/example
- Version config files when making breaking schema changes (`v1/`, `v2/` or explicit `schema_version` field)
- Include sensible defaults for all optional fields; required fields must be validated at load time
- Secrets NEVER committed — use env vars, secret managers, or `.env` files ignored by git

## Examples

**Correct** naming + schema-aware (`config/rate-limits.json`):

```json
{
  "$schema": "./schemas/rate-limits.schema.json",
  "api": {
    "default_requests_per_minute": 60,
    "burst_capacity": 120,
    "window_seconds": 60
  },
  "auth": {
    "login_attempts_per_hour": 10,
    "password_reset_per_day": 3
  }
}
```

**Incorrect** (`Config.json`):

```json
{
  "API": { "rpm": 60 }
}
```

Violations: uppercase filename, uppercase key, no schema reference, cryptic abbreviation (`rpm`), no unit in key name.

## Environment-Specific Config

- Never commit environment-specific values to a single file — use `.env.example` + per-env overrides
- Production configs must be reviewed via PR even if they live outside the main repo
- Local-dev overrides must be documented (`.env.example` with comments)
