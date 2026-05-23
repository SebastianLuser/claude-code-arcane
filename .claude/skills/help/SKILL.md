---
name: help
description: "Analyzes what is done and the users query and offers advice on what to do next. Use if user says what should I do next or what do I do now or I'm stuck or I don't know what to do"
category: "workflow"
argument-hint: "[optional: what you just finished, e.g. 'finished design-review' or 'stuck on ADRs']"
user-invocable: true
allowed-tools: Read, Glob, Grep
context: |
  !echo "=== Live Project State ===" && echo "Stage: $(cat production/stage.txt 2>/dev/null | tr -d '[:space:]' || echo 'not set')" && echo "Latest sprint: $(ls -t production/sprints/*.md 2>/dev/null | head -1 || echo 'none')" && echo "Session state: $(head -5 production/session-state/active.md 2>/dev/null || echo 'none')"
model: haiku
---

# Studio Help — What Do I Do Next?

Read-only skill — reports findings, writes no files. Lightweight orientation; for full gap analysis use `/project-stage-detect`.

## Step 1: Read Catalog + Find Uncataloged Skills

Read `.claude/docs/workflow-catalog.yaml` (authoritative phases/steps). Glob `.claude/skills/*/SKILL.md`, extract `name:` fields. Skills not appearing as catalog commands → **uncataloged** (usable but not phase-gated). Show up to 10 most relevant as footer block.

## Step 2: Determine Current Phase

1. **`production/stage.txt`** (authoritative): map to catalog phase key (Concept→concept, Systems Design→systems-design, Technical Setup→technical-setup, Pre-Production→pre-production, Production→production, Polish→polish, Release→release)
2. **If missing**, infer from artifacts (most-advanced wins): `src/` 10+ files → production, `production/stories/*.md` → pre-production, `docs/architecture/adr-*.md` → technical-setup, `design/gdd/systems-index.md` → systems-design, `design/gdd/game-concept.md` → concept, nothing → concept

## Step 3: Read Session Context

Read `production/session-state/active.md` — what was most recently worked on, in-progress tasks, open questions.

## Step 4: Check Step Completion

Per step in current phase from catalog:
- **Artifact-based:** Glob for `artifact.glob`, check `min_count`, Grep for `artifact.pattern`. Complete if met.
- **`artifact.note` (no glob):** mark MANUAL — ask user
- **No artifact field:** mark UNKNOWN

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

Short and direct. Format: phase label, in-progress work, done steps (✓), next required step (→, only one), optional steps (~), coming up after. Commands as backtick code. MANUAL steps → ask user. Gate approach → mention `/gate-check`.

## Step 8: Gate Warning

All required steps complete → "Close to [Current]→[Next] gate. Run `/gate-check`." Multiple remaining → skip warning.

## Step 9: Escalation (only if user seems stuck)

- `/project-stage-detect` — full gap analysis
- `/gate-check` — formal readiness check
- `/start` — re-orient from scratch

## Protocol

- Never auto-run next skill — recommend, let user invoke
- Ask about MANUAL steps
- Match user's tone — stressed → one reassuring action, not a list
- One primary recommendation — optional steps are secondary context

Verdict: **COMPLETE** — next steps identified.
