---
name: zettel
description: "Creates an atomic note in the vault from an idea, a dump fragment or a project note, with the criteria for when something deserves its own note and what to link it to. Triggers: atomic note, zettel, this deserves its own note, create permanent note, graduate this idea, concept note."
argument-hint: "[idea | path#section | dump YYYY-MM-DD]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Zettel - Atomic note

You create a note that holds **one** idea, written so it stands on its own two years from now and linked to the rest of the vault. Half the work is deciding whether the note should exist.

Idea or source: `$ARGUMENTS`

The `vault-conventions` rule applies.

**Paths by role:** destinations are named by role, and each one's real path comes from the `## Paths` section of the vault's `CLAUDE.md` (read it before writing). The defaults in parentheses only apply if the vault doesn't declare something else.

## Phase 1 - Decide whether it deserves its own note

An idea deserves its own atomic note when it passes **all three**:

1. **It is true outside the context that produced it.** If it only makes sense inside the project where it appeared, it is a project note and it stays there.
2. **You would link to it from another note.** If you can't think of a single place to point to it from, it isn't knowledge yet: it is a record.
3. **The title can assert something.** "Partial indexes pay off on tables with skewed reads" is an idea. "Postgres" is a topic, and topics are hub files, not atomic notes.

If any fails, say so and propose the real destination: it stays in the dump, goes to the project note, or goes to a hub's `## History`. Verdict for this phase: PASS only if all three hold. Don't create the note just to avoid leaving the user empty-handed: one atomic note too many pollutes the graph forever.

## Phase 2 - Look for duplicates

Before writing, look for duplicates with `/vault-recall` if available (it ranks, and finds the note that used another name), or `Grep` in `<atomic>` (default `03_Resources/`) for the title's terms and their obvious synonyms. If there is already a note that covers the idea:

- **Same idea:** propose expanding the existing note instead of creating another. It is the most frequent case, and the one that prevents a vault with five notes on the same concept under five names.
- **Related but different idea:** create the new one and link both explicitly, with a line on how they differ.

## Phase 3 - Write

With approval on the title and destination, create the note in `<atomic>` (default `03_Resources/`) from `<templates>/Atomic.md`:

- **Title as an assertion**, not as a label. It is the filename and what you will see in link autocomplete three years from now.
- **The idea in the user's words**, not the source's. If it is a quote, it goes in quotation marks with its source; the body of the note is the reformulation.
- **`## Why it matters` section:** one or two lines on which of the user's problems this touches. It is what separates an atomic note from a Wikipedia summary. If the user didn't say, ask in one line, don't invent it.
- **`## Related` section:** at least one `[[wikilink]]`, always. If there is nothing to link to, the topic's hub is missing: create it with `/hub-note` before closing this note.
- **`## Source` section:** the clip, the book, the conversation, or "own" if it came from the user.
- **Frontmatter `status`:** `seed` if the note is left as a seed on purpose, `provisional` if it already has a body. **Never set `evergreen` yourself:** the user decides that when the note stops moving, and it is what keeps the audit from reporting it as stale.

If the idea came from a project note or a dump, **the source is not emptied**: the original line stays where it was and gets the link to the new note added.

## Phase 4 - Connect

1. Link the note from the topic's hub (the hub's `## Notes` section). The link from the hub to the note is what makes it findable.
2. If the note argues with or contradicts another atomic note, link them to each other with a line on why. Connections between atomic notes are lateral and are bidirectional: it is the only case where the "links go upward" rule doesn't apply, because there is no hierarchy here.

Note COMPLETE when it exists, has at least one incoming link from a hub and at least one outgoing link.

## Rules

- One idea per note. If you need two `##` sections that don't relate, they are two notes.
- Never empty the source the idea came from.
- Don't create the note if it fails the graduation criteria, even if the user asked for it: explain why and propose the right destination. If they insist, it gets created.
- No em dashes.

## Handoff

With the note created, the next step is `/hub-note` if the topic doesn't have a hub yet, or back to `/review-dump` if this came up in the middle of processing a day. At the end of the week `/review-weekly` will pick up the note as part of what grew.
