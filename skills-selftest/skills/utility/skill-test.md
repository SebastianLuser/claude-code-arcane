# Skill Test Spec: /skill-test

## Skill Summary

`/skill-test` validates skill files for structural correctness, behavioral
compliance, and category-rubric scoring. It operates in three modes:

- **static**: Checks a single skill file for structural requirements
  (frontmatter fields, sections, verdict values, next-step handoff, fork
  complexity, argument hint) without needing a fixture. Produces a per-check PASS/FAIL
  table.
- **spec**: Reads a test spec file from `tests/skills/` and evaluates the skill
  against each test case assertion, producing a case-by-case verdict.
- **audit**: Produces a coverage table of all skills in `skills/` and
  all agents in `agents/`, showing which have spec files and which do not.

An additional **category** mode reads the quality rubric for a skill category
(e.g., gate skills) and scores the skill against rubric criteria. The verdict
system differs by mode.

---

## Static Assertions (Structural)

Verified automatically by `/skill-test static` — no fixture needed.

- [ ] Has required frontmatter fields: `name`, `description`, `argument-hint`, `user-invocable`, `allowed-tools`
- [ ] Has ≥2 phase headings
- [ ] Contains verdicts: COMPLIANT, NON-COMPLIANT, WARNINGS (static mode); PASS, FAIL, PARTIAL (spec mode); COMPLETE (audit mode)
- [ ] Does NOT contain "May I write" language (skill is read-only in all modes)
- [ ] Has a next-step handoff (e.g., `/skill-improve` to fix issues found)

---

## Director Gate Checks

None. `/skill-test` is a meta-utility skill. No director gates apply.

---

## Test Cases

### Case 1: Static Mode — Well-formed skill, all 6 checks pass, COMPLIANT

**Fixture:**
- `skills/brainstorm/SKILL.md` exists and is well-formed:
  - Has all required frontmatter fields
  - Has ≥2 phase headings
  - Has verdict keywords
  - Has a next-step handoff
  - Documents director gates
  - Documents gate mode behavior (lean/solo skips)

**Input:** `/skill-test static brainstorm`

**Expected behavior:**
1. Skill reads `skills/brainstorm/SKILL.md`
2. Skill runs all 6 structural checks
3. All 6 checks pass
4. Skill outputs a PASS/FAIL table with all 6 checks marked PASS
5. Verdict is COMPLIANT

**Assertions:**
- [ ] Exactly 6 structural checks are reported
- [ ] All 6 are marked PASS
- [ ] Verdict is COMPLIANT
- [ ] No files are written

---

### Case 2: Static Mode — Skill With Write Tool and No "May I Write" Is Not Penalized

**Fixture:**
- `skills/some-skill/SKILL.md` has `Write` in `allowed-tools` frontmatter
- The skill body has no "May I write" or "May I update" language
- Every other check passes

**Input:** `/skill-test static some-skill`

**Expected behavior:**
1. Skill reads `some-skill/SKILL.md`
2. No check looks for ask-before-write language: whether Claude asks before
   writing is set by the session's permission mode, not by the skill
3. Verdict is COMPLIANT

**Assertions:**
- [ ] No FAIL or WARN mentions "May I write" or an approval gate
- [ ] Verdict is COMPLIANT
- [ ] All 6 checks are shown

---

### Case 3: Spec Mode — gate-check Skill Evaluated Against Spec

**Fixture:**
- `tests/skills/gate-check.md` exists with 5 test cases
- `skills/gate-check/SKILL.md` exists

**Input:** `/skill-test spec gate-check`

**Expected behavior:**
1. Skill reads both the skill file and the spec file
2. Skill evaluates each of the 5 test case assertions against the skill's behavior
3. For each case: PASS if skill behavior matches spec assertions, FAIL if not
4. Skill produces a case-by-case result table
5. Overall verdict: PASS (all 5), PARTIAL (some), or FAIL (majority failing)

**Assertions:**
- [ ] All 5 test cases from the spec are evaluated
- [ ] Each case has an individual PASS/FAIL result
- [ ] Overall verdict is PASS, PARTIAL, or FAIL based on case results
- [ ] No files are written

---

### Case 4: Audit Mode — Coverage Table of All Skills and Agents

**Fixture:**
- `skills/` contains 72+ skill directories
- `agents/` contains 49+ agent files
- `tests/skills/` contains spec files for a subset of skills

**Input:** `/skill-test audit`

**Expected behavior:**
1. Skill enumerates all skills in `skills/` and all agents in `agents/`
2. Skill checks `tests/skills/` for a corresponding spec file for each
3. Skill produces a coverage table:
   - Each skill/agent listed
   - "Has Spec" column: YES or NO
   - Summary: "X of Y skills have specs; A of B agents have specs"
4. Verdict is COMPLETE

**Assertions:**
- [ ] All skill directories are enumerated (not just a sample)
- [ ] "Has Spec" column is accurate for each entry
- [ ] Summary counts are correct
- [ ] Verdict is COMPLETE

---

### Case 5: Category Mode — Gate Skill Evaluated Against Quality Rubric

**Fixture:**
- `tests/skills/quality-rubric.md` exists with a "Gate Skills" section defining
  criteria G1-G5 (e.g., G1: has mode guard, G2: has verdict table, etc.)
- `skills/gate-check/SKILL.md` is a gate skill

**Input:** `/skill-test category gate-check`

**Expected behavior:**
1. Skill reads `quality-rubric.md` and identifies the Gate Skills section
2. Skill evaluates `gate-check/SKILL.md` against criteria G1-G5
3. Each criterion is scored: PASS, PARTIAL, or FAIL
4. Overall category score is computed (e.g., 4/5 criteria pass)
5. Verdict is COMPLIANT (all pass), WARNINGS (some partial), or NON-COMPLIANT (failures)

**Assertions:**
- [ ] All gate criteria (G1-G5) from quality-rubric.md are evaluated
- [ ] Each criterion has an individual score
- [ ] Overall verdict reflects the score distribution
- [ ] No files are written

---

## Protocol Compliance

- [ ] Static mode checks exactly 6 structural assertions
- [ ] Spec mode evaluates each test case from the spec file individually
- [ ] Audit mode covers all skills AND agents (not just one category)
- [ ] Category mode reads quality-rubric.md to get criteria (not hardcoded)
- [ ] Does not write any files in any mode
- [ ] Suggests `/skill-improve` as the next step when issues are found

---

## Coverage Notes

- The skill-test skill is self-referential (it can test itself). The static
  mode case for skill-test's own SKILL.md is not separately fixture-tested to
  avoid infinite recursion in test design.
- The 6 structural checks are defined in `references/static-checks.md`; checks 1-3
  are also enforced by `skill-static.test.ts`. Case 2 pins that the removed
  ask-before-write check stays removed.
- Audit mode counts are approximate — the exact number of skills and agents will
  change as the system grows; assertions use "all" rather than fixed counts.
