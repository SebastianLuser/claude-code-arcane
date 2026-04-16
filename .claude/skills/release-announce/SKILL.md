---
name: release-announce
description: "Anunciar un release en múltiples canales: Slack + Discord + Email + ClickUp doc + Jira comment. Genera changelog consistente cross-plataforma. Usar cuando el usuario mencione: release, anunciar versión, changelog, deploy announcement, comunicar release, nueva versión."
---

# Release Announcement Broadcaster

Genera y distribuye un release announcement en múltiples plataformas simultáneamente.

## Flujo

### 1. Gather release data

```
/release-announce v2.1.0
```

Auto-gather:
- **Git log** desde tag anterior: `git log v2.0.0..v2.1.0 --pretty=format:"%h|%s|%an"`
- **Merged PRs** desde ese tag: `gh pr list --search "merged:>=$PREVIOUS_TAG" --state merged`
- **Closed tickets**: buscar en Jira/ClickUp tickets que mencionen el release label
- **Breaking changes**: grep commits por `BREAKING CHANGE`

### 2. Clasificar commits

| Prefix | Sección |
|--------|---------|
| `feat:`, `feature:` | ✨ Features |
| `fix:`, `bugfix:` | 🐛 Bug Fixes |
| `perf:` | ⚡ Performance |
| `refactor:` | 🔧 Refactoring |
| `docs:` | 📝 Documentation |
| `test:` | 🧪 Tests |
| `chore:`, `ci:`, `build:` | 🔨 Maintenance |
| `BREAKING CHANGE` | 💥 Breaking Changes |

### 3. Generar content per-platform

Core message consistente, adaptado a cada plataforma:

#### Slack (Block Kit)
```json
{
  "blocks": [
    {"type": "header", "text": {"type": "plain_text", "text": "🚀 Release v2.1.0"}},
    {"type": "section", "text": {"type": "mrkdwn", "text": "Deployed to production at 2026-04-12 14:30 ART"}},
    {"type": "divider"},
    {"type": "section", "text": {"type": "mrkdwn", "text": "*✨ Features*\n• Feature X\n• Feature Y"}},
    {"type": "section", "text": {"type": "mrkdwn", "text": "*🐛 Fixes*\n• Bug Z"}},
    {"type": "context", "elements": [{"type": "mrkdwn", "text": "Deployed by <@U123>"}]},
    {"type": "actions", "elements": [
      {"type": "button", "text": {"type": "plain_text", "text": "View changelog"}, "url": "..."},
      {"type": "button", "text": {"type": "plain_text", "text": "Release notes"}, "url": "..."}
    ]}
  ]
}
```

#### Discord (Embed)
```json
{
  "embeds": [{
    "title": "🚀 Release v2.1.0",
    "description": "Deployed to production at 2026-04-12 14:30 ART",
    "color": 5763719,
    "fields": [
      {"name": "✨ Features", "value": "• Feature X\n• Feature Y"},
      {"name": "🐛 Fixes", "value": "• Bug Z"},
      {"name": "📋 Full changelog", "value": "[Link](https://...)"}
    ],
    "footer": {"text": "Deployed by alice"}
  }]
}
```

#### Email (HTML)
```html
<h1>🚀 Release v2.1.0</h1>
<p>Deployed to production at 2026-04-12 14:30 ART</p>

<h2>✨ Features</h2>
<ul>
  <li>Feature X</li>
  <li>Feature Y</li>
</ul>

<h2>🐛 Fixes</h2>
<ul>
  <li>Bug Z</li>
</ul>

<p><a href="...">Full changelog</a></p>
```

#### ClickUp/Jira doc/comment
Markdown simple, mismo contenido que los otros, sin formatting específico de plataforma.

#### Public changelog (docs site)
Generar entry en `CHANGELOG.md`:
```markdown
## v2.1.0 — 2026-04-12

### ✨ Features
- Feature X ([#123](link))
- Feature Y ([#124](link))

### 🐛 Fixes
- Bug Z ([#125](link))
```

### 4. Preview + Confirmation

Mostrá al user preview de cada canal, pedí confirmación por plataforma:
```
¿Publicar en los siguientes canales?
[x] Slack #releases
[x] Discord release-notifications
[x] Email stakeholders@company.com
[x] ClickUp space doc
[ ] Jira project comment (no especificado)
[x] CHANGELOG.md commit

Confirmar? [y/n]
```

### 5. Distribute

Ejecutar en paralelo con error handling:
- Si uno falla, continuar con el resto
- Al final: report success/failures

## Config File

`.claude/config/release.yml`:
```yaml
version: auto  # auto-detect from latest tag
channels:
  slack:
    - channel: "#releases"
      template: "team"
    - channel: "#general"
      template: "public"
  discord:
    - webhook_url: "${DISCORD_WEBHOOK}"
  email:
    - to: "stakeholders@company.com"
      subject: "[Product] Release v{{version}}"
      template: "formal"
  clickup:
    - space_id: 90138713959
      create_doc: true
  changelog:
    path: "CHANGELOG.md"
    format: "keep-a-changelog"
```

## Comando

```
/release-announce [version] [--channels list]
```

Version: si no se pasa, detectar del tag más reciente.
Channels: override del config file.

## Reglas

- **NO publicar sin confirmación final** del user
- **Versionado semántico** obligatorio: vMAJOR.MINOR.PATCH
- **Breaking changes** siempre destacados al top
- **Links funcionando**: validar URLs antes de publicar
- **Idempotencia**: si se re-corre con misma version, detectar y preguntar si overwrite
- **Rollback plan**: anunciar cómo hacer rollback si aplica
