# Test Helper Patterns

| Helper | Purpose | Key Rule |
|---|---|---|
| Custom render wrapper | Wraps `render()` with all providers (Router, QueryClient, Theme) | Every integration test uses this, never raw `render` |
| Factories | Return valid domain objects with defaults + overrides | Prevents brittle tests when types gain required fields |
| MSW handlers | Centralized API mocks in `tests/mocks/handlers.ts` | Never mock `fetch` directly; override per-test for errors |
| Test QueryClient | Fresh `QueryClient` per test, `retry: false`, short `gcTime` | Shared clients leak state between tests |
| Fixtures | Reusable JSON payloads in `tests/fixtures/` | Single source of truth for API response shapes |
