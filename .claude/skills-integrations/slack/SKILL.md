---
name: slack
description: "Manage Slack via Web API: send messages, create channels, upload files, search history, webhooks."
category: "integrations"
argument-hint: "[send|channel|file|search] <args>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Slack Manager

Web API: `https://slack.com/api/`. Auth: `Bearer $SLACK_BOT_TOKEN`. Scopes: `chat:write`, `channels:read`, `users:read`, `files:write`. Webhooks simples (sin bot): POST a `hooks.slack.com/services/...`.

## API Operations

| Operation | Method | Endpoint | Key fields |
|-----------|--------|----------|------------|
| Send message | POST | `/chat.postMessage` | channel (ID o #name), text, blocks (Block Kit) |
| Thread reply | POST | `/chat.postMessage` | + `thread_ts` del mensaje padre |
| Upload file | POST | `/files.upload` | channels, file (@path), title, initial_comment |
| Search messages | GET | `/search.messages` | query, count. Requiere user token (no bot) |
| Create channel | POST | `/conversations.create` | name, is_private |
| Invite users | POST | `/conversations.invite` | channel, users (comma-separated IDs) |
| Find user by email | GET | `/users.lookupByEmail` | email |

## Block Kit essentials

Header (`plain_text`), section (`mrkdwn`), divider, context (elements array), actions (buttons con URL). Compose visualmente en Block Kit Builder.

## Comandos

| Comando | Qué hace |
|---------|----------|
| `/slack send <channel> "msg"` | Mensaje simple |
| `/slack release <version> [channels]` | Announcement: header, features, fixes, changelog link, deployer |
| `/slack incident <sev> <summary>` | SEV header + thread. SEV-1/2: crear canal `#inc-{date}-{name}` |
| `/slack broadcast "msg" [#ch1 #ch2]` | Multi-channel |
| `/slack search "query" [--since 7d]` | Search + summarize |

## Reglas

- **NUNCA** `@channel` o `@here` sin autorización explícita
- Rate limit: ~1 msg/s por canal, 50+ req/min API
- DMs via channel ID (tipo `D...`), no username
- Legacy tokens no existen — todos bot tokens scoped
- Interactive components (buttons, modals) requieren servidor HTTP — fuera de scope
