# One vault, every project

The vault is not only useful when you are sitting in it. It is useful when you are in another repo and need something you already thought through. This is the recipe for any project to read the same second brain, without duplicating anything.

Adapted from the `AgriciDaniel/claude-obsidian` pattern (MIT), with the read cascade and the exclusion rule, which are the parts that matter.

## The snippet

Paste this into the `CLAUDE.md` **of the other project**, with the real path:

```markdown
## Second brain

Vault: `~/path/to/vault`

When you need context that is not in this repo, go in this order and stop as
soon as it is enough:

1. The vault's `hot.md`: recent-context cache, short by design.
2. `python <vault>/.claude/skills/vault-recall/scripts/vault_index.py "<vault>" search "<query>"`
   to find the relevant notes by relevance, not by keyword.
3. The topic's hub in `Hubs/`, and from there the notes it links to.
4. Only then, the specific note.

Do NOT read the vault for general programming questions. It is personal memory,
not technical documentation: if the answer is in the language docs or in this
repo, the vault adds nothing and only spends context.

Never write to the vault from this project unless I explicitly ask for it.
```

## Why the cascade, and why in that order

Each step is more expensive than the previous one. `hot.md` is 40 lines and covers "what was I doing". The search costs one call and returns paths, not content. The hub costs one read and gives you the map of the topic. The specific note is the only thing that brings full text.

Without the cascade, an agent with access to the vault does what anyone without instructions would: `Glob` everything and read whatever looks related. In a vault of a thousand notes that is the whole session spent before starting.

## Why the exclusion rule is the most important line

`Do NOT read the vault for general programming questions`.

Without it, the vault becomes one more place to search before answering anything, and every query pays the cost without getting anything back. The vault helps when the answer depends on **your** history: a decision you made, a person you talked to, something that already happened to you. To learn how a `Promise.all` works, it does not.

## Writing from another project

By default, **read-only**. A project that writes to the vault without being asked adds notes with no frontmatter, no links and nobody reviewing them, which is exactly the material orphans are made of.

When you want to capture something into the vault from another repo, there are two ways:

- **Recommended:** `/brain-dump` with `--vault <path>`. It goes into the day's dump, unclassified, and the review processes it at night like any other capture.
- **If passing the path bothers you:** an Obsidian MCP server (for example `@bitbonsai/mcpvault`) lets you touch the vault from any session. It costs a dependency and latency, and the project's `CLAUDE.md` has to state that it is only used to capture, not to reorganize.

## What not to do

- **Do not copy vault notes into the repo.** Two copies diverge and neither wins.
- **Do not point the project at a vault subfolder** to "narrow it down". It breaks `[[wikilinks]]` resolution, which is global to the vault.
- **Do not let a project run `/vault-tidy` or `/review-dump`.** Those write in bulk and need the user watching. From another repo, the vault is read.
