---
name: release-announce
description: "Broadcast release announcement across Slack, Discord, Email, ClickUp, Jira with consistent changelog."
category: "operations"
argument-hint: "[version] [--channels slack,discord,email]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---
# Release Announcement Broadcaster

Generates and distributes a release announcement across multiple platforms at once.

## Flow

### 1. Gather release data

Auto-gather: git log between tags, merged PRs (`gh pr list`), closed tickets (Jira/ClickUp with a release label), breaking changes (grep `BREAKING CHANGE`).

### 2. Classify commits

| Prefix | Section |
|--------|---------|
| `feat:` | Features |
| `fix:` | Bug Fixes |
| `perf:` | Performance |
| `refactor:` | Refactoring |
| `docs:` | Documentation |
| `test:` | Tests |
| `chore:`, `ci:`, `build:` | Maintenance |
| `BREAKING CHANGE` | Breaking Changes |

### 3. Generate per platform

A consistent core message, adapted:
- **Slack:** Block Kit (header, mrkdwn sections, divider, context, action buttons)
- **Discord:** Embed JSON (title, description, fields, color, footer)
- **Email:** HTML (h1/h2/ul structure)
- **ClickUp/Jira:** Simple Markdown
- **CHANGELOG.md:** Keep-a-changelog format with PR links

### 4. Preview + Confirmation

Show a preview per channel, ask for confirmation per platform (checkboxes).

### 5. Distribute

Run in parallel with error handling. If one fails → continue with the rest → report successes/failures.

## Config

`.claude/config/release.yml`: channels (slack targets+templates, discord webhook, email recipients+subject, clickup space_id, changelog path+format).

## Command

`/release-announce [version] [--channels list]`. Without a version → detect it from the most recent tag. Channels override the config.

## Rules

- Do NOT publish without final confirmation
- Semver is mandatory: vMAJOR.MINOR.PATCH
- Breaking changes always at the top
- Validate URLs before publishing
- Idempotency: re-running the same version → ask whether to overwrite
- Rollback plan: mention it if applicable
