# API Versioning — Anti-patterns & Checklist

## Anti-patterns

- Breaking change without a new version
- Keeping v1/v2/v3/v4 alive (backport hell) — max 2
- Version in the JSON body (breaks routing/caching)
- No Deprecation/Sunset headers
- Versioning internals (auth, healthchecks, outgoing webhooks)
- Bumping the major for a non-breaking change (inflation)
- Not monitoring v1 usage -> you shut it down blind
- A single doc for every version
- No changelog

## Checklist (introducing v2)

- [ ] Confirm it really is breaking (see Breaking vs Non-breaking in SKILL.md)
- [ ] Can it be solved with an optional field or a new endpoint in v1?
- [ ] Parallel `/v2/`, reuse domain/service, duplicate handlers+DTOs
- [ ] Separate OpenAPI spec for v2
- [ ] v1 sunset defined (min 6m, 12m if mobile)
- [ ] Deprecation+Sunset+Link headers on v1
- [ ] Logging of v1 hits + v1 vs v2 usage dashboard
- [ ] Migration guide published before the announcement
- [ ] v1 contract tests pass until the sunset
- [ ] Mobile: raise the min in /minimum-version before the sunset
- [ ] Rollback plan if v2 blows up
