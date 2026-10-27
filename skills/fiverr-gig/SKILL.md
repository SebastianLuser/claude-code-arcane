---
name: fiverr-gig
description: "Builds the Fiverr gig: I will title, search tags, the three packages priced from the net floor, gallery, FAQ and requirements. Triggers: fiverr gig, fiverr, basic standard premium packages, gig price, fiverr tags, sell on fiverr."
argument-hint: "[audit | title | packages | gallery | faq | price]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch
---

# Fiverr Gig - The offer side

Fiverr works the opposite way from Upwork: **you do not apply, you publish.** The gig stays up and the
buyer finds you by searching. Buyer Requests no longer exist, so there is no queue of postings
to score - that is why `/freelance-scan` leaves Fiverr out on purpose, and this skill is the one that covers
what is missing there.

Practical consequence: a gig is an **asset**, not an application. It is written well once and
iterated with data (impressions → clicks → orders), not rewritten for each client.

Paths are relative to the career workspace (`--workspace`, env `CAREER_WORKSPACE`, or `./career-workspace/`).

Mode: `$ARGUMENTS`

## Inputs

- **The master profile** in `01-Profiles/` - the source of truth for the niche, the stack and the numbers.
  If it does not exist, run `/master-profile` first.
- **The net rate floor** defined in `/freelance-hunt`. Without a floor there is no way to set a price: it
  would be guesswork.
- **The current gig**, if there is one: public URL → WebFetch, or pasted.

## Modes

### `audit` - Review the current gig

Go through the five elements below and report what is missing, prioritized by impact. Always start
with **the title, the first gallery image and the Basic price**: they are the only three that show in
the search results, before anyone clicks.

### `title` - The title

It starts with `I will` by platform convention, and it is what the search indexes.

- **A concrete niche, not a role.** "I will develop your Unity game" competes with everyone. "I will
  build multiplayer gameplay for your Unity mobile game" competes with few and shows up in the search
  that matters.
- The words the buyer uses, not yours. The buyer does not search for "gameplay architecture",
  they search for "multiplayer".
- No superlatives or "professional": they add nothing and take up characters that do get indexed.
- **The tags (up to 5) are functionally part of the title.** Pick them from the same vocabulary, without
  repeating the same word five times.

Always propose **2 variants** to choose from.

### `packages` - The three tiers

The classic mistake is making three versions of the same work at different prices. The packages have
to be separated by **scope**, not by speed or effort.

| | Basic | Standard | Premium |
|---|---|---|---|
| What it is | The smallest useful deliverable unit | **The one you want to sell** | The ceiling, for the buyer who has already decided |
| Scope | One thing, defined | The Basic plus what almost everyone ends up asking for | Full scope, including what takes real time |
| Role | Entry filter and reference price | Anchor: it is compared against the other two and wins | Raises the average and makes the Standard look reasonable |

Hard rules:

- **The scope is written in the package.** Whatever is not written is scope creep with no possible change order:
  on Fiverr there is no renegotiation halfway through, there is an order with a scope.
- **Revisions with a number.** "Unlimited revisions" is a promise that destroys the margin and cannot
  be withdrawn without cancelling the order.
- **Realistic delivery time, not competitive.** Delivering late hits the account level, which cannot
  be edited. One extra day on the gig costs less than one late delivery.
- **Gig extras** are for what is genuinely optional (editable source file, commercial license,
  express delivery), not for splitting into pieces something the package already promised.

### `gallery` - What is seen

- **The first image is the gig in search.** It has to read as a thumbnail: one idea, big
  text, zero decoration.
- After that: the real result, not the process. A before/after beats any mockup.
- A short video if the work is better understood in motion (animation, gameplay, motion).
- Never a client's material without permission or under NDA. If it cannot be shown, rebuild an
  equivalent example of your own and **say it is an example**.

### `faq` - The objections, answered in advance

Every FAQ exists to clear an objection out of the way before someone writes a message. The ones
almost always needed: what you need to get started, what happens if they do not like it, whether the price includes
the editable source file, whether it can be used commercially, what the gig does **not** include.

Saying what you do not do filters out the wrong buyer, who is the one who rates badly later.

### `price` - The price

- It is derived from the **net floor** in `01-Profiles/` plus the platform fee. Fiverr keeps a
  percentage of the order value (historically 20%): check the current one before setting it, and
  add it on top of the floor, do not subtract it from the price you had in mind.
- The Basic price is the one that shows in search: it is a traffic filter, not the expected sale.
- **Starting cheap to get the first reviews is a well-known trap**: it attracts price buyers,
  who ask for the most and rate the worst, and the reviews they leave are the ones that
  later decide the account level. If history is lacking, the lever is **narrowing the niche**,
  not lowering the price.
- A gig priced above the market with a narrow niche converts worse in volume and better in money.
  That is the choice, and the user makes it, not the skill.

## What the gig does not control

The **account level** (New Seller → Level 1 → Level 2 → Top Rated) and the response metric cannot
be edited: they come from completed orders, ratings, on-time deliveries and response time.
It is the same problem as the Job Success Score on Upwork, and it is protected the same way - by choosing which orders
to accept and what scope to promise, not by writing the gig better.

Neither are the **impressions**: they depend on the search algorithm. What the gig does control is the
conversion from impression to click (title and first image) and from click to order (packages and FAQ). If
impressions are low, the problem is the niche or the tags; if they are high and there are no orders, the
problem is the packages or the price.

## Process

1. Read the master profile and the rate floor. If the floor is missing, stop and send the user to `/freelance-hunt`.
2. Run the requested mode (or `audit` if none was given).
3. Propose the texts as drafts in the chat, with 2 title variants and the full table of the three
   packages, including delivery time and revisions.
4. With approval, save to `01-Profiles/Fiverr-<gig-slug>.md` (derived from the master, not a
   replacement). The user copies and pastes into the platform - **this skill never touches the account.**
5. Write down the publication date or the date of the last tweak, so it can be correlated later with
   impressions and orders.

One gig per niche. Two gigs competing for the same search cannibalize each other's impressions.

## Rules

- Never make up experience, clients or numbers.
- Never promise in the package something that is not in the written scope.
- Never "unlimited" anything.
- The price is derived from the floor, never from the competition.
- No long dashes in the generated texts.

## Handoff

Ask for approval before writing to `01-Profiles/`. Gig **READY** when the title, the
three packages with scope and delivery, the first image defined and at least three FAQs are complete.

Then: `/freelance-pipeline` to measure the gig with the orders that come in (the Fiverr funnel is
impressions → clicks → orders, not proposals sent), `/freelance-profile` if they will also
work on Upwork, and `/portfolio-site` if they want their own portfolio outside the platforms.
