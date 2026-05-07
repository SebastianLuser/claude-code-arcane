---
name: skill-auditor
description: "Audit, grade, and auto-fix skills for frontmatter compliance, lazy-loading weight, and quality standards. Modes: scan (diagnostic), fix (single), batch-fix (mass)."
category: "arcane"
argument-hint: "scan <dir> | fix <path> | batch-fix <dir>"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---
# /skill-auditor -- Audit & Fix Skills

Scan skills for compliance with Arcane standards, grade them A-F, and auto-fix issues.

## Modes

| Command | What it does |
|---------|-------------|
| `/skill-auditor scan <dir>` | Diagnostic report for every SKILL.md under `<dir>` |
| `/skill-auditor fix <path>` | Auto-fix a single SKILL.md (frontmatter, weight, structure) |
| `/skill-auditor batch-fix <dir>` | Run fix on all skills under `<dir>`, show progress + summary |

If no argument is given, default to `scan .claude/` (all skills).

---

## Phase 1: Scan (diagnostic)

For each SKILL.md found under the target directory:

### 1.1 Read frontmatter

Parse the YAML block between `---` markers. Check against our spec (see `references/frontmatter-spec.md`):

| Field | Required | Check |
|-------|----------|-------|
| `name` | yes | present, kebab-case, matches directory name |
| `description` | yes | present, 1-2 sentences, under 200 chars |
| `category` | yes | present, matches parent `skills-<category>` folder |
| `user-invocable` | yes | present, boolean |
| `allowed-tools` | yes | present, comma-separated list of valid tool names |

Flag **alirezarezvani format** if frontmatter contains `license`, `metadata`, `version`, `author`, or `updated` fields -- these need conversion.

### 1.2 Measure weight

Count total lines in SKILL.md. Apply thresholds:

| Lines | Verdict |
|-------|---------|
| <= 200 | OK -- fits Layer 2 budget |
| 201-400 | WARN -- should extract heavy sections to `references/` |
| 400+ | FAIL -- mandatory extraction needed |

### 1.3 Check structure quality

Scan the body for required elements:

- **Sections**: At least 2 phase headings (`## Phase`, `## Step`, `## Workflow`, or `###` subsections)
- **Verdict keywords**: For review/analysis skills: APPROVED, PASS, FAIL, NEEDS REVISION (or equivalent)
- **Collaborative protocol**: For file-modifying skills (Write/Edit in allowed-tools): must contain "May I write" or equivalent approval gate
- **Next-step handoff**: Last section should guide what to do after the skill completes

### 1.4 Detect hallucinations

Search for red flags:

- References to files that do not exist (Glob to verify any path mentioned in backticks)
- References to tools not in the Claude Code toolset (e.g., `RunCode`, `Execute`, `Search`)
- Installation instructions for non-existent CLIs (`clawhub`, `plugin marketplace`)
- Platform tables claiming support for platforms other than Claude Code

### 1.5 Grade

Compute grade from checks:

| Grade | Criteria |
|-------|----------|
| **A** | All 5 frontmatter fields correct, <= 200 lines, 2+ sections, no hallucinations |
| **B** | Frontmatter complete but minor issues (description too long, missing handoff) |
| **C** | Frontmatter incomplete (1-2 missing fields) OR 201-400 lines |
| **D** | Frontmatter uses alirezarezvani format OR 400+ lines OR hallucinations found |
| **F** | No frontmatter at all OR file is empty/broken |

### 1.6 Output report

Print a summary table with: total scanned, grade distribution (A/B/C/D/F with counts and skill names), and top issues ranked by frequency. Format as a fixed-width text table for readability.

---

## Phase 2: Fix (single skill)

Given a path to a SKILL.md, apply fixes in order:

### 2.1 Convert frontmatter

If alirezarezvani format detected (has `license`, `metadata`, `version`, `author`):

1. Keep `name` and `description` (trim description to under 200 chars if needed)
2. Drop `license`, `metadata` block, `version`, `author`, `updated`, `python-tools`, `tech-stack`
3. Add `category` -- infer from parent folder: `skills-backend` -> `"backend"`, `skills-ai` -> `"ai"`, etc.
4. Add `user-invocable: true` (default; set `false` only for sub-skills under another skill's directory)
5. Add `allowed-tools: Read, Glob, Grep, Bash` (default read-only set; upgrade to include `Write, Edit` if skill body contains authoring/generation instructions)

If our format but missing fields, add the missing ones using the same inference rules.

### 2.2 Trim description

If description is just the skill name repeated ("MCP Server Builder"), expand it to a useful 1-2 sentence summary by reading the first `## Overview` or `## ` section from the body.

### 2.3 Extract heavy content

If SKILL.md exceeds 200 lines:

1. Create `references/` subdirectory next to SKILL.md if it does not exist
2. Identify extractable sections: tables over 50 lines, reference documentation, template blocks, troubleshooting guides, code examples over 30 lines
3. Move each to `references/<section-name>.md`
4. Replace extracted content with a one-line pointer: `> See references/<section-name>.md for details.`
5. Verify SKILL.md is now under 200 lines

### 2.4 Clean hallucinations

- Remove or comment out `## Installation` sections that reference non-existent package managers
- Remove `## Platform Support` tables claiming multi-platform support (Claude Code only)
- Flag (do not auto-remove) file path references that cannot be verified -- add `<!-- AUDIT: verify this path -->` comment

### 2.5 Normalize structure

- Ensure there is an H1 heading matching the skill name
- Ensure at least 2 `##` sections exist
- If the skill modifies files (Write/Edit in allowed-tools) and lacks a collaborative gate, append a `## Safety` section with: "Before writing any file, confirm with the user: 'May I write this to [path]?'"

### 2.6 Report changes

Print the file path, each fix applied as a `[fix]` line item, and the grade change (e.g., `Grade: D -> B`).

**Always ask "May I write these changes?" before modifying any file.**

---

## Phase 3: Batch Fix

Given a directory path:

1. Glob for all `SKILL.md` files under the directory
2. Run Phase 1 scan on all of them first (full diagnostic)
3. Show the report and ask: "Fix all D and F graded skills? (yes/no/pick)"
   - `yes` -- fix all D and F skills
   - `no` -- stop, report only
   - `pick` -- let user select which to fix
4. For each skill to fix, run Phase 2
5. After all fixes, re-scan and show before/after grade comparison (e.g., `A: 12 -> 18`) and list remaining issues that need manual review

---

## Reference Material

Detailed specifications are in `references/`:

- `references/frontmatter-spec.md` -- Full frontmatter field specification
- `references/lazy-loading-guide.md` -- MiniMax 3-Layer model rules and thresholds
