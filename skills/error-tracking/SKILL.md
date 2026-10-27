---
name: error-tracking
description: "Error tracking and crash reporting for Educabot apps (Go/TS/React/RN) with Bugsnag: source maps, symbolication, release tracking, stability score, PII scrubbing, triage."
category: "observability"
argument-hint: "[setup|triage|release <version>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# error-tracking — Bugsnag Error Tracking

**Educabot default: Bugsnag.** One project per app (separate web/mobile/api). Target: >99.9% crash-free sessions.

## Platform Decision

| Tool | Strong at | When |
|------|-----------|--------|
| **Bugsnag** | Mobile stability, triage, symbolication | **Default** |
| Sentry | APM + errors + replay in one tool | If integrated APM is needed |
| Datadog Error Tracking | Integrated with APM/logs | If you already pay for the DD suite |

> → Read references/setup-per-stack.md for Go, Node/TS, React, React Native setup and release tracking

> → Read references/operational-details.md for user context, PII scrubbing, sampling, grouping, alerts, and triage workflow

> → Read references/anti-patterns-and-checklist.md for anti-patterns and implementation checklist
