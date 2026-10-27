# Anti-patterns

- Analyzing balance without reading the data files (opinion instead of data)
- Changing values without re-verifying the impact on other systems
- Playtest reports without severity on pain points — everything looks equally urgent
- Not comparing findings against the GDD's intent — "it works badly" without defining what "good" was
- Ignoring "what works" — reporting only problems

# Checklist

```markdown
### Balance
- [ ] Domain identified, data files read
- [ ] System GDD read (baseline for "correct")
- [ ] Outliers with expected vs actual range
- [ ] Degenerate strategies identified
- [ ] Prioritized recommendations with a concrete fix

### Playtest
- [ ] Complete session info (build, duration, tester)
- [ ] Pain points with severity
- [ ] Findings categorized (design/balance/bug/polish)
- [ ] Top 3 priorities defined
- [ ] Compared against the GDD's intent
```
