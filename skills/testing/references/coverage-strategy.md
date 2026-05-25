# Coverage Strategy

| Category | Threshold | Rationale |
|---|---|---|
| Utils / pure logic | 90%+ | High value, easy to test |
| State management | 80%+ | Core app behavior |
| API client layer | 80%+ | Error handling matters |
| UI components | 60-70% | Diminishing returns on presentational code |
| E2E critical paths | Count journeys | Track covered user journeys, not line % |

Measure **branch coverage**, not just lines. Enforce via `coverage.thresholds` on changed files only.
