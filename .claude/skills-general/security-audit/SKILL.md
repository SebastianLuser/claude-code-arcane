---
name: security-audit
description: "Audit the game for security vulnerabilities: save tampering, cheat vectors, network exploits, data exposure, and input validation gaps. Produces a prioritised security report with remediation guidance. Run before any public release or multiplayer launch."
argument-hint: "[full | network | save | input | quick]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Task
agent: security-engineer
---

# Security Audit

Systematically audits codebase for common game security failures and produces prioritised remediation plan.

**Run:** before public release (required for Polish→Release gate), before multiplayer features, after disk/network read systems, when security bug reported.

Output: `production/security/security-audit-[date].md`

## Phase 1: Parse Scope

| Mode | Scope |
|------|-------|
| `full` | All categories (recommended pre-release) |
| `network` | Network/multiplayer only |
| `save` | Save files and serialization |
| `input` | Input validation and injection |
| `quick` | High-severity checks only (fastest) |
| No arg | `full` |

Read `.claude/docs/technical-preferences.md` for engine, language, platforms, multiplayer scope.

## Phase 2: Spawn Security Engineer

Spawn `security-engineer` via Task with: audit mode, engine/language, manifest of source directories. Collect full findings.

## Phase 3: Audit Categories

| Category | Key Checks |
|----------|-----------|
| **Save/Serialization** | Validation before loading, path traversal, checksums/signing, bounds checking, no eval() near load |
| **Network/Multiplayer** | Server-authoritative state, packet validation (size/type/range), server-side position validation, rate limiting, no debug endpoints in release |
| **Input Validation** | Strings in file paths (traversal), log injection, numeric bounds checking, achievement validation |
| **Data Exposure** | Hardcoded secrets in src/assets, debug symbols in release, sensitive logging, internal paths exposed |
| **Cheat/Anti-Tamper** | Critical values not in editable files, progression flags server-validated, leaderboard validation. Client-side anti-cheat unenforceable — focus server-side |
| **Dependencies** | Third-party plugins listed, known CVEs checked, sources verified |

Skip categories not applicable. Grep for relevant patterns per category.

## Phase 4: Classify Findings

| Severity | Definition |
|----------|-----------|
| **CRITICAL** | RCE, data breach, trivially-exploitable multiplayer cheat |
| **HIGH** | Save tampering bypassing progression, credential exposure, authority bypass |
| **MEDIUM** | Client-side cheat enablement, info disclosure, limited-impact input gap |
| **LOW** | Defence-in-depth hardening, no direct exploit |

Status: Open / Accepted Risk / Out of Scope.

## Phase 5: Generate Report

Executive summary (severity counts + release recommendation: CLEAR TO SHIP / FIX CRITICALS / DO NOT SHIP). Per finding: ID, category, file+line, description, attack scenario, remediation, effort. Dependency inventory (plugin/version/source/CVEs). Prioritised remediation order.

## Phase 6: Write Report

Present summary + CRITICAL/HIGH in conversation. "May I write full report to `production/security/security-audit-[date].md`?" Write after approval.

## Phase 7: Gate Integration

Required for **Polish → Release gate**. After remediation: `/security-audit quick` to confirm. CRITICAL exists → "Must resolve before release." No CRITICAL/HIGH → "Clear for `/gate-check release`."

## Protocol

- Never assume a pattern is safe — flag and let user decide
- Accepted risk is valid for LOW findings — document the decision
- Multiplayer context: treat HIGH as CRITICAL
- This is not a pentest — covers common patterns; recommend human security professional for competitive/monetised multiplayer
