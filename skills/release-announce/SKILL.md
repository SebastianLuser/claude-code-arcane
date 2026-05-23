---
name: release-announce
description: "Broadcast release announcement across Slack, Discord, Email, ClickUp, Jira with consistent changelog."
category: "operations"
argument-hint: "[version] [--channels slack,discord,email]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---
# Release Announcement Broadcaster

Genera y distribuye release announcement en múltiples plataformas simultáneamente.

## Flujo

### 1. Gather release data

Auto-gather: git log entre tags, merged PRs (`gh pr list`), closed tickets (Jira/ClickUp con release label), breaking changes (grep `BREAKING CHANGE`).

### 2. Clasificar commits

| Prefix | Sección |
|--------|---------|
| `feat:` | Features |
| `fix:` | Bug Fixes |
| `perf:` | Performance |
| `refactor:` | Refactoring |
| `docs:` | Documentation |
| `test:` | Tests |
| `chore:`, `ci:`, `build:` | Maintenance |
| `BREAKING CHANGE` | Breaking Changes |

### 3. Generar per-platform

Core message consistente, adaptado:
- **Slack:** Block Kit (header, sections mrkdwn, divider, context, action buttons)
- **Discord:** Embed JSON (title, description, fields, color, footer)
- **Email:** HTML (h1/h2/ul structure)
- **ClickUp/Jira:** Markdown simple
- **CHANGELOG.md:** Keep-a-changelog format con PR links

### 4. Preview + Confirmation

Mostrar preview por canal, pedir confirmación por plataforma (checkboxes).

### 5. Distribute

Ejecutar en paralelo con error handling. Si uno falla → continuar con resto → report success/failures.

## Config

`.claude/config/release.yml`: channels (slack targets+templates, discord webhook, email recipients+subject, clickup space_id, changelog path+format).

## Comando

`/release-announce [version] [--channels list]`. Sin version → detectar del tag más reciente. Channels overridea config.

## Reglas

- NO publicar sin confirmación final
- Semver obligatorio: vMAJOR.MINOR.PATCH
- Breaking changes siempre al top
- Validar URLs antes de publicar
- Idempotencia: re-run misma version → preguntar overwrite
- Rollback plan: mencionar si aplica
