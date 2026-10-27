# Pre-deploy Checklist

- [ ] Artifact tagged by `$GIT_SHA`
- [ ] 10+ images retained in Artifact Registry
- [ ] Schema expand/contract separated from code
- [ ] N-1 compatibility window validated
- [ ] Rollback command written in the ticket/PR
- [ ] Feature flag with kill switch if user-facing
- [ ] Canary configured for risky changes
- [ ] Auto-rollback triggers defined
- [ ] rollback.yml workflow available and tested
- [ ] Runbook updated with the service's commands
- [ ] DB restore DR drill run last quarter
- [ ] On-call owner identified
- [ ] Communication plan ready
