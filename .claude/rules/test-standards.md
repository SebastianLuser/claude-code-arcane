---
paths:
  - "tests/**"
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/*_test.go"
  - "**/test_*.py"
---

# Test Standards

- Test naming: `test_[system]_[scenario]_[expected_result]` (or framework idiom: `should [behavior] when [condition]`)
- Every test must have a clear Arrange / Act / Assert structure
- Unit tests must not depend on external state (filesystem, network, database, clock, randomness)
- Integration tests must clean up after themselves — transactional rollback or explicit teardown
- Performance tests must specify acceptable thresholds (p95 latency, throughput) and fail if exceeded
- Test data must be defined in the test or in dedicated fixtures — never shared mutable state
- Mock external dependencies (network, DB, third-party APIs) — tests must be fast and deterministic
- Every bug fix must ship with a regression test that would have caught the original bug
- No skipping/disabling tests to make CI green — fix the root cause

## Examples

**Correct** (proper naming + AAA + isolation):

```typescript
it("should reduce health by damage amount when take_damage is called", () => {
  // Arrange
  const health = new HealthComponent({ maxHealth: 100, current: 100 });

  // Act
  health.takeDamage(25);

  // Assert
  expect(health.current).toBe(75);
});
```

**Incorrect**:

```typescript
it("test1", () => {                       // VIOLATION: no descriptive name
  const h = new HealthComponent();
  h.takeDamage(25);                        // VIOLATION: no arrange step
  expect(h.current).toBeLessThan(100);     // VIOLATION: imprecise assertion
});
```

## Anti-Patterns

- Assertions that only check "not null" / "truthy" when exact value is knowable
- Tests that pass only because of execution order (order-dependent)
- Tests with `sleep()` / arbitrary timeouts — prefer deterministic signals
- Snapshot tests for rapidly-changing UI without visual review
- Mocking the system under test
