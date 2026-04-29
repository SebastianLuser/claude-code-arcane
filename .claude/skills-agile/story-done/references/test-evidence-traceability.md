# Test Evidence & Traceability

## Test-Criterion Traceability

Map each AC to covering test (unit/integration/manual). Table: Criterion | Test | Status (COVERED/UNTESTED). Escalation: >50% UNTESTED → BLOCKING; <=50% → ADVISORY (add to Completion Notes).

## Test Evidence by Story Type

| Type | Required Evidence | Gate |
|------|-------------------|------|
| Logic | Unit test in `tests/unit/[system]/` — must exist and pass | BLOCKING |
| Integration | Integration test or playtest doc | BLOCKING |
| Visual/Feel | Screenshot + sign-off in `production/qa/evidence/` | ADVISORY |
| UI | Walkthrough doc or interaction test | ADVISORY |
| Config/Data | Smoke check pass in `production/qa/smoke-*.md` | ADVISORY |

Check exact path from story's Test Evidence section first, then broad search. No type set → ADVISORY warning.
