# Skill Test Spec: /test-setup

## Skill Summary

`/test-setup` scaffolds the test framework for the project based on the
configured engine. It creates the `tests/` directory structure defined in
`coding-standards.md` (unit/, integration/, performance/, playtest/) and
generates the appropriate test runner configuration for the detected engine:
Unity Test Framework asmdef for Unity, or Unreal headless runner for Unreal Engine.

Each file or directory created is gated behind a "May I write" ask. If the test
framework already exists, the skill verifies the configuration rather than
reinitializing. No director gates apply. The verdict is COMPLETE when the
scaffold is in place.

---

## Static Assertions (Structural)

Verified automatically by `/skill-test static` — no fixture needed.

- [ ] Has required frontmatter fields: `name`, `description`, `argument-hint`, `user-invocable`, `allowed-tools`
- [ ] Has ≥2 phase headings
- [ ] Contains verdict keyword: COMPLETE
- [ ] Contains "May I write" collaborative protocol language before creating files
- [ ] Has a next-step handoff (e.g., `/test-helpers` to generate helper utilities)

---

## Director Gate Checks

None. `/test-setup` is a scaffolding utility. No director gates apply.

---

## Test Cases

### Case 1: Unity Project — Scaffolds Unity Test Framework with asmdef

**Fixture:**
- `technical-preferences.md` has engine set to Unity, language C#
- `tests/` directory does not exist

**Input:** `/test-setup`

**Expected behavior:**
1. Skill reads engine → Unity + C#
2. Skill creates `Tests/` directory with Unity conventions (capitalized)
3. Skill generates `Tests/Tests.asmdef` and `Tests/Editor/EditorTests.asmdef`
4. EditMode and PlayMode test runner modes are configured
5. Skill asks "May I write the Tests/ directory structure?"
6. Verdict is COMPLETE

**Assertions:**
- [ ] Unity-specific `Tests/` structure is created
- [ ] `.asmdef` files are generated
- [ ] EditMode and PlayMode runner config is present
- [ ] Verdict is COMPLETE

---

### Case 2: Test Framework Already Exists — Verifies config, not re-initialized

**Fixture:**
- `tests/unit/`, `tests/integration/` exist
- Unity Test Framework runner configured (Unity project)

**Input:** `/test-setup`

**Expected behavior:**
1. Skill detects existing tests/ structure
2. Skill reports: "Test framework already exists — verifying configuration"
3. Skill checks: runner script path, directory completeness, CI command alignment
4. If all checks pass: reports "Configuration verified — no changes needed"
5. If checks fail (e.g., missing tests/performance/): reports specific gap and
   asks "May I add the missing directories?"

**Assertions:**
- [ ] Skill does NOT reinitialize when framework exists
- [ ] Verification checks are performed on existing structure
- [ ] Only missing parts trigger a "May I write" ask
- [ ] Verdict is COMPLETE whether everything was OK or gaps were fixed

---

### Case 3: No Engine Configured — Redirects to /setup-engine

**Fixture:**
- `technical-preferences.md` contains only placeholders (engine not set)

**Input:** `/test-setup`

**Expected behavior:**
1. Skill reads `technical-preferences.md` and finds engine placeholder
2. Skill reports: "Engine not configured — cannot scaffold engine-specific test framework"
3. Skill suggests running `/setup-engine` first
4. No directories or files are created

**Assertions:**
- [ ] Error message explicitly states engine is not configured
- [ ] `/setup-engine` is suggested as the next step
- [ ] No write tool is called
- [ ] Verdict is not COMPLETE (blocked state)

---

### Case 4: Director Gate Check — No gate; test-setup is a scaffolding utility

**Fixture:**
- Engine configured, tests/ does not exist

**Input:** `/test-setup`

**Expected behavior:**
1. Skill scaffolds and writes all test framework files
2. No director agents are spawned
3. No gate IDs appear in output

**Assertions:**
- [ ] No director gate is invoked
- [ ] No gate skip messages appear
- [ ] Verdict is COMPLETE without any gate check

---

## Protocol Compliance

- [ ] Reads engine from `technical-preferences.md` before generating any scaffold
- [ ] Generates engine-appropriate test runner config (not generic)
- [ ] Creates all 4 subdirectories from coding-standards.md
- [ ] Asks "May I write" before creating files
- [ ] Detects existing framework and offers verification (not reinitialization)
- [ ] Verdict is COMPLETE when scaffold is in place

---

## Coverage Notes

- Unreal Engine test scaffolding (headless runner with `-nullrhi`) follows the
  same pattern as Cases 1 and 2 and is not separately fixture-tested.
- CI integration file generation (e.g., `.github/workflows/test.yml`) is
  referenced but not assertion-tested here — it may be a separate skill concern.
- The case where tests/ exists but is from a different engine (e.g., tests
  in a different engine's format) is not tested; the skill would detect the mismatch
  and offer to reconcile.
