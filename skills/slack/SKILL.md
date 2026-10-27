---
name: slack
description: "Manage Slack via Web API: send messages, create channels, upload files, search history, webhooks."
category: "integrations"
argument-hint: "[send|channel|file|search] <args>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Slack Manager

Web API: `https://slack.com/api/`. Auth: `Bearer $SLACK_BOT_TOKEN`. Scopes: `chat:write`, `channels:read`, `users:read`, `files:write`. Simple webhooks (no bot): POST to `hooks.slack.com/services/...`.

## API Operations

| Operation | Method | Endpoint | Key fields |
|-----------|--------|----------|------------|
| Send message | POST | `/chat.postMessage` | channel (ID or #name), text, blocks (Block Kit) |
| Thread reply | POST | `/chat.postMessage` | + `thread_ts` of the parent message |
| Upload file | POST | `/files.upload` | channels, file (@path), title, initial_comment |
| Search messages | GET | `/search.messages` | query, count. Requires a user token (not bot) |
| Create channel | POST | `/conversations.create` | name, is_private |
| Invite users | POST | `/conversations.invite` | channel, users (comma-separated IDs) |
| Find user by email | GET | `/users.lookupByEmail` | email |

## Block Kit essentials

Header (`plain_text`), section (`mrkdwn`), divider, context (elements array), actions (buttons with URL). Compose visually in Block Kit Builder.

## Commands

| Command | What it does |
|---------|----------|
| `/slack send <channel> "msg"` | Simple message |
| `/slack release <version> [channels]` | Announcement: header, features, fixes, changelog link, deployer |
| `/slack incident <sev> <summary>` | SEV header + thread. SEV-1/2: create channel `#inc-{date}-{name}` |
| `/slack broadcast "msg" [#ch1 #ch2]` | Multi-channel |
| `/slack search "query" [--since 7d]` | Search + summarize |

## Rules

- **NEVER** `@channel` or `@here` without explicit authorization
- Rate limit: ~1 msg/s per channel, 50+ req/min API
- DMs via channel ID (`D...` type), not username
- Legacy tokens no longer exist — all are scoped bot tokens
- Interactive components (buttons, modals) require an HTTP server — out of scope
