# Cross-Reference Criteria

## A. Contradictions (CRITICAL)
- **Doc vs Doc**: Compare GDD sections against spec docs. Flag where they describe the same mechanic differently (formulas, values, flow, terminology).
- **Doc vs Code**: Compare documented vs implemented behavior. Flag where the code does something different from what the docs say.
- **Internal contradictions**: Flag where the SAME document says two different things about the same mechanic.

For each contradiction:
```
| Aspect | Source A says | Source B says | Severity | Recommendation |
```

## B. Gaps and missing content (HIGH)
- Sections with [TBD], empty or placeholder
- Mechanics referenced but never defined
- Systems that depend on decisions not yet made (blocking dependencies)
- Missing formulas, values or balance numbers
- Items/enemies/bosses listed without concrete stats

Classify each gap:
- **Blocking**: Cannot be implemented without this decision
- **Important**: Must be defined before the vertical slice / current milestone
- **Nice to have**: Can wait

## C. Coherence and logic (MEDIUM)
- Does the system make logical sense? (a mechanic that contradicts the game's pillars)
- Edge cases not covered? ("what happens when X, Y and Z happen at the same time?")
- Do the formulas produce reasonable values? Run mental math with example scenarios
- Consistent terminology? (the same concept with different names in different places)
- Do the difficulty curves make sense?

## D. Balance Red Flags (MEDIUM)
- Dominant strategies without counterplay
- Useless options that are strictly worse than the alternatives
- Snowball / death spiral mechanics
- Broken economy (items too cheap/expensive relative to income)
- Damage/HP ratios that make fights too fast or too slow

## E. Completeness for the current milestone (HIGH)
- Does the milestone/prototype scope list everything needed?
- Are all in-scope systems defined in the doc?
- Are there hidden dependencies (System A needs System B, which is not in scope)?
