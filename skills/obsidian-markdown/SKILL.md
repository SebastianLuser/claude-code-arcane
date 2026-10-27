---
name: obsidian-markdown
description: "Obsidian Flavored Markdown syntax: wikilinks, embeds, callouts, block IDs, properties, tags, highlights, math and mermaid. Validates or fixes a note. Triggers: obsidian syntax, wikilink, callout, embed, block id, obsidian markdown, does this render right in obsidian, obsidian frontmatter."
argument-hint: "[reference | check <file> | fix <file>]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Obsidian Markdown - Native syntax

Obsidian extends CommonMark and GFM. This skill covers **only Obsidian's own extensions**: standard markdown (headings, bold, lists, tables, code) is taken as known. Adapted from `kepano/obsidian-skills` to this repo's format.

Mode and file: `$ARGUMENTS`

## Modes

- **`reference`** (default): answer the syntax question with the table below, without touching files.
- **`check <file>`**: read the note and report what will not render. Read-only.
- **`fix <file>`**: fix what `check` found. Ask for approval before writing, showing the proposed diff.

## Links and embeds

```markdown
[[Note]]                          internal link
[[Note|Visible text]]             alias
[[Note#Heading]]                  link to a heading
[[Note#^block-id]]                link to a block
[[#Heading in this note]]         internal link to the same note

![[Note]]                         embed of the whole note
![[Note#Heading]]                 embed of a section
![[image.png|300]]                embed with a width
![[doc.pdf#page=3]]               embed of a PDF page
```

A block ID is defined by adding `^my-id` at the end of the paragraph. In lists and quotes it goes on a separate line after the block.

**`[[wikilinks]]` for internal content, `[text](url)` only for external URLs.** It is not style: Obsidian updates wikilinks when you rename a note inside the app, and it does not touch markdown links.

## Callouts

```markdown
> [!note]
> Basic callout.

> [!warning] Custom title
> With a custom title.

> [!faq]- Collapsed by default
> The `-` collapses it, the `+` opens it.
```

Types: `note`, `tip`, `info`, `warning`, `danger`, `bug`, `example`, `quote`, `success`, `failure`, `question`, `abstract`, `todo`. An invented type renders as `note` without warning, and that is the most common callout mistake.

## Properties (frontmatter)

```yaml
---
title: My note
date: 2026-07-27
tags:
  - project
  - active
aliases:
  - Alternative name
cssclasses:
  - custom
---
```

`tags`, `aliases` and `cssclasses` are the three properties Obsidian understands natively. The rest are custom fields, consumed by Bases or Dataview.

## The rest of the native syntax

```markdown
#tag  #nested/tag               inline tags (cannot start with a number)
==highlighted==                 highlight
%%comment%%                     invisible in reading view
$e^{i\pi}+1=0$   and   $$...$$  inline and block LaTeX math
text[^1]  /  ^[inline note]     footnotes
```

` ```mermaid ` blocks render diagrams natively.

## What `check` reviews

| Check | What it looks for | Verdict |
|---|---|---|
| Callout type | `> [!type]` with a type that does not exist | FAIL: renders as `note` |
| External links as wikilinks | `[[https://...]]` | FAIL: does not resolve |
| Internal links as markdown | `[text](My%20note.md)` inside the vault | CONCERNS: breaks on rename |
| Frontmatter | Opens with `---` on the first line and closes | FAIL if it does not close: Obsidian shows it as text |
| `tags` with `#` in frontmatter | `tags: [#foo]` | CONCERNS: the `#` does not belong in frontmatter |
| Block IDs | Duplicates in the same note | FAIL: the link resolves to the first one |
| Image embeds | Non-numeric width (`![[img.png|large]]`) | CONCERNS: it is ignored |
| Spaces in `[[ Note ]]` | Inner spaces at the start or end of the target | CONCERNS: may not resolve |

The note is COMPLIANT when none of these fail.

## Rules

- Do not reformat the whole note when the request is to fix a detail: `Edit` on verbatim quotes, not a `Write` of the whole file.
- Do not convert external markdown links into wikilinks: external ones stay as markdown links.
- Do not invent callout types or properties Obsidian does not recognize.
- No long dashes in what you add.

## Handoff

If the question was about aggregated views rather than note syntax, the right skill is `/obsidian-bases`; if it was about a canvas, `/obsidian-canvas`. Once the note is COMPLIANT, continue with the flow that produced it (`/zettel`, `/review-dump` or `/vault-clip`).
