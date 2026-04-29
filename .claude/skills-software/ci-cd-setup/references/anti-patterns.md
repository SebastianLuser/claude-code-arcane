# Anti-Patterns

- Unpinned actions (`@master`); `npm install` instead of `npm ci`
- Test after build — flip order (test is cheap, build is expensive)
- Single monolithic job — loses parallelism
- No concurrency group — duplicate runs waste minutes
- Prod deploy without gate/tag; `:latest` without semver tag
- No caching; all tests on every PR in monorepo
- Secrets in workflow env block of public repo
- No rollback plan
