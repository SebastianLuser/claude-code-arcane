---
name: vault-clip
description: "Saves a web page into the vault as a clean note: extracts the content without menus or banners, with source frontmatter and a summary of its own. Triggers: clip, save this article, web clip, save link to the vault, archive this page, web clipper."
argument-hint: "<url> [--full | --summary]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch
---

# Vault Clip - Web capture

You turn a URL into a vault note that can still be read five years from now, when the original page no longer exists. What you save is the content, not the HTML.

URL: `$ARGUMENTS`

Apply the `vault-conventions` rule.

**Paths by role:** destinations are named by role, and the real path of each one comes from the `## Paths` section of the vault's `CLAUDE.md`. The defaults in parentheses only apply if the vault does not declare otherwise.

## Phase 1 - Fetch the content

1. **Locate the vault** and read its `CLAUDE.md`.
2. **Validate the URL** before touching it: it has to be `http(s)` and public. If the user passed something that is not a URL, ask.
3. **Fetch the page with `WebFetch`**, asking for the main content in markdown, without navigation, sidebars, cookie banners, footers or "related articles" blocks. A raw article is tens of thousands of tokens, 80 percent of which is site chrome.
4. **If the page is a paywall, a login or an empty JS shell**, say so and stop. Offer to let the user paste the text by hand. Do not invent the content from the title or from what you know about the topic: a fabricated clip is worse than no clip.

## Phase 2 - Decide what gets saved

| Mode | What it saves | When |
|---|---|---|
| `--summary` (default) | A 5 to 10 line summary of its own + the key points + a link to the source | Almost always. The vault is for your ideas, not for copies of the internet. |
| `--full` | The full clean text | Technical reference you are going to quote, or content that may disappear |

In both modes, **you write the summary and it goes at the top**: if the user opens the note a year from now, the first thing they need to see is what was there and why they saved it, not the author's first paragraph.

## Phase 3 - Write

With approval on the destination and mode, create the note in `<atomic>` (default `03_Resources/`):

```yaml
---
created: YYYY-MM-DD
type: clip
source: <URL>
author: <if the page declares it>
status: seed
tags: []
---
```

Body structure:

1. `# <Article title>`
2. **Why I saved it:** one line. If the user did not say, ask; it is the field that decides whether the note is useful or accumulated junk.
3. `## Summary` with the key points.
4. `## Content` only in `--full` mode, with the clean text.
5. `## Related`: at least one `[[wikilink]]`. A clip without a link is an orphan with a URL. If there is nothing to link it to, the topic's hub is missing: `/hub-note`.

File name: the article's title, not the URL slug. No characters that break on Windows (`: \ / | ? * < >`).

Clip COMPLETE when the note has a source, a summary of its own and at least one link.

## Rules

- Never save the raw HTML or the markdown with the navigation inside.
- Never fabricate content that did not come from the page.
- Respect copyright: in `--full` mode the note is for personal use in the user's vault, and the source is always attributed. Do not propose republishing anything.
- The clip is raw material, not an atomic note: if an idea of the user's own comes out of it, that idea is a separate note with `/zettel`.
- No long dashes.

## Handoff

With the clip saved, the next step is `/zettel` if the article produced an idea the user wants to make their own, or `/hub-note` if the topic does not yet have a hub from which to find this clip.
