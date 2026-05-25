# Spec Mode — Behavioral Testing Procedure

1. Locate skill at `.claude/skills/[name]/SKILL.md` + spec path from `CCGS Skill Testing Framework/catalog.yaml`
2. Read both files completely
3. For each test case: read fixture, expected behavior, assertions. Mark each PASS / PARTIAL / FAIL via reasoning evaluation
4. Protocol compliance: "May I write" before writes, findings before approval, next-step handoff, no auto-create files
5. Output report with per-case verdicts + protocol compliance + overall verdict
6. Offer to write results to `CCGS Skill Testing Framework/results/` and update catalog.yaml (`last_spec`, `last_spec_result`)
