# Tech Debt Scan Indicators & Categories

## Debt Indicators

Search the codebase for:

- `TODO` comments (count and categorize)
- `FIXME` comments (these are bugs disguised as debt)
- `HACK` comments (workarounds that need proper solutions)
- `@deprecated` markers
- Duplicated code blocks (similar patterns in multiple files)
- Files over 500 lines (potential god objects)
- Functions over 50 lines (potential complexity)

## Debt Categories

- **Architecture Debt**: Wrong abstractions, missing patterns, coupling issues
- **Code Quality Debt**: Duplication, complexity, naming, missing types
- **Test Debt**: Missing tests, flaky tests, untested edge cases
- **Documentation Debt**: Missing docs, outdated docs, undocumented APIs
- **Dependency Debt**: Outdated packages, deprecated APIs, version conflicts
- **Performance Debt**: Known slow paths, unoptimized queries, memory issues
