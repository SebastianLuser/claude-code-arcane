# Review Gates

## Phase 4b: QA Coverage Gate

Solo/lean → skip. Full → spawn `qa-lead` gate QL-TEST-COVERAGE with story file, test paths, QA test cases, ACs. Verdict: ADEQUATE → proceed; GAPS → ADVISORY; INADEQUATE → BLOCKING. Skip for Config/Data.

## Phase 5: Code Review Gate

Solo/lean → skip. Full → spawn `lead-programmer` gate LP-CODE-REVIEW. Pass implementation files, story, GDD section, ADR. CONCERNS → AskUserQuestion (Revise/Accept/Discuss). REJECT → must resolve. No implementation files → skip.
