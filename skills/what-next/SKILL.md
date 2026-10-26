---
name: what-next
description: "Analyzes what is done and the users query and offers advice on what to do next. Use if user says what should I do next or what do I do now or I'm stuck or I don't know what to do. Claude Code's native /help lists commands; this one suggests the next step."
category: "workflow"
argument-hint: "[optional: what you just finished, e.g. 'finished design-review' or 'stuck on ADRs']"
user-invocable: true
allowed-tools: Read, Glob, Grep
model: haiku
---

# Studio Help — What Do I Do Next?

## Live Project State

- Stage: !`cat production/stage.txt 2>/dev/null | tr -d '[:space:]' || echo 'not set'`
- Latest sprint: !`ls -t production/sprints/*.md 2>/dev/null | head -1 || echo 'none'`
- Session state: !`head -5 .arcane/session-state/active.md 2>/dev/null || echo 'none'`

Read-only skill — reports findings, writes no files. Lightweight orientation; for a formal readiness check use `/gate-check`.

## Step 1: List Installed Skills

Glob `.claude/skills/*/SKILL.md` and extract `name:` and `description:`. These are the commands you can recommend directly.

## Step 2: Determine Current Phase

1. **`production/stage.txt`** (authoritative): one of (Concept, Systems Design, Technical Setup, Pre-Production, Production, Polish, Release)
2. **If missing**, infer from artifacts (most-advanced wins): `src/` 10+ files → production, `production/stories/*.md` → pre-production, `docs/architecture/adr-*.md` → technical-setup, `design/gdd/systems-index.md` → systems-design, `design/gdd/game-concept.md` → concept, nothing → concept

## Step 3: Read Session Context

Read `.arcane/session-state/active.md` — what was most recently worked on, in-progress tasks, open questions.

## Step 4: Check Step Completion

A phase's steps are its exit criteria. If `.claude/skills/gate-check/SKILL.md` is installed, read its criteria for the transition out of the current phase; otherwise use the artifact ladder in Step 2. Per criterion:
- **Names a file or artifact:** Glob/Grep for it. Complete if it exists with real content, not just template headers.
- **Names nothing checkable:** mark MANUAL — ask user
- **Can't tell:** mark UNKNOWN

**Production phase special:** read `sprint-status.yaml` for per-story status (in-progress/ready-for-dev/done/blocked). YAML is authoritative over glob checks for implement/story-done steps.

**Repeatable steps outside production:** artifact check shows if *any* work done, not if finished.

## Step 5: Find Position

1. Last confirmed complete required step
2. Current blocker (first incomplete required step = what to do next)
3. Optional opportunities alongside blocker
4. Upcoming required steps ("coming up")

If user gave argument (e.g. "just finished design-review"), advance past that step.

## Step 6: Check In-Progress Work

If `active.md` shows active task → surface prominently, suggest continuing or confirming done.

## Step 7: Present Output

Skills you suggest that ship with other profiles may not be installed: check `.claude/skills/<name>/` first, and if it is missing offer `/arcane-add <name>` instead of running it.

Short and direct. Format: phase label, in-progress work, done steps (✓), next required step (→, only one), optional steps (~), coming up after. Commands as backtick code. MANUAL steps → ask user. Gate approach → mention `/gate-check`.

## Step 8: Gate Warning

All required steps complete → "Close to [Current]→[Next] gate. Run `/gate-check`." Multiple remaining → skip warning.

## Step 9: Escalation (only if user seems stuck)

- `/gate-check` — formal readiness check
- `/start` — re-orient from scratch

## Protocol

- Never auto-run next skill — recommend, let user invoke
- Ask about MANUAL steps
- Match user's tone — stressed → one reassuring action, not a list
- One primary recommendation — optional steps are secondary context

Verdict: **COMPLETE** — next steps identified.
