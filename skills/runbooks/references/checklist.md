# Runbook Checklist

- [ ] Alert name in the H1 matches Alertmanager
- [ ] All 10 sections present, in order
- [ ] Copy-pasteable commands (project, region, service hardcoded)
- [ ] Numeric decision criteria
- [ ] Escalation path with names + channels + times
- [ ] Dashboard links work
- [ ] Rollback plan distinct from the fix
- [ ] Frontmatter: owner, service, last_reviewed
- [ ] Alertmanager has `runbook_url`
- [ ] In the on-call team's language, no unexplained jargon
- [ ] Validated in a drill or by someone who did not write it
- [ ] Every step that changes something has an expected result and what to do if it is not met
- [ ] Final verification with the same signals that fired the alert
- [ ] Frontmatter with `last_tested` and how it was tested
