---
name: linkedin-carousel
description: "Build a LinkedIn document post (carousel) for a topic with steps or parts (games, software, LLMs): slide-by-slide copy in the user's voice, the post text above it, and the PDF to upload, checked for overflowing slides; never published. Triggers: carrusel de LinkedIn, carousel, document post, slides para LinkedIn, explicar un tema paso a paso, turn this into a carousel."
argument-hint: "<topic or list-shaped idea>"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# LinkedIn Carousel

A document post is one idea broken into steps the reader swipes through. It fails when a single claim is cut into slides. The user uploads the PDF; this skill only writes and builds it.

## Phase 1: Is it a carousel?

1. Read the **Voice** section of `01-Profiles/Master Profile.md` (`/master-profile`), as `/linkedin-post` does. No voice yet: stop and send the user there.
2. The idea needs **sequence**: steps, a progression, a framework with parts, a before and after. One claim, or fewer than four parts, is a text post: say so and hand over to `/linkedin-post`.
3. A technical topic follows `/linkedin-post` **Explain mode**: one concept, one reader, every claim checked against the primary source before any slide is written.

## Phase 2: Slides

8-12 slides is the working range: fewer is usually a text post, and past 12 cut a step rather than add a slide.

```text
1        COVER     the hook in 6 words or fewer, plus one line of promise
2        STAKE     why this matters to the reader, one sentence
3..N     ONE IDEA PER SLIDE: a 3-7 word headline, at most 25 words under it
N+1      RECAP     the whole thing as a list, readable without the deck
LAST     CLOSE     one action: follow, comment, or the link in the first comment
```

- **The cover decides the result.** Pick it from three options drawn from `.claude/skills/linkedin-post/references/hooks.json`, and say which you would ship.
- **A slide that needs a paragraph is two slides.**
- **Number every slide** (3/10) and put the user's name or handle small in a corner: screenshots travel without the post.
- **Code on a slide:** six lines at most, monospace, the one line that matters highlighted.
- **Never fabricate** numbers, results or experience; a missing number is `{{...}}` and a question.

## Phase 3: Post text and humanizing

The carousel still needs 2-3 lines above it, and those lines are the hook the feed shows. Write them, then run the post text and the slide copy through `/content-humanizer`:

```bash
python .claude/skills/content-humanizer/scripts/humanize.py copy.txt -o clean.txt --report
python .claude/skills/content-humanizer/scripts/detect.py copy.txt clean.txt
```

Show the slides as a numbered list the user can read in ten seconds, plus the post text. Build the PDF only after the user approves the copy.

## Phase 4: The PDF

Write `slides.html` with one `<section>` per slide and print it:

```html
<style>
  @page { size: 1080px 1350px; margin: 0 }
  body { margin: 0 }
  section { width: 1080px; height: 1350px; box-sizing: border-box;
            padding: 96px; page-break-after: always; overflow: hidden }
</style>
```

```bash
python .claude/skills/linkedin-carousel/scripts/carousel_pdf.py slides.html carousel.pdf
```

- **4:5 (1080x1350)** is the common choice because it takes more of a phone screen than a square. That is practice, not a LinkedIn rule; LinkedIn only requires every page of a PDF to be the same size, which the `@page` rule guarantees.
- **Type no smaller than 28px:** most people read it on a phone.
- **Colors and fonts:** use the project's brand skill or design system if there is one. Otherwise one accent color on a neutral background, and no invented palette.
- The script prints with headless Chrome or Edge and checks LinkedIn's limits (100 MB, 300 pages). It also checks that there is one page per slide: a `[WARN]` about extra pages means a slide overflows and shows up cut in the feed. Shorten that slide and print again.

## Phase 5: Hand over

```text
CAROUSEL READY
cover:     #19 Curiosity Gap
slides:    10 (PDF 10 pages, 1080x1350)
humanizer: human score 81 PASS
title:     "How the KV cache works, in 10 slides"   (LinkedIn asks for one on upload)
file:      carousel.pdf
link:      goes in the first comment

Reply "yes" to log it, or tell me what to change.
```

On "yes", ask "May I append it to `01-Profiles/LinkedIn Log.md`?" and log the date, the cover and the format.

## Protocol

- Never upload, publish or schedule, and never open LinkedIn in a browser. The User Agreement (section 8.2) forbids automated posting.
- Credit: adapted from Jake Schincariol's linkedin-agent-skill (MIT).

## Next steps

- `/linkedin-comment` for the engagement round before posting.
- `/linkedin-reply` once comments arrive.
