---
name: brain-dump
description: "Frictionless capture into the day's dump in the Obsidian vault: tasks, ideas, links, transcripts. No tags, no deciding where it goes. Triggers: jot this down, capture, brain dump, throw this in the vault, note this, add to inbox, today's dump."
argument-hint: "[text to capture]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Write, Edit
---

# Brain Dump - Frictionless capture

You append what the user gives you to the day's dump and stay quiet. This skill exists so that capturing costs nothing: the moment the user has to think "where does this go?", the system has already failed.

Content to capture: `$ARGUMENTS`

The `vault-conventions` rule applies.

**Paths by role:** the destination is named by role (`inbox`, `templates`), and the real path comes from the `## Paths` section of the vault's `CLAUDE.md`. The defaults in parentheses only apply if the vault does not declare otherwise.

## Steps

1. **Locate the vault.** Flag `--vault <path>`, env `OBSIDIAN_VAULT`, or the current directory if it contains `.obsidian/`. If there is no vault, say so in one line and offer `/second-brain setup`. Do not invent a folder.

2. **Resolve the `inbox` role.** Read the `## Paths` section of the vault's `CLAUDE.md`. It is the only part of the contract you need to read here, and it costs one read: writing to `_inbox/` when the vault uses another folder leaves the capture somewhere no review will look. If the vault has no `CLAUDE.md`, use the default and say so in the same confirmation line.

3. **Open today's dump.** `<inbox>/YYYY-MM-DD dump.md` (default `_inbox/`) with today's date. The dump is named `YYYY-MM-DD dump.md` and not `YYYY-MM-DD.md` on purpose: that day's daily is already called `YYYY-MM-DD.md`, and two files with the same name make `[[2026-07-28]]` resolve unpredictably across the whole vault. It is the collision the audit reports as `ambiguous_names`, and without the suffix it would happen every day. If the vault already has dumps with the old name, follow its convention and say so, instead of splitting the series in two.

   If it does not exist, create it from `<templates>/Dump.md` (default `Templates/`), or with the minimal frontmatter `created`, `type: dump`, `tags: []` if the template is missing.

4. **Append the content at the end**, one line per item, without reordering or rewriting what was already there:
   - What sounds like a task goes in as `- [ ] <text>`. What sounds like an idea, note or link goes in as `- <text>`.
   - Loose URLs are left raw, with the page title next to them only if the user gave it. Do not open the URL: that is `/vault-clip`.
   - The user's wording is preserved. You do not fix their spelling or register, you do not summarize, you do not translate.

5. **If `$ARGUMENTS` brought no content**, ask what to capture in a single line and wait. Do not open a questionnaire.

6. **Confirm in one line** what was added and to which file. Nothing more: the user is in the middle of something else.

## Approval

Invoking the skill is the approval to append to today's dump: asking for confirmation on every capture would defeat the point of the skill. The limits are strict for everything else instead: **ask for explicit approval before writing outside the `inbox` role**, before editing lines that were already in the dump, and before creating any note in the `atomic` or `hubs` roles. Classifying is the job of `/review-dump`, not this skill.

## Rules

- Do not classify, tag, link or create new notes. None of that happens at capture time.
- Do not judge the content or suggest improvements. It is a dump, not a draft.
- Never rewrite or reorder what was already in the file: append only.
- No long dashes in anything you add yourself.
- If the user captures something that is clearly a task for an existing project, **it still goes to the dump**. The review does the routing, so the user never has to decide in the moment.

## Handoff

Capture COMPLETE when the content is in the day's dump. In the evening, or whenever the user wants to close the day, the next step is `/review-dump` to classify everything captured and generate the daily.
