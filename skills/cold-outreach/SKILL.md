---
name: cold-outreach
description: "Write cold LinkedIn/email messages from a job-seeker to recruiters, hiring managers and referrals - plus post-application follow-up sequences that get replies. For B2B sales outreach use cold-email instead. Triggers: cold message to a recruiter, write to a recruiter, follow up on an application, networking message, ask for a referral, contact a hiring manager."
argument-hint: "[contact-note | recruiter + company]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, WebFetch
---

# Cold Outreach - Job-seeker → Recruiter / Hiring Manager

You write cold messages from a **candidate** to recruiters, hiring managers and referrals, and post-application **follow-up** sequences that get replies. This is NOT B2B sales (that is what `/cold-email` is for) - the angle is landing a conversation or a referral, without sounding like spam or desperation.

## When to use each variant

| Situation | Message |
|-----------|---------|
| A recruiter posted a role | Short message with fit + explicit interest |
| Hiring manager / future lead | Value message: what you solve that their team cares about |
| Asking someone at the company for a referral | Warm, low commitment, easy to say yes to |
| Networking with no open role | Genuine curiosity + something in common, without asking for anything yet |
| Post-application follow-up | A reminder with value, not "any news?" |

## Principles

- **Personalize the first line.** Something real about that person/company/role. If it works for 100 people, it works for none.
- **Short.** LinkedIn: 50-125 words. The invitation note: up to 200 characters on free accounts (count them and show the count).
- **Invitation notes are limited.** A free account can add a note to very few invitations per month (3 according to LinkedIn Help when last checked; LinkedIn changes it). Spend them on the people who matter; invite everyone else without a note and write the first message when they accept.
- **If there is no concrete reason to write to them today, say so.** A message with no reason is the one everyone sends.
- **One question / one CTA.** Lower the friction of replying.
- **You solve something for them**, not "I'm looking for a job, can you help me?". The focus is the value you bring to the team.
- **No walls of text, no CV attached on the first touch** (unless they ask for it).
- **Respect the "no".** One follow-up, two at most. Never push aggressively.

## The invitation note

`{a concrete reference to that person} + {one line on who you are} + {no ask}`. The note asks for nothing: it exists to make accepting obvious.

```
Saw your talk on moving the monolith to events; we did the same in 2025.
I'm a backend dev working in Go. I'd like to follow what you post.            [139/200]
```

## Structure of a first message

Wait a day after they accept. Then:

1. **Personal hook** (1 line): why *this person*; if there was a note, pick up the same thread (continuity is the reason the note was concrete).
2. **Who you are + fit** (1-2 lines): role + the achievement most relevant to them. Give something before asking: a data point, an idea about their product, a useful link.
3. **Soft CTA** (1 line): 15 min to chat? / open to an intro? / I applied, happy to give context. A single, small ask. **No calendar link in the first message**: it reads like a funnel.

## Post-application follow-up sequence

- **Day 0** - application sent (+ a message to the recruiter/hiring manager if you have the contact).
- **Day 4-5** - follow-up 1: reaffirm interest + add *something new* (a relevant project, an idea about their product). Not "any news?".
- **Day 10-12** - follow-up 2 (last): brief, professional, leave the door open. If there is no reply, you close the loop with dignity.

Every follow-up must have **its own hook** and stand on its own, without depending on the earlier ones. If you have nothing new to say, there is no follow-up. Never "just wanted to follow up". After the second one, stop: a third one does not convert and burns the relationship.

## Never

- Automate invitations or messages, not even with third-party tools: the User Agreement (section 8.2) forbids bots and automated methods to add contacts or send messages, and LinkedIn restricts the accounts that do it. LinkedIn also limits how many invitations you can send: few and targeted.
- Make up a mutual connection, a shared school or having read something the user did not read.
- Open with "I hope this message finds you well" or its equivalent in any language.

Every message goes through `/content-humanizer` (`.claude/skills/content-humanizer/scripts/humanize.py` + `detect.py` in the same folder) before it is shown. Invitation note, first message and follow-ups adapted from Jake Schincariol's linkedin-agent-skill (MIT).

## Process

1. Read the note in `05-Contacts/` (or create it) and the one in `04-Companies/`.
2. Research the person (role, team, something recent) - WebFetch the public profile if there is a URL.
3. Choose variant + channel.
4. Draft the message + 1 alternative opening.
5. Record it in `05-Contacts/` (interaction history) and plan the follow-up.

> Note: Claude does not access your LinkedIn or send messages - it drafts so you copy/paste and record the interaction.

## Language

Mirror the language of the person/company. English by default for international roles.

See `references/recruiter-playbook.md` for templates per situation and the psychology of why people reply.

## Handoff

Ask for approval before writing to `05-Contacts/`. When the message is READY to copy/paste and the follow-up is scheduled, prepare the conversation with `/interview-prep` if there is a reply.
