---
name: release-checklist
description: "Generates a comprehensive pre-release validation checklist covering build verification, certification requirements, store metadata, and launch readiness."
category: "operations"
argument-hint: "[platform: pc|console|mobile|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
---

> **Explicit invocation only**: Only run when user requests `/release-checklist`.

## Phase 1: Parse Arguments

Platform: `pc`, `console`, `mobile`, or `all` (default).

## Phase 2: Load Context

Read `CLAUDE.md` (project, version, platforms). Read current milestone from `production/milestones/`.

## Phase 3: Scan Codebase

Count TODO/FIXME/HACK comments with locations and severity. Check test results in output directories/CI logs.

## Phase 4: Generate Checklist

### Sections (all platforms)

**Codebase Health:** TODO/FIXME/HACK counts (list top blockers).

**Build Verification:** clean build all platforms, zero warnings, all assets loading, build size within budget, version number correct, reproducible from tagged commit.

**Quality Gates:** zero S1/S2 bugs (or documented exceptions), critical paths QA signed off, performance budgets (FPS, memory, load times, no leaks), no regressions, soak test 4+ hours.

**Content Complete:** no placeholder assets, all TODO/FIXME in content resolved, text proofread, localization-ready, audio mix finalized, credits complete.

### Platform-specific

**PC:** min/rec specs documented, KB+M controls, controller support (Xbox/PS/generic), resolution scaling (1080p-4K-ultrawide), windowed/borderless/fullscreen, graphics settings persist, Steam/Epic/GOG SDK, achievements, cloud saves, Steam Deck (if targeting).

**Console:** TRC/TCR/Lotcheck, platform controller prompts, suspend/resume, user switching, connectivity loss handling, storage full handling, parental controls, platform achievements, certification submission.

**Mobile:** App store guidelines, permissions justified, privacy policy, data safety labels, touch on multiple sizes, battery usage, background behavior, push notification permissions, IAP flow, app size limits.

### Store / Distribution (all)

Store metadata (descriptions, features, system reqs), screenshots per-platform, trailers, key art, age ratings (ESRB/PEGI), legal/EULA/privacy, license attributions, regional pricing.

### Launch Readiness

Analytics/telemetry verified, crash reporting configured, day-one patch (if needed), on-call 72h schedule, community announcements drafted, press/influencer keys, support team briefed, rollback plan documented.

### Go / No-Go

Rationale summary + blocking items + sign-offs required: QA Lead, Technical Director, Producer, Creative Director.

## Phase 5: Save

Present checklist + total items + known blockers. "May I write to `production/releases/release-checklist-[version].md`?"

## Phase 6: Next Steps

- `/gate-check` for formal phase gate verdict
- Coordinate sign-offs via `/team-release`
