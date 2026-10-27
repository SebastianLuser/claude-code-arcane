# Rollback Anti-patterns

- `:latest` in prod — rollback impossible
- Breaking schema + breaking code in the same release
- Never testing the rollback — you find out it does not work when you need it
- DB restore without a prior drill
- Rollback without a post-mortem
- "Undo the merge in git" with no real redeploy plan
- Flag without a server-side kill switch
- No runbook — nobody knows the commands at 3am
- Not invalidating cache/CDN
- Not retaining old images (10 minimum)
- Rollback workflow without an approval gate
- Ignoring mobile in the strategy
