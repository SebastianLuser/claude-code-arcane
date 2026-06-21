# MiniMax 3-Layer Lazy Loading Model

Skills are loaded progressively to minimize token overhead per session. Every skill must be designed with this model in mind.

## The Three Layers

```
Layer 1: Frontmatter         ~150 bytes/skill    Every session
Layer 2: SKILL.md body        ~2-8 KB/skill      On invocation only
Layer 3: references/           Unbounded          When skill references them
```

### Layer 1 -- Frontmatter (always loaded)

The YAML frontmatter block (between `---` markers) is the only part loaded at session start. Claude Code reads all SKILL.md frontmatter blocks to build its skill registry.

**Budget**: ~7 KB total for 45 skills, ~25 KB for 150+ skills.

**Rules**:
- Keep frontmatter minimal: only the 5 required fields + optional `argument-hint`
- Never put instructions, examples, or documentation in frontmatter
- Description must be concise (under 200 chars) -- it is loaded every session

### Layer 2 -- SKILL.md body (loaded on invocation)

The full SKILL.md content (below the closing `---`) loads only when the user invokes the skill. This is the skill's main instruction set.

**Budget**: Under 200 lines (~8 KB) per skill.

**Rules**:
- Keep the actionable instructions in the SKILL.md body
- Structure with clear `##` phase/step headings
- If content exceeds 200 lines, extract to Layer 3
- Do NOT put reference tables, long code examples, or troubleshooting guides inline

### Layer 3 -- references/ and templates/ (loaded on demand)

Heavy reference material lives in subdirectories next to SKILL.md. The skill body points to them with relative references; Claude reads them only when the specific section is needed.

**Budget**: Unbounded -- these files only load when explicitly referenced.

**Rules**:
- Create a `references/` subdirectory for extracted reference material
- Create a `templates/` subdirectory for file templates the skill generates
- Use a one-line pointer in SKILL.md: `> See references/section-name.md for details.`
- Name files descriptively: `references/api-patterns.md`, `templates/dockerfile.md`

## When to Extract to Layer 3

Extract a section from SKILL.md to `references/` when:

| Condition | Action |
|-----------|--------|
| Section is over 50 lines | Extract to `references/<topic>.md` |
| Section is a lookup table | Extract to `references/<table-name>.md` |
| Section contains code templates | Extract to `templates/<template-name>.md` |
| Section is troubleshooting/FAQ | Extract to `references/troubleshooting.md` |
| Section is "how X works" background | Extract to `references/<concept>.md` |
| SKILL.md total exceeds 200 lines | Mandatory -- extract until under 200 |

## Extraction Procedure

1. Identify the section to extract (must be self-contained, not interleaved with instructions)
2. Create the target file: `references/<descriptive-name>.md`
3. Move the content verbatim (keep formatting, headings adjusted to start at `#`)
4. Replace the original section in SKILL.md with:

```markdown
### Section Title

> See `references/descriptive-name.md` for the full reference.
```

5. Verify SKILL.md is now under 200 lines
6. Verify the extracted file is readable standalone (has a title, makes sense without SKILL.md context)

## Directory Layout Example

```
skills-backend/api-design/
  SKILL.md                          # ~150 lines (Layer 2)
  references/
    api-style-decision-matrix.md    # 80 lines (Layer 3)
    rest-conventions.md             # 120 lines (Layer 3)
    error-format-rfc7807.md         # 45 lines (Layer 3)
  templates/
    openapi-skeleton.yaml           # Template file (Layer 3)
```

## Token Impact Summary

| Scenario | 45 skills | 150 skills | 300 skills |
|----------|-----------|------------|------------|
| Layer 1 only (session start) | ~7 KB | ~25 KB | ~50 KB |
| Layer 1 + one Layer 2 invocation | ~15 KB | ~33 KB | ~58 KB |
| Layer 1 + Layer 2 + Layer 3 refs | ~25 KB | ~43 KB | ~68 KB |

Keeping SKILL.md under 200 lines ensures that even with 300+ skills, a single invocation stays under 60 KB of context -- well within Claude's working memory.
