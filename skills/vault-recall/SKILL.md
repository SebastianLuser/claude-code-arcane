---
name: vault-recall
description: "Ranked search over the vault via a cached index: BM25, folded accents and expansion with the aliases your notes declare. Also finds the notes most similar to a given one. Triggers: search the vault, what did I write about, find the note on, recall, where did I note, what do I have on, what is similar to this note, related notes."
argument-hint: "<query> | related <note> [-n N] [--no-expand] [--refresh]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Vault Recall - Find what you already wrote

You answer what the vault holds about something. The difference with `Grep` is the ranking: `Grep` gives you the 40 notes that contain the word, this gives you the 5 that are **about** the topic, and finds the ones that used another name for the same thing.

Query: `$ARGUMENTS`

## Phase 1 - Search

```bash
python .claude/skills/vault-recall/scripts/vault_index.py "<vault>" search "<query>" -n 10
```

The index lives in `<vault>/.vault-index.json` (a dotfile, Obsidian ignores it) and only what changed gets updated: the first run indexes everything, later runs cost milliseconds. If it does not exist, the script builds it without you having to ask.

Skill flags, which are the script's and are passed through as-is:

| Flag | What it does |
|---|---|
| `-n N` | maximum results; `-n 0` for all. Default 10 |
| `--no-expand` | literal query, without expanding with the hubs' aliases |
| `--role name=path` | vault structure different from the default (comes from the `## Paths` of its `CLAUDE.md`) |

**`--refresh`** is not a script flag: it is a preliminary step. With `--refresh`, first run `vault_index.py "<vault>" refresh` and then the search. Use it when the vault changed outside Claude (sync from the phone, bulk editing in Obsidian): the index is incremental by mtime, so it costs milliseconds and avoids searching against a stale cache.

### `related` mode: what is similar to this note

```bash
python .claude/skills/vault-recall/scripts/vault_index.py "<vault>" related "<note or title>" -n 10
```

Ranks by shared vocabulary (tf-idf cosine) and returns which terms they share, so you can see **why** two notes ended up close. It serves two concrete purposes:

- Before creating an atomic note, check whether one already says the same thing in other words.
- Find connection candidates for `/review-weekly`, which is where the vault starts producing ideas of its own.

If the title is ambiguous (two notes with the same name), it does not pick: it reports both and stops. That is the audit's `ambiguous_names` finding showing up through another door.

## Phase 2 - Read and answer

1. **Read the top 2 or 3**, not all 10. The ranking exists so you do not have to open everything.
2. **Answer the user's question citing the notes**, with `[[wikilinks]]` so they can jump. Do not paste whole notes.
3. **Say what you looked at and what you did not.** If result 1 scored 8 and result 2 scored 0.4, say so: it means there is a single note on the topic.
4. **If the answer is not in the vault, say so.** Do not fill it in with general knowledge disguised as the user's note: the value of the vault is that what comes out of it is what they thought.

## What it finds and what it does not

This is **lexical retrieval with vault-derived synonyms**, not semantic search. Concretely:

| Case | Result |
|---|---|
| You search `indice` and the note says `índices` | Finds it: folds accents and collapses plurals |
| You search `PG` and the note says `postgres` | Finds it, **if the hub with `PG` in `aliases` exists** |
| You search `the index` | Searches `index`: stopwords from `scripts/stopwords.en.json` and `scripts/stopwords.es.json` are dropped (add a `stopwords.<lang>.json` for another language) |
| The word appears once in a 900-word dump | Ranks low, as it should |
| You search `query performance` and the note talks about `partial indexes` without naming any of those words | **Does not find it.** There are no embeddings, in `search` or in `related`: both need shared words. |

That last case is the real limit and it must be said when it happens, instead of answering "you have nothing on that". The three ways out, in order of cost:

1. **Rephrase with the user's vocabulary**, which is the one in the vault.
2. **Add the alias** where it belongs (`/hub-note --update`, or the note's frontmatter: `aliases:` from **any** note feeds the expansion). Teaching the vault a synonym fixes it for good, and it is the mechanism, not a workaround.
3. **Walk the topic's hubs** and read their `## Notes`: the hand-made map is still better than any search.

## Rules

- Do not write to the vault. If the search shows a missing alias or hub, propose it and ask for approval: `/hub-note` applies it.
- Do not invent content from notes you did not read. Cite only what you opened.
- The index is not a source of truth: it is a cache. If a result does not match the note, the note wins and `refresh` has to run.
- No em dashes.

Recall COMPLETE when the user has the answer with links to the notes, or knows it is not in the vault and why.

## Handoff

If the search showed the topic is scattered across several places without a map, the next step is `/hub-note` to create the missing hub. If it showed an idea repeated across three similar notes, `/zettel` to consolidate it and `/vault-tidy` to link the leftovers.
