---
name: error-tracking
description: "Error tracking y crash reporting para apps Educabot (Go/TS/React/RN) con Bugsnag: source maps, symbolication, release tracking, stability score, PII scrubbing, triage."
category: "observability"
argument-hint: "[setup|triage|release <version>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# error-tracking — Bugsnag Error Tracking

**Default Educabot: Bugsnag.** Un project por app (separar web/mobile/api). Target: >99.9% crash-free sessions.

## Platform Decision

| Tool | Fuerte en | Cuando |
|------|-----------|--------|
| **Bugsnag** | Mobile stability, triage, symbolication | **Default** |
| Sentry | APM + errors + replay en una tool | Si se necesita APM integrado |
| Datadog Error Tracking | Integrado con APM/logs | Si ya pagan DD suite |

> → Read references/setup-per-stack.md for Go, Node/TS, React, React Native setup and release tracking

> → Read references/operational-details.md for user context, PII scrubbing, sampling, grouping, alertas, and triage workflow

> → Read references/anti-patterns-and-checklist.md for anti-patterns and implementation checklist
