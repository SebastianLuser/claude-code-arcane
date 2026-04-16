---
name: slack
description: "Gestionar Slack: enviar mensajes, crear canales, subir archivos, buscar history via Slack Web API. Usar cuando el usuario mencione: Slack, enviar mensaje, canal de Slack, DM, webhook Slack, notificar equipo en Slack."
---

# Slack Manager

Web API: `https://slack.com/api/`

## Auth

```bash
export SLACK_BOT_TOKEN="xoxb-..."
curl -X POST "https://slack.com/api/..." \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

Scopes típicos: `chat:write`, `channels:read`, `users:read`, `files:write`

Para webhooks simples (sin bot):
```bash
curl -X POST https://hooks.slack.com/services/T00/B00/XXX \
  -d '{"text": "Hello"}'
```

## Operaciones Clave

### Enviar mensaje
```bash
POST /chat.postMessage
{
  "channel": "C0123456",  // ID o nombre con # 
  "text": "Fallback text",
  "blocks": [...]  // Block Kit
}
```

### Block Kit (mensajes ricos)
```json
{
  "channel": "#releases",
  "blocks": [
    {
      "type": "header",
      "text": {"type": "plain_text", "text": "🚀 Release v2.1"}
    },
    {
      "type": "section",
      "text": {"type": "mrkdwn", "text": "*Highlights:*\n• Feature X\n• Fix Y"}
    },
    {
      "type": "divider"
    },
    {
      "type": "context",
      "elements": [{"type": "mrkdwn", "text": "Deployed by <@U123> at 14:30"}]
    },
    {
      "type": "actions",
      "elements": [
        {"type": "button", "text": {"type": "plain_text", "text": "View changelog"}, "url": "..."}
      ]
    }
  ]
}
```

### Thread reply
```bash
POST /chat.postMessage
{
  "channel": "...",
  "thread_ts": "1234567890.123456",  // ts del mensaje padre
  "text": "..."
}
```

### Upload archivo
```bash
POST /files.upload
# multipart form
channels=C0123
file=@./file.png
title=Screenshot
initial_comment=Here's the screenshot
```

### Buscar mensajes
```bash
GET /search.messages?query=deployment&count=10
```
Requiere user token (no bot).

### Crear canal
```bash
POST /conversations.create
{
  "name": "proj-alpha-2026",
  "is_private": false
}
```

### Invitar users
```bash
POST /conversations.invite
{
  "channel": "C123",
  "users": "U1,U2,U3"
}
```

### Find user by email
```bash
GET /users.lookupByEmail?email=user@company.com
```

## Comandos

### Enviar mensaje simple
```
/slack send <channel> "mensaje"
```

### Release announcement
```
/slack release <version> [channels]
```

Template:
```markdown
🚀 *Release v{{version}}* deployed to production

✨ *Features*
• Feature A
• Feature B

🐛 *Fixes*
• Bug X

📋 Full changelog: {{url}}
🧑‍💻 Deployed by: {{user}}
```

### Incident notification
```
/slack incident <sev> <summary>
```

Flujo:
1. Post mensaje con header `[SEV-{n}] {summary}`
2. Crear thread para updates
3. Opcional: crear canal `#inc-{date}-{shortname}` si SEV-1/2

### Broadcast a múltiples canales
```
/slack broadcast "mensaje" [#ch1 #ch2 #ch3]
```

### Search + summarize
```
/slack search "query" [--since 7d]
```
Busca y resume los N mensajes más relevantes.

## Block Kit Templates Útiles

### Alert
```json
{"type": "section", "text": {"type": "mrkdwn", "text": ":warning: *Alert:* Something happened"}}
```

### Progress bar
```
[████████░░] 80%
```
(Con emoji `:blockA:` custom o text).

### Poll/Vote
Usar app tipo Polly, o emojis en mensaje:
"Vote: 👍 for option A, 👎 for B"

## Reglas

- **NUNCA** `@channel` o `@here` sin autorización explícita del user
- **Rate limit**: ~1 msg/s por canal. Web API: 50+ req/min en general.
- **DMs via channel ID** (tipo `D...`), no via username
- **Legacy tokens no existen más** — todos bot tokens scoped
- **Interactive components** (buttons, modals) requieren servidor HTTP para responder — fuera de scope
- **Socket Mode** para eventos real-time — requiere setup adicional
