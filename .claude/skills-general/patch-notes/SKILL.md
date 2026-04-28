---
name: patch-notes
description: "Generate player-facing patch notes from git history, sprint data, and internal changelogs. Translates developer language into clear, engaging player communication."
argument-hint: "[version] [--style brief|detailed|full]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Bash
model: haiku
agent: community-manager
---

## Phase 1: Parse Arguments

- `version`: release version (e.g., `1.2.0`). If missing, ask user.
- `--style`: `brief` (bullets), `detailed` (with context, default), `full` (+ developer commentary).

## Phase 2: Gather Change Data

Read: `production/releases/[version]/changelog.md`, `docs/CHANGELOG.md` entry, `git log` between tags (fallback), sprint retrospectives, balance change docs, QA bug fix records.

**No data found** → "Run `/changelog [version]` first." Verdict: **BLOCKED**.

### Tone & Template Detection

Check for tone/voice guidance in: `.claude/docs/technical-preferences.md`, `docs/PATCH-NOTES-STYLE.md`, `design/community/tone-guide.md`. Default: player-friendly, non-technical, enthusiastic not hyperbolic, focus on player experience.

Check for template at `docs/patch-notes-template.md` or `.claude/docs/templates/patch-notes-template.md`. If found → use as structure instead of built-in styles.

## Phase 3: Categorize and Translate

Categories: New Content, Gameplay Changes, Quality of Life, Bug Fixes (by system), Performance, Known Issues.

Translation: dev language → player language ("Refactored damage pipeline" → "Improved hit detection accuracy"). Remove purely internal changes. Preserve specific numbers for balance changes (50→45).

## Phase 4: Generate Patch Notes

- **Brief:** Title + bullet sections (New/Changes/Fixes/Known Issues)
- **Detailed:** Highlights summary + sections with context + balance table (change/before/after/reason)
- **Full:** Detailed + Developer Commentary (team voice, insight into major changes)

## Phase 5: Review

No internal jargon, no ticket/sprint references, balance with before/after, bug fixes describe player experience, tone matches game voice.

## Phase 6: Save

Present notes + change count by category + excluded internal changes. "May I write to `docs/patch-notes/[version].md`?" Also archive to `production/releases/[version]/patch-notes.md`.

## Phase 7: Next Steps

Verdict: **COMPLETE**. Run `/release-checklist` for other gates. Share draft with community-manager for tone review.
