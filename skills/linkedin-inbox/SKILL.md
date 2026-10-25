---
name: linkedin-inbox
description: "Triage a pasted batch of LinkedIn DMs and connection requests into lead, recruiter, peer, ask and spam, name the tell that gives away an automated sequence, and draft only the replies worth sending. Triggers: ordenar mis mensajes de LinkedIn, inbox de LinkedIn, le respondo a este recruiter, triage my DMs, connection requests."
argument-hint: "<pasted messages>"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# LinkedIn Inbox

Most inboxes are mostly noise, and the cost is that the messages that matter wait a week. This skill separates them, then writes only what is worth writing.

## Phase 1: Input

The user pastes the messages or screenshots. Never log into the account or read the inbox with a browser. Read the **Voice** section and the target roles in `01-Perfiles/` so recruiter messages can be judged against what the user is looking for.

## Phase 2: Sort

| Bucket | Signal | Action |
|---|---|---|
| **RECRUITER** | A role, a company, a salary band | Reply if the role is real and fits the target profile; one line if not |
| **LEAD** | Describes a problem the user solves, or asks about working together | Reply today, full answer |
| **PEER** | Same field, something to say | Reply this week, keep it human |
| **ASK** | Advice, time, an intro, a favour | Reply if it is cheap and specific; decline cleanly if not |
| **SPAM** | Agency pitch, lead-gen sequence, crypto, "quick question" with no question | Archive, no reply |

Print the counts first: "3 recruiters, 1 lead, 41 spam" is most of the value.

## Phase 3: Spot sequences

Automated outreach has a shape: an invite with no specifics, a message minutes after the accept, "quick question", "I noticed you're in {industry}", a calendar link in message one, a bump exactly a few days later. Mark it SPAM and **say which tell gave it away**. The user does not owe a reply to a script.

## Phase 4: Replies

- **RECRUITER, role worth it:** ask what the message left out (salary band, level, remote or office, the stack) and say what makes the user a fit in one line. Log it in `05-Contactos/` and, when it becomes an application, hand off to `/job-aplicar`.
- **RECRUITER, not a fit:** one line: not looking for this, happy to refer, and mean the refer.
- **LEAD:** answer the actual question in full; if it fits, the offer is one sentence at the end.
- **ASK:** under ten minutes and specific: do it. "Can I pick your brain": decline in one warm sentence and give the one answer you would have given on the call.
- **Declines** are short, warm and final. No "let's revisit in Q3" if there is no Q3.
- **Never invent facts about the user's work.** Stack, numbers, timelines and how something was built come from `01-Perfiles/Perfil Maestro.md` or from the user. When a reply needs one that is missing, write `{{...}}` in its place and ask; a made-up detail in public is worse than a shorter reply.

Run every draft through `/content-humanizer` (`.claude/skills/content-humanizer/scripts/humanize.py`, then `detect.py` from the same folder).

## Phase 5: Output

```text
INBOX  ·  52 items  ·  2 RECRUITER, 1 LEAD, 4 PEER, 2 ASK, 43 SPAM

RECRUITER
@Ana López - Senior Backend at Acme
> Thanks, Ana. Sounds close to what I'm looking for. What's the salary band, and is it
> remote? I've spent the last two years on Go services at a similar scale.

SPAM  (43) - archive. 38 are the same sequence: no-specifics invite, "quick question"
within 4 minutes of the accept, calendar link in message one.
```

## Protocol

- The user sends every reply. The User Agreement (section 8.2) forbids bots and automated methods that send messages or add contacts.
- Ask before writing to `05-Contactos/`. Never store salary details or contact data in files that go to a remote without explicit confirmation.
- Credit: adapted from Jake Schincariol's linkedin-agent-skill (MIT).

## Next steps

- `/job-aplicar` when a recruiter role turns into an application.
- `/cold-outreach` for the follow-up if a recruiter goes quiet.
