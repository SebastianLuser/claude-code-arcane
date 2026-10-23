---
name: linkedin-comment
description: "Write comments on other people's LinkedIn posts that read as a person with an opinion: nine comment types chosen by what the post is, two options per post, humanized, never posted for the user. Also batches an engagement round. Triggers: comentar un post de LinkedIn, qué comento acá, comment on this, engagement round."
argument-hint: "<pasted post> | batch"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# LinkedIn Comment

A comment under a post with hundreds of reactions is seen by more people than most of the user's own posts, and a generic one costs credibility with the author.

## Phase 1: Input

The user pastes the post text (plus the author's name and role if they have it), or a screenshot. A URL that cannot be opened: ask for the text. Never guess what the post said, and never scrape the feed with a browser. Read the **Voice** section of `01-Perfiles/Perfil Maestro.md`.

## Phase 2: Pick the type

Choose by what the post actually is. Never default to the one-liner.

| # | Type | When | Shape |
|---|---|---|---|
| 1 | **Add a datum** | The post makes a claim you can back with a number | "We saw the same: 40% of our..." |
| 2 | **The missing case** | Right but incomplete | "This holds until {condition}. Then..." |
| 3 | **Respectful disagree** | You think it is wrong | The real agreement first, then the fork |
| 4 | **Extend one line** | One sentence is the good one | Quote it, build on it |
| 5 | **The real question** | The post skipped the hard part | One specific question |
| 6 | **The receipt** | You have done the thing | What happened, in two sentences |
| 7 | **The correction** | A factual error | Right, brief, kind and sure |
| 8 | **The reframe** | Right facts, wrong frame | "Another way to read this:" |
| 9 | **The one-liner** | Presence only | Under 12 words, funny or true |

## Phase 3: Write

- **2 to 4 sentences, one idea.** Longer reads as a hijack, two points read as a blog attempt.
- **Never open with** "Great post", "Love this", "So true", "Couldn't agree more", "This resonates", "Gran post", "Excelente aporte", or the author's name with an exclamation mark. No emoji as the first character.
- **Never restate the post.** Say the specific thing: a comment that fits any post on the topic is noise.
- The data, receipts and experiences are the user's own. Ask when they are missing; never invent them.

## Phase 4: Output

Two options of **different types**, labelled, with one line on which you would post. Run both through `/content-humanizer` (`.claude/skills/content-humanizer/scripts/humanize.py`, then `detect.py` from the same folder): in a short comment an em dash or a stock word stands out more than in a post.

```text
COMMENT OPTIONS  (on @author's post about hiring)

[6 · Receipt]
We tried the no-resume version for 3 hires last year. Two were our best hires.
The third was a disaster, and the difference was whether they had done the job before.

[3 · Respectful disagree]
Agree on the signal problem. What worked for us was not dropping the resume
but giving every candidate the same paid 90-minute task.

Post the first: it is your own data and it concedes a failure, which is what people reply to.
```

## Batch mode

For an engagement round, ask for the 5-10 posts as pasted text in one message and return one comment each in a single block. Keep a running list of who the user commented on this week in `01-Perfiles/LinkedIn Log.md` (ask before writing): commenting on the same three people every day is visible.

## Protocol

- Never post, like or comment for the user. The User Agreement (section 8.2) forbids bots and automated methods that comment on or like posts, and scraping.
- Credit: adapted from Jake Schincariol's linkedin-agent-skill (MIT).

## Next steps

- `/linkedin-post` after the round: comments before posting help the post land.
- `/personal-brand` keeps the list of people worth engaging with.
