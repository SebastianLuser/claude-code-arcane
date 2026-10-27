---
name: linkedin-reply
description: "Handle the comments under the user's own LinkedIn post: sort them into lead, substance, peer, support and noise, then draft replies in that order, humanized and copy-ready, never posted for the user. Handles critics and leads in the thread. Triggers: responder comentarios de mi post, alguien comentó en mi post, reply to these comments, handle my comments."
argument-hint: "<pasted comments>"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# LinkedIn Reply

Every reply is another engagement event on the post, and the first hour does most of the work. The value is not equal across comments, so this skill sorts before it writes.

## Phase 1: Input

The user pastes the comments, ideally with names and roles, or a screenshot. Never read the thread with a browser. Read the **Voice** section of `01-Profiles/Master Profile.md`.

## Phase 2: Triage

Sort every comment and print the counts first:

| Bucket | What it is | What it gets |
|---|---|---|
| **LEAD** | Someone describing the problem the user solves, or a recruiter or hiring manager showing interest | A real answer plus one sentence that leaves the door open |
| **SUBSTANCE** | Adds data, disagrees, extends | The longest reply in the thread |
| **PEER** | A name worth being seen next to | A reply that gives them something |
| **SUPPORT** | "Great post", an emoji, a tag | A like, and 3-8 words at most |
| **NOISE** | Pitch, spam, bad faith | Nothing, or one line and out |

Write in that order and stop when the value stops.

## Phase 3: Replies

- **Answer the actual question in the reply.** Do not send someone to a DM for an answer they could have had in public.
- **Their name once, at the start**, never with an exclamation mark. **Match their length.**
- **A critic:** concede the true part first, in their words, then hold the line on the rest. Never delete, never get defensive, never reply twice in the same thread.
- **A lead:** answer fully in public; the open door is one sentence at the end, an offer of help, not a pitch. For a recruiter, a reply in public and the details in a DM is fine.
- **A pitch in the comments:** ignore it. Replying gives it reach.
- **Never invent facts about the user's work.** Stack, numbers, timelines and how something was built come from `01-Profiles/Master Profile.md` or from the user. When a reply needs one that is missing, write `{{...}}` in its place and ask; a made-up detail in public is worse than a shorter reply.

Run every reply through `/content-humanizer` (`.claude/skills/content-humanizer/scripts/humanize.py`, then `detect.py` from the same folder).

## Phase 4: Output

One block, grouped by bucket, each reply copy-ready:

```text
REPLIES  ·  17 comments  ·  1 LEAD, 3 SUBSTANCE, 4 PEER, 8 SUPPORT, 1 NOISE

LEAD
@Sarah Chen - "we have the same problem with proposals"
> What fixed it for us was pulling the pricing table out of the doc and sending it
> as its own page. It cut a whole review round. Happy to send the template if useful.

SUPPORT  (like these; reply to the first three)
@Dan - "This is great" -> Thanks, Dan.

NOISE  (1)
Skipped: an agency pitch. Replying gives it reach.
```

## Protocol

- Nothing is posted until the user says yes, and the user pastes the replies. The User Agreement (section 8.2) forbids bots and automated methods that comment on posts.
- A LEAD that becomes a conversation goes to `05-Contacts/` (ask before writing) so `/cold-outreach` and `/network-map` see it.
- Credit: adapted from Jake Schincariol's linkedin-agent-skill (MIT).

## Next steps

- `/linkedin-inbox` when the thread turns into DMs.
- `/cold-outreach` to follow up with a lead.
