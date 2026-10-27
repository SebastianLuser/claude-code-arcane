---
name: doc-pas
description: "Generate game design docs in PAS format (Problem-Analysis-Solution). Concise decision documents for design problems."
category: "gamedev"
argument-hint: "[problem or decision title]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---
# Game Design Document — PAS Format

Generates video game design documentation using the PAS framework: Problem → Analysis → Options → Decision.

## WRITING RULES (CRITICAL)

1. **Do NOT ramble.** Every sentence must add new information. If it can be said in 1 sentence, do not use 3.
2. **Do NOT ask rhetorical questions.** State, do not ask.
3. **Do NOT give unnecessary context.** The reader already knows the game.
4. **Do NOT list "general recommendations".** Only concrete solutions to the specific problem.
5. **Do NOT repeat information** across sections.
6. **At most 2-3 sentences per point.** If it needs more, it is not distilled enough.
7. **Bullet points > paragraphs.** Always.
8. **Concrete numbers > vague descriptions.** "Reduce HP from 100 to 70" > "tweak the enemy's health".

## Input

The user describes a design problem, a mechanic to evaluate, or a proposed change. Optional argument: `$ARGUMENTS`

## Output format

> → Read references/output-format-template.md for [full PAS template with the Problem/Analysis/Options/Decision structure]

> → Read references/examples-and-usage.md for [good vs bad examples, when to use and when NOT to use this format]

## Rules
- Write the document in the user's language
- CONCISE. If the "Problem" section has more than 6 bullet points, it is wrong.
- Options must be at least 2, at most 4. More = they were not distilled well.
- The decision must fit in 2 sentences of justification.
- If there is no decision yet, mark it [TBD] and leave the options clear.
- If the user asks to "analyze" or "evaluate" something → use this format automatically.
- Include concrete numbers whenever possible.
