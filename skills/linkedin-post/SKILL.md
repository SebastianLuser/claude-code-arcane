---
name: linkedin-post
description: "Write a LinkedIn post from one raw idea, in the user's own voice: three hook options from 21 formulas, one full draft, humanized and scored before the user sees it, never published. Triggers: post de LinkedIn, escribir un post, hook LinkedIn, turn this into a LinkedIn post, draft for the feed."
argument-hint: "<idea> | write <day from the plan>"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# LinkedIn Post

Turns one idea into a post that sounds like the person who will publish it. The user posts it; this skill only writes.

## Phase 1: Context

1. Read the **Voice** section of `01-Perfiles/Perfil Maestro.md` in the career workspace (`/master-profile`). No voice yet: ask for three of the user's own past posts, infer it from them and offer to save it there. Never invent a voice.
2. Read `01-Perfiles/Personal Brand.md` if `/personal-brand` wrote a plan: the slot gives the type, the angle and the hook number.
3. A thin idea ("post about AI") gets one batched question, not padding: what happened, to whom, and what did it cost or return. A post needs one specific true thing.

## Phase 2: Hooks

Read `references/hooks.json`: 21 formulas, each with a template, a filled example, what it is for and how it usually gets ruined. Pick the **three that fit this idea** (three different formulas, not three versions of one), show them as numbered lines, and say in one sentence which you would ship and why.

Line 1 has to stand alone: the feed shows about two lines before "see more".

## Phase 3: Draft

```text
Line 1    the hook, alone
Line 2    the payoff of line 1, not setup for line 3
Body      paragraphs of 1-3 lines, a blank line between each
The turn  one line that reframes what came before
Close     one specific question, or one instruction; never both
```

- **Length:** 900-1,300 characters is the working range; the hard limit is 3,000. Under 400 reads as a thought.
- **One idea per post.** Two ideas are two posts: say so.
- **Numbers over adjectives.** No number given: ask, or leave `{{your number}}` and flag it.
- **No engagement bait** ("Thoughts?", "Agree?", "¿Qué opinan?"). The closing question is one only this post could ask.
- **Three hashtags at most**, at the bottom, only real categories people follow.
- **Links in the first comment**, not the body. LinkedIn has not confirmed that links reduce reach, but it is common practice; tell the user in the receipt.
- **Language:** the one the user's audience reads (the Voice section says it).
- **Never fabricate** metrics, clients, revenue or outcomes under the user's name, not even as placeholders.

## Phase 4: Humanize

Run the draft through `/content-humanizer` before showing it:

```bash
python .claude/skills/content-humanizer/scripts/humanize.py draft.txt -o clean.txt --report
python .claude/skills/content-humanizer/scripts/detect.py draft.txt clean.txt
```

Rewrite the flagged lines by hand and re-run until **PASS**, or show the user the score and what is left.

## Phase 5: Hand over

Print the post in a fenced block exactly as it should be pasted, then:

```text
POST READY
hook:      #17 Time Anchor
length:    1,140 characters
humanizer: 6 artefacts stripped, human score 84 PASS
post at:   Tuesday 8:15 (from the plan)
link:      goes in the first comment

Reply "yes" to log it, or tell me what to change.
```

On "yes", ask "May I append it to `01-Perfiles/LinkedIn Log.md`?" and log the date, the hook and the first line, so the next plan does not repeat a theme.

## Protocol

- Never publish, schedule or open LinkedIn in a browser. The User Agreement (section 8.2) forbids bots and automated methods that create, comment on or share posts, and an account flagged for it gets restricted.
- Credit: adapted from Jake Schincariol's linkedin-agent-skill (MIT).

## Next steps

- `/linkedin-reply` once comments arrive (the first hour matters most).
- `/linkedin-comment` for the engagement round before posting.
- `/personal-brand` to plan the next week.
