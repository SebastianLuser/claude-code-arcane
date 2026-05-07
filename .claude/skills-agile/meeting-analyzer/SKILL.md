---
name: meeting-analyzer
description: "Analyzes meeting transcripts to surface behavioral patterns, communication anti-patterns, and actionable coaching feedback on speaking dynamics, conflict, and facilitation."
category: "agile"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Meeting Insights Analyzer

Transform meeting transcripts into concrete, evidence-backed feedback on communication patterns, leadership behaviors, and interpersonal dynamics.

## Core Workflow

### 1. Ingest & Inventory

Scan the target directory for transcript files (`.txt`, `.md`, `.vtt`, `.srt`, `.docx`, `.json`).

For each file:
- Extract meeting date from filename or content (expect `YYYY-MM-DD` prefix or embedded timestamps)
- Identify speaker labels (patterns: `Speaker 1:`, `[John]:`, VTT/SRT cue formatting)
- Detect the user's identity: ask if ambiguous, otherwise infer from most frequent speaker
- Log: filename, date, duration, participant count, word count

Print a brief inventory table so the user confirms scope before heavy analysis begins.

### 2. Normalize Transcripts

Normalize into common internal structure: `{ speaker, timestamp_sec, text }[]`

- **VTT/SRT**: Parse cue timestamps + text. Speaker labels may be inline or prefixed.
- **Plain text**: Look for `Name:` or `[Name]` prefixes. Warn if no speaker labels.
- **Markdown**: Strip formatting, treat as plain text.
- **DOCX/JSON**: Extract text content, treat accordingly.

If timestamps are missing, skip timing-dependent metrics but run text-based analysis.

### 3. Analyze

Run all applicable modules below. Each is independent -- skip any that don't apply.

> See references/analysis-modules.md for detailed module specifications.

#### Module: Speaking Dynamics
Per-speaker: word count %, turn count, average turn length, longest monologue, interruption detection. Red flags: >60% speaking in 1:many meeting, <15% when facilitating, one participant never speaks, interruption ratio >2:1.

#### Module: Conflict & Directness
Scan for hedging language (qualifiers, permission-seeking, deflection, softeners) and conflict avoidance patterns (topic changes after tension, agreement-without-commitment). For each instance: full quote with context, severity tag (low/medium/high), rewrite suggestion.

#### Module: Filler Words & Verbal Habits
Count: "um", "uh", "like" (non-comparative), "you know", "actually", "basically", etc. Report rate per 100 words. Only flag if rate exceeds ~3 per 100 words.

#### Module: Question Quality & Listening
Classify questions: closed, leading, open genuine, clarifying, building. Good listening: clarifying/building questions, paraphrasing, referencing prior points, asking quieter participants.

#### Module: Facilitation & Decision-Making
Only when user is facilitator. Evaluate: agenda adherence, time management, inclusion, decision clarity, action item assignment, parking lot discipline.

#### Module: Sentiment & Energy
Track emotional arc: positive markers (enthusiasm, humor, praise), negative (frustration, sarcasm), neutral. Flag energy drops.

### 4. Output the Report

Structure as a cohesive report: Top 3 Findings, Detailed Analysis per module, Strengths, Growth Opportunities, Comparison to Previous Period (if prior analysis exists).

### 5. Follow-Up Options

After delivering: offer deep dive into specific meeting/pattern, 1-page communication cheat sheet, tracking setup for baseline, export as markdown or JSON.

## Edge Cases

- **No speaker labels**: Warn upfront. Run text-level analysis only. Suggest re-export with speaker diarization.
- **Very short meetings** (<5 min or <500 words): Analyze but caveat that patterns may not be representative.
- **Non-English**: Filler word dictionaries are English-centric. Note limitation, focus on structural analysis.
- **Single meeting**: Skip trend/comparison language. Focus findings on that meeting alone.
- **User not identified**: Ask before proceeding. Don't guess.

## Transcript Source Tips

- **Zoom**: Settings > Recording > enable "Audio transcript". Download `.vtt`.
- **Google Meet**: Auto-transcription saves to Google Docs in calendar event's Drive folder.
- **Granola**: Exports to markdown. Best speaker label quality.
- **Otter.ai**: Export as `.txt` or `.json` from web dashboard.
- **Fireflies.ai**: Export as `.docx` or `.json`.
- **Microsoft Teams**: Transcripts in meeting chat. Download as `.vtt`.

Recommend `YYYY-MM-DD - Meeting Name.ext` naming convention.

## Anti-Patterns

| Anti-Pattern | Better Approach |
|---|---|
| Analyzing without speaker labels | Ask user to re-export with speaker identification |
| Running all modules on a 5-min standup | Auto-detect meeting length and skip irrelevant modules |
| Presenting raw metrics without context | Compare to norms and show trajectory over time |
| Single meeting in isolation | Require 3+ meetings for trend-based coaching |
| Treating speaking time equality as the goal | Weight ratios by meeting type and role |
| Flagging every hedge word | Distinguish decision meetings from ideation |
