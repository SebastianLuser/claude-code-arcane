---
name: review-weekly
description: "Weekly vault retrospective: reads the week's dumps and dailies, extracts recurring themes and open threads, counts done and undone tasks, and creates the weekly. Triggers: weekly review, close the week, week retrospective, what happened this week."
argument-hint: "[current | YYYY-Www | YYYY-MM-DD]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Review Weekly - Close the week

You go up one level of abstraction: the daily records, the weekly detects patterns. What you are looking for are the themes that repeated and the threads left open, not a summary of seven summaries.

Week to process: `$ARGUMENTS` (default: the current week, Monday to Sunday)

The `vault-conventions` rule applies.

**Paths by role:** destinations are named by role, and each one's real path comes from the `## Paths` section of the vault's `CLAUDE.md`. The defaults in parentheses only apply if the vault doesn't declare something else.

## Phase 1 - Read the week

1. **Locate the vault** and read its `CLAUDE.md`.
2. **Resolve the range**: if the argument is a date, the ISO week that contains it; if it is `YYYY-Www`, that one; if there is no argument, the current week.
3. **Read the range's dailies (role `daily`) and their dumps (role `inbox`).** The dailies give the synthesis, the dumps give what didn't make it into the synthesis. Dailies are almost always missing: note which days were left unprocessed and offer `/review-dump` for those days before continuing, because a weekly built on raw dumps is worse.
4. **Reading budget:** the range's 7 dailies, their dumps, and up to 10 hubs those dailies link to. Hard ceiling of 25 reads. If the material isn't enough to draw conclusions, **say so and stop** instead of delivering a half-done weekly that looks complete.

## Phase 2 - Extract

1. **Themes:** 3 to 5 subjects that show up on two or more days. Each theme with the dailies where it appears. A theme that shows up on a single day is not a theme, it is an event.

A connection qualifies only if it is one of these four types (rubric adapted from the connection-session pattern):

| Type | What to look for |
|---|---|
| **A** | The same principle in two different domains |
| **B** | Two notes that contradict each other, and the contradiction is productive |
| **C** | A pattern that only appears when you put three or more notes together, and doesn't have a name yet |
| **D** | A question in one note that another note answers without meaning to |

To avoid relying only on what you remember from the week, ask the index for candidates: `vault_index.py "<vault>" related "<note from the week>"` returns the closest notes by shared vocabulary, and types A and C are usually there. Whether they qualify is still your call: the script proposes neighbors, not connections.

**If the connection is obvious, it doesn't qualify.** The test is: would the user have found it alone, eventually? If so, it's surplus. This step earns its place by finding what they miss. Minimum 3, maximum 5: beyond that the list stops being read.

Type B ones get flagged: the two notes involved go into the weekly as a contradiction, and if the user confirms it is still unresolved, they get `status: contested` in the frontmatter, with approval. The contradiction is preserved, it doesn't resolve itself.

### The artifact of a contradiction

When a type B connection is confirmed, the weekly carries a block with **the two opposing positions and their source**, not a synthesis that averages them:

```markdown
> [!warning] Unresolved contradiction
> **[[Note A]]** says: <the claim, verbatim or faithfully paraphrased>
> **[[Note B]]** says: <the other one>
> Unresolved since YYYY-MM-DD. Both stay `status: contested`.
```

Use `[!warning]` with its own title and not `[!contradiction]`: that type doesn't exist in Obsidian and would render as a plain `note` without warning (see `/obsidian-markdown`).

Three rules of the artifact:

- **Don't resolve it.** If it seems obvious to you which of the two wins, say so as a separate comment; the note doesn't choose.
- **Don't delete either one.** A contradiction resolved by deleting half of it wasn't resolved, it was covered up.
- **When the user resolves it**, remove `contested` from both, and the resolution goes into its own atomic note, linking to both. That is new knowledge: it is the case where the contradiction produced something.
2. **Open threads:** pending questions or decisions, distinct from a task. "Decide whether we migrate" is a thread; "send the email" is a task.
3. **Tasks:** count of done and not done, with the undone ones named one by one. Don't soften the number or leave them out.
4. **Notes that grew:** hubs and atomic notes that received content during the week.
5. **Signals, if they appear:** a theme that repeats three weeks in a row without progress, or a project without a single mention all week. Report them as an observation, without diagnosis or advice.

## Phase 3 - Write

Also refresh `hot.md` with the week's open threads, respecting its 40-line ceiling.

With approval on what was extracted, create `<weekly>/YYYY-Www.md` (default `Reflect/Weekly/`) from `<templates>/Weekly.md`, with links to the week's dailies. If the weekly already exists, update it without duplicating sections.

Links go upward: the weekly links to the dailies. No daily is edited to link to the weekly.

The `## Reflection` section is left empty for the user.

Review COMPLETE when the weekly exists with themes, threads and the real task count.

## Rules

- No interpretation: report what happened and what repeated, not what it means or what the user should do.
- Undone tasks are named. A weekly that hides them is useless.
- Idempotent: running it twice on the same week duplicates nothing.
- Only the week's range: never rewrite past dailies or dumps from here.
- No em dashes.

## Handoff

With the weekly ready, the next step is to keep going with `/brain-dump` next week, and at the end of the month `/review-monthly`, which reads the weeklies and not the dailies. If the weekly exposed a theme that already deserves its own note, `/zettel` or `/hub-note`.
