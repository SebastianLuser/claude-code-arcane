# Testing Anti-Patterns

| Anti-Pattern | Problem | Do Instead |
|---|---|---|
| Testing implementation details | Breaks on refactor, passes on bugs | Test user actions and visible outcomes |
| Snapshot overuse | Noise; reviewers rubber-stamp diffs | Assert structure explicitly; snapshot only small serializable config |
| Flaky selectors (`div > span:nth-child(3)`) | Breaks on markup change | `getByRole`, `getByLabelText`, `data-testid` as last resort |
| `waitFor` without assertion | Hides timing bugs | Always assert inside `waitFor` callback |
| Shared mutable state | Order-dependent failures | Reset stores, QueryClient, MSW in `beforeEach` |
| Mocking third-party internals | Couples to library impl | Mock at the boundary (API layer) |
| 100% coverage target | Incentivizes testing trivial code | Use per-category thresholds (below) |
