---
name: narrative
description: "Narrative design rules for visual novel storytelling"
---

# Visual Novel Narrative Rules

## Story Structure
- Every route must have at least one good ending and one bad ending
- Common route must be engaging standalone — not just a prologue to route selection
- Route locks must feel earned, not arbitrary — player should understand why
- Secret/true endings unlock after specific conditions (usually: see other endings first)

## Choice Design
- Every choice must have consequences the player can eventually observe
- Avoid "obvious best choice" patterns — each option should have genuine appeal
- Affinity choices: spread across multiple scenes, not dumped in one chapter
- Flag choices: consequence should appear within 1-3 chapters (not 10 chapters later)
- Never punish the player for exploring — bad endings are still content, not failure

## Character Writing
- Each character has a distinct speech pattern documented in their profile
- Maintain voice consistency across all routes — character personality doesn't change
  based on which route the player is on (context changes, core personality doesn't)
- Inner thoughts use a consistent style (parenthetical, italic, or dedicated narrator)
- Don't break the fourth wall unless it's a deliberate genre choice

## Pacing
- Maximum 5 minutes of dialogue without a choice, scene change, or visual event
- After an emotional peak, provide breathing room before the next peak
- End each chapter on a hook — question, revelation, or decision pending
- Prologue/common route: introduce the conflict by the end of the first play session

## Documentation
- Every narrative change must update `design/narrative/story-outline.md`
- Character profile changes must update the character's design doc
- New flags must be documented in both the narrative tree and `variables.rpy`
- Route changes must update the Mermaid flow diagram
