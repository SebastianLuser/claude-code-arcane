---
name: hub-note
description: "Creates or updates a vault hub file (MOC): one note per entity that matters (person, tool, concept, company) that accumulates knowledge and connects PARA with Zettelkasten. Triggers: hub file, MOC, map of content, entity note, create hub for, update hub, person note."
argument-hint: "[entity] [--update]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Hub Note - The vault's connective tissue

A hub file is one note per entity that matters. It holds no knowledge of its own: it holds **the current state** of that entity and **the links** to everything known about it. It is what lets PARA (folders) and Zettelkasten (flat notes) live together without fighting.

Entity: `$ARGUMENTS`

Apply the `vault-conventions` rule.

**Paths by role:** destinations are named by role, and the real path of each one comes from the `## Paths` section of the vault's `CLAUDE.md` (read it before writing). The defaults in parentheses only apply if the vault does not declare otherwise.

## Phase 1 - Decide whether the entity deserves a hub

The criterion is recurrence, not importance: **the entity appeared in three different dumps or notes**. Before that it is a mention, and a hub per mention produces hundreds of one-line notes nobody visits.

1. Search for the entity with `/vault-recall` if available, or `Grep` the `inbox`, `daily` and `atomic` roles (defaults `_inbox/`, `Reflect/Daily/`, `03_Resources/`) for the name and its variants.
2. Count the appearances and report them with the links.
3. If there are fewer than three, say so and propose waiting. If the user wants the hub anyway (a new person on the team, a project that is starting), create it: anticipation is a valid reason, doubt is not.

Verdict: PASS if there are three appearances or an explicit reason from the user.

## Phase 2 - Look for the existing hub

`Glob` in `<hubs>` (default `Hubs/`) and check the frontmatter `aliases` of the hubs there. Entities arrive under different names ("Educabot", "educabot", "EB"): if a hub for the entity already exists under another name, **update that one** and add the new name to `aliases`. Never create a second hub for the same entity: it is the vault's most expensive duplicate, because it splits the knowledge into two places nobody reconciles.

## Phase 3 - Write

With approval, create or update the hub in `<hubs>` (default `Hubs/`) from `<templates>/Hub.md`.

When **creating**:
- Title: the entity's canonical name. The variants go into `aliases`.
- One or two lines on what it is and why it has its own note.
- `## Current status`: what you need to know today.
- `## Notes`: links to the atomic notes and projects on the topic that already exist (the ones you found in phase 1).
- `## History`: one line per relevant appearance, format `- YYYY-MM-DD - what happened`, newest at the top.
- `status`: `seed` when created, `provisional` once it has accumulated content. A hub the user keeps up to date can become `evergreen`, but the user marks it.
- `repos:` if the entity has code (an in-house tool, a project, a service). It is the bridge to the repo, and it is translated to a local path in the vault's `codebases.md`. **Do not copy architecture into the hub:** the hub says what it is and why, the repo says how it is built, and whatever gets copied goes stale.

When **updating** (`--update`, or when the hub already exists):
- Add the new entry to `## History`, without duplicating one that is already there with the same date and the same content.
- **`## Current status` is rewritten, not accumulated.** It is the section that answers "what do I know about this today"; if it turns into a log, the hub stops serving the one thing it is for. Whatever gets replaced and is still relevant moves down to the history.
- `## Notes`: add the new links.

## Phase 4 - Connect

- The hub links to the atomic notes and the projects. Dumps and dailies link **to** the hub. The hub does not link to dumps or dailies: they are a record, not knowledge, and they fill the hub with noise within a month.
- If the hub covers a broad topic and already has more than 30 or 40 entries in `## Notes`, propose splitting it into sub-hubs per subtopic. A hub nobody can read top to bottom has stopped being a map.

Hub COMPLETE when it has a current state, at least one outgoing link, and the appearances found are recorded in the history.

## Rules

- One hub per entity. Aliases go into the frontmatter, not into a new hub.
- The hub accumulates no knowledge of its own: if you want to explain an idea, it is an atomic note (`/zettel`) linked from here.
- Never delete history entries: if something stopped being true, add a new entry.
- No long dashes.

## Handoff

With the hub ready, the next step is `/zettel` for the topic's ideas that do not have their own note yet, or back to `/review-dump` if this came out of processing the day. `/vault-audit` will use the hubs to tell a real orphan from a note that simply has not been linked yet.
